"use strict";
/**
 * Start Command - Inicia el agente de métricas
 */
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
var core_1 = require("@oclif/core");
var pino_1 = require("pino");
var metrics_service_1 = require("../services/metrics-service");
var collectors_1 = require("../../core/collectors");
var container_stats_1 = require("../../core/collectors/container-stats");
var http_reporter_1 = require("../../core/reporters/http-reporter");
var Start = /** @class */ (function (_super) {
    __extends(Start, _super);
    function Start() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    Start.prototype.run = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _a, args, flags, logger, tunnelId, config, providerCollector, containerCollector, reporter, service_1, error_1;
            var _this = this;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.parse(Start)
                        // Configurar logger
                    ];
                    case 1:
                        _a = _b.sent(), args = _a.args, flags = _a.flags;
                        logger = (0, pino_1.default)({
                            level: flags['log-level'],
                            transport: {
                                target: 'pino-pretty',
                                options: {
                                    colorize: true,
                                    translateTime: 'SYS:standard',
                                    ignore: 'pid,hostname',
                                },
                            },
                        });
                        tunnelId = flags['tunnel-id'] || "".concat(args.provider, "-").concat(flags.port);
                        config = {
                            provider: args.provider,
                            tunnelId: tunnelId,
                            tunnelPort: flags.port,
                            backendUrl: flags['backend-url'],
                            interval: flags.interval,
                            logLevel: flags['log-level'],
                        };
                        logger.info('🚀 Starting LocalRun Agent');
                        logger.info("\uD83D\uDCCA Provider: ".concat(config.provider));
                        logger.info("\uD83C\uDD94 Tunnel ID: ".concat(config.tunnelId));
                        logger.info("\uD83D\uDD0C Tunnel Port: ".concat(config.tunnelPort));
                        logger.info("\uD83D\uDD17 Backend: ".concat(config.backendUrl));
                        logger.info("\u23F1\uFE0F  Interval: ".concat(config.interval, "s"));
                        _b.label = 2;
                    case 2:
                        _b.trys.push([2, 4, , 5]);
                        providerCollector = (0, collectors_1.getCollector)(config.provider, config.tunnelPort, logger);
                        containerCollector = new container_stats_1.ContainerStatsCollector(logger);
                        reporter = new http_reporter_1.HttpReporter(config.backendUrl, logger);
                        service_1 = new metrics_service_1.MetricsService(config, providerCollector, containerCollector, reporter, logger);
                        // Manejar señales de terminación
                        process.on('SIGTERM', function () { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        logger.info('📴 Received SIGTERM, shutting down...');
                                        return [4 /*yield*/, service_1.stop()];
                                    case 1:
                                        _a.sent();
                                        process.exit(0);
                                        return [2 /*return*/];
                                }
                            });
                        }); });
                        process.on('SIGINT', function () { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        logger.info('📴 Received SIGINT, shutting down...');
                                        return [4 /*yield*/, service_1.stop()];
                                    case 1:
                                        _a.sent();
                                        process.exit(0);
                                        return [2 /*return*/];
                                }
                            });
                        }); });
                        // Iniciar servicio
                        return [4 /*yield*/, service_1.start()];
                    case 3:
                        // Iniciar servicio
                        _b.sent();
                        return [3 /*break*/, 5];
                    case 4:
                        error_1 = _b.sent();
                        logger.error({ error: error_1 }, '❌ Fatal error');
                        this.error(error_1);
                        return [3 /*break*/, 5];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    Start.description = 'Start metrics collection for a tunnel provider';
    Start.examples = [
        '<%= config.bin %> <%= command.id %> ngrok --port 8000 --tunnel-id ngrok-8000',
        '<%= config.bin %> <%= command.id %> cloudflare --port 3000 --backend-url http://localhost:8000',
        '<%= config.bin %> <%= command.id %> localhost.run --port 5000 --interval 30',
    ];
    Start.flags = {
        'tunnel-id': core_1.Flags.string({
            char: 'i',
            description: 'Unique tunnel ID',
            env: 'TUNNEL_ID',
        }),
        port: core_1.Flags.integer({
            char: 'p',
            description: 'Local port being tunneled',
            env: 'TUNNEL_PORT',
            required: true,
        }),
        'backend-url': core_1.Flags.string({
            char: 'b',
            description: 'Backend URL to send metrics',
            env: 'BACKEND_URL',
            default: 'http://backend:8000',
        }),
        interval: core_1.Flags.integer({
            char: 'n',
            description: 'Collection interval in seconds',
            env: 'METRICS_INTERVAL',
            default: 10,
        }),
        'log-level': core_1.Flags.string({
            char: 'l',
            description: 'Log level',
            options: ['debug', 'info', 'warn', 'error'],
            env: 'LOG_LEVEL',
            default: 'info',
        }),
    };
    Start.args = {
        provider: core_1.Args.string({
            name: 'provider',
            required: true,
            description: 'Tunnel provider (ngrok, cloudflare, localhost.run)',
            options: ['ngrok', 'cloudflare', 'localhost.run'],
        }),
    };
    return Start;
}(core_1.Command));
exports.default = Start;
