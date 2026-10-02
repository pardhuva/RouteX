import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Zap,
  MapPin,
  ShieldCheck,
  Radio,
  ArrowRight,
  Car,
  CheckCircle2,
  Navigation,
  Clock,
  Wallet,
  Sparkles,
  ChevronRight,
  Star,
  Activity,
  Layers,
  Award,
} from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Button from "../components/Button";

const FLEET_TIERS = [
  {
    id: "go",
    name: "RouteX Go",
    tagline: "Everyday dependable city rides",
    eta: "2-4 mins away",
    capacity: "4 seats",
    baseFare: 50,
    perKm: 15,
    sampleTrip: 146,
    icon: Car,
    badge: "Most Popular",
    models: "Maruti Dzire, Hyundai i20, Honda Amaze",
  },
  {
    id: "ev",
    name: "RouteX Green EV",
    tagline: "Zero-emission luxury electric fleet",
    eta: "3-5 mins away",
    capacity: "4 seats",
    baseFare: 65,
    perKm: 16,
    sampleTrip: 168,
    icon: Sparkles,
    badge: "100% Electric",
    models: "Tata Nexon EV, MG ZS EV, BYD Atto",
  },
  {
    id: "auto",
    name: "RouteX Auto",
    tagline: "Beat peak-hour traffic at pocket rates",
    eta: "1-3 mins away",
    capacity: "3 seats",
    baseFare: 30,
    perKm: 11,
    sampleTrip: 98,
    icon: Navigation,
    badge: "Budget Friendly",
    models: "Bajaj RE Auto, Piaggio Ape",
  },
  {
    id: "bike",
    name: "RouteX Moto",
    tagline: "Solo sprint through dense urban streets",
    eta: "1-2 mins away",
    capacity: "1 helmet",
    baseFare: 20,
    perKm: 8,
    sampleTrip: 64,
    icon: Zap,
    badge: "Fastest ETA",
    models: "Honda Activa, TVS Jupiter",
  },
];

const ARCH_BENCHMARKS = [
  {
    icon: Radio,
    metric: "< 1 ms",
    label: "Geospatial Dispatch",
    desc: "In-memory geospatial indexing routes the closest available driver to your pickup location instantly.",
  },
  {
    icon: ShieldCheck,
    metric: "100%",
    label: "ACID Trip Integrity",
    desc: "Atomic conditional transactions guarantee zero double-bookings or phantom ride allocations.",
  },
  {
    icon: Wallet,
    metric: "80 / 20",
    label: "Driver Partner Split",
    desc: "Industry-first transparent revenue share ensuring dependable driver availability and fair pay.",
  },
  {
    icon: Layers,
    metric: "Real-Time",
    label: "Telemetry & Sync",
    desc: "High-throughput distributed event streaming powers instant status and live route updates.",
  },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Choose Pickup & Drop-off",
    description: "Enter your destination or tap directly on the interactive map. See transparent, guaranteed upfront pricing with zero surge surprises.",
    icon: MapPin,
  },
  {
    step: "02",
    title: "Instant Driver Match",
    description: "Our geospatial dispatch matches you with the nearest highly-rated driver within seconds, providing live turn-by-turn tracking.",
    icon: Radio,
  },
  {
    step: "03",
    title: "Safe Ride & Easy Payment",
    description: "Enjoy secure OTP verification, 24/7 safety monitoring, and seamless automated digital checkout with transparent invoices.",
    icon: ShieldCheck,
  },
];

