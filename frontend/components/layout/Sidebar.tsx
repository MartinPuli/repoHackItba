"use client";

import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Shield,
  Users,
  Clock,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", icon: LayoutDashboard, label: "Inicio" },
  { href: "/safe/owner", icon: Shield, label: "Mi Vault" },
  { href: "/guardian", icon: Users, label: "Guardian" },
  { href: "/heir", icon: Clock, label: "Recovery" },
];

export function Sidebar() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-[72px] flex-col border-r border-line bg-white py-5 md:flex lg:w-[232px]">
        <div className="mb-6 flex items-center gap-3 px-3 lg:px-4">
          <Image
            src="/logo-verde.png"
            alt="Vaultix"
            width={40}
            height={40}
            className="h-10 w-10 shrink-0 rounded-xl object-contain"
          />
          <div className="hidden min-w-0 lg:block">
            <p className="text-[15px] font-bold leading-tight tracking-tight text-ink">
              Vaultix
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
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] transition-colors",
                  active
                    ? "bg-primary-light font-semibold text-brand"
                    : "font-medium text-ink-muted hover:bg-surface-muted hover:text-ink"
                )}
              >
                <item.icon
                  className={cn(
                    "h-[18px] w-[18px] shrink-0",
                    active ? "text-brand" : "text-ink-faint"
                  )}
                  strokeWidth={active ? 2.25 : 1.75}
                />
                <span className="hidden lg:block">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto px-2 lg:px-3">
          <div className="rounded-xl border border-line bg-surface-muted/50 px-3 py-2.5">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 shrink-0 rounded-full bg-brand" />
              <span className="hidden text-[11px] font-medium text-ink-muted lg:block">
                BSC Testnet
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile bottom navigation */}
      <nav className="fixed inset-x-0 bottom-0 z-50 flex items-center justify-around border-t border-line bg-white/95 px-2 pb-safe shadow-bottom-nav backdrop-blur-lg md:hidden">
        {navItems.map((item) => {
          const on = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-2 py-2.5 text-[10px] font-medium transition-colors",
                on ? "text-brand" : "text-ink-faint"
              )}
            >
              <item.icon className="h-5 w-5" strokeWidth={on ? 2.25 : 1.75} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
