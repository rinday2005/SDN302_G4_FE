import React, { useState, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useCartWishlist } from '../../context/CartWishlistContext';
import { getMyRentalOrdersApi } from '../../services/order.api';

export interface UserSidebarProps {
  className?: string;
  activeKey?: string;
  mode?: 'static' | 'drawer';
  avatarUrl?: string;
  displayName?: string;
  displayEmail?: string;
  isCollapsed?: boolean;
  onToggleCollapse?: (collapsed: boolean) => void;
  hideFloatingToggle?: boolean;
}

const HEADER_H = 112;

export const UserSidebar: React.FC<UserSidebarProps> = ({
  className = '',
  activeKey,
  avatarUrl: propAvatarUrl,
  displayName: propDisplayName,
  displayEmail: propDisplayEmail,
  isCollapsed: propIsCollapsed,
  onToggleCollapse,
  hideFloatingToggle = false,
}) => {
  const { user } = useAuth();
  const { wishlistCount } = useCartWishlist();
  const location = useLocation();

  // If the logged in user is an ADMIN, AdminLayout already provides AdminSidebar.
  // Suppress UserSidebar to prevent duplicate sidebars when browsing public market pages.
  const currentRole = useMemo(() => {
    if (user?.role) return user.role.toUpperCase();
    try {
      const savedUser = localStorage.getItem("user");
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        return parsed?.role?.toUpperCase();
      }
    } catch {
      // ignore
    }
    return undefined;
  }, [user]);

  if (currentRole === 'ADMIN') {
    return null;
  }

  // Internal collapse state (Default: false = EXPANDED / SHOWN)
  const [internalCollapsed, setInternalCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('reuse_user_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [avatarImgError, setAvatarImgError] = useState(false);

  const effectiveCollapsed = propIsCollapsed !== undefined ? propIsCollapsed : internalCollapsed;

  const handleToggle = () => {
    // If mobile (<1024px), toggle mobile drawer
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setMobileDrawerOpen((prev) => !prev);
      return;
    }
    // Desktop: toggle collapse
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
  React.useEffect(() => {
    const handleSync = (e: Event) => {
      const customEvent = e as CustomEvent<boolean>;
      if (typeof customEvent.detail === 'boolean') {
        setInternalCollapsed(customEvent.detail);
      }
    };
    window.addEventListener('reuse_user_sidebar_toggle', handleSync);
    return () => window.removeEventListener('reuse_user_sidebar_toggle', handleSync);
  }, []);

  // Scoped profile data from current user in localStorage
  const userProfileKey = (user?._id || user?.id) ? `user_profile_${user?._id || user?.id}` : '';
  const savedProfile = React.useMemo(() => {
    if (!userProfileKey) return null;
    try {
      const p = localStorage.getItem(userProfileKey);
      return p ? JSON.parse(p) : null;
    } catch {
      return null;
    }
  }, [userProfileKey]);

  // Dynamic overrides from window events (e.g. avatar upload or profile save)
  const [avatarOverride, setAvatarOverride] = useState<string | null>(null);
  const [nameOverride, setNameOverride] = useState<string | null>(null);

  // Derived effective values (props take precedence when supplied)
  const currentAvatar =
    propAvatarUrl !== undefined
      ? propAvatarUrl
      : (avatarOverride !== null
        ? avatarOverride
        : (savedProfile?.avatarUrl || user?.avatarUrl || user?.avatar || ''));

  const currentName =
    propDisplayName ||
    (nameOverride !== null
      ? nameOverride
      : (savedProfile?.fullName || user?.fullName || 'Khách hàng'));

  const effectiveEmail = propDisplayEmail || user?.email || '';

  // Dynamic order counts scoped to current user account
  const uId = user?._id || user?.id || '';
  const [syncVersion, setSyncVersion] = useState<number>(0);

  const [apiRentCount, setApiRentCount] = useState<number | null>(null);

  React.useEffect(() => {
    if (!uId) return;
    let isMounted = true;
    getMyRentalOrdersApi().then((res) => {
      if (!isMounted) return;
      if (Array.isArray(res)) {
        const active = res.filter((o) =>
          ['PAID', 'RENTING', 'READY_FOR_HANDOVER', 'HANDED_OVER', 'SHIPPING', 'DELIVERED'].includes(o.status || '')
        );
        setApiRentCount(active.length);
      }
    }).catch(() => {});
    return () => { isMounted = false; };
  }, [uId, syncVersion]);

  const { rentalOrdersCount, thriftOrdersCount } = useMemo(() => {
    // Explicitly reference syncVersion and location.pathname to re-calculate on route changes or sync events
    void syncVersion;
    void location.pathname;
    try {
      if (!uId) {
        return { rentalOrdersCount: 0, thriftOrdersCount: 0 };
      }
      let rCount = 0;
      let tCount = 0;

      // 1. Rental orders count strictly scoped to current user
      const rKey = `user_rental_orders_${uId}`;
      const rRaw = localStorage.getItem(rKey);
      if (rRaw) {
        const arr = JSON.parse(rRaw);
        if (Array.isArray(arr)) {
          const active = arr.filter((o: { status?: string }) =>
            ['PAID', 'RENTING', 'READY_FOR_HANDOVER', 'HANDED_OVER', 'SHIPPING', 'DELIVERED'].includes(o.status || '')
          );
          rCount = active.length;
        }
      }

      // 2. Thrift orders count strictly scoped to current user
      const tKey = `user_thrift_orders_${uId}`;
      const tRaw = localStorage.getItem(tKey);
      if (tRaw) {
        const arr = JSON.parse(tRaw);
        if (Array.isArray(arr)) {
          const valid = arr.filter((o: { status?: string }) => o.status !== 'CANCELLED');
          tCount = valid.length;
        }
      }

      // If backend API returned a verified count, prefer it for accuracy
      const finalRentCount = apiRentCount !== null ? apiRentCount : rCount;

      return { rentalOrdersCount: finalRentCount, thriftOrdersCount: tCount };
    } catch {
      return { rentalOrdersCount: 0, thriftOrdersCount: 0 };
    }
  }, [uId, syncVersion, location.pathname, apiRentCount]);

  // Listen to profile & order updates
  React.useEffect(() => {
    const handleProfileSync = (e: Event) => {
      setSyncVersion((v) => v + 1);
      const customEvent = e as CustomEvent<{ avatarUrl?: string; fullName?: string } | null>;
      if (customEvent.detail === null) {
        setAvatarOverride(null);
        setNameOverride(null);
        return;
      }
      if (customEvent.detail?.avatarUrl !== undefined) {
        setAvatarOverride(customEvent.detail.avatarUrl);
        setAvatarImgError(false);
      }
      if (customEvent.detail?.fullName) {
        setNameOverride(customEvent.detail.fullName);
      }
    };

    window.addEventListener('profile_updated', handleProfileSync);
    window.addEventListener('user_profile_updated', handleProfileSync);
    window.addEventListener('storage', handleProfileSync);

    return () => {
      window.removeEventListener('profile_updated', handleProfileSync);
      window.removeEventListener('user_profile_updated', handleProfileSync);
      window.removeEventListener('storage', handleProfileSync);
    };
  }, []);

  const currentPath = location.pathname;

  const isCurrent = (key: string, path: string) => {
    if (activeKey) return activeKey === key;
    return currentPath === path || currentPath.startsWith(path + '/');
  };

  const handleLinkClick = () => {
    setMobileDrawerOpen(false);
  };

  // Initials computation
  const initials = React.useMemo(() => {
    const name = currentName.trim();
    if (!name) return 'KH';
    const parts = name.split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }, [currentName]);

  const sidebarContent = (
    <div className="space-y-6">
      {/* User Badge Card */}
      <div className="p-4 rounded-2xl bg-white border border-[#E8E4DC]/80 shadow-2xs">
        <div className="flex items-center gap-3">
          {currentAvatar && !avatarImgError ? (
            <img
              alt={currentName}
              className="w-11 h-11 rounded-full object-cover border border-[#E8E4DC] shadow-2xs shrink-0"
              src={currentAvatar}
              onError={() => setAvatarImgError(true)}
            />
          ) : (
            <div className="w-11 h-11 rounded-full bg-[#EFEEEB] border border-[#E8E4DC] shadow-2xs shrink-0 flex items-center justify-center font-serif text-xs sm:text-sm font-bold text-[#141310] select-none">
              {initials}
            </div>
          )}
          <div className="overflow-hidden">
            <h4 className="text-xs font-bold text-[#1C1A18] truncate">{currentName}</h4>
            <p className="text-[10px] text-[#76726B] truncate">{effectiveEmail}</p>
            <div className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded-full bg-[#EEF2EC] text-[#5E6D5B] text-[9px] font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#5E6D5B]" />
              <span>Khách hàng uy tín</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Group 1: Quản lý tài khoản */}
      <div className="space-y-1">
        <div className="px-3 pb-1.5 text-[10px] uppercase font-bold tracking-wider text-[#76726B]">
          Quản lý tài khoản
        </div>

        {/* Dashboard */}
        <Link
          to="/user/dashboard"
          onClick={handleLinkClick}
          className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl font-semibold text-xs transition-colors shadow-2xs ${isCurrent('dashboard', '/user/dashboard') || currentPath === '/dashboard'
              ? 'bg-[#1C1A18] text-white'
              : 'text-[#1C1A18] hover:bg-white border border-transparent hover:border-[#E8E4DC]/60'
            }`}
        >
          <div className="flex items-center gap-3">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
              />
            </svg>
            <span>Dashboard</span>
          </div>
          {(isCurrent('dashboard', '/user/dashboard') || currentPath === '/dashboard') && (
            <span className="w-1.5 h-1.5 rounded-full bg-white" />
          )}
        </Link>

        {/* RENT */}
        <Link
          to="/rent"
          onClick={handleLinkClick}
          className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-xs transition-colors group ${isCurrent('rent', '/rent')
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
          className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-xs transition-colors group ${isCurrent('thrift', '/thrift')
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
          className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-xs transition-colors group ${isCurrent('categories', '/categories')
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
      </div>

      {/* Navigation Group 2: Đơn hàng & Tiện ích */}
      <div className="space-y-1">
        <div className="px-3 pb-1.5 text-[10px] uppercase font-bold tracking-wider text-[#76726B]">
          Đơn hàng &amp; Tiện ích
        </div>

        {/* Smart Escrow Wallet / Ví lưu ký hoàn cọc */}
        <Link
          to="/user/wallet"
          onClick={handleLinkClick}
          className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-xs transition-colors group ${
            isCurrent('wallet', '/user/wallet') || currentPath === '/wallet'
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
                d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.8"
              />
            </svg>
            <span>Ví cọc &amp; Hoàn tiền (Escrow)</span>
          </div>
          <span className="text-[10px] text-[#4A6B53] bg-[#EBF3ED] px-1.5 py-0.5 rounded font-bold">
            900.000₫
          </span>
        </Link>

        {/* My Rentals */}
        <Link
          to="/rent/orders"
          onClick={handleLinkClick}
          className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-xs transition-colors group ${isCurrent('rent-orders', '/rent/orders')
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
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.8"
              />
            </svg>
            <span>Đơn thuê (My Rentals)</span>
          </div>
          <span className="text-[10px] text-[#5E6D5B] font-bold">
            {rentalOrdersCount > 0 ? `${rentalOrdersCount} Đang giữ` : 'Chưa có'}
          </span>
        </Link>

        {/* My Thrift Orders */}
        <Link
          to="/thrift/orders"
          onClick={handleLinkClick}
          className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-xs transition-colors group ${isCurrent('thrift-orders', '/thrift/orders')
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
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.8"
              />
            </svg>
            <span>Đơn mua THRIFT</span>
          </div>
          <span className="text-[10px] text-[#76726B] font-semibold">
            {thriftOrdersCount > 0 ? `${thriftOrdersCount} Đơn` : 'Chưa có'}
          </span>
        </Link>

        {/* Wishlist */}
        <Link
          to="/wishlist"
          onClick={handleLinkClick}
          className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-xs transition-colors group ${isCurrent('wishlist', '/wishlist') || currentPath === '/saved-items'
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
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.8"
              />
            </svg>
            <span>Yêu thích (Wishlist)</span>
          </div>
          <span className="text-[10px] text-[#76726B] font-semibold">{wishlistCount}</span>
        </Link>

        {/* Messages / Chat */}
        <Link
          to="/chat"
          onClick={handleLinkClick}
          className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-xs transition-colors group ${isCurrent('chat', '/chat')
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
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.8"
              />
            </svg>
            <span>Tin nhắn &amp; Hỗ trợ</span>
          </div>
          <span className="text-[10px] text-[#76726B]">Mở</span>
        </Link>
      </div>

      {/* Navigation Group 3: Tín nhiệm & Bảo mật */}
      <div className="space-y-1">
        <div className="px-3 pb-1.5 text-[10px] uppercase font-bold tracking-wider text-[#76726B]">
          Tín nhiệm &amp; Bảo mật
        </div>

        {/* Profile */}
        <Link
          to="/profile"
          onClick={handleLinkClick}
          className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-xs transition-colors group ${isCurrent('profile', '/profile') || currentPath === '/account-settings'
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
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7 7z"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.8"
              />
            </svg>
            <span>Hồ sơ cá nhân</span>
          </div>
        </Link>

        {/* Verification (KYC) */}
        <Link
          to="/kyc"
          onClick={handleLinkClick}
          className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-xs transition-colors group ${isCurrent('kyc', '/kyc')
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
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.8"
              />
            </svg>
            <span>Định danh KYC</span>
          </div>
          <span className="text-[9px] bg-[#5E6D5B] text-white px-1.5 py-0.5 rounded font-bold uppercase">
            ĐÃ DUYỆT
          </span>
        </Link>
      </div>

      {/* Escrow Guarantee Box */}
      <div className="p-3.5 rounded-2xl bg-[#EFECE6]/70 border border-[#E8E4DC] text-[11px] text-[#76726B] space-y-1.5">
        <div className="flex items-center gap-1.5 font-bold text-[#1C1A18] text-xs">
          <svg className="w-3.5 h-3.5 text-[#5E6D5B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
          </svg>
          <span>Bảo chứng Smart Escrow</span>
        </div>
        <p className="leading-relaxed">
          Tiền cọc của bạn được cách ly an toàn và hoàn trả 100% trong 24h sau khi Shop Owner hoàn tất đối kiểm.
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* ── 1. Floating 3-bar hamburger toggle button at fixed left-3 ── */}
      {!hideFloatingToggle && (
        <button
          type="button"
          onClick={handleToggle}
          aria-label={effectiveCollapsed ? 'Hiện menu điều hướng' : 'Ẩn menu điều hướng'}
          style={{ top: `${HEADER_H - 80 + (80 - 36) / 2}px` }}
          className="fixed left-3 z-40 w-9 h-9 flex items-center justify-center rounded-lg bg-white border border-[#E7E2DA] shadow-sm hover:bg-[#F4F0EA] hover:border-[#1C1A18]/40 transition-all cursor-pointer group"
          title={
            effectiveCollapsed
              ? 'Hiện menu điều hướng (Dấu 3 gạch)'
              : 'Ẩn menu điều hướng (Dấu 3 gạch)'
          }
        >
          <span className="material-symbols-outlined text-[20px] text-[#1C1A18] block leading-none transition-transform group-hover:scale-110">
            menu
          </span>
          {/* Green dot indicating active customer session */}
          <span
            className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-600 border-2 border-white"
            title="Tài khoản ReUse Hub"
          />
        </button>
      )}

      {/* ── 2. Desktop Fixed/Static Sidebar (Shown by default on left side) ── */}
      <aside
        className={`hidden lg:block self-stretch transition-all duration-300 ease-in-out shrink-0 select-none ${effectiveCollapsed
            ? 'w-0 -mr-8 opacity-0 pointer-events-none overflow-hidden'
            : 'w-64 mr-0 opacity-100'
          } ${className}`}
      >
        <div className="w-64 sticky top-28 space-y-3 max-h-[calc(100vh-7.5rem)] overflow-y-auto thin-scrollbar pr-1 pb-4">
          {/* Header row with inline collapse button */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#5E6D5B]" />

            </div>
            <button
              type="button"
              onClick={handleDesktopCollapse}
              title="Ẩn menu điều hướng (Dấu 3 gạch)"
              className="flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-[#76726B] hover:text-[#1C1A18] hover:bg-[#EFECE6] rounded-lg transition-colors cursor-pointer group"
            >
              <span className="material-symbols-outlined text-[15px] group-hover:scale-110 transition-transform">menu</span>

            </button>
          </div>

          {sidebarContent}
        </div>
      </aside>

      {/* ── 3. Mobile Slide-out Drawer (only on screens < lg) ── */}
      {mobileDrawerOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-xs transition-opacity animate-fade-in"
          onClick={() => setMobileDrawerOpen(false)}
        />
      )}
      <aside
        style={{ top: `${HEADER_H}px`, height: `calc(100vh - ${HEADER_H}px)` }}
        className={`lg:hidden fixed left-0 z-50 w-72 sm:w-80 bg-[#FBF9F5] border-r border-[#E7E2DA] flex flex-col shadow-2xl transition-transform duration-300 ease-in-out ${mobileDrawerOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#E8E4DC]/80 bg-white/80 shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-600" />
            <span className="text-[11px] font-bold text-[#1C1A18] uppercase tracking-wider">
              Tài khoản khách hàng
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

export default UserSidebar;
