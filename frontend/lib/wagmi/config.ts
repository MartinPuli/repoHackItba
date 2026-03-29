import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { bscTestnet } from "@reown/appkit/networks";
import type { AppKitNetwork } from "@reown/appkit/networks";

// WalletConnect Project ID — get one free at https://cloud.reown.com
export const projectId =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ||
  "00000000000000000000000000000000";

// Metadata for the dApp
export const metadata = {
  name: "Vaultix",
  description:
    "Protect your digital assets with guardians and smart recovery. Non-custodial on-chain vault.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://localhost:3000",
  icons: ["/logo-verde.png"],
};

// Networks
export const networks: [AppKitNetwork, ...AppKitNetwork[]] = [bscTestnet];

// Wagmi Adapter (includes WalletConnect, Coinbase, Injected connectors)
export const wagmiAdapter = new WagmiAdapter({
  networks,
  projectId,
  ssr: true,
});

export const config = wagmiAdapter.wagmiConfig;
