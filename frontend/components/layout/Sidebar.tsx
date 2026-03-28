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

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-[72px] flex-col items-center border-r border-white/5 bg-black/40 py-6 backdrop-blur-xl lg:w-[240px]">
      {/* Logo */}
      <div className="mb-8 flex items-center gap-3 px-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600">
          <Shield className="h-5 w-5 text-white" />
        </div>
        <span className="hidden text-lg font-bold gradient-text lg:block">
          SmartWallet
        </span>
      </div>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-1 px-3 w-full">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                "hover:bg-white/5",
                isActive
                  ? "bg-indigo-500/10 text-indigo-400"
                  : "text-white/50 hover:text-white/80"
              )}
            >
              <item.icon
                className={cn("h-5 w-5 shrink-0", isActive && "text-indigo-400")}
              />
              <span className="hidden lg:block">{item.label}</span>
              {isActive && (
                <div className="ml-auto hidden h-1.5 w-1.5 rounded-full bg-indigo-400 lg:block" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Agent Status */}
      <div className="mt-auto px-3 w-full">
        <div className="glass-card p-3">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-accent-green animate-pulse-glow" />
            <span className="hidden text-xs text-white/50 lg:block">
              Agente Activo
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
