"use client";

import { useAccount, useSwitchChain } from "wagmi";
import { bscTestnet } from "wagmi/chains";
import { AlertTriangle, ArrowRightLeft, Loader2 } from "lucide-react";
import { useState, useEffect, useRef, type ReactNode } from "react";

const TARGET_CHAIN_ID = bscTestnet.id; // 97

/**
 * Wraps children and blocks UI when the wallet is on the wrong chain.
 *
 * - If not connected or chainId not yet resolved → renders children (no flash)
 * - If on wrong chain → auto-attempts switch once, then shows manual button
 * - Debounces 600ms to avoid flickering during wagmi's connection settle
 */
export function ChainGuard({ children }: { children: ReactNode }) {
  const { isConnected, chainId } = useAccount();
  const { switchChain, isPending } = useSwitchChain();
  const [error, setError] = useState<string | null>(null);
  const [showGuard, setShowGuard] = useState(false);
  const autoSwitchAttempted = useRef(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isWrongChain =
    isConnected && chainId !== undefined && chainId !== TARGET_CHAIN_ID;

  // Debounce: only show the guard after the wrong chain persists for 600ms.
  // This prevents the flash when wagmi is still settling or AppKit is auto-switching.
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
      debounceTimer.current = null;
    }

    if (isWrongChain) {
      debounceTimer.current = setTimeout(() => {
        setShowGuard(true);
      }, 600);
    } else {
      setShowGuard(false);
      autoSwitchAttempted.current = false;
    }

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [isWrongChain]);

  // Auto-switch once when wrong chain is detected
  useEffect(() => {
    if (showGuard && !autoSwitchAttempted.current && switchChain) {
      autoSwitchAttempted.current = true;
      switchChain(
        { chainId: TARGET_CHAIN_ID },
        {
          onError() {
            // Auto-switch failed silently — user will see the manual button
          },
        }
      );
    }
  }, [showGuard, switchChain]);

  // Don't block: not connected, chainId still resolving, or on correct chain
  if (!showGuard) {
    return <>{children}</>;
  }

  function handleSwitch() {
    setError(null);
    switchChain(
      { chainId: TARGET_CHAIN_ID },
      {
        onError(err) {
          setError(
            err instanceof Error ? err.message : "Failed to switch network"
          );
        },
      }
    );
  }

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-canvas px-5">
      <div className="w-full max-w-sm space-y-6 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-warning-light">
          <AlertTriangle className="h-8 w-8 text-amber-600" />
        </div>

        <div>
          <h2 className="text-xl font-extrabold text-ink">Wrong Network</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-muted">
            Vaultix runs on <strong>BSC Testnet</strong>. Your wallet is
            connected to chain {chainId}.
          </p>
          <p className="mt-1 text-xs text-ink-faint">
            Please switch to BSC Testnet (chain 97) to continue.
          </p>
        </div>

        {error && (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-600">
            {error}
          </p>
        )}

        <button
          onClick={handleSwitch}
          disabled={isPending}
          className="flex w-full items-center justify-center gap-2.5 rounded-xl bg-brand px-6 py-4 text-[15px] font-semibold text-white shadow-brand-md transition-all hover:bg-primary-dark hover:shadow-glow active:scale-[0.97] disabled:opacity-60"
        >
          {isPending ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Switching…
            </>
          ) : (
            <>
              <ArrowRightLeft className="h-5 w-5" />
              Switch to BSC Testnet
            </>
          )}
        </button>
      </div>
    </div>
  );
}
