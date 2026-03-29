"use client";

import { useEffect, useState, useCallback } from "react";
import { isAddress, getAddress, type Address } from "viem";
import { VaultShell } from "@/components/vault/VaultShell";
import {
  VaultCard,
  VaultPillButton,
} from "@/components/vault/VaultPrimitives";
import { useAuth } from "@/hooks/useAuth";
import { useInheritStrongBox } from "@/hooks/useStrongBoxChain";
import { getHeirVaults } from "@/lib/api/client";
import { formatAddress } from "@/lib/utils";
import { Loader2 } from "lucide-react";

function formatDHMS(totalSeconds: number) {
  if (totalSeconds <= 0) return { d: 0, h: 0, m: 0, s: 0 };
  const d = Math.floor(totalSeconds / 86400);
  const h = Math.floor((totalSeconds % 86400) / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return { d, h, m, s };
}

function TimeBlock({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="font-mono text-3xl font-bold tabular-nums text-ink sm:text-4xl">
        {value.toString().padStart(2, "0")}
      </span>
      <span className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-ink-faint">
        {label}
      </span>
    </div>
  );
}

interface HeirVault {
  strongbox_id: string;
  slot: number;
  share_percentage: string;
  strongboxes: {
    id: string;
    contract_address: string | null;
    is_deployed: boolean;
    balance_native: string | null;
    time_limit_seconds: number;
    last_activity_at: string;
    recovery_state: string;
    recovery_unlocks_at: string | null;
  };
}

export default function HeirInterfacePage() {
  const { session, loading: authLoading } = useAuth();
  const { inherit, isPending: inheritTxPending } = useInheritStrongBox();

  const [vaults, setVaults] = useState<HeirVault[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionBusy, setActionBusy] = useState(false);
  const [now, setNow] = useState(Math.floor(Date.now() / 1000));

  // Tick every second for countdown
  useEffect(() => {
    const id = window.setInterval(() => {
      setNow(Math.floor(Date.now() / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const loadVaults = useCallback(async () => {
    if (!session?.access_token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getHeirVaults(session.access_token);
      setVaults(res.vaults as HeirVault[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar vaults");
    } finally {
      setLoading(false);
    }
  }, [session?.access_token]);

  useEffect(() => {
    void loadVaults();
  }, [loadVaults]);

  async function handleClaim(vault: HeirVault) {
    if (!vault.strongboxes.contract_address || !isAddress(vault.strongboxes.contract_address)) {
      setError("Vault no tiene contrato on-chain");
      return;
    }
    setActionBusy(true);
    setError(null);
    try {
      const contractAddr = getAddress(vault.strongboxes.contract_address) as Address;
      await inherit({ strongBoxAddress: contractAddr });
      await loadVaults();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al reclamar fondos");
    } finally {
      setActionBusy(false);
    }
  }

  if (authLoading) {
    return (
      <VaultShell title="Recovery Dashboard" backHref="/role">
        <p className="text-sm text-slate-600">Cargando sesión…</p>
      </VaultShell>
    );
  }

  if (!session) {
    return (
      <VaultShell title="Recovery Dashboard" backHref="/role">
        <VaultCard>
          <p className="text-slate-700">
            Necesitás iniciar sesión para ver tus vaults asignados.
          </p>
        </VaultCard>
      </VaultShell>
    );
  }

  return (
    <VaultShell title="Recovery Dashboard" backHref="/role">
      <p className="text-[15px] leading-relaxed text-ink-muted">
        Track owner inactivity and claim your share when the time limit expires.
      </p>

      {error && (
        <p className="mt-4 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      <div className="mt-6 space-y-4">
        {loading && (
          <VaultCard>
            <div className="flex items-center gap-3 py-4 text-slate-500">
              <Loader2 className="h-5 w-5 animate-spin" />
              Cargando vaults…
            </div>
          </VaultCard>
        )}

        {!loading && vaults.length === 0 && (
          <VaultCard>
            <p className="py-4 text-center text-sm text-slate-500">
              No sos recovery contact de ninguna vault aún.
            </p>
          </VaultCard>
        )}

        {vaults.map((vault) => {
          const sb = vault.strongboxes;
          const lastActivity = Math.floor(
            new Date(sb.last_activity_at).getTime() / 1000,
          );
          const unlockTime = lastActivity + sb.time_limit_seconds;
          const secondsLeft = Math.max(0, unlockTime - now);
          const canClaim = secondsLeft === 0 && sb.is_deployed;
          const time = formatDHMS(secondsLeft);

          return (
            <VaultCard key={vault.strongbox_id}>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                    Vault — Slot {vault.slot} ({vault.share_percentage}%)
                  </p>
                  <span
                    className={
                      canClaim
                        ? "rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800"
                        : "rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600"
                    }
                  >
                    {canClaim ? "Claimable" : "Locked"}
                  </span>
                </div>

                {sb.contract_address && (
                  <p className="font-mono text-xs text-slate-400">
                    Contract: {formatAddress(sb.contract_address, 6)}
                  </p>
                )}

                {/* Countdown */}
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-faint">
                    {canClaim
                      ? "⏰ Recovery Available!"
                      : "Owner Inactivity Countdown"}
                  </p>
                  {!canClaim && (
                    <div className="flex items-center justify-center gap-3 sm:gap-5">
                      <TimeBlock value={time.d} label="Days" />
                      <span className="mt-[-18px] text-xl font-light text-ink-faint">
                        :
                      </span>
                      <TimeBlock value={time.h} label="Hours" />
                      <span className="mt-[-18px] text-xl font-light text-ink-faint">
                        :
                      </span>
                      <TimeBlock value={time.m} label="Min" />
                      <span className="mt-[-18px] text-xl font-light text-ink-faint">
                        :
                      </span>
                      <TimeBlock value={time.s} label="Sec" />
                    </div>
                  )}
                </div>

                {sb.balance_native && (
                  <div className="border-t border-line pt-3">
                    <p className="text-sm text-slate-500">Balance</p>
                    <p className="text-lg font-bold">
                      {Number(sb.balance_native).toFixed(6)} BNB
                    </p>
                  </div>
                )}

                <VaultPillButton
                  disabled={!canClaim || actionBusy || inheritTxPending}
                  onClick={() => void handleClaim(vault)}
                >
                  {inheritTxPending || actionBusy
                    ? "Claiming…"
                    : canClaim
                      ? "Claim Funds"
                      : "Waiting for inactivity…"}
                </VaultPillButton>
              </div>
            </VaultCard>
          );
        })}
      </div>
    </VaultShell>
  );
}
