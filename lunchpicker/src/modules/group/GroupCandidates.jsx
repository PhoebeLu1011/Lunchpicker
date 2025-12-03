// src/modules/group/GroupCandidates.jsx
import React, { useState } from "react";
import { addCandidate, updateVote, closeVote } from "../../api/groupApi";

export default function GroupCandidates({
  groupId,
  candidates,
  votingClosed,
  isLeader,
  onGroupUpdated,
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);

  const hasCandidates = candidates && candidates.length > 0;

  // 最高票（決定誰要顯示 👑）
  let maxVotes = 0;
  candidates.forEach((c) => {
    if (c.voteCount > maxVotes) maxVotes = c.voteCount;
  });

  // 新增候選餐廳
  async function handleAdd() {
    if (!name.trim()) {
      alert("餐廳名稱必填");
      return;
    }
    setLoading(true);
    try {
      const updated = await addCandidate(
        groupId,
        name.trim(),
        address.trim() || ""
      );
      onGroupUpdated(updated);
      setName("");
      setAddress("");
      setIsAdding(false);
    } catch (err) {
      alert(err.message);
    }
    setLoading(false);
  }

  // 投票 / 取消投票
  async function handleVote(candidate) {
    if (votingClosed) return;
    setLoading(true);
    try {
      const nextId = candidate.hasMyVote ? null : candidate.id;
      const updated = await updateVote(groupId, nextId);
      onGroupUpdated(updated);
    } catch (err) {
      alert(err.message);
    }
    setLoading(false);
  }

  // 團長關閉投票
  async function handleCloseVote() {
    if (!window.confirm("確定要關閉投票？關閉後無法再變更。")) return;
    setLoading(true);
    try {
      const updated = await closeVote(groupId);
      onGroupUpdated(updated);
    } catch (err) {
      alert(err.message);
    }
    setLoading(false);
  }

  return (
    <div className="group-card group-candidates-card">
      {/* 標題列 */}
      <div className="section-header">
        <div className="section-title-with-icon">
          <span className="emoji">🍽</span>
          <span>候選餐廳</span>
          <span className="pill pill-count">{candidates.length}</span>
          {votingClosed && (
            <span className="pill pill-closed">投票已關閉</span>
          )}
        </div>

        <div className="group-candidates-actions">
          {isLeader && !votingClosed && (
            <button
              className="chip-btn chip-danger"
              onClick={handleCloseVote}
            >
              關閉投票
            </button>
          )}

          {!votingClosed && (
            <>
              {!isAdding && (
                <button
                  className="chip-btn"
                  onClick={() => setIsAdding(true)}
                >
                  ＋ 新增
                </button>
              )}
              {isAdding && (
                <button
                  className="chip-btn"
                  onClick={() => setIsAdding(false)}
                >
                  × 取消
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* 新增表單（收闔） */}
      {isAdding && !votingClosed && (
        <div className="candidate-form">
          <div className="form-row">
            <label>餐廳名稱 *</label>
            <input
              className="group-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例如：老王牛肉麵"
            />
          </div>

          <div className="form-row">
            <label>地址（選填）</label>
            <input
              className="group-input"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="台北市大安區..."
            />
          </div>

          <button
            className="primary-btn full-width-btn"
            onClick={handleAdd}
            disabled={loading}
          >
            {loading ? "新增中…" : "新增餐廳"}
          </button>
        </div>
      )}

      {/* 空狀態 */}
      {!hasCandidates && (
        <div className="candidate-empty">
          <div className="candidate-empty-icon">🧾</div>
          <div className="candidate-empty-title">還沒有候選餐廳</div>
          <div className="candidate-empty-text">
            點擊「新增」按鈕加入第一間餐廳
          </div>
        </div>
      )}

      {/* 候選列表 */}
      {hasCandidates && (
        <div className="candidate-list">
          {candidates.map((c, index) => {
            const isWinner = c.voteCount === maxVotes && maxVotes > 0;

            return (
              <div key={c.id} className="candidate-item">
                {/* 上半：名稱 + 右側按鈕 */}
                <div className="candidate-header">
                  <div className="candidate-info">
                    <div className="candidate-index">{index + 1}</div>
                    <div className="candidate-main">
                      <div className="candidate-name">{c.name}</div>
                      {c.address && (
                        <div className="candidate-address">
                          {c.address}
                        </div>
                      )}
                      <div className="candidate-meta">
                        由 {c.createdByName} 新增
                      </div>
                    </div>
                  </div>

                  <div className="candidate-actions">
                    {isWinner && (
                      <span className="candidate-crown">👑</span>
                    )}
                    <button
                      className={
                        "candidate-vote-btn" +
                        (c.hasMyVote ? " voted" : "")
                      }
                      disabled={votingClosed || loading}
                      onClick={() => handleVote(c)}
                    >
                      ⭐
                    </button>
                  </div>
                </div>

                {/* 下半：票數＋進度條 */}
                <div className="candidate-vote-row">
                  <span className="candidate-vote-count">
                    {c.voteCount} 票
                  </span>
                  <div className="candidate-progress">
                    <div
                      className="candidate-progress-inner"
                      style={{ width: `${c.percent}%` }}
                    />
                  </div>
                  <span className="candidate-percent">
                    {c.percent}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
