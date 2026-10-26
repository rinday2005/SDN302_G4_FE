import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useChat } from '../../hooks/useChat';
import { UserSidebar } from '../../components/layout/UserSidebar';
import type { ChatParticipant, Conversation } from '../../services/chat.api';
import { normalizeImageUrl } from '../../utils/imageUrl';

export interface ProductInquiryState {
  id: string;
  title: string;
  imageUrl?: string;
  priceText?: string;
  type: 'RENT' | 'THRIFT';
  url: string;
}

// Tìm đối tác trong cuộc trò chuyện (Người kia là ai)
const getPartner = (conv: Conversation | null, currentUserId: string): ChatParticipant | null => {
  if (!conv?.participants || conv.participants.length === 0) return null;
  const partner = conv.participants.find((p) => String(p._id) !== String(currentUserId));
  return partner || conv.participants[0] || null;
};

export const ChatPage: React.FC = () => {
  const { user } = useAuth();
  const userId = user?._id || user?.id || '';
  const isShopOwner = user?.role === 'SHOP_OWNER';

  const [searchParams] = useSearchParams();
  const location = useLocation();
  const locationInquiry = (location.state as { inquiry?: ProductInquiryState })?.inquiry;
  const [productInquiry, setProductInquiry] = useState<ProductInquiryState | undefined>(locationInquiry);

  const initialConvId = searchParams.get('conversationId') || searchParams.get('convId');

  const {
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
    error: chatError,
    sendMessage,
    sendImageMessage,
    sendTyping,
    sendStopTyping,
    refreshConversations,
  } = useChat(initialConvId);

  // Search & filter state for conversations (dành cho Shop Owner hoặc tìm kiếm)
  const [searchTerm, setSearchTerm] = useState('');
  const [filterUnreadOnly, setFilterUnreadOnly] = useState(false);

  // Input states
  const [inputText, setInputText] = useState<string>(() => {
    if (locationInquiry?.title) {
      return `Xin chào Shop, mình đang quan tâm đến sản phẩm "${locationInquiry.title}" (${locationInquiry.priceText || ''}). Shop tư vấn giúp mình nhé!`;
    }
    return '';
  });
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

  // Modals & previews
  const [zoomImage, setZoomImage] = useState<{ title?: string; url: string } | null>(null);
  const [isHotlineOpen, setIsHotlineOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Scroll to top khi mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Auto-scroll messages to bottom khi có tin nhắn mới hoặc typing
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, partnerTyping.isTyping]);

  // Giải phóng URL preview khi đổi ảnh
  useEffect(() => {
    return () => {
      if (imagePreviewUrl) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
    };
  }, [imagePreviewUrl]);

  // Xử lý chọn ảnh từ file picker
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Vui lòng chọn tệp định dạng hình ảnh (PNG, JPG, WEBP)');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      showToast('Dung lượng ảnh tối đa 10MB');
      return;
    }

    setSelectedImageFile(file);
    const preview = URL.createObjectURL(file);
    setImagePreviewUrl(preview);
  };

  const handleClearSelectedImage = () => {
    setSelectedImageFile(null);
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
      setImagePreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const activePartner = useMemo(() => getPartner(activeConversation, userId), [activeConversation, userId]);

  // Format timestamp hiển thị tin nhắn
  const formatMessageTime = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  // Format ngày phân cách
  const formatMessageDate = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      const today = new Date();
      if (d.toDateString() === today.toDateString()) {
        return 'Hôm nay';
      }
      const yesterday = new Date();
      yesterday.setDate(today.getDate() - 1);
      if (d.toDateString() === yesterday.toDateString()) {
        return 'Hôm qua';
      }
      return d.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return '';
    }
  };

  // Xử lý gửi tin nhắn
  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const textToSend = inputText.trim();
    if (!textToSend && !selectedImageFile) return;

    if (selectedImageFile) {
      const success = await sendImageMessage(selectedImageFile, textToSend);
      if (success) {
        handleClearSelectedImage();
        setInputText('');
      } else {
        showToast('Không thể gửi ảnh, vui lòng thử lại');
      }
    } else {
      const success = await sendMessage(textToSend);
      if (success) {
        setInputText('');
      } else {
        showToast('Không thể gửi tin nhắn, vui lòng thử lại');
      }
    }

    sendStopTyping();
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  // Quick preset pills handler
  const handlePresetClick = (presetText: string) => {
    sendMessage(presetText);
  };

  // Danh sách conversations đã lọc theo tìm kiếm và bộ lọc chưa đọc
  const filteredConversations = useMemo(() => {
    return conversations.filter((c) => {
      const partner = getPartner(c, userId);
      const partnerName = partner?.fullName || 'Người dùng';
      const lastText = c.lastMessage?.text || '';

      const matchSearch =
        !searchTerm.trim() ||
        partnerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lastText.toLowerCase().includes(searchTerm.toLowerCase());

      const unread = (c._id && unreadCounts[c._id]) || 0;
      const matchUnread = !filterUnreadOnly || unread > 0;

      return matchSearch && matchUnread;
    });
  }, [conversations, searchTerm, filterUnreadOnly, unreadCounts, userId]);

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] text-[#1C1A18] antialiased selection:bg-[#E8E2D5]">
      {/* ── TOP HEADER BANNER ── */}
      <div className="bg-[#1C1A18] text-[#EBE6DD] text-[11px] sm:text-xs font-medium tracking-wide py-1.5 px-4 text-center border-b border-[#36322D]">
        <span>
          {isShopOwner
            ? 'KÊNH QUẢN TRỊ SHOP OWNER · TRÒ CHUYỆN VÀ TƯ VẤN KHÁCH HÀNG TRỰC TIẾP REALTIME'
            : 'TRÒ CHUYỆN TRỰC TIẾP VỚI SHOP OWNER DUY NHẤT CỦA REUSE HUB · SMART ESCROW BẢO VỆ 100%'}
        </span>
      </div>

      {/* ── TOAST NOTIFICATION ── */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 border bg-[#1C1A18] text-white border-white/20 animate-fadeIn">
          <span className="material-symbols-outlined text-lg text-[#E7C890]">info</span>
          <p className="text-xs font-semibold max-w-sm">{toastMessage}</p>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-stone-400 hover:text-white ml-2 text-sm"
          >
            ✕
          </button>
        </div>
      )}

      {/* ── MAIN CHAT VIEW CONTAINER ── */}
      <div className="flex-1 max-w-[1600px] w-full mx-auto px-3 sm:px-6 lg:px-8 py-5 lg:py-6 flex gap-6">
        {/* Persistent User Sidebar cho khách hàng (ẩn khi là Shop Owner) */}
        {!isShopOwner && (
          <aside className="w-64 shrink-0 hidden lg:block">
            <UserSidebar activeKey="chat" />
          </aside>
        )}

        {/* WORKSPACE CHAT CHÍNH (2 Khối: Danh sách cuộc hội thoại + Khung chat) */}
        <div className="flex-1 min-w-0 flex flex-col h-[calc(100vh-130px)] bg-white rounded-3xl border border-[#E8E4DC] shadow-sm overflow-hidden">
          
          {/* HEADER TRÊN CÙNG CỦA KHUNG WORKSPACE */}
          <div className="px-6 py-3.5 bg-[#F6F3ED] border-b border-[#E8E4DC] flex items-center justify-between gap-4 shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-[#1C1A18] text-white flex items-center justify-center shrink-0 shadow-xs">
                <span className="material-symbols-outlined text-xl">forum</span>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="font-serif text-lg font-bold text-[#1C1A18] truncate">
                    {isShopOwner ? 'Hộp thư tin nhắn Shop Owner' : 'ReUse Hub Concierge Chat'}
                  </h1>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      isConnected
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-amber-100 text-amber-800 border border-amber-300'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isConnected ? 'bg-emerald-600 animate-pulse' : 'bg-amber-600'
                      }`}
                    />
                    <span>{isConnected ? 'Realtime Online' : 'Đang đồng bộ'}</span>
                  </span>
                </div>
                <p className="text-[11px] text-[#76726B] truncate">
                  {isShopOwner
                    ? 'Quản lý trao đổi, tư vấn hiện vật và giải đáp thắc mắc cho từng khách hàng'
                    : 'Kênh đối thoại độc quyền với Shop Owner duy nhất của hệ thống ReUse Hub'}
                </p>
              </div>
            </div>

            {/* Nút hành động trên Header */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  refreshConversations();
                  showToast('Đang làm mới danh sách cuộc hội thoại...');
                }}
                className="p-2 text-[#76726B] hover:text-[#1C1A18] hover:bg-[#EAE6DE] rounded-xl transition-colors cursor-pointer"
                title="Làm mới hội thoại"
              >
                <span className="material-symbols-outlined text-lg">refresh</span>
              </button>
              {!isShopOwner && (
                <button
                  type="button"
                  onClick={() => setIsHotlineOpen(true)}
                  className="px-3 py-1.5 rounded-xl border border-[#D5D0C6] bg-white hover:bg-[#F6F3ED] text-xs font-semibold text-[#1C1A18] flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                >
                  <span className="material-symbols-outlined text-sm text-emerald-700">call</span>
                  <span className="hidden sm:inline">Hotline Thẩm định</span>
                </button>
              )}
            </div>
          </div>

          {/* NỘI DUNG 2 CỘT CHAT */}
          <div className="flex-1 flex overflow-hidden">
            
            {/* ── CỘT TRÁI: DANH SÁCH CUỘC HỘI THOẠI (CONVERSATION LIST) ── */}
            <div
              className={`w-full md:w-80 lg:w-96 border-r border-[#E8E4DC] flex flex-col bg-[#FDFBF7] shrink-0 ${
                activeConversation ? 'hidden md:flex' : 'flex'
              }`}
            >
              {/* Thanh tìm kiếm & bộ lọc */}
              <div className="p-3.5 border-b border-[#E8E4DC]/80 space-y-2.5">
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-2.5 text-stone-400 text-lg">
                    search
                  </span>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder={
                      isShopOwner ? 'Tìm theo tên khách, nội dung...' : 'Tìm kiếm tin nhắn...'
                    }
                    className="w-full bg-white border border-[#E8E4DC] rounded-xl pl-9 pr-3 py-1.5 text-xs text-[#1C1A18] placeholder-stone-400 focus:outline-none focus:border-[#1C1A18] transition-colors"
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={() => setSearchTerm('')}
                      className="absolute right-2.5 top-2.5 text-stone-400 hover:text-stone-700 text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Filter tags (Tất cả / Chưa đọc) */}
                <div className="flex items-center justify-between text-xs pt-0.5">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setFilterUnreadOnly(false)}
                      className={`px-2.5 py-1 rounded-lg font-medium text-[11px] transition-all cursor-pointer ${
                        !filterUnreadOnly
                          ? 'bg-[#1C1A18] text-white font-semibold'
                          : 'bg-white hover:bg-stone-100 text-[#76726B] border border-[#E8E4DC]'
                      }`}
                    >
                      Tất cả ({conversations.length})
                    </button>
                    {totalUnreadCount > 0 && (
                      <button
                        type="button"
                        onClick={() => setFilterUnreadOnly(true)}
                        className={`px-2.5 py-1 rounded-lg font-medium text-[11px] flex items-center gap-1 transition-all cursor-pointer ${
                          filterUnreadOnly
                            ? 'bg-rose-600 text-white font-semibold'
                            : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                        }`}
                      >
                        <span>Chưa đọc</span>
                        <span className="px-1.5 py-0.2 rounded-full bg-rose-600 text-white text-[9px] font-bold">
                          {totalUnreadCount}
                        </span>
                      </button>
                    )}
                  </div>

                  {/* Thông tin mô hình 1 Shop Owner */}
                  {!isShopOwner && (
                    <span className="text-[10px] text-[#76726B] font-medium flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                      Shop Owner Duy Nhất
                    </span>
                  )}
                </div>
              </div>

              {/* Danh sách hội thoại cuộn */}
              <div className="flex-1 overflow-y-auto thin-scrollbar p-2 space-y-1.5">
                {loadingConversations ? (
                  <div className="p-8 text-center text-xs text-[#76726B] space-y-2">
                    <div className="w-6 h-6 border-2 border-[#1C1A18] border-t-transparent rounded-full animate-spin mx-auto" />
                    <p>Đang tải danh sách cuộc trò chuyện...</p>
                  </div>
                ) : filteredConversations.length === 0 ? (
                  <div className="p-8 text-center text-xs text-[#76726B] space-y-2">
                    <span className="material-symbols-outlined text-3xl text-stone-300">
                      chat_bubble_outline
                    </span>
                    <p className="font-medium text-stone-600">
                      {filterUnreadOnly
                        ? 'Không có tin nhắn chưa đọc'
                        : searchTerm
                        ? 'Không tìm thấy cuộc trò chuyện nào'
                        : 'Chưa có cuộc trò chuyện nào'}
                    </p>
                  </div>
                ) : (
                  filteredConversations.map((conv) => {
                    const partner = getPartner(conv, userId);
                    const partnerName = partner?.fullName || (isShopOwner ? 'Khách hàng' : 'Atelier Shop Owner');
                    const partnerAvatar = normalizeImageUrl(partner?.avatarUrl);
                    const partnerRole = partner?.role || (isShopOwner ? 'USER' : 'SHOP_OWNER');

                    const isSelected = activeConversation?._id === conv._id;
                    const unread = (conv._id && unreadCounts[conv._id]) || 0;
                    const lastMsg = conv.lastMessage;
                    const timeStr = formatMessageTime(lastMsg?.createdAt || conv.updatedAt);

                    return (
                      <div
                        key={conv._id}
                        onClick={() => setActiveConversation(conv)}
                        className={`p-3 rounded-2xl flex items-start gap-3 transition-all cursor-pointer border ${
                          isSelected
                            ? 'bg-[#1C1A18] text-white border-[#1C1A18] shadow-sm'
                            : 'bg-white hover:bg-[#F3EFE8] border-[#E8E4DC]/80 text-[#1C1A18]'
                        }`}
                      >
                        {/* Avatar có indicator online */}
                        <div className="relative shrink-0">
                          {partnerAvatar ? (
                            <img
                              src={partnerAvatar}
                              alt={partnerName}
                              className={`w-11 h-11 rounded-full object-cover border ${
                                isSelected ? 'border-white/30' : 'border-[#E8E4DC]'
                              }`}
                            />
                          ) : (
                            <div
                              className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-xs ${
                                isSelected
                                  ? 'bg-white/20 text-white'
                                  : 'bg-[#EAE6DE] text-[#1C1A18]'
                              }`}
                            >
                              {partnerName.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          {/* Online status indicator */}
                          <span
                            className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 ${
                              isSelected ? 'border-[#1C1A18]' : 'border-white'
                            } ${isConnected ? 'bg-emerald-500' : 'bg-stone-400'}`}
                            title={isConnected ? 'Đang online' : 'Ngoại tuyến'}
                          />
                        </div>

                        {/* Nội dung tóm tắt cuộc hội thoại */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1 mb-0.5">
                            <span
                              className={`text-xs font-bold truncate ${
                                isSelected ? 'text-white' : 'text-[#1C1A18]'
                              }`}
                            >
                              {partnerName}
                            </span>
                            <span
                              className={`text-[10px] shrink-0 ${
                                isSelected ? 'text-stone-300' : 'text-[#76726B]'
                              }`}
                            >
                              {timeStr}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 mb-1">
                            <span
                              className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold tracking-wider uppercase ${
                                isSelected
                                  ? 'bg-white/20 text-white'
                                  : partnerRole === 'SHOP_OWNER'
                                  ? 'bg-[#EBE5DA] text-[#423C34]'
                                  : 'bg-blue-50 text-blue-700'
                              }`}
                            >
                              {partnerRole === 'SHOP_OWNER' ? 'SHOP OWNER' : 'KHÁCH HÀNG'}
                            </span>
                          </div>

                          <div className="flex items-center justify-between gap-2">
                            <p
                              className={`text-[11px] truncate leading-tight ${
                                isSelected
                                  ? 'text-stone-200'
                                  : unread > 0
                                  ? 'font-bold text-[#1C1A18]'
                                  : 'text-[#76726B]'
                              }`}
                            >
                              {lastMsg?.imageUrl && !lastMsg?.text
                                ? '📷 [Hình ảnh đính kèm]'
                                : lastMsg?.text || 'Chưa có tin nhắn'}
                            </p>

                            {/* Badge tin nhắn chưa đọc */}
                            {unread > 0 && (
                              <span className="shrink-0 px-1.5 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-bold animate-pulse">
                                {unread > 99 ? '99+' : unread}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Banner chân cột trái: Bảo chứng & quy tắc cách ly tin nhắn */}
              <div className="p-3 bg-[#F2EDE4]/80 border-t border-[#E8E4DC] text-[10px] text-[#76726B] flex items-center gap-2">
                <span className="material-symbols-outlined text-sm text-emerald-700 shrink-0">
                  security
                </span>
                <span>
                  {isShopOwner
                    ? 'Mỗi cuộc trò chuyện được phân tách độc lập giữa từng khách hàng.'
                    : 'Cuộc trò chuyện được bảo mật, mã hóa độc quyền giữa bạn và Shop Owner.'}
                </span>
              </div>
            </div>

            {/* ── CỘT PHẢI: KHUNG CHAT CHI TIẾT (CHAT PANE) ── */}
            <div
              className={`flex-1 flex flex-col bg-white overflow-hidden ${
                !activeConversation ? 'hidden md:flex' : 'flex'
              }`}
            >
              {activeConversation ? (
                <>
                  {/* THANH THÔNG TIN ĐỐI TÁC TRONG PHÒNG CHAT */}
                  <div className="px-5 py-3.5 bg-white border-b border-[#E8E4DC] flex items-center justify-between gap-3 shrink-0">
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Nút Back dành cho mobile */}
                      <button
                        type="button"
                        onClick={() => setActiveConversation(null)}
                        className="md:hidden p-1.5 text-stone-600 hover:text-stone-900 rounded-lg hover:bg-stone-100"
                        title="Quay lại danh sách"
                      >
                        <span className="material-symbols-outlined text-xl">arrow_back</span>
                      </button>

                      {/* Avatar đối tác */}
                      <div className="relative shrink-0">
                        {normalizeImageUrl(activePartner?.avatarUrl) ? (
                          <img
                            src={normalizeImageUrl(activePartner?.avatarUrl)}
                            alt={activePartner?.fullName}
                            className="w-10 h-10 rounded-full object-cover border border-[#E8E4DC]"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-[#EAE6DE] text-[#1C1A18] flex items-center justify-center font-bold text-xs">
                            {(activePartner?.fullName || 'KH').slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <span
                          className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                            isConnected ? 'bg-emerald-500' : 'bg-stone-400'
                          }`}
                        />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h2 className="text-sm font-bold text-[#1C1A18] truncate">
                            {activePartner?.fullName ||
                              (isShopOwner ? 'Khách hàng' : 'Vũ Thanh Tùng (Shop Owner)')}
                          </h2>
                          <span className="text-[10px] px-1.5 py-0.2 rounded font-semibold bg-[#EAE6DE] text-[#423C34] uppercase tracking-wider">
                            {activePartner?.role === 'SHOP_OWNER'
                              ? 'SHOP OWNER'
                              : 'KHÁCH HÀNG'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-[#76726B]">
                          <span className="flex items-center gap-1">
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isConnected ? 'bg-emerald-600 animate-pulse' : 'bg-stone-400'
                              }`}
                            />
                            <span>{isConnected ? 'Đang trực tuyến' : 'Ngoại tuyến'}</span>
                          </span>
                          <span>·</span>
                          <span className="truncate">{activePartner?.email || 'Hỗ trợ 24/7'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Tiện ích nhanh */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          showToast('Đang tạo bản sao lưu biên bản đối thoại...');
                          window.print();
                        }}
                        className="p-2 text-stone-500 hover:text-stone-800 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer"
                        title="In biên bản đối thoại"
                      >
                        <span className="material-symbols-outlined text-lg">print</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsHotlineOpen(true)}
                        className="p-2 text-stone-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition-colors cursor-pointer"
                        title="Hotline hỗ trợ"
                      >
                        <span className="material-symbols-outlined text-lg">call</span>
                      </button>
                    </div>
                  </div>

                  {/* KHUNG TIN NHẮN (MESSAGES CANVAS) */}
                  <div className="flex-1 p-4 sm:p-6 overflow-y-auto thin-scrollbar bg-[#FAF8F5] space-y-4">
                    {loadingMessages ? (
                      <div className="p-12 text-center text-xs text-[#76726B] space-y-2">
                        <div className="w-6 h-6 border-2 border-[#1C1A18] border-t-transparent rounded-full animate-spin mx-auto" />
                        <p>Đang đồng bộ lịch sử tin nhắn...</p>
                      </div>
                    ) : messages.length === 0 ? (
                      /* Màn hình chào mừng khi chưa có tin nhắn */
                      <div className="max-w-md mx-auto my-12 text-center p-6 rounded-3xl bg-white border border-[#E8E4DC] shadow-2xs space-y-3">
                        <div className="w-12 h-12 rounded-2xl bg-[#F6F3ED] text-[#1C1A18] flex items-center justify-center mx-auto">
                          <span className="material-symbols-outlined text-2xl">waving_hand</span>
                        </div>
                        <h3 className="font-serif text-base font-bold text-[#1C1A18]">
                          {isShopOwner
                            ? 'Bắt đầu cuộc trò chuyện với khách hàng'
                            : 'Chào mừng bạn đến với kênh Concierge ReUse Hub'}
                        </h3>
                        <p className="text-xs text-[#76726B] leading-relaxed">
                          {isShopOwner
                            ? 'Giải đáp thắc mắc về hiện vật thuê hoặc mua thrift để gia tăng độ hài lòng của khách hàng.'
                            : 'Shop Owner luôn sẵn sàng hỗ trợ bạn về tình trạng máy, kiểm định quang học, hợp đồng thuê và ví ký quỹ Smart Escrow.'}
                        </p>
                        {!isShopOwner && (
                          <div className="pt-2 flex flex-wrap justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => handlePresetClick('Xin chào Shop, mình muốn hỏi về đơn hàng thuê')}
                              className="px-3 py-1.5 rounded-full bg-[#F6F3ED] hover:bg-[#EAE6DE] text-xs text-[#1C1A18] font-medium transition-colors"
                            >
                              💬 Hỏi về đơn thuê
                            </button>
                            <button
                              type="button"
                              onClick={() => handlePresetClick('Shop cho mình hỏi về chính sách cọc Smart Escrow nhé')}
                              className="px-3 py-1.5 rounded-full bg-[#F6F3ED] hover:bg-[#EAE6DE] text-xs text-[#1C1A18] font-medium transition-colors"
                            >
                              🛡️ Tiền cọc Escrow
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      /* Danh sách tin nhắn */
                      messages.map((msg, index) => {
                        const senderIdStr =
                          typeof msg.senderId === 'string'
                            ? msg.senderId
                            : msg.senderId?._id;

                        const isMine = String(senderIdStr) === String(userId);
                        const senderName =
                          typeof msg.senderId === 'object' && msg.senderId?.fullName
                            ? msg.senderId.fullName
                            : isMine
                            ? 'Tôi'
                            : activePartner?.fullName || 'Đối tác';

                        const senderAvatar =
                          typeof msg.senderId === 'object' && msg.senderId?.avatarUrl
                            ? normalizeImageUrl(msg.senderId.avatarUrl)
                            : isMine
                            ? normalizeImageUrl(user?.avatarUrl || user?.avatar)
                            : normalizeImageUrl(activePartner?.avatarUrl);

                        const time = formatMessageTime(msg.createdAt);

                        // Hiển thị phân cách ngày nếu tin nhắn trước khác ngày
                        const currentDateStr = formatMessageDate(msg.createdAt);
                        const prevMsg = messages[index - 1];
                        const prevDateStr = prevMsg ? formatMessageDate(prevMsg.createdAt) : null;
                        const showDateSeparator = currentDateStr && currentDateStr !== prevDateStr;

                        return (
                          <React.Fragment key={msg._id || msg.id || index}>
                            {showDateSeparator && (
                              <div className="flex items-center justify-center my-3">
                                <div className="h-px bg-[#E8E4DC] flex-1" />
                                <span className="px-3 text-[10px] uppercase font-bold tracking-widest text-[#76726B] bg-[#FAF8F5]">
                                  {currentDateStr}
                                </span>
                                <div className="h-px bg-[#E8E4DC] flex-1" />
                              </div>
                            )}

                            <div
                              className={`flex items-start gap-2.5 max-w-xl ${
                                isMine ? 'ml-auto flex-row-reverse' : 'mr-auto'
                              }`}
                            >
                              {/* Avatar người gửi */}
                              {senderAvatar ? (
                                <img
                                  src={senderAvatar}
                                  alt={senderName}
                                  className="w-8 h-8 rounded-full object-cover border border-[#E8E4DC] shrink-0 mt-0.5"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-[#EAE6DE] text-[#1C1A18] flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                                  {senderName.slice(0, 2).toUpperCase()}
                                </div>
                              )}

                              {/* Bong bóng tin nhắn */}
                              <div className={`space-y-1 ${isMine ? 'text-right' : 'text-left'}`}>
                                <div className="flex items-center gap-1.5 px-1">
                                  <span className="text-[11px] font-bold text-[#1C1A18]">
                                    {isMine ? 'Tôi' : senderName}
                                  </span>
                                  <span className="text-[10px] text-[#76726B]">{time}</span>
                                </div>

                                <div
                                  className={`p-3.5 rounded-2xl shadow-2xs text-xs leading-relaxed space-y-2 ${
                                    isMine
                                      ? 'bg-[#1C1A18] text-white rounded-tr-xs'
                                      : 'bg-white border border-[#E8E4DC] text-[#1C1A18] rounded-tl-xs'
                                  }`}
                                >
                                  {/* Hiển thị ảnh đính kèm nếu có */}
                                  {msg.imageUrl && (
                                    <div
                                      onClick={() =>
                                        setZoomImage({
                                          title: 'Ảnh đính kèm trong tin nhắn',
                                          url: normalizeImageUrl(msg.imageUrl),
                                        })
                                      }
                                      className="rounded-xl overflow-hidden border border-black/10 cursor-pointer group relative max-w-sm"
                                    >
                                      <img
                                        src={normalizeImageUrl(msg.imageUrl)}
                                        alt="Ảnh đính kèm"
                                        className="w-full max-h-72 object-cover group-hover:scale-102 transition-transform duration-200"
                                      />
                                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                                        <span className="material-symbols-outlined text-2xl">
                                          zoom_in
                                        </span>
                                      </div>
                                    </div>
                                  )}

                                  {/* Hiển thị nội dung text */}
                                  {msg.text && (
                                    <p className="whitespace-pre-line break-words text-xs">
                                      {msg.text}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </React.Fragment>
                        );
                      })
                    )}

                    {/* Indicator đối tác đang gõ (Typing...) */}
                    {partnerTyping.isTyping && (
                      <div className="flex items-center gap-2 text-xs text-[#76726B] italic pl-10 animate-pulse">
                        <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping" />
                        <span>{partnerTyping.fullName || activePartner?.fullName || 'Đối tác'} đang nhập tin nhắn...</span>
                      </div>
                    )}

                    <div ref={messagesEndRef} />
                  </div>

                  {/* THÔNG BÁO LỖI NẾU CÓ */}
                  {chatError && (
                    <div className="px-5 py-2 bg-rose-50 border-t border-rose-200 text-rose-700 text-xs flex items-center justify-between">
                      <span>{chatError}</span>
                      <button
                        type="button"
                        onClick={() => refreshConversations()}
                        className="underline font-semibold ml-2 cursor-pointer"
                      >
                        Thử lại
                      </button>
                    </div>
                  )}

                  {/* SẢN PHẨM ĐANG QUAN TÂM (PRODUCT INQUIRY BANNER) */}
                  {productInquiry && (
                    <div className="mx-4 my-2.5 p-3 rounded-2xl bg-white border border-[#D5D0C6] shadow-sm flex items-center justify-between gap-3 animate-fadeIn">
                      <div className="flex items-center gap-3 min-w-0">
                        {productInquiry.imageUrl && (
                          <img
                            src={normalizeImageUrl(productInquiry.imageUrl)}
                            alt={productInquiry.title}
                            className="w-12 h-12 rounded-xl object-cover border border-[#E8E4DC] shrink-0"
                          />
                        )}
                        <div className="min-w-0 text-xs">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${
                                productInquiry.type === 'RENT'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {productInquiry.type === 'RENT' ? 'Hỏi đồ thuê RENT' : 'Hỏi đồ mua THRIFT'}
                            </span>
                            <span className="text-[10px] text-[#76726B] font-mono">
                              #{String(productInquiry.id).slice(-6)}
                            </span>
                          </div>
                          <h4 className="font-bold text-[#1C1A18] truncate mt-0.5">
                            {productInquiry.title}
                          </h4>
                          <p className="text-[11px] text-[#76726B] font-semibold">
                            {productInquiry.priceText}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={async () => {
                            const inquiryText = `Xin chào Shop, mình đang quan tâm đến sản phẩm "${productInquiry.title}" (${productInquiry.priceText || ''}).\nXem sản phẩm: ${window.location.origin}${productInquiry.url}\nShop tư vấn tình trạng và hỗ trợ mình với nhé!`;
                            await sendMessage(inquiryText, productInquiry.imageUrl || null);
                            setProductInquiry(undefined);
                            showToast('Đã gửi thông tin sản phẩm vào cuộc trò chuyện!');
                          }}
                          className="px-3 py-1.5 rounded-xl bg-[#1C1A18] text-white hover:bg-black font-semibold text-xs flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-sm">send</span>
                          <span>Gửi vào chat</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setProductInquiry(undefined)}
                          className="p-1 text-stone-400 hover:text-stone-700 text-xs rounded-lg cursor-pointer"
                          title="Bỏ qua"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  )}

                  {/* QUICK PRESET SUGGESTIONS CHO KHÁCH HÀNG */}
                  {!isShopOwner && (
                    <div className="px-5 py-2 bg-[#F6F3ED]/70 border-t border-[#E8E4DC] flex items-center gap-2 overflow-x-auto thin-scrollbar">
                      <span className="text-[10px] uppercase font-bold text-[#76726B] shrink-0">
                        Hỏi nhanh:
                      </span>
                      <button
                        type="button"
                        onClick={() => handlePresetClick('Hỏi gia hạn thời gian thuê thêm 2 ngày')}
                        className="px-2.5 py-1 rounded-lg bg-white hover:bg-stone-100 border border-[#E8E4DC] text-[11px] font-medium whitespace-nowrap transition-colors cursor-pointer"
                      >
                        + Gia hạn ngày thuê
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePresetClick('Tư vấn gói bảo hiểm quang học & trầy xước')}
                        className="px-2.5 py-1 rounded-lg bg-white hover:bg-stone-100 border border-[#E8E4DC] text-[11px] font-medium whitespace-nowrap transition-colors cursor-pointer"
                      >
                        🛡️ Bảo hiểm quang học
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePresetClick('Thời gian hoàn trả cọc sau khi trả máy')}
                        className="px-2.5 py-1 rounded-lg bg-white hover:bg-stone-100 border border-[#E8E4DC] text-[11px] font-medium whitespace-nowrap transition-colors cursor-pointer"
                      >
                        💰 Hoàn cọc Escrow
                      </button>
                    </div>
                  )}

                  {/* XEM TRƯỚC ẢNH ĐÍNH KÈM TRƯỚC KHI GỬI */}
                  {imagePreviewUrl && (
                    <div className="px-5 py-2.5 bg-[#F6F3ED] border-t border-[#E8E4DC] flex items-center gap-3">
                      <div className="relative w-14 h-14 rounded-xl overflow-hidden border border-[#D5D0C6] shrink-0">
                        <img
                          src={imagePreviewUrl}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={handleClearSelectedImage}
                          className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-black/70 text-white flex items-center justify-center text-[10px] hover:bg-black"
                          title="Hủy ảnh"
                        >
                          ✕
                        </button>
                      </div>
                      <div className="flex-1 text-xs">
                        <p className="font-bold text-[#1C1A18] truncate">
                          {selectedImageFile?.name}
                        </p>
                        <p className="text-[11px] text-[#76726B]">
                          {(selectedImageFile ? selectedImageFile.size / 1024 : 0).toFixed(0)} KB ·
                          Sẵn sàng gửi đính kèm
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleClearSelectedImage}
                        className="text-xs text-stone-500 hover:text-stone-800 underline cursor-pointer"
                      >
                        Bỏ chọn
                      </button>
                    </div>
                  )}

                  {/* THANH SOẠN THẢO TIN NHẮN (COMPOSER) */}
                  <div className="p-3.5 sm:p-4 bg-white border-t border-[#E8E4DC]">
                    <form
                      onSubmit={handleSend}
                      className="bg-[#F8F6F2] rounded-2xl p-2.5 sm:p-3 border border-[#E8E4DC] focus-within:border-[#1C1A18] focus-within:bg-white transition-all"
                    >
                      {/* Hidden File Input */}
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />

                      <textarea
                        ref={textareaRef}
                        value={inputText}
                        onChange={(e) => {
                          setInputText(e.target.value);
                          sendTyping();
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSend();
                          }
                        }}
                        rows={2}
                        placeholder={
                          isShopOwner
                            ? 'Nhập tin nhắn giải đáp khách hàng (Nhấn Enter để gửi)...'
                            : 'Nhập tin nhắn trao đổi hoặc yêu cầu với Shop Owner...'
                        }
                        className="w-full bg-transparent text-xs text-[#1C1A18] placeholder-stone-400 focus:outline-none resize-none leading-relaxed"
                      />

                      <div className="flex items-center justify-between pt-2 mt-1 border-t border-[#E8E4DC]/60">
                        {/* Tiện ích đính kèm ảnh & biểu tượng cảm xúc */}
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="p-1.5 text-stone-500 hover:text-stone-900 hover:bg-stone-200/60 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                            title="Gửi ảnh kiểm tra hiện trạng hoặc giấy tờ"
                          >
                            <span className="material-symbols-outlined text-lg">add_photo_alternate</span>
                            <span className="text-[11px] font-semibold hidden sm:inline">Gửi ảnh</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setInputText((prev) => `${prev} 👍`)}
                            className="p-1.5 text-stone-500 hover:text-stone-900 hover:bg-stone-200/60 rounded-lg transition-colors cursor-pointer"
                            title="Biểu tượng cảm xúc"
                          >
                            <span className="material-symbols-outlined text-lg">sentiment_satisfied</span>
                          </button>
                        </div>

                        {/* Nút gửi tin nhắn */}
                        <button
                          type="submit"
                          disabled={(!inputText.trim() && !selectedImageFile) || isSending || isUploadingImage}
                          className="px-5 py-2 rounded-full bg-[#1C1A18] text-white hover:bg-black font-semibold text-xs flex items-center gap-2 shadow-xs transition-all hover:scale-[1.02] active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          {isUploadingImage ? (
                            <>
                              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              <span>Đang tải ảnh...</span>
                            </>
                          ) : isSending ? (
                            <>
                              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              <span>Đang gửi...</span>
                            </>
                          ) : (
                            <>
                              <span>Gửi</span>
                              <span className="material-symbols-outlined text-sm">send</span>
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                    <p className="text-[10px] text-[#76726B] mt-2 text-center">
                      Tin nhắn hiển thị tức thời qua Socket.IO và được lưu vết an toàn trong hồ sơ đối soát hệ thống.
                    </p>
                  </div>
                </>
              ) : (
                /* Trạng thái chưa chọn cuộc trò chuyện (dành cho Shop Owner) */
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3 bg-[#FAF8F5]">
                  <div className="w-16 h-16 rounded-3xl bg-[#EAE6DE] text-[#1C1A18] flex items-center justify-center shadow-xs">
                    <span className="material-symbols-outlined text-3xl">chat</span>
                  </div>
                  <h3 className="font-serif text-lg font-bold text-[#1C1A18]">
                    Chọn một cuộc trò chuyện để bắt đầu
                  </h3>
                  <p className="text-xs text-[#76726B] max-w-sm leading-relaxed">
                    Chọn khách hàng từ danh sách bên trái để kiểm tra tin nhắn, hình ảnh hiện vật và trả lời trực tiếp.
                  </p>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* ── LIGHTBOX ZOOM ẢNH MODAL ── */}
      {zoomImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setZoomImage(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-white rounded-2xl overflow-hidden shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 py-3 bg-[#1C1A18] text-white flex items-center justify-between">
              <span className="text-xs font-bold">{zoomImage.title || 'Chi tiết hình ảnh'}</span>
              <div className="flex items-center gap-2">
                <a
                  href={zoomImage.url}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1 hover:bg-white/20 rounded text-xs flex items-center gap-1 text-white"
                  title="Mở tab mới"
                >
                  <span className="material-symbols-outlined text-base">open_in_new</span>
                </a>
                <button
                  type="button"
                  onClick={() => setZoomImage(null)}
                  className="p-1 hover:bg-white/20 rounded text-stone-300 hover:text-white"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="p-2 flex-1 overflow-auto flex items-center justify-center bg-black/5">
              <img
                src={zoomImage.url}
                alt={zoomImage.title || 'Preview'}
                className="max-h-[80vh] w-auto object-contain rounded-lg"
              />
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL HOTLINE THẨM ĐỊNH ── */}
      {isHotlineOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setIsHotlineOpen(false)}
        >
          <div
            className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-[#E8E4DC] space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-2xl">support_agent</span>
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-serif text-lg font-bold text-[#1C1A18]">
                Hotline Kỹ Thuật &amp; Thẩm Định
              </h3>
              <p className="text-xs text-[#76726B]">
                Đường dây nóng kết nối trực tiếp với Trưởng Atelier Vũ Thanh Tùng
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E8E4DC] space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[#76726B]">Số điện thoại:</span>
                <a
                  href="tel:19008899"
                  className="font-mono font-bold text-emerald-800 text-sm hover:underline"
                >
                  1900 8899 (Phím 2)
                </a>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#76726B]">Thời gian làm việc:</span>
                <span className="font-semibold text-[#1C1A18]">08:00 - 22:00 (Hằng ngày)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#76726B]">Cam kết phản hồi (SLA):</span>
                <span className="font-semibold text-emerald-700">Dưới 15 phút</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsHotlineOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-[#E8E4DC] hover:bg-stone-50 font-semibold text-xs text-[#1C1A18] cursor-pointer"
              >
                Đóng
              </button>
              <a
                href="tel:19008899"
                className="flex-1 py-2.5 rounded-xl bg-[#1C1A18] text-white hover:bg-black font-semibold text-xs flex items-center justify-center gap-1.5 shadow-xs"
              >
                <span className="material-symbols-outlined text-sm">call</span>
                <span>Gọi ngay</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatPage;
