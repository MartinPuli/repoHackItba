"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Bell } from "lucide-react";
import { useState } from "react";

interface TopBarProps {
  unreadAlerts?: number;
}

export function TopBar({ unreadAlerts = 0 }: TopBarProps) {
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-white/5 bg-black/60 px-6 backdrop-blur-xl">
      <div className="flex items-center gap-4">
        <h1 className="text-sm font-medium text-white/60">
          Smart Wallet Agent-First
        </h1>
      </div>

      <div className="flex items-center gap-4">
        {/* Notifications */}
        <button
          onClick={() => setShowNotifications(!showNotifications)}
          className="relative rounded-lg p-2 text-white/50 transition-colors hover:bg-white/5 hover:text-white"
        >
          <Bell className="h-5 w-5" />
          {unreadAlerts > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent-red px-1 text-[10px] font-bold text-white">
              {unreadAlerts > 99 ? "99+" : unreadAlerts}
            </span>
          )}
        </button>

        {/* Wallet Connect */}
        <ConnectButton
          chainStatus="icon"
          showBalance={true}
          accountStatus={{
            smallScreen: "avatar",
            largeScreen: "full",
          }}
        />
      </div>
    </header>
  );
}
