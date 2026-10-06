import { useState } from "react";
import { ChevronDown, ChevronUp, MapPin, Navigation, Clock, ChevronLeft, ChevronRight } from "lucide-react";

export default function CompletedRideLogs({
  rides = [],
  pagination = {},
  timeframe = "all",
  onTimeframeChange,
  onPageChange,
}) {
  const [expandedRideId, setExpandedRideId] = useState(null);

  function toggleExpand(id) {
    setExpandedRideId((prev) => (prev === id ? null : id));
  }

  function formatDateTime(isoStr) {
    if (!isoStr) return "";
    const d = new Date(isoStr);
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  const TIMEFRAMES = [
    { id: "all", label: "All Time" },
    { id: "today", label: "Today" },
    { id: "week", label: "This Week" },
    { id: "month", label: "This Month" },
  ];

  return (
    <div className="space-y-3">
      {/* Timeframe Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-2.5 shadow-xs">
        <div className="flex flex-wrap gap-1">
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf.id}
              onClick={() => onTimeframeChange(tf.id)}
              className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-all ${
                timeframe === tf.id
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {tf.label}
            </button>
          ))}
        </div>
        <span className="text-[11px] font-medium text-slate-500">
          Showing {rides.length} of {pagination.totalCount || 0} trips
        </span>
      </div>

      {rides.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-center">
          <Clock className="mx-auto h-8 w-8 text-slate-300" />
          <h3 className="mt-2 text-sm font-bold text-slate-800">No completed rides in this period</h3>
          <p className="mt-0.5 text-xs text-slate-500">
            Trips completed within this window will appear here with full itemized fare breakdowns.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {rides.map((ride) => {
            const isExpanded = expandedRideId === ride.rideId;
            const fare = ride.fareBreakdown || {};

            return (
              <div
                key={ride.rideId}
                className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs hover:border-slate-300 transition-all"
              >
                {/* Main Card Header */}
                <div
                  onClick={() => toggleExpand(ride.rideId)}
                  className="flex cursor-pointer flex-col gap-2 p-3.5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-medium text-slate-400">
                        {formatDateTime(ride.completedAt || ride.requestedAt)}
                      </span>
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-700">
                        Rider: {ride.rider.name}
                      </span>
                    </div>

                    <div className="space-y-0.5 text-xs">
                      <div className="flex items-center gap-1.5 font-medium text-slate-700 truncate">
                        <MapPin className="h-3 w-3 text-emerald-600 shrink-0" />
                        <span className="truncate">{ride.pickup}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-500 truncate">
                        <Navigation className="h-3 w-3 text-brand-600 shrink-0" />
                        <span className="truncate">{ride.destination}</span>
                      </div>
                    </div>
                  </div>

                  {/* Summary Fare and Toggle */}
                  <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-2 sm:border-t-0 sm:pt-0">
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Net Payout</span>
                      <p className="text-base font-black text-emerald-700">
                        ₹{fare.driverNetEarnings?.toFixed(2) || "0.00"}
                      </p>
                      <span className="text-[10px] text-slate-400">
                        {ride.distanceKm} km · {ride.durationMinutes} min
                      </span>
                    </div>

                    <button
                      type="button"
                      className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-100 text-slate-500 hover:bg-slate-200"
                    >
                      {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Expandable Fare Breakdown */}
                {isExpanded && (
                  <div className="border-t border-slate-100 bg-slate-50/70 p-3.5 text-xs">
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                      Itemized Trip Fare & 80/20 Distribution
                    </h4>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1.5 rounded-lg border border-slate-200 bg-white p-3 text-xs">
                        <div className="flex justify-between text-slate-600">
                          <span>Base Fare:</span>
                          <span>₹{fare.baseFare?.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>Distance Fare ({ride.distanceKm} km):</span>
                          <span>₹{fare.distanceFare?.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>Time Fare ({ride.durationMinutes} min):</span>
                          <span>₹{fare.timeFare?.toFixed(2)}</span>
                        </div>
                        <div className="border-t border-slate-100 pt-1 flex justify-between font-bold text-slate-800">
                          <span>Gross Fare:</span>
                          <span>₹{fare.grossFare?.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-slate-500">
                          <span>Platform Fee (20%):</span>
                          <span>-₹{fare.platformFee?.toFixed(2)}</span>
                        </div>
                        <div className="border-t border-dashed border-slate-200 pt-1.5 flex justify-between font-black text-emerald-700 text-sm">
                          <span>Driver Net Take (80%):</span>
                          <span>₹{fare.driverNetEarnings?.toFixed(2)}</span>
                        </div>
                      </div>

                      <div className="space-y-1.5 rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-600">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-800">Payment:</span>
                          <span
                            className={`rounded px-1.5 py-0.2 text-[9px] font-bold uppercase ${
                              ride.payment.status === "success"
                                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                : "bg-amber-50 text-amber-800 border border-amber-200"
                            }`}
                          >
                            {ride.payment.status}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Method:</span>
                          <span className="font-mono text-[11px]">{ride.payment.paymentMethod}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Ride ID:</span>
                          <span className="font-mono text-[10px] text-slate-400 truncate max-w-[120px]">
                            {ride.rideId}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Pagination Controls */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2 text-xs">
              <button
                disabled={pagination.page <= 1}
                onClick={() => onPageChange(pagination.page - 1)}
                className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronLeft className="h-3 w-3" /> Previous
              </button>
              <span className="text-slate-500">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => onPageChange(pagination.page + 1)}
                className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
              >
                Next <ChevronRight className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
