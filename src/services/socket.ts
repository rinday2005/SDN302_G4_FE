import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

const getSocketBaseUrl = (): string => {
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
  return apiUrl.replace(/\/api\/?$/, "");
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

  if (!socket) {
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
        (socket.auth as any).token = currentToken;
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
};

export const reconnectSocket = () => {
  disconnectSocket();
  return getSocket();
};

export default getSocket;
