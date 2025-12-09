// src/components/TopBar.jsx
import { useState } from "react";
import "../styles/TopBar.css";  

export default function TopBar({ active, onChangeActive, user, onLogout }) {
  const [open, setOpen] = useState(false);

  const handleSelect = (key) => {
    onChangeActive(key);
    setOpen(false); 
  };

  return (
    <>
      {/* ======= Top Bar ======= */}
      <header className="app-topbar d-flex align-items-center justify-content-between">
        <div
          className="app-topbar-logo"
          onClick={() => handleSelect("home")}
        >
          LunchPicker
        </div>

        <div className="d-flex align-items-center gap-3">
          <span
            className="app-topbar-email"
            onClick={() => onChangeActive("profile")}
          >
            {user?.email}
          </span>

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
