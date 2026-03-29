"use client";

import { useEffect } from "react";
import { useAppKitAccount, useAppKit } from "@reown/appkit/react";
import { useRouter } from "next/navigation";
import { VaultShell } from "@/components/vault/VaultShell";
import { VaultCard } from "@/components/vault/VaultPrimitives";
import { Shield, Users, Clock, Wallet } from "lucide-react";

export default function ConnectPage() {
  const router = useRouter();
  const { isConnected } = useAppKitAccount();
  const { open } = useAppKit();

  // Redirect once connected
  useEffect(() => {
    if (isConnected) {
      router.replace("/role");
    }
  }, [isConnected, router]);

  return (
    <VaultShell
      title="Connect your wallet"
      step={{ current: 1, total: 4 }}
      backHref="/"
    >
      <p className="text-[15px] leading-relaxed text-ink-muted">
        Connect your preferred wallet to start using your smart recovery vault.
      </p>

      <VaultCard className="mt-6">
        <div className="flex flex-col items-center py-8 text-center sm:py-12">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-verde.png"
            alt="Vaultix"
            className="mb-6 h-16 w-16 animate-float object-contain"
          />

          <p className="mb-1.5 text-base font-semibold text-ink">
            Select a wallet
          </p>
          <p className="mb-8 max-w-xs text-sm text-ink-muted">
            MetaMask, Binance, Trust Wallet, Coinbase & more.
          </p>

          <button
            onClick={() => open()}
            className="flex w-full items-center justify-center gap-2.5 rounded-xl bg-brand px-6 py-4 text-[15px] font-semibold text-white shadow-brand-md transition-all hover:bg-primary-dark hover:shadow-glow active:scale-[0.97] sm:max-w-xs"
          >
            <Wallet className="h-5 w-5" />
            Connect Wallet
          </button>
        </div>
      </VaultCard>

      {/* Feature highlights */}
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {[
          {
            icon: Shield,
            title: "Non-Custodial",
            desc: "Your funds stay in a smart contract, not with us.",
          },
          {
            icon: Users,
            title: "2-of-2 Approval",
            desc: "Two guardians must approve every withdrawal.",
          },
          {
            icon: Clock,
            title: "Auto Recovery",
            desc: "Recovery contacts claim funds after inactivity.",
          },
        ].map((item) => (
          <div
            key={item.title}
            className="flex items-start gap-3 rounded-xl border border-line bg-white p-4 shadow-card-rest transition-all hover:shadow-soft"
          >
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-light">
              <item.icon className="h-4 w-4 text-brand" strokeWidth={2} />
            </div>
            <div>
              <p className="text-xs font-semibold text-ink">{item.title}</p>
              <p className="mt-0.5 text-[11px] leading-relaxed text-ink-faint">
                {item.desc}
              </p>
            </div>
          </div>
        ))}
      </div>

      <p className="mt-5 text-center text-[11px] text-ink-ghost">
        By connecting you agree to the terms of this demo (BSC Testnet).
      </p>
    </VaultShell>
  );
}
