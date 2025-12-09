// src/authClient.js

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";


// ===== 登入 =====
export async function login({ email, password }) {
  const resp = await fetch(`${API_BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include", 
    body: JSON.stringify({ email, password }),
  });

  const data = await resp.json().catch(() => ({}));

  if (!resp.ok || data.ok === false) {
    return {
      ok: false,
      error: data.error || data.message || "登入失敗",
    };
  }

  const rawUser = data.user || {};

  return {
    ok: true,
    user: {
      id: rawUser.id || rawUser._id,
      email: rawUser.email,
      name: rawUser.name || null,
      createdAt: rawUser.createdAt || null,
    },
  };
}


export async function getMe() {
  const resp = await fetch(`${API_BASE}/api/auth/me`, {
    method: "GET",
    credentials: "include",
  });

  if (resp.status === 401) {
    // 沒登入 / cookie 無效
    return null;
  }

  const data = await resp.json().catch(() => ({}));
  if (!resp.ok || data.ok === false) {
    return null;
  }

  const rawUser = data.user || {};
  return {
    id: rawUser.id || rawUser._id,
    email: rawUser.email,
    name: rawUser.name || null,
    createdAt: rawUser.createdAt || null,
  };
}

// ===== 登出=====
export async function logout() {
  const resp = await fetch(`${API_BASE}/api/auth/logout`, {
    method: "POST",
    credentials: "include",
  });

  const data = await resp.json().catch(() => ({}));
  if (!resp.ok || data.ok === false) {
    throw new Error(data.error || data.message || "登出失敗");
  }
  return true;
}

// ===== 註冊 =====
export async function register({ email, password, name }) {
  const payload = { email, password };
  if (name) payload.name = name;

  const resp = await fetch(`${API_BASE}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include", 
    body: JSON.stringify(payload),
  });

  const data = await resp.json().catch(() => ({}));
  if (!resp.ok || data.ok === false) {
    return {
      ok: false,
      error: data.error || data.message || "註冊失敗",
    };
  }

  return {
    ok: true,
    user: data.user || null,
  };
}
