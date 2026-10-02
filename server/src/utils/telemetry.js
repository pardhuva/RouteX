/**
 * RouteX Telemetry & Observability Engine
 *
 * Tracks high-precision metrics across the core hot paths:
 * 1. Matching Engine: Redis in-memory GEO vs. MongoDB disk/index query latencies
 * 2. Kafka Event Bus: Asynchronous event delivery and processing lag
 * 3. HTTP Gateway: Request throughput, status distribution, and response times
 */

class TelemetryEngine {
  constructor() {
    this.startTime = Date.now();
    this.matching = {
      redisAttempts: 0,
      redisHits: 0,
      redisTotalTimeMs: 0,
      mongoAttempts: 0,
      mongoHits: 0,
      mongoTotalTimeMs: 0,
      recentMatches: [], // Ring buffer of recent 20 matches
    };
    this.kafka = {
      eventsProcessed: 0,
      totalLagMs: 0,
      lastEventLagMs: null,
      lastEventProcessedAt: null,
      recentEvents: [],
    };
    this.http = {
      totalRequests: 0,
      activeRequests: 0,
      statusCodes: { "2xx": 0, "4xx": 0, "5xx": 0 },
      totalDurationMs: 0,
    };
  }

  // Record a driver matching query
  recordMatching({ source, durationMs, driverFound, coordinates }) {
    if (source === "redis") {
      this.matching.redisAttempts++;
      this.matching.redisTotalTimeMs += durationMs;
      if (driverFound) this.matching.redisHits++;
    } else if (source === "mongo") {
      this.matching.mongoAttempts++;
      this.matching.mongoTotalTimeMs += durationMs;
      if (driverFound) this.matching.mongoHits++;
    }

    const entry = {
      source,
      durationMs: Number(durationMs.toFixed(3)),
      driverFound: Boolean(driverFound),
      timestamp: new Date().toISOString(),
      coordinates,
    };

    this.matching.recentMatches.unshift(entry);
    if (this.matching.recentMatches.length > 20) {
      this.matching.recentMatches.pop();
    }
  }

  // Record a consumed Kafka event
  recordKafkaEvent({ eventType, eventTimestamp }) {
    this.kafka.eventsProcessed++;
    const now = Date.now();
    let lagMs = 0;
    if (eventTimestamp) {
      const eventTime = new Date(eventTimestamp).getTime();
      if (!isNaN(eventTime)) {
        lagMs = Math.max(0, now - eventTime);
      }
    }
    this.kafka.totalLagMs += lagMs;
    this.kafka.lastEventLagMs = lagMs;
    this.kafka.lastEventProcessedAt = new Date().toISOString();

    const entry = {
      eventType,
      lagMs,
      processedAt: this.kafka.lastEventProcessedAt,
    };
    this.kafka.recentEvents.unshift(entry);
    if (this.kafka.recentEvents.length > 20) {
      this.kafka.recentEvents.pop();
    }
  }

  // Record an HTTP request completion
  recordRequest({ durationMs, statusCode }) {
    this.http.totalRequests++;
    this.http.totalDurationMs += durationMs;

    if (statusCode >= 200 && statusCode < 300) {
      this.http.statusCodes["2xx"]++;
    } else if (statusCode >= 400 && statusCode < 500) {
      this.http.statusCodes["4xx"]++;
    } else if (statusCode >= 500) {
      this.http.statusCodes["5xx"]++;
    }
  }

  // Generate snapshot for health/telemetry endpoints
  getSnapshot() {
    const redisAvg = this.matching.redisAttempts > 0
      ? Number((this.matching.redisTotalTimeMs / this.matching.redisAttempts).toFixed(2))
      : 0;

    const mongoAvg = this.matching.mongoAttempts > 0
      ? Number((this.matching.mongoTotalTimeMs / this.matching.mongoAttempts).toFixed(2))
      : 0;

    const kafkaAvgLag = this.kafka.eventsProcessed > 0
      ? Number((this.kafka.totalLagMs / this.kafka.eventsProcessed).toFixed(2))
      : 0;

    const httpAvgDuration = this.http.totalRequests > 0
      ? Number((this.http.totalDurationMs / this.http.totalRequests).toFixed(2))
      : 0;

    return {
      uptimeSeconds: Math.floor((Date.now() - this.startTime) / 1000),
      matching: {
        redis: {
          attempts: this.matching.redisAttempts,
          hits: this.matching.redisHits,
          hitRatio: this.matching.redisAttempts > 0
            ? Number(((this.matching.redisHits / this.matching.redisAttempts) * 100).toFixed(1))
            : 0,
          avgLatencyMs: redisAvg,
        },
        mongo: {
          attempts: this.matching.mongoAttempts,
          hits: this.matching.mongoHits,
          avgLatencyMs: mongoAvg,
        },
        recent: this.matching.recentMatches,
      },
      kafka: {
        eventsProcessed: this.kafka.eventsProcessed,
        avgLagMs: kafkaAvgLag,
        lastLagMs: this.kafka.lastEventLagMs,
        lastProcessedAt: this.kafka.lastEventProcessedAt,
        recent: this.kafka.recentEvents,
      },
      http: {
        totalRequests: this.http.totalRequests,
        statusCodes: this.http.statusCodes,
        avgResponseTimeMs: httpAvgDuration,
      },
    };
  }
}

const telemetry = new TelemetryEngine();
module.exports = { telemetry };
