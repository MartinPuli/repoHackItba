"use client";

import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatBlock } from "@/components/ui/StatBlock";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { formatUSD } from "@/lib/utils";
import { ArrowDownLeft, ArrowUpRight, QrCode, Wallet } from "lucide-react";

export default function WalletPage() {
  const available = 1250.32;

  return (
    <AppShell topTitle="Liquidez diaria" unreadAlerts={0}>
      <PageHeader
        title="Wallet"
        description="Gastos del día a día y envíos. Desde acá movés fondos hacia comercios, contactos o la Caja fuerte."
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
        <div className="glass-card p-6">
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
        </div>

        <div className="glass-card p-6">
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
          <PrimaryButton variant="outline">Depositar en Caja fuerte</PrimaryButton>
        </div>
      </div>
    </AppShell>
  );
}
