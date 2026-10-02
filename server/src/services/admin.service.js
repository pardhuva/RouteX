const mongoose = require("mongoose");
const User = require("../models/User");
const Driver = require("../models/Driver");
const Ride = require("../models/Ride");
const Vehicle = require("../models/Vehicle");
const { DRIVER_COMMISSION_RATE } = require("../config/constants");

/**
 * Admin Executive Financial & Operations Engine
 */
async function getPlatformOverview() {
  const platformFeeRate = 1 - DRIVER_COMMISSION_RATE; // e.g. 0.20 (20%)

  // 1. Ride statistics and gross volume aggregation
  const [rideStats] = await Ride.aggregate([
    {
      $facet: {
        totals: [
          {
            $group: {
              _id: null,
              totalRides: { $sum: 1 },
              completedRides: {
                $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
              },
              activeRides: {
                $sum: { $cond: [{ $in: ["$status", ["accepted", "started"]] }, 1, 0] },
              },
              requestedRides: {
                $sum: { $cond: [{ $eq: ["$status", "requested"] }, 1, 0] },
              },
              cancelledRides: {
                $sum: { $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0] },
              },
              totalGrossVolume: {
                $sum: { $cond: [{ $eq: ["$status", "completed"] }, "$fare", 0] },
              },
            },
          },
        ],
        statusCounts: [
          {
            $group: {
              _id: "$status",
              count: { $sum: 1 },
            },
          },
        ],
      },
    },
  ]);

  const rawTotals = rideStats?.totals?.[0] || {
    totalRides: 0,
    completedRides: 0,
    activeRides: 0,
    requestedRides: 0,
    cancelledRides: 0,
    totalGrossVolume: 0,
  };

  const totalGrossVolume = Math.round(rawTotals.totalGrossVolume * 100) / 100;
  const totalPlatformRevenue = Math.round(totalGrossVolume * platformFeeRate * 100) / 100;
  const totalDriverPayouts = Math.round(totalGrossVolume * DRIVER_COMMISSION_RATE * 100) / 100;
  const averageFare =
    rawTotals.completedRides > 0
      ? Math.round((totalGrossVolume / rawTotals.completedRides) * 100) / 100
      : 0;

  // 2. Driver Fleet counts
  const [driverStats] = await Driver.aggregate([
    {
      $facet: {
        total: [{ $count: "count" }],
        online: [{ $match: { status: "available" } }, { $count: "count" }],
        busy: [{ $match: { status: "busy" } }, { $count: "count" }],
        offline: [{ $match: { status: "offline" } }, { $count: "count" }],
      },
    },
  ]);

  const totalDrivers = driverStats?.total?.[0]?.count || 0;
  const onlineDrivers = driverStats?.online?.[0]?.count || 0;
  const busyDrivers = driverStats?.busy?.[0]?.count || 0;
  const offlineDrivers = driverStats?.offline?.[0]?.count || 0;

  // 3. User directory counts
  const totalRiders = await User.countDocuments({ role: "rider" });

  // 4. Recent Platform Trips stream
  const recentRides = await Ride.find()
    .sort({ createdAt: -1 })
    .limit(8)
    .populate("rider", "name phone email")
    .populate("driver", "name phone email")
    .lean();

  const formattedRecentRides = recentRides.map((ride) => {
    const gross = ride.fare || 0;
    return {
      ...ride,
      grossFare: gross,
      platformFee: Math.round(gross * platformFeeRate * 100) / 100,
      driverEarnings: Math.round(gross * DRIVER_COMMISSION_RATE * 100) / 100,
    };
  });

  return {
    financials: {
      totalGrossVolume,
      totalPlatformRevenue,
      totalDriverPayouts,
      commissionRate: Math.round(platformFeeRate * 100),
      driverSplitRate: Math.round(DRIVER_COMMISSION_RATE * 100),
      averageFare,
    },
    trips: {
      total: rawTotals.totalRides,
      completed: rawTotals.completedRides,
      active: rawTotals.activeRides,
      requested: rawTotals.requestedRides,
      cancelled: rawTotals.cancelledRides,
      completionRate:
        rawTotals.totalRides > 0
          ? Math.round((rawTotals.completedRides / rawTotals.totalRides) * 100)
          : 100,
    },
    fleet: {
      totalDrivers,
      onlineDrivers,
      busyDrivers,
      offlineDrivers,
      activeRate:
        totalDrivers > 0
          ? Math.round(((onlineDrivers + busyDrivers) / totalDrivers) * 100)
          : 0,
    },
    users: {
      totalRiders,
      totalDrivers,
    },
    recentRides: formattedRecentRides,
  };
}

/**
 * Paginated list of all rides with search and status filters
 */
