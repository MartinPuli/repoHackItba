import { Router } from 'express';

import { postStrongboxConfirmDeposit } from '../controllers/depositController.js';
import { postStrongboxConfirmDeploy } from '../controllers/deployConfirmController.js';
import { postStrongboxSetup } from '../controllers/strongboxController.js';
import {
  postWithdrawRequest,
  getWithdrawPending,
  postWithdrawApprove,
  postWithdrawReject,
  postWithdrawExecuted,
} from '../controllers/withdrawalController.js';
import {
  getGuardianVaultsController,
  getGuardianPendingController,
  getHeirVaultsController,
} from '../controllers/guardianController.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';
import { requireAuth } from '../middlewares/requireAuth.js';

const router = Router();

// ── Strongbox setup & deploy ──
router.post('/strongbox/setup', requireAuth, asyncHandler(postStrongboxSetup));
router.post('/strongbox/confirm-deploy', requireAuth, asyncHandler(postStrongboxConfirmDeploy));
router.post('/strongbox/confirm-deposit', requireAuth, asyncHandler(postStrongboxConfirmDeposit));

// ── Withdrawal flow ──
router.post('/strongbox/withdraw/request', requireAuth, asyncHandler(postWithdrawRequest));
router.get('/strongbox/withdraw/pending', requireAuth, asyncHandler(getWithdrawPending));
router.post('/strongbox/withdraw/:id/approve', requireAuth, asyncHandler(postWithdrawApprove));
router.post('/strongbox/withdraw/:id/reject', requireAuth, asyncHandler(postWithdrawReject));
router.post('/strongbox/withdraw/:id/executed', requireAuth, asyncHandler(postWithdrawExecuted));

// ── Guardian endpoints ──
router.get('/guardian/vaults', requireAuth, asyncHandler(getGuardianVaultsController));
router.get('/guardian/pending', requireAuth, asyncHandler(getGuardianPendingController));

// ── Heir / Recovery endpoints ──
router.get('/heir/vaults', requireAuth, asyncHandler(getHeirVaultsController));

export default router;
