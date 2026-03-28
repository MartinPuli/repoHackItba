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
    <header className="sticky top-0 z-30 border-b border-line bg-white px-5 py-3 md:px-8 lg:px-10">
      <div className="mx-auto flex h-11 max-w-6xl items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-[13px] font-medium text-ink-muted">
            {title ?? "Smart Wallet"}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowNotifications(!showNotifications)}
              className={cn(
                "rounded-lg p-2 text-ink-muted transition-colors",
                "hover:bg-surface-muted hover:text-ink"
              )}
              aria-expanded={showNotifications}
              aria-label="Notificaciones"
            >
              <Bell className="h-[18px] w-[18px]" strokeWidth={2} />
              {unreadAlerts > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-semibold text-white">
                  {unreadAlerts > 99 ? "99+" : unreadAlerts}
                </span>
              )}
            </button>
            {showNotifications && (
              <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-lg border border-line bg-white p-4 shadow-panel-hover">
                <p className="text-sm font-semibold text-ink">Notificaciones</p>
                <p className="mt-1.5 text-[13px] leading-relaxed text-ink-muted">
                  No tenés alertas nuevas. Cuando el agente o compliance requieran
                  tu atención, aparecerán aquí.
                </p>
              </div>
            )}
          </div>

          <div className="ml-1 border-l border-line pl-2 [&_button]:!rounded-lg [&_button]:!text-[13px] [&_button]:!font-medium">
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
