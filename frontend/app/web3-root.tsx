"use client";

import { useEffect, useState } from "react";
import { Providers } from "./providers";
import { ClientErrorBoundary } from "@/components/ClientErrorBoundary";

function LoadingShell() {
  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#eef1ef",
        color: "#3d4f45",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        fontFamily: "system-ui, sans-serif",
        fontSize: 15,
        padding: 24,
        textAlign: "center",
      }}
    >
      <span style={{ fontWeight: 600, color: "#0f1712" }}>
        Cargando Smart Wallet…
      </span>
      <span style={{ fontSize: 13, maxWidth: 320, lineHeight: 1.4 }}>
        Si esto tarda mucho, recargá con Ctrl+F5 (evita caché de chunks viejos
        mientras desarrollás).
      </span>
    </div>
  );
}

/**
 * Sin `next/dynamic`: el HMR en dev no deja huérfano un chunk lazy (causa típica
 * de pantalla en blanco “de la nada”). Wagmi/RainbowKit solo corren tras mount.
 */
export default function Web3Root({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <LoadingShell />;
  }

  return (
    <ClientErrorBoundary>
      <Providers>{children}</Providers>
    </ClientErrorBoundary>
  );
}
