"use client";

import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useAccount } from "wagmi";
import { parseEther, formatEther, type Address } from "viem";

// TODO: regenerar abis.ts con el nuevo sync-abis.js después de compilar contratos
// import { FACTORY_ABI, STRONGBOX_ABI, GUARDIAN_ABI, HEIR_ABI, CONTRACTS } from "@/lib/contracts/abis";

// Placeholder — se reemplaza al correr sync-abis.js
const FACTORY_ABI: readonly unknown[] = [];
const STRONGBOX_ABI: readonly unknown[] = [];
const GUARDIAN_ABI: readonly unknown[] = [];
const HEIR_ABI: readonly unknown[] = [];
const CONTRACTS = {
  factory: (process.env.NEXT_PUBLIC_FACTORY_ADDRESS || "0x0000000000000000000000000000000000000000") as `0x${string}`,
} as const;

// ======================
// Factory Hooks
// ======================

/**
 * Create a new StrongBox vault via Factory
 */
export function useCreateStrongBox() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  function create(
    guardian1: string,
    guardian2: string,
    heir1: string,
    heir2: string,
    timeLimitSeconds: number
  ) {
    writeContract({
      address: CONTRACTS.factory,
      abi: FACTORY_ABI,
      functionName: "createStrongBox",
      args: [
        guardian1 as Address,
        guardian2 as Address,
        heir1 as Address,
        heir2 as Address,
        BigInt(timeLimitSeconds),
      ],
    });
  }

  return { create, isPending, isConfirming, isSuccess, error, hash };
}

/**
 * Get user's StrongBox address from Factory
 */
export function useStrongBoxAddress() {
  const { address } = useAccount();

  return useReadContract({
    address: CONTRACTS.factory,
    abi: FACTORY_ABI,
    functionName: "getStrongBox",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });
}

// ======================
// StrongBox Hooks (Owner)
// ======================

/**
 * Deposit BNB into StrongBox
 */
export function useDeposit() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  function deposit(strongboxAddress: string, amountEth: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    writeContract({
      address: strongboxAddress as Address,
      abi: STRONGBOX_ABI,
      functionName: "deposit",
      value: parseEther(amountEth),
    } as any);
  }

  return { deposit, isPending, isConfirming, isSuccess, error, hash };
}

/**
 * Request withdrawal from StrongBox (needs guardian approval)
 */
export function useRequestWithdrawal() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  function requestWithdrawal(strongboxAddress: string, amountEth: string, to: string) {
    writeContract({
      address: strongboxAddress as Address,
      abi: STRONGBOX_ABI,
      functionName: "withdraw",
      args: [parseEther(amountEth), to as Address],
    });
  }

  return { requestWithdrawal, isPending, isConfirming, isSuccess, error, hash };
}

/**
 * Read StrongBox balance (owner only)
 */
export function useStrongBoxBalance(strongboxAddress?: string) {
  return useReadContract({
    address: strongboxAddress as Address,
    abi: STRONGBOX_ABI,
    functionName: "getBalance",
    query: { enabled: !!strongboxAddress, refetchInterval: 10_000 },
  });
}

/**
 * Check pending withdrawal request
 */
export function usePendingWithdrawal(strongboxAddress?: string) {
  return useReadContract({
    address: strongboxAddress as Address,
    abi: STRONGBOX_ABI,
    functionName: "hasPendingWithdrawalRequest",
    query: { enabled: !!strongboxAddress, refetchInterval: 10_000 },
  });
}

/**
 * Read inactivity timer info
 */
export function useInactivityStatus(strongboxAddress?: string) {
  const lastUsed = useReadContract({
    address: strongboxAddress as Address,
    abi: STRONGBOX_ABI,
    functionName: "getLastTimeUsed",
    query: { enabled: !!strongboxAddress, refetchInterval: 30_000 },
  });

  const timeLimit = useReadContract({
    address: strongboxAddress as Address,
    abi: STRONGBOX_ABI,
    functionName: "getTimeLimit",
    query: { enabled: !!strongboxAddress },
  });

  return { lastUsed, timeLimit };
}

// ======================
// Guardian Hooks
// ======================

/**
 * Approve a withdrawal request (guardian only)
 */
export function useApproveWithdrawal() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  function approve(strongboxAddress: string, requestId: number) {
    writeContract({
      address: strongboxAddress as Address,
      abi: STRONGBOX_ABI,
      functionName: "approveWithdrawal",
      args: [BigInt(requestId)],
    });
  }

  return { approve, isPending, isConfirming, isSuccess, error, hash };
}

/**
 * Reject a withdrawal request (guardian only)
 */
export function useRejectWithdrawal() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  function reject(strongboxAddress: string, requestId: number) {
    writeContract({
      address: strongboxAddress as Address,
      abi: STRONGBOX_ABI,
      functionName: "rejectWithdrawal",
      args: [BigInt(requestId)],
    });
  }

  return { reject, isPending, isConfirming, isSuccess, error, hash };
}

// ======================
// Heir / Recovery Hooks
// ======================

/**
 * Claim recovery funds (heir only, after inactivity timeout)
 */
export function useClaimRecovery() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  function claim(strongboxAddress: string) {
    writeContract({
      address: strongboxAddress as Address,
      abi: STRONGBOX_ABI,
      functionName: "inherit",
    });
  }

  return { claim, isPending, isConfirming, isSuccess, error, hash };
}

// ======================
// Helpers
// ======================
export { parseEther, formatEther };
