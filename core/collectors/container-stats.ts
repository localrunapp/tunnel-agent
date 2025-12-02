/**
 * Colector de estadísticas del contenedor Docker
 * Obtiene métricas de uso de recursos (CPU, memoria, red, I/O)
 */

import Docker from 'dockerode';
import { Logger } from 'pino';
import { MetricsCollector, ContainerMetrics } from '../types';
import { execSync } from 'child_process';

export class ContainerStatsCollector implements MetricsCollector {
    private docker: Docker;
    private containerId?: string;

    constructor(private logger: Logger) {
        this.docker = new Docker();
        this.containerId = this.getContainerId();
    }

    /**
     * Obtiene el ID del contenedor actual
     */
    private getContainerId(): string | undefined {
        try {
            // Método 1: Leer desde /proc/self/cgroup (funciona en la mayoría de casos)
            const cgroup = execSync('cat /proc/self/cgroup', { encoding: 'utf-8' });
            const match = cgroup.match(/docker[/-]([a-f0-9]{64})/);
            if (match) {
                return match[1];
            }

            // Método 2: Leer desde hostname (si el hostname es el container ID)
            const hostname = execSync('hostname', { encoding: 'utf-8' }).trim();
            if (hostname.length === 12 || hostname.length === 64) {
                return hostname;
            }

            this.logger.warn('Could not determine container ID');
            return undefined;

        } catch (error) {
            this.logger.error({ error }, 'Error getting container ID');
            return undefined;
        }
    }

    async collect(): Promise<any> {
        if (!this.containerId) {
            this.logger.debug('No container ID available, skipping container stats');
            return this.getEmptyStats();
        }

        try {
            const container = this.docker.getContainer(this.containerId);
            const stats = await container.stats({ stream: false });

            const containerMetrics = this.parseStats(stats);

            return {
                container: containerMetrics
            };

        } catch (error) {
            this.logger.error({ error }, 'Failed to collect container stats');
            return this.getEmptyStats();
        }
    }

    private parseStats(stats: any): ContainerMetrics {
        // Memoria
        const memoryUsage = stats.memory_stats.usage || 0;
        const memoryLimit = stats.memory_stats.limit || 0;
        const memoryPercent = memoryLimit > 0
            ? (memoryUsage / memoryLimit) * 100
            : 0;

        // CPU
        const cpuDelta = stats.cpu_stats.cpu_usage.total_usage -
            (stats.precpu_stats.cpu_usage?.total_usage || 0);
        const systemDelta = stats.cpu_stats.system_cpu_usage -
            (stats.precpu_stats.system_cpu_usage || 0);
        const cpuCount = stats.cpu_stats.online_cpus || 1;
        const cpuPercent = systemDelta > 0
            ? (cpuDelta / systemDelta) * cpuCount * 100
            : 0;

        // Red
        const networks = stats.networks || {};
        let networkRxBytes = 0;
        let networkTxBytes = 0;

        for (const iface of Object.values(networks) as any[]) {
            networkRxBytes += iface.rx_bytes || 0;
            networkTxBytes += iface.tx_bytes || 0;
        }

        // I/O de bloques (disco)
        const blkioStats = stats.blkio_stats.io_service_bytes_recursive || [];
        let blockReadBytes = 0;
        let blockWriteBytes = 0;

        for (const stat of blkioStats) {
            if (stat.op === 'Read' || stat.op === 'read') {
                blockReadBytes += stat.value || 0;
            } else if (stat.op === 'Write' || stat.op === 'write') {
                blockWriteBytes += stat.value || 0;
            }
        }

        return {
            memory_usage_bytes: memoryUsage,
            memory_limit_bytes: memoryLimit,
            memory_percent: parseFloat(memoryPercent.toFixed(2)),
            cpu_percent: parseFloat(cpuPercent.toFixed(2)),
            network_rx_bytes: networkRxBytes,
            network_tx_bytes: networkTxBytes,
            block_read_bytes: blockReadBytes,
            block_write_bytes: blockWriteBytes
        };
    }

    private getEmptyStats(): any {
        return {
            container: {
                memory_usage_bytes: 0,
                memory_limit_bytes: 0,
                memory_percent: 0,
                cpu_percent: 0,
                network_rx_bytes: 0,
                network_tx_bytes: 0,
                block_read_bytes: 0,
                block_write_bytes: 0
            }
        };
    }
}
