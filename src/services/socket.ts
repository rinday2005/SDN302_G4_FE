import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;
let lastConnectedToken: string | null = null;

const getSocketBaseUrl = (): string => {
  const envUrl = (import.meta.env.VITE_API_URL || "").trim();
  if (envUrl) {
    return envUrl.replace(/\/api\/?$/, "").replace(/\/+$/, "");
  }
  if (
    typeof window !== "undefined" &&
    window.location.hostname !== "localhost" &&
    window.location.hostname !== "127.0.0.1"
  ) {
    return "https://sdn302-g4-be.onrender.com";
  }
  return "http://localhost:5000";
};

const getStoredToken = (): string => {
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken") ||
    ""
  );
};

export const getSocket = (): Socket => {
  const currentToken = getStoredToken();

  // Nếu token đã thay đổi so với khi socket kết nối trước đó -> ngắt kết nối và tạo socket mới
  if (socket && lastConnectedToken !== null && lastConnectedToken !== currentToken) {
    console.log("🔄 [Socket.IO] Auth token changed. Reconnecting socket with new credentials...");
    socket.disconnect();
    socket = null;
  }

  if (!socket) {
    lastConnectedToken = currentToken;
    socket = io(getSocketBaseUrl(), {
      auth: (cb) => {
        cb({ token: getStoredToken() });
      },
      transports: ["polling", "websocket"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
    });

    socket.on("connect", () => {
      console.log("🟢 [Socket.IO] Connected to real-time chat server:", socket?.id);
    });

    socket.on("connect_error", (err) => {
      console.warn("⚠️ [Socket.IO] Connection error:", err.message);
    });

    socket.on("disconnect", (reason) => {
      console.log("🔴 [Socket.IO] Disconnected:", reason);
    });
  } else {
    // Đảm bảo auth token luôn cập nhật
    if (currentToken && socket.auth) {
      if (typeof socket.auth === "object") {
        (socket.auth as Record<string, unknown>).token = currentToken;
      }
    }
    if (!socket.connected) {
      socket.connect();
    }
  }

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
  lastConnectedToken = null;
};

export const reconnectSocket = () => {
  disconnectSocket();
  return getSocket();
};

export default getSocket;
