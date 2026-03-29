import type { Request, Response } from 'express';

import { HttpError } from '../middlewares/httpError.js';
import {
  readStrongboxBalanceFromRpc,
  readStrongboxBalanceMock,
} from '../services/mockChainBalance.js';
import {
  getStrongboxRowForUser,
  resolveStrongboxMockAddress,
} from '../services/userContractsService.js';

function isLikelyEvmAddress(addr: string | null | undefined): boolean {
  return typeof addr === 'string' && /^0x[a-fA-F0-9]{40}$/.test(addr.trim());
}

export async function getStrongboxBalance(req: Request, res: Response): Promise<void> {
  const authUserId = req.authUserId;
  if (!authUserId) {
    throw new HttpError(500, 'Auth context missing');
  }

  const row = await getStrongboxRowForUser(authUserId);

  const useRpc = row.is_deployed && isLikelyEvmAddress(row.contract_address);
  const balances = useRpc
    ? await readStrongboxBalanceFromRpc(row.contract_address!.trim(), row.chain_id)
    : readStrongboxBalanceMock(resolveStrongboxMockAddress(row), row.chain_id);

  res.status(200).json({
    balances,
    dbSnapshot: {
      balance_native: row.balance_native,
      is_deployed: row.is_deployed,
      recovery_state: row.recovery_state,
      time_limit_seconds: row.time_limit_seconds,
      last_activity_at: row.last_activity_at,
    },
  });
}
