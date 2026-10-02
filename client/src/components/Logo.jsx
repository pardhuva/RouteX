import { Navigation } from "lucide-react";

export default function Logo({ dark = false, className = "" }) {
  return (
    <div className={`flex items-center gap-2.5 font-extrabold tracking-tight select-none ${className}`}>
      <span className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-600 via-indigo-600 to-cyan-400 text-white shadow-sm ring-1 ring-white/20 transition-transform hover:scale-105">
        <Navigation className="h-4 w-4 rotate-45 transform text-white" fill="currentColor" />
        <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-white dark:ring-slate-900" />
      </span>
      <span className={`text-lg tracking-tight ${dark ? "text-white" : "text-slate-900"}`}>
        Route<span className="bg-gradient-to-r from-brand-500 via-indigo-500 to-cyan-500 bg-clip-text text-transparent font-black">X</span>
      </span>
    </div>
  );
}
