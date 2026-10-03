const { Queue, Worker } = require("bullmq");
const IORedis = require("ioredis");
const Ride = require("../models/Ride");
const Driver = require("../models/Driver");
const matchingService = require("./matching.service");
const driverSimulationService = require("./driverSimulationService");
const { getIO } = require("../config/socket");
const {
  MATCHING_RADIUS_TIERS,
  TIER_EXPANSION_DELAY_MS,
  SOCKET_EVENTS,
} = require("../config/constants");

// Maximum search lifecycle before automatically timing out (2 minutes = 120,000ms)
const MAX_SEARCH_TIMEOUT_MS = Number(process.env.MAX_SEARCH_TIMEOUT_MS) || 120000;

// Shared Redis connection for BullMQ
let redisConnection = null;
let matchingQueue = null;
let matchingWorker = null;

function getRedisConnection() {
  if (!redisConnection) {
    const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
    redisConnection = new IORedis(redisUrl, {
      maxRetriesPerRequest: null, // Required by BullMQ
      enableReadyCheck: false,
      retryStrategy: (times) => {
        if (times > 10) return null;
        return Math.min(times * 200, 3000);
      },
    });

    redisConnection.on("error", (err) => {
      console.warn("[BullMQ:Redis] Connection notice:", err.message);
    });
  }
  return redisConnection;
}

function initMatchingQueue() {
  if (matchingQueue) return matchingQueue;

  try {
    const connection = getRedisConnection();
    matchingQueue = new Queue("routex-matching-queue", { connection });

    matchingWorker = new Worker(
      "routex-matching-queue",
      async (job) => {
        const { rideId, pickupCoordinates, vehicleType, tierIndex, action } = job.data;

        if (action === "timeout_check") {
          await handleRideSearchTimeout(rideId);
          return;
        }

        await processSearchTierJob(rideId, pickupCoordinates, vehicleType, tierIndex);
      },
      { connection, concurrency: 10 }
    );

    matchingWorker.on("completed", (job) => {
      // Clean finished job
    });

    matchingWorker.on("failed", (job, err) => {
      console.warn(`[BullMQ:Worker] Job ${job?.id} failed:`, err.message);
    });

    console.log("[BullMQ] Matching Queue & Worker initialized successfully");
  } catch (err) {
    console.warn("[BullMQ] Failed to initialize queue, continuing with in-memory fallback:", err.message);
  }

  return matchingQueue;
}

/**
 * Initiates the multi-tier dynamic expanding radius matching process for a ride using BullMQ.
 */
async function startExpandingSearch(rideId, pickupCoordinates, vehicleType) {
  const queue = initMatchingQueue();
  const rideStrId = rideId.toString();

  // 1. Process Tier 0 immediately
  if (queue) {
    await queue.add(
      `match:${rideStrId}:tier0`,
      {
        rideId: rideStrId,
        pickupCoordinates,
        vehicleType,
        tierIndex: 0,
        action: "search",
      },
      { jobId: `match:${rideStrId}:tier0`, removeOnComplete: true, removeOnFail: true }
    );

    // 2. Schedule the 2-minute max timeout job
    await queue.add(
      `timeout:${rideStrId}`,
      {
        rideId: rideStrId,
        action: "timeout_check",
      },
      {
        jobId: `timeout:${rideStrId}`,
        delay: MAX_SEARCH_TIMEOUT_MS,
        removeOnComplete: true,
        removeOnFail: true,
      }
    );
  } else {
    // In-memory fallback if Redis is offline
    await processSearchTierJob(rideStrId, pickupCoordinates, vehicleType, 0);
  }
}

/**
 * Processes a single search tier job (3km -> 7km -> 15km).
 */
