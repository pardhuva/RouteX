import { Check } from "lucide-react";
import { RIDE_STEPS, rideStatusMeta } from "../utils/statusMeta";

const STEP_LABELS = {
  requested: "Matching",
  accepted: "Assigned",
  started: "In Transit",
  completed: "Completed",
};

export default function RideStatusTimeline({ status }) {
  if (status === "cancelled") {
    const meta = rideStatusMeta("cancelled");
    return (
      <div className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-bold ${meta.badge}`}>
        <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
        {meta.label}
      </div>
    );
  }

  const currentIndex = RIDE_STEPS.indexOf(status);

  return (
    <div className="flex items-center w-full">
      {RIDE_STEPS.map((step, index) => {
        const isDone = index < currentIndex;
        const isCurrent = index === currentIndex;
        const isLast = index === RIDE_STEPS.length - 1;

        return (
          <div key={step} className={`flex items-center ${isLast ? "" : "flex-1"}`}>
            <div className="flex flex-col items-center gap-1">
              <div
                className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-black transition-all ${
                  isDone
                    ? "bg-slate-900 text-white"
                    : isCurrent
                    ? "bg-brand-600 text-white ring-2 ring-brand-200"
                    : "bg-slate-100 text-slate-400 border border-slate-200"
                }`}
              >
                {isDone ? <Check className="h-3 w-3 stroke-[3]" /> : index + 1}
              </div>
              <span
                className={`text-[10px] font-bold tracking-tight ${
                  isCurrent ? "text-brand-600" : isDone ? "text-slate-700" : "text-slate-400"
                }`}
              >
                {STEP_LABELS[step]}
              </span>
            </div>
            {!isLast && (
              <div
                className={`mx-1.5 mb-3.5 h-0.5 flex-1 rounded-full transition-colors ${
                  isDone ? "bg-slate-900" : "bg-slate-200"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
