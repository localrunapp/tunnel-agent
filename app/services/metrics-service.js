"use strict";
/**
 * Servicio principal de métricas
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
exports.MetricsService = void 0;
var MetricsService = /** @class */ (function () {
    function MetricsService(config, providerCollector, containerCollector, reporter, logger) {
        this.config = config;
        this.providerCollector = providerCollector;
        this.containerCollector = containerCollector;
        this.reporter = reporter;
        this.logger = logger;
        this.running = false;
        this.consecutiveFailures = 0;
        this.maxFailures = 5;
        this.startTime = Date.now();
    }
    MetricsService.prototype.start = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.running = true;
                        this.logger.info('✅ Metrics service started');
                        // Primera recolección inmediata
                        return [4 /*yield*/, this.collect()
                            // Programar recolecciones periódicas
                        ];
                    case 1:
                        // Primera recolección inmediata
                        _a.sent();
                        // Programar recolecciones periódicas
                        this.intervalId = setInterval(function () { return _this.collect(); }, this.config.interval * 1000);
                        return [2 /*return*/];
                }
            });
        });
    };
    MetricsService.prototype.stop = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                this.running = false;
                if (this.intervalId) {
                    clearInterval(this.intervalId);
                    this.intervalId = undefined;
                }
                this.logger.info('🛑 Metrics service stopped');
                return [2 /*return*/];
            });
        });
    };
    MetricsService.prototype.collect = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _a, providerMetrics, containerMetrics, metrics, success, error_1;
            var _this = this;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!this.running)
                            return [2 /*return*/];
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 7, , 8]);
                        this.logger.debug('📊 Collecting metrics...');
                        return [4 /*yield*/, Promise.all([
                                this.providerCollector.collect().catch(function (err) {
                                    _this.logger.warn({ err: err }, 'Failed to collect provider metrics');
                                    return {};
                                }),
                                this.containerCollector.collect().catch(function (err) {
                                    _this.logger.warn({ err: err }, 'Failed to collect container metrics');
                                    return {};
                                }),
                            ])
                            // Construir payload
                        ];
                    case 2:
                        _a = _b.sent(), providerMetrics = _a[0], containerMetrics = _a[1];
                        metrics = {
                            provider: this.config.provider,
                            tunnel_id: this.config.tunnelId,
                            tunnel_port: this.config.tunnelPort,
                            timestamp: Date.now() / 1000,
                            metrics: {
                                tunnel: providerMetrics.tunnel || {
                                    public_url: '',
                                    protocol: 'unknown',
                                    status: 'running',
                                    uptime_seconds: Math.floor((Date.now() - this.startTime) / 1000),
                                },
                                requests: providerMetrics.requests || {
                                    total: 0,
                                    rate_1m: 0,
                                    rate_5m: 0,
                                    errors: 0,
                                },
                                latency: providerMetrics.latency,
                                bandwidth: providerMetrics.bandwidth || {
                                    bytes_in: 0,
                                    bytes_out: 0,
                                    rate_in_bps: 0,
                                    rate_out_bps: 0,
                                },
                                container: containerMetrics.container || {
                                    memory_usage_bytes: 0,
                                    memory_limit_bytes: 0,
                                    memory_percent: 0,
                                    cpu_percent: 0,
                                    network_rx_bytes: 0,
                                    network_tx_bytes: 0,
                                },
                            },
                        };
                        return [4 /*yield*/, this.reporter.send(metrics)];
                    case 3:
                        success = _b.sent();
                        if (!success) return [3 /*break*/, 4];
                        this.consecutiveFailures = 0;
                        this.logger.debug('✅ Metrics sent successfully');
                        return [3 /*break*/, 6];
                    case 4:
                        this.consecutiveFailures++;
                        this.logger.warn("\u26A0\uFE0F  Failed to send metrics (".concat(this.consecutiveFailures, "/").concat(this.maxFailures, ")"));
                        if (!(this.consecutiveFailures >= this.maxFailures)) return [3 /*break*/, 6];
                        this.logger.error('🔴 Too many failures, backing off...');
                        return [4 /*yield*/, this.sleep(this.config.interval * 3000)];
                    case 5:
                        _b.sent();
                        this.consecutiveFailures = 0;
                        _b.label = 6;
                    case 6: return [3 /*break*/, 8];
                    case 7:
                        error_1 = _b.sent();
                        this.logger.error({ error: error_1 }, '❌ Error in metrics collection');
                        return [3 /*break*/, 8];
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    MetricsService.prototype.sleep = function (ms) {
        return new Promise(function (resolve) { return setTimeout(resolve, ms); });
    };
    return MetricsService;
}());
exports.MetricsService = MetricsService;
