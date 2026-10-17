import React from "react";
import { NavLink, Link, useLocation } from "react-router-dom";

interface AdminSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  rentCount?: number;
  thriftCount?: number;
  kycCount?: number;
  disputeCount?: number;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  isOpen = false,
  onClose,
  rentCount = 0,
  thriftCount = 0,
  kycCount = 1,
  disputeCount = 0,
}) => {
  const location = useLocation();
  const sidebarNavItems = [
    {
      name: "Bảng Điều Khiển",
      path: "/admin/dashboard",
      icon: "dashboard",
    },
    {
      name: "Quản Lý Người Dùng",
      path: "/admin/users",
      icon: "group",
    },
    {
      name: "Xét Duyệt KYC",
      path: "/admin/kyc",
      icon: "badge",
      badge: kycCount,
      badgeColor: "bg-[#d8e3ce] text-[#5b6655]",
    },
    {
      name: "Duyệt Đơn RENT",
      path: "/admin/rent/listings",
      icon: "camera",
      badge: rentCount,
      badgeColor: "bg-[#e7e1dd] text-[#494643]",
    },
    {
      name: "Duyệt Đơn THRIFT",
      path: "/admin/thrift/listings",
      icon: "watch",
      badge: thriftCount,
      badgeColor: "bg-[#f0e0cb] text-[#4f4535]",
    },
    {
      name: "Quản Lý Danh Mục",
      path: "/admin/categories",
      icon: "category",
    },
    {
      name: "Phân Xử Tranh Chấp",
      path: "/admin/disputes",
      icon: "gavel",
      badge: disputeCount,
      badgeColor: "bg-[#ffdad6] text-[#ba1a1a]",
    },
    {
      name: "Tài Chính Toàn Sàn",
      path: "/admin/finance",
      icon: "account_balance_wallet",
    },
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-[#f7f3ec] border-r border-[#ccc5bc]/50 flex flex-col justify-between p-5 transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } lg:sticky lg:top-16 lg:h-[calc(100vh-4rem)] lg:self-start lg:translate-x-0 lg:overflow-y-auto lg:shrink-0 lg:z-30 [scrollbar-width:thin]`}
      >
        <div>
          {/* Header & Logo */}
          <div className="flex items-center justify-between pb-6 border-b border-[#ccc5bc]/30">
            <Link to="/admin/dashboard" className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#292724] text-[#fdf9f2] flex items-center justify-center font-serif font-bold text-lg shadow-sm">
                R
              </div>
              <div>
                <span className="font-serif text-lg font-bold text-[#1c1c18] block leading-none">
                  ReUse Hub
                </span>
                <span className="text-[10px] text-[#7b766f] uppercase tracking-wider font-semibold">
                  Admin Workspace
                </span>
              </div>
            </Link>

            {/* Mobile close button */}
            <button
              type="button"
              onClick={onClose}
              className="lg:hidden p-1.5 rounded-lg text-[#7b766f] hover:text-[#1c1c18] hover:bg-[#ebe8e1]"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          {/* Session Clearance Chip */}
          <div className="my-4 px-3 py-2 rounded-lg bg-[#ebe8e1] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#576151] animate-pulse"></span>
              <span className="text-[11px] font-semibold text-[#1c1c18]">
                Node #ADM-7740
              </span>
            </div>
            <span className="text-[10px] font-mono text-[#7b766f] uppercase">
              SHA-256
            </span>
          </div>

          {/* Nav List */}
          <nav className="space-y-1.5 mt-2" aria-label="Sidebar Menu">
            <div className="text-[10px] font-bold text-[#7b766f] uppercase tracking-wider px-3 mb-2">
              Menu Điều Hành
            </div>

            {sidebarNavItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => onClose && onClose()}
                className={({ isActive }) => {
                  const isCurrentActive =
                    isActive ||
                    (item.path === "/admin/rent/listings" &&
                      (location.pathname.startsWith("/admin/rent") ||
                        location.pathname.startsWith("/admin/duyet-rent"))) ||
                    (item.path === "/admin/kyc" &&
                      (location.pathname.startsWith("/admin/kyc") ||
                        location.pathname.startsWith("/admin/duyet-kyc"))) ||
                    (item.path === "/admin/thrift/listings" &&
                      (location.pathname.startsWith("/admin/thrift") ||
                        location.pathname.startsWith("/admin/duyet-thrift"))) ||
                    (item.path === "/admin/users" &&
                      (location.pathname.startsWith("/admin/user") ||
                        location.pathname.startsWith("/admin/nguoi-dung")));

                  return `flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all group ${
                    isCurrentActive
                      ? "bg-[#292724] text-[#fdf9f2] shadow-sm font-semibold"
                      : "text-[#4a463f] hover:bg-[#ebe8e1] hover:text-[#1c1c18]"
                  }`;
                }}
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[19px]">
                    {item.icon}
                  </span>
                  <span>{item.name}</span>
                </div>

                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${item.badgeColor}`}
                  >
                    {item.badge}
                  </span>
                )}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Footer info in sidebar */}
        <div className="pt-4 border-t border-[#ccc5bc]/30 space-y-3 shrink-0">
          <div className="text-[11px] text-[#7b766f] px-1">
            <div className="font-semibold text-[#1c1c18]">Tiêu chuẩn B-Corp V4.2</div>
            <div>Bảo chứng lưu ký tuần hoàn</div>
          </div>

          <div className="flex items-center justify-between text-xs pt-1">
            <Link
              to="/rent"
              className="text-[#576151] hover:text-[#1c1c18] font-medium flex items-center gap-1"
            >
              <span>Xem Sàn RENT</span>
              <span className="material-symbols-outlined text-[14px]">
                open_in_new
              </span>
            </Link>
            <Link
              to="/thrift"
              className="text-[#7b5227] hover:text-[#1c1c18] font-medium flex items-center gap-1"
            >
              <span>Sàn THRIFT</span>
              <span className="material-symbols-outlined text-[14px]">
                open_in_new
              </span>
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;
