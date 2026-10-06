import { useState, useEffect, useCallback } from "react";
import { Users, RefreshCw, Search, ShieldCheck } from "lucide-react";
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
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Users className="h-6 w-6 text-brand-600" />
            Riders Directory
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Registered passengers, contact details, trip history, and total platform spend.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button variant="secondary" size="sm" icon={RefreshCw} onClick={loadData}>
            Refresh
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
        <div className="relative min-w-[280px] flex-1">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by passenger name, email, or mobile number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-1.5 pl-9 pr-3 text-xs text-slate-900 placeholder-slate-400 focus:border-brand-500 focus:bg-white focus:outline-none"
          />
        </div>
        <div className="text-xs font-semibold text-slate-500">
          Total Passengers: <strong className="text-slate-900 font-bold">{riders.length}</strong>
        </div>
      </div>

      {/* Riders Table */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
        {loading && riders.length === 0 ? (
          <Loader label="Loading passenger database..." />
        ) : error && riders.length === 0 ? (
          <ErrorState message={error} onRetry={loadData} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 font-semibold text-slate-600">
                  <th className="p-2.5">Passenger Name</th>
                  <th className="p-2.5">Mobile Phone</th>
                  <th className="p-2.5">Email Address</th>
                  <th className="p-2.5 text-right">Trips Taken</th>
                  <th className="p-2.5 text-right text-brand-700">Lifetime Spend</th>
                  <th className="p-2.5 text-right">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRiders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">
                      No registered passengers found matching your search.
                    </td>
                  </tr>
                ) : (
                  filteredRiders.map((r) => (
                    <tr key={r._id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-2.5 font-semibold text-slate-900">{r.name}</td>
                      <td className="p-2.5 text-slate-600">{r.phone}</td>
                      <td className="p-2.5 text-slate-600">{r.email}</td>
                      <td className="p-2.5 text-right font-semibold text-slate-900">{r.totalTrips}</td>
                      <td className="p-2.5 text-right font-bold text-brand-700">₹{r.totalSpent?.toFixed(2)}</td>
                      <td className="p-2.5 text-right text-[11px] text-slate-500">
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
