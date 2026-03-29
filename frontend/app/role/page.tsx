"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAccount, useSignMessage } from "wagmi";
import { VaultShell } from "@/components/vault/VaultShell";
import { VaultGreenBarButton } from "@/components/vault/VaultPrimitives";
import { Landmark, FileKey, ShieldUser, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function RoleSelectionPage() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const {
    session,
    loading: authLoading,
    hasStrongbox,
    isGuardian,
    isHeir,
    signIn,
  } = useAuth();

  const [signingIn, setSigningIn] = useState(false);
  const [signInError, setSignInError] = useState<string | null>(null);

  // Redirect to connect if not connected
  useEffect(() => {
    if (!isConnected) {
      router.replace("/connect");
    }
  }, [isConnected, router]);

  // Auto sign-in when connected but no session
  useEffect(() => {
    if (isConnected && address && !session && !authLoading && !signingIn) {
      setSigningIn(true);
      setSignInError(null);
      signIn(address, signMessageAsync)
        .catch((err) => {
          setSignInError(
            err instanceof Error ? err.message : "Error al iniciar sesión",
          );
        })
        .finally(() => setSigningIn(false));
    }
  }, [isConnected, address, session, authLoading, signingIn, signIn, signMessageAsync]);

  function handleCreateSafe() {
    if (hasStrongbox) {
      router.push("/safe/owner");
    } else {
      router.push("/safe/configure");
    }
  }

  if (!isConnected) return null;

  const isLoading = authLoading || signingIn;

  return (
    <VaultShell
      title="Choose your role"
      backHref="/"
      step={{ current: 2, total: 4 }}
    >
      {isLoading && (
        <div className="mb-4 flex items-center gap-2 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          {signingIn ? "Sign the message in your wallet…" : "Loading session…"}
        </div>
      )}

      {signInError && (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
          {signInError}
        </p>
      )}

      <p className="text-[15px] leading-relaxed text-ink-muted">
        How do you want to participate in this vault?
      </p>

      <div className="mt-6 space-y-3">
        {/* Owner / Create Safe — always visible */}
        <VaultGreenBarButton
          icon={<Landmark className="h-5 w-5" strokeWidth={2} />}
          onClick={handleCreateSafe}
          disabled={isLoading}
        >
          {hasStrongbox ? "My Safe" : "Create Safe"}
        </VaultGreenBarButton>

        {/* Guardian — show always, let the page handle auth */}
        <VaultGreenBarButton
          icon={<ShieldUser className="h-5 w-5" strokeWidth={2} />}
          onClick={() => router.push("/guardian")}
          disabled={isLoading}
        >
          Guardian Dashboard
          {isGuardian === false && (
            <span className="ml-auto text-[11px] font-normal text-ink-faint">
              Not assigned
            </span>
          )}
        </VaultGreenBarButton>

        {/* Heir / Recovery — show always, let the page handle auth */}
        <VaultGreenBarButton
          icon={<FileKey className="h-5 w-5" strokeWidth={2} />}
          onClick={() => router.push("/heir")}
          disabled={isLoading}
        >
          Recovery Dashboard
          {isHeir === false && (
            <span className="ml-auto text-[11px] font-normal text-ink-faint">
              Not assigned
            </span>
          )}
        </VaultGreenBarButton>
      </div>

      {!isLoading && session && isGuardian === null && isHeir === null && (
        <p className="mt-4 text-xs text-ink-faint">
          Could not check your roles — the API may be unavailable. You can still
          try accessing each dashboard.
        </p>
      )}
    </VaultShell>
  );
}
