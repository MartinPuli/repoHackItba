import type { Metadata } from "next";
import dynamic from "next/dynamic";
import "./globals.css";

const Web3Root = dynamic(() => import("./web3-root"), {
  ssr: false,
  loading: () => (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#08090c",
        color: "#8b909c",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "system-ui, sans-serif",
        fontSize: 14,
      }}
    >
      Cargando…
    </div>
  ),
});

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
    <html lang="es" className="dark" suppressHydrationWarning>
      <body
        className="min-h-screen antialiased"
        style={{ backgroundColor: "#08090c", color: "#f0f1f4" }}
      >
        <Web3Root>{children}</Web3Root>
      </body>
    </html>
  );
}
