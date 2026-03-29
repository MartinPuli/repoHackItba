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
        "rounded-[14px] border border-line bg-white p-5 shadow-card-rest transition-all duration-200 hover:shadow-card-hover sm:p-6",
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
        "inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-6 py-3.5 text-[15px] font-semibold text-white shadow-brand-sm transition-all active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none",
        "hover:bg-primary-dark hover:shadow-brand-md",
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
        "group flex w-full items-center gap-4 rounded-[14px] border border-line bg-white px-5 py-4 text-left text-[15px] font-semibold text-ink shadow-card-rest transition-all duration-200 hover:-translate-y-0.5 hover:border-brand/25 hover:shadow-card-hover active:translate-y-0 active:shadow-card-active",
        className
      )}
      {...props}
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-light text-brand transition-transform duration-200 group-hover:scale-105">
        {icon}
      </span>
      <span className="flex-1">{children}</span>
      <svg
        className="h-5 w-5 text-ink-ghost transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-ink-faint"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 5l7 7-7 7"
        />
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
        "inline-flex items-center justify-center rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-brand-sm transition-all hover:bg-primary-dark hover:shadow-brand-md active:scale-[0.97] disabled:opacity-40 disabled:shadow-none",
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
        "inline-flex items-center justify-center rounded-xl border border-brand/20 bg-primary-light px-5 py-2.5 text-sm font-semibold text-brand transition-all hover:border-brand/30 hover:bg-primary-muted active:scale-[0.98]",
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
        "inline-flex w-full items-center justify-center gap-2 rounded-xl border border-danger/20 bg-danger-light px-5 py-3.5 text-[15px] font-semibold text-danger transition-all hover:border-danger/35 hover:bg-red-50 active:scale-[0.97]",
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

export function VaultInput(
  props: React.InputHTMLAttributes<HTMLInputElement>
) {
  return (
    <input
      {...props}
      className={cn(
        "w-full rounded-xl border border-line bg-surface-muted/50 px-4 py-3 text-sm text-ink outline-none transition-all duration-200 placeholder:text-ink-ghost focus:border-brand/40 focus:bg-white focus:ring-2 focus:ring-brand/10 focus:shadow-soft",
        props.className
      )}
    />
  );
}

export function VaultSectionTitle({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <h3
      className={cn(
        "text-base font-bold tracking-tight text-ink",
        className
      )}
    >
      {children}
    </h3>
  );
}
