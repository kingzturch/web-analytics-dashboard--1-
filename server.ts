import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'node:fs';
import { createServer as createViteServer } from 'vite';
import { CollectorService } from './src/services/collectorService';
import { queueService } from './src/services/queueService';
import { Logger } from './src/lib/logger';
import { getRequiredEnv, requireServerEnv } from './src/lib/env';

import { testSupabaseConnection, validateSupabaseEnv } from './src/lib/supabase/server';

async function startServer() {
  requireServerEnv();

  const app = express();
  const PORT = Number(getRequiredEnv('PORT'));
  const allowedOrigins = getRequiredEnv('ALLOWED_ORIGINS');

  // Middleware
  app.use(cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins === 'database') return callback(null, true);
      const origins = allowedOrigins.split(',').map((entry) => entry.trim()).filter(Boolean);
      return callback(null, origins.includes(origin));
    },
  }));
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Request correlation logger
  app.use((req: Request, res: Response, next: NextFunction) => {
    const reqId = `req_${Math.random().toString(36).substring(2, 8)}${Date.now()}`;
    (req as any).reqId = reqId;
    next();
  });

  // Helper to extract API Key from headers or body
  const extractApiKey = (req: Request) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
      return authHeader.substring(7).trim();
    }
    if (req.headers['x-api-key']) {
      return String(req.headers['x-api-key']).trim();
    }
    return req.body?.api_key || req.body?.apiKey || '';
  };

  // ==============================================================================
  // BACKGROUND MAINTENANCE SCHEDULER (Session decay & queue hygiene every 60s)
  // ==============================================================================
  setInterval(() => {
    try {
      const metrics = queueService.getMetrics();
      if (metrics.queueLength > 0) {
        Logger.info('Scheduler', 'Queue hygiene check', { queueLength: metrics.queueLength });
      }
    } catch (e) {
      Logger.error('Scheduler', 'Error running background maintenance', { error: e });
    }
  }, 60000);

  // ==============================================================================
  // COLLECTOR API & DIAGNOSTIC ENDPOINTS
  // ==============================================================================

  // Serve static client tracker library script
  app.get('/tracker.js', (req: Request, res: Response) => {
    const trackerPath = path.join(process.cwd(), 'public', 'tracker.js');
    const trackerSource = fs.readFileSync(trackerPath, 'utf8');
    const collectorUrl = getRequiredEnv('VITE_COLLECTOR_URL');
    res.setHeader('Content-Type', 'application/javascript');
    res.send(trackerSource.replace("const apiBaseUrl = '__PULSE_COLLECTOR_URL__';", `const apiBaseUrl = ${JSON.stringify(collectorUrl)};`));
  });

  // Comprehensive Health check endpoints
  app.get(['/health', '/api/health', '/api/v1/health'], (req: Request, res: Response) => {
    const mem = process.memoryUsage();
    const metrics = queueService.getMetrics();

    res.json({ 
      status: 'ok', 
      service: 'Pulse Analytics Collector API', 
      version: getRequiredEnv('PULSE_COLLECTOR_VERSION'),
      uptimeSeconds: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
      memory: {
        rssMb: Math.round(mem.rss / 1024 / 1024),
        heapUsedMb: Math.round(mem.heapUsed / 1024 / 1024)
      },
      queue: {
        buffered: metrics.queueLength,
        activeWorkers: metrics.activeWorkers,
        retryQueue: metrics.retryQueueLength,
        failedInserts: metrics.failedInserts
      },
      supabase: {
        status: metrics.supabaseStatus,
        avgInsertTimeMs: metrics.avgInsertTimeMs
      }
    });
  });

  app.get('/api/v1/version', (req: Request, res: Response) => {
    res.json({
      service: 'Pulse Analytics Collector Platform',
      version: getRequiredEnv('PULSE_COLLECTOR_VERSION'),
      apiVersion: 'v1',
      status: 'active',
      timestamp: new Date().toISOString()
    });
  });

  // Platform Monitor real-time system metrics
  app.get('/api/v1/monitor/stats', (req: Request, res: Response) => {
    res.json(queueService.getMetrics());
  });

  // Supabase Connection Phase 1 test endpoint
  app.get('/api/health/supabase', async (req: Request, res: Response) => {
    const envStatus = validateSupabaseEnv();
    const connTest = await testSupabaseConnection();

    res.status(connTest.success ? 200 : 500).json({
      environment: {
        isValid: envStatus.isValid,
        hasUrl: envStatus.hasUrl,
        hasServiceRoleKey: envStatus.hasServiceRoleKey,
        errors: envStatus.errors,
      },
      connectionTest: connTest,
      timestamp: new Date().toISOString(),
    });
  });

  // 1. POST /api/v1/collect/pageview (and /api/collect)
  const handlePageViewCollect = async (req: Request, res: Response) => {
    const reqId = (req as any).reqId;
    try {
      const apiKey = extractApiKey(req);
      const payload = { ...req.body, api_key: apiKey };
      const origin = req.headers.origin || req.headers.referer;

      if (!payload.url) {
        Logger.warn('CollectorAPI', 'Missing url parameter', { reqId });
        return res.status(400).json({ 
          error: 'Bad Request', 
          message: "Missing required parameter 'url' in payload." 
        });
      }

      const result = await CollectorService.processCollect(payload, Array.isArray(origin) ? origin[0] : origin);
      return res.status(200).json(result);
    } catch (err: any) {
      const statusCode = err.status || 500;
      Logger.error('CollectorAPI', 'Pageview processing error', { reqId, error: err });
      return res.status(statusCode).json({ 
        error: err.error || 'Collector Processing Error', 
        details: err.message || err 
      });
    }
  };

  app.post('/api/v1/collect/pageview', handlePageViewCollect);
  app.post('/api/collect', handlePageViewCollect);

  // 2. POST /api/v1/collect/event (and /api/event)
  const handleEventCollect = async (req: Request, res: Response) => {
    const reqId = (req as any).reqId;
    try {
      const apiKey = extractApiKey(req);
      const payload = { ...req.body, api_key: apiKey };
      const origin = req.headers.origin || req.headers.referer;

      const eventName = payload.event_name || payload.eventName;
      if (!eventName) {
        Logger.warn('CollectorAPI', 'Missing eventName parameter', { reqId });
        return res.status(400).json({ 
          error: 'Bad Request', 
          message: "Missing required parameter 'eventName' or 'event_name' in payload." 
        });
      }

      const result = await CollectorService.processEvent({ ...payload, event_name: eventName }, Array.isArray(origin) ? origin[0] : origin);
      return res.status(200).json(result);
    } catch (err: any) {
      const statusCode = err.status || 500;
      Logger.error('CollectorAPI', 'Event processing error', { reqId, error: err });
      return res.status(statusCode).json({ 
        error: err.error || 'Event Processing Error', 
        details: err.message || err 
      });
    }
  };

  app.post('/api/v1/collect/event', handleEventCollect);
  app.post('/api/event', handleEventCollect);

  // 3. POST /api/v1/collect/heartbeat (and /api/heartbeat)
  const handleHeartbeatCollect = async (req: Request, res: Response) => {
    const reqId = (req as any).reqId;
    try {
      const apiKey = extractApiKey(req);
      const payload = { ...req.body, api_key: apiKey };
      const origin = req.headers.origin || req.headers.referer;

      const result = await CollectorService.processHeartbeat(payload, Array.isArray(origin) ? origin[0] : origin);
      return res.status(200).json(result);
    } catch (err: any) {
      const statusCode = err.status || 500;
      Logger.error('CollectorAPI', 'Heartbeat error', { reqId, error: err });
      return res.status(statusCode).json({ 
        error: err.error || 'Heartbeat Error', 
        details: err.message || err 
      });
    }
  };

  app.post('/api/v1/collect/heartbeat', handleHeartbeatCollect);
  app.post('/api/heartbeat', handleHeartbeatCollect);

  // ==============================================================================
  // VITE & STATIC FILES MIDDLEWARE
  // ==============================================================================
  if (process.env.NODE_ENV !== 'production' && process.env.ENABLE_EMBEDDED_VITE === 'true') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get(/.*/, (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Global Error Handler
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    Logger.error('Express', 'Unhandled Server Error', { error: err.message || err });
    res.status(500).json({ error: 'Internal Server Error', message: 'An unexpected error occurred.' });
  });

  app.listen(PORT, '0.0.0.0', () => {
    Logger.info('Server', `Pulse Analytics Collector API server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  Logger.error('Server', 'Pulse Analytics failed to start', { error: err.message || err });
  process.exit(1);
});
