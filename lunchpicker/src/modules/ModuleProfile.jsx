// src/modules/ModuleProfile.jsx
import { useState, useEffect } from "react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export default function ModuleProfile({ user, onUserUpdate }) {
  if (!user) return <div>載入中...</div>;

  const dbNickname = user.name || "";
  const dbEmail = user.email || "";

  // ===== 狀態 =====
  const [isEditing, setIsEditing] = useState(false);
  const [nickname, setNickname] = useState(dbNickname);
  const [baseNickname, setBaseNickname] = useState(dbNickname);
  const [isModified, setIsModified] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const userId = user.id || "";
  const createdAt = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString("zh-TW")
    : "尚未提供";

  useEffect(() => {
    const n = user.name || "";
    setNickname(n);
    setBaseNickname(n);
    setIsModified(false);
    setIsEditing(false);
    setError("");
  }, [user.id, user.name]);

  const handleSave = async () => {
    setSaving(true);
    setError("");

    try {
      const resp = await fetch(`${API_BASE}/api/user/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include", 
        body: JSON.stringify({ nickname }),
      });

      const data = await resp.json();

      if (!resp.ok || !data.ok) {
        throw new Error(data.error || "儲存失敗");
      }

      const newUser = data.user;

      setBaseNickname(newUser.name || "");
      setNickname(newUser.name || "");
      setIsModified(false);
      setIsEditing(false);

      if (onUserUpdate) {
        onUserUpdate(newUser);
      }

      alert("已儲存到伺服器！");
    } catch (e) {
      console.error(e);
      setError(e.message || "儲存失敗，請稍後再試");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setNickname(baseNickname);
    setIsModified(false);
    setIsEditing(false);
    setError("");
  };

  // ====== UI ======
  return (
    <form
      className="profile-container"
      onSubmit={(e) => e.preventDefault()}
    >
      {/* 編輯按鈕 */}
      <div className="profile-header-row">
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

      {/* 暱稱（可以改，對應 DB 的 name） */}
      <div className="profile-field">
        <label className="profile-label">暱稱</label>
        <input
          className="profile-input"
          type="text"
          value={nickname}
          onChange={(e) => {
            const v = e.target.value;
            setNickname(v);
            setIsModified(v !== baseNickname);
          }}
          readOnly={!isEditing}
          maxLength={30}
        />
        <small className="profile-note">
          這會顯示在團隊、黑名單等地方
        </small>
      </div>

      {/* Email（不開放修改） */}
      <div className="profile-field">
        <label className="profile-label">Email</label>
        <input
          className="profile-input"
          type="email"
          value={dbEmail}
          readOnly
        />
        <small className="profile-note">目前暫不支援線上修改 Email</small>
      </div>

      {/* 錯誤訊息 */}
      {error && <div className="profile-error">{error}</div>}

      {/*底部按鈕(編輯顯示only) */}
      {isEditing && (
        <div className="profile-buttons">
          <button
            type="button"
            className="profile-btn-cancel"
            onClick={handleCancel}
            disabled={saving}
          >
            取消
          </button>
          <button
            type="button"
            className="profile-btn-save"
            onClick={handleSave}
            disabled={!isModified || saving}
          >
            {saving ? "儲存中..." : "儲存變更"}
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
