// src/modules/group/GroupOverview.jsx
import React from "react";

export default function GroupOverview({
  myGroups,
  loading,
  onCreateClick,
  onEnterGroup,
  onGoJoinPage,
}) {
  const hasGroups = myGroups && myGroups.length > 0;

  return (
    <div className="group-page">
      {/* 上面兩個大卡片：建立 / 加入 */}
      <div className="group-top-actions">
        <button
          className="group-card action-card create-card"
          onClick={onCreateClick}
        >
          <div className="action-icon">＋</div>
          <div className="action-title">建立團隊</div>
          <div className="action-desc">成為團長，邀請朋友</div>
        </button>

        <button
          className="group-card action-card join-card"
          onClick={onGoJoinPage}
        >
          <div className="action-icon">👥</div>
          <div className="action-title">加入團隊</div>
          <div className="action-desc">輸入代碼加入</div>
        </button>
      </div>

      {/* 我的團隊區塊 */}
      <div className="group-my-groups">
        <h2 className="section-title">我的團隊</h2>

        {loading && (
          <p className="section-desc" style={{ marginTop: 8 }}>
            讀取中…
          </p>
        )}

        {!loading && !hasGroups && (
          <div className="group-card empty-card">
            <div className="empty-icon">👤</div>
            <div className="empty-title">還沒有加入任何團隊</div>
            <div className="empty-desc">建立或加入一個團隊開始揪團吧！</div>
          </div>
        )}

        {!loading && hasGroups && (
          <div className="my-groups-list">
            {myGroups.map((g) => (
              <button
                key={g.id}
                className="group-card my-group-item"
                onClick={() => onEnterGroup(g)}
              >
                <div className="my-group-header">
                  <span className="my-group-name">{g.name}</span>
                  {g.role === "leader" && (
                    <span className="my-group-badge">團長</span>
                  )}
                </div>
                <div className="my-group-meta">
                  成員 {g.memberCount ?? (g.members?.length || 0)} 人｜代碼{" "}
                  {g.code}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
