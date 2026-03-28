import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.SUPABASE_ANON_KEY;

function serverClientOptions() {
  return {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  } as const;
}

/**
 * Cliente con `SUPABASE_SERVICE_ROLE_KEY`.
 * Úsalo solo en el backend para Admin API
 */
export const supabaseAdmin: SupabaseClient | null =
  url && serviceRoleKey ? createClient(url, serviceRoleKey, serverClientOptions()) : null;

/**
 * Cliente con `SUPABASE_ANON_KEY`: mismo rol que un cliente público, respeta RLS.
 */
export const supabaseAnon: SupabaseClient | null =
  url && anonKey ? createClient(url, anonKey, serverClientOptions()) : null;
