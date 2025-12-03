// src/modules/group/GroupCreateForm.jsx
import React, { useState } from "react";

export default function GroupCreateForm({ onBack, onSubmit, loading }) {
  const [name, setName] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    if (loading) return;
    onSubmit(name);
  }

  return (
    <div className="group-page">
      <button className="back-btn" onClick={onBack}>
        ← 返回
      </button>

      <div className="group-create-layout">
        <div className="group-card create-form-card">
          <h2 className="section-title">團隊名稱</h2>
          <p className="section-desc">給你的團隊取一個好記的名字</p>

          <form onSubmit={handleSubmit}>
            <input
              type="text"
              className="group-input"
              placeholder="例如：今天中午吃什麼"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
            />
            <button
              className="primary-btn create-btn"
              type="submit"
              disabled={loading}
            >
              {loading ? "建立中…" : "建立團隊"}
            </button>
          </form>
        </div>

        <div className="group-card leader-permission-card">
          <h3 className="section-title">團長權限</h3>
          <ul className="bullet-list">
            <li>管理隊員（移除成員）</li>
            <li>關閉團隊</li>
            <li>發布公告</li>
            <li>決定最終餐廳</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
