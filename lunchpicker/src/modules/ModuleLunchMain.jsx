// src/modules/ModuleLunchMain.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLunch } from "../context/LunchContext";
import Layout from "../components/Spin.jsx";
import { geocodeAddress } from "../api/locationApi"; // 只需要 geocode
import "../styles/ModuleLunchMain.css";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export default function ModuleLunchMain() {
  const navigate = useNavigate();

  const {
    setRestaurants,
    filteredRestaurants,
    setUserLocation,
    addToBlacklist,
    removeFromBlacklist,
    isBlacklisted,
    excludeBlacklisted,
    setExcludeBlacklisted,
    isTempExcluded,
    toggleTempExcluded,
    resetTempExcluded,
  } = useLunch();

  const [address, setAddress] = useState("");
  const [radius, setRadius] = useState(600); // meters
  const [cuisine, setCuisine] = useState("ALL");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [coords, setCoords] = useState(null); // { lat, lon } | null

  // -----------------------------
  // 後端搜尋 API
  // -----------------------------
  const searchBackend = async ({ lat, lon }) => {
    const url = new URL(`${API_BASE}/api/lunch/search`);
    url.searchParams.set("lat", lat);
    url.searchParams.set("lon", lon);
    url.searchParams.set("radius", radius);
    url.searchParams.set("cuisine", cuisine);

    const resp = await fetch(url.toString(), {
      method: "GET",
      credentials: "include",
    });

    const data = await resp.json();

    if (!resp.ok || !data.ok) {
      throw new Error(data.error || "Failed to fetch restaurants.");
    }

    return data.restaurants;
  };

  // -----------------------------
  // 使用 GPS
  // -----------------------------
const handleGeoLocation = () => {
  if (!navigator.geolocation) {
    setError("Geolocation is not supported by your browser.");
    return;
  }
  setLoading(true);
  setError("");

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const { latitude, longitude } = pos.coords;

      // 記住 user location（給其他地方用）
      setUserLocation({ lat: latitude, lon: longitude });

      // ⭐ 把座標存到本地 state，等等按 Find Restaurants 再查
      setCoords({ lat: latitude, lon: longitude });

      // 給使用者一個提示字串（也可以改成顯示在別的地方）
      setAddress("Using current location");

      setLoading(false);
    },
    (err) => {
      console.error(err);
      setLoading(false);
      setError("Unable to retrieve location. Please check permissions.");
    }
  );
};


  // -----------------------------
  // 手動輸入地址搜尋
  // -----------------------------
