import type { Request, Response } from 'express';

import { HttpError } from '../middlewares/httpError.js';
import { readStrongboxBalanceMock } from '../services/mockChainBalance.js';
import {
  getStrongboxRowForUser,
  resolveStrongboxMockAddress,
} from '../services/userContractsService.js';

export async function getStrongboxBalance(req: Request, res: Response): Promise<void> {
  const authUserId = req.authUserId;
  if (!authUserId) {
    throw new HttpError(500, 'Auth context missing');
  }

  const row = await getStrongboxRowForUser(authUserId);
  const mockAddr = resolveStrongboxMockAddress(row);
  const balances = readStrongboxBalanceMock(mockAddr, row.chain_id);

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
