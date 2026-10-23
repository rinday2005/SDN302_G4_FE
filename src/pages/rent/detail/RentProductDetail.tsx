import React, { useState, useMemo, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { useCartWishlist } from '../../../context/CartWishlistContext';
import { RentalCalendarPicker } from '../../../components/rent/RentalCalendarPicker';
import {
  getRentProductDetail,
  createRentProductDetail,
  getProductBookedDates,
  findEarliestAvailableRentalRange,
  hasDateRangeConflict,
  QUALITY_COMMITMENTS,
  RENT_8_STEPS_LIFECYCLE,
  RELATED_RENT_PRODUCTS,
  SHOP_OWNER_DATA,
} from '../../data/rent/rentOrderDetailData';
import type { RentProductDetailData } from '../../data/rent/rentOrderDetailData';
import { getPublicRentProductDetailApi } from '../../../services/rentProduct.api';

type TabKey = 'desc' | 'terms' | 'audit' | 'deposit' | 'shipping';

export const RentProductDetail: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [apiProduct, setApiProduct] = useState<RentProductDetailData | null>(null);

  // Fetch real product details from API if id matches database product
  useEffect(() => {
    if (!id) return;
    let isMounted = true;
    getPublicRentProductDetailApi(id)
      .then((res) => {
        if (!isMounted || !res || !res.product) return;
        const p = res.product;
        const catName = typeof p.categoryId === 'object' && p.categoryId?.name ? p.categoryId.name : 'RENT';
        const cond = p.condition || 'GOOD';
        const condLabel = cond === 'NEW' ? 'Mới 100%' : cond === 'LIKE_NEW' ? 'Như mới 99%' : 'Rất tốt 95%';
        const images = Array.isArray(p.images) && p.images.length > 0
          ? p.images.map((src, idx) => ({ src, alt: `${p.name} - Ảnh ${idx + 1}`, caption: p.name }))
          : [{ src: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=600&q=80', alt: p.name, caption: p.name }];
        const price = Number(p.pricePerDay) || 100000;
        const deposit = Number(p.depositAmount) || (price * 5);

        const detailed: RentProductDetailData = createRentProductDetail({
          id: p._id,
          slug: p._id,
          title: p.name,
          subtitle: p.description || `${p.name} · Tiêu chuẩn kiểm định ReUse`,
          category: catName.toUpperCase(),
          location: p.location || 'Đà Nẵng',
          rating: 5.0,
          reviewCount: 1,
          condition: condLabel,
          grade: cond === 'NEW' ? 'Grade Mint' : 'Grade A+',
          shutterOrUsage: `Lưu ký xác thực: ${condLabel}`,
          pricePerDay: price,
          deposit: deposit,
          depositFormatted: `${deposit.toLocaleString('vi-VN')}₫`,
          maxQuantity: p.totalQuantity || 1,
          size: (p.category === 'camera' || /canon|sony|nikon|fujifilm|dji|lens/i.test(p.name || '')) ? undefined : (p.size || 'L'),
          sizes: (p.category === 'camera' || /canon|sony|nikon|fujifilm|dji|lens/i.test(p.name || '')) ? [] : (Array.isArray(p.sizes) && p.sizes.length > 0 ? p.sizes : ['S', 'M', 'L', 'XL']),
          images,
          overview: [
            p.description || `${p.name} là sản phẩm lưu ký cao cấp được niêm phong tại kho ${p.location || 'Đà Nẵng'}.`,
            p.rentalRules ? `Quy tắc thuê: ${p.rentalRules}` : 'Sản phẩm đã qua khử trùng y tế tia UV-C và dán tem kiểm định ReUse Standard.'
          ],
          allowedConditions: p.rentalRules || 'Sử dụng đúng mục đích, trong môi trường an toàn, khô ráo, tránh va đập mạnh hoặc ngập nước.',
        });
        setApiProduct(detailed);
      })
      .catch((err) => {
        console.warn('Could not fetch rent product from API:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [id]);

  // Load product data based on API response, route param, or fallback
  const product: RentProductDetailData = useMemo(() => {
    if (apiProduct && (apiProduct.id === id || apiProduct.slug === id)) {
      return apiProduct;
    }
    return getRentProductDetail(id);
  }, [id, apiProduct]);

  // Gallery active thumbnail (auto-resets to 0 when id changes without effect setState)
  const [thumbState, setThumbState] = useState<{ id?: string; index: number }>({ id, index: 0 });
  const activeThumb = thumbState.id === id ? thumbState.index : 0;
  const setActiveThumb = (index: number) => setThumbState({ id, index });

  // Booked dates in future for this product
  const bookedDates = useMemo(() => {
    return getProductBookedDates(product);
  }, [product]);

  // Rental duration & quantities - Tự động tính khoảng ngày trống đầu tiên, không mặc định rơi vào ngày bị khóa (ví dụ 15, 16, 17)
  const [startDate, setStartDate] = useState(() => {
    const initialBooked = getProductBookedDates(product);
    return findEarliestAvailableRentalRange(initialBooked, 3).startDate;
  });
  const [endDate, setEndDate] = useState(() => {
    const initialBooked = getProductBookedDates(product);
    return findEarliestAvailableRentalRange(initialBooked, 3).endDate;
  });
  const [quantity, setQuantity] = useState(1);

  // Tabs
  const [activeTab, setActiveTab] = useState<TabKey>('desc');

  const { isWishlisted, toggleWishlist, addToCart } = useCartWishlist();
  const isWishlist = isWishlisted(product.id);

  // Guest auth requirement modal
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authActionName, setAuthActionName] = useState('');

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

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  // Tự động điều chỉnh ngày sang khoảng trống nếu danh sách ngày đã đặt thay đổi
  const [prevBooked, setPrevBooked] = useState(bookedDates);
  if (prevBooked !== bookedDates) {
    setPrevBooked(bookedDates);
    if (hasDateRangeConflict(startDate, endDate, bookedDates)) {
      const earliest = findEarliestAvailableRentalRange(bookedDates, 3);
      setStartDate(earliest.startDate);
      setEndDate(earliest.endDate);
    }
  }

  const isRangeConflicted = useMemo(() => {
    return hasDateRangeConflict(startDate, endDate, bookedDates);
  }, [startDate, endDate, bookedDates]);

  // Calculate rental days
  const days = useMemo(() => {
    if (!startDate || !endDate) return 1;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 1;
  }, [startDate, endDate]);

  const baseDailyRate = product.pricePerDay;
  const baseDeposit = product.deposit;
  const shippingFee = 25000;

  const rentTotal = baseDailyRate * days * quantity;
  const depositTotal = baseDeposit * quantity;
  const grandTotal = rentTotal + depositTotal + shippingFee;

  const formatVND = (amount: number) => {
    return new Intl.NumberFormat('vi-VN').format(amount) + '₫';
  };

  const handleQuantityChange = (delta: number) => {
    const next = quantity + delta;
    if (next >= 1 && next <= product.maxQuantity) {
      setQuantity(next);
    }
  };

  // Actions requiring customer account
  const handleProtectedAction = (actionTitle: string, onSuccess: () => void) => {
    if (!user) {
      setAuthActionName(actionTitle);
      setShowAuthModal(true);
      return;
    }
    onSuccess();
  };

  const handleRentNow = () => {
    if (hasDateRangeConflict(startDate, endDate, bookedDates)) {
      showToast(
        `Khoảng thời gian bạn chọn (${startDate} → ${endDate}) có ngày đã được khách khác đặt thuê. Vui lòng chọn ngày còn trống trên lịch!`,
        'event_busy',
        'warning'
      );
      return;
    }
    handleProtectedAction('thuê thiết bị này', () => {
      addToCart({
        id: product.id,
        title: product.title,
        price: product.pricePerDay,
        image: product.images[0]?.src || '',
        mode: 'rent',
        location: product.location,
        quantity,
        deposit: product.deposit,
        rentalDays: days,
        startDate: startDate,
        endDate: endDate,
        gradeBadge: product.grade,
      });
      navigate('/cart');
    });
  };

  const handleAddToCart = () => {
    if (hasDateRangeConflict(startDate, endDate, bookedDates)) {
      showToast(
        `Khoảng thời gian bạn chọn (${startDate} → ${endDate}) có ngày đã được khách khác đặt thuê. Vui lòng chọn ngày còn trống trên lịch!`,
        'event_busy',
        'warning'
      );
      return;
    }
    addToCart({
      id: product.id,
      title: product.title,
      price: product.pricePerDay,
      image: product.images[0]?.src || '',
      mode: 'rent',
      location: product.location,
      quantity,
      deposit: product.deposit,
      rentalDays: days,
      startDate: startDate,
      endDate: endDate,
      gradeBadge: product.grade,
    });
    showToast('Đã thêm sản phẩm vào giỏ hàng thuê tuần hoàn!', 'check_circle', 'success');
  };

  const handleChat = () => {
    handleProtectedAction('trò chuyện trực tiếp với Shop Owner', () => {
      navigate('/chat');
    });
  };

  const handleToggleWishlist = () => {
    toggleWishlist(product.id);
  };

  const currentPreview = product.images[activeThumb] || product.images[0];

  return (
    <div className="w-full min-h-screen bg-[#FBF9F5] text-[#1C1A18] antialiased">
      {/* Guest Auth Required Modal */}
      {showAuthModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
          onClick={() => setShowAuthModal(false)}
        >
          <div
            className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5 text-center relative border border-[#E7E2DA]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowAuthModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-[#F4F0EA] text-[#78736A] transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>

            <div className="w-14 h-14 rounded-full bg-[#F4F0EA] flex items-center justify-center text-[#1C1A18] mx-auto shadow-sm">
              <span className="material-symbols-outlined text-[28px]">lock_person</span>
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold text-[#1C1A18]">Yêu cầu Tài khoản Khách hàng</h3>
              <p className="text-xs text-[#5E5A53] leading-relaxed">
                Bạn đang truy cập ở chế độ công khai (Khách vãng lai). Để <strong>{authActionName}</strong>,
                vui lòng đăng nhập hoặc tạo tài khoản thành viên ReUse Hub.
              </p>
            </div>

            <div className="p-3.5 bg-[#F4F0EA]/70 rounded-2xl text-left space-y-1.5 text-xs text-[#5E5A53]">
              <div className="flex items-center gap-2 font-semibold text-[#1C1A18]">
                <span className="material-symbols-outlined text-[16px] text-emerald-700">verified</span>
                Quyền lợi khi đăng nhập:
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-[11px] text-[#78736A]">
                <li>Khởi tạo hợp đồng thuê điện tử và ký quỹ an toàn</li>
                <li>Hưởng chính sách Smart Escrow hoàn cọc tự động 100%</li>
                <li>Quản lý lịch trình giao nhận và bảo lưu đơn hàng</li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Link
                to={`/login?redirect=${encodeURIComponent(window.location.pathname)}&message=${encodeURIComponent(
                  `Bạn cần đăng nhập tài khoản để ${authActionName}!`
                )}`}
                className="flex-1 py-3 px-4 rounded-xl bg-[#1C1A18] text-white text-xs font-bold text-center hover:bg-[#292724] transition-all shadow-sm"
              >
                Đăng nhập ngay
              </Link>
              <Link
                to={`/register?redirect=${encodeURIComponent(window.location.pathname)}`}
                className="flex-1 py-3 px-4 rounded-xl bg-[#F4F0EA] text-[#1C1A18] text-xs font-bold text-center hover:bg-[#E7E2DA] transition-all"
              >
                Đăng ký tài khoản
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Main Inner Container */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-12">
        {/* 1. BREADCRUMB */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-[#78736A] tracking-wide">
          <Link to="/" className="hover:text-[#1C1A18] transition-colors">Trang chủ</Link>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <Link to="/rent" className="hover:text-[#1C1A18] transition-colors">RENT</Link>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span className="text-[#1C1A18] font-medium truncate max-w-xs">{product.title}</span>
        </nav>

        {/* 2. MAIN TWO-COLUMN PRODUCT SECTION */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-10 xl:gap-14 items-start">
          {/* CỘT TRÁI (LEFT COLUMN): GALLERY & QUALITY GUARANTEE */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            {/* Main Lifestyle Image Showcase */}
            <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-[#F4F0EA] shadow-sm group">
              <img
                className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.02]"
                src={currentPreview.src}
                alt={currentPreview.alt}
              />

              {/* Badges & Fast Actions Overlay */}
              <div className="absolute top-4 left-4 flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1C1A18]/90 text-[#FBF9F5] text-[11px] font-semibold tracking-wider uppercase backdrop-blur-md shadow-sm">
                  <span className="material-symbols-outlined text-[14px] text-amber-300">verified</span>
                  Đã kiểm định 95%
                </span>
                <span className="inline-flex items-center px-2.5 py-1.5 rounded-full bg-[#FBF9F5]/90 text-[#1C1A18] text-[11px] font-bold tracking-wider uppercase backdrop-blur-md">
                  {product.grade}
                </span>
              </div>

              <button
                type="button"
                onClick={handleToggleWishlist}
                title="Lưu vào danh sách yêu thích"
                className={`absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md transition-all shadow-sm hover:scale-105 ${
                  isWishlist
                    ? 'bg-red-500 text-white'
                    : 'bg-[#FBF9F5]/90 text-[#1C1A18] hover:bg-white'
                }`}
              >
                <span
                  className="material-symbols-outlined text-[20px]"
                  style={isWishlist ? { fontVariationSettings: "'FILL' 1" } : {}}
                >
                  favorite
                </span>
              </button>

              <div className="absolute bottom-4 left-4 right-4 bg-[#1C1A18]/80 backdrop-blur-md text-[#FBF9F5] p-3 rounded-xl flex items-center justify-between text-xs sm:opacity-90">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-emerald-400">qr_code_scanner</span>
                  <span>Mã kiểm định độc lập: <strong>{product.auditCode}</strong></span>
                </div>
                <span className="font-mono text-[11px] text-[#F4F0EA]/80">Kèm chứng nhận niêm phong</span>
              </div>
            </div>

            {/* Actual Thumbnails */}
            <div className="grid grid-cols-4 gap-3 sm:gap-4">
              {product.images.map((img, idx) => (
                <button
                  key={img.caption}
                  type="button"
                  onClick={() => setActiveThumb(idx)}
                  className={`group relative aspect-square rounded-xl overflow-hidden bg-[#F4F0EA] shadow-sm transition-all focus:outline-none ${
                    activeThumb === idx ? 'ring-2 ring-[#1C1A18]' : 'hover:opacity-90'
                  }`}
                >
                  <img
                    src={img.src}
                    alt={img.alt}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <span className="absolute inset-x-0 bottom-0 py-1 bg-[#1C1A18]/85 text-[10px] text-white font-medium text-center truncate px-1">
                    {img.caption}
                  </span>
                </button>
              ))}
            </div>

            {/* Khối cam kết "Bảo chứng từ ReUse Hub" */}
            <div className="bg-[#F4F0EA]/60 rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#1C1A18] text-[22px]">verified_user</span>
                  <h3 className="font-bold text-base sm:text-lg text-[#1C1A18]">Bảo chứng an tâm từ ReUse Hub</h3>
                </div>
                <span className="text-[11px] font-mono uppercase bg-white text-[#5E5A53] px-2.5 py-1 rounded-full shadow-xs">
                  Tiêu chuẩn 100%
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                {QUALITY_COMMITMENTS.map((qc) => (
                  <div key={qc.title} className="flex items-start gap-3 bg-white p-3.5 rounded-xl shadow-xs">
                    <span className="material-symbols-outlined text-emerald-700 text-[20px] shrink-0 mt-0.5">
                      {qc.icon}
                    </span>
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-[#1C1A18]">{qc.title}</p>
                      <p className="text-[11px] text-[#78736A] leading-relaxed">{qc.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* CỘT PHẢI (RIGHT COLUMN): SPEC, AVAILABILITY SELECTOR & RENTAL CALCULATOR */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            {/* Metadata Header */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded bg-[#F4F0EA] text-[#1C1A18] font-semibold uppercase tracking-wider text-[10px]">
                    {product.category}
                  </span>
                  <span className="text-[#78736A] flex items-center gap-1 font-medium">
                    <span className="material-symbols-outlined text-[14px]">location_on</span>
                    {product.location}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-xs">
                  <span
                    className="material-symbols-outlined text-amber-500 text-[16px]"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    star
                  </span>
                  <span className="font-bold text-[#1C1A18]">{product.rating}</span>
                  <span className="text-[#78736A]">({product.reviewCount} đánh giá thực tế)</span>
                </div>
              </div>

              <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl text-[#1C1A18] font-bold tracking-tight leading-snug">
                {product.title}
              </h1>
              <p className="text-sm text-[#5E5A53] font-medium leading-relaxed">
                {product.subtitle}
              </p>

              <div className="flex items-center gap-2.5 pt-1 flex-wrap">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 text-xs font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                  Tình trạng: {product.condition}
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#1C1A18] text-white text-xs font-bold shadow-2xs">
                  <span className="material-symbols-outlined text-[14px]">straighten</span>
                  Size: {product.size || 'L'}
                </span>
                <span className="text-xs text-[#78736A] font-mono">{product.shutterOrUsage}</span>
              </div>
            </div>

            {/* Giá thuê & Tiền cọc Panel */}
            <div className="bg-[#F4F0EA]/50 rounded-2xl p-5 shadow-xs space-y-3">
              <div className="flex items-baseline justify-between">
                <div className="space-y-0.5">
                  <span className="text-[11px] font-bold tracking-wider uppercase text-[#78736A]">Giá thuê theo ngày</span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-serif text-2xl sm:text-3xl font-bold text-[#1C1A18]">
                      {formatVND(product.pricePerDay)}
                    </span>
                    <span className="text-xs font-sans text-[#5E5A53] font-medium">/ ngày</span>
                  </div>
                </div>
                <div className="text-right space-y-0.5">
                  <span className="text-[11px] font-bold tracking-wider uppercase text-[#78736A]">Tiền cọc bảo đảm</span>
                  <p className="font-serif text-base sm:text-lg font-bold text-[#1C1A18]">{product.depositFormatted}</p>
                  <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-medium">
                    <span className="material-symbols-outlined text-[12px]">lock</span> Escrow an toàn
                  </span>
                </div>
              </div>

              {/* Thông tin Size sản phẩm chi tiết */}
              <div className="pt-2.5 border-t border-[#E7E2DA]/80 flex items-center justify-between text-xs flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#1C1A18] text-[17px]">apparel</span>
                  <span className="text-[#5E5A53]">
                    Kích cỡ sản phẩm: <strong className="text-[#1C1A18] font-bold">Size {product.size || 'L'}</strong>
                  </span>
                </div>
                <span className="text-[11px] text-[#78736A] font-medium bg-white px-2 py-0.5 rounded border border-[#E7E2DA]">
                  {product.size === 'S'
                    ? 'Phù hợp 1m50 - 1m62 · 42 - 50kg'
                    : product.size === 'M'
                    ? 'Phù hợp 1m58 - 1m68 · 48 - 58kg'
                    : product.size === 'XL'
                    ? 'Phù hợp 1m70 - 1m85 · 65 - 80kg'
                    : product.size === 'FREE_SIZE'
                    ? 'Form rộng đa năng · Free Size'
                    : 'Phù hợp 1m65 - 1m78 · 55 - 68kg'}
                </span>
              </div>
            </div>

            {/* KHỐI CHỌN THỜI GIAN THUÊ (AVAILABILITY & DURATION SELECTOR) */}
            <div className="bg-white rounded-2xl p-5 shadow-sm space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#1C1A18] flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px]">calendar_month</span>
                  Thời gian &amp; Số lượng thuê
                </h3>
                <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full">
                  Sẵn sàng giao ngay
                </span>
              </div>

              {/* Custom Rental Calendar & Booked dates in future */}
              <RentalCalendarPicker
                startDate={startDate}
                endDate={endDate}
                bookedRanges={bookedDates}
                onChange={(newStart, newEnd) => {
                  setStartDate(newStart);
                  setEndDate(newEnd);
                }}
              />

              {/* Quantity Selector */}
              <div className="flex items-center justify-between pt-1">
                <div>
                  <p className="text-xs font-semibold text-[#1C1A18]">Số lượng thiết bị</p>
                  <p className="text-[11px] text-[#78736A]">
                    Tối đa {product.maxQuantity} bộ có sẵn trong kho {product.location}
                  </p>
                </div>
                <div className="flex items-center bg-[#F4F0EA] rounded-xl p-1 shadow-xs">
                  <button
                    type="button"
                    onClick={() => handleQuantityChange(-1)}
                    disabled={quantity <= 1}
                    className="w-8 h-8 rounded-lg bg-white text-[#1C1A18] flex items-center justify-center hover:bg-white/80 transition-colors disabled:opacity-40"
                  >
                    <span className="material-symbols-outlined text-[16px]">remove</span>
                  </button>
                  <span className="w-10 text-center font-mono font-bold text-xs text-[#1C1A18]">
                    {quantity < 10 ? `0${quantity}` : quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleQuantityChange(1)}
                    disabled={quantity >= product.maxQuantity}
                    className="w-8 h-8 rounded-lg bg-white text-[#1C1A18] flex items-center justify-center hover:bg-white/80 transition-colors disabled:opacity-40"
                  >
                    <span className="material-symbols-outlined text-[16px]">add</span>
                  </button>
                </div>
              </div>
            </div>

            {/* BẢNG TÍNH TOÁN DỰ TOÁN THUÊ (RENTAL SUMMARY LEDGER) */}
            <div className="bg-[#F4F0EA]/30 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#1C1A18] flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px]">receipt_long</span>
                  Bảng kê dự toán thuê minh bạch
                </span>
                <span className="text-[11px] font-mono text-[#78736A]">Tự động đối soát</span>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between text-[#5E5A53]">
                  <span>Thời lượng thuê:</span>
                  <span className="font-medium text-[#1C1A18]">{days} ngày</span>
                </div>
                <div className="flex items-center justify-between text-[#5E5A53]">
                  <span>
                    Phí thuê thực tế ({formatVND(baseDailyRate)} × {days} ngày{quantity > 1 ? ` × ${quantity}` : ''}):
                  </span>
                  <span className="font-semibold text-[#1C1A18]">{formatVND(rentTotal)}</span>
                </div>
                <div className="flex items-center justify-between text-[#5E5A53]">
                  <div className="flex items-center gap-1">
                    <span>Vận chuyển 2 chiều có bảo hiểm:</span>
                    <span
                      className="material-symbols-outlined text-[14px] text-[#78736A]"
                      title="Bao gồm niêm phong chống sốc và bảo hiểm trầy xước trong quá trình di chuyển"
                    >
                      info
                    </span>
                  </div>
                  <span className="font-semibold text-[#1C1A18]">{formatVND(shippingFee)}</span>
                </div>
                <div className="flex items-center justify-between text-[#5E5A53]">
                  <div className="flex items-center gap-1">
                    <span>Tiền cọc bảo đảm (Hoàn lại 100%):</span>
                    <span className="material-symbols-outlined text-[14px] text-emerald-600">verified</span>
                  </div>
                  <span className="font-semibold text-[#1C1A18]">{formatVND(depositTotal)}</span>
                </div>
              </div>

              {/* Total Calculation */}
              <div className="pt-3 flex items-baseline justify-between bg-white p-3.5 rounded-xl shadow-xs">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#78736A]">Tổng thanh toán tạm tính</p>
                  <p className="text-[10px] text-[#78736A]">Bao gồm cọc bảo đảm</p>
                </div>
                <div className="text-right">
                  <span className="text-xl sm:text-2xl font-bold text-[#1C1A18]">
                    {formatVND(grandTotal)}
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-[#78736A] leading-relaxed italic">
                * Công thức: Tổng thanh toán = Phí thuê + Tiền cọc hoàn lại + Phí vận chuyển. Tiền cọc sẽ được hoàn trả tự động vào tài khoản sau khi trả đồ và kiểm định hoàn tất trong 2 giờ.
              </p>
            </div>

            {/* CỤM NÚT HÀNH ĐỘNG DÀNH CHO KHÁCH & CUSTOMER */}
            <div className="space-y-3 pt-1">
              {isRangeConflicted && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 animate-fade-in shadow-xs">
                  <span className="material-symbols-outlined text-[18px] text-rose-600 shrink-0 mt-0.5">event_busy</span>
                  <div className="flex-1">
                    <p className="font-bold">Lịch thuê ({startDate} → {endDate}) đang trùng ngày đã có khách đặt!</p>
                    <p className="text-[11px] text-rose-700 mt-0.5">Vui lòng bấm vào ô "Ngày nhận máy" ở trên để chọn khoảng ngày trống trước khi đặt thuê.</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleRentNow}
                  disabled={isRangeConflicted}
                  className={`w-full py-3.5 px-6 rounded-full text-xs font-bold tracking-wider uppercase text-center transition-all shadow-md flex items-center justify-center gap-2 ${
                    isRangeConflicted
                      ? 'bg-stone-300 text-stone-500 cursor-not-allowed opacity-60'
                      : 'bg-[#1C1A18] hover:bg-[#292724] text-white hover:shadow-lg cursor-pointer'
                  }`}
                  title={isRangeConflicted ? 'Không thể thuê do khoảng ngày chọn đã có khách đặt' : 'Tiến hành thuê ngay'}
                >
                  <span className="material-symbols-outlined text-[18px]">cached</span>
                  Thuê ngay
                </button>
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={isRangeConflicted}
                  className={`w-full py-3.5 px-6 rounded-full text-xs font-bold tracking-wider uppercase text-center transition-all shadow-sm border border-[#E7E2DA] flex items-center justify-center gap-2 ${
                    isRangeConflicted
                      ? 'bg-stone-100 text-stone-400 border-stone-200 cursor-not-allowed opacity-60'
                      : 'bg-white hover:bg-[#F4F0EA] text-[#1C1A18] cursor-pointer'
                  }`}
                  title={isRangeConflicted ? 'Không thể thêm vào giỏ do khoảng ngày chọn đã có khách đặt' : 'Thêm vào giỏ hàng'}
                >
                  <span className="material-symbols-outlined text-[18px]">add_shopping_cart</span>
                  Thêm vào giỏ
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  onClick={handleChat}
                  className="py-2.5 px-4 rounded-xl bg-[#F4F0EA]/70 hover:bg-[#F4F0EA] text-[#1C1A18] text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">chat</span>
                  Chat với Shop Owner
                </button>
                <button
                  type="button"
                  onClick={handleToggleWishlist}
                  className="py-2.5 px-4 rounded-xl bg-[#F4F0EA]/70 hover:bg-[#F4F0EA] text-[#1C1A18] text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {isWishlist ? 'favorite' : 'favorite_border'}
                  </span>
                  {isWishlist ? 'Đã lưu yêu thích' : 'Lưu mong muốn'}
                </button>
              </div>
            </div>

            {/* THÔNG TIN SHOP OWNER ĐÃ ĐƯỢC XÁC THỰC */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#78736A]">
                  Đơn vị sở hữu thiết bị
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full font-semibold">
                  <span className="material-symbols-outlined text-[12px]">verified</span> KYC Đã xác minh CCCD
                </span>
              </div>
              <div className="flex items-center gap-3.5 pt-1">
                <div className="w-12 h-12 rounded-full bg-[#1C1A18] text-white flex items-center justify-center text-lg font-bold shadow-sm shrink-0">
                  {SHOP_OWNER_DATA.avatarText}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-sm text-[#1C1A18] truncate">{SHOP_OWNER_DATA.name}</h4>
                    <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 text-[9px] font-bold shrink-0">
                      {SHOP_OWNER_DATA.badge}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[#78736A] pt-0.5">
                    <span>{SHOP_OWNER_DATA.successOrders}</span>
                    <span>•</span>
                    <span className="text-emerald-700 font-medium">{SHOP_OWNER_DATA.responseTime}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. CÁC TAB THÔNG TIN SẢN PHẨM CHI TIẾT (PRODUCT INFORMATION TABS) */}
        <section className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
          {/* Tabs Navigation */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {[
              { id: 'desc', label: 'Mô tả & Phụ kiện' },
              { id: 'terms', label: 'Điều khoản & Bảo quản' },
              { id: 'audit', label: 'Tình trạng thực tế (Audit)' },
              { id: 'deposit', label: 'Chính sách Cọc & Hoàn tiền' },
              { id: 'shipping', label: 'Vận chuyển & Giao nhận' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as TabKey)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors shrink-0 ${
                  activeTab === tab.id
                    ? 'bg-[#1C1A18] text-white shadow-xs'
                    : 'bg-[#F4F0EA]/60 text-[#5E5A53] hover:text-[#1C1A18]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content 1: Mô tả & Phụ kiện */}
          {activeTab === 'desc' && (
            <div className="space-y-6 pt-2">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-4">
                  <h3 className="font-serif font-bold text-lg text-[#1C1A18]">Tổng quan thiết bị chuyên nghiệp</h3>
                  {product.overview.map((para, i) => (
                    <p key={i} className="text-xs sm:text-sm text-[#5E5A53] leading-relaxed">
                      {para}
                    </p>
                  ))}
                </div>

                <div className="bg-[#F4F0EA]/40 p-5 rounded-xl space-y-3 shadow-xs">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#1C1A18] flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[18px]">inventory_2</span>
                    Bộ phụ kiện bàn giao kèm theo
                  </h4>
                  <ul className="text-xs space-y-2 text-[#5E5A53]">
                    {product.accessories.map((acc, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[15px] text-emerald-700">check_circle</span>
                        <span>{acc}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Tab Content 2: Điều khoản & Bảo quản */}
          {activeTab === 'terms' && (
            <div className="space-y-4 pt-2">
              <h3 className="font-serif font-bold text-lg text-[#1C1A18]">Quy chuẩn sử dụng &amp; Trách nhiệm bảo quản</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-[#5E5A53]">
                <div className="p-4 bg-[#F4F0EA]/30 rounded-xl space-y-2">
                  <p className="font-bold text-[#1C1A18]">✓ Môi trường hoạt động cho phép:</p>
                  <p className="leading-relaxed">{product.allowedConditions}</p>
                </div>
                <div className="p-4 bg-[#F4F0EA]/30 rounded-xl space-y-2">
                  <p className="font-bold text-[#1C1A18]">✕ Các hành vi bị nghiêm cấm:</p>
                  <p className="leading-relaxed">{product.prohibitedActions}</p>
                </div>
              </div>
            </div>
          )}

          {/* Tab Content 3: Tình trạng thực tế (Audit Report) */}
          {activeTab === 'audit' && (
            <div className="space-y-4 pt-2">
              <h3 className="font-serif font-bold text-lg text-[#1C1A18]">Biên bản nghiệm thu kỹ thuật (Audit Log)</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                {product.auditItems.map((item) => (
                  <div key={item.label} className="p-4 bg-[#F4F0EA]/40 rounded-xl space-y-1">
                    <span className="text-[#78736A] text-[11px]">{item.label}</span>
                    <p className="font-bold text-[#1C1A18] text-sm">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab Content 4: Chính sách Cọc & Hoàn tiền */}
          {activeTab === 'deposit' && (
            <div className="space-y-4 pt-2 text-xs text-[#5E5A53] leading-relaxed">
              <h3 className="font-serif font-bold text-lg text-[#1C1A18]">Cơ chế Ký quỹ Smart Escrow</h3>
              <p>
                Khoản tiền cọc <strong>{product.depositFormatted}</strong> không chuyển trực tiếp cho người cho thuê mà được hệ thống ReUse Hub giữ trung gian an toàn. Ngay sau khi đơn vị vận chuyển bàn giao thiết bị hoàn trả lại trạm trung tâm và kỹ thuật viên quét mã kiểm tra tình trạng trong 2 giờ, số tiền cọc sẽ được hoàn trả tự động 100% về tài khoản ngân hàng hoặc ví đã thanh toán của bạn mà không phát sinh thêm chi phí trung gian.
              </p>
            </div>
          )}

          {/* Tab Content 5: Vận chuyển & Giao nhận */}
          {activeTab === 'shipping' && (
            <div className="space-y-4 pt-2 text-xs text-[#5E5A53] leading-relaxed">
              <h3 className="font-serif font-bold text-lg text-[#1C1A18]">Quy trình đóng gói &amp; Vận chuyển chống sốc</h3>
              <p>
                Thiết bị được vận chuyển bằng thùng chống sốc tiêu chuẩn có khóa niêm phong dây rút kèm tem an ninh một chiều. Khi nhận hàng, khách hàng đồng kiểm mã QR tem với tài xế trước khi mở hộp. Sau khi kết thúc thời gian thuê, nhân viên chuyển phát sẽ đến tận địa chỉ của bạn để thu hồi thiết bị với biên bản điện tử tức thì.
              </p>
            </div>
          )}
        </section>

        {/* 4. QUY TRÌNH THUÊ BẢO ĐẢM 8 BƯỚC */}
        <section className="bg-[#F4F0EA]/40 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-widest text-[#78736A]">
                Hành trình tuần hoàn
              </span>
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#1C1A18]">
                Quy trình thuê bảo đảm 8 bước tại ReUse Hub
              </h2>
            </div>
            <span className="text-xs font-semibold text-[#5E5A53] bg-white px-3 py-1 rounded-full shadow-xs w-fit">
              100% Minh bạch rủi ro
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 pt-2">
            {RENT_8_STEPS_LIFECYCLE.map((step) => (
              <div
                key={step.step}
                className={`flex flex-col p-3.5 rounded-xl shadow-xs space-y-1.5 ${
                  step.highlight ? 'bg-emerald-50/70 border border-emerald-200' : 'bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[10px] font-mono font-bold ${
                      step.highlight ? 'text-emerald-800' : 'text-[#78736A]'
                    }`}
                  >
                    {step.step}
                  </span>
                  <span
                    className={`material-symbols-outlined text-[18px] ${
                      step.highlight ? 'text-emerald-700' : 'text-[#1C1A18]'
                    }`}
                  >
                    {step.icon}
                  </span>
                </div>
                <p className="font-bold text-xs text-[#1C1A18]">{step.title}</p>
                <p className="text-[10px] text-[#78736A] leading-tight">{step.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 5. SẢN PHẨM LIÊN QUAN ("CÓ THỂ BẠN CŨNG THÍCH") */}
        <section className="space-y-6 pt-2">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-widest text-[#78736A]">
                Gợi ý thiết bị RENT
              </span>
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#1C1A18]">Có thể bạn cũng thích</h2>
            </div>
            <Link
              to="/rent"
              className="text-xs font-semibold text-[#1C1A18] hover:underline flex items-center gap-1"
            >
              Xem tất cả <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {RELATED_RENT_PRODUCTS.map((item) => (
              <Link
                key={item.id}
                to={item.href}
                className="group flex flex-col bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all border border-[#E7E2DA]/40"
              >
                <div className="relative aspect-[4/3] bg-[#F4F0EA] overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <span className="absolute top-3 left-3 px-2 py-0.5 rounded bg-[#1C1A18]/90 text-white text-[10px] font-bold uppercase tracking-wider backdrop-blur-xs">
                    {item.grade}
                  </span>
                </div>

                <div className="p-4 flex flex-col flex-1 justify-between space-y-3">
                  <div>
                    <p className="text-[10px] font-bold text-[#78736A] uppercase tracking-wider">
                      {item.categoryTag}
                    </p>
                    <h3 className="font-serif font-bold text-base text-[#1C1A18] group-hover:text-amber-800 transition-colors line-clamp-1">
                      {item.title}
                    </h3>
                  </div>

                  <div className="pt-2 bg-[#F4F0EA]/30 p-2.5 rounded-xl space-y-1">
                    <div className="flex items-baseline justify-between">
                      <span className="text-[10px] text-[#78736A] uppercase font-medium">Giá thuê:</span>
                      <span className="font-serif font-bold text-[#1C1A18] text-sm">
                        {formatVND(item.price)}{' '}
                        <span className="font-sans text-[10px] font-normal text-[#78736A]">/ngày</span>
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between text-[11px]">
                      <span className="text-[#78736A]">Tiền cọc:</span>
                      <span className="font-medium text-[#1C1A18]">{item.deposit}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
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

export default RentProductDetail;
