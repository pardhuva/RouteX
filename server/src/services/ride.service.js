const mongoose = require("mongoose");
const Ride = require("../models/Ride");
const Driver = require("../models/Driver");
const ApiError = require("../utils/ApiError");
const matchingService = require("./matching.service");
const dynamicMatchingService = require("./dynamicMatching.service");
const driverService = require("./driver.service");
const driverSimulationService = require("./driverSimulationService");
const kafkaProducer = require("./kafkaProducer");
const { notifyMatchedDriver } = require("../consumers/rideEventConsumer");
const { KAFKA_TOPICS, RIDE_EVENT_TYPES, DRIVER_SEARCH_RADIUS_METERS } = require("../config/constants");

// Reserved for future days (driver acceptance, cancellation endpoints, etc.)
// so the valid-transition map lives in one place from Day 1 onward.
const VALID_TRANSITIONS = {
  requested: ["accepted", "cancelled"],
  accepted: ["started", "cancelled"],
  started: ["completed"],
  completed: [],
  cancelled: [],
};

function assertValidTransition(currentStatus, nextStatus) {
  const allowed = VALID_TRANSITIONS[currentStatus] || [];
  if (!allowed.includes(nextStatus)) {
    throw new ApiError(400, `Cannot transition ride from '${currentStatus}' to '${nextStatus}'`);
  }
}

const User = require("../models/User");

async function createRide(riderId, { pickup, destination, vehicleType = "car", estimatedFare = null }) {
  const rider = await User.findById(riderId);
  if (rider?.outstandingDebt && rider.outstandingDebt > 0) {
    throw new ApiError(
      402,
      `You have an outstanding unpaid balance of ₹${rider.outstandingDebt} from a previous trip. Please clear your dues before booking a new ride.`
    );
  }

  const otp = String(Math.floor(1000 + Math.random() * 9000));
  const ride = await Ride.create({
    rider: riderId,
    driver: null,
    pickup,
    destination,
    vehicleType,
    estimatedFare,
    status: "requested",
    otp,
  });
  console.log(`[Ride] Created: ${ride._id} — vehicle: ${vehicleType} — status: REQUESTED — OTP PIN: ${otp}`);

  await kafkaProducer.publishEvent(KAFKA_TOPICS.rideEvents, RIDE_EVENT_TYPES.requested, {
    rideId: ride._id.toString(),
    riderId: riderId.toString(),
    driverId: null,
    matchedDriverId: null,
  });

  // Start background dynamic expanding radius matching (3km -> 7km -> 15km)
  dynamicMatchingService.startExpandingSearch(ride._id, pickup.location.coordinates, vehicleType).catch((err) => {
    console.warn("[Ride] Expanding matching error:", err.message);
  });

  return populateRide(ride._id);
}

// .lean() because this is purely a read path — every caller only ever
// serializes the result into a JSON response, never re-saves it (mutations
// happen on the separate, non-lean documents fetched inside each
// transition function above). That makes it safe to bolt extra fields onto
// the plain object below, which a real Mongoose document's schema-bound
// toJSON would otherwise silently drop.
async function populateRide(rideId) {
  const ride = await Ride.findById(rideId)
    .populate("rider", "-password")
    .populate("driver", "-password")
    .populate("matchedDriver", "-password")
    .lean();

  // Ride only references the driver's User account (name/phone) — vehicle
  // and rating live on the separate Driver/Vehicle documents (see
  // models/Driver.js, models/Vehicle.js). Attached here, once, so every
  // caller (createRide, acceptRide, getRideById, ...) gets the same shape
  // without duplicating this lookup at each call site.
  if (ride && ride.driver) {
    const [driverProfile, completedTripsCount] = await Promise.all([
      Driver.findOne({ user: ride.driver._id })
        .select("rating totalRatings")
        .populate("vehicle")
        .lean(),
      Ride.countDocuments({ driver: ride.driver._id, status: "completed" }),
    ]);

    if (driverProfile) {
      ride.driver = {
        ...ride.driver,
        rating: driverProfile.rating || 0,
        totalRatings: driverProfile.totalRatings || 0,
        completedTrips: completedTripsCount || 0,
        vehicle: driverProfile.vehicle,
      };
    }
  }

  // Ensure ride always has an OTP PIN
  if (ride && !ride.otp) {
    const fallbackOtp = String((parseInt(ride._id.toString().slice(-4), 16) % 9000) + 1000);
    ride.otp = fallbackOtp;
    Ride.updateOne({ _id: rideId, otp: null }, { $set: { otp: fallbackOtp } }).catch(() => {});
  }

  return ride;
}

