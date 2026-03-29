"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

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
  // Mobile: full width. Desktop: comfortable reading width
  const mw = maxWidth === "wide" ? "max-w-4xl" : "max-w-xl sm:max-w-2xl";

  return (
    <div className="flex min-h-[100dvh] flex-col items-center bg-canvas px-5 pb-12 pt-8 sm:px-8 md:pt-12">
      {/* Minimal header: logo + optional back */}
      <header className={cn("flex w-full items-center", mw, backHref ? "justify-between" : "justify-center")}>
        <Link href="/" className="flex items-center gap-4" style={{ minHeight: 80 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-verde.png"
            alt="Vaultix icon"
            style={{ height: 72, width: 72 }}
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/nombre-verde.png"
            alt="Vaultix"
            style={{ height: 40 }}
          />
        </Link>
        {backHref && (
          <Link
            href={backHref}
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-ink-faint transition-colors hover:bg-surface-muted hover:text-ink"
          >
            Back
          </Link>
        )}
      </header>

      {/* Step indicator */}
      {step && (
        <div className={cn("mt-8 flex w-full items-center gap-2 md:mt-10", mw)}>
          {Array.from({ length: step.total }, (_, i) => (
            <div
              key={i}
              className={cn(
                "h-1 flex-1 rounded-full transition-colors",
                i < step.current ? "bg-brand" : "bg-line"
              )}
            />
          ))}
        </div>
      )}

      {/* Content */}
      <main className={cn("mt-8 w-full flex-1 sm:mt-10 md:mt-12", mw)}>
        <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-[28px]">
          {title}
        </h1>
        <div className="mt-5 sm:mt-6">{children}</div>
      </main>
    </div>
  );
}
