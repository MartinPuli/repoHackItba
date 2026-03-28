"use client";

import {
  useReadContract,
  useWriteContract,
  usePublicClient,
  useAccount,
} from "wagmi";
import { FACTORY_ABI, STRONGBOX_ABI, CONTRACTS } from "@/lib/contracts/abis";
import { parseEther, type Address } from "viem";

export const FACTORY_ZERO =
  "0x0000000000000000000000000000000000000000" as Address;

export function useFactoryConfigured(): boolean {
  return (
    !!CONTRACTS.factory &&
    CONTRACTS.factory.toLowerCase() !== FACTORY_ZERO.toLowerCase()
  );
}

/** Dirección StrongBox on-chain según Factory (0x0 si no hay). */
export function useStrongBoxOnChainAddress(owner?: Address | null) {
  const factoryOk = useFactoryConfigured();
  const enabled = !!owner && factoryOk;

  return useReadContract({
    address: CONTRACTS.factory,
    abi: FACTORY_ABI,
    functionName: "getStrongBox",
    args: owner ? [owner] : undefined,
    query: { enabled },
  });
}

/** Saldo nativo en el contrato StrongBox (solo lectura on-chain). */
export function useStrongBoxContractBalance(strongBoxAddress?: Address | null) {
  return useReadContract({
    address: (strongBoxAddress ?? FACTORY_ZERO) as Address,
    abi: STRONGBOX_ABI,
    functionName: "getBalance",
    query: {
      enabled: !!strongBoxAddress && strongBoxAddress !== FACTORY_ZERO,
      refetchInterval: 15_000,
    },
  });
}

function isFactoryReady(): boolean {
  return (
    !!CONTRACTS.factory &&
    CONTRACTS.factory.toLowerCase() !== FACTORY_ZERO.toLowerCase()
  );
}

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

/** Conveniencia: cuenta conectada como Address. */
export function useConnectedAddress(): Address | undefined {
  const { address } = useAccount();
  return address;
}
