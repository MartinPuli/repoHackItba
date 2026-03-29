"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { useState, type ReactNode } from "react";
import { createAppKit } from "@reown/appkit/react";
import {
  wagmiAdapter,
  projectId,
  metadata,
  networks,
} from "@/lib/wagmi/config";
import { VaultFlowProvider } from "@/context/VaultFlowContext";
import { LemonProvider } from "@/context/LemonContext";
import { ChainGuard } from "@/components/ChainGuard";

// Create AppKit instance — MUST be called outside React component
createAppKit({
  adapters: [wagmiAdapter],
  networks,
  defaultNetwork: networks[0], // BSC Testnet — force as default
  projectId,
  metadata,
  customWallets: [],
  features: {
    analytics: false,
    email: false,
    socials: false,
  },
  themeMode: "light",
  themeVariables: {
    "--w3m-accent": "#1a7f5a",
    "--w3m-border-radius-master": "2px",
  },
});

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <VaultFlowProvider>
          <LemonProvider>
            <ChainGuard>{children}</ChainGuard>
          </LemonProvider>
        </VaultFlowProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
