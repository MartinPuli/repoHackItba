import type { Request, Response } from 'express';

import { HttpError } from '../middlewares/httpError.js';
import { confirmDeploy } from '../services/deployService.js';

function readConfirmDeployBody(req: Request): { contract_address: string; deploy_tx_hash: string } {
  const b = req.body as Record<string, unknown>;
  if (typeof b?.contract_address !== 'string') {
    throw new HttpError(400, 'contract_address es requerido (string)');
  }
  if (typeof b?.deploy_tx_hash !== 'string') {
    throw new HttpError(400, 'deploy_tx_hash es requerido (string)');
  }
  return {
    contract_address: b.contract_address,
    deploy_tx_hash: b.deploy_tx_hash,
  };
}

export async function postStrongboxConfirmDeploy(req: Request, res: Response): Promise<void> {
  const authUserId = req.authUserId;
  if (!authUserId) {
    throw new HttpError(500, 'Auth context missing');
  }
  const body = readConfirmDeployBody(req);
  const result = await confirmDeploy(authUserId, body.contract_address, body.deploy_tx_hash);
  res.status(200).json(result);
}
