import { Loader2 } from "lucide-react";

const VARIANTS = {
  primary: "bg-brand-600 text-white hover:bg-brand-700 focus-visible:ring-brand-500 shadow-xs active:bg-brand-800",
  secondary: "bg-white text-slate-800 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 focus-visible:ring-slate-300 shadow-xs",
  danger: "bg-rose-600 text-white hover:bg-rose-700 focus-visible:ring-rose-500 shadow-xs active:bg-rose-800",
  ghost: "bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-slate-300",
  dark: "bg-slate-900 text-white hover:bg-slate-800 focus-visible:ring-slate-700 shadow-xs active:bg-slate-950",
  white: "bg-white text-slate-950 hover:bg-slate-100 font-bold focus-visible:ring-slate-300 shadow-sm",
  graphite: "bg-slate-800 text-slate-100 border border-slate-700 hover:bg-slate-700 hover:text-white focus-visible:ring-slate-600 font-semibold shadow-xs",
};

const SIZES = {
  sm: "px-2.5 py-1.5 text-xs font-semibold",
  md: "px-3.5 py-2 text-sm font-semibold",
  lg: "px-5 py-2.5 text-sm font-bold",
};

export default function Button({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  fullWidth = false,
  icon: Icon,
  className = "",
  type = "button",
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-lg transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 select-none ${VARIANTS[variant]} ${SIZES[size]} ${fullWidth ? "w-full" : ""} ${className}`}
      {...props}
    >
      {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : Icon ? <Icon className="h-3.5 w-3.5" aria-hidden="true" /> : null}
      {children}
    </button>
  );
}
