import { Phone, Star, ShieldCheck, Award } from "lucide-react";
import { initials } from "../utils/format";

export default function PersonInfoCard({ person, roleLabel }) {
  if (!person) return null;

  const hasRatings = (person.totalRatings || 0) > 0 && typeof person.rating === "number" && person.rating > 0;
  const isDriver = roleLabel?.toLowerCase().includes("driver");

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3.5">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-900 to-slate-700 text-sm font-black text-white shadow-sm">
          {initials(person.name)}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{roleLabel}</p>
            {isDriver && <ShieldCheck className="h-3 w-3 text-emerald-600" title="Verified Driver" />}
          </div>
          <p className="truncate text-sm font-bold text-slate-900">{person.name}</p>

          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
            {/* Rating */}
            {isDriver && (
              hasRatings ? (
                <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-1.5 py-0.5 text-[11px] font-bold text-amber-700 border border-amber-200/60">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-500" />
                  {person.rating.toFixed(1)}
                  <span className="text-amber-600/70 font-normal text-[10px]">({person.totalRatings})</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-bold text-blue-700 border border-blue-200/60">
                  <Award className="h-3 w-3 text-blue-500" />
                  New Driver
                </span>
              )
            )}

            {/* Completed trips count */}
            {isDriver && typeof person.completedTrips === "number" && (
              <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 border border-slate-200">
                {person.completedTrips > 0 ? `${person.completedTrips} trips completed` : "First trip on RouteX"}
              </span>
            )}
          </div>
        </div>

        {person.phone && (
          <a
            href={`tel:${person.phone}`}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors shadow-sm"
            aria-label={`Call ${person.name}`}
          >
            <Phone className="h-4 w-4" />
          </a>
        )}
      </div>

      {/* Driver Vehicle info bar */}
      {person.vehicle && (
        <div className="mt-3 flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-xs border border-slate-100">
          <span className="font-semibold text-slate-800">
            {person.vehicle.brand} {person.vehicle.model}
          </span>
          <span className="rounded bg-slate-200/70 px-2 py-0.5 font-mono text-[11px] font-bold text-slate-800 uppercase tracking-wider">
            {person.vehicle.registrationNumber}
          </span>
        </div>
      )}
    </div>
  );
}
