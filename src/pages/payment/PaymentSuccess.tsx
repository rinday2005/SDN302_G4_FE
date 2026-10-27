import React, { useMemo, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { recordBookedDates } from '../data/rent/rentOrderDetailData';

export const PaymentSuccess: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);

  const orderCode =
    params.get('orderCode') ||
    (params.get('vnp_TxnRef') ? params.get('vnp_TxnRef')!.split('_')[0] : 'RH-ORDER-2026');

  const rawAmount = params.get('amount') || params.get('vnp_Amount');
  const amount = rawAmount ? (Number(rawAmount) > 100000000 ? Number(rawAmount) / 100 : Number(rawAmount)) : 1500000;
  const formattedAmount = amount.toLocaleString('vi-VN') + '₫';

  const transactionNo = params.get('transactionNo') || params.get('vnp_TransactionNo') || 'VNP-14829910';
  const bankCode = params.get('bankCode') || params.get('vnp_BankCode') || 'NCB / VNPay-QR';
  const payDate = params.get('payDate') || new Date().toLocaleString('vi-VN');

interface StoredOrder {
  orderCode?: string;
  status?: string;
  paymentStatus?: string;
  transactionNo?: string;
  bankCode?: string;
  startDate?: string;
  endDate?: string;
  items?: Array<{ productId?: string | number; id?: string | number }>;
  [key: string]: unknown;
}

  // Update localStorage status strictly for the logged-in user
  useEffect(() => {
    try {
      const cleanTarget = orderCode.replace('#', '').trim().toLowerCase();
      const isThrift =
        cleanTarget.includes('trf') ||
        cleanTarget.includes('thf') ||
        cleanTarget.includes('thrift') ||
        params.get('type') === 'THRIFT';

      let uId = '';
      try {
        const userRaw = localStorage.getItem('user');
        if (userRaw) {
          const u = JSON.parse(userRaw);
          uId = u._id || u.id || '';
        }
      } catch {
        // ignore
      }

      if (isThrift) {
        // Cập nhật đơn hàng THRIFT trong tất cả các key liên quan
        const keys = [uId ? `user_thrift_orders_${uId}` : null, 'user_thrift_orders'].filter(Boolean) as string[];
        keys.forEach((thriftKey) => {
          const rawThrift = localStorage.getItem(thriftKey);
          if (rawThrift) {
            try {
              const thriftOrders: StoredOrder[] = JSON.parse(rawThrift);
              if (Array.isArray(thriftOrders)) {
                let updated = false;
                const newThriftOrders = thriftOrders.map((o: StoredOrder, idx: number) => {
                  const oCode = (o.orderCode || '').replace('#', '').trim().toLowerCase();
                  const isMatch =
                    oCode === cleanTarget ||
                    oCode.includes(cleanTarget) ||
                    cleanTarget.includes(oCode) ||
                    (idx === 0 && o.status === 'PENDING_PAYMENT');

                  if (isMatch) {
                    updated = true;
                    return {
                      ...o,
                      status: 'PAID',
                      paymentStatus: 'PAID',
                      escrowStatus: 'HELD_72H',
                      transactionNo,
                      bankCode,
                      paidAt: new Date().toISOString(),
                    };
                  }
                  return o;
                });
                if (updated) {
                  localStorage.setItem(thriftKey, JSON.stringify(newThriftOrders));
                }
              }
            } catch {
              // ignore
            }
          }
        });

        // Đồng bộ sang SHOP_THRIFT_ORDERS_DATA
        try {
          const shopRaw = localStorage.getItem('SHOP_THRIFT_ORDERS_DATA');
          if (shopRaw) {
            const shopOrders = JSON.parse(shopRaw);
            if (Array.isArray(shopOrders)) {
              let shopUpdated = false;
              const newShopOrders = shopOrders.map((so: { id?: string; _dbId?: string; status?: string; paymentStatus?: string }) => {
                const soCode = (so.id || so._dbId || '').replace('#', '').trim().toLowerCase();
                if (soCode === cleanTarget || soCode.includes(cleanTarget) || cleanTarget.includes(soCode)) {
                  shopUpdated = true;
                  return {
                    ...so,
                    status: 'PAID',
                    paymentStatus: 'PAID',
                  };
                }
                return so;
              });
              if (shopUpdated) {
                localStorage.setItem('SHOP_THRIFT_ORDERS_DATA', JSON.stringify(newShopOrders));
              }
            }
          }
        } catch {
          // ignore
        }
      } else if (uId) {
          // Cập nhật đơn hàng RENT
          const rentKey = `user_rental_orders_${uId}`;
          const raw = localStorage.getItem(rentKey);
          if (raw) {
            const orders: StoredOrder[] = JSON.parse(raw);
            if (Array.isArray(orders)) {
              let updated = false;
              const newOrders = orders.map((o: StoredOrder, idx: number) => {
                const oCode = (o.orderCode || '').replace('#', '').trim().toLowerCase();
                const isMatch =
                  oCode === cleanTarget ||
                  oCode.includes(cleanTarget) ||
                  cleanTarget.includes(oCode) ||
                  (idx === 0 && o.status === 'PENDING_PAYMENT');

                if (isMatch) {
                  updated = true;
                  if (o.startDate && o.endDate && Array.isArray(o.items)) {
                    o.items.forEach((it: { productId?: string | number; id?: string | number }) => {
                      const pid = String(it.productId || it.id || '');
                      if (pid) {
                        recordBookedDates(pid, o.startDate!, o.endDate!, `Đã có khách thuê đơn ${o.orderCode || cleanTarget}`);
                      }
                    });
                  }
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
                localStorage.setItem(rentKey, JSON.stringify(newOrders));
              }
            }
          }
        }

      // Clean up legacy global shared keys to prevent cross-account pollution
      localStorage.removeItem('user_rental_orders');
    } catch {
      // ignore
    }
  }, [orderCode, transactionNo, bankCode, params]);

  return (
    <div className="min-h-screen bg-[#FBF9F5] text-[#1E1E1E] font-sans antialiased flex flex-col justify-between">

      <main className="max-w-xl mx-auto w-full px-4 py-12 flex-1 flex flex-col justify-center">
        <div className="bg-white rounded-3xl p-8 sm:p-10 border border-[#E5E0D8] shadow-xl text-center space-y-6 animate-fade-in">
          {/* Success Check Icon */}
          <div className="w-20 h-20 rounded-full bg-[#E8EFE9] text-[#2D5A43] flex items-center justify-center mx-auto shadow-inner">
            <span className="material-symbols-outlined text-4xl font-bold">check_circle</span>
          </div>

          <div className="space-y-2">
            <span className="inline-block text-[10px] uppercase tracking-widest font-extrabold text-[#2D5A43] bg-[#E8EFE9] px-3 py-1 rounded-full">
              {orderCode.toUpperCase().includes('TRF')
                ? 'GIAO DỊCH THRIFT THÀNH CÔNG · SMART ESCROW 72H KÍCH HOẠT'
                : 'GIAO DỊCH VNPAY THÀNH CÔNG · SMART ESCROW KÍCH HOẠT'}
            </span>
            <h1 className="font-serif text-3xl font-bold text-[#1E1E1E]">
              Thanh toán thành công!
            </h1>
            <p className="text-xs text-stone-600 max-w-md mx-auto leading-relaxed">
              {orderCode.toUpperCase().includes('TRF')
                ? 'Hệ thống ReUse Hub đã xác nhận thanh toán mua hiện vật THRIFT qua cổng VNPay Sandbox. Tiền đã được ký quỹ bảo chứng an toàn 72H trước khi giải ngân.'
                : 'Hệ thống ReUse Hub đã xác nhận khoản thanh toán qua cổng VNPay Sandbox. Tiền cọc được bảo chứng an toàn và đơn hàng đang được chuẩn bị.'}
            </p>
          </div>

          {/* Receipt Breakdown Card */}
          <div className="bg-[#FBF9F5] rounded-2xl p-5 border border-[#EFECE6] text-xs text-left space-y-3 font-sans">
            <div className="flex justify-between items-center pb-2 border-b border-[#EFECE6]">
              <span className="text-stone-500 font-medium">Mã đơn hàng:</span>
              <span className="font-mono font-bold text-[#1E1E1E] text-sm">{orderCode}</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-[#EFECE6]">
              <span className="text-stone-500 font-medium">Số tiền thanh toán:</span>
              <span className="font-mono font-bold text-[#2D5A43] text-base">{formattedAmount}</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-[#EFECE6]">
              <span className="text-stone-500 font-medium">Mã giao dịch VNPay:</span>
              <span className="font-mono text-stone-800 font-semibold">{transactionNo}</span>
            </div>
            <div className="flex justify-between items-center pb-2 border-b border-[#EFECE6]">
              <span className="text-stone-500 font-medium">Phương thức:</span>
              <span className="text-stone-800 font-semibold">{bankCode}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-stone-500 font-medium">Thời gian hoàn tất:</span>
              <span className="text-stone-800">{payDate}</span>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate('/user/dashboard')}
              className="flex-1 py-3.5 px-4 rounded-xl bg-[#1E1E1E] text-white hover:bg-black text-xs font-bold uppercase tracking-wider transition-all shadow-sm cursor-pointer"
            >
              Về User Dashboard
            </button>
            <Link
              to={orderCode.toUpperCase().includes('TRF') ? '/thrift/orders' : '/rent/orders'}
              className="flex-1 py-3.5 px-4 rounded-xl bg-[#F5F2EB] text-[#1E1E1E] hover:bg-[#EAE5DB] text-xs font-bold uppercase tracking-wider transition-all text-center border border-[#E5E0D8]"
            >
              {orderCode.toUpperCase().includes('TRF') ? 'Xem Đơn Mua & Ký Quỹ Escrow' : 'Xem Hồ sơ & Đơn hàng'}
            </Link>
          </div>
        </div>
      </main>

      <footer className="text-center text-[11px] text-stone-500 py-6 border-t border-[#EFECE6]">
        ReUse Hub © 2026 · Cổng thanh toán VNPay Sandbox kết nối thành công
      </footer>
    </div>
  );
};

export default PaymentSuccess;
