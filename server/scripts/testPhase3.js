/**
 * Phase 3 Verification Script
 * Validates:
 * 1. Redis Dual-Mode GEO (with auto-detect and fallback mechanisms)
 * 2. Sliding Window Rate Limiter (Memory fallback and headers)
 * 3. High-Precision Request Timer (X-Response-Time and Telemetry integration)
 * 4. Deep Health Endpoint (MongoDB ping, Redis status, Kafka event health, uptime)
 */
const express = require("express");
const http = require("http");
const redisService = require("../src/services/redis.service");
const { createRateLimiter } = require("../src/middleware/rateLimit.middleware");
const { requestTimer } = require("../src/middleware/observability.middleware");
const { telemetry } = require("../src/utils/telemetry");
const healthRoutes = require("../src/routes/health.routes");

async function runTests() {
  console.log("=== Phase 3 Verification Tests ===\n");
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`[PASS] ${message}`);
      passed++;
    } else {
      console.error(`[FAIL] ${message}`);
      failed++;
    }
  }

  // --- Test 1: Redis Service Dual-Mode Methods Export Check ---
  console.log("--> Testing 1: Redis Service Dual-Mode Exports & Signatures");
  assert(typeof redisService.geoSearchNearest === "function", "geoSearchNearest is exported");
  assert(typeof redisService.geoSearchNearestByMember === "function", "geoSearchNearestByMember is exported");
  assert(typeof redisService.geoRadiusFallback === "function", "geoRadiusFallback is exported");
  assert(typeof redisService.geoRadiusByMemberFallback === "function", "geoRadiusByMemberFallback is exported");
  assert(typeof redisService.pingRedis === "function", "pingRedis is exported");
  assert(typeof redisService.getGeoMode === "function", "getGeoMode is exported");

  // When Redis client is not connected, methods gracefully degrade
  const nearestResult = await redisService.geoSearchNearest("test:geo", 77.5946, 12.9716, 5000);
  assert(nearestResult === null, "geoSearchNearest returns null gracefully when disconnected");

  const memberResult = await redisService.geoSearchNearestByMember("test:geo", "driver123", 5000);
  assert(memberResult === null, "geoSearchNearestByMember returns null gracefully when disconnected");

  // --- Test 2: Rate Limiter Middleware ---
  console.log("\n--> Testing 2: Sliding Window Rate Limiter");
  const limiter = createRateLimiter({
    windowMs: 1000,
    maxRequests: 3,
    keyPrefix: "test-limit",
    message: "Rate limit exceeded",
  });

  const app = express();
  app.use(requestTimer);
  app.get("/test-limited", limiter, (_req, res) => res.json({ ok: true }));
  app.use("/api/health", healthRoutes);

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;

  // Make 3 requests (should succeed)
  let lastResHeaders = {};
  for (let i = 1; i <= 3; i++) {
    const res = await fetch(`http://127.0.0.1:${port}/test-limited`);
    lastResHeaders = Object.fromEntries(res.headers.entries());
    assert(res.status === 200, `Request #${i} within rate limit succeeded (200)`);
  }

  assert(
    lastResHeaders["x-ratelimit-limit"] === "3",
    `X-RateLimit-Limit header present and equals 3 (${lastResHeaders["x-ratelimit-limit"]})`
  );
  assert(
    lastResHeaders["x-ratelimit-remaining"] === "0",
    `X-RateLimit-Remaining is 0 after 3 requests (${lastResHeaders["x-ratelimit-remaining"]})`
  );

  // 4th request should get 429
  const blockedRes = await fetch(`http://127.0.0.1:${port}/test-limited`);
  const blockedData = await blockedRes.json();
  assert(blockedRes.status === 429, `Request #4 blocked with HTTP 429`);
  assert(blockedData.success === false, `Response indicates success: false`);
  assert(blockedRes.headers.get("retry-after") !== null, `Retry-After header is present`);

  // --- Test 3: High Precision Latency Timer ---
  console.log("\n--> Testing 3: Request Latency Timer Middleware");
  const timedRes = await fetch(`http://127.0.0.1:${port}/test-limited`);
  const responseTimeHeader = timedRes.headers.get("x-response-time");
  assert(responseTimeHeader !== null, `X-Response-Time header is present: ${responseTimeHeader}`);
  assert(/^[0-9.]+ms$/.test(responseTimeHeader), `X-Response-Time format is valid (e.g. 1.25ms)`);

  const snapshot = telemetry.getSnapshot();
  assert(snapshot.http.totalRequests > 0, `Telemetry recorded HTTP requests (${snapshot.http.totalRequests})`);
  assert(snapshot.http.statusCodes["2xx"] === 3, `Telemetry correctly tracked 3x 2xx responses`);
  assert(snapshot.http.statusCodes["4xx"] >= 1, `Telemetry correctly tracked 4xx responses`);

  // --- Test 4: Health & Observability Endpoint ---
  console.log("\n--> Testing 4: Deep Health & Observability Endpoint");
  const healthRes = await fetch(`http://127.0.0.1:${port}/api/health`);
  const healthData = await healthRes.json();

  assert(healthData.name.includes("RouteX"), `Health endpoint reports service name: ${healthData.name}`);
  assert(typeof healthData.uptimeSeconds === "number", `Health endpoint reports uptime: ${healthData.uptimeSeconds}s`);
  assert(healthData.services.mongodb !== undefined, `MongoDB service block present`);
  assert(healthData.services.redis !== undefined, `Redis service block present`);
  assert(healthData.services.redis.geoMode !== undefined, `Redis geoMode reported: ${healthData.services.redis.geoMode}`);
  assert(healthData.services.kafka !== undefined, `Kafka service block present`);
  assert(healthData.services.kafka.producer !== undefined, `Kafka producer status reported`);
  assert(healthData.services.realtime !== undefined, `Realtime Socket.IO status reported`);
  assert(healthData.telemetry !== undefined, `Telemetry snapshot embedded in health response`);

  // Test /api/health/metrics
  const metricsRes = await fetch(`http://127.0.0.1:${port}/api/health/metrics`);
  const metricsData = await metricsRes.json();
  assert(metricsData.success === true, `/api/health/metrics returns success: true`);
  assert(metricsData.metrics !== undefined, `Metrics data payload is present`);

  if (typeof server.closeAllConnections === "function") {
    server.closeAllConnections();
  }
  await new Promise((resolve) => server.close(resolve));

  console.log(`\n========================================`);
  console.log(`Phase 3 Test Results: ${passed} passed, ${failed} failed.`);
  console.log(`========================================\n`);

  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
