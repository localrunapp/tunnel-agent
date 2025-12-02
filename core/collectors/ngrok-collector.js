"use strict";
/**
 * Colector de métricas para ngrok
 * Lee de la API local de ngrok (http://localhost:4040/api)
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
exports.NgrokCollector = void 0;
var axios_1 = require("axios");
var NgrokCollector = /** @class */ (function () {
    function NgrokCollector(tunnelPort, logger) {
        this.tunnelPort = tunnelPort;
        this.logger = logger;
        this.apiUrl = 'http://localhost:4040/api';
        this.client = axios_1.default.create({
            baseURL: this.apiUrl,
            timeout: 3000
        });
    }
    NgrokCollector.prototype.collect = function () {
        return __awaiter(this, void 0, void 0, function () {
            var response, data, tunnels, tunnel, metrics, error_1;
            var _a, _b, _c, _d, _e, _f, _g, _h;
            return __generator(this, function (_j) {
                switch (_j.label) {
                    case 0:
                        _j.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.client.get('/tunnels')];
                    case 1:
                        response = _j.sent();
                        data = response.data;
                        tunnels = data.tunnels || [];
                        if (tunnels.length === 0) {
                            this.logger.warn('No tunnels found in ngrok API');
                            return [2 /*return*/, {}];
                        }
                        tunnel = tunnels[0];
                        metrics = tunnel.metrics || {};
                        return [2 /*return*/, {
                                tunnel: {
                                    public_url: tunnel.public_url || '',
                                    protocol: tunnel.proto || 'https',
                                    status: 'running',
                                    uptime_seconds: 0 // ngrok no expone uptime directamente
                                },
                                requests: {
                                    total: ((_a = metrics.http) === null || _a === void 0 ? void 0 : _a.count) || 0,
                                    rate_1m: ((_b = metrics.http) === null || _b === void 0 ? void 0 : _b.rate1) || 0,
                                    rate_5m: ((_c = metrics.http) === null || _c === void 0 ? void 0 : _c.rate5) || 0,
                                    rate_15m: ((_d = metrics.http) === null || _d === void 0 ? void 0 : _d.rate15) || 0,
                                    errors: 0 // ngrok no expone errores directamente
                                },
                                latency: {
                                    p50: ((_e = metrics.http) === null || _e === void 0 ? void 0 : _e.p50) || 0,
                                    p90: ((_f = metrics.http) === null || _f === void 0 ? void 0 : _f.p90) || 0,
                                    p95: ((_g = metrics.http) === null || _g === void 0 ? void 0 : _g.p95) || 0,
                                    p99: ((_h = metrics.http) === null || _h === void 0 ? void 0 : _h.p99) || 0
                                },
                                bandwidth: {
                                    bytes_in: 0, // No disponible en API local
                                    bytes_out: 0,
                                    rate_in_bps: 0,
                                    rate_out_bps: 0
                                }
                            }];
                    case 2:
                        error_1 = _j.sent();
                        if (axios_1.default.isAxiosError(error_1)) {
                            this.logger.error({
                                message: error_1.message,
                                code: error_1.code
                            }, 'Failed to collect ngrok metrics');
                        }
                        throw error_1;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    return NgrokCollector;
}());
exports.NgrokCollector = NgrokCollector;
