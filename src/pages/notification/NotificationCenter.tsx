import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
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
  const { user } = useAuth();
  const uId = user?._id || user?.id || '';

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

  const [notifications, setNotifications] = useState<NotificationRecord[]>(() => {
    if (!uId) return [];
    try {
      const raw = localStorage.getItem(`user_notifications_${uId}`);
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr) && arr.length > 0) return arr;
      }
    } catch {
      // ignore
    }
    return [
      {
        id: 'notif-1',
        title: 'Bảo chứng Smart Escrow kích hoạt',
        message: 'Khoản tiền ký quỹ đơn thuê của bạn đã được khóa an toàn trong hợp đồng lưu ký.',
        time: 'Vừa xong',
        type: 'payment',
        isRead: false,
        link: '/rent/orders',
      },
      {
        id: 'notif-2',
        title: 'Xác thực tài khoản KYC thành công',
        message: 'Hồ sơ định danh căn cước của bạn đã được kiểm duyệt. Hạn mức thuê đã mở rộng lên Tier 2.',
        time: 'Hôm nay',
        type: 'security',
        isRead: true,
        link: '/profile',
      },
      {
        id: 'notif-3',
        title: 'Đơn hàng đã được xác nhận',
        message: 'Shop Partner đã chuẩn bị sẵn sàng thiết bị trong hộp chuyên dụng Nanuk White-Glove.',
        time: 'Hôm qua',
        type: 'order',
        isRead: true,
        link: '/rent/orders',
      },
    ];
  });

  const markAllRead = () => {
    const updated = notifications.map((n) => ({ ...n, isRead: true }));
    setNotifications(updated);
    if (uId) {
      localStorage.setItem(`user_notifications_${uId}`, JSON.stringify(updated));
    }
  };

  const unreadCount = useMemo(() => notifications.filter((n) => !n.isRead).length, [notifications]);

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

            {/* Notification List */}
            <div className="space-y-3">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`p-5 rounded-2xl border transition-all ${
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
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default NotificationCenter;
