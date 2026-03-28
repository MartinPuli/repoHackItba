"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { BalanceCards } from "@/components/dashboard/BalanceCards";
import { AutonomySlider } from "@/components/dashboard/AutonomySlider";
import { KillSwitch } from "@/components/dashboard/KillSwitch";
import { ActivityFeed } from "@/components/dashboard/ActivityFeed";
import { DeadManStatus } from "@/components/dashboard/DeadManStatus";
import { YieldBreakdown } from "@/components/dashboard/YieldBreakdown";
import { useState } from "react";

type AutonomyLevel = "asistente" | "copiloto" | "autonomo";

export default function DashboardPage() {
  const [autonomyLevel, setAutonomyLevel] =
    useState<AutonomyLevel>("asistente");

  function handleKillSwitch() {
    setAutonomyLevel("asistente");
    // TODO: Revoke all session keys on-chain
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <main className="flex-1 pl-[72px] lg:pl-[240px]">
        <TopBar unreadAlerts={3} />

        <div className="p-6 space-y-6">
          {/* Balance Cards */}
          <BalanceCards
            walletBalance={1250.32}
            cajaFuerteBalance={4830.0}
            yieldEarned={186.42}
          />

          {/* Main Grid: Autonomy + Activity + Yield + DeadMan */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Left column: Autonomy + Yield */}
            <div className="space-y-6">
              <AutonomySlider
                value={autonomyLevel}
                onChange={setAutonomyLevel}
              />
              <YieldBreakdown totalDeposited={4830} />
            </div>

            {/* Center: Activity Feed */}
            <div className="lg:col-span-1">
              <ActivityFeed />
            </div>

            {/* Right: Dead Man's Switch */}
            <div>
              <DeadManStatus
                timeoutDays={90}
                heredero1="0x1234567890abcdef1234567890abcdef12345678"
                heredero2="0xabcdefabcdefabcdefabcdefabcdefabcdefabcd"
              />
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
