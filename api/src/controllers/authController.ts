import type { Request, Response } from 'express';

import { HttpError } from '../middlewares/httpError.js';
import { getMeForAuthUser } from '../services/authService.js';

export async function me(req: Request, res: Response): Promise<void> {
  const authUser = req.authUser;
  const authUserId = req.authUserId;
  if (!authUserId || !authUser) {
    throw new HttpError(500, 'Auth context missing');
  }
  const { profile, has_strongbox } = await getMeForAuthUser(authUser);
  res.status(200).json({ profile, has_strongbox });
}
