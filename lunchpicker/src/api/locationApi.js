// src/api/locationApi.js

const NOMINATIM_BASE = "https://nominatim.openstreetmap.org/search";
const OVERPASS_URL = "https://overpass-api.de/api/interpreter";

// 1) 地址 → 經緯度
export async function geocodeAddress(query) {
  const url = new URL(NOMINATIM_BASE);
  url.search = new URLSearchParams({
    q: query,
    format: "json",
    addressdetails: 1,
    limit: 1,
  });

  const res = await fetch(url.toString(), {
    headers: {
      // 瀏覽器不能改 User-Agent，就先這樣用，作業用通常 OK
    },
  });

  if (!res.ok) {
    throw new Error("Nominatim 請求失敗");
  }

  const data = await res.json();
  if (!data.length) {
    throw new Error("找不到這個地址");
  }

  const { lat, lon, display_name } = data[0];
  return {
    lat: parseFloat(lat),
    lon: parseFloat(lon),
    label: display_name,
  };
}

// 2) 用 Overpass 找附近餐廳
export async function fetchNearbyRestaurants(lat, lon, radiusKm = 2) {
  const radiusMeters = radiusKm * 1000;

  const query = `
    [out:json][timeout:25];
    (
      node["amenity"="restaurant"](around:${radiusMeters},${lat},${lon});
      way["amenity"="restaurant"](around:${radiusMeters},${lat},${lon});
      relation["amenity"="restaurant"](around:${radiusMeters},${lat},${lon});
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
    throw new Error("Overpass 請求失敗");
  }

  const data = await res.json();

  // 簡單整理一下結果
  const list = (data.elements || []).map((el) => {
    const center = el.center || { lat: el.lat, lon: el.lon };
    return {
      id: el.id,
      name: el.tags?.name || "未命名餐廳",
      lat: center?.lat,
      lon: center?.lon,
      cuisine: el.tags?.cuisine || "",
      rawTags: el.tags || {},
    };
  });

  return list;
}
