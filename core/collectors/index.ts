/**
 * Factory para crear colectores según el proveedor
 */

import { Logger } from 'pino'
import { MetricsCollector } from '../types'
import { NgrokCollector } from './ngrok-collector'
import { CloudflareCollector } from './cloudflare-collector'

export function getCollector(
    provider: string,
    tunnelPort: number,
    logger: Logger
): MetricsCollector {
    const normalizedProvider = provider.toLowerCase()

    switch (normalizedProvider) {
        case 'ngrok':
            return new NgrokCollector(tunnelPort, logger)

        case 'cloudflare':
        case 'cloudflared':
            return new CloudflareCollector(tunnelPort, logger)

        case 'localhost.run':
        case 'localhostrun':
            return new GenericCollector(tunnelPort, logger)

        default:
            logger.warn(`Unknown provider: ${provider}, using generic collector`)
            return new GenericCollector(tunnelPort, logger)
    }
}

/**
 * Colector genérico para proveedores sin implementación específica
 */
class GenericCollector implements MetricsCollector {
    constructor(
        private tunnelPort: number,
        private logger: Logger
    ) { }

    async collect(): Promise<any> {
        this.logger.debug('Using generic collector (no provider-specific metrics)')
        return {
            tunnel: {
                public_url: '',
                protocol: 'unknown',
                status: 'running' as const,
                uptime_seconds: 0,
            },
            requests: {
                total: 0,
                rate_1m: 0,
                rate_5m: 0,
                errors: 0,
            },
            bandwidth: {
                bytes_in: 0,
                bytes_out: 0,
                rate_in_bps: 0,
                rate_out_bps: 0,
            },
        }
    }
}

export { NgrokCollector } from './ngrok-collector'
export { CloudflareCollector } from './cloudflare-collector'
export { ContainerStatsCollector } from './container-stats'
