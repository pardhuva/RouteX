const mongoose = require("mongoose");
const SafetyAlert = require("../models/SafetyAlert");
const Ride = require("../models/Ride");
const User = require("../models/User");
const Driver = require("../models/Driver");
const ApiError = require("../utils/ApiError");
const redisService = require("./redis.service");
const kafkaProducer = require("./kafkaProducer");
const { getIO } = require("../config/socket");
const {
  KAFKA_TOPICS,
  RIDE_EVENT_TYPES,
  SOCKET_EVENTS,
  SAFETY_ALERT_STATUSES,
  REDIS_KEYS,
} = require("../config/constants");

/**
 * Rider Safety Monitoring & Check-In Service
 */

/**
 * Triggers a real-time safety alert for an active ride.
 * Concurrency-safe and idempotent: Returns existing active alert if already open.
 */
async function triggerSafetyAlert({ rideId, riderUser, alertType = "rider_unsafe", description = "" }) {
  if (!rideId || !mongoose.isValidObjectId(rideId)) {
    throw new ApiError(400, "Invalid ride ID");
  }

  const ride = await Ride.findById(rideId).populate("rider", "name email phone").populate("driver", "name email phone");
  if (!ride) {
    throw new ApiError(404, "Ride not found");
  }

  const riderId = ride.rider._id ? ride.rider._id.toString() : ride.rider.toString();
  if (riderId !== riderUser._id.toString()) {
    throw new ApiError(403, "You are not authorized to trigger safety alerts for this ride");
  }

  const activeStatuses = ["requested", "accepted", "started", "completed"];
  if (!activeStatuses.includes(ride.status)) {
    throw new ApiError(400, `Cannot trigger safety alert for a ride in ${ride.status} state.`);
  }

  // Check for existing active alert to ensure idempotency under rapid taps
  let existingAlert = await SafetyAlert.findOne({
    ride: ride._id,
    status: SAFETY_ALERT_STATUSES.active,
  }).populate("rider", "name email phone").populate("driver", "name email phone");

  if (existingAlert) {
    return existingAlert;
  }

  // Attempt to fetch current live location from Redis or fallback to ride/driver location
  let lastKnownLocation = null;
  try {
    const rawLoc = await redisService.get(REDIS_KEYS.rideDriverLocation(ride._id.toString()));
    if (rawLoc) {
      const parsed = JSON.parse(rawLoc);
      if (typeof parsed.longitude === "number" && typeof parsed.latitude === "number") {
        lastKnownLocation = {
          type: "Point",
          coordinates: [parsed.longitude, parsed.latitude],
        };
      }
    }
  } catch (e) {
    // Non-blocking fallback
  }

  if (!lastKnownLocation && ride.pickup?.location?.coordinates) {
    lastKnownLocation = {
      type: "Point",
      coordinates: ride.pickup.location.coordinates,
    };
  }

  // Atomic creation of new SafetyAlert
  const alert = await SafetyAlert.create({
    ride: ride._id,
    rider: riderUser._id,
    driver: ride.driver ? (ride.driver._id || ride.driver) : null,
    status: SAFETY_ALERT_STATUSES.active,
    alertType: ["rider_unsafe", "sos", "route_deviation"].includes(alertType) ? alertType : "rider_unsafe",
    description: typeof description === "string" ? description.trim().slice(0, 500) : "",
    lastKnownLocation,
  });

  const populatedAlert = await SafetyAlert.findById(alert._id)
    .populate("rider", "name email phone rating")
    .populate("driver", "name email phone")
    .populate("ride", "pickup destination status estimatedFare vehicleType createdAt");

  // Publish Kafka Event
  await kafkaProducer.publishEvent(KAFKA_TOPICS.rideEvents, RIDE_EVENT_TYPES.safetyAlertCreated, {
    alertId: populatedAlert._id.toString(),
    rideId: ride._id.toString(),
    riderId: riderUser._id.toString(),
    driverId: ride.driver ? (ride.driver._id || ride.driver).toString() : null,
    alertType: populatedAlert.alertType,
    status: populatedAlert.status,
    timestamp: populatedAlert.createdAt,
    lastKnownLocation,
  });

  // Real-time Socket.IO Broadcast to Admin Operations & Ride Room
  const io = getIO();
  if (io) {
    const payload = {
      alert: populatedAlert,
      rideId: ride._id.toString(),
      timestamp: new Date().toISOString(),
    };
    io.to("admins").to("admin:safety").emit(SOCKET_EVENTS.serverToClient.safetyAlertCreated, payload);
    io.to(`ride:${ride._id}`).emit(SOCKET_EVENTS.serverToClient.safetyAlertCreated, payload);
    console.log(`[Socket:Safety] Broadcasted safety alert for ride ${ride._id} to admin operations and ride room.`);
  }

  return populatedAlert;
}

