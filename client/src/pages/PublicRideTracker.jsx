import { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { io } from "socket.io-client";
import {
  ShieldAlert,
  ShieldCheck,
  Phone,
  Car,
  MapPin,
  Clock,
  Radio,
  ExternalLink,
  AlertTriangle,
  RefreshCw,
  Share2,
  CheckCircle2,
  Navigation,
} from "lucide-react";
import MapView from "../components/MapView";
import Loader from "../components/Loader";
import Button from "../components/Button";
import * as rideApi from "../services/rideApi";
import { formatTimeAgo, formatShortDate } from "../utils/format";

export default function PublicRideTracker() {
  const { trackingToken } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rideData, setRideData] = useState(null);
  const [driverLocation, setDriverLocation] = useState(null);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState(Date.now());
  const socketRef = useRef(null);

  const fetchTrackingData = async (showLoader = true) => {
    if (showLoader) setLoading(true);
    try {
      const res = await rideApi.getPublicRideTracking(trackingToken);
      const data = res.data.data;
      setRideData(data);
      if (data.liveLocation?.latitude && data.liveLocation?.longitude) {
        setDriverLocation({
          latitude: data.liveLocation.latitude,
          longitude: data.liveLocation.longitude,
        });
      }
      setError(null);
      setLastRefreshed(Date.now());
    } catch (err) {
      setError(err.response?.data?.message || "Trip tracking link is invalid or expired.");
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrackingData(true);
  }, [trackingToken]);

  // Socket.IO real-time stream
  useEffect(() => {
    if (!trackingToken) return;

    const socketUrl = import.meta.env.VITE_WS_URL || "http://localhost:5000";
    const socket = io(socketUrl, {
      auth: { isGuest: true, trackingToken },
      transports: ["websocket", "polling"],
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setIsSocketConnected(true);
      socket.emit("join_tracking", { trackingToken });
    });

    socket.on("disconnect", () => {
      setIsSocketConnected(false);
    });

    socket.on("driver_location_updated", (payload) => {
      if (payload.latitude && payload.longitude) {
        setDriverLocation({
          latitude: payload.latitude,
          longitude: payload.longitude,
        });
        setLastRefreshed(Date.now());
      }
    });

    socket.on("ride_status_updated", (payload) => {
      setRideData((prev) => (prev ? { ...prev, status: payload.status } : prev));
      fetchTrackingData(false);
    });

    socket.on("safety_alert_created", (payload) => {
      setRideData((prev) =>
        prev
          ? {
              ...prev,
              safety: {
                ...prev.safety,
                hasActiveAlert: true,
                status: "alert_active",
              },
            }
          : prev
      );
    });

    socket.on("safety_confirmation_updated", (payload) => {
      setRideData((prev) =>
        prev
          ? {
              ...prev,
              safety: {
                ...prev.safety,
                hasActiveAlert: false,
                safeConfirmationAt: payload.safeConfirmationAt || new Date().toISOString(),
                status: "reached_safely",
              },
            }
          : prev
      );
    });

    return () => {
      socket.disconnect();
    };
  }, [trackingToken]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <Loader fullScreen label="Connecting to live trip telemetry..." />
      </div>
    );
  }

  if (error || !rideData) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-950 p-6 text-center text-white shadow-2xl">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/20 text-rose-400">
            <AlertTriangle className="h-7 w-7" />
          </div>
          <h2 className="mt-4 text-xl font-bold">Tracking Link Unavailable</h2>
          <p className="mt-2 text-xs text-slate-400 leading-relaxed">{error}</p>
          <div className="mt-6 flex flex-col gap-2">
            <Button variant="primary" onClick={() => fetchTrackingData(true)} icon={RefreshCw}>
              Retry Connection
            </Button>
            <Link
              to="/"
              className="inline-flex items-center justify-center rounded-xl py-2.5 text-xs font-semibold text-slate-400 hover:text-white"
            >
              Back to RouteX Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { status, pickup, destination, rider, driver, vehicleType, safety } = rideData;
  const isSafetyAlert = safety?.status === "alert_active";
  const isReachedSafely = safety?.status === "reached_safely";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Emergency & Brand Navigation Header */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md px-4 py-3 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white font-black text-sm shadow-md">
              RX
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-white tracking-tight">RouteX Safety Guardian</span>
                <span className="rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold">
                  LIVE
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Shared live trip tracking for <strong className="text-slate-200">{rider?.name}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="tel:112"
              className="flex items-center gap-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white px-3 py-1.5 text-xs font-bold transition-all shadow-md shadow-rose-600/20"
            >
              <Phone className="h-3.5 w-3.5" />
              <span>Call 112 (Police)</span>
            </a>
            <button
              onClick={() => fetchTrackingData(false)}
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-700 bg-slate-800 text-slate-300 hover:text-white transition-colors"
              title="Refresh tracking"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Safety Alert Warning Banner */}
      {isSafetyAlert && (
        <div className="bg-rose-600 text-white px-4 py-3 shadow-lg border-b border-rose-700 animate-pulse">
          <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <ShieldAlert className="h-6 w-6 shrink-0" />
              <div>
                <p className="text-sm font-black tracking-wide uppercase">🚨 Safety Alert Triggered on this Trip</p>
                <p className="text-xs text-rose-100">
                  {rider?.name} triggered an emergency alert. Central safety response team has been alerted.
                </p>
              </div>
            </div>
            <a
              href="tel:112"
              className="rounded-xl bg-white text-rose-700 px-3.5 py-1.5 text-xs font-black hover:bg-rose-50 transition-colors shadow-sm"
            >
              Emergency Police (112)
            </a>
          </div>
        </div>
      )}

      {/* Safe Arrival Banner */}
      {isReachedSafely && (
        <div className="bg-emerald-600 text-white px-4 py-2.5 shadow-md border-b border-emerald-700">
          <div className="max-w-6xl mx-auto flex items-center gap-2 text-xs font-bold">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>
              {rider?.name} confirmed: <strong>"I've Reached Safely"</strong>
              {safety.safeConfirmationAt && ` (${formatTimeAgo(safety.safeConfirmationAt)})`}
            </span>
          </div>
        </div>
      )}

      {/* Main Content Layout */}
      <main className="max-w-6xl mx-auto w-full p-4 grid gap-5 lg:grid-cols-3 flex-1">
        {/* Left 2 Cols: Live Map */}
        <div className="lg:col-span-2 flex flex-col gap-3">
          <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 shadow-xl h-[420px] lg:h-[540px]">
            <MapView
              pickup={pickup?.location?.coordinates ? { latitude: pickup.location.coordinates[1], longitude: pickup.location.coordinates[0] } : null}
              destination={destination?.location?.coordinates ? { latitude: destination.location.coordinates[1], longitude: destination.location.coordinates[0] } : null}
              driverLocation={driverLocation}
              interactive={true}
              className="h-full w-full"
            />

            {/* Live GPS Telemetry Badge Overlay */}
            <div className="absolute top-3 left-3 z-20 flex items-center gap-2 rounded-xl bg-slate-950/80 backdrop-blur-md border border-slate-800/80 px-3 py-1.5 text-xs text-slate-300 shadow-lg">
              <span className={`h-2 w-2 rounded-full ${isSocketConnected ? "bg-emerald-400 animate-ping" : "bg-amber-400"}`} />
              <span className="font-semibold">{isSocketConnected ? "Live Telematics Active" : "Connecting..."}</span>
              {driverLocation && (
                <span className="text-[10px] text-slate-500 font-mono hidden sm:inline">
                  ({driverLocation.latitude.toFixed(4)}, {driverLocation.longitude.toFixed(4)})
                </span>
              )}
            </div>

            {/* Google Maps External Open Button */}
            {driverLocation && (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${driverLocation.latitude},${driverLocation.longitude}`}
                target="_blank"
                rel="noreferrer"
                className="absolute bottom-3 right-3 z-20 flex items-center gap-1.5 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-slate-800 transition-colors shadow-lg"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span>Open in Google Maps</span>
              </a>
            )}
          </div>
        </div>

        {/* Right Col: Trip Status & Driver Details */}
        <div className="space-y-4 flex flex-col">
          {/* Trip Status Card */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-lg space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Live Trip Status</span>
              <span
                className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase ${
                  status === "completed"
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : status === "started"
                    ? "bg-sky-500/20 text-sky-400 border border-sky-500/30"
                    : status === "accepted"
                    ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30"
                    : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                }`}
              >
                {status === "started" ? "Trip In Progress" : status}
              </span>
            </div>

            {/* Route Stops */}
            <div className="space-y-2.5 pt-1 text-xs">
              <div className="flex items-start gap-2.5">
                <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <span className="text-[10px] font-bold">P</span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] font-bold text-slate-400">Pickup Location</div>
                  <div className="truncate font-semibold text-slate-200">{pickup?.address}</div>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  <span className="text-[10px] font-bold">D</span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] font-bold text-slate-400">Destination</div>
                  <div className="truncate font-semibold text-slate-200">{destination?.address}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Assigned Driver & Vehicle Card */}
          {driver ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-lg space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Verified Driver</span>
                <span className="text-xs font-bold text-amber-400">★ {driver.rating?.toFixed(1) || "5.0"}</span>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600/20 text-indigo-400 font-black text-lg border border-indigo-500/30">
                  {driver.name ? driver.name.charAt(0).toUpperCase() : "D"}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-white text-sm truncate">{driver.name}</h3>
                  <p className="text-xs text-slate-400 capitalize">{vehicleType} Partner</p>
                </div>
              </div>

              {driver.vehicle && (
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-white">
                      {driver.vehicle.brand} {driver.vehicle.model}
                    </div>
                    <div className="text-[10px] text-slate-400 capitalize">{driver.vehicle.color || "Standard"}</div>
                  </div>
                  <div className="rounded-lg bg-slate-800 border border-slate-700 px-2.5 py-1 font-mono text-xs font-black text-slate-100">
                    {driver.vehicle.registrationNumber}
                  </div>
                </div>
              )}

              {driver.phone && (
                <a
                  href={`tel:${driver.phone}`}
                  className="flex items-center justify-center gap-2 w-full rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 py-2.5 text-xs font-bold text-white transition-colors"
                >
                  <Phone className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Call Driver ({driver.phone})</span>
                </a>
              )}
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 text-center shadow-lg">
              <Car className="mx-auto h-8 w-8 text-slate-600 mb-2" />
              <p className="text-xs text-slate-400 font-semibold">Matching with nearby verified driver...</p>
            </div>
          )}

          {/* Emergency Helplines Quick Access */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-brand-400" /> Emergency Hotlines
            </span>
            <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
              <a
                href="tel:112"
                className="flex items-center justify-center gap-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 p-2 font-bold text-rose-400 border border-slate-700/80 transition-colors"
              >
                <span>Police: 112</span>
              </a>
              <a
                href="tel:108"
                className="flex items-center justify-center gap-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 p-2 font-bold text-amber-400 border border-slate-700/80 transition-colors"
              >
                <span>Ambulance: 108</span>
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
