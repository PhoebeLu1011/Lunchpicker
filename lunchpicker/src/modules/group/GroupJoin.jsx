// src/modules/group/GroupJoin.jsx
import React, { useState } from "react";

export default function GroupJoin({ loading, onBack, onSubmit }) {
  const [code, setCode] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    if (loading) return;
    onSubmit(code);
  }

  return (
    <div className="group-page join-page">
      {/* 最上方返回列 */}
      <button className="back-btn" onClick={onBack}>
        ← 加入團隊
      </button>

      <div className="join-layout">
        {/* 左邊：輸入代碼卡片 */}
        <div className="group-card join-form-card">
          <h2 className="section-title">加入代碼</h2>
          <p className="section-desc">輸入團長提供的 6 位代碼</p>

          <form onSubmit={handleSubmit}>
            <input
              type="text"
              className="group-input"
              placeholder="例如：ABC123"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              disabled={loading}
            />

            <button
              type="submit"
              className="primary-btn create-btn"
              disabled={loading}
            >
              {loading ? "加入中…" : "加入團隊"}
            </button>
          </form>
        </div>

        {/* 右邊：說明卡片 */}
        <div className="group-card join-info-card">
          <h3 className="section-title">成員可以</h3>
          <ul className="bullet-list">
            <li>表達參加或不參加</li>
            <li>新增候選餐廳</li>
            <li>對候選餐廳投票</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
