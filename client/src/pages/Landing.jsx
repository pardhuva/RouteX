import { useState } from "react";
import { Link } from "react-router-dom";
import {
  MapPin,
  ShieldCheck,
  Radio,
  ArrowRight,
  Car,
  CheckCircle2,
  Clock,
  Wallet,
  Sparkles,
  ChevronRight,
  Bike,
  Navigation,
  Layers,
  Zap,
} from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Button from "../components/Button";

const RIDE_OPTIONS = [
  {
    id: "moto",
    name: "RouteX Moto",
    tagline: "Quick and affordable solo trips",
    eta: "2 mins away",
    capacity: "1 person",
    baseFare: 20,
    perKm: 8,
    sampleFare: 65,
    icon: Bike,
    vehicles: "Honda Activa, Bajaj Pulsar",
  },
  {
    id: "auto",
    name: "RouteX Auto",
    tagline: "Everyday pocket-friendly city auto",
    eta: "3 mins away",
    capacity: "3 people",
    baseFare: 30,
    perKm: 11,
    sampleFare: 95,
    icon: Zap,
    vehicles: "Bajaj Compact, Piaggio Ape",
  },
  {
    id: "go",
    name: "RouteX Go",
    tagline: "Comfortable air-conditioned compacts",
    eta: "3 mins away",
    capacity: "4 people",
    baseFare: 50,
    perKm: 15,
    sampleFare: 150,
    icon: Car,
    vehicles: "Maruti Dzire, Hyundai i20, WagonR",
    popular: true,
  },
  {
    id: "premier",
    name: "RouteX Premier",
    tagline: "Premium sedans with top-rated drivers",
    eta: "4 mins away",
    capacity: "4 people",
    baseFare: 70,
    perKm: 18,
    sampleFare: 185,
    icon: Sparkles,
    vehicles: "Honda City, Hyundai Verna, Ciaz",
  },
  {
    id: "xl",
    name: "RouteX XL",
    tagline: "Spacious 6-seater SUVs for groups & luggage",
    eta: "5 mins away",
    capacity: "6 people",
    baseFare: 90,
    perKm: 22,
    sampleFare: 240,
    icon: Layers,
    vehicles: "Toyota Innova, Maruti Ertiga",
  },
];

const ARCH_FEATURES = [
  {
    title: "Redis GEO Spatial Indexing",
    subtitle: "Real-Time Driver Matching",
    description: "Driver coordinates are indexed in-memory using Redis geospatial commands, enabling radius queries to find the nearest available drivers in milliseconds.",
    badge: "Redis GEO",
  },
  {
    title: "Socket.IO Live Streaming",
    subtitle: "Real-Time Location & Status Updates",
    description: "Bidirectional WebSocket rooms stream live driver GPS positions, dispatch notifications, and trip lifecycle events without polling.",
    badge: "WebSockets",
  },
  {
    title: "Apache Kafka Event Pipeline",
    subtitle: "Decoupled Event Streaming",
    description: "Trip state transitions (requested, accepted, completed) are emitted to Kafka topics for reliable, asynchronous processing of ledger data and analytics.",
    badge: "Kafka",
  },
  {
    title: "Atomic State & Concurrency",
    subtitle: "Zero Double-Booking Guarantee",
    description: "MongoDB conditional updates ensure atomic ride claiming so that multiple nearby drivers cannot accidentally accept the same ride request.",
    badge: "MongoDB ACID",
  },
];

const HOW_IT_WORKS = [
  {
    step: "1",
    title: "Set your destination",
    description: "Enter your pickup point and destination to view upfront guaranteed fares across vehicle categories.",
    icon: MapPin,
  },
  {
    step: "2",
    title: "Match with a nearby driver",
    description: "Our geospatial matching engine immediately locates and dispatches the closest available partner driver.",
    icon: Radio,
  },
  {
    step: "3",
    title: "Verify PIN & enjoy the ride",
    description: "Share your secure 4-digit start PIN with your driver for safety, track the route live, and settle seamlessly.",
    icon: ShieldCheck,
  },
];

