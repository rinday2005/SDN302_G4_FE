import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { ThriftOrder, ThriftOrderStatus, ThriftListingItem } from '../../data/shop/thriftOrdersData';
import {
  SHOP_THRIFT_ORDERS_STORAGE_KEY,
  INITIAL_MOCK_THRIFT_ORDERS,
} from '../../data/shop/thriftOrdersData';
import {
  getThriftOrderByIdApi,
  updateThriftOrderStatusApi,
} from '../../../services/thriftOrder.api';
import type { ThriftOrderApi } from '../../../services/thriftOrder.api';

const CLOTHING_FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&auto=format&fit=crop&q=60',
  'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&auto=format&fit=crop&q=60',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=800&auto=format&fit=crop&q=60',
  'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=800&auto=format&fit=crop&q=60',
];

const mapApiThriftOrder = (apiOrder: ThriftOrderApi): ThriftOrder => {
  const buyerObj = typeof apiOrder.buyerId === 'object' && apiOrder.buyerId ? apiOrder.buyerId : null;
  const buyerName = apiOrder.shippingAddress?.recipientName || buyerObj?.fullName || 'Khách hàng ReUse Hub';
  const buyerPhone = apiOrder.shippingAddress?.recipientPhone || buyerObj?.phoneNumber || '0901234567';
  const buyerEmail = buyerObj?.email || '';
  const addr = apiOrder.shippingAddress
    ? `${apiOrder.shippingAddress.detail}, ${apiOrder.shippingAddress.ward}, ${apiOrder.shippingAddress.district}, ${apiOrder.shippingAddress.province}`
    : 'Việt Nam';

  const listings: ThriftListingItem[] = (apiOrder.items || []).map((item, idx) => {
    const listingObj = typeof item.listingId === 'object' && item.listingId ? item.listingId : (typeof item.productId === 'object' && item.productId ? item.productId : null);
    const fallbackImg = CLOTHING_FALLBACK_IMAGES[idx % CLOTHING_FALLBACK_IMAGES.length];
    const rawImages = (listingObj as { images?: string[] })?.images || item.images;
    const resolvedImg = (Array.isArray(rawImages) && rawImages.length > 0 ? rawImages[0] : '') || item.imageUrl || fallbackImg;
    const resolvedTitle = item.name || item.productName || item.title || (listingObj as { name?: string; title?: string })?.name || (listingObj as { title?: string })?.title || 'Trang phục di sản tuyển chọn Atelier';
    const listingIdStr = typeof item.listingId === 'string' ? item.listingId : (listingObj?._id || `item-${idx}`);

    return {
      id: listingIdStr,
      title: resolvedTitle,
      serialNumber: listingIdStr && listingIdStr.length >= 6 ? `#GARMENT-${listingIdStr.slice(-6).toUpperCase()}` : `#GARMENT-ARCHIVE-${idx + 1}`,
      grade: item.condition || (listingObj as { condition?: string })?.condition || 'Grade 1 · Hoàn hảo (98%)',
      price: item.price || (listingObj as { price?: number })?.price || 0,
      imageUrl: resolvedImg,
    };
  });

  let status: ThriftOrderStatus;
  const rawStatus = (apiOrder.status || '').toUpperCase();
  if (rawStatus === 'PENDING' || rawStatus === 'WAITING_PAYMENT' || rawStatus === 'PENDING_PAYMENT') {
    status = 'PENDING_PAYMENT';
  } else if (rawStatus === 'SHIPPING' || rawStatus === 'SHIPPED') {
    status = 'SHIPPED';
  } else if (rawStatus === 'DELIVERED') {
    status = 'DELIVERED';
  } else if (rawStatus === 'COMPLETED') {
    status = 'COMPLETED';
  } else if (rawStatus === 'CANCELLED') {
    status = 'CANCELLED';
  } else {
    // PAID / PREPARING / ATELIER_APPRAISAL
    status = 'PAID';
  }

  const subtotal = apiOrder.itemsSubtotal || (apiOrder.totalAmount - (apiOrder.shippingFee || 0));

  return {
    id: apiOrder.orderCode ? (apiOrder.orderCode.startsWith('#') ? apiOrder.orderCode : `#${apiOrder.orderCode}`) : `#${apiOrder._id}`,
    _dbId: apiOrder._id,
    createdAt: new Date(apiOrder.createdAt || Date.now()).toLocaleDateString('vi-VN'),
    buyer: {
      name: buyerName,
      phone: buyerPhone,
      email: buyerEmail,
      shippingAddress: addr,
      kycTier: 'KYC Xác thực CCCD · TIER 2',
    },
    listings: listings.length > 0 ? listings : INITIAL_MOCK_THRIFT_ORDERS[0].listings,
    pricing: {
      subtotal: subtotal || 124000000,
      shippingFee: apiOrder.shippingFee || 250000,
      totalAmount: apiOrder.totalAmount || 124250000,
    },
    status,
    shippingInfo: {
      carrier: apiOrder.courierName || 'Bưu tá Nanuk Garment Express',
      trackingCode: apiOrder.trackingCode || '#NK-883910-TH',
      dispatchedAt: apiOrder.updatedAt ? new Date(apiOrder.updatedAt).toLocaleString('vi-VN') : undefined,
      sealCode: apiOrder.sealCode || 'SEAL-ATELIER-9108',
    },
  };
};

type OrderSimulationState = 'paid' | 'processing' | 'shipped' | 'delivered' | 'completed' | 'disputed';

