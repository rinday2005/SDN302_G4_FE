import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { UserSidebar } from '../../../components/layout/UserSidebar';
import {
  getMyThriftOrdersApi,
  cancelThriftOrderApi,
  confirmDeliveredThriftOrderApi,
  type ThriftOrderApi,
  type ThriftOrderItemApi,
  type ThriftShippingAddressApi,
} from '../../../services/thriftOrder.api';
import { redirectToVnPayGateway } from '../../../services/payment.api';
import { OrdersListSkeleton } from '../../../components/common/Skeleton';
import { EmptyState } from '../../../components/common/EmptyState';
import { useToast } from '../../../context/ToastContext';

export interface ThriftOrderRecord {
  id: string;
  orderCode: string;
  createdAt: string;
  status: 'PENDING_PAYMENT' | 'PAID' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'COMPLETED' | 'CANCELLED' | 'DISPUTED';
  statusText: string;
  statusBg: string;
  dotBg: string;
  statusDescription: string;
  items: Array<{
    id: string;
    productName: string;
    price: number;
    quantity: number;
    imageUrl: string;
    condition: string;
    vaultOrigin: string;
    warranty: string;
  }>;
  itemsSubtotal: number;
  shippingFee: number;
  totalAmount: number;
  trackingCode: string;
  courierName: string;
  escrowStatus: string;
  escrowExpiresAt?: string | null;
  provenanceVaultCertId: string;
  buyerConfirmed?: boolean;
  buyerConfirmedAt?: string;
  shippingAddress: {
    recipientName: string;
    recipientPhone: string;
    fullAddress: string;
  };
  cancelReason?: string;
  timeline?: Array<{
    status: string;
    title: string;
    description: string;
    timestamp: string;
  }>;
}

