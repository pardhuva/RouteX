import { useState, useEffect, useCallback } from "react";
import { Radio, RefreshCw, Car, CheckCircle2, AlertCircle } from "lucide-react";
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
    return <Loader fullScreen label="Connecting to Live Fleet Telemetry..." />;
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
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-sky-600 text-white font-black text-xs">
              <Radio className="h-3.5 w-3.5" />
            </span>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">Live Driver Fleet Telemetry</h1>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Real-time GPS positions, active statuses, and citywide vehicle coverage.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button variant="secondary" size="sm" icon={RefreshCw} onClick={loadData}>
            Refresh Fleet
          </Button>
          <div className="flex items-center gap-1 rounded-xl bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 border border-emerald-200/60">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Live GPS Sync (10s)
          </div>
        </div>
      </div>

      {/* Fleet Status Counters */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Tracked</div>
          <div className="mt-1 text-2xl font-black text-slate-900">{fleetDrivers.length}</div>
          <div className="mt-0.5 text-[11px] text-slate-400">In platform registry</div>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-sm">
          <div className="text-xs font-bold uppercase tracking-wider text-emerald-700">Available (Online)</div>
          <div className="mt-1 text-2xl font-black text-emerald-700">{availableCount}</div>
          <div className="mt-0.5 text-[11px] text-emerald-600">Ready for dispatch</div>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 shadow-sm">
          <div className="text-xs font-bold uppercase tracking-wider text-amber-700">On Active Trip</div>
          <div className="mt-1 text-2xl font-black text-amber-700">{busyCount}</div>
          <div className="mt-0.5 text-[11px] text-amber-600">En route / driving</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Offline</div>
          <div className="mt-1 text-2xl font-black text-slate-600">{offlineCount}</div>
          <div className="mt-0.5 text-[11px] text-slate-400">Not broadcasting</div>
        </div>
      </div>

      {/* Live Interactive Map */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm p-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
          <span className="text-xs font-bold text-slate-700">OpenStreetMap Live Telemetry & Spatial Dispersion</span>
          <div className="flex items-center gap-3 text-xs font-semibold">
            <span className="flex items-center gap-1.5 text-emerald-700">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Online Driver
            </span>
            <span className="flex items-center gap-1.5 text-amber-700">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> Busy Trip
            </span>
          </div>
        </div>
        <AdminFleetMap drivers={fleetDrivers} className="h-[600px] w-full rounded-xl" />
      </div>
    </div>
  );
}
