import { createHash } from 'crypto';

import type { Session, User } from '@supabase/supabase-js';

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

/**
 * Dirección placeholder única por usuario hasta deploy CREATE2 (ethers).
 * TODO: reemplazar por smart wallet real on-chain.
 */
export function walletPlaceholderForAuthUserId(authUserId: string): string {
  return `0x${createHash('sha256').update(authUserId).digest('hex').slice(0, 40)}`;
}

function toPublicProfile(row: Database['public']['Tables']['users']['Row']): PublicProfile {
  return {
    id: row.id,
    wallet_address: row.wallet_address,
    display_name: row.display_name,
    email: row.email,
    autonomy_level: row.autonomy_level,
    created_at: row.created_at,
    updated_at: row.updated_at,
    last_active_at: row.last_active_at,
  };
}

async function insertPublicUserRow(payload: UsersInsert): Promise<PublicProfile> {
  const admin = assertAdmin();
  const { data, error } = await admin.from('users').insert(payload).select().single();
  if (error) {
    if (error.code === '23505') {
      throw new HttpError(409, 'User profile already exists', error.code);
    }
    throw new HttpError(500, error.message, error.code);
  }
  return toPublicProfile(data);
}

export async function signUpUser(
  email: string,
  password: string
): Promise<{ user: User; session: Session | null; profile: PublicProfile }> {
  const admin = assertAdmin();
  const { data: signUpData, error: signUpError } = await admin.auth.signUp({
    email,
    password,
  });
  if (signUpError) {
    const status = signUpError.status === 400 ? 400 : 422;
    throw new HttpError(status, signUpError.message);
  }
  const authUser = signUpData.user;
  if (!authUser?.id) {
    throw new HttpError(500, 'Auth sign-up did not return a user id');
  }

  const row: UsersInsert = {
    id: authUser.id,
    email,
    wallet_address: walletPlaceholderForAuthUserId(authUser.id),
  };

  try {
    const profile = await insertPublicUserRow(row);
    return {
      user: authUser,
      session: signUpData.session,
      profile,
    };
  } catch (err) {
    if (err instanceof HttpError && err.statusCode === 409) {
      const { data: existing, error: fetchErr } = await admin
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();
      if (fetchErr || !existing) {
        throw err;
      }
      return {
        user: authUser,
        session: signUpData.session,
        profile: toPublicProfile(existing),
      };
    }
    throw err;
  }
}

export async function signInUser(
  email: string,
  password: string
): Promise<{ user: User; session: Session; profile: PublicProfile }> {
  const admin = assertAdmin();
  const { data: signInData, error: signInError } = await admin.auth.signInWithPassword({
    email,
    password,
  });
  if (signInError) {
    const status = signInError.message.includes('Invalid login') ? 401 : 400;
    throw new HttpError(status, signInError.message);
  }
  const session = signInData.session;
  const authUser = signInData.user;
  if (!session || !authUser?.id) {
    throw new HttpError(
      401,
      'No session returned (¿email sin confirmar?). Revisá la configuración de Auth en Supabase.'
    );
  }

  const { data: profileRow, error: profileError } = await admin
    .from('users')
    .select('*')
    .eq('id', authUser.id)
    .maybeSingle();

  if (profileError) {
    throw new HttpError(500, profileError.message);
  }
  if (!profileRow) {
    throw new HttpError(
      404,
      'Perfil de aplicación no encontrado; completá el registro o contactá soporte.'
    );
  }

  return {
    user: authUser,
    session,
    profile: toPublicProfile(profileRow),
  };
}
