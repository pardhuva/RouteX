const mongoose = require("mongoose");
const Driver = require("../models/Driver");
const Ride = require("../models/Ride");
const Payment = require("../models/Payment");
const ApiError = require("../utils/ApiError");
const { getFareBreakdown, calculateDistanceKm } = require("./fare.service");
const { DRIVER_COMMISSION_RATE, PAYOUT_STATUSES, PAYMENT_CURRENCY } = require("../config/constants");

/**
 * Driver Earnings & Analytics Engine
 *
 * Provides real-time financial tracking, aggregations, weekly settlement
 * breakdowns, and itemized trip fare logs for RouteX drivers.
 */

// Helper to get time boundaries in local UTC
function getTimeBoundaries() {
  const now = new Date();

  // Start of today (00:00:00.000)
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  // Start of current week (Monday 00:00:00.000)
  const startOfWeek = new Date(now);
  const day = startOfWeek.getDay(); // 0 is Sunday, 1 is Monday
  const diffToMonday = (day === 0 ? -6 : 1) - day;
  startOfWeek.setDate(startOfWeek.getDate() + diffToMonday);
  startOfWeek.setHours(0, 0, 0, 0);

  // Start of current month (1st of month 00:00:00.000)
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  return { now, startOfToday, startOfWeek, startOfMonth };
}

/**
 * Aggregates lifetime, monthly, weekly, and daily earnings, ride counts,
 * completion rates, and average trip statistics.
 */
async function getDriverEarningsSummary(userId) {
  const driver = await Driver.findOne({ user: userId });
  if (!driver) {
    throw new ApiError(404, "Driver profile not found");
  }

  const userObjectId = new mongoose.Types.ObjectId(userId);
  const { startOfToday, startOfWeek, startOfMonth } = getTimeBoundaries();

  const [aggregateResult] = await Ride.aggregate([
    {
      $match: { driver: userObjectId },
    },
    {
      $facet: {
        completedStats: [
          { $match: { status: "completed", completedAt: { $ne: null } } },
          {
            $group: {
              _id: null,
              totalCompleted: { $sum: 1 },
              totalGross: { $sum: { $ifNull: ["$fare", 0] } },
              totalDurationMs: {
                $sum: {
                  $cond: [
                    { $and: ["$startedAt", "$completedAt"] },
                    { $subtract: ["$completedAt", "$startedAt"] },
                    0,
                  ],
                },
              },
              todayGross: {
                $sum: {
                  $cond: [{ $gte: ["$completedAt", startOfToday] }, { $ifNull: ["$fare", 0] }, 0],
                },
              },
              todayCount: {
                $sum: {
                  $cond: [{ $gte: ["$completedAt", startOfToday] }, 1, 0],
                },
              },
              weekGross: {
                $sum: {
                  $cond: [{ $gte: ["$completedAt", startOfWeek] }, { $ifNull: ["$fare", 0] }, 0],
                },
              },
              weekCount: {
                $sum: {
                  $cond: [{ $gte: ["$completedAt", startOfWeek] }, 1, 0],
                },
              },
              monthGross: {
                $sum: {
                  $cond: [{ $gte: ["$completedAt", startOfMonth] }, { $ifNull: ["$fare", 0] }, 0],
                },
              },
              monthCount: {
                $sum: {
                  $cond: [{ $gte: ["$completedAt", startOfMonth] }, 1, 0],
                },
              },
            },
          },
        ],
        statusCounts: [
          {
            $group: {
              _id: "$status",
              count: { $sum: 1 },
              cancelledByDriver: {
                $sum: {
                  $cond: [{ $eq: ["$cancelledBy", "driver"] }, 1, 0],
                },
              },
            },
          },
        ],
      },
    },
  ]);

  const completed = aggregateResult?.completedStats?.[0] || {
    totalCompleted: 0,
    totalGross: 0,
    totalDurationMs: 0,
    todayGross: 0,
    todayCount: 0,
    weekGross: 0,
    weekCount: 0,
    monthGross: 0,
    monthCount: 0,
  };

  const statusMap = {};
  let totalAssigned = 0;
  let driverCancellations = 0;

  (aggregateResult?.statusCounts || []).forEach((item) => {
    statusMap[item._id] = item.count;
    totalAssigned += item.count;
    driverCancellations += item.cancelledByDriver || 0;
  });

  const totalGross = Math.round(completed.totalGross * 100) / 100;
  const totalNet = Math.round(totalGross * DRIVER_COMMISSION_RATE * 100) / 100;
  const totalPlatformCut = Math.round((totalGross - totalNet) * 100) / 100;

  const todayGross = Math.round(completed.todayGross * 100) / 100;
  const todayNet = Math.round(todayGross * DRIVER_COMMISSION_RATE * 100) / 100;

  const weekGross = Math.round(completed.weekGross * 100) / 100;
  const weekNet = Math.round(weekGross * DRIVER_COMMISSION_RATE * 100) / 100;

  const monthGross = Math.round(completed.monthGross * 100) / 100;
  const monthNet = Math.round(monthGross * DRIVER_COMMISSION_RATE * 100) / 100;

  const totalDurationMinutes = Math.round(completed.totalDurationMs / 60000);
  const avgFare = completed.totalCompleted > 0 ? Math.round((totalGross / completed.totalCompleted) * 100) / 100 : 0;
  const avgDurationMin =
    completed.totalCompleted > 0 ? Math.round((totalDurationMinutes / completed.totalCompleted) * 10) / 10 : 0;

  const completionRate =
    totalAssigned > 0 ? Math.round(((completed.totalCompleted || 0) / totalAssigned) * 1000) / 10 : 100;
  const cancellationRate =
    totalAssigned > 0 ? Math.round((driverCancellations / totalAssigned) * 1000) / 10 : 0;

  return {
    currency: PAYMENT_CURRENCY,
    commissionRate: DRIVER_COMMISSION_RATE,
    earnings: {
      today: {
        gross: todayGross,
        net: todayNet,
        trips: completed.todayCount,
      },
      thisWeek: {
        gross: weekGross,
        net: weekNet,
        trips: completed.weekCount,
      },
      thisMonth: {
        gross: monthGross,
        net: monthNet,
        trips: completed.monthCount,
      },
      lifetime: {
        gross: totalGross,
        net: totalNet,
        platformFee: totalPlatformCut,
        trips: completed.totalCompleted,
      },
    },
    performance: {
      rating: driver.rating || 0,
      totalRatings: driver.totalRatings || 0,
      totalTripsAssigned: totalAssigned,
      completedTrips: completed.totalCompleted,
      totalHoursDriven: Math.round((totalDurationMinutes / 60) * 10) / 10,
      averageFare: avgFare,
      averageTripMinutes: avgDurationMin,
      completionRatePercent: completionRate,
      cancellationRatePercent: cancellationRate,
    },
  };
}

