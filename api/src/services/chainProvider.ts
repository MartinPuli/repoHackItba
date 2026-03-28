import { JsonRpcProvider } from 'ethers';

import { HttpError } from '../middlewares/httpError.js';

let cached: JsonRpcProvider | null = null;

export function getProvider(): JsonRpcProvider {
  if (cached) return cached;
  const url = process.env.RPC_URL?.trim();
  if (!url) {
    throw new HttpError(500, 'RPC_URL no configurado en el servidor');
  }
  cached = new JsonRpcProvider(url);
  return cached;
}
