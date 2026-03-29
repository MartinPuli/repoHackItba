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

// Lemon Cash — custom wallet (WalletConnect v2 via deep-link)
const lemonWallet = {
  id: "lemon-cash",
  name: "Lemon",
  image_url:
    "data:image/svg+xml;base64," +
    btoa(`<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">
      <defs><linearGradient id="lg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#B8E948"/><stop offset="100%" stop-color="#7CC520"/>
      </linearGradient></defs>
      <rect width="96" height="96" rx="20" fill="url(#lg)"/>
      <text x="48" y="64" font-family="system-ui,sans-serif" font-size="52" font-weight="700" fill="#fff" text-anchor="middle">L</text>
    </svg>`),
  mobile_link: "lemon://",
  app_store: "https://apps.apple.com/app/lemon-cash-tu-wallet-crypto/id1588084217",
  play_store: "https://play.google.com/store/apps/details?id=com.applemoncash",
  homepage: "https://www.lemon.me/",
};

// Create AppKit instance — MUST be called outside React component
createAppKit({
  adapters: [wagmiAdapter],
  networks,
  projectId,
  metadata,
  customWallets: [lemonWallet],
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
        <VaultFlowProvider>{children}</VaultFlowProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
