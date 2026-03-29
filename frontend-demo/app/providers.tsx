"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { DemoMockProvider } from "@/context/DemoMockContext";
import { VaultFlowProvider } from "@/context/VaultFlowContext";

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <DemoMockProvider>
        <VaultFlowProvider>{children}</VaultFlowProvider>
      </DemoMockProvider>
    </QueryClientProvider>
  );
}
