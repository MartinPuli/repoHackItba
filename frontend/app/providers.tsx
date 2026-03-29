"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { RainbowKitProvider, lightTheme } from "@rainbow-me/rainbowkit";
import { config } from "@/lib/wagmi/config";
import { useState } from "react";

import "@rainbow-me/rainbowkit/styles.css";
import { VaultFlowProvider } from "@/context/VaultFlowContext";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={lightTheme({
            accentColor: "#1a7f5a",
            accentColorForeground: "#ffffff",
            borderRadius: "large",
            overlayBlur: "small",
          })}
        >
          <VaultFlowProvider>{children}</VaultFlowProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
