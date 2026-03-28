"use client";

import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatBlock } from "@/components/ui/StatBlock";
import { formatPercent, formatUSD } from "@/lib/utils";
import { ArrowRight, Layers, Loader2, Shield, Zap, Globe } from "lucide-react";
import { motion } from "framer-motion";
import {
  DEMO_USER_ID,
  useYieldPositions,
  useAlerts,
} from "@/hooks/useSupabase";

const steps = [
  {
    title: "Colateral en Venus (BSC)",
    body: "Depositás USDT como colateral en Venus Protocol. Esto genera liquidez barata y estable para la estrategia cross-chain.",
    detail: "APY colateral: ~4.0%",
    tone: "text-brand",
    bg: "bg-brand/10",
    icon: <Shield className="h-4 w-4" />,
  },
  {
    title: "Puente hacia Rootstock",
    body: "Los fondos se puentean a Rootstock para obtener exposición a rBTC y rendimientos del ecosistema Bitcoin.",
    detail: "APY Rootstock: ~10.0%",
    tone: "text-growth",
    bg: "bg-growth/10",
    icon: <Globe className="h-4 w-4" />,
  },
  {
    title: "Fee del agente",
    body: "Un slice acotado del spread premia la orquestación automática. El usuario se queda con el 80% del rendimiento neto.",
    detail: "Fee agente: 5% del neto",
    tone: "text-agent",
    bg: "bg-agent/10",
    icon: <Zap className="h-4 w-4" />,
  },
] as const;

export default function YieldPage() {
  const { data: positions, loading } = useYieldPositions(DEMO_USER_ID);
  const { data: alertsData } = useAlerts(DEMO_USER_ID);
  const unreadAlerts = alertsData?.unreadCount ?? 0;

  // Compute real stats from Supabase yield_positions
  const totalDeposited = positions?.reduce((sum, p) => sum + (p.amount_usd ?? 0), 0) ?? 0;
  const weightedApy =
    positions && positions.length > 0
      ? positions.reduce((sum, p) => sum + p.apy_current * (p.amount_usd ?? 0), 0) / totalDeposited
      : 0;
  const hasActivePositions = positions && positions.length > 0;

  return (
    <AppShell topTitle="Estrategia de rendimiento" unreadAlerts={unreadAlerts}>
      <PageHeader
        eyebrow="Inversiones"
        title="Rendimientos"
        description="Estrategia BSC → Rootstock con datos de posiciones cuando Supabase está configurado. Sin garantía de retorno: uso educativo y demo."
      />

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-ink-muted" />
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatBlock
              label="APY neto estimado"
              value={formatPercent(weightedApy)}
              hint="Promedio ponderado por monto"
            />
            <StatBlock
              label="Depositado en estrategia"
              value={formatUSD(totalDeposited)}
              hint="Total en posiciones activas"
            />
            <StatBlock
              label="Estado"
              value={hasActivePositions ? "Activa" : "Sin posiciones"}
              hint={
                hasActivePositions
                  ? `${positions!.length} posición${positions!.length > 1 ? "es" : ""} activa${positions!.length > 1 ? "s" : ""}`
                  : "Invertí para arrancar"
              }
            />
          </div>

          {/* Active positions from Supabase */}
          {hasActivePositions && (
            <div className="mt-8 space-y-4">
              <h2 className="section-label">Posiciones activas</h2>
              <div className="grid gap-3">
                {positions!.map((pos) => (
                  <motion.div 
                    key={pos.id} 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-card flex items-center justify-between p-4"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-ink">{pos.protocol}</p>
                      <p className="text-xs text-ink-muted">
                        {pos.amount} {pos.token_symbol} · {pos.position_type ?? "lending"} · Chain {pos.chain_id}
                      </p>
                    </div>
                    <div className="text-right shrink-0 pl-4">
                      <p className="text-sm font-semibold tabular-nums text-growth">
                        {formatPercent(pos.apy_current)} APY
                      </p>
                      <p className="text-xs text-ink-muted tabular-nums">
                        {formatUSD(pos.amount_usd ?? 0)}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <div className="mt-8 space-y-6">
        <h2 className="section-label">Cómo funciona la estrategia</h2>

        {/* Pipeline steps */}
        <div className="grid gap-4 md:grid-cols-3">
          {steps.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.4 }}
              className="glass-card relative overflow-hidden p-5"
            >
              <div className="mb-3 flex items-center gap-2">
                <div
                  className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-semibold ${s.bg} ${s.tone}`}
                >
                  {s.icon}
                  Paso {i + 1}
                </div>
              </div>
              <h3 className="text-sm font-semibold text-ink">{s.title}</h3>
              <p className="mt-2 text-xs text-ink-muted leading-relaxed">
                {s.body}
              </p>
              <p className={`mt-3 text-[11px] font-semibold ${s.tone}`}>
                {s.detail}
              </p>
              {i < steps.length - 1 && (
                <ArrowRight className="absolute right-4 top-1/2 hidden h-4 w-4 -translate-y-1/2 text-ink-faint md:block" />
              )}
            </motion.div>
          ))}
        </div>

        {/* Risk card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card flex items-start gap-4 p-5"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-yellow/10 ring-1 ring-accent-yellow/20">
            <Layers className="h-5 w-5 text-accent-yellow" strokeWidth={2} />
          </div>
          <div>
            <p className="text-sm font-medium text-ink">Riesgos y límites</p>
            <p className="mt-1 text-xs text-ink-muted leading-relaxed">
              Smart contracts en testnet, sin garantía de retorno. El agente
              respeta topes de autonomía y puede cortarse con el Kill Switch
              en cualquier momento.
            </p>
          </div>
        </motion.div>
      </div>
    </AppShell>
  );
}
