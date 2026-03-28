// Precios mock para testnet -- en produccion vendrian de un oracle/API
// Centralizados aca para evitar duplicacion entre engines
export const MOCK_PRICES = {
  BNB: 600,
  USDT: 1,
  USDC: 1,
  BUSD: 1,
  rBTC: 85000,
};

// Tokens soportados por la plataforma
export const SUPPORTED_TOKENS = Object.keys(MOCK_PRICES);

// Chains soportadas
export const SUPPORTED_CHAINS = ["BSC Testnet", "Rootstock Testnet"];
