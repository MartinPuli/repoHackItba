import type { Metadata } from "next";
import "./globals.css";
import Web3Root from "./web3-root";

export const metadata: Metadata = {
  title: "Smart Wallet — Agent-First",
  description:
    "Gestor patrimonial autonomo con Account Abstraction, DeFi cross-chain y Agente AI",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className="min-h-screen antialiased"
        style={{ backgroundColor: "#eef1ef", color: "#0f1712" }}
      >
        <noscript>
          <div
            style={{
              padding: 24,
              fontFamily: "system-ui, sans-serif",
              background: "#eef1ef",
              color: "#0f1712",
            }}
          >
            Necesitás tener JavaScript activado para usar esta aplicación.
          </div>
        </noscript>
        <Web3Root>{children}</Web3Root>
      </body>
    </html>
  );
}
