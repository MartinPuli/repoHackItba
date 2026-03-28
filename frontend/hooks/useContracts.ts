"use client";

import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useAccount } from "wagmi";
import { FACTORY_ABI, WALLET_ABI, CAJA_FUERTE_ABI, CONTRACTS } from "@/lib/contracts/abis";
import { parseEther, formatEther, type Address } from "viem";

// ======================
// Factory Hooks
// ======================

/**
 * Check if current user has a Smart Wallet account
 */
export function useHasAccount() {
  const { address } = useAccount();

  return useReadContract({
    address: CONTRACTS.factory as Address,
    abi: FACTORY_ABI,
    functionName: "checkUserHasAccount",
    args: address ? [address] : undefined,
    query: { enabled: !!address && CONTRACTS.factory !== "0x0000000000000000000000000000000000000000" },
  });
}

/**
 * Get user's Wallet address from Factory
 */
export function useWalletAddress() {
  const { address } = useAccount();

  return useReadContract({
    address: CONTRACTS.factory as Address,
    abi: FACTORY_ABI,
    functionName: "getWallet",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });
}

/**
 * Get user's CajaFuerte address from Factory
 */
export function useCajaFuerteAddress() {
  const { address } = useAccount();

  return useReadContract({
    address: CONTRACTS.factory as Address,
    abi: FACTORY_ABI,
    functionName: "getCajaFuerte",
    args: address ? [address] : undefined,
    query: { enabled: !!address },
  });
}

/**
 * Create a new Smart Wallet account (Factory.crear)
 */
export function useCreateAccount() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  function crear(heredero1: string, heredero2: string, timeoutDays: number) {
    writeContract({
      address: CONTRACTS.factory as Address,
      abi: FACTORY_ABI,
      functionName: "crear",
      args: [heredero1 as Address, heredero2 as Address, BigInt(timeoutDays)],
    });
  }

  return { crear, isPending, isConfirming, isSuccess, error, hash };
}

// ======================
// Wallet Hooks
// ======================

/**
 * Read Wallet balance
 */
export function useWalletBalance(walletAddress?: string) {
  return useReadContract({
    address: walletAddress as Address,
    abi: WALLET_ABI,
    functionName: "getBalance",
    query: { enabled: !!walletAddress, refetchInterval: 10_000 },
  });
}

/**
 * Send from Wallet
 */
export function useSendFromWallet() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  function enviar(walletAddress: string, to: string, amountEth: string) {
    writeContract({
      address: walletAddress as Address,
      abi: WALLET_ABI,
      functionName: "enviar",
      args: [to as Address, parseEther(amountEth)],
    });
  }

  return { enviar, isPending, isConfirming, isSuccess, error, hash };
}

/**
 * Deposit to CajaFuerte from Wallet
 */
export function useDepositToCajaFuerte() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  function depositar(walletAddress: string, amountEth: string) {
    writeContract({
      address: walletAddress as Address,
      abi: WALLET_ABI,
      functionName: "depositarEnCajaFuerte",
      args: [parseEther(amountEth)],
    });
  }

  return { depositar, isPending, isConfirming, isSuccess, error, hash };
}

/**
 * Grant Session Key (for Agent autonomy)
 */
export function useGrantSessionKey() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  function grant(walletAddress: string, agentKey: string, maxAmountEth: string, durationSeconds: number) {
    writeContract({
      address: walletAddress as Address,
      abi: WALLET_ABI,
      functionName: "grantSessionKey",
      args: [agentKey as Address, parseEther(maxAmountEth), BigInt(durationSeconds)],
    });
  }

  return { grant, isPending, isConfirming, isSuccess, error, hash };
}

/**
 * Revoke Session Key (Kill Switch)
 */
export function useRevokeSessionKey() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  function revoke(walletAddress: string, agentKey: string) {
    writeContract({
      address: walletAddress as Address,
      abi: WALLET_ABI,
      functionName: "revokeSessionKey",
      args: [agentKey as Address],
    });
  }

  return { revoke, isPending, isConfirming, isSuccess, error, hash };
}

// ======================
// CajaFuerte Hooks
// ======================

/**
 * Read CajaFuerte balance
 */
export function useCajaFuerteBalance(cfAddress?: string) {
  return useReadContract({
    address: cfAddress as Address,
    abi: CAJA_FUERTE_ABI,
    functionName: "getBalance",
    query: { enabled: !!cfAddress, refetchInterval: 10_000 },
  });
}

/**
 * Read Dead Man's Switch status
 */
export function useDeadManStatus(cfAddress?: string) {
  const expired = useReadContract({
    address: cfAddress as Address,
    abi: CAJA_FUERTE_ABI,
    functionName: "isExpired",
    query: { enabled: !!cfAddress, refetchInterval: 30_000 },
  });

  const timeRemaining = useReadContract({
    address: cfAddress as Address,
    abi: CAJA_FUERTE_ABI,
    functionName: "timeRemaining",
    query: { enabled: !!cfAddress, refetchInterval: 30_000 },
  });

  const recoveryInfo = useReadContract({
    address: cfAddress as Address,
    abi: CAJA_FUERTE_ABI,
    functionName: "getRecoveryInfo",
    query: { enabled: !!cfAddress, refetchInterval: 30_000 },
  });

  const herederos = useReadContract({
    address: cfAddress as Address,
    abi: CAJA_FUERTE_ABI,
    functionName: "getHerederos",
    query: { enabled: !!cfAddress },
  });

  return { expired, timeRemaining, recoveryInfo, herederos };
}

/**
 * Reset Dead Man's Switch timer
 */
export function useResetDeadManSwitch() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  function resetTime(cfAddress: string) {
    writeContract({
      address: cfAddress as Address,
      abi: CAJA_FUERTE_ABI,
      functionName: "resetTime",
    });
  }

  return { resetTime, isPending, isConfirming, isSuccess, error, hash };
}

// ======================
// Helpers
// ======================
export { parseEther, formatEther };
