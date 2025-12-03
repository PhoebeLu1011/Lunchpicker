// src/modules/ModuleSimple.jsx
import React, { useState, useEffect } from "react";

const STORAGE_KEY = "lunchpicker_custom_restaurants";

export default function ModuleSimple() {
  // 是否展開「新增餐廳」表單
  const [formOpen, setFormOpen] = useState(false);

  // 表單欄位
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [note, setNote] = useState("");

  // 餐廳清單 & 抽籤結果
  const [restaurants, setRestaurants] = useState([]);
  const [drawResult, setDrawResult] = useState(null);

  // 用來讓抽籤結果每次都重新觸發動畫
  const [animKey, setAnimKey] = useState(0);

  // 一進來先把 localStorage 裡的餐廳載回來
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      if (Array.isArray(parsed)) {
        setRestaurants(parsed);
      }
    } catch (e) {
      console.error("讀取自訂餐廳失敗", e);
    }
  }, []);

  // 每次餐廳列表變動就寫回 localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(restaurants));
    } catch (e) {
      console.error("儲存自訂餐廳失敗", e);
    }
  }, [restaurants]);

  function resetForm() {
    setName("");
    setCategory("");
    setNote("");
  }

  function handleAdd(e) {
    e.preventDefault();
    if (!name.trim()) {
      alert("請填寫餐廳名稱");
      return;
    }

    const newItem = {
      id: Date.now(),
      name: name.trim(),
      category: category.trim(),
      note: note.trim(),
      createdAt: new Date().toISOString(),
    };

    setRestaurants((prev) => [newItem, ...prev]);
    resetForm();
    // 保持表單打開，方便連續新增
    setDrawResult(null);
  }

  function handleCancelForm() {
    resetForm();
    setFormOpen(false);
  }

  function handleDelete(id) {
    setRestaurants((prev) => prev.filter((r) => r.id !== id));
    setDrawResult((prev) => (prev && prev.id === id ? null : prev));
  }

  function handleDraw() {
    if (restaurants.length === 0) {
      alert("目前還沒有餐廳可以抽籤！");
      return;
    }
    const idx = Math.floor(Math.random() * restaurants.length);
    const picked = restaurants[idx];
    setDrawResult(picked);
    setAnimKey((k) => k + 1); // 讓結果卡片重新掛載 → 重新播放動畫
  }

  function handleClearAll() {
    if (!window.confirm("確定要刪除所有餐廳嗎？")) return;
    setRestaurants([]);
    setDrawResult(null);
  }

  return (
    <div className="lp-page simple-page">
      {/* 使用說明卡片 */}
      <section className="simple-tip-card mb-3">
        <h5 className="mb-2">自訂餐廳抽籤</h5>
        <p className="mb-1 extra-small text-muted">
          新增你愛吃的餐廳清單，系統會隨機幫你抽選一家。
        </p>
        <p className="extra-small text-muted mb-0">
          適合有固定愛店或美食口袋名單的你！
        </p>
      </section>

      {/* 標題 + 新增按鈕列 */}
      <div className="d-flex justify-content-between align-items-center mb-2">
        <h6 className="mb-0">餐廳清單</h6>
        <button
          type="button"
          className="simple-add-btn"
          onClick={() => setFormOpen((o) => !o)}
        >
          ＋ {formOpen ? "收合表單" : "新增餐廳"}
        </button>
      </div>

      {/* 新增餐廳表單（可收合） */}
      {formOpen && (
        <section className="simple-form-card mb-3">
          <form onSubmit={handleAdd}>
            <div className="mb-2">
              <label className="simple-label">餐廳名稱 *</label>
              <input
                type="text"
                className="form-control"
                placeholder="例如：小巷口牛肉麵"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="mb-2">
              <label className="simple-label">類型（選填）</label>
              <input
                type="text"
                className="form-control"
                placeholder="例如：中式、日式、韓式…"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              />
            </div>

            <div className="mb-3">
              <label className="simple-label">備註（選填）</label>
              <input
                type="text"
                className="form-control"
                placeholder="例如：推薦紅燒牛肉麵 / 炸雞很好吃"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>

            <div className="d-flex gap-2 justify-content-end">
              <button
                type="button"
                className="simple-btn-ghost"
                onClick={handleCancelForm}
              >
                取消
              </button>
              <button type="submit" className="simple-btn-primary">
                新增
              </button>
            </div>
          </form>
        </section>
      )}

      {/* 抽籤 & 清單區塊 */}
      <section className="simple-list-card">
        {restaurants.length === 0 ? (
          <div className="simple-empty">
            <div className="empty-icon">🎲</div>
            <p className="mb-1">還沒有餐廳</p>
            <p className="extra-small text-muted mb-0">
              從右上角「新增餐廳」開始建立你的口袋名單吧！
            </p>
          </div>
        ) : (
          <>
            {/* 抽籤控制列 */}
            <div className="d-flex justify-content-between align-items-center mb-2">
              <div className="extra-small text-muted">
                共 {restaurants.length} 間餐廳
              </div>
              <div className="d-flex gap-2">
                <button
                  type="button"
                  className="simple-btn-primary"
                  onClick={handleDraw}
                >
                  開始抽籤
                </button>
                <button
                  type="button"
                  className="simple-btn-text"
                  onClick={handleClearAll}
                >
                  清空清單
                </button>
              </div>
            </div>

            {/* 抽籤結果卡片（有彈跳動畫） */}
            {drawResult && (
              <div
                key={drawResult.id + "-" + animKey}
                className="simple-draw-result mb-3"
              >
                <p className="draw-label">今天就吃這家！</p>
                <h5 className="draw-name mb-1">{drawResult.name}</h5>
                {drawResult.category && (
                  <p className="draw-category mb-0">{drawResult.category}</p>
                )}
                {drawResult.note && (
                  <p className="draw-note mb-0 text-muted extra-small">
                    {drawResult.note}
                  </p>
                )}
              </div>
            )}

            {/* 餐廳列表 */}
            <ul className="simple-list">
              {restaurants.map((r) => (
                <li key={r.id} className="simple-list-item">
                  <div>
                    <div className="restaurant-name">{r.name}</div>
                    {r.category && (
                      <div className="restaurant-meta">{r.category}</div>
                    )}
                    {r.note && (
                      <div className="restaurant-meta text-muted extra-small">
                        {r.note}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    className="simple-item-delete"
                    onClick={() => handleDelete(r.id)}
                  >
                    刪除
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </div>
  );
}
