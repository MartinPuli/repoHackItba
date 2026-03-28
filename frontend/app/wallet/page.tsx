"use client";

import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatBlock } from "@/components/ui/StatBlock";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { formatUSD } from "@/lib/utils";
import {
  ArrowDownLeft,
  ArrowUpRight,
  QrCode,
  Wallet,
  Copy,
  ExternalLink,
} from "lucide-react";
import { motion } from "framer-motion";

const recentTxs = [
  { to: "0xabc1...ef23", amount: 50, when: "Hace 2h", type: "out" as const },
  { to: "0x1234...5678", amount: 120, when: "Hace 5h", type: "out" as const },
  { to: "Depósito QR", amount: 30, when: "Ayer", type: "out" as const },
];

export default function WalletPage() {
  const available = 1250.32;

  return (
    <AppShell topTitle="Cuenta de gastos" unreadAlerts={0}>
      <PageHeader
        eyebrow="Pagos"
        title="Wallet"
        description="Operá tu liquidez diaria: envíos on-chain, comercios y traslados hacia la caja fuerte cuando corresponda."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatBlock
          label="Disponible"
          value={formatUSD(available)}
          hint="En tu smart wallet (BSC testnet)"
        />
        <StatBlock
          label="Pendiente"
          value={formatUSD(0)}
          hint="Aprobaciones del co-piloto"
        />
        <StatBlock
          label="Último envío"
          value="—"
          hint="Conectá la wallet para ver historial"
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* Enviar */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-6"
        >
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand/12 text-brand">
              <ArrowUpRight className="h-5 w-5" strokeWidth={2} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-ink">Enviar</h2>
              <p className="text-xs text-ink-muted leading-relaxed">
                Transferencia on-chain o hacia off-ramp (demo).
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <PrimaryButton className="gap-2">
              <Wallet className="h-4 w-4" strokeWidth={2} />
              Nueva transferencia
            </PrimaryButton>
            <PrimaryButton variant="outline" className="gap-2">
              <QrCode className="h-4 w-4" strokeWidth={2} />
              Pago con QR
            </PrimaryButton>
          </div>
        </motion.div>

        {/* Ahorrar */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-6"
        >
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-vault/12 text-vault">
              <ArrowDownLeft className="h-5 w-5" strokeWidth={2} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-ink">Ahorrar</h2>
              <p className="text-xs text-ink-muted leading-relaxed">
                Pasá fondos a la Caja fuerte para yield y herencia.
              </p>
            </div>
          </div>
          <PrimaryButton variant="outline">
            Depositar en Caja fuerte
          </PrimaryButton>
        </motion.div>
      </div>

      {/* Recent quick-sends */}
      <div className="mt-8">
        <h2 className="mb-3 text-[11px] font-medium uppercase tracking-[0.12em] text-ink-faint">
          Envíos recientes
        </h2>
        <div className="glass-card divide-y divide-line">
          {recentTxs.map((tx, i) => (
            <div
              key={i}
              className="flex items-center justify-between px-5 py-3.5 transition-colors hover:bg-surface-hover"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand/10 text-brand">
                  <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2} />
                </div>
                <div>
                  <p className="text-sm font-medium text-ink">{tx.to}</p>
                  <p className="text-[11px] text-ink-faint">{tx.when}</p>
                </div>
              </div>
              <span className="text-sm font-semibold tabular-nums text-ink">
                -{formatUSD(tx.amount)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
