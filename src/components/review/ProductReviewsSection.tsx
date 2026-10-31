import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { StarRating } from './StarRating';
import {
  getProductReviewsApi,
  createReviewApi,
  uploadReviewImageApi,
} from '../../services/review.api';
import type { ReviewItem, RatingSummary } from '../../services/review.api';
import { normalizeImageUrl } from '../../utils/imageUrl';
import { useAuth } from '../../hooks/useAuth';

export interface ProductReviewsSectionProps {
  productId: string;
  productTitle?: string;
  productImage?: string;
  productMode?: 'rent' | 'thrift';
  initialRating?: number;
  initialCount?: number;
  className?: string;
}

export const ProductReviewsSection: React.FC<ProductReviewsSectionProps> = ({
  productId,
  productTitle = 'Sản phẩm',
  productImage,
  productMode = 'rent',
  initialRating = 5.0,
  initialCount = 0,
  className = '',
}) => {
  const { user } = useAuth();
  const [successToast, setSuccessToast] = useState<string | null>(null);

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

  // Inline Review Composer state (người dùng tự review trực tiếp trên detail)
  const [showComposer, setShowComposer] = useState(false);
  const [newRating, setNewRating] = useState<number>(5);
  const [newComment, setNewComment] = useState<string>('');
  const [newImages, setNewImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load reviews từ BE/DB
  const fetchReviews = useCallback(() => {
    if (!productId) return;
    getProductReviewsApi(productId, page, 10)
      .then((res) => {
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
        setLoading(false);
      });
  }, [productId, page]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  // Lắng nghe sự kiện review mới từ order modal hoặc trang khác để cập nhật ngay lập tức
  useEffect(() => {
    const handleReviewUpdated = (e: Event) => {
      const customEvt = e as CustomEvent<ReviewItem>;
      if (customEvt.detail) {
        const rev = customEvt.detail;
        const targetPid = typeof rev.productId === 'object' && rev.productId !== null
          ? rev.productId._id
          : rev.productId;

        if (String(targetPid) === String(productId)) {
          fetchReviews();
        }
      }
    };

    window.addEventListener('product_review_updated', handleReviewUpdated);
    window.addEventListener('storage', fetchReviews);

    return () => {
      window.removeEventListener('product_review_updated', handleReviewUpdated);
      window.removeEventListener('storage', fetchReviews);
    };
  }, [productId, fetchReviews]);

  // Xử lý upload ảnh trong inline composer
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remaining = 5 - newImages.length;
    if (remaining <= 0) {
      setFormError('Tối đa 5 hình ảnh cho mỗi đánh giá.');
      return;
    }

    const filesToUpload = Array.from(files).slice(0, remaining);
    setIsUploading(true);
    setFormError(null);

    try {
      const urls: string[] = [];
      for (const file of filesToUpload) {
        if (!file.type.startsWith('image/')) continue;
        const url = await uploadReviewImageApi(file);
        if (url) urls.push(url);
      }
      setNewImages((prev) => [...prev, ...urls].slice(0, 5));
    } catch {
      setFormError('Không thể tải ảnh lên. Vui lòng thử lại.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = (idxToRemove: number) => {
    setNewImages((prev) => prev.filter((_, idx) => idx !== idxToRemove));
  };

  // Submit form tự review cmt ở detail
  const handleInlineSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setFormError('Vui lòng đăng nhập tài khoản để gửi đánh giá.');
      return;
    }

    if (newRating < 1 || newRating > 5) {
      setFormError('Vui lòng chọn số sao từ 1 đến 5 sao.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      const created = await createReviewApi({
        productId,
        productType: productMode === 'rent' ? 'RENT' : 'THRIFT',
        rating: newRating,
        comment: newComment.trim(),
        images: newImages,
      });

      // Cập nhật state cục bộ ngay lập tức
      setReviews((prev) => [created, ...prev.filter((r) => r._id !== created._id)]);
      setRatingSummary((prev) => {
        const newTotal = prev.totalReviews + 1;
        const dist = { ...prev.distribution };
        const rKey = created.rating as keyof typeof dist;
        if (dist[rKey] !== undefined) dist[rKey] += 1;
        const newAvg = Number(
          ((prev.averageRating * prev.totalReviews + created.rating) / newTotal).toFixed(1)
        );
        return { averageRating: newAvg, totalReviews: newTotal, distribution: dist };
      });

      // Reset form
      setNewComment('');
      setNewImages([]);
      setShowComposer(false);
      setSuccessToast('Đánh giá của bạn đã được lưu thành công vào cơ sở dữ liệu!');
      setTimeout(() => setSuccessToast(null), 4000);
    } catch (err: unknown) {
      const eObj = err as { response?: { data?: { message?: string } }; message?: string };
      setFormError(
        eObj.response?.data?.message || eObj.message || 'Không thể gửi đánh giá vào lúc này.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter reviews
  const filteredReviews = useMemo(() => {
    return reviews.filter((r) => {
      if (activeFilter === 'ALL') return true;
      if (activeFilter === 'WITH_IMAGE') return Array.isArray(r.images) && r.images.length > 0;
      const numFilter = parseInt(activeFilter, 10);
      return Math.round(r.rating) === numFilter;
    });
  }, [reviews, activeFilter]);

  // Format ngày
  const formatDate = (isoString?: string) => {
    if (!isoString) return 'Gần đây';
    try {
      const d = new Date(isoString);
      return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1)
        .toString()
        .padStart(2, '0')}/${d.getFullYear()}`;
    } catch {
      return 'Gần đây';
    }
  };

  return (
    <section
      id="product-reviews"
      className={`border-t border-[#E8E4DC] pt-12 mt-12 font-sans text-[#1C1A18] ${className}`}
    >
      {/* ── HEADER VÀ TIÊU ĐỀ ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-8 border-b border-[#E8E4DC]">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-widest text-[#5E6D5B] flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[15px]">verified_user</span>
            Đánh giá từ khách hàng thực tế · Đồng bộ DB
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold mt-1 text-[#1C1A18]">
            Đánh giá &amp; Nhận xét của cộng đồng
          </h2>
          <p className="text-xs sm:text-sm text-[#78736A] mt-1 max-w-xl">
            Các đánh giá và sao được lưu trữ trực tiếp trong cơ sở dữ liệu, phục vụ kiểm định chất lượng và hỗ trợ hệ thống AI phân tích sản phẩm.
          </p>
        </div>

        {/* Nút bật/tắt viết đánh giá trực tiếp */}
        <div>
          {user ? (
            <button
              type="button"
              onClick={() => setShowComposer(!showComposer)}
              className="px-5 py-2.5 rounded-xl bg-[#1C1A18] hover:bg-black text-white text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-base text-amber-400">rate_review</span>
              <span>{showComposer ? 'Đóng form đánh giá' : 'Viết đánh giá sản phẩm'}</span>
            </button>
          ) : (
            <Link
              to="/login"
              className="px-5 py-2.5 rounded-xl border border-[#1C1A18] hover:bg-[#1C1A18] hover:text-white text-[#1C1A18] text-xs font-bold transition-all flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-base">login</span>
              <span>Đăng nhập để đánh giá</span>
            </Link>
          )}
        </div>
      </div>

      {/* ── INLINE REVIEW COMPOSER (NGƯỜI DÙNG TỰ ĐÁNH GIÁ TRỰC TIẾP TẠI DETAIL) ── */}
      {showComposer && user && (
        <div className="my-8 p-6 bg-white rounded-3xl border border-[#E8E4DC] shadow-sm animate-fadeIn space-y-5">
          <div className="flex items-center justify-between border-b border-[#E8E4DC] pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#1C1A18] text-amber-400 flex items-center justify-center font-bold text-sm overflow-hidden border border-stone-700">
                {user.avatarUrl || user.avatar ? (
                  <img
                    src={normalizeImageUrl(user.avatarUrl || user.avatar)}
                    alt={user.fullName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{user.fullName.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div>
                <p className="text-xs font-bold text-[#1C1A18]">{user.fullName}</p>
                <span className="text-[10px] text-[#78736A]">
                  Tài khoản DB đã xác thực · {productMode === 'rent' ? 'Sản phẩm thuê' : 'Sản phẩm Thrift'}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowComposer(false)}
              className="text-stone-400 hover:text-stone-700"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>

          <form onSubmit={handleInlineSubmit} className="space-y-4">
            {/* Xem trước sản phẩm đang đánh giá */}
            <div className="flex items-center gap-3 p-3 bg-[#FBF9F5] rounded-2xl border border-[#E8E4DC]">
              {productImage && (
                <img
                  src={normalizeImageUrl(productImage)}
                  alt={productTitle}
                  className="w-12 h-12 rounded-xl object-cover border border-[#E8E4DC] shrink-0"
                />
              )}
              <div className="min-w-0">
                <span className="text-[10px] uppercase font-bold text-[#5E6D5B]">Đang đánh giá</span>
                <p className="text-xs font-bold text-[#1C1A18] truncate">{productTitle}</p>
              </div>
            </div>

            {/* Chọn sao */}
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-wider text-[#1C1A18] block">
                Mức độ hài lòng của bạn <span className="text-rose-500">*</span>
              </label>
              <StarRating
                value={newRating}
                onChange={(v) => setNewRating(v)}
                interactive={true}
                size="lg"
                showLabel={true}
              />
            </div>

            {/* Comment */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs">
                <label className="font-bold uppercase tracking-wider text-[#1C1A18]">
                  Nội dung đánh giá &amp; nhận xét
                </label>
                <span className="text-[11px] text-[#78736A]">{newComment.length}/2000 ký tự</span>
              </div>
              <textarea
                rows={3}
                maxLength={2000}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Nhận xét về chất lượng hiện vật, độ nguyên vẹn, tem niêm phong kiểm định hoặc quá trình giao nhận..."
                className="w-full bg-[#FBF9F5] p-3 rounded-2xl text-xs sm:text-sm text-[#1C1A18] border border-[#E8E4DC] focus:border-[#1C1A18] focus:bg-white outline-none transition-all placeholder:text-stone-400"
              />
            </div>

            {/* Upload ảnh */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <label className="font-bold uppercase tracking-wider text-[#1C1A18]">
                  Đăng tải hình ảnh thực tế (Tối đa 5 ảnh)
                </label>
                <span className="text-[11px] text-[#78736A]">{newImages.length}/5 ảnh</span>
              </div>

              <div className="flex flex-wrap gap-2.5 items-center">
                {newImages.map((imgUrl, idx) => (
                  <div
                    key={idx}
                    className="relative w-16 h-16 rounded-xl overflow-hidden border border-[#E8E4DC] shadow-2xs group"
                  >
                    <img
                      src={normalizeImageUrl(imgUrl)}
                      alt={`Ảnh review ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      className="absolute top-1 right-1 w-4 h-4 rounded-full bg-black/75 hover:bg-rose-600 text-white flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[10px]">close</span>
                    </button>
                  </div>
                ))}

                {newImages.length < 5 && (
                  <button
                    type="button"
                    disabled={isUploading}
                    onClick={() => fileInputRef.current?.click()}
                    className="w-16 h-16 rounded-xl border-2 border-dashed border-[#D5D0C6] hover:border-[#1C1A18] bg-[#FBF9F5] flex flex-col items-center justify-center text-stone-500 hover:text-stone-800 transition-colors cursor-pointer"
                  >
                    {isUploading ? (
                      <div className="w-4 h-4 border-2 border-[#1C1A18] border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-xl">add_a_photo</span>
                        <span className="text-[8px] font-bold mt-0.5">Thêm ảnh</span>
                      </>
                    )}
                  </button>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
                <span className="material-symbols-outlined text-base">error</span>
                <span>{formError}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowComposer(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-100"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isSubmitting || isUploading}
                className="px-5 py-2 rounded-xl bg-[#1C1A18] hover:bg-black text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Đang lưu vào DB...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-sm text-amber-400">send</span>
                    <span>Gửi đánh giá ngay</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── TỔNG QUAN XẾP HẠNG & PHÂN BỔ SAO ── */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 my-8 p-6 sm:p-8 bg-white rounded-3xl border border-[#E8E4DC] shadow-2xs">
        {/* Điểm trung bình */}
        <div className="md:col-span-4 flex flex-col items-center justify-center p-4 border-b md:border-b-0 md:border-r border-[#E8E4DC] text-center">
          <span className="text-5xl sm:text-6xl font-serif font-extrabold text-[#1C1A18]">
            {ratingSummary.averageRating.toFixed(1)}
          </span>
          <div className="mt-2">
            <StarRating value={ratingSummary.averageRating} size="lg" />
          </div>
          <p className="text-xs text-[#78736A] mt-2 font-medium">
            Dựa trên{' '}
            <strong className="text-[#1C1A18]">{ratingSummary.totalReviews}</strong> lượt đánh giá thực tế
          </p>
        </div>

        {/* Thanh phân bố từng mức sao (5 sao -> 1 sao) */}
        <div className="md:col-span-8 flex flex-col justify-center space-y-2">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = ratingSummary.distribution[star as keyof typeof ratingSummary.distribution] || 0;
            const pct = ratingSummary.totalReviews > 0
              ? Math.round((count / ratingSummary.totalReviews) * 100)
              : 0;

            return (
              <div key={star} className="flex items-center gap-3 text-xs">
                <button
                  type="button"
                  onClick={() => setActiveFilter(String(star) as ReviewFilterKey)}
                  className="w-12 font-bold text-left hover:text-amber-600 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <span>{star}</span>
                  <span className="material-symbols-outlined text-[13px] text-amber-400" style={{ fontVariationSettings: "'FILL' 1" }}>
                    star
                  </span>
                </button>
                <div className="flex-1 h-2.5 bg-[#F5F2EB] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-10 text-right text-[11px] text-[#78736A] font-mono">
                  {count} ({pct}%)
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── BỘ LỌC ĐÁNH GIÁ THEO SAO / HÌNH ẢNH ── */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <span className="text-xs font-bold text-[#78736A] mr-1">Lọc theo:</span>
        {[
          { key: 'ALL', label: `Tất cả (${ratingSummary.totalReviews})` },
          { key: '5', label: `5 sao (${ratingSummary.distribution[5] || 0})` },
          { key: '4', label: `4 sao (${ratingSummary.distribution[4] || 0})` },
          { key: '3', label: `3 sao (${ratingSummary.distribution[3] || 0})` },
          { key: '2', label: `2 sao (${ratingSummary.distribution[2] || 0})` },
          { key: '1', label: `1 sao (${ratingSummary.distribution[1] || 0})` },
          { key: 'WITH_IMAGE', label: 'Có hình ảnh' },
        ].map((tab) => {
          const isActive = activeFilter === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveFilter(tab.key as ReviewFilterKey)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#1C1A18] text-[#FBF9F5] shadow-xs'
                  : 'bg-white text-[#78736A] border border-[#E8E4DC] hover:border-stone-400 hover:text-[#1C1A18]'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── DANH SÁCH REVIEW TỪ DB ── */}
      {loading ? (
        <div className="p-12 text-center space-y-3 bg-white rounded-3xl border border-[#E8E4DC]">
          <div className="w-6 h-6 border-2 border-[#1C1A18] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-[#78736A]">Đang nạp đánh giá từ cơ sở dữ liệu...</p>
        </div>
      ) : filteredReviews.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-[#E8E4DC] space-y-3">
          <div className="w-14 h-14 rounded-full bg-[#F5F2EB] text-[#78736A] flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-3xl">chat_bubble_outline</span>
          </div>
          <h4 className="font-bold text-sm text-[#1C1A18]">
            {activeFilter === 'ALL'
              ? 'Chưa có đánh giá nào cho sản phẩm này'
              : 'Không có đánh giá nào phù hợp với bộ lọc đã chọn'}
          </h4>
          <p className="text-xs text-[#78736A] max-w-md mx-auto">
            Hãy là người đầu tiên trải nghiệm hiện vật và chia sẻ cảm nhận thực tế để hỗ trợ người dùng khác!
          </p>
          {user && !showComposer && (
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowComposer(true)}
                className="px-5 py-2.5 rounded-xl bg-[#1C1A18] hover:bg-black text-white text-xs font-bold shadow-xs cursor-pointer inline-flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-base text-amber-400">rate_review</span>
                <span>Viết đánh giá đầu tiên</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReviews.map((rev) => {
            const userName =
              typeof rev.userId === 'object' && rev.userId !== null
                ? rev.userId.fullName || 'Khách hàng ReUse Hub'
                : 'Khách hàng ReUse Hub';

            const userAvatar =
              typeof rev.userId === 'object' && rev.userId !== null
                ? rev.userId.avatarUrl || rev.userId.avatar
                : undefined;

            const dateStr = formatDate(rev.createdAt);

            return (
              <div
                key={rev._id}
                className="p-5 sm:p-6 bg-white rounded-3xl border border-[#E8E4DC] space-y-3 shadow-2xs hover:shadow-xs transition-shadow"
              >
                {/* Header reviewer */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#1C1A18] text-amber-400 flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden border border-[#E8E4DC]">
                      {userAvatar ? (
                        <img
                          src={normalizeImageUrl(userAvatar)}
                          alt={userName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span>{userName.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#1C1A18]">{userName}</span>
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <span className="material-symbols-outlined text-[12px]">verified</span>
                          {productMode === 'rent' ? 'Đã thuê tại ReUse Hub' : 'Đã mua tại ReUse Thrift'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <StarRating value={rev.rating} size="sm" />
                        <span className="text-[10px] text-[#78736A] font-medium">{dateStr}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Nội dung comment */}
                {rev.comment && (
                  <p className="text-xs sm:text-sm text-[#3E3A33] leading-relaxed whitespace-pre-line pl-13">
                    {rev.comment}
                  </p>
                )}

                {/* Thư viện ảnh chụp thực tế */}
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
                        <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pt-6 border-t border-[#E8E4DC] flex items-center justify-center gap-2 mt-6">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="px-3 py-1.5 rounded-lg border border-[#E8E4DC] text-xs font-semibold text-[#1C1A18] hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Trang trước
          </button>
          <span className="text-xs text-[#78736A] px-2 font-mono">
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

      {/* ── LIGHTBOX PHÓNG TO ẢNH ── */}
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
      {/* ── TOAST THÔNG BÁO THÀNH CÔNG ── */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1C1A18] text-[#FBF9F5] px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 text-xs sm:text-sm font-medium border border-stone-800 animate-fadeIn">
          <span className="material-symbols-outlined text-emerald-400 text-xl">check_circle</span>
          <span>{successToast}</span>
        </div>
      )}
    </section>
  );
};

export default ProductReviewsSection;
