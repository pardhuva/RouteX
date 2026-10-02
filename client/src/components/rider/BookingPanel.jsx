import { useEffect, useState } from "react";
import {
  MapPin,
  Navigation,
  LocateFixed,
  Search,
  Sparkles,
  Clock,
  Zap,
  AlertCircle,
  Car,
  Users,
  Check,
  ShieldCheck,
} from "lucide-react";
import { BikeIcon, AutoIcon, HatchbackIcon, SedanIcon, SUVIcon } from "../VehicleIcons";
import MapView, { DEMO_CITY_CENTER } from "../MapView";
import Button from "../Button";
import LocationSearchInput from "./LocationSearchInput";
import { useGeolocation } from "../../hooks/useGeolocation";
import { useAuth } from "../../context/AuthContext";
import * as rideApi from "../../services/rideApi";
import { getErrorMessage } from "../../services/api";
import { useToast } from "../../context/ToastContext";
import { reverseGeocode } from "../../services/geocodingService";

// Real-world Uber & Rapido vehicle categories with affordable dynamic pricing
const VEHICLE_OPTIONS = [
  {
    id: "bike",
    name: "RouteX Moto",
    tagline: "Fast & pocket-friendly, beat the traffic",
    capacity: "1",
    baseFare: 15,
    perKm: 5.5,
    perMinute: 0.2,
    minFare: 20,
    icon: BikeIcon,
    badge: "Fastest",
    badgeColor: "bg-amber-100 text-amber-800 border-amber-200",
    etaMins: 2,
  },
  {
    id: "auto",
    name: "RouteX Auto",
    tagline: "Affordable, doorstep 3-wheeler auto",
    capacity: "3",
    baseFare: 25,
    perKm: 8.5,
    perMinute: 0.3,
    minFare: 30,
    icon: AutoIcon,
    badge: "Popular",
    badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
    etaMins: 3,
  },
  {
    id: "car",
    name: "RouteX Go",
    tagline: "Comfortable AC compact hatchback",
    capacity: "4",
    baseFare: 35,
    perKm: 11.5,
    perMinute: 0.5,
    minFare: 45,
    icon: HatchbackIcon,
    badge: "Best Value",
    badgeColor: "bg-blue-100 text-blue-800 border-blue-200",
    etaMins: 4,
  },
  {
    id: "sedan",
    name: "RouteX Premier",
    tagline: "Top-rated drivers & spacious sedans",
    capacity: "4",
    baseFare: 50,
    perKm: 14.0,
    perMinute: 0.6,
    minFare: 60,
    icon: SedanIcon,
    badge: "Executive",
    badgeColor: "bg-purple-100 text-purple-800 border-purple-200",
    etaMins: 5,
  },
  {
    id: "suv",
    name: "RouteX XL",
    tagline: "Extra legroom & large luggage space",
    capacity: "6",
    baseFare: 75,
    perKm: 17.0,
    perMinute: 0.8,
    minFare: 90,
    icon: SUVIcon,
    badge: "6 Seater",
    badgeColor: "bg-slate-100 text-slate-800 border-slate-200",
    etaMins: 6,
  },
];

const PRESET_LOCATIONS = [
  { name: "Central Tech Hub / Cyber Towers", coords: { longitude: 78.3772, latitude: 17.4435 } },
  { name: "Financial District / DLF Hub", coords: { longitude: 78.3582, latitude: 17.4401 } },
  { name: "City Mall & Shopping Arcade", coords: { longitude: 78.3869, latitude: 17.4338 } },
  { name: "Downtown Metro Station", coords: { longitude: 78.4482, latitude: 17.4156 } },
  { name: "International Airport Terminal", coords: { longitude: 78.4294, latitude: 17.2403 } },
];

