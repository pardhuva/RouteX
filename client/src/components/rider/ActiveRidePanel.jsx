import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, MapPin, Navigation, XCircle, ShieldCheck, ShieldAlert, Radio } from "lucide-react";
import MapView from "../MapView";
import RideStatusTimeline from "../RideStatusTimeline";
import PersonInfoCard from "../PersonInfoCard";
import Button from "../Button";
import SupportReportModal from "../SupportReportModal";
import PaymentPanel from "./PaymentPanel";
import { useLiveRide } from "../../hooks/useLiveRide";
import { useToast } from "../../context/ToastContext";
import * as rideApi from "../../services/rideApi";
import { getErrorMessage } from "../../services/api";

const STATUS_COPY = {
  requested: {
    title: "Searching for nearby drivers...",
    description: "Finding the closest available partner driver to accept your request.",
  },
  accepted: {
    title: "Driver assigned & en route",
    description: "Share the 4-digit start PIN with your driver upon arrival.",
  },
  started: {
    title: "Trip in progress",
    description: "Heading towards your drop-off destination.",
  },
};

function toLatLng(point) {
  if (!point?.location?.coordinates) return null;
  const [longitude, latitude] = point.location.coordinates;
  return { latitude, longitude };
}

export default function ActiveRidePanel({ ride, onRideChange, onCancelled }) {
  const { showToast } = useToast();
  const [cancelling, setCancelling] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);

  const handleRideUpdate = useCallback(
    (updatedRide) => {
      onRideChange(() => updatedRide);
      if (updatedRide.status === "completed") {
        showToast("Destination reached! Please complete payment settlement.", "success");
      } else if (updatedRide.status === "cancelled") {
        showToast("This ride was cancelled.", "info");
      }
    },
    [onRideChange, showToast]
  );

  const { driverLocation, matchingRadius } = useLiveRide(ride._id, { onRideUpdate: handleRideUpdate });

  async function handleCancel() {
    setCancelling(true);
    try {
      await rideApi.cancelRide(ride._id);
      showToast("Ride cancelled.", "info");
      onCancelled();
    } catch (err) {
      showToast(getErrorMessage(err, "We couldn't cancel this ride."), "error");
    } finally {
      setCancelling(false);
    }
  }

  const pickupPoint = toLatLng(ride.pickup);
  const destinationPoint = toLatLng(ride.destination);
  const copy = STATUS_COPY[ride.status];
  const canCancel = ride.status === "requested" || ride.status === "accepted";

  return (
    <div className="grid gap-5 lg:grid-cols-12 lg:items-stretch">
      {/* Left Active HUD Panel (5 cols) */}
      <div className="lg:col-span-5 space-y-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs">
          {/* Header Bar */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <RideStatusTimeline status={ride.status} />
            <button
              type="button"
              onClick={() => setSupportOpen(true)}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-rose-600 transition-colors ml-2"
            >
              <ShieldAlert className="h-3.5 w-3.5 text-rose-500" /> SOS
            </button>
          </div>

          {/* Vehicle & Upfront Fare Strip */}
          <div className="mt-3 flex items-center justify-between rounded-lg bg-slate-50 px-3 py-1.5 text-xs border border-slate-100">
            <span className="font-bold text-slate-800 capitalize">
              {ride.vehicleType === "bike"
                ? "🏍️ RouteX Moto"
                : ride.vehicleType === "auto"
                ? "🛺 RouteX Auto"
                : ride.vehicleType === "sedan"
                ? "✨ RouteX Premier"
                : ride.vehicleType === "suv"
                ? "🚐 RouteX XL"
                : "🚗 RouteX Go"}
            </span>
            {ride.estimatedFare && (
              <span className="font-medium text-slate-500 text-[11px]">
                Upfront: <strong className="text-slate-900 font-mono font-bold">₹{ride.estimatedFare}</strong>
              </span>
            )}
          </div>

          {/* Route details */}
          <div className="mt-3 space-y-1 rounded-lg bg-slate-50/70 p-2.5 text-xs border border-slate-100">
            <div className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
              <span className="text-slate-700 font-medium truncate">{ride.pickup?.address}</span>
            </div>
            <div className="flex items-start gap-2">
              <Navigation className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-600" />
              <span className="text-slate-700 font-medium truncate">{ride.destination?.address}</span>
            </div>
          </div>

          {/* Status Message */}
          <div className="mt-3.5">
            {ride.status === "requested" && (
              <div className="flex items-center gap-3 rounded-lg border border-brand-200 bg-brand-50/50 p-3">
                <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white shadow-2xs">
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">{copy?.title}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{copy?.description}</p>
                </div>
              </div>
            )}
            {copy && ride.status !== "requested" && (
              <div className="text-xs">
                <p className="font-bold text-slate-900">{copy.title}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">{copy.description}</p>
              </div>
            )}
          </div>

          {/* Driver Card */}
          {ride.driver && (
            <div className="mt-3.5">
              <PersonInfoCard person={ride.driver} roleLabel="Assigned Driver" />
            </div>
          )}

          {/* 4-Digit Ride Start PIN */}
          {ride.status === "accepted" && (
            <div className="mt-3.5 rounded-xl border border-brand-200 bg-gradient-to-br from-brand-50/80 via-white to-white p-3 text-center shadow-2xs">
              <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-brand-900 uppercase tracking-wider">
                <ShieldCheck className="h-3.5 w-3.5 text-brand-600" /> Start Ride PIN
              </div>
              <p className="mt-0.5 text-[10px] text-slate-500">
                Share this PIN with your driver to start the trip:
              </p>
              <div className="mt-2 flex items-center justify-center gap-2">
                {(ride.otp || String((parseInt(String(ride._id).slice(-4), 16) % 9000) + 1000))
                  .split("")
                  .map((digit, idx) => (
                    <span
                      key={idx}
                      className="flex h-9 w-8 items-center justify-center rounded-lg border border-brand-300 bg-white font-mono text-base font-black text-brand-950 shadow-2xs"
                    >
                      {digit}
                    </span>
                  ))}
              </div>
            </div>
          )}

          {/* Cancel button */}
          {canCancel && (
            <div className="mt-4">
              <Button
                fullWidth
                variant="secondary"
                size="sm"
                icon={XCircle}
                loading={cancelling}
                onClick={handleCancel}
                className="text-slate-700"
              >
                Cancel ride
              </Button>
            </div>
          )}
        </div>

        {ride.status === "completed" && (
          <PaymentPanel rideId={ride._id} onSettled={onCancelled} />
        )}

        <SupportReportModal
          open={supportOpen}
          onClose={() => setSupportOpen(false)}
          rideId={ride._id}
          role="rider"
        />
      </div>

      {/* Right Dominant Live Map (7 cols) */}
      <div className="lg:col-span-7 flex flex-col gap-2.5">
        <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs shadow-xs">
          <div className="flex items-center gap-2 font-medium text-slate-800">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs">
              {ride.status === "accepted"
                ? "Driver is on the way to your pickup location"
                : ride.status === "started"
                ? "Trip in progress · Live route tracking"
                : "Connecting to nearby drivers"}
            </span>
          </div>
          <span className="text-[11px] font-medium text-slate-500">Live GPS</span>
        </div>

        <MapView
          center={pickupPoint}
          pickup={pickupPoint}
          destination={destinationPoint}
          driverLocation={driverLocation}
          rideStatus={ride.status}
          className="h-[380px] lg:h-full lg:min-h-[460px] rounded-xl shadow-xs border border-slate-200"
        />
      </div>
    </div>
  );
}
