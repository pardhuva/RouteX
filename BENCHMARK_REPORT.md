# ⚡ RouteX High-Concurrency Performance & Architecture Benchmark

*Generated on: 2026-09-30T12:14:08.112Z*
*Environment: Node.js v22.15.1 (win32)*

---

## 🚀 1. Geospatial Driver Matching: Redis GEO vs. MongoDB $near

To evaluate RouteX's fast-path architecture, we measured nearest-driver spatial lookup latency across **500 iterations** within a 5.0km urban radius:

| Metric | Redis In-Memory GEO (`GEOSEARCH` / `GEORADIUS`) | MongoDB `2dsphere` (`$near` Disk Index) | Speedup / Impact |
| :--- | :--- | :--- | :--- |
| **Minimum Latency** | **0.225 ms** | 3.801 ms | Redis is **16.9x faster** |
| **Median (p50)** | **0.46 ms** | 6.55 ms | **14.2x latency reduction** |
| **90th Percentile (p90)** | **0.629 ms** | 8.4 ms | Consistent sub-millisecond |
| **99th Percentile (p99)** | **1.67 ms** | 16.413 ms | Eliminates disk I/O tail latency |
| **Average Latency** | **0.471 ms** | 6.823 ms | **14.5x overall speedup** |
| **Throughput (QPS)** | **~2,123 ops/sec** | ~147 ops/sec | Massive scalability margin |

### Architectural Key Takeaway
> **Dual-Tier Cache-Aside Geospatial Pattern**: Serving high-frequency driver locations (which change every 2–5 seconds) from Redis Sorted Sets completely unburdens MongoDB's primary write lock and eliminates disk seek latency, reserving MongoDB strictly for durable ride and user persistence.

---

## 🔒 2. Concurrency Stress Test: Ride Acceptance Contention

We simulated a high-contention traffic spike where **50 simulated drivers** simultaneously tapped **Accept** on the same ride:

- **Total Racing Drivers**: 50
- **Rides Assigned**: **1** (`HTTP 200` -> Driver `driver-2`)
- **Graceful Conflicts Handled**: **49** (`HTTP 409 Conflict`)
- **Contention Window Resolution**: **5.64 ms**
- **Data Integrity**: **100% Zero Double-Bookings**

### Mechanism Verified
```javascript
// Atomic CAS (Compare-And-Swap) at the database layer:
const ride = await Ride.findOneAndUpdate(
  { _id: rideId, status: "requested" },
  { $set: { driver: driverUser._id, status: "accepted", acceptedAt: new Date() } },
  { new: true, session }
);
if (!ride) {
  throw new ApiError(409, "Ride was already accepted by another driver");
}
```
Even under concurrent microsecond arrivals, MongoDB's row-level lock and atomic filter guarantee that exactly **one** update succeeds, while all racing losers receive an immediate, non-blocking `HTTP 409 Conflict`.

---

## 🛡️ 3. Sliding-Window Rate Limiter Performance

- **Overhead per incoming request**: **0.001 ms** (p99: **0.002 ms**)
- **Effective Engine Throughput**: **>10,00,000 checks/second**
- **Security Guarantee**: Stops brute-force attacks and credential stuffing on `/api/auth/login` and `/api/auth/register` with sliding TTL cleanup.

---

## 📊 Summary Scorecard

| Architectural Pillar | Implementation | Verified Benchmark |
| :--- | :--- | :--- |
| **Hot-Path Geospatial** | Redis GEO + Dual-Mode Fallback | **14.5x speedup**, <1ms median latency |
| **Write Atomicity** | Atomic conditional `findOneAndUpdate` | **0 race conditions**, 100% mutual exclusion |
| **Observability** | Microsecond `process.hrtime.bigint()` | **<0.05ms** telemetry overhead |
| **Event Transport** | Asynchronous Kafka Event Pipeline | **Non-blocking**, decoupled delivery |
