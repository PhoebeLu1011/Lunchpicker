// src/modules/ModuleGroup.jsx
import React, { useEffect, useState } from "react";
import {
  fetchMyGroups,
  createGroup,
  fetchGroupDetail,
  joinGroupByCode,
  updateParticipation,
  addAnnouncement,
  addCandidate,
  closeGroup,
  deleteGroupApi,
  // 🆕 團長改成員狀態
  updateMemberStatus,
} from "../api/groupApi";
import "../styles/Group.css";

import GroupOverview from "./group/GroupOverview";
import GroupCreateForm from "./group/GroupCreateForm";
import GroupCreateSuccess from "./group/GroupCreateSuccess";
import GroupDetail from "./group/GroupDetail";
import GroupJoin from "./group/GroupJoin";

const VIEW = {
  OVERVIEW: "overview",
  CREATE: "create",
  CREATED: "created",
  DETAIL: "detail",
  JOIN: "join",
};

function copyToClipboard(text) {
  if (!text) return;
  navigator.clipboard
    .writeText(text)
    .catch((err) => console.error("Copy failed", err));
}

export default function ModuleGroup({ user }) {
  console.log("ModuleGroup user =", user);
  const [view, setView] = useState(VIEW.OVERVIEW);
  const [myGroups, setMyGroups] = useState([]);
  const [activeGroup, setActiveGroup] = useState(null);
  const [createdCode, setCreatedCode] = useState(null);
  const [loading, setLoading] = useState(false);

  // 一進來抓我的團隊
  useEffect(() => {
    loadMyGroups();
  }, []);

  async function loadMyGroups() {
    try {
      setLoading(true);
      const groups = await fetchMyGroups();
      setMyGroups(groups || []);
    } catch (err) {
      console.error("取得我的團隊失敗", err);
    } finally {
      setLoading(false);
    }
  }

  async function refreshActiveGroup() {
    if (!activeGroup) return;
    try {
      const detail = await fetchGroupDetail(activeGroup.id);
      setActiveGroup(detail);
    } catch (err) {
      console.error("重新載入團隊失敗", err);
    }
  }

  // ====== 參加狀態 / 公告 / 候選餐廳 / 關閉 / 刪除 ======

  // 一般成員：更新「自己的」參加狀態
  async function handleSetParticipation(status) {
    if (!activeGroup) return;
    try {
      const updated = await updateParticipation(activeGroup.id, status);
      setActiveGroup(updated);
      await loadMyGroups();
    } catch (err) {
      alert(err.message || "更新參加狀態失敗");
    }
  }

  // 團長：更新「指定成員」的狀態
  async function handleSetMemberStatus(memberId, status) {
    if (!activeGroup) return;
    try {
      const updated = await updateMemberStatus(
        activeGroup.id,
        memberId,
        status
      );
      setActiveGroup(updated);
      await loadMyGroups();
    } catch (err) {
      alert(err.message || "更新成員狀態失敗");
    }
  }

  async function handleAddAnnouncement(content) {
    if (!activeGroup) return;
    if (!content || !content.trim()) return;
    try {
      const updated = await addAnnouncement(activeGroup.id, content.trim());
      setActiveGroup(updated);
    } catch (err) {
      alert(err.message || "新增公告失敗");
    }
  }

  async function handleAddCandidate(name) {
    if (!activeGroup) return;
    if (!name || !name.trim()) return;
    try {
      const updated = await addCandidate(activeGroup.id, name.trim());
      setActiveGroup(updated);
    } catch (err) {
      alert(err.message || "新增候選餐廳失敗");
    }
  }

  async function handleCloseGroup() {
    if (!activeGroup) return;
    if (!window.confirm("確定要關閉團隊嗎？關閉後無法再加入新成員。")) return;
    try {
      const updated = await closeGroup(activeGroup.id);
      setActiveGroup(updated);
      await loadMyGroups();
    } catch (err) {
      alert(err.message || "關閉團隊失敗");
    }
  }

  async function handleDeleteGroup() {
    if (!activeGroup) return;
    if (!window.confirm("確定要刪除團隊嗎？此動作無法復原。")) return;
    try {
      await deleteGroupApi(activeGroup.id);
      setActiveGroup(null);
      setView(VIEW.OVERVIEW);
      await loadMyGroups();
    } catch (err) {
      alert(err.message || "刪除團隊失敗");
    }
  }

  // ====== 建立團隊 / 加入團隊 ======

  async function handleCreateGroup(groupName) {
    const name = groupName.trim();
    if (!name) return;

    try {
      setLoading(true);
      const newGroup = await createGroup(name);

      setMyGroups((prev) => {
        const others = prev.filter((g) => g.id !== newGroup.id);
        return [newGroup, ...others];
      });

      setActiveGroup(newGroup);
      setCreatedCode(newGroup.code);
      setView(VIEW.CREATED);
    } catch (err) {
      console.error("建立團隊失敗", err);
      alert(err.message || "建立團隊失敗");
    } finally {
      setLoading(false);
    }
  }

  async function handleEnterGroup(groupSummary) {
    try {
      setLoading(true);
      const detail = await fetchGroupDetail(groupSummary.id);
      setActiveGroup(detail);
      setView(VIEW.DETAIL);
    } catch (err) {
      console.error("載入團隊失敗", err);
      alert(err.message || "載入團隊失敗");
    } finally {
      setLoading(false);
    }
  }

  // 給「加入團隊頁」用的 handler
  async function handleJoinByCode(rawCode) {
    const code = (rawCode || "").trim().toUpperCase();
    if (!code) return;

    try {
      setLoading(true);
      const group = await joinGroupByCode(code);

      setMyGroups((prev) => {
        const others = prev.filter((g) => g.id !== group.id);
        return [group, ...others];
      });

      setActiveGroup(group);
      setCreatedCode(null);
      setView(VIEW.DETAIL);
    } catch (err) {
      console.error("加入團隊失敗", err);
      alert(err.message || "加入團隊失敗");
    } finally {
      setLoading(false);
    }
  }

  async function backToOverview() {
    setView(VIEW.OVERVIEW);
    setActiveGroup(null);
    setCreatedCode(null);
    await loadMyGroups();
  }

  // ====== 根據 view 切畫面 ======

  if (view === VIEW.CREATE) {
    return (
      <GroupCreateForm
        onBack={backToOverview}
        onSubmit={handleCreateGroup}
        loading={loading}
      />
    );
  }

  if (view === VIEW.CREATED && activeGroup) {
    const code = createdCode || activeGroup.code;
    return (
      <GroupCreateSuccess
        groupName={activeGroup.name}
        code={code}
        onCopyCode={() => copyToClipboard(code)}
        onEnterGroup={() => setView(VIEW.DETAIL)}
      />
    );
  }

  if (view === VIEW.DETAIL && activeGroup) {
    // 目前登入使用者的 id（有些後端叫 id，有些叫 _id，都試一下）
    const currentUserId = String(user?.id || user?._id || "");


    const isLeader =
      !!currentUserId &&
      (
        String(activeGroup.ownerId) === String(currentUserId) ||
        (Array.isArray(activeGroup.members) &&
          activeGroup.members.some(
            (m) => String(m.userId) === String(currentUserId) && m.role === "leader"
          ))
      );

    //debug
    console.log("members = ", activeGroup.members);
    console.log("currentUserId =", currentUserId);
    console.log("isLeader =", isLeader);
    console.log("ownerId =", activeGroup.ownerId);



    return (
      <GroupDetail
        group={activeGroup}
        onBack={backToOverview}
        onCopyCode={() => copyToClipboard(activeGroup.code)}
        onSetParticipation={handleSetParticipation}
        onAddAnnouncement={handleAddAnnouncement}
        onCloseGroup={handleCloseGroup}
        onDeleteGroup={handleDeleteGroup}
        onGroupUpdated={setActiveGroup}
        isLeader={isLeader}
        // 🆕 傳進去給 GroupDetail 用來判斷成員列
        currentUserId={currentUserId}
        onSetMemberStatus={handleSetMemberStatus}
      />
    );
  }

  if (view === VIEW.JOIN) {
    return (
      <GroupJoin
        loading={loading}
        onBack={backToOverview}
        onSubmit={handleJoinByCode}
      />
    );
  }

  // default: OVERVIEW
  return (
    <GroupOverview
      myGroups={myGroups}
      loading={loading}
      onCreateClick={() => setView(VIEW.CREATE)}
      onEnterGroup={handleEnterGroup}
      onGoJoinPage={() => setView(VIEW.JOIN)}
    />
  );
}
