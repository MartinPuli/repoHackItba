import type { Metadata } from "next";
import "./globals.css";
import Web3Root from "./web3-root";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://localhost:3000";

export const metadata: Metadata = {
  title: "Vaultix — Smart Recovery Vault",
  description:
    "Protege tus activos digitales con guardianes y recuperacion inteligente. Vault no custodial on-chain.",
  keywords: [
    "crypto vault",
    "smart recovery",
    "wallet recovery",
    "non-custodial",
    "blockchain security",
    "guardian",
    "Vaultix",
    "BSC",
  ],
  metadataBase: new URL(SITE_URL),
  openGraph: {
    type: "website",
    locale: "es_AR",
    url: SITE_URL,
    siteName: "Vaultix",
    title: "Vaultix — Smart Recovery Vault",
    description:
      "Nunca pierdas acceso a tus activos digitales. Vault no custodial con guardianes y recuperacion inteligente.",
    images: [
      {
        url: "/logo-completo-verde.png",
        width: 1200,
        height: 630,
        alt: "Vaultix — Smart Recovery Vault",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Vaultix — Smart Recovery Vault",
    description:
      "Nunca pierdas acceso a tus activos digitales. Vault no custodial con guardianes y recuperacion inteligente.",
    images: ["/logo-completo-verde.png"],
  },
  icons: {
    icon: "/logo-verde.png",
    shortcut: "/logo-verde.png",
    apple: "/logo-verde.png",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="min-h-[100dvh] antialiased">
        <noscript>
          <div style={{ padding: 24, fontFamily: "system-ui, sans-serif" }}>
            Necesitas tener JavaScript activado para usar esta aplicacion.
          </div>
        </noscript>
        <Web3Root>{children}</Web3Root>
      </body>
    </html>
  );
}
