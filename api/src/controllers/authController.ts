import type { Request, Response } from 'express';

import { HttpError } from '../middlewares/httpError.js';
import { getMeForAuthUserId, signInUser, signUpUser } from '../services/authService.js';

function readCredentials(req: Request): { email: string; password: string } {
  const { email, password } = req.body as { email?: unknown; password?: unknown };
  if (typeof email !== 'string' || email.trim() === '') {
    throw new HttpError(400, 'email is required');
  }
  if (typeof password !== 'string' || password === '') {
    throw new HttpError(400, 'password is required');
  }
  return { email: email.trim(), password };
}

export async function register(req: Request, res: Response): Promise<void> {
  const { email, password } = readCredentials(req);
  const { session, profile } = await signUpUser(email, password);
  res.status(201).json({ session, profile });
}

export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = readCredentials(req);
  const { session, profile } = await signInUser(email, password);
  res.status(200).json({ session, profile });
}

export async function me(req: Request, res: Response): Promise<void> {
  const authUserId = req.authUserId;
  if (!authUserId) {
    throw new HttpError(500, 'Auth context missing');
  }
  const profile = await getMeForAuthUserId(authUserId);
  res.status(200).json({ profile });
}
