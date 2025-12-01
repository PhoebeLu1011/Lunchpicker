// src/modules/ModuleGroup.jsx
import React, { useEffect, useState } from "react";
import {
  fetchMyGroups,
  createGroup,
  fetchGroupDetail,
  joinGroupByCode,
} from "../api/groupApi";
import "../styles/Group.css";
// 可以用字串就好
const VIEW = {
  OVERVIEW: "overview",
  CREATE: "create",
  CREATED: "created",
  DETAIL: "detail",
};

function copyToClipboard(text) {
  if (!text) return;
  navigator.clipboard
    .writeText(text)
    .catch((err) => console.error("Copy failed", err));
}

export default function ModuleGroup({ user }) {
  const [view, setView] = useState(VIEW.OVERVIEW);

  // 我的團隊列表（從後端抓）
  const [myGroups, setMyGroups] = useState([]);

  // 目前正在看的團隊（detail / 建立成功頁用）
  const [activeGroup, setActiveGroup] = useState(null);

  // 剛建立成功的代碼（其實可以直接用 activeGroup.code，預留給之後用）
  const [createdCode, setCreatedCode] = useState(null);

  const [loading, setLoading] = useState(false);

  // 一進來抓「我的團隊」
  useEffect(() => {
    loadMyGroups();
  }, []);

  async function loadMyGroups() {
    try {
      setLoading(true);
      const groups = await fetchMyGroups();
      setMyGroups(groups || []);
    } catch (err) {
      console.error("取得我的團隊失敗", err);
      // 你也可以改成 toast
      // alert(err.message || "取得我的團隊失敗");
    } finally {
      setLoading(false);
    }
  }

  // 建立團隊 → 呼叫後端 createGroup
  async function handleCreateGroup(groupName) {
    const name = groupName.trim();
    if (!name) return;

    try {
      setLoading(true);
      const newGroup = await createGroup(name); // 後端會產生唯一 code

      // 更新列表：把新的 group 放到最前面
      setMyGroups((prev) => {
        const others = prev.filter((g) => g.id !== newGroup.id);
        return [newGroup, ...others];
      });

      setActiveGroup(newGroup);
      setCreatedCode(newGroup.code);
      setView(VIEW.CREATED);
    } catch (err) {
      console.error("建立團隊失敗", err);
      alert(err.message || "建立團隊失敗");
    } finally {
      setLoading(false);
    }
  }

  // 從列表點進團隊 → 拉 detail
  async function handleEnterGroup(groupSummary) {
    try {
      setLoading(true);
      const detail = await fetchGroupDetail(groupSummary.id);
      setActiveGroup(detail);
      setView(VIEW.DETAIL);
    } catch (err) {
      console.error("載入團隊失敗", err);
      alert(err.message || "載入團隊失敗");
    } finally {
      setLoading(false);
    }
  }

  // 加入團隊（點「加入團隊」卡片）
  async function handleJoinGroup() {
    const input = window.prompt("請輸入加入代碼");
    if (!input) return;

    const code = input.trim().toUpperCase();
    if (!code) return;

    try {
      setLoading(true);
      const group = await joinGroupByCode(code);

      // 更新列表（如果本來就有，就更新；沒有就加進去）
      setMyGroups((prev) => {
        const others = prev.filter((g) => g.id !== group.id);
        return [group, ...others];
      });

      setActiveGroup(group);
      setCreatedCode(null);
      setView(VIEW.DETAIL);
    } catch (err) {
      console.error("加入團隊失敗", err);
      alert(err.message || "加入團隊失敗");
    } finally {
      setLoading(false);
    }
  }

  // 關閉 / 返回列表：回 overview，順便刷新我的團隊列表
  async function backToOverview() {
    setView(VIEW.OVERVIEW);
    setActiveGroup(null);
    setCreatedCode(null);
    await loadMyGroups();
  }

  // --- 根據 view 切換畫面 ---

  if (view === VIEW.CREATE) {
    return (
      <GroupCreateForm
        onBack={backToOverview}
        onSubmit={handleCreateGroup}
        loading={loading}
      />
    );
  }

  if (view === VIEW.CREATED && activeGroup) {
    return (
      <GroupCreateSuccess
        groupName={activeGroup.name}
        code={createdCode || activeGroup.code}
        onEnterGroup={() => setView(VIEW.DETAIL)}
      />
    );
  }

  if (view === VIEW.DETAIL && activeGroup) {
    return (
      <GroupDetail
        group={activeGroup}
        onBack={backToOverview}
        onCopyCode={() => copyToClipboard(activeGroup.code)}
      />
    );
  }

  // default: OVERVIEW
  return (
    <GroupOverview
      myGroups={myGroups}
      loading={loading}
      onCreateClick={() => setView(VIEW.CREATE)}
      onEnterGroup={handleEnterGroup}
      onJoinClick={handleJoinGroup}
    />
  );
}

