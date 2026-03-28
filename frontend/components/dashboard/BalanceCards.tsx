"use client";

import { cn, formatUSD, formatPercent } from "@/lib/utils";
import { Wallet, Shield, TrendingUp, Zap } from "lucide-react";
import { motion } from "framer-motion";

interface BalanceCardProps {
  title: string;
  value: string;
  change?: number;
  icon: React.ReactNode;
  color: string;
  glowClass: string;
}

function BalanceCard({
  title,
  value,
  change,
  icon,
  color,
  glowClass,
}: BalanceCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("glass-card p-5 transition-all duration-300 hover:scale-[1.02]", glowClass)}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-white/40">
          {title}
        </span>
        <div className={cn("rounded-lg p-2", `bg-${color}/10`)}>{icon}</div>
      </div>
      <div className="mt-3">
        <span className="text-2xl font-bold tabular-nums text-white">
          {value}
        </span>
        {change !== undefined && (
          <span
            className={cn(
              "ml-2 text-sm font-medium",
              change >= 0 ? "text-accent-green" : "text-accent-red"
            )}
          >
            {formatPercent(change)}
          </span>
        )}
      </div>
    </motion.div>
  );
}

interface BalanceCardsProps {
  walletBalance?: number;
  cajaFuerteBalance?: number;
  yieldEarned?: number;
  agentStatus?: "active" | "idle" | "paused";
}

export function BalanceCards({
  walletBalance = 0,
  cajaFuerteBalance = 0,
  yieldEarned = 0,
  agentStatus = "idle",
}: BalanceCardsProps) {
  const totalBalance = walletBalance + cajaFuerteBalance;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <BalanceCard
        title="Balance Total"
        value={formatUSD(totalBalance)}
        change={2.34}
        icon={<Wallet className="h-4 w-4 text-indigo-400" />}
        color="indigo-400"
        glowClass="glow-purple"
      />
      <BalanceCard
        title="Wallet (Liquidez)"
        value={formatUSD(walletBalance)}
        icon={<Wallet className="h-4 w-4 text-accent-cyan" />}
        color="accent-cyan"
        glowClass=""
      />
      <BalanceCard
        title="Caja Fuerte"
        value={formatUSD(cajaFuerteBalance)}
        icon={<Shield className="h-4 w-4 text-accent-green" />}
        color="accent-green"
        glowClass="glow-green"
      />
      <BalanceCard
        title="Yield Acumulado"
        value={formatUSD(yieldEarned)}
        change={5.3}
        icon={<TrendingUp className="h-4 w-4 text-accent-green" />}
        color="accent-green"
        glowClass=""
      />
    </div>
  );
}
