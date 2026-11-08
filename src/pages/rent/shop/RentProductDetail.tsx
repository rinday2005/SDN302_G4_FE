import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useShop } from '../../../context/ShopContext';
import { getUnitVariantAndCondition } from '../../../utils/inventoryUnitHelper';
export const RentProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { products } = useShop();

  // Lấy dữ liệu sản phẩm tương ứng từ MongoDB ShopContext
  const matchedProduct = products.find((p) => p.sku === id || (p as { _id?: string })._id === id);
  const product = matchedProduct || products[0];

  // Danh sách ảnh 4 góc giám định
  const inspectionAngleImages = product?.inspectionImages?.length
    ? product.inspectionImages
    : product?.coverImage
    ? [product.coverImage]
    : [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuB5mewsMdaznDQrFK3uXQ0ihH8fVJyGA-WwquJd7sHBRJcbcASR1h27dY0EvVQTUaE69efi0nc6VSjoejNknSYsRdmO8MUGxl8UfYvNkQwMYFHbcvEBLKUrbsKj7QJfR8VzHSex4ytaneQ6Vfe5TMT_tFbtg-wysYGL3leviHOWD9x2ksGBMixc-9RCj_42X9g8exMpZ2BuvEwG0WbMj1VoX5TIamV0rJ0SdTxOKs8D',
    ];

  const [selectedAngleIndex, setSelectedAngleIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const handlePauseToggle = () => {
    if (!product) return;
    const confirmed = window.confirm(
      isPaused
        ? 'Bạn có muốn mở lại cho thuê sản phẩm này?'
        : `Bạn có chắc muốn tạm dừng cho thuê SKU ${product.sku}? Sản phẩm sẽ tạm thời ẩn khỏi trang tìm kiếm công khai.`
    );
    if (confirmed) {
      setIsPaused(!isPaused);
    }
  };

  if (!product) {
    return (
      <div className="w-full min-h-[60vh] flex flex-col items-center justify-center p-8 bg-[#fdf9f2] text-center font-sans">
        <span className="material-symbols-outlined text-4xl text-[#7b766f] mb-3">inventory_2</span>
        <h2 className="font-serif text-2xl text-[#141310] mb-2">Chưa tìm thấy sản phẩm</h2>
        <p className="text-xs text-[#7b766f] mb-6">Sản phẩm có thể chưa được tạo hoặc chưa đồng bộ từ cơ sở dữ liệu.</p>
        <Link to="/shop/rent/products" className="px-5 py-2.5 rounded bg-[#141310] text-white text-xs font-semibold uppercase tracking-wider">
          Về danh sách sản phẩm
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col font-sans text-[#1c1c18] bg-[#fdf9f2]">
      {/* Top Context Navigation & Editorial Status Bar */}
      <section className="max-w-[1440px] w-full mx-auto px-5 lg:px-12 py-6">
        <div className="flex flex-col gap-6">
          {/* Breadcrumbs & SKU Anchor */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-[#7b766f]">
              <Link to="/shop" className="hover:text-[#141310] transition-colors flex items-center gap-1.5 font-medium">
                <span className="material-symbols-outlined text-[16px]">domain</span>
                <span>Bảng điều khiển xưởng</span>
              </Link>
              <span className="material-symbols-outlined text-[14px] text-[#ccc5bc]">chevron_right</span>
              <Link to="/shop/rent/products" className="hover:text-[#141310] transition-colors font-medium">
                Sản phẩm cho thuê RENT
              </Link>
              <span className="material-symbols-outlined text-[14px] text-[#ccc5bc]">chevron_right</span>
              <span className="text-[#141310] font-medium truncate max-w-[280px] sm:max-w-md">{product.name}</span>
            </nav>
            <div className="flex items-center gap-2 text-[11px] tracking-widest text-[#4a463f] uppercase bg-[#f7f3ec] px-3 py-1.5 rounded shadow-sm border border-[#ebe8e1]">
              <span>MÃ SKU:</span>
              <span className="font-bold text-[#141310]">{product.sku}</span>
              <span className="text-[#ccc5bc]">•</span>
              <span>QUY CHUẨN XƯỞNG #882</span>
            </div>
          </div>

          {/* Header Title & Master Control Suite */}
          <div className="bg-white rounded-xl p-6 lg:p-8 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative overflow-hidden border border-[#ebe8e1]">
            <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-[#576151]/10 pointer-events-none blur-2xl"></div>
            <div className="flex flex-col gap-3 max-w-3xl">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-[#d8e3ce]/60 text-[#3f4a3a] text-xs uppercase tracking-wider font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#576151] animate-pulse"></span>
                  {product.approvalStatus === 'APPROVED' ? 'ĐÃ DUYỆT (ACTIVE)' : product.approvalStatus}
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-[#f1ede6] text-[#4a463f] text-xs uppercase tracking-wider font-medium">
                  <span className="material-symbols-outlined text-[14px] text-[#576151]">inventory</span>
                  SẴN SÀNG CHO THUÊ
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-[#f0e0cb]/50 text-[#4f4535] text-xs uppercase tracking-wider font-medium">
                  <span className="material-symbols-outlined text-[14px] text-[#4f4535]">verified_user</span>
                  BẢO CHỨNG SMART ESCROW 100%
                </span>
              </div>
              <h1 className="font-serif text-3xl lg:text-4xl text-[#141310] tracking-tight leading-tight">
                {product.name}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-[#7b766f] text-xs">
                <span className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-[#576151]">verified</span>
                  Xưởng phụ trách: <strong className="text-[#141310]">Atelier Chronos &amp; Optics</strong> (Phạm Thùy Dương)
                </span>
                <span className="text-[#ccc5bc]">•</span>
                <span>Định danh máy: <strong>#HB-907-88201 / #HB-907-88202</strong></span>
                <span className="text-[#ccc5bc]">•</span>
                <span>Hiệu chuẩn bảo tàng 16-bit Hasselblad Natural Colour</span>
              </div>
            </div>

            {/* Action Toolbar */}
            <div className="flex flex-wrap lg:flex-nowrap items-center gap-2.5 shrink-0 z-10">
              <Link
                to={`/shop/rent/edit/${product.sku}`}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded bg-[#141310] text-white hover:bg-[#292724] transition-all shadow-sm text-xs tracking-wider uppercase font-semibold"
              >
                <span className="material-symbols-outlined text-[18px]">edit_note</span>
                <span>Chỉnh sửa sản phẩm</span>
              </Link>
              <Link
                to="/shop/rent/inventory"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded bg-[#f1ede6] text-[#141310] hover:bg-[#ebe8e1] transition-colors text-xs tracking-wider uppercase font-medium"
              >
                <span className="material-symbols-outlined text-[18px]">qr_code_scanner</span>
                <span>Quản lý kho hiện vật</span>
              </Link>
              <Link
                to="/rent"
                target="_blank"
                className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded bg-[#f7f3ec] text-[#4a463f] hover:text-[#141310] hover:bg-[#ebe8e1] transition-colors text-xs tracking-wider uppercase"
                title="Xem giao diện công khai trên sàn"
              >
                <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                <span className="hidden sm:inline">Xem trang công khai</span>
              </Link>
              <button
                type="button"
                onClick={handlePauseToggle}
                className={`inline-flex items-center gap-1.5 px-3 py-2.5 rounded text-xs uppercase tracking-wider transition-colors ${isPaused ? 'text-[#ba1a1a] font-bold bg-[#ffdad6]/40' : 'text-[#7b766f] hover:text-[#ba1a1a] hover:bg-[#ffdad6]/40'
                  }`}
                title="Tạm ngưng niêm yết trong kho"
              >
                <span className="material-symbols-outlined text-[18px]">{isPaused ? 'pause' : 'pause_circle'}</span>
                <span className="hidden xl:inline">{isPaused ? 'Đã tạm dừng' : 'Tạm dừng cho thuê'}</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Layout */}
      <main className="max-w-[1440px] w-full mx-auto px-5 lg:px-12 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT COLUMN (8 cols): Visual Archival & Provenance Dossier */}
          <div className="lg:col-span-8 flex flex-col gap-8">
            {/* SECTION A: Image Gallery & Forensic Inspection */}
            <section className="bg-white rounded-xl p-6 lg:p-8 shadow-sm border border-[#ebe8e1]">
              <div className="flex items-center justify-between pb-4 mb-6 border-b border-[#f1ede6]">
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-[#576151] text-[22px]">photo_camera</span>
                  <h2 className="font-serif text-xl text-[#141310]">Thư viện Giám định Hiện vật &amp; Hồ sơ Quang học</h2>
                </div>
                <span className="text-[11px] uppercase tracking-widest text-[#7b766f] bg-[#f1ede6] px-2.5 py-1 rounded">
                  TIÊU CHUẨN ĐỘ PHÂN GIẢI 4K RAW
                </span>
              </div>

              {/* Hero Focus Visual */}
              <div className="relative w-full aspect-[16/10] bg-[#ebe8e1] rounded-lg overflow-hidden group shadow-inner">
                <img
                  src={inspectionAngleImages[selectedAngleIndex] || product.coverImage}
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#141310]/80 via-transparent to-transparent opacity-80 pointer-events-none"></div>
                <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                  <span className="px-2.5 py-1 rounded bg-[#141310]/80 backdrop-blur-md text-white text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[14px] text-[#8fa77b]">biotech</span>
                    Giám định Sensor: 100% Không trầy xước
                  </span>
                  <span className="px-2.5 py-1 rounded bg-white/90 backdrop-blur-md text-[#141310] text-[11px] uppercase tracking-wider">
                    ISO Cân chỉnh: ISO 100-25600 OK
                  </span>
                </div>
                <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between text-white pointer-events-none">
                  <div>
                    <div className="text-sm font-semibold">Góc chụp toàn cảnh: Thân máy 907X + Lưng số CFVII 50C + Lens XCD 45P</div>
                    <div className="text-xs text-[#cbc6c1]">Giám định viên: Marcus Vance • Phòng lab kiểm định quang học ReUse Hub Quận 1</div>
                  </div>
                  <div className="pointer-events-auto">
                    <button
                      type="button"
                      onClick={() => setIsLightboxOpen(true)}
                      className="px-3 py-1.5 rounded bg-white/90 text-[#141310] hover:bg-white transition-colors text-xs tracking-wider uppercase flex items-center gap-1.5 shadow-sm font-semibold"
                    >
                      <span className="material-symbols-outlined text-[16px]">fullscreen</span>
                      Phóng to 100%
                    </button>
                  </div>
                </div>
              </div>

              {/* Multi-Angle Thumbnails */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                {inspectionAngleImages.slice(0, 4).map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedAngleIndex(idx)}
                    className={`relative aspect-square rounded overflow-hidden bg-[#f1ede6] group text-left shadow-sm transition-all ${selectedAngleIndex === idx ? 'ring-2 ring-[#141310]' : 'hover:opacity-90'
                      }`}
                  >
                    <img src={img} alt={`Góc ${idx + 1}`} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#141310]/80 to-transparent flex flex-col justify-end p-2 text-white">
                      <span className="text-[10px] uppercase font-bold tracking-wider">Góc 0{idx + 1}</span>
                      <span className="text-[11px] text-[#ccc5bc] truncate">
                        {idx === 0 ? 'CMOS 50MP' : idx === 1 ? 'Núm & Dials' : idx === 2 ? 'Tem Serial' : 'Bộ Vali Nanuk'}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </section>

            {/* SECTION B: Product Information & Provenance Story */}
            <section className="bg-white rounded-xl p-6 lg:p-8 shadow-sm border border-[#ebe8e1] flex flex-col gap-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#f1ede6] gap-2">
                <div>
                  <span className="text-[11px] text-[#576151] uppercase tracking-widest font-semibold">DANH MỤC TAXONOMY</span>
                  <h2 className="font-serif text-xl text-[#141310]">{product.category} • Ngàm XCD</h2>
                </div>
                <div className="inline-flex items-center gap-2 bg-[#ebe8e1] px-3 py-1.5 rounded text-[#141310] text-xs">
                  <span className="material-symbols-outlined text-[16px] text-[#576151]">public</span>
                  Xuất xứ: Thụy Điển (Sweden)
                </div>
              </div>

              <div className="text-sm text-[#4a463f] leading-relaxed space-y-4">
                <p>{product.description}</p>
                <p>
                  Sản phẩm được lưu kho và bảo dưỡng định kỳ theo tiêu chuẩn xưởng ReUse Care Hub, đảm bảo tình trạng thẩm định và niêm phong kiểm định chất lượng trước khi bàn giao cho khách thuê.
                </p>
              </div>

              {/* Protocol Grid: Dispatch Standards & Wear/Tear Guidelines */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="p-5 rounded-lg bg-[#f7f3ec] flex flex-col gap-3 border border-[#ebe8e1]">
                  <div className="flex items-center gap-2 text-[#141310] font-semibold text-sm">
                    <span className="material-symbols-outlined text-[#576151]">rule_folder</span>
                    <span>Quy chuẩn Bàn giao &amp; Thu hồi</span>
                  </div>
                  <ul className="space-y-2 text-xs text-[#4a463f]">
                    <li className="flex items-start gap-2">
                      <span className="material-symbols-outlined text-[16px] text-[#576151] shrink-0 mt-0.5">check_circle</span>
                      <span>Kiểm tra tem niêm phong số hoá và chụp ảnh 4 góc đối kiểm trước khi xuất kho.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="material-symbols-outlined text-[16px] text-[#576151] shrink-0 mt-0.5">check_circle</span>
                      <span>Kiểm định bề mặt chất liệu, form dáng và phụ kiện đi kèm theo biên bản bàn giao.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="material-symbols-outlined text-[16px] text-[#576151] shrink-0 mt-0.5">check_circle</span>
                      <span>Khử trùng ozone và đóng gói túi bảo quản chuyên dụng trước khi niêm phong.</span>
                    </li>
                  </ul>
                </div>

                <div className="p-5 rounded-lg bg-[#f7f3ec] flex flex-col gap-3 border border-[#ebe8e1]">
                  <div className="flex items-center gap-2 text-[#141310] font-semibold text-sm">
                    <span className="material-symbols-outlined text-[#576151]">shield</span>
                    <span>Chính sách Rủi ro &amp; Hao mòn</span>
                  </div>
                  <ul className="space-y-2 text-xs text-[#4a463f]">
                    <li className="flex items-start gap-2">
                      <span className="material-symbols-outlined text-[16px] text-[#576151] shrink-0 mt-0.5">check_circle</span>
                      <span><strong>Fair Wear &amp; Tear:</strong> Chấp nhận hao mòn vi mô tự nhiên theo số chu kỳ thuê thực tế.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="material-symbols-outlined text-[16px] text-[#576151] shrink-0 mt-0.5">check_circle</span>
                      <span>Khách thuê được bảo chứng bởi quỹ bảo hiểm hiện vật trung gian ReUse Escrow Care.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="material-symbols-outlined text-[16px] text-[#576151] shrink-0 mt-0.5">check_circle</span>
                      <span>Tuân thủ hướng dẫn bảo quản, không tự ý can thiệp hóa chất tẩy rửa mạnh ngoài quy chuẩn.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            {/* SECTION D: Inventory Summary & Serialized Units */}
            <section className="bg-white rounded-xl p-6 lg:p-8 shadow-sm border border-[#ebe8e1] flex flex-col gap-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#f1ede6] gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#576151] text-[22px]">format_list_bulleted</span>
                    <h2 className="font-serif text-xl text-[#141310]">Kho Hiện Vật Cụ Thể (Serialized Units)</h2>
                  </div>
                  <p className="text-xs text-[#7b766f]">Quản lý định danh từng hiện vật cá thể thuộc SKU {product.sku}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-[11px] text-[#7b766f] uppercase">Hiệu suất luân chuyển</div>
                    <div className="text-sm font-bold text-[#141310]">
                      {Math.round(((product.rentingUnits || 0) / Math.max(1, product.totalUnits || 1)) * 100)}% Đang Thuê
                    </div>
                  </div>
                  {/* Inline Mini Circular Donut SVG */}
                  <div className="relative w-11 h-11 shrink-0">
                    <svg className="w-11 h-11 -rotate-90" viewBox="0 0 36 36">
                      <path className="text-[#ebe8e1]" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3.5"></path>
                      <path
                        className="text-[#576151]"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="currentColor"
                        strokeDasharray={`${Math.round(((product.rentingUnits || 0) / Math.max(1, product.totalUnits || 1)) * 100)}, 100`}
                        strokeLinecap="round"
                        strokeWidth="3.5"
                      ></path>
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-[#141310]">
                      {product.rentingUnits || 0}/{product.totalUnits || 1}
                    </div>
                  </div>
                </div>
              </div>

              {/* Units List */}
              <div className="flex flex-col gap-4">
                {Array.from({ length: Math.max(1, product.totalUnits || 1) }).map((_, idx) => {
                  const unitNum = idx + 1;
                  const isRenting = unitNum <= (product.rentingUnits || 0);
                  const isMaintenance =
                    !isRenting && unitNum <= (product.rentingUnits || 0) + (product.maintenanceUnits || 0);
                  const serialNum = `#SN-${product.sku.slice(-4).toUpperCase()}-${String(unitNum).padStart(3, '0')}`;
                  const unitId = `INV-${product.sku.slice(-4).toUpperCase()}-${String(unitNum).padStart(2, '0')}`;
                  const variantInfo = getUnitVariantAndCondition(
                    product.name,
                    String(product.category || ''),
                    unitNum,
                    product.totalUnits || 1,
                    product.rentingUnits || 0,
                    product.maintenanceUnits || 0
                  );

                  return (
                    <div
                      key={unitNum}
                      className="p-5 rounded-lg bg-[#f7f3ec] hover:bg-[#f1ede6] transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 border border-[#ebe8e1]"
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className={`w-10 h-10 rounded flex items-center justify-center shrink-0 ${
                            isRenting
                              ? 'bg-[#576151]/15 text-[#576151]'
                              : isMaintenance
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-[#d8e3ce] text-[#3f4a3a]'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[22px]">
                            {isRenting ? 'cached' : isMaintenance ? 'build' : 'check_box'}
                          </span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2.5">
                            <span className="font-semibold text-sm text-[#141310]">
                              Hiện vật #{String(unitNum).padStart(2, '0')}: {variantInfo.variantShort}
                            </span>
                            <span className="font-mono text-xs font-semibold bg-[#e6e2db] px-2 py-0.5 rounded text-[#141310]">
                              SN: {serialNum}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase ${
                                isRenting
                                  ? 'bg-[#dbe6d1] text-[#151e11]'
                                  : isMaintenance
                                  ? 'bg-amber-100 text-amber-900'
                                  : 'bg-[#d8e3ce] text-[#3f4a3a]'
                              }`}
                            >
                              {isRenting
                                ? 'ĐANG CHO THUÊ'
                                : isMaintenance
                                ? 'ĐANG BẢO DƯỠNG'
                                : 'SẴN SÀNG XUẤT KHO'}
                            </span>
                          </div>
                          <div className="text-xs text-[#7b766f] flex flex-wrap items-center gap-3">
                            <span>
                              Tình trạng thẩm định:{' '}
                              <strong className="text-[#141310] font-semibold">
                                {variantInfo.conditionGrade}
                              </strong>
                            </span>
                            <span>•</span>
                            <span>
                              Chu kỳ:{' '}
                              <span className="text-[#141310] font-medium">
                                {variantInfo.cycleCount === 0 ? 'Hàng nguyên kho' : `${variantInfo.cycleCount} lần thuê`}
                              </span>
                            </span>
                            <span>•</span>
                            <span>
                              Vị trí:{' '}
                              <span className="text-[#576151] font-medium">
                                {product.location || 'Kho lưu trữ xưởng • ReUse Care Hub'}
                              </span>
                            </span>
                          </div>
                          <div className="text-[11px] text-[#7b766f] flex items-center gap-2">
                            <span className="material-symbols-outlined text-[14px]">pin_drop</span>
                            <span>Lưu kho giám hộ độc bản theo mã SKU</span>
                            <span>•</span>
                            <span>Mã hiện vật: #{unitId}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex md:flex-col items-center md:items-end justify-between shrink-0 gap-2">
                        <Link
                          to={`/shop/rent/inventory/${unitId}`}
                          className="px-3.5 py-1.5 rounded bg-white text-[#141310] hover:bg-[#ebe8e1] transition-colors text-xs uppercase tracking-wider font-semibold inline-flex items-center gap-1 shadow-sm"
                        >
                          <span>Hồ sơ hiện vật</span>
                          <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                        </Link>
                        <span className="text-[11px] text-[#576151] font-medium">Đồng bộ MongoDB</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* SECTION E: Recent Rental Orders for this Product */}
            <section className="bg-white rounded-xl p-6 lg:p-8 shadow-sm border border-[#ebe8e1] flex flex-col gap-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#f1ede6] gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#576151] text-[22px]">history</span>
                    <h2 className="font-serif text-xl text-[#141310]">Lịch sử Đơn Thuê Gần Đây</h2>
                  </div>
                  <p className="text-xs text-[#7b766f]">Nhật ký điều phối và doanh thu phát sinh trên mã sản phẩm</p>
                </div>
                <Link
                  to="/shop/rent/orders"
                  className="text-xs uppercase tracking-wider text-[#576151] hover:text-[#141310] font-semibold flex items-center gap-1"
                >
                  <span>Xem toàn bộ đơn thuê</span>
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </Link>
              </div>

              {/* Table Container / Empty State */}
              <div className="p-8 text-center bg-[#fdfbf7] rounded-lg border border-[#ebe8e1] space-y-2">
                <span className="material-symbols-outlined text-3xl text-[#7b766f]">history</span>
                <p className="text-sm font-semibold text-[#141310]">Chưa có đơn thuê nào phát sinh cho sản phẩm này</p>
                <p className="text-xs text-[#7b766f]">
                  Khi khách hàng đặt thuê sản phẩm trên sàn, các đơn hàng kèm doanh thu và ký quỹ Escrow sẽ hiển thị tại đây.
                </p>
              </div>
            </section>

            {/* SECTION F: Approval History & Audit Trail */}
            <section className="bg-white rounded-xl p-6 lg:p-8 shadow-sm border border-[#ebe8e1] flex flex-col gap-6">
              <div className="flex items-center justify-between pb-4 border-b border-[#f1ede6]">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#576151] text-[22px]">policy</span>
                  <h2 className="font-serif text-xl text-[#141310]">Lịch sử Thẩm định &amp; Kiểm duyệt</h2>
                </div>
                <span className="text-[11px] uppercase tracking-wider text-[#7b766f]">SỔ CÁI BẤT BIẾN (AUDIT TRAIL)</span>
              </div>
              <div className="relative pl-6 space-y-8 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#dddad3]">
                <div className="relative flex items-start gap-4">
                  <span className="absolute -left-6 mt-1 w-4 h-4 rounded-full bg-[#ebe8e1] flex items-center justify-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#7b766f]"></span>
                  </span>
                  <div className="flex flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-sm text-[#141310]">Khởi tạo hồ sơ niêm yết</span>
                    </div>
                    <p className="text-xs text-[#7b766f]">
                      Sản phẩm <strong>{product.name}</strong> (Mã SKU #{product.sku}) được khởi tạo trên hệ thống, nộp kèm thông số kỹ thuật và hình ảnh giám định thực tế.
                    </p>
                    <div className="text-[11px] text-[#7b766f] uppercase tracking-wider">
                      Phân loại: {typeof product.category === 'object' && product.category !== null ? (product.category as { name?: string }).name || 'Thiết bị RENT' : String(product.category || 'Thiết bị RENT')}
                    </div>
                  </div>
                </div>

                <div className="relative flex items-start gap-4">
                  <span className="absolute -left-6 mt-1 w-4 h-4 rounded-full bg-[#576151] flex items-center justify-center text-white">
                    <span className="material-symbols-outlined text-[10px]">check</span>
                  </span>
                  <div className="flex flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-sm text-[#141310]">
                        {product.approvalStatus === 'APPROVED'
                          ? 'Đã được duyệt & Hoạt động'
                          : product.approvalStatus === 'REJECTED'
                          ? 'Hồ sơ bị từ chối'
                          : 'Đang chờ phê duyệt'}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                          product.approvalStatus === 'APPROVED'
                            ? 'bg-[#d8e3ce] text-[#3f4a3a]'
                            : product.approvalStatus === 'REJECTED'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {product.approvalStatus || 'APPROVED'}
                      </span>
                    </div>
                    <p className="text-xs text-[#7b766f]">
                      {product.approvalStatus === 'APPROVED'
                        ? `Sản phẩm đã được hệ thống phê duyệt. Mức giá thuê niêm yết ${new Intl.NumberFormat('vi-VN').format(product.pricePerDay || 0)} ₫/ngày và tiền đặt cọc ${new Intl.NumberFormat('vi-VN').format(product.deposit || 0)} ₫.`
                        : product.rejectionReason || 'Hồ sơ đang trong hàng đợi thẩm định của quản trị viên hệ thống.'}
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* RIGHT ASIDE (4 cols): Pricing, Escrow & Marketplace Simulation */}
          <aside className="lg:col-span-4 flex flex-col gap-8">
            <div className="bg-white rounded-xl p-6 lg:p-7 shadow-sm border border-[#ebe8e1] flex flex-col gap-6">
              <div className="flex items-center justify-between pb-3 border-b border-[#f1ede6]">
                <h3 className="font-serif text-lg text-[#141310]">Chỉ Số Thuê &amp; Ký Quỹ</h3>
                <span className="px-2.5 py-1 rounded bg-[#d8e3ce]/40 text-[#576151] text-[11px] font-semibold uppercase">
                  SMART ESCROW
                </span>
              </div>

              {/* Master Rent Card */}
              <div className="p-5 rounded-lg bg-[#f7f3ec] flex flex-col gap-4 border border-[#ebe8e1]">
                <div>
                  <span className="text-[11px] text-[#7b766f] uppercase tracking-wider">Đơn giá niêm yết</span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="font-serif text-3xl font-bold text-[#141310]">{product.pricePerDay.toLocaleString()}</span>
                    <span className="text-lg text-[#141310]">₫</span>
                    <span className="text-xs text-[#7b766f] ml-1">/ ngày</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[#ebe8e1]">
                  <div className="bg-white p-3 rounded shadow-xs border border-[#ebe8e1]">
                    <span className="text-[11px] text-[#7b766f] uppercase block">Thời hạn tối thiểu</span>
                    <span className="font-semibold text-sm text-[#141310]">{product.minDays || 1} Ngày</span>
                  </div>
                  <div className="bg-white p-3 rounded shadow-xs border border-[#ebe8e1]">
                    <span className="text-[11px] text-[#7b766f] uppercase block">Thời hạn tối đa</span>
                    <span className="font-semibold text-sm text-[#141310]">{product.maxDays || 30} Ngày</span>
                  </div>
                </div>
              </div>

              {/* Escrow Details */}
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3 p-4 rounded-lg bg-[#f7f3ec] border border-[#ebe8e1]">
                  <div className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-[#576151] text-[22px] shrink-0 mt-0.5">lock_clock</span>
                    <div>
                      <div className="font-semibold text-sm text-[#141310]">{(product.deposit || 0).toLocaleString()} ₫</div>
                      <div className="text-xs text-[#7b766f]">Tiền cọc bảo chứng Smart Escrow</div>
                      <div className="text-[11px] text-[#576151] mt-1 font-medium">Khóa ký quỹ tự động • Hoàn 100% khi trả máy</div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3.5 rounded bg-[#f7f3ec] border border-[#ebe8e1]">
                  <span className="text-xs text-[#7b766f]">Giá trị thay thế niêm yết</span>
                  <span className="font-bold text-sm text-[#141310]">
                    {(product.replacementValue || product.pricePerDay * 30 || 0).toLocaleString()} ₫
                  </span>
                </div>
              </div>

              {/* Cycle Discount Rules */}
              <div className="p-4 rounded-lg bg-[#f7f3ec] flex flex-col gap-3 border border-[#ebe8e1]">
                <div className="text-xs text-[#141310] uppercase font-bold tracking-wider flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-[#576151]">percent</span>
                  <span>Chiết khấu chu kỳ dài hạn</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#7b766f]">Thuê từ 7 ngày trở lên</span>
                    <span className="font-semibold text-[#576151] bg-[#dbe6d1] px-2 py-0.5 rounded">Giảm 10%</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#7b766f]">Thuê từ 30 ngày trở lên</span>
                    <span className="font-semibold text-[#576151] bg-[#dbe6d1] px-2 py-0.5 rounded">Giảm 20%</span>
                  </div>
                </div>
              </div>

              {/* Sparkline Graphic */}
              <div className="p-4 rounded-lg bg-[#ebe8e1]/50 flex flex-col gap-2 border border-[#ebe8e1]">
                <div className="flex items-center justify-between text-xs text-[#7b766f]">
                  <span>Doanh thu ước tính luân chuyển</span>
                  <span className="font-bold text-[#141310]">
                    {((product.rentingUnits || 0) * (product.pricePerDay || 0) * 5).toLocaleString()} ₫
                  </span>
                </div>
                <div className="w-full h-10 mt-1">
                  <svg className="w-full h-full text-[#576151]" fill="none" viewBox="0 0 200 40">
                    <path d="M0 35 L20 30 L40 32 L60 20 L80 22 L100 12 L120 15 L140 8 L160 14 L180 5 L200 2" stroke="currentColor" strokeLinecap="round" strokeWidth="2"></path>
                    <path d="M0 35 L20 30 L40 32 L60 20 L80 22 L100 12 L120 15 L140 8 L160 14 L180 5 L200 2 L200 40 L0 40 Z" fill="currentColor" fillOpacity="0.1"></path>
                  </svg>
                </div>
              </div>
            </div>

            {/* SECTION G: Marketplace Public Preview Box */}
            <div className="bg-white rounded-xl p-6 lg:p-7 shadow-sm border border-[#ebe8e1] flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#576151] text-[20px]">storefront</span>
                  <h3 className="font-serif text-base text-[#141310]">Bản Xem Trước Khách Hàng</h3>
                </div>
                <span className="text-[11px] text-[#7b766f] uppercase tracking-wider">Mô phỏng /rent</span>
              </div>
              <p className="text-xs text-[#7b766f]">
                Giao diện thẻ hiển thị trên sàn khám phá khi khách hàng tiềm năng tìm kiếm máy ảnh Medium Format.
              </p>

              {/* Card preview */}
              <div className="rounded-lg overflow-hidden bg-[#f1ede6] shadow border border-[#ebe8e1]">
                <div className="relative aspect-[4/3] bg-[#dddad3] overflow-hidden">
                  <img
                    alt={product.name}
                    className="w-full h-full object-cover"
                    src={product.coverImage}
                  />
                  <div className="absolute top-3 left-3 bg-[#141310]/90 text-white text-[10px] px-2 py-0.5 rounded uppercase tracking-wider backdrop-blur-sm">
                    {typeof product.category === 'object' && product.category !== null
                      ? (product.category as { name?: string }).name?.toUpperCase() || 'RENT'
                      : String(product.category || 'RENT').toUpperCase()}
                  </div>
                  <div className="absolute top-3 right-3 bg-white/90 text-[#141310] p-1.5 rounded-full shadow-sm">
                    <span className="material-symbols-outlined text-[16px] block">bookmark_border</span>
                  </div>
                </div>
                <div className="p-4 flex flex-col gap-3 bg-white">
                  <div className="flex items-center gap-1.5 text-[#576151] text-[11px]">
                    <span className="material-symbols-outlined text-[14px]">verified</span>
                    <span>{product.brand || 'Xưởng thiết bị đối tác'}</span>
                  </div>
                  <div className="font-serif text-sm text-[#141310] leading-snug line-clamp-2">
                    {product.name}
                  </div>
                  <div className="flex items-baseline justify-between pt-1">
                    <div>
                      <div className="text-[11px] text-[#7b766f]">Giá thuê</div>
                      <div className="font-bold text-sm text-[#141310]">{product.pricePerDay.toLocaleString()} ₫<span className="text-xs font-normal text-[#7b766f]">/ngày</span></div>
                    </div>
                    <div className="text-right">
                      <div className="text-[11px] text-[#7b766f]">Cọc Escrow</div>
                      <div className="text-xs font-semibold text-[#576151]">{product.deposit.toLocaleString()} ₫</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="w-full py-2 rounded bg-[#141310] text-white text-xs uppercase tracking-wider font-semibold opacity-90 cursor-not-allowed"
                  >
                    Thuê ngay • Chọn ngày
                  </button>
                </div>
              </div>
            </div>

            {/* Shop Owner Custody Guarantee Card */}
            <div className="p-6 rounded-xl bg-[#ebe8e1]/60 flex flex-col gap-3 border border-[#ebe8e1]">
              <div className="flex items-center gap-2 text-[#141310] font-semibold text-sm">
                <span className="material-symbols-outlined text-[#576151]">policy</span>
                <span>Cam kết Bảo chứng Thiết bị</span>
              </div>
              <p className="text-xs text-[#4a463f] leading-relaxed">
                Sản phẩm được bảo đảm bởi <strong>{product.brand || 'Xưởng thiết bị'}</strong>. Mọi thao tác bàn giao qua giao thức đối kiểm số hóa với Smart Escrow bảo lưu toàn quyền lợi tài chính của chủ sở hữu.
              </p>
            </div>
          </aside>
        </div>
      </main>

      {/* Interactive Lightbox Modal */}
      {isLightboxOpen && (
        <div className="fixed inset-0 z-50 bg-[#141310]/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative max-w-5xl w-full bg-white rounded-xl overflow-hidden shadow-2xl flex flex-col border border-[#ebe8e1]">
            <div className="p-4 bg-[#f1ede6] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#576151]">zoom_in</span>
                <span className="font-bold text-sm text-[#141310]">Kiểm Tra Chi Tiết Cảm Biến &amp; Ngàm Thấu Kính</span>
              </div>
              <button
                type="button"
                onClick={() => setIsLightboxOpen(false)}
                className="p-1 rounded text-[#7b766f] hover:text-[#141310]"
              >
                <span className="material-symbols-outlined text-[24px]">close</span>
              </button>
            </div>
            <div className="relative w-full aspect-[16/10] bg-[#141310] flex items-center justify-center">
              <img
                src={inspectionAngleImages[selectedAngleIndex] || product.coverImage}
                alt="Kiểm tra chi tiết hiện vật"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="p-4 bg-[#f7f3ec] flex items-center justify-between text-xs text-[#7b766f]">
              <span>Góc chụp {selectedAngleIndex + 1}: Kiểm định chuẩn vi trắc 4096x2730 RAW</span>
              <button
                type="button"
                onClick={() => setIsLightboxOpen(false)}
                className="px-4 py-1.5 rounded bg-[#141310] text-white text-xs uppercase tracking-wider font-semibold"
              >
                Đóng cửa sổ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};