import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config';
import apiRoutes from './routes/api';

export function createServer(): Application {
  const app = express();

  // Security middleware
  app.use(helmet());
  app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));

  // Rate limiting
  const limiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: config.API_RATE_LIMIT_PER_MINUTE,
    message: {
      success: false,
      error: 'rate_limit_exceeded',
      retry_after: 60,
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use(limiter);

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Request logging
  app.use((req: Request, _res: Response, next: NextFunction) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
  });

  // Routes
  app.use('/api/v1', apiRoutes);

  // Root endpoint
  app.get('/', (_req: Request, res: Response) => {
    res.json({
      name: 'Crypto-Heranca Keeper',
      version: '0.1.0',
      status: 'running',
      endpoints: [
        'POST /api/v1/heartbeat',
        'GET /api/v1/vaults',
        'GET /api/v1/vaults/:vault_address/status',
        'POST /api/v1/notifications/register',
        'GET /api/v1/health',
        'GET /api/v1/expired',
      ],
    });
  });

  // 404 handler
  app.use((_req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      error: 'not_found',
    });
  });

  // Error handler
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error('[Server] Error:', err);
    res.status(500).json({
      success: false,
      error: 'internal_server_error',
    });
  });

  return app;
}
