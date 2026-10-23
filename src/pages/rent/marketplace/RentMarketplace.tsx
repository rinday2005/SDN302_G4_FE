import React, { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { useCartWishlist } from '../../../context/CartWishlistContext';
import { getPublicRentProductsApi } from '../../../services/rentProduct.api';
import { AppSidebar } from '../../../components/layout/AppSidebar';
import {
  RENT_PRODUCTS,
  RENT_SORT_OPTIONS,
  RENT_HOW_IT_WORKS_STEPS,
} from '../../data/rent/marketplaceData';
import type { Product, SortKey } from '../../data/rent/marketplaceData';

// ─── ProductCard ───────────────────────────────────────────────────────────────

const ProductCard: React.FC<{
  product: Product;
  onRequireAuth: (action: string, targetHref: string) => void;
}> = ({ product, onRequireAuth }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { isWishlisted, toggleWishlist, addToCart } = useCartWishlist();
  const {
    id, title, categoryLabel, price, rating, reviewCount,
    conditionLabel, location, deposit, available, href, image,
  } = product;
  const isSaved = isWishlisted(id);

  const handleRentClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) {
      onRequireAuth(`thuê "${title}"`, '/cart');
      return;
    }
    addToCart({
      id,
      title,
      price,
      image,
      mode: 'rent',
      location,
      deposit,
      categoryLabel,
      gradeBadge: conditionLabel,
      quantity: 1,
    });
    navigate('/cart');
  };

  const handleCartClick = (e: React.MouseEvent) => {
    e.preventDefault();
    addToCart({
      id,
      title,
      price,
      image,
      mode: 'rent',
      location,
      deposit,
      categoryLabel,
      gradeBadge: conditionLabel,
      quantity: 1,
    });
  };

  return (
    <article
      className={`group flex flex-col bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 ${!available ? 'opacity-90' : ''}`}
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#F4F0EA]">
        {/* Wishlist Button */}
        <button
          type="button"
          onClick={() => toggleWishlist(id)}
          className={`absolute top-3 right-3 z-10 w-8 h-8 rounded-full flex items-center justify-center shadow-xs transition-transform active:scale-90 cursor-pointer ${
            isSaved
              ? 'bg-[#1C1A18] text-rose-400'
              : 'bg-white/90 hover:bg-white text-[#1C1A18]'
          }`}
          title={isSaved ? 'Đã lưu yêu thích' : 'Lưu yêu thích'}
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
            />
          </svg>
        </button>

        <Link to={href} className="block w-full h-full">
          <img
            src={image}
            alt={title}
            className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${!available ? 'grayscale-[30%]' : ''}`}
          />
        </Link>
        <div className="absolute top-3 left-3 flex flex-wrap items-center gap-1.5 pointer-events-none">
          <span className="px-2.5 py-1 text-[10px] font-semibold tracking-wide rounded-full bg-white/90 backdrop-blur-md text-[#1C1A18] shadow-sm">
            {conditionLabel}
          </span>
          <span
            className={`px-2 py-0.5 text-[10px] font-medium tracking-wide rounded-full text-[#FBF9F5] ${available ? 'bg-[#1C1A18]' : 'bg-[#78736A]'}`}
          >
            {available ? 'Có thể thuê' : 'Không khả dụng'}
          </span>
        </div>
      </div>

      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] text-[#78736A]">
            <span className="uppercase tracking-wider font-semibold">{categoryLabel}</span>
            <div className="flex items-center gap-2">
              {product.size && product.category !== 'camera' && !/canon|sony|nikon|fujifilm|dji/i.test(product.name || '') && (
                <span className="text-[10px] font-bold text-white bg-[#1C1A18] px-1.5 py-0.5 rounded shadow-2xs">
                  Size {product.size}
                </span>
              )}
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[13px]">location_on</span>
                {location}
              </span>
            </div>
          </div>
          <h2 className="font-serif text-base font-bold text-[#1C1A18] group-hover:text-amber-800 transition-colors line-clamp-1">
            <Link
              to={href}
              className="block"
            >
              {title}
            </Link>
          </h2>
          <div className="flex items-center gap-1.5 text-xs text-[#1C1A18] pt-0.5">
            <span
              className="material-symbols-outlined text-[15px] text-amber-600"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              star
            </span>
            <span className="font-bold">{rating.toFixed(1)}</span>
            <span className="text-[#78736A] text-[11px]">({reviewCount} đánh giá)</span>
          </div>
        </div>

        <div className="pt-2 bg-[#F4F0EA]/30 -mx-5 -mb-5 p-5 space-y-3">
          <div className="flex items-baseline justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-[#78736A]">Giá thuê</span>
              <p className="font-serif text-base font-bold text-[#1C1A18]">
                {price.toLocaleString('vi-VN')}đ
                <span className="text-xs font-sans font-normal text-[#5E5A53]"> / ngày</span>
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-semibold text-[#78736A]">Tiền cọc hoàn lại</span>
              <p className="text-xs text-[#5E5A53] font-mono">{deposit}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            {available ? (
              <>
                <button
                  type="button"
                  onClick={handleRentClick}
                  className="flex-1 py-2 rounded-xl bg-[#1C1A18] text-white text-xs font-medium text-center hover:bg-[#292724] transition-colors shadow-sm cursor-pointer"
                >
                  Thuê ngay
                </button>
                <button
                  type="button"
                  onClick={handleCartClick}
                  title="Thêm vào giỏ"
                  className="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-[#1C1A18] hover:bg-[#F4F0EA] transition-colors shadow-sm cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[17px]">shopping_bag</span>
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  disabled
                  className="flex-1 py-2 rounded-xl bg-[#F4F0EA] text-[#78736A] text-xs font-medium text-center cursor-not-allowed"
                >
                  Đang có người thuê
                </button>
                <Link
                  to="/login"
                  title="Nhận thông báo khi có hàng"
                  className="w-9 h-9 rounded-xl bg-white flex items-center justify-center text-[#1C1A18] hover:bg-[#F4F0EA] transition-colors shadow-sm"
                >
                  <span className="material-symbols-outlined text-[17px]">notifications</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </article>
  );
};

// ─── Main Page ─────────────────────────────────────────────────────────────────

const RentMarketplace: React.FC = () => {
  const [dbProducts, setDbProducts] = useState<Product[]>([]);

  useEffect(() => {
    let isMounted = true;
    getPublicRentProductsApi()
      .then((items) => {
        if (!isMounted) return;
        if (Array.isArray(items) && items.length > 0) {
          const mapped: Product[] = items.map((item) => {
            const catSlug = typeof item.categoryId === 'object' && item.categoryId?.slug ? item.categoryId.slug : 'fashion';
            const catName = typeof item.categoryId === 'object' && item.categoryId?.name ? item.categoryId.name : 'Thời trang';
            const cond = item.condition || 'GOOD';
            const condLabel = cond === 'NEW' ? 'Mới 100%' : cond === 'LIKE_NEW' ? 'Như mới 99%' : 'Rất tốt 95%';
            const img = Array.isArray(item.images) && item.images.length > 0 ? item.images[0] : '';
            const dep = item.depositAmount ? `${Number(item.depositAmount).toLocaleString('vi-VN')}đ` : '0đ';

            return {
              id: item._id,
              title: item.name,
              category: catSlug,
              categoryLabel: catName,
              price: Number(item.pricePerDay) || 0,
              rating: 5.0,
              reviewCount: 1,
              condition: cond === 'LIKE_NEW' ? 'Như mới' : 'Rất tốt',
              conditionLabel: condLabel,
              location: item.location || 'Đà Nẵng',
              deposit: dep,
              available: (item.totalQuantity || 1) > 0,
              href: `/rent/products/${item._id}`,
              image: img,
              size: item.size || 'L',
              sizes: Array.isArray(item.sizes) && item.sizes.length > 0 ? item.sizes : ['S', 'M', 'L', 'XL'],
            };
          });
          setDbProducts(mapped);
        }
      })
      .catch((err) => {
        console.warn('Could not load products from API:', err);
      });

    return () => {
      isMounted = false;
    };
  }, []);
  const [searchParams] = useSearchParams();
  const urlCategory = searchParams.get('category');

  const [authModal, setAuthModal] = useState<{ open: boolean; action: string; targetHref: string }>({
    open: false,
    action: '',
    targetHref: '',
  });

  const [query, setQuery] = useState('');
  const [userCategory, setUserCategory] = useState<string | null>(null);
  const category = userCategory ?? (urlCategory || 'all');
  const [priceRange, setPriceRange] = useState('all');
  const [condition, setCondition] = useState('all');
  const [location, setLocation] = useState('all');
  const [selectedSize, setSelectedSize] = useState('all');
  const [sort, setSort] = useState<SortKey>('recommended');

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

  const handleRequireAuth = (actionTitle: string, targetHref: string) => {
    setAuthModal({
      open: true,
      action: actionTitle,
      targetHref,
    });
  };

  const visibleProducts = useMemo(() => {
    const sourceList = dbProducts.length > 0 ? dbProducts : RENT_PRODUCTS;
    let list = sourceList.filter((p) => {
      const matchQuery = !query || p.title.toLowerCase().includes(query.toLowerCase());
      const matchCat = (() => {
        if (!category || category === 'all') return true;
        const target = category.toLowerCase().trim();
        const pCat = (p.category || '').toLowerCase().trim();
        const pLabel = (p.categoryLabel || '').toLowerCase().trim();

        if (pCat === target || pLabel === target) return true;

        if (target === 'camera' || target === 'cameras') {
          return pCat.includes('camera') || pCat.includes('optic') || pLabel.includes('camera') || pLabel.includes('quang học');
        }
        if (target === 'fashion' || target === 'clothing') {
          return (
            pCat.includes('fashion') ||
            pCat.includes('thoi-trang') ||
            pCat.includes('quan-ao') ||
            pCat.includes('da-hoi') ||
            pLabel.includes('thời trang') ||
            pLabel.includes('quần áo') ||
            pLabel.includes('dạ hội')
          );
        }
        if (target === 'camping' || target === 'outdoor') {
          return (
            pCat.includes('camping') ||
            pCat.includes('outdoor') ||
            pCat.includes('cam-trai') ||
            pCat.includes('da-ngoai') ||
            pLabel.includes('cắm trại') ||
            pLabel.includes('dã ngoại')
          );
        }
        if (target === 'electronics' || target === 'audio') {
          return (
            pCat.includes('electronic') ||
            pCat.includes('audio') ||
            pCat.includes('dien-tu') ||
            pCat.includes('am-thanh') ||
            pLabel.includes('điện tử') ||
            pLabel.includes('âm thanh')
          );
        }
        if (target === 'shoes' || target === 'shoe') {
          return pCat.includes('shoe') || pCat.includes('giay') || pLabel.includes('giày');
        }

        return pCat.includes(target) || target.includes(pCat) || pLabel.includes(target);
      })();
      const matchCond = condition === 'all' || p.condition === condition;
      const matchLoc = location === 'all' || p.location === location;
      let matchPrice = true;
      if (priceRange === 'under200') matchPrice = p.price < 200000;
      else if (priceRange === '200to500') matchPrice = p.price >= 200000 && p.price <= 500000;
      else if (priceRange === 'above500') matchPrice = p.price > 500000;

      let matchSize = true;
      if (selectedSize !== 'all') {
        const pRecord = p as unknown as { size?: string; sizes?: string[] };
        const pSize = pRecord.size;
        const pSizes = pRecord.sizes;
        if (pSize && pSize.toUpperCase() === selectedSize.toUpperCase()) {
          matchSize = true;
        } else if (Array.isArray(pSizes) && pSizes.map((s: string) => s.toUpperCase()).includes(selectedSize.toUpperCase())) {
          matchSize = true;
        } else {
          matchSize = false;
        }
      }

      return matchQuery && matchCat && matchCond && matchLoc && matchPrice && matchSize;
    });
    if (sort === 'price-asc') list = [...list].sort((a, b) => a.price - b.price);
    else if (sort === 'price-desc') list = [...list].sort((a, b) => b.price - a.price);
    else if (sort === 'rating') list = [...list].sort((a, b) => b.rating - a.rating);
    return list;
  }, [dbProducts, query, category, priceRange, condition, location, selectedSize, sort]);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Auto reset to page 1 whenever any filter changes
  const filterKey = `${query}|${category}|${priceRange}|${condition}|${location}|${selectedSize}|${sort}`;
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
  if (prevFilterKey !== filterKey) {
    setPrevFilterKey(filterKey);
    setCurrentPage(1);
  }

  const totalItems = visibleProducts.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));

  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return visibleProducts.slice(start, start + itemsPerPage);
  }, [visibleProducts, currentPage, itemsPerPage]);

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages || page === currentPage) return;
    setCurrentPage(page);
    window.scrollTo({ top: 380, behavior: 'smooth' });
  };

  const getPageNumbers = (current: number, total: number) => {
    if (total <= 5) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }
    if (current <= 3) {
      return [1, 2, 3, 4, '...', total];
    }
    if (current >= total - 2) {
      return [1, '...', total - 3, total - 2, total - 1, total];
    }
    return [1, '...', current - 1, current, current + 1, '...', total];
  };

  const resetAll = () => {
    setCurrentPage(1);
    setQuery('');
    setUserCategory('all');
    setPriceRange('all');
    setCondition('all');
    setLocation('all');
    setSelectedSize('all');
    setSort('recommended');
  };

  const sel =
    'w-full py-2 pl-3 pr-7 bg-[#F4F0EA]/50 rounded-lg text-[#1C1A18] focus:outline-none focus:bg-[#F4F0EA] text-xs font-medium cursor-pointer appearance-none';

  return (
    <div className="flex flex-col w-full min-h-screen bg-[#FBF9F5] text-[#1C1A18] antialiased relative">
      {/* Guest Auth Required Modal */}
      {authModal.open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
          onClick={() => setAuthModal({ open: false, action: '', targetHref: '' })}
        >
          <div
            className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5 text-center relative border border-[#E7E2DA]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setAuthModal({ open: false, action: '', targetHref: '' })}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-[#F4F0EA] text-[#78736A] transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>

            <div className="w-14 h-14 rounded-full bg-[#F4F0EA] flex items-center justify-center text-[#1C1A18] mx-auto shadow-sm">
              <span className="material-symbols-outlined text-[28px]">lock_person</span>
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold text-[#1C1A18]">Yêu cầu Đăng nhập</h3>
              <p className="text-xs text-[#5E5A53] leading-relaxed">
                Bạn đang truy cập ở chế độ công khai (Khách vãng lai). Để <strong>{authModal.action}</strong>, vui lòng đăng nhập hoặc tạo tài khoản thành viên ReUse Hub.
              </p>
            </div>

            <div className="p-3.5 bg-[#F4F0EA]/70 rounded-2xl text-left space-y-1.5 text-xs text-[#5E5A53]">
              <div className="flex items-center gap-2 font-semibold text-[#1C1A18]">
                <span className="material-symbols-outlined text-[16px] text-emerald-700">verified</span>
                Quyền lợi khi đăng nhập:
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-[11px] text-[#78736A]">
                <li>Khởi tạo đơn thuê và ký quỹ minh bạch</li>
                <li>Hưởng chính sách bảo đảm hoàn cọc 100%</li>
                <li>Theo dõi tiến trình vận chuyển và giữ sản phẩm</li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Link
                to={`/login?redirect=${encodeURIComponent(authModal.targetHref)}&message=${encodeURIComponent(
                  `Bạn cần đăng nhập tài khoản để ${authModal.action}!`
                )}`}
                className="flex-1 py-3 px-4 rounded-xl bg-[#1C1A18] text-white text-xs font-bold text-center hover:bg-[#292724] transition-all shadow-sm"
              >
                Đăng nhập ngay
              </Link>
              <Link
                to={`/register?redirect=${encodeURIComponent(authModal.targetHref)}`}
                className="flex-1 py-3 px-4 rounded-xl bg-[#F4F0EA] text-[#1C1A18] text-xs font-bold text-center hover:bg-[#E7E2DA] transition-all"
              >
                Đăng ký tài khoản
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ── EDITORIAL HEADER ── */}
      {/* ── MAIN WORKSPACE CONTAINER WITH PERSISTENT SIDEBAR ── */}
      <div className="max-w-[1520px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 flex gap-8">
        {/* Navigation Sidebar (Fixed on left: GuestSidebar when guest, UserSidebar when logged in) */}
        <AppSidebar activeKey="rent" />

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

          <section className="w-full pt-2 pb-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8">
          <div className="max-w-2xl space-y-3">
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#79716B] mb-2">
              <span>01 · RENT ARCHIVE</span>
              <span className="w-8 h-px bg-[#E7E2DA]" />
              <span className="bg-[#F0ECE1] text-[#1C1A18] px-2 py-0.5 rounded text-[10px] font-semibold">
                ĐÃ THẨM ĐỊNH
              </span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-[#1C1A18] font-bold tracking-tight mb-2">
              Thuê thay vì sở hữu
            </h1>
            <p className="text-xs sm:text-sm text-[#79716B] max-w-xl leading-relaxed">
              Chọn những món đồ bạn cần, sử dụng trong thời gian phù hợp và hoàn trả để
              sản phẩm tiếp tục chu kỳ tuần hoàn. Không áp lực lưu trữ, không lãng phí tài nguyên.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-[#F4F0EA]/60 px-5 py-3.5 rounded-xl self-start md:self-auto shadow-sm">
            <div className="flex flex-col">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#78736A]">Kho đồ trực tuyến</span>
              <span className="font-serif text-2xl font-bold text-[#1C1A18]">148 thiết bị</span>
            </div>
            <div className="h-8 w-px bg-[#E7E2DA]" />
            <div className="flex flex-col">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#78736A]">Tỷ lệ hoàn cọc</span>
              <span className="font-serif text-2xl font-bold text-[#1C1A18]">100%</span>
            </div>
          </div>
        </div>

        <div className="w-full bg-[#F4F0EA]/70 rounded-xl px-5 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#1C1A18]">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[18px]">verified</span>
            <span className="font-medium">100% Sản phẩm được khử trùng &amp; kiểm định kỹ thuật trước khi giao</span>
          </div>
          <div className="flex items-center gap-2 text-[#5E5A53] text-[11px]">
            <span className="material-symbols-outlined text-[16px]">payments</span>
            <span>Hoàn cọc tự động trong vòng 2 giờ sau kiểm định hoàn trả</span>
          </div>
        </div>
      </section>

      {/* ── SEARCH & FILTER ── */}
      <section className="w-full pb-8">
        <div className="bg-white rounded-2xl p-5 shadow-sm space-y-4">

          <div className="relative w-full">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#78736A] text-[22px]">search</span>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm camera, quần áo thiết kế, giày archive, đồ camping..."
              className="w-full pl-12 pr-28 py-3.5 bg-[#F4F0EA]/50 rounded-xl text-sm text-[#1C1A18] placeholder:text-[#78736A] focus:outline-none focus:bg-[#F4F0EA] transition-all"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#F4F0EA] text-[#5E5A53] hover:text-[#1C1A18]"
              >
                Xóa tìm kiếm
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2.5 pt-1 text-xs">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#78736A]">Danh mục</label>
              <div className="relative">
                <select value={category.toLowerCase()} onChange={(e) => setUserCategory(e.target.value)} className={sel}>
                  <option value="all">Tất cả danh mục</option>
                  <option value="camera">Camera &amp; Ống kính</option>
                  <option value="fashion">Thời trang &amp; Dạ hội</option>
                  <option value="camping">Cắm trại &amp; Dã ngoại</option>
                  <option value="electronics">Điện tử &amp; Âm thanh</option>
                  <option value="shoes">Giày dép &amp; Sneakers</option>
                </select>
                <span className="material-symbols-outlined pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[16px] text-[#78736A]">expand_more</span>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#78736A]">Giá / ngày</label>
              <div className="relative">
                <select value={priceRange} onChange={(e) => setPriceRange(e.target.value)} className={sel}>
                  <option value="all">Tất cả mức giá</option>
                  <option value="under200">Dưới 200.000đ</option>
                  <option value="200to500">200.000đ - 500.000đ</option>
                  <option value="above500">Trên 500.000đ</option>
                </select>
                <span className="material-symbols-outlined pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[16px] text-[#78736A]">expand_more</span>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#78736A]">Tình trạng</label>
              <div className="relative">
                <select value={condition} onChange={(e) => setCondition(e.target.value)} className={sel}>
                  <option value="all">Tất cả</option>
                  <option value="Như mới">Như mới (99%)</option>
                  <option value="Rất tốt">Rất tốt (95%)</option>
                  <option value="Tốt">Tốt (90%)</option>
                </select>
                <span className="material-symbols-outlined pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[16px] text-[#78736A]">expand_more</span>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#78736A]">Khu vực</label>
              <div className="relative">
                <select value={location} onChange={(e) => setLocation(e.target.value)} className={sel}>
                  <option value="all">Toàn quốc</option>
                  <option value="Đà Nẵng">Đà Nẵng</option>
                  <option value="TP. Hồ Chí Minh">TP. Hồ Chí Minh</option>
                  <option value="Hà Nội">Hà Nội</option>
                </select>
                <span className="material-symbols-outlined pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[16px] text-[#78736A]">expand_more</span>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#78736A]">Kích cỡ (Size)</label>
              <div className="relative">
                <select value={selectedSize} onChange={(e) => setSelectedSize(e.target.value)} className={sel}>
                  <option value="all">Tất cả size</option>
                  <option value="S">Size S</option>
                  <option value="M">Size M</option>
                  <option value="L">Size L</option>
                  <option value="XL">Size XL</option>
                  <option value="FREE_SIZE">Free Size</option>
                </select>
                <span className="material-symbols-outlined pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[16px] text-[#78736A]">expand_more</span>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#78736A]">Ngày nhận</label>
              <input type="date" className="w-full py-1.5 px-2 bg-[#F4F0EA]/50 rounded-lg text-[#1C1A18] text-xs focus:outline-none focus:bg-[#F4F0EA]" />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#78736A]">Ngày trả</label>
              <input type="date" className="w-full py-1.5 px-2 bg-[#F4F0EA]/50 rounded-lg text-[#1C1A18] text-xs focus:outline-none focus:bg-[#F4F0EA]" />
            </div>
          </div>

          <div className="pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <span className="text-[11px] font-medium text-[#5E5A53]">
              Đang hiển thị {visibleProducts.length} sản phẩm sẵn sàng thuê
            </span>
            <div className="flex items-center flex-wrap gap-1.5">
              <span className="text-[10px] uppercase font-bold text-[#78736A] tracking-wider mr-1">Sắp xếp:</span>
              {RENT_SORT_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setSort(opt.key)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${sort === opt.key
                    ? 'bg-[#1C1A18] text-white'
                    : 'bg-[#F4F0EA] text-[#5E5A53] hover:text-[#1C1A18]'
                    }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── PRODUCT GRID ── */}
      <section className="w-full px-6 lg:px-12 pb-16 max-w-7xl mx-auto">
        {visibleProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {paginatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} onRequireAuth={handleRequireAuth} />
            ))}
          </div>
        ) : (
          <div className="w-full py-16 px-6 text-center bg-white rounded-2xl shadow-sm my-6">
            <div className="w-14 h-14 rounded-full bg-[#F4F0EA] mx-auto flex items-center justify-center text-[#1C1A18] mb-4 shadow-sm">
              <span className="material-symbols-outlined text-[26px]">manage_search</span>
            </div>
            <h3 className="text-xl font-bold text-[#1C1A18]">
              Không có sản phẩm nào phù hợp với bộ lọc hiện tại.
            </h3>
            <p className="text-[#78736A] text-xs mt-1.5 max-w-md mx-auto">
              Hãy thử mở rộng khoảng giá, thay đổi khu vực hoặc chọn lại danh mục để khám phá thêm nhiều đồ lưu trữ khác.
            </p>
            <button
              type="button"
              onClick={resetAll}
              className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#1C1A18] text-white text-xs font-semibold hover:bg-[#292724] transition-colors shadow-sm"
            >
              <span className="material-symbols-outlined text-[16px]">restart_alt</span>
              Xóa bộ lọc
            </button>
          </div>
        )}

        <div className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-[#E8E4DC]/80 text-xs text-[#5E5A53]">
          <div>
            Hiển thị{' '}
            <span className="font-bold text-[#1C1A18]">{totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} – {Math.min(currentPage * itemsPerPage, totalItems)}</span> trong tổng số{' '}
            <span className="font-bold text-[#1C1A18]">{totalItems}</span> món đồ
          </div>
          {totalPages > 1 && (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => handlePageChange(currentPage - 1)}
                className="p-2 rounded-lg border border-[#E8E4DC] bg-white text-[#1C1A18] hover:bg-[#F4F0EA] disabled:opacity-30 disabled:cursor-not-allowed transition-colors shadow-2xs cursor-pointer"
                title="Trang trước"
              >
              <span className="material-symbols-outlined text-[18px]">chevron_left</span>
            </button>
            {getPageNumbers(currentPage, totalPages).map((p, idx) =>
              typeof p === 'number' ? (
                <button
                  key={`page-${p}`}
                  type="button"
                  onClick={() => handlePageChange(p)}
                  className={`w-8 h-8 rounded-lg font-medium transition-all shadow-2xs cursor-pointer ${
                    currentPage === p
                      ? 'bg-[#1C1A18] text-white font-bold'
                      : 'bg-white text-[#1C1A18] hover:bg-[#F4F0EA] border border-[#E8E4DC]'
                  }`}
                >
                  {p}
                </button>
              ) : (
                <span key={`ellipsis-${idx}`} className="px-1 text-[#78736A] font-medium">
                  ...
                </span>
              )
            )}
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => handlePageChange(currentPage + 1)}
              className="p-2 rounded-lg border border-[#E8E4DC] bg-white text-[#1C1A18] hover:bg-[#F4F0EA] disabled:opacity-30 disabled:cursor-not-allowed transition-colors shadow-2xs cursor-pointer"
              title="Trang kế tiếp"
            >
              <span className="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>
          </div>
        )}
      </div>
      </section>

      {/* ── HOW RENT WORKS ── */}
      <section className="w-full bg-[#F4F0EA]/60 rounded-3xl p-6 sm:p-8 mb-8 border border-[#E8E4DC]">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#78736A] font-bold">
                QUY TRÌNH THUÊ BẢO ĐẢM
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#1C1A18] mt-1">
                Đơn giản, minh bạch và hoàn toàn an tâm
              </h2>
            </div>
            <Link to="/how-it-works" className="inline-flex items-center gap-1 text-xs font-semibold text-[#1C1A18] hover:underline">
              Xem chi tiết chính sách hoàn trả
              <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {RENT_HOW_IT_WORKS_STEPS.map((item) => (
              <div key={item.step} className="p-5 bg-white rounded-2xl shadow-sm space-y-3">
                <span className="text-xs font-mono font-bold text-[#78736A]">{item.step}</span>
                <h3 className="font-serif font-bold text-[#1C1A18] text-base">{item.title}</h3>
                <p className="text-xs text-[#5E5A53] leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
        </main>
      </div>

    </div>
  );
};

export default RentMarketplace;
