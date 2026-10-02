import { useState, useEffect, useCallback } from "react";
import { MapPin, Navigation, Radio, CheckCircle, Clock, User, ArrowRight, Loader2, Sparkles } from "lucide-react";
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
      // Non-fatal fallback
    } finally {
      setLoading(false);
    }
  }, [isOnline]);

  useEffect(() => {
    fetchAvailableRides();
  }, [fetchAvailableRides]);

  // Real-time listener for incoming ride requests
  useSocketEvent(
    "new_ride_request",
    useCallback((payload) => {
      setRequests((prev) => {
        // Prevent duplicates
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

  // Real-time listener for when a ride is claimed by another driver or cancelled
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
      showToast("Ride accepted successfully! Navigation active.", "success");
      onRideAccepted(acceptedRide);
    } catch (err) {
      showToast(getErrorMessage(err, "This ride was already claimed or is no longer available."), "error");
      setRequests((prev) => prev.filter((r) => String(r._id) !== String(rideId)));
    } finally {
      setAcceptingId(null);
    }
  }

  if (!isOnline) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-200 text-slate-500">
          <Radio className="h-6 w-6" />
        </div>
        <h3 className="mt-3 text-base font-bold text-slate-800">You are currently offline</h3>
        <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
          Switch your status to <span className="font-semibold text-emerald-600">Online</span> above to start receiving live ride requests in your area (30km radius).
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
          <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">Available Ride Requests</h2>
          <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
            {requests.length} {requests.length === 1 ? "request" : "requests"}
          </span>
        </div>
        <Button variant="ghost" size="sm" onClick={fetchAvailableRides} className="text-xs text-slate-500">
          Refresh Pool
        </Button>
      </div>

      {loading && requests.length === 0 ? (
        <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white p-12 text-slate-400">
          <Loader2 className="h-6 w-6 animate-spin text-brand-600 mr-2" />
          <span className="text-sm font-medium">Scanning live driver requests (30km radius)...</span>
        </div>
      ) : requests.length === 0 ? (
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 mb-3">
            <Radio className="h-8 w-8 animate-pulse" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Radar Active — Searching for Nearby Requests</h3>
          <p className="mt-1 text-xs text-slate-500 max-w-md mx-auto">
            You are online and ready! When a rider requests a trip within your 30km coverage radius, it will appear right here with instant 1-tap acceptance.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {requests.map((ride) => {
            const pickupCoords = ride.pickup?.location?.coordinates;
            const destCoords = ride.destination?.location?.coordinates;
            const distance = calculateDistanceKm(pickupCoords, destCoords);
            const fallbackGross = distance > 0 ? Math.round(50 + distance * 15 + distance * 2 * 2) : 80;
            const gross = ride.grossFare || ride.fare || fallbackGross;
            const payout = ride.driverEarnings || Math.round(gross * 0.8 * 100) / 100;

            const isAccepting = acceptingId === ride._id;

            return (
              <div
                key={ride._id}
                className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-brand-500 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700 font-bold text-xs">
                      <User className="h-4 w-4 text-brand-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900">{ride.rider?.name || "Rider"}</span>
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700 capitalize border border-slate-200">
                          {ride.vehicleType ? `RouteX ${ride.vehicleType}` : "RouteX Go"}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Clock className="h-3 w-3" /> Live Dispatch Request
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-base font-black text-emerald-600">₹{payout}</div>
                    <div className="text-[10px] text-slate-400 font-medium">{distance > 0 ? `${distance} km · Net Payout (80%)` : "Net Payout (80%)"}</div>
                  </div>
                </div>

                {/* Route points */}
                <div className="my-4 space-y-2 text-xs">
                  <div className="flex items-start gap-2.5">
                    <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 font-bold text-[9px]">
                      P
                    </div>
                    <span className="line-clamp-2 text-slate-700 font-medium">{ride.pickup?.address}</span>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 font-bold text-[9px]">
                      D
                    </div>
                    <span className="line-clamp-2 text-slate-700 font-medium">{ride.destination?.address}</span>
                  </div>
                </div>

                {/* Action button */}
                <Button
                  type="button"
                  fullWidth
                  size="md"
                  onClick={() => handleAccept(ride._id)}
                  loading={isAccepting}
                  icon={CheckCircle}
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold shadow-sm"
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
