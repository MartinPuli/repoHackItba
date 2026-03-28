"use client";

import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatBlock } from "@/components/ui/StatBlock";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { formatUSD } from "@/lib/utils";
import { Lock, RefreshCw, Shield, Users, HeartPulse, ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import { motion } from "framer-motion";

export default function CajaFuertePage() {
  return (
    <AppShell topTitle="Bóveda de ahorro" unreadAlerts={0}>
      <PageHeader
        title="Caja fuerte"
        description="Ahorros a largo plazo, estrategia de yield y capa de herencia. Solo tu wallet de gastos puede mover fondos."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatBlock
          label="Balance en bóveda"
          value={formatUSD(4830)}
          hint="Incluye posiciones DeFi simuladas"
        />
        <StatBlock
          label="LTV colateral"
          value="68.2%"
          hint="Venus · dentro de rango seguro"
        />
        <StatBlock
          label="Último reset"
          value="Hoy"
          hint="Dead Man's Switch"
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        {/* Movimientos */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-6 lg:col-span-2"
        >
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-vault/12 text-vault">
              <Shield className="h-5 w-5" strokeWidth={2} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-ink">Movimientos</h2>
              <p className="text-xs text-ink-muted">
                Depósitos y retiros vía contrato Wallet.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <PrimaryButton className="gap-2">
              <ArrowDownToLine className="h-4 w-4" strokeWidth={2} />
              Depositar desde Wallet
            </PrimaryButton>
            <PrimaryButton variant="outline" className="gap-2">
              <ArrowUpFromLine className="h-4 w-4" strokeWidth={2} />
              Retirar a Wallet
            </PrimaryButton>
          </div>

          {/* Simulated vault history */}
          <div className="mt-6 space-y-2">
            <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-ink-faint">
              Últimos movimientos
            </p>
            {[
              { label: "Depósito", amount: "+250 USDT", when: "Hace 2h", color: "text-growth" },
              { label: "Retiro parcial", amount: "-80 USDT", when: "Hace 3d", color: "text-ink" },
              { label: "Depósito", amount: "+500 USDT", when: "Hace 1 sem", color: "text-growth" },
            ].map((m, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-xl bg-surface-muted/60 px-4 py-2.5 ring-1 ring-line"
              >
                <div>
                  <p className="text-sm font-medium text-ink">{m.label}</p>
                  <p className="text-[11px] text-ink-faint">{m.when}</p>
                </div>
                <span className={`text-sm font-semibold tabular-nums ${m.color}`}>
                  {m.amount}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Herencia card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card flex flex-col p-6"
        >
          <div className="mb-3 flex items-center gap-2 text-vault">
            <HeartPulse className="h-4 w-4" strokeWidth={2} />
            <span className="text-[11px] font-semibold uppercase tracking-[0.12em]">
              Herencia
            </span>
          </div>
          <p className="text-sm text-ink-muted leading-relaxed">
            Registrar actividad reinicia el temporizador del Dead Man&apos;s
            Switch.
          </p>

          <div className="mt-4 space-y-2">
            <div className="flex items-center gap-2 text-xs text-ink-faint">
              <Users className="h-3.5 w-3.5" />
              <span>2 herederos configurados</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-ink-faint">
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Timeout: 90 días</span>
            </div>
          </div>

          <PrimaryButton variant="ghost" className="mt-auto gap-2 self-start pt-4">
            <Lock className="h-4 w-4" strokeWidth={2} />
            resetTime()
          </PrimaryButton>
        </motion.div>
      </div>
    </AppShell>
  );
}
