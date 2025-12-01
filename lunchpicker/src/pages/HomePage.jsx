// src/pages/HomePage.jsx
import { useState, useEffect  } from "react";
import TopBar from "../components/TopBar";
import ModuleLunchMain from "../modules/ModuleLunchMain";
import ModuleGroup from "../modules/ModuleGroup";
import ModuleBlacklist from "../modules/ModuleBlacklist";
import ModuleSimple from "../modules/ModuleSimple";
import ModuleProfile from "../modules/ModuleProfile";

const STORAGE_KEY = "lunchpicker_active_tab";

export default function HomePage({ user, onLogout }) {
  const [active, setActive] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved || "home";
  });

  // 每次 active 改變就同步存進 localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, active);
  }, [active]);

  const ModuleWrapper = ({ title, children }) => (
    <div className="container py-4">
      <button
        className="btn btn-outline-secondary btn-sm mb-3"
        onClick={() => setActive("home")}
      >
        ← 回首頁
      </button>
      <div className="module-wrapper-card">
        <h5 className="mb-3">{title}</h5>
        {children}
      </div>
    </div>
  );

  return (
    <div className="app-shell">
      {/* 統一使用 TopBar */}
      <TopBar
        active={active}
        onChangeActive={setActive}
        user={user}
        onLogout={onLogout}
      />

      {/* 下面依照 active 顯示內容 */}
      <main className="home-hero">
        {/* 首頁：主選單 */}
        {active === "home" && (
          <div className="container py-4">
            <h3 className="mb-1">哈囉，{user.name || user.email} 👋</h3>
            <p className="text-muted small">今天想吃什麼呢？</p>
            <div className="row g-3 mt-3">
              <div className="col-12 col-md-6">
                <button
                  className="module-card w-100 text-start"
                  onClick={() => setActive("lunch")}
                >
                  <h6>Lunchpiker 抽籤器</h6>
                  <p className="module-subtitle">輸入地點、智慧篩選餐廳</p>
                </button>
              </div>

              <div className="col-12 col-md-6">
                <button
                  className="module-card w-100 text-start"
                  onClick={() => setActive("group")}
                >
                  <h6>E 人揪團</h6>
                  <p className="module-subtitle">建立或加入團隊</p>
                </button>
              </div>

              <div className="col-12 col-md-6">
                <button
                  className="module-card w-100 text-start"
                  onClick={() => setActive("blacklist")}
                >
                  <h6>黑名單管理</h6>
                  <p className="module-subtitle">排除不想顯示的餐廳</p>
                </button>
              </div>

              <div className="col-12 col-md-6">
                <button
                  className="module-card w-100 text-start"
                  onClick={() => setActive("simple")}
                >
                  <h6>自訂餐廳抽籤</h6>
                  <p className="module-subtitle">自訂清單抽籤</p>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 第一模組：主Lunch 抽籤器 */}
        {active === "lunch" && (
          <div className="container py-4">
            <ModuleLunchMain />
          </div>
        )}

        {/* 第二模組：E 人揪團 */}
        {active === "group" && (
          <ModuleWrapper title="第二模組：E 人揪團">
            <ModuleGroup />
          </ModuleWrapper>
        )}

        {/* 第三模組：黑名單 */}
        {active === "blacklist" && (
          <ModuleWrapper title="第三模組：黑名單">
            <ModuleBlacklist />
          </ModuleWrapper>
        )}

        {/* 第四模組：自訂餐廳抽籤 */}
        {active === "simple" && (
          <ModuleWrapper title="第四模組：自訂餐廳抽籤">
            <ModuleSimple />
          </ModuleWrapper>
        )}

        {/* 個人資料頁 Profile  */}
        {active === "profile" && (
          <div className="container py-4">
            <button
              className="btn btn-outline-secondary btn-sm mb-3"
              onClick={() => setActive("home")}
            >
              ← 回首頁
            </button>

            <h5 className="mb-3">個人資料</h5>

            <ModuleProfile user={user} />
          </div>
        )}

      </main>
    </div>
  );
}
