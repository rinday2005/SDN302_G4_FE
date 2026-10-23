import React, { useState, useEffect } from 'react';
import { AppSidebar } from '../../components/layout/AppSidebar';
import { Link } from 'react-router-dom';
import {
  ABOUT_STATS as stats,
  ABOUT_CIRCULAR_STEPS as circularSteps,
  ABOUT_CUSTOMER_BENEFITS as customerBenefits,
  ABOUT_SHOP_BENEFITS as shopBenefits,
} from '../data/home/aboutData';


// ─── Component ─────────────────────────────────────────────────────────────

const About: React.FC = () => {
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
    <div
      className="w-full bg-[#FAF8F5] text-[#1A1918] antialiased"
      style={{ fontFamily: "'Manrope', sans-serif" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700;800&family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,600&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap');
        .about-serif { font-family: 'Playfair Display', serif !important; }
        .about-container .material-symbols-outlined {
          font-family: 'Material Symbols Outlined' !important;
          font-variation-settings: 'FILL' 0,'wght' 300,'GRAD' 0,'opsz' 24;
          font-weight: normal; font-style: normal;
          display: inline-block; line-height: 1;
          text-transform: none; letter-spacing: normal;
          white-space: nowrap; direction: ltr;
          -webkit-font-smoothing: antialiased;
          vertical-align: middle;
        }
      `}</style>

            {/* ── MAIN WORKSPACE CONTAINER WITH PERSISTENT SIDEBAR ── */}
      <div className="max-w-[1520px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 flex gap-8">
        {/* Navigation Sidebar */}
        <AppSidebar activeKey="about" />

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

          <div className="about-container w-full">

        {/* ── Breadcrumb ───────────────────────────────────────────────── */}
        <nav className="flex items-center gap-2 text-[11px] text-[#7D756D] mb-8 font-medium">
          <Link to="/" className="hover:text-[#1A1918] transition-colors">Trang chủ</Link>
          <span>/</span>
          <span className="text-[#7D756D]/70">Hệ sinh thái</span>
          <span>/</span>
          <span className="text-[#1A1918] font-semibold">Giới thiệu (About ReUse Hub)</span>
        </nav>

        {/* ── Hero ─────────────────────────────────────────────────────── */}
        <section className="mb-16 lg:mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F3EFEA] border border-[#E8E2D9] text-[10px] font-bold tracking-widest uppercase text-[#7D756D] mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-[#1A1918]" />
            VỀ REUSE HUB
          </div>

          <h1 className="about-serif text-3xl sm:text-4xl lg:text-5xl font-medium tracking-tight text-[#1A1918] leading-[1.2] max-w-3xl mb-5">
            Mỗi món đồ đều có thể có thêm một vòng đời.
          </h1>

          <p className="text-base sm:text-lg text-[#7D756D] font-light max-w-2xl leading-relaxed mb-8">
            ReUse Hub kết nối{' '}
            <span className="font-semibold text-[#1A1918]">RENT</span> và{' '}
            <span className="font-semibold text-[#1A1918]">THRIFT</span> trong một mô hình sử dụng tuần hoàn khép kín, bền vững và nhân bản.
          </p>

          {/* Stats bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-[#E8E2D9]">
            {stats.map((s) => (
              <div key={s.val} className="p-4 rounded-xl bg-white border border-[#E8E2D9]/80 shadow-sm">
                <div className="about-serif text-2xl font-bold text-[#1A1918]">{s.val}</div>
                <div className="text-[11px] text-[#7D756D] mt-0.5">{s.sub}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── ReUse Hub là gì ──────────────────────────────────────────── */}
        <section className="mb-16 lg:mb-24">
          <div className="bg-white rounded-2xl border border-[#E8E2D9] p-6 lg:p-10 shadow-sm overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">

              {/* Left: text */}
              <div className="lg:col-span-6 space-y-5">
                <div className="text-[11px] font-bold tracking-widest uppercase text-[#7D756D]">
                  Định vị nền tảng
                </div>
                <h2 className="about-serif text-2xl sm:text-3xl font-medium text-[#1A1918] leading-snug">
                  ReUse Hub là gì?
                </h2>
                <p className="text-sm sm:text-base text-[#7D756D] leading-relaxed">
                  ReUse Hub là marketplace nơi người dùng có thể thuê những sản phẩm mình chỉ cần dùng trong thời gian ngắn, hoặc mua những sản phẩm đã qua sử dụng vẫn còn nhiều giá trị.
                </p>
                <p className="text-xs sm:text-sm text-[#7D756D]/90 leading-relaxed">
                  Chúng tôi tái định nghĩa cách con người tiếp cận công năng của thiết bị và phong cách sống: thay vì chạy đua mua sắm sở hữu dẫn đến lãng phí, một sản phẩm tinh tuyển từ máy ảnh cao cấp, trang phục sự kiện đến phụ kiện dã ngoại được luân chuyển có kiểm soát qua bàn tay của những người thực sự trân trọng giá trị sử dụng của nó.
                </p>
                <div className="pt-3 space-y-2.5">
                  {[
                    'Kiểm định chất lượng 14 bước nghiêm ngặt trước mỗi lần chuyển giao',
                    'Đồng bộ đóng gói hộp cứng chống va đập và quy trình bàn giao có bảo hiểm',
                    'Tự động hóa thanh toán và hoàn trả tiền cọc không cần thương lượng thủ công',
                  ].map((li) => (
                    <div key={li} className="flex items-center gap-3 text-xs text-[#1A1918] font-medium">
                      <span className="w-5 h-5 rounded-full bg-[#F3EFEA] text-[#1A1918] flex items-center justify-center text-[13px] font-bold shrink-0">✓</span>
                      <span>{li}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right: image cards */}
              <div className="lg:col-span-6">
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  {/* Card 1 wide */}
                  <div className="col-span-2 relative rounded-xl overflow-hidden group border border-[#E8E2D9]">
                    <img
                      alt="Camera thiết bị quang học"
                      className="w-full h-48 sm:h-52 object-cover group-hover:scale-105 transition-transform duration-500"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuCYe_kNWXzQZsQn5lSWy2cWmXCv1DfcwgzjAmrvc8vVfUh9w9nK2PJrVk9Jm8NHfJU7UO4Q_Ga8-e-hNocHTutZ19_KSXrz7yvQZH3qepBuSPC1uOwZjg0OaZnVKRGt87AMTs_9YgBVCZUjo4X99o50pmGxGRKOUKNDjs3NrQ_0oCHMy0ZdWFiiKHLRz85fdMkXo6PJohzcR9ohm96fIQFJmuE4e6kc8Tkne_kqcw5q"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-end p-4 text-white">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300">Thiết bị Quang học &amp; Sáng tạo</span>
                      <h3 className="about-serif text-base font-semibold">Máy ảnh Mirrorless &amp; Ống kính Archival</h3>
                      <p className="text-[11px] text-white/80 mt-0.5 line-clamp-1">Trải nghiệm thiết bị đắt tiền cho các dự án mà không cần mua đứt.</p>
                    </div>
                  </div>
                  {/* Card 2 */}
                  <div className="relative rounded-xl overflow-hidden group border border-[#E8E2D9]">
                    <img
                      alt="Quần áo thời trang lưu trữ"
                      className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-500"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuCq8m_YWF965JNGN94Q-PRlkzYZKp79UGxLi2jpktTMEV7yAHORJUct6iaxRqQj3AtAckWeI9SE9pKIWnMxFc_8DOBfL3HfbIIZMpkeuFKpZiDgEvflNieXaQAgeg_xqM_h6BMccBNzPOnYLuyJewbmQPBRcABIFZd6hEBeh1QLQixnVEwEbgIV9MP7WbyDr4zcQ9aUIKFFdKtaVwfevmIFlsZTLZ3FiiaY9HirbHsX"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent flex flex-col justify-end p-3.5 text-white">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-amber-300">Thời trang &amp; Sự kiện</span>
                      <h3 className="about-serif text-sm font-semibold">Trang phục cao cấp</h3>
                      <p className="text-[10px] text-white/75 mt-0.5">Khử trùng y tế chuẩn xác.</p>
                    </div>
                  </div>
                  {/* Card 3 */}
                  <div className="relative rounded-xl overflow-hidden group border border-[#E8E2D9]">
                    <img
                      alt="Giày dép & sneakers tuyển chọn"
                      className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-500"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuDM--h_RfcguvrTeKaOV9fvFtkl60gawcPrAagpdMI06KGUJqoLY2_nb7WBu6134k21Ap2jg6YX3sNVKWag5c0VDnWz9KlLPm3-Arix2PWlLLZRsu9OMWKv5wteWNejI75Vpw3VPJ20HUTc0hyJ6df3-5K3udPiAwOzhgvnokqq2e_UBlHJKURsdKfc0F2IvazQRyLFBRy7QZuCjBRDG0xjtTa7QOl3osQDQUVWj9V8"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent flex flex-col justify-end p-3.5 text-white">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-amber-300">Sneakers &amp; Giày lưu trữ</span>
                      <h3 className="about-serif text-sm font-semibold">Đôi giày cho vòng đời mới</h3>
                      <p className="text-[10px] text-white/75 mt-0.5">Sẵn sàng đồng hành bền bỉ.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Mô hình tuần hoàn ────────────────────────────────────────── */}
        <section className="mb-16 lg:mb-24">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <div className="text-[11px] font-bold tracking-widest uppercase text-[#7D756D] mb-2">
              KIẾN TRÚC VẬN HÀNH KHÉP KÍN
            </div>
            <h2 className="about-serif text-2xl sm:text-3xl font-medium text-[#1A1918]">
              Mô hình tuần hoàn của ReUse Hub
            </h2>
            <p className="text-sm text-[#7D756D] mt-2">
              Sau khi được trả về, sản phẩm có thể tiếp tục được cho thuê hoặc chuyển sang THRIFT nếu đủ điều kiện.
            </p>
          </div>

          <div className="bg-[#F3EFEA] rounded-2xl border border-[#E8E2D9] p-6 lg:p-10 shadow-sm">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 lg:gap-2">
              {circularSteps.map((s) => {
                const isDark    = s.variant === 'dark';
                const isEmerald = s.variant === 'emerald';
                const isAmber   = s.variant === 'amber';
                return (
                  <div
                    key={s.num}
                    className={`rounded-xl p-4 border flex flex-col items-center text-center shadow-sm ${
                      isDark    ? 'bg-[#1A1918] border-[#1A1918]'
                      : isEmerald ? 'bg-emerald-50/60 border-emerald-200'
                      : isAmber   ? 'bg-amber-50/60 border-amber-300'
                      : 'bg-white border-[#E8E2D9]'
                    }`}
                  >
                    <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold mb-2 ${
                      isDark    ? 'bg-white text-[#1A1918]'
                      : isEmerald ? 'bg-emerald-800 text-white'
                      : isAmber   ? 'bg-amber-800 text-white'
                      : 'bg-[#F3EFEA] text-[#1A1918] border border-[#E8E2D9]'
                    }`}>{s.num}</span>
                    <span className={`material-symbols-outlined text-[24px] mb-1 ${
                      isDark    ? 'text-white'
                      : isEmerald ? 'text-emerald-800'
                      : isAmber   ? 'text-amber-800'
                      : 'text-[#1A1918]'
                    }`}>{s.icon}</span>
                    <h4 className={`about-serif text-sm font-bold ${
                      isDark    ? 'text-white'
                      : isEmerald ? 'text-emerald-900'
                      : isAmber   ? 'text-amber-900'
                      : 'text-[#1A1918]'
                    }`}>{s.title}</h4>
                    <p className={`text-[11px] mt-1 leading-snug ${
                      isDark    ? 'text-white/70'
                      : isEmerald ? 'text-emerald-700'
                      : isAmber   ? 'text-amber-700'
                      : 'text-[#7D756D]'
                    }`}>{s.desc}</p>
                  </div>
                );
              })}
            </div>

            <div className="mt-8 pt-6 border-t border-[#E8E2D9] flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-[#7D756D]">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-emerald-700 text-[20px]">eco</span>
                <span>
                  <strong className="text-[#1A1918]">Quy chế Second-Life:</strong> Khi sản phẩm hoàn thành chu kỳ thuê hoặc người dùng muốn sở hữu vĩnh viễn, sản phẩm được chuyển sang THRIFT với giá tối ưu và hồ sơ kiểm định minh bạch.
                </span>
              </div>
              <Link to="/how-it-works" className="inline-flex items-center gap-1 font-semibold text-[#1A1918] hover:underline whitespace-nowrap text-xs">
                Xem chi tiết cách vận hành 10 bước →
              </Link>
            </div>
          </div>
        </section>

        {/* ── Hai vai trò ──────────────────────────────────────────────── */}
        <section className="mb-16 lg:mb-24">
          <div className="text-center max-w-xl mx-auto mb-10">
            <div className="text-[11px] font-bold tracking-widest uppercase text-[#7D756D] mb-2">
              ĐỐI TƯỢNG ĐỒNG HÀNH
            </div>
            <h2 className="about-serif text-2xl sm:text-3xl font-medium text-[#1A1918]">
              Hai vai trò tạo nên nền kinh tế tuần hoàn
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Khách hàng */}
            <div className="bg-white rounded-2xl border border-[#E8E2D9] p-6 sm:p-8 flex flex-col justify-between shadow-sm">
              <div>
                <div className="w-10 h-10 rounded-full bg-[#F3EFEA] text-[#1A1918] flex items-center justify-center mb-5 border border-[#E8E2D9]">
                  <span className="material-symbols-outlined text-[20px]">person</span>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#7D756D]">DÀNH CHO KHÁCH HÀNG</span>
                <h3 className="about-serif text-2xl font-medium text-[#1A1918] mt-1 mb-4">Dành cho bạn</h3>
                <p className="text-xs text-[#7D756D] leading-relaxed mb-6">
                  Tự do trải nghiệm mọi thiết bị đỉnh cao mà không bị ràng buộc bởi chi phí sở hữu cồng kềnh hay nỗi lo mất giá qua năm tháng.
                </p>
                <ul className="space-y-3.5 text-xs text-[#1A1918]">
                  {customerBenefits.map((b) => (
                    <li key={b.title} className="flex items-start gap-3">
                      <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[10px] font-bold mt-0.5 shrink-0">✓</span>
                      <span><strong>{b.title}</strong>{b.desc}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="pt-8 mt-8 border-t border-[#E8E2D9] flex items-center justify-between">
                <span className="text-[11px] text-[#7D756D]">Khám phá các bộ sưu tập</span>
                <Link to="/categories" className="text-xs font-semibold text-[#1A1918] hover:underline flex items-center gap-1">
                  Xem danh mục →
                </Link>
              </div>
            </div>

            {/* Shop Owner */}
            <div className="bg-[#1A1918] text-[#FAF8F5] rounded-2xl p-6 sm:p-8 flex flex-col justify-between shadow-sm relative overflow-hidden">
              <div>
                <div className="w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center mb-5 border border-white/20">
                  <span className="material-symbols-outlined text-[20px]">storefront</span>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300">ĐỐI TÁC CUNG ỨNG ỦY QUYỀN</span>
                <h3 className="about-serif text-2xl font-medium text-white mt-1 mb-4">Dành cho Shop Owner</h3>
                <p className="text-xs text-[#FAF8F5]/70 leading-relaxed mb-6">
                  Chuyên môn hóa khâu quản lý tài sản, kiểm định kỹ thuật và duy trì chất lượng dịch vụ đồng bộ trên toàn nền tảng ReUse Hub.
                </p>
                <ul className="space-y-3.5 text-xs text-[#FAF8F5]/90">
                  {shopBenefits.map((b) => (
                    <li key={b.title} className="flex items-start gap-3">
                      <span className="w-4 h-4 rounded-full bg-white/20 text-white flex items-center justify-center text-[10px] font-bold mt-0.5 shrink-0">✓</span>
                      <span><strong>{b.title}</strong>{b.desc}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="pt-6 mt-6 border-t border-white/10 flex items-center justify-between text-[11px] text-[#FAF8F5]/60">
                <span>Độc quyền kiểm chứng bởi ReUse Hub</span>
                <span className="inline-flex items-center gap-1 text-amber-300 font-semibold">
                  <span className="material-symbols-outlined text-[14px]">shield</span>
                  Chuẩn đối tác duy nhất
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ── Tầm nhìn & CTA ───────────────────────────────────────────── */}
        <section className="mb-14">
          <div className="bg-gradient-to-br from-[#F3EFEA] to-white rounded-3xl border border-[#E8E2D9] p-8 sm:p-12 lg:p-16 text-center shadow-sm">
            <div className="w-12 h-12 rounded-full bg-[#1A1918] text-white flex items-center justify-center mx-auto mb-6">
              <span className="material-symbols-outlined text-[24px]">format_quote</span>
            </div>
            <div className="text-[10px] font-bold tracking-widest uppercase text-[#7D756D] mb-4">
              TẦM NHÌN VÀ SỨ MỆNH
            </div>
            <blockquote className="about-serif text-2xl sm:text-3xl lg:text-4xl text-[#1A1918] font-normal leading-snug max-w-3xl mx-auto mb-8">
              "Biến việc tái sử dụng thành một phần tự nhiên của cuộc sống hằng ngày."
            </blockquote>
            <p className="text-xs sm:text-sm text-[#7D756D] max-w-xl mx-auto leading-relaxed mb-10">
              ReUse Hub tin rằng tương lai của tiêu dùng không nằm ở việc sở hữu thật nhiều, mà ở khả năng tối ưu hóa giá trị của từng sản phẩm. Mỗi lần bạn chọn thuê một món đồ hoặc mua lại một thiết bị đã qua sử dụng, bạn đang góp phần kéo dài hành trình của nó và giảm thiểu dấu chân sinh thái trên Trái Đất.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/rent"
                className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-[#1A1918] text-white text-xs font-semibold hover:bg-black transition-colors shadow-sm flex items-center justify-center gap-2"
              >
                <span>Khám phá RENT</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </Link>
              <Link
                to="/thrift"
                className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-white text-[#1A1918] border border-[#E8E2D9] text-xs font-semibold hover:bg-[#F3EFEA] transition-colors shadow-sm flex items-center justify-center gap-2"
              >
                <span>Mua đồ THRIFT</span>
                <span className="material-symbols-outlined text-[16px]">shopping_bag</span>
              </Link>
            </div>
          </div>
        </section>

          </div>
        </main>
      </div>
    </div>
  );
};

export default About;
