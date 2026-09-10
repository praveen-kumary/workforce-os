import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { randomUUID } from 'crypto';
import { env, isProduction } from './config/env';
import { logger } from './config/logger';
import { prisma, disconnectDatabase } from './config/database';
import { disconnectRedis, redisClient } from './config/redis';
import { apiRateLimiter } from './middleware/rate-limit';
import { IModule } from './modules/module.interface';
import { CoreModule } from './modules/core';
import { HRModule } from './modules/hr';
import { ITModule } from './modules/it';
import { FinanceModule } from './modules/finance';
import { CRMModule } from './modules/crm';
import { ProjectsModule } from './modules/projects';
import { ProcurementModule } from './modules/procurement';
import { WorkplaceModule } from './modules/workplace';

const app = express();

// ─── Security Middleware ────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: isProduction ? undefined : false, // Disable CSP in dev for hot reload
}));
app.use(compression());
app.use(cors({
  origin: env.CORS_ORIGIN.split(',').map(o => o.trim()),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Request ID & Logging Middleware ────────────────────
app.use((req, res, next) => {
  const requestId = (req.headers['x-request-id'] as string) || randomUUID();
  req.headers['x-request-id'] = requestId;
  res.setHeader('X-Request-ID', requestId);

  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration,
      requestId,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    };

    if (res.statusCode >= 400) {
      logger.warn('Request completed with error', logData);
    } else if (duration > 2000) {
      logger.warn('Slow request detected', logData);
    } else {
      logger.debug('Request completed', logData);
    }
  });

  next();
});

// ─── Rate Limiting ──────────────────────────────────────
app.use('/api', apiRateLimiter);

// ─── Health Check ───────────────────────────────────────
const healthHandler = async (_req: express.Request, res: express.Response) => {
  const checks: Record<string, string> = {};

  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = 'healthy';
  } catch {
    checks.database = 'unhealthy';
  }

  try {
    const redisPing = await redisClient.ping();
    checks.redis = redisPing === 'PONG' ? 'healthy' : 'unhealthy';
  } catch {
    checks.redis = 'unhealthy';
  }

  const dbHealthy = checks.database === 'healthy';
  const isHealthy = Object.values(checks).every(v => v === 'healthy');

  res.status(dbHealthy ? 200 : 503).json({
    status: isHealthy ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '2.0.0',
    checks,
  });
};

app.get('/health', healthHandler);
app.get('/api/health', healthHandler);

// ─── Root Endpoint ──────────────────────────────────────
app.get('/', (_req, res) => {
  res.json({
    name: 'Unified Workforce OS',
    version: '2.0.0',
    status: 'running',
    docs: '/api-docs',
    health: '/health',
  });
});

// ─── Module Registration ────────────────────────────────
const modules: IModule[] = [
  new CoreModule(),
  new HRModule(),
  new ITModule(),
  new FinanceModule(),
  new CRMModule(),
  new ProjectsModule(),
  new ProcurementModule(),
  new WorkplaceModule(),
];

for (const mod of modules) {
  app.use(`/api/${mod.name}`, mod.routes);
  logger.info(`Module registered: ${mod.name}`);
}

// ─── 404 Handler ────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Not Found', message: 'The requested endpoint does not exist.' });
});

// ─── Global Error Handler ───────────────────────────────
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const requestId = _req.headers['x-request-id'];

  logger.error('Unhandled error', {
    error: err,
    message: err.message,
    stack: err.stack,
    requestId,
    url: _req.originalUrl,
    method: _req.method,
  });

  res.status(err.status || 500).json({
    error: isProduction ? 'Internal Server Error' : err.message,
    requestId,
    ...(isProduction ? {} : { stack: err.stack }),
  });
});

// ─── Server Startup ─────────────────────────────────────
const server = app.listen(Number(env.PORT), () => {
  logger.info(`🚀 Unified Workforce OS v2.0.0 running on http://localhost:${env.PORT}`, {
    environment: env.NODE_ENV,
    port: env.PORT,
  });
});

// ─── Graceful Shutdown ──────────────────────────────────
async function gracefulShutdown(signal: string): Promise<void> {
  logger.info(`${signal} received — starting graceful shutdown...`);

  server.close(async () => {
    logger.info('HTTP server closed');
    try {
      await disconnectDatabase();
      await disconnectRedis();
      logger.info('All connections closed — exiting');
      process.exit(0);
    } catch (err) {
      logger.error('Error during shutdown', { error: err });
      process.exit(1);
    }
  });

  // Force exit after 10 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10_000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('uncaughtException', (err) => {
  logger.fatal('Uncaught exception', { error: err });
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.fatal('Unhandled rejection', { reason });
  process.exit(1);
});

export { app };
export default app;
