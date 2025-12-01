// src/App.jsx
import { useEffect, useState } from "react";
import { getMe, logout } from "./authClient";

import AuthPage from "./pages/AuthPage";
import HomePage from "./pages/HomePage";

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 一進來檢查使用者是否登入
  useEffect(() => {
    async function init() {
      const me = await getMe();
      setUser(me);
      setLoading(false);
    }
    init();
  }, []);

  if (loading) {
    return (
      <div className="text-center p-5">載入中...</div>
    );
  }

  //  未登入 → 去 AuthPage
  if (!user) {
    return <AuthPage onLogin={setUser} />;
  }

  //  已登入 → 主頁面
  return <HomePage user={user} onLogout={async () => {
    await logout();
    setUser(null);
  }} />;
}
