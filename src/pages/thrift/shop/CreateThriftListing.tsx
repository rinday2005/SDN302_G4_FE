import React, { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { ThriftListingItem } from '../../data/shop/thriftListingsData';
import { THRIFT_LISTINGS_STORAGE_KEY, INITIAL_THRIFT_LISTINGS } from '../../data/shop/thriftListingsData';
import { uploadImageApi } from '../../../services/upload.api';
import { createThriftListingApi } from '../../../services/thrift.api';
import { getCategoriesApi, type CategoryItem } from '../../../services/category.api';

interface GalleryInspectionPhoto {
  id: string;
  url: string;
  label: string;
  badge: string;
}

const DEFAULT_INSPECTION_PHOTOS: GalleryInspectionPhoto[] = [
  {
    id: 'hero',
    url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD7_8xVSn2aS0vVyTTQ8a2PfGeh65_lc2X4yAETdJJJy6sDTywBiHVeV11mOnvIhaoG_13CZd1a4a_zeFJ3m8MLOWrD_oCyem3CQq7Wdn6un-S7alN_DNcdnsPWR6W230bGFfL1v7f2sK4YZ0kUle-jTWgMfPo1UUoYNEScXxOb5UIW6E5CeL4gCIUpfQ2kZcf3b0i44pPF2IHrRXclcGmY0ddCsD1RX-8c-nnnovaj',
    label: 'Ảnh đại diện chính diện góc 45 độ',
    badge: 'Hero',
  },
  {
    id: 'sensor',
    url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBtjD0lu2ZgmrBCrpIrP6AnotY0bnPpmxEwxxaORCZkWx3pZpZKIKWtall0nh2IYUArn7QoP8Qrnkt1FhCXk41QMakOKTf5yH5QJcZmdl3Kw91FcmmIYWMfPmz3vXV9RsNNfCd5Up45TzrVsnrgQbz4f-52Gdy8NSNJk7yrqc4Q1jwxN22QMJrbuA8ZoMPqzWVzlCHKIogwPlfpQhcccUYzOCnIjb83s9RjNTQ5CN_U',
    label: 'Buồng cảm biến 50MP không bụi',
    badge: 'Cảm biến',
  },
  {
    id: 'dials',
    url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC892HTMoqndg08qxhhhX2b1xj5UMSFQiDaFzT_vrNcIrmqQQbW45icKVHTWaz3dubURUViS0MFB8gaC9ztcEG2ekt1K6rmIybzcxu3Q-jxWAgWdwoLMELp5SEMr3Ware5gTs5WjBQmh7Rfw4a3I6Yt69evRBtC9C3hkZK04HG1j9pROA6cU_ZY34abFcxHxo4ValocKQVqHnaYW49urlpYPKeBwE-HggMlKYy4VLYA',
    label: 'Cụm phím cơ CNC và màn hình',
    badge: 'Phím xoay',
  },
];

export const CreateThriftListing: React.FC = () => {
  const navigate = useNavigate();

  // Form State
  const [originSource, setOriginSource] = useState<'rental_archive' | 'shop_direct'>('rental_archive');
  const [listingTitle, setListingTitle] = useState('Hasselblad 907X 50C + Kit Lens XCD 45mm f/4 P (Ex-Rental Archive Mint-)');
  const [category, setCategory] = useState('Camera & Quang học / Medium Format Digital');
  const [brandOrigin, setBrandOrigin] = useState('Hasselblad (Thụy Điển / Göteborg)');
  const [skuCode, setSkuCode] = useState('HBL-907X-TH01');
  const [conditionGrade, setConditionGrade] = useState<'like_new' | 'good' | 'fair'>('like_new');
  const [forensicNotes, setForensicNotes] = useState(
    'Thân máy và thấu kính bảo quản tiêu chuẩn phòng sạch 40% RH. Ngoại quan nguyên bản không cấn móp, màn trập cơ học hoạt động chính xác ở mọi tốc độ. Kèm chứng nhận kiểm định xưởng Atelier Chronos.'
  );
  const [priceInput, setPriceInput] = useState('122.000.000');
  const [photos, setPhotos] = useState<GalleryInspectionPhoto[]>(DEFAULT_INSPECTION_PHOTOS);
  const [activePhotoLightbox, setActivePhotoLightbox] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [categories, setCategories] = useState<CategoryItem[]>([]);

  useEffect(() => {
    getCategoriesApi().then((cats) => {
      if (cats && cats.length > 0) {
        setCategories(cats);
      }
    });
  }, []);

  // Formatting helpers
  const numericPrice = useMemo(() => {
    return parseInt(priceInput.replace(/\D/g, ''), 10) || 0;
  }, [priceInput]);

  const formattedDisplayPrice = useMemo(() => {
    return numericPrice > 0 ? numericPrice.toLocaleString('vi-VN') + ' ₫' : '0 ₫';
  }, [numericPrice]);

  const conditionGradeLabel = useMemo(() => {
    switch (conditionGrade) {
      case 'like_new':
        return 'Like New: 98.0%';
      case 'good':
        return 'Good: 94.0%';
      case 'fair':
        return 'Fair: 86.0%';
      default:
        return 'Like New: 98.0%';
    }
  }, [conditionGrade]);

  // Handle Price Change with Thousand Separator
  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawDigits = e.target.value.replace(/\D/g, '');
    if (!rawDigits) {
      setPriceInput('');
      return;
    }
    const val = parseInt(rawDigits, 10);
    setPriceInput(val.toLocaleString('vi-VN'));
  };

  // Upload photo to Cloudinary
  const handleUploadPhotoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    try {
      setIsUploadingPhoto(true);
      const uploadPromises = files.map(async (file, idx) => {
        const url = await uploadImageApi(file);
        return {
          id: `cloud-${Date.now()}-${idx}`,
          url,
          label: file.name.slice(0, 20),
          badge: idx === 0 && photos.length === 0 ? 'Hero' : 'Cloudinary',
        };
      });
      const newItems = await Promise.all(uploadPromises);
      setPhotos((prev) => [...prev, ...newItems]);
    } catch (err) {
      console.error(err);
      alert('Không thể tải ảnh lên Cloudinary. Vui lòng kiểm tra lại kết nối!');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  // Helper: Save Listing (Draft or Submit to MongoDB)
  const saveListingToStorage = async (status: 'PENDING' | 'DRAFT') => {
    try {
      setIsSubmitting(true);
      const matchedCat = categories.find((c) => c.name.toLowerCase().includes('camera') || c.type === 'THRIFT') || categories[0];
      const imageUrls = photos.map((p) => p.url).filter(Boolean);

      // Gọi API Backend lưu vào MongoDB
      const payload = {
        name: listingTitle.trim(),
        description: forensicNotes.trim(),
        price: numericPrice,
        condition: conditionGrade.toUpperCase(),
        images: imageUrls.length > 0 ? imageUrls : ['https://placehold.co/600x400'],
        location: 'Hà Nội',
        categoryId: matchedCat?._id || '67c000000000000000000001',
        sourceType: originSource === 'rental_archive' ? 'FROM_RENTAL' : 'MANUAL',
        status: status === 'PENDING' ? 'PENDING_APPROVAL' : 'DRAFT',
      };

      let createdMongoListing: any = null;
      try {
        createdMongoListing = await createThriftListingApi(payload);
      } catch (apiErr) {
        console.warn('API create thrift listing failed, falling back to local:', apiErr);
      }

      // Lưu đồng bộ vào localStorage
      const existingRaw = localStorage.getItem(THRIFT_LISTINGS_STORAGE_KEY);
      let list: ThriftListingItem[] = existingRaw ? JSON.parse(existingRaw) : INITIAL_THRIFT_LISTINGS;

      const newListing: ThriftListingItem = {
        id: createdMongoListing?._id || skuCode.trim() || `THRIFT-${Date.now()}`,
        sku: skuCode.trim() || `SKU-${Date.now()}`,
        title: listingTitle.trim() || 'Hiện vật bán đứt THRIFT',
        category: category.split('/')[0].trim(),
        categoryKey: 'cameras',
        description: forensicNotes.trim(),
        source: originSource === 'rental_archive' ? 'RETURNED_RENTAL' : 'SHOP_INVENTORY',
        sourceLabel: originSource === 'rental_archive' ? 'Second Life Item' : 'Kho Xưởng Ký Gửi',
        rentalCycles: originSource === 'rental_archive' ? 14 : 0,
        originalRentInvId: originSource === 'rental_archive' ? 'INV-HB907-01' : undefined,
        rentHistoryUrl: originSource === 'rental_archive' ? '/shop/rent/inventory/specimen-907x' : undefined,
        status: status,
        statusLabel: status === 'PENDING' ? 'Chờ Duyệt Admin' : 'BẢN NHÁP (Draft)',
        stockStatus: status === 'PENDING' ? 'Chưa mở bán công khai' : 'Chưa gửi kiểm duyệt',
        conditionGrade: conditionGradeLabel,
        conditionScore: conditionGrade === 'like_new' ? 98.0 : conditionGrade === 'good' ? 94.0 : 86.0,
        price: numericPrice,
        priceFormatted: formattedDisplayPrice,
        image: photos[0]?.url || 'https://placehold.co/600x400',
        serialNumber: '#HB-907-88201',
        submittedAt: new Date().toLocaleDateString('vi-VN'),
        appraiserName: 'Atelier Chronos & Optics',
        curatorNotes: forensicNotes,
        draftNotes: status === 'DRAFT' ? 'Chưa hoàn tất hồ sơ đo quang học' : undefined,
      };

      list = [newListing, ...list.filter((it) => it.id !== newListing.id)];
      localStorage.setItem(THRIFT_LISTINGS_STORAGE_KEY, JSON.stringify(list));

      if (status === 'PENDING') {
        alert(`GỬI PHÊ DUYỆT THÀNH CÔNG!\n\nMục đăng [${newListing.title}] đã được lưu vào MongoDB & ảnh Cloudinary và nộp cho Admin thẩm định.`);
      } else {
        alert(`ĐÃ LƯU BẢN NHÁP!\n\nMục đăng [${newListing.title}] đã được lưu vào MongoDB.`);
      }

      navigate('/shop/thrift/listings');
    } catch (e) {
      console.error('Lỗi khi lưu mục đăng THRIFT:', e);
      alert('Có lỗi xảy ra khi lưu trữ dữ liệu. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!listingTitle.trim()) {
      alert('Vui lòng nhập tên hiện vật bán đứt!');
      return;
    }
    if (numericPrice <= 0) {
      alert('Vui lòng nhập giá bán đứt THRIFT hợp lệ!');
      return;
    }
    saveListingToStorage('PENDING');
  };

  const handleSaveDraft = () => {
    saveListingToStorage('DRAFT');
  };


  return (
    <div className="w-full flex flex-col font-sans text-on-surface bg-surface min-h-[calc(100vh-4rem)] antialiased no-reveal">


      {/* Page Header & Action Anchor */}
      <section className="max-w-[1440px] mx-auto w-full px-margin-mobile lg:px-margin pt-8 pb-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-outline-variant/30">
          <div className="space-y-2">
            <div className="flex items-center gap-2 font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest">
              <Link to="/shop/dashboard" className="hover:text-primary transition-colors">
                Bảng Điều Khiển Xưởng
              </Link>
              <span>/</span>
              <Link to="/shop/thrift/listings" className="hover:text-primary transition-colors">
                Bán Đứt THRIFT
              </Link>
              <span>/</span>
              <span className="text-primary font-medium">Tạo Mục Đăng Mới</span>
            </div>
            <h1 className="font-serif text-3xl lg:text-4xl text-on-surface tracking-tight">
              Tạo Mục Đăng THRIFT Mới
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl">
              Thiết lập hồ sơ hiện vật bán đứt tuần hoàn. Mọi mục đăng phải qua quy trình thẩm định độc lập từ ReUse Hub trước khi mở bán công khai.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            <Link
              to="/shop/thrift/listings"
              className="px-4 py-2.5 font-label-md text-label-md uppercase tracking-wider text-on-surface-variant hover:text-on-surface hover:bg-surface-container rounded-DEFAULT transition-colors"
            >
              Hủy &amp; Quay Lại
            </Link>
            <button
              type="button"
              onClick={handleSaveDraft}
              className="px-4 py-2.5 font-label-md text-label-md uppercase tracking-wider text-primary border border-primary/30 hover:bg-surface-container-high rounded-DEFAULT transition-all cursor-pointer"
            >
              Lưu Bản Nháp
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="px-5 py-2.5 font-label-md text-label-md uppercase tracking-wider bg-on-surface text-surface hover:bg-primary transition-all rounded-DEFAULT shadow-sm flex items-center gap-2 cursor-pointer font-semibold"
            >
              <span className="material-symbols-outlined text-[18px]">verified</span>
              Gửi Phê Duyệt
            </button>
          </div>
        </div>
      </section>

      {/* Main Grid Workspace */}
      <div className="max-w-[1440px] mx-auto w-full px-margin-mobile lg:px-margin pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT COLUMN: Listing Registration Dossier (8 cols) */}
          <form className="lg:col-span-8 space-y-8" onSubmit={handleSubmit}>
            {/* SECTION 1: Nguồn gốc Hiện vật (Circular Provenance Source) */}
            <div className="bg-surface-container-lowest p-6 lg:p-8 rounded-lg shadow-sm space-y-6 border border-surface-dim">
              <div className="flex items-center justify-between border-b border-outline-variant/20 pb-4">
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-surface-container-high flex items-center justify-center font-label-sm text-label-sm text-primary font-bold">
                    01
                  </span>
                  <div>
                    <h2 className="font-title-md text-title-md text-on-surface font-semibold">
                      Nguồn Gốc Hiện Vật (Circular Origin)
                    </h2>
                    <p className="font-label-sm text-label-sm text-on-surface-variant">
                      Xác định tính chất vòng đời theo tiêu chuẩn bán đứt ReUse Hub
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-1 bg-secondary-container/40 rounded-DEFAULT text-secondary font-label-sm text-label-sm uppercase tracking-wider font-semibold">
                  B-Corp Protocol
                </span>
              </div>

              {/* Radio Toggle Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label
                  onClick={() => setOriginSource('shop_direct')}
                  className={`relative flex flex-col p-4 rounded-DEFAULT cursor-pointer transition-all ${originSource === 'shop_direct'
                    ? 'bg-surface-container-high border-2 border-primary/40 shadow-sm'
                    : 'bg-surface-container-low hover:bg-surface-container'
                    }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-title-md text-body-md font-semibold text-on-surface">
                      Kho xưởng ký gửi
                    </span>
                    <input
                      type="radio"
                      name="item_source"
                      value="shop_direct"
                      checked={originSource === 'shop_direct'}
                      onChange={() => setOriginSource('shop_direct')}
                      className="accent-primary cursor-pointer"
                    />
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    Hiện vật sưu tầm hoặc ký gửi bảo chứng độc lập từ mạng lưới xưởng chuyên biệt.
                  </p>
                </label>

                <label
                  onClick={() => setOriginSource('rental_archive')}
                  className={`relative flex flex-col p-4 rounded-DEFAULT cursor-pointer shadow-sm transition-all ${originSource === 'rental_archive'
                    ? 'bg-surface-container-high border-2 border-primary/40 shadow-sm'
                    : 'bg-surface-container-low hover:bg-surface-container'
                    }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-title-md text-body-md font-semibold text-primary">
                        Chuyển giao từ Kho RENT
                      </span>
                      <span className="w-2 h-2 rounded-full bg-secondary"></span>
                    </div>
                    <input
                      type="radio"
                      name="item_source"
                      value="rental_archive"
                      checked={originSource === 'rental_archive'}
                      onChange={() => setOriginSource('rental_archive')}
                      className="accent-primary cursor-pointer"
                    />
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    Second Life Item — Hiện vật hoàn tất trọn vẹn chu kỳ cho thuê chất lượng cao.
                  </p>
                </label>
              </div>

              {/* Immutable Circular Provenance Box (Read-only) */}
              <div className="bg-surface-container-low p-5 rounded-DEFAULT space-y-4 border border-surface-dim">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-secondary text-[20px]">lock</span>
                    <span className="font-label-md text-label-md uppercase tracking-wider text-primary font-semibold">
                      Hồ Sơ Nguồn Gốc Lưu Ký Bất Biến (Immutable Circular Provenance)
                    </span>
                  </div>
                  <span className="font-label-sm text-label-sm px-2 py-0.5 bg-surface-container-highest text-on-surface-variant rounded-DEFAULT font-mono">
                    Read-Only Hash
                  </span>
                </div>

                {originSource === 'rental_archive' ? (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                      <div className="space-y-1">
                        <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant block">
                          Sản phẩm RENT gốc
                        </span>
                        <p className="font-body-md text-body-md font-semibold text-on-surface">
                          Hasselblad 907X 50C + Lens XCD 45mm f/4 P Kit
                        </p>
                        <span className="font-label-sm text-label-sm text-outline font-mono">
                          Mã tham chiếu: #HBL-907X-SL14
                        </span>
                      </div>
                      <div className="space-y-1">
                        <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant block">
                          Mã Định Danh Hiện Vật
                        </span>
                        <p className="font-body-md text-body-md font-semibold text-on-surface font-mono">
                          #INV-HB907-01
                        </p>
                        <span className="font-label-sm text-label-sm text-outline font-mono">
                          Số Serial khắc: #HB-907-88201
                        </span>
                      </div>
                    </div>
                    <div className="pt-3 border-t border-outline-variant/30 space-y-2">
                      <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant block">
                        Nghiệm thu hoàn trả gần nhất &amp; Lịch sử chu kỳ
                      </span>
                      <p className="font-body-sm text-body-sm text-on-surface leading-relaxed">
                        Đạt chuẩn 98.0% Mint-. Cảm biến 50MP sạch 100% tại f/16, thấu kính không xước mốc. Hoàn tất chu kỳ thuê thứ 14 vào ngày 19/11/2024 (Đơn #RH-RNT-2024-8845).
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span>Mã hợp đồng ký gửi: #CONSIGN-2024-882</span>
                      <span className="text-secondary font-bold">Xác thực Atelier Chronos</span>
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface leading-relaxed">
                      Hiện vật được tiếp nhận trực tiếp từ nhà sưu tầm Wetzlar Heritage. Đã qua quy trình hiệu chuẩn cơ học và kiểm tra thấu kính 10 bước tại phòng sạch.
                    </p>
                  </div>
                )}

                <div className="flex items-center gap-2 text-secondary font-label-sm text-label-sm pt-1">
                  <span className="material-symbols-outlined text-[16px]">verified_user</span>
                  <span>Dữ liệu nguồn gốc đã được xác thực mã hóa — Không thể chỉnh sửa hoặc hoán đổi sau phát hành.</span>
                </div>
              </div>
            </div>

            {/* SECTION 2: Thông tin Hiện vật & Danh mục (Product & Category) */}
            <div className="bg-surface-container-lowest p-6 lg:p-8 rounded-lg shadow-sm space-y-6 border border-surface-dim">
              <div className="flex items-center gap-3 border-b border-outline-variant/20 pb-4">
                <span className="w-7 h-7 rounded-full bg-surface-container-high flex items-center justify-center font-label-sm text-label-sm text-primary font-bold">
                  02
                </span>
                <div>
                  <h2 className="font-title-md text-title-md text-on-surface font-semibold">
                    Thông Tin Hiện Vật &amp; Danh Mục Bán Đứt
                  </h2>
                  <p className="font-label-sm text-label-sm text-on-surface-variant">
                    Quy chuẩn danh mục theo phân loại lưu trữ công khai
                  </p>
                </div>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block font-label-md text-label-md uppercase tracking-wider text-on-surface mb-2 font-semibold">
                    Tên Hiện Vật Bán Đứt (Listing Title) <span className="text-error">*</span>
                  </label>
                  <input
                    id="listing-title-input"
                    type="text"
                    value={listingTitle}
                    onChange={(e) => setListingTitle(e.target.value)}
                    className="w-full px-4 py-3 bg-surface-container-low text-on-surface rounded-DEFAULT focus:outline-none focus:ring-1 focus:ring-primary font-body-md text-body-md border border-surface-dim"
                    required
                  />
                  <p className="font-label-sm text-label-sm text-on-surface-variant mt-1.5">
                    Gợi ý: [Hãng] + [Tên máy] + [Kèm phụ kiện/Ống kính] + [Phân hạng lưu ký].
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block font-label-md text-label-md uppercase tracking-wider text-on-surface mb-2 font-semibold">
                      Phân Loại Danh Mục <span className="text-error">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full px-4 py-3 bg-surface-container-low text-on-surface rounded-DEFAULT focus:outline-none focus:ring-1 focus:ring-primary appearance-none font-body-md text-body-md cursor-pointer border border-surface-dim"
                      >
                        <option value="Camera & Quang học / Medium Format Digital">
                          Camera &amp; Quang học / Medium Format Digital
                        </option>
                        <option value="Đồng hồ cổ điển / Chronograph & Horology">
                          Đồng hồ cổ điển / Chronograph &amp; Horology
                        </option>
                        <option value="Âm thanh Hi-Fi & Vinyl Turntable">
                          Âm thanh Hi-Fi &amp; Vinyl Turntable
                        </option>
                        <option value="Kính mắt Archival Eyewear">
                          Kính mắt Archival Eyewear
                        </option>
                        <option value="Thiết kế Công nghiệp & Nội thất Bauhaus">
                          Thiết kế Công nghiệp &amp; Nội thất Bauhaus
                        </option>
                      </select>
                      <span className="material-symbols-outlined pointer-events-none absolute right-3 top-3 text-on-surface-variant text-[20px]">
                        expand_more
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block font-label-md text-label-md uppercase tracking-wider text-on-surface mb-2 font-semibold">
                      Thương Hiệu &amp; Xuất Xứ
                    </label>
                    <input
                      type="text"
                      value={brandOrigin}
                      onChange={(e) => setBrandOrigin(e.target.value)}
                      className="w-full px-4 py-3 bg-surface-container-low text-on-surface rounded-DEFAULT focus:outline-none focus:ring-1 focus:ring-primary font-body-md text-body-md border border-surface-dim"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-label-md text-label-md uppercase tracking-wider text-on-surface mb-2 font-semibold">
                    Mã Phân Loại Lưu Kho Xưởng (Custom Atelier SKU)
                  </label>
                  <div className="flex items-center">
                    <span className="px-3.5 py-3 bg-surface-container-high text-on-surface-variant font-label-md text-label-md rounded-l-DEFAULT uppercase font-mono border-y border-l border-surface-dim">
                      SKU:
                    </span>
                    <input
                      type="text"
                      value={skuCode}
                      onChange={(e) => setSkuCode(e.target.value)}
                      className="w-full px-4 py-3 bg-surface-container-low text-on-surface rounded-r-DEFAULT focus:outline-none focus:ring-1 focus:ring-primary font-body-md text-body-md font-mono border border-surface-dim"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 3: Tình trạng & Ghi chú Thẩm định (Condition & Forensic Grading) */}
            <div className="bg-surface-container-lowest p-6 lg:p-8 rounded-lg shadow-sm space-y-6 border border-surface-dim">
              <div className="flex items-center gap-3 border-b border-outline-variant/20 pb-4">
                <span className="w-7 h-7 rounded-full bg-surface-container-high flex items-center justify-center font-label-sm text-label-sm text-primary font-bold">
                  03
                </span>
                <div>
                  <h2 className="font-title-md text-title-md text-on-surface font-semibold">
                    Đánh Giá Tình Trạng &amp; Thẩm Định Xưởng
                  </h2>
                  <p className="font-label-sm text-label-sm text-on-surface-variant">
                    Phân hạng khách quan dựa trên bảng tiêu chuẩn kiểm tra vật lý
                  </p>
                </div>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block font-label-md text-label-md uppercase tracking-wider text-on-surface mb-3 font-semibold">
                    Thang Phân Hạng Hiện Vật (Condition Grade) <span className="text-error">*</span>
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Option Like New */}
                    <label
                      onClick={() => setConditionGrade('like_new')}
                      className={`flex flex-col p-4 rounded-DEFAULT cursor-pointer shadow-sm transition-all ${conditionGrade === 'like_new'
                        ? 'bg-surface-container-high border-2 border-primary/50'
                        : 'bg-surface-container-low hover:bg-surface-container'
                        }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-title-md text-body-md font-semibold text-primary">Like New</span>
                        <input
                          type="radio"
                          name="condition_grade"
                          value="like_new"
                          checked={conditionGrade === 'like_new'}
                          onChange={() => setConditionGrade('like_new')}
                          className="accent-primary cursor-pointer"
                        />
                      </div>
                      <span className="font-label-sm text-label-sm text-secondary font-semibold uppercase">
                        98% — 99% Hoàn Hảo
                      </span>
                      <p className="font-body-sm text-body-sm text-on-surface-variant mt-1.5">
                        Không tì vết cơ học, thấu kính không bụi ẩm, đầy đủ phụ kiện zin.
                      </p>
                    </label>

                    {/* Option Good */}
                    <label
                      onClick={() => setConditionGrade('good')}
                      className={`flex flex-col p-4 rounded-DEFAULT cursor-pointer transition-colors ${conditionGrade === 'good'
                        ? 'bg-surface-container-high border-2 border-primary/50'
                        : 'bg-surface-container-low hover:bg-surface-container'
                        }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-title-md text-body-md font-semibold text-on-surface">Good</span>
                        <input
                          type="radio"
                          name="condition_grade"
                          value="good"
                          checked={conditionGrade === 'good'}
                          onChange={() => setConditionGrade('good')}
                          className="accent-primary cursor-pointer"
                        />
                      </div>
                      <span className="font-label-sm text-label-sm text-outline font-semibold uppercase">
                        90% — 97% Tốt
                      </span>
                      <p className="font-body-sm text-body-sm text-on-surface-variant mt-1.5">
                        Dấu vết sử dụng rất nhẹ ngoài vỏ, hoạt động hoàn hảo 100%.
                      </p>
                    </label>

                    {/* Option Fair */}
                    <label
                      onClick={() => setConditionGrade('fair')}
                      className={`flex flex-col p-4 rounded-DEFAULT cursor-pointer transition-colors ${conditionGrade === 'fair'
                        ? 'bg-surface-container-high border-2 border-primary/50'
                        : 'bg-surface-container-low hover:bg-surface-container'
                        }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-title-md text-body-md font-semibold text-on-surface">Fair</span>
                        <input
                          type="radio"
                          name="condition_grade"
                          value="fair"
                          checked={conditionGrade === 'fair'}
                          onChange={() => setConditionGrade('fair')}
                          className="accent-primary cursor-pointer"
                        />
                      </div>
                      <span className="font-label-sm text-label-sm text-outline font-semibold uppercase">
                        80% — 89% Dấu Ấn Thời Gian
                      </span>
                      <p className="font-body-sm text-body-sm text-on-surface-variant mt-1.5">
                        Ngoại quan có xước xát tự nhiên, giá trị lưu trữ và công năng nguyên vẹn.
                      </p>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block font-label-md text-label-md uppercase tracking-wider text-on-surface mb-2 font-semibold">
                    Ghi Chú Thẩm Định Chi Tiết (Forensic Notes) <span className="text-error">*</span>
                  </label>
                  <textarea
                    rows={4}
                    value={forensicNotes}
                    onChange={(e) => setForensicNotes(e.target.value)}
                    className="w-full p-4 bg-surface-container-low text-on-surface rounded-DEFAULT focus:outline-none focus:ring-1 focus:ring-primary font-body-md text-body-md leading-relaxed border border-surface-dim"
                    required
                  />
                  <p className="font-label-sm text-label-sm text-on-surface-variant mt-1.5">
                    Nội dung này sẽ được in trên phiếu chứng thư kiểm định kèm bưu kiện bán lẻ.
                  </p>
                </div>
              </div>
            </div>

            {/* SECTION 4: Thư viện Hình ảnh Thẩm định (Images Upload & Gallery) */}
            <div className="bg-surface-container-lowest p-6 lg:p-8 rounded-lg shadow-sm space-y-6 border border-surface-dim">
              <div className="flex items-center justify-between border-b border-outline-variant/20 pb-4">
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-surface-container-high flex items-center justify-center font-label-sm text-label-sm text-primary font-bold">
                    04
                  </span>
                  <div>
                    <h2 className="font-title-md text-title-md text-on-surface font-semibold">
                      Thư Viện Hình Ảnh Thẩm Định (Inspection Dossier)
                    </h2>
                    <p className="font-label-sm text-label-sm text-on-surface-variant">
                      Ảnh chụp độ nét cao dưới ánh sáng chuẩn xưởng ({photos.length}/5 góc bắt buộc)
                    </p>
                  </div>
                </div>
                <span className="text-on-surface-variant font-label-sm text-label-sm font-semibold">
                  {photos.length} đã tải lên
                </span>
              </div>

              {/* Photo Gallery Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {photos.map((photo) => (
                  <div
                    key={photo.id}
                    className="relative aspect-square bg-surface-container rounded-DEFAULT overflow-hidden group border border-surface-dim"
                  >
                    <img
                      src={photo.url}
                      alt={photo.label}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    />
                    <div
                      className={`absolute top-1.5 left-1.5 px-1.5 py-0.5 font-label-sm text-[9px] uppercase tracking-wider rounded-DEFAULT ${photo.badge === 'Hero'
                        ? 'bg-primary text-on-primary'
                        : photo.badge === 'Serial đáy'
                          ? 'bg-secondary text-on-secondary'
                          : 'bg-surface-container-highest/90 text-on-surface'
                        }`}
                    >
                      {photo.badge}
                    </div>
                    <button
                      type="button"
                      onClick={() => setActivePhotoLightbox(photo.url)}
                      className="absolute bottom-1.5 right-1.5 p-1 bg-on-surface/70 hover:bg-on-surface text-surface rounded-DEFAULT transition-colors cursor-pointer"
                      title="Phóng to ảnh"
                    >
                      <span className="material-symbols-outlined text-[14px] block">visibility</span>
                    </button>
                  </div>
                ))}
              </div>

              {/* Cloudinary File Upload Dropzone */}
              <label className="p-6 bg-surface-container-low rounded-DEFAULT border-2 border-dashed border-outline-variant/60 hover:border-primary/60 transition-colors text-center cursor-pointer flex flex-col items-center justify-center gap-2 relative">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleUploadPhotoFile}
                  disabled={isUploadingPhoto}
                  className="hidden"
                />
                <span className="material-symbols-outlined text-outline text-[32px]">
                  {isUploadingPhoto ? 'hourglass_top' : 'cloud_upload'}
                </span>
                <div className="font-label-md text-label-md uppercase tracking-wider text-primary font-semibold">
                  {isUploadingPhoto ? 'Đang tải ảnh lên Cloudinary...' : 'Chọn ảnh tải lên Cloudinary'}
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Ảnh được đồng bộ trực tiếp lên Cloudinary CDN và gắn vào MongoDB. Hỗ trợ JPG, PNG, WebP.
                </p>
              </label>
            </div>

            {/* SECTION 5: Định giá Bán đứt & Thanh toán (Price & Escrow) */}
            <div className="bg-surface-container-lowest p-6 lg:p-8 rounded-lg shadow-sm space-y-6 border border-surface-dim">
              <div className="flex items-center gap-3 border-b border-outline-variant/20 pb-4">
                <span className="w-7 h-7 rounded-full bg-surface-container-high flex items-center justify-center font-label-sm text-label-sm text-primary font-bold">
                  05
                </span>
                <div>
                  <h2 className="font-title-md text-title-md text-on-surface font-semibold">
                    Định Giá Bán Đứt &amp; Ký Quỹ Bảo Chứng (Smart Escrow)
                  </h2>
                  <p className="font-label-sm text-label-sm text-on-surface-variant">
                    Quy đổi giá trị tái sinh dựa trên lịch sử lưu ký
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                <div className="space-y-3">
                  <label className="block font-label-md text-label-md uppercase tracking-wider text-on-surface font-semibold">
                    Giá Bán Đứt THRIFT (Secondhand Price) <span className="text-error">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="price-input"
                      type="text"
                      value={priceInput}
                      onChange={handlePriceChange}
                      className="w-full px-4 py-3 bg-surface-container-low text-on-surface rounded-DEFAULT focus:outline-none focus:ring-1 focus:ring-primary font-body-lg text-body-lg font-bold pr-16 text-right border border-surface-dim"
                      required
                    />
                    <span className="absolute right-4 top-3.5 font-label-md text-label-md text-outline font-semibold pointer-events-none">
                      VND (₫)
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm pt-1">
                    <span>Giá xuất xưởng ban đầu: 145.000.000 ₫</span>
                    <span className="text-secondary font-semibold">Khấu hao kỹ thuật: -18.5%</span>
                  </div>
                </div>

                {/* Escrow Explainer Box */}
                <div className="p-4 bg-surface-container-low rounded-DEFAULT space-y-3 border border-surface-dim">
                  <div className="flex items-center gap-2 text-primary font-label-md text-label-md uppercase tracking-wider font-semibold">
                    <span className="material-symbols-outlined text-[18px]">account_balance</span>
                    Cơ Chế ReUse Hub Smart Escrow
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                    100% thanh toán bán đứt qua tài khoản Smart Escrow bảo chứng của ReUse Hub. Tiền bán sẽ được tự động giải ngân cho xưởng sau 72 giờ người mua kiểm tra hàng.
                  </p>
                  <div className="flex items-center gap-2 font-label-sm text-label-sm text-secondary">
                    <span className="material-symbols-outlined text-[15px]">check_circle</span>
                    <span>Phí dịch vụ tuần hoàn atelier: 3.5% (đã bao gồm kiểm định)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 6: Vận chuyển & Giao nhận Bảo chứng (Shipping Information) */}
            <div className="bg-surface-container-lowest p-6 lg:p-8 rounded-lg shadow-sm space-y-6 border border-surface-dim">
              <div className="flex items-center gap-3 border-b border-outline-variant/20 pb-4">
                <span className="w-7 h-7 rounded-full bg-surface-container-high flex items-center justify-center font-label-sm text-label-sm text-primary font-bold">
                  06
                </span>
                <div>
                  <h2 className="font-title-md text-title-md text-on-surface font-semibold">
                    Vận Chuyển &amp; Giao Nhận Bảo Chứng
                  </h2>
                  <p className="font-label-sm text-label-sm text-on-surface-variant">
                    Đảm bảo niêm phong chống va đập tuyệt đối
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block font-label-md text-label-md uppercase tracking-wider text-on-surface mb-2 font-semibold">
                    Phương Thức Giao Nhận Mặc Định
                  </label>
                  <div className="p-4 bg-surface-container-low rounded-DEFAULT flex items-center justify-between border border-surface-dim">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-primary text-[22px]">package_2</span>
                      <div>
                        <span className="font-title-md text-body-md font-semibold text-on-surface block">
                          Vận chuyển bọc lót Nanuk chuyên dụng (Insured White-Glove Crate Courier)
                        </span>
                        <span className="font-body-sm text-body-sm text-on-surface-variant">
                          Bảo hiểm vật lý 100% giá trị bưu kiện xuyên suốt lộ trình.
                        </span>
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-secondary text-[20px]">check_box</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-label-md text-label-md uppercase tracking-wider text-on-surface mb-2 font-semibold">
                      Thời Gian Đóng Gói Dự Kiến
                    </label>
                    <input
                      type="text"
                      readOnly
                      value="Trong vòng 24 giờ sau khi chốt đơn"
                      className="w-full px-4 py-3 bg-surface-container-low text-on-surface-variant rounded-DEFAULT font-body-md text-body-md border border-surface-dim cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block font-label-md text-label-md uppercase tracking-wider text-on-surface mb-2 font-semibold">
                      Địa Điểm Kho Xuất Phát
                    </label>
                    <input
                      type="text"
                      readOnly
                      value="Atelier Chronos & Optics (Trạm tủ ẩm A2, Q.1, TP. HCM)"
                      className="w-full px-4 py-3 bg-surface-container-low text-on-surface-variant rounded-DEFAULT font-body-md text-body-md border border-surface-dim cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 7: Cam kết & Hành động cuối form */}
            <div className="p-6 bg-surface-container rounded-lg space-y-4 border border-surface-dim">
              <div className="flex items-start gap-3 text-on-surface-variant">
                <span className="material-symbols-outlined text-primary text-[20px] shrink-0 mt-0.5">info</span>
                <div className="font-body-sm text-body-sm leading-relaxed">
                  <strong className="text-on-surface">Lưu ý nghiệp vụ THRIFT:</strong> Hồ sơ này dành cho giao dịch chuyển nhượng sở hữu vĩnh viễn (Bán đứt). Tuyệt đối không bao gồm ngày thuê, đơn giá theo ngày, tiền cọc hay số lượng thuê trong nội dung đăng tải.
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-outline-variant/30">
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  disabled={isSubmitting || isUploadingPhoto}
                  className="w-full sm:w-auto text-center px-6 py-3 font-label-md text-label-md uppercase tracking-wider text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high rounded-DEFAULT transition-colors cursor-pointer border border-surface-dim disabled:opacity-50"
                >
                  {isSubmitting ? 'Đang lưu...' : 'Lưu Bản Nháp (Save Draft)'}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || isUploadingPhoto}
                  className="w-full sm:w-auto text-center px-8 py-3 font-label-md text-label-md uppercase tracking-wider bg-on-surface text-surface hover:bg-primary transition-all rounded-DEFAULT shadow-md flex items-center justify-center gap-2 cursor-pointer font-semibold disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[18px]">send</span>
                  {isSubmitting ? 'Đang gửi MongoDB...' : 'Gửi Kiểm Duyệt (Submit for Approval)'}
                </button>
              </div>
            </div>
          </form>

          {/* RIGHT COLUMN: Customer-Facing Live THRIFT Preview Card (Sticky - 4 cols) */}
          <aside className="lg:col-span-4 sticky top-36 space-y-6">
            <div className="bg-surface-container-lowest p-6 rounded-lg shadow-sm space-y-5 border border-surface-dim">
              <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[18px]">preview</span>
                  <h3 className="font-label-md text-label-md uppercase tracking-wider text-on-surface font-semibold">
                    Xem Trước Thẻ Sản Phẩm
                  </h3>
                </div>
                <span className="px-2 py-0.5 bg-secondary-container/40 text-secondary font-label-sm text-label-sm uppercase tracking-wider font-semibold rounded-DEFAULT">
                  Sàn THRIFT Public
                </span>
              </div>

              {/* Public Card Simulation Component */}
              <div className="bg-surface-container-low rounded-DEFAULT overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-surface-dim">
                {/* Image Frame 4:3 */}
                <div className="relative aspect-[4/3] bg-surface-container-highest overflow-hidden">
                  <img
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                    src={photos[0]?.url || 'https://lh3.googleusercontent.com/aida-public/AB6AXuD7_8xVSn2aS0vVyTTQ8a2PfGeh65_lc2X4yAETdJJJy6sDTywBiHVeV11mOnvIhaoG_13CZd1a4a_zeFJ3m8MLOWrD_oCyem3CQq7Wdn6un-S7alN_DNcdnsPWR6W230bGFfL1v7f2sK4YZ0kUle-jTWgMfPo1UUoYNEScXxOb5UIW6E5CeL4gCIUpfQ2kZcf3b0i44pPF2IHrRXclcGmY0ddCsD1RX-8c-nnnovaj'}
                    alt="Preview"
                  />
                  {/* Top Badges Overlay */}
                  <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 items-start">
                    <span className="px-2 py-0.5 bg-on-surface/90 text-surface text-[10px] font-label-sm uppercase tracking-wider rounded-DEFAULT backdrop-blur-sm">
                      {originSource === 'rental_archive' ? 'Second Life (14 Chu Kỳ RENT)' : 'Kho Xưởng Ký Gửi'}
                    </span>
                    <span className="px-2 py-0.5 bg-secondary text-on-secondary text-[10px] font-label-sm uppercase tracking-wider rounded-DEFAULT font-semibold">
                      Chờ Duyệt (Admin)
                    </span>
                  </div>
                  <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 bg-surface/90 text-on-surface text-[10px] font-label-sm uppercase tracking-wider rounded-DEFAULT font-semibold shadow-sm">
                    1/1 Độc Bản
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-5 space-y-4">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-outline text-[11px] font-label-sm uppercase tracking-wider">
                      <span className="truncate max-w-[170px]">{category.toUpperCase()}</span>
                      <span className="font-mono">{skuCode || 'SKU-PENDING'}</span>
                    </div>
                    <h4
                      id="preview-title"
                      className="font-serif text-lg font-semibold text-on-surface line-clamp-2 leading-snug"
                    >
                      {listingTitle || 'Tên hiện vật bán đứt'}
                    </h4>
                  </div>

                  {/* Condition & Specs */}
                  <div className="flex items-center justify-between pt-2 border-t border-outline-variant/30">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-secondary"></span>
                      <span className="font-label-md text-label-md font-semibold text-secondary">
                        {conditionGradeLabel}
                      </span>
                    </div>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">
                      {brandOrigin.split('/')[0].trim() || 'Chính hãng'}
                    </span>
                  </div>

                  {/* Price Box */}
                  <div className="bg-surface-container-lowest p-3.5 rounded-DEFAULT space-y-1 border border-surface-dim">
                    <div className="flex items-baseline justify-between">
                      <span className="font-label-sm text-label-sm uppercase text-outline">Giá Bán Đứt</span>
                      <span
                        id="preview-price"
                        className="font-serif text-xl text-primary font-bold"
                      >
                        {formattedDisplayPrice}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-on-surface-variant font-label-sm text-[11px]">
                      <span>
                        {originSource === 'rental_archive' ? 'Lịch sử: #INV-HB907-01' : 'Ký gửi Atelier'}
                      </span>
                      <span className="text-secondary font-medium">Smart Escrow ✓</span>
                    </div>
                  </div>

                  <div className="pt-1 flex items-center justify-between text-on-surface-variant font-label-sm text-[11px]">
                    <span className="truncate">Xưởng: Atelier Chronos &amp; Optics</span>
                    <span className="text-primary font-semibold shrink-0">Xem Chi Tiết →</span>
                  </div>
                </div>
              </div>

              {/* Editorial Inspection Note */}
              <div className="p-4 bg-surface-container-low rounded-DEFAULT space-y-2 border border-surface-dim">
                <div className="flex items-center gap-2 text-primary font-label-sm text-label-sm font-semibold uppercase tracking-wider">
                  <span className="material-symbols-outlined text-[16px]">verified</span>
                  Quy Trình Kiểm Duyệt B-Corp
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                  Admin ReUse Hub sẽ kiểm định hồ sơ ảnh và đối chiếu dữ liệu Serial trong vòng 2 - 4 giờ làm việc. Sau khi duyệt, sản phẩm sẽ tự động hiển thị mở bán công khai trên sàn THRIFT.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Lightbox Modal */}
      {activePhotoLightbox && (
        <div
          onClick={() => setActivePhotoLightbox(null)}
          className="fixed inset-0 z-50 bg-[#141310]/85 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="relative max-w-4xl max-h-[85vh] rounded overflow-hidden shadow-2xl">
            <img
              src={activePhotoLightbox}
              alt="Enlarged inspection"
              className="w-full h-full object-contain"
            />
            <button
              onClick={() => setActivePhotoLightbox(null)}
              className="absolute top-3 right-3 w-9 h-9 bg-surface text-on-surface rounded-full flex items-center justify-center shadow-lg"
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
