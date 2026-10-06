import { Wallet, TrendingUp, Calendar, Clock, Award, CheckCircle2, Percent } from "lucide-react";

export default function EarningsSummaryCards({ summary }) {
  if (!summary) return null;

  const { earnings, performance } = summary;

  return (
    <div className="space-y-4">
      {/* Primary Financial Metric Cards */}
      <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Today's Net Earnings */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-bold uppercase tracking-wider">Today's Net</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
              <Wallet className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2.5">
            <p className="text-xl font-black text-slate-900">
              ₹{earnings.today.net.toLocaleString()}
            </p>
            <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
              <span>Gross: ₹{earnings.today.gross.toLocaleString()}</span>
              <span className="font-semibold text-emerald-700">{earnings.today.trips} trips</span>
            </div>
          </div>
        </div>

        {/* This Week's Net Earnings */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-bold uppercase tracking-wider">This Week</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
              <TrendingUp className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2.5">
            <p className="text-xl font-black text-slate-900">
              ₹{earnings.thisWeek.net.toLocaleString()}
            </p>
            <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
              <span>Gross: ₹{earnings.thisWeek.gross.toLocaleString()}</span>
              <span className="font-semibold text-brand-700">{earnings.thisWeek.trips} trips</span>
            </div>
          </div>
        </div>

        {/* This Month's Net Earnings */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-bold uppercase tracking-wider">This Month</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
              <Calendar className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2.5">
            <p className="text-xl font-black text-slate-900">
              ₹{earnings.thisMonth.net.toLocaleString()}
            </p>
            <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
              <span>Gross: ₹{earnings.thisMonth.gross.toLocaleString()}</span>
              <span className="font-semibold text-slate-800">{earnings.thisMonth.trips} trips</span>
            </div>
          </div>
        </div>

        {/* Lifetime Net Payout */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-bold uppercase tracking-wider">Lifetime Net (80%)</span>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
              <Award className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2.5">
            <p className="text-xl font-bold text-slate-900">
              ₹{earnings.lifetime.net.toLocaleString()}
            </p>
            <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
              <span>Gross: ₹{earnings.lifetime.gross.toLocaleString()}</span>
              <span className="font-semibold text-emerald-700">{earnings.lifetime.trips} total trips</span>
            </div>
          </div>
        </div>
      </div>

      {/* Driver Performance & Operational Metrics */}
      <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Rating */}
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600 font-bold text-xs">
            ★
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Driver Rating</p>
            <p className="text-sm font-bold text-slate-900">
              {(performance.totalRatings || 0) > 0 && performance.rating > 0
                ? `${performance.rating.toFixed(1)} / 5.0 (${performance.totalRatings})`
                : "Active Driver"}
            </p>
          </div>
        </div>

        {/* Completion Rate */}
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Completion Rate</p>
            <p className="text-sm font-bold text-slate-900">{performance.completionRatePercent}%</p>
          </div>
        </div>

        {/* Average Trip Fare */}
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <Wallet className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Avg Fare / Trip</p>
            <p className="text-sm font-bold text-slate-900">₹{performance.averageFare}</p>
          </div>
        </div>

        {/* Total Hours Driven */}
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
            <Clock className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Driving Time</p>
            <p className="text-sm font-bold text-slate-900">{performance.totalHoursDriven} hrs</p>
          </div>
        </div>
      </div>
    </div>
  );
}
