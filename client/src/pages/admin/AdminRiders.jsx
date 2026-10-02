import { useState, useEffect, useCallback } from "react";
import { Users, RefreshCw, Search } from "lucide-react";
import Button from "../../components/Button";
import Loader from "../../components/Loader";
import ErrorState from "../../components/ErrorState";
import * as adminApi from "../../services/adminApi";
import { getErrorMessage } from "../../services/api";

export default function AdminRiders() {
  const [riders, setRiders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.getAdminRiders();
      setRiders(res.data.data.riders || []);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load rider directory."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredRiders = riders.filter((r) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.name?.toLowerCase().includes(q) ||
      r.email?.toLowerCase().includes(q) ||
      r.phone?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-600 text-white font-black text-xs">
              <Users className="h-3.5 w-3.5" />
            </span>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">Riders Directory</h1>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Registered passenger accounts, contact channels, trip counts, and lifetime platform spending.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button variant="secondary" size="sm" icon={RefreshCw} onClick={loadData}>
            Refresh Riders
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="relative min-w-[260px] flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by passenger name, email, or phone number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none"
          />
        </div>
        <div className="text-xs font-semibold text-slate-500">
          Total Riders: <strong className="text-slate-800">{riders.length}</strong>
        </div>
      </div>

      {/* Riders Table */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        {loading && riders.length === 0 ? (
          <Loader label="Loading registered passengers..." />
        ) : error && riders.length === 0 ? (
          <ErrorState message={error} onRetry={loadData} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="p-3">Passenger</th>
                  <th className="p-3">Phone</th>
                  <th className="p-3">Email Address</th>
                  <th className="p-3 text-right">Trips Taken</th>
                  <th className="p-3 text-right text-indigo-600">Total Spent</th>
                  <th className="p-3 text-right">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRiders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">
                      No registered riders found.
                    </td>
                  </tr>
                ) : (
                  filteredRiders.map((r) => (
                    <tr key={r._id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 font-bold text-slate-900">{r.name}</td>
                      <td className="p-3 text-slate-600 font-mono">{r.phone}</td>
                      <td className="p-3 text-slate-600">{r.email}</td>
                      <td className="p-3 text-right font-bold text-slate-800">{r.totalTrips}</td>
                      <td className="p-3 text-right font-bold text-indigo-600">₹{r.totalSpent?.toFixed(2)}</td>
                      <td className="p-3 text-right text-[11px] text-slate-400">
                        {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : "Active"}
                      </td>
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
