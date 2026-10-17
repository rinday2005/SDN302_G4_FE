import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { UserSidebar } from '../../../components/layout/UserSidebar';
import {
  CATEGORIES_DATA,
  CATEGORY_FILTER_OPTIONS,
  CATEGORY_METRICS,
} from '../../data/categories/categoriesData';
import type { CategoryFilterKey, CategoryItem } from '../../data/categories/categoriesData';

export const CategoriesMarketplace: React.FC = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<CategoryFilterKey>('all');
  const searchInputRef = useRef<HTMLInputElement>(null);

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

  // Scroll to top on initial mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

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

  // Filter and search logic
  const filteredCategories = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return CATEGORIES_DATA.filter((cat: CategoryItem) => {
      // 1. Tag filter
      const matchesFilter =
        activeFilter === 'all' || cat.tags.includes(activeFilter);

      // 2. Search query matching title, description, or subtitle
      const matchesSearch =
        !q ||
        cat.title.toLowerCase().includes(q) ||
        cat.description.toLowerCase().includes(q) ||
        cat.subtitle.toLowerCase().includes(q) ||
        cat.code.toLowerCase().includes(q);

      return matchesFilter && matchesSearch;
    });
  }, [searchQuery, activeFilter]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setActiveFilter('all');
    searchInputRef.current?.focus();
  };

  return (
    <div className="w-full min-h-screen bg-[#FBF9F5] text-[#1C1A18] antialiased">
      {/* ── MAIN WORKSPACE CONTAINER WITH PERSISTENT SIDEBAR ── */}
      <div className="max-w-[1520px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 flex gap-8">
        {/* User Navigation Sidebar (Fixed on left) */}
        <UserSidebar activeKey="categories" />

        {/* ── MAIN CONTENT AREA ── */}
        <main className="flex-1 min-w-0 space-y-12">
          {/* Quick inline restore chip if user clicked 3-bar button to hide sidebar */}
          {isSidebarCollapsed && user?.role !== 'ADMIN' && (
            <div className="flex items-center gap-2 -mb-6 animate-fade-in">
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
        {/* ── 1. EDITORIAL TOP DISCOVERY HEADER ── */}
        <section data-reveal className="space-y-4 max-w-4xl pt-2">
          <div className="flex items-center gap-2.5">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#B45309]" />
            <span className="text-[11px] font-bold tracking-[0.25em] text-[#79716B] uppercase">
              KHÁM PHÁ · BỘ SƯU TẬP TUẦN HOÀN
            </span>
          </div>

          <div className="flex flex-col md:flex-row md:items-baseline md:justify-between gap-4">
            <h1 className="text-3xl sm:text-4xl text-[#1C1A18] font-bold tracking-tight mb-2 ">
              Bạn đang tìm gì?
            </h1>
            <span className="text-xs font-mono text-[#79716B] tracking-wider uppercase bg-[#F0ECE1] px-3 py-1 rounded-full border border-[#E6E2DC]">
              INDEX / 07 DANH MỤC LƯU TRỮ
            </span>
          </div>

          <p className="text-sm md:text-base text-[#79716B] font-normal leading-relaxed max-w-2xl pt-1">
            Tìm sản phẩm theo nhu cầu và cách bạn muốn sử dụng — từ thuê ngắn hạn tiện lợi đến sở hữu những món đồ lưu trữ vượt thời gian.
          </p>
        </section>

        {/* ── 2. SEARCH BAR & TAXONOMY FILTERS ── */}
        <section data-reveal className="space-y-4">
          {/* Elevated Minimalist Search Bar */}
          <div className="relative max-w-2xl">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#79716B]">
              <span className="material-symbols-outlined text-[20px]">search</span>
            </div>
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm danh mục, phong cách hoặc thiết bị..."
              className="w-full bg-[#F7F5F0] rounded-xl pl-11 pr-24 py-3.5 text-xs md:text-sm text-[#1C1A18] placeholder-[#79716B] shadow-xs border border-[#E6E2DC] focus:outline-none focus:bg-white focus:border-[#1C1A18] transition-all"
            />
            <div className="absolute inset-y-0 right-3 flex items-center gap-1.5">
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="text-[#79716B] hover:text-[#1C1A18] p-1 rounded-md transition-colors"
                  title="Xoá tìm kiếm"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              )}
              <span className="text-[10px] font-mono tracking-widest text-[#79716B] bg-[#E6E2DC] px-2 py-1 rounded select-none">
                ⌘K
              </span>
            </div>
          </div>

          {/* Quick Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
            {CATEGORY_FILTER_OPTIONS.map((pill) => {
              const isActive = activeFilter === pill.key;
              return (
                <button
                  key={pill.key}
                  type="button"
                  onClick={() => setActiveFilter(pill.key)}
                  className={`filter-pill whitespace-nowrap px-4 py-2 rounded-full font-medium transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#1C1A18] text-[#FBF9F5] shadow-sm font-semibold'
                      : 'bg-[#F0ECE1] text-[#79716B] hover:text-[#1C1A18] hover:bg-[#E6E2DC]'
                  }`}
                >
                  {pill.label}
                </button>
              );
            })}
          </div>
        </section>

        {/* ── 3. ASYMMETRIC BENTO CATEGORY GRID ── */}
        <section data-reveal className="space-y-6">
          <div className="flex items-center justify-between text-xs text-[#79716B] pb-2 border-b border-[#E6E2DC]">
            <span className="tracking-widest uppercase font-mono font-medium">
              LƯU TRỮ CHỦ ĐỀ HIỆN CÓ ({filteredCategories.length}/{CATEGORIES_DATA.length})
            </span>
            <span className="hidden sm:inline-block">Định dạng hiển thị: Tạp chí tuyển tập</span>
          </div>

          {/* Bento Grid Container */}
          {filteredCategories.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6">
              {filteredCategories.map((category) => (
                <article
                  key={category.id}
                  data-reveal
                  className={`category-item ${category.spanClass} group flex flex-col justify-between bg-[#F7F5F0] rounded-2xl overflow-hidden shadow-xs hover:shadow-xl border border-[#E6E2DC]/80 transition-all duration-300`}
                >
                  {/* Card Media Header */}
                  <div className="relative w-full h-64 sm:h-72 overflow-hidden bg-[#E6E2DC]">
                    <Link to={category.href} className="block w-full h-full">
                      <img
                        src={category.image}
                        alt={category.alt}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                      />
                    </Link>

                    {/* Top Action Badges */}
                    <div className="absolute top-4 left-4 flex flex-wrap gap-2 z-10 pointer-events-auto">
                      {category.isThriftOnly ? (
                        <>
                          <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full bg-[#B45309] text-white shadow-xs">
                            Thuần THRIFT
                          </span>
                          <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full bg-[#FBF9F5]/90 text-[#1C1A18] backdrop-blur-md border border-[#E6E2DC]">
                            {category.thriftCustomBadge || `${category.thriftCount} Ấn bản`}
                          </span>
                        </>
                      ) : (
                        <>
                          <Link
                            to={`/rent?category=${encodeURIComponent(category.categoryQuery)}`}
                            className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full bg-[#1C1A18]/80 hover:bg-[#1C1A18] text-white backdrop-blur-md transition-colors"
                            title={`Xem ${category.rentCount} sản phẩm RENT thuộc ${category.title}`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {category.rentCount} RENT
                          </Link>
                          <Link
                            to={`/thrift?category=${encodeURIComponent(category.categoryQuery)}`}
                            className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full bg-[#FBF9F5]/90 hover:bg-white text-[#1C1A18] backdrop-blur-md border border-[#E6E2DC] transition-colors"
                            title={`Xem ${category.thriftCount} sản phẩm THRIFT thuộc ${category.title}`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {category.thriftCount} THRIFT
                          </Link>
                        </>
                      )}
                    </div>

                    {/* Monospace Code Badge */}
                    <span className="absolute bottom-3 right-4 font-mono text-[11px] text-white/90 bg-black/50 px-2 py-0.5 rounded backdrop-blur-xs select-none pointer-events-none">
                      {category.code}
                    </span>
                  </div>

                  {/* Card Content Body */}
                  <div className="p-6 sm:p-7 flex flex-col flex-1 justify-between bg-[#F7F5F0]">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h2 className="font-serif text-2xl text-[#1C1A18] font-semibold group-hover:text-[#B45309] transition-colors">
                          <Link to={category.href}>{category.title}</Link>
                        </h2>
                      </div>
                      <p className="text-xs sm:text-sm text-[#79716B] leading-relaxed line-clamp-2 sm:line-clamp-none">
                        {category.description}
                      </p>
                    </div>

                    <div className="pt-6 flex items-center justify-between mt-auto border-t border-[#E6E2DC]/60">
                      <span className="text-[11px] text-[#79716B] font-mono">
                        {category.subtitle}
                      </span>
                      <Link
                        to={category.href}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1C1A18] group-hover:translate-x-1 transition-transform"
                      >
                        <span>Khám phá danh mục</span>
                        <span className="text-sm">→</span>
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            /* Empty State */
            <div className="bg-[#F7F5F0] rounded-2xl p-12 text-center border border-[#E6E2DC] space-y-4">
              <div className="w-12 h-12 rounded-full bg-[#F0ECE1] flex items-center justify-center mx-auto text-[#79716B]">
                <span className="material-symbols-outlined text-[24px]">search_off</span>
              </div>
              <h3 className="font-serif text-xl font-bold text-[#1C1A18]">
                Không tìm thấy danh mục phù hợp
              </h3>
              <p className="text-xs text-[#79716B] max-w-md mx-auto">
                Không có danh mục nào khớp với từ khóa "{searchQuery}" hoặc bộ lọc được chọn.
              </p>
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-4 py-2 rounded-xl bg-[#1C1A18] text-white text-xs font-semibold hover:bg-black transition-colors cursor-pointer"
              >
                Đặt lại bộ lọc
              </button>
            </div>
          )}
        </section>

        {/* ── 4. CIRCULAR METRIC BAR STRIP ── */}
        <section data-reveal className="py-2">
          <div className="bg-[#F0ECE1] rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xs border border-[#E6E2DC]">
            <div className="space-y-1 text-center md:text-left">
              <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#79716B]">
                TIÊU CHUẨN THẨM ĐỊNH
              </span>
              <h3 className="font-serif text-xl md:text-2xl text-[#1C1A18] font-semibold">
                Tất cả sản phẩm đều được bảo hộ minh bạch
              </h3>
            </div>
            <div className="grid grid-cols-3 gap-6 sm:gap-10 text-center">
              {CATEGORY_METRICS.map((metric, i) => (
                <div key={i}>
                  <span className="block font-serif text-2xl md:text-3xl font-bold text-[#1C1A18]">
                    {metric.value}
                  </span>
                  <span className="text-[11px] text-[#79716B] font-medium">
                    {metric.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── 5. FEATURED SECTION: CHỌN CÁCH BẠN MUỐN REUSE ── */}
        <section data-reveal className="space-y-6 pb-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 border-b border-[#E6E2DC] pb-4">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-[#79716B]">
                PHƯƠNG THỨC TIẾP CẬN
              </span>
              <h2 className="font-serif text-3xl md:text-4xl text-[#1C1A18] font-normal tracking-tight mt-1">
                Chọn cách bạn muốn ReUse
              </h2>
            </div>
            <p className="text-xs text-[#79716B] max-w-sm leading-relaxed">
              Chúng tôi xây dựng hệ tuần hoàn để bạn tận hưởng giá trị công năng mà không phải tích trữ dư thừa.
            </p>
          </div>

          {/* Dual Editorial Banner Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {/* Card 1: RENT */}
            <div
              data-reveal
              className="relative bg-[#1C1A18] text-white rounded-2xl p-8 md:p-10 flex flex-col justify-between overflow-hidden shadow-xl group border border-[#1C1A18]"
            >
              {/* Subtle Circular Background Aura */}
              <div className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full bg-white/5 pointer-events-none blur-3xl" />
              <div className="absolute top-6 right-6">
                <span className="material-symbols-outlined text-[36px] text-white/20 group-hover:text-white/40 transition-colors">
                  cached
                </span>
              </div>

              <div className="space-y-4 relative z-10">
                <span className="inline-block text-[10px] font-mono uppercase tracking-[0.2em] px-3 py-1 rounded bg-white/10 text-white/80">
                  DỊCH VỤ THUÊ LINH HOẠT
                </span>
                <h3 className="font-serif text-2xl md:text-3xl text-white font-normal leading-snug">
                  Thuê những gì bạn cần mà không cần sở hữu
                </h3>
                <p className="text-xs sm:text-sm text-stone-300 leading-relaxed font-light">
                  Trải nghiệm thiết bị máy ảnh cao cấp, trang phục sự kiện hay lều trại dã ngoại trong thời gian mong muốn với tiền cọc bảo chứng minh bạch và hoàn trả nhanh chóng.
                </p>
              </div>

              <div className="pt-8 relative z-10 flex items-center justify-between">
                <span className="text-[11px] text-stone-400 font-mono">
                  Thủ tục duyệt online trong 15p
                </span>
                <Link
                  to="/rent"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white text-[#1C1A18] hover:bg-stone-200 transition-colors font-medium text-xs tracking-wide shadow-md"
                >
                  <span>Khám phá RENT</span>
                  <span>→</span>
                </Link>
              </div>
            </div>

            {/* Card 2: THRIFT */}
            <div
              data-reveal
              className="relative bg-[#F4F0EA] rounded-2xl p-8 md:p-10 flex flex-col justify-between overflow-hidden shadow-md group border border-[#E6E2DC]"
            >
              {/* Subtle Ambient Aura */}
              <div className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full bg-[#B45309]/5 pointer-events-none blur-3xl" />
              <div className="absolute top-6 right-6">
                <span className="material-symbols-outlined text-[36px] text-[#79716B]/30 group-hover:text-[#1C1A18]/50 transition-colors">
                  shopping_bag
                </span>
              </div>

              <div className="space-y-4 relative z-10">
                <span className="inline-block text-[10px] font-mono uppercase tracking-[0.2em] px-3 py-1 rounded bg-[#E6E2DC] text-[#1C1A18] font-medium">
                  MUA SẮM TUẦN HOÀN BẢO CHỨNG
                </span>
                <h3 className="font-serif text-2xl md:text-3xl text-[#1C1A18] font-normal leading-snug">
                  Mua những sản phẩm đã qua sử dụng và cho chúng thêm một vòng đời
                </h3>
                <p className="text-xs sm:text-sm text-[#79716B] leading-relaxed">
                  Sở hữu vĩnh viễn các sản phẩm đã qua kiểm định cơ học 100%, bảo hành đổi trả 72h và có nguồn gốc minh bạch từ kho lưu trữ ReUse Hub.
                </p>
              </div>

              <div className="pt-8 relative z-10 flex items-center justify-between">
                <span className="text-[11px] text-[#79716B] font-mono">
                  Kiểm định chất lượng 5 bước
                </span>
                <Link
                  to="/thrift"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#1C1A18] text-white hover:bg-stone-800 transition-colors font-medium text-xs tracking-wide shadow-sm"
                >
                  <span>Mua đồ THRIFT</span>
                  <span>→</span>
                </Link>
              </div>
            </div>
          </div>
        </section>
        </main>
      </div>
    </div>
  );
};

export default CategoriesMarketplace;
