// src/pages/AuthPage.jsx
import { useState } from "react";
import { login, register } from "../authClient";
import LunchRunner from "../components/LunchRunner";
import "./AuthPage.css";

export default function AuthPage({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [msg, setMsg] = useState("");

  async function handleLogin(e) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const email = form.get("email");
    const password = form.get("password");

    const res = await login({ email, password });
    if (res.ok) {
      setMsg("");
      onLogin(res.user);
    } else {
      setMsg(res.error || "登入失敗");
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const email = form.get("email");
    const password = form.get("password");

    const res = await register({ email, password });
    if (res.ok) {
      setMsg("註冊成功，請登入");
      setMode("login");
    } else {
      setMsg(res.error || "註冊失敗");
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card-wrapper">
        {/* 如果之後想放小動畫可以把這行打開 */}
        {/* <LunchRunner /> */}

        <div className="auth-card">
          {/* Logo + 副標題 */}
          <div className="auth-header">
            <div className="auth-logo-circle">🍱</div>
            <div>
              <h1 className="auth-title">LunchPicker</h1>
              <p className="auth-subtitle">欸!所以今天午餐要吃什麼?</p>
            </div>
          </div>

          {/* Login / Register 切換膠囊 */}
          <div className="auth-toggle-group">
            <button
              type="button"
              className={
                "auth-toggle-btn " +
                (mode === "login"
                  ? "auth-toggle-active"
                  : "auth-toggle-inactive")
              }
              onClick={() => {
                setMode("login");
                setMsg("");
              }}
            >
              登入
            </button>
            <button
              type="button"
              className={
                "auth-toggle-btn " +
                (mode === "register"
                  ? "auth-toggle-active"
                  : "auth-toggle-inactive")
              }
              onClick={() => {
                setMode("register");
                setMsg("");
              }}
            >
              註冊
            </button>
          </div>

          {/* 表單區 */}
          {mode === "login" ? (
            <form onSubmit={handleLogin}>
              <div className="auth-field">
                <label className="auth-label" htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  className="auth-input"
                  required
                />
              </div>

              <div className="auth-field">
                <label className="auth-label" htmlFor="password">
                  密碼
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  className="auth-input"
                  required
                />
              </div>

              <button className="auth-primary-btn" type="submit">
                登入
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister}>
              <div className="auth-field">
                <label className="auth-label" htmlFor="reg-email">
                  Email
                </label>
                <input
                  id="reg-email"
                  name="email"
                  type="email"
                  className="auth-input"
                  required
                />
              </div>

              <div className="auth-field">
                <label className="auth-label" htmlFor="reg-password">
                  密碼
                </label>
                <input
                  id="reg-password"
                  name="password"
                  type="password"
                  className="auth-input"
                  required
                />
              </div>

              <button className="auth-primary-btn" type="submit">
                註冊
              </button>
            </form>
          )}

          {msg && <p className="auth-message">{msg}</p>}

          <p className="auth-footer-hint">
            登入後你就知道午餐要吃什麼了...
          </p>
        </div>
      </div>
    </div>
  );
}
