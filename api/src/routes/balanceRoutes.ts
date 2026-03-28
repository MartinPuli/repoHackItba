import { Router } from 'express';

import { getCajaFuerteBalance, getWalletBalance } from '../controllers/balanceController.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';
import { requireAuth } from '../middlewares/requireAuth.js';

const router = Router();

router.get('/wallet/balance', requireAuth, asyncHandler(getWalletBalance));
router.get('/caja-fuerte/balance', requireAuth, asyncHandler(getCajaFuerteBalance));

export default router;
