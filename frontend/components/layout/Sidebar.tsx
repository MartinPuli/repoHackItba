"use client";

import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Shield,
  Users,
  Clock,
  ArrowRightLeft,
  Settings,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", icon: LayoutDashboard, label: "Inicio" },
  { href: "/safe/owner", icon: Shield, label: "Mi Vault" },
  { href: "/guardian", icon: Users, label: "Guardian" },
  { href: "/heir", icon: Clock, label: "Recovery" },
  { href: "/transactions", icon: ArrowRightLeft, label: "Movimientos" },
  { href: "/settings", icon: Settings, label: "Configuracion" },
];

export function Sidebar() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-[72px] flex-col border-r border-line bg-white py-5 lg:w-[240px]">
      <div className="mb-6 flex items-center gap-3 px-3 lg:px-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-line bg-surface-muted">
          <Shield className="h-[18px] w-[18px] text-brand" strokeWidth={2} />
        </div>
        <div className="hidden min-w-0 lg:block">
          <p className="text-[15px] font-semibold leading-tight tracking-tight text-ink">
            StrongBox
          </p>
          <p className="text-[11px] font-medium text-ink-faint">
            Smart Recovery Vault
          </p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 px-2 lg:px-3">
        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] transition-colors",
                active
                  ? "bg-surface-muted font-semibold text-ink"
                  : "font-medium text-ink-muted hover:bg-surface-muted/70 hover:text-ink"
              )}
            >
              <item.icon
                className={cn(
                  "h-[18px] w-[18px] shrink-0 stroke-[1.75]",
                  active ? "text-brand" : "text-ink-faint"
                )}
              />
              <span className="hidden lg:block">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto px-2 lg:px-3">
        <div className="rounded-lg border border-line bg-surface-muted/50 px-3 py-2.5">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 shrink-0 rounded-full bg-brand" />
            <span className="hidden text-[11px] font-medium text-ink-muted lg:block">
              BSC Testnet
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
