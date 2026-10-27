import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { UserSidebar } from '../../components/layout/UserSidebar';
import { getMyRentalOrdersApi, type RentalOrderApi } from '../../services/order.api';

interface WalletTransaction {
  id: string;
  orderCode: string;
  productTitle: string;
  type: 'ESCROW_LOCK' | 'ESCROW_REFUND' | 'RENTAL_FEE' | 'WITHDRAW';
  amount: number;
  date: string;
  time: string;
  status: 'LOCKED' | 'PENDING_INSPECTION' | 'COMPLETED' | 'PROCESSING';
  statusLabel: string;
  note: string;
  gateway: string;
}

export const UserWallet: React.FC = () => {
  const { user } = useAuth();
  const uId = user?._id || user?.id || '';

  // Scroll to top
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // State
  const [orders, setOrders] = useState<RentalOrderApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ALL' | 'REFUND' | 'ESCROW'>('ALL');
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState<string>('2400000');
  const [bankName, setBankName] = useState<string>('NCB - Ngân hàng Quốc Dân (VNPay Test)');
  const [bankAccount, setBankAccount] = useState<string>('9704198526191432198');
  const [accountHolder, setAccountHolder] = useState<string>(user?.fullName || 'NGUYEN VAN HON');
  const [withdrawSuccess, setWithdrawSuccess] = useState<string | null>(null);
  const [isProcessingWithdraw, setIsProcessingWithdraw] = useState(false);

  // Dynamic user profile
  const displayName = user?.fullName || 'Khách hàng';
  const displayEmail = user?.email || '';

  // Track sidebar collapse
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

  // Currency formatter
  const formatVnd = (val: number) => {
    return (val || 0).toLocaleString('vi-VN') + '₫';
  };

  // Fetch real orders from BE & LocalStorage
  useEffect(() => {
    let isMounted = true;
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const res = await getMyRentalOrdersApi();
        const rawList = Array.isArray(res) ? res : [];
        const combinedOrders: RentalOrderApi[] = rawList.filter((o) => {
          const rId = typeof o.renterId === 'object' && o.renterId !== null
            ? (o.renterId as { _id?: string })._id
            : String(o.renterId || '');
          return !rId || !uId || rId === String(uId);
        });

        // Đồng bộ thêm các đơn trong localStorage nếu có trạng thái trả hàng mới hơn
        if (uId) {
          try {
            const localRaw = localStorage.getItem(`user_rental_orders_${uId}`);
            if (localRaw) {
              const localList = JSON.parse(localRaw);
              if (Array.isArray(localList)) {
                localList.forEach((lo) => {
                  if (lo.renterId && String(lo.renterId) !== String(uId)) return;
                  const matchIdx = combinedOrders.findIndex(
                    (o) =>
                      (o._id && lo._id && o._id === lo._id) ||
                      (o.orderCode && lo.orderCode && o.orderCode.replace('#', '') === lo.orderCode.replace('#', ''))
                  );
                  if (matchIdx >= 0) {
                    if (
                      ['RETURN_REQUESTED', 'RETURNING', 'RETURNED', 'COMPLETED'].includes(lo.status) &&
                      !['RETURN_REQUESTED', 'RETURNING', 'RETURNED', 'COMPLETED'].includes(combinedOrders[matchIdx].status)
                    ) {
                      combinedOrders[matchIdx] = { ...combinedOrders[matchIdx], ...lo };
                    }
                  } else if (combinedOrders.length === 0 && (lo.orderCode || lo._id)) {
                    combinedOrders.push(lo);
                  }
                });
              }
            }
          } catch {
            // ignore
          }
        }

        if (isMounted) {
          setOrders(combinedOrders);
        }
      } catch (err) {
        console.warn('Could not load orders for wallet:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchOrders();

    const handleWalletRefresh = () => {
      fetchOrders();
    };
    window.addEventListener('storage', handleWalletRefresh);
    window.addEventListener('rental_order_completed', handleWalletRefresh);
    window.addEventListener('wallet_balance_updated', handleWalletRefresh);

    return () => {
      isMounted = false;
      window.removeEventListener('storage', handleWalletRefresh);
      window.removeEventListener('rental_order_completed', handleWalletRefresh);
      window.removeEventListener('wallet_balance_updated', handleWalletRefresh);
    };
  }, [uId]);

  // Compute Financial Balances dynamically from all orders
  const financialSummary = useMemo(() => {
    let lockedEscrow = 0;
    let completedRefund = 0;
    let pendingInspectionEscrow = 0;
    const lockedItems: string[] = [];
    const pendingItems: string[] = [];
    const completedItems: string[] = [];

    orders.forEach((o) => {
      const dep = o.depositAmount || 0;
      const title =
        o.items?.[0]?.productName ||
        o.items?.[0]?.productTitle ||
        (o.items?.[0] as { title?: string })?.title ||
        'Sản phẩm thuê';
      const shortCode = (o.orderCode || '').replace('#', '').slice(-4);
      const itemLabel = `${title} (#${shortCode})`;

      if (['PAID', 'DELIVERED', 'RENTING', 'SHIPPING', 'HANDED_OVER'].includes(o.status)) {
        lockedEscrow += dep;
        lockedItems.push(itemLabel);
      } else if (['RETURN_REQUESTED', 'RETURNING', 'RETURNED'].includes(o.status)) {
        pendingInspectionEscrow += dep;
        pendingItems.push(itemLabel);
      } else if (o.status === 'COMPLETED') {
        completedRefund += dep;
        completedItems.push(itemLabel);
      }
    });

    // Số dư khả dụng (Đã hoàn cọc tự động về ví)
    let availableBalance = completedRefund;
    try {
      const savedBal = localStorage.getItem(`user_wallet_available_${uId}`) || localStorage.getItem('user_wallet_available_default');
      if (savedBal !== null && savedBal !== undefined && savedBal !== '') {
        availableBalance = Math.max(completedRefund, Number(savedBal) || 0);
      } else {
        availableBalance = completedRefund + pendingInspectionEscrow;
      }
    } catch {
      // ignore
    }

    return {
      lockedEscrow,
      pendingInspectionEscrow,
      completedRefund,
      availableBalance,
      totalDepositLifetime: lockedEscrow + pendingInspectionEscrow,
      lockedItems,
      pendingItems,
      completedItems,
    };
  }, [orders, uId]);

  // Tự động đồng bộ số tiền rút mặc định theo số dư khả dụng mới nhất
  const [prevAvailableBalance, setPrevAvailableBalance] = useState(financialSummary.availableBalance);
  if (prevAvailableBalance !== financialSummary.availableBalance) {
    setPrevAvailableBalance(financialSummary.availableBalance);
    if (financialSummary.availableBalance > 0) {
      setWithdrawAmount(String(financialSummary.availableBalance));
    }
  }

  // Dynamic Transaction Ledger derived from ALL real order events
  const transactions: WalletTransaction[] = useMemo(() => {
    const list: WalletTransaction[] = [];

    orders.forEach((o) => {
      const cleanCode = (o.orderCode || '').replace('#', '').trim();
      const displayCode = `#${cleanCode}`;
      const title: string =
        o.items?.[0]?.productName ||
        (o.items?.[0] as { productTitle?: string })?.productTitle ||
        (o.items?.[0] as { title?: string })?.title ||
        'Thiết bị thuê cao cấp';
      const dep = o.depositAmount || 0;

      const orderDate = o.createdAt ? new Date(o.createdAt) : new Date();
      const dateStr = orderDate.toLocaleDateString('vi-VN');
      const timeStr = orderDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

      // 1. Nếu đơn đang trong giai đoạn yêu cầu hoàn trả / đang thu hồi / chờ kiểm định
      if (['RETURN_REQUESTED', 'RETURNING', 'RETURNED'].includes(o.status)) {
        list.push({
          id: `TXN-RTN-${cleanCode || o._id}`,
          orderCode: displayCode,
          productTitle: title,
          type: 'ESCROW_REFUND',
          amount: dep,
          date: new Date().toLocaleDateString('vi-VN'),
          time: 'Vừa xong',
          status: 'PENDING_INSPECTION',
          statusLabel: 'CHỜ BENCH LAB DUYỆT (BƯỚC 8)',
          note: 'Đã nộp ảnh hiện trạng đối kiểm. Đang chờ bưu tá giao về trạm Bench Lab kiểm định để giải tỏa 100% cọc.',
          gateway: 'Nanuk Armored Doorstep · Escrow Vault',
        });
      }

      // 2. Nếu đơn đã hoàn tất kiểm định và hoàn cọc
      if (o.status === 'COMPLETED') {
        list.push({
          id: `TXN-RFD-${cleanCode || o._id}`,
          orderCode: displayCode,
          productTitle: title,
          type: 'ESCROW_REFUND',
          amount: dep,
          date: new Date().toLocaleDateString('vi-VN'),
          time: '14:30',
          status: 'COMPLETED',
          statusLabel: 'ĐÃ GIẢI TỎA 100% CỌC (BƯỚC 9)',
          note: 'Biên bản Bench Lab đối soát đạt chuẩn 100%. Tiền cọc đã giải tỏa vào số dư khả dụng.',
          gateway: 'VNPay Smart Escrow Hub',
        });
      }

      // 3. Giao dịch ký quỹ cọc ban đầu (ESCROW_LOCK)
      const isStillLocked = ['PAID', 'DELIVERED', 'RENTING', 'SHIPPING', 'HANDED_OVER'].includes(o.status);
      list.push({
        id: `TXN-LCK-${cleanCode || o._id}`,
        orderCode: displayCode,
        productTitle: title,
        type: 'ESCROW_LOCK',
        amount: dep,
        date: dateStr,
        time: timeStr,
        status: isStillLocked ? 'LOCKED' : 'COMPLETED',
        statusLabel: isStillLocked ? 'ĐANG LƯU KÝ (BƯỚC 6)' : 'ĐÃ KHÓA ESCROW',
        note: isStillLocked
          ? 'Tiền cọc được khóa độc lập bảo chứng 2 chiều theo hợp đồng Smart Escrow trong suốt kỳ hạn thuê.'
          : 'Thanh toán ký quỹ thành công qua cổng thanh toán VNPay Sandbox.',
        gateway: 'VNPay Sandbox · NAPAS 256-bit HSM',
      });
    });

    // Sắp xếp: Giao dịch Hoàn cọc (ESCROW_REFUND) / Mới nhất lên đầu
    list.sort((a, b) => {
      if (a.type === 'ESCROW_REFUND' && b.type !== 'ESCROW_REFUND') return -1;
      if (b.type === 'ESCROW_REFUND' && a.type !== 'ESCROW_REFUND') return 1;
      return 0;
    });

    return list;
  }, [orders]);

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    if (activeTab === 'REFUND') {
      return transactions.filter((t) => t.type === 'ESCROW_REFUND');
    }
    if (activeTab === 'ESCROW') {
      return transactions.filter((t) => t.type === 'ESCROW_LOCK');
    }
    return transactions;
  }, [transactions, activeTab]);

  // Quick Bench Lab Approval Simulation (Chuyển toàn bộ đơn chờ duyệt sang COMPLETED)
  const handleSimulateBenchLabApproval = () => {
    if (!orders.some((o) => ['RETURN_REQUESTED', 'RETURNING', 'RETURNED'].includes(o.status))) return;
    const updated = orders.map((o) => {
      if (['RETURN_REQUESTED', 'RETURNING', 'RETURNED'].includes(o.status)) {
        return { ...o, status: 'COMPLETED' };
      }
      return o;
    });
    setOrders(updated);
    if (uId) {
      try {
        localStorage.setItem(`user_rental_orders_${uId}`, JSON.stringify(updated));
      } catch {
        // ignore
      }
    }
  };

  // Handle Mock Withdrawal
  const handleWithdraw = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessingWithdraw(true);
    setTimeout(() => {
      setIsProcessingWithdraw(false);
      setWithdrawSuccess(
        `Lệnh rút ${formatVnd(Number(withdrawAmount))} về tài khoản ${bankName} (${bankAccount}) đã được gửi tới hệ thống thanh toán VNPay Sandbox. Mã đối soát: VNP-WD-${Date.now().toString().slice(-6)}`
      );
      try {
        localStorage.setItem(`user_wallet_available_${uId}`, '0');
      } catch {
        // ignore
      }
    }, 1200);
  };

  return (
    <div className="w-full min-h-screen bg-[#FBF9F5] text-[#22201D] font-sans antialiased selection:bg-[#E8E2D5]">
      {/* ── MAIN WORKSPACE CONTAINER WITH PERSISTENT SIDEBAR ── */}
      <div className="max-w-[1520px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 flex gap-8">
        {/* User Navigation Sidebar */}
        <UserSidebar
          activeKey="wallet"
          displayName={displayName}
          displayEmail={displayEmail}
        />

        {/* ── MAIN WALLET CONTENT AREA ── */}
        <main className="flex-1 min-w-0 space-y-8">
          <div className="flex flex-col w-full space-y-6">
            {/* Quick inline restore chip if collapsed */}
            {isSidebarCollapsed && (
              <div className="flex items-center gap-2 mb-2 animate-fade-in">
                <button
                  type="button"
                  onClick={() => window.dispatchEvent(new CustomEvent('reuse_user_sidebar_toggle', { detail: false }))}
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white border border-[#E8E4DC] text-xs font-semibold text-[#1C1A18] hover:bg-[#F6F3EE] hover:border-[#1C1A18]/40 transition-all shadow-2xs cursor-pointer group"
                >
                  <span className="material-symbols-outlined text-[18px] text-[#5E6D5B] group-hover:scale-110 transition-transform">
                    menu
                  </span>
                  <span>Hiện menu điều hướng</span>
                </button>
              </div>
            )}

            {/* Breadcrumb Navigation */}
            <div className="flex items-center gap-2 text-xs">
              <Link to="/" className="font-mono uppercase tracking-wider text-[#7B766F] hover:text-[#141310] transition-colors">
                Trang chủ
              </Link>
              <span className="text-[#CCC5BC]">/</span>
              <Link to="/user/dashboard" className="font-mono uppercase tracking-wider text-[#7B766F] hover:text-[#141310] transition-colors">
                Tài khoản
              </Link>
              <span className="text-[#CCC5BC]">/</span>
              <span className="font-mono uppercase tracking-wider text-[#141310] font-semibold">
                Ví lưu ký Smart Escrow &amp; Hoàn cọc
              </span>
            </div>

            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-[#E8E4DC]/60">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#EAE6DD] text-[#22201D] text-[11px] font-semibold tracking-wide">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#4A6B53]" />
                    Smart Escrow 24/7 · Bảo chứng tuần hoàn
                  </span>
                  <span className="text-xs text-[#76726B]">Chủ tài khoản: {displayName}</span>
                </div>
                <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-[#22201D] tracking-tight">
                  Ví lưu ký Smart Escrow
                </h1>
                <p className="text-xs sm:text-sm text-[#76726B] mt-1 max-w-xl">
                  Quản trị toàn diện số dư ký quỹ đảm bảo thiết bị, theo dõi trạng thái giải tỏa hoàn 100% tiền cọc tự động qua hợp đồng lưu ký bảo chứng Smart Escrow ReUse Hub.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsWithdrawModalOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#22201D] hover:bg-black text-white text-xs font-bold shadow-md transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[17px]">account_balance</span>
                  <span>Rút tiền về tài khoản ngân hàng</span>
                </button>
                <Link
                  to="/how-it-works"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white hover:bg-[#F6F3EE] border border-[#E8E4DC] text-xs font-semibold text-[#76726B] hover:text-[#22201D] transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">verified_user</span>
                  <span className="hidden sm:inline">Quy chế hoàn cọc</span>
                </Link>
              </div>
            </div>

                        {/* ── TỔNG QUAN TÀI SẢN KÝ QUỸ SMART ESCROW TOÀN BỘ ĐƠN ── */}
            <div className="bg-[#22201D] text-white rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-5 border border-[#3A3631]">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center shrink-0 border border-white/10">
                  <span className="material-symbols-outlined text-[26px] text-[#A3E635]">shield_with_heart</span>
                </div>
                <div>
                  <div className="text-[11px] uppercase font-mono tracking-widest text-[#B3AEA5]">
                    Tổng giá trị bảo chứng Smart Escrow (Tất cả đơn)
                  </div>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="font-serif text-3xl sm:text-4xl font-bold text-white tracking-tight">
                      {formatVnd(financialSummary.totalDepositLifetime)}
                    </span>
                    <span className="text-xs text-[#A3E635] font-semibold bg-[#A3E635]/15 px-2.5 py-0.5 rounded-full border border-[#A3E635]/30">
                      Bảo đảm an toàn 100%
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 sm:gap-6 pt-3 md:pt-0 border-t md:border-t-0 border-white/10 text-xs text-[#D8D4CC]">
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-mono text-[#8C867D]">Đang thu hồi &amp; Đối soát</span>
                  <span className="font-serif text-base font-bold text-[#E9D5FF]">
                    {formatVnd(financialSummary.pendingInspectionEscrow)}
                  </span>
                </div>
                <div className="w-px h-8 bg-white/10 hidden sm:block" />
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-mono text-[#8C867D]">Đang lưu hành</span>
                  <span className="font-serif text-base font-bold text-white">
                    {formatVnd(financialSummary.lockedEscrow)}
                  </span>
                </div>
                <div className="w-px h-8 bg-white/10 hidden sm:block" />
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-mono text-[#8C867D]">Số dư khả dụng</span>
                  <span className="font-serif text-base font-bold text-[#A3E635]">
                    {formatVnd(financialSummary.availableBalance)}
                  </span>
                </div>
              </div>
            </div>

            {/* ── BENTO GRID FINANCIAL METRICS ── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              {/* Card 1: Số dư khả dụng / Đã hoàn cọc */}
              <div className="p-5 sm:p-6 rounded-3xl bg-[#EEF2EC] border border-[#D5E0D4] relative overflow-hidden shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#37533E]">
                    Số dư khả dụng (Đã hoàn cọc)
                  </span>
                  <span className="w-8 h-8 rounded-xl bg-[#4A6B53] text-white flex items-center justify-center shrink-0 shadow-2xs">
                    <span className="material-symbols-outlined text-[18px]">account_balance_wallet</span>
                  </span>
                </div>
                <div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-serif text-3xl sm:text-4xl font-bold text-[#243D2A]">
                      {formatVnd(financialSummary.availableBalance)}
                    </span>
                  </div>
                  <p className="text-xs text-[#37533E]/90 mt-1 leading-relaxed">
                    Tiền cọc từ các đơn thuê đã hoàn tất thẩm định Bench Lab, sẵn sàng rút về tài khoản ngân hàng hoặc dùng để thuê thiết bị mới.
                  </p>
                </div>
                <div className="pt-2 border-t border-[#D5E0D4]/70 flex items-center justify-between text-[11px] text-[#37533E]">
                  <span>Trạng thái: <strong>Sẵn sàng giao dịch 24/7</strong></span>
                  <button
                    type="button"
                    onClick={() => {
                      if (financialSummary.availableBalance > 0) {
                        setWithdrawAmount(String(financialSummary.availableBalance));
                      }
                      setIsWithdrawModalOpen(true);
                    }}
                    className="font-bold underline hover:text-black cursor-pointer"
                  >
                    Rút ngay
                  </button>
                </div>
              </div>

              {/* Card 2: Tiền cọc đang ký quỹ (Locked Escrow) */}
              <div className="p-5 sm:p-6 rounded-3xl bg-white border border-[#E8E4DC] relative overflow-hidden shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#76726B]">
                    Tiền cọc đang ký quỹ lưu hành
                  </span>
                  <span className="w-8 h-8 rounded-xl bg-[#22201D] text-white flex items-center justify-center shrink-0 shadow-2xs">
                    <span className="material-symbols-outlined text-[18px]">lock</span>
                  </span>
                </div>
                <div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-serif text-3xl sm:text-4xl font-bold text-[#22201D]">
                      {formatVnd(financialSummary.lockedEscrow)}
                    </span>
                  </div>
                  <p className="text-xs text-[#76726B] mt-1 leading-relaxed">
                    {financialSummary.lockedItems.length > 0 ? (
                      <>
                        Khóa bảo chứng cho <strong>{financialSummary.lockedItems.join(', ')}</strong>. Tiền được bảo vệ độc lập, tự động hoàn trả khi trả đồ đạt chuẩn.
                      </>
                    ) : (
                      'Hiện không có đơn hàng nào đang trong kỳ hạn giữ cọc lưu ký.'
                    )}
                  </p>
                </div>
                <div className="pt-2 border-t border-[#E8E4DC]/60 flex items-center justify-between text-[11px] text-[#76726B]">
                  <span>Hợp đồng Smart Escrow: <strong>Đang có hiệu lực</strong></span>
                  <Link to="/rent/orders" className="font-bold text-[#22201D] underline hover:text-black">
                    Xem đơn thuê
                  </Link>
                </div>
              </div>

              {/* Card 3: Tiền cọc đang chờ Bench Lab đối soát (Bước 7 - 8) */}
              <div className="p-5 sm:p-6 rounded-3xl bg-[#FAF5FF] border border-[#DECDEB] relative overflow-hidden shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#5C3B78]">
                    Chờ giải tỏa sau kiểm định (Bước 8)
                  </span>
                  <span className="w-8 h-8 rounded-xl bg-[#6B3299] text-white flex items-center justify-center shrink-0 shadow-2xs">
                    <span className="material-symbols-outlined text-[18px]">science</span>
                  </span>
                </div>
                <div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-serif text-3xl sm:text-4xl font-bold text-[#3B1559]">
                      {formatVnd(financialSummary.pendingInspectionEscrow)}
                    </span>
                  </div>
                  <p className="text-xs text-[#5C3B78]/90 mt-1 leading-relaxed">
                    {financialSummary.pendingItems.length > 0 ? (
                      <>
                        Khoản cọc chờ đối soát cho <strong>{financialSummary.pendingItems.join(', ')}</strong>. Sẽ tự động giải tỏa 100% ngay khi chuyên viên Bench Lab hoàn tất kiểm định.
                      </>
                    ) : (
                      'Không có đơn hàng nào đang trong quá trình thu hồi hoặc kiểm định Bench Lab.'
                    )}
                  </p>
                </div>
                <div className="pt-2 border-t border-[#DECDEB]/70 flex items-center justify-between text-[11px] text-[#5C3B78]">
                  <span>Tiến độ: <strong>Bưu tá đang thu hồi kiện</strong></span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSimulateBenchLabApproval}
                      className="px-2.5 py-1 rounded-lg bg-[#6B3299] hover:bg-[#5C3B78] text-white text-[10px] font-bold transition-all shadow-2xs cursor-pointer"
                      title="Mô phỏng trạm Bench Lab kiểm định đạt chuẩn 100% và giải tỏa cọc ngay"
                    >
                      Duyệt Bench Lab ngay
                    </button>
                    <Link to="/rent/orders?tab=RETURNING" className="font-bold underline hover:text-[#3B1559]">
                      Theo dõi
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* ── TRANSACTION LEDGER TABLE (SỔ PHỤ GIAO DỊCH KÝ QUỸ) ── */}
            <div className="bg-white border border-[#E8E4DC] rounded-3xl p-5 sm:p-7 shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E8E4DC]/60">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-[#76726B]">
                    Smart Escrow Ledger
                  </span>
                  <h2 className="font-serif text-lg sm:text-xl font-bold text-[#22201D]">
                    Lịch sử biến động ký quỹ &amp; Hoàn cọc
                  </h2>
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center gap-1.5 bg-[#F6F3EE] p-1 rounded-xl text-xs">
                  <button
                    type="button"
                    onClick={() => setActiveTab('ALL')}
                    className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                      activeTab === 'ALL' ? 'bg-white text-[#22201D] shadow-2xs' : 'text-[#76726B] hover:text-[#22201D]'
                    }`}
                  >
                    Tất cả giao dịch
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('REFUND')}
                    className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                      activeTab === 'REFUND' ? 'bg-white text-[#22201D] shadow-2xs' : 'text-[#76726B] hover:text-[#22201D]'
                    }`}
                  >
                    Hoàn cọc Smart Escrow
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('ESCROW')}
                    className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                      activeTab === 'ESCROW' ? 'bg-white text-[#22201D] shadow-2xs' : 'text-[#76726B] hover:text-[#22201D]'
                    }`}
                  >
                    Khóa bảo chứng
                  </button>
                </div>
              </div>

              {/* Transactions List */}
              <div className="space-y-3">
                {loading ? (
                  <div className="p-8 text-center bg-[#FAF8F5]/80 rounded-2xl border border-[#E8E4DC]/70 space-y-2">
                    <span className="w-6 h-6 border-2 border-[#22201D] border-t-transparent rounded-full animate-spin inline-block" />
                    <p className="text-xs text-[#76726B]">Đang tải dữ liệu ví lưu ký...</p>
                  </div>
                ) : filteredTransactions.length > 0 ? (
                  filteredTransactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="p-4 sm:p-4.5 rounded-2xl bg-[#FAF8F5]/80 hover:bg-[#F6F3EE] border border-[#E8E4DC]/70 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="flex items-start gap-3.5 min-w-0">
                        <span
                          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-2xs ${
                            tx.type === 'ESCROW_REFUND'
                              ? tx.status === 'COMPLETED'
                                ? 'bg-[#4A6B53] text-white'
                                : 'bg-[#6B3299] text-white'
                              : 'bg-[#22201D] text-white'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[20px]">
                            {tx.type === 'ESCROW_REFUND'
                              ? tx.status === 'COMPLETED'
                                ? 'verified'
                                : 'science'
                              : 'lock'}
                          </span>
                        </span>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-xs font-bold text-[#22201D]">{tx.orderCode}</span>
                            <span className="text-xs text-[#76726B]">· {tx.productTitle}</span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                tx.status === 'COMPLETED'
                                  ? 'bg-[#EEF2EC] text-[#37533E] border border-[#D5E0D4]'
                                  : tx.status === 'PENDING_INSPECTION'
                                  ? 'bg-[#FAF5FF] text-[#5C3B78] border border-[#DECDEB]'
                                  : 'bg-[#EAE6DD] text-[#22201D]'
                              }`}
                            >
                              {tx.statusLabel}
                            </span>
                          </div>
                          <p className="text-xs text-[#76726B] mt-1 leading-relaxed">
                            {tx.note}
                          </p>
                          <div className="flex items-center gap-2 mt-1 text-[11px] text-[#76726B]">
                            <span>Cổng: <strong className="text-[#22201D]">{tx.gateway}</strong></span>
                            <span>· Thời gian: {tx.date} ({tx.time})</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-left md:text-right shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-[#E8E4DC]/60 flex md:flex-col items-center md:items-end justify-between">
                        <span className="text-[11px] text-[#76726B] block">Giá trị giao dịch</span>
                        <span
                          className={`font-serif text-base sm:text-lg font-bold block ${
                            tx.type === 'ESCROW_REFUND' ? 'text-[#37533E]' : 'text-[#22201D]'
                          }`}
                        >
                          {tx.type === 'ESCROW_REFUND' ? `+${formatVnd(tx.amount)}` : `-${formatVnd(tx.amount)}`}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center bg-[#FAF8F5]/80 rounded-2xl border border-[#E8E4DC]/70 space-y-1">
                    <p className="text-xs font-bold text-[#22201D]">Chưa có biến động số dư nào</p>
                    <p className="text-[11px] text-[#76726B]">Các giao dịch cọc và hoàn cọc Smart Escrow sẽ xuất hiện tại đây.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Circular Escrow Trust Banner */}
            <div className="p-5 sm:p-6 rounded-3xl bg-[#F4F1EA] border border-[#E8E4DC] flex flex-col md:flex-row items-center justify-between gap-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white border border-[#E8E4DC] flex items-center justify-center shrink-0 shadow-2xs">
                  <span className="material-symbols-outlined text-[24px] text-[#4A6B53]">security</span>
                </div>
                <div>
                  <h4 className="font-serif font-bold text-sm text-[#22201D]">
                    Bảo mật lưu ký thông minh Smart Escrow 256-bit
                  </h4>
                  <p className="text-xs text-[#76726B] mt-0.5 max-w-xl">
                    Toàn bộ tiền ký quỹ được niêm phong độc lập qua tài khoản giám sát Escrow Vault. Sau khi thiết bị hoàn tất đối soát tại trạm Bench Lab, hợp đồng Smart Escrow tự động kích hoạt hoàn cọc 100% trong tối đa 24 giờ mà không phát sinh thêm bất kỳ chi phí trung gian nào.
                  </p>
                </div>
              </div>
              <Link
                to="/how-it-works"
                className="shrink-0 px-4 py-2.5 rounded-xl bg-white hover:bg-[#F6F3EE] border border-[#E8E4DC] text-[#22201D] font-semibold text-xs transition-colors shadow-2xs"
              >
                Đọc điều khoản Smart Escrow
              </Link>
            </div>
          </div>
        </main>
      </div>

      {/* ── MODAL RÚT TIỀN VỀ TÀI KHOẢN NGÂN HÀNG / VNPAY TEST ── */}
      {isWithdrawModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-5 border border-stone-200 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <div className="flex items-center gap-2.5">
                <span className="w-9 h-9 rounded-xl bg-[#22201D] text-white flex items-center justify-center shadow-xs">
                  <span className="material-symbols-outlined text-[20px]">account_balance</span>
                </span>
                <div>
                  <h3 className="font-serif text-lg font-bold text-stone-900">
                    Rút tiền cọc về tài khoản
                  </h3>
                  <p className="text-[11px] text-stone-500">
                    Số dư khả dụng: <strong className="text-emerald-700">{formatVnd(financialSummary.availableBalance)}</strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsWithdrawModalOpen(false);
                  setWithdrawSuccess(null);
                }}
                className="text-stone-400 hover:text-stone-700 p-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            {withdrawSuccess ? (
              <div className="space-y-4 text-center py-4">
                <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-xs">
                  <span className="material-symbols-outlined text-[32px]">check_circle</span>
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-stone-900 text-sm">Gửi lệnh rút tiền thành công!</h4>
                  <p className="text-xs text-stone-600 leading-relaxed max-w-sm mx-auto">
                    {withdrawSuccess}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsWithdrawModalOpen(false);
                    setWithdrawSuccess(null);
                  }}
                  className="px-6 py-2.5 rounded-xl bg-stone-900 hover:bg-black text-white text-xs font-bold transition-all shadow-md cursor-pointer"
                >
                  Đóng cửa sổ
                </button>
              </div>
            ) : (
              <form onSubmit={handleWithdraw} className="space-y-4 text-xs">
                <div>
                  <label className="font-bold text-stone-800 block mb-1">Số tiền rút (VND)</label>
                  <input
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    max={financialSummary.availableBalance}
                    min="50000"
                    required
                    className="w-full bg-[#F6F3EE] border border-stone-300 rounded-xl px-3.5 py-2.5 text-xs text-stone-900 font-bold focus:outline-none focus:ring-1 focus:ring-black"
                  />
                  <span className="text-[10px] text-stone-500 mt-0.5 block">
                    Tối đa có thể rút: {formatVnd(financialSummary.availableBalance)}
                  </span>
                </div>

                <div>
                  <label className="font-bold text-stone-800 block mb-1">Ngân hàng thụ hưởng</label>
                  <select
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="w-full bg-[#F6F3EE] border border-stone-300 rounded-xl px-3.5 py-2.5 text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-black cursor-pointer"
                  >
                    <option>NCB - Ngân hàng Quốc Dân (VNPay Sandbox Card 9704198526191432198)</option>
                    <option>Vietcombank - Ngân hàng Ngoại Thương</option>
                    <option>Techcombank - Ngân hàng Kỹ Thương</option>
                    <option>MBBank - Ngân hàng Quân Đội</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-stone-800 block mb-1">Số tài khoản / Số thẻ nhận tiền</label>
                  <input
                    type="text"
                    value={bankAccount}
                    onChange={(e) => setBankAccount(e.target.value)}
                    required
                    className="w-full bg-[#F6F3EE] border border-stone-300 rounded-xl px-3.5 py-2.5 text-xs text-stone-900 font-mono focus:outline-none focus:ring-1 focus:ring-black"
                  />
                </div>

                <div>
                  <label className="font-bold text-stone-800 block mb-1">Tên chủ tài khoản (In hoa không dấu)</label>
                  <input
                    type="text"
                    value={accountHolder}
                    onChange={(e) => setAccountHolder(e.target.value)}
                    required
                    className="w-full bg-[#F6F3EE] border border-stone-300 rounded-xl px-3.5 py-2.5 text-xs text-stone-900 uppercase font-semibold focus:outline-none focus:ring-1 focus:ring-black"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsWithdrawModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold text-xs cursor-pointer"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={isProcessingWithdraw || Number(withdrawAmount) <= 0 || Number(withdrawAmount) > financialSummary.availableBalance}
                    className="px-5 py-2.5 rounded-xl bg-[#22201D] hover:bg-black text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isProcessingWithdraw ? (
                      <>
                        <span className="material-symbols-outlined text-[15px] animate-spin">progress_activity</span>
                        <span>Đang gửi lệnh rút...</span>
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[15px]">send</span>
                        <span>Xác nhận rút tiền</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default UserWallet;
