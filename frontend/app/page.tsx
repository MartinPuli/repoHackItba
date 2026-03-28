"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { BalanceCards } from "@/components/dashboard/BalanceCards";
import { AutonomySlider } from "@/components/dashboard/AutonomySlider";
import { KillSwitch } from "@/components/dashboard/KillSwitch";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { DeadManStatus } from "@/components/dashboard/DeadManStatus";
import { YieldBreakdown } from "@/components/dashboard/YieldBreakdown";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { AgentChat } from "@/components/dashboard/AgentChat";

import {
  DEMO_USER_ID,
  useUserProfile,
  useWalletData,
  useCajaFuerteData,
  useAgentDecisions,
  useYieldPositions,
  useUpdateAutonomy,
  useKillSwitch,
  useAlerts,
  totalBalanceUsd,
} from "@/hooks/useSupabase";
import { useTokenPrices } from "@/hooks/useTokenPrices";
import type { AutonomyLevel, AgentDecision } from "@/hooks/useSupabase";

// ---------------------------------------------------------------------------
// Map Supabase agent_decisions → ActivityFeed items
// ---------------------------------------------------------------------------
type ActionType =
  | "analysis"
  | "suggestion"
  | "compliance"
  | "execute"
  | "yield"
  | "alert"
  | "deadman";

interface ActivityItem {
  id: string;
  type: ActionType;
  message: string;
  timestamp: string;
  status?: "success" | "pending" | "warning";
  canRevert?: boolean;
}

const ACTION_TYPE_MAP: Record<string, ActionType> = {
  analysis: "analysis",
  suggestion: "suggestion",
  compliance_check: "compliance",
  prepare_tx: "execute",
  execute_tx: "execute",
  rebalance: "yield",
  yield_optimize: "yield",
  reset_deadman: "deadman",
  alert: "alert",
};

const REFLECTION_STATUS_MAP: Record<string, "success" | "pending" | "warning"> = {
  confirmed: "success",
  approved: "success",
  tx_approved: "success",
  pending_user_approval: "pending",
  rejected: "warning",
  blocked: "warning",
};

function mapDecisionsToActivityItems(decisions: AgentDecision[]): ActivityItem[] {
  return decisions.map((d) => ({
    id: d.id,
    type: ACTION_TYPE_MAP[d.action_type] ?? "analysis",
    message: d.reasoning ?? "Accion del agente",
    timestamp: d.created_at,
    status: REFLECTION_STATUS_MAP[d.reflection_result ?? ""] ?? ((d.confidence ?? 0) > 0.8 ? "success" : "pending"),
    canRevert: d.action_type === "execute_tx",
  }));
}

