import { useState, useEffect, useCallback } from "react";
import { Clock, RefreshCw, Search, Filter, ShieldCheck, ArrowUpDown } from "lucide-react";
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
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Clock className="h-6 w-6 text-brand-600" />
            Trips & Revenue Ledger
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Itemized records of all platform trips, 20% platform revenue, and 80% driver payout settlements.
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
            placeholder="Filter by passenger, driver, route address, or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-1.5 pl-9 pr-3 text-xs text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:bg-white focus:outline-none"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1 rounded-lg bg-slate-100 p-1 text-xs font-semibold">
          {["all", "completed", "started", "accepted", "requested", "cancelled"].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => {
                setTripFilter(st);
                setPage(1);
              }}
              className={`rounded-md px-2.5 py-1 text-xs capitalize transition ${
                tripFilter === st
                  ? "bg-white text-slate-900 shadow-xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Ledger Table */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
        {loading && rides.length === 0 ? (
          <Loader label="Loading platform trips..." />
        ) : error && rides.length === 0 ? (
          <ErrorState message={error} onRetry={loadData} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-600">
                  <th className="p-2.5">Trip ID</th>
                  <th className="p-2.5">Passenger</th>
                  <th className="p-2.5">Driver</th>
                  <th className="p-2.5">Route</th>
                  <th className="p-2.5 text-right">Gross Fare</th>
                  <th className="p-2.5 text-right text-brand-700">Platform (20%)</th>
                  <th className="p-2.5 text-right text-emerald-700">Driver (80%)</th>
                  <th className="p-2.5 text-center">Status</th>
                  <th className="p-2.5 text-right">Date & Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRides.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-400">
                      No trips found matching your query or filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredRides.map((r) => (
                    <tr key={r._id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-2.5 text-[11px] text-slate-400">#{r._id.slice(-6).toUpperCase()}</td>
                      <td className="p-2.5">
                        <div className="font-semibold text-slate-900">{r.rider?.name || "Rider"}</div>
                        <div className="text-[10px] text-slate-400">{r.rider?.phone}</div>
                      </td>
                      <td className="p-2.5">
                        <div className="font-medium text-slate-800">{r.driver?.name || "Unassigned"}</div>
                        {r.vehicle ? (
                          <div className="text-[10px] text-slate-500">
                            {r.vehicle.brand} {r.vehicle.model} ({r.vehicle.registrationNumber})
                          </div>
                        ) : null}
                      </td>
                      <td className="p-2.5 max-w-xs text-xs text-slate-600">
                        <div className="truncate font-medium text-slate-800">P: {r.pickup?.address}</div>
                        <div className="truncate text-slate-400">D: {r.destination?.address}</div>
                      </td>
                      <td className="p-2.5 text-right font-bold text-slate-900">₹{r.grossFare?.toFixed(2)}</td>
                      <td className="p-2.5 text-right font-medium text-brand-700">₹{r.platformFee?.toFixed(2)}</td>
                      <td className="p-2.5 text-right font-bold text-emerald-700">₹{r.driverEarnings?.toFixed(2)}</td>
                      <td className="p-2.5 text-center">
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
                      <td className="p-2.5 text-right text-[11px] text-slate-500 whitespace-nowrap">
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
          <div className="mt-4 flex flex-wrap items-center justify-between border-t border-slate-100 pt-4 text-xs font-mono text-slate-500 gap-2">
            <div>
              Page {pagination.page} of {pagination.pages} ({pagination.totalCount} recorded trips)
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
