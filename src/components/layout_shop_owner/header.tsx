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

  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const ownerName = user?.name || user?.fullName || user?.username || defaultShopProfile.ownerName;
  const shopName = defaultShopProfile.shopName;
  const userEmail = user?.email || "shopowner@reuse.vn";

  // Đóng dropdown khi click bên ngoài
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
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

  return (
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

          {/* Nút thông báo */}
          <Link
            to="/shop/notifications"
            className="p-1.5 text-[#57534e] hover:text-[#1c1c18] hover:bg-[#ebe8e1] transition-colors rounded-lg relative"
            title="Thông báo Shop"
          >
            <span className="material-symbols-outlined text-[20px] block">notifications</span>
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 absolute top-1.5 right-1.5" />
          </Link>

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
              <span className={`material-symbols-outlined text-[16px] text-[#78716c] transition-transform hidden sm:block ${isProfileOpen ? 'rotate-180' : ''}`}>
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
  );
};

export default ShopHeader;