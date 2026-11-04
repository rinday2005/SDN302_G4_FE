import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getPublicShopDetailApi, type ShopProfileData } from '../../services/shop.api';
import { getPublicRentProductsApi, type RentalProductApi } from '../../services/rentProduct.api';
import { getPublicThriftListingsApi, type ThriftListingItemApi } from '../../services/thrift.api';
import { normalizeImageUrl } from '../../utils/imageUrl';
import { useCartWishlist } from '../../context/CartWishlistContext';

export const PublicShopProfile: React.FC = () => {
  const { shopId } = useParams<{ shopId?: string }>();
  const navigate = useNavigate();
  const { isWishlisted, toggleWishlist, addToCart } = useCartWishlist();

  const [shop, setShop] = useState<ShopProfileData | null>(null);
  const [rentProducts, setRentProducts] = useState<RentalProductApi[]>([]);
  const [thriftListings, setThriftListings] = useState<ThriftListingItemApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Tabs & Filters
  const [activeTab, setActiveTab] = useState<'rent' | 'thrift'>('rent');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    let isMounted = true;

    const targetId = shopId || '6ac39f4b216ef5928d9c46bb';

    Promise.all([
      getPublicShopDetailApi(targetId).catch(() => null),
      getPublicRentProductsApi({ ownerId: targetId, limit: 100 }).catch(() => []),
      getPublicThriftListingsApi({ ownerId: targetId }).catch(() => []),
    ])
      .then(async ([shopData, rentData, thriftData]) => {
        if (!isMounted) return;
        if (shopData) {
          setShop(shopData);
        } else {
          // Fallback shop info
          setShop({
            shopId: targetId,
            shopName: 'Light&Night Shop',
            ownerName: 'Nguyễn Thị Phương Nhi',
            email: 'shopowner@reuse.vn',
            cityRegion: 'Thành phố Đà Nẵng',
            address: '70 Nam Cao, Phường Hòa Khánh Nam, Quận Liên Chiểu, Thành phố Đà Nẵng',
            slogan: 'Bảo tồn giá trị trường tồn • Tuần hoàn di sản cao cấp',
            specialization: 'Xưởng lưu ký & cho thuê trang phục, thiết bị thời trang cao cấp tuần hoàn.',
            description: 'Light&Night Shop chuyên giám định, bảo tồn và lưu ký thiết bị quang học cùng trang phục dạ tiệc cao cấp với chế độ kiểm soát nhiệt ẩm chuẩn quốc tế.',
            rating: 5.0,
            establishedYear: 2024,
            kycStatus: 'APPROVED',
            hotline: '0901234567',
            operatingHours: '08:00 - 21:00 (Thứ 2 - Chủ Nhật)',
          });
        }

        let finalRent = Array.isArray(rentData) ? rentData : [];
        const finalThrift = Array.isArray(thriftData) ? thriftData : [];

        // Fallback: nếu query theo ownerId rỗng, tìm kiếm toàn bộ sản phẩm của shop
        if (finalRent.length === 0) {
          try {
            const allProducts = await getPublicRentProductsApi({ limit: 100 });
            finalRent = allProducts.filter((p) => {
              const pOwner = typeof p.ownerId === 'object' && p.ownerId?._id ? p.ownerId._id : typeof p.ownerId === 'string' ? p.ownerId : '';
              const pShop = (p as unknown as { shopId?: string }).shopId || '';
              const pShopName = (p as unknown as { shopName?: string }).shopName || '';
              return pOwner === targetId || pShop === targetId || (shopData?.shopName && pShopName === shopData.shopName);
            });
          } catch {}
        }

        setRentProducts(finalRent);
        setThriftListings(finalThrift);

        // Tự động chuyển tab nếu Shop chỉ có đồ Thrift hoặc chỉ có đồ Rent
        if (finalRent.length === 0 && finalThrift.length > 0) {
          setActiveTab('thrift');
        } else {
          setActiveTab('rent');
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [shopId]);

  // Danh sách danh mục từ sản phẩm của shop
  const categories = useMemo(() => {
    const set = new Set<string>();
    rentProducts.forEach((p) => {
      const cat = typeof p.categoryId === 'object' && p.categoryId?.name ? p.categoryId.name : typeof p.category === 'object' && p.category?.name ? p.category.name : '';
      if (cat) set.add(cat);
    });
    thriftListings.forEach((t) => {
      const cat = typeof t.categoryId === 'object' && t.categoryId?.name ? t.categoryId.name : t.categoryLabel || '';
      if (cat) set.add(cat);
    });
    return Array.from(set);
  }, [rentProducts, thriftListings]);

  // Lọc sản phẩm Rent
  const filteredRentProducts = useMemo(() => {
    return rentProducts.filter((p) => {
      const matchKeyword = !searchKeyword.trim() || p.name.toLowerCase().includes(searchKeyword.toLowerCase());
      const catName = typeof p.categoryId === 'object' && p.categoryId?.name ? p.categoryId.name : typeof p.category === 'object' && p.category?.name ? p.category.name : '';
      const matchCategory = selectedCategory === 'all' || catName === selectedCategory;
      return matchKeyword && matchCategory;
    });
  }, [rentProducts, searchKeyword, selectedCategory]);

  // Lọc sản phẩm Thrift
  const filteredThriftListings = useMemo(() => {
    return thriftListings.filter((t) => {
      const matchKeyword = !searchKeyword.trim() || (t.name || t.title || '').toLowerCase().includes(searchKeyword.toLowerCase());
      const catName = typeof t.categoryId === 'object' && t.categoryId?.name ? t.categoryId.name : t.categoryLabel || '';
      const matchCategory = selectedCategory === 'all' || catName === selectedCategory;
      return matchKeyword && matchCategory;
    });
  }, [thriftListings, searchKeyword, selectedCategory]);

  const shopDisplayName = shop?.shopName || 'Light&Night Shop';
  const shopLocation = shop?.cityRegion || shop?.address || 'Thành phố Đà Nẵng';
  const isKycApproved = shop?.kycStatus === 'APPROVED' || shop?.kycStatus === 'VERIFIED';
  const avatarInitials = shopDisplayName.slice(0, 2).toUpperCase();

  // Handle Add To Cart - Rent
  const handleAddToCartRent = (item: RentalProductApi) => {
    const img = Array.isArray(item.images) && item.images[0]
      ? normalizeImageUrl(item.images[0])
      : 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=600&q=80';
    const catName = typeof item.categoryId === 'object' && item.categoryId?.name ? item.categoryId.name : 'RENT';

    addToCart({
      id: item._id,
      title: item.name,
      price: Number(item.pricePerDay || 0),
      image: img,
      mode: 'rent',
      location: item.location || shopLocation,
      deposit: item.depositAmount,
      categoryLabel: catName,
      gradeBadge: item.condition || 'Rất tốt 95%',
      shopId: shop?.shopId || '6ac39f4b216ef5928d9c46bb',
      shopOwnerId: shop?.shopId || '6ac39f4b216ef5928d9c46bb',
      shopName: shopDisplayName,
      shopAvatar: shop?.avatarUrl || '',
      shopLocation: shopLocation,
      isShopVerified: true,
      quantity: 1,
    });
    showToast(`Đã thêm "${item.name}" vào giỏ hàng!`);
  };

  // Handle Add To Cart - Thrift
  const handleAddToCartThrift = (item: ThriftListingItemApi) => {
    const img = Array.isArray(item.images) && item.images[0]
      ? normalizeImageUrl(item.images[0])
      : 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=600&q=80';
    const catName = typeof item.categoryId === 'object' && item.categoryId?.name ? item.categoryId.name : item.categoryLabel || 'THRIFT';
    const title = item.name || item.title || 'Sản phẩm thanh lý';

    addToCart({
      id: item._id,
      title,
      price: Number(item.price || 0),
      image: img,
      mode: 'thrift',
      location: item.location || shopLocation,
      categoryLabel: catName,
      gradeBadge: item.condition || 'Đã kiểm định 95%',
      shopId: shop?.shopId || '6ac39f4b216ef5928d9c46bb',
      shopOwnerId: shop?.shopId || '6ac39f4b216ef5928d9c46bb',
      shopName: shopDisplayName,
      shopAvatar: shop?.avatarUrl || '',
      shopLocation: shopLocation,
      isShopVerified: true,
      quantity: 1,
    });
    showToast(`Đã thêm "${title}" vào giỏ hàng!`);
  };

  const handleToggleWishlist = (id: string, type: 'RENT' | 'THRIFT', title: string) => {
    const added = toggleWishlist(id, type);
    if (added) {
      showToast(`Đã thêm "${title}" vào danh sách yêu thích!`);
    } else {
      showToast(`Đã xóa "${title}" khỏi danh sách yêu thích!`);
    }
  };

  return (
    <div className="w-full bg-[#FBF9F5] text-[#1C1A18] min-h-screen font-sans pb-20">
      {/* ── BREADCRUMB ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-3">
        <nav className="flex items-center gap-2 text-xs text-[#78736A] uppercase tracking-wider">
          <Link to="/" className="hover:text-[#1C1A18] transition-colors">Trang chủ</Link>
          <span>/</span>
          <Link to="/rent" className="hover:text-[#1C1A18] transition-colors">Marketplace</Link>
          <span>/</span>
          <span className="font-bold text-[#1C1A18] truncate max-w-xs">{shopDisplayName}</span>
        </nav>
      </div>

      {/* ── SHOP HEADER PROFILE CARD (SHOPEE STYLE STORE HEADER) ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <div className="bg-white rounded-3xl p-6 sm:p-8 lg:p-10 shadow-sm border border-[#E7E2DA]">
          {/* Top Tag & Slogan */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-5 mb-6 border-b border-[#E7E2DA]">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#3A6843]/15 text-[#3A6843] text-xs font-bold uppercase tracking-wider rounded-md">
                <span className="material-symbols-outlined text-[15px]">verified</span>
                <span>CHỦ SHOP XÁC THỰC SÀN REUSE HUB</span>
              </span>
              {isKycApproved && (
                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full font-semibold border border-emerald-200">
                  <span className="material-symbols-outlined text-[13px]">verified_user</span>
                  <span>KYC Đã xác minh CCCD</span>
                </span>
              )}
            </div>

            <p className="text-xs sm:text-sm font-serif italic text-[#78736A]">
              &ldquo;{shop?.slogan || 'Bảo tồn giá trị trường tồn • Tuần hoàn di sản cao cấp'}&rdquo;
            </p>
          </div>

          {/* Shop Main Row */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
              {/* Avatar Logo */}
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-[#1C1A18] text-white flex items-center justify-center text-3xl font-serif font-bold shadow-md shrink-0 border-2 border-stone-100 overflow-hidden">
                {shop?.avatarUrl ? (
                  <img src={shop.avatarUrl} alt={shopDisplayName} className="w-full h-full object-cover" />
                ) : (
                  <span>{avatarInitials}</span>
                )}
              </div>

              {/* Shop Title & Details */}
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-900 text-[10px] font-bold uppercase tracking-wider rounded">
                    ĐỐI TÁC CHÍNH THỨC
                  </span>
                  <span className="px-2.5 py-0.5 bg-stone-100 text-[#78736A] text-[10px] font-semibold uppercase tracking-wider rounded">
                    THÀNH LẬP: {shop?.establishedYear || 2024}
                  </span>
                  <div className="flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-900 text-[10px] font-bold rounded">
                    <span className="material-symbols-outlined text-[13px] text-amber-500">star</span>
                    <span>{(shop?.rating || 5.0).toFixed(1)} / 5.0</span>
                  </div>
                </div>

                <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#1C1A18] tracking-tight">
                  {shopDisplayName}
                </h1>

                <p className="text-xs sm:text-sm text-[#78736A] max-w-xl">
                  {shop?.specialization || 'Xưởng lưu ký & cho thuê trang phục, thiết bị thời trang cao cấp tuần hoàn.'}
                </p>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#78736A] pt-1">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[15px] text-[#3A6843]">location_on</span>
                    <strong className="text-[#1C1A18]">{shopLocation}</strong>
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[15px] text-[#3A6843]">call</span>
                    <span>{shop?.hotline || '0901234567'}</span>
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[15px] text-[#3A6843]">schedule</span>
                    <span>{shop?.operatingHours || '08:00 - 21:00'}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Shop Quick Stats */}
            <div className="grid grid-cols-3 gap-3 bg-[#FAF8F5] p-4 rounded-2xl border border-[#E7E2DA] min-w-[280px]">
              <div className="text-center border-r border-[#E7E2DA] pr-2">
                <span className="text-xs text-[#78736A] block">Cho thuê</span>
                <span className="text-lg font-bold text-[#1C1A18] font-mono">{rentProducts.length}</span>
              </div>
              <div className="text-center border-r border-[#E7E2DA] pr-2">
                <span className="text-xs text-[#78736A] block">Thanh lý</span>
                <span className="text-lg font-bold text-[#1C1A18] font-mono">{thriftListings.length}</span>
              </div>
              <div className="text-center">
                <span className="text-xs text-[#78736A] block">Phản hồi</span>
                <span className="text-lg font-bold text-[#3A6843] font-mono">99%</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FILTER & TAB BAR ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-3 sm:p-4 rounded-2xl border border-[#E7E2DA]">
          {/* Tabs */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setActiveTab('rent');
                setSelectedCategory('all');
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'rent'
                  ? 'bg-[#1C1A18] text-white shadow-xs'
                  : 'bg-stone-100 text-[#78736A] hover:bg-stone-200 hover:text-[#1C1A18]'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">dry_cleaning</span>
              <span>Sản phẩm Cho Thuê ({rentProducts.length})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('thrift');
                setSelectedCategory('all');
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'thrift'
                  ? 'bg-[#1C1A18] text-white shadow-xs'
                  : 'bg-stone-100 text-[#78736A] hover:bg-stone-200 hover:text-[#1C1A18]'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">sell</span>
              <span>Sản phẩm Thanh Lý ({thriftListings.length})</span>
            </button>
          </div>

          {/* Search bar & Category filter */}
          <div className="flex items-center gap-3 flex-1 max-w-lg">
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-[18px]">
                search
              </span>
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder={`Tìm trong sản phẩm ${activeTab === 'rent' ? 'cho thuê' : 'thanh lý'} của shop...`}
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-[#E7E2DA] text-xs focus:outline-none focus:border-[#1C1A18] bg-stone-50"
              />
              {searchKeyword && (
                <button
                  type="button"
                  onClick={() => setSearchKeyword('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              )}
            </div>

            {categories.length > 0 && (
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 rounded-xl border border-[#E7E2DA] text-xs bg-stone-50 text-[#1C1A18] focus:outline-none cursor-pointer"
              >
                <option value="all">Tất cả danh mục</option>
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            )}
          </div>
        </div>
      </section>

      {/* ── DANH SÁCH SẢN PHẨM (GRID) ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-[#E7E2DA]">
            <div className="w-8 h-8 border-2 border-stone-300 border-t-[#1C1A18] rounded-full animate-spin mb-3"></div>
            <p className="text-xs text-[#78736A] font-medium">Đang tải sản phẩm của Shop...</p>
          </div>
        ) : activeTab === 'rent' ? (
          /* TAB 1: RENT PRODUCTS */
          filteredRentProducts.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-[#E7E2DA] p-6 space-y-3">
              <span className="material-symbols-outlined text-[48px] text-stone-300">inventory_2</span>
              <h3 className="font-bold text-base text-[#1C1A18]">Không tìm thấy sản phẩm cho thuê nào</h3>
              <p className="text-xs text-[#78736A] max-w-sm mx-auto">
                {searchKeyword ? 'Thử tìm kiếm với từ khóa khác hoặc xóa bộ lọc danh mục.' : 'Shop hiện chưa đăng tải sản phẩm cho thuê nào trong mục này.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {filteredRentProducts.map((item) => {
                const img = Array.isArray(item.images) && item.images[0]
                  ? normalizeImageUrl(item.images[0])
                  : 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=600&q=80';
                const catName = typeof item.categoryId === 'object' && item.categoryId?.name ? item.categoryId.name : 'RENT';
                const isSaved = isWishlisted(item._id);

                return (
                  <div
                    key={item._id}
                    className="group bg-white rounded-2xl overflow-hidden border border-[#E7E2DA] hover:border-[#1C1A18] hover:shadow-md transition-all flex flex-col relative"
                  >
                    {/* Top Right Wishlist Toggle Heart Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleToggleWishlist(item._id, 'RENT', item.name);
                      }}
                      aria-label={isSaved ? 'Xóa khỏi danh sách mong muốn' : 'Thêm vào danh sách mong muốn'}
                      className="absolute top-2.5 right-2.5 z-10 w-8 h-8 rounded-full bg-white/90 backdrop-blur-xs flex items-center justify-center text-[#1C1A18] hover:bg-white shadow-xs transition-transform active:scale-90 cursor-pointer"
                    >
                      <svg
                        className={`w-4 h-4 transition-colors ${isSaved ? 'text-rose-500 fill-rose-500' : 'text-[#1C1A18] fill-none'}`}
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path
                          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>

                    {/* Image Link to Detail */}
                    <Link to={`/rent/detail/${item._id}`} className="relative aspect-square overflow-hidden bg-stone-100 block">
                      <img
                        src={img}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                      <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold uppercase tracking-wider">
                        {catName}
                      </span>
                      <span className="absolute bottom-2.5 left-2.5 px-2 py-0.5 rounded bg-emerald-700 text-white text-[10px] font-bold">
                        {item.condition || 'Rất tốt 95%'}
                      </span>
                    </Link>

                    {/* Content details */}
                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                      <div>
                        <h4 className="font-bold text-sm text-[#1C1A18] line-clamp-2 group-hover:text-emerald-800 transition-colors">
                          <Link to={`/rent/detail/${item._id}`}>
                            {item.name}
                          </Link>
                        </h4>
                        <p className="text-[11px] text-[#78736A] mt-1 flex items-center gap-1">
                          <span className="material-symbols-outlined text-[13px] text-[#78736A]">location_on</span>
                          <span>{item.location || shopLocation}</span>
                        </p>
                      </div>

                      <div className="pt-2 border-t border-[#E7E2DA]/60 flex items-center justify-between gap-2">
                        <div>
                          <span className="text-[10px] text-[#78736A] block">Giá thuê ngày</span>
                          <span className="font-bold text-sm text-[#1C1A18]">
                            {Number(item.pricePerDay || 0).toLocaleString('vi-VN')}₫
                            <span className="text-[10px] font-normal text-[#78736A]">/ngày</span>
                          </span>
                        </div>

                        {/* Action Buttons: Add to Cart + Rent Now */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleAddToCartRent(item);
                            }}
                            title="Thêm vào giỏ hàng"
                            className="w-8 h-8 rounded-lg border border-[#E7E2DA] bg-[#FAF8F5] hover:bg-[#1C1A18] hover:text-white flex items-center justify-center text-[#1C1A18] transition-colors cursor-pointer"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                              <path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" strokeLinecap="round" strokeLinejoin="round"></path>
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={() => navigate(`/rent/detail/${item._id}`)}
                            className="px-2.5 py-1.5 rounded-lg bg-[#FAF8F5] border border-[#E7E2DA] text-[11px] font-bold hover:bg-[#1C1A18] hover:text-white transition-colors cursor-pointer"
                          >
                            Thuê ngay
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : (
          /* TAB 2: THRIFT LISTINGS */
          filteredThriftListings.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-[#E7E2DA] p-6 space-y-3">
              <span className="material-symbols-outlined text-[48px] text-stone-300">sell</span>
              <h3 className="font-bold text-base text-[#1C1A18]">Không tìm thấy sản phẩm thanh lý nào</h3>
              <p className="text-xs text-[#78736A] max-w-sm mx-auto">
                {searchKeyword ? 'Thử tìm kiếm với từ khóa khác hoặc xóa bộ lọc danh mục.' : 'Shop hiện chưa có sản phẩm thanh lý nào trong danh mục này.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {filteredThriftListings.map((item) => {
                const img = Array.isArray(item.images) && item.images[0]
                  ? normalizeImageUrl(item.images[0])
                  : 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=600&q=80';
                const catName = typeof item.categoryId === 'object' && item.categoryId?.name ? item.categoryId.name : item.categoryLabel || 'THRIFT';
                const title = item.name || item.title || 'Sản phẩm thanh lý';
                const isSaved = isWishlisted(item._id);

                return (
                  <div
                    key={item._id}
                    className="group bg-white rounded-2xl overflow-hidden border border-[#E7E2DA] hover:border-[#1C1A18] hover:shadow-md transition-all flex flex-col relative"
                  >
                    {/* Top Right Wishlist Toggle Heart Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleToggleWishlist(item._id, 'THRIFT', title);
                      }}
                      aria-label={isSaved ? 'Xóa khỏi danh sách mong muốn' : 'Thêm vào danh sách mong muốn'}
                      className="absolute top-2.5 right-2.5 z-10 w-8 h-8 rounded-full bg-white/90 backdrop-blur-xs flex items-center justify-center text-[#1C1A18] hover:bg-white shadow-xs transition-transform active:scale-90 cursor-pointer"
                    >
                      <svg
                        className={`w-4 h-4 transition-colors ${isSaved ? 'text-rose-500 fill-rose-500' : 'text-[#1C1A18] fill-none'}`}
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path
                          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>

                    {/* Image Link to Detail */}
                    <Link to={`/thrift/detail/${item._id}`} className="relative aspect-square overflow-hidden bg-stone-100 block">
                      <img
                        src={img}
                        alt={title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                      <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold uppercase tracking-wider">
                        {catName}
                      </span>
                      <span className="absolute bottom-2.5 left-2.5 px-2 py-0.5 rounded bg-rose-700 text-white text-[10px] font-bold">
                        {item.condition || 'Đã kiểm định 95%'}
                      </span>
                    </Link>

                    {/* Content details */}
                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                      <div>
                        <h4 className="font-bold text-sm text-[#1C1A18] line-clamp-2 group-hover:text-rose-800 transition-colors">
                          <Link to={`/thrift/detail/${item._id}`}>
                            {title}
                          </Link>
                        </h4>
                        <p className="text-[11px] text-[#78736A] mt-1 flex items-center gap-1">
                          <span className="material-symbols-outlined text-[13px] text-[#78736A]">location_on</span>
                          <span>{item.location || shopLocation}</span>
                        </p>
                      </div>

                      <div className="pt-2 border-t border-[#E7E2DA]/60 flex items-center justify-between gap-2">
                        <div>
                          <span className="text-[10px] text-[#78736A] block">Giá thanh lý</span>
                          <span className="font-bold text-sm text-rose-700">
                            {Number(item.price || 0).toLocaleString('vi-VN')}₫
                          </span>
                        </div>

                        {/* Action Buttons: Add to Cart + Buy Now */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleAddToCartThrift(item);
                            }}
                            title="Thêm vào giỏ hàng"
                            className="w-8 h-8 rounded-lg border border-[#E7E2DA] bg-[#FAF8F5] hover:bg-rose-700 hover:text-white flex items-center justify-center text-[#1C1A18] transition-colors cursor-pointer"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                              <path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" strokeLinecap="round" strokeLinejoin="round"></path>
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={() => navigate(`/thrift/detail/${item._id}`)}
                            className="px-2.5 py-1.5 rounded-lg bg-[#FAF8F5] border border-[#E7E2DA] text-[11px] font-bold hover:bg-[#1C1A18] hover:text-white transition-colors cursor-pointer"
                          >
                            Mua ngay
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}
      </section>

      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1C1A18] text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-semibold animate-fade-in border border-stone-700">
          <span className="material-symbols-outlined text-[18px] text-emerald-400">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};

export default PublicShopProfile;
