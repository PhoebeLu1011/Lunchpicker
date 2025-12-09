// src/api/groupApi.js

// src/api/groupApi.js
const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";


/**
 * 共用 request：全部改用「Cookie 驗證」，不再用 Authorization header
 */
async function request(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    credentials: "include", // ⭐ 一定要加，access_token cookie 才會跟著送
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok || data.ok === false) {
    const msg = data.error || data.message || `HTTP ${res.status}`;
    throw new Error(msg);
  }

  return data;
}

// ========== 團隊 API ==========

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

// 我自己的參加 / 不參加
export async function updateParticipation(groupId, status) {
  const data = await request(`/api/groups/${groupId}/participation`, {
    method: "POST",
    body: JSON.stringify({ status }),
  });
  return data.group;
}

// 公告
export async function addAnnouncement(groupId, content) {
  const data = await request(`/api/groups/${groupId}/announcements`, {
    method: "POST",
    body: JSON.stringify({ content }),
  });
  return data.group;
}

// 候選餐廳
export async function addCandidate(groupId, name, address = "") {
  const data = await request(`/api/groups/${groupId}/candidates`, {
    method: "POST",
    body: JSON.stringify({ name, address }),
  });
  return data.group;
}

// 投票 / 取消投票（candidateId 可以是 null）
export async function updateVote(groupId, candidateId) {
  const data = await request(`/api/groups/${groupId}/vote`, {
    method: "POST",
    body: JSON.stringify({ candidateId }),
  });
  return data.group;
}

// 團長關閉投票
export async function closeVote(groupId) {
  const data = await request(`/api/groups/${groupId}/vote_close`, {
    method: "POST",
  });
  return data.group;
}

// 團隊關閉
export async function closeGroup(groupId) {
  const data = await request(`/api/groups/${groupId}/close`, {
    method: "POST",
  });
  return data.group;
}

// 團隊刪除
export async function deleteGroupApi(groupId) {
  await request(`/api/groups/${groupId}`, {
    method: "DELETE",
  });
}

// 團長改成員狀態 (join / not_join)
export async function updateMemberStatus(groupId, memberId, status) {
  const data = await request(`/api/groups/${groupId}/member_status`, {
    method: "POST",
    body: JSON.stringify({ memberId, status }),
  });
  return data.group;
}
