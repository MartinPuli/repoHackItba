"use client";

import { Providers } from "./providers";
import { ClientErrorBoundary } from "@/components/ClientErrorBoundary";

/**
 * Provides Wagmi/AppKit in the tree. No "mounted" gate: waiting for
 * useEffect left the UI stuck on "Loading…" if hydration failed or was
 * delayed; Wagmi v2 with `ssr: true` in config is designed for Next.js.
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
