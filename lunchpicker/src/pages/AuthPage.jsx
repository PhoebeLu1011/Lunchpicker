import { useState } from "react";
import { register as apiRegister } from "../authClient";
import { useAuth } from "../context/AuthContext";
import "../styles/AuthPage.css";

export default function AuthPage({ onLogin }) {
  const { login: ctxLogin } = useAuth();
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [msg, setMsg] = useState("");

  async function handleLogin(e) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const email = form.get("email");
    const password = form.get("password");

    try {
      const user = await ctxLogin(email, password);
      if (onLogin) onLogin(user);
      setMsg("");
    } catch (err) {
      console.error(err);
      setMsg(err.message || "登入失敗，請稍後再試");
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const email = form.get("email");
    const password = form.get("password");

    try {
      const res = await apiRegister({ email, password });
      if (!res.ok) {
        setMsg(res.error || "註冊失敗");
        return;
      }
      setMsg("註冊成功，請使用剛剛的帳號密碼登入");
      setMode("login");
    } catch (err) {
      console.error(err);
      setMsg(err.message || "註冊失敗，請稍後再試");
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-content">
        {/* Header */}
        <div className="auth-header">
          <span className="auth-logo-mark" aria-hidden="true" />
          <div>
            <h1 className="auth-title">LunchPicker</h1>
            <p className="auth-subtitle">欸，所以今天午餐要吃什麼？</p>
          </div>
        </div>

        {/* Login / Register Toggle */}
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

        {mode === "login" ? (
          <form onSubmit={handleLogin}>
            <div className="auth-field">
              <label className="auth-label">Email</label>
              <input
                name="email"
                type="email"
                className="auth-input"
                required
              />
            </div>

            <div className="auth-field">
              <label className="auth-label">密碼</label>
              <input
                name="password"
                type="password"
                className="auth-input"
                required
              />
            </div>

            <button type="submit" className="auth-primary-btn">
              登入
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister}>
            <div className="auth-field">
              <label className="auth-label">Email</label>
              <input
                name="email"
                type="email"
                className="auth-input"
                required
              />
            </div>

            <div className="auth-field">
              <label className="auth-label">密碼</label>
              <input
                name="password"
                type="password"
                className="auth-input"
                required
              />
            </div>

            <button type="submit" className="auth-primary-btn">
              註冊
            </button>
          </form>
        )}

        {msg && <p className="auth-message">{msg}</p>}

        <p className="auth-footer-hint">
          登入後你就知道午餐要吃什麼了。
        </p>
      </div>
    </div>
  );
}
