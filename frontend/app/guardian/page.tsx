"use client";

import { VaultShell } from "@/components/vault/VaultShell";
import {
  VaultCard,
  VaultPillButton,
  VaultDangerButton,
  VaultMascot,
} from "@/components/vault/VaultPrimitives";
import { useVaultFlow } from "@/context/VaultFlowContext";
import { formatAddress } from "@/lib/utils";
import { Check } from "lucide-react";

export default function GuardianInterfacePage() {
  const { vaultOwnerAddress } = useVaultFlow();
  const short = formatAddress(vaultOwnerAddress, 4);

  return (
    <VaultShell title="Guardian Interface">
      <div className="flex flex-col items-stretch gap-10 lg:flex-row lg:items-start lg:justify-between">
        <VaultCard className="max-w-xl flex-1">
          <div className="mb-8 rounded-xl border border-slate-100 bg-slate-50/90 px-5 py-4 text-center text-[16px] font-medium leading-snug text-slate-800 lg:text-left">
            Wallet{" "}
            <span className="font-mono font-semibold text-[#1e4d3a]">
              {short}
            </span>{" "}
            has designated you as a Guardian.
          </div>
          <div className="space-y-3">
            <VaultPillButton type="button" className="gap-2">
              <Check className="h-5 w-5 shrink-0" strokeWidth={2} />
              Accept Designation
            </VaultPillButton>
            <VaultDangerButton type="button">Reject Designation</VaultDangerButton>
          </div>
          <p className="mt-6 text-xs text-slate-500">
            Demo only — no on-chain transaction is sent.
          </p>
        </VaultCard>
        <div className="flex justify-center lg:pt-4">
          <VaultMascot />
        </div>
      </div>
    </VaultShell>
  );
}
