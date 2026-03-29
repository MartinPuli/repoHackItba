import { Router } from 'express';

import { me } from '../controllers/authController.js';
import { walletReset } from '../controllers/walletResetController.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';
import { requireAuth } from '../middlewares/requireAuth.js';

const router = Router();

router.get('/me', requireAuth, asyncHandler(me));
router.post('/wallet-reset', asyncHandler(walletReset));

export default router;
