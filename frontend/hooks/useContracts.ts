"use client";

import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useAccount } from "wagmi";
import { parseEther, formatEther, type Address, zeroAddress } from "viem";
import { FACTORY_ABI, STRONGBOX_ABI, CONTRACTS } from "@/lib/contracts/abis";

const ZERO = zeroAddress;

// ======================
// Factory Hooks
// ======================

/**
 * Indica si la wallet conectada ya tiene una StrongBox en la factory.
 */
export function useHasAccount() {
  const { address } = useAccount();

  return useReadContract({
    address: CONTRACTS.factory as Address,
    abi: FACTORY_ABI,
    functionName: "getStrongBox",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && CONTRACTS.factory !== ZERO,
      select: (strongBox) => strongBox !== ZERO,
    },
  });
}

/**
 * Dirección de la StrongBox del usuario según la Factory.
 */
export function useStrongBoxAddress() {
  const { address } = useAccount();

  return useReadContract({
    address: CONTRACTS.factory as Address,
    abi: FACTORY_ABI,
    functionName: "getStrongBox",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });
}

/** @deprecated Usar useStrongBoxAddress */
export function useCajaFuerteAddress() {
  return useStrongBoxAddress();
}

/**
 * Crea StrongBox on-chain (guardianes, heirs y time limit en segundos).
 */
export function useCreateStrongBox() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  function createStrongBox(
    guardian1: string,
    guardian2: string,
    heir1: string,
    heir2: string,
    timeLimitSeconds: bigint | number
  ) {
    writeContract({
      address: CONTRACTS.factory as Address,
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

  return { createStrongBox, isPending, isConfirming, isSuccess, error, hash };
}

// ======================
// StrongBox Hooks
// ======================

export function useStrongBoxBalance(strongBoxAddress?: string) {
  return useReadContract({
    address: strongBoxAddress as Address,
    abi: STRONGBOX_ABI,
    functionName: "getBalance",
    query: { enabled: !!strongBoxAddress, refetchInterval: 10_000 },
  });
}

/** @deprecated Usar useStrongBoxBalance */
export function useWalletBalance(walletAddress?: string) {
  return useStrongBoxBalance(walletAddress);
}

/**
 * Solicitud de retiro (el owner llama withdraw; los guardianes aprueban después).
 */
export function useRequestWithdrawal() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  function requestWithdrawal(strongBoxAddress: string, to: string, amountEth: string) {
    writeContract({
      address: strongBoxAddress as Address,
      abi: STRONGBOX_ABI,
      functionName: "withdraw",
      args: [parseEther(amountEth), to as Address],
    });
  }

  return { requestWithdrawal, isPending, isConfirming, isSuccess, error, hash };
}

/** @deprecated Usar useRequestWithdrawal */
export function useSendFromWallet() {
  const { requestWithdrawal, ...rest } = useRequestWithdrawal();
  return {
    enviar: (walletAddress: string, to: string, amountEth: string) =>
      requestWithdrawal(walletAddress, to, amountEth),
    ...rest,
  };
}

export function useDepositToStrongBox() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  function deposit(strongBoxAddress: string, amountEth: string) {
    writeContract({
      address: strongBoxAddress as Address,
      abi: STRONGBOX_ABI,
      functionName: "deposit",
      value: parseEther(amountEth),
    });
  }

  return { deposit, isPending, isConfirming, isSuccess, error, hash };
}

/** @deprecated Usar useDepositToStrongBox */
export function useDepositToCajaFuerte() {
  const { deposit, ...rest } = useDepositToStrongBox();
  return {
    depositar: (walletAddress: string, amountEth: string) => deposit(walletAddress, amountEth),
    ...rest,
  };
}

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
