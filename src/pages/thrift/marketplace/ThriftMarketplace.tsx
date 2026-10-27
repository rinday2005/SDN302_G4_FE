import React, { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useCartWishlist } from '../../../context/CartWishlistContext';
import { getPublicThriftListingsApi } from '../../../services/thrift.api';
import { getCategoriesApi } from '../../../services/category.api';
import { normalizeImageUrl } from '../../../utils/imageUrl';
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
import type { ThriftProduct, ThriftSortKey, ThriftFilterOption } from '../../data/thrift/thriftMarketplaceData';
import { useToast } from '../../../context/ToastContext';
import { MarketplaceGridSkeleton } from '../../../components/common/Skeleton';
import { EmptyState } from '../../../components/common/EmptyState';

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
    const navigate = useNavigate();
    const { isWishlisted, toggleWishlist, addToCart } = useCartWishlist();
    const toast = useToast();
    const [dbProducts, setDbProducts] = useState<ThriftProduct[]>([]);
    const [categoryOptions, setCategoryOptions] = useState<ThriftFilterOption[]>(THRIFT_CATEGORY_OPTIONS);
    const [isLoading, setIsLoading] = useState(true);

    // Load active categories from MongoDB
    useEffect(() => {
        let isMounted = true;
        getCategoriesApi()
            .then((cats) => {
                if (!isMounted) return;
                if (Array.isArray(cats) && cats.length > 0) {
                    const active = cats.filter((c) => c.isActive !== false);
                    setCategoryOptions([
                        { label: `Tất cả danh mục (${active.length})`, value: 'all' },
                        ...active.map((c) => ({
                            label: c.name,
                            value: c.slug || c._id,
                        })),
                    ]);
                }
            })
            .catch((err) => {
                console.warn('Could not load categories from API:', err);
            });
        return () => { isMounted = false; };
    }, []);

    // Load Thrift Listings from MongoDB API
    useEffect(() => {
        let isMounted = true;
        getPublicThriftListingsApi()
            .then((items) => {
                if (!isMounted) return;
                if (Array.isArray(items) && items.length > 0) {
                    const mapped: ThriftProduct[] = items.map((item) => {
                        let catName = 'Đồ phong cách sống';
                        let catSlug = 'lifestyle';
                        if (typeof item.categoryId === 'object' && item.categoryId !== null) {
                            if (item.categoryId.name) catName = item.categoryId.name;
                            if (item.categoryId.slug) catSlug = item.categoryId.slug;
                        } else if (typeof item.category === 'object' && item.category !== null) {
                            if (item.category.name) catName = item.category.name;
                            if (item.category.slug) catSlug = item.category.slug;
                        } else if (typeof item.categoryLabel === 'string') {
                            catName = item.categoryLabel;
                        } else if (typeof item.category === 'string') {
                            catName = item.category;
                        }

                        if (catSlug === 'lifestyle') {
                            const n = (catName + ' ' + (item.name || '')).toLowerCase();
                            if (n.includes('camera') || n.includes('máy ảnh') || n.includes('leica') || n.includes('fujifilm') || n.includes('canon')) catSlug = 'camera';
                            else if (n.includes('giày') || n.includes('shoe') || n.includes('sneaker') || n.includes('boot') || n.includes('derby')) catSlug = 'shoes';
                            else if (n.includes('đầm') || n.includes('váy') || n.includes('tiệc')) catSlug = 'dam-du-tiec';
                            else if (n.includes('quần') || n.includes('áo') || n.includes('thời trang') || n.includes('clothing') || n.includes('blazer') || n.includes('jacket') || n.includes('wool')) catSlug = 'clothing';
                            else if (n.includes('phụ kiện') || n.includes('accessory') || n.includes('bông tai') || n.includes('quạt')) catSlug = 'phu-kien';
                        }

                        const rawImg = Array.isArray(item.images) && item.images.length > 0 ? item.images[0] : '';
                        const img = normalizeImageUrl(rawImg);

                        let conditionLevel: ThriftProduct['conditionLevel'] = '95';
                        const condStr = (item.condition || '').toLowerCase();
                        if (condStr.includes('99') || condStr.includes('mới') || condStr.includes('like_new')) conditionLevel = '99';
                        else if (condStr.includes('98') || condStr.includes('mint')) conditionLevel = '98';
                        else if (condStr.includes('90') || condStr.includes('used') || condStr.includes('good')) conditionLevel = '90';

                        return {
                            id: item._id,
                            slug: item.slug || item._id,
                            title: item.name || item.title || 'Sản phẩm THRIFT',
                            category: catSlug as ThriftProduct['category'],
                            categoryLabel: catName,
                            location: item.location || 'TP. Hồ Chí Minh',
                            rating: 5.0,
                            reviewCount: 1,
                            condition: item.condition === 'LIKE_NEW' ? 'Grade Mint (99%)' : item.condition === 'GOOD' ? 'Tốt (90%)' : item.condition || 'Rất tốt (95%)',
                            conditionLevel,
                            source: (item.sourceType === 'rent' || item.source === 'rent' || item.sourceType === 'RENTAL_PRODUCT') ? 'rent' : 'used',
                            sourceLabel: (item.sourceType === 'rent' || item.source === 'rent' || item.sourceType === 'RENTAL_PRODUCT') ? 'Từ sản phẩm RENT' : 'Đồ đã qua sử dụng',
                            price: Number(item.price) || 0,
                            href: `/thrift/products/${item._id}`,
                            image: img,
                            verifiedBy: 'ReUse Hub Kiểm định',
                            status: item.status || 'APPROVED',
                            quantity: item.quantity !== undefined ? Number(item.quantity) : 5,
                            isSold: false,
                        };
                    });
                    setDbProducts(mapped);
                }
            })
            .catch((err) => {
                console.warn('Could not load thrift products from API:', err);
            })
            .finally(() => {
                if (isMounted) setIsLoading(false);
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

    // Pagination (20 items per page)
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 20;

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

    // Listen to order creation / payment updates to refresh marketplace catalog
    const [ordersVersion, setOrdersVersion] = useState(0);

    useEffect(() => {
        const handleOrdersChange = () => {
            setOrdersVersion((v) => v + 1);
        };
        window.addEventListener('storage', handleOrdersChange);
        window.addEventListener('rental_order_updated', handleOrdersChange);
        return () => {
            window.removeEventListener('storage', handleOrdersChange);
            window.removeEventListener('rental_order_updated', handleOrdersChange);
        };
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

    // User interactions
    const handleBuyNow = (product: ThriftProduct) => {
        navigate(product.href || `/thrift/${product.id}`);
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
        toast.success(`Đã thêm "${product.title}" vào giỏ hàng!`);
    };

    const handleToggleWishlist = (product: ThriftProduct) => {
        const wasSaved = isWishlisted(product.id);
        toggleWishlist(product.id, 'THRIFT');
        toast.info(wasSaved ? `Đã bỏ lưu "${product.title}"` : `Đã thêm "${product.title}" vào yêu thích`);
    };


    // Master Catalog: Lấy trực tiếp 33 sản phẩm từ MongoDB thriftListings
    const allProducts = useMemo(() => {
        void ordersVersion;
        if (dbProducts.length > 0) {
            return dbProducts;
        }
        return THRIFT_PRODUCTS;
    }, [dbProducts, ordersVersion]);

    // Filter & sort logic
    const filteredProducts = useMemo(() => {
        const sourceProducts = allProducts;
        const list = sourceProducts.filter((item) => {
            // Search text
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const matchTitle = item.title.toLowerCase().includes(q);
                const matchCat = item.categoryLabel.toLowerCase().includes(q);
                const matchLoc = item.location.toLowerCase().includes(q);
                if (!matchTitle && !matchCat && !matchLoc) return false;
            }

            // Category (matches slug, label, or keyword)
            if (selectedCategory !== 'all') {
                const target = selectedCategory.toLowerCase();
                const pCat = (item.category || '').toLowerCase();
                const pLabel = (item.categoryLabel || '').toLowerCase();
                const pTitle = (item.title || '').toLowerCase();

                const isDirectMatch = pCat === target || pCat.includes(target) || target.includes(pCat) || pLabel.includes(target) || target.includes(pLabel);

                if (!isDirectMatch) {
                    if (target === 'camera') {
                        if (!pCat.includes('camera') && !pTitle.includes('camera') && !pTitle.includes('leica') && !pTitle.includes('contax') && !pTitle.includes('máy ảnh')) return false;
                    } else if (target === 'shoes' || target.includes('giay') || target.includes('giày')) {
                        if (!pCat.includes('shoe') && !pCat.includes('giay') && !pTitle.includes('sneaker') && !pTitle.includes('boot') && !pTitle.includes('giày') && !item.id.includes('sneaker')) return false;
                    } else if (target === 'dam-du-tiec' || target.includes('dam') || target.includes('đầm')) {
                        if (!pCat.includes('dam') && !pCat.includes('tiec') && !pTitle.includes('đầm') && !pTitle.includes('dress') && !pTitle.includes('váy')) return false;
                    } else if (target === 'clothing' || target === 'fashion' || target.includes('quan-ao') || target.includes('áo') || target.includes('quần')) {
                        if (!pCat.includes('fashion') && !pCat.includes('clothing') && !pCat.includes('quan-ao') && !pTitle.includes('jacket') && !pTitle.includes('wool') && !pTitle.includes('áo') && !pTitle.includes('blazer') && !pTitle.includes('quần')) return false;
                    } else if (target === 'phu-kien' || target === 'lifestyle' || target === 'electronics') {
                        if (!pCat.includes('lifestyle') && !pCat.includes('electronics') && !pCat.includes('phu-kien') && !pTitle.includes('backpack') && !pTitle.includes('op-1') && !pTitle.includes('trâm') && !pTitle.includes('dây chuyền') && !pTitle.includes('túi')) return false;
                    } else {
                        return false;
                    }
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
            if (selectedCondition !== 'all') {
                const itemCond = (item.conditionLevel || '').toLowerCase();
                const itemCondText = (item.condition || '').toLowerCase();
                if (itemCond !== selectedCondition && !itemCondText.includes(selectedCondition)) {
                    return false;
                }
            }

            // Location
            if (selectedLocation !== 'all') {
                const targetLoc = selectedLocation.toLowerCase();
                const itemLoc = (item.location || '').toLowerCase();
                const isMatchLoc =
                    itemLoc.includes(targetLoc) ||
                    targetLoc.includes(itemLoc) ||
                    (targetLoc.includes('hồ chí minh') && itemLoc.includes('hcm')) ||
                    (targetLoc.includes('hcm') && itemLoc.includes('hồ chí minh'));
                if (!isMatchLoc) return false;
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
        allProducts,
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
                                    {categoryOptions.map((opt) => (
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
                {isLoading ? (
                    <MarketplaceGridSkeleton count={8} />
                ) : filteredProducts.length > 0 ? (
                    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                        {paginatedProducts.map((product) => {
                            const isSaved = isWishlisted(product.id);

                            let conditionBadge = 'Như mới (99%)';
                            const rawC = (product.condition || '').toLowerCase();
                            if (rawC.includes('98') || rawC.includes('mint')) conditionBadge = 'Grade Mint (98%)';
                            else if (rawC.includes('90') || rawC.includes('used') || rawC.includes('tốt') || rawC.includes('good')) conditionBadge = 'Đã qua sử dụng (90%)';
                            else if (rawC.includes('99') || rawC.includes('mới') || rawC.includes('like_new')) conditionBadge = 'Như mới (99%)';

                            return (
                                <article
                                    key={product.id}
                                    className="group bg-white rounded-2xl overflow-hidden flex flex-col border border-[#EFECE6] hover:border-[#DDD7CD] shadow-xs hover:shadow-md transition-all duration-300"
                                >
                                    <div className="relative aspect-[4/3] bg-[#F4F0EA] overflow-hidden">
                                        {/* Dual Badges top-left */}
                                        <div className="absolute top-3 left-3 flex flex-col items-start gap-1.5 z-10 pointer-events-none">
                                            <span className="bg-black/75 backdrop-blur-xs text-white text-[11px] font-medium px-2.5 py-0.5 rounded-full shadow-xs">
                                                {conditionBadge}
                                            </span>
                                            <span className="bg-[#FAF0D7] text-[#8C6D1F] text-[11px] font-semibold px-2 py-0.5 rounded-md shadow-2xs">
                                                Đồ cũ
                                            </span>
                                            {product.quantity !== undefined && (
                                                <span className="bg-[#1C1A18]/85 backdrop-blur-xs text-[#F5F2EB] text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs flex items-center gap-1 border border-stone-700/40">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                                                    Còn tồn kho: {product.quantity}
                                                </span>
                                            )}
                                        </div>

                                        {/* Wishlist Button top-right */}
                                        <button
                                            type="button"
                                            onClick={() => handleToggleWishlist(product)}
                                            className={`absolute top-3 right-3 z-10 w-8 h-8 rounded-full flex items-center justify-center shadow-xs transition-transform active:scale-90 cursor-pointer ${isSaved
                                                ? 'bg-[#1C1A18] text-rose-400'
                                                : 'bg-white hover:bg-white text-[#1C1A18]'
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
                                    <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
                                        <div className="space-y-1.5">
                                            {/* Category & Location */}
                                            <div className="flex items-center justify-between text-[11px] text-[#78736A]">
                                                <span className="font-medium text-[#78736A]">{product.categoryLabel}</span>
                                                <span className="flex items-center gap-1 font-medium">
                                                    <span className="material-symbols-outlined text-[13px] text-[#78736A]">location_on</span>
                                                    {product.location}
                                                </span>
                                            </div>

                                            {/* Title */}
                                            <h2 className="font-semibold text-base text-[#1C1A18] group-hover:text-amber-900 transition-colors line-clamp-1">
                                                <Link to={product.href}>{product.title}</Link>
                                            </h2>

                                            {/* Rating */}
                                            <div className="flex items-center gap-1 text-xs text-[#1C1A18] pt-0.5">
                                                <span className="text-amber-500 font-bold">★ {product.rating.toFixed(1)}</span>
                                                <span className="text-[#78736A] text-[11px]">({product.reviewCount} đánh giá)</span>
                                            </div>

                                            {/* ReUse Hub Inspection Chip */}
                                            <div className="pt-1">
                                                <div className="bg-[#EBF7EE] text-[#1E7E34] text-[11px] font-medium py-1 px-2.5 rounded-md inline-flex items-center gap-1.5">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-[#1E7E34]"></span>
                                                    <span>Được kiểm chứng bởi <strong className="font-semibold">{product.verifiedBy}</strong></span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Price and Buy Action */}
                                        <div className="pt-2 space-y-2 border-t border-[#F2EFE9]/80">
                                            <div>
                                                <span className="text-[10px] uppercase font-bold tracking-wider text-[#8A857D]">Giá mua</span>
                                                <p className="text-base sm:text-lg font-bold text-[#1C1A18]">{formatVND(product.price)}</p>
                                            </div>

                                            <div className="flex items-center gap-2 pt-1">
                                                <button
                                                    type="button"
                                                    onClick={() => handleBuyNow(product)}
                                                    className="flex-1 py-2.5 rounded-full bg-[#1C1A18] hover:bg-black text-white text-xs font-semibold text-center transition-colors shadow-xs cursor-pointer"
                                                >
                                                    Mua ngay
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleAddToCart(product)}
                                                    title="Thêm vào giỏ"
                                                    className="w-9 h-9 rounded-full border border-[#E6E2DC] bg-white hover:bg-[#F4F0EA] flex items-center justify-center text-[#1C1A18] transition-colors shadow-2xs cursor-pointer shrink-0"
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
                    <EmptyState
                        type="search"
                        badge="KHO HIỆN VẬT THRIFT"
                        title="Không tìm thấy hiện vật THRIFT phù hợp"
                        description="Vui lòng điều chỉnh lại từ khóa hoặc các bộ lọc tình trạng, tầm giá để tiếp tục tìm kiếm sản phẩm."
                        primaryAction={{
                            label: 'Xóa bộ lọc tìm kiếm',
                            onClick: handleResetFilters,
                            icon: 'filter_alt_off',
                            variant: 'primary',
                        }}
                        className="mb-12"
                    />
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