import { useEffect, useRef, useState, useCallback } from "react";
import L from "leaflet";
import { Sun, Moon, Crosshair, Navigation } from "lucide-react";
import { fetchRoadRoute, reverseGeocode } from "../services/geocodingService";

export const DEMO_CITY_CENTER = { latitude: 17.4435, longitude: 78.3772 };

// Custom CSS for Leaflet pulse and sleek pins
const createMarkerIcon = (type, heading = 0) => {
  if (type === "pickup") {
    return L.divIcon({
      className: "custom-leaflet-marker",
      html: `
        <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 36px; height: 36px;">
          <div style="position: absolute; inset: 0; border-radius: 9999px; background: rgba(16, 185, 129, 0.35); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <div style="position: relative; z-index: 10; width: 30px; height: 30px; border-radius: 9999px; background: #059669; border: 2.5px solid #ffffff; box-shadow: 0 4px 12px rgba(5,150,105,0.4); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 13px;">
            P
          </div>
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    });
  }

  if (type === "destination") {
    return L.divIcon({
      className: "custom-leaflet-marker",
      html: `
        <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 36px; height: 36px;">
          <div style="position: absolute; inset: 0; border-radius: 9999px; background: rgba(99, 102, 241, 0.35); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <div style="position: relative; z-index: 10; width: 30px; height: 30px; border-radius: 9999px; background: #4f46e5; border: 2.5px solid #ffffff; box-shadow: 0 4px 12px rgba(79,70,229,0.4); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 13px;">
            D
          </div>
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    });
  }

  // Driver car icon
  return L.divIcon({
    className: "custom-leaflet-marker",
    html: `
      <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 42px; height: 42px;">
        <div style="position: absolute; inset: 0; border-radius: 9999px; background: rgba(14, 165, 233, 0.3); animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;"></div>
        <div style="position: relative; z-index: 10; width: 34px; height: 34px; border-radius: 9999px; background: #0f172a; border: 2px solid #38bdf8; box-shadow: 0 4px 14px rgba(14,165,233,0.5); display: flex; align-items: center; justify-content: center; transform: rotate(${heading}deg); transition: transform 0.4s ease;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.5 2.8C2.1 10.7 2 10.8 2 11v5c0 .6.4 1 1 1h2"/>
            <circle cx="7" cy="17" r="2"/>
            <circle cx="17" cy="17" r="2"/>
          </svg>
        </div>
      </div>
    `,
    iconSize: [42, 42],
    iconAnchor: [21, 21],
  });
};

