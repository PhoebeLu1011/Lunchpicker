// src/modules/group/GroupDetail.jsx
import React from "react";
import GroupCandidates from "./GroupCandidates";

export default function GroupDetail({
  group,
  onBack,
  onCopyCode,
  onSetParticipation,   // 給「自己」改狀態用
  onAddAnnouncement,
  onCloseGroup,
  onDeleteGroup,
  onGroupUpdated,       // 子元件更新 group 用
  isLeader,             // 是否為團長
  currentUserId,        // 目前登入使用者 id
  onSetMemberStatus,    // 團長修改成員狀態用 (memberId, status)
}) {
  const memberCount = group.members
    ? group.members.length
    : group.memberCount || 0;

  function handleAddAnnouncementClick() {
    const content = window.prompt("請輸入公告內容");
    if (!content) return;
    onAddAnnouncement(content);
  }

  function handleGroupUpdatedSafe(updatedGroup) {
    if (onGroupUpdated) {
      onGroupUpdated(updatedGroup);
    }
  }

  // 把後端 status 轉成中文文字
  function statusLabel(status) {
    if (status === "join") return "參加";
    if (status === "not_join") return "不參加";
    // 其他狀態（undefined / unknown）不顯示
    return "";
  }

  // 一般隊員：切換「自己的」狀態
  function handleToggleMyStatus(currentStatus) {
    const nextStatus = currentStatus === "join" ? "not_join" : "join";
    onSetParticipation(nextStatus);
  }

  return (
    <div className="group-page">
      <button className="back-btn" onClick={onBack}>
        ←返回
      </button>

      {/* 加入代碼 */}
      <div className="card-section">
        <div className="card-header">
          <div className="card-title">加入代碼</div>
          <button className="copy-btn" onClick={onCopyCode}>
            複製
          </button>
        </div>
        <div className="code-display">{group.code}</div>
      </div>

      {/* 公告 */}
      <div className="card-section">
        <div className="card-header">
          <div className="card-title">公告</div>
          {isLeader && (
            <button className="add-btn" onClick={handleAddAnnouncementClick}>
              ＋新增公告
            </button>
          )}
        </div>

        {group.announcements && group.announcements.length > 0 ? (
          <ul className="announce-list">
            {group.announcements.map((a) => (
              <li key={a.id} className="announce-item">
                {a.content}
              </li>
            ))}
          </ul>
        ) : (
          <p className="empty-text">尚無公告</p>
        )}
      </div>

      {/* 成員 */}
      <div className="card-section">
        <div className="card-header">
          <div className="card-title">成員（{memberCount}）</div>
        </div>

        <div className="member-list">
          {group.members &&
            group.members.map((m) => {
              const memberId = m.userId || m.id;
              const isMe = currentUserId && memberId === currentUserId;

              return (
                <div key={memberId} className="member-row">
                  <div className="member-left">
                    {m.role === "leader" && (
                      <span className="leader-crown">👑</span>
                    )}
                    <span className="member-name">
                      {m.displayName || m.name || m.email || "未命名成員"}
                    </span>
                  </div>

                  <div className="member-right">
                    {/* 團長端：可以改所有人的狀態，用 select */}
                    {isLeader ? (
                      <select
                        className="member-status-select"
                        // 沒有狀態 / unknown 都預設成 join
                        value={m.status === "not_join" ? "not_join" : "join"}
                        onChange={(e) =>
                          onSetMemberStatus &&
                          onSetMemberStatus(memberId, e.target.value)
                        }
                      >
                        <option value="join">參加</option>
                        <option value="not_join">不參加</option>
                      </select>
                    ) : (
                      <>
                        {/* 隊員端：只能改自己 */}
                        {isMe ? (
                          <button
                            className="chip-btn"
                            onClick={() => handleToggleMyStatus(m.status)}
                          >
                            {m.status === "join" ? "參加" : "不參加"}
                          </button>
                        ) : (
                          (() => {
                            const label = statusLabel(m.status);
                            return label ? (
                              <span className="member-status-tag">
                                {label}
                              </span>
                            ) : null;
                          })()
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* 候選餐廳 */}
      <GroupCandidates
        groupId={group.id}
        candidates={group.candidates || []}
        votingClosed={group.votingClosed}
        isLeader={isLeader}
        onGroupUpdated={handleGroupUpdatedSafe}
      />

      {/* 團長管理 */}
      {isLeader && (
        <div className="card-section">
          <h3 className="section-title">團長管理</h3>
          <button
            className="outline-btn full-width-btn"
            onClick={onCloseGroup}
          >
            關閉團隊
          </button>
          <button
            className="danger-link-btn full-width-btn"
            onClick={onDeleteGroup}
          >
            刪除團隊
          </button>
        </div>
      )}
    </div>
  );
}
