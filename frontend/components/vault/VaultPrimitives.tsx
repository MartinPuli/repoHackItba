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
        "rounded-2xl border border-slate-200/90 bg-white p-6 shadow-[0_12px_40px_-18px_rgba(30,77,58,0.22)] md:p-7",
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
        "inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#4cb87c] via-[#369a68] to-[#1e5c44] px-8 py-4 text-[16px] font-semibold text-white shadow-[0_8px_24px_-6px_rgba(30,120,80,0.55)] transition hover:brightness-[1.06] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-45",
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
        "flex w-full items-center gap-4 rounded-2xl bg-gradient-to-r from-[#4cb87c] to-[#1e5c44] px-5 py-4 text-left text-[16px] font-semibold text-white shadow-md transition hover:brightness-105 active:scale-[0.995]",
        className
      )}
      {...props}
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/20 text-white">
        {icon}
      </span>
      <span className="flex-1">{children}</span>
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
        "inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-[#4cb87c] to-[#2a6b4d] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:brightness-105",
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
        "inline-flex items-center justify-center rounded-xl border border-[#8fc9a8] bg-[#e8f5ee] px-5 py-2.5 text-sm font-semibold text-[#1e4d3a] transition hover:bg-[#dceee4]",
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
        "inline-flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-[#c53030] bg-white px-5 py-4 text-[15px] font-semibold text-[#c53030] shadow-sm transition hover:bg-red-50 active:scale-[0.99]",
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
    <label className="block space-y-2">
      <span className="text-sm font-semibold text-slate-800">{label}</span>
      {children}
      {hint ? <span className="block text-xs text-slate-500">{hint}</span> : null}
    </label>
  );
}

export function VaultInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        "w-full rounded-xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#369a68]/60 focus:ring-2 focus:ring-[#369a68]/20",
        props.className
      )}
    />
  );
}

export function VaultSectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="border-b border-slate-100 pb-2 text-base font-bold text-slate-900">
      {children}
    </h2>
  );
}

/** Robot mascot — variant "point" rotates slightly toward content (connect screen). */
export function VaultMascot({
  className,
  variant = "default",
}: {
  className?: string;
  variant?: "default" | "point";
}) {
  return (
    <div
      className={cn(
        "relative flex h-44 w-44 shrink-0 items-center justify-center rounded-[2rem] bg-gradient-to-br from-[#b8e6c8] via-[#8fd4a8] to-[#5aab7a] shadow-[inset_0_2px_12px_rgba(255,255,255,0.35)]",
        variant === "point" && "-rotate-6 lg:rotate-0",
        className
      )}
      aria-hidden
    >
      <div
        className={cn(
          "relative flex h-28 w-24 flex-col items-center justify-end rounded-3xl bg-[#f8fdf9] shadow-lg ring-2 ring-white/90",
          variant === "point" && "translate-x-1 -rotate-3"
        )}
      >
        <div className="absolute -top-2 left-1/2 h-3.5 w-3.5 -translate-x-1/2 rounded-full bg-[#5aab7a] ring-2 ring-white" />
        <div className="mb-2 mt-6 flex gap-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#1e4d3a]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#1e4d3a]" />
        </div>
        <div className="mb-3 h-1.5 w-8 rounded-full bg-[#1e4d3a]/25" />
        <div className="mb-2 h-6 w-14 rounded-lg bg-[#d4eedc]" />
      </div>
      {variant === "point" ? (
        <div className="absolute -left-2 top-1/2 hidden h-10 w-6 -translate-y-1/2 rounded-full bg-[#8fd4a8]/90 lg:block" />
      ) : null}
    </div>
  );
}
