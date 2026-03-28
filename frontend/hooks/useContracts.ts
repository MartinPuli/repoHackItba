"use client";

/**
 * Contratos StrongBox actuales: Factory + StrongBox (sin Wallet.sol).
 * Para crear vault y depositar usar useStrongBoxChain.
 */
export {
  useFactoryConfigured,
  useStrongBoxOnChainAddress,
  useStrongBoxContractBalance,
  useCreateStrongBox,
  useDepositStrongBox,
  useConnectedAddress,
  FACTORY_ZERO,
} from "./useStrongBoxChain";

export { parseEther, formatEther } from "viem";
