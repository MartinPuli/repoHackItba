import { Wallet, getWalletConnectConnector } from "@rainbow-me/rainbowkit";

export interface LemonWalletOptions {
  projectId: string;
}

/**
 * Lemon Cash — Custom RainbowKit wallet connector.
 *
 * Lemon doesn't have a native EIP-1193 injected provider, but its mobile app
 * supports WalletConnect v2. This connector wraps WalletConnect with Lemon
 * branding so users see a familiar "Lemon" option in the wallet modal with
 * instructions on how to scan the QR from the Lemon app.
 *
 * Deep-link scheme: lemon://wc?uri=<encoded_uri>
 */
export const lemonWallet = ({ projectId }: LemonWalletOptions): Wallet => ({
  id: "lemon",
  name: "Lemon",
  // Inline SVG data-uri: green lemon circle with "L" — small & self-contained
  iconUrl:
    "data:image/svg+xml;base64," +
    btoa(`<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">
      <defs>
        <linearGradient id="lg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#B8E948"/>
          <stop offset="100%" stop-color="#7CC520"/>
        </linearGradient>
      </defs>
      <rect width="96" height="96" rx="20" fill="url(#lg)"/>
      <text x="48" y="64" font-family="system-ui,sans-serif" font-size="52" font-weight="700" fill="#fff" text-anchor="middle">L</text>
    </svg>`),
  iconBackground: "#B8E948",

  downloadUrls: {
    android:
      "https://play.google.com/store/apps/details?id=com.applemoncash",
    ios: "https://apps.apple.com/app/lemon-cash-tu-wallet-crypto/id1588084217",
    qrCode: "https://www.lemon.me/",
  },

  // Mobile deep-link: open Lemon app with WalletConnect URI
  mobile: {
    getUri: (uri: string) => `lemon://wc?uri=${encodeURIComponent(uri)}`,
  },

  // QR code flow: show the WC QR with Lemon-specific instructions
  qrCode: {
    getUri: (uri: string) => uri,
    instructions: {
      learnMoreUrl: "https://www.lemon.me/",
      steps: [
        {
          description:
            "Descargá Lemon desde la App Store o Google Play y creá tu cuenta.",
          step: "install" as const,
          title: "Abrí la app de Lemon",
        },
        {
          description:
            'En Lemon, andá a la sección Web3 o WalletConnect y tocá "Escanear QR".',
          step: "scan" as const,
          title: "Escaneá el código QR",
        },
      ],
    },
  },

  createConnector: getWalletConnectConnector({ projectId }),
});
