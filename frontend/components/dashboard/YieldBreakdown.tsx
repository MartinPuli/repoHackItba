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
      <h3 className="mb-4 text-sm font-medium uppercase tracking-wider text-white/40">
        Yield Breakdown
      </h3>

      <div className="space-y-3">
        {/* Rootstock Yield */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-accent-green" />
            <span className="text-sm text-white/60">Rootstock Yield</span>
          </div>
          <span className="text-sm font-semibold text-accent-green">
            {formatPercent(rootstockAPY)}
          </span>
        </div>

        {/* Venus Cost */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-accent-red" />
            <span className="text-sm text-white/60">Venus Interest</span>
          </div>
          <span className="text-sm font-semibold text-accent-red">
            -{venusAPY.toFixed(1)}%
          </span>
        </div>

        {/* Gas + Bridge */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Minus className="h-4 w-4 text-white/30" />
            <span className="text-sm text-white/60">Gas + Bridge</span>
          </div>
          <span className="text-sm text-white/40">
            -{(gasCost + bridgeCost).toFixed(1)}%
          </span>
        </div>

        {/* Divider */}
        <div className="border-t border-white/10" />

        {/* Net APY */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-white">
            APY Neto (usuario)
          </span>
          <span className="text-lg font-bold text-accent-green">
            {formatPercent(userAPY)}
          </span>
        </div>

        {/* Annual projection */}
        <div className="rounded-lg bg-accent-green/5 px-3 py-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-white/40">
              Proyeccion anual ({formatUSD(totalDeposited)} depositados)
            </span>
            <span className="text-sm font-bold text-accent-green">
              {formatUSD(annualYield)}
            </span>
          </div>
        </div>

        {/* Fee split */}
        <div className="flex gap-2 text-[10px] text-white/30">
          <span>Protocolo: {protocolAPY.toFixed(2)}%</span>
          <span>|</span>
          <span>Agente: {agentAPY.toFixed(2)}%</span>
        </div>
      </div>
    </div>
  );
}
