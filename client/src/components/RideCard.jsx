import { useNavigate } from "react-router-dom";
import { MapPin, Navigation, ChevronRight } from "lucide-react";
import Badge from "./Badge";
import { formatShortDate, formatCurrency } from "../utils/format";
import { rideStatusMeta } from "../utils/statusMeta";

export default function RideCard({ ride, role }) {
  const navigate = useNavigate();
  const meta = rideStatusMeta(ride.status);
  const counterpart = role === "driver" ? ride.rider : ride.driver;
  const counterpartLabel = role === "driver" ? "Rider" : "Driver";

  return (
    <button
      type="button"
      onClick={() => navigate(`/${role}/ride/${ride._id}`)}
      className="w-full rounded-xl border border-slate-200 bg-white p-4 text-left shadow-xs transition-all hover:border-slate-300 hover:shadow-sm"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-[11px] font-medium text-slate-500">
            <span>{formatShortDate(ride.createdAt)}</span>
            <span aria-hidden="true">&middot;</span>
            <span className="truncate">{counterpartLabel}: {counterpart?.name || "Unassigned"}</span>
          </div>

          <div className="mt-2.5 space-y-1.5">
            <div className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
              <p className="truncate text-xs font-semibold text-slate-800">{ride.pickup?.address}</p>
            </div>
            <div className="flex items-start gap-2">
              <Navigation className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-600" />
              <p className="truncate text-xs font-medium text-slate-600">{ride.destination?.address}</p>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <Badge label={meta.label} className={meta.badge} />
          <p className="text-sm font-extrabold text-slate-900">{ride.fare ? formatCurrency(ride.fare) : "—"}</p>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5 text-xs text-slate-500">
        <span className="font-mono text-[10px] text-slate-400">ID: ...{ride._id.slice(-6)}</span>
        <span className="flex items-center gap-1 font-semibold text-brand-600 group-hover:text-brand-700">
          View details <ChevronRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </button>
  );
}
