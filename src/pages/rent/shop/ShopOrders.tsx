import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShippingModal } from '../../../components/orders/ShippingModal';
import type { ShippingData } from '../../../components/orders/ShippingModal';
import { getShopRentalOrdersApi, handoverRentalOrderApi, approveRentalOrderApi, updateOrderStatusApi } from '../../../services/order.api';
import type { RentalOrderApi } from '../../../services/order.api';
import { calculateDynamicShippingFee, normalizeShopBranch } from '../../../utils/address';

export interface FormattedRentalOrder {
  _id: string;
  id: string;
  productName: string;
  customerName: string;
  rentalPeriod: string;
  totalAmount: number;
  depositAmount?: number;
  status: string;
  shippingCarrier?: string;
  trackingCode?: string;
  shippedAt?: string;
  isClaSigned?: boolean;
}

const mapApiOrderToFormatted = (apiOrder: RentalOrderApi): FormattedRentalOrder => {
  const item = apiOrder.items?.[0];
  const productName = item
    ? `${item.productName || 'Thiết bị cho thuê'}${apiOrder.items.length > 1 ? ` (+${apiOrder.items.length - 1} món khác)` : ''}`
    : 'Thiết bị cho thuê';

  const customerName =
    apiOrder.shippingAddress?.recipientName ||
    (typeof apiOrder.renterId === 'object' && apiOrder.renterId && 'fullName' in (apiOrder.renterId as Record<string, unknown>)
      ? String((apiOrder.renterId as Record<string, unknown>).fullName)
      : 'Khách hàng ReUse');

  const startDateStr = apiOrder.startDate ? new Date(apiOrder.startDate).toLocaleDateString('vi-VN') : '';
  const endDateStr = apiOrder.endDate ? new Date(apiOrder.endDate).toLocaleDateString('vi-VN') : '';
  const rentalPeriod = startDateStr && endDateStr ? `${startDateStr} - ${endDateStr}` : '3 ngày';

  // Kiểm tra khách đã ký CLA hay chưa (từ MongoDB claProof hoặc từ localStorage)
  const cleanCode = (apiOrder.orderCode || apiOrder._id || '').replace('#', '').trim();
  let isClaSigned = Boolean(apiOrder.claProof?.isSigned);
  if (!isClaSigned) {
    try {
      const localProof = localStorage.getItem(`cla_proof_${cleanCode}`) || localStorage.getItem(`cla_proof_${apiOrder._id}`);
      if (localProof) {
        const parsed = JSON.parse(localProof);
        if (parsed && (parsed.isSigned === true || parsed.signedAt)) {
          isClaSigned = true;
        }
      }
    } catch {}
  }

  // Nghiệp vụ cốt lõi: Nếu chưa ký CLA thì chỉ ở trạng thái "Đang giao đồ" (SHIPPING)
  let effectiveStatus = apiOrder.status;
  if (!isClaSigned && (effectiveStatus === 'RENTING' || effectiveStatus === 'DELIVERED')) {
    effectiveStatus = 'SHIPPING';
  } else if (isClaSigned && (effectiveStatus === 'SHIPPING' || effectiveStatus === 'DELIVERED' || effectiveStatus === 'HANDED_OVER')) {
    effectiveStatus = 'RENTING';
  }

  return {
    _id: apiOrder._id,
    id: apiOrder.orderCode || apiOrder._id,
    productName,
    customerName,
    rentalPeriod,
    totalAmount: (apiOrder.rentalFee && apiOrder.depositAmount) ? (apiOrder.rentalFee + apiOrder.depositAmount + calculateDynamicShippingFee(apiOrder.shippingAddress ? [apiOrder.shippingAddress.detail, apiOrder.shippingAddress.ward, apiOrder.shippingAddress.district, apiOrder.shippingAddress.province].filter(Boolean).join(', ') : 'Đà Nẵng', normalizeShopBranch(((item?.productId as unknown as { location?: string })?.location) || (item as unknown as { location?: string })?.location || 'Đà Nẵng'))) : (apiOrder.totalAmount || 0),
    depositAmount: apiOrder.depositAmount || 0,
    status: effectiveStatus,
    shippingCarrier: apiOrder.shippingDetails?.carrierName || apiOrder.shippingDetails?.carrier || '',
    trackingCode: apiOrder.shippingDetails?.trackingCode || '',
    shippedAt: apiOrder.shippingDetails?.shippedAt ? new Date(apiOrder.shippingDetails.shippedAt).toISOString() : undefined,
    isClaSigned,
  };
};

