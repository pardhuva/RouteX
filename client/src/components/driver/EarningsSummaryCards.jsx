import { Wallet, TrendingUp, Calendar, Clock, Award, CheckCircle2, AlertCircle } from "lucide-react";

export default function EarningsSummaryCards({ summary }) {
  if (!summary) return null;

  const { earnings, performance, currency = "INR" } = summary;

  return (
    <div className="space-y-6">
      {/* Primary Financial Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Today's Net Earnings */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Today's Net</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <Wallet className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black text-slate-900">
              ₹{earnings.today.net.toLocaleString()}
            </p>
            <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
              <span>Gross: ₹{earnings.today.gross.toLocaleString()}</span>
              <span className="font-semibold text-emerald-600">{earnings.today.trips} trips</span>
            </div>
          </div>
        </div>

        {/* This Week's Net Earnings */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">This Week</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black text-slate-900">
              ₹{earnings.thisWeek.net.toLocaleString()}
            </p>
            <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
              <span>Gross: ₹{earnings.thisWeek.gross.toLocaleString()}</span>
              <span className="font-semibold text-blue-600">{earnings.thisWeek.trips} trips</span>
            </div>
          </div>
        </div>

        {/* This Month's Net Earnings */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">This Month</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
              <Calendar className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black text-slate-900">
              ₹{earnings.thisMonth.net.toLocaleString()}
            </p>
            <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
              <span>Gross: ₹{earnings.thisMonth.gross.toLocaleString()}</span>
              <span className="font-semibold text-purple-600">{earnings.thisMonth.trips} trips</span>
            </div>
          </div>
        </div>

        {/* Lifetime Net Payout */}
        <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-900 to-slate-800 p-5 text-white shadow-sm transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Lifetime Net</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-emerald-400">
              <Award className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3">
            <p className="text-2xl font-black text-white">
              ₹{earnings.lifetime.net.toLocaleString()}
            </p>
            <div className="mt-1 flex items-center justify-between text-xs text-slate-300">
              <span>80% Driver Split</span>
              <span className="font-semibold text-emerald-400">{earnings.lifetime.trips} total trips</span>
            </div>
          </div>
        </div>
      </div>

      {/* Driver Performance & Operational Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Rating */}
        <div className="flex items-center gap-3.5 rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 font-bold">
            ★
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Driver Rating</p>
            <p className="text-lg font-bold text-slate-900">
              {(performance.totalRatings || 0) > 0 && performance.rating > 0
                ? `${performance.rating.toFixed(1)} / 5.0 (${performance.totalRatings})`
                : "New Driver (No ratings)"}
            </p>
          </div>
        </div>

        {/* Completion Rate */}
        <div className="flex items-center gap-3.5 rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Completion Rate</p>
            <p className="text-lg font-bold text-slate-900">{performance.completionRatePercent}%</p>
          </div>
        </div>

        {/* Average Trip Fare */}
        <div className="flex items-center gap-3.5 rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <Wallet className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Average Fare / Trip</p>
            <p className="text-lg font-bold text-slate-900">₹{performance.averageFare}</p>
          </div>
        </div>

        {/* Total Hours Driven */}
        <div className="flex items-center gap-3.5 rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Total Driving Time</p>
            <p className="text-lg font-bold text-slate-900">{performance.totalHoursDriven} hrs</p>
          </div>
        </div>
      </div>
    </div>
  );
}
