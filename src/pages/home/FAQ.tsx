import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AppSidebar } from '../../components/layout/AppSidebar';
import { FAQ_SECTIONS } from '../data/home/faqData';
import type { FaqSectionData } from '../data/home/faqData';


export const FAQ: React.FC = () => {
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
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({ 'rent-1': true });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const toggleItem = (id: string) => {
    setOpenItems(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const filteredSections = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    return FAQ_SECTIONS.map(section => {
      if (activeFilter !== 'all' && section.category !== activeFilter) {
        return null;
      }

      if (!query) {
        return section;
      }

      const matchingItems = section.items.filter(
        item => item.question.toLowerCase().includes(query) || item.answer.toLowerCase().includes(query)
      );

      if (matchingItems.length === 0) {
        return null;
      }

      return {
        ...section,
        items: matchingItems
      };
    }).filter((s): s is FaqSectionData => s !== null);
  }, [activeFilter, searchQuery]);

  return (
    <div className="w-full min-h-screen bg-[#FBF9F5] text-[#1C1A18] antialiased py-6 sm:py-10 px-4 sm:px-6 lg:px-8 faq-page-scope">
      {/* Vùng giới hạn độ rộng cân đối ở giữa trang */}
            {/* ── MAIN WORKSPACE CONTAINER WITH PERSISTENT SIDEBAR ── */}
      <div className="max-w-[1520px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 flex gap-8">
        {/* Navigation Sidebar */}
        <AppSidebar activeKey="faq" />

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

          <div className="w-full flex flex-col">
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap');
          @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap');

          .faq-page-scope {
            font-family: 'Plus Jakarta Sans', sans-serif !important;
          }

          .faq-page-scope .font-serif,
          .faq-page-scope h1,
          .faq-page-scope h2,
          .faq-page-scope h3 {
            font-family: 'Playfair Display', Georgia, serif !important;
          }

          .faq-page-scope .material-symbols-outlined {
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

          .no-scrollbar::-webkit-scrollbar {
            display: none;
          }
          .no-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        `}</style>

        {/* 1. BREADCRUMB */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-stone-500 mb-6 font-medium tracking-wide">
          <Link className="hover:text-stone-900 transition-colors" to="/">Trang chủ</Link>
          <span className="text-stone-300">/</span>
          <span className="text-stone-900 font-semibold">Câu hỏi thường gặp (FAQ)</span>
        </nav>

        {/* 2. HERO SECTION */}
        <section className="relative bg-[#F4F0EA] rounded-3xl p-8 lg:p-12 overflow-hidden mb-8 border border-[#E7E2DA] shadow-xs">
          <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-amber-100/50 rounded-full blur-3xl pointer-events-none"></div>
          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/80 border border-[#E7E2DA] text-stone-800 text-[11px] font-semibold tracking-widest uppercase mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-[#1C1A18]"></span>
              HỖ TRỢ · TRUNG TÂM GIẢI ĐÁP
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-[#1C1A18] leading-tight mb-4 tracking-tight">
              Câu hỏi thường gặp
            </h1>
            <p className="text-[#5E5A53] text-sm sm:text-base leading-relaxed mb-6 font-sans">
              Những điều bạn cần biết về thuê, mua và tái sử dụng.
            </p>

            {/* Ô tìm kiếm theo từ khóa */}
            <div className="relative max-w-lg">
              <input
                className="w-full bg-[#FBF9F5] border border-[#E7E2DA] rounded-xl py-3 pl-11 pr-4 text-xs text-[#1C1A18] placeholder-[#78736A] focus:outline-none focus:border-[#1C1A18] focus:ring-0 transition-colors shadow-xs"
                placeholder="Tìm câu hỏi theo từ khóa (tiền cọc, VNPay, kiểm định...)"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <span className="material-symbols-outlined absolute left-3.5 top-3 text-[#78736A] text-lg">search</span>
            </div>
          </div>
        </section>

        {/* 3. CATEGORY PILLS */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-8 no-scrollbar text-xs font-medium">
          {[
            { key: 'all', label: 'Tất cả' },
            { key: 'rent', label: 'Thuê đồ RENT', count: 8 },
            { key: 'thrift', label: 'Mua sắm THRIFT', count: 5 },
            { key: 'payment', label: 'Thanh toán & Cọc', count: 4 },
            { key: 'logistics', label: 'Vận chuyển', count: 2 },
            { key: 'cart', label: 'Giỏ hàng & Đơn', count: 2 },
            { key: 'account', label: 'Tài khoản & KYC', count: 4 },
            { key: 'shopowner', label: 'Cửa hàng Shop Owner', count: 4 },
            { key: 'circular', label: 'Tuần hoàn ReUse', count: 1 }
          ].map(pill => {
            const isActive = activeFilter === pill.key;
            return (
              <button
                key={pill.key}
                onClick={() => setActiveFilter(pill.key)}
                className={`shrink-0 px-4 py-2 rounded-full transition-all border ${
                  isActive
                    ? 'bg-[#1C1A18] text-white border-[#1C1A18] shadow-xs'
                    : 'bg-white text-[#5E5A53] border-[#E7E2DA] hover:bg-[#F4F0EA]'
                }`}
              >
                {pill.label}
                {pill.count !== undefined && (
                  <span className={`font-mono text-[10px] ml-1 ${isActive ? 'text-stone-300' : 'text-[#78736A]'}`}>
                    ({pill.count})
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* 4. FAQ SECTIONS ACCORDION */}
        <div className="space-y-10">
          {filteredSections.length === 0 ? (
            <div className="text-center py-16 bg-white border border-[#E7E2DA] rounded-3xl text-[#78736A] text-xs">
              Không tìm thấy câu hỏi phù hợp với từ khóa &quot;{searchQuery}&quot;.
            </div>
          ) : (
            filteredSections.map(section => (
              <section key={section.id} className="faq-section">
                <div className="flex items-center gap-3 pb-3 mb-4 border-b border-[#E7E2DA]">
                  <span className="w-7 h-7 rounded-lg bg-[#1C1A18] text-white flex items-center justify-center font-bold text-xs">
                    {section.number}
                  </span>
                  <div>
                    <h2 className="font-serif text-xl font-bold text-[#1C1A18]">{section.title}</h2>
                    <p className="text-[11px] text-[#78736A]">{section.description}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {section.items.map(item => {
                    const isOpen = Boolean(openItems[item.id] || (searchQuery.trim().length > 2));
                    return (
                      <div
                        key={item.id}
                        className="bg-white border border-[#E7E2DA] rounded-2xl overflow-hidden transition-all shadow-xs"
                      >
                        <button
                          type="button"
                          onClick={() => toggleItem(item.id)}
                          className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 font-semibold text-xs sm:text-sm text-[#1C1A18] hover:text-[#5E5A53] transition-colors"
                        >
                          <span>{item.question}</span>
                          <span
                            className={`material-symbols-outlined text-[#78736A] text-lg transition-transform duration-200 ${
                              isOpen ? 'transform rotate-180' : ''
                            }`}
                          >
                            expand_more
                          </span>
                        </button>

                        {isOpen && (
                          <div className="px-5 pb-5 pt-0 text-xs text-[#5E5A53] leading-relaxed border-t border-[#E7E2DA]/60 pt-3">
                            {item.answer}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            ))
          )}
        </div>

        {/* 5. CTA BOX AT BOTTOM */}
        <section className="mt-14 mb-6 bg-[#1C1A18] text-[#FBF9F5] rounded-3xl p-8 lg:p-12 text-center shadow-lg relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-64 h-64 bg-amber-500/10 rounded-full blur-2xl pointer-events-none"></div>
          <div className="relative z-10 max-w-xl mx-auto space-y-4">
            <span className="text-[10px] font-mono tracking-widest text-[#78736A] uppercase block">KẾT NỐI VỚI CHUYÊN VIÊN</span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Bạn vẫn cần hỗ trợ?
            </h2>
            <p className="text-[#E7E2DA]/80 text-xs sm:text-sm leading-relaxed">
              Đội ngũ chuyên viên tư vấn của ReUse Hub luôn sẵn sàng giải đáp mọi thắc mắc về điều khoản thuê, hợp đồng và quy trình bảo chứng.
            </p>
            <div className="pt-2">
              <Link
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-[#1C1A18] text-xs font-semibold hover:bg-[#F4F0EA] transition-all shadow-md group"
                to="/contact"
              >
                <span>Liên hệ ReUse Hub →</span>
              </Link>
            </div>
            <div className="pt-4 flex items-center justify-center gap-4 text-xs text-[#78736A]">
              <Link className="hover:text-white transition-colors underline decoration-[#78736A] underline-offset-4" to="/how-it-works">
                Xem Cách hoạt động
              </Link>
              <span>·</span>
              <Link className="hover:text-white transition-colors underline decoration-[#78736A] underline-offset-4" to="/about">
                Về ReUse Hub
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

export default FAQ;