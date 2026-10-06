# ⚡ RouteX Live System Performance & Benchmarking Report

> **Empirical Ground-Truth Report**: All metrics in this report are collected dynamically from live executions against active MongoDB and Redis infrastructure in the specified test environment. No simulated constants or synthetic numbers are used.

*Generated on: 2026-10-06T11:40:37.589Z*  
*Environment: Node.js v22.15.1 on win32 (x64) | 12 CPU cores (12th Gen Intel(R) Core(TM) i5-1235U)*  
*Databases: MongoDB v8.0.34 | Redis v8.4.0*

---

## 🚀 1. Geospatial Driver Matching: Redis GEO vs. MongoDB `2dsphere` ($near)

We evaluated RouteX's fast-path driver matching by seeding a controlled dataset of **100 available drivers** positioned across Bangalore and executing **500 real search iterations** (with a 50-iteration warmup) within a **5.0 km radius** (5000 meters):

| Latency & Throughput Metric | Redis In-Memory GEO (`GEOSEARCH`) | MongoDB `2dsphere` (`$near` Index) | Comparative Speedup |
| :--- | :--- | :--- | :--- |
| **Minimum Latency** | **36.477 ms** | 38.301 ms | 1.1x faster |
| **Median (p50)** | **38.195 ms** | 43.021 ms | **1.13x latency reduction** |
| **90th Percentile (p90)** | **49.969 ms** | 66.781 ms | Lower tail variability |
| **95th Percentile (p95)** | **68.845 ms** | 83.119 ms | Stable under search bursts |
| **99th Percentile (p99)** | **156.175 ms** | 178.108 ms | Consistent low tail latency |
| **Average Latency** | **44.47 ms** | 52.834 ms | **1.19x average speedup** |
| **Measured Concurrent Throughput** | **251 ops/sec** | 81 ops/sec | Live batch benchmark (@ concurrency = 10) |
| **Theoretical Single-Thread Capacity** | ~22 ops/sec | ~19 ops/sec | Derived from `1000 / averageLatency` |

### Architectural Observation
In this benchmark environment, Redis GEO demonstrated lower lookup latency and higher sustained operations per second than MongoDB's `2dsphere` `$near` query. Serving high-frequency ephemeral driver positions (which update every 2–5 seconds) from in-memory Redis sorted sets reduces read traffic on MongoDB, allowing MongoDB to focus on durable ride lifecycle persistence and financial transaction logs.

---

## 🔒 2. High-Concurrency Stress Test: Ride Acceptance Contention

To test whether concurrent driver acceptance attempts could cause double-booking, we executed **20 independent contention rounds**, each firing **50 simultaneous acceptance updates** against the same ride request (1000 total concurrent attempts):

| Contention Metric | Value | Verification Details |
| :--- | :--- | :--- |
| **Total Test Rounds** | **20** | Independent ride lifecycles created and contested |
| **Simultaneous Drivers per Round** | **50** | Dispatched concurrently via `Promise.all` |
| **Total Acceptance Attempts** | **1000** | Live database update operations |
| **Successful Assignments (HTTP 200)** | **20** | Exactly 1 winner per test run |
| **Graceful Conflicts Handled (HTTP 409)** | **980** | Non-blocking conflict rejection |
| **Observed Double-Bookings** | **0** | Verified directly against MongoDB document state |
| **Mean Contention Resolution Time** | **468.549 ms** | Resolution window (p95: 684.883 ms) |

### Concurrency Mechanism
RouteX leverages MongoDB's document-level atomic update semantics with a conditional filter predicate:
```javascript
const ride = await Ride.findOneAndUpdate(
  { _id: rideId, status: "requested" },
  { $set: { driver: driverUser._id, status: "accepted", acceptedAt: new Date() } },
  { new: true }
);
if (!ride) {
  throw new ApiError(409, "This ride was already accepted by another driver or cancelled.");
}
```
Under MongoDB's WiredTiger storage engine, document-level write locks ensure that only the first query to acquire the document lock finds `status === "requested"`. All racing concurrent requests fail the query filter, returning `null` and triggering an immediate HTTP 409 Conflict.

Across **20 test runs with 50 concurrent attempts per run (1000 total requests)**, we observed **0 double-bookings**.

---

## 🛡️ 3. Sliding-Window Rate Limiter Performance

We evaluated RouteX's sliding-window rate limiter across both raw middleware execution and live HTTP network requests:

| Benchmark Dimension | Value | Description |
| :--- | :--- | :--- |
| **Middleware Latency (p50)** | **0.032 ms** | Median rate-limit check duration |
| **Middleware Latency (p99)** | **0.117 ms** | 99th percentile execution time |
| **Average Middleware Overhead** | **0.039 ms** | Mean check overhead |
| **Live HTTP Gateway Throughput** | **260 req/sec** | Measured concurrent HTTP requests on ephemeral server |
| **Policy Enforcement Accuracy** | **20 Allowed / 80 Throttled** | Exactly matched configured window limit (20 <= 20) |

*Observation: Rate limiting mitigates brute-force authentication and credential-stuffing attempts according to configured window thresholds with minimal per-request overhead.*

---

## 📈 4. Telemetry & Observability Overhead

We quantified the runtime overhead of RouteX's microsecond-precision telemetry engine across **1000 iterations**:

- **Baseline Operation Latency**: **0 ms**
- **Instrumented Operation Latency**: **0.014 ms**
- **Net Telemetry Overhead**: **0.014 ms** (~14 microseconds per event)

*Observation: In-memory ring-buffered telemetry introduces negligible microsecond-scale execution overhead while capturing real-time matching and Kafka consumer lag.*

---

## 🔬 5. Methodology & Test Setup

1. **Isolation**: All tests were executed on a live test suite using dedicated benchmark datasets tagged with unique IDs to prevent interference with application state.
2. **Warm-Up**: Both MongoDB and Redis received 50 warmup queries before measurement to ensure JIT compilation, connection pool priming, and index cache warming.
3. **Timing Precision**: Latencies were captured using Node.js `process.hrtime.bigint()` wrapped strictly around the database operations and converted to fractional milliseconds.
4. **Data Cleanup**: All benchmark records (100 drivers, 101 users, 20 rides, and temporary Redis keys) were automatically purged upon completion.

---

## ⚠️ 6. Limitations & Context

- **Local / Development Environment**: These measurements were collected on a development workstation connecting to cloud MongoDB Atlas and Redis instances. Real-world production performance will depend on network topology, cluster topology, replica sets, connection pools, and instance sizing.
- **Concurrency Scope**: Concurrency tests reflect burst contention of 50 simultaneous drivers per ride. Production systems with thousands of simultaneous rides would scale across partitioned worker pools.
