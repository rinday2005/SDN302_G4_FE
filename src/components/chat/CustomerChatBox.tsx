import React, { useState, useRef, useEffect, useMemo } from "react";
import { useCustomerChat } from "../../context/customer-chat-context";
import { useAuth } from "../../hooks/useAuth";
import type { ConversationItem } from "../../services/chat.api";

export const CustomerChatBox: React.FC = () => {
  const {
    isOpen,
    conversations,
    activeConversation,
    messages,
    isLoadingConversations,
    isLoadingMessages,
    isShopTyping,
    productContext,
    closeChat,
    selectConversation,
    sendMessage,
    sendTyping,
    deleteConversation,
    clearProductContext,
  } = useCustomerChat();

  const { user } = useAuth();
  const currentUserId = user?._id || user?.id || "";

  const [inputVal, setInputVal] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<ConversationItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Xác nhận xóa hội thoại
  const handleConfirmDelete = async () => {
    if (!conversationToDelete) return;
    setIsDeleting(true);
    try {
      const ok = await deleteConversation(conversationToDelete._id);
      if (ok) {
        setShowDeleteModal(false);
        setConversationToDelete(null);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  // Auto scroll to bottom
  useEffect(() => {
    if (activeConversation) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, activeConversation, isShopTyping]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = inputVal.trim();
    if (!text) return;

    setInputVal("");
    sendTyping(false);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    await sendMessage(text);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputVal(e.target.value);
    sendTyping(true);

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      sendTyping(false);
    }, 1500);
  };

  const handleSendProductInquiry = async () => {
    if (!productContext) return;
    const inquiryText = `Xin chào Shop! Tôi đang quan tâm đến sản phẩm: "${productContext.title}". Shop tư vấn giúp tôi nhé!`;
    await sendMessage(inquiryText, productContext.image);
    clearProductContext();
  };

  // Lọc danh sách Shop theo ô tìm kiếm
  const filteredConversations = conversations.filter((c) => {
    if (!searchTerm.trim()) return true;
    const shopParticipant =
      c.participants?.find((p) => String(p._id) !== String(currentUserId)) ||
      c.participants?.[0];
    const shopName =
      shopParticipant?.shopProfile?.shopName || shopParticipant?.fullName || "";
    return shopName.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // 1. Xác định Shop participant và Customer participant trong cuộc trò chuyện
  const activeShopParticipant = useMemo(() => {
    const parts = activeConversation?.participants || [];
    if (currentUserId) {
      const byNotMe = parts.find((p) => {
        const idStr = typeof p === "object" ? String(p._id) : String(p);
        return idStr !== String(currentUserId);
      });
      if (byNotMe) return byNotMe;
    }

    const byRole = parts.find((p) => typeof p === "object" && p.role === "SHOP_OWNER");
    if (byRole) return byRole;

    const byProfile = parts.find((p) => typeof p === "object" && Boolean(p.shopProfile?.shopName));
    if (byProfile) return byProfile;

    return parts[1] || parts[0];
  }, [activeConversation, currentUserId]);

  const activeShopIdStr = activeShopParticipant
    ? String(typeof activeShopParticipant === "object" ? activeShopParticipant._id : activeShopParticipant)
    : "";

  const activeShopName =
    activeShopParticipant?.shopProfile?.shopName ||
    activeShopParticipant?.fullName ||
    "Cửa hàng";

  const activeShopAvatar =
    activeShopParticipant?.avatarUrl ||
    activeShopParticipant?.shopProfile?.avatarUrl ||
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150";

  // Chỉ hiển thị banner sản phẩm nếu sản phẩm đó thuộc đúng Shop hiện tại
  const shouldShowProductBanner = Boolean(
    productContext &&
    activeShopIdStr &&
    (!productContext.shopId || String(productContext.shopId) === activeShopIdStr)
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden font-sans">
      {/* 1. BACKDROP */}
      <div
        onClick={closeChat}
        className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity animate-fade-in"
      />

      {/* 2. DRAWER CONTAINER (Slide in from right) */}
      <div className="absolute inset-y-0 right-0 w-full sm:w-[540px] md:w-[700px] lg:w-[800px] max-w-full flex h-full">
        <div className="w-full h-full bg-[#fdf9f2] shadow-2xl flex flex-col border-l border-[#dddad3] animate-slide-left overflow-hidden">
          
          {/* HEADER CHÍNH CỦA DRAWER */}
          <div className="bg-[#f5efe6] px-5 py-3.5 border-b border-[#dddad3] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#141310] text-[#fdf9f2] flex items-center justify-center shadow-xs">
                <span className="material-symbols-outlined text-[20px]">chat</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-serif text-lg font-bold text-[#141310]">
                    Trò Chuyện Cùng Cửa Hàng
                  </h2>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                    Socket.IO Live
                  </span>
                </div>
                <p className="text-xs text-[#78716c]">
                  Kênh giao tiếp trực tiếp của bạn với các Shop trên hệ thống ReUse
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={closeChat}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[#57534e] hover:text-[#141310] hover:bg-[#ebe6dc] border border-[#dddad3] text-xs font-semibold transition-all cursor-pointer"
              title="Đóng chat"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
              <span className="hidden sm:inline">Đóng chat</span>
            </button>
          </div>

          {/* KHUNG GIAO DIỆN 2 CỘT */}
          <div className="flex-1 flex overflow-hidden min-h-0">
            
            {/* CỘT TRÁI: DANH SÁCH CÁC SHOP (Ẩn trên mobile khi đang xem tin nhắn) */}
            <div
              className={`w-full md:w-80 border-r border-[#dddad3] bg-[#faf6ee] flex flex-col shrink-0 ${
                activeConversation ? "hidden md:flex" : "flex"
              }`}
            >
              {/* Thanh tìm kiếm Shop */}
              <div className="p-3 border-b border-[#dddad3] bg-white/60">
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-2.5 top-2.5 text-[18px] text-[#a8a29e]">
                    search
                  </span>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Tìm kiếm Shop..."
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#f4f0ea] border border-[#e5e0d8] rounded-xl focus:outline-none focus:border-[#141310] transition-colors placeholder:text-[#a8a29e]"
                  />
                </div>
              </div>

              {/* Danh sách các cuộc trò chuyện với Shop */}
              <div className="flex-1 overflow-y-auto divide-y divide-[#f1ede4]">
                {isLoadingConversations && conversations.length === 0 ? (
                  <div className="p-8 text-center text-xs text-[#78716c]">
                    <span className="material-symbols-outlined animate-spin text-[24px] mb-2 text-[#a8a29e]">
                      progress_activity
                    </span>
                    <p>Đang tải danh sách Shop...</p>
                  </div>
                ) : filteredConversations.length === 0 ? (
                  <div className="p-8 text-center text-xs text-[#78716c] flex flex-col items-center justify-center">
                    <span className="material-symbols-outlined text-[36px] text-[#a8a29e] mb-2">
                      forum
                    </span>
                    <p className="font-semibold text-[#141310] mb-1">Chưa có cuộc trò chuyện nào</p>
                    <p className="text-[11px] text-[#78716c]">
                      Bấm &quot;Chat với Shop Owner&quot; từ trang sản phẩm bất kỳ để bắt đầu!
                    </p>
                  </div>
                ) : (
                  filteredConversations.map((conv) => {
                    const shopP =
                      conv.participants?.find((p) => String(p._id) !== String(currentUserId)) ||
                      conv.participants?.[0];

                    const shopName =
                      shopP?.shopProfile?.shopName || shopP?.fullName || "Cửa hàng ReUse";

                    const shopAvatar =
                      shopP?.avatarUrl ||
                      shopP?.shopProfile?.avatarUrl ||
                      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150";

                    const isSelected = activeConversation?._id === conv._id;
                    const unread = conv.unreadCount || 0;

                    return (
                      <div
                        key={conv._id}
                        role="button"
                        tabIndex={0}
                        onClick={() => {
                          if (activeConversation?._id !== conv._id) {
                            clearProductContext();
                          }
                          selectConversation(conv);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            if (activeConversation?._id !== conv._id) {
                              clearProductContext();
                            }
                            selectConversation(conv);
                          }
                        }}
                        className={`group w-full p-3.5 text-left flex items-start gap-3 transition-colors cursor-pointer relative select-none ${
                          isSelected
                            ? "bg-[#ede8de] border-l-4 border-[#141310]"
                            : "hover:bg-[#f3ede3] bg-[#faf6ee]"
                        }`}
                      >
                        <div className="relative shrink-0">
                          <img
                            src={shopAvatar}
                            alt={shopName}
                            className="w-10 h-10 rounded-full object-cover border border-[#dddad3]"
                          />
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white absolute bottom-0 right-0" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1 mb-0.5">
                            <span className="text-xs font-bold text-[#141310] truncate">
                              {shopName}
                            </span>
                            <span className="text-[10px] text-[#78716c] shrink-0 font-mono">
                              {conv.lastMessage?.createdAt
                                ? new Date(conv.lastMessage.createdAt).toLocaleTimeString("vi-VN", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })
                                : ""}
                            </span>
                          </div>

                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs text-[#78716c] truncate line-clamp-1 flex-1">
                              {conv.lastMessage?.text || "Chưa có tin nhắn"}
                            </p>
                            <div className="flex items-center gap-1 shrink-0">
                              {unread > 0 && (
                                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-rose-600 text-white animate-pulse">
                                  {unread}
                                </span>
                              )}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setConversationToDelete(conv);
                                  setShowDeleteModal(true);
                                }}
                                className="opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto p-1.5 rounded-md text-[#a8a29e] hover:text-rose-600 hover:bg-rose-100/70 transition-all cursor-pointer"
                                title="Xóa cuộc trò chuyện này"
                              >
                                <span className="material-symbols-outlined text-[16px] block">delete</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* CỘT PHẢI: KHUNG CHAT VỚI SHOP ĐANG CHỌN */}
            <div
              className={`flex-1 flex flex-col bg-[#fdf9f2] min-w-0 min-h-0 overflow-hidden ${
                !activeConversation ? "hidden md:flex items-center justify-center" : "flex"
              }`}
            >
              {!activeConversation ? (
                <div className="text-center p-8 text-[#78716c]">
                  <span className="material-symbols-outlined text-[48px] text-[#a8a29e] mb-3">
                    chat_bubble_outline
                  </span>
                  <h3 className="font-serif font-bold text-base text-[#141310] mb-1">
                    Chọn một Cửa Hàng để xem tin nhắn
                  </h3>
                  <p className="text-xs max-w-sm mx-auto">
                    Bạn có thể chọn cửa hàng từ danh sách bên trái hoặc bấm chat từ trang sản phẩm bất kỳ.
                  </p>
                </div>
              ) : (
                <>
                  {/* Shop Header Bar */}
                  <div className="p-3.5 bg-white border-b border-[#dddad3] flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                      {/* Nút quay lại trên Mobile */}
                      <button
                        type="button"
                        onClick={() => selectConversation(null as unknown as typeof activeConversation)}
                        className="md:hidden p-1.5 rounded-lg hover:bg-[#f4f0ea] text-[#141310] transition-colors"
                        title="Quay lại danh sách"
                      >
                        <span className="material-symbols-outlined text-[20px]">arrow_back</span>
                      </button>

                      <div className="relative">
                        <img
                          src={activeShopAvatar}
                          alt={activeShopName}
                          className="w-10 h-10 rounded-full object-cover border border-[#dddad3]"
                        />
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white absolute bottom-0 right-0" />
                      </div>

                      <div>
                        <h3 className="font-serif font-bold text-sm text-[#141310] line-clamp-1">
                          {activeShopName}
                        </h3>
                        <p className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                          Shop trực tuyến • Phản hồi nhanh
                        </p>
                      </div>
                    </div>

                    {/* Nút xóa chat trên Header */}
                    <button
                      type="button"
                      onClick={() => {
                        setConversationToDelete(activeConversation);
                        setShowDeleteModal(true);
                      }}
                      className="p-1.5 rounded-lg text-[#78716c] hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-all cursor-pointer flex items-center justify-center"
                      title="Xóa cuộc trò chuyện này"
                    >
                      <span className="material-symbols-outlined text-[20px]">delete</span>
                    </button>
                  </div>

                  {/* Pinned Product Banner (Nếu có và đúng là Shop của sản phẩm) */}
                  {shouldShowProductBanner && productContext && (
                    <div className="bg-[#f0ebe1] px-4 py-2.5 border-b border-[#dddad3] flex items-center justify-between gap-2 shrink-0 animate-fade-in">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {productContext.image && (
                          <img
                            src={productContext.image}
                            alt={productContext.title}
                            className="w-10 h-10 rounded-lg object-cover border border-[#dddad3] shrink-0"
                          />
                        )}
                        <div className="min-w-0">
                          <p className="text-[10px] text-[#78716c] font-semibold uppercase tracking-wider">
                            Đang xem sản phẩm của Shop
                          </p>
                          <h4 className="text-xs font-bold text-[#141310] truncate">
                            {productContext.title}
                          </h4>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={handleSendProductInquiry}
                          className="px-2.5 py-1 rounded-lg bg-[#141310] text-white text-[10px] font-bold uppercase tracking-wider hover:bg-[#333] transition-colors cursor-pointer"
                        >
                          Hỏi Shop
                        </button>
                        <button
                          type="button"
                          onClick={clearProductContext}
                          className="p-1 rounded-md text-[#78716c] hover:text-[#141310] transition-colors"
                          title="Ẩn"
                        >
                          <span className="material-symbols-outlined text-[16px]">close</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Danh sách tin nhắn */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#fdf9f2] min-h-0">
                    {isLoadingMessages ? (
                      <div className="flex items-center justify-center py-8 text-xs text-[#78716c] gap-2">
                        <span className="material-symbols-outlined animate-spin text-[18px]">
                          progress_activity
                        </span>
                        Đang đồng bộ tin nhắn...
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="text-center py-10 px-4 space-y-2">
                        <div className="w-12 h-12 rounded-full bg-[#f4f0ea] flex items-center justify-center mx-auto text-[#78716c]">
                          <span className="material-symbols-outlined text-[24px]">
                            chat_bubble_outline
                          </span>
                        </div>
                        <p className="font-serif font-bold text-sm text-[#141310]">
                          Bắt đầu trò chuyện với {activeShopName}
                        </p>
                        <p className="text-xs text-[#78716c] max-w-xs mx-auto">
                          Gửi câu hỏi về tình trạng máy, kiểm định, hợp đồng thuê hoặc trao đổi mua bán!
                        </p>
                      </div>
                    ) : (
                      messages.map((m) => {
                        const senderIdStr =
                          typeof m.senderId === "object"
                            ? String(m.senderId._id)
                            : String(m.senderId);

                        const senderRole =
                          typeof m.senderId === "object" ? m.senderId.role : undefined;

                        // Phía Customer: Tin là của SHOP nếu senderRole là SHOP_OWNER, senderId là 'shop_owner', trùng với activeShopIdStr, HOẶC khác với currentUserId
                        const isShopSender =
                          senderRole === "SHOP_OWNER" ||
                          senderIdStr === "shop_owner" ||
                          (Boolean(activeShopIdStr) && senderIdStr === activeShopIdStr) ||
                          (Boolean(currentUserId) && senderIdStr !== String(currentUserId));

                        // Ở phía màn hình Customer: Tin của Customer (Me) là tin KHÔNG PHẢI của Shop
                        const isMe = !isShopSender;

                        return (
                          <div
                            key={m._id}
                            className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                          >
                            <div className="flex items-end gap-2 max-w-[85%]">
                              {!isMe && (
                                <img
                                  src={activeShopAvatar}
                                  alt={activeShopName}
                                  className="w-7 h-7 rounded-full object-cover shrink-0 mb-1 border border-[#dddad3]"
                                />
                              )}
                              <div
                                className={`rounded-2xl p-3 text-xs leading-relaxed shadow-xs ${
                                  isMe
                                    ? "bg-[#141310] text-white rounded-br-xs"
                                    : "bg-white text-[#141310] border border-[#e5e0d8] rounded-bl-xs"
                                }`}
                              >
                                {m.imageUrl && (
                                  <img
                                    src={m.imageUrl}
                                    alt="Đính kèm"
                                    className="rounded-xl max-h-48 w-auto object-cover mb-2 border border-black/10"
                                  />
                                )}
                                <p className="whitespace-pre-wrap break-words">{m.text}</p>
                              </div>
                            </div>

                            <span
                              className={`text-[10px] text-[#a8a29e] mt-1 px-1 ${
                                !isMe ? "ml-9" : ""
                              }`}
                            >
                              {m.createdAt
                                ? new Date(m.createdAt).toLocaleTimeString("vi-VN", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })
                                : "Vừa xong"}
                            </span>
                          </div>
                        );
                      })
                    )}

                    {/* Typing indicator */}
                    {isShopTyping && (
                      <div className="flex items-center gap-2 text-xs text-[#78716c] italic animate-fade-in">
                        <span className="w-2 h-2 rounded-full bg-[#78716c] animate-bounce" />
                        <span className="w-2 h-2 rounded-full bg-[#78716c] animate-bounce delay-100" />
                        <span className="w-2 h-2 rounded-full bg-[#78716c] animate-bounce delay-200" />
                        <span>{activeShopName} đang soạn tin nhắn...</span>
                      </div>
                    )}

                    <div ref={messagesEndRef} />
                  </div>

                  {/* Thanh soạn tin nhắn */}
                  <form
                    onSubmit={handleSend}
                    className="p-3 bg-white border-t border-[#dddad3] flex items-center gap-2 shrink-0"
                  >
                    <input
                      type="text"
                      value={inputVal}
                      onChange={handleInputChange}
                      placeholder={`Nhắn tin cho ${activeShopName}...`}
                      className="flex-1 bg-[#f7f5f0] border border-[#e5e0d8] focus:border-[#141310] focus:bg-white text-xs text-[#141310] rounded-xl px-3.5 py-2.5 outline-none transition-all placeholder:text-[#a8a29e]"
                    />

                    <button
                      type="submit"
                      disabled={!inputVal.trim()}
                      className="p-2.5 rounded-xl bg-[#141310] text-white hover:bg-black disabled:opacity-30 disabled:hover:bg-[#141310] transition-all cursor-pointer flex items-center justify-center shrink-0 shadow-xs"
                      title="Gửi tin nhắn"
                    >
                      <span className="material-symbols-outlined text-[18px]">send</span>
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MODAL XÁC NHẬN XÓA CUỘC TRÒ CHUYỆN */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-[#fdf9f2] rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#dddad3] space-y-4">
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 border border-rose-200">
                <span className="material-symbols-outlined text-[26px]">delete_forever</span>
              </div>
              <div>
                <h3 className="text-base font-bold text-[#141310]">
                  Xác nhận xóa cuộc trò chuyện?
                </h3>
                <p className="text-xs text-[#78716c] mt-1.5 leading-relaxed">
                  Bạn có chắc chắn muốn xóa toàn bộ lịch sử tin nhắn với Shop này không? Thao tác này sẽ xóa vĩnh viễn và{" "}
                  <span className="font-semibold text-rose-600">không thể khôi phục</span>.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#dddad3]">
              {/* Nút Hủy */}
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => {
                  setShowDeleteModal(false);
                  setConversationToDelete(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-[#57534e] hover:text-[#141310] bg-[#ebe6dc] hover:bg-[#dddad3] transition-colors cursor-pointer disabled:opacity-50"
              >
                Hủy
              </button>

              {/* Nút Xóa */}
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition-colors shadow-xs cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Đang xóa...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[16px]">delete</span>
                    <span>Xóa</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
