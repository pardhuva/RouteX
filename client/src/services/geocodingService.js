import axios from "axios";

// In-memory cache for search & reverse geocode queries to minimize network requests
const searchCache = new Map();
const reverseCache = new Map();
const routeCache = new Map();

/**
 * Searches for places & addresses using Photon (Komoot OSM) + Nominatim fallback.
 * Returns array of { name, address, latitude, longitude }
 */
export async function searchLocations(query) {
  if (!query || query.trim().length < 2) return [];

  const trimmed = query.trim();
  if (searchCache.has(trimmed.toLowerCase())) {
    return searchCache.get(trimmed.toLowerCase());
  }

  try {
    // Primary: Photon (Fast, no strict rate limit, global coverage)
    const res = await axios.get("https://photon.komoot.io/api/", {
      params: { q: trimmed, limit: 6 },
      timeout: 3500,
    });

    if (res.data && res.data.features && res.data.features.length > 0) {
      const results = res.data.features.map((f) => {
        const p = f.properties;
        const parts = [p.name, p.street, p.district, p.city, p.state, p.country].filter(Boolean);
        const name = p.name || parts[0] || "Unknown place";
        const fullAddress = parts.length > 1 ? parts.join(", ") : name;

        return {
          id: `${f.geometry.coordinates[1]}-${f.geometry.coordinates[0]}`,
          name,
          address: fullAddress,
          latitude: f.geometry.coordinates[1],
          longitude: f.geometry.coordinates[0],
        };
      });

      searchCache.set(trimmed.toLowerCase(), results);
      return results;
    }
  } catch (err) {
    // Fallback to Nominatim if Photon fails
  }

  try {
    const res = await axios.get("https://nominatim.openstreetmap.org/search", {
      params: {
        q: trimmed,
        format: "json",
        addressdetails: 1,
        limit: 5,
      },
      headers: {
        "Accept-Language": "en",
      },
      timeout: 4000,
    });

    if (Array.isArray(res.data) && res.data.length > 0) {
      const results = res.data.map((item) => ({
        id: item.place_id,
        name: item.name || item.display_name.split(",")[0],
        address: item.display_name,
        latitude: parseFloat(item.lat),
        longitude: parseFloat(item.lon),
      }));

      searchCache.set(trimmed.toLowerCase(), results);
      return results;
    }
  } catch (err) {
    console.warn("Geocoding search error:", err.message);
  }

  return [];
}

/**
 * Reverse geocodes coordinates to a human-readable address.
 */
export async function reverseGeocode(latitude, longitude) {
  const key = `${latitude.toFixed(4)},${longitude.toFixed(4)}`;
  if (reverseCache.has(key)) {
    return reverseCache.get(key);
  }

  try {
    const res = await axios.get("https://nominatim.openstreetmap.org/reverse", {
      params: {
        lat: latitude,
        lon: longitude,
        format: "json",
      },
      headers: {
        "Accept-Language": "en",
      },
      timeout: 3500,
    });

    if (res.data && res.data.display_name) {
      const address = res.data.display_name;
      reverseCache.set(key, address);
      return address;
    }
  } catch (err) {
    console.warn("Reverse geocode error:", err.message);
  }

  return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
}

/**
 * Fetches real road driving directions between two coordinates via OSRM.
 * Returns array of [lat, lng] points for Leaflet Polyline.
 */
export async function fetchRoadRoute(startPoint, endPoint) {
  if (!startPoint || !endPoint) return [];

  const key = `${startPoint.longitude.toFixed(4)},${startPoint.latitude.toFixed(4)};${endPoint.longitude.toFixed(4)},${endPoint.latitude.toFixed(4)}`;
  if (routeCache.has(key)) {
    return routeCache.get(key);
  }

  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${startPoint.longitude},${startPoint.latitude};${endPoint.longitude},${endPoint.latitude}?overview=full&geometries=geojson`;
    const res = await axios.get(url, { timeout: 4000 });

    if (res.data && res.data.routes && res.data.routes[0]?.geometry?.coordinates) {
      // OSRM returns [lon, lat], Leaflet wants [lat, lon]
      const latLngs = res.data.routes[0].geometry.coordinates.map(([lon, lat]) => [lat, lon]);
      routeCache.set(key, latLngs);
      return latLngs;
    }
  } catch (err) {
    // Fallback: direct line between points
  }

  return [
    [startPoint.latitude, startPoint.longitude],
    [endPoint.latitude, endPoint.longitude],
  ];
}
