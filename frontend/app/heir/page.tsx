"use client";

import { useEffect, useState } from "react";
import { VaultShell } from "@/components/vault/VaultShell";
import {
  VaultCard,
  VaultPillButton,
  VaultMascot,
} from "@/components/vault/VaultPrimitives";
import { useVaultFlow } from "@/context/VaultFlowContext";
import { formatEth } from "@/lib/utils";

/** Renders DD : HH : MM : SS */
function formatDHMS(totalSeconds: number) {
  const d = Math.floor(totalSeconds / 86400);
  const h = Math.floor((totalSeconds % 86400) / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return [d, h, m, s]
    .map((n) => n.toString().padStart(2, "0"))
    .join(" : ");
}

export default function HeirInterfacePage() {
  const { vaultBalanceEth, heirFundsUnlocked, setHeirFundsUnlocked } =
    useVaultFlow();
  /* 3d 15h 45m 45s like mock 00:03:15:45 when shown as DD:HH:MM:SS */
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

  return (
    <VaultShell title="Heir Interface">
      <div className="flex flex-col items-stretch gap-10 lg:flex-row lg:justify-between">
        <VaultCard className="max-w-xl flex-1 text-center lg:text-left">
          <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">
            Owner Inactivity Time
          </p>
          <p className="font-mono text-3xl font-bold tabular-nums tracking-tight text-[#1e4d3a] sm:text-4xl md:text-5xl">
            {formatDHMS(secondsLeft)}
          </p>
          <p className="mt-8 text-sm font-medium text-slate-600">
            Current safe funds status:
          </p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {formatEth(vaultBalanceEth)}
          </p>
          <VaultPillButton
            className="mt-8"
            disabled={!heirFundsUnlocked}
            onClick={() =>
              window.alert("Demo: simulated withdrawal to your wallet.")
            }
          >
            Withdraw Funds
          </VaultPillButton>
          <p className="mt-3 text-xs text-slate-500">
            Available after owner inactivity time exceeds threshold.
          </p>
        </VaultCard>
        <div className="flex justify-center lg:items-start lg:pt-4">
          <VaultMascot />
        </div>
      </div>
    </VaultShell>
  );
}
