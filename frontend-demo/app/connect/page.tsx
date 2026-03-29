"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppKitAccount, useAppKit } from "@/context/DemoMockContext";
import { VaultShell } from "@/components/vault/VaultShell";
import { VaultCard } from "@/components/vault/VaultPrimitives";
import { Shield, Users, Clock } from "lucide-react";

export default function ConnectPage() {
  const router = useRouter();
  const { isConnected } = useAppKitAccount();
  const { open } = useAppKit();

  useEffect(() => {
    if (isConnected) router.replace("/role");
  }, [isConnected, router]);

  return (
    <VaultShell title="Connect your wallet" step={{ current: 1, total: 4 }} backHref="/">
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
            MetaMask, Binance, Trust Wallet, Lemon, Coinbase & more.
          </p>

          <button
            onClick={() => open()}
            className="w-full rounded-xl bg-brand px-6 py-3.5 text-sm font-semibold text-white transition-all hover:bg-primary-dark active:scale-[0.98] sm:max-w-xs"
          >
            Connect Wallet
          </button>
        </div>
      </VaultCard>

      {/* Mini feature highlights */}
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className="flex items-start gap-3 rounded-xl border border-line bg-white p-4">
          <Shield className="mt-0.5 h-4 w-4 shrink-0 text-brand" strokeWidth={2} />
          <div>
            <p className="text-xs font-semibold text-ink">Non-Custodial</p>
            <p className="mt-0.5 text-[11px] text-ink-faint">
              Your funds stay in a smart contract, not with us.
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3 rounded-xl border border-line bg-white p-4">
          <Users className="mt-0.5 h-4 w-4 shrink-0 text-brand" strokeWidth={2} />
          <div>
            <p className="text-xs font-semibold text-ink">2-of-2 Approval</p>
            <p className="mt-0.5 text-[11px] text-ink-faint">
              Two guardians must approve every withdrawal.
            </p>
          </div>
        </div>
        <div className="flex items-start gap-3 rounded-xl border border-line bg-white p-4">
          <Clock className="mt-0.5 h-4 w-4 shrink-0 text-brand" strokeWidth={2} />
          <div>
            <p className="text-xs font-semibold text-ink">Auto Recovery</p>
            <p className="mt-0.5 text-[11px] text-ink-faint">
              Recovery contacts claim funds after inactivity.
            </p>
          </div>
        </div>
      </div>

      <p className="mt-4 text-center text-[11px] text-ink-ghost">
        By connecting you agree to the terms of this demo (BSC Testnet).
      </p>
    </VaultShell>
  );
}