async function getAllRides({ page = 1, limit = 15, status, search } = {}) {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 15));
  const filter = {};

  if (status && status !== "all") {
    filter.status = status;
  }

  const [rides, totalCount] = await Promise.all([
    Ride.find(filter)
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .populate("rider", "name phone email")
      .populate("driver", "name phone email")
      .lean(),
    Ride.countDocuments(filter),
  ]);

  const platformFeeRate = 1 - DRIVER_COMMISSION_RATE;
  const enrichedRides = await Promise.all(
    rides.map(async (ride) => {
      let vehicleInfo = null;
      if (ride.driver?._id) {
        const driverDoc = await Driver.findOne({ user: ride.driver._id })
          .populate("vehicle")
          .lean();
        vehicleInfo = driverDoc?.vehicle || null;
      }

      const gross = ride.fare || 0;
      return {
        ...ride,
        grossFare: gross,
        platformFee: Math.round(gross * platformFeeRate * 100) / 100,
        driverEarnings: Math.round(gross * DRIVER_COMMISSION_RATE * 100) / 100,
        vehicle: vehicleInfo,
      };
    })
  );

  return {
    rides: enrichedRides,
    pagination: {
      page: pageNum,
      limit: limitNum,
      totalCount,
      totalPages: Math.max(1, Math.ceil(totalCount / limitNum)),
    },
  };
}

/**
 * Paginated list of all drivers with vehicle and earnings statistics
 */
async function getAllDrivers({ page = 1, limit = 15 } = {}) {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 15));

  const [drivers, totalCount] = await Promise.all([
    Driver.find()
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .populate("user", "name email phone createdAt")
      .populate("vehicle")
      .lean(),
    Driver.countDocuments(),
  ]);

  const enrichedDrivers = await Promise.all(
    drivers.map(async (d) => {
      const stats = await Ride.aggregate([
        { $match: { driver: d.user?._id, status: "completed" } },
        {
          $group: {
            _id: null,
            totalTrips: { $sum: 1 },
            grossEarnings: { $sum: "$fare" },
          },
        },
      ]);

      const totalTrips = stats[0]?.totalTrips || 0;
      const grossEarnings = stats[0]?.grossEarnings || 0;
      const netEarnings = Math.round(grossEarnings * DRIVER_COMMISSION_RATE * 100) / 100;

      return {
        ...d,
        totalTrips,
        grossEarnings: Math.round(grossEarnings * 100) / 100,
        netEarnings,
      };
    })
  );

  return {
    drivers: enrichedDrivers,
    pagination: {
      page: pageNum,
      limit: limitNum,
      totalCount,
      totalPages: Math.max(1, Math.ceil(totalCount / limitNum)),
    },
  };
}

/**
 * Paginated list of riders with ride counts and total expenditure
 */
async function getAllRiders({ page = 1, limit = 15 } = {}) {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 15));

  const [riders, totalCount] = await Promise.all([
    User.find({ role: "rider" })
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean(),
    User.countDocuments({ role: "rider" }),
  ]);

  const enrichedRiders = await Promise.all(
    riders.map(async (r) => {
      const stats = await Ride.aggregate([
        { $match: { rider: r._id, status: "completed" } },
        {
          $group: {
            _id: null,
            totalTrips: { $sum: 1 },
            totalSpent: { $sum: "$fare" },
          },
        },
      ]);

      return {
        ...r,
        totalTrips: stats[0]?.totalTrips || 0,
        totalSpent: Math.round((stats[0]?.totalSpent || 0) * 100) / 100,
      };
    })
  );

  return {
    riders: enrichedRiders,
    pagination: {
      page: pageNum,
      limit: limitNum,
      totalCount,
      totalPages: Math.max(1, Math.ceil(totalCount / limitNum)),
    },
  };
}

/**
 * Live fleet coordinates for map plotting
 */
async function getLiveFleetMap() {
  const drivers = await Driver.find({
    "currentLocation.coordinates": { $exists: true },
  })
    .populate("user", "name phone email")
    .populate("vehicle")
    .lean();

  return drivers
    .filter((d) => {
      const coords = d.currentLocation?.coordinates;
      return coords && (coords[0] !== 0 || coords[1] !== 0);
    })
    .map((d) => ({
      driverId: d._id,
      userId: d.user?._id,
      name: d.user?.name || "Driver",
      phone: d.user?.phone,
      status: d.status,
      rating: d.rating,
      coordinates: {
        longitude: d.currentLocation.coordinates[0],
        latitude: d.currentLocation.coordinates[1],
      },
      vehicle: d.vehicle,
    }));
}

module.exports = {
  getPlatformOverview,
  getAllRides,
  getAllDrivers,
  getAllRiders,
  getLiveFleetMap,
};
