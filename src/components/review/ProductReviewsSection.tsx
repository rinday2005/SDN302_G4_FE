import React, { useState, useEffect, useMemo } from 'react';
import { StarRating } from './StarRating';
import { getProductReviewsApi } from '../../services/review.api';
import type { ReviewItem, RatingSummary } from '../../services/review.api';
import { normalizeImageUrl } from '../../utils/imageUrl';
import { useAuth } from '../../hooks/useAuth';
import { ReviewModal } from './ReviewModal';

export interface ProductReviewsSectionProps {
  productId: string;
  productTitle?: string;
  productImage?: string;
  initialRating?: number;
  initialCount?: number;
  className?: string;
}

export const ProductReviewsSection: React.FC<ProductReviewsSectionProps> = ({
  productId,
  productTitle = 'Sản phẩm',
  productImage,
  initialRating = 5.0,
  initialCount = 0,
  className = '',
}) => {
  const { user } = useAuth();
  const userId = user?._id || user?.id;

  type ReviewFilterKey = 'ALL' | '5' | '4' | '3' | '2' | '1' | 'WITH_IMAGE';
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [ratingSummary, setRatingSummary] = useState<RatingSummary>({
    averageRating: initialRating,
    totalReviews: initialCount,
    distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: initialCount },
  });
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<ReviewFilterKey>('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Lightbox xem ảnh to
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  // Review Modal state khi người dùng bấm viết đánh giá
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  // Kiểm tra xem User có đơn hàng completed nào chứa sản phẩm này không
  const eligibleOrders = useMemo(() => {
    if (!userId) return [];

    try {
      const userOrdersRaw = localStorage.getItem(`user_rental_orders_${userId}`);
      if (userOrdersRaw) {
        const parsedOrders = JSON.parse(userOrdersRaw);
        if (Array.isArray(parsedOrders)) {
          return parsedOrders
            .filter((o) => {
              const isCompleted = o.status === 'COMPLETED' || o.isCompleted;
              const hasProduct = (o.items || []).some(
                (item: { productId?: string; id?: string }) =>
                  String(item.productId || item.id) === String(productId)
              );
              return isCompleted && hasProduct;
            })
            .map((o) => ({
              id: o._id || o.id,
              code: o.orderCode || o.code || `#${(o._id || o.id).slice(-8)}`,
              items: (o.items || []).map((it: { productId?: string; id?: string; title?: string; name?: string; image?: string; images?: Array<{ src: string }> }) => ({
                productId: String(it.productId || it.id || productId),
                title: it.title || it.name || productTitle,
                image: it.image || it.images?.[0]?.src || productImage,
              })),
            }));
        }
      }
    } catch (e) {
      console.warn('Không thể đọc đơn hàng của user:', e);
    }
    return [];
  }, [userId, productId, productTitle, productImage]);

  // Load reviews từ API
  useEffect(() => {
    if (!productId) return;

    let isMounted = true;

    getProductReviewsApi(productId, page, 10)
      .then((res) => {
        if (!isMounted) return;
        setReviews(res.reviews || []);
        if (res.ratingSummary) {
          setRatingSummary(res.ratingSummary);
        }
        if (res.pagination) {
          setTotalPages(res.pagination.totalPages || 1);
        }
      })
      .catch((err) => {
        console.warn('Lỗi lấy reviews:', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [productId, page]);

  // Callback khi gửi review thành công (AC: review thành công hiển thị ngay trong danh sách)
  const handleReviewSuccess = (newReview: ReviewItem) => {
    setReviews((prev) => [newReview, ...prev.filter((r) => r._id !== newReview._id)]);
    setRatingSummary((prev) => {
      const newTotal = prev.totalReviews + 1;
      const dist = { ...prev.distribution };
      const rKey = newReview.rating as keyof typeof dist;
      if (dist[rKey] !== undefined) {
        dist[rKey] += 1;
      }
      // Tính lại trung bình
      const newAvg = Number(
        (
          (prev.averageRating * prev.totalReviews + newReview.rating) /
          newTotal
        ).toFixed(1)
      );
      return {
        averageRating: newAvg,
        totalReviews: newTotal,
        distribution: dist,
      };
    });
  };

  // Format ngày
  const formatDate = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return '';
    }
  };

  // Filter reviews
  const filteredReviews = useMemo(() => {
    return reviews.filter((r) => {
      if (activeFilter === 'ALL') return true;
      if (activeFilter === 'WITH_IMAGE') return r.images && r.images.length > 0;
      return String(r.rating) === activeFilter;
    });
  }, [reviews, activeFilter]);

  const totalReviewsCount = ratingSummary.totalReviews || reviews.length;
  const avgRatingVal = ratingSummary.averageRating || initialRating;

  return (
    <section className={`bg-white rounded-3xl border border-[#E7E2DA] p-6 sm:p-8 shadow-sm space-y-8 ${className}`}>
      {/* ── HEADER CỦA SECTION REVIEW ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E7E2DA]/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#78736A]">
              Trải nghiệm thực tế
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
              <span className="material-symbols-outlined text-[13px] text-emerald-700">verified</span>
              100% Khách thuê &amp; mua xác thực
            </span>
          </div>
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#1C1A18] mt-1">
            Đánh giá &amp; Nhận xét từ cộng đồng ({totalReviewsCount})
          </h2>
        </div>

        {/* Nút Viết đánh giá */}
        {eligibleOrders.length > 0 && (
          <button
            type="button"
            onClick={() => setIsReviewModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-[#1C1A18] hover:bg-black text-white text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer self-start sm:self-auto"
          >
            <span className="material-symbols-outlined text-base text-amber-400">rate_review</span>
            <span>Viết đánh giá sản phẩm</span>
          </button>
        )}
      </div>

      {/* ── KHỐI RATING SUMMARY (TỔNG HỢP SAO VÀ PHÂN BỐ) ── */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center p-6 bg-[#FAF8F5] rounded-2xl border border-[#E8E4DC]">
        {/* Cột trái: Điểm số trung bình */}
        <div className="md:col-span-4 flex flex-col items-center justify-center text-center p-4 border-b md:border-b-0 md:border-r border-[#E8E4DC]">
          <span className="font-serif text-5xl sm:text-6xl font-bold text-[#1C1A18] tracking-tight">
            {avgRatingVal.toFixed(1)}
          </span>
          <div className="mt-2 mb-1">
            <StarRating value={avgRatingVal} size="md" />
          </div>
          <p className="text-xs text-[#78736A] font-medium">
            Dựa trên <strong>{totalReviewsCount}</strong> lượt đánh giá thực tế
          </p>
        </div>

        {/* Cột phải: Thanh phân bố 5 mức sao (5★ - 1★) */}
        <div className="md:col-span-8 space-y-2">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = ratingSummary.distribution[star as keyof typeof ratingSummary.distribution] || 0;
            const percentage = totalReviewsCount > 0 ? Math.round((count / totalReviewsCount) * 100) : 0;

            return (
              <div key={star} className="flex items-center gap-3 text-xs">
                <span className="w-10 text-right font-bold text-[#1C1A18] flex items-center justify-end gap-1">
                  <span>{star}</span>
                  <span className="material-symbols-outlined text-amber-400 text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                    star
                  </span>
                </span>

                <div className="flex-1 h-2.5 rounded-full bg-stone-200 overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full transition-all duration-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>

                <span className="w-12 text-stone-500 text-[11px] font-mono text-right">
                  {percentage}%
                </span>
                <span className="w-10 text-stone-400 text-[10px] text-right">({count})</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── BỘ LỌC ĐÁNH GIÁ (FILTER TABS) ── */}
      <div className="flex items-center gap-2 overflow-x-auto thin-scrollbar pb-1">
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#78736A] mr-1 shrink-0">
          Lọc theo:
        </span>
        {[
          { key: 'ALL', label: `Tất cả (${reviews.length})` },
          { key: 'WITH_IMAGE', label: 'Có hình ảnh' },
          { key: '5', label: '5 sao' },
          { key: '4', label: '4 sao' },
          { key: '3', label: '3 sao' },
          { key: '2', label: '2 sao' },
          { key: '1', label: '1 sao' },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveFilter(tab.key as ReviewFilterKey)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border ${
              activeFilter === tab.key
                ? 'bg-[#1C1A18] text-white border-[#1C1A18] shadow-2xs'
                : 'bg-white hover:bg-stone-50 text-[#5E5A53] border-[#E8E4DC]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── DANH SÁCH REVIEW (LIST) ── */}
      {loading ? (
        <div className="p-12 text-center text-xs text-[#78736A] space-y-2">
          <div className="w-6 h-6 border-2 border-[#1C1A18] border-t-transparent rounded-full animate-spin mx-auto" />
          <p>Đang tải danh sách nhận xét...</p>
        </div>
      ) : filteredReviews.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-[#FAF8F5] border border-[#E8E4DC] space-y-3">
          <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center mx-auto text-stone-400 shadow-2xs">
            <span className="material-symbols-outlined text-2xl">chat_bubble_outline</span>
          </div>
          <h4 className="font-serif font-bold text-base text-[#1C1A18]">
            {activeFilter === 'ALL'
              ? 'Chưa có nhận xét nào cho sản phẩm này'
              : 'Không có nhận xét nào phù hợp với bộ lọc'}
          </h4>
          <p className="text-xs text-[#78736A] max-w-md mx-auto">
            {activeFilter === 'ALL'
              ? 'Hãy là một trong những khách hàng đầu tiên thuê/mua thiết bị và để lại đánh giá thực tế!'
              : 'Vui lòng chọn bộ lọc khác để xem thêm nhận xét.'}
          </p>
        </div>
      ) : (
        <div className="divide-y divide-[#E8E4DC]/80 space-y-6">
          {filteredReviews.map((rev) => {
            const userName =
              typeof rev.userId === 'object' && rev.userId?.fullName
                ? rev.userId.fullName
                : 'Khách hàng ReUse Hub';

            const userAvatar =
              typeof rev.userId === 'object' && rev.userId?.avatarUrl
                ? normalizeImageUrl(rev.userId.avatarUrl)
                : '';

            const dateStr = formatDate(rev.createdAt);

            return (
              <div key={rev._id} className="pt-6 first:pt-0 space-y-3">
                {/* User info & Stars */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {userAvatar ? (
                      <img
                        src={userAvatar}
                        alt={userName}
                        className="w-10 h-10 rounded-full object-cover border border-[#E8E4DC]"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-[#EAE6DE] text-[#1C1A18] flex items-center justify-center font-bold text-xs">
                        {userName.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#1C1A18]">{userName}</span>
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.2 rounded-full">
                          <span className="material-symbols-outlined text-[12px]">verified</span>
                          Đã thuê tại ReUse Hub
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <StarRating value={rev.rating} size="sm" />
                        <span className="text-[10px] text-[#78736A] font-medium">{dateStr}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Comment body */}
                {rev.comment && (
                  <p className="text-xs sm:text-sm text-[#3E3A33] leading-relaxed whitespace-pre-line pl-13">
                    {rev.comment}
                  </p>
                )}

                {/* Attached photos gallery */}
                {rev.images && rev.images.length > 0 && (
                  <div className="flex flex-wrap gap-2.5 pl-13 pt-1">
                    {rev.images.map((imgUrl, imgIdx) => (
                      <div
                        key={imgIdx}
                        onClick={() => setZoomedImage(normalizeImageUrl(imgUrl))}
                        className="w-20 h-20 rounded-xl overflow-hidden border border-[#E8E4DC] cursor-pointer group relative shadow-2xs"
                      >
                        <img
                          src={normalizeImageUrl(imgUrl)}
                          alt={`Ảnh đánh giá ${imgIdx + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                          <span className="material-symbols-outlined text-lg">zoom_in</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination / Xem thêm */}
      {totalPages > 1 && (
        <div className="pt-4 border-t border-[#E8E4DC] flex items-center justify-center gap-2">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="px-3 py-1.5 rounded-lg border border-[#E8E4DC] text-xs font-semibold text-[#1C1A18] hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Trang trước
          </button>
          <span className="text-xs text-[#78736A] px-2">
            Trang {page} / {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="px-3 py-1.5 rounded-lg border border-[#E8E4DC] text-xs font-semibold text-[#1C1A18] hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Trang sau
          </button>
        </div>
      )}

      {/* ── LIGHTBOX MODAL XEM ẢNH TO ── */}
      {zoomedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs animate-fadeIn"
          onClick={() => setZoomedImage(null)}
        >
          <div className="relative max-w-4xl max-h-[85vh] p-2" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setZoomedImage(null)}
              className="absolute -top-10 right-0 p-1.5 rounded-full bg-white/20 hover:bg-white/40 text-white transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-2xl">close</span>
            </button>
            <img
              src={zoomedImage}
              alt="Ảnh phóng to"
              className="max-w-full max-h-[80vh] rounded-2xl object-contain shadow-2xl"
            />
          </div>
        </div>
      )}

      {/* ── MODAL ĐÁNH GIÁ ── */}
      {eligibleOrders.length > 0 && (
        <ReviewModal
          isOpen={isReviewModalOpen}
          onClose={() => setIsReviewModalOpen(false)}
          orderId={eligibleOrders[0].id}
          orderCode={eligibleOrders[0].code}
          orderItems={eligibleOrders[0].items}
          preselectedProductId={productId}
          onReviewSuccess={handleReviewSuccess}
        />
      )}
    </section>
  );
};

export default ProductReviewsSection;
