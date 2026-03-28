import type { NextFunction, Request, RequestHandler } from 'express';

import { supabaseAdmin } from '../config/supabase.js';
import { HttpError } from './httpError.js';

function bearerToken(req: Request): string | null {
  const raw = req.headers.authorization;
  if (typeof raw !== 'string' || raw.length === 0) {
    return null;
  }
  const [scheme, token] = raw.split(/\s+/, 2);
  if (scheme?.toLowerCase() !== 'bearer' || !token || token.length === 0) {
    return null;
  }
  return token;
}

/**
 * Exige `Authorization: Bearer <access_token>` (JWT de Supabase Auth).
 * Completa `req.authUserId` y `req.authUser`.
 */
export const requireAuth: RequestHandler = (req, _res, next: NextFunction) => {
  void (async () => {
    try {
      if (!supabaseAdmin) {
        throw new HttpError(500, 'Supabase admin client is not configured');
      }
      const jwt = bearerToken(req);
      if (!jwt) {
        throw new HttpError(401, 'Missing or invalid Authorization header (expected Bearer token)');
      }
      const { data, error } = await supabaseAdmin.auth.getUser(jwt);
      if (error || !data.user?.id) {
        throw new HttpError(401, error?.message ?? 'Invalid or expired session');
      }
      req.authUserId = data.user.id;
      req.authUser = data.user;
      next();
    } catch (err) {
      next(err);
    }
  })();
};
