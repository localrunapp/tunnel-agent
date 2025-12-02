/**
 * Colector de métricas para Cloudflare Tunnel
 * Lee del endpoint Prometheus de cloudflared (http://localhost:39997/metrics)
 */

import axios, { AxiosInstance } from 'axios';
import { Logger } from 'pino';
import { MetricsCollector } from '../types';

export class CloudflareCollector implements MetricsCollector {
    private client: AxiosInstance;
    private metricsUrl = 'http://localhost:39997/metrics';

    constructor(
        private tunnelPort: number,
        private logger: Logger
    ) {
        this.client = axios.create({
            timeout: 3000
        });
    }

    async collect(): Promise<any> {
        try {
            const response = await this.client.get(this.metricsUrl);
            const prometheusData = response.data;

            const metrics = this.parsePrometheus(prometheusData);
            const responseCodes = this.extractResponseCodes(prometheusData);

            return {
                tunnel: {
                    public_url: '', // Cloudflare no expone esto en métricas
                    protocol: 'https',
                    status: 'running' as const,
                    uptime_seconds: 0
                },
                requests: {
                    total: metrics.cloudflared_tunnel_total_requests || 0,
                    rate_1m: 0, // No disponible directamente
                    rate_5m: 0,
                    errors: metrics.cloudflared_tunnel_request_errors || 0,
                    status_codes: responseCodes
                },
                bandwidth: {
                    bytes_in: 0, // No disponible en métricas básicas
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
                }, 'Failed to collect cloudflare metrics');
            }
            throw error;
        }
    }

    private parsePrometheus(data: string): Record<string, number> {
        const metrics: Record<string, number> = {};

        for (const line of data.split('\n')) {
            const trimmed = line.trim();

            // Ignorar comentarios y líneas vacías
            if (!trimmed || trimmed.startsWith('#')) {
                continue;
            }

            // Formato: metric_name{labels} value
            // o: metric_name value
            const parts = trimmed.split(/\s+/);
            if (parts.length >= 2) {
                const metricName = parts[0].split('{')[0];
                const value = parseFloat(parts[parts.length - 1]);

                if (!isNaN(value)) {
                    metrics[metricName] = value;
                }
            }
        }

        return metrics;
    }

    private extractResponseCodes(data: string): Record<string, number> {
        const codes: Record<string, number> = {};
        const pattern = /cloudflared_tunnel_response_by_code\{code="(\d+)"\}\s+(\d+)/g;

        let match;
        while ((match = pattern.exec(data)) !== null) {
            const code = match[1];
            const count = parseInt(match[2], 10);
            codes[code] = count;
        }

        return codes;
    }
}
