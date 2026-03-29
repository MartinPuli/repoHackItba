"use client";

import { VaultShell } from "@/components/vault/VaultShell";
import { VaultCard } from "@/components/vault/VaultPrimitives";
import { Info } from "lucide-react";

export default function HeirInterfacePage() {
  return (
    <VaultShell title="Recovery Dashboard" backHref="/role">
      <VaultCard>
        <div className="flex flex-col items-center justify-center p-6 text-center">
          <Info className="mb-4 h-10 w-10 text-brand" />
          <h2 className="mb-2 text-lg font-bold text-slate-800">Demo Mode: Recovery View</h2>
          <p className="text-sm text-slate-600">
            This module is simulated in the demo version. In the real app, this is where recovery contacts (heirs) would manage inactivity checks and recover the vault if the owner is unavailable.
          </p>
        </div>
      </VaultCard>
    </VaultShell>
  );
}
