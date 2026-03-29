"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type VaultFlowContextValue = {
  vaultBalanceEth: number;
  heirFundsUnlocked: boolean;
  setHeirFundsUnlocked: (v: boolean) => void;
  vaultOwnerAddress: string;
  getHeirFilter: string;
  setGetHeirFilter: (s: string) => void;
};

const VaultFlowContext = createContext<VaultFlowContextValue | null>(null);

export function VaultFlowProvider({ children }: { children: ReactNode }) {
  const [vaultBalanceEth] = useState(2.5);
  const [heirFundsUnlocked, setHeirFundsUnlocked] = useState(false);
  const [vaultOwnerAddress] = useState(
    "0x1234567890abcdef1234567890abcdef12345678"
  );
  const [getHeirFilter, setGetHeirFilter] = useState("");

  const value = useMemo(
    () => ({
      vaultBalanceEth,
      heirFundsUnlocked,
      setHeirFundsUnlocked,
      vaultOwnerAddress,
      getHeirFilter,
      setGetHeirFilter,
    }),
    [vaultBalanceEth, heirFundsUnlocked, vaultOwnerAddress, getHeirFilter]
  );

  return (
    <VaultFlowContext.Provider value={value}>{children}</VaultFlowContext.Provider>
  );
}

export function useVaultFlow() {
  const ctx = useContext(VaultFlowContext);
  if (!ctx) {
    throw new Error("useVaultFlow must be used within VaultFlowProvider");
  }
  return ctx;
}
