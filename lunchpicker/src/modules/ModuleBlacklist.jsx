// src/modules/ModuleBlacklist.jsx
import React, { useEffect, useState, useRef } from "react";
import Layout from "../components/Spin.jsx";
import { geocodeAddress } from "../api/locationApi";
import "../styles/ModuleBlacklist.css";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export default function ModuleBlacklist() {
  const [address, setAddress] = useState("");
  const [radius, setRadius] = useState(600); // meters

  const [searchResults, setSearchResults] = useState([]);
  const [blacklists, setBlacklists] = useState([]);

  const [loadingSearch, setLoadingSearch] = useState(false);
  const [loadingList, setLoadingList] = useState(false);
  const [error, setError] = useState("");

  const [filterMode, setFilterMode] = useState("name"); // "name" 或 "address"
  const [filterText, setFilterText] = useState("");

  const blacklistRef = useRef(null);
  // -----------------------------
  // 讀取自己的黑名單
  // -----------------------------
  const fetchMyBlacklists = async () => {
    setLoadingList(true);
    setError("");

    try {
      const resp = await fetch(`${API_BASE}/api/blacklists/my`, {
        method: "GET",
        credentials: "include",
      });

      const data = await resp.json();

      if (!resp.ok || !data.ok) {
        throw new Error(data.error || "Failed to load blacklist.");
      }

      setBlacklists(data.items || []);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to load blacklist.");
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    fetchMyBlacklists();
  }, []);

  // -----------------------------
  // 用地址搜尋附近餐廳（後端會打 Overpass）
  // -----------------------------
  const handleSearch = async (e) => {
    e.preventDefault();

    if (!address) {
      setError("請先輸入地址再搜尋");
      return;
    }

    setLoadingSearch(true);
    setError("");

    try {
      // 1) geocode 地址 -> lat/lon
      const loc = await geocodeAddress(address);
      const { lat, lon } = loc;

      // 2) 呼叫 lunch 搜尋 API（後端會再去打 Overpass）
      const url = new URL(`${API_BASE}/api/lunch/search`);
      url.searchParams.set("lat", lat);
      url.searchParams.set("lon", lon);
      url.searchParams.set("radius", radius);
      url.searchParams.set("cuisine", "ALL");

      const resp = await fetch(url.toString(), {
        method: "GET",
        credentials: "include",
      });

      const data = await resp.json();
      if (!resp.ok || !data.ok) {
        throw new Error(data.error || "Search failed.");
      }

      setSearchResults(data.restaurants || []);
      if ((data.restaurants || []).length === 0) {
        setError("附近找不到餐廳，試試看加大搜尋半徑。");
      }
    } catch (err) {
      console.error(err);
      setError(err.message || "Search failed.");
    } finally {
      setLoadingSearch(false);
    }
  };

  // -----------------------------
  // 新增到黑名單
  // -----------------------------
  const handleAddBlacklist = async (r) => {
    setError("");

    try {
      const resp = await fetch(`${API_BASE}/api/blacklists`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          osmId: r.osmId,
          osmType: r.osmType,
          name: r.name,
          address: r.address,
          lat: r.lat,
          lon: r.lon,
        }),
      });

      const data = await resp.json();
      if (!resp.ok || !data.ok) {
        throw new Error(data.error || "加入黑名單失敗");
      }

      const item = data.item;

      // 加入 / 更新到本地 blacklists 狀態
      setBlacklists((prev) => {
        const others = prev.filter((b) => b.id !== item.id);
        return [item, ...others];
      });
    } catch (err) {
      console.error(err);
      setError(err.message || "加入黑名單失敗");
    }
  };

  // -----------------------------
  // 從黑名單移除
  // -----------------------------
  const handleRemoveBlacklist = async (id) => {
    setError("");

    try {
      const resp = await fetch(`${API_BASE}/api/blacklists/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await resp.json();
      if (!resp.ok || !data.ok) {
        throw new Error(data.error || "移除黑名單失敗");
      }

      setBlacklists((prev) => prev.filter((b) => b.id !== id));
    } catch (err) {
      console.error(err);
      setError(err.message || "移除黑名單失敗");
    }
  };

  // 判斷搜尋結果是否已在黑名單中
  const isInBlacklist = (r) => {
    return blacklists.some(
      (b) =>
        b.osmType === r.osmType &&
        Number(b.osmId) === Number(r.osmId)
    );
  };

  // 簡單格式化日期
  const formatDate = (iso) => {
    if (!iso) return "";
    try {
      const d = new Date(iso);
      return d.toLocaleString();
    } catch {
      return iso;
    }
  };


  const filteredBlacklists = blacklists.filter((b) => {
    if (!filterText.trim()) return true; // 沒輸入就全部顯示

    const keyword = filterText.trim().toLowerCase();

    if (filterMode === "address") {
      return (b.address || "").toLowerCase().includes(keyword);
    } else {
      // 預設用名稱
      return (b.name || "").toLowerCase().includes(keyword);
    }
  });


  return (
    <Layout title="Blacklist">
      <div className="blacklist-page">
        {/* 搜尋 & 新增 黑名單區塊 */}
        <section className="blacklist-section">
          <h2 className="blacklist-section-title">搜尋餐廳並加入黑名單</h2>
          {/* 一鍵跳到黑名單 */}
          <button
            type="button"
            className="blacklist-jump-btn"
            onClick={() =>
              blacklistRef.current?.scrollIntoView({ behavior: "smooth" })
            }
          >
             ↓ 跳轉至"我的黑名單"
          </button>
          <form onSubmit={handleSearch} className="blacklist-search-form">
            <div className="blacklist-form-row">
              <label className="blacklist-label">地址</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="輸入地址，例如：台北市 大安區 師大路..."
                className="blacklist-input"
              />
            </div>

            <div className="blacklist-form-row">
              <label className="blacklist-label">搜尋半徑</label>
              <select
                value={radius}
                onChange={(e) => setRadius(Number(e.target.value))}
                className="blacklist-select"
              >
                <option value={500}>500 m</option>
                <option value={600}>600 m</option>
                <option value={1000}>1 km</option>
                <option value={2000}>2 km</option>
              </select>
            </div>

            <button
              type="submit"
              className="blacklist-search-button"
              disabled={loadingSearch}
            >
              {loadingSearch ? "搜尋中..." : "搜尋附近餐廳"}
            </button>
          </form>

          {/* 搜尋結果 */}
          <div className="blacklist-results">
            {searchResults.map((r) => (
              <div
                key={`${r.osmType}:${r.osmId}`}
                className="blacklist-restaurant-card"
              >
                <div className="blacklist-restaurant-main">
                  <h3 className="blacklist-restaurant-name">
                    {r.name || "未命名餐廳"}
                  </h3>

                  {/* cuisine badge（跟 LunchMain 一樣） */}
                  {r.cuisine && (
                    <div className="restaurant-cuisine-badges">
                      {r.cuisine
                        .split(/;|,/)
                        .map((tag) => tag.trim())
                        .filter((tag) => tag.length > 0)
                        .map((tag) => (
                          <span
                            key={tag}
                            className={`cuisine-badge cuisine-${tag
                              .toLowerCase()
                              .replace(/\s+/g, "_")}`}
                          >
                            {tag}
                          </span>
                        ))}
                    </div>
                  )}

                  <div className="blacklist-restaurant-meta">
                    {Math.round(r.distance)} m
                  </div>
                  <p className="blacklist-restaurant-address">{r.address}</p>
                </div>

                <div className="blacklist-restaurant-actions">
                  {isInBlacklist(r) ? (
                    <button
                      type="button"
                      className="btn-chip btn-chip--unblock"
                      disabled
                    >
                      ✔ 已在黑名單
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn-chip btn-chip--block"
                      onClick={() => handleAddBlacklist(r)}
                    >
                      🚫 加入黑名單
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 分隔線 */}
        <hr className="blacklist-divider" />

        {/* 我的黑名單列表 */}
        <section className="blacklist-section">
          <h2 className="blacklist-section-title" ref={blacklistRef}>
            我的黑名單
          </h2>

          {/* 🔍 黑名單搜尋模式切換 */}
          <div className="blacklist-filter-bar">
            <div className="blacklist-filter-toggle">
              <button
                type="button"
                className={
                  filterMode === "name"
                    ? "blacklist-filter-btn blacklist-filter-btn--active"
                    : "blacklist-filter-btn"
                }
                onClick={() => setFilterMode("name")}
              >
                依餐廳名稱搜尋
              </button>
              <button
                type="button"
                className={
                  filterMode === "address"
                    ? "blacklist-filter-btn blacklist-filter-btn--active"
                    : "blacklist-filter-btn"
                }
                onClick={() => setFilterMode("address")}
              >
                依地址搜尋
              </button>
            </div>

            <input
              type="text"
              className="blacklist-filter-input"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              placeholder={
                filterMode === "name"
                  ? "輸入餐廳名稱關鍵字..."
                  : "輸入地址關鍵字..."
              }
            />
          </div>

          {loadingList && (
            <div className="blacklist-hint">讀取黑名單中...</div>
          )}

          {!loadingList && filteredBlacklists.length === 0 && (
            <div className="blacklist-hint">
              找不到符合條件的黑名單項目。
            </div>
          )}

          <div className="blacklist-list">
            {filteredBlacklists.map((b) => (
              <div key={b.id} className="blacklist-item-card">
                <div className="blacklist-item-main">
                  <div className="blacklist-item-name">
                    {b.name || "未命名餐廳"}
                  </div>
                  <div className="blacklist-item-address">
                    {b.address}
                  </div>
                  <div className="blacklist-item-meta">
                    加入時間：{formatDate(b.createdAt)}
                  </div>
                </div>

                <div className="blacklist-item-actions">
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      (b.name || "") + " " + (b.address || "")
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="blacklist-map-link"
                  >
                    查看地圖
                  </a>

                  <button
                    type="button"
                    className="btn-chip btn-chip--unblock"
                    onClick={() => handleRemoveBlacklist(b.id)}
                  >
                    移除
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>


        {error && <div className="blacklist-error">{error}</div>}
      </div>
    </Layout>
  );
}
