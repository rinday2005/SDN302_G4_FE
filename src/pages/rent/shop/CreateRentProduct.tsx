/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/incompatible-library */
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useShop } from '../../../context/ShopContext';
import { uploadImageApi } from '../../../services/upload.api';
import { getCategoriesApi, type CategoryItem } from '../../../services/category.api';

// Schema validate bằng Zod phù hợp cho sản phẩm Quần áo / Thời trang cho thuê
const rentProductSchema = z.object({
  name: z.string().min(4, 'Tên trang phục phải có ít nhất 4 ký tự'),
  category: z.string().min(1, 'Vui lòng chọn phân mục trang phục'),
  brand: z.string().min(2, 'Vui lòng nhập thương hiệu hoặc nhà thiết kế'),
  mountSensor: z.string().min(2, 'Vui lòng nhập kích cỡ (Size) và màu sắc'),
  accessoriesIncluded: z.string().min(3, 'Vui lòng ghi phụ kiện hoặc chi tiết đi kèm'),
  description: z.string().min(15, 'Mô tả chất liệu, kiểu dáng tối thiểu 15 ký tự'),
  condition: z.string().default('LIKE_NEW'),
  pricePerDay: z.coerce.number().min(20000, 'Giá thuê tối thiểu 20.000 ₫/ngày'),
  deposit: z.coerce.number().min(100000, 'Tiền cọc tối thiểu 100.000 ₫'),
  totalUnits: z.coerce.number().min(1, 'Số lượng nhập kho tối thiểu là 1 bộ/chiếc'),
  minDays: z.coerce.number().min(1, 'Số ngày thuê tối thiểu là 1'),
  maxDays: z.coerce.number().max(90, 'Số ngày thuê tối đa không quá 90'),
  handoverRule1: z.boolean().refine((val) => val === true, 'Bắt buộc xác nhận trang phục đã được giặt hấp, khử khuẩn'),
  handoverRule2: z.boolean().refine((val) => val === true, 'Bắt buộc xác nhận đã kiểm tra đường may, cúc áo, khóa kéo'),
  handoverRule3: z.boolean().refine((val) => val === true, 'Bắt buộc xác nhận đóng gói kèm bao bọc chống bụi và móc treo'),
});

type RentProductFormData = z.infer<typeof rentProductSchema>;

