"use client";

import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/ui/PageHeader";
import { cn } from "@/lib/utils";
import { Bell, Globe, Shield, Sparkles, Sliders, Users } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  DEMO_USER_ID,
  useAlerts,
  useUserProfile,
} from "@/hooks/useSupabase";
import { getSupabaseBrowser } from "@/lib/supabase/client";

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

const DEFAULT_FLAGS: Record<string, boolean> = {
  notif: true,
  chain: true,
  sec: false,
  exp: false,
};

function ToggleRow({
  title,
  description,
  icon: Icon,
  on,
  onToggle,
  saving,
}: {
  title: string;
  description: string;
  icon: typeof Bell;
  on: boolean;
  onToggle: () => void;
  saving: boolean;
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
        disabled={saving}
        className={cn(
          "relative mt-1 h-7 w-12 shrink-0 rounded-full transition-colors",
          on ? "bg-brand" : "bg-surface-muted ring-1 ring-line"
        )}
      >
        <span
          className={cn(
            "absolute top-1 h-5 w-5 rounded-full shadow-sm transition-[left,background-color]",
            on ? "left-6 bg-white" : "left-1 bg-ink-faint"
          )}
        />
      </button>
    </div>
  );
}

export default function SettingsPage() {
  const { data: profile } = useUserProfile(DEMO_USER_ID);
  const { data: alertsData } = useAlerts(DEMO_USER_ID);
  const unreadAlerts = alertsData?.unreadCount ?? 0;

  const [flags, setFlags] = useState<Record<string, boolean>>(DEFAULT_FLAGS);
  const [saving, setSaving] = useState(false);

  // Load preferences from Supabase user profile
  useEffect(() => {
    if (profile) {
      const stored = (profile as unknown as Record<string, unknown>).preferences as
        | Record<string, boolean>
        | undefined;
      if (stored && typeof stored === "object") {
        setFlags((prev) => ({ ...prev, ...stored }));
      }
    }
  }, [profile]);

  // Persist toggle change to Supabase
  const handleToggle = useCallback(
    async (id: string) => {
      const newFlags = { ...flags, [id]: !flags[id] };
      setFlags(newFlags);
      setSaving(true);

      try {
        const supabase = getSupabaseBrowser();
        if (!supabase) {
          // Modo local: preferencias solo en memoria
          return;
        }
        const { error: upErr } = await supabase
          .from("users")
          .update({
            preferences: newFlags,
            updated_at: new Date().toISOString(),
          })
          .eq("id", DEMO_USER_ID);
        if (upErr) throw upErr;
      } catch {
        // Revert on error
        setFlags(flags);
      } finally {
        setSaving(false);
      }
    },
    [flags]
  );

  return (
    <AppShell topTitle="Preferencias de cuenta" unreadAlerts={unreadAlerts}>
      <PageHeader
        eyebrow="Cuenta"
        title="Configuración"
        description="Preferencias de la aplicación. Con Supabase configurado, los cambios se sincronizan con tu perfil."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main settings */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card divide-y divide-line px-5 lg:col-span-2"
        >
          {toggles.map((t) => (
            <ToggleRow
              key={t.id}
              icon={t.icon}
              title={t.title}
              description={t.desc}
              on={flags[t.id] ?? false}
              saving={saving}
              onToggle={() => handleToggle(t.id)}
            />
          ))}
        </motion.div>

        {/* Sidebar cards */}
        <div className="space-y-4">
          <motion.div
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card p-5"
          >
            <div className="flex items-center gap-2 text-brand">
              <Sliders className="h-4 w-4" strokeWidth={2} />
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em]">
                Límites
              </p>
            </div>
            <div className="mt-3 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-ink-muted">Tx diario máx.</span>
                <span className="font-semibold text-ink">$500</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-ink-muted">Auto-rebalanceo</span>
                <span className="font-semibold text-ink">±10%</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-ink-muted">Session Key TTL</span>
                <span className="font-semibold text-ink">24h</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card p-5"
          >
            <div className="flex items-center gap-2 text-vault">
              <Users className="h-4 w-4" strokeWidth={2} />
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em]">
                Herederos
              </p>
            </div>
            <div className="mt-3 space-y-1.5">
              {[
                { label: "Heredero 1", addr: "0x1234...5678" },
                { label: "Heredero 2", addr: "0xabcd...efab" },
              ].map((h) => (
                <div
                  key={h.label}
                  className="flex items-center justify-between rounded-lg bg-surface-muted px-3 py-2 ring-1 ring-line"
                >
                  <span className="text-xs text-ink-muted">{h.label}</span>
                  <span className="font-mono text-[10px] text-ink-faint">
                    {h.addr}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      <p className="mt-8 text-center text-[11px] text-ink-faint">
        Smart Wallet Agent-First · Hackathon ITBA
      </p>
    </AppShell>
  );
}
