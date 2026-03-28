import type { ErrorRequestHandler } from 'express';

import { HttpError } from './httpError.js';

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof HttpError) {
    res.status(err.statusCode).json({
      error: err.message,
      ...(err.code ? { code: err.code } : {}),
    });
    return;
  }

  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
};
