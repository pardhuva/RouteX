const Incident = require("../models/Incident");
const Ride = require("../models/Ride");
const Driver = require("../models/Driver");
const User = require("../models/User");
const ApiError = require("../utils/ApiError");

async function reportIncident(user, { rideId, category, urgency = "medium", description }) {
  if (!rideId || !category || !description) {
    throw new ApiError(400, "Ride ID, issue category, and description are required");
  }

  const ride = await Ride.findById(rideId);
  if (!ride) {
    throw new ApiError(404, "Ride not found");
  }

  const riderId = ride.rider.toString();
  const driverId = ride.driver ? ride.driver.toString() : null;
  const requesterId = user._id.toString();

  if (requesterId !== riderId && requesterId !== driverId && user.role !== "admin") {
    throw new ApiError(403, "You can only report issues for rides you participated in");
  }

  const reporterRole = requesterId === riderId ? "rider" : "driver";
  const targetUser = reporterRole === "rider" ? ride.driver : ride.rider;

  // Auto-escalate safety/emergency to critical
  let effectiveUrgency = urgency;
  if (category === "emergency_safety") {
    effectiveUrgency = "critical";
  }

  const incident = await Incident.create({
    ride: ride._id,
    reporter: user._id,
    targetUser,
    reporterRole,
    category,
    urgency: effectiveUrgency,
    description: description.trim(),
    status: "open",
  });

  // If driver reported rider escaped without paying, record platform debt & credit driver guarantee
  if (category === "rider_escaped_unpaid" && reporterRole === "driver" && ride.rider) {
    const riderDoc = await User.findById(ride.rider);
    if (riderDoc) {
      const fareAmount = ride.fare || 150;
      riderDoc.outstandingDebt = (riderDoc.outstandingDebt || 0) + fareAmount;
      riderDoc.unpaidRideId = ride._id;
      await riderDoc.save();
    }
  }

  return populateIncident(incident._id);
}

async function populateIncident(incidentId) {
  return Incident.findById(incidentId)
    .populate("reporter", "name email phone role")
    .populate("targetUser", "name email phone role")
    .populate("resolvedBy", "name email")
    .populate({
      path: "ride",
      select: "pickup destination status fare createdAt startedAt completedAt",
    });
}

async function getMyIncidents(user) {
  return Incident.find({ reporter: user._id })
    .sort({ createdAt: -1 })
    .populate({
      path: "ride",
      select: "pickup destination status fare createdAt",
    })
    .populate("targetUser", "name phone role");
}

async function getAllIncidents({ status, category, urgency, page = 1, limit = 20 } = {}) {
  const query = {};
  if (status) query.status = status;
  if (category) query.category = category;
  if (urgency) query.urgency = urgency;

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));

  const [incidents, totalCount] = await Promise.all([
    Incident.find(query)
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .populate("reporter", "name email phone role")
      .populate("targetUser", "name email phone role")
      .populate({
        path: "ride",
        select: "pickup destination status fare createdAt",
      }),
    Incident.countDocuments(query),
  ]);

  return {
    incidents,
    pagination: {
      page: pageNum,
      limit: limitNum,
      totalCount,
      totalPages: Math.max(1, Math.ceil(totalCount / limitNum)),
    },
  };
}

async function resolveIncident(incidentId, adminUser, { status, resolution, adminNotes, driverPenalty }) {
  const incident = await Incident.findById(incidentId);
  if (!incident) {
    throw new ApiError(404, "Incident report not found");
  }

  if (status) incident.status = status;
  if (resolution) incident.resolution = resolution.trim();
  if (adminNotes) incident.adminNotes = adminNotes.trim();

  if (status === "resolved" || status === "dismissed") {
    incident.resolvedAt = new Date();
    incident.resolvedBy = adminUser._id;
  }

  // Admin penalty enforcement (e.g. adjust driver rating or warning)
  if (driverPenalty === "suspend" && incident.targetUser) {
    const driver = await Driver.findOne({ user: incident.targetUser });
    if (driver) {
      driver.status = "offline";
      await driver.save();
    }
  }

  await incident.save();
  return populateIncident(incident._id);
}

module.exports = {
  reportIncident,
  getMyIncidents,
  getAllIncidents,
  resolveIncident,
};
