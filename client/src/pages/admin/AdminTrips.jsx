import { useState, useEffect, useCallback } from "react";
import { Clock, RefreshCw, Search, Filter } from "lucide-react";
import Button from "../../components/Button";
import Loader from "../../components/Loader";
import ErrorState from "../../components/ErrorState";
import * as adminApi from "../../services/adminApi";
import { getErrorMessage } from "../../services/api";

export default function AdminTrips() {
  const [rides, setRides] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tripFilter, setTripFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.getAdminRides({
        status: tripFilter === "all" ? undefined : tripFilter,
        page,
        limit: 25,
      });
      setRides(res.data.data.rides || []);
      setPagination(res.data.data.pagination || {});
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load trips ledger."));
    } finally {
      setLoading(false);
    }
  }, [tripFilter, page]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredRides = rides.filter((r) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.rider?.name?.toLowerCase().includes(q) ||
      r.driver?.name?.toLowerCase().includes(q) ||
      r.pickup?.address?.toLowerCase().includes(q) ||
      r.destination?.address?.toLowerCase().includes(q) ||
      r._id?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-purple-600 text-white font-black text-xs">
              <Clock className="h-3.5 w-3.5" />
            </span>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">Trips & Revenue Ledger</h1>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Comprehensive audit log of passenger rides, fare calculation, 20% platform cut, and 80% driver payout.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button variant="secondary" size="sm" icon={RefreshCw} onClick={loadData}>
            Refresh Ledger
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
            placeholder="Search by rider, driver, address, or ride ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 text-xs font-semibold">
          {["all", "completed", "started", "accepted", "requested", "cancelled"].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => {
                setTripFilter(st);
                setPage(1);
              }}
              className={`rounded-lg px-3 py-1.5 capitalize transition-all ${
                tripFilter === st ? "bg-white text-slate-900 shadow-sm font-bold" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Ledger Table */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        {loading && rides.length === 0 ? (
          <Loader label="Loading platform trips..." />
        ) : error && rides.length === 0 ? (
          <ErrorState message={error} onRetry={loadData} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="p-3">Ride ID</th>
                  <th className="p-3">Rider</th>
                  <th className="p-3">Driver & Vehicle</th>
                  <th className="p-3">Pickup → Drop-off</th>
                  <th className="p-3 text-right">Gross Fare</th>
                  <th className="p-3 text-right text-indigo-600">Platform Fee (20%)</th>
                  <th className="p-3 text-right text-emerald-600">Driver Cut (80%)</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-right">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRides.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-400">
                      No rides found matching your query or filter.
                    </td>
                  </tr>
                ) : (
                  filteredRides.map((r) => (
                    <tr key={r._id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 font-mono text-[11px] text-slate-400">...{r._id.slice(-6)}</td>
                      <td className="p-3">
                        <div className="font-semibold text-slate-900">{r.rider?.name || "Rider"}</div>
                        <div className="text-[10px] text-slate-400">{r.rider?.phone}</div>
                      </td>
                      <td className="p-3">
                        <div className="font-semibold text-slate-800">{r.driver?.name || "Unassigned"}</div>
                        {r.vehicle ? (
                          <div className="text-[10px] text-slate-400">
                            {r.vehicle.brand} {r.vehicle.model} ({r.vehicle.registrationNumber})
                          </div>
                        ) : null}
                      </td>
                      <td className="p-3 max-w-xs text-slate-600">
                        <div className="truncate font-medium">P: {r.pickup?.address}</div>
                        <div className="truncate text-slate-400">D: {r.destination?.address}</div>
                      </td>
                      <td className="p-3 text-right font-bold text-slate-900">₹{r.grossFare?.toFixed(2)}</td>
                      <td className="p-3 text-right font-bold text-indigo-600">₹{r.platformFee?.toFixed(2)}</td>
                      <td className="p-3 text-right font-bold text-emerald-600">₹{r.driverEarnings?.toFixed(2)}</td>
                      <td className="p-3 text-center">
                        <span
                          className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                            r.status === "completed"
                              ? "bg-emerald-100 text-emerald-800"
                              : r.status === "accepted" || r.status === "started"
                              ? "bg-sky-100 text-sky-800"
                              : r.status === "requested"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td className="p-3 text-right text-[11px] text-slate-400">
                        {new Date(r.createdAt).toLocaleDateString()} {new Date(r.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {pagination.pages > 1 && (
          <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-500">
            <div>
              Showing page {pagination.page} of {pagination.pages} ({pagination.totalCount} total trips)
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={page >= pagination.pages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
