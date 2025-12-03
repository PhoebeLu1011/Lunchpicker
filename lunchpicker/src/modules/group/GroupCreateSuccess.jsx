// src/modules/group/GroupCreateSuccess.jsx
import React from "react";

export default function GroupCreateSuccess({
  groupName,
  code,
  onCopyCode,
  onEnterGroup,
}) {
  return (
    <div className="group-page">
      <div className="group-card success-card">
        <div className="success-icon">✔</div>

        <h2 className="success-name">{groupName || "你的團隊"}</h2>
        <p className="success-desc">團隊已成功建立！</p>

        <p className="success-desc">分享此代碼給朋友加入</p>

        <div className="code-row">
          <div className="code-box">{code}</div>
          <button
            type="button"
            className="icon-btn"
            onClick={onCopyCode}
          >
            📋
          </button>
        </div>

        <button className="primary-btn enter-btn" onClick={onEnterGroup}>
          進入團隊
        </button>
      </div>

      <p className="success-footer">
        你是團長，可以管理成員和決定餐廳
      </p>
    </div>
  );
}
