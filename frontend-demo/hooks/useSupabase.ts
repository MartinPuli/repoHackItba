"use client";

import { useState, useEffect, useCallback } from "react";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";

// ── Types (alineados a api/supabase/migrations/20260328130000_001_initial_schema.sql) ──

interface QueryResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export interface UserProfile {
  id: string;
  wallet_address: string;
  display_name: string | null;
  email: string | null;
  created_at: string;
  updated_at: string;
  last_active_at: string;
}

export interface GuardianRow {
  id: string;
  strongbox_id: string;
  slot: number;
  address: string;
  email: string | null;
  display_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface RecoveryContactRow {
  id: string;
  strongbox_id: string;
  slot: number;
  address: string;
  email: string | null;
  display_name: string | null;
  share_percentage: string;
  created_at: string;
  updated_at: string;
}

interface StrongboxWithRelations {
  id: string;
  user_id: string;
  contract_address: string | null;
  chain_id: number;
  balance_native: string | null;
  time_limit_seconds: number;
  last_activity_at: string;
  recovery_state: "inactive" | "pending" | "executed";
  recovery_unlocks_at: string | null;
  is_deployed: boolean;
  deploy_tx_hash: string | null;
  created_at: string;
  updated_at: string;
  guardians?: GuardianRow[];
  recovery_contacts?: RecoveryContactRow[];
}

interface QueryResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

function startQueryWatchdog(
  isCancelled: () => boolean,
  onTimeout: () => void,
  ms = 12_000,
): () => void {
  if (typeof window === "undefined") return () => {};
  const id = window.setTimeout(() => {
    if (!isCancelled()) onTimeout();
  }, ms);
  return () => window.clearTimeout(id);
}

/** Datos de la strongbox del usuario desde Supabase (`strongboxes` + relaciones). */
export function useCajaFuerteData(
  userId: string | undefined,
): QueryResult<StrongboxWithRelations> & { refetch: () => void } {
  const [data, setData] = useState<StrongboxWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshNonce, setRefreshNonce] = useState(0);

  const refetch = useCallback(() => setRefreshNonce((n) => n + 1), []);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    let cancelled = false;
    const supabase = getSupabaseBrowser();
    if (!supabase) { setData(null); setLoading(false); return; }
    const db: SupabaseClient = supabase;

    async function fetchStrongbox() {
      setLoading(true);
      setError(null);
      const stopWatch = startQueryWatchdog(
        () => cancelled,
        () => {
          setError("Tiempo de espera al cargar la caja fuerte.");
          setLoading(false);
        },
      );
      try {
        const { data: row, error: err } = await db
          .from("strongboxes")
          .select("*")
          .eq("user_id", userId!)
          .maybeSingle();

        if (cancelled) return;
        if (err) {
          setError(err.message);
          setData(null);
          return;
        }
        if (!row) {
          setData(null);
          return;
        }

        const strongbox = row as StrongboxWithRelations;

        const { data: guardians, error: gErr } = await db
          .from("guardians")
          .select("*")
          .eq("strongbox_id", strongbox.id)
          .order("slot", { ascending: true });

        if (cancelled) return;

        const { data: recoveryRows, error: rcErr } = await db
          .from("recovery_contacts")
          .select("*")
          .eq("strongbox_id", strongbox.id)
          .order("slot", { ascending: true });

        if (cancelled) return;

        if (gErr) strongbox.guardians = [];
        else strongbox.guardians = guardians as GuardianRow[];

        if (rcErr) strongbox.recovery_contacts = [];
        else strongbox.recovery_contacts = recoveryRows as RecoveryContactRow[];

        setData(strongbox);
      } finally {
        stopWatch();
        if (!cancelled) setLoading(false);
      }
    }

    void fetchStrongbox();
    return () => {
      cancelled = true;
    };
  }, [userId, refreshNonce]);

  return { data, loading, error, refetch };
}