const handleSearch = async (e) => {
  e.preventDefault();
  setError("");

  // 先檢查「完全沒地址、也沒 GPS 座標」的情況
  if (!address && !coords) {
    setError("Please enter an address or use GPS.");
    return;
  }

  setLoading(true);

  try {
    let lat, lon;

    // 1) 使用 GPS：有 coords，而且 address 空或是我們設定的提示字串
    if (coords && (!address || address === "Using current location")) {
      lat = coords.lat;
      lon = coords.lon;
    } else if (address) {
      // 2) 手動地址：做 geocode
      const loc = await geocodeAddress(address);
      lat = loc.lat;
      lon = loc.lon;

      // 更新給其他地方使用
      setUserLocation({ lat, lon });
      setCoords({ lat, lon });
    }

    // 真的去打後端
    const results = await searchBackend({ lat, lon });

    // 新搜尋 → 重設暫時排除
    resetTempExcluded();
    setRestaurants(results);

    if (results.length === 0) {
      setError("No restaurants found. Try increasing the radius.");
    }
  } catch (err) {
    setError(err.message || "Search failed.");
  } finally {
    setLoading(false);
  }
};


  // -----------------------------
  // 開始抽獎
  // -----------------------------
  const handleStartDraw = () => {
    const validCount = filteredRestaurants.filter(
      (r) => !isBlacklisted(r) && !isTempExcluded(r)
    ).length;

    if (validCount < 2) {
      setError("Need at least 2 valid restaurants to spin the wheel!");
      return;
    }

    navigate("/spin");
  };

  return (
    <Layout title="Find Lunch">
      <div className="lunch-main">
        {/* 搜尋區塊 */}
        <div className="lunch-search-card">
          <form onSubmit={handleSearch} className="lunch-search-form">
            {/* Location Input */}
            <div className="lunch-form-group">
              <label className="lunch-label">地址</label>
              <div className="lunch-location-row">
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="請輸入地址..."
                  className="lunch-input"
                />
                <button
                  type="button"
                  onClick={handleGeoLocation}
                  className="lunch-gps-button"
                >
                  現在位置
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="lunch-filters-grid">
              {/* Radius */}
              <div className="lunch-form-group">
                <label className="lunch-label">
                  搜尋半徑：<span className="radius-value">{radius} m</span>
                </label>

                <input
                  type="range"
                  min="200"
                  max="3000"
                  step="100"
                  value={radius}
                  onChange={(e) => setRadius(Number(e.target.value))}
                  className="radius-slider"
                />
              </div>
              {/* Cuisine */}
              <div className="lunch-form-group">
                <label className="lunch-label">餐廳種類</label>
                <select
                  value={cuisine}
                  onChange={(e) => setCuisine(e.target.value)}
                  className="lunch-select"
                >
                  <option value="ALL">顯示全部</option>
                  <option value="chinese">中式</option>
                  <option value="japanese">日式</option>
                  <option value="italian">義式</option>
                  <option value="american">美式</option>
                  <option value="fast_food">速食</option>
                  <option value="thai">泰式</option>
                  <option value="vietnamese">越式</option>
                  <option value="cafe">咖啡廳</option>
                </select>
              </div>
            </div>

            {/* Blacklist Toggle */}
            <div className="lunch-blacklist-toggle">
              <input
                type="checkbox"
                checked={excludeBlacklisted}
                onChange={(e) => setExcludeBlacklisted(e.target.checked)}
              />
              <span>去除已加入黑名單的餐廳</span>
            </div>

            {/* Search Button */}
            <button
              type="submit"
              className="lunch-search-button"
              disabled={loading}
            >
              {loading ? "尋找中..." : "尋找餐廳 !"}
            </button>
          </form>
        </div>

        {/* Error */}
        {error && <div className="lunch-error">{error}</div>}

        {/* Results */}
        <div className="lunch-results">
          {filteredRestaurants.map((r) => {
            const blocked = isBlacklisted(r);
            const tempEx = isTempExcluded(r);

            const cardClass = [
              "restaurant-card",
              blocked
                ? "restaurant-card--blocked"
                : tempEx
                ? "restaurant-card--temp-excluded"
                : "restaurant-card--normal",
            ].join(" ");

            const nameClass = [
              "restaurant-name",
              blocked ? "restaurant-name--blocked" : "",
            ].join(" ");

            return (
              <div key={`${r.osmType}:${r.osmId}`} className={cardClass}>
                <div className="restaurant-main">
                  <h3 className={nameClass}>{r.name}</h3>

                  {/* cuisine badge */}
                  {r.cuisine && (
                    <div className="restaurant-cuisine-badges">
                      {r.cuisine
                        .split(/;|,/)
                        .map((tag) => tag.trim())
                        .filter((tag) => tag.length > 0)
                        .map((tag) => (
                          <span key={tag} className="cuisine-badge">
                            {tag}
                          </span>
                        ))}
                    </div>
                  )}

                  <div className="restaurant-meta">
                    {Math.round(r.distance)} m
                  </div>

                  <p className="restaurant-address">{r.address}</p>

                  {tempEx && !blocked && (
                    <p className="restaurant-tag restaurant-tag--temp">
                      已從本輪抽籤中排除（不列入轉盤）
                    </p>
                  )}
                  {blocked && (
                    <p className="restaurant-tag restaurant-tag--blocked">
                      已加入黑名單（所有搜尋皆排除）
                    </p>
                  )}
                </div>

                {/* 右側操作按鈕區 */}
                <div className="restaurant-actions">
                  <button
                    type="button"
                    onClick={() => toggleTempExcluded(r)}
                    className="btn-chip btn-chip--temp"
                  >
                    {tempEx ? "↩ 加回本輪" : "這輪先不要"}
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      blocked ? removeFromBlacklist(r) : addToBlacklist(r)
                    }
                    className={
                      blocked
                        ? "btn-chip btn-chip--unblock"
                        : "btn-chip btn-chip--block"
                    }
                  >
                    {blocked ? "已在黑名單" : "加入黑名單"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Sticky Button */}
        {filteredRestaurants.some(
          (r) => !isBlacklisted(r) && !isTempExcluded(r)
        ) && (
          <div className="lunch-spin-wrapper">
            <button onClick={handleStartDraw} className="lunch-spin-button">
              所以要吃什麼(轉轉盤) !
            </button>
          </div>
        )}
      </div>
    </Layout>
  );
}
