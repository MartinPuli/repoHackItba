"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { useRouter } from "next/navigation";

const STORAGE_KEY = "vaultix-demo-connected";
const DEMO_ADDRESS = "0xDem0V4ult89AfB0B..." as `0x${string}`;

function readPersistedState(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return sessionStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function persistState(connected: boolean) {
  try {
    if (connected) {
      sessionStorage.setItem(STORAGE_KEY, "1");
    } else {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  } catch {}
}

interface DemoState {
  isConnected: boolean;
  hydrated: boolean;
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
  const [hydrated, setHydrated] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState<`0x${string}` | undefined>(undefined);

  // Restore persisted state after hydration
  useEffect(() => {
    if (readPersistedState()) {
      setIsConnected(true);
      setAddress(DEMO_ADDRESS);
    }
    setHydrated(true);
  }, []);

  const openAppKit = useCallback(() => {
    setIsConnected(true);
    setAddress(DEMO_ADDRESS);
    persistState(true);
    router.push("/role");
  }, [router]);

  const disconnectAppKit = useCallback(() => {
    setIsConnected(false);
    setAddress(undefined);
    persistState(false);
    router.push("/");
  }, [router]);

  return (
    <DemoContext.Provider
      value={{
        isConnected,
        hydrated,
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
  return { isConnected: ctx.isConnected, hydrated: ctx.hydrated, address: ctx.address, status: ctx.isConnected ? "connected" : "disconnected" };
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
  return { address: ctx.address, isConnected: ctx.isConnected, hydrated: ctx.hydrated };
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
