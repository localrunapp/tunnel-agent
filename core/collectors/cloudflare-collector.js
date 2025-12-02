"use strict";
/**
 * Colector de métricas para Cloudflare Tunnel
 * Lee del endpoint Prometheus de cloudflared (http://localhost:39997/metrics)
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
exports.CloudflareCollector = void 0;
var axios_1 = require("axios");
var CloudflareCollector = /** @class */ (function () {
    function CloudflareCollector(tunnelPort, logger) {
        this.tunnelPort = tunnelPort;
        this.logger = logger;
        this.metricsUrl = 'http://localhost:39997/metrics';
        this.client = axios_1.default.create({
            timeout: 3000
        });
    }
    CloudflareCollector.prototype.collect = function () {
        return __awaiter(this, void 0, void 0, function () {
            var response, prometheusData, metrics, responseCodes, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.client.get(this.metricsUrl)];
                    case 1:
                        response = _a.sent();
                        prometheusData = response.data;
                        metrics = this.parsePrometheus(prometheusData);
                        responseCodes = this.extractResponseCodes(prometheusData);
                        return [2 /*return*/, {
                                tunnel: {
                                    public_url: '', // Cloudflare no expone esto en métricas
                                    protocol: 'https',
                                    status: 'running',
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
                            }];
                    case 2:
                        error_1 = _a.sent();
                        if (axios_1.default.isAxiosError(error_1)) {
                            this.logger.error({
                                message: error_1.message,
                                code: error_1.code
                            }, 'Failed to collect cloudflare metrics');
                        }
                        throw error_1;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    CloudflareCollector.prototype.parsePrometheus = function (data) {
        var metrics = {};
        for (var _i = 0, _a = data.split('\n'); _i < _a.length; _i++) {
            var line = _a[_i];
            var trimmed = line.trim();
            // Ignorar comentarios y líneas vacías
            if (!trimmed || trimmed.startsWith('#')) {
                continue;
            }
            // Formato: metric_name{labels} value
            // o: metric_name value
            var parts = trimmed.split(/\s+/);
            if (parts.length >= 2) {
                var metricName = parts[0].split('{')[0];
                var value = parseFloat(parts[parts.length - 1]);
                if (!isNaN(value)) {
                    metrics[metricName] = value;
                }
            }
        }
        return metrics;
    };
    CloudflareCollector.prototype.extractResponseCodes = function (data) {
        var codes = {};
        var pattern = /cloudflared_tunnel_response_by_code\{code="(\d+)"\}\s+(\d+)/g;
        var match;
        while ((match = pattern.exec(data)) !== null) {
            var code = match[1];
            var count = parseInt(match[2], 10);
            codes[code] = count;
        }
        return codes;
    };
    return CloudflareCollector;
}());
exports.CloudflareCollector = CloudflareCollector;