/**
 * Rider confirms safe arrival at destination.
 */
async function confirmSafety({ rideId, riderUser }) {
  if (!rideId || !mongoose.isValidObjectId(rideId)) {
    throw new ApiError(400, "Invalid ride ID");
  }

  const ride = await Ride.findById(rideId);
  if (!ride) {
    throw new ApiError(404, "Ride not found");
  }

  const riderId = ride.rider.toString();
  if (riderId !== riderUser._id.toString()) {
    throw new ApiError(403, "You are not authorized to confirm safety for this ride");
  }

  const now = new Date();

  // Find any active or recent alert for this ride
  let alert = await SafetyAlert.findOne({
    ride: ride._id,
    status: SAFETY_ALERT_STATUSES.active,
  });

  if (alert) {
    alert.safeConfirmationAt = now;
    alert.status = SAFETY_ALERT_STATUSES.resolved;
    alert.resolutionNotes = alert.resolutionNotes
      ? `${alert.resolutionNotes} | Rider confirmed safe arrival.`
      : "Rider confirmed safe arrival at destination.";
    alert.resolvedAt = now;
    await alert.save();
  } else {
    // Create a resolved check-in confirmation log for permanent record
    alert = await SafetyAlert.create({
      ride: ride._id,
      rider: riderUser._id,
      driver: ride.driver || null,
      status: SAFETY_ALERT_STATUSES.resolved,
      alertType: "rider_unsafe",
      safeConfirmationAt: now,
      resolvedAt: now,
      resolutionNotes: "Rider confirmed safe arrival at destination.",
    });
  }

  const populatedAlert = await SafetyAlert.findById(alert._id)
    .populate("rider", "name email phone")
    .populate("driver", "name email phone")
    .populate("ride", "pickup destination status estimatedFare");

  // Publish Kafka Event
  await kafkaProducer.publishEvent(KAFKA_TOPICS.rideEvents, RIDE_EVENT_TYPES.safetyConfirmed, {
    alertId: alert._id.toString(),
    rideId: ride._id.toString(),
    riderId: riderUser._id.toString(),
    confirmedAt: now,
  });

  // Socket.IO Broadcast
  const io = getIO();
  if (io) {
    const payload = {
      alert: populatedAlert,
      rideId: ride._id.toString(),
      confirmedAt: now.toISOString(),
    };
    io.to("admins").to("admin:safety").emit(SOCKET_EVENTS.serverToClient.safetyConfirmationUpdated, payload);
    io.to(`ride:${ride._id}`).emit(SOCKET_EVENTS.serverToClient.safetyConfirmationUpdated, payload);
    console.log(`[Socket:Safety] Rider safe check-in confirmed for ride ${ride._id}`);
  }

  return populatedAlert;
}

/**
 * Admin retrieves paginated safety alerts.
 */
async function getSafetyAlertsForAdmin({ status, page = 1, limit = 20 }) {
  const query = {};
  if (status && ["active", "resolved", "follow_up"].includes(status)) {
    query.status = status;
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  const [alerts, total] = await Promise.all([
    SafetyAlert.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate("rider", "name email phone")
      .populate("driver", "name email phone")
      .populate("resolvedBy", "name email")
      .populate("ride", "pickup destination status estimatedFare fare vehicleType createdAt startedAt completedAt")
      .lean(),
    SafetyAlert.countDocuments(query),
  ]);

  const activeCount = await SafetyAlert.countDocuments({ status: SAFETY_ALERT_STATUSES.active });

  return {
    alerts,
    activeCount,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      pages: Math.ceil(total / limitNum) || 1,
    },
  };
}

/**
 * Admin retrieves a specific safety alert by ID.
 */