async function getRideById(rideId, requestingUser) {
  const ride = await populateRide(rideId);

  if (!ride) {
    throw new ApiError(404, "Ride not found");
  }

  const riderId = ride.rider._id ? ride.rider._id.toString() : ride.rider.toString();
  const driverId = ride.driver ? (ride.driver._id ? ride.driver._id.toString() : ride.driver.toString()) : null;
  const requesterId = requestingUser._id.toString();
  const isAdmin = requestingUser.role === "admin";

  if (requesterId !== riderId && requesterId !== driverId && !isAdmin) {
    throw new ApiError(403, "You are not authorized to view this ride");
  }

  // Security: The driver should NOT see the OTP ahead of time while ride is still in 'accepted' status
  if (requesterId === driverId && ride.status === "accepted" && !isAdmin) {
    delete ride.otp;
  }

  return ride;
}

async function runWithTransactionOrFallback(workFn) {
  let session = null;
  try {
    session = await mongoose.startSession();
    let result;
    await session.withTransaction(async () => {
      result = await workFn(session);
    });
    return result;
  } catch (err) {
    const isReplicaSetError =
      err?.code === 20 ||
      err?.codeName === "IllegalOperation" ||
      err?.message?.includes("replica set") ||
      err?.message?.includes("Transaction numbers are only allowed on a replica set member or mongos");

    if (isReplicaSetError) {
      return await workFn(null);
    }
    throw err;
  } finally {
    if (session) {
      await session.endSession().catch(() => {});
    }
  }
}

async function acceptRide(rideId, driverUser) {
  const existingRide = await Ride.findById(rideId);
  if (!existingRide) {
    throw new ApiError(404, "Ride not found");
  }

  if (existingRide.status !== "requested") {
    throw new ApiError(409, "This ride request is no longer available or was already cancelled.");
  }

  const cachedStatus = await driverService.getDriverStatus(driverUser._id);
  if (cachedStatus !== "available") {
    const reason = cachedStatus === "busy" ? "Driver is already busy" : "Driver must be available to accept rides";
    throw new ApiError(409, reason);
  }

  const driver = await Driver.findOne({ user: driverUser._id });
  if (!driver) {
    throw new ApiError(404, "Driver profile not found");
  }

  let ride;
  let claimedDriverForCache;
  await runWithTransactionOrFallback(async (session) => {
    const sessionOpt = session ? { session } : {};
    ride = await Ride.findOneAndUpdate(
      { _id: rideId, status: "requested" },
      { $set: { driver: driverUser._id, status: "accepted", acceptedAt: new Date() } },
      { new: true, ...sessionOpt }
    );
    if (!ride) {
      throw new ApiError(409, "This ride was already accepted by another driver or cancelled.");
    }

    const claimedDriver = await Driver.findOneAndUpdate(
      { _id: driver._id, status: "available" },
      { $set: { status: "busy" } },
      { new: true, ...sessionOpt }
    );
    if (!claimedDriver) {
      throw new ApiError(409, "Driver is already busy");
    }

    claimedDriverForCache = claimedDriver;
  });

  await driverService.syncStatusCache(claimedDriverForCache);
  dynamicMatchingService.cancelExpandingSearch(rideId);

  console.log(`[Ride] Driver accepted: ${ride._id} — driver ${driverUser._id} — status changed: ACCEPTED`);

  await kafkaProducer.publishEvent(KAFKA_TOPICS.rideEvents, RIDE_EVENT_TYPES.accepted, {
    rideId: ride._id.toString(),
    riderId: existingRide.rider.toString(),
    driverId: driverUser._id.toString(),
  });
  console.log(`[Socket] Notifying rider ${existingRide.rider} of acceptance (via ride:${ride._id} room)`);

  return populateRide(ride._id);
}

