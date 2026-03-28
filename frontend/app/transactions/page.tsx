"use client";

import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/ui/PageHeader";
import { cn } from "@/lib/utils";
import {
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Loader2,
  XCircle,
} from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { formatEther } from "viem";
import {
  DEMO_USER_ID,
  useCajaFuerteData,
  useTransactions,
  useAlerts,
} from "@/hooks/useSupabase";
import type { Transaction } from "@/hooks/useSupabase";

function txIcon(tx: Transaction) {
  if (tx.status === "pending") return <Clock className="h-4 w-4" strokeWidth={2} />;
  if (tx.status === "failed" || tx.status === "reverted")
    return <XCircle className="h-4 w-4" strokeWidth={2} />;
  if (tx.tx_type === "deposit") return <ArrowDownLeft className="h-4 w-4" strokeWidth={2} />;
  if (tx.tx_type === "withdraw" || tx.tx_type === "recovery")
    return <ArrowUpRight className="h-4 w-4" strokeWidth={2} />;
  return <CheckCircle2 className="h-4 w-4" strokeWidth={2} />;
}

function txIconColor(tx: Transaction) {
  if (tx.status === "failed" || tx.status === "reverted")
    return "bg-red-50 text-red-700 ring-1 ring-red-100";
  if (tx.status === "pending") return "bg-surface-muted text-ink-muted";
  if (tx.tx_type === "deposit") return "bg-growth/10 text-growth";
  return "bg-vault/10 text-vault";
}

const TX_TYPE_LABELS: Record<string, string> = {
  deposit: "Depósito",
  withdraw: "Retiro",
  recovery: "Recuperación",
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "Ahora";
  if (mins < 60) return `Hace ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Hace ${hours} h`;
  const days = Math.floor(hours / 24);
  return `Hace ${days} día${days > 1 ? "s" : ""}`;
}

function formatBnbAmount(weiStr: string): number {
  try {
    return Number.parseFloat(formatEther(BigInt(weiStr)));
  } catch {
    return 0;
  }
}

export default function TransactionsPage() {
  const { data: strongbox, loading: sbLoading } = useCajaFuerteData(DEMO_USER_ID);
  const strongboxId = strongbox?.id;
  const { data: alertsData } = useAlerts(DEMO_USER_ID);
  const unreadAlerts = alertsData?.unreadCount ?? 0;

  const { data: transactions, loading: txLoading } = useTransactions(strongboxId, 30);

  const loading = sbLoading || txLoading;
  const [filter, setFilter] = useState<"all" | "done" | "pending">("all");

  const filtered = (transactions ?? []).filter((tx) => {
    if (filter === "all") return true;
    if (filter === "done") return tx.status === "confirmed";
    if (filter === "pending") return tx.status === "pending";
    return true;
  });

  return (
    <AppShell topTitle="Historial de operaciones" unreadAlerts={unreadAlerts}>
      <PageHeader
        eyebrow="Movimientos"
        title="Transacciones"
        description="Historial desde Supabase (tabla transactions) filtrado por tu StrongBox cuando hay sesión de demo configurada."
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {(["all", "done", "pending"] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
              filter === f
                ? "bg-brand text-white"
                : "border border-line bg-white text-ink-muted hover:border-line-strong hover:text-ink",
            )}
          >
            {f === "all" ? "Todas" : f === "done" ? "Completadas" : "Pendientes"}
          </button>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card overflow-hidden"
      >
        <div className="border-b border-line px-5 py-4">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-ink-faint">
              {filtered.length} transacciones
            </p>
          </div>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-ink-muted" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-ink-muted">
            {!strongboxId
              ? "Sin StrongBox para este usuario demo, o aún no hay movimientos registrados."
              : "Sin transacciones con estos filtros."}
          </div>
        ) : (
          <ul className="divide-y divide-line">
            {filtered.map((tx, i) => {
              const isIncoming = tx.tx_type === "deposit";
              const amountBnb = formatBnbAmount(tx.amount);

              return (
                <motion.li
                  key={tx.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.02 }}
                  className="flex flex-col gap-3 px-5 py-4 transition-colors hover:bg-surface-hover/40 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <div
                      className={cn(
                        "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1 ring-line",
                        txIconColor(tx),
                      )}
                    >
                      {txIcon(tx)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-ink">
                        {TX_TYPE_LABELS[tx.tx_type] ?? tx.tx_type}
                      </p>
                      <p className="text-xs text-ink-muted truncate">
                        BNB · Chain {tx.chain_id}
                        {tx.tx_hash && ` · ${tx.tx_hash.slice(0, 10)}…`}
                      </p>
                      <p className="mt-1 text-[11px] text-ink-faint sm:hidden">
                        {timeAgo(tx.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-6 pl-12 sm:pl-0">
                    <span className="hidden text-xs text-ink-faint sm:inline">
                      {timeAgo(tx.created_at)}
                    </span>
                    <span
                      className={cn(
                        "text-sm font-semibold tabular-nums",
                        isIncoming ? "text-growth" : "text-ink",
                        amountBnb === 0 && "text-ink-muted",
                      )}
                    >
                      {amountBnb === 0
                        ? "—"
                        : `${isIncoming ? "+" : "-"}${amountBnb.toFixed(6)} BNB`}
                    </span>
                  </div>
                </motion.li>
              );
            })}
          </ul>
        )}
      </motion.div>
    </AppShell>
  );
}
