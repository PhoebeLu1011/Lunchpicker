// src/utils/location.js

const NOMINATIM_BASE = "https://nominatim.openstreetmap.org/search";
const OVERPASS_URL = "https://overpass-api.de/api/interpreter";

/**
 * @typedef {Object} Coordinates
 * @property {number} lat
 * @property {number} lon
 */

/**
 * @typedef {Object} Restaurant
 * @property {number} id
 * @property {string} osmId
 * @property {string} name
 * @property {number} lat
 * @property {number} lon
 * @property {string} cuisine
 * @property {string} address
 * @property {number} distance
 */

/**
 * Convert an address to coordinates using Nominatim.
 * @param {string} query
 * @returns {Promise<Coordinates & { label: string }>}
 */
export async function geocodeAddress(query) {
  const url = new URL(NOMINATIM_BASE);
  url.search = new URLSearchParams({
    q: query,
    format: "json",
    addressdetails: "1",
    limit: "1",
  }).toString();

  const res = await fetch(url.toString());

  if (!res.ok) {
    throw new Error("Geocoding service unavailable.");
  }

  const data = await res.json();
  if (!data.length) {
    throw new Error("Address not found.");
  }

  const { lat, lon, display_name } = data[0];
  return {
    lat: parseFloat(lat),
    lon: parseFloat(lon),
    label: display_name,
  };
}

/**
 * Calculate distance between two points in meters (Haversine formula).
 * @param {number} lat1
 * @param {number} lon1
 * @param {number} lat2
 * @param {number} lon2
 * @returns {number} distance in meters
 */
function getDistanceFromLatLonInM(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d * 1000; // Meters
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

/**
 * Fetch restaurants from Overpass API.
 * @param {number} lat
 * @param {number} lon
 * @param {number} radiusMeters
 * @param {string} cuisine  // 例如: "sushi"；傳 "ALL" 或空字串代表不過濾
 * @returns {Promise<Restaurant[]>}
 */
export async function fetchNearbyRestaurants(
  lat,
  lon,
  radiusMeters,
  cuisine = "ALL"
) {
  // Construct cuisine filter
  let cuisineFilter = "";
  if (cuisine && cuisine !== "ALL") {
    // Overpass regex matching for partial matches (e.g. 'sushi' inside 'japanese;sushi')
    cuisineFilter = `["cuisine"~"${cuisine}",i]`;
  }

  // Query: Search for nodes, ways, and relations tagged as restaurant or fast_food
  const query = `
    [out:json][timeout:25];
    (
      node["amenity"="restaurant"]${cuisineFilter}(around:${radiusMeters},${lat},${lon});
      way["amenity"="restaurant"]${cuisineFilter}(around:${radiusMeters},${lat},${lon});
      relation["amenity"="restaurant"]${cuisineFilter}(around:${radiusMeters},${lat},${lon});
      node["amenity"="fast_food"]${cuisineFilter}(around:${radiusMeters},${lat},${lon});
      way["amenity"="fast_food"]${cuisineFilter}(around:${radiusMeters},${lat},${lon});
      relation["amenity"="fast_food"]${cuisineFilter}(around:${radiusMeters},${lat},${lon});
    );
    out center;
  `;

  const res = await fetch(OVERPASS_URL, {
    method: "POST",
    body: query,
    headers: {
      "Content-Type": "text/plain;charset=UTF-8",
    },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch data from OpenStreetMap.");
  }

  const data = await res.json();
  const elements = data.elements || [];

  const results = elements
    .map((el) => {
      // For ways/relations, Overpass 'out center' gives us a center lat/lon
      const centerLat = el.lat || el.center?.lat || 0;
      const centerLon = el.lon || el.center?.lon || 0;

      const name = el.tags?.name || "Unnamed Restaurant";
      const street = el.tags?.["addr:street"] || "";
      const number = el.tags?.["addr:housenumber"] || "";
      const address = street ? `${street} ${number}` : "Address not available";

      return {
        id: el.id,
        osmId: `${el.type}/${el.id}`,
        name,
        lat: centerLat,
        lon: centerLon,
        cuisine: el.tags?.cuisine || "General",
        address,
        distance: getDistanceFromLatLonInM(lat, lon, centerLat, centerLon),
      };
    })
    // Optional: Filter out unnamed places
    .filter((r) => r.name !== "Unnamed Restaurant");

  // Sort by distance
  results.sort((a, b) => (a.distance || 0) - (b.distance || 0));

  return results;
}