async function startRide(rideId, driverUser, submittedOtp) {
  const ride = await Ride.findById(rideId);
  if (!ride) {
    throw new ApiError(404, "Ride not found");
  }

  if (!ride.driver || ride.driver.toString() !== driverUser._id.toString()) {
    throw new ApiError(403, "You are not the assigned driver for this ride");
  }

  if (ride.status !== "accepted") {
    throw new ApiError(400, "This ride cannot be started because it is not in accepted status.");
  }

  // Validate Start Trip PIN / OTP
  if (ride.otp) {
    if (!submittedOtp || String(submittedOtp).trim() !== String(ride.otp).trim()) {
      throw new ApiError(400, "Invalid Start PIN. Please ask the passenger for the 4-digit OTP displayed on their screen.");
    }
  }

  ride.status = "started";
  ride.startedAt = new Date();
  await ride.save();

  await kafkaProducer.publishEvent(KAFKA_TOPICS.rideEvents, RIDE_EVENT_TYPES.started, {
    rideId: ride._id.toString(),
    riderId: ride.rider.toString(),
    driverId: driverUser._id.toString(),
  });

  return populateRide(ride._id);
}

async function completeRide(rideId, driverUser) {
  const ride = await Ride.findById(rideId);
  if (!ride) {
    throw new ApiError(404, "Ride not found");
  }

  if (!ride.driver || ride.driver.toString() !== driverUser._id.toString()) {
    throw new ApiError(403, "You are not the assigned driver for this ride");
  }

  if (ride.status !== "started") {
    throw new ApiError(400, "This ride cannot be completed because it is not currently in progress.");
  }

  const driver = await Driver.findOne({ user: driverUser._id });
  if (!driver) {
    throw new ApiError(404, "Driver profile not found");
  }

  await runWithTransactionOrFallback(async (session) => {
    const sessionOpt = session ? { session } : {};
    ride.status = "completed";
    ride.completedAt = new Date();
    await ride.save(sessionOpt);

    driver.status = "available";
    await driver.save(sessionOpt);
  });

  await driverService.syncStatusCache(driver);
  await matchWaitingRideToDriver(driver);

  await kafkaProducer.publishEvent(KAFKA_TOPICS.rideEvents, RIDE_EVENT_TYPES.completed, {
    rideId: ride._id.toString(),
    riderId: ride.rider.toString(),
    driverId: driverUser._id.toString(),
  });

  return populateRide(ride._id);
}

