import React, { useState, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../../../context/auth-context";

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

  const notifications = [
    {
      id: "n1",
      title: "Hồ sơ KYC mới cần phê duyệt",
      desc: "Người dùng Lê Văn C - Chưa KYC (user_c_nokyc_test_s3@reuse.vn) đã nộp hồ sơ CCCD gắn chip",
      time: "15 phút trước",
      urgent: true,
    },
    {
      id: "n2",
      title: "Kho hàng RENT sẵn sàng",
      desc: "Sản phẩm 'Áo dài cách tân gấm hoa mai' của ReUse Official Shop đang hoạt động",
      time: "45 phút trước",
      urgent: false,
    },
    {
      id: "n3",
      title: "Sổ cái lưu ký an toàn",
      desc: "Đã đồng bộ 11 thành viên và 5 danh mục trên cơ sở dữ liệu MongoDB",
      time: "1 giờ trước",
      urgent: false,
    },
  ];

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
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 rounded-lg text-[#4a463f] hover:text-[#1c1c18] hover:bg-[#f1ede6] transition-all"
                  aria-label="Thông báo"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    notifications
                  </span>
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#ba1a1a] animate-pulse"></span>
                </button>

                {/* Notifications Dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-[#ccc5bc]/50 py-3 z-50 animate-fade-in">
                    <div className="px-4 py-2 border-b border-[#f1ede6] flex items-center justify-between">
                      <span className="font-semibold text-sm text-[#1c1c18]">
                        Thông Báo Hệ Thống
                      </span>
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#ffdad6] text-[#ba1a1a]">
                        3 khẩn cấp
                      </span>
                    </div>
                    <div className="divide-y divide-[#f1ede6] max-h-72 overflow-y-auto">
                      {notifications.map((n) => (
                        <div
                          key={n.id}
                          className="p-3.5 hover:bg-[#f7f3ec] transition-colors cursor-pointer"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="text-xs font-semibold text-[#1c1c18]">
                              {n.title}
                            </h4>
                            <span className="text-[10px] text-[#7b766f] whitespace-nowrap">
                              {n.time}
                            </span>
                          </div>
                          <p className="text-[12px] text-[#4a463f] mt-1 line-clamp-2">
                            {n.desc}
                          </p>
                        </div>
                      ))}
                    </div>
                    <div className="px-4 pt-2 border-t border-[#f1ede6] text-center">
                      <Link
                        to="/admin/kyc"
                        onClick={() => setShowNotifications(false)}
                        className="text-xs text-[#576151] hover:underline font-medium"
                      >
                        Xem tất cả thông báo hệ thống →
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* Admin Profile Chip */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center gap-3 pl-2 py-1 pr-2 rounded-lg hover:bg-[#f1ede6] transition-all group text-left"
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
                      className="w-full text-left flex items-center gap-2 px-4 py-2 text-xs text-[#ba1a1a] hover:bg-[#ffdad6]/40 transition-colors"
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
  );
};

export default AdminHeader;
