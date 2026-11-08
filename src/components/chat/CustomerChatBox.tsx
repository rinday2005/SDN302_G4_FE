import React, { useState, useRef, useEffect } from "react";
import { useCustomerChat } from "../../context/customer-chat-context";
import { useAuth } from "../../hooks/useAuth";

export const CustomerChatBox: React.FC = () => {
  const {
    isOpen,
    messages,
    isLoading,
    isShopTyping,
    productContext,
    closeChat,
    sendMessage,
    sendTyping,
    clearProductContext,
  } = useCustomerChat();

  const { user } = useAuth();
  const currentUserId = user?._id || user?.id || "";

  const [inputVal, setInputVal] = useState("");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto scroll to bottom
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [isOpen, messages, isShopTyping]);

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

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-[calc(100vw-32px)] sm:w-[410px] h-[580px] max-h-[85vh] bg-[#fdf9f2] rounded-3xl shadow-2xl border border-[#dddad3] flex flex-col overflow-hidden animate-slide-up font-sans">
      {/* 1. HEADER */}
      <div className="bg-[#f5efe6] px-4 py-3.5 border-b border-[#dddad3] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-[#141310] text-[#fdf9f2] flex items-center justify-center font-serif font-bold text-sm shadow-xs overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150"
                alt="Atelier Shop"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLElement).style.display = "none";
                }}
              />
            </div>
            <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white" />
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-serif font-bold text-sm text-[#141310] line-clamp-1">
                Atelier Chronos &amp; Optics
              </h3>
            </div>
            <p className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
              Chủ xưởng trực tuyến • Phản hồi nhanh
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={closeChat}
          className="p-1.5 rounded-full hover:bg-[#ebe6dc] text-[#57534e] hover:text-[#141310] transition-colors cursor-pointer"
          title="Đóng chat"
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>
      </div>

      {/* 2. PINNED PRODUCT CONTEXT BANNER (NẾU CÓ) */}
      {productContext && (
        <div className="bg-[#f0ebe1] px-3.5 py-2.5 border-b border-[#dddad3] flex items-center justify-between gap-2 shrink-0 animate-fade-in">
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
                Đang xem sản phẩm
              </p>
              <h4 className="text-xs font-bold text-[#141310] truncate">
                {productContext.title}
              </h4>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
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

      {/* 3. MESSAGES CONTAINER */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#fdf9f2]">
        {isLoading && (
          <div className="flex items-center justify-center py-6 text-xs text-[#78716c] gap-2">
            <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
            Đang đồng bộ cuộc trò chuyện với Xưởng...
          </div>
        )}

        {!isLoading && messages.length === 0 && (
          <div className="text-center py-10 px-4 space-y-2">
            <div className="w-12 h-12 rounded-full bg-[#f4f0ea] flex items-center justify-center mx-auto text-[#78716c]">
              <span className="material-symbols-outlined text-[24px]">chat_bubble_outline</span>
            </div>
            <p className="font-serif font-bold text-sm text-[#141310]">
              Bắt đầu trò chuyện với Atelier
            </p>
            <p className="text-xs text-[#78716c] max-w-xs mx-auto">
              Gửi lời nhắn để được tư vấn kích thước, quy trình bảo quản, hợp đồng thuê hoặc thương lượng mua bán!
            </p>
          </div>
        )}

        {messages.map((m) => {
          const senderIdStr =
            typeof m.senderId === "object" ? String(m.senderId._id) : String(m.senderId);
          const isMe = senderIdStr === currentUserId;

          return (
            <div
              key={m._id}
              className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
            >
              <div
                className={`max-w-[82%] rounded-2xl p-3 text-xs leading-relaxed shadow-xs ${
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

              <span className="text-[10px] text-[#a8a29e] mt-1 px-1">
                {m.createdAt
                  ? new Date(m.createdAt).toLocaleTimeString("vi-VN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "Vừa xong"}
              </span>
            </div>
          );
        })}

        {/* Typing indicator */}
        {isShopTyping && (
          <div className="flex items-center gap-2 text-xs text-[#78716c] italic animate-fade-in">
            <span className="w-2 h-2 rounded-full bg-[#78716c] animate-bounce" />
            <span className="w-2 h-2 rounded-full bg-[#78716c] animate-bounce delay-100" />
            <span className="w-2 h-2 rounded-full bg-[#78716c] animate-bounce delay-200" />
            <span>Atelier đang nhập tin nhắn...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* 4. INPUT BAR */}
      <form
        onSubmit={handleSend}
        className="p-3 bg-white border-t border-[#dddad3] flex items-center gap-2 shrink-0"
      >
        <input
          type="text"
          value={inputVal}
          onChange={handleInputChange}
          placeholder="Nhắn tin hỏi Atelier (Xưởng)..."
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
    </div>
  );
};
