"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAccount } from "@/context/DemoMockContext";
import { VaultShell } from "@/components/vault/VaultShell";
import { VaultGreenBarButton } from "@/components/vault/VaultPrimitives";
import { Landmark, FileKey, ShieldUser } from "lucide-react";

export default function RoleSelectionPage() {
  const router = useRouter();
  const { isConnected } = useAccount();

  // Redirect to connect if not connected
  useEffect(() => {
    if (!isConnected) {
      router.replace("/");
    }
  }, [isConnected, router]);

  if (!isConnected) return null;

  return (
    <VaultShell
      title="Choose your role"
      backHref="/"
      step={{ current: 2, total: 4 }}
    >
      <p className="text-[15px] leading-relaxed text-ink-muted">
        How do you want to participate in this vault?
      </p>

      <div className="mt-6 space-y-3">
        {/* Owner / Create Safe — Demo: always assume has strongbox */}
        <VaultGreenBarButton
          icon={<Landmark className="h-5 w-5" strokeWidth={2} />}
          onClick={() => router.push("/safe/owner")}
        >
          My Safe
        </VaultGreenBarButton>

        {/* Guardian — Demo Mode */}
        <VaultGreenBarButton
          icon={<ShieldUser className="h-5 w-5" strokeWidth={2} />}
          onClick={() => router.push("/guardian")}
        >
          Guardian Dashboard
        </VaultGreenBarButton>

        {/* Heir / Recovery — Demo Mode */}
        <VaultGreenBarButton
          icon={<FileKey className="h-5 w-5" strokeWidth={2} />}
          onClick={() => router.push("/heir")}
        >
          Recovery Dashboard
        </VaultGreenBarButton>
      </div>

    </VaultShell>
  );
}

