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

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-line bg-white p-5 shadow-card-rest transition-all hover:shadow-card-hover sm:p-6">
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary-light">
        {icon}
      </div>
      <h3 className="text-[15px] font-semibold text-ink">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">
        {description}
      </p>
    </div>
  );
}

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
    <div className="flex gap-4">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-bold text-white">
        {number}
      </div>
      <div>
        <p className="font-semibold text-ink">{title}</p>
        <p className="mt-0.5 text-sm text-ink-muted">{description}</p>
      </div>
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
    <div className="flex min-h-[100dvh] flex-col bg-canvas">
      {/* ─── NAV ─── */}
      <nav className="flex items-center justify-between px-5 py-4 sm:px-8 md:px-12">
        <Link href="/" className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-verde.png"
            alt="Vaultix"
            className="h-12 w-12 object-contain sm:h-14 sm:w-14"
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/nombre-verde.png"
            alt="Vaultix"
            className="h-8 object-contain sm:h-9"
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
      <section className="flex flex-1 flex-col items-center justify-center px-5 pb-12 pt-8 text-center sm:px-8 sm:pt-12 md:pt-16">
        <div className="mx-auto max-w-2xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-line bg-white px-4 py-1.5 text-xs font-medium text-ink-muted shadow-card-rest">
            <span className="h-2 w-2 rounded-full bg-brand" />
            BSC Testnet — HackITBA 2026
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl md:text-5xl">
            Never lose access to your{" "}
            <span className="text-brand">digital assets</span>
          </h1>

          <p className="mx-auto mt-5 max-w-lg text-base leading-relaxed text-ink-muted sm:text-lg">
            Non-custodial smart vault with guardian approval for withdrawals and
            automatic recovery after inactivity. Your keys, your funds,
            always.
          </p>

          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            {isConnected ? (
              <button
                onClick={() => router.push("/role")}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-8 py-4 text-[15px] font-semibold text-white transition-all hover:bg-primary-dark active:scale-[0.98] sm:w-auto"
              >
                Go to Dashboard
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={() => open()}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-8 py-4 text-[15px] font-semibold text-white transition-all hover:bg-primary-dark active:scale-[0.98] sm:w-auto"
              >
                <Wallet className="h-5 w-5" />
                Get Started
              </button>
            )}
            <a
              href="#how-it-works"
              className="flex w-full items-center justify-center gap-1 rounded-xl border border-line bg-white px-6 py-4 text-[15px] font-semibold text-ink transition-all hover:border-brand/30 hover:shadow-card-hover sm:w-auto"
            >
              How it works
              <ChevronRight className="h-4 w-4 text-ink-faint" />
            </a>
          </div>
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <section className="border-t border-line bg-white px-5 py-16 sm:px-8 sm:py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-center text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            Security by design
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-center text-sm text-ink-muted sm:text-base">
            Three layers of protection for your on-chain assets
          </p>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <FeatureCard
              icon={<Lock className="h-5 w-5 text-brand" strokeWidth={2} />}
              title="Non-Custodial"
              description="Funds live in a smart contract. No company holds your assets — you are always in control."
            />
            <FeatureCard
              icon={<Users className="h-5 w-5 text-brand" strokeWidth={2} />}
              title="Guardian Approval"
              description="Withdrawals require approval from 2 trusted guardians. Protection against theft and unauthorized access."
            />
            <FeatureCard
              icon={<Clock className="h-5 w-5 text-brand" strokeWidth={2} />}
              title="Auto Recovery"
              description="If you go inactive, recovery contacts can claim funds after a time limit. No frozen assets ever."
            />
            <FeatureCard
              icon={<Shield className="h-5 w-5 text-brand" strokeWidth={2} />}
              title="On-Chain Security"
              description="Every operation is a blockchain transaction. Transparent, immutable, verifiable."
            />
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section
        id="how-it-works"
        className="border-t border-line px-5 py-16 sm:px-8 sm:py-20"
      >
        <div className="mx-auto max-w-2xl">
          <h2 className="text-center text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            How it works
          </h2>
          <p className="mx-auto mt-3 max-w-md text-center text-sm text-ink-muted sm:text-base">
            Three roles, one mission: protect your digital assets
          </p>

          <div className="mt-10 space-y-8">
            <div className="rounded-2xl border border-line bg-white p-6">
              <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-brand">
                Owner
              </h3>
              <div className="space-y-5">
                <StepItem
                  number={1}
                  title="Create your vault"
                  description="Choose 2 guardians and 2 recovery contacts. Set your inactivity time limit."
                />
                <StepItem
                  number={2}
                  title="Deposit funds"
                  description="Send BNB to your vault. Each interaction resets the inactivity timer."
                />
                <StepItem
                  number={3}
                  title="Withdraw safely"
                  description="Request a withdrawal — both guardians must approve before funds are released."
                />
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="rounded-2xl border border-line bg-white p-6">
                <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-brand">
                  Guardian
                </h3>
                <p className="text-sm leading-relaxed text-ink-muted">
                  Review and approve or reject withdrawal requests from vault
                  owners. Both guardians must approve for the withdrawal to execute.
                </p>
              </div>

              <div className="rounded-2xl border border-line bg-white p-6">
                <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-brand">
                  Recovery Contact
                </h3>
                <p className="text-sm leading-relaxed text-ink-muted">
                  If the owner goes inactive beyond the time limit, recovery contacts
                  can claim their share (50% each) of the vault funds.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="border-t border-line bg-vault px-5 py-12 sm:px-8 sm:py-16">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="text-xl font-bold text-white sm:text-2xl">
            Ready to protect your assets?
          </h2>
          <p className="mt-2 text-sm text-white/60">
            Connect your wallet and create your first vault in minutes.
          </p>
          <button
            onClick={() => (isConnected ? router.push("/role") : open())}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand px-8 py-3.5 text-[15px] font-semibold text-white transition-all hover:bg-primary-dark active:scale-[0.98]"
          >
            {isConnected ? (
              <>
                Open App
                <ArrowRight className="h-4 w-4" />
              </>
            ) : (
              <>
                <Wallet className="h-5 w-5" />
                Connect Wallet
              </>
            )}
          </button>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-line bg-white px-5 py-6 sm:px-8">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <div className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-verde.png" alt="" className="h-6 w-6" />
            <span className="text-xs text-ink-faint">
              Vaultix — HackITBA 2026
            </span>
          </div>
          <span className="text-xs text-ink-ghost">BSC Testnet</span>
        </div>
      </footer>
    </div>
  );
}
