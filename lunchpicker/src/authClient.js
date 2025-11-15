// src/authClient.js

const STORAGE_KEY = "lunchpicker_user";

// 模擬 /api/me
export async function getMe() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// 模擬 /api/register
export async function register({ username, password }) {
  // 現在先假裝註冊一定成功
  // 之後要接 Mongo Atlas 就在這裡改掉
  if (!username || !password) {
    return { ok: false, error: "帳號與密碼不能是空的" };
  }
  return { ok: true };
}

// 模擬 /api/login
export async function login({ username, password }) {
  if (!username || !password) {
    return { ok: false, error: "請輸入帳號與密碼" };
  }

  // 假裝只要有輸入就成功
  const user = { username };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  return { ok: true, user };
}

// 模擬 /api/logout
export async function logout() {
  localStorage.removeItem(STORAGE_KEY);
  return { ok: true };
}
