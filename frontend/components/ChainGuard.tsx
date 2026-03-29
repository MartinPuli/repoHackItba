"use client";

import { useAccount, useSwitchChain } from "wagmi";
import { bscTestnet } from "wagmi/chains";
import { AlertTriangle, ArrowRightLeft, Loader2 } from "lucide-react";
import { useState, type ReactNode } from "react";

const TARGET_CHAIN_ID = bscTestnet.id; // 97

/**
 * Wraps children and shows a full-screen prompt when the wallet is
 * connected to a chain other than BSC Testnet.
 *
 * If the wallet is NOT connected at all, children render normally
 * (the connect page handles that case).
 */
export function ChainGuard({ children }: { children: ReactNode }) {
  const { isConnected, chainId } = useAccount();
  const { switchChain, isPending } = useSwitchChain();
  const [error, setError] = useState<string | null>(null);

  // Not connected or already on the right chain → pass through
  if (!isConnected || chainId === TARGET_CHAIN_ID) {
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
            connected to a different network (chain {chainId}).
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

        <p className="text-[11px] text-ink-ghost">
          This will ask your wallet to switch to BSC Testnet (chain 97).
        </p>
      </div>
    </div>
  );
}
