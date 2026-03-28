"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { BalanceCards } from "@/components/dashboard/BalanceCards";
import { AutonomySlider } from "@/components/dashboard/AutonomySlider";
import { KillSwitch } from "@/components/dashboard/KillSwitch";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { DeadManStatus } from "@/components/dashboard/DeadManStatus";
import { YieldBreakdown } from "@/components/dashboard/YieldBreakdown";
import { AgentChat } from "@/components/dashboard/AgentChat";
import { useState, useEffect } from "react";

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
} from "@/hooks/useSupabase";
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
  compliance: "compliance",
  execute: "execute",
  yield: "yield",
  alert: "alert",
  deadman: "deadman",
  kill_switch_activated: "alert",
  rebalance: "yield",
  deposit: "execute",
  withdraw: "execute",
  swap: "execute",
  send: "execute",
};

const STATUS_MAP: Record<string, "success" | "pending" | "warning"> = {
  executed: "success",
  approved: "success",
  pending: "pending",
  rejected: "warning",
  reverted: "warning",
};

function mapDecisionsToActivityItems(decisions: AgentDecision[]): ActivityItem[] {
  return decisions.map((d) => ({
    id: d.id,
    type: ACTION_TYPE_MAP[d.action] ?? "analysis",
    message: d.description,
    timestamp: d.created_at,
    status: STATUS_MAP[d.status] ?? "pending",
    canRevert: d.status === "executed" && d.action !== "kill_switch_activated",
  }));
}

// ---------------------------------------------------------------------------
// Skeleton pulse component for loading states
// ---------------------------------------------------------------------------
function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-white/5 ${className}`}
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

  // Derive primary wallet address for yield positions query
  const primaryWallet = wallets?.[0];
  const walletAddress = primaryWallet?.address;
  const { data: yieldPositions } = useYieldPositions(walletAddress);

  // -- Local autonomy state, synced from Supabase profile --
  const [autonomyLevel, setAutonomyLevel] = useState<AutonomyLevel>("asistente");

  useEffect(() => {
    if (profile?.autonomy_level) {
      setAutonomyLevel(profile.autonomy_level);
    }
  }, [profile?.autonomy_level]);

  // -- Derived values (fallback to 0 / empty when Supabase has no data) --
  const walletBalance = primaryWallet?.balance_usd ?? 0;
  const cajaFuerteBalance = cajaFuerte?.balance_usd ?? 0;

  // Sum yield earned across active positions
  const yieldEarned =
    yieldPositions?.reduce(
      (sum, pos) => sum + (pos.current_value - pos.amount_deposited),
      0
    ) ?? 0;

  const totalDeposited =
    yieldPositions?.reduce((sum, pos) => sum + pos.amount_deposited, 0) ??
    cajaFuerteBalance;

  // Compute time remaining for Dead Man's Switch
  const timeRemainingDays = cajaFuerte
    ? Math.max(
        0,
        Math.ceil(
          (new Date(cajaFuerte.time_limit).getTime() - Date.now()) /
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

  // -- Loading skeleton --
  const isLoading = profileLoading || walletsLoading || cajaLoading;

  if (isLoading) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 pl-[72px] lg:pl-[240px]">
          <TopBar unreadAlerts={0} />
          <div className="p-6 space-y-6">
            {/* Balance cards skeleton */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Skeleton className="h-28" />
              <Skeleton className="h-28" />
              <Skeleton className="h-28" />
            </div>
            {/* Main grid skeleton */}
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
    <div className="flex min-h-screen">
      <Sidebar />

      <main className="flex-1 pl-[72px] lg:pl-[240px]">
        <TopBar unreadAlerts={unreadAlerts} />

        <div className="p-6 space-y-6">
          {/* Balance Cards */}
          <BalanceCards
            walletBalance={walletBalance}
            cajaFuerteBalance={cajaFuerteBalance}
            yieldEarned={yieldEarned}
          />

          {/* Main Grid: Autonomy + Activity + Yield + DeadMan */}
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
                lastActivityAt={cajaFuerte?.last_activity}
                timeoutDays={timeRemainingDays}
                heredero1={cajaFuerte?.heir_guardian_1 ?? undefined}
                heredero2={cajaFuerte?.heir_guardian_2 ?? undefined}
              />
              <AgentChat walletAddress={walletAddress} />
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
