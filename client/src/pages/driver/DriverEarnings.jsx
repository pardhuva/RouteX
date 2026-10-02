import { useCallback, useEffect, useState } from "react";
import { Wallet, RefreshCw, Layers, Calendar, Receipt } from "lucide-react";
import EarningsSummaryCards from "../../components/driver/EarningsSummaryCards";
import WeeklyPayoutsTable from "../../components/driver/WeeklyPayoutsTable";
import CompletedRideLogs from "../../components/driver/CompletedRideLogs";
import Loader from "../../components/Loader";
import ErrorState from "../../components/ErrorState";
import * as driverApi from "../../services/driverApi";
import { getErrorMessage } from "../../services/api";

export default function DriverEarnings() {
  const [activeTab, setActiveTab] = useState("overview"); // "overview" | "payouts" | "rides"
  const [summary, setSummary] = useState(null);
  const [payouts, setPayouts] = useState([]);
  const [rides, setRides] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, totalCount: 0 });
  const [timeframe, setTimeframe] = useState("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const [summaryRes, payoutsRes, ridesRes] = await Promise.all([
        driverApi.getDriverEarningsSummary(),
        driverApi.getDriverWeeklyPayouts(),
        driverApi.getDriverCompletedRides({ timeframe, page: 1, limit: 10 }),
      ]);

      setSummary(summaryRes.data.data);
      setPayouts(payoutsRes.data.data.payouts || []);
      setRides(ridesRes.data.data.rides || []);
      setPagination(ridesRes.data.data.pagination || { page: 1, totalPages: 1, totalCount: 0 });
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load driver earnings and analytics."));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [timeframe]);

  const loadRidesPage = useCallback(
    async (page, selectedTf = timeframe) => {
      try {
        const res = await driverApi.getDriverCompletedRides({ timeframe: selectedTf, page, limit: 10 });
        setRides(res.data.data.rides || []);
        setPagination(res.data.data.pagination || { page, totalPages: 1, totalCount: 0 });
      } catch (err) {
        console.error("Failed to load rides page:", err);
      }
    },
    [timeframe]
  );

  function handleTimeframeChange(newTf) {
    setTimeframe(newTf);
    loadRidesPage(1, newTf);
  }

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) return <Loader fullScreen label="Calculating driver earnings & metrics..." />;
  if (error) return <ErrorState message={error} onRetry={() => loadData()} />;

  const TABS = [
    { id: "overview", label: "Earnings Overview", icon: Layers },
    { id: "payouts", label: "Weekly Settlements", icon: Calendar },
    { id: "rides", label: "Trip Logs & Fare Breakdown", icon: Receipt },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2.5">
            <Wallet className="h-6 w-6 text-emerald-600" />
            Driver Earnings & Analytics
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Real-time financial performance, automated 80/20 weekly settlements, and itemized trip fare logs.
          </p>
        </div>

        <button
          onClick={() => loadData(true)}
          disabled={refreshing}
          className="inline-flex items-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50 sm:self-center"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
          {refreshing ? "Refreshing..." : "Refresh Data"}
        </button>
      </div>

      {/* Tabs Bar */}
      <div className="flex border-b border-slate-200">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold transition-all ${
                isActive
                  ? "border-emerald-600 text-emerald-700"
                  : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800"
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      {activeTab === "overview" && <EarningsSummaryCards summary={summary} />}

      {activeTab === "payouts" && <WeeklyPayoutsTable payouts={payouts} />}

      {activeTab === "rides" && (
        <CompletedRideLogs
          rides={rides}
          pagination={pagination}
          timeframe={timeframe}
          onTimeframeChange={handleTimeframeChange}
          onPageChange={(page) => loadRidesPage(page, timeframe)}
        />
      )}
    </div>
  );
}
