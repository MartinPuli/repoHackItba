import type { Request, Response } from 'express';
import { verifyMessage } from 'ethers';

import { supabaseAdmin } from '../config/supabase.js';
import { HttpError } from '../middlewares/httpError.js';

const SIGN_MESSAGE = 'Sign in to Vaultix — HackITBA 2026';

export async function walletReset(req: Request, res: Response): Promise<void> {
  const { address, signature, newPassword } = req.body as {
    address?: string;
    signature?: string;
    newPassword?: string;
  };

  if (!address || !signature || !newPassword) {
    throw new HttpError(400, 'address, signature and newPassword are required');
  }
  if (!supabaseAdmin) {
    throw new HttpError(500, 'Supabase admin not configured');
  }

  const recovered = verifyMessage(SIGN_MESSAGE, signature).toLowerCase();
  if (recovered !== address.toLowerCase()) {
    throw new HttpError(401, 'Signature does not match address');
  }

  const email = `${address.toLowerCase()}@wallet.local`;

  const { data: listData, error: listErr } = await supabaseAdmin.auth.admin.listUsers();
  if (listErr) throw new HttpError(500, listErr.message);

  const user = listData.users.find((u) => u.email === email);
  if (!user) {
    throw new HttpError(404, 'User not found');
  }

  const { error: updateErr } = await supabaseAdmin.auth.admin.updateUserById(
    user.id,
    { password: newPassword },
  );
  if (updateErr) throw new HttpError(500, updateErr.message);

  res.json({ ok: true });
}
