"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { cn } from "@/lib/utils";

interface AppShellProps {
  children: React.ReactNode;
  topTitle?: string;
  unreadAlerts?: number;
  className?: string;
}

export function AppShell({
  children,
  topTitle,
  unreadAlerts = 0,
  className,
}: AppShellProps) {
  return (
    <div className={cn("app-bg flex min-h-screen", className)}>
      <Sidebar />
      {/* pb-20 for mobile bottom nav, md:pb-0 when sidebar is visible */}
      <div className="flex min-h-screen flex-1 flex-col pb-20 md:pb-0 md:pl-[72px] lg:pl-[232px]">
        <TopBar title={topTitle} unreadAlerts={unreadAlerts} />
        <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <div className="mx-auto w-full max-w-5xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
