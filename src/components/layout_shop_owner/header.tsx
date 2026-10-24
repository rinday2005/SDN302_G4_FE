import React, { useContext } from "react";
import { Link, NavLink } from "react-router-dom";
import { AuthContext } from "../../context/auth-context";
import { defaultShopProfile } from "../../pages/data/shop/dashboardData";

// Danh mục điều hướng làm việc của Shop Owner
const shopNavItems = [
  { to: "/shop/dashboard", label: "Dashboard", icon: "dashboard" },
  { to: "/shop/rent/products", label: "Kho đồ RENT", icon: "camera" },
  { to: "/shop/orders", label: "Đơn thuê RENT", icon: "assignment" },
  { to: "/shop/thrift/listings", label: "Đồ bán THRIFT", icon: "sell" },
  { to: "/shop/thrift/orders", label: "Đơn bán THRIFT", icon: "local_shipping" },
  { to: "/shop/revenue", label: "Doanh thu", icon: "payments" },
];

export const ShopHeader: React.FC = () => {
  const auth = useContext(AuthContext);
  const user = auth?.user;

  const ownerName = user?.name || user?.username || defaultShopProfile.ownerName;
  const shopName = defaultShopProfile.shopName;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#fdf9f2]/95 backdrop-blur-md border-b border-[#dddad3] shadow-[0_1px_6px_rgba(41,39,36,0.03)]">
      <div className="h-16 max-w-[1536px] mx-auto px-4 lg:px-8 flex items-center justify-between gap-4">
        
        {/* KHỐI TRÁI: Logo + Badge Shop */}
        <div className="flex items-center gap-3 shrink-0">
          <Link to="/shop/dashboard" className="flex items-center gap-2 group">
            <span className="font-serif text-[20px] text-[#141310] tracking-tight font-semibold">
              ReUse Hub
            </span>
          </Link>
          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-[#141310] text-[#fdf9f2]">
            Kênh Quản Trị
          </span>
        </div>

        {/* KHỐI GIỮA: Menu làm việc của Shop (Gom từ subnav lên) */}
        <nav className="hidden xl:flex items-center gap-1.5 overflow-x-auto py-1">
          {shopNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs transition-all whitespace-nowrap ${
                  isActive
                    ? "font-semibold bg-[#141310] text-white shadow-xs"
                    : "font-medium text-[#4a463f] hover:text-[#1c1c18] hover:bg-[#ebe8e1]"
                }`
              }
            >
              <span className="material-symbols-outlined text-[17px]">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* KHỐI PHẢI: Xem sàn + Thông báo + Profile Shop */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Nút thoát về sàn mua sắm dành cho khách */}
          <Link
            to="/"
            className="hidden sm:flex items-center gap-1 px-2.5 py-1 text-xs text-[#57534e] hover:text-[#141310] hover:bg-[#ebe8e1] rounded-lg transition-colors border border-[#dddad3]"
            title="Quay lại giao diện người mua"
          >
            <span className="material-symbols-outlined text-[16px]">storefront</span>
            <span>Xem sàn</span>
          </Link>

          {/* Nút thông báo */}
          <Link
            to="/notifications"
            className="p-1.5 text-[#57534e] hover:text-[#1c1c18] hover:bg-[#ebe8e1] transition-colors rounded-lg relative"
            title="Thông báo Shop"
          >
            <span className="material-symbols-outlined text-[20px] block">notifications</span>
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 absolute top-1.5 right-1.5"></span>
          </Link>

          <div className="h-5 w-px bg-[#dddad3]"></div>

          {/* Profile Shop Owner */}
          <Link
            to="/account-settings"
            className="flex items-center gap-2.5 py-1 px-2 hover:bg-[#f3efe8] transition-colors rounded-lg"
          >
            <div className="text-right hidden md:block">
              <div className="text-[13px] font-semibold text-[#141310] leading-tight truncate max-w-[160px]">
                {shopName}
              </div>
              <div className="text-[10px] tracking-wider text-[#78716c] flex items-center justify-end gap-1 font-medium mt-0.5">
                <span>{ownerName}</span>
                <span className="px-1 py-0.2 rounded bg-[#e7e5e4] text-[#44403c] font-mono text-[9px] font-bold">
                  #OWNER-01
                </span>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-[#141310] flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-white text-[17px]">store</span>
            </div>
          </Link>
        </div>

      </div>

      {/* Dành cho màn hình nhỏ/laptop cỡ vừa: Menu cuộn ngang gọn nhẹ */}
      <div className="xl:hidden w-full bg-[#f7f3ec] border-t border-[#dddad3] px-4 py-1.5 overflow-x-auto flex items-center gap-1.5">
        {shopNavItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `px-2.5 py-1 rounded-md flex items-center gap-1.5 text-[11px] whitespace-nowrap transition-all ${
                isActive
                  ? "font-semibold bg-[#141310] text-white shadow-xs"
                  : "font-medium text-[#4a463f] hover:bg-[#ebe8e1]"
              }`
            }
          >
            <span className="material-symbols-outlined text-[15px]">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>
    </header>
  );
};

export default ShopHeader;