async function processSearchTierJob(rideId, pickupCoordinates, vehicleType, tierIndex) {
  const rideStrId = rideId.toString();

  try {
    const currentRide = await Ride.findById(rideId).populate("rider", "name phone");
    if (!currentRide || currentRide.status !== "requested") {
      await cancelExpandingSearch(rideStrId);
      return;
    }

    const radiusMeters = MATCHING_RADIUS_TIERS[tierIndex] || MATCHING_RADIUS_TIERS[MATCHING_RADIUS_TIERS.length - 1];
    const radiusKm = Number((radiusMeters / 1000).toFixed(1));
    const tierNumber = tierIndex + 1;
    const totalTiers = MATCHING_RADIUS_TIERS.length;

    // Update ride document with active search radius
    currentRide.searchRadiusMeters = radiusMeters;
    await currentRide.save();

    console.log(
      `[BullMQ:Matching] 📡 Ride ${rideStrId} -> Tier ${tierNumber}/${totalTiers} (${radiusKm} km / ${radiusMeters}m)`
    );

    // Broadcast radius expansion event to rider
    const io = getIO();
    if (io) {
      io.to(`ride:${rideStrId}`).emit(SOCKET_EVENTS.serverToClient.matchingRadiusExpanded, {
        event: SOCKET_EVENTS.serverToClient.matchingRadiusExpanded,
        rideId: rideStrId,
        tier: tierNumber,
        totalTiers,
        radiusMeters,
        radiusKm,
        timestamp: new Date().toISOString(),
      });
    }

    // Find candidate drivers within this expanded radius
    const newlyFoundDrivers = await matchingService.findAllAvailableDriversInRange(
      pickupCoordinates,
      vehicleType,
      radiusMeters
    );

    console.log(
      `[BullMQ:Matching] Found ${newlyFoundDrivers.length} available driver(s) within ${radiusKm}km for ride ${rideStrId}`
    );

    // Notify drivers
    if (io && newlyFoundDrivers.length > 0) {
      const payload = {
        rideId: currentRide._id.toString(),
        pickup: currentRide.pickup,
        destination: currentRide.destination,
        vehicleType: currentRide.vehicleType,
        rider: { name: currentRide.rider?.name, phone: currentRide.rider?.phone },
        fare: currentRide.grossFare || currentRide.fare,
        grossFare: currentRide.grossFare || currentRide.fare,
        driverEarnings: currentRide.driverEarnings || (currentRide.grossFare ? currentRide.grossFare * 0.8 : undefined),
        createdAt: currentRide.createdAt || new Date().toISOString(),
        searchRadiusKm: radiusKm,
      };

      for (const driver of newlyFoundDrivers) {
        if (driver.user) {
          const uId = driver.user.toString();
          io.to(`driver:${uId}`).emit(SOCKET_EVENTS.serverToClient.newRideRequest, payload);
        }
      }
    }

    // Schedule simulated driver acceptance if applicable
    if (!currentRide.matchedDriver && newlyFoundDrivers.length > 0) {
      const firstDriver = newlyFoundDrivers[0];
      currentRide.matchedDriver = firstDriver.user;
      await currentRide.save();

      if (firstDriver.isSimulated) {
        const realAvailableDriver = await Driver.findOne({ status: "available", isSimulated: { $ne: true } });
        if (!realAvailableDriver) {
          driverSimulationService.scheduleSimulatedAcceptance(currentRide._id, firstDriver.user);
        }
      }
    }

    // If there is a next tier, schedule delayed job in BullMQ
    if (tierIndex + 1 < MATCHING_RADIUS_TIERS.length) {
      const queue = initMatchingQueue();
      if (queue) {
        await queue.add(
          `match:${rideStrId}:tier${tierIndex + 1}`,
          {
            rideId: rideStrId,
            pickupCoordinates,
            vehicleType,
            tierIndex: tierIndex + 1,
            action: "search",
          },
          {
            jobId: `match:${rideStrId}:tier${tierIndex + 1}`,
            delay: TIER_EXPANSION_DELAY_MS,
            removeOnComplete: true,
            removeOnFail: true,
          }
        );
      }
    }
  } catch (err) {
    console.error(`[BullMQ:Matching] Tier ${tierIndex} error for ride ${rideStrId}:`, err.message);
  }
}

/**
 * Handles 2-minute search timeout: auto-cancels the ride with 'no_drivers_available' reason.
 */
async function handleRideSearchTimeout(rideId) {
  const rideStrId = rideId.toString();
  try {
    const ride = await Ride.findById(rideId);
    if (!ride || ride.status !== "requested") return;

    console.log(`[BullMQ:Timeout] ⏱️ 2-Minute search timeout reached for ride ${rideStrId}. Auto-cancelling...`);

    ride.status = "cancelled";
    ride.cancelledAt = new Date();
    ride.cancelledBy = "system";
    ride.feedback = "No drivers available nearby within search timeout";
    await ride.save();

    const io = getIO();
    if (io) {
      io.to(`ride:${rideStrId}`).emit(SOCKET_EVENTS.serverToClient.rideStatusUpdated, {
        event: SOCKET_EVENTS.serverToClient.rideStatusUpdated,
        rideId: rideStrId,
        status: "cancelled",
        cancelledBy: "system",
        reason: "no_drivers_available",
        message: "No drivers are currently available nearby. Please try again in a few moments or choose another vehicle type.",
        timestamp: new Date().toISOString(),
      });

      // Clear from driver available pools
      io.to("drivers").emit("ride_claimed", {
        rideId: rideStrId,
        status: "cancelled",
        timestamp: new Date().toISOString(),
      });
    }
  } catch (err) {
    console.error(`[BullMQ:Timeout] Failed to handle timeout for ride ${rideStrId}:`, err.message);
  }
}

/**
 * Cancels all pending BullMQ matching and timeout jobs for a ride.
 */
async function cancelExpandingSearch(rideId) {
  if (!rideId) return;
  const rideStrId = rideId.toString();

  try {
    const queue = initMatchingQueue();
    if (queue) {
      // Remove all tier jobs and timeout job
      for (let i = 0; i < MATCHING_RADIUS_TIERS.length; i++) {
        const job = await queue.getJob(`match:${rideStrId}:tier${i}`);
        if (job) await job.remove().catch(() => {});
      }
      const timeoutJob = await queue.getJob(`timeout:${rideStrId}`);
      if (timeoutJob) await timeoutJob.remove().catch(() => {});
    }
  } catch (err) {
    // Non-fatal
  }
}

module.exports = {
  startExpandingSearch,
  cancelExpandingSearch,
  initMatchingQueue,
};
