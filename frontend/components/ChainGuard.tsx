"use client";

import { useAccount, useSwitchChain } from "wagmi";
import { bscTestnet } from "wagmi/chains";
import { AlertTriangle, ArrowRightLeft, Loader2 } from "lucide-react";
import { useState, useEffect, useRef, type ReactNode } from "react";
import { usePathname } from "next/navigation";

const TARGET_CHAIN_ID = bscTestnet.id; // 97

// Pages where we don't block for wrong chain (landing, connect)
const EXEMPT_PATHS = ["/", "/connect"];

/**
 * Wraps children and blocks UI when the wallet is on the wrong chain.
 *
 * - Landing page and connect page are exempt (user hasn't started yet)
 * - If not connected → renders children
 * - If on wrong chain → auto-attempts switch once, then shows manual button
 */
export function ChainGuard({ children }: { children: ReactNode }) {
  const { isConnected, chainId } = useAccount();
  const { switchChain, isPending } = useSwitchChain();
  const [error, setError] = useState<string | null>(null);
  const autoSwitchAttempted = useRef(false);
  const pathname = usePathname();

  const isExempt = EXEMPT_PATHS.includes(pathname);
  const isWrongChain =
    isConnected && chainId !== undefined && chainId !== TARGET_CHAIN_ID;

  // Reset auto-switch flag when chain changes to correct one
  useEffect(() => {
    if (!isWrongChain) {
      autoSwitchAttempted.current = false;
      setError(null);
    }
  }, [isWrongChain]);

  // Auto-switch once when wrong chain is detected on non-exempt pages
  useEffect(() => {
    if (isWrongChain && !isExempt && !autoSwitchAttempted.current && switchChain) {
      autoSwitchAttempted.current = true;
      switchChain(
        { chainId: TARGET_CHAIN_ID },
        {
          onError() {
            // Auto-switch failed — user will see the manual button
          },
        }
      );
    }
  }, [isWrongChain, isExempt, switchChain]);

  // Don't block: not connected, chain resolving, exempt page, or correct chain
  if (!isWrongChain || isExempt) {
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
      <div className="w-full max-w-sm space-y-6 text-center animate-fade-in">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo-verde.png"
          alt="Vaultix"
          className="mx-auto h-14 w-14"
        />

        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-warning-light">
          <AlertTriangle className="h-8 w-8 text-amber-600" />
        </div>

        <div>
          <h2 className="text-xl font-extrabold text-ink">Wrong Network</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-muted">
            Vaultix runs on <strong>BSC Testnet</strong>. Your wallet is
            connected to chain <strong>{chainId}</strong>.
          </p>
          <p className="mt-1 text-xs text-ink-faint">
            Click the button below to switch automatically.
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
