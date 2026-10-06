import { useState, useEffect, useCallback } from "react";
import { MapPin, Navigation, Radio, CheckCircle, Clock, User, ArrowRight, Loader2 } from "lucide-react";
import Button from "../Button";
import * as rideApi from "../../services/rideApi";
import { useSocketEvent } from "../../hooks/useSocketEvent";
import { useToast } from "../../context/ToastContext";
import { getErrorMessage } from "../../services/api";

function calculateDistanceKm(c1, c2) {
  if (!c1 || !c2) return 0;
  const R = 6371;
  const dLat = ((c2[1] - c1[1]) * Math.PI) / 180;
  const dLon = ((c2[0] - c1[0]) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((c1[1] * Math.PI) / 180) *
      Math.cos((c2[1] * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export default function AvailableRideRequests({ isOnline, onRideAccepted }) {
  const { showToast } = useToast();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acceptingId, setAcceptingId] = useState(null);

  const fetchAvailableRides = useCallback(async () => {
    if (!isOnline) {
      setRequests([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await rideApi.getAvailableRides();
      setRequests(res.data.data.rides || []);
    } catch (err) {
      // Non-fatal
    } finally {
      setLoading(false);
    }
  }, [isOnline]);

  useEffect(() => {
    fetchAvailableRides();
  }, [fetchAvailableRides]);

  useSocketEvent(
    "new_ride_request",
    useCallback((payload) => {
      setRequests((prev) => {
        if (prev.some((r) => String(r._id) === String(payload.rideId) || String(r._id) === String(payload._id))) {
          return prev;
        }
        const newRide = {
          _id: payload.rideId || payload._id,
          pickup: payload.pickup,
          destination: payload.destination,
          rider: payload.rider || { name: "Rider" },
          createdAt: payload.createdAt || new Date().toISOString(),
          status: "requested",
        };
        return [newRide, ...prev];
      });
    }, [])
  );

  useSocketEvent(
    "ride_claimed",
    useCallback((payload) => {
      setRequests((prev) => prev.filter((r) => String(r._id) !== String(payload.rideId)));
    }, [])
  );

  useSocketEvent(
    "ride_status_updated",
    useCallback((payload) => {
      if (payload.status === "accepted" || payload.status === "cancelled" || payload.status === "completed") {
        setRequests((prev) => prev.filter((r) => String(r._id) !== String(payload.rideId)));
      }
    }, [])
  );

  async function handleAccept(rideId) {
    setAcceptingId(rideId);
    try {
      const res = await rideApi.acceptRide(rideId);
      const acceptedRide = res.data.data.ride;
      showToast("Ride accepted! Proceed to pickup point.", "success");
      onRideAccepted(acceptedRide);
    } catch (err) {
      showToast(getErrorMessage(err, "This ride was claimed or is no longer available."), "error");
      setRequests((prev) => prev.filter((r) => String(r._id) !== String(rideId)));
    } finally {
      setAcceptingId(null);
    }
  }

  if (!isOnline) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/50 p-6 text-center">
        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-slate-200 text-slate-500">
          <Radio className="h-5 w-5" />
        </div>
        <h3 className="mt-2 text-sm font-bold text-slate-800">You are currently offline</h3>
        <p className="mt-0.5 text-xs text-slate-500 max-w-sm mx-auto">
          Turn your status to <strong className="text-emerald-700">Online</strong> above to start receiving live dispatches.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <h2 className="text-sm font-extrabold text-slate-900 tracking-tight">Available Dispatch Requests</h2>
          <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-800 border border-emerald-200">
            {requests.length} live
          </span>
        </div>
        <Button variant="ghost" size="sm" onClick={fetchAvailableRides} className="text-xs text-slate-500">
          Refresh Pool
        </Button>
      </div>

      {loading && requests.length === 0 ? (
        <div className="flex items-center justify-center rounded-xl border border-slate-200 bg-white p-8 text-slate-400">
          <Loader2 className="h-4 w-4 animate-spin text-brand-600 mr-2" />
          <span className="text-xs font-medium">Scanning live driver requests in your area...</span>
        </div>
      ) : requests.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-center shadow-xs">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-slate-50 text-emerald-600 border border-slate-200 mb-2">
            <Radio className="h-5 w-5 animate-pulse" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">Radar Active — Searching for Nearby Requests</h3>
          <p className="mt-0.5 text-xs text-slate-500 max-w-md mx-auto">
            Broadcasting live GPS location. Nearby ride requests within your coverage radius will appear here instantly.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {requests.map((ride) => {
            const pickupCoords = ride.pickup?.location?.coordinates;
            const destCoords = ride.destination?.location?.coordinates;
            const distance = calculateDistanceKm(pickupCoords, destCoords);
            const fallbackGross = distance > 0 ? Math.round(35 + distance * 11.5) : 60;
            const gross = ride.grossFare || ride.fare || fallbackGross;
            const payout = ride.driverEarnings || Math.round(gross * 0.8 * 100) / 100;

            const isAccepting = acceptingId === ride._id;

            return (
              <div
                key={ride._id}
                className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-xs hover:border-slate-300 transition-all"
              >
                <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-700 font-bold text-xs">
                      <User className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">{ride.rider?.name || "Passenger"}</div>
                      <div className="text-[10px] text-slate-400 capitalize">
                        {ride.vehicleType ? `RouteX ${ride.vehicleType}` : "RouteX Go"}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-sm font-black text-emerald-700">₹{payout}</div>
                    <div className="text-[10px] text-slate-400">{distance > 0 ? `${distance} km • 80% split` : "80% payout"}</div>
                  </div>
                </div>

                {/* Route points */}
                <div className="my-3 space-y-1.5 text-xs">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-3 w-3 shrink-0 text-emerald-600 mt-0.5" />
                    <span className="truncate text-slate-700 font-medium">{ride.pickup?.address}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Navigation className="h-3 w-3 shrink-0 text-brand-600 mt-0.5" />
                    <span className="truncate text-slate-700 font-medium">{ride.destination?.address}</span>
                  </div>
                </div>

                <Button
                  type="button"
                  fullWidth
                  size="sm"
                  variant="dark"
                  onClick={() => handleAccept(ride._id)}
                  loading={isAccepting}
                  icon={CheckCircle}
                  className="font-bold shadow-2xs"
                >
                  Accept Ride (Earn ₹{payout})
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
