/**
 * HTTP Reporter - Envía métricas al backend vía HTTP
 */

import axios, { AxiosInstance } from 'axios';
import { Logger } from 'pino';
import { MetricsReporter, TunnelMetrics } from '../types';

export class HttpReporter implements MetricsReporter {
    private client: AxiosInstance;

    constructor(
        private backendUrl: string,
        private logger: Logger
    ) {
        this.client = axios.create({
            baseURL: backendUrl,
            timeout: 5000,
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'LocalRun-Metrics-Collector/1.0'
            }
        });
    }

    async send(metrics: TunnelMetrics): Promise<boolean> {
        try {
            const response = await this.client.post('/api/metrics/ingest', metrics);

            if (response.status === 200 || response.status === 201) {
                this.logger.debug({ status: response.status }, 'Metrics sent successfully');
                return true;
            }

            this.logger.warn({ status: response.status }, 'Unexpected response status');
            return false;

        } catch (error) {
            if (axios.isAxiosError(error)) {
                this.logger.error({
                    message: error.message,
                    code: error.code,
                    status: error.response?.status
                }, 'HTTP error sending metrics');
            } else {
                this.logger.error({ error }, 'Unknown error sending metrics');
            }
            return false;
        }
    }
}
