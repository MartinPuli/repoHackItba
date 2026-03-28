import { supabaseAdmin } from '../config/supabase.js';
import { HttpError } from '../middlewares/httpError.js';
import type { Database } from '../types/database.types.js';

type WalletRow = Database['public']['Tables']['wallets']['Row'];
type CajaFuerteRow = Database['public']['Tables']['caja_fuerte']['Row'];

function assertAdmin() {
  if (!supabaseAdmin) {
    throw new HttpError(500, 'Supabase admin client is not configured');
  }
  return supabaseAdmin;
}

function isLikelyEthereumAddress(addr: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(addr);
}

export type SmartWalletResolution =
  | { kind: 'wallets'; row: WalletRow }
  | { kind: 'users_fallback'; walletAddress: string };

/**
 * Prioridad: fila `wallets` más reciente del usuario; si no hay, `users.wallet_address` (placeholder on-boarding).
 */
export async function resolveSmartWalletForUser(userId: string): Promise<SmartWalletResolution> {
  const admin = assertAdmin();
  const { data: walletRow, error: walletErr } = await admin
    .from('wallets')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (walletErr) {
    throw new HttpError(500, walletErr.message, walletErr.code);
  }
  if (walletRow) {
    return { kind: 'wallets', row: walletRow };
  }

  const { data: userRow, error: userErr } = await admin
    .from('users')
    .select('wallet_address')
    .eq('id', userId)
    .maybeSingle();

  if (userErr) {
    throw new HttpError(500, userErr.message, userErr.code);
  }
  if (!userRow?.wallet_address) {
    throw new HttpError(404, 'No hay dirección de smart wallet para este usuario');
  }
  if (!isLikelyEthereumAddress(userRow.wallet_address)) {
    throw new HttpError(500, 'wallet_address de usuario con formato inválido');
  }

  return { kind: 'users_fallback', walletAddress: userRow.wallet_address };
}

export async function getCajaFuerteRowForUser(userId: string): Promise<CajaFuerteRow> {
  const admin = assertAdmin();
  const { data: row, error } = await admin
    .from('caja_fuerte')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new HttpError(500, error.message, error.code);
  }
  if (!row) {
    throw new HttpError(
      404,
      'Caja fuerte no configurada en base de datos; crear fila en caja_fuerte tras deploy'
    );
  }
  if (!isLikelyEthereumAddress(row.contract_address)) {
    throw new HttpError(500, 'contract_address de caja fuerte con formato inválido');
  }
  return row;
}
