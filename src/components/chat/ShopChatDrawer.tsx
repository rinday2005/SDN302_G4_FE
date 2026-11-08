import React, { useState, useRef, useEffect } from "react";
import { useShopChat } from "../../context/shop-chat-context";
import type { ConversationItem } from "../../services/chat.api";
import { useAuth } from "../../hooks/useAuth";

export const ShopChatDrawer: React.FC = () => {
  const {
    isOpen,
    activeTab,
    conversations,
    activeConversation,
    messages,
    unreadRent,
    unreadThrift,
    isCustomerTyping,
    isLoadingMessages,
    closeChatDrawer,
    setActiveTab,
    selectConversation,
    sendMessage,
    sendTyping,
    deleteConversation,
  } = useShopChat();

  const { user } = useAuth();
  const currentUserId = user?._id || user?.id || "";

  const [inputVal, setInputVal] = useState("");
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

  // Lọc danh sách hội thoại theo Tab RENT hoặc THRIFT
  const filteredConversations = conversations.filter(
    (c) => (c.serviceType || "RENT") === activeTab
  );

  // Tự động cuộn xuống cuối khi có tin nhắn mới
  useEffect(() => {
    if (activeConversation) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, activeConversation, isCustomerTyping]);

  // Xử lý gửi tin nhắn
  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = inputVal.trim();
    if (!text) return;

    setInputVal("");
    sendTyping(false);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    await sendMessage(text);
  };

  // Xử lý typing indicator
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputVal(e.target.value);
    sendTyping(true);

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      sendTyping(false);
    }, 1500);
  };

  if (!isOpen) return null;

  const currentCustomer = activeConversation?.participants?.find(
    (p) => String(p._id) !== String(currentUserId)
  ) || activeConversation?.participants?.[0];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden font-sans">
      {/* Backdrop */}
      <div
        onClick={closeChatDrawer}
        className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity animate-fade-in"
      />

      {/* Drawer Container (Slide in from right) */}
      <div className="absolute inset-y-0 right-0 w-full sm:w-[540px] md:w-[700px] lg:w-[800px] max-w-full flex h-full">
        <div className="w-full h-full bg-[#fdf9f2] shadow-2xl flex flex-col border-l border-[#dddad3] animate-slide-left overflow-hidden">
          
          {/* HEADER CHÍNH CỦA DRAWER */}
          <div className="bg-[#f5efe6] px-5 py-3.5 border-b border-[#dddad3] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#141310] text-[#fdf9f2] flex items-center justify-center shadow-xs">
                <span className="material-symbols-outlined text-[20px]">forum</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-serif text-lg font-bold text-[#141310]">
                    Trò Chuyện Khách Hàng Real-Time
                  </h2>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                    Socket.IO Live
                  </span>
                </div>
                <p className="text-xs text-[#78716c]">
                  Kênh giao tiếp trực tiếp của Xưởng Atelier với người sưu tầm &amp; người thuê
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={closeChatDrawer}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[#57534e] hover:text-[#141310] hover:bg-[#ebe6dc] border border-[#dddad3] text-xs font-semibold transition-all cursor-pointer"
              title="Đóng chat"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
              <span className="hidden sm:inline">Đóng chat</span>
            </button>
          </div>

          {/* TAB CHUYỂN DỊCH VỤ: RENT vs THRIFT */}
          <div className="bg-[#ebe6dc]/70 px-5 py-2 border-b border-[#dddad3] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              {/* TAB 1: RENT (Cho thuê) */}
              <button
                type="button"
                onClick={() => setActiveTab("RENT")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  activeTab === "RENT"
                    ? "bg-[#141310] text-white shadow-xs"
                    : "bg-[#f5efe6] text-[#57534e] hover:bg-white hover:text-[#141310]"
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">sync_alt</span>
                <span>Cho Thuê RENT</span>
                {unreadRent > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-rose-600 text-white animate-pulse">
                    {unreadRent}
                  </span>
                )}
              </button>

              {/* TAB 2: THRIFT (Thanh lý / Ký gửi) */}
              <button
                type="button"
                onClick={() => setActiveTab("THRIFT")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  activeTab === "THRIFT"
                    ? "bg-amber-800 text-white shadow-xs"
                    : "bg-[#f5efe6] text-[#57534e] hover:bg-white hover:text-[#141310]"
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">all_inclusive</span>
                <span>Bán Đứt THRIFT</span>
                {unreadThrift > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-rose-600 text-white animate-pulse">
                    {unreadThrift}
                  </span>
                )}
              </button>
            </div>

            <div className="text-[11px] text-[#78716c] font-medium hidden sm:block">
              {filteredConversations.length} cuộc trò chuyện
            </div>
          </div>

          {/* KHUNG NỘI DUNG CHÍNH (GIAO DIỆN 2 CỘT HOẶC CỘT CHI TIẾT) */}
          <div className="flex-1 flex overflow-hidden min-h-0">
            
            {/* CỘT TRÁI: DANH SÁCH KHÁCH HÀNG (Ẩn trên mobile khi đang mở chat) */}
            <div
              className={`w-full md:w-80 border-r border-[#dddad3] bg-[#faf6ee] flex flex-col shrink-0 ${
                activeConversation ? "hidden md:flex" : "flex"
              }`}
            >
              <div className="p-3 border-b border-[#dddad3] bg-white/60">
                <div className="text-[11px] font-bold text-[#78716c] uppercase tracking-wider">
                  Khách hàng liên hệ • {activeTab === "RENT" ? "Dịch vụ Thuê máy" : "Dịch vụ Mua đứt"}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto divide-y divide-[#f1ede4]">
                {filteredConversations.length === 0 ? (
                  <div className="p-8 text-center text-xs text-[#78716c] flex flex-col items-center justify-center">
                    <span className="material-symbols-outlined text-[36px] text-[#a8a29e] mb-2">
                      mark_chat_unread
                    </span>
                    <span>Chưa có hội thoại nào trong tab {activeTab}.</span>
                  </div>
                ) : (
                  filteredConversations.map((conv, idx) => {
                    const cust = conv.participants?.find((p) => String(p._id) !== String(currentUserId)) || conv.participants?.[0];
                    const isSelected = activeConversation?._id === conv._id;
                    const unread = conv.unreadCount || 0;

                    return (
                      <div
                        key={conv._id ? `${conv._id}-${idx}` : idx}
                        role="button"
                        tabIndex={0}
                        onClick={() => selectConversation(conv)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
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
                            src={
                              cust?.avatarUrl ||
                              "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"
                            }
                            alt={cust?.fullName || "Khách hàng"}
                            className="w-10 h-10 rounded-full object-cover border border-[#dddad3]"
                          />
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white absolute bottom-0 right-0" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1 mb-0.5">
                            <span className="text-xs font-bold text-[#141310] truncate">
                              {cust?.fullName || "Khách hàng ReUse"}
                            </span>
                            <span className="text-[10px] text-[#78716c] shrink-0 font-mono">
                              {conv.lastMessage?.createdAt
                                ? new Date(conv.lastMessage.createdAt).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })
                                : ""}
                            </span>
                          </div>

                          {conv.orderTitle && (
                            <div className="text-[10px] text-amber-900 font-semibold truncate bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/60 mb-1">
                              {conv.orderTitle}
                            </div>
                          )}

                          <div className="flex items-center justify-between gap-2">
                            <p className="text-[11px] text-[#57534e] truncate flex-1">
                              {conv.lastMessage?.text || "Bắt đầu cuộc trò chuyện..."}
                            </p>
                            <div className="flex items-center gap-1 shrink-0">
                              {unread > 0 && (
                                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-600 text-white">
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
                                title="Xóa đoạn chat này"
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

            {/* CỘT PHẢI: CHI TIẾT PHÒNG CHAT */}
            <div
              className={`flex-1 flex flex-col bg-[#fdfbf7] min-w-0 min-h-0 overflow-hidden ${
                !activeConversation ? "hidden md:flex items-center justify-center text-center p-8" : "flex"
              }`}
            >
              {!activeConversation ? (
                <div className="max-w-sm flex flex-col items-center text-[#78716c]">
                  <div className="w-16 h-16 rounded-full bg-[#f1ede6] flex items-center justify-center text-[#141310] mb-3 shadow-inner">
                    <span className="material-symbols-outlined text-[32px]">chat</span>
                  </div>
                  <h3 className="font-serif text-lg font-bold text-[#141310]">
                    Chọn một khách hàng để trò chuyện
                  </h3>
                  <p className="text-xs mt-1 text-[#78716c]">
                    Hệ thống sẽ đồng bộ tin nhắn 2 chiều qua Socket.IO theo thời gian thực.
                  </p>
                </div>
              ) : (
                <>
                  {/* Thanh Header của phòng chat chi tiết */}
                  <div className="px-4 py-3 bg-white border-b border-[#dddad3] flex items-center justify-between shadow-2xs shrink-0">
                    <div className="flex items-center gap-3">
                      {/* Nút quay lại trên mobile */}
                      <button
                        type="button"
                        onClick={() => selectConversation(activeConversation)}
                        className="md:hidden p-1.5 rounded-lg text-[#78716c] hover:bg-[#f1ede6]"
                      >
                        <span className="material-symbols-outlined text-[20px]">arrow_back</span>
                      </button>

                      <div className="relative">
                        <img
                          src={
                            currentCustomer?.avatarUrl ||
                            "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"
                          }
                          alt={currentCustomer?.fullName}
                          className="w-9 h-9 rounded-full object-cover border border-[#dddad3]"
                        />
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white absolute bottom-0 right-0" />
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-[#141310]">
                            {currentCustomer?.fullName || "Khách Hàng"}
                          </span>
                          <span
                            className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${
                              activeConversation.serviceType === "THRIFT"
                                ? "bg-amber-100 text-amber-900 border border-amber-300"
                                : "bg-blue-100 text-blue-900 border border-blue-300"
                            }`}
                          >
                            {activeConversation.serviceType || "RENT"}
                          </span>
                        </div>
                        <div className="text-[11px] text-[#78716c] flex items-center gap-1.5">
                          {isCustomerTyping ? (
                            <span className="text-emerald-700 font-semibold animate-pulse flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping" />
                              Khách đang soạn tin nhắn...
                            </span>
                          ) : (
                            <span>{currentCustomer?.email || "Khách hàng đăng kiểm ReUse Hub"}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {activeConversation.orderCode && (
                      <div className="text-right hidden sm:block">
                        <div className="text-[10px] uppercase font-bold text-[#78716c]">
                          Mã Đơn / Hồ Sơ
                        </div>
                        <div className="text-xs font-mono font-bold text-[#141310]">
                          {activeConversation.orderCode}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Vùng hiển thị tin nhắn (Scrollable) */}
                  <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#fdfbf7] min-h-0">
                    {isLoadingMessages ? (
                      <div className="p-8 text-center text-xs text-[#78716c]">
                        Đang nạp lịch sử tin nhắn...
                      </div>
                    ) : (
                      messages.map((m, idx) => {
                        const senderIdStr =
                          typeof m.senderId === "object"
                            ? String(m.senderId._id)
                            : String(m.senderId);
                        const senderRole =
                          typeof m.senderId === "object" ? m.senderId.role : undefined;

                        const isMe =
                          senderRole === "SHOP_OWNER" ||
                          senderIdStr === "shop_owner" ||
                          (Boolean(currentUserId) && String(senderIdStr) === String(currentUserId));

                        return (
                          <div
                            key={m._id ? `${m._id}-${idx}` : idx}
                            className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                          >
                            <div className="flex items-end gap-2 max-w-[80%]">
                              {!isMe && (
                                <img
                                  src={
                                    currentCustomer?.avatarUrl ||
                                    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"
                                  }
                                  alt="Sender"
                                  className="w-6 h-6 rounded-full object-cover shrink-0 mb-1"
                                />
                              )}

                              <div
                                className={`p-3 rounded-2xl text-xs leading-relaxed shadow-2xs break-words ${
                                  isMe
                                    ? "bg-[#141310] text-[#fdf9f2] rounded-br-none"
                                    : "bg-white text-[#1c1c18] border border-[#dddad3] rounded-bl-none"
                                }`}
                              >
                                {m.text}
                                {m.imageUrl && (
                                  <img
                                    src={m.imageUrl}
                                    alt="Đính kèm"
                                    className="mt-2 rounded-lg max-h-48 object-cover border border-black/10"
                                  />
                                )}
                              </div>
                            </div>

                            <span className="text-[10px] text-[#a8a29e] mt-1 px-1 font-mono">
                              {m.createdAt
                                ? new Date(m.createdAt).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })
                                : ""}
                            </span>
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Ô Nhập Tin Nhắn & Nút Gửi */}
                  <form
                    onSubmit={handleSend}
                    className="p-3 bg-white border-t border-[#dddad3] flex items-center gap-2 shrink-0"
                  >
                    <input
                      type="text"
                      value={inputVal}
                      onChange={handleInputChange}
                      placeholder={`Nhắn tin cho ${currentCustomer?.fullName || "khách hàng"} (Enter để gửi)...`}
                      className="flex-1 bg-[#f4efe6] border border-[#dddad3] rounded-xl px-3.5 py-2.5 text-xs text-[#141310] placeholder-[#78716c] focus:outline-none focus:border-[#141310] focus:bg-white transition-all"
                    />

                    <button
                      type="submit"
                      disabled={!inputVal.trim()}
                      className="p-2.5 rounded-xl bg-[#141310] hover:bg-[#292724] disabled:opacity-40 text-white transition-all shadow-xs flex items-center justify-center shrink-0 cursor-pointer disabled:cursor-not-allowed"
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

      {/* MODAL XÁC NHẬN XÓA HOẶC HỦY */}
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
                  Bạn có chắc chắn muốn xóa toàn bộ lịch sử tin nhắn của cuộc trò chuyện này không? Thao tác này sẽ xóa vĩnh viễn và{" "}
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

export default ShopChatDrawer;
