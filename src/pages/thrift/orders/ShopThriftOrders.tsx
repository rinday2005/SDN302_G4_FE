import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import type {
  ThriftOrder,
  ThriftOrderStatus,
  ShippingInfo,
  ThriftListingItem,
} from '../../data/shop/thriftOrdersData';
import {
  SHOP_THRIFT_ORDERS_STORAGE_KEY,
  INITIAL_MOCK_THRIFT_ORDERS,
} from '../../data/shop/thriftOrdersData';
import {
  getShopThriftOrdersApi,
  updateThriftOrderStatusApi,
} from '../../../services/thriftOrder.api';
import type { ThriftOrderApi } from '../../../services/thriftOrder.api';

interface ExtendedThriftOrder extends ThriftOrder {
  _dbId?: string;
  rawCreatedAt?: number | string;
}

const getOrderTimestamp = (order: ExtendedThriftOrder): number => {
  if (order.rawCreatedAt) {
    const t = typeof order.rawCreatedAt === 'number' ? order.rawCreatedAt : new Date(order.rawCreatedAt).getTime();
    if (!isNaN(t)) return t;
  }
  if (order._dbId && /^[0-9a-fA-F]{24}$/.test(order._dbId)) {
    const seconds = parseInt(order._dbId.substring(0, 8), 16);
    if (!isNaN(seconds) && seconds > 0) {
      return seconds * 1000;
    }
  }
  if (order.createdAt) {
    const directTime = Date.parse(order.createdAt);
    if (!isNaN(directTime)) return directTime;

    const parts = order.createdAt.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s*·\s*(\d{1,2}):(\d{1,2}))?/);
    if (parts) {
      const day = parseInt(parts[1], 10);
      const month = parseInt(parts[2], 10) - 1;
      const year = parseInt(parts[3], 10);
      const hour = parts[4] ? parseInt(parts[4], 10) : 0;
      const minute = parts[5] ? parseInt(parts[5], 10) : 0;
      return new Date(year, month, day, hour, minute).getTime();
    }
  }
  return 0;
};

const CLOTHING_FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&auto=format&fit=crop&q=60',
  'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&auto=format&fit=crop&q=60',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=800&auto=format&fit=crop&q=60',
  'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=800&auto=format&fit=crop&q=60',
];

const mapApiThriftOrder = (apiOrder: ThriftOrderApi): ExtendedThriftOrder => {
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
      grade: item.condition || (listingObj as { condition?: string })?.condition || 'Grade 1 · Rất tốt (98%)',
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
    rawCreatedAt: apiOrder.createdAt || (apiOrder._id && /^[0-9a-fA-F]{24}$/.test(apiOrder._id) ? parseInt(apiOrder._id.substring(0, 8), 16) * 1000 : Date.now()),
    buyer: {
      name: buyerName,
      phone: buyerPhone,
      email: buyerEmail,
      shippingAddress: addr,
      kycTier: 'KYC Xác thực CCCD · TIER 2',
    },
    listings,
    pricing: {
      subtotal,
      shippingFee: apiOrder.shippingFee || 0,
      totalAmount: apiOrder.totalAmount || 0,
    },
    status,
    buyerConfirmed: Boolean(apiOrder.buyerConfirmed),
    buyerConfirmedAt: apiOrder.buyerConfirmedAt,
    shippingInfo: {
      carrier: apiOrder.courierName || 'Viettel Post Chuyên Dụng Nanuk',
      trackingCode: apiOrder.trackingCode || '',
      dispatchedAt: apiOrder.updatedAt ? new Date(apiOrder.updatedAt).toLocaleString('vi-VN') : undefined,
      notes: (apiOrder as { note?: string }).note || 'Vali Nanuk bảo quản phom dáng. Thẻ niêm phong sáp yếm khí.',
      sealCode: apiOrder.sealCode || (apiOrder.trackingCode ? `#SEAL-${apiOrder.trackingCode.slice(-6)}` : '#SEAL-ATELIER-CLOTHES'),
    },
  };
};

