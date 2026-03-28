"use client";

import { cn, formatPercent, formatUSD } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface YieldBreakdownProps {
  venusAPY?: number;
  rootstockAPY?: number;
  gasCost?: number;
  bridgeCost?: number;
  totalDeposited?: number;
}

export function YieldBreakdown({
  venusAPY = 4.0,
  rootstockAPY = 10.0,
  gasCost = 0.5,
  bridgeCost = 0.2,
  totalDeposited = 1000,
}: YieldBreakdownProps) {
  const netAPY = rootstockAPY - venusAPY - gasCost - bridgeCost;
  const userAPY = netAPY * 0.8;
  const protocolAPY = netAPY * 0.15;
  const agentAPY = netAPY * 0.05;

  const annualYield = (totalDeposited * userAPY) / 100;

  return (
    <div className="glass-card p-5">
      <h3 className="mb-4 text-[11px] font-medium uppercase tracking-[0.12em] text-ink-faint">
        Yield Breakdown
      </h3>

      <div className="space-y-3">
        {/* Rootstock Yield */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-growth/10 p-1">
              <TrendingUp className="h-4 w-4 text-growth" />
            </div>
            <span className="text-sm text-ink-muted">Rootstock Yield</span>
          </div>
          <span className="text-sm font-semibold text-growth">
            {formatPercent(rootstockAPY)}
          </span>
        </div>

        {/* Venus Cost */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-accent-red/10 p-1">
              <TrendingDown className="h-4 w-4 text-accent-red" />
            </div>
            <span className="text-sm text-ink-muted">Venus Interest</span>
          </div>
          <span className="text-sm font-semibold text-accent-red">
            -{venusAPY.toFixed(1)}%
          </span>
        </div>

        {/* Gas + Bridge */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-surface-muted p-1">
              <Minus className="h-4 w-4 text-ink-faint" />
            </div>
            <span className="text-sm text-ink-muted">Gas + Bridge</span>
          </div>
          <span className="text-sm text-ink-faint">
            -{(gasCost + bridgeCost).toFixed(1)}%
          </span>
        </div>

        {/* Divider */}
        <div className="border-t border-line" />

        {/* Net APY */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-ink">
            APY Neto (usuario)
          </span>
          <span className="text-lg font-bold text-growth">
            {formatPercent(userAPY)}
          </span>
        </div>

        {/* Annual projection */}
        <div className="rounded-xl bg-growth/8 px-4 py-3 ring-1 ring-growth/15">
          <div className="flex items-center justify-between">
            <span className="text-xs text-ink-muted">
              Proyección anual ({formatUSD(totalDeposited)} depositados)
            </span>
            <span className="text-sm font-bold text-growth">
              {formatUSD(annualYield)}
            </span>
          </div>
        </div>

        {/* Fee split */}
        <div className="flex gap-2 text-[10px] text-ink-faint">
          <span>Protocolo: {protocolAPY.toFixed(2)}%</span>
          <span>·</span>
          <span>Agente: {agentAPY.toFixed(2)}%</span>
        </div>
      </div>
    </div>
  );
}
