"use client";

import { Providers } from "./providers";

/**
 * Este componente solo se empaqueta en el bundle de cliente (vía dynamic ssr:false).
 * Así `providers` → `wagmi/config` → conectores no se evalúan en el servidor (evita 500).
 */
export default function Web3Root({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Providers>{children}</Providers>;
}
