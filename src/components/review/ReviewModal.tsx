import React, { useState, useEffect, useRef } from 'react';
import { StarRating } from './StarRating';
import {
  createReviewApi,
  getOrderReviewsApi,
  uploadReviewImageApi,
} from '../../services/review.api';
import type { ReviewItem } from '../../services/review.api';
import { normalizeImageUrl } from '../../utils/imageUrl';

export interface ReviewOrderItemProduct {
  productId: string;
  title: string;
  image?: string;
  category?: string;
  deposit?: number | string;
  price?: number | string;
}

export interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  orderCode?: string;
  orderItems: ReviewOrderItemProduct[];
  preselectedProductId?: string;
  onReviewSuccess?: (review: ReviewItem) => void;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({
  isOpen,
  onClose,
  orderId,
  orderCode,
  orderItems = [],
  preselectedProductId,
  onReviewSuccess,
}) => {
  // Danh sách các ID sản phẩm đã được đánh giá trong đơn hàng
  const [reviewedProductIds, setReviewedProductIds] = useState<string[]>([]);

  // Sản phẩm đang được chọn để đánh giá trong modal
  const [selectedProductId, setSelectedProductId] = useState<string>('');

  // Form states cho sản phẩm được chọn
  const [rating, setRating] = useState<number>(5); // Mặc định 5 sao (AC: 1 - 5 sao)
  const [comment, setComment] = useState<string>('');
  const [images, setImages] = useState<string[]>([]);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSelectProduct = (productId: string) => {
    setSelectedProductId(productId);
    setRating(5);
    setComment('');
    setImages([]);
    setErrorMessage(null);
  };

  // Lấy các review đã có của đơn hàng khi mở modal để chống duplicate review
  useEffect(() => {
    if (!isOpen || !orderId) return;

    let isMounted = true;

    getOrderReviewsApi(orderId)
      .then((res) => {
        if (!isMounted) return;
        const alreadyReviewed = (res.reviews || []).map((r) => {
          if (typeof r.productId === 'object' && r.productId !== null) {
            return String(r.productId._id);
          }
          return String(r.productId);
        });
        setReviewedProductIds(alreadyReviewed);

        // Chọn sản phẩm mặc định
        if (preselectedProductId && !alreadyReviewed.includes(preselectedProductId)) {
          setSelectedProductId(preselectedProductId);
        } else {
          // Chọn sản phẩm đầu tiên chưa đánh giá
          const firstUnreviewed = orderItems.find(
            (item) => !alreadyReviewed.includes(item.productId)
          );
          if (firstUnreviewed) {
            setSelectedProductId(firstUnreviewed.productId);
          } else if (orderItems.length > 0) {
            setSelectedProductId(orderItems[0].productId);
          }
        }
      })
      .catch((err) => {
        console.warn('Lỗi kiểm tra reviews đơn hàng:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, orderId, preselectedProductId, orderItems]);

  if (!isOpen) return null;

  const currentItem = orderItems.find((i) => i.productId === selectedProductId) || orderItems[0];
  const isCurrentItemReviewed = currentItem && reviewedProductIds.includes(currentItem.productId);
  const allItemsReviewed =
    orderItems.length > 0 &&
    orderItems.every((item) => reviewedProductIds.includes(item.productId));

  // Xử lý upload ảnh (tối đa 5 ảnh)
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = 5 - images.length;
    if (remainingSlots <= 0) {
      setErrorMessage('Mỗi đánh giá chỉ được đính kèm tối đa 5 hình ảnh.');
      return;
    }

    const filesToUpload = Array.from(files).slice(0, remainingSlots);
    setIsUploadingImage(true);
    setErrorMessage(null);

    try {
      const uploadedUrls: string[] = [];
      for (const file of filesToUpload) {
        if (!file.type.startsWith('image/')) {
          continue;
        }
        if (file.size > 10 * 1024 * 1024) {
          continue;
        }
        const url = await uploadReviewImageApi(file);
        if (url) {
          uploadedUrls.push(url);
        }
      }
      setImages((prev) => [...prev, ...uploadedUrls].slice(0, 5));
    } catch (err: unknown) {
      console.error('Upload ảnh review thất bại:', err);
      setErrorMessage('Không thể upload ảnh, vui lòng kiểm tra lại kết nối.');
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // Gửi đánh giá
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentItem) return;

    // AC: Rating chỉ từ 1 đến 5
    if (!rating || rating < 1 || rating > 5) {
      setErrorMessage('Vui lòng chọn số sao đánh giá hợp lệ từ 1 đến 5 sao.');
      return;
    }

    // AC: Không cho gửi duplicate review
    if (isCurrentItemReviewed) {
      setErrorMessage('Bạn đã gửi đánh giá cho sản phẩm này trong đơn hàng rồi.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const createdReview = await createReviewApi({
        orderId,
        productId: currentItem.productId,
        rating,
        comment: comment.trim(),
        images,
      });

      // Cập nhật state đã đánh giá ngay lập tức
      setReviewedProductIds((prev) => [...prev, currentItem.productId]);
      setSuccessToast(`Đánh giá sản phẩm "${currentItem.title}" thành công!`);

      // Callback để cập nhật ngay vào danh sách review bên ngoài (AC: review thành công hiển thị ngay)
      if (onReviewSuccess) {
        onReviewSuccess(createdReview);
      }

      // Tự động tìm sản phẩm tiếp theo chưa đánh giá trong đơn hàng
      const nextUnreviewed = orderItems.find(
        (item) => item.productId !== currentItem.productId && !reviewedProductIds.includes(item.productId)
      );

      if (nextUnreviewed) {
        setTimeout(() => {
          handleSelectProduct(nextUnreviewed.productId);
          setSuccessToast(null);
        }, 1500);
      } else {
        setTimeout(() => {
          setSuccessToast(null);
        }, 2500);
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { status?: number; data?: { message?: string } } };
      if (axiosErr.response?.status === 409) {
        // Duplicate review detection
        setErrorMessage('Bạn đã đánh giá sản phẩm này trong đơn hàng rồi. Không thể gửi lại.');
        setReviewedProductIds((prev) => [...prev, currentItem.productId]);
      } else {
        setErrorMessage(
          axiosErr.response?.data?.message || 'Có lỗi xảy ra khi gửi đánh giá. Vui lòng thử lại.'
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-[#E8E4DC] overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* MODAL HEADER */}
        <div className="px-6 py-4 bg-[#F8F6F1] border-b border-[#E8E4DC] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#1C1A18] text-white flex items-center justify-center shadow-xs">
              <span className="material-symbols-outlined text-xl text-amber-400">reviews</span>
            </div>
            <div>
              <h3 className="font-serif text-base sm:text-lg font-bold text-[#1C1A18]">
                Đánh giá chất lượng sản phẩm
              </h3>
              <p className="text-xs text-[#76726B]">
                Đơn thuê:{' '}
                <span className="font-mono font-semibold text-[#1C1A18]">
                  {orderCode || `#${orderId.slice(-8)}`}
                </span>{' '}
                · Chia sẻ trải nghiệm thực tế với cộng đồng
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white hover:bg-stone-100 border border-[#E8E4DC] text-stone-500 hover:text-stone-800 flex items-center justify-center transition-colors cursor-pointer"
            title="Đóng"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* NOTIFICATION TOAST */}
        {successToast && (
          <div className="mx-6 mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
            <span className="material-symbols-outlined text-base text-emerald-600">check_circle</span>
            <span>{successToast}</span>
          </div>
        )}

        {/* SCROLLABLE BODY */}
        <div className="p-6 overflow-y-auto thin-scrollbar space-y-6">
          {/* VỚI ORDER NHIỀU SẢN PHẨM: BỘ CHỌN SẢN PHẨM */}
          {orderItems.length > 1 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#76726B]">
                  Chọn sản phẩm trong đơn để đánh giá ({orderItems.length} sản phẩm):
                </span>
                <span className="text-[11px] text-[#76726B]">
                  Đã đánh giá: {reviewedProductIds.length}/{orderItems.length}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {orderItems.map((item) => {
                  const isReviewed = reviewedProductIds.includes(item.productId);
                  const isSelected = item.productId === selectedProductId;

                  return (
                    <button
                      key={item.productId}
                      type="button"
                      onClick={() => handleSelectProduct(item.productId)}
                      className={`p-2.5 rounded-2xl text-left border transition-all flex items-center gap-3 cursor-pointer ${
                        isSelected
                          ? 'border-[#1C1A18] bg-[#FAF8F5] ring-2 ring-[#1C1A18]/10'
                          : 'border-[#E8E4DC] hover:border-stone-400 bg-white'
                      }`}
                    >
                      {item.image ? (
                        <img
                          src={normalizeImageUrl(item.image)}
                          alt={item.title}
                          className="w-12 h-12 rounded-xl object-cover border border-[#E8E4DC] shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-stone-100 flex items-center justify-center text-stone-400 shrink-0">
                          <span className="material-symbols-outlined text-lg">image</span>
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-[#1C1A18] truncate">{item.title}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {isReviewed ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              <span className="material-symbols-outlined text-[12px]">check</span>
                              Đã đánh giá
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                              Chưa đánh giá
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* SẢN PHẨM HIỆN TẠI ĐANG REVIEW */}
          {currentItem && (
            <div className="p-4 bg-[#F8F6F1] rounded-2xl border border-[#E8E4DC] flex items-center gap-3.5">
              {currentItem.image && (
                <img
                  src={normalizeImageUrl(currentItem.image)}
                  alt={currentItem.title}
                  className="w-14 h-14 rounded-xl object-cover border border-[#E8E4DC] shrink-0"
                />
              )}
              <div className="min-w-0 flex-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#76726B]">
                  Sản phẩm được đánh giá
                </span>
                <h4 className="font-serif font-bold text-sm text-[#1C1A18] truncate mt-0.5">
                  {currentItem.title}
                </h4>
                {currentItem.category && (
                  <p className="text-[11px] text-[#76726B]">{currentItem.category}</p>
                )}
              </div>

              {isCurrentItemReviewed && (
                <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold shrink-0 flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">verified</span>
                  Đã đánh giá
                </span>
              )}
            </div>
          )}

          {/* NẾU SẢN PHẨM NÀY ĐÃ ĐƯỢC REVIEW (CHỐNG DUPLICATE) */}
          {isCurrentItemReviewed ? (
            <div className="p-6 text-center rounded-2xl bg-stone-50 border border-stone-200 space-y-3">
              <span className="material-symbols-outlined text-3xl text-emerald-600">
                task_alt
              </span>
              <h4 className="font-serif text-base font-bold text-[#1C1A18]">
                Bạn đã hoàn thành đánh giá cho sản phẩm này
              </h4>
              <p className="text-xs text-[#76726B] max-w-md mx-auto">
                Mỗi sản phẩm trong đơn hàng chỉ được gửi 1 lần đánh giá duy nhất để đảm bảo tính minh bạch và khách quan của hệ thống Smart Escrow.
              </p>

              {!allItemsReviewed && (
                <button
                  type="button"
                  onClick={() => {
                    const next = orderItems.find(
                      (item) => !reviewedProductIds.includes(item.productId)
                    );
                    if (next) handleSelectProduct(next.productId);
                  }}
                  className="px-4 py-2 rounded-xl bg-[#1C1A18] hover:bg-black text-white text-xs font-semibold cursor-pointer shadow-xs"
                >
                  Đánh giá sản phẩm tiếp theo
                </button>
              )}
            </div>
          ) : (
            /* FORM ĐÁNH GIÁ (KHI CHƯA REVIEW) */
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* 1. CHỌN SỐ SAO (AC: 1 - 5 sao) */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#1C1A18]">
                  1. Mức độ hài lòng của bạn <span className="text-rose-500">*</span>
                </label>
                <div className="p-4 bg-white rounded-2xl border border-[#E8E4DC] flex flex-col items-center justify-center text-center gap-1">
                  <StarRating
                    value={rating}
                    onChange={(val) => setRating(val)}
                    interactive={true}
                    size="xl"
                    showLabel={true}
                  />
                  <p className="text-[11px] text-[#76726B] mt-1">
                    Nhấp vào các ngôi sao để chấm điểm từ 1 đến 5 sao
                  </p>
                </div>
              </div>

              {/* 2. NHẬP COMMENT */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <label htmlFor="review-comment" className="font-bold uppercase tracking-wider text-[#1C1A18]">
                    2. Nhận xét chi tiết
                  </label>
                  <span className={`text-[11px] ${comment.length > 2000 ? 'text-rose-600 font-bold' : 'text-[#76726B]'}`}>
                    {comment.length}/2000 ký tự
                  </span>
                </div>
                <textarea
                  id="review-comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  maxLength={2000}
                  rows={4}
                  placeholder="Chia sẻ trải nghiệm sử dụng, độ chuẩn xác quang học/tình trạng hiện vật, thái độ hỗ trợ và quy trình bàn giao của Atelier..."
                  className="w-full p-3.5 bg-white rounded-2xl border border-[#E8E4DC] text-xs text-[#1C1A18] placeholder-stone-400 focus:outline-none focus:border-[#1C1A18] transition-colors leading-relaxed"
                />
              </div>

              {/* 3. UPLOAD ẢNH (TỐI ĐA 5 ẢNH) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-bold uppercase tracking-wider text-[#1C1A18]">
                    3. Hình ảnh chụp thực tế (Tối đa 5 ảnh)
                  </label>
                  <span className="text-[11px] text-[#76726B]">
                    Đã chọn: {images.length}/5 ảnh
                  </span>
                </div>

                <div className="flex flex-wrap gap-2.5 items-center">
                  {images.map((imgUrl, idx) => (
                    <div
                      key={idx}
                      className="relative w-20 h-20 rounded-2xl overflow-hidden border border-[#E8E4DC] group shadow-2xs"
                    >
                      <img
                        src={normalizeImageUrl(imgUrl)}
                        alt={`Ảnh đánh giá ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 hover:bg-rose-600 text-white flex items-center justify-center transition-colors cursor-pointer"
                        title="Xóa ảnh"
                      >
                        <span className="material-symbols-outlined text-[13px]">close</span>
                      </button>
                    </div>
                  ))}

                  {images.length < 5 && (
                    <button
                      type="button"
                      disabled={isUploadingImage}
                      onClick={() => fileInputRef.current?.click()}
                      className="w-20 h-20 rounded-2xl border-2 border-dashed border-[#D5D0C6] hover:border-[#1C1A18] bg-[#F8F6F1] hover:bg-[#F2EDE4] flex flex-col items-center justify-center text-stone-500 hover:text-stone-800 transition-colors cursor-pointer"
                    >
                      {isUploadingImage ? (
                        <div className="w-5 h-5 border-2 border-[#1C1A18] border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-2xl">add_photo_alternate</span>
                          <span className="text-[9px] font-bold mt-0.5">Thêm ảnh</span>
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

              {/* LỖI NẾU CÓ */}
              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
                  <span className="material-symbols-outlined text-base">error</span>
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* FOOTER ACTIONS */}
              <div className="pt-3 border-t border-[#E8E4DC] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl border border-[#D5D0C6] text-xs font-semibold text-[#1C1A18] hover:bg-stone-100 transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || isUploadingImage || isCurrentItemReviewed}
                  className="px-6 py-2.5 rounded-xl bg-[#1C1A18] hover:bg-black text-white text-xs font-bold shadow-sm transition-all cursor-pointer flex items-center gap-1.5 disabled:bg-stone-300 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Đang gửi đánh giá...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-sm text-amber-400">send</span>
                      <span>Gửi đánh giá</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReviewModal;
