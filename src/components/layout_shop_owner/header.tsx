import { useNotification } from "../../hooks/useNotification";
import React, { useContext, useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/auth-context";
import { defaultShopProfile } from "../../pages/data/shop/dashboardData";

interface ShopHeaderProps {
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}

export const ShopHeader: React.FC<ShopHeaderProps> = ({
  onToggleSidebar,
  isSidebarOpen = false,
}) => {
  const auth = useContext(AuthContext);
  const user = auth?.user;
  const navigate = useNavigate();

  const { notifications, unreadCount, markAsRead, markAllAsRead, total } = useNotification();
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
  const [isNotifOpen, setIsNotifOpen] = useState<boolean>(false);
  const [dismissedPopups, setDismissedPopups] = useState<string[]>([]);

  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const notifDropdownRef = useRef<HTMLDivElement | null>(null);

  const ownerName = user?.name || user?.fullName || user?.username || defaultShopProfile.ownerName;
  const shopName = defaultShopProfile.shopName;
  const userEmail = user?.email || "shopowner@reuse.vn";

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

  // Đóng dropdown khi click bên ngoài
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (dropdownRef.current && !dropdownRef.current.contains(target)) {
        setIsProfileOpen(false);
      }
      if (notifDropdownRef.current && !notifDropdownRef.current.contains(target)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Xử lý đăng xuất
  const handleLogout = () => {
    setIsProfileOpen(false);
    auth?.logout();
    navigate("/login");
  };

  // Tìm thông báo đơn thuê cần duyệt chưa đọc và chưa bị ẩn tạm thời
  const pendingApprovalNotif = notifications.find((n) => {
    const id = n._id || n.id || "";
    if (n.isRead || dismissedPopups.includes(id)) return false;
    const titleLower = (n.title || "").toLowerCase();
    const msgLower = (n.message || "").toLowerCase();
    return (
      n.type === "RENTAL_ORDER" &&
      (titleLower.includes("chờ duyệt") ||
        titleLower.includes("cần duyệt") ||
        titleLower.includes("mới") ||
        msgLower.includes("chờ duyệt") ||
        (n.title || "").includes("RO-1794180878569-LIS0"))
    );
  });

  let popupOrderCode = "RO-1794180878569-LIS0";
  let popupProductName = "Set Áo Voan Cổ Thắt Nơ Tay Bèo Kết Hợp Chân Váy Đen Cạp Cao";
  let popupCustomer = "Nguyễn Hơn";
  const popupDates = "18/11/2026 - 21/11/2026";
  const popupTotal = "505.000 ₫";
  const popupDeposit = "250.000 ₫ (Escrow)";
  let popupLink = "/shop/rent/orders/RO-1794180878569-LIS0";

  if (pendingApprovalNotif) {
    const codeMatch =
      (pendingApprovalNotif.title || "").match(/(RO-[A-Z0-9-]+)/i) ||
      (pendingApprovalNotif.message || "").match(/(RO-[A-Z0-9-]+)/i);
    if (codeMatch) {
      popupOrderCode = codeMatch[1];
      popupLink = `/shop/rent/orders/${popupOrderCode}`;
    }
    if (pendingApprovalNotif.link) {
      popupLink = pendingApprovalNotif.link;
    }
    const msg = pendingApprovalNotif.message || "";
    const nameMatch = msg.match(/Khách hàng ([^v]+) vừa/i);
    if (nameMatch) {
      popupCustomer = nameMatch[1].trim();
    }
    const prodMatch = msg.match(/sản phẩm '([^']+)'/i);
    if (prodMatch) {
      popupProductName = prodMatch[1].trim();
    }
  }

  const handleOpenOrder = (notifId?: string, targetLink?: string) => {
    if (notifId) {
      markAsRead(notifId);
    }
    if (targetLink) {
      navigate(targetLink);
    }
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 bg-[#fdf9f2]/95 backdrop-blur-md border-b border-[#dddad3] shadow-[0_1px_6px_rgba(41,39,36,0.03)] h-16">
        <div className="h-full w-full px-4 lg:px-6 flex items-center justify-between gap-4">
          {/* KHỐI TRÁI: Nút Bật/Tắt Sidebar + Logo + Badge */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={onToggleSidebar}
              className="p-2 rounded-lg bg-[#ede8df] hover:bg-[#e2dcce] text-[#141310] border border-[#dddad3] transition-all flex items-center justify-center shadow-2xs group cursor-pointer"
              title={isSidebarOpen ? "Đóng sidebar menu" : "Mở sidebar menu"}
              aria-label={isSidebarOpen ? "Đóng sidebar menu" : "Mở sidebar menu"}
            >
              <span className="material-symbols-outlined text-[21px] block transition-transform group-hover:scale-110">
                {isSidebarOpen ? "close" : "menu"}
              </span>
            </button>

            {/* Logo ReUse Hub */}
            <Link to="/shop/dashboard" className="flex items-center gap-2 group">
              <span className="font-serif text-[20px] text-[#141310] tracking-tight font-semibold">
                ReUse Hub
              </span>
            </Link>

            {/* Badge phân loại role */}
            <span className="hidden sm:inline-flex text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-[#141310] text-[#fdf9f2]">
              Kênh Quản Trị
            </span>
          </div>

          {/* KHỐI GIỮA: Ô tìm kiếm / Thông tin nhanh */}
          <div className="hidden md:flex items-center gap-4 flex-1 max-w-xl mx-4">
            <div className="relative w-full max-w-md">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-[#78716c]">
                search
              </span>
              <input
                type="text"
                placeholder="Tìm mã đơn hàng, sản phẩm, hiện vật..."
                className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-[#f4efe6] border border-[#dddad3] text-xs text-[#1c1c18] placeholder-[#78716c] focus:outline-none focus:border-[#141310] focus:bg-white transition-all"
              />
            </div>

            <div className="hidden xl:flex items-center gap-2 px-3 py-1 rounded-full bg-[#d8e3ce]/70 border border-[#c4d4b7] text-[11px] text-[#3f4a3a] shrink-0 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
              <span>Escrow Active • Bàn kiểm định mở</span>
            </div>
          </div>

          {/* KHỐI PHẢI: Nút Xem sàn + Thông báo + Profile Dropdown */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Nút thoát về sàn mua sắm dành cho khách */}
            <Link
              to="/"
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-[#57534e] hover:text-[#141310] hover:bg-[#ebe8e1] rounded-lg transition-colors border border-[#dddad3]"
              title="Quay lại giao diện người mua"
            >
              <span className="material-symbols-outlined text-[16px]">storefront</span>
              <span className="hidden sm:inline">Xem sàn</span>
            </Link>

            {/* Nút thông báo kèm Dropdown */}
            <div className="relative" ref={notifDropdownRef}>
              <button
                type="button"
                onClick={() => setIsNotifOpen((prev) => !prev)}
                className="p-1.5 text-[#57534e] hover:text-[#1c1c18] hover:bg-[#ebe8e1] transition-colors rounded-lg relative cursor-pointer"
                title="Thông báo Shop"
                aria-expanded={isNotifOpen}
              >
                <span className="material-symbols-outlined text-[20px] block">notifications</span>
                {unreadCount > 0 && (
                  <span className="min-w-4 h-4 px-1 rounded-full bg-rose-500 text-white text-[9px] font-bold absolute -top-1 -right-1 flex items-center justify-center animate-pulse">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {/* Dropdown Menu Thông Báo */}
              {isNotifOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-[#dddad3] py-3 z-50 animate-fade-in font-sans">
                  <div className="px-4 py-2 border-b border-[#f1eee7] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs uppercase tracking-wider text-[#141310]">
                        Thông Báo Xưởng
                      </span>
                      {unreadCount > 0 && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-700">
                          {unreadCount} mới
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => markAllAsRead()}
                      className="text-[11px] text-[#6c5937] hover:underline cursor-pointer font-medium"
                    >
                      Đọc tất cả
                    </button>
                  </div>

                  <div className="divide-y divide-[#f1eee7] max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="py-8 text-center text-xs text-[#78716c]">
                        Hiện tại không có thông báo nào
                      </div>
                    ) : (
                      notifications.slice(0, 6).map((n) => (
                        <div
                          key={n._id || n.id}
                          onClick={() => {
                            markAsRead(n._id || n.id || "");
                            setIsNotifOpen(false);
                            if (n.link) navigate(n.link);
                          }}
                          className={`p-3.5 transition-colors cursor-pointer ${
                            !n.isRead ? "bg-[#fbf9f4] hover:bg-[#f5efe3]" : "hover:bg-[#f7f3ec]"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <h5
                              className={`text-xs ${
                                !n.isRead ? "font-bold text-[#141310]" : "font-medium text-[#57534e]"
                              }`}
                            >
                              {!n.isRead && (
                                <span className="inline-block w-1.5 h-1.5 rounded-full bg-rose-500 mr-1.5 mb-0.5" />
                              )}
                              {n.title}
                            </h5>
                            <span className="text-[10px] text-[#78716c] whitespace-nowrap">
                              {formatTimeAgo(n.createdAt)}
                            </span>
                          </div>
                          <p className="text-[12px] text-[#57534e] mt-1 line-clamp-2">
                            {n.message}
                          </p>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="px-4 pt-2.5 border-t border-[#f1eee7] flex items-center justify-between text-xs text-[#6c5937]">
                    <Link
                      to="/shop/rent/orders"
                      onClick={() => setIsNotifOpen(false)}
                      className="hover:underline font-semibold"
                    >
                      Quản lý đơn thuê →
                    </Link>
                    <Link
                      to="/shop/notifications"
                      onClick={() => setIsNotifOpen(false)}
                      className="hover:underline font-semibold"
                    >
                      Xem tất cả ({total || notifications.length}) →
                    </Link>
                  </div>
                </div>
              )}
            </div>

            <div className="h-5 w-px bg-[#dddad3]" />

            {/* Profile Shop Owner Dropdown Menu */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsProfileOpen((prev) => !prev)}
                className="flex items-center gap-2.5 py-1 px-2 hover:bg-[#f3efe8] transition-colors rounded-lg cursor-pointer group text-left"
                title="Tài khoản xưởng & Tùy chọn"
                aria-expanded={isProfileOpen}
              >
                <div className="text-right hidden md:block">
                  <div className="text-[13px] font-semibold text-[#141310] leading-tight truncate max-w-[150px]">
                    {shopName}
                  </div>
                  <div className="text-[10px] tracking-wider text-[#78716c] flex items-center justify-end gap-1 font-medium mt-0.5">
                    <span>{ownerName}</span>
                    <span className="px-1 py-0.2 rounded bg-[#e7e5e4] text-[#44403c] font-mono text-[9px] font-bold">
                      #OWNER-01
                    </span>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-[#141310] text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                  <span className="material-symbols-outlined text-[17px]">store</span>
                </div>
                <span
                  className={`material-symbols-outlined text-[16px] text-[#78716c] transition-transform hidden sm:block ${
                    isProfileOpen ? "rotate-180" : ""
                  }`}
                >
                  expand_more
                </span>
              </button>

              {/* Dropdown Menu */}
              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-[#dddad3] p-2 z-50 animate-fade-in font-sans">
                  {/* Thông tin tóm tắt Shop Owner */}
                  <div className="p-3 bg-[#fbf9f4] border border-[#f1eee7] rounded-xl flex items-center gap-3 mb-1.5">
                    <div className="w-10 h-10 rounded-full bg-[#141310] text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                      <span className="material-symbols-outlined text-[20px]">store</span>
                    </div>
                    <div className="overflow-hidden flex-1 min-w-0">
                      <p className="text-xs font-bold text-[#141310] truncate leading-tight">
                        {shopName}
                      </p>
                      <p className="text-[11px] text-[#78716c] truncate mt-0.5">
                        {ownerName} • {userEmail}
                      </p>
                      <div className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded-full bg-[#d8e3ce]/80 text-[#3f4a3a] text-[9px] font-bold tracking-wider">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                        <span>SHOP OWNER</span>
                      </div>
                    </div>
                  </div>

                  {/* Các liên kết điều hướng tinh gọn */}
                  <div className="space-y-0.5">
                    <Link
                      to="/shop/profile"
                      onClick={() => setIsProfileOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#1c1c18] hover:bg-[#f7f3ec] transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px] text-[#78716c]">badge</span>
                      <span>Hồ sơ shop</span>
                    </Link>
                  </div>

                  {/* Đường phân cách */}
                  <div className="border-t border-[#f1eee7] my-1" />

                  {/* NÚT ĐĂNG XUẤT NỔI BẬT */}
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors text-left cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px] text-red-500">logout</span>
                    <span>Đăng xuất</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* POPUP THÔNG BÁO NHẢY RA KHI CÓ ĐƠN THUÊ CẦN DUYỆT */}
      {pendingApprovalNotif && (
        <aside
          aria-label="Thông báo đơn thuê mới cần duyệt"
          className="fixed top-20 right-4 sm:right-6 z-50 max-w-md w-[calc(100vw-2rem)] sm:w-[420px] bg-white/95 backdrop-blur-md rounded-2xl p-5 border-2 border-[#141310] shadow-[0_16px_48px_rgba(0,0,0,0.2)] animate-fade-in font-sans"
        >
          <div className="flex items-center justify-between pb-3 border-b border-[#ede8df]">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-600"></span>
              </span>
              <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                ĐƠN THUÊ MỚI CẦN DUYỆT
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                const id = pendingApprovalNotif._id || pendingApprovalNotif.id || "";
                setDismissedPopups((prev) => [...prev, id]);
              }}
              className="p-1 text-[#78716c] hover:text-[#141310] hover:bg-[#ede8df] rounded-lg transition-colors cursor-pointer"
              title="Đóng thông báo"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>

          <div className="mt-3">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-[#141310] text-[#fdf9f2]">
                #{popupOrderCode}
              </span>
              <span className="text-[11px] text-[#78716c]">
                {formatTimeAgo(pendingApprovalNotif.createdAt)}
              </span>
            </div>
            <h4 className="font-serif text-sm sm:text-base font-semibold text-[#141310] mt-1.5 leading-snug">
              {popupProductName}
            </h4>

            <div className="mt-3 grid grid-cols-2 gap-2 text-xs bg-[#fbf9f4] p-3 rounded-xl border border-[#ede8df]">
              <div>
                <span className="text-[10px] uppercase text-[#78716c] font-medium block">
                  Khách thuê
                </span>
                <span className="font-semibold text-[#141310] truncate block">
                  {popupCustomer}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase text-[#78716c] font-medium block">
                  Kỳ hạn thuê
                </span>
                <span className="font-semibold text-[#141310] block">
                  {popupDates}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase text-[#78716c] font-medium block">
                  Tổng tiền
                </span>
                <span className="font-semibold text-[#141310] block">
                  {popupTotal}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase text-[#78716c] font-medium block">
                  Cọc Escrow
                </span>
                <span className="font-bold text-emerald-700 block">
                  {popupDeposit}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                handleOpenOrder(
                  pendingApprovalNotif._id || pendingApprovalNotif.id || "",
                  popupLink
                )
              }
              className="mt-3 w-full py-2.5 px-4 rounded-xl bg-[#141310] hover:bg-[#2c2a26] text-[#fdf9f2] text-xs font-bold tracking-wider uppercase transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer hover:shadow-md"
            >
              <span>Kiểm Tra &amp; Phê Duyệt Ngay</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
          </div>
        </aside>
      )}
    </>
  );
};

export default ShopHeader;
