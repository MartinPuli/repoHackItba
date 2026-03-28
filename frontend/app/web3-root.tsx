"use client";

import { Providers } from "./providers";
import { ClientErrorBoundary } from "@/components/ClientErrorBoundary";

/**
 * Provee Wagmi/RainbowKit en el árbol. Sin gate de “mounted”: esperar al
 * useEffect dejaba la UI en “Cargando…” si la hidratación fallaba o se
 * demoraba; Wagmi v2 con `ssr: true` en config está pensado para Next.js.
 */
export default function Web3Root({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClientErrorBoundary>
      <Providers>{children}</Providers>
    </ClientErrorBoundary>
  );
}
