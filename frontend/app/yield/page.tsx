"use client";

import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatBlock } from "@/components/ui/StatBlock";
import { formatPercent, formatUSD } from "@/lib/utils";
import { ArrowRight, Layers, Loader2 } from "lucide-react";
import {
  DEMO_USER_ID,
  useYieldPositions,
  useAlerts,
} from "@/hooks/useSupabase";

const steps = [
  {
    title: "Colateral en Venus (BSC)",
    body: "USDT como colateral para liquidez barata y estable.",
    tone: "text-brand",
    bg: "bg-brand/10",
  },
  {
    title: "Puente hacia Rootstock",
    body: "Exposición a rBTC y rendimientos del ecosistema Bitcoin.",
    tone: "text-growth",
    bg: "bg-growth/10",
  },
  {
    title: "Fee del agente",
    body: "Un slice acotado premia la orquestación automática.",
    tone: "text-agent",
    bg: "bg-agent/10",
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
        title="Yield"
        description="Flujo BSC → Rootstock explicado sin ruido. Datos en tiempo real desde Supabase."
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
              <h2 className="text-[11px] font-medium uppercase tracking-[0.12em] text-ink-faint">
                Posiciones activas
              </h2>
              <div className="grid gap-3">
                {positions!.map((pos) => (
                  <div key={pos.id} className="glass-card flex items-center justify-between p-4">
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
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <div className="mt-8 space-y-4">
        <h2 className="text-[11px] font-medium uppercase tracking-[0.12em] text-ink-faint">
          Pipeline
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          {steps.map((s, i) => (
            <div
              key={s.title}
              className="glass-card relative overflow-hidden p-5"
            >
              <div
                className={`mb-3 inline-flex rounded-lg px-2 py-1 text-[11px] font-semibold ${s.bg} ${s.tone}`}
              >
                Paso {i + 1}
              </div>
              <h3 className="text-sm font-semibold text-ink">{s.title}</h3>
              <p className="mt-2 text-xs text-ink-muted leading-relaxed">
                {s.body}
              </p>
              {i < steps.length - 1 && (
                <ArrowRight className="absolute right-4 top-1/2 hidden h-4 w-4 -translate-y-1/2 text-ink-faint md:block" />
              )}
            </div>
          ))}
        </div>

        <div className="glass-card flex items-start gap-4 p-5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-muted ring-1 ring-line">
            <Layers className="h-5 w-5 text-ink-muted" strokeWidth={2} />
          </div>
          <div>
            <p className="text-sm font-medium text-ink">Riesgos y límites</p>
            <p className="mt-1 text-xs text-ink-muted leading-relaxed">
              Smart contracts en testnet, sin garantía de retorno. El agente
              respeta topes de autonomía y puede cortarse con el Kill Switch.
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