async function getSafetyAlertById(alertId) {
  if (!alertId || !mongoose.isValidObjectId(alertId)) {
    throw new ApiError(400, "Invalid alert ID");
  }

  const alert = await SafetyAlert.findById(alertId)
    .populate("rider", "name email phone rating totalRatings")
    .populate("driver", "name email phone rating totalRatings")
    .populate("resolvedBy", "name email")
    .populate("ride")
    .lean();

  if (!alert) {
    throw new ApiError(404, "Safety alert not found");
  }

  // Attempt to fetch fresh driver live location if ride is active
  if (alert.ride && ["accepted", "started"].includes(alert.ride.status)) {
    try {
      const rawLoc = await redisService.get(REDIS_KEYS.rideDriverLocation(alert.ride._id.toString()));
      if (rawLoc) {
        const parsed = JSON.parse(rawLoc);
        alert.liveDriverLocation = parsed;
      }
    } catch (e) {}
  }

  return alert;
}

/**
 * Admin updates / resolves a safety alert.
 */
async function resolveSafetyAlert(alertId, adminUser, { status = "resolved", resolutionNotes = "" }) {
  if (!alertId || !mongoose.isValidObjectId(alertId)) {
    throw new ApiError(400, "Invalid alert ID");
  }

  const alert = await SafetyAlert.findById(alertId);
  if (!alert) {
    throw new ApiError(404, "Safety alert not found");
  }

  const targetStatus = ["resolved", "follow_up", "active"].includes(status) ? status : "resolved";
  alert.status = targetStatus;
  alert.resolvedAt = targetStatus === "resolved" ? new Date() : alert.resolvedAt;
  alert.resolvedBy = adminUser._id;
  if (resolutionNotes) {
    alert.resolutionNotes = resolutionNotes.trim();
  }

  await alert.save();

  const populated = await SafetyAlert.findById(alert._id)
    .populate("rider", "name email phone")
    .populate("driver", "name email phone")
    .populate("resolvedBy", "name email")
    .populate("ride", "pickup destination status estimatedFare");

  // Publish Kafka Event
  await kafkaProducer.publishEvent(KAFKA_TOPICS.rideEvents, RIDE_EVENT_TYPES.safetyResolved, {
    alertId: alert._id.toString(),
    rideId: alert.ride ? alert.ride.toString() : null,
    resolvedBy: adminUser._id.toString(),
    status: alert.status,
    resolutionNotes: alert.resolutionNotes,
    resolvedAt: alert.resolvedAt,
  });

  // Socket.IO Broadcast
  const io = getIO();
  if (io) {
    const payload = {
      alert: populated,
      rideId: alert.ride ? alert.ride.toString() : null,
      resolvedAt: new Date().toISOString(),
    };
    io.to("admins").to("admin:safety").emit(SOCKET_EVENTS.serverToClient.safetyAlertUpdated, payload);
    if (alert.ride) {
      io.to(`ride:${alert.ride}`).emit(SOCKET_EVENTS.serverToClient.safetyAlertUpdated, payload);
    }
  }

  return populated;
}

/**
 * Retrieves current safety alert status for a given ride ID.
 */
async function getRideSafetyStatus(rideId, requestingUser) {
  if (!rideId || !mongoose.isValidObjectId(rideId)) {
    throw new ApiError(400, "Invalid ride ID");
  }

  const ride = await Ride.findById(rideId);
  if (!ride) {
    throw new ApiError(404, "Ride not found");
  }

  const riderId = ride.rider.toString();
  const driverId = ride.driver ? ride.driver.toString() : null;
  const requesterId = requestingUser._id.toString();
  const isAdmin = requestingUser.role === "admin";

  if (requesterId !== riderId && requesterId !== driverId && !isAdmin) {
    throw new ApiError(403, "You are not authorized to view safety status for this ride");
  }

  const activeAlert = await SafetyAlert.findOne({
    ride: ride._id,
    status: SAFETY_ALERT_STATUSES.active,
  }).sort({ createdAt: -1 });

  const latestAlert = activeAlert || (await SafetyAlert.findOne({ ride: ride._id }).sort({ createdAt: -1 }));

  return {
    hasActiveAlert: Boolean(activeAlert),
    activeAlert: activeAlert || null,
    latestAlert: latestAlert || null,
    safeConfirmationAt: latestAlert?.safeConfirmationAt || null,
  };
}

module.exports = {
  triggerSafetyAlert,
  confirmSafety,
  getSafetyAlertsForAdmin,
  getSafetyAlertById,
  resolveSafetyAlert,
  getRideSafetyStatus,
};