export const CreateRentProduct: React.FC = () => {
  const navigate = useNavigate();
  const { addProduct } = useShop();

  const [coverImage, setCoverImage] = useState<string>('');
  const [detailImages, setDetailImages] = useState<string[]>([]);
  const [isUploadingCover, setIsUploadingCover] = useState<boolean>(false);
  const [isUploadingDetails, setIsUploadingDetails] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [categories, setCategories] = useState<CategoryItem[]>([]);

  const coverInputRef = useRef<HTMLInputElement | null>(null);
  const detailInputRef = useRef<HTMLInputElement | null>(null);

  // Lấy danh mục thực tế từ MongoDB
  useEffect(() => {
    getCategoriesApi()
      .then((data) => {
        if (data && data.length > 0) {
          // Ưu tiên các category liên quan đến thuê (RENT hoặc BOTH) hoặc toàn bộ
          const rentCats = data.filter((c) => c.type === 'RENT' || c.type === 'BOTH' || c.isActive);
          setCategories(rentCats.length > 0 ? rentCats : data);
        }
      })
      .catch((err) => {
        console.warn('Lỗi khi tải danh mục từ DB:', err);
      });
  }, []);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RentProductFormData>({
    resolver: zodResolver(rentProductSchema) as any,
    defaultValues: {
      category: '',
      brand: '',
      mountSensor: '',
      accessoriesIncluded: 'Kèm bao bọc chống bụi và móc treo cao cấp',
      condition: 'LIKE_NEW',
      minDays: 1,
      maxDays: 30,
      totalUnits: 1,
      handoverRule1: false,
      handoverRule2: false,
      handoverRule3: false,
    },
  });

  // Watch các trường để live preview
  const watchedName = watch('name');
  const watchedPrice = watch('pricePerDay');
  const watchedDeposit = watch('deposit');
  const watchedUnits = watch('totalUnits');
  const watchedMinDays = watch('minDays');
  const watchedSizeColor = watch('mountSensor');

  // Xử lý upload ảnh bìa lên Cloudinary
  const handleUploadCover = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingCover(true);
      const url = await uploadImageApi(file);
      setCoverImage(url);
    } catch (err) {
      console.error(err);
      alert('Không thể tải ảnh bìa lên Cloudinary. Vui lòng kiểm tra lại ảnh hoặc kết nối mạng.');
    } finally {
      setIsUploadingCover(false);
      if (e.target) e.target.value = '';
    }
  };

  // Xử lý upload ảnh kỹ thuật 3 góc lên Cloudinary
  const handleUploadDetails = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    try {
      setIsUploadingDetails(true);
      const uploadPromises = files.map((file) => uploadImageApi(file));
      const urls = await Promise.all(uploadPromises);
      setDetailImages((prev) => [...prev, ...urls]);
    } catch (err) {
      console.error(err);
      alert('Một số ảnh tải lên Cloudinary bị lỗi. Vui lòng thử lại.');
    } finally {
      setIsUploadingDetails(false);
      if (e.target) e.target.value = '';
    }
  };

  // Submit form tạo sản phẩm mới vào MongoDB
  const onSubmit = async (data: RentProductFormData) => {
    if (!coverImage) {
      alert('Vui lòng tải lên ảnh bìa chính của trang phục (lưu trữ Cloudinary)!');
      return;
    }
    if (detailImages.length < 3) {
      alert('Vui lòng tải tối thiểu 3 ảnh góc chụp chi tiết (mặt trước, mặt sau, cận cảnh chất vải/nhãn)!');
      return;
    }

    try {
      setIsSubmitting(true);
      const autoSku = `CLO-${Date.now().toString().slice(-6)}`;
      const matchedCat = categories.find(
        (c) => c.name === data.category || c._id === data.category
      );

      await addProduct({
        sku: autoSku,
        name: data.name,
        category: matchedCat?.name || data.category,
        categoryId: matchedCat?._id,
        brand: data.brand,
        mountSensor: data.mountSensor, // Dùng lưu Size & Màu sắc
        accessoriesIncluded: data.accessoriesIncluded,
        description: data.description,
        pricePerDay: Number(data.pricePerDay),
        deposit: Number(data.deposit),
        replacementValue: Number(data.deposit) * 2,
        totalUnits: Number(data.totalUnits),
        readyUnits: Number(data.totalUnits),
        rentingUnits: 0,
        coverImage,
        inspectionImages: detailImages,
        minDays: Number(data.minDays),
        maxDays: Number(data.maxDays),
        maintenanceUnits: 0,
        condition: data.condition as any,
      });

      alert('Đã tạo thành công sản phẩm cho thuê mới trên MongoDB! Trạng thái: "Chờ duyệt" (Pending)');
      navigate('/shop/rent/products');
    } catch (err) {
      console.error(err);
      alert('Có lỗi xảy ra khi tạo sản phẩm trên máy chủ. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full flex flex-col font-sans text-[#1c1c18] bg-[#fdf9f2] min-h-[calc(100vh-4rem)]">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12 py-8 w-full">
        {/* Header Breadcrumbs */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <nav className="text-xs text-[#7b766f] mb-1 flex items-center gap-1.5 uppercase font-medium tracking-wider">
              <Link to="/shop/rent/products" className="hover:text-[#141310] transition-colors">
                Quản lý đồ cho thuê
              </Link>
              <span>/</span>
              <span className="text-[#141310] font-semibold">Tạo mới trang phục</span>
            </nav>
            <h1 className="font-serif text-2xl sm:text-3xl text-[#141310] font-bold">
              Đăng Trang Phục &amp; Đồ Cho Thuê (RENT)
            </h1>
            <p className="text-xs text-[#7b766f] mt-1">
              Hình ảnh lưu trực tiếp trên <strong>Cloudinary CDN</strong>, thông tin lưu vào <strong>MongoDB</strong> và được chuyển đến Admin để thẩm định bài đăng.
            </p>
          </div>
          <Link
            to="/shop/rent/products"
            className="px-4 py-2 bg-white hover:bg-[#ebe8e1] text-[#141310] text-xs font-semibold uppercase tracking-wider rounded-lg border border-[#ebe8e1] transition-colors shadow-sm self-start sm:self-auto flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            Danh sách đồ cho thuê
          </Link>
        </div>

        <form onSubmit={handleSubmit(onSubmit as any)} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* CỘT TRÁI: FORM NHẬP LIỆU */}
          <div className="lg:col-span-8 space-y-6">
            {/* A. ẢNH TRANG PHỤC & GÓC CHỤP */}
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

              {/* 1. ẢNH BÌA CHÍNH (KHUNG VUÔNG TRỰC QUAN) */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#141310] mb-1.5">
                  Ảnh bìa chính diện (Cover Image) <span className="text-red-500">*</span>
                </label>
                <p className="text-[11px] text-[#7b766f] mb-3">
                  Ảnh đại diện hiển thị đầu tiên trên sàn thuê. Nên chọn ảnh toàn thân hoặc chụp form dáng chuẩn của trang phục.
                </p>

                {/* Input ẩn */}
                <input
                  type="file"
                  ref={coverInputRef}
                  accept="image/*"
                  onChange={handleUploadCover}
                  disabled={isUploadingCover}
                  className="hidden"
                />

                {coverImage ? (
                  <div className="relative w-36 h-36 sm:w-40 sm:h-40 rounded-xl overflow-hidden border-2 border-[#576151] group shadow-md bg-[#f7f3ec]">
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
                        Xóa
                      </button>
                    </div>
                    <span className="absolute bottom-1 left-1 bg-black/75 text-white text-[9px] font-medium px-1.5 py-0.5 rounded">
                      Ảnh bìa chính
                    </span>
                  </div>
                ) : (
                  <div
                    onClick={() => !isUploadingCover && coverInputRef.current?.click()}
                    className={`w-36 h-36 sm:w-40 sm:h-40 rounded-xl border-2 border-dashed transition-all flex flex-col items-center justify-center p-3 text-center cursor-pointer select-none group ${
                      isUploadingCover
                        ? 'border-amber-400 bg-amber-50/50 cursor-wait'
                        : 'border-[#cfc9bd] hover:border-[#576151] hover:bg-[#fbf8f2] bg-[#faf8f4]'
                    }`}
                  >
                    {isUploadingCover ? (
                      <>
                        <div className="w-7 h-7 border-2 border-amber-600 border-t-transparent rounded-full animate-spin mb-2"></div>
                        <span className="text-[11px] font-medium text-amber-700">Đang tải Cloudinary...</span>
                      </>
                    ) : (
                      <>
                        <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center mb-2 group-hover:scale-110 transition-transform text-[#576151]">
                          <span className="material-symbols-outlined text-[24px]">add_a_photo</span>
                        </div>
                        <span className="text-xs font-bold text-[#141310] group-hover:text-[#576151]">
                          Chọn ảnh bìa
                        </span>
                        <span className="text-[10px] text-[#7b766f] mt-0.5">Click vào ô này</span>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* 2. ẢNH KỸ THUẬT 3 GÓC (CÁC KHUNG VUÔNG NHỎ) */}
              <div className="pt-3 border-t border-[#f1eee7]">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#141310]">
                    Ảnh chi tiết 3 góc chụp (Tối thiểu 3 ảnh) <span className="text-red-500">*</span>
                  </label>
                  <span className={`text-[11px] font-mono font-semibold ${detailImages.length >= 3 ? 'text-emerald-700' : 'text-amber-700'}`}>
                    Đã chọn: {detailImages.length}/3 ảnh tối thiểu
                  </span>
                </div>
                <p className="text-[11px] text-[#7b766f] mb-3">
                  Gợi ý góc chụp: 1) Mặt sau trang phục • 2) Cận cảnh đường may, cúc áo, khóa kéo • 3) Nhãn mác xuất xứ và chất liệu vải.
                </p>

                {/* Input ẩn multiple */}
                <input
                  type="file"
                  ref={detailInputRef}
                  multiple
                  accept="image/*"
                  onChange={handleUploadDetails}
                  disabled={isUploadingDetails}
                  className="hidden"
                />

                <div className="flex gap-3 flex-wrap items-center">
                  {/* Danh sách ảnh đã upload */}
                  {detailImages.map((imgUrl, idx) => (
                    <div
                      key={idx}
                      className="relative w-28 h-28 rounded-xl overflow-hidden border border-[#cfc9bd] group shadow-sm bg-[#f7f3ec]"
                    >
                      <img src={imgUrl} alt={`Góc ${idx + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setDetailImages((prev) => prev.filter((_, i) => i !== idx))}
                        className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white w-5 h-5 rounded-full flex items-center justify-center text-[12px] font-bold shadow opacity-90 hover:opacity-100 transition-opacity"
                        title="Xóa ảnh này"
                      >
                        ×
                      </button>
                      <span className="absolute bottom-1 left-1 bg-black/70 text-white text-[9px] px-1.5 py-0.5 rounded font-mono">
                        Góc {idx + 1}
                      </span>
                    </div>
                  ))}

                  {/* Khung vuông trống để click chọn thêm ảnh */}
                  <div
                    onClick={() => !isUploadingDetails && detailInputRef.current?.click()}
                    className={`w-28 h-28 rounded-xl border-2 border-dashed transition-all flex flex-col items-center justify-center p-2 text-center cursor-pointer select-none group ${
                      isUploadingDetails
                        ? 'border-amber-400 bg-amber-50/50 cursor-wait'
                        : 'border-[#cfc9bd] hover:border-[#576151] hover:bg-[#fbf8f2] bg-[#faf8f4]'
                    }`}
                  >
                    {isUploadingDetails ? (
                      <>
                        <div className="w-6 h-6 border-2 border-amber-600 border-t-transparent rounded-full animate-spin mb-1"></div>
                        <span className="text-[10px] font-medium text-amber-700">Đang tải...</span>
                      </>
                    ) : (
                      <>
                        <div className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center mb-1 group-hover:scale-110 transition-transform text-[#576151]">
                          <span className="material-symbols-outlined text-[20px]">add_photo_alternate</span>
                        </div>
                        <span className="text-[11px] font-bold text-[#141310] group-hover:text-[#576151]">
                          + Thêm góc ảnh
                        </span>
                        <span className="text-[9px] text-[#7b766f]">Click vào đây</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* B. THÔNG TIN TRANG PHỤC & KIỂU DÁNG */}
            <div className="bg-white p-6 rounded-2xl border border-[#ebe8e1] space-y-4 shadow-sm">
              <div className="flex items-center gap-2 pb-3 border-b border-[#f1eee7]">
                <span className="material-symbols-outlined text-[#576151] text-[22px]">apparel</span>
                <h2 className="font-serif text-lg font-bold text-[#141310]">
                  B. Thông tin trang phục &amp; Phân loại
                </h2>
              </div>

              {/* Tên trang phục */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#141310] mb-1">
                  Tên trang phục / Set đồ cho thuê <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('name')}
                  placeholder="Ví dụ: Đầm Dạ Hội Maxi Kim Sa Ánh Bạc Cúp Ngực, Áo Dài Gấm Tơ Tằm..."
                  className="w-full px-3.5 py-2.5 bg-[#fbf9f4] border border-[#e4dfd5] rounded-lg text-sm text-[#141310] placeholder:text-[#9c958b] focus:outline-none focus:border-[#576151] focus:bg-white transition-colors"
                />
                {errors.name && <p className="text-red-600 text-[11px] mt-1">{errors.name.message as string}</p>}
              </div>

              {/* Phân mục (MongoDB DB thật) & Thương hiệu */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#141310] mb-1">
                    Phân mục (Danh mục từ Database) <span className="text-red-500">*</span>
                  </label>
                  <select
                    {...register('category')}
                    className="w-full px-3.5 py-2.5 bg-[#fbf9f4] border border-[#e4dfd5] rounded-lg text-sm text-[#141310] focus:outline-none focus:border-[#576151] focus:bg-white transition-colors"
                  >
                    <option value="">-- Chọn danh mục thực tế --</option>
                    {categories.length > 0 ? (
                      categories.map((c) => (
                        <option key={c._id} value={c.name}>
                          {c.name} {c.slug ? `(${c.slug})` : ''}
                        </option>
                      ))
                    ) : (
                      <>
                        <option value="Quần áo">Quần áo (clothing)</option>
                        <option value="Đầm dự tiệc">Đầm dự tiệc (dam-du-tiec)</option>
                        <option value="Giày dép">Giày dép (shoes)</option>
                        <option value="Phụ kiện">Phụ kiện (phu-kien)</option>
                      </>
                    )}
                  </select>
                  {errors.category && <p className="text-red-600 text-[11px] mt-1">{errors.category.message as string}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#141310] mb-1">
                    Thương hiệu / Nhà thiết kế <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('brand')}
                    placeholder="Elise, NEM, Zara, H&M, Thiết kế may đo..."
                    className="w-full px-3.5 py-2.5 bg-[#fbf9f4] border border-[#e4dfd5] rounded-lg text-sm text-[#141310] placeholder:text-[#9c958b] focus:outline-none focus:border-[#576151] focus:bg-white transition-colors"
                  />
                  {errors.brand && <p className="text-red-600 text-[11px] mt-1">{errors.brand.message as string}</p>}
                </div>
              </div>

              {/* Size & Màu sắc + Tình trạng */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#141310] mb-1">
                    Kích cỡ (Size) &amp; Màu sắc <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('mountSensor')}
                    placeholder="Ví dụ: Size M (Eo 68-72cm) • Màu Đỏ Ruby, Trắng Sữa..."
                    className="w-full px-3.5 py-2.5 bg-[#fbf9f4] border border-[#e4dfd5] rounded-lg text-sm text-[#141310] placeholder:text-[#9c958b] focus:outline-none focus:border-[#576151] focus:bg-white transition-colors"
                  />
                  {errors.mountSensor && <p className="text-red-600 text-[11px] mt-1">{errors.mountSensor.message as string}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#141310] mb-1">
                    Tình trạng trang phục
                  </label>
                  <select
                    {...register('condition')}
                    className="w-full px-3.5 py-2.5 bg-[#fbf9f4] border border-[#e4dfd5] rounded-lg text-sm text-[#141310] focus:outline-none focus:border-[#576151] focus:bg-white transition-colors"
                  >
                    <option value="NEW">Mới 100% (Nguyên tag / Chưa qua sử dụng)</option>
                    <option value="LIKE_NEW">Như mới (99% - Mặc diễn 1 lần, form hoàn hảo)</option>
                    <option value="GOOD">Rất tốt (95% - Vải đanh, sạch sẽ, không sờn rách)</option>
                    <option value="FAIR">Tốt (90% - Đã qua giặt sấy nhiều lần)</option>
                  </select>
                </div>
              </div>

              {/* Phụ kiện đi kèm */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#141310] mb-1">
                  Phụ kiện / Chi tiết đi kèm set đồ <span className="text-red-500">*</span>
                </label>
                <input
                  {...register('accessoriesIncluded')}
                  placeholder="Ví dụ: Kèm thắt lưng da, nơ cài áo, móc treo định hình & bao bọc chống bụi..."
                  className="w-full px-3.5 py-2.5 bg-[#fbf9f4] border border-[#e4dfd5] rounded-lg text-sm text-[#141310] placeholder:text-[#9c958b] focus:outline-none focus:border-[#576151] focus:bg-white transition-colors"
                />
                {errors.accessoriesIncluded && (
                  <p className="text-red-600 text-[11px] mt-1">{errors.accessoriesIncluded.message as string}</p>
                )}
              </div>

              {/* Mô tả chất liệu & kiểu dáng */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#141310] mb-1">
                  Mô tả chất liệu, form dáng &amp; lưu ý sử dụng <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={4}
                  {...register('description')}
                  placeholder="Mô tả cụ thể về chất vải (Lụa tơ tằm, Voan, Dạ wool, Tweed...), kiểu dáng ôm hoặc suông, số đo 3 vòng khuyến nghị và các lưu ý giữ gìn khi thuê..."
                  className="w-full px-3.5 py-2.5 bg-[#fbf9f4] border border-[#e4dfd5] rounded-lg text-sm text-[#141310] placeholder:text-[#9c958b] focus:outline-none focus:border-[#576151] focus:bg-white transition-colors"
                />
                {errors.description && <p className="text-red-600 text-[11px] mt-1">{errors.description.message as string}</p>}
              </div>
            </div>

            {/* C. BIỂU PHÍ THUÊ & QUY ĐỊNH BÀN GIAO */}
            <div className="bg-white p-6 rounded-2xl border border-[#ebe8e1] space-y-4 shadow-sm">
              <div className="flex items-center gap-2 pb-3 border-b border-[#f1eee7]">
                <span className="material-symbols-outlined text-[#576151] text-[22px]">payments</span>
                <h2 className="font-serif text-lg font-bold text-[#141310]">
                  C. Biểu phí thuê &amp; Quy định bàn giao trang phục
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#141310] mb-1">
                    Giá thuê theo ngày (VND) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    {...register('pricePerDay')}
                    placeholder="Ví dụ: 180000"
                    className="w-full px-3.5 py-2.5 bg-[#fbf9f4] border border-[#e4dfd5] rounded-lg text-sm text-[#141310] focus:outline-none focus:border-[#576151] focus:bg-white transition-colors"
                  />
                  {errors.pricePerDay && <p className="text-red-600 text-[11px] mt-1">{errors.pricePerDay.message as string}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#141310] mb-1">
                    Tiền cọc bảo đảm (VND) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    {...register('deposit')}
                    placeholder="Ví dụ: 800000"
                    className="w-full px-3.5 py-2.5 bg-[#fbf9f4] border border-[#e4dfd5] rounded-lg text-sm text-[#141310] focus:outline-none focus:border-[#576151] focus:bg-white transition-colors"
                  />
                  {errors.deposit && <p className="text-red-600 text-[11px] mt-1">{errors.deposit.message as string}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#141310] mb-1">
                    Số lượng sẵn có trong kho <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    {...register('totalUnits')}
                    placeholder="1"
                    className="w-full px-3.5 py-2.5 bg-[#fbf9f4] border border-[#e4dfd5] rounded-lg text-sm text-[#141310] focus:outline-none focus:border-[#576151] focus:bg-white transition-colors"
                  />
                  {errors.totalUnits && <p className="text-red-600 text-[11px] mt-1">{errors.totalUnits.message as string}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#141310] mb-1">
                    Thuê tối thiểu (ngày)
                  </label>
                  <input
                    type="number"
                    {...register('minDays')}
                    className="w-full px-3.5 py-2.5 bg-[#fbf9f4] border border-[#e4dfd5] rounded-lg text-sm text-[#141310] focus:outline-none focus:border-[#576151] focus:bg-white transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#141310] mb-1">
                    Thuê tối đa (ngày)
                  </label>
                  <input
                    type="number"
                    {...register('maxDays')}
                    className="w-full px-3.5 py-2.5 bg-[#fbf9f4] border border-[#e4dfd5] rounded-lg text-sm text-[#141310] focus:outline-none focus:border-[#576151] focus:bg-white transition-colors"
                  />
                </div>
              </div>

              {/* MẤY Ô TICK NHỎ CUỐI TRANG ĐỔI THEO TRANG PHỤC */}
              <div className="pt-4 border-t border-[#f1eee7] space-y-2.5">
                <p className="text-xs font-bold uppercase tracking-wider text-[#141310] mb-2">
                  Cam kết chuẩn bị &amp; Bàn giao trang phục:
                </p>

                <label className="flex items-start gap-2.5 text-xs text-[#2c2a26] cursor-pointer group">
                  <input
                    type="checkbox"
                    {...register('handoverRule1')}
                    className="mt-0.5 rounded text-[#576151] focus:ring-[#576151] cursor-pointer"
                  />
                  <span>
                    <strong>Giặt hấp &amp; Khử khuẩn:</strong> Trang phục đã được giặt hấp, ủi phẳng phom dáng và khử khuẩn kỹ càng, sẵn sàng cho người thuê mặc ngay.
                  </span>
                </label>
                {errors.handoverRule1 && <p className="text-red-600 text-[11px] ml-6">{errors.handoverRule1.message as string}</p>}

                <label className="flex items-start gap-2.5 text-xs text-[#2c2a26] cursor-pointer group">
                  <input
                    type="checkbox"
                    {...register('handoverRule2')}
                    className="mt-0.5 rounded text-[#576151] focus:ring-[#576151] cursor-pointer"
                  />
                  <span>
                    <strong>Kiểm tra toàn vẹn:</strong> Đã kiểm tra đầy đủ cúc áo, khóa kéo, đường chỉ may, không có vết ố rách và chụp ảnh đối kiểm trước khi gửi.
                  </span>
                </label>
                {errors.handoverRule2 && <p className="text-red-600 text-[11px] ml-6">{errors.handoverRule2.message as string}</p>}

                <label className="flex items-start gap-2.5 text-xs text-[#2c2a26] cursor-pointer group">
                  <input
                    type="checkbox"
                    {...register('handoverRule3')}
                    className="mt-0.5 rounded text-[#576151] focus:ring-[#576151] cursor-pointer"
                  />
                  <span>
                    <strong>Bao bọc chuyên dụng:</strong> Bàn giao kèm bao bọc chống bụi và móc treo định hình để giữ gìn form dáng trong quá trình vận chuyển.
                  </span>
                </label>
                {errors.handoverRule3 && <p className="text-red-600 text-[11px] ml-6">{errors.handoverRule3.message as string}</p>}
              </div>
            </div>
          </div>

          {/* CỘT PHẢI: LIVE PREVIEW & GỬI DUYỆT */}
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

              <div className="bg-[#fbf9f4] rounded-xl overflow-hidden border border-[#ebe8e1]">
                {/* Ảnh preview */}
                <div className="aspect-[4/3] bg-[#ece7dd] flex items-center justify-center relative overflow-hidden">
                  {coverImage ? (
                    <img src={coverImage} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center p-4 text-[#9c958b]">
                      <span className="material-symbols-outlined text-4xl block mb-1">styler</span>
                      <span className="text-xs">Chưa có ảnh bìa</span>
                    </div>
                  )}
                  {coverImage && (
                    <span className="absolute top-2 right-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded backdrop-blur-sm">
                      {detailImages.length} góc ảnh phụ
                    </span>
                  )}
                </div>

                {/* Thông tin preview */}
                <div className="p-3.5 space-y-1.5">
                  <div className="text-[10px] text-[#576151] font-semibold uppercase tracking-wider">
                    {watchedSizeColor || 'Size S, M, L'}
                  </div>
                  <h4 className="font-serif font-bold text-sm text-[#141310] line-clamp-2 leading-snug">
                    {watchedName || 'Tên trang phục cho thuê mẫu'}
                  </h4>
                  <div className="text-base font-bold text-[#576151] font-mono">
                    {Number(watchedPrice || 0).toLocaleString('vi-VN')} ₫
                    <span className="text-xs text-[#7b766f] font-normal"> / ngày</span>
                  </div>
                  <div className="pt-2 mt-2 border-t border-[#ebe8e1] flex justify-between text-[11px] text-[#7b766f]">
                    <span>Cọc bảo đảm:</span>
                    <strong className="text-[#141310] font-mono">{Number(watchedDeposit || 0).toLocaleString('vi-VN')} ₫</strong>
                  </div>
                  <div className="flex justify-between text-[11px] text-[#7b766f]">
                    <span>Kho sẵn có:</span>
                    <strong className="text-[#141310]">{watchedUnits || 1} bộ/chiếc</strong>
                  </div>
                  <div className="flex justify-between text-[11px] text-[#7b766f]">
                    <span>Thời gian thuê:</span>
                    <strong className="text-[#141310]">{watchedMinDays || 1} - 30 ngày</strong>
                  </div>
                </div>
              </div>

              {/* Nút gửi duyệt */}
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

              <Link
                to="/shop/rent/products"
                className="block text-center text-xs text-[#7b766f] hover:text-[#141310] mt-3 transition-colors"
              >
                Hủy bỏ và quay lại danh sách
              </Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateRentProduct;