import type { Request, Response } from 'express';

import { HttpError } from '../middlewares/httpError.js';
import {
  createWithdrawalRequest,
  getPendingWithdrawals,
  approveWithdrawal,
  rejectWithdrawal,
  markWithdrawalExecuted,
  type WithdrawRequestBody,
} from '../services/withdrawalService.js';

function readWithdrawBody(req: Request): WithdrawRequestBody {
  const b = req.body as Record<string, unknown>;
  if (typeof b?.amount !== 'string') throw new HttpError(400, 'amount es requerido (string)');
  if (typeof b?.to_address !== 'string') throw new HttpError(400, 'to_address es requerido (string)');
  return {
    amount: b.amount,
    to_address: b.to_address,
    on_chain_request_id: typeof b?.on_chain_request_id === 'number' ? b.on_chain_request_id : undefined,
  };
}

export async function postWithdrawRequest(req: Request, res: Response): Promise<void> {
  const authUserId = req.authUserId;
  if (!authUserId) throw new HttpError(500, 'Auth context missing');
  const body = readWithdrawBody(req);
  const result = await createWithdrawalRequest(authUserId, body);
  res.status(201).json(result);
}

export async function getWithdrawPending(req: Request, res: Response): Promise<void> {
  const authUserId = req.authUserId;
  if (!authUserId) throw new HttpError(500, 'Auth context missing');
  const data = await getPendingWithdrawals(authUserId);
  res.status(200).json({ requests: data });
}

export async function postWithdrawApprove(req: Request, res: Response): Promise<void> {
  const authUser = req.authUser;
  if (!authUser) throw new HttpError(500, 'Auth context missing');

  const wallet =
    (authUser.user_metadata as Record<string, unknown>)?.ethereum_address ??
    (authUser.user_metadata as Record<string, unknown>)?.wallet_address;
  if (typeof wallet !== 'string') throw new HttpError(422, 'No wallet in session metadata');

  const id = req.params.id as string | undefined;
  if (!id) throw new HttpError(400, 'withdrawal id requerido');

  const result = await approveWithdrawal(wallet, id, 1);
  res.status(200).json(result);
}

export async function postWithdrawReject(req: Request, res: Response): Promise<void> {
  const authUser = req.authUser;
  if (!authUser) throw new HttpError(500, 'Auth context missing');

  const wallet =
    (authUser.user_metadata as Record<string, unknown>)?.ethereum_address ??
    (authUser.user_metadata as Record<string, unknown>)?.wallet_address;
  if (typeof wallet !== 'string') throw new HttpError(422, 'No wallet in session metadata');

  const id = req.params.id as string | undefined;
  if (!id) throw new HttpError(400, 'withdrawal id requerido');

  const result = await rejectWithdrawal(wallet, id);
  res.status(200).json(result);
}

export async function postWithdrawExecuted(req: Request, res: Response): Promise<void> {
  const authUserId = req.authUserId;
  if (!authUserId) throw new HttpError(500, 'Auth context missing');

  const id = req.params.id as string | undefined;
  if (!id) throw new HttpError(400, 'withdrawal id requerido');
  const b = req.body as Record<string, unknown>;
  if (typeof b?.tx_hash !== 'string') throw new HttpError(400, 'tx_hash requerido');

  const result = await markWithdrawalExecuted(id, b.tx_hash);
  res.status(200).json(result);
}
