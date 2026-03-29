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
import { getRecovererVaults } from "@/lib/api/client";
import { formatAddress } from "@/lib/utils";
import { Loader2, Clock, Coins, Lock, Unlock } from "lucide-react";

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
      <span className="rounded-xl bg-surface-muted px-3 py-2 font-mono text-2xl font-extrabold tabular-nums text-ink sm:text-3xl sm:px-4 sm:py-3">
        {value.toString().padStart(2, "0")}
      </span>
      <span className="mt-1.5 text-[10px] font-bold uppercase tracking-widest text-ink-ghost">
        {label}
      </span>
    </div>
  );
}

function TimeSeparator() {
  return (
    <span className="mt-[-14px] text-lg font-light text-ink-ghost animate-pulse-glow">
      :
    </span>
  );
}

interface RecovererVault {
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

export default function RecovererInterfacePage() {
  const { session, loading: authLoading } = useAuth();
  const { inherit, isPending: inheritTxPending } = useInheritStrongBox();

  const [vaults, setVaults] = useState<RecovererVault[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionBusy, setActionBusy] = useState(false);
  const [now, setNow] = useState(Math.floor(Date.now() / 1000));

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
      const res = await getRecovererVaults(session.access_token);
      setVaults(res.vaults as RecovererVault[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load vaults");
    } finally {
      setLoading(false);
    }
  }, [session?.access_token]);

  useEffect(() => {
    void loadVaults();
  }, [loadVaults]);

  async function handleClaim(vault: RecovererVault) {
    if (
      !vault.strongboxes.contract_address ||
      !isAddress(vault.strongboxes.contract_address)
    ) {
      setError("Vault has no on-chain contract");
      return;
    }
    setActionBusy(true);
    setError(null);
    try {
      const contractAddr = getAddress(
        vault.strongboxes.contract_address
      ) as Address;
      await inherit({ strongBoxAddress: contractAddr });
      await loadVaults();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Failed to claim funds"
      );
    } finally {
      setActionBusy(false);
    }
  }

  if (authLoading) {
    return (
      <VaultShell title="Recovery Dashboard" backHref="/role">
        <p className="text-sm text-ink-muted">Loading session…</p>
      </VaultShell>
    );
  }

  if (!session) {
    return (
      <VaultShell title="Recovery Dashboard" backHref="/role">
        <VaultCard>
          <p className="text-ink-muted">
            You need to sign in to view your assigned vaults.
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
        <p
          className="mt-4 rounded-xl border border-danger/20 bg-danger-light px-4 py-3 text-sm text-red-600"
          role="alert"
        >
          {error}
        </p>
      )}

      <div className="mt-6 space-y-5">
        {loading && (
          <VaultCard>
            <div className="flex items-center gap-3 py-6 text-ink-muted">
              <Loader2 className="h-5 w-5 animate-spin text-brand" />
              Loading vaults…
            </div>
          </VaultCard>
        )}

        {!loading && vaults.length === 0 && (
          <VaultCard>
            <div className="flex flex-col items-center py-10 text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-light">
                <Clock className="h-6 w-6 text-brand" />
              </div>
              <p className="text-sm font-medium text-ink-muted">
                You're not a recovery contact for any vault yet
              </p>
              <p className="mt-1 text-xs text-ink-ghost">
                Assigned vaults will appear here.
              </p>
            </div>
          </VaultCard>
        )}

        {vaults.map((vault) => {
          const sb = vault.strongboxes;
          const lastActivity = Math.floor(
            new Date(sb.last_activity_at).getTime() / 1000
          );
          const unlockTime = lastActivity + sb.time_limit_seconds;
          const secondsLeft = Math.max(0, unlockTime - now);
          const canClaim = secondsLeft === 0 && sb.is_deployed;
          const time = formatDHMS(secondsLeft);

          return (
            <VaultCard key={vault.strongbox_id} className="animate-fade-in-up">
              <div className="space-y-5">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-ink-faint">
                    <div
                      className={`h-1.5 w-1.5 rounded-full ${canClaim ? "bg-brand" : "bg-ink-ghost"}`}
                    />
                    Vault — Slot {vault.slot} ({vault.share_percentage}%)
                  </div>
                  <span
                    className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${
                      canClaim
                        ? "border-brand/20 bg-primary-light text-brand"
                        : "border-line bg-surface-muted text-ink-ghost"
                    }`}
                  >
                    {canClaim ? (
                      <Unlock className="h-3 w-3" />
                    ) : (
                      <Lock className="h-3 w-3" />
                    )}
                    {canClaim ? "Claimable" : "Locked"}
                  </span>
                </div>

                {sb.contract_address && (
                  <p className="rounded-lg border border-line bg-surface-muted px-3 py-1.5 font-mono text-xs text-ink-faint">
                    Contract: {formatAddress(sb.contract_address, 6)}
                  </p>
                )}

                {/* Countdown */}
                <div>
                  <p className="mb-3 text-xs font-bold uppercase tracking-wider text-ink-faint">
                    {canClaim
                      ? "Recovery Available!"
                      : "Owner Inactivity Countdown"}
                  </p>
                  {canClaim ? (
                    <div className="flex items-center justify-center gap-3 rounded-xl border border-brand/20 bg-primary-light py-6">
                      <Unlock className="h-8 w-8 text-brand" />
                      <div>
                        <p className="text-lg font-bold text-brand">
                          Recovery Available
                        </p>
                        <p className="text-xs text-ink-muted">
                          You can claim your {vault.share_percentage}% share
                          now.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2 sm:gap-4">
                      <TimeBlock value={time.d} label="Days" />
                      <TimeSeparator />
                      <TimeBlock value={time.h} label="Hours" />
                      <TimeSeparator />
                      <TimeBlock value={time.m} label="Min" />
                      <TimeSeparator />
                      <TimeBlock value={time.s} label="Sec" />
                    </div>
                  )}
                </div>

                {sb.balance_native && (
                  <div className="flex items-center gap-3 rounded-xl border border-line bg-surface-muted px-4 py-3">
                    <Coins className="h-4 w-4 text-ink-faint" />
                    <div>
                      <p className="text-xs text-ink-muted">Vault Balance</p>
                      <p className="text-base font-bold tabular-nums">
                        {Number(sb.balance_native).toFixed(6)} BNB
                      </p>
                    </div>
                  </div>
                )}

                <VaultPillButton
                  disabled={!canClaim || actionBusy || inheritTxPending}
                  onClick={() => void handleClaim(vault)}
                >
                  {inheritTxPending || actionBusy ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Claiming…
                    </>
                  ) : canClaim ? (
                    <>
                      <Coins className="h-4 w-4" />
                      Claim Funds
                    </>
                  ) : (
                    <>
                      <Lock className="h-4 w-4" />
                      Waiting for inactivity…
                    </>
                  )}
                </VaultPillButton>
              </div>
            </VaultCard>
          );
        })}
      </div>
    </VaultShell>
  );
}
