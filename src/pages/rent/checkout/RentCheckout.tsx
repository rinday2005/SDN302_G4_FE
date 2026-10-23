import React, { useState, useMemo, useContext, useEffect } from 'react';
import { Link, useNavigate, useParams, useLocation } from 'react-router-dom';
import { AuthContext } from '../../../context/auth-context';
import { useCartWishlist, type CartItem } from '../../../context/CartWishlistContext';

import {
  DEFAULT_CHECKOUT_RENT_ITEMS,
  NANUK_SHIPPING_FEE,
} from '../../data/rent/rentCheckoutData';
import { redirectToVnPayGateway } from '../../../services/payment.api';
import {
  getProductBookedDates,
  hasDateRangeConflict,
  findEarliestAvailableRentalRange,
} from '../../data/rent/rentOrderDetailData';
import { getUserProfileAddress } from '../../../utils/address';
import { resolveWishlistProduct } from '../../../services/wishlistProductResolver';

export const RentCheckout: React.FC = () => {
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

  // ── 2. RENT ITEMS SELECTION (Only RENT items from Cart or Route ID) ──
  const rentItems = useMemo(() => {
    // 1. Filter all RENT items currently in cart
    const cartRent = cart.filter((item) => item.mode === 'rent' || !item.mode);

    // 2. If specific item IDs were selected from Cart
    const passedIds = (location.state as { selectedItemIds?: string[] } | null)?.selectedItemIds;
    if (passedIds && passedIds.length > 0) {
      const selected = cartRent.filter((item) => passedIds.includes(item.id));
      if (selected.length > 0) return selected;
    }

    // 3. If param :id is provided and found in cart
    if (id) {
      const matched = cartRent.filter((item) => item.id === id);
      if (matched.length > 0) return matched;
    }

    // 4. If cart has any rent items, use all of them
    if (cartRent.length > 0) {
      return cartRent;
    }

    // 5. Cart was empty, return empty list (no fake mock items)
    return [];
  }, [cart, id, location.state]);

  // ── 3. COMMON RENTAL DATES ("ngày thuê chung" cho toàn bộ thiết bị) ──
  const [startDate, setStartDate] = useState(() => {
    const fromItem = (rentItems[0] as { startDate?: string; id?: string; title?: string })?.startDate;
    const fromItemEnd = (rentItems[0] as { endDate?: string })?.endDate;
    const bDates = getProductBookedDates(rentItems[0]);
    if (fromItem && !hasDateRangeConflict(fromItem, fromItemEnd || fromItem, bDates)) {
      return fromItem;
    }
    return findEarliestAvailableRentalRange(bDates, 3).startDate;
  });

  const [endDate, setEndDate] = useState(() => {
    const fromItem = (rentItems[0] as { startDate?: string; id?: string; title?: string })?.startDate;
    const fromItemEnd = (rentItems[0] as { endDate?: string })?.endDate;
    const bDates = getProductBookedDates(rentItems[0]);
    if (fromItemEnd && fromItem && !hasDateRangeConflict(fromItem, fromItemEnd, bDates)) {
      return fromItemEnd;
    }
    return findEarliestAvailableRentalRange(bDates, 3).endDate;
  });
  const [isChangingDates, setIsChangingDates] = useState(false);

  // Tự động kiểm tra và chuyển ngày sang khoảng trống nếu rentItems thay đổi
  const [prevRentItems, setPrevRentItems] = useState(rentItems);
  if (prevRentItems !== rentItems) {
    setPrevRentItems(rentItems);
    const firstItem = rentItems[0];
    if (firstItem) {
      const bDates = getProductBookedDates(firstItem);
      if (hasDateRangeConflict(startDate, endDate, bDates)) {
        const earliest = findEarliestAvailableRentalRange(bDates, 3);
        setStartDate(earliest.startDate);
        setEndDate(earliest.endDate);
      }
    }
  }

  // Compute common rental days
  const rentalDays = useMemo(() => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.round(diffTime / (1000 * 3600 * 24));
    return diffDays > 0 ? diffDays : 1;
  }, [startDate, endDate]);

  // Format date helper: DD/MM/YYYY
  const formatDateDisplay = (dateStr: string) => {
    try {
      const [year, month, day] = dateStr.split('-');
      return `${day}/${month}/${year}`;
    } catch {
      return dateStr;
    }
  };

  const formatShortDate = (dateStr: string) => {
    try {
      const [ , month, day] = dateStr.split('-');
      return `${day}/${month}`;
    } catch {
      return dateStr;
    }
  };

  // Expected deposit release date (1 day after return)
  const depositReleaseDate = useMemo(() => {
    try {
      const d = new Date(endDate);
      d.setDate(d.getDate() + 1);
      const day = d.getDate().toString().padStart(2, '0');
      const month = (d.getMonth() + 1).toString().padStart(2, '0');
      return `${day}/${month}`;
    } catch {
      return '24/11';
    }
  }, [endDate]);

  // Quick preset days handler
  const handlePresetDays = (preset: number) => {
    const start = new Date(startDate);
    const end = new Date(start);
    end.setDate(start.getDate() + preset);
    const y = end.getFullYear();
    const m = (end.getMonth() + 1).toString().padStart(2, '0');
    const d = end.getDate().toString().padStart(2, '0');
    setEndDate(`${y}-${m}-${d}`);
    setIsChangingDates(false);
  };

  // ── 4. CUSTOMER PROFILE & DELIVERY ADDRESS ("địa chỉ nhận hàng") ──
  const storedProfile = useMemo(() => {
    try {
      const uId = user?._id || user?.id;
      const raw = uId ? localStorage.getItem(`user_profile_${uId}`) : null;
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }, [user]);

  const userProfileAddress = useMemo(() => getUserProfileAddress(user), [user]);

  const [custodyHolder, setCustodyHolder] = useState(() => {
    return (
      storedProfile.fullName ||
      user?.fullName ||
      'Khách hàng'
    );
  });

  const [phone, setPhone] = useState(() => {
    return (
      storedProfile.phone ||
      user?.phoneNumber ||
      user?.phone ||
      ''
    );
  });

  const [shippingAddress, setShippingAddress] = useState(() => {
    return userProfileAddress.full;
  });

  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [tempAddress, setTempAddress] = useState(shippingAddress);
  const [tempHolder, setTempHolder] = useState(custodyHolder);
  const [tempPhone, setTempPhone] = useState(phone);

  useEffect(() => {
    const handleProfileSync = () => {
      const fresh = getUserProfileAddress(user);
      setShippingAddress(fresh.full);
      setTempAddress(fresh.full);
    };
    window.addEventListener('user_profile_updated', handleProfileSync);
    return () => {
      window.removeEventListener('user_profile_updated', handleProfileSync);
    };
  }, [user]);

  const handleSaveAddress = () => {
    setShippingAddress(tempAddress);
    setCustodyHolder(tempHolder);
    setPhone(tempPhone);
    setIsEditingAddress(false);
    try {
      const uId = user?._id || user?.id;
      if (uId) {
        const raw = localStorage.getItem(`user_profile_${uId}`);
        const currentProfile = raw ? JSON.parse(raw) : {};
        localStorage.setItem(
          `user_profile_${uId}`,
          JSON.stringify({
            ...currentProfile,
            fullName: tempHolder || currentProfile.fullName,
            phone: tempPhone || currentProfile.phone,
            address: {
              ...(typeof currentProfile.address === 'object' ? currentProfile.address : {}),
              detail: tempAddress,
            },
          })
        );
        window.dispatchEvent(new Event('user_profile_updated'));
      }
    } catch {
      // ignore
    }
  };

  // ── 5. FINANCIAL CALCULATIONS & LEDGER ("tổng tiền cọc & một phí shipping") ──
  const formatCurrency = (val: number) => {
    return val.toLocaleString('vi-VN') + '₫';
  };

  // Helper to extract deposit value
  const parseDeposit = (item: CartItem | typeof DEFAULT_CHECKOUT_RENT_ITEMS[0]): number => {
    if ('deposit' in item && typeof item.deposit === 'number') return item.deposit;
    if ('deposit' in item && typeof item.deposit === 'string') {
      const numeric = parseInt((item.deposit as string).replace(/\D/g, ''), 10);
      return isNaN(numeric) ? 3500000 : numeric;
    }
    return item.price * 8;
  };

  // Itemized rental fees
  const itemizedCalculations = useMemo(() => {
    return rentItems.map((item) => {
      const qty = item.quantity || 1;
      const dailyPrice = item.price;
      const itemRentTotal = dailyPrice * rentalDays * qty;
      const itemDeposit = parseDeposit(item) * qty;

      return {
        ...item,
        qty,
        dailyPrice,
        itemRentTotal,
        itemDeposit,
      };
    });
  }, [rentItems, rentalDays]);

  // Subtotals
  const totalRentFee = useMemo(() => {
    return itemizedCalculations.reduce((sum, item) => sum + item.itemRentTotal, 0);
  }, [itemizedCalculations]);

  const totalDeposit = useMemo(() => {
    return itemizedCalculations.reduce((sum, item) => sum + item.itemDeposit, 0);
  }, [itemizedCalculations]);

  const totalDueToday = totalRentFee + totalDeposit + NANUK_SHIPPING_FEE;

  const refundablePercent = useMemo(() => {
    if (totalDueToday <= 0) return '0.0';
    return ((totalDeposit / totalDueToday) * 100).toFixed(1);
  }, [totalDeposit, totalDueToday]);

  // Dynamic Unique Contract ID
  const [contractId] = useState(() => {
    const rnd = Math.floor(1000 + Math.random() * 9000);
    const year = new Date().getFullYear();
    return `#RH-RNT-${year}-${rnd}`;
  });

  // ── 6. PAYMENT STATE & SUBMISSION SIMULATION ──
  const [paymentMethod, setPaymentMethod] = useState<'vnpay' | 'bank_transfer'>('vnpay');
  const [agreedTerms, setAgreedTerms] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStep, setSubmitStep] = useState('');

  // In-app Toast Feedback State
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    icon: string;
    type?: 'success' | 'info' | 'error' | 'warning';
  }>({
    show: false,
    message: '',
    icon: 'check_circle',
    type: 'success',
  });

  const showToast = (
    message: string,
    icon = 'check_circle',
    type: 'success' | 'info' | 'error' | 'warning' = 'success'
  ) => {
    setToast({ show: true, message, icon, type });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 4000);
  };

  // Handle Order Placement & Direct VNPay Sandbox Redirect
  const handleProcessCheckout = async () => {
    if (!agreedTerms) {
      showToast('Vui lòng đồng ý với Quy ước Lưu giữ Bền vững và Điều khoản Ký quỹ Escrow để tiếp tục.', 'info', 'warning');
      return;
    }

    const conflictItem = rentItems.find((item) => {
      const bDates = getProductBookedDates(item);
      return hasDateRangeConflict(startDate, endDate, bDates);
    });
    if (conflictItem) {
      showToast(
        `Kỳ thuê bạn chọn (${startDate} → ${endDate}) của sản phẩm "${conflictItem.title}" bị trùng ngày đã có khách đặt trước. Vui lòng chọn lại kỳ thuê còn trống!`,
        'event_busy',
        'warning'
      );
      return;
    }

    setIsSubmitting(true);
    setSubmitStep('Đang kết nối Cổng thanh toán VNPay Sandbox...');

    // Clear checked rent items from cart
    rentItems.forEach((ri) => {
      removeFromCart(ri.id);
    });

    const mappedOrderItems = itemizedCalculations.map((item) => ({
      id: String(item.id),
      productId: String(item.id),
      title: item.title,
      productName: item.title,
      grade:
        ('gradeBadge' in item ? (item as { gradeBadge?: string }).gradeBadge : '') ||
        ('grade' in item ? (item as { grade?: string }).grade : '') ||
        'Grade A+',
      price: item.price,
      dailyPrice: item.price,
      pricePerDay: item.price,
      quantity: item.qty || item.quantity || 1,
      depositAmount: item.itemDeposit || 0,
      itemRentTotal: item.itemRentTotal,
      imageUrl: item.image,
      image: item.image,
      shopName: (item as { vaultOrigin?: string }).vaultOrigin || 'ReUse Partner Vault',
    }));

    // Save Pending Order Record to localStorage
    const newOrder = {
      orderCode: contractId,
      type: 'RENT',
      createdAt: new Date().toISOString(),
      custodyHolder,
      phone,
      shippingAddress: {
        recipientName: custodyHolder || user?.fullName || 'Khách hàng',
        recipientPhone: phone || user?.phoneNumber || user?.phone || '',
        province: userProfileAddress.province,
        district: userProfileAddress.district,
        ward: userProfileAddress.ward,
        detail: shippingAddress || userProfileAddress.detail,
      },
      startDate,
      endDate,
      rentalDays,
      items: mappedOrderItems,
      totalRentFee,
      totalDeposit,
      shippingFee: NANUK_SHIPPING_FEE,
      totalPayment: totalDueToday,
      paymentMethod: 'VNPAY',
      status: 'PENDING_PAYMENT',
      nanukSealId: `NNK-SEAL-${Math.floor(100000 + Math.random() * 900000)}`,
    };

    try {
      const uId = user?._id || user?.id || '';
      const userKey = uId ? `user_rental_orders_${uId}` : null;

      // Only save to the currently logged in user's key to ensure strict account isolation
      if (userKey) {
        const userOrders = JSON.parse(localStorage.getItem(userKey) || '[]');
        localStorage.setItem(userKey, JSON.stringify([newOrder, ...userOrders]));
      }
    } catch {
      // ignore
    }

    // Direct redirect to VNPay Sandbox via Backend API
    try {
      const targetOrderId = id || (location.state as { orderId?: string })?.orderId || '';

      await redirectToVnPayGateway({
        orderId: targetOrderId,
        orderCode: contractId.replace('#', ''),
        amount: totalDueToday,
        type: 'RENT',
        productId: rentItems[0]?.id,
        startDate,
        endDate,
        items: mappedOrderItems,
        shippingAddress: {
          recipientName: custodyHolder || user?.fullName || 'Khách hàng',
          recipientPhone: phone || user?.phoneNumber || '0901234567',
          province: userProfileAddress.province,
          district: userProfileAddress.district,
          ward: userProfileAddress.ward,
          detail: shippingAddress || userProfileAddress.detail,
        },
        rentalFee: totalRentFee,
        depositAmount: totalDeposit,
        shippingFee: NANUK_SHIPPING_FEE,
      });
    } catch (error: unknown) {
      console.error('Error redirecting to VNPay:', error);
      setIsSubmitting(false);
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      const errMsg =
        err.response?.data?.message ||
        err.message ||
        'Có lỗi khi tạo liên kết thanh toán VNPay. Vui lòng thử lại!';
      navigate(`/payment-failed?orderCode=${encodeURIComponent(contractId)}&message=${encodeURIComponent(errMsg)}`);
    }
  };

  return (
    <div className="bg-[#FBF9F5] text-[#1E1E1E] font-sans antialiased selection:bg-[#E8EFE9] selection:text-[#2D5A43] min-h-screen flex flex-col">
      

      {/* ── PAGE TITLE AREA & TRUST BADGES ── */}
      <section className="bg-[#FDFCF9] border-b border-[#E5E0D8] py-7">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
          {/* Breadcrumb Navigation */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-[#292724]/70 mb-3">
            <Link to="/" className="hover:text-[#1E1E1E] hover:underline">
              Trang chủ
            </Link>
            <span className="text-[#D8D2C6]">/</span>
            <Link to="/cart" className="hover:text-[#1E1E1E] hover:underline">
              Giỏ hàng tuần hoàn
            </Link>
            <span className="text-[#D8D2C6]">/</span>
            <span className="text-[#1E1E1E] font-semibold">
              Thanh toán đơn thuê (RENT Checkout)
            </span>
          </nav>

          {/* Protocol Badge & Title Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-[#E8EFE9]/80 border border-[#4B6354]/30 rounded text-[11px] font-semibold text-[#2D5A43] uppercase tracking-wider mb-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2D5A43]" />
                CIRCULAR POSSESSION PROTOCOL · SMART ESCROW CUSTODY
              </div>
              <h1 className="font-serif text-3xl md:text-4xl font-semibold text-[#1E1E1E] tracking-tight">
                Thanh toán Đơn Thuê Thiết bị
              </h1>
              <p className="text-xs md:text-sm text-stone-600 mt-1.5 max-w-3xl leading-relaxed">
                Thủ tục bàn giao thiết bị lưu giữ theo kỳ (RENT) với cơ chế bảo chứng ký quỹ Smart Escrow và niêm phong thùng Nanuk chuyên dụng.
              </p>
            </div>

            {/* Trust Badges Strip */}
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-medium text-[#292724] bg-[#F5F2EB]/80 px-3.5 py-2 rounded-lg border border-[#E5E0D8]">
              <span className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-[#3D5446]" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    clipRule="evenodd"
                    d="M10 1.944A11.954 11.954 0 012.166 5C2.056 5.649 2 6.319 2 7c0 5.225 3.34 9.67 8 11.317C14.66 16.67 18 12.225 18 7c0-.682-.057-1.35-.166-2.001A11.954 11.954 0 0110 1.944zm4.293 6.763a1 1 0 00-1.414-1.414L9 11.172 7.121 9.293a1 1 0 00-1.414 1.414l2.5 2.5a1 1 0 001.414 0l4.293-4.293z"
                    fillRule="evenodd"
                  />
                </svg>
                Bảo hộ Smart Escrow 100%
              </span>
              <span className="text-[#D8D2C6]">•</span>
              <span className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-[#3D5446]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                  />
                </svg>
                Bench Lab Grade A+
              </span>
              <span className="text-[#D8D2C6]">•</span>
              <span className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-[#3D5446]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                  />
                </svg>
                Bưu tá Nanuk chuyên dụng
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── MAIN CONTENT GRID ── */}
      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8 flex-1 w-full">
        {rentItems.length === 0 ? (
          <div className="bg-white border border-[#E5E0D8] rounded-3xl p-12 text-center max-w-lg mx-auto shadow-sm space-y-4 my-8">
            <div className="w-16 h-16 rounded-full bg-[#F5F2EB] flex items-center justify-center mx-auto text-[#2D5A43]">
              <span className="material-symbols-outlined text-3xl">shopping_cart</span>
            </div>
            <h2 className="font-serif text-xl font-bold text-[#1E1E1E]">Giỏ hàng thuê đang trống</h2>
            <p className="text-xs text-stone-500 leading-relaxed">
              Bạn chưa chọn thiết bị nào để tiến hành thuê. Vui lòng khám phá thiết bị trong sàn giao dịch RENT và thêm vào giỏ hàng trước khi thanh toán.
            </p>
            <div className="pt-2">
              <Link
                to="/rent"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#1E1E1E] text-white text-xs font-semibold hover:bg-black transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">search</span>
                <span>Khám phá thiết bị thuê ngay</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT COLUMN: WORKFLOW & ORDER SETUP (65%) */}
          <section className="lg:col-span-8 space-y-6">
            {/* SECTION 1: Selected Rental Items */}
            <div className="bg-[#FDFCF9] border border-[#E5E0D8] rounded-2xl p-5 sm:p-6 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#EFECE6] gap-3">
                <div className="flex items-center gap-3">
                  <span className="flex items-center justify-center w-7 h-7 rounded-full bg-[#1E1E1E] text-white text-xs font-bold shrink-0">
                    1
                  </span>
                  <div>
                    <h2 className="font-serif text-lg font-bold text-[#1E1E1E]">
                      Danh sách thiết bị RENT đã chọn từ Giỏ hàng
                    </h2>
                    <p className="text-xs text-stone-500">
                      {rentItems.length} sản phẩm được gom chung trong 1 Hợp đồng lưu giữ ký gửi
                    </p>
                  </div>
                </div>

                {/* Common Rental Frame Indicator */}
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#2D5A43] bg-[#E8EFE9] px-2.5 py-1 rounded">
                    {rentItems.length} Thiết bị · Khung kỳ {rentalDays} ngày ({formatShortDate(startDate)} – {formatShortDate(endDate)})
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsChangingDates((prev) => !prev)}
                    className="text-[11px] font-bold text-[#1E1E1E] hover:text-[#2D5A43] underline cursor-pointer"
                  >
                    {isChangingDates ? 'Đóng' : 'Đổi ngày thuê chung'}
                  </button>
                </div>
              </div>

              {/* COMMON RENTAL DATE SELECTOR ACCORDION */}
              {isChangingDates && (
                <div className="my-4 p-4 rounded-xl bg-[#F5F2EB]/90 border border-[#E5E0D8] space-y-3 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#1E1E1E] uppercase tracking-wide">
                      Thiết lập ngày thuê chung cho toàn bộ đơn:
                    </span>
                    <span className="text-xs font-bold text-[#2D5A43]">
                      Thời lượng: {rentalDays} ngày
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                        Ngày bắt đầu nhận máy:
                      </label>
                      <input
                        type="date"
                        value={startDate}
                        min="2026-11-01"
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full bg-white border border-[#E5E0D8] rounded-lg px-3 py-1.5 text-xs text-[#1E1E1E] font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                        Ngày hoàn trả (Bưu tá lấy hàng):
                      </label>
                      <input
                        type="date"
                        value={endDate}
                        min={startDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full bg-white border border-[#E5E0D8] rounded-lg px-3 py-1.5 text-xs text-[#1E1E1E] font-medium"
                      />
                    </div>
                  </div>

                  {/* Quick Preset Buttons */}
                  <div className="flex items-center gap-2 pt-1 flex-wrap">
                    <span className="text-[11px] text-stone-500">Chọn nhanh:</span>
                    {[3, 5, 7, 10, 14, 30].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => handlePresetDays(preset)}
                        className={`px-2.5 py-1 text-[11px] rounded-md font-semibold border transition-all cursor-pointer ${
                          rentalDays === preset
                            ? 'bg-[#1E1E1E] text-white border-[#1E1E1E]'
                            : 'bg-white text-stone-700 border-[#E5E0D8] hover:bg-[#E8EFE9]'
                        }`}
                      >
                        {preset} ngày
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Product Items List */}
              <div className="divide-y divide-[#EFECE6] mt-1">
                {itemizedCalculations.map((item, index) => {
                  const code = 'code' in item ? (item.code as string) : `#CR6-${880 + index}`;
                  const grade = 'grade' in item ? (item.grade as string) : 'Grade A+ (Bench Checked)';
                  const category = 'category' in item ? (item.category as string) : 'THIẾT BỊ LƯU GIỮ';
                  const packagingNote =
                    'packagingNote' in item
                      ? (item.packagingNote as string)
                      : 'Sẵn sàng bàn giao trong vali Nanuk 935 chống nước chống sốc';
                  const accessories =
                    'accessories' in item
                      ? (item.accessories as string)
                      : `Số lượng: ${item.qty} bộ phụ kiện bảo chứng tiêu chuẩn`;

                  return (
                    <article key={item.id} className="py-5 flex flex-col sm:flex-row gap-5 items-start">
                      {/* Item Image / Badge */}
                      <div className="relative w-full sm:w-28 h-28 bg-[#F5F2EB] rounded-xl overflow-hidden border border-[#E5E0D8] shrink-0 flex items-center justify-center group">
                        <img
                          alt={item.title}
                          className="w-full h-full object-cover transition-transform group-hover:scale-105"
                          src={item.image || resolveWishlistProduct(item.id)?.image || 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=600&q=80'}
                          onError={(e) => {
                            const res = resolveWishlistProduct(item.id);
                            if (res?.image && e.currentTarget.src !== res.image) {
                              e.currentTarget.src = res.image;
                            }
                          }}
                        />
                        <span className="absolute bottom-1.5 left-1.5 bg-[#1E1E1E]/90 text-white text-[9px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded backdrop-blur-xs">
                          {category}
                        </span>
                      </div>

                      {/* Item Details */}
                      <div className="flex-1 space-y-2 w-full">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-1">
                          <div>
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className="text-[10px] font-bold uppercase tracking-wider bg-[#EFECE6] text-[#292724] px-2 py-0.5 rounded">
                                {code}
                              </span>
                              <span className="text-[10px] font-bold text-[#3D5446] bg-[#F3F6F4] border border-[#4B6354]/30 px-2 py-0.5 rounded">
                                {grade}
                              </span>
                            </div>
                            <h3 className="font-serif text-base font-bold text-[#1E1E1E]">
                              {item.title}
                            </h3>
                          </div>
                          <div className="text-right sm:pl-4 shrink-0">
                            <span className="text-xs text-stone-500 block">
                              Đơn giá: {formatCurrency(item.dailyPrice)} / ngày
                            </span>
                            <span className="font-bold text-base text-[#1E1E1E]">
                              {formatCurrency(item.itemRentTotal)}
                            </span>
                            <span className="text-[11px] text-stone-500 block">
                              (cho {rentalDays} ngày)
                            </span>
                          </div>
                        </div>

                        {/* Rental Meta Box */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs bg-[#F5F2EB]/60 p-3 rounded-xl border border-[#EFECE6]">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 text-stone-700">
                              <svg className="w-3.5 h-3.5 text-stone-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                />
                              </svg>
                              <span>
                                Kỳ thuê: <strong className="text-[#1E1E1E]">{formatDateDisplay(startDate)} → {formatDateDisplay(endDate)} ({rentalDays} ngày)</strong>
                              </span>
                            </div>
                            <p className="text-stone-600 pl-5 text-[11px]">{accessories}</p>
                          </div>

                          <div className="space-y-1 md:border-l md:border-[#E5E0D8] md:pl-3">
                            <div className="text-stone-700">
                              Cọc Smart Escrow (hoàn trả 100%): <strong className="text-[#1E1E1E]">{formatCurrency(item.itemDeposit)}</strong>
                            </div>
                            <p className="text-[#3D5446] text-[11px] flex items-center gap-1">
                              <svg className="w-3 h-3 text-[#4B6354] shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path
                                  clipRule="evenodd"
                                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                  fillRule="evenodd"
                                />
                              </svg>
                              <span>{packagingNote}</span>
                            </p>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>

            {/* SECTION 2: Availability & Booking Calendar Validation */}
            <div className="bg-[#F3F6F4] border border-[#4B6354]/30 rounded-2xl p-5 shadow-2xs">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-[#2D5A43] text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <h3 className="font-serif text-base font-bold text-[#2D5A43]">
                      Xác thực lịch lưu giữ thành công cho cả {rentItems.length} thiết bị
                    </h3>
                    <span className="text-[11px] font-bold text-[#3D5446] bg-white/90 border border-[#4B6354]/20 px-2 py-0.5 rounded self-start">
                      Đồng bộ khung: {formatDateDisplay(startDate)} – {formatDateDisplay(endDate)}
                    </span>
                  </div>
                  <p className="text-xs text-[#292724]/80 mt-1 leading-relaxed">
                    Kho lưu trữ: <strong>Da Nang Optical Vault</strong> &amp; <strong>Central Outdoor Archive</strong> đã khóa lịch giữ chỗ thành công và sẵn sàng đóng gói chung một đợt vận chuyển bọc thép để tối ưu chi phí cho bạn.
                  </p>
                </div>
              </div>
            </div>

            {/* SECTION 3: Shipping & Insured Custody Handoff */}
            <div className="bg-[#FDFCF9] border border-[#E5E0D8] rounded-2xl p-5 sm:p-6 shadow-xs">
              <div className="flex items-center gap-3 pb-4 border-b border-[#EFECE6]">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-[#1E1E1E] text-white text-xs font-bold shrink-0">
                  2
                </span>
                <div>
                  <h2 className="font-serif text-lg font-bold text-[#1E1E1E]">
                    Thông tin nhận thiết bị &amp; Giao vận bảo chứng
                  </h2>
                  <p className="text-xs text-stone-500">
                    Quy trình giao nhận 2 chiều với bưu tá chuyên trách
                  </p>
                </div>
                <span className="ml-auto inline-flex items-center gap-1 text-[11px] font-semibold text-[#2D5A43] bg-[#E8EFE9] px-2.5 py-1 rounded">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                    />
                  </svg>
                  Hồ sơ Tier 2 Đã xác minh
                </span>
              </div>

              {/* Customer & Address Information */}
              <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Custody Holder */}
                <div className="bg-[#F5F2EB]/50 p-4 rounded-xl border border-[#EFECE6]">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                    Người đại diện lưu giữ (Custody Holder)
                  </label>
                  <div className="font-bold text-sm text-[#1E1E1E]">{custodyHolder}</div>
                  <div className="text-xs text-stone-600 mt-0.5">Số điện thoại: {phone}</div>
                  <div className="text-[11px] text-[#3D5446] mt-2 flex items-center gap-1 font-semibold">
                    <svg className="w-3.5 h-3.5 text-[#4B6354]" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        clipRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        fillRule="evenodd"
                      />
                    </svg>
                    Căn cước định danh &amp; Hạn mức Tier 2 (Tối đa 40.000.000₫)
                  </div>
                </div>

                {/* Shipping Address */}
                <div className="bg-[#F5F2EB]/50 p-4 rounded-xl border border-[#EFECE6] flex flex-col justify-between">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                      Địa chỉ giao nhận niêm phong
                    </label>
                    <div className="font-bold text-sm text-[#1E1E1E] leading-snug">
                      {shippingAddress}
                    </div>
                  </div>
                  <div>
                    <button
                      type="button"
                      onClick={() => {
                        setTempAddress(shippingAddress);
                        setTempHolder(custodyHolder);
                        setTempPhone(phone);
                        setIsEditingAddress(true);
                      }}
                      className="text-[11px] text-[#292724] font-semibold underline hover:text-[#3D5446] mt-3 inline-block cursor-pointer"
                    >
                      Thay đổi địa chỉ giao nhận
                    </button>
                  </div>
                </div>
              </div>

              {/* Courier Logistics Selection Banner */}
              <div className="mt-4 p-4 rounded-xl border border-[#E5E0D8] bg-[#FDFCF9] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-[#1E1E1E] text-white mt-0.5 shrink-0">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                      />
                    </svg>
                  </div>
                  <div>
                    <div className="font-serif text-sm font-bold text-[#1E1E1E]">
                      Bưu tá chuyên dụng Nanuk White-Glove Courier (2 chiều giao và lấy đồ hoàn trả)
                    </div>
                    <p className="text-xs text-stone-600 mt-0.5 leading-relaxed">
                      Bao gồm thùng Nanuk hard-case chống va đập, gói hạt hút ẩm silica chuyên dụng, bảo hiểm va đập toàn diện và vận đơn chiều về in sẵn.
                    </p>
                    <p className="text-[11px] text-[#2D5A43] font-semibold mt-1">
                      * Lưu ý: Kiểm tra tem niêm phong vật lý và chụp 3 góc đối kiểm trước mặt bưu tá khi nhận kiện.
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0 sm:pl-4 self-end sm:self-center">
                  <span className="text-[10px] text-stone-500 block uppercase font-medium">
                    Phí gói trọn đơn
                  </span>
                  <span className="font-serif font-bold text-base text-[#1E1E1E]">
                    {formatCurrency(NANUK_SHIPPING_FEE)}
                  </span>
                </div>
              </div>
            </div>

            {/* SECTION 4: Custody Protocol & Inspection Lifecycle */}
            <div className="bg-[#FDFCF9] border border-[#E5E0D8] rounded-2xl p-5 sm:p-6 shadow-xs">
              <div className="flex items-center gap-3 pb-4 border-b border-[#EFECE6]">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-[#1E1E1E] text-white text-xs font-bold shrink-0">
                  3
                </span>
                <div>
                  <h2 className="font-serif text-lg font-bold text-[#1E1E1E]">
                    Quy trình 4 giai đoạn bảo chứng tuần hoàn (Custody Protocol)
                  </h2>
                  <p className="text-xs text-stone-500">
                    Đảm bảo quyền lợi tuyệt đối cho thiết bị và hoàn trả tiền cọc không hao hụt
                  </p>
                </div>
              </div>

              {/* 4 Lifecycle Phases */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-5">
                {/* Phase 1 */}
                <div className="p-3.5 rounded-xl border border-[#EFECE6] bg-[#F5F2EB]/40 relative">
                  <span className="text-[10px] font-extrabold tracking-wider text-stone-500 uppercase block mb-1">
                    GIAI ĐOẠN 01
                  </span>
                  <h4 className="font-bold text-xs text-[#1E1E1E] mb-1">Pre-Handoff Sealed</h4>
                  <p className="text-[11px] text-stone-600 leading-relaxed">
                    Niêm phong xuất kho với biên bản kiểm định Bench Lab Grade A+ có chữ ký số kỹ thuật viên.
                  </p>
                </div>

                {/* Phase 2 */}
                <div className="p-3.5 rounded-xl border border-[#EFECE6] bg-[#F5F2EB]/40 relative">
                  <span className="text-[10px] font-extrabold tracking-wider text-stone-500 uppercase block mb-1">
                    GIAI ĐOẠN 02
                  </span>
                  <h4 className="font-bold text-xs text-[#1E1E1E] mb-1">3-Photo Check</h4>
                  <p className="text-[11px] text-stone-600 leading-relaxed">
                    Khách mở thùng, chụp 3 ảnh cảm biến/ngoại quan tải lên ứng dụng trong 4h để kích hoạt bảo vệ.
                  </p>
                </div>

                {/* Phase 3 */}
                <div className="p-3.5 rounded-xl border border-[#EFECE6] bg-[#F5F2EB]/40 relative">
                  <span className="text-[10px] font-extrabold tracking-wider text-stone-500 uppercase block mb-1">
                    GIAI ĐOẠN 03
                  </span>
                  <h4 className="font-bold text-xs text-[#1E1E1E] mb-1">Return Courier</h4>
                  <p className="text-[11px] text-stone-600 leading-relaxed">
                    Hết kỳ thuê, cho thiết bị vào thùng Nanuk, kẹp seal bảo mật chì và giao bưu tá lấy tận nhà.
                  </p>
                </div>

                {/* Phase 4 */}
                <div className="p-3.5 rounded-xl border border-[#4B6354]/30 bg-[#F3F6F4]/80 relative">
                  <span className="text-[10px] font-extrabold tracking-wider text-[#2D5A43] uppercase block mb-1">
                    GIAI ĐOẠN 04
                  </span>
                  <h4 className="font-bold text-xs text-[#2D5A43] mb-1">Escrow 100% Release</h4>
                  <p className="text-[11px] text-stone-700 leading-relaxed">
                    Tiền cọc giải ngân tự động 100% về tài khoản gốc trong vòng 4–24h sau khi hoàn tất kiểm tra kỹ thuật.
                  </p>
                </div>
              </div>

              {/* Accountability Checkbox */}
              <div className="mt-5 pt-4 border-t border-[#EFECE6]">
                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <input
                    checked={agreedTerms}
                    onChange={(e) => setAgreedTerms(e.target.checked)}
                    className="mt-0.5 rounded border-[#D8D2C6] text-[#1E1E1E] focus:ring-[#4B6354] w-4 h-4 cursor-pointer"
                    type="checkbox"
                  />
                  <span className="text-xs text-[#292724] leading-relaxed">
                    Tôi xác nhận đã đọc và hoàn toàn đồng ý với{' '}
                    <Link to="/how-it-works" className="font-semibold underline hover:text-[#3D5446]">
                      Quy ước Lưu giữ Bền vững ReUse Hub
                    </Link>
                    , quy trình chụp 3 ảnh đối chứng khi nhận hàng, và{' '}
                    <Link to="/about" className="font-semibold underline hover:text-[#3D5446]">
                      Cam kết Trách nhiệm Tuần hoàn
                    </Link>{' '}
                    với điều khoản hoàn trả tiền cọc 100%.
                  </span>
                </label>
              </div>
            </div>
          </section>

          {/* RIGHT COLUMN: STICKY ORDER SUMMARY & SETTLEMENT LEDGER (35%) */}
          <aside className="lg:col-span-4 sticky top-28 space-y-5">
            <div className="bg-[#FDFCF9] border border-[#E5E0D8] rounded-2xl p-6 shadow-md">
              {/* Ledger Header */}
              <div className="border-b border-[#EFECE6] pb-4">
                <span className="text-[10px] tracking-widest font-extrabold text-stone-500 uppercase block mb-1">
                  FINANCIAL LEDGER
                </span>
                <h2 className="font-serif text-xl font-bold text-[#1E1E1E]">Tổng kết Đơn thuê RENT</h2>
                <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 bg-[#F5F2EB] border border-[#E5E0D8] rounded text-[11px] font-medium text-[#292724]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#3D5446]" />
                  Đơn thuê đa thiết bị · Hợp đồng {contractId}
                </div>
              </div>

              {/* Formula Sub-banner */}
              <div className="py-2.5 px-3 bg-[#F5F2EB]/60 rounded-xl text-[10px] uppercase tracking-wider font-semibold text-stone-600 my-4 text-center border border-[#EFECE6]">
                Tổng Tiền = Tiền thuê ({rentalDays} ngày) + Ký quỹ Escrow + Vận chuyển 2 chiều
              </div>

              {/* Math Breakdown */}
              <div className="space-y-4 text-xs">
                {/* Group 1: Rental Fees */}
                <div className="space-y-2 pb-3 border-b border-[#EFECE6]">
                  <div className="font-bold text-[#1E1E1E] uppercase text-[11px] flex justify-between items-center">
                    <span>1. Tiền thuê thiết bị ({rentalDays} ngày)</span>
                    <span className="font-mono text-xs font-bold">{formatCurrency(totalRentFee)}</span>
                  </div>
                  {itemizedCalculations.map((item) => (
                    <div key={item.id} className="flex justify-between text-stone-600 pl-2">
                      <span className="truncate max-w-[210px]">
                        • {item.title} ({formatCurrency(item.dailyPrice)} × {rentalDays})
                      </span>
                      <span className="shrink-0">{formatCurrency(item.itemRentTotal)}</span>
                    </div>
                  ))}
                </div>

                {/* Group 2: Escrow Refundable Deposit */}
                <div className="space-y-2 pb-3 border-b border-[#EFECE6] bg-[#F3F6F4]/70 p-3 rounded-xl border border-[#4B6354]/20">
                  <div className="font-bold text-[#2D5A43] uppercase text-[11px] flex justify-between items-center">
                    <span className="flex items-center gap-1">
                      <svg className="w-3.5 h-3.5 text-[#3D5446]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                        />
                      </svg>
                      2. Tiền cọc Smart Escrow (Hoàn lại 100%)
                    </span>
                    <span className="font-mono text-xs font-bold text-[#2D5A43]">
                      {formatCurrency(totalDeposit)}
                    </span>
                  </div>
                  {itemizedCalculations.map((item) => (
                    <div key={item.id} className="flex justify-between text-stone-600 pl-4 text-[11px]">
                      <span className="truncate max-w-[190px]">• Cọc {item.title.split('+')[0]}:</span>
                      <span className="font-medium shrink-0">{formatCurrency(item.itemDeposit)}</span>
                    </div>
                  ))}
                  <p className="text-[10px] text-[#2D5A43]/85 leading-normal pt-1.5 border-t border-[#4B6354]/10 italic">
                    * Tiền cọc được khóa độc lập qua hợp đồng ký quỹ thông minh Smart Escrow, ReUse Hub hoàn trả tự động 100% vào tài khoản nguồn sau khi đối kiểm kết thúc kỳ thuê.
                  </p>
                </div>

                {/* Group 3: White glove logistics fee */}
                <div className="flex justify-between items-center py-1">
                  <div>
                    <span className="font-bold text-[#1E1E1E] block text-[11px]">
                      3. Bưu tá chuyên dụng Nanuk (2 chiều)
                    </span>
                    <span className="text-[10px] text-stone-500">Áp dụng trọn gói cho toàn đơn</span>
                  </div>
                  <span className="font-mono font-bold text-[#1E1E1E]">
                    {formatCurrency(NANUK_SHIPPING_FEE)}
                  </span>
                </div>

                {/* TOTAL DUE TODAY */}
                <div className="pt-4 border-t-2 border-[#1E1E1E] mt-2">
                  <div className="flex justify-between items-baseline">
                    <div>
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#1E1E1E] block">
                        TỔNG THANH TOÁN HÔM NAY
                      </span>
                      <span className="text-[10px] text-stone-500">
                        (Bao gồm {formatCurrency(totalDeposit)} tiền cọc hoàn lại)
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-serif text-2xl font-bold text-[#1E1E1E]">
                        {formatCurrency(totalDueToday)}
                      </span>
                    </div>
                  </div>
                  <div className="mt-1 text-right text-[10px] font-semibold text-[#3D5446]">
                    {refundablePercent}% số tiền sẽ được hoàn trả đầy đủ vào ngày {depositReleaseDate}
                  </div>
                </div>
              </div>

              {/* Payment Gateway Selection */}
              <div className="mt-6 pt-5 border-t border-[#EFECE6]">
                <label className="block text-[11px] font-extrabold uppercase tracking-wider text-[#292724] mb-2.5">
                  Phương thức thanh toán bảo chứng
                </label>

                {/* VNPay Radio Card */}
                <label
                  onClick={() => setPaymentMethod('vnpay')}
                  className={`p-3 rounded-xl block border-2 transition-all cursor-pointer ${
                    paymentMethod === 'vnpay'
                      ? 'bg-[#F5F2EB]/50 border-[#1E1E1E]'
                      : 'border-[#E5E0D8] hover:bg-[#F5F2EB]/30'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <input
                        checked={paymentMethod === 'vnpay'}
                        onChange={() => setPaymentMethod('vnpay')}
                        className="text-[#1E1E1E] focus:ring-[#3D5446]"
                        id="vnpay"
                        name="payment_method"
                        type="radio"
                      />
                      <span className="text-xs font-bold text-[#1E1E1E] cursor-pointer">
                        Cổng thanh toán VNPay (Mã hóa 256-bit HSM)
                      </span>
                    </div>
                    <span className="text-[9px] bg-[#1E1E1E] text-white font-bold px-1.5 py-0.5 rounded uppercase">
                      PCI-DSS L1
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-600 mt-2 pl-5">
                    Hỗ trợ VNPay-QR, Thẻ ATM Nội địa (Napas 247), Thẻ Quốc tế Visa, MasterCard, JCB với xác thực sinh trắc học OTP.
                  </p>
                </label>

                {/* Trust Security Indicators */}
                <div className="mt-3 grid grid-cols-2 gap-2 text-[10px] text-stone-600">
                  <div className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5 text-[#3D5446]" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        clipRule="evenodd"
                        d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35-.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        fillRule="evenodd"
                      />
                    </svg>
                    Bảo vệ chuẩn B-Corp
                  </div>
                  <div className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5 text-[#3D5446]" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        clipRule="evenodd"
                        d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                        fillRule="evenodd"
                      />
                    </svg>
                    Escrow Shield 100%
                  </div>
                </div>
              </div>

              {/* Main Call to Action Button */}
              <div className="mt-6 space-y-2.5">
                <button
                  type="button"
                  disabled={isSubmitting || rentItems.length === 0}
                  onClick={handleProcessCheckout}
                  className="w-full bg-[#1E1E1E] hover:bg-black text-white font-medium py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition duration-200 shadow-sm group cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>{submitStep || 'Đang xử lý thanh toán...'}</span>
                    </span>
                  ) : (
                    <>
                      <span className="text-xs tracking-wider uppercase font-bold">
                        THANH TOÁN QUA VNPAY ({formatCurrency(totalDueToday)})
                      </span>
                      <svg
                        className="w-4 h-4 transition-transform group-hover:translate-x-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M14 5l7 7m0 0l-7 7m7-7H3" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                      </svg>
                    </>
                  )}
                </button>

                <Link
                  to="/cart"
                  className="block text-center text-xs text-stone-600 hover:text-[#1E1E1E] py-1 font-medium transition"
                >
                  ← Quay lại Giỏ hàng tuần hoàn (/cart)
                </Link>
              </div>
            </div>

            {/* Escrow Protection Note Card */}
            <div className="bg-[#FDFCF9] border border-[#E5E0D8] rounded-2xl p-4.5 space-y-3">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-[#E8EFE9] text-[#2D5A43] shrink-0">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                    />
                  </svg>
                </div>
                <div>
                  <h4 className="font-serif text-xs font-bold text-[#1E1E1E]">Minh bạch Ký quỹ Escrow</h4>
                  <p className="text-[11px] text-stone-600 mt-0.5 leading-relaxed">
                    Tiền cọc được cách ly an toàn trong két bảo chứng ngân hàng liên kết. ReUse Hub không giữ và tuyệt đối không chiếm dụng nguồn vốn của khách hàng.
                  </p>
                </div>
              </div>
              <div className="pt-3 border-t border-[#EFECE6] flex items-center justify-between text-[11px]">
                <span className="text-stone-500">Hotline Bàn giao &amp; Kỹ thuật:</span>
                <a className="font-bold text-[#1E1E1E] hover:text-[#3D5446]" href="tel:+84236999821">
                  +84 236 999 821
                </a>
              </div>
            </div>
          </aside>
        </div>
        )}
      </main>

      {/* ── MODAL: EDIT SHIPPING ADDRESS ── */}
      {isEditingAddress && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in"
          onClick={() => setIsEditingAddress(false)}
        >
          <div
            className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl space-y-5 border border-[#E5E0D8]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#EFECE6]">
              <h3 className="font-serif text-lg font-bold text-[#1E1E1E]">
                Cập nhật địa chỉ nhận bàn giao Nanuk
              </h3>
              <button
                type="button"
                onClick={() => setIsEditingAddress(false)}
                className="p-1 rounded-full text-stone-400 hover:text-stone-700"
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
                  value={tempHolder}
                  onChange={(e) => setTempHolder(e.target.value)}
                  className="w-full border border-[#E5E0D8] rounded-xl px-3 py-2 text-xs text-[#1E1E1E] focus:outline-none focus:border-[#2D5A43]"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Số điện thoại đối kiểm SMS:
                </label>
                <input
                  type="text"
                  value={tempPhone}
                  onChange={(e) => setTempPhone(e.target.value)}
                  className="w-full border border-[#E5E0D8] rounded-xl px-3 py-2 text-xs text-[#1E1E1E] focus:outline-none focus:border-[#2D5A43]"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Địa chỉ chi tiết (Số nhà, Tầng, Tòa nhà, Phường, Quận, Thành phố):
                </label>
                <textarea
                  rows={3}
                  value={tempAddress}
                  onChange={(e) => setTempAddress(e.target.value)}
                  className="w-full border border-[#E5E0D8] rounded-xl px-3 py-2 text-xs text-[#1E1E1E] focus:outline-none focus:border-[#2D5A43]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#EFECE6]">
              <button
                type="button"
                onClick={() => setIsEditingAddress(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 hover:bg-[#F5F2EB]"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleSaveAddress}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#1E1E1E] hover:bg-black shadow-xs"
              >
                Lưu địa chỉ
              </button>
            </div>
          </div>
        </div>
      )}
      {/* In-app Toast Notification */}
      <div
        className={`fixed bottom-6 right-6 z-50 transform transition-all duration-300 pointer-events-none px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 text-xs sm:text-sm font-medium ${
          toast.show ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-12 opacity-0 scale-95'
        } ${
          toast.type === 'error'
            ? 'bg-rose-950 text-rose-100 border border-rose-800/80'
            : toast.type === 'warning'
            ? 'bg-amber-950 text-amber-100 border border-amber-800/80'
            : 'bg-[#141310] text-[#FBF9F6] border border-stone-800'
        }`}
      >
        <span
          className={`material-symbols-outlined text-[20px] ${
            toast.type === 'error'
              ? 'text-rose-400'
              : toast.type === 'warning'
              ? 'text-amber-400'
              : 'text-emerald-400'
          }`}
        >
          {toast.icon}
        </span>
        <span>{toast.message}</span>
      </div>
    </div>
  );
};

export default RentCheckout;
