// src/pages/HomePage.jsx
import { useState } from "react";

import ModuleLunchMain from "../modules/ModuleLunchMain";
import ModuleGroup from "../modules/ModuleGroup";
import ModuleBlacklist from "../modules/ModuleBlacklist";
import ModuleSimple from "../modules/ModuleSimple";

export default function HomePage({ user, onLogout }) {
  const [active, setActive] = useState("home");

  const ModuleWrapper = ({ title, children }) => (
    <div className="container py-4">
      <button
        className="btn btn-outline-secondary btn-sm mb-3"
        onClick={() => setActive("home")}
      >
        ← 回首頁
      </button>
      <div className="card p-4 shadow-sm">
        <h5 className="mb-3">{title}</h5>
        {children}
      </div>
    </div>
  );

  // ===== 模組切換 =====
    if (active === "lunch") {
    return (
        <div className="app-shell">
        {/* 上方白色 bar */}
        <header className="app-topbar">
            <button
            className="btn btn-link p-0 me-3"
            onClick={() => setActive("home")}
            >
            ← 回首頁
            </button>
            <div className="flex-grow-1 fw-semibold">
            Lunchpiker 抽籤器
            </div>
            <button
            className="btn btn-link p-0 text-danger"
            onClick={onLogout}
            >
            登出
            </button>
        </header>

        {/* 下面整塊桃色背景 */}
        <main className="home-hero">
            <div className="container py-4">
            <ModuleLunchMain />
            </div>
        </main>
        </div>
    );
    }


  if (active === "group")
    return (
      <ModuleWrapper title="第二模組：E 人揪團">
        <ModuleGroup />
      </ModuleWrapper>
    );

  if (active === "blacklist")
    return (
      <ModuleWrapper title="第三模組：黑名單">
        <ModuleBlacklist />
      </ModuleWrapper>
    );

  if (active === "simple")
    return (
      <ModuleWrapper title="第四模組：自訂餐廳抽籤">
        <ModuleSimple />
      </ModuleWrapper>
    );

  // ===== 主選單頁（首頁） =====
  return (
    <div className="app-shell">
      <header className="app-topbar">
        <div className="d-flex align-items-center gap-2">
          <div className="app-avatar-circle"></div>
          <div>
            <div className="fw-semibold">{user.username}</div>
            <div className="small text-muted">@{user.username}</div>
          </div>
        </div>

        <button className="btn btn-link p-0 text-danger" onClick={onLogout}>
          登出
        </button>
      </header>

      <main className="home-hero">
        <div className="container py-4">

          <h3 className="mb-1">哈囉，{user.username} 👋</h3>
          <p className="text-muted small">今天想吃什麼呢？</p>

          <div className="row g-3 mt-3">
            <div className="col-12 col-md-6">
              <button className="module-card w-100 text-start" onClick={() => setActive("lunch")}>
                <h6>Lunchpiker 抽籤器</h6>
                <p className="module-subtitle">輸入地點、智慧篩選餐廳</p>
              </button>
            </div>

            <div className="col-12 col-md-6">
              <button className="module-card w-100 text-start" onClick={() => setActive("group")}>
                <h6>E 人揪團</h6>
                <p className="module-subtitle">建立或加入團隊</p>
              </button>
            </div>

            <div className="col-12 col-md-6">
              <button className="module-card w-100 text-start" onClick={() => setActive("blacklist")}>
                <h6>黑名單管理</h6>
                <p className="module-subtitle">排除不想顯示的餐廳</p>
              </button>
            </div>

            <div className="col-12 col-md-6">
              <button className="module-card w-100 text-start" onClick={() => setActive("simple")}>
                <h6>自訂餐廳抽籤</h6>
                <p className="module-subtitle">自訂清單抽籤</p>
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