async function cancelRide(rideId, user) {
  const ride = await Ride.findById(rideId);
  if (!ride) {
    throw new ApiError(404, "Ride not found");
  }

  const requesterId = user._id.toString();
  const isRider = ride.rider.toString() === requesterId;
  const isAssignedDriver = Boolean(ride.driver) && ride.driver.toString() === requesterId;

  if (!isRider && !isAssignedDriver) {
    throw new ApiError(403, "You are not authorized to cancel this ride");
  }

  if (ride.status !== "requested" && ride.status !== "accepted") {
    if (ride.status === "cancelled") {
      throw new ApiError(400, "This ride has already been cancelled.");
    }
    if (ride.status === "completed") {
      throw new ApiError(400, "This ride is already completed and cannot be cancelled.");
    }
    throw new ApiError(400, "This ride cannot be cancelled in its current status.");
  }

  const assignedDriverId = ride.status === "accepted" ? ride.driver : null;

  let freedDriverForCache = null;
  await runWithTransactionOrFallback(async (session) => {
    const sessionOpt = session ? { session } : {};
    ride.status = "cancelled";
    ride.cancelledAt = new Date();
    ride.cancelledBy = isRider ? "rider" : "driver";
    await ride.save(sessionOpt);

    if (assignedDriverId) {
      let driverQuery = Driver.findOne({ user: assignedDriverId });
      if (session) {
        driverQuery = driverQuery.session(session);
      }
      const driver = await driverQuery;
      if (driver) {
        driver.status = "available";
        await driver.save(sessionOpt);
        freedDriverForCache = driver;
      }
    }
  });

  if (freedDriverForCache) {
    await driverService.syncStatusCache(freedDriverForCache);
    await matchWaitingRideToDriver(freedDriverForCache);
  }

  dynamicMatchingService.cancelExpandingSearch(rideId);

  await kafkaProducer.publishEvent(KAFKA_TOPICS.rideEvents, RIDE_EVENT_TYPES.cancelled, {
    rideId: ride._id.toString(),
    riderId: ride.rider.toString(),
    driverId: assignedDriverId ? assignedDriverId.toString() : null,
    cancelledBy: ride.cancelledBy,
  });

  return populateRide(ride._id);
}

// Matching (createRide) only ever runs once, at request time — if nobody
// was available then, the ride just sits at "requested" with no
// matchedDriver forever, even if a driver frees up moments later. This
// closes that gap from the other direction: called whenever a driver
// transitions to "available" (see driver.controller.js#updateStatus,
// and completeRide/cancelRide below), it looks for the single oldest
// still-unmatched waiting ride within range and, if one exists, matches
// this driver to it exactly the way createRide would have if the timing
// had lined up — same notification, same simulated-acceptance hookup.
//
// findOneAndUpdate's filter re-checks status/matchedDriver atomically at
// write time, the same race-safety idea as acceptRide: if two drivers
// become available in the same instant, only one of them can claim any
// given waiting ride.
async function matchWaitingRideToDriver(driverDoc) {
  if (!driverDoc || driverDoc.status !== "available") return;

  const [longitude, latitude] = driverDoc.currentLocation?.coordinates || [0, 0];
  if (longitude === 0 && latitude === 0) return; // no real location on record yet

  const ride = await Ride.findOneAndUpdate(
    {
      status: "requested",
      matchedDriver: null,
      "pickup.location": {
        $near: {
          $geometry: { type: "Point", coordinates: [longitude, latitude] },
          $maxDistance: DRIVER_SEARCH_RADIUS_METERS,
        },
      },
    },
    { $set: { matchedDriver: driverDoc.user } },
    { new: true }
  );

  if (!ride) return;

  console.log(`[Ride] Late-matched waiting ride ${ride._id} to newly available driver ${driverDoc.user}`);

  await notifyMatchedDriver({
    data: { rideId: ride._id.toString(), matchedDriverId: driverDoc.user.toString() },
  });

  if (driverDoc.isSimulated) {
    driverSimulationService.scheduleSimulatedAcceptance(ride._id, driverDoc.user);
  }
}

async function getMyRides(user, { page, limit } = {}) {
  const filter = user.role === "driver" ? { driver: user._id } : { rider: user._id };

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));

  const [rides, totalCount] = await Promise.all([
    Ride.find(filter)
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .populate("rider", "-password")
      .populate("driver", "-password"),
    Ride.countDocuments(filter),
  ]);

  return {
    rides,
    pagination: {
      page: pageNum,
      limit: limitNum,
      totalCount,
      totalPages: Math.max(1, Math.ceil(totalCount / limitNum)),
    },
  };
}