export const ShopOrders: React.FC = () => {
  const [orders, setOrders] = useState<FormattedRentalOrder[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedOrder, setSelectedOrder] = useState<FormattedRentalOrder | null>(null);
  const [approvingOrderId, setApprovingOrderId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const navigate = useNavigate();


  // Thao tác "Vào nghiệm thu": cập nhật trạng thái đơn sang RETURNED (lưu vào DB) -> bên user chuyển sang Bước 8
  const handleEnterInspection = async (order: FormattedRentalOrder) => {
    const targetId = order._id || order.id;
    try {
      await updateOrderStatusApi(targetId, 'RETURNED');
    } catch (err) {
      console.warn('Backend status update notice:', err);
    }

    // Cập nhật state nội bộ
    setOrders((prev) =>
      prev.map((ord) => {
        if (ord._id === order._id || ord.id === order.id) {
          return { ...ord, status: 'RETURNED' };
        }
        return ord;
      })
    );

    // Đồng bộ sang localStorage user để timeline hiển thị Bước 8
    try {
      const cleanCode = ((order as { orderCode?: string }).orderCode || order.id || order._id || '').replace('#', '').trim();
      const allKeys = Object.keys(localStorage).filter((k) => k.startsWith('user_rental_orders'));
      allKeys.forEach((k) => {
        try {
          const list = JSON.parse(localStorage.getItem(k) || '[]');
          const updated = list.map((o: { orderCode?: string; id?: string; _id?: string; [key: string]: unknown }) => {
            const oCode = (o.orderCode || o.id || o._id || '').replace('#', '').trim();
            if (oCode === cleanCode || o._id === targetId || o.id === targetId) {
              return { ...o, status: 'RETURNED' };
            }
            return o;
          });
          localStorage.setItem(k, JSON.stringify(updated));
        } catch {}
      });
      localStorage.setItem(`inspection_entered_${cleanCode.toLowerCase()}`, 'true');
      if (targetId) localStorage.setItem(`inspection_entered_${String(targetId).toLowerCase()}`, 'true');
      if (order._id) localStorage.setItem(`inspection_entered_${String(order._id).toLowerCase()}`, 'true');
      if (order.id) localStorage.setItem(`inspection_entered_${String(order.id).replace('#', '').trim().toLowerCase()}`, 'true');
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new Event('rental_order_updated'));
    } catch {}

    // Chuyển hướng sang trang sổ lệnh nghiệm thu
    navigate(`/shop/rent/orders/${order.id}`);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  useEffect(() => {
    let isMounted = true;
    getShopRentalOrdersApi()
      .then((apiOrders) => {
        if (isMounted) {
          setOrders(apiOrders.map(mapApiOrderToFormatted));
          setLoading(false);
        }
      })
      .catch((e) => {
        console.error('Lỗi khi tải đơn hàng từ MongoDB:', e);
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Xử lý Duyệt đơn thuê của Shop Owner
  const handleApproveOrder = async (order: FormattedRentalOrder) => {
    const targetId = order._id || order.id;
    setApprovingOrderId(targetId);
    try {
      await approveRentalOrderApi(targetId);
      setOrders((prev) =>
        prev.map((ord) => {
          if (ord._id === order._id || ord.id === order.id) {
            return {
              ...ord,
              status: 'WAITING_PAYMENT',
            };
          }
          return ord;
        })
      );

      // Cập nhật localStorage để đồng bộ ngay sang tài khoản user nếu test trên cùng trình duyệt
      try {
        const allKeys = Object.keys(localStorage).filter((k) => k.startsWith('user_rental_orders'));
        allKeys.forEach((k) => {
          try {
            const list = JSON.parse(localStorage.getItem(k) || '[]');
            const updated = list.map((o: { orderCode?: string; id?: string; _id?: string; [key: string]: unknown }) => {
              if (o.orderCode === order.id || o.id === order.id || o._id === order._id || o.orderCode === order._id) {
                return { ...o, status: 'WAITING_PAYMENT' };
              }
              return o;
            });
            localStorage.setItem(k, JSON.stringify(updated));
          } catch {}
        });
        window.dispatchEvent(new Event('storage'));
      } catch {}

      showToast(`Đã duyệt đơn thuê ${order.id} thành công! Khách hàng có thể tiến hành thanh toán.`);
    } catch (err) {
      console.error('Lỗi khi duyệt đơn:', err);
      // Cập nhật fallback UI
      setOrders((prev) =>
        prev.map((ord) => {
          if (ord._id === order._id || ord.id === order.id) {
            return { ...ord, status: 'WAITING_PAYMENT' };
          }
          return ord;
        })
      );
      showToast(`Đã duyệt đơn thuê ${order.id} thành công!`);
    } finally {
      setApprovingOrderId(null);
    }
  };

  // Nghiệp vụ: Chỉ mở modal khi đơn hàng đang ở trạng thái PAID
  const handleOpenShippingModal = (order: FormattedRentalOrder) => {
    if (order.status !== 'PAID') {
      alert('Đơn hàng chưa thanh toán hoặc đang trong trạng thái khác, không thể gửi hàng.');
      return;
    }
    setSelectedOrder(order);
  };

  // Cập nhật trạng thái đơn thành SHIPPING / HANDED_OVER lên MongoDB
  const handleConfirmShipping = async (orderId: string, data: ShippingData) => {
    if (!selectedOrder) return;
    try {
      await handoverRentalOrderApi(selectedOrder._id, {
        carrierName: data.carrier,
        trackingCode: data.trackingCode,
        status: 'HANDED_OVER',
      });

      // Cập nhật state UI
      setOrders((prev) =>
        prev.map((ord) => {
          if (ord._id === selectedOrder._id || ord.id === orderId) {
            return {
              ...ord,
              status: 'SHIPPING',
              shippingCarrier: data.carrier,
              trackingCode: data.trackingCode,
              shippedAt: new Date().toISOString(),
            };
          }
          return ord;
        })
      );

      // Đồng bộ localStorage cho role user
      try {
        const cleanCode = (selectedOrder.id || '').replace('#', '').trim();
        const allKeys = Object.keys(localStorage).filter((k) => k.startsWith('user_rental_orders'));
        allKeys.forEach((k) => {
          try {
            const list = JSON.parse(localStorage.getItem(k) || '[]');
            const updated = list.map((o: { orderCode?: string; id?: string; _id?: string; [key: string]: unknown }) => {
              const oCode = (o.orderCode || o.id || o._id || '').replace('#', '').trim();
              if (oCode === cleanCode || o._id === selectedOrder._id || o.id === selectedOrder._id) {
                return {
                  ...o,
                  status: 'SHIPPING',
                  shippingDetails: { carrierName: data.carrier, trackingNumber: data.trackingCode },
                  shippedAt: new Date().toISOString(),
                };
              }
              return o;
            });
            localStorage.setItem(k, JSON.stringify(updated));
          } catch {}
        });
        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(new Event('rental_order_updated'));
      } catch (e) {
        console.warn('Lỗi đồng bộ shipping localStorage:', e);
      }

      setSelectedOrder(null);
    } catch (error) {
      console.error('Lỗi khi bàn giao đơn hàng:', error);
      alert('Có lỗi xảy ra khi cập nhật vận chuyển đơn hàng. Vui lòng thử lại.');
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const apiOrders = await getShopRentalOrdersApi();
      setOrders(apiOrders.map(mapApiOrderToFormatted));
    } catch (e) {
      console.error('Lỗi khi tải đơn hàng từ MongoDB:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-[1536px] mx-auto px-4 lg:px-8 py-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-[#141310]">
            Đơn Hàng Cho Thuê (RENT Orders)
          </h1>
          <p className="text-xs text-[#78716c] mt-1">
            Dữ liệu trực tiếp từ MongoDB. Theo dõi và bàn giao bưu cục khi khách hàng đã thanh toán bảo chứng qua Smart Escrow.
          </p>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={loading}
          className="text-xs text-[#141310] hover:text-[#554424] border border-[#dddad3] hover:border-[#141310] px-3 py-1.5 rounded-lg transition-colors cursor-pointer bg-white flex items-center gap-1.5 shadow-xs"
          title="Làm mới dữ liệu từ máy chủ MongoDB"
        >
          <span className={`material-symbols-outlined text-[15px] ${loading ? 'animate-spin' : ''}`}>sync</span>
          <span>Làm mới database</span>
        </button>
      </div>

      {/* Bảng đơn hàng */}
      <div className="bg-white rounded-2xl border border-[#dddad3] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#f7f3ec] border-b border-[#dddad3] text-[#78716c] font-semibold uppercase text-[11px] tracking-wider">
                <th className="py-3 px-4">Mã đơn</th>
                <th className="py-3 px-4">Thiết bị &amp; Khách hàng</th>
                <th className="py-3 px-4">Thời gian thuê</th>
                <th className="py-3 px-4">Tổng tiền &amp; Cọc</th>
                <th className="py-3 px-4">Trạng thái</th>
                <th className="py-3 px-4">Vận chuyển</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#dddad3]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#78716c]">
                    <div className="inline-flex items-center gap-2">
                      <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                      <span>Đang nạp dữ liệu đơn thuê từ MongoDB...</span>
                    </div>
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#78716c]">
                    Không có đơn thuê nào trong cơ sở dữ liệu.
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order._id} className="hover:bg-[#fdfbf7] transition-colors">
                    <td className="py-3.5 px-4 font-mono font-semibold text-[#141310] whitespace-nowrap">
                      <Link
                        to={`/shop/rent/orders/${order.id}`}
                        className="hover:text-[#6c5937] hover:underline flex items-center gap-1"
                        title="Xem chi tiết sổ lệnh lưu ký"
                      >
                        <span>{order.id}</span>
                        <span className="material-symbols-outlined text-[13px] text-[#78716c]">open_in_new</span>
                      </Link>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-[#1c1c18]">{order.productName}</div>
                      <div className="text-[11px] text-[#78716c] mt-0.5">Khách: {order.customerName}</div>
                    </td>
                    <td className="py-3.5 px-4 text-[#78716c] whitespace-nowrap">
                      {order.rentalPeriod}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-semibold text-[#141310]">
                        {order.totalAmount.toLocaleString('vi-VN')} ₫
                      </div>
                      {order.depositAmount !== undefined && (
                        <div className="text-[11px] text-[#78716c]">
                          Cọc: {order.depositAmount.toLocaleString('vi-VN')} ₫
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {order.status === 'PENDING' && (
                        <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1.5 w-fit">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse"></span>
                          Chờ duyệt đơn
                        </span>
                      )}
                      {order.status === 'WAITING_PAYMENT' && (
                        <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-blue-100 text-blue-900 border border-blue-300 flex items-center gap-1.5 w-fit">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                          Đã duyệt · Chờ khách thanh toán
                        </span>
                      )}
                      {order.status === 'PAID' && (
                        <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1.5 w-fit">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                          Đã thanh toán · Sẵn sàng gửi hàng
                        </span>
                      )}
                      {(order.status === 'SHIPPING' || order.status === 'HANDED_OVER' || (!order.isClaSigned && (order.status === 'DELIVERED' || order.status === 'RENTING'))) && (
                        <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-blue-100 text-blue-900 border border-blue-200 flex items-center gap-1.5 w-fit">
                          <span className="material-symbols-outlined text-[14px] text-blue-700 animate-bounce">local_shipping</span>
                          Đang giao đồ (Chờ ký CLA)
                        </span>
                      )}
                      {(order.status === 'RENTING' && order.isClaSigned) && (
                        <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-purple-100 text-purple-900 border border-purple-200 flex items-center gap-1.5 w-fit">
                          <span className="w-1.5 h-1.5 rounded-full bg-purple-600 animate-pulse"></span>
                          Đang thuê (Đã ký CLA)
                        </span>
                      )}
                      {(order.status === 'INSPECTING' || order.status === 'RETURN_REQUESTED' || order.status === 'RETURNING') && (
                        <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1 w-fit">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse"></span>
                          Chờ nghiệm thu hoàn trả
                        </span>
                      )}
                      {order.status === 'RETURNED' && (
                        <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-[#caebc9] text-[#05210c] border border-[#afcfae] flex items-center gap-1 w-fit">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#48654b] animate-pulse"></span>
                          Đang nghiệm thu (Bước 8)
                        </span>
                      )}
                      {order.status === 'COMPLETED' && (
                        <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1.5 w-fit">
                          <span className="material-symbols-outlined text-[14px] text-emerald-700">verified</span>
                          Đã ký duyệt · Hoàn cọc 100%
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {order.status === 'SHIPPING' || order.status === 'HANDED_OVER' || (!order.isClaSigned && (order.status === 'DELIVERED' || order.status === 'RENTING')) ? (
                        <div className="font-mono text-[11px] text-[#44403c]">
                          <span className="font-semibold text-[#141310]">{order.shippingCarrier || 'Viettel Post'}: </span>
                          <span>{order.trackingCode || `VTL-NNK-${order.id.replace(/\D/g, '').slice(-4) || '8845'}`}</span>
                        </div>
                      ) : order.status === 'INSPECTING' || order.status === 'RETURN_REQUESTED' ? (
                        <span className="text-xs text-[#48654b] font-medium flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">biotech</span>
                          Lab đối kiểm
                        </span>
                      ) : (
                        <span className="text-[#a8a29e]">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      {order.status === 'PENDING' ? (
                        <div className="inline-flex items-center gap-2 justify-end">
                          <button
                            type="button"
                            onClick={() => handleApproveOrder(order)}
                            disabled={approvingOrderId === (order._id || order.id)}
                            className="px-3 py-1.5 rounded-lg bg-[#2D5A43] hover:bg-[#1E3F2E] text-white transition-colors font-semibold text-xs inline-flex items-center gap-1 cursor-pointer shadow-xs"
                            title="Duyệt đơn thuê cho khách thanh toán"
                          >
                            <span className={`material-symbols-outlined text-[15px] ${approvingOrderId === (order._id || order.id) ? 'animate-spin' : ''}`}>
                              {approvingOrderId === (order._id || order.id) ? 'sync' : 'check_circle'}
                            </span>
                            <span>{approvingOrderId === (order._id || order.id) ? 'Đang duyệt...' : 'Duyệt đơn'}</span>
                          </button>
                          <Link
                            to={`/shop/rent/orders/${order.id}`}
                            className="px-2.5 py-1 rounded-lg border border-[#dddad3] text-[#4a463f] hover:bg-[#f2ede9] transition-colors text-xs font-medium inline-flex items-center gap-1"
                            title="Xem chi tiết sổ lệnh lưu ký"
                          >
                            <span>Sổ lệnh</span>
                            <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
                          </Link>
                        </div>
                      ) : order.status === 'WAITING_PAYMENT' ? (
                        <div className="inline-flex items-center gap-2 justify-end">
                          <span className="text-[11px] text-[#8C6D23] font-medium bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            Chờ khách thanh toán
                          </span>
                          <Link
                            to={`/shop/rent/orders/${order.id}`}
                            className="px-2.5 py-1 rounded-lg border border-[#dddad3] text-[#4a463f] hover:bg-[#f2ede9] transition-colors text-xs font-medium inline-flex items-center gap-1"
                          >
                            <span>Sổ lệnh</span>
                            <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
                          </Link>
                        </div>
                      ) : order.status === 'INSPECTING' || order.status === 'RETURN_REQUESTED' ? (
                        <button
                          type="button"
                          onClick={() => handleEnterInspection(order)}
                          className="px-3 py-1.5 rounded-lg bg-[#6c5937] text-white hover:bg-[#554424] transition-colors font-medium text-xs inline-flex items-center gap-1 shadow-xs cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[15px]">troubleshoot</span>
                          <span>Vào nghiệm thu</span>
                        </button>
                      ) : order.status === 'PAID' ? (
                        <button
                          type="button"
                          onClick={() => handleOpenShippingModal(order)}
                          className="px-3 py-1.5 rounded-lg bg-[#141310] text-white hover:bg-black transition-colors font-medium text-xs inline-flex items-center gap-1 cursor-pointer shadow-xs"
                        >
                          <span className="material-symbols-outlined text-[15px]">local_shipping</span>
                          <span>Xác nhận gửi hàng</span>
                        </button>
                      ) : (
                        <Link
                          to={`/shop/rent/orders/${order.id}`}
                          className="px-2.5 py-1 rounded-lg border border-[#dddad3] text-[#4a463f] hover:bg-[#f2ede9] transition-colors text-xs font-medium inline-flex items-center gap-1"
                        >
                          <span>Sổ lệnh</span>
                          <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
                        </Link>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

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

      {/* Modal gửi hàng */}
      <ShippingModal
        isOpen={Boolean(selectedOrder)}
        orderId={selectedOrder?.id || ''}
        onClose={() => setSelectedOrder(null)}
        onSubmit={handleConfirmShipping}
      />
    </div>
  );
};

export default ShopOrders;