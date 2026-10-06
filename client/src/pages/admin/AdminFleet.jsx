import { useState, useEffect, useCallback } from "react";
import { Radio, RefreshCw, Car, Activity, MapPin, Zap } from "lucide-react";
import Button from "../../components/Button";
import Loader from "../../components/Loader";
import ErrorState from "../../components/ErrorState";
import AdminFleetMap from "../../components/admin/AdminFleetMap";
import * as adminApi from "../../services/adminApi";
import { getErrorMessage } from "../../services/api";

export default function AdminFleet() {
  const [fleetDrivers, setFleetDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.getLiveFleetMap();
      setFleetDrivers(res.data.data.drivers || []);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load live fleet telemetry."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    // Auto-refresh fleet location every 10 seconds
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, [loadData]);

  if (loading && fleetDrivers.length === 0) {
    return <Loader fullScreen label="Connecting to Live GPS Spatial Mesh..." />;
  }

  if (error && fleetDrivers.length === 0) {
    return <ErrorState message={error} onRetry={loadData} />;
  }

  const availableCount = fleetDrivers.filter((d) => d.status === "available").length;
  const busyCount = fleetDrivers.filter((d) => d.status === "busy").length;
  const offlineCount = fleetDrivers.filter((d) => d.status === "offline").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Live Fleet Map
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Real-time driver locations, current availability, and active trip navigation.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button variant="secondary" size="sm" icon={RefreshCw} onClick={loadData}>
            Refresh Fleet
          </Button>
          <div className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-800 border border-emerald-200">
            <span className="h-2 w-2 rounded-full bg-emerald-600 animate-pulse" />
            Live (10s auto-refresh)
          </div>
        </div>
      </div>

      {/* Fleet Status Counters */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Total Drivers
          </div>
          <div className="mt-1 text-2xl font-bold text-slate-900">{fleetDrivers.length}</div>
          <div className="mt-1 text-xs text-slate-400">Registered platform partners</div>
        </div>

        <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 shadow-xs">
          <div className="text-xs font-semibold uppercase tracking-wider text-emerald-800">
            Available (Online)
          </div>
          <div className="mt-1 text-2xl font-bold text-emerald-700">{availableCount}</div>
          <div className="mt-1 text-xs text-emerald-600">Ready to accept ride requests</div>
        </div>

        <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-4 shadow-xs">
          <div className="text-xs font-semibold uppercase tracking-wider text-amber-800">
            On Active Trip
          </div>
          <div className="mt-1 text-2xl font-bold text-amber-700">{busyCount}</div>
          <div className="mt-1 text-xs text-amber-600">En route / Passenger aboard</div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 shadow-xs">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Offline
          </div>
          <div className="mt-1 text-2xl font-bold text-slate-600">{offlineCount}</div>
          <div className="mt-1 text-xs text-slate-400">Not currently taking rides</div>
        </div>
      </div>

      {/* Live Interactive Map */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs p-4">
        <div className="flex flex-wrap items-center justify-between pb-3 border-b border-slate-100 mb-3 gap-2">
          <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
            <MapPin className="h-4 w-4 text-brand-600" />
            Live Fleet Map
          </span>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5 text-emerald-800 font-medium">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-600" /> Available Driver
            </span>
            <span className="flex items-center gap-1.5 text-amber-800 font-medium">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> On Ride
            </span>
          </div>
        </div>
        <AdminFleetMap drivers={fleetDrivers} className="h-[620px] w-full rounded-lg" />
      </div>
    </div>
  );
}
