import { useState } from "react";
import { Power, LocateFixed, MapPin, ShieldCheck, Navigation, AlertCircle } from "lucide-react";
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
              reject(new Error("Location permission was denied. Please allow location access in your browser settings (look for the lock icon in your address bar)."));
            } else if (err.code === 2) {
              reject(new Error("Location position unavailable. Please ensure your device GPS/location service is turned on."));
            } else {
              reject(new Error(err.message || "Unable to retrieve your location"));
            }
          },
          { enableHighAccuracy: true, timeout: 10000 }
        );
      });

      await driverApi.updateDriverLocation(coords);
      const res = await driverApi.updateDriverStatus("available");
      onStatusChange(res.data.data.driver.status);
      setShowPermissionModal(false);
      showToast("You're online and receiving rides within 30km!", "success");
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
      showToast("You're offline.", "info");
    } catch (err) {
      showToast(getErrorMessage(err, "We couldn't update your status."), "error");
    } finally {
      setUpdating(false);
    }
  }

  return (
    <>
      <div
        className={`rounded-2xl border p-6 shadow-card transition-colors ${
          isOnline ? "border-emerald-200 bg-emerald-50/60" : isBusy ? "border-brand-200 bg-brand-50/60" : "border-slate-200 bg-white"
        }`}
      >
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className={`text-xl font-extrabold ${isOnline ? "text-emerald-700" : isBusy ? "text-brand-700" : "text-slate-900"}`}>
              {isBusy ? "You're on a ride" : isOnline ? "You're Online" : "You're Offline"}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {isBusy
                ? "Finish your current ride to go back online."
                : isOnline
                  ? "You're ready to receive rides in your local coverage area."
                  : "Go online to start receiving ride requests nearby."}
            </p>
          </div>

          {!isBusy && (
            <Button
              variant={isOnline ? "secondary" : "primary"}
              icon={isOnline ? Power : LocateFixed}
              loading={updating}
              onClick={isOnline ? goOffline : () => {
                setPermissionError(null);
                setShowPermissionModal(true);
              }}
            >
              {isOnline ? "Go Offline" : "Go Online"}
            </Button>
          )}
        </div>
      </div>

      {/* Location Permission Request Modal */}
      <Modal
        open={showPermissionModal}
        onClose={() => !updating && setShowPermissionModal(false)}
        title="Live Location Permission"
        size="md"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3.5 rounded-xl border border-blue-100 bg-blue-50/70 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
              <MapPin className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Allow Location to Receive Nearby Rides</h3>
              <p className="mt-0.5 text-xs text-slate-600 leading-relaxed">
                RouteX requires your device's live GPS coordinates to match you with nearby riders and provide live dispatch routing.
              </p>
            </div>
          </div>

          <div className="space-y-2.5 rounded-xl border border-slate-100 bg-slate-50/60 p-4 text-xs text-slate-600">
            <div className="flex items-center gap-2.5 font-medium text-slate-800">
              <Navigation className="h-4 w-4 text-emerald-600 shrink-0" />
              <span><strong>Nearby Search Radar:</strong> Receive rides dynamically within your coverage area.</span>
            </div>
            <div className="flex items-center gap-2.5 font-medium text-slate-800">
              <ShieldCheck className="h-4 w-4 text-blue-600 shrink-0" />
              <span><strong>Privacy Protected:</strong> Your location is only tracked while you are marked online.</span>
            </div>
          </div>

          {permissionError && (
            <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <p>{permissionError}</p>
            </div>
          )}

          <div className="mt-6 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2.5">
            <Button
              variant="secondary"
              onClick={() => setShowPermissionModal(false)}
              disabled={updating}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              icon={LocateFixed}
              loading={updating}
              onClick={handleConfirmGoOnline}
            >
              Allow & Go Online
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
