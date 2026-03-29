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

          <div className="w-full sm:max-w-xs space-y-3">
            <button
              onClick={() => open()}
              className="flex w-full items-center justify-between rounded-xl border border-line bg-white px-4 py-3.5 text-sm font-semibold text-ink transition-all hover:border-brand/30 hover:bg-slate-50 hover:shadow-sm active:scale-[0.98]"
            >
              <div className="flex items-center gap-3">
                <img src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg" alt="MetaMask" className="h-6 w-6" />
                MetaMask
              </div>
              <span className="text-xs bg-brand/10 text-brand px-2 py-0.5 rounded-full">Installed</span>
            </button>
            <button
              onClick={() => open()}
              className="flex w-full items-center justify-between rounded-xl border border-line bg-white px-4 py-3.5 text-sm font-semibold text-ink transition-all hover:border-brand/30 hover:bg-slate-50 hover:shadow-sm active:scale-[0.98]"
            >
              <div className="flex items-center gap-3">
                <img src="https://trustwallet.com/assets/images/media/assets/TWT.png" alt="Trust Wallet" className="h-6 w-6 rounded-full" />
                Trust Wallet
              </div>
            </button>
            <button
              onClick={() => open()}
              className="flex w-full items-center justify-between rounded-xl border border-line bg-white px-4 py-3.5 text-sm font-semibold text-ink transition-all hover:border-brand/30 hover:bg-slate-50 hover:shadow-sm active:scale-[0.98]"
            >
              <div className="flex items-center gap-3">
                <img src="https://public.bnbstatic.com/image/cms/article/body/202311/f7b0561574a625f38a7c2f0f4e2acc77.png" alt="Binance Web3" className="h-6 w-6 rounded-full" />
                Binance Web3
              </div>
            </button>
            <button
              onClick={() => open()}
              className="flex w-full items-center justify-between rounded-xl border border-line bg-white px-4 py-3.5 text-sm font-semibold text-ink transition-all hover:border-brand/30 hover:bg-slate-50 hover:shadow-sm active:scale-[0.98]"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-500">...</div>
                Other Wallets
              </div>
            </button>
          </div>
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
