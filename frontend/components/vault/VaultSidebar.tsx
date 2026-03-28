"use client";

import { cn } from "@/lib/utils";
import {
  Wallet,
  Users,
  FilePlus2,
  LayoutDashboard,
  ShieldCheck,
  Hourglass,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/connect", icon: Wallet, label: "Connect" },
  { href: "/role", icon: Users, label: "Role" },
  { href: "/safe/configure", icon: FilePlus2, label: "Configure safe" },
  { href: "/safe/owner", icon: LayoutDashboard, label: "Owner dashboard" },
  { href: "/guardian", icon: ShieldCheck, label: "Guardian" },
  { href: "/heir", icon: Hourglass, label: "Heir" },
];

export function VaultSidebar() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/connect") return pathname === "/connect";
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-[64px] flex-col bg-[#1e4d3a] py-6 shadow-[4px_0_28px_-10px_rgba(0,0,0,0.25)]">
      <div className="mb-8 flex justify-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/12 text-lg font-bold text-[#d4f0dd] ring-1 ring-white/25">
          S
        </div>
      </div>
      <nav className="flex flex-1 flex-col items-center gap-1.5 px-1">
        {navItems.map((item) => {
          const on = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              className={cn(
                "flex h-11 w-11 items-center justify-center rounded-xl transition-colors",
                on
                  ? "bg-white/18 text-white shadow-inner"
                  : "text-[#a8c9b8] hover:bg-white/12 hover:text-white"
              )}
            >
              <item.icon className="h-[1.15rem] w-[1.15rem]" strokeWidth={2} />
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
