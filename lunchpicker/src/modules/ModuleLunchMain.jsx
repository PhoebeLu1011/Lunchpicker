// src/modules/ModuleLunchMain.jsx
import React from "react";
import { useState } from "react";
import { geocodeAddress, fetchNearbyRestaurants } from "../api/locationApi";
// 從 localStorage 讀出黑名單關鍵字
// 會拿到像 ["火鍋", "燒烤"] 這種陣列
function loadBlacklistKeywords() {
  try {
    const raw = localStorage.getItem("lunchpicker_blacklist");
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error("讀取黑名單失敗", e);
    return [];
  }
}
export default function ModuleLunchMain() {
  const [address, setAddress] = useState("");
  const [infoMsg, setInfoMsg] = useState("");
  const [radius, setRadius] = useState(2); // km，會影響 API 搜尋半徑
  const [loading, setLoading] = useState(false);
  const [restaurants, setRestaurants] = useState([]);
  const [picked, setPicked] = useState(null);
  const [showFilter, setShowFilter] = useState(false);
  const [showList, setShowList] = useState(false);
  const [lastCoords, setLastCoords] = useState(null); 

  // 之後如果要真的拿來當 filter，可以直接用這三個 state
  const [priceFilter, setPriceFilter] = useState([]); // ex: ["$ 100-300元"]
  const [includeTypes, setIncludeTypes] = useState([]); // ex: ["中式","速食"]
  const [excludeTypes, setExcludeTypes] = useState([]); // ex: ["咖啡甜點"]

  const recentPlaces = ["台北市信義區", "台北101", "東區忠孝復興"];

  // 共用：根據座標載入附近餐廳
  async function loadRestaurantsByCoords(lat, lon, labelForMsg, overrideRadius = null) {

    const searchRadius = overrideRadius ?? radius; //如果左邊有值 → 用左邊 如果左邊是 null 或 undefined → 用右邊

  // 記住上次搜尋的位置
    setLastCoords({ lat, lon, label: labelForMsg });
    setLoading(true);
    setPicked(null);
    setInfoMsg(`正在搜尋「${labelForMsg}」附近的餐廳⋯⋯`);

    try {
    // 這裡用 searchRadius
    const list = await fetchNearbyRestaurants(lat, lon, searchRadius);
    setRestaurants(list);

    if (list.length === 0) {
      //  searchRadius
      setInfoMsg(`在 ${searchRadius} km 內找不到餐廳 QQ`);
    } else {
      setInfoMsg(
        `在 ${searchRadius} km 內找到 ${list.length} 間餐廳，可以開始抽籤！`
      );
    }
  } catch (err) {
    console.error(err);
    setInfoMsg("搜尋餐廳失敗，請稍後再試");
    setRestaurants([]);
  } finally {
    setLoading(false);
  }
}
  // 使用目前位置
  function handleUseCurrentLocation() {
    if (!navigator.geolocation) {
      setInfoMsg("此瀏覽器不支援定位功能 QQ");
      return;
    }
    setInfoMsg("正在取得目前位置⋯⋯");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const label = `目前位置：${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
        setAddress(label);
        loadRestaurantsByCoords(latitude, longitude, "目前位置");
      },
      () => {
        setInfoMsg("無法取得目前位置，請檢查定位權限");
      }
    );
  }

  // 解析輸入的地址 → geocode → 載入餐廳
  async function handleParseAddress() {
    const q = address.trim();
    if (!q) {
      setInfoMsg("請先輸入地址或地標再解析");
      return;
    }
    setLoading(true);
    setPicked(null);
    setInfoMsg("正在解析地址⋯⋯");
    try {
      const { lat, lon, label } = await geocodeAddress(q);
      await loadRestaurantsByCoords(lat, lon, label);
    } catch (err) {
      console.error(err);
      setInfoMsg(err.message || "解析地址失敗");
      setLoading(false);
    }
  }

  // 小飛機送出（等同解析地址）
  async function handleSearchSubmit(e) {
    e.preventDefault();
    await handleParseAddress();
  }

// 開始抽籤（會套用黑名單）
function handleStartDraw() {
  console.log("handleStartDraw 被觸發了");
  if (!restaurants.length) {
    setInfoMsg("目前沒有可抽籤的餐廳，請先搜尋一個地點");
    return;
  }

  // 1. 讀黑名單
  const blacklist = loadBlacklistKeywords();

  // 2. 先假設全部餐廳都是候選
  let candidates = restaurants;

  // 3. 如果有設定黑名單，就把名稱或類型中有出現關鍵字的店排除
  if (blacklist.length > 0) {
    candidates = restaurants.filter((r) => {
      const name = (r.name || "").toString();
      const cuisine = (r.cuisine || "").toString();
      const text = `${name} ${cuisine}`; // 把名字 + 類型串一起檢查
      return !blacklist.some((word) => text.includes(word));
    });
  }

  // 4. 全部都被黑名單擋掉
  if (!candidates.length) {
    setPicked(null);
    setInfoMsg("所有餐廳都被黑名單排除了，請調整黑名單或放寬搜尋範圍");
    return;
  }

  // 5. 從剩下的候選裡抽一間
  const idx = Math.floor(Math.random() * candidates.length);
  const r = candidates[idx];
  setPicked(r);
  setInfoMsg(`已隨機選出一間餐廳 👇`);
}

  return (
    <div className="lp-page">
      {/* 標題區 */}
      <section className="lp-header-block mb-4">
        <h3 className="mb-1">尋找餐廳</h3>
        <p className="text-muted small mb-0">
          輸入地點開始探索附近美食
        </p>
      </section>

      {/* 搜尋框 */}
      <form onSubmit={handleSearchSubmit} className="mb-2">
        <div className="lp-search-wrapper d-flex align-items-stretch">
          <div className="lp-search-icon d-flex align-items-center justify-content-center">
            📍
          </div>
          <input
            className="form-control lp-search-input border-0 shadow-none"
            placeholder="輸入地址或地標"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
          <button
            type="submit"
            className="lp-search-send-btn d-flex align-items-center justify-content-center"
          >
            ➤
          </button>
        </div>
      </form>

      {/* 目前位置 / 解析按鈕 */}
      <div className="d-flex gap-3 mb-3 lp-inline-actions">
        <button
          type="button"
          className="btn btn-link p-0 lp-link-button"
          onClick={handleUseCurrentLocation}
        >
          📍 使用目前位置
        </button>
        <button
          type="button"
          className="btn btn-link p-0 lp-link-button"
          onClick={handleParseAddress}
        >
          🧭 解析輸入地址
        </button>
      </div>

      {/* 最近地點 */}
      <section className="mb-4">
        <p className="small text-muted mb-2">最近使用的地點</p>
        <div className="d-flex flex-wrap gap-2">
          {recentPlaces.map((place) => (
            <button
              key={place}
              type="button"
              className="lp-chip"
              onClick={() => {
                setAddress(place);
                setInfoMsg("");
              }}
            >
              {place}
            </button>
          ))}
        </div>
      </section>

      {/* 篩選條件按鈕（黑框那顆） */}
      <button
        type="button"
        className="lp-filter-trigger w-100 mb-3"
        onClick={() => setShowFilter(true)}
      >
        <span>⚙ 設定篩選條件</span>
      </button>

      {/* 查看餐廳清單按鈕 */}
      <button
        type="button"
        className="btn btn-outline-secondary w-100 mb-3"
        onClick={() => setShowList(true)}
        disabled={restaurants.length === 0}
      >
        📋 查看所有餐廳（可刪除）
      </button>

      {/* 開始抽籤按鈕 */}
      <button
        type="button"
        className="lp-primary-btn w-100 mb-2"
        onClick={handleStartDraw}
        disabled={loading}
      >
        🎲 開始抽籤
      </button>

      {/* 抽籤結果 */}
      {picked && (
        <div className="mt-3 p-3 bg-white rounded-4 shadow-sm">
          <div className="small text-muted mb-1">今天就吃這間：</div>
          <div className="fw-semibold">{picked.name}</div>
          {picked.cuisine && (
            <div className="small text-muted">類型：{picked.cuisine}</div>
          )}
        </div>
      )}

      {/* 狀態訊息 */}
      {infoMsg && (
        <p className="small text-muted mt-3 mb-0">
          {loading ? "⌛ " : ""}
          {infoMsg}
        </p>
      )}

      {/* 資料來源 */}
      <p className="text-center extra-small text-muted mt-4 mb-0">
        資料來源：Nominatim / Overpass API（預計串接）
      </p>

      {/* 篩選條件 Modal */}
      {showFilter && (
        <FilterModal
          radius={radius}
          priceFilter={priceFilter}
          includeTypes={includeTypes}
          excludeTypes={excludeTypes}
          onRadiusChange={setRadius}
          onFiltersChange={({ priceFilter, includeTypes, excludeTypes }) => {
            setPriceFilter(priceFilter);
            setIncludeTypes(includeTypes);
            setExcludeTypes(excludeTypes);
          }}
          onApply={(newRadius) => {
            // 有搜尋過才重刷
            if (lastCoords) {
              loadRestaurantsByCoords(
                lastCoords.lat,
                lastCoords.lon,
                lastCoords.label,
                newRadius      // 用新的半徑重打 API
              );
            } else {
              // 還沒搜尋過，就只更新條件（可選）
              setInfoMsg("已套用篩選條件，下次搜尋會使用新的半徑");
            }
          }}
          onClose={() => setShowFilter(false)}
        />
      )}

      {/* 餐廳清單 Modal */}
      {showList && (
        <RestaurantListModal
          restaurants={restaurants}
          onDelete={(idx) => {
            const newList = restaurants.filter((_, i) => i !== idx);
            setRestaurants(newList);
          }}
          onClose={() => setShowList(false)}
        />
      )}
    </div>
  );
}



/* ========= 篩選條件 Modal 元件 ========= */
function FilterModal({
  radius,
  priceFilter,
  includeTypes,
  excludeTypes,
  onRadiusChange,
  onFiltersChange,
  onClose,
  onApply,
}) {
  // 開 modal 時先用父層的值當初始（暫存）
  const [tempRadius, setTempRadius] = useState(radius);
  const [tempPrice, setTempPrice] = useState(priceFilter); // array
  const [tempInclude, setTempInclude] = useState(includeTypes);
  const [tempExclude, setTempExclude] = useState(excludeTypes);

  const priceRanges = [
    "$ 100元以下",
    "$ 100-300元",
    "$ 300-600元",
    "$ 600元以上",
  ];

  const types = ["中式", "西式", "日式", "韓式", "速食", "素食", "咖啡甜點", "其他"];

  function toggleInArray(list, value) {
    return list.includes(value)
      ? list.filter((v) => v !== value)
      : [...list, value];
  }

  function handleTogglePrice(p) {
    setTempPrice((prev) => toggleInArray(prev, p));
  }

  function handleToggleInclude(t) {
    setTempInclude((prev) => toggleInArray(prev, t));
  }

  function handleToggleExclude(t) {
    setTempExclude((prev) => toggleInArray(prev, t));
  }

  function handleApply() {
    onRadiusChange(tempRadius);
    onFiltersChange({
      priceFilter: tempPrice,
      includeTypes: tempInclude,
      excludeTypes: tempExclude,
    });
    // 告訴父層「請用新的 radius 重新搜尋」
    if (onApply) {
      onApply(tempRadius);
    }

    onClose();
  }

  function handleReset() {
    setTempRadius(2);
    setTempPrice([]);
    setTempInclude([]);
    setTempExclude([]);
  }

  return (
    <div className="lp-modal-backdrop">
      <div className="lp-modal-card">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="mb-0">篩選條件</h5>
          <button
            type="button"
            className="btn btn-link p-0 lp-link-button"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {/* 搜尋半徑 */}
        <section className="mb-4">
          <div className="d-flex justify-content-between">
            <span className="small">搜尋半徑</span>
            <span className="small text-warning">
              {tempRadius.toFixed(1)} km
            </span>
          </div>
          <input
            type="range"
            min="0.5"
            max="5"
            step="0.5"
            className="form-range mt-2"
            value={tempRadius}
            onChange={(e) => setTempRadius(parseFloat(e.target.value))}
          />
        </section>

        {/* 價格區間（可多選） */}
        <section className="mb-3">
          <p className="small mb-2">價格區間</p>
          <div className="d-flex flex-wrap gap-2">
            {priceRanges.map((p) => (
              <button
                key={p}
                type="button"
                className={
                  "lp-tag lp-tag-btn" +
                  (tempPrice.includes(p) ? " lp-tag-active" : "")
                }
                onClick={() => handleTogglePrice(p)}
              >
                {p}
              </button>
            ))}
          </div>
        </section>

        {/* 餐點類型（可多選） */}
        <section className="mb-3">
          <p className="small mb-2">選擇餐點類型</p>
          <div className="d-flex flex-wrap gap-2">
            {types.map((t) => (
              <button
                key={t}
                type="button"
                className={
                  "lp-tag lp-tag-btn" +
                  (tempInclude.includes(t) ? " lp-tag-active" : "")
                }
                onClick={() => handleToggleInclude(t)}
              >
                {t}
              </button>
            ))}
          </div>
        </section>

        {/* 排除類型（可多選） */}
        <section className="mb-3">
          <p className="small mb-2">排除類型</p>
          <div className="d-flex flex-wrap gap-2">
            {types.map((t) => (
              <button
                key={t}
                type="button"
                className={
                  "lp-tag lp-tag-btn" +
                  (tempExclude.includes(t) ? " lp-tag-active" : "")
                }
                onClick={() => handleToggleExclude(t)}
              >
                {t}
              </button>
            ))}
          </div>
        </section>

        {/* 底部按鈕 */}
        <div className="d-flex justify-content-between mt-4">
          <button
            type="button"
            className="btn btn-link lp-link-button"
            onClick={handleReset}
          >
            重設
          </button>
          <button
            type="button"
            className="lp-primary-btn px-4"
            onClick={handleApply}
          >
            套用
          </button>
        </div>
      </div>
    </div>
  );
}

/* ========= 餐廳清單 Modal ========= */
function RestaurantListModal({ restaurants, onDelete, onClose }) {
  return (
    <div className="lp-modal-backdrop">
      <div className="lp-modal-card" style={{ maxHeight: "80vh", overflowY: "auto" }}>
        
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="mb-0">餐廳清單（{restaurants.length} 間）</h5>
          <button
            type="button"
            className="btn btn-link p-0 lp-link-button"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {restaurants.length === 0 ? (
          <p className="text-muted small">目前沒有餐廳資料。</p>
        ) : (
          restaurants.map((r, idx) => (
            <div
              key={idx}
              className="d-flex justify-content-between align-items-center p-2 mb-2 bg-white rounded-3 shadow-sm"
            >
              <div>
                <div className="fw-semibold">{r.name}</div>
                {r.cuisine && (
                  <div className="small text-muted">{r.cuisine}</div>
                )}
              </div>

              <button
                className="btn btn-sm btn-danger"
                onClick={() => onDelete(idx)}
              >
                刪除
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