export const ShopThriftOrders: React.FC = () => {
  // State danh sách đơn hàng THRIFT
  const [orders, setOrders] = useState<ExtendedThriftOrder[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Bộ lọc trạng thái & tìm kiếm theo 4 bước nghiệp vụ thrift
  const [activeFilter, setActiveFilter] = useState<'ALL' | ThriftOrderStatus>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal Xác nhận thẩm định & bàn giao vận chuyển Nanuk
  const [selectedOrderForShipment, setSelectedOrderForShipment] = useState<ExtendedThriftOrder | null>(null);
  const [carrierInput, setCarrierInput] = useState('Viettel Post Chuyên Dụng Nanuk');
  const [trackingCodeInput, setTrackingCodeInput] = useState('');
  const [sealCodeInput, setSealCodeInput] = useState('');
  const [notesInput, setNotesInput] = useState('');
  const [isSubmittingShipment, setIsSubmittingShipment] = useState(false);

  // Load orders kết hợp: Server MongoDB API + LocalStorage + Mock Quần áo di sản
  const loadOrders = useCallback(async () => {
    let apiList: ThriftOrderApi[] = [];
    try {
      const res = await getShopThriftOrdersApi();
      apiList = res?.orders || (Array.isArray(res) ? res : []);
    } catch (e) {
      console.warn('Không thể nạp từ MongoDB server, chuyển sang bộ nhớ lưu trữ:', e);
    }

    // 1. Đọc từ SHOP_THRIFT_ORDERS_STORAGE_KEY
    const localMerged: ExtendedThriftOrder[] = [];
    try {
      const storedShop = localStorage.getItem(SHOP_THRIFT_ORDERS_STORAGE_KEY);
      if (storedShop) {
        const parsed: ThriftOrder[] = JSON.parse(storedShop);
        localMerged.push(...parsed);
      }
    } catch (e) {
      console.warn('Lỗi đọc SHOP_THRIFT_ORDERS_STORAGE_KEY:', e);
    }

    // 2. Tìm kiếm các đơn mua THRIFT do User vừa thanh toán từ giỏ hàng (user_thrift_orders)
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key === 'user_thrift_orders' || key.startsWith('user_thrift_orders_'))) {
          const raw = localStorage.getItem(key);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
              parsed.forEach((po) => {
                const mapped = mapApiThriftOrder(po);
                if (!localMerged.some((ex) => ex.id.replace('#', '') === mapped.id.replace('#', ''))) {
                  localMerged.push(mapped);
                }
              });
            }
          }
        }
      }
    } catch (e) {
      console.warn('Lỗi kiểm tra user_thrift_orders:', e);
    }

    // 3. Kết hợp API và Local (API data ghi đè nếu có)
    const combinedMap = new Map<string, ExtendedThriftOrder>();
    localMerged.forEach((o) => {
      const cleanKey = o.id.replace('#', '').trim();
      if (cleanKey) combinedMap.set(cleanKey, o);
    });
    apiList.forEach((apiO) => {
      const mapped = mapApiThriftOrder(apiO);
      const cleanKey = mapped.id.replace('#', '').trim();
      if (cleanKey) combinedMap.set(cleanKey, mapped);
    });

    let finalOrders = Array.from(combinedMap.values());
    if (finalOrders.length === 0) {
      // Fallback về danh sách trang phục di sản mẫu
      finalOrders = INITIAL_MOCK_THRIFT_ORDERS.map((o) => ({ ...o }));
      try {
        localStorage.setItem(SHOP_THRIFT_ORDERS_STORAGE_KEY, JSON.stringify(finalOrders));
      } catch {
        // ignore
      }
    }

    finalOrders.sort((a, b) => getOrderTimestamp(b) - getOrderTimestamp(a));
    setOrders(finalOrders);
    setLoading(false);
  }, []);

  useEffect(() => {
    let active = true;
    void getShopThriftOrdersApi()
      .then((res) => {
        if (!active) return;
        const apiList = res?.orders || (Array.isArray(res) ? res : []);
        const localMerged: ExtendedThriftOrder[] = [];
        try {
          const storedShop = localStorage.getItem(SHOP_THRIFT_ORDERS_STORAGE_KEY);
          if (storedShop) {
            const parsed: ThriftOrder[] = JSON.parse(storedShop);
            localMerged.push(...parsed);
          }
        } catch (e) {
          console.warn('Lỗi đọc SHOP_THRIFT_ORDERS_STORAGE_KEY:', e);
        }

        try {
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (key === 'user_thrift_orders' || key.startsWith('user_thrift_orders_'))) {
              const raw = localStorage.getItem(key);
              if (raw) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed)) {
                  parsed.forEach((po) => {
                    const mapped = mapApiThriftOrder(po);
                    if (!localMerged.some((ex) => ex.id.replace('#', '') === mapped.id.replace('#', ''))) {
                      localMerged.push(mapped);
                    }
                  });
                }
              }
            }
          }
        } catch (e) {
          console.warn('Lỗi kiểm tra user_thrift_orders:', e);
        }

        const combinedMap = new Map<string, ExtendedThriftOrder>();
        localMerged.forEach((o) => {
          const cleanKey = o.id.replace('#', '').trim();
          if (cleanKey) combinedMap.set(cleanKey, o);
        });
        apiList.forEach((apiO) => {
          const mapped = mapApiThriftOrder(apiO);
          const cleanKey = mapped.id.replace('#', '').trim();
          if (cleanKey) combinedMap.set(cleanKey, mapped);
        });

        let finalOrders = Array.from(combinedMap.values());
        if (finalOrders.length === 0) {
          finalOrders = INITIAL_MOCK_THRIFT_ORDERS.map((o) => ({ ...o }));
          try {
            localStorage.setItem(SHOP_THRIFT_ORDERS_STORAGE_KEY, JSON.stringify(finalOrders));
          } catch {
            // ignore
          }
        }

        finalOrders.sort((a, b) => getOrderTimestamp(b) - getOrderTimestamp(a));
        setOrders(finalOrders);
        setLoading(false);
      })
      .catch((err) => {
        if (!active) return;
        console.warn('Không thể nạp từ MongoDB server, fallback bộ nhớ:', err);
        const fallback = INITIAL_MOCK_THRIFT_ORDERS.map((o) => ({ ...o })).sort(
          (a, b) => getOrderTimestamp(b) - getOrderTimestamp(a)
        );
        setOrders(fallback);
        setLoading(false);
      });

    const handleStorageChange = () => {
      loadOrders();
    };
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('rental_order_updated', handleStorageChange);
    return () => {
      active = false;
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('rental_order_updated', handleStorageChange);
    };
  }, [loadOrders]);

  // Mở modal xác nhận thẩm định & bàn giao vận chuyển Nanuk
  const handleOpenShipmentModal = (order: ExtendedThriftOrder) => {
    setSelectedOrderForShipment(order);
    setCarrierInput(order.shippingInfo?.carrier || 'Viettel Post Chuyên Dụng Nanuk');
    setTrackingCodeInput(
      order.shippingInfo?.trackingCode || `NNK-${Math.floor(100000 + Math.random() * 900000)}-VN`
    );
    setSealCodeInput(
      order.shippingInfo?.sealCode || `#SEAL-ATELIER-${Math.floor(1000 + Math.random() * 9000)}`
    );
    setNotesInput(
      order.shippingInfo?.notes ||
        'Đã hoàn tất thẩm định sợi vải, khử khuẩn buồng Ozone và bọc vali Nanuk giữ phẳng phom dáng.'
    );
  };

  // Đóng modal
  const handleCloseShipmentModal = () => {
    setSelectedOrderForShipment(null);
    setIsSubmittingShipment(false);
  };

  // Xử lý xác nhận thẩm định & gửi hàng Nanuk (Cập nhật SHIPPING lên DB & Storage)
  const handleConfirmShipment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderForShipment) return;

    if (!trackingCodeInput.trim()) {
      alert('Vui lòng nhập Mã Vận Đơn (Tracking Number)!');
      return;
    }

    setIsSubmittingShipment(true);
    const now = new Date().toLocaleString('vi-VN');
    const newShippingInfo: ShippingInfo = {
      carrier: carrierInput.trim(),
      trackingCode: trackingCodeInput.trim(),
      sealCode: sealCodeInput.trim(),
      dispatchedAt: now,
      notes: notesInput.trim(),
    };

    try {
      const dbId = selectedOrderForShipment._dbId || selectedOrderForShipment.id.replace('#', '');
      await updateThriftOrderStatusApi(dbId, {
        status: 'SHIPPING',
        trackingCode: trackingCodeInput.trim(),
        courierName: carrierInput.trim(),
        note: notesInput.trim(),
        sealCode: sealCodeInput.trim(),
      });
    } catch (error) {
      console.warn('Cập nhật backend chưa thành công, lưu trực tiếp local storage:', error);
    }

    // Hàm đồng bộ trạng thái sang các key user_thrift_orders trong localStorage
    const syncUserOrdersStorage = (orderId: string, newStatus: string, shippingData?: ShippingInfo) => {
      try {
        const cleanOrderId = orderId.replace('#', '');
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key === 'user_thrift_orders' || key.startsWith('user_thrift_orders_'))) {
            const raw = localStorage.getItem(key);
            if (raw) {
              const list: ThriftOrderApi[] = JSON.parse(raw);
              let hasChanged = false;
              const updatedUserList = list.map((uo) => {
                const uCode = (uo.orderCode || uo._id || '').replace('#', '');
                if (uCode === cleanOrderId || uo._id === cleanOrderId) {
                  hasChanged = true;
                  return {
                    ...uo,
                    status: newStatus as ThriftOrderApi['status'],
                    ...(shippingData
                      ? {
                          trackingCode: shippingData.trackingCode,
                          courierName: shippingData.carrier,
                          sealCode: shippingData.sealCode,
                          note: shippingData.notes,
                        }
                      : {}),
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
      } catch (e) {
        console.warn('Lỗi đồng bộ user_thrift_orders:', e);
      }
    };

    // Cập nhật state & local storage
    const updated = orders.map((ord) => {
      if (ord.id === selectedOrderForShipment.id) {
        return {
          ...ord,
          status: 'SHIPPED' as ThriftOrderStatus,
          shippingInfo: newShippingInfo,
        };
      }
      return ord;
    });

    setOrders(updated);
    try {
      localStorage.setItem(SHOP_THRIFT_ORDERS_STORAGE_KEY, JSON.stringify(updated));
      syncUserOrdersStorage(selectedOrderForShipment.id, 'SHIPPED', newShippingInfo);
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new Event('rental_order_updated'));
    } catch {
      // ignore
    }

    setIsSubmittingShipment(false);
    setSelectedOrderForShipment(null);
    showToast(
      `ĐÃ HOÀN TẤT THẨM ĐỊNH & BÀN GIAO VẬN CHUYỂN! Đơn ${selectedOrderForShipment.id} chuyển sang Vận chuyển Nanuk (${trackingCodeInput.trim()}).`
    );
  };

  // Đánh dấu đã giao thành công (DELIVERED) -> Kích hoạt 72h đối kiểm
  const handleMarkDelivered = async (orderId: string) => {
    const target = orders.find((o) => o.id === orderId);
    if (target?._dbId) {
      try {
        await updateThriftOrderStatusApi(target._dbId, { status: 'DELIVERED' });
      } catch (err) {
        console.warn('Lỗi cập nhật DELIVERED server:', err);
      }
    }
    const updated = orders.map((o) => (o.id === orderId ? { ...o, status: 'DELIVERED' as ThriftOrderStatus } : o));
    setOrders(updated);
    try {
      localStorage.setItem(SHOP_THRIFT_ORDERS_STORAGE_KEY, JSON.stringify(updated));
      const cleanOrderId = orderId.replace('#', '');
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key === 'user_thrift_orders' || key.startsWith('user_thrift_orders_'))) {
          const raw = localStorage.getItem(key);
          if (raw) {
            const list: ThriftOrderApi[] = JSON.parse(raw);
            let hasChanged = false;
            const updatedUserList = list.map((uo) => {
              const uCode = (uo.orderCode || uo._id || '').replace('#', '');
              if (uCode === cleanOrderId || uo._id === cleanOrderId) {
                hasChanged = true;
                return { ...uo, status: 'DELIVERED' as const };
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
    } catch {
      // ignore
    }
    showToast(`Đơn ${orderId} đã giao tới khách! Đang chờ khách xác nhận đã nhận hàng để giải ngân.`);
  };

  // Hoàn tất đơn hàng & Quyết toán Escrow (COMPLETED)
  const handleMarkCompleted = async (orderId: string) => {
    const target = orders.find((o) => o.id === orderId);
    if (target?._dbId) {
      try {
        await updateThriftOrderStatusApi(target._dbId, { status: 'COMPLETED' });
      } catch (err) {
        console.warn('Lỗi cập nhật COMPLETED server:', err);
      }
    }
    const updated = orders.map((o) => (o.id === orderId ? { ...o, status: 'COMPLETED' as ThriftOrderStatus } : o));
    setOrders(updated);
    try {
      localStorage.setItem(SHOP_THRIFT_ORDERS_STORAGE_KEY, JSON.stringify(updated));
      const cleanOrderId = orderId.replace('#', '');
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key === 'user_thrift_orders' || key.startsWith('user_thrift_orders_'))) {
          const raw = localStorage.getItem(key);
          if (raw) {
            const list: ThriftOrderApi[] = JSON.parse(raw);
            let hasChanged = false;
            const updatedUserList = list.map((uo) => {
              const uCode = (uo.orderCode || uo._id || '').replace('#', '');
              if (uCode === cleanOrderId || uo._id === cleanOrderId) {
                hasChanged = true;
                return { ...uo, status: 'COMPLETED' as const };
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
    } catch {
      // ignore
    }
    showToast(`Đã giải ngân thành công tiền bán đơn ${orderId} về ví xưởng Atelier! Đơn hàng hoàn tất.`);
  };

  // Copy mã vận đơn vào clipboard
  const handleCopyTracking = (code: string) => {
    navigator.clipboard.writeText(code);
    showToast(`Đã sao chép mã vận đơn: ${code}`);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // Lọc dữ liệu & Sắp xếp đơn mua mới nhất lên đầu
  const filteredOrders = orders
    .filter((order) => {
      if (activeFilter !== 'ALL' && order.status !== activeFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchId = order.id.toLowerCase().includes(q);
        const matchBuyer = order.buyer.name.toLowerCase().includes(q);
        const matchPhone = order.buyer.phone.toLowerCase().includes(q);
        const matchTracking = order.shippingInfo?.trackingCode.toLowerCase().includes(q);
        const matchItem = order.listings.some(
          (it) =>
            it.title.toLowerCase().includes(q) ||
            it.serialNumber.toLowerCase().includes(q)
        );
        return matchId || matchBuyer || matchPhone || matchTracking || matchItem;
      }
      return true;
    })
    .sort((a, b) => getOrderTimestamp(b) - getOrderTimestamp(a));

  // Tính toán số lượng theo 4 bước luồng THRIFT
  const countAll = orders.length;
  const countPaid = orders.filter((o) => o.status === 'PAID').length;
  const countShipped = orders.filter((o) => o.status === 'SHIPPED').length;
  const countDelivered = orders.filter((o) => o.status === 'DELIVERED').length;
  const countCompleted = orders.filter((o) => o.status === 'COMPLETED').length;

  const totalPendingEscrow = orders
    .filter((o) => o.status === 'PAID' || o.status === 'SHIPPED' || o.status === 'DELIVERED')
    .reduce((sum, o) => sum + o.pricing.totalAmount, 0);

  return (
    <div className="w-full flex flex-col font-sans text-on-surface bg-surface min-h-screen antialiased">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-[#141310] text-[#fdf9f2] px-5 py-3.5 rounded-lg shadow-2xl flex items-center gap-3 border border-secondary/40 animate-fade-in max-w-md">
          <span className="material-symbols-outlined text-secondary text-[22px] shrink-0">
            check_circle
          </span>
          <span className="text-xs font-medium leading-snug flex-1">{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="text-on-surface-variant hover:text-white"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      )}

      {/* Main Container */}
      <main className="max-w-[1536px] mx-auto px-4 lg:px-8 py-8 w-full flex flex-col gap-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-on-surface-variant">
          <Link to="/shop/dashboard" className="hover:text-primary transition-colors">
            Bảng điều khiển xưởng
          </Link>
          <span className="text-outline-variant">/</span>
          <span>Quản lý Bán lại THRIFT</span>
          <span className="text-outline-variant">/</span>
          <span className="text-primary font-semibold">Sổ Lệnh Đơn Bán THRIFT Quần Áo Di Sản</span>
        </div>

        {/* Header & Controls */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-2 border-b border-[#dddad3]">
          <div className="max-w-3xl">
            <h1 className="font-serif text-3xl lg:text-4xl text-on-surface tracking-tight">
              Sổ Lệnh Đơn Bán THRIFT Thời Trang
              <span className="font-sans text-xs font-normal text-outline ml-3">
                [Atelier Fashion &amp; Garments Vault]
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-on-surface-variant mt-1.5 leading-relaxed">
              Theo dõi chu trình tuần hoàn trang phục độc bản: Từ{' '}
              <strong className="text-primary">Atelier Thẩm Định</strong> &rarr;{' '}
              <strong className="text-primary">Vận Chuyển Nanuk</strong> &rarr;{' '}
              <strong className="text-primary">Đã Giao &amp; 72h Đối Kiểm</strong> &rarr;{' '}
              <strong className="text-primary">Giải Ngân Escrow</strong> vào số dư ví của Shop Owner.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {loading && (
              <span className="text-xs text-primary flex items-center gap-1 font-medium mr-2">
                <span className="material-symbols-outlined text-[15px] animate-spin">progress_activity</span>
                <span>Đồng bộ Database...</span>
              </span>
            )}
            <button
              onClick={loadOrders}
              className="px-3 py-2 rounded bg-surface border border-outline-variant text-on-surface-variant hover:bg-surface-container transition-colors text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer"
              title="Làm mới dữ liệu đơn bán từ MongoDB"
            >
              <span className="material-symbols-outlined text-[16px]">sync</span>
              Làm mới database
            </button>
            <Link
              to="/shop/thrift/listings"
              className="px-4 py-2 bg-primary text-on-primary hover:bg-primary-container transition-colors text-xs uppercase tracking-wider font-semibold rounded flex items-center gap-1.5 shadow-sm"
            >
              <span className="material-symbols-outlined text-[16px]">styler</span>
              Mục Đăng Quần Áo THRIFT
            </Link>
          </div>
        </div>

        {/* Quick Metrics Summary Bar (4 Bước Nghiệp Vụ) */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          {/* Metric 1: Tất Cả */}
          <div
            onClick={() => setActiveFilter('ALL')}
            className={`p-4 rounded-xl flex flex-col justify-between shadow-xs transition-all cursor-pointer border ${
              activeFilter === 'ALL'
                ? 'bg-primary text-on-primary border-primary'
                : 'bg-surface-container border-outline-variant/30 hover:bg-surface-container-high'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] uppercase tracking-wider font-bold">Tất Cả Đơn</span>
              <span className="material-symbols-outlined text-[18px]">all_inclusive</span>
            </div>
            <div className="font-serif text-3xl font-semibold">{countAll}</div>
            <div className="text-[11px] opacity-80 mt-1">Sổ lệnh quần áo di sản</div>
          </div>

          {/* Metric 2: Bước 1 - Atelier Thẩm định */}
          <div
            onClick={() => setActiveFilter('PAID')}
            className={`p-4 rounded-xl flex flex-col justify-between shadow-xs transition-all cursor-pointer border ${
              activeFilter === 'PAID'
                ? 'bg-amber-600 text-white border-amber-600'
                : 'bg-surface-container border-outline-variant/30 hover:bg-surface-container-high'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] uppercase tracking-wider font-bold text-amber-700">
                1. Atelier Thẩm Định
              </span>
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
            </div>
            <div className="font-serif text-3xl font-semibold text-amber-900">{countPaid}</div>
            <div className="text-[11px] text-amber-800 mt-1">Kiểm định &amp; Niêm phong sáp</div>
          </div>

          {/* Metric 3: Bước 2 - Vận chuyển Nanuk */}
          <div
            onClick={() => setActiveFilter('SHIPPED')}
            className={`p-4 rounded-xl flex flex-col justify-between shadow-xs transition-all cursor-pointer border ${
              activeFilter === 'SHIPPED'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-surface-container border-outline-variant/30 hover:bg-surface-container-high'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] uppercase tracking-wider font-bold text-blue-700">
                2. Vận Chuyển Nanuk
              </span>
              <span className="material-symbols-outlined text-[18px] text-blue-600">local_shipping</span>
            </div>
            <div className="font-serif text-3xl font-semibold text-blue-900">{countShipped}</div>
            <div className="text-[11px] text-blue-800 mt-1">Vali chuyên dụng bọc chì</div>
          </div>

          {/* Metric 4: Bước 3 - Đã giao & Đối kiểm */}
          <div
            onClick={() => setActiveFilter('DELIVERED')}
            className={`p-4 rounded-xl flex flex-col justify-between shadow-xs transition-all cursor-pointer border ${
              activeFilter === 'DELIVERED'
                ? 'bg-secondary text-white border-secondary'
                : 'bg-surface-container border-outline-variant/30 hover:bg-surface-container-high'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] uppercase tracking-wider font-bold text-secondary">
                3. Đã Giao &amp; Đối Kiểm
              </span>
              <span className="material-symbols-outlined text-[18px] text-secondary">hourglass_top</span>
            </div>
            <div className="font-serif text-3xl font-semibold text-secondary">{countDelivered}</div>
            <div className="text-[11px] text-secondary mt-1">Cửa sổ 72h khách thử đồ</div>
          </div>

          {/* Metric 5: Bước 4 - Giải ngân Escrow */}
          <div
            onClick={() => setActiveFilter('COMPLETED')}
            className={`p-4 rounded-xl flex flex-col justify-between shadow-xs transition-all cursor-pointer border ${
              activeFilter === 'COMPLETED'
                ? 'bg-primary text-on-primary border-primary'
                : 'bg-surface-container border-outline-variant/30 hover:bg-surface-container-high'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] uppercase tracking-wider font-bold">4. Giải Ngân Escrow</span>
              <span className="material-symbols-outlined text-[18px]">verified</span>
            </div>
            <div className="font-serif text-3xl font-semibold">{countCompleted}</div>
            <div className="text-[11px] text-on-surface-variant mt-1">Đã tất toán về ví Shop</div>
          </div>

          {/* Metric 6: Tổng Escrow */}
          <div className="bg-surface-container-highest p-4 rounded-xl flex flex-col justify-between shadow-xs border border-outline-variant/40">
            <div className="flex items-center justify-between text-on-surface mb-1">
              <span className="text-[11px] uppercase tracking-wider font-bold text-secondary">
                Smart Escrow Đang Khóa
              </span>
              <span className="material-symbols-outlined text-[18px] text-secondary">lock</span>
            </div>
            <div className="font-serif text-xl font-bold text-primary font-mono truncate">
              {totalPendingEscrow.toLocaleString('vi-VN')} ₫
            </div>
            <div className="text-[10px] text-secondary font-semibold mt-1">Bảo đảm tự động 100%</div>
          </div>
        </div>

        {/* Status Filters Bar & Search */}
        <div className="bg-surface-container-low p-2.5 rounded-xl border border-outline-variant/40 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Segmented Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 text-xs font-semibold">
            <button
              onClick={() => setActiveFilter('ALL')}
              className={`px-3 py-1.5 rounded transition-colors whitespace-nowrap cursor-pointer ${
                activeFilter === 'ALL'
                  ? 'bg-primary text-on-primary shadow-xs'
                  : 'bg-surface text-on-surface-variant hover:bg-surface-container'
              }`}
            >
              Tất Cả ({countAll})
            </button>
            <button
              onClick={() => setActiveFilter('PAID')}
              className={`px-3 py-1.5 rounded transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                activeFilter === 'PAID'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-surface text-on-surface-variant hover:bg-surface-container'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              1. Atelier Thẩm định ({countPaid})
            </button>
            <button
              onClick={() => setActiveFilter('SHIPPED')}
              className={`px-3 py-1.5 rounded transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                activeFilter === 'SHIPPED'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-surface text-on-surface-variant hover:bg-surface-container'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-blue-300"></span>
              2. Vận chuyển Nanuk ({countShipped})
            </button>
            <button
              onClick={() => setActiveFilter('DELIVERED')}
              className={`px-3 py-1.5 rounded transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                activeFilter === 'DELIVERED'
                  ? 'bg-secondary text-white shadow-xs'
                  : 'bg-surface text-on-surface-variant hover:bg-surface-container'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-300"></span>
              3. Đã giao hàng ({countDelivered})
            </button>
            <button
              onClick={() => setActiveFilter('COMPLETED')}
              className={`px-3 py-1.5 rounded transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                activeFilter === 'COMPLETED'
                  ? 'bg-primary text-on-primary shadow-xs'
                  : 'bg-surface text-on-surface-variant hover:bg-surface-container'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-green-400"></span>
              4. Giải ngân Escrow ({countCompleted})
            </button>
          </div>

          {/* Search Input */}
          <div className="relative min-w-[280px]">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo Mã đơn, Khách, Trang phục, Vận đơn..."
              className="w-full pl-9 pr-3 py-1.5 bg-surface text-xs text-on-surface rounded border border-outline-variant/60 focus:outline-none focus:ring-1 focus:ring-primary shadow-xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface cursor-pointer"
              >
                <span className="material-symbols-outlined text-[14px]">close</span>
              </button>
            )}
          </div>
        </div>

        {/* Multi-Item Orders Stream */}
        <div className="flex flex-col gap-5">
          {filteredOrders.map((order) => {
            const isPaid = order.status === 'PAID';
            const isShipped = order.status === 'SHIPPED';
            const isDelivered = order.status === 'DELIVERED';
            const isCompleted = order.status === 'COMPLETED';

            return (
              <article
                key={order.id}
                className="w-full bg-surface-container-low rounded-xl p-5 lg:p-6 shadow-sm border border-outline-variant/40 hover:border-outline-variant transition-all flex flex-col gap-4"
              >
                {/* 1. Order Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-outline-variant/30">
                  <div className="flex flex-wrap items-center gap-3">
                    <Link
                      to={`/shop/thrift/orders/${encodeURIComponent(order.id.replace('#', ''))}`}
                      className="font-title-md text-base font-bold text-primary hover:text-on-surface font-mono tracking-tight hover:underline flex items-center gap-1 group"
                      title="Mở sổ lệnh chi tiết"
                    >
                      <span>{order.id}</span>
                      <span className="material-symbols-outlined text-[15px] text-outline group-hover:text-primary transition-colors">
                        open_in_new
                      </span>
                    </Link>

                    {/* Status Badge theo 4 bước nghiệp vụ THRIFT */}
                    {isPaid && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-100 text-amber-900 rounded font-label-sm text-[11px] uppercase tracking-wider font-bold">
                        <span className="w-2 h-2 rounded-full bg-amber-600 animate-ping"></span>
                        1. ATELIER THẨM ĐỊNH &amp; NIÊM PHONG SÁP
                      </span>
                    )}
                    {isShipped && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-100 text-blue-900 rounded font-label-sm text-[11px] uppercase tracking-wider font-bold">
                        <span className="material-symbols-outlined text-[14px]">local_shipping</span>
                        2. VẬN CHUYỂN NANUK CHUYÊN TRÁCH
                      </span>
                    )}
                    {isDelivered && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-100 text-emerald-950 rounded font-label-sm text-[11px] uppercase tracking-wider font-bold">
                        <span className="material-symbols-outlined text-[14px]">assignment_turned_in</span>
                        3. ĐÃ GIAO ĐÍCH · 72H ĐỐI KIỂM ĐỘC LẬP
                      </span>
                    )}
                    {isCompleted && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-surface-container text-outline rounded font-label-sm text-[11px] uppercase tracking-wider font-bold">
                        <span className="material-symbols-outlined text-[14px] text-secondary">
                          verified
                        </span>
                        4. GIẢI NGÂN ESCROW 100% · HOÀN TẤT
                      </span>
                    )}

                    <span className="text-on-surface-variant text-xs">
                      Tạo lúc: {order.createdAt}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs uppercase tracking-wider text-on-surface-variant font-medium">
                      {isPaid
                        ? 'Bước 1/4: Thẩm định sợi vải & niêm phong sáp'
                        : isShipped
                        ? 'Bước 2/4: Đang vận chuyển vali Nanuk'
                        : isDelivered
                        ? (order.buyerConfirmed ? 'Bước 3/4: Khách đã nhận hàng · Chờ giải ngân' : 'Bước 3/4: Đã giao hàng tới khách')
                        : 'Bước 4/4: Đã giải ngân ví Shop'}
                    </span>
                    <span className="text-outline-variant hidden sm:inline">·</span>
                    <Link
                      to={`/shop/thrift/orders/${encodeURIComponent(order.id.replace('#', ''))}`}
                      className="inline-flex items-center gap-1 text-xs text-primary font-semibold hover:underline"
                    >
                      <span>Hồ sơ lưu trữ &amp; Chi tiết</span>
                      <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                    </Link>
                  </div>
                </div>

                {/* 2. Main Order Grid (3 Columns) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                  {/* Column 1: Buyer Dossier (3 Cols) */}
                  <div className="lg:col-span-3 bg-surface-container p-4 rounded-lg flex flex-col justify-between border border-outline-variant/30">
                    <div>
                      <div className="text-[10px] uppercase font-bold tracking-wider text-outline mb-2">
                        Người Mua / Điểm Tiếp Nhận Trang Phục
                      </div>
                      <div className="flex items-center gap-3 mb-2.5">
                        <div className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center font-serif text-sm font-bold shrink-0">
                          {order.buyer.name
                            .split(' ')
                            .map((w) => w[0])
                            .slice(-2)
                            .join('')}
                        </div>
                        <div>
                          <h4 className="font-semibold text-xs text-on-surface leading-tight">
                            {order.buyer.name}
                          </h4>
                          <div className="text-[11px] text-on-surface-variant font-mono">
                            {order.buyer.phone}
                          </div>
                        </div>
                      </div>

                      {order.buyer.kycTier && (
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-secondary-fixed/50 text-on-secondary-fixed-variant rounded text-[10px] uppercase tracking-wider mb-2 font-semibold">
                          <span className="material-symbols-outlined text-[13px] text-secondary">
                            verified
                          </span>
                          {order.buyer.kycTier}
                        </div>
                      )}

                      <p className="text-xs text-on-surface-variant leading-relaxed mt-1">
                        <span className="font-medium text-on-surface block">Địa chỉ nhận hàng:</span>
                        {order.buyer.shippingAddress}
                      </p>
                    </div>

                    <div className="pt-2.5 mt-3 border-t border-outline-variant/30 flex items-center justify-between text-[11px] text-on-surface-variant">
                      <span>Bảo chứng Smart Escrow:</span>
                      <span className="font-bold text-secondary">Niêm phong 100%</span>
                    </div>
                  </div>

                  {/* Column 2: Multi-Item Listing Stack (5 Cols) - Quần áo di sản */}
                  <div className="lg:col-span-5 bg-surface p-4 rounded-lg flex flex-col justify-between border border-outline-variant/30">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[11px] uppercase tracking-wider text-outline font-bold">
                          Danh Mục Trang Phục THRIFT ({order.listings.length} Hiện Vật)
                        </span>
                        <span className="text-[10px] text-secondary bg-secondary-fixed/40 px-2 py-0.5 rounded font-semibold">
                          Vali Nanuk Kháng Ẩm
                        </span>
                      </div>

                      {/* Stack of Listings */}
                      <div className="space-y-2.5">
                        {order.listings.map((item, idx) => (
                          <div
                            key={item.id || idx}
                            className="flex items-start gap-3 p-2 bg-surface-container-low rounded border border-outline-variant/20 hover:border-outline-variant transition-colors"
                          >
                            <img
                              src={item.imageUrl}
                              alt={item.title}
                              className="w-14 h-14 object-cover rounded border border-outline-variant/40 shrink-0 bg-surface-container"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).src =
                                  CLOTHING_FALLBACK_IMAGES[idx % CLOTHING_FALLBACK_IMAGES.length];
                              }}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <h5 className="font-semibold text-xs text-on-surface truncate">
                                  {item.title}
                                </h5>
                                <span className="text-xs font-mono font-bold text-primary shrink-0">
                                  {item.price.toLocaleString('vi-VN')} ₫
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-[10px] text-outline mt-0.5 font-mono">
                                <span className="bg-surface px-1 py-0.2 rounded border border-outline-variant/40 text-on-surface-variant">
                                  {item.serialNumber}
                                </span>
                                <span>•</span>
                                <span className="text-secondary font-medium">{item.grade}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-outline-variant/30 flex items-center justify-between text-xs text-on-surface-variant">
                      <span>Hình thức đóng gói:</span>
                      <span className="font-semibold text-on-surface">Vali Nanuk Crate Chống Gãy Nếp</span>
                    </div>
                  </div>

                  {/* Column 3: Financial Ledger & Order-Level Actions */}
                  <div className="lg:col-span-4 bg-surface-container p-4 rounded-lg flex flex-col justify-between border border-outline-variant/30">
                    <div>
                      <div className="text-[10px] uppercase font-bold tracking-wider text-outline mb-2">
                        Bảng Kê Tài Chính &amp; Vận Chuyển Nanuk
                      </div>

                      <div className="space-y-1.5 text-xs pb-3">
                        <div className="flex justify-between text-on-surface-variant">
                          <span>Tổng tiền sản phẩm ({order.listings.length} món):</span>
                          <span className="font-mono text-on-surface">
                            {order.pricing.subtotal.toLocaleString('vi-VN')} ₫
                          </span>
                        </div>
                        <div className="flex justify-between text-on-surface-variant">
                          <span>Phí vận chuyển chuyên dụng:</span>
                          <span className="font-mono text-on-surface">
                            {order.pricing.shippingFee.toLocaleString('vi-VN')} ₫
                          </span>
                        </div>
                        <div className="pt-2 mt-1 bg-surface px-2.5 py-1.5 rounded border border-outline-variant/40 flex justify-between items-baseline">
                          <span className="text-xs uppercase tracking-wider font-bold text-on-surface">
                            Tổng Tiền Thanh Toán:
                          </span>
                          <span className="font-serif text-base font-bold text-primary font-mono">
                            {order.pricing.totalAmount.toLocaleString('vi-VN')} ₫
                          </span>
                        </div>
                      </div>

                      {/* Display Shipping Info if available */}
                      {order.shippingInfo?.trackingCode ? (
                        <div className="p-2.5 bg-surface rounded border border-outline-variant/40 space-y-1 mt-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-on-surface-variant">Đơn vị vận chuyển:</span>
                            <span className="font-bold text-on-surface">
                              {order.shippingInfo.carrier}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-on-surface-variant">Mã vận đơn Nanuk:</span>
                            <div className="flex items-center gap-1 font-mono font-bold text-primary">
                              <span>{order.shippingInfo.trackingCode}</span>
                              <button
                                type="button"
                                onClick={() => handleCopyTracking(order.shippingInfo!.trackingCode)}
                                className="p-0.5 hover:text-secondary cursor-pointer"
                                title="Sao chép mã"
                              >
                                <span className="material-symbols-outlined text-[14px]">content_copy</span>
                              </button>
                            </div>
                          </div>
                          {order.shippingInfo.sealCode && (
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-on-surface-variant">Tem niêm phong sáp:</span>
                              <span className="font-mono text-xs font-semibold text-secondary">
                                {order.shippingInfo.sealCode}
                              </span>
                            </div>
                          )}
                          {order.shippingInfo.dispatchedAt && (
                            <div className="text-[10px] text-on-surface-variant">
                              Thời gian gửi: {order.shippingInfo.dispatchedAt}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="p-2 bg-amber-50 rounded border border-amber-200 text-amber-900 text-[11px] flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[16px] text-amber-600">
                            info
                          </span>
                          <span>Đã thanh toán Escrow. Chờ Atelier thẩm định chất vải &amp; bàn giao Nanuk.</span>
                        </div>
                      )}
                    </div>

                    {/* Order-Level Action Buttons theo 4 bước */}
                    <div className="pt-4 flex flex-col gap-2">
                      {isPaid && (
                        <button
                          type="button"
                          onClick={() => handleOpenShipmentModal(order)}
                          className="w-full py-2.5 px-4 bg-primary text-on-primary hover:bg-primary-container transition-colors text-xs font-semibold uppercase tracking-wider rounded flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[18px]">verified</span>
                          <span>Xác Nhận Thẩm Định &amp; Gửi Vận Chuyển Nanuk</span>
                        </button>
                      )}

                      {isShipped && (
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleOpenShipmentModal(order)}
                              className="flex-1 py-1.5 px-3 bg-surface hover:bg-surface-container text-on-surface text-xs font-semibold rounded border border-outline-variant/60 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-[15px]">edit</span>
                              Sửa Vận Đơn
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCopyTracking(order.shippingInfo?.trackingCode || '')}
                              className="flex-1 py-1.5 px-3 bg-surface hover:bg-surface-container text-on-surface text-xs font-semibold rounded border border-outline-variant/60 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-[15px]">content_copy</span>
                              Copy Mã
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleMarkDelivered(order.id)}
                            className="w-full py-2 px-3 bg-secondary text-white hover:bg-secondary/90 text-xs font-semibold uppercase tracking-wider rounded flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[16px]">done_all</span>
                            Xác Nhận Đã Giao Hàng Cho Khách
                          </button>
                        </div>
                      )}

                      {/* Khi khách ĐÃ bấm nhận hàng: Mở ngay nút Giải Ngân Tiền Về Ví! */}
                      {!isCompleted && order.buyerConfirmed && (
                        <div className="flex flex-col gap-2">
                          <div className="p-2.5 bg-emerald-50 rounded border border-emerald-300 text-xs text-emerald-950 flex items-center gap-2">
                            <span className="material-symbols-outlined text-[20px] text-emerald-600">verified</span>
                            <div>
                              <p className="font-bold text-emerald-900">Khách hàng đã nhận được hàng!</p>
                              <p className="text-[11px] text-emerald-700">Khách đã xác nhận nhận kiện hàng thành công. Bạn có thể giải ngân tiền về ví ngay.</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleMarkCompleted(order.id)}
                            className="w-full py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold uppercase tracking-wider rounded flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer hover:shadow-lg"
                          >
                            <span className="material-symbols-outlined text-[18px]">account_balance_wallet</span>
                            <span>Giải Ngân Tiền Về Ví ({order.pricing.subtotal ? order.pricing.subtotal.toLocaleString('vi-VN') + '₫' : ''})</span>
                          </button>
                        </div>
                      )}

                      {/* Khi đã giao hàng nhưng khách CHƯA bấm nhận hàng: Hiện thông báo chờ khách nhận */}
                      {!isCompleted && !order.buyerConfirmed && isDelivered && (
                        <div className="p-2.5 bg-blue-50/80 rounded border border-blue-200/80 text-xs text-blue-950 flex items-center gap-2">
                          <span className="material-symbols-outlined text-[18px] text-blue-600 animate-pulse">local_shipping</span>
                          <div>
                            <p className="font-bold text-blue-900">Đã giao hàng · Chờ khách nhận hàng</p>
                            <p className="text-[11px] text-blue-800/80">Kiện hàng đã tới người mua. Nút giải ngân sẽ mở ngay khi khách bấm Đã nhận hàng.</p>
                          </div>
                        </div>
                      )}

                      {isCompleted && (
                        <div className="p-2 bg-surface rounded border border-outline-variant/40 text-center text-xs text-secondary font-semibold flex items-center justify-center gap-1">
                          <span className="material-symbols-outlined text-[16px]">task_alt</span>
                          Đã giải ngân 100% về ví xưởng Atelier
                        </div>
                      )}

                      <Link
                        to={`/shop/thrift/orders/${encodeURIComponent(order.id.replace('#', ''))}`}
                        className="w-full py-2 px-3 bg-surface hover:bg-surface-container text-on-surface text-xs font-semibold rounded border border-outline-variant/60 transition-colors flex items-center justify-center gap-1.5 text-center"
                      >
                        <span className="material-symbols-outlined text-[16px] text-primary">receipt_long</span>
                        <span>Hồ Sơ Lưu Trữ &amp; Chi Tiết Đơn</span>
                      </Link>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}

          {filteredOrders.length === 0 && (
            <div className="p-12 text-center bg-surface-container-low rounded-xl border border-outline-variant/40 text-on-surface-variant flex flex-col items-center justify-center gap-2">
              <span className="material-symbols-outlined text-4xl text-outline">styler</span>
              <p className="text-sm font-semibold">Không tìm thấy đơn bán THRIFT nào phù hợp với bộ lọc.</p>
              <button
                onClick={() => {
                  setActiveFilter('ALL');
                  setSearchQuery('');
                }}
                className="text-xs text-primary font-semibold underline mt-1 cursor-pointer"
              >
                Xóa bộ lọc
              </button>
            </div>
          )}
        </div>

        {/* Circular Protocol Banner */}
        <section className="bg-surface-container p-4 lg:p-5 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-xs border border-outline-variant/40">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-full bg-secondary-fixed text-on-secondary-fixed flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[22px]">gavel</span>
            </div>
            <div>
              <h4 className="font-semibold text-xs sm:text-sm text-on-surface mb-0.5">
                Quy Định Vận Chuyển Độc Bản THRIFT (Secure Apparel Crate Protocol)
              </h4>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Toàn bộ trang phục bán đứt THRIFT đều được khử trùng Ozone, giữ phẳng phom dáng và đóng gói trong vali Nanuk Crate bọc chì kháng ẩm. Mã vận đơn lưu ký cấp Order bảo chứng tự động giải ngân Smart Escrow sau khi kết thúc 72 giờ đối kiểm độc lập.
              </p>
            </div>
          </div>
          <Link
            to="/shop/thrift/listings"
            className="text-xs font-semibold text-primary uppercase tracking-wider hover:underline flex items-center gap-1 shrink-0"
          >
            Quản lý kho trang phục
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </Link>
        </section>
      </main>

      {/* SHIPMENT MODAL (Modal Xác Nhận Thẩm Định & Vận Chuyển Nanuk) */}
      {selectedOrderForShipment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-surface rounded-xl shadow-2xl max-w-xl w-full border border-outline-variant overflow-hidden">
            {/* Modal Header */}
            <div className="bg-surface-container-high px-6 py-4 flex items-center justify-between border-b border-outline-variant">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[22px]">
                  local_shipping
                </span>
                <span className="font-serif text-base font-bold text-on-surface">
                  Xác Nhận Thẩm Định &amp; Bàn Giao Vận Chuyển Nanuk
                </span>
              </div>
              <button
                type="button"
                onClick={handleCloseShipmentModal}
                className="p-1 rounded hover:bg-surface-container text-on-surface-variant cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleConfirmShipment} className="p-6 flex flex-col gap-4 text-xs">
              {/* Order Context Summary */}
              <div className="p-3 bg-surface-container-low rounded-lg border border-outline-variant/40 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-primary font-mono text-xs">
                    {selectedOrderForShipment.id}
                  </span>
                  <span className="text-[11px] text-secondary font-semibold">
                    {selectedOrderForShipment.listings.length} Trang phục độc bản
                  </span>
                </div>
                <div className="text-[11px] text-on-surface">
                  <strong>Người nhận:</strong> {selectedOrderForShipment.buyer.name} (
                  {selectedOrderForShipment.buyer.phone})
                </div>
                <div className="text-[11px] text-on-surface-variant leading-snug">
                  <strong>Địa chỉ:</strong> {selectedOrderForShipment.buyer.shippingAddress}
                </div>
                <div className="text-[11px] text-on-surface font-semibold pt-1 border-t border-outline-variant/20 flex justify-between">
                  <span>Tổng tiền thanh toán:</span>
                  <span className="font-mono text-primary font-bold">
                    {selectedOrderForShipment.pricing.totalAmount.toLocaleString('vi-VN')} ₫
                  </span>
                </div>
              </div>

              {/* Input 1: Carrier */}
              <div className="flex flex-col gap-1">
                <label className="font-semibold text-on-surface">
                  1. Đơn vị vận chuyển (Carrier):
                </label>
                <select
                  value={carrierInput}
                  onChange={(e) => setCarrierInput(e.target.value)}
                  className="w-full px-3 py-2 bg-surface text-xs text-on-surface rounded border border-outline-variant focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                >
                  <option value="Viettel Post Chuyên Dụng Nanuk">
                    Viettel Post Chuyên Dụng Nanuk (Vali Bọc Chì &amp; Khung Chống Ẩm)
                  </option>
                  <option value="EMS Bưu Điện Việt Nam">
                    EMS Bưu Điện Việt Nam (White-Glove Di Sản Thời Trang)
                  </option>
                  <option value="Giao Hàng Tiết Kiệm (GHTK)">
                    Giao Hàng Tiết Kiệm (GHTK) - Hàng Thời Trang Giá Trị Cao
                  </option>
                  <option value="Hỏa Tốc Nội Thành Nanuk Courier">
                    Hỏa Tốc Nội Thành Nanuk Courier (Giao trong 2h)
                  </option>
                  <option value="Chuyển Phát Nhanh DHL Express">
                    Chuyển Phát Nhanh DHL Express (Kiểm Soát Độ Ẩm &amp; Chống Gãy Nếp)
                  </option>
                </select>
              </div>

              {/* Input 2: Tracking Code */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-on-surface">
                    2. Mã vận đơn Nanuk (Tracking Number) <span className="text-error">*</span>:
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setTrackingCodeInput(`NNK-${Math.floor(100000 + Math.random() * 900000)}-VN`)
                    }
                    className="text-[10px] text-secondary font-semibold hover:underline cursor-pointer"
                  >
                    Tạo mã ngẫu nhiên
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={trackingCodeInput}
                  onChange={(e) => setTrackingCodeInput(e.target.value)}
                  placeholder="Ví dụ: NNK-884920-VN"
                  className="w-full px-3 py-2 bg-surface text-xs text-on-surface font-mono font-bold rounded border border-outline-variant focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              {/* Input 3: Seal Code */}
              <div className="flex flex-col gap-1">
                <label className="font-semibold text-on-surface">
                  3. Số hiệu Tem niêm phong sáp yếm khí (Wax Seal Code):
                </label>
                <input
                  type="text"
                  value={sealCodeInput}
                  onChange={(e) => setSealCodeInput(e.target.value)}
                  placeholder="Ví dụ: #SEAL-ATELIER-8820"
                  className="w-full px-3 py-2 bg-surface text-xs text-on-surface font-mono font-semibold rounded border border-outline-variant focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              {/* Input 4: Notes */}
              <div className="flex flex-col gap-1">
                <label className="font-semibold text-on-surface">
                  4. Biên bản kiểm định &amp; Đóng gói vali:
                </label>
                <textarea
                  rows={2}
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  placeholder="Ghi chú thẩm định sợi vải, khử trùng buồng ozone, đệm form áo..."
                  className="w-full p-2.5 bg-surface text-xs text-on-surface rounded border border-outline-variant focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              {/* Notice */}
              <div className="p-2.5 bg-secondary-fixed/20 rounded text-[11px] text-on-surface-variant flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] text-secondary shrink-0">
                  security
                </span>
                <span>
                  Thông tin vận đơn được lưu 1 lần cho toàn bộ đơn hàng và đồng bộ ngay sang tài khoản người mua.
                </span>
              </div>

              {/* Actions */}
              <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-outline-variant/40">
                <button
                  type="button"
                  onClick={handleCloseShipmentModal}
                  className="px-4 py-2 rounded text-xs text-on-surface-variant hover:bg-surface-container font-semibold transition-colors cursor-pointer"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingShipment}
                  className="px-5 py-2 rounded text-xs font-semibold uppercase tracking-wider bg-primary text-on-primary hover:bg-primary-container shadow transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingShipment ? (
                    <>
                      <span className="inline-block animate-spin material-symbols-outlined text-[14px]">
                        progress_activity
                      </span>
                      <span>Đang Lưu Vận Đơn...</span>
                    </>
                  ) : (
                    <>
                      <span>Xác Nhận &amp; Bàn Giao Vận Chuyển Nanuk</span>
                      <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShopThriftOrders;
