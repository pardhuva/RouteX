const express = require("express");
const mongoose = require("mongoose");
const { pingRedis, getGeoMode } = require("../services/redis.service");
const { isRideConsumerRunning } = require("../consumers/rideEventConsumer");
const { isPaymentConsumerRunning } = require("../consumers/paymentEventConsumer");
const { isKafkaProducerConnected } = require("../services/kafkaProducer");
const { getIO } = require("../config/socket");
const { telemetry } = require("../utils/telemetry");

const router = express.Router();

/**
 * GET /api/health
 *
 * Comprehensive RouteX health probe.
 * Checks MongoDB durability, Redis cache & GEO readiness, Kafka event consumers/producer,
 * and Socket.IO active socket count.
 */
router.get("/", async (_req, res) => {
  const timestamp = new Date().toISOString();
  const uptimeSeconds = Math.floor(process.uptime());

  // 1. Check MongoDB (Source of Truth - Mandatory)
  let mongoOk = false;
  let mongoLatencyMs = null;
  const mongoState = ["disconnected", "connected", "connecting", "disconnecting"][
    mongoose.connection.readyState
  ] || "unknown";

  if (mongoose.connection.readyState === 1 && mongoose.connection.db) {
    const mStart = process.hrtime.bigint();
    try {
      await mongoose.connection.db.admin().ping();
      const mEnd = process.hrtime.bigint();
      mongoLatencyMs = Number((Number(mEnd - mStart) / 1e6).toFixed(2));
      mongoOk = true;
    } catch {
      mongoOk = false;
    }
  }

  // 2. Check Redis (Fast-Path Cache & GEO - Optional / Graceful Degradation)
  const redisHealth = await pingRedis();
  const geoMode = getGeoMode();

  // 3. Check Kafka (Async Event Pipeline: Producer & Consumers)
  const producerActive = isKafkaProducerConnected();
  const rideConsumerActive = isRideConsumerRunning();
  const paymentConsumerActive = isPaymentConsumerRunning();
  const kafkaActive = producerActive || rideConsumerActive || paymentConsumerActive;
  const kafkaStatus = kafkaActive ? "connected" : "disconnected";

  // 4. Check Socket.IO
  let connectedSockets = 0;
  try {
    const io = getIO();
    if (io && io.engine) {
      connectedSockets = io.engine.clientsCount || 0;
    }
  } catch {
    connectedSockets = 0;
  }

  // 5. Memory usage
  const mem = process.memoryUsage();
  const memory = {
    heapUsedMB: Number((mem.heapUsed / 1024 / 1024).toFixed(1)),
    heapTotalMB: Number((mem.heapTotal / 1024 / 1024).toFixed(1)),
    rssMB: Number((mem.rss / 1024 / 1024).toFixed(1)),
  };

  // Determine overall status:
  // - "healthy": MongoDB + Redis + Kafka all operational
  // - "degraded": MongoDB is healthy, but Redis and/or Kafka are offline (system operates normally via Mongo)
  // - "unhealthy": MongoDB is offline
  let systemStatus = "healthy";
  let httpStatusCode = 200;

  if (!mongoOk) {
    systemStatus = "unhealthy";
    httpStatusCode = 503;
  } else if (!redisHealth.ok || kafkaStatus !== "connected") {
    systemStatus = "degraded";
  }

  res.status(httpStatusCode).json({
    success: mongoOk,
    name: "RouteX Mobility Platform API",
    status: systemStatus,
    timestamp,
    uptimeSeconds,
    services: {
      mongodb: {
        status: mongoState,
        healthy: mongoOk,
        latencyMs: mongoLatencyMs,
        role: "Primary Source of Truth (Durable)",
      },
      redis: {
        status: redisHealth.status,
        healthy: redisHealth.ok,
        latencyMs: redisHealth.latencyMs,
        geoMode,
        role: "Fast-Path State & Geospatial Index (Cache-Aside)",
      },
      kafka: {
        status: kafkaStatus,
        producer: producerActive ? "connected" : "disconnected",
        rideConsumer: rideConsumerActive ? "running" : "stopped",
        paymentConsumer: paymentConsumerActive ? "running" : "stopped",
        role: "Asynchronous Event Pipeline",
      },
      realtime: {
        provider: "Socket.IO",
        connectedClients: connectedSockets,
      },
    },
    system: {
      nodeVersion: process.version,
      platform: process.platform,
      memory,
    },
    telemetry: telemetry.getSnapshot(),
  });
});

/**
 * GET /api/health/metrics
 *
 * Returns live telemetry and performance snapshots for real benchmarking.
 */
router.get("/metrics", (_req, res) => {
  res.status(200).json({
    success: true,
    timestamp: new Date().toISOString(),
    metrics: telemetry.getSnapshot(),
  });
});

module.exports = router;
