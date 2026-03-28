"use client";

import type { ReactNode } from "react";
import { VaultSidebar } from "./VaultSidebar";
import { VaultTopBar } from "./VaultTopBar";
import { cn } from "@/lib/utils";

export function VaultShell({
  title,
  children,
  maxWidth = "default",
}: {
  title: string;
  children: ReactNode;
  maxWidth?: "default" | "wide";
}) {
  return (
    <div className="min-h-screen bg-[#eef4f0]">
      <VaultSidebar />
      <div className="flex min-h-screen min-w-0 flex-1 flex-col pl-[64px]">
        <VaultTopBar title={title} />
        <main className="flex-1 px-4 py-6 md:px-8 md:py-8 lg:px-12">
          <div
            className={cn(
              "mx-auto w-full",
              maxWidth === "wide" ? "max-w-6xl" : "max-w-4xl"
            )}
          >
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
