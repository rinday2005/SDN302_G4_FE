import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  CustomerChatContext,
  type CustomerChatContextType,
  type CustomerProductContext,
} from "./customer-chat-context";
import { useAuth } from "../hooks/useAuth";
import { getSocket } from "../services/socket";
import {
  getMyConversationApi,
  getMessagesApi,
  sendMessageApi,
  getConversationsApi,
  type ConversationItem,
  type ChatMessageItem,
} from "../services/chat.api";

export const CustomerChatProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth();
  const currentUserId = user?._id || user?.id || "";

  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"RENT" | "THRIFT">("RENT");
  const [activeConversation, setActiveConversation] = useState<ConversationItem | null>(null);
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isShopTyping, setIsShopTyping] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [productContext, setProductContext] = useState<CustomerProductContext | null>(null);

  const activeConvRef = useRef<ConversationItem | null>(null);
  const isOpenRef = useRef<boolean>(false);

  useEffect(() => {
    activeConvRef.current = activeConversation;
  }, [activeConversation]);

  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  // Đếm số tin nhắn chưa đọc ban đầu từ các conversation của User
  const refreshUnread = useCallback(async () => {
    if (!currentUserId) return;
    try {
      const convs = await getConversationsApi();
      if (!Array.isArray(convs)) return;

      let totalUnread = 0;
      convs.forEach((c) => {
        if (!c?._id || !c.lastMessage) return;
        const senderIdStr =
          typeof c.lastMessage.senderId === "object"
            ? c.lastMessage.senderId?._id?.toString()
            : c.lastMessage.senderId?.toString();

        // Tin nhắn cuối gửi từ phía Shop Owner
        if (senderIdStr && senderIdStr !== currentUserId) {
          const lastReadTime = localStorage.getItem(`customer_chat_read_${c._id}`);
          const msgTime = c.lastMessage.createdAt
            ? new Date(c.lastMessage.createdAt).getTime()
            : 0;

          if (!lastReadTime || msgTime > parseInt(lastReadTime, 10)) {
            totalUnread += 1;
          }
        }
      });
      setUnreadCount(totalUnread);
    } catch {
      // ignore
    }
  }, [currentUserId]);

  // Nạp cuộc hội thoại của User theo activeTab
  const loadConversation = useCallback(
    async (tab: "RENT" | "THRIFT") => {
      if (!currentUserId) return;
      setIsLoading(true);
      try {
        const conv = await getMyConversationApi({ serviceType: tab });
        setActiveConversation(conv);

        // Join socket room
        const socket = getSocket();
        socket.emit("join_room", { conversationId: conv._id });

        // Nạp tin nhắn
        const res = await getMessagesApi(conv._id);
        setMessages(res.messages || []);

        // Đánh dấu đã đọc hội thoại này
        localStorage.setItem(`customer_chat_read_${conv._id}`, Date.now().toString());
        refreshUnread();
      } catch (err) {
        console.warn("⚠️ [CustomerChat] Failed to load conversation:", err);
      } finally {
        setIsLoading(false);
      }
    },
    [currentUserId, refreshUnread]
  );

  const handleTabChange = useCallback(
    (tab: "RENT" | "THRIFT") => {
      setActiveTab(tab);
      loadConversation(tab);
    },
    [loadConversation]
  );

  // Lắng nghe real-time Socket.IO
  useEffect(() => {
    if (!currentUserId) return;

    let isSubscribed = true;

    // Lần đầu tải unread bất đồng bộ
    getConversationsApi()
      .then((convs) => {
        if (!isSubscribed || !Array.isArray(convs)) return;
        let totalUnread = 0;
        convs.forEach((c) => {
          if (!c?._id || !c.lastMessage) return;
          const senderIdStr =
            typeof c.lastMessage.senderId === "object"
              ? c.lastMessage.senderId?._id?.toString()
              : c.lastMessage.senderId?.toString();

          if (senderIdStr && senderIdStr !== currentUserId) {
            const lastReadTime = localStorage.getItem(`customer_chat_read_${c._id}`);
            const msgTime = c.lastMessage.createdAt
              ? new Date(c.lastMessage.createdAt).getTime()
              : 0;

            if (!lastReadTime || msgTime > parseInt(lastReadTime, 10)) {
              totalUnread += 1;
            }
          }
        });
        setUnreadCount(totalUnread);
      })
      .catch(() => {});

    const socket = getSocket();

    const handleNewMessage = (msg: ChatMessageItem & { serviceType?: "RENT" | "THRIFT" }) => {
      const senderIdStr =
        typeof msg.senderId === "object" ? String(msg.senderId._id) : String(msg.senderId);
      const isFromShop = senderIdStr !== currentUserId;

      const currentActive = activeConvRef.current;
      const isCurrentConversation =
        currentActive && String(currentActive._id) === String(msg.conversationId);

      if (isCurrentConversation) {
        setMessages((prev) => {
          const msgIdStr = String(msg._id);
          const clientMsgIdStr = msg.clientMsgId ? String(msg.clientMsgId) : "";

          // Bỏ qua nếu đã tồn tại
          if (prev.some((m) => String(m._id) === msgIdStr)) return prev;

          // Thay thế nếu trùng clientMsgId
          if (clientMsgIdStr && prev.some((m) => String(m._id) === clientMsgIdStr)) {
            return prev.map((m) => (String(m._id) === clientMsgIdStr ? msg : m));
          }

          // Thay thế tin tạm của chính mình
          if (!isFromShop) {
            const tempIdx = prev.findIndex(
              (m) => String(m._id).startsWith("temp-") && m.text === msg.text
            );
            if (tempIdx !== -1) {
              const clone = [...prev];
              clone[tempIdx] = msg;
              return clone;
            }
          }

          return [...prev, msg];
        });

        // Nếu chat box đang mở, cập nhật thời gian đã đọc
        if (isOpenRef.current) {
          localStorage.setItem(`customer_chat_read_${msg.conversationId}`, Date.now().toString());
        }
      }

      // Nếu tin nhắn từ Shop và Box Chat đang đóng (hoặc đang xem conv khác) -> tăng unread
      if (isFromShop && (!isOpenRef.current || !isCurrentConversation)) {
        if (isSubscribed) {
          setUnreadCount((prev) => prev + 1);
        }
      }
    };

    const handleUserTyping = (data: { conversationId: string; userId: string }) => {
      if (activeConvRef.current && activeConvRef.current._id === data.conversationId) {
        if (data.userId !== currentUserId) {
          setIsShopTyping(true);
        }
      }
    };

    const handleUserStopTyping = (data: { conversationId: string }) => {
      if (activeConvRef.current && activeConvRef.current._id === data.conversationId) {
        setIsShopTyping(false);
      }
    };

    socket.on("new_message", handleNewMessage);
    socket.on("user_typing", handleUserTyping);
    socket.on("user_stop_typing", handleUserStopTyping);

    return () => {
      isSubscribed = false;
      socket.off("new_message", handleNewMessage);
      socket.off("user_typing", handleUserTyping);
      socket.off("user_stop_typing", handleUserStopTyping);
    };
  }, [currentUserId, refreshUnread]);

  const openChat = useCallback(
    (options?: {
      serviceType?: "RENT" | "THRIFT";
      product?: CustomerProductContext;
    }) => {
      const tabToOpen = options?.serviceType || activeTab;
      if (options?.serviceType) {
        setActiveTab(options.serviceType);
      }
      if (options?.product) {
        setProductContext(options.product);
      }
      setIsOpen(true);
      loadConversation(tabToOpen);
    },
    [activeTab, loadConversation]
  );

  const closeChat = useCallback(() => {
    setIsOpen(false);
    if (activeConversation) {
      localStorage.setItem(`customer_chat_read_${activeConversation._id}`, Date.now().toString());
    }
    refreshUnread();
  }, [activeConversation, refreshUnread]);

  const clearProductContext = useCallback(() => {
    setProductContext(null);
  }, []);

  const sendMessage = useCallback(
    async (text: string, imageUrl?: string) => {
      if (!activeConversation || !text.trim()) return;

      const clientMsgId = `temp-${Date.now()}`;
      const optimisticMsg: ChatMessageItem = {
        _id: clientMsgId,
        conversationId: activeConversation._id,
        senderId: currentUserId,
        text: text.trim(),
        imageUrl: imageUrl || null,
        clientMsgId,
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, optimisticMsg]);

      const socket = getSocket();
      socket.emit("stop_typing", { conversationId: activeConversation._id });

      try {
        if (socket.connected) {
          socket.emit(
            "send_message",
            {
              conversationId: activeConversation._id,
              text: text.trim(),
              imageUrl,
              clientMsgId,
            },
            (ack: { success?: boolean; message?: ChatMessageItem }) => {
              if (ack?.success && ack.message) {
                setMessages((prev) =>
                  prev.map((m) => (m._id === clientMsgId ? (ack.message as ChatMessageItem) : m))
                );
              }
            }
          );
        } else {
          const saved = await sendMessageApi(activeConversation._id, {
            text: text.trim(),
            imageUrl,
          });
          setMessages((prev) => prev.map((m) => (m._id === clientMsgId ? saved : m)));
        }
      } catch (err) {
        console.error("⚠️ [CustomerChat] Send message failed:", err);
      }
    },
    [activeConversation, currentUserId]
  );

  const sendTyping = useCallback(
    (isTyping: boolean) => {
      if (!activeConversation) return;
      const socket = getSocket();
      if (isTyping) {
        socket.emit("typing", { conversationId: activeConversation._id });
      } else {
        socket.emit("stop_typing", { conversationId: activeConversation._id });
      }
    },
    [activeConversation]
  );

  const contextValue: CustomerChatContextType = {
    isOpen,
    activeTab,
    unreadCount,
    messages,
    isLoading,
    isShopTyping,
    productContext,
    openChat,
    closeChat,
    setActiveTab: handleTabChange,
    sendMessage,
    sendTyping,
    clearProductContext,
  };

  return (
    <CustomerChatContext.Provider value={contextValue}>
      {children}
    </CustomerChatContext.Provider>
  );
};
