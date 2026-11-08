import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { UserSidebar } from '../../components/layout/UserSidebar';
import { getSocket } from '../../services/socket';
import {
  getMyConversationApi,
  getMessagesApi,
  deleteConversationApi,
} from '../../services/chat.api';
import type {
  ConversationItem,
  ChatMessageItem,
} from '../../services/chat.api';

interface ChatMessage {
  id: string;
  sender: 'atelier' | 'customer' | 'system';
  senderName: string;
  senderAvatar?: string;
  senderRole?: string;
  timestamp: string;
  content: string;
  bullets?: string[];
  photos?: Array<{
    title: string;
    url: string;
  }>;
  attachment?: {
    name: string;
    size: string;
    type: string;
  };
  deliveryPill?: string;
  systemDetails?: {
    title: string;
    amount?: string;
    code?: string;
  };
}

export const ChatPage: React.FC = () => {
  const { user } = useAuth();
  const currentUserId = user?._id || user?.id || '';
  const [searchParams] = useSearchParams();
  const orderIdParam = searchParams.get('orderId');

  // Scroll to top
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Customer info
  const customerName = user?.fullName || 'Khách Hàng ReUse';
  const customerAvatar =
    user?.avatarUrl ||
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150';

  // Topic filter ('rent' | 'thrift' | 'all')
  const [activeTopic, setActiveTopic] = useState<'all' | 'rent' | 'thrift' | 'contax'>('rent');

  // Input & state
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [conversation, setConversation] = useState<ConversationItem | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const navigate = useNavigate();

  // Modals
  const [isHotlineOpen, setIsHotlineOpen] = useState(false);
  const [isContractOpen, setIsContractOpen] = useState(false);
  const [zoomImage, setZoomImage] = useState<{ title: string; url: string } | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Xác nhận xóa hội thoại từ phía người dùng
  const handleConfirmDelete = async () => {
    if (!conversation?._id) return;
    setIsDeleting(true);
    try {
      await deleteConversationApi(conversation._id);
      setMessages([]);
      setConversation(null);
      setShowDeleteModal(false);
      showToast('Đã xóa toàn bộ lịch sử cuộc trò chuyện thành công!');
    } catch {
      showToast('Có lỗi xảy ra khi xóa cuộc trò chuyện. Vui lòng thử lại!');
    } finally {
      setIsDeleting(false);
    }
  };

  // Hàm chuyển đổi từ ChatMessageItem (DB) sang ChatMessage (UI)
  const mapApiMessageToUi = useCallback((m: ChatMessageItem, currentUid: string): ChatMessage => {
    const senderIdStr = typeof m.senderId === 'object' ? m.senderId._id : m.senderId;
    const isMe = senderIdStr === currentUid;
    const senderFullName = typeof m.senderId === 'object' ? m.senderId.fullName : undefined;
    const senderAvatarUrl = typeof m.senderId === 'object' ? m.senderId.avatarUrl : undefined;

    return {
      id: m._id,
      sender: isMe ? 'customer' : 'atelier',
      senderName: isMe ? customerName : senderFullName || 'Atelier Chronos & Optics (Xưởng)',
      senderAvatar: isMe ? customerAvatar : senderAvatarUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      senderRole: isMe ? undefined : 'CUSTODIAN',
      timestamp: m.createdAt
        ? new Date(m.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
        : 'Vừa xong',
      content: m.text || '',
      photos: m.imageUrl ? [{ title: 'Ảnh đính kèm', url: m.imageUrl }] : undefined,
    };
  }, [customerName, customerAvatar]);

  // Nạp cuộc trò chuyện THẬT từ MongoDB theo kênh RENT hoặc THRIFT
  useEffect(() => {
    let isSubscribed = true;
    const serviceType = activeTopic === 'thrift' ? 'THRIFT' : 'RENT';

    getMyConversationApi({ serviceType })
      .then(async (conv) => {
        if (!isSubscribed) return;
        setConversation(conv);

        // Tham gia Socket Room của cuộc trò chuyện này
        const socket = getSocket();
        socket.emit('join_room', { conversationId: conv._id });

        // Tải lịch sử tin nhắn thật từ DB
        const res = await getMessagesApi(conv._id);
        if (isSubscribed) {
          const mapped = (res.messages || []).map((m) => mapApiMessageToUi(m, currentUserId));
          setMessages(mapped);
        }
      })
      .catch((err) => {
        console.warn('Lỗi tải cuộc trò chuyện với Xưởng:', err);
      });

    return () => {
      isSubscribed = false;
    };
  }, [activeTopic, currentUserId, mapApiMessageToUi]);

  // Lắng nghe tin nhắn mới REAL-TIME từ Socket.IO
  useEffect(() => {
    const socket = getSocket();

    const handleNewMessage = (m: ChatMessageItem) => {
      if (!conversation || String(m.conversationId) !== String(conversation._id)) return;
      const msgIdStr = String(m._id);
      const clientMsgIdStr = m.clientMsgId ? String(m.clientMsgId) : "";
      const uiMsg = mapApiMessageToUi(m, currentUserId);

      setMessages((prev) => {
        // 1. Đã có trong danh sách -> Bỏ qua
        if (prev.some((item) => String(item.id) === msgIdStr)) return prev;

        // 2. Trùng clientMsgId với tin optimistic -> Thay thế
        if (clientMsgIdStr && prev.some((item) => String(item.id) === clientMsgIdStr)) {
          return prev.map((item) => (String(item.id) === clientMsgIdStr ? uiMsg : item));
        }

        // 3. Nếu là tin nhắn của chính mình và có tin tạm cùng text -> Thay thế
        const senderIdStr = typeof m.senderId === "object" ? String(m.senderId._id) : String(m.senderId);
        if (senderIdStr === String(currentUserId)) {
          const tempIdx = prev.findIndex((item) => String(item.id).startsWith("temp-") && item.content === m.text);
          if (tempIdx !== -1) {
            const clone = [...prev];
            clone[tempIdx] = uiMsg;
            return clone;
          }
        }

        // 4. Tin nhắn từ đối phương -> Thêm mới
        return [...prev, uiMsg];
      });
    };

    const handleUserTyping = (data: { conversationId: string; userId: string }) => {
      if (conversation && data.conversationId === conversation._id && data.userId !== currentUserId) {
        setIsTyping(true);
      }
    };

    const handleUserStopTyping = (data: { conversationId: string }) => {
      if (conversation && data.conversationId === conversation._id) {
        setIsTyping(false);
      }
    };

    socket.on('new_message', handleNewMessage);
    socket.on('user_typing', handleUserTyping);
    socket.on('user_stop_typing', handleUserStopTyping);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('user_typing', handleUserTyping);
      socket.off('user_stop_typing', handleUserStopTyping);
    };
  }, [conversation, currentUserId, mapApiMessageToUi]);

  // Auto-scroll chat to bottom
  const messageEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Gửi tin nhắn REAL-TIME tới Xưởng Shop Owner
  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || !conversation) return;

    setInputText('');
    const socket = getSocket();
    socket.emit('stop_typing', { conversationId: conversation._id });

    // Optimistic UI update
    const tempId = `temp-${Date.now()}`;
    const optimisticMsg: ChatMessage = {
      id: tempId,
      sender: 'customer',
      senderName: customerName,
      senderAvatar: customerAvatar,
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      content: text,
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    // Gửi qua Socket.IO tới Shop Owner kèm clientMsgId để đối soát không bị nhân đôi
    socket.emit(
      'send_message',
      {
        conversationId: conversation._id,
        text,
        clientMsgId: tempId,
      },
      (ack: { success?: boolean; data?: ChatMessageItem }) => {
        if (ack?.success && ack?.data) {
          setMessages((prev) =>
            prev.map((item) => (item.id === tempId ? mapApiMessageToUi(ack.data!, currentUserId) : item))
          );
        }
      }
    );
  };

  // Typing emitter
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    if (!conversation) return;
    const socket = getSocket();
    socket.emit('typing', { conversationId: conversation._id });
  };


  return (
    <div className="min-h-screen flex flex-col bg-[#FBF9F5] text-brand-charcoal antialiased selection:bg-[#E8E2D5]">
      {/* ── TOP BANNER (Circular Escrow Commitment) ── */}
      <div className="bg-brand-charcoal text-[#EBE6DD] text-[11px] sm:text-xs font-medium tracking-wide py-1.5 px-4 text-center border-b border-[#36322D]">
        <span>THUÊ NHỮNG GÌ BẠN CẦN · TÁI SỬ DỤNG NHỮNG GÌ ĐÃ CÓ · BẢO HIỂM HÀNG HÓA MINH BẠCH 100% VỚI SMART ESCROW</span>
      </div>

      {/* ── TOAST NOTIFICATION ── */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 px-5 py-3.5 rounded-xl shadow-2xl flex items-center gap-3 border bg-brand-charcoal text-white border-brand-charcoal/80 animate-fadeIn">
          <span className="material-symbols-outlined text-lg text-[#E7C890]">verified</span>
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

      {/* ── MAIN APP CONTAINER (Persistent Left Sidebar + Main Content) ── */}
      <div className="flex-1 max-w-[1520px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 flex gap-8">
        {/* PERSISTENT CUSTOMER SIDEBAR */}
        <aside className="w-64 shrink-0 hidden lg:block">
          <UserSidebar activeKey="chat" />
        </aside>

        {/* MAIN DASHBOARD CONTENT AREA */}
        <main className="flex-1 min-w-0 space-y-6">
          <div className="flex flex-col w-full">
            {/* Page Context Sub-Navigation & Header Ribbon */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-brand-border/60">
              <div>
                <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-brand-muted font-bold mb-1.5">
                  <span className="inline-block w-2 h-2 rounded-full bg-brand-sage animate-pulse" />
                  <span>Concierge Kỹ thuật &amp; Giám định Độc quyền</span>
                  <span className="text-brand-border">/</span>
                  <span className="text-brand-charcoal">Phòng Đối Thoại Trực Tiếp</span>
                </div>
                <h1 className="font-serif text-2xl lg:text-3xl text-brand-charcoal font-bold tracking-tight">
                  Atelier Silvergrain Concierge
                </h1>
                <p className="text-xs text-brand-muted mt-1 font-sans">
                  Kênh trao đổi trực tiếp độc quyền giữa khách hàng{' '}
                  <span className="font-semibold text-brand-charcoal">{customerName}</span> và Trưởng Kỹ thuật Viên Thẩm
                  định <span className="font-semibold text-brand-charcoal">Phạm Thùy Dương</span>.
                </p>
              </div>

              {/* Atelier Verification Badge */}
              <div className="flex items-center gap-3 bg-white px-4 py-2.5 rounded-2xl border border-brand-border shadow-2xs self-start md:self-auto">
                <div className="relative">
                  <img
                    className="w-10 h-10 rounded-full object-cover ring-2 ring-brand-sage/30"
                    alt="Chân dung nghệ nhân giám định Phạm Thùy Dương"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuDTh1J0ai_UCuCvrMaON5TH-yoipsRqE6EideHgA7cymyCQOyd7H9Gw_xObXbBp8bkPgmE0BuAl2npsRyu3eTbl4iuW7l0_G-Dce4HOpPkE8bBaix3pG4jYpf6ku54qL4z3Krpia8DnirFBvMIB2SR_YuOXg_tz8hzKhpl-iFnsuzXZ4oOj4q2oOzttKBJt5a6HpfQM7egOYNk5zcFbp7PJNAzlohAMWXzSDuqsJWqj"
                  />
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-brand-sage rounded-full border-2 border-white" />
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-brand-charcoal">Phạm Thùy Dương</span>
                    <span className="text-[9px] bg-brand-charcoal text-white font-semibold px-1.5 py-0.5 rounded tracking-wider">
                      CUSTODIAN
                    </span>
                  </div>
                  <span className="text-[10px] text-brand-muted flex items-center gap-1 mt-0.5">
                    <span className="material-symbols-outlined text-[12px] text-brand-sage">verified</span>
                    Chứng nhận Giám định Tier-1 · SLA 15 phút
                  </span>
                </div>
              </div>
            </div>

            {/* Filter Context Ribbons / Topic Chips */}
            <div className="py-4 flex flex-wrap items-center justify-between gap-3 border-b border-brand-border/40">
              <div className="flex items-center gap-2 overflow-x-auto thin-scrollbar pb-1 md:pb-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-muted mr-1">
                  Luồng trao đổi:
                </span>
                <button
                  type="button"
                  onClick={() => setActiveTopic('all')}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                    activeTopic === 'all'
                      ? 'bg-brand-charcoal text-white shadow-2xs'
                      : 'bg-white hover:bg-brand-surface border border-brand-border text-brand-charcoal'
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">all_inbox</span>
                  Tất cả phiên
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTopic('rent')}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 shrink-0 cursor-pointer border ${
                    activeTopic === 'rent'
                      ? 'bg-brand-charcoal text-white border-brand-charcoal'
                      : 'bg-white hover:bg-brand-surface border-brand-border text-brand-charcoal'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-brand-sage" />
                  Thuê #RH-RNT-2024-8845 (Hasselblad 907X)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTopic('thrift')}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 shrink-0 cursor-pointer border ${
                    activeTopic === 'thrift'
                      ? 'bg-brand-charcoal text-white border-brand-charcoal'
                      : 'bg-white hover:bg-brand-surface border-brand-border text-brand-charcoal'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-[#C88A37]" />
                  Thrift #RH-THF-2025-0814 (Leica M6 Classic)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTopic('contax')}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 shrink-0 cursor-pointer border ${
                    activeTopic === 'contax'
                      ? 'bg-brand-charcoal text-white border-brand-charcoal'
                      : 'bg-white hover:bg-brand-surface border-brand-border text-brand-muted hover:text-brand-charcoal'
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">help_outline</span>
                  Tư vấn quang sai Contax T2
                </button>
              </div>

              {/* Quick Status Pill */}
              <div className="text-[11px] font-medium text-brand-muted flex items-center gap-2">
                <span className="material-symbols-outlined text-sm text-brand-sage">lock</span>
                Kênh mã hóa đối kiểm Smart Escrow tuần hoàn
              </div>
            </div>

            {/* Master Chat Workspace (2 Columns: Message Salon & Reference Specimen Drawer) */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 mt-6 items-start">
              {/* LEFT: Main Correspondence Salon (8 Cols) */}
              <div className="xl:col-span-8 flex flex-col bg-white rounded-3xl border border-brand-border/80 shadow-sm overflow-hidden">
                {/* Thread Header Bar */}
                <div className="px-6 py-4 bg-brand-surface/70 border-b border-brand-border/60 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-brand-sand flex items-center justify-center text-brand-charcoal">
                      <span className="material-symbols-outlined text-xl">precision_manufacturing</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-sm font-bold text-brand-charcoal">
                          {activeTopic === 'rent'
                            ? 'Phiên kiểm định: Hasselblad 907X 50C (Thuê RENT)'
                            : activeTopic === 'thrift'
                            ? 'Phiên lưu kho: Leica M6 Classic 0.72x (Mua THRIFT)'
                            : activeTopic === 'contax'
                            ? 'Tư vấn quang sai & Đo tốc cơ khí Contax T2'
                            : 'Phiên thẩm định: Leica M6 Classic & Hasselblad 907X'}
                        </h2>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-sage/15 text-brand-sage uppercase">
                          Đang mở
                        </span>
                      </div>
                      <p className="text-[11px] text-brand-muted">
                        Mã tham chiếu đối soát:{' '}
                        <span className="font-mono text-brand-charcoal">
                          {orderIdParam ? `#REF-${orderIdParam}` : 'SES-2024-VN-0982'}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="p-2 text-brand-muted hover:text-brand-charcoal hover:bg-brand-sand/50 rounded-xl transition-colors cursor-pointer"
                      title="Tải biên bản đối soát"
                      onClick={() => {
                        showToast('Đang tải biên bản đối soát kỹ thuật số AES-256...');
                        window.print();
                      }}
                    >
                      <span className="material-symbols-outlined text-lg">folder_open</span>
                    </button>
                    <button
                      type="button"
                      className="px-3 py-1.5 rounded-xl border border-brand-border bg-white hover:bg-brand-sand/30 text-xs font-semibold text-brand-charcoal flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Gọi khẩn cấp Atelier Concierge"
                      onClick={() => setIsHotlineOpen(true)}
                    >
                      <span className="material-symbols-outlined text-sm text-brand-sage">call</span>
                      <span className="hidden sm:inline">Hotline Kỹ thuật</span>
                    </button>

                    {/* Icon Thùng rác để Xóa chat (chỉ hiện modal khi bấm vào đây) */}
                    <button
                      type="button"
                      onClick={() => setShowDeleteModal(true)}
                      className="p-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-700 flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                      title="Xóa cuộc trò chuyện (Bấm vào thùng rác)"
                    >
                      <span className="material-symbols-outlined text-base">delete</span>
                    </button>

                    {/* Nút Đóng chat (thoát phòng chat ngay lập tức, không hiện modal) */}
                    <button
                      type="button"
                      onClick={() => navigate(-1)}
                      className="px-3 py-1.5 rounded-xl border border-brand-border bg-white hover:bg-brand-sand/40 text-xs font-semibold text-brand-charcoal flex items-center gap-1.5 transition-all cursor-pointer"
                      title="Đóng phòng chat"
                    >
                      <span className="material-symbols-outlined text-sm">close</span>
                      <span className="hidden sm:inline">Đóng chat</span>
                    </button>
                  </div>
                </div>

                {/* Scrollable Message Canvas */}
                <div className="p-6 space-y-6 max-h-[640px] overflow-y-auto thin-scrollbar bg-[#FAF8F5]">
                  {/* Day Timestamp Divider */}
                  <div className="flex items-center justify-center my-2">
                    <div className="h-px bg-brand-border/80 flex-1" />
                    <span className="px-4 text-[10px] uppercase font-bold tracking-widest text-brand-muted bg-[#FAF8F5]">
                      Hôm nay, 14 Tháng 3, 2026
                    </span>
                    <div className="h-px bg-brand-border/80 flex-1" />
                  </div>

                  {/* Messages Mapping */}
                  {messages.map((msg) => {
                    if (msg.sender === 'system') {
                      return (
                        <div
                          key={msg.id}
                          className="mx-auto max-w-md bg-white/90 border border-brand-border/70 rounded-2xl p-3.5 shadow-2xs flex items-start gap-3"
                        >
                          <div className="w-8 h-8 rounded-full bg-brand-sage-light text-brand-sage flex items-center justify-center shrink-0 mt-0.5">
                            <span className="material-symbols-outlined text-base">verified_user</span>
                          </div>
                          <div className="flex-1 text-xs">
                            <p className="font-bold text-brand-charcoal">{msg.systemDetails?.title}</p>
                            <p className="text-[11px] text-brand-muted mt-0.5">{msg.content}</p>
                            <span className="text-[10px] text-brand-taupe mt-1 block font-mono">
                              {msg.timestamp} · Mã giao dịch {msg.systemDetails?.code}
                            </span>
                          </div>
                        </div>
                      );
                    }

                    if (msg.sender === 'customer') {
                      return (
                        <div key={msg.id} className="flex items-start gap-3.5 max-w-xl ml-auto flex-row-reverse">
                          <img
                            className="w-9 h-9 rounded-full object-cover ring-1 ring-brand-border shrink-0 mt-1"
                            src={msg.senderAvatar || customerAvatar}
                            alt={msg.senderName}
                          />
                          <div className="space-y-1.5 flex-1 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <span className="text-[10px] text-brand-muted">{msg.timestamp}</span>
                              <span className="text-xs font-bold text-brand-charcoal">{msg.senderName}</span>
                            </div>
                            <div className="bg-brand-charcoal text-white p-4 rounded-2xl rounded-tr-sm text-xs leading-relaxed shadow-sm space-y-2 text-left">
                              <p className="whitespace-pre-line">{msg.content}</p>
                              {msg.bullets && msg.bullets.length > 0 && (
                                <ul className="list-disc list-inside space-y-1 text-white/90 text-[11px] pt-1">
                                  {msg.bullets.map((b, bIdx) => (
                                    <li key={bIdx}>{b}</li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    }

                    // Atelier message
                    return (
                      <div key={msg.id} className="flex items-start gap-3.5 max-w-2xl">
                        <img
                          className="w-9 h-9 rounded-full object-cover ring-1 ring-brand-border shrink-0 mt-1"
                          src={
                            msg.senderAvatar ||
                            'https://lh3.googleusercontent.com/aida-public/AB6AXuBgD0AT7Kf7zh1FWCGtS5UNoE5w02BFo5pBVmKhaNprtLB3NK_ZXDMUX0Z9EksTo5nlrg_XxyFrd7yBBzZbDcefEzU2R2MZ3HK-BwBSHL0Tnq9t2WdQqCvJSeYFuzzp3zLblmYxmMT6wr58VHRXv1a8yPcrilEixvfz0zPZ-12xlqR2I1dyuKOJ0X5V9-MtcWon9621TvJ2Ws0eYhpcKTA5DpQiOpSBXFnYmOlj5Bx-'
                          }
                          alt={msg.senderName}
                        />
                        <div className="space-y-1.5 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-brand-charcoal">{msg.senderName}</span>
                            <span className="text-[10px] text-brand-muted">{msg.timestamp}</span>
                          </div>
                          <div className="bg-white p-4 rounded-2xl rounded-tl-sm border border-brand-border text-xs text-brand-charcoal leading-relaxed shadow-2xs space-y-3">
                            <p className="whitespace-pre-line">{msg.content}</p>

                            {/* Photo gallery preview */}
                            {msg.photos && msg.photos.length > 0 && (
                              <div className="grid grid-cols-3 gap-2 pt-1">
                                {msg.photos.map((ph, pIdx) => (
                                  <div
                                    key={pIdx}
                                    className="relative group rounded-xl overflow-hidden aspect-4/3 border border-brand-border/60 cursor-pointer"
                                    onClick={() => setZoomImage({ title: ph.title, url: ph.url })}
                                  >
                                    <img
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                      src={ph.url}
                                      alt={ph.title}
                                    />
                                    <span className="absolute bottom-1 left-1.5 text-[9px] bg-black/70 text-white font-mono px-1 rounded">
                                      {ph.title}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* PDF Attachment card */}
                            {msg.attachment && (
                              <div className="mt-2 flex items-center justify-between p-3 rounded-xl bg-brand-surface border border-brand-border/70 hover:bg-brand-sand/40 transition-colors">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-8 h-8 rounded-lg bg-[#C84337]/10 text-[#C84337] flex items-center justify-center font-bold text-xs">
                                    PDF
                                  </div>
                                  <div>
                                    <p className="text-xs font-bold text-brand-charcoal">{msg.attachment.name}</p>
                                    <p className="text-[10px] text-brand-muted">
                                      {msg.attachment.size} · Ký số bởi Atelier Silvergrain Lab
                                    </p>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  className="px-3 py-1 rounded-lg bg-white border border-brand-border text-[11px] font-semibold text-brand-charcoal hover:bg-brand-surface shadow-2xs flex items-center gap-1 cursor-pointer"
                                  onClick={() => {
                                    showToast('Đang tải xuống biên bản đo Collimator...');
                                    window.print();
                                  }}
                                >
                                  <span className="material-symbols-outlined text-sm">download</span>
                                  Tải về
                                </button>
                              </div>
                            )}

                            {/* Delivery Seal Pill */}
                            {msg.deliveryPill && (
                              <div className="p-2.5 rounded-xl bg-brand-sage-light text-brand-sage font-medium text-[11px] flex items-center gap-2">
                                <span className="material-symbols-outlined text-base">local_shipping</span>
                                <span>{msg.deliveryPill}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Typing Indicator */}
                  {isTyping && (
                    <div className="flex items-center gap-2 text-xs text-brand-muted italic pl-12 animate-pulse">
                      <span className="w-2 h-2 rounded-full bg-brand-sage animate-ping" />
                      <span>Phạm Thùy Dương đang phản hồi câu hỏi kỹ thuật...</span>
                    </div>
                  )}

                  <div ref={messageEndRef} />
                </div>


                {/* Rich Composer Box */}
                <div className="p-4 bg-white border-t border-brand-border/60">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSendMessage();
                    }}
                    className="bg-brand-surface rounded-2xl p-3 border border-brand-border/80 focus-within:border-brand-charcoal focus-within:bg-white transition-all"
                  >
                    <textarea
                      className="w-full bg-transparent text-xs text-brand-charcoal placeholder-brand-muted focus:outline-none resize-none leading-relaxed"
                      placeholder="Nhập tin nhắn trao đổi kỹ thuật hoặc yêu cầu với Trưởng Atelier Phạm Thùy Dương..."
                      rows={2}
                      value={inputText}
                      onChange={handleInputChange}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                    />
                    <div className="flex items-center justify-between pt-2 mt-1 border-t border-brand-border/40">
                      {/* Media & Reference Shortcuts */}
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          className="p-1.5 text-brand-muted hover:text-brand-charcoal hover:bg-brand-sand/60 rounded-lg transition-colors cursor-pointer"
                          title="Đính kèm ảnh hiện trạng hoặc tài liệu"
                          onClick={() => showToast('Đã đính kèm ảnh kiểm tra thấu kính thực tế.')}
                        >
                          <span className="material-symbols-outlined text-lg">add_a_photo</span>
                        </button>
                        <button
                          type="button"
                          className="p-1.5 text-brand-muted hover:text-brand-charcoal hover:bg-brand-sand/60 rounded-lg transition-colors cursor-pointer"
                          title="Đính kèm tệp hồ sơ"
                          onClick={() => showToast('Đã đính kèm tệp hồ sơ lưu ký.')}
                        >
                          <span className="material-symbols-outlined text-lg">attach_file</span>
                        </button>
                        <button
                          type="button"
                          className="p-1.5 text-brand-muted hover:text-brand-charcoal hover:bg-brand-sand/60 rounded-lg transition-colors flex items-center gap-1 text-[11px] font-semibold cursor-pointer"
                          title="Gắn mã tham chiếu đơn hàng"
                          onClick={() => {
                            setInputText((prev) => `${prev} [Đơn tham chiếu: #RH-RNT-2024-8845]`);
                          }}
                        >
                          <span className="material-symbols-outlined text-lg">tag</span>
                          <span className="hidden sm:inline">Gắn thẻ đơn</span>
                        </button>
                        <button
                          type="button"
                          className="p-1.5 text-brand-muted hover:text-brand-charcoal hover:bg-brand-sand/60 rounded-lg transition-colors cursor-pointer"
                          title="Biểu tượng cảm xúc"
                          onClick={() => setInputText((prev) => `${prev} 👍`)}
                        >
                          <span className="material-symbols-outlined text-lg">sentiment_satisfied</span>
                        </button>
                      </div>

                      {/* Send Action Button */}
                      <button
                        type="submit"
                        className="px-5 py-2 rounded-full bg-brand-charcoal text-white hover:bg-black font-semibold text-xs flex items-center gap-2 shadow-xs transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
                      >
                        <span>Gửi tin nhắn</span>
                        <span className="material-symbols-outlined text-sm">send</span>
                      </button>
                    </div>
                  </form>
                  <p className="text-[10px] text-brand-taupe mt-2 text-center">
                    Mọi thỏa thuận về điều kiện máy và gia hạn đều được ghi nhận tự động vào Hợp đồng Lưu ký Điện tử ReUse
                    Hub.
                  </p>
                </div>
              </div>

              {/* RIGHT: Active Reference Specimen & Order Drawer (4 Cols) */}
              <div className="xl:col-span-4 space-y-6">
                {/* Specimen #1: Hasselblad 907X (Currently in Rent) */}
                <div className="bg-white rounded-3xl p-5 border border-brand-border/80 shadow-sm space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-brand-border/60">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-brand-sage animate-ping" />
                      <span className="text-xs font-bold uppercase tracking-wider text-brand-charcoal">
                        Hiện vật đang liên kết (RENT)
                      </span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-brand-sand text-brand-charcoal font-bold">
                      #RH-RNT-8845
                    </span>
                  </div>

                  {/* Item Media Card */}
                  <div className="relative rounded-2xl overflow-hidden aspect-16/10 border border-brand-border/60 bg-brand-sand">
                    <img
                      className="w-full h-full object-cover"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuAGzgCQfJQ_ymumzHvCwbZ71wuEh7ts1Kl_6UT2dId2VJ3xW5NU4zPutOAAPZJei60vN2GRpL6ilK1x39QshyAOV7OdyaDbqX8Sh_qsLrND1FpWXqhcnrOBwAX5cLM7vQPDMr_oV_oDJP4NLK2wIU1JgL_MvINgQpo8-dGFvgoMC0GCHi8MHAgfgDhanub-EqSouF_yVRECOcVGFSii4mN4kzRWUNq8q9Ch8ujUlCQQ"
                      alt="Hasselblad 907X 50C"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent flex flex-col justify-end p-3.5 text-white">
                      <span className="text-[10px] font-mono uppercase tracking-widest text-brand-sand font-semibold">
                        Medium Format Digital Back
                      </span>
                      <h3 className="text-sm font-bold font-serif leading-tight">Hasselblad 907X 50C + XCD 45mm f/4 P</h3>
                    </div>
                  </div>

                  {/* Specimen Metadata Grid */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-brand-surface border border-brand-border/50">
                      <span className="text-[10px] text-brand-muted block uppercase">Tình trạng vật lý</span>
                      <span className="font-bold text-brand-charcoal">Mint 98.5% (Like New)</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-brand-surface border border-brand-border/50">
                      <span className="text-[10px] text-brand-muted block uppercase">Thời hạn thuê</span>
                      <span className="font-bold text-brand-charcoal">5 Ngày (14/03 - 19/03)</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-brand-surface border border-brand-border/50">
                      <span className="text-[10px] text-brand-muted block uppercase">Ký quỹ Smart Escrow</span>
                      <span className="font-bold text-brand-sage">38.000.000₫ (Đã khóa)</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-brand-surface border border-brand-border/50">
                      <span className="text-[10px] text-brand-muted block uppercase">Bảo hiểm va đập</span>
                      <span className="font-bold text-brand-charcoal">Hạng Diamond P1</span>
                    </div>
                  </div>

                  {/* Quick Specimen CTAs */}
                  <div className="space-y-2 pt-1">
                    <Link
                      className="w-full py-2.5 px-3 rounded-xl bg-brand-charcoal text-white hover:bg-black font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                      to="/rent/orders"
                    >
                      <span className="material-symbols-outlined text-sm">inventory_2</span>
                      <span>Chi tiết hành trình giao nhận Nanuk</span>
                    </Link>
                    <button
                      type="button"
                      className="w-full py-2 px-3 rounded-xl bg-brand-surface hover:bg-brand-sand border border-brand-border text-brand-charcoal font-medium text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      onClick={() => setIsContractOpen(true)}
                    >
                      <span className="material-symbols-outlined text-sm">history_edu</span>
                      <span>Mở hợp đồng thẩm định 10 điểm</span>
                    </button>
                  </div>
                </div>

                {/* Specimen #2: Leica M6 Classic (Thrift Purchase Order) */}
                <div className="bg-white rounded-3xl p-5 border border-brand-border/80 shadow-sm space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-brand-border/60">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#C88A37]" />
                      <span className="text-xs font-bold uppercase tracking-wider text-brand-charcoal">
                        Hiện vật đang mua (THRIFT)
                      </span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-brand-sand text-brand-charcoal font-bold">
                      #RH-THF-0814
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <img
                      className="w-16 h-16 rounded-xl object-cover border border-brand-border shrink-0"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuDDVdYxCEiyYkrAE-zufpBR55eRsvcHTxjd63zgbIf1Y_MEsOJcTuLKqIjJb2OSmx_DCwvQ9tH-sNSCXSxG_s6YwpZ0cy5BbyhO6t6N3Kb5TRRfhq93eNN8d7SCiy1fCkVkiu1J8JfGp8GrVzadLRLZ6Xkxo7Xq167ryh6QolMuiyJpd9vyEGaGneW24Cf7eACqSkcD1tsoryWs6uwlfhYUdicRF72P4a45ZywevEhx"
                      alt="Leica M6 Classic"
                    />
                    <div className="overflow-hidden">
                      <h4 className="text-xs font-bold text-brand-charcoal truncate">
                        Leica M6 Classic 0.72x (Serial #2481920)
                      </h4>
                      <p className="text-[11px] text-brand-muted">Nguồn gốc: Sưu tập cá nhân Munich, Đức</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs font-bold text-brand-charcoal">64.500.000₫</span>
                        <span className="text-[9px] bg-brand-sage-light text-brand-sage px-1.5 py-0.5 rounded font-bold uppercase">
                          Cửa sổ kiểm tra 72h
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-brand-sand/60 border border-brand-border text-[11px] text-brand-muted space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-brand-charcoal">
                      <span className="material-symbols-outlined text-sm text-brand-sage">shield</span>
                      <span>Quyền lợi đối kiểm Atelier</span>
                    </div>
                    <p className="leading-relaxed">
                      Bạn có toàn quyền kiểm tra máy trong 72 giờ thực nghiệm film trước khi hệ thống giải ngân tiền về
                      chủ sở hữu cũ.
                    </p>
                  </div>
                </div>

                {/* Custodian Atelier Credential Card */}
                <div className="bg-gradient-to-br from-[#F5F2EB] to-[#EAE5DC] rounded-3xl p-5 border border-brand-border text-brand-charcoal space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-muted">
                    <span className="material-symbols-outlined text-base text-brand-charcoal">workspace_premium</span>
                    <span>Hồ Sơ Atelier Silvergrain</span>
                  </div>
                  <p className="text-xs text-brand-charcoal/90 leading-relaxed">
                    Xưởng thẩm định quang học &amp; cơ học độc quyền ReUse Hub. Đảm nhận 100% quy trình vệ sinh buồng
                    tối, đo màn trập laser Kyoritsu và bảo chứng chứng thư tái lưu thông.
                  </p>
                  <div className="pt-2 border-t border-brand-charcoal/10 flex items-center justify-between text-[11px]">
                    <span className="text-brand-muted">Tỉ lệ hoàn hảo:</span>
                    <span className="font-bold text-brand-charcoal">99.8% (3.420+ lần bàn giao)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* ── MODAL: HOTLINE KỸ THUẬT ATELIER ── */}
      {isHotlineOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-fadeIn border border-brand-border">
            <div className="flex items-center justify-between pb-2 border-b border-brand-border/50">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-xl text-brand-sage">support_agent</span>
                <h3 className="font-serif text-lg font-bold text-brand-charcoal">Hotline Kỹ Thuật Atelier Concierge</h3>
              </div>
              <button
                type="button"
                className="text-brand-muted hover:text-brand-charcoal cursor-pointer"
                onClick={() => setIsHotlineOpen(false)}
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <div className="p-4 bg-brand-surface rounded-2xl space-y-2 text-xs text-brand-charcoal border border-brand-border/50">
              <p className="font-bold text-sm">Trưởng Kỹ Thuật Viên: Phạm Thùy Dương</p>
              <p className="text-brand-muted">Phòng Thẩm Định &amp; Hiệu Chuẩn Quang Học (Saigon Vault)</p>
              <div className="pt-2 flex items-center justify-between">
                <span className="text-xs font-semibold">Đường dây nóng độc quyền:</span>
                <span className="font-mono text-sm font-bold text-brand-sage">1900 8924 · Máy lẻ 102</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold">Thời gian trực kỹ thuật:</span>
                <span className="text-xs font-medium text-brand-charcoal">08:00 - 21:00 hàng ngày</span>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                className="flex-1 py-2.5 rounded-xl bg-brand-surface hover:bg-brand-sand text-brand-charcoal text-xs font-semibold transition-colors cursor-pointer border border-brand-border/60"
                onClick={() => setIsHotlineOpen(false)}
              >
                Đóng
              </button>
              <a
                href="tel:19008924"
                className="flex-1 py-2.5 rounded-xl bg-brand-charcoal hover:bg-black text-white text-xs font-bold transition-all shadow-md text-center flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-sm">call</span>
                <span>Gọi ngay</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: HỢP ĐỒNG THẨM ĐỊNH 10 ĐIỂM ── */}
      {isContractOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl space-y-4 animate-fadeIn border border-brand-border max-h-[85vh] overflow-y-auto thin-scrollbar">
            <div className="flex items-center justify-between pb-2 border-b border-brand-border/50">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-xl text-brand-sage">history_edu</span>
                <h3 className="font-serif text-lg font-bold text-brand-charcoal">Hợp Đồng Thẩm Định 10 Điểm</h3>
              </div>
              <button
                type="button"
                className="text-brand-muted hover:text-brand-charcoal cursor-pointer"
                onClick={() => setIsContractOpen(false)}
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>

            <p className="text-xs text-brand-muted leading-relaxed">
              Biên bản bàn giao kèm kiểm định quang học và cảm biến số độc quyền cho hiện vật{' '}
              <strong className="text-brand-charcoal">Hasselblad 907X 50C + XCD 45mm (#RH-RNT-8845)</strong>.
            </p>

            <div className="space-y-2 text-xs">
              {[
                '1. Vệ sinh buồng sensor và kiểm tra điểm chết (Dead/Stuck Pixels): 0 lỗi.',
                '2. Kiểm tra dung sai trập điện tử và cơ học: ±2.1% (Chuẩn phòng lab).',
                '3. Độ phẳng ngàm thấu kính XCD mount: 100% không cong vênh.',
                '4. Màn hình lật 3.0 inch cảm ứng: Phản hồi nhạy, không ố vàng.',
                '5. Cổng kết nối USB-C Tethering & HDMI: Nhận diện tín hiệu chuẩn xác.',
                '6. Khay 2 khe thẻ nhớ UHS-II: Đọc ghi ổn định tốc độ 300MB/s.',
                '7. Khe pin và lẫy khóa cơ khí: Chắc chắn, kèm 02 pin chính hãng.',
                '8. Bọc đệm chống sốc Nanuk 935: Khử ẩm yếm khí 40% RH.',
                '9. Bảo hiểm rủi ro rơi vỡ Diamond P1: Kích hoạt hiệu lực 100%.',
                '10. Kẹp chì niêm phong ReUse Hub #SP-7718 nguyên vẹn.',
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-xl bg-brand-surface border border-brand-border/40 text-brand-charcoal flex items-center justify-between"
                >
                  <span>{item}</span>
                  <span className="text-[10px] bg-brand-sage-light text-brand-sage font-bold px-1.5 py-0.5 rounded shrink-0 ml-2">
                    ĐẠT CHUẨN
                  </span>
                </div>
              ))}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                className="flex-1 py-2.5 rounded-xl bg-brand-surface hover:bg-brand-sand text-brand-charcoal text-xs font-semibold transition-colors cursor-pointer border border-brand-border/60"
                onClick={() => window.print()}
              >
                In Hợp Đồng
              </button>
              <button
                type="button"
                className="flex-1 py-2.5 rounded-xl bg-brand-charcoal text-white text-xs font-semibold hover:bg-black transition-colors cursor-pointer"
                onClick={() => setIsContractOpen(false)}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: ZOOM ẢNH BÀN THẨM ĐỊNH ── */}
      {zoomImage && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4 animate-fadeIn border border-brand-border">
            <div className="flex items-center justify-between pb-2 border-b border-brand-border/50">
              <h3 className="font-serif text-base font-bold text-brand-charcoal">{zoomImage.title}</h3>
              <button
                type="button"
                className="text-brand-muted hover:text-brand-charcoal cursor-pointer"
                onClick={() => setZoomImage(null)}
              >
                <span className="material-symbols-outlined text-xl">close</span>
              </button>
            </div>
            <div className="rounded-2xl overflow-hidden bg-brand-sand max-h-[60vh]">
              <img src={zoomImage.url} alt={zoomImage.title} className="w-full h-full object-contain" />
            </div>
            <div className="flex justify-end pt-1">
              <button
                type="button"
                className="px-5 py-2 rounded-xl bg-brand-charcoal text-white text-xs font-semibold hover:bg-black transition-colors cursor-pointer"
                onClick={() => setZoomImage(null)}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: XÁC NHẬN XÓA HOẶC HỦY CUỘC TRÒ CHUYỆN ── */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FAF8F5] rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-brand-border">
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 border border-rose-200">
                <span className="material-symbols-outlined text-2xl">delete_forever</span>
              </div>
              <div>
                <h3 className="font-serif text-base font-bold text-brand-charcoal">
                  Xác nhận xóa cuộc trò chuyện?
                </h3>
                <p className="text-xs text-brand-muted mt-1 leading-relaxed">
                  Bạn có chắc chắn muốn xóa toàn bộ lịch sử tin nhắn của phiên trao đổi này không? 
                  Hành động này <span className="font-semibold text-rose-600">không thể hoàn tác</span>.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-brand-border/60">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-brand-charcoal bg-white hover:bg-brand-sand border border-brand-border transition-colors cursor-pointer disabled:opacity-50"
              >
                Hủy
              </button>
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
                    <span className="material-symbols-outlined text-sm">delete</span>
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

export default ChatPage;
