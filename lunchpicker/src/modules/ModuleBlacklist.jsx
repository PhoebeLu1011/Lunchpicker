// src/modules/ModuleBlacklist.jsx
import { useState, useEffect } from "react";

// 讀取黑名單
function loadBlacklistKeywords() {
  try {
    const raw = localStorage.getItem("lunchpicker_blacklist");
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error("讀取黑名單失敗", e);
    return [];
  }
}

export default function ModuleBlacklist() {
  // 黑名單關鍵字列表
  const [keywords, setKeywords] = useState([]);

  // 一開始載入 localStorage
  useEffect(() => {
    setKeywords(loadBlacklistKeywords());
  }, []);

  // 存入 localStorage
  const saveToStorage = (next) => {
    setKeywords(next);
    try {
      localStorage.setItem("lunchpicker_blacklist", JSON.stringify(next));
    } catch (e) {
      console.error("儲存黑名單失敗", e);
    }
  };

  // 新增
  const handleAddClick = () => {
    const input = window.prompt("請輸入要加入黑名單的關鍵字（例如：火鍋、燒烤）");
    if (!input) return;
    const keyword = input.trim();
    if (!keyword) return;

    if (keywords.includes(keyword)) {
      alert("這個關鍵字已存在！");
      return;
    }

    saveToStorage([keyword, ...keywords]);
  };

  // 刪除
  const handleDelete = (keyword) => {
    if (!window.confirm(`確定要刪除「${keyword}」嗎？`)) return;
    saveToStorage(keywords.filter((k) => k !== keyword));
  };

  // UI style
  const styles = {
    page: {
      backgroundColor: "#fff6ee",
      borderRadius: "24px",
      padding: "24px 32px",
      minHeight: "100vh",
    },
    introCard: {
      display: "flex",
      gap: "16px",
      backgroundColor: "#ffe3d6",
      borderRadius: "24px",
      padding: "20px 24px",
      marginBottom: "24px",
    },
    introIcon: {
      width: "40px",
      height: "40px",
      borderRadius: "999px",
      border: "2px solid #ff8a3c",
      color: "#ff8a3c",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "20px",
      backgroundColor: "#fff",
      flexShrink: 0,
    },
    introTitle: {
      fontSize: "20px",
      fontWeight: "700",
      margin: 0,
    },
    main: {
      display: "flex",
      gap: "24px",
    },
    addBtn: {
      width: "160px",
      height: "96px",
      borderRadius: "24px",
      backgroundColor: "#ff8a00",
      color: "#fff",
      fontSize: "16px",
      fontWeight: "600",
      border: "none",
      cursor: "pointer",
      boxShadow: "0 8px 16px rgba(255,138,0,0.3)",
    },
    addPlus: { fontSize: "24px", marginBottom: "4px" },
    emptyCard: {
      flex: 1,
      minHeight: "220px",
      backgroundColor: "#fff",
      borderRadius: "32px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px",
    },
    chipRow: {
      display: "flex",
      flexWrap: "wrap",
      gap: "10px",
      marginTop: "16px",
      justifyContent: "center",
    },
    chip: {
      backgroundColor: "#ffeede",
      padding: "6px 12px",
      borderRadius: "999px",
      display: "flex",
      alignItems: "center",
      gap: "6px",
      color: "#8a5a3c",
    },
    delBtn: {
      border: "none",
      background: "transparent",
      cursor: "pointer",
      color: "#c08060",
    },
  };

  return (
    <div style={styles.page}>
      <section style={styles.introCard}>
        <div style={styles.introIcon}>✕</div>
        <div>
          <h2 style={styles.introTitle}>黑名單說明</h2>
          <p>加入黑名單的關鍵字，抽籤時不會出現。</p>
        </div>
      </section>

      <section style={styles.main}>
        <button style={styles.addBtn} onClick={handleAddClick}>
          <span style={styles.addPlus}>＋</span>
          新增黑名單
        </button>

        <div style={styles.emptyCard}>
          {keywords.length === 0 ? (
            <>
              <p style={{ fontSize: "18px", fontWeight: "600" }}>
                黑名單是空的
              </p>
              <p style={{ color: "#999" }}>新增不想看到的餐廳或關鍵字</p>
            </>
          ) : (
            <>
              <p style={{ fontSize: "18px", fontWeight: "600" }}>
                目前黑名單
              </p>

              <div style={styles.chipRow}>
                {keywords.map((k) => (
                  <span key={k} style={styles.chip}>
                    {k}
                    <button
                      style={styles.delBtn}
                      onClick={() => handleDelete(k)}
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