/**
 * Calculates weekly payout settlements grouping completed trips by ISO week.
 */
async function getDriverWeeklyPayouts(userId) {
  const driver = await Driver.findOne({ user: userId });
  if (!driver) {
    throw new ApiError(404, "Driver profile not found");
  }

  const userObjectId = new mongoose.Types.ObjectId(userId);
  const now = new Date();

  // Current ISO week calculation
  const currentWeekNumber = getISOWeek(now);
  const currentYear = now.getFullYear();

  const weeklyAggregations = await Ride.aggregate([
    {
      $match: {
        driver: userObjectId,
        status: "completed",
        completedAt: { $ne: null },
      },
    },
    {
      $group: {
        _id: {
          year: { $isoWeekYear: "$completedAt" },
          week: { $isoWeek: "$completedAt" },
        },
        tripsCount: { $sum: 1 },
        grossFares: { $sum: { $ifNull: ["$fare", 0] } },
        firstTripDate: { $min: "$completedAt" },
        lastTripDate: { $max: "$completedAt" },
      },
    },
    {
      $sort: { "_id.year": -1, "_id.week": -1 },
    },
  ]);

  const payouts = weeklyAggregations.map((item) => {
    const year = item._id.year;
    const week = item._id.week;
    const grossFare = Math.round(item.grossFares * 100) / 100;
    const netPayout = Math.round(grossFare * DRIVER_COMMISSION_RATE * 100) / 100;
    const platformFee = Math.round((grossFare - netPayout) * 100) / 100;

    const isCurrentWeek = year === currentYear && week === currentWeekNumber;
    const status = isCurrentWeek ? PAYOUT_STATUSES.processing : PAYOUT_STATUSES.settled;

    const { weekStart, weekEnd } = getISOWeekDateRange(year, week);

    return {
      payoutId: `PAY-${year}-W${String(week).padStart(2, "0")}-${String(userId).slice(-4).toUpperCase()}`,
      year,
      week,
      weekStart: weekStart.toISOString(),
      weekEnd: weekEnd.toISOString(),
      tripsCount: item.tripsCount,
      grossEarnings: grossFare,
      platformFee,
      netPayout,
      currency: PAYMENT_CURRENCY,
      status,
      settlementDate: isCurrentWeek ? null : weekEnd.toISOString(),
    };
  });

  return {
    currency: PAYMENT_CURRENCY,
    commissionRate: DRIVER_COMMISSION_RATE,
    totalPayoutsRecorded: payouts.length,
    payouts,
  };
}

