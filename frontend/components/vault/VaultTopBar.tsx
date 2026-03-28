"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Home, Settings } from "lucide-react";
import Link from "next/link";

interface VaultTopBarProps {
  title: string;
}

export function VaultTopBar({ title }: VaultTopBarProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/90 bg-white/95 px-4 py-3.5 backdrop-blur-md md:px-10">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#e8f5ee] text-[#1e4d3a]">
            <span className="text-lg" aria-hidden>
              🌿
            </span>
          </span>
          <p className="truncate text-[16px] font-bold tracking-tight text-slate-900">
            {title}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Link
            href="/role"
            className="rounded-xl p-2.5 text-slate-500 transition hover:bg-slate-100 hover:text-[#1e4d3a]"
            aria-label="Role selection"
          >
            <Home className="h-[18px] w-[18px]" strokeWidth={2} />
          </Link>
          <button
            type="button"
            className="rounded-xl p-2.5 text-slate-500 transition hover:bg-slate-100 hover:text-[#1e4d3a]"
            aria-label="Settings"
          >
            <Settings className="h-[18px] w-[18px]" strokeWidth={2} />
          </button>
          <div className="ml-1 pl-2 [&_button]:!rounded-xl [&_button]:!text-[13px] [&_button]:!font-semibold">
            <ConnectButton chainStatus="icon" showBalance />
          </div>
        </div>
      </div>
    </header>
  );
}
