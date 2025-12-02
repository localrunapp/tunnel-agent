/**
 * Colector de métricas para ngrok
 * Lee de la API local de ngrok (http://localhost:4040/api)
 */

import axios, { AxiosInstance } from 'axios';
import { Logger } from 'pino';
import { MetricsCollector } from '../types';

export class NgrokCollector implements MetricsCollector {
    private client: AxiosInstance;
    private apiUrl = 'http://localhost:4040/api';

    constructor(
        private tunnelPort: number,
        private logger: Logger
    ) {
        this.client = axios.create({
            baseURL: this.apiUrl,
            timeout: 3000
        });
    }

    async collect(): Promise<any> {
        try {
            const response = await this.client.get('/tunnels');
            const data = response.data;

            const tunnels = data.tunnels || [];
            if (tunnels.length === 0) {
                this.logger.warn('No tunnels found in ngrok API');
                return {};
            }

            // Tomar el primer túnel (normalmente solo hay uno)
            const tunnel = tunnels[0];
            const metrics = tunnel.metrics || {};

            return {
                tunnel: {
                    public_url: tunnel.public_url || '',
                    protocol: tunnel.proto || 'https',
                    status: 'running' as const,
                    uptime_seconds: 0 // ngrok no expone uptime directamente
                },
                requests: {
                    total: metrics.http?.count || 0,
                    rate_1m: metrics.http?.rate1 || 0,
                    rate_5m: metrics.http?.rate5 || 0,
                    rate_15m: metrics.http?.rate15 || 0,
                    errors: 0 // ngrok no expone errores directamente
                },
                latency: {
                    p50: metrics.http?.p50 || 0,
                    p90: metrics.http?.p90 || 0,
                    p95: metrics.http?.p95 || 0,
                    p99: metrics.http?.p99 || 0
                },
                bandwidth: {
                    bytes_in: 0, // No disponible en API local
                    bytes_out: 0,
                    rate_in_bps: 0,
                    rate_out_bps: 0
                }
            };

        } catch (error) {
            if (axios.isAxiosError(error)) {
                this.logger.error({
                    message: error.message,
                    code: error.code
                }, 'Failed to collect ngrok metrics');
            }
            throw error;
        }
    }
}
