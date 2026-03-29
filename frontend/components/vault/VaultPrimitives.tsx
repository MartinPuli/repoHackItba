"use client";

import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function VaultCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-[14px] border border-line bg-white p-5 shadow-card-rest transition-shadow hover:shadow-card-hover sm:p-6",
        className
      )}
    >
      {children}
    </div>
  );
}

export function VaultPillButton({
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-6 py-3.5 text-[15px] font-semibold text-white transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40",
        "hover:bg-primary-dark",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function VaultGreenBarButton({
  className,
  children,
  icon,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  icon: ReactNode;
}) {
  return (
    <button
      type="button"
      className={cn(
        "flex w-full items-center gap-4 rounded-[14px] border border-line bg-white px-5 py-4 text-left text-[15px] font-semibold text-ink transition-all hover:border-brand/30 hover:shadow-card-hover active:scale-[0.995]",
        className
      )}
      {...props}
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-light text-brand">
        {icon}
      </span>
      <span className="flex-1">{children}</span>
      <svg className="h-5 w-5 text-ink-faint" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
      </svg>
    </button>
  );
}

export function VaultSmallGreenButton({
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex items-center justify-center rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function VaultMintButton({
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex items-center justify-center rounded-xl border border-brand/20 bg-primary-light px-5 py-2.5 text-sm font-semibold text-brand transition-colors hover:bg-primary-muted",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function VaultDangerButton({
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex w-full items-center justify-center gap-2 rounded-xl border border-danger/20 bg-danger-light px-5 py-3.5 text-[15px] font-semibold text-danger transition-colors hover:border-danger/40 active:scale-[0.98]",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function VaultField({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-ink-muted">{label}</span>
      {children}
      {hint ? (
        <span className="block text-xs text-ink-faint">{hint}</span>
      ) : null}
    </label>
  );
}

export function VaultInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        "w-full rounded-xl border border-line bg-surface-muted/50 px-4 py-3 text-sm text-ink outline-none transition placeholder:text-ink-ghost focus:border-brand/40 focus:ring-2 focus:ring-brand/10",
        props.className
      )}
    />
  );
}

export function VaultSectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="border-b border-line pb-2.5 text-base font-bold text-ink">
      {children}
    </h2>
  );
}

/** Brand icon — clean SVG shield */
export function VaultMascot({
  className,
}: {
  className?: string;
  variant?: "default" | "point";
}) {
  return (
    <div
      className={cn(
        "flex h-36 w-36 shrink-0 items-center justify-center rounded-3xl bg-primary-light sm:h-44 sm:w-44",
        className
      )}
      aria-hidden
    >
      <svg
        viewBox="0 0 64 64"
        className="h-16 w-16 text-brand sm:h-20 sm:w-20"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M32 6L8 16v16c0 14 10.7 24.8 24 28 13.3-3.2 24-14 24-28V16L32 6z" />
        <path d="M22 32l7 7 13-14" />
      </svg>
    </div>
  );
}
