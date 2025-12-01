// src/modules/ModuleProfile.jsx
import { useState, useEffect } from "react";

export default function ModuleProfile({ user }) {
  if (!user) return <div>載入中...</div>;

  const STORAGE_KEY = `userProfile_${user.id}`;

  // 從 DB 來的原始資料
  const dbNickname = user.name || "";
  const dbEmail = user.email || "";

  // ===== 狀態 =====
  const [isEditing, setIsEditing] = useState(false);

  // 「基準值」= 當前這個使用者最後一次儲存後的暱稱 / email
  const [baseNickname, setBaseNickname] = useState(dbNickname);
  const [baseEmail, setBaseEmail] = useState(dbEmail);

  // 表單目前的值
  const [nickname, setNickname] = useState(dbNickname);
  const [email, setEmail] = useState(dbEmail);
  const [isModified, setIsModified] = useState(false);

  // 帳號資訊
  const userId = user.id || "";

  // createdAt 從後端來，如果是 ISO string 就轉成人看得懂的日期
  const createdAt = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString("zh-TW")
    : "尚未提供";

  // ===== 首次載入 / 換使用者時：從 localStorage 覆蓋表單 + 基準值 =====
  useEffect(() => {
    let nick = dbNickname;
    let mail = dbEmail;

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        nick = saved.nickname || nick;
        mail = saved.email || mail;
      }
    } catch (e) {
      console.error("載入 localStorage 失敗", e);
    }

    setNickname(nick);
    setEmail(mail);
    setBaseNickname(nick);
    setBaseEmail(mail);
    setIsModified(false);
    setIsEditing(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id]);

  // 檢查目前值和「基準值」是否不同
  const checkModified = (nick = nickname, mail = email) => {
    setIsModified(nick !== baseNickname || mail !== baseEmail);
  };

  const handleSave = () => {
    const toSave = { nickname, email };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    } catch (e) {
      console.error("儲存失敗", e);
      alert("儲存失敗（localStorage 錯誤）");
      return;
    }

    // 更新基準值
    setBaseNickname(nickname);
    setBaseEmail(email);
    setIsModified(false);
    setIsEditing(false);
    alert("儲存成功！（目前只存到本機）");
  };

  const handleCancel = () => {
    // 回到基準值
    setNickname(baseNickname);
    setEmail(baseEmail);
    setIsModified(false);
    setIsEditing(false);
  };

  // ====== UI ======
  return (
    <form
      className="profile-container"
      onSubmit={(e) => e.preventDefault()}
    >
      {/* 右上角 編輯按鈕 */}
      <div className="d-flex justify-content-end mb-3">
        {!isEditing && (
          <button
            type="button"
            className="profile-btn-edit"
            onClick={() => setIsEditing(true)}
          >
            編輯
          </button>
        )}
      </div>

      {/* 頭像 */}
      <div className="profile-avatar-wrapper">
        <div className="profile-avatar">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="46"
            height="46"
            fill="#e28763"
            viewBox="0 0 16 16"
          >
            <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6m2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0m4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4m-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.284 10 8 10s-3.516.68-4.168 1.332c-.678.678-.83 1.418-.832 1.664z" />
          </svg>
        </div>
      </div>
      {/* 使用者名稱（鎖死不讓改） */}
      <div className="profile-field">
        <label className="profile-label">
          <svg width="14" height="14" fill="#777" viewBox="0 0 16 16">
            <path d="M3 14s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1H3zm5-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
          </svg>
          &nbsp; 使用者名稱
        </label>
        <input
          className="profile-input"
          type="text"
          value={user.name || dbNickname || user.email?.split("@")[0] || ""}
          readOnly
        />
        <small className="text-muted" style={{ fontSize: "0.8rem" }}>
          不可修改
        </small>
      </div>

      {/* Email（可編輯） */}
      <div className="profile-field">
        <label className="profile-label">
          <svg width="14" height="14" fill="#777" viewBox="0 0 16 16">
            <path d="M.05 3.555A2 2 0 0 1 2 2h12a2 2 0 0 1 1.95 1.555L8 8.414.05 3.555ZM0 4.697v7.104l5.803-3.558L0 4.697Z" />
          </svg>
          &nbsp; Email
        </label>
        <input
          className="profile-input"
          type="email"
          value={email}
          onChange={(e) => {
            const v = e.target.value;
            setEmail(v);
            checkModified(nickname, v);
          }}
          readOnly={!isEditing}
        />
      </div>



      {/* 底部按鈕：只有在編輯模式才顯示 */}
      {isEditing && (
        <div className="profile-buttons">
          <button
            type="button"
            className="profile-btn-cancel"
            onClick={handleCancel}
          >
            取消
          </button>
          <button
            type="button"
            className="profile-btn-save"
            onClick={handleSave}
            disabled={!isModified}
          >
            儲存變更
          </button>
        </div>
      )}


      {/* 帳號資訊 */}
      <div className="profile-section-title">帳號資訊</div>

      <div className="profile-info-row">
        <span>帳號 ID</span>
        <span className="profile-info-value">{userId}</span>
      </div>

      <div className="profile-info-row">
        <span>建立時間</span>
        <span className="profile-info-value">{createdAt}</span>
      </div>

    </form>
  );
}
