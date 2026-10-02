import { CheckCircle2, Clock, Calendar, ArrowUpRight } from "lucide-react";

export default function WeeklyPayoutsTable({ payouts = [] }) {
  if (!payouts || payouts.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
        <Calendar className="mx-auto h-10 w-10 text-slate-300" />
        <h3 className="mt-3 text-base font-semibold text-slate-900">No payout settlements recorded yet</h3>
        <p className="mt-1 text-sm text-slate-500">
          Complete rides this week to generate your first automated weekly settlement cycle.
        </p>
      </div>
    );
  }

  function formatDate(isoStr) {
    if (!isoStr) return "";
    const d = new Date(isoStr);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-6 py-4">
        <h2 className="text-base font-bold text-slate-900">Weekly Payout Cycles</h2>
        <p className="text-xs text-slate-500">
          Settlements are calculated weekly on an 80/20 driver-platform split.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-6 py-3.5">Cycle / Week</th>
              <th className="px-6 py-3.5">Date Range</th>
              <th className="px-6 py-3.5 text-center">Trips</th>
              <th className="px-6 py-3.5 text-right">Gross Fares</th>
              <th className="px-6 py-3.5 text-right">Platform Fee (20%)</th>
              <th className="px-6 py-3.5 text-right">Net Payout</th>
              <th className="px-6 py-3.5 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {payouts.map((p) => {
              const isSettled = p.status === "settled";
              const isProcessing = p.status === "processing";

              return (
                <tr key={p.payoutId} className="transition-colors hover:bg-slate-50/70">
                  <td className="px-6 py-4">
                    <span className="font-mono text-xs font-bold text-slate-800">
                      W{String(p.week).padStart(2, "0")}, {p.year}
                    </span>
                    <p className="text-[11px] text-slate-400">{p.payoutId}</p>
                  </td>
                  <td className="px-6 py-4 text-xs">
                    {formatDate(p.weekStart)} – {formatDate(p.weekEnd)}
                  </td>
                  <td className="px-6 py-4 text-center font-medium text-slate-900">
                    {p.tripsCount}
                  </td>
                  <td className="px-6 py-4 text-right font-medium text-slate-600">
                    ₹{p.grossEarnings.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right text-xs text-rose-500">
                    -₹{p.platformFee.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="font-bold text-slate-900">₹{p.netPayout.toLocaleString()}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        isSettled
                          ? "bg-emerald-50 text-emerald-700"
                          : isProcessing
                          ? "bg-amber-50 text-amber-700"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {isSettled ? (
                        <>
                          <CheckCircle2 className="h-3 w-3" /> Settled
                        </>
                      ) : isProcessing ? (
                        <>
                          <Clock className="h-3 w-3" /> Processing
                        </>
                      ) : (
                        "Pending"
                      )}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
