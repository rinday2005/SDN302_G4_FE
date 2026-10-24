import React from "react";
import { NavLink } from "react-router-dom";

// Tinh gọn danh mục: gom trùng lặp và đồng bộ đúng URL các trang của bạn
const shopNavItems = [
  { to: "/shop/dashboard", label: "Dashboard", icon: "dashboard" },
  { to: "/shop/rent/products", label: "Kho đồ RENT", icon: "camera" },
  { to: "/shop/orders", label: "Đơn thuê RENT", icon: "assignment" },
  { to: "/shop/thrift/listings", label: "Đồ bán THRIFT", icon: "sell" },
  { to: "/shop/thrift/orders", label: "Đơn bán THRIFT", icon: "local_shipping" },
  { to: "/shop/revenue", label: "Doanh thu", icon: "payments" },
];

export const ShopSubNav: React.FC = () => {
  return (
    <nav className="w-full bg-[#f7f3ec] border-b border-[#dddad3] px-4 md:px-12 py-2 overflow-x-auto shadow-xs">
      <div className="max-w-[1440px] mx-auto flex items-center gap-2 sm:gap-4 text-xs whitespace-nowrap">
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#7B766F] pr-3 border-r border-[#dddad3] hidden sm:inline">
          Kênh Quản Trị
        </span>
        {shopNavItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-all text-xs ${
                isActive
                  ? "font-semibold bg-[#141310] text-white shadow-xs"
                  : "font-medium text-[#4a463f] hover:text-[#1c1c18] hover:bg-[#ebe8e1]"
              }`
            }
          >
            <span className="material-symbols-outlined text-[16px]">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default ShopSubNav;