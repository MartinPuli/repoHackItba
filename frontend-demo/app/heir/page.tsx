"use client";

import { useState } from "react";
import { VaultShell } from "@/components/vault/VaultShell";
import {
  VaultCard,
  VaultPillButton,
} from "@/components/vault/VaultPrimitives";
import { Clock, KeyRound, Loader2, Check } from "lucide-react";

export default function HeirInterfacePage() {
  const [busy, setBusy] = useState(false);
  const [recovered, setRecovered] = useState(false);

  const handleRecover = () => {
    setBusy(true);
    setTimeout(() => {
      setRecovered(true);
      setBusy(false);
    }, 1500);
  };

  return (
    <VaultShell title="Recovery Dashboard" backHref="/role">
      <p className="text-[15px] leading-relaxed text-ink-muted">
        Manage the vaults where you are assigned as a recovery contact (heir).
      </p>

      <div className="mt-6 space-y-4">
        <VaultCard>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Vault (Slot 1)
              </p>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                recovered ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"
              }`}>
                {recovered ? "Recovered" : "Assigned"}
              </span>
            </div>

            <div className="grid gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Contract:</span>
                <span className="font-mono font-semibold">0xDem...0V4u</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-slate-500">Recovery Share:</span>
                <span className="font-mono text-xs">100%</span>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-3 py-2 mt-2">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-red-500" />
                  <span className="text-xs font-medium text-red-700">
                    Countdown
                  </span>
                </div>
                <span className="font-mono text-xs font-bold text-red-700">
                  Ready to recover!
                </span>
              </div>
            </div>

            {recovered ? (
               <p className="mt-2 rounded-lg bg-emerald-50 px-3 py-2 text-center text-sm font-medium text-emerald-700">
                 ✓ Recovery executed successfully!
               </p>
            ) : (
              <VaultPillButton
                className="w-full gap-2"
                onClick={handleRecover}
                disabled={busy}
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" strokeWidth={2.5} />}
                {busy ? "Processing…" : "Execute Recovery"}
              </VaultPillButton>
            )}
          </div>
        </VaultCard>
      </div>
    </VaultShell>
  );
}
