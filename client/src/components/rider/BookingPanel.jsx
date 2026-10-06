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
  Users,
  ShieldCheck,
  Check,
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

const VEHICLE_OPTIONS = [
  {
    id: "auto",
    name: "RouteX Auto",
    tagline: "Everyday doorstep 3-wheeler",
    capacity: "3",
    baseFare: 25,
    perKm: 8.5,
    perMinute: 0.3,
    minFare: 30,
    icon: AutoIcon,
    badge: "Popular",
    etaMins: 2,
  },
  {
    id: "bike",
    name: "RouteX Moto",
    tagline: "Fast solo sprint, beat the traffic",
    capacity: "1",
    baseFare: 15,
    perKm: 5.5,
    perMinute: 0.2,
    minFare: 20,
    icon: BikeIcon,
    badge: "Fastest",
    etaMins: 2,
  },
  {
    id: "car",
    name: "RouteX Go",
    tagline: "Comfortable AC compact",
    capacity: "4",
    baseFare: 35,
    perKm: 11.5,
    perMinute: 0.5,
    minFare: 45,
    icon: HatchbackIcon,
    badge: "Best Value",
    etaMins: 3,
  },
  {
    id: "sedan",
    name: "RouteX Premier",
    tagline: "Top-rated drivers & spacious sedan",
    capacity: "4",
    baseFare: 50,
    perKm: 14.0,
    perMinute: 0.6,
    minFare: 60,
    icon: SedanIcon,
    badge: "Executive",
    etaMins: 4,
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
    etaMins: 5,
  },
];

