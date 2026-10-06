import Logo from "./Logo";

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-slate-50 text-slate-600">
      <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
        <div className="flex flex-col gap-10 md:flex-row md:justify-between">
          <div className="max-w-md">
            <Logo />
            <p className="mt-3 text-xs leading-relaxed text-slate-500">
              RouteX is a real-time ride-hailing and urban mobility platform engineered with Redis GEO geospatial indexing, Kafka event streaming, Socket.IO live telemetry, and atomic transaction settlement.
            </p>
            <div className="mt-4 flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
              <span className="text-[11px] font-mono text-slate-500">Real-time Dispatch Active</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-900">Platform</p>
              <ul className="mt-3 space-y-2 text-xs text-slate-600">
                <li><a href="/#dispatch" className="hover:text-slate-900 transition-colors">Real-time Dispatch</a></li>
                <li><a href="/#fleet" className="hover:text-slate-900 transition-colors">Fleet Categories</a></li>
                <li><a href="/#architecture" className="hover:text-slate-900 transition-colors">System Architecture</a></li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-900">Portals</p>
              <ul className="mt-3 space-y-2 text-xs text-slate-600">
                <li><a href="/login" className="hover:text-slate-900 transition-colors">Rider Booking</a></li>
                <li><a href="/login" className="hover:text-slate-900 transition-colors">Driver Partner HUD</a></li>
                <li><a href="/login" className="hover:text-slate-900 transition-colors">Operations Console</a></li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-900">Economics</p>
              <ul className="mt-3 space-y-2 text-xs text-slate-600">
                <li>80% Driver Payouts</li>
                <li>20% Platform Take Rate</li>
                <li>Guaranteed Upfront Fares</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-slate-200 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3">
          <div>
            &copy; {new Date().getFullYear()} RouteX Mobility Platform. All rights reserved.
          </div>
          <div className="flex items-center gap-1.5 font-medium">
            <span>Engineered by</span>
            <span className="text-slate-800 font-semibold">Pardhu Vabheemarati</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