function calculateDistanceKm(c1, c2) {
  if (!c1 || !c2) return 0;
  const R = 6371;
  const dLat = ((c2.latitude - c1.latitude) * Math.PI) / 180;
  const dLon = ((c2.longitude - c1.longitude) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((c1.latitude * Math.PI) / 180) *
      Math.cos((c2.latitude * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

function calculateTierFare(tier, distanceKm, timeMins) {
  if (!distanceKm || distanceKm <= 0) return tier.minFare;
  const raw = tier.baseFare + distanceKm * tier.perKm + timeMins * tier.perMinute;
  return Math.max(tier.minFare, Math.round(raw));
}

const emptyPoint = { address: "", coordinates: null };

export default function BookingPanel({ onRideCreated }) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { coords, requestLocation } = useGeolocation();

  const [pickup, setPickup] = useState(emptyPoint);
  const [destination, setDestination] = useState(emptyPoint);
  const [activeField, setActiveField] = useState("pickup");
  const [selectedVehicleId, setSelectedVehicleId] = useState("car");
  const [submitting, setSubmitting] = useState(false);

  // When browser GPS arrives, resolve address name
  useEffect(() => {
    if (coords) {
      reverseGeocode(coords.latitude, coords.longitude).then((resolvedAddr) => {
        setPickup({
          address: resolvedAddr || "My Current Location",
          coordinates: coords,
        });
        setActiveField("destination");
      });
    }
  }, [coords]);

  function handlePick(point, field, address) {
    if (field === "pickup") {
      setPickup({ address: address || "Selected Pickup Pin", coordinates: point });
      setActiveField("destination");
    } else {
      setDestination({ address: address || "Selected Drop-off Pin", coordinates: point });
    }
  }

  function applyPreset(preset) {
    if (activeField === "pickup") {
      setPickup({ address: preset.name, coordinates: preset.coords });
      setActiveField("destination");
    } else {
      setDestination({ address: preset.name, coordinates: preset.coords });
    }
  }

  const distanceKm = calculateDistanceKm(pickup.coordinates, destination.coordinates);
  const estimatedTimeMins = distanceKm > 0 ? Math.round(Math.max(3, distanceKm * 2.5)) : 0;

  const selectedVehicle = VEHICLE_OPTIONS.find((v) => v.id === selectedVehicleId) || VEHICLE_OPTIONS[2];
  const selectedVehicleFare = calculateTierFare(selectedVehicle, distanceKm, estimatedTimeMins);

  const hasOutstandingDebt = (user?.outstandingDebt || 0) > 0;

  const canSubmit =
    !hasOutstandingDebt &&
    pickup.address.trim() &&
    pickup.coordinates &&
    destination.address.trim() &&
    destination.coordinates;

  async function handleSubmit(e) {
    e.preventDefault();
    if (hasOutstandingDebt) {
      showToast(`Please clear your outstanding arrears of ₹${user.outstandingDebt.toFixed(2)} before booking.`, "error");
      return;
    }
    if (!canSubmit) return;

    setSubmitting(true);
    try {
      const res = await rideApi.createRide({
        pickup: {
          address: pickup.address.trim(),
          location: { type: "Point", coordinates: [pickup.coordinates.longitude, pickup.coordinates.latitude] },
        },
        destination: {
          address: destination.address.trim(),
          location: {
            type: "Point",
            coordinates: [destination.coordinates.longitude, destination.coordinates.latitude],
          },
        },
        vehicleType: selectedVehicle.id,
        estimatedFare: selectedVehicleFare,
      });
      const ride = res.data.data.ride;
      onRideCreated(ride);
      if (!ride.matchedDriver) {
        showToast("No drivers available nearby right now. Request remains open in pool.", "info");
      } else {
        showToast(`RouteX matched your ${selectedVehicle.name}! Live tracking active.`, "success");
      }
    } catch (err) {
      showToast(getErrorMessage(err, "We couldn't process your ride request. Please try again."), "error");
    } finally {
      setSubmitting(false);
    }
  }

  const mapCenter = pickup.coordinates || destination.coordinates || DEMO_CITY_CENTER;

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <form onSubmit={handleSubmit} className="lg:col-span-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Request a Ride</h2>
            <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Available
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Select your route to compare vehicle options and upfront fares.
          </p>

          {/* Outstanding Arrears / Debt Gating Box */}
          {hasOutstandingDebt && (
            <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50/90 p-3.5 text-xs text-rose-900 shadow-sm animate-pulse">
              <div className="flex items-center gap-2 font-bold text-rose-700">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                <span>Account Gated: Outstanding Balance ₹{user.outstandingDebt?.toFixed(2)}</span>
              </div>
              <p className="mt-1 text-[11px] leading-relaxed text-rose-600">
                You have an unpaid trip balance. Under the Platform Fair Play Policy, new bookings are temporarily paused until outstanding dues are settled.
              </p>
            </div>
          )}

          {/* Quick Hub Presets */}
          <div className="mt-4">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-emerald-600" /> Quick Destinations ({activeField === "pickup" ? "Setting Pickup" : "Setting Drop-off"})
            </div>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_LOCATIONS.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => applyPreset(preset)}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-medium text-slate-700 transition-colors hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Route Selection</span>
              <button
                type="button"
                onClick={requestLocation}
                className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 transition-colors"
              >
                <LocateFixed className="h-3.5 w-3.5 text-emerald-600" />
                <span>Use my browser GPS for pickup</span>
              </button>
            </div>

            {/* Pickup Search Input */}
            <LocationSearchInput
              label="Pickup Location"
              icon={MapPin}
              iconColor="text-emerald-600"
              value={pickup}
              onChange={setPickup}
              onSelect={(p) => {
                setPickup(p);
                setActiveField("destination");
              }}
              placeholder="Search pickup address, landmark, area..."
              isActive={activeField === "pickup"}
              onFocus={() => setActiveField("pickup")}
            />

            {/* Destination Search Input */}
            <LocationSearchInput
              label="Destination"
              icon={Navigation}
              iconColor="text-brand-600"
              value={destination}
              onChange={setDestination}
              onSelect={(p) => setDestination(p)}
              placeholder="Where to? (Search any destination)"
              isActive={activeField === "destination"}
              onFocus={() => setActiveField("destination")}
            />
          </div>

          {/* Interactive Vehicle Selection & Upfront Fare Comparison (Uber / Rapido Style) */}
          {distanceKm > 0 && (
            <div className="mt-5 space-y-3 border-t border-slate-200 pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Choose a Ride</h3>
                  <p className="text-[11px] text-slate-500">
                    {distanceKm} km trip • ~{estimatedTimeMins} mins travel time
                  </p>
                </div>
                <span className="flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                  <ShieldCheck className="h-3 w-3" /> Guaranteed Fares
                </span>
              </div>

              {/* Vehicle Options List */}
              <div className="space-y-2">
                {VEHICLE_OPTIONS.map((tier) => {
                  const Icon = tier.icon;
                  const isSelected = selectedVehicleId === tier.id;
                  const tierFare = calculateTierFare(tier, distanceKm, estimatedTimeMins);

                  return (
                    <div
                      key={tier.id}
                      onClick={() => setSelectedVehicleId(tier.id)}
                      className={`relative flex items-center justify-between cursor-pointer rounded-xl border p-3 transition-all ${
                        isSelected
                          ? "border-slate-900 bg-slate-50/95 shadow-sm ring-1 ring-slate-900"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-11 w-12 shrink-0 items-center justify-center rounded-xl transition-colors ${
                            isSelected
                              ? "bg-slate-900 text-amber-400"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          <Icon className="h-7 w-7" active={isSelected} />
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900">{tier.name}</span>
                            <span className="flex items-center text-[10px] font-semibold text-slate-400">
                              👤 {tier.capacity}
                            </span>
                            {tier.badge && (
                              <span
                                className={`rounded px-1.5 py-0.2 text-[9px] font-bold border ${tier.badgeColor}`}
                              >
                                {tier.badge}
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1">
                            <Clock className="h-2.5 w-2.5 text-slate-400" /> {tier.etaMins} mins away • {tier.tagline}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-sm font-black text-slate-900">₹{tierFare}.00</div>
                        <div className="text-[10px] text-emerald-600 font-semibold">No surge</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Selected Tier Breakdown Note */}
              <div className="rounded-lg bg-slate-50 p-2.5 text-[11px] text-slate-500 border border-slate-100 flex items-center justify-between">
                <span>Selected: <strong className="text-slate-800">{selectedVehicle.name}</strong></span>
                <span>Base ₹{selectedVehicle.baseFare} + ₹{selectedVehicle.perKm}/km</span>
              </div>
            </div>
          )}

          <Button
            type="submit"
            fullWidth
            size="lg"
            className="mt-5 bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 shadow-md transition-transform hover:-translate-y-0.5"
            disabled={!canSubmit}
            loading={submitting}
            icon={Search}
          >
            {hasOutstandingDebt
              ? "Account Locked (Outstanding Dues)"
              : canSubmit
              ? `Confirm ${selectedVehicle.name} • ₹${selectedVehicleFare}`
              : "Set Pickup & Drop-off to View Fares"}
          </Button>
        </div>
      </form>

      <div className="lg:col-span-3">
        <MapView
          center={mapCenter}
          pickup={pickup.coordinates}
          destination={destination.coordinates}
          interactive
          activeField={activeField}
          isSearching={submitting}
          onPick={handlePick}
          className="h-96 w-full lg:h-full lg:min-h-[520px] rounded-2xl shadow-card"
        />
      </div>
    </div>
  );
}
