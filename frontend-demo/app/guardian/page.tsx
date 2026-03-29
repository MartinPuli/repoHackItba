"use client";

import { VaultShell } from "@/components/vault/VaultShell";
import { VaultCard } from "@/components/vault/VaultPrimitives";
import { Info } from "lucide-react";

export default function GuardianInterfacePage() {
  return (
    <VaultShell title="Guardian Dashboard" backHref="/role">
      <VaultCard>
        <div className="flex flex-col items-center justify-center p-6 text-center">
          <Info className="mb-4 h-10 w-10 text-brand" />
          <h2 className="mb-2 text-lg font-bold text-slate-800">Demo Mode: Guardian View</h2>
          <p className="text-sm text-slate-600">
            This module is simulated in the demo version. In the real app, this is where guardians would review and approve or reject withdrawal requests from vault owners via blockchain transactions.
          </p>
        </div>
      </VaultCard>
    </VaultShell>
  );
}
