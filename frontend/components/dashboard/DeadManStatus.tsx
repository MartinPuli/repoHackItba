"use client";

import { cn } from "@/lib/utils";
import { Clock, HeartPulse, Users } from "lucide-react";

interface DeadManStatusProps {
  lastActivityAt?: string;
  timeoutDays?: number;
  heredero1?: string;
  heredero2?: string;
  recoveryState?: "inactive" | "pending" | "executed";
}

export function DeadManStatus({
  lastActivityAt = new Date().toISOString(),
  timeoutDays = 90,
  heredero1,
  heredero2,
  recoveryState = "inactive",
}: DeadManStatusProps) {
  const lastActivity = new Date(lastActivityAt);
  const now = new Date();
  const daysSince = Math.floor(
    (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24)
  );
  const daysRemaining = Math.max(0, timeoutDays - daysSince);
  const progress = Math.min(daysSince / timeoutDays, 1);

  const statusColor =
    progress < 0.5
      ? "text-accent-green"
      : progress < 0.8
        ? "text-accent-yellow"
        : "text-accent-red";

  const barColor =
    progress < 0.5
      ? "bg-accent-green"
      : progress < 0.8
        ? "bg-accent-yellow"
        : "bg-accent-red";

  return (
    <div className="glass-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="section-label">Herencia · temporizador</h3>
        <div className="flex items-center gap-2">
          <HeartPulse
            className={cn(
              "h-4 w-4",
              recoveryState === "inactive"
                ? "text-growth"
                : "text-accent-red"
            )}
          />
          <span className={cn("text-xs font-medium", statusColor)}>
            {recoveryState === "inactive"
              ? "Activo"
              : recoveryState === "pending"
                ? "Recuperación Pendiente"
                : "Ejecutado"}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-3">
        <div className="mb-1.5 flex justify-between text-xs text-ink-faint">
          <span>Última actividad: {daysSince}d</span>
          <span>{daysRemaining}d restantes</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-surface-muted ring-1 ring-line">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              barColor
            )}
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      </div>

      {/* Herederos */}
      <div className="mt-4 space-y-2">
        <div className="flex items-center gap-2 text-xs text-ink-faint">
          <Users className="h-3.5 w-3.5" />
          <span>Herederos designados</span>
        </div>
        <div className="space-y-1.5">
          {[heredero1, heredero2].map((addr, i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-xl bg-surface-muted px-3 py-2 ring-1 ring-line"
            >
              <span className="text-xs text-ink-muted">
                Heredero {i + 1}
              </span>
              <span className="font-mono text-xs text-ink-faint">
                {addr
                  ? `${addr.slice(0, 6)}...${addr.slice(-4)}`
                  : "No asignado"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
