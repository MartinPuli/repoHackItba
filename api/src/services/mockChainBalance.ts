import { createHash } from 'crypto';

import { getProvider } from './chainProvider.js';

export type BalanceSource = 'mock' | 'rpc';

export interface NativeBalance {
  symbol: 'BNB';
  wei: string;
  formatted: string;
}

export interface StrongboxBalanceMock {
  chainId: number;
  contractAddress: string;
  native: NativeBalance;
  source: BalanceSource;
}

function u32FromHash(seed: string, salt: string): number {
  const h = createHash('sha256').update(`${seed}:${salt}`).digest();
  return h.readUInt32BE(0);
}

export function readStrongboxBalanceMock(
  contractAddress: string,
  chainId: number
): StrongboxBalanceMock {
  const addr = contractAddress.toLowerCase();
  const nativeWei = BigInt(u32FromHash(addr, 'native')) * 10n ** 12n;

  return {
    chainId,
    contractAddress,
    native: {
      symbol: 'BNB',
      wei: nativeWei.toString(),
      formatted: formatFixed(nativeWei, 18, 6),
    },
    source: 'mock',
  };
}

export async function readStrongboxBalanceFromRpc(
  contractAddress: string,
  chainId: number
): Promise<StrongboxBalanceMock> {
  const provider = getProvider();
  const wei = await provider.getBalance(contractAddress);
  const addr = contractAddress.toLowerCase();

  return {
    chainId,
    contractAddress: addr,
    native: {
      symbol: 'BNB',
      wei: wei.toString(),
      formatted: formatFixed(wei, 18, 6),
    },
    source: 'rpc',
  };
}

function formatFixed(amount: bigint, decimals: number, fractionDigits: number): string {
  if (decimals === 0) {
    return amount.toString();
  }
  const base = 10n ** BigInt(decimals);
  const whole = amount / base;
  const frac = amount % base;
  const fracStr = frac.toString().padStart(decimals, '0').slice(0, fractionDigits);
  return `${whole.toString()}.${fracStr}`;
}
