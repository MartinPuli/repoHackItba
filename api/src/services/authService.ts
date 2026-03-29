import type { User } from '@supabase/supabase-js';

import { supabaseAdmin } from '../config/supabase.js';
import { HttpError } from '../middlewares/httpError.js';
import type { Database, PublicProfile } from '../types/database.types.js';

type UsersInsert = Database['public']['Tables']['users']['Insert'];

function assertAdmin() {
  if (!supabaseAdmin) {
    throw new HttpError(500, 'Supabase admin client is not configured');
  }
  return supabaseAdmin;
}

function toPublicProfile(row: Database['public']['Tables']['users']['Row']): PublicProfile {
  return {
    id: row.id,
    wallet_address: row.wallet_address,
    display_name: row.display_name,
    email: row.email,
    created_at: row.created_at,
    updated_at: row.updated_at,
    last_active_at: row.last_active_at,
  };
}

/** Wallet EVM del titular según metadata del JWT de Supabase (fuente de verdad en setup / auth). */
export function walletFromAuthUser(authUser: User): string {
  const meta = authUser.user_metadata as Record<string, unknown> | undefined;
  const raw = meta?.ethereum_address ?? meta?.wallet_address ?? meta?.address;
  if (typeof raw !== 'string' || !/^0x[a-fA-F0-9]{40}$/.test(raw)) {
    throw new HttpError(
      422,
      'No se encontró wallet EVM en la sesión (metadata: ethereum_address / wallet_address)'
    );
  }
  return raw.toLowerCase();
}

export async function getMeForAuthUser(authUser: User): Promise<{
  profile: PublicProfile;
  has_strongbox: boolean;
  is_guardian: boolean;
  is_heir: boolean;
}> {
  const admin = assertAdmin();
  const wallet_address = walletFromAuthUser(authUser);
  const id = authUser.id;

  const row: UsersInsert = { id, wallet_address };

  const { data: profileRow, error: upsertErr } = await admin
    .from('users')
    .upsert(row, { onConflict: 'id' })
    .select()
    .single();

  if (upsertErr) {
    if (upsertErr.code === '23505') {
      throw new HttpError(
        409,
        'Conflicto: wallet_address ya usada por otro usuario',
        upsertErr.code
      );
    }
    throw new HttpError(500, upsertErr.message, upsertErr.code);
  }
  if (!profileRow) {
    throw new HttpError(500, 'Upsert de usuario no devolvió fila');
  }

  const [sbResult, guardianResult, heirResult] = await Promise.all([
    admin.from('strongboxes').select('id').eq('user_id', id).limit(1).maybeSingle(),
    admin.from('guardians').select('id').eq('address', wallet_address).limit(1).maybeSingle(),
    admin.from('recovery_contacts').select('id').eq('address', wallet_address).limit(1).maybeSingle(),
  ]);

  if (sbResult.error) throw new HttpError(500, sbResult.error.message, sbResult.error.code);
  if (guardianResult.error) throw new HttpError(500, guardianResult.error.message, guardianResult.error.code);
  if (heirResult.error) throw new HttpError(500, heirResult.error.message, heirResult.error.code);

  return {
    profile: toPublicProfile(profileRow),
    has_strongbox: sbResult.data != null,
    is_guardian: guardianResult.data != null,
    is_heir: heirResult.data != null,
  };
}