export default function Landing() {
  const [selectedRide, setSelectedRide] = useState(RIDE_OPTIONS[2]);

  return (
    <div className="relative min-h-screen bg-slate-100/90 text-slate-900">

      {/* Continuous RouteX Map Background for entire page */}
      <div className="pointer-events-none fixed inset-0 opacity-45 z-0">
        <img
          src="/images/routex_map.jpg"
          alt=""
          className="h-full w-full object-cover object-center brightness-95"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-100/70 via-slate-100/80 to-slate-100/90 backdrop-blur-[0.5px]" />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar />

        {/* Hero Section — Real Mobility Product Showcase */}
        <section className="relative border-b border-slate-200/80 py-12 lg:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-10 lg:grid-cols-12 lg:items-center">
              {/* Left Hero: Booking Input Box & Headline */}
              <div className="lg:col-span-6 xl:col-span-6 space-y-6">
                <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-xs">
                  <MapPin className="h-3.5 w-3.5 text-brand-600" />
                  <span>Bangalore, IN</span>
                  <span className="text-slate-300">•</span>
                  <span className="text-emerald-600 font-medium flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live Dispatch
                  </span>
                </div>

                <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl leading-[1.1]">
                  Go anywhere with RouteX
                </h1>

                <p className="max-w-xl text-sm sm:text-base text-slate-600 leading-relaxed">
                  Everyday rides made simple and reliable. Get paired with verified nearby drivers in real-time with upfront guaranteed fares.
                </p>

                {/* Ride Request Card */}
                <div className="rounded-2xl border border-slate-200/90 bg-white/95 p-4 shadow-sm max-w-md space-y-3 backdrop-blur-sm">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-2.5">
                      <div className="h-2 w-2 rounded-full bg-slate-900 shrink-0" />
                      <input
                        type="text"
                        readOnly
                        value="Indiranagar 100ft Road, Bangalore"
                        className="w-full text-xs font-medium text-slate-800 bg-transparent outline-none cursor-default"
                      />
                    </div>
                    <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-2.5">
                      <div className="h-2 w-2 rounded-sm bg-brand-600 shrink-0" />
                      <input
                        type="text"
                        readOnly
                        value="Koramangala 4th Block, Bangalore"
                        className="w-full text-xs font-medium text-slate-800 bg-transparent outline-none cursor-default"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-1">
                    <Link to="/register" className="flex-1">
                      <Button size="md" className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs py-2.5 shadow-sm">
                        See Fares & Book
                        <ArrowRight className="ml-2 h-3.5 w-3.5" />
                      </Button>
                    </Link>
                    <Link to="/login" className="text-xs font-semibold text-slate-700 hover:text-slate-900 px-2">
                      Sign in →
                    </Link>
                  </div>
                </div>

                {/* Value Metrics */}
                <div className="grid grid-cols-3 gap-4 border-t border-slate-200/80 pt-5 max-w-md">
                  <div>
                    <div className="text-base font-bold text-slate-900">Upfront</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">Fixed Fares</div>
                  </div>
                  <div>
                    <div className="text-base font-bold text-emerald-600">80% Share</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">Driver Earnings</div>
                  </div>
                  <div>
                    <div className="text-base font-bold text-brand-600">4-Digit PIN</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">Boarding Security</div>
                  </div>
                </div>
              </div>

              {/* Right Hero: Clean 2x2 Mobility Photography Grid */}
              <div className="lg:col-span-6 xl:col-span-6">
                <div className="grid grid-cols-2 gap-3.5">
                  {/* Image 1: Real Passenger Booking */}
                  <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white aspect-[4/3] shadow-xs">
                    <img
                      src="/images/routex_hero_rider.jpg"
                      alt="Rider booking a trip on smartphone"
                      className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                    />
                  </div>

                  {/* Image 2: Verified Partner Driver */}
                  <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white aspect-[4/3] shadow-xs">
                    <img
                      src="/images/routex_driver.jpg"
                      alt="Verified RouteX Driver Partner"
                      className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                    />
                  </div>

                  {/* Image 3: City Transit Scene (Auto / Cab) */}
                  <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white aspect-[4/3] shadow-xs">
                    <img
                      src="/images/routex_hero_transit.jpg"
                      alt="Everyday city auto rickshaw and cab transit"
                      className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                    />
                  </div>

                  {/* Image 4: Passenger Arriving at Destination */}
                  <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white aspect-[4/3] shadow-xs">
                    <img
                      src="/images/routex_hero_dest.jpg"
                      alt="Passenger arriving safely at destination"
                      className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How RouteX Works */}
        <section id="dispatch" className="py-16 border-b border-slate-200/80 scroll-mt-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                How RouteX Works
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                A straightforward, transparent ride-hailing experience for riders and drivers alike.
              </p>
            </div>

            <div className="mt-12 grid gap-8 sm:grid-cols-3">
              {HOW_IT_WORKS.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.step} className="rounded-2xl border border-slate-200/90 bg-white/90 p-6 shadow-xs backdrop-blur-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-600 text-white font-semibold shadow-xs">
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className="text-xs font-bold text-slate-400">Step {item.step}</span>
                    </div>
                    <h3 className="mt-4 text-base font-bold text-slate-900">{item.title}</h3>
                    <p className="mt-2 text-sm text-slate-600 leading-relaxed">{item.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Vehicle Fleet Tiers */}
        <section id="fleet" className="py-16 border-b border-slate-200/80 scroll-mt-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Rides for every situation
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                From quick bike sprints to spacious 6-seater SUVs, choose the ride that fits your journey.
              </p>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {RIDE_OPTIONS.map((tier) => {
                const Icon = tier.icon;
                return (
                  <div
                    key={tier.id}
                    className="rounded-2xl border border-slate-200/90 bg-white/95 p-5 shadow-xs flex flex-col justify-between backdrop-blur-sm"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-brand-600">
                          <Icon className="h-5 w-5" />
                        </div>
                        <span className="text-xs text-slate-500 font-medium">{tier.capacity}</span>
                      </div>

                      <h3 className="mt-4 text-base font-bold text-slate-900">{tier.name}</h3>
                      <p className="mt-1 text-xs text-slate-600">{tier.tagline}</p>
                      <p className="mt-2 text-xs text-slate-500">Common vehicles: {tier.vehicles}</p>
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-100 flex items-baseline justify-between">
                      <div>
                        <span className="text-xs text-slate-400">Starting from</span>
                        <div className="text-lg font-bold text-slate-900">₹{tier.baseFare}</div>
                      </div>
                      <div className="text-right text-xs text-slate-500">
                        ₹{tier.perKm}/km + ₹2/min
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Driver Partner Section */}
        <section id="economics" className="py-16 border-b border-slate-200/80 scroll-mt-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
              {/* Driver Photo & Quote */}
              <div className="lg:col-span-5">
                <div className="relative overflow-hidden rounded-2xl border border-slate-200 shadow-sm bg-white">
                  <img
                    src="/images/routex_driver.jpg"
                    alt="RouteX Driver Partner"
                    className="h-80 w-full object-cover"
                  />
                  <div className="p-4 bg-slate-900 text-white">
                    <div className="text-xs font-semibold text-emerald-400">Verified Driver Partner</div>
                    <div className="text-sm font-bold mt-0.5">Venkateswara Rao · Bangalore Fleet</div>
                    <p className="mt-2 text-xs text-slate-300 italic leading-relaxed">
                      "Driving with RouteX is fair and transparent. 80% of every fare settles directly to my bank account every week with zero hidden deductions."
                    </p>
                  </div>
                </div>
              </div>

              {/* Driver Value Proposition */}
              <div className="lg:col-span-7 space-y-5">
                <div className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 border border-emerald-200">
                  80/20 Transparent Platform Model
                </div>

                <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                  Earn more on your terms. Keep 80% of every fare.
                </h2>

                <p className="text-sm text-slate-600 leading-relaxed">
                  Unlike traditional aggregators that take unpredictable 30–40% commissions, RouteX operates on a clear, guaranteed 80/20 platform split. You keep 80% of the trip fare, settled directly every week.
                </p>

                <div className="grid gap-3 sm:grid-cols-2 pt-2">
                  <div className="rounded-xl border border-slate-200/90 bg-white/90 p-3.5 shadow-xs backdrop-blur-sm">
                    <div className="font-semibold text-slate-900 text-sm">80% Net Trip Earnings</div>
                    <div className="text-xs text-slate-500 mt-1">Direct transparent cut on all completed rides.</div>
                  </div>

                  <div className="rounded-xl border border-slate-200/90 bg-white/90 p-3.5 shadow-xs backdrop-blur-sm">
                    <div className="font-semibold text-slate-900 text-sm">Automated Weekly Payouts</div>
                    <div className="text-xs text-slate-500 mt-1">Earnings settle reliably to your bank account every week.</div>
                  </div>

                  <div className="rounded-xl border border-slate-200/90 bg-white/90 p-3.5 shadow-xs backdrop-blur-sm">
                    <div className="font-semibold text-slate-900 text-sm">Smart Location Dispatch</div>
                    <div className="text-xs text-slate-500 mt-1">Get matched with pickups near you to reduce idle driving.</div>
                  </div>

                  <div className="rounded-xl border border-slate-200/90 bg-white/90 p-3.5 shadow-xs backdrop-blur-sm">
                    <div className="font-semibold text-slate-900 text-sm">Verified Passenger Profiles</div>
                    <div className="text-xs text-slate-500 mt-1">Every passenger is verified with secure PIN boarding.</div>
                  </div>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row gap-3">
                  <Link to="/register?role=driver">
                    <Button size="md" className="bg-brand-600 hover:bg-brand-700 text-white font-semibold shadow-xs">
                      Register as a Driver
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                  <Link to="/login">
                    <Button size="md" variant="secondary" className="border-slate-300 text-slate-700 bg-white/90 hover:bg-white font-medium shadow-xs">
                      Driver Sign In
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* System Engineering & Architecture */}
        <section id="architecture" className="py-16 border-b border-slate-200/80 scroll-mt-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-1.5 rounded-md bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-800 border border-blue-200">
                System Architecture
              </div>
              <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                Engineered for reliability & scale
              </h2>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                RouteX uses an event-driven architecture combining in-memory geospatial indexes, WebSocket streams, and distributed message queues for consistent real-time ride matching.
              </p>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {ARCH_FEATURES.map((item) => (
                <div
                  key={item.title}
                  className="rounded-2xl border border-slate-200/90 bg-white/95 p-5 shadow-xs flex flex-col justify-between backdrop-blur-sm"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700 border border-slate-200">
                        {item.badge}
                      </span>
                    </div>
                    <h3 className="mt-3 text-sm font-bold text-slate-900">{item.title}</h3>
                    <div className="text-xs font-medium text-brand-600 mt-0.5">{item.subtitle}</div>
                    <p className="mt-2 text-xs leading-relaxed text-slate-600">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Ready to Ride / Drive CTA */}
        <section className="py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="rounded-2xl bg-brand-900 p-8 sm:p-12 text-center text-white shadow-lg">
              <h2 className="text-2xl font-bold sm:text-3xl text-white">
                Ready to get moving with RouteX?
              </h2>
              <p className="mt-2 text-sm text-blue-100 max-w-xl mx-auto">
                Create an account in seconds to book your first ride or join as a partner driver.
              </p>
              <div className="mt-6 flex flex-col sm:flex-row justify-center gap-3">
                <Link to="/register">
                  <Button size="lg" variant="white" className="w-full sm:w-auto font-bold px-6 shadow-sm">
                    Sign Up as Rider
                  </Button>
                </Link>
                <Link to="/register?role=driver">
                  <Button size="lg" variant="secondary" className="w-full sm:w-auto border-brand-700 bg-brand-800 text-white hover:bg-brand-700 font-semibold px-6 shadow-sm">
                    Sign Up as Driver
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </div>
  );
}


