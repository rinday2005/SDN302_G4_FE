import React, { useState, useMemo, useContext, useEffect } from 'react';
import { Link, useNavigate, useParams, useLocation } from 'react-router-dom';
import { AuthContext } from '../../../context/auth-context';
import { useCartWishlist } from '../../../context/CartWishlistContext';
import {
  DEFAULT_CHECKOUT_THRIFT_ITEMS,
  THRIFT_SHIPPING_FEE,
} from '../../data/thrift/thriftCheckoutData';
import { redirectToVnPayGateway } from '../../../services/payment.api';
import {
  createThriftOrderApi,
  updateThriftOrderStatusApi,
  type ThriftOrderApi,
} from '../../../services/thriftOrder.api';

export const ThriftCheckout: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useContext(AuthContext);
  const user = auth?.user;

  const { cart, removeFromCart } = useCartWishlist();

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // ── 1. AUTH GUARD: Check if logged in, redirect to /login if not ──
  useEffect(() => {
    if (!auth?.token && !user) {
      navigate('/login', { replace: true, state: { from: location.pathname } });
    }
  }, [auth?.token, user, navigate, location.pathname]);

  // ── 2. THRIFT ITEMS SELECTION (From Cart or Route ID or Data Fallback) ──
  const thriftItems = useMemo(() => {
    // 1. Filter all THRIFT items currently in cart
    const cartThrift = cart.filter((item) => item.mode === 'thrift');

    // 2. If specific item IDs were passed from Cart selection
    const passedIds = (location.state as { selectedItemIds?: string[] } | null)?.selectedItemIds;
    if (passedIds && passedIds.length > 0) {
      const selected = cartThrift.filter((item) => passedIds.includes(item.id));
      if (selected.length > 0) return selected;
    }

    // 3. If param :id is provided and found in cart
    if (id) {
      const matched = cartThrift.filter((item) => item.id === id);
      if (matched.length > 0) return matched;
    }

    // 4. If cart has any thrift items, use all of them
    if (cartThrift.length > 0) {
      return cartThrift;
    }

    // 5. Default rich demo items from data file if cart was empty
    return DEFAULT_CHECKOUT_THRIFT_ITEMS;
  }, [cart, id, location.state]);

  // ── 3. RESERVATION COUNTDOWN TIMER (14:57) ──
  const [secondsRemaining, setSecondsRemaining] = useState(14 * 60 + 57);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // ── 4. CUSTOMER PROFILE & DELIVERY ADDRESS ──
  const storedProfile = useMemo(() => {
    try {
      const uId = user?._id || user?.id;
      const raw = uId ? localStorage.getItem(`user_profile_${uId}`) : null;
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }, [user]);

  const [consigneeName, setConsigneeName] = useState(() => {
    return storedProfile.fullName || user?.fullName || 'Khách hàng';
  });

  const [phone, setPhone] = useState(() => {
    return storedProfile.phone || user?.phoneNumber || user?.phone || '';
  });

  const [shippingAddress, setShippingAddress] = useState(() => {
    if (storedProfile.address) {
      const addr = storedProfile.address;
      if (typeof addr === 'string') return addr;
      const parts = [addr.detail, addr.ward, addr.district, addr.province].filter(Boolean);
      if (parts.length > 0) return parts.join(', ');
    }
    return '48 Bạch Đằng, Tầng 4 Archive Suite, Phường Hải Châu 1, Quận Hải Châu, TP. Đà Nẵng, Việt Nam';
  });

  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [tempAddress, setTempAddress] = useState(shippingAddress);
  const [tempConsignee, setTempConsignee] = useState(consigneeName);
  const [tempPhone, setTempPhone] = useState(phone);

  const consigneeInitials = useMemo(() => {
    const parts = consigneeName.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return consigneeName.slice(0, 2).toUpperCase() || 'ER';
  }, [consigneeName]);

  const handleSaveAddress = () => {
    setShippingAddress(tempAddress);
    setConsigneeName(tempConsignee);
    setPhone(tempPhone);
    setIsEditingAddress(false);
  };

  // ── 5. FINANCIAL CALCULATIONS ──
  const formatCurrency = (val: number) => {
    return val.toLocaleString('vi-VN') + '₫';
  };

  const itemizedList = useMemo(() => {
    return thriftItems.map((item, index) => {
      const qty = item.quantity || 1;
      const price = item.price;
      const totalItemPrice = price * qty;
      const code = 'code' in item ? (item.code as string) : `#TRF-${9040 + index}`;
      const grade = 'grade' in item ? (item.grade as string) : (item.gradeBadge || 'Mint- 98%');
      const category = 'category' in item ? (item.category as string) : (item.categoryLabel || 'Hiện vật độc bản');
      const conditionNote =
        'conditionNote' in item
          ? (item.conditionNote as string)
          : `${item.title} · Chuẩn lưu trữ Provenance Vault`;
      const specDetails =
        'specDetails' in item
          ? (item.specDetails as string)
          : (item.sizeOrSpec || 'Kèm chứng thư số bảo chứng độc bản 1-of-1');
      const warranty = 'warranty' in item ? (item.warranty as string) : 'Bảo hành cơ học: 12 tháng';
      const vaultOrigin = 'vaultOrigin' in item ? (item.vaultOrigin as string) : 'Curated Archive Tokyo';

      return {
        ...item,
        qty,
        price,
        totalItemPrice,
        code,
        grade,
        category,
        conditionNote,
        specDetails,
        warranty,
        vaultOrigin,
      };
    });
  }, [thriftItems]);

  const itemsSubtotal = useMemo(() => {
    return itemizedList.reduce((sum, item) => sum + item.totalItemPrice, 0);
  }, [itemizedList]);

  const grandTotal = itemsSubtotal + THRIFT_SHIPPING_FEE;

  // Session Order Code
  const orderSessionCode = '#TRF-2026-9048';

  // ── 6. DIRECT VNPAY SANDBOX & MODAL SIMULATION ──
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVnPayModalOpen, setIsVnPayModalOpen] = useState(false);
  const [isSimulatingSuccess, setIsSimulatingSuccess] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<ThriftOrderApi | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const LEGACY_SLUG_TO_OBJECT_ID: Record<string, string> = {
    'vintage-leather-jacket': '6ad273b0f22df3063ffd9985',
    'classic-sneakers': '6ad273b0f22df3063ffd9986',
    'canon-eos-camera-kit': '6ad273b0f22df3063ffd9987',
    'minimal-backpack': '6ad273b0f22df3063ffd9988',
    'leica-m6-classic': '6ad273b0f22df3063ffd9989',
    'contax-t2-titanium': '6ad286f6f507857852155c74',
    'teenage-engineering-op1': '6ad286f6f507857852155c8a',
    'dam-da-hoi-sequin': '6ad286f6f507857852155c7d',
    'fujifilm-x100v-silver': '6ad286f6f507857852155c73',
    'ao-blazer-linen-oversized': '6ad286f6f507857852155c82',
    'giay-derby-da-bo': '6ad286f6f507857852155c7c',
    'sony-alpha-a7c': '6ad286f6f507857852155c75',
    'tui-tote-canvas-vintage': '6ad286f6f507857852155c88',
    'ban-phim-co-custom': '6ad286f6f507857852155c8b',
    'dam-lua-to-tam': '6ad286f6f507857852155c80',
  };

  const ensureMongoObjectId = (rawId?: string): string => {
    if (!rawId) return '6ad273b0f22df3063ffd9985';
    const clean = rawId.trim();
    if (/^[0-9a-fA-F]{24}$/.test(clean)) {
      return clean;
    }
    if (LEGACY_SLUG_TO_OBJECT_ID[clean]) {
      return LEGACY_SLUG_TO_OBJECT_ID[clean];
    }
    return '6ad273b0f22df3063ffd9985';
  };

  // Helper to ensure order exists in DB
  const getOrCreateOrder = async () => {
    if (createdOrder) return createdOrder;

    const payload = {
      items: itemizedList.map((item) => ({
        listingId: ensureMongoObjectId(item.id),
        quantity: item.qty,
        productName: item.title,
        price: item.price,
        imageUrl: item.image,
        condition: item.grade,
        vaultOrigin: item.vaultOrigin,
        warranty: item.warranty,
      })),
      shippingAddress: {
        recipientName: consigneeName,
        recipientPhone: phone,
        detail: shippingAddress,
        province: 'Đà Nẵng',
        district: 'Hải Châu',
        ward: 'Hải Châu 1',
      },
      paymentMethod: 'VNPAY',
    };

    const orderRes = await createThriftOrderApi(payload);
    setCreatedOrder(orderRes);

    // Clear checked thrift items from cart
    thriftItems.forEach((ti) => {
      removeFromCart(ti.id);
    });

    // Save to localStorage for instant client cache
    try {
      const uId = user?._id || user?.id;
      const key = uId ? `user_thrift_orders_${uId}` : 'user_thrift_orders';
      const existing = JSON.parse(localStorage.getItem(key) || '[]');
      localStorage.setItem(key, JSON.stringify([orderRes, ...existing]));

      // Sync immediately to SHOP_THRIFT_ORDERS_DATA for Shop Owner view
      const shopKey = 'SHOP_THRIFT_ORDERS_DATA';
      const shopExisting = JSON.parse(localStorage.getItem(shopKey) || '[]');
      const existsInShop = shopExisting.some(
        (o: { id?: string; _dbId?: string }) =>
          o.id === orderRes.orderCode ||
          o.id === `#${orderRes.orderCode}` ||
          o._dbId === orderRes._id
      );
      if (!existsInShop) {
        const mappedShopOrder = {
          id: orderRes.orderCode?.startsWith('#') ? orderRes.orderCode : `#${orderRes.orderCode || orderRes._id}`,
          _dbId: orderRes._id,
          createdAt: new Date().toLocaleDateString('vi-VN'),
          rawCreatedAt: Date.now(),
          buyer: {
            name: consigneeName,
            phone,
            email: user?.email || 'buyer@reuse.vn',
            shippingAddress,
            kycTier: 'KYC Xác thực CCCD · TIER 2',
          },
          listings: itemizedList.map((item, idx) => ({
            id: item.id || `item-${idx}`,
            title: item.title,
            serialNumber: `#GARMENT-${String(item.id).slice(-6).toUpperCase()}`,
            grade: item.grade || 'Grade 1 · Rất tốt (98%)',
            price: item.price,
            imageUrl: item.image,
          })),
          pricing: {
            subtotal: itemsSubtotal,
            shippingFee: THRIFT_SHIPPING_FEE,
            totalAmount: grandTotal,
          },
          status: 'PAID',
          shippingInfo: {
            carrier: 'Bưu tá Nanuk Garment Express',
            trackingCode: orderRes.trackingCode || `#NK-${Math.floor(100000 + Math.random() * 900000)}`,
            dispatchedAt: undefined,
            sealCode: orderRes.sealCode || `SEAL-ATELIER-${Math.floor(1000 + Math.random() * 9000)}`,
          },
        };
        localStorage.setItem(shopKey, JSON.stringify([mappedShopOrder, ...shopExisting]));
      }

      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new Event('rental_order_updated'));
    } catch {
      // ignore
    }

    return orderRes;
  };

  const handleVNPayCheckout = async () => {
    setIsSubmitting(true);

    try {
      let orderRes: ThriftOrderApi | null = createdOrder;
      try {
        orderRes = await getOrCreateOrder();
      } catch (err) {
        console.warn('Initial order creation warning, redirecting to VNPay Gateway directly:', err);
      }

      // Clear checked thrift items from cart
      thriftItems.forEach((ti) => {
        removeFromCart(ti.id);
      });

      const effectiveOrderCode = (orderRes?.orderCode || orderSessionCode).replace('#', '');
      const effectiveAmount = orderRes?.totalAmount || grandTotal;

      await redirectToVnPayGateway({
        orderId: orderRes?._id,
        orderCode: effectiveOrderCode,
        amount: effectiveAmount,
        type: 'THRIFT',
        items: itemizedList.map((item) => ({
          listingId: item.id,
          productId: item.id,
          productName: item.title,
          price: item.price,
          quantity: item.qty,
          imageUrl: item.image,
          condition: item.grade,
          vaultOrigin: item.vaultOrigin,
        })),
        shippingAddress: {
          recipientName: consigneeName,
          recipientPhone: phone,
          detail: shippingAddress,
          province: 'Đà Nẵng',
          district: 'Hải Châu',
          ward: 'Hải Châu 1',
        },
        shippingFee: THRIFT_SHIPPING_FEE,
      });
    } catch (error: unknown) {
      console.error('Error redirecting to VNPay:', error);
      setIsSubmitting(false);
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      const errMsg =
        err.response?.data?.message ||
        err.message ||
        'Có lỗi khi tạo liên kết thanh toán VNPay Sandbox. Vui lòng thử lại!';
      navigate(`/payment-failed?orderCode=${encodeURIComponent(orderSessionCode)}&message=${encodeURIComponent(errMsg)}`);
    }
  };

  const handleOpenVnPayModal = async () => {
    setIsSubmitting(true);
    try {
      await getOrCreateOrder();
      setIsVnPayModalOpen(true);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      showToast(e.response?.data?.message || e.message || 'Không thể khởi tạo đơn hàng.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSimulatePaymentSuccess = async () => {
    setIsSimulatingSuccess(true);
    try {
      const orderRes = await getOrCreateOrder();

      // Update status to PAID in BE
      await updateThriftOrderStatusApi(orderRes._id, { status: 'PAID' });

      // Update in localStorage
      try {
        const uId = user?._id || user?.id;
        const key = uId ? `user_thrift_orders_${uId}` : 'user_thrift_orders';
        const raw = localStorage.getItem(key);
        if (raw) {
          const list: ThriftOrderApi[] = JSON.parse(raw);
          const updated = list.map((o) =>
            o._id === orderRes._id || o.orderCode === orderRes.orderCode
              ? { ...o, status: 'PAID', paymentStatus: 'PAID' }
              : o
          );
          localStorage.setItem(key, JSON.stringify(updated));
          window.dispatchEvent(new Event('storage'));
          window.dispatchEvent(new Event('rental_order_updated'));
        }
        // Also update in SHOP_THRIFT_ORDERS_DATA
        const shopKey = 'SHOP_THRIFT_ORDERS_DATA';
        const shopRaw = localStorage.getItem(shopKey);
        if (shopRaw) {
          const shopList = JSON.parse(shopRaw);
          const updatedShop = shopList.map((o: { id?: string; _dbId?: string; status?: string }) =>
            o._dbId === orderRes._id ||
            o.id === orderRes.orderCode ||
            o.id === `#${orderRes.orderCode}`
              ? { ...o, status: 'PAID' }
              : o
          );
          localStorage.setItem(shopKey, JSON.stringify(updatedShop));
        }
      } catch {
        // ignore
      }

      setIsVnPayModalOpen(false);
      showToast('Giao dịch THRIFT thành công! Đã cấp chứng thư sở hữu Provenance Vault™.');
      setTimeout(() => {
        navigate(`/thrift/orders?orderCode=${encodeURIComponent(orderRes.orderCode)}`);
      }, 1000);
    } catch (err) {
      console.error(err);
      setIsSimulatingSuccess(false);
      showToast('Có lỗi xảy ra khi xác thực Smart Escrow.');
    }
  };

  return (
    <div className="bg-[#FBF9F5] text-[#1C1C18] font-sans antialiased selection:bg-[#D8E3CE] selection:text-[#5B6655] min-h-screen flex flex-col">
      {/* ── TOP ANNOUNCEMENT BAR ── */}
      <aside className="bg-[#141310] text-[#E7E1DD] text-[11px] tracking-wider font-semibold uppercase py-2 text-center px-4">
        RENT WHAT YOU NEED. REUSE WHAT ALREADY EXISTS. COMPLIMENTARY INSURED SHIPPING ON VERIFIED RENTALS.
      </aside>

      {/* ── BANNER: XÁC NHẬN BẢO CHỨNG DI SẢN ── */}
      <div className="w-full bg-[#D8E3CE]/40 text-[#5B6655] px-4 sm:px-8 py-2.5 flex flex-wrap items-center justify-between gap-3 border-b border-[#E6E2DB]">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[#576151] text-[20px]">verified</span>
          <p className="text-[11px] uppercase tracking-wider font-bold text-[#1C1C18]">
            XÁC NHẬN SỞ HỮU TUẦN HOÀN · BẢO CHỨNG DI SẢN PROVENANCE VAULT™
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-[#576151] text-[11px] font-bold">
          <span className="material-symbols-outlined text-[16px]">lock</span>
          <span>KÝ QUỸ ESCROW AN TOÀN 72H</span>
        </div>
      </div>

      {/* ── HEADER ĐƠN MUA THRIFT ── */}
      <section className="w-full px-4 sm:px-8 pt-8 pb-6 border-b border-[#E6E2DB]/80 bg-[#FBF9F5]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#EBE8E1] text-[#4A463F] mb-2.5 text-[11px] font-bold uppercase tracking-widest">
              <span>GIAO DỊCH THRIFT · SỞ HỮU VĨNH VIỄN</span>
              <span>•</span>
              <span>MÃ PHIÊN: {orderSessionCode}</span>
            </div>
            <h1 className="font-serif text-3xl md:text-4xl text-[#141310] font-bold tracking-tight">
              Thanh toán Đơn mua THRIFT
            </h1>
            <p className="text-xs sm:text-sm text-[#4A463F] max-w-2xl mt-1.5 leading-relaxed">
              Thủ tục xác lập quyền sở hữu vĩnh viễn các hiện vật tuyển chọn độc bản, bảo hiểm vận chuyển bọc thép và cấp phát chứng thư xuất xứ số kèm niêm phong vật lý.
            </p>
          </div>

          {/* Countdown Hold Timer */}
          <div className="flex items-center gap-3 bg-[#F7F3EC] px-4 py-2.5 rounded-xl shadow-xs border border-[#E6E2DB] self-start md:self-auto">
            <span className="w-2.5 h-2.5 rounded-full bg-[#576151] animate-pulse" />
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-[#7B766F] tracking-wide">
                Tình trạng giữ chỗ
              </span>
              <span className="text-sm font-bold text-[#141310] tracking-tight">
                Tự động giữ: <span className="text-[#576151] font-mono">{formatTimer(secondsRemaining)}</span>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── MAIN CONTENT: ASYMMETRIC 2-COLUMN LAYOUT ── */}
      <main className="w-full px-4 sm:px-8 py-8 flex-1">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT COLUMN: ITEMS & SHIPPING (7 COLS) */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            {/* MỤC 1: Danh sách hiện vật THRIFT */}
            <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-xs border border-[#E6E2DB]">
              <div className="flex items-center justify-between pb-4 border-b border-[#F1EDE6]">
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-[#141310] text-white flex items-center justify-center text-xs font-bold shrink-0">
                    01
                  </span>
                  <div>
                    <h2 className="font-serif text-lg font-bold text-[#141310]">
                      Hiện vật THRIFT đã tuyển chọn
                    </h2>
                    <p className="text-xs text-[#7B766F]">
                      {itemizedList.length} hiện vật lưu trữ độc bản 1-of-1 · Chuyển nhượng quyền sở hữu hoàn toàn
                    </p>
                  </div>
                </div>
                <span className="text-[11px] px-2.5 py-1 rounded bg-[#D8E3CE]/60 text-[#5B6655] uppercase font-bold tracking-wider">
                  ĐÃ THẨM ĐỊNH MINT/A
                </span>
              </div>

              {/* Items List */}
              <div className="flex flex-col gap-4 mt-4">
                {itemizedList.map((item) => (
                  <article
                    key={item.id}
                    className="bg-[#F7F3EC] rounded-xl p-4 flex flex-col sm:flex-row gap-4 transition-all hover:shadow-xs border border-[#E6E2DB]/70"
                  >
                    {/* Item Thumbnail */}
                    <div className="sm:w-40 h-40 rounded-xl overflow-hidden shrink-0 relative bg-[#EBE8E1]">
                      <img
                        alt={item.title}
                        className="w-full h-full object-cover transition-transform hover:scale-105"
                        src={item.image}
                      />
                      <span className="absolute top-2 left-2 bg-[#141310]/90 text-white text-[9px] tracking-wider px-2 py-0.5 rounded font-bold uppercase backdrop-blur-xs">
                        Độc bản 1-of-1
                      </span>
                      <span className="absolute bottom-2 right-2 bg-white/95 text-[#1C1C18] text-[9px] font-bold px-2 py-0.5 rounded shadow-2xs">
                        {item.grade}
                      </span>
                    </div>

                    {/* Item Meta */}
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-[11px] uppercase tracking-wider text-[#576151] font-bold">
                            {item.category} · Seri {item.code}
                          </span>
                          <span className="text-xs text-[#7B766F] font-mono font-semibold">
                            SL: {item.qty}
                          </span>
                        </div>
                        <h3 className="font-serif text-base font-bold text-[#141310] mt-1 leading-snug">
                          {item.title}
                        </h3>
                        <p className="text-xs text-[#7B766F] mt-1 leading-relaxed">
                          {item.conditionNote}
                        </p>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-[#7B766F] text-[12px]">
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-[15px] text-[#576151]">
                              workspace_premium
                            </span>
                            {item.warranty}
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-[15px] text-[#576151]">
                              domain_verification
                            </span>
                            Lưu ký: {item.vaultOrigin}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-baseline justify-between mt-4 pt-2 border-t border-[#E6E2DB]/60">
                        <span className="text-[11px] uppercase tracking-wider text-[#7B766F] font-semibold">
                          Giá sở hữu vĩnh viễn
                        </span>
                        <span className="font-serif text-lg font-bold text-[#141310]">
                          {formatCurrency(item.totalItemPrice)}
                        </span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>

            {/* MỤC 2: Địa chỉ giao nhận & Vận chuyển bảo chứng */}
            <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-xs border border-[#E6E2DB]">
              <div className="flex items-center justify-between pb-4 border-b border-[#F1EDE6]">
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-[#141310] text-white flex items-center justify-center text-xs font-bold shrink-0">
                    02
                  </span>
                  <div>
                    <h2 className="font-serif text-lg font-bold text-[#141310]">
                      Địa chỉ giao nhận &amp; Vận chuyển bảo chứng
                    </h2>
                    <p className="text-xs text-[#7B766F]">
                      Consignee &amp; Transit Address · Giám sát hành trình chuỗi hành lý
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setTempAddress(shippingAddress);
                    setTempConsignee(consigneeName);
                    setTempPhone(phone);
                    setIsEditingAddress(true);
                  }}
                  className="text-xs text-[#576151] hover:text-[#141310] uppercase font-bold tracking-wider cursor-pointer underline"
                >
                  Thay đổi
                </button>
              </div>

              {/* Thông tin người nhận KYC */}
              <div className="bg-[#F7F3EC] rounded-xl p-4 mt-4 border border-[#E6E2DB]/70">
                <div className="flex items-start justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#D8E3CE] text-[#5B6655] flex items-center justify-center font-bold font-serif text-sm">
                      {consigneeInitials}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-[#141310]">{consigneeName}</span>
                        <span className="px-2 py-0.5 rounded bg-[#576151] text-white text-[10px] uppercase font-bold">
                          Tier 2 KYC
                        </span>
                      </div>
                      <p className="text-xs text-[#7B766F] font-mono mt-0.5">{phone}</p>
                    </div>
                  </div>
                  <div className="inline-flex items-center gap-1 text-[#576151] text-xs font-semibold">
                    <span className="material-symbols-outlined text-[16px]">verified_user</span>
                    <span>Hồ sơ lưu trữ tin cậy</span>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-[#E6E2DB]/60 flex items-start gap-2 text-xs">
                  <span className="material-symbols-outlined text-[#7B766F] mt-0.5 text-[18px]">
                    location_on
                  </span>
                  <div className="text-[#1C1C18]">
                    <p className="font-semibold">{shippingAddress}</p>
                  </div>
                </div>
              </div>

              {/* Phương thức vận chuyển chuyên dụng */}
              <div className="mt-4 bg-[#F1EDE6] rounded-xl p-4 border border-[#E6E2DB]">
                <div className="flex items-start justify-between gap-3 flex-col sm:flex-row">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#EBE8E1] text-[#141310] flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[22px]">local_shipping</span>
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[#141310]">
                        Bưu tá bảo hiểm bọc thép White-Glove Insured Secondhand Courier
                      </h3>
                      <p className="text-xs text-[#7B766F] mt-1 leading-relaxed">
                        Gộp chung toàn bộ {itemizedList.length} hiện vật trong vali đệm bảo vệ phom dáng, niêm phong thẻ sáp Atelier, định vị thời gian thực và bàn giao tận tay kèm hướng dẫn mặc thử.
                      </p>
                      <div className="flex flex-wrap gap-4 mt-2 text-[11px] text-[#7B766F] uppercase font-semibold">
                        <span className="inline-flex items-center gap-1 text-[#576151]">
                          <span className="material-symbols-outlined text-[14px]">shield</span>
                          Bảo hiểm 100% giá trị
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">schedule</span>
                          Dự kiến nhận: 24 - 36h
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0 sm:pl-4 self-end sm:self-center">
                    <span className="font-serif font-bold text-base text-[#141310]">
                      {formatCurrency(THRIFT_SHIPPING_FEE)}
                    </span>
                    <p className="text-[10px] text-[#7B766F] uppercase font-semibold">
                      Phí gộp toàn đơn
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* MỤC 3: Cam kết quyền lợi người mua THRIFT */}
            <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-xs border border-[#E6E2DB]">
              <div className="flex items-center gap-3 pb-4 border-b border-[#F1EDE6]">
                <span className="w-7 h-7 rounded-full bg-[#141310] text-white flex items-center justify-center text-xs font-bold shrink-0">
                  03
                </span>
                <div>
                  <h2 className="font-serif text-lg font-bold text-[#141310]">
                    Quyền lợi Người sở hữu &amp; Cơ chế Ký quỹ
                  </h2>
                  <p className="text-xs text-[#7B766F]">
                    Minh bạch tuyệt đối cho giao dịch mua đứt hiện vật sưu tầm
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="bg-[#F7F3EC] p-4 rounded-xl flex flex-col justify-between border border-[#E6E2DB]/60">
                  <div>
                    <span className="material-symbols-outlined text-[#576151] text-[24px]">
                      hourglass_top
                    </span>
                    <h4 className="text-xs font-bold text-[#141310] mt-2">
                      72 Giờ Kiểm Tra Độc Lập
                    </h4>
                    <p className="text-[11px] text-[#7B766F] mt-1 leading-relaxed">
                      Tiền được giữ an toàn tại Smart Escrow cho đến khi bạn mở niêm phong và đối soát đúng chuẩn mô tả.
                    </p>
                  </div>
                  <span className="text-[10px] text-[#576151] font-bold uppercase tracking-wider mt-3">
                    Được kích hoạt tự động
                  </span>
                </div>

                <div className="bg-[#F7F3EC] p-4 rounded-xl flex flex-col justify-between border border-[#E6E2DB]/60">
                  <div>
                    <span className="material-symbols-outlined text-[#576151] text-[24px]">
                      token
                    </span>
                    <h4 className="text-xs font-bold text-[#141310] mt-2">
                      Chứng thư Số &amp; Tem NFC
                    </h4>
                    <p className="text-[11px] text-[#7B766F] mt-1 leading-relaxed">
                      Cấp mã băm Blockchain và hồ sơ lý lịch kỹ thuật số trong Provenance Vault vĩnh viễn.
                    </p>
                  </div>
                  <span className="text-[10px] text-[#576151] font-bold uppercase tracking-wider mt-3">
                    Miễn phí (0₫)
                  </span>
                </div>

                <div className="bg-[#F7F3EC] p-4 rounded-xl flex flex-col justify-between border border-[#E6E2DB]/60">
                  <div>
                    <span className="material-symbols-outlined text-[#576151] text-[24px]">
                      package_2
                    </span>
                    <h4 className="text-xs font-bold text-[#141310] mt-2">
                      Circular Zero-Waste Crate
                    </h4>
                    <p className="text-[11px] text-[#7B766F] mt-1 leading-relaxed">
                      Kiện hộp lưu kho bằng vật liệu tái chế cao cấp chống oxy hoá phục vụ bảo quản dài hạn.
                    </p>
                  </div>
                  <span className="text-[10px] text-[#576151] font-bold uppercase tracking-wider mt-3">
                    Miễn phí (0₫)
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: FINANCIAL LEDGER & VNPAY GATEWAY (5 COLS) */}
          <div className="lg:col-span-5 flex flex-col gap-6 lg:sticky lg:top-28">
            {/* MỤC 4: Bảng thanh toán (Settlement Ledger) */}
            <div className="bg-white rounded-2xl p-6 shadow-md border border-[#E6E2DB]">
              <div className="flex items-center justify-between pb-4 border-b border-[#F1EDE6]">
                <h2 className="font-serif text-xl font-bold text-[#141310]">Bảng thanh toán</h2>
                <span className="text-[11px] uppercase tracking-wider text-[#7B766F] font-semibold">
                  Sở hữu vĩnh viễn
                </span>
              </div>

              {/* Chi tiết từng khoản */}
              <div className="flex flex-col gap-3 pt-3 text-xs">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-[#1C1C18]">
                      Tổng tiền hiện vật ({itemizedList.length} món)
                    </p>
                    <p className="text-[11px] text-[#7B766F] truncate max-w-[210px]">
                      {itemizedList.map((i) => i.title.split(' ')[0]).join(' + ')}
                    </p>
                  </div>
                  <span className="font-bold text-[#141310] font-mono text-sm">
                    {formatCurrency(itemsSubtotal)}
                  </span>
                </div>

                <div className="flex justify-between items-center pt-1 border-t border-[#F1EDE6]">
                  <div>
                    <p className="font-medium text-[#1C1C18]">Vận chuyển bảo chứng bọc thép</p>
                    <p className="text-[11px] text-[#7B766F]">Áp dụng trọn gói cho toàn bộ đơn hàng</p>
                  </div>
                  <span className="font-bold text-[#141310] font-mono">
                    {formatCurrency(THRIFT_SHIPPING_FEE)}
                  </span>
                </div>

                <div className="flex justify-between items-center pt-1 border-t border-[#F1EDE6]">
                  <div>
                    <p className="font-medium text-[#1C1C18]">Chứng thư số Provenance Vault™</p>
                    <p className="text-[11px] text-[#7B766F]">Cấp thẻ NFC &amp; sổ lưu trữ vĩnh viễn</p>
                  </div>
                  <span className="text-[11px] uppercase font-bold text-[#576151]">
                    0₫ (Miễn phí)
                  </span>
                </div>

                <div className="flex justify-between items-center pt-1 border-t border-[#F1EDE6]">
                  <div>
                    <p className="font-medium text-[#1C1C18]">Bảo hiểm lưu ký ký quỹ Escrow</p>
                    <p className="text-[11px] text-[#7B766F]">Bảo vệ 72h mặc thử &amp; đối kiểm phom dáng</p>
                  </div>
                  <span className="text-[11px] uppercase font-bold text-[#576151]">
                    0₫ (Đài thọ)
                  </span>
                </div>

                {/* Tổng cộng nổi bật */}
                <div className="mt-4 pt-4 bg-[#F7F3EC] rounded-xl p-4 border border-[#E6E2DB]">
                  <div className="flex justify-between items-baseline">
                    <div>
                      <span className="text-[11px] uppercase tracking-wider text-[#7B766F] block font-semibold">
                        Tổng thanh toán đơn hàng
                      </span>
                      <span className="text-[11px] text-[#576151] font-semibold">
                        Đã bao gồm thuế &amp; phí vận chuyển
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-serif text-2xl font-bold text-[#141310] tracking-tight">
                        {formatCurrency(grandTotal)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* MỤC 5: Cổng thanh toán VNPay */}
              <div className="mt-6 pt-5 border-t border-[#F1EDE6]">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-[11px] uppercase tracking-wider text-[#141310] font-bold flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-[#576151]">
                      account_balance_wallet
                    </span>
                    PHƯƠNG THỨC THANH TOÁN
                  </label>
                  <span className="text-[11px] text-[#576151] font-semibold flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">lock</span>
                    256-BIT HSM
                  </span>
                </div>

                {/* Cổng VNPay Selected Card */}
                <div className="bg-[#F1EDE6] rounded-xl p-4 border-2 border-[#141310]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center font-bold text-[#141310] shadow-2xs text-xs font-mono">
                        VN<span className="text-rose-600 font-extrabold">PAY</span>
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-[#141310]">Cổng Thanh Toán VNPay</h3>
                        <p className="text-[11px] text-[#7B766F]">
                          VNPay-QR, Napas 24/7, Visa, Mastercard, JCB
                        </p>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-[#576151] text-[22px]">
                      check_circle
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-2 mt-3 pt-1 text-center text-[10px]">
                    <div className="bg-white py-1.5 rounded text-[#7B766F] font-semibold shadow-2xs">
                      VNPay QR
                    </div>
                    <div className="bg-white py-1.5 rounded text-[#7B766F] font-semibold shadow-2xs">
                      Napas 247
                    </div>
                    <div className="bg-white py-1.5 rounded text-[#7B766F] font-semibold shadow-2xs">
                      Visa / MC
                    </div>
                    <div className="bg-white py-1.5 rounded text-[#7B766F] font-semibold shadow-2xs">
                      JCB Int.
                    </div>
                  </div>
                </div>

                {/* Nút hành động chính */}
                <div className="mt-6 flex flex-col gap-2.5">
                  <button
                    type="button"
                    onClick={handleVNPayCheckout}
                    disabled={isSubmitting || thriftItems.length === 0}
                    className="w-full bg-[#141310] text-white hover:bg-black text-xs uppercase tracking-wider py-4 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <span className="material-symbols-outlined text-[18px] animate-spin">sync</span>
                        <span>ĐANG KẾT NỐI CỔNG VNPAY SANDBOX...</span>
                      </>
                    ) : (
                      <>
                        <span>THANH TOÁN QUA VNPAY ({formatCurrency(grandTotal)})</span>
                        <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleOpenVnPayModal}
                    disabled={isSubmitting || thriftItems.length === 0}
                    className="w-full bg-[#F7F3EC] text-[#141310] hover:bg-[#EBE8E1] border border-[#E6E2DB] text-xs uppercase tracking-wider py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">qr_code_scanner</span>
                    <span>MỞ MÃ QUÉT VNPAY-QR SANDBOX</span>
                  </button>

                  <Link
                    to="/cart"
                    className="w-full text-center py-2 text-xs text-[#7B766F] hover:text-[#141310] uppercase tracking-wider transition-colors inline-block font-semibold"
                  >
                    ← Quay lại Giỏ hàng tuần hoàn (/cart)
                  </Link>
                </div>

                {/* Cam kết bảo mật */}
                <div className="mt-4 pt-3 flex items-center justify-center gap-2 text-[#7B766F] text-[11px]">
                  <span className="material-symbols-outlined text-[16px] text-[#576151]">
                    verified
                  </span>
                  <span>Được bảo chứng bởi ReUse Hub Circular Custody Standard</span>
                </div>
              </div>
            </div>

            {/* Khối trợ giúp Concierge */}
            <div className="bg-[#F7F3EC] rounded-2xl p-4.5 flex items-center justify-between border border-[#E6E2DB]">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[#576151] text-[24px]">
                  support_agent
                </span>
                <div>
                  <p className="text-xs font-bold text-[#141310]">Cần tư vấn hiện vật độc bản?</p>
                  <p className="text-[11px] text-[#7B766F]">
                    Archivist riêng hỗ trợ 24/7 qua Hotline VIP
                  </p>
                </div>
              </div>
              <a
                href="tel:+84236999821"
                className="px-3 py-1.5 rounded-lg bg-white text-[#141310] text-[11px] font-bold hover:bg-[#F1EDE6] transition-colors shadow-2xs border border-[#E6E2DB]"
              >
                Gọi Concierge
              </a>
            </div>
          </div>
        </div>
      </main>

      {/* ── TOAST NOTIFICATION ── */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 bg-[#141310] text-white px-5 py-3.5 rounded-xl shadow-2xl flex items-center gap-3 border border-[#31302C] animate-slide-in">
          <span className="material-symbols-outlined text-[#8FBC8F] text-[20px]">verified</span>
          <p className="text-xs font-semibold">{toastMessage}</p>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-stone-400 hover:text-white ml-2 text-sm"
          >
            ✕
          </button>
        </div>
      )}

      {/* ── MODAL GIẢ LẬP CỔNG VNPAY (THEO GIAO DIỆN MẪU) ── */}
      {isVnPayModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-[#141310]/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setIsVnPayModalOpen(false)}
        >
          <div
            className="bg-white w-full max-w-lg rounded-2xl shadow-2xl p-6 relative flex flex-col gap-4 border border-[#E6E2DB]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-[#F1EDE6]">
              <div className="flex items-center gap-2">
                <span className="font-serif font-bold text-base text-[#141310]">CỔNG THANH TOÁN VNPAY</span>
                <span className="px-2 py-0.5 rounded bg-[#D8E3CE] text-[#5B6655] text-[10px] font-bold uppercase">
                  SANDBOX SECURE
                </span>
              </div>
              <button
                type="button"
                className="text-stone-400 hover:text-[#141310] cursor-pointer"
                onClick={() => setIsVnPayModalOpen(false)}
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="bg-[#F7F3EC] rounded-xl p-4 text-center border border-[#E6E2DB]/70">
              <p className="text-xs text-[#7B766F]">
                Đơn hàng THRIFT {createdOrder?.orderCode || orderSessionCode}
              </p>
              <p className="font-serif text-2xl font-bold text-[#141310] mt-1">
                {formatCurrency(createdOrder?.totalAmount || grandTotal)}
              </p>
              <p className="text-[11px] text-[#576151] mt-1 font-semibold">
                Bảo lãnh chuyển nhượng vĩnh viễn {itemizedList.length} hiện vật tuyển chọn
              </p>
            </div>

            <div className="flex flex-col items-center justify-center py-4 bg-[#FBF9F5] rounded-xl border border-[#E6E2DB]">
              <div className="w-44 h-44 bg-white p-2 rounded-xl shadow-xs flex items-center justify-center border border-[#E6E2DB]">
                <svg className="w-full h-full text-[#141310]" fill="currentColor" viewBox="0 0 100 100">
                  <path d="M10 10h30v30h-30z M15 15v20h20v-20z M60 10h30v30h-30z M65 15v20h20v-20z M10 60h30v30h-30z M15 65v20h20v-20z M20 20h10v10h-10z M70 20h10v10h-10z M20 70h10v10h-10z M45 15h10v10h-10z M45 35h10v10h-10z M45 60h10v10h-10z M60 50h15v10h-15z M75 65h15v15h-15z M60 80h10v10h-10z"></path>
                </svg>
              </div>
              <p className="text-[11px] text-[#7B766F] mt-3 uppercase tracking-wider font-semibold">
                Quét mã bằng ứng dụng Ngân hàng hoặc Ví VNPay
              </p>
            </div>

            <div className="flex flex-col gap-2 pt-1">
              <button
                type="button"
                disabled={isSimulatingSuccess}
                onClick={handleSimulatePaymentSuccess}
                className="w-full bg-[#576151] text-white py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-[#434b3e] transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-sm disabled:opacity-60"
              >
                {isSimulatingSuccess ? (
                  <>
                    <span className="material-symbols-outlined text-[18px] animate-spin">sync</span>
                    <span>ĐANG XÁC THỰC SMART ESCROW...</span>
                  </>
                ) : (
                  <span>Xác nhận Đã Chuyển Khoản Thành Công</span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setIsVnPayModalOpen(false)}
                className="w-full bg-[#F7F3EC] py-2.5 rounded-xl text-xs font-bold text-[#7B766F] hover:text-[#141310] uppercase tracking-wider transition-colors cursor-pointer"
              >
                Huỷ giao dịch
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: CẬP NHẬT ĐỊA CHỈ GIAO NHẬN ── */}
      {isEditingAddress && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in"
          onClick={() => setIsEditingAddress(false)}
        >
          <div
            className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl space-y-5 border border-[#E6E2DB]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#F1EDE6]">
              <h3 className="font-serif text-lg font-bold text-[#141310]">
                Cập nhật địa chỉ nhận kiện THRIFT
              </h3>
              <button
                type="button"
                onClick={() => setIsEditingAddress(false)}
                className="p-1 rounded-full text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Họ và tên người nhận:
                </label>
                <input
                  type="text"
                  value={tempConsignee}
                  onChange={(e) => setTempConsignee(e.target.value)}
                  className="w-full border border-[#E6E2DB] rounded-xl px-3 py-2 text-xs text-[#141310] focus:outline-none focus:border-[#576151]"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Số điện thoại xác thực:
                </label>
                <input
                  type="text"
                  value={tempPhone}
                  onChange={(e) => setTempPhone(e.target.value)}
                  className="w-full border border-[#E6E2DB] rounded-xl px-3 py-2 text-xs text-[#141310] focus:outline-none focus:border-[#576151]"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Địa chỉ chi tiết:
                </label>
                <textarea
                  rows={3}
                  value={tempAddress}
                  onChange={(e) => setTempAddress(e.target.value)}
                  className="w-full border border-[#E6E2DB] rounded-xl px-3 py-2 text-xs text-[#141310] focus:outline-none focus:border-[#576151]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#F1EDE6]">
              <button
                type="button"
                onClick={() => setIsEditingAddress(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 hover:bg-[#F7F3EC] cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleSaveAddress}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#141310] hover:bg-black shadow-xs cursor-pointer"
              >
                Lưu địa chỉ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ThriftCheckout;