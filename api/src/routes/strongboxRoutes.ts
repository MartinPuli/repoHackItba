import { Router } from 'express';

import { postStrongboxSetup } from '../controllers/strongboxController.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';
import { requireAuth } from '../middlewares/requireAuth.js';

const router = Router();

router.post('/strongbox/setup', requireAuth, asyncHandler(postStrongboxSetup));

export default router;
