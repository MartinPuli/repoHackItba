import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Strict mode duplica efectos en dev; con wallets + HMR suele generar estados raros.
  reactStrictMode: false,
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@react-native-async-storage/async-storage": path.join(
        __dirname,
        "lib/shims/async-storage-empty.js",
      ),
    };
    return config;
  },
  transpilePackages: [
    "@rainbow-me/rainbowkit",
    "@reown/appkit",
    "@reown/appkit-scaffold-ui",
    "@reown/appkit-common",
    "@walletconnect/modal",
    "@walletconnect/ethereum-provider",
    "@lit-labs/ssr-dom-shim",
    "@lit/reactive-element",
    "lit",
  ],
};

export default nextConfig;
