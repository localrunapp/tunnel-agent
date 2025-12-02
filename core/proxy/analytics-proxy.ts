/**
 * Analytics Proxy - Universal HTTP proxy with analytics collection
 * Works with ANY tunnel provider (Cloudflare, ngrok, Serveo, etc.)
 */

import express, { Request, Response, NextFunction } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import fetch from 'node-fetch';

interface AnalyticsEvent {
  tunnel_id: string;
  ip: string;
  user_agent: string;
  method: string;
  path: string;
  status_code: number;
  response_time_ms: number;
  request_size_bytes: number;
  response_size_bytes: number;
  referer?: string;
  accept_language?: string;
  timestamp: string;
}

class AnalyticsQueue {
  private queue: AnalyticsEvent[] = [];
  private readonly maxBatchSize: number = 100;
  private readonly flushInterval: number = 5000; // 5 seconds
  private readonly backendUrl: string;
  private flushTimer: NodeJS.Timeout;
  private isFlushing: boolean = false;

  constructor(backendUrl: string) {
    this.backendUrl = backendUrl;
    this.flushTimer = setInterval(() => this.flush(), this.flushInterval);

    console.log(`📊 Analytics queue initialized (batch: ${this.maxBatchSize}, interval: ${this.flushInterval}ms)`);
  }

  add(event: AnalyticsEvent): void {
    this.queue.push(event);

    // Auto-flush if queue is full
    if (this.queue.length >= this.maxBatchSize) {
      this.flush();
    }
  }

  private async flush(): Promise<void> {
    if (this.queue.length === 0 || this.isFlushing) return;

    this.isFlushing = true;
    const batch = this.queue.splice(0, this.maxBatchSize);

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);

      const response = await fetch(`${this.backendUrl}/analytics/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events: batch }),
        signal: controller.signal
      });

      clearTimeout(timeout);

      if (response.ok) {
        console.log(`✅ Sent ${batch.length} analytics events`);
      } else {
        console.error(`❌ Analytics batch failed: ${response.status}`);
      }
    } catch (error: any) {
      console.error(`❌ Failed to send analytics batch: ${error.message}`);
      // Don't re-queue, just drop to avoid memory issues
    } finally {
      this.isFlushing = false;
    }
  }

  shutdown(): void {
    clearInterval(this.flushTimer);
    this.flush(); // Final flush
  }

  getQueueSize(): number {
    return this.queue.length;
  }
}

export class AnalyticsProxy {
  private queue: AnalyticsQueue;
  private app: express.Application;

  constructor(
    private targetPort: number,
    private proxyPort: number,
    private backendUrl: string,
    private tunnelId: string
  ) {
    this.queue = new AnalyticsQueue(backendUrl);
    this.app = express();
  }

  start(): void {
    // Analytics middleware (non-blocking)
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      const startTime = Date.now();
      let requestSize = 0;
      let responseSize = 0;

      // Capture request size
      req.on('data', (chunk: Buffer) => {
        requestSize += chunk.length;
      });

      // Intercept response to measure size
      const originalWrite = res.write;
      const originalEnd = res.end;

      res.write = function (chunk: any, ...args: any[]): boolean {
        if (chunk) {
          responseSize += Buffer.isBuffer(chunk) ? chunk.length : Buffer.byteLength(chunk);
        }
        return originalWrite.apply(res, [chunk, ...args]);
      };

      const self = this;
      res.end = function (chunk: any, ...args: any[]): any {
        if (chunk) {
          responseSize += Buffer.isBuffer(chunk) ? chunk.length : Buffer.byteLength(chunk);
        }

        // Add to queue (< 0.1ms, non-blocking)
        setImmediate(() => {
          try {
            const event: AnalyticsEvent = {
              tunnel_id: self.tunnelId,
              ip: (req.headers['x-forwarded-for'] as string) ||
                (req.headers['cf-connecting-ip'] as string) ||
                req.ip ||
                'unknown',
              user_agent: req.headers['user-agent'] || 'Unknown',
              method: req.method,
              path: req.path,
              status_code: res.statusCode,
              response_time_ms: Date.now() - startTime,
              request_size_bytes: requestSize,
              response_size_bytes: responseSize,
              referer: req.headers['referer'] as string,
              accept_language: req.headers['accept-language'] as string,
              timestamp: new Date().toISOString()
            };

            self.queue.add(event);
          } catch (error) {
            // Silently ignore analytics errors
          }
        });

        return originalEnd.apply(res, [chunk, ...args]);
      };

      next();
    });

    // Proxy to real service
    this.app.use('/', createProxyMiddleware({
      target: `http://host.docker.internal:${this.targetPort}`,
      changeOrigin: true,
      ws: true, // WebSocket support
      onError: (err, req, res) => {
        console.error('❌ Proxy error:', err.message);
        if (!res.headersSent) {
          (res as Response).status(502).send('Bad Gateway');
        }
      },
      onProxyReq: (proxyReq, req) => {
        // Preserve original headers
        proxyReq.setHeader('X-Forwarded-For', req.ip || 'unknown');
        proxyReq.setHeader('X-Forwarded-Proto', req.protocol);
        proxyReq.setHeader('X-Forwarded-Host', req.hostname);
      }
    }));

    // Health check endpoint
    this.app.get('/__analytics_health', (req, res) => {
      res.json({
        status: 'ok',
        queue_size: this.queue.getQueueSize(),
        tunnel_id: this.tunnelId,
        target_port: this.targetPort
      });
    });

    // Start server
    this.app.listen(this.proxyPort, () => {
      console.log('🚀 Analytics Proxy started');
      console.log(`   Listening on: http://localhost:${this.proxyPort}`);
      console.log(`   Proxying to: http://host.docker.internal:${this.targetPort}`);
      console.log(`   Backend: ${this.backendUrl}`);
      console.log(`   Tunnel ID: ${this.tunnelId}`);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => this.shutdown());
    process.on('SIGINT', () => this.shutdown());
  }

  private shutdown(): void {
    console.log('🛑 Shutting down analytics proxy...');
    this.queue.shutdown();
    process.exit(0);
  }
}

// CLI entry point
if (require.main === module) {
  const targetPort = parseInt(process.env.TARGET_PORT || '3000');
  const proxyPort = parseInt(process.env.PROXY_PORT || '8001');
  const backendUrl = process.env.BACKEND_URL || 'http://backend:8000';
  const tunnelId = process.env.TUNNEL_ID || `tunnel-${targetPort}`;

  const proxy = new AnalyticsProxy(targetPort, proxyPort, backendUrl, tunnelId);
  proxy.start();
}
