import React, { useMemo, useEffect, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';

export const PaymentFailed: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();
  const hasShownToast = useRef(false);

  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);

  const orderCode =
    params.get('orderCode') ||
    (params.get('vnp_TxnRef') ? params.get('vnp_TxnRef')!.split('_')[0] : 'RH-ORDER-2026');

  const responseCode = params.get('vnp_ResponseCode') || params.get('code') || '';
  const errorMessage =
    params.get('message') ||
    (responseCode === '24'
      ? 'Giao dịch bị hủy bởi người dùng trên cổng thanh toán VNPay Sandbox.'
      : 'Giao dịch thanh toán chưa thể hoàn tất. Vui lòng kiểm tra lại tài khoản hoặc phương thức.');

  useEffect(() => {
    if (!hasShownToast.current) {
      hasShownToast.current = true;
      toast.error(errorMessage);
    }
  }, [toast, errorMessage]);

  return (
    <div className="min-h-screen bg-[#FBF9F5] text-[#1E1E1E] font-sans antialiased flex flex-col justify-between">
      <aside className="bg-[#1E1E1E] text-[#E2DFD8] text-[11px] tracking-widest font-medium uppercase py-2 text-center border-b border-[#292724] px-4">
        REUSE HUB · KẾT QUẢ GIAO DỊCH VNPAY SANDBOX
      </aside>

      <main className="max-w-xl mx-auto w-full px-4 py-12 flex-1 flex flex-col justify-center">
        <div className="bg-white rounded-3xl p-8 sm:p-10 border border-[#E5E0D8] shadow-xl text-center space-y-6 animate-fade-in">
          {/* Failed Cross Icon */}
          <div className="w-20 h-20 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto shadow-inner">
            <span className="material-symbols-outlined text-4xl font-bold">cancel</span>
          </div>

          <div className="space-y-2">
            <span className="inline-block text-[10px] uppercase tracking-widest font-extrabold text-rose-700 bg-rose-100 px-3 py-1 rounded-full">
              {responseCode ? `GIAO DỊCH CHƯA HOÀN TẤT · MÃ LỖI ${responseCode}` : 'GIAO DỊCH CHƯA HOÀN TẤT'}
            </span>
            <h1 className="font-serif text-3xl font-bold text-[#1E1E1E]">
              Thanh toán không thành công
            </h1>
            <p className="text-xs text-stone-600 max-w-md mx-auto leading-relaxed">
              {errorMessage}
            </p>
          </div>

          {/* Details Card */}
          <div className="bg-[#FBF9F5] rounded-2xl p-5 border border-[#EFECE6] text-xs text-left space-y-3 font-sans">
            <div className="flex justify-between items-center pb-2 border-b border-[#EFECE6]">
              <span className="text-stone-500 font-medium">Mã đơn hàng:</span>
              <span className="font-mono font-bold text-[#1E1E1E]">{orderCode}</span>
            </div>
            {responseCode && (
              <div className="flex justify-between items-center pb-2 border-b border-[#EFECE6]">
                <span className="text-stone-500 font-medium">Mã phản hồi:</span>
                <span className="font-mono text-rose-600 font-bold">{responseCode}</span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-stone-500 font-medium">Trạng thái:</span>
              <span className="text-stone-800 font-semibold">Chưa thanh toán (Có thể thử lại)</span>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate('/cart')}
              className="flex-1 py-3.5 px-4 rounded-xl bg-[#1E1E1E] text-white hover:bg-black text-xs font-bold uppercase tracking-wider transition-all shadow-sm cursor-pointer"
            >
              Quay lại Giỏ hàng
            </button>
            <Link
              to="/user/dashboard"
              className="flex-1 py-3.5 px-4 rounded-xl bg-[#F5F2EB] text-[#1E1E1E] hover:bg-[#EAE5DB] text-xs font-bold uppercase tracking-wider transition-all text-center border border-[#E5E0D8]"
            >
              Về User Dashboard
            </Link>
          </div>
        </div>
      </main>

      <footer className="text-center text-[11px] text-stone-500 py-6 border-t border-[#EFECE6]">
        ReUse Hub © 2026 · Bạn có thể liên hệ Tổng đài Concierge nếu cần hỗ trợ
      </footer>
    </div>
  );
};

export default PaymentFailed;
