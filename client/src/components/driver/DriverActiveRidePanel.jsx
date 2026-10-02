import { useCallback, useEffect, useState } from "react";
import { MapPin, Navigation, PlayCircle, CheckCircle2, ShieldCheck, KeyRound } from "lucide-react";
import MapView from "../MapView";
import RideStatusTimeline from "../RideStatusTimeline";
import PersonInfoCard from "../PersonInfoCard";
import Button from "../Button";
import { useJoinRideRoom } from "../../hooks/useJoinRideRoom";
import { sendDriverLocation } from "../../services/socket";
import * as rideApi from "../../services/rideApi";
import { getErrorMessage } from "../../services/api";
import { useToast } from "../../context/ToastContext";

const LOCATION_BROADCAST_INTERVAL_MS = 4000;

function toLatLng(point) {
  if (!point?.location?.coordinates) return null;
  const [longitude, latitude] = point.location.coordinates;
  return { latitude, longitude };
}

export default function DriverActiveRidePanel({ ride, onRideChange }) {
  const { showToast } = useToast();
  const [busy, setBusy] = useState(false);
  const [myLocation, setMyLocation] = useState(null);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState("");

  useJoinRideRoom(ride._id);

  useEffect(() => {
    if (!navigator.geolocation) return undefined;

    const broadcast = () => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setMyLocation({ latitude, longitude });
          sendDriverLocation(ride._id, latitude, longitude);
        },
        () => {},
        { enableHighAccuracy: true, timeout: 5000 }
      );
    };

    broadcast();
    const interval = setInterval(broadcast, LOCATION_BROADCAST_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [ride._id]);

  const handleStart = useCallback(
    async (e) => {
      if (e) e.preventDefault();
      if (pin.trim().length !== 4) {
        setPinError("Please enter the 4-digit PIN provided by the rider.");
        return;
      }
      setBusy(true);
      setPinError("");
      try {
        const res = await rideApi.startRide(ride._id, pin.trim());
        onRideChange(res.data.data.ride);
        showToast("PIN verified! Ride started.", "success");
      } catch (err) {
        const msg = getErrorMessage(err, "Invalid Start PIN. Please check with the passenger.");
        setPinError(msg);
        showToast(msg, "error");
      } finally {
        setBusy(false);
      }
    },
    [ride._id, pin, onRideChange, showToast]
  );

  const handleComplete = useCallback(async () => {
    setBusy(true);
    try {
      const res = await rideApi.completeRide(ride._id);
      onRideChange(res.data.data.ride);
      showToast("Ride completed.", "success");
    } catch (err) {
      showToast(getErrorMessage(err, "We couldn't complete this ride."), "error");
    } finally {
      setBusy(false);
    }
  }, [ride._id, onRideChange, showToast]);

  const pickupPoint = toLatLng(ride.pickup);
  const destinationPoint = toLatLng(ride.destination);

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <div className="lg:col-span-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
          <RideStatusTimeline status={ride.status} />

          <div className="mt-4">
            <PersonInfoCard person={ride.rider} roleLabel="Rider" />
          </div>

          <div className="mt-4 space-y-1.5 rounded-xl bg-slate-50 p-3.5 text-sm">
            <div className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
              <span className="text-slate-600">{ride.pickup.address}</span>
            </div>
            <div className="flex items-start gap-2">
              <Navigation className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-500" />
              <span className="text-slate-600">{ride.destination.address}</span>
            </div>
          </div>

          <div className="mt-5">
            {ride.status === "accepted" && (
              <form onSubmit={handleStart} className="space-y-3">
                <div className="rounded-2xl border border-indigo-200 bg-indigo-50/50 p-4 shadow-xs">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900 uppercase tracking-wider">
                    <ShieldCheck className="h-4 w-4 text-indigo-600" /> Enter Passenger's Start PIN
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500">
                    Ask the passenger for their 4-digit PIN to verify passenger pickup:
                  </p>

                  <div className="mt-3">
                    <input
                      type="text"
                      maxLength={4}
                      pattern="[0-9]*"
                      inputMode="numeric"
                      value={pin}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "").slice(0, 4);
                        setPin(val);
                        setPinError("");
                      }}
                      placeholder="• • • •"
                      className="w-full text-center tracking-[0.75em] font-mono text-2xl font-black rounded-xl border border-indigo-300 bg-white py-2.5 text-indigo-950 placeholder-slate-300 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-inner"
                    />
                    {pinError && (
                      <p className="mt-1.5 text-center text-xs font-semibold text-rose-600">
                        {pinError}
                      </p>
                    )}
                  </div>
                </div>

                <Button
                  fullWidth
                  size="lg"
                  type="submit"
                  icon={PlayCircle}
                  loading={busy}
                  disabled={pin.length !== 4}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-md"
                >
                  Verify PIN & Start Ride
                </Button>
              </form>
            )}
            {ride.status === "started" && (
              <Button fullWidth size="lg" icon={CheckCircle2} loading={busy} onClick={handleComplete}>
                Complete Ride
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="lg:col-span-3">
        <MapView
          center={myLocation || pickupPoint}
          pickup={pickupPoint}
          destination={destinationPoint}
          driverLocation={myLocation}
          rideStatus={ride.status}
          className="h-80 w-full lg:h-full lg:min-h-[420px]"
        />

      </div>
    </div>
  );
}
