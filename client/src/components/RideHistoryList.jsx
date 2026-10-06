import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  History,
  Search,
  MapPin,
  Navigation,
  ArrowRight,
} from "lucide-react";
import Loader from "./Loader";
import ErrorState from "./ErrorState";
import EmptyState from "./EmptyState";
import Button from "./Button";
import Badge from "./Badge";
import * as rideApi from "../services/rideApi";
import { getErrorMessage } from "../services/api";
import { formatShortDate, formatCurrency } from "../utils/format";
import { rideStatusMeta } from "../utils/statusMeta";

const PAGE_SIZE = 10;

export default function RideHistoryList({ role }) {
  const navigate = useNavigate();
  const [rides, setRides] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, totalCount: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const load = useCallback((page) => {
    setLoading(true);
    setError(null);
    rideApi
      .getMyRides({ page, limit: PAGE_SIZE })
      .then((res) => {
        setRides(res.data.data.rides || []);
        setPagination(res.data.data.pagination || { page: 1, totalPages: 1, totalCount: 0 });
      })
      .catch((err) => setError(getErrorMessage(err, "We couldn't load your ride history.")))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load(1);
  }, [load]);

  const filteredRides = rides.filter((r) => {
    if (statusFilter === "completed" && r.status !== "completed") return false;
    if (statusFilter === "cancelled" && r.status !== "cancelled") return false;
    if (
      statusFilter === "ongoing" &&
      !["requested", "accepted", "started"].includes(r.status)
    )
      return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const counterpart = role === "driver" ? r.rider?.name : r.driver?.name;
    return (
      counterpart?.toLowerCase().includes(q) ||
      r.pickup?.address?.toLowerCase().includes(q) ||
      r.destination?.address?.toLowerCase().includes(q) ||
      r._id?.toLowerCase().includes(q)
    );
  });

  if (loading && rides.length === 0)
    return <Loader fullScreen label="Loading ride history..." />;
  if (error && rides.length === 0)
    return <ErrorState message={error} onRetry={() => load(pagination.page)} />;

  const counterpartTitle = role === "driver" ? "Rider" : "Driver";

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">Ride History</h1>
        <p className="mt-1 text-xs text-slate-500">
          View all your past and active trips, receipts, and route summaries.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-xs">
        <div className="relative min-w-[240px] flex-1">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={`Search by ${counterpartTitle.toLowerCase()}, location, or trip ID...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50/60 py-1.5 pl-8 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:outline-none"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1 text-xs font-semibold">
          {[
            { id: "all", label: "All Rides" },
            { id: "completed", label: "Completed" },
            { id: "ongoing", label: "Ongoing" },
            { id: "cancelled", label: "Cancelled" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={`rounded-md px-2.5 py-1 transition-all ${
                statusFilter === tab.id
                  ? "bg-white text-slate-900 shadow-xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Production Operational Data Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        {filteredRides.length === 0 ? (
          <div className="p-8 text-center">
            <EmptyState
              icon={History}
              title="No rides found"
              description={
                rides.length === 0
                  ? "Your ride history will show up here once you take your first trip."
                  : "No rides matched the selected status or search filter."
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="p-3">Date</th>
                  <th className="p-3">{counterpartTitle}</th>
                  <th className="p-3">Route (Pickup → Drop-off)</th>
                  <th className="p-3 text-right">Fare</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRides.map((ride) => {
                  const meta = rideStatusMeta(ride.status);
                  const counterpart = role === "driver" ? ride.rider : ride.driver;
                  return (
                    <tr
                      key={ride._id}
                      onClick={() => navigate(`/${role}/ride/${ride._id}`)}
                      className="cursor-pointer hover:bg-slate-50/90 transition-colors"
                    >
                      <td className="p-3 font-medium text-slate-500 whitespace-nowrap">
                        <div>{formatShortDate(ride.createdAt)}</div>
                        <div className="font-mono text-[10px] text-slate-400">...{ride._id.slice(-6)}</div>
                      </td>
                      <td className="p-3">
                        <div className="font-bold text-slate-900">{counterpart?.name || "Unassigned"}</div>
                        <div className="text-[10px] text-slate-400">{counterpart?.phone || ""}</div>
                      </td>
                      <td className="p-3 max-w-sm">
                        <div className="flex items-start gap-1.5 truncate font-medium text-slate-800">
                          <MapPin className="h-3 w-3 shrink-0 text-emerald-600 mt-0.5" />
                          <span className="truncate">{ride.pickup?.address}</span>
                        </div>
                        <div className="flex items-start gap-1.5 truncate text-slate-500 mt-0.5">
                          <Navigation className="h-3 w-3 shrink-0 text-brand-600 mt-0.5" />
                          <span className="truncate">{ride.destination?.address}</span>
                        </div>
                      </td>
                      <td className="p-3 text-right font-extrabold text-slate-900 whitespace-nowrap">
                        {ride.fare ? formatCurrency(ride.fare) : ride.estimatedFare ? formatCurrency(ride.estimatedFare) : "—"}
                      </td>
                      <td className="p-3 text-center">
                        <Badge label={meta.label} className={meta.badge} />
                      </td>
                      <td className="p-3 text-right">
                        <span className="inline-flex items-center gap-1 font-semibold text-brand-600 hover:text-brand-700">
                          Details <ArrowRight className="h-3 w-3" />
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 p-3 text-xs text-slate-500">
            <div>
              Page {pagination.page} of {pagination.totalPages}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                icon={ChevronLeft}
                disabled={pagination.page <= 1}
                onClick={() => load(pagination.page - 1)}
              >
                Previous
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => load(pagination.page + 1)}
              >
                Next <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
