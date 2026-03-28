"use client";

import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/ui/PageHeader";
import { cn, formatUSD } from "@/lib/utils";
import { ArrowDownLeft, ArrowUpRight, CheckCircle2, Clock } from "lucide-react";

const rows = [
  {
    id: "tx-1",
    title: "Depósito a Caja fuerte",
    sub: "Wallet → CajaFuerte · BSC",
    amount: -250,
    when: "Hace 2 h",
    status: "done" as const,
  },
  {
    id: "tx-2",
    title: "Aprobación compliance",
    sub: "UIF / CNV · Co-piloto",
    amount: 0,
    when: "Hace 5 h",
    status: "done" as const,
  },
  {
    id: "tx-3",
    title: "Sugerencia de rebalanceo",
    sub: "Pendiente de tu OK",
    amount: 0,
    when: "Hace 8 h",
    status: "pending" as const,
  },
];

export default function TransactionsPage() {
  return (
    <AppShell topTitle="Movimientos y auditoría" unreadAlerts={0}>
      <PageHeader
        title="Transacciones"
        description="Historial claro de lo que moviste y de lo que el agente preparó o ejecutó según tu nivel de autonomía."
      />

      <div className="glass-card overflow-hidden">
        <div className="border-b border-line px-5 py-4">
          <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-ink-faint">
            Recientes
          </p>
        </div>
        <ul className="divide-y divide-line">
          {rows.map((r) => (
            <li
              key={r.id}
              className="flex flex-col gap-3 px-5 py-4 transition-colors hover:bg-surface-hover/40 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex min-w-0 items-start gap-3">
                <div
                  className={cn(
                    "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1 ring-line",
                    r.amount < 0
                      ? "bg-vault/10 text-vault"
                      : r.amount > 0
                        ? "bg-growth/10 text-growth"
                        : "bg-surface-muted text-ink-muted"
                  )}
                >
                  {r.amount < 0 ? (
                    <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
                  ) : r.amount > 0 ? (
                    <ArrowDownLeft className="h-4 w-4" strokeWidth={2} />
                  ) : r.status === "pending" ? (
                    <Clock className="h-4 w-4" strokeWidth={2} />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" strokeWidth={2} />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink">{r.title}</p>
                  <p className="text-xs text-ink-muted">{r.sub}</p>
                  <p className="mt-1 text-[11px] text-ink-faint sm:hidden">
                    {r.when}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-6 pl-12 sm:pl-0">
                <span className="hidden text-xs text-ink-faint sm:inline">
                  {r.when}
                </span>
                <span
                  className={cn(
                    "text-sm font-semibold tabular-nums",
                    r.amount < 0 && "text-ink",
                    r.amount > 0 && "text-growth",
                    r.amount === 0 && "text-ink-muted"
                  )}
                >
                  {r.amount === 0 ? "—" : formatUSD(Math.abs(r.amount))}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </AppShell>
  );
}