const PRESET_LOCATIONS = [
  { name: "Cyber Towers / Hitec City", coords: { longitude: 78.3772, latitude: 17.4435 } },
  { name: "DLF Cybercity / Gachibowli", coords: { longitude: 78.3582, latitude: 17.4401 } },
  { name: "Inorbit Mall / Mindspace", coords: { longitude: 78.3869, latitude: 17.4338 } },
  { name: "Jubilee Hills Metro Station", coords: { longitude: 78.4100, latitude: 17.4300 } },
  { name: "Airport Express Terminal", coords: { longitude: 78.4294, latitude: 17.2403 } },
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
  const [selectedVehicleId, setSelectedVehicleId] = useState("auto");
  const [submitting, setSubmitting] = useState(false);

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

  const selectedVehicle = VEHICLE_OPTIONS.find((v) => v.id === selectedVehicleId) || VEHICLE_OPTIONS[0];
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
      showToast(`Please clear outstanding balance of ₹${user.outstandingDebt.toFixed(2)} before booking.`, "error");
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
        showToast("No drivers nearby immediately. Request broadcast to available pool.", "info");
      } else {
        showToast(`RouteX matched your ${selectedVehicle.name}! Driver dispatched.`, "success");
      }
    } catch (err) {
      showToast(getErrorMessage(err, "We couldn't process your ride request. Please try again."), "error");
    } finally {
      setSubmitting(false);
    }
  }

  const mapCenter = pickup.coordinates || destination.coordinates || DEMO_CITY_CENTER;

  return (
    <div className="grid gap-5 lg:grid-cols-12 lg:items-stretch">
      {/* Left Booking Console (4.5 cols) */}
      <form onSubmit={handleSubmit} className="lg:col-span-5 flex flex-col justify-between">
        <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs flex flex-col gap-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-extrabold tracking-tight text-slate-900">Book a Ride</h2>
              <p className="text-[11px] text-slate-500">Live upfront pricing & geospatial matching</p>
            </div>
            <span className="flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200/60">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Dispatch Ready
            </span>
          </div>

          {/* Arrears Gating Alert */}
          {hasOutstandingDebt && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-900">
              <div className="flex items-center gap-1.5 font-bold text-rose-700">
                <AlertCircle className="h-3.5 w-3.5 shrink-0 text-rose-600" />
                <span>Account Gated: Balance ₹{user.outstandingDebt?.toFixed(2)}</span>
              </div>
              <p className="mt-1 text-[11px] text-rose-600">
                Please clear outstanding dues before booking a new trip.
              </p>
            </div>
          )}

          {/* Quick Hub Chips */}
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center justify-between">
              <span>Popular Destinations</span>
              <button
                type="button"
                onClick={requestLocation}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-800"
              >
                <LocateFixed className="h-3 w-3" /> Use GPS
              </button>
            </div>
            <div className="flex flex-wrap gap-1">
              {PRESET_LOCATIONS.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => applyPreset(preset)}
                  className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-700 hover:bg-slate-100 hover:border-slate-300 transition-colors"
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          {/* Location Inputs */}
          <div className="space-y-2">
            <LocationSearchInput
              label="Pickup Point"
              icon={MapPin}
              iconColor="text-emerald-600"
              value={pickup}
              onChange={setPickup}
              onSelect={(p) => {
                setPickup(p);
                setActiveField("destination");
              }}
              placeholder="Search pickup address..."
              isActive={activeField === "pickup"}
              onFocus={() => setActiveField("pickup")}
            />

            <LocationSearchInput
              label="Drop-off Destination"
              icon={Navigation}
              iconColor="text-brand-600"
              value={destination}
              onChange={setDestination}
              onSelect={(p) => setDestination(p)}
              placeholder="Where are you going?"
              isActive={activeField === "destination"}
              onFocus={() => setActiveField("destination")}
            />
          </div>

          {/* Vehicle Selection & Real Fare Comparison */}
          {distanceKm > 0 && (
            <div className="space-y-2.5 border-t border-slate-100 pt-3">
              <div className="flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-slate-900 uppercase tracking-wider text-[10px]">Select Vehicle Tier</span>
                  <span className="ml-2 text-slate-500 font-medium">({distanceKm} km • ~{estimatedTimeMins} mins)</span>
                </div>
                <span className="text-[10px] font-semibold text-emerald-700">Guaranteed Fare</span>
              </div>

              <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1 scrollbar-thin">
                {VEHICLE_OPTIONS.map((tier) => {
                  const Icon = tier.icon;
                  const isSelected = selectedVehicleId === tier.id;
                  const tierFare = calculateTierFare(tier, distanceKm, estimatedTimeMins);

                  return (
                    <div
                      key={tier.id}
                      onClick={() => setSelectedVehicleId(tier.id)}
                      className={`flex items-center justify-between cursor-pointer rounded-lg border p-2.5 transition-all select-none ${
                        isSelected
                          ? "border-slate-900 bg-slate-900 text-white shadow-xs"
                          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 text-slate-800"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`flex h-8 w-9 shrink-0 items-center justify-center rounded-md ${
                            isSelected ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          <Icon className="h-5 w-5" active={isSelected} />
                        </div>

                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold">{tier.name}</span>
                            <span className={`text-[10px] ${isSelected ? "text-slate-300" : "text-slate-400"}`}>
                              👥 {tier.capacity}
                            </span>
                            {tier.badge && (
                              <span
                                className={`rounded px-1 text-[9px] font-bold ${
                                  isSelected ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600 border border-slate-200"
                                }`}
                              >
                                {tier.badge}
                              </span>
                            )}
                          </div>
                          <div className={`text-[10px] ${isSelected ? "text-slate-400" : "text-slate-500"}`}>
                            {tier.etaMins}m away · {tier.tagline}
                          </div>
                        </div>
                      </div>

                      <div className="text-right whitespace-nowrap pl-2">
                        <div className="text-xs font-black">₹{tierFare}.00</div>
                        <div className={`text-[9px] font-medium ${isSelected ? "text-emerald-400" : "text-emerald-700"}`}>
                          No surge
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <Button
            type="submit"
            fullWidth
            size="lg"
            variant="dark"
            className="mt-1 font-bold shadow-xs"
            disabled={!canSubmit}
            loading={submitting}
            icon={Search}
          >
            {hasOutstandingDebt
              ? "Account Gated"
              : canSubmit
              ? `Confirm ${selectedVehicle.name} • ₹${selectedVehicleFare}`
              : "Select Pickup & Drop-off on Map"}
          </Button>
        </div>
      </form>

      {/* Right Map Canvas (7.5 cols) */}
      <div className="lg:col-span-7 h-[420px] lg:h-full lg:min-h-[500px]">
        <MapView
          center={mapCenter}
          pickup={pickup.coordinates}
          destination={destination.coordinates}
          interactive
          activeField={activeField}
          isSearching={submitting}
          onPick={handlePick}
          className="h-full w-full rounded-xl shadow-xs border border-slate-200"
        />
      </div>
    </div>
  );
}
