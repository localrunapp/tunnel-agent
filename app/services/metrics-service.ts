/**
 * Servicio principal de métricas
 */

import { Logger } from 'pino'
import { AgentConfig, TunnelMetrics, MetricsCollector, MetricsReporter } from '../../core/types'

export class MetricsService {
    private running = false
    private intervalId?: NodeJS.Timeout
    private startTime: number
    private consecutiveFailures = 0
    private readonly maxFailures = 5

    constructor(
        private config: AgentConfig,
        private providerCollector: MetricsCollector,
        private containerCollector: MetricsCollector,
        private reporter: MetricsReporter,
        private logger: Logger
    ) {
        this.startTime = Date.now()
    }

    async start(): Promise<void> {
        this.running = true
        this.logger.info('✅ Metrics service started')

        // Primera recolección inmediata
        await this.collect()

        // Programar recolecciones periódicas
        this.intervalId = setInterval(
            () => this.collect(),
            this.config.interval * 1000
        )
    }

    async stop(): Promise<void> {
        this.running = false

        if (this.intervalId) {
            clearInterval(this.intervalId)
            this.intervalId = undefined
        }

        this.logger.info('🛑 Metrics service stopped')
    }

    private async collect(): Promise<void> {
        if (!this.running) return

        try {
            this.logger.debug('📊 Collecting metrics...')

            // Recolectar métricas en paralelo
            const [providerMetrics, containerMetrics] = await Promise.all([
                this.providerCollector.collect().catch((err: Error) => {
                    this.logger.warn({ err }, 'Failed to collect provider metrics')
                    return {}
                }),
                this.containerCollector.collect().catch((err: Error) => {
                    this.logger.warn({ err }, 'Failed to collect container metrics')
                    return {}
                }),
            ])

            // Construir payload
            const metrics: TunnelMetrics = {
                provider: this.config.provider,
                tunnel_id: this.config.tunnelId,
                tunnel_port: this.config.tunnelPort,
                timestamp: Date.now() / 1000,
                metrics: {
                    tunnel: (providerMetrics as any).tunnel || {
                        public_url: '',
                        protocol: 'unknown',
                        status: 'running' as const,
                        uptime_seconds: Math.floor((Date.now() - this.startTime) / 1000),
                    },
                    requests: (providerMetrics as any).requests || {
                        total: 0,
                        rate_1m: 0,
                        rate_5m: 0,
                        errors: 0,
                    },
                    latency: (providerMetrics as any).latency,
                    bandwidth: (providerMetrics as any).bandwidth || {
                        bytes_in: 0,
                        bytes_out: 0,
                        rate_in_bps: 0,
                        rate_out_bps: 0,
                    },
                    container: (containerMetrics as any).container || {
                        memory_usage_bytes: 0,
                        memory_limit_bytes: 0,
                        memory_percent: 0,
                        cpu_percent: 0,
                        network_rx_bytes: 0,
                        network_tx_bytes: 0,
                    },
                },
            }

            // Enviar al backend
            const success = await this.reporter.send(metrics)

            if (success) {
                this.consecutiveFailures = 0
                this.logger.debug('✅ Metrics sent successfully')
            } else {
                this.consecutiveFailures++
                this.logger.warn(
                    `⚠️  Failed to send metrics (${this.consecutiveFailures}/${this.maxFailures})`
                )

                if (this.consecutiveFailures >= this.maxFailures) {
                    this.logger.error('🔴 Too many failures, backing off...')
                    await this.sleep(this.config.interval * 3000)
                    this.consecutiveFailures = 0
                }
            }
        } catch (error) {
            this.logger.error({ error }, '❌ Error in metrics collection')
        }
    }

    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms))
    }
}
