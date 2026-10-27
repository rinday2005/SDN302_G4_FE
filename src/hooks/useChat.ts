import { useState, useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "./useAuth";
import type {
  Conversation,
  ChatMessage,
} from "../services/chat.api";
import {
  getMyConversationApi,
  getConversationsApi,
  getMessagesApi,
  sendMessageApi,
  uploadChatImageApi,
} from "../services/chat.api";

// Lấy socket server URL từ biến môi trường (cắt bỏ đuôi /api nếu có)
const getSocketUrl = (): string => {
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5001/api";
  return apiUrl.replace(/\/api\/?$/, "");
};

export interface UseChatReturn {
  socket: Socket | null;
  isConnected: boolean;
  conversations: Conversation[];
  activeConversation: Conversation | null;
  setActiveConversation: (conv: Conversation | null) => void;
  messages: ChatMessage[];
  loadingConversations: boolean;
  loadingMessages: boolean;
  isSending: boolean;
  isUploadingImage: boolean;
  partnerTyping: { isTyping: boolean; fullName?: string };
  unreadCounts: Record<string, number>;
  totalUnreadCount: number;
  error: string | null;
  sendMessage: (text: string, imageUrl?: string | null) => Promise<boolean>;
  sendImageMessage: (file: File, caption?: string) => Promise<boolean>;
  sendTyping: () => void;
  sendStopTyping: () => void;
  refreshConversations: () => Promise<void>;
  markConversationAsRead: (conversationId: string) => void;
}

export const useChat = (initialConversationId?: string | null): UseChatReturn => {
  const { user } = useAuth();
  const userId = user?._id || user?.id || "";
  const role = user?.role || "USER";

  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversationState] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingConversations, setLoadingConversations] = useState<boolean>(true);
  const [loadingMessages, setLoadingMessages] = useState<boolean>(false);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [isUploadingImage, setIsUploadingImage] = useState<boolean>(false);
  const [partnerTyping, setPartnerTyping] = useState<{ isTyping: boolean; fullName?: string }>({
    isTyping: false,
  });
  const [error, setError] = useState<string | null>(null);

  // Unread counts state: { [conversationId]: count }
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>(() => {
    if (!userId) return {};
    try {
      const saved = localStorage.getItem(`chat_unread_${userId}`);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const activeConvRef = useRef<Conversation | null>(null);

  useEffect(() => {
    activeConvRef.current = activeConversation;
  }, [activeConversation]);

  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Lưu unreadCounts vào localStorage khi thay đổi
  useEffect(() => {
    if (userId) {
      try {
        localStorage.setItem(`chat_unread_${userId}`, JSON.stringify(unreadCounts));
      } catch {
        // ignore
      }
    }
  }, [unreadCounts, userId]);

  // Đánh dấu conversation là đã đọc
  const markConversationAsRead = useCallback(
    (conversationId: string) => {
      setUnreadCounts((prev) => {
        if (!prev[conversationId]) return prev;
        const next = { ...prev };
        delete next[conversationId];
        return next;
      });
    },
    []
  );

  // Tính tổng số tin nhắn chưa đọc
  const totalUnreadCount = Object.values(unreadCounts).reduce((sum, count) => sum + count, 0);

  // Khởi tạo Socket.IO connection
  useEffect(() => {
    const token =
      localStorage.getItem("token") ||
      localStorage.getItem("accessToken") ||
      "";

    if (!token || !userId) {
      return;
    }

    const socketUrl = getSocketUrl();
    const newSocket = io(socketUrl, {
      auth: { token: `Bearer ${token}` },
      query: { token },
      transports: ["websocket", "polling"],
      reconnectionAttempts: 10,
      reconnectionDelay: 1500,
      autoConnect: true,
    });

    newSocket.on("connect", () => {
      setIsConnected(true);
      setError(null);
      if (activeConvRef.current?._id) {
        newSocket.emit("join_conversation", activeConvRef.current._id);
      }
    });

    newSocket.on("disconnect", () => {
      setIsConnected(false);
    });

    newSocket.on("connect_error", (err) => {
      console.warn("Socket connection error:", err.message);
      setIsConnected(false);
    });

    // Lắng nghe tin nhắn mới từ Socket server
    const handleIncomingMessage = (newMsg: ChatMessage) => {
      if (!newMsg || !newMsg.conversationId) return;

      const currentActiveId = activeConvRef.current?._id;

      if (currentActiveId && String(newMsg.conversationId) === String(currentActiveId)) {
        setMessages((prev) => {
          const msgId = newMsg._id || newMsg.id;
          const exists = prev.some((m) => (m._id || m.id) === msgId);
          if (exists) return prev;
          return [...prev, newMsg];
        });

        markConversationAsRead(newMsg.conversationId);
      } else {
        const senderIdStr =
          typeof newMsg.senderId === "string"
            ? newMsg.senderId
            : newMsg.senderId?._id;

        if (senderIdStr && String(senderIdStr) !== String(userId)) {
          setUnreadCounts((prev) => ({
            ...prev,
            [newMsg.conversationId]: (prev[newMsg.conversationId] || 0) + 1,
          }));
        }
      }

      setConversations((prev) => {
        return prev.map((c) => {
          if (String(c._id) === String(newMsg.conversationId)) {
            return {
              ...c,
              lastMessage: {
                text: newMsg.text || (newMsg.imageUrl ? "[Hình ảnh]" : ""),
                senderId: newMsg.senderId,
                imageUrl: newMsg.imageUrl,
                createdAt: newMsg.createdAt,
              },
              updatedAt: newMsg.createdAt,
            };
          }
          return c;
        });
      });
    };

    newSocket.on("new_message", handleIncomingMessage);
    newSocket.on("receive_message", handleIncomingMessage);

    newSocket.on("conversation_updated", (updatedConv: Conversation) => {
      if (!updatedConv?._id) return;
      setConversations((prev) => {
        const index = prev.findIndex((c) => String(c._id) === String(updatedConv._id));
        if (index >= 0) {
          const updated = [...prev];
          updated[index] = { ...updated[index], ...updatedConv };
          return updated.sort((a, b) => {
            const dateA = new Date(a.updatedAt || a.createdAt || 0).getTime();
            const dateB = new Date(b.updatedAt || b.createdAt || 0).getTime();
            return dateB - dateA;
          });
        }
        return [updatedConv, ...prev];
      });
    });

    newSocket.on("user_typing", (data: { conversationId: string; userId: string; fullName?: string }) => {
      if (
        activeConvRef.current?._id &&
        String(data.conversationId) === String(activeConvRef.current._id) &&
        String(data.userId) !== String(userId)
      ) {
        setPartnerTyping({ isTyping: true, fullName: data.fullName });
      }
    });

    newSocket.on("user_stop_typing", (data: { conversationId: string; userId: string }) => {
      if (
        activeConvRef.current?._id &&
        String(data.conversationId) === String(activeConvRef.current._id) &&
        String(data.userId) !== String(userId)
      ) {
        setPartnerTyping({ isTyping: false });
      }
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [userId, markConversationAsRead]);

  // Load danh sách cuộc trò chuyện ban đầu từ API
  useEffect(() => {
    let isCancelled = false;

    const loadConvs = async () => {
      if (!userId) return;
      try {
        let convList: Conversation[] = [];
        if (role === "SHOP_OWNER") {
          convList = await getConversationsApi();
        } else {
          const result = await getMyConversationApi();
          if (Array.isArray(result)) {
            convList = result;
          } else if (result) {
            convList = [result];
          }
        }

        if (!isCancelled) {
          setConversations(convList);
          if (convList.length > 0) {
            if (initialConversationId) {
              const match = convList.find((c) => String(c._id) === String(initialConversationId));
              if (match) {
                setActiveConversationState(match);
                return;
              }
            }
            if (!activeConvRef.current) {
              setActiveConversationState(convList[0]);
            }
          }
        }
      } catch (err: unknown) {
        console.warn("Chat conversations initial fetch notice:", err);
      } finally {
        if (!isCancelled) {
          setLoadingConversations(false);
        }
      }
    };

    loadConvs();

    return () => {
      isCancelled = true;
    };
  }, [userId, role, initialConversationId]);

  // Hàm thủ công làm mới danh sách cuộc trò chuyện
  const refreshConversations = useCallback(async () => {
    if (!userId) return;
    try {
      setLoadingConversations(true);
      setError(null);

      let convList: Conversation[] = [];
      if (role === "SHOP_OWNER") {
        convList = await getConversationsApi();
      } else {
        const result = await getMyConversationApi();
        if (Array.isArray(result)) {
          convList = result;
        } else if (result) {
          convList = [result];
        }
      }
      setConversations(convList);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Không thể tải danh sách cuộc trò chuyện";
      setError(msg);
    } finally {
      setLoadingConversations(false);
    }
  }, [userId, role]);

  // Chuyển đổi active conversation và tham gia room Socket
  const setActiveConversation = useCallback(
    (conv: Conversation | null) => {
      if (activeConvRef.current?._id && socket && isConnected) {
        socket.emit("leave_conversation", activeConvRef.current._id);
      }

      setActiveConversationState(conv);
      setPartnerTyping({ isTyping: false });

      if (conv?._id) {
        const cacheKey = `chat_cache_${userId}_${conv._id}`;
        try {
          const cached = localStorage.getItem(cacheKey);
          setMessages(cached ? JSON.parse(cached) : []);
        } catch {
          setMessages([]);
        }

        markConversationAsRead(conv._id);
        if (socket && isConnected) {
          socket.emit("join_conversation", conv._id);
        }
      } else {
        setMessages([]);
      }
    },
    [userId, socket, isConnected, markConversationAsRead]
  );

  // Load tin nhắn của active conversation
  useEffect(() => {
    if (!activeConversation?._id || !userId) {
      return;
    }

    const convId = activeConversation._id;
    let isCancelled = false;
    const cacheKey = `chat_cache_${userId}_${convId}`;

    getMessagesApi(convId, 1, 100)
      .then((res) => {
        if (!isCancelled) {
          const fetchedMessages = res.messages || [];
          setMessages(fetchedMessages);
          try {
            localStorage.setItem(cacheKey, JSON.stringify(fetchedMessages));
          } catch {
            // ignore
          }
        }
      })
      .catch((err) => {
        if (!isCancelled) {
          console.warn("Lỗi tải tin nhắn từ server:", err.message);
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setLoadingMessages(false);
        }
      });

    if (socket && isConnected) {
      socket.emit("join_conversation", convId);
    }

    return () => {
      isCancelled = true;
    };
  }, [activeConversation?._id, userId, socket, isConnected]);

  // Gửi tin nhắn text
  const sendMessage = useCallback(
    async (text: string, imageUrl?: string | null): Promise<boolean> => {
      const trimmedText = text?.trim() || "";
      const trimmedImg = imageUrl?.trim() || null;

      if (!trimmedText && !trimmedImg) return false;
      if (!activeConversation?._id) return false;

      const convId = activeConversation._id;
      setIsSending(true);

      const tempId = `temp_${Date.now()}`;
      const optimisticMsg: ChatMessage = {
        _id: tempId,
        id: tempId,
        conversationId: convId,
        senderId: {
          _id: userId,
          fullName: user?.fullName || "Tôi",
          email: user?.email || "",
          avatarUrl: user?.avatarUrl || user?.avatar || "",
          role: role as "USER" | "SHOP_OWNER" | "ADMIN",
        },
        text: trimmedText,
        imageUrl: trimmedImg,
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, optimisticMsg]);

      try {
        if (socket && isConnected) {
          await new Promise<void>((resolve, reject) => {
            socket.emit(
              "send_message",
              {
                conversationId: convId,
                text: trimmedText,
                imageUrl: trimmedImg,
              },
              (response: { success: boolean; data?: ChatMessage; error?: string }) => {
                if (response?.success && response.data) {
                  setMessages((prev) =>
                    prev.map((m) => (m._id === tempId ? response.data! : m))
                  );
                  resolve();
                } else {
                  reject(new Error(response?.error || "Gửi socket thất bại"));
                }
              }
            );
          });
        } else {
          const savedMsg = await sendMessageApi(convId, {
            text: trimmedText,
            imageUrl: trimmedImg,
          });
          setMessages((prev) =>
            prev.map((m) => (m._id === tempId ? savedMsg : m))
          );
        }

        const cacheKey = `chat_cache_${userId}_${convId}`;
        setMessages((current) => {
          try {
            localStorage.setItem(cacheKey, JSON.stringify(current));
          } catch {
            // ignore
          }
          return current;
        });

        if (socket && isConnected) {
          socket.emit("stop_typing", { conversationId: convId });
        }

        return true;
      } catch (err: unknown) {
        console.warn("Gửi qua socket thất bại, thử fallback HTTP:", err);
        try {
          const savedMsg = await sendMessageApi(convId, {
            text: trimmedText,
            imageUrl: trimmedImg,
          });
          setMessages((prev) =>
            prev.map((m) => (m._id === tempId ? savedMsg : m))
          );
          return true;
        } catch (httpErr: unknown) {
          const msg = httpErr instanceof Error ? httpErr.message : "Gửi tin nhắn thất bại";
          setError(msg);
          setMessages((prev) => prev.filter((m) => m._id !== tempId));
          return false;
        }
      } finally {
        setIsSending(false);
      }
    },
    [activeConversation?._id, userId, user, role, socket, isConnected]
  );

  // Upload và gửi ảnh
  const sendImageMessage = useCallback(
    async (file: File, caption?: string): Promise<boolean> => {
      if (!file || !activeConversation?._id) return false;
      try {
        setIsUploadingImage(true);
        setError(null);
        const imageUrl = await uploadChatImageApi(file);
        return await sendMessage(caption || "", imageUrl);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Tải ảnh lên thất bại";
        setError(msg);
        return false;
      } finally {
        setIsUploadingImage(false);
      }
    },
    [activeConversation?._id, sendMessage]
  );

  // Gửi sự kiện typing (với debounce tự động stop)
  const sendTyping = useCallback(() => {
    if (!socket || !isConnected || !activeConversation?._id) return;
    socket.emit("typing", { conversationId: activeConversation._id });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("stop_typing", { conversationId: activeConversation._id });
    }, 2500);
  }, [socket, isConnected, activeConversation?._id]);

  const sendStopTyping = useCallback(() => {
    if (!socket || !isConnected || !activeConversation?._id) return;
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    socket.emit("stop_typing", { conversationId: activeConversation._id });
  }, [socket, isConnected, activeConversation?._id]);

  return {
    socket,
    isConnected,
    conversations,
    activeConversation,
    setActiveConversation,
    messages,
    loadingConversations,
    loadingMessages,
    isSending,
    isUploadingImage,
    partnerTyping,
    unreadCounts,
    totalUnreadCount,
    error,
    sendMessage,
    sendImageMessage,
    sendTyping,
    sendStopTyping,
    refreshConversations,
    markConversationAsRead,
  };
};