export default function Landing() {
  const [selectedFleet, setSelectedFleet] = useState(FLEET_TIERS[0]);

  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-blue-600 selection:text-white">
      <Navbar />

      {/* Hero Section — Bright, Clean, Modern Uber Aesthetic */}
      <section className="relative overflow-hidden border-b border-slate-200/80 bg-gradient-to-b from-white via-slate-50/70 to-white pb-20 pt-12 lg:pb-28 lg:pt-16">
        <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
          <div className="grid gap-12 lg:grid-cols-12 lg:items-center lg:gap-10">
            {/* Left Column: Headline & Value Proposition */}
            <div className="lg:col-span-6 xl:col-span-7">


              {/* Headline — Bold, Solid, Crisp */}
              <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-6xl sm:leading-[1.08] xl:text-7xl">
                Your ride.
                <br />
                Your time.
                <br />
                <span className="text-blue-600">Your way.</span>
              </h1>

              <p className="mt-6 max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg">
                RouteX connects you with verified local drivers in seconds. Enjoy guaranteed upfront pricing, zero hidden surge multipliers, and seamless real-time GPS tracking.
              </p>

              {/* CTAs — Solid High-Contrast Modern Tech Aesthetic */}
              <div className="mt-8 flex flex-col gap-3.5 sm:flex-row sm:items-center">
                <Link to="/register">
                  <Button size="lg" variant="dark" className="w-full sm:w-auto px-7 py-3.5 text-base font-bold shadow-md hover:-translate-y-0.5 transition-transform">
                    Book a Ride
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>

                <Link to="/register">
                  <Button
                    size="lg"
                    variant="secondary"
                    className="w-full sm:w-auto px-6 py-3.5 text-base font-semibold border-slate-300 text-slate-800 hover:bg-slate-100 shadow-sm"
                  >
                    <Car className="mr-2 h-4 w-4 text-blue-600" />
                    Drive with RouteX
                    <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-bold text-blue-800 border border-blue-200">
                      Keep 80%
                    </span>
                  </Button>
                </Link>
              </div>

              {/* Micro Metrics Proof Ticker */}
              <div className="mt-12 grid grid-cols-2 gap-4 border-t border-slate-200 pt-8 sm:grid-cols-4">
                <div>
                  <div className="text-2xl font-black text-slate-900">⚡ &lt; 3 min</div>
                  <div className="text-xs text-slate-500 mt-0.5 font-medium">Average Pickup</div>
                </div>
                <div>
                  <div className="text-2xl font-black text-blue-600">⭐ 4.95</div>
                  <div className="text-xs text-slate-500 mt-0.5 font-medium">Driver Quality Rating</div>
                </div>
                <div>
                  <div className="text-2xl font-black text-emerald-600">80% Net</div>
                  <div className="text-xs text-slate-500 mt-0.5 font-medium">Driver Direct Payout</div>
                </div>
                <div>
                  <div className="text-2xl font-black text-slate-900">🛡️ 100%</div>
                  <div className="text-xs text-slate-500 mt-0.5 font-medium">Verified &amp; Insured</div>
                </div>
              </div>
            </div>

            {/* Right Column: Realistic Live Ride Dispatch HUD (Bright Modern Device Card) */}
            <div className="lg:col-span-6 xl:col-span-5">
              <div className="relative mx-auto max-w-lg lg:max-w-none">
                {/* Main Card Container — Clean White Tactile Card with Soft Elevation */}
                <div className="relative rounded-[2rem] border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xl ring-1 ring-slate-900/5">
                  {/* Top Vehicle Preview Card */}
                  <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 shadow-sm">
                    <img
                      src="/images/routex_car.jpg"
                      alt="RouteX Electric Fleet"
                      className="h-full w-full object-cover object-center transition-transform duration-700 hover:scale-105"
                    />

                    {/* Gradient Overlay for Text Readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                    {/* Live Badge in top left */}
                    <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full border border-white/20 bg-black/70 px-3 py-1 text-[11px] font-semibold text-white backdrop-blur-md">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      RouteX Prime EV
                    </div>

                    {/* Location coordinates in top right */}
                    <div className="absolute right-3 top-3 rounded-full border border-white/10 bg-black/70 px-2.5 py-1 text-[10px] font-mono text-slate-200 backdrop-blur-md">
                      Hitec City • TS 07 UA 1002
                    </div>

                    {/* Bottom overlay with quick trip stats */}
                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between rounded-xl border border-white/20 bg-white/95 px-3.5 py-2.5 shadow-md backdrop-blur-md">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                          <Zap className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900">Driver En Route</div>
                          <div className="text-[10px] text-slate-500">Pickup OTP: <strong className="text-slate-800 font-mono">4921</strong></div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-black text-blue-700">2 mins away</div>
                        <div className="text-[10px] text-slate-500">450m to Cyber Towers</div>
                      </div>
                    </div>
                  </div>

                  {/* Driver & Trip Profile — Authentic Telugu Driver Venkateswara Rao */}
                  <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/80 p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-900 font-bold text-white text-sm shadow-sm">
                          VR
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">Venkateswara Rao</span>
                            <span className="flex items-center gap-0.5 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800 border border-amber-200">
                              <Star className="h-3 w-3 fill-amber-500 text-amber-500" /> 4.95
                            </span>
                          </div>
                          <div className="text-xs text-slate-500">Tata Nexon EV • TS 07 UA 1002</div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-sm font-extrabold text-slate-900">₹146.00</div>
                        <div className="text-[10px] text-blue-600 font-semibold">Guaranteed Fare</div>
                      </div>
                    </div>

                    {/* Route Steps — Hyderabad Hubs */}
                    <div className="mt-4 space-y-2 border-t border-slate-200 pt-3 text-xs">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-2.5 w-2.5 rounded-full bg-blue-600 ring-4 ring-blue-100" />
                        <span className="font-semibold text-slate-800">Hitec City, Cyber Towers (Pickup)</span>
                      </div>
                      <div className="ml-1 h-3.5 w-0.5 border-l border-dashed border-slate-300" />
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-2.5 w-2.5 rounded-full bg-amber-500 ring-4 ring-amber-100" />
                        <span className="font-semibold text-slate-800">Gachibowli DLF Hub (Drop-off)</span>
                      </div>
                    </div>
                  </div>

                  {/* Safety and Live Telemetry Bar */}
                  <div className="mt-3 flex items-center justify-between rounded-xl border border-emerald-100 bg-emerald-50/80 px-3.5 py-2 text-xs text-emerald-900 shadow-xs">
                    <span className="flex items-center gap-2 font-medium">
                      <ShieldCheck className="h-4 w-4 text-emerald-600" />
                      Live GPS Telemetry • Verified Driver
                    </span>
                    <span className="text-[11px] font-bold text-emerald-700">24/7 Safety Active</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Fleet & Upfront Pricing Showcase */}
      <section className="border-b border-slate-200 bg-slate-50 py-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <span className="rounded-full border border-slate-300 bg-white px-3.5 py-1 text-xs font-semibold text-slate-700 shadow-sm">
              Fleet Options
            </span>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Choose your way to move
            </h2>
            <p className="mt-2 text-sm text-slate-500 sm:text-base">
              Transparent per-kilometre rates with no hidden surge markups. Select a fleet category:
            </p>
          </div>

          {/* Vehicle Selector Tabs */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
            {FLEET_TIERS.map((tier) => {
              const active = selectedFleet.id === tier.id;
              const Icon = tier.icon;
              return (
                <button
                  key={tier.id}
                  onClick={() => setSelectedFleet(tier)}
                  className={`flex items-center gap-2.5 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all ${
                    active
                      ? "border-slate-900 bg-slate-900 text-white shadow-md"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-100 shadow-sm"
                  }`}
                >
                  <Icon className={`h-4 w-4 ${active ? "text-blue-400" : "text-slate-500"}`} />
                  <span>{tier.name}</span>
                  {tier.badge && (
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                        active ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {tier.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Interactive Tier Card Preview */}
          <div className="mx-auto mt-8 max-w-4xl rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-card">
            <div className="grid gap-6 md:grid-cols-2 md:items-center">
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-bold text-blue-800 border border-blue-200">
                    {selectedFleet.badge}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-slate-600 font-medium">
                    <Clock className="h-3 w-3 text-blue-600" /> {selectedFleet.eta}
                  </span>
                </div>

                <h3 className="mt-3 text-2xl font-black text-slate-900">{selectedFleet.name}</h3>
                <p className="mt-1 text-sm text-slate-600">{selectedFleet.tagline}</p>

                <div className="mt-5 space-y-2 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0" />
                    <span>Fleet models: <strong className="text-slate-900">{selectedFleet.models}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0" />
                    <span>Capacity: <strong className="text-slate-900">{selectedFleet.capacity}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0" />
                    <span>Dual-tier geospatial dispatch with live turn-by-turn sync</span>
                  </div>
                </div>

                <div className="mt-6">
                  <Link to="/register">
                    <Button size="md" variant="dark" className="font-bold shadow-sm">
                      Book {selectedFleet.name}
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Fare Calculator Box */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 font-mono text-sm">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3 font-sans">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Transparent Fare Breakdown</span>
                  <span className="text-[11px] text-blue-700 font-mono font-bold">Base + (Dist×Rate) + (Time×₹2)</span>
                </div>

                <div className="mt-4 space-y-2.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span className="font-sans">Base Booking Fare</span>
                    <span className="text-slate-900 font-bold">₹{selectedFleet.baseFare}.00</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span className="font-sans">Per-Kilometre Rate</span>
                    <span className="text-slate-900 font-bold">₹{selectedFleet.perKm}.00 / km</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span className="font-sans">Time Rate (during trip)</span>
                    <span className="text-slate-900 font-bold">₹2.00 / min</span>
                  </div>

                  <div className="border-t border-slate-200 pt-3">
                    <div className="flex items-baseline justify-between">
                      <span className="font-sans text-slate-800 font-bold">Sample Trip (~5.0 km, 12 min):</span>
                      <span className="text-xl font-black text-blue-700">₹{selectedFleet.sampleTrip}.00</span>
                    </div>
                    <div className="mt-1 text-[11px] text-slate-500 font-sans">
                      80% direct net driver credit + 20% platform infrastructure allocation.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Driver Partner Section — Authentic Telugu Driver Venkateswara Rao */}
      <section className="relative overflow-hidden border-b border-slate-200 bg-white py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
            {/* Left Column: Authentic Driver Image */}
            <div className="lg:col-span-6">
              <div className="relative mx-auto max-w-md lg:max-w-none">
                <div className="relative overflow-hidden rounded-3xl border border-slate-200 shadow-xl">
                  <img
                    src="/images/routex_driver.jpg"
                    alt="RouteX Driver Partner Venkateswara Rao"
                    className="h-[440px] w-full object-cover object-center"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />

                  {/* Floating Quote Badge */}
                  <div className="absolute bottom-4 left-4 right-4 rounded-2xl border border-white/20 bg-white/95 p-4 shadow-lg backdrop-blur-md text-slate-900">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 font-bold text-xs text-white">
                        ✓
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900">Venkateswara Rao • RouteX Partner Driver</div>
                        <div className="text-[10px] text-blue-700 font-semibold">1,200+ rides • Hyderabad Fleet (Hitec City)</div>
                      </div>
                    </div>
                    <p className="mt-2 text-xs italic text-slate-700 leading-relaxed">
                      "RouteX tho drive cheyadam chala transparent ga undi. Every Monday 80% net direct ga bank account lo paduthundi. Smart dispatch valla Hitec City and Gachibowli madhya idle time thaggindi."
                    </p>
                    <p className="mt-1 text-[10px] text-slate-500">
                      (Translation: "Driving with RouteX is completely transparent. Every Monday 80% net earnings credit directly to my bank account. Smart dispatch between Hitec City and Gachibowli eliminated deadhead miles.")
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Driver Benefits & Earnings Guarantee */}
            <div className="lg:col-span-6">
              <span className="rounded-full border border-blue-200 bg-blue-50 px-3.5 py-1 text-xs font-semibold text-blue-800">
                Partner with RouteX
              </span>
              <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
                Keep 80% of every trip.
                <br />
                <span className="text-blue-600">Get paid every Monday.</span>
              </h2>

              <p className="mt-4 text-base text-slate-600 leading-relaxed">
                Most ride-hailing platforms deduct 30–40% in hidden commissions and penalties. RouteX guarantees an
                exact 80/20 revenue split with real-time financial tracking and automated ISO calendar week payouts.
              </p>

              <div className="mt-6 space-y-4">
                <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                    <Wallet className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Automated Weekly Bank Deposits</h4>
                    <p className="text-xs text-slate-500">Direct deposit every calendar week with downloadable earnings logs and tax invoices.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-200 text-slate-700">
                    <Radio className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Smart Geospatial Dispatch</h4>
                    <p className="text-xs text-slate-500">Zero deadhead miles. Our Redis GEO engine routes nearby riders directly to your current location.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-200 text-slate-700">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Zero Double-Booking Guarantee</h4>
                    <p className="text-xs text-slate-500">Atomic CAS ensures that once you tap accept, the ride is exclusively yours — no phantom requests.</p>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex items-center gap-4">
                <Link to="/register">
                  <Button size="lg" variant="dark" className="font-bold shadow-md">
                    Become a RouteX Driver
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/login" className="text-sm font-semibold text-slate-700 hover:text-slate-900">
                  Driver Portal Login →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Engineering Architecture Bento Grid */}
      <section id="features" className="border-b border-slate-200 bg-slate-50 py-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <span className="rounded-full border border-slate-300 bg-white px-3.5 py-1 text-xs font-semibold text-slate-700 shadow-sm">
              System Architecture
            </span>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Engineered for sub-millisecond precision
            </h2>
            <p className="mt-2 text-sm text-slate-500 sm:text-base">
              Under the hood, RouteX is an enterprise-grade distributed system designed for resilience, concurrency, and real-time scale.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {ARCH_BENCHMARKS.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-blue-700">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="mt-4 text-2xl font-black text-slate-900">{item.metric}</div>
                  <h3 className="mt-1 text-sm font-bold text-slate-800">{item.label}</h3>
                  <p className="mt-2 text-xs leading-relaxed text-slate-500">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works (3 Steps) */}
      <section id="how-it-works" className="border-b border-slate-200 bg-white py-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <span className="rounded-full border border-slate-300 bg-slate-50 px-3.5 py-1 text-xs font-semibold text-slate-700">
              Trip Lifecycle
            </span>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              How RouteX Works
            </h2>
            <p className="mt-2 text-sm text-slate-500 sm:text-base">
              From instant pickup request to verified settlement in three seamless steps.
            </p>
          </div>

          <div className="mt-12 grid gap-8 sm:grid-cols-3">
            {HOW_IT_WORKS.map((step) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.step}
                  className="relative rounded-2xl border border-slate-200 bg-slate-50/70 p-6 sm:p-8 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-blue-700 border border-slate-200 shadow-sm">
                      <Icon className="h-6 w-6" />
                    </div>
                    <span className="font-mono text-3xl font-black text-slate-300">{step.step}</span>
                  </div>

                  <h3 className="mt-6 text-lg font-bold text-slate-900">{step.title}</h3>
                  <p className="mt-2 text-xs sm:text-sm leading-relaxed text-slate-500">{step.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Final CTA Banner */}
      <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-slate-900 px-8 py-16 text-center sm:px-16 shadow-xl text-white">
          <div className="relative mx-auto max-w-2xl">
            <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
              Ready to experience RouteX?
            </h2>
            <p className="mx-auto mt-4 text-base text-slate-300">
              Join thousands of daily riders and partner drivers on India's most advanced high-concurrency urban mobility platform.
            </p>

            <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
              <Link to="/register">
                <Button size="lg" variant="white" className="w-full sm:w-auto font-bold px-8 shadow-md">
                  Get Started Today
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="secondary" className="w-full sm:w-auto border-slate-700 bg-slate-800 text-white hover:bg-slate-700">
                  Sign In to Account
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
