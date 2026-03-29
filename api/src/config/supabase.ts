import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '../types/database.types.js';

const url = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

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
 * Úsalo solo en el backend para Admin API (bypass RLS).
 */
export const supabaseAdmin: SupabaseClient<Database> | null =
  url && serviceRoleKey ? createClient<Database>(url, serviceRoleKey, serverClientOptions()) : null;
