import { useState } from "react";
import { Power, LocateFixed, MapPin, ShieldCheck, Navigation, AlertCircle, Radio } from "lucide-react";
import Button from "../Button";
import Modal from "../Modal";
import * as driverApi from "../../services/driverApi";
import { getErrorMessage } from "../../services/api";
import { useToast } from "../../context/ToastContext";

export default function AvailabilityToggle({ status, onStatusChange }) {
  const { showToast } = useToast();
  const [updating, setUpdating] = useState(false);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [permissionError, setPermissionError] = useState(null);

  const isOnline = status === "available";
  const isBusy = status === "busy";

  async function handleConfirmGoOnline() {
    setUpdating(true);
    setPermissionError(null);
    try {
      if (!navigator.geolocation) {
        throw new Error("This browser does not support geolocation.");
      }

      const coords = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (position) => resolve([position.coords.longitude, position.coords.latitude]),
          (err) => {
            if (err.code === 1) {
              reject(new Error("Location permission was denied. Please allow location access in your browser settings."));
            } else if (err.code === 2) {
              reject(new Error("Device GPS position unavailable. Please ensure your location service is enabled."));
            } else {
              reject(new Error(err.message || "Unable to retrieve your coordinates."));
            }
          },
          { enableHighAccuracy: true, timeout: 10000 }
        );
      });

      await driverApi.updateDriverLocation(coords);
      const res = await driverApi.updateDriverStatus("available");
      onStatusChange(res.data.data.driver.status);
      setShowPermissionModal(false);
      showToast("Online! Geospatial radar active for nearby requests.", "success");
    } catch (err) {
      const msg = err.message && !err.response
        ? err.message
        : getErrorMessage(err, "We couldn't update your status.");
      setPermissionError(msg);
      showToast(msg, "error");
    } finally {
      setUpdating(false);
    }
  }

  async function goOffline() {
    setUpdating(true);
    try {
      const res = await driverApi.updateDriverStatus("offline");
      onStatusChange(res.data.data.driver.status);
      showToast("You are now offline.", "info");
    } catch (err) {
      showToast(getErrorMessage(err, "We couldn't update your status."), "error");
    } finally {
      setUpdating(false);
    }
  }

  return (
    <>
      <div
        className={`rounded-xl border p-4 sm:p-5 transition-all shadow-xs ${
          isOnline
            ? "border-emerald-200 bg-emerald-50/50"
            : isBusy
            ? "border-brand-200 bg-brand-50/50"
            : "border-slate-200 bg-white"
        }`}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg shadow-xs ${
                isOnline
                  ? "bg-emerald-600 text-white"
                  : isBusy
                  ? "bg-brand-600 text-white"
                  : "bg-slate-100 text-slate-500 border border-slate-200"
              }`}
            >
              {isOnline ? (
                <Radio className="h-5 w-5 animate-pulse" />
              ) : (
                <Power className="h-5 w-5" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <p className={`text-base font-black tracking-tight ${
                  isOnline ? "text-emerald-800" : isBusy ? "text-brand-800" : "text-slate-900"
                }`}>
                  {isBusy ? "Trip in Progress" : isOnline ? "Online & Ready for Dispatch" : "Offline"}
                </p>
                {isOnline && (
                  <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {isBusy
                  ? "Complete your current trip to accept new requests."
                  : isOnline
                  ? "Broadcasting GPS to Redis GEO matching engine."
                  : "Go online to start receiving nearby passenger rides."}
              </p>
            </div>
          </div>

          {!isBusy && (
            <Button
              variant={isOnline ? "secondary" : "dark"}
              size="md"
              icon={isOnline ? Power : LocateFixed}
              loading={updating}
              className={isOnline ? "border-emerald-200 text-emerald-800 hover:bg-emerald-100/60 font-bold" : "font-bold shadow-xs"}
              onClick={
                isOnline
                  ? goOffline
                  : () => {
                      setPermissionError(null);
                      setShowPermissionModal(true);
                    }
              }
            >
              {isOnline ? "Go Offline" : "Go Online Now"}
            </Button>
          )}
        </div>
      </div>

      {/* Geolocation Permission Modal */}
      <Modal
        open={showPermissionModal}
        onClose={() => !updating && setShowPermissionModal(false)}
        title="Driver Dispatch Location"
        size="md"
      >
        <div className="space-y-3.5">
          <div className="flex items-start gap-3 rounded-lg border border-blue-100 bg-blue-50/60 p-3 text-xs text-blue-900">
            <MapPin className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
            <p>
              RouteX requires active browser GPS coordinates to match you with nearby riders within your operating radius.
            </p>
          </div>

          <div className="space-y-2 rounded-lg border border-slate-100 bg-slate-50 p-3 text-xs text-slate-600">
            <div className="flex items-center gap-2 font-semibold text-slate-800">
              <Navigation className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
              <span>Redis GEO dispatch routing in real time.</span>
            </div>
            <div className="flex items-center gap-2 font-semibold text-slate-800">
              <ShieldCheck className="h-3.5 w-3.5 text-brand-600 shrink-0" />
              <span>Location telemetry only broadcasted while marked Online.</span>
            </div>
          </div>

          {permissionError && (
            <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-700">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <p>{permissionError}</p>
            </div>
          )}

          <div className="mt-4 flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowPermissionModal(false)}
              disabled={updating}
            >
              Cancel
            </Button>
            <Button
              variant="dark"
              size="sm"
              icon={LocateFixed}
              loading={updating}
              onClick={handleConfirmGoOnline}
            >
              Enable GPS & Go Online
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
