const { kafka } = require("../config/kafka");
const { KAFKA_TOPICS, KAFKA_CONSUMER_GROUP, RIDE_EVENT_TYPES, SOCKET_EVENTS } = require("../config/constants");
const { getIO } = require("../config/socket");
const Ride = require("../models/Ride");
const { telemetry } = require("../utils/telemetry");

const consumer = kafka.consumer({ groupId: KAFKA_CONSUMER_GROUP });
let isConsumerRunning = false;

async function startRideEventConsumer() {
  try {
    await consumer.connect();
    // fromBeginning: false — a consumer (re)starting only sees events
    // produced from now on, not the topic's full history. That's a
    // deliberate Kafka default worth understanding: unlike a database read,
    // "subscribe" doesn't hand you everything that ever happened, only what
    // arrives while you're listening (plus whatever this consumer group's
    // committed offset hasn't caught up to yet, if it has run before).
    await consumer.subscribe({ topic: KAFKA_TOPICS.rideEvents, fromBeginning: false });

    await consumer.run({
      eachMessage: async ({ message }) => {
        // eachMessage must never throw: an uncaught error here stalls
        // consumer.run()'s internal loop, which would silently stop all
        // further event processing rather than just skipping one bad
        // message. handleMessage() is written so every failure path inside
        // it is caught and logged instead of propagated.
        await handleMessage(message);
      },
    });

    isConsumerRunning = true;
    console.log(`Ride event consumer started (group: ${KAFKA_CONSUMER_GROUP}, topic: ${KAFKA_TOPICS.rideEvents})`);
  } catch (err) {
    // Mirrors the producer/Redis pattern: a Kafka outage at startup means
    // the app runs without background event processing, not that it fails
    // to start. The REST API's own MongoDB-backed behavior is unaffected
    // either way — this consumer only demonstrates async processing on top
    // of state that already exists.
    isConsumerRunning = false;
    console.warn("Ride event consumer failed to start, continuing without event consumption:", err.message);
  }
}

// Day 5 scope: this consumer demonstrates asynchronous event processing by
// validating and logging each ride lifecycle event. It deliberately does
// NOT re-run ride.service.js's business logic or write back to MongoDB —
// MongoDB was already updated synchronously, before the event was even
// published (see ride.service.js's "database first, then publish"
// ordering). Duplicating that logic here would just be a second, poorer
// copy of the same business rules with no MongoDB transaction to protect it.
async function handleMessage(message) {
  const raw = message.value ? message.value.toString() : "";

  let event;
  try {
    event = JSON.parse(raw);
  } catch (err) {
    console.error("Event processing failed: malformed JSON, skipping message:", err.message);
    return;
  }

  if (!event || typeof event.eventType !== "string" || !event.eventId || !event.data) {
    console.error(
      "Event processing failed: event missing eventId/eventType/data, skipping message:",
      raw.slice(0, 200)
    );
    return;
  }

  console.log(`Event processing started: ${event.eventType} (${event.eventId})`);
  telemetry.recordKafkaEvent({
    eventType: event.eventType,
    eventTimestamp: event.timestamp,
  });

  try {
    const { rideId, riderId, driverId } = event.data;
    console.log(
      `Event processing completed: ${event.eventType} — ride ${rideId}, rider ${riderId}, driver ${driverId || "none"}`
    );

    // The one place Kafka (backend event transport) and Socket.IO (client
    // real-time delivery) meet. Kafka doesn't know or care whether anyone
    // is listening; io.to(room).emit() on a room nobody has joined yet
    // (e.g. right after ride.requested, before the rider's client has even
    // called join_ride) is simply a no-op, not an error.
    broadcastRideStatus(event);

    if (event.eventType === RIDE_EVENT_TYPES.requested && event.data.matchedDriverId) {
      await notifyMatchedDriver(event);
    }
  } catch (err) {
    console.error(`Event processing failed for ${event.eventType} (${event.eventId}):`, err.message);
  }
}

function broadcastRideStatus(event) {
  const io = getIO();
  if (!io) {
    console.warn(`Socket.IO not initialized yet — skipping real-time broadcast for ${event.eventType}`);
    return;
  }

  const { rideId } = event.data;
  const status = event.eventType.split(".")[1];

  io.to(`ride:${rideId}`).emit(SOCKET_EVENTS.serverToClient.rideStatusUpdated, {
    event: SOCKET_EVENTS.serverToClient.rideStatusUpdated,
    rideId,
    status,
    timestamp: event.timestamp,
  });

  // If a ride is accepted, cancelled, or completed, notify all drivers to remove it from their available pool
  if (status === "accepted" || status === "cancelled" || status === "completed") {
    io.to("drivers").emit("ride_claimed", {
      rideId,
      status,
      timestamp: event.timestamp,
    });
  }
}

