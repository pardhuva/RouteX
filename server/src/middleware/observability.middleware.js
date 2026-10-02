const { telemetry } = require("../utils/telemetry");

/**
 * RouteX Request Latency & Observability Middleware
 *
 * Attaches high-precision timing to every incoming HTTP request.
 * Sets the X-Response-Time header on outgoing responses and records
 * duration + status codes in the Telemetry engine.
 */
function requestTimer(req, res, next) {
  const start = process.hrtime.bigint();

  res.on("finish", () => {
    const end = process.hrtime.bigint();
    const durationMs = Number(end - start) / 1e6;

    // Record in central telemetry engine
    telemetry.recordRequest({
      durationMs,
      statusCode: res.statusCode,
    });

    // Optional slow-query / slow-endpoint warning (over 500ms)
    if (durationMs > 500 && !req.path.startsWith("/api/health")) {
      console.warn(
        `[SLOW REQUEST] ${req.method} ${req.originalUrl || req.url} took ${durationMs.toFixed(2)}ms (Status: ${res.statusCode})`
      );
    }
  });

  // Calculate and set X-Response-Time header on response writeHead
  const originalWriteHead = res.writeHead;
  res.writeHead = function (...args) {
    if (!res.headersSent) {
      const end = process.hrtime.bigint();
      const durationMs = Number(end - start) / 1e6;
      res.setHeader("X-Response-Time", `${durationMs.toFixed(2)}ms`);
    }
    return originalWriteHead.apply(this, args);
  };

  next();
}

module.exports = { requestTimer };
