import { CheckCircle2, Clock, Calendar } from "lucide-react";

export default function WeeklyPayoutsTable({ payouts = [] }) {
  if (!payouts || payouts.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 text-center">
        <Calendar className="mx-auto h-8 w-8 text-slate-300" />
        <h3 className="mt-2 text-sm font-bold text-slate-800">No payout settlements recorded yet</h3>
        <p className="mt-0.5 text-xs text-slate-500">
          Complete trips to generate automated weekly settlement ledger entries.
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
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
      <div className="border-b border-slate-100 px-4 py-3">
        <h2 className="text-sm font-bold text-slate-900">Weekly Settlement Cycles</h2>
        <p className="text-[11px] text-slate-500">
          Automated 80/20 driver revenue distribution calculated on ISO weekly calendar cycles.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-4 py-2.5">Cycle / Week</th>
              <th className="px-4 py-2.5">Date Range</th>
              <th className="px-4 py-2.5 text-center">Trips</th>
              <th className="px-4 py-2.5 text-right">Gross Fares</th>
              <th className="px-4 py-2.5 text-right text-slate-500">Platform Cut (20%)</th>
              <th className="px-4 py-2.5 text-right font-bold text-slate-900">Net Payout (80%)</th>
              <th className="px-4 py-2.5 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {payouts.map((p) => {
              const isSettled = p.status === "settled";
              const isProcessing = p.status === "processing";

              return (
                <tr key={p.payoutId} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs font-bold text-slate-900">
                      W{String(p.week).padStart(2, "0")}, {p.year}
                    </span>
                    <p className="text-[10px] text-slate-400 font-mono">{p.payoutId}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {formatDate(p.weekStart)} – {formatDate(p.weekEnd)}
                  </td>
                  <td className="px-4 py-3 text-center font-bold text-slate-800">
                    {p.tripsCount}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-slate-700">
                    ₹{p.grossEarnings.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-500">
                    -₹{p.platformFee.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="font-black text-emerald-700">₹{p.netPayout.toLocaleString()}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        isSettled
                          ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                          : isProcessing
                          ? "bg-amber-50 text-amber-800 border border-amber-200"
                          : "bg-slate-100 text-slate-700 border border-slate-200"
                      }`}
                    >
                      {isSettled ? (
                        <>
                          <CheckCircle2 className="h-2.5 w-2.5 text-emerald-600" /> Settled
                        </>
                      ) : isProcessing ? (
                        <>
                          <Clock className="h-2.5 w-2.5 text-amber-600" /> Processing
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
