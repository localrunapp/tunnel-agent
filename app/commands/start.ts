/**
 * Start Command - Inicia el agente de métricas
 */

import { Command, Flags, Args } from '@oclif/core'
import pino from 'pino'
import { AgentConfig } from '../../core/types'
import { MetricsService } from '../services/metrics-service'
import { getCollector } from '../../core/collectors'
import { ContainerStatsCollector } from '../../core/collectors/container-stats'
import { HttpReporter } from '../../core/reporters/http-reporter'

export default class Start extends Command {
    static description = 'Start metrics collection for a tunnel provider'

    static examples = [
        '<%= config.bin %> <%= command.id %> ngrok --port 8000 --tunnel-id ngrok-8000',
        '<%= config.bin %> <%= command.id %> cloudflare --port 3000 --backend-url http://localhost:8000',
        '<%= config.bin %> <%= command.id %> localhost.run --port 5000 --interval 30',
    ]

    static flags = {
        'tunnel-id': Flags.string({
            char: 'i',
            description: 'Unique tunnel ID',
            env: 'TUNNEL_ID',
        }),
        port: Flags.integer({
            char: 'p',
            description: 'Local port being tunneled',
            env: 'TUNNEL_PORT',
            required: true,
        }),
        'backend-url': Flags.string({
            char: 'b',
            description: 'Backend URL to send metrics',
            env: 'BACKEND_URL',
            default: 'http://backend:8000',
        }),
        interval: Flags.integer({
            char: 'n',
            description: 'Collection interval in seconds',
            env: 'METRICS_INTERVAL',
            default: 10,
        }),
        'log-level': Flags.string({
            char: 'l',
            description: 'Log level',
            options: ['debug', 'info', 'warn', 'error'],
            env: 'LOG_LEVEL',
            default: 'info',
        }),
    }

    static args = {
        provider: Args.string({
            name: 'provider',
            required: true,
            description: 'Tunnel provider (ngrok, cloudflare, localhost.run)',
            options: ['ngrok', 'cloudflare', 'localhost.run'],
        }),
    }

    async run(): Promise<void> {
        const { args, flags } = await this.parse(Start)

        // Configurar logger
        const logger = pino({
            level: flags['log-level'],
            transport: {
                target: 'pino-pretty',
                options: {
                    colorize: true,
                    translateTime: 'SYS:standard',
                    ignore: 'pid,hostname',
                },
            },
        })

        // Generar tunnel ID si no se proporciona
        const tunnelId = flags['tunnel-id'] || `${args.provider}-${flags.port}`

        const config: AgentConfig = {
            provider: args.provider,
            tunnelId,
            tunnelPort: flags.port,
            backendUrl: flags['backend-url'],
            interval: flags.interval,
            logLevel: flags['log-level'] as any,
        }

        logger.info('🚀 Starting LocalRun Agent')
        logger.info(`📊 Provider: ${config.provider}`)
        logger.info(`🆔 Tunnel ID: ${config.tunnelId}`)
        logger.info(`🔌 Tunnel Port: ${config.tunnelPort}`)
        logger.info(`🔗 Backend: ${config.backendUrl}`)
        logger.info(`⏱️  Interval: ${config.interval}s`)

        try {
            // Crear colectores
            const providerCollector = getCollector(config.provider, config.tunnelPort, logger)
            const containerCollector = new ContainerStatsCollector(logger)

            // Crear reporter
            const reporter = new HttpReporter(config.backendUrl, logger)

            // Crear servicio
            const service = new MetricsService(
                config,
                providerCollector,
                containerCollector,
                reporter,
                logger
            )

            // Manejar señales de terminación
            process.on('SIGTERM', async () => {
                logger.info('📴 Received SIGTERM, shutting down...')
                await service.stop()
                process.exit(0)
            })

            process.on('SIGINT', async () => {
                logger.info('📴 Received SIGINT, shutting down...')
                await service.stop()
                process.exit(0)
            })

            // Iniciar servicio
            await service.start()

        } catch (error) {
            logger.error({ error }, '❌ Fatal error')
            this.error(error as Error)
        }
    }
}
