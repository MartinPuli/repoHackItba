import { supabaseAdmin } from '../config/supabase.js';
import { HttpError } from '../middlewares/httpError.js';
import type { Database } from '../types/database.types.js';

type PersonInput = { wallet: string; email: string };

export type StrongboxSetupBody = {
  own_email: string;
  guardians: PersonInput[];
  heirs: PersonInput[];
};

function assertAdmin() {
  if (!supabaseAdmin) {
    throw new HttpError(500, 'Supabase admin client is not configured');
  }
  return supabaseAdmin;
}

function normalizeAddr(addr: string): string {
  return addr.trim().toLowerCase();
}

function assertEvmAddress(addr: string, label: string): string {
  const a = normalizeAddr(addr);
  if (!/^0x[a-fA-F0-9]{40}$/.test(a)) {
    throw new HttpError(400, `${label}: dirección EVM inválida`);
  }
  return a;
}

function assertEmail(email: string, label: string): string {
  const e = email.trim();
  if (e === '') {
    throw new HttpError(400, `${label}: email requerido`);
  }
  return e;
}

function assertTwoPeople(arr: PersonInput[], kind: 'guardians' | 'heirs'): void {
  if (!Array.isArray(arr) || arr.length !== 2) {
    throw new HttpError(400, `Se requieren exactamente 2 ${kind}`);
  }
}

export async function setupStrongbox(userId: string, body: StrongboxSetupBody): Promise<void> {
  const ownEmail = assertEmail(body.own_email, 'own_email');
  assertTwoPeople(body.guardians, 'guardians');
  assertTwoPeople(body.heirs, 'heirs');

  const g1 = {
    wallet: assertEvmAddress(body.guardians[0]!.wallet, 'guardians[0].wallet'),
    email: assertEmail(body.guardians[0]!.email, 'guardians[0].email'),
  };
  const g2 = {
    wallet: assertEvmAddress(body.guardians[1]!.wallet, 'guardians[1].wallet'),
    email: assertEmail(body.guardians[1]!.email, 'guardians[1].email'),
  };
  const h1 = {
    wallet: assertEvmAddress(body.heirs[0]!.wallet, 'heirs[0].wallet'),
    email: assertEmail(body.heirs[0]!.email, 'heirs[0].email'),
  };
  const h2 = {
    wallet: assertEvmAddress(body.heirs[1]!.wallet, 'heirs[1].wallet'),
    email: assertEmail(body.heirs[1]!.email, 'heirs[1].email'),
  };

  const addresses = [g1.wallet, g2.wallet, h1.wallet, h2.wallet];
  const set = new Set(addresses);
  if (set.size !== addresses.length) {
    throw new HttpError(400, 'Las cuatro wallets deben ser distintas entre sí');
  }

  const admin = assertAdmin();

  const { data: userRow, error: userErr } = await admin
    .from('users')
    .select('wallet_address')
    .eq('id', userId)
    .maybeSingle();
  if (userErr) {
    throw new HttpError(500, userErr.message, userErr.code);
  }
  const ownerWallet = userRow?.wallet_address?.toLowerCase();
  if (ownerWallet && addresses.some((a) => a === ownerWallet)) {
    throw new HttpError(400, 'Guardianes/herederos no pueden usar la wallet del titular');
  }

  const { data: existingCf, error: cfCheckErr } = await admin
    .from('caja_fuerte')
    .select('id')
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle();

  if (cfCheckErr) {
    throw new HttpError(500, cfCheckErr.message, cfCheckErr.code);
  }
  if (existingCf) {
    throw new HttpError(409, 'El usuario ya tiene una caja fuerte configurada');
  }

  const { error: userUpdateErr } = await admin
    .from('users')
    .update({ email: ownEmail })
    .eq('id', userId);
  if (userUpdateErr) {
    throw new HttpError(500, userUpdateErr.message, userUpdateErr.code);
  }

  const cajaInsert: Database['public']['Tables']['caja_fuerte']['Insert'] = {
    user_id: userId,
    is_deployed: false,
  };

  const { data: cajaRow, error: cajaErr } = await admin
    .from('caja_fuerte')
    .insert(cajaInsert)
    .select('id')
    .single();

  if (cajaErr || !cajaRow) {
    throw new HttpError(500, cajaErr?.message ?? 'Error insertando caja_fuerte', cajaErr?.code);
  }

  const cajaId = cajaRow.id;
  const rows: Database['public']['Tables']['herederos']['Insert'][] = [
    {
      caja_fuerte_id: cajaId,
      rol: 'guardian',
      slot: 1,
      address: g1.wallet,
      email: g1.email,
    },
    {
      caja_fuerte_id: cajaId,
      rol: 'guardian',
      slot: 2,
      address: g2.wallet,
      email: g2.email,
    },
    {
      caja_fuerte_id: cajaId,
      rol: 'heir',
      slot: 1,
      address: h1.wallet,
      email: h1.email,
    },
    {
      caja_fuerte_id: cajaId,
      rol: 'heir',
      slot: 2,
      address: h2.wallet,
      email: h2.email,
    },
  ];

  const { error: herErr } = await admin.from('herederos').insert(rows);
  if (herErr) {
    await admin.from('caja_fuerte').delete().eq('id', cajaId);
    throw new HttpError(500, herErr.message, herErr.code);
  }
}
