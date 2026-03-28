"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

// ── Types ──────────────────────────────────────────────────────────────

type AutonomyLevel = "asistente" | "copiloto" | "autonomo";

interface UserProfile {
  id: string;
  wallet_address: string | null;
  display_name: string | null;
  email: string | null;
  autonomy_level: AutonomyLevel;
  created_at: string;
  updated_at: string;
  last_active_at: string | null;
}

interface Wallet {
  id: string;
  user_id: string;
  contract_address: string;
  chain_id: number;
  balance_bnb: number;
  balance_usdt: number;
  balance_btcb: number;
  is_deployed: boolean;
  deploy_tx_hash: string | null;
  created_at: string;
  updated_at: string;
}

interface Heredero {
  id: string;
  caja_fuerte_id: string;
  slot: number; // 1 or 2
  address: string;
  display_name: string | null;
  share_percentage: number;
  nonce: number;
  created_at: string;
  updated_at: string;
}

interface CajaFuerte {
  id: string;
  user_id: string;
  wallet_id: string;
  contract_address: string | null;
  chain_id: number;
  balance_usdt: number;
  balance_btcb: number;
  balance_rbtc: number;
  dead_man_timeout_seconds: number;
  last_activity_at: string;
  recovery_state: "inactive" | "pending" | "executed";
  withdrawal_unlocks_at: string | null;
  is_deployed: boolean;
  created_at: string;
  updated_at: string;
  herederos?: Heredero[];
}

interface Transaction {
  id: string;
  user_id: string;
  wallet_id: string | null;
  caja_fuerte_id: string | null;
  tx_type:
    | "deposit"
    | "withdraw"
    | "send"
    | "swap"
    | "yield_deposit"
    | "yield_withdraw"
    | "bridge"
    | "off_ramp";
  status: "pending" | "confirmed" | "failed" | "reverted";
  chain_id: number;
  tx_hash: string | null;
  from_address: string | null;
  to_address: string | null;
  token_symbol: string | null;
  amount: number;
  amount_usd: number | null;
  gas_used: number | null;
  gas_cost_usd: number | null;
  initiated_by: string | null;
  agent_decision_id: string | null;
  error_message: string | null;
  created_at: string;
  confirmed_at: string | null;
}

interface AgentDecision {
  id: string;
  user_id: string;
  action_type:
    | "analysis"
    | "suggestion"
    | "prepare_tx"
    | "execute_tx"
    | "compliance_check"
    | "rebalance"
    | "yield_optimize"
    | "reset_deadman"
    | "alert";
  autonomy_level: AutonomyLevel;
  hypothesis: Record<string, unknown> | null;
  reasoning: string | null;
  evidence: Record<string, unknown> | null;
  confidence: number | null;
  reflection_result: string | null;
  reflection_reasoning: string | null;
  final_action: string | null;
  tx_hash: string | null;
  outcome: Record<string, unknown> | null;
  copper_votes: Record<string, unknown> | null;
  execution_time_ms: number | null;
  created_at: string;
}

interface YieldPosition {
  id: string;
  user_id: string;
  caja_fuerte_id: string | null;
  protocol: string;
  chain_id: number;
  pool_address: string | null;
  position_type: string | null;
  token_symbol: string;
  amount: number;
  amount_usd: number | null;
  apy_current: number;
  ltv_ratio: number | null;
  is_active: boolean;
  opened_at: string | null;
  closed_at: string | null;
  updated_at: string;
}

interface SessionKey {
  id: string;
  user_id: string;
  wallet_id: string;
  key_address: string;
  status: "active" | "expired" | "revoked";
  max_amount_per_tx: number | null;
  max_amount_cumulative: number | null;
  amount_spent: number | null;
  allowed_functions: string[] | null;
  allowed_contracts: string[] | null;
  expires_at: string | null;
  revoked_at: string | null;
  created_at: string;
}

interface Alert {
  id: string;
  user_id: string;
  priority: "low" | "medium" | "high" | "critical";
  title: string;
  message: string;
  category: string | null;
  related_entity_type: string | null;
  related_entity_id: string | null;
  is_read: boolean;
  action_url: string | null;
  created_at: string;
}

interface QueryResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface MutationResult {
  loading: boolean;
  error: string | null;
}

// ── Demo user constant ────────────────────────────────────────────────
export const DEMO_USER_ID = "00000000-0000-0000-0000-000000000001";

// ── Helpers ────────────────────────────────────────────────────────────

function getSupabase() {
  return createClient();
}

