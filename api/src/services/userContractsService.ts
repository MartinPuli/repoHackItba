import { createHash } from 'crypto';

import { supabaseAdmin } from '../config/supabase.js';
import { HttpError } from '../middlewares/httpError.js';
import type { Database } from '../types/database.types.js';

type StrongboxRow = Database['public']['Tables']['strongboxes']['Row'];

function assertAdmin() {
  if (!supabaseAdmin) {
    throw new HttpError(500, 'Supabase admin client is not configured');
  }
  return supabaseAdmin;
}

function isLikelyEthereumAddress(addr: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(addr);
}

export async function getStrongboxRowForUser(userId: string): Promise<StrongboxRow> {
  const admin = assertAdmin();
  const { data: row, error } = await admin
    .from('strongboxes')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new HttpError(500, error.message, error.code);
  }
  if (!row) {
    throw new HttpError(404, 'StrongBox no configurada; usar POST /api/strongbox/setup primero');
  }
  if (
    row.contract_address != null &&
    row.contract_address !== '' &&
    !isLikelyEthereumAddress(row.contract_address)
  ) {
    throw new HttpError(500, 'contract_address de strongbox con formato inválido');
  }
  return row;
}

/** Dirección para mocks cuando aún no hay contrato on-chain. */
export function resolveStrongboxMockAddress(row: StrongboxRow): string {
  if (row.contract_address && isLikelyEthereumAddress(row.contract_address)) {
    return row.contract_address;
  }
  return `0x${createHash('sha256').update(row.id).digest('hex').slice(0, 40)}`;
}
