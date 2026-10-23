import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';

export const PaymentReturn: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(true);

  // Parse query parameters from VNPay return
  const params = useMemo(() => {
    return new URLSearchParams(location.search);
  }, [location.search]);

  const responseCode = params.get('vnp_ResponseCode');
  const txnRef = params.get('vnp_TxnRef') || '';
  const rawAmount = params.get('vnp_Amount');
  const amount = rawAmount ? Number(rawAmount) / 100 : 0;
  const bankCode = params.get('vnp_BankCode') || 'NCB / VNPay';
  const transactionNo = params.get('vnp_TransactionNo') || '';
  const orderInfo = params.get('vnp_OrderInfo') || '';
  const payDateRaw = params.get('vnp_PayDate') || '';

  const isSuccess = responseCode === '00';

  // Format amount
  const formattedAmount = amount.toLocaleString('vi-VN') + '₫';

  // Format payDate from YYYYMMDDHHmmss to DD/MM/YYYY HH:mm:ss
  const formattedPayDate = useMemo(() => {
    if (payDateRaw && payDateRaw.length === 14) {
      const year = payDateRaw.substring(0, 4);
      const month = payDateRaw.substring(4, 6);
      const day = payDateRaw.substring(6, 8);
      const hour = payDateRaw.substring(8, 10);
      const minute = payDateRaw.substring(10, 12);
      const second = payDateRaw.substring(12, 14);
      return `${day}/${month}/${year} ${hour}:${minute}:${second}`;
    }
    return new Date().toLocaleString('vi-VN');
  }, [payDateRaw]);

  // Extract base order code (e.g. from RH-RNT-2026-8845_1728... or TRF-2026-9048_1728...)
  const orderCode = useMemo(() => {
    if (!txnRef) return 'RH-ORDER-2026';
    return txnRef.split('_')[0];
  }, [txnRef]);

  const isThriftOrder = useMemo(() => {
    return orderCode.toUpperCase().includes('TRF') || location.search.toUpperCase().includes('THRIFT');
  }, [orderCode, location.search]);

