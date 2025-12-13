// src/pages/HomePage.jsx
import { useState, useEffect } from "react";
import TopBar from "../components/TopBar";
import ModuleLunchMain from "../modules/ModuleLunchMain";
import ModuleGroup from "../modules/ModuleGroup";
import ModuleBlacklist from "../modules/ModuleBlacklist";
import ModuleSimple from "../modules/ModuleSimple";
import ModuleProfile from "../modules/ModuleProfile";
import "../styles/Homepage.css";

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
          <div className="home-shell">
            <section className="home-greeting">
              <h3 className="home-title">哈囉，{user.name || user.email}</h3>
              <p className="home-subtitle">今天想吃什麼呢？</p>
            </section>

            <section className="home-playlists">
              <header className="playlists-header">
                <span className="playlists-hint">點選一張卡片開始</span>
              </header>

              <div className="playlists-track">
                {/* 1. 智慧抽籤器 */}
                <button
                  type="button"
                  className="playlist-card pc1"
                  onClick={() => setActive("lunch")}
                >
                  <div className="playlist-top-row">
                    <span className="playlist-tag">推薦</span>
                    <span className="playlist-dot">•••</span>
                  </div>

                  <div className="playlist-main">
                 
                    <div
                      className="playlist-thumb thumb-icon icon-dice"
                      aria-hidden="true"
                    />
                    <div className="playlist-text">
                      <h4>Lunchpicker 抽籤器</h4>
                      <p>輸入地點，自動幫你選附近餐廳</p>
                    </div>
                  </div>

                  <div className="playlist-footer">
                    <span className="playlist-cta">開始抽籤</span>
                  </div>
                </button>

                {/* 2. E 人揪團 */}
                <button
                  type="button"
                  className="playlist-card pc2"
                  onClick={() => setActive("group")}
                >
                  <div className="playlist-top-row">
                    <span className="playlist-tag">一起吃飯</span>
                    <span className="playlist-dot">•••</span>
                  </div>

                  <div className="playlist-main">
                 
                    <div
                      className="playlist-thumb thumb-icon icon-list"
                      aria-hidden="true"
                    />
                    <div className="playlist-text">
                      <h4>E 人揪團</h4>
                      <p>建立或加入團隊，大家一起投票決定午餐</p>
                    </div>
                  </div>

                  <div className="playlist-footer">
                    <span className="playlist-cta">管理我的團</span>
                  </div>
                </button>

                {/* 3. 黑名單管理 */}
                <button
                  type="button"
                  className="playlist-card pc3"
                  onClick={() => setActive("blacklist")}
                >
                  <div className="playlist-top-row">
                    <span className="playlist-tag">不要再看到</span>
                    <span className="playlist-dot">•••</span>
                  </div>

                  <div className="playlist-main">
                  
                    <div
                      className="playlist-thumb thumb-icon icon-ban"
                      aria-hidden="true"
                    />
                    <div className="playlist-text">
                      <h4>黑名單管理</h4>
                      <p>排除踩雷或吃膩的餐廳，下次抽籤直接略過</p>
                    </div>
                  </div>

                  <div className="playlist-footer">
                    <span className="playlist-cta">編輯黑名單</span>
                  </div>
                </button>

                {/* 4. 自訂餐廳抽籤 */}
                <button
                  type="button"
                  className="playlist-card pc4"
                  onClick={() => setActive("simple")}
                >
                  <div className="playlist-top-row">
                    <span className="playlist-tag">客製清單</span>
                    <span className="playlist-dot">•••</span>
                  </div>

                  <div className="playlist-main">
                   
                    <div
                      className="playlist-thumb thumb-icon icon-group"
                      aria-hidden="true"
                    />

                    <div className="playlist-text">
                      <h4>自訂餐廳抽籤</h4>
                      <p>把愛店收進清單，隨機幫你選今天要吃哪一間</p>
                    </div>
                  </div>

                  <div className="playlist-footer">
                    <span className="playlist-cta">
                      管理清單 <span className="cta-arrow">→</span>
                    </span>
                  </div>
                </button>
              </div>
            </section>
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
          <ModuleWrapper title="E 人揪團">
            <ModuleGroup user={user} />
          </ModuleWrapper>
        )}

        {active === "blacklist" && (
          <ModuleWrapper title="黑名單管理">
            <ModuleBlacklist />
          </ModuleWrapper>
        )}

        {active === "simple" && (
          <ModuleWrapper title="自訂餐廳抽籤">
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
