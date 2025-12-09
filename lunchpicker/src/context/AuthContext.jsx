// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import {
  login as apiLogin,
  getMe,
  logout as apiLogout,
} from "../authClient"; 

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 第一次看後端 cookie 有沒有登入中的 user
  useEffect(() => {
    async function init() {
      try {
        const me = await getMe();
        if (me) setUser(me);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);


  async function login(email, password) {
    const result = await apiLogin({ email, password });
    if (!result.ok) {
      throw new Error(result.error || "登入失敗");
    }
    setUser(result.user);
    return result.user;
  }

  async function logout() {
    await apiLogout();
    setUser(null);
  }

  const value = {
    user,
    isAuthenticated: !!user,
    loading,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
