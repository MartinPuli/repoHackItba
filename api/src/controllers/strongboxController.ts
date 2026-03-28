import type { Request, Response } from 'express';

import { HttpError } from '../middlewares/httpError.js';
import { type StrongboxSetupBody, setupStrongbox } from '../services/strongboxService.js';

function readSetupBody(req: Request): StrongboxSetupBody {
  const b = req.body as Record<string, unknown>;
  if (typeof b?.own_email !== 'string') {
    throw new HttpError(400, 'own_email es requerido (string)');
  }
  if (!Array.isArray(b.guardians) || !Array.isArray(b.heirs)) {
    throw new HttpError(400, 'guardians y heirs deben ser arrays');
  }
  return {
    own_email: b.own_email,
    guardians: b.guardians as StrongboxSetupBody['guardians'],
    heirs: b.heirs as StrongboxSetupBody['heirs'],
  };
}

export async function postStrongboxSetup(req: Request, res: Response): Promise<void> {
  const authUserId = req.authUserId;
  if (!authUserId) {
    throw new HttpError(500, 'Auth context missing');
  }
  const body = readSetupBody(req);
  await setupStrongbox(authUserId, body);
  res.status(201).json({ ok: true });
}
