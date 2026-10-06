import { useState, useEffect, useCallback } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Radio,
  CheckCircle2,
  Clock,
  MapPin,
  Navigation,
  RefreshCw,
  Search,
  Filter,
  User,
  Car,
  ExternalLink,
  FileText,
  Phone,
  Check,
} from "lucide-react";
import Button from "../Button";
import Modal from "../Modal";
import Loader from "../Loader";
import ErrorState from "../ErrorState";
import { useSocket } from "../../context/SocketContext";
import { useToast } from "../../context/ToastContext";
import * as adminApi from "../../services/adminApi";
import { getErrorMessage } from "../../services/api";

export default function AdminSafetyMonitoring() {
  const socket = useSocket();
  const { showToast } = useToast();
  const [alerts, setAlerts] = useState([]);
  const [activeCount, setActiveCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all"); // "all" | "active" | "follow_up" | "resolved"
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [resolutionStatus, setResolutionStatus] = useState("resolved");
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [submittingResolution, setSubmittingResolution] = useState(false);

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.getAdminSafetyAlerts({
        status: filterStatus === "all" ? undefined : filterStatus,
        limit: 50,
      });
      const data = res.data?.data;
      setAlerts(data?.alerts || []);
      setActiveCount(data?.activeCount || 0);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load safety alerts."));
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  // Real-time Socket.IO Listeners for instant safety operations notification
  useEffect(() => {
    if (!socket) return;

    function handleAlertCreated(payload) {
      showToast(`🚨 New Safety Alert triggered on Ride ${String(payload.rideId).slice(-6)}`, "error");
      fetchAlerts();
    }

    function handleAlertUpdated() {
      fetchAlerts();
    }

    function handleConfirmationUpdated(payload) {
      showToast(`✅ Rider confirmed safe arrival on Ride ${String(payload.rideId).slice(-6)}`, "success");
      fetchAlerts();
    }

    socket.on("safety_alert_created", handleAlertCreated);
    socket.on("safety_alert_updated", handleAlertUpdated);
    socket.on("safety_confirmation_updated", handleConfirmationUpdated);

    return () => {
      socket.off("safety_alert_created", handleAlertCreated);
      socket.off("safety_alert_updated", handleAlertUpdated);
      socket.off("safety_confirmation_updated", handleConfirmationUpdated);
    };
  }, [socket, fetchAlerts, showToast]);

  async function handleResolveSubmit() {
    if (!selectedAlert) return;
    setSubmittingResolution(true);
    try {
      await adminApi.resolveSafetyAlert(selectedAlert._id, {
        status: resolutionStatus,
        resolutionNotes,
      });
      showToast("Safety alert updated successfully.", "success");
      setSelectedAlert(null);
      setResolutionNotes("");
      fetchAlerts();
    } catch (err) {
      showToast(getErrorMessage(err, "Failed to resolve alert."), "error");
    } finally {
      setSubmittingResolution(false);
    }
  }

  const filteredAlerts = alerts.filter((item) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const riderName = item.rider?.name?.toLowerCase() || "";
    const driverName = item.driver?.name?.toLowerCase() || "";
    const rideId = item.ride?._id ? String(item.ride._id).toLowerCase() : "";
    const pickup = item.ride?.pickup?.address?.toLowerCase() || "";
    const dest = item.ride?.destination?.address?.toLowerCase() || "";
    return riderName.includes(q) || driverName.includes(q) || rideId.includes(q) || pickup.includes(q) || dest.includes(q);
  });

  const activeAlertsCount = alerts.filter((a) => a.status === "active").length;
  const followUpCount = alerts.filter((a) => a.status === "follow_up").length;
  const safeArrivalsCount = alerts.filter((a) => Boolean(a.safeConfirmationAt)).length;

  return (
    <div className="space-y-6">
      {/* Metrics Banner */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-rose-200 bg-gradient-to-br from-rose-50 to-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-700 uppercase tracking-wider">Active Alerts</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-600 text-white shadow-2xs">
              <ShieldAlert className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-rose-950 font-mono">{activeAlertsCount}</div>
          <div className="text-[11px] text-rose-600 mt-1 font-medium">Requiring operations response</div>
        </div>

        <div className="rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Follow-Up Needed</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500 text-white shadow-2xs">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-amber-950 font-mono">{followUpCount}</div>
          <div className="text-[11px] text-amber-600 mt-1 font-medium">Under review / inquiry</div>
        </div>

        <div className="rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Safe Check-Ins</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-2xs">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-950 font-mono">{safeArrivalsCount}</div>
          <div className="text-[11px] text-emerald-600 mt-1 font-medium">Passenger confirmed safe arrival</div>
        </div>

        <div className="rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-white p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">Total Recorded</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white shadow-2xs">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 font-mono">{alerts.length}</div>
          <div className="text-[11px] text-slate-500 mt-1 font-medium">All logged safety incidents</div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: "all", label: "All Incidents" },
            { id: "active", label: `Active (${activeAlertsCount})`, badgeClass: "text-rose-700 font-bold" },
            { id: "follow_up", label: "Follow-Up Needed" },
            { id: "resolved", label: "Resolved" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`px-3 py-1.5 text-xs rounded-lg font-semibold transition-all ${
                filterStatus === tab.id
                  ? "bg-slate-900 text-white shadow-2xs"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search rider, driver, ride ID..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:border-brand-500 outline-none"
            />
          </div>
          <Button
            size="sm"
            variant="secondary"
            icon={RefreshCw}
            onClick={fetchAlerts}
            loading={loading}
            title="Refresh alerts"
          />
        </div>
      </div>

      {/* Alerts Feed */}
      {loading && alerts.length === 0 ? (
        <Loader label="Loading real-time safety operations feed..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchAlerts} />
      ) : filteredAlerts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white p-12 text-center">
          <ShieldCheck className="h-10 w-10 text-emerald-500 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-900">No Safety Alerts Found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {filterStatus === "active"
              ? "All active rides are currently running normally with zero open safety alerts."
              : "No safety alerts match your current filter criteria."}
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredAlerts.map((alert) => {
            const isAlertActive = alert.status === "active";
            const isFollowUp = alert.status === "follow_up";
            const coordinates = alert.lastKnownLocation?.coordinates || alert.ride?.pickup?.location?.coordinates;

            return (
              <div
                key={alert._id}
                className={`rounded-xl border bg-white p-4 sm:p-5 shadow-xs transition-all ${
                  isAlertActive
                    ? "border-rose-300 ring-1 ring-rose-200"
                    : isFollowUp
                    ? "border-amber-300 ring-1 ring-amber-100"
                    : "border-slate-200"
                }`}
              >
                {/* Header Strip */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-bold ${
                        isAlertActive
                          ? "bg-rose-600 text-white animate-pulse shadow-2xs"
                          : isFollowUp
                          ? "bg-amber-100 text-amber-800 border border-amber-300"
                          : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                      }`}
                    >
                      {isAlertActive && <span className="h-1.5 w-1.5 rounded-full bg-white animate-ping" />}
                      {isAlertActive ? "LIVE ACTIVE ALERT" : isFollowUp ? "FOLLOW-UP NEEDED" : "RESOLVED"}
                    </span>
                    <span className="text-xs font-semibold text-slate-600 capitalize">
                      Type: <strong className="text-slate-900">{alert.alertType?.replace("_", " ")}</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {new Date(alert.createdAt).toLocaleString()}
                    </span>
                    <Button
                      size="sm"
                      variant={isAlertActive ? "danger" : "secondary"}
                      onClick={() => {
                        setSelectedAlert(alert);
                        setResolutionStatus(alert.status === "active" ? "resolved" : alert.status);
                        setResolutionNotes(alert.resolutionNotes || "");
                      }}
                      className="text-xs py-1"
                    >
                      {isAlertActive ? "Take Action / Resolve" : "Edit Resolution"}
                    </Button>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="mt-3.5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 text-xs">
                  {/* Rider Info */}
                  <div className="rounded-lg bg-slate-50 p-3 border border-slate-100">
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                      <User className="h-3 w-3" /> Passenger
                    </div>
                    <div className="font-bold text-slate-900 text-sm">{alert.rider?.name || "Passenger"}</div>
                    <div className="text-slate-600 mt-0.5">{alert.rider?.phone || "No phone"}</div>
                    <div className="text-slate-500 text-[11px]">{alert.rider?.email}</div>
                  </div>

                  {/* Driver Info */}
                  <div className="rounded-lg bg-slate-50 p-3 border border-slate-100">
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                      <Car className="h-3 w-3" /> Assigned Driver
                    </div>
                    <div className="font-bold text-slate-900 text-sm">{alert.driver?.name || "Unassigned"}</div>
                    <div className="text-slate-600 mt-0.5">{alert.driver?.phone || "No phone"}</div>
                    <div className="text-slate-500 text-[11px]">{alert.driver?.email || "N/A"}</div>
                  </div>

                  {/* Route & Ride Status */}
                  <div className="rounded-lg bg-slate-50 p-3 border border-slate-100">
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                      <Navigation className="h-3 w-3" /> Ride Trip
                    </div>
                    <div className="text-slate-800 font-medium truncate">
                      <strong>From:</strong> {alert.ride?.pickup?.address || "Pickup"}
                    </div>
                    <div className="text-slate-800 font-medium truncate mt-0.5">
                      <strong>To:</strong> {alert.ride?.destination?.address || "Destination"}
                    </div>
                    <div className="mt-1 flex items-center gap-1 text-[11px]">
                      <span className="font-semibold text-slate-500">Status:</span>
                      <span className="font-bold uppercase text-brand-600">{alert.ride?.status || "N/A"}</span>
                    </div>
                  </div>

                  {/* Telemetry & Safe Check-In */}
                  <div className="rounded-lg bg-slate-50 p-3 border border-slate-100">
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                      <ShieldCheck className="h-3 w-3" /> Safety Check-In
                    </div>
                    {alert.safeConfirmationAt ? (
                      <div className="text-emerald-700 font-semibold flex items-center gap-1 mt-1">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                        <span>Passenger Confirmed Safe</span>
                      </div>
                    ) : (
                      <div className="text-amber-700 font-medium mt-1">
                        Pending arrival confirmation
                      </div>
                    )}
                    {coordinates && (
                      <div className="mt-1.5 pt-1 border-t border-slate-200">
                        <a
                          href={`https://www.google.com/maps?q=${coordinates[1]},${coordinates[0]}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-600 hover:text-brand-800 hover:underline"
                        >
                          <MapPin className="h-3 w-3" /> View Last Known GPS <ExternalLink className="h-2.5 w-2.5" />
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Description & Resolution Notes */}
                {(alert.description || alert.resolutionNotes) && (
                  <div className="mt-3 pt-3 border-t border-slate-100 grid gap-2 sm:grid-cols-2 text-xs">
                    {alert.description && (
                      <div className="rounded bg-rose-50/60 p-2.5 border border-rose-100 text-rose-900">
                        <span className="font-bold block text-[11px] text-rose-800">Rider's Alert Note:</span>
                        <p className="italic mt-0.5">"{alert.description}"</p>
                      </div>
                    )}
                    {alert.resolutionNotes && (
                      <div className="rounded bg-slate-50 p-2.5 border border-slate-200 text-slate-800">
                        <span className="font-bold block text-[11px] text-slate-600">
                          Resolution Log {alert.resolvedBy?.name ? `(${alert.resolvedBy.name})` : ""}:
                        </span>
                        <p className="mt-0.5">{alert.resolutionNotes}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Resolution & Action Modal */}
      {selectedAlert && (
        <Modal
          open={Boolean(selectedAlert)}
          onClose={() => setSelectedAlert(null)}
          title={`Take Action: Safety Alert #${String(selectedAlert._id).slice(-6)}`}
          size="md"
        >
          <div className="space-y-4">
            <div className="rounded-lg bg-slate-50 p-3 text-xs border border-slate-200 space-y-1">
              <div><strong>Passenger:</strong> {selectedAlert.rider?.name} ({selectedAlert.rider?.phone})</div>
              <div><strong>Driver:</strong> {selectedAlert.driver?.name || "Unassigned"} ({selectedAlert.driver?.phone || "N/A"})</div>
              <div><strong>Route:</strong> {selectedAlert.ride?.pickup?.address} → {selectedAlert.ride?.destination?.address}</div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Update Status
              </label>
              <select
                value={resolutionStatus}
                onChange={(e) => setResolutionStatus(e.target.value)}
                className="w-full rounded-lg border border-slate-200 p-2 text-xs text-slate-900 bg-white focus:border-brand-500 outline-none"
              >
                <option value="resolved">Mark Resolved (Action Complete / Passenger Safe)</option>
                <option value="follow_up">Mark Follow-Up (Under Investigation / Support Called)</option>
                <option value="active">Keep Active (Urgent Ongoing Situation)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Resolution Notes & Operations Log
              </label>
              <textarea
                rows={3}
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                placeholder="Detail the action taken (e.g. called driver, verified vehicle on route, passenger confirmed safe via call)..."
                className="w-full rounded-lg border border-slate-200 p-2.5 text-xs text-slate-900 focus:border-brand-500 outline-none resize-none"
              />
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSelectedAlert(null)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon={Check}
                loading={submittingResolution}
                onClick={handleResolveSubmit}
                className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-bold"
              >
                Save Resolution
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
