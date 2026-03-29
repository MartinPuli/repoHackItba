"use client";

import { useState } from "react";
import { VaultShell } from "@/components/vault/VaultShell";
import {
  VaultCard,
  VaultPillButton,
  VaultDangerButton,
} from "@/components/vault/VaultPrimitives";
import { Check, X, Loader2 } from "lucide-react";

export default function GuardianInterfacePage() {
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<"pending" | "approved" | "rejected">("pending");

  const handleAction = (type: "approved" | "rejected") => {
    setBusy(true);
    setTimeout(() => {
      setStatus(type);
      setBusy(false);
    }, 1500);
  };

  return (
    <VaultShell title="Guardian Dashboard" backHref="/role">
      <p className="text-[15px] leading-relaxed text-ink-muted">
        Review and approve or reject withdrawal requests from vault owners.
      </p>

      <div className="mt-6 space-y-4">
        <VaultCard>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Withdrawal Request
              </p>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                status === "pending" ? "bg-amber-100 text-amber-900" 
                : status === "approved" ? "bg-emerald-100 text-emerald-900"
                : "bg-red-100 text-red-900"
              }`}>
                {status === "pending" ? "Pending" : status === "approved" ? "Approved" : "Rejected"}
              </span>
            </div>

            <div className="grid gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Amount:</span>
                <span className="font-mono font-semibold">1.50 BNB</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">To:</span>
                <span className="font-mono text-xs">0x71C...97Fb</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Vault:</span>
                <span className="font-mono text-xs">0xDem...0V4u</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Guardian 1 (You):</span>
                <span
                  className={
                    status === "approved"
                      ? "text-emerald-600 font-semibold"
                      : status === "rejected"
                      ? "text-red-600 font-semibold"
                      : "text-slate-400"
                  }
                >
                  {status === "approved" ? "✓ Approved" : status === "rejected" ? "✗ Rejected" : "Pending"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Guardian 2:</span>
                <span className="text-slate-400">
                  Pending
                </span>
              </div>
            </div>

            {status !== "pending" ? (
              <p className={`mt-2 rounded-lg px-3 py-2 text-center text-sm font-medium ${
                status === "approved" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
              }`}>
                ✓ You have {status} this request.
              </p>
            ) : (
              <div className="mt-3 flex gap-3">
                <VaultPillButton
                  className="flex-1 gap-2"
                  onClick={() => handleAction("approved")}
                  disabled={busy}
                >
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" strokeWidth={2.5} />}
                  {busy ? "Processing…" : "Approve"}
                </VaultPillButton>
                <VaultDangerButton
                  className="flex-1"
                  onClick={() => handleAction("rejected")}
                  disabled={busy}
                >
                  <X className="h-4 w-4" strokeWidth={2.5} />
                  {busy ? "Processing…" : "Reject"}
                </VaultDangerButton>
              </div>
            )}
          </div>
        </VaultCard>
      </div>
    </VaultShell>
  );
}
