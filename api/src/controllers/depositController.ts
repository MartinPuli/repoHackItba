import type { Request, Response } from 'express';

import { HttpError } from '../middlewares/httpError.js';
import { confirmDeposit, type ConfirmDepositBody } from '../services/depositService.js';

function readConfirmDepositBody(req: Request): ConfirmDepositBody {
  const b = req.body as Record<string, unknown>;
  if (typeof b?.tx_hash !== 'string') {
    throw new HttpError(400, 'tx_hash es requerido (string)');
  }
  if (typeof b?.amount_bnb !== 'string') {
    throw new HttpError(400, 'amount_bnb es requerido (string)');
  }
  return { tx_hash: b.tx_hash, amount_bnb: b.amount_bnb };
}

export async function postStrongboxConfirmDeposit(req: Request, res: Response): Promise<void> {
  const authUserId = req.authUserId;
  if (!authUserId) {
    throw new HttpError(500, 'Auth context missing');
  }
  const body = readConfirmDepositBody(req);
  const result = await confirmDeposit(authUserId, body);
  res.status(200).json(result);
}
