import { useCallback, useEffect, useState } from "react";
import DriverOnboarding from "../../components/driver/DriverOnboarding";
import AvailabilityToggle from "../../components/driver/AvailabilityToggle";
import AvailableRideRequests from "../../components/driver/AvailableRideRequests";
import AcceptByIdCard from "../../components/driver/AcceptByIdCard";
import DriverActiveRidePanel from "../../components/driver/DriverActiveRidePanel";
import IncomingRideRequestModal from "../../components/driver/IncomingRideRequestModal";
import Loader from "../../components/Loader";
import ErrorState from "../../components/ErrorState";
import { useIncomingRideRequest } from "../../hooks/useIncomingRideRequest";
import * as driverApi from "../../services/driverApi";
import * as rideApi from "../../services/rideApi";
import { getErrorMessage } from "../../services/api";

import { Link } from "react-router-dom";
import { Wallet, ArrowRight, Car, TrendingUp, ShieldCheck, Activity } from "lucide-react";

const ACTIVE_STATUSES = ["accepted", "started"];

export default function DriverDashboard() {
  const [driver, setDriver] = useState(null);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [activeRide, setActiveRide] = useState(null);
  const [earningsSummary, setEarningsSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { request, clear } = useIncomingRideRequest();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const profileRes = await driverApi.getMyDriverProfile();
      const driverData = profileRes.data.data.driver;
      setDriver(driverData);
      setNeedsOnboarding(false);

      // Fetch quick earnings pulse
      driverApi
        .getDriverEarningsSummary()
        .then((res) => setEarningsSummary(res.data.data))
        .catch(() => {});

      if (driverData.status === "busy") {
        const ridesRes = await rideApi.getMyRides({ page: 1, limit: 5 });
        const current = ridesRes.data.data.rides.find((r) => ACTIVE_STATUSES.includes(r.status));
        setActiveRide(current || null);
      } else {
        setActiveRide(null);
      }
    } catch (err) {
      if (err.response?.status === 404) {
        setNeedsOnboarding(true);
      } else {
        setError(getErrorMessage(err, "We couldn't load your driver dashboard."));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Continuously sync driver's live GPS coordinates while online so 30km radius matching stays accurate
  useEffect(() => {
    if (driver?.status !== "available" || !navigator.geolocation) return;

    let lastSent = 0;
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const now = Date.now();
        // Throttle updates to at most once every 15 seconds to avoid API overload
        if (now - lastSent > 15000) {
          lastSent = now;
          driverApi.updateDriverLocation([pos.coords.longitude, pos.coords.latitude]).catch(() => {});
        }
      },
      (err) => {
        console.warn("[DriverDashboard] Geolocation watch error:", err.message);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 10000 }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [driver?.status]);

  function handleRideAccepted(ride) {
    clear();
    setDriver((prev) => (prev ? { ...prev, status: "busy" } : prev));
    setActiveRide(ride);
  }

  function handleRideChange(ride) {
    setActiveRide(ride);
    if (ride.status === "completed") {
      setDriver((prev) => (prev ? { ...prev, status: "available" } : prev));
      setTimeout(() => setActiveRide(null), 2500);
    }
  }

  if (loading) return <Loader fullScreen label="Initializing driver console..." />;
  if (needsOnboarding) return <DriverOnboarding onComplete={() => load()} />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!driver) return null;

  const vehicleStr = driver.vehicle
    ? `${driver.vehicle.brand} ${driver.vehicle.model}`
    : "Vehicle Connected";

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Driver Dashboard
          </h1>
          <div className="mt-1 flex flex-wrap items-center gap-2.5 text-xs text-slate-600">
            <span className="flex items-center gap-1 font-semibold text-slate-800">
              <Car className="h-3.5 w-3.5 text-brand-600" /> {vehicleStr}
            </span>
            {driver.vehicle?.registrationNumber && (
              <>
                <span className="text-slate-300">•</span>
                <span className="bg-slate-100 text-slate-800 font-semibold px-2 py-0.5 rounded border border-slate-200">
                  {driver.vehicle.registrationNumber}
                </span>
              </>
            )}
            <span className="text-slate-300">•</span>
            <span className="text-emerald-700 font-semibold">80% Payout</span>
          </div>
        </div>

        <div className="w-full sm:w-auto">
          <AvailabilityToggle
            status={driver.status}
            onStatusChange={(status) => setDriver((prev) => ({ ...prev, status }))}
          />
        </div>
      </div>

      {/* Quick Earnings & Operational Snapshot */}
      {earningsSummary && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                <Wallet className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Today's Net Earnings (80%)</p>
                <p className="text-xl font-bold text-slate-900">
                  ₹{earningsSummary.earnings.today.net.toLocaleString()}
                </p>
              </div>
            </div>
            <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-1 rounded">
              {earningsSummary.earnings.today.trips} trips
            </span>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-brand-600">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">This Week's Net</p>
                <p className="text-xl font-bold text-slate-900">
                  ₹{earningsSummary.earnings.thisWeek.net.toLocaleString()}
                </p>
              </div>
            </div>
            <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-1 rounded">
              {earningsSummary.earnings.thisWeek.trips} trips
            </span>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Weekly Settlements</p>
                <p className="text-xs font-semibold text-slate-700 mt-0.5">Automated bank transfers</p>
              </div>
            </div>
            <Link
              to="/driver/earnings"
              className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-800"
            >
              Statement <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      )}

      {/* Main Operations Canvas */}
      {activeRide ? (
        <DriverActiveRidePanel ride={activeRide} driver={driver} onRideChange={handleRideChange} />
      ) : (
        <div className="space-y-6">
          <AvailableRideRequests
            isOnline={driver.status === "available"}
            onRideAccepted={handleRideAccepted}
          />
          {driver.status === "available" && (
            <div className="pt-2">
              <AcceptByIdCard onAccepted={handleRideAccepted} />
            </div>
          )}
        </div>
      )}

      <IncomingRideRequestModal request={request} onAccepted={handleRideAccepted} onDismiss={clear} />
    </div>
  );
}
