// src/api/groupApi.js
const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:5000";

function getToken() {
  return localStorage.getItem("lp_token"); // 依照你的 Auth 寫法
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

// ========== 既有 API ==========

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

export async function updateParticipation(groupId, status) {
  const data = await request(`/api/groups/${groupId}/participation`, {
    method: "POST",
    body: JSON.stringify({ status }),
  });
  return data.group;
}

export async function addAnnouncement(groupId, content) {
  const data = await request(`/api/groups/${groupId}/announcements`, {
    method: "POST",
    body: JSON.stringify({ content }),
  });
  return data.group;
}

// ==========  新增：候選餐廳 ==========
// name 必填，address 先是選填（目前前端沒用到）
export async function addCandidate(groupId, name, address = "") {
  const data = await request(`/api/groups/${groupId}/candidates`, {
    method: "POST",
    body: JSON.stringify({ name, address }),
  });
  return data.group;
}


// ==========  新增：投票 / 取消投票 ==========
export async function updateVote(groupId, candidateId) {
  const data = await request(`/api/groups/${groupId}/vote`, {
    method: "POST",
    body: JSON.stringify({ candidateId }), // candidateId 可為 null
  });
  return data.group;
}

// ==========  新增：團長關閉投票 ==========
export async function closeVote(groupId) {
  const data = await request(`/api/groups/${groupId}/vote_close`, {
    method: "POST",
  });
  return data.group;
}

// ========== 既有 API ==========

export async function closeGroup(groupId) {
  const data = await request(`/api/groups/${groupId}/close`, {
    method: "POST",
  });
  return data.group;
}

export async function deleteGroupApi(groupId) {
  await request(`/api/groups/${groupId}`, {
    method: "DELETE",
  });
}

export async function updateMemberStatus(groupId, memberId, status) {
  const data = await request(`/api/groups/${groupId}/member_status`, {
    method: "POST",
    body: JSON.stringify({ memberId, status }),
  });
  return data.group;
}

