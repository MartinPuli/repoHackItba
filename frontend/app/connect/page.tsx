"use client";

import { useEffect } from "react";
import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { VaultShell } from "@/components/vault/VaultShell";
import { VaultCard } from "@/components/vault/VaultPrimitives";
import { Shield } from "lucide-react";

export default function ConnectPage() {
  const router = useRouter();
  const { isConnected } = useAccount();

  useEffect(() => {
    if (isConnected) router.replace("/role");
  }, [isConnected, router]);

  return (
    <VaultShell title="Connect your wallet" step={{ current: 1, total: 4 }}>
      <p className="text-[15px] leading-relaxed text-ink-muted">
        Connect your preferred wallet to start using your smart recovery vault.
      </p>

      <VaultCard className="mt-6">
        <div className="flex flex-col items-center py-6 text-center sm:py-10">
          <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand/10">
            <Shield className="h-7 w-7 text-brand" strokeWidth={1.75} />
          </div>

          <p className="mb-1 text-sm font-medium text-ink">
            Select a wallet
          </p>
          <p className="mb-6 text-xs text-ink-muted">
            Lemon, Binance, MetaMask, Trust Wallet y más.
          </p>

          <ConnectButton.Custom>
            {({ openConnectModal, mounted }) => {
              const ready = mounted;
              return (
                <button
                  onClick={openConnectModal}
                  disabled={!ready}
                  className="w-full rounded-xl bg-brand px-6 py-3.5 text-sm font-semibold text-white transition-all hover:bg-primary-dark active:scale-[0.98] disabled:opacity-50 sm:max-w-xs"
                >
                  Connect Wallet
                </button>
              );
            }}
          </ConnectButton.Custom>
        </div>
      </VaultCard>

      <p className="mt-4 text-center text-[11px] text-ink-ghost">
        By connecting you agree to the terms of this demo (BSC Testnet).
      </p>
    </VaultShell>
  );
}
