"use strict";
/**
 * Colector de estadísticas del contenedor Docker
 * Obtiene métricas de uso de recursos (CPU, memoria, red, I/O)
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContainerStatsCollector = void 0;
var dockerode_1 = require("dockerode");
var child_process_1 = require("child_process");
var ContainerStatsCollector = /** @class */ (function () {
    function ContainerStatsCollector(logger) {
        this.logger = logger;
        this.docker = new dockerode_1.default();
        this.containerId = this.getContainerId();
    }
    /**
     * Obtiene el ID del contenedor actual
     */
    ContainerStatsCollector.prototype.getContainerId = function () {
        try {
            // Método 1: Leer desde /proc/self/cgroup (funciona en la mayoría de casos)
            var cgroup = (0, child_process_1.execSync)('cat /proc/self/cgroup', { encoding: 'utf-8' });
            var match = cgroup.match(/docker[/-]([a-f0-9]{64})/);
            if (match) {
                return match[1];
            }
            // Método 2: Leer desde hostname (si el hostname es el container ID)
            var hostname = (0, child_process_1.execSync)('hostname', { encoding: 'utf-8' }).trim();
            if (hostname.length === 12 || hostname.length === 64) {
                return hostname;
            }
            this.logger.warn('Could not determine container ID');
            return undefined;
        }
        catch (error) {
            this.logger.error({ error: error }, 'Error getting container ID');
            return undefined;
        }
    };
    ContainerStatsCollector.prototype.collect = function () {
        return __awaiter(this, void 0, void 0, function () {
            var container, stats, containerMetrics, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.containerId) {
                            this.logger.debug('No container ID available, skipping container stats');
                            return [2 /*return*/, this.getEmptyStats()];
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        container = this.docker.getContainer(this.containerId);
                        return [4 /*yield*/, container.stats({ stream: false })];
                    case 2:
                        stats = _a.sent();
                        containerMetrics = this.parseStats(stats);
                        return [2 /*return*/, {
                                container: containerMetrics
                            }];
                    case 3:
                        error_1 = _a.sent();
                        this.logger.error({ error: error_1 }, 'Failed to collect container stats');
                        return [2 /*return*/, this.getEmptyStats()];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    ContainerStatsCollector.prototype.parseStats = function (stats) {
        var _a;
        // Memoria
        var memoryUsage = stats.memory_stats.usage || 0;
        var memoryLimit = stats.memory_stats.limit || 0;
        var memoryPercent = memoryLimit > 0
            ? (memoryUsage / memoryLimit) * 100
            : 0;
        // CPU
        var cpuDelta = stats.cpu_stats.cpu_usage.total_usage -
            (((_a = stats.precpu_stats.cpu_usage) === null || _a === void 0 ? void 0 : _a.total_usage) || 0);
        var systemDelta = stats.cpu_stats.system_cpu_usage -
            (stats.precpu_stats.system_cpu_usage || 0);
        var cpuCount = stats.cpu_stats.online_cpus || 1;
        var cpuPercent = systemDelta > 0
            ? (cpuDelta / systemDelta) * cpuCount * 100
            : 0;
        // Red
        var networks = stats.networks || {};
        var networkRxBytes = 0;
        var networkTxBytes = 0;
        for (var _i = 0, _b = Object.values(networks); _i < _b.length; _i++) {
            var iface = _b[_i];
            networkRxBytes += iface.rx_bytes || 0;
            networkTxBytes += iface.tx_bytes || 0;
        }
        // I/O de bloques (disco)
        var blkioStats = stats.blkio_stats.io_service_bytes_recursive || [];
        var blockReadBytes = 0;
        var blockWriteBytes = 0;
        for (var _c = 0, blkioStats_1 = blkioStats; _c < blkioStats_1.length; _c++) {
            var stat = blkioStats_1[_c];
            if (stat.op === 'Read' || stat.op === 'read') {
                blockReadBytes += stat.value || 0;
            }
            else if (stat.op === 'Write' || stat.op === 'write') {
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
    };
    ContainerStatsCollector.prototype.getEmptyStats = function () {
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
    };
    return ContainerStatsCollector;
}());
exports.ContainerStatsCollector = ContainerStatsCollector;
