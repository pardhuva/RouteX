import api from "./api";

export function reportIncident({ rideId, category, urgency = "medium", description }) {
  return api.post("/support/report", { rideId, category, urgency, description });
}

export function getMyIncidents() {
  return api.get("/support/my-tickets");
}

export function getAdminIncidents({ status, category, urgency, page = 1, limit = 20 } = {}) {
  return api.get("/support/admin/tickets", {
    params: { status, category, urgency, page, limit },
  });
}

export function resolveAdminIncident(incidentId, { status, resolution, adminNotes, driverPenalty } = {}) {
  return api.patch(`/support/admin/tickets/${incidentId}`, {
    status,
    resolution,
    adminNotes,
    driverPenalty,
  });
}
