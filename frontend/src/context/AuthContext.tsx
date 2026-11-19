import { useCallback, useMemo, useState } from "react";
import { loginApi, signupApi } from "../api/authApi";
import { AuthContext } from "./authContextValue";

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => {
    const saved = localStorage.getItem("study_session");
    return saved ? JSON.parse(saved) : null;
  });

  const login = useCallback(async (email, password) => {
    const data = await loginApi({ email, password });
    setSession(data);
    localStorage.setItem("study_session", JSON.stringify(data));
    return data;
  }, []);

  const logout = useCallback(() => {
    setSession(null);
    localStorage.removeItem("study_session");
  }, []);

  const signup = useCallback(async (payload) => {
    return signupApi(payload);
  }, []);

  const value = useMemo(
    () => ({
      session,
      isAdmin: session?.role === "admin",
      login,
      logout,
      signup
    }),
    [session, login, logout, signup]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
