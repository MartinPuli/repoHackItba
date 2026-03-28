/** @type {import('next').NextConfig} */
const nextConfig = {
  // Strict mode duplica efectos en dev; con wallets + HMR suele generar estados raros.
  reactStrictMode: false,
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "pino-pretty": false,
      "@react-native-async-storage/async-storage": false,
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
