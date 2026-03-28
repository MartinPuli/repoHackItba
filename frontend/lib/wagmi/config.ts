import { http, createConfig } from "wagmi";
import { bscTestnet } from "wagmi/chains";
import { injected, walletConnect } from "wagmi/connectors";

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "";

export const config = createConfig({
  chains: [bscTestnet],
  connectors: [
    injected(),
    ...(projectId ? [walletConnect({ projectId })] : []),
  ],
  transports: {
    [bscTestnet.id]: http(
      process.env.NEXT_PUBLIC_BSC_TESTNET_RPC ||
        "https://data-seed-prebsc-1-s1.binance.org:8545/"
    ),
  },
});

declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}
