import { useState, useEffect } from "react";
import type { ReactNode } from "react";
import { loginApi } from "../services/auth.api";
import { AuthContext } from "./auth-context";

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("token")
  );

  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("user");

    return savedUser ? JSON.parse(savedUser) : null;
  });

  useEffect(() => {
    const handleProfileSync = () => {
      const savedUser = localStorage.getItem("user");
      if (savedUser) {
        try {
          setUser(JSON.parse(savedUser));
        } catch {
          // ignore
        }
      }
    };
    window.addEventListener("user_profile_updated", handleProfileSync);
    window.addEventListener("profile_updated", handleProfileSync);
    return () => {
      window.removeEventListener("user_profile_updated", handleProfileSync);
      window.removeEventListener("profile_updated", handleProfileSync);
    };
  }, []);

  const login = async (data: Parameters<typeof loginApi>[0]) => {
    const result = await loginApi(data);

    // Xóa cache dữ liệu của user cũ trước khi lưu thông tin user mới
    localStorage.removeItem("user_profile_data");

    localStorage.setItem("token", result.accessToken);
    localStorage.setItem("user", JSON.stringify(result.user));

    setToken(result.accessToken);
    setUser(result.user);

    window.dispatchEvent(new CustomEvent("profile_updated", { detail: result.user }));
    window.dispatchEvent(new Event("user_profile_updated"));

    return result.user;
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
    localStorage.removeItem("user_profile_data");

    setToken(null);
    setUser(null);

    window.dispatchEvent(new CustomEvent("profile_updated", { detail: null }));
    window.dispatchEvent(new Event("user_profile_updated"));
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};