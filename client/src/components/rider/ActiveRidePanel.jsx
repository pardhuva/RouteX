import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, MapPin, Navigation, XCircle, ArrowRight, ShieldCheck, KeyRound } from "lucide-react";
import MapView from "../MapView";
import RideStatusTimeline from "../RideStatusTimeline";
import PersonInfoCard from "../PersonInfoCard";
import Button from "../Button";
import { useLiveRide } from "../../hooks/useLiveRide";
import { useToast } from "../../context/ToastContext";
import * as rideApi from "../../services/rideApi";
import { getErrorMessage } from "../../services/api";

const STATUS_COPY = {
  requested: { title: "Finding the best driver for you...", description: "Hang tight — we're matching you with a nearby driver." },
  accepted: { title: "Your driver is on the way", description: "Share the 4-digit PIN with your driver upon arrival." },
  started: { title: "Your ride is in progress", description: "Sit back and enjoy the ride." },
};

function toLatLng(point) {
  if (!point?.location?.coordinates) return null;
  const [longitude, latitude] = point.location.coordinates;
  return { latitude, longitude };
}

// The rider dashboard's centerpiece while a ride is active (requested,
// accepted, or started) — replaces the booking form entirely, per the
// state-based UI the brief asks for (searching -> driver found -> arriving
// -> started -> completed).
import SupportReportModal from "../SupportReportModal";
import PaymentPanel from "./PaymentPanel";
import { ShieldAlert } from "lucide-react";

export default function ActiveRidePanel({ ride, onRideChange, onCancelled }) {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [cancelling, setCancelling] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);

  const handleRideUpdate = useCallback(
    (updatedRide) => {
      onRideChange(() => updatedRide);
      if (updatedRide.status === "completed") {
        showToast("You've arrived! Head to payment to finish up.", "success");
      } else if (updatedRide.status === "cancelled") {
        showToast("This ride was cancelled.", "info");
      }
    },
    [onRideChange, showToast]
  );

  const { driverLocation } = useLiveRide(ride._id, { onRideUpdate: handleRideUpdate });

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
    <div className="grid gap-6 lg:grid-cols-5">
      <div className="space-y-4 lg:col-span-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <RideStatusTimeline status={ride.status} />
            <button
              type="button"
              onClick={() => setSupportOpen(true)}
              className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-rose-600 transition-colors"
            >
              <ShieldAlert className="h-3.5 w-3.5 text-rose-500" /> Help
            </button>
          </div>

          {/* Vehicle Type & Fare Banner */}
          <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-50 px-3.5 py-2 text-xs border border-slate-200/80">
            <span className="font-bold text-slate-800 capitalize">
              {ride.vehicleType === "bike" ? "🏍️ RouteX Moto" : ride.vehicleType === "auto" ? "🛺 RouteX Auto" : ride.vehicleType === "sedan" ? "✨ RouteX Premier" : ride.vehicleType === "suv" ? "🚐 RouteX XL" : "🚗 RouteX Go"}
            </span>
            {ride.estimatedFare && (
              <span className="font-semibold text-slate-600">
                Upfront Fare: <strong className="text-slate-900 font-mono">₹{ride.estimatedFare}</strong>
              </span>
            )}
          </div>

          <div className="mt-3 space-y-1.5 rounded-xl bg-slate-50 p-3.5 text-sm">
            <div className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
              <span className="text-slate-600">{ride.pickup?.address}</span>
            </div>
            <div className="flex items-start gap-2">
              <Navigation className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-500" />
              <span className="text-slate-600">{ride.destination?.address}</span>
            </div>
          </div>

          <div className="mt-4">
            {ride.status === "requested" && ride.matchedDriver && (
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 shrink-0 animate-spin text-brand-500" />
                <div>
                  <p className="font-semibold text-slate-900">{copy.title}</p>
                  <p className="text-sm text-slate-500">{copy.description}</p>
                </div>
              </div>
            )}
            {ride.status === "requested" && !ride.matchedDriver && (
              <div>
                <p className="font-semibold text-amber-700">Finding nearby driver...</p>
                <p className="text-sm text-slate-500">
                  Scanning active drivers within 30km of your pickup location.
                </p>
              </div>
            )}
            {copy && ride.status !== "requested" && (
              <div>
                <p className="font-semibold text-slate-900">{copy.title}</p>
                <p className="text-sm text-slate-500">{copy.description}</p>
              </div>
            )}
          </div>

          {ride.driver && (
            <div className="mt-4">
              <PersonInfoCard person={ride.driver} roleLabel="Your driver" />
            </div>
          )}

          {/* Uber-style 4-Digit Ride Start PIN */}
          {ride.status === "accepted" && (
            <div className="mt-4 rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50/95 via-blue-50/60 to-white p-4 text-center shadow-sm">
              <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-indigo-900 uppercase tracking-wider">
                <ShieldCheck className="h-4 w-4 text-indigo-600" /> Start Ride PIN / OTP
              </div>
              <p className="mt-1 text-[11px] text-slate-500">
                Share this 4-digit code with your driver when you enter the car:
              </p>
              <div className="mt-2.5 flex items-center justify-center gap-2">
                {(ride.otp || String((parseInt(String(ride._id).slice(-4), 16) % 9000) + 1000))
                  .split("")
                  .map((digit, idx) => (
                    <span
                      key={idx}
                      className="flex h-11 w-10 items-center justify-center rounded-xl border border-indigo-300 bg-white font-mono text-xl font-black text-indigo-950 shadow-sm transition-transform hover:scale-105"
                    >
                      {digit}
                    </span>
                  ))}
              </div>
            </div>
          )}

          {canCancel && (
            <div className="mt-5">
              <Button fullWidth variant="secondary" icon={XCircle} loading={cancelling} onClick={handleCancel}>
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

      <div className="lg:col-span-3">
        <MapView
          center={pickupPoint}
          pickup={pickupPoint}
          destination={destinationPoint}
          driverLocation={driverLocation}
          rideStatus={ride.status}
          className="h-80 w-full lg:h-full lg:min-h-[420px]"
        />
      </div>
    </div>
  );
}
