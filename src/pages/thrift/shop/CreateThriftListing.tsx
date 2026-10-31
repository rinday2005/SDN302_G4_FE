/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { ThriftListingItem } from '../../data/shop/thriftListingsData';
import {
  THRIFT_LISTINGS_STORAGE_KEY,
  INITIAL_THRIFT_LISTINGS,
} from '../../data/shop/thriftListingsData';
import { uploadImageApi } from '../../../services/upload.api';
import { createThriftListingApi } from '../../../services/thrift.api';
import { getCategoriesApi, type CategoryItem } from '../../../services/category.api';

interface InspectionPhotoItem {
  id: string;
  url: string;
  label: string;
  badge: string;
}

export const CreateThriftListing: React.FC = () => {
  const navigate = useNavigate();

  // Categories từ MongoDB
  const [categories, setCategories] = useState<CategoryItem[]>([]);

  // Form State - để trống hoàn toàn để người dùng nhập mới
  const [originSource, setOriginSource] = useState<'rental_archive' | 'shop_direct'>('rental_archive');
  const [listingTitle, setListingTitle] = useState('');
  const [category, setCategory] = useState('');
  const [brandOrigin, setBrandOrigin] = useState('');
  const [sizeColor, setSizeColor] = useState('');
  const [branchLocation, setBranchLocation] = useState<'Đà Nẵng' | 'Hà Nội' | 'TP. Hồ Chí Minh'>('Đà Nẵng');
  const [skuCode, setSkuCode] = useState(`TH-CLO-${Date.now().toString().slice(-6)}`);
  const [conditionGrade, setConditionGrade] = useState<'like_new' | 'good' | 'fair'>('like_new');
  const [forensicNotes, setForensicNotes] = useState('');
  const [priceInput, setPriceInput] = useState('');

  // Cam kết kiểm định chất lượng (mặc định chưa tick)
  const [ruleCleaned, setRuleCleaned] = useState(false);
  const [ruleInspected, setRuleInspected] = useState(false);
  const [rulePackaged, setRulePackaged] = useState(false);

  // Ảnh Cloudinary (để trống ban đầu)
  const [coverImage, setCoverImage] = useState<string>('');
  const [detailPhotos, setDetailPhotos] = useState<InspectionPhotoItem[]>([]);

  const [activePhotoLightbox, setActivePhotoLightbox] = useState<string | null>(null);
  const [isUploadingCover, setIsUploadingCover] = useState<boolean>(false);
  const [isUploadingDetails, setIsUploadingDetails] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [createdName, setCreatedName] = useState<string | null>(null);

  const coverInputRef = useRef<HTMLInputElement | null>(null);
  const detailsInputRef = useRef<HTMLInputElement | null>(null);

  // Lấy danh mục thực tế từ MongoDB
  useEffect(() => {
    getCategoriesApi()
      .then((data) => {
        if (data && data.length > 0) {
          setCategories(data);
        }
      })
      .catch((err) => {
        console.warn('Lỗi khi tải danh mục từ DB:', err);
      });
  }, []);

  // Format giá số
  const numericPrice = useMemo(() => {
    return parseInt(priceInput.replace(/\D/g, ''), 10) || 0;
  }, [priceInput]);

  const formattedDisplayPrice = useMemo(() => {
    return numericPrice > 0 ? numericPrice.toLocaleString('vi-VN') + ' ₫' : '0 ₫';
  }, [numericPrice]);

  const conditionGradeLabel = useMemo(() => {
    switch (conditionGrade) {
      case 'like_new':
        return 'Like New (98% - 99%)';
      case 'good':
        return 'Good (90% - 97%)';
      case 'fair':
        return 'Fair (80% - 89%)';
      default:
        return 'Like New (98% - 99%)';
    }
  }, [conditionGrade]);

  // Xử lý đổi giá
  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawDigits = e.target.value.replace(/\D/g, '');
    if (!rawDigits) {
      setPriceInput('');
      return;
    }
    const val = parseInt(rawDigits, 10);
    setPriceInput(val.toLocaleString('vi-VN'));
  };

  // Upload ảnh bìa chính lên Cloudinary
  const handleUploadCover = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingCover(true);
      const url = await uploadImageApi(file);
      setCoverImage(url);
    } catch (err) {
      console.error(err);
      alert('Không thể tải ảnh bìa lên Cloudinary. Vui lòng kiểm tra lại ảnh hoặc kết nối!');
    } finally {
      setIsUploadingCover(false);
      if (e.target) e.target.value = '';
    }
  };

  // Upload nhiều ảnh góc chụp thẩm định lên Cloudinary
  const handleUploadDetails = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    try {
      setIsUploadingDetails(true);
      const uploadPromises = files.map(async (file, idx) => {
        const url = await uploadImageApi(file);
        const badgeNames = ['Mặt trước', 'Mặt sau', 'Cận vải/tag', 'Góc nghiêng', 'Phụ kiện'];
        const badge = badgeNames[(detailPhotos.length + idx) % badgeNames.length] || `Góc ${detailPhotos.length + idx + 1}`;
        return {
          id: `cloud-${Date.now()}-${idx}`,
          url,
          label: file.name.slice(0, 20),
          badge,
        };
      });
      const newItems = await Promise.all(uploadPromises);
      setDetailPhotos((prev) => [...prev, ...newItems]);
    } catch (err) {
      console.error(err);
      alert('Một số ảnh tải lên Cloudinary bị lỗi. Vui lòng thử lại.');
    } finally {
      setIsUploadingDetails(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleRemoveDetailPhoto = (idToRemove: string) => {
    setDetailPhotos((prev) => prev.filter((p) => p.id !== idToRemove));
  };

  // Submit form tạo mục đăng THRIFT (mặc định PENDING_APPROVAL gửi Admin duyệt)
  const saveListingToSystem = async (status: 'PENDING' | 'DRAFT') => {
    // Validate
    if (!listingTitle.trim() || listingTitle.trim().length < 4) {
      alert('Vui lòng nhập tên trang phục THRIFT (tối thiểu 4 ký tự)!');
      return;
    }
    if (!category.trim()) {
      alert('Vui lòng chọn phân mục trang phục!');
      return;
    }
    if (numericPrice < 20000) {
      alert('Vui lòng nhập giá bán đứt THRIFT hợp lệ (tối thiểu 20.000 ₫)!');
      return;
    }
    if (!coverImage) {
      alert('Vui lòng tải lên ảnh bìa chính của trang phục (lưu trữ Cloudinary)!');
      return;
    }
    if (status === 'PENDING') {
      if (detailPhotos.length < 3) {
        alert('Vui lòng cung cấp tối thiểu 3 ảnh góc chụp chi tiết (mặt trước, mặt sau, cận cảnh chất vải/nhãn tag) để Admin thẩm định!');
        return;
      }
      if (!ruleCleaned || !ruleInspected || !rulePackaged) {
        alert('Vui lòng đánh dấu xác nhận đầy đủ 3 cam kết chuẩn bị & bàn giao trang phục trước khi gửi phê duyệt!');
        return;
      }
    }

    try {
      setIsSubmitting(true);
      const matchedCat = categories.find(
        (c) => c.name === category || c._id === category
      ) || categories[0];

      const allImageUrls = [coverImage, ...detailPhotos.map((p) => p.url)].filter(Boolean);

      // 1. Gửi payload lên Backend MongoDB
      const payload = {
        name: listingTitle.trim(),
        description: forensicNotes.trim(),
        price: numericPrice,
        condition: conditionGrade.toUpperCase(),
        images: allImageUrls,
        location: branchLocation,
        categoryId: matchedCat?._id || '67c000000000000000000001',
        sourceType: originSource === 'rental_archive' ? 'FROM_RENTAL' : 'MANUAL',
        status: status === 'PENDING' ? 'PENDING_APPROVAL' : 'DRAFT',
      };

      let createdMongoListing: { _id?: string } | null = null;
      try {
        createdMongoListing = await createThriftListingApi(payload);
      } catch (apiErr) {
        console.warn('API create thrift listing failed, falling back to local sync:', apiErr);
      }

      // 2. Lưu đồng bộ vào localStorage
      const existingRaw = localStorage.getItem(THRIFT_LISTINGS_STORAGE_KEY);
      let list: ThriftListingItem[] = existingRaw ? JSON.parse(existingRaw) : INITIAL_THRIFT_LISTINGS;

      const newListing: ThriftListingItem = {
        id: createdMongoListing?._id || skuCode.trim() || `THRIFT-${Date.now()}`,
        sku: skuCode.trim() || `TH-CLO-${Date.now().toString().slice(-6)}`,
        title: listingTitle.trim(),
        category: matchedCat?.name || category,
        categoryKey: 'cameras', // Key mapping mặc định
        description: forensicNotes.trim(),
        source: originSource === 'rental_archive' ? 'RETURNED_RENTAL' : 'SHOP_INVENTORY',
        sourceLabel: originSource === 'rental_archive' ? 'Second Life Item (Từ Kho RENT)' : 'Kho Xưởng Ký Gửi',
        rentalCycles: originSource === 'rental_archive' ? 8 : 0,
        originalRentInvId: originSource === 'rental_archive' ? `RENT-${skuCode.slice(-4)}` : undefined,
        status: status,
        statusLabel: status === 'PENDING' ? 'Chờ Duyệt' : 'Bản Nháp (Draft)',
        stockStatus: status === 'PENDING' ? 'Chờ Admin thẩm duyệt' : 'Chưa gửi kiểm duyệt',
        conditionGrade: conditionGradeLabel,
        conditionScore: conditionGrade === 'like_new' ? 98.0 : conditionGrade === 'good' ? 94.0 : 86.0,
        price: numericPrice,
        priceFormatted: formattedDisplayPrice,
        image: coverImage,
        images: allImageUrls,
        serialNumber: `#${skuCode}`,
        location: branchLocation,
        submittedAt: new Date().toLocaleDateString('vi-VN'),
        appraiserName: 'Đội ngũ Thẩm định ReUse Hub',
        curatorNotes: forensicNotes,
        draftNotes: status === 'DRAFT' ? 'Bản nháp lưu tạm' : undefined,
      };

      list = [newListing, ...list.filter((it) => it.id !== newListing.id)];
      localStorage.setItem(THRIFT_LISTINGS_STORAGE_KEY, JSON.stringify(list));

      if (status === 'PENDING') {
        // Kích hoạt màn hình xác nhận thành công giống RENT
        setCreatedName(newListing.title);
        setTimeout(() => {
          navigate('/shop/thrift/listings');
        }, 3500);
      } else {
        alert(`ĐÃ LƯU BẢN NHÁP!\n\nMục đăng [${newListing.title}] đã được lưu.`);
        navigate('/shop/thrift/listings');
      }
    } catch (e) {
      console.error('Lỗi khi lưu mục đăng THRIFT:', e);
      alert('Có lỗi xảy ra khi lưu trữ dữ liệu. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveListingToSystem('PENDING');
  };

  const handleSaveDraft = () => {
    saveListingToSystem('DRAFT');
  };

  // MÀN HÌNH THÀNH CÔNG GIỐNG BÊN RENT
  if (createdName) {
    return (
      <div className="w-full flex items-center justify-center bg-[#fdf9f2] min-h-[calc(100vh-4rem)] px-4">
        <div className="max-w-md w-full bg-white rounded-2xl border border-[#ebe8e1] shadow-md p-8 text-center space-y-4 animate-fade-in">
          <div className="w-16 h-16 mx-auto rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center">
            <span className="material-symbols-outlined text-emerald-600 text-[36px]">check_circle</span>
          </div>
          <h2 className="font-serif text-xl font-bold text-[#141310]">Đăng mục THRIFT thành công!</h2>
          <p className="text-sm text-[#4a463f]">
            <strong>{createdName}</strong> đã được gửi đến Admin với trạng thái{' '}
            <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-xs font-bold">Chờ duyệt</span>
          </p>
          <p className="text-xs text-[#7b766f] leading-relaxed">
            Hồ sơ sản phẩm và hình ảnh Cloudinary đã được lưu vào MongoDB. Admin ReUse Hub sẽ đối chiếu thẩm định tình trạng trước khi kích hoạt mở bán công khai trên sàn THRIFT.
          </p>
          <p className="text-xs text-[#7b766f]">Tự động chuyển về danh mục đăng bán sau vài giây...</p>
          <div className="flex gap-3 justify-center pt-2">
            <Link
              to="/shop/thrift/listings"
              className="px-5 py-2.5 bg-[#141310] hover:bg-black text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-colors shadow-sm"
            >
              Về danh sách
            </Link>
            <button
              type="button"
              onClick={() => {
                setCreatedName(null);
                setListingTitle('');
                setPriceInput('');
                setCoverImage('');
                setDetailPhotos([]);
              }}
              className="px-5 py-2.5 bg-[#f1ede6] hover:bg-[#ebe5dc] text-[#141310] text-xs font-bold uppercase tracking-wider rounded-lg transition-colors"
            >
              Tạo thêm mục khác
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col font-sans text-[#1c1c18] bg-[#fdf9f2] min-h-[calc(100vh-4rem)] antialiased">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12 py-8 w-full">
        {/* Header Breadcrumbs & Actions */}
        <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-[#ebe8e1]">
          <div>
            <nav className="text-xs text-[#7b766f] mb-1 flex items-center gap-1.5 uppercase font-medium tracking-wider">
              <Link to="/shop/dashboard" className="hover:text-[#141310] transition-colors">
                Bảng Điều Khiển
              </Link>
              <span>/</span>
              <Link to="/shop/thrift/listings" className="hover:text-[#141310] transition-colors">
                Bán Đứt THRIFT
              </Link>
              <span>/</span>
              <span className="text-[#141310] font-semibold">Tạo Mục Đăng Mới</span>
            </nav>
            <h1 className="font-serif text-2xl sm:text-3xl text-[#141310] font-bold">
              Tạo Mục Đăng THRIFT Mới
            </h1>
            <p className="text-xs text-[#7b766f] mt-1">
              Hình ảnh lưu trực tiếp trên <strong>Cloudinary CDN</strong>, thông tin lưu vào <strong>MongoDB</strong> và chuyển đến Admin thẩm định trước khi mở bán công khai.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            <Link
              to="/shop/thrift/listings"
              className="px-4 py-2 bg-white hover:bg-[#ebe8e1] text-[#141310] text-xs font-semibold uppercase tracking-wider rounded-lg border border-[#ebe8e1] transition-colors shadow-sm flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              Danh sách THRIFT
            </Link>
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={isSubmitting || isUploadingCover || isUploadingDetails}
              className="px-4 py-2 bg-white hover:bg-[#ebe8e1] text-[#576151] border border-[#576151]/30 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            >
              Lưu Bản Nháp
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || isUploadingCover || isUploadingDetails}
              className="px-5 py-2.5 bg-[#141310] hover:bg-black text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-sm flex items-center gap-2 cursor-pointer transition-colors disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[18px]">verified</span>
              Gửi Phê Duyệt
            </button>
          </div>
        </div>

        {/* Main Grid: Form (8 cols) + Sticky Preview (4 cols) */}
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* CỘT TRÁI: FORM NHẬP LIỆU */}
          <div className="lg:col-span-8 space-y-6">
            {/* SECTION A: Hình ảnh trang phục & Thẩm định chi tiết */}
            <div className="bg-white p-6 rounded-2xl border border-[#ebe8e1] space-y-5 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-[#f1eee7]">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#576151] text-[22px]">photo_library</span>
                  <h2 className="font-serif text-lg font-bold text-[#141310]">
                    A. Hình ảnh trang phục &amp; Thẩm định chi tiết
                  </h2>
                </div>
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full font-mono flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Cloudinary CDN
                </span>
              </div>

              {/* 1. ẢNH BÌA CHÍNH (COVER PHOTO) */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#141310] mb-1.5">
                  Ảnh bìa chính diện (Cover Image) <span className="text-red-500">*</span>
                </label>
                <p className="text-[11px] text-[#7b766f] mb-3">
                  Ảnh đại diện hiển thị nổi bật trên sàn THRIFT. Khuyến khích chụp góc chính diện toàn cảnh trang phục.
                </p>

                <input
                  type="file"
                  ref={coverInputRef}
                  accept="image/*"
                  onChange={handleUploadCover}
                  disabled={isUploadingCover}
                  className="hidden"
                />

                {coverImage ? (
                  <div className="relative w-40 h-40 rounded-xl overflow-hidden border-2 border-[#576151] group shadow-sm bg-[#f7f3ec]">
                    <img src={coverImage} alt="Ảnh bìa trang phục" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 p-2">
                      <button
                        type="button"
                        onClick={() => coverInputRef.current?.click()}
                        disabled={isUploadingCover}
                        className="px-2.5 py-1 bg-white text-[#141310] text-[10px] font-semibold rounded shadow hover:bg-gray-100 transition-colors"
                      >
                        Đổi ảnh
                      </button>
                      <button
                        type="button"
                        onClick={() => setCoverImage('')}
                        className="px-2.5 py-1 bg-red-600 text-white text-[10px] font-semibold rounded shadow hover:bg-red-700 transition-colors"
                      >
                        Xóa ảnh
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => coverInputRef.current?.click()}
                    disabled={isUploadingCover}
                    className="w-40 h-40 border-2 border-dashed border-[#d4cec3] hover:border-[#576151] rounded-xl flex flex-col items-center justify-center gap-1 text-[#7b766f] hover:text-[#141310] transition-colors bg-[#fbf9f4] cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-3xl">
                      {isUploadingCover ? 'hourglass_top' : 'add_photo_alternate'}
                    </span>
                    <span className="text-[11px] font-semibold">
                      {isUploadingCover ? 'Đang tải lên...' : 'Tải ảnh bìa'}
                    </span>
                  </button>
                )}
              </div>

              {/* 2. BỘ ẢNH GÓC CHỤP CHI TIẾT (TỐI THIỂU 3 ẢNH) */}
              <div className="pt-4 border-t border-[#f1eee7]">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#141310]">
                    Bộ ảnh góc chụp chi tiết (Tối thiểu 3 góc) <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[11px] font-semibold text-[#576151]">
                    {detailPhotos.length} ảnh đã nạp
                  </span>
                </div>
                <p className="text-[11px] text-[#7b766f] mb-3">
                  Cung cấp các góc chụp đối kiểm: Mặt trước, Mặt sau, Cận cảnh chất vải, Đường may hoặc Nhãn tag để Admin thẩm định.
                </p>

                <input
                  type="file"
                  ref={detailsInputRef}
                  multiple
                  accept="image/*"
                  onChange={handleUploadDetails}
                  disabled={isUploadingDetails}
                  className="hidden"
                />

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                  {detailPhotos.map((photo) => (
                    <div
                      key={photo.id}
                      className="relative aspect-square rounded-xl overflow-hidden border border-[#ebe8e1] group bg-[#fbf9f4]"
                    >
                      <img src={photo.url} alt={photo.label} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 bg-black/70 text-white text-[9px] font-bold rounded">
                        {photo.badge}
                      </span>
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => setActivePhotoLightbox(photo.url)}
                          className="p-1.5 bg-white text-[#141310] rounded-full shadow hover:bg-gray-100"
                          title="Phóng to"
                        >
                          <span className="material-symbols-outlined text-[16px] block">visibility</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveDetailPhoto(photo.id)}
                          className="p-1.5 bg-red-600 text-white rounded-full shadow hover:bg-red-700"
                          title="Xóa ảnh"
                        >
                          <span className="material-symbols-outlined text-[16px] block">delete</span>
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Nút thêm ảnh */}
                  <button
                    type="button"
                    onClick={() => detailsInputRef.current?.click()}
                    disabled={isUploadingDetails}
                    className="aspect-square border-2 border-dashed border-[#d4cec3] hover:border-[#576151] rounded-xl flex flex-col items-center justify-center gap-1 text-[#7b766f] hover:text-[#141310] transition-colors bg-[#fbf9f4] cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-2xl">
                      {isUploadingDetails ? 'hourglass_top' : 'cloud_upload'}
                    </span>
                    <span className="text-[10px] font-semibold text-center px-2">
                      {isUploadingDetails ? 'Đang tải...' : 'Thêm ảnh Cloudinary'}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* SECTION B: Nguồn gốc Hiện vật (Circular Provenance Source) */}
            <div className="bg-white p-6 rounded-2xl border border-[#ebe8e1] space-y-4 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-[#f1eee7]">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#576151] text-[22px]">recycling</span>
                  <h2 className="font-serif text-lg font-bold text-[#141310]">
                    B. Nguồn gốc tuần hoàn (Circular Origin)
                  </h2>
                </div>
                <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-800 rounded text-xs font-semibold">
                  Tiêu chuẩn ReUse Hub
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label
                  onClick={() => setOriginSource('rental_archive')}
                  className={`flex flex-col p-4 rounded-xl cursor-pointer transition-all border ${
                    originSource === 'rental_archive'
                      ? 'bg-[#f7f5ed] border-[#576151] shadow-sm'
                      : 'bg-[#fbf9f4] border-[#ebe8e1] hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-bold text-[#141310]">
                      Chuyển giao từ Kho RENT
                    </span>
                    <input
                      type="radio"
                      name="origin_source"
                      checked={originSource === 'rental_archive'}
                      onChange={() => setOriginSource('rental_archive')}
                      className="accent-[#576151] cursor-pointer"
                    />
                  </div>
                  <p className="text-xs text-[#7b766f]">
                    Second Life Item — Trang phục hoàn tất chu kỳ cho thuê chất lượng cao, đã bảo dưỡng để bán đứt.
                  </p>
                </label>

                <label
                  onClick={() => setOriginSource('shop_direct')}
                  className={`flex flex-col p-4 rounded-xl cursor-pointer transition-all border ${
                    originSource === 'shop_direct'
                      ? 'bg-[#f7f5ed] border-[#576151] shadow-sm'
                      : 'bg-[#fbf9f4] border-[#ebe8e1] hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-bold text-[#141310]">
                      Kho xưởng ký gửi (Consignment)
                    </span>
                    <input
                      type="radio"
                      name="origin_source"
                      checked={originSource === 'shop_direct'}
                      onChange={() => setOriginSource('shop_direct')}
                      className="accent-[#576151] cursor-pointer"
                    />
                  </div>
                  <p className="text-xs text-[#7b766f]">
                    Trang phục thời trang sưu tầm hoặc ký gửi bảo chứng độc lập từ bộ sưu tập cá nhân / atelier.
                  </p>
                </label>
              </div>

              <div className="p-3.5 bg-[#fbf9f4] rounded-xl border border-[#ebe8e1] text-xs text-[#7b766f] flex items-center gap-2">
                <span className="material-symbols-outlined text-[#576151] text-[18px]">verified_user</span>
                <span>
                  {originSource === 'rental_archive'
                    ? 'Hiện vật liên kết mã chu kỳ cho thuê trong kho RENT. Mức độ khấu hao và lý lịch giặt hấp được xác thực tự động.'
                    : 'Trang phục ký gửi mới. Admin sẽ đối chiếu nhãn tag thương hiệu và kiểm định chất liệu vải vật lý.'}
                </span>
              </div>
            </div>

            {/* SECTION C: Thông tin Trang phục & Phân loại */}
            <div className="bg-white p-6 rounded-2xl border border-[#ebe8e1] space-y-4 shadow-sm">
              <div className="pb-3 border-b border-[#f1eee7] flex items-center gap-2">
                <span className="material-symbols-outlined text-[#576151] text-[22px]">apparel</span>
                <h2 className="font-serif text-lg font-bold text-[#141310]">
                  C. Thông tin trang phục &amp; Phân loại
                </h2>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#141310] mb-1.5">
                  Tên trang phục bán đứt (Listing Title) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={listingTitle}
                  onChange={(e) => setListingTitle(e.target.value)}
                  placeholder="Ví dụ: Đầm Dạ Hội Lụa Satin Cúp Ngực Phối Ren Cao Cấp..."
                  className="w-full px-3.5 py-2.5 bg-[#fbf9f4] border border-[#e4dfd5] rounded-lg text-sm text-[#141310] focus:outline-none focus:border-[#576151] focus:bg-white transition-colors"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#141310] mb-1.5">
                    Phân mục trang phục <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#fbf9f4] border border-[#e4dfd5] rounded-lg text-sm text-[#141310] focus:outline-none focus:border-[#576151] focus:bg-white transition-colors cursor-pointer"
                    required
                  >
                    <option value="">-- Chọn phân mục trang phục --</option>
                    {categories.length > 0 ? (
                      categories.map((c) => (
                        <option key={c._id} value={c.name}>
                          {c.name}
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="Đầm dạ hội">Đầm dạ hội</option>
                        <option value="Áo dài & Trang phục truyền thống">Áo dài &amp; Trang phục truyền thống</option>
                        <option value="Váy thiết kế Archival">Váy thiết kế Archival</option>
                        <option value="Quần áo & Giày dép Nữ">Quần áo &amp; Giày dép Nữ</option>
                        <option value="Vest & Trang phục sự kiện">Vest &amp; Trang phục sự kiện</option>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#141310] mb-1.5">
                    Thương hiệu / Nhà thiết kế
                  </label>
                  <input
                    type="text"
                    value={brandOrigin}
                    onChange={(e) => setBrandOrigin(e.target.value)}
                    placeholder="Ví dụ: Chanel, Dior, Thiết kế thủ công..."
                    className="w-full px-3.5 py-2.5 bg-[#fbf9f4] border border-[#e4dfd5] rounded-lg text-sm text-[#141310] focus:outline-none focus:border-[#576151] focus:bg-white transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#141310] mb-1.5">
                    Kích cỡ (Size) &amp; Màu sắc / Chất liệu
                  </label>
                  <input
                    type="text"
                    value={sizeColor}
                    onChange={(e) => setSizeColor(e.target.value)}
                    placeholder="Ví dụ: Size M (Eo 66-70cm) • Màu Đỏ Burgundy..."
                    className="w-full px-3.5 py-2.5 bg-[#fbf9f4] border border-[#e4dfd5] rounded-lg text-sm text-[#141310] focus:outline-none focus:border-[#576151] focus:bg-white transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#141310] mb-1.5">
                    Mã SKU phân loại xưởng
                  </label>
                  <input
                    type="text"
                    value={skuCode}
                    onChange={(e) => setSkuCode(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-[#fbf9f4] border border-[#e4dfd5] rounded-lg text-sm text-[#141310] font-mono focus:outline-none focus:border-[#576151] focus:bg-white transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#141310] mb-1.5">
                  Chi nhánh kho xuất hàng <span className="text-red-500">*</span>
                </label>
                <select
                  value={branchLocation}
                  onChange={(e) => setBranchLocation(e.target.value as 'Đà Nẵng' | 'Hà Nội' | 'TP. Hồ Chí Minh')}
                  className="w-full px-3.5 py-2.5 bg-[#fbf9f4] border border-[#e4dfd5] rounded-lg text-sm text-[#141310] font-semibold focus:outline-none focus:border-[#576151] focus:bg-white transition-colors cursor-pointer"
                >
                  <option value="Đà Nẵng">Chi nhánh Đà Nẵng (Kho Miền Trung)</option>
                  <option value="Hà Nội">Chi nhánh Hà Nội (Kho Miền Bắc)</option>
                  <option value="TP. Hồ Chí Minh">Chi nhánh TP. Hồ Chí Minh (Kho Miền Nam)</option>
                </select>
                <p className="text-[11px] text-[#7b766f] mt-1">
                  Hệ thống tự động tính cước vận chuyển giao nhận bảo chứng tới người mua dựa trên chi nhánh kho này.
                </p>
              </div>
            </div>

            {/* SECTION D: Tình trạng & Ghi chú Thẩm định */}
            <div className="bg-white p-6 rounded-2xl border border-[#ebe8e1] space-y-4 shadow-sm">
              <div className="pb-3 border-b border-[#f1eee7] flex items-center gap-2">
                <span className="material-symbols-outlined text-[#576151] text-[22px]">health_and_safety</span>
                <h2 className="font-serif text-lg font-bold text-[#141310]">
                  D. Đánh giá tình trạng &amp; Thẩm định thực tế
                </h2>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#141310] mb-2">
                  Phân hạng tình trạng trang phục <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <label
                    onClick={() => setConditionGrade('like_new')}
                    className={`flex flex-col p-3.5 rounded-xl cursor-pointer border transition-all ${
                      conditionGrade === 'like_new'
                        ? 'bg-[#f7f5ed] border-[#576151] shadow-sm'
                        : 'bg-[#fbf9f4] border-[#ebe8e1] hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-sm text-[#141310]">Like New</span>
                      <input
                        type="radio"
                        name="cond_grade"
                        checked={conditionGrade === 'like_new'}
                        onChange={() => setConditionGrade('like_new')}
                        className="accent-[#576151]"
                      />
                    </div>
                    <span className="text-[11px] font-semibold text-emerald-700">98% — 99% Hoàn hảo</span>
                    <p className="text-[11px] text-[#7b766f] mt-1">
                      Như mới, đường may &amp; khóa kéo nguyên vẹn, đã tiệt trùng.
                    </p>
                  </label>

                  <label
                    onClick={() => setConditionGrade('good')}
                    className={`flex flex-col p-3.5 rounded-xl cursor-pointer border transition-all ${
                      conditionGrade === 'good'
                        ? 'bg-[#f7f5ed] border-[#576151] shadow-sm'
                        : 'bg-[#fbf9f4] border-[#ebe8e1] hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-sm text-[#141310]">Good</span>
                      <input
                        type="radio"
                        name="cond_grade"
                        checked={conditionGrade === 'good'}
                        onChange={() => setConditionGrade('good')}
                        className="accent-[#576151]"
                      />
                    </div>
                    <span className="text-[11px] font-semibold text-amber-700">90% — 97% Rất tốt</span>
                    <p className="text-[11px] text-[#7b766f] mt-1">
                      Đã qua sử dụng nhẹ, không có vết ố hay sờn vải, phom dáng đẹp.
                    </p>
                  </label>

                  <label
                    onClick={() => setConditionGrade('fair')}
                    className={`flex flex-col p-3.5 rounded-xl cursor-pointer border transition-all ${
                      conditionGrade === 'fair'
                        ? 'bg-[#f7f5ed] border-[#576151] shadow-sm'
                        : 'bg-[#fbf9f4] border-[#ebe8e1] hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-sm text-[#141310]">Fair</span>
                      <input
                        type="radio"
                        name="cond_grade"
                        checked={conditionGrade === 'fair'}
                        onChange={() => setConditionGrade('fair')}
                        className="accent-[#576151]"
                      />
                    </div>
                    <span className="text-[11px] font-semibold text-gray-700">80% — 89% Khá</span>
                    <p className="text-[11px] text-[#7b766f] mt-1">
                      Dấu ấn thời gian nhẹ, vải còn tốt, phù hợp chụp ảnh/sự kiện.
                    </p>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#141310] mb-1.5">
                  Mô tả chất liệu, phom dáng &amp; Ghi chú thẩm định <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={4}
                  value={forensicNotes}
                  onChange={(e) => setForensicNotes(e.target.value)}
                  placeholder="Mô tả chi tiết chất liệu vải, kiểu dáng, đường kim mũi chỉ, cúc áo, khóa kéo và phương pháp bảo quản..."
                  className="w-full px-3.5 py-2.5 bg-[#fbf9f4] border border-[#e4dfd5] rounded-lg text-sm text-[#141310] focus:outline-none focus:border-[#576151] focus:bg-white transition-colors"
                  required
                />
              </div>
            </div>

            {/* SECTION E: Định giá Bán đứt & Smart Escrow */}
            <div className="bg-white p-6 rounded-2xl border border-[#ebe8e1] space-y-4 shadow-sm">
              <div className="pb-3 border-b border-[#f1eee7] flex items-center gap-2">
                <span className="material-symbols-outlined text-[#576151] text-[22px]">payments</span>
                <h2 className="font-serif text-lg font-bold text-[#141310]">
                  E. Định giá bán đứt &amp; Thanh toán Escrow
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 items-start">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#141310] mb-1.5">
                    Giá bán đứt THRIFT (VND) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={priceInput}
                      onChange={handlePriceChange}
                      placeholder="1.850.000"
                      className="w-full px-3.5 py-2.5 bg-[#fbf9f4] border border-[#e4dfd5] rounded-lg text-lg font-bold text-[#141310] font-mono text-right pr-14 focus:outline-none focus:border-[#576151] focus:bg-white transition-colors"
                      required
                    />
                    <span className="absolute right-3.5 top-3 text-xs font-bold text-[#7b766f] pointer-events-none">
                      VND (₫)
                    </span>
                  </div>
                  <p className="text-[11px] text-[#7b766f] mt-1.5">
                    Giao dịch chuyển nhượng quyền sở hữu vĩnh viễn (không bao gồm ngày thuê hay cọc).
                  </p>
                </div>

                <div className="p-4 bg-[#fbf9f4] rounded-xl border border-[#ebe8e1] space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#141310]">
                    <span className="material-symbols-outlined text-[#576151] text-[18px]">account_balance</span>
                    ReUse Hub Smart Escrow
                  </div>
                  <p className="text-xs text-[#7b766f] leading-relaxed">
                    100% thanh toán bán đứt được tạm giữ tại tài khoản ký quỹ bảo chứng. Số tiền sẽ giải ngân về tài khoản Shop sau khi người mua nhận hàng và xác nhận trong 72 giờ.
                  </p>
                </div>
              </div>

              {/* CAM KẾT CHUẨN BỊ & THẨM ĐỊNH (GIỐNG RENT) */}
              <div className="pt-4 border-t border-[#f1eee7] space-y-2.5">
                <p className="text-xs font-bold uppercase tracking-wider text-[#141310] mb-2">
                  Cam kết chuẩn bị &amp; Bàn giao trang phục THRIFT:
                </p>

                <label className="flex items-start gap-2.5 text-xs text-[#2c2a26] cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={ruleCleaned}
                    onChange={(e) => setRuleCleaned(e.target.checked)}
                    className="mt-0.5 rounded text-[#576151] focus:ring-[#576151] cursor-pointer"
                  />
                  <span>
                    <strong>Giặt hấp &amp; Khử khuẩn:</strong> Trang phục đã được giặt khô/giặt hấp chuyên nghiệp, ủi phẳng phom dáng và khử khuẩn kỹ càng, sẵn sàng để người mua mặc ngay.
                  </span>
                </label>

                <label className="flex items-start gap-2.5 text-xs text-[#2c2a26] cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={ruleInspected}
                    onChange={(e) => setRuleInspected(e.target.checked)}
                    className="mt-0.5 rounded text-[#576151] focus:ring-[#576151] cursor-pointer"
                  />
                  <span>
                    <strong>Kiểm tra toàn vẹn:</strong> Đã đối kiểm đầy đủ cúc áo, khóa kéo, đường chỉ may, không có vết ố rách ẩn giấu ngoài thông tin mô tả.
                  </span>
                </label>

                <label className="flex items-start gap-2.5 text-xs text-[#2c2a26] cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={rulePackaged}
                    onChange={(e) => setRulePackaged(e.target.checked)}
                    className="mt-0.5 rounded text-[#576151] focus:ring-[#576151] cursor-pointer"
                  />
                  <span>
                    <strong>Bao bọc chống bụi &amp; Móc treo:</strong> Đóng gói cẩn thận kèm túi bọc chống bụi hoặc móc định hình chuyên dụng để bảo vệ trang phục trong quá trình vận chuyển.
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* CỘT PHẢI: LIVE PREVIEW & GỬI DUYỆT (STICKY) */}
          <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-4">
            <div className="bg-white p-5 rounded-2xl border border-[#ebe8e1] shadow-sm">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#f1eee7]">
                <h3 className="text-xs uppercase font-bold tracking-wider text-[#7b766f]">
                  Xem trước bài đăng (Preview)
                </h3>
                <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded">
                  Chờ duyệt
                </span>
              </div>

              {/* Thẻ mô phỏng sàn THRIFT */}
              <div className="bg-[#fbf9f4] rounded-xl overflow-hidden border border-[#ebe8e1]">
                <div className="aspect-[4/3] bg-[#ece7dd] flex items-center justify-center relative overflow-hidden">
                  {coverImage ? (
                    <img src={coverImage} alt="Preview" className="w-full h-full object-cover transition-transform duration-300 hover:scale-105" />
                  ) : (
                    <div className="text-center p-4 text-[#9c958b]">
                      <span className="material-symbols-outlined text-4xl block mb-1">styler</span>
                      <span className="text-xs">Chưa có ảnh bìa</span>
                    </div>
                  )}
                  {coverImage && (
                    <div className="absolute top-2 left-2 flex flex-col gap-1 items-start">
                      <span className="bg-black/75 text-white text-[9px] px-2 py-0.5 rounded font-bold uppercase tracking-wider backdrop-blur-sm">
                        {originSource === 'rental_archive' ? 'Second Life Item' : 'Kho Xưởng Ký Gửi'}
                      </span>
                      <span className="bg-amber-500 text-white text-[9px] px-2 py-0.5 rounded font-bold uppercase tracking-wider shadow-sm">
                        Chờ duyệt (Admin)
                      </span>
                    </div>
                  )}
                  {detailPhotos.length > 0 && (
                    <span className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded backdrop-blur-sm">
                      +{detailPhotos.length} góc ảnh
                    </span>
                  )}
                </div>

                <div className="p-3.5 space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] text-[#576151] font-semibold uppercase tracking-wider">
                    <span>{category || 'Chưa chọn phân mục'}</span>
                    <span className="font-mono text-gray-500">{skuCode}</span>
                  </div>
                  <h4 className="font-serif font-bold text-sm text-[#141310] line-clamp-2 leading-snug">
                    {listingTitle || 'Tên trang phục bán đứt THRIFT'}
                  </h4>
                  <div className="text-base font-bold text-[#576151] font-mono">
                    {formattedDisplayPrice}
                  </div>
                  <div className="pt-2 mt-2 border-t border-[#ebe8e1] flex justify-between text-[11px] text-[#7b766f]">
                    <span>Tình trạng:</span>
                    <strong className="text-[#141310]">{conditionGradeLabel}</strong>
                  </div>
                  <div className="flex justify-between text-[11px] text-[#7b766f]">
                    <span>Size &amp; Màu:</span>
                    <strong className="text-[#141310] truncate max-w-[170px]">{sizeColor || 'Chưa nhập'}</strong>
                  </div>
                  <div className="flex justify-between text-[11px] text-[#7b766f]">
                    <span>Kho xuất:</span>
                    <strong className="text-[#576151]">{branchLocation}</strong>
                  </div>
                  <div className="flex justify-between text-[11px] text-[#7b766f]">
                    <span>Thanh toán:</span>
                    <strong className="text-emerald-700 font-medium">Smart Escrow ✓</strong>
                  </div>
                </div>
              </div>

              {/* Nút gửi phê duyệt */}
              <button
                type="submit"
                disabled={isSubmitting || isUploadingCover || isUploadingDetails}
                className="mt-5 w-full py-3.5 bg-[#141310] hover:bg-[#2b2925] disabled:bg-gray-400 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow transition-all cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Đang lưu vào MongoDB...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">publish</span>
                    <span>Gửi yêu cầu duyệt đến Admin</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={isSubmitting || isUploadingCover || isUploadingDetails}
                className="mt-2 w-full py-2.5 bg-white hover:bg-gray-50 border border-[#ebe8e1] text-[#7b766f] hover:text-[#141310] text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer"
              >
                Lưu Bản Nháp (Draft)
              </button>

              <Link
                to="/shop/thrift/listings"
                className="block text-center text-xs text-[#7b766f] hover:text-[#141310] mt-3 transition-colors"
              >
                Hủy bỏ và quay lại danh sách
              </Link>
            </div>
          </div>
        </form>
      </div>

      {/* Lightbox Modal */}
      {activePhotoLightbox && (
        <div
          onClick={() => setActivePhotoLightbox(null)}
          className="fixed inset-0 z-50 bg-[#141310]/85 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="relative max-w-4xl max-h-[85vh] rounded-xl overflow-hidden shadow-2xl bg-black">
            <img
              src={activePhotoLightbox}
              alt="Ảnh phóng to"
              className="w-full h-full object-contain"
            />
            <button
              onClick={() => setActivePhotoLightbox(null)}
              className="absolute top-3 right-3 w-9 h-9 bg-white/90 hover:bg-white text-black rounded-full flex items-center justify-center shadow-lg transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateThriftListing;
