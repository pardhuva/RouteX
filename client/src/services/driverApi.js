import api from "./api";

// Maps 1:1 to server/src/routes/driver.routes.js (all driver-role-only,
// see server/src/middleware/role.middleware.js).

// Throws a 404 (via ApiError in driver.service.js#getProfileByUserId) if
// this user hasn't created a driver profile yet — callers should treat
// that specific case as "needs onboarding," not a generic error.
export function getMyDriverProfile() {
  return api.get("/drivers/me");
}

export function createDriverProfile({ vehicleType, brand, model, registrationNumber }) {
  return api.post("/drivers/profile", { vehicleType, brand, model, registrationNumber });
}

export function updateDriverStatus(status) {
  return api.patch("/drivers/status", { status });
}

export function updateDriverLocation(coordinates) {
  return api.patch("/drivers/location", { coordinates });
}

export function getDriverEarningsSummary() {
  return api.get("/drivers/earnings/summary");
}

export function getDriverWeeklyPayouts() {
  return api.get("/drivers/earnings/payouts");
}

export function getDriverCompletedRides(params = {}) {
  return api.get("/drivers/rides/completed", { params });
}

