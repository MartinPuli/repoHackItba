import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
  type VerifiedRegistrationResponse,
  type VerifiedAuthenticationResponse,
  type RegistrationResponseJSON,
  type AuthenticationResponseJSON,
  type AuthenticatorTransportFuture,
} from '@simplewebauthn/server';
import { supabaseAdmin } from '../config/supabase.js';
import { HttpError } from '../middlewares/httpError.js';

const RP_NAME = 'StrongBox';
const RP_ID = process.env.WEBAUTHN_RP_ID ?? 'localhost';
const ORIGIN = process.env.FRONTEND_ORIGIN ?? 'http://localhost:3000';

const challengeStore = new Map<string, string>();

function assertAdmin() {
  if (!supabaseAdmin) throw new HttpError(500, 'Supabase admin not configured');
  return supabaseAdmin;
}

export async function getRegistrationOptions(userId: string) {
  const admin = assertAdmin();

  const { data: existing } = await admin
    .from('user_authenticators')
    .select('credential_id')
    .eq('user_id', userId);

  const excludeCredentials = (existing ?? []).map((row) => ({
    id: row.credential_id,
    type: 'public-key' as const,
  }));

  const options = await generateRegistrationOptions({
    rpName: RP_NAME,
    rpID: RP_ID,
    userName: userId,
    attestationType: 'none',
    authenticatorSelection: {
      authenticatorAttachment: 'platform',
      userVerification: 'required',
      residentKey: 'preferred',
    },
    excludeCredentials,
  });

  challengeStore.set(userId, options.challenge);
  return options;
}

export async function verifyRegistration(userId: string, body: RegistrationResponseJSON) {
  const expectedChallenge = challengeStore.get(userId);
  if (!expectedChallenge) {
    throw new HttpError(400, 'No hay challenge pendiente. Reiniciá el registro.');
  }

  let verification: VerifiedRegistrationResponse;
  try {
    verification = await verifyRegistrationResponse({
      response: body,
      expectedChallenge,
      expectedOrigin: ORIGIN,
      expectedRPID: RP_ID,
    });
  } catch (err) {
    throw new HttpError(400, `Verificación fallida: ${(err as Error).message}`);
  }

  challengeStore.delete(userId);

  if (!verification.verified || !verification.registrationInfo) {
    throw new HttpError(400, 'Registro biométrico no verificado');
  }

  const { credential, credentialDeviceType } = verification.registrationInfo;

  const admin = assertAdmin();

  const { error } = await admin.from('user_authenticators').insert({
    user_id: userId,
    credential_id: credential.id,
    public_key: Buffer.from(credential.publicKey).toString('base64url'),
    counter: credential.counter,
    transports: body.response.transports ?? [],
  });

  if (error) throw new HttpError(500, error.message);

  return { verified: true, credentialDeviceType };
}

export async function getAuthenticationOptions(userId: string) {
  const admin = assertAdmin();

  const { data: creds } = await admin
    .from('user_authenticators')
    .select('credential_id, transports')
    .eq('user_id', userId);

  if (!creds || creds.length === 0) {
    throw new HttpError(404, 'No tenés credenciales biométricas registradas. Registrá primero.');
  }

  const allowCredentials = creds.map((c) => ({
    id: c.credential_id,
    type: 'public-key' as const,
    transports: (c.transports ?? []) as AuthenticatorTransportFuture[],
  }));

  const options = await generateAuthenticationOptions({
    rpID: RP_ID,
    allowCredentials,
    userVerification: 'required',
  });

  challengeStore.set(userId, options.challenge);
  return options;
}

export async function verifyAuthentication(userId: string, body: AuthenticationResponseJSON) {
  const expectedChallenge = challengeStore.get(userId);
  if (!expectedChallenge) throw new HttpError(400, 'No hay challenge pendiente.');

  const admin = assertAdmin();

  const { data: credRow } = await admin
    .from('user_authenticators')
    .select('*')
    .eq('user_id', userId)
    .eq('credential_id', body.id)
    .single();

  if (!credRow) throw new HttpError(400, 'Credencial no encontrada');

  let verification: VerifiedAuthenticationResponse;
  try {
    verification = await verifyAuthenticationResponse({
      response: body,
      expectedChallenge,
      expectedOrigin: ORIGIN,
      expectedRPID: RP_ID,
      credential: {
        id: credRow.credential_id,
        publicKey: new Uint8Array(Buffer.from(credRow.public_key, 'base64url')),
        counter: credRow.counter,
        transports: (credRow.transports ?? []) as AuthenticatorTransportFuture[],
      },
    });
  } catch (err) {
    throw new HttpError(400, `Autenticación fallida: ${(err as Error).message}`);
  }

  challengeStore.delete(userId);

  if (!verification.verified) {
    throw new HttpError(403, 'Verificación biométrica rechazada');
  }

  await admin
    .from('user_authenticators')
    .update({ counter: verification.authenticationInfo.newCounter })
    .eq('id', credRow.id);

  return { verified: true };
}

export async function hasRegisteredCredential(userId: string): Promise<boolean> {
  const admin = assertAdmin();
  const { count } = await admin
    .from('user_authenticators')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId);
  return (count ?? 0) > 0;
}
