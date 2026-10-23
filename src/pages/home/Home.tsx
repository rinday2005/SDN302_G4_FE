import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { AppSidebar } from '../../components/layout/AppSidebar';

export const Home: React.FC = () => {
  const { user } = useAuth();
  const wishlistTarget = user ? '/wishlist' : '/login';
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

  return (
    <div className="w-full min-h-screen bg-[#FBF9F5] text-[#1C1A18] antialiased selection:bg-[#1C1A18] selection:text-[#FBF9F5] home-container">
      {/* NHÚNG TRỰC TIẾP FONT VÀ CSS VÀO COMPONENT */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,600&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap');

        .home-container {
          font-family: 'Plus Jakarta Sans', system-ui, sans-serif !important;
        }

        .home-container .font-serif,
        .home-container h1,
        .home-container h2 {
          font-family: 'Playfair Display', Georgia, serif !important;
        }

        .home-container .material-symbols-outlined {
          font-family: 'Material Symbols Outlined' !important;
          font-weight: normal;
          font-style: normal;
          display: inline-block;
          line-height: 1;
          text-transform: none;
          letter-spacing: normal;
          word-wrap: normal;
          white-space: nowrap;
          direction: ltr;
          -webkit-font-smoothing: antialiased;
        }
      `}</style>

      {/* MAIN CONTAINER */}
      {/* ── MAIN WORKSPACE CONTAINER WITH PERSISTENT SIDEBAR ── */}
      <div className="max-w-[1520px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 flex gap-8">
        {/* Navigation Sidebar (Fixed on left: GuestSidebar when guest, UserSidebar when logged in) */}
        <AppSidebar activeKey="home" />

        {/* ── MAIN CONTENT AREA ── */}
        <main className="flex-1 min-w-0 space-y-8">
          {/* Quick inline restore chip if user clicked collapse button to hide sidebar */}
          {isSidebarCollapsed && (
            <div className="flex items-center gap-2 -mb-4 animate-fade-in">
              <button
                type="button"
                onClick={() => window.dispatchEvent(new CustomEvent('reuse_user_sidebar_toggle', { detail: false }))}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white border border-[#E8E4DC] text-xs font-semibold text-[#1C1A18] hover:bg-[#F6F3EE] hover:border-[#1C1A18]/40 transition-all shadow-2xs cursor-pointer group"
                title="Mở lại menu điều hướng"
              >
                <span className="material-symbols-outlined text-[18px] text-[#5E6D5B] group-hover:scale-110 transition-transform">
                  menu
                </span>
                <span>Hiện menu điều hướng</span>
              </button>
            </div>
          )}
          {/* 1. HERO SECTION */}
          <section className="relative w-full border-b border-[#E7E2DA] bg-[#FBF9F5] py-14 lg:py-20 px-6 lg:px-12">
            <div className="mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center max-w-7xl">
              <div className="lg:col-span-7 space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F4F0EA] border border-[#E7E2DA] text-[#1C1A18] text-[11px] font-semibold tracking-widest uppercase">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#1C1A18]"></span>
                  Kinh tế tuần hoàn · Rent &amp; Thrift Marketplace
                </div>
                <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-[#1C1A18] leading-[1.12] font-semibold tracking-tight">
                  Dùng nhiều hơn.<br />
                  <span className="italic font-normal">Sở hữu ít hơn.</span>
                </h1>
                <p className="text-base sm:text-lg text-[#5E5A53] leading-relaxed font-normal max-w-xl">
                  Nền tảng lưu thông sản phẩm cao cấp: Thuê trang phục, máy ảnh và thiết bị dã ngoại khi bạn cần ngắn hạn; hoặc sở hữu lại đồ đã qua sử dụng với chất lượng được chứng thực nghiêm ngặt.
                </p>
                <div className="flex flex-wrap items-center gap-3.5 pt-2">
                  <Link
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-[#1C1A18] hover:bg-[#292724] text-white text-xs font-semibold tracking-wider uppercase transition-all shadow-sm"
                    to="/rent"
                  >
                    <span>Khám phá RENT</span>
                    <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </Link>
                  <Link
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-white hover:bg-[#F4F0EA] text-[#1C1A18] border border-[#E7E2DA] text-xs font-semibold tracking-wider uppercase transition-all"
                    to="/thrift"
                  >
                    <span>Mua đồ THRIFT</span>
                    <span className="material-symbols-outlined text-[16px]">shopping_bag</span>
                  </Link>
                </div>
                <div className="pt-8 grid grid-cols-3 gap-6 border-t border-[#E7E2DA] text-xs max-w-lg">
                  <div>
                    <span className="block font-serif text-2xl font-bold text-[#1C1A18]">10,000+</span>
                    <span className="text-[#78736A] text-[11px] mt-0.5 block">Sản phẩm lưu thông</span>
                  </div>
                  <div className="border-l border-[#E7E2DA] pl-6">
                    <span className="block font-serif text-2xl font-bold text-[#1C1A18]">100%</span>
                    <span className="text-[#78736A] text-[11px] mt-0.5 block">Kiểm định chuẩn hóa</span>
                  </div>
                  <div className="border-l border-[#E7E2DA] pl-6">
                    <span className="block font-serif text-2xl font-bold text-[#1C1A18]">0 Rác thải</span>
                    <span className="text-[#78736A] text-[11px] mt-0.5 block">Mục tiêu trọn đời</span>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-5 relative">
                <div className="relative rounded-lg overflow-hidden border border-[#E7E2DA] bg-white shadow-sm aspect-[4/5]">
                  <img
                    alt="Bộ sưu tập tuần hoàn tối giản cao cấp"
                    className="w-full h-full object-cover"
                    src="./src/assets/images/dashboard.jpg"
                  />
                  <div className="absolute top-4 left-4 flex gap-2">
                    <span className="px-2.5 py-1 rounded bg-[#1C1A18] text-white text-[10px] font-semibold tracking-widest uppercase">
                      RENT
                    </span>
                    <span className="px-2.5 py-1 rounded bg-white/90 backdrop-blur-sm border border-[#E7E2DA] text-[#1C1A18] text-[10px] font-semibold tracking-widest uppercase">
                      THRIFT
                    </span>
                  </div>
                  <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-md p-3.5 rounded border border-[#E7E2DA] flex items-center justify-between">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-[#78736A] font-bold">Quy chuẩn thẩm định</p>
                      <p className="text-xs font-semibold text-[#1C1A18]">Chứng thực nguồn gốc &amp; vệ sinh y tế</p>
                    </div>
                    <span className="material-symbols-outlined text-[20px] text-[#1C1A18]">verified</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 2. CATEGORIES SECTION */}
          <section className="py-16 px-6 lg:px-12 mx-auto max-w-7xl">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4 pb-4 border-b border-[#E7E2DA]">
              <div>
                <span className="text-[11px] font-bold tracking-widest text-[#78736A] uppercase">DANH MỤC TUẦN HOÀN</span>
                <h2 className="font-serif text-2xl sm:text-3xl text-[#1C1A18] font-semibold mt-1">
                  Khám phá theo nhu cầu
                </h2>
              </div>
              <Link
                className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-[#1C1A18] hover:opacity-60 transition-opacity"
                to="/categories"
              >
                <span>Xem tất cả danh mục</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              <Link
                className="group bg-white rounded-lg border border-[#E7E2DA] overflow-hidden p-3 hover:border-[#1C1A18] transition-colors flex flex-col"
                to="/categories/camera"
              >
                <div className="aspect-square rounded overflow-hidden bg-[#F4F0EA] mb-2.5">
                  <img
                    alt="Camera & Thiết bị quang học"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    src="./src/assets/images/camerahome.jpg"
                  />
                </div>
                <h3 className="font-semibold text-xs text-[#1C1A18]">Camera</h3>
                <span className="text-[11px] text-[#78736A] mt-0.5">86+ thiết bị</span>
              </Link>

              <Link
                className="group bg-white rounded-lg border border-[#E7E2DA] overflow-hidden p-3 hover:border-[#1C1A18] transition-colors flex flex-col"
                to="/categories/shoes"
              >
                <div className="aspect-square rounded overflow-hidden bg-[#F4F0EA] mb-2.5">
                  <img
                    alt="Giày dép"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    src="./src/assets/images/shoeshome.jpg"
                  />
                </div>
                <h3 className="font-semibold text-xs text-[#1C1A18]">Giày dép</h3>
                <span className="text-[11px] text-[#78736A] mt-0.5">70+ đôi</span>
              </Link>

              <Link
                className="group bg-white rounded-lg border border-[#E7E2DA] overflow-hidden p-3 hover:border-[#1C1A18] transition-colors flex flex-col"
                to="/categories/dam-du-tiec"
              >
                <div className="aspect-square rounded overflow-hidden bg-[#F4F0EA] mb-2.5">
                  <img
                    alt="Đầm dự tiệc"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    src="./src/assets/images/partydresshome.jpg"
                  />
                </div>
                <h3 className="font-semibold text-xs text-[#1C1A18]">Đầm dự tiệc</h3>
                <span className="text-[11px] text-[#78736A] mt-0.5">50+ mẫu</span>
              </Link>

              <Link
                className="group bg-white rounded-lg border border-[#E7E2DA] overflow-hidden p-3 hover:border-[#1C1A18] transition-colors flex flex-col"
                to="/categories/clothing"
              >
                <div className="aspect-square rounded overflow-hidden bg-[#F4F0EA] mb-2.5">
                  <img
                    alt="Quần áo"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    src="./src/assets/images/clotheshome.jpg"
                  />
                </div>
                <h3 className="font-semibold text-xs text-[#1C1A18]">Quần áo</h3>
                <span className="text-[11px] text-[#78736A] mt-0.5">140+ món</span>
              </Link>

              <Link
                className="group bg-white rounded-lg border border-[#E7E2DA] overflow-hidden p-3 hover:border-[#1C1A18] transition-colors flex flex-col"
                to="/categories/phu-kien"
              >
                <div className="aspect-square rounded overflow-hidden bg-[#F4F0EA] mb-2.5">
                  <img
                    alt="Phụ kiện"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    src="./src/assets/images/accessoryhome.jpg"
                  />
                </div>
                <h3 className="font-semibold text-xs text-[#1C1A18]">Phụ kiện</h3>
                <span className="text-[11px] text-[#78736A] mt-0.5">64+ món</span>
              </Link>
            </div>
          </section>

          {/* 3. RENT SECTION */}
          <section className="py-16 bg-[#F4F0EA]/50 border-y border-[#E7E2DA] px-6 lg:px-12">
            <div className="mx-auto max-w-7xl">
              <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4 pb-4 border-b border-[#E7E2DA]">
                <div>
                  <span className="text-[11px] font-bold tracking-widest text-[#78736A] uppercase">01 · BỘ SƯU TẬP CHO THUÊ</span>
                  <h2 className="font-serif text-2xl sm:text-3xl text-[#1C1A18] font-semibold mt-1">
                    Thuê những gì bạn chỉ cần dùng ngắn hạn
                  </h2>
                </div>
                <Link
                  className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-[#1C1A18] hover:opacity-60 transition-opacity"
                  to="/rent"
                >
                  <span>Xem tất cả sản phẩm RENT</span>
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Card 1 */}
                <div className="bg-white rounded-lg border border-[#E7E2DA] overflow-hidden flex flex-col group hover:border-[#1C1A18] transition-colors">
                  <div className="relative aspect-[4/3] bg-[#F4F0EA] overflow-hidden">
                    <img
                      alt="Sony Alpha A7 IV"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      src="./src/assets/images/sonyhome.jpg"
                    />
                    <span className="absolute top-2.5 left-2.5 bg-[#1C1A18] text-white text-[10px] font-bold px-2 py-0.5 rounded tracking-wider uppercase">RENT</span>
                    <Link
                      className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-white/90 backdrop-blur-sm border border-[#E7E2DA] text-[#1C1A18] hover:bg-white flex items-center justify-center transition-colors"
                      to={wishlistTarget}
                      title="Lưu yêu thích"
                    >
                      <span className="material-symbols-outlined text-[15px]">favorite_border</span>
                    </Link>
                  </div>
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between text-[11px] text-[#78736A] mb-1.5">
                        <span>Thiết bị hình ảnh</span>
                        <span className="text-[#1C1A18] font-medium">Tình trạng 98%</span>
                      </div>
                      <h3 className="font-semibold text-sm text-[#1C1A18] line-clamp-1 group-hover:underline">
                        Sony Alpha A7 Mark IV Body
                      </h3>
                    </div>
                    <div className="mt-4 pt-3 border-t border-[#E7E2DA]">
                      <div className="flex items-baseline justify-between">
                        <div>
                          <span className="text-base font-bold text-[#1C1A18]">450.000đ</span>
                          <span className="text-xs text-[#78736A]"> / ngày</span>
                        </div>
                        <span className="text-[11px] text-[#5E5A53]">Cọc: 2.000.000đ</span>
                      </div>
                      <Link
                        className="w-full mt-3 py-2 rounded bg-[#1C1A18] hover:bg-[#292724] text-white text-xs font-semibold text-center block transition-colors tracking-wide uppercase"
                        to="/rent"
                      >
                        Đặt lịch thuê
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Card 2 */}
                <div className="bg-white rounded-lg border border-[#E7E2DA] overflow-hidden flex flex-col group hover:border-[#1C1A18] transition-colors">
                  <div className="relative aspect-[4/3] bg-[#F4F0EA] overflow-hidden">
                    <img
                      alt="Đầm dạ hội lụa tự nhiên"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      src="./src/assets/images/silkdresshome.jpg"
                    />
                    <span className="absolute top-2.5 left-2.5 bg-[#1C1A18] text-white text-[10px] font-bold px-2 py-0.5 rounded tracking-wider uppercase">RENT</span>
                    <Link
                      className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-white/90 backdrop-blur-sm border border-[#E7E2DA] text-[#1C1A18] hover:bg-white flex items-center justify-center transition-colors"
                      to={wishlistTarget}
                      title="Lưu yêu thích"
                    >
                      <span className="material-symbols-outlined text-[15px]">favorite_border</span>
                    </Link>
                  </div>
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between text-[11px] text-[#78736A] mb-1.5">
                        <span>Trang phục thiết kế</span>
                        <span className="text-[#1C1A18] font-medium">Tình trạng 99%</span>
                      </div>
                      <h3 className="font-semibold text-sm text-[#1C1A18] line-clamp-1 group-hover:underline">
                        Đầm Lụa Tự Nhiên Editorial
                      </h3>
                    </div>
                    <div className="mt-4 pt-3 border-t border-[#E7E2DA]">
                      <div className="flex items-baseline justify-between">
                        <div>
                          <span className="text-base font-bold text-[#1C1A18]">180.000đ</span>
                          <span className="text-xs text-[#78736A]"> / ngày</span>
                        </div>
                        <span className="text-[11px] text-[#5E5A53]">Cọc: 800.000đ</span>
                      </div>
                      <Link
                        className="w-full mt-3 py-2 rounded bg-[#1C1A18] hover:bg-[#292724] text-white text-xs font-semibold text-center block transition-colors tracking-wide uppercase"
                        to="/rent"
                      >
                        Đặt lịch thuê
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Card 3 */}
                <div className="bg-white rounded-lg border border-[#E7E2DA] overflow-hidden flex flex-col group hover:border-[#1C1A18] transition-colors">
                  <div className="relative aspect-[4/3] bg-[#F4F0EA] overflow-hidden">
                    <img
                      alt="cao gót Jimmy Choo Aveline"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      src="./src/assets/images/JimmyChooAveline.jpg"
                    />
                    <span className="absolute top-2.5 left-2.5 bg-[#1C1A18] text-white text-[10px] font-bold px-2 py-0.5 rounded tracking-wider uppercase">RENT</span>
                    <Link
                      className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-white/90 backdrop-blur-sm border border-[#E7E2DA] text-[#1C1A18] hover:bg-white flex items-center justify-center transition-colors"
                      to={wishlistTarget}
                      title="Lưu yêu thích"
                    >
                      <span className="material-symbols-outlined text-[15px]">favorite_border</span>
                    </Link>
                  </div>
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between text-[11px] text-[#78736A] mb-1.5">
                        <span>Dã ngoại &amp; Trekking</span>
                        <span className="text-[#1C1A18] font-medium">Tình trạng 95%</span>
                      </div>
                      <h3 className="font-semibold text-sm text-[#1C1A18] line-clamp-1 group-hover:underline">
                        Giày Cao Gót Jimmy Choo Aveline 100 Bow Sandals - Màu Trắng/Latte
                      </h3>
                    </div>
                    <div className="mt-4 pt-3 border-t border-[#E7E2DA]">
                      <div className="flex items-baseline justify-between">
                        <div>
                          <span className="text-base font-bold text-[#1C1A18]">250.000đ</span>
                          <span className="text-xs text-[#78736A]"> / ngày</span>
                        </div>
                        <span className="text-[11px] text-[#5E5A53]">Cọc: 1.000.000đ</span>
                      </div>
                      <Link
                        className="w-full mt-3 py-2 rounded bg-[#1C1A18] hover:bg-[#292724] text-white text-xs font-semibold text-center block transition-colors tracking-wide uppercase"
                        to="/rent"
                      >
                        Đặt lịch thuê
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Card 4 */}
                <div className="bg-white rounded-lg border border-[#E7E2DA] overflow-hidden flex flex-col group hover:border-[#1C1A18] transition-colors">
                  <div className="relative aspect-[4/3] bg-[#F4F0EA] overflow-hidden">
                    <img
                      alt="Fujifilm X-T4 Mirrorless"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      src="./src/assets/images/fujifilmhome.jpg"
                    />
                    <span className="absolute top-2.5 left-2.5 bg-[#1C1A18] text-white text-[10px] font-bold px-2 py-0.5 rounded tracking-wider uppercase">RENT</span>
                    <Link
                      className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-white/90 backdrop-blur-sm border border-[#E7E2DA] text-[#1C1A18] hover:bg-white flex items-center justify-center transition-colors"
                      to={wishlistTarget}
                      title="Lưu yêu thích"
                    >
                      <span className="material-symbols-outlined text-[15px]">favorite_border</span>
                    </Link>
                  </div>
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between text-[11px] text-[#78736A] mb-1.5">
                        <span>Thiết bị quang học</span>
                        <span className="text-[#1C1A18] font-medium">Tình trạng 98%</span>
                      </div>
                      <h3 className="font-semibold text-sm text-[#1C1A18] line-clamp-1 group-hover:underline">
                        Fujifilm X-T4 + Kit 18-55mm
                      </h3>
                    </div>
                    <div className="mt-4 pt-3 border-t border-[#E7E2DA]">
                      <div className="flex items-baseline justify-between">
                        <div>
                          <span className="text-base font-bold text-[#1C1A18]">380.000đ</span>
                          <span className="text-xs text-[#78736A]"> / ngày</span>
                        </div>
                        <span className="text-[11px] text-[#5E5A53]">Cọc: 1.800.000đ</span>
                      </div>
                      <Link
                        className="w-full mt-3 py-2 rounded bg-[#1C1A18] hover:bg-[#292724] text-white text-xs font-semibold text-center block transition-colors tracking-wide uppercase"
                        to="/rent"
                      >
                        Đặt lịch thuê
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 4. THRIFT SECTION */}
          <section className="py-16 px-6 lg:px-12 mx-auto max-w-7xl">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4 pb-4 border-b border-[#E7E2DA]">
              <div>
                <span className="text-[11px] font-bold tracking-widest text-[#78736A] uppercase">02 · BỘ SƯU TẬP TÁI SỬ DỤNG</span>
                <h2 className="font-serif text-2xl sm:text-3xl text-[#1C1A18] font-semibold mt-1">
                  Cho những món đồ chất lượng một vòng đời mới
                </h2>
              </div>
              <Link
                className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-[#1C1A18] hover:opacity-60 transition-opacity"
                to="/thrift"
              >
                <span>Xem tất cả sản phẩm THRIFT</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Thrift 1 */}
              <div className="bg-white rounded-lg border border-[#E7E2DA] overflow-hidden flex flex-col group hover:border-[#1C1A18] transition-colors">
                <div className="relative aspect-[4/3] bg-[#F4F0EA] overflow-hidden">
                  <img
                    alt="Set Trang Phục Nữ All Black Phong Cách Hiện Đại"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    src="./src/assets/images/setclothhome.jpg"
                  />
                  <span className="absolute top-2.5 left-2.5 bg-[#1C1A18] text-white text-[10px] font-bold px-2 py-0.5 rounded tracking-wider uppercase">THRIFT</span>
                  <span className="absolute top-2.5 right-2.5 bg-white/90 backdrop-blur-sm border border-[#E7E2DA] text-[#1C1A18] text-[10px] font-medium px-2 py-0.5 rounded">
                    Từ đồ RENT
                  </span>
                </div>
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-[11px] text-[#78736A] mb-1.5">
                      <span>Trang phục hiện đại</span>
                      <span className="text-[#1C1A18] font-medium">Tình trạng 92%</span>
                    </div>
                    <h3 className="font-semibold text-sm text-[#1C1A18] line-clamp-1 group-hover:underline">
                      Set Trang Phục Nữ All Black Phong Cách Hiện Đại
                    </h3>
                  </div>
                  <div className="mt-4 pt-3 border-t border-[#E7E2DA]">
                    <div className="flex items-baseline justify-between">
                      <span className="text-base font-bold text-[#1C1A18]">850.000đ</span>
                      <span className="text-[11px] text-[#78736A]">Mua đứt · Không cọc</span>
                    </div>
                    <Link
                      className="w-full mt-3 py-2 rounded border border-[#1C1A18] bg-transparent hover:bg-[#1C1A18] hover:text-white text-[#1C1A18] text-xs font-semibold text-center block transition-colors tracking-wide uppercase"
                      to="/thrift"
                    >
                      Mua sản phẩm
                    </Link>
                  </div>
                </div>
              </div>

              {/* Thrift 2 */}
              <div className="bg-white rounded-lg border border-[#E7E2DA] overflow-hidden flex flex-col group hover:border-[#1C1A18] transition-colors">
                <div className="relative aspect-[4/3] bg-[#F4F0EA] overflow-hidden">
                  <img
                    alt="Sneaker cổ điển da thật"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    src="./src/assets/images/sneakerhome.jpg"
                  />
                  <span className="absolute top-2.5 left-2.5 bg-[#1C1A18] text-white text-[10px] font-bold px-2 py-0.5 rounded tracking-wider uppercase">THRIFT</span>
                  <span className="absolute top-2.5 right-2.5 bg-white/90 backdrop-blur-sm border border-[#E7E2DA] text-[#1C1A18] text-[10px] font-medium px-2 py-0.5 rounded">
                    Đã phục hồi
                  </span>
                </div>
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-[11px] text-[#78736A] mb-1.5">
                      <span>Giày &amp; Sneaker</span>
                      <span className="text-[#1C1A18] font-medium">Tình trạng 90%</span>
                    </div>
                    <h3 className="font-semibold text-sm text-[#1C1A18] line-clamp-1 group-hover:underline">
                      Giày Sneaker Minimal Da Thật
                    </h3>
                  </div>
                  <div className="mt-4 pt-3 border-t border-[#E7E2DA]">
                    <span className="text-base font-bold text-[#1C1A18]">1.200.000đ</span>
                    <span className="text-[11px] text-[#78736A]">Mua đứt · Không cọc</span>
                  </div>
                  <Link
                    className="w-full mt-3 py-2 rounded border border-[#1C1A18] bg-transparent hover:bg-[#1C1A18] hover:text-white text-[#1C1A18] text-xs font-semibold text-center block transition-colors tracking-wide uppercase"
                    to="/thrift"
                  >
                    Mua sản phẩm
                  </Link>
                </div>
              </div>

              {/* Thrift 3 */}
              <div className="bg-white rounded-lg border border-[#E7E2DA] overflow-hidden flex flex-col group hover:border-[#1C1A18] transition-colors">
                <div className="relative aspect-[4/3] bg-[#F4F0EA] overflow-hidden">
                  <img
                    alt="Máy ảnh Canon EOS"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    src="./src/assets/images/eoscamerahome.jpg"
                  />
                  <span className="absolute top-2.5 left-2.5 bg-[#1C1A18] text-white text-[10px] font-bold px-2 py-0.5 rounded tracking-wider uppercase">THRIFT</span>
                  <span className="absolute top-2.5 right-2.5 bg-white/90 backdrop-blur-sm border border-[#E7E2DA] text-[#1C1A18] text-[10px] font-medium px-2 py-0.5 rounded">
                    Từ đồ RENT
                  </span>
                </div>
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-[11px] text-[#78736A] mb-1.5">
                      <span>Thiết bị hình ảnh</span>
                      <span className="text-[#1C1A18] font-medium">Tình trạng 94%</span>
                    </div>
                    <h3 className="font-semibold text-sm text-[#1C1A18] line-clamp-1 group-hover:underline">
                      Canon EOS Full-Frame Body
                    </h3>
                  </div>
                  <div className="mt-4 pt-3 border-t border-[#E7E2DA]">
                    <span className="text-base font-bold text-[#1C1A18]">6.500.000đ</span>
                    <span className="text-[11px] text-[#78736A]">Mua đứt · Không cọc</span>
                  </div>
                  <Link
                    className="w-full mt-3 py-2 rounded border border-[#1C1A18] bg-transparent hover:bg-[#1C1A18] hover:text-white text-[#1C1A18] text-xs font-semibold text-center block transition-colors tracking-wide uppercase"
                    to="/thrift"
                  >
                    Mua sản phẩm
                  </Link>
                </div>
              </div>

              {/* Thrift 4 */}
              <div className="bg-white rounded-lg border border-[#E7E2DA] overflow-hidden flex flex-col group hover:border-[#1C1A18] transition-colors">
                <div className="relative aspect-[4/3] bg-[#F4F0EA] overflow-hidden">
                  <img
                    alt="Set Kẹp Gắp Tóc Hợp Kim Màu Bạc Sang Trọng Nữ Tính"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    src="./src/assets/images/hairaccessory.jpg"
                  />
                  <span className="absolute top-2.5 left-2.5 bg-[#1C1A18] text-white text-[10px] font-bold px-2 py-0.5 rounded tracking-wider uppercase">THRIFT</span>
                  <span className="absolute top-2.5 right-2.5 bg-white/90 backdrop-blur-sm border border-[#E7E2DA] text-[#1C1A18] text-[10px] font-medium px-2 py-0.5 rounded">
                    Tái sử dụng
                  </span>
                </div>
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-[11px] text-[#78736A] mb-1.5">
                      <span>Phụ kiện tóc</span>
                      <span className="text-[#1C1A18] font-medium">Tình trạng 96%</span>
                    </div>
                    <h3 className="font-semibold text-sm text-[#1C1A18] line-clamp-1 group-hover:underline">
                      Set Kẹp Gắp Tóc Hợp Kim Màu Bạc Sang Trọng Nữ Tính
                    </h3>
                  </div>
                  <div className="mt-4 pt-3 border-t border-[#E7E2DA]">
                    <span className="text-base font-bold text-[#1C1A18]">50.000đ</span>
                    <span className="text-[11px] text-[#78736A]">Mua đứt · Không cọc</span>
                  </div>
                  <Link
                    className="w-full mt-3 py-2 rounded border border-[#1C1A18] bg-transparent hover:bg-[#1C1A18] hover:text-white text-[#1C1A18] text-xs font-semibold text-center block transition-colors tracking-wide uppercase"
                    to="/thrift"
                  >
                    Mua sản phẩm
                  </Link>
                </div>
              </div>
            </div>
          </section>

          {/* 5. CLOSED-LOOP PROTOCOL SECTION */}
          <section className="py-16 bg-[#F4F0EA]/60 border-y border-[#E7E2DA] px-6 lg:px-12">
            <div className="mx-auto max-w-7xl">
              <div className="max-w-3xl mb-12">
                <span className="text-[11px] font-bold tracking-widest text-[#78736A] uppercase">MÔ HÌNH TUẦN HOÀN KHÉP KÍN</span>
                <h2 className="font-serif text-3xl sm:text-4xl text-[#1C1A18] font-semibold mt-1">
                  Hành trình tuần hoàn của một sản phẩm
                </h2>
                <p className="text-[#5E5A53] text-sm sm:text-base mt-3 leading-relaxed">
                  Mỗi sản phẩm khi đưa vào hệ thống đều được cấp mã định danh để giám sát vòng đời: từ cho thuê ngắn hạn, trả hàng kiểm định, cho đến sang nhượng THRIFT cho chủ nhân tiếp theo.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white rounded-lg border border-[#E7E2DA] p-6 flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-mono font-bold text-[#78736A]">01 / NHẬP HÀNG &amp; THẨM ĐỊNH</span>
                    <h3 className="font-serif text-lg font-semibold text-[#1C1A18] mt-3">Kiểm tra đầu vào</h3>
                    <p className="text-xs text-[#5E5A53] mt-2 leading-relaxed">
                      Sản phẩm từ đối tác được đánh giá cảm quan, kiểm tra chức năng quang học/cơ học và khử trùng sinh học.
                    </p>
                  </div>
                  <div className="pt-6 mt-6 border-t border-[#E7E2DA] text-[11px] font-semibold text-[#1C1A18]">
                    Tiêu chuẩn chuẩn hóa 100%
                  </div>
                </div>

                <div className="bg-white rounded-lg border border-[#E7E2DA] p-6 flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-mono font-bold text-[#78736A]">02 / CHO THUÊ RENT</span>
                    <h3 className="font-serif text-lg font-semibold text-[#1C1A18] mt-3">Tối đa vòng quay</h3>
                    <p className="text-xs text-[#5E5A53] mt-2 leading-relaxed">
                      Khách hàng đặt thuê theo nhu cầu thực tế với chính sách cọc minh bạch và hoàn tiền nhanh sau kiểm tra.
                    </p>
                  </div>
                  <div className="pt-6 mt-6 border-t border-[#E7E2DA] text-[11px] font-semibold text-[#1C1A18]">
                    Trung bình 8 – 15 chu kỳ thuê
                  </div>
                </div>

                <div className="bg-white rounded-lg border border-[#E7E2DA] p-6 flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-mono font-bold text-[#78736A]">03 / BẢO DƯỠNG &amp; SPA</span>
                    <h3 className="font-serif text-lg font-semibold text-[#1C1A18] mt-3">Phục hồi chuyên sâu</h3>
                    <p className="text-xs text-[#5E5A53] mt-2 leading-relaxed">
                      Sau mỗi lượt sử dụng, sản phẩm được làm sạch, hiệu chuẩn máy hoặc bảo dưỡng da để duy trì phẩm chất gốc.
                    </p>
                  </div>
                  <div className="pt-6 mt-6 border-t border-[#E7E2DA] text-[11px] font-semibold text-[#1C1A18]">
                    Bảo dưỡng sau mỗi lượt trả
                  </div>
                </div>

                <div className="bg-white rounded-lg border border-[#E7E2DA] p-6 flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-mono font-bold text-[#78736A]">04 / CHUYỂN TIẾP THRIFT</span>
                    <h3 className="font-serif text-lg font-semibold text-[#1C1A18] mt-3">Vòng đời mới</h3>
                    <p className="text-xs text-[#5E5A53] mt-2 leading-relaxed">
                      Khi kết thúc chu kỳ cho thuê, sản phẩm được bán đứt với mức giá ưu đãi, loại bỏ hoàn toàn việc thải bỏ.
                    </p>
                  </div>
                  <div className="pt-6 mt-6 border-t border-[#E7E2DA] text-[11px] font-semibold text-[#1C1A18]">
                    Giảm thiểu 100% rác thải rắn
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 6. SIMPLE PROTOCOL 4 STEPS */}
          <section className="py-16 px-6 lg:px-12 mx-auto max-w-7xl">
            <div className="max-w-2xl mb-12">
              <span className="text-[11px] font-bold tracking-widest text-[#78736A] uppercase">QUY TRÌNH SỬ DỤNG</span>
              <h2 className="font-serif text-3xl sm:text-4xl text-[#1C1A18] font-semibold mt-1">
                Trải nghiệm tinh giản trong 4 bước
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="border-t border-[#1C1A18] pt-4">
                <span className="font-mono text-xs font-bold text-[#1C1A18]">01</span>
                <h4 className="font-semibold text-sm text-[#1C1A18] mt-2">Tìm &amp; Chọn món đồ</h4>
                <p className="text-xs text-[#5E5A53] mt-1.5 leading-relaxed">
                  Lựa chọn giữa thuê theo ngày (RENT) hoặc mua đứt đồ đã qua sử dụng (THRIFT) trên hệ thống.
                </p>
              </div>
              <div className="border-t border-[#1C1A18] pt-4">
                <span className="font-mono text-xs font-bold text-[#1C1A18]">02</span>
                <h4 className="font-semibold text-sm text-[#1C1A18] mt-2">Xác nhận &amp; Nhận hàng</h4>
                <p className="text-xs text-[#5E5A53] mt-1.5 leading-relaxed">
                  Chủ shop xác nhận tình trạng, giao hàng kèm biên bản niêm phong và tem kiểm định chất lượng.
                </p>
              </div>
              <div className="border-t border-[#1C1A18] pt-4">
                <span className="font-mono text-xs font-bold text-[#1C1A18]">03</span>
                <h4 className="font-semibold text-sm text-[#1C1A18] mt-2">Trải nghiệm &amp; Sử dụng</h4>
                <p className="text-xs text-[#5E5A53] mt-1.5 leading-relaxed">
                  Tự do sử dụng cho sự kiện, chuyến đi hoặc công việc với sự hỗ trợ kỹ thuật trực tuyến liên tục.
                </p>
              </div>
              <div className="border-t border-[#1C1A18] pt-4">
                <span className="font-mono text-xs font-bold text-[#1C1A18]">04</span>
                <h4 className="font-semibold text-sm text-[#1C1A18] mt-2">Trả đồ hoặc Giữ lại</h4>
                <p className="text-xs text-[#5E5A53] mt-1.5 leading-relaxed">
                  Trả đồ nhẹ nhàng qua bưu cục hoàn cọc trong 24h, hoặc mua lại trực tiếp nếu bạn muốn sở hữu lâu dài.
                </p>
              </div>
            </div>
          </section>

          {/* 7. CALL TO ACTION */}
          <section className="py-16 px-6 lg:px-12 mx-auto max-w-7xl">
            <div className="bg-[#1C1A18] text-[#FBF9F5] rounded-xl p-8 sm:p-14 border border-[#1C1A18] flex flex-col items-center text-center">
              <div className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-[20px] text-white">all_inclusive</span>
              </div>
              <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold max-w-2xl leading-tight">
                Sẵn sàng gia nhập cộng đồng tiêu dùng bền vững?
              </h2>
              <p className="text-[#E7E2DA]/80 text-sm sm:text-base mt-4 max-w-xl leading-relaxed font-normal">
                Khám phá hàng ngàn sản phẩm được chia sẻ và tái sử dụng mỗi ngày. Tiết kiệm chi phí, giải phóng không gian sống và cùng giảm thiểu phát thải rác.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4 mt-8">
                <Link
                  className="inline-flex items-center justify-center gap-2 px-7 py-3 rounded-full bg-white text-[#1C1A18] text-xs font-bold uppercase tracking-wider hover:bg-[#F4F0EA] transition-all shadow-sm"
                  to="/rent"
                >
                  <span>Bắt đầu thuê ngay</span>
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </Link>
                <Link
                  className="inline-flex items-center justify-center gap-2 px-7 py-3 rounded-full border border-white/40 text-white text-xs font-bold uppercase tracking-wider hover:bg-white/10 transition-all"
                  to="/thrift"
                >
                  <span>Xem kho hàng THRIFT</span>
                </Link>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default Home;