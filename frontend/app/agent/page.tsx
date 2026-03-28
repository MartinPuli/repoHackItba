"use client";

import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/ui/PageHeader";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { Bot, Send } from "lucide-react";
import { useState } from "react";

const suggestions = [
  "¿Conviene subir el colateral en Venus esta semana?",
  "Explicame el Dead Man's Switch en dos frases.",
  "Prepará un envío de 50 USDT a mi contacto frecuente.",
];

export default function AgentPage() {
  const [input, setInput] = useState("");

  return (
    <AppShell topTitle="Asistente patrimonial" unreadAlerts={0}>
      <PageHeader
        title="Agente AI"
        description="Modo asistente: el agente analiza y sugiere; vos firmás las acciones on-chain."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div
          className="glass-card flex flex-col lg:col-span-2"
          style={{ minHeight: "420px" }}
        >
          <div className="border-b border-line px-5 py-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-agent/15 text-agent">
                <Bot className="h-4 w-4" strokeWidth={2} />
              </div>
              <div>
                <p className="text-sm font-semibold text-ink">Conversación</p>
                <p className="text-[11px] text-ink-muted">
                  Respuestas de demo · sin backend en este build
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-1 flex-col justify-end gap-3 p-5">
            <div className="rounded-2xl border border-line bg-surface-muted/40 px-4 py-3">
              <p className="text-sm text-ink-muted leading-relaxed">
                Hola. Estoy listo para ayudarte con yield, compliance y envíos.
                Escribí abajo o elegí una sugerencia.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setInput(s)}
                  className="rounded-full border border-line bg-surface-muted/30 px-3 py-1.5 text-left text-[11px] text-ink-muted transition-colors hover:border-line-strong hover:text-ink"
                >
                  {s}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Preguntá o pedí una acción…"
                className="min-h-[44px] flex-1 rounded-xl border border-line bg-canvas-elevated px-4 text-sm text-ink placeholder:text-ink-faint outline-none ring-brand/0 transition-[box-shadow,border-color] focus:border-brand/40 focus:ring-2 focus:ring-brand/20"
              />
              <PrimaryButton className="shrink-0 px-4">
                <Send className="h-4 w-4" strokeWidth={2} />
              </PrimaryButton>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="glass-card p-5">
            <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-ink-faint">
              Nivel actual
            </p>
            <p className="mt-2 text-lg font-semibold text-growth">Asistente</p>
            <p className="mt-1 text-xs text-ink-muted leading-relaxed">
              Solo lectura y sugerencias. Cambiá el nivel desde el dashboard.
            </p>
          </div>
          <div className="glass-card p-5">
            <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-ink-faint">
              Compliance
            </p>
            <p className="mt-2 text-sm text-ink-muted leading-relaxed">
              En co-piloto y autónomo, las alertas UIF/CNV se procesan antes de
              ejecutar.
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