interface StoredOrder {
  orderCode?: string;
  status?: string;
  paymentStatus?: string;
  transactionNo?: string;
  bankCode?: string;
  [key: string]: unknown;
}

  // Update localStorage orders if successful
  useEffect(() => {
    if (isSuccess && orderCode) {
      try {
        const cleanTarget = orderCode.replace('#', '').trim().toLowerCase();
        let uId: string | null = null;
        try {
          const userRaw = localStorage.getItem('user');
          if (userRaw) {
            const u = JSON.parse(userRaw);
            uId = u._id || u.id || null;
          }
        } catch {
          // ignore
        }

        // Update all rental and thrift orders storage keys
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          const isCurrentUserKey = uId && key && (key === `user_rental_orders_${uId}` || key === `user_thrift_orders_${uId}`);

          if (key && key.startsWith('user_rental_orders')) {
            const raw = localStorage.getItem(key);
            if (raw) {
              const orders: StoredOrder[] = JSON.parse(raw);
              if (Array.isArray(orders)) {
                let updated = false;
                const newOrders = orders.map((o: StoredOrder, idx: number) => {
                  const oCode = (o.orderCode || '').replace('#', '').trim().toLowerCase();
                  const isMatch =
                    (cleanTarget && (oCode === cleanTarget || oCode.includes(cleanTarget) || cleanTarget.includes(oCode))) ||
                    (isCurrentUserKey && idx === 0 && o.status === 'PENDING_PAYMENT');

                  if (isMatch) {
                    updated = true;
                    // Bỏ qua shop owner & shipper trong môi trường test -> Chuyển thẳng Bước 5: DELIVERED (Chờ ký nhận CLA)
                    return {
                      ...o,
                      status: 'DELIVERED',
                      paymentStatus: 'PAID',
                      transactionNo,
                      bankCode,
                      deliveredAt: new Date().toISOString(),
                    };
                  }
                  return o;
                });
                if (updated) {
                  localStorage.setItem(key, JSON.stringify(newOrders));
                }
              }
            }
          }

          if (key && key.startsWith('user_thrift_orders')) {
            const raw = localStorage.getItem(key);
            if (raw) {
              const orders: StoredOrder[] = JSON.parse(raw);
              if (Array.isArray(orders)) {
                let updated = false;
                const newOrders = orders.map((o: StoredOrder, idx: number) => {
                  const oCode = (o.orderCode || '').replace('#', '').trim().toLowerCase();
                  const isMatch =
                    (cleanTarget && (oCode === cleanTarget || oCode.includes(cleanTarget) || cleanTarget.includes(oCode))) ||
                    (isCurrentUserKey && idx === 0 && o.status === 'PENDING_PAYMENT');

                  if (isMatch) {
                    updated = true;
                    return { ...o, status: isThriftOrder ? 'DELIVERED' : 'PAID', paymentStatus: 'PAID', escrowStatus: 'HELD_72H', transactionNo, bankCode };
                  }
                  return o;
                });
                if (updated) {
                  localStorage.setItem(key, JSON.stringify(newOrders));
                }
              }
            }
          }
        }
      } catch (e) {
        console.error('Error updating order status in localStorage:', e);
      }
    }

    const timer = setTimeout(() => {
      setIsProcessing(false);
    }, 600);
    return () => clearTimeout(timer);
  }, [isSuccess, orderCode, transactionNo, bankCode, isThriftOrder]);

  return (
    <div className="min-h-screen bg-[#FBF9F5] text-[#1E1E1E] font-sans antialiased flex flex-col justify-between">
      {/* Top Bar */}
      <aside className="bg-[#1E1E1E] text-[#E2DFD8] text-[11px] tracking-widest font-medium uppercase py-2 text-center border-b border-[#292724] px-4">
        REUSE HUB · CỔNG THANH TOÁN VNPAY SANDBOX KẾT QUẢ GIAO DỊCH
      </aside>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto w-full px-4 py-12 flex-1 flex flex-col justify-center">
        {isProcessing ? (
          <div className="bg-white rounded-3xl p-10 border border-[#E5E0D8] shadow-sm text-center space-y-4">
            <span className="w-10 h-10 border-3 border-[#2D5A43] border-t-transparent rounded-full animate-spin inline-block" />
            <p className="text-sm font-semibold text-stone-700">Đang đối soát kết quả giao dịch VNPay...</p>
          </div>
        ) : isSuccess ? (
          /* SUCCESS STATE */
          <div className="bg-white rounded-3xl p-8 sm:p-10 border border-[#E5E0D8] shadow-lg text-center space-y-6 animate-fade-in">
            <div className="w-20 h-20 rounded-full bg-[#E8EFE9] text-[#2D5A43] flex items-center justify-center mx-auto shadow-inner">
              <span className="material-symbols-outlined text-4xl font-bold">check_circle</span>
            </div>

            <div className="space-y-2">
              <span className="inline-block text-[11px] uppercase tracking-widest font-extrabold text-[#2D5A43] bg-[#E8EFE9] px-3 py-1 rounded-full">
                GIAO DỊCH THÀNH CÔNG · SMART ESCROW ACTIVE
              </span>
              <h1 className="font-serif text-3xl font-bold text-[#1E1E1E]">
                Thanh toán VNPay thành công!
              </h1>
              <p className="text-xs text-stone-600 max-w-md mx-auto leading-relaxed">
                Đơn hàng của quý khách đã được ghi nhận trên hệ thống ReUse Hub. Tiền cọc được khóa bảo chứng trong Smart Escrow an toàn.
              </p>
            </div>

            {/* Receipt Summary Card */}
            <div className="bg-[#FBF9F5] rounded-2xl p-5 border border-[#EFECE6] text-xs text-left space-y-3 font-sans">
              <div className="flex justify-between items-center pb-2 border-b border-[#EFECE6]">
                <span className="text-stone-500 font-medium">Mã đơn hàng:</span>
                <span className="font-mono font-bold text-[#1E1E1E] text-sm">{orderCode}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-[#EFECE6]">
                <span className="text-stone-500 font-medium">Số tiền đã thanh toán:</span>
                <span className="font-mono font-bold text-[#2D5A43] text-base">{formattedAmount}</span>
              </div>
              {transactionNo && (
                <div className="flex justify-between items-center pb-2 border-b border-[#EFECE6]">
                  <span className="text-stone-500 font-medium">Mã giao dịch VNPay:</span>
                  <span className="font-mono text-stone-800 font-semibold">{transactionNo}</span>
                </div>
              )}
              <div className="flex justify-between items-center pb-2 border-b border-[#EFECE6]">
                <span className="text-stone-500 font-medium">Ngân hàng / Cổng:</span>
                <span className="text-stone-800 font-semibold">{bankCode}</span>
              </div>
              {orderInfo && (
                <div className="flex justify-between items-center pb-2 border-b border-[#EFECE6]">
                  <span className="text-stone-500 font-medium">Nội dung giao dịch:</span>
                  <span className="text-stone-800 font-medium truncate max-w-[240px]">{orderInfo}</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-stone-500 font-medium">Thời gian hoàn tất:</span>
                <span className="text-stone-800">{formattedPayDate}</span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={() => navigate('/user/dashboard')}
                className="flex-1 py-3.5 px-4 rounded-xl bg-[#1E1E1E] text-white hover:bg-black text-xs font-bold uppercase tracking-wider transition-all shadow-sm cursor-pointer"
              >
                Về User Dashboard
              </button>
              <Link
                to={isThriftOrder ? `/thrift/orders?orderCode=${encodeURIComponent(orderCode)}` : '/rent/orders'}
                className="flex-1 py-3.5 px-4 rounded-xl bg-[#F5F2EB] text-[#1E1E1E] hover:bg-[#EAE5DB] text-xs font-bold uppercase tracking-wider transition-all text-center border border-[#E5E0D8]"
              >
                {isThriftOrder ? 'Xem Sổ Lệnh THRIFT' : 'Xem Hồ sơ & Đơn hàng'}
              </Link>
            </div>
          </div>
        ) : (
          /* FAILED OR CANCELLED STATE */
          <div className="bg-white rounded-3xl p-8 sm:p-10 border border-[#E5E0D8] shadow-lg text-center space-y-6 animate-fade-in">
            <div className="w-20 h-20 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto shadow-inner">
              <span className="material-symbols-outlined text-4xl font-bold">cancel</span>
            </div>

            <div className="space-y-2">
              <span className="inline-block text-[11px] uppercase tracking-widest font-extrabold text-rose-700 bg-rose-100 px-3 py-1 rounded-full">
                THANH TOÁN CHƯA HOÀN TẤT
              </span>
              <h1 className="font-serif text-3xl font-bold text-[#1E1E1E]">
                Giao dịch bị hủy hoặc không thành công
              </h1>
              <p className="text-xs text-stone-600 max-w-md mx-auto leading-relaxed">
                Giao dịch thanh toán qua VNPay Sandbox chưa được hoàn tất (Mã lỗi: {responseCode || 'CANCELLED'}). Bạn có thể thử lại bất kỳ lúc nào.
              </p>
            </div>

            {/* Detail */}
            <div className="bg-[#FBF9F5] rounded-2xl p-5 border border-[#EFECE6] text-xs text-left space-y-3 font-sans">
              <div className="flex justify-between items-center pb-2 border-b border-[#EFECE6]">
                <span className="text-stone-500 font-medium">Mã đơn hàng:</span>
                <span className="font-mono font-bold text-[#1E1E1E]">{orderCode}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-stone-500 font-medium">Số tiền:</span>
                <span className="font-mono font-bold text-stone-800">{formattedAmount}</span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={() => navigate('/cart')}
                className="flex-1 py-3.5 px-4 rounded-xl bg-[#1E1E1E] text-white hover:bg-black text-xs font-bold uppercase tracking-wider transition-all shadow-sm cursor-pointer"
              >
                Quay lại Giỏ Hàng
              </button>
              <Link
                to="/user/dashboard"
                className="flex-1 py-3.5 px-4 rounded-xl bg-[#F5F2EB] text-[#1E1E1E] hover:bg-[#EAE5DB] text-xs font-bold uppercase tracking-wider transition-all text-center border border-[#E5E0D8]"
              >
                Về User Dashboard
              </Link>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="text-center text-[11px] text-stone-500 py-6 border-t border-[#EFECE6]">
        ReUse Hub © 2026 · Nền tảng Cho thuê &amp; Sở hữu Tuần hoàn Thiết bị Cao cấp
      </footer>
    </div>
  );
};

export default PaymentReturn;
