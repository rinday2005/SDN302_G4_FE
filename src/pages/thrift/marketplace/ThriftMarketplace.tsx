import React, { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { useCartWishlist } from '../../../context/CartWishlistContext';
import { getPublicThriftListingsApi } from '../../../services/thrift.api';
import { UserSidebar } from '../../../components/layout/UserSidebar';
import {
    THRIFT_PRODUCTS,
    THRIFT_CATEGORY_OPTIONS,
    THRIFT_PRICE_OPTIONS,
    THRIFT_CONDITION_OPTIONS,
    THRIFT_LOCATION_OPTIONS,
    THRIFT_SOURCE_OPTIONS,
    THRIFT_CIRCULAR_STEPS,
} from '../../data/thrift/thriftMarketplaceData';
import type { ThriftProduct, ThriftSortKey } from '../../data/thrift/thriftMarketplaceData';

function getPageNumbers(current: number, total: number): (number | string)[] {
    if (total <= 5) {
        return Array.from({ length: total }, (_, i) => i + 1);
    }
    if (current <= 3) {
        return [1, 2, 3, '...', total];
    }
    if (current >= total - 2) {
        return [1, '...', total - 2, total - 1, total];
    }
    return [1, '...', current, '...', total];
}

export const ThriftMarketplace: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { isWishlisted, toggleWishlist, addToCart } = useCartWishlist();
    const [dbProducts, setDbProducts] = useState<ThriftProduct[]>([]);

    useEffect(() => {
        let isMounted = true;
        getPublicThriftListingsApi()
            .then((items) => {
                if (!isMounted) return;
                if (Array.isArray(items) && items.length > 0) {
                    const mapped: ThriftProduct[] = items.map((item) => {
                        const catSlug = typeof item.categoryId === 'object' && item.categoryId?.slug ? item.categoryId.slug : 'lifestyle';
                        const catName = typeof item.categoryId === 'object' && item.categoryId?.name ? item.categoryId.name : 'Đồ phong cách sống';
                        const img = Array.isArray(item.images) && item.images.length > 0 ? item.images[0] : '';
                        return {
                            id: item._id,
                            slug: item.slug || item._id,
                            title: item.name,
                            category: (catSlug === 'camera' || catSlug === 'fashion' || catSlug === 'electronics' ? catSlug : 'lifestyle') as ThriftProduct['category'],
                            categoryLabel: catName,
                            location: item.location || 'TP. Hồ Chí Minh',
                            rating: 5.0,
                            reviewCount: 1,
                            condition: item.condition || 'Rất tốt (95%)',
                            conditionLevel: '95',
                            source: 'used',
                            sourceLabel: 'Đồ cũ',
                            price: Number(item.price) || 0,
                            href: `/thrift/products/${item._id}`,
                            image: img,
                            verifiedBy: 'ReUse Hub Kiểm định',
                        };
                    });
                    setDbProducts(mapped);
                }
            })
            .catch((err) => {
                console.warn('Could not load thrift products from API:', err);
            });
        return () => { isMounted = false; };
    }, []);
    const [searchParams] = useSearchParams();
    const urlCat = searchParams.get('category')?.toLowerCase();

    // Search & Filter state
    const [searchQuery, setSearchQuery] = useState('');
    const [userCategory, setUserCategory] = useState<string | null>(null);
    const selectedCategory = userCategory ?? (urlCat || 'all');
    const [selectedPrice, setSelectedPrice] = useState('all');
    const [selectedCondition, setSelectedCondition] = useState('all');
    const [selectedLocation, setSelectedLocation] = useState('all');
    const [selectedSource, setSelectedSource] = useState('all');
    const [currentSort, setCurrentSort] = useState<ThriftSortKey>('recommended');

    // Pagination (mock pagination: 8 items per page)
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;

    // Track sidebar collapsed state to display inline restore chip when collapsed
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
        try {
            return localStorage.getItem('reuse_user_sidebar_collapsed') === 'true';
        } catch {
            return false;
        }
    });

    useEffect(() => {
        const handleSync = (e: Event) => {
            const customEvent = e as CustomEvent<boolean>;
            if (typeof customEvent.detail === 'boolean') {
                setIsSidebarCollapsed(customEvent.detail);
            }
        };
        window.addEventListener('reuse_user_sidebar_toggle', handleSync);
        return () => window.removeEventListener('reuse_user_sidebar_toggle', handleSync);
    }, []);

    // Auth requirement modal state
    const [authModal, setAuthModal] = useState<{
        open: boolean;
        actionName: string;
        targetUrl: string;
    }>({
        open: false,
        actionName: '',
        targetUrl: '',
    });

    // Protected action helper
    const handleProtectedAction = (actionTitle: string, targetUrl: string, onSuccess: () => void) => {
        if (!user) {
            setAuthModal({
                open: true,
                actionName: actionTitle,
                targetUrl,
            });
            return;
        }
        onSuccess();
    };

    // User interactions
    const handleBuyNow = (product: ThriftProduct) => {
        handleProtectedAction(
            `mua ngay "${product.title}"`,
            '/cart',
            () => {
                addToCart({
                    id: product.id,
                    title: product.title,
                    price: product.price,
                    image: product.image,
                    mode: 'thrift',
                    location: product.location,
                    categoryLabel: product.category,
                    gradeBadge: product.condition,
                    quantity: 1,
                });
                navigate('/cart');
            }
        );
    };

    const handleAddToCart = (product: ThriftProduct) => {
        addToCart({
            id: product.id,
            title: product.title,
            price: product.price,
            image: product.image,
            mode: 'thrift',
            location: product.location,
            categoryLabel: product.category,
            gradeBadge: product.condition,
            quantity: 1,
        });
    };

    const handleToggleWishlist = (product: ThriftProduct) => {
        toggleWishlist(product.id, 'THRIFT');
    };

    // Filter & sort logic
    const filteredProducts = useMemo(() => {
        const sourceProducts = dbProducts.length > 0 ? dbProducts : THRIFT_PRODUCTS;
        const list = sourceProducts.filter((item) => {
            // Search text
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const matchTitle = item.title.toLowerCase().includes(q);
                const matchCat = item.categoryLabel.toLowerCase().includes(q);
                const matchLoc = item.location.toLowerCase().includes(q);
                if (!matchTitle && !matchCat && !matchLoc) return false;
            }

            // Category (5 major categories: camera, shoes, dam-du-tiec, clothing, phu-kien)
            if (selectedCategory !== 'all') {
                const target = selectedCategory.toLowerCase();
                const pCat = (item.category || '').toLowerCase();
                const pTitle = (item.title || '').toLowerCase();

                if (target === 'camera') {
                    if (!pCat.includes('camera') && !pTitle.includes('camera') && !pTitle.includes('leica') && !pTitle.includes('contax')) return false;
                } else if (target === 'shoes') {
                    if (!pCat.includes('shoe') && !pTitle.includes('sneaker') && !item.id.includes('sneaker')) return false;
                } else if (target === 'dam-du-tiec') {
                    if (!pCat.includes('dam') && !pTitle.includes('đầm') && !pTitle.includes('dress')) return false;
                } else if (target === 'clothing' || target === 'fashion') {
                    if (!pCat.includes('fashion') && !pCat.includes('clothing') && !pTitle.includes('jacket') && !pTitle.includes('wool') && !pTitle.includes('áo')) return false;
                } else if (target === 'phu-kien' || target === 'lifestyle' || target === 'electronics') {
                    if (!pCat.includes('lifestyle') && !pCat.includes('electronics') && !pTitle.includes('backpack') && !pTitle.includes('op-1')) return false;
                }
            }

            // Price range
            if (selectedPrice !== 'all') {
                if (selectedPrice === 'under1m' && item.price >= 1000000) return false;
                if (selectedPrice === '1mto5m' && (item.price < 1000000 || item.price > 5000000)) return false;
                if (selectedPrice === '5mto20m' && (item.price < 5000000 || item.price > 20000000)) return false;
                if (selectedPrice === 'above20m' && item.price <= 20000000) return false;
            }

            // Condition
            if (selectedCondition !== 'all' && item.conditionLevel !== selectedCondition) {
                return false;
            }

            // Location
            if (selectedLocation !== 'all' && item.location !== selectedLocation) {
                return false;
            }

            // Source
            if (selectedSource !== 'all' && item.source !== selectedSource) {
                return false;
            }

            return true;
        });

        // Sorting
        if (currentSort === 'price-asc') {
            list.sort((a, b) => a.price - b.price);
        } else if (currentSort === 'price-desc') {
            list.sort((a, b) => b.price - a.price);
        } else if (currentSort === 'latest') {
            list.sort((a, b) => b.reviewCount - a.reviewCount);
        }

        return list;
    }, [
        dbProducts,
        searchQuery,
        selectedCategory,
        selectedPrice,
        selectedCondition,
        selectedLocation,
        selectedSource,
        currentSort,
    ]);

    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage) || 1;

    const paginatedProducts = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredProducts.slice(start, start + itemsPerPage);
    }, [filteredProducts, currentPage, itemsPerPage]);

    const filterKey = `${searchQuery}|${selectedCategory}|${selectedPrice}|${selectedCondition}|${selectedLocation}|${selectedSource}|${currentSort}`;
    const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
    if (prevFilterKey !== filterKey) {
        setPrevFilterKey(filterKey);
        setCurrentPage(1);
    }

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
            window.scrollTo({ top: 380, behavior: 'smooth' });
        }
    };

    const handleResetFilters = () => {
        setSearchQuery('');
        setUserCategory('all');
        setSelectedPrice('all');
        setSelectedCondition('all');
        setSelectedLocation('all');
        setSelectedSource('all');
        setCurrentSort('recommended');
        setCurrentPage(1);
    };

    const formatVND = (price: number) => {
        return price.toLocaleString('vi-VN') + '₫';
    };

    return (
        <div className="w-full min-h-screen bg-[#FBF9F5] text-[#1C1A18] antialiased">

            {/* Guest Auth Required Modal */}
            {authModal.open && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
                    onClick={() => setAuthModal({ open: false, actionName: '', targetUrl: '' })}
                >
                    <div
                        className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5 text-center relative border border-[#E6E2DC]"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            type="button"
                            onClick={() => setAuthModal({ open: false, actionName: '', targetUrl: '' })}
                            className="absolute top-4 right-4 p-2 rounded-full hover:bg-[#F0ECE1] text-[#79716B] transition-colors cursor-pointer"
                        >
                            <span className="material-symbols-outlined text-[20px]">close</span>
                        </button>

                        <div className="w-14 h-14 rounded-full bg-[#F0ECE1] flex items-center justify-center text-[#1C1A18] mx-auto shadow-xs">
                            <span className="material-symbols-outlined text-[28px]">lock_person</span>
                        </div>

                        <div className="space-y-2">
                            <h3 className="text-xl font-bold text-[#1C1A18]">Yêu cầu Đăng nhập</h3>
                            <p className="text-xs text-[#79716B] leading-relaxed">
                                Bạn đang truy cập ở chế độ công khai (Khách vãng lai). Để{' '}
                                <strong>{authModal.actionName}</strong>, vui lòng đăng nhập hoặc tạo tài khoản thành viên ReUse Hub.
                            </p>
                        </div>

                        <div className="p-3.5 bg-[#F7F5F0] rounded-2xl text-left space-y-1.5 text-xs text-[#79716B] border border-[#E6E2DC]">
                            <div className="flex items-center gap-2 font-semibold text-[#1C1A18]">
                                <span className="material-symbols-outlined text-[16px] text-emerald-700">verified</span>
                                Quyền lợi thành viên THRIFT:
                            </div>
                            <ul className="list-disc list-inside space-y-0.5 text-[11px] text-[#79716B]">
                                <li>Bảo chứng đổi trả trong 72 giờ unboxing</li>
                                <li>Thanh toán an toàn qua cổng Smart Escrow</li>
                                <li>Hưởng chính sách giảm phát thải CO2 tích điểm xanh</li>
                            </ul>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 pt-2">
                            <Link
                                to={`/login?redirect=${encodeURIComponent(authModal.targetUrl)}&message=${encodeURIComponent(
                                    `Bạn cần đăng nhập tài khoản để ${authModal.actionName}!`
                                )}`}
                                className="flex-1 py-3 px-4 rounded-xl bg-[#1C1A18] text-white text-xs font-bold text-center hover:bg-stone-800 transition-all shadow-sm"
                            >
                                Đăng nhập ngay
                            </Link>
                            <Link
                                to={`/register?redirect=${encodeURIComponent(authModal.targetUrl)}`}
                                className="flex-1 py-3 px-4 rounded-xl bg-[#F0ECE1] text-[#1C1A18] text-xs font-bold text-center hover:bg-[#E6E2DC] transition-all"
                            >
                                Đăng ký tài khoản
                            </Link>
                        </div>
                    </div>
                </div>
            )}

            {/* ── MAIN WORKSPACE CONTAINER WITH PERSISTENT SIDEBAR ── */}
            <div className="max-w-[1520px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 flex gap-8">
                {/* User Navigation Sidebar (Fixed on left) */}
                <UserSidebar activeKey="thrift" />

                {/* ── MAIN CONTENT AREA ── */}
                <main className="flex-1 min-w-0 space-y-8">
                    {/* Quick inline restore chip if user clicked 3-bar button to hide sidebar */}
                    {isSidebarCollapsed && (
                        <div className="flex items-center gap-2 -mb-4 animate-fade-in">
                            <button
                                type="button"
                                onClick={() => window.dispatchEvent(new CustomEvent('reuse_user_sidebar_toggle', { detail: false }))}
                                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white border border-[#E8E4DC] text-xs font-semibold text-[#1C1A18] hover:bg-[#F6F3EE] hover:border-[#1C1A18]/40 transition-all shadow-2xs cursor-pointer group"
                                title="Mở lại menu điều hướng (Dấu 3 gạch)"
                            >
                                <span className="material-symbols-outlined text-[18px] text-[#5E6D5B] group-hover:scale-110 transition-transform">
                                    menu
                                </span>
                                <span>Hiện menu điều hướng</span>
                            </button>
                        </div>
                    )}
                {/* BEGIN: HeroArchiveHeader */}
                <section className="pt-10 pb-8 mb-0 reveal-on-scroll" data-reveal>
                    <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-[#E6E2DC]">
                        <div>
                            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#79716B] mb-2">
                                <span>02 · THRIFT ARCHIVE</span>
                                <span className="w-8 h-px bg-[#E7E2DA]" />
                                <span className="bg-[#F0ECE1] text-[#1C1A18] px-2 py-0.5 rounded text-[10px] font-semibold">
                                    ĐÃ THẨM ĐỊNH
                                </span>
                            </div>
                            <h1 className="text-3xl sm:text-4xl text-[#1C1A18] font-bold tracking-tight mb-2">
                                Đồ cũ, giá trị mới
                            </h1>
                            <p className="text-xs sm:text-sm text-[#79716B] max-w-xl leading-relaxed">
                                Khám phá những sản phẩm đã qua sử dụng và những món đồ RENT được trao thêm một vòng đời. Sở hữu trọn vẹn với quy trình kiểm định minh bạch.
                            </p>
                        </div>

                        {/* Stats Badges */}
                        <div className="flex items-center gap-4 bg-[#F4F0EA]/60 px-5 py-3.5 rounded-xl self-start md:self-auto shadow-sm">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-mono uppercase tracking-wider text-[#78736A]">Kho lưu trữ</span>
                                <span className="text-xl font-bold text-[#1C1A18]">342 món</span>
                            </div>
                            <div className="h-8 w-px bg-[#E7E2DA]" />
                            <div className="flex flex-col">
                                <span className="text-[10px] font-mono uppercase tracking-wider text-[#78736A]">Thẩm định thực tế</span>
                                <span className="text-xl font-bold text-[#1C1A18]">100%</span>
                            </div>
                            <div className="h-8 w-px bg-[#E7E2DA]" />
                            <div className="flex flex-col">
                                <span className="text-[10px] font-mono uppercase tracking-wider text-[#78736A]">Tiết kiệm carbon</span>
                                <span className="text-xl font-bold text-emerald-700">84%</span>
                            </div>
                        </div>
                    </div>

                    {/* Reassurance strip */}
                    <div className="w-full bg-[#F4F0EA]/70 rounded-xl px-5 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#1C1A18]">
                        <div className="flex items-center gap-2.5">
                            <span className="material-symbols-outlined text-[18px]">verified</span>
                            <span className="font-medium">100% Sản phẩm được chụp thực tế & chứng nhận tình trạng cơ học</span>
                        </div>
                        <div className="flex items-center gap-2 text-[#5E5A53] text-[11px]">
                            <span className="material-symbols-outlined text-[16px]">payments</span>
                            <span>Bảo chứng đổi trả trong 72 giờ unboxing</span>
                        </div>
                    </div>
                </section>
                {/* END: HeroArchiveHeader */}

                {/* BEGIN: SearchAndFilters */}
                <section className="bg-white rounded-2xl p-5 shadow-sm mb-8 reveal-on-scroll" data-reveal>
                    {/* Main Search Bar */}
                    <div className="relative w-full">
                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#78736A] text-[22px]">search</span>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Tìm kiếm quần áo, giày, camera, đồ dùng..."
                            className="w-full pl-12 pr-28 py-3.5 bg-[#F4F0EA]/50 rounded-xl text-sm text-[#1C1A18] placeholder:text-[#78736A] focus:outline-none focus:bg-[#F4F0EA] transition-all"
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#F4F0EA] text-[#5E5A53] hover:text-[#1C1A18]"
                            >
                                Xóa tìm kiếm
                            </button>
                        )}
                    </div>

                    {/* Filters Grid Row */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 pt-1 text-xs">
                        {/* Filter: Danh mục */}
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-[#78736A]">Danh mục</label>
                            <div className="relative">
                                <select
                                    value={selectedCategory}
                                    onChange={(e) => setUserCategory(e.target.value)}
                                    className="w-full py-2 pl-3 pr-7 bg-[#F4F0EA]/50 rounded-lg text-[#1C1A18] focus:outline-none focus:bg-[#F4F0EA] text-xs font-medium cursor-pointer appearance-none"
                                >
                                    {THRIFT_CATEGORY_OPTIONS.map((opt) => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                                <span className="material-symbols-outlined pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[16px] text-[#78736A]">expand_more</span>
                            </div>
                        </div>

                        {/* Filter: Khoảng giá */}
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-[#78736A]">Khoảng giá</label>
                            <div className="relative">
                                <select
                                    value={selectedPrice}
                                    onChange={(e) => setSelectedPrice(e.target.value)}
                                    className="w-full py-2 pl-3 pr-7 bg-[#F4F0EA]/50 rounded-lg text-[#1C1A18] focus:outline-none focus:bg-[#F4F0EA] text-xs font-medium cursor-pointer appearance-none"
                                >
                                    {THRIFT_PRICE_OPTIONS.map((opt) => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                                <span className="material-symbols-outlined pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[16px] text-[#78736A]">expand_more</span>
                            </div>
                        </div>

                        {/* Filter: Tình trạng */}
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-[#78736A]">Tình trạng máy / đồ</label>
                            <div className="relative">
                                <select
                                    value={selectedCondition}
                                    onChange={(e) => setSelectedCondition(e.target.value)}
                                    className="w-full py-2 pl-3 pr-7 bg-[#F4F0EA]/50 rounded-lg text-[#1C1A18] focus:outline-none focus:bg-[#F4F0EA] text-xs font-medium cursor-pointer appearance-none"
                                >
                                    {THRIFT_CONDITION_OPTIONS.map((opt) => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                                <span className="material-symbols-outlined pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[16px] text-[#78736A]">expand_more</span>
                            </div>
                        </div>

                        {/* Filter: Khu vực */}
                        <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-[#78736A]">Khu vực kho</label>
                            <div className="relative">
                                <select
                                    value={selectedLocation}
                                    onChange={(e) => setSelectedLocation(e.target.value)}
                                    className="w-full py-2 pl-3 pr-7 bg-[#F4F0EA]/50 rounded-lg text-[#1C1A18] focus:outline-none focus:bg-[#F4F0EA] text-xs font-medium cursor-pointer appearance-none"
                                >
                                    {THRIFT_LOCATION_OPTIONS.map((opt) => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                                <span className="material-symbols-outlined pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[16px] text-[#78736A]">expand_more</span>
                            </div>
                        </div>

                        {/* Filter: Nguồn gốc */}
                        <div className="flex flex-col gap-1 col-span-2 sm:col-span-1">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-[#78736A]">Nguồn gốc sản phẩm</label>
                            <div className="relative">
                                <select
                                    value={selectedSource}
                                    onChange={(e) => setSelectedSource(e.target.value)}
                                    className="w-full py-2 pl-3 pr-7 bg-[#F4F0EA]/50 rounded-lg text-[#1C1A18] focus:outline-none focus:bg-[#F4F0EA] text-xs font-medium cursor-pointer appearance-none"
                                >
                                    {THRIFT_SOURCE_OPTIONS.map((opt) => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                                <span className="material-symbols-outlined pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[16px] text-[#78736A]">expand_more</span>
                            </div>
                        </div>
                    </div>

                    {/* Sorting & Results Counts Bar */}
                    <div className="pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                        <span className="text-[11px] font-medium text-[#5E5A53]">
                            Đang hiển thị <strong className="text-[#1C1A18]">{filteredProducts.length}</strong> sản phẩm tuyển chọn
                        </span>
                        <div className="flex items-center flex-wrap gap-1.5">
                            <span className="text-[10px] uppercase font-bold text-[#78736A] tracking-wider mr-1">Sắp xếp:</span>
                            {(['recommended', 'price-asc', 'price-desc', 'latest'] as ThriftSortKey[]).map((key) => (
                                <button
                                    key={key}
                                    type="button"
                                    onClick={() => setCurrentSort(key)}
                                    className={`px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${currentSort === key
                                        ? 'bg-[#1C1A18] text-white'
                                        : 'bg-[#F4F0EA] text-[#5E5A53] hover:text-[#1C1A18]'
                                    }`}
                                >
                                    {key === 'recommended' ? 'Đề xuất' : key === 'price-asc' ? 'Giá thấp đến cao' : key === 'price-desc' ? 'Giá cao đến thấp' : 'Mới nhất'}
                                </button>
                            ))}
                        </div>
                    </div>
                </section>
                {/* END: SearchAndFilters */}

                {/* BEGIN: ProductGrid */}
                {filteredProducts.length > 0 ? (
                    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                        {paginatedProducts.map((product) => {
                            const isSaved = isWishlisted(product.id);

                            return (
                                <article
                                    key={product.id}
                                    className="group bg-white rounded-2xl overflow-hidden flex flex-col shadow-sm hover:shadow-md transition-all duration-300 reveal-on-scroll"
                                    data-reveal
                                >
                                    <div className="relative aspect-[4/3] bg-[#F4F0EA] overflow-hidden">
                                        {/* Badges */}
                                        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
                                            <span className="bg-[#1C1A18]/85 backdrop-blur-xs text-white text-[10px] font-medium px-2 py-0.5 rounded">
                                                {product.condition}
                                            </span>
                                            <span
                                                className={`text-[9px] font-semibold px-1.5 py-0.5 rounded border ${product.source === 'rent'
                                                    ? 'bg-blue-100/90 text-blue-900 border-blue-200'
                                                    : 'bg-amber-100/90 text-amber-900 border-amber-200'
                                                    }`}
                                            >
                                                {product.sourceLabel}
                                            </span>
                                        </div>

                                        {/* Wishlist Button */}
                                        <button
                                            type="button"
                                            onClick={() => handleToggleWishlist(product)}
                                            className={`absolute top-3 right-3 z-10 w-8 h-8 rounded-full flex items-center justify-center shadow-xs transition-transform active:scale-90 cursor-pointer ${isSaved
                                                ? 'bg-[#1C1A18] text-rose-400'
                                                : 'bg-white/90 hover:bg-white text-[#1C1A18]'
                                                }`}
                                            title={isSaved ? 'Đã lưu' : 'Lưu món đồ'}
                                        >
                                            <svg
                                                className="w-4 h-4"
                                                fill={isSaved ? 'currentColor' : 'none'}
                                                stroke="currentColor"
                                                strokeWidth="1.8"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                ></path>
                                            </svg>
                                        </button>

                                        {/* Product Image link */}
                                        <Link to={product.href} className="block w-full h-full">
                                            <img
                                                alt={product.title}
                                                loading="lazy"
                                                src={product.image}
                                                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                                            />
                                        </Link>
                                    </div>

                                    {/* Product Details */}
                                    <div className="p-5 flex-1 flex flex-col justify-between">
                                        <div>
                                            <div className="flex items-center justify-between text-[11px] text-[#79716B] mb-1">
                                                <span className="font-medium">{product.categoryLabel}</span>
                                                <span className="flex items-center gap-1">
                                                    <svg className="w-3 h-3 text-[#79716B]" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                                                        <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" strokeLinecap="round" strokeLinejoin="round"></path>
                                                        <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round"></path>
                                                    </svg>
                                                    {product.location}
                                                </span>
                                            </div>

                                            <h2 className="text-base font-semibold text-[#1C1A18] group-hover:underline line-clamp-1 mb-1.5">
                                                <Link to={product.href}>{product.title}</Link>
                                            </h2>

                                            <div className="flex items-center gap-1.5 text-xs text-[#79716B] mb-2">
                                                <span className="text-amber-500 font-bold">★ {product.rating.toFixed(1)}</span>
                                                <span>({product.reviewCount} đánh giá)</span>
                                            </div>

                                            {/* Shop Owner Indicator */}
                                            <div className="text-[10px] text-[#79716B] bg-[#F7F5F0] py-1 px-2 rounded inline-flex items-center gap-1 mb-3">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                                                Được kiểm chứng bởi <strong className="text-[#1C1A18]">{product.verifiedBy}</strong>
                                            </div>
                                        </div>

                                        {/* Price and Buy Action */}
                                        <div className="pt-2 bg-[#F4F0EA]/30 -mx-5 -mb-5 p-5 space-y-3">
                                            <div className="flex items-baseline justify-between">
                                                <div>
                                                    <span className="text-[10px] uppercase font-bold text-[#78736A]">Giá mua</span>
                                                    <p className="text-sm font-bold text-[#1C1A18]">{formatVND(product.price)}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 pt-1">
                                                <button
                                                    type="button"
                                                    onClick={() => handleBuyNow(product)}
                                                    className="flex-1 py-2 rounded-xl bg-[#1C1A18] text-white text-xs font-medium text-center hover:bg-[#292724] transition-colors shadow-sm cursor-pointer"
                                                >
                                                    Mua ngay
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleAddToCart(product)}
                                                    title="Thêm vào giỏ"
                                                    className="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-[#1C1A18] hover:bg-[#F4F0EA] transition-colors shadow-sm cursor-pointer"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                                                        <path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" strokeLinecap="round" strokeLinejoin="round"></path>
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </article>
                            );
                        })}
                    </section>
                ) : (
                    /* Empty state */
                    <div className="text-center py-16 bg-[#F7F5F0] border border-dashed border-[#E6E2DC] rounded-2xl mb-12">
                        <svg className="w-12 h-12 mx-auto text-[#79716B] mb-3" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                            <circle cx="11" cy="11" r="8"></circle>
                            <line x1="21" x2="16.65" y1="21" y2="16.65"></line>
                        </svg>
                        <h3 className="text-lg text-[#1C1A18] font-semibold mb-1">
                            Không tìm thấy sản phẩm THRIFT phù hợp.
                        </h3>
                        <p className="text-xs text-[#79716B] mb-4">
                            Vui lòng điều chỉnh lại từ khóa, bộ lọc giá hoặc danh mục sản phẩm.
                        </p>
                        <button
                            type="button"
                            onClick={handleResetFilters}
                            className="px-4 py-2 bg-[#1C1A18] text-white text-xs rounded-lg font-medium hover:bg-stone-800 transition-colors cursor-pointer"
                        >
                            Xóa bộ lọc
                        </button>
                    </div>
                )}
                {/* END: ProductGrid */}

                {/* BEGIN: PaginationBar */}
                <nav aria-label="Phân trang" className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-[#E6E2DC] pt-6 mb-16 text-xs text-[#79716B]">
                    <span className="font-medium">
                        Hiển thị{' '}
                        <span className="font-bold text-[#1C1A18]">
                            {filteredProducts.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} – {Math.min(currentPage * itemsPerPage, filteredProducts.length)}
                        </span>{' '}
                        trong tổng số <span className="font-bold text-[#1C1A18]">{filteredProducts.length}</span> món đồ
                    </span>
                    {totalPages > 1 && (
                        <div className="flex items-center gap-1.5">
                            <button
                                type="button"
                                disabled={currentPage <= 1}
                                onClick={() => handlePageChange(currentPage - 1)}
                                className="p-2 border border-[#E6E2DC] rounded-lg text-[#1C1A18] bg-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#F0ECE1] transition-colors cursor-pointer"
                                title="Trang trước"
                            >
                                <svg className="w-4 h-4 text-[#1C1A18]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <polyline points="15 18 9 12 15 6"></polyline>
                                </svg>
                            </button>
                            {getPageNumbers(currentPage, totalPages).map((p, idx) =>
                                typeof p === 'number' ? (
                                    <button
                                        key={`page-${p}`}
                                        type="button"
                                        onClick={() => handlePageChange(p)}
                                        className={`w-8 h-8 rounded-lg font-medium flex items-center justify-center transition-colors cursor-pointer ${
                                            currentPage === p
                                                ? 'bg-[#1C1A18] text-white font-bold'
                                                : 'bg-white hover:bg-[#F0ECE1] text-[#1C1A18] border border-[#E6E2DC]'
                                        }`}
                                    >
                                        {p}
                                    </button>
                                ) : (
                                    <span key={`ellipsis-${idx}`} className="px-1 text-[#79716B] font-medium">
                                        ...
                                    </span>
                                )
                            )}
                            <button
                                type="button"
                                disabled={currentPage >= totalPages}
                                onClick={() => handlePageChange(currentPage + 1)}
                                className="p-2 border border-[#E6E2DC] rounded-lg text-[#1C1A18] bg-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#F0ECE1] transition-colors cursor-pointer"
                                title="Trang kế tiếp"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <polyline points="9 18 15 12 9 6"></polyline>
                                </svg>
                            </button>
                        </div>
                    )}
                </nav>
                {/* END: PaginationBar */}

                {/* BEGIN: CircularGuaranteeSection */}
                <section className="w-full bg-[#F4F0EA]/60 rounded-3xl p-6 sm:p-8 mb-8 border border-[#E6E2DC] reveal-on-scroll" data-reveal>
                    <div className="max-w-2xl mb-8">
                        <span className="text-[10px] font-mono tracking-widest text-[#79716B] uppercase block mb-1">
                            QUY TRÌNH THẨM ĐỊNH THRIFT CHẶT CHẼ
                        </span>
                        <h2 className="text-2xl lg:text-3xl text-[#1C1A18] font-bold">
                            Vòng đời tuần hoàn bảo đảm
                        </h2>
                        <p className="text-xs lg:text-sm text-[#79716B] mt-2">
                            Mỗi món đồ đến tay người nhận đều trải qua quy trình 4 giai đoạn độc quyền, loại bỏ mọi nỗi lo về nguồn gốc và chất lượng.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {THRIFT_CIRCULAR_STEPS.map((step) => (
                            <div
                                key={step.step}
                                className="bg-white p-5 rounded-2xl border border-[#E6E2DC] flex flex-col justify-between shadow-2xs hover:shadow-sm transition-shadow"
                            >
                                <div>
                                    <span className="text-2xl font-bold text-[#1C1A18]/40 mb-2 block font-mono">
                                        {step.step}
                                    </span>
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#1C1A18] mb-2">
                                        {step.title}
                                    </h3>
                                    <p className="text-xs text-[#79716B] leading-relaxed">
                                        {step.description}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
                {/* END: CircularGuaranteeSection */}
                </main>
            </div>
        </div>
    );
};

export default ThriftMarketplace;