import { useState } from "react";

export default function TopBar({ active, onChangeActive, user, onLogout }) {
  const [open, setOpen] = useState(false);

  const handleSelect = (key) => {
    onChangeActive(key);
    setOpen(false); // 關閉菜單
  };

  return (
    <>
      {/* ======= Top Bar ======= */}
      <header className="app-topbar d-flex align-items-center justify-content-between">
        {/* 左上角 Logo → 回首頁 */}
        <div
          style={{
            fontWeight: 700,
            fontSize: "1.2rem",
            cursor: "pointer",
          }}
          onClick={() => handleSelect("home")}
        >
          LunchPicker
        </div>

        {/* 右上角: email + 漢堡選單 */}
        <div className="d-flex align-items-center gap-3">
          <span
            className="small text-muted"
            style={{ cursor: "pointer" }}
            onClick={() => onChangeActive("profile")}
            >
            {user?.email}
          </span>

          {/* 漢堡按鈕 */}
          <button
            className="hamburger-btn"
            onClick={() => setOpen((prev) => !prev)}
          >
            ☰
          </button>
        </div>
      </header>

      {/* ======= 側邊目錄 ======= */}
      {open && (
        <div className="side-menu">
          <button
            className={`side-item ${active === "home" ? "active" : ""}`}
            onClick={() => handleSelect("home")}
          >
            首頁
          </button>

          <button
            className={`side-item ${active === "lunch" ? "active" : ""}`}
            onClick={() => handleSelect("lunch")}
          >
            抽籤器
          </button>

          <button
            className={`side-item ${active === "group" ? "active" : ""}`}
            onClick={() => handleSelect("group")}
          >
            E 人揪團
          </button>

          <button
            className={`side-item ${active === "blacklist" ? "active" : ""}`}
            onClick={() => handleSelect("blacklist")}
          >
            黑名單
          </button>

          <button
            className={`side-item ${active === "simple" ? "active" : ""}`}
            onClick={() => handleSelect("simple")}
          >
            自訂抽籤
          </button>

          <button
            className={`side-item ${active === "profile" ? "active" : ""}`}
            onClick={() => handleSelect("profile")}
            >
            個人資料
          </button>


          <hr />

          <button className="side-item logout" onClick={onLogout}>
            登出
          </button>
        </div>
      )}
    </>
  );
}
