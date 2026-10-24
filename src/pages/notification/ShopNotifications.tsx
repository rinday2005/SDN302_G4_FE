import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';

export interface ShopNotification {
  id: string;
  category: 'orders' | 'listings' | 'messages' | 'escrow';
  subCategory?: string;
  typeBadge: string;
  typeColor: 'rent' | 'thrift' | 'chat' | 'escrow' | 'rejected';
  badgeTag: string;
  isUnread: boolean;
  timeAgo: string;
  datetime: string;
  title: string;
  description: string;
  embeddedBox?: {
    icon: string;
    headline: string;
    subline: string;
    gridItems?: { label: string; value: string; isGreen?: boolean }[];
  };
  quoteText?: string;
  actionText: string;
  actionLink: string;
}

const INITIAL_SHOP_NOTIFICATIONS: ShopNotification[] = [
  {
    id: 'notif-1',
    category: 'listings',
    typeBadge: 'RENT',
    typeColor: 'rent',
    badgeTag: 'RENT listing approved.',
    isUnread: true,
    timeAgo: '15 phút trước',
    datetime: '2024-11-05T14:45:00',
    title: 'Canon EOS R6 Mark II Full-Frame Kit',
    description:
      'Sản phẩm cho thuê Canon EOS R6 Mark II Full-Frame Kit đã được Admin phê duyệt kiểm định và xuất bản công khai lên sàn RENT.',
    embeddedBox: {
      icon: 'photo_camera',
      headline: 'MÃ LƯU KÝ: #RC-904-CN',
      subline: 'Tiêu chuẩn cọc Escrow: $75.00/ngày • Bảo chứng toàn diện',
    },
    actionText: 'Xem Sản Phẩm RENT →',
    actionLink: '/shop/rent/products',
  },
  {
    id: 'notif-2',
    category: 'listings',
    typeBadge: 'THRIFT',
    typeColor: 'rejected',
    badgeTag: 'THRIFT listing rejected.',
    isUnread: true,
    timeAgo: '2 giờ trước',
    datetime: '2024-11-05T13:00:00',
    title: 'Rolleiflex 2.8F TLR Planar 80mm',
    description:
      'Mục đăng bán đứt Rolleiflex 2.8F TLR Planar 80mm đã bị từ chối kiểm định. Ghi chú kiểm định: Yêu cầu bổ sung ảnh macro buồng thấu kính và vạch số series.',
    embeddedBox: {
      icon: 'info',
      headline: 'Quy chuẩn kiểm duyệt: Quang học & Ống kính đôi TLR',
      subline: 'Thời gian xét duyệt lại: trong vòng 4 giờ kể từ khi cập nhật ảnh hồ sơ.',
    },
    actionText: 'Chỉnh Sửa Mục Đăng THRIFT →',
    actionLink: '/shop/thrift/listings',
  },
  {
    id: 'notif-3',
    category: 'orders',
    typeBadge: 'RENT',
    typeColor: 'rent',
    badgeTag: 'New rental order.',
    isUnread: true,
    timeAgo: '3 giờ trước',
    datetime: '2024-11-05T12:00:00',
    title: 'Đơn Thuê #RN-ORD-9042 · Marcus Sterling',
    description:
      'Đơn thuê mới #RN-ORD-9042 từ khách hàng Marcus Sterling (Thời gian thuê: 3 ngày, ký quỹ Escrow: $520.00 USD / 12.500.000 ₫).',
    embeddedBox: {
      icon: 'key',
      headline: 'ĐƠN THUÊ MỚI',
      subline: 'Hộp Nanuk & Tem Niêm Phong',
      gridItems: [
        { label: 'Thời Hạn Thuê', value: '3 Ngày (Nov 07 - Nov 10)' },
        { label: 'Ký Quỹ Escrow', value: '$520.00 USD (Đã Khóa)', isGreen: true },
        { label: 'Quy Chuẩn Giao', value: 'Hộp Nanuk & Tem Niêm' },
      ],
    },
    actionText: 'Xử Lý Đơn Thuê →',
    actionLink: '/shop/rent/orders',
  },
  {
    id: 'notif-4',
    category: 'orders',
    typeBadge: 'RENT',
    typeColor: 'rent',
    badgeTag: 'Customer requested a return.',
    isUnread: false,
    timeAgo: 'Hôm qua',
    datetime: '2024-11-04T18:00:00',
    title: 'Đơn Thuê Sony FX3 Cinema Line · #RN-ORD-8991',
    description:
      'Khách hàng yêu cầu hoàn trả thiết bị cho đơn thuê Sony FX3 Cinema Line #RN-ORD-8991. Bưu tá chuyên dụng Nanuk đã lên lịch nhận đồ.',
    embeddedBox: {
      icon: 'science',
      headline: 'SẴN SÀNG NGHIỆM THU',
      subline: 'Quy trình kiểm tra sai số quang học sẵn sàng khi nhận kiện hàng.',
    },
    actionText: 'Kiểm Tra & Nghiệm Thu Hoàn Trả →',
    actionLink: '/shop/rent/orders',
  },
  {
    id: 'notif-5',
    category: 'orders',
    subCategory: 'escrow',
    typeBadge: 'THRIFT',
    typeColor: 'thrift',
    badgeTag: 'New THRIFT order.',
    isUnread: false,
    timeAgo: '04/11, 14:18',
    datetime: '2024-11-04T14:18:00',
    title: 'Thân Máy Contax G2 Black Edition · #TH-ORD-8821',
    description:
      'Đơn mua đứt mới #TH-ORD-8821 cho thân máy Contax G2 Black Edition ($1,485.00 USD). Tiền ký quỹ đã khóa an toàn tại VNPay Smart Escrow.',
    embeddedBox: {
      icon: 'security',
      headline: '$1,485.00 USD trong VNPay Smart Escrow',
      subline: 'Giải ngân tự động sau khi người mua ký biên bản bàn giao kiểm định.',
    },
    actionText: 'Xử Lý Đơn Bán THRIFT →',
    actionLink: '/shop/thrift/orders',
  },
  {
    id: 'notif-6',
    category: 'messages',
    typeBadge: 'CHAT',
    typeColor: 'chat',
    badgeTag: 'Customer sent a message.',
    isUnread: false,
    timeAgo: '04/11, 14:32',
    datetime: '2024-11-04T14:32:00',
    title: 'Elena Rostova liên hệ về đơn #RH-THF-2024-9108',
    quoteText:
      'Shop cho mình hỏi quy trình dán tem seal Nanuk trước khi giao qua bưu tá cho đơn hàng #RH-THF-2024-9108 nhé?',
    description:
      'Khách hàng Elena Rostova gửi tin nhắn hỏi về quy trình dán tem seal Nanuk cho đơn hàng #RH-THF-2024-9108.',
    actionText: 'Mở Trò Chuyện (/chat) →',
    actionLink: '/chat',
  },
];

