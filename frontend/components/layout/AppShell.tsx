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
      <div className="flex min-h-screen flex-1 flex-col pl-[72px] lg:pl-[240px]">
        <TopBar title={topTitle} unreadAlerts={unreadAlerts} />
        <main className="flex-1 px-5 py-8 md:px-8 md:py-10 lg:px-10">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
