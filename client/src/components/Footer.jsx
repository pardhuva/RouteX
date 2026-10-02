import Logo from "./Logo";

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white text-slate-600">
      <div className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
        <div className="flex flex-col gap-10 md:flex-row md:justify-between">
          <div className="max-w-md">
            <Logo />
            <p className="mt-3 text-sm leading-relaxed text-slate-500">
              RouteX is a next-generation urban mobility and ride-hailing platform built for speed, transparency, and rider safety — featuring real-time driver dispatch, transparent upfront fares, and 24/7 incident assistance.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            <div>
              <p className="text-sm font-bold text-slate-900">Platform</p>
              <ul className="mt-3 space-y-2 text-sm text-slate-600">
                <li><a href="#features" className="hover:text-slate-900 transition-colors">Safety &amp; Features</a></li>
                <li><a href="#how-it-works" className="hover:text-slate-900 transition-colors">How It Works</a></li>
                <li><a href="/login" className="hover:text-slate-900 transition-colors">Driver Fleet</a></li>
              </ul>
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">Account</p>
              <ul className="mt-3 space-y-2 text-sm text-slate-600">
                <li><a href="/login" className="hover:text-slate-900 transition-colors">Sign In</a></li>
                <li><a href="/register" className="hover:text-slate-900 transition-colors">Book a Ride</a></li>
                <li><a href="/register" className="hover:text-slate-900 transition-colors">Drive With Us</a></li>
              </ul>
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">Trust &amp; Safety</p>
              <ul className="mt-3 space-y-2 text-sm text-slate-600">
                <li>Verified Drivers</li>
                <li>24/7 Emergency Support</li>
                <li>Platform Fare Guarantee</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-slate-100 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3">
          <div>
            &copy; {new Date().getFullYear()} RouteX Technologies Inc. All rights reserved.
          </div>
          <div className="flex items-center gap-1.5">
            <span>Crafted &amp; engineered by</span>
            <span className="text-slate-800 font-semibold">Pardhu Vabheemarati</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
