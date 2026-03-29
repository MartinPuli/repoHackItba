import type { Request, Response } from 'express';

import { HttpError } from '../middlewares/httpError.js';
import {
  getGuardianPendingRequests,
  getGuardianVaults,
  getHeirVaults,
} from '../services/guardianService.js';

function walletFromAuth(req: Request): string {
  const authUser = req.authUser;
  if (!authUser) throw new HttpError(500, 'Auth context missing');
  const meta = authUser.user_metadata as Record<string, unknown> | undefined;
  const raw = meta?.ethereum_address ?? meta?.wallet_address ?? meta?.address;
  if (typeof raw !== 'string') throw new HttpError(422, 'No wallet in session metadata');
  return raw.toLowerCase();
}

/** GET /api/guardian/vaults — vaults donde soy guardian */
export async function getGuardianVaultsController(req: Request, res: Response): Promise<void> {
  const wallet = walletFromAuth(req);
  const data = await getGuardianVaults(wallet);
  res.status(200).json({ vaults: data });
}

/** GET /api/guardian/pending — solicitudes pendientes de aprobacion */
export async function getGuardianPendingController(req: Request, res: Response): Promise<void> {
  const wallet = walletFromAuth(req);
  const data = await getGuardianPendingRequests(wallet);
  res.status(200).json({ requests: data });
}

/** GET /api/heir/vaults — vaults donde soy recoverer/recovery contact */
export async function getHeirVaultsController(req: Request, res: Response): Promise<void> {
  const wallet = walletFromAuth(req);
  const data = await getHeirVaults(wallet);
  res.status(200).json({ vaults: data });
}
