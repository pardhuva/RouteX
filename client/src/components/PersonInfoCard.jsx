import { Phone, Star, ShieldCheck, Award } from "lucide-react";
import { initials } from "../utils/format";

export default function PersonInfoCard({ person, roleLabel }) {
  if (!person) return null;

  const hasRatings = (person.totalRatings || 0) > 0 && typeof person.rating === "number" && person.rating > 0;
  const isDriver = roleLabel?.toLowerCase().includes("driver");

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-xs font-black text-white shadow-xs">
          {initials(person.name)}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{roleLabel}</p>
            {isDriver && <ShieldCheck className="h-3 w-3 text-emerald-600" title="Verified Driver" />}
          </div>
          <p className="truncate text-xs font-bold text-slate-900">{person.name}</p>

          <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs">
            {/* Rating */}
            {isDriver && (
              hasRatings ? (
                <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-1.5 py-0.2 text-[10px] font-bold text-amber-700 border border-amber-200/60">
                  <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-500" />
                  {person.rating.toFixed(1)}
                  <span className="text-amber-600/70 font-normal text-[9px]">({person.totalRatings})</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.2 text-[9px] font-bold text-slate-700">
                  <Award className="h-2.5 w-2.5 text-slate-500" />
                  Active Driver
                </span>
              )
            )}

            {/* Completed trips count */}
            {isDriver && typeof person.completedTrips === "number" && (
              <span className="rounded bg-slate-100 px-1.5 py-0.2 text-[9px] font-semibold text-slate-600">
                {person.completedTrips > 0 ? `${person.completedTrips} trips` : "First trip on RouteX"}
              </span>
            )}
          </div>
        </div>

        {person.phone && (
          <a
            href={`tel:${person.phone}`}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 transition-colors shadow-2xs"
            aria-label={`Call ${person.name}`}
          >
            <Phone className="h-3.5 w-3.5" />
          </a>
        )}
      </div>

      {/* Driver Vehicle info bar */}
      {person.vehicle && (
        <div className="mt-2.5 flex items-center justify-between rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs border border-slate-100">
          <span className="font-semibold text-slate-700 text-[11px]">
            {person.vehicle.brand} {person.vehicle.model}
          </span>
          <span className="rounded bg-white px-1.5 py-0.5 font-mono text-[10px] font-bold text-slate-800 border border-slate-200">
            {person.vehicle.registrationNumber}
          </span>
        </div>
      )}
    </div>
  );
}
