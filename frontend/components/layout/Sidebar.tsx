"use client";

import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Wallet,
  Shield,
  Bot,
  Settings,
  ArrowRightLeft,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/wallet", icon: Wallet, label: "Wallet" },
  { href: "/caja-fuerte", icon: Shield, label: "Caja Fuerte" },
  { href: "/yield", icon: TrendingUp, label: "Yield" },
  { href: "/transactions", icon: ArrowRightLeft, label: "Transacciones" },
  { href: "/agent", icon: Bot, label: "Agente AI" },
  { href: "/settings", icon: Settings, label: "Config" },
];

export function Sidebar() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-[72px] flex-col border-r border-line bg-canvas-elevated/90 py-6 backdrop-blur-xl lg:w-[238px]">
      <div className="mb-8 flex items-center gap-3 px-4">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-line-strong bg-surface-raised"
          style={{
            boxShadow: "0 0 0 1px rgba(143, 180, 201, 0.12) inset",
          }}
        >
          <Shield className="h-[18px] w-[18px] text-brand" strokeWidth={1.75} />
        </div>
        <span className="hidden text-[15px] font-semibold tracking-tight gradient-text lg:block">
          SmartWallet
        </span>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 px-2 lg:px-3">
        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-colors",
                active
                  ? "bg-brand/10 text-brand"
                  : "text-ink-muted hover:bg-surface-hover hover:text-ink"
              )}
            >
              <item.icon
                className={cn(
                  "h-[18px] w-[18px] shrink-0 stroke-[1.75]",
                  active && "text-brand"
                )}
              />
              <span className="hidden lg:block">{item.label}</span>
              {active && (
                <span className="ml-auto hidden h-1.5 w-1.5 rounded-full bg-brand lg:block" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto px-2 lg:px-3">
        <div className="surface-card rounded-card px-3 py-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-growth/40 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-growth" />
            </span>
            <span className="hidden text-[11px] font-medium text-ink-muted lg:block">
              Agente listo
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
