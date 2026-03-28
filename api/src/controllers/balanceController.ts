import type { Request, Response } from 'express';

import { HttpError } from '../middlewares/httpError.js';
import {
  readCajaFuerteBalancesMock,
  readSmartWalletBalancesMock,
} from '../services/mockChainBalance.js';
import {
  getCajaFuerteRowForUser,
  resolveCajaFuerteMockAddress,
  resolveSmartWalletForUser,
} from '../services/userContractsService.js';

export async function getWalletBalance(req: Request, res: Response): Promise<void> {
  const authUserId = req.authUserId;
  if (!authUserId) {
    throw new HttpError(500, 'Auth context missing');
  }

  const resolution = await resolveSmartWalletForUser(authUserId);
  const contractAddress =
    resolution.kind === 'wallets' ? resolution.row.contract_address : resolution.walletAddress;
  const chainId = resolution.kind === 'wallets' ? resolution.row.chain_id : 97;

  const balances = readSmartWalletBalancesMock(contractAddress, chainId);

  res.status(200).json({
    resolution: resolution.kind,
    balances,
    dbSnapshot:
      resolution.kind === 'wallets'
        ? {
            balance_bnb: resolution.row.balance_bnb,
            balance_usdt: resolution.row.balance_usdt,
            is_deployed: resolution.row.is_deployed,
          }
        : null,
  });
}

export async function getCajaFuerteBalance(req: Request, res: Response): Promise<void> {
  const authUserId = req.authUserId;
  if (!authUserId) {
    throw new HttpError(500, 'Auth context missing');
  }

  const row = await getCajaFuerteRowForUser(authUserId);
  const mockAddr = resolveCajaFuerteMockAddress(row);
  const balances = readCajaFuerteBalancesMock(mockAddr, row.chain_id);

  res.status(200).json({
    balances,
    dbSnapshot: {
      balance_usdt: row.balance_usdt,
      balance_btcb: row.balance_btcb,
      balance_rbtc: row.balance_rbtc,
      is_deployed: row.is_deployed,
      recovery_state: row.recovery_state,
    },
  });
}
