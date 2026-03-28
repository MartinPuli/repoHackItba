"use client";

import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatBlock } from "@/components/ui/StatBlock";
import { formatPercent, formatUSD } from "@/lib/utils";
import { ArrowRight, Layers } from "lucide-react";

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
  return (
    <AppShell topTitle="Estrategia de rendimiento" unreadAlerts={0}>
      <PageHeader
        title="Yield"
        description="Flujo BSC → Rootstock explicado sin ruido. Los números de demo ayudan a contar la historia en el pitch."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatBlock
          label="APY neto estimado"
          value={formatPercent(4.1)}
          hint="Después de costos y fees"
        />
        <StatBlock
          label="Depositado en estrategia"
          value={formatUSD(4830)}
          hint="Caja fuerte"
        />
        <StatBlock
          label="Estado"
          value="Activa"
          hint="Simulación hackathon"
        />
      </div>

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
