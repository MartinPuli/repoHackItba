import cors from 'cors';
import express from 'express';
import helmet from 'helmet';

import { errorHandler } from './middlewares/errorHandler.js';
import authRoutes from './routes/authRoutes.js';
import balanceRoutes from './routes/balanceRoutes.js';
import strongboxRoutes from './routes/strongboxRoutes.js';
import webauthnRoutes from './routes/webauthnRoutes.js';

export const app = express();

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.use('/api/auth', authRoutes);
app.use('/api', balanceRoutes);
app.use('/api', strongboxRoutes);
app.use('/api/webauthn', webauthnRoutes);

app.use(errorHandler);
