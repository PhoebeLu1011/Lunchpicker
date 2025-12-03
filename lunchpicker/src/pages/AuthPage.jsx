// src/pages/AuthPage.jsx
import { useState } from "react";
import { login, register } from "../authClient";
import LunchRunner from "../components/LunchRunner";
import "./AuthPage.css"; // 等一下加一些小樣式

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
    <div className="auth-page bg-light min-vh-100 d-flex justify-content-center align-items-center">
      <div className="auth-card-wrapper col-11 col-sm-8 col-md-5 col-lg-4">
        {/*  <LunchRunner />*/}
        

        <div className="card auth-card p-4 shadow-sm">
          <h1 className="h4 text-center mb-3 fw-bold text-primary">
            LunchPicker
          </h1>

          <div className="btn-group w-100 mb-3">
            <button
              type="button"
              className={
                "btn w-50 auth-toggle-btn " +
                (mode === "login" ? "btn-primary" : "btn-outline-primary")
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
                "btn w-50 auth-toggle-btn " +
                (mode === "register" ? "btn-primary" : "btn-outline-primary")
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
              <label className="form-label w-100">
                Email
                <input
                  name="email"
                  type="email"
                  className="form-control mt-1"
                  required
                />
              </label>
              <label className="form-label w-100 mt-3">
                密碼
                <input
                  name="password"
                  type="password"
                  className="form-control mt-1"
                  required
                />
              </label>
              <button className="btn btn-primary w-100 mt-3">登入</button>
            </form>
          ) : (
            <form onSubmit={handleRegister}>
              <label className="form-label w-100">
                Email
                <input
                  name="email"
                  type="email"
                  className="form-control mt-1"
                  required
                />
              </label>
              <label className="form-label w-100 mt-3">
                密碼
                <input
                  name="password"
                  type="password"
                  className="form-control mt-1"
                  required
                />
              </label>
              <button className="btn btn-primary w-100 mt-3">註冊</button>
            </form>
          )}

          {msg && <p className="small mt-3 mb-0 text-danger">{msg}</p>}
        </div>
      </div>
    </div>
  );
}