/**
 * Returns itemized completed ride logs with full fare components.
 */
async function getDriverCompletedRideLogs(userId, { timeframe = "all", page = 1, limit = 10 } = {}) {
  const driver = await Driver.findOne({ user: userId });
  if (!driver) {
    throw new ApiError(404, "Driver profile not found");
  }

  const query = {
    driver: userId,
    status: "completed",
  };

  const { startOfToday, startOfWeek, startOfMonth } = getTimeBoundaries();

  if (timeframe === "today") {
    query.completedAt = { $gte: startOfToday };
  } else if (timeframe === "week") {
    query.completedAt = { $gte: startOfWeek };
  } else if (timeframe === "month") {
    query.completedAt = { $gte: startOfMonth };
  }

  const skip = (Math.max(1, Number(page)) - 1) * Math.max(1, Number(limit));
  const parsedLimit = Math.min(50, Math.max(1, Number(limit)));

  const [rides, totalCount] = await Promise.all([
    Ride.find(query)
      .sort({ completedAt: -1 })
      .skip(skip)
      .limit(parsedLimit)
      .populate("rider", "name phone email"),
    Ride.countDocuments(query),
  ]);

  // Lookup payment statuses for these rides
  const rideIds = rides.map((r) => r._id);
  const payments = await Payment.find({ ride: { $in: rideIds } });
  const paymentMap = new Map(payments.map((p) => [String(p.ride), p]));

  const logs = rides.map((ride) => {
    let distanceKm = 0;
    if (ride.pickup?.location?.coordinates && ride.destination?.location?.coordinates) {
      distanceKm = calculateDistanceKm(
        ride.pickup.location.coordinates,
        ride.destination.location.coordinates
      );
    }

    let durationMinutes = 0;
    if (ride.startedAt && ride.completedAt) {
      durationMinutes = Math.max(0, (new Date(ride.completedAt) - new Date(ride.startedAt)) / 60000);
    }

    const fareBreakdown = getFareBreakdown(ride.fare, distanceKm, durationMinutes);
    const payment = paymentMap.get(String(ride._id));

    return {
      rideId: ride._id,
      rider: {
        name: ride.rider?.name || "Rider",
        phone: ride.rider?.phone || "N/A",
      },
      pickup: ride.pickup?.address || "Pickup Location",
      destination: ride.destination?.address || "Destination Location",
      requestedAt: ride.requestedAt,
      acceptedAt: ride.acceptedAt,
      startedAt: ride.startedAt,
      completedAt: ride.completedAt,
      distanceKm: Math.round(distanceKm * 100) / 100,
      durationMinutes: Math.round(durationMinutes * 10) / 10,
      fareBreakdown: {
        baseFare: fareBreakdown.baseFare,
        distanceFare: fareBreakdown.distanceFare,
        timeFare: fareBreakdown.timeFare,
        grossFare: fareBreakdown.totalFare,
        platformFee: fareBreakdown.platformFee,
        driverNetEarnings: fareBreakdown.driverCut,
        currency: PAYMENT_CURRENCY,
      },
      payment: {
        status: payment?.status || "pending",
        paymentMethod: payment?.paymentMethod || "simulated",
        paidAt: payment?.paidAt || null,
        providerReference: payment?.providerReference || null,
      },
    };
  });

  return {
    pagination: {
      page: Number(page),
      limit: parsedLimit,
      totalCount,
      totalPages: Math.ceil(totalCount / parsedLimit) || 1,
    },
    rides: logs,
  };
}

// ISO week number calculation
function getISOWeek(date) {
  const target = new Date(date.valueOf());
  const dayNr = (date.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = target.valueOf();
  target.setMonth(0, 1);
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay() + 7) % 7));
  }
  return 1 + Math.ceil((firstThursday - target) / 604800000);
}

// ISO week date range calculation
function getISOWeekDateRange(year, week) {
  const simple = new Date(Date.UTC(year, 0, 1 + (week - 1) * 7));
  const dow = simple.getUTCDay();
  const weekStart = new Date(simple);
  if (dow <= 4) {
    weekStart.setUTCDate(simple.getUTCDate() - simple.getUTCDay() + 1);
  } else {
    weekStart.setUTCDate(simple.getUTCDate() + 8 - simple.getUTCDay());
  }
  weekStart.setUTCHours(0, 0, 0, 0);

  const weekEnd = new Date(weekStart);
  weekEnd.setUTCDate(weekStart.getUTCDate() + 6);
  weekEnd.setUTCHours(23, 59, 59, 999);

  return { weekStart, weekEnd };
}

module.exports = {
  getDriverEarningsSummary,
  getDriverWeeklyPayouts,
  getDriverCompletedRideLogs,
};