/* ===================== 子元件們 ===================== */

function GroupOverview({
  myGroups,
  loading,
  onCreateClick,
  onEnterGroup,
  onJoinClick,
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
          onClick={onJoinClick}
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

function GroupCreateForm({ onBack, onSubmit, loading }) {
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

function GroupCreateSuccess({ groupName, code, onEnterGroup }) {
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
            onClick={() => copyToClipboard(code)}
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

function GroupDetail({ group, onBack, onCopyCode }) {
  const memberCount = group.members
    ? group.members.length
    : group.memberCount || 0;

  return (
    <div className="group-page">
      <button className="back-btn" onClick={onBack}></button>

      {/* 加入代碼 */}
      <div className="group-card code-card">
        <div className="code-label">加入代碼</div>
        <div className="code-row">
          <div className="code-box">{group.code}</div>
          <button className="icon-btn" onClick={onCopyCode}>
            📋
          </button>
        </div>
      </div>

      {/* 公告 */}
      <div className="group-card">
        <div className="section-header">
          <div className="section-title-with-icon">
            <span className="emoji">🔔</span> 公告
          </div>
          <button className="link-btn">新增公告</button>
        </div>
        {group.announcements && group.announcements.length > 0 ? (
          <ul className="bullet-list">
            {group.announcements.map((a) => (
              <li key={a.id}>{a.content}</li>
            ))}
          </ul>
        ) : (
          <p className="section-empty">尚無公告</p>
        )}
      </div>

      {/* 成員 */}
      <div className="group-card">
        <div className="section-header">
          <div className="section-title-with-icon">
            <span className="emoji">👥</span> 成員（{memberCount}）
          </div>
        </div>

        <div className="member-list">
          {group.members &&
            group.members.map((m) => (
              <div key={m.userId || m.id} className="member-row">
                <div className="member-left">
                  {m.role === "leader" && (
                    <span className="leader-crown">👑</span>
                  )}
                  <span className="member-name">
                    {m.displayName || m.name || m.email || "未命名成員"}
                  </span>
                </div>
                <div className="member-right">
                  {/* 先簡單做個假按鈕 */}
                  <button className="chip-btn">
                    {m.status === "not_join" ? "不參加" : "參加"}
                  </button>
                </div>
              </div>
            ))}
        </div>

        <button className="outline-btn full-width-btn">標記為不參加</button>
      </div>

      {/* 候選餐廳 */}
      <div className="group-card">
        <div className="section-header">
          <div className="section-title-with-icon">候選餐廳</div>
          <button className="link-btn">＋ 新增</button>
        </div>

        {group.candidates && group.candidates.length > 0 ? (
          <ul className="bullet-list">
            {group.candidates.map((c) => (
              <li key={c.id}>{c.name}</li>
            ))}
          </ul>
        ) : (
          <p className="section-empty">還沒有候選餐廳</p>
        )}
      </div>

      {/* 團長管理 */}
      <div className="group-card">
        <h3 className="section-title">團長管理</h3>
        <button className="outline-btn full-width-btn">關閉團隊</button>
        <button className="danger-link-btn full-width-btn">刪除團隊</button>
      </div>
    </div>
  );
}
