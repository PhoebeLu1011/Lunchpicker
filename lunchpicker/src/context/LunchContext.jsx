// src/context/LunchContext.jsx
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const LunchContext = createContext(null);

export function LunchProvider({ children }) {
  const [restaurants, setRestaurants] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);


  const [blacklists, setBlacklists] = useState([]);

  const [excludeBlacklisted, setExcludeBlacklisted] = useState(true);

  const [tempExcludedKeys, setTempExcludedKeys] = useState([]);

  // ========= 工具函式 =========
  const makeKey = (r) => `${r.osmType}:${r.osmId}`;

  const isBlacklisted = (r) => {
    if (!r) return false;
    return blacklists.some(
      (b) =>
        b.osmType === r.osmType &&
        Number(b.osmId) === Number(r.osmId)
    );
  };

  const isTempExcluded = (r) => {
    if (!r) return false;
    return tempExcludedKeys.includes(makeKey(r));
  };

  const toggleTempExcluded = (r) => {
    const key = makeKey(r);
    setTempExcludedKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const resetTempExcluded = () => setTempExcludedKeys([]);

  // ========= 初始化：抓自己的黑名單 =========
  useEffect(() => {
    async function fetchBlacklists() {
      try {
        const resp = await fetch(`${API_BASE}/api/blacklists/my`, {
          method: "GET",
          credentials: "include",
        });
        const data = await resp.json();
        if (!resp.ok || !data.ok) {
          console.error("Fetch blacklists failed:", data.error);
          return;
        }
        setBlacklists(data.items || []);
      } catch (err) {
        console.error("Fetch blacklists error:", err);
      }
    }

    fetchBlacklists();
  }, []);

  // ========= 黑名單操作（接後端） =========
  const addToBlacklist = async (r) => {
    try {
      const body = {
        osmId: r.osmId,
        osmType: r.osmType,
        name: r.name,
        address: r.address,
        lat: r.lat,
        lon: r.lon,
      };

      const resp = await fetch(`${API_BASE}/api/blacklists`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });

      const data = await resp.json();
      if (!resp.ok || !data.ok) {
        throw new Error(data.error || "加入黑名單失敗");
      }

      const item = data.item;
      setBlacklists((prev) => {
        // 避免重複
        const exists = prev.some(
          (b) =>
            b.osmType === item.osmType &&
            Number(b.osmId) === Number(item.osmId)
        );
        if (exists) return prev;
        return [...prev, item];
      });
    } catch (err) {
      console.error("addToBlacklist error:", err);
      alert(err.message || "加入黑名單失敗");
    }
  };

  const removeToBlacklistById = async (blackId) => {
    const resp = await fetch(`${API_BASE}/api/blacklists/${blackId}`, {
      method: "DELETE",
      credentials: "include",
    });
    const data = await resp.json();
    if (!resp.ok || !data.ok) {
      throw new Error(data.error || "刪除黑名單失敗");
    }
  };

  const removeFromBlacklist = async (r) => {
    try {
      const target = blacklists.find(
        (b) =>
          b.osmType === r.osmType &&
          Number(b.osmId) === Number(r.osmId)
      );
      if (!target) return;

      await removeToBlacklistById(target.id);

      setBlacklists((prev) => prev.filter((b) => b.id !== target.id));
    } catch (err) {
      console.error("removeFromBlacklist error:", err);
      alert(err.message || "刪除黑名單失敗");
    }
  };

  // ========= 套用過濾條件後的餐廳列表 =========
  const filteredRestaurants = useMemo(() => {
    return restaurants
      .filter((r) => {
        const blocked = isBlacklisted(r);
        const tempEx = isTempExcluded(r);

        if (tempEx) return false;
        if (excludeBlacklisted && blocked) return false;

        return true;
      })
      .map((r) => ({
        ...r,
        // 確保前端也有這個欄位（不依賴後端帶來的）
        isBlacklisted: isBlacklisted(r),
      }));
  }, [restaurants, blacklists, excludeBlacklisted, tempExcludedKeys]);

  const value = {
    // 搜尋結果
    restaurants,
    setRestaurants,
    filteredRestaurants,

    // 使用者位置
    userLocation,
    setUserLocation,

    // 黑名單
    blacklists,
    isBlacklisted,
    addToBlacklist,
    removeFromBlacklist,
    excludeBlacklisted,
    setExcludeBlacklisted,

    // 這一輪暫時排除
    isTempExcluded,
    toggleTempExcluded,
    resetTempExcluded,

    // 抽到的餐廳
    selectedRestaurant,
    setSelectedRestaurant,
  };

  return (
    <LunchContext.Provider value={value}>
      {children}
    </LunchContext.Provider>
  );
}

export function useLunch() {
  const ctx = useContext(LunchContext);
  if (!ctx) {
    throw new Error("useLunch 必須在 LunchProvider 中使用");
  }
  return ctx;
}
