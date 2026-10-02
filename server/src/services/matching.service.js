const Driver = require("../models/Driver");
const redisService = require("./redis.service");
const { DRIVER_SEARCH_RADIUS_METERS, REDIS_KEYS } = require("../config/constants");
const { telemetry } = require("../utils/telemetry");

// $near returns results sorted nearest-first, so the first available driver
// within the radius is already the closest one — no in-memory sort needed.
//
// Two passes, real drivers first: scripts/seedDrivers.js's simulated
// drivers sit at fixed demo coordinates so a demo always has someone
// nearby, but that means a *real* driver testing/working from that same
// area is often equidistant with one of them — plain distance sorting has
// no reason to prefer either, and would sometimes silently hand the ride to
// a bot while a real driver's app never gets notified. Simulated drivers
// exist to stand in for a missing real driver (see
// driverSimulationService.js), not to compete with one who's actually
// there, so a real available driver in range always wins; the simulated
// pool is only consulted if that first pass finds nobody.
function getCompatibleVehicleTypes(requestedType = "car") {
  const t = (requestedType || "car").toLowerCase();
  if (t === "bike") return ["bike"];
  if (t === "auto") return ["auto"];
  return ["car", "sedan", "suv"];
}

async function findNearestAvailableDriverFromMongo(pickupCoordinates, vehicleType = "car") {
  const start = process.hrtime.bigint();
  const User = require("../models/User");
  const Vehicle = require("../models/Vehicle");
  const bcrypt = require("bcrypt");

  const compatibleTypes = getCompatibleVehicleTypes(vehicleType);
  const matchingVehicles = await Vehicle.find({ vehicleType: { $in: compatibleTypes } }).select("_id");
  const matchingVehicleIds = matchingVehicles.map((v) => v._id);

  const nearestReal = await Driver.findOne({
    status: "available",
    isSimulated: { $ne: true },
    vehicle: { $in: matchingVehicleIds },
    currentLocation: {
      $near: {
        $geometry: { type: "Point", coordinates: pickupCoordinates },
        $maxDistance: DRIVER_SEARCH_RADIUS_METERS,
      },
    },
  });

  let driver = nearestReal;
  if (!driver) {
    driver = await Driver.findOne({
      status: "available",
      isSimulated: true,
      vehicle: { $in: matchingVehicleIds },
      currentLocation: {
        $near: {
          $geometry: { type: "Point", coordinates: pickupCoordinates },
          $maxDistance: DRIVER_SEARCH_RADIUS_METERS,
        },
      },
    });
  }

  // If no driver found within search radius, find ANY available simulated driver of the matching vehicle type
  if (!driver) {
    const anySimulated = await Driver.findOne({
      status: "available",
      isSimulated: true,
      vehicle: { $in: matchingVehicleIds },
    });
    const [lon, lat] = pickupCoordinates;
    const offsetLon = lon + (Math.random() - 0.5) * 0.008;
    const offsetLat = lat + (Math.random() - 0.5) * 0.008;

    if (anySimulated) {
      anySimulated.currentLocation = {
        type: "Point",
        coordinates: [offsetLon, offsetLat],
      };
      await anySimulated.save();
      driver = anySimulated;
    } else {
      const targetVehicleType = compatibleTypes[0] || "car";
      const simEmail = `demo.driver.${targetVehicleType}@routex.demo`;
      let simUser = await User.findOne({ email: simEmail });
      if (!simUser) {
        const hashedPassword = await bcrypt.hash("Secret123!", 10);
        simUser = await User.create({
          name: targetVehicleType === "bike" ? "Rahul Bike Captain" : targetVehicleType === "auto" ? "Raju Auto Pilot" : "Vikram Sharma",
          email: simEmail,
          phone: targetVehicleType === "bike" ? "9876543211" : targetVehicleType === "auto" ? "9876543212" : "9876543210",
          password: hashedPassword,
          role: "driver",
        });
      }

      let simDriver = await Driver.findOne({ user: simUser._id });
      if (!simDriver) {
        simDriver = await Driver.create({
          user: simUser._id,
          status: "available",
          isSimulated: true,
          rating: 4.9,
          currentLocation: {
            type: "Point",
            coordinates: [offsetLon, offsetLat],
          },
        });
        const vehicle = await Vehicle.create({
          driver: simDriver._id,
          vehicleType: targetVehicleType,
          brand: targetVehicleType === "bike" ? "Honda" : targetVehicleType === "auto" ? "Bajaj" : "Hyundai",
          model: targetVehicleType === "bike" ? "Activa" : targetVehicleType === "auto" ? "Compact RE" : "Creta",
          registrationNumber: `TS09${targetVehicleType.toUpperCase().slice(0, 2)}9999`,
        });
        simDriver.vehicle = vehicle._id;
        await simDriver.save();
      } else {
        simDriver.status = "available";
        simDriver.currentLocation = {
          type: "Point",
          coordinates: [offsetLon, offsetLat],
        };
        await simDriver.save();
      }
      driver = simDriver;
    }
  }

  const end = process.hrtime.bigint();
  const durationMs = Number(end - start) / 1e6;
  telemetry.recordMatching({
    source: "mongo",
    durationMs,
    driverFound: Boolean(driver),
    coordinates: pickupCoordinates,
  });

  return driver;
}

// RouteX Fast-Path Driver Matching:
// Checks for available driver of the requested vehicleType.
async function findNearestAvailableDriver(pickupCoordinates, vehicleType = "car") {
  const [longitude, latitude] = pickupCoordinates;
  const start = process.hrtime.bigint();

  const nearestDriverId = await redisService.geoSearchNearest(
    REDIS_KEYS.driversGeoSet,
    longitude,
    latitude,
    DRIVER_SEARCH_RADIUS_METERS
  );

  if (nearestDriverId) {
    const Vehicle = require("../models/Vehicle");
    const compatibleTypes = getCompatibleVehicleTypes(vehicleType);
    const matchingVehicles = await Vehicle.find({ vehicleType: { $in: compatibleTypes } }).select("_id");
    const matchingVehicleIds = matchingVehicles.map((v) => v._id);

    const driver = await Driver.findOne({
      user: nearestDriverId,
      status: "available",
      vehicle: { $in: matchingVehicleIds },
    });

    if (driver) {
      const end = process.hrtime.bigint();
      const durationMs = Number(end - start) / 1e6;
      telemetry.recordMatching({
        source: "redis",
        durationMs,
        driverFound: true,
        coordinates: pickupCoordinates,
      });
      return driver;
    }
  }

  // Fallback to MongoDB
  return findNearestAvailableDriverFromMongo(pickupCoordinates, vehicleType);
}

module.exports = { findNearestAvailableDriver, findNearestAvailableDriverFromMongo, getCompatibleVehicleTypes };
