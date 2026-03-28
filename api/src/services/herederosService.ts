import { supabaseAdmin } from '../config/supabase.js';
import { HttpError } from '../middlewares/httpError.js';
import type { Database } from '../types/database.types.js';
import { getCajaFuerteRowForUser, resolveSmartWalletForUser } from './userContractsService.js';

type HerederoRow = Database['public']['Tables']['herederos']['Row'];

function assertAdmin() {
  if (!supabaseAdmin) {
    throw new HttpError(500, 'Supabase admin client is not configured');
  }
  return supabaseAdmin;
}

function isLikelyEthereumAddress(addr: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(addr.trim());
}

export interface HerederoInput {
  email: string;
  display_name?: string | null;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function createHerederosForUser(
  authUserId: string,
  inputs: HerederoInput[]
): Promise<{
  herederos: Array<{
    slot: number;
    email: string;
    address: string;
    display_name: string | null;
  }>;
  caja_fuerte_id: string;
  message: string;
}> {
  if (!Array.isArray(inputs) || inputs.length < 1 || inputs.length > 2) {
    throw new HttpError(400, 'Se requiere entre 1 y 2 entradas en herederos');
  }

  const admin = assertAdmin();

  const { data: requesterRow, error: reqErr } = await admin
    .from('users')
    .select('id, email, wallet_address')
    .eq('id', authUserId)
    .maybeSingle();

  if (reqErr) {
    throw new HttpError(500, reqErr.message, reqErr.code);
  }
  if (!requesterRow) {
    throw new HttpError(404, 'Perfil de usuario no encontrado');
  }

  const requesterEmail = requesterRow.email ? normalizeEmail(requesterRow.email) : null;
  const resolution = await resolveSmartWalletForUser(authUserId);
  const requesterPrimaryAddr =
    resolution.kind === 'wallets'
      ? resolution.row.contract_address.toLowerCase()
      : resolution.walletAddress.toLowerCase();

  const normalizedInputs = inputs.map((h) => ({
    email: normalizeEmail(h.email),
    display_name:
      typeof h.display_name === 'string' && h.display_name.trim() !== ''
        ? h.display_name.trim()
        : null,
  }));

  const emailSet = new Set(normalizedInputs.map((h) => h.email));
  if (emailSet.size !== normalizedInputs.length) {
    throw new HttpError(400, 'Emails de herederos duplicados');
  }

  for (const { email } of normalizedInputs) {
    if (requesterEmail && email === requesterEmail) {
      throw new HttpError(400, 'No podés designarte a vos mismo como heredero');
    }
  }

  const cajaRow = await getCajaFuerteRowForUser(authUserId);

  const resolved: Array<{
    slot: number;
    email: string;
    address: string;
    display_name: string | null;
  }> = [];

  for (let i = 0; i < normalizedInputs.length; i++) {
    const entry = normalizedInputs[i]!;
    const { email, display_name } = entry;
    const slot = i + 1;

    const { data: heirUser, error: heirErr } = await admin
      .from('users')
      .select('id, email, wallet_address')
      .ilike('email', email)
      .maybeSingle();

    if (heirErr) {
      throw new HttpError(500, heirErr.message, heirErr.code);
    }
    if (!heirUser?.wallet_address) {
      throw new HttpError(
        400,
        `El usuario con email ${email} no tiene cuenta o sin wallet_address. Debe registrarse primero.`
      );
    }
    if (!isLikelyEthereumAddress(heirUser.wallet_address)) {
      throw new HttpError(400, `wallet_address inválida para el usuario con email ${email}`);
    }

    const heirAddr = heirUser.wallet_address.trim();
    if (heirAddr.toLowerCase() === requesterPrimaryAddr) {
      throw new HttpError(400, 'La wallet del heredero no puede ser la misma que la tuya');
    }

    for (const already of resolved) {
      if (already.address.toLowerCase() === heirAddr.toLowerCase()) {
        throw new HttpError(400, 'No podés repetir la misma dirección como heredero');
      }
    }

    resolved.push({ slot, email: heirUser.email ?? email, address: heirAddr, display_name });

    const sharePct = normalizedInputs.length === 1 ? '100.00' : '50.00';
    const { error: upsertErr } = await admin.from('herederos').upsert(
      {
        caja_fuerte_id: cajaRow.id,
        slot,
        address: heirAddr,
        display_name,
        share_percentage: sharePct,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'caja_fuerte_id,slot' }
    );

    if (upsertErr) {
      throw new HttpError(500, upsertErr.message, upsertErr.code);
    }
  }

  if (normalizedInputs.length === 1) {
    const { error: delErr } = await admin
      .from('herederos')
      .delete()
      .eq('caja_fuerte_id', cajaRow.id)
      .eq('slot', 2);

    if (delErr) {
      throw new HttpError(500, delErr.message, delErr.code);
    }
  }

  return {
    herederos: resolved,
    caja_fuerte_id: cajaRow.id,
    message:
      'Herederos asignados en base de datos. Firmá la transacción on-chain para confirmar en el contrato.',
  };
}

export async function listHerederosForUser(authUserId: string): Promise<{
  herederos: Array<
    HerederoRow & {
      email: string | null;
    }
  >;
  caja_fuerte_id: string;
}> {
  const admin = assertAdmin();
  const cajaRow = await getCajaFuerteRowForUser(authUserId);

  const { data: rows, error } = await admin
    .from('herederos')
    .select('*')
    .eq('caja_fuerte_id', cajaRow.id)
    .order('slot', { ascending: true });

  if (error) {
    throw new HttpError(500, error.message, error.code);
  }

  const herederos: Array<HerederoRow & { email: string | null }> = [];

  for (const row of rows ?? []) {
    const { data: userMatch } = row.address
      ? await admin.from('users').select('email').eq('wallet_address', row.address).maybeSingle()
      : { data: null };

    herederos.push({
      ...row,
      email: userMatch?.email ?? null,
    });
  }

  return { herederos, caja_fuerte_id: cajaRow.id };
}
