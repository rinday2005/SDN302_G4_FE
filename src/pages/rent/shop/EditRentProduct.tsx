import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useShop } from '../../../context/ShopContext';

export const EditRentProduct: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { products, updateProduct } = useShop();

  // Tìm sản phẩm hiện tại trong context theo id (SKU)
  const currentProduct = products.find((p) => p.sku === id) || products[0];

  // State các trường của Form
  const [prodName, setProdName] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [brand, setBrand] = useState<string>('');
  const [mountSensor, setMountSensor] = useState<string>('');
  const [accessories, setAccessories] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [pricePerDay, setPricePerDay] = useState<string>('');
  const [deposit, setDeposit] = useState<string>('');
  const [replacementValue, setReplacementValue] = useState<string>('');
  const [discount7Days, setDiscount7Days] = useState<boolean>(true);
  const [discount30Days, setDiscount30Days] = useState<boolean>(true);
  const [minDays, setMinDays] = useState<number>(2);
  const [maxDays, setMaxDays] = useState<number>(30);
  const [handoverNanuk, setHandoverNanuk] = useState<boolean>(true);
  const [handoverSensorCheck, setHandoverSensorCheck] = useState<boolean>(true);
  const [handoverBatteryCheck, setHandoverBatteryCheck] = useState<boolean>(true);
  const [damagePolicy, setDamagePolicy] = useState<string>('');
  const [listingStatus, setListingStatus] = useState<'active' | 'hidden' | 'draft'>('active');

  // Logic phân quyền chỉnh sửa theo trạng thái bài viết
  const isApproved = currentProduct?.approvalStatus === 'APPROVED';
  const isPending = currentProduct?.approvalStatus === 'PENDING';
  const [requestCoreEdit, setRequestCoreEdit] = useState<boolean>(false);
  const isCoreLocked = isApproved && !requestCoreEdit;

  // Đổ dữ liệu của sản phẩm vào form khi mở trang
  useEffect(() => {
    if (currentProduct) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setProdName(currentProduct.name || '');
      setCategory(currentProduct.category || 'Máy ảnh Medium Format Digital');
      setBrand(currentProduct.brand || '');
      setMountSensor(
        currentProduct.mountSensor ||
        'Hasselblad XCD Mount • Cảm biến CMOS 50MP 43.8×32.9mm • Màu 16-bit 14 Dải Stops (HNCS)'
      );
      setAccessories(
        currentProduct.accessoriesIncluded ||
        '2x Pin sạc Hasselblad 3400mAh nguyên bản, Đốc sạc kép Dual Hub USB-C PD, Cáp Tether Pro Type-C 4.6m, Dây đeo da thuộc thảo mộc thủ công Thụy Điển, Ngàm che nắp sensor & lens caps, Thùng chống sốc Nanuk 910 bọt khí chống ẩm.'
      );
      setDescription(
        currentProduct.description ||
        'Thiết bị được quản lý trực tiếp bởi Atelier Chronos & Optics từ tháng 04/2023. Chỉ phục vụ các dự án Fine-Art Photography nội bộ và các đoàn quay thương mại chọn lọc. Cảm biến định kỳ được vệ sinh tại phòng sạch Class 1000 mỗi 30 ngày.'
      );
      setPricePerDay(currentProduct.pricePerDay ? currentProduct.pricePerDay.toLocaleString() : '450.000');
      setDeposit(currentProduct.deposit ? currentProduct.deposit.toLocaleString() : '16.000.000');
      setReplacementValue(
        currentProduct.replacementValue
          ? currentProduct.replacementValue.toLocaleString()
          : '145.000.000'
      );
      setMinDays(currentProduct.minDays || 2);
      setMaxDays(currentProduct.maxDays || 30);
      setDamagePolicy(
        'Áp dụng chính sách B-Corp Fair Wear & Tear: Các vết xước dăm siêu nhỏ dưới 1mm trên vỏ hợp kim titan do thao tác gắn chân máy hoặc dây đeo thông thường KHÔNG bị trừ tiền cọc. Trừ cọc hoặc yêu cầu đền bù chỉ áp dụng khi: Trầy xước mặt kính thấu kính XCD, cấn móp méo ngàm kim loại, rơi rớt ngập nước hoặc làm gãy chốt tiếp xúc pin.'
      );
      setListingStatus(currentProduct.isVisible ? 'active' : 'hidden');
    }
  }, [currentProduct]);

  if (!currentProduct) {
    return (
      <div className="p-12 text-center text-sm text-[#7b766f]">
        Không tìm thấy sản phẩm yêu cầu.{' '}
        <Link to="/shop/rent/products" className="text-[#141310] underline font-semibold">
          Quay lại danh mục
        </Link>
      </div>
    );
  }

  // Xử lý Lưu Thay Đổi
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const numPrice = Number(pricePerDay.toString().replace(/[^0-9]/g, '')) || 0;
    const numDeposit = Number(deposit.toString().replace(/[^0-9]/g, '')) || 0;
    const numReplacement = Number(replacementValue.toString().replace(/[^0-9]/g, '')) || 0;

    let targetApprovalStatus = currentProduct.approvalStatus;
    const shouldReapprove = isApproved && requestCoreEdit;
    if (shouldReapprove) {
      targetApprovalStatus = 'PENDING';
    }

    // Cập nhật vào ShopContext
    await updateProduct(currentProduct.sku, {
      name: prodName,
      category,
      brand,
      mountSensor,
      accessoriesIncluded: accessories,
      description,
      pricePerDay: numPrice,
      deposit: numDeposit,
      replacementValue: numReplacement,
      minDays,
      maxDays,
      isVisible: listingStatus === 'active',
      approvalStatus: targetApprovalStatus,
    });

    if (shouldReapprove) {
      alert('Đã cập nhật thay đổi! Vì bạn đã sửa đổi thông tin cốt lõi (tên, hãng, giá, cọc), bài viết đã được chuyển sang trạng thái CHỜ DUYỆT (PENDING) để Admin thẩm định lại.');
    } else {
      alert('Đã cập nhật thay đổi hồ sơ lưu ký thiết bị thành công!');
    }
    navigate('/shop/rent/products');
  };

  return (
    <div className="w-full flex flex-col font-sans text-[#1c1c18] bg-[#fdf9f2]">
      {/* Sticky Bottom Controls Bar */}
      <aside
        aria-label="Khung điều khiển lưu trữ nhanh"
        className="fixed bottom-0 left-0 right-0 z-40 bg-[#fdf9f2]/95 backdrop-blur-md shadow-[0_-8px_24px_rgba(41,39,36,0.08)] py-3 px-5 lg:px-12 border-t border-[#dddad3]"
      >
        <div className="max-w-[1360px] mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-[#4a463f] text-xs sm:text-sm">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#d8e3ce] text-[#151e11] shrink-0 font-bold">
              <span className="material-symbols-outlined text-[15px]">info</span>
            </span>
            <span>
              <strong className="font-semibold text-[#141310]">Cơ chế bảo toàn giám định:</strong> Thay đổi cọc &gt;15% hoặc ảnh cảm biến sẽ chuyển trạng thái sang{' '}
              <span className="text-[#141310] font-semibold underline decoration-[#576151]">
                Chờ Admin thẩm duyệt (&lt; 4 giờ)
              </span>
              .
            </span>
          </div>
          <div className="flex items-center gap-2.5 w-full md:w-auto justify-end shrink-0">
            <Link
              to={`/shop/rent/products/${currentProduct.sku}`}
              className="px-3.5 py-2 rounded bg-[#f1ede6] hover:bg-[#ebe8e1] text-[#4a463f] hover:text-[#141310] text-xs font-semibold tracking-wider uppercase transition-colors inline-flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">visibility</span>
              <span>Xem công khai</span>
            </Link>
            <Link
              to="/shop/rent/products"
              className="px-4 py-2 rounded bg-[#ebe8e1] hover:bg-[#dddad3] text-[#1c1c18] text-xs font-semibold tracking-wider uppercase transition-colors"
            >
              Hủy bỏ
            </Link>
            <button
              form="edit-rent-form"
              type="submit"
              className="px-6 py-2 rounded bg-[#141310] hover:bg-[#292724] text-white text-xs font-semibold tracking-wide shadow-md hover:shadow-lg transition-all inline-flex items-center gap-2 uppercase cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">verified_user</span>
              <span>Lưu thay đổi &amp; Cập nhật</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Body */}
      <div className="max-w-[1360px] mx-auto px-5 lg:px-12 py-8 space-y-8 pb-32">
        {/* Breadcrumb Flow */}
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-[11px] font-semibold tracking-wider uppercase text-[#7b766f]">
          <Link to="/shop" className="hover:text-[#141310] transition-colors">
            Bảng điều khiển xưởng
          </Link>
          <span className="text-[#ccc5bc]">/</span>
          <Link to="/shop/rent/products" className="hover:text-[#141310] transition-colors">
            Sản phẩm cho thuê RENT
          </Link>
          <span className="text-[#ccc5bc]">/</span>
          <Link
            to={`/shop/rent/products/${currentProduct.sku}`}
            className="hover:text-[#141310] transition-colors text-[#141310] truncate max-w-[240px] sm:max-w-none"
          >
            {currentProduct.name}
          </Link>
          <span className="text-[#ccc5bc]">/</span>
          <span className="text-[#576151] font-bold">Chỉnh sửa hồ sơ lưu ký</span>
        </nav>

        {/* Header & Meta Strip */}
        <div className="bg-[#f7f3ec] rounded-xl p-6 lg:p-8 shadow-sm border border-[#ebe8e1]">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="px-2.5 py-1 bg-[#d8e3ce] text-[#151e11] text-[11px] uppercase tracking-widest font-semibold rounded inline-flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#576151]"></span>
                  {currentProduct.approvalStatus === 'APPROVED' ? 'ĐÃ DUYỆT (ACTIVE)' : currentProduct.approvalStatus}
                </span>
                <span className="px-2.5 py-1 bg-[#f1ede6] text-[#4a463f] text-[11px] tracking-wider uppercase rounded">
                  SKU: <strong className="text-[#141310] font-semibold">{currentProduct.sku}</strong>
                </span>
                <span className="px-2.5 py-1 bg-[#ebe8e1] text-[#141310] text-[11px] tracking-widest uppercase rounded">
                  Phân loại: {currentProduct.category}
                </span>
              </div>
              <h1 className="font-serif text-3xl lg:text-4xl text-[#141310] tracking-tight font-normal">
                Chỉnh sửa Sản phẩm RENT: {currentProduct.name}
              </h1>
              <div className="flex items-center gap-2 text-[#7b766f] text-xs">
                <span className="material-symbols-outlined text-[#576151] text-[18px]">verified</span>
                <span>
                  Thuộc quyền sở hữu độc quyền của xưởng:{' '}
                  <strong className="text-[#141310] font-semibold">Atelier Chronos &amp; Optics (Chủ xưởng #OWNER-01)</strong> — Tính toàn vẹn được mã hóa qua Sổ cái Lưu ký.
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-auto shrink-0">
              <Link
                to={`/shop/rent/products/${currentProduct.sku}`}
                className="px-4 py-2.5 rounded bg-[#f1ede6] text-[#141310] hover:bg-[#ebe8e1] text-xs font-semibold tracking-wider uppercase transition-colors inline-flex items-center gap-2 shadow-sm"
              >
                <span className="material-symbols-outlined text-[17px]">open_in_new</span>
                <span>Xem trang công khai</span>
              </Link>
              <Link
                to="/shop/rent/products"
                className="px-4 py-2.5 rounded bg-[#ebe8e1] text-[#141310] hover:bg-[#dddad3] text-xs font-semibold tracking-wider uppercase transition-colors"
              >
                Hủy bỏ
              </Link>
              <button
                form="edit-rent-form"
                type="submit"
                className="px-6 py-2.5 rounded bg-[#141310] text-white hover:bg-[#292724] text-xs font-semibold tracking-wide shadow-md hover:shadow-lg transition-all inline-flex items-center gap-2 uppercase cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">save</span>
                <span>Lưu thay đổi</span>
              </button>
            </div>
          </div>
        </div>

        {/* ADMINISTRATIVE STATUS & PERMISSION BANNER */}
        {isApproved ? (
          <div className="bg-[#fcf8f2] border-2 border-[#e6d8c3] rounded-xl p-5 lg:p-6 shadow-sm space-y-4">
            <div className="flex items-start gap-3.5">
              <span className="material-symbols-outlined text-amber-800 text-[28px] shrink-0 mt-0.5">verified_user</span>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-serif text-base sm:text-lg text-[#141310] font-semibold">
                    Sản phẩm ĐÃ ĐƯỢC ADMIN DUYỆT (APPROVED)
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-[#d8e3ce] text-[#2d3829] text-[10px] font-bold tracking-widest uppercase">
                    ĐANG HOẠT ĐỘNG
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-[#4a463f] leading-relaxed">
                  Để bảo vệ quyền lợi hợp đồng và giá trị giao dịch của khách thuê, các trường thông tin cốt lõi (<strong>Tên thiết bị, Thương hiệu, Ngàm cảm biến, Ảnh đại diện, Giá thuê ngày, Tiền cọc Escrow</strong>) đang ở chế độ <strong>Khóa an toàn</strong>. Bạn có thể tự do cập nhật trạng thái ẩn/hiện, mô tả chi tiết, phụ kiện kèm theo và thời hạn thuê.
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-[#ebe3d5] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <span className="text-xs text-[#576151] font-medium flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px]">info</span>
                Nếu cần điều chỉnh giá thuê, tiền cọc hoặc tên máy, vui lòng bật chế độ mở khóa:
              </span>
              <button
                type="button"
                onClick={() => setRequestCoreEdit(!requestCoreEdit)}
                className={`px-3.5 py-1.5 rounded text-xs font-semibold uppercase tracking-wider transition-all flex items-center gap-1.5 shrink-0 ${
                  requestCoreEdit
                    ? 'bg-amber-800 text-white shadow-sm hover:bg-amber-900'
                    : 'bg-white text-[#141310] border border-[#d5cfc4] hover:bg-[#f1ede6]'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">
                  {requestCoreEdit ? 'lock_open' : 'lock_reset'}
                </span>
                <span>{requestCoreEdit ? 'Đang mở khóa cốt lõi (Sẽ chuyển PENDING)' : 'Yêu cầu sửa thông tin cốt lõi'}</span>
              </button>
            </div>

            {requestCoreEdit && (
              <div className="p-3 bg-amber-50 border border-amber-300 rounded-lg text-xs text-amber-900 flex items-center gap-2 animate-fadeIn">
                <span className="material-symbols-outlined text-amber-700 text-[18px] shrink-0">warning</span>
                <span>
                  <strong>Cảnh báo duyệt lại:</strong> Bạn đang mở khóa các trường cốt lõi. Sau khi nhấn <strong>"Lưu thay đổi"</strong>, sản phẩm sẽ tự động chuyển về trạng thái <strong>CHỜ DUYỆT (PENDING)</strong> để Ban quản trị thẩm định lại trước khi tiếp tục cho thuê công khai.
                </span>
              </div>
            )}
          </div>
        ) : isPending ? (
          <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-5 shadow-sm flex items-start gap-3.5">
            <span className="material-symbols-outlined text-blue-700 text-[26px] shrink-0">hourglass_top</span>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-blue-950 text-sm sm:text-base">
                  Sản phẩm ĐANG CHỜ DUYỆT (PENDING)
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold tracking-widest uppercase">
                  TOÀN QUYỀN CHỈNH SỬA
                </span>
              </div>
              <p className="text-xs text-blue-900 leading-relaxed">
                Bài đăng chưa được phê duyệt chính thức. Bạn có toàn quyền chỉnh sửa thoải mái tất cả các trường (tên, mô tả, ảnh chụp, số lượng, giá thuê, tiền cọc...) trước khi Admin xét duyệt.
              </p>
            </div>
          </div>
        ) : null}

        {/* Form Start */}
        <form id="edit-rent-form" onSubmit={handleSubmit} className="space-y-10">
          {/* SECTION 1: Forensic Media & Lens Appraisal Gallery */}
          <section className="bg-white rounded-xl p-6 lg:p-8 shadow-sm border border-[#ebe8e1] space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[#f1ede6] pb-4">
              <div>
                <div className="text-[11px] uppercase tracking-widest text-[#576151] font-semibold">MỤC 01 / HỒ SƠ QUANG HỌC</div>
                <h2 className="font-serif text-xl sm:text-2xl text-[#141310] font-normal">
                  Thư viện Hình ảnh &amp; Hồ sơ Giám định Quang học
                </h2>
              </div>
              <span className="text-[#7b766f] text-xs italic">Tiêu chuẩn chụp: Studio ánh sáng 5500K CRI&gt;95</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Primary Cover Box */}
              <div className="lg:col-span-5 flex flex-col space-y-3">
                <span className="text-xs uppercase tracking-wider text-[#141310] font-semibold">
                  Ảnh bìa đại diện chính thức (Cover Asset)
                </span>
                <div className="relative group rounded-lg overflow-hidden bg-[#f1ede6] shadow-sm aspect-[4/3] flex items-center justify-center border border-[#ebe8e1]">
                  <img src={currentProduct.coverImage} alt={prodName} className="w-full h-full object-cover" />
                  <div className="absolute top-3 left-3 px-2.5 py-1 bg-[#141310]/80 backdrop-blur-md rounded text-white text-[10px] tracking-wider uppercase flex items-center gap-1.5 shadow">
                    <span className="material-symbols-outlined text-[14px] text-[#8fa77b]">verified</span>
                    <span>Ảnh bìa chính thức (Đã thẩm định 4K)</span>
                  </div>
                  <div className="absolute inset-0 bg-[#141310]/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    {isCoreLocked ? (
                      <span className="px-3 py-1.5 rounded bg-gray-200 text-gray-700 text-xs font-semibold tracking-wider uppercase shadow-md flex items-center gap-1 cursor-not-allowed">
                        <span className="material-symbols-outlined text-[14px]">lock</span>
                        Ảnh đã khóa
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => alert('Vui lòng chọn ảnh mới từ máy tính của bạn để tải lên Cloudinary.')}
                        className="px-3 py-1.5 rounded bg-white text-[#141310] text-xs font-semibold tracking-wider uppercase shadow-md hover:bg-[#f1ede6] transition-colors"
                      >
                        Thay đổi ảnh
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-xs text-[#7b766f]">Ảnh bìa sẽ được hiển thị trên danh mục duyệt thiết bị toàn sàn và thông báo hợp đồng thuê.</p>
              </div>

              {/* Forensic Detail Multi-Grid */}
              <div className="lg:col-span-7 flex flex-col space-y-3">
                <span className="text-xs uppercase tracking-wider text-[#141310] font-semibold">
                  3 Ảnh Vi Thấu Kính Giám Định Trạng Thái (Forensic Macro Check)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Macro 1 */}
                  <div className="bg-[#f7f3ec] rounded-lg p-2.5 space-y-2 group shadow-sm border border-[#ebe8e1]">
                    <div className="relative aspect-square rounded overflow-hidden bg-[#f1ede6]">
                      <img
                        className="w-full h-full object-cover"
                        src={
                          currentProduct.inspectionImages?.[0] ||
                          'https://lh3.googleusercontent.com/aida-public/AB6AXuBkf8dxMBkLRFOnSFH9i0r85l3mlvZtI-BLP9wzOXEaIh_N9kB9G8oDzfOaKAMtq3BBKDP7O29x5XGMPbe0o0bPIuMONp-qSvq_ZsPUg567IL_HEIbMPmGBDww51yHMcGOIZ7sgnBRWDGnUZXAkUW1I6_b17TNquxVebYJweRcMcgYW2qOetlZE_5TxflvPOQ5KE65je8r4JYGguO6v3byEkDh3wNLmr7zep_wc3DSH'
                        }
                        alt="Macro 1"
                      />
                      <span className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded bg-[#141310]/85 text-white text-[10px] tracking-wider uppercase">
                        F/16 Spotless
                      </span>
                    </div>
                    <div className="space-y-0.5">
                      <div className="text-xs font-semibold text-[#141310] truncate">Cảm biến &amp; Ngàm XCD</div>
                      <div className="flex items-center justify-between text-[#7b766f] text-[10px]">
                        <span>Kiểm tra: 24/10/2024</span>
                        {isCoreLocked ? (
                          <span className="text-gray-400 text-[10px] flex items-center gap-0.5">
                            <span className="material-symbols-outlined text-[12px]">lock</span> Khóa
                          </span>
                        ) : (
                          <button type="button" className="text-[#576151] hover:underline">Sửa</button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Macro 2 */}
                  <div className="bg-[#f7f3ec] rounded-lg p-2.5 space-y-2 group shadow-sm border border-[#ebe8e1]">
                    <div className="relative aspect-square rounded overflow-hidden bg-[#f1ede6]">
                      <img
                        className="w-full h-full object-cover"
                        src={
                          currentProduct.inspectionImages?.[1] ||
                          'https://lh3.googleusercontent.com/aida-public/AB6AXuBM6W2Vjf_3VsNIM3qy_w4xY271APLIWWKIOjy4ZWfidJkOf8gFqtSyhxW5RgljNLsEv6IqSg_mUFor5F2dTxKW2bh-7JRV-Q2hS8lxLmOQTN9ddMjPBlp3rqRV3Z9K8vmOl5gI6hX6oc5NzAn1Q35kPJurwTN7j3wGvttmP1HFunVIFjRRBOPIcRrvUcGgvBHZJ_LNXfVtGULjzW45aJ2uMGyf-ysDnXp_wL_6V6tq'
                        }
                        alt="Macro 2"
                      />
                      <span className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded bg-[#141310]/85 text-white text-[10px] tracking-wider uppercase">
                        Grade A+
                      </span>
                    </div>
                    <div className="space-y-0.5">
                      <div className="text-xs font-semibold text-[#141310] truncate">Mặt lưng số CFVII 50C</div>
                      <div className="flex items-center justify-between text-[#7b766f] text-[10px]">
                        <span>Kiểm tra: 24/10/2024</span>
                        {isCoreLocked ? (
                          <span className="text-gray-400 text-[10px] flex items-center gap-0.5">
                            <span className="material-symbols-outlined text-[12px]">lock</span> Khóa
                          </span>
                        ) : (
                          <button type="button" className="text-[#576151] hover:underline">Sửa</button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Macro 3 */}
                  <div className="bg-[#f7f3ec] rounded-lg p-2.5 space-y-2 group shadow-sm border border-[#ebe8e1]">
                    <div className="relative aspect-square rounded overflow-hidden bg-[#f1ede6]">
                      <img
                        className="w-full h-full object-cover"
                        src={
                          currentProduct.inspectionImages?.[2] ||
                          'https://lh3.googleusercontent.com/aida-public/AB6AXuBgvqy2t8obF6LuARRa5umWBLc3CX2Fc8nrmV8d76S_C-dfuVPPZODIRxJDoRTYfG01_dauxgLDR5OPH4PNw9tBR6G2V-AeWa8E3BsvcfhS6AB8xmJfn3QXGbS7DbXZUA4FXREAcUycQPjOWer9tZVrF2x0tId0WOLUcmGzK2Xfxm977EyeA6lfuAOBOwAJ3FTcB6qWVf0g5djMozF3ZGj1obJtDyKpvjw8-gbfFZT4'
                        }
                        alt="Macro 3"
                      />
                      <span className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded bg-[#141310]/85 text-white text-[10px] tracking-wider uppercase">
                        Authentic
                      </span>
                    </div>
                    <div className="space-y-0.5">
                      <div className="text-xs font-semibold text-[#141310] truncate">Tem Serial &amp; Vali Nanuk</div>
                      <div className="flex items-center justify-between text-[#7b766f] text-[10px]">
                        <span>Kiểm tra: 24/10/2024</span>
                        {isCoreLocked ? (
                          <span className="text-gray-400 text-[10px] flex items-center gap-0.5">
                            <span className="material-symbols-outlined text-[12px]">lock</span> Khóa
                          </span>
                        ) : (
                          <button type="button" className="text-[#576151] hover:underline">Sửa</button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className={`p-4 rounded-lg bg-[#f7f3ec] transition-colors flex items-center justify-center text-center border border-[#ebe8e1] ${
                  isCoreLocked ? 'opacity-60 cursor-not-allowed' : 'hover:bg-[#f1ede6] cursor-pointer'
                }`}>
                  <div className="space-y-1">
                    <div className="flex items-center justify-center gap-2 text-[#141310] text-xs font-semibold uppercase tracking-wider">
                      <span className="material-symbols-outlined text-[20px]">
                        {isCoreLocked ? 'lock' : 'add_photo_alternate'}
                      </span>
                      <span>{isCoreLocked ? 'Hồ sơ ảnh đã khóa an toàn' : 'Tải lên ảnh bổ sung / Cập nhật hiện trạng hao mòn'}</span>
                    </div>
                    <p className="text-[11px] text-[#7b766f]">
                      {isCoreLocked
                        ? 'Sản phẩm đã được duyệt. Hãy bật yêu cầu sửa thông tin cốt lõi nếu cần thay đổi ảnh thẩm định.'
                        : 'Kéo thả tệp RAW hoặc JPEG chất lượng cao (Tối đa 25MB). Ảnh chụp cần tuân thủ góc sáng trung tính chuẩn studio.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 2: Core Device Specifications & Archival Heritage */}
          <section className="bg-white rounded-xl p-6 lg:p-8 shadow-sm border border-[#ebe8e1] space-y-6">
            <div className="border-b border-[#f1ede6] pb-4">
              <div className="text-[11px] uppercase tracking-widest text-[#576151] font-semibold">MỤC 02 / DANH MỤC &amp; THÔNG SỐ</div>
              <h2 className="font-serif text-xl sm:text-2xl text-[#141310] font-normal">
                Thông tin Cơ bản &amp; Lịch sử Lưu ký Thiết bị
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Item Name */}
              <div className="space-y-2 md:col-span-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs uppercase tracking-wider text-[#141310] font-semibold">
                    Tên niêm yết thiết bị <span className="text-[#ba1a1a]">*</span>
                  </label>
                  {isCoreLocked && (
                    <span className="text-[11px] text-amber-800 font-medium flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">lock</span> Đã khóa (Sản phẩm đã duyệt)
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  required
                  disabled={isCoreLocked}
                  value={prodName}
                  onChange={(e) => setProdName(e.target.value)}
                  className={`w-full px-4 py-3 rounded text-sm focus:outline-none transition-all ${
                    isCoreLocked
                      ? 'bg-[#ebe8e1] text-[#7b766f] cursor-not-allowed border border-[#dddad3]'
                      : 'bg-[#f7f3ec] text-[#141310] font-semibold focus:bg-white border border-transparent focus:border-[#ebe8e1]'
                  }`}
                />
                <span className="text-[11px] text-[#7b766f] block">Tên tiêu đề chuẩn hóa bao gồm Thân máy + Ống kính kit kèm theo.</span>
              </div>

              {/* Category */}
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-wider text-[#141310] font-semibold">
                  Phân loại Danh mục (Taxonomy Hub) <span className="text-[#ba1a1a]">*</span>
                </label>
                <div className="relative">
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full appearance-none px-4 py-3 rounded bg-[#f7f3ec] text-[#141310] text-sm focus:bg-white focus:outline-none border border-transparent focus:border-[#ebe8e1] pr-10 cursor-pointer"
                  >
                    <option value="Máy ảnh Medium Format Digital">Máy ảnh Medium Format Digital</option>
                    <option value="Máy ảnh Film Analog 35mm & 120 Medium">Máy ảnh Film Analog 35mm &amp; 120 Medium</option>
                    <option value="Hybrid Mirrorless Full-Frame">Hybrid Mirrorless Full-Frame</option>
                    <option value="Cinema Video Production & Cages">Cinema Video Production &amp; Cages</option>
                    <option value="Ống kính Prime Thượng hạng (Cine & Stills)">Ống kính Prime Thượng hạng (Cine &amp; Stills)</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-3 pointer-events-none text-[#7b766f] text-[20px]">
                    expand_more
                  </span>
                </div>
              </div>

              {/* Brand */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs uppercase tracking-wider text-[#141310] font-semibold">
                    Thương hiệu / Xuất xứ chế tác <span className="text-[#ba1a1a]">*</span>
                  </label>
                  {isCoreLocked && (
                    <span className="text-[11px] text-amber-800 font-medium flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">lock</span> Khóa
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  required
                  disabled={isCoreLocked}
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  className={`w-full px-4 py-3 rounded text-sm focus:outline-none transition-all ${
                    isCoreLocked
                      ? 'bg-[#ebe8e1] text-[#7b766f] cursor-not-allowed border border-[#dddad3]'
                      : 'bg-[#f7f3ec] text-[#141310] focus:bg-white border border-transparent focus:border-[#ebe8e1]'
                  }`}
                />
              </div>

              {/* Mount & Sensor */}
              <div className="space-y-2 md:col-span-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs uppercase tracking-wider text-[#141310] font-semibold">
                    Hệ quang học &amp; Cấu hình Cảm biến
                  </label>
                  {isCoreLocked && (
                    <span className="text-[11px] text-amber-800 font-medium flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">lock</span> Khóa
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  disabled={isCoreLocked}
                  value={mountSensor}
                  onChange={(e) => setMountSensor(e.target.value)}
                  className={`w-full px-4 py-3 rounded text-sm focus:outline-none transition-all ${
                    isCoreLocked
                      ? 'bg-[#ebe8e1] text-[#7b766f] cursor-not-allowed border border-[#dddad3]'
                      : 'bg-[#f7f3ec] text-[#141310] focus:bg-white border border-transparent focus:border-[#ebe8e1]'
                  }`}
                />
              </div>

              {/* Accessories Included */}
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs uppercase tracking-wider text-[#141310] font-semibold">
                  Phụ kiện bàn giao đồng bộ trong Vali
                </label>
                <textarea
                  rows={2}
                  value={accessories}
                  onChange={(e) => setAccessories(e.target.value)}
                  className="w-full px-4 py-3 rounded bg-[#f7f3ec] text-[#141310] text-sm focus:bg-white focus:outline-none border border-transparent focus:border-[#ebe8e1] transition-all"
                />
              </div>

              {/* Archival Narrative */}
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs uppercase tracking-wider text-[#141310] font-semibold">
                  Mô tả Thiết bị &amp; Lịch sử Giữ gìn Lưu ký (Archival Provenance Log)
                </label>
                <textarea
                  rows={5}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-3 rounded bg-[#f7f3ec] text-[#141310] text-sm focus:bg-white focus:outline-none border border-transparent focus:border-[#ebe8e1] transition-all leading-relaxed"
                />
                <div className="flex items-center justify-between text-[#7b766f] text-xs">
                  <span>Độ dài: {description.split(/\s+/).filter(Boolean).length} từ (Đạt chuẩn mô tả hiện vật)</span>
                  <span className="text-[#576151] font-semibold">Hỗ trợ Markdown cơ bản</span>
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 3: Pricing, Smart Escrow Deposit & Cycle Discounts */}
          <section className="bg-white rounded-xl p-6 lg:p-8 shadow-sm border border-[#ebe8e1] space-y-6">
            <div className="border-b border-[#f1ede6] pb-4">
              <div className="text-[11px] uppercase tracking-widest text-[#576151] font-semibold">MỤC 03 / TÀI CHÍNH &amp; KÝ QUỸ</div>
              <h2 className="font-serif text-xl sm:text-2xl text-[#141310] font-normal">
                Biểu phí Thuê, Ký quỹ Smart Escrow &amp; Chiết khấu
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Daily Rent Rate */}
              <div className="space-y-2 bg-[#f7f3ec] p-4 rounded-lg border border-[#ebe8e1]">
                <div className="flex items-center justify-between">
                  <label className="text-xs uppercase tracking-wider text-[#141310] font-semibold">
                    Giá thuê / Ngày <span className="text-[#ba1a1a]">*</span>
                  </label>
                  {isCoreLocked ? (
                    <span className="text-[10px] font-semibold text-amber-800 flex items-center gap-0.5">
                      <span className="material-symbols-outlined text-[13px]">lock</span> Khóa
                    </span>
                  ) : (
                    <span className="text-[11px] px-2 py-0.5 rounded bg-[#ebe8e1] text-[#141310]">VND / 24 Giờ</span>
                  )}
                </div>
                <div className="relative">
                  <input
                    type="text"
                    required
                    disabled={isCoreLocked}
                    value={pricePerDay}
                    onChange={(e) => setPricePerDay(e.target.value)}
                    className={`w-full px-4 py-3 rounded font-serif text-xl font-bold focus:outline-none transition-all ${
                      isCoreLocked
                        ? 'bg-[#ebe8e1] text-[#7b766f] cursor-not-allowed border border-[#dddad3]'
                        : 'bg-white text-[#141310] border border-[#ebe8e1]'
                    }`}
                  />
                </div>
                <p className="text-[11px] text-[#7b766f] flex items-center gap-1.5 pt-1">
                  <span className="material-symbols-outlined text-[15px] text-[#576151]">update</span>
                  <span>{isCoreLocked ? 'Cần mở khóa để sửa giá thuê.' : 'Cập nhật giá sẽ áp dụng cho đơn đặt mới sau 5 phút.'}</span>
                </p>
              </div>

              {/* Escrow Deposit */}
              <div className="space-y-2 bg-[#f7f3ec] p-4 rounded-lg border border-[#ebe8e1]">
                <div className="flex items-center justify-between">
                  <label className="text-xs uppercase tracking-wider text-[#141310] font-semibold">
                    Ký quỹ Escrow <span className="text-[#ba1a1a]">*</span>
                  </label>
                  {isCoreLocked ? (
                    <span className="text-[10px] font-semibold text-amber-800 flex items-center gap-0.5">
                      <span className="material-symbols-outlined text-[13px]">lock</span> Khóa
                    </span>
                  ) : (
                    <span className="text-[11px] px-2 py-0.5 rounded bg-[#d8e3ce] text-[#151e11] font-semibold">Tạm giữ an toàn</span>
                  )}
                </div>
                <div className="relative">
                  <input
                    type="text"
                    required
                    disabled={isCoreLocked}
                    value={deposit}
                    onChange={(e) => setDeposit(e.target.value)}
                    className={`w-full px-4 py-3 rounded font-serif text-xl font-bold focus:outline-none transition-all ${
                      isCoreLocked
                        ? 'bg-[#ebe8e1] text-[#7b766f] cursor-not-allowed border border-[#dddad3]'
                        : 'bg-white text-[#141310] border border-[#ebe8e1]'
                    }`}
                  />
                </div>
                <p className="text-[11px] text-[#7b766f] flex items-center gap-1.5 pt-1">
                  <span className="material-symbols-outlined text-[15px] text-[#ba1a1a]">warning</span>
                  <span>{isCoreLocked ? 'Tiền cọc bị khóa bảo vệ an toàn.' : 'Thay đổi >15% cần Admin thẩm định lại.'}</span>
                </p>
              </div>

              {/* Replacement Value */}
              <div className="space-y-2 bg-[#f7f3ec] p-4 rounded-lg border border-[#ebe8e1]">
                <div className="flex items-center justify-between">
                  <label className="text-xs uppercase tracking-wider text-[#141310] font-semibold">Định mức bồi hoàn</label>
                  {isCoreLocked ? (
                    <span className="text-[10px] font-semibold text-amber-800 flex items-center gap-0.5">
                      <span className="material-symbols-outlined text-[13px]">lock</span> Khóa
                    </span>
                  ) : (
                    <span className="text-[11px] px-2 py-0.5 rounded bg-[#ebe8e1] text-[#7b766f]">Bảo hiểm thân máy</span>
                  )}
                </div>
                <div className="relative">
                  <input
                    type="text"
                    disabled={isCoreLocked}
                    value={replacementValue}
                    onChange={(e) => setReplacementValue(e.target.value)}
                    className={`w-full px-4 py-3 rounded font-serif text-xl font-bold focus:outline-none transition-all ${
                      isCoreLocked
                        ? 'bg-[#ebe8e1] text-[#7b766f] cursor-not-allowed border border-[#dddad3]'
                        : 'bg-white text-[#141310] border border-[#ebe8e1]'
                    }`}
                  />
                </div>
                <p className="text-[11px] text-[#7b766f] flex items-center gap-1.5 pt-1">
                  <span className="material-symbols-outlined text-[15px] text-[#576151]">verified</span>
                  <span>Căn cứ hợp đồng bảo hiểm rủi ro hư hại toàn phần.</span>
                </p>
              </div>
            </div>

            {/* Long-term discounts */}
            <div className="bg-[#f7f3ec] rounded-lg p-5 space-y-3 border border-[#ebe8e1]">
              <div className="text-xs uppercase font-semibold text-[#141310] flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-[#576151]">savings</span>
                <span>Chính sách Chiết khấu Chu kỳ Dài hạn (Áp dụng tự động tại Checkout)</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                <label className="flex items-start gap-3 p-3 rounded bg-white cursor-pointer shadow-sm border border-[#ebe8e1]">
                  <input
                    type="checkbox"
                    checked={discount7Days}
                    onChange={(e) => setDiscount7Days(e.target.checked)}
                    className="mt-1 w-4 h-4 text-[#141310] rounded accent-[#141310]"
                  />
                  <div className="space-y-0.5">
                    <span className="text-xs font-semibold text-[#141310]">Giảm 10% khi thuê từ 7 ngày trở lên (Weekly Tier)</span>
                    <p className="text-[11px] text-[#7b766f]">Áp dụng cho các dự án quay chụp ngoại tỉnh hoặc tuần lễ triển lãm.</p>
                  </div>
                </label>
                <label className="flex items-start gap-3 p-3 rounded bg-white cursor-pointer shadow-sm border border-[#ebe8e1]">
                  <input
                    type="checkbox"
                    checked={discount30Days}
                    onChange={(e) => setDiscount30Days(e.target.checked)}
                    className="mt-1 w-4 h-4 text-[#141310] rounded accent-[#141310]"
                  />
                  <div className="space-y-0.5">
                    <span className="text-xs font-semibold text-[#141310]">Giảm 20% khi thuê từ 30 ngày trở lên (Monthly Studio Tier)</span>
                    <p className="text-[11px] text-[#7b766f]">Dành riêng cho nghệ sĩ thực hiện đồ án dài hạn hoặc sản xuất studio chuyên nghiệp.</p>
                  </div>
                </label>
              </div>
            </div>
          </section>

          {/* SECTION 4: Rental Terms, Fair Wear & Tear Policy */}
          <section className="bg-white rounded-xl p-6 lg:p-8 shadow-sm border border-[#ebe8e1] space-y-6">
            <div className="border-b border-[#f1ede6] pb-4">
              <div className="text-[11px] uppercase tracking-widest text-[#576151] font-semibold">MỤC 04 / NGUYÊN TẮC BẢO QUẢN</div>
              <h2 className="font-serif text-xl sm:text-2xl text-[#141310] font-normal">
                Quy định Thuê, Giới hạn Thời gian &amp; Tiêu chuẩn Bàn giao
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-wider text-[#141310] font-semibold">Thời gian thuê tối thiểu</label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={minDays}
                    onChange={(e) => setMinDays(Number(e.target.value))}
                    className="w-24 px-4 py-2.5 rounded bg-[#f7f3ec] text-[#141310] font-semibold text-sm focus:outline-none border border-[#ebe8e1]"
                  />
                  <span className="text-xs text-[#7b766f]">Ngày (Tối thiểu 48 tiếng để đảm bảo chi phí bàn giao)</span>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-wider text-[#141310] font-semibold">Thời gian thuê tối đa mỗi lượt</label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={7}
                    max={90}
                    value={maxDays}
                    onChange={(e) => setMaxDays(Number(e.target.value))}
                    className="w-24 px-4 py-2.5 rounded bg-[#f7f3ec] text-[#141310] font-semibold text-sm focus:outline-none border border-[#ebe8e1]"
                  />
                  <span className="text-xs text-[#7b766f]">Ngày (Quá hạn 30 ngày cần đưa về xưởng kiểm định định kỳ)</span>
                </div>
              </div>

              {/* Handover Protocols */}
              <div className="md:col-span-2 space-y-3">
                <label className="text-xs uppercase tracking-wider text-[#141310] font-semibold">
                  Biên bản Bàn giao &amp; Kiểm định Bắt buộc tại Atelier
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <label className="flex items-center gap-2.5 p-3 rounded bg-[#f7f3ec] text-xs text-[#141310] border border-[#ebe8e1] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={handoverNanuk}
                      onChange={(e) => setHandoverNanuk(e.target.checked)}
                      className="w-4 h-4 rounded accent-[#141310]"
                    />
                    <span>Bàn giao kèm Vali Nanuk chống ẩm</span>
                  </label>
                  <label className="flex items-center gap-2.5 p-3 rounded bg-[#f7f3ec] text-xs text-[#141310] border border-[#ebe8e1] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={handoverSensorCheck}
                      onChange={(e) => setHandoverSensorCheck(e.target.checked)}
                      className="w-4 h-4 rounded accent-[#141310]"
                    />
                    <span>Soi cảm biến tại 3 khẩu độ (f/4, f/11, f/22)</span>
                  </label>
                  <label className="flex items-center gap-2.5 p-3 rounded bg-[#f7f3ec] text-xs text-[#141310] border border-[#ebe8e1] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={handoverBatteryCheck}
                      onChange={(e) => setHandoverBatteryCheck(e.target.checked)}
                      className="w-4 h-4 rounded accent-[#141310]"
                    />
                    <span>Sạc pin tối thiểu 50% trước khi xuất kho</span>
                  </label>
                </div>
              </div>

              {/* Damage policy */}
              <div className="md:col-span-2 space-y-2">
                <label className="text-xs uppercase tracking-wider text-[#141310] font-semibold">
                  Chính sách Hao mòn Tự nhiên &amp; Bồi thường Rủi ro (Damage Protocol)
                </label>
                <textarea
                  rows={3}
                  value={damagePolicy}
                  onChange={(e) => setDamagePolicy(e.target.value)}
                  className="w-full px-4 py-3 rounded bg-[#f7f3ec] text-[#141310] text-xs leading-relaxed focus:bg-white focus:outline-none border border-transparent focus:border-[#ebe8e1] transition-all"
                />
              </div>
            </div>
          </section>

          {/* SECTION 5: Serialized Inventory Units & Immutable Historical Ledger */}
          <section className="bg-white rounded-xl p-6 lg:p-8 shadow-sm border border-[#ebe8e1] space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#f1ede6] pb-4">
              <div>
                <div className="text-[11px] uppercase tracking-widest text-[#576151] font-semibold">MỤC 05 / KHO HIỆN VẬT &amp; SỐ LƯỢNG LƯU KÝ</div>
                <h2 className="font-serif text-xl sm:text-2xl text-[#141310] font-normal">
                  Thông tin Kho Hiện vật &amp; Tính Toàn vẹn Dữ liệu
                </h2>
              </div>
              <Link
                to="/shop/rent/inventory"
                className="px-4 py-2 rounded bg-[#ebe8e1] hover:bg-[#dddad3] text-[#141310] text-xs uppercase tracking-wider font-semibold transition-colors inline-flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[17px]">add_box</span>
                <span>Nhập thêm thân máy mới vào kho</span>
              </Link>
            </div>

            {/* Immutability note */}
            <div className="p-4 rounded-lg bg-[#f1ede6] flex items-start gap-3 border border-[#ebe8e1]">
              <span className="material-symbols-outlined text-[#141310] text-[22px] shrink-0 mt-0.5">lock</span>
              <div className="space-y-1">
                <div className="font-semibold text-xs text-[#141310]">
                  Hồ sơ lịch sử kho, số vòng luân chuyển và nhật ký giám định không thể chỉnh sửa hoặc ghi đè
                </div>
                <p className="text-xs text-[#4a463f]">
                  Nhằm đảm bảo tính bất biến của Sổ cái Lưu ký Provenance Ledger, bạn chỉ có thể cập nhật trạng thái khả dụng của từng máy hoặc ghi nhận hiện vật mới. Không thể can thiệp số serial đã ký hợp đồng hay sửa dữ liệu giao dịch tài chính quá khứ từ trang này.
                </p>
              </div>
            </div>

            {/* Units Table */}
            <div className="overflow-x-auto rounded-lg border border-[#ebe8e1]">
              <table className="w-full text-left text-xs text-[#141310]">
                <thead>
                  <tr className="bg-[#f1ede6] uppercase tracking-wider text-[#4a463f] font-semibold">
                    <th className="py-3 px-4">Đơn vị (Unit ID)</th>
                    <th className="py-3 px-4">Số Serial Khắc (SN)</th>
                    <th className="py-3 px-4">Trạng thái Hoạt động</th>
                    <th className="py-3 px-4">Vị trí Lưu trữ / Đơn hàng</th>
                    <th className="py-3 px-4">Chu kỳ Hoàn tất</th>
                    <th className="py-3 px-4 text-right">Quyền Can thiệp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f1ede6]">
                  <tr className="hover:bg-[#f7f3ec] transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-[#141310]">Unit #01</td>
                    <td className="py-3.5 px-4 font-mono font-medium">SN #HB-907-88201</td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#f0e0cb] text-[#4f4535] text-[11px] font-semibold uppercase">
                        <span className="material-symbols-outlined text-[13px]">sync_alt</span>
                        Đang cho thuê
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-[#7b766f]">
                      Đơn <span className="font-semibold text-[#141310]">#RH-RNT-2024-8845</span> • Khách Elena Rostova
                    </td>
                    <td className="py-3.5 px-4 font-medium">8 chu kỳ trọn vẹn</td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="inline-flex items-center gap-1 text-[#7b766f] text-[11px] italic" title="Đang có hợp đồng còn hiệu lực">
                        <span className="material-symbols-outlined text-[15px]">lock</span>
                        Đang khóa (In-Rent)
                      </span>
                    </td>
                  </tr>
                  <tr className="hover:bg-[#f7f3ec] transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-[#141310]">Unit #02</td>
                    <td className="py-3.5 px-4 font-mono font-medium">SN #HB-907-88202</td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#d8e3ce] text-[#151e11] text-[11px] font-semibold uppercase">
                        <span className="material-symbols-outlined text-[13px]">check_circle</span>
                        Sẵn sàng xuất kho
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-[#7b766f]">Tủ ẩm A2, Q.1, TP.HCM • Tình trạng Mint- 98.5%</td>
                    <td className="py-3.5 px-4 font-medium">4 chu kỳ trọn vẹn</td>
                    <td className="py-3.5 px-4 text-right">
                      <button type="button" className="text-[#576151] hover:underline text-xs font-semibold uppercase cursor-pointer">
                        Đổi vị trí tủ
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between text-[#7b766f] text-xs pt-1">
              <span>Tổng số máy đang ký quỹ trên sàn: <strong>02 thân máy độc lập</strong></span>
              <span className="text-[#576151]">Chỉ số quay vòng khấu hao: <strong>94.2% Hoàn hảo</strong></span>
            </div>
          </section>

          {/* SECTION 6: Visibility & Publishing Status */}
          <section className="bg-white rounded-xl p-6 lg:p-8 shadow-sm border border-[#ebe8e1] space-y-6">
            <div className="border-b border-[#f1ede6] pb-4">
              <div className="text-[11px] uppercase tracking-widest text-[#576151] font-semibold">MỤC 06 / QUẢN TRỊ TRẠNG THÁI</div>
              <h2 className="font-serif text-xl sm:text-2xl text-[#141310] font-normal">
                Cài đặt Hiển thị &amp; Trạng thái Hoạt động trên Sàn
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Active Public */}
              <label className="relative p-5 rounded-lg bg-[#f7f3ec] hover:bg-[#f1ede6] cursor-pointer transition-colors flex flex-col justify-between space-y-3 border border-[#ebe8e1]">
                <div className="flex items-start justify-between">
                  <input
                    type="radio"
                    name="listing_status"
                    value="active"
                    checked={listingStatus === 'active'}
                    onChange={() => setListingStatus('active')}
                    className="mt-1 w-4 h-4 accent-[#141310]"
                  />
                  <span className="px-2 py-0.5 rounded bg-[#d8e3ce] text-[#151e11] text-[10px] font-semibold uppercase tracking-wider">
                    Khuyến nghị
                  </span>
                </div>
                <div className="space-y-1">
                  <span className="text-sm font-semibold text-[#141310] block">Công khai hiển thị trên sàn</span>
                  <p className="text-xs text-[#7b766f]">
                    Sản phẩm xuất hiện trong danh mục /rent, cho phép người dùng đặt cọc và chọn lịch bàn giao ngay lập tức.
                  </p>
                </div>
              </label>

              {/* Temporarily Hidden */}
              <label className="relative p-5 rounded-lg bg-[#f7f3ec] hover:bg-[#f1ede6] cursor-pointer transition-colors flex flex-col justify-between space-y-3 border border-[#ebe8e1]">
                <div className="flex items-start justify-between">
                  <input
                    type="radio"
                    name="listing_status"
                    value="hidden"
                    checked={listingStatus === 'hidden'}
                    onChange={() => setListingStatus('hidden')}
                    className="mt-1 w-4 h-4 accent-[#141310]"
                  />
                  <span className="px-2 py-0.5 rounded bg-[#ebe8e1] text-[#7b766f] text-[10px] font-semibold uppercase tracking-wider">
                    Tạm dừng
                  </span>
                </div>
                <div className="space-y-1">
                  <span className="text-sm font-semibold text-[#141310] block">Tạm ẩn khỏi sàn cho thuê</span>
                  <p className="text-xs text-[#7b766f]">
                    Áp dụng khi toàn bộ máy đang bảo dưỡng định kỳ, xưởng nghỉ lễ hoặc chuẩn bị chuyển giao địa điểm.
                  </p>
                </div>
              </label>

              {/* Draft Mode */}
              <label className="relative p-5 rounded-lg bg-[#f7f3ec] hover:bg-[#f1ede6] cursor-pointer transition-colors flex flex-col justify-between space-y-3 border border-[#ebe8e1]">
                <div className="flex items-start justify-between">
                  <input
                    type="radio"
                    name="listing_status"
                    value="draft"
                    checked={listingStatus === 'draft'}
                    onChange={() => setListingStatus('draft')}
                    className="mt-1 w-4 h-4 accent-[#141310]"
                  />
                  <span className="px-2 py-0.5 rounded bg-[#ebe8e1] text-[#7b766f] text-[10px] font-semibold uppercase tracking-wider">
                    Nội bộ
                  </span>
                </div>
                <div className="space-y-1">
                  <span className="text-sm font-semibold text-[#141310] block">Lưu thành bản nháp nội bộ</span>
                  <p className="text-xs text-[#7b766f]">
                    Chỉ hiển thị với chủ xưởng Atelier Chronos &amp; Optics. Chưa kích hoạt chu trình ký hợp đồng khách hàng.
                  </p>
                </div>
              </label>
            </div>
          </section>

          {/* Bottom Card Action Summary */}
          <div className="bg-[#f1ede6] rounded-xl p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 border border-[#ebe8e1]">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[#576151] text-[24px]">verified</span>
              <div>
                <div className="font-semibold text-sm text-[#141310]">Sẵn sàng áp dụng cập nhật hồ sơ?</div>
                <div className="text-xs text-[#7b766f]">Mọi thông số kỹ thuật được đối chiếu tự động với tiêu chuẩn giám định ống kính ReUse Hub.</div>
              </div>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <Link
                to="/shop/rent/products"
                className="px-5 py-2.5 rounded bg-[#ebe8e1] hover:bg-[#dddad3] text-[#141310] text-xs uppercase tracking-wider font-semibold transition-colors"
              >
                Hủy thay đổi
              </Link>
              <button
                type="submit"
                className="px-7 py-2.5 rounded bg-[#141310] hover:bg-[#292724] text-white text-xs font-semibold tracking-wide shadow-md hover:shadow-lg transition-all inline-flex items-center gap-2 uppercase cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">done_all</span>
                <span>Lưu thay đổi &amp; Cập nhật</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};