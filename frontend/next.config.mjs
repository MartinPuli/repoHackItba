/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
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
