"use client";

import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/ui/PageHeader";
import { cn } from "@/lib/utils";
import { Bell, Globe, Shield, Sparkles } from "lucide-react";
import { useState } from "react";

const toggles = [
  {
    id: "notif",
    icon: Bell,
    title: "Notificaciones",
    desc: "Push y email para alertas del agente y herencia.",
  },
  {
    id: "chain",
    icon: Globe,
    title: "Red por defecto",
    desc: "BSC Testnet para la demo; Rootstock como extensión.",
  },
  {
    id: "sec",
    icon: Shield,
    title: "Sesión y claves",
    desc: "Revocar session keys y ver dispositivos (próximamente).",
  },
  {
    id: "exp",
    icon: Sparkles,
    title: "UI compacta",
    desc: "Menos aire entre bloques en mobile.",
  },
] as const;

function ToggleRow({
  title,
  description,
  icon: Icon,
  on,
  onToggle,
}: {
  title: string;
  description: string;
  icon: typeof Bell;
  on: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-start gap-4 py-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-muted ring-1 ring-line">
        <Icon className="h-5 w-5 text-ink-muted" strokeWidth={1.75} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-ink">{title}</p>
        <p className="mt-0.5 text-xs text-ink-muted leading-relaxed">
          {description}
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        onClick={onToggle}
        className={cn(
          "relative mt-1 h-7 w-12 shrink-0 rounded-full transition-colors",
          on ? "bg-brand/40" : "bg-surface-muted ring-1 ring-line"
        )}
      >
        <span
          className={cn(
            "absolute top-1 h-5 w-5 rounded-full bg-ink shadow-sm transition-[left,background-color]",
            on ? "left-6 bg-brand" : "left-1 bg-ink-muted"
          )}
        />
      </button>
    </div>
  );
}

export default function SettingsPage() {
  const [flags, setFlags] = useState<Record<string, boolean>>({
    notif: true,
    chain: true,
    sec: false,
    exp: false,
  });

  return (
    <AppShell topTitle="Preferencias" unreadAlerts={0}>
      <PageHeader
        title="Configuración"
        description="Ajustes esenciales sin laberintos de menús."
      />

      <div className="glass-card divide-y divide-line px-5">
        {toggles.map((t) => (
          <ToggleRow
            key={t.id}
            icon={t.icon}
            title={t.title}
            description={t.desc}
            on={flags[t.id] ?? false}
            onToggle={() => setFlags((f) => ({ ...f, [t.id]: !f[t.id] }))}
          />
        ))}
      </div>

      <p className="mt-6 text-center text-[11px] text-ink-faint">
        Smart Wallet Agent-First · Hackathon ITBA
      </p>
    </AppShell>
  );
}
