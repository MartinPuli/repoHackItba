"use client";

import { useRouter } from "next/navigation";
import { VaultShell } from "@/components/vault/VaultShell";
import { VaultGreenBarButton } from "@/components/vault/VaultPrimitives";
import { Landmark, FileKey, ShieldUser } from "lucide-react";

export default function RoleSelectionPage() {
  const router = useRouter();

  return (
    <VaultShell
      title="Choose your role"
      backHref="/connect"
      step={{ current: 2, total: 4 }}
    >
      <p className="text-[15px] leading-relaxed text-ink-muted">
        How do you want to participate in this vault?
      </p>

      <div className="mt-6 space-y-3">
        <VaultGreenBarButton
          icon={<Landmark className="h-5 w-5" strokeWidth={2} />}
          onClick={() => router.push("/safe/owner")}
        >
          Create Safe
        </VaultGreenBarButton>
        <VaultGreenBarButton
          icon={<FileKey className="h-5 w-5" strokeWidth={2} />}
          onClick={() => router.push("/heir")}
        >
          Become Heir
        </VaultGreenBarButton>
        <VaultGreenBarButton
          icon={<ShieldUser className="h-5 w-5" strokeWidth={2} />}
          onClick={() => router.push("/guardian")}
        >
          Become Guardian
        </VaultGreenBarButton>
      </div>
    </VaultShell>
  );
}
