// App.jsx
import { useEffect, useState } from "react";
import { Routes, Route } from "react-router-dom";

import { getMe, logout } from "./authClient";

import AuthPage from "./pages/AuthPage";
import HomePage from "./pages/HomePage";
import Landing from "./pages/Landing";

import { LunchProvider } from "./context/LunchContext";

import { SpinPage } from "./modules/SpinPage";
import { ResultPage } from "./modules/ResultPage";

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    async function init() {
      const me = await getMe();
      setUser(me);
      setLoading(false);
    }
    init();
  }, []);

  if (loading) {
    return <div className="text-center p-5">載入中...</div>;
  }

  // =========================
  // 未登入：Landing + Auth
  // =========================
  if (!user) {
    return (
      <div className="app-shell auth-page">
        {showAuth ? (
          <AuthPage onLogin={setUser} />
        ) : (
          <Landing onStart={() => setShowAuth(true)} />
        )}
      </div>
    );
  }

  // =========================
  // 已登入：用 Routes 切頁
  // =========================
  return (
    <div className="app-shell">
      <LunchProvider>
        <Routes>
          {/* 首頁 */}
          <Route
            path="/"
            element={
              <HomePage
                user={user}
                onLogout={async () => {
                  await logout();
                  setUser(null);
                  setShowAuth(false);
                }}
              />
            }
          />

          {/* 抽獎頁 */}
          <Route path="/spin" element={<SpinPage />} />

          {/* 抽獎結果頁 */}
          <Route path="/result" element={<ResultPage />} />
        </Routes>
      </LunchProvider>
    </div>
  );
}
