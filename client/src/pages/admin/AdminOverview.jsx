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
    return <Loader fullScreen label="Loading Platform Financials & KPIs..." />;
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
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-900 text-white font-bold text-xs">
              RX
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Platform Financials & Overview</h1>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Real-time multi-tenant monitoring, 20% platform revenue cut, and platform health KPIs.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button variant="secondary" size="sm" icon={RefreshCw} onClick={loadData}>
            Refresh Financials
          </Button>
          <div className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 border border-slate-200">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Live Ecosystem
          </div>
        </div>
      </div>

      {/* KPI Top Financial Bar */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* 1. Platform Revenue (20% Cut) - Clean Executive Dark Card */}
        <div className="relative rounded-2xl border border-slate-800 bg-slate-900 p-5 text-white shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Platform Net Revenue</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-800 text-slate-300">
              <Percent className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold tracking-tight text-white">₹{financials.totalPlatformRevenue?.toLocaleString()}</div>
            <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-slate-400">
              <span className="rounded bg-slate-800 px-1.5 py-0.5 font-semibold text-slate-200">
                {financials.commissionRate || 20}% Take Rate
              </span>
              <span>from ₹{financials.totalGrossVolume?.toLocaleString()} GMV</span>
            </div>
          </div>
        </div>

        {/* 2. Total Gross GMV */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Gross Platform GMV</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
              <Wallet className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold tracking-tight text-slate-900">₹{financials.totalGrossVolume?.toLocaleString()}</div>
            <div className="mt-1.5 text-[11px] text-slate-500">
              Driver Payouts (80%): <strong className="text-slate-800">₹{financials.totalDriverPayouts?.toLocaleString()}</strong>
            </div>
          </div>
        </div>

        {/* 3. Driver Fleet Capacity */}
        <Link to="/admin/fleet" className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition-all hover:border-slate-400 hover:shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Driver Fleet</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-700 group-hover:bg-slate-900 group-hover:text-white transition-colors">
              <Car className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold tracking-tight text-slate-900">
              {fleet.onlineDrivers + fleet.busyDrivers}{" "}
              <span className="text-xs font-normal text-slate-400">/ {fleet.totalDrivers} registered</span>
            </div>
            <div className="mt-1.5 flex items-center gap-2 text-[11px]">
              <span className="text-emerald-700 font-semibold">● {fleet.onlineDrivers} Available</span>
              <span className="text-amber-700 font-semibold">● {fleet.busyDrivers} Busy</span>
            </div>
          </div>
        </Link>

        {/* 4. Total Rides & Passengers */}
        <Link to="/admin/trips" className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition-all hover:border-slate-400 hover:shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Trips & Riders</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-700 group-hover:bg-slate-900 group-hover:text-white transition-colors">
              <Users className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold tracking-tight text-slate-900">
              {trips.completed}{" "}
              <span className="text-xs font-normal text-slate-400">({trips.completionRate}% completion)</span>
            </div>
            <div className="mt-1.5 text-[11px] text-slate-500">
              <strong className="text-slate-800">{users.totalRiders}</strong> Registered Riders
            </div>
          </div>
        </Link>
      </div>

      {/* Revenue Commission Distribution Visualizer */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <h2 className="text-sm font-bold text-slate-900">Revenue & Commission Split Breakdown</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Automated 80/20 smart-split applied to every completed trip on RouteX.
        </p>

        <div className="mt-4 space-y-2">
          <div className="flex h-5 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              style={{ width: "80%" }}
              className="bg-emerald-600 transition-all flex items-center justify-center text-[10px] text-white font-bold"
            >
              80% Driver Payouts
            </div>
            <div
              style={{ width: "20%" }}
              className="bg-slate-900 transition-all flex items-center justify-center text-[10px] text-white font-bold"
            >
              20% Platform Fee
            </div>
          </div>

          <div className="flex items-center justify-between text-xs font-semibold pt-1">
            <span className="flex items-center gap-1.5 text-emerald-800">
              <span className="h-2 w-2 rounded-full bg-emerald-600" />
              Driver Payouts: ₹{financials.totalDriverPayouts?.toLocaleString()}
            </span>
            <span className="flex items-center gap-1.5 text-slate-900">
              <span className="h-2 w-2 rounded-full bg-slate-900" />
              Platform Net Fee (20%): ₹{financials.totalPlatformRevenue?.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link
          to="/admin/fleet"
          className="group flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition-all hover:border-slate-400 hover:shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700 group-hover:bg-slate-900 group-hover:text-white transition-colors">
              <Radio className="h-4 w-4" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900">Live Fleet Map</div>
              <div className="text-xs text-slate-500">{fleet.onlineDrivers} drivers online</div>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs font-bold text-slate-900">
            <span>Open Map View</span>
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
          </div>
        </Link>

        <Link
          to="/admin/trips"
          className="group flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition-all hover:border-slate-400 hover:shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700 group-hover:bg-slate-900 group-hover:text-white transition-colors">
              <Clock className="h-4 w-4" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900">Trips & Revenue Ledger</div>
              <div className="text-xs text-slate-500">{trips.total} total platform trips</div>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs font-bold text-slate-900">
            <span>View Full Ledger</span>
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
          </div>
        </Link>

        <Link
          to="/admin/drivers"
          className="group flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition-all hover:border-slate-400 hover:shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700 group-hover:bg-slate-900 group-hover:text-white transition-colors">
              <Car className="h-4 w-4" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900">Driver Fleet</div>
              <div className="text-xs text-slate-500">{fleet.totalDrivers} registered drivers</div>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs font-bold text-slate-900">
            <span>Manage Drivers</span>
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
          </div>
        </Link>

        <Link
          to="/admin/riders"
          className="group flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition-all hover:border-slate-400 hover:shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700 group-hover:bg-slate-900 group-hover:text-white transition-colors">
              <Users className="h-4 w-4" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900">Riders Directory</div>
              <div className="text-xs text-slate-500">{users.totalRiders} passengers</div>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs font-bold text-slate-900">
            <span>View Directory</span>
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
          </div>
        </Link>
      </div>

      {/* Recent Platform Trips */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Recent Platform Transactions</h2>
            <p className="text-xs text-slate-500">Live stream of incoming and settled trips</p>
          </div>
          <Link to="/admin/trips" className="text-xs font-bold text-slate-900 hover:underline flex items-center gap-1">
            View All Trips <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider">
                <th className="p-3">Rider</th>
                <th className="p-3">Driver</th>
                <th className="p-3">Pickup → Drop-off</th>
                <th className="p-3 text-right">Gross Fare</th>
                <th className="p-3 text-right text-slate-900">Platform Cut (20%)</th>
                <th className="p-3 text-right text-emerald-700">Driver Cut (80%)</th>
                <th className="p-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentRides.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-slate-400">
                    No trips recorded on the platform yet.
                  </td>
                </tr>
              ) : (
                recentRides.map((r) => (
                  <tr key={r._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-semibold text-slate-900">{r.rider?.name || "Rider"}</td>
                    <td className="p-3 text-slate-600">{r.driver?.name || "Unassigned"}</td>
                    <td className="p-3 max-w-xs truncate text-slate-500">
                      {r.pickup?.address} → {r.destination?.address}
                    </td>
                    <td className="p-3 text-right font-bold text-slate-900">₹{r.grossFare?.toFixed(2)}</td>
                    <td className="p-3 text-right font-bold text-slate-900">₹{r.platformFee?.toFixed(2)}</td>
                    <td className="p-3 text-right font-bold text-emerald-700">₹{r.driverEarnings?.toFixed(2)}</td>
                    <td className="p-3 text-center">
                      <span
                        className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
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
