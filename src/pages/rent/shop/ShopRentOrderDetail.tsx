import React, { useState, useEffect, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  getRentalOrderByIdApi,
  getShopRentalOrdersApi,
  approveRentalOrderApi,
  inspectAndRefundOrderApi,
  updateOrderStatusApi,
  type RentalOrderApi,
} from '../../../services/order.api';

interface DisplayItem {
  id: string;
  title: string;
  image: string;
  pricePerDay: number;
  deposit: number;
  quantity: number;
  sku: string;
  grade: string;
}

export const ShopRentOrderDetail: React.FC = () => {
  const { id: paramOrderId } = useParams<{ id?: string }>();
  const rawId = (paramOrderId || '').trim();
  const cleanId = rawId.replace('#', '');

  // Dynamic Order State from API / Database
  const [order, setOrder] = useState<RentalOrderApi | null>(null);
  const [, setLoading] = useState(true);
  const [isApproving, setIsApproving] = useState(false);
  const [allShopOrders, setAllShopOrders] = useState<RentalOrderApi[]>([]);

  // Interactive Demo State Switcher
  type DemoState = 'pending' | 'paid' | 'shipping' | 'renting' | 'return_requested' | 'returning' | 'inspecting' | 'completed';
  const [demoState, setDemoState] = useState<DemoState>('shipping');

  // Inspection form states (chuyên biệt ngành thời trang, may mặc)
  const [conditionResult, setConditionResult] = useState<string>('perfect');
  const [inspectionNote, setInspectionNote] = useState<string>(
    'Chất liệu vải lụa tơ tằm & satin cao cấp, đường kim mũi chỉ thủ công chắc chắn, giữ phom dáng nguyên vẹn. Toàn bộ cúc đính đá/pha lê và khóa kéo trượt êm mượt, không sờn rách, không vết ố mỹ phẩm hay rượu vang. Đã xử lý qua buồng khử khuẩn Ozone. Đạt tiêu chuẩn hoàn cọc toàn phần 100%.'
  );


  // Modals state
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [showEscrowConfirmModal, setShowEscrowConfirmModal] = useState(false);
  const [zoomImage, setZoomImage] = useState<{ src: string; caption: string } | null>(null);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Fetch real order from Backend
  useEffect(() => {
    let isMounted = true;
    const loadOrderData = async () => {
      setLoading(true);
      try {
        let loadedOrder: RentalOrderApi | null = null;
        if (cleanId) {
          loadedOrder = await getRentalOrderByIdApi(cleanId);
        }

        // If not found by direct ID, search in shop orders list
        const shopOrders = await getShopRentalOrdersApi();
        if (isMounted) {
          setAllShopOrders(shopOrders || []);
        }
        if (!loadedOrder) {
          loadedOrder =
            shopOrders.find(
              (o) =>
                o._id === cleanId ||
                o.orderCode === cleanId ||
                o.orderCode === `#${cleanId}` ||
                o.orderCode.toLowerCase().includes(cleanId.toLowerCase())
            ) || null;
        }

        if (loadedOrder && isMounted) {
          setOrder(loadedOrder);

          // Check if CLA is signed
          const cleanCode = (loadedOrder.orderCode || loadedOrder._id || '').replace('#', '').trim();
          let isSigned = Boolean(loadedOrder.claProof?.isSigned);
          if (!isSigned) {
            try {
              const localCla = localStorage.getItem(`cla_proof_${cleanCode}`) || localStorage.getItem(`cla_proof_${loadedOrder._id}`);
              if (localCla) {
                const parsed = JSON.parse(localCla);
                if (parsed && (parsed.isSigned === true || parsed.signedAt)) isSigned = true;
              }
            } catch {}
          }

          // Map actual backend status to demoState
          const normalizedCode = cleanCode.toLowerCase();
          const candidateKeys = [
            cleanId.toLowerCase(),
            normalizedCode,
            String(loadedOrder._id || '').toLowerCase(),
            String(loadedOrder.orderCode || '').replace('#', '').trim().toLowerCase(),
          ].filter(Boolean);

          const hasInspectionApproved = Boolean(
            loadedOrder.status === 'COMPLETED' ||
            candidateKeys.some((k) => localStorage.getItem(`inspection_approved_${k}`)) ||
            (loadedOrder as any)?.inspectionResult?.isApproved
          );
          const hasInspectionEntered = Boolean(
            loadedOrder.status === 'RETURNED' ||
            loadedOrder.status === 'INSPECTING' ||
            candidateKeys.some((k) => localStorage.getItem(`inspection_entered_${k}`))
          );
          const hasReturnSubmitted = Boolean(
            loadedOrder.status === 'RETURNING' ||
            candidateKeys.some((k) => localStorage.getItem(`return_request_${k}`))
          );
          const hasReturnRequested = Boolean(
            loadedOrder.status === 'RETURN_REQUESTED' ||
            candidateKeys.some((k) => localStorage.getItem(`user_initiated_return_${k}`))
          );

          if (hasInspectionApproved) {
            setDemoState('completed');
          } else if (hasInspectionEntered) {
            setDemoState('inspecting');
          } else if (hasReturnSubmitted) {
            setDemoState('returning');
          } else if (hasReturnRequested) {
            setDemoState('return_requested');
          } else {
            const st = String(loadedOrder.status || '').toUpperCase();
            if (st === 'PENDING') {
              setDemoState('pending');
            } else if (st === 'WAITING_PAYMENT' || st === 'PAID') {
              setDemoState('paid');
            } else if (['SHIPPING', 'HANDED_OVER', 'READY_FOR_HANDOVER', 'DELIVERED'].includes(st)) {
              setDemoState('shipping');
            } else if (st === 'RENTING') {
              setDemoState(isSigned ? 'renting' : 'shipping');
            } else {
              setDemoState(isSigned ? 'renting' : 'shipping');
            }
          }
        }
      } catch (err) {
        console.warn('Không thể tải chi tiết đơn thuê từ backend, dùng fallback dữ liệu:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadOrderData();
    return () => {
      isMounted = false;
    };
  }, [cleanId]);

  // Handle Approve Order
  const handleApproveOrder = async () => {
    const targetId = order?._id || cleanId;
    if (!targetId) return;
    setIsApproving(true);
    try {
      const updated = await approveRentalOrderApi(targetId);
      if (updated) {
        setOrder(updated);
      }
      setDemoState('paid');
      showToast('Đã phê duyệt đơn thuê thành công! Bên thuê đã có thể thanh toán VNPay.');
    } catch (err: unknown) {
      console.error('Lỗi khi phê duyệt đơn thuê:', err);
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Có lỗi xảy ra khi phê duyệt đơn thuê.';
      showToast(msg);
    } finally {
      setIsApproving(false);
    }
  };

  // Dynamic calculations
  const displayOrderCode = useMemo(() => {
    if (order?.orderCode) {
      return order.orderCode.startsWith('#') ? order.orderCode : `#${order.orderCode}`;
    }
    return cleanId ? (cleanId.startsWith('RH-') ? `#${cleanId}` : `#RH-RNT-${cleanId}`) : '#RH-RNT-2026-6519';
  }, [order, cleanId]);

  // Customer info dynamically matched with order
  const customerInfo = useMemo(() => {
    const renter = (order?.renterId as unknown as { fullName?: string; email?: string; phoneNumber?: string }) || {};
    const addr = order?.shippingAddress;

    const fullName =
      addr?.recipientName ||
      renter?.fullName ||
      'Nguyễn Văn Hơn';

    const phone =
      addr?.recipientPhone ||
      renter?.phoneNumber ||
      '0908 123 456';

    const fullAddress = addr
      ? [addr.detail, addr.ward, addr.district, addr.province].filter(Boolean).join(', ')
      : 'Tầng 4 Archive Suite, 48 Bạch Đằng, P. Hải Châu 1, Q. Hải Châu, TP. Đà Nẵng';

    const email = renter?.email || 'hon@gmail.com';
    const initials = fullName
      .split(' ')
      .filter(Boolean)
      .slice(-2)
      .map((w) => w[0].toUpperCase())
      .join('') || 'NVH';

    return { fullName, phone, fullAddress, email, initials };
  }, [order]);


  // Check if CLA is signed for this order (từ backend hoặc localStorage)
  const claProofData = useMemo(() => {
    if (order?.claProof && order.claProof.isSigned) {
      return order.claProof;
    }
    const candidateKeys = [
      cleanId,
      order?._id,
      order?.orderCode?.replace('#', '').trim(),
      displayOrderCode.replace('#', '').trim(),
    ].filter(Boolean) as string[];

    for (const ck of candidateKeys) {
      try {
        const raw = localStorage.getItem(`cla_proof_${ck}`);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && (parsed.isSigned || parsed.signedAt || parsed.signDate || parsed.photos)) {
            return parsed;
          }
        }
      } catch {}
    }
    return null;
  }, [order, cleanId, displayOrderCode]);

  const isClaSigned = Boolean(
    (order?.claProof && order.claProof.isSigned) ||
    (claProofData && claProofData.isSigned)
  );

  // Trạng thái hiệu lực: Khi chưa ký CLA, không bao giờ được phép nhảy sang 'renting' (Đang thuê) mà dừng ở 'shipping' (Bàn giao)
  const effectiveState: DemoState = useMemo(() => {
    if (demoState === 'renting' && !isClaSigned) {
      return 'shipping';
    }
    return demoState;
  }, [demoState, isClaSigned]);

  // Dynamic Customer Rental & Dispute Statistics (tính toán động từ đơn thuê thực tế)

  const customerStats = useMemo(() => {
    const renterIdStr = typeof order?.renterId === 'object' ? (order?.renterId as any)?._id : order?.renterId;
    const targetEmail = customerInfo.email?.toLowerCase();
    const targetPhone = customerInfo.phone?.replace(/\D/g, '');
    const targetName = customerInfo.fullName?.toLowerCase();

    // Tìm tất cả các đơn của khách hàng này trong shop orders và localStorage
    const matched = allShopOrders.filter((o) => {
      const oRenterId = typeof o.renterId === 'object' ? (o.renterId as any)?._id : o.renterId;
      if (renterIdStr && oRenterId && String(renterIdStr) === String(oRenterId)) return true;
      const oEmail = (o.shippingAddress as any)?.recipientEmail?.toLowerCase() || (o as any).renterEmail?.toLowerCase();
      if (targetEmail && oEmail && oEmail === targetEmail) return true;
      const oPhone = o.shippingAddress?.recipientPhone?.replace(/\D/g, '');
      if (targetPhone && oPhone && oPhone === targetPhone) return true;
      const oName = o.shippingAddress?.recipientName?.toLowerCase();
      if (targetName && oName && oName === targetName) return true;
      return false;
    });

    const count = Math.max(matched.length, order ? 1 : 1);
    const disputes = matched.filter((o) => o.status === 'DISPUTED' || (o as any).complaint).length;
    const trustPercent = disputes === 0 ? '100%' : `${Math.max(60, Math.round(((count - disputes) / count) * 100))}%`;

    return {
      rentalCount: String(count).padStart(2, '0'),
      disputeCount: disputes,
      trustPercent,
    };
  }, [allShopOrders, order, customerInfo]);

  // Dynamic Items resolution
  const items: DisplayItem[] = useMemo(() => {
    if (order?.items && Array.isArray(order.items) && order.items.length > 0) {
      return order.items.map((it, idx) => {
        const prod = (it.productId as unknown as { name?: string; productName?: string; title?: string; images?: string[]; pricePerDay?: number; depositAmount?: number }) || {};
        const itAny = it as { name?: string; title?: string; imageUrl?: string; image?: string; images?: string[] };
        const title = it.productName || itAny.name || itAny.title || prod.name || prod.productName || prod.title || 'Trang phục thời trang cao cấp';
        const image =
          itAny.imageUrl ||
          itAny.image ||
          (itAny.images && itAny.images[0]) ||
          (prod.images && prod.images[0]) ||
          '/images/partydress4.jpg';
        const pricePerDay = it.pricePerDay || prod.pricePerDay || 210000;
        const deposit = it.depositAmount || prod.depositAmount || 800000;
        const quantity = it.quantity || 1;

        return {
          id: String(it.productId || `item-${idx + 1}`),
          title,
          image,
          pricePerDay,
          deposit,
          quantity,
          sku: `SKU-FSH-${displayOrderCode.replace(/\D/g, '').slice(-4) || '6519'}-0${idx + 1}`,
          grade: 'Grade A+ (99.0% - Đạt chuẩn giặt Ozone)',
        };
      });
    }

    // Default item matching screenshot order RH-RNT-2026-6519
    return [
      {
        id: 'item-1',
        title: 'Giày Sandal Cao Gót Quai Mảnh Ánh Kim Dự Tiệc',
        image: '/images/partydress4.jpg',
        pricePerDay: 210000,
        deposit: 800000,
        quantity: 1,
        sku: 'SKU-FSH-6519-01',
        grade: 'Grade A+ (99.0% - Đạt chuẩn giặt Ozone)',
      },
    ];
  }, [order, displayOrderCode]);

  const primaryItem = items[0];
  const bundledItems = items.slice(1);

  // Escrow & financial calculations
  const originalDeposit = useMemo(() => {
    if (order?.depositAmount) return order.depositAmount;
    return items.reduce((sum, it) => sum + (it.deposit || 0), 0) || 800000;
  }, [order, items]);

  const rentalFee = useMemo(() => {
    if (order?.rentalFee) return order.rentalFee;
    if (order?.totalAmount) return Math.max(0, order.totalAmount - originalDeposit - (order.shippingFee || 0));
    return 630000;
  }, [order, originalDeposit]);

  const totalPayment = useMemo(() => {
    if (order?.totalAmount) return order.totalAmount;
    return rentalFee + originalDeposit + 50000;
  }, [order, rentalFee, originalDeposit]);

  const rentalDays = useMemo(() => {
    if (order?.rentalDays) return order.rentalDays;
    if (order?.startDate && order?.endDate) {
      const diff = new Date(order.endDate).getTime() - new Date(order.startDate).getTime();
      return Math.max(1, Math.round(diff / (1000 * 60 * 60 * 24)));
    }
    return 3;
  }, [order]);

  const startDateFormatted = useMemo(() => {
    if (order?.startDate) {
      return new Date(order.startDate).toLocaleDateString('vi-VN');
    }
    return '30/10/2026';
  }, [order]);

  const endDateFormatted = useMemo(() => {
    if (order?.endDate) {
      return new Date(order.endDate).toLocaleDateString('vi-VN');
    }
    return '02/11/2026';
  }, [order]);

  // Ngày hoàn trả thực tế khi user trả đồ (có thể trả sớm hơn lịch hẹn)
  const actualReturnDateFormatted = useMemo(() => {
    const candidateKeys = [
      cleanId,
      order?._id,
      order?.orderCode?.replace('#', '').trim(),
      displayOrderCode.replace('#', '').trim(),
    ].filter(Boolean) as string[];

    for (const ck of candidateKeys) {
      try {
        const raw = localStorage.getItem(`return_request_${ck.toLowerCase()}`);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && parsed.returnedAt) {
            return new Date(parsed.returnedAt).toLocaleDateString('vi-VN');
          }
        }
      } catch {}
    }

    const rawOrderReturnedAt = (order as any)?.returnedAt || (order as any)?.actualReturnDate;
    if (rawOrderReturnedAt) {
      return new Date(rawOrderReturnedAt).toLocaleDateString('vi-VN');
    }

    if (['returning', 'inspecting', 'completed'].includes(effectiveState)) {
      return new Date().toLocaleDateString('vi-VN');
    }

    return endDateFormatted;
  }, [cleanId, order, displayOrderCode, effectiveState, endDateFormatted]);

  const deductionAmount = useMemo(() => {
    if (conditionResult === 'stain_makeup') return 200000;
    if (conditionResult === 'damage_tear') return 1000000;
    return 0;
  }, [conditionResult]);

  const refundAmount = Math.max(0, originalDeposit - deductionAmount);

  // Chat messages simulation
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'shop' | 'customer'; text: string; time: string }>>([
    {
      sender: 'customer',
      text: `Chào xưởng thời trang, mình đã nhận được kiện hàng trang phục cho đơn ${displayOrderCode} rồi nhé, đồ rất thơm và vừa vặn.`,
      time: '30/10 11:05',
    },
    {
      sender: 'shop',
      text: `Dạ chào bạn ${customerInfo.fullName}, cảm ơn bạn đã tin tưởng dịch vụ thuê trang phục ReUse Hub! Chúc bạn có một sự kiện thật rạng rỡ ạ.`,
      time: '30/10 11:20',
    },
  ]);
  const [newMessageText, setNewMessageText] = useState('');

  const handleSendMessage = () => {
    if (!newMessageText.trim()) return;
    const now = new Date();
    const timeStr = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`;
    setChatMessages((prev) => [
      ...prev,
      { sender: 'shop', text: newMessageText.trim(), time: timeStr },
    ]);
    setNewMessageText('');
    showToast(`Đã gửi tin nhắn tới ${customerInfo.fullName}`);
  };

    const handleApproveEscrowRelease = async () => {
    const targetId = order?._id || cleanId;
    try {
      if (targetId) {
        await inspectAndRefundOrderApi(targetId, {
          damagePenaltyAmount: deductionAmount,
          reason: inspectionNote,
        });
      }
    } catch (apiErr) {
      console.warn('Backend inspectAndRefund note:', apiErr);
    }

    setDemoState('completed');
    setShowEscrowConfirmModal(false);

    // Cập nhật state order
    setOrder((prev) =>
      prev
        ? {
            ...prev,
            status: 'COMPLETED',
            inspectionResult: {
              damagePenaltyAmount: deductionAmount,
              refundAmount,
              reason: inspectionNote,
            } as any,
          }
        : null
    );

    // Cập nhật số dư ví khả dụng của khách và lưu trạng thái COMPLETED vào localStorage
    const renterId = typeof order?.renterId === 'object' ? (order?.renterId as any)?._id : order?.renterId;
    const cleanCode = (order?.orderCode || cleanId).replace('#', '').trim();

    try {
      // 1. Cập nhật các danh sách đơn thuê của user trong localStorage
      const allKeys = Object.keys(localStorage).filter((k) => k.startsWith('user_rental_orders'));
      allKeys.forEach((k) => {
        try {
          const list = JSON.parse(localStorage.getItem(k) || '[]');
          const updated = list.map((o: any) => {
            const oCode = (o.orderCode || o.id || o._id || '').replace('#', '').trim();
            if (oCode === cleanCode || o._id === targetId || o.id === targetId) {
              return {
                ...o,
                status: 'COMPLETED',
                inspectionResult: { isApproved: true, refundAmount, damagePenaltyAmount: deductionAmount },
              };
            }
            return o;
          });
          localStorage.setItem(k, JSON.stringify(updated));
        } catch {}
      });

      // 2. Chuyển tiền cọc về Số dư khả dụng trong Ví lưu ký Smart Escrow
      if (renterId) {
        const currentBalKey = `user_wallet_available_${renterId}`;
        const prevBal = Number(localStorage.getItem(currentBalKey) || 0);
        const newBal = prevBal + refundAmount;
        localStorage.setItem(currentBalKey, String(newBal));
      }
      const defaultUserBalKey = 'user_wallet_available_default';
      const prevDefBal = Number(localStorage.getItem(defaultUserBalKey) || 0);
      localStorage.setItem(defaultUserBalKey, String(prevDefBal + refundAmount));

      // 3. Dispatch events để MyRentOrders và UserWallet cập nhật tức thì
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new CustomEvent('rental_order_completed', { detail: { orderId: targetId, refundAmount } }));
      window.dispatchEvent(new CustomEvent('wallet_balance_updated', { detail: { refundAmount } }));
    } catch (e) {
      console.warn('Lỗi đồng bộ cọc vào ví Smart Escrow:', e);
    }

    try {
      localStorage.setItem(`inspection_approved_${cleanCode.toLowerCase()}`, 'true');
      if (targetId) localStorage.setItem(`inspection_approved_${String(targetId).toLowerCase()}`, 'true');
      if (order?._id) localStorage.setItem(`inspection_approved_${String(order._id).toLowerCase()}`, 'true');
      if (cleanId) localStorage.setItem(`inspection_approved_${cleanId.toLowerCase()}`, 'true');
    } catch {}
    showToast(`Đã ký duyệt nghiệm thu & lưu vào CSDL! Tiền cọc ${refundAmount.toLocaleString('vi-VN')} ₫ đã tự động hoàn trả về Số dư khả dụng ở Ví lưu ký Smart Escrow.`);
  };

  const handleMarkReadyForShipping = async () => {
    const targetId = order?._id || cleanId;
    if (!targetId) return;
    try {
      await updateOrderStatusApi(targetId, 'READY_FOR_HANDOVER');
      showToast('Đã đánh dấu Sẵn Sàng Bàn Giao Bưu Tá thành công!');
    } catch (err) {
      console.warn('Backend mark ready notice:', err);
      showToast('Đã ghi nhận trạng thái Sẵn Sàng Bàn Giao Bưu Tá!');
    }
  };

  const isOrderRentingOrEarlier = ['pending', 'paid', 'shipping', 'renting'].includes(effectiveState);

  return (
    <div className="w-full bg-[#fdf8f5] text-[#1c1b19] font-sans antialiased min-h-screen pb-16 no-reveal">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1c1b19] text-white px-5 py-3.5 rounded-xl shadow-2xl flex items-center gap-3 border border-stone-700 animate-fade-in max-w-md">
          <span className="material-symbols-outlined text-[#caebc9] text-[22px] shrink-0">check_circle</span>
          <span className="text-xs sm:text-sm font-medium leading-relaxed">{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-stone-400 hover:text-white ml-2 text-sm cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Utility Context & Breadcrumbs */}
      <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-6 pb-4">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <nav className="flex items-center gap-1.5 text-xs sm:text-sm text-[#4c463c]">
            <Link to="/shop/dashboard" className="hover:text-[#6c5937] transition-colors">
              Bảng điều khiển xưởng
            </Link>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <Link to="/shop/orders" className="hover:text-[#6c5937] transition-colors">
              Đơn thuê RENT
            </Link>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-[#1c1b19] font-medium font-mono">Chi tiết Sổ Lệnh {displayOrderCode}</span>
          </nav>

          {/* Quick Document & Communication Actions */}
          <div className="flex flex-wrap items-center gap-2">
            {order?.status === 'PENDING' && (
              <button
                type="button"
                onClick={handleApproveOrder}
                disabled={isApproving}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded font-bold text-xs sm:text-sm transition-all shadow-sm cursor-pointer disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[17px]">
                  {isApproving ? 'hourglass_top' : 'check_circle'}
                </span>
                <span>{isApproving ? 'Đang duyệt...' : 'Duyệt Đơn Thuê'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowPrintModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#f2ede9] hover:bg-[#ece7e4] text-[#1c1b19] rounded font-medium text-xs sm:text-sm transition-colors shadow-xs cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px] text-[#6c5937]">picture_as_pdf</span>
              <span>In Phiếu Giao Nhận &amp; Biên Bản</span>
            </button>
            <button
              type="button"
              onClick={() => setShowChatModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#f2ede9] hover:bg-[#ece7e4] text-[#1c1b19] rounded font-medium text-xs sm:text-sm transition-colors shadow-xs cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px] text-[#48654b]">chat</span>
              <span>Nhắn Tin Khách</span>
            </button>
            <Link
              to="/shop/orders"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[#4c463c] hover:text-[#1c1b19] rounded font-medium text-xs sm:text-sm transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              <span>Sổ Lệnh</span>
            </Link>
          </div>
        </div>

        {/* Main Order Title Card */}
        <div className="bg-white p-6 sm:p-7 rounded-2xl shadow-xs border border-[#e6e2de] mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="px-2.5 py-1 bg-[#f2ede9] text-[11px] font-semibold uppercase tracking-wider text-[#4c463c] rounded">
                  {items.length > 1 ? `Đơn thuê gộp (${items.length} hiện vật)` : 'Đơn thuê độc lập (01 hiện vật)'}
                </span>

                {/* State Badge */}
                {effectiveState === 'inspecting' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#caebc9] text-[#05210c] text-[11px] font-bold uppercase tracking-wider rounded-full">
                    <span className="w-2 h-2 rounded-full bg-[#48654b] animate-pulse"></span>
                    Nghiệm thu hoàn trả (Inspecting)
                  </span>
                )}
                {effectiveState === 'pending' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-900 text-[11px] font-bold uppercase tracking-wider rounded-full">
                    <span className="w-2 h-2 rounded-full bg-amber-600 animate-pulse"></span>
                    Chờ xét duyệt thẩm định (Pending)
                  </span>
                )}
                {effectiveState === 'paid' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-100 text-blue-900 text-[11px] font-bold uppercase tracking-wider rounded-full">
                    <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                    Đã duyệt · Chờ khách thanh toán (Waiting Payment)
                  </span>
                )}
                {effectiveState === 'shipping' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-100 text-blue-900 text-[11px] font-bold uppercase tracking-wider rounded-full">
                    <span className="material-symbols-outlined text-[14px] text-blue-700 animate-bounce">local_shipping</span>
                    Đang giao đồ (Chờ ký CLA)
                  </span>
                )}
                {effectiveState === 'renting' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-100 text-purple-900 text-[11px] font-bold uppercase tracking-wider rounded-full">
                    <span className="w-2 h-2 rounded-full bg-purple-600 animate-pulse"></span>
                    Đang thuê (Renting · {rentalDays} Ngày)
                  </span>
                )}
                {effectiveState === 'completed' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-900 text-[11px] font-bold uppercase tracking-wider rounded-full">
                    <span className="material-symbols-outlined text-[15px] text-emerald-700">verified</span>
                    Đã hoàn tất &amp; Giải phóng cọc 100% (Completed)
                  </span>
                )}

                <span className="px-2.5 py-1 bg-[#f2ede9] text-[11px] font-semibold uppercase tracking-wider text-[#6c5937] rounded">
                  VNPay Escrow Bảo Chứng 100%
                </span>
                <span className="px-2.5 py-1 bg-[#f2ede9] text-[11px] text-[#4c463c] rounded font-mono">
                  Hợp đồng {displayOrderCode}
                </span>
              </div>

              <h1 className="font-serif text-2xl sm:text-3xl lg:text-[34px] font-semibold text-[#1c1b19] tracking-tight">
                Sổ Lệnh Lưu Ký Cho Thuê {displayOrderCode}
              </h1>
              <p className="text-xs sm:text-sm text-[#4c463c] mt-1.5 leading-relaxed">
                Chủ trì thẩm định: <span className="font-semibold text-[#1c1b19]">Atelier Haute Couture &amp; Wardrobe Specimen Lab</span> • Giám định viên:{' '}
                <span className="font-medium text-[#1c1b19]">Trần Mai Phương (Fashion Specimen Lead)</span>
              </p>
            </div>

            <div className="flex items-center gap-4 bg-[#f7f3ef] p-4 rounded-xl border border-[#ece7e4]">
              <div className="text-right">
                <span className="text-[10px] sm:text-[11px] uppercase tracking-wider text-[#4c463c] block font-semibold">
                  Ký quỹ Escrow Khóa
                </span>
                <span className="font-serif text-xl sm:text-2xl font-bold text-[#6c5937]">
                  {originalDeposit.toLocaleString('vi-VN')} ₫
                </span>
              </div>
              <div className="w-px h-10 bg-[#e6e2de]"></div>
              <div className="text-right">
                <span className="text-[10px] sm:text-[11px] uppercase tracking-wider text-[#4c463c] block font-semibold">
                  Doanh thu Thuê ({rentalDays} Ngày)
                </span>
                <span className="font-serif text-xl sm:text-2xl font-bold text-[#1c1b19]">
                  {rentalFee.toLocaleString('vi-VN')} ₫
                </span>
              </div>
            </div>
          </div>

          {/* Interactive State Simulation Bar */}
          <div className="mt-6 pt-5 border-t border-[#f2ede9]">
            <div className="flex items-center justify-between gap-2 mb-2.5">
              <span className="text-[11px] uppercase tracking-widest text-[#4c463c] font-semibold flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-[#6c5937]">tune</span>
                Trạng thái vận hành sổ lệnh thực tế:
              </span>
              <span className="text-[11px] text-[#6c5937] font-semibold bg-[#f7f3ef] px-2 py-0.5 rounded">
                Live State
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-center text-xs">
              <button
                type="button"
                onClick={() => setDemoState('pending')}
                className={`px-3 py-2.5 rounded-lg font-medium transition-all cursor-pointer ${
                  effectiveState === 'pending'
                    ? 'bg-[#6c5937] text-white font-semibold shadow-xs'
                    : 'bg-[#f2ede9] text-[#4c463c] hover:bg-[#ece7e4]'
                  }`}
              >
                1. PENDING (Chờ duyệt)
              </button>
              <button
                type="button"
                onClick={() => setDemoState('paid')}
                className={`px-3 py-2.5 rounded-lg font-medium transition-all cursor-pointer ${
                  effectiveState === 'paid'
                    ? 'bg-[#6c5937] text-white font-semibold shadow-xs'
                    : 'bg-[#f2ede9] text-[#4c463c] hover:bg-[#ece7e4]'
                  }`}
              >
                2. PAID (Chờ giao)
              </button>
              <button
                type="button"
                onClick={() => setDemoState('shipping')}
                className={`px-3 py-2.5 rounded-lg font-medium transition-all cursor-pointer ${
                  effectiveState === 'shipping'
                    ? 'bg-[#6c5937] text-white font-semibold shadow-xs'
                    : 'bg-[#f2ede9] text-[#4c463c] hover:bg-[#ece7e4]'
                  }`}
              >
                3. BÀN GIAO (Đang giao)
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!isClaSigned) {
                    showToast('Khách thuê chưa ký CLA bàn giao nên đơn hàng chưa thể chuyển sang trạng thái Đang thuê.');
                    return;
                  }
                  setDemoState('renting');
                }}
                className={`px-3 py-2.5 rounded-lg font-medium transition-all cursor-pointer ${
                  effectiveState === 'renting'
                    ? 'bg-[#6c5937] text-white font-semibold shadow-xs'
                    : 'bg-[#f2ede9] text-[#4c463c] hover:bg-[#ece7e4]'
                }`}
              >
                4. RENTING (Đang thuê)
              </button>
              <button
                type="button"
                onClick={() => setDemoState('inspecting')}
                className={`px-3 py-2.5 rounded-lg font-medium transition-all cursor-pointer ${
                  effectiveState === 'inspecting'
                    ? 'bg-[#6c5937] text-white font-semibold shadow-xs'
                    : 'bg-[#f2ede9] text-[#4c463c] hover:bg-[#ece7e4]'
                  }`}
              >
                5. INSPECTING (Nghiệm thu)
              </button>
              <button
                type="button"
                onClick={() => setDemoState('completed')}
                className={`px-3 py-2.5 rounded-lg font-medium transition-all cursor-pointer ${
                  effectiveState === 'completed'
                    ? 'bg-[#6c5937] text-white font-semibold shadow-xs'
                    : 'bg-[#f2ede9] text-[#4c463c] hover:bg-[#ece7e4]'
                  }`}
              >
                6. COMPLETED (Hoàn tất)
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 11-Stage Circular Rental Lifecycle Timeline */}
      <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 mb-6">
        <div className="bg-white p-5 lg:p-6 rounded-2xl shadow-xs border border-[#e6e2de]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#6c5937] text-[22px]">timeline</span>
              <h2 className="font-serif text-base sm:text-lg font-semibold text-[#1c1b19] uppercase tracking-wider">
                Tiến Trình Vòng Đời Cho Thuê Tuần Hoàn (11 Giai Đoạn)
              </h2>
            </div>
            <span className="text-[11px] text-[#4c463c] uppercase tracking-wider font-mono bg-[#f7f3ef] px-2.5 py-1 rounded">
              Mã Kiểm Thẩm Chuỗi: #{displayOrderCode.replace('#', '')}-VERIFIED
            </span>
          </div>

          {/* Horizontal Stepper */}
          <div className="overflow-x-auto pb-3">
            <div className="min-w-[980px] grid grid-cols-11 gap-1 items-start relative pt-2">
              <div className="absolute top-6 left-5 right-5 h-0.5 bg-[#f2ede9] -z-0"></div>

              {/* Step 1 */}
              <div className="flex flex-col items-center text-center relative z-10 px-1">
                <div className="w-8 h-8 rounded-full bg-[#48654b] text-white flex items-center justify-center text-xs shadow-xs mb-1.5">
                  <span className="material-symbols-outlined text-[16px]">check</span>
                </div>
                <span className="text-[11px] font-semibold text-[#1c1b19] block leading-tight">1. Khởi tạo</span>
                <span className="text-[10px] text-[#4c463c] block mt-0.5">{startDateFormatted}</span>
              </div>

              {/* Step 2 */}
              <div className="flex flex-col items-center text-center relative z-10 px-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs shadow-xs mb-1.5 ${
                  effectiveState === 'pending'
                    ? 'bg-[#6c5937] text-white ring-4 ring-[#f9dfb3]'
                    : 'bg-[#48654b] text-white'
                  }`}>
                  <span className="material-symbols-outlined text-[16px]">check</span>
                </div>
                <span className="text-[11px] font-semibold text-[#1c1b19] block leading-tight">2. Shop duyệt</span>
                <span className="text-[10px] text-[#4c463c] block mt-0.5">{effectiveState === 'pending' ? 'Đang chờ' : 'Đã duyệt'}</span>
              </div>

              {/* Step 3 */}
              <div className="flex flex-col items-center text-center relative z-10 px-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs shadow-xs mb-1.5 ${
                  effectiveState === 'pending' ? 'bg-[#f2ede9] text-[#4c463c]' : 'bg-[#48654b] text-white'
                }`}>
                  {effectiveState === 'pending' ? '3' : <span className="material-symbols-outlined text-[16px]">check</span>}
                </div>
                <span className="text-[11px] font-semibold text-[#1c1b19] block leading-tight">3. Chờ thanh toán</span>
                <span className="text-[10px] text-[#4c463c] block mt-0.5">VNPay</span>
              </div>

              {/* Step 4 */}
              <div className="flex flex-col items-center text-center relative z-10 px-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs shadow-xs mb-1.5 ${
                  effectiveState === 'pending'
                    ? 'bg-[#f2ede9] text-[#4c463c]'
                    : effectiveState === 'paid'
                    ? 'bg-[#6c5937] text-white ring-4 ring-[#f9dfb3]'
                    : 'bg-[#48654b] text-white'
                }`}>
                  {effectiveState === 'pending' ? '4' : <span className="material-symbols-outlined text-[16px]">check</span>}
                </div>
                <span className="text-[11px] font-semibold text-[#1c1b19] block leading-tight">4. Đã thanh toán</span>
                <span className="text-[10px] text-[#4c463c] block mt-0.5">Khóa Escrow</span>
              </div>

              {/* Step 5 */}
              <div className="flex flex-col items-center text-center relative z-10 px-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs shadow-xs mb-1.5 ${
                  ['pending', 'paid'].includes(effectiveState) ? 'bg-[#f2ede9] text-[#4c463c]' : 'bg-[#48654b] text-white'
                }`}>
                  {['pending', 'paid'].includes(effectiveState) ? '5' : <span className="material-symbols-outlined text-[16px]">check</span>}
                </div>
                <span className="text-[11px] font-semibold text-[#1c1b19] block leading-tight">5. Đóng gói</span>
                <span className="text-[10px] text-[#4c463c] block mt-0.5">Túi bảo quản</span>
              </div>

              {/* Step 6: BÀN GIAO (Khi chưa ký CLA, tiến trình dừng ở đây và active) */}
              <div className="flex flex-col items-center text-center relative z-10 px-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs shadow-xs mb-1.5 ${
                  ['pending', 'paid'].includes(effectiveState)
                    ? 'bg-[#f2ede9] text-[#4c463c]'
                    : effectiveState === 'shipping'
                    ? 'bg-[#6c5937] text-white ring-4 ring-[#f9dfb3]'
                    : 'bg-[#48654b] text-white'
                }`}>
                  {['pending', 'paid'].includes(effectiveState) ? (
                    '6'
                  ) : effectiveState === 'shipping' ? (
                    <span className="material-symbols-outlined text-[16px]">local_shipping</span>
                  ) : (
                    <span className="material-symbols-outlined text-[16px]">check</span>
                  )}
                </div>
                <span className={`text-[11px] block leading-tight ${
                  effectiveState === 'shipping' ? 'font-bold text-[#6c5937]' : 'font-semibold text-[#1c1b19]'
                }`}>
                  6. Bàn giao
                </span>
                <span className={`text-[10px] block mt-0.5 ${
                  effectiveState === 'shipping' ? 'text-[#6c5937] font-semibold' : 'text-[#4c463c]'
                }`}>
                  {effectiveState === 'shipping' ? 'Đang bàn giao' : 'Bưu tá nhận'}
                </span>
              </div>

              {/* Step 7: ĐANG THUÊ (Chỉ sáng khi khách ĐÃ KÝ CLA) */}
              <div className="flex flex-col items-center text-center relative z-10 px-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs shadow-xs mb-1.5 ${
                  effectiveState === 'renting'
                    ? 'bg-[#6c5937] text-white ring-4 ring-[#f9dfb3]'
                    : ['pending', 'paid', 'shipping'].includes(effectiveState)
                    ? 'bg-[#f2ede9] text-[#4c463c]'
                    : 'bg-[#48654b] text-white'
                }`}>
                  {['pending', 'paid', 'shipping'].includes(effectiveState) ? '7' : <span className="material-symbols-outlined text-[16px]">check</span>}
                </div>
                <span className={`text-[11px] block leading-tight ${
                  effectiveState === 'renting' ? 'font-bold text-[#6c5937]' : 'font-semibold text-[#1c1b19]'
                }`}>
                  7. Đang thuê
                </span>
                <span className={`text-[10px] block mt-0.5 ${
                  effectiveState === 'renting' ? 'text-[#6c5937] font-semibold' : 'text-[#4c463c]'
                }`}>
                  {rentalDays} Ngày lưu hành
                </span>
              </div>

              {/* Step 8: Yêu cầu trả (sáng khi user bấm yêu cầu trả đồ) */}
              <div className="flex flex-col items-center text-center relative z-10 px-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs shadow-xs mb-1.5 ${
                  effectiveState === 'return_requested'
                    ? 'bg-[#6c5937] text-white ring-4 ring-[#f9dfb3]'
                    : ['returning', 'inspecting', 'completed'].includes(effectiveState)
                    ? 'bg-[#48654b] text-white'
                    : 'bg-[#f2ede9] text-[#4c463c]'
                }`}>
                  {effectiveState === 'return_requested' ? (
                    <span className="material-symbols-outlined text-[16px]">assignment_return</span>
                  ) : ['returning', 'inspecting', 'completed'].includes(effectiveState) ? (
                    <span className="material-symbols-outlined text-[16px]">check</span>
                  ) : (
                    '8'
                  )}
                </div>
                <span className={`text-[11px] block leading-tight ${
                  effectiveState === 'return_requested' ? 'font-bold text-[#6c5937]' : 'font-semibold text-[#1c1b19]'
                }`}>
                  8. Yêu cầu trả
                </span>
                <span className={`text-[10px] block mt-0.5 ${
                  effectiveState === 'return_requested' ? 'text-[#6c5937] font-semibold' : 'text-[#4c463c]'
                }`}>
                  {effectiveState === 'return_requested' ? 'Đã yêu cầu' : 'Khách đóng gói'}
                </span>
              </div>

              {/* Step 9: Đã hoàn trả (sáng khi user điền xong thông tin & xác nhận trả, hiển thị ngày thực tế) */}
              <div className="flex flex-col items-center text-center relative z-10 px-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs shadow-xs mb-1.5 ${
                  effectiveState === 'returning'
                    ? 'bg-[#6c5937] text-white ring-4 ring-[#f9dfb3]'
                    : ['inspecting', 'completed'].includes(effectiveState)
                    ? 'bg-[#48654b] text-white'
                    : 'bg-[#f2ede9] text-[#4c463c]'
                }`}>
                  {effectiveState === 'returning' ? (
                    <span className="material-symbols-outlined text-[16px]">local_shipping</span>
                  ) : ['inspecting', 'completed'].includes(effectiveState) ? (
                    <span className="material-symbols-outlined text-[16px]">check</span>
                  ) : (
                    '9'
                  )}
                </div>
                <span className={`text-[11px] block leading-tight ${
                  effectiveState === 'returning' ? 'font-bold text-[#6c5937]' : 'font-semibold text-[#1c1b19]'
                }`}>
                  9. Đã hoàn trả
                </span>
                <span className={`text-[10px] block mt-0.5 ${
                  ['returning', 'inspecting', 'completed'].includes(effectiveState) ? 'text-[#6c5937] font-semibold' : 'text-[#4c463c]'
                }`}>
                  {['returning', 'inspecting', 'completed'].includes(effectiveState)
                    ? actualReturnDateFormatted
                    : endDateFormatted}
                </span>
              </div>

              {/* Step 10: INSPECTING */}
              <div className="flex flex-col items-center text-center relative z-10 px-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs shadow-md mb-1.5 ${
                  effectiveState === 'inspecting'
                    ? 'bg-[#6c5937] text-white ring-4 ring-[#f9dfb3]'
                    : effectiveState === 'completed'
                    ? 'bg-[#48654b] text-white'
                    : 'bg-[#f2ede9] text-[#4c463c]'
                }`}>
                  {effectiveState === 'completed' ? (
                    <span className="material-symbols-outlined text-[16px]">check</span>
                  ) : (
                    <span className="material-symbols-outlined text-[18px]">dry_cleaning</span>
                  )}
                </div>
                <span className={`text-[11px] block leading-tight ${
                  effectiveState === 'inspecting' ? 'font-bold text-[#6c5937]' : 'font-semibold text-[#1c1b19]'
                }`}>
                  10. Nghiệm thu
                </span>
                <span className={`text-[10px] block mt-0.5 ${
                  effectiveState === 'inspecting' ? 'text-[#6c5937] font-semibold' : 'text-[#4c463c]'
                }`}>
                  {effectiveState === 'inspecting' ? 'ĐANG XỬ LÝ' : effectiveState === 'completed' ? 'Đạt chuẩn' : 'Chờ hồi kho'}
                </span>
              </div>

              {/* Step 11: COMPLETED */}
              <div className={`flex flex-col items-center text-center relative z-10 px-1 ${
                effectiveState === 'completed' ? 'opacity-100' : 'opacity-60'
              }`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs mb-1.5 ${
                  effectiveState === 'completed'
                    ? 'bg-[#48654b] text-white shadow-md ring-4 ring-[#caebc9]'
                    : 'bg-[#f2ede9] text-[#4c463c]'
                }`}>
                  {effectiveState === 'completed' ? (
                    <span className="material-symbols-outlined text-[16px]">verified</span>
                  ) : (
                    <span>11</span>
                  )}
                </div>
                <span className="text-[11px] font-semibold text-[#1c1b19] block leading-tight">
                  11. Hoàn tất
                </span>
                <span className="text-[10px] text-[#4c463c] block mt-0.5">
                  {effectiveState === 'completed' ? 'Đã hoàn cọc 100%' : 'Hoàn cọc'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Two-Column Editorial Grid Workspace */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 no-reveal">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start no-reveal">
          {/* LEFT COLUMN: Workspace Panels (8 cols) */}
          <div className="lg:col-span-8 flex flex-col gap-6 no-reveal">
            {/* SECTION A: Items in this order */}
            <section className="no-reveal bg-white p-6 sm:p-7 rounded-2xl shadow-xs border border-[#e6e2de]">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                <div>
                  <span className="text-[11px] uppercase tracking-widest text-[#6c5937] font-semibold block">
                    Danh mục Hiện vật Trong Đơn Thuê
                  </span>
                  <h2 className="font-serif text-xl sm:text-2xl text-[#1c1b19] font-medium">
                    {items.length > 1
                      ? `Chi Tiết ${String(items.length).padStart(2, '0')} Hiện Vật Trong Sổ Lệnh`
                      : 'Chi Tiết Hiện Vật Thời Trang Lưu Ký'}
                  </h2>
                </div>
                <div className="px-3.5 py-1.5 bg-[#f7f3ef] rounded-lg text-right border border-[#ece7e4]">
                  <span className="text-[10px] uppercase tracking-wider text-[#4c463c] block font-semibold">
                    Kỳ hạn thuê xác thực
                  </span>
                  <span className="text-xs sm:text-sm font-semibold text-[#1c1b19]">
                    {startDateFormatted} → {endDateFormatted} ({rentalDays} ngày)
                  </span>
                </div>
              </div>

              {/* Primary Item */}
              <div className="space-y-4">
                <div className="p-4 bg-[#f7f3ef] rounded-xl flex flex-col sm:flex-row gap-4 border border-[#ece7e4]">
                  <div className="w-full sm:w-44 h-40 shrink-0 bg-white rounded-lg overflow-hidden border border-[#e6e2de]">
                    <img
                      className="w-full h-full object-cover"
                      alt={primaryItem.title}
                      src={primaryItem.image}
                    />
                  </div>
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] text-[#48654b] uppercase font-bold tracking-wider">
                          Hiện vật chính • Tiêu chuẩn Khử khuẩn Ozone
                        </span>
                        <span className="text-xs text-[#4c463c] font-mono font-semibold">{primaryItem.sku}</span>
                      </div>
                      <h3 className="font-serif text-lg font-semibold text-[#1c1b19] mt-1">
                        {primaryItem.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-[#4c463c] mt-1">
                        Tình trạng bàn giao: <span className="text-[#48654b] font-semibold">{primaryItem.grade}</span> • Quy cách đóng gói: <span className="font-medium text-[#1c1b19]">Túi bảo quản chuyên dụng chống ẩm mốc</span>
                      </p>
                    </div>
                    <div className="pt-3 mt-3 border-t border-[#e6e2de] flex flex-wrap items-end justify-between gap-2">
                      <div>
                        <span className="text-[11px] text-[#4c463c] block">Đơn giá thuê</span>
                        <span className="text-sm sm:text-base font-semibold text-[#1c1b19]">
                          {primaryItem.pricePerDay.toLocaleString('vi-VN')} ₫ <span className="text-xs text-[#4c463c] font-normal">× {rentalDays} ngày = {(primaryItem.pricePerDay * rentalDays).toLocaleString('vi-VN')} ₫</span>
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[11px] text-[#4c463c] block">Ký quỹ món này</span>
                        <span className="text-sm sm:text-base font-bold text-[#6c5937]">{primaryItem.deposit.toLocaleString('vi-VN')} ₫</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Danh mục Hiện vật Cho thuê Gộp: Nếu không có thì để không có */}
                <div className="mt-4 pt-4 border-t border-[#f2ede9]">
                  <span className="text-[11px] uppercase tracking-widest text-[#6c5937] font-semibold block mb-2.5">
                    Danh mục Hiện vật Cho thuê Gộp:
                  </span>
                  {bundledItems.length === 0 ? (
                    <div className="p-4 bg-stone-50 rounded-xl border border-dashed border-[#d8d2c5] flex items-center justify-between gap-3 text-xs text-[#7e766a]">
                      <div className="flex items-center gap-2.5">
                        <span className="material-symbols-outlined text-[#8a8276] text-[20px]">inventory_2</span>
                        <span>
                          <strong>Không có hiện vật cho thuê gộp đi kèm</strong> (Đơn thuê độc lập 01 hiện vật).
                        </span>
                      </div>
                      <span className="px-2.5 py-1 bg-white rounded font-mono text-[11px] border border-[#e6e2de]">
                        Gộp: Không có
                      </span>
                    </div>
                  ) : (
                    bundledItems.map((bItem, bIdx) => (
                      <div key={bIdx} className="p-4 bg-[#f7f3ef] rounded-xl flex flex-col sm:flex-row gap-4 border border-[#ece7e4] mb-3">
                        <div className="w-full sm:w-44 h-36 shrink-0 bg-white rounded-lg overflow-hidden border border-[#e6e2de]">
                          <img className="w-full h-full object-cover" alt={bItem.title} src={bItem.image} />
                        </div>
                        <div className="flex-1 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[11px] text-[#48654b] uppercase font-bold tracking-wider">
                                Phụ kiện thời trang gộp đi kèm
                              </span>
                              <span className="text-xs text-[#4c463c] font-mono font-semibold">{bItem.sku}</span>
                            </div>
                            <h3 className="font-serif text-lg font-semibold text-[#1c1b19] mt-1">{bItem.title}</h3>
                            <p className="text-xs text-[#4c463c] mt-1">
                              Tình trạng bàn giao: <span className="text-[#48654b] font-semibold">{bItem.grade}</span>
                            </p>
                          </div>
                          <div className="pt-3 mt-3 border-t border-[#e6e2de] flex flex-wrap items-end justify-between gap-2">
                            <div>
                              <span className="text-[11px] text-[#4c463c] block">Đơn giá / ngày</span>
                              <span className="text-sm font-semibold text-[#1c1b19]">
                                {bItem.pricePerDay.toLocaleString('vi-VN')} ₫
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="text-[11px] text-[#4c463c] block">Ký quỹ món này</span>
                              <span className="text-sm font-bold text-[#6c5937]">{bItem.deposit.toLocaleString('vi-VN')} ₫</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Rental Summary Footer Bar */}
              <div className="mt-4 p-4 bg-[#f2ede9] rounded-xl flex flex-wrap items-center justify-between gap-4 border border-[#e6e2de]">
                <div className="flex items-center gap-2.5 text-[#4c463c]">
                  <span className="material-symbols-outlined text-[#48654b] text-[22px] shrink-0">verified</span>
                  <span className="text-xs sm:text-sm">
                    Quy chuẩn bảo quản xưởng <strong>Atelier Haute Couture</strong>: Đã hấp tiệt trùng và ép phom chuẩn chỉ trước khi xuất kho.
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs uppercase tracking-wider text-[#4c463c] font-semibold">Tổng cọc bảo chứng:</span>
                  <span className="font-serif text-lg font-bold text-[#6c5937]">{originalDeposit.toLocaleString('vi-VN')} ₫</span>
                </div>
              </div>
            </section>

            {/* SECTION B: RETURN INSPECTION & FORENSIC COMPARISON */}
            <section className="no-reveal bg-white p-6 sm:p-7 rounded-2xl shadow-xs border border-[#e6e2de]">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-[#6c5937] text-[26px]">troubleshoot</span>
                  <div>
                    <span className="text-[11px] uppercase tracking-widest text-[#6c5937] font-semibold block">
                      Fashion Inspection Protocol 04-RNT
                    </span>
                    <h2 className="font-serif text-xl sm:text-2xl text-[#1c1b19] font-medium">
                      Biên Bản Giám Định &amp; Thẩm Định Hoàn Trả
                    </h2>
                  </div>
                </div>
                <span className="px-3.5 py-1 bg-[#caebc9] text-[#05210c] text-[11px] font-bold uppercase tracking-wider rounded-full">
                  Lab Nghiệm Thu Vải &amp; Trang Phục
                </span>
              </div>

              {/* Advisory Warning Banner */}
              <div className="p-4 bg-[#f7f3ef] rounded-xl mb-6 flex items-start gap-3 border border-[#ece7e4]">
                <span className="material-symbols-outlined text-[#6c5937] text-[20px] shrink-0 mt-0.5">info</span>
                <p className="text-xs sm:text-sm text-[#4c463c] leading-relaxed">
                  <strong className="text-[#1c1b19]">Quy chuẩn xưởng ReUse Hub:</strong> Tiền cọc được khóa bảo chứng an toàn qua Smart Escrow VNPay. Khi hiện vật hoàn trả về Lab, chuyên viên sẽ soi kính hiển vi kiểm tra từng đường kim sợi vải và cúc khóa để đối soát với ảnh xuất kho ban đầu.
                </p>
              </div>

              {/* High-Res Photographic Side-by-Side Proof Grid */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-serif text-base font-semibold text-[#1c1b19]">
                    Đối Chiếu Bằng Chứng Ảnh Hiện Trạng Xuất Kho &amp; Hoàn Trả
                  </h3>
                  <span className="text-[11px] text-[#4c463c] font-mono">Dữ liệu lưu trữ bất biến AWS S3</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Column 1: Hand-off Condition */}
                  <div className="bg-[#f7f3ef] p-4 rounded-xl flex flex-col justify-between border border-[#ece7e4]">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs sm:text-sm font-semibold text-[#1c1b19] flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${isClaSigned ? 'bg-[#48654b]' : 'bg-amber-600'}`}></span>
                          Ảnh Bàn Giao Xuất Kho ({startDateFormatted})
                        </span>
                        <span className={`text-[11px] px-2.5 py-0.5 rounded font-semibold border ${
                          isClaSigned ? 'bg-white text-[#48654b] border-[#e6e2de]' : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}>
                          {isClaSigned ? 'Đã ký CLA (3 góc đối kiểm)' : 'Chưa có ảnh (Chờ khách ký CLA)'}
                        </span>
                      </div>

                      {isClaSigned ? (
                        <>
                          <div
                            className="h-52 bg-stone-900 rounded-lg overflow-hidden relative mb-2.5 cursor-pointer group"
                            onClick={() =>
                              setZoomImage({
                                src: claProofData?.photos?.slot1 || claProofData?.images?.[0] || primaryItem.image,
                                caption: `Ảnh đối kiểm xuất kho khi khách nhận hàng & ký CLA - ${customerInfo.fullName}`,
                              })
                            }
                          >
                            <img
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              alt="Ảnh bàn giao xuất kho trang phục"
                              src={claProofData?.photos?.slot1 || claProofData?.images?.[0] || primaryItem.image}
                            />
                            <span className="absolute bottom-2 left-2 px-2.5 py-1 bg-stone-900/80 text-white text-[11px] rounded backdrop-blur-sm">
                              Khách đã ký CLA &amp; nộp ảnh đối kiểm
                            </span>
                            <span className="absolute top-2 right-2 px-2 py-1 bg-black/60 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                              <span className="material-symbols-outlined text-[14px]">zoom_in</span> Xem ảnh
                            </span>
                          </div>
                          {claProofData?.photos && (
                            <div className="grid grid-cols-3 gap-1.5 mb-2.5">
                              {['slot1', 'slot2', 'slot3'].map((slotKey, sIdx) => {
                                const photoUrl = (claProofData.photos as any)?.[slotKey];
                                if (!photoUrl) return null;
                                return (
                                  <div
                                    key={slotKey}
                                    onClick={() => setZoomImage({ src: photoUrl, caption: `Góc ${sIdx + 1}: ${slotKey === 'slot1' ? 'Mặt trước' : slotKey === 'slot2' ? 'Mặt sau' : 'Chi tiết khóa/tag'}` })}
                                    className="h-14 rounded-lg overflow-hidden border border-stone-200 cursor-pointer relative group"
                                  >
                                    <img src={photoUrl} alt={`Góc ${sIdx + 1}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                                    <span className="absolute bottom-0 inset-x-0 bg-black/60 text-[9px] text-white text-center py-0.5 font-medium">Góc {sIdx + 1}</span>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                          <ul className="text-[#4c463c] text-xs space-y-1.5">
                            <li className="flex items-center gap-1.5">
                              <span className="material-symbols-outlined text-[#48654b] text-[16px]">check_circle</span>
                              Biên bản CLA đã được ký điện tử bởi {claProofData?.signerName || customerInfo.fullName}
                            </li>
                            <li className="flex items-center gap-1.5">
                              <span className="material-symbols-outlined text-[#48654b] text-[16px]">check_circle</span>
                              Thời điểm xác nhận bàn giao: {claProofData?.signDate || claProofData?.signedAt || startDateFormatted}
                            </li>
                          </ul>
                        </>
                      ) : (
                        <div className="h-52 bg-[#f0eae4] rounded-lg border-2 border-dashed border-[#dcd4cc] flex flex-col items-center justify-center p-4 text-center mb-2.5">
                          <span className="material-symbols-outlined text-3xl text-stone-400 mb-2">image_not_supported</span>
                          <span className="text-xs font-semibold text-stone-700">Chưa có ảnh bàn giao xuất kho</span>
                          <p className="text-[11px] text-stone-500 mt-1 max-w-[260px] leading-relaxed">
                            Khách hàng chưa nhận hàng và chưa ký biên bản CLA. Khi khách nhận hàng và tải lên 3 góc ảnh đối kiểm ở Bước 5, hình ảnh thực tế sẽ hiển thị tại đây.
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="mt-3 pt-2 text-[10px] font-mono text-[#7e766a] border-t border-[#e6e2de]">
                      {isClaSigned ? 'CLA Hash: ' + (order?.orderCode || cleanId).slice(-8) + '-SIGNED' : 'Trạng thái: Đang chờ khách nhận kiện hàng & ký CLA'}
                    </div>
                  </div>

                  {/* Column 2: Returned Condition (Lúc này đang thuê -> Chưa có ảnh) */}
                  <div className="bg-[#f7f3ef] p-4 rounded-xl flex flex-col justify-between border border-[#ece7e4]">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs sm:text-sm font-semibold text-[#1c1b19] flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${isOrderRentingOrEarlier ? 'bg-amber-500' : 'bg-[#6c5937]'}`}></span>
                          Ảnh Nhận Hoàn Trả Tại Lab ({endDateFormatted})
                        </span>
                        <span className={`text-[11px] px-2.5 py-0.5 rounded font-semibold border ${
                          isOrderRentingOrEarlier
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-white text-[#6c5937] border-[#e6e2de]'
                        }`}>
                          {isOrderRentingOrEarlier ? 'Chưa nhận hoàn trả' : 'Đã nghiệm thu'}
                        </span>
                      </div>

                      {/* Display Clean Placeholder if Still Renting */}
                      {isOrderRentingOrEarlier ? (
                        <div className="h-52 bg-[#f4eee8] rounded-lg border-2 border-dashed border-[#d8d2c5] flex flex-col items-center justify-center p-6 text-center mb-2.5">
                          <span className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-amber-700 shadow-2xs mb-2">
                            <span className="material-symbols-outlined text-[26px]">hourglass_empty</span>
                          </span>
                          <span className="text-xs font-bold text-[#3d3830] block">
                            Chưa có ảnh hoàn trả
                          </span>
                          <p className="text-[11px] text-[#766e62] mt-1 leading-relaxed max-w-xs">
                            Đơn hàng đang trong kỳ hạn lưu ký cho thuê. Khi khách hàng trả đồ và bưu tá giao về Lab, hình ảnh nghiệm thu macro sẽ hiển thị tại đây.
                          </p>
                        </div>
                      ) : (
                        <div
                          className="h-52 bg-stone-900 rounded-lg overflow-hidden relative mb-2.5 cursor-pointer group"
                          onClick={() =>
                            setZoomImage({
                              src: primaryItem.image,
                              caption: `Bàn nghiệm thu lab ngày ${endDateFormatted} - Trang phục đối chiếu nguyên bản`,
                            })
                          }
                        >
                          <img
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            alt="Ảnh nghiệm thu hoàn trả"
                            src={primaryItem.image}
                          />
                          <span className="absolute bottom-2 left-2 px-2.5 py-1 bg-stone-900/80 text-white text-[11px] rounded backdrop-blur-sm">
                            Đã đối chiếu khớp CLA
                          </span>
                        </div>
                      )}

                      <ul className="text-[#4c463c] text-xs space-y-1.5">
                        <li className="flex items-center gap-1.5">
                          <span className={`material-symbols-outlined text-[16px] ${isOrderRentingOrEarlier ? 'text-amber-600' : 'text-[#48654b]'}`}>
                            {isOrderRentingOrEarlier ? 'schedule' : 'check_circle'}
                          </span>
                          <span>{isOrderRentingOrEarlier ? 'Chờ tiếp nhận kiện hàng hoàn trả từ bưu tá' : 'Đã soi kính hiển vi: Cấu trúc sợi vải nguyên vẹn'}</span>
                        </li>
                        <li className="flex items-center gap-1.5">
                          <span className={`material-symbols-outlined text-[16px] ${isOrderRentingOrEarlier ? 'text-amber-600' : 'text-[#48654b]'}`}>
                            {isOrderRentingOrEarlier ? 'schedule' : 'check_circle'}
                          </span>
                          <span>{isOrderRentingOrEarlier ? 'Chưa phát sinh khấu trừ hao tổn' : 'Không có vết ố mỹ phẩm hay vết rách sợi'}</span>
                        </li>
                      </ul>
                    </div>
                    <div className="mt-3 pt-2 text-[10px] font-mono text-[#7e766a] border-t border-[#e6e2de]">
                      {isOrderRentingOrEarlier ? 'Trạng thái: Đang trong chu kỳ lưu ký' : 'MD5: a91823bb084dcba91848574100ecae21'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Forensic Assessment Form */}
              <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs uppercase tracking-wider text-[#1c1b19] font-bold block mb-1.5">
                      Kết luận nghiệm thu (Condition Result)
                    </label>
                    <select
                      value={conditionResult}
                      onChange={(e) => setConditionResult(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-[#f7f3ef] text-[#1c1b19] rounded-lg text-xs sm:text-sm border border-[#ece7e4] focus:outline-none focus:border-[#6c5937] transition-colors cursor-pointer"
                    >
                      <option value="perfect">Đạt chuẩn hoàn hảo - Đủ điều kiện giải phóng cọc 100%</option>
                      <option value="minor_wear">Hao mòn sợi vải nhẹ trong hạn mức (Không tính phí khấu trừ)</option>
                      <option value="stain_makeup">Vết bẩn mỹ phẩm/rượu vang nhẹ (Khấu trừ phí giặt hấp khô chuyên sâu 200.000 ₫)</option>
                      <option value="damage_tear">Rách vải/Bung khóa/Mất phụ kiện đính kèm (Khấu trừ phục chế 1.000.000 ₫)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs uppercase tracking-wider text-[#1c1b19] font-bold block mb-1.5">
                      Đánh giá hao mòn &amp; Phụ kiện
                    </label>
                    <div className="flex gap-2">
                      <div className="flex-1 px-3 py-2.5 bg-[#f7f3ef] rounded-lg text-xs sm:text-sm text-[#1c1b19] flex items-center justify-between border border-[#ece7e4]">
                        <span className="text-[#4c463c] text-xs">Hư hại:</span>
                        <span className={`font-semibold ${deductionAmount > 0 ? 'text-[#ba1a1a]' : 'text-[#48654b]'}`}>
                          {deductionAmount > 0 ? `-${deductionAmount.toLocaleString('vi-VN')} ₫` : 'Không (0 ₫)'}
                        </span>
                      </div>
                      <div className="flex-1 px-3 py-2.5 bg-[#f7f3ef] rounded-lg text-xs sm:text-sm text-[#1c1b19] flex items-center justify-between border border-[#ece7e4]">
                        <span className="text-[#4c463c] text-xs">Phụ kiện:</span>
                        <span className="font-semibold text-[#48654b]">Đủ 100%</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs uppercase tracking-wider text-[#1c1b19] font-bold block mb-1.5">
                    Ghi chú thẩm định chuyên sâu của Giám định viên (Inspection Note)
                  </label>
                  <textarea
                    value={inspectionNote}
                    onChange={(e) => setInspectionNote(e.target.value)}
                    rows={3}
                    className="w-full p-3.5 bg-[#f7f3ef] text-[#1c1b19] rounded-lg text-xs sm:text-sm border border-[#ece7e4] focus:outline-none focus:border-[#6c5937] transition-colors leading-relaxed"
                  />
                </div>

                {/* Escrow Settlement Calculation Box */}
                <div className="p-4 bg-[#f2ede9] rounded-xl border border-[#e6e2de]">
                  <span className="text-[11px] uppercase tracking-widest text-[#4c463c] font-semibold block mb-2">
                    Quyết toán Hoàn Trả Ký Quỹ Escrow (Live Calculation)
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center sm:text-left">
                    <div>
                      <span className="text-xs text-[#4c463c] block">Ký quỹ gốc ban đầu</span>
                      <span className="font-serif text-lg sm:text-xl text-[#1c1b19] font-semibold">
                        {originalDeposit.toLocaleString('vi-VN')} ₫
                      </span>
                    </div>
                    <div>
                      <span className="text-xs text-[#4c463c] block">Khấu trừ hao tổn / Vi phạm</span>
                      <span className={`font-serif text-lg sm:text-xl font-semibold ${deductionAmount > 0 ? 'text-[#ba1a1a]' : 'text-[#48654b]'
                        }`}>
                        {deductionAmount > 0 ? `-${deductionAmount.toLocaleString('vi-VN')} ₫` : '-0 ₫'}
                      </span>
                    </div>
                    <div className="sm:text-right">
                      <span className="text-xs text-[#6c5937] uppercase font-bold block">Thực hoàn cho Khách</span>
                      <span className="font-serif text-lg sm:text-xl text-[#6c5937] font-bold">
                        {refundAmount.toLocaleString('vi-VN')} ₫{' '}
                        <span className="text-xs font-normal">
                          ({deductionAmount === 0 ? '100%' : `${Math.round((refundAmount / originalDeposit) * 100)}%`})
                        </span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons for Return Inspection */}
                <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
                  {isOrderRentingOrEarlier ? (
                    /* Khi đang ở trạng thái đang giao đồ hoặc đang thuê, chưa có nút ký duyệt */
                    <div className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-[#f7f3ef] border border-[#ece7e4] text-[#6c5937] rounded-lg text-xs sm:text-sm font-medium">
                      <span className="material-symbols-outlined text-[18px] text-amber-600">lock_clock</span>
                      <span>
                        {effectiveState === 'shipping'
                          ? 'Đơn hàng đang giao đồ · Khách chưa nhận kiện và chưa phát sinh yêu cầu trả đồ'
                          : 'Khách đang thuê · Khi nào khách trả đồ thì mới hiển thị nút Ký duyệt'}
                      </span>
                    </div>
                  ) : effectiveState === 'completed' ? (
                    <div className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-[#caebc9] border border-[#a8dba6] text-[#05210c] rounded-lg text-xs sm:text-sm font-bold uppercase tracking-wider">
                      <span className="material-symbols-outlined text-[18px]">verified</span>
                      <span>Đã ký duyệt &amp; Giải phóng cọc 100%</span>
                    </div>
                  ) : (
                    /* Khi khách ĐÃ TRẢ ĐỒ: hiển thị nút ký duyệt để shop owner ký */
                    <>
                      <button
                        type="button"
                        onClick={() => setShowDisputeModal(true)}
                        className="w-full sm:w-auto px-5 py-2.5 bg-[#f2ede9] hover:bg-[#ece7e4] text-[#1c1b19] rounded-lg text-xs sm:text-sm font-semibold transition-colors cursor-pointer border border-[#e6e2de]"
                      >
                        Yêu cầu Trọng Tài / Báo Cáo Khiếu Nại
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowEscrowConfirmModal(true)}
                        className="w-full sm:w-auto px-6 py-2.5 bg-[#1c1b19] hover:bg-[#6c5937] text-white rounded-lg text-xs sm:text-sm uppercase tracking-wider font-semibold shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[18px]">verified_user</span>
                        <span>
                          {deductionAmount === 0
                            ? 'Ký Duyệt & Giải Tỏa Cọc Escrow 100%'
                            : `Ký Duyệt Hoàn Cọc (${refundAmount.toLocaleString('vi-VN')} ₫)`}
                        </span>
                      </button>
                    </>
                  )}
                </div>
              </form>
            </section>

            {/* SECTION C: Collapsible Reference Workflows */}
            <section className="no-reveal bg-white p-6 sm:p-7 rounded-2xl shadow-xs border border-[#e6e2de]">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <span className="text-[11px] uppercase tracking-widest text-[#4c463c] font-semibold">
                    Cẩm Nang Vận Hành Xưởng
                  </span>
                  <h2 className="font-serif text-xl text-[#1c1b19] font-medium">
                    Kịch Bản Xử Lý Ở Các Pha Nghiệp Vụ
                  </h2>
                </div>
                <span className="material-symbols-outlined text-[#4c463c]">help_outline</span>
              </div>

              <div className="space-y-3">
                {/* Pending Mode Workflow */}
                <details className="group bg-[#f7f3ef] rounded-xl p-4 border border-[#ece7e4]" open={demoState === 'pending'}>
                  <summary className="flex items-center justify-between cursor-pointer list-none font-serif text-base text-[#1c1b19] font-semibold">
                    <span className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#6c5937] text-[20px]">assignment_turned_in</span>
                      Kịch bản Giai đoạn PENDING (Duyệt thẩm định đơn thuê)
                    </span>
                    <span className="material-symbols-outlined group-open:rotate-180 transition-transform text-[20px] text-[#4c463c]">
                      expand_more
                    </span>
                  </summary>
                  <div className="pt-3 mt-3 border-t border-[#e6e2de] text-xs sm:text-sm text-[#4c463c] space-y-3 leading-relaxed">
                    <p>
                      Khi khách đặt đơn, đơn sẽ ở trạng thái PENDING. Chủ shop kiểm tra tình trạng hiện vật thời trang &amp; lịch hẹn. Khi chủ shop bấm <strong>[Duyệt đơn]</strong>, bên khách hàng sẽ nhận được thông báo và hiển thị nút thanh toán cọc VNPay.
                    </p>
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={handleApproveOrder}
                        disabled={isApproving}
                        className="px-4 py-2 bg-[#6c5937] hover:bg-[#554424] text-white rounded text-xs uppercase tracking-wider font-semibold cursor-pointer transition-colors shadow-xs disabled:opacity-50"
                      >
                        {isApproving ? 'Đang duyệt...' : 'Duyệt Đơn Thuê → Chuyển Chờ Thanh Toán'}
                      </button>
                      <button
                        type="button"
                        onClick={() => showToast('Đã từ chối đơn thuê và gửi lý do tới khách hàng.')}
                        className="px-4 py-2 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded text-xs uppercase tracking-wider font-semibold cursor-pointer transition-colors"
                      >
                        Từ chối Đơn Thuê (Nhập lý do)
                      </button>
                    </div>
                  </div>
                </details>

                {/* Shipping / Paid Mode Workflow */}
                <details className="group bg-[#f7f3ef] rounded-xl p-4 border border-[#ece7e4]" open={demoState === 'paid'}>
                  <summary className="flex items-center justify-between cursor-pointer list-none font-serif text-base text-[#1c1b19] font-semibold">
                    <span className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#48654b] text-[20px]">local_shipping</span>
                      Kịch bản Giai đoạn PAID / SHIPPING (Đóng gói bảo quản &amp; Bàn giao bưu tá)
                    </span>
                    <span className="material-symbols-outlined group-open:rotate-180 transition-transform text-[20px] text-[#4c463c]">
                      expand_more
                    </span>
                  </summary>
                  <div className="pt-3 mt-3 border-t border-[#e6e2de] text-xs sm:text-sm text-[#4c463c] space-y-3 leading-relaxed">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <span className="text-[11px] uppercase tracking-wider block text-[#4c463c] font-semibold">
                          Người nhận uỷ quyền
                        </span>
                        <span className="text-xs sm:text-sm font-semibold text-[#1c1b19] block">
                          {customerInfo.fullName} ({customerInfo.phone})
                        </span>
                        <span className="text-xs block text-[#7e766a]">{customerInfo.fullAddress}</span>
                      </div>
                      <div>
                        <span className="text-[11px] uppercase tracking-wider block text-[#4c463c] font-semibold">
                          Vận chuyển Chuyên dụng
                        </span>
                        <span className="text-xs sm:text-sm font-semibold text-[#1c1b19] font-mono block">
                          Mã Vận Đơn: #VN-{displayOrderCode.replace(/\D/g, '').slice(-6) || '883910'}-RNT
                        </span>
                        <span className="text-xs block text-[#48654b] font-medium">Giao nhận 2 chiều (Đã thanh toán)</span>
                      </div>
                    </div>
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={handleMarkReadyForShipping}
                        className="px-4 py-2 bg-[#1c1b19] hover:bg-[#6c5937] text-white rounded text-xs uppercase tracking-wider font-semibold cursor-pointer transition-colors shadow-xs"
                      >
                        Đánh dấu Sẵn Sàng Bàn Giao Bưu Tá (Ready for Handover)
                      </button>
                    </div>
                  </div>
                </details>
              </div>
            </section>
          </div>

          {/* RIGHT COLUMN: Customer, Financial & Compliance Sidebar (4 cols) */}
          <aside className="no-reveal lg:col-span-4 flex flex-col gap-6">
            {/* CARD 1: Customer Profile & Trust Metric (Đã match với user đặt) */}
            <div className="bg-white p-6 rounded-2xl shadow-xs border border-[#e6e2de]">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[11px] uppercase tracking-widest text-[#4c463c] font-semibold">
                  Người Thuê Lưu Ký
                </span>
                <span className="px-2.5 py-0.5 bg-[#caebc9] text-[#05210c] text-[11px] rounded-full font-bold">
                  KYC Verified
                </span>
              </div>
              <div className="flex items-center gap-3.5 pb-4 border-b border-[#f2ede9]">
                <div className="w-14 h-14 rounded-full bg-[#f9dfb3] flex items-center justify-center text-[#261901] font-serif font-bold text-xl shrink-0">
                  {customerInfo.initials}
                </div>
                <div>
                  <h3 className="font-serif text-lg font-semibold text-[#1c1b19] leading-tight">
                    {customerInfo.fullName}
                  </h3>
                  <span className="text-xs text-[#4c463c] block">{customerInfo.email}</span>
                  <span className="text-xs text-[#48654b] font-semibold">Khách hàng thuê trang phục cao cấp</span>
                </div>
              </div>

              {/* Trust & Reputation Telemetry */}
              <div className="py-4 border-b border-[#f2ede9] grid grid-cols-3 gap-2 text-center">
                <div className="p-2.5 bg-[#f7f3ef] rounded-lg">
                  <span className="font-serif text-lg sm:text-xl font-bold text-[#1c1b19] block">{customerStats.rentalCount}</span>
                  <span className="text-[10px] uppercase text-[#4c463c] font-semibold">Lần thuê</span>
                </div>
                <div className="p-2.5 bg-[#f7f3ef] rounded-lg">
                  <span className="font-serif text-lg sm:text-xl font-bold text-[#48654b] block">{customerStats.disputeCount}</span>
                  <span className="text-[10px] uppercase text-[#4c463c] font-semibold">Tranh chấp</span>
                </div>
                <div className="p-2.5 bg-[#f7f3ef] rounded-lg">
                  <span className="font-serif text-lg sm:text-xl font-bold text-[#6c5937] block">{customerStats.trustPercent}</span>
                  <span className="text-[10px] uppercase text-[#4c463c] font-semibold">Tín nhiệm</span>
                </div>
              </div>

              {/* Fulfillment Coordinates */}
              <div className="pt-4 space-y-3 text-[#4c463c] text-xs sm:text-sm">
                <div>
                  <span className="text-[11px] uppercase tracking-wider text-[#4c463c] block font-semibold">
                    Điện thoại điều phối
                  </span>
                  <span className="text-[#1c1b19] font-mono font-medium">{customerInfo.phone}</span>
                </div>
                <div>
                  <span className="text-[11px] uppercase tracking-wider text-[#4c463c] block font-semibold">
                    Địa chỉ giao nhận chuyên dụng
                  </span>
                  <span className="text-[#1c1b19] leading-relaxed block">
                    {customerInfo.fullAddress}
                  </span>
                </div>
                <div className="p-3 bg-[#f7f3ef] rounded-lg text-xs text-[#4c463c] border border-[#ece7e4]">
                  <strong className="text-[#1c1b19]">Lưu ý bưu tá:</strong> Bàn giao tận tay, kiểm tra niêm phong túi bảo quản và ký biên bản CLA điện tử trước khi hoàn tất giao.
                </div>
              </div>

              <div className="mt-5 pt-1">
                <button
                  type="button"
                  onClick={() => setShowChatModal(true)}
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 bg-[#f2ede9] hover:bg-[#ece7e4] text-[#1c1b19] text-xs uppercase tracking-wider font-semibold rounded-lg transition-colors cursor-pointer border border-[#e6e2de]"
                >
                  <span className="material-symbols-outlined text-[18px]">chat</span>
                  <span>Nhắn Tin Trực Tiếp Với Khách</span>
                </button>
              </div>
            </div>

            {/* CARD 2: Financial Ledger & VNPay Escrow Breakdown */}
            <div className="bg-white p-6 rounded-2xl shadow-xs border border-[#e6e2de]">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <span className="text-[11px] uppercase tracking-widest text-[#6c5937] font-semibold block">
                    Sổ Kế Toán Minh Bạch
                  </span>
                  <h2 className="font-serif text-lg font-semibold text-[#1c1b19]">Thanh Toán &amp; Ký Quỹ Escrow</h2>
                </div>
                <span className="material-symbols-outlined text-[#6c5937] text-[22px]">account_balance_wallet</span>
              </div>

              {/* Escrow Status Badge */}
              <div className="p-3 bg-[#f7f3ef] rounded-xl mb-4 flex items-center justify-between border border-[#ece7e4]">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#6c5937]"></span>
                  <span className="text-xs font-bold text-[#1c1b19] uppercase">
                    {demoState === 'pending'
                      ? 'CHỜ SHOP DUYỆT ĐƠN'
                      : demoState === 'paid'
                      ? 'CHỜ THANH TOÁN ESCROW'
                      : 'ĐÃ THANH TOÁN & KHÓA KÝ QUỸ'}
                  </span>
                </div>
                <span className="text-[11px] font-mono text-[#4c463c]">VNPay Smart Vault</span>
              </div>

              {/* Financial Breakdown Table */}
              <div className="space-y-2 text-xs sm:text-sm text-[#4c463c] pb-4 border-b border-[#f2ede9]">
                <div className="flex justify-between py-1">
                  <span>Tiền thuê ({rentalDays} Ngày)</span>
                  <span className="text-[#1c1b19] font-medium">{rentalFee.toLocaleString('vi-VN')} ₫</span>
                </div>
                <div className="flex justify-between py-1">
                  <span>Tiền cọc Smart Escrow</span>
                  <span className="text-[#1c1b19] font-medium">{originalDeposit.toLocaleString('vi-VN')} ₫</span>
                </div>
                <div className="flex justify-between py-1">
                  <span>Vận chuyển 2 chiều</span>
                  <span className="text-[#1c1b19] font-medium">50.000 ₫</span>
                </div>
                <div className="flex justify-between py-1">
                  <span>Phí dịch vụ &amp; Bảo hiểm</span>
                  <span className="text-[#48654b] font-medium">0 ₫ (Miễn phí)</span>
                </div>
                <div className="pt-2 flex justify-between font-serif text-base text-[#1c1b19] font-bold border-t border-[#f2ede9]">
                  <span>Tổng Giá Trị Giao Dịch:</span>
                  <span>{totalPayment.toLocaleString('vi-VN')} ₫</span>
                </div>
              </div>

              {/* Escrow Vault Line Item */}
              <div className="pt-4 pb-2">
                <div className="p-4 bg-[#f2ede9] rounded-xl border border-[#e6e2de]">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] uppercase tracking-wider text-[#4c463c] font-semibold">
                      Tiền Ký Quỹ Bảo Chứng
                    </span>
                    <span className="text-[10px] font-bold text-[#6c5937] uppercase">ESCROW LOCKED</span>
                  </div>
                  <div className="font-serif text-2xl font-bold text-[#6c5937]">
                    {originalDeposit.toLocaleString('vi-VN')} ₫
                  </div>
                  <p className="text-[11px] text-[#4c463c] mt-1 font-mono truncate">
                    Mã đối soát: <span className="text-[#1c1b19]">VNP-ESCROW-{displayOrderCode.replace(/\D/g, '') || '6519'}</span>
                  </p>
                </div>
              </div>

              {/* Immutable Ledger Notice */}
              <div className="mt-3 flex items-start gap-2 text-[#4c463c] text-xs leading-relaxed">
                <span className="material-symbols-outlined text-[16px] text-[#6c5937] shrink-0 mt-0.5">lock</span>
                <p>
                  Dữ liệu thanh toán được bảo chứng tự động qua cổng VNPay &amp; Hợp đồng lưu ký ReUse Hub.
                </p>
              </div>
            </div>

            {/* CARD 3: Order Audit Log & Circular Standards */}
            <div className="bg-white p-6 rounded-2xl shadow-xs border border-[#e6e2de]">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-serif text-lg font-semibold text-[#1c1b19]">Chứng Thư &amp; Kiểm Thẩm</h3>
                <span className="text-[11px] text-[#48654b] uppercase font-bold bg-[#caebc9] px-2 py-0.5 rounded">
                  Standard v4.2
                </span>
              </div>
              <div className="space-y-3 text-xs sm:text-sm text-[#4c463c]">
                <div>
                  <span className="text-[11px] uppercase tracking-wider block font-semibold">Mã Hợp Đồng Điện Tử</span>
                  <span className="font-mono text-[#1c1b19] font-semibold">#{displayOrderCode.replace('#', '')}-AC</span>
                </div>
                <div>
                  <span className="text-[11px] uppercase tracking-wider block font-semibold">Thời Gian Khởi Tạo</span>
                  <span className="text-[#1c1b19]">{startDateFormatted} 10:15:00 ICT</span>
                </div>
                <div>
                  <span className="text-[11px] uppercase tracking-wider block font-semibold">Chữ Ký Số Xưởng</span>
                  <span className="text-[#1c1b19] block font-semibold">Atelier Haute Couture &amp; Wardrobe Specimen Lab</span>
                  <span className="text-xs text-[#7e766a]">Accredited Fashion &amp; Garment Custodian</span>
                </div>
              </div>

              {/* B-Corp Circularity Badge */}
              <div className="mt-5 p-3.5 bg-[#caebc9]/40 rounded-xl flex items-center gap-3 border border-[#caebc9]">
                <span className="material-symbols-outlined text-[#48654b] text-[26px] shrink-0">eco</span>
                <div>
                  <span className="text-xs font-bold text-[#05210c] block">B-Corp Certified Circularity</span>
                  <span className="text-[11px] text-[#4e6b50] leading-snug block">
                    Tiết kiệm 8.4kg CO₂e &amp; 2.500 lít nước thông qua mô hình chia sẻ trang phục dạ hội thiết kế tuần hoàn thay vì may mới.
                  </span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* MODAL 1: In Phiếu Giao Nhận & Biên Bản Nghiệm Thu */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl relative border border-stone-200 animate-fade-in max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setShowPrintModal(false)}
              className="absolute top-5 right-5 text-stone-400 hover:text-stone-800 text-xl font-bold p-1 cursor-pointer"
            >
              ✕
            </button>

            {/* Document Header */}
            <div className="border-b-2 border-stone-900 pb-4 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs uppercase font-bold tracking-widest text-[#6c5937]">ReUse Hub • Custody Lab</span>
                <h2 className="font-serif text-2xl font-bold text-stone-900">
                  BIÊN BẢN GIAO NHẬN &amp; NGHIỆM THU TRANG PHỤC
                </h2>
                <span className="text-xs text-stone-500 font-mono">Protocol: RH-FASHION-04-RNT • Số lệnh: {displayOrderCode}</span>
              </div>
              <div className="text-right sm:text-right">
                <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded font-semibold text-xs uppercase tracking-wider inline-block">
                  Chứng thư số hợp lệ
                </span>
                <div className="text-xs text-stone-500 mt-1 font-mono">{endDateFormatted} 14:20:00 ICT</div>
              </div>
            </div>

            {/* Document Details Grid */}
            <div className="grid grid-cols-2 gap-4 text-xs mb-6 bg-stone-50 p-4 rounded-xl border border-stone-200">
              <div>
                <span className="text-stone-500 uppercase block font-semibold text-[10px]">Đơn vị thẩm định:</span>
                <strong className="text-stone-900">Atelier Haute Couture &amp; Wardrobe Specimen Lab</strong>
                <div className="text-stone-600">Giám định viên: Trần Mai Phương</div>
              </div>
              <div>
                <span className="text-stone-500 uppercase block font-semibold text-[10px]">Bên thuê lưu ký:</span>
                <strong className="text-stone-900">{customerInfo.fullName}</strong>
                <div className="text-stone-600">{customerInfo.fullAddress}</div>
              </div>
            </div>

            {/* Items Table */}
            <table className="w-full text-left text-xs mb-6 border border-stone-200">
              <thead className="bg-stone-100 text-stone-700 font-semibold border-b border-stone-200">
                <tr>
                  <th className="p-2.5">Hiện vật</th>
                  <th className="p-2.5">SKU / Phân loại</th>
                  <th className="p-2.5">Xuất kho</th>
                  <th className="p-2.5">Hoàn trả</th>
                  <th className="p-2.5 text-right">Khấu trừ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {items.map((it, idx) => (
                  <tr key={idx}>
                    <td className="p-2.5 font-medium">{it.title}</td>
                    <td className="p-2.5 font-mono">{it.sku}</td>
                    <td className="p-2.5 text-emerald-700">Grade A+ (99%)</td>
                    <td className="p-2.5 text-emerald-700">
                      {isOrderRentingOrEarlier ? 'Đang lưu hành' : 'Grade A+ (Đạt chuẩn)'}
                    </td>
                    <td className="p-2.5 text-right font-semibold">0 ₫</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Notes & Signatures */}
            <div className="text-xs text-stone-600 mb-6 bg-stone-50 p-3 rounded-lg border border-stone-200">
              <strong className="text-stone-800">Kết luận:</strong> {inspectionNote}
            </div>

            <div className="grid grid-cols-2 gap-8 text-center text-xs pt-4 border-t border-stone-200">
              <div>
                <span className="font-semibold uppercase text-stone-500 block mb-12">Đại diện bên thuê</span>
                <span className="font-serif font-bold text-stone-900 block">{customerInfo.fullName}</span>
                <span className="text-[10px] text-stone-400 font-mono">Đã ký xác nhận biometric</span>
              </div>
              <div>
                <span className="font-semibold uppercase text-stone-500 block mb-12">Giám định viên trưởng</span>
                <span className="font-serif font-bold text-[#6c5937] block">Trần Mai Phương</span>
                <span className="text-[10px] text-stone-400 font-mono">Chữ ký số: 0x98A...6519</span>
              </div>
            </div>

            {/* Print actions */}
            <div className="mt-8 pt-4 border-t border-stone-200 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowPrintModal(false)}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 rounded text-xs font-semibold cursor-pointer"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-5 py-2 bg-[#1c1b19] hover:bg-[#6c5937] text-white rounded text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <span className="material-symbols-outlined text-[16px]">print</span>
                In Tài Liệu (Print)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Nhắn tin trực tiếp với khách */}
      {showChatModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl max-w-lg w-full p-5 shadow-2xl relative border border-stone-200 animate-fade-in flex flex-col h-[520px]">
            {/* Chat header */}
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#f9dfb3] text-[#261901] font-bold flex items-center justify-center font-serif">
                  {customerInfo.initials}
                </div>
                <div>
                  <h3 className="font-serif font-semibold text-sm text-[#1c1b19]">{customerInfo.fullName}</h3>
                  <span className="text-[11px] text-[#48654b] flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#48654b]"></span>
                    Trực tuyến • Khách thuê {displayOrderCode}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowChatModal(false)}
                className="text-stone-400 hover:text-stone-700 text-lg p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Chat messages */}
            <div className="flex-1 overflow-y-auto py-3 space-y-3 text-xs">
              {chatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col ${msg.sender === 'shop' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[85%] p-3 rounded-xl leading-relaxed ${msg.sender === 'shop'
                        ? 'bg-[#1c1b19] text-white rounded-br-none'
                        : 'bg-[#f2ede9] text-[#1c1b19] rounded-bl-none'
                      }`}
                  >
                    {msg.text}
                  </div>
                  <span className="text-[10px] text-stone-400 mt-1 px-1 font-mono">{msg.time}</span>
                </div>
              ))}
            </div>

            {/* Quick response chips */}
            <div className="py-2 flex items-center gap-1.5 overflow-x-auto text-[11px] border-t border-stone-100">
              <button
                type="button"
                onClick={() =>
                  setNewMessageText('Biên bản nghiệm thu trang phục đã hoàn tất đạt chuẩn 100%. Tiền cọc đã được gửi lệnh giải phóng!')
                }
                className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 rounded-full text-stone-700 whitespace-nowrap cursor-pointer"
              >
                ✓ Báo hoàn tất nghiệm thu 100%
              </button>
              <button
                type="button"
                onClick={() =>
                  setNewMessageText('Xưởng đã nhận đủ hiện vật trang phục và phụ kiện, cảm ơn bạn nhiều nhé!')
                }
                className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 rounded-full text-stone-700 whitespace-nowrap cursor-pointer"
              >
                ✓ Xác nhận nhận đủ hiện vật
              </button>
            </div>

            {/* Chat input */}
            <div className="pt-2 border-t border-stone-200 flex items-center gap-2">
              <input
                type="text"
                value={newMessageText}
                onChange={(e) => setNewMessageText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Nhập tin nhắn gửi khách hàng..."
                className="flex-1 px-3.5 py-2.5 bg-stone-100 rounded-lg text-xs focus:outline-none focus:bg-white focus:border focus:border-stone-400 transition-colors"
              />
              <button
                type="button"
                onClick={handleSendMessage}
                className="px-4 py-2.5 bg-[#1c1b19] hover:bg-[#6c5937] text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors"
              >
                Gửi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Yêu cầu Trọng Tài / Báo Cáo Khiếu Nại */}
      {showDisputeModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl relative border border-stone-200 animate-fade-in">
            <button
              type="button"
              onClick={() => setShowDisputeModal(false)}
              className="absolute top-5 right-5 text-stone-400 hover:text-stone-800 text-lg cursor-pointer"
            >
              ✕
            </button>

            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-[#ba1a1a] text-[24px]">gavel</span>
              <h3 className="font-serif text-lg font-semibold text-[#1c1b19]">
                Yêu cầu Trọng Tài ReUse Hub
              </h3>
            </div>
            <p className="text-xs text-stone-600 mb-4 leading-relaxed">
              Nếu phát hiện hư hại vượt mức hoặc không đúng hiện trạng trang phục ban đầu, chủ shop có thể yêu cầu Hội đồng Giám định Độc lập của ReUse Hub can thiệp phong tỏa khoản cọc Escrow {originalDeposit.toLocaleString('vi-VN')} ₫.
            </p>

            <div className="space-y-3 text-xs mb-5">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Loại sự vụ tranh chấp</label>
                <select className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg">
                  <option>Rách hỏng vải / Hư hại cấu trúc trang phục</option>
                  <option>Mất hoặc thiếu phụ kiện đính kèm</option>
                  <option>Hoàn trả trễ hạn không thông báo</option>
                  <option>Vết bẩn không thể phục chế qua giặt hấp</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Mô tả bằng chứng</label>
                <textarea
                  rows={3}
                  placeholder="Mô tả cụ thể vết xước, hình ảnh và video quay unboxing đối kiểm..."
                  className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg"
                />
              </div>

              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-amber-900 text-[11px] leading-relaxed">
                Sau khi gửi yêu cầu, số tiền cọc Escrow sẽ tạm hoãn giải ngân tối đa 48h để Trọng tài viên ReUse Hub thẩm tra hồ sơ hình ảnh đối chứng.
              </div>
            </div>

            <div className="flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowDisputeModal(false)}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 rounded text-xs font-semibold cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowDisputeModal(false);
                  showToast('Đã gửi yêu cầu trọng tài tới Hội đồng Giám định ReUse Hub!');
                }}
                className="px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white rounded text-xs font-semibold uppercase tracking-wider cursor-pointer shadow-xs"
              >
                Gửi Hồ Sơ Khiếu Nại
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Ký Duyệt & Giải Tỏa Cọc Escrow 100% Confirmation */}
      {showEscrowConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative border border-stone-200 animate-fade-in">
            <button
              type="button"
              onClick={() => setShowEscrowConfirmModal(false)}
              className="absolute top-5 right-5 text-stone-400 hover:text-stone-800 text-lg cursor-pointer"
            >
              ✕
            </button>

            <div className="text-center mb-4">
              <div className="w-14 h-14 rounded-full bg-[#caebc9] text-[#05210c] flex items-center justify-center mx-auto mb-3">
                <span className="material-symbols-outlined text-[30px]">verified_user</span>
              </div>
              <h3 className="font-serif text-xl font-bold text-stone-900">
                Xác Nhận Ký Duyệt &amp; Giải Tỏa Escrow
              </h3>
              <p className="text-xs text-stone-500 mt-1">
                Lệnh giải phóng tự động qua Smart Escrow VNPay
              </p>
            </div>

            <div className="bg-[#f7f3ef] p-4 rounded-xl space-y-2 text-xs mb-5 border border-[#ece7e4]">
              <div className="flex justify-between">
                <span className="text-[#4c463c]">Mã sổ lệnh:</span>
                <span className="font-mono font-bold text-stone-900">{displayOrderCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#4c463c]">Khách hàng nhận hoàn:</span>
                <span className="font-semibold text-stone-900">{customerInfo.fullName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#4c463c]">Số tiền cọc ban đầu:</span>
                <span className="font-semibold text-stone-900">{originalDeposit.toLocaleString('vi-VN')} ₫</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#4c463c]">Khấu trừ:</span>
                <span className="font-semibold text-emerald-700">
                  {deductionAmount > 0 ? `-${deductionAmount.toLocaleString('vi-VN')} ₫` : '0 ₫'}
                </span>
              </div>
              <div className="pt-2 border-t border-[#e6e2de] flex justify-between text-sm font-bold text-[#6c5937]">
                <span>Thực hoàn tài khoản khách:</span>
                <span>{refundAmount.toLocaleString('vi-VN')} ₫</span>
              </div>
            </div>

            <p className="text-[11px] text-stone-500 mb-5 leading-relaxed text-center">
              Bằng việc xác nhận, bạn đóng dấu chữ ký số của <strong>Atelier Haute Couture</strong> vào sổ cái. Khoản tiền cọc sẽ hoàn trả tức thì về tài khoản của khách hàng.
            </p>

            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => setShowEscrowConfirmModal(false)}
                className="flex-1 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
              >
                Kiểm tra lại
              </button>
              <button
                type="button"
                onClick={handleApproveEscrowRelease}
                className="flex-1 py-2.5 bg-[#1c1b19] hover:bg-[#6c5937] text-white rounded-lg text-xs uppercase tracking-wider font-semibold cursor-pointer transition-colors shadow-md flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">lock_open</span>
                <span>Ký Duyệt Ngay</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: Image Lightbox Zoom */}
      {zoomImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setZoomImage(null)}
        >
          <div
            className="max-w-4xl w-full bg-stone-950 rounded-2xl overflow-hidden p-2 text-white relative border border-stone-800"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setZoomImage(null)}
              className="absolute top-4 right-4 bg-black/70 hover:bg-black text-white w-9 h-9 rounded-full flex items-center justify-center text-lg z-10 cursor-pointer"
            >
              ✕
            </button>
            <div className="max-h-[75vh] overflow-hidden flex items-center justify-center bg-black rounded-xl">
              <img src={zoomImage.src} alt={zoomImage.caption} className="max-w-full max-h-[75vh] object-contain" />
            </div>
            <div className="p-3 text-center text-xs text-stone-300 font-mono">
              {zoomImage.caption}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShopRentOrderDetail;
