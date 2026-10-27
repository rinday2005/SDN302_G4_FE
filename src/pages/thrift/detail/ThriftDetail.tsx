import React, { useState, useMemo, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { useCartWishlist } from '../../../context/CartWishlistContext';
import { getPublicThriftListingByIdApi } from '../../../services/thrift.api';
import {
  getThriftProductDetail,
  THRIFT_RELATED_PRODUCTS,
} from '../../data/thrift/thriftDetailData';
import type { ThriftProductDetail } from '../../data/thrift/thriftDetailData';

type InfoTab = 'desc' | 'audit' | 'origin' | 'shipping';

export const ThriftDetail: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isWishlisted, toggleWishlist, addToCart } = useCartWishlist();

  const baseProduct: ThriftProductDetail = useMemo(() => getThriftProductDetail(id), [id]);
  const [dbProduct, setDbProduct] = useState<Partial<ThriftProductDetail> | null>(null);
  const [selectedSize, setSelectedSize] = useState<string>('L');

  useEffect(() => {
    if (!id) return;
    getPublicThriftListingByIdApi(id)
      .then((data) => {
        if (data) {
          setDbProduct({
            id: data._id,
            title: data.name,
            price: data.price,
            quantity: data.quantity,
            sizes: (data.category === 'camera' || (data.name && /canon|sony|nikon|fujifilm|dji|leica/i.test(data.name))) ? [] : (data.sizes || ['S', 'M', 'L', 'XL']),
            size: (data.category === 'camera' || (data.name && /canon|sony|nikon|fujifilm|dji|leica/i.test(data.name))) ? undefined : (data.size || 'L'),
            status: data.status,
            sourceType: data.sourceType,
            conditionLabel: data.condition || 'Rất tốt (95%)',
            location: data.location || 'Đà Nẵng',
            mainImage: data.images && data.images.length > 0 ? data.images[0] : undefined,
          });
          if (data.size) {
            setSelectedSize(data.size);
          }
        }
      })
      .catch((err) => {
        console.warn('Could not load live thrift listing:', err);
      });
  }, [id]);

  const product: ThriftProductDetail = useMemo(() => {
    if (!dbProduct) return baseProduct;
    return {
      ...baseProduct,
      ...dbProduct,
      id: dbProduct.id || baseProduct.id,
      title: dbProduct.title || baseProduct.title,
      price: dbProduct.price ?? baseProduct.price,
      mainImage: dbProduct.mainImage || baseProduct.mainImage,
    };
  }, [baseProduct, dbProduct]);

  const isSoldOut = product.status === 'SOLD' || (product.quantity !== undefined && product.quantity <= 0);
  const isRentalSource = product.sourceType === 'RENTAL_PRODUCT' || product.source === 'rent';
  const isCameraCategory = product.category === 'camera' || (product.categoryLabel || '').toLowerCase().includes('camera') || (product.categoryLabel || '').toLowerCase().includes('máy ảnh') || /canon|sony|nikon|fujifilm|dji|leica|lumix/i.test(product.title);
  const showSizeSelector = !isCameraCategory && Array.isArray(product.sizes) && product.sizes.length > 0;

  const [thumbState, setThumbState] = useState<{ id?: string; index: number }>({ id, index: 0 });
  const activeThumb = thumbState.id === id ? thumbState.index : 0;
  const setActiveThumb = (index: number) => setThumbState({ id, index });

  const [activeTab, setActiveTab] = useState<InfoTab>('desc');
  const isWishlist = isWishlisted(product.id);
  const [authModal, setAuthModal] = useState<{ open: boolean; actionName: string; targetUrl: string }>({
    open: false, actionName: '', targetUrl: '',
  });

  useEffect(() => { window.scrollTo(0, 0); }, [id]);

  const formatVND = (amount: number) => new Intl.NumberFormat('vi-VN').format(amount) + '₫';

  const handleProtected = (actionName: string, targetUrl: string, onSuccess: () => void) => {
    if (!user) { setAuthModal({ open: true, actionName, targetUrl }); return; }
    onSuccess();
  };

  const handleBuyNow = () => {
    handleProtected(`mua ngay "${product.title}"`, '/cart',
      () => {
        addToCart({
          id: product.id,
          title: product.title,
          price: product.price,
          image: activeImage,
          mode: 'thrift',
          location: product.location,
          categoryLabel: product.categoryLabel,
          gradeBadge: product.conditionLabel,
          quantity: 1,
          size: showSizeSelector ? selectedSize : undefined,
        });
        navigate('/cart');
      });
  };

  const handleAddToCart = () => {
    addToCart({
      id: product.id,
      title: product.title,
      price: product.price,
      image: activeImage,
      mode: 'thrift',
      location: product.location,
      categoryLabel: product.categoryLabel,
      gradeBadge: product.conditionLabel,
      quantity: 1,
      size: showSizeSelector ? selectedSize : undefined,
    });
  };

  const handleWishlist = () => {
    toggleWishlist(product.id, 'THRIFT');
  };

  const handleChat = () => {
    if (user?.role === 'SHOP_OWNER') {
      navigate('/shop/messages');
      return;
    }
    handleProtected(
      `chat với Shop Owner về "${product.title}"`,
      `/thrift/${product.slug || product.id}`,
      () => {
        navigate('/messages', {
          state: {
            inquiry: {
              id: product.id,
              title: product.title,
              imageUrl: activeImage || product.mainImage || '',
              priceText: `${product.price.toLocaleString('vi-VN')}₫`,
              type: 'THRIFT',
              url: `/thrift/${product.slug || product.id}`,
            },
          },
        });
      }
    );
  };

  const closeAuthModal = () => setAuthModal({ open: false, actionName: '', targetUrl: '' });

  const activeImage = activeThumb === 0 ? product.mainImage : (product.thumbnails[activeThumb - 1]?.src ?? product.mainImage);

  const tabs: { key: InfoTab; label: string }[] = [
    { key: 'desc', label: 'Mô tả sản phẩm' },
    { key: 'audit', label: 'Kiểm định (Audit)' },
    { key: 'origin', label: 'Nguồn gốc & Lịch sử' },
    { key: 'shipping', label: 'Vận chuyển & Bảo đảm' },
  ];

  return (
    <div className="w-full min-h-screen bg-[#FBF9F5] text-[#1C1A18] antialiased">

      {/* ── Auth Modal ── */}
      {authModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={closeAuthModal}>
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5 text-center relative border border-[#E7E2DA]" onClick={(e) => e.stopPropagation()}>
            <button type="button" onClick={closeAuthModal} className="absolute top-4 right-4 p-2 rounded-full hover:bg-[#F4F0EA] text-[#78736A] transition-colors cursor-pointer">
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
            <div className="w-14 h-14 rounded-full bg-[#F4F0EA] flex items-center justify-center text-[#1C1A18] mx-auto shadow-sm">
              <span className="material-symbols-outlined text-[28px]">lock_person</span>
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-[#1C1A18]">Yêu cầu Đăng nhập</h3>
              <p className="text-xs text-[#5E5A53] leading-relaxed">
                Bạn đang truy cập ở chế độ công khai. Để <strong>{authModal.actionName}</strong>, vui lòng đăng nhập hoặc tạo tài khoản thành viên ReUse Hub.
              </p>
            </div>
            <div className="p-3.5 bg-[#F4F0EA]/70 rounded-2xl text-left space-y-1.5 text-xs text-[#5E5A53] border border-[#E7E2DA]">
              <div className="flex items-center gap-2 font-semibold text-[#1C1A18]">
                <span className="material-symbols-outlined text-[16px] text-emerald-700">verified</span>
                Quyền lợi thành viên THRIFT:
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-[11px] text-[#78736A]">
                <li>Bảo chứng đổi trả trong 72 giờ unboxing</li>
                <li>Thanh toán an toàn qua cổng Smart Escrow</li>
                <li>Hưởng chính sách giảm phát thải CO2 tích điểm xanh</li>
              </ul>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Link
                to={`/login?redirect=${encodeURIComponent(authModal.targetUrl)}&message=${encodeURIComponent(`Bạn cần đăng nhập để ${authModal.actionName}!`)}`}
                className="flex-1 py-3 px-4 rounded-xl bg-[#1C1A18] text-white text-xs font-bold text-center hover:bg-[#292724] transition-all shadow-sm"
              >
                Đăng nhập ngay
              </Link>
              <Link
                to={`/register?redirect=${encodeURIComponent(authModal.targetUrl)}`}
                className="flex-1 py-3 px-4 rounded-xl bg-[#F4F0EA] text-[#1C1A18] text-xs font-bold text-center hover:bg-[#E7E2DA] transition-all"
              >
                Đăng ký tài khoản
              </Link>
            </div>
          </div>
        </div>
      )}

      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-12">
        {/* ── Breadcrumb ── */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-[#78736A] tracking-wide">
          <Link to="/" className="hover:text-[#1C1A18] transition-colors">Trang chủ</Link>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <Link to="/thrift" className="hover:text-[#1C1A18] transition-colors">THRIFT</Link>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span className="text-[#1C1A18] font-medium truncate max-w-xs">{product.title}</span>
        </nav>

        {/* ── Two-column product display ── */}
        <div data-reveal className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
          {/* LEFT: Gallery */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-[#E7E2DA] p-3 shadow-sm relative group overflow-hidden">
              <div className="aspect-[4/3] rounded-xl overflow-hidden bg-[#F4F0EA] relative flex items-center justify-center">
                <img
                  key={activeImage}
                  src={activeImage}
                  alt={product.title}
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
                />
                <div className="absolute top-3.5 left-3.5 flex flex-wrap gap-2">
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase bg-[#1C1A18] text-white shadow-sm flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[13px] text-[#B4C292]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                    ĐÃ THẨM ĐỊNH {product.conditionLabel.match(/\d+%/)?.[0] ?? '95%'}
                  </span>
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#F4EFEA]/95 backdrop-blur-sm text-[#1C1A18] border border-[#E7E2DA]">
                    {product.sourceLabel}
                  </span>
                </div>
                <div className="absolute bottom-3 left-3.5 right-3.5 flex items-center justify-between text-[10px] text-white/90 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10">
                  <span className="font-mono">Mã định danh: {product.specimenCode}</span>
                  <span className="flex items-center gap-1 text-[#D5DFC3]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#B4C292] inline-block" />
                    Tem niêm phong ReUse Hub
                  </span>
                </div>
              </div>
            </div>

            {/* Thumbnails */}
            <div className="grid grid-cols-4 gap-3">
              <button type="button" title="Ảnh chính" onClick={() => setActiveThumb(0)}
                className={`aspect-square rounded-xl overflow-hidden bg-[#F4F0EA] p-1 transition-all focus:outline-none ${activeThumb === 0 ? 'border-2 border-[#1C1A18] shadow-sm' : 'border border-[#E7E2DA] hover:border-[#78736A]'}`}>
                <img src={product.mainImage} alt={product.title} className="w-full h-full object-cover rounded-lg" />
              </button>
              {product.thumbnails.map((thumb, i) => (
                <button key={i} type="button" title={thumb.title} onClick={() => setActiveThumb(i + 1)}
                  className={`aspect-square rounded-xl overflow-hidden bg-[#F4F0EA] p-1 transition-all focus:outline-none ${activeThumb === i + 1 ? 'border-2 border-[#1C1A18] shadow-sm' : 'border border-[#E7E2DA] hover:border-[#78736A]'}`}>
                  <img src={thumb.src} alt={thumb.alt} className="w-full h-full object-cover rounded-lg" />
                </button>
              ))}
            </div>

            {/* Photo note */}
            <div className="bg-white rounded-xl border border-[#E7E2DA] p-4 flex items-start gap-3.5 shadow-sm">
              <div className="w-8 h-8 rounded-lg bg-[#F4F0EA] flex items-center justify-center shrink-0 text-[#1C1A18]">
                <span className="material-symbols-outlined text-[18px]">photo_camera</span>
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#1C1A18] mb-0.5">Cam kết ảnh chụp thực tế 100%</h4>
                <p className="text-[11px] text-[#78736A] leading-relaxed">
                  Tất cả hình ảnh hiển thị phản ánh chính xác tình trạng thực tế của sản phẩm. Bảo chứng kiểm tra 72h khi unboxing.
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT: Info + Purchase */}
          <div className="space-y-5">
            <div className="space-y-2 border-b border-[#E7E2DA] pb-5">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2 text-xs text-[#78736A]">
                  <span className="font-bold uppercase tracking-wider">{product.categoryLabel}</span>
                  <span className="text-[#E7E2DA]">·</span>
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[13px]">location_on</span>
                    {product.location}
                  </span>
                </div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#F4EFEA] text-[#1C1A18] border border-[#E7E2DA]">
                  Nguồn gốc: {product.sourceLabel}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#1C1A18] tracking-tight leading-tight">{product.title}</h1>
              <p className="text-xs sm:text-sm text-[#78736A] leading-relaxed">{product.subtitle}</p>
              <div className="flex items-center flex-wrap gap-4 pt-2 text-xs">
                <div className="flex items-center gap-1.5 bg-[#F4F0EA] px-3 py-1 rounded-full border border-[#E7E2DA]">
                  <span className="text-[#78736A] font-medium">Tình trạng:</span>
                  <span className="font-bold text-[#1C1A18]">{product.conditionLabel}</span>
                </div>
                <div className="flex items-center gap-1 text-[#1C1A18] font-semibold">
                  <span className="material-symbols-outlined text-[15px] text-amber-500" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  <span>{product.rating.toFixed(1)}</span>
                  <span className="text-[#78736A] font-normal">({product.reviewCount} đánh giá)</span>
                </div>
              </div>
            </div>

            {/* Pricing Card */}
            <div className="bg-white rounded-2xl border border-[#E7E2DA] p-5 shadow-sm space-y-4">
              <div className="flex items-baseline justify-between flex-wrap gap-2">
                <div>
                  <span className="text-[11px] uppercase font-bold tracking-wider text-[#78736A] block">Giá mua trọn gói sở hữu</span>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-3xl font-bold text-[#1C1A18]">{formatVND(product.price)}</span>
                    <span className="text-xs text-[#78736A] line-through">{formatVND(product.originalPrice)}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] bg-[#F4F0EA] text-[#1C1A18] px-2.5 py-1 rounded-md font-semibold border border-[#E7E2DA]">
                    {product.discountNote}
                  </span>
                  <span className="block text-[11px] text-[#78736A] mt-1">Đã bao gồm VAT & chứng nhận</span>
                </div>
              </div>

              {/* Verified by */}
              <div className="bg-[#F4F0EA]/70 rounded-xl p-3 border border-[#E7E2DA] flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-[#1C1A18] text-white flex items-center justify-center text-xs font-bold">SO</div>
                  <div>
                    <span className="font-bold text-[#1C1A18]">{product.verifiedBy}</span>
                    <span className="text-[11px] text-[#78736A] block">{product.verifiedByRole}</span>
                  </div>
                </div>
                <span className="inline-flex items-center text-[10px] text-emerald-700 font-bold bg-white px-2 py-0.5 rounded border border-[#E7E2DA]">
                  ✓ Được kiểm chứng
                </span>
              </div>

              {/* Reassurance */}
              <div className="grid grid-cols-2 gap-2 text-[11px] text-[#78736A] pt-1">
                {product.reassurancePoints.map((point, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[14px] text-[#1C1A18]">check</span>
                    <span>{point}</span>
                  </div>
                ))}
              </div>

              {/* Size Selector (Ẩn đối với chuyên mục Camera / Máy ảnh) */}
              {showSizeSelector && (
                <div className="space-y-2 pt-2 pb-1 border-t border-[#E7E2DA]/70">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#78736A]">
                      Chọn Kích cỡ / Size: <strong className="text-[#1C1A18] font-mono text-xs">{selectedSize}</strong>
                    </span>
                    <span className="text-[10px] text-[#78736A]">Form chuẩn Atelier</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {(product.sizes || []).map((s: string) => (
                      <button
                        key={s}
                        type="button"
                        disabled={isSoldOut}
                        onClick={() => setSelectedSize(s)}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                          selectedSize === s
                            ? 'bg-[#1C1A18] text-white border-[#1C1A18] shadow-xs'
                            : 'bg-white text-[#5E5A53] border-[#E7E2DA] hover:bg-[#F4F0EA]'
                        } ${isSoldOut ? 'opacity-40 cursor-not-allowed' : ''}`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Tình trạng tồn kho */}
              <div className="bg-[#F4F0EA]/60 rounded-xl p-3 border border-[#E7E2DA] text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[#5E5A53]">
                    {isRentalSource ? 'Hiện vật tuần hoàn Second-Life:' : 'Số lượng tồn kho trong kho:'}
                  </span>
                  <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Còn {product.quantity ?? 5} sản phẩm
                  </span>
                </div>
              </div>

              {/* CTA Buttons */}
              <div className="pt-1 space-y-2.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={handleBuyNow}
                    className="w-full py-3.5 px-4 text-xs font-bold uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer bg-[#1C1A18] hover:bg-black text-white hover:shadow-lg"
                  >
                    <span className="material-symbols-outlined text-[16px]">bolt</span>
                    Mua ngay
                  </button>
                  <button
                    type="button"
                    onClick={handleAddToCart}
                    className="w-full py-3.5 px-4 text-xs font-bold uppercase tracking-wider rounded-xl border transition-all flex items-center justify-center gap-2 cursor-pointer bg-[#F4F0EA] hover:bg-[#EBE5DE] text-[#1C1A18] border-[#E7E2DA]"
                  >
                    <span className="material-symbols-outlined text-[16px]">shopping_bag</span>
                    Thêm vào giỏ
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button type="button" onClick={handleWishlist}
                    className={`py-2.5 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${isWishlist ? 'bg-rose-50 border-rose-200 text-rose-600' : 'border-[#E7E2DA] hover:bg-[#F4F0EA] text-[#78736A] hover:text-[#1C1A18]'}`}>
                    <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: isWishlist ? "'FILL' 1" : "'FILL' 0" }}>favorite</span>
                    {isWishlist ? 'Đã lưu' : 'Lưu yêu thích'}
                  </button>
                  <button type="button" onClick={handleChat}
                    className="py-2.5 px-3 rounded-lg border border-[#E7E2DA] hover:bg-[#F4F0EA] text-[#78736A] hover:text-[#1C1A18] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer">
                    <span className="material-symbols-outlined text-[16px]">chat</span>
                    Chat với Shop Owner
                  </button>
                </div>
              </div>

              <p className="text-[11px] text-center text-[#78736A] pt-1 border-t border-[#E7E2DA]/60">
                * Mặt hàng độc bản (Unique Specimen 1/1). Khi người khác hoàn tất thanh toán, sản phẩm sẽ tự động đóng niêm yết.
              </p>
            </div>

            {/* Circular callout */}
            <div className="bg-[#F3EFE9] border border-[#E7E2DA] rounded-xl p-4 flex items-start gap-3">
              <span className="text-xl shrink-0">🔄</span>
              <div className="text-xs">
                <span className="font-bold text-[#1C1A18] block mb-0.5">Vòng đời tuần hoàn khép kín</span>
                <p className="text-[#78736A] leading-relaxed">{product.circularOriginNote}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Detail Tabs ── */}
        <section data-reveal className="bg-white rounded-2xl border border-[#E7E2DA] shadow-sm overflow-hidden">
          <div className="border-b border-[#E7E2DA] flex overflow-x-auto">
            {tabs.map((tab) => (
              <button key={tab.key} type="button" onClick={() => setActiveTab(tab.key)}
                className={`px-5 py-4 text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border-b-2 ${activeTab === tab.key ? 'border-[#1C1A18] text-[#1C1A18]' : 'border-transparent text-[#78736A] hover:text-[#1C1A18]'}`}>
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-6 sm:p-8">
            {activeTab === 'desc' && (
              <div className="space-y-4 text-xs text-[#78736A] leading-relaxed animate-fade-in">
                <h3 className="text-sm font-bold text-[#1C1A18]">Mô tả sản phẩm</h3>
                <ul className="space-y-2.5">
                  {product.descriptionPoints.map((point, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="mt-0.5 text-[#1C1A18] font-bold shrink-0">•</span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {activeTab === 'audit' && (
              <div className="space-y-4 animate-fade-in">
                <h3 className="text-sm font-bold text-[#1C1A18]">Chi tiết tình trạng (Audit Bench)</h3>
                <div className="bg-[#F4F0EA]/50 rounded-xl border border-[#E7E2DA] divide-y divide-[#E7E2DA]">
                  {product.auditRows.map((row, i) => (
                    <div key={i} className="flex items-baseline justify-between px-4 py-3 text-xs flex-wrap gap-2">
                      <span className="text-[#78736A]">{row.label}</span>
                      <span className={`font-semibold text-[#1C1A18] ${row.mono ? 'font-mono' : ''}`}>{row.value}</span>
                    </div>
                  ))}
                </div>
                <p className="text-[11px] italic text-[#78736A]">{product.auditNote}</p>
              </div>
            )}
            {activeTab === 'origin' && (
              <div className="space-y-4 animate-fade-in text-xs text-[#78736A] leading-relaxed">
                <h3 className="text-sm font-bold text-[#1C1A18]">Nguồn gốc & Lịch sử ReUse</h3>
                <div className="p-4 bg-[#F4F0EA]/80 rounded-xl border border-[#E7E2DA]">
                  <span className="font-bold text-[#1C1A18] block mb-2">Quy chế chuyển đổi Second-Life:</span>
                  <p className="text-[11px] text-[#78736A]">{product.circularOriginNote}</p>
                </div>
                {product.rentalCycles > 0 && (
                  <p>Sản phẩm đã phục vụ <strong className="text-[#1C1A18]">{product.rentalCycles} kỳ thuê</strong> ngắn hạn trước khi chuyển sang THRIFT.</p>
                )}
              </div>
            )}
            {activeTab === 'shipping' && (
              <div className="space-y-4 animate-fade-in text-xs text-[#78736A] leading-relaxed">
                <h3 className="text-sm font-bold text-[#1C1A18]">Thông tin vận chuyển & Nhận hàng</h3>
                <ul className="space-y-2">
                  {product.shippingPoints.map((point, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="material-symbols-outlined text-[14px] text-[#1C1A18] shrink-0 mt-0.5">local_shipping</span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>

        {/* ── Related Products ── */}
        <section data-reveal className="space-y-5 pb-6">
          <div className="flex items-end justify-between border-b border-[#E7E2DA] pb-3">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#78736A] block">GỢI Ý TƯƠNG ĐỒNG</span>
              <h2 className="text-xl sm:text-2xl font-bold text-[#1C1A18]">Có thể bạn cũng thích</h2>
            </div>
            <Link to="/thrift" className="text-xs font-bold text-[#1C1A18] hover:underline flex items-center gap-1">
              <span>Xem tất cả THRIFT</span>
              <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {THRIFT_RELATED_PRODUCTS.filter((r) => r.id !== product.id).slice(0, 4).map((related) => (
              <Link key={related.id} to={related.href}
                className="group bg-white rounded-2xl border border-[#E7E2DA] overflow-hidden p-3 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                <div>
                  <div className="aspect-[4/3] rounded-xl overflow-hidden bg-[#F4F0EA] relative mb-3">
                    <img src={related.image} alt={related.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <span className={`absolute top-2 left-2 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${related.source === 'rent' ? 'bg-[#E4DDD3] text-[#1C1A18] border-transparent' : 'bg-[#F4EFEA]/90 backdrop-blur-sm text-[#1C1A18] border-[#E7E2DA]'}`}>
                      {related.sourceLabel}
                    </span>
                    <span className="absolute top-2 right-2 text-[10px] font-bold bg-[#1C1A18] text-white px-2 py-0.5 rounded-full">
                      {related.condition}
                    </span>
                  </div>
                  <span className="text-[10px] uppercase tracking-wider text-[#78736A] font-bold block mb-0.5">
                    {related.categoryLabel} · {related.location}
                  </span>
                  <h3 className="text-xs sm:text-sm font-bold text-[#1C1A18] group-hover:text-[#78736A] transition-colors truncate">{related.title}</h3>
                </div>
                <div className="pt-3 border-t border-[#E7E2DA]/60 mt-3 flex items-center justify-between">
                  <div>
                    <span className="text-[9px] uppercase text-[#78736A] block font-semibold">GIÁ MUA TRỌN GÓI</span>
                    <span className="text-sm font-bold text-[#1C1A18]">{formatVND(related.price)}</span>
                  </div>
                  <span className="px-3 py-1.5 rounded-full bg-[#1C1A18] text-white text-[11px] font-bold group-hover:bg-black transition-colors">
                    Xem
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default ThriftDetail;

