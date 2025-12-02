"use strict";
/**
 * Analytics Proxy - Universal HTTP proxy with analytics collection
 * Works with ANY tunnel provider (Cloudflare, ngrok, Serveo, etc.)
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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsProxy = void 0;
var express_1 = require("express");
var http_proxy_middleware_1 = require("http-proxy-middleware");
var node_fetch_1 = require("node-fetch");
var AnalyticsQueue = /** @class */ (function () {
    function AnalyticsQueue(backendUrl) {
        var _this = this;
        this.queue = [];
        this.maxBatchSize = 100;
        this.flushInterval = 5000; // 5 seconds
        this.isFlushing = false;
        this.backendUrl = backendUrl;
        this.flushTimer = setInterval(function () { return _this.flush(); }, this.flushInterval);
        console.log("\uD83D\uDCCA Analytics queue initialized (batch: ".concat(this.maxBatchSize, ", interval: ").concat(this.flushInterval, "ms)"));
    }
    AnalyticsQueue.prototype.add = function (event) {
        this.queue.push(event);
        // Auto-flush if queue is full
        if (this.queue.length >= this.maxBatchSize) {
            this.flush();
        }
    };
    AnalyticsQueue.prototype.flush = function () {
        return __awaiter(this, void 0, void 0, function () {
            var batch, controller_1, timeout, response, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.queue.length === 0 || this.isFlushing)
                            return [2 /*return*/];
                        this.isFlushing = true;
                        batch = this.queue.splice(0, this.maxBatchSize);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, 4, 5]);
                        controller_1 = new AbortController();
                        timeout = setTimeout(function () { return controller_1.abort(); }, 3000);
                        return [4 /*yield*/, (0, node_fetch_1.default)("".concat(this.backendUrl, "/analytics/batch"), {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ events: batch }),
                                signal: controller_1.signal
                            })];
                    case 2:
                        response = _a.sent();
                        clearTimeout(timeout);
                        if (response.ok) {
                            console.log("\u2705 Sent ".concat(batch.length, " analytics events"));
                        }
                        else {
                            console.error("\u274C Analytics batch failed: ".concat(response.status));
                        }
                        return [3 /*break*/, 5];
                    case 3:
                        error_1 = _a.sent();
                        console.error("\u274C Failed to send analytics batch: ".concat(error_1.message));
                        return [3 /*break*/, 5];
                    case 4:
                        this.isFlushing = false;
                        return [7 /*endfinally*/];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    AnalyticsQueue.prototype.shutdown = function () {
        clearInterval(this.flushTimer);
        this.flush(); // Final flush
    };
    AnalyticsQueue.prototype.getQueueSize = function () {
        return this.queue.length;
    };
    return AnalyticsQueue;
}());
var AnalyticsProxy = /** @class */ (function () {
    function AnalyticsProxy(targetPort, proxyPort, backendUrl, tunnelId) {
        this.targetPort = targetPort;
        this.proxyPort = proxyPort;
        this.backendUrl = backendUrl;
        this.tunnelId = tunnelId;
        this.queue = new AnalyticsQueue(backendUrl);
        this.app = (0, express_1.default)();
    }
    AnalyticsProxy.prototype.start = function () {
        var _this = this;
        // Analytics middleware (non-blocking)
        this.app.use(function (req, res, next) {
            var startTime = Date.now();
            var requestSize = 0;
            var responseSize = 0;
            // Capture request size
            req.on('data', function (chunk) {
                requestSize += chunk.length;
            });
            // Intercept response to measure size
            var originalWrite = res.write;
            var originalEnd = res.end;
            res.write = function (chunk) {
                var args = [];
                for (var _i = 1; _i < arguments.length; _i++) {
                    args[_i - 1] = arguments[_i];
                }
                if (chunk) {
                    responseSize += Buffer.isBuffer(chunk) ? chunk.length : Buffer.byteLength(chunk);
                }
                return originalWrite.apply(res, __spreadArray([chunk], args, true));
            };
            var self = _this;
            res.end = function (chunk) {
                var args = [];
                for (var _i = 1; _i < arguments.length; _i++) {
                    args[_i - 1] = arguments[_i];
                }
                if (chunk) {
                    responseSize += Buffer.isBuffer(chunk) ? chunk.length : Buffer.byteLength(chunk);
                }
                // Add to queue (< 0.1ms, non-blocking)
                setImmediate(function () {
                    try {
                        var event_1 = {
                            tunnel_id: self.tunnelId,
                            ip: req.headers['x-forwarded-for'] ||
                                req.headers['cf-connecting-ip'] ||
                                req.ip ||
                                'unknown',
                            user_agent: req.headers['user-agent'] || 'Unknown',
                            method: req.method,
                            path: req.path,
                            status_code: res.statusCode,
                            response_time_ms: Date.now() - startTime,
                            request_size_bytes: requestSize,
                            response_size_bytes: responseSize,
                            referer: req.headers['referer'],
                            accept_language: req.headers['accept-language'],
                            timestamp: new Date().toISOString()
                        };
                        self.queue.add(event_1);
                    }
                    catch (error) {
                        // Silently ignore analytics errors
                    }
                });
                return originalEnd.apply(res, __spreadArray([chunk], args, true));
            };
            next();
        });
        // Proxy to real service
        this.app.use('/', (0, http_proxy_middleware_1.createProxyMiddleware)({
            target: "http://host.docker.internal:".concat(this.targetPort),
            changeOrigin: true,
            ws: true, // WebSocket support
            onError: function (err, req, res) {
                console.error('❌ Proxy error:', err.message);
                if (!res.headersSent) {
                    res.status(502).send('Bad Gateway');
                }
            },
            onProxyReq: function (proxyReq, req) {
                // Preserve original headers
                proxyReq.setHeader('X-Forwarded-For', req.ip || 'unknown');
                proxyReq.setHeader('X-Forwarded-Proto', req.protocol);
                proxyReq.setHeader('X-Forwarded-Host', req.hostname);
            }
        }));
        // Health check endpoint
        this.app.get('/__analytics_health', function (req, res) {
            res.json({
                status: 'ok',
                queue_size: _this.queue.getQueueSize(),
                tunnel_id: _this.tunnelId,
                target_port: _this.targetPort
            });
        });
        // Start server
        this.app.listen(this.proxyPort, function () {
            console.log('🚀 Analytics Proxy started');
            console.log("   Listening on: http://localhost:".concat(_this.proxyPort));
            console.log("   Proxying to: http://host.docker.internal:".concat(_this.targetPort));
            console.log("   Backend: ".concat(_this.backendUrl));
            console.log("   Tunnel ID: ".concat(_this.tunnelId));
        });
        // Graceful shutdown
        process.on('SIGTERM', function () { return _this.shutdown(); });
        process.on('SIGINT', function () { return _this.shutdown(); });
    };
    AnalyticsProxy.prototype.shutdown = function () {
        console.log('🛑 Shutting down analytics proxy...');
        this.queue.shutdown();
        process.exit(0);
    };
    return AnalyticsProxy;
}());
exports.AnalyticsProxy = AnalyticsProxy;
// CLI entry point
if (require.main === module) {
    var targetPort = parseInt(process.env.TARGET_PORT || '3000');
    var proxyPort = parseInt(process.env.PROXY_PORT || '8001');
    var backendUrl = process.env.BACKEND_URL || 'http://backend:8000';
    var tunnelId = process.env.TUNNEL_ID || "tunnel-".concat(targetPort);
    var proxy = new AnalyticsProxy(targetPort, proxyPort, backendUrl, tunnelId);
    proxy.start();
}
