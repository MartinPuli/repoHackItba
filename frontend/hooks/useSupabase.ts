"use client";

import { useState, useEffect, useCallback } from "react";
import { getSupabaseBrowser } from "@/lib/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";

// ── Types (aligned with SUPABASE-SCHEMA.md) ────────────────────────────

interface UserProfile {
  id: string;
  wallet_address: string;
  email: string | null;
  created_at: string;
  updated_at: string;
}

interface StrongBox {
  id: string;
  user_id: string;
  contract_address: string | null;
  chain_id: number;
  balance: string;
  time_limit: number;
  recovery_state: "inactive" | "pending" | "executed";
  is_deployed: boolean;
  deploy_tx_hash: string | null;
  created_at: string;
  updated_at: string;
  guardians?: Guardian[];
  recovery_contacts?: RecoveryContact[];
}

interface Guardian {
  id: string;
  strongbox_id: string;
  slot: number; // 1 or 2
  address: string;
  email: string | null;
  created_at: string;
}

interface RecoveryContact {
  id: string;
  strongbox_id: string;
  slot: number; // 1 or 2
  address: string;
  email: string | null;
  share_percentage: number;
  created_at: string;
}

interface WithdrawalRequest {
  id: string;
  strongbox_id: string;
  amount: string;
  to_address: string;
  status: "pending" | "approved" | "rejected" | "executed";
  guardian1_approved: boolean;
  guardian2_approved: boolean;
  created_at: string;
  resolved_at: string | null;
}

interface Transaction {
  id: string;
  user_id: string;
  strongbox_id: string | null;
  tx_type: "deposit" | "withdraw" | "recovery";
  status: "pending" | "confirmed" | "failed";
  chain_id: number;
  tx_hash: string | null;
  from_address: string | null;
  to_address: string | null;
  token_symbol: string | null;
  amount: string;
  created_at: string;
  confirmed_at: string | null;
}

interface Alert {
  id: string;
  user_id: string;
  priority: "low" | "medium" | "high" | "critical";
  title: string;
  message: string;
  category: string | null;
  is_read: boolean;
  created_at: string;
}

interface QueryResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

// ── Helpers ─────────────────────────────────────────────────────────────

function startQueryWatchdog(
  isCancelled: () => boolean,
  onTimeout: () => void,
  ms = 12_000
): () => void {
  if (typeof window === "undefined") return () => {};
  const id = window.setTimeout(() => {
    if (!isCancelled()) onTimeout();
  }, ms);
  return () => window.clearTimeout(id);
}

// ── 1. useUserProfile ──────────────────────────────────────────────────

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

    async function fetch() {
      setLoading(true);
      setError(null);
      const stopWatch = startQueryWatchdog(() => cancelled, () => {
        setError("Timeout cargando perfil");
        setLoading(false);
      });
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
    fetch();
    return () => { cancelled = true; };
  }, [userId]);

  return { data, loading, error };
}

// ── 2. useStrongBoxData ────────────────────────────────────────────────

export function useStrongBoxData(userId: string | undefined): QueryResult<StrongBox> {
  const [data, setData] = useState<StrongBox | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    let cancelled = false;
    const supabase = getSupabaseBrowser();
    if (!supabase) { setData(null); setLoading(false); return; }
    const db: SupabaseClient = supabase;

    async function fetch() {
      setLoading(true);
      setError(null);
      const stopWatch = startQueryWatchdog(() => cancelled, () => {
        setError("Timeout cargando StrongBox");
        setLoading(false);
      });
      try {
        const { data: row, error: err } = await db
          .from("strongboxes")
          .select("*")
          .eq("user_id", userId!)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        if (cancelled) return;
        if (err) { setError(err.message); return; }

        const strongbox = row as StrongBox;

        // Fetch guardians
        const { data: guardians } = await db
          .from("guardians")
          .select("*")
          .eq("strongbox_id", strongbox.id)
          .order("slot", { ascending: true });
        if (!cancelled) strongbox.guardians = (guardians as Guardian[]) ?? [];

        // Fetch recovery contacts
        const { data: contacts } = await db
          .from("recovery_contacts")
          .select("*")
          .eq("strongbox_id", strongbox.id)
          .order("slot", { ascending: true });
        if (!cancelled) strongbox.recovery_contacts = (contacts as RecoveryContact[]) ?? [];

        if (!cancelled) setData(strongbox);
      } finally {
        stopWatch();
        if (!cancelled) setLoading(false);
      }
    }
    fetch();
    return () => { cancelled = true; };
  }, [userId]);

  return { data, loading, error };
}

// ── 3. useWithdrawalRequests ───────────────────────────────────────────

export function useWithdrawalRequests(strongboxId: string | undefined): QueryResult<WithdrawalRequest[]> {
  const [data, setData] = useState<WithdrawalRequest[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!strongboxId) { setLoading(false); return; }
    let cancelled = false;
    const supabase = getSupabaseBrowser();
    if (!supabase) { setData(null); setLoading(false); return; }
    const db: SupabaseClient = supabase;

    async function fetch() {
      setLoading(true);
      setError(null);
      const { data: rows, error: err } = await db
        .from("withdrawal_requests")
        .select("*")
        .eq("strongbox_id", strongboxId!)
        .order("created_at", { ascending: false });

      if (cancelled) return;
      if (err) setError(err.message);
      else setData(rows as WithdrawalRequest[]);
      setLoading(false);
    }
    fetch();
    return () => { cancelled = true; };
  }, [strongboxId]);

  return { data, loading, error };
}

// ── 4. useTransactions ─────────────────────────────────────────────────

export function useTransactions(strongboxId: string | undefined, limit = 20): QueryResult<Transaction[]> {
  const [data, setData] = useState<Transaction[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!strongboxId) { setLoading(false); return; }
    let cancelled = false;
    const supabase = getSupabaseBrowser();
    if (!supabase) { setData(null); setLoading(false); return; }
    const db: SupabaseClient = supabase;

    async function fetch() {
      setLoading(true);
      setError(null);
      const { data: rows, error: err } = await db
        .from("transactions")
        .select("*")
        .eq("strongbox_id", strongboxId!)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (cancelled) return;
      if (err) setError(err.message);
      else setData(rows as Transaction[]);
      setLoading(false);
    }
    fetch();
    return () => { cancelled = true; };
  }, [strongboxId, limit]);

  return { data, loading, error };
}

// ── 5. useAlerts ───────────────────────────────────────────────────────

export function useAlerts(userId: string | undefined): QueryResult<{ alerts: Alert[]; unreadCount: number }> {
  const [data, setData] = useState<{ alerts: Alert[]; unreadCount: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    let cancelled = false;
    const supabase = getSupabaseBrowser();
    if (!supabase) { setData(null); setLoading(false); return; }
    const db: SupabaseClient = supabase;

    async function fetch() {
      setLoading(true);
      setError(null);
      const stopWatch = startQueryWatchdog(() => cancelled, () => {
        setError("Timeout cargando alertas");
        setLoading(false);
      });
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
    fetch();
    return () => { cancelled = true; };
  }, [userId]);

  return { data, loading, error };
}

// ── Re-export types ────────────────────────────────────────────────────

export type {
  UserProfile,
  StrongBox,
  Guardian,
  RecoveryContact,
  WithdrawalRequest,
  Transaction,
  Alert,
};
