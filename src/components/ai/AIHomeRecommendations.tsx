import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useShop } from '../../context/ShopContext';
import { AI_MOCK_PRODUCTS_DB, mapShopProductToAIRec } from '../../data/aiAssistantMockDb';

const formatVND = (n: number) => `${Math.round(n || 0).toLocaleString('vi-VN')}đ`;

export const AIHomeRecommendations: React.FC = () => {
  const navigate = useNavigate();
  const { products: shopProducts } = useShop();

  const triggerAI = (prompt?: string) => {
    window.dispatchEvent(
      new CustomEvent('open_reuse_ai', {
        detail: { prompt, openOnly: !prompt },
      })
    );
  };

  const featuredRecs = useMemo(() => {
    const liveApproved = shopProducts
      .filter((p) => p.approvalStatus === 'APPROVED' && p.isVisible)
      .slice(0, 3)
      .map((p) => mapShopProductToAIRec(p, 3, 350000));

    if (liveApproved.length >= 3) {
      return [...liveApproved, AI_MOCK_PRODUCTS_DB[3]];
    }
    return AI_MOCK_PRODUCTS_DB.slice(0, 4);
  }, [shopProducts]);

  return (
    <section className="py-12 px-6 lg:px-12 mx-auto max-w-7xl border-b border-[#E7E2DA]">
      <div className="rounded-2xl bg-gradient-to-br from-[#F5F3FF] via-[#FAF8FF] to-[#F3E8FF] text-stone-800 p-6 sm:p-8 border border-[#DDD6FE] shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-[#E9D5FF]">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EDE8F5] text-[#5B2C91] text-[11px] font-bold tracking-wide">
              <span className="material-symbols-outlined text-[15px]">smart_toy</span>
              <span>ReUse Hub AI · Context-Aware Recommendation</span>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl text-[#2E1065] font-semibold">
              Gợi ý trang phục thông minh từ ReUse AI
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
              Tìm kiếm đúng mẫu quần áo, đầm dạ hội, suit, giày dép hoặc phụ kiện bằng ngôn ngữ tự nhiên; so sánh chi tiết, ước tính chi phí thuê &amp; tiền đặt cọc Smart Escrow hoặc tư vấn nên thuê (RENT) hay mua thanh lý (THRIFT).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() =>
                triggerAI('Tìm đầm dạ hội đi tiệc sang trọng dưới 250.000đ/ngày')
              }
              className="px-4 py-2.5 rounded-xl bg-[#6D28D9] hover:bg-[#5B21B6] text-white text-xs font-semibold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
              <span>Thử hỏi AI tìm đầm dự tiệc</span>
            </button>
            <button
              type="button"
              onClick={() => triggerAI()}
              className="px-4 py-2.5 rounded-xl bg-white hover:bg-[#EDE9FE] border border-[#DDD6FE] text-[#5B21B6] text-xs font-semibold transition-all cursor-pointer shadow-2xs"
            >
              Mở cửa sổ ReUse AI
            </button>
          </div>
        </div>

        {/* Các câu hỏi gợi ý 1 chạm */}
        <div className="py-4 flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#5B21B6] mr-1">
            Hỏi nhanh AI:
          </span>
          {[
            'Tìm đầm dạ hội đi tiệc 3 ngày dưới 250.000đ/ngày',
            'Cho mình xem các mẫu giày cao gót và sneaker',
            'Tìm bộ Suit nam hoặc Áo khoác dạ dáng dài',
            'Tư vấn khi nào nên thuê (RENT) và khi nào nên mua (THRIFT)?',
          ].map((prompt, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => triggerAI(prompt)}
              className="px-3 py-1.5 rounded-full bg-white hover:bg-[#EDE9FE] border border-[#DDD6FE] text-xs text-[#4C1D95] transition-colors cursor-pointer shadow-2xs"
            >
              “{prompt}”
            </button>
          ))}
        </div>

        {/* Grid 4 Product Cards do AI đề xuất */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          {featuredRecs.map((prod) => (
            <div
              key={prod.id}
              className="p-4 rounded-2xl bg-white border border-[#E7E2DA] hover:border-[#7C3AED] shadow-2xs transition-all flex flex-col justify-between gap-3"
            >
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-16 h-16 rounded-xl bg-white p-1 shrink-0 overflow-hidden">
                    <img
                      src={prod.image}
                      alt={prod.name}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="inline-block px-2 py-0.5 rounded-full bg-[#D1FAE5] text-[#065F46] text-[10px] font-semibold mb-1">
                      {prod.budgetTag}
                    </span>
                    <h3 className="font-bold text-sm text-stone-900 line-clamp-2 leading-snug">
                      {prod.name}
                    </h3>
                  </div>
                </div>

                {prod.type === 'RENT' ? (
                  <div>
                    <div className="text-base font-extrabold text-[#059669]">
                      {formatVND(prod.pricePerDay || 180000)}/ngày
                    </div>
                    <div className="text-[11px] text-stone-600 mt-0.5">
                      {prod.calculatedDays || 3} ngày:{' '}
                      {formatVND(prod.calculatedTotalRent || (prod.pricePerDay || 180000) * 3)} tiền
                      thuê
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="text-base font-extrabold text-[#059669]">
                      {formatVND(prod.thriftPrice || 590000)} (THRIFT)
                    </div>
                    <div className="text-[11px] text-stone-400 mt-0.5">
                      {prod.conditionGrade} · Kho {prod.location}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => navigate(prod.detailUrl)}
                  className="flex-1 py-2 rounded-full border border-[#E2DDD5] hover:border-[#8B5CF6] bg-[#FAF8F5] hover:bg-[#F5F3FF] text-xs font-semibold text-stone-800 hover:text-[#5B21B6] transition-colors cursor-pointer"
                >
                  Xem sản phẩm
                </button>
                <button
                  type="button"
                  onClick={() => triggerAI(`Đánh giá ưu/nhược điểm của ${prod.name}`)}
                  title="Hỏi AI về sản phẩm này"
                  className="px-3 py-2 rounded-full bg-[#EDE9FE] hover:bg-[#6D28D9] text-xs font-semibold text-[#5B21B6] hover:text-white transition-colors cursor-pointer"
                >
                  Hỏi AI
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AIHomeRecommendations;
