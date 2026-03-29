"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppKitAccount, useAppKit } from "@/context/DemoMockContext";
import { VaultShell } from "@/components/vault/VaultShell";
import { VaultCard } from "@/components/vault/VaultPrimitives";
import { Shield, Users, Clock, HelpCircle, X, ChevronRight, Search } from "lucide-react";

export default function ConnectPage() {
  const router = useRouter();
  const { isConnected, hydrated } = useAppKitAccount();
  const { open } = useAppKit();
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (hydrated && isConnected) router.replace("/role");
  }, [hydrated, isConnected, router]);

  return (
    <VaultShell title="Connect your wallet" step={{ current: 1, total: 4 }} backHref="/">
      <p className="text-[15px] leading-relaxed text-ink-muted">
        Connect your preferred wallet to start using your smart recovery vault.
      </p>

      <VaultCard className="mt-6 border-transparent bg-white shadow-sm ring-1 ring-slate-200">
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
            onClick={() => setIsModalOpen(true)}
            className="w-full rounded-2xl bg-brand px-6 py-3.5 text-sm font-bold text-white transition-all hover:bg-emerald-600 active:scale-[0.98] sm:max-w-[200px]"
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

      <p className="mt-6 text-center text-[11px] text-ink-ghost">
        By connecting you agree to the terms of this demo (BSC Testnet).
      </p>

      {/* ─── FAKE REOWN APP KIT MODAL ─── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-[360px] rounded-[2rem] bg-white text-left shadow-2xl animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
              <button className="rounded-full rounded bg-transparent p-1.5 text-slate-500 hover:bg-slate-100 transition-colors">
                <HelpCircle className="h-5 w-5" />
              </button>
              <h2 className="text-[17px] font-semibold text-[#141414]">Connect Wallet</h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="rounded-full rounded bg-transparent p-1.5 text-slate-500 hover:bg-slate-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* List */}
            <div className="px-3 pb-3 max-h-[400px] overflow-y-auto">
              {[
                { name: "WalletConnect", badge: "QR CODE", img: "https://explorer-api.walletconnect.com/w3m/v1/getWalletImage/a9e1d13f-c124-4f90-19b8-bc234ab20800?projectId=c552086438ee2e46b0d91206f663f7af", badgeColor: "text-[#3396ff] bg-[#eef6ff]" },
                { name: "MetaMask", badge: "INSTALLED", img: "https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg", badgeColor: "text-emerald-700 bg-emerald-100/60" },
                { name: "Binance Wallet", badge: null, img: "https://public.bnbstatic.com/image/cms/article/body/202311/f7b0561574a625f38a7c2f0f4e2acc77.png" },
                { name: "SafePal", badge: null, img: "https://play-lh.googleusercontent.com/w_S9P_kY_y75_m9CgR85e3-t1xGj5kY3k3A3A3A3A3A3A3A3A3A" }, // Just standard safepal logo
                { name: "Trust Wallet", badge: null, img: "https://trustwallet.com/assets/images/media/assets/TWT.png" }
              ].map((wallet, idx) => (
                <button
                  key={idx}
                  onClick={() => open()}
                  className="group flex w-full items-center justify-between rounded-xl px-3 py-3 hover:bg-[#f3f4f6]"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-[40px] w-[40px] items-center justify-center overflow-hidden rounded-[10px] bg-slate-100 outline outline-1 outline-slate-200">
                      <img src={wallet.name === "SafePal" ? "https://registry.walletconnect.com/v2/logo/lg/0b415a746fb9ee99cce155c2ceca0c6f6061b1dbca2d722b3ba16381d0562150" : wallet.img} alt={wallet.name} className="h-full w-full object-cover" />
                    </div>
                    <span className="text-[16px] font-medium text-[#141414]">{wallet.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                     {wallet.badge && (
                       <span className={`rounded-sm px-1.5 py-0.5 text-[10px] font-semibold tracking-wide ${wallet.badgeColor}`}>
                         {wallet.badge}
                       </span>
                     )}
                     <ChevronRight className="h-4 w-4 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-500" />
                  </div>
                </button>
              ))}

              <button
                onClick={() => open()}
                className="group mt-2 flex w-full items-center justify-between rounded-xl bg-[#f5f6f7] px-4 py-3 hover:bg-[#eaebeb]"
              >
                <div className="flex items-center gap-3">
                  <Search className="h-5 w-5 text-slate-500" strokeWidth={2.5}/>
                  <span className="text-[15px] font-semibold text-[#141414]">Search Wallet</span>
                </div>
                <div className="flex items-center gap-2">
                   <span className="rounded-md bg-slate-200 px-1.5 py-0.5 text-[11px] font-semibold text-slate-600">
                     140+
                   </span>
                   <ChevronRight className="h-4 w-4 text-slate-400" />
                </div>
              </button>

              <div className="mt-4 flex items-center justify-center gap-1.5 pb-2">
                <span className="text-[12px] text-slate-400 font-medium">UX by</span>
                <div className="flex items-center gap-[2px]">
                   <span className="flex h-4 w-4 items-center justify-center rounded-sm bg-slate-300 text-[10px] text-white">.</span>
                   <span className="flex h-4 w-4 items-center justify-center rounded-sm text-[12px] font-bold text-slate-400">/</span>
                   <span className="flex items-center justify-center rounded-full bg-slate-200 px-2 py-0.5 text-[11px] font-bold text-slate-600">reown</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </VaultShell>
  );
}
