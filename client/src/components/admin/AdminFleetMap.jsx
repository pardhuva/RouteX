import { useEffect, useRef } from "react";
import L from "leaflet";
import { DEMO_CITY_CENTER } from "../MapView";

const createFleetIcon = (status) => {
  const color = status === "available" ? "#059669" : status === "busy" ? "#d97706" : "#64748b";
  const bgAlpha = status === "available" ? "rgba(5, 150, 105, 0.2)" : "rgba(217, 119, 6, 0.2)";

  return L.divIcon({
    className: "custom-fleet-marker",
    html: `
      <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 34px; height: 34px;">
        <div style="position: absolute; inset: 0; border-radius: 9999px; background: ${bgAlpha}; animation: pulse 2.5s infinite;"></div>
        <div style="position: relative; z-index: 10; width: 26px; height: 26px; border-radius: 9999px; background: #0f172a; border: 1.5px solid ${color}; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 6px rgba(0,0,0,0.25);">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.5 2.8C2.1 10.7 2 10.8 2 11v5c0 .6.4 1 1 1h2"/>
            <circle cx="7" cy="17" r="2"/>
            <circle cx="17" cy="17" r="2"/>
          </svg>
        </div>
      </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  });
};

export default function AdminFleetMap({ drivers = [], className = "" }) {
  const containerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersGroupRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || mapInstanceRef.current) return;

    const initialCenter =
      drivers.length > 0 && drivers[0].coordinates
        ? [drivers[0].coordinates.latitude, drivers[0].coordinates.longitude]
        : [DEMO_CITY_CENTER.latitude, DEMO_CITY_CENTER.longitude];

    const map = L.map(containerRef.current, {
      center: initialCenter,
      zoom: 12,
      zoomControl: false,
      attributionControl: false,
    });

    L.control.zoom({ position: "bottomright" }).addTo(map);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    markersGroupRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapInstanceRef.current || !markersGroupRef.current) return;
    const map = mapInstanceRef.current;
    const markersGroup = markersGroupRef.current;

    markersGroup.clearLayers();

    const points = [];
    drivers.forEach((d) => {
      if (d.coordinates?.latitude && d.coordinates?.longitude) {
        const latLng = [d.coordinates.latitude, d.coordinates.longitude];
        points.push(latLng);

        const marker = L.marker(latLng, { icon: createFleetIcon(d.status) });
        marker.bindPopup(`
          <div style="font-family: inherit; font-size: 11px; line-height: 1.35; padding: 2px;">
            <div style="font-weight: 700; font-size: 12px; color: #0f172a;">${d.name}</div>
            <div style="color: #64748b; font-size: 10px;">${d.phone || "No phone"}</div>
            <div style="margin-top: 4px; display: inline-block; padding: 1.5px 5px; border-radius: 4px; font-weight: 700; font-size: 9px; text-transform: uppercase; background: ${
              d.status === "available" ? "#d1fae5" : d.status === "busy" ? "#fef3c7" : "#f1f5f9"
            }; color: ${d.status === "available" ? "#065f46" : d.status === "busy" ? "#92400e" : "#475569"};">
              ${d.status}
            </div>
            ${
              d.vehicle
                ? `<div style="margin-top: 4px; border-top: 1px solid #e2e8f0; padding-top: 3px; color: #334155; font-size: 10px;">
                    ${d.vehicle.brand} ${d.vehicle.model} (${d.vehicle.registrationNumber})
                   </div>`
                : ""
            }
          </div>
        `);
        markersGroup.addLayer(marker);
      }
    });

    if (points.length === 1) {
      map.setView(points[0], 13);
    } else if (points.length > 1) {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    }
  }, [drivers]);

  return (
    <div className={`relative overflow-hidden rounded-xl border border-slate-200 bg-slate-100 shadow-xs ${className}`}>
      <div ref={containerRef} className="h-full w-full" style={{ minHeight: "400px" }} />
      <div className="absolute top-2.5 left-2.5 z-[400] flex items-center gap-2 rounded-lg bg-white/95 px-2.5 py-1 text-xs font-bold text-slate-800 shadow-xs backdrop-blur-md border border-slate-200">
        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
        <span>Live Drivers on Map ({drivers.length})</span>
      </div>
    </div>
  );
}
