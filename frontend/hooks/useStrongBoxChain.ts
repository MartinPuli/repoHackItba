"use client";

import {
  useWriteContract,
  usePublicClient,
  useReadContract,
} from "wagmi";
import { FACTORY_ABI, STRONGBOX_ABI, CONTRACTS } from "@/lib/contracts/abis";
import { parseEther, type Address } from "viem";

const ZERO_ADDRESS =
  "0x0000000000000000000000000000000000000000" as Address;

export function useFactoryConfigured(): boolean {
  return (
    !!CONTRACTS.factory &&
    CONTRACTS.factory.toLowerCase() !== ZERO_ADDRESS.toLowerCase()
  );
}

function isFactoryReady(): boolean {
  return (
    !!CONTRACTS.factory &&
    CONTRACTS.factory.toLowerCase() !== ZERO_ADDRESS.toLowerCase()
  );
}

// ── Factory: Create StrongBox ──

export function useCreateStrongBox() {
  const { writeContractAsync, isPending, error } = useWriteContract();
  const publicClient = usePublicClient();

  async function createStrongBox(args: {
    guardian1: Address;
    guardian2: Address;
    heir1: Address;
    heir2: Address;
    timeLimitSeconds: bigint;
  }): Promise<{ hash: `0x${string}` }> {
    if (!isFactoryReady()) {
      throw new Error("Factory no configurada (NEXT_PUBLIC_FACTORY_ADDRESS)");
    }
    const hash = await writeContractAsync({
      address: CONTRACTS.factory,
      abi: FACTORY_ABI,
      functionName: "createStrongBox",
      args: [
        args.guardian1,
        args.guardian2,
        args.heir1,
        args.heir2,
        args.timeLimitSeconds,
      ],
    });
    if (publicClient) {
      await publicClient.waitForTransactionReceipt({ hash });
    }
    return { hash };
  }

  return { createStrongBox, isPending, error, publicClient };
}

// ── StrongBox: Deposit ──

export function useDepositStrongBox() {
  const { writeContractAsync, isPending, error } = useWriteContract();
  const publicClient = usePublicClient();

  async function deposit(args: {
    strongBoxAddress: Address;
    amountBnb: string;
  }): Promise<{ hash: `0x${string}` }> {
    const value = parseEther(args.amountBnb);
    if (value <= BigInt(0)) throw new Error("El monto debe ser mayor a 0");

    const hash = await writeContractAsync({
      address: args.strongBoxAddress,
      abi: STRONGBOX_ABI,
      functionName: "deposit",
      value,
    });
    if (publicClient) {
      await publicClient.waitForTransactionReceipt({ hash });
    }
    return { hash };
  }

  return { deposit, isPending, error, publicClient };
}

// ── StrongBox: Withdraw (create request) ──

export function useWithdrawStrongBox() {
  const { writeContractAsync, isPending, error } = useWriteContract();
  const publicClient = usePublicClient();

  async function withdraw(args: {
    strongBoxAddress: Address;
    amountBnb: string;
    toAddress: Address;
  }): Promise<{ hash: `0x${string}` }> {
    const value = parseEther(args.amountBnb);
    if (value <= BigInt(0)) throw new Error("El monto debe ser mayor a 0");

    const hash = await writeContractAsync({
      address: args.strongBoxAddress,
      abi: STRONGBOX_ABI,
      functionName: "withdraw",
      args: [value, args.toAddress],
    });
    if (publicClient) {
      await publicClient.waitForTransactionReceipt({ hash });
    }
    return { hash };
  }

  return { withdraw, isPending, error };
}

// ── StrongBox: Approve withdrawal (guardian) ──

export function useApproveWithdrawal() {
  const { writeContractAsync, isPending, error } = useWriteContract();
  const publicClient = usePublicClient();

  async function approve(args: {
    strongBoxAddress: Address;
    requestId: bigint;
  }): Promise<{ hash: `0x${string}` }> {
    const hash = await writeContractAsync({
      address: args.strongBoxAddress,
      abi: STRONGBOX_ABI,
      functionName: "approveWithdrawal",
      args: [args.requestId],
    });
    if (publicClient) {
      await publicClient.waitForTransactionReceipt({ hash });
    }
    return { hash };
  }

  return { approve, isPending, error };
}

// ── StrongBox: Reject withdrawal (guardian) ──

export function useRejectWithdrawal() {
  const { writeContractAsync, isPending, error } = useWriteContract();
  const publicClient = usePublicClient();

  async function reject(args: {
    strongBoxAddress: Address;
    requestId: bigint;
  }): Promise<{ hash: `0x${string}` }> {
    const hash = await writeContractAsync({
      address: args.strongBoxAddress,
      abi: STRONGBOX_ABI,
      functionName: "rejectWithdrawal",
      args: [args.requestId],
    });
    if (publicClient) {
      await publicClient.waitForTransactionReceipt({ hash });
    }
    return { hash };
  }

  return { reject, isPending, error };
}

// ── StrongBox: Inherit (heir claims) ──

export function useInheritStrongBox() {
  const { writeContractAsync, isPending, error } = useWriteContract();
  const publicClient = usePublicClient();

  async function inherit(args: {
    strongBoxAddress: Address;
  }): Promise<{ hash: `0x${string}` }> {
    const hash = await writeContractAsync({
      address: args.strongBoxAddress,
      abi: STRONGBOX_ABI,
      functionName: "inherit",
    });
    if (publicClient) {
      await publicClient.waitForTransactionReceipt({ hash });
    }
    return { hash };
  }

  return { inherit, isPending, error };
}

// ── StrongBox: Read on-chain state ──

export function useStrongBoxOnChainState(strongBoxAddress: Address | undefined) {
  const enabled = !!strongBoxAddress && strongBoxAddress !== ZERO_ADDRESS;

  const { data: lastTimeUsed } = useReadContract({
    address: strongBoxAddress,
    abi: STRONGBOX_ABI,
    functionName: "getLastTimeUsed",
    query: { enabled },
  });

  const { data: timeLimit } = useReadContract({
    address: strongBoxAddress,
    abi: STRONGBOX_ABI,
    functionName: "getTimeLimit",
    query: { enabled },
  });

  const { data: hasPending } = useReadContract({
    address: strongBoxAddress,
    abi: STRONGBOX_ABI,
    functionName: "hasPendingWithdrawalRequest",
    query: { enabled },
  });

  const { data: withdrawalCount } = useReadContract({
    address: strongBoxAddress,
    abi: STRONGBOX_ABI,
    functionName: "getWithdrawalRequestCount",
    query: { enabled },
  });

  return {
    lastTimeUsed: lastTimeUsed as bigint | undefined,
    timeLimit: timeLimit as bigint | undefined,
    hasPending: hasPending as boolean | undefined,
    withdrawalCount: withdrawalCount as bigint | undefined,
  };
}
