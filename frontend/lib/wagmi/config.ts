import { connectorsForWallets } from "@rainbow-me/rainbowkit";
import {
  metaMaskWallet,
  walletConnectWallet,
  coinbaseWallet,
  trustWallet,
  binanceWallet,
  rainbowWallet,
  injectedWallet,
  okxWallet,
  ledgerWallet,
  uniswapWallet,
  zerionWallet,
  safepalWallet,
  bitgetWallet,
  phantomWallet,
  bybitWallet,
  krakenWallet,
} from "@rainbow-me/rainbowkit/wallets";
import { createConfig, http } from "wagmi";
import { bscTestnet } from "wagmi/chains";
import { lemonWallet } from "./lemonWallet";

// WalletConnect Project ID — get one free at https://cloud.walletconnect.com
const projectId =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ||
  "00000000000000000000000000000000";

// ── Wallet groups ──────────────────────────────────────────────

// Group 1: Argentina & LatAm favorites (shown first!)
const argentinaWallets = {
  groupName: "🇦🇷 Argentina",
  wallets: [
    lemonWallet,      // Lemon Cash — 3.5M+ users in LatAm
    binanceWallet,    // Binance Web3 Wallet — very popular in AR
    trustWallet,      // Trust Wallet — widely used
  ],
};

// Group 2: Global popular wallets
const popularWallets = {
  groupName: "Popular",
  wallets: [
    metaMaskWallet,
    coinbaseWallet,
    walletConnectWallet, // QR fallback for ANY WalletConnect wallet
  ],
};

// Group 3: More wallets
const moreWallets = {
  groupName: "Más wallets",
  wallets: [
    okxWallet,
    rainbowWallet,
    uniswapWallet,
    phantomWallet,
    bybitWallet,
    krakenWallet,
    ledgerWallet,
    zerionWallet,
    bitgetWallet,
    safepalWallet,
    injectedWallet, // catches any browser-injected wallet not listed above
  ],
};

const connectors = connectorsForWallets(
  [argentinaWallets, popularWallets, moreWallets],
  {
    appName: "Vaultix",
    projectId,
  }
);

export const config = createConfig({
  connectors,
  chains: [bscTestnet],
  transports: {
    [bscTestnet.id]: http(
      process.env.NEXT_PUBLIC_BSC_TESTNET_RPC ||
        "https://data-seed-prebsc-1-s1.binance.org:8545/"
    ),
  },
  ssr: true,
});

declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}