async function getAvailableRides(driverUser) {
  const driver = await Driver.findOne({ user: driverUser._id }).populate("vehicle");
  const coords = driver?.currentLocation?.coordinates;
  const driverVehicleType = driver?.vehicle?.vehicleType || "car";

  let compatibleRideTypes = [];
  if (driverVehicleType === "bike") {
    compatibleRideTypes = ["bike"];
  } else if (driverVehicleType === "auto") {
    compatibleRideTypes = ["auto"];
  } else {
    compatibleRideTypes = ["car", "sedan", "suv", "go", "ev"];
  }

  let rides = [];
  if (coords && (coords[0] !== 0 || coords[1] !== 0)) {
    try {
      // Find requested rides matching vehicle type within their active dynamic search radius
      const candidateRides = await Ride.find({
        status: "requested",
        vehicleType: { $in: compatibleRideTypes },
        "pickup.location": {
          $near: {
            $geometry: { type: "Point", coordinates: coords },
            $maxDistance: DRIVER_SEARCH_RADIUS_METERS,
          },
        },
      })
        .limit(30)
        .populate("rider", "name phone")
        .lean();

      // Only include rides whose current dynamic expanding radius actually reaches this driver
      const { calculateDistanceKm } = require("../utils/geo");
      rides = candidateRides.filter((r) => {
        const pCoords = r.pickup?.location?.coordinates;
        if (!pCoords || !coords) return false;
        const distKm = calculateDistanceKm(coords[1], coords[0], pCoords[1], pCoords[0]);
        const maxRadiusKm = (r.searchRadiusMeters || 3000) / 1000;
        return distKm <= maxRadiusKm;
      });
    } catch (e) {
      console.warn("[RideService] Geospatial search error in getAvailableRides:", e.message);
    }
  }

  return rides;
}

async function rateDriver(rideId, riderUser, { rating, feedback }) {
  const numRating = Number(rating);
  if (!numRating || numRating < 1 || numRating > 5 || !Number.isInteger(numRating)) {
    throw new ApiError(400, "Rating must be an integer between 1 and 5 stars");
  }

  const ride = await Ride.findById(rideId);
  if (!ride) {
    throw new ApiError(404, "Ride not found");
  }

  const riderId = ride.rider._id ? ride.rider._id.toString() : ride.rider.toString();
  if (riderId !== riderUser._id.toString()) {
    throw new ApiError(403, "Only the passenger who booked this ride can submit a rating");
  }

  if (ride.status !== "completed") {
    throw new ApiError(400, "You can only rate a driver after the ride has been completed");
  }

  if (ride.rating) {
    throw new ApiError(400, "You have already submitted a rating for this trip");
  }

  if (!ride.driver) {
    throw new ApiError(400, "No driver was assigned to this ride");
  }

  let updatedRide;
  await runWithTransactionOrFallback(async (session) => {
    const sessionOpt = session ? { session } : {};
    ride.rating = numRating;
    ride.feedback = feedback ? String(feedback).trim().slice(0, 500) : null;
    ride.ratedAt = new Date();
    await ride.save(sessionOpt);

    let driverQuery = Driver.findOne({ user: ride.driver });
    if (session) {
      driverQuery = driverQuery.session(session);
    }
    const driverDoc = await driverQuery;

    if (driverDoc) {
      const currentTotal = driverDoc.totalRatings || 0;
      const currentAvg = driverDoc.rating || 0;
      const newTotal = currentTotal + 1;
      const newAvg = currentTotal === 0 ? numRating : (currentAvg * currentTotal + numRating) / newTotal;
      driverDoc.rating = Math.round(newAvg * 10) / 10;
      driverDoc.totalRatings = newTotal;
      await driverDoc.save(sessionOpt);
    }

    updatedRide = ride;
  });

  return populateRide(updatedRide._id);
}

module.exports = {
  createRide,
  getRideById,
  getMyRides,
  getAvailableRides,
  acceptRide,
  startRide,
  completeRide,
  cancelRide,
  rateDriver,
  matchWaitingRideToDriver,
  assertValidTransition,
  VALID_TRANSITIONS,
};
