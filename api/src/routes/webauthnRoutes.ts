import { Router } from 'express';
import type { Request, Response } from 'express';

import { asyncHandler } from '../middlewares/asyncHandler.js';
import { requireAuth } from '../middlewares/requireAuth.js';
import {
  getRegistrationOptions,
  verifyRegistration,
  getAuthenticationOptions,
  verifyAuthentication,
  hasRegisteredCredential,
} from '../services/webauthnService.js';
import { getMeForAuthUser } from '../services/authService.js';

const router = Router();

router.get(
  '/register/options',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    await getMeForAuthUser(req.authUser!);
    const options = await getRegistrationOptions(req.authUserId!);
    res.json(options);
  })
);

router.post(
  '/register/verify',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    await getMeForAuthUser(req.authUser!);
    const result = await verifyRegistration(req.authUserId!, req.body);
    res.json(result);
  })
);

router.get(
  '/authenticate/options',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const options = await getAuthenticationOptions(req.authUserId!);
    res.json(options);
  })
);

router.post(
  '/authenticate/verify',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const result = await verifyAuthentication(req.authUserId!, req.body);
    res.json(result);
  })
);

router.get(
  '/status',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const registered = await hasRegisteredCredential(req.authUserId!);
    res.json({ registered });
  })
);

export default router;
