import { useState, useEffect, useCallback } from "react";
import { Car, RefreshCw, Search, ShieldCheck } from "lucide-react";
import Button from "../../components/Button";
import Loader from "../../components/Loader";
import ErrorState from "../../components/ErrorState";
import * as adminApi from "../../services/adminApi";
import { getErrorMessage } from "../../services/api";

export default function AdminDrivers() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.getAdminDrivers({
        status: statusFilter === "all" ? undefined : statusFilter,
      });
      setDrivers(res.data.data.drivers || []);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load driver fleet."));
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredDrivers = drivers.filter((d) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      d.user?.name?.toLowerCase().includes(q) ||
      d.user?.email?.toLowerCase().includes(q) ||
      d.user?.phone?.toLowerCase().includes(q) ||
      d.vehicle?.brand?.toLowerCase().includes(q) ||
      d.vehicle?.model?.toLowerCase().includes(q) ||
      d.vehicle?.registrationNumber?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-600 text-white font-black text-xs">
              <Car className="h-3.5 w-3.5" />
            </span>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">Driver Fleet Management</h1>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Certified partner drivers, vehicle specifications, performance ratings, and 80% net payout totals.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button variant="secondary" size="sm" icon={RefreshCw} onClick={loadData}>
            Refresh Drivers
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        {/* Search */}
        <div className="relative min-w-[260px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by driver name, email, phone, or vehicle number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 text-xs font-semibold">
          {["all", "available", "busy", "offline"].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`rounded-lg px-3 py-1.5 capitalize transition-all ${
                statusFilter === st ? "bg-white text-slate-900 shadow-sm font-bold" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Driver Fleet Table */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        {loading && drivers.length === 0 ? (
          <Loader label="Loading driver fleet..." />
        ) : error && drivers.length === 0 ? (
          <ErrorState message={error} onRetry={loadData} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="p-3">Driver Profile</th>
                  <th className="p-3">Vehicle Details</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-center">Rating</th>
                  <th className="p-3 text-right">Completed Trips</th>
                  <th className="p-3 text-right">Gross Generated</th>
                  <th className="p-3 text-right text-emerald-600">Net Paid (80%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDrivers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      No drivers found matching your search.
                    </td>
                  </tr>
                ) : (
                  filteredDrivers.map((d) => (
                    <tr key={d._id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="font-bold text-slate-900">{d.user?.name || "Driver"}</div>
                          <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" title="Verified Driver" />
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {d.user?.phone} · {d.user?.email}
                        </div>
                      </td>
                      <td className="p-3">
                        {d.vehicle ? (
                          <div>
                            <div className="font-semibold text-slate-800">
                              {d.vehicle.brand} {d.vehicle.model} ({d.vehicle.vehicleType})
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">{d.vehicle.registrationNumber}</div>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">No vehicle recorded</span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                            d.status === "available"
                              ? "bg-emerald-100 text-emerald-800"
                              : d.status === "busy"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {d.status}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        {d.totalRatings > 0 && d.rating > 0 ? (
                          <span className="font-bold text-amber-600">★ {d.rating.toFixed(1)} <span className="text-slate-400 text-[10px] font-normal">({d.totalRatings})</span></span>
                        ) : (
                          <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">New Driver</span>
                        )}
                      </td>
                      <td className="p-3 text-right font-bold text-slate-800">{d.totalTrips}</td>
                      <td className="p-3 text-right font-semibold text-slate-700">₹{d.grossEarnings?.toFixed(2)}</td>
                      <td className="p-3 text-right font-bold text-emerald-600">₹{d.netEarnings?.toFixed(2)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