/** Compute total USD balance from wallet token balances. */
export function totalBalanceUsd(wallet: Wallet): number {
  return wallet.balance_bnb * 600 + wallet.balance_usdt + wallet.balance_btcb * 85000;
}

/** Compute total USD balance across multiple wallets. */
export function totalBalanceUsdAll(wallets: Wallet[]): number {
  return wallets.reduce((sum, w) => sum + totalBalanceUsd(w), 0);
}

// ── 1. useUserProfile ──────────────────────────────────────────────────

export function useUserProfile(userId: string | undefined): QueryResult<UserProfile> {
  const [data, setData] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    const supabase = getSupabase();

    async function fetch() {
      setLoading(true);
      setError(null);
      const { data: row, error: err } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId!)
        .single();

      if (cancelled) return;
      if (err) setError(err.message);
      else setData(row as UserProfile);
      setLoading(false);
    }

    fetch();
    return () => { cancelled = true; };
  }, [userId]);

  return { data, loading, error };
}

// ── 2. useWalletData ───────────────────────────────────────────────────

export function useWalletData(userId: string | undefined): QueryResult<Wallet[]> {
  const [data, setData] = useState<Wallet[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    const supabase = getSupabase();

    async function fetch() {
      setLoading(true);
      setError(null);
      const { data: rows, error: err } = await supabase
        .from("wallets")
        .select("*")
        .eq("user_id", userId!);

      if (cancelled) return;
      if (err) setError(err.message);
      else setData(rows as Wallet[]);
      setLoading(false);
    }

    fetch();
    return () => { cancelled = true; };
  }, [userId]);

  return { data, loading, error };
}

// ── 3. useCajaFuerteData ──────────────────────────────────────────────

export function useCajaFuerteData(userId: string | undefined): QueryResult<CajaFuerte> {
  const [data, setData] = useState<CajaFuerte | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    const supabase = getSupabase();

    async function fetch() {
      setLoading(true);
      setError(null);

      // Fetch the caja fuerte row
      const { data: row, error: err } = await supabase
        .from("caja_fuerte")
        .select("*")
        .eq("user_id", userId!)
        .single();

      if (cancelled) return;
      if (err) {
        setError(err.message);
        setLoading(false);
        return;
      }

      const cajaFuerte = row as CajaFuerte;

      // Fetch herederos separately by caja_fuerte_id
      const { data: herederos, error: herErr } = await supabase
        .from("herederos")
        .select("*")
        .eq("caja_fuerte_id", cajaFuerte.id)
        .order("slot", { ascending: true });

      if (cancelled) return;
      if (herErr) {
        // Non-fatal: attach empty array and log
        cajaFuerte.herederos = [];
      } else {
        cajaFuerte.herederos = herederos as Heredero[];
      }

      setData(cajaFuerte);
      setLoading(false);
    }

    fetch();
    return () => { cancelled = true; };
  }, [userId]);

  return { data, loading, error };
}

// ── 4. useTransactions ─────────────────────────────────────────────────

export function useTransactions(
  walletId: string | undefined,
  limit: number = 20
): QueryResult<Transaction[]> {
  const [data, setData] = useState<Transaction[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!walletId) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    const supabase = getSupabase();

    async function fetch() {
      setLoading(true);
      setError(null);
      const { data: rows, error: err } = await supabase
        .from("transactions")
        .select("*")
        .eq("wallet_id", walletId!)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (cancelled) return;
      if (err) setError(err.message);
      else setData(rows as Transaction[]);
      setLoading(false);
    }

    fetch();
    return () => { cancelled = true; };
  }, [walletId, limit]);

  return { data, loading, error };
}

// ── 5. useAgentDecisions (realtime) ────────────────────────────────────

