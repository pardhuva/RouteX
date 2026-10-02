import { useState, useEffect, useCallback } from "react";
import {
  Wallet,
  TrendingUp,
  Car,
  Users,
  CheckCircle2,
  Clock,
  MapPin,
  Navigation,
  RefreshCw,
  Search,
  Filter,
  ShieldCheck,
  ShieldAlert,
  Percent,
  Radio,
  AlertTriangle,
  FileText,
  LifeBuoy,
} from "lucide-react";
import Button from "../../components/Button";
import Loader from "../../components/Loader";
import ErrorState from "../../components/ErrorState";
import AdminFleetMap from "../../components/admin/AdminFleetMap";
import * as adminApi from "../../services/adminApi";
import * as supportApi from "../../services/supportApi";
import { getErrorMessage } from "../../services/api";
import { useToast } from "../../context/ToastContext";

export default function AdminDashboard() {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState("overview"); // "overview" | "fleet" | "trips" | "drivers" | "riders" | "incidents"
  const [overview, setOverview] = useState(null);
  const [ridesData, setRidesData] = useState({ rides: [], pagination: {} });
  const [driversData, setDriversData] = useState({ drivers: [], pagination: {} });
  const [ridersData, setRidersData] = useState({ riders: [], pagination: {} });
  const [incidentsData, setIncidentsData] = useState({ incidents: [], pagination: {} });
  const [fleetDrivers, setFleetDrivers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tripFilter, setTripFilter] = useState("all");
  const [incidentFilter, setIncidentFilter] = useState("all");
  const [resolvingIncident, setResolvingIncident] = useState(null);
  const [resolutionText, setResolutionText] = useState("");
  const [adminNotesText, setAdminNotesText] = useState("");
  const [resolvingLoading, setResolvingLoading] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [overviewRes, ridesRes, driversRes, ridersRes, fleetRes, incidentsRes] = await Promise.all([
        adminApi.getPlatformOverview(),
        adminApi.getAdminRides({ status: tripFilter === "all" ? undefined : tripFilter }),
        adminApi.getAdminDrivers(),
        adminApi.getAdminRiders(),
        adminApi.getLiveFleetMap(),
        supportApi.getAdminIncidents({ status: incidentFilter === "all" ? undefined : incidentFilter }).catch(() => ({ data: { data: { incidents: [], pagination: {} } } })),
      ]);

      setOverview(overviewRes.data.data);
      setRidesData(ridesRes.data.data);
      setDriversData(driversRes.data.data);
      setRidersData(ridersRes.data.data);
      setFleetDrivers(fleetRes.data.data.drivers || []);
      setIncidentsData(incidentsRes.data.data || { incidents: [], pagination: {} });
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load admin analytics."));
    } finally {
      setLoading(false);
    }
  }, [tripFilter, incidentFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading && !overview) {
    return <Loader fullScreen label="Loading Executive Operations Center..." />;
  }

  if (error && !overview) {
    return <ErrorState message={error} onRetry={loadData} />;
  }

  const { financials, trips, fleet, users, recentRides } = overview || {
    financials: {},
    trips: {},
    fleet: {},
    users: {},
    recentRides: [],
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-600 text-white font-black text-xs">
              👑
            </span>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">Platform Operations & Revenue Center</h1>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Real-time multi-tenant monitoring, 20% platform commission ledger, driver fleet dispatch & rider directory.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button variant="secondary" size="sm" icon={RefreshCw} onClick={loadData}>
            Refresh Platform
          </Button>
          <div className="flex items-center gap-1 rounded-xl bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 border border-emerald-200/60">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Live Ecosystem
          </div>
        </div>
      </div>

      {/* KPI Top Financial Bar */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* 1. Platform Revenue (20% Cut) */}
        <div className="relative overflow-hidden rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-900 to-slate-900 p-5 text-white shadow-lg">
          <div className="flex items-center justify-between text-indigo-300">
            <span className="text-xs font-bold uppercase tracking-wider">Platform Net Revenue</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-300">
              <Percent className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black tracking-tight">₹{financials.totalPlatformRevenue?.toLocaleString()}</div>
            <div className="mt-1 flex items-center gap-1.5 text-[11px] text-indigo-200">
              <span className="rounded bg-indigo-500/30 px-1.5 py-0.5 font-bold text-indigo-100">
                {financials.commissionRate || 20}% Take Rate
              </span>
              <span>from ₹{financials.totalGrossVolume?.toLocaleString()} GMV</span>
            </div>
          </div>
        </div>

        {/* 2. Total Gross GMV */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Gross Platform GMV</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <Wallet className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900">₹{financials.totalGrossVolume?.toLocaleString()}</div>
            <div className="mt-1 text-[11px] text-slate-500">
              Driver Payouts (80%): <strong className="text-slate-700">₹{financials.totalDriverPayouts?.toLocaleString()}</strong>
            </div>
          </div>
        </div>

        {/* 3. Driver Fleet Capacity */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Driver Fleet</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
              <Car className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900">
              {fleet.onlineDrivers + fleet.busyDrivers}{" "}
              <span className="text-xs font-normal text-slate-400">/ {fleet.totalDrivers} registered</span>
            </div>
            <div className="mt-1 flex items-center gap-2 text-[11px]">
              <span className="text-emerald-600 font-semibold">● {fleet.onlineDrivers} Available</span>
              <span className="text-amber-600 font-semibold">● {fleet.busyDrivers} Busy</span>
            </div>
          </div>
        </div>

        {/* 4. Total Rides & Passengers */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Trips & Riders</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900">
              {trips.completed}{" "}
              <span className="text-xs font-normal text-slate-400">({trips.completionRate}% completion)</span>
            </div>
            <div className="mt-1 text-[11px] text-slate-500">
              <strong className="text-slate-800">{users.totalRiders}</strong> Registered Riders
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-200/80 pb-2 text-sm font-semibold">
        {[
          { id: "overview", label: "Financial Overview", icon: TrendingUp },
          { id: "fleet", label: "Live Fleet Map", icon: Radio },
          { id: "trips", label: `Trips Ledger (${ridesData.pagination?.totalCount || 0})`, icon: Clock },
          { id: "drivers", label: `Driver Fleet (${fleet.totalDrivers})`, icon: Car },
          { id: "riders", label: `Rider Directory (${users.totalRiders})`, icon: Users },
          { id: "incidents", label: `Trust & Safety (${incidentsData.pagination?.totalCount || incidentsData.incidents?.length || 0})`, icon: ShieldAlert },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 rounded-xl px-3.5 py-2 transition-all ${
                isActive
                  ? "bg-slate-900 text-white shadow-sm font-bold"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: Financial Overview */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Revenue Commission Distribution Visualizer */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-base font-bold text-slate-900">Revenue & Commission Split Breakdown</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Automated smart-split applied to every completed trip on the platform.
            </p>

            <div className="mt-4 space-y-2">
              <div className="flex h-5 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  style={{ width: "80%" }}
                  className="bg-emerald-500 transition-all flex items-center justify-center text-[10px] text-white font-bold"
                >
                  80% Driver Payouts
                </div>
                <div
                  style={{ width: "20%" }}
                  className="bg-indigo-600 transition-all flex items-center justify-center text-[10px] text-white font-bold"
                >
                  20% Platform Fee
                </div>
              </div>

              <div className="flex items-center justify-between text-xs font-semibold pt-1">
                <span className="flex items-center gap-1.5 text-emerald-700">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  Driver Payouts: ₹{financials.totalDriverPayouts?.toLocaleString()}
                </span>
                <span className="flex items-center gap-1.5 text-indigo-700">
                  <span className="h-2.5 w-2.5 rounded-full bg-indigo-600" />
                  Platform Net Fee: ₹{financials.totalPlatformRevenue?.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Recent Platform Trips */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">Recent Platform Transactions</h2>
                <p className="text-xs text-slate-500">Live stream of incoming and settled trips</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setActiveTab("trips")} className="text-xs text-brand-600">
                View All Trips →
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold uppercase tracking-wider">
                    <th className="p-3">Rider</th>
                    <th className="p-3">Driver</th>
                    <th className="p-3">Pickup → Drop-off</th>
                    <th className="p-3 text-right">Gross Fare</th>
                    <th className="p-3 text-right text-indigo-600">Platform Cut (20%)</th>
                    <th className="p-3 text-right text-emerald-600">Driver Cut (80%)</th>
                    <th className="p-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentRides.map((r) => (
                    <tr key={r._id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 font-semibold text-slate-900">{r.rider?.name || "Rider"}</td>
                      <td className="p-3 text-slate-600">{r.driver?.name || "Unassigned"}</td>
                      <td className="p-3 max-w-xs truncate text-slate-500">
                        {r.pickup?.address} → {r.destination?.address}
                      </td>
                      <td className="p-3 text-right font-bold text-slate-900">₹{r.grossFare?.toFixed(2)}</td>
                      <td className="p-3 text-right font-bold text-indigo-600">₹{r.platformFee?.toFixed(2)}</td>
                      <td className="p-3 text-right font-bold text-emerald-600">₹{r.driverEarnings?.toFixed(2)}</td>
                      <td className="p-3 text-center">
                        <span
                          className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                            r.status === "completed"
                              ? "bg-emerald-100 text-emerald-800"
                              : r.status === "accepted" || r.status === "started"
                              ? "bg-sky-100 text-sky-800"
                              : r.status === "requested"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Live Fleet Map */}
      {activeTab === "fleet" && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Live Driver Fleet Telemetry</h2>
              <p className="text-xs text-slate-500">GPS positions of online and active drivers across the city</p>
            </div>
            <div className="flex items-center gap-3 text-xs font-semibold">
              <span className="flex items-center gap-1 text-emerald-600">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Available ({fleet.onlineDrivers})
              </span>
              <span className="flex items-center gap-1 text-amber-600">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> Busy ({fleet.busyDrivers})
              </span>
            </div>
          </div>

          <AdminFleetMap drivers={fleetDrivers} className="h-[520px] w-full rounded-2xl" />
        </div>
      )}

      {/* TAB 3: Trips Ledger */}
      {activeTab === "trips" && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">Complete Trips & Settlement Ledger</h2>
              <p className="text-xs text-slate-500">Detailed line-by-line financial audit of every requested trip</p>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 text-xs font-semibold">
              {["all", "completed", "started", "accepted", "requested", "cancelled"].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setTripFilter(st)}
                  className={`rounded-lg px-2.5 py-1 capitalize transition-all ${
                    tripFilter === st ? "bg-white text-slate-900 shadow-sm font-bold" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="p-3">Ride ID</th>
                  <th className="p-3">Rider</th>
                  <th className="p-3">Driver & Vehicle</th>
                  <th className="p-3">Pickup → Drop-off</th>
                  <th className="p-3 text-right">Gross Fare</th>
                  <th className="p-3 text-right text-indigo-600">Platform Fee (20%)</th>
                  <th className="p-3 text-right text-emerald-600">Driver Cut (80%)</th>
                  <th className="p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {ridesData.rides.map((r) => (
                  <tr key={r._id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 font-mono text-[11px] text-slate-400">...{r._id.slice(-6)}</td>
                    <td className="p-3">
                      <div className="font-semibold text-slate-900">{r.rider?.name || "Rider"}</div>
                      <div className="text-[10px] text-slate-400">{r.rider?.phone}</div>
                    </td>
                    <td className="p-3">
                      <div className="font-semibold text-slate-800">{r.driver?.name || "Unassigned"}</div>
                      {r.vehicle && (
                        <div className="text-[10px] text-slate-400">
                          {r.vehicle.brand} {r.vehicle.model} ({r.vehicle.registrationNumber})
                        </div>
                      )}
                    </td>
                    <td className="p-3 max-w-xs text-slate-600">
                      <div className="truncate font-medium">P: {r.pickup?.address}</div>
                      <div className="truncate text-slate-400">D: {r.destination?.address}</div>
                    </td>
                    <td className="p-3 text-right font-bold text-slate-900">₹{r.grossFare?.toFixed(2)}</td>
                    <td className="p-3 text-right font-bold text-indigo-600">₹{r.platformFee?.toFixed(2)}</td>
                    <td className="p-3 text-right font-bold text-emerald-600">₹{r.driverEarnings?.toFixed(2)}</td>
                    <td className="p-3 text-center">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                          r.status === "completed"
                            ? "bg-emerald-100 text-emerald-800"
                            : r.status === "accepted" || r.status === "started"
                            ? "bg-sky-100 text-sky-800"
                            : r.status === "requested"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: Driver Fleet Directory */}
      {activeTab === "drivers" && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Registered Driver Fleet</h2>
            <p className="text-xs text-slate-500">Driver profiles, vehicle certifications, ratings and lifetime payouts</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="p-3">Driver Name</th>
                  <th className="p-3">Vehicle Details</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-center">Rating</th>
                  <th className="p-3 text-right">Completed Trips</th>
                  <th className="p-3 text-right">Gross Generated</th>
                  <th className="p-3 text-right text-emerald-600">Net Paid (80%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {driversData.drivers.map((d) => (
                  <tr key={d._id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3">
                      <div className="font-bold text-slate-900">{d.user?.name || "Driver"}</div>
                      <div className="text-[10px] text-slate-400">{d.user?.phone} · {d.user?.email}</div>
                    </td>
                    <td className="p-3">
                      {d.vehicle ? (
                        <div>
                          <div className="font-semibold text-slate-800">
                            {d.vehicle.brand} {d.vehicle.model} ({d.vehicle.vehicleType})
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">{d.vehicle.registrationNumber}</div>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">No vehicle</span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                          d.status === "available"
                            ? "bg-emerald-100 text-emerald-800"
                            : d.status === "busy"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {d.status}
                      </span>
                    </td>
                    <td className="p-3 text-center font-bold text-amber-600">★ {d.rating || 5.0}</td>
                    <td className="p-3 text-right font-bold text-slate-800">{d.totalTrips}</td>
                    <td className="p-3 text-right font-semibold text-slate-700">₹{d.grossEarnings?.toFixed(2)}</td>
                    <td className="p-3 text-right font-bold text-emerald-600">₹{d.netEarnings?.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: Rider Directory */}
      {activeTab === "riders" && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Registered Rider Directory</h2>
            <p className="text-xs text-slate-500">Passenger profiles, total trips taken, and platform spend</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="p-3">Passenger</th>
                  <th className="p-3">Phone</th>
                  <th className="p-3">Email</th>
                  <th className="p-3 text-right">Trips Taken</th>
                  <th className="p-3 text-right">Total Spent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {ridersData.riders.map((r) => (
                  <tr key={r._id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 font-bold text-slate-900">{r.name}</td>
                    <td className="p-3 text-slate-600 font-mono">{r.phone}</td>
                    <td className="p-3 text-slate-600">{r.email}</td>
                    <td className="p-3 text-right font-bold text-slate-800">{r.totalTrips}</td>
                    <td className="p-3 text-right font-bold text-brand-600">₹{r.totalSpent?.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 6: Trust & Safety / Incident Resolution Center */}
      {activeTab === "incidents" && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-rose-600" />
                <h2 className="text-base font-bold text-slate-900">Trust, Safety & Incident Operations</h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Investigate driver misbehavior, unpaid trip escapes, fare disputes, and emergency safety escalations.
              </p>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 text-xs font-semibold">
              {["all", "open", "in_investigation", "resolved", "dismissed"].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setIncidentFilter(st)}
                  className={`rounded-lg px-2.5 py-1 capitalize transition-all ${
                    incidentFilter === st ? "bg-white text-slate-900 shadow-sm font-bold" : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  {st.replace("_", " ")}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="p-3">Urgency & ID</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Reporter</th>
                  <th className="p-3">Ride Ref</th>
                  <th className="p-3">Incident Statement</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(!incidentsData.incidents || incidentsData.incidents.length === 0) ? (
                  <tr>
                    <td colSpan="7" className="p-8 text-center text-slate-400">
                      <LifeBuoy className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                      No incident reports matching this status filter.
                    </td>
                  </tr>
                ) : (
                  incidentsData.incidents.map((inc) => (
                    <tr key={inc._id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`inline-block h-2 w-2 rounded-full ${
                              inc.urgency === "critical"
                                ? "bg-rose-600 animate-ping"
                                : inc.urgency === "high"
                                ? "bg-rose-500"
                                : inc.urgency === "medium"
                                ? "bg-amber-500"
                                : "bg-slate-400"
                            }`}
                          />
                          <span className="font-mono font-bold uppercase text-[11px] text-slate-900">
                            {inc.urgency}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          #{inc._id.slice(-6)}
                        </div>
                      </td>
                      <td className="p-3">
                        <span className="inline-block rounded-md bg-slate-100 px-2 py-0.5 font-semibold text-slate-800 capitalize">
                          {inc.category?.replace("_", " ")}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="font-semibold text-slate-900">{inc.reporter?.name || "Anonymous User"}</div>
                        <div className="text-[10px] text-slate-400 capitalize">{inc.reporterRole}</div>
                      </td>
                      <td className="p-3">
                        {inc.ride ? (
                          <div className="font-mono text-[11px] text-brand-600">
                            #{inc.ride._id?.slice(-6) || inc.ride.slice(-6)}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">General</span>
                        )}
                      </td>
                      <td className="p-3 max-w-sm">
                        <p className="text-slate-700 line-clamp-2 leading-relaxed">{inc.description}</p>
                        {inc.resolution && (
                          <div className="mt-1 rounded bg-emerald-50 px-2 py-1 text-[11px] text-emerald-800">
                            <strong>Resolution:</strong> {inc.resolution}
                          </div>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                            inc.status === "resolved"
                              ? "bg-emerald-100 text-emerald-800"
                              : inc.status === "in_investigation"
                              ? "bg-amber-100 text-amber-800"
                              : inc.status === "dismissed"
                              ? "bg-slate-100 text-slate-600"
                              : "bg-rose-100 text-rose-800"
                          }`}
                        >
                          {inc.status?.replace("_", " ")}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {inc.status === "open" && (
                            <button
                              type="button"
                              onClick={async () => {
                                try {
                                  await supportApi.resolveAdminIncident(inc._id, {
                                    status: "in_investigation",
                                    resolution: "Safety team actively reviewing telematics and logs.",
                                  });
                                  showToast("Moved to active investigation.", "info");
                                  loadData();
                                } catch (err) {
                                  showToast(getErrorMessage(err, "Failed to update ticket."), "error");
                                }
                              }}
                              className="rounded-lg bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-700 hover:bg-amber-100"
                            >
                              Investigate
                            </button>
                          )}
                          {inc.status !== "resolved" && (
                            <button
                              type="button"
                              onClick={() => {
                                setResolvingIncident(inc);
                                setResolutionText(
                                  inc.category === "unpaid_escape"
                                    ? "Platform Guarantee applied: Driver paid in full; rider account gated with arrears."
                                    : "Investigated telematics: Formal warning and resolution recorded."
                                );
                              }}
                              className="rounded-lg bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-emerald-500 shadow-xs"
                            >
                              Resolve
                            </button>
                          )}
                          {inc.status !== "dismissed" && inc.status !== "resolved" && (
                            <button
                              type="button"
                              onClick={async () => {
                                try {
                                  await supportApi.resolveAdminIncident(inc._id, {
                                    status: "dismissed",
                                    resolution: "Dismissed by safety officer as invalid or non-actionable.",
                                  });
                                  showToast("Incident dismissed.", "info");
                                  loadData();
                                } catch (err) {
                                  showToast(getErrorMessage(err, "Failed to dismiss."), "error");
                                }
                              }}
                              className="rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-200"
                            >
                              Dismiss
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Resolution Modal */}
          {resolvingIncident && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
              <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl animate-scale-up">
                <div className="flex items-center gap-2 text-emerald-700 font-bold">
                  <ShieldCheck className="h-5 w-5" />
                  <h3>Resolve Incident #{resolvingIncident._id.slice(-6)}</h3>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  Category: <strong className="capitalize text-slate-700">{resolvingIncident.category?.replace("_", " ")}</strong>
                </p>

                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    setResolvingLoading(true);
                    try {
                      await supportApi.resolveAdminIncident(resolvingIncident._id, {
                        status: "resolved",
                        resolution: resolutionText.trim() || "Incident resolved by admin.",
                        adminNotes: adminNotesText.trim(),
                      });
                      showToast("Incident ticket resolved and closed.", "success");
                      setResolvingIncident(null);
                      setResolutionText("");
                      setAdminNotesText("");
                      loadData();
                    } catch (err) {
                      showToast(getErrorMessage(err, "Failed to resolve ticket."), "error");
                    } finally {
                      setResolvingLoading(false);
                    }
                  }}
                  className="mt-4 space-y-3"
                >
                  <div>
                    <label className="text-xs font-semibold text-slate-700">Official Resolution Statement</label>
                    <textarea
                      rows={3}
                      value={resolutionText}
                      onChange={(e) => setResolutionText(e.target.value)}
                      placeholder="e.g. Platform Guarantee triggered. Rider debt logged."
                      className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-brand-500 focus:outline-hidden"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700">Internal Admin Notes (Optional)</label>
                    <input
                      type="text"
                      value={adminNotesText}
                      onChange={(e) => setAdminNotesText(e.target.value)}
                      placeholder="Confidential safety notes..."
                      className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-brand-500 focus:outline-hidden"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setResolvingIncident(null)}
                      disabled={resolvingLoading}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      size="sm"
                      loading={resolvingLoading}
                      className="bg-emerald-600 hover:bg-emerald-500"
                    >
                      Confirm Resolution
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