export const ShopNotifications: React.FC = () => {
  const [notifications, setNotifications] = useState<ShopNotification[]>(() => {
    try {
      const saved = localStorage.getItem('reuse_shop_notifications');
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return INITIAL_SHOP_NOTIFICATIONS;
  });

  const [activeFilter, setActiveFilter] = useState<'all' | 'orders' | 'listings' | 'messages' | 'escrow'>('all');
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Preference switches for modal
  const [notifySms, setNotifySms] = useState(true);
  const [notifyEmailDigest, setNotifyEmailDigest] = useState(true);
  const [notifyEscrowInstant, setNotifyEscrowInstant] = useState(true);
  const [notifyOrderUrgent, setNotifyOrderUrgent] = useState(true);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('reuse_shop_notifications', JSON.stringify(notifications));
    } catch (e) {
      console.warn('Lỗi lưu reuse_shop_notifications vào localStorage:', e);
    }
  }, [notifications]);

  // Close modals on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsConfigModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3200);
  };

  // Filtered notifications
  const filteredNotifications = useMemo(() => {
    if (activeFilter === 'all') return notifications;
    if (activeFilter === 'escrow') {
      return notifications.filter((n) => n.category === 'escrow' || n.subCategory === 'escrow');
    }
    return notifications.filter((n) => n.category === activeFilter);
  }, [notifications, activeFilter]);

  // Counts for each filter tab
  const counts = useMemo(() => {
    return {
      all: notifications.length,
      orders: notifications.filter((n) => n.category === 'orders').length,
      listings: notifications.filter((n) => n.category === 'listings').length,
      messages: notifications.filter((n) => n.category === 'messages').length,
      escrow: notifications.filter((n) => n.category === 'escrow' || n.subCategory === 'escrow').length,
    };
  }, [notifications]);

  // Mark all as read
  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((item) => ({ ...item, isUnread: false })));
    showToast('Tất cả thông báo đã được đánh dấu là đã đọc.');
  };

  // Mark active category as read
  const handleMarkBatchRead = () => {
    setNotifications((prev) =>
      prev.map((item) => {
        if (
          activeFilter === 'all' ||
          item.category === activeFilter ||
          (activeFilter === 'escrow' && item.subCategory === 'escrow')
        ) {
          return { ...item, isUnread: false };
        }
        return item;
      })
    );
    showToast('Đã đánh dấu đã đọc các thông báo đang hiển thị.');
  };

  // Dismiss / delete single notification
  const handleDismiss = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setNotifications((prev) => prev.filter((item) => item.id !== id));
    showToast('Đã ẩn thông báo.');
  };

  // Mark single as read
  const handleToggleRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isUnread: !item.isUnread } : item))
    );
  };

  return (
    <div className="w-full bg-[#fdf8f5] text-[#1c1b19] min-h-[calc(100vh-5rem)] font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl bg-[#1c1b19] text-[#fdf8f5] shadow-2xl border border-[#cfc5b8] animate-bounce-subtle">
          <span className="material-symbols-outlined text-[#caebc9] text-[20px]">check_circle</span>
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      <div className="relative w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12 pb-16">
        {/* Top Breadcrumb & Custody Signal */}
        <div className="pt-6 pb-4 flex flex-wrap items-center justify-between gap-4">
          <nav aria-label="Breadcrumbs" className="flex items-center gap-2">
            <Link
              to="/shop"
              className="text-xs uppercase tracking-wider text-[#4c463c] hover:text-[#6c5937] transition-colors"
            >
              Shop
            </Link>
            <span className="text-[#cfc5b8] text-xs">/</span>
            <Link
              to="/shop/profile"
              className="text-xs uppercase tracking-wider text-[#4c463c] hover:text-[#6c5937] transition-colors"
            >
              Account
            </Link>
            <span className="text-[#cfc5b8] text-xs">/</span>
            <span className="text-xs uppercase tracking-wider text-[#6c5937] font-semibold">
              Notifications (/notifications)
            </span>
          </nav>

          <div className="flex items-center gap-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#f2ede9] rounded border border-[#48654b]/20">
              <span className="w-1.5 h-1.5 rounded-full bg-[#48654b] animate-pulse"></span>
              <span className="text-xs uppercase tracking-wider text-[#48654b] font-medium font-mono">
                Custody Ledger Active
              </span>
            </div>
            <span className="text-[#cfc5b8] hidden sm:inline">•</span>
            <span className="text-xs text-[#4c463c] font-mono hidden sm:inline">
              Node #ATELIER-CHRONOS-809
            </span>
          </div>
        </div>

        {/* Editorial Feed Header Banner */}
        <div className="mt-4 mb-8 pb-8 bg-gradient-to-b from-[#f7f3ef]/80 to-[#f7f3ef]/30 rounded-2xl p-6 sm:p-8 border border-[#cfc5b8]/40 shadow-xs">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="max-w-3xl">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs uppercase tracking-widest text-[#48654b] font-bold">
                  Atelier Feed &amp; Signal Dispatch
                </span>
                <span className="text-[#cfc5b8]">/</span>
                <span className="text-xs text-[#4c463c]">Lưu Ký &amp; Cập Nhật Trạng Thái</span>
              </div>
              <h1 className="font-serif text-3xl sm:text-4xl text-[#1c1b19] tracking-tight font-medium">
                Thông Báo Xưởng &amp; Điều Phối Lưu Ký{' '}
                <span className="italic font-normal font-serif text-[#6c5937] text-2xl sm:text-3xl">
                  (Shop Owner Notifications)
                </span>
              </h1>
              <p className="text-base text-[#4c463c] mt-3 max-w-3xl leading-relaxed">
                Cập nhật theo thời gian thực về đơn thuê, đơn bán đứt THRIFT, đối soát ký quỹ Escrow và tin nhắn từ khách hàng.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#ece7e4] hover:bg-[#ddd9d6] text-[#1c1b19] text-xs font-semibold uppercase tracking-wider rounded-xl shadow-xs transition-all duration-200 border border-[#cfc5b8]/50"
              >
                <span className="material-symbols-outlined text-[18px]">done_all</span>
                <span>Đánh Dấu Tất Cả Đã Đọc</span>
              </button>

              <button
                type="button"
                onClick={() => setIsConfigModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#6c5937] text-white hover:bg-[#86724d] text-xs font-semibold uppercase tracking-wider rounded-xl shadow-xs transition-all duration-200"
              >
                <span className="material-symbols-outlined text-[18px]">tune</span>
                <span>Cấu Hình Thông Báo</span>
              </button>
            </div>
          </div>

          {/* 4 Operational Micro KPIs */}
          <div className="mt-8 pt-6 border-t border-[#cfc5b8]/30 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl shadow-xs border border-[#cfc5b8]/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#caebc9]/50 flex items-center justify-center text-[#48654b]">
                  <span className="material-symbols-outlined text-[20px]">verified_user</span>
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-[#48654b] font-semibold">
                    Tư Cách Shop Owner
                  </div>
                  <div className="text-sm font-semibold text-[#1c1b19]">Vũ Thanh Tùng (Lvl 2)</div>
                </div>
              </div>
              <span className="material-symbols-outlined text-[#48654b] text-[20px]">check_circle</span>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-xs border border-[#cfc5b8]/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#f2ede9] flex items-center justify-center text-[#6c5937]">
                  <span className="material-symbols-outlined text-[20px]">timer</span>
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-[#4c463c] font-medium">
                    SLA Phản Hồi Xưởng
                  </div>
                  <div className="text-sm font-semibold text-[#1c1b19]">&lt; 14 Phút (Tối Ưu)</div>
                </div>
              </div>
              <span className="text-[11px] text-[#48654b] bg-[#caebc9]/40 px-2 py-0.5 rounded font-bold uppercase">
                Chuẩn VIP
              </span>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-xs border border-[#cfc5b8]/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#f2ede9] flex items-center justify-center text-[#48654b]">
                  <span className="material-symbols-outlined text-[20px]">account_balance_wallet</span>
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-[#4c463c] font-medium">
                    Ký Quỹ Smart Escrow
                  </div>
                  <div className="text-sm font-semibold text-[#1c1b19] font-mono">$3,920.00 USD</div>
                </div>
              </div>
              <span className="text-[11px] text-[#48654b] bg-[#caebc9]/40 px-2 py-0.5 rounded font-bold uppercase">
                Tự Động Hóa
              </span>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-xs border border-[#cfc5b8]/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#f2ede9] flex items-center justify-center text-[#4c463c]">
                  <span className="material-symbols-outlined text-[20px]">local_shipping</span>
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-wider text-[#4c463c] font-medium">
                    Điều Phối Vận Chuyển
                  </div>
                  <div className="text-sm font-semibold text-[#1c1b19]">Tem Niêm Nanuk</div>
                </div>
              </div>
              <span className="material-symbols-outlined text-[#48654b] text-[18px]">lock</span>
            </div>
          </div>
        </div>

        {/* Main Grid: Left Filter & Insight Column (3 cols) vs Right Notification Feed (9 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Sticky Sidebar (3 cols) */}
          <aside className="lg:col-span-3 lg:sticky lg:top-28 space-y-6">
            <div className="bg-white p-5 rounded-2xl shadow-xs border border-[#cfc5b8]/40">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#f2ede9]">
                <span className="font-serif text-lg text-[#1c1b19] font-medium">Bộ Lọc Tín Hiệu</span>
                <span className="text-[10px] uppercase tracking-wider text-[#48654b] font-bold">Phân Loại</span>
              </div>

              <nav className="flex flex-col gap-1.5" id="filterNav">
                {/* Tab: All */}
                <button
                  type="button"
                  onClick={() => setActiveFilter('all')}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs uppercase tracking-wider transition-all text-left font-medium ${
                    activeFilter === 'all'
                      ? 'bg-[#6c5937] text-white font-semibold shadow-xs'
                      : 'text-[#4c463c] hover:bg-[#f2ede9] hover:text-[#1c1b19]'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-[18px]">dynamic_feed</span>
                    <span>Tất cả</span>
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                      activeFilter === 'all' ? 'bg-white/20 text-white' : 'bg-[#f2ede9] text-[#4c463c]'
                    }`}
                  >
                    {counts.all}
                  </span>
                </button>

                {/* Tab: Orders */}
                <button
                  type="button"
                  onClick={() => setActiveFilter('orders')}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs uppercase tracking-wider transition-all text-left font-medium ${
                    activeFilter === 'orders'
                      ? 'bg-[#6c5937] text-white font-semibold shadow-xs'
                      : 'text-[#4c463c] hover:bg-[#f2ede9] hover:text-[#1c1b19]'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-[18px]">local_mall</span>
                    <span>Đơn Hàng / Orders</span>
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                      activeFilter === 'orders' ? 'bg-white/20 text-white' : 'bg-[#f2ede9] text-[#4c463c]'
                    }`}
                  >
                    {counts.orders}
                  </span>
                </button>

                {/* Tab: Listings */}
                <button
                  type="button"
                  onClick={() => setActiveFilter('listings')}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs uppercase tracking-wider transition-all text-left font-medium ${
                    activeFilter === 'listings'
                      ? 'bg-[#6c5937] text-white font-semibold shadow-xs'
                      : 'text-[#4c463c] hover:bg-[#f2ede9] hover:text-[#1c1b19]'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-[18px]">inventory_2</span>
                    <span>Mục Đăng / Listings</span>
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                      activeFilter === 'listings' ? 'bg-white/20 text-white' : 'bg-[#f2ede9] text-[#4c463c]'
                    }`}
                  >
                    {counts.listings}
                  </span>
                </button>

                {/* Tab: Messages */}
                <button
                  type="button"
                  onClick={() => setActiveFilter('messages')}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs uppercase tracking-wider transition-all text-left font-medium ${
                    activeFilter === 'messages'
                      ? 'bg-[#6c5937] text-white font-semibold shadow-xs'
                      : 'text-[#4c463c] hover:bg-[#f2ede9] hover:text-[#1c1b19]'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-[18px]">chat_bubble</span>
                    <span>Tin Nhắn / Messages</span>
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                      activeFilter === 'messages' ? 'bg-white/20 text-white' : 'bg-[#f2ede9] text-[#4c463c]'
                    }`}
                  >
                    {counts.messages}
                  </span>
                </button>

                {/* Tab: Escrow */}
                <button
                  type="button"
                  onClick={() => setActiveFilter('escrow')}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs uppercase tracking-wider transition-all text-left font-medium ${
                    activeFilter === 'escrow'
                      ? 'bg-[#6c5937] text-white font-semibold shadow-xs'
                      : 'text-[#4c463c] hover:bg-[#f2ede9] hover:text-[#1c1b19]'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-[18px]">gavel</span>
                    <span>Ký Quỹ &amp; Hệ Thống</span>
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                      activeFilter === 'escrow' ? 'bg-white/20 text-white' : 'bg-[#f2ede9] text-[#4c463c]'
                    }`}
                  >
                    {counts.escrow}
                  </span>
                </button>
              </nav>

              {/* Escrow Automation Info Box */}
              <div className="mt-6 pt-5 bg-[#f7f3ef] p-4 rounded-xl border border-[#48654b]/20">
                <div className="flex items-center gap-2 text-[#48654b] text-xs uppercase tracking-wider font-bold">
                  <span className="material-symbols-outlined text-[16px]">lock</span>
                  <span>Tự Động Hóa Smart Escrow</span>
                </div>
                <p className="mt-2 text-xs text-[#4c463c] leading-relaxed">
                  Toàn bộ cọc đơn thuê &amp; thanh toán THRIFT được bảo vệ bằng hợp đồng ký quỹ tự động, thanh toán minh bạch sau khi kiểm định nghiệm thu.
                </p>
                <div className="mt-3 pt-2 border-t border-[#cfc5b8]/30 flex items-center justify-between text-xs">
                  <span className="text-[#6c5937] font-medium">VNPay Smart Escrow</span>
                  <span className="text-[#48654b] font-semibold">100% An Toàn</span>
                </div>
              </div>
            </div>

            {/* SLA Response Sparkline Card */}
            <div className="bg-white p-5 rounded-2xl shadow-xs border border-[#cfc5b8]/40">
              <div className="flex items-center justify-between mb-2">
                <span className="font-serif text-lg text-[#1c1b19] font-medium">SLA Phản Hồi Xưởng</span>
                <span className="text-xs text-[#48654b] uppercase font-bold">&lt; 14 Phút</span>
              </div>
              <p className="text-xs text-[#4c463c] mb-4 leading-relaxed">
                Đo lường thời gian điều phối và phản hồi đơn của Atelier Chronos.
              </p>
              <div className="w-full h-12 flex items-end">
                <svg className="w-full h-10 text-[#48654b]" fill="none" preserveAspectRatio="none" viewBox="0 0 240 40">
                  <path
                    d="M0,32 L30,28 L60,35 L90,18 L120,22 L150,10 L180,15 L210,8 L240,12"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.5"
                  />
                  <circle cx="210" cy="8" fill="currentColor" r="4" />
                </svg>
              </div>
              <div className="flex justify-between items-center text-[#7e766a] text-[11px] mt-2 pt-2 border-t border-[#f2ede9]">
                <span>Oct 28</span>
                <span className="font-semibold text-[#1c1b19]">Nov 05 (Hiện tại)</span>
              </div>
            </div>
          </aside>

          {/* Right Notification Feed (9 cols) */}
          <section className="lg:col-span-9 flex flex-col gap-4">
            {/* Header controls strip */}
            <div className="flex items-center justify-between px-2 py-1">
              <span className="text-xs uppercase tracking-wider text-[#4c463c]">
                Hiển thị <span className="text-[#6c5937] font-bold font-mono">{filteredNotifications.length}</span> thông báo &amp; tín hiệu điều phối
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleMarkBatchRead}
                  className="text-[#4c463c] hover:text-[#6c5937] text-xs uppercase tracking-wider flex items-center gap-1 transition-colors font-medium"
                >
                  <span className="material-symbols-outlined text-[16px]">done</span>
                  <span>Đánh dấu đã đọc mục chọn</span>
                </button>
              </div>
            </div>

            {/* Notification Items List */}
            {filteredNotifications.length === 0 ? (
              <div className="bg-white p-12 text-center rounded-2xl shadow-xs border border-[#cfc5b8]/40">
                <span className="material-symbols-outlined text-[#cfc5b8] text-[48px] mb-3">inbox</span>
                <h3 className="font-serif text-xl text-[#1c1b19] mb-1 font-medium">
                  Không có tín hiệu trong bộ lọc này
                </h3>
                <p className="text-sm text-[#4c463c] max-w-md mx-auto">
                  Tất cả thông báo thuộc danh mục này đã được xử lý hoặc lưu trữ.
                </p>
              </div>
            ) : (
              filteredNotifications.map((notif) => (
                <article
                  key={notif.id}
                  onClick={() => handleToggleRead(notif.id)}
                  className={`bg-white hover:bg-[#fdf8f5] rounded-2xl p-5 sm:p-6 shadow-xs border border-[#cfc5b8]/35 transition-all duration-200 relative group cursor-pointer ${
                    !notif.isUnread ? 'opacity-90' : ''
                  }`}
                >
                  <div className="flex flex-col sm:flex-row items-start gap-4">
                    {/* Icon Badge */}
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                        notif.typeColor === 'rejected'
                          ? 'bg-[#ffdad6] text-[#ba1a1a]'
                          : notif.typeColor === 'rent'
                          ? 'bg-[#caebc9]/50 text-[#48654b]'
                          : notif.typeColor === 'thrift'
                          ? 'bg-[#ffdcc1]/50 text-[#7f5227]'
                          : 'bg-[#f2ede9] text-[#6c5937]'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[24px]">
                        {notif.typeColor === 'rejected'
                          ? 'assignment_late'
                          : notif.category === 'orders'
                          ? notif.badgeTag.includes('return')
                            ? 'assignment_return'
                            : 'shopping_bag'
                          : notif.category === 'messages'
                          ? 'forum'
                          : 'verified'}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      {/* Top Meta Line */}
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`px-2.5 py-0.5 rounded-lg text-xs uppercase tracking-wider font-semibold ${
                              notif.typeColor === 'rejected'
                                ? 'bg-[#ffdad6] text-[#93000a]'
                                : notif.typeColor === 'rent'
                                ? 'bg-[#caebc9]/70 text-[#314d34]'
                                : notif.typeColor === 'thrift'
                                ? 'bg-[#ffdcc1]/70 text-[#673d14]'
                                : 'bg-[#ece7e4] text-[#1c1b19]'
                            }`}
                          >
                            {notif.badgeTag}
                          </span>

                          <span className="px-2.5 py-0.5 rounded-lg bg-[#f2ede9] text-[#6c5937] text-xs uppercase tracking-wider font-bold">
                            {notif.typeBadge}
                          </span>

                          {notif.subCategory === 'escrow' && (
                            <span className="px-2.5 py-0.5 rounded-lg bg-[#caebc9]/40 text-[#48654b] text-[10px] uppercase tracking-wider font-bold">
                              KÝ QUỸ ESCROW
                            </span>
                          )}

                          {notif.isUnread && (
                            <span
                              className="w-2 h-2 rounded-full bg-[#ba1a1a] animate-pulse"
                              title="Chưa đọc"
                            ></span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <time
                            className="text-xs text-[#7e766a] flex items-center gap-1"
                            dateTime={notif.datetime}
                          >
                            <span className="material-symbols-outlined text-[14px]">schedule</span>
                            <span>{notif.timeAgo}</span>
                          </time>

                          <button
                            type="button"
                            onClick={(e) => handleDismiss(notif.id, e)}
                            className="p-1 text-[#7e766a] hover:text-[#ba1a1a] transition-colors rounded-lg"
                            title="Đóng thông báo"
                          >
                            <span className="material-symbols-outlined text-[18px]">close</span>
                          </button>
                        </div>
                      </div>

                      {/* Title & Body */}
                      <h2 className="font-serif text-lg sm:text-xl text-[#1c1b19] font-medium mb-1">
                        {notif.title}
                      </h2>

                      {notif.quoteText && (
                        <div className="bg-[#f7f3ef] p-3.5 rounded-xl my-2.5 border-l-2 border-[#48654b] text-sm text-[#1c1b19] italic leading-relaxed">
                          &ldquo;{notif.quoteText}&rdquo;
                        </div>
                      )}

                      <p className="text-sm text-[#4c463c] leading-relaxed">
                        {notif.description}
                      </p>

                      {/* Embedded Box (if present) */}
                      {notif.embeddedBox && (
                        <div className="mt-4 p-4 bg-[#f7f3ef] rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 border border-[#cfc5b8]/30">
                          {notif.embeddedBox.gridItems ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-left flex-1">
                              {notif.embeddedBox.gridItems.map((gi, idx) => (
                                <div key={idx}>
                                  <div className="text-[11px] uppercase tracking-wider text-[#7e766a]">
                                    {gi.label}
                                  </div>
                                  <div
                                    className={`text-xs sm:text-sm font-semibold mt-0.5 ${
                                      gi.isGreen ? 'text-[#48654b]' : 'text-[#1c1b19]'
                                    }`}
                                  >
                                    {gi.value}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="flex items-center gap-3">
                              <span className="material-symbols-outlined text-[#48654b] text-[22px]">
                                {notif.embeddedBox.icon}
                              </span>
                              <div>
                                <div className="text-xs uppercase text-[#48654b] font-semibold tracking-wider">
                                  {notif.embeddedBox.headline}
                                </div>
                                <div className="text-xs text-[#4c463c] mt-0.5">
                                  {notif.embeddedBox.subline}
                                </div>
                              </div>
                            </div>
                          )}

                          <Link
                            to={notif.actionLink}
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#6c5937] hover:bg-[#86724d] text-white text-xs font-semibold uppercase tracking-wider rounded-xl shadow-xs transition-colors shrink-0"
                          >
                            <span>{notif.actionText}</span>
                          </Link>
                        </div>
                      )}

                      {!notif.embeddedBox && (
                        <div className="mt-4 flex items-center justify-end">
                          <Link
                            to={notif.actionLink}
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#6c5937] hover:bg-[#86724d] text-white text-xs font-semibold uppercase tracking-wider rounded-xl shadow-xs transition-colors shrink-0"
                          >
                            <span>{notif.actionText}</span>
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              ))
            )}
          </section>
        </div>

        {/* Bottom Section: SLA & Smart Escrow Architecture */}
        <section className="mt-16 bg-[#f7f3ef] p-8 rounded-2xl border border-[#cfc5b8]/40 shadow-xs">
          <div className="max-w-3xl">
            <span className="text-xs uppercase tracking-widest text-[#48654b] font-bold">
              Tóm Tắt Vận Hành &amp; Điều Phối Xưởng
            </span>
            <h3 className="font-serif text-2xl sm:text-3xl text-[#1c1b19] font-normal mt-2">
              SLA Phản Hồi Xưởng &amp; Tự Động Hóa Smart Escrow
            </h3>
            <p className="text-sm text-[#4c463c] mt-3 leading-relaxed">
              ReUse Hub đồng bộ hóa cơ chế giữ tiền ký quỹ Smart Escrow với ngân hàng cho từng giao dịch tuần hoàn. Việc phản hồi đơn thuê và đóng gói dán tem niêm phong đúng hạn giúp duy trì chỉ số uy tín &lt; 14 phút và hưởng ưu đãi chiết khấu sàn.
            </p>
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-[#cfc5b8]/30">
            <div>
              <div className="text-xs uppercase tracking-wider text-[#48654b] font-bold">
                01 / SLA Phản Hồi Xưởng (&lt; 14 mins)
              </div>
              <p className="text-xs text-[#4c463c] mt-2 leading-relaxed">
                Mọi đơn thuê mới hay yêu cầu hoàn trả đều kích hoạt luồng cảnh báo SMS &amp; Portal để kiểm định thiết bị nhanh nhất.
              </p>
            </div>

            <div>
              <div className="text-xs uppercase tracking-wider text-[#48654b] font-bold">
                02 / Tự Động Hóa Smart Escrow
              </div>
              <p className="text-xs text-[#4c463c] mt-2 leading-relaxed">
                Tiền cọc và thanh toán được phong tỏa trong tài khoản ủy thác ngân hàng, giải ngân tự động sau xác nhận nghiệm thu.
              </p>
            </div>

            <div>
              <div className="text-xs uppercase tracking-wider text-[#48654b] font-bold">
                03 / Ký Quỹ An Toàn &amp; Niêm Phong Nanuk
              </div>
              <p className="text-xs text-[#4c463c] mt-2 leading-relaxed">
                Bảo chứng 100% tình trạng vật lý với tem niêm phong vỡ và giao thức đối soát quang học độc quyền của ReUse Hub.
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* MODAL: Notification Preferences Configuration */}
      {isConfigModalOpen && (
        <div
          onClick={() => setIsConfigModalOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#fdf8f5] rounded-2xl w-full max-w-lg shadow-2xl border border-[#cfc5b8] p-6 lg:p-8 relative cursor-default"
          >
            <button
              onClick={() => setIsConfigModalOpen(false)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-[#f2ede9] flex items-center justify-center text-[#7e766a] hover:text-[#1c1b19] hover:bg-[#e6e2de] transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-11 h-11 rounded-xl bg-[#caebc9] flex items-center justify-center text-[#48654b]">
                <span className="material-symbols-outlined text-[24px]">tune</span>
              </div>
              <div>
                <span className="text-xs uppercase tracking-wider text-[#48654b] font-bold">
                  SIGNAL DISPATCH PREFERENCES
                </span>
                <h3 className="font-serif text-2xl text-[#1c1b19] font-medium">
                  Cấu Hình Kênh Nhận Tín Hiệu
                </h3>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3.5 bg-white rounded-xl border border-[#cfc5b8]/50 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-[#1c1b19] text-sm">Cảnh báo khẩn SMS (Đơn thuê mới)</div>
                  <div className="text-[#7e766a] mt-0.5">Gửi tin nhắn SMS tới số hotline trực ngay khi có đơn thuê mới cần xuất kho.</div>
                </div>
                <button
                  type="button"
                  onClick={() => setNotifySms(!notifySms)}
                  className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ${
                    notifySms ? 'bg-[#48654b]' : 'bg-[#ddd9d6]'
                  }`}
                >
                  <span
                    className={`block w-4 h-4 rounded-full bg-white shadow-xs transition-transform transform ${
                      notifySms ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  ></span>
                </button>
              </div>

              <div className="p-3.5 bg-white rounded-xl border border-[#cfc5b8]/50 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-[#1c1b19] text-sm">Thông báo Smart Escrow tức thời</div>
                  <div className="text-[#7e766a] mt-0.5">Ping thông báo khi tiền cọc của khách hàng được khóa hoặc giải ngân về ví xưởng.</div>
                </div>
                <button
                  type="button"
                  onClick={() => setNotifyEscrowInstant(!notifyEscrowInstant)}
                  className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ${
                    notifyEscrowInstant ? 'bg-[#48654b]' : 'bg-[#ddd9d6]'
                  }`}
                >
                  <span
                    className={`block w-4 h-4 rounded-full bg-white shadow-xs transition-transform transform ${
                      notifyEscrowInstant ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  ></span>
                </button>
              </div>

              <div className="p-3.5 bg-white rounded-xl border border-[#cfc5b8]/50 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-[#1c1b19] text-sm">Bản tin tóm tắt Email cuối ngày</div>
                  <div className="text-[#7e766a] mt-0.5">Tổng hợp đối soát các phiên kiểm kê và doanh số hàng ngày gửi lúc 22:00.</div>
                </div>
                <button
                  type="button"
                  onClick={() => setNotifyEmailDigest(!notifyEmailDigest)}
                  className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ${
                    notifyEmailDigest ? 'bg-[#48654b]' : 'bg-[#ddd9d6]'
                  }`}
                >
                  <span
                    className={`block w-4 h-4 rounded-full bg-white shadow-xs transition-transform transform ${
                      notifyEmailDigest ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  ></span>
                </button>
              </div>

              <div className="p-3.5 bg-white rounded-xl border border-[#cfc5b8]/50 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-[#1c1b19] text-sm">Cảnh báo vi phạm SLA phản hồi</div>
                  <div className="text-[#7e766a] mt-0.5">Kích hoạt âm thanh và đẩy ưu tiên nếu đơn hàng chưa phản hồi quá 10 phút.</div>
                </div>
                <button
                  type="button"
                  onClick={() => setNotifyOrderUrgent(!notifyOrderUrgent)}
                  className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ${
                    notifyOrderUrgent ? 'bg-[#48654b]' : 'bg-[#ddd9d6]'
                  }`}
                >
                  <span
                    className={`block w-4 h-4 rounded-full bg-white shadow-xs transition-transform transform ${
                      notifyOrderUrgent ? 'translate-x-7' : 'translate-x-1'
                    }`}
                  ></span>
                </button>
              </div>
            </div>

            <div className="pt-6 border-t border-[#cfc5b8] flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setIsConfigModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-[#cfc5b8] text-xs font-semibold uppercase tracking-wider text-[#4c463c] hover:bg-[#f2ede9]"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsConfigModalOpen(false);
                  showToast('Đã lưu cấu hình phân phối tín hiệu xưởng!');
                }}
                className="px-5 py-2 rounded-xl bg-[#6c5937] hover:bg-[#86724d] text-white text-xs font-semibold uppercase tracking-wider transition-colors shadow-xs"
              >
                Lưu Cấu Hình
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShopNotifications;
