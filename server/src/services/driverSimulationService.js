const User = require("../models/User");
const Ride = require("../models/Ride");

// Demo/portfolio feature only: RouteX's real matching (matching.service.js)
// only ever notifies one driver — it was designed assuming a real driver's
// app would be open to receive that notification and tap Accept. Without a
// second (real) driver session running, a ride would sit at "requested"
// forever. This service stands in for that missing real driver end-to-end
// (accept -> start -> complete) but only for drivers seeded by
// scripts/seedDrivers.js (Driver.isSimulated) — a real driver who happens to
// be the nearest match is never auto-progressed on their behalf, they keep
// the normal manual flow throughout. Swapping this file out (or just not
// seeding simulated drivers) is all it takes to go back to a fully
// real-driver-only setup later.
const ACCEPT_MIN_MS = 2000;
const ACCEPT_MAX_MS = 5000;
// "Driver is on the way to pickup" - shorter than the ride itself.
const START_MIN_MS = 3000;
const START_MAX_MS = 6000;
// "Ride in progress" - the longest stage, so a demo still has a moment to
// watch the "in progress" state before it completes.
const COMPLETE_MIN_MS = 8000;
const COMPLETE_MAX_MS = 15000;

function randomDelay(min, max) {
  return min + Math.random() * (max - min);
}

function scheduleSimulatedAcceptance(rideId, driverUserId) {
  const delay = randomDelay(ACCEPT_MIN_MS, ACCEPT_MAX_MS);
  console.log(`[Simulation] Driver ${driverUserId} will respond to ride ${rideId} in ~${Math.round(delay / 1000)}s`);

  setTimeout(() => {
    runSimulatedAcceptance(rideId, driverUserId).catch((err) => {
      console.warn(`[Simulation] Auto-accept failed for ride ${rideId}:`, err.message);
    });
  }, delay);
}

function simulateMovement(rideId, driverUserId, fromCoords, toCoords, durationMs) {
  if (!fromCoords || !toCoords) return;
  const { getIO } = require("../config/socket");
  const driverService = require("./driver.service");

  const steps = 8;
  const intervalMs = Math.max(600, Math.floor(durationMs / steps));
  let step = 0;

  const timer = setInterval(async () => {
    step++;
    const fraction = Math.min(1, step / steps);
    const lon = fromCoords[0] + (toCoords[0] - fromCoords[0]) * fraction;
    const lat = fromCoords[1] + (toCoords[1] - fromCoords[1]) * fraction;

    try {
      await driverService.updateLiveLocation(rideId, { latitude: lat, longitude: lon });
      const io = getIO();
      if (io) {
        io.to(`ride:${rideId}`).emit("driver_location_updated", {
          event: "driver_location_updated",
          rideId: String(rideId),
          driverId: String(driverUserId),
          location: { latitude: lat, longitude: lon },
          timestamp: new Date().toISOString(),
        });
      }
    } catch (err) {}

    if (step >= steps) {
      clearInterval(timer);
    }
  }, intervalMs);
}

async function runSimulatedAcceptance(rideId, driverUserId) {
  const ride = await Ride.findById(rideId);
  if (!ride || ride.status !== "requested") {
    console.log(`[Simulation] Ride ${rideId} is no longer requested (status: ${ride?.status ?? "not found"}) — skipping accept`);
    return;
  }

  const driverUser = await User.findById(driverUserId);
  if (!driverUser) {
    console.warn(`[Simulation] Simulated driver ${driverUserId} not found — skipping accept`);
    return;
  }

  const Driver = require("../models/Driver");
  const driverDoc = await Driver.findOne({ user: driverUserId });
  const driverStartCoords = driverDoc?.currentLocation?.coordinates || [
    ride.pickup.location.coordinates[0] - 0.005,
    ride.pickup.location.coordinates[1] - 0.005,
  ];

  const rideService = require("./ride.service");
  await rideService.acceptRide(rideId, driverUser);
  console.log(`[Simulation] Driver ${driverUserId} auto-accepted ride ${rideId}`);

  const startDelay = randomDelay(START_MIN_MS, START_MAX_MS);
  simulateMovement(rideId, driverUserId, driverStartCoords, ride.pickup.location.coordinates, startDelay);

  scheduleSimulatedStart(rideId, driverUser, startDelay);
}

function scheduleSimulatedStart(rideId, driverUser, delay) {
  const waitMs = delay || randomDelay(START_MIN_MS, START_MAX_MS);
  console.log(`[Simulation] Driver ${driverUser._id} will start ride ${rideId} in ~${Math.round(waitMs / 1000)}s`);

  setTimeout(() => {
    runSimulatedStart(rideId, driverUser).catch((err) => {
      console.warn(`[Simulation] Auto-start failed for ride ${rideId}:`, err.message);
    });
  }, waitMs);
}

async function runSimulatedStart(rideId, driverUser) {
  const ride = await Ride.findById(rideId);
  if (!ride || ride.status !== "accepted" || String(ride.driver) !== String(driverUser._id)) {
    console.log(`[Simulation] Ride ${rideId} is no longer this driver's accepted ride — skipping start`);
    return;
  }

  const rideService = require("./ride.service");
  await rideService.startRide(rideId, driverUser);
  console.log(`[Simulation] Driver ${driverUser._id} auto-started ride ${rideId}`);

  const completeDelay = randomDelay(COMPLETE_MIN_MS, COMPLETE_MAX_MS);
  simulateMovement(rideId, driverUser._id, ride.pickup.location.coordinates, ride.destination.location.coordinates, completeDelay);

  scheduleSimulatedComplete(rideId, driverUser, completeDelay);
}

function scheduleSimulatedComplete(rideId, driverUser, delay) {
  const waitMs = delay || randomDelay(COMPLETE_MIN_MS, COMPLETE_MAX_MS);
  console.log(`[Simulation] Driver ${driverUser._id} will complete ride ${rideId} in ~${Math.round(waitMs / 1000)}s`);

  setTimeout(() => {
    runSimulatedComplete(rideId, driverUser).catch((err) => {
      console.warn(`[Simulation] Auto-complete failed for ride ${rideId}:`, err.message);
    });
  }, waitMs);
}

async function runSimulatedComplete(rideId, driverUser) {
  const ride = await Ride.findById(rideId).select("status driver");
  if (!ride || ride.status !== "started" || String(ride.driver) !== String(driverUser._id)) {
    console.log(`[Simulation] Ride ${rideId} is no longer this driver's started ride — skipping complete`);
    return;
  }

  const rideService = require("./ride.service");
  await rideService.completeRide(rideId, driverUser);
  console.log(`[Simulation] Driver ${driverUser._id} auto-completed ride ${rideId}`);
}

module.exports = { scheduleSimulatedAcceptance };
