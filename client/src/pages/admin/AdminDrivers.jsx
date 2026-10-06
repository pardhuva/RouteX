import { useState, useEffect, useCallback } from "react";
import { Car, RefreshCw, Search, ShieldCheck, Star } from "lucide-react";
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
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Car className="h-6 w-6 text-brand-600" />
            Driver Fleet Directory
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Registered partner drivers, vehicle specifications, status, and earnings history.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button variant="secondary" size="sm" icon={RefreshCw} onClick={loadData}>
            Refresh
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
        {/* Search */}
        <div className="relative min-w-[280px] flex-1">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by driver name, phone, license plate, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-1.5 pl-9 pr-3 text-xs text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:bg-white focus:outline-none"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1 text-xs font-semibold">
          {["all", "available", "busy", "offline"].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`rounded-md px-2.5 py-1 text-xs capitalize transition ${
                statusFilter === st
                  ? "bg-white text-slate-900 shadow-xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Driver Fleet Table */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
        {loading && drivers.length === 0 ? (
          <Loader label="Loading driver roster..." />
        ) : error && drivers.length === 0 ? (
          <ErrorState message={error} onRetry={loadData} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-600">
                  <th className="p-2.5">Driver & Contact</th>
                  <th className="p-2.5">Vehicle</th>
                  <th className="p-2.5 text-center">Status</th>
                  <th className="p-2.5 text-center">Rating</th>
                  <th className="p-2.5 text-right">Trips</th>
                  <th className="p-2.5 text-right">Gross GMV</th>
                  <th className="p-2.5 text-right text-emerald-700">Net Payout (80%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDrivers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">
                      No partner drivers found matching your search.
                    </td>
                  </tr>
                ) : (
                  filteredDrivers.map((d) => (
                    <tr key={d._id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-2.5">
                        <div className="flex items-center gap-1.5 font-semibold text-slate-900">
                          {d.user?.name || "Driver"}
                          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" title="Verified Partner" />
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {d.user?.phone} · {d.user?.email}
                        </div>
                      </td>
                      <td className="p-2.5">
                        {d.vehicle ? (
                          <div>
                            <div className="font-medium text-slate-800">
                              {d.vehicle.brand} {d.vehicle.model}{" "}
                              <span className="text-[10px] uppercase text-slate-400">({d.vehicle.vehicleType})</span>
                            </div>
                            <span className="inline-block bg-slate-100 text-slate-800 text-[10px] font-semibold px-1.5 py-0.5 rounded border border-slate-200">
                              {d.vehicle.registrationNumber}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">No vehicle attached</span>
                        )}
                      </td>
                      <td className="p-2.5 text-center">
                        <span
                          className={`inline-block rounded px-2 py-0.5 text-[10px] font-semibold capitalize ${
                            d.status === "available"
                              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                              : d.status === "busy"
                              ? "bg-amber-50 text-amber-800 border border-amber-200"
                              : "bg-slate-100 text-slate-600 border border-slate-200"
                          }`}
                        >
                          {d.status}
                        </span>
                      </td>
                      <td className="p-2.5 text-center">
                        {d.totalRatings > 0 && d.rating > 0 ? (
                          <span className="inline-flex items-center gap-1 font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded text-[11px]">
                            <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                            {d.rating.toFixed(1)} <span className="text-slate-400 text-[10px]">({d.totalRatings})</span>
                          </span>
                        ) : (
                          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">New Driver</span>
                        )}
                      </td>
                      <td className="p-2.5 text-right font-semibold text-slate-800">{d.totalTrips}</td>
                      <td className="p-2.5 text-right font-medium text-slate-700">₹{d.grossEarnings?.toFixed(2)}</td>
                      <td className="p-2.5 text-right font-bold text-emerald-700">₹{d.netEarnings?.toFixed(2)}</td>
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
