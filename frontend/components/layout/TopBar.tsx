"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Bell } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface TopBarProps {
  title?: string;
  unreadAlerts?: number;
}

export function TopBar({ title, unreadAlerts = 0 }: TopBarProps) {
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <header className="sticky top-0 z-30 border-b border-pistachio-muted bg-white/90 px-5 py-3 backdrop-blur-sm md:px-8 lg:px-10">
      <div className="mx-auto flex h-12 max-w-6xl items-center justify-between">
        <div className="min-w-0">
          <p className="truncate text-[13px] font-medium text-ink-muted">
            {title ?? "Smart Wallet · Agent-First"}
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowNotifications(!showNotifications)}
              className={cn(
                "rounded-lg p-2 text-ink-muted transition-colors",
                "hover:bg-pistachio-muted/40 hover:text-ink"
              )}
              aria-expanded={showNotifications}
              aria-label="Notificaciones"
            >
              <Bell className="h-[18px] w-[18px]" strokeWidth={1.75} />
              {unreadAlerts > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-pistachio px-1 text-[10px] font-semibold text-primary-foreground">
                  {unreadAlerts > 99 ? "99+" : unreadAlerts}
                </span>
              )}
            </button>
            {showNotifications && (
              <div className="absolute right-0 top-full z-50 mt-2 w-72 rounded-[16px] border border-pistachio-muted bg-white p-4 shadow-lg">
                <p className="text-xs font-medium text-ink">Sin alertas nuevas</p>
                <p className="mt-1 text-xs text-ink-muted leading-relaxed">
                  Cuando el agente o compliance requieran tu atención, aparecerán
                  aquí.
                </p>
              </div>
            )}
          </div>

          <div className="[&_button]:!rounded-lg [&_button]:!text-[13px]">
            <ConnectButton
              chainStatus="icon"
              showBalance
              accountStatus={{
                smallScreen: "avatar",
                largeScreen: "full",
              }}
            />
          </div>
        </div>
      </div>
    </header>
  );
}
