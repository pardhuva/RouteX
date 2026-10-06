import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, History } from "lucide-react";
import BookingPanel from "../../components/rider/BookingPanel";
import ActiveRidePanel from "../../components/rider/ActiveRidePanel";
import RideCard from "../../components/RideCard";
import Loader from "../../components/Loader";
import ErrorState from "../../components/ErrorState";
import EmptyState from "../../components/EmptyState";
import { useAuth } from "../../context/AuthContext";
import * as rideApi from "../../services/rideApi";
import { getErrorMessage } from "../../services/api";

const ACTIVE_STATUSES = ["requested", "accepted", "started"];

export default function RiderDashboard() {
  const { user } = useAuth();
  const [rides, setRides] = useState([]);
  const [activeRide, setActiveRide] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadRides = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await rideApi.getMyRides({ page: 1, limit: 5 });
      const fetchedRides = res.data.data.rides || [];
      setRides(fetchedRides);
      const active = fetchedRides.find((r) => ACTIVE_STATUSES.includes(r.status));
      setActiveRide((prev) => {
        if (prev && prev.status === "completed") return prev;
        return active || null;
      });
    } catch (err) {
      setError(getErrorMessage(err, "We couldn't load your rides."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRides();
  }, [loadRides]);

  if (loading && rides.length === 0) return <Loader fullScreen label="Loading your dashboard..." />;
  if (error && rides.length === 0) return <ErrorState message={error} onRetry={loadRides} />;

  const recentRides = rides.filter((r) => r._id !== activeRide?._id).slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Top Welcome Strip */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
            {activeRide ? "Live Trip Monitor" : `Welcome back, ${user.name.split(" ")[0]}`}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {activeRide
              ? "Live GPS tracking and ride lifecycle in progress."
              : "Set your pickup and drop-off to view guaranteed upfront fares."}
          </p>
        </div>
      </div>

      {activeRide ? (
        <ActiveRidePanel
          ride={activeRide}
          onRideChange={(updater) => setActiveRide((prev) => (prev ? updater(prev) : prev))}
          onCancelled={() => setActiveRide(null)}
        />
      ) : (
        <BookingPanel onRideCreated={setActiveRide} />
      )}

      {/* Recent Trips */}
      {!activeRide && (
        <div className="pt-2">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Recent Trips</h2>
              <p className="text-[11px] text-slate-500">Your most recent ride history</p>
            </div>
            <Link
              to="/rider/history"
              className="flex items-center gap-1 text-xs font-bold text-brand-600 hover:text-brand-700"
            >
              View all trips <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {recentRides.length === 0 ? (
            <EmptyState
              icon={History}
              title="No rides yet"
              description="Your completed and ongoing trips will appear here."
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {recentRides.map((ride) => (
                <RideCard key={ride._id} ride={ride} role="rider" />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
