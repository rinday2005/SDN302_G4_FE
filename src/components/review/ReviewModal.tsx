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
  orderType?: 'RENT' | 'THRIFT';
  orderItems: ReviewOrderItemProduct[];
  preselectedProductId?: string;
  onReviewSuccess?: (review: ReviewItem) => void;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({
  isOpen,
  onClose,
  orderId,
  orderCode,
  orderType = 'RENT',
  orderItems = [],
  preselectedProductId,
  onReviewSuccess,
}) => {
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Danh sách các ID sản phẩm đã được đánh giá trong đơn hàng
  const [reviewedProductIds, setReviewedProductIds] = useState<string[]>([]);

  // Sản phẩm đang được chọn để đánh giá trong modal
  const [selectedProductId, setSelectedProductId] = useState<string>('');

  // Form states cho sản phẩm được chọn
  const [rating, setRating] = useState<number>(5); // Mặc định 5 sao (1 - 5 sao)
  const [comment, setComment] = useState<string>('');
  const [images, setImages] = useState<string[]>([]);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

  const currentItem =
    orderItems.find((i) => i.productId === selectedProductId) || orderItems[0];
  const isCurrentItemReviewed =
    currentItem && reviewedProductIds.includes(currentItem.productId);
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
        if (!file.type.startsWith('image/')) continue;
        if (file.size > 10 * 1024 * 1024) continue;
        const url = await uploadReviewImageApi(file);
        if (url) {
          uploadedUrls.push(url);
        }
      }
      setImages((prev) => [...prev, ...uploadedUrls].slice(0, 5));
    } catch (err: unknown) {
      console.warn('Upload ảnh review thất bại:', err);
      setErrorMessage('Không thể tải ảnh lên. Vui lòng thử lại với ảnh nhỏ hơn 10MB.');
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

  // Submit form đánh giá
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId) {
      setErrorMessage('Vui lòng chọn sản phẩm cần đánh giá.');
      return;
    }

    if (rating < 1 || rating > 5) {
      setErrorMessage('Vui lòng chọn số sao đánh giá từ 1 đến 5 sao.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const newReview = await createReviewApi({
        orderId,
        productId: selectedProductId,
        productType: orderType,
        rating,
        comment: comment.trim(),
        images,
      });

      // Thêm sản phẩm vừa đánh giá vào danh sách đã review
      setReviewedProductIds((prev) => [...prev, selectedProductId]);

      setSuccessToast('Đánh giá sản phẩm thành công! Cảm ơn bạn đã đóng góp phản hồi.');

      if (onReviewSuccess) {
        onReviewSuccess(newReview);
      }

      // Tự động đóng modal sau 1.2s nếu tất cả sản phẩm đã review xong
      const remainingUnreviewed = orderItems.filter(
        (it) => it.productId !== selectedProductId && !reviewedProductIds.includes(it.productId)
      );

      if (remainingUnreviewed.length === 0) {
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        // Tự động chuyển sang sản phẩm tiếp theo chưa review
        setSelectedProductId(remainingUnreviewed[0].productId);
        setRating(5);
        setComment('');
        setImages([]);
      }
    } catch (err: unknown) {
      const eObj = err as { response?: { data?: { message?: string } }; message?: string };
      setErrorMessage(
        eObj.response?.data?.message || eObj.message || 'Gửi đánh giá thất bại. Vui lòng thử lại.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs animate-fadeIn overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative bg-[#FBF9F5] border border-[#E8E4DC] rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER MODAL */}
        <div className="bg-[#1C1A18] text-[#FBF9F5] px-6 py-5 flex items-center justify-between border-b border-stone-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400/20 text-amber-400 flex items-center justify-center">
              <span className="material-symbols-outlined text-[24px]">hotel_class</span>
            </div>
            <div>
              <h3 className="font-serif text-lg sm:text-xl font-bold">
                Đánh giá chất lượng sản phẩm
              </h3>
              <p className="text-xs text-stone-300 font-sans">
                {orderType === 'RENT' ? 'Đơn thuê tuần hoàn' : 'Đơn mua đồ cũ Thrift'} ·{' '}
                <span className="font-mono text-amber-300 font-bold">
                  {orderCode || `#${orderId.slice(-8)}`}
                </span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-stone-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* BODY MODAL */}
        <div className="p-6 sm:p-7 space-y-6 max-h-[75vh] overflow-y-auto font-sans">
          {/* TAB CHỌN SẢN PHẨM TRONG ĐƠN (NẾU ĐƠN CÓ NHIỀU MÓN) */}
          {orderItems.length > 1 && (
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[#76726B]">
                Chọn sản phẩm cần đánh giá trong đơn hàng ({orderItems.length} món)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {orderItems.map((item) => {
                  const isSelected = item.productId === selectedProductId;
                  const isReviewed = reviewedProductIds.includes(item.productId);

                  return (
                    <button
                      key={item.productId}
                      type="button"
                      onClick={() => handleSelectProduct(item.productId)}
                      className={`flex items-center gap-3 p-2.5 rounded-2xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'border-[#1C1A18] bg-white shadow-xs ring-1 ring-[#1C1A18]'
                          : 'border-[#E8E4DC] bg-[#F5F2EB]/60 hover:bg-white'
                      }`}
                    >
                      <img
                        src={normalizeImageUrl(item.image)}
                        alt={item.title}
                        className="w-12 h-12 rounded-xl object-cover border border-[#E8E4DC] shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-[#1C1A18] truncate">{item.title}</p>
                        {isReviewed ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md mt-0.5">
                            <span className="material-symbols-outlined text-[12px]">verified</span>
                            Đã đánh giá
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium text-amber-700">
                            Chưa đánh giá
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* SẢN PHẨM ĐANG CHỌN */}
          {currentItem && (
            <div className="flex items-center gap-3.5 p-3.5 bg-white rounded-2xl border border-[#E8E4DC] shadow-2xs">
              <img
                src={normalizeImageUrl(currentItem.image)}
                alt={currentItem.title}
                className="w-16 h-16 rounded-xl object-cover border border-[#E8E4DC] shrink-0"
              />
              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#5E6D5B]">
                  {orderType === 'RENT' ? 'Thiết bị lưu ký thuê' : 'Hiện vật ký gửi Thrift'}
                </span>
                <h4 className="text-sm font-bold text-[#1C1A18] truncate mt-0.5">
                  {currentItem.title}
                </h4>
                <p className="text-xs text-[#78736A] mt-0.5">
                  Mã tham chiếu: <span className="font-mono text-[11px]">{currentItem.productId}</span>
                </p>
              </div>
            </div>
          )}

          {/* NẾU TẤT CẢ SẢN PHẨM ĐÃ ĐƯỢC ĐÁNH GIÁ */}
          {allItemsReviewed && (
            <div className="p-6 text-center bg-emerald-50/80 border border-emerald-200 rounded-3xl space-y-2">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
                <span className="material-symbols-outlined text-2xl">check_circle</span>
              </div>
              <h4 className="font-bold text-sm text-emerald-950">
                Bạn đã hoàn thành đánh giá toàn bộ sản phẩm trong đơn hàng này!
              </h4>
              <p className="text-xs text-emerald-800 max-w-md mx-auto">
                Cảm ơn bạn đã đồng hành cùng cộng đồng ReUse Hub. Đánh giá của bạn giúp hệ thống AI phân tích và bảo đảm chất lượng tốt hơn.
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  Hoàn tất &amp; Đóng
                </button>
              </div>
            </div>
          )}

          {/* FORM ĐÁNH GIÁ */}
          {!isCurrentItemReviewed && (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* 1. CHỌN SỐ SAO (1 - 5 SAO) */}
              <div className="space-y-1.5 p-4 bg-white rounded-2xl border border-[#E8E4DC]">
                <label className="text-xs font-bold uppercase tracking-wider text-[#1C1A18] block">
                  1. Mức độ hài lòng của bạn <span className="text-rose-500">*</span>
                </label>
                <div className="pt-1">
                  <StarRating
                    value={rating}
                    onChange={(val) => setRating(val)}
                    interactive={true}
                    size="lg"
                    showLabel={true}
                  />
                </div>
              </div>

              {/* 2. NỘI DUNG NHẬN XÉT (TEXT COMMENT) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-bold uppercase tracking-wider text-[#1C1A18]">
                    2. Nhận xét chi tiết về sản phẩm &amp; trải nghiệm
                  </label>
                  <span className="text-[11px] text-[#76726B]">
                    {comment.length}/2000 ký tự
                  </span>
                </div>
                <textarea
                  rows={4}
                  maxLength={2000}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Chia sẻ về độ mới, ngoại hình thực tế, đóng gói niêm phong, hoạt động của máy, độ sạch sẽ..."
                  className="w-full bg-white p-3.5 rounded-2xl text-xs sm:text-sm text-[#1C1A18] border border-[#E8E4DC] focus:border-[#1C1A18] focus:ring-1 focus:ring-[#1C1A18] outline-none transition-all placeholder:text-stone-400"
                />
              </div>

              {/* 3. UPLOAD ẢNH CHỤP THỰC TẾ (TỐI ĐA 5 ẢNH) */}
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

              {/* THÔNG BÁO LỖI NẾU CÓ */}
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

          {/* Toast thông báo thành công */}
          {successToast && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-bold flex items-center gap-2 animate-fadeIn">
              <span className="material-symbols-outlined text-emerald-600 text-lg">check_circle</span>
              <span>{successToast}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReviewModal;
