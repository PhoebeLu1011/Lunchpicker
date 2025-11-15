// src/pages/AuthPage.jsx
import { useState } from "react";
import { login, register } from "../authClient";

export default function AuthPage({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [msg, setMsg] = useState("");

  async function handleLogin(e) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const username = form.get("username");
    const password = form.get("password");

    const res = await login({ username, password });
    if (res.ok) {
      onLogin(res.user);
    } else {
      setMsg(res.error || "登入失敗");
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const username = form.get("username");
    const password = form.get("password");

    const res = await register({ username, password });
    if (res.ok) {
      setMsg("註冊成功，請登入");
      setMode("login");
    } else {
      setMsg(res.error || "註冊失敗");
    }
  }

  return (
    <div className="container-fluid min-vh-100 d-flex justify-content-center align-items-center">
      <div className="col-10 col-sm-6 col-md-4">
        <div className="card p-4 shadow-sm">

          <div className="btn-group w-100 mb-3">
            <button
              className={"btn w-50 " + (mode === "login" ? "btn-primary" : "btn-outline-secondary")}
              onClick={() => setMode("login")}
            >
              登入
            </button>
            <button
              className={"btn w-50 " + (mode === "register" ? "btn-primary" : "btn-outline-secondary")}
              onClick={() => setMode("register")}
            >
              註冊
            </button>
          </div>

          {mode === "login" ? (
            <form onSubmit={handleLogin}>
              <label className="form-label">
                帳號
                <input name="username" className="form-control mt-1" required />
              </label>
              <label className="form-label mt-3">
                密碼
                <input name="password" type="password" className="form-control mt-1" required />
              </label>
              <button className="btn btn-primary w-100 mt-3">登入</button>
            </form>
          ) : (
            <form onSubmit={handleRegister}>
              <label className="form-label">
                帳號
                <input name="username" className="form-control mt-1" required />
              </label>
              <label className="form-label mt-3">
                密碼
                <input name="password" type="password" className="form-control mt-1" required />
              </label>
              <button className="btn btn-primary w-100 mt-3">註冊</button>
            </form>
          )}

          {msg && <p className="small text-danger mt-3 mb-0">{msg}</p>}
        </div>
      </div>
    </div>
  );
}
