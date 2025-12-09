// src/pages/Landing.jsx
import "../styles/Landing.css";

export default function Landing({ onStart }) {
  return (
    <div className="landing-shell">
      <div className="landing-bg moving-blobs" aria-hidden="true" />
      <div className="landing-hero-wave" aria-hidden="true" />
      <div className="landing-ridges" aria-hidden="true" />

      <header className="landing-top">
        <div className="landing-logo">
          <span className="logo-mark" />
          <span className="logo-text">Lunchpicker</span>
        </div>
        <button className="landing-ghost" onClick={onStart} type="button">
          登入 / 註冊
        </button>
      </header>

      <main className="landing-main">
        <section className="landing-hero">
          <div className="hero-overlay">
            <p className="landing-kicker">今天吃什麼？交給我們抽</p>
            <h1 className="landing-title">
              <span className="title-glow">Lunchpicker</span> 美食即刻開跑
            </h1>
            <p className="landing-desc">
              探索附近餐廳、設定抽籤條件，再也不用為午餐煩惱。
            </p>
            <p className="landing-date">每日更新 · 一鍵抽籤決定</p>
          </div>
        </section>

        <div className="landing-actions">
          <button className="landing-primary" onClick={onStart} type="button">
            開始使用
          </button>
          <button className="landing-secondary" onClick={onStart} type="button">
            先登入看看
          </button>
        </div>

        <div className="landing-cards">
          <div className="landing-card">
            <div className="lc-icon">🎯</div>
            <div>
              <h3>聰明抽籤</h3>
              <p>輸入地址、設定半徑，幫你隨機抽出一家。</p>
            </div>
          </div>
          <div className="landing-card">
            <div className="lc-icon">📍</div>
            <div>
              <h3>搜尋附近</h3>
              <p>自動抓定位或輸入地點，立刻列出附近餐廳。</p>
            </div>
          </div>
          <div className="landing-card">
            <div className="lc-icon">🚫</div>
            <div>
              <h3>黑名單過濾</h3>
              <p>把不想抽到的店先排除，抽籤更合口味。</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
