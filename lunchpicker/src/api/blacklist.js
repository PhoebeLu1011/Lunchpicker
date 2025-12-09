// src/api/blacklist.js

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

/**
 * 取得自己的黑名單列表
 * 對應後端 GET /api/blacklists/my :contentReference[oaicite:7]{index=7}
 */
export async function getMyBlacklists() {
  const resp = await fetch(`${API_BASE}/api/blacklists/my`, {
    method: "GET",
    credentials: "include",
  });

  const data = await resp.json().catch(() => ({}));

  if (!resp.ok || data.ok === false) {
    throw new Error(data.error || data.message || "Failed to fetch blacklists");
  }

  // { ok: true, items: [...] }
  return data.items || [];
}

/**
 * 新增一筆黑名單
 * item 需要至少包含：osmId, osmType
 * 其他欄位（name, address, lat, lon）可選，但建議一起傳
 * 對應後端 POST /api/blacklists :contentReference[oaicite:8]{index=8}
 */
export async function addBlacklistItem(item) {
  const payload = {
    osmId: item.osmId,
    osmType: item.osmType,
    name: item.name,
    address: item.address,
    lat: item.lat,
    lon: item.lon,
  };

  const resp = await fetch(`${API_BASE}/api/blacklists`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  const data = await resp.json().catch(() => ({}));

  if (!resp.ok || data.ok === false) {
    throw new Error(data.error || data.message || "Failed to add blacklist item");
  }

  // 回傳單筆 item（後端有包好）:contentReference[oaicite:9]{index=9}
  return data.item;
}

/**
 * 移除一筆黑名單
 * 可以傳 id 字串，或傳整個 item（裡面要有 id）
 * 對應後端 DELETE /api/blacklists/<black_id> :contentReference[oaicite:10]{index=10}
 */
export async function removeBlacklistItem(blacklistOrId) {
  const id =
    typeof blacklistOrId === "string"
      ? blacklistOrId
      : blacklistOrId.id || blacklistOrId._id;

  if (!id) {
    throw new Error("blacklist id is required");
  }

  const resp = await fetch(`${API_BASE}/api/blacklists/${id}`, {
    method: "DELETE",
    credentials: "include",
  });

  const data = await resp.json().catch(() => ({}));

  if (!resp.ok || data.ok === false) {
    throw new Error(data.error || data.message || "Failed to remove blacklist item");
  }

  return true;
}