export const ShopThriftOrderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  // Clean decoded ID (handle "#RH-THF-2024-9108" or "RH-THF-2024-9108")
  const targetId = id ? (id.startsWith('#') ? id : `#${id}`) : '#RH-THF-2024-9108';

  // Load order data from localStorage or fallback
  const [order, setOrder] = useState<ThriftOrder>(() => {
    try {
      const stored = localStorage.getItem(SHOP_THRIFT_ORDERS_STORAGE_KEY);
      if (stored) {
        const list: ThriftOrder[] = JSON.parse(stored);
        const found = list.find(
          (o) =>
            o.id.toLowerCase() === targetId.toLowerCase() ||
            o.id.replace('#', '').toLowerCase() === targetId.replace('#', '').toLowerCase() ||
            o._dbId === id
        );
        if (found) return found;
      }
    } catch (e) {
      console.error('Lỗi khi đọc đơn hàng:', e);
    }
    return INITIAL_MOCK_THRIFT_ORDERS[0];
  });

  // State Simulation state: 'paid' | 'processing' | 'shipped' | 'delivered' | 'completed' | 'disputed'
  const [simulationState, setSimulationState] = useState<OrderSimulationState>(() => {
    switch (order.status) {
      case 'PAID':
        return 'paid';
      case 'SHIPPED':
        return 'shipped';
      case 'DELIVERED':
        return 'delivered';
      case 'COMPLETED':
        return 'completed';
      default:
        return 'paid';
    }
  });

  // Sync from DB
  useEffect(() => {
    if (!id) return;
    const cleanId = id.replace('#', '');
    getThriftOrderByIdApi(cleanId)
      .then((apiOrder) => {
        if (apiOrder) {
          const mapped = mapApiThriftOrder(apiOrder);
          setOrder(mapped);
          switch (mapped.status) {
            case 'PAID':
              setSimulationState('paid');
              break;
            case 'SHIPPED':
              setSimulationState('shipped');
              break;
            case 'DELIVERED':
              setSimulationState('delivered');
              break;
            case 'COMPLETED':
              setSimulationState('completed');
              break;
            default:
              setSimulationState('paid');
          }
        }
      })
      .catch((err) => {
        console.warn('Could not fetch thrift order detail from MongoDB, using cached order:', err);
      });
  }, [id]);

  // Modals
  const [showCertModal, setShowCertModal] = useState(false);
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [chatMessageInput, setChatMessageInput] = useState('');
  const [dispatchTrackingCode, setDispatchTrackingCode] = useState(order.shippingInfo?.trackingCode || '#NK-883910-TH');
  const [dispatchSealCode, setDispatchSealCode] = useState(order.shippingInfo?.sealCode || 'SEAL-ATELIER-9108');
  const [dispatchCarrier, setDispatchCarrier] = useState(order.shippingInfo?.carrier || 'Bưu tá Nanuk Garment Express');

  const [chatMessages, setChatMessages] = useState<
    { sender: 'shop' | 'buyer' | 'system'; text: string; time: string }[]
  >([
    {
      sender: 'system',
      text: 'Hạ tầng VNPay Smart Escrow đã phong tỏa an toàn khoản thanh toán cho Đơn hàng THRIFT.',
      time: '20/11 · 14:32',
    },
    {
      sender: 'buyer',
      text: 'Chào Atelier Heritage, mình vừa thanh toán đơn trang phục di sản. Nhờ xưởng hỗ trợ khử khuẩn Ozone và bọc chống nhăn trong kiện Nanuk giúp mình nhé!',
      time: '20/11 · 14:35',
    },
  ]);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Sync state change back to storage & backend MongoDB
  const updateOrderStatus = async (
    newSimState: OrderSimulationState,
    extraShipping?: { trackingCode?: string; courierName?: string; sealCode?: string }
  ) => {
    setSimulationState(newSimState);
    let mappedStatus: ThriftOrder['status'] = 'PAID';
    let beApiStatus: 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'COMPLETED' | 'DISPUTED' | 'PAID' = 'PAID';

    if (newSimState === 'paid') {
      mappedStatus = 'PAID';
      beApiStatus = 'PAID';
    } else if (newSimState === 'processing') {
      mappedStatus = 'PAID';
      beApiStatus = 'PROCESSING';
    } else if (newSimState === 'shipped') {
      mappedStatus = 'SHIPPED';
      beApiStatus = 'SHIPPED';
    } else if (newSimState === 'delivered') {
      mappedStatus = 'DELIVERED';
      beApiStatus = 'DELIVERED';
    } else if (newSimState === 'completed') {
      mappedStatus = 'COMPLETED';
      beApiStatus = 'COMPLETED';
    } else if (newSimState === 'disputed') {
      mappedStatus = 'PAID';
      beApiStatus = 'DISPUTED';
    }

    const updatedShipping = {
      ...order.shippingInfo,
      carrier: extraShipping?.courierName || order.shippingInfo?.carrier || 'Bưu tá Nanuk Garment Express',
      trackingCode: extraShipping?.trackingCode || order.shippingInfo?.trackingCode || '#NK-883910-TH',
      sealCode: extraShipping?.sealCode || order.shippingInfo?.sealCode || 'SEAL-ATELIER-9108',
      dispatchedAt: newSimState === 'shipped' ? new Date().toLocaleString('vi-VN') : order.shippingInfo?.dispatchedAt,
    };

    // Update in-memory state
    setOrder((prev) => ({
      ...prev,
      status: mappedStatus,
      shippingInfo: updatedShipping,
    }));

    // Update localStorage for Shop
    try {
      const stored = localStorage.getItem(SHOP_THRIFT_ORDERS_STORAGE_KEY);
      let list: ThriftOrder[] = stored ? JSON.parse(stored) : INITIAL_MOCK_THRIFT_ORDERS;
      list = list.map((o) =>
        o.id === order.id || o._dbId === order._dbId
          ? { ...o, status: mappedStatus, shippingInfo: updatedShipping }
          : o
      );
      localStorage.setItem(SHOP_THRIFT_ORDERS_STORAGE_KEY, JSON.stringify(list));

      // Đồng bộ sang user_thrift_orders của người mua
      const cleanTargetId = (order.id || '').replace('#', '');
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key === 'user_thrift_orders' || key.startsWith('user_thrift_orders_'))) {
          const raw = localStorage.getItem(key);
          if (raw) {
            const userList: ThriftOrderApi[] = JSON.parse(raw);
            let hasChanged = false;
            const updatedUserList = userList.map((uo) => {
              const uCode = (uo.orderCode || uo._id || '').replace('#', '');
              if (uCode === cleanTargetId || uo._id === cleanTargetId || uo._id === order._dbId) {
                hasChanged = true;
                return {
                  ...uo,
                  status: (beApiStatus === 'PROCESSING' ? 'PROCESSING' : beApiStatus) as ThriftOrderApi['status'],
                  trackingCode: updatedShipping.trackingCode,
                  courierName: updatedShipping.carrier,
                  sealCode: updatedShipping.sealCode,
                };
              }
              return uo;
            });
            if (hasChanged) {
              localStorage.setItem(key, JSON.stringify(updatedUserList));
            }
          }
        }
      }

      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new Event('rental_order_updated'));
    } catch (e) {
      console.error('Lỗi khi đồng bộ trạng thái localStorage:', e);
    }

    // Call Backend API
    const targetLookup = order._dbId || order.id.replace('#', '');
    try {
      await updateThriftOrderStatusApi(targetLookup, {
        status: beApiStatus,
        trackingCode: updatedShipping.trackingCode,
        courierName: updatedShipping.carrier,
        sealCode: updatedShipping.sealCode,
      });
      console.log(`Backend MongoDB updated for thrift order ${targetLookup} -> ${beApiStatus}`);
    } catch (err) {
      console.warn('Backend update failed or running in local mode:', err);
    }
  };

  // Handle primary action button click
  const handlePrimaryAction = () => {
    if (simulationState === 'paid') {
      if (window.confirm('Xác nhận: Bắt đầu Thẩm định Sợi vải, Khử khuẩn buồng Ozone và Chuẩn bị Bọc Vali Nanuk?')) {
        updateOrderStatus('processing');
        triggerToast('Đã chuyển sang trạng thái: ATELIER ĐANG THẨM ĐỊNH & ĐÓNG GÓI.');
      }
    } else if (simulationState === 'processing') {
      setShowDispatchModal(true);
    } else if (simulationState === 'shipped') {
      setShowTrackingModal(true);
    } else if (simulationState === 'delivered') {
      if (order.buyerConfirmed) {
        updateOrderStatus('completed');
        triggerToast(`Đã giải ngân thành công ${order.pricing.subtotal.toLocaleString('vi-VN')} ₫ về ví xưởng! Đơn hàng hoàn tất.`);
      } else {
        alert('Kiện hàng đang được bưu tá giao tới khách. Nút giải ngân sẽ mở ngay khi khách xác nhận đã nhận hàng.');
      }
    } else if (simulationState === 'completed') {
      alert(`Biên lai giải ngân Smart Escrow VNPay HSM: Đã quyết toán thành công ${order.pricing.subtotal.toLocaleString('vi-VN')} ₫ vào tài khoản xưởng.`);
    } else if (simulationState === 'disputed') {
      setShowChatModal(true);
    }
  };

  // Submit dispatch modal
  const handleConfirmDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateOrderStatus('shipped', {
      trackingCode: dispatchTrackingCode,
      courierName: dispatchCarrier,
      sealCode: dispatchSealCode,
    });
    setShowDispatchModal(false);
    triggerToast(`Đã bàn giao bưu tá Nanuk! Vận đơn [${dispatchTrackingCode}] - Tem sáp [${dispatchSealCode}].`);
  };

  // Handle Send Chat
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessageInput.trim()) return;

    const newMsg = {
      sender: 'shop' as const,
      text: chatMessageInput.trim(),
      time: 'Vừa xong',
    };
    setChatMessages((prev) => [...prev, newMsg]);
    setChatMessageInput('');

    // Simulate auto-reply from buyer or mediator
    setTimeout(() => {
      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'buyer',
          text: 'Atelier yên tâm, mình sẽ kiểm tra kỹ phom dáng và giữ nguyên tem niêm phong trong 72h mặc thử!',
          time: 'Vừa xong',
        },
      ]);
    }, 1200);
  };

  // Copy address
  const handleCopyAddress = () => {
    navigator.clipboard?.writeText(order.buyer.shippingAddress);
    triggerToast('Đã sao chép địa chỉ tiếp nhận hiện vật vào clipboard!');
  };

  // Copy tracking
  const handleCopyTracking = (code: string) => {
    navigator.clipboard?.writeText(code);
    triggerToast(`Đã sao chép mã vận đơn [${code}]!`);
  };

  return (
    <div className="w-full flex flex-col font-sans text-on-surface bg-surface min-h-[calc(100vh-4rem)] antialiased no-reveal">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-4 bg-primary text-on-primary rounded shadow-2xl max-w-md flex items-start gap-3 border border-secondary/40 animate-fade-in">
          <span className="material-symbols-outlined text-secondary text-[22px] shrink-0">task_alt</span>
          <div className="flex-1 text-sm">{toastMessage}</div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-on-primary hover:text-outline-variant cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
      )}

      {/* Interactive State Banner & Simulator */}
      <aside
        aria-label="Bộ điều khiển chu trình thrift"
        className="w-full bg-surface-container border-b border-outline-variant/30 py-2.5 px-margin-mobile lg:px-margin"
      >
        <div className="max-w-[1440px] mx-auto flex flex-wrap items-center justify-between gap-3 text-label-sm">
          <div className="flex items-center gap-2 text-on-surface-variant font-label-md">
            <span className="material-symbols-outlined text-[16px] text-tertiary">tune</span>
            <span className="uppercase tracking-widest text-[11px] font-semibold text-on-surface">
              Luồng Nghiệp Vụ THRIFT Atelier:
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5" id="state-selector-bar">
            <button
              type="button"
              onClick={() => updateOrderStatus('paid')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-all cursor-pointer ${
                simulationState === 'paid'
                  ? 'bg-inverse-surface text-inverse-on-surface shadow-xs font-semibold'
                  : 'bg-surface-container-highest text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              1. Atelier Thẩm định (Đã khóa Escrow)
            </button>
            <button
              type="button"
              onClick={() => updateOrderStatus('processing')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-all cursor-pointer ${
                simulationState === 'processing'
                  ? 'bg-inverse-surface text-inverse-on-surface shadow-xs font-semibold'
                  : 'bg-surface-container-highest text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              2. Đóng gói Vali Nanuk Crate
            </button>
            <button
              type="button"
              onClick={() => updateOrderStatus('shipped')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-all cursor-pointer ${
                simulationState === 'shipped'
                  ? 'bg-inverse-surface text-inverse-on-surface shadow-xs font-semibold'
                  : 'bg-surface-container-highest text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              3. Vận chuyển Nanuk (In Transit)
            </button>
            <button
              type="button"
              onClick={() => updateOrderStatus('delivered')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-all cursor-pointer ${
                simulationState === 'delivered'
                  ? 'bg-inverse-surface text-inverse-on-surface shadow-xs font-semibold'
                  : 'bg-surface-container-highest text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              4. Đã giao &amp; Đối kiểm 72h
            </button>
            <button
              type="button"
              onClick={() => updateOrderStatus('completed')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-all cursor-pointer ${
                simulationState === 'completed'
                  ? 'bg-inverse-surface text-inverse-on-surface shadow-xs font-semibold'
                  : 'bg-surface-container-highest text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              5. Giải ngân Escrow Hoàn tất
            </button>
            <button
              type="button"
              onClick={() => updateOrderStatus('disputed')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-all cursor-pointer ${
                simulationState === 'disputed'
                  ? 'bg-error text-on-error shadow-xs font-semibold'
                  : 'bg-surface-container-highest text-error hover:bg-error-container'
              }`}
            >
              6. Tranh chấp / Khiếu nại
            </button>
          </div>
        </div>
      </aside>

      {/* Editorial Order Canvas */}
      <div className="w-full px-margin-mobile lg:px-margin py-6 flex flex-col gap-6 max-w-[1440px] mx-auto flex-1">
        {/* Top Navigation Bar & Action Triggers */}
        <nav
          aria-label="Điều hướng đơn hàng"
          className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-outline-variant/30 pb-4"
        >
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider flex-wrap">
              <Link to="/shop/dashboard" className="hover:text-primary transition-colors">
                Bảng điều khiển xưởng
              </Link>
              <span>/</span>
              <Link to="/shop/thrift/orders" className="hover:text-primary transition-colors">
                Bán đứt THRIFT
              </Link>
              <span>/</span>
              <Link to="/shop/thrift/orders" className="hover:text-primary transition-colors">
                Sổ lệnh đơn hàng
              </Link>
              <span>/</span>
              <span className="text-on-surface font-semibold">{order.id}</span>
            </div>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              <Link
                to="/shop/thrift/orders"
                className="inline-flex items-center gap-1.5 text-primary hover:text-on-surface font-label-md text-label-md transition-colors group font-semibold"
              >
                <span className="material-symbols-outlined text-[18px] group-hover:-translate-x-1 transition-transform">
                  arrow_left_alt
                </span>
                <span>Quay lại Sổ Lệnh Đơn Hàng</span>
              </Link>
              <span className="text-outline-variant">·</span>
              <span className="font-label-sm text-label-sm text-on-surface-variant font-mono">
                Atelier Heritage Registry {order.shippingInfo?.sealCode || '#SEAL-9108-OCT'}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="px-3.5 py-2 rounded bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-label-md text-label-md transition-all flex items-center gap-1.5 shadow-sm border border-surface-dim cursor-pointer font-medium"
            >
              <span className="material-symbols-outlined text-[18px]">receipt_long</span>
              <span>In Phiếu Đóng Gói (Packing Slip)</span>
            </button>
            <button
              type="button"
              onClick={() => setShowCertModal(true)}
              className="px-3.5 py-2 rounded bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-label-md text-label-md transition-all flex items-center gap-1.5 shadow-sm border border-surface-dim cursor-pointer font-medium"
            >
              <span className="material-symbols-outlined text-[18px] text-secondary">workspace_premium</span>
              <span>Xuất Biên Lai B-Corp Vải Vóc</span>
            </button>
            <a
              href="#dispute-section"
              className="px-3.5 py-2 rounded bg-error-container/40 hover:bg-error-container text-error font-label-md text-label-md transition-all flex items-center gap-1.5 font-medium"
            >
              <span className="material-symbols-outlined text-[18px]">gavel</span>
              <span>Báo Cáo Sự Cố</span>
            </a>
          </div>
        </nav>

        {/* Header Section: Title, Badges & Dynamic State CTAs */}
        <section className="bg-surface-container-low rounded p-6 lg:p-8 shadow-sm flex flex-col gap-6 relative overflow-hidden border border-surface-dim">
          {/* Decorative archival watermark */}
          <div className="absolute -right-8 -bottom-8 pointer-events-none select-none opacity-5 font-serif text-[140px] text-on-surface leading-none font-bold">
            HERITAGE
          </div>

          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 relative z-10">
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2">
                {/* Dynamic Status Badge */}
                {simulationState === 'paid' && (
                  <span className="px-2.5 py-1 rounded bg-secondary-container text-on-secondary-container font-label-sm text-label-sm uppercase tracking-wider flex items-center gap-1.5 font-semibold">
                    <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
                    1. ATELIER THẨM ĐỊNH · SMART ESCROW LOCKED
                  </span>
                )}
                {simulationState === 'processing' && (
                  <span className="px-2.5 py-1 rounded bg-tertiary-fixed text-on-tertiary-fixed font-label-sm text-label-sm uppercase tracking-wider flex items-center gap-1.5 font-semibold">
                    <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse"></span>
                    2. ĐANG ĐÓNG GÓI VALI NANUK CHỐNG NHĂN
                  </span>
                )}
                {simulationState === 'shipped' && (
                  <span className="px-2.5 py-1 rounded bg-surface-container-high text-on-surface font-label-sm text-label-sm uppercase tracking-wider flex items-center gap-1.5 font-semibold">
                    <span className="material-symbols-outlined text-[16px]">local_shipping</span>
                    3. VẬN CHUYỂN NANUK · IN TRANSIT
                  </span>
                )}
                {simulationState === 'delivered' && (
                  <span className="px-2.5 py-1 rounded bg-secondary-container text-on-secondary-container font-label-sm text-label-sm uppercase tracking-wider flex items-center gap-1.5 font-semibold">
                    <span className="w-2 h-2 rounded-full bg-secondary"></span>
                    {order.buyerConfirmed ? '4. KHÁCH ĐÃ NHẬN HÀNG · CHỜ GIẢI NGÂN' : '4. ĐÃ GIAO HÀNG · CHỜ KHÁCH NHẬN'}
                  </span>
                )}
                {simulationState === 'completed' && (
                  <span className="px-2.5 py-1 rounded bg-secondary text-on-secondary font-label-sm text-label-sm uppercase tracking-wider flex items-center gap-1.5 font-semibold">
                    <span className="material-symbols-outlined text-[16px]">task_alt</span>
                    5. GIẢI NGÂN ESCROW HOÀN TẤT
                  </span>
                )}
                {simulationState === 'disputed' && (
                  <span className="px-2.5 py-1 rounded bg-error-container text-on-error-container font-label-sm text-label-sm uppercase tracking-wider flex items-center gap-1.5 font-semibold">
                    <span className="material-symbols-outlined text-[16px]">warning</span>
                    6. CÓ KHIẾU NẠI (DISPUTED) · KHÓA ESCROW
                  </span>
                )}

                <span className="px-2.5 py-1 rounded bg-surface text-on-surface-variant font-label-sm text-label-sm border border-outline-variant/30 flex items-center gap-1 font-semibold">
                  <span className="material-symbols-outlined text-[14px] text-primary">verified_user</span>
                  BẢO CHỨNG DI SẢN THỜI TRANG TUẦN HOÀN
                </span>
              </div>

              <div className="flex flex-wrap items-baseline gap-3 mt-1">
                <h1 className="font-serif text-3xl font-semibold text-on-surface tracking-tight">
                  Hồ Sơ Lưu Trữ Đơn THRIFT {order.id}
                </h1>
                <span className="font-label-md text-label-md text-on-surface-variant">
                  Khởi tạo: {order.createdAt || '20/11/2024 · 14:30 ICT'}
                </span>
              </div>

              <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl leading-relaxed">
                {simulationState === 'paid' && (
                  <>
                    Người mua đã hoàn tất thanh toán. Ký quỹ <strong className="text-on-surface font-semibold">{order.pricing.totalAmount.toLocaleString('vi-VN')} ₫</strong> đang phong tỏa trong <strong className="text-on-surface">VNPay Smart Escrow</strong>. Atelier chuẩn bị thẩm định sợi vải, khử trùng Ozone và đóng kiện Nanuk.
                  </>
                )}
                {simulationState === 'processing' && (
                  <>
                    Atelier đang kiểm định đường may thủ công, hấp nhẹ giữ phom dáng nguyên bản và dán tem niêm phong sáp yếm khí trước khi bàn giao bưu tá Nanuk.
                  </>
                )}
                {simulationState === 'shipped' && (
                  <>
                    Kiện hàng đã rời xưởng. Bưu tá chuyên trách Nanuk đang vận chuyển với kiện chống nhăn, kiểm soát độ ẩm và nhiệt độ tiêu chuẩn bảo quản trang phục di sản.
                  </>
                )}
                {simulationState === 'delivered' && (
                  <>
                    {order.buyerConfirmed
                      ? `Khách hàng ${order.buyer.name} đã xác nhận nhận kiện hàng thành công. Quý xưởng có thể bấm nút Giải Ngân Tiền Về Ví ngay.`
                      : `Kiện hàng đã tới địa chỉ của ${order.buyer.name}. Đang chờ người mua xác nhận đã nhận hàng để mở khóa giải ngân.`}
                  </>
                )}
                {simulationState === 'completed' && (
                  <>
                    Khoản tiền <strong className="text-secondary font-bold">{order.pricing.subtotal.toLocaleString('vi-VN')} ₫</strong> đã giải ngân thành công về ví xưởng. Giao dịch mua bán THRIFT hoàn tất vẹn toàn.
                  </>
                )}
                {simulationState === 'disputed' && (
                  <>
                    Khách hàng gửi yêu cầu tái kiểm tra kích thước hoặc đường may. Smart Escrow tạm dừng giải ngân để giám định viên ReUse Hub thẩm tra độc lập.
                  </>
                )}
              </p>
            </div>

            {/* Dynamic Contextual Action Area */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={handlePrimaryAction}
                className={`px-5 py-3 rounded font-label-md text-label-md tracking-wide transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer font-semibold ${
                  simulationState === 'paid'
                    ? 'bg-primary hover:bg-tertiary text-on-primary'
                    : simulationState === 'processing'
                    ? 'bg-secondary text-on-secondary hover:bg-secondary/90'
                    : simulationState === 'shipped'
                    ? 'bg-surface-container-highest hover:bg-surface-container-high text-on-surface'
                    : simulationState === 'delivered'
                    ? (order.buyerConfirmed ? 'bg-emerald-700 hover:bg-emerald-800 text-white font-bold' : 'bg-surface-container-highest text-on-surface')
                    : simulationState === 'completed'
                    ? 'bg-secondary-container text-on-secondary-container'
                    : 'bg-error text-on-error'
                }`}
              >
                {simulationState === 'paid' && (
                  <>
                    <span className="material-symbols-outlined text-[18px]">verified</span>
                    <span>1. Hoàn tất Thẩm định &amp; Bọc Vali Nanuk</span>
                  </>
                )}
                {simulationState === 'processing' && (
                  <>
                    <span className="material-symbols-outlined text-[18px]">local_shipping</span>
                    <span>2. Bàn giao Bưu tá Nanuk (Mark Shipped)</span>
                  </>
                )}
                {simulationState === 'shipped' && (
                  <>
                    <span className="material-symbols-outlined text-[18px]">route</span>
                    <span>3. Xem Theo Dõi Vận Đơn Nanuk</span>
                  </>
                )}
                {simulationState === 'delivered' && (
                  order.buyerConfirmed ? (
                    <>
                      <span className="material-symbols-outlined text-[18px]">account_balance_wallet</span>
                      <span>Giải Ngân Tiền Về Ví ({order.pricing.subtotal.toLocaleString('vi-VN')} ₫)</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[18px]">hourglass_top</span>
                      <span>Chờ Khách Bấm Nhận Hàng</span>
                    </>
                  )
                )}
                {simulationState === 'completed' && (
                  <>
                    <span className="material-symbols-outlined text-[18px]">receipt</span>
                    <span>5. Xem Biên Lai Quyết Toán Escrow</span>
                  </>
                )}
                {simulationState === 'disputed' && (
                  <>
                    <span className="material-symbols-outlined text-[18px]">gavel</span>
                    <span>Xử Lý Tranh Chấp &amp; Đối Soát</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setShowChatModal(true)}
                className="px-5 py-3 rounded bg-surface hover:bg-surface-container text-on-surface font-label-md text-label-md transition-all border border-outline-variant/40 flex items-center justify-center gap-1.5 cursor-pointer font-medium"
              >
                <span className="material-symbols-outlined text-[18px] text-primary">chat</span>
                <span>Trao Đổi Với Khách</span>
              </button>
            </div>
          </div>

          {/* 4-Step Thrift Lifecycle Stepper */}
          <div className="w-full pt-4 mt-2 border-t border-outline-variant/30 relative z-10">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {/* Stage 1: Atelier Thẩm định */}
              <div
                className={`flex flex-col gap-1 p-3 rounded transition-all border ${
                  simulationState === 'paid' || simulationState === 'processing'
                    ? 'bg-primary text-on-primary shadow-sm border-primary'
                    : 'bg-surface/80 border-outline-variant/20'
                }`}
              >
                <div
                  className={`flex items-center gap-1.5 ${
                    simulationState === 'paid' || simulationState === 'processing'
                      ? 'text-primary-fixed'
                      : 'text-secondary'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {simulationState === 'paid' || simulationState === 'processing'
                      ? 'verified'
                      : 'check_circle'}
                  </span>
                  <span className="font-label-sm text-label-sm uppercase font-semibold">
                    1. Atelier Thẩm Định
                  </span>
                </div>
                <div
                  className={`font-label-sm text-sm font-semibold ${
                    simulationState === 'paid' || simulationState === 'processing'
                      ? 'text-white'
                      : 'text-on-surface'
                  }`}
                >
                  {simulationState === 'paid'
                    ? 'Chờ thẩm định & niêm phong'
                    : simulationState === 'processing'
                    ? 'Đang kiểm định & hấp nếp'
                    : 'Đã thẩm định đạt chuẩn'}
                </div>
                <div
                  className={`text-[11px] ${
                    simulationState === 'paid' || simulationState === 'processing'
                      ? 'text-white/80'
                      : 'text-on-surface-variant'
                  }`}
                >
                  Khử trùng buồng Ozone 45 phút · Tem sáp yếm khí
                </div>
              </div>

              {/* Stage 2: Vận chuyển Nanuk */}
              <div
                className={`flex flex-col gap-1 p-3 rounded transition-all border ${
                  simulationState === 'shipped'
                    ? 'bg-primary text-on-primary shadow-sm border-primary'
                    : ['delivered', 'completed'].includes(simulationState)
                    ? 'bg-surface/80 border-outline-variant/20'
                    : 'bg-surface-container/60 opacity-60 border-transparent'
                }`}
              >
                <div
                  className={`flex items-center gap-1.5 ${
                    simulationState === 'shipped'
                      ? 'text-primary-fixed'
                      : ['delivered', 'completed'].includes(simulationState)
                      ? 'text-secondary'
                      : 'text-on-surface-variant'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {['delivered', 'completed'].includes(simulationState) ? 'check_circle' : 'local_shipping'}
                  </span>
                  <span className="font-label-sm text-label-sm uppercase font-semibold">
                    2. Vận Chuyển Nanuk
                  </span>
                </div>
                <div
                  className={`font-label-sm text-sm font-semibold ${
                    simulationState === 'shipped' ? 'text-white' : 'text-on-surface'
                  }`}
                >
                  {simulationState === 'shipped'
                    ? 'Đang bưu vận Nanuk'
                    : ['delivered', 'completed'].includes(simulationState)
                    ? 'Đã giao an toàn'
                    : 'Chờ xuất kho xưởng'}
                </div>
                <div
                  className={`text-[11px] ${
                    simulationState === 'shipped' ? 'text-white/80' : 'text-on-surface-variant'
                  }`}
                >
                  {order.shippingInfo?.trackingCode || '#NK-883910-TH'} · Chống nhăn
                </div>
              </div>

              {/* Stage 3: Đã giao & Đối kiểm 72h */}
              <div
                className={`flex flex-col gap-1 p-3 rounded transition-all border ${
                  simulationState === 'delivered'
                    ? 'bg-primary text-on-primary shadow-sm border-primary'
                    : simulationState === 'completed'
                    ? 'bg-surface/80 border-outline-variant/20'
                    : 'bg-surface-container/60 opacity-60 border-transparent'
                }`}
              >
                <div
                  className={`flex items-center gap-1.5 ${
                    simulationState === 'delivered'
                      ? 'text-primary-fixed'
                      : simulationState === 'completed'
                      ? 'text-secondary'
                      : 'text-on-surface-variant'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {simulationState === 'completed' ? 'check_circle' : 'timelapse'}
                  </span>
                  <span className="font-label-sm text-label-sm uppercase font-semibold">
                    3. Đã Giao &amp; Đối Kiểm
                  </span>
                </div>
                <div
                  className={`font-label-sm text-sm font-semibold ${
                    simulationState === 'delivered' ? 'text-white' : 'text-on-surface'
                  }`}
                >
                  {simulationState === 'delivered'
                    ? (order.buyerConfirmed ? 'Khách đã nhận hàng' : 'Đang giao hàng')
                    : simulationState === 'completed'
                    ? 'Đã nhận hàng thành công'
                    : 'Giao hàng & Nhận đồ'}
                </div>
                <div
                  className={`text-[11px] ${
                    simulationState === 'delivered' ? 'text-white/80' : 'text-on-surface-variant'
                  }`}
                >
                  {order.buyerConfirmed ? 'Khách xác nhận đã nhận kiện hàng' : 'Bưu tá chuyển phát tới tận tay khách'}
                </div>
              </div>

              {/* Stage 4: Giải ngân Escrow */}
              <div
                className={`flex flex-col gap-1 p-3 rounded transition-all border ${
                  simulationState === 'completed'
                    ? 'bg-secondary text-on-secondary shadow-sm border-secondary'
                    : 'bg-surface-container/60 opacity-60 border-transparent'
                }`}
              >
                <div
                  className={`flex items-center gap-1.5 ${
                    simulationState === 'completed' ? 'text-secondary-fixed' : 'text-on-surface-variant'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">account_balance_wallet</span>
                  <span className="font-label-sm text-label-sm uppercase font-semibold">
                    4. Giải Ngân Escrow
                  </span>
                </div>
                <div
                  className={`font-label-sm text-sm font-semibold ${
                    simulationState === 'completed' ? 'text-white' : 'text-on-surface'
                  }`}
                >
                  {simulationState === 'completed' ? 'Đã giải ngân ròng' : 'Khóa trong Smart Escrow'}
                </div>
                <div
                  className={`text-[11px] font-mono ${
                    simulationState === 'completed' ? 'text-white/80' : 'text-on-surface-variant'
                  }`}
                >
                  {order.pricing.subtotal.toLocaleString('vi-VN')} ₫
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Main Content Grid: Items & Customer (Left 8 Cols) | Financial & Dispatch (Right 4 Cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
          {/* LEFT SECTION (8 Cols): Order Items, Customer Dossier, Pack Protocol */}
          <main className="lg:col-span-8 flex flex-col gap-6">
            {/* SECTION 1: Multi-Item Archival Showcase */}
            <section className="bg-surface-container-lowest rounded p-6 shadow-sm flex flex-col gap-4 border border-outline-variant/30">
              <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[20px]">checkroom</span>
                  <h2 className="font-serif text-xl font-semibold text-on-surface">
                    Hồ Sơ Lưu Trữ &amp; Hiện Vật THRIFT ({order.listings.length > 9 ? order.listings.length : `0${order.listings.length}`} Mục Tuyển Chọn)
                  </h2>
                </div>
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider bg-surface-container px-2.5 py-1 rounded font-medium">
                  Atelier Heritage Saigon Vault
                </span>
              </div>

              <div className="flex flex-col gap-4 divide-y divide-outline-variant/20">
                {order.listings.map((item, index) => (
                  <article key={item.id || index} className="pt-4 first:pt-0 flex flex-col sm:flex-row gap-4">
                    <div className="w-full sm:w-44 h-44 bg-surface-container-low rounded overflow-hidden relative shrink-0">
                      <img
                        className="w-full h-full object-cover"
                        src={item.imageUrl}
                        alt={item.title}
                        loading="lazy"
                      />
                      <span className="absolute top-2 left-2 bg-inverse-surface/85 text-inverse-on-surface font-label-sm text-[10px] px-1.5 py-0.5 rounded backdrop-blur-xs font-semibold">
                        {item.grade || 'GRADE 1 · MINT- (98%)'}
                      </span>
                    </div>

                    <div className="flex flex-col justify-between flex-grow gap-2">
                      <div>
                        <div className="flex items-baseline justify-between gap-2 flex-wrap">
                          <span className="font-label-sm text-label-sm text-tertiary uppercase tracking-wider font-semibold font-mono">
                            MÃ LƯU TRỮ: {item.serialNumber}
                          </span>
                          <span className="font-label-sm text-label-sm text-secondary bg-secondary-container px-2 py-0.5 rounded font-semibold uppercase">
                            {index === 0 ? 'ARCHIVE 1-OF-1' : 'VINTAGE HERITAGE'}
                          </span>
                        </div>
                        <h3 className="font-title-md text-title-md text-on-surface mt-1 font-semibold hover:text-primary transition-colors">
                          {item.title}
                        </h3>
                        <p className="font-body-md text-body-md text-on-surface-variant mt-1 text-[13px] leading-relaxed">
                          {index === 0
                            ? 'Nguồn gốc: Bộ sưu tập Archive Haute Couture. Đã qua buồng khử trùng Ozone 45 phút, xử lý dưỡng chất liệu thảo mộc nguyên bản, phom dáng chuẩn may đo không bai dão. Kèm móc gỗ sồi cao cấp và thẻ phả hệ số NFC.'
                            : 'Nguồn gốc: Tuyển tập thủ công truyền thống. Tình trạng: Hoàn mỹ 98%, sợi dệt tự nhiên mật độ cao, khuy kim loại đúc và đường chỉ may kép chắc chắn.'}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-outline-variant/20 mt-2">
                        <div className="flex items-center gap-3">
                          <div className="text-on-surface font-title-md text-title-md font-bold">
                            {item.price.toLocaleString('vi-VN')} ₫
                          </div>
                          <span className="text-on-surface-variant font-body-md text-body-md">× 01 món</span>
                          <span className="font-label-sm text-label-sm text-secondary flex items-center gap-0.5 font-medium">
                            <span className="material-symbols-outlined text-[14px]">verified</span>
                            Đã cấp chứng thư phả hệ số
                          </span>
                        </div>
                        <span className="font-label-md text-label-md text-primary font-medium">
                          Niêm chì: {order.shippingInfo?.sealCode || 'SEAL-ATELIER-9108'}
                        </span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            {/* SECTION 2: Customer Profile Dossier & Verification Badge */}
            <section className="bg-surface-container-low rounded p-6 shadow-sm flex flex-col gap-4 border border-outline-variant/30">
              <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[20px]">person_pin</span>
                  <h2 className="font-serif text-xl font-semibold text-on-surface">Hồ Sơ Giám Định Người Mua</h2>
                </div>
                <span className="font-label-sm text-label-sm text-secondary bg-secondary-container px-2.5 py-0.5 rounded font-semibold flex items-center gap-1 uppercase">
                  <span className="material-symbols-outlined text-[14px]">shield</span>
                  {order.buyer.kycTier || 'KYC XÁC THỰC CCCD · TIER 2'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1 flex flex-col gap-2 border-b md:border-b-0 md:border-r border-outline-variant/20 pb-4 md:pb-0 md:pr-4">
                  <div className="w-14 h-14 rounded-full bg-secondary text-on-secondary flex items-center justify-center font-serif text-[22px] font-bold shadow-sm">
                    {order.buyer.name
                      .split(' ')
                      .map((w) => w[0])
                      .slice(-2)
                      .join('')}
                  </div>
                  <div>
                    <h3 className="font-title-md text-title-md text-on-surface font-semibold">
                      {order.buyer.name}
                    </h3>
                    <div className="font-label-sm text-label-sm text-on-surface-variant font-mono">
                      Archival Custodian ID #CUST-VN-4401
                    </div>
                  </div>
                  <div className="mt-1 flex flex-col gap-1 text-[12px] text-on-surface-variant font-label-md">
                    <span className="flex items-center gap-1 text-secondary font-medium">
                      <span className="material-symbols-outlined text-[15px]">verified</span>
                      Điểm Tín Nhiệm: <strong>99.8%</strong> (18 Giao dịch)
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[15px]">history_edu</span>
                      Thành viên sưu tầm từ: 10/2023
                    </span>
                  </div>
                </div>

                <div className="md:col-span-2 flex flex-col justify-between gap-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-body-md">
                    <div className="flex flex-col">
                      <span className="font-label-sm text-label-sm text-on-surface-variant uppercase font-medium">
                        Số điện thoại người nhận:
                      </span>
                      <span className="text-on-surface font-semibold font-mono">{order.buyer.phone}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-label-sm text-label-sm text-on-surface-variant uppercase font-medium">
                        Thư điện tử:
                      </span>
                      <span className="text-on-surface font-semibold font-mono">
                        {order.buyer.email || 'customer@reusehub.vn'}
                      </span>
                    </div>
                    <div className="sm:col-span-2 flex flex-col">
                      <span className="font-label-sm text-label-sm text-on-surface-variant uppercase font-medium">
                        Địa chỉ tiếp nhận trang phục di sản:
                      </span>
                      <span className="text-on-surface font-medium leading-relaxed">
                        {order.buyer.shippingAddress}
                      </span>
                    </div>
                    <div className="sm:col-span-2 bg-surface rounded p-3 border border-outline-variant/30 flex items-start gap-2">
                      <span className="material-symbols-outlined text-tertiary text-[18px] shrink-0 mt-0.5">
                        priority_high
                      </span>
                      <div className="text-[13px] text-on-surface-variant leading-relaxed">
                        <strong className="text-on-surface">Chỉ dẫn bưu tá Nanuk:</strong> "Bàn giao tận tay, yêu cầu đồng kiểm kiện Nanuk giữ phom nguyên vẹn và xác nhận tem sáp trước khi ký nhận."
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-outline-variant/20">
                    <button
                      type="button"
                      onClick={() => setShowChatModal(true)}
                      className="px-3.5 py-1.5 rounded bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-label-md text-label-md transition-all flex items-center gap-1.5 cursor-pointer font-medium"
                    >
                      <span className="material-symbols-outlined text-[16px] text-primary">chat_bubble</span>
                      <span>Nhắn Tin Trao Đổi Với Khách Hàng</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleCopyAddress}
                      className="px-3.5 py-1.5 rounded bg-surface hover:bg-surface-container text-on-surface-variant font-label-md text-label-md transition-all border border-outline-variant/30 flex items-center gap-1 cursor-pointer font-medium"
                    >
                      <span className="material-symbols-outlined text-[16px]">content_copy</span>
                      <span>Sao chép Địa Chỉ</span>
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* SECTION 3: Packing & Garment Preservation Protocol */}
            <section className="bg-surface-container rounded p-6 shadow-sm flex flex-col gap-3 border border-outline-variant/30">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-[20px]">
                  assignment_turned_in
                </span>
                <h2 className="font-serif text-xl font-semibold text-on-surface">
                  Quy Chuẩn Niêm Phong &amp; Bảo Quản Trang Phục Nanuk Garment Crate
                </h2>
              </div>
              <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                Theo tiêu chuẩn bảo tồn thời trang tuần hoàn ReUse Circularity Tier-1, trang phục di sản phải đáp ứng đủ 3 bước kiểm định trước khi bàn giao bưu tá:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-1">
                <div className="p-3.5 rounded bg-surface border border-outline-variant/30 flex flex-col gap-1.5">
                  <div className="flex items-center gap-1.5 font-label-md text-label-md text-on-surface font-semibold">
                    <span className="material-symbols-outlined text-[16px] text-primary">air</span>
                    1. Khử Trùng &amp; Hấp Giữ Phom
                  </div>
                  <p className="text-[12px] text-on-surface-variant leading-relaxed">
                    Khử khuẩn buồng Ozone 45 phút, xử lý hấp nhiệt nhẹ giữ phẳng nếp vải và dưỡng sợi dệt nguyên bản.
                  </p>
                </div>

                <div className="p-3.5 rounded bg-surface border border-outline-variant/30 flex flex-col gap-1.5">
                  <div className="flex items-center gap-1.5 font-label-md text-label-md text-on-surface font-semibold">
                    <span className="material-symbols-outlined text-[16px] text-secondary">lock</span>
                    2. Tem Sáp Niêm Phong Cổ Áo
                  </div>
                  <p className="text-[12px] text-on-surface-variant leading-relaxed">
                    Đính tem chỉ sáp yếm khí Tamper-Proof <em>{order.shippingInfo?.sealCode || 'SEAL-ATELIER-9108'}</em> tại mác cổ áo để bảo chứng chất lượng nguyên bản khi giao nhận.
                  </p>
                </div>

                <div className="p-3.5 rounded bg-surface border border-outline-variant/30 flex flex-col gap-1.5">
                  <div className="flex items-center gap-1.5 font-label-md text-label-md text-on-surface font-semibold">
                    <span className="material-symbols-outlined text-[16px] text-tertiary">
                      inventory_2
                    </span>
                    3. Kiện Nanuk Chống Nhăn
                  </div>
                  <p className="text-[12px] text-on-surface-variant leading-relaxed">
                    Treo cố định trên giá chuyên dụng trong vali Nanuk Garment Crate chống ẩm và chống gấp nếp.
                  </p>
                </div>
              </div>
            </section>
          </main>

          {/* RIGHT SECTION (4 Cols): Financial Settlement & Dispatch Waybill */}
          <aside aria-label="Chi tiết thanh toán và điều phối" className="lg:col-span-4 flex flex-col gap-6">
            {/* FINANCIAL SETTLEMENT CARD (Immutable ledger) */}
            <section className="bg-surface-container-lowest rounded p-5 lg:p-6 shadow-sm border border-outline-variant/30 flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-outline-variant/20 pb-2">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-primary text-[20px]">account_balance</span>
                  <h2 className="font-serif text-lg font-semibold text-on-surface">
                    Bản Ghi Quyết Toán Tài Chính THRIFT
                  </h2>
                </div>
                <span className="material-symbols-outlined text-[18px] text-secondary" title="Sổ cái bất biến khóa Smart Escrow">
                  lock
                </span>
              </div>

              {/* Immutable Ledger Notice */}
              <div className="p-2.5 rounded bg-surface-container text-[11px] text-on-surface-variant font-label-md flex items-start gap-1.5 border border-outline-variant/20 leading-relaxed">
                <span className="material-symbols-outlined text-[16px] text-primary shrink-0 mt-0.5">info</span>
                <span>
                  Bản ghi tài chính được đối soát tự động bởi Cổng thanh toán VNPay và Hợp đồng Smart Escrow.
                  Khoản tiền chỉ giải ngân cho Atelier sau khi khách thử đồ ưng ý hoặc kết thúc 72h đối kiểm.
                </span>
              </div>

              {/* Payment Metadata */}
              <div className="flex flex-col gap-1.5 text-[12px] font-label-md bg-surface-container-low p-3 rounded">
                <div className="flex items-center justify-between text-on-surface-variant">
                  <span>Trạng thái quỹ:</span>
                  <span className="font-semibold text-secondary flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                    ĐÃ PHONG TỎA (Smart Escrow)
                  </span>
                </div>
                <div className="flex items-center justify-between text-on-surface-variant">
                  <span>Cổng giao dịch:</span>
                  <span className="text-on-surface font-medium">VNPay QR (NAPAS247)</span>
                </div>
                <div className="flex items-center justify-between text-on-surface-variant">
                  <span>Mã giao dịch VNPay:</span>
                  <span className="font-mono text-on-surface font-medium">VNP-TX-84920419208</span>
                </div>
                <div className="flex items-center justify-between text-on-surface-variant">
                  <span>Thời gian khóa quỹ:</span>
                  <span className="text-on-surface font-mono">{order.createdAt || '20/11/2024 · 14:32'}</span>
                </div>
              </div>

              {/* Financial Breakdown Table */}
              <div className="flex flex-col gap-2 pt-2 border-t border-outline-variant/20 font-body-md text-[13px]">
                <div className="flex items-center justify-between text-on-surface-variant">
                  <span>Tiền hàng ({order.listings.length.toString().padStart(2, '0')} hiện vật THRIFT):</span>
                  <span className="text-on-surface font-medium font-mono">
                    {order.pricing.subtotal.toLocaleString('vi-VN')} ₫
                  </span>
                </div>
                <div className="flex items-center justify-between text-on-surface-variant">
                  <span>Vận chuyển Nanuk Garment (Bảo hiểm 100%):</span>
                  <span className="text-on-surface font-medium font-mono">
                    {order.pricing.shippingFee.toLocaleString('vi-VN')} ₫
                  </span>
                </div>
                <div className="flex items-center justify-between text-on-surface font-semibold pt-2 border-t border-outline-variant/20">
                  <span>Tổng khách đã thanh toán:</span>
                  <span className="font-serif text-lg font-bold text-on-surface font-mono">
                    {order.pricing.totalAmount.toLocaleString('vi-VN')} ₫
                  </span>
                </div>

                <div className="flex items-center justify-between text-on-surface-variant text-[12px] pt-1">
                  <span className="flex items-center gap-1">
                    Phí hạ tầng thẩm định ReUse (3.5%):
                    <span
                      className="material-symbols-outlined text-[13px] text-outline"
                      title="Chi phí hạ tầng kiểm định & cấp chứng thư số NFC"
                    >
                      help
                    </span>
                  </span>
                  <span className="text-error font-mono font-medium">
                    -{Math.round(order.pricing.subtotal * 0.035).toLocaleString('vi-VN')} ₫
                  </span>
                </div>

                <div className="flex items-center justify-between text-on-surface-variant text-[12px]">
                  <span className="flex items-center gap-1">
                    Quỹ B-Corp Circularity (0.5%):
                    <span
                      className="material-symbols-outlined text-[13px] text-outline"
                      title="Ủng hộ tái sinh sợi dệt và bao bì Nanuk tuần hoàn"
                    >
                      help
                    </span>
                  </span>
                  <span className="text-error font-mono font-medium">
                    -{Math.round(order.pricing.subtotal * 0.005).toLocaleString('vi-VN')} ₫
                  </span>
                </div>

                {/* Net Settlement Result */}
                <div className="mt-2 p-3.5 rounded bg-secondary-container/40 border border-secondary/20 flex flex-col gap-1">
                  <span className="font-label-sm text-label-sm text-secondary uppercase font-bold tracking-wider">
                    Doanh thu xưởng thực nhận:
                  </span>
                  <div className="font-serif text-2xl text-on-secondary-fixed font-bold leading-tight font-mono text-secondary">
                    {Math.round(order.pricing.subtotal * 0.96).toLocaleString('vi-VN')} ₫
                  </div>
                  <span className="text-[11px] text-on-secondary-container mt-0.5 leading-relaxed">
                    Giải ngân về ví xưởng ngay khi khách hàng xác nhận đã nhận hàng thành công.
                  </span>
                </div>
              </div>
            </section>

            {/* DISPATCH & LOGISTICS TRACKING CARD */}
            <section className="bg-surface-container-lowest rounded p-5 lg:p-6 shadow-sm border border-outline-variant/30 flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-outline-variant/20 pb-2">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-primary text-[20px]">local_shipping</span>
                  <h2 className="font-serif text-lg font-semibold text-on-surface">Điều Phối Vận Chuyển Nanuk</h2>
                </div>
                <span className="font-label-sm text-label-sm text-primary uppercase bg-primary-fixed/40 px-2 py-0.5 rounded font-semibold">
                  Garment Express
                </span>
              </div>

              <div className="flex flex-col gap-2.5 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">
                    Mã Vận Đơn Bọc Thép:
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="font-mono text-on-surface font-semibold">
                      {order.shippingInfo?.trackingCode || '#NK-883910-TH'}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyTracking(order.shippingInfo?.trackingCode || '#NK-883910-TH')}
                      className="p-1 hover:text-primary cursor-pointer text-on-surface-variant"
                      title="Sao chép mã"
                    >
                      <span className="material-symbols-outlined text-[15px]">content_copy</span>
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">
                    Mã Tem Sáp Yếm Khí:
                  </span>
                  <span className="font-mono text-secondary font-bold">
                    {order.shippingInfo?.sealCode || 'SEAL-ATELIER-9108'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">
                    Đơn Vị Chuyên Chở:
                  </span>
                  <span className="text-on-surface font-medium">
                    {order.shippingInfo?.carrier || 'Bưu tá Nanuk Garment Express'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">
                    Trạng Thái Bưu Vận:
                  </span>
                  <span
                    className={`font-label-sm text-label-sm font-semibold px-2 py-0.5 rounded ${
                      simulationState === 'shipped'
                        ? 'bg-blue-100 text-blue-900'
                        : simulationState === 'delivered' || simulationState === 'completed'
                        ? 'bg-secondary-container text-on-secondary-container'
                        : 'bg-tertiary-fixed/60 text-tertiary'
                    }`}
                  >
                    {simulationState === 'paid' && '1. Chờ xuất xưởng (Awaiting Pickup)'}
                    {simulationState === 'processing' && '2. Đang niêm phong tại xưởng'}
                    {simulationState === 'shipped' && '3. Đang vận chuyển trên đường'}
                    {simulationState === 'delivered' && '4. Đã giao - Đang đối kiểm 72h'}
                    {simulationState === 'completed' && '5. Khách hài lòng & Hoàn tất 100%'}
                    {simulationState === 'disputed' && '6. Tạm dừng phân xử'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">
                    Hạn Chót Bàn Giao SLA:
                  </span>
                  <span className="text-error font-semibold font-label-md">14:30 Ngày mai (23h còn lại)</span>
                </div>
              </div>

              {/* Interactive Waybill Action */}
              <div className="pt-2 border-t border-outline-variant/20 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => setShowTrackingModal(true)}
                  className="w-full py-2.5 rounded bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-label-md text-label-md transition-all flex items-center justify-center gap-1.5 cursor-pointer font-medium"
                >
                  <span className="material-symbols-outlined text-[18px]">route</span>
                  <span>Xem Nhật Ký Hành Trình &amp; Cảm Biến Nanuk</span>
                </button>
                <p className="text-[11px] text-on-surface-variant text-center leading-relaxed">
                  Kiện Nanuk được trang bị cảm biến độ ẩm 45% RH và nhiệt độ 22°C tối ưu cho vải/da di sản.
                </p>
              </div>
            </section>

            {/* DISPUTE & AUDIT ESCALATION PANEL */}
            <section
              id="dispute-section"
              className="bg-surface-container-low rounded p-5 shadow-sm border border-outline-variant/30 flex flex-col gap-2"
            >
              <div className="flex items-center gap-2 text-error">
                <span className="material-symbols-outlined text-[20px]">shield_with_heart</span>
                <h2 className="font-title-md text-title-md font-semibold">Trợ Giúp Pháp Lý &amp; Kiểm Định Vải</h2>
              </div>
              <p className="text-[12px] text-on-surface-variant leading-relaxed">
                Nếu có khiếu nại phát sinh trong 72h mặc thử hoặc tem niêm phong sáp bị tác động sai quy cách, chủ xưởng có quyền yêu cầu chuyên viên thẩm định độc lập ReUse Hub can thiệp.
              </p>
              <button
                type="button"
                onClick={() => setShowChatModal(true)}
                className="w-full py-2 rounded bg-surface hover:bg-error-container/20 text-error font-label-md text-label-md border border-error/30 transition-all flex items-center justify-center gap-1.5 mt-1 cursor-pointer font-semibold"
              >
                <span className="material-symbols-outlined text-[16px]">support_agent</span>
                <span>Mở Hội Thoại Trọng Tài Admin</span>
              </button>
            </section>
          </aside>
        </div>
      </div>

      {/* MODAL 1: B-Corp Archival Certificate Modal */}
      {showCertModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-[#141310]/60 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-surface-container-lowest border border-outline-variant/40 shadow-2xl rounded-lg max-w-lg w-full p-6 flex flex-col gap-4 animate-scale-in">
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-[24px]">verified</span>
                <span className="font-serif text-xl font-semibold text-on-surface">
                  Biên Lai Tuần Hoàn B-Corp Thời Trang
                </span>
              </div>
              <button
                type="button"
                className="p-1 text-on-surface-variant hover:text-on-surface cursor-pointer"
                onClick={() => setShowCertModal(false)}
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="flex flex-col gap-3 font-body-md text-[13px] text-on-surface-variant leading-relaxed">
              <div className="p-3 bg-surface-container rounded border border-outline-variant/30 flex flex-col gap-1">
                <span className="font-label-sm text-label-sm text-secondary font-bold uppercase font-mono">
                  Chứng thư số #BCORP-GARMENT-9108
                </span>
                <span className="text-on-surface font-semibold text-[14px]">
                  Tác Động Vòng Đời Trang Phục Di Sản (Second Life)
                </span>
                <p className="mt-1">
                  Bằng việc bảo tồn và tái lưu thông trang phục di sản độc bản, Atelier và ReUse Hub đã bù trừ thành công <strong>14.2 kg CO₂e</strong> phát thải và tiết kiệm <strong>8.500 lít nước sạch</strong> so với quy trình dệt may sản xuất mới.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="p-3 bg-secondary-container/40 rounded border border-secondary/20">
                  <div className="font-serif text-2xl font-bold text-on-secondary-container text-secondary">
                    8.500 L
                  </div>
                  <div className="font-label-sm text-label-sm text-on-secondary-container font-medium mt-0.5">
                    Nước Sạch Tiết Kiệm
                  </div>
                </div>
                <div className="p-3 bg-secondary-container/40 rounded border border-secondary/20">
                  <div className="font-serif text-2xl font-bold text-on-secondary-container text-secondary">
                    100%
                  </div>
                  <div className="font-label-sm text-label-sm text-on-secondary-container font-medium mt-0.5">
                    Bao Bì Nanuk Tuần Hoàn
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-outline-variant/20">
              <button
                type="button"
                className="px-4 py-2 rounded bg-inverse-surface hover:bg-primary text-inverse-on-surface font-label-md text-label-md transition-colors cursor-pointer font-semibold"
                onClick={() => setShowCertModal(false)}
              >
                Đóng Chứng Thư
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Live Tracking & Nanuk Garment Sensor Modal */}
      {showTrackingModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-[#141310]/60 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-surface-container-lowest border border-outline-variant/40 shadow-2xl rounded-lg max-w-xl w-full p-6 flex flex-col gap-4 animate-scale-in">
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[24px]">sensors</span>
                <span className="font-serif text-xl font-semibold text-on-surface">
                  Hành Trình Nanuk Garment Crate &amp; Cảm Biến Bảo Quản
                </span>
              </div>
              <button
                type="button"
                className="p-1 text-on-surface-variant hover:text-on-surface cursor-pointer"
                onClick={() => setShowTrackingModal(false)}
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="flex flex-col gap-3 font-body-md text-[13px]">
              <div className="flex items-center justify-between p-2.5 rounded bg-surface-container border border-surface-dim">
                <span className="text-on-surface-variant">
                  Mã kiện:{' '}
                  <strong className="text-on-surface font-mono">
                    {order.shippingInfo?.trackingCode || '#NK-883910-TH'}
                  </strong>
                </span>
                <span className="text-secondary font-semibold flex items-center gap-1 font-mono">
                  <span className="w-2 h-2 rounded-full bg-secondary"></span>
                  Nhiệt độ: 22°C · Độ ẩm: 45% RH (Tối ưu)
                </span>
              </div>

              <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-outline-variant/40 py-2">
                <div className="relative">
                  <span className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-secondary ring-4 ring-surface"></span>
                  <div className="text-on-surface font-semibold">Khởi tạo mã vận đơn bưu tá Nanuk White-Glove</div>
                  <div className="text-on-surface-variant text-[11px]">
                    20/11/2024 · 14:35 — Điều phối viên đã chỉ định nhân sự chuyên dụng
                  </div>
                </div>

                <div className={`relative ${simulationState === 'paid' ? 'opacity-60' : ''}`}>
                  <span
                    className={`absolute -left-6 top-1 w-2.5 h-2.5 rounded-full ring-4 ring-surface ${
                      simulationState !== 'paid' ? 'bg-secondary' : 'bg-outline-variant'
                    }`}
                  ></span>
                  <div className="text-on-surface font-semibold">
                    Bưu tá quét tem sáp niêm phong cổ áo tại Atelier
                  </div>
                  <div className="text-on-surface-variant text-[11px]">
                    {simulationState !== 'paid' ? 'Đã hoàn tất quét tem sáp lúc 16:30' : 'Dự kiến: Trước 14:30 ngày 21/11/2024'}
                  </div>
                </div>

                <div
                  className={`relative ${
                    ['shipped', 'delivered', 'completed'].includes(simulationState) ? '' : 'opacity-40'
                  }`}
                >
                  <span
                    className={`absolute -left-6 top-1 w-2.5 h-2.5 rounded-full ring-4 ring-surface ${
                      ['shipped', 'delivered', 'completed'].includes(simulationState)
                        ? 'bg-secondary'
                        : 'bg-outline-variant'
                    }`}
                  ></span>
                  <div className="text-on-surface font-semibold">
                    Vận chuyển chặng chuyên dụng thùng kín treo phẳng
                  </div>
                  <div className="text-on-surface-variant text-[11px]">
                    Xe kiểm soát vi khí hậu, chống gấp nếp trang phục di sản
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-outline-variant/20">
              <button
                type="button"
                className="px-4 py-2 rounded bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-label-md text-label-md cursor-pointer font-semibold"
                onClick={() => setShowTrackingModal(false)}
              >
                Đóng Cửa Sổ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Bàn Giao Bưu Tá Nanuk (Mark Shipped) */}
      {showDispatchModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-[#141310]/60 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-surface-container-lowest border border-outline-variant/40 shadow-2xl rounded-2xl max-w-lg w-full p-6 flex flex-col gap-4 animate-scale-in">
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-[24px]">local_shipping</span>
                <span className="font-serif text-lg font-bold text-on-surface">
                  Bàn Giao Bưu Tá Nanuk &amp; Kích Hoạt Vận Chuyển
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowDispatchModal(false)}
                className="p-1 hover:text-on-surface text-on-surface-variant cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleConfirmDispatch} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-on-surface mb-1">Đơn vị vận chuyển bọc thép:</label>
                <input
                  type="text"
                  value={dispatchCarrier}
                  onChange={(e) => setDispatchCarrier(e.target.value)}
                  className="w-full bg-surface-container-low rounded-xl px-3.5 py-2.5 text-xs text-on-surface border border-outline-variant/40 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-on-surface mb-1">Mã vận đơn Nanuk (Waybill):</label>
                <input
                  type="text"
                  value={dispatchTrackingCode}
                  onChange={(e) => setDispatchTrackingCode(e.target.value)}
                  className="w-full bg-surface-container-low rounded-xl px-3.5 py-2.5 text-xs text-on-surface font-mono font-bold border border-outline-variant/40 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-on-surface mb-1">Mã tem sáp yếm khí niêm phong (Seal Code):</label>
                <input
                  type="text"
                  value={dispatchSealCode}
                  onChange={(e) => setDispatchSealCode(e.target.value)}
                  className="w-full bg-surface-container-low rounded-xl px-3.5 py-2.5 text-xs text-on-surface font-mono font-bold border border-outline-variant/40 focus:outline-none"
                  required
                />
              </div>

              <div className="p-3 bg-secondary-container/30 rounded-xl text-[11px] text-on-secondary-container leading-relaxed border border-secondary/20">
                Tem sáp này sẽ được đối chiếu khi người mua mở kiện và trong suốt 72 giờ đối kiểm mặc thử để bảo vệ quyền lợi Escrow của Atelier.
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDispatchModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-semibold cursor-pointer"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-primary hover:bg-tertiary text-on-primary font-bold shadow-md cursor-pointer"
                >
                  Xác Nhận Bàn Giao
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: Chat Drawer with Buyer / Mediator */}
      {showChatModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-[#141310]/60 backdrop-blur-xs flex items-center justify-end"
        >
          <div className="bg-surface-container-lowest h-full max-w-md w-full p-6 flex flex-col justify-between shadow-2xl border-l border-outline-variant/30 animate-slide-left">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-secondary text-on-secondary flex items-center justify-center font-bold text-xs">
                    {order.buyer.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-on-surface">{order.buyer.name}</h4>
                    <span className="text-[11px] text-secondary font-medium">
                      Kênh trao đổi bảo mật ReUse Hub
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowChatModal(false)}
                  className="p-1 hover:text-on-surface text-on-surface-variant cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>

              {/* Chat Message List */}
              <div className="space-y-3 py-4 max-h-[60vh] overflow-y-auto pr-1">
                {chatMessages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex flex-col ${
                      msg.sender === 'shop'
                        ? 'items-end'
                        : msg.sender === 'system'
                        ? 'items-center text-center'
                        : 'items-start'
                    }`}
                  >
                    {msg.sender === 'system' ? (
                      <div className="p-2 bg-surface-container rounded text-[11px] text-on-surface-variant max-w-[85%] border border-surface-dim">
                        {msg.text}
                      </div>
                    ) : (
                      <>
                        <div
                          className={`p-3 rounded-lg max-w-[85%] text-xs leading-relaxed ${
                            msg.sender === 'shop'
                              ? 'bg-primary text-on-primary'
                              : 'bg-surface-container-high text-on-surface'
                          }`}
                        >
                          {msg.text}
                        </div>
                        <span className="text-[10px] text-on-surface-variant mt-0.5 px-1">{msg.time}</span>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Chat Input */}
            <form onSubmit={handleSendMessage} className="pt-3 border-t border-outline-variant/20">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatMessageInput}
                  onChange={(e) => setChatMessageInput(e.target.value)}
                  placeholder="Gửi phản hồi cho khách hàng..."
                  className="flex-1 px-3 py-2 bg-surface rounded text-xs text-on-surface focus:outline-none border border-outline-variant/40"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary hover:bg-tertiary text-on-primary rounded text-xs font-semibold uppercase tracking-wider cursor-pointer"
                >
                  Gửi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShopThriftOrderDetail;
