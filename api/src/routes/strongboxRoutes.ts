import { Router } from 'express';

import { postStrongboxConfirmDeposit } from '../controllers/depositController.js';
import { postStrongboxConfirmDeploy } from '../controllers/deployConfirmController.js';
import { postStrongboxSetup } from '../controllers/strongboxController.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';
import { requireAuth } from '../middlewares/requireAuth.js';

const router = Router();

router.post('/strongbox/setup', requireAuth, asyncHandler(postStrongboxSetup));
router.post('/strongbox/confirm-deploy', requireAuth, asyncHandler(postStrongboxConfirmDeploy));
router.post('/strongbox/confirm-deposit', requireAuth, asyncHandler(postStrongboxConfirmDeposit));

export default router;
