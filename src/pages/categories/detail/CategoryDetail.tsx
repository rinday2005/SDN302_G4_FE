import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Link, useParams, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { useCartWishlist } from '../../../context/CartWishlistContext';
import { getCategoryDetailConfig } from '../../data/categories/categoryDetailData';
import type { CategoryDetailProduct } from '../../data/categories/categoryDetailData';
import { getPublicRentProductsApi } from '../../../services/rentProduct.api';
import { getPublicThriftListingsApi } from '../../../services/thrift.api';
import { normalizeImageUrl } from '../../../utils/imageUrl';

type DetailMode = 'rent' | 'thrift';

export const CategoryDetail: React.FC = () => {
  const { slug: routeSlug } = useParams<{ slug?: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isWishlisted, toggleWishlist, addToCart } = useCartWishlist();
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Robust slug extraction from route param or URL pathname
  const resolvedSlug = useMemo(() => {
    if (routeSlug) return routeSlug.toLowerCase();
    const segments = location.pathname.split('/').filter(Boolean);
    if (segments.length >= 2 && segments[0] === 'categories') {
      return segments[segments.length - 1].toLowerCase();
    }
    return 'camera';
  }, [routeSlug, location.pathname]);

  // Load config based on slug parameter
  const category = useMemo(() => getCategoryDetailConfig(resolvedSlug), [resolvedSlug]);

  // Dynamic live products fetched from MongoDB
  const [dbRentItems, setDbRentItems] = useState<CategoryDetailProduct[]>([]);
  const [dbThriftItems, setDbThriftItems] = useState<CategoryDetailProduct[]>([]);

  useEffect(() => {
    let isMounted = true;

    const matchesCategory = (cat: unknown, slug: string): boolean => {
      const s = slug.toLowerCase();
      let pSlug = '';
      let pName = '';
      if (typeof cat === 'object' && cat !== null) {
        pSlug = ((cat as { slug?: string; name?: string }).slug || '').toLowerCase();
        pName = ((cat as { slug?: string; name?: string }).name || '').toLowerCase();
      } else if (typeof cat === 'string') {
        pSlug = cat.toLowerCase();
        pName = cat.toLowerCase();
      }

      if (s === 'camera' || s === 'cameras') {
        return pSlug.includes('camera') || pName.includes('camera') || pName.includes('máy ảnh');
      }
      if (s === 'shoes' || s === 'giay-dep' || s === 'giay') {
        return pSlug.includes('shoe') || pName.includes('giày') || pName.includes('sneaker');
      }
      if (s === 'dam-du-tiec' || s === 'dresses' || s === 'dam' || s === 'dam-tiec') {
        return pSlug.includes('dam') || pName.includes('đầm') || pName.includes('váy');
      }
      if (s === 'clothing' || s === 'quan-ao' || s === 'fashion' || s === 'thoi-trang') {
        return pSlug.includes('clothing') || pSlug.includes('fashion') || pName.includes('quần áo') || pName.includes('áo');
      }
      if (s === 'phu-kien' || s === 'accessories' || s === 'lifestyle' || s === 'electronics') {
        return pSlug.includes('phu-kien') || pSlug.includes('accessory') || pName.includes('phụ kiện');
      }
      return pSlug === s || pName.includes(s);
    };

    Promise.all([
      getPublicRentProductsApi({ limit: 200 }).catch(() => []),
      getPublicThriftListingsApi().catch(() => []),
    ]).then(([rentList, thriftList]) => {
      if (!isMounted) return;

      if (Array.isArray(rentList) && rentList.length > 0) {
        const filteredRent = rentList.filter((item) =>
          matchesCategory(item.categoryId || item.category, resolvedSlug)
        );
        const mappedRent: CategoryDetailProduct[] = filteredRent.map((item) => {
          const img = Array.isArray(item.images) && item.images.length > 0 ? normalizeImageUrl(item.images[0]) : '';
          const cond = item.condition || 'GOOD';
          const condLabel = cond === 'NEW' ? 'Mới 100%' : cond === 'LIKE_NEW' ? 'Grade Mint (99%)' : 'Grade A (95%)';
          return {
            id: item._id,
            title: item.name,
            description: item.description || `${item.name} chính hãng được kiểm định chất lượng nghiêm ngặt.`,
            image: img,
            alt: item.name,
            gradeBadge: condLabel,
            locationBadge: item.location || 'Đà Nẵng',
            verifiedBy: 'Shop Owner · Đã xác thực',
            rating: 5.0,
            reviewCount: 1,
            price: Number(item.pricePerDay) || 0,
            deposit: Number(item.depositAmount) || 0,
            href: `/rent/products/${item._id}`,
            mode: 'rent',
          };
        });
        setDbRentItems(mappedRent);
      }

      if (Array.isArray(thriftList) && thriftList.length > 0) {
        const filteredThrift = thriftList.filter((item) =>
          matchesCategory(item.categoryId || item.category, resolvedSlug)
        );
        const mappedThrift: CategoryDetailProduct[] = filteredThrift.map((item) => {
          const img = Array.isArray(item.images) && item.images.length > 0 ? normalizeImageUrl(item.images[0]) : '';
          return {
            id: item._id,
            title: item.name,
            description: item.description || `${item.name} lưu trữ tuyển chọn đã qua thẩm định vòng đời.`,
            image: img,
            alt: item.name,
            gradeBadge: item.condition || 'Grade Mint (98%)',
            locationBadge: item.location || 'Hà Nội',
            verifiedBy: 'Shop Owner · Kiểm chứng',
            rating: 5.0,
            reviewCount: 1,
            price: Number(item.price) || 0,
            href: `/thrift/products/${item._id}`,
            mode: 'thrift',
            sourceType: (item.sourceType === 'rent' ? 'rent' : 'used') as 'rent' | 'used',
            sourceLabel: item.sourceType === 'rent' ? 'Từ sản phẩm RENT' : 'Đồ đã qua sử dụng',
          };
        });
        setDbThriftItems(mappedThrift);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [resolvedSlug]);

  // Merge live DB products with static base config to guarantee updated images & pricing
  const resolvedRentItems = useMemo(() => {
    if (dbRentItems.length === 0) return category.rentItems;
    const dbMap = new Map(dbRentItems.map((it) => [it.id, it]));
    const updatedStatic = category.rentItems.map((st) => {
      const live = dbMap.get(st.id);
      if (live) {
        dbMap.delete(st.id);
        return {
          ...st,
          image: live.image || st.image,
          price: live.price || st.price,
          deposit: live.deposit !== undefined ? live.deposit : st.deposit,
          title: live.title || st.title,
        };
      }
      return st;
    });
    return [...updatedStatic, ...Array.from(dbMap.values())];
  }, [category.rentItems, dbRentItems]);

  const resolvedThriftItems = useMemo(() => {
    if (dbThriftItems.length === 0) return category.thriftItems;
    const dbMap = new Map(dbThriftItems.map((it) => [it.id, it]));
    const updatedStatic = category.thriftItems.map((st) => {
      const live = dbMap.get(st.id);
      if (live) {
        dbMap.delete(st.id);
        return {
          ...st,
          image: live.image || st.image,
          price: live.price || st.price,
          title: live.title || st.title,
        };
      }
      return st;
    });
    return [...updatedStatic, ...Array.from(dbMap.values())];
  }, [category.thriftItems, dbThriftItems]);

  const [mode, setMode] = useState<DetailMode>('rent');
  const [searchQuery, setSearchQuery] = useState('');

  // RENT filter states
  const [rentPriceRange, setRentPriceRange] = useState('all');
  const [rentCondition, setRentCondition] = useState('all');
  const [rentLocation, setRentLocation] = useState('all');

  // THRIFT filter states
  const [thriftPriceRange, setThriftPriceRange] = useState('all');
  const [thriftSource, setThriftSource] = useState('all');
  const [thriftCondition, setThriftCondition] = useState('all');
  const [thriftLocation, setThriftLocation] = useState('all');

  // Guest Auth Requirement Modal
  const [authModal, setAuthModal] = useState<{
    open: boolean;
    actionName: string;
    targetUrl: string;
  }>({
    open: false,
    actionName: '',
    targetUrl: '',
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [resolvedSlug]);

  // Keyboard shortcut listener: Cmd+K or Ctrl+K to focus search input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleProtectedAction = (actionName: string, targetUrl: string, onSuccess: () => void) => {
    if (!user) {
      setAuthModal({
        open: true,
        actionName,
        targetUrl,
      });
      return;
    }
    onSuccess();
  };

  const handleToggleWishlist = (product: CategoryDetailProduct) => {
    toggleWishlist(product.id);
  };

  const handleRentNow = (product: CategoryDetailProduct) => {
    handleProtectedAction(`thuê thiết bị "${product.title}"`, '/cart', () => {
      addToCart({
        id: product.id,
        title: product.title,
        price: product.price,
        image: product.image,
        mode: 'rent',
        deposit: product.deposit,
        location: product.locationBadge,
        gradeBadge: product.gradeBadge,
        categoryLabel: category.title,
        quantity: 1,
      });
      navigate('/cart');
    });
  };

  const handleBuyNow = (product: CategoryDetailProduct) => {
    handleProtectedAction(`mua sản phẩm "${product.title}"`, '/cart', () => {
      addToCart({
        id: product.id,
        title: product.title,
        price: product.price,
        image: product.image,
        mode: 'thrift',
        deposit: product.deposit,
        location: product.locationBadge,
        gradeBadge: product.gradeBadge,
        categoryLabel: category.title,
        quantity: 1,
      });
      navigate('/cart');
    });
  };

  const handleAddToCart = (product: CategoryDetailProduct) => {
    addToCart({
      id: product.id,
      title: product.title,
      price: product.price,
      image: product.image,
      mode: product.mode,
      deposit: product.deposit,
      location: product.locationBadge,
      gradeBadge: product.gradeBadge,
      categoryLabel: category.title,
      quantity: 1,
    });
  };

  // Filter RENT products
  const filteredRentProducts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return resolvedRentItems.filter((item) => {
      const matchSearch =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.locationBadge.toLowerCase().includes(q);

      let matchPrice = true;
      if (rentPriceRange === 'under300') matchPrice = item.price < 300000;
      else if (rentPriceRange === '300to600') matchPrice = item.price >= 300000 && item.price <= 600000;
      else if (rentPriceRange === 'above600') matchPrice = item.price > 600000;

      const matchCondition =
        rentCondition === 'all' || item.gradeBadge.toLowerCase().includes(rentCondition.toLowerCase());

      const matchLocation =
        rentLocation === 'all' || item.locationBadge.toLowerCase().includes(rentLocation.toLowerCase());

      return matchSearch && matchPrice && matchCondition && matchLocation;
    });
  }, [resolvedRentItems, searchQuery, rentPriceRange, rentCondition, rentLocation]);

  // Filter THRIFT products
  const filteredThriftProducts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return resolvedThriftItems.filter((item) => {
      const matchSearch =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.locationBadge.toLowerCase().includes(q);

      let matchPrice = true;
      if (thriftPriceRange === 'under10m') matchPrice = item.price < 10000000;
      else if (thriftPriceRange === '10to30m') matchPrice = item.price >= 10000000 && item.price <= 30000000;
      else if (thriftPriceRange === 'above30m') matchPrice = item.price > 30000000;

      const matchSource =
        thriftSource === 'all' ||
        (thriftSource === 'rent' && item.sourceType === 'rent') ||
        (thriftSource === 'used' && item.sourceType === 'used');

      const matchCondition =
        thriftCondition === 'all' || item.gradeBadge.toLowerCase().includes(thriftCondition.toLowerCase());

      const matchLocation =
        thriftLocation === 'all' || item.locationBadge.toLowerCase().includes(thriftLocation.toLowerCase());

      return matchSearch && matchPrice && matchSource && matchCondition && matchLocation;
    });
  }, [resolvedThriftItems, searchQuery, thriftPriceRange, thriftSource, thriftCondition, thriftLocation]);

  const resetFilters = () => {
    setSearchQuery('');
    setRentPriceRange('all');
    setRentCondition('all');
    setRentLocation('all');
    setThriftPriceRange('all');
    setThriftSource('all');
    setThriftCondition('all');
    setThriftLocation('all');
  };

  const formatVND = (num: number) => new Intl.NumberFormat('vi-VN').format(num) + '₫';

  const rentCount = resolvedRentItems.length;
  const thriftCount = resolvedThriftItems.length;
  const currentList = mode === 'rent' ? filteredRentProducts : filteredThriftProducts;
  const totalCount = mode === 'rent' ? rentCount : thriftCount;
  const countLabel = mode === 'rent' ? 'thiết bị RENT' : 'sản phẩm THRIFT';

  return (
    <div className="w-full min-h-screen bg-[#FBF9F5] text-[#1C1A18] antialiased">
      {/* Guest Auth Required Modal */}
      {authModal.open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
          onClick={() => setAuthModal({ open: false, actionName: '', targetUrl: '' })}
        >
          <div
            className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5 text-center relative border border-[#E7E2DA]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setAuthModal({ open: false, actionName: '', targetUrl: '' })}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-[#F4F0EA] text-[#78736A] transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>

            <div className="w-14 h-14 rounded-full bg-[#F4F0EA] flex items-center justify-center text-[#1C1A18] mx-auto shadow-sm">
              <span className="material-symbols-outlined text-[28px]">lock_person</span>
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold text-[#1C1A18]">Yêu cầu Đăng nhập</h3>
              <p className="text-xs text-[#5E5A53] leading-relaxed">
                Bạn đang truy cập ở chế độ công khai (Khách vãng lai). Để <strong>{authModal.actionName}</strong>,
                vui lòng đăng nhập hoặc tạo tài khoản thành viên ReUse Hub.
              </p>
            </div>

            <div className="p-3.5 bg-[#F4F0EA]/70 rounded-2xl text-left space-y-1.5 text-xs text-[#5E5A53] border border-[#E6E2DC]">
              <div className="flex items-center gap-2 font-semibold text-[#1C1A18]">
                <span className="material-symbols-outlined text-[16px] text-emerald-700">verified</span>
                Quyền lợi thành viên:
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-[11px] text-[#78736A]">
                <li>Khởi tạo hợp đồng thuê điện tử và ký quỹ an toàn</li>
                <li>Hưởng chính sách Smart Escrow hoàn cọc tự động 100%</li>
                <li>Bảo chứng đổi trả 72 giờ và tích điểm kinh tế xanh</li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Link
                to={`/login?redirect=${encodeURIComponent(authModal.targetUrl)}&message=${encodeURIComponent(
                  `Bạn cần đăng nhập để ${authModal.actionName}!`
                )}`}
                className="flex-1 py-3 px-4 rounded-xl bg-[#1C1A18] text-white text-xs font-bold text-center hover:bg-[#292724] transition-all shadow-sm"
              >
                Đăng nhập ngay
              </Link>
              <Link
                to={`/register?redirect=${encodeURIComponent(authModal.targetUrl)}`}
                className="flex-1 py-3 px-4 rounded-xl bg-[#F4F0EA] text-[#1C1A18] text-xs font-bold text-center hover:bg-[#E7E2DA] transition-all"
              >
                Đăng ký tài khoản
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Main Container */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        {/* Top Breadcrumb Section */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-[#78736A] tracking-wide">
          <Link to="/" className="hover:text-[#1C1A18] transition-colors">
            Trang chủ
          </Link>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <Link to="/categories" className="hover:text-[#1C1A18] transition-colors">
            Danh mục
          </Link>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span className="text-[#1C1A18] font-semibold truncate max-w-xs">{category.title}</span>
        </nav>

        {/* Editorial Category Header */}
        <header
          data-reveal
          className="relative bg-[#F7F5F0] rounded-2xl p-6 lg:p-10 shadow-sm border border-[#E6E2DC] overflow-hidden"
        >
          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#F0ECE1] rounded-full text-[10px] tracking-[0.2em] font-bold text-[#79716B] uppercase mb-4 border border-[#E6E2DC]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#B45309]" />
              {category.archivalLabel}
            </div>

            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#1C1A18] mb-4">
              {category.title}
            </h1>

            <p className="text-sm lg:text-base text-[#79716B] leading-relaxed max-w-2xl">
              {category.description}
            </p>
          </div>

          {/* Metrics Bar inside Header */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-[#E6E2DC]">
            <div className="flex flex-col">
              <span className="font-serif text-2xl font-bold text-[#1C1A18]">{rentCount}</span>
              <span className="text-xs text-[#79716B] font-medium mt-0.5">Thiết bị RENT sẵn sàng</span>
            </div>
            <div className="flex flex-col">
              <span className="font-serif text-2xl font-bold text-[#1C1A18]">{thriftCount}</span>
              <span className="text-xs text-[#79716B] font-medium mt-0.5">Sản phẩm THRIFT lưu trữ</span>
            </div>
            <div className="flex flex-col">
              <span className="font-serif text-2xl font-bold text-[#1C1A18]">100%</span>
              <span className="text-xs text-[#79716B] font-medium mt-0.5">{category.inspectionBadge}</span>
            </div>
            <div className="flex flex-col">
              <span className="font-serif text-2xl font-bold text-[#1C1A18]">Escrow</span>
              <span className="text-xs text-[#79716B] font-medium mt-0.5">{category.escrowBadge}</span>
            </div>
          </div>
        </header>

        {/* Interactive Mode Tabs (RENT vs THRIFT) */}
        <div data-reveal className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setMode('rent')}
            className={`group text-left p-5 rounded-2xl transition-all relative overflow-hidden cursor-pointer border ${
              mode === 'rent'
                ? 'bg-[#1C1A18] text-white shadow-md border-[#1C1A18]'
                : 'bg-[#F7F5F0] text-[#1C1A18] hover:bg-[#F0ECE1] border-[#E6E2DC]'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-lg">event_available</span>
                <span className="font-serif text-lg font-bold">Dịch vụ Thuê RENT</span>
              </div>
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-semibold tracking-wide ${
                  mode === 'rent' ? 'bg-white/20 text-white' : 'bg-[#E6E2DC] text-[#79716B]'
                }`}
              >
                {rentCount} thiết bị
              </span>
            </div>
            <p className={`text-xs leading-relaxed ${mode === 'rent' ? 'text-stone-300' : 'text-[#79716B]'}`}>
              Trải nghiệm {category.title.toLowerCase()} theo ngày, hoàn cọc 100% an toàn qua Smart Escrow bảo chứng minh bạch.
            </p>
            <div
              className={`h-1 w-full rounded-full mt-4 transition-all ${
                mode === 'rent' ? 'bg-amber-500' : 'bg-transparent'
              }`}
            />
          </button>

          <button
            type="button"
            onClick={() => setMode('thrift')}
            className={`group text-left p-5 rounded-2xl transition-all relative overflow-hidden cursor-pointer border ${
              mode === 'thrift'
                ? 'bg-[#1C1A18] text-white shadow-md border-[#1C1A18]'
                : 'bg-[#F7F5F0] text-[#1C1A18] hover:bg-[#F0ECE1] border-[#E6E2DC]'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-lg">shopping_bag</span>
                <span className="font-serif text-lg font-bold">Mua lưu trữ THRIFT</span>
              </div>
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-semibold tracking-wide ${
                  mode === 'thrift' ? 'bg-white/20 text-white' : 'bg-[#E6E2DC] text-[#79716B]'
                }`}
              >
                {thriftCount} sản phẩm
              </span>
            </div>
            <p className={`text-xs leading-relaxed ${mode === 'thrift' ? 'text-stone-300' : 'text-[#79716B]'}`}>
              Sở hữu vĩnh viễn đồ cũ tuyển chọn &amp; thiết bị chuyển đổi từ vòng đời RENT với giá ưu đãi tối đa.
            </p>
            <div
              className={`h-1 w-full rounded-full mt-4 transition-all ${
                mode === 'thrift' ? 'bg-amber-500' : 'bg-transparent'
              }`}
            />
          </button>
        </div>

        {/* FILTERS SECTION */}
        <section data-reveal className="bg-[#F7F5F0] rounded-2xl p-5 shadow-sm border border-[#E6E2DC]">
          {/* Search within Category & Quick Controls */}
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between pb-4 border-b border-[#E6E2DC]">
            <div className="relative flex-1 max-w-md">
              <span className="material-symbols-outlined absolute left-3.5 top-2.5 text-[#79716B] text-lg">
                search
              </span>
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  mode === 'rent'
                    ? category.rentSearchPlaceholder
                    : category.thriftSearchPlaceholder
                }
                className="w-full bg-[#FBF9F5] border border-[#E6E2DC] rounded-xl pl-10 pr-12 py-2 text-xs text-[#1C1A18] placeholder-[#79716B] focus:ring-1 focus:ring-[#1C1A18] focus:outline-none transition-all"
              />
              <span className="absolute right-3 top-2.5 text-[10px] text-[#79716B] bg-[#E6E2DC] px-1.5 py-0.5 rounded font-mono select-none">
                ⌘K
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs text-[#79716B] self-end md:self-center">
              <span className="font-medium text-[#1C1A18]">
                Hiển thị {currentList.length} trong số {totalCount} {countLabel}
              </span>
            </div>
          </div>

          {/* Dynamic Filter Bars */}
          {mode === 'rent' ? (
            /* 1. RENT Filter Controls */
            <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-[#79716B] uppercase tracking-wider mb-1.5">
                  Khoảng giá / ngày
                </label>
                <select
                  value={rentPriceRange}
                  onChange={(e) => setRentPriceRange(e.target.value)}
                  className="w-full bg-[#FBF9F5] border border-[#E6E2DC] rounded-xl text-xs py-2 px-3 text-[#1C1A18] focus:ring-1 focus:ring-[#1C1A18] cursor-pointer"
                >
                  <option value="all">Tất cả mức giá</option>
                  <option value="under300">Dưới 300.000đ / ngày</option>
                  <option value="300to600">300.000đ - 600.000đ / ngày</option>
                  <option value="above600">Trên 600.000đ / ngày</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#79716B] uppercase tracking-wider mb-1.5">
                  Thời gian dự kiến
                </label>
                <div className="flex items-center bg-[#FBF9F5] border border-[#E6E2DC] rounded-xl px-3 py-2 text-xs text-[#1C1A18]">
                  <span className="material-symbols-outlined text-[#79716B] text-sm mr-2">date_range</span>
                  <span className="text-[#79716B]">Chọn ngày nhận &amp; trả</span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#79716B] uppercase tracking-wider mb-1.5">
                  Tình trạng máy
                </label>
                <select
                  value={rentCondition}
                  onChange={(e) => setRentCondition(e.target.value)}
                  className="w-full bg-[#FBF9F5] border border-[#E6E2DC] rounded-xl text-xs py-2 px-3 text-[#1C1A18] focus:ring-1 focus:ring-[#1C1A18] cursor-pointer"
                >
                  <option value="all">Tất cả phẩm cấp</option>
                  <option value="Grade Mint">Grade Mint (99%)</option>
                  <option value="Grade A+">Grade A+ Như mới (98%)</option>
                  <option value="95%">Rất tốt (95%)</option>
                  <option value="90%">Tốt (90%)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#79716B] uppercase tracking-wider mb-1.5">
                  Khu vực kho xuất
                </label>
                <select
                  value={rentLocation}
                  onChange={(e) => setRentLocation(e.target.value)}
                  className="w-full bg-[#FBF9F5] border border-[#E6E2DC] rounded-xl text-xs py-2 px-3 text-[#1C1A18] focus:ring-1 focus:ring-[#1C1A18] cursor-pointer"
                >
                  <option value="all">Toàn quốc</option>
                  <option value="Đà Nẵng">Đà Nẵng</option>
                  <option value="TP. HCM">TP. Hồ Chí Minh</option>
                  <option value="Hà Nội">Hà Nội</option>
                </select>
              </div>
            </div>
          ) : (
            /* 2. THRIFT Filter Controls */
            <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-[#79716B] uppercase tracking-wider mb-1.5">
                  Khoảng giá sở hữu
                </label>
                <select
                  value={thriftPriceRange}
                  onChange={(e) => setThriftPriceRange(e.target.value)}
                  className="w-full bg-[#FBF9F5] border border-[#E6E2DC] rounded-xl text-xs py-2 px-3 text-[#1C1A18] focus:ring-1 focus:ring-[#1C1A18] cursor-pointer"
                >
                  <option value="all">Tất cả mức giá</option>
                  <option value="under10m">Dưới 10 triệu đồng</option>
                  <option value="10to30m">10 - 30 triệu đồng</option>
                  <option value="above30m">Trên 30 triệu đồng</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#79716B] uppercase tracking-wider mb-1.5">
                  Nguồn gốc lưu trữ
                </label>
                <select
                  value={thriftSource}
                  onChange={(e) => setThriftSource(e.target.value)}
                  className="w-full bg-[#FBF9F5] border border-[#E6E2DC] rounded-xl text-xs py-2 px-3 text-[#1C1A18] focus:ring-1 focus:ring-[#1C1A18] cursor-pointer"
                >
                  <option value="all">Tất cả nguồn gốc</option>
                  <option value="rent">Chuyển từ vòng đời RENT</option>
                  <option value="used">Đồ đã qua sử dụng tuyển chọn</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#79716B] uppercase tracking-wider mb-1.5">
                  Tình trạng máy
                </label>
                <select
                  value={thriftCondition}
                  onChange={(e) => setThriftCondition(e.target.value)}
                  className="w-full bg-[#FBF9F5] border border-[#E6E2DC] rounded-xl text-xs py-2 px-3 text-[#1C1A18] focus:ring-1 focus:ring-[#1C1A18] cursor-pointer"
                >
                  <option value="all">Tất cả tình trạng</option>
                  <option value="Mint">Grade Mint (98-99%)</option>
                  <option value="95%">Rất tốt (95%)</option>
                  <option value="90%">Đã qua sử dụng (90%)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#79716B] uppercase tracking-wider mb-1.5">
                  Khu vực kho
                </label>
                <select
                  value={thriftLocation}
                  onChange={(e) => setThriftLocation(e.target.value)}
                  className="w-full bg-[#FBF9F5] border border-[#E6E2DC] rounded-xl text-xs py-2 px-3 text-[#1C1A18] focus:ring-1 focus:ring-[#1C1A18] cursor-pointer"
                >
                  <option value="all">Toàn quốc</option>
                  <option value="Hà Nội">Hà Nội</option>
                  <option value="Đà Nẵng">Đà Nẵng</option>
                  <option value="TP. HCM">TP. Hồ Chí Minh</option>
                </select>
              </div>
            </div>
          )}
        </section>

        {/* PRODUCT GRID */}
        {currentList.length > 0 ? (
          <section data-reveal className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {currentList.map((product) => {
                const isSaved = isWishlisted(product.id);
                return (
                  <article
                    key={product.id}
                    data-reveal
                    className="group bg-[#F7F5F0] rounded-2xl overflow-hidden flex flex-col justify-between shadow-xs hover:shadow-md border border-[#E6E2DC] transition-all"
                  >
                    <div>
                      {/* Media container */}
                      <div className="relative aspect-[4/3] bg-[#EFEBE4] overflow-hidden">
                        <Link to={product.href} className="block w-full h-full">
                          <img
                            src={normalizeImageUrl(product.image)}
                            alt={product.alt}
                            loading="lazy"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        </Link>
                        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                          {product.sourceLabel ? (
                            <span className="px-2 py-1 bg-stone-900 text-white text-[10px] font-semibold rounded-md backdrop-blur-sm">
                              {product.sourceLabel}
                            </span>
                          ) : (
                            <span className="px-2 py-1 bg-[#1C1A18]/85 text-white text-[10px] font-semibold rounded-md backdrop-blur-sm">
                              {product.gradeBadge}
                            </span>
                          )}
                          <span className="px-2 py-1 bg-[#FBF9F5]/90 text-[#1C1A18] text-[10px] font-semibold rounded-md backdrop-blur-sm border border-[#E6E2DC]">
                            {product.locationBadge}
                          </span>
                        </div>

                        {/* Wishlist Button */}
                        <button
                          type="button"
                          onClick={() => handleToggleWishlist(product)}
                          title={isSaved ? 'Đã lưu' : 'Lưu yêu thích'}
                          className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-sm transition-colors cursor-pointer shadow-xs ${
                            isSaved ? 'bg-[#1C1A18] text-rose-400' : 'bg-white/80 hover:bg-white text-[#1C1A18]'
                          }`}
                        >
                          <span
                            className="material-symbols-outlined text-base"
                            style={{ fontVariationSettings: isSaved ? "'FILL' 1" : "'FILL' 0" }}
                          >
                            favorite
                          </span>
                        </button>
                      </div>

                      {/* Content details */}
                      <div className="p-5">
                        <div className="flex items-center justify-between text-[11px] text-[#79716B] mb-1.5">
                          <span className="font-semibold text-emerald-800 flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs">verified</span>
                            {product.verifiedBy}
                          </span>
                          <span className="flex items-center gap-1">
                            ★ {product.rating.toFixed(1)} ({product.reviewCount} đánh giá)
                          </span>
                        </div>

                        <h2 className="font-serif text-lg font-bold text-[#1C1A18] group-hover:text-amber-800 transition-colors">
                          <Link to={product.href}>{product.title}</Link>
                        </h2>
                        <p className="text-xs text-[#79716B] mt-1 line-clamp-1">{product.description}</p>
                      </div>
                    </div>

                    {/* Bottom action row */}
                    <div className="px-5 pb-5 pt-3 border-t border-[#E6E2DC] flex items-end justify-between gap-3">
                      <div>
                        {product.mode === 'rent' ? (
                          <>
                            <div className="text-[11px] text-[#79716B]">
                              Cọc hoàn lại: {product.deposit ? formatVND(product.deposit) : '1.500.000₫'}
                            </div>
                            <div className="font-serif text-lg font-bold text-[#1C1A18]">
                              {formatVND(product.price)}{' '}
                              <span className="text-xs font-sans font-normal text-[#79716B]">/ ngày</span>
                            </div>
                          </>
                        ) : (
                          <>
                            {product.discountNote ? (
                              <div className="text-[11px] text-emerald-800 font-semibold">
                                {product.discountNote}
                              </div>
                            ) : (
                              <div className="text-[11px] text-[#79716B]">Giá mua trọn gói</div>
                            )}
                            <div className="font-serif text-lg font-bold text-[#1C1A18]">
                              {formatVND(product.price)}
                            </div>
                          </>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleAddToCart(product)}
                          title="Thêm giỏ"
                          className="p-2 rounded-xl bg-[#F0ECE1] text-[#1C1A18] hover:bg-[#E6E2DC] transition-colors cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-base">shopping_bag</span>
                        </button>

                        {product.mode === 'rent' ? (
                          <button
                            type="button"
                            onClick={() => handleRentNow(product)}
                            className="px-3.5 py-2 rounded-xl bg-[#1C1A18] text-white text-xs font-semibold hover:bg-stone-800 transition-colors whitespace-nowrap cursor-pointer shadow-xs"
                          >
                            Thuê ngay
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleBuyNow(product)}
                            className="px-3.5 py-2 rounded-xl bg-[#1C1A18] text-white text-xs font-semibold hover:bg-stone-800 transition-colors whitespace-nowrap cursor-pointer shadow-xs"
                          >
                            Mua ngay
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ) : (
          /* Empty State Fallback */
          <div data-reveal className="my-12 p-12 bg-[#F7F5F0] rounded-2xl text-center border border-[#E6E2DC] space-y-4">
            <div className="w-12 h-12 rounded-full bg-[#E6E2DC] text-[#79716B] flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-[24px]">search_off</span>
            </div>
            <h3 className="font-serif text-xl font-bold text-[#1C1A18]">
              Không tìm thấy sản phẩm phù hợp
            </h3>
            <p className="text-xs text-[#79716B] max-w-sm mx-auto leading-relaxed">
              Hãy thử mở rộng bộ lọc giá, thay đổi khu vực kho hoặc tìm kiếm với từ khoá tổng quát hơn.
            </p>
            <button
              type="button"
              onClick={resetFilters}
              className="px-5 py-2.5 rounded-xl bg-[#1C1A18] text-white text-xs font-semibold hover:bg-stone-800 transition-colors cursor-pointer"
            >
              Đặt lại bộ lọc
            </button>
          </div>
        )}

        {/* Editorial Pagination */}
        <div data-reveal className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-4 py-4 border-t border-[#E6E2DC]">
          <div className="text-xs text-[#79716B]">
            Trang <span className="font-semibold text-[#1C1A18]">1</span> trên{' '}
            <span className="font-semibold text-[#1C1A18]">15</span> trang lưu trữ
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#79716B] hover:bg-[#F0ECE1] transition-colors cursor-not-allowed opacity-50"
            >
              ‹ Trước
            </button>
            <button type="button" className="w-8 h-8 rounded-lg text-xs font-bold bg-[#1C1A18] text-white">
              1
            </button>
            <button type="button" className="w-8 h-8 rounded-lg text-xs font-medium text-[#79716B] hover:bg-[#F0ECE1] transition-colors cursor-pointer">
              2
            </button>
            <button type="button" className="w-8 h-8 rounded-lg text-xs font-medium text-[#79716B] hover:bg-[#F0ECE1] transition-colors cursor-pointer">
              3
            </button>
            <span className="px-1 text-xs text-[#79716B]">...</span>
            <button type="button" className="w-8 h-8 rounded-lg text-xs font-medium text-[#79716B] hover:bg-[#F0ECE1] transition-colors cursor-pointer">
              15
            </button>
            <button
              type="button"
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#1C1A18] hover:bg-[#F0ECE1] transition-colors cursor-pointer"
            >
              Sau ›
            </button>
          </div>
        </div>

        {/* Circular Education & Provenance Banner */}
        <aside data-reveal className="mt-14 p-8 bg-[#F0ECE1] rounded-2xl relative overflow-hidden shadow-xs border border-[#E6E2DC]">
          <div className="relative z-10 max-w-3xl space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-900">
              <span className="material-symbols-outlined text-sm">verified_user</span>
              QUY TRÌNH KIỂM ĐỊNH TIÊU CHUẨN
            </div>
            <h3 className="font-serif text-2xl font-bold text-[#1C1A18]">
              {category.inspectionProcessTitle}
            </h3>
            <p className="text-xs lg:text-sm text-[#79716B] leading-relaxed">
              {category.inspectionProcessDesc}
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default CategoryDetail;
