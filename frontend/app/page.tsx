"use client";

import { useAppKitAccount, useAppKit } from "@reown/appkit/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  Shield,
  Users,
  Clock,
  Lock,
  ArrowRight,
  Wallet,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";


function StepItem({
  number,
  title,
  description,
}: {
  number: number;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-4 group">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-[15px] font-bold text-brand transition-colors group-hover:bg-brand group-hover:text-white">
        {number}
      </div>
      <div>
        <p className="font-bold text-ink text-[15px]">{title}</p>
        <p className="mt-1 text-sm text-ink-muted leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
}

function BackgroundDecor() {
  return (
    <div className="mesh-bg pointer-events-none overflow-hidden">
      <div className="dot-pattern absolute inset-0 opacity-[0.4]" />
      <div 
        className="mesh-blob animate-float bg-brand/20" 
        style={{ width: '600px', height: '600px', top: '-10%', right: '-10%' }} 
      />
      <div 
        className="mesh-blob animate-pulse-soft bg-emerald-400/10" 
        style={{ width: '500px', height: '500px', bottom: '10%', left: '-5%' }} 
      />
      <div 
        className="mesh-blob animate-float bg-brand/15" 
        style={{ width: '400px', height: '400px', top: '40%', right: '15%', animationDelay: '-3s' }} 
      />
    </div>
  );
}

export default function HomePage() {
  const router = useRouter();
  const { isConnected } = useAppKitAccount();
  const { open } = useAppKit();

  // Si ya está conectado, puede ir al role directamente
  // pero NO forzamos redirect — dejamos que vea la landing

  return (
    <div className="relative flex min-h-[100dvh] flex-col overflow-x-hidden pt-14">
      <BackgroundDecor />

      {/* ─── NAV ─── */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-line/20 px-5 py-2.5 sm:px-8 md:px-12 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 sm:gap-3 transition-transform hover:scale-[1.02] active:scale-[0.98]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-verde.png"
            alt="Vaultix"
            className="h-9 w-9 object-contain sm:h-11 sm:w-11 shadow-sm"
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/nombre-verde.png"
            alt="Vaultix"
            className="h-5 object-contain sm:h-6"
          />
        </Link>

        {isConnected ? (
          <button
            onClick={() => router.push("/role")}
            className="flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-primary-dark active:scale-[0.98]"
          >
            Open App
            <ArrowRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            onClick={() => open()}
            className="flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-primary-dark active:scale-[0.98]"
          >
            <Wallet className="h-4 w-4" />
            Connect Wallet
          </button>
        )}
      </nav>

      {/* ─── HERO ─── */}
      <section className="flex flex-col items-center px-5 pb-8 pt-10 text-center sm:px-8 sm:pt-16 md:pt-20">
        <div className="mx-auto max-w-2xl">

          <h1 className="text-4xl font-[800] tracking-tight text-ink sm:text-5xl md:text-7xl leading-[1.1] animate-in fade-in slide-in-from-top-8 duration-700 delay-150 fill-mode-forwards">
            Never lose access to your{" "}
            <span className="gradient-text block sm:inline">digital assets</span>
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-ink-muted sm:text-lg animate-in fade-in slide-in-from-top-4 duration-700 delay-300 fill-mode-forwards">
            Non-custodial smart vault with guardian approval for withdrawals and
            automatic recovery after inactivity. Your keys, your funds,
            always.
          </p>

          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center animate-in fade-in slide-in-from-top-2 duration-700 delay-500 fill-mode-forwards">
            {isConnected && (
              <button
                onClick={() => router.push("/role")}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-brand px-10 py-5 text-[16px] font-bold text-white shadow-xl shadow-brand/20 transition-all hover:bg-primary-dark hover:shadow-brand/30 hover:-translate-y-1 active:scale-[0.98] sm:w-auto"
              >
                Go to Dashboard
                <ArrowRight className="h-5 w-5" />
              </button>
            )}
            <a
              href="#how-it-works"
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-line/50 bg-white/80 px-10 py-5 text-[16px] font-bold text-ink backdrop-blur-sm transition-all hover:border-brand/30 hover:bg-white hover:shadow-premium hover:-translate-y-1 sm:w-auto"
            >
              How it works
              <ChevronRight className="h-5 w-5 text-ink-faint" />
            </a>
          </div>
        </div>
      </section>

      {/* ─── TRUST BAR ─── */}
      <section className="relative z-10 border-y border-line/10 bg-white/30 backdrop-blur-sm py-8 sm:py-10">
        <div className="mx-auto max-w-5xl px-5 sm:px-8">
          <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-16">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand/10 text-brand">
                <Lock className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[13px] font-bold text-ink uppercase tracking-wider">Non-Custodial</p>
                <p className="text-[12px] text-ink-muted leading-none mt-1">100% Owner Control</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand/10 text-brand">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[13px] font-bold text-ink uppercase tracking-wider">Multi-Guardian</p>
                <p className="text-[12px] text-ink-muted leading-none mt-1">2/2 Approval System</p>
              </div>
            </div>
            <div className="flex items-center gap-3 md:flex">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand/10 text-brand">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[13px] font-bold text-ink uppercase tracking-wider">Smart Inactivity</p>
                <p className="text-[12px] text-ink-muted leading-none mt-1">Automatic Recovery</p>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* ─── WHY VAULTIX / SECURITY BLOCK ─── */}
      <section className="relative z-10 px-5 py-16 sm:px-8 sm:py-24">
        <div className="mx-auto max-w-5xl">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div className="order-2 lg:order-1 text-left">
              <div className="inline-flex items-center gap-2 rounded-lg bg-emerald-100/50 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                <Shield className="h-3.5 w-3.5" />
                Next-Gen Security
              </div>
              <h2 className="mt-4 text-3xl font-[800] tracking-tight text-ink sm:text-4xl">
                The safety net your <br /> <span className="gradient-text">crypto wallet</span> deserves
              </h2>
              <p className="mt-5 text-[16px] leading-relaxed text-ink-muted sm:text-lg">
                Most wallets are lost because of a single point of failure: the seed phrase. 
                Vaultix adds a programmable layer of security that guarantees you can 
                always recover your funds.
              </p>
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-line/40 bg-white/50 p-4 backdrop-blur-sm shadow-sm">
                  <p className="font-bold text-ink text-sm">Programmable Recovery</p>
                  <p className="mt-1 text-xs text-ink-muted">Set a timer that activates recovery only after your inactivity.</p>
                </div>
                <div className="rounded-2xl border border-line/40 bg-white/50 p-4 backdrop-blur-sm shadow-sm">
                  <p className="font-bold text-ink text-sm">Social Guardians</p>
                  <p className="mt-1 text-xs text-ink-muted">Transfer security to the people you trust most.</p>
                </div>
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <div className="relative aspect-square sm:aspect-video lg:aspect-square overflow-hidden rounded-[2.5rem] border border-line/20 bg-gradient-to-br from-brand/5 to-emerald-500/10 shadow-premium glow-brand">
                 {/* Visual Mockup - CSS UI representation */}
                 <div className="absolute inset-0 flex items-center justify-center p-8">
                    <div className="relative w-full max-w-[280px] rounded-3xl border border-white/40 bg-white/20 p-6 backdrop-blur-md shadow-2xl animate-float">
                      <div className="mb-6 flex items-center justify-between">
                        <div className="h-2 w-12 rounded-full bg-brand/30" />
                        <div className="h-6 w-6 rounded-full bg-brand/20" />
                      </div>
                      <div className="space-y-4">
                        <div className="h-4 w-full rounded-lg bg-brand/10" />
                        <div className="h-4 w-3/4 rounded-lg bg-brand/10" />
                        <div className="mt-8 flex justify-center">
                          <div className="h-12 w-12 rounded-full border-2 border-brand flex items-center justify-center text-brand">
                            <Lock className="h-6 w-6" />
                          </div>
                        </div>
                        <div className="mt-4 h-3 w-1/2 mx-auto rounded-full bg-brand/20" />
                      </div>
                    </div>
                    {/* Decorative bits */}
                    <div className="absolute top-10 right-10 h-20 w-20 rounded-full bg-brand/10 blur-xl" />
                    <div className="absolute bottom-10 left-10 h-20 w-20 rounded-full bg-emerald-400/10 blur-xl" />
                 </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section
        id="how-it-works"
        className="relative z-10 px-5 py-16 sm:px-8 sm:py-20 bg-brand/5"
      >
        <div className="mx-auto max-w-4xl">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-[800] tracking-tight sm:text-5xl text-ink">
              How it works
            </h2>
            <p className="mx-auto mt-3 max-w-md text-[16px] text-ink-muted sm:text-lg">
              Three roles, one mission: protect your digital assets
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            <div className="rounded-3xl border border-line/50 bg-white/60 p-8 backdrop-blur-md shadow-premium lg:col-span-2">
              <h3 className="mb-6 inline-block rounded-lg bg-brand/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-brand">
                Owner
              </h3>
              <div className="grid gap-8 md:grid-cols-3">
                <StepItem
                  number={1}
                  title="Create vault"
                  description="Choose guardians and recovery contacts. Set inactivity limits."
                />
                <StepItem
                  number={2}
                  title="Deposit funds"
                  description="Send BNB to your vault. Activity resets the safety timer."
                />
                <StepItem
                  number={3}
                  title="Withdraw"
                  description="Request a withdrawal — guardians must approve to release."
                />
              </div>
            </div>

            <div className="rounded-3xl border border-line/50 bg-white/60 p-8 backdrop-blur-md shadow-premium hover:shadow-hover transition-shadow">
              <h3 className="mb-4 inline-block rounded-lg bg-brand/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-brand">
                Guardian
              </h3>
              <p className="text-[15px] leading-relaxed text-ink-muted">
                Review and approve or reject withdrawal requests from vault
                owners. Both guardians must approve for the withdrawal to execute.
              </p>
            </div>

            <div className="rounded-3xl border border-line/50 bg-white/60 p-8 backdrop-blur-md shadow-premium hover:shadow-hover transition-shadow">
              <h3 className="mb-4 inline-block rounded-lg bg-brand/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-brand">
                Recovery Contact
              </h3>
              <p className="text-[15px] leading-relaxed text-ink-muted">
                If the owner goes inactive beyond the time limit, recovery contacts
                can claim their share (50% each) of the vault funds.
              </p>
            </div>
          </div>
        </div>
      </section>


      {/* ─── REFINED CTA ─── */}
      <section className="relative z-10 px-5 pt-4 pb-12 sm:px-8">
        <div className="mx-auto max-w-4xl rounded-[2rem] glass p-8 sm:p-10 text-center border border-line/20 shadow-premium relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-2xl font-[800] text-ink sm:text-4xl">
              Ready to secure your future?
            </h2>
            <p className="mt-3 text-[16px] text-ink-muted max-w-sm mx-auto">
              Join the new era of programmable smart wallets on BNB Chain.
            </p>
            {isConnected && (
              <button
                onClick={() => router.push("/role")}
                className="mt-8 inline-flex items-center gap-3 rounded-2xl bg-brand px-10 py-4.5 text-[16px] font-bold text-white shadow-xl shadow-brand/20 transition-all hover:bg-emerald-400 hover:-translate-y-1 active:scale-[0.98]"
              >
                Launch App
                <ArrowRight className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
      </section>
      <footer className="border-t border-line bg-white px-5 py-4 sm:px-8">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-verde.png" alt="" className="h-6 w-6" />
        </div>
      </footer>
    </div>
  );
}
