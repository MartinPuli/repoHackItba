import { Router } from 'express';

import { getHerederos, postHerederos } from '../controllers/herederosController.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';
import { requireAuth } from '../middlewares/requireAuth.js';

const router = Router();

router.post('/herederos', requireAuth, asyncHandler(postHerederos));
router.get('/herederos', requireAuth, asyncHandler(getHerederos));

export default router;
