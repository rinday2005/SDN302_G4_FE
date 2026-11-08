import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { getSocket } from "../services/socket";
import {
  getConversationsApi,
  getMessagesApi,
  sendMessageApi,
  deleteConversationApi,
} from "../services/chat.api";
import type {
  ConversationItem,
  ChatMessageItem,
} from "../services/chat.api";
import { useAuth } from "../hooks/useAuth";
import { ShopChatContext } from "./shop-chat-context";

export const ShopChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const currentUserId = user?._id || user?.id || "";

  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"RENT" | "THRIFT">("RENT");
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [activeConversation, setActiveConversation] = useState<ConversationItem | null>(null);
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [isCustomerTyping, setIsCustomerTyping] = useState(false);
  const [isLoadingConversations] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  const activeConvRef = useRef<ConversationItem | null>(null);
  useEffect(() => {
    activeConvRef.current = activeConversation;
  }, [activeConversation]);

  // Tải danh sách cuộc trò chuyện THẬT từ MongoDB
  const refreshConversations = useCallback(async () => {
    try {
      const data = await getConversationsApi();
      if (Array.isArray(data)) {
        const uniqueMap = new Map<string, ConversationItem>();
        data.forEach((c) => {
          if (c?._id) {
            const senderIdStr =
              typeof c.lastMessage?.senderId === "object"
                ? c.lastMessage?.senderId?._id?.toString()
                : c.lastMessage?.senderId?.toString();
            // Khách gửi tin nhắn và Shop chưa mở xem -> tính là 1 người có tin chưa đọc
            const isFromOther = senderIdStr && String(senderIdStr) !== String(currentUserId);
            const isCurrent = activeConvRef.current && String(activeConvRef.current._id) === String(c._id);
            // Nếu là tin do Shop gửi (isFromOther === false) hoặc đang mở phòng chat này -> unreadCount = 0
            const initialUnread = (isCurrent || !isFromOther) ? 0 : 1;
            uniqueMap.set(String(c._id), {
              ...c,
              unreadCount: initialUnread,
            });
          }
        });
        setConversations(Array.from(uniqueMap.values()));
      }
    } catch (err) {
      console.warn("⚠️ [ShopChat] Could not load conversations from server:", err);
    }
  }, [currentUserId]);

  // Kết nối Socket.IO toàn cục lắng nghe tin nhắn real-time
  useEffect(() => {
    let isSubscribed = true;
    getConversationsApi()
      .then((data) => {
        if (!isSubscribed) return;
        if (Array.isArray(data)) {
          const uniqueMap = new Map<string, ConversationItem>();
          data.forEach((c) => {
            if (c?._id) {
              const senderIdStr =
                typeof c.lastMessage?.senderId === "object"
                  ? c.lastMessage?.senderId?._id?.toString()
                  : c.lastMessage?.senderId?.toString();
              const isFromOther = senderIdStr && String(senderIdStr) !== String(currentUserId);
              const isCurrent = activeConvRef.current && String(activeConvRef.current._id) === String(c._id);
              const initialUnread = (isCurrent || !isFromOther) ? 0 : 1;
              uniqueMap.set(String(c._id), {
                ...c,
                unreadCount: initialUnread,
              });
            }
          });
          setConversations(Array.from(uniqueMap.values()));
        }
      })
      .catch((err) => {
        console.warn("⚠️ [ShopChat] Could not load conversations from server:", err);
      });

    const socket = getSocket();

    const handleNewMessage = (msg: ChatMessageItem & { serviceType?: "RENT" | "THRIFT" }) => {
      console.log("📨 [ShopChat] Real-time message received:", msg);

      const msgService = msg.serviceType || "RENT";
      const rawMsgConvId = String(msg.conversationId).replace(/_(RENT|THRIFT)$/, "");

      const currentActive = activeConvRef.current;
      const rawCurrentId = currentActive?._id ? String(currentActive._id).replace(/_(RENT|THRIFT)$/, "") : "";
      const isCurrentConv = currentActive && rawCurrentId === rawMsgConvId;
      const isMatchService = (currentActive?.serviceType || "RENT") === msgService;
      const isCurrentRoom = isCurrentConv && isMatchService;

      if (isCurrentRoom) {
        setMessages((prev) => {
          const msgIdStr = String(msg._id);
          const clientMsgIdStr = msg.clientMsgId ? String(msg.clientMsgId) : "";

          // 1. Đã có trong danh sách -> Bỏ qua
          if (prev.some((m) => String(m._id) === msgIdStr)) return prev;

          // 2. Trùng clientMsgId với tin optimistic -> Thay thế
          if (clientMsgIdStr && prev.some((m) => String(m._id) === clientMsgIdStr)) {
            return prev.map((m) => (String(m._id) === clientMsgIdStr ? msg : m));
          }

          // 3. Nếu là tin nhắn của chính mình và có tin tạm cùng text -> Thay thế
          const senderIdStr = typeof msg.senderId === "object" ? String(msg.senderId._id) : String(msg.senderId);
          if (senderIdStr === String(currentUserId)) {
            const tempIndex = prev.findIndex((m) => String(m._id).startsWith("temp-") && m.text === msg.text);
            if (tempIndex !== -1) {
              const clone = [...prev];
              clone[tempIndex] = msg;
              return clone;
            }
          }

          // 4. Tin nhắn từ người khác -> Thêm mới
          return [...prev, msg];
        });
      }

      // Cập nhật conversation list và unread badge chính xác theo từng tab RENT / THRIFT
      setConversations((prev) => {
        let found = false;
        const senderIdStr = typeof msg.senderId === "object" ? String(msg.senderId._id) : String(msg.senderId);
        const isFromOther = senderIdStr !== String(currentUserId);

        const updated = prev.map((c) => {
          const rawCId = (c.rawConversationId || String(c._id)).replace(/_(RENT|THRIFT)$/, "");
          const cService = c.serviceType || "RENT";

          if (rawCId === rawMsgConvId && cService === msgService) {
            found = true;
            return {
              ...c,
              serviceType: msgService,
              lastMessage: {
                text: msg.text || (msg.imageUrl ? "[Hình ảnh]" : ""),
                senderId: msg.senderId,
                imageUrl: msg.imageUrl,
                createdAt: msg.createdAt,
              },
              // Nếu đang mở đúng phòng chat này thì unreadCount = 0, ngược lại tăng số tin chưa đọc của người này
              unreadCount: isCurrentRoom ? 0 : (c.unreadCount || 0) + (isFromOther ? 1 : 0),
              updatedAt: msg.createdAt || new Date().toISOString(),
            };
          }
          return c;
        });

        if (!found) {
          // Thêm hội thoại mới vào danh sách
          const newConv: ConversationItem = {
            _id: `${rawMsgConvId}_${msgService}`,
            rawConversationId: rawMsgConvId,
            participants: [
              typeof msg.senderId === "object"
                ? msg.senderId
                : { _id: msg.senderId, fullName: "Khách hàng mới", role: "USER" },
            ],
            serviceType: msgService,
            lastMessage: {
              text: msg.text || (msg.imageUrl ? "[Hình ảnh]" : ""),
              senderId: msg.senderId,
              imageUrl: msg.imageUrl,
              createdAt: msg.createdAt,
            },
            unreadCount: isCurrentRoom ? 0 : 1,
            createdAt: msg.createdAt || new Date().toISOString(),
            updatedAt: msg.createdAt || new Date().toISOString(),
          };
          updated.unshift(newConv);
        }

        // Sắp xếp hội thoại có tin nhắn mới nhất lên đầu
        return updated.sort(
          (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
      });
    };

    const handleConversationUpdated = (updatedConv: ConversationItem) => {
      setConversations((prev) => {
        const convIdStr = String(updatedConv._id);
        const isCurrent = activeConvRef.current && String(activeConvRef.current._id) === convIdStr;
        const senderIdStr =
          typeof updatedConv.lastMessage?.senderId === "object"
            ? updatedConv.lastMessage?.senderId?._id?.toString()
            : updatedConv.lastMessage?.senderId?.toString();
        const isFromOther = senderIdStr && String(senderIdStr) !== String(currentUserId);
        const unread = (isCurrent || !isFromOther) ? 0 : 1;

        const index = prev.findIndex((c) => String(c._id) === convIdStr);
        if (index > -1) {
          const clone = [...prev];
          clone[index] = {
            ...clone[index],
            ...updatedConv,
            unreadCount: unread,
            serviceType: updatedConv.serviceType || clone[index].serviceType || "RENT",
          };
          return clone.sort(
            (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          );
        }
        return [
          {
            ...updatedConv,
            unreadCount: unread,
            serviceType: updatedConv.serviceType || "RENT",
          },
          ...prev,
        ];
      });
    };

    const handleUserTyping = (data: { conversationId: string; userId: string; fullName?: string }) => {
      if (activeConvRef.current && activeConvRef.current._id === data.conversationId) {
        if (data.userId !== currentUserId) {
          setIsCustomerTyping(true);
        }
      }
    };

    const handleUserStopTyping = (data: { conversationId: string }) => {
      if (activeConvRef.current && activeConvRef.current._id === data.conversationId) {
        setIsCustomerTyping(false);
      }
    };

    const handleConversationDeleted = (data: { conversationId: string }) => {
      setConversations((prev) => prev.filter((c) => c._id !== data.conversationId));
      if (activeConvRef.current && activeConvRef.current._id === data.conversationId) {
        setActiveConversation(null);
        setMessages([]);
      }
    };

    socket.on("new_message", handleNewMessage);
    socket.on("conversation_updated", handleConversationUpdated);
    socket.on("user_typing", handleUserTyping);
    socket.on("user_stop_typing", handleUserStopTyping);
    socket.on("conversation_deleted", handleConversationDeleted);

    // Polling dự phòng mỗi 5s để đảm bảo badge luôn đồng bộ tuyệt đối
    const pollInterval = setInterval(() => {
      refreshConversations();
    }, 5000);

    return () => {
      isSubscribed = false;
      clearInterval(pollInterval);
      socket.off("new_message", handleNewMessage);
      socket.off("conversation_updated", handleConversationUpdated);
      socket.off("user_typing", handleUserTyping);
      socket.off("user_stop_typing", handleUserStopTyping);
      socket.off("conversation_deleted", handleConversationDeleted);
    };
  }, [currentUserId, refreshConversations]);

  // Tính số lượng NGƯỜI CHAT (số khách hàng gửi tin nhắn chưa đọc) theo từng Tab và Tổng cộng
  const { unreadRent, unreadThrift, unreadTotal } = useMemo(() => {
    let rentPeople = 0;
    let thriftPeople = 0;

    conversations.forEach((c) => {
      // Đếm theo số người chat (mỗi cuộc hội thoại có tin chưa đọc tính là 1 người)
      if ((c.unreadCount || 0) > 0) {
        if (c.serviceType === "THRIFT") {
          thriftPeople += 1;
        } else {
          rentPeople += 1;
        }
      }
    });

    return {
      unreadRent: rentPeople,
      unreadThrift: thriftPeople,
      unreadTotal: rentPeople + thriftPeople,
    };
  }, [conversations]);

  // Chuyển Tab RENT / THRIFT và đồng bộ phòng chat
  const handleSetActiveTab = (tab: "RENT" | "THRIFT") => {
    setActiveTab(tab);
    if (activeConvRef.current && (activeConvRef.current.serviceType || "RENT") !== tab) {
      const socket = getSocket();
      socket.emit("leave_room", { conversationId: activeConvRef.current._id });
      setActiveConversation(null);
      setMessages([]);
      setIsCustomerTyping(false);
    }
  };

  // Mở Drawer/Popover chat
  const openChatDrawer = (tab?: "RENT" | "THRIFT", conversationId?: string) => {
    if (tab) {
      handleSetActiveTab(tab);
    }
    setIsOpen(true);

    if (conversationId) {
      const found = conversations.find((c) => c._id === conversationId);
      if (found) selectConversation(found);
    }
  };

  const closeChatDrawer = () => {
    const socket = getSocket();
    if (activeConversation) {
      socket.emit("leave_room", { conversationId: activeConversation._id });
    }
    setIsOpen(false);
    setActiveConversation(null);
  };

  // Chọn một hội thoại để chat chi tiết (hoặc null để đóng đoạn chat đang xem)
  const selectConversation = async (conversation: ConversationItem | null) => {
    const socket = getSocket();

    if (!conversation) {
      if (activeConversation) {
        const activeRawId = (activeConversation.rawConversationId || activeConversation._id).replace(/_(RENT|THRIFT)$/, "");
        socket.emit("leave_room", { conversationId: activeRawId });
      }
      setActiveConversation(null);
      setMessages([]);
      setIsCustomerTyping(false);
      return;
    }

    // Đảm bảo Tab dịch vụ đồng bộ với cuộc trò chuyện được chọn
    const convTab = conversation.serviceType === "THRIFT" ? "THRIFT" : "RENT";
    if (convTab !== activeTab) {
      setActiveTab(convTab);
    }

    const rawId = (conversation.rawConversationId || conversation._id).replace(/_(RENT|THRIFT)$/, "");

    // Rời room cũ nếu có
    if (activeConversation && activeConversation._id !== conversation._id) {
      const activeRawId = (activeConversation.rawConversationId || activeConversation._id).replace(/_(RENT|THRIFT)$/, "");
      socket.emit("leave_room", { conversationId: activeRawId });
    }

    setActiveConversation(conversation);
    setIsCustomerTyping(false);

    // Xóa unread count của cuộc trò chuyện này (giảm số người chưa đọc đi 1)
    setConversations((prev) =>
      prev.map((c) => (String(c._id) === String(conversation._id) ? { ...c, unreadCount: 0 } : c))
    );

    // Tham gia room qua Socket
    socket.emit("join_room", { conversationId: rawId });

    // Tải tin nhắn chi tiết THẬT từ MongoDB (lọc theo serviceType của tab này)
    try {
      setIsLoadingMessages(true);
      const res = await getMessagesApi(rawId, { serviceType: convTab });
      setMessages(res.messages || []);
    } catch (err) {
      console.warn("⚠️ [ShopChat] Lỗi tải tin nhắn cuộc trò chuyện:", err);
      setMessages([]);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  // Xóa một cuộc trò chuyện vĩnh viễn
  const deleteConversation = async (conversationId: string): Promise<boolean> => {
    try {
      const convToDelete = conversations.find((c) => c._id === conversationId);
      const rawId = (convToDelete?.rawConversationId || conversationId).replace(/_(RENT|THRIFT)$/, "");
      await deleteConversationApi(rawId);
      setConversations((prev) => prev.filter((c) => c._id !== conversationId && c.rawConversationId !== rawId));
      if (activeConversation && (activeConversation._id === conversationId || activeConversation.rawConversationId === rawId)) {
        const socket = getSocket();
        socket.emit("leave_room", { conversationId: rawId });
        setActiveConversation(null);
        setMessages([]);
      }
      return true;
    } catch (err) {
      console.error("⚠️ [ShopChat] Lỗi xóa cuộc trò chuyện:", err);
      return false;
    }
  };

  // Gửi tin nhắn real-time
  const sendMessage = async (text: string, imageUrl?: string) => {
    if (!activeConversation) return;

    const trimmed = text.trim();
    if (!trimmed && !imageUrl) return;

    const socket = getSocket();
    const tempId = `temp-${Date.now()}`;
    const rawId = (activeConversation.rawConversationId || activeConversation._id).replace(/_(RENT|THRIFT)$/, "");
    const targetService = activeConversation.serviceType === "THRIFT" ? "THRIFT" : "RENT";

    const newMsg: ChatMessageItem = {
      _id: tempId,
      conversationId: rawId,
      senderId: {
        _id: currentUserId || "shop_owner",
        fullName: user?.shopProfile?.shopName || user?.fullName || "Shop Owner",
        role: "SHOP_OWNER",
        avatarUrl: user?.avatarUrl,
      },
      text: trimmed,
      imageUrl: imageUrl || null,
      serviceType: targetService,
      clientMsgId: tempId,
      createdAt: new Date().toISOString(),
    };

    // Optimistic UI update
    setMessages((prev) => [...prev, newMsg]);

    // Ngay khi Shop Owner bấm gửi tin nhắn rep, xóa ngay số badge chưa đọc của cuộc trò chuyện này
    setConversations((prev) =>
      prev.map((c) =>
        String(c._id) === String(activeConversation._id)
          ? {
              ...c,
              unreadCount: 0,
              lastMessage: {
                text: trimmed || (imageUrl ? "[Hình ảnh]" : ""),
                senderId: currentUserId || "shop_owner",
                imageUrl,
                createdAt: new Date().toISOString(),
              },
              updatedAt: new Date().toISOString(),
            }
          : c
      )
    );

    if (socket.connected) {
      const currentToken = localStorage.getItem("token") || localStorage.getItem("accessToken") || "";
      // Gửi qua Socket.IO kèm clientMsgId để đối soát không bị nhân đôi
      socket.emit(
        "send_message",
        {
          conversationId: rawId,
          serviceType: targetService,
          text: trimmed,
          imageUrl,
          clientMsgId: tempId,
          token: currentToken,
        },
        (ack: { success?: boolean; data?: ChatMessageItem; message?: ChatMessageItem }) => {
          const returned = ack?.data || ack?.message;
          if (ack?.success && returned) {
            setMessages((prev) =>
              prev.map((m) =>
                m._id === tempId ? { ...returned, clientMsgId: tempId } : m
              )
            );
            setConversations((prev) =>
              prev.map((c) =>
                String(c._id) === String(activeConversation._id)
                  ? { ...c, unreadCount: 0 }
                  : c
              )
            );
          }
        }
      );
    } else {
      // Fallback qua HTTP API khi mất kết nối Socket
      try {
        const saved = await sendMessageApi(rawId, { text: trimmed, imageUrl, serviceType: targetService });
        setMessages((prev) =>
          prev.map((m) => (m._id === tempId ? saved : m))
        );
        setConversations((prev) =>
          prev.map((c) =>
            String(c._id) === String(activeConversation._id)
              ? { ...c, unreadCount: 0 }
              : c
          )
        );
      } catch (err) {
        console.warn("⚠️ [ShopChat] HTTP API fallback send notice:", err);
      }
    }
  };

  // Gửi trạng thái đang gõ
  const sendTyping = (typing: boolean) => {
    if (!activeConversation) return;
    const socket = getSocket();
    const rawId = (activeConversation.rawConversationId || activeConversation._id).replace(/_(RENT|THRIFT)$/, "");
    socket.emit(typing ? "typing" : "stop_typing", {
      conversationId: rawId,
    });
  };

  return (
    <ShopChatContext.Provider
      value={{
        isOpen,
        activeTab,
        conversations,
        activeConversation,
        messages,
        unreadTotal,
        unreadRent,
        unreadThrift,
        isCustomerTyping,
        isLoadingConversations,
        isLoadingMessages,
        openChatDrawer,
        closeChatDrawer,
        setActiveTab: handleSetActiveTab,
        selectConversation,
        sendMessage,
        sendTyping,
        deleteConversation,
        refreshConversations,
      }}
    >
      {children}
    </ShopChatContext.Provider>
  );
};

export default ShopChatProvider;
