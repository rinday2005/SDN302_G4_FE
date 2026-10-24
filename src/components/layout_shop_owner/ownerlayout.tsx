import React from "react";
import { Outlet } from "react-router-dom";
import { ShopHeader } from "./header";

export const ShopOwnerLayout: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  return (
    <div className="bg-[#fdf9f2] font-sans text-[#1c1c18] min-h-screen flex flex-col antialiased">
      {/* 1. Thanh Header duy nhất (đã gom menu và profile) */}
      <ShopHeader />

      {/* 2. Main content đẩy lùi vừa đúng 64px (h-16) của header */}
      <main className="w-full pt-16 xl:pt-16 bg-[#fdf9f2] flex-1 flex flex-col">
        <div className="w-full flex-1">
          {children ? children : <Outlet />}
        </div>
      </main>
    </div>
  );
};

export default ShopOwnerLayout;