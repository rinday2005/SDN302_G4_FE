import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useShop } from '../../../context/ShopContext';
import { getUnitVariantAndCondition } from '../../../utils/inventoryUnitHelper';
import type {
  GalleryImage,
  ThriftConvertData,
} from '../../data/shop/thriftConvertData';
import {
  getInitialThriftDataForUnit,
  AVAILABLE_CONVERT_SPECIMENS,
} from '../../data/shop/thriftConvertData';
import {
  calculateThriftDiscount,
  parseVndPrice,
  formatVndPrice,
} from '../../../utils/thriftPricing';
import {
  convertRentalToThriftApi,
  createThriftListingApi,
  type ConvertRentalToThriftPayload,
} from '../../../services/thrift.api';

const ConvertToThriftForm: React.FC<{ targetId: string }> = ({ targetId }) => {
  const navigate = useNavigate();
  const { products } = useShop();

  // Tìm sản phẩm tương ứng từ MongoDB ShopContext
  const matchedProduct = useMemo(() => {
    if (!products || products.length === 0) return undefined;
    return (
      products.find((p) => {
        const cleanTarget = targetId.toLowerCase();
        const cleanSku = (p.sku || '').toLowerCase();
        return (
          cleanSku === cleanTarget ||
          cleanTarget.includes(cleanSku) ||
          (cleanSku.length >= 4 && cleanTarget.includes(cleanSku.slice(-4)))
        );
      }) || products[0]
    );
  }, [products, targetId]);

  const storageKey = `REUSE_HUB_THRIFT_CONVERT_${targetId}`;

  // State chính của form: Đọc từ localStorage theo targetId để F5 không bị reset (tự động loại bỏ dữ liệu camera cũ)
  const [formData, setFormData] = useState<ThriftConvertData>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        const titleLower = (parsed.title || '').toLowerCase();
        const catLower = (parsed.category || '').toLowerCase();
        const isOldCamera =
          titleLower.includes('hasselblad') ||
          titleLower.includes('leica') ||
          catLower.includes('camera') ||
          catLower.includes('máy ảnh');

        if (!isOldCamera && (parsed.unitId === targetId || parsed.sku === targetId)) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Lỗi khi đọc localStorage:', e);
    }
    // Nếu chưa có trong localStorage thì lấy data cấu hình chuẩn từ file data
    return getInitialThriftDataForUnit(targetId, matchedProduct);
  });

  // Tự động đồng bộ sản phẩm thực tế từ MongoDB khi matchedProduct tải xong hoặc khi formData còn lưu data camera cũ
  useEffect(() => {
    if (matchedProduct) {
      const titleLower = (formData.title || '').toLowerCase();
      const catLower = (formData.category || '').toLowerCase();
      const isOldCamera =
        titleLower.includes('hasselblad') ||
        titleLower.includes('leica') ||
        catLower.includes('camera') ||
        catLower.includes('máy ảnh');

      if (isOldCamera || !formData.title || formData.unitId !== targetId) {
        const fresh = getInitialThriftDataForUnit(targetId, matchedProduct);
        setFormData(fresh);
        try {
          localStorage.setItem(storageKey, JSON.stringify(fresh));
        } catch {
          // ignore
        }
      }
    }
  }, [matchedProduct, targetId, formData.title, formData.category, formData.unitId, storageKey]);

  // Danh sách hiện vật chuyển đổi đồng bộ từ dữ liệu thật
  const availableSpecimens = useMemo(() => {
    if (!products || products.length === 0) {
      return AVAILABLE_CONVERT_SPECIMENS;
    }
    const list: { id: string; name: string; price: string }[] = [];
    products.forEach((p) => {
      const skuLower = (p.sku || '').toLowerCase();
      const nameLower = (p.name || '').toLowerCase();
      if (
        skuLower.startsWith('mock-') ||
        nameLower.includes('hasselblad') ||
        nameLower.includes('leica') ||
        nameLower.includes('sony alpha') ||
        nameLower.includes('canon eos')
      ) {
        return;
      }
      const total = Number(p.totalUnits) || 1;
      for (let i = 1; i <= total; i++) {
        const id = `INV-${p.sku.slice(-4).toUpperCase()}-${String(i).padStart(2, '0')}`;
        const vInfo = getUnitVariantAndCondition(
          p.name,
          String(p.category || ''),
          i,
          total,
          p.rentingUnits || 0,
          p.maintenanceUnits || 0
        );
        const origPrice = p.replacementValue || (p.pricePerDay || 100000) * 30;
        const estPrice = Math.round((origPrice * (1 - vInfo.discountPercent / 100)) / 1000) * 1000;
        list.push({
          id,
          name: `${p.name} - ${vInfo.variantShort}`,
          price: `${new Intl.NumberFormat('vi-VN').format(estPrice)} ₫`,
        });
      }
    });
    return list.length > 0 ? list : AVAILABLE_CONVERT_SPECIMENS;
  }, [products]);

  // UI state
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [showAddImageModal, setShowAddImageModal] = useState(false);
  const [activeTimelineStep, setActiveTimelineStep] = useState<number>(6); // Mặc định bước 6 (THRIFT)

  // Lưu tự động vào localStorage mỗi khi formData thay đổi
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(formData));
    } catch (e) {
      console.error('Lỗi khi lưu localStorage:', e);
    }
  }, [formData, storageKey]);

  // Đồng bộ trạng thái duyệt / từ chối từ Admin
  useEffect(() => {
    let isMounted = true;
    const syncAdminStatus = () => {
      try {
        const raw = localStorage.getItem('REUSE_HUB_THRIFT_LISTINGS_V1');
        if (raw) {
          const list = JSON.parse(raw);
          if (Array.isArray(list)) {
            const matched = list.find(
              (it: any) =>
                it.originalUnitId === targetId ||
                it.unitId === targetId ||
                it.sku === formData.sku ||
                it.id === targetId ||
                it._id === targetId ||
                (targetId && it.originalUnitId && it.originalUnitId.toLowerCase().includes(targetId.toLowerCase()))
            );
            if (matched && isMounted) {
              const remoteStatus = String(matched.status || matched.approvalStatus || '').toUpperCase();
              if (remoteStatus === 'REJECTED') {
                setFormData((prev) => {
                  if (prev.status === 'REJECTED' && prev.rejectionReason === matched.rejectionReason) return prev;
                  const updated: ThriftConvertData = {
                    ...prev,
                    status: 'REJECTED',
                    rejectionReason:
                      matched.rejectionReason ||
                      'Ban kiểm duyệt Admin đã từ chối hồ sơ này. Vui lòng cập nhật lại thông tin/hình ảnh.',
                  };
                  try {
                    localStorage.setItem(storageKey, JSON.stringify(updated));
                  } catch {}
                  return updated;
                });
              } else if (remoteStatus === 'APPROVED') {
                setFormData((prev) => {
                  if (prev.status === 'CONVERTED_TO_THRIFT') return prev;
                  const updated: ThriftConvertData = { ...prev, status: 'CONVERTED_TO_THRIFT' };
                  try {
                    localStorage.setItem(storageKey, JSON.stringify(updated));
                  } catch {}
                  return updated;
                });
              }
            }
          }
        }
      } catch (err) {
        console.warn('Lỗi kiểm tra trạng thái Admin:', err);
      }
    };

    syncAdminStatus();
    window.addEventListener('storage', syncAdminStatus);
    return () => {
      isMounted = false;
      window.removeEventListener('storage', syncAdminStatus);
    };
  }, [targetId, formData.sku, storageKey]);

  // Kiểm tra điều kiện AC 1: Không cho convert nếu đang thuê hoặc có lịch đặt trước
  const isCurrentlyRenting = formData.currentRentStatus === 'RENTING';
  const hasFutureBooking = formData.hasFutureBooking;
  const isEligible = !isCurrentlyRenting && !hasFutureBooking;
  const isRejected = formData.status === 'REJECTED';
  const isAlreadyConverted =
    (formData.status === 'PENDING_APPROVAL' || formData.status === 'CONVERTED_TO_THRIFT') && !isRejected;

  // Handler cập nhật input
  const handleInputChange = <K extends keyof ThriftConvertData>(
    field: K,
    value: ThriftConvertData[K]
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Chọn ảnh Hero
  const handleSelectHero = (imageUrl: string) => {
    setFormData((prev) => ({
      ...prev,
      heroImage: imageUrl,
    }));
    showToast('Đã chọn ảnh đại diện (HERO) cho thẻ đăng THRIFT.');
  };

  // Thêm ảnh mới vào thư viện ảnh thực tế
  const handleAddImage = (url: string, label: string = 'INSPECT') => {
    if (!url.trim()) return;
    const newImg: GalleryImage = {
      id: `img-${formData.images.length + 1}-${encodeURIComponent(label.toLowerCase())}`,
      url: url.trim(),
      label,
    };
    setFormData((prev) => ({
      ...prev,
      images: [...prev.images, newImg],
      heroImage: prev.heroImage || url.trim(),
    }));
    setNewImageUrl('');
    setShowAddImageModal(false);
    showToast('Đã thêm ảnh thực tế thẩm định vào thư viện!');
  };

  // Xử lý upload file ảnh local (convert sang Base64 Data URL)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        handleAddImage(dataUrl, 'REAL PHOTO');
      }
      setIsUploadingImage(false);
    };
    reader.onerror = () => {
      alert('Không thể đọc file ảnh. Vui lòng thử lại!');
      setIsUploadingImage(false);
    };
    reader.readAsDataURL(file);
  };

  // Xử lý Submit chuyển giao THRIFT (AC 3)
  const handleConfirmSubmit = async () => {
    setIsConfirmModalOpen(false);
    setIsSubmitting(true);

    const now = new Date().toLocaleString('vi-VN');
    const numericPrice = parseVndPrice(formData.price) || Number(formData.price.replace(/[^\d]/g, '')) || 0;
    const galleryUrls = formData.images.map((img) => img.url);
    const allImages = formData.heroImage
      ? [formData.heroImage, ...galleryUrls.filter((u) => u !== formData.heroImage)]
      : galleryUrls;

    // Chuẩn hóa condition grade phù hợp backend
    let condGrade = 'GOOD';
    const cUpper = (formData.condition || '').toUpperCase();
    if (
      cUpper.includes('LIKE_NEW') ||
      cUpper.includes('99') ||
      cUpper.includes('MỚI') ||
      cUpper.includes('PRISTINE') ||
      cUpper.includes('MINT')
    ) {
      condGrade = 'LIKE_NEW';
    } else if (cUpper.includes('EXCELLENT') || cUpper.includes('95')) {
      condGrade = 'GOOD';
    } else if (cUpper.includes('FAIR') || cUpper.includes('80') || cUpper.includes('VINTAGE')) {
      condGrade = 'FAIR';
    }

    const payload: ConvertRentalToThriftPayload = {
      rentalProductId: matchedProduct?.sku || formData.sku || targetId,
      sellingPrice: numericPrice,
      price: numericPrice,
      name: formData.title,
      description: formData.description,
      condition: condGrade,
      images: allImages.length > 0 ? allImages : undefined,
      categoryId: matchedProduct?.categoryId,
      status: 'PENDING_APPROVAL',
    };

    let backendSuccess = false;
    let createdListingId = `thrift-${formData.unitId}-${Date.now()}`;

    try {
      const res = await convertRentalToThriftApi(payload);
      if (res && res._id) {
        backendSuccess = true;
        createdListingId = res._id;
      }
    } catch (err: unknown) {
      console.warn('API convert-from-rental trả về lỗi hoặc chạy fallback:', err);
      // Fallback qua createThriftListingApi nếu sản phẩm không match rentalProductId trên backend
      try {
        const fallbackRes = await createThriftListingApi({
          name: formData.title,
          description: formData.description,
          price: numericPrice,
          condition: condGrade,
          images: allImages,
          categoryId: matchedProduct?.categoryId,
          status: 'PENDING_APPROVAL',
          sourceType: 'FROM_RENTAL',
        });
        if (fallbackRes && fallbackRes._id) {
          backendSuccess = true;
          createdListingId = fallbackRes._id;
        }
      } catch (fbErr) {
        console.warn('Fallback createThriftListingApi cũng thất bại:', fbErr);
      }
    }

    const updatedData: ThriftConvertData = {
      ...formData,
      status: 'PENDING_APPROVAL',
      rejectionReason: undefined,
      convertedAt: now,
    };

    setFormData(updatedData);
    setIsSubmitting(false);

    // Cập nhật cả 2 key localStorage để đồng bộ tức thì cho cả sàn THRIFT và Admin Approval
    try {
      const thriftStoreKey = 'REUSE_HUB_THRIFT_LISTINGS_V1';
      const existingThriftList = JSON.parse(localStorage.getItem(thriftStoreKey) || '[]');
      const newThriftEntry = {
        id: createdListingId,
        _id: createdListingId,
        originalUnitId: formData.unitId,
        sku: formData.sku,
        name: formData.title,
        title: formData.title,
        category: formData.category,
        categoryId: matchedProduct?.categoryId,
        condition: formData.condition,
        price: numericPrice,
        priceDisplay: formData.price,
        description: formData.description,
        image: formData.heroImage,
        images: allImages,
        gallery: formData.images,
        status: 'PENDING_APPROVAL',
        approvalStatus: 'PENDING',
        source: 'RENTAL_PRODUCT',
        sourceType: 'RENTAL_PRODUCT',
        sourceTag: formData.sourceTag,
        submittedAt: now,
        createdAt: new Date().toISOString(),
      };
      // Tránh trùng lặp
      const filteredOld = existingThriftList.filter(
        (item: { originalUnitId?: string; id?: string }) =>
          item.originalUnitId !== formData.unitId && item.id !== createdListingId
      );
      localStorage.setItem(thriftStoreKey, JSON.stringify([newThriftEntry, ...filteredOld]));

      // Đánh dấu sản phẩm RENT đã convert để ẩn khỏi sàn RENT
      const rentStoreKey = 'REUSE_HUB_RENT_PRODUCTS_STORE_V1';
      const existingRentProducts = JSON.parse(localStorage.getItem(rentStoreKey) || '[]');
      const updatedRentProducts = existingRentProducts.map(
        (p: { sku?: string; [key: string]: unknown }) => {
          if (p.sku === formData.sku || p.sku === matchedProduct?.sku) {
            return {
              ...p,
              isVisible: false, // Ẩn khỏi RENT Marketplace theo AC 2
              convertedToThrift: true,
              thriftListingId: createdListingId,
            };
          }
          return p;
        }
      );
      localStorage.setItem(rentStoreKey, JSON.stringify(updatedRentProducts));
    } catch (err) {
      console.error('Lỗi khi ghi danh sách THRIFT / RENT:', err);
    }

    showToast(
      backendSuccess
        ? 'ĐÃ TẠO MỤC ĐĂNG THRIFT THÀNH CÔNG VÀO DATABASE MONGODB! Đã gửi Admin duyệt (PENDING_APPROVAL).'
        : 'ĐÃ TẠO MỤC ĐĂNG THRIFT! Trạng thái: Chờ duyệt (PENDING_APPROVAL).'
    );
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // Reset demo data của hiện vật hiện tại về mặc định ban đầu
  const handleResetDemo = () => {
    if (window.confirm(`Bạn có chắc muốn đặt lại dữ liệu form của hiện vật ${formData.unitId} về mặc định ban đầu?`)) {
      localStorage.removeItem(storageKey);
      setFormData(getInitialThriftDataForUnit(targetId, matchedProduct));
      showToast('Đã đặt lại dữ liệu form về trạng thái ban đầu.');
    }
  };

  // Chuyển đổi sang hiện vật khác
  const handleSelectSpecimen = (selectedId: string) => {
    navigate(`/shop/rent/convert-thrift/${selectedId}`);
  };

  return (
    <div className="w-full flex flex-col font-body-md text-on-surface bg-background antialiased min-h-screen">
      {/* Toast Notification Container */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-[#141310] text-[#fdf9f2] px-5 py-3.5 rounded-lg shadow-xl flex items-center gap-3 border border-secondary/40 animate-fade-in">
          <span className="material-symbols-outlined text-secondary text-[22px]">check_circle</span>
          <span className="font-label-md text-xs">{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="ml-2 text-on-surface-variant hover:text-white"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      )}

      {/* Main Inner Container */}
      <div className="max-w-[1536px] mx-auto px-4 lg:px-8 py-6 w-full flex flex-col">
        {/* Breadcrumb & Specimen Quick Switcher */}
        <div className="flex flex-col gap-space-xs mb-space-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-space-xs font-label-sm text-label-sm uppercase tracking-widest text-on-surface-variant flex-wrap">
              <Link to="/shop/dashboard" className="hover:text-primary transition-colors">
                BẢNG ĐIỀU KHIỂN XƯỞNG
              </Link>
              <span>/</span>
              <Link to="/shop/rent/inventory" className="hover:text-primary transition-colors">
                KHO HIỆN VẬT
              </Link>
              <span>/</span>
              <span className="text-primary font-semibold font-mono">#{formData.unitId}</span>
              <span>/</span>
              <span className="text-on-surface font-bold">CHUYỂN GIAO SANG THRIFT</span>
            </div>

            {/* Bộ chọn hiện vật thực tế: Bấm hiện vật nào chuyển ngay sang hiện vật đó */}
            <div className="flex items-center gap-2 bg-surface-container-low px-3 py-1.5 rounded-lg border border-outline-variant/60 shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant flex items-center gap-1">
                <span className="material-symbols-outlined text-[15px] text-primary">inventory_2</span>
                Đổi hiện vật:
              </span>
              <select
                value={formData.unitId}
                onChange={(e) => handleSelectSpecimen(e.target.value)}
                className="bg-surface text-xs font-semibold text-on-surface px-2.5 py-1 rounded border border-outline-variant focus:outline-none cursor-pointer"
              >
                {availableSpecimens.map((spec) => (
                  <option key={spec.id} value={spec.id}>
                    #{spec.id} — {spec.name.slice(0, 30)}... ({spec.price})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Top Banner Card */}
          <div className="relative overflow-hidden bg-surface-container p-space-lg rounded-xl shadow-sm mt-space-xs border border-outline-variant/50">
            <div className="absolute -right-12 -top-12 w-64 h-64 rounded-full bg-secondary-fixed/30 blur-2xl pointer-events-none"></div>
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-space-md">
              <div className="max-w-3xl">
                <div className="inline-flex items-center gap-1.5 px-space-sm py-0.5 rounded-full bg-secondary/10 text-secondary font-label-sm text-label-sm uppercase tracking-wider mb-space-xs font-semibold">
                  <span className="material-symbols-outlined text-[14px]">sync_alt</span>
                  <span>CIRCULAR TRANSMUTATION PROTOCOL</span>
                </div>
                <h1 className="font-headline-md text-headline-md text-on-surface font-serif mb-space-xs">
                  Chuyển Giao Hiện Vật Tuần Hoàn
                </h1>
                <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                  Kích hoạt chuyển giao vĩnh viễn hiện vật từ chu kỳ cho thuê sang danh mục sưu tập bán đứt THRIFT. Hiện vật hoàn tất trọn vẹn sứ mệnh cho thuê và chính thức bước vào vòng đời sở hữu thứ hai.
                </p>
              </div>

              {/* Status Indicator & Simulator */}
              <div className="flex flex-col items-start md:items-end justify-center shrink-0 bg-surface/90 backdrop-blur px-space-md py-space-sm rounded-lg shadow-sm border border-outline-variant/60">
                <span className="font-label-sm text-label-sm uppercase tracking-widest text-on-surface-variant">
                  Trạng thái hiện vật
                </span>
                <span
                  className={`font-headline-sm text-headline-sm font-bold font-serif ${
                    isRejected
                      ? 'text-red-600'
                      : isAlreadyConverted
                      ? 'text-primary'
                      : !isEligible
                      ? 'text-error'
                      : 'text-secondary'
                  }`}
                >
                  {isRejected
                    ? 'BỊ TỪ CHỐI (CHO PHÉP CHUYỂN LẠI)'
                    : isAlreadyConverted
                    ? 'PENDING APPROVAL'
                    : !isEligible
                    ? 'KHÓA: KHÔNG ĐỦ ĐIỀU KIỆN'
                    : 'READY TO THRIFT'}
                </span>
                <span className="font-label-sm text-label-sm text-on-surface-variant">
                  Khấu hao: 86.5% • {formData.cycleCount} Chu kỳ luân chuyển
                </span>

                {/* Interactive Simulator for AC 1 Testing */}
                <div className="mt-2 pt-2 border-t border-outline-variant/50 flex flex-col items-start md:items-end gap-1">
                  <span className="text-[10px] uppercase font-bold text-on-surface-variant tracking-wider">
                    Mô phỏng điều kiện (AC 1):
                  </span>
                  <select
                    className="text-xs bg-surface px-2 py-1 rounded border border-outline-variant text-on-surface font-medium focus:outline-none cursor-pointer"
                    value={
                      isRejected
                        ? 'REJECTED'
                        : formData.status === 'PENDING_APPROVAL'
                        ? 'CONVERTED'
                        : isCurrentlyRenting
                        ? 'RENTING'
                        : hasFutureBooking
                        ? 'FUTURE_BOOKING'
                        : 'ELIGIBLE'
                    }
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === 'ELIGIBLE') {
                        setFormData((prev) => ({
                          ...prev,
                          currentRentStatus: 'COMPLETED',
                          hasFutureBooking: false,
                          status: 'ELIGIBLE',
                        }));
                      } else if (val === 'RENTING') {
                        setFormData((prev) => ({
                          ...prev,
                          currentRentStatus: 'RENTING',
                          hasFutureBooking: false,
                          status: 'ELIGIBLE',
                        }));
                      } else if (val === 'FUTURE_BOOKING') {
                        setFormData((prev) => ({
                          ...prev,
                          currentRentStatus: 'COMPLETED',
                          hasFutureBooking: true,
                          status: 'ELIGIBLE',
                        }));
                      } else if (val === 'CONVERTED') {
                        setFormData((prev) => ({
                          ...prev,
                          currentRentStatus: 'COMPLETED',
                          hasFutureBooking: false,
                          status: 'PENDING_APPROVAL',
                        }));
                      } else if (val === 'REJECTED') {
                        setFormData((prev) => ({
                          ...prev,
                          currentRentStatus: 'COMPLETED',
                          hasFutureBooking: false,
                          status: 'REJECTED',
                          rejectionReason: 'Hình ảnh thực tế chưa rõ góc cạnh sản phẩm. Vui lòng bổ sung ảnh chi tiết.',
                        }));
                      }
                    }}
                  >
                    <option value="ELIGIBLE">✓ 1. ĐỦ ĐIỀU KIỆN (0 lịch đặt, đã trả kho)</option>
                    <option value="RENTING">✕ 2. ĐANG CHO THUÊ (status = 'RENTING')</option>
                    <option value="FUTURE_BOOKING">✕ 3. CÓ LỊCH THUÊ (has_future_booking: true)</option>
                    <option value="CONVERTED">✓ 4. ĐÃ GỬI DUYỆT (PENDING_APPROVAL)</option>
                    <option value="REJECTED">⚠ 5. BỊ TỪ CHỐI (REJECTED - Cho phép nộp lại)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* REJECTED BY ADMIN BANNER */}
        {isRejected && (
          <div className="mb-space-lg p-space-md bg-red-500/10 border-2 border-red-500/40 rounded-xl flex items-start gap-3.5 text-on-surface animate-fade-in shadow-sm">
            <div className="w-10 h-10 rounded-lg bg-red-600 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
              <span className="material-symbols-outlined text-[24px]">cancel</span>
            </div>
            <div className="flex-1 flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs uppercase tracking-wider text-red-700 bg-red-100 px-2 py-0.5 rounded">
                  HỒ SƠ BỊ TỪ CHỐI DUYỆT BỞI ADMIN
                </span>
                <span className="text-[11px] text-on-surface-variant font-mono">
                  Mã: #{formData.unitId}
                </span>
              </div>
              <p className="text-xs text-on-surface mt-1.5 leading-relaxed font-medium">
                <strong>Lý do từ chối:</strong> {formData.rejectionReason || 'Hồ sơ thẩm định chưa đạt tiêu chuẩn hình ảnh hoặc giá trị thẩm định chưa phù hợp.'}
              </p>
              <p className="text-[11px] text-on-surface-variant mt-1">
                👉 Quý xưởng vui lòng kiểm tra lại hình ảnh thực tế, mô tả chi tiết và điều chỉnh giá bán bên dưới, sau đó bấm <strong>"CHUYỂN SANG THRIFT (GỬI DUYỆT LẠI)"</strong> để gửi hồ sơ xét duyệt lại.
              </p>
            </div>
          </div>
        )}

        {/* INELIGIBILITY WARNING BANNER (AC 1) */}
        {!isEligible && (
          <div className="mb-space-lg p-space-md bg-error-container/30 border border-error/30 rounded-xl flex items-start gap-3 text-on-error-container">
            <span className="material-symbols-outlined text-error text-[24px] shrink-0 mt-0.5">
              block
            </span>
            <div className="flex flex-col">
              <span className="font-bold text-xs uppercase tracking-wider text-error">
                CẢNH BÁO AC 1: KHÓA CHỨC NĂNG CHUYỂN GIAO THRIFT
              </span>
              <p className="text-xs text-on-surface-variant leading-relaxed mt-1">
                {isCurrentlyRenting
                  ? `Hiện vật đang trong thời gian cho thuê (status === 'RENTING') thuộc đơn hàng ${formData.recentOrderCode || '#RH-RNT-2024-8845'}. Nút chuyển đổi đã bị vô hiệu hóa để bảo đảm nghĩa vụ hợp đồng.`
                  : `Hiện vật đang có lịch đặt thuê trước trong tương lai (has_future_booking: true). Quý xưởng cần hoàn tất hoặc hủy lịch đặt trước trước khi thanh lý sang THRIFT.`}
              </p>
            </div>
          </div>
        )}

        {/* ALREADY CONVERTED NOTIFICATION (AC 3) */}
        {isAlreadyConverted && (
          <div className="mb-space-lg p-space-md bg-secondary-container/50 border border-secondary/30 rounded-xl flex items-center justify-between gap-4 text-on-secondary-fixed flex-wrap">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-secondary text-[24px]">
                verified
              </span>
              <div>
                <span className="font-bold text-xs uppercase tracking-wider block">
                  ĐÃ TẠO MỤC ĐĂNG THRIFT THÀNH CÔNG • TRẠNG THÁI: PENDING_APPROVAL
                </span>
                <span className="text-xs text-on-surface-variant">
                  Hiện vật đã được đóng băng và rút vĩnh viễn khỏi kho RENT. Ban kiểm duyệt ReUse Hub sẽ phê duyệt trong vòng 24h.
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link
                to="/shop/thrift/listings"
                className="text-xs px-3.5 py-1.5 bg-[#141310] text-white rounded font-semibold hover:bg-[#292724] transition-colors flex items-center gap-1 shadow-xs"
              >
                <span>Xem trong Mục Đăng THRIFT</span>
                <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              </Link>
              <button
                onClick={handleResetDemo}
                className="text-xs px-3 py-1.5 bg-surface text-on-surface rounded border border-outline-variant hover:bg-surface-container font-semibold transition-colors"
              >
                ↺ Đặt lại thử nghiệm
              </button>
            </div>
          </div>
        )}

        {/* SECTION 1: VISUAL CIRCULAR FLOW SECTION */}
        <section className="bg-surface-container-low p-space-lg rounded-xl mb-space-lg shadow-sm border border-outline-variant/40">
          <div className="flex items-center justify-between mb-space-md flex-wrap gap-2">
            <div>
              <span className="font-label-sm text-label-sm uppercase tracking-widest text-secondary font-semibold">
                SƠ ĐỒ CHU KỲ LUÂN CHUYỂN TUẦN HOÀN
              </span>
              <h2 className="font-title-md text-title-md text-on-surface font-serif">
                Vòng đời thứ hai cho hiện vật (A Second Life for Precision Artifacts)
              </h2>
            </div>
            <div className="hidden sm:inline-flex items-center gap-1 px-space-sm py-1 bg-surface-container-high rounded text-on-surface-variant font-label-sm text-label-sm">
              <span className="material-symbols-outlined text-[16px] text-secondary">verified</span>
              <span>{formData.cycleCount}/{formData.cycleCount} Chu kỳ tối ưu hoàn tất</span>
            </div>
          </div>

          {/* Responsive Node Timeline (Bấm node nào xem node đó) */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-space-sm relative">
            {/* Node 1: RENT */}
            <div
              onClick={() => setActiveTimelineStep(1)}
              className={`flex flex-col p-space-sm rounded-lg relative border cursor-pointer transition-all ${activeTimelineStep === 1
                  ? 'bg-primary text-on-primary border-primary shadow'
                  : 'bg-surface border-outline-variant/30 hover:border-outline-variant'
                }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center font-label-sm text-label-sm font-semibold ${activeTimelineStep === 1
                      ? 'bg-on-primary/20 text-on-primary'
                      : 'bg-surface-variant text-on-surface-variant'
                    }`}
                >
                  01
                </span>
                <span className={`material-symbols-outlined text-[18px] ${activeTimelineStep === 1 ? 'text-on-primary' : 'text-secondary'}`}>
                  check_circle
                </span>
              </div>
              <span className="font-title-md text-title-md text-xs font-semibold mb-0.5">
                RENT
              </span>
              <span className={`font-label-sm text-label-sm ${activeTimelineStep === 1 ? 'opacity-90' : 'text-on-surface-variant'}`}>
                Khởi tạo cho thuê ban đầu
              </span>
            </div>

            {/* Node 2: USE */}
            <div
              onClick={() => setActiveTimelineStep(2)}
              className={`flex flex-col p-space-sm rounded-lg relative border cursor-pointer transition-all ${activeTimelineStep === 2
                  ? 'bg-primary text-on-primary border-primary shadow'
                  : 'bg-surface border-outline-variant/30 hover:border-outline-variant'
                }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center font-label-sm text-label-sm font-semibold ${activeTimelineStep === 2
                      ? 'bg-on-primary/20 text-on-primary'
                      : 'bg-surface-variant text-on-surface-variant'
                    }`}
                >
                  02
                </span>
                <span className={`material-symbols-outlined text-[18px] ${activeTimelineStep === 2 ? 'text-on-primary' : 'text-secondary'}`}>
                  check_circle
                </span>
              </div>
              <span className="font-title-md text-title-md text-xs font-semibold mb-0.5">
                USE
              </span>
              <span className={`font-label-sm text-label-sm ${activeTimelineStep === 2 ? 'opacity-90' : 'text-on-surface-variant'}`}>
                Khách hàng trải nghiệm an toàn
              </span>
            </div>

            {/* Node 3: RETURN */}
            <div
              onClick={() => setActiveTimelineStep(3)}
              className={`flex flex-col p-space-sm rounded-lg relative border cursor-pointer transition-all ${activeTimelineStep === 3
                  ? 'bg-primary text-on-primary border-primary shadow'
                  : 'bg-surface border-outline-variant/30 hover:border-outline-variant'
                }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center font-label-sm text-label-sm font-semibold ${activeTimelineStep === 3
                      ? 'bg-on-primary/20 text-on-primary'
                      : 'bg-surface-variant text-on-surface-variant'
                    }`}
                >
                  03
                </span>
                <span
                  className={`material-symbols-outlined text-[18px] ${isCurrentlyRenting ? 'text-amber-500' : activeTimelineStep === 3 ? 'text-on-primary' : 'text-secondary'
                    }`}
                >
                  {isCurrentlyRenting ? 'pending' : 'check_circle'}
                </span>
              </div>
              <span className="font-title-md text-title-md text-xs font-semibold mb-0.5">
                RETURN
              </span>
              <span className={`font-label-sm text-label-sm ${activeTimelineStep === 3 ? 'opacity-90' : 'text-on-surface-variant'}`}>
                {isCurrentlyRenting ? 'Đang trong tay khách thuê' : 'Thu hồi về xưởng nguyên vẹn'}
              </span>
            </div>

            {/* Node 4: INSPECT */}
            <div
              onClick={() => setActiveTimelineStep(4)}
              className={`flex flex-col p-space-sm rounded-lg relative border cursor-pointer transition-all ${activeTimelineStep === 4
                  ? 'bg-primary text-on-primary border-primary shadow'
                  : 'bg-surface border-outline-variant/30 hover:border-outline-variant'
                }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center font-label-sm text-label-sm font-semibold ${activeTimelineStep === 4
                      ? 'bg-on-primary/20 text-on-primary'
                      : 'bg-surface-variant text-on-surface-variant'
                    }`}
                >
                  04
                </span>
                <span className={`material-symbols-outlined text-[18px] ${activeTimelineStep === 4 ? 'text-on-primary' : 'text-secondary'}`}>
                  check_circle
                </span>
              </div>
              <span className="font-title-md text-title-md text-xs font-semibold mb-0.5">
                INSPECT
              </span>
              <span className={`font-label-sm text-label-sm ${activeTimelineStep === 4 ? 'opacity-90' : 'text-on-surface-variant'}`}>
                Kiểm định chất lượng &amp; form dáng
              </span>
            </div>

            {/* Node 5: REUSE */}
            <div
              onClick={() => setActiveTimelineStep(5)}
              className={`flex flex-col p-space-sm rounded-lg relative border cursor-pointer transition-all ${activeTimelineStep === 5
                  ? 'bg-primary text-on-primary border-primary shadow'
                  : 'bg-surface border-outline-variant/30 hover:border-outline-variant'
                }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center font-label-sm text-label-sm font-semibold ${activeTimelineStep === 5
                      ? 'bg-on-primary/20 text-on-primary'
                      : 'bg-surface-variant text-on-surface-variant'
                    }`}
                >
                  05
                </span>
                <span className={`material-symbols-outlined text-[18px] ${activeTimelineStep === 5 ? 'text-on-primary' : 'text-secondary'}`}>
                  check_circle
                </span>
              </div>
              <span className="font-title-md text-title-md text-xs font-semibold mb-0.5">
                REUSE
              </span>
              <span className={`font-label-sm text-label-sm ${activeTimelineStep === 5 ? 'opacity-90' : 'text-on-surface-variant'}`}>
                {formData.cycleCount} lượt luân chuyển B-Corp
              </span>
            </div>

            {/* Node 6: THRIFT (ACTIVE / CONVERTED) */}
            <div
              onClick={() => setActiveTimelineStep(6)}
              className={`flex flex-col p-space-sm rounded-lg relative shadow-md transition-all cursor-pointer ${isAlreadyConverted
                  ? 'bg-secondary text-on-secondary ring-2 ring-secondary'
                  : !isEligible
                    ? 'bg-surface-variant text-on-surface-variant opacity-80'
                    : 'bg-primary text-on-primary ring-2 ring-primary'
                }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center font-label-sm text-label-sm font-bold ${isAlreadyConverted
                      ? 'bg-white/20 text-white'
                      : !isEligible
                        ? 'bg-outline-variant text-on-surface'
                        : 'bg-on-primary/20 text-on-primary'
                    }`}
                >
                  06
                </span>
                <span className="material-symbols-outlined text-[18px]">
                  {isAlreadyConverted
                    ? 'task_alt'
                    : !isEligible
                      ? 'lock'
                      : 'radio_button_checked'}
                </span>
              </div>
              <div className="flex items-center gap-1 mb-0.5">
                <span className="font-title-md text-title-md text-xs font-bold">THRIFT</span>
                <span
                  className={`text-[9px] px-1 py-0.2 font-bold rounded ${isAlreadyConverted
                      ? 'bg-white text-secondary'
                      : !isEligible
                        ? 'bg-error text-white'
                        : 'bg-secondary-fixed text-on-secondary-fixed'
                    }`}
                >
                  {isAlreadyConverted
                    ? 'ĐÃ GỬI DUYỆT'
                    : !isEligible
                      ? 'KHÓA'
                      : 'ĐANG KÍCH HOẠT'}
                </span>
              </div>
              <span className="font-label-sm text-label-sm opacity-90">
                {isAlreadyConverted ? 'Chờ kiểm duyệt B-Corp' : 'Bán đứt sở hữu vĩnh viễn'}
              </span>
            </div>
          </div>
        </section>

        {/* SECTION 2 & 3: GRID (ELIGIBILITY CHECKLIST & IMMUTABLE PROVENANCE) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg mb-space-lg">
          {/* SECTION 2: B-CORP ELIGIBILITY CHECKLIST (5 Cols) */}
          <div className="lg:col-span-5 bg-surface-container-low p-space-lg rounded-xl shadow-sm border border-outline-variant/40 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-space-sm">
                <span className="font-label-sm text-label-sm uppercase tracking-widest text-secondary font-semibold">
                  B-CORP CIRCULAR AUDIT
                </span>
                <span
                  className={`inline-flex items-center gap-1 font-label-sm text-label-sm px-space-xs py-0.5 rounded font-bold ${isEligible
                      ? 'bg-secondary/15 text-secondary'
                      : 'bg-error/15 text-error'
                    }`}
                >
                  {isEligible ? '100% ĐẠT TIÊU CHUẨN' : 'CHƯA ĐẠT TIÊU CHUẨN'}
                </span>
              </div>
              <h3 className="font-headline-sm text-headline-sm text-on-surface font-serif mb-space-md">
                Bảng Kiểm Định Đạt Chuẩn Tuần Hoàn
              </h3>

              <div className="flex flex-col gap-space-sm">
                {/* Check 1 */}
                <div
                  className={`flex items-start gap-space-sm p-space-sm rounded-lg border ${isCurrentlyRenting
                      ? 'bg-error-container/20 border-error/30'
                      : 'bg-surface border-outline-variant/20'
                    }`}
                >
                  <span
                    className={`material-symbols-outlined text-[20px] shrink-0 mt-0.5 ${isCurrentlyRenting ? 'text-error' : 'text-secondary'
                      }`}
                  >
                    {isCurrentlyRenting ? 'error' : 'task_alt'}
                  </span>
                  <div className="flex flex-col">
                    <span className="font-title-md text-title-md text-xs font-semibold text-on-surface">
                      Rental Completed (Tất toán trọn vẹn)
                    </span>
                    <p className="font-label-sm text-label-sm text-on-surface-variant leading-snug">
                      {isCurrentlyRenting
                        ? `ĐANG CHO THUÊ: Đơn hàng ${formData.recentOrderCode || '#RH-RNT-2024-8845'} (${formData.recentCustomer || 'Khách thuê'}) đang trong thời gian mượn máy, chưa hồi kho.`
                        : `Đơn thuê gần nhất ${formData.recentOrderCode || '#RH-RNT-2024-8845'} (${formData.recentCustomer || 'Khách thuê'}) đã tất toán và giải ngân Escrow 100%.`}
                    </p>
                  </div>
                </div>

                {/* Check 2 */}
                <div className="flex items-start gap-space-sm p-space-sm bg-surface rounded-lg border border-outline-variant/20">
                  <span className="material-symbols-outlined text-secondary text-[20px] shrink-0 mt-0.5">
                    task_alt
                  </span>
                  <div className="flex flex-col">
                    <span className="font-title-md text-title-md text-xs font-semibold text-on-surface">
                      Return Received (Đã nhập kho xưởng)
                    </span>
                    <p className="font-label-sm text-label-sm text-on-surface-variant leading-snug">
                      Hiện vật đã được bàn giao về kho xưởng ReUse Hub an toàn.
                    </p>
                  </div>
                </div>

                {/* Check 3 */}
                <div className="flex items-start gap-space-sm p-space-sm bg-surface rounded-lg border border-outline-variant/20">
                  <span className="material-symbols-outlined text-secondary text-[20px] shrink-0 mt-0.5">
                    task_alt
                  </span>
                  <div className="flex flex-col">
                    <span className="font-title-md text-title-md text-xs font-semibold text-on-surface">
                      Inspection Completed (Kiểm định chất lượng)
                    </span>
                    <p className="font-label-sm text-label-sm text-on-surface-variant leading-snug">
                      Biên bản kiểm định đạt {formData.condition}, chất liệu và phụ kiện đạt quy chuẩn mở bán THRIFT.
                    </p>
                  </div>
                </div>

                {/* Check 4 */}
                <div
                  className={`flex items-start gap-space-sm p-space-sm rounded-lg border ${hasFutureBooking
                      ? 'bg-error-container/20 border-error/30'
                      : 'bg-surface border-outline-variant/20'
                    }`}
                >
                  <span
                    className={`material-symbols-outlined text-[20px] shrink-0 mt-0.5 ${hasFutureBooking ? 'text-error' : 'text-secondary'
                      }`}
                  >
                    {hasFutureBooking ? 'error' : 'task_alt'}
                  </span>
                  <div className="flex flex-col">
                    <span className="font-title-md text-title-md text-xs font-semibold text-on-surface">
                      No Future Reservation (Không giữ cọc)
                    </span>
                    <p className="font-label-sm text-label-sm text-on-surface-variant leading-snug">
                      {hasFutureBooking
                        ? 'CÓ LỊCH ĐẶT TRƯỚC: Phát hiện 01 lịch đặt trước trong tương lai (24/11 — 28/11/2026). Không thể thanh lý!'
                        : '0 lịch đặt trước trong tương lai, không có tranh chấp khiếu nại hoặc phong tỏa custody.'}
                    </p>
                  </div>
                </div>

                {/* Check 5 */}
                <div className="flex items-start gap-space-sm p-space-sm bg-surface rounded-lg border border-outline-variant/20">
                  <span className="material-symbols-outlined text-secondary text-[20px] shrink-0 mt-0.5">
                    task_alt
                  </span>
                  <div className="flex flex-col">
                    <span className="font-title-md text-title-md text-xs font-semibold text-on-surface">
                      Eligible for Secondhand Sale (Đủ điều kiện Bán lẻ)
                    </span>
                    <p className="font-label-sm text-label-sm text-on-surface-variant leading-snug">
                      Đã vượt mốc 10 chu kỳ luân chuyển tối thiểu, đáp ứng tiêu chuẩn Second Life của ReUse Hub.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-space-md pt-space-sm flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm border-t border-outline-variant/30">
              <span>Thẩm định viên: {formData.inspectorName || 'Phạm Thùy Dương (#01)'}</span>
              <span>Mã chứng thực: {formData.certificateCode || '#CERT-9942-VN'}</span>
            </div>
          </div>

          {/* SECTION 3: IMMUTABLE SOURCE INFORMATION (7 Cols) */}
          <div className="lg:col-span-7 bg-surface-container-high p-space-lg rounded-xl shadow-sm border border-outline-variant/40 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-space-sm">
                <span className="font-label-sm text-label-sm uppercase tracking-widest text-on-surface-variant font-semibold">
                  IMMUTABLE PROVENANCE LEDGER
                </span>
                <span className="inline-flex items-center gap-1 font-label-sm text-label-sm bg-surface-variant px-space-xs py-0.5 rounded text-on-surface font-mono">
                  <span className="material-symbols-outlined text-[14px]">lock</span> LOCKED RECORD
                </span>
              </div>

              <div className="bg-surface-container-lowest/80 p-space-sm rounded-lg mb-space-md flex items-center gap-space-sm border border-outline-variant/30">
                <span className="material-symbols-outlined text-primary text-[20px] shrink-0">
                  history_edu
                </span>
                <span className="font-label-sm text-label-sm text-on-surface-variant">
                  <strong>DỮ LIỆU NGUỒN GỐC ĐƯỢC MÃ HÓA BẤT BIẾN:</strong> Không thể can thiệp, chỉnh sửa hay ghi đè lịch sử vật phẩm đã qua kiểm định tại xưởng.
                </span>
              </div>

              {/* Spec Data Mosaic */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-sm mb-space-md">
                <div className="bg-surface p-space-sm rounded-lg border border-outline-variant/30">
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">
                    Sản phẩm RENT Gốc
                  </span>
                  <div className="font-title-md text-title-md text-sm text-on-surface font-semibold mt-1 font-serif line-clamp-2">
                    {formData.title}
                  </div>
                  <span className="font-label-sm text-label-sm text-on-surface-variant font-mono">
                    Model Ref: #{formData.sku}
                  </span>
                </div>

                <div className="bg-surface p-space-sm rounded-lg border border-outline-variant/30">
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">
                    Mã Hiện Vật &amp; Serial
                  </span>
                  <div className="font-title-md text-title-md text-sm text-primary font-semibold mt-1 font-mono">
                    #{formData.unitId}
                  </div>
                  <span className="font-label-sm text-label-sm text-on-surface-variant font-mono">
                    Chassis Laser SN: {formData.serialNumber}
                  </span>
                </div>

                <div className="bg-surface p-space-sm rounded-lg border border-outline-variant/30">
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">
                    Cấp Bậc Thẩm Định (Grade)
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-headline-sm text-headline-sm text-on-surface font-bold leading-none font-serif">
                      {formData.condition.split(' ')[0]}
                    </span>
                    <span className="px-1.5 py-0.5 bg-secondary-fixed text-on-secondary-fixed text-[10px] font-bold rounded">
                      EXCELLENT
                    </span>
                  </div>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">
                    Chuẩn thẩm định xưởng Atelier Chronos
                  </span>
                </div>

                <div className="bg-surface p-space-sm rounded-lg border border-outline-variant/30">
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">
                    Lịch Sử Cho Thuê Tích Lũy
                  </span>
                  <div className="font-title-md text-title-md text-sm text-on-surface font-semibold mt-1">
                    {formData.cycleCount} Chu kỳ • {formData.daysRented || 78} Ngày tác nghiệp
                  </div>
                  <span className="font-label-sm text-label-sm text-secondary font-medium">
                    Doanh thu tích lũy: {formData.totalRevenue || '31.500.000 ₫'}
                  </span>
                </div>
              </div>

              <div className="p-space-sm bg-surface-container rounded-lg flex items-center justify-between border border-outline-variant/30 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[18px]">verified</span>
                  <span className="font-label-sm text-label-sm text-on-surface font-semibold">
                    Thẻ Nguồn Gốc (Source Tag):
                  </span>
                </div>
                <span className="font-label-sm text-label-sm uppercase bg-surface text-primary px-space-sm py-1 rounded font-bold shadow-sm">
                  {formData.sourceTag}
                </span>
              </div>
            </div>

            <div className="mt-space-md text-right">
              <span className="font-label-sm text-label-sm text-on-surface-variant font-mono text-[11px] truncate block">
                Hash: {formData.hashProof}
              </span>
            </div>
          </div>
        </div>

        {/* SECTION 4: THRIFT LISTING CREATION FORM & LIVE PREVIEW */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">
          {/* Left Column: Form Inputs (7 Cols) */}
          <div className="lg:col-span-7 bg-surface-container-low p-space-lg rounded-xl shadow-sm border border-outline-variant/40 flex flex-col gap-space-md">
            <div>
              <span className="font-label-sm text-label-sm uppercase tracking-widest text-primary font-semibold">
                THIẾT LẬP MỤC ĐĂNG MỚI
              </span>
              <h2 className="font-headline-sm text-headline-sm text-on-surface font-serif">
                Biểu Mẫu Chuyển Giao Bán Đứt THRIFT
              </h2>
              <p className="font-body-md text-body-md text-on-surface-variant">
                Dữ liệu kỹ thuật từ nhật ký sử dụng sẽ được đính kèm vào giấy chứng nhận chủ sở hữu mới. Mọi chỉnh sửa được tự động lưu vào bộ nhớ cục bộ (localStorage).
              </p>
            </div>

            {/* Field 1: Title */}
            <div className="flex flex-col gap-1">
              <label className="font-label-md text-label-md text-on-surface font-semibold flex items-center justify-between">
                <span>Tên sản phẩm đăng bán THRIFT (Archive Title)</span>
                <span className="text-on-surface-variant font-normal text-xs">
                  Tự động cấu hình chuẩn bảo tàng
                </span>
              </label>
              <input
                id="listing-title-input"
                type="text"
                disabled={isAlreadyConverted}
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Nhập tiêu đề bán lại THRIFT..."
                className="w-full bg-surface px-space-md py-space-sm rounded text-on-surface font-body-md text-body-md focus:outline-none focus:ring-1 focus:ring-primary shadow-sm border border-outline-variant/40 disabled:opacity-75"
              />
            </div>

            {/* Two Cols: Category & Condition */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-md">
              {/* Field 2: Category (Fixed) */}
              <div className="flex flex-col gap-1">
                <label className="font-label-md text-label-md text-on-surface font-semibold">
                  Danh mục lưu trữ (Fixed)
                </label>
                <div className="w-full bg-surface-container px-space-md py-space-sm rounded text-on-surface-variant font-body-md text-body-md flex items-center justify-between cursor-not-allowed border border-outline-variant/40">
                  <span className="truncate">{formData.category}</span>
                  <span className="material-symbols-outlined text-[16px]">lock</span>
                </div>
              </div>

              {/* Field 3: Condition */}
              <div className="flex flex-col gap-1">
                <label className="font-label-md text-label-md text-on-surface font-semibold">
                  Phân hạng tình trạng sau sử dụng
                </label>
                <select
                  disabled={isAlreadyConverted}
                  value={formData.condition}
                  onChange={(e) => handleInputChange('condition', e.target.value)}
                  className="w-full bg-surface px-space-md py-space-sm rounded text-on-surface font-body-md text-body-md focus:outline-none focus:ring-1 focus:ring-primary shadow-sm border border-outline-variant/40 disabled:opacity-75 cursor-pointer"
                >
                  <option value="Chuẩn Thrift (79.0% - Đã kiểm định & khử khuẩn xưởng)">
                    Chuẩn Thrift (79.0% - Đã kiểm định & khử khuẩn xưởng)
                  </option>
                  <option value="Tốt (86.0% - Vải & form dáng nguyên bản)">
                    Tốt (86.0% - Vải & form dáng nguyên bản)
                  </option>
                  <option value="Rất tốt (92.0% - Dấu vết sử dụng rất ít)">
                    Rất tốt (92.0% - Dấu vết sử dụng rất ít)
                  </option>
                  <option value="Like New (96.0% - Hoàn hảo như mới)">
                    Like New (96.0% - Hoàn hảo như mới)
                  </option>
                  <option value="Nguyên bản (99.0% - Tiêu chuẩn cao cấp)">
                    Nguyên bản (99.0% - Tiêu chuẩn cao cấp)
                  </option>
                </select>
              </div>
            </div>

            {/* Box Gợi ý định giá khấu hao tự động dựa trên số lần thuê */}
            {(() => {
              const origPriceNum = parseVndPrice(formData.originalPrice || formData.price || 0) || 10000000;
              const rentalCount = formData.cycleCount || 0;
              const depResult = calculateThriftDiscount(rentalCount, origPriceNum);

              const handleApplySuggested = (customPct?: number) => {
                const pct = customPct !== undefined ? customPct : depResult.discountPercent;
                const calculated = Math.max(0, Math.round((origPriceNum * (1 - pct / 100)) / 1000) * 1000);
                const formatted = formatVndPrice(calculated);
                handleInputChange('price', formatted);
                handleInputChange('depreciationText', `Khấu hao -${pct}% dựa trên ${rentalCount} lần thuê thành công`);
                showToast(`Đã áp dụng mức khấu hao -${pct}%: Giá bán THRIFT ${formatted}`);
              };

              return (
                <div className="p-4 bg-surface rounded-xl border border-secondary/30 shadow-xs flex flex-col gap-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-secondary text-[20px]">calculate</span>
                      <span className="font-semibold text-xs uppercase tracking-wider text-on-surface">
                        Gợi ý định giá Thrift theo số lần cho thuê (Khấu hao tự động)
                      </span>
                    </div>
                    <span className="text-[11px] font-mono px-2.5 py-0.5 rounded bg-secondary/10 text-secondary font-bold">
                      {rentalCount} lần thuê thành công
                    </span>
                  </div>

                  {/* Bảng bậc thang khấu hao */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                    <div className={`p-2 rounded border transition-all ${rentalCount >= 1 && rentalCount <= 3 ? 'bg-secondary/15 border-secondary font-bold text-secondary ring-1 ring-secondary' : 'bg-surface-container border-outline-variant/30 text-on-surface-variant'}`}>
                      <div className="text-[10px] uppercase font-semibold">1 - 3 lần thuê</div>
                      <div className="text-sm font-mono mt-0.5 font-bold">Giảm 15%</div>
                    </div>
                    <div className={`p-2 rounded border transition-all ${rentalCount >= 4 && rentalCount <= 7 ? 'bg-secondary/15 border-secondary font-bold text-secondary ring-1 ring-secondary' : 'bg-surface-container border-outline-variant/30 text-on-surface-variant'}`}>
                      <div className="text-[10px] uppercase font-semibold">4 - 7 lần thuê</div>
                      <div className="text-sm font-mono mt-0.5 font-bold">Giảm 30%</div>
                    </div>
                    <div className={`p-2 rounded border transition-all ${rentalCount >= 8 && rentalCount <= 12 ? 'bg-secondary/15 border-secondary font-bold text-secondary ring-1 ring-secondary' : 'bg-surface-container border-outline-variant/30 text-on-surface-variant'}`}>
                      <div className="text-[10px] uppercase font-semibold">8 - 12 lần thuê</div>
                      <div className="text-sm font-mono mt-0.5 font-bold">Giảm 45%</div>
                    </div>
                    <div className={`p-2 rounded border transition-all ${rentalCount > 12 ? 'bg-secondary/15 border-secondary font-bold text-secondary ring-1 ring-secondary' : 'bg-surface-container border-outline-variant/30 text-on-surface-variant'}`}>
                      <div className="text-[10px] uppercase font-semibold">&gt; 12 lần thuê</div>
                      <div className="text-sm font-mono mt-0.5 font-bold">Giảm 60%</div>
                    </div>
                  </div>

                  {/* Chi tiết công thức & Giá đề xuất */}
                  <div className="bg-[#f7f3ec] p-3 rounded-lg border border-[#ebe8e1] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="text-xs text-[#4a463f] space-y-1">
                      <div>
                        Giá gốc: <strong className="text-[#141310] font-mono">{formatVndPrice(origPriceNum)}</strong> • Mức giảm theo bậc: <strong className="text-amber-800 font-bold">-{depResult.discountPercent}%</strong>
                      </div>
                      <div className="text-[11px] text-[#7b766f]">
                        Công thức: {formatVndPrice(origPriceNum)} × (1 - {depResult.discountPercent}%) = <span className="text-emerald-700 font-bold font-mono text-xs">{formatVndPrice(depResult.suggestedPrice)}</span>
                      </div>
                    </div>

                    {!isAlreadyConverted && (
                      <button
                        type="button"
                        onClick={() => handleApplySuggested(depResult.discountPercent)}
                        className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded font-semibold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
                        title="Điền giá đề xuất vào form"
                      >
                        <span className="material-symbols-outlined text-[16px]">price_check</span>
                        <span>Áp dụng gợi ý: {formatVndPrice(depResult.suggestedPrice)}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Field 4: Price */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <label className="font-label-md text-label-md text-on-surface font-semibold">
                  Giá bán đứt THRIFT (Secondhand Price)
                </label>
                <span className="font-label-sm text-label-sm text-secondary font-medium">
                  {formData.depreciationText || 'Khấu hao hợp lý chuẩn B-Corp'}
                </span>
              </div>
              <div className="relative">
                <input
                  id="listing-price-input"
                  type="text"
                  disabled={isAlreadyConverted}
                  value={formData.price}
                  onChange={(e) => handleInputChange('price', e.target.value)}
                  className="w-full bg-surface px-space-md py-space-sm rounded text-on-surface font-title-md text-title-md font-bold text-primary focus:outline-none focus:ring-1 focus:ring-primary shadow-sm border border-outline-variant/40 font-mono disabled:opacity-75"
                />
                <span className="absolute right-3 top-2.5 font-label-sm text-label-sm text-on-surface-variant font-mono">
                  VNĐ (ESCROW PROTECTED)
                </span>
              </div>
            </div>

            {/* Field 5: Description */}
            <div className="flex flex-col gap-1">
              <label className="font-label-md text-label-md text-on-surface font-semibold">
                Mô tả chi tiết &amp; Hồ sơ di sản bán lại (Heritage Provenance Log)
              </label>
              <textarea
                rows={5}
                disabled={isAlreadyConverted}
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="w-full bg-surface p-space-md rounded text-on-surface font-body-md text-body-md focus:outline-none focus:ring-1 focus:ring-primary leading-relaxed shadow-sm border border-outline-variant/40 disabled:opacity-75"
              />
            </div>

            {/* Field 6: Images Authenticated */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <label className="font-label-md text-label-md text-on-surface font-semibold">
                  Thư viện hình ảnh thẩm định ({formData.images.length} Tấm lưu trữ)
                </label>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 font-label-sm text-label-sm text-secondary bg-secondary/10 px-2 py-0.5 rounded font-medium">
                    <span className="material-symbols-outlined text-[14px]">verified</span>
                    Ảnh thực tế đối kiểm
                  </span>
                  {!isAlreadyConverted && (
                    <button
                      type="button"
                      onClick={() => setShowAddImageModal(true)}
                      className="inline-flex items-center gap-1 font-label-sm text-label-sm bg-primary text-on-primary px-2 py-0.5 rounded hover:bg-primary/90 transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[14px]">add_a_photo</span>
                      Thêm ảnh
                    </button>
                  )}
                </div>
              </div>

              {/* Gallery Grid */}
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-space-xs">
                {formData.images.map((img) => {
                  const isHero = formData.heroImage === img.url;
                  return (
                    <div
                      key={img.id}
                      onClick={() => handleSelectHero(img.url)}
                      className={`relative aspect-square rounded overflow-hidden shadow-sm group cursor-pointer border-2 transition-all ${isHero
                          ? 'border-primary ring-2 ring-primary/40'
                          : 'border-transparent hover:border-outline-variant'
                        }`}
                      title={isHero ? 'Ảnh đại diện (HERO)' : 'Bấm để chọn làm ảnh chính (Set HERO)'}
                    >
                      <img
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        src={img.url}
                        alt={img.label}
                      />
                      <span
                        className={`absolute bottom-1 left-1 text-[9px] px-1 rounded font-semibold ${isHero
                            ? 'bg-primary text-on-primary font-bold shadow'
                            : 'bg-on-surface/80 text-surface'
                          }`}
                      >
                        {isHero ? '★ HERO' : img.label}
                      </span>
                    </div>
                  );
                })}
              </div>
              <p className="text-[11px] text-on-surface-variant italic">
                * Bấm vào bất kỳ ảnh nào để đặt làm ảnh đại diện chính (HERO) cho thẻ đăng THRIFT.
              </p>
            </div>

            {/* Field 7: Shipping & Packaging Standard */}
            <div className="flex flex-col gap-1">
              <label className="font-label-md text-label-md text-on-surface font-semibold">
                Quy chuẩn đóng gói &amp; Giao vận
              </label>
              <div className="p-space-sm bg-surface rounded-lg flex items-center justify-between shadow-sm border border-outline-variant/30">
                <div className="flex items-center gap-space-sm">
                  <span className="material-symbols-outlined text-secondary text-[22px]">
                    local_shipping
                  </span>
                  <div className="flex flex-col">
                    <span className="font-label-md text-label-md text-on-surface font-semibold">
                      Insured Standard Eco Courier
                    </span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">
                      Vận chuyển bảo đảm tiêu chuẩn kèm tem niêm phong ReUse Hub
                    </span>
                  </div>
                </div>
                <span className="material-symbols-outlined text-secondary text-[20px]">check</span>
              </div>
            </div>

            {/* Field 8: Provenance Source Reference */}
            <div className="p-space-sm bg-surface-container rounded-lg flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm border border-outline-variant/30">
              <span>
                Nguồn gốc hiện vật: <strong>{formData.sourceTag} (#{formData.unitId})</strong>
              </span>
              <span className="text-primary font-medium italic">Khóa liên kết vĩnh viễn</span>
            </div>
          </div>

          {/* Right Column / Action Sidebar (5 Cols) */}
          <div className="lg:col-span-5 flex flex-col gap-space-md sticky top-20">
            {/* Live Marketplace Preview Card */}
            <div className="bg-surface-container-low p-space-md rounded-xl shadow-sm border border-outline-variant/40 flex flex-col">
              <div className="flex items-center justify-between pb-space-xs mb-space-sm border-b border-outline-variant/20">
                <span className="font-label-sm text-label-sm uppercase tracking-widest text-on-surface-variant font-bold">
                  XEM TRƯỚC SÀN THRIFT (LIVE PREVIEW)
                </span>
                <span className="px-2 py-0.5 bg-secondary-fixed text-on-secondary-fixed text-[10px] font-bold rounded">
                  CATALOGUE VIEW
                </span>
              </div>

              {/* Archival Product Preview Card */}
              <div className="bg-surface rounded-lg overflow-hidden shadow-md flex flex-col border border-outline-variant/40">
                <div className="relative w-full aspect-[4/3] overflow-hidden bg-surface-container">
                  <img
                    className="w-full h-full object-cover transition-all duration-300"
                    src={formData.heroImage}
                    alt={formData.title}
                  />
                  <div className="absolute top-2 left-2 flex items-center gap-1">
                    <span className="px-2 py-0.5 bg-on-surface text-surface text-[10px] font-semibold tracking-wider uppercase rounded shadow-sm">
                      THRIFT / 1 OF 1 SPECIMEN
                    </span>
                  </div>
                  <div className="absolute bottom-2 right-2">
                    <span className="px-2 py-0.5 bg-surface/90 backdrop-blur text-secondary text-[11px] font-bold rounded shadow-sm border border-outline-variant/30">
                      GRADE: {formData.condition.split(' ')[0]}
                    </span>
                  </div>
                </div>

                <div className="p-space-md flex flex-col gap-space-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-label-sm text-label-sm uppercase tracking-widest text-on-surface-variant font-mono">
                      ARCHIVE #{formData.unitId}
                    </span>
                    <span className="font-label-sm text-label-sm text-secondary font-semibold">
                      {formData.cycleCount} Chu kỳ đã thẩm định
                    </span>
                  </div>

                  <h3
                    id="preview-title"
                    className="font-headline-sm text-headline-sm text-on-surface leading-snug font-serif text-base"
                  >
                    {formData.title || 'Tiêu đề sản phẩm THRIFT...'}
                  </h3>

                  <div className="flex items-baseline justify-between mt-space-xs pt-space-xs border-t border-outline-variant/20">
                    <div className="flex flex-col">
                      <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">
                        Giá Bán Đứt
                      </span>
                      <span
                        id="preview-price"
                        className="font-title-md text-title-md text-on-surface font-bold text-primary font-mono text-lg"
                      >
                        {formData.price || '0 ₫'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-on-surface-variant font-label-sm text-label-sm">
                      <span className="material-symbols-outlined text-[16px] text-primary">store</span>
                      <span>Atelier Chronos</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Operational Rule Notice Card (AC 2) */}
            <div className="bg-surface-container-high p-space-md rounded-xl shadow-sm border border-outline-variant/40">
              <div className="flex items-start gap-space-sm mb-space-xs">
                <span className="material-symbols-outlined text-tertiary text-[20px] shrink-0 mt-0.5">
                  warning
                </span>
                <div className="flex flex-col">
                  <span className="font-label-md text-label-md text-on-surface font-bold uppercase tracking-wider">
                    QUY TẮC CHUYỂN DỊCH KHO VĨNH VIỄN
                  </span>
                  <p className="font-label-sm text-label-sm text-on-surface-variant leading-relaxed mt-1">
                    Sau khi bấm <strong>"Tạo Mục Đăng THRIFT"</strong>, hiện vật <strong>#{formData.unitId}</strong> sẽ tự động rút vĩnh viễn khỏi danh sách sẵn sàng cho thuê (RENT) và chuyển toàn bộ sang hệ thống sổ lệnh bán lẻ THRIFT. Thao tác này là một chiều và <strong>không thể hoàn tác</strong>.
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-space-sm">
              <button
                id="btn-create-thrift"
                type="button"
                disabled={!isEligible || isAlreadyConverted || isSubmitting}
                onClick={() => setIsConfirmModalOpen(true)}
                className={`w-full font-label-md text-label-md uppercase tracking-wider py-space-md rounded shadow-md transition-all flex items-center justify-center gap-2 font-medium ${
                  isRejected
                    ? 'bg-red-700 hover:bg-red-800 text-white cursor-pointer shadow-lg'
                    : isAlreadyConverted
                    ? 'bg-secondary text-white cursor-default'
                    : !isEligible
                      ? 'bg-outline-variant/60 text-on-surface-variant cursor-not-allowed'
                      : 'bg-on-background text-background hover:bg-primary cursor-pointer'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <span className="inline-block animate-spin material-symbols-outlined text-[18px]">
                      progress_activity
                    </span>
                    <span>ĐANG KHỞI TẠO MỤC ĐĂNG THRIFT...</span>
                  </>
                ) : isRejected ? (
                  <>
                    <span>Chuyển Sang THRIFT (Gửi Duyệt Lại)</span>
                    <span className="material-symbols-outlined text-[18px] transition-transform group-hover:translate-x-1">
                      restart_alt
                    </span>
                  </>
                ) : isAlreadyConverted ? (
                  <>
                    <span className="material-symbols-outlined text-[18px]">check_circle</span>
                    <span>ĐÃ GỬI YÊU CẦU DUYỆT (PENDING APPROVAL)</span>
                  </>
                ) : !isEligible ? (
                  <>
                    <span className="material-symbols-outlined text-[18px]">lock</span>
                    <span>
                      {isCurrentlyRenting
                        ? 'KHÓA: ĐANG CHO THUÊ'
                        : 'KHÓA: CÓ LỊCH ĐẶT TRƯỚC'}
                    </span>
                  </>
                ) : (
                  <>
                    <span>Tạo Mục Đăng THRIFT (Create THRIFT Listing)</span>
                    <span className="material-symbols-outlined text-[18px] transition-transform group-hover:translate-x-1">
                      arrow_forward
                    </span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => navigate('/shop/rent/inventory')}
                className="w-full bg-surface hover:bg-surface-container text-on-surface-variant font-label-md text-label-md uppercase tracking-wider py-space-sm rounded transition-colors text-center shadow-sm border border-outline-variant/40 cursor-pointer"
              >
                Hủy Bỏ &amp; Quay Lại Kho Hiện Vật (Cancel)
              </button>
            </div>

            {/* Trust Stamp & Laboratory Signature */}
            <div className="p-space-sm bg-surface-container-lowest/60 rounded-lg flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm border border-outline-variant/30">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-secondary text-[16px]">
                  shield_lock
                </span>
                <span>B-Corp ReClaim Standard v4.2</span>
              </div>
              <span className="font-mono text-xs">PHẠM THÙY DƯƠNG #OWNER-01</span>
            </div>
          </div>
        </div>
      </div>

      {/* CONFIRMATION WARNING MODAL (AC 2) - GỌN GÀNG, TINH TẾ */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-surface rounded-xl shadow-2xl max-w-[420px] w-full border border-outline-variant overflow-hidden">
            {/* Modal Header */}
            <div className="bg-surface-container-high px-4 py-3 flex items-center justify-between border-b border-outline-variant">
              <div className="flex items-center gap-2 text-error">
                <span className="material-symbols-outlined text-[20px]">warning</span>
                <span className="text-sm font-bold text-on-surface font-serif">
                  Xác Nhận Chuyển Sang THRIFT
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsConfirmModalOpen(false)}
                className="p-1 rounded hover:bg-surface-container text-on-surface-variant cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 flex flex-col gap-3 text-xs leading-relaxed text-on-surface">
              <div className="p-2.5 bg-error-container/20 border border-error/20 rounded-lg text-on-error-container text-[11px] leading-snug">
                <p className="font-bold text-error flex items-center gap-1 mb-0.5">
                  <span className="material-symbols-outlined text-[14px]">error</span>
                  <span>Thao tác không thể hoàn tác:</span>
                </p>
                <p className="opacity-90">
                  Hiện vật <strong>#{formData.unitId}</strong> sẽ ngừng cho thuê vĩnh viễn và được chuyển sang danh mục mở bán THRIFT.
                </p>
              </div>

              <div className="flex items-center justify-between px-3 py-2 bg-surface-container rounded-lg text-xs">
                <span className="text-on-surface-variant font-medium">Giá bán đứt thiết lập:</span>
                <span className="font-bold text-sm text-error">{formData.price}</span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="px-4 py-3 bg-surface-container-low border-t border-outline-variant flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsConfirmModalOpen(false)}
                className="px-3 py-1.5 rounded text-xs font-medium text-on-surface-variant hover:bg-surface-container transition-colors cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmSubmit}
                className="px-3.5 py-1.5 rounded text-xs font-semibold bg-error text-white hover:bg-error/90 shadow-sm transition-colors flex items-center gap-1 cursor-pointer"
              >
                <span>Xác nhận chuyển đổi</span>
                <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD IMAGE MODAL */}
      {showAddImageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-surface rounded-xl shadow-2xl max-w-md w-full border border-outline-variant overflow-hidden">
            <div className="bg-surface-container-high px-5 py-3.5 flex items-center justify-between border-b border-outline-variant">
              <span className="font-semibold text-sm text-on-surface">
                Thêm Ảnh Thẩm Định Sau Sử Dụng
              </span>
              <button
                type="button"
                onClick={() => setShowAddImageModal(false)}
                className="p-1 rounded hover:bg-surface-container text-on-surface-variant cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="p-5 flex flex-col gap-4 text-xs">
              {/* Option 1: Upload File */}
              <div className="flex flex-col gap-1.5">
                <span className="font-semibold text-on-surface">
                  1. Tải ảnh từ máy tính (File Upload):
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={isUploadingImage}
                  className="w-full text-xs text-on-surface-variant file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-on-primary hover:file:bg-primary/90 cursor-pointer"
                />
                {isUploadingImage && (
                  <span className="text-[11px] text-primary flex items-center gap-1">
                    <span className="inline-block animate-spin material-symbols-outlined text-[14px]">
                      progress_activity
                    </span>
                    Đang xử lý ảnh...
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 text-outline-variant">
                <div className="h-px bg-outline-variant flex-1"></div>
                <span className="text-[10px] uppercase font-bold">HOẶC</span>
                <div className="h-px bg-outline-variant flex-1"></div>
              </div>

              {/* Option 2: Image URL */}
              <div className="flex flex-col gap-1.5">
                <span className="font-semibold text-on-surface">
                  2. Nhập liên kết ảnh trực tuyến (Image URL):
                </span>
                <input
                  type="url"
                  placeholder="https://example.com/photo.jpg"
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  className="w-full px-3 py-2 bg-surface rounded border border-outline-variant focus:outline-none focus:ring-1 focus:ring-primary text-xs"
                />
              </div>
            </div>

            <div className="px-5 py-3 bg-surface-container-low border-t border-outline-variant flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddImageModal(false)}
                className="px-3 py-1.5 rounded text-xs text-on-surface-variant hover:bg-surface-container cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                disabled={!newImageUrl.trim()}
                onClick={() => handleAddImage(newImageUrl, 'EXTRA')}
                className="px-4 py-1.5 rounded text-xs font-semibold bg-primary text-on-primary hover:bg-primary/90 disabled:opacity-50 cursor-pointer"
              >
                Thêm Vào Thư Viện
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const ConvertToThrift: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const targetId = id || 'INV-DRES-04';

  return <ConvertToThriftForm key={targetId} targetId={targetId} />;
};

export default ConvertToThrift;
