"use client";

import { useState, useEffect } from "react";

// CoinGecko free API — no key needed
const COINGECKO_IDS = "binancecoin,tether,usd-coin,bitcoin";
const CACHE_TTL_MS = 60_000; // 60s

export interface TokenPrices {
  BNB: number;
  USDT: number;
  USDC: number;
  BUSD: number;
  rBTC: number;
}

const FALLBACK: TokenPrices = {
  BNB: 600,
  USDT: 1,
  USDC: 1,
  BUSD: 1,
  rBTC: 85000,
};

// Module-level cache so all hook instances share data
let _cached: TokenPrices = { ...FALLBACK };
let _lastFetch = 0;
let _inflight: Promise<TokenPrices> | null = null;

async function fetchPrices(): Promise<TokenPrices> {
  const now = Date.now();
  if (now - _lastFetch < CACHE_TTL_MS) return _cached;

  // Deduplicate concurrent fetches
  if (_inflight) return _inflight;

  _inflight = (async () => {
    try {
      const res = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${COINGECKO_IDS}&vs_currencies=usd`,
        { signal: AbortSignal.timeout(5000) }
      );
      if (!res.ok) throw new Error(`CoinGecko ${res.status}`);
      const data = await res.json();

      _cached = {
        BNB: data.binancecoin?.usd ?? FALLBACK.BNB,
        USDT: data.tether?.usd ?? FALLBACK.USDT,
        USDC: data["usd-coin"]?.usd ?? FALLBACK.USDC,
        BUSD: FALLBACK.BUSD, // delisted, always $1
        rBTC: data.bitcoin?.usd ?? FALLBACK.rBTC,
      };
      _lastFetch = Date.now();
    } catch {
      // Silent fallback — keep last known prices
    }
    _inflight = null;
    return _cached;
  })();

  return _inflight;
}

/**
 * Hook that returns live token prices from CoinGecko (cached 60s).
 * Falls back to static prices if the API is unreachable.
 */
export function useTokenPrices(): { prices: TokenPrices; loading: boolean } {
  const [prices, setPrices] = useState<TokenPrices>(_cached);
  const [loading, setLoading] = useState(_lastFetch === 0);

  useEffect(() => {
    let cancelled = false;

    fetchPrices().then((p) => {
      if (!cancelled) {
        setPrices(p);
        setLoading(false);
      }
    });

    // Refresh every 60s
    const interval = setInterval(() => {
      fetchPrices().then((p) => {
        if (!cancelled) setPrices(p);
      });
    }, CACHE_TTL_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return { prices, loading };
}
