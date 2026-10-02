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
import { Wallet, ArrowRight } from "lucide-react";

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

  if (loading) return <Loader fullScreen label="Loading your dashboard..." />;
  if (needsOnboarding) return <DriverOnboarding onComplete={() => load()} />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!driver) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Driver Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">
          {driver.vehicle ? `${driver.vehicle.brand} ${driver.vehicle.model} · ${driver.vehicle.registrationNumber}` : "Your vehicle"}
        </p>
      </div>

      <AvailabilityToggle status={driver.status} onStatusChange={(status) => setDriver((prev) => ({ ...prev, status }))} />

      {/* Quick Earnings Pulse */}
      {earningsSummary && (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">Today's Earnings</p>
              <p className="text-lg font-black text-slate-900">
                ₹{earningsSummary.earnings.today.net.toLocaleString()}
                <span className="ml-2 text-xs font-medium text-slate-400">
                  ({earningsSummary.earnings.today.trips} trips)
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden sm:block text-right">
              <p className="text-xs font-medium text-slate-500">This Week</p>
              <p className="text-sm font-bold text-slate-800">
                ₹{earningsSummary.earnings.thisWeek.net.toLocaleString()}
              </p>
            </div>

            <Link
              to="/driver/earnings"
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800"
            >
              Financial Analytics <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      )}

      {activeRide ? (
        <DriverActiveRidePanel ride={activeRide} onRideChange={handleRideChange} />
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
