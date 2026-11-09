import React, { useState, useContext, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../../../context/auth-context";
import { useNotification } from "../../../hooks/useNotification";

interface AdminHeaderProps {
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  onToggleSidebar,
  isSidebarOpen,
}) => {
  const auth = useContext(AuthContext);
  const user = auth?.user;
  const navigate = useNavigate();

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const {
    notifications,
    unreadCount,
    total,
    popupNotification,
    dismissPopup,
    markAsRead,
    markAllAsRead,
  } = useNotification();

  const notifRef = useRef<HTMLDivElement | null>(null);
  const profileRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (notifRef.current && !notifRef.current.contains(target)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(target)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const formatTimeAgo = (dateStr?: string) => {
    if (!dateStr) return "Vừa xong";
    try {
      const diffMs = Date.now() - new Date(dateStr).getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return "Vừa xong";
      if (diffMins < 60) return `${diffMins} phút trước`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours} giờ trước`;
      return new Date(dateStr).toLocaleDateString("vi-VN");
    } catch {
      return "Gần đây";
    }
  };

  const handleLogout = () => {
    if (auth?.logout) {
      auth.logout();
    } else {
      localStorage.removeItem("token");
      localStorage.removeItem("accessToken");
      localStorage.removeItem("user");
      navigate("/login");
    }
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#fdf9f2]/95 backdrop-blur-md shadow-[0_1px_8px_rgba(0,0,0,0.04)] border-b border-[#ccc5bc]/30">
        <div className="h-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 flex items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Sidebar toggle for mobile / drawer */}
            <button
              type="button"
              onClick={onToggleSidebar}
              className="lg:hidden p-2 rounded-lg text-[#4a463f] hover:text-[#1c1c18] hover:bg-[#f1ede6] transition-colors"
              aria-label="Toggle Sidebar"
            >
              <span className="material-symbols-outlined text-[24px]">
                {isSidebarOpen ? "close" : "menu"}
              </span>
            </button>

            {/* Brand Logo */}
            <Link to="/admin/dashboard" className="flex items-center gap-3 group">
              <div className="w-8 h-8 rounded-lg bg-[#292724] text-[#fdf9f2] flex items-center justify-center font-serif font-bold text-lg shadow-sm group-hover:scale-105 transition-transform">
                R
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-serif text-xl sm:text-2xl font-bold text-[#1c1c18] tracking-tight">
                  ReUse Hub
                </span>
                <span className="px-2 py-0.5 rounded bg-[#ebe8e1] text-[#4a463f] text-[10px] font-semibold uppercase tracking-wider hidden sm:inline-block">
                  HỆ THỐNG QUẢN TRỊ
                </span>
              </div>
            </Link>
          </div>

          {/* Quick links & Profile */}
          <div className="flex items-center gap-4 sm:gap-6">
            {/* Public Market Links */}
            <div className="hidden lg:flex items-center gap-3 text-[#4a463f] text-xs font-medium">
              <span className="uppercase text-[#7b766f] tracking-wider text-[11px] font-semibold">
                Thị Trường:
              </span>
              <Link
                to="/rent"
                className="hover:text-[#1c1c18] hover:underline underline-offset-4 transition-colors"
              >
                Sàn RENT
              </Link>
              <span className="text-[#ccc5bc]">•</span>
              <Link
                to="/thrift"
                className="hover:text-[#1c1c18] hover:underline underline-offset-4 transition-colors"
              >
                Sàn THRIFT
              </Link>
              <span className="text-[#ccc5bc]">•</span>
              <Link
                to="/categories"
                className="hover:text-[#1c1c18] hover:underline underline-offset-4 transition-colors"
              >
                Danh Mục
              </Link>
            </div>

            <div className="flex items-center gap-3 pl-2 sm:pl-4 border-l border-[#ccc5bc]/40">
              {/* Notification Bell */}
              <div className="relative" ref={notifRef}>
                <button
                  type="button"
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 rounded-lg text-[#4a463f] hover:text-[#1c1c18] hover:bg-[#f1ede6] transition-all cursor-pointer"
                  aria-label="Thông báo"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    notifications
                  </span>
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full bg-[#ba1a1a] text-white text-[9px] font-bold flex items-center justify-center animate-pulse">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-[#ccc5bc]/50 py-3 z-50 animate-fade-in">
                    <div className="px-4 py-2 border-b border-[#f1ede6] flex items-center justify-between">
                      <span className="font-semibold text-sm text-[#1c1c18]">
                        Thông Báo Hệ Thống ({total || notifications.length})
                      </span>
                      <div className="flex items-center gap-2">
                        {unreadCount > 0 && (
                          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#ffdad6] text-[#ba1a1a]">
                            {unreadCount} chưa đọc
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => markAllAsRead()}
                          className="text-[11px] text-[#576151] hover:underline cursor-pointer"
                        >
                          Đọc tất cả
                        </button>
                      </div>
                    </div>
                    <div className="divide-y divide-[#f1ede6] max-h-80 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="py-8 text-center text-xs text-[#7b766f]">
                          Hiện tại không có thông báo nào
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n._id || n.id}
                            onClick={() => {
                              markAsRead(n._id || n.id || "");
                              setShowNotifications(false);
                              if (n.link) navigate(n.link);
                            }}
                            className={`p-3.5 transition-colors cursor-pointer ${
                              !n.isRead
                                ? "bg-[#fbf7f0] hover:bg-[#f5efe3]"
                                : "hover:bg-[#f7f3ec]"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <h4
                                className={`text-xs ${
                                  !n.isRead
                                    ? "font-bold text-[#1c1c18]"
                                    : "font-medium text-[#4a463f]"
                                }`}
                              >
                                {!n.isRead && (
                                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#ba1a1a] mr-1.5 mb-0.5" />
                                )}
                                {n.title}
                              </h4>
                              <span className="text-[10px] text-[#7b766f] whitespace-nowrap">
                                {formatTimeAgo(n.createdAt)}
                              </span>
                            </div>
                            <p className="text-[12px] text-[#4a463f] mt-1 line-clamp-2">
                              {n.message}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                    <div className="px-4 pt-2 border-t border-[#f1ede6] flex items-center justify-between text-xs text-[#576151]">
                      <Link
                        to="/admin/rent"
                        onClick={() => setShowNotifications(false)}
                        className="hover:underline font-medium"
                      >
                        Duyệt sản phẩm RENT →
                      </Link>
                      <Link
                        to="/admin/disputes"
                        onClick={() => setShowNotifications(false)}
                        className="hover:underline font-medium"
                      >
                        Xử lý tranh chấp →
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* Admin Profile Chip */}
              <div className="relative" ref={profileRef}>
                <button
                  type="button"
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center gap-3 pl-2 py-1 pr-2 rounded-lg hover:bg-[#f1ede6] transition-all group text-left cursor-pointer"
                >
                  <div className="text-right hidden xl:block">
                    <div className="text-xs font-semibold text-[#1c1c18] truncate max-w-[140px]">
                      {user?.fullName || "Quản Trị Viên Cấp Cao"}
                    </div>
                    <div className="text-[10px] text-[#576151] uppercase tracking-wider flex items-center justify-end gap-1 font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#576151]"></span>
                      Phạm Vi Xác Thực
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-[#292724] text-white flex items-center justify-center font-medium shadow-sm">
                    {user?.avatarUrl ? (
                      <img
                        src={user.avatarUrl}
                        alt="Avatar"
                        className="w-full h-full object-cover rounded-full"
                      />
                    ) : (
                      <span className="material-symbols-outlined text-[18px]">
                        person
                      </span>
                    )}
                  </div>
                </button>

                {/* Profile dropdown */}
                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-[#ccc5bc]/50 py-2 z-50 animate-fade-in">
                    <div className="px-4 py-2 border-b border-[#f1ede6]">
                      <div className="font-semibold text-xs text-[#1c1c18]">
                        {user?.fullName || "Administrator"}
                      </div>
                      <div className="text-[11px] text-[#7b766f] truncate">
                        {user?.email || "admin@reuse.vn"}
                      </div>
                      <div className="mt-1 inline-block px-1.5 py-0.5 rounded text-[9px] font-bold bg-[#d8e3ce] text-[#5b6655] uppercase">
                        Role: {user?.role || "ADMIN"}
                      </div>
                    </div>
                    <Link
                      to="/admin/dashboard"
                      onClick={() => setShowProfileMenu(false)}
                      className="flex items-center gap-2 px-4 py-2 text-xs text-[#4a463f] hover:bg-[#f7f3ec] hover:text-[#1c1c18]"
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        dashboard
                      </span>
                      <span>Bảng điều khiển</span>
                    </Link>
                    <Link
                      to="/profile"
                      onClick={() => setShowProfileMenu(false)}
                      className="flex items-center gap-2 px-4 py-2 text-xs text-[#4a463f] hover:bg-[#f7f3ec] hover:text-[#1c1c18]"
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        badge
                      </span>
                      <span>Hồ sơ tài khoản</span>
                    </Link>
                    <div className="my-1 border-t border-[#f1ede6]"></div>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full text-left flex items-center gap-2 px-4 py-2 text-xs text-[#ba1a1a] hover:bg-[#ffdad6]/40 transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        logout
                      </span>
                      <span>Đăng xuất quản trị</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* POPUP THÔNG BÁO NỔI CHO QUẢN TRỊ VIÊN (ADMIN) */}
      {popupNotification && (
        <aside
          aria-label="Thông báo hệ thống quản trị mới"
          className="fixed top-20 right-4 sm:right-6 z-50 max-w-md w-[calc(100vw-2rem)] sm:w-[400px] bg-white/95 backdrop-blur-md rounded-2xl p-4 border-2 border-[#292724] shadow-[0_16px_48px_rgba(0,0,0,0.2)] animate-fade-in font-sans"
        >
          <div className="flex items-center justify-between pb-2.5 border-b border-[#ebe8e1]">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#ba1a1a]"></span>
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#ba1a1a] bg-[#ffdad6]/60 px-2 py-0.5 rounded-full">
                THÔNG BÁO QUẢN TRỊ • {popupNotification.type || "SYSTEM"}
              </span>
            </div>
            <button
              type="button"
              onClick={() =>
                dismissPopup(popupNotification._id || popupNotification.id || "")
              }
              className="p-1 text-[#7b766f] hover:text-[#1c1c18] hover:bg-[#f1ede6] rounded-lg transition-colors cursor-pointer"
              title="Đóng thông báo"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>

          <div className="mt-2.5">
            <div className="flex items-center justify-between gap-2">
              <h4 className="font-serif font-bold text-sm text-[#1c1c18] leading-snug">
                {popupNotification.title}
              </h4>
              <span className="text-[10px] text-[#7b766f] whitespace-nowrap">
                {formatTimeAgo(popupNotification.createdAt)}
              </span>
            </div>
            <p className="mt-2 text-xs text-[#4a463f] bg-[#fbf7f0] p-3 rounded-xl border border-[#ebe8e1] leading-relaxed">
              {popupNotification.message}
            </p>
            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const id = popupNotification._id || popupNotification.id || "";
                  markAsRead(id);
                  if (popupNotification.link) navigate(popupNotification.link);
                  else navigate("/admin/dashboard");
                }}
                className="flex-1 py-2 px-3 rounded-xl bg-[#292724] hover:bg-[#1c1c18] text-[#fdf9f2] text-xs font-bold tracking-wider uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Kiểm Tra Ngay</span>
                <span className="material-symbols-outlined text-[15px]">
                  arrow_forward
                </span>
              </button>
              <button
                type="button"
                onClick={() =>
                  dismissPopup(popupNotification._id || popupNotification.id || "")
                }
                className="py-2 px-3 rounded-xl border border-[#ccc5bc] hover:bg-[#f1ede6] text-xs font-semibold text-[#4a463f] transition-colors cursor-pointer"
              >
                Để sau
              </button>
            </div>
          </div>
        </aside>
      )}
    </>
  );
};

export default AdminHeader;
