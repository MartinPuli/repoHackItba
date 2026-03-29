/**
 * Lemon Cash Mini App SDK — thin wrapper.
 *
 * Re-exports the SDK functions we use and adds SSR-safe guards.
 */

export {
  authenticate,
  deposit,
  withdraw,
  isWebView,
  isLemonWebView,
  TransactionResult,
  ChainId,
  TokenName,
} from "@lemoncash/mini-app-sdk";

export type { TokenName as TokenNameType } from "@lemoncash/mini-app-sdk";

/** SSR-safe check: returns true only in Lemon Cash WebView */
export function isInLemonWebView(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const { isLemonWebView } = require("@lemoncash/mini-app-sdk");
    return isLemonWebView();
  } catch {
    return false;
  }
}
