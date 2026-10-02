import { useState } from "react";
import { ChevronDown, ChevronUp, MapPin, Navigation, Clock, CreditCard, ChevronLeft, ChevronRight } from "lucide-react";

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
    <div className="space-y-4">
      {/* Timeframe Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="flex flex-wrap gap-1.5">
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf.id}
              onClick={() => onTimeframeChange(tf.id)}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
                timeframe === tf.id
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {tf.label}
            </button>
          ))}
        </div>
        <span className="text-xs font-medium text-slate-500">
          Showing {rides.length} of {pagination.totalCount || 0} completed rides
        </span>
      </div>

      {rides.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
          <Clock className="mx-auto h-10 w-10 text-slate-300" />
          <h3 className="mt-3 text-base font-semibold text-slate-900">No completed rides in this period</h3>
          <p className="mt-1 text-sm text-slate-500">
            Trips completed within this window will appear here with full fare and payout details.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {rides.map((ride) => {
            const isExpanded = expandedRideId === ride.rideId;
            const fare = ride.fareBreakdown || {};

            return (
              <div
                key={ride.rideId}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:border-slate-300"
              >
                {/* Main Card Header */}
                <div
                  onClick={() => toggleExpand(ride.rideId)}
                  className="flex cursor-pointer flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-slate-400">
                        {formatDateTime(ride.completedAt || ride.requestedAt)}
                      </span>
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                        Rider: {ride.rider.name}
                      </span>
                    </div>

                    {/* Route */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs font-medium text-slate-700">
                        <MapPin className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                        <span className="truncate">{ride.pickup}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs font-medium text-slate-700">
                        <Navigation className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                        <span className="truncate">{ride.destination}</span>
                      </div>
                    </div>
                  </div>

                  {/* Summary Fare and Toggle */}
                  <div className="flex items-center justify-between gap-4 border-t border-slate-100 pt-3 sm:border-t-0 sm:pt-0">
                    <div className="text-right">
                      <span className="text-xs font-medium text-slate-400">Your Net Cut</span>
                      <p className="text-lg font-black text-emerald-600">
                        ₹{fare.driverNetEarnings?.toFixed(2) || "0.00"}
                      </p>
                      <span className="text-[10px] text-slate-400">
                        {ride.distanceKm} km · {ride.durationMinutes} min
                      </span>
                    </div>

                    <button
                      type="button"
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500 transition hover:bg-slate-200"
                    >
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Expandable Fare Breakdown & Trip Details */}
                {isExpanded && (
                  <div className="border-t border-slate-100 bg-slate-50/70 p-5 text-sm">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Itemized Fare & Commission Breakdown
                    </h4>

                    <div className="mt-3 grid gap-4 sm:grid-cols-2">
                      {/* Detailed Calculations */}
                      <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-3.5 text-xs">
                        <div className="flex justify-between text-slate-600">
                          <span>Base Fare:</span>
                          <span>₹{fare.baseFare?.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>Distance Fare ({ride.distanceKm} km @ ₹15/km):</span>
                          <span>₹{fare.distanceFare?.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>Duration Fare ({ride.durationMinutes} min @ ₹2/min):</span>
                          <span>₹{fare.timeFare?.toFixed(2)}</span>
                        </div>
                        <div className="border-t border-slate-100 pt-1.5 flex justify-between font-bold text-slate-800">
                          <span>Gross Fare Charged:</span>
                          <span>₹{fare.grossFare?.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-rose-500">
                          <span>Platform Service Fee (20%):</span>
                          <span>-₹{fare.platformFee?.toFixed(2)}</span>
                        </div>
                        <div className="border-t border-dashed border-slate-200 pt-2 flex justify-between font-black text-emerald-700 text-sm">
                          <span>Driver Net Payout (80%):</span>
                          <span>₹{fare.driverNetEarnings?.toFixed(2)}</span>
                        </div>
                      </div>

                      {/* Payment & Audit Info */}
                      <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-3.5 text-xs text-slate-600">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-800">Payment Status:</span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                              ride.payment.status === "success"
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-amber-50 text-amber-700"
                            }`}
                          >
                            {ride.payment.status}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Payment Method:</span>
                          <span className="font-mono">{ride.payment.paymentMethod}</span>
                        </div>
                        {ride.payment.providerReference && (
                          <div className="flex justify-between">
                            <span>Reference ID:</span>
                            <span className="font-mono text-[10px] text-slate-500 truncate max-w-[140px]">
                              {ride.payment.providerReference}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span>Ride ID:</span>
                          <span className="font-mono text-[10px] text-slate-400">{ride.rideId}</span>
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
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                disabled={pagination.page <= 1}
                onClick={() => onPageChange(pagination.page - 1)}
                className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronLeft className="h-3.5 w-3.5" /> Previous
              </button>
              <span className="text-xs font-medium text-slate-500">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => onPageChange(pagination.page + 1)}
                className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-40"
              >
                Next <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
