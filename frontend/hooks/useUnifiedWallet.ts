"use client";

import { useAccount } from "wagmi";
import { useLemon } from "@/context/LemonContext";

/**
 * Unified wallet hook — merges WalletConnect (wagmi) and Lemon SDK auth.
 *
 * - In a normal browser: uses wagmi's useAccount
 * - Inside Lemon WebView: uses the Lemon SDK wallet
 * - Lemon takes priority when both are available
 *
 * This is the ONLY hook pages should use for wallet address / connection state.
 */
export function useUnifiedWallet() {
  const wagmi = useAccount();
  const lemon = useLemon();

  // Lemon WebView → use Lemon wallet
  if (lemon.isLemon && lemon.wallet) {
    return {
      address: lemon.wallet as `0x${string}`,
      isConnected: true,
      isLemon: true,
      /** For pages that need to know the source */
      source: "lemon" as const,
    };
  }

  // Lemon WebView but still authenticating
  if (lemon.isLemon && lemon.authenticating) {
    return {
      address: undefined,
      isConnected: false,
      isLemon: true,
      source: "lemon" as const,
    };
  }

  // Normal browser → wagmi
  return {
    address: wagmi.address,
    isConnected: wagmi.isConnected,
    isLemon: false,
    source: "wagmi" as const,
  };
}
