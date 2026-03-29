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

/** StrongBox + guardianes y recovery contacts (tablas `guardians`, `recovery_contacts`). */
export interface StrongboxWithRelations {
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

export interface Transaction {
  id: string;
  user_id: string;
  strongbox_id: string | null;
  tx_type: "deposit" | "withdraw" | "recovery";
  status: "pending" | "confirmed" | "failed" | "reverted";
  chain_id: number;
  tx_hash: string | null;
  from_address: string;
  to_address: string;
  amount: string;
  gas_used: string | null;
  error_message: string | null;
  created_at: string;
  confirmed_at: string | null;
}

export interface Alert {
  id: string;
  user_id: string;
  priority: "low" | "medium" | "high" | "critical";
  title: string;
  message: string;
  category: string;
  related_entity_type: string | null;
  related_entity_id: string | null;
  is_read: boolean;
  created_at: string;
}

export const DEMO_USER_ID = "00000000-0000-0000-0000-000000000001";

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

// ── useUserProfile ─────────────────────────────────────────────────────

export function useUserProfile(userId: string | undefined): QueryResult<UserProfile> {
  const [data, setData] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    let cancelled = false;
    const supabase = getSupabaseBrowser();
    if (!supabase) { setData(null); setLoading(false); return; }
    const db: SupabaseClient = supabase;

    async function fetchProfile() {
      setLoading(true);
      setError(null);
      const stopWatch = startQueryWatchdog(
        () => cancelled,
        () => {
          setError("Tiempo de espera al cargar el perfil. Revisá Supabase o la red.");
          setLoading(false);
        },
      );
      try {
        const { data: row, error: err } = await db.from("users").select("*").eq("id", userId!).single();
        if (cancelled) return;
        if (err) setError(err.message);
        else setData(row as UserProfile);
      } finally {
        stopWatch();
        if (!cancelled) setLoading(false);
      }
    }

    void fetchProfile();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  return { data, loading, error };
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

/** Transacciones asociadas a una strongbox (`strongbox_id`). */
export function useTransactions(
  strongboxId: string | undefined,
  limit: number = 20,
): QueryResult<Transaction[]> {
  const [data, setData] = useState<Transaction[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!strongboxId) {
      setLoading(false);
      setData(null);
      return;
    }

    let cancelled = false;
    const supabase = getSupabaseBrowser();
    if (!supabase) { setData(null); setLoading(false); return; }
    const db: SupabaseClient = supabase;

    async function fetchTx() {
      setLoading(true);
      setError(null);
      const { data: rows, error: err } = await db
        .from("transactions")
        .select("*")
        .eq("strongbox_id", strongboxId)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (cancelled) return;
      if (err) setError(err.message);
      else setData(rows as Transaction[]);
      setLoading(false);
    }

    void fetchTx();
    return () => {
      cancelled = true;
    };
  }, [strongboxId, limit]);

  return { data, loading, error };
}

export function useAlerts(
  userId: string | undefined,
): QueryResult<{ alerts: Alert[]; unreadCount: number }> {
  const [data, setData] = useState<{ alerts: Alert[]; unreadCount: number } | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    let cancelled = false;
    const supabase = getSupabaseBrowser();
    if (!supabase) { setData(null); setLoading(false); return; }
    const db: SupabaseClient = supabase;

    async function fetchAlerts() {
      setLoading(true);
      setError(null);
      const stopWatch = startQueryWatchdog(
        () => cancelled,
        () => {
          setError("Tiempo de espera al cargar alertas.");
          setLoading(false);
        },
      );
      try {
        const { data: rows, error: err } = await db
          .from("alerts")
          .select("*")
          .eq("user_id", userId!)
          .order("created_at", { ascending: false })
          .limit(50);

        if (cancelled) return;
        if (err) { setError(err.message); return; }

        const alerts = rows as Alert[];
        setData({ alerts, unreadCount: alerts.filter((a) => !a.is_read).length });
      } finally {
        stopWatch();
        if (!cancelled) setLoading(false);
      }
    }

    void fetchAlerts();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  return { data, loading, error };
}
