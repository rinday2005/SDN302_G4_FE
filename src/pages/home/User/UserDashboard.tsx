import React, { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { useCartWishlist } from '../../../context/CartWishlistContext';
import { UserSidebar } from '../../../components/layout/UserSidebar';
import { getMyRentalOrdersApi, type RentalOrderApi, type RentalOrderItemApi } from '../../../services/order.api';
import { getMyThriftOrdersApi, type ThriftOrderApi } from '../../../services/thriftOrder.api';
import {
  CIRCULAR_LIFECYCLE_STEPS,
  RECOMMENDED_DASHBOARD_ITEMS,
} from '../../data/home/userDashboardData';
import { resolveWishlistProduct, type ResolvedWishlistProduct } from '../../../services/wishlistProductResolver';
import { getRentProductDetail } from '../../data/rent/rentOrderDetailData';

export const UserDashboard: React.FC = () => {
  const { user } = useAuth();
  const { wishlist, wishlistCount, toggleWishlist, cartCount } = useCartWishlist();

  const displayName = user?.fullName || 'Khách hàng';

  const formatVND = (num: number) => {
    return num.toLocaleString('vi-VN') + '₫';
  };

  // ── Load Real Rental Orders & Thrift Orders ──
  const [activeRentals, setActiveRentals] = useState<RentalOrderApi[]>([]);

  // 1. Real Thrift Orders from Backend API
  const [thriftOrders, setThriftOrders] = useState<ThriftOrderApi[]>([]);

  useEffect(() => {
    let isMounted = true;
    getMyThriftOrdersApi()
      .then((res) => {
        if (!isMounted) return;
        const list = res?.orders || [];
        setThriftOrders(list);
      })
      .catch((err) => {
        console.warn('Could not load thrift orders from API:', err);
      });
    return () => { isMounted = false; };
  }, [user]);

  // 2. Real Rent Orders: Merge Backend API & LocalStorage for accurate user context
  useEffect(() => {
    let isMounted = true;
    const uId = user?._id || user?.id || '';

    const loadUserRentals = async () => {
      try {
        localStorage.removeItem('user_rental_orders');
        localStorage.removeItem('user_thrift_orders');
        for (let i = localStorage.length - 1; i >= 0; i--) {
          const k = localStorage.key(i);
          if (k && (k.startsWith('reuse_order_backup_') || k === 'user_rental_orders' || k === 'user_thrift_orders')) {
            localStorage.removeItem(k);
          }
        }
      } catch {
        // ignore
      }

      if (!uId) {
        if (isMounted) setActiveRentals([]);
        return;
      }

      interface StoredOrderRecord {
        _id?: string;
        orderCode?: string;
        status?: string;
        paymentStatus?: string;
        renterId?: string;
        items?: RentalOrderItemApi[];
        startDate?: string;
        endDate?: string;
        rentalDays?: number;
        rentalFee?: number;
        totalRentFee?: number;
        depositAmount?: number;
        totalDeposit?: number;
        totalAmount?: number;
        totalPayment?: number;
        shippingFee?: number;
        createdAt?: string;
        [key: string]: unknown;
      }

      const localOrders: StoredOrderRecord[] = [];
      const seenLocKeys = new Set<string>();

      try {
        const userKey = `user_rental_orders_${uId}`;
        const raw = localStorage.getItem(userKey);
        if (raw) {
          const arr = JSON.parse(raw);
          if (Array.isArray(arr)) {
            arr.forEach((o: StoredOrderRecord) => {
              if (o.renterId && String(o.renterId) !== String(uId)) return;
              const c = (o.orderCode || '').replace('#', '').trim().toLowerCase();
              if (c && !seenLocKeys.has(c)) {
                seenLocKeys.add(c);
                localOrders.push(o);
              }
            });
          }
        }
      } catch {
        // ignore
      }

      let apiOrders: RentalOrderApi[] = [];
      try {
        const res = await getMyRentalOrdersApi();
        if (Array.isArray(res)) {
          apiOrders = res;
        }
      } catch (err) {
        console.warn('Could not load orders from API in UserDashboard:', err);
      }

      const merged: RentalOrderApi[] = [];
      const processedCodes = new Set<string>();

      apiOrders.forEach((apiO) => {
        const aCode = (apiO.orderCode || apiO._id || '').replace('#', '').trim().toLowerCase();
        const matchedLocal = localOrders.find((loc) => {
          const lCode = (loc.orderCode || '').replace('#', '').trim().toLowerCase();
          return lCode === aCode || (lCode.length > 4 && aCode.includes(lCode)) || (aCode.length > 4 && lCode.includes(aCode));
        });

        const localItems = matchedLocal?.items;
        const hasRichLocalItems =
          Array.isArray(localItems) &&
          localItems.length > 0 &&
          !localItems.some((it) => ((it.productName || (it as { title?: string }).title) || '').includes('Đơn hàng Thuê'));

        const enriched: RentalOrderApi = {
          ...apiO,
          items: hasRichLocalItems ? (localItems as RentalOrderItemApi[]) : (apiO.items || []),
          depositAmount: matchedLocal?.totalDeposit || matchedLocal?.depositAmount || apiO.depositAmount || 0,
          totalAmount: matchedLocal?.totalPayment || matchedLocal?.totalAmount || apiO.totalAmount || 0,
          startDate: matchedLocal?.startDate || apiO.startDate,
          endDate: matchedLocal?.endDate || apiO.endDate,
        };

        if (aCode) processedCodes.add(aCode);
        merged.push(enriched);
      });

      localOrders.forEach((loc) => {
        const lCode = (loc.orderCode || '').replace('#', '').trim().toLowerCase();
        if (lCode && !processedCodes.has(lCode)) {
          processedCodes.add(lCode);
          merged.push({
            _id: loc._id || lCode,
            orderCode: loc.orderCode || `#${lCode}`,
            renterId: uId,
            items: (loc.items || []) as RentalOrderItemApi[],
            startDate: loc.startDate || '',
            endDate: loc.endDate || '',
            rentalDays: loc.rentalDays || 1,
            rentalFee: loc.totalRentFee || loc.rentalFee || 0,
            depositAmount: loc.totalDeposit || loc.depositAmount || 0,
            shippingFee: loc.shippingFee || 25000,
            totalAmount: loc.totalPayment || loc.totalAmount || 0,
            status: loc.status || 'PAID',
            paymentStatus: loc.paymentStatus || 'PAID',
            createdAt: (loc.createdAt as string) || new Date().toISOString(),
          });
        }
      });

      merged.sort((a, b) => {
        const timeA = new Date(a.createdAt || a.startDate || 0).getTime();
        const timeB = new Date(b.createdAt || b.startDate || 0).getTime();
        return timeB - timeA;
      });

      if (!isMounted) return;
      const active = merged.filter((o) =>
        ['PAID', 'RENTING', 'READY_FOR_HANDOVER', 'HANDED_OVER', 'SHIPPING', 'DELIVERED'].includes(
          o.status || ''
        )
      );
      setActiveRentals(active);
    };

    loadUserRentals();

    return () => {
      isMounted = false;
    };
  }, [user]);

  // Dynamic computed active rental (if any)
  const activeRentalData = useMemo(() => {
    if (activeRentals.length === 0) return null;
    const raw = activeRentals[0];
    const rawCode = (raw.orderCode || 'RH-RNT-2026').trim();
    const cleanId = rawCode.replace('#', '').trim();
    const code = rawCode.startsWith('#') ? rawCode : `#${rawCode}`;

    const rawItem = raw.items?.[0] as (RentalOrderItemApi & Record<string, unknown>) | undefined;
    let title =
      rawItem?.productName ||
      (rawItem as Record<string, unknown> | undefined)?.title as string ||
      '';
    let image =
      ((rawItem as Record<string, unknown> | undefined)?.imageUrl as string) ||
      ((rawItem as Record<string, unknown> | undefined)?.image as string) ||
      '';
    let escrowDeposit = raw.depositAmount || Number(rawItem?.depositAmount) || 0;

    // Check dedicated order backup key first
    try {
      const backupRaw = localStorage.getItem(`reuse_order_backup_${cleanId}`);
      if (backupRaw) {
        const backupOrder = JSON.parse(backupRaw);
        if (backupOrder?.items?.[0]) {
          const bItem = backupOrder.items[0];
          const bTitle = bItem.title || bItem.productName;
          if (bTitle && !bTitle.includes('Đơn hàng Thuê') && !bTitle.includes('RH-RNT-')) {
            title = bTitle;
          }
          if (bItem.image || bItem.imageUrl) {
            image = bItem.image || bItem.imageUrl;
          }
          if (backupOrder.totalDeposit || bItem.depositAmount) {
            escrowDeposit = backupOrder.totalDeposit || bItem.depositAmount;
          }
        }
      }
    } catch {
      // ignore
    }

    // Check if title is missing or is generic placeholder ("Đơn hàng Thuê (RH-RNT...)")
    const isGenericTitle = !title || title.includes('Đơn hàng Thuê') || title.includes('RH-RNT-');
    if (isGenericTitle || !image || image.includes('unsplash.com/photo-1516035069371') || escrowDeposit === 0) {
      let resolvedProd = null;

      // 1. Try resolving by rawItem.productId
      const pId = String(rawItem?.productId || (raw as { productId?: string }).productId || '');
      if (pId && pId !== 'undefined') {
        const found = getRentProductDetail(pId);
        if (found && found.title && !found.title.includes('Thuê')) {
          resolvedProd = found;
        }
      }

      // 2. Try resolving from reuse_shared_booked_dates
      if (!resolvedProd) {
        try {
          const sharedRaw = localStorage.getItem('reuse_shared_booked_dates');
          if (sharedRaw) {
            const list = JSON.parse(sharedRaw);
            if (Array.isArray(list) && list.length > 0) {
              const cId = cleanId.toLowerCase();
              const rStart = (raw.startDate || '').slice(0, 10);
              const rEnd = (raw.endDate || '').slice(0, 10);

              const matchedBooking = list.find((b: { orderCode?: string; note?: string; title?: string; startDate?: string; endDate?: string }) => {
                const bCode = (b.orderCode || '').replace('#', '').toLowerCase();
                const bNote = (b.note || '').toLowerCase();
                const codeMatch = Boolean(cId && (bCode === cId || bNote.includes(cId)));
                const bStart = (b.startDate || '').slice(0, 10);
                const bEnd = (b.endDate || '').slice(0, 10);
                const dateMatch = Boolean(rStart && bStart && rStart === bStart) || Boolean(rEnd && bEnd && rEnd === bEnd);
                return codeMatch || dateMatch;
              }) || list[list.length - 1];

              if (matchedBooking?.productId || matchedBooking?.title) {
                resolvedProd = getRentProductDetail(matchedBooking.productId || matchedBooking.title);
              }
            }
          }
        } catch {
          // ignore
        }
      }

      // 3. Fallback to default high-tier product
      if (!resolvedProd) {
        resolvedProd = getRentProductDetail('7');
      }

      if (resolvedProd) {
        if (isGenericTitle) {
          title = resolvedProd.title;
        }
        if (!image || image.includes('unsplash.com/photo-1516035069371')) {
          image = resolvedProd.images?.[0]?.src || image;
        }
        if (!escrowDeposit || escrowDeposit === 0) {
          escrowDeposit = resolvedProd.deposit || (resolvedProd.pricePerDay * 4) || 1500000;
        }
      }
    }

    if (!title) title = `Thiết bị lưu ký ReUse (${code})`;
    if (!image) {
      image = 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=600&q=80';
    }

    const startStr = raw.startDate ? new Date(raw.startDate).toLocaleDateString('vi-VN') : 'Mới tạo';
    const endStr = raw.endDate ? new Date(raw.endDate).toLocaleDateString('vi-VN') : 'Đang cập nhật';
    const rentalPeriod = `${startStr} – ${endStr}`;

    const now = new Date().getTime();
    const start = raw.startDate ? new Date(raw.startDate).getTime() : now;
    const end = raw.endDate ? new Date(raw.endDate).getTime() : now + 86400000;
    const totalDuration = Math.max(1, end - start);
    const elapsed = Math.max(0, Math.min(totalDuration, now - start));
    const progressPercent = Math.min(100, Math.max(0, Math.round((elapsed / totalDuration) * 100)));
    const remainingDays = Math.max(0, Math.ceil((end - now) / (1000 * 60 * 60 * 24)));
    const returnDeadline = raw.endDate
      ? `${new Date(raw.endDate).toLocaleDateString('vi-VN')} (còn ${remainingDays} ngày)`
      : 'Đang xác định';

    let statusLabel = 'Đang trong kỳ thuê lưu ký';
    if (raw.status === 'PAID') statusLabel = 'Đã thanh toán · Sẵn sàng bàn giao';
    else if (raw.status === 'SHIPPING' || raw.status === 'HANDED_OVER') statusLabel = 'Đang vận chuyển bảo chứng';
    else if (raw.status === 'RENTING') statusLabel = `Đang lưu giữ (còn ${remainingDays} ngày)`;
    else if (raw.status === 'DELIVERED') statusLabel = 'Đã nhận thiết bị lưu ký';

    return {
      id: code,
      cleanId,
      title,
      image,
      statusLabel,
      rentalPeriod,
      returnDeadline,
      escrowDeposit,
      progressPercent,
      progressNote: `Hạn chuẩn bị đóng hộp ReUse Escrow (còn ${remainingDays} ngày)`,
      detailUrl: `/rent/orders/${cleanId}`,
      returnUrl: `/rent/return-inspection/${cleanId}`,
    };
  }, [activeRentals]);

  // Dynamic computed thrift orders
  const formattedThriftOrders = useMemo(() => {
    return thriftOrders.slice(0, 3).map((order: ThriftOrderApi, idx: number) => {
      const itemsList = order.items;
      const item = itemsList?.[0];
      const rawId = order.orderCode || order._id || `RH-THF-${idx + 1}`;
      const code = rawId.startsWith('#') ? rawId : `#${rawId}`;
      const title = item?.productName || `Đơn hàng THRIFT ${code}`;
      const image =
        item?.imageUrl ||
        'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=600&q=80';
      const price = order.totalAmount || item?.price || 0;
      const condition = item?.condition || 'Tình trạng: Kiểm định chuẩn ReUse Grade A';
      const status =
        order.status === 'COMPLETED'
          ? 'ĐÃ GIAO HÀNG'
          : order.status === 'PAID'
          ? 'ĐÃ THANH TOÁN'
          : order.status || 'ĐÃ XÁC NHẬN';
      const badge = 'THRIFT';
      const warrantyNote = item?.warranty || 'Chứng nhận Audit Bench';
      const detailUrl = `/thrift/orders/${order._id.replace('#', '')}`;

      return {
        id: code,
        title,
        condition,
        price,
        badge,
        status,
        warrantyNote,
        image,
        detailUrl,
      };
    });
  }, [thriftOrders]);

  // Notifications count scoped to current user
  const unreadNotifsCount = useMemo(() => {
    const uId = user?._id || user?.id;
    if (!uId) return 0;
    try {
      const notifs = localStorage.getItem(`user_notifications_${uId}`);
      if (notifs) {
        const parsed = JSON.parse(notifs);
        if (Array.isArray(parsed)) return parsed.length;
      }
    } catch {
      // ignore
    }
    return 0;
  }, [user]);

  // ── Match Wishlist items dynamically with saved IDs (No fake mock items) ──
  const matchedWishlistItems = useMemo(() => {
    if (!wishlist || wishlist.length === 0) return [];
    const items: ResolvedWishlistProduct[] = [];
    wishlist.forEach((id) => {
      const resolved = resolveWishlistProduct(id);
      if (resolved) items.push(resolved);
    });
    return items;
  }, [wishlist]);

  const rentWishlistCount = matchedWishlistItems.filter((i) => i.mode === 'rent').length;
  const thriftWishlistCount = matchedWishlistItems.filter((i) => i.mode === 'thrift').length;

  // Track sidebar collapsed state to display inline restore chip when collapsed
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

  return (
    <div className="w-full min-h-screen bg-[#FBF9F5] text-[#1C1A18] antialiased">

      {/* ── MAIN APP CONTAINER (Sidebar + Dashboard Content) ── */}
      <div className="max-w-[1520px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 flex gap-8">
        {/* User Sidebar */}
        <UserSidebar activeKey="dashboard" />

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 space-y-8">
          {/* Quick inline restore chip if user clicked 3-bar button to hide sidebar */}
          {isSidebarCollapsed && (
            <div className="flex items-center gap-2 -mb-4 animate-fade-in">
              <button
                type="button"
                onClick={() => window.dispatchEvent(new CustomEvent('reuse_user_sidebar_toggle', { detail: false }))}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white border border-[#E8E4DC] text-xs font-semibold text-[#1C1A18] hover:bg-[#F6F3EE] hover:border-[#1C1A18]/40 transition-all shadow-2xs cursor-pointer group"
                title="Mở lại menu điều hướng (Dấu 3 gạch)"
              >
                <span className="material-symbols-outlined text-[18px] text-[#5E6D5B] group-hover:scale-110 transition-transform">
                  menu
                </span>
                <span>Hiện menu điều hướng</span>
              </button>
            </div>
          )}

          {/* 1. WELCOME SECTION & IMPACT STATEMENT */}
          <section
            data-reveal
            className="rounded-3xl bg-white border border-[#E8E4DC]/80 p-6 sm:p-8 relative overflow-hidden shadow-2xs"
          >
            <div className="max-w-2xl space-y-3 relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F6F3EE] border border-[#E8E4DC] text-[#1C1A18] text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-[#5E6D5B]" />
                <span>Thành viên ReUse Hub · Bậc lưu trữ Tier 2 Approved</span>
              </div>

              <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-normal text-[#1C1A18] tracking-tight">
                Chào mừng bạn trở lại, <span className="italic font-semibold">{displayName}</span>
              </h1>

              <p className="text-sm text-[#76726B] leading-relaxed">
                Mỗi thiết bị bạn chọn thuê thay vì mua mới giúp tiết kiệm tài nguyên nguyên sinh và giảm thiểu rác thải
                điện tử. Cùng ReUse Hub duy trì vòng đời bền vững cho những món đồ giá trị.
              </p>

              {/* Quick Action Buttons */}
              <div className="pt-3 flex flex-wrap items-center gap-3">
                <Link
                  to="/rent"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1C1A18] text-white text-xs font-semibold hover:bg-black transition-colors shadow-2xs cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                    />
                  </svg>
                  <span>Thuê thiết bị mới (RENT)</span>
                </Link>

                <Link
                  to="/thrift"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#F6F3EE] hover:bg-[#EFECE6] text-[#1C1A18] border border-[#E8E4DC] text-xs font-semibold transition-colors cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                    />
                  </svg>
                  <span>Sưu tầm đồ THRIFT</span>
                </Link>

                <Link
                  to="/cart"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#F6F3EE] hover:bg-[#EFECE6] text-[#1C1A18] border border-[#E8E4DC] text-xs font-semibold transition-colors cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      d="M3 3h2l.4 2M7 13h10l4-8H5.4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                    />
                  </svg>
                  <span>Xem giỏ hàng ({cartCount} món)</span>
                </Link>

                <Link
                  to="/rent/orders"
                  className="inline-flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold text-[#76726B] hover:text-[#1C1A18] transition-colors cursor-pointer"
                >
                  <span>Tất cả đơn hàng →</span>
                </Link>
              </div>
            </div>

            {/* Circular decorative watermark */}
            <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 w-64 h-64 rounded-full border-[28px] border-[#F6F3EE]/70 pointer-events-none opacity-60 hidden md:block" />
          </section>

          {/* 2. SUMMARY CARDS (4 Essential Metrics) */}
          <section data-reveal className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Metric 1: Đơn thuê đang hoạt động */}
            <Link
              to="/rent/orders"
              className="p-5 rounded-2xl bg-white border border-[#E8E4DC]/80 hover:border-[#1C1A18]/40 transition-all shadow-2xs group flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#76726B]">Đơn thuê đang hoạt động</span>
                <div className="w-8 h-8 rounded-full bg-[#F6F3EE] flex items-center justify-center text-[#1C1A18] group-hover:scale-110 transition-transform">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                    />
                  </svg>
                </div>
              </div>
              <div className="mt-4">
                <div className="text-3xl font-serif font-bold text-[#1C1A18]">
                  {activeRentals.length} <span className="text-sm font-sans font-normal text-[#76726B]">bộ</span>
                </div>
                <p className="text-[11px] text-[#5E6D5B] font-medium mt-1 flex items-center gap-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${activeRentals.length > 0 ? 'bg-[#5E6D5B]' : 'bg-stone-300'}`} />
                  {activeRentals.length > 0 ? 'Đang trong kỳ thuê lưu ký' : 'Chưa có đơn thuê nào'}
                </p>
              </div>
            </Link>

            {/* Metric 2: Đơn THRIFT đã mua */}
            <Link
              to="/thrift/orders"
              className="p-5 rounded-2xl bg-white border border-[#E8E4DC]/80 hover:border-[#1C1A18]/40 transition-all shadow-2xs group flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#76726B]">Bộ sưu tập THRIFT</span>
                <div className="w-8 h-8 rounded-full bg-[#F6F3EE] flex items-center justify-center text-[#1C1A18] group-hover:scale-110 transition-transform">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                    />
                  </svg>
                </div>
              </div>
              <div className="mt-4">
                <div className="text-3xl font-serif font-bold text-[#1C1A18]">
                  {thriftOrders.length} <span className="text-sm font-sans font-normal text-[#76726B]">món</span>
                </div>
                <p className="text-[11px] text-[#76726B] font-medium mt-1">
                  {thriftOrders.length > 0 ? 'Đã cấp chứng thư Audit Bench' : 'Chưa có đơn mua nào'}
                </p>
              </div>
            </Link>

            {/* Metric 3: Sản phẩm yêu thích (Dynamic from Context) */}
            <Link
              to="/wishlist"
              className="p-5 rounded-2xl bg-white border border-[#E8E4DC]/80 hover:border-[#1C1A18]/40 transition-all shadow-2xs group flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#76726B]">Sản phẩm yêu thích</span>
                <div className="w-8 h-8 rounded-full bg-[#F6F3EE] flex items-center justify-center text-[#1C1A18] group-hover:scale-110 transition-transform">
                  <svg className="w-4 h-4 text-rose-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                  </svg>
                </div>
              </div>
              <div className="mt-4">
                <div className="text-3xl font-serif font-bold text-[#1C1A18]">
                  {wishlistCount} <span className="text-sm font-sans font-normal text-[#76726B]">mục</span>
                </div>
                <p className="text-[11px] text-[#76726B] font-medium mt-1">
                  {wishlistCount > 0 ? `${rentWishlistCount} món RENT · ${thriftWishlistCount} món THRIFT` : 'Chưa lưu sản phẩm nào'}
                </p>
              </div>
            </Link>

            {/* Metric 4: Thông báo chưa đọc */}
            <Link
              to="/notifications"
              className="p-5 rounded-2xl bg-white border border-[#E8E4DC]/80 hover:border-[#1C1A18]/40 transition-all shadow-2xs group flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#76726B]">Thông báo mới</span>
                <div className="w-8 h-8 rounded-full bg-[#FDF2F2] flex items-center justify-center text-[#D9534F] group-hover:scale-110 transition-transform">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                    />
                  </svg>
                </div>
              </div>
              <div className="mt-4">
                <div className="text-3xl font-serif font-bold text-[#1C1A18]">
                  {unreadNotifsCount} <span className={`text-sm font-sans font-normal ${unreadNotifsCount > 0 ? 'text-[#D9534F] font-semibold' : 'text-[#76726B]'}`}>chưa đọc</span>
                </div>
                <p className="text-[11px] text-[#76726B] font-medium mt-1 truncate">
                  {unreadNotifsCount > 0 ? 'Nhắc nhở cập nhật đơn hàng' : 'Không có thông báo mới'}
                </p>
              </div>
            </Link>
          </section>

          {/* 3. CURRENT RENTAL (Active Rental Section) */}
          <section data-reveal className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] uppercase tracking-wider font-bold text-[#76726B]">
                  Thiết bị đang bảo quản
                </span>
                <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#1C1A18] tracking-tight">
                  Đơn thuê đang sử dụng
                </h2>
              </div>
              <Link
                to="/rent/orders"
                className="text-xs font-semibold text-[#1C1A18] hover:underline flex items-center gap-1"
              >
                <span>Lịch sử thuê toàn bộ</span>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                </svg>
              </Link>
            </div>

            {activeRentalData ? (
              <div className="bg-white rounded-3xl border border-[#E8E4DC]/80 p-6 sm:p-7 shadow-2xs">
                <div className="flex flex-col lg:flex-row gap-6 lg:items-center justify-between">
                  {/* Media & Details */}
                  <div className="flex flex-col sm:flex-row gap-5 items-start sm:items-center">
                    <div className="w-full sm:w-36 h-36 rounded-2xl bg-[#F6F3EE] overflow-hidden shrink-0 border border-[#E8E4DC] relative">
                      <img
                        alt={activeRentalData.title}
                        className="w-full h-full object-cover"
                        src={activeRentalData.image}
                      />
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-[#1C1A18]/90 text-white text-[9px] font-bold tracking-wider uppercase">
                        RENTING
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono uppercase bg-[#F6F3EE] text-[#76726B] px-2 py-0.5 rounded border border-[#E8E4DC]">
                          MÃ ĐƠN: {activeRentalData.id}
                        </span>
                        <span className="text-[10px] font-semibold text-[#5E6D5B] bg-[#EEF2EC] px-2 py-0.5 rounded-full">
                          {activeRentalData.statusLabel}
                        </span>
                      </div>

                      <h3 className="font-serif text-lg sm:text-xl font-bold text-[#1C1A18] leading-snug">
                        {activeRentalData.title}
                      </h3>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-1 text-xs text-[#76726B] pt-1">
                        <div>
                          <span className="block text-[10px] uppercase font-bold text-[#76726B]/70">Thời gian thuê</span>
                          <span className="font-medium text-[#1C1A18]">{activeRentalData.rentalPeriod}</span>
                        </div>
                        <div>
                          <span className="block text-[10px] uppercase font-bold text-[#76726B]/70">
                            Hạn chót hoàn trả
                          </span>
                          <span className="font-bold text-[#C84337]">{activeRentalData.returnDeadline}</span>
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                          <span className="block text-[10px] uppercase font-bold text-[#76726B]/70">
                            Tiền cọc Smart Escrow
                          </span>
                          <span className="font-semibold text-[#1C1A18]">
                            {formatVND(activeRentalData.escrowDeposit)} (hoàn 100%)
                          </span>
                        </div>
                      </div>

                      {/* Timeline Progress */}
                      <div className="pt-2">
                        <div className="flex items-center justify-between text-[10px] font-medium text-[#76726B] mb-1">
                          <span>Tiến độ kỳ thuê: {activeRentalData.progressPercent}%</span>
                          <span>{activeRentalData.progressNote}</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-[#F6F3EE] overflow-hidden">
                          <div
                            className="h-full bg-[#1C1A18] rounded-full transition-all duration-500"
                            style={{ width: `${activeRentalData.progressPercent}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions on Active Order */}
                  <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 shrink-0 pt-4 lg:pt-0 border-t lg:border-t-0 border-[#E8E4DC]">
                    <Link
                      to={activeRentalData.detailUrl}
                      className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-[#1C1A18] text-white text-xs font-semibold hover:bg-black transition-colors text-center shadow-2xs"
                    >
                      Xem chi tiết đơn thuê
                    </Link>
                    <Link
                      to={activeRentalData.returnUrl}
                      className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-white hover:bg-[#F6F3EE] text-[#1C1A18] border border-[#E8E4DC] text-xs font-semibold transition-colors text-center"
                    >
                      Chuẩn bị trả đồ &amp; Ảnh đối kiểm
                    </Link>
                    <Link
                      to="/chat"
                      className="inline-flex items-center justify-center px-3 py-2 text-xs font-medium text-[#76726B] hover:text-[#1C1A18] transition-colors"
                    >
                      <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                        />
                      </svg>
                      Nhắn tin với Shop Owner
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-3xl border border-[#E8E4DC]/80 p-8 sm:p-10 text-center shadow-2xs">
                <div className="w-14 h-14 rounded-full bg-[#F6F3EE] flex items-center justify-center mx-auto mb-4 text-[#76726B]">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.5"
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h3 className="font-serif text-lg sm:text-xl font-bold text-[#1C1A18] mb-1">
                  Chưa có đơn thuê nào đang sử dụng
                </h3>
                <p className="text-xs sm:text-sm text-[#76726B] max-w-md mx-auto mb-5 leading-relaxed">
                  Tài khoản của bạn hiện chưa có thiết bị nào trong kỳ thuê hoặc lưu ký. Hãy khám phá kho thiết bị chuẩn kiểm định ReUse để bắt đầu thuê.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <Link
                    to="/rent"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1C1A18] text-white text-xs font-semibold hover:bg-black transition-colors shadow-2xs"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                    <span>Khám phá kho thiết bị RENT</span>
                  </Link>
                  <Link
                    to="/rent/orders"
                    className="inline-flex items-center px-4 py-2.5 rounded-xl bg-[#F6F3EE] hover:bg-[#EFECE6] text-[#1C1A18] border border-[#E8E4DC] text-xs font-semibold transition-colors"
                  >
                    Xem lịch sử thuê
                  </Link>
                </div>
              </div>
            )}
          </section>

          {/* 4. RECENT THRIFT ORDERS */}
          <section data-reveal className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] uppercase tracking-wider font-bold text-[#76726B]">
                  Kho lưu trữ cá nhân
                </span>
                <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#1C1A18] tracking-tight">
                  Đơn mua THRIFT gần đây
                </h2>
              </div>
              <Link
                to="/thrift/orders"
                className="text-xs font-semibold text-[#1C1A18] hover:underline flex items-center gap-1"
              >
                <span>Xem tất cả ({thriftOrders.length} đơn)</span>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                </svg>
              </Link>
            </div>

            {formattedThriftOrders.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {formattedThriftOrders.map((order) => (
                  <div
                    key={order.id}
                    className="bg-white rounded-2xl border border-[#E8E4DC]/80 p-4 shadow-2xs flex flex-col justify-between hover:border-[#1C1A18]/40 transition-all group"
                  >
                    <div className="space-y-3">
                      <div className="w-full h-40 rounded-xl bg-[#F6F3EE] overflow-hidden relative border border-[#E8E4DC]">
                        <img
                          alt={order.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          src={order.image}
                        />
                        <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-[#5E6D5B] text-white text-[9px] font-bold">
                          {order.status}
                        </span>
                        {order.badge && (
                          <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-xs text-white text-[9px] font-mono">
                            {order.badge}
                          </span>
                        )}
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] text-[#76726B] font-mono">{order.id}</span>
                        <h4 className="font-serif font-bold text-sm text-[#1C1A18] leading-snug line-clamp-1">
                          {order.title}
                        </h4>
                        <p className="text-xs text-[#76726B]">{order.condition}</p>
                        <div className="text-sm font-bold text-[#1C1A18] pt-1">{formatVND(order.price)}</div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-[#E8E4DC] mt-3 flex items-center justify-between">
                      <span className="text-[10px] text-[#5E6D5B] font-semibold">{order.warrantyNote}</span>
                      <Link
                        to={order.detailUrl}
                        className="text-xs font-semibold text-[#1C1A18] hover:underline"
                      >
                        Xem chi tiết →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-3xl border border-[#E8E4DC]/80 p-8 sm:p-10 text-center shadow-2xs">
                <div className="w-14 h-14 rounded-full bg-[#F6F3EE] flex items-center justify-center mx-auto mb-4 text-[#76726B]">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.5"
                      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                    />
                  </svg>
                </div>
                <h3 className="font-serif text-lg sm:text-xl font-bold text-[#1C1A18] mb-1">
                  Chưa có đơn mua THRIFT nào gần đây
                </h3>
                <p className="text-xs sm:text-sm text-[#76726B] max-w-md mx-auto mb-5 leading-relaxed">
                  Các sản phẩm đồ cũ, lưu trữ cá nhân kèm chứng thư kiểm định Audit Bench bạn đã mua sẽ hiển thị tại đây.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <Link
                    to="/thrift"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1C1A18] text-white text-xs font-semibold hover:bg-black transition-colors shadow-2xs"
                  >
                    <span>Khám phá bộ sưu tập THRIFT</span>
                  </Link>
                </div>
              </div>
            )}
          </section>

          {/* 5. WISHLIST PREVIEW (Matched dynamically from Context) */}
          <section data-reveal className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] uppercase tracking-wider font-bold text-[#76726B]">
                  Bộ sưu tập quan tâm
                </span>
                <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#1C1A18] tracking-tight">
                  Sản phẩm yêu thích (Wishlist)
                </h2>
              </div>
              <Link
                to="/wishlist"
                className="text-xs font-semibold text-[#1C1A18] hover:underline flex items-center gap-1"
              >
                <span>Mở danh sách ({wishlistCount} mục)</span>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                </svg>
              </Link>
            </div>

            {matchedWishlistItems.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {matchedWishlistItems.slice(0, 4).map((item) => (
                  <div
                    key={item.id}
                    className="bg-white rounded-2xl border border-[#E8E4DC]/80 p-3.5 shadow-2xs hover:border-[#1C1A18]/40 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="w-full h-36 rounded-xl bg-[#F6F3EE] overflow-hidden relative border border-[#E8E4DC] mb-3">
                        <img alt={item.title} className="w-full h-full object-cover" src={item.image} />
                        <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-[#1C1A18] text-white text-[9px] font-bold">
                          {item.mode === 'rent' ? 'RENT' : 'THRIFT'}
                        </span>
                        {(item.availabilityBadge || item.availabilityLabel) && (
                          <span className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded bg-white/90 text-[#1C1A18] text-[9px] font-semibold">
                            {item.availabilityBadge || item.availabilityLabel}
                          </span>
                        )}
                      </div>
                      <h4 className="font-serif font-bold text-xs text-[#1C1A18] line-clamp-1">{item.title}</h4>
                      <p className="text-[11px] text-[#76726B] mt-0.5 line-clamp-1">{item.category} · {item.location}</p>
                      <div className="text-xs font-bold text-[#1C1A18] mt-1">
                        {formatVND(item.price)}
                        {item.priceUnit && (
                          <span className="font-normal text-[10px] text-[#76726B]"> {item.priceUnit}</span>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-[#E8E4DC] flex items-center gap-2">
                      <Link
                        to={item.href}
                        className="flex-1 py-1.5 rounded-lg bg-[#F6F3EE] hover:bg-[#1C1A18] hover:text-white text-[#1C1A18] text-[11px] font-semibold text-center transition-colors"
                      >
                        {item.mode === 'rent' ? 'Thuê ngay' : 'Xem đồ'}
                      </Link>
                      <button
                        type="button"
                        onClick={() => toggleWishlist(item.id)}
                        className="p-1.5 rounded-lg hover:bg-[#F6F3EE] text-rose-500 hover:text-rose-700 transition-colors cursor-pointer"
                        title="Bỏ yêu thích"
                      >
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-3xl border border-[#E8E4DC]/80 p-8 text-center shadow-2xs">
                <div className="w-12 h-12 rounded-full bg-[#F6F3EE] flex items-center justify-center mx-auto mb-3 text-stone-400">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.5"
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                </div>
                <h3 className="font-serif text-base font-bold text-[#1C1A18] mb-1">
                  Chưa có sản phẩm nào trong danh sách yêu thích
                </h3>
                <p className="text-xs text-[#76726B] max-w-sm mx-auto mb-4">
                  Bấm vào biểu tượng trái tim ở bất kỳ sản phẩm RENT hoặc THRIFT nào để lưu lại danh sách riêng của bạn.
                </p>
                <div className="flex items-center justify-center gap-3">
                  <Link
                    to="/rent"
                    className="px-4 py-2 rounded-xl bg-[#F6F3EE] hover:bg-[#1C1A18] hover:text-white text-[#1C1A18] text-xs font-semibold transition-colors"
                  >
                    Khám phá đồ thuê
                  </Link>
                  <Link
                    to="/thrift"
                    className="px-4 py-2 rounded-xl bg-[#F6F3EE] hover:bg-[#1C1A18] hover:text-white text-[#1C1A18] text-xs font-semibold transition-colors"
                  >
                    Xem đồ mua THRIFT
                  </Link>
                </div>
              </div>
            )}
          </section>

          {/* 6. CIRCULAR REUSE SECTION (Lifecycle Diagram) */}
          <section data-reveal className="rounded-3xl bg-[#F6F3EE]/80 border border-[#E8E4DC] p-6 sm:p-8 space-y-6">
            <div className="text-center max-w-xl mx-auto space-y-2">
              <span className="text-[11px] uppercase tracking-wider font-bold text-[#76726B]">
                Vòng tuần hoàn khép kín
              </span>
              <h2 className="font-serif text-2xl font-bold text-[#1C1A18] tracking-tight">
                Hành trình sản phẩm tại ReUse Hub
              </h2>
              <p className="text-xs text-[#76726B]">
                Mỗi lượt thuê và mua đồ cũ của bạn đóng góp trực tiếp vào mô hình kinh tế tuần hoàn, kéo dài tuổi thọ vật
                phẩm lên gấp 5 lần.
              </p>
            </div>

            {/* Visual Flow: 1 to 6 */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2">
              {CIRCULAR_LIFECYCLE_STEPS.map((step) => (
                <div
                  key={step.step}
                  className={`rounded-2xl p-4 border text-center flex flex-col items-center justify-between shadow-2xs ${
                    step.isHighlight
                      ? 'bg-[#EFECE6] border-[#1C1A18]/30'
                      : 'bg-white border-[#E8E4DC]'
                  }`}
                >
                  <span
                    className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center mb-2 ${
                      step.isHighlight ? 'bg-[#1C1A18] text-white' : 'bg-[#F6F3EE] text-[#1C1A18]'
                    }`}
                  >
                    {step.step}
                  </span>
                  <div className="text-xs font-bold text-[#1C1A18] font-serif">{step.title}</div>
                  <p
                    className={`text-[10px] mt-1 leading-tight ${
                      step.isHighlight ? 'text-[#1C1A18] font-medium' : 'text-[#76726B]'
                    }`}
                  >
                    {step.desc}
                  </p>
                </div>
              ))}
            </div>

            <div className="text-center pt-2">
              <Link
                to="/how-it-works"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1C1A18] hover:underline"
              >
                <span>Tìm hiểu chi tiết cơ chế vận hành của ReUse Hub →</span>
              </Link>
            </div>
          </section>

          {/* 7. RECOMMENDED PRODUCTS (Personalized Curated RENT & THRIFT) */}
          <section data-reveal className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] uppercase tracking-wider font-bold text-[#76726B]">
                  Gợi ý dành riêng cho bạn
                </span>
                <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#1C1A18] tracking-tight">
                  Thiết bị &amp; Đồ lưu trữ đề xuất
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  to="/rent"
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white border border-[#E8E4DC] text-[#1C1A18] hover:bg-[#F6F3EE]"
                >
                  Xem RENT
                </Link>
                <Link
                  to="/thrift"
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white border border-[#E8E4DC] text-[#1C1A18] hover:bg-[#F6F3EE]"
                >
                  Xem THRIFT
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {RECOMMENDED_DASHBOARD_ITEMS.map((rec) => (
                <Link
                  key={rec.id}
                  to={rec.href}
                  className="bg-white rounded-2xl border border-[#E8E4DC]/80 p-3.5 shadow-2xs hover:border-[#1C1A18]/40 transition-all flex flex-col justify-between group"
                >
                  <div>
                    <div className="w-full h-40 rounded-xl bg-[#F6F3EE] overflow-hidden relative border border-[#E8E4DC] mb-3">
                      <img
                        alt={rec.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        src={rec.image}
                      />
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-[#1C1A18] text-white text-[9px] font-bold">
                        {rec.mode === 'rent' ? 'RENT' : 'THRIFT'}
                      </span>
                      {rec.badgeType === 'top' ? (
                        <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-black/60 text-white text-[9px] font-mono">
                          {rec.badge}
                        </span>
                      ) : (
                        <span className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded bg-white/90 text-[#1C1A18] text-[9px] font-semibold">
                          {rec.badge}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-[#76726B] uppercase tracking-wider font-semibold">
                      {rec.categoryLabel}
                    </span>
                    <h4 className="font-serif font-bold text-xs text-[#1C1A18] group-hover:underline line-clamp-1 mt-0.5">
                      {rec.title}
                    </h4>
                    <p className="text-[11px] text-[#76726B] mt-0.5 line-clamp-1">{rec.subtitle}</p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-[#E8E4DC] flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-[#1C1A18]">{formatVND(rec.price)}</span>
                      {rec.priceUnit && (
                        <span className="text-[10px] text-[#76726B]"> {rec.priceUnit}</span>
                      )}
                    </div>
                    <span className="text-[10px] font-semibold text-[#5E6D5B]">{rec.meta}</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* 8. QUICK ACTIONS CALLOUT */}
          <section
            data-reveal
            className="rounded-3xl bg-[#1C1A18] text-white p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
          >
            <div className="space-y-1.5 max-w-xl">
              <span className="text-[10px] uppercase tracking-widest text-[#9C9589] font-bold">
                Thao tác nhanh
              </span>
              <h3 className="font-serif text-xl sm:text-2xl font-bold text-white tracking-tight">
                Bạn đang tìm kiếm thiết bị cho dự án mới?
              </h3>
              <p className="text-xs text-[#C5BFA8] leading-relaxed">
                Duyệt kho đồ thuê được kiểm định nghiêm ngặt bởi Shop Owner duy nhất, hoặc xem qua giỏ hàng đang chờ xử
                lý của bạn.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <Link
                to="/rent"
                className="px-4 py-2.5 rounded-xl bg-white text-[#1C1A18] text-xs font-bold hover:bg-[#F3EFE8] transition-colors"
              >
                Khám phá RENT →
              </Link>
              <Link
                to="/thrift"
                className="px-4 py-2.5 rounded-xl bg-[#1C1A18] border border-white/30 text-white text-xs font-bold hover:bg-white/10 transition-colors"
              >
                Mua đồ THRIFT
              </Link>
              <Link
                to="/cart"
                className="px-4 py-2.5 rounded-xl bg-[#1C1A18] border border-white/30 text-white text-xs font-bold hover:bg-white/10 transition-colors"
              >
                Mở giỏ hàng
              </Link>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default UserDashboard;
