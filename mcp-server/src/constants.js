// Precios de tokens — actualizados via CoinGecko API con cache y fallback estático
// Centralizados acá para evitar duplicación entre engines

// Fallback prices (usados si la API falla o al arrancar)
const FALLBACK_PRICES = {
  BNB: 600,
  USDT: 1,
  USDC: 1,
  BUSD: 1,
  rBTC: 85000,
};

// Live prices — se actualizan en background cada 60s
// Exportado como objeto mutable que todos los engines referencian
export const MOCK_PRICES = { ...FALLBACK_PRICES };

// CoinGecko ID mapping
const COINGECKO_IDS = {
  BNB: "binancecoin",
  USDT: "tether",
  USDC: "usd-coin",
  BUSD: "binance-usd",
  rBTC: "bitcoin", // rBTC tracks BTC price
};

let _lastFetch = 0;
const CACHE_TTL_MS = 60_000; // 60 seconds

/**
 * Fetch live prices from CoinGecko (free, no API key).
 * Updates MOCK_PRICES in-place so all consumers see fresh values.
 * Silent fallback to static prices on error.
 */
export async function refreshPrices() {
  const now = Date.now();
  if (now - _lastFetch < CACHE_TTL_MS) return MOCK_PRICES;

  try {
    const ids = Object.values(COINGECKO_IDS).join(",");
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) throw new Error(`CoinGecko ${res.status}`);
    const data = await res.json();

    // Update prices in-place (all importers see the change)
    for (const [token, geckoId] of Object.entries(COINGECKO_IDS)) {
      if (data[geckoId]?.usd) {
        MOCK_PRICES[token] = data[geckoId].usd;
      }
    }

    _lastFetch = now;
    console.log("[prices] Updated from CoinGecko:", JSON.stringify(MOCK_PRICES));
  } catch (err) {
    // Silent fallback — keep existing prices (static or last successful fetch)
    console.warn("[prices] CoinGecko fetch failed, using cached/fallback:", err.message);
  }

  return MOCK_PRICES;
}

// Tokens soportados por la plataforma
export const SUPPORTED_TOKENS = Object.keys(FALLBACK_PRICES);

// Chains soportadas
export const SUPPORTED_CHAINS = ["BSC Testnet", "Rootstock Testnet"];

// Auto-refresh on import (non-blocking)
refreshPrices().catch(() => {});
