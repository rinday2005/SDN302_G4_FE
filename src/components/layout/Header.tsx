import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
    Search,
    Heart,
    Bell,
    ShoppingBag,
    User,
    Menu,
    X,
    LogOut,
    Package,
    SlidersHorizontal,
    LayoutDashboard,
    Store,
    MessageSquare,
} from 'lucide-react';
import { useCartWishlist } from '../../context/CartWishlistContext';

export type UserRole = 'GUEST' | 'USER' | 'SHOP' | 'ADMIN';

interface HeaderProps {
    userRole?: UserRole;
    wishlistCount?: number;
    notificationCount?: number;
    cartCount?: number;
    onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
    userRole = 'GUEST',
    wishlistCount,
    notificationCount,
    cartCount,
    onLogout
}) => {
    const { wishlistCount: ctxWishlistCount, cartCount: ctxCartCount } = useCartWishlist();
    const effectiveWishlistCount = wishlistCount !== undefined ? wishlistCount : ctxWishlistCount;
    const effectiveCartCount = cartCount !== undefined ? cartCount : ctxCartCount;

    // Tự động nhận diện role người dùng đã đăng nhập nếu prop userRole chưa truyền
    const effectiveRole = useMemo<UserRole>(() => {
        if (userRole && userRole !== 'GUEST') return userRole;
        try {
            const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
            const u = localStorage.getItem('user');
            if (token && u) {
                const parsed = JSON.parse(u);
                const r = String(parsed.role || 'USER').toUpperCase();
                if (r === 'SHOP_OWNER' || r === 'SHOP') return 'SHOP';
                if (r === 'ADMIN') return 'ADMIN';
                return 'USER';
            }
        } catch {
            // ignore
        }
        return userRole || 'GUEST';
    }, [userRole]);

    const [notifSync, setNotifSync] = useState(0);

    // Dynamically calculate notifications scoped to currently logged-in user
    const effectiveNotificationCount = useMemo(() => {
        if (notificationCount !== undefined) return notificationCount;
        if (effectiveRole === 'GUEST') return 0;
        void notifSync;
        try {
            const u = localStorage.getItem('user');
            const parsedUser = u ? JSON.parse(u) : null;
            const uId = parsedUser?._id || parsedUser?.id;
            if (!uId) return 0;
            const raw = localStorage.getItem(`user_notifications_${uId}`);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed)) return parsed.length;
            }
        } catch {
            // ignore
        }
        return 0;
    }, [notificationCount, effectiveRole, notifSync]);

    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
    const [headerAvatar, setHeaderAvatar] = useState<string>(() => {
        try {
            const u = localStorage.getItem('user');
            const parsedUser = u ? JSON.parse(u) : null;
            const uId = parsedUser?._id || parsedUser?.id;
            const p = uId ? localStorage.getItem(`user_profile_${uId}`) : null;
            if (p) {
                const parsed = JSON.parse(p);
                if (parsed.avatarUrl) return parsed.avatarUrl;
            }
            if (parsedUser) {
                if (parsedUser.avatarUrl || parsedUser.avatar) return parsedUser.avatarUrl || parsedUser.avatar;
            }
        } catch {
            // ignore
        }
        return '';
    });
    const [headerName, setHeaderName] = useState<string>(() => {
        try {
            const u = localStorage.getItem('user');
            const parsedUser = u ? JSON.parse(u) : null;
            const uId = parsedUser?._id || parsedUser?.id;
            const p = uId ? localStorage.getItem(`user_profile_${uId}`) : null;
            if (p) {
                const parsed = JSON.parse(p);
                if (parsed.fullName) return parsed.fullName;
            }
            if (parsedUser) {
                if (parsedUser.fullName) return parsedUser.fullName;
            }
        } catch {
            // ignore
        }
        return 'Tài khoản của tôi';
    });
    const dropdownRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    // Đồng bộ avatar & tên từ hồ sơ cá nhân
    useEffect(() => {
        const handleAvatarSync = (e: Event) => {
            const customEvent = e as CustomEvent<{ avatarUrl?: string; fullName?: string } | null>;
            if (customEvent.detail === null) {
                setHeaderAvatar('');
                setHeaderName('Tài khoản của tôi');
                return;
            }
            if (customEvent.detail?.avatarUrl !== undefined) {
                setHeaderAvatar(customEvent.detail.avatarUrl);
            }
            if (customEvent.detail?.fullName) {
                setHeaderName(customEvent.detail.fullName);
            }
            setNotifSync((prev) => prev + 1);
            try {
                const u = localStorage.getItem('user');
                const parsedUser = u ? JSON.parse(u) : null;
                const uId = parsedUser?._id || parsedUser?.id;
                const p = uId ? localStorage.getItem(`user_profile_${uId}`) : null;
                if (p) {
                    const parsed = JSON.parse(p);
                    if (parsed.avatarUrl) setHeaderAvatar(parsed.avatarUrl);
                    if (parsed.fullName) setHeaderName(parsed.fullName);
                }
            } catch {
                // ignore
            }
        };

        window.addEventListener('profile_updated', handleAvatarSync);
        window.addEventListener('user_profile_updated', handleAvatarSync);
        window.addEventListener('storage', handleAvatarSync);
        return () => {
            window.removeEventListener('profile_updated', handleAvatarSync);
            window.removeEventListener('user_profile_updated', handleAvatarSync);
            window.removeEventListener('storage', handleAvatarSync);
        };
    }, []);

    // Đóng dropdown khi click ra ngoài
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsProfileDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = () => {
        setIsProfileDropdownOpen(false);
        setIsMobileMenuOpen(false);
        if (onLogout) {
            onLogout();
        }
        navigate('/login');
    };

    return (
        <header className="fixed top-0 w-full z-50">
            {/* Top Announcement Bar */}
            <div className="w-full bg-black text-white py-2 px-4 lg:px-12 text-center">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-200">
                    RENT WHAT YOU NEED. REUSE WHAT ALREADY EXISTS. COMPLIMENTARY INSURED SHIPPING ON VERIFIED RENTALS.
                </p>
            </div>

            {/* Main Header Navigation */}
            <div className="h-20 bg-white/95 backdrop-blur-md border-b border-gray-200 transition-colors">
                <div className="max-w-7xl mx-auto h-full px-4 lg:px-12 flex items-center justify-between gap-6">

                    {/* Logo Brand & Nav */}
                    <div className="flex items-center gap-8">
                        <Link className="flex items-center gap-2 text-xl font-bold text-emerald-600 font-serif" to="/">
                            <img
                                src="/src/assets/images/logo.jpg"
                                alt="ReUse Hub Logo"
                                className="h-10 w-auto object-contain"
                                onError={(e) => {
                                    // Fallback nếu chưa có file logo
                                    (e.target as HTMLElement).style.display = 'none';
                                }}
                            />
                            <span className="text-black font-bold">ReUse Hub</span>
                        </Link>

                        {/* Navigation chuyển giữa RENT & THRIFT */}
                        <nav className="hidden md:flex items-center gap-6">
                            <NavLink
                                to="/rent"
                                className={({ isActive }) =>
                                    `text-xs uppercase tracking-wider py-2 transition-colors ${isActive ? 'text-black font-bold border-b-2 border-black' : 'text-gray-600 hover:text-black font-medium'
                                    }`
                                }
                            >
                                RENT
                            </NavLink>
                            <NavLink
                                to="/thrift"
                                className={({ isActive }) =>
                                    `text-xs uppercase tracking-wider py-2 transition-colors ${isActive ? 'text-black font-bold border-b-2 border-black' : 'text-gray-600 hover:text-black font-medium'
                                    }`
                                }
                            >
                                THRIFT
                            </NavLink>
                            <NavLink
                                to="/categories"
                                className={({ isActive }) =>
                                    `text-xs uppercase tracking-wider py-2 transition-colors ${isActive ? 'text-black font-bold border-b-2 border-black' : 'text-gray-600 hover:text-black font-medium'
                                    }`
                                }
                            >
                                CATEGORIES
                            </NavLink>
                        </nav>
                    </div>

                    {/* Search & Actions Icons */}
                    <div className="flex items-center gap-4">
                        {/* Search Input Bar Desktop */}
                        <div className="hidden md:flex items-center relative w-64">
                            <Search className="w-4 h-4 text-gray-400 absolute left-3 pointer-events-none" />
                            <input
                                type="text"
                                placeholder="Search curated archive..."
                                className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-100 border border-gray-300 rounded-sm text-black placeholder-gray-500 focus:outline-none focus:bg-white transition-all"
                            />
                        </div>

                        {/* Action Icons: Wishlist, Notification (if logged in), Cart */}
                        <div className="flex items-center gap-1.5 sm:gap-2">
                            {/* Wishlist Icon */}
                            <Link
                                aria-label="Wishlist"
                                className="relative p-2 text-stone-700 hover:text-black hover:bg-stone-100 rounded-full transition-colors"
                                to="/wishlist"
                                title="Danh sách yêu thích"
                            >
                                <Heart className="w-5 h-5" />
                                {effectiveWishlistCount > 0 && (
                                    <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-[#1C1A18] text-white text-[9px] font-bold leading-tight flex items-center justify-center shadow-xs">
                                        {effectiveWishlistCount}
                                    </span>
                                )}
                            </Link>

                            {/* Notifications Icon (hiện khi đã login) */}
                            {effectiveRole !== 'GUEST' && (
                                <Link
                                    aria-label="Notifications"
                                    className="relative p-2 text-stone-700 hover:text-black hover:bg-stone-100 rounded-full transition-colors"
                                    to="/notifications"
                                    title="Thông báo"
                                >
                                    <Bell className="w-5 h-5" />
                                    {effectiveNotificationCount > 0 && (
                                        <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-black text-white text-[9px] font-bold leading-tight flex items-center justify-center shadow-xs">
                                            {effectiveNotificationCount}
                                        </span>
                                    )}
                                </Link>
                            )}

                            {/* Messages Icon (hiện khi đã login) */}
                            {effectiveRole !== 'GUEST' && (
                                <Link
                                    aria-label="Messages"
                                    className="relative p-2 text-stone-700 hover:text-black hover:bg-stone-100 rounded-full transition-colors"
                                    to="/messages"
                                    title="Tin nhắn & Hỗ trợ"
                                >
                                    <MessageSquare className="w-5 h-5" />
                                </Link>
                            )}

                            {/* Shopping Bag Icon */}
                            <Link
                                aria-label="Shopping Bag"
                                className="relative p-2 text-stone-700 hover:text-black hover:bg-stone-100 rounded-full transition-colors"
                                to="/cart"
                                title="Giỏ hàng"
                            >
                                <ShoppingBag className="w-5 h-5" />
                                {effectiveCartCount > 0 && (
                                    <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-[#1C1A18] text-white text-[9px] font-bold leading-tight flex items-center justify-center shadow-xs">
                                        {effectiveCartCount}
                                    </span>
                                )}
                            </Link>
                        </div>

                        <div className="h-4 w-[1px] bg-stone-300 hidden sm:block" />

                        {/* Member Profile Avatar Dropdown HOẶC Nút Login cho GUEST */}
                        {effectiveRole === 'GUEST' ? (
                            <div className="flex items-center gap-2">
                                <Link
                                    to="/login"
                                    className="text-xs font-semibold uppercase tracking-wider text-gray-700 hover:text-black px-3 py-2 transition-colors"
                                >
                                    Đăng nhập
                                </Link>
                                <Link
                                    to="/register"
                                    className="text-xs font-semibold uppercase tracking-wider bg-black text-white px-3 py-2 rounded-lg hover:bg-gray-800 transition-colors"
                                >
                                    Đăng ký
                                </Link>
                            </div>
                        ) : (
                            <div className="relative ml-1" ref={dropdownRef}>
                                <button
                                    aria-label="Member Profile Menu"
                                    onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                                    className="flex items-center focus:outline-none group cursor-pointer"
                                >
                                    {headerAvatar ? (
                                        <img
                                            src={headerAvatar}
                                            alt="Ảnh hồ sơ"
                                            className="w-8 h-8 rounded-full object-cover border border-gray-300 transition-transform group-hover:scale-105"
                                            onError={() => setHeaderAvatar('')}
                                        />
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center transition-transform group-hover:scale-105">
                                            <User className="w-4 h-4 text-white" />
                                        </div>
                                    )}
                                </button>

                                {/* Avatar Dropdown Menu */}
                                {isProfileDropdownOpen && (
                                    <div className="absolute right-0 mt-3 w-64 bg-white border border-[#E8E4DC] rounded-2xl shadow-xl shadow-black/8 p-2 z-50 animate-fade-in font-sans">
                                        {/* User Identity Header Card */}
                                        <div className="p-3 bg-[#FBF9F5] border border-[#EFECE6] rounded-xl flex items-center gap-3 mb-1.5">
                                            {headerAvatar ? (
                                                <img
                                                    src={headerAvatar}
                                                    alt="Ảnh đại diện"
                                                    className="w-10 h-10 rounded-full object-cover border border-[#E8E4DC] shrink-0 shadow-2xs"
                                                />
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-[#1C1A18] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                                                    RH
                                                </div>
                                            )}
                                            <div className="overflow-hidden flex-1 min-w-0">
                                                <p className="text-xs font-bold text-[#1C1A18] truncate leading-tight">
                                                    {headerName}
                                                </p>
                                                <div className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded-full bg-[#EEF2EC] text-[#4A6B53] text-[10px] font-semibold">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-[#4A6B53]" />
                                                    <span>{userRole === 'ADMIN' ? 'QUẢN TRỊ VIÊN' : userRole === 'SHOP' ? 'CHỦ SHOP' : 'THÀNH VIÊN TIER 2'}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Navigation Links */}
                                        <div className="space-y-0.5">
                                            <Link
                                                to="/profile"
                                                onClick={() => setIsProfileDropdownOpen(false)}
                                                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-[#1C1A18] hover:bg-[#F7F3EC] transition-all group"
                                            >
                                                <SlidersHorizontal className="w-4 h-4 text-[#76726B] group-hover:text-[#1C1A18] transition-colors" />
                                                <span>Hồ sơ cá nhân</span>
                                            </Link>

                                            <Link
                                                to="/rent/orders"
                                                onClick={() => setIsProfileDropdownOpen(false)}
                                                className="flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-[#1C1A18] hover:bg-[#F7F3EC] transition-all group"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <Package className="w-4 h-4 text-[#76726B] group-hover:text-[#1C1A18] transition-colors" />
                                                    <span>Đơn hàng của tôi</span>
                                                </div>
                                                <span className="text-[10px] bg-[#EEF2EC] text-[#4A6B53] font-bold px-1.5 py-0.5 rounded-md">
                                                    RENT
                                                </span>
                                            </Link>

                                            <Link
                                                to="/messages"
                                                onClick={() => setIsProfileDropdownOpen(false)}
                                                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-[#1C1A18] hover:bg-[#F7F3EC] transition-all group"
                                            >
                                                <MessageSquare className="w-4 h-4 text-[#76726B] group-hover:text-[#1C1A18] transition-colors" />
                                                <span>Tin nhắn &amp; Hỗ trợ</span>
                                            </Link>

                                            {/* Quick Link dành riêng cho Shop Owner / Admin trong Dropdown */}
                                            {effectiveRole === 'SHOP' && (
                                                <Link
                                                    to="/shop/inventory"
                                                    onClick={() => setIsProfileDropdownOpen(false)}
                                                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-emerald-800 hover:bg-emerald-50 transition-all"
                                                >
                                                    <Store className="w-4 h-4 text-emerald-600" />
                                                    <span>Trang quản lý Shop</span>
                                                </Link>
                                            )}

                                            {effectiveRole === 'ADMIN' && (
                                                <Link
                                                    to="/admin/dashboard"
                                                    onClick={() => setIsProfileDropdownOpen(false)}
                                                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-indigo-800 hover:bg-indigo-50 transition-all"
                                                >
                                                    <LayoutDashboard className="w-4 h-4 text-indigo-600" />
                                                    <span>Trang Admin</span>
                                                </Link>
                                            )}
                                        </div>

                                        <div className="border-t border-[#EFECE6] my-1.5" />

                                        <button
                                            onClick={handleLogout}
                                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-all text-left cursor-pointer"
                                        >
                                            <LogOut className="w-4 h-4 text-rose-500" />
                                            <span>Đăng xuất</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Mobile Menu Toggle */}
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="md:hidden p-1 text-gray-600 hover:text-black focus:outline-none"
                        >
                            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Drawer */}
            {isMobileMenuOpen && (
                <div className="md:hidden bg-white border-b border-gray-200 px-4 py-4 space-y-3">
                    <input
                        type="text"
                        placeholder="Search curated archive..."
                        className="w-full px-3 py-2 text-xs bg-gray-100 border border-gray-300 rounded-sm"
                    />
                    <div className="flex flex-col space-y-2 pt-2">
                        <Link to="/rent" onClick={() => setIsMobileMenuOpen(false)} className="text-xs uppercase font-bold text-gray-700 hover:text-black py-1">RENT</Link>
                        <Link to="/thrift" onClick={() => setIsMobileMenuOpen(false)} className="text-xs uppercase font-bold text-black py-1">THRIFT</Link>
                        <Link to="/categories" onClick={() => setIsMobileMenuOpen(false)} className="text-xs uppercase font-bold text-gray-700 hover:text-black py-1">CATEGORIES</Link>

                        <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-700 py-1">
                            <Link to="/wishlist" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-1.5 hover:text-black font-medium">
                                <Heart className="w-4 h-4" />
                                <span>Yêu thích ({effectiveWishlistCount})</span>
                            </Link>
                            <Link to="/cart" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-1.5 hover:text-black font-medium">
                                <ShoppingBag className="w-4 h-4" />
                                <span>Giỏ hàng ({effectiveCartCount})</span>
                            </Link>
                        </div>

                        {effectiveRole !== 'GUEST' ? (
                            <div className="pt-2 border-t border-gray-100 flex flex-col space-y-2">
                                <Link to="/account-settings" onClick={() => setIsMobileMenuOpen(false)} className="text-xs font-medium text-gray-700 hover:text-black py-1">
                                    Hồ sơ cá nhân
                                </Link>
                                <Link to="/rent/orders" onClick={() => setIsMobileMenuOpen(false)} className="text-xs font-medium text-gray-700 hover:text-black py-1">
                                    Đơn hàng của tôi
                                </Link>
                                <button
                                    onClick={handleLogout}
                                    className="flex items-center gap-2 text-xs font-bold text-red-600 hover:text-red-700 py-1 text-left cursor-pointer"
                                >
                                    <LogOut className="w-4 h-4" />
                                    Đăng xuất
                                </button>
                            </div>
                        ) : (
                            <div className="pt-2 border-t border-gray-100 flex items-center gap-3">
                                <Link
                                    to="/login"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="text-xs font-bold text-gray-700 hover:text-black py-1"
                                >
                                    Đăng nhập
                                </Link>
                                <Link
                                    to="/register"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="text-xs font-bold text-emerald-600 hover:text-emerald-700 py-1"
                                >
                                    Đăng ký
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </header>
    );
};

export default Header;