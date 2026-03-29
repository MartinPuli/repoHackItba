"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";

interface DemoState {
  isConnected: boolean;
  address: `0x${string}` | undefined;
  openAppKit: () => void;
  disconnectAppKit: () => void;
  // Vault state mocking
  mockBalance: string;
  mockGuardians: string[];
}

const DemoContext = createContext<DemoState | null>(null);

export function DemoMockProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  // Simulated state for UI mock: we start as disconnected
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState<`0x${string}` | undefined>(undefined);

  const openAppKit = () => {
    // Simulamos la apertura de "connect wallet" autoconectando y forzando redirect a dashboard.
    setIsConnected(true);
    setAddress("0xDem0V4ult89AfB0B...");
    router.push("/role");
  };

  const disconnectAppKit = () => {
    setIsConnected(false);
    setAddress(undefined);
    router.push("/");
  };

  return (
    <DemoContext.Provider
      value={{
        isConnected,
        address,
        openAppKit,
        disconnectAppKit,
        mockBalance: "2.5", // demo BNB balance
        mockGuardians: ["Alice Demo (DemoGuardian1...)", "Bob Test (DemoGuardian2...)"],
      }}
    >
      {children}
    </DemoContext.Provider>
  );
}

// Custom hooks to replace reown and wagmi
export function useAppKitAccount() {
  const ctx = useContext(DemoContext);
  if (!ctx) throw new Error("Missing DemoMockContext");
  return { isConnected: ctx.isConnected, address: ctx.address, status: ctx.isConnected ? "connected" : "disconnected" };
}

export function useAppKit() {
  const ctx = useContext(DemoContext);
  if (!ctx) throw new Error("Missing DemoMockContext");
  return { open: ctx.openAppKit, close: () => {} };
}

export function useDisconnect() {
  const ctx = useContext(DemoContext);
  if (!ctx) throw new Error("Missing DemoMockContext");
  return { disconnect: ctx.disconnectAppKit };
}

export function useAccount() {
  const ctx = useContext(DemoContext);
  if (!ctx) throw new Error("Missing DemoMockContext");
  return { address: ctx.address, isConnected: ctx.isConnected };
}

export function useSendTransaction() {
  return { sendTransaction: async () => console.log("Mock Tx Sent") };
}

export function useWriteContract() {
  return { writeContractAsync: async () => "0xmocktxhash" };
}

export function useReadContract() {
  return { data: undefined };
}

export function useDemoContext() {
  const ctx = useContext(DemoContext);
  if (!ctx) throw new Error("Missing DemoMockContext");
  return ctx;
}
