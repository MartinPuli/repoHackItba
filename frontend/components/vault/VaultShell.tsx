"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useDisconnect } from "wagmi";
import { useUnifiedWallet } from "@/hooks/useUnifiedWallet";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { LogOut, ArrowLeft } from "lucide-react";
import { formatAddress } from "@/lib/utils";

export function VaultShell({
  title,
  children,
  maxWidth = "default",
  backHref,
  step,
}: {
  title: string;
  children: ReactNode;
  maxWidth?: "default" | "wide";
  backHref?: string;
  step?: { current: number; total: number };
}) {
  const mw = maxWidth === "wide" ? "max-w-4xl" : "max-w-xl sm:max-w-2xl";
  const { address, isConnected, isLemon } = useUnifiedWallet();
  const { disconnect } = useDisconnect();
  const { signOut } = useAuth();

  function handleDisconnect() {
    signOut();
    disconnect();
  }

  return (
    <div className="flex min-h-[100dvh] flex-col items-center bg-canvas px-5 pb-12 pt-8 sm:px-8 md:pt-12">
      {/* Header */}
      <header className={cn("flex w-full items-center justify-between", mw)}>
        <Link href="/" className="flex items-center gap-3 py-1 sm:gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-verde.png"
            alt="Vaultix icon"
            className="h-12 w-12 object-contain sm:h-14 sm:w-14"
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/nombre-verde.png"
            alt="Vaultix"
            className="h-7 object-contain sm:h-8"
          />
        </Link>

        <div className="flex items-center gap-2">
          {backHref && (
            <Link
              href={backHref}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-ink-faint transition-colors hover:bg-surface-muted hover:text-ink"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back
            </Link>
          )}
          {isConnected && address && (
            <div className="flex items-center gap-2">
              <span className="hidden rounded-lg border border-line bg-surface-muted px-2.5 py-1 font-mono text-xs text-ink-faint sm:inline">
                {formatAddress(address, 4)}
              </span>
              <button
                onClick={handleDisconnect}
                className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-ink-muted transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                title="Desconectar wallet"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Salir</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Step indicator */}
      {step && (
        <div className={cn("mt-8 flex w-full items-center gap-2 md:mt-10", mw)}>
          {Array.from({ length: step.total }, (_, i) => (
            <div
              key={i}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-all duration-300",
                i < step.current
                  ? "bg-brand shadow-brand-sm"
                  : "bg-line"
              )}
            />
          ))}
        </div>
      )}

      {/* Content */}
      <main className={cn("mt-8 w-full flex-1 animate-fade-in sm:mt-10 md:mt-12", mw)}>
        <h1 className="text-2xl font-extrabold tracking-tight text-ink sm:text-[28px]">
          {title}
        </h1>
        <div className="mt-5 sm:mt-6">{children}</div>
      </main>
    </div>
  );
}
