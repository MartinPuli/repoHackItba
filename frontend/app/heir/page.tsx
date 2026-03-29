"use client";

import { useEffect, useState } from "react";
import { VaultShell } from "@/components/vault/VaultShell";
import {
  VaultCard,
  VaultPillButton,
} from "@/components/vault/VaultPrimitives";
import { useVaultFlow } from "@/context/VaultFlowContext";
import { formatEth } from "@/lib/utils";

function formatDHMS(totalSeconds: number) {
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

export default function HeirInterfacePage() {
  const { vaultBalanceEth, heirFundsUnlocked, setHeirFundsUnlocked } =
    useVaultFlow();
  const [secondsLeft, setSecondsLeft] = useState(
    3 * 86400 + 15 * 3600 + 45 * 60 + 45
  );

  useEffect(() => {
    if (heirFundsUnlocked) return undefined;
    const id = window.setInterval(() => {
      setSecondsLeft((t) => (t > 0 ? t - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, [heirFundsUnlocked]);

  useEffect(() => {
    if (secondsLeft === 0 && !heirFundsUnlocked) {
      setHeirFundsUnlocked(true);
    }
  }, [secondsLeft, heirFundsUnlocked, setHeirFundsUnlocked]);

  const time = formatDHMS(secondsLeft);

  return (
    <VaultShell title="Recovery" backHref="/role">
      <p className="text-[15px] leading-relaxed text-ink-muted">
        Track owner inactivity and claim funds when the time limit expires.
      </p>

      <VaultCard className="mt-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
          Owner Inactivity Countdown
        </p>

        {/* Countdown timer */}
        <div className="mt-5 flex items-center justify-center gap-3 sm:gap-5">
          <TimeBlock value={time.d} label="Days" />
          <span className="mt-[-18px] text-xl font-light text-ink-faint">:</span>
          <TimeBlock value={time.h} label="Hours" />
          <span className="mt-[-18px] text-xl font-light text-ink-faint">:</span>
          <TimeBlock value={time.m} label="Min" />
          <span className="mt-[-18px] text-xl font-light text-ink-faint">:</span>
          <TimeBlock value={time.s} label="Sec" />
        </div>

        <div className="mt-8 border-t border-line pt-5">
          <p className="text-sm font-medium text-ink-muted">
            Current safe funds
          </p>
          <p className="mt-1 text-2xl font-bold text-ink">
            {formatEth(vaultBalanceEth)}
          </p>
        </div>

        <VaultPillButton
          className="mt-6"
          disabled={!heirFundsUnlocked}
          onClick={() =>
            window.alert("Demo: simulated withdrawal to your wallet.")
          }
        >
          Withdraw Funds
        </VaultPillButton>
        <p className="mt-3 text-center text-xs text-ink-ghost">
          Available after owner inactivity time exceeds threshold.
        </p>
      </VaultCard>
    </VaultShell>
  );
}
