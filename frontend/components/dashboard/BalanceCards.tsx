"use client";

import { cn, formatUSD, formatPercent } from "@/lib/utils";
import { Wallet, Shield, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

interface BalanceCardProps {
  title: string;
  value: string;
  change?: number;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
}

function BalanceCard({
  title,
  value,
  change,
  icon,
  iconBg,
  iconColor,
}: BalanceCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="glass-card p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-ink-muted">{title}</p>
          <p className="mt-3 text-2xl font-semibold tabular-nums tracking-tight text-ink">
            {value}
          </p>
          {change !== undefined && (
            <p
              className={cn(
                "mt-1 text-sm font-medium tabular-nums",
                change >= 0 ? "text-growth" : "text-accent-red"
              )}
            >
              {formatPercent(change)} vs. período anterior
            </p>
          )}
        </div>
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
            iconBg
          )}
        >
          <span className={iconColor}>{icon}</span>
        </div>
      </div>
    </motion.div>
  );
}

interface BalanceCardsProps {
  walletBalance?: number;
  vaultBalance?: number;
  yieldEarned?: number;
}

export function BalanceCards({
  walletBalance = 0,
  vaultBalance = 0,
  yieldEarned = 0,
}: BalanceCardsProps) {
  const totalBalance = walletBalance + vaultBalance;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <BalanceCard
        title="Patrimonio total estimado"
        value={formatUSD(totalBalance)}
        change={2.34}
        icon={<Wallet className="h-5 w-5" strokeWidth={2} />}
        iconBg="bg-surface-muted"
        iconColor="text-brand"
      />
      <BalanceCard
        title="Wallet (disponible)"
        value={formatUSD(walletBalance)}
        icon={<Wallet className="h-5 w-5" strokeWidth={2} />}
        iconBg="bg-surface-muted"
        iconColor="text-ink"
      />
      <BalanceCard
        title="Vaultix"
        value={formatUSD(vaultBalance)}
        icon={<Shield className="h-5 w-5" strokeWidth={2} />}
        iconBg="bg-surface-muted"
        iconColor="text-vault"
      />
      <BalanceCard
        title="Rendimientos acumulados"
        value={formatUSD(yieldEarned)}
        change={5.3}
        icon={<TrendingUp className="h-5 w-5" strokeWidth={2} />}
        iconBg="bg-surface-muted"
        iconColor="text-growth"
      />
    </div>
  );
}