const TILE_LAYERS = {
  streets: {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  },
  dark: {
    url: "https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  },
};

export default function MapView({
  center = DEMO_CITY_CENTER,
  pickup,
  destination,
  driverLocation,
  rideStatus,
  isSearching = false,
  interactive = false,
  activeField = "destination",
  onPick,
  className = "",
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const tileLayerRef = useRef(null);

  const pickupMarkerRef = useRef(null);
  const destMarkerRef = useRef(null);
  const driverMarkerRef = useRef(null);
  const routePolylineRef = useRef(null);
  const driverRoutePolylineRef = useRef(null);

  const [theme, setTheme] = useState("streets"); // "streets" | "dark"
  const [heading, setHeading] = useState(0);
  const prevDriverLocRef = useRef(null);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const initialLat = pickup?.latitude || center?.latitude || DEMO_CITY_CENTER.latitude;
    const initialLon = pickup?.longitude || center?.longitude || DEMO_CITY_CENTER.longitude;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLon],
      zoom: 13,
      zoomControl: false,
      attributionControl: false,
    });

    L.control.zoom({ position: "bottomright" }).addTo(map);

    const layer = L.tileLayer(TILE_LAYERS[theme].url, {
      maxZoom: 19,
      attribution: TILE_LAYERS[theme].attribution,
    }).addTo(map);

    tileLayerRef.current = layer;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update theme tile layer
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;
    mapInstanceRef.current.removeLayer(tileLayerRef.current);
    const newLayer = L.tileLayer(TILE_LAYERS[theme].url, {
      maxZoom: 19,
      attribution: TILE_LAYERS[theme].attribution,
    }).addTo(mapInstanceRef.current);
    tileLayerRef.current = newLayer;
  }, [theme]);

  // Handle map clicks for interactive pin dropping
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    const handleMapClick = async (e) => {
      if (!interactive || !onPick) return;
      const { lat, lng } = e.latlng;
      const point = { latitude: lat, longitude: lng };

      // Reverse geocode to get a clean address name for the user
      const address = await reverseGeocode(lat, lng);
      onPick(point, activeField, address);
    };

    map.on("click", handleMapClick);
    return () => {
      map.off("click", handleMapClick);
    };
  }, [interactive, onPick, activeField]);

  // Update Pickup Marker
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    if (pickup && pickup.latitude && pickup.longitude) {
      const latLng = [pickup.latitude, pickup.longitude];
      if (!pickupMarkerRef.current) {
        pickupMarkerRef.current = L.marker(latLng, { icon: createMarkerIcon("pickup") })
          .addTo(map)
          .bindPopup("<b>Pickup Location</b>");
      } else {
        pickupMarkerRef.current.setLatLng(latLng);
      }
    } else if (pickupMarkerRef.current) {
      map.removeLayer(pickupMarkerRef.current);
      pickupMarkerRef.current = null;
    }
  }, [pickup]);

  // Update Destination Marker
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    if (destination && destination.latitude && destination.longitude) {
      const latLng = [destination.latitude, destination.longitude];
      if (!destMarkerRef.current) {
        destMarkerRef.current = L.marker(latLng, { icon: createMarkerIcon("destination") })
          .addTo(map)
          .bindPopup("<b>Drop-off Destination</b>");
      } else {
        destMarkerRef.current.setLatLng(latLng);
      }
    } else if (destMarkerRef.current) {
      map.removeLayer(destMarkerRef.current);
      destMarkerRef.current = null;
    }
  }, [destination]);

  // Update Driver Marker & calculate heading
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    if (driverLocation && driverLocation.latitude && driverLocation.longitude) {
      const latLng = [driverLocation.latitude, driverLocation.longitude];

      // Calculate heading angle
      let newHeading = heading;
      if (prevDriverLocRef.current) {
        const dLon = driverLocation.longitude - prevDriverLocRef.current.longitude;
        const dLat = driverLocation.latitude - prevDriverLocRef.current.latitude;
        if (Math.abs(dLon) > 0.00005 || Math.abs(dLat) > 0.00005) {
          const rad = Math.atan2(dLon, dLat);
          newHeading = (rad * 180) / Math.PI;
          setHeading(newHeading);
        }
      }
      prevDriverLocRef.current = driverLocation;

      if (!driverMarkerRef.current) {
        driverMarkerRef.current = L.marker(latLng, { icon: createMarkerIcon("driver", newHeading) })
          .addTo(map)
          .bindPopup("<b>RouteX Driver</b>");
      } else {
        driverMarkerRef.current.setLatLng(latLng);
        driverMarkerRef.current.setIcon(createMarkerIcon("driver", newHeading));
      }
    } else if (driverMarkerRef.current) {
      map.removeLayer(driverMarkerRef.current);
      driverMarkerRef.current = null;
    }
  }, [driverLocation, heading]);

  // Fetch and draw real road route between Pickup and Destination
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    if (pickup?.latitude && destination?.latitude) {
      let isMounted = true;
      fetchRoadRoute(pickup, destination).then((latLngs) => {
        if (!isMounted || !mapInstanceRef.current) return;

        if (routePolylineRef.current) {
          map.removeLayer(routePolylineRef.current);
        }

        routePolylineRef.current = L.polyline(latLngs, {
          color: "#4f46e5",
          weight: 5,
          opacity: 0.85,
          lineJoin: "round",
          dashArray: rideStatus === "accepted" ? "8, 8" : undefined,
        }).addTo(map);
      });

      return () => {
        isMounted = false;
      };
    } else if (routePolylineRef.current) {
      map.removeLayer(routePolylineRef.current);
      routePolylineRef.current = null;
    }
  }, [pickup?.latitude, pickup?.longitude, destination?.latitude, destination?.longitude, rideStatus]);

  // Fetch and draw live driver approach route (driver to pickup or destination)
  useEffect(() => {
    if (!mapInstanceRef.current || !driverLocation?.latitude) {
      if (driverRoutePolylineRef.current && mapInstanceRef.current) {
        mapInstanceRef.current.removeLayer(driverRoutePolylineRef.current);
        driverRoutePolylineRef.current = null;
      }
      return;
    }
    const map = mapInstanceRef.current;
    const target = rideStatus === "accepted" ? pickup : destination;

    if (target?.latitude) {
      let isMounted = true;
      fetchRoadRoute(driverLocation, target).then((latLngs) => {
        if (!isMounted || !mapInstanceRef.current) return;

        if (driverRoutePolylineRef.current) {
          map.removeLayer(driverRoutePolylineRef.current);
        }

        driverRoutePolylineRef.current = L.polyline(latLngs, {
          color: "#0ea5e9",
          weight: 4,
          opacity: 0.9,
          dashArray: "6, 6",
          lineCap: "round",
        }).addTo(map);
      });

      return () => {
        isMounted = false;
      };
    }
  }, [driverLocation?.latitude, driverLocation?.longitude, pickup?.latitude, destination?.latitude, rideStatus]);

  // Fit bounds to show all active markers nicely
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    const points = [];
    if (pickup?.latitude && pickup?.longitude) points.push([pickup.latitude, pickup.longitude]);
    if (destination?.latitude && destination?.longitude) points.push([destination.latitude, destination.longitude]);
    if (driverLocation?.latitude && driverLocation?.longitude) points.push([driverLocation.latitude, driverLocation.longitude]);

    if (points.length === 1) {
      map.setView(points[0], 14, { animate: true });
    } else if (points.length > 1) {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16, animate: true });
    }
  }, [pickup?.latitude, destination?.latitude, driverLocation?.latitude]);

  const handleCenterMap = () => {
    if (!mapInstanceRef.current) return;
    const target = pickup || destination || driverLocation || center || DEMO_CITY_CENTER;
    if (target?.latitude) {
      mapInstanceRef.current.setView([target.latitude, target.longitude], 14, { animate: true });
    }
  };

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-md ${
        interactive ? "cursor-crosshair" : ""
      } ${className}`}
      style={{ minHeight: "350px" }}
    >
      <div ref={mapContainerRef} className="absolute inset-0 h-full w-full z-0" />

      {/* Floating Map Controls */}
      <div className="absolute top-3 right-3 z-[400] flex flex-col gap-2">
        <button
          type="button"
          onClick={() => setTheme((t) => (t === "streets" ? "dark" : "streets"))}
          title={theme === "streets" ? "Switch to Dark Mode" : "Switch to Streets Mode"}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/90 p-2 text-slate-700 shadow-md backdrop-blur-md transition-all hover:bg-white hover:text-slate-900 border border-slate-200/80"
        >
          {theme === "streets" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4 text-amber-500" />}
        </button>

        <button
          type="button"
          onClick={handleCenterMap}
          title="Recenter Map"
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/90 p-2 text-slate-700 shadow-md backdrop-blur-md transition-all hover:bg-white hover:text-brand-600 border border-slate-200/80"
        >
          <Crosshair className="h-4 w-4" />
        </button>
      </div>

      {/* Interactive Helper Badge */}
      {interactive && (
        <div className="absolute bottom-3 left-3 z-[400] flex items-center gap-2 rounded-xl bg-slate-900/85 px-3 py-1.5 text-xs font-semibold text-white shadow-lg backdrop-blur-md border border-slate-700/50">
          <Navigation className="h-3.5 w-3.5 text-brand-400 animate-pulse" />
          <span>Click anywhere on map to set {activeField === "pickup" ? "Pickup" : "Drop-off"}</span>
        </div>
      )}

      {/* Real-time Status Badge */}
      {rideStatus && (
        <div className="absolute top-3 left-3 z-[400] flex items-center gap-2 rounded-xl bg-white/95 px-3 py-1.5 text-xs font-bold text-slate-800 shadow-md backdrop-blur-md border border-slate-200">
          <span
            className={`h-2.5 w-2.5 rounded-full ${
              rideStatus === "completed"
                ? "bg-emerald-500"
                : rideStatus === "started"
                ? "bg-indigo-600 animate-pulse"
                : rideStatus === "accepted"
                ? "bg-sky-500 animate-pulse"
                : "bg-amber-500 animate-ping"
            }`}
          />
          <span className="capitalize">{rideStatus === "accepted" ? "Driver on the way" : rideStatus}</span>
        </div>
      )}
    </div>
  );
}