export function useAgentDecisions(
  userId: string | undefined,
  limit: number = 30
): QueryResult<AgentDecision[]> {
  const [data, setData] = useState<AgentDecision[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    let channel: RealtimeChannel | null = null;
    const supabase = getSupabase();

    async function fetchInitial() {
      setLoading(true);
      setError(null);
      const { data: rows, error: err } = await supabase
        .from("agent_decisions")
        .select("*")
        .eq("user_id", userId!)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (err) {
        setError(err.message);
        setLoading(false);
        return;
      }
      setData(rows as AgentDecision[]);
      setLoading(false);
    }

    fetchInitial();

    // Subscribe to realtime inserts and updates for this user
    channel = supabase
      .channel(`agent_decisions:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "agent_decisions",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newRecord = payload.new as AgentDecision;

          if (payload.eventType === "INSERT") {
            setData((prev) =>
              prev ? [newRecord, ...prev].slice(0, limit) : [newRecord]
            );
          } else if (payload.eventType === "UPDATE") {
            setData((prev) =>
              prev
                ? prev.map((d) => (d.id === newRecord.id ? newRecord : d))
                : prev
            );
          }
        }
      )
      .subscribe();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [userId, limit]);

  return { data, loading, error };
}

// ── 6. useYieldPositions ───────────────────────────────────────────────

export function useYieldPositions(
  userId: string | undefined
): QueryResult<YieldPosition[]> {
  const [data, setData] = useState<YieldPosition[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    const supabase = getSupabase();

    async function fetch() {
      setLoading(true);
      setError(null);
      const { data: rows, error: err } = await supabase
        .from("yield_positions")
        .select("*")
        .eq("user_id", userId!)
        .eq("is_active", true)
        .order("updated_at", { ascending: false });

      if (cancelled) return;
      if (err) setError(err.message);
      else setData(rows as YieldPosition[]);
      setLoading(false);
    }

    fetch();
    return () => { cancelled = true; };
  }, [userId]);

  return { data, loading, error };
}

// ── 7. useUpdateAutonomy ───────────────────────────────────────────────

export function useUpdateAutonomy(userId: string | undefined) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateAutonomy = useCallback(
    async (level: AutonomyLevel) => {
      if (!userId) {
        setError("No user ID provided");
        return false;
      }

      setLoading(true);
      setError(null);
      const supabase = getSupabase();

      const { error: err } = await supabase
        .from("users")
        .update({ autonomy_level: level, updated_at: new Date().toISOString() })
        .eq("id", userId);

      setLoading(false);
      if (err) {
        setError(err.message);
        return false;
      }
      return true;
    },
    [userId]
  );

  return { updateAutonomy, loading, error } satisfies MutationResult & {
    updateAutonomy: (level: AutonomyLevel) => Promise<boolean>;
  };
}

// ── 8. useKillSwitch ──────────────────────────────────────────────────

export function useKillSwitch(userId: string | undefined) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activate = useCallback(async () => {
    if (!userId) {
      setError("No user ID provided");
      return false;
    }

    setLoading(true);
    setError(null);
    const supabase = getSupabase();
    const now = new Date().toISOString();

    try {
      // 1. Set autonomy to asistente
      const { error: userErr } = await supabase
        .from("users")
        .update({ autonomy_level: "asistente" as AutonomyLevel, updated_at: now })
        .eq("id", userId);

      if (userErr) throw userErr;

      // 2. Revoke all active session keys
      const { error: keysErr } = await supabase
        .from("session_keys")
        .update({ status: "revoked" as const, revoked_at: now })
        .eq("user_id", userId)
        .eq("status", "active");

      if (keysErr) throw keysErr;

      // 3. Log kill switch activation to agent_decisions
      const { error: logErr } = await supabase
        .from("agent_decisions")
        .insert({
          user_id: userId,
          action_type: "alert",
          reasoning:
            "Kill switch activated: autonomy set to asistente, all active session keys revoked",
          autonomy_level: "asistente" as AutonomyLevel,
          confidence: 1.0,
          final_action: "kill_switch_activated",
        });

      if (logErr) throw logErr;

      setLoading(false);
      return true;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message);
      setLoading(false);
      return false;
    }
  }, [userId]);

  return { activate, loading, error } satisfies MutationResult & {
    activate: () => Promise<boolean>;
  };
}

// ── 9. useAlerts ───────────────────────────────────────────────────────

export function useAlerts(userId: string | undefined): QueryResult<{ alerts: Alert[]; unreadCount: number }> {
  const [data, setData] = useState<{ alerts: Alert[]; unreadCount: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    const supabase = getSupabase();

    async function fetch() {
      setLoading(true);
      setError(null);

      const { data: rows, error: err } = await supabase
        .from("alerts")
        .select("*")
        .eq("user_id", userId!)
        .order("created_at", { ascending: false })
        .limit(50);

      if (cancelled) return;

      if (err) {
        setError(err.message);
        setLoading(false);
        return;
      }

      const alerts = rows as Alert[];
      const unreadCount = alerts.filter((a) => !a.is_read).length;
      setData({ alerts, unreadCount });
      setLoading(false);
    }

    fetch();
    return () => { cancelled = true; };
  }, [userId]);

  return { data, loading, error };
}

// ── Re-export types for consumers ──────────────────────────────────────

export type {
  AutonomyLevel,
  UserProfile,
  Wallet,
  Heredero,
  CajaFuerte,
  Transaction,
  AgentDecision,
  YieldPosition,
  SessionKey,
  Alert,
};
