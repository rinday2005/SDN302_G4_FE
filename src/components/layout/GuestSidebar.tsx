import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

export interface GuestSidebarProps {
  className?: string;
  activeKey?: string;
  isCollapsed?: boolean;
  onToggleCollapse?: (collapsed: boolean) => void;
  hideFloatingToggle?: boolean;
}

const HEADER_H = 112;

export const GuestSidebar: React.FC<GuestSidebarProps> = ({
  className = '',
  activeKey,
  isCollapsed: propIsCollapsed,
  onToggleCollapse,
}) => {
  const location = useLocation();

  // Internal collapse state synchronized via localStorage
  const [internalCollapsed, setInternalCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('reuse_user_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const effectiveCollapsed = propIsCollapsed !== undefined ? propIsCollapsed : internalCollapsed;

  const handleDesktopCollapse = () => {
    const next = !effectiveCollapsed;
    setInternalCollapsed(next);
    try {
      localStorage.setItem('reuse_user_sidebar_collapsed', String(next));
    } catch {
      // ignore
    }
    if (onToggleCollapse) {
      onToggleCollapse(next);
    }
    window.dispatchEvent(new CustomEvent('reuse_user_sidebar_toggle', { detail: next }));
  };

  // Sync with global toggle events
  useEffect(() => {
    const handleSync = (e: Event) => {
      const customEvent = e as CustomEvent<boolean>;
      if (typeof customEvent.detail === 'boolean') {
        setInternalCollapsed(customEvent.detail);
      }
    };
    window.addEventListener('reuse_user_sidebar_toggle', handleSync);
    return () => window.removeEventListener('reuse_user_sidebar_toggle', handleSync);
  }, []);

  const currentPath = location.pathname;

  const isCurrent = (key: string, path: string, exact?: boolean) => {
    if (activeKey) return activeKey === key;
    if (exact || path === '/') {
      return currentPath === path;
    }
    return currentPath === path || currentPath.startsWith(path + '/');
  };

  const handleLinkClick = () => {
    setMobileDrawerOpen(false);
  };

  const sidebarContent = (
    <div className="space-y-6">
      {/* ── Guest Welcome & Quick Access Card ── */}
      <div className="p-4 rounded-2xl bg-white border border-[#E8E4DC]/80 shadow-2xs space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-[#F4F0EA] border border-[#E8E4DC] shadow-2xs shrink-0 flex items-center justify-center text-[#1C1A18]">
            <svg className="w-5 h-5 text-[#5E6D5B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7 7z" />
            </svg>
          </div>
          <div className="overflow-hidden">
            <h4 className="text-xs font-bold text-[#1C1A18] truncate">Khách vãng lai</h4>
            <p className="text-[10px] text-[#76726B] truncate">Chế độ trải nghiệm</p>
            <div className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded-full bg-[#F4F0EA] text-[#76726B] text-[9px] font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#8E8A82]" />
              <span>Chưa đăng nhập</span>
            </div>
          </div>
        </div>

        {/* Call to action buttons */}
        <div className="pt-2 border-t border-[#E8E4DC]/60 grid grid-cols-2 gap-2">
          <Link
            to="/login"
            onClick={handleLinkClick}
            className="px-2.5 py-2 text-center text-[11px] font-bold rounded-xl bg-[#1C1A18] text-white hover:bg-[#2C2926] transition-all shadow-2xs flex items-center justify-center gap-1"
          >
            <span>Đăng nhập</span>
          </Link>
          <Link
            to="/register"
            onClick={handleLinkClick}
            className="px-2.5 py-2 text-center text-[11px] font-bold rounded-xl bg-[#F4F0EA] text-[#1C1A18] hover:bg-[#E7E2DA] border border-[#E8E4DC] transition-all flex items-center justify-center gap-1"
          >
            <span>Đăng ký</span>
          </Link>
        </div>
      </div>

      {/* ── Navigation Group 1: Khám phá dịch vụ ── */}
      <div className="space-y-1">
        <div className="px-3 pb-1.5 text-[10px] uppercase font-bold tracking-wider text-[#76726B]">
          Khám phá dịch vụ
        </div>

        {/* Trang chủ */}
        <Link
          to="/"
          onClick={handleLinkClick}
          className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl font-semibold text-xs transition-colors shadow-2xs ${
            isCurrent('home', '/', true)
              ? 'bg-[#1C1A18] text-white'
              : 'text-[#1C1A18] hover:bg-white border border-transparent hover:border-[#E8E4DC]/60'
          }`}
        >
          <div className="flex items-center gap-3">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
            <span>Trang chủ (Khách)</span>
          </div>
          {isCurrent('home', '/', true) && (
            <span className="w-1.5 h-1.5 rounded-full bg-white" />
          )}
        </Link>

        {/* RENT */}
        <Link
          to="/rent"
          onClick={handleLinkClick}
          className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-xs transition-colors group ${
            isCurrent('rent', '/rent')
              ? 'bg-[#1C1A18] text-white'
              : 'text-[#1C1A18] hover:bg-white border border-transparent hover:border-[#E8E4DC]/60'
          }`}
        >
          <div className="flex items-center gap-3">
            <svg
              className="w-4 h-4 text-[#76726B] group-hover:text-[#1C1A18]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="M13 10V3L4 14h7v7l9-11h-7z"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.8"
              />
            </svg>
            <span>Khám phá RENT</span>
          </div>
          <span className="text-[10px] text-[#76726B] bg-[#EFECE6] px-1.5 py-0.5 rounded font-medium">
            HOT
          </span>
        </Link>

        {/* THRIFT */}
        <Link
          to="/thrift"
          onClick={handleLinkClick}
          className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-xs transition-colors group ${
            isCurrent('thrift', '/thrift')
              ? 'bg-[#1C1A18] text-white'
              : 'text-[#1C1A18] hover:bg-white border border-transparent hover:border-[#E8E4DC]/60'
          }`}
        >
          <div className="flex items-center gap-3">
            <svg
              className="w-4 h-4 text-[#76726B] group-hover:text-[#1C1A18]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.8"
              />
            </svg>
            <span>Kho đồ THRIFT</span>
          </div>
          <span className="text-[10px] text-[#76726B] bg-[#EFECE6] px-1.5 py-0.5 rounded font-medium">
            340+
          </span>
        </Link>

        {/* Categories Bộ sưu tầm */}
        <Link
          to="/categories"
          onClick={handleLinkClick}
          className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-xs transition-colors group ${
            isCurrent('categories', '/categories')
              ? 'bg-[#1C1A18] text-white'
              : 'text-[#1C1A18] hover:bg-white border border-transparent hover:border-[#E8E4DC]/60'
          }`}
        >
          <div className="flex items-center gap-3">
            <svg
              className="w-4 h-4 text-[#76726B] group-hover:text-[#1C1A18]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.8"
              />
            </svg>
            <span>Categories bộ sưu tầm</span>
          </div>
          <span className="text-[10px] text-[#76726B] bg-[#EFECE6] px-1.5 py-0.5 rounded font-medium">
            Mục
          </span>
        </Link>

        {/* Cart */}
        <Link
          to="/cart"
          onClick={handleLinkClick}
          className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-xs transition-colors group ${
            isCurrent('cart', '/cart')
              ? 'bg-[#1C1A18] text-white'
              : 'text-[#1C1A18] hover:bg-white border border-transparent hover:border-[#E8E4DC]/60'
          }`}
        >
          <div className="flex items-center gap-3">
            <svg
              className="w-4 h-4 text-[#76726B] group-hover:text-[#1C1A18]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.8"
              />
            </svg>
            <span>Giỏ hàng tuần hoàn</span>
          </div>
        </Link>
      </div>

      {/* ── Navigation Group 2: Hệ sinh thái & Hướng dẫn ── */}
      <div className="space-y-1">
        <div className="px-3 pb-1.5 text-[10px] uppercase font-bold tracking-wider text-[#76726B]">
          Hệ sinh thái &amp; Hướng dẫn
        </div>

        {/* How it works */}
        <Link
          to="/how-it-works"
          onClick={handleLinkClick}
          className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-xs transition-colors group ${
            isCurrent('how-it-works', '/how-it-works')
              ? 'bg-[#1C1A18] text-white'
              : 'text-[#1C1A18] hover:bg-white border border-transparent hover:border-[#E8E4DC]/60'
          }`}
        >
          <div className="flex items-center gap-3">
            <svg
              className="w-4 h-4 text-[#76726B] group-hover:text-[#1C1A18]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.8"
              />
            </svg>
            <span>Cách hoạt động</span>
          </div>
        </Link>

        {/* About */}
        <Link
          to="/about"
          onClick={handleLinkClick}
          className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-xs transition-colors group ${
            isCurrent('about', '/about')
              ? 'bg-[#1C1A18] text-white'
              : 'text-[#1C1A18] hover:bg-white border border-transparent hover:border-[#E8E4DC]/60'
          }`}
        >
          <div className="flex items-center gap-3">
            <svg
              className="w-4 h-4 text-[#76726B] group-hover:text-[#1C1A18]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.8"
              />
            </svg>
            <span>Giới thiệu ReUse Hub</span>
          </div>
        </Link>

        {/* FAQ */}
        <Link
          to="/faq"
          onClick={handleLinkClick}
          className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-xs transition-colors group ${
            isCurrent('faq', '/faq')
              ? 'bg-[#1C1A18] text-white'
              : 'text-[#1C1A18] hover:bg-white border border-transparent hover:border-[#E8E4DC]/60'
          }`}
        >
          <div className="flex items-center gap-3">
            <svg
              className="w-4 h-4 text-[#76726B] group-hover:text-[#1C1A18]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.8"
              />
            </svg>
            <span>Câu hỏi thường gặp FAQ</span>
          </div>
        </Link>

        {/* Contact */}
        <Link
          to="/contact"
          onClick={handleLinkClick}
          className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-xs transition-colors group ${
            isCurrent('contact', '/contact')
              ? 'bg-[#1C1A18] text-white'
              : 'text-[#1C1A18] hover:bg-white border border-transparent hover:border-[#E8E4DC]/60'
          }`}
        >
          <div className="flex items-center gap-3">
            <svg
              className="w-4 h-4 text-[#76726B] group-hover:text-[#1C1A18]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.8"
              />
            </svg>
            <span>Liên hệ hỗ trợ</span>
          </div>
        </Link>
      </div>

      {/* ── Member Perks Box ── */}
      <div className="p-3.5 rounded-2xl bg-[#EFECE6]/70 border border-[#E8E4DC] text-[11px] text-[#76726B] space-y-2">
        <div className="flex items-center gap-1.5 font-bold text-[#1C1A18] text-xs">
          <svg className="w-3.5 h-3.5 text-[#5E6D5B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
            />
          </svg>
          <span>Đặc quyền thành viên</span>
        </div>
        <p className="leading-relaxed">
          Đăng ký tài khoản để định danh KYC, tích luỹ tín nhiệm và thuê thiết bị cao cấp với mức đặt cọc tối thiểu.
        </p>
        <Link
          to="/register"
          onClick={handleLinkClick}
          className="inline-flex items-center gap-1 text-[11px] font-bold text-[#1C1A18] hover:underline pt-0.5"
        >
          <span>Tạo tài khoản miễn phí</span>
          <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
        </Link>
      </div>

      {/* ── Trust & 100% Circular Guarantee Box ── */}
      <div className="p-3.5 rounded-2xl bg-white border border-[#E8E4DC] text-[11px] text-[#76726B] space-y-1.5 shadow-2xs">
        <div className="flex items-center gap-1.5 font-bold text-[#1C1A18] text-xs">
          <svg className="w-3.5 h-3.5 text-[#5E6D5B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
          </svg>
          <span>Tuần hoàn 100% minh bạch</span>
        </div>
        <p className="leading-relaxed">
          Mọi sản phẩm trên ReUse Hub đều được kiểm tra đối soát, khử khuẩn chuyên sâu và bảo chứng cọc qua ví Escrow.
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* ── Desktop Fixed/Static Sidebar (Shown persistently on left side) ── */}
      <aside
        className={`hidden lg:block self-stretch transition-all duration-300 ease-in-out shrink-0 select-none ${
          effectiveCollapsed
            ? 'w-0 -mr-8 opacity-0 pointer-events-none overflow-hidden'
            : 'w-64 mr-0 opacity-100'
        } ${className}`}
      >
        <div className="w-64 sticky top-28 space-y-3 max-h-[calc(100vh-7.5rem)] overflow-y-auto thin-scrollbar pr-1 pb-4">
          {/* Header row with inline collapse button */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#5E6D5B]" />
              <span className="text-[11px] font-bold text-[#76726B] uppercase tracking-wider">
                Khách vãng lai
              </span>
            </div>
            <button
              type="button"
              onClick={handleDesktopCollapse}
              title="Thu gọn menu điều hướng"
              className="flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-[#76726B] hover:text-[#1C1A18] hover:bg-[#EFECE6] rounded-lg transition-colors cursor-pointer group"
            >
              <span className="material-symbols-outlined text-[15px] group-hover:scale-110 transition-transform">
                menu
              </span>
            </button>
          </div>

          {sidebarContent}
        </div>
      </aside>

      {/* ── Mobile Slide-out Drawer (only on screens < lg) ── */}
      {mobileDrawerOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-xs transition-opacity animate-fade-in"
          onClick={() => setMobileDrawerOpen(false)}
        />
      )}
      <aside
        style={{ top: `${HEADER_H}px`, height: `calc(100vh - ${HEADER_H}px)` }}
        className={`lg:hidden fixed left-0 z-50 w-72 sm:w-80 bg-[#FBF9F5] border-r border-[#E7E2DA] flex flex-col shadow-2xl transition-transform duration-300 ease-in-out ${
          mobileDrawerOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#E8E4DC]/80 bg-white/80 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#5E6D5B]" />
            <span className="text-[11px] font-bold text-[#1C1A18] uppercase tracking-wider">
              Khách vãng lai
            </span>
          </div>
          <button
            type="button"
            onClick={() => setMobileDrawerOpen(false)}
            className="p-1 text-[#76726B] hover:text-[#1C1A18] hover:bg-[#F4F0EA] rounded-md transition-colors cursor-pointer"
            title="Đóng menu"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-6 thin-scrollbar">
          {sidebarContent}
        </div>
      </aside>
    </>
  );
};

export default GuestSidebar;
