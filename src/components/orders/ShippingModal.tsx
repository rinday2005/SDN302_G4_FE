import React, { useState } from 'react';

export interface ShippingData {
  carrier: string;
  trackingCode: string;
}

interface ShippingModalProps {
  isOpen: boolean;
  orderId: string;
  onClose: () => void;
  onSubmit: (orderId: string, data: ShippingData) => Promise<void> | void;
}

const CARRIERS = [
  { id: 'GHTK', name: 'Giao Hàng Tiết Kiệm (GHTK)' },
  { id: 'GHN', name: 'Giao Hàng Nhanh (GHN)' },
  { id: 'VIETTEL_POST', name: 'Viettel Post' },
  { id: 'VNPOST', name: 'Vietnam Post (VNPost)' },
  { id: 'AHAMOVE', name: 'Ahamove / GrabExpress' },
  { id: 'OTHER', name: 'Đơn vị khác' },
];

export const ShippingModal: React.FC<ShippingModalProps> = ({
  isOpen,
  orderId,
  onClose,
  onSubmit,
}) => {
  const [carrier, setCarrier] = useState(CARRIERS[0].id);
  const [trackingCode, setTrackingCode] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingCode.trim()) {
      setError('Vui lòng nhập mã vận đơn để tiếp tục');
      return;
    }

    try {
      setError('');
      setIsSubmitting(true);
      await onSubmit(orderId, {
        carrier,
        trackingCode: trackingCode.trim().toUpperCase(),
      });
      setTrackingCode('');
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Có lỗi xảy ra khi cập nhật đơn hàng.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-[#fdf9f2] w-full max-w-md rounded-2xl border border-[#dddad3] shadow-2xl p-6 relative">
        {/* Nút đóng */}
        <button
          onClick={onClose}
          type="button"
          disabled={isSubmitting}
          className="absolute top-4 right-4 text-[#78716c] hover:text-[#1c1c18] hover:bg-[#ebe8e1] rounded-lg p-1.5 transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-[20px] block">close</span>
        </button>

        {/* Tiêu đề */}
        <div className="mb-5">
          <h3 className="text-lg font-bold text-[#141310] font-serif">
            Xác nhận gửi hàng
          </h3>
          <p className="text-xs text-[#78716c] mt-1">
            Đơn hàng: <span className="font-mono font-semibold text-[#141310]">{orderId}</span>
          </p>
        </div>

        {/* Form nhập liệu */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {error && (
            <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm">error</span>
              {error}
            </div>
          )}

          {/* Chọn đơn vị vận chuyển */}
          <div>
            <label className="block font-semibold text-[#44403c] mb-1.5">
              Đơn vị vận chuyển <span className="text-rose-500">*</span>
            </label>
            <select
              value={carrier}
              onChange={(e) => setCarrier(e.target.value)}
              className="w-full h-10 px-3 bg-white border border-[#dddad3] rounded-xl text-xs text-[#1c1c18] focus:outline-none focus:ring-1 focus:ring-[#141310] focus:border-[#141310]"
            >
              {CARRIERS.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Nhập mã vận đơn */}
          <div>
            <label className="block font-semibold text-[#44403c] mb-1.5">
              Mã vận đơn / Tracking Code <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="VD: GHTK1092837482"
              value={trackingCode}
              onChange={(e) => {
                setTrackingCode(e.target.value);
                if (error) setError('');
              }}
              className="w-full h-10 px-3 bg-white border border-[#dddad3] rounded-xl text-xs font-mono uppercase text-[#1c1c18] focus:outline-none focus:ring-1 focus:ring-[#141310] focus:border-[#141310]"
            />
            <p className="text-[11px] text-[#78716c] mt-1">
              Hệ thống không dùng tài khoản Shipper nội bộ. Vui lòng nhập mã do đơn vị vận chuyển bên thứ ba cấp.
            </p>
          </div>

          {/* Nút hành động */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#dddad3]">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-[#57534e] hover:bg-[#ebe8e1] transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl bg-[#141310] text-white font-medium hover:bg-black transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                  <span>Đang cập nhật...</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[16px]">local_shipping</span>
                  <span>Xác nhận giao cho ĐVVC</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ShippingModal;