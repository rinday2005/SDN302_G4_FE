import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCartWishlist } from '../../context/CartWishlistContext';
import { UserSidebar } from '../../components/layout/UserSidebar';
import { resolveWishlistProduct, type ResolvedWishlistProduct } from '../../services/wishlistProductResolver';

export const Wishlist: React.FC = () => {
  const { wishlist, removeFromWishlist, clearWishlist, addToCart } = useCartWishlist();

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

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

  // Tabs: 'ALL' | 'RENT' | 'THRIFT'
  const [activeTab, setActiveTab] = useState<'ALL' | 'RENT' | 'THRIFT'>('ALL');
  // Sort: 'latest' | 'available' | 'price-asc' | 'price-desc'
  const [sortOption, setSortOption] = useState<string>('latest');
  // Temporary toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // ── Resolve genuine products from wishlist IDs (NO mock fake data) ──
  const resolvedItems = useMemo(() => {
    if (!wishlist || wishlist.length === 0) return [];
    const list: ResolvedWishlistProduct[] = [];
    const seen = new Set<string>();

    wishlist.forEach((id) => {
      if (!id || seen.has(id)) return;
      seen.add(id);
      const prod = resolveWishlistProduct(id);
      if (prod) {
        list.push(prod);
      }
    });

    return list;
  }, [wishlist]);

  const rentCount = useMemo(() => resolvedItems.filter((i) => i.mode === 'rent').length, [resolvedItems]);
  const thriftCount = useMemo(() => resolvedItems.filter((i) => i.mode === 'thrift').length, [resolvedItems]);

  // ── Filter & Sort items ──
  const displayedItems = useMemo(() => {
    let items = [...resolvedItems];

    if (activeTab === 'RENT') {
      items = items.filter((i) => i.mode === 'rent');
    } else if (activeTab === 'THRIFT') {
      items = items.filter((i) => i.mode === 'thrift');
    }

    if (sortOption === 'price-asc') {
      items.sort((a, b) => a.price - b.price);
    } else if (sortOption === 'price-desc') {
      items.sort((a, b) => b.price - a.price);
    } else if (sortOption === 'available') {
      items.sort((a, b) => (b.available ? 1 : 0) - (a.available ? 1 : 0));
    }

    return items;
  }, [resolvedItems, activeTab, sortOption]);

  const formatVND = (num: number) => num.toLocaleString('vi-VN') + '₫';

  const handleAddToCart = (item: ResolvedWishlistProduct) => {
    addToCart({
      id: item.id,
      title: item.title,
      price: item.price,
      image: item.image,
      mode: item.mode,
      deposit: item.deposit,
      categoryLabel: item.category,
      gradeBadge: item.gradeBadge,
      quantity: 1,
    });
    setToastMessage(`Đã thêm "${item.title}" vào giỏ hàng tuần hoàn!`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleRemove = (id: string, title: string) => {
    removeFromWishlist(id);
    setToastMessage(`Đã xóa "${title}" khỏi mục yêu thích.`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleClearAll = () => {
    if (window.confirm('Bạn có chắc muốn xóa tất cả sản phẩm khỏi danh sách yêu thích?')) {
      clearWishlist();
      setToastMessage('Đã làm trống toàn bộ danh sách yêu thích.');
      setTimeout(() => setToastMessage(null), 3000);
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#FBF9F5] text-[#1C1A18] antialiased">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1C1A18] text-white px-5 py-3 rounded-xl shadow-lg border border-white/20 flex items-center gap-3 animate-fade-in text-xs font-semibold">
          <span className="material-symbols-outlined text-[#3A6843] text-[20px]">check_circle</span>
          <span>{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="ml-2 text-stone-400 hover:text-white cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* ── MAIN WORKSPACE CONTAINER WITH PERSISTENT SIDEBAR ── */}
      <div className="max-w-[1520px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 flex gap-8 items-start">
        {/* User Navigation Sidebar */}
        <UserSidebar activeKey="wishlist" />

        {/* ── MAIN CONTENT AREA ── */}
        <main className="flex-1 min-w-0 space-y-8">
          <div className="flex flex-col w-full">
            {/* Quick inline restore chip if user clicked 3-bar button to hide sidebar */}
            {isSidebarCollapsed && (
              <div className="flex items-center gap-2 mb-4 animate-fade-in">
                <button
                  type="button"
                  onClick={() => window.dispatchEvent(new CustomEvent('reuse_user_sidebar_toggle', { detail: false }))}
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white border border-[#E8E4DC] text-xs font-semibold text-[#1C1A18] hover:bg-[#F6F3EE] hover:border-[#1C1A18]/40 transition-all shadow-2xs cursor-pointer group"
                  title="Hiện menu điều hướng"
                >
                  <span className="material-symbols-outlined text-[18px] text-[#3A6843] group-hover:scale-110 transition-transform">
                    menu
                  </span>
                  <span>Hiện menu điều hướng</span>
                </button>
              </div>
            )}

            {/* 1. TOP BREADCRUMB & EDITORIAL HEADER */}
            <section className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Link
                  to="/"
                  className="font-mono text-[11px] uppercase tracking-wider text-[#76726B] hover:text-[#1C1A18] transition-colors"
                >
                  Trang chủ
                </Link>
                <span className="text-[#CCC5BC] text-xs">/</span>
                <Link
                  to="/user/dashboard"
                  className="font-mono text-[11px] uppercase tracking-wider text-[#76726B] hover:text-[#1C1A18] transition-colors"
                >
                  Tài khoản
                </Link>
                <span className="text-[#CCC5BC] text-xs">/</span>
                <span className="font-mono text-[11px] uppercase tracking-wider text-[#3A6843] font-semibold">
                  Danh sách yêu thích
                </span>
              </div>

              <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-[#E8E4DC]">
                <div className="max-w-2xl">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-[#E8E4DC] rounded-full mb-3 shadow-2xs">
                    <span className="w-2 h-2 rounded-full bg-[#3A6843]" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#76726B]">
                      BỘ SƯU TẬP QUAN TÂM · LƯU TRỮ TUẦN HOÀN
                    </span>
                  </div>
                  <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#1C1A18] mb-2 tracking-tight">
                    Danh sách yêu thích
                  </h1>
                  <p className="text-xs sm:text-sm text-[#76726B] leading-relaxed">
                    Theo dõi tình trạng sẵn sàng của thiết bị thuê cao cấp hoặc các món đồ archival THRIFT độc bản trước khi quyết định đồng hành cùng vòng đời sản phẩm.
                  </p>
                </div>

                {/* Quick Metrics */}
                <div className="flex items-center gap-3 bg-[#F5F3F0] p-2 rounded-2xl border border-[#E8E4DC]/60 shrink-0">
                  <div className="px-3.5 py-2 rounded-xl bg-white shadow-2xs border border-[#E8E4DC]/60 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#B9ECBD]/40 text-[#3A6843] flex items-center justify-center">
                      <span className="material-symbols-outlined text-[18px]">favorite</span>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold tracking-wider text-[#76726B]">Đang lưu</p>
                      <p className="text-xs text-[#1C1A18] font-bold">{resolvedItems.length} sản phẩm</p>
                    </div>
                  </div>

                  <div className="px-3.5 py-2 rounded-xl bg-white shadow-2xs border border-[#E8E4DC]/60 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#EFEEEB] text-[#1C1A18] flex items-center justify-center">
                      <span className="material-symbols-outlined text-[18px]">verified_user</span>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase font-bold tracking-wider text-[#76726B]">Kiểm định</p>
                      <p className="text-xs text-[#1C1A18] font-bold">100% Bench Lab</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* 2. CONTROLS: TABS, SORT & CLEAR ALL */}
            <section className="mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                {/* Tabs Switcher */}
                <div className="inline-flex p-1 bg-[#F5F3F0] border border-[#E8E4DC]/80 rounded-xl" role="tablist">
                  <button
                    type="button"
                    onClick={() => setActiveTab('ALL')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer ${
                      activeTab === 'ALL'
                        ? 'bg-white text-[#1C1A18] shadow-xs'
                        : 'text-[#76726B] hover:text-[#1C1A18]'
                    }`}
                  >
                    <span>Tất cả</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#EBE7DF] text-[#4A463F] font-mono">
                      {resolvedItems.length}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('RENT')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer ${
                      activeTab === 'RENT'
                        ? 'bg-white text-[#1C1A18] shadow-xs'
                        : 'text-[#76726B] hover:text-[#1C1A18]'
                    }`}
                  >
                    <span>Đồ thuê (RENT)</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#EBE7DF] text-[#4A463F] font-mono">
                      {rentCount}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('THRIFT')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer ${
                      activeTab === 'THRIFT'
                        ? 'bg-white text-[#1C1A18] shadow-xs'
                        : 'text-[#76726B] hover:text-[#1C1A18]'
                    }`}
                  >
                    <span>Mua thanh lý (THRIFT)</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#EBE7DF] text-[#4A463F] font-mono">
                      {thriftCount}
                    </span>
                  </button>
                </div>

                {/* Right controls: Sort & Clear All */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-[#E8E4DC] shadow-2xs">
                    <span className="material-symbols-outlined text-[#76726B] text-[16px]">sort</span>
                    <select
                      value={sortOption}
                      onChange={(e) => setSortOption(e.target.value)}
                      className="bg-transparent text-xs font-semibold text-[#1C1A18] focus:outline-none cursor-pointer"
                    >
                      <option value="latest">Mới thêm gần đây</option>
                      <option value="available">Ưu tiên còn hàng</option>
                      <option value="price-asc">Giá: Thấp đến cao</option>
                      <option value="price-desc">Giá: Cao đến thấp</option>
                    </select>
                  </div>

                  {resolvedItems.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearAll}
                      className="text-xs text-[#76726B] hover:text-rose-600 transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#E8E4DC] hover:border-rose-200 shadow-2xs cursor-pointer font-medium"
                      title="Xóa tất cả sản phẩm khỏi yêu thích"
                    >
                      <span className="material-symbols-outlined text-[16px]">delete_sweep</span>
                      <span>Xóa tất cả</span>
                    </button>
                  )}
                </div>
              </div>
            </section>

            {/* 3. PRODUCT LIST VIEW (DẠNG LIST NHƯ CART) */}
            {displayedItems.length > 0 ? (
              <div className="flex flex-col gap-4">
                {displayedItems.map((item) => {
                  const isRent = item.mode === 'rent';

                  return (
                    <article
                      key={item.id}
                      className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 p-5 rounded-2xl bg-white hover:bg-[#FAF8F5] transition-all border border-[#E8E4DC]/80 shadow-2xs group"
                    >
                      {/* Left: Product Thumbnail */}
                      <div className="flex items-center gap-4 w-full sm:w-auto">
                        <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-xl overflow-hidden shrink-0 bg-[#EBE8E1] border border-[#E8E4DC]">
                          <img
                            src={item.image}
                            alt={item.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                          {/* Mode Badge Tag */}
                          <div className="absolute top-2 left-2">
                            {isRent ? (
                              <span className="px-2 py-0.5 rounded-md bg-[#1C1A18]/90 backdrop-blur-xs text-white text-[9px] font-bold uppercase tracking-wider">
                                RENT
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-md bg-[#3A6843]/90 backdrop-blur-xs text-white text-[9px] font-bold uppercase tracking-wider">
                                THRIFT
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Center / Body Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#3A6843] bg-[#EBF3ED] px-2 py-0.5 rounded">
                              {item.categoryLabel || item.category}
                            </span>
                            <span className="text-[10px] font-semibold px-2 py-0.5 bg-[#EFEEEB] text-[#4A463F] rounded">
                              {item.gradeBadge}
                            </span>
                            <span className="text-[10px] text-[#76726B] flex items-center gap-1">
                              <span className="material-symbols-outlined text-[13px]">location_on</span>
                              {item.location}
                            </span>
                          </div>

                          <h3 className="font-serif text-base sm:text-lg font-bold text-[#1C1A18] mb-1.5 leading-snug group-hover:text-[#3A6843] transition-colors line-clamp-1">
                            <Link to={item.href}>{item.title}</Link>
                          </h3>

                          <p className="text-xs text-[#76726B] line-clamp-2 mb-2 max-w-xl">
                            {item.description}
                          </p>

                          {/* Price Display */}
                          <div className="flex items-center gap-4 flex-wrap text-xs">
                            {isRent ? (
                              <>
                                <div className="flex items-baseline gap-1">
                                  <span className="text-[11px] text-[#76726B]">Giá thuê:</span>
                                  <span className="font-serif text-base font-bold text-[#1C1A18]">
                                    {formatVND(item.price)}
                                  </span>
                                  <span className="text-[10px] text-[#76726B]">/ngày</span>
                                </div>
                                <div className="flex items-center gap-1 text-[11px] text-[#5E6D5B] bg-[#F5F8F5] px-2 py-0.5 rounded border border-[#E0E8E1]">
                                  <span className="material-symbols-outlined text-[14px]">lock</span>
                                  <span>Cọc Escrow: {formatVND(item.deposit)}</span>
                                </div>
                              </>
                            ) : (
                              <div className="flex items-baseline gap-1.5">
                                <span className="text-[11px] text-[#76726B]">Giá bán:</span>
                                <span className="font-serif text-base font-bold text-[#1C1A18]">
                                  {formatVND(item.price)}
                                </span>
                                <span className="text-[10px] text-[#3A6843] font-semibold bg-[#EBF3ED] px-2 py-0.5 rounded">
                                  Độc bản 1-of-1
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Actions Column (Thuê ngay / Thêm giỏ / Xóa khỏi yêu thích) */}
                      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2.5 w-full sm:w-auto shrink-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-[#E8E4DC]/60">
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          <Link
                            to={item.href}
                            className={`px-4 py-2 rounded-xl text-xs font-semibold text-center transition-all flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer ${
                              isRent
                                ? 'bg-[#1C1A18] text-white hover:bg-black'
                                : 'bg-[#3A6843] text-white hover:bg-[#2F5436]'
                            }`}
                          >
                            <span>{isRent ? 'Thuê ngay' : 'Mua ngay'}</span>
                            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                          </Link>

                          <button
                            type="button"
                            onClick={() => handleAddToCart(item)}
                            className="p-2 bg-[#F5F3F0] hover:bg-[#EAE8E5] text-[#1C1A18] rounded-xl transition-colors flex items-center justify-center border border-[#E8E4DC] cursor-pointer"
                            title="Thêm vào giỏ hàng"
                            aria-label="Thêm vào giỏ hàng"
                          >
                            <span className="material-symbols-outlined text-[18px]">shopping_bag</span>
                          </button>
                        </div>

                        {/* Dedicated Remove Button */}
                        <button
                          type="button"
                          onClick={() => handleRemove(item.id, item.title)}
                          className="text-xs text-[#76726B] hover:text-rose-600 transition-colors flex items-center gap-1 px-2.5 py-1.5 rounded-lg hover:bg-rose-50 cursor-pointer font-medium"
                          title="Xóa khỏi mục yêu thích"
                        >
                          <span className="material-symbols-outlined text-[16px] text-rose-500">delete</span>
                          <span>Xóa khỏi yêu thích</span>
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              /* 4. ELEGANT EMPTY STATE PREVIEW (NO FAKE DATA) */
              <section className="my-6">
                <div className="bg-white rounded-3xl p-10 sm:p-14 text-center max-w-2xl mx-auto shadow-2xs border border-[#E8E4DC]">
                  {/* Minimalist Editorial SVG Illustration */}
                  <div className="w-20 h-20 mx-auto mb-5 rounded-full bg-[#F5F3F0] flex items-center justify-center text-[#76726B]/50">
                    <svg className="w-10 h-10 stroke-current fill-none" strokeWidth="1.5" viewBox="0 0 48 48">
                      <path
                        d="M24 39.5l-2.18-1.98C14.08 30.5 9 25.88 9 20.12 9 15.42 12.7 11.72 17.4 11.72c2.66 0 5.21 1.24 6.6 3.19 1.39-1.95 3.94-3.19 6.6-3.19C35.3 11.72 39 15.42 39 20.12c0 5.76-5.08 10.38-12.82 17.42L24 39.5z"
                        strokeDasharray="2 3"
                      />
                      <circle cx="24" cy="24" fill="currentColor" opacity="0.4" r="3" />
                    </svg>
                  </div>

                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#F5F3F0] rounded-full mb-3 border border-[#E8E4DC]">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#76726B]">
                      LƯU TRỮ ĐANG TRỐNG
                    </span>
                  </div>

                  <h2 className="font-serif text-2xl font-bold text-[#1C1A18] mb-2 tracking-tight">
                    {activeTab === 'RENT'
                      ? 'Chưa có thiết bị RENT nào trong yêu thích'
                      : activeTab === 'THRIFT'
                      ? 'Chưa có món đồ THRIFT nào trong yêu thích'
                      : 'Danh sách yêu thích của bạn đang trống'}
                  </h2>

                  <p className="text-xs sm:text-sm text-[#76726B] max-w-md mx-auto mb-7 leading-relaxed">
                    Bạn chưa lưu sản phẩm nào vào danh mục theo dõi. Hãy khám phá kho thiết bị công nghệ cao để thuê theo dịp, hoặc săn tìm các món đồ thời trang archival độc bản trường tồn cùng thời gian.
                  </p>

                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                    <Link
                      to="/rent"
                      className="w-full sm:w-auto px-5 py-2.5 bg-[#1C1A18] text-white text-xs font-semibold rounded-xl hover:bg-black transition-all flex items-center justify-center gap-2 shadow-2xs"
                    >
                      <span className="material-symbols-outlined text-[17px]">autorenew</span>
                      <span>Khám phá đồ RENT</span>
                    </Link>

                    <Link
                      to="/thrift"
                      className="w-full sm:w-auto px-5 py-2.5 bg-[#F5F3F0] text-[#1C1A18] text-xs font-semibold rounded-xl hover:bg-[#EAE8E5] border border-[#E8E4DC] transition-all flex items-center justify-center gap-2"
                    >
                      <span className="material-symbols-outlined text-[17px]">archive</span>
                      <span>Săn đồ độc bản THRIFT</span>
                    </Link>
                  </div>

                  {/* Recommendation Micro-bar */}
                  <div className="mt-10 pt-6 border-t border-[#E8E4DC]/70 flex flex-wrap items-center justify-center gap-4 text-[#76726B] text-[10px] uppercase font-bold tracking-wider">
                    <span className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[#3A6843] text-[15px]">verified</span>
                      Kiểm định 100% trước xuất kho
                    </span>
                    <span className="w-1 h-1 rounded-full bg-[#CCC5BC]" />
                    <span className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[#3A6843] text-[15px]">shield</span>
                      Bảo chứng ký quỹ minh bạch
                    </span>
                    <span className="w-1 h-1 rounded-full bg-[#CCC5BC]" />
                    <span className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[#3A6843] text-[15px]">eco</span>
                      Giảm thiểu 100% rác thải điện tử
                    </span>
                  </div>
                </div>
              </section>
            )}

            {/* 5. EDITORIAL CIRCULARITY FOOTER BANNER */}
            <section className="mt-12 bg-white border border-[#E8E4DC] rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-2xs">
              <div className="max-w-xl space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#3A6843]" />
                  <span className="text-[10px] uppercase font-bold tracking-wider text-[#3A6843]">
                    Quyền lợi thành viên Tuần Hoàn
                  </span>
                </div>
                <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#1C1A18] tracking-tight">
                  Cần giữ lịch thiết bị cho dự án sáng tạo sắp tới?
                </h3>
                <p className="text-xs text-[#76726B] leading-relaxed">
                  Các sản phẩm trong Wishlist sẽ gửi thông báo ưu tiên 24 giờ trước khi có sẵn lịch trống hoặc trước khi mở bán các đợt Ex-Rental với mức giá tuần hoàn ưu đãi.
                </p>
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto shrink-0">
                <Link
                  to="/rent"
                  className="w-full md:w-auto px-5 py-2.5 bg-[#3A6843] text-white text-xs font-semibold rounded-xl text-center hover:bg-[#2F5436] transition-all whitespace-nowrap shadow-2xs"
                >
                  Khám phá thêm thiết bị
                </Link>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Wishlist;
