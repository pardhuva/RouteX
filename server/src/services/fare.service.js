const { FARE_CONFIG, VEHICLE_TIERS, DRIVER_COMMISSION_RATE } = require("../config/constants");
const ApiError = require("../utils/ApiError");

const EARTH_RADIUS_KM = 6371;

function toRadians(degrees) {
  return (degrees * Math.PI) / 180;
}

// Great-circle (straight-line) distance between two GeoJSON [longitude, latitude] points via Haversine
function calculateDistanceKm([lon1, lat1], [lon2, lat2]) {
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_KM * c;
}

// Dynamic multi-tier fare calculation based on vehicle type and telemetry
function calculateFare(ride) {
  const startedAt = ride.startedAt
    ? new Date(ride.startedAt)
    : (ride.acceptedAt ? new Date(ride.acceptedAt) : new Date(Date.now() - 5 * 60000));
  const completedAt = ride.completedAt ? new Date(ride.completedAt) : new Date();

  const pickupCoords = ride.pickup?.location?.coordinates || [0, 0];
  const destCoords = ride.destination?.location?.coordinates || [0, 0];
  const distanceKm = calculateDistanceKm(pickupCoords, destCoords);
  const durationMs = Math.max(0, completedAt.getTime() - startedAt.getTime());
  const durationMinutes = durationMs / 60000;

  const tier = (ride.vehicleType && VEHICLE_TIERS[ride.vehicleType]) || VEHICLE_TIERS.car || FARE_CONFIG;
  const baseFare = tier.baseFare || FARE_CONFIG.baseFare;
  const perKm = tier.perKm || FARE_CONFIG.perKm;
  const perMinute = tier.perMinute || FARE_CONFIG.perMinute;
  const minFare = tier.minFare || 30;

  const rawFare = baseFare + distanceKm * perKm + durationMinutes * perMinute;

  return {
    distanceKm: Math.round(distanceKm * 1000) / 1000,
    durationMinutes: Math.round(durationMinutes * 100) / 100,
    fare: Math.max(minFare, Math.round(rawFare * 100) / 100),
  };
}

// Detailed fare and commission breakdown for driver earnings reporting
function getFareBreakdown(fare, distanceKm = 0, durationMinutes = 0, vehicleType = "car") {
  const tier = (vehicleType && VEHICLE_TIERS[vehicleType]) || VEHICLE_TIERS.car || FARE_CONFIG;
  const baseFare = tier.baseFare || FARE_CONFIG.baseFare;
  const distanceFare = Math.round(distanceKm * (tier.perKm || FARE_CONFIG.perKm) * 100) / 100;
  const timeFare = Math.round(durationMinutes * (tier.perMinute || FARE_CONFIG.perMinute) * 100) / 100;
  const totalFare = Math.round((fare || baseFare + distanceFare + timeFare) * 100) / 100;
  const driverCut = Math.round(totalFare * DRIVER_COMMISSION_RATE * 100) / 100;
  const platformFee = Math.round((totalFare - driverCut) * 100) / 100;

  return {
    baseFare,
    distanceFare,
    timeFare,
    totalFare,
    platformFee,
    driverCut,
    commissionRate: DRIVER_COMMISSION_RATE,
  };
}

module.exports = { calculateDistanceKm, calculateFare, getFareBreakdown };

