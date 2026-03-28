import type { Request, Response } from 'express';

import { HttpError } from '../middlewares/httpError.js';
import {
  createHerederosForUser,
  listHerederosForUser,
  type HerederoInput,
} from '../services/herederosService.js';

function parseHerederosBody(body: unknown): HerederoInput[] {
  if (typeof body !== 'object' || body === null || !('herederos' in body)) {
    throw new HttpError(400, 'Body debe incluir herederos: array');
  }
  const raw = (body as { herederos: unknown }).herederos;
  if (!Array.isArray(raw)) {
    throw new HttpError(400, 'herederos debe ser un array');
  }

  const out: HerederoInput[] = [];
  for (const item of raw) {
    if (typeof item !== 'object' || item === null) {
      throw new HttpError(400, 'Cada heredero debe ser un objeto con email');
    }
    const email = (item as { email?: unknown }).email;
    if (typeof email !== 'string' || email.trim() === '') {
      throw new HttpError(400, 'Cada heredero debe tener email (string)');
    }
    const display_name = (item as { display_name?: unknown }).display_name;
    out.push({
      email,
      display_name:
        typeof display_name === 'string' || display_name === null ? (display_name ?? null) : null,
    });
  }
  return out;
}

export async function postHerederos(req: Request, res: Response): Promise<void> {
  const authUserId = req.authUserId;
  if (!authUserId) {
    throw new HttpError(500, 'Auth context missing');
  }
  const inputs = parseHerederosBody(req.body);
  const result = await createHerederosForUser(authUserId, inputs);
  res.status(201).json(result);
}

export async function getHerederos(req: Request, res: Response): Promise<void> {
  const authUserId = req.authUserId;
  if (!authUserId) {
    throw new HttpError(500, 'Auth context missing');
  }
  const result = await listHerederosForUser(authUserId);
  res.status(200).json(result);
}
