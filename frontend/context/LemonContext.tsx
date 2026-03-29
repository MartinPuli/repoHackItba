"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  authenticate,
  deposit,
  withdraw,
  isInLemonWebView,
  TransactionResult,
  ChainId,
} from "@/lib/lemon/client";
import type { TokenName } from "@lemoncash/mini-app-sdk";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface LemonState {
  /** Are we running inside the Lemon Cash WebView? */
  isLemon: boolean;
  /** Wallet address from Lemon auth (null until authenticated) */
  wallet: string | null;
  /** Authentication in progress */
  authenticating: boolean;
  /** Last error message */
  error: string | null;
}

interface LemonContextValue extends LemonState {
  /** Manually trigger Lemon authentication */
  lemonAuth: () => Promise<string | null>;
  /** Deposit tokens into the Mini App wallet */
  lemonDeposit: (amount: string, tokenName: TokenName) => Promise<string | null>;
  /** Withdraw tokens from Mini App wallet to Lemon wallet */
  lemonWithdraw: (amount: string, tokenName: TokenName) => Promise<string | null>;
}

/* ------------------------------------------------------------------ */
/*  Context                                                            */
/* ------------------------------------------------------------------ */

const LemonContext = createContext<LemonContextValue | null>(null);

/* ------------------------------------------------------------------ */
/*  Provider                                                           */
/* ------------------------------------------------------------------ */

/** BSC Testnet for hackathon — switch to BNB_SMART_CHAIN for mainnet */
const CHAIN = ChainId.BNB_SMART_CHAIN_TESTNET;

export function LemonProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<LemonState>({
    isLemon: false,
    wallet: null,
    authenticating: false,
    error: null,
  });

  // Detect WebView on mount
  useEffect(() => {
    const inLemon = isInLemonWebView();
    setState((s) => ({ ...s, isLemon: inLemon }));

    // Auto-authenticate when inside Lemon
    if (inLemon) {
      doAuth();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------- authenticate ---------------------------------------- */

  const doAuth = useCallback(async (): Promise<string | null> => {
    setState((s) => ({ ...s, authenticating: true, error: null }));
    try {
      const result = await authenticate({ chainId: CHAIN });

      if (result.result === TransactionResult.SUCCESS) {
        setState((s) => ({
          ...s,
          wallet: result.data.wallet,
          authenticating: false,
        }));
        return result.data.wallet;
      }

      if (result.result === TransactionResult.CANCELLED) {
        setState((s) => ({
          ...s,
          authenticating: false,
          error: "Authentication cancelled by user",
        }));
        return null;
      }

      // FAILED
      const errorMsg =
        "error" in result ? result.error.message : "Authentication failed";
      setState((s) => ({
        ...s,
        authenticating: false,
        error: errorMsg,
      }));
      return null;
    } catch (err) {
      setState((s) => ({
        ...s,
        authenticating: false,
        error: err instanceof Error ? err.message : "Unknown Lemon error",
      }));
      return null;
    }
  }, []);

  const lemonAuth = useCallback(() => doAuth(), [doAuth]);

  /* ---------- deposit --------------------------------------------- */

  const lemonDeposit = useCallback(
    async (amount: string, tokenName: TokenName): Promise<string | null> => {
      try {
        const result = await deposit({ amount, tokenName, chainId: CHAIN });

        if (
          result.result === TransactionResult.SUCCESS ||
          result.result === TransactionResult.PENDING
        ) {
          return result.data.txHash;
        }

        if (result.result === TransactionResult.CANCELLED) return null;

        // FAILED
        const errorMsg =
          "error" in result ? result.error.message : "Deposit failed";
        setState((s) => ({ ...s, error: errorMsg }));
        return null;
      } catch (err) {
        setState((s) => ({
          ...s,
          error: err instanceof Error ? err.message : "Deposit failed",
        }));
        return null;
      }
    },
    [],
  );

  /* ---------- withdraw -------------------------------------------- */

  const lemonWithdraw = useCallback(
    async (amount: string, tokenName: TokenName): Promise<string | null> => {
      try {
        const result = await withdraw({ amount, tokenName, chainId: CHAIN });

        if (
          result.result === TransactionResult.SUCCESS ||
          result.result === TransactionResult.PENDING
        ) {
          return result.data.txHash;
        }

        if (result.result === TransactionResult.CANCELLED) return null;

        const errorMsg =
          "error" in result ? result.error.message : "Withdraw failed";
        setState((s) => ({ ...s, error: errorMsg }));
        return null;
      } catch (err) {
        setState((s) => ({
          ...s,
          error: err instanceof Error ? err.message : "Withdraw failed",
        }));
        return null;
      }
    },
    [],
  );

  /* ---------- value ----------------------------------------------- */

  const value = useMemo<LemonContextValue>(
    () => ({
      ...state,
      lemonAuth,
      lemonDeposit,
      lemonWithdraw,
    }),
    [state, lemonAuth, lemonDeposit, lemonWithdraw],
  );

  return (
    <LemonContext.Provider value={value}>{children}</LemonContext.Provider>
  );
}

/* ------------------------------------------------------------------ */
/*  Hook                                                               */
/* ------------------------------------------------------------------ */

export function useLemon() {
  const ctx = useContext(LemonContext);
  if (!ctx) {
    throw new Error("useLemon must be used within <LemonProvider>");
  }
  return ctx;
}