export const MyThriftOrders: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();

  // Scroll to top
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Parse payment callback params if coming from VNPay
  const queryParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const paymentSuccessParam = queryParams.get('orderCode') || queryParams.get('vnp_TxnRef');

  // Scoped user profile info
  const userProfileKey = (user?._id || user?.id) ? `user_profile_${user?._id || user?.id}` : '';
  const savedProfile = useMemo(() => {
    if (!userProfileKey) return null;
    try {
      const raw = localStorage.getItem(userProfileKey);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, [userProfileKey]);

  const displayName = savedProfile?.fullName || user?.fullName || 'Khách hàng';

  // Filters & State
  const [activeTab, setActiveTab] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState('Mới nhất trước');
  const [isLoading, setIsLoading] = useState(true);
  const [orders, setOrders] = useState<ThriftOrderRecord[]>([]);
  const toast = useToast();

  // Modals
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);
  const [cancelReasonText, setCancelReasonText] = useState('');
  const [confirmingOrderId, setConfirmingOrderId] = useState<string | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Show Toast Helper
  const showToast = useCallback((msg: string) => {
    toast.success(msg);
  }, [toast]);

  // Format currency
  const formatCurrency = (val: number | string) => {
    const num = Number(val);
    if (isNaN(num)) return String(val);
    return num.toLocaleString('vi-VN') + '₫';
  };

  // Map raw API order to UI ThriftOrderRecord
  const mapOrderToRecord = useCallback((raw: ThriftOrderApi): ThriftOrderRecord => {
    const rawCode = raw.orderCode || 'TRF-2026-9048';
    const displayCode = rawCode.startsWith('#') ? rawCode : `#${rawCode}`;
    const cleanId = String(raw._id || rawCode.replace('#', '')).trim();

    const rawCreated = raw.createdAt ? new Date(raw.createdAt) : new Date();
    const dateStr = !isNaN(rawCreated.getTime()) ? rawCreated.toLocaleDateString('vi-VN') : '12/10/2026';

    // Normalize status across backend and client enum
    const normalizeStatus = (statusStr?: string, paymentStatusStr?: string): ThriftOrderRecord['status'] => {
      const s = (statusStr || '').toUpperCase().trim();
      if (s === 'PREPARING' || s === 'PROCESSING' || s === 'CONFIRMED' || s === 'ATELIER_APPRAISAL') return 'PROCESSING';
      if (s === 'SHIPPING' || s === 'SHIPPED') return 'SHIPPED';
      if (s === 'DELIVERED') return 'DELIVERED';
      if (s === 'COMPLETED') return 'COMPLETED';
      if (s === 'CANCELLED') return 'CANCELLED';
      if (s === 'DISPUTED') return 'DISPUTED';
      if (s === 'PAID') return 'PAID';
      if (paymentStatusStr === 'PAID') return 'PAID';
      return 'PENDING_PAYMENT';
    };

    const rawStatus = normalizeStatus(raw.status, raw.paymentStatus);

    let statusText = 'CHỜ THANH TOÁN (15 PHÚT)';
    let statusBg = 'bg-[#FCF5EB] text-[#A6620C] border-[#F2DEBF]';
    let dotBg = 'bg-[#C87A1E] animate-ping';
    let statusDescription = 'Hiện vật đang được giữ chỗ trong 15 phút, chờ hoàn tất thanh toán VNPay';

    if (rawStatus === 'PAID') {
      statusText = 'ĐÃ THANH TOÁN · KÝ QUỸ SMART ESCROW';
      statusBg = 'bg-[#EEF2EC] text-[#37533E] border-[#D5E0D4]';
      dotBg = 'bg-[#4A6B53]';
      statusDescription = 'Tiền thanh toán được bảo toàn tại Smart Escrow, Atelier đang chuẩn bị thẩm định sợi vải';
    } else if (rawStatus === 'PROCESSING') {
      statusText = 'ATELIER THẨM ĐỊNH & NIÊM PHONG SÁP';
      statusBg = 'bg-[#EAF3FA] text-[#245778] border-[#CFE4F3]';
      dotBg = 'bg-[#3B6E8C] animate-pulse';
      statusDescription = 'Atelier đang kiểm định sợi vải, buồng Ozone khử khuẩn 45 phút và dán tem sáp yếm khí';
    } else if (rawStatus === 'SHIPPED') {
      statusText = 'VẬN CHUYỂN NANUK GARMENT CRATE';
      statusBg = 'bg-[#EAF3FA] text-[#245778] border-[#CFE4F3]';
      dotBg = 'bg-[#3B6E8C] animate-pulse';
      statusDescription = 'Bưu tá Nanuk đang vận chuyển kiện chống nhăn, bảo hiểm 100% toàn trình';
    } else if (rawStatus === 'DELIVERED') {
      if (raw.buyerConfirmed) {
        statusText = 'ĐÃ NHẬN HÀNG · CHỜ XƯỞNG GIẢI NGÂN';
        statusBg = 'bg-[#E8F3EE] text-[#1E5638] border-[#B7E0CA]';
        dotBg = 'bg-[#2E7D32]';
        statusDescription = 'Bạn đã nhận hàng thành công. Tiền đang được đối soát để giải ngân cho xưởng Atelier.';
      } else {
        statusText = 'ĐÃ GIAO HÀNG · CHỜ XÁC NHẬN';
        statusBg = 'bg-[#E8F3EE] text-[#1E5638] border-[#B7E0CA]';
        dotBg = 'bg-[#2E7D32] animate-pulse';
        statusDescription = 'Kiện hàng đã được bưu tá giao tới nơi. Quý khách vui lòng kiểm tra và bấm "Đã nhận được hàng" bên dưới để hoàn tất.';
      }
    } else if (rawStatus === 'COMPLETED') {
      statusText = 'SỞ HỮU VĨNH VIỄN · PROVENANCE VAULT™';
      statusBg = 'bg-[#141310] text-[#E7E1DD] border-[#292724]';
      dotBg = 'bg-[#8FBC8F]';
      statusDescription = 'Đã cấp chứng thư số Blockchain Provenance Vault™, chuyển nhượng quyền sở hữu vĩnh viễn';
    } else if (rawStatus === 'CANCELLED') {
      statusText = 'ĐÃ HỦY ĐƠN HÀNG';
      statusBg = 'bg-[#FDF2F2] text-[#9E2A2B] border-[#F8C8C8]';
      dotBg = 'bg-[#BA1A1A]';
      statusDescription = raw.cancelReason ? `Lý do: ${raw.cancelReason}` : 'Đơn hàng đã hủy và hoàn cọc/tiền';
    } else if (rawStatus === 'DISPUTED') {
      statusText = 'TRANH CHẤP / ĐANG ĐỐI SOÁT';
      statusBg = 'bg-[#FFF3E0] text-[#E65100] border-[#FFE0B2]';
      dotBg = 'bg-[#FF9800] animate-bounce';
      statusDescription = 'Yêu cầu kiểm định độc lập đang được xử lý bởi Hội đồng giám định ReUse Hub';
    }

    const items = (raw.items || []).map((it: ThriftOrderItemApi, idx: number) => {
      const listing = typeof it.listingId === 'object' && it.listingId !== null ? it.listingId : (typeof it.productId === 'object' && it.productId ? it.productId : null);
      const rawImages = (listing as { images?: string[] })?.images || it.images;
      const resolvedImg = (Array.isArray(rawImages) && rawImages.length > 0 ? rawImages[0] : '') || it.imageUrl || '/images/clothes2.jpg';
      const resolvedName = it.name || it.productName || it.title || listing?.name || listing?.title || `Hiện vật THRIFT #${idx + 1}`;
      const resolvedPrice = it.price || listing?.price || 0;
      const resolvedCond = it.condition || listing?.condition || 'Grade Mint (98%)';

      return {
        id: String(listing?._id || it.listingId || `item-${idx}`),
        productName: resolvedName,
        price: resolvedPrice,
        quantity: it.quantity || 1,
        imageUrl: resolvedImg,
        condition: resolvedCond,
        vaultOrigin: it.vaultOrigin || (listing?.location ? `Atelier Archive ${listing.location}` : 'Atelier Archive Sài Gòn'),
        warranty: it.warranty || 'Bảo chứng trang phục di sản',
      };
    });

    const addr: Partial<ThriftShippingAddressApi> = raw.shippingAddress || {};
    const fullAddr = [addr.detail, addr.ward, addr.district, addr.province].filter(Boolean).join(', ') ||
      '48 Bạch Đằng, Tầng 4 Archive Suite, Phường Hải Châu 1, Quận Hải Châu, TP. Đà Nẵng, Việt Nam';

    return {
      id: cleanId,
      orderCode: displayCode,
      createdAt: dateStr,
      status: rawStatus,
      statusText,
      statusBg,
      dotBg,
      statusDescription,
      items,
      itemsSubtotal: raw.itemsSubtotal || items.reduce((s, i) => s + i.price * i.quantity, 0),
      shippingFee: raw.shippingFee || 215000,
      totalAmount: raw.totalAmount || 0,
      trackingCode: raw.trackingCode || `WG-${rawCode.replace('#', '')}`,
      courierName: raw.courierName || 'Bưu tá bảo hiểm bọc thép White-Glove Insured Secondhand Courier',
      escrowStatus: raw.escrowStatus || 'PENDING',
      escrowExpiresAt: raw.escrowExpiresAt,
      provenanceVaultCertId: raw.provenanceVaultCertId || `PRV-VAULT-2026-${cleanId.slice(-4).toUpperCase()}`,
      buyerConfirmed: Boolean(raw.buyerConfirmed),
      buyerConfirmedAt: raw.buyerConfirmedAt,
      shippingAddress: {
        recipientName: addr.recipientName || displayName,
        recipientPhone: addr.recipientPhone || user?.phoneNumber || user?.phone || '0908 421 892',
        fullAddress: fullAddr,
      },
      cancelReason: raw.cancelReason,
      timeline: raw.timeline || [],
    };
  }, [displayName, user]);

  // Load Thrift Orders from Backend API (strictly isolated for the current user)
  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      let rawList: ThriftOrderApi[] = [];
      let apiSuccess = false;
      try {
        const res = await getMyThriftOrdersApi();
        rawList = Array.isArray(res) ? res : (res?.orders || []);
        apiSuccess = true;
      } catch (apiErr) {
        console.warn('API getMyThriftOrdersApi warning:', apiErr);
      }

      const uId = user?._id || user?.id;

      // Clean up legacy global and mock data
      try {
        localStorage.removeItem('user_thrift_orders');
        if (uId) {
          const userKey = `user_thrift_orders_${uId}`;
          const raw = localStorage.getItem(userKey);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
              const cleaned = parsed.filter((o: ThriftOrderApi) => {
                const c = (o.orderCode || o._id || '').replace('#', '').trim();
                return c !== 'RH-THF-2024-9108' && !c.includes('9108');
              });
              localStorage.setItem(userKey, JSON.stringify(cleaned));
            }
          }
        }
      } catch {
        // ignore
      }

      // Merge unique by orderCode or _id
      const mergedMap = new Map<string, ThriftOrderApi>();
      rawList.forEach((o) => {
        const code = (o.orderCode || o._id || '').replace('#', '').trim();
        // Never allow mock 9108 in user orders
        if (code && code !== 'RH-THF-2024-9108' && !code.includes('9108')) {
          mergedMap.set(code, o);
        }
      });

      // If API succeeded, we check user local storage ONLY to preserve local buyerConfirmed status
      if (apiSuccess && uId) {
        try {
          const userKey = `user_thrift_orders_${uId}`;
          const raw = localStorage.getItem(userKey);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
              parsed.forEach((lo: ThriftOrderApi) => {
                const code = (lo.orderCode || lo._id || '').replace('#', '').trim();
                if (code && mergedMap.has(code)) {
                  const existing = mergedMap.get(code)!;
                  if (lo.buyerConfirmed && !existing.buyerConfirmed) {
                    existing.buyerConfirmed = true;
                    existing.buyerConfirmedAt = lo.buyerConfirmedAt;
                  }
                  if (lo.status === 'COMPLETED' && existing.status !== 'COMPLETED') {
                    existing.status = 'COMPLETED';
                  }
                }
              });
            }
          }
          // Overwrite user cache with real backend orders
          localStorage.setItem(userKey, JSON.stringify(Array.from(mergedMap.values())));
        } catch {
          // ignore
        }
      } else if (!apiSuccess && uId) {
        // Only if API is completely offline, read from user's isolated local key
        try {
          const userKey = `user_thrift_orders_${uId}`;
          const raw = localStorage.getItem(userKey);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
              parsed.forEach((lo: ThriftOrderApi) => {
                const code = (lo.orderCode || lo._id || '').replace('#', '').trim();
                if (code && code !== 'RH-THF-2024-9108' && !code.includes('9108') && !mergedMap.has(code)) {
                  mergedMap.set(code, lo);
                }
              });
            }
          }
        } catch (e) {
          console.warn('Lỗi đọc user_thrift_orders offline fallback:', e);
        }
      }

      const getRawTimestamp = (raw: ThriftOrderApi): number => {
        if (raw.createdAt) {
          const t = Date.parse(raw.createdAt);
          if (!isNaN(t)) return t;
        }
        if (raw._id && /^[0-9a-fA-F]{24}$/.test(raw._id)) {
          const s = parseInt(raw._id.substring(0, 8), 16);
          if (!isNaN(s) && s > 0) return s * 1000;
        }
        return 0;
      };

      const sortedRaw = Array.from(mergedMap.values())
        .filter((o) => {
          const code = (o.orderCode || o._id || '').replace('#', '').trim();
          if (code === 'RH-THF-2024-9108' || code.includes('9108')) return false;
          const hasCameraMock = (o.items || []).some((it) => {
            const n = (it.productName || it.name || '').toLowerCase();
            return n.includes('hasselblad') || n.includes('b+w master');
          });
          if (hasCameraMock) return false;
          return true;
        })
        .sort((a, b) => getRawTimestamp(b) - getRawTimestamp(a));

      const records = sortedRaw.map(mapOrderToRecord);
      setOrders(records);
    } catch (err) {
      console.error('Lỗi khi nạp đơn mua THRIFT:', err);
    } finally {
      setIsLoading(false);
    }
  }, [mapOrderToRecord, user]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchOrders();

    const handleSync = () => {
      fetchOrders();
    };
    window.addEventListener('storage', handleSync);
    window.addEventListener('rental_order_updated', handleSync);
    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('rental_order_updated', handleSync);
    };
  }, [fetchOrders]);

  // Auto show banner if returning from VNPay
  useEffect(() => {
    if (paymentSuccessParam) {
      showToast(`Giao dịch thanh toán đơn THRIFT ${paymentSuccessParam} thành công! Ký quỹ Smart Escrow 72H đã kích hoạt.`);
    }
  }, [paymentSuccessParam, showToast]);

  // Top Metrics Calculation
  const metrics = useMemo(() => {
    const totalSpent = orders
      .filter((o) => o.status !== 'CANCELLED')
      .reduce((sum, o) => sum + o.totalAmount, 0);

    const inTransit = orders.filter((o) => o.status === 'SHIPPED').length;
    const inAudit72h = orders.filter((o) => o.status === 'DELIVERED').length;
    const completedVault = orders.filter((o) => o.status === 'COMPLETED').length;

    return {
      totalSpent,
      inTransit,
      inAudit72h,
      completedVault,
    };
  }, [orders]);

  // Filtered orders by Tab and Search
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      // 1. Tab filter
      if (activeTab === 'WAITING_PAYMENT' && o.status !== 'PENDING_PAYMENT') return false;
      if (activeTab === 'PAID' && o.status !== 'PAID') return false;
      if (activeTab === 'PROCESSING' && o.status !== 'PROCESSING') return false;
      if (activeTab === 'SHIPPED' && o.status !== 'SHIPPED') return false;
      if (activeTab === 'DELIVERED' && o.status !== 'DELIVERED') return false;
      if (activeTab === 'COMPLETED' && o.status !== 'COMPLETED') return false;
      if (activeTab === 'CANCELLED' && o.status !== 'CANCELLED') return false;

      // 2. Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const codeMatch = o.orderCode.toLowerCase().includes(q);
        const itemMatch = o.items.some((it) => it.productName.toLowerCase().includes(q));
        const trackingMatch = o.trackingCode.toLowerCase().includes(q);
        return codeMatch || itemMatch || trackingMatch;
      }

      return true;
    });
  }, [orders, activeTab, searchQuery]);

  // Handle Cancel Order
  const handleConfirmCancel = async () => {
    if (!cancellingOrderId) return;
    setIsActionLoading(true);
    try {
      await cancelThriftOrderApi(cancellingOrderId, cancelReasonText || 'Khách hàng yêu cầu hủy đơn');
      showToast('Đã hủy đơn mua THRIFT thành công. Tiền ký quỹ sẽ được hoàn trả.');
      setCancellingOrderId(null);
      setCancelReasonText('');
      fetchOrders();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      showToast(e.response?.data?.message || e.message || 'Không thể hủy đơn hàng vào lúc này.');
    } finally {
      setIsActionLoading(false);
    }
  };

  // Handle Confirm Inspection / Ownership Received (Xác nhận Mặc thử vừa vặn & giữ đồ)
  const handleConfirmReceived = async () => {
    if (!confirmingOrderId) return;
    setIsActionLoading(true);
    const targetId = confirmingOrderId;
    const cleanTarget = targetId.replace('#', '').trim().toLowerCase();

    try {
      // 1. Thử gọi backend API (không block nếu offline)
      try {
        await confirmDeliveredThriftOrderApi(targetId);
      } catch (apiErr) {
        console.warn('API confirmDeliveredThriftOrderApi warning (offline fallback):', apiErr);
      }

      const confirmedAt = new Date().toISOString();

      // 2. Cập nhật buyerConfirmed vào tất cả key user_thrift_orders trong localStorage
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key === 'user_thrift_orders' || key.startsWith('user_thrift_orders_'))) {
          const raw = localStorage.getItem(key);
          if (raw) {
            try {
              const list = JSON.parse(raw);
              if (Array.isArray(list)) {
                let changed = false;
                const updatedList = list.map((uo: ThriftOrderApi) => {
                  const uCode = (uo.orderCode || uo._id || '').replace('#', '').trim().toLowerCase();
                  if (uCode === cleanTarget || (uo._id && uo._id.toLowerCase() === cleanTarget)) {
                    changed = true;
                    return {
                      ...uo,
                      buyerConfirmed: true,
                      buyerConfirmedAt: confirmedAt,
                    };
                  }
                  return uo;
                });
                if (changed) {
                  localStorage.setItem(key, JSON.stringify(updatedList));
                }
              }
            } catch (parseErr) {
              console.warn('Error parsing key', key, parseErr);
            }
          }
        }
      }

      // 3. Đồng bộ sang SHOP_THRIFT_ORDERS_DATA để Shop Owner lập tức thấy khách đã ưng ý!
      try {
        const shopRaw = localStorage.getItem('SHOP_THRIFT_ORDERS_DATA');
        if (shopRaw) {
          const shopList = JSON.parse(shopRaw);
          if (Array.isArray(shopList)) {
            const updatedShop = shopList.map((so: { id?: string; _dbId?: string; buyerConfirmed?: boolean; buyerConfirmedAt?: string }) => {
              const soId = (so.id || so._dbId || '').replace('#', '').trim().toLowerCase();
              if (soId === cleanTarget || (so._dbId && so._dbId.toLowerCase() === cleanTarget)) {
                return {
                  ...so,
                  buyerConfirmed: true,
                  buyerConfirmedAt: confirmedAt,
                };
              }
              return so;
            });
            localStorage.setItem('SHOP_THRIFT_ORDERS_DATA', JSON.stringify(updatedShop));
          }
        }
      } catch (shopErr) {
        console.warn('Error updating SHOP_THRIFT_ORDERS_DATA:', shopErr);
      }

      // 4. Phát sự kiện storage cho toàn hệ thống
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new Event('rental_order_updated'));

      // 5. Cập nhật state trực tiếp ngay lập tức
      setOrders((prev) =>
        prev.map((o) =>
          o.id.toLowerCase() === cleanTarget || o.orderCode.replace('#', '').toLowerCase() === cleanTarget
            ? { ...o, buyerConfirmed: true, buyerConfirmedAt: confirmedAt }
            : o
        )
      );

      setConfirmingOrderId(null);
      showToast('Đã xác nhận nhận hàng thành công! Shop Owner đã nhận được thông báo để giải ngân về ví.');
      void fetchOrders();
    } catch (err: unknown) {
      console.error('Lỗi xác nhận nhận đồ:', err);
      setConfirmingOrderId(null);
      showToast('Đã ghi nhận bạn đã nhận được hàng!');
    } finally {
      setIsActionLoading(false);
    }
  };

  // Handle Repay with VNPay
  const handleRepayVNPay = async (order: ThriftOrderRecord) => {
    try {
      await redirectToVnPayGateway({
        orderId: order.id,
        orderCode: order.orderCode.replace('#', ''),
        amount: order.totalAmount,
        type: 'THRIFT',
      });
    } catch (err) {
      console.error('Error redirecting to VNPay:', err);
      showToast('Không thể kết nối đến VNPay Sandbox. Vui lòng thử lại!');
    }
  };

  return (
    <div className="min-h-screen bg-[#FBF9F5] text-[#1C1C18] flex flex-col font-sans selection:bg-[#D8E3CE] selection:text-[#5B6655]">


      {/* ── MAIN LAYOUT WITH USERSIDEBAR ── */}
      <div className="w-full max-w-[1520px] mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 flex flex-col lg:flex-row gap-8">
        {/* User Sidebar */}
        <aside className="w-full lg:w-72 shrink-0">
          <UserSidebar activeKey="thrift-orders" />
        </aside>

        {/* Content Area */}
        <main className="flex-1 flex flex-col gap-6 min-w-0">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#E6E2DB]">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#D8E3CE]/60 text-[#5B6655] mb-2 text-[11px] font-bold uppercase tracking-wider">
                <span className="material-symbols-outlined text-[16px]">verified</span>
                <span>SỔ LỆNH SỞ HỮU VĨNH VIỄN · PROVENANCE VAULT™</span>
              </div>
              <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#141310] tracking-tight">
                Đơn mua THRIFT của tôi
              </h1>
              <p className="text-xs sm:text-sm text-[#7B766F] mt-1">
                Theo dõi quy trình lưu ký, vận chuyển bọc thép White-Glove, cơ chế ký quỹ 72 giờ và cấp phát chứng thư số độc bản.
              </p>
            </div>

            <div className="flex items-center gap-3 self-start md:self-auto">
              <Link
                to="/thrift"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#141310] text-[#E7E1DD] text-xs font-bold uppercase tracking-wider hover:bg-[#292724] transition-all shadow-sm"
              >
                <span className="material-symbols-outlined text-[18px]">add_shopping_cart</span>
                <span>Khám phá Kho THRIFT</span>
              </Link>
            </div>
          </div>

          {/* ── TOP STATISTICAL METRICS ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E6E2DB] shadow-xs flex flex-col justify-between">
              <span className="text-[10px] uppercase font-bold text-[#7B766F] tracking-wider">
                Tổng giá trị hiện vật
              </span>
              <p className="font-serif text-xl sm:text-2xl font-bold text-[#141310] mt-2">
                {formatCurrency(metrics.totalSpent)}
              </p>
              <div className="flex items-center gap-1 text-[11px] text-[#576151] mt-2 font-semibold">
                <span className="material-symbols-outlined text-[14px]">account_balance_wallet</span>
                <span>Ký quỹ an toàn Escrow</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E6E2DB] shadow-xs flex flex-col justify-between">
              <span className="text-[10px] uppercase font-bold text-[#7B766F] tracking-wider">
                Đang giao bọc thép
              </span>
              <p className="font-serif text-xl sm:text-2xl font-bold text-[#245778] mt-2">
                {metrics.inTransit} <span className="text-xs font-sans font-normal text-stone-500">kiện</span>
              </p>
              <div className="flex items-center gap-1 text-[11px] text-[#3B6E8C] mt-2 font-semibold">
                <span className="material-symbols-outlined text-[14px]">local_shipping</span>
                <span>White-Glove Courier</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E6E2DB] shadow-xs flex flex-col justify-between">
              <span className="text-[10px] uppercase font-bold text-[#7B766F] tracking-wider">
                Trong 72h đối soát
              </span>
              <p className="font-serif text-xl sm:text-2xl font-bold text-[#1E5638] mt-2">
                {metrics.inAudit72h} <span className="text-xs font-sans font-normal text-stone-500">đơn</span>
              </p>
              <div className="flex items-center gap-1 text-[11px] text-[#2E7D32] mt-2 font-semibold">
                <span className="material-symbols-outlined text-[14px]">hourglass_top</span>
                <span>Bảo vệ thử đồ 72h</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E6E2DB] shadow-xs flex flex-col justify-between">
              <span className="text-[10px] uppercase font-bold text-[#7B766F] tracking-wider">
                Chứng thư Vault đã cấp
              </span>
              <p className="font-serif text-xl sm:text-2xl font-bold text-[#141310] mt-2">
                {metrics.completedVault} <span className="text-xs font-sans font-normal text-stone-500">chứng thư</span>
              </p>
              <div className="flex items-center gap-1 text-[11px] text-[#576151] mt-2 font-semibold">
                <span className="material-symbols-outlined text-[14px]">token</span>
                <span>Mã băm Blockchain</span>
              </div>
            </div>
          </div>

          {/* ── FILTER TABS ── */}
          <div className="bg-white rounded-2xl p-2 sm:p-3 border border-[#E6E2DB] shadow-xs flex flex-col gap-3">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
              {[
                { key: 'ALL', label: 'TẤT CẢ', count: orders.length },
                {
                  key: 'WAITING_PAYMENT',
                  label: 'CHỜ THANH TOÁN',
                  count: orders.filter((o) => o.status === 'PENDING_PAYMENT').length,
                },
                {
                  key: 'PAID',
                  label: 'ĐÃ THANH TOÁN / KÝ QUỸ',
                  count: orders.filter((o) => o.status === 'PAID').length,
                },
                {
                  key: 'PROCESSING',
                  label: 'ĐANG ĐÓNG GÓI',
                  count: orders.filter((o) => o.status === 'PROCESSING').length,
                },
                {
                  key: 'SHIPPED',
                  label: 'ĐANG VẬN CHUYỂN',
                  count: orders.filter((o) => o.status === 'SHIPPED').length,
                },
                {
                  key: 'DELIVERED',
                  label: '72H ĐỐI SOÁT ĐỘC LẬP',
                  count: orders.filter((o) => o.status === 'DELIVERED').length,
                },
                {
                  key: 'COMPLETED',
                  label: 'SỞ HỮU HOÀN TẤT',
                  count: orders.filter((o) => o.status === 'COMPLETED').length,
                },
                {
                  key: 'CANCELLED',
                  label: 'ĐÃ HỦY',
                  count: orders.filter((o) => o.status === 'CANCELLED').length,
                },
              ].map((tab) => {
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key)}
                    className={`px-3 py-2 rounded-xl font-bold tracking-wider uppercase whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                      isActive
                        ? 'bg-[#141310] text-[#E7E1DD] shadow-sm'
                        : 'text-[#7B766F] hover:bg-[#F7F3EC] hover:text-[#141310]'
                    }`}
                  >
                    <span>{tab.label}</span>
                    {tab.count > 0 && (
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                          isActive
                            ? 'bg-white/20 text-white'
                            : 'bg-[#F1EDE6] text-[#4A463F]'
                        }`}
                      >
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Search Input Bar */}
            <div className="pt-2 border-t border-[#F1EDE6] flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:max-w-md">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-[18px]">
                  search
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm theo mã đơn #TRF..., tên hiện vật, mã vận đơn..."
                  className="w-full bg-[#F7F3EC] text-xs text-[#1C1C18] placeholder:text-stone-400 pl-9 pr-4 py-2 rounded-xl focus:outline-none focus:bg-[#EBE8E1] transition-colors border border-transparent focus:border-[#E6E2DB]"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-stone-400 hover:text-stone-700"
                  >
                    ✕
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto text-xs text-[#7B766F]">
                <span>Sắp xếp:</span>
                <select
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value)}
                  className="bg-[#F7F3EC] px-3 py-1.5 rounded-lg font-semibold text-[#141310] border border-[#E6E2DB] focus:outline-none"
                >
                  <option value="Mới nhất trước">Mới nhất trước</option>
                  <option value="Cũ nhất trước">Cũ nhất trước</option>
                  <option value="Giá trị cao nhất">Giá trị cao nhất</option>
                </select>
              </div>
            </div>
          </div>

          {/* ── ORDERS LIST SECTION ── */}
          {isLoading ? (
            <OrdersListSkeleton count={3} />
          ) : filteredOrders.length === 0 ? (
            <EmptyState
              type="orders"
              badge="SỔ LỆNH THRIFT TRỐNG"
              title="Chưa có đơn mua THRIFT nào trong mục này"
              description={
                searchQuery
                  ? `Không tìm thấy đơn hàng nào khớp với từ khóa "${searchQuery}".`
                  : 'Khám phá các hiện vật độc bản 1-of-1 tuyển chọn và trải nghiệm thanh toán bảo chứng Provenance Vault™.'
              }
              primaryAction={{
                label: 'Khám phá Hiện vật THRIFT',
                href: '/thrift',
                icon: 'inventory_2',
                variant: 'primary',
              }}
              secondaryAction={
                activeTab !== 'ALL' || searchQuery
                  ? {
                      label: 'Xóa bộ lọc tìm kiếm',
                      onClick: () => {
                        setActiveTab('ALL');
                        setSearchQuery('');
                      },
                      icon: 'filter_alt_off',
                      variant: 'secondary',
                    }
                  : undefined
              }
            />
          ) : (

            <div className="flex flex-col gap-5">
              {filteredOrders.map((order) => (
                <article
                  key={order.id}
                  className="bg-white rounded-2xl border border-[#E6E2DB] shadow-xs overflow-hidden transition-all hover:shadow-md"
                >
                  {/* Order Top Bar */}
                  <div className="bg-[#F7F3EC]/80 px-5 py-3.5 border-b border-[#E6E2DB] flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-mono font-bold text-[#141310] text-sm tracking-tight">
                        {order.orderCode}
                      </span>
                      <span className="text-[#7B766F]">•</span>
                      <span className="text-[#7B766F]">Ngày đặt: {order.createdAt}</span>
                      <span className="text-[#7B766F]">•</span>
                      <span className="inline-flex items-center gap-1 text-[#576151] font-semibold">
                        <span className="material-symbols-outlined text-[15px]">badge</span>
                        Chứng thư: {order.provenanceVaultCertId}
                      </span>
                    </div>

                    {/* Status Badge */}
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border ${order.statusBg}`}
                      >
                        <span className={`w-2 h-2 rounded-full ${order.dotBg}`} />
                        <span>{order.statusText}</span>
                      </span>
                    </div>
                  </div>

                  {/* Order Body */}
                  <div className="p-5 flex flex-col gap-4">
                    {/* Status Context Helper */}
                    <div className="p-3 bg-[#FBF9F5] rounded-xl border border-[#E6E2DB]/70 flex items-start gap-2.5 text-xs text-[#4A463F]">
                      <span className="material-symbols-outlined text-[#576151] text-[18px] shrink-0 mt-0.5">
                        info
                      </span>
                      <p className="leading-relaxed">{order.statusDescription}</p>
                    </div>

                    {/* Items List */}
                    <div className="flex flex-col divide-y divide-[#F1EDE6]">
                      {order.items.map((item) => (
                        <div
                          key={item.id}
                          className="py-3 first:pt-0 last:pb-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                        >
                          <div className="flex items-center gap-3.5">
                            <div className="w-16 h-16 rounded-xl overflow-hidden bg-[#EBE8E1] shrink-0 border border-[#E6E2DB]">
                              <img
                                src={item.imageUrl}
                                alt={item.productName}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div>
                              <span className="inline-block px-2 py-0.5 rounded bg-[#D8E3CE]/70 text-[#5B6655] text-[10px] uppercase font-bold tracking-wider mb-1">
                                {item.condition}
                              </span>
                              <h4 className="font-serif text-sm font-bold text-[#141310] leading-snug">
                                {item.productName}
                              </h4>
                              <p className="text-[11px] text-[#7B766F] mt-0.5">
                                Lưu ký: {item.vaultOrigin} · {item.warranty}
                              </p>
                            </div>
                          </div>

                          <div className="sm:text-right shrink-0">
                            <span className="font-serif font-bold text-sm text-[#141310]">
                              {formatCurrency(item.price * item.quantity)}
                            </span>
                            <p className="text-[10px] text-[#7B766F] font-mono">
                              SL: {item.quantity} x {formatCurrency(item.price)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Delivery & Financial Summary Bar */}
                    <div className="pt-3 border-t border-[#F1EDE6] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs bg-[#F7F3EC]/50 p-3 rounded-xl">
                      <div>
                        <p className="text-[#7B766F]">
                          <strong className="text-[#141310]">Địa chỉ giao:</strong>{' '}
                          {order.shippingAddress.fullAddress}
                        </p>
                        <p className="text-[#7B766F] mt-0.5">
                          <strong className="text-[#141310]">Vận chuyển:</strong> {order.courierName} (Mã: {order.trackingCode})
                        </p>
                      </div>

                      <div className="text-right shrink-0 sm:pl-4 self-end sm:self-center">
                        <span className="text-[11px] uppercase tracking-wider text-[#7B766F] block">
                          Tổng thanh toán
                        </span>
                        <span className="font-serif text-base font-bold text-[#141310]">
                          {formatCurrency(order.totalAmount)}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons Toolbar */}
                    <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
                      <Link
                        to={`/thrift/orders/${order.id}`}
                        className="inline-flex items-center gap-1.5 text-xs text-[#576151] hover:text-[#141310] font-bold uppercase tracking-wider"
                      >
                        <span>Xem chi tiết hồ sơ &amp; Chứng thư</span>
                        <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                      </Link>

                      <div className="flex items-center gap-2.5 flex-wrap">
                        {/* Pending Payment: Repay VNPay or Cancel */}
                        {order.status === 'PENDING_PAYMENT' && (
                          <>
                            <button
                              type="button"
                              onClick={() => {
                                setCancellingOrderId(order.id);
                                setCancelReasonText('');
                              }}
                              className="px-3.5 py-1.5 rounded-lg border border-[#E6E2DB] text-xs font-semibold text-stone-600 hover:text-stone-900 hover:bg-[#F7F3EC] transition-colors cursor-pointer"
                            >
                              Hủy đơn
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRepayVNPay(order)}
                              className="px-4 py-2 rounded-xl bg-[#141310] text-[#E7E1DD] text-xs font-bold uppercase tracking-wider hover:bg-[#292724] transition-all shadow-sm cursor-pointer"
                            >
                              Thanh toán VNPay ngay
                            </button>
                          </>
                        )}

                        {/* Khi đang giao hoặc đã giao mà khách chưa bấm nhận: Hiển thị nút Đã nhận được hàng */}
                        {(order.status === 'SHIPPED' || order.status === 'DELIVERED') && !order.buyerConfirmed && (
                          <button
                            type="button"
                            onClick={() => setConfirmingOrderId(order.id)}
                            className="px-4 py-2 rounded-xl bg-[#2E7D32] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#1B5E20] transition-all shadow-sm cursor-pointer flex items-center gap-1.5"
                          >
                            <span className="material-symbols-outlined text-[16px]">check_circle</span>
                            <span>Đã Nhận Được Hàng</span>
                          </button>
                        )}

                        {/* Khi đã nhận hàng hoặc đơn đã COMPLETED: Hiển thị trạng thái & nút Chứng thư */}
                        {(order.status === 'COMPLETED' || order.buyerConfirmed) && (
                          <div className="flex items-center gap-2">
                            {order.status !== 'COMPLETED' && (
                              <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl flex items-center gap-1">
                                <span className="material-symbols-outlined text-[14px] text-emerald-600">done_all</span>
                                Đã nhận hàng · Chờ xưởng giải ngân
                              </span>
                            )}
                            <Link
                              to={`/thrift/orders/${order.id}`}
                              className="px-4 py-2 rounded-xl bg-[#141310] text-[#E7E1DD] text-xs font-bold uppercase tracking-wider hover:bg-[#292724] transition-all shadow-sm flex items-center gap-1.5"
                            >
                              <span className="material-symbols-outlined text-[16px]">workspace_premium</span>
                              <span>Chứng thư Provenance Vault™</span>
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* ── MODAL: HỦY ĐƠN MUA THRIFT ── */}
      {cancellingOrderId && (
        <div className="fixed inset-0 z-50 bg-[#141310]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-2xl p-6 shadow-2xl border border-[#E6E2DB] space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[22px]">warning</span>
              </div>
              <div>
                <h3 className="font-serif text-base font-bold text-[#141310]">
                  Xác nhận hủy đơn mua THRIFT
                </h3>
                <p className="text-xs text-[#7B766F]">
                  Hiện vật độc bản sẽ được giải phóng khỏi phiên giữ chỗ.
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-[#141310] block">Lý do hủy đơn:</label>
              <textarea
                value={cancelReasonText}
                onChange={(e) => setCancelReasonText(e.target.value)}
                placeholder="Ví dụ: Đổi ý, muốn chọn hiện vật khác, thay đổi địa chỉ..."
                rows={3}
                className="w-full bg-[#F7F3EC] p-3 rounded-xl text-xs text-[#1C1C18] focus:outline-none focus:bg-[#EBE8E1] border border-[#E6E2DB]"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCancellingOrderId(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider text-stone-600 hover:bg-[#F7F3EC] cursor-pointer"
              >
                Đóng
              </button>
              <button
                type="button"
                disabled={isActionLoading}
                onClick={handleConfirmCancel}
                className="px-5 py-2.5 rounded-xl bg-rose-600 text-white text-xs font-bold uppercase tracking-wider hover:bg-rose-700 transition-colors shadow-sm cursor-pointer disabled:opacity-50"
              >
                {isActionLoading ? 'Đang hủy...' : 'Xác nhận hủy'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: XÁC NHẬN ĐÃ NHẬN HÀNG ── */}
      {confirmingOrderId && (
        <div className="fixed inset-0 z-50 bg-[#141310]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white max-w-lg w-full rounded-2xl p-6 shadow-2xl border border-[#E6E2DB] space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#D8E3CE] text-[#5B6655] flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[24px]">local_shipping</span>
              </div>
              <div>
                <h3 className="font-serif text-base font-bold text-[#141310]">
                  Xác Nhận Đã Nhận Được Hàng
                </h3>
                <p className="text-xs text-[#7B766F]">
                  Bạn xác nhận đã nhận được kiện hàng trang phục nguyên vẹn và hài lòng với đơn hàng.
                </p>
              </div>
            </div>

            <div className="bg-[#F7F3EC] p-4 rounded-xl text-xs text-[#4A463F] space-y-2 leading-relaxed border border-[#E6E2DB]/70">
              <p className="font-medium text-[#1C1C18]">
                Bằng việc xác nhận này:
              </p>
              <ul className="list-disc pl-4 space-y-1.5 text-stone-700">
                <li><strong>Kiện hàng &amp; Trang phục:</strong> Đã nhận đầy đủ số lượng và chất lượng đúng như mô tả.</li>
                <li><strong>Mở khóa giải ngân cho Shop:</strong> Hệ thống mở khóa nút giải ngân để Shop Owner nhận tiền bán về ví từ Smart Escrow.</li>
                <li><strong>Kích hoạt Chứng thư Provenance Vault™:</strong> Xác lập quyền sở hữu vĩnh viễn trên sổ cái tuần hoàn ReUse Hub.</li>
              </ul>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmingOrderId(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider text-stone-600 hover:bg-[#F7F3EC] cursor-pointer"
              >
                Kiểm tra thêm
              </button>
              <button
                type="button"
                disabled={isActionLoading}
                onClick={handleConfirmReceived}
                className="px-5 py-2.5 rounded-xl bg-[#2E7D32] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#1B5E20] transition-colors shadow-sm cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">check_circle</span>
                <span>{isActionLoading ? 'Đang xác nhận...' : 'Xác Nhận Đã Nhận Hàng'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyThriftOrders;