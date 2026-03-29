"use client";

import { VaultShell } from "@/components/vault/VaultShell";
import {
  VaultCard,
  VaultPillButton,
  VaultDangerButton,
} from "@/components/vault/VaultPrimitives";
import { useVaultFlow } from "@/context/VaultFlowContext";
import { formatAddress } from "@/lib/utils";
import { Check } from "lucide-react";

export default function GuardianInterfacePage() {
  const { vaultOwnerAddress } = useVaultFlow();
  const short = formatAddress(vaultOwnerAddress, 4);

  return (
    <VaultShell title="Guardian" backHref="/role">
      <p className="text-[15px] leading-relaxed text-ink-muted">
        You have been designated as a guardian for this vault.
      </p>

      <VaultCard className="mt-6">
        <div className="rounded-xl border border-line bg-surface-muted px-4 py-3.5 text-center text-[15px] font-medium text-ink sm:text-left">
          Wallet{" "}
          <span className="font-mono font-semibold text-brand">
            {short}
          </span>{" "}
          has designated you as a Guardian.
        </div>
        <div className="mt-6 space-y-3">
          <VaultPillButton type="button" className="gap-2">
            <Check className="h-5 w-5 shrink-0" strokeWidth={2} />
            Accept Designation
          </VaultPillButton>
          <VaultDangerButton type="button">
            Reject Designation
          </VaultDangerButton>
        </div>
        <p className="mt-5 text-xs text-ink-ghost">
          Demo only — no on-chain transaction is sent.
        </p>
      </VaultCard>
    </VaultShell>
  );
}
