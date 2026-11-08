import React, { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { ShopHeader } from "./header";
import { ShopSidebar } from "./sidebar";
import { ShopChatProvider } from "../../context/ShopChatContext";
import { ShopChatDrawer } from "../chat/ShopChatDrawer";

export const ShopOwnerLayout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  const [prevPathname, setPrevPathname] = useState(location.pathname);

  // Tự động đóng sidebar khi chuyển trang
  if (prevPathname !== location.pathname) {
    setPrevPathname(location.pathname);
    setIsSidebarOpen(false);
  }

  return (
    <ShopChatProvider>
      <div className="bg-[#fdf9f2] font-sans text-[#1c1c18] min-h-screen flex flex-col antialiased selection:bg-[#d8e3ce] selection:text-[#1c1c18]">
        {/* 1. Header trên cùng có nút bấm Mở/Đóng Menu Xưởng */}
        <ShopHeader
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        />

        {/* 2. Sidebar trượt từ bên trái khi bấm nút + Main Content rộng rãi */}
        <div className="flex flex-1 w-full pt-16">
          {/* Sidebar trượt từ trái ra khi isSidebarOpen === true */}
          <ShopSidebar
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
          />

          {/* Nội dung chính */}
          <main className="flex-1 w-full min-w-0 bg-[#fdf9f2] flex flex-col overflow-x-clip">
            {children ? children : <Outlet />}
          </main>
        </div>

        {/* 3. Khung chat Drawer Real-time cho Shop Owner */}
        <ShopChatDrawer />
      </div>
    </ShopChatProvider>
  );
};

export default ShopOwnerLayout;