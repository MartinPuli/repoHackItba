"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type PersonSlot = { email: string; wallet: string };

export type VaultFormData = {
  ownerEmail: string;
  heir1: PersonSlot;
  heir2: PersonSlot;
  guardian1: PersonSlot;
  guardian2: PersonSlot;
};

const emptyPerson = (): PersonSlot => ({ email: "", wallet: "" });

const defaultForm: VaultFormData = {
  ownerEmail: "",
  heir1: emptyPerson(),
  heir2: emptyPerson(),
  guardian1: emptyPerson(),
  guardian2: emptyPerson(),
};

export type VaultFlowContextValue = {
  form: VaultFormData;
  setForm: (patch: Partial<VaultFormData>) => void;
  updatePerson: (
    key: keyof Pick<VaultFormData, "heir1" | "heir2" | "guardian1" | "guardian2">,
    field: keyof PersonSlot,
    value: string
  ) => void;
  vaultSetupComplete: boolean;
  setVaultSetupComplete: (v: boolean) => void;
  /** Balance shown on owner dashboard (ETH, demo). */
  vaultBalanceEth: number;
  setVaultBalanceEth: (n: number) => void;
  heirFundsUnlocked: boolean;
  setHeirFundsUnlocked: (v: boolean) => void;
  vaultOwnerAddress: string;
  setVaultOwnerAddress: (s: string) => void;
  /** Demo: search filter for heir list on dashboard */
  getHeirFilter: string;
  setGetHeirFilter: (s: string) => void;
};

const VaultFlowContext = createContext<VaultFlowContextValue | null>(null);

export function VaultFlowProvider({ children }: { children: ReactNode }) {
  const [form, setFormState] = useState<VaultFormData>(defaultForm);
  const [vaultSetupComplete, setVaultSetupComplete] = useState(false);
  const [vaultBalanceEth, setVaultBalanceEth] = useState(2.5);
  const [heirFundsUnlocked, setHeirFundsUnlocked] = useState(false);
  const [vaultOwnerAddress, setVaultOwnerAddress] = useState(
    "0x1234567890abcdef1234567890abcdef12345678"
  );
  const [getHeirFilter, setGetHeirFilter] = useState("");

  const setForm = useCallback((patch: Partial<VaultFormData>) => {
    setFormState((prev) => ({ ...prev, ...patch }));
  }, []);

  const updatePerson = useCallback(
    (
      key: keyof Pick<VaultFormData, "heir1" | "heir2" | "guardian1" | "guardian2">,
      field: keyof PersonSlot,
      value: string
    ) => {
      setFormState((prev) => ({
        ...prev,
        [key]: { ...prev[key], [field]: value },
      }));
    },
    []
  );

  const value = useMemo(
    () => ({
      form,
      setForm,
      updatePerson,
      vaultSetupComplete,
      setVaultSetupComplete,
      vaultBalanceEth,
      setVaultBalanceEth,
      heirFundsUnlocked,
      setHeirFundsUnlocked,
      vaultOwnerAddress,
      setVaultOwnerAddress,
      getHeirFilter,
      setGetHeirFilter,
    }),
    [
      form,
      setForm,
      updatePerson,
      vaultSetupComplete,
      vaultBalanceEth,
      heirFundsUnlocked,
      vaultOwnerAddress,
      getHeirFilter,
    ]
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
