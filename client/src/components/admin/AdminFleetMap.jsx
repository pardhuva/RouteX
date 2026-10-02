import { useEffect, useRef } from "react";
import L from "leaflet";
import { DEMO_CITY_CENTER } from "../MapView";

const createFleetIcon = (status) => {
  const color = status === "available" ? "#10b981" : status === "busy" ? "#f59e0b" : "#64748b";
  const bgAlpha = status === "available" ? "rgba(16, 185, 129, 0.25)" : "rgba(245, 158, 11, 0.25)";

  return L.divIcon({
    className: "custom-fleet-marker",
    html: `
      <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 38px; height: 38px;">
        <div style="position: absolute; inset: 0; border-radius: 9999px; background: ${bgAlpha}; animation: pulse 2s infinite;"></div>
        <div style="position: relative; z-index: 10; width: 30px; height: 30px; border-radius: 9999px; background: #0f172a; border: 2px solid ${color}; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.3);">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.5 2.8C2.1 10.7 2 10.8 2 11v5c0 .6.4 1 1 1h2"/>
            <circle cx="7" cy="17" r="2"/>
            <circle cx="17" cy="17" r="2"/>
          </svg>
        </div>
      </div>
    `,
    iconSize: [38, 38],
    iconAnchor: [19, 19],
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
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
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
          <div style="font-family: inherit; font-size: 12px; line-height: 1.4; padding: 2px;">
            <div style="font-weight: bold; font-size: 13px; color: #0f172a;">${d.name}</div>
            <div style="color: #64748b; font-size: 11px;">${d.phone || "No phone"}</div>
            <div style="margin-top: 4px; display: inline-block; padding: 2px 6px; border-radius: 4px; font-weight: bold; font-size: 10px; text-transform: uppercase; background: ${
              d.status === "available" ? "#d1fae5" : d.status === "busy" ? "#fef3c7" : "#f1f5f9"
            }; color: ${d.status === "available" ? "#065f46" : d.status === "busy" ? "#92400e" : "#475569"};">
              ${d.status}
            </div>
            ${
              d.vehicle
                ? `<div style="margin-top: 6px; border-top: 1px solid #e2e8f0; padding-top: 4px; color: #334155; font-size: 11px;">
                    🚗 ${d.vehicle.brand} ${d.vehicle.model} (${d.vehicle.registrationNumber})
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
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  }, [drivers]);

  return (
    <div className={`relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-md ${className}`}>
      <div ref={containerRef} className="h-full w-full" style={{ minHeight: "400px" }} />
      <div className="absolute top-3 left-3 z-[400] flex items-center gap-2 rounded-xl bg-white/95 px-3 py-1.5 text-xs font-bold text-slate-800 shadow-md backdrop-blur-md border border-slate-200">
        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
        <span>Live Drivers on Map ({drivers.length})</span>
      </div>
    </div>
  );
}
