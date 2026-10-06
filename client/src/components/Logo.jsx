import { Navigation } from "lucide-react";

export default function Logo({ dark = false, className = "" }) {
  return (
    <div className={`flex items-center gap-2.5 select-none font-sans ${className}`}>
      <span className="relative flex h-7 w-7 items-center justify-center rounded-lg bg-slate-900 text-white shadow-xs ring-1 ring-slate-800">
        <Navigation className="h-3.5 w-3.5 rotate-45 transform text-white fill-current" />
        <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white" />
      </span>
      <span className={`text-base font-extrabold tracking-tight ${dark ? "text-white" : "text-slate-900"}`}>
        Route<span className="text-brand-600">X</span>
      </span>
    </div>
  );
}
