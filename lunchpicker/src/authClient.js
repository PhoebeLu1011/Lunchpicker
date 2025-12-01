// src/authClient.js
const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

export async function login({ email, password }) {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok || !data.ok) {
    return { ok: false, error: data.error || "登入失敗" };
  }

  // 把 JWT token 存起來（之後呼叫其他 API 要帶 Authorization）
  if (data.token) {
    localStorage.setItem("lp_token", data.token);
  }

  return {
    ok: true,
    user: data.user,
    token: data.token,
  };
}

export async function register({ email, password }) {
  const res = await fetch(`${API_BASE}/api/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok || !data.ok) {
    return { ok: false, error: data.error || "註冊失敗" };
  }

  return { ok: true };
}

export function getToken() {
  return localStorage.getItem("lp_token") || "";
}

export function logout() {
  localStorage.removeItem("lp_token");
}

export async function getMe() {
  const token = getToken();
  if (!token) {
    return null;              // 沒 token 就當沒登入
  }

  const res = await fetch(`${API_BASE}/api/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok || !data.ok) {
    return null;              // token 壞掉/過期 → 當作沒登入
  }

  return data.user;           // 成功就直接回 user 物件
}
