import axios from "axios";

const resolveApiBaseUrl = (): string => {
  const envUrl = (import.meta.env.VITE_API_URL || "").trim().replace(/\/+$/, "");
  if (envUrl) {
    return envUrl.endsWith("/api") ? envUrl : `${envUrl}/api`;
  }
  if (
    typeof window !== "undefined" &&
    window.location.hostname !== "localhost" &&
    window.location.hostname !== "127.0.0.1"
  ) {
    return "https://sdn302-g4-be.onrender.com/api";
  }
  return "http://localhost:5000/api";
};

const api = axios.create({
  baseURL: resolveApiBaseUrl(),
  headers: {
    "Content-Type": "application/json",
  },
});

// Tự động gắn token vào request nếu đã đăng nhập
api.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem("token") ||
      localStorage.getItem("accessToken");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Xử lý response/error chung
api.interceptors.response.use(
  (response) => {
    const method = (response.config?.method || "get").toLowerCase();
    const url = response.config?.url || "";
    if (
      ["post", "put", "patch", "delete"].includes(method) &&
      !url.includes("/notifications") &&
      typeof window !== "undefined"
    ) {
      window.dispatchEvent(new CustomEvent("notification_refresh"));
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent("notification_refresh"));
      }, 600);
    }
    return response;
  },
  (error) => {
    const requestUrl = error.config?.url || "";
    const isLoginRequest =
      requestUrl.includes("/auth/login") ||
      requestUrl.includes("/login");

    // Nếu token hết hạn / không hợp lệ ở các API khác và hiện tại chưa ở trang login
    if (
      error.response?.status === 401 &&
      !isLoginRequest &&
      typeof window !== "undefined" &&
      !window.location.pathname.startsWith("/login")
    ) {
      localStorage.removeItem("token");
      localStorage.removeItem("accessToken");
      localStorage.removeItem("user");

      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

export default api;
