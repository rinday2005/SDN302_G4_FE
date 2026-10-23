import React, { useState, useEffect } from 'react';
import { AppSidebar } from '../../components/layout/AppSidebar';
import { Link } from 'react-router-dom';
import { RENT_STEPS as rentSteps, THRIFT_STEPS as thriftSteps } from '../data/home/howItWorksData';


const HowItWorks: React.FC = () => {
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
      className="w-full bg-[#FBF9F5] text-[#1C1A18] antialiased"
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap');
        .hiw-serif { font-family: 'Playfair Display', Georgia, serif !important; }
        .hiw-container .material-symbols-outlined {
          font-family: 'Material Symbols Outlined' !important;
          font-weight: normal; font-style: normal;
          display: inline-block; line-height: 1;
          text-transform: none; letter-spacing: normal;
          white-space: nowrap; direction: ltr;
          -webkit-font-smoothing: antialiased;
        }
      `}</style>

            {/* ── MAIN WORKSPACE CONTAINER WITH PERSISTENT SIDEBAR ── */}
      <div className="max-w-[1520px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 flex gap-8">
        {/* Navigation Sidebar */}
        <AppSidebar activeKey="how-it-works" />

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

          <div className="hiw-container w-full flex flex-col gap-0">

        {/* ── Breadcrumb ─────────────────────────────────────────────────── */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-stone-500 mb-6 font-medium tracking-wide">
          <Link to="/" className="hover:text-stone-900 transition-colors">Trang chủ</Link>
          <span className="text-stone-300">/</span>
          <span className="text-stone-600">Hệ sinh thái</span>
          <span className="text-stone-300">/</span>
          <span className="text-stone-900 font-semibold">Cách hoạt động</span>
        </nav>

        {/* ── Hero ───────────────────────────────────────────────────────── */}
        <section className="relative bg-stone-100 rounded-3xl p-8 lg:p-14 overflow-hidden mb-12 shadow-sm">
          {/* decorative blobs */}
          <div className="absolute -right-24 -bottom-24 w-96 h-96 bg-amber-100/60 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-12 right-12 opacity-5 pointer-events-none hidden lg:block">
            <svg className="w-80 h-80" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path d="M18.178 8c5.096 0 5.096 8 0 8-5.095 0-7.133-8-12.732-8-4.58 0-4.58 8 0 8 5.6 0 7.637-8 12.732-8z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          <div className="relative z-10 max-w-3xl">
            {/* badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-stone-200/80 text-stone-800 text-[11px] font-semibold tracking-widest uppercase mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
              HOW REUSE HUB WORKS · NỀN TẢNG TUẦN HOÀN MINH BẠCH
            </div>

            <h1 className="hiw-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-stone-900 leading-tight mb-6 tracking-tight">
              Thuê khi cần.<br />
              Trả lại.<br />
              <span className="italic font-normal text-stone-700">Cho sản phẩm thêm vòng đời.</span>
            </h1>

            <p className="text-stone-600 text-sm sm:text-base leading-relaxed mb-8 max-w-2xl">
              Một cách đơn giản hơn để sử dụng những món đồ bạn không nhất thiết phải sở hữu. Từ các thiết bị quang học chính xác, đồ dã ngoại thực chiến đến thời trang lưu trữ cao cấp — tất cả đều được thẩm định và quản lý vòng đời chuyên nghiệp.
            </p>

            <div className="flex flex-wrap items-center gap-3 mb-10">
              <Link to="/rent" className="inline-flex items-center gap-2.5 px-6 py-3 rounded-xl bg-stone-900 text-white text-xs font-semibold hover:bg-stone-800 transition-all shadow-md group">
                <span>Khám phá dịch vụ RENT</span>
                <span className="material-symbols-outlined text-sm group-hover:translate-x-0.5 transition-transform">arrow_forward</span>
              </Link>
              <Link to="/thrift" className="inline-flex items-center gap-2.5 px-6 py-3 rounded-xl bg-stone-200 text-stone-900 text-xs font-semibold hover:bg-stone-300 transition-all">
                <span>Tìm hiểu kho đồ THRIFT</span>
                <span className="material-symbols-outlined text-sm">inventory_2</span>
              </Link>
            </div>

            {/* metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-stone-200/80">
              {[
                { val: '10 Bước',    sub: 'RENT minh bạch, khép kín',   cls: 'text-stone-900' },
                { val: '100% Hoàn', sub: 'Cọc qua Smart Escrow',        cls: 'text-emerald-800' },
                { val: 'Chuẩn y tế',sub: 'Khử trùng & Audit Bench',     cls: 'text-stone-900' },
                { val: 'Ủy quyền',  sub: '100% từ Shop Owner',          cls: 'text-stone-900' },
              ].map((m) => (
                <div key={m.sub} className="space-y-1">
                  <span className={`hiw-serif text-2xl font-bold ${m.cls}`}>{m.val}</span>
                  <p className="text-[11px] text-stone-500 font-medium">{m.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Section 1: 10 bước RENT ────────────────────────────────────── */}
        <section className="mb-16">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
            <div>
              <span className="text-[11px] font-bold tracking-widest text-stone-500 uppercase block mb-1">QUY TRÌNH TIÊU CHUẨN</span>
              <h2 className="hiw-serif text-2xl sm:text-3xl font-bold text-stone-900">
                01 · Dịch vụ Thuê RENT — 10 Bước chuẩn xác từ chọn đồ đến hoàn tiền cọc
              </h2>
            </div>
            <p className="text-xs text-stone-600 max-w-md leading-relaxed">
              Quy trình thuê khép kín bảo vệ tài sản và minh bạch tài chính tối đa cho cả người thuê lẫn Shop Owner ủy quyền.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3.5">
            {rentSteps.map((s) =>
              s.dark ? (
                <div key={s.num} className="bg-emerald-950 text-white rounded-2xl p-5 flex flex-col justify-between shadow-sm">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-mono text-xs font-bold text-emerald-400">{s.num}</span>
                      <span className="material-symbols-outlined text-emerald-400 text-lg">{s.icon}</span>
                    </div>
                    <h3 className="font-semibold text-xs text-white mb-1.5">{s.title}</h3>
                    <p className="text-[11px] text-stone-300 leading-relaxed">{s.desc}</p>
                  </div>
                  <div className="pt-4 mt-2 border-t border-emerald-900 text-[10px] font-semibold text-emerald-300">{s.tag}</div>
                </div>
              ) : (
                <div key={s.num} className="bg-stone-100 rounded-2xl p-5 hover:bg-stone-200/80 transition-all flex flex-col justify-between shadow-sm">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-mono text-xs font-bold text-stone-400">{s.num}</span>
                      <span className="material-symbols-outlined text-stone-700 text-lg">{s.icon}</span>
                    </div>
                    <h3 className="font-semibold text-xs text-stone-900 mb-1.5">{s.title}</h3>
                    <p className="text-[11px] text-stone-600 leading-relaxed">{s.desc}</p>
                  </div>
                  <div className="pt-4 mt-2 border-t border-stone-200 text-[10px] font-semibold text-stone-500">{s.tag}</div>
                </div>
              )
            )}
          </div>
        </section>

        {/* ── Section 2: 6 bước THRIFT ───────────────────────────────────── */}
        <section className="mb-16">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
            <div>
              <span className="text-[11px] font-bold tracking-widest text-stone-500 uppercase block mb-1">MUA SẮM TUYỂN CHỌN</span>
              <h2 className="hiw-serif text-2xl sm:text-3xl font-bold text-stone-900">
                02 · Dịch vụ THRIFT — 6 Bước sở hữu vĩnh viễn đồ tuyển chọn
              </h2>
            </div>
            <p className="text-xs text-stone-600 max-w-md leading-relaxed">
              Sở hữu những món đồ cổ điển, thiết bị lưu trữ hoặc sản phẩm hoàn tất chu kỳ cho thuê với hồ sơ nguồn gốc rõ ràng.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {thriftSteps.map((s) => (
              <div key={s.num} className="bg-stone-100 rounded-2xl p-6 flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-stone-900 text-white shrink-0 flex items-center justify-center hiw-serif font-bold text-sm">
                  {s.num}
                </div>
                <div>
                  <h3 className="font-semibold text-xs text-stone-900 mb-1">{s.title}</h3>
                  <p className="text-[11px] text-stone-600 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Section 3: Mô hình tuần hoàn ──────────────────────────────── */}
        <section className="mb-16 bg-stone-100 rounded-3xl p-8 lg:p-12 shadow-sm">
          <div className="max-w-2xl mb-8">
            <span className="text-[11px] font-bold tracking-widest text-stone-500 uppercase block mb-1">HỆ THỐNG VÒNG ĐỜI KHÉP KÍN</span>
            <h2 className="hiw-serif text-2xl sm:text-3xl font-bold text-stone-900 mb-3">
              03 · Mô hình tuần hoàn khép kín — Không rác thải, tối ưu giá trị sử dụng
            </h2>
            <p className="text-xs text-stone-600 leading-relaxed">
              Những sản phẩm RENT sau khi được trả về sẽ được Shop Owner kiểm tra kỹ thuật nghiêm ngặt. Sản phẩm đủ điều kiện có thể tiếp tục được cho thuê hoặc chuyển đổi sang kho THRIFT với mức giá hợp lý — trao thêm một vòng đời mới thay vì trở thành rác thải.
            </p>
          </div>

          <div className="bg-stone-200/60 rounded-2xl p-6 lg:p-8">
            {/* 4 phases */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 items-center mb-6">
              {[
                { phase: 'Giai đoạn 1', title: 'RENT (Cho thuê)',     sub: 'Đăng kiểm chất lượng cao',    dark: true },
                { phase: 'Giai đoạn 2', title: 'USE (Khách sử dụng)', sub: 'Trải nghiệm có bảo hiểm',    dark: false },
                { phase: 'Giai đoạn 3', title: 'RETURN (Trả lại kho)',sub: 'Đóng gói chuẩn quy cách',    dark: false },
                { phase: 'Điểm phân nhánh', title: 'INSPECT (Kiểm định)', sub: 'Audit Bench đa tầng',    amber: true },
              ].map((p) => (
                <div key={p.phase} className={`p-4 rounded-xl text-center shadow-sm ${p.dark ? 'bg-stone-900 text-white' : p.amber ? 'bg-amber-100' : 'bg-stone-50'}`}>
                  <div className={`text-[10px] font-mono uppercase tracking-wider mb-1 ${p.dark ? 'text-stone-400' : p.amber ? 'text-amber-800' : 'text-stone-400'}`}>{p.phase}</div>
                  <div className={`font-bold text-xs ${p.dark ? 'hiw-serif' : 'font-semibold'} ${p.dark ? 'text-white' : 'text-stone-900'}`}>{p.title}</div>
                  <p className={`text-[10px] mt-1 ${p.dark ? 'text-stone-300' : 'text-stone-500'}`}>{p.sub}</p>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-center my-3">
              <div className="h-6 w-0.5 bg-stone-300" />
            </div>

            {/* branches */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-stone-50 rounded-2xl p-5 flex flex-col justify-between">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-stone-200 text-stone-800 text-[10px] font-bold uppercase mb-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                    NHÁNH A: TIẾP TỤC CHO THUÊ
                  </div>
                  <h4 className="hiw-serif font-bold text-sm text-stone-900 mb-1.5">Độ mới &amp; Hiệu năng Grade A+</h4>
                  <p className="text-[11px] text-stone-600 leading-relaxed mb-4">
                    Sau bước kiểm tra cảm biến quang học, khử khuẩn tia cực tím và đo đạc cơ học, thiết bị được tái cấp phép vào kho RENT sẵn sàng phục vụ lượt thuê tiếp theo.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-bold text-stone-800 pt-3 border-t border-stone-200">
                  <span className="material-symbols-outlined text-sm text-emerald-700">sync</span>
                  <span>Quay trở lại chu kỳ RENT tuần hoàn</span>
                </div>
              </div>

              <div className="bg-stone-50 rounded-2xl p-5 flex flex-col justify-between">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-200/70 text-amber-900 text-[10px] font-bold uppercase mb-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-700" />
                    NHÁNH B: CHUYỂN THÀNH THRIFT
                  </div>
                  <h4 className="hiw-serif font-bold text-sm text-stone-900 mb-1.5">Chuyển giao Second-Life</h4>
                  <p className="text-[11px] text-stone-600 leading-relaxed mb-4">
                    Khi đạt số vòng thuê tối đa theo tiêu chuẩn hoặc có hao mòn nhẹ về ngoại hình, thiết bị được niêm yết sang kho THRIFT với mức giá hợp lý và hồ sơ minh bạch.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-bold text-stone-800 pt-3 border-t border-stone-200">
                  <span className="material-symbols-outlined text-sm text-amber-800">all_inclusive</span>
                  <span>Trao tay người dùng mới → Tái sử dụng vĩnh viễn</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Section 4: Giỏ hàng thông minh ────────────────────────────── */}
        <section className="mb-16">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
            <div>
              <span className="text-[11px] font-bold tracking-widest text-stone-500 uppercase block mb-1">KIẾN TRÚC THÔNG MINH</span>
              <h2 className="hiw-serif text-2xl sm:text-3xl font-bold text-stone-900">
                04 · Cơ chế Giỏ hàng thông minh &amp; Tự động phân tách đơn
              </h2>
            </div>
            <p className="text-xs text-stone-600 max-w-md leading-relaxed">
              Trải nghiệm mua sắm và thuê đồ liền mạch trong một phiên thanh toán mà không làm lẫn lộn chính sách cọc và giao nhận.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center bg-stone-100 rounded-3xl p-8 lg:p-10 shadow-sm">
            <div className="lg:col-span-5 space-y-4">
              <h3 className="hiw-serif text-xl font-bold text-stone-900 leading-snug">
                Một giỏ hàng duy nhất.<br />
                Tự động định tuyến luồng giao dịch.
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Bạn có thể thêm đồng thời nhiều sản phẩm vào cùng một giỏ hàng. Hệ thống của ReUse Hub sẽ tự động nhận diện và phân loại:
              </p>
              <ul className="space-y-2 text-xs text-stone-700">
                <li className="flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-stone-900 text-sm mt-0.5">check_circle</span>
                  <span><strong>Mục RENT:</strong> Gom thành ĐƠN THUÊ kèm hợp đồng điện tử, lịch nhận - trả và tiền cọc hoàn lại.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-stone-900 text-sm mt-0.5">check_circle</span>
                  <span><strong>Mục THRIFT:</strong> Gom thành ĐƠN MUA sở hữu vĩnh viễn, thanh toán dứt điểm và giao hàng tiêu chuẩn.</span>
                </li>
              </ul>
            </div>

            <div className="lg:col-span-7 bg-stone-50 rounded-2xl p-6 shadow-sm">
              <div className="flex flex-col items-center">
                <div className="w-full max-w-sm bg-stone-900 text-white rounded-xl p-3.5 text-center mb-6 shadow-md">
                  <div className="flex items-center justify-center gap-2 text-xs font-bold tracking-wide">
                    <span className="material-symbols-outlined text-base">shopping_cart</span>
                    <span>GIỎ HÀNG ĐA NĂNG (UNIVERSAL CART)</span>
                  </div>
                  <span className="text-[10px] text-stone-400">Chứa cả sản phẩm Thuê và Mua</span>
                </div>
                <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Rent order */}
                  <div className="bg-stone-100 rounded-xl p-4 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-stone-200 text-stone-800">LUỒNG 1</span>
                        <span className="material-symbols-outlined text-stone-700 text-sm">schedule</span>
                      </div>
                      <h4 className="text-xs font-bold text-stone-900 mb-1">ĐƠN HÀNG RENT</h4>
                      <p className="text-[11px] text-stone-600 leading-relaxed mb-3">
                        Kích hoạt hợp đồng thuê điện tử, tiền cọc cách ly Smart Escrow và lịch hẹn chuyển phát 2 chiều.
                      </p>
                    </div>
                    <div className="text-[10px] font-semibold text-stone-500 pt-2 border-t border-stone-200">
                      Thanh toán: Phí ngày + Cọc hoàn lại
                    </div>
                  </div>
                  {/* Thrift order */}
                  <div className="bg-stone-100 rounded-xl p-4 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-200 text-amber-900">LUỒNG 2</span>
                        <span className="material-symbols-outlined text-amber-800 text-sm">inventory</span>
                      </div>
                      <h4 className="text-xs font-bold text-stone-900 mb-1">ĐƠN HÀNG THRIFT</h4>
                      <p className="text-[11px] text-stone-600 leading-relaxed mb-3">
                        Sở hữu dứt điểm, gắn kèm chứng thư thẩm định Audit Bench và xuất hóa đơn mua hàng vĩnh viễn.
                      </p>
                    </div>
                    <div className="text-[10px] font-semibold text-stone-500 pt-2 border-t border-stone-200">
                      Thanh toán: Giá sản phẩm + Ship
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Section 5: Cấu trúc chi phí ───────────────────────────────── */}
        <section className="mb-16">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
            <div>
              <span className="text-[11px] font-bold tracking-widest text-stone-500 uppercase block mb-1">TÀI CHÍNH BẢO ĐẢM</span>
              <h2 className="hiw-serif text-2xl sm:text-3xl font-bold text-stone-900">
                05 · Bảng cấu trúc chi phí &amp; Phương thức thanh toán
              </h2>
            </div>
            <p className="text-xs text-stone-600 max-w-md leading-relaxed">
              Không chi phí ẩn. Mọi khoản đặt cọc đều được đóng băng và hoàn trả minh bạch thông qua hệ thống ký quỹ Smart Escrow.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* RENT card */}
            <div className="bg-stone-100 rounded-3xl p-6 lg:p-8 shadow-sm">
              <div className="flex items-center justify-between pb-4 border-b border-stone-200 mb-6">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-stone-900">nest_clock_farsight_analog</span>
                  <h3 className="hiw-serif font-bold text-lg text-stone-900">Đơn thuê RENT</h3>
                </div>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-stone-200 text-stone-700">HOÀN CỌC 100%</span>
              </div>
              <div className="space-y-4">
                {[
                  { label: '1. Phí thuê theo ngày', val: 'Đơn giá × Số ngày', valCls: 'text-stone-600', desc: 'Tính chính xác theo khung thời gian nhận - trả mà bạn lựa chọn trên lịch trình.' },
                  { label: '2. Tiền cọc hoàn lại (Escrow Deposit)', val: 'Bảo đảm 100%', valCls: 'text-emerald-700 font-semibold', desc: 'Khoản cọc được khóa an toàn và tự động mở khóa hoàn trả 100% về tài khoản sau khi Shop Owner hoàn tất bước kiểm định.' },
                  { label: '3. Phí vận chuyển 2 chiều', val: 'Đồng kiểm hỏa tốc', valCls: 'text-stone-600', desc: 'Đã bao gồm chi phí thùng cứng chống sốc, niêm phong an ninh và phí shipper nhận lại tận nhà.' },
                ].map((r) => (
                  <div key={r.label} className="bg-stone-50 p-4 rounded-xl">
                    <div className="flex justify-between items-center text-xs font-semibold text-stone-900 mb-1">
                      <span>{r.label}</span>
                      <span className={`font-mono ${r.valCls}`}>{r.val}</span>
                    </div>
                    <p className="text-[11px] text-stone-500 leading-relaxed">{r.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* THRIFT card */}
            <div className="bg-stone-100 rounded-3xl p-6 lg:p-8 shadow-sm">
              <div className="flex items-center justify-between pb-4 border-b border-stone-200 mb-6">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-stone-900">storefront</span>
                  <h3 className="hiw-serif font-bold text-lg text-stone-900">Đơn mua THRIFT</h3>
                </div>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-amber-200 text-amber-900">MUA ĐỨT ĐOẠN</span>
              </div>
              <div className="space-y-4">
                {[
                  { label: '1. Giá sản phẩm niêm yết', val: 'Trọn gói độc bản', valCls: 'text-stone-900 font-semibold', desc: 'Đã bao gồm phí kiểm định độc bản Audit Bench, vệ sinh chuyên sâu và bảo hành cam kết 72 giờ đầu sử dụng.' },
                  { label: '2. Phí vận chuyển tiêu chuẩn', val: '1 chiều giao tận tay', valCls: 'text-stone-600', desc: 'Gói giao hàng bảo hiểm hàng giá trị cao từ kho Shop Owner trực tiếp đến địa chỉ của bạn.' },
                  { label: '3. Không phát sinh tiền cọc', icon: 'verified', valCls: 'text-emerald-800 font-semibold', desc: 'Bạn sở hữu sản phẩm vĩnh viễn ngay khi hoàn tất thanh toán và nhận đơn hàng.' },
                ].map((r) => (
                  <div key={r.label} className="bg-stone-50 p-4 rounded-xl">
                    <div className="flex justify-between items-center text-xs font-semibold text-stone-900 mb-1">
                      <span className={r.icon ? `text-emerald-800` : ''}>{r.label}</span>
                      {r.icon
                        ? <span className="material-symbols-outlined text-sm text-emerald-800">{r.icon}</span>
                        : <span className={`font-mono ${r.valCls}`}>{r.val}</span>}
                    </div>
                    <p className="text-[11px] text-stone-500 leading-relaxed">{r.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Payment notice */}
          <div className="bg-stone-900 text-white rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-5 shadow-sm">
            <div className="w-12 h-12 rounded-full bg-white/10 shrink-0 flex items-center justify-center text-amber-400">
              <span className="material-symbols-outlined text-2xl">shield_locked</span>
            </div>
            <div className="text-center sm:text-left">
              <h4 className="hiw-serif font-bold text-sm mb-1 text-white">Thanh toán bảo mật qua VNPay &amp; Ký quỹ ReUse Hub</h4>
              <p className="text-xs text-stone-300 leading-relaxed">
                Tất cả giao dịch được thanh toán trực tuyến bảo mật qua cổng VNPay (hỗ trợ VNPay QR, thẻ nội địa Napas, thẻ Visa/Mastercard quốc tế). Tiền cọc được bảo chứng an toàn qua hệ thống Smart Escrow của ReUse Hub.
              </p>
            </div>
          </div>
        </section>

        {/* ── Section 6: Phân định vai trò ───────────────────────────────── */}
        <section className="mb-16">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
            <div>
              <span className="text-[11px] font-bold tracking-widest text-stone-500 uppercase block mb-1">QUY CHUẨN VẬN HÀNH</span>
              <h2 className="hiw-serif text-2xl sm:text-3xl font-bold text-stone-900">
                06 · Phân định vai trò &amp; Bảo vệ tính nguyên bản của sàn
              </h2>
            </div>
            <p className="text-xs text-stone-600 max-w-md leading-relaxed">
              Hệ thống phân quyền nghiêm ngặt nhằm duy trì tính nguyên bản, tránh hàng giả, hàng kém chất lượng lọt vào hệ sinh thái.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Customer */}
            <div className="bg-stone-100 rounded-3xl p-6 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-stone-200 text-stone-900 flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-xl">person</span>
              </div>
              <span className="text-[10px] font-mono tracking-wider uppercase text-stone-500 block mb-1">NGƯỜI DÙNG</span>
              <h3 className="hiw-serif font-bold text-base text-stone-900 mb-4">KHÁCH HÀNG (CUSTOMER)</h3>
              <ul className="space-y-2.5 text-xs text-stone-600">
                {['Xem và tìm kiếm toàn bộ sản phẩm RENT & THRIFT','Quản lý giỏ hàng đa năng thông minh','Thuê sản phẩm ngắn hạn linh hoạt theo lịch','Mua sản phẩm THRIFT sở hữu vĩnh viễn','Theo dõi tiến trình đơn hàng và lịch hoàn cọc'].map((li) => (
                  <li key={li} className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-stone-800 text-sm mt-0.5">check</span>
                    <span>{li}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Shop Owner */}
            <div className="bg-stone-100 rounded-3xl p-6 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-stone-900 text-white flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-xl">store</span>
              </div>
              <span className="text-[10px] font-mono tracking-wider uppercase text-stone-500 block mb-1">ĐỐI TÁC ỦY QUYỀN</span>
              <h3 className="hiw-serif font-bold text-base text-stone-900 mb-4">CỬA HÀNG (SHOP OWNER)</h3>
              <ul className="space-y-2.5 text-xs text-stone-600">
                {['Tạo và niêm yết sản phẩm RENT chuẩn hóa','Quản lý tồn kho và bảo dưỡng thiết bị định kỳ','Xét duyệt lịch hẹn và đơn RENT trong 30 phút','Tiếp nhận và kiểm định sản phẩm sau khi trả về','Chuyển đổi sản phẩm hoàn chu kỳ sang THRIFT','Quản lý đóng gói thùng cứng và bàn giao giao nhận'].map((li) => (
                  <li key={li} className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-stone-800 text-sm mt-0.5">check</span>
                    <span>{li}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Admin */}
            <div className="bg-stone-100 rounded-3xl p-6 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-amber-200 text-amber-900 flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-xl">admin_panel_settings</span>
              </div>
              <span className="text-[10px] font-mono tracking-wider uppercase text-stone-500 block mb-1">CƠ QUAN ĐIỀU HÀNH</span>
              <h3 className="hiw-serif font-bold text-base text-stone-900 mb-4">QUẢN TRỊ VIÊN (ADMIN)</h3>
              <ul className="space-y-2.5 text-xs text-stone-600">
                {['Giám sát hoạt động toàn diện và giải quyết tranh chấp','Thẩm định danh tính KYC của người dùng và đối tác','Kiểm soát dòng tiền Escrow và vận hành sàn'].map((li) => (
                  <li key={li} className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-stone-800 text-sm mt-0.5">check</span>
                    <span>{li}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Warning callout */}
          <div className="bg-amber-50 rounded-2xl p-6 flex items-start gap-4 shadow-sm">
            <span className="material-symbols-outlined text-amber-700 text-2xl shrink-0 mt-0.5">warning</span>
            <div>
              <h4 className="font-semibold text-xs text-amber-900 uppercase tracking-wide mb-1">
                NGUYÊN TẮC VẬN HÀNH QUAN TRỌNG VỀ NGUỒN CUNG SẢN PHẨM
              </h4>
              <p className="text-xs text-amber-800/90 leading-relaxed">
                Khách hàng thông thường (User) không có quyền tự do đăng bán sản phẩm lên sàn. Toàn bộ nguồn hàng RENT và THRIFT đều được kiểm soát và cung ứng độc quyền bởi đối tác Shop Owner đã qua xác minh nhằm duy trì chất lượng kiểm định tuyệt đối.
              </p>
            </div>
          </div>
        </section>

        {/* ── CTA ────────────────────────────────────────────────────────── */}
        <section className="bg-stone-900 text-white rounded-3xl p-8 lg:p-14 text-center shadow-lg relative overflow-hidden mb-6">
          <div className="absolute -top-12 -left-12 w-64 h-64 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="relative z-10 max-w-2xl mx-auto">
            <span className="text-[11px] font-mono tracking-widest text-stone-400 uppercase block mb-3">BẮT ĐẦU TRẢI NGHIỆM</span>
            <h2 className="hiw-serif text-3xl sm:text-4xl font-bold mb-4 tracking-tight">
              Sẵn sàng gia nhập phong cách sống tuần hoàn?
            </h2>
            <p className="text-stone-300 text-xs sm:text-sm leading-relaxed mb-8 max-w-lg mx-auto">
              Trải nghiệm thuê các thiết bị chuyên nghiệp đỉnh cao hoặc tìm kiếm những báu vật lưu trữ đã được kiểm định chất lượng nghiêm ngặt.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link to="/rent" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-stone-900 text-xs font-semibold hover:bg-stone-200 transition-all shadow-md">
                <span>Khám phá danh mục RENT</span>
                <span className="material-symbols-outlined text-sm">schedule</span>
              </Link>
              <Link to="/thrift" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-stone-800 text-white text-xs font-semibold hover:bg-stone-700 transition-all">
                <span>Mua sắm đồ THRIFT</span>
                <span className="material-symbols-outlined text-sm">inventory_2</span>
              </Link>
              <Link to="/categories" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-transparent hover:bg-white/10 text-stone-300 text-xs font-semibold transition-all">
                <span>Xem danh mục sản phẩm</span>
                <span className="material-symbols-outlined text-sm">grid_view</span>
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

export default HowItWorks;
