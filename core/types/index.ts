/**
 * Core types for LocalRun Agent
 */

export interface TunnelMetrics {
    provider: string;
    tunnel_id: string;
    tunnel_port: number;
    timestamp: number;
    metrics: {
        tunnel: TunnelInfo;
        requests: RequestMetrics;
        latency?: LatencyMetrics;
        bandwidth: BandwidthMetrics;
        container: ContainerMetrics;
    };
}

export interface TunnelInfo {
    public_url: string;
    protocol: string;
    status: 'running' | 'starting' | 'error' | 'stopped';
    uptime_seconds: number;
}

export interface RequestMetrics {
    total: number;
    rate_1m: number;
    rate_5m: number;
    rate_15m?: number;
    errors: number;
    status_codes?: Record<string, number>;
}

export interface LatencyMetrics {
    p50: number;
    p90: number;
    p95: number;
    p99: number;
    avg?: number;
    max?: number;
}

export interface BandwidthMetrics {
    bytes_in: number;
    bytes_out: number;
    rate_in_bps: number;
    rate_out_bps: number;
}

export interface ContainerMetrics {
    memory_usage_bytes: number;
    memory_limit_bytes: number;
    memory_percent: number;
    cpu_percent: number;
    network_rx_bytes: number;
    network_tx_bytes: number;
    block_read_bytes?: number;
    block_write_bytes?: number;
}

export interface AgentConfig {
    provider: string;
    tunnelId: string;
    tunnelPort: number;
    backendUrl: string;
    interval: number;
    logLevel: 'debug' | 'info' | 'warn' | 'error';
}

export interface MetricsCollector {
    collect(): Promise<Partial<TunnelMetrics['metrics']>>;
}

export interface MetricsReporter {
    send(metrics: TunnelMetrics): Promise<boolean>;
}
