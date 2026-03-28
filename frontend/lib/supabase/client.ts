import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

function readEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  return { url, key };
}

/** True cuando hay URL y anon key (desarrollo local sin Supabase → false). */
export function isSupabaseConfigured(): boolean {
  const { url, key } = readEnv();
  return Boolean(url && key);
}

let browserClient: SupabaseClient | null = null;

/**
 * Cliente browser singleton, o null si faltan env vars.
 * Usar esto en hooks y UI para modo local sin Supabase.
 */
export function getSupabaseBrowser(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  if (!browserClient) {
    const { url, key } = readEnv();
    browserClient = createBrowserClient(url!, key!);
  }
  return browserClient;
}

/**
 * Misma instancia que getSupabaseBrowser, pero lanza si no hay configuración.
 * Reservado para flujos que exigen Supabase (p. ej. futuras server actions).
 */
export function createClient(): SupabaseClient {
  const c = getSupabaseBrowser();
  if (!c) {
    throw new Error(
      "Supabase: faltan NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY. " +
        "Creá frontend/.env.local (ver .env.example) o usá getSupabaseBrowser() para modo opcional."
    );
  }
  return c;
}
