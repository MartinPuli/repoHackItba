"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type VaultPersonSlot = {
  email: string;
  wallet: string;
};

export type VaultConfigureForm = {
  ownerEmail: string;
  guardian1: VaultPersonSlot;
  guardian2: VaultPersonSlot;
  recoverer1: VaultPersonSlot;
  recoverer2: VaultPersonSlot;
};

const defaultConfigureForm: VaultConfigureForm = {
  ownerEmail: "",
  guardian1: { email: "", wallet: "" },
  guardian2: { email: "", wallet: "" },
  recoverer1: { email: "", wallet: "" },
  recoverer2: { email: "", wallet: "" },
};

export type VaultFlowContextValue = {
  vaultBalanceEth: number;
  recoveryFundsUnlocked: boolean;
  setRecoveryFundsUnlocked: (v: boolean) => void;
  vaultOwnerAddress: string;
  setVaultOwnerAddress: (address: string) => void;
  vaultSetupComplete: boolean;
  setVaultSetupComplete: (v: boolean) => void;
  form: VaultConfigureForm;
  setForm: (partial: Partial<VaultConfigureForm>) => void;
  updatePerson: (
    slot: keyof Pick<
      VaultConfigureForm,
      "guardian1" | "guardian2" | "recoverer1" | "recoverer2"
    >,
    field: keyof VaultPersonSlot,
    value: string
  ) => void;
  getRecovererFilter: string;
  setGetRecovererFilter: (s: string) => void;
};

const VaultFlowContext = createContext<VaultFlowContextValue | null>(null);

export function VaultFlowProvider({ children }: { children: ReactNode }) {
  const [vaultBalanceEth] = useState(2.5);
  const [recoveryFundsUnlocked, setRecoveryFundsUnlocked] = useState(false);
  const [vaultOwnerAddress, setVaultOwnerAddress] = useState(
    "0x1234567890abcdef1234567890abcdef12345678"
  );
  const [vaultSetupComplete, setVaultSetupComplete] = useState(false);
  const [form, setFormState] =
    useState<VaultConfigureForm>(defaultConfigureForm);
  const [getRecovererFilter, setGetRecovererFilter] = useState("");

  const setForm = useCallback((partial: Partial<VaultConfigureForm>) => {
    setFormState((prev) => ({ ...prev, ...partial }));
  }, []);

  const updatePerson = useCallback(
    (
      slot: keyof Pick<
        VaultConfigureForm,
        "guardian1" | "guardian2" | "recoverer1" | "recoverer2"
      >,
      field: keyof VaultPersonSlot,
      value: string
    ) => {
      setFormState((prev) => ({
        ...prev,
        [slot]: { ...prev[slot], [field]: value },
      }));
    },
    []
  );

  const value = useMemo(
    () => ({
      vaultBalanceEth,
      recoveryFundsUnlocked,
      setRecoveryFundsUnlocked,
      vaultOwnerAddress,
      setVaultOwnerAddress,
      vaultSetupComplete,
      setVaultSetupComplete,
      form,
      setForm,
      updatePerson,
      getRecovererFilter,
      setGetRecovererFilter,
    }),
    [
      vaultBalanceEth,
      recoveryFundsUnlocked,
      vaultOwnerAddress,
      vaultSetupComplete,
      form,
      getRecovererFilter,
      setForm,
      updatePerson,
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
