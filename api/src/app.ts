import cors from 'cors';
import express from 'express';
import helmet from 'helmet';

import { errorHandler } from './middlewares/errorHandler.js';
import authRoutes from './routes/authRoutes.js';
import balanceRoutes from './routes/balanceRoutes.js';
import herederosRoutes from './routes/herederosRoutes.js';

export const app = express();

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.use('/api/auth', authRoutes);
app.use('/api', balanceRoutes);
app.use('/api', herederosRoutes);

app.use(errorHandler);