// ---------------------------------------------------------------------------
// Skeleton pulse component for loading states
// ---------------------------------------------------------------------------
function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-surface-muted ${className}`}
    />
  );
}

// ---------------------------------------------------------------------------
// Dashboard Page
// ---------------------------------------------------------------------------
export default function DashboardPage() {
  // -- Supabase data hooks --
  const { data: profile, loading: profileLoading } = useUserProfile(DEMO_USER_ID);
  const { data: wallets, loading: walletsLoading } = useWalletData(DEMO_USER_ID);
  const { data: cajaFuerte, loading: cajaLoading } = useCajaFuerteData(DEMO_USER_ID);
  const { data: decisions, loading: decisionsLoading } = useAgentDecisions(DEMO_USER_ID, 20);
  const { data: alertsData, loading: alertsLoading } = useAlerts(DEMO_USER_ID);
  const { updateAutonomy } = useUpdateAutonomy(DEMO_USER_ID);
  const { activate: activateKillSwitch } = useKillSwitch(DEMO_USER_ID);

  // -- Live token prices from CoinGecko --
  const { prices } = useTokenPrices();

  // Derive primary wallet for queries
  const primaryWallet = wallets?.[0];
  const walletAddress = primaryWallet?.contract_address;
  const { data: yieldPositions } = useYieldPositions(DEMO_USER_ID);

  // -- Local autonomy state, synced from Supabase profile --
  const [autonomyLevel, setAutonomyLevel] = useState<AutonomyLevel>("asistente");

  useEffect(() => {
    if (profile?.autonomy_level) {
      setAutonomyLevel(profile.autonomy_level);
    }
  }, [profile?.autonomy_level]);

  // -- Derived values (fallback to 0 / empty when Supabase has no data) --
  const walletBalance = primaryWallet ? totalBalanceUsd(primaryWallet, prices) : 0;
  const cajaFuerteBalance = cajaFuerte?.balance_usdt ?? 0;

  // Sum yield earned across active positions
  const yieldEarned =
    yieldPositions?.reduce(
      (sum, pos) => sum + ((pos.amount_usd ?? 0) - pos.amount),
      0
    ) ?? 0;

  const totalDeposited =
    yieldPositions?.reduce((sum, pos) => sum + pos.amount, 0) ??
    cajaFuerteBalance;

  // Compute time remaining for Dead Man's Switch
  const timeRemainingDays = cajaFuerte
    ? Math.max(
        0,
        Math.ceil(
          ((new Date(cajaFuerte.last_activity_at).getTime() + cajaFuerte.dead_man_timeout_seconds * 1000) - Date.now()) /
            (1000 * 60 * 60 * 24)
        )
      )
    : 90;

  const activityItems = decisions ? mapDecisionsToActivityItems(decisions) : [];
  const unreadAlerts = alertsData?.unreadCount ?? 0;

  // -- Handlers --
  async function handleAutonomyChange(level: AutonomyLevel) {
    setAutonomyLevel(level); // optimistic update
    await updateAutonomy(level);
  }

  async function handleKillSwitch() {
    setAutonomyLevel("asistente"); // optimistic update
    await activateKillSwitch();
  }

  // Evita quedar colgado si Supabase o la red no responden (skeleton infinito).
  const [loadTimedOut, setLoadTimedOut] = useState(false);
  useEffect(() => {
    const id = window.setTimeout(() => setLoadTimedOut(true), 14_000);
    return () => window.clearTimeout(id);
  }, []);

  const isLoading =
    (profileLoading || walletsLoading || cajaLoading) && !loadTimedOut;

  if (isLoading) {
    return (
      <div className="app-bg flex min-h-screen">
        <Sidebar />
        <main className="flex-1 pl-[72px] lg:pl-[240px]">
          <TopBar unreadAlerts={0} />
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Skeleton className="h-28" />
              <Skeleton className="h-28" />
              <Skeleton className="h-28" />
            </div>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="space-y-6">
                <Skeleton className="h-56" />
                <Skeleton className="h-48" />
              </div>
              <Skeleton className="h-[420px]" />
              <Skeleton className="h-64" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="app-bg flex min-h-screen">
      <Sidebar />

      <main className="flex-1 pl-[72px] lg:pl-[240px]">
        <TopBar unreadAlerts={unreadAlerts} />

        <div className="p-5 md:px-8 md:pb-10 md:pt-8 lg:px-10">
          <div className="mx-auto max-w-6xl space-y-10">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
              className="border-b border-line pb-8"
            >
              <p className="section-label">Panel principal</p>
              <h1 className="mt-2 text-display font-semibold tracking-tight text-ink">
                Inicio
              </h1>
              <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-ink-muted">
                Visualizá tu posición consolidada, el trabajo del asistente y los
                límites de autonomía. Los montos reflejan datos conectados a tu
                cuenta cuando hay backend activo.
              </p>
            </motion.div>

            {/* Balance Cards */}
            <BalanceCards
              walletBalance={walletBalance}
              cajaFuerteBalance={cajaFuerteBalance}
              yieldEarned={yieldEarned}
            />

            {/* Main Grid: Autonomy + Activity + Yield + DeadMan + AgentChat */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Left column: Autonomy + Yield */}
              <div className="space-y-6">
                <AutonomySlider
                  value={autonomyLevel}
                  onChange={handleAutonomyChange}
                />
                <YieldBreakdown totalDeposited={totalDeposited} />
              </div>

              {/* Center: Activity Feed */}
              <div className="lg:col-span-1">
                <ActivityFeed
                  items={activityItems}
                  loading={decisionsLoading}
                />
              </div>

              {/* Right: Dead Man's Switch + Agent Chat */}
              <div className="space-y-6">
                <DeadManStatus
                  lastActivityAt={cajaFuerte?.last_activity_at}
                  timeoutDays={timeRemainingDays}
                  heredero1={cajaFuerte?.herederos?.[0]?.address ?? undefined}
                  heredero2={cajaFuerte?.herederos?.[1]?.address ?? undefined}
                />
                <AgentChat walletAddress={walletAddress} />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Kill Switch - always visible when autonomy > asistente */}
      <KillSwitch
        onActivate={handleKillSwitch}
        isVisible={autonomyLevel !== "asistente"}
      />
    </div>
  );
}
