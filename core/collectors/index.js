"use strict";
/**
 * Factory para crear colectores según el proveedor
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
exports.ContainerStatsCollector = exports.CloudflareCollector = exports.NgrokCollector = void 0;
exports.getCollector = getCollector;
var ngrok_collector_1 = require("./ngrok-collector");
var cloudflare_collector_1 = require("./cloudflare-collector");
function getCollector(provider, tunnelPort, logger) {
    var normalizedProvider = provider.toLowerCase();
    switch (normalizedProvider) {
        case 'ngrok':
            return new ngrok_collector_1.NgrokCollector(tunnelPort, logger);
        case 'cloudflare':
        case 'cloudflared':
            return new cloudflare_collector_1.CloudflareCollector(tunnelPort, logger);
        case 'localhost.run':
        case 'localhostrun':
            return new GenericCollector(tunnelPort, logger);
        default:
            logger.warn("Unknown provider: ".concat(provider, ", using generic collector"));
            return new GenericCollector(tunnelPort, logger);
    }
}
/**
 * Colector genérico para proveedores sin implementación específica
 */
var GenericCollector = /** @class */ (function () {
    function GenericCollector(tunnelPort, logger) {
        this.tunnelPort = tunnelPort;
        this.logger = logger;
    }
    GenericCollector.prototype.collect = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                this.logger.debug('Using generic collector (no provider-specific metrics)');
                return [2 /*return*/, {
                        tunnel: {
                            public_url: '',
                            protocol: 'unknown',
                            status: 'running',
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
                    }];
            });
        });
    };
    return GenericCollector;
}());
var ngrok_collector_2 = require("./ngrok-collector");
Object.defineProperty(exports, "NgrokCollector", { enumerable: true, get: function () { return ngrok_collector_2.NgrokCollector; } });
var cloudflare_collector_2 = require("./cloudflare-collector");
Object.defineProperty(exports, "CloudflareCollector", { enumerable: true, get: function () { return cloudflare_collector_2.CloudflareCollector; } });
var container_stats_1 = require("./container-stats");
Object.defineProperty(exports, "ContainerStatsCollector", { enumerable: true, get: function () { return container_stats_1.ContainerStatsCollector; } });
