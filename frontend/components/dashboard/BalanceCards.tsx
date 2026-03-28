"use client";

import { cn, formatUSD, formatPercent } from "@/lib/utils";
import { Wallet, Shield, TrendingUp, Zap } from "lucide-react";
import { motion } from "framer-motion";

interface BalanceCardProps {
  title: string;
  value: string;
  change?: number;
  icon: React.ReactNode;
  accentColor: string;
  iconBg: string;
}

function BalanceCard({
  title,
  value,
  change,
  icon,
  accentColor,
  iconBg,
}: BalanceCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="glass-card group p-5 hover:scale-[1.02]"
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-ink-faint">
          {title}
        </span>
        <div
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-xl",
            iconBg
          )}
        >
          {icon}
        </div>
      </div>
      <div className="mt-3">
        <span className="text-2xl font-bold tabular-nums tracking-tight text-ink">
          {value}
        </span>
        {change !== undefined && (
          <span
            className={cn(
              "ml-2 text-sm font-semibold",
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
        icon={<Wallet className="h-4 w-4 text-brand" />}
        accentColor="brand"
        iconBg="bg-brand/12"
      />
      <BalanceCard
        title="Wallet (Liquidez)"
        value={formatUSD(walletBalance)}
        icon={<Wallet className="h-4 w-4 text-accent-cyan" />}
        accentColor="accent-cyan"
        iconBg="bg-accent-cyan/12"
      />
      <BalanceCard
        title="Caja Fuerte"
        value={formatUSD(cajaFuerteBalance)}
        icon={<Shield className="h-4 w-4 text-vault" />}
        accentColor="vault"
        iconBg="bg-vault/12"
      />
      <BalanceCard
        title="Yield Acumulado"
        value={formatUSD(yieldEarned)}
        change={5.3}
        icon={<TrendingUp className="h-4 w-4 text-growth" />}
        accentColor="growth"
        iconBg="bg-growth/12"
      />
    </div>
  );
}
