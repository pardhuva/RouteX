import { useCallback, useEffect, useState } from "react";
import { MapPin, Navigation, PlayCircle, CheckCircle2, ShieldCheck } from "lucide-react";
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

export default function DriverActiveRidePanel({ ride, driver, onRideChange }) {
  const { showToast } = useToast();
  const [busy, setBusy] = useState(false);

  const [myLocation, setMyLocation] = useState(() => {
    const coords = driver?.currentLocation?.coordinates;
    if (coords && (coords[0] !== 0 || coords[1] !== 0)) {
      return { latitude: coords[1], longitude: coords[0] };
    }
    try {
      const cached = localStorage.getItem("routex_driver_last_loc");
      if (cached) return JSON.parse(cached);
    } catch (_) {}
    return null;
  });

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
          try {
            localStorage.setItem("routex_driver_last_loc", JSON.stringify({ latitude, longitude }));
          } catch (_) {}
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
        setPinError("Please enter the 4-digit PIN provided by the passenger.");
        return;
      }
      setBusy(true);
      setPinError("");
      try {
        const res = await rideApi.startRide(ride._id, pin.trim());
        onRideChange(res.data.data.ride);
        showToast("PIN verified! Ride in progress.", "success");
      } catch (err) {
        const msg = getErrorMessage(err, "Invalid Start PIN. Please verify with the passenger.");
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
      showToast("Trip completed! 80% payout allocated to your earnings.", "success");
    } catch (err) {
      showToast(getErrorMessage(err, "We couldn't complete this ride."), "error");
    } finally {
      setBusy(false);
    }
  }, [ride._id, onRideChange, showToast]);

  const pickupPoint = toLatLng(ride.pickup);
  const destinationPoint = toLatLng(ride.destination);

  return (
    <div className="grid gap-5 lg:grid-cols-12 lg:items-stretch">
      {/* Left Operations Control Panel (5 cols) */}
      <div className="lg:col-span-5 space-y-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs">
          <RideStatusTimeline status={ride.status} />

          <div className="mt-3.5">
            <PersonInfoCard person={ride.rider} roleLabel="Passenger" />
          </div>

          <div className="mt-3 space-y-1.5 rounded-lg bg-slate-50 p-2.5 text-xs border border-slate-100">
            <div className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Pickup</span>
                <p className="font-medium text-slate-800">{ride.pickup?.address}</p>
              </div>
            </div>
            <div className="border-t border-slate-200/50 pt-1.5 flex items-start gap-2">
              <Navigation className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-600" />
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Destination</span>
                <p className="font-medium text-slate-800">{ride.destination?.address}</p>
              </div>
            </div>
          </div>

          <div className="mt-4">
            {ride.status === "accepted" && (
              <form onSubmit={handleStart} className="space-y-3">
                <div className="rounded-xl border border-brand-200 bg-brand-50/40 p-3.5 shadow-2xs">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-brand-900 uppercase tracking-wider">
                    <ShieldCheck className="h-3.5 w-3.5 text-brand-600" /> Enter Passenger's Start PIN
                  </div>
                  <p className="mt-0.5 text-[11px] text-slate-500">
                    Ask passenger for their 4-digit verification PIN:
                  </p>

                  <div className="mt-2.5">
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
                      placeholder="••••"
                      className="w-full text-center tracking-[0.6em] font-mono text-xl font-black rounded-lg border border-brand-300 bg-white py-1.5 text-slate-900 focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-500 shadow-inner"
                    />
                    {pinError && (
                      <p className="mt-1 text-center text-xs font-semibold text-rose-600">
                        {pinError}
                      </p>
                    )}
                  </div>
                </div>

                <Button
                  fullWidth
                  size="md"
                  variant="dark"
                  type="submit"
                  icon={PlayCircle}
                  loading={busy}
                  disabled={pin.length !== 4}
                  className="font-bold shadow-xs bg-slate-900 hover:bg-slate-800 text-white"
                >
                  Verify PIN & Start Trip
                </Button>
              </form>
            )}

            {ride.status === "started" && (
              <Button
                fullWidth
                size="lg"
                variant="dark"
                icon={CheckCircle2}
                loading={busy}
                onClick={handleComplete}
                className="font-bold bg-emerald-700 hover:bg-emerald-600 text-white shadow-xs"
              >
                Complete Trip & Settle Fare
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Right Dominant Live Map (7 cols) */}
      <div className="lg:col-span-7 flex flex-col gap-2.5">
        <div className="flex items-center justify-between rounded-xl bg-slate-900 text-white px-3.5 py-2 text-xs shadow-xs">
          <div className="flex items-center gap-2 font-medium">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px]">
              {ride.status === "accepted"
                ? "Navigating to passenger pickup location"
                : "Navigating passenger to drop-off point"}
            </span>
          </div>
          <span className="text-[10px] font-mono text-slate-400">Live GPS Sync Active</span>
        </div>

        <MapView
          center={myLocation || pickupPoint}
          pickup={pickupPoint}
          destination={destinationPoint}
          driverLocation={myLocation}
          rideStatus={ride.status}
          className="h-[380px] lg:h-full lg:min-h-[460px] rounded-xl shadow-xs border border-slate-200"
        />
      </div>
    </div>
  );
}
