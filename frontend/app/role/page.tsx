"use client";

import { useRouter } from "next/navigation";
import { VaultShell } from "@/components/vault/VaultShell";
import { VaultGreenBarButton, VaultMascot } from "@/components/vault/VaultPrimitives";
import { Landmark, FileKey, ShieldUser } from "lucide-react";

export default function RoleSelectionPage() {
  const router = useRouter();

  return (
    <VaultShell title="Role Selection">
      <div className="flex flex-col items-stretch gap-10 lg:flex-row lg:items-start lg:justify-between">
        <div className="mx-auto w-full max-w-lg flex-1 space-y-4">
          <p className="mb-2 text-[15px] text-slate-600">
            Select how you want to participate in the safe workflow.
          </p>
          <VaultGreenBarButton
            icon={<Landmark className="h-6 w-6" strokeWidth={2} />}
            onClick={() => router.push("/safe/configure")}
          >
            Create Safe
          </VaultGreenBarButton>
          <VaultGreenBarButton
            icon={<FileKey className="h-6 w-6" strokeWidth={2} />}
            onClick={() => router.push("/heir")}
          >
            Become Heir
          </VaultGreenBarButton>
          <VaultGreenBarButton
            icon={<ShieldUser className="h-6 w-6" strokeWidth={2} />}
            onClick={() => router.push("/guardian")}
          >
            Become Guardian
          </VaultGreenBarButton>
        </div>
        <div className="flex justify-center lg:sticky lg:top-28 lg:self-start">
          <VaultMascot />
        </div>
      </div>
    </VaultShell>
  );
}
