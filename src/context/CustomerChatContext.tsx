import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
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
  deleteConversationApi,
  type ConversationItem,
  type ChatMessageItem,
} from "../services/chat.api";

export const CustomerChatProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useAuth();
  const currentUserId = user?._id || user?.id || "";

  const [isOpen, setIsOpen] = useState(false);
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [activeConversation, setActiveConversation] = useState<ConversationItem | null>(null);
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isShopTyping, setIsShopTyping] = useState(false);
  const [productContext, setProductContext] = useState<CustomerProductContext | null>(null);

  const activeConvRef = useRef<ConversationItem | null>(null);
  const isOpenRef = useRef<boolean>(false);
  const productContextRef = useRef<CustomerProductContext | null>(null);

  useEffect(() => {
    activeConvRef.current = activeConversation;
  }, [activeConversation]);

  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  useEffect(() => {
    productContextRef.current = productContext;
  }, [productContext]);

  // Tính số lượng tin nhắn chưa đọc tổng cộng của User across all shops
  const unreadTotal = useMemo(() => {
    return conversations.reduce((acc, conv) => acc + (conv.unreadCount || 0), 0);
  }, [conversations]);

  // Tải danh sách các cuộc trò chuyện của User với các Shop khác nhau
  const refreshConversations = useCallback(async () => {
    if (!currentUserId) return;
    try {
      const data = await getConversationsApi();
      if (!Array.isArray(data)) return;

      const mapped: ConversationItem[] = data.map((c) => {
        if (!c?._id) return c;
        const senderIdStr =
          typeof c.lastMessage?.senderId === "object"
            ? c.lastMessage?.senderId?._id?.toString()
            : c.lastMessage?.senderId?.toString();

        const isFromOther = senderIdStr && String(senderIdStr) !== String(currentUserId);
        const isCurrent = activeConvRef.current && String(activeConvRef.current._id) === String(c._id);
        const lastReadTime = localStorage.getItem(`customer_chat_read_${c._id}`);
        const msgTime = c.lastMessage?.createdAt
          ? new Date(c.lastMessage.createdAt).getTime()
          : 0;

        let unread = 0;
        if (isFromOther && !isCurrent) {
          if (!lastReadTime || msgTime > parseInt(lastReadTime, 10)) {
            unread = 1;
          }
        }

        return {
          ...c,
          unreadCount: unread,
        };
      });

      setConversations(mapped);
    } catch {
      // ignore
    }
  }, [currentUserId]);

  // Chọn một Shop để trò chuyện và tải tin nhắn
  const selectConversation = useCallback(
    async (conv: ConversationItem) => {
      setActiveConversation(conv);
      setIsLoadingMessages(true);

      // Nếu đang có banner sản phẩm, kiểm tra xem shop được chọn có đúng là shop của sản phẩm không
      if (productContextRef.current) {
        const prodShopId = productContextRef.current.shopId ? String(productContextRef.current.shopId) : "";
        const isSameShop = conv?.participants?.some(
          (p) => String(p._id) === prodShopId
        );
        if (!isSameShop) {
          setProductContext(null);
        }
      }

      // Đánh dấu đã đọc
      localStorage.setItem(`customer_chat_read_${conv._id}`, Date.now().toString());

      // Cập nhật unreadCount = 0 cho conversation này
      setConversations((prev) =>
        prev.map((c) => (c._id === conv._id ? { ...c, unreadCount: 0 } : c))
      );

      try {
        const socket = getSocket();
        socket.emit("join_room", { conversationId: conv._id });

        const res = await getMessagesApi(conv._id);
        setMessages(res.messages || []);
      } catch (err) {
        console.warn("⚠️ [CustomerChat] Failed to load messages:", err);
      } finally {
        setIsLoadingMessages(false);
      }
    },
    []
  );

  // Mở Chat Drawer với Shop cụ thể hoặc danh sách Shop
  const openChat = useCallback(
    async (options?: {
      shopId?: string;
      serviceType?: "RENT" | "THRIFT";
      product?: CustomerProductContext;
    }) => {
      setIsOpen(true);
      if (options?.product) {
        setProductContext(options.product);
      }

      const targetShopId = options?.shopId || options?.product?.shopId;
      const targetServiceType: "RENT" | "THRIFT" = options?.serviceType || "RENT";

      try {
        setIsLoadingConversations(true);
        const data = await getConversationsApi();
        const convList = Array.isArray(data) ? data : [];

        // Tìm cuộc trò chuyện với shop cụ thể theo đúng loại dịch vụ (RENT hoặc THRIFT)
        let targetConv: ConversationItem | undefined = undefined;

        if (targetShopId) {
          targetConv = convList.find(
            (c) =>
              c.participants?.some(
                (p) => String(p._id) === String(targetShopId) && String(p._id) !== String(currentUserId)
              ) && (c.serviceType || "RENT") === targetServiceType
          );
        }

        // Nếu chưa có conversation với shop này theo đúng serviceType, gọi API tạo mới
        if (!targetConv && targetShopId) {
          targetConv = await getMyConversationApi({ shopId: targetShopId, serviceType: targetServiceType });
          convList.unshift(targetConv);
        } else if (!targetConv && convList.length > 0) {
          // Nếu không truyền shopId, chọn conversation đầu tiên
          targetConv = activeConvRef.current || convList[0];
        } else if (!targetConv) {
          targetConv = await getMyConversationApi({ serviceType: targetServiceType });
          convList.unshift(targetConv);
        }

        setConversations(convList);

        if (targetConv) {
          selectConversation(targetConv);
        }
      } catch (err) {
        console.warn("⚠️ [CustomerChat] Open chat error:", err);
      } finally {
        setIsLoadingConversations(false);
      }
    },
    [currentUserId, selectConversation]
  );

  const closeChat = useCallback(() => {
    setIsOpen(false);
    if (activeConversation) {
      localStorage.setItem(`customer_chat_read_${activeConversation._id}`, Date.now().toString());
    }
    refreshConversations();
  }, [activeConversation, refreshConversations]);

  const clearProductContext = useCallback(() => {
    setProductContext(null);
  }, []);

  // Kết nối Socket.IO toàn cục lắng nghe tin nhắn real-time
  useEffect(() => {
    if (!currentUserId) return;

    let isSubscribed = true;

    // Lần đầu tải danh sách bất đồng bộ
    getConversationsApi()
      .then((data) => {
        if (!isSubscribed || !Array.isArray(data)) return;

        const mapped: ConversationItem[] = data.map((c) => {
          if (!c?._id) return c;
          const senderIdStr =
            typeof c.lastMessage?.senderId === "object"
              ? c.lastMessage?.senderId?._id?.toString()
              : c.lastMessage?.senderId?.toString();

          const isFromOther = senderIdStr && senderIdStr !== currentUserId;
          const lastReadTime = localStorage.getItem(`customer_chat_read_${c._id}`);
          const msgTime = c.lastMessage?.createdAt
            ? new Date(c.lastMessage.createdAt).getTime()
            : 0;

          let unread = 0;
          if (isFromOther) {
            if (!lastReadTime || msgTime > parseInt(lastReadTime, 10)) {
              unread = 1;
            }
          }

          return {
            ...c,
            unreadCount: unread,
          };
        });

        setConversations(mapped);
      })
      .catch(() => {});

    const socket = getSocket();

    const handleNewMessage = (msg: ChatMessageItem) => {
      const senderIdStr =
        typeof msg.senderId === "object" ? String(msg.senderId._id) : String(msg.senderId);
      const senderRole =
        typeof msg.senderId === "object" ? msg.senderId.role : undefined;
      const isFromShop =
        senderRole === "SHOP_OWNER" || String(senderIdStr) !== String(currentUserId);

      const currentActive = activeConvRef.current;
      const isCurrentConversation =
        currentActive && String(currentActive._id) === String(msg.conversationId);

      // Nếu đang mở đúng conversation đó
      if (isCurrentConversation) {
        setMessages((prev) => {
          const msgIdStr = String(msg._id);
          const clientMsgIdStr = msg.clientMsgId ? String(msg.clientMsgId) : "";

          if (prev.some((m) => String(m._id) === msgIdStr)) return prev;

          if (clientMsgIdStr && prev.some((m) => String(m._id) === clientMsgIdStr)) {
            return prev.map((m) => (String(m._id) === clientMsgIdStr ? msg : m));
          }

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

        if (isOpenRef.current) {
          localStorage.setItem(`customer_chat_read_${msg.conversationId}`, Date.now().toString());
        }
      }

      // Cập nhật lastMessage và unreadCount trong danh sách conversations
      setConversations((prev) => {
        let found = false;
        const nextList = prev.map((c) => {
          if (String(c._id) === String(msg.conversationId)) {
            found = true;
            const isUnread =
              isFromShop && (!isOpenRef.current || !isCurrentConversation);
            return {
              ...c,
              lastMessage: {
                text: msg.text,
                senderId: msg.senderId,
                imageUrl: msg.imageUrl,
                createdAt: msg.createdAt,
              },
              unreadCount: isUnread ? (c.unreadCount || 0) + 1 : 0,
              updatedAt: msg.createdAt || new Date().toISOString(),
            };
          }
          return c;
        });

        if (!found) {
          refreshConversations();
          return prev;
        }

        return nextList.sort(
          (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
      });
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

    const handleConversationUpdated = (updatedConv: ConversationItem) => {
      setConversations((prev) => {
        const idx = prev.findIndex((c) => c._id === updatedConv._id);
        if (idx !== -1) {
          const clone = [...prev];
          const existing = clone[idx];
          const hasValidNewParticipants =
            Array.isArray(updatedConv.participants) &&
            updatedConv.participants.some(
              (p) => typeof p === "object" && Boolean((p as { fullName?: string }).fullName)
            );

          clone[idx] = {
            ...existing,
            ...updatedConv,
            participants: hasValidNewParticipants
              ? updatedConv.participants
              : existing.participants,
          };
          return clone;
        }
        return [updatedConv, ...prev];
      });
    };

    const handleConversationDeleted = (data: { conversationId: string }) => {
      setConversations((prev) => prev.filter((c) => String(c._id) !== String(data.conversationId)));
      if (activeConvRef.current && String(activeConvRef.current._id) === String(data.conversationId)) {
        setActiveConversation(null);
        setMessages([]);
      }
    };

    socket.on("new_message", handleNewMessage);
    socket.on("conversation_updated", handleConversationUpdated);
    socket.on("user_typing", handleUserTyping);
    socket.on("user_stop_typing", handleUserStopTyping);
    socket.on("conversation_deleted", handleConversationDeleted);

    return () => {
      isSubscribed = false;
      socket.off("new_message", handleNewMessage);
      socket.off("conversation_updated", handleConversationUpdated);
      socket.off("user_typing", handleUserTyping);
      socket.off("user_stop_typing", handleUserStopTyping);
      socket.off("conversation_deleted", handleConversationDeleted);
    };
  }, [currentUserId, refreshConversations]);

  const sendMessage = useCallback(
    async (text: string, imageUrl?: string) => {
      if (!activeConversation || !text.trim()) return;

      const clientMsgId = `temp-${Date.now()}`;
      const optimisticMsg: ChatMessageItem = {
        _id: clientMsgId,
        conversationId: activeConversation._id,
        senderId: {
          _id: currentUserId,
          fullName: user?.fullName || "Khách hàng",
          role: "USER",
          avatarUrl: user?.avatarUrl,
        },
        text: text.trim(),
        imageUrl: imageUrl || null,
        clientMsgId,
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, optimisticMsg]);

      // Khi người dùng gửi tin nhắn, đánh dấu đã đọc và xóa số badge chưa đọc ngay lập tức
      localStorage.setItem(`customer_chat_read_${activeConversation._id}`, Date.now().toString());
      setConversations((prev) =>
        prev.map((c) =>
          String(c._id) === String(activeConversation._id)
            ? {
                ...c,
                unreadCount: 0,
                lastMessage: {
                  text: text.trim(),
                  senderId: currentUserId,
                  imageUrl: imageUrl || null,
                  createdAt: new Date().toISOString(),
                },
                updatedAt: new Date().toISOString(),
              }
            : c
        )
      );

      const socket = getSocket();
      socket.emit("stop_typing", { conversationId: activeConversation._id });

      try {
        if (socket.connected) {
          const currentToken = localStorage.getItem("token") || localStorage.getItem("accessToken") || "";
          socket.emit(
            "send_message",
            {
              conversationId: activeConversation._id,
              text: text.trim(),
              imageUrl,
              clientMsgId,
              token: currentToken,
            },
            (ack: { success?: boolean; data?: ChatMessageItem; message?: ChatMessageItem }) => {
              const returnedMsg = ack?.data || ack?.message;
              if (ack?.success && returnedMsg) {
                setMessages((prev) =>
                  prev.map((m) => (m._id === clientMsgId ? returnedMsg : m))
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
    [activeConversation, currentUserId, user?.fullName, user?.avatarUrl]
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

  const deleteConversation = useCallback(
    async (conversationId: string): Promise<boolean> => {
      try {
        await deleteConversationApi(conversationId);
        setConversations((prev) => prev.filter((c) => String(c._id) !== String(conversationId)));
        if (activeConvRef.current && String(activeConvRef.current._id) === String(conversationId)) {
          const socket = getSocket();
          socket.emit("leave_room", { conversationId });
          setActiveConversation(null);
          setMessages([]);
        }
        return true;
      } catch (err) {
        console.error("⚠️ [CustomerChat] Failed to delete conversation:", err);
        return false;
      }
    },
    []
  );

  const contextValue: CustomerChatContextType = {
    isOpen,
    conversations,
    activeConversation,
    messages,
    unreadTotal,
    isLoadingConversations,
    isLoadingMessages,
    isShopTyping,
    productContext,
    openChat,
    closeChat,
    selectConversation,
    sendMessage,
    sendTyping,
    deleteConversation,
    clearProductContext,
    refreshConversations,
  };

  return (
    <CustomerChatContext.Provider value={contextValue}>
      {children}
    </CustomerChatContext.Provider>
  );
};
