import { useNotification } from "../../hooks/useNotification";
import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { UserSidebar } from '../../components/layout/UserSidebar';

interface NotificationRecord {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'order' | 'security' | 'payment' | 'system';
  isRead: boolean;
  link?: string;
}

export const NotificationCenter: React.FC = () => {
  // const { user } = useAuth();
  // uId managed by useNotification

  // Track sidebar collapsed state to display inline restore chip when collapsed
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('reuse_user_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const handleSync = (e: Event) => {
      const customEvent = e as CustomEvent<boolean>;
      if (typeof customEvent.detail === 'boolean') {
        setIsSidebarCollapsed(customEvent.detail);
      }
    };
    window.addEventListener('reuse_user_sidebar_toggle', handleSync);
    return () => window.removeEventListener('reuse_user_sidebar_toggle', handleSync);
  }, []);

  const {
    notifications: rawList,
    unreadCount,
    markAsRead,
    markAllAsRead
  } = useNotification();

  const [activeTab, setActiveTab] = useState<'ALL' | 'UNREAD' | 'ORDER' | 'PAYMENT' | 'SECURITY'>('ALL');

  const formatTimeAgo = (dateStr?: string) => {
    if (!dateStr) return 'Vừa xong';
    try {
      const diffMs = Date.now() - new Date(dateStr).getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return 'Vừa xong';
      if (diffMins < 60) return `${diffMins} phút trước`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours} giờ trước`;
      return new Date(dateStr).toLocaleDateString('vi-VN');
    } catch {
      return 'Gần đây';
    }
  };

  const mapType = (type?: string): 'order' | 'security' | 'payment' | 'system' => {
    if (type === 'RENTAL_ORDER' || type === 'THRIFT_ORDER' || type === 'RETURN') return 'order';
    if (type === 'PAYMENT' || type === 'REFUND') return 'payment';
    if (type === 'KYC') return 'security';
    return 'system';
  };

  const notifications: NotificationRecord[] = useMemo(() => {
    if (!rawList || rawList.length === 0) return [];
    return rawList.map((n) => ({
      id: n._id || n.id || String(Math.random()),
      title: n.title,
      message: n.message,
      time: formatTimeAgo(n.createdAt),
      type: mapType(n.type),
      isRead: n.isRead,
      link: n.link || '/rent/orders',
    }));
  }, [rawList]);

  const filteredNotifications = useMemo(() => {
    if (activeTab === 'UNREAD') return notifications.filter((n) => !n.isRead);
    if (activeTab === 'ORDER') return notifications.filter((n) => n.type === 'order');
    if (activeTab === 'PAYMENT') return notifications.filter((n) => n.type === 'payment');
    if (activeTab === 'SECURITY') return notifications.filter((n) => n.type === 'security');
    return notifications;
  }, [notifications, activeTab]);

  const markAllRead = () => {
    markAllAsRead();
  };

  return (
    <div className="w-full min-h-screen bg-[#FBF9F5] text-[#1C1A18] antialiased">
      {/* ── MAIN WORKSPACE CONTAINER WITH PERSISTENT SIDEBAR ── */}
      <div className="max-w-[1520px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 flex gap-8 items-start">
        {/* User Navigation Sidebar (Fixed on left) */}
        <UserSidebar activeKey="notifications" />

        {/* ── MAIN CONTENT AREA ── */}
        <main className="flex-1 min-w-0 space-y-8">
          <div className="flex flex-col w-full space-y-6">
            {/* Quick inline restore chip if user clicked 3-bar button to hide sidebar */}
            {isSidebarCollapsed && (
              <div className="flex items-center gap-2 -mb-2 animate-fade-in">
                <button
                  type="button"
                  onClick={() => window.dispatchEvent(new CustomEvent('reuse_user_sidebar_toggle', { detail: false }))}
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white border border-[#E8E4DC] text-xs font-semibold text-[#1C1A18] hover:bg-[#F6F3EE] hover:border-[#1C1A18]/40 transition-all shadow-2xs cursor-pointer group"
                  title="Mở lại menu điều hướng (Dấu 3 gạch)"
                >
                  <span className="material-symbols-outlined text-[18px] text-[#5E6D5B] group-hover:scale-110 transition-transform">
                    menu
                  </span>
                  <span>Hiện menu điều hướng</span>
                </button>
              </div>
            )}

            {/* Breadcrumb Navigation */}
            <div className="flex items-center gap-2">
              <Link to="/" className="font-mono text-xs uppercase tracking-wider text-[#7B766F] hover:text-[#141310] transition-colors">
                Trang chủ
              </Link>
              <span className="text-[#CCC5BC] text-xs">/</span>
              <Link to="/user/dashboard" className="font-mono text-xs uppercase tracking-wider text-[#7B766F] hover:text-[#141310] transition-colors">
                Tài khoản
              </Link>
              <span className="text-[#CCC5BC] text-xs">/</span>
              <span className="font-mono text-xs uppercase tracking-wider text-[#141310] font-semibold">
                Thông báo của tôi
              </span>
            </div>

            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2 border-b border-[#E8E4DC]">
              <div>
                <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-[#EEF2EC] text-[#5E6D5B] text-[11px] font-semibold mb-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#5E6D5B]" />
                  <span>Trung tâm thông báo ReUse</span>
                </div>
                <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-[#1C1A18] tracking-tight">
                  Thông báo hệ thống
                </h1>
                <p className="text-xs sm:text-sm text-[#76726B] mt-1">
                  Cập nhật tiến độ đơn hàng thuê, trạng thái hoàn cọc Smart Escrow và các thông báo bảo mật.
                </p>
              </div>

              <div className="flex items-center gap-3">
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllRead}
                    className="px-4 py-2 rounded-xl bg-white border border-[#E8E4DC] hover:bg-[#F6F3EE] text-xs font-semibold text-[#1C1A18] shadow-2xs transition-colors cursor-pointer shrink-0"
                  >
                    Đánh dấu tất cả đã đọc
                  </button>
                )}
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap items-center gap-2 pb-2">
              <button
                type="button"
                onClick={() => setActiveTab('ALL')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${activeTab === 'ALL' ? 'bg-[#1C1A18] text-white shadow-2xs' : 'bg-white text-[#76726B] hover:text-[#1C1A18] border border-[#E8E4DC]'}`}
              >
                Tất cả ({notifications.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('UNREAD')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${activeTab === 'UNREAD' ? 'bg-[#1C1A18] text-white shadow-2xs' : 'bg-white text-[#76726B] hover:text-[#1C1A18] border border-[#E8E4DC]'}`}
              >
                Chưa đọc ({unreadCount})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('ORDER')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${activeTab === 'ORDER' ? 'bg-[#1C1A18] text-white shadow-2xs' : 'bg-white text-[#76726B] hover:text-[#1C1A18] border border-[#E8E4DC]'}`}
              >
                Đơn hàng
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('PAYMENT')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${activeTab === 'PAYMENT' ? 'bg-[#1C1A18] text-white shadow-2xs' : 'bg-white text-[#76726B] hover:text-[#1C1A18] border border-[#E8E4DC]'}`}
              >
                Ký quỹ &amp; Hoàn cọc
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('SECURITY')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${activeTab === 'SECURITY' ? 'bg-[#1C1A18] text-white shadow-2xs' : 'bg-white text-[#76726B] hover:text-[#1C1A18] border border-[#E8E4DC]'}`}
              >
                Bảo mật &amp; KYC
              </button>
            </div>

            {/* Notification List */}
            <div className="space-y-3">
              {filteredNotifications.length === 0 ? (
                <div className="py-20 text-center bg-white rounded-2xl border border-[#E8E4DC] text-xs text-[#76726B] shadow-2xs space-y-2">
                  <span className="material-symbols-outlined text-[36px] text-[#A8A29E] block">notifications_off</span>
                  <p className="font-serif text-base font-bold text-[#1C1A18]">Chưa có thông báo nào trong mục này</p>
                  <p className="text-xs text-[#76726B]">
                    Hệ thống cập nhật thông báo trực tiếp từ cơ sở dữ liệu MongoDB theo từng trạng thái đơn hàng và tài khoản.
                  </p>
                </div>
              ) : (
                filteredNotifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => markAsRead(notif.id)}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                    notif.isRead
                      ? 'bg-white border-[#E8E4DC]/80'
                      : 'bg-[#FAF8F5] border-[#D8D2C5] shadow-xs'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-[#F6F3EE] flex items-center justify-center shrink-0 text-[#1C1A18]">
                      {notif.type === 'payment' && <span className="material-symbols-outlined text-[20px]">account_balance_wallet</span>}
                      {notif.type === 'order' && <span className="material-symbols-outlined text-[20px]">local_shipping</span>}
                      {notif.type === 'security' && <span className="material-symbols-outlined text-[20px]">verified_user</span>}
                      {notif.type === 'system' && <span className="material-symbols-outlined text-[20px]">notifications</span>}
                    </div>

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="font-serif text-sm sm:text-base font-bold text-[#1C1A18] flex items-center gap-2">
                          <span>{notif.title}</span>
                          {!notif.isRead && (
                            <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block" />
                          )}
                        </h4>
                        <span className="text-[11px] text-[#76726B] shrink-0 font-mono">{notif.time}</span>
                      </div>
                      <p className="text-xs text-[#76726B] leading-relaxed">{notif.message}</p>

                      {notif.link && (
                        <div className="pt-2">
                          <Link
                            to={notif.link}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-[#1C1A18] hover:underline"
                          >
                            <span>Xem chi tiết</span>
                            <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default NotificationCenter;
