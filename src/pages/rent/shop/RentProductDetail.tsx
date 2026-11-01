import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useShop } from '../../../context/ShopContext';
import { mockRentProducts } from '../../data/shop/rentProductsData';

export const RentProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { products } = useShop();

  // Lấy dữ liệu sản phẩm tương ứng từ MongoDB ShopContext hoặc mock data
  const matchedProduct = products.find((p) => p.sku === id || (p as { _id?: string })._id === id);
  const product = matchedProduct || mockRentProducts.find((p) => p.sku === id) || mockRentProducts[0];

  // Danh sách ảnh 4 góc giám định
  const inspectionAngleImages = product.inspectionImages?.length
    ? product.inspectionImages
    : product.coverImage
    ? [product.coverImage]
    : [
      'https://lh3.googleusercontent.com/aida-public/AB6AXuB5mewsMdaznDQrFK3uXQ0ihH8fVJyGA-WwquJd7sHBRJcbcASR1h27dY0EvVQTUaE69efi0nc6VSjoejNknSYsRdmO8MUGxl8UfYvNkQwMYFHbcvEBLKUrbsKj7QJfR8VzHSex4ytaneQ6Vfe5TMT_tFbtg-wysYGL3leviHOWD9x2ksGBMixc-9RCj_42X9g8exMpZ2BuvEwG0WbMj1VoX5TIamV0rJ0SdTxOKs8D',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCT-OQ367RurILCr0jpdGdNGfpHFT-WqdCF6Oq35n4oaSaBpANBBXeAs4ktLCvxqk0koCY36igHYPWdSQrz9Pb7nCNo1TvbiKRKIAtOL5gUxc02M00a1pbYHhl21_ZrBiDepTYB1JxrPmDKbdjRCXiAPYb7OHaPR9nzQFCcxm0d4I19Xl0XpUglbILawc4TSuN7MB6a2WeX7u-picVp1m93K0Nd7KPkzannCN3w92vo',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAQ9AFXrozgzjAjZS06ET7kj4_p_AHlmdARrZhSO4zoBDTkKvSEocbrbxbY19GU40IhXxxUBydeKobXsidYauNtblWcV572MaBP1nVzlYLVXvEvWblq2o87dvMtSM8LzFRiJR3pk4HqfO42ovSmJFJjJrLZ4TZ8A1YOnuAD6MwTLupK0JSqDn4_ETghWwOxL3n0xP8_0Rpp2cgWc8z3VZkIkM-NIRXZz5AOvC4ipoS7',
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCg-wK086gI3TlRyzKSKjwyOQYqjrGDMEvdr90lwqo7PUr6KbBaK3bVQfHrYQt5aWi-FI6dr_VErQHtfzflWiBhG0qLLJJerOcxHkboPMqwOIfX7k2zwLaOIgQXdAsSKPypn0civfMCdPukEVFgth7WuRZbRmXwMgL9h1ihco5JkQeY96JKpAWJjE2iU2slgtywZEhhgUG0csMsHY_YM-PbfFyeunfLfx7j89XS2csw',
    ];

  const [selectedAngleIndex, setSelectedAngleIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const handlePauseToggle = () => {
    const confirmed = window.confirm(
      isPaused
        ? 'Bạn có muốn mở lại cho thuê sản phẩm này?'
        : `Bạn có chắc muốn tạm dừng cho thuê SKU ${product.sku}? Sản phẩm sẽ tạm thời ẩn khỏi trang tìm kiếm công khai.`
    );
    if (confirmed) {
      setIsPaused(!isPaused);
    }
  };

  const handleImmediateDispatch = () => {
    alert('Đang chuẩn bị lệnh điều phối cho thân máy SN #HB-907-88202 tại Tủ A2 Quận 1. Vui lòng đối chiếu biên bản bàn giao kẹp chì.');
  };

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
                  Đi kèm trong bộ kit cho thuê là ống kính chuyên dụng <strong>XCD 45mm f/4 P</strong> – lens medium format lấy nét tự động nhỏ gọn và siêu tĩnh với màn trập tích hợp trung tâm hỗ trợ đồng bộ đèn flash tốc độ cao lên tới 1/2000s, đem đến chiều sâu ảnh quang học vô tiền khoáng hậu.
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
                      <span>Bắt buộc giao nhận kèm vali cứng Nanuk chống sốc có khóa kẹp chì số độc quyền.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="material-symbols-outlined text-[16px] text-[#576151] shrink-0 mt-0.5">check_circle</span>
                      <span>Kiểm tra độ sạch cảm biến tại chỗ 3 khẩu độ (f/4, f/11, f/22) với White Sheet test.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="material-symbols-outlined text-[16px] text-[#576151] shrink-0 mt-0.5">check_circle</span>
                      <span>Hai thỏi pin nguyên bản sạc tối thiểu 50% trước khi niêm phong xuất kho.</span>
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
                      <span><strong>Zero Deductible Fair Wear &amp; Tear:</strong> Trầy viền vi tính học chấp nhận theo khấu hao tự nhiên.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="material-symbols-outlined text-[16px] text-[#576151] shrink-0 mt-0.5">check_circle</span>
                      <span>Khách thuê được bảo chứng bởi quỹ bảo hiểm hiện vật trung gian ReUse Escrow Care.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="material-symbols-outlined text-[16px] text-[#576151] shrink-0 mt-0.5">check_circle</span>
                      <span>Được phép tản bộ ngoại cảnh, nghiêm cấm sử dụng dưới mưa lớn hoặc môi trường axit/cát mặn không che chắn.</span>
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
                  <p className="text-xs text-[#7b766f]">Quản lý định danh từng thân máy thuộc SKU {product.sku}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-[11px] text-[#7b766f] uppercase">Hiệu suất luân chuyển</div>
                    <div className="text-sm font-bold text-[#141310]">50% Đang Hoạt Động</div>
                  </div>
                  {/* Inline Mini Circular Donut SVG */}
                  <div className="relative w-11 h-11 shrink-0">
                    <svg className="w-11 h-11 -rotate-90" viewBox="0 0 36 36">
                      <path className="text-[#ebe8e1]" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3.5"></path>
                      <path className="text-[#576151]" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeDasharray="50, 100" strokeLinecap="round" strokeWidth="3.5"></path>
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-[#141310]">1/2</div>
                  </div>
                </div>
              </div>

              {/* Units List */}
              <div className="flex flex-col gap-4">
                {/* Unit 1 */}
                <div className="p-5 rounded-lg bg-[#f7f3ec] hover:bg-[#f1ede6] transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 border border-[#ebe8e1]">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded bg-[#576151]/15 text-[#576151] flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[22px]">cached</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2.5">
                        <span className="font-semibold text-sm text-[#141310]">Thân máy #01</span>
                        <span className="font-mono text-xs font-semibold bg-[#e6e2db] px-2 py-0.5 rounded text-[#141310]">
                          SN: #HB-907-88201
                        </span>
                        <span className="px-2 py-0.5 rounded bg-[#dbe6d1] text-[#151e11] text-[11px] font-bold uppercase">
                          ĐANG CHO THUÊ
                        </span>
                      </div>
                      <div className="text-xs text-[#7b766f] flex flex-wrap items-center gap-3">
                        <span>Khách thuê: <strong className="text-[#141310]">Elena Rostova</strong> (Đơn <Link className="underline text-[#141310] hover:text-[#576151]" to="/shop/rent/orders">#RH-RNT-2024-8845</Link>)</span>
                        <span>•</span>
                        <span>Hạn hoàn trả: <strong className="text-[#576151] font-semibold">19/11/2024 (còn 2 ngày)</strong></span>
                      </div>
                      <div className="text-[11px] text-[#7b766f] flex items-center gap-2">
                        <span className="material-symbols-outlined text-[14px]">pin_drop</span>
                        <span>Vị trí hiện tại: Đang lưu hành khách thực nghiệm</span>
                        <span>•</span>
                        <span>Tích lũy: 8 chu kỳ hoàn tất</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex md:flex-col items-center md:items-end justify-between shrink-0 gap-2">
                    <Link
                      to="/shop/rent/orders"
                      className="px-3.5 py-1.5 rounded bg-white text-[#141310] hover:bg-[#ebe8e1] transition-colors text-xs uppercase tracking-wider font-semibold inline-flex items-center gap-1 shadow-sm"
                    >
                      <span>Xem đơn thuê</span>
                      <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                    </Link>
                    <span className="text-[11px] text-[#576151] font-medium">Bảo chứng Escrow kích hoạt</span>
                  </div>
                </div>

                {/* Unit 2 */}
                <div className="p-5 rounded-lg bg-[#f7f3ec] hover:bg-[#f1ede6] transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 border border-[#ebe8e1]">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded bg-[#d8e3ce] text-[#3f4a3a] flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[22px]">check_box</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2.5">
                        <span className="font-semibold text-sm text-[#141310]">Thân máy #02</span>
                        <span className="font-mono text-xs font-semibold bg-[#e6e2db] px-2 py-0.5 rounded text-[#141310]">
                          SN: #HB-907-88202
                        </span>
                        <span className="px-2 py-0.5 rounded bg-[#d8e3ce] text-[#3f4a3a] text-[11px] font-bold uppercase">
                          SẴN SÀNG XUẤT KHO
                        </span>
                      </div>
                      <div className="text-xs text-[#7b766f] flex flex-wrap items-center gap-3">
                        <span>Tình trạng thẩm định: <strong className="text-[#141310] font-semibold">Mint- (98.5%)</strong></span>
                        <span>•</span>
                        <span>Collimator &amp; Mặt bích: <span className="text-[#576151] font-medium">Đạt chuẩn 0.002mm sai số</span></span>
                      </div>
                      <div className="text-[11px] text-[#7b766f] flex items-center gap-2">
                        <span className="material-symbols-outlined text-[14px]">shelves</span>
                        <span>Vị trí: Tủ chống ẩm A2 - Trạm điều phối Q.1, TP.HCM</span>
                        <span>•</span>
                        <span>Cảm biến: Đã khử ion tĩnh điện</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex md:flex-col items-center md:items-end justify-between shrink-0 gap-2">
                    <button
                      type="button"
                      onClick={handleImmediateDispatch}
                      className="px-3.5 py-1.5 rounded bg-[#576151] text-white hover:bg-[#3f4a3a] transition-opacity text-xs tracking-wider uppercase inline-flex items-center gap-1 font-semibold"
                    >
                      <span className="material-symbols-outlined text-[14px]">local_shipping</span>
                      <span>Điều phối tức thì</span>
                    </button>
                    <span className="text-[11px] text-[#7b766f]">Sẵn sàng điều phối trong 30 phút</span>
                  </div>
                </div>
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
                <Link to="/shop/rent/orders" className="text-xs uppercase tracking-wider text-[#576151] hover:text-[#141310] font-semibold flex items-center gap-1">
                  <span>Xem toàn bộ 14 đơn</span>
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </Link>
              </div>

              {/* Table Container */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-[#f1ede6] text-[#4a463f] uppercase tracking-wider font-semibold">
                      <th className="py-3 px-4 rounded-l">Mã đơn &amp; Khách thuê</th>
                      <th className="py-3 px-4">Thời gian thuê</th>
                      <th className="py-3 px-4">Doanh thu</th>
                      <th className="py-3 px-4">Ký quỹ Escrow</th>
                      <th className="py-3 px-4">Trạng thái</th>
                      <th className="py-3 px-4 text-right rounded-r">Chi tiết</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f1ede6]">
                    <tr className="hover:bg-[#f7f3ec] transition-colors">
                      <td className="py-4 px-4">
                        <div className="font-semibold text-[#141310]">#RH-RNT-2024-8845</div>
                        <div className="text-[#7b766f]">Elena Rostova (SN #HB-907-88201)</div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-[#141310] font-medium">14/11 - 19/11/2024</div>
                        <div className="text-[#7b766f]">5 ngày (Trọn gói)</div>
                      </td>
                      <td className="py-4 px-4 font-semibold text-[#141310]">2.250.000 ₫</td>
                      <td className="py-4 px-4 text-[#7b766f]">16.000.000 ₫</td>
                      <td className="py-4 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-[#dbe6d1] text-[#151e11] font-semibold">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#576151]"></span>
                          ĐANG THUÊ (IN CUSTODY)
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <Link to="/shop/rent/orders" className="p-1.5 text-[#7b766f] hover:text-[#141310] inline-block">
                          <span className="material-symbols-outlined text-[18px]">visibility</span>
                        </Link>
                      </td>
                    </tr>
                    <tr className="hover:bg-[#f7f3ec] transition-colors">
                      <td className="py-4 px-4">
                        <div className="font-semibold text-[#141310]">#RH-RNT-2024-8712</div>
                        <div className="text-[#7b766f]">Trần Quốc Nam (SN #HB-907-88202)</div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-[#141310] font-medium">28/10 - 02/11/2024</div>
                        <div className="text-[#7b766f]">5 ngày (Studio commercial)</div>
                      </td>
                      <td className="py-4 px-4 font-semibold text-[#141310]">2.250.000 ₫</td>
                      <td className="py-4 px-4 text-[#7b766f] line-through">16.000.000 ₫</td>
                      <td className="py-4 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-[#ebe8e1] text-[#141310] font-semibold">
                          <span className="material-symbols-outlined text-[12px] text-[#576151]">check</span>
                          HOÀN TẤT &amp; GIẢI NGÂN
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <Link to="/shop/rent/orders" className="p-1.5 text-[#7b766f] hover:text-[#141310] inline-block">
                          <span className="material-symbols-outlined text-[18px]">visibility</span>
                        </Link>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* SECTION F: Approval History & Audit Trail */}
            <section className="bg-white rounded-xl p-6 lg:p-8 shadow-sm border border-[#ebe8e1] flex flex-col gap-6">
              <div className="flex items-center justify-between pb-4 border-b border-[#f1ede6]">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#576151] text-[22px]">policy</span>
                  <h2 className="font-serif text-xl text-[#141310]">Lịch sử Thẩm định &amp; Kiểm duyệt Admin</h2>
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
                      <span className="font-mono text-xs text-[#7b766f]">12/03/2026 09:30</span>
                    </div>
                    <p className="text-xs text-[#7b766f]">
                      Chủ xưởng <strong>Phạm Thùy Dương</strong> nộp hồ sơ niêm yết mới kèm 4 ảnh macro cảm biến kiểm định và tài liệu thông số kỹ thuật gốc Hasselblad.
                    </p>
                    <div className="text-[11px] text-[#7b766f] uppercase tracking-wider">Hồ sơ #DOC-2026-HBL907 • Trạng thái: Chờ phân bổ giám định viên</div>
                  </div>
                </div>

                <div className="relative flex items-start gap-4">
                  <span className="absolute -left-6 mt-1 w-4 h-4 rounded-full bg-[#dbe6d1] flex items-center justify-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#576151]"></span>
                  </span>
                  <div className="flex flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-sm text-[#141310]">Tiếp nhận giám định quang học</span>
                      <span className="font-mono text-xs text-[#7b766f]">12/03/2026 11:15</span>
                    </div>
                    <p className="text-xs text-[#7b766f]">
                      Giám định viên ReUse Hub (<strong>Marcus Vance</strong>) tiếp nhận đối chiếu số Serial quốc tế, kiểm tra bước ren ngàm XCD và quét mã QR niêm phong thân máy.
                    </p>
                    <div className="text-[11px] text-[#576151] uppercase tracking-wider font-semibold">Kết quả: Đạt tiêu chuẩn phân hạng Grade A+ (Bảo tàng)</div>
                  </div>
                </div>

                <div className="relative flex items-start gap-4">
                  <span className="absolute -left-6 mt-1 w-4 h-4 rounded-full bg-[#576151] flex items-center justify-center text-white">
                    <span className="material-symbols-outlined text-[10px]">check</span>
                  </span>
                  <div className="flex flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-sm text-[#141310]">Phê chuẩn chính thức &amp; Kích hoạt Escrow</span>
                      <span className="font-mono text-xs text-[#576151] font-semibold">12/03/2026 13:45</span>
                      <span className="px-2 py-0.5 rounded bg-[#d8e3ce] text-[#3f4a3a] text-[10px] uppercase font-bold">HOÀN TẤT DUYỆT</span>
                    </div>
                    <p className="text-xs text-[#7b766f]">
                      Ban quản trị Admin phê chuẩn trạng thái <strong>ACTIVE</strong>. Mức ký quỹ 16.000.000 ₫ được chứng thực bảo hiểm B-Corp Standard, sản phẩm xuất hiện công khai trên bản đồ RENT.
                    </p>
                    <div className="p-3 rounded bg-[#f7f3ec] text-[#4a463f] font-mono text-[11px] mt-1 border border-[#ebe8e1]">
                      Chữ ký điện tử thẩm định: RSA-4096-SEC-TOKEN-VANCE-890218 // TX-ESCROW-POOL-APPROVED
                    </div>
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
                    <span className="font-semibold text-sm text-[#141310]">02 Ngày</span>
                  </div>
                  <div className="bg-white p-3 rounded shadow-xs border border-[#ebe8e1]">
                    <span className="text-[11px] text-[#7b766f] uppercase block">Thời hạn tối đa</span>
                    <span className="font-semibold text-sm text-[#141310]">30 Ngày</span>
                  </div>
                </div>
              </div>

              {/* Escrow Details */}
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3 p-4 rounded-lg bg-[#f7f3ec] border border-[#ebe8e1]">
                  <div className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-[#576151] text-[22px] shrink-0 mt-0.5">lock_clock</span>
                    <div>
                      <div className="font-semibold text-sm text-[#141310]">{product.deposit.toLocaleString()} ₫</div>
                      <div className="text-xs text-[#7b766f]">Tiền cọc bảo chứng Smart Escrow</div>
                      <div className="text-[11px] text-[#576151] mt-1 font-medium">Khóa ký quỹ tự động • Hoàn 100% trong 24h</div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3.5 rounded bg-[#f7f3ec] border border-[#ebe8e1]">
                  <span className="text-xs text-[#7b766f]">Giá trị thay thế niêm yết</span>
                  <span className="font-bold text-sm text-[#141310]">{product.replacementValue?.toLocaleString() || '145.000.000'} ₫</span>
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
                  <span>Doanh thu tích lũy 30 ngày</span>
                  <span className="font-bold text-[#141310]">6.750.000 ₫</span>
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
                    {product.category.toUpperCase()}
                  </div>
                  <div className="absolute top-3 right-3 bg-white/90 text-[#141310] p-1.5 rounded-full shadow-sm">
                    <span className="material-symbols-outlined text-[16px] block">bookmark_border</span>
                  </div>
                </div>
                <div className="p-4 flex flex-col gap-3 bg-white">
                  <div className="flex items-center gap-1.5 text-[#576151] text-[11px]">
                    <span className="material-symbols-outlined text-[14px]">verified</span>
                    <span>Atelier Chronos &amp; Optics</span>
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
                <span>Cam kết Bản quyền Xưởng</span>
              </div>
              <p className="text-xs text-[#4a463f] leading-relaxed">
                Sản phẩm được bảo đảm bởi <strong>Atelier Chronos &amp; Optics</strong>. Mọi thao tác bàn giao qua giao thức đối kiểm số hóa với Smart Escrow bảo lưu toàn quyền lợi tài chính của chủ sở hữu.
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