const Driver = require("../models/Driver");
const Vehicle = require("../models/Vehicle");
const { DRIVER_SEARCH_RADIUS_METERS } = require("../config/constants");

function getCompatibleVehicleTypes(requestedType = "car") {
  const t = (requestedType || "car").toLowerCase();
  if (t === "bike") return ["bike"];
  if (t === "auto") return ["auto"];
  return ["car", "sedan", "suv"];
}

async function notifyMatchedDriver(event) {
  const io = getIO();
  if (!io) {
    console.warn("Socket.IO not initialized yet — skipping new-ride-request notification");
    return;
  }

  const { rideId, matchedDriverId } = event.data;

  const ride = await Ride.findById(rideId).populate("rider", "name phone");
  if (!ride || ride.status !== "requested") return;

  const payload = {
    rideId: ride._id.toString(),
    pickup: ride.pickup,
    destination: ride.destination,
    vehicleType: ride.vehicleType,
    rider: { name: ride.rider?.name, phone: ride.rider?.phone },
    fare: ride.grossFare || ride.fare,
    grossFare: ride.grossFare || ride.fare,
    driverEarnings: ride.driverEarnings || (ride.grossFare ? ride.grossFare * 0.8 : undefined),
    createdAt: ride.createdAt || new Date().toISOString(),
  };

  const pickupCoords = ride.pickup?.location?.coordinates;
  const notifiedDriverIds = new Set();

  // Find all available drivers strictly matching the requested vehicle type within 30km
  if (pickupCoords && (pickupCoords[0] !== 0 || pickupCoords[1] !== 0)) {
    try {
      const compatibleTypes = getCompatibleVehicleTypes(ride.vehicleType);
      const matchingVehicles = await Vehicle.find({ vehicleType: { $in: compatibleTypes } }).select("_id");
      const matchingVehicleIds = matchingVehicles.map((v) => v._id);

      const nearbyDrivers = await Driver.find({
        status: "available",
        vehicle: { $in: matchingVehicleIds },
        "currentLocation.coordinates": { $ne: [0, 0] },
        currentLocation: {
          $near: {
            $geometry: { type: "Point", coordinates: pickupCoords },
            $maxDistance: DRIVER_SEARCH_RADIUS_METERS, // 30,000 meters (30km)
          },
        },
      }).select("user");

      for (const driver of nearbyDrivers) {
        if (driver.user) {
          const uId = driver.user.toString();
          notifiedDriverIds.add(uId);
          io.to(`driver:${uId}`).emit(SOCKET_EVENTS.serverToClient.newRideRequest, payload);
        }
      }
    } catch (err) {
      console.warn("[RideEventConsumer] Geospatial search for nearby drivers failed:", err.message);
    }
  }

  // Also notify the specifically matched driver if not already notified
  if (matchedDriverId && !notifiedDriverIds.has(matchedDriverId.toString())) {
    io.to(`driver:${matchedDriverId}`).emit(SOCKET_EVENTS.serverToClient.newRideRequest, payload);
  }
}

async function stopRideEventConsumer() {
  if (!isConsumerRunning) return;
  try {
    await consumer.disconnect();
    isConsumerRunning = false;
    console.log("Ride event consumer stopped");
  } catch (err) {
    console.warn("Ride event consumer disconnect error:", err.message);
  }
}

// Exported so ride.service.js can reuse the exact same "push a new-ride
// notification to one driver" logic when it late-matches a ride to a driver
// who only became available after the ride was created (see
// matchWaitingRideToDriver) — rather than duplicating this lookup+emit here
// a second time.
async function handleDirectEvent(event) {
  try {
    broadcastRideStatus(event);
    if (event.eventType === RIDE_EVENT_TYPES.requested && event.data.matchedDriverId) {
      await notifyMatchedDriver(event);
    }
  } catch (err) {
    console.warn("[DirectEvent] Ride event broadcast error:", err.message);
  }
}

module.exports = {
  startRideEventConsumer,
  stopRideEventConsumer,
  notifyMatchedDriver,
  handleDirectEvent,
  isRideConsumerRunning: () => isConsumerRunning,
};
