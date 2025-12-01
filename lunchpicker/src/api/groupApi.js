// src/api/groupApi.js
const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:5000";

function getToken() {
  return localStorage.getItem("lp_token"); // 依照你 auth 儲存 token 的 key
}

async function request(path, options = {}) {
  const token = getToken();
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok || data.ok === false) {
    const msg = data.error || data.message || `HTTP ${res.status}`;
    throw new Error(msg);
  }

  return data;
}

export async function fetchMyGroups() {
  const data = await request("/api/groups/my");
  return data.groups || [];
}

export async function createGroup(name) {
  const data = await request("/api/groups", {
    method: "POST",
    body: JSON.stringify({ name }),
  });
  return data.group;
}

export async function fetchGroupDetail(id) {
  const data = await request(`/api/groups/${id}`);
  return data.group;
}

export async function joinGroupByCode(code) {
  const data = await request("/api/groups/join", {
    method: "POST",
    body: JSON.stringify({ code }),
  });
  return data.group;
}
