import { createHash } from 'crypto';

export type BalanceSource = 'mock';

export interface NativeBalance {
  symbol: 'BNB';
  wei: string;
  formatted: string;
}

export interface Erc20LikeBalance {
  symbol: string;
  raw: string;
  decimals: number;
  formatted: string;
}

export interface WalletBalancesMock {
  chainId: number;
  contractAddress: string;
  native: NativeBalance;
  usdt: Erc20LikeBalance;
  source: BalanceSource;
}

export interface CajaFuerteBalancesMock {
  chainId: number;
  contractAddress: string;
  native: NativeBalance;
  usdt: Erc20LikeBalance;
  rbtc: Erc20LikeBalance;
  source: BalanceSource;
}

function u32FromHash(seed: string, salt: string): number {
  const h = createHash('sha256').update(`${seed}:${salt}`).digest();
  return h.readUInt32BE(0);
}

export function readSmartWalletBalancesMock(
  contractAddress: string,
  chainId: number
): WalletBalancesMock {
  const addr = contractAddress.toLowerCase();
  const nativeWei = BigInt(u32FromHash(addr, 'native')) * 10n ** 12n;
  const usdtRaw = BigInt(u32FromHash(addr, 'usdt')) * 10n ** 3n;

  return {
    chainId,
    contractAddress,
    native: {
      symbol: 'BNB',
      wei: nativeWei.toString(),
      formatted: formatFixed(nativeWei, 18, 6),
    },
    usdt: {
      symbol: 'USDT',
      raw: usdtRaw.toString(),
      decimals: 6,
      formatted: formatFixed(usdtRaw, 6, 2),
    },
    source: 'mock',
  };
}

export function readCajaFuerteBalancesMock(
  contractAddress: string,
  chainId: number
): CajaFuerteBalancesMock {
  const addr = contractAddress.toLowerCase();
  const nativeWei = BigInt(u32FromHash(addr, 'cf-native')) * 10n ** 11n;
  const usdtRaw = BigInt(u32FromHash(addr, 'cf-usdt')) * 10n ** 2n;
  const rbtcRaw = BigInt(u32FromHash(addr, 'cf-rbtc')) * 10n ** 4n;

  return {
    chainId,
    contractAddress,
    native: {
      symbol: 'BNB',
      wei: nativeWei.toString(),
      formatted: formatFixed(nativeWei, 18, 6),
    },
    usdt: {
      symbol: 'USDT',
      raw: usdtRaw.toString(),
      decimals: 6,
      formatted: formatFixed(usdtRaw, 6, 2),
    },
    rbtc: {
      symbol: 'RBTC',
      raw: rbtcRaw.toString(),
      decimals: 18,
      formatted: formatFixed(rbtcRaw, 18, 6),
    },
    source: 'mock',
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
