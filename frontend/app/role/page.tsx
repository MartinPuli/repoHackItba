"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSignMessage } from "wagmi";
import { useUnifiedWallet } from "@/hooks/useUnifiedWallet";
import { VaultShell } from "@/components/vault/VaultShell";
import { VaultGreenBarButton } from "@/components/vault/VaultPrimitives";
import { Landmark, FileKey, ShieldUser, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function RoleSelectionPage() {
  const router = useRouter();
  const { address, isConnected, isLemon } = useUnifiedWallet();
  const { signMessageAsync } = useSignMessage();
  const {
    session,
    loading: authLoading,
    hasStrongbox,
    isGuardian,
    isRecoverer,
    signIn,
  } = useAuth();

  const [signingIn, setSigningIn] = useState(false);
  const [signInError, setSignInError] = useState<string | null>(null);

  // Guard: only attempt sign-in ONCE per address.
  // Prevents the infinite loop: fail → signingIn=false → effect re-fires → ask signature again
  const signInAttempted = useRef<string | null>(null);

  useEffect(() => {
    if (!isConnected) {
      router.replace("/connect");
    }
  }, [isConnected, router]);

  const signInRef = useRef(signIn);
  signInRef.current = signIn;
  const signMsgRef = useRef(signMessageAsync);
  signMsgRef.current = signMessageAsync;
  const didAttemptSignIn = useRef(false);

  useEffect(() => {
    if (
      isConnected &&
      address &&
      !isLemon &&
      !session &&
      !authLoading &&
      !signingIn &&
      !didAttemptSignIn.current
    ) {
      didAttemptSignIn.current = true;
      setSigningIn(true);
      setSignInError(null);
      signInRef.current(address, signMsgRef.current)
        .catch((err) => {
          setSignInError(
            err instanceof Error ? err.message : "Sign-in failed"
          );
        })
        .finally(() => setSigningIn(false));
    }
  }, [isConnected, address, isLemon, session, authLoading, signingIn]);

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
        <div className="mb-5 flex items-center gap-2.5 rounded-xl border border-line bg-white px-4 py-3 text-sm text-ink-muted shadow-card-rest">
          <Loader2 className="h-4 w-4 animate-spin text-brand" />
          {signingIn
            ? "Sign the message in your wallet…"
            : "Loading session…"}
        </div>
      )}

      {signInError && (
        <p className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {signInError}
        </p>
      )}

      <p className="text-[15px] leading-relaxed text-ink-muted">
        How do you want to participate in this vault?
      </p>

      <div className="mt-6 space-y-3">
        <div className="animate-fade-in-up" style={{ animationDelay: "0ms" }}>
          <VaultGreenBarButton
            icon={<Landmark className="h-5 w-5" strokeWidth={2} />}
            onClick={handleCreateSafe}
            disabled={isLoading}
          >
            {hasStrongbox ? "My Safe" : "Create Safe"}
          </VaultGreenBarButton>
        </div>

        <div className="animate-fade-in-up" style={{ animationDelay: "80ms" }}>
          <VaultGreenBarButton
            icon={<ShieldUser className="h-5 w-5" strokeWidth={2} />}
            onClick={() => router.push("/guardian")}
            disabled={isLoading}
          >
            Guardian Dashboard
            {isGuardian === false && (
              <span className="ml-auto rounded-full border border-line px-2 py-0.5 text-[10px] font-medium text-ink-ghost">
                Not assigned
              </span>
            )}
          </VaultGreenBarButton>
        </div>

        <div
          className="animate-fade-in-up"
          style={{ animationDelay: "160ms" }}
        >
          <VaultGreenBarButton
            icon={<FileKey className="h-5 w-5" strokeWidth={2} />}
            onClick={() => router.push("/recoverer")}
            disabled={isLoading}
          >
            Recovery Dashboard
            {isRecoverer === false && (
              <span className="ml-auto rounded-full border border-line px-2 py-0.5 text-[10px] font-medium text-ink-ghost">
                Not assigned
              </span>
            )}
          </VaultGreenBarButton>
        </div>
      </div>

      {!isLoading && session && isGuardian === null && isRecoverer === null && (
        <p className="mt-5 rounded-lg bg-surface-muted px-3 py-2 text-xs text-ink-faint">
          Could not check your roles — the API may be unavailable. You can still
          try accessing each dashboard.
        </p>
      )}
    </VaultShell>
  );
}
