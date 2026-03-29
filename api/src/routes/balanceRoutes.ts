import { Router } from 'express';

import { getStrongboxBalance } from '../controllers/balanceController.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';
import { requireAuth } from '../middlewares/requireAuth.js';

const router = Router();

router.get('/strongbox/balance', requireAuth, asyncHandler(getStrongboxBalance));
router.get('/caja-fuerte/balance', requireAuth, asyncHandler(getStrongboxBalance));

export default router;
