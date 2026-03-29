"use client";

import { type Address } from "viem";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000" as Address;

// Fake async delays
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function useFactoryConfigured(): boolean {
  return true;
}

// ── Factory: Create StrongBox ──
export function useCreateStrongBox() {
  async function createStrongBox() {
    await sleep(1500);
    return { hash: "0xmockhash" as `0x${string}` };
  }
  return { createStrongBox, isPending: false, error: null, publicClient: null };
}

// ── StrongBox: Deposit ──
export function useDepositStrongBox() {
  async function deposit() {
    await sleep(1500);
    return { hash: "0xmockhash" as `0x${string}` };
  }
  return { deposit, isPending: false, error: null, publicClient: null };
}

// ── StrongBox: Withdraw (create request) ──
export function useWithdrawStrongBox() {
  async function withdraw() {
    await sleep(1500);
    return { hash: "0xmockhash" as `0x${string}` };
  }
  return { withdraw, isPending: false, error: null };
}

// ── StrongBox: Approve withdrawal (guardian) ──
export function useApproveWithdrawal() {
  async function approve() {
    await sleep(1500);
    return { hash: "0xmockhash" as `0x${string}` };
  }
  return { approve, isPending: false, error: null };
}

// ── StrongBox: Reject withdrawal (guardian) ──
export function useRejectWithdrawal() {
  async function reject() {
    await sleep(1500);
    return { hash: "0xmockhash" as `0x${string}` };
  }
  return { reject, isPending: false, error: null };
}

// ── StrongBox: Inherit (heir claims) ──
export function useInheritStrongBox() {
  async function inherit() {
    await sleep(1500);
    return { hash: "0xmockhash" as `0x${string}` };
  }
  return { inherit, isPending: false, error: null };
}

// ── StrongBox: Read on-chain state ──
export function useStrongBoxOnChainState(strongBoxAddress: Address | undefined) {
  // Return static demo data
  return {
    lastTimeUsed: BigInt(Date.now() / 1000 - 86400 * 5), // 5 days ago
    timeLimit: BigInt(86400 * 30), // 30 days
    hasPending: true, // Let's show a pending request in the demo
    withdrawalCount: BigInt(1),
  };
}
