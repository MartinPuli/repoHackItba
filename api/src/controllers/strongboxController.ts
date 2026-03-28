import type { Request, Response } from 'express';

import { HttpError } from '../middlewares/httpError.js';
import { type StrongboxSetupBody, setupStrongbox } from '../services/strongboxService.js';

function readSetupBody(req: Request): StrongboxSetupBody {
  const b = req.body as Record<string, unknown>;
  if (typeof b?.own_email !== 'string') {
    throw new HttpError(400, 'own_email es requerido (string)');
  }
  if (!Array.isArray(b.guardians)) {
    throw new HttpError(400, 'guardians debe ser un array');
  }
  const recovery =
    Array.isArray(b.recovery_contacts)
      ? b.recovery_contacts
      : Array.isArray(b.heirs)
        ? b.heirs
        : null;
  if (!Array.isArray(recovery)) {
    throw new HttpError(400, 'recovery_contacts o heirs debe ser un array (2 contactos)');
  }
  return {
    own_email: b.own_email,
    guardians: b.guardians as StrongboxSetupBody['guardians'],
    recovery_contacts: recovery as StrongboxSetupBody['recovery_contacts'],
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
