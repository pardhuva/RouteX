import api from "./api";

export function getPlatformOverview() {
  return api.get("/admin/overview");
}

export function getAdminRides({ page = 1, limit = 15, status } = {}) {
  return api.get("/admin/rides", { params: { page, limit, status } });
}

export function getAdminDrivers({ page = 1, limit = 15 } = {}) {
  return api.get("/admin/drivers", { params: { page, limit } });
}

export function getAdminRiders({ page = 1, limit = 15 } = {}) {
  return api.get("/admin/riders", { params: { page, limit } });
}

export function getLiveFleetMap() {
  return api.get("/admin/fleet-map");
}
