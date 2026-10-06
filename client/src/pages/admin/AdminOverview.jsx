import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Wallet,
  Car,
  Users,
  Clock,
  RefreshCw,
  Percent,
  Radio,
  ArrowRight,
  TrendingUp,
  Activity,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";
import Button from "../../components/Button";
import Loader from "../../components/Loader";
import ErrorState from "../../components/ErrorState";
import * as adminApi from "../../services/adminApi";
import { getErrorMessage } from "../../services/api";

export default function AdminOverview() {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.getPlatformOverview();
      setOverview(res.data.data);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load platform overview."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading && !overview) {
    return <Loader fullScreen label="Loading Platform Telemetry & Financials..." />;
  }

  if (error && !overview) {
    return <ErrorState message={error} onRetry={loadData} />;
  }

  const { financials, trips, fleet, users, recentRides } = overview || {
    financials: {},
    trips: {},
    fleet: {},
    users: {},
    recentRides: [],
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Operations Overview
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Real-time platform metrics, fleet activity, and financial ledger summaries.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button variant="secondary" size="sm" icon={RefreshCw} onClick={loadData}>
            Refresh Data
          </Button>
          <div className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-800 border border-emerald-200">
            <span className="h-2 w-2 rounded-full bg-emerald-600 animate-pulse" />
            Live Sync
          </div>
        </div>
      </div>

      {/* KPI Top Financial Bar */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* 1. Platform Revenue (20% Cut) */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Platform Revenue (20%)
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-brand-600">
              <Percent className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold tracking-tight text-slate-900">
              ₹{financials.totalPlatformRevenue?.toLocaleString()}
            </div>
            <div className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-500">
              <span className="rounded bg-brand-50 px-1.5 py-0.5 font-semibold text-brand-700">
                {financials.commissionRate || 20}% Margin
              </span>
              <span>from ₹{financials.totalGrossVolume?.toLocaleString()} GMV</span>
            </div>
          </div>
        </div>

        {/* 2. Total Gross GMV */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Gross Volume (GMV)
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
              <Wallet className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold tracking-tight text-slate-900">
              ₹{financials.totalGrossVolume?.toLocaleString()}
            </div>
            <div className="mt-1.5 text-xs text-slate-500">
              Driver Payouts (80%): <strong className="text-emerald-700 font-semibold">₹{financials.totalDriverPayouts?.toLocaleString()}</strong>
            </div>
          </div>
        </div>

        {/* 3. Driver Fleet Capacity */}
        <Link
          to="/admin/fleet"
          className="group rounded-xl border border-slate-200 bg-white p-5 shadow-xs transition hover:border-brand-500 hover:shadow-sm"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Active Fleet
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-700 group-hover:bg-brand-600 group-hover:text-white transition">
              <Car className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold tracking-tight text-slate-900">
              {fleet.onlineDrivers + fleet.busyDrivers}{" "}
              <span className="text-xs font-normal text-slate-400">/ {fleet.totalDrivers} registered</span>
            </div>
            <div className="mt-1.5 flex items-center gap-2 text-xs">
              <span className="text-emerald-700 font-semibold">● {fleet.onlineDrivers} Online</span>
              <span className="text-amber-700 font-semibold">● {fleet.busyDrivers} On Ride</span>
            </div>
          </div>
        </Link>

        {/* 4. Total Rides & Passengers */}
        <Link
          to="/admin/trips"
          className="group rounded-xl border border-slate-200 bg-white p-5 shadow-xs transition hover:border-brand-500 hover:shadow-sm"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Completed Trips
            </span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-700 group-hover:bg-brand-600 group-hover:text-white transition">
              <Users className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold tracking-tight text-slate-900">
              {trips.completed}{" "}
              <span className="text-xs font-normal text-slate-400">({trips.completionRate}% completion)</span>
            </div>
            <div className="mt-1.5 text-xs text-slate-500">
              <strong className="text-slate-900">{users.totalRiders}</strong> Registered Riders
            </div>
          </div>
        </Link>
      </div>

      {/* Revenue Commission Distribution Visualizer */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Revenue Split Model (80/20)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              80% settled directly to partner drivers, 20% platform commission retained.
            </p>
          </div>
          <span className="hidden sm:inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-800 border border-emerald-200">
            <ShieldCheck className="h-3.5 w-3.5" /> Verified Ledger
          </span>
        </div>

        <div className="mt-4 space-y-2">
          <div className="flex h-5 w-full overflow-hidden rounded-md bg-slate-100 border border-slate-200">
            <div
              style={{ width: "80%" }}
              className="bg-emerald-600 transition-all flex items-center justify-center text-[11px] text-white font-semibold"
            >
              80% Driver Share (₹{financials.totalDriverPayouts?.toLocaleString()})
            </div>
            <div
              style={{ width: "20%" }}
              className="bg-brand-700 transition-all flex items-center justify-center text-[11px] text-white font-semibold"
            >
              20% Platform
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between text-xs pt-1">
            <span className="flex items-center gap-1.5 text-emerald-800 font-semibold">
              <span className="h-2 w-2 rounded-full bg-emerald-600" />
              Partner Driver Payouts: ₹{financials.totalDriverPayouts?.toLocaleString()}
            </span>
            <span className="flex items-center gap-1.5 text-slate-800 font-semibold">
              <span className="h-2 w-2 rounded-full bg-brand-700" />
              Platform Commission (20%): ₹{financials.totalPlatformRevenue?.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link
          to="/admin/fleet"
          className="group flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-xs transition hover:border-brand-500 hover:shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-700 group-hover:bg-brand-600 group-hover:text-white transition">
              <Radio className="h-4 w-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">Live Fleet Map</div>
              <div className="text-xs text-slate-500">{fleet.onlineDrivers} drivers active</div>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs font-semibold text-brand-600">
            <span>View Map</span>
            <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" />
          </div>
        </Link>

        <Link
          to="/admin/trips"
          className="group flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-xs transition hover:border-brand-500 hover:shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-700 group-hover:bg-brand-600 group-hover:text-white transition">
              <Clock className="h-4 w-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">Trips Ledger</div>
              <div className="text-xs text-slate-500">{trips.total} total rides</div>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs font-semibold text-brand-600">
            <span>View Ledger</span>
            <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" />
          </div>
        </Link>

        <Link
          to="/admin/drivers"
          className="group flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-xs transition hover:border-brand-500 hover:shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-700 group-hover:bg-brand-600 group-hover:text-white transition">
              <Car className="h-4 w-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">Driver Roster</div>
              <div className="text-xs text-slate-500">{fleet.totalDrivers} registered</div>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs font-semibold text-brand-600">
            <span>Manage Fleet</span>
            <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" />
          </div>
        </Link>

        <Link
          to="/admin/riders"
          className="group flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-xs transition hover:border-brand-500 hover:shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-700 group-hover:bg-brand-600 group-hover:text-white transition">
              <Users className="h-4 w-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">Riders Directory</div>
              <div className="text-xs text-slate-500">{users.totalRiders} passengers</div>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs font-semibold text-brand-600">
            <span>View Directory</span>
            <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" />
          </div>
        </Link>
      </div>

      {/* Recent Platform Trips Table */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Recent Trip Transactions
            </h2>
            <p className="text-xs text-slate-500">Latest completed and active ride dispatches</p>
          </div>
          <Link
            to="/admin/trips"
            className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
          >
            All Trips <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold">
                <th className="p-3">Rider</th>
                <th className="p-3">Driver</th>
                <th className="p-3">Route</th>
                <th className="p-3 text-right">Gross GMV</th>
                <th className="p-3 text-right">Platform (20%)</th>
                <th className="p-3 text-right text-emerald-700">Driver (80%)</th>
                <th className="p-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentRides.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    No transactions recorded on the platform yet.
                  </td>
                </tr>
              ) : (
                recentRides.map((r) => (
                  <tr key={r._id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 font-semibold text-slate-900">{r.rider?.name || "Rider"}</td>
                    <td className="p-3 text-slate-700">{r.driver?.name || "Unassigned"}</td>
                    <td className="p-3 max-w-xs truncate text-slate-500">
                      {r.pickup?.address} → {r.destination?.address}
                    </td>
                    <td className="p-3 text-right font-bold text-slate-900">₹{r.grossFare?.toFixed(2)}</td>
                    <td className="p-3 text-right font-medium text-slate-600">₹{r.platformFee?.toFixed(2)}</td>
                    <td className="p-3 text-right font-bold text-emerald-700">₹{r.driverEarnings?.toFixed(2)}</td>
                    <td className="p-3 text-center">
                      <span
                        className={`inline-block rounded px-2 py-0.5 text-[11px] font-semibold capitalize ${
                          r.status === "completed"
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                            : r.status === "accepted" || r.status === "started"
                            ? "bg-blue-50 text-blue-800 border border-blue-200"
                            : r.status === "requested"
                            ? "bg-amber-50 text-amber-800 border border-amber-200"
                            : "bg-slate-100 text-slate-700 border border-slate-200"
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
