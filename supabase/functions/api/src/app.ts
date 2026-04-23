// @deno-types="npm:@types/express@^4.17"
import express, { Request, Response, NextFunction } from 'npm:express@4.18.2';
import { corsMiddleware } from './middlewares/cors.ts';
import { errorMiddleware } from './middlewares/error.ts';
import { ROUTER_CONFIG, validateRouterConfig } from './config/routers.ts';
import { createLazyRouter, getRouterStats } from './utils/lazyRouter.ts';

const app = express();

validateRouterConfig(ROUTER_CONFIG);

// Handle all OPTIONS preflight requests before any other middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD');
    res.header(
      'Access-Control-Allow-Headers',
      [
        'Origin',
        'X-Requested-With',
        'Content-Type',
        'Accept',
        'Authorization',
        'apikey',
        'x-client-info',
        'Cache-Control',
      ].join(', '),
    );
    res.header('Access-Control-Expose-Headers', 'Authorization, Content-Length');
    res.status(200).end();
    return;
  }
  next();
});

app.use(express.json({ limit: '10mb' }));
app.use(corsMiddleware);

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  const requestId = crypto.randomUUID();

  console.log(JSON.stringify({ requestId, method: req.method, path: req.originalUrl }));

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const level = res.statusCode >= 500 ? 'ERROR' : res.statusCode >= 400 ? 'WARN' : 'INFO';
    console.log(
      JSON.stringify({ level, requestId, method: req.method, path: req.originalUrl, status: res.statusCode, duration }),
    );
  });

  next();
});

// Register all lazy-loaded routers from config
for (const config of ROUTER_CONFIG) {
  app.use(config.path, createLazyRouter(config));
}

// Health check
app.get('/api/healthz', (_req: Request, res: Response) => {
  const stats = getRouterStats();
  res.json({
    status: 'healthy',
    ...stats,
    availableRouters: ROUTER_CONFIG.map((c) => c.key),
    timestamp: new Date().toISOString(),
  });
});

// Error handling
app.use(errorMiddleware);

// 404 fallback
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: { message: 'Not found' } });
});

export { app };
