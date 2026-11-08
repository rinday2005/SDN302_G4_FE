import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useShop } from '../../../context/ShopContext';

export const RentInventoryDetail: React.FC = () => {
  const { itemId } = useParams<{ itemId: string }>();
  const { products } = useShop();

  // Tìm kiếm sản phẩm thực tế từ MongoDB ShopContext
  const matchedProduct =
    products.find((p) => {
      if (!itemId) return false;
      const cleanItemId = itemId.toLowerCase();
      const cleanSku = (p.sku || '').toLowerCase();
      return (
        cleanSku === cleanItemId ||
        `specimen-${cleanSku}` === cleanItemId ||
        cleanItemId.includes(cleanSku) ||
        (cleanSku.length >= 4 && cleanItemId.includes(cleanSku.slice(-4)))
      );
    }) || products[0];

  // Trích xuất số thứ tự hiện vật nếu có (ví dụ: INV-8820-02 -> 2)
  const unitNumber = parseInt(itemId?.match(/-(\d+)$/)?.[1] || '1', 10);
  const unitSku = matchedProduct?.sku || 'RENT-PROD';
  const unitId = itemId?.startsWith('INV-')
    ? itemId
    : `INV-${unitSku.slice(-4).toUpperCase()}-${String(unitNumber).padStart(2, '0')}`;
  const serialNumber = `#SN-${unitSku.slice(-4).toUpperCase()}-${String(unitNumber).padStart(3, '0')}`;

  const isRenting = unitNumber <= (matchedProduct?.rentingUnits || 0);
  const isMaintenance =
    !isRenting &&
    unitNumber <= (matchedProduct?.rentingUnits || 0) + (matchedProduct?.maintenanceUnits || 0);
  const initialStatus: 'ELIGIBLE' | 'RENTING' | 'MAINTENANCE' = isRenting
    ? 'RENTING'
    : isMaintenance
    ? 'MAINTENANCE'
    : 'ELIGIBLE';

  const [specimenState, setSpecimenState] = useState<'ELIGIBLE' | 'RENTING' | 'MAINTENANCE'>(initialStatus);

  const handleExportIdentityCard = () => {
    alert('Đang tổng hợp Thẻ Lý Lịch Hiện Vật Độc Bản có mã QR bảo chứng chuỗi khối...');
  };

  if (!matchedProduct) {
    return (
      <div className="w-full min-h-[60vh] flex flex-col items-center justify-center p-8 bg-[#fdf9f2] text-center font-sans">
        <span className="material-symbols-outlined text-4xl text-[#7b766f] mb-3">inventory_2</span>
        <h2 className="font-serif text-2xl text-[#141310] mb-2">Chưa tìm thấy hiện vật</h2>
        <p className="text-xs text-[#7b766f] mb-6">Hiện vật này có thể chưa được tạo hoặc chưa đồng bộ từ cơ sở dữ liệu.</p>
        <Link
          to="/shop/rent/inventory"
          className="px-5 py-2.5 rounded bg-[#141310] text-white text-xs font-semibold uppercase tracking-wider"
        >
          Về Kho Hiện vật
        </Link>
      </div>
    );
  }

  const unit = {
    id: unitId,
    sku: matchedProduct.sku,
    productName: matchedProduct.name,
    category:
      typeof matchedProduct.category === 'object' && matchedProduct.category !== null
        ? (matchedProduct.category as { name?: string }).name || 'Thiết bị RENT'
        : String(matchedProduct.category || 'Thiết bị RENT'),
    imageUrl: matchedProduct.coverImage || 'https://placehold.co/600x400',
    conditionGrade: matchedProduct.condition || 'LIKE_NEW (98%)',
    serialNumber,
    location: matchedProduct.location || 'Tủ chống ẩm trung tâm xưởng • TP. HCM',
    cycleCount: Math.max(1, (matchedProduct.totalUnits || 1) * 3 + unitNumber),
    depreciationRate: `${Math.min(95, 20 + unitNumber * 15)}%`,
    listedRentPrice: `${new Intl.NumberFormat('vi-VN').format(matchedProduct.pricePerDay || 0)} ₫ / ngày`,
    proposedThriftPrice: `${new Intl.NumberFormat('vi-VN').format(
      (matchedProduct.replacementValue || matchedProduct.pricePerDay * 30) * 0.75
    )} ₫`,
    shutterActuations: `${(unitNumber * 1250).toLocaleString()} shots`,
    curatorName: 'Chuyên viên kiểm định xưởng',
    thumbnailMount: matchedProduct.coverImage,
    thumbnailSensor: matchedProduct.coverImage,
    thumbnailOptics: matchedProduct.coverImage,
    thumbnailCase: matchedProduct.coverImage,
  };

  return (
    <div className="w-full flex flex-col font-sans text-[#1c1c18] bg-[#fdf9f2]">
      {/* Top Breadcrumb & Control Bar */}
      <section className="w-full bg-[#f7f3ec] py-4 shadow-sm border-b border-[#dddad3]">
        <div className="max-w-[1440px] mx-auto px-5 lg:px-12 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2 text-[13px] tracking-wide text-[#7b766f] font-medium">
            <Link to="/shop" className="hover:text-[#141310] transition-colors flex items-center gap-1">
              <span className="material-symbols-outlined text-[15px]">storefront</span> Bảng điều khiển xưởng
            </Link>
            <span>/</span>
            <Link to="/shop/rent/products" className="hover:text-[#141310] transition-colors">
              Cho thuê RENT
            </Link>
            <span>/</span>
            <Link to="/shop/rent/inventory" className="hover:text-[#141310] transition-colors">
              Kho Hiện vật
            </Link>
            <span>/</span>
            <span className="text-[#141310] font-semibold font-mono">#{unit.id}</span>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Interactive State Demo Switcher */}
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded shadow-sm text-xs border border-[#ebe8e1]">
              <span className="text-[#7b766f] uppercase tracking-wider text-[11px] font-semibold">Trạng thái hiện vật:</span>
              <select
                className="bg-transparent text-[#141310] font-medium focus:outline-none cursor-pointer pr-2"
                value={specimenState}
                onChange={(e) => setSpecimenState(e.target.value as 'ELIGIBLE' | 'RENTING' | 'MAINTENANCE')}
              >
                <option value="ELIGIBLE">ĐỦ ĐIỀU KIỆN SANG THRIFT</option>
                <option value="RENTING">ĐANG CHO THUÊ (Active Rental)</option>
                <option value="MAINTENANCE">ĐANG BẢO DƯỠNG (Under Service)</option>
              </select>
            </div>

            <Link
              to="/shop/rent/inventory"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold uppercase tracking-wider bg-white text-[#1c1c18] hover:bg-[#ebe8e1] transition-all rounded shadow-sm border border-[#ebe8e1]"
            >
              <span className="material-symbols-outlined text-[16px]">arrow_back</span> Quay lại Kho Hiện vật
            </Link>
          </div>
        </div>
      </section>

      {/* Main Workspace */}
      <div className="max-w-[1440px] mx-auto px-5 lg:px-12 py-8 flex flex-col gap-10">
        {/* Hero Specimen Header */}
        <div className="bg-[#f1ede6] p-6 lg:p-10 rounded-xl shadow-md flex flex-col lg:flex-row gap-8 lg:gap-12 items-start border border-[#ebe8e1]">
          {/* Physical Specimen Visual & Badges */}
          <div className="w-full lg:w-5/12 flex flex-col gap-4">
            <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden bg-[#e6e2db] shadow-inner group">
              <img
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                src={unit.imageUrl}
                alt={unit.productName}
              />
              {/* Custody Tag Overlay */}
              <div className="absolute top-4 left-4 flex flex-col gap-1.5">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#141310]/90 text-white backdrop-blur-md rounded text-[11px] font-mono tracking-widest shadow-md">
                  <span className="material-symbols-outlined text-[13px] text-amber-300">verified</span>
                  CUSTODY SEAL: #{unit.serialNumber.replace('#', '')}
                </div>
                <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-white/85 text-[#141310] backdrop-blur-md rounded text-[10px] font-mono uppercase tracking-wider shadow-sm">
                  {unit.location}
                </div>
              </div>
              <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded text-[#141310] shadow-sm flex items-center gap-2">
                <span className="text-xs uppercase font-medium tracking-wider text-[#7b766f]">Chu kỳ:</span>
                <span className="font-bold text-sm font-mono">{unit.cycleCount} Lượt Luân Chuyển</span>
              </div>
            </div>

            {/* Specimen Micro Thumbnails & Inspection Angles */}
            <div className="grid grid-cols-4 gap-2.5">
              <div className="aspect-square bg-[#e6e2db] rounded overflow-hidden shadow-sm relative ring-2 ring-[#141310]">
                <img
                  className="w-full h-full object-cover"
                  src={unit.thumbnailMount || unit.imageUrl}
                  alt="Inspection angle 1"
                />
                <div className="absolute bottom-1 right-1 bg-[#141310]/80 text-[9px] font-mono text-white px-1 rounded">Mặt trước</div>
              </div>
              <div className="aspect-square bg-[#e6e2db] rounded overflow-hidden shadow-sm">
                <img
                  className="w-full h-full object-cover"
                  src={unit.thumbnailSensor || unit.imageUrl}
                  alt="Inspection angle 2"
                />
                <div className="absolute bottom-1 right-1 bg-[#141310]/80 text-[9px] font-mono text-white px-1 rounded">Mặt sau</div>
              </div>
              <div className="aspect-square bg-[#e6e2db] rounded overflow-hidden shadow-sm">
                <img
                  className="w-full h-full object-cover"
                  src={unit.thumbnailOptics || unit.imageUrl}
                  alt="Inspection details"
                />
                <div className="absolute bottom-1 right-1 bg-[#141310]/80 text-[9px] font-mono text-white px-1 rounded">Chi tiết</div>
              </div>
              <div className="aspect-square bg-[#e6e2db] rounded overflow-hidden shadow-sm">
                <img
                  className="w-full h-full object-cover"
                  src={unit.thumbnailCase || unit.imageUrl}
                  alt="Inspection package"
                />
                <div className="absolute bottom-1 right-1 bg-[#141310]/80 text-[9px] font-mono text-white px-1 rounded">Đóng gói</div>
              </div>
            </div>
          </div>

          {/* Specimen Primary Metadata & Actions */}
          <div className="w-full lg:w-7/12 flex flex-col justify-between h-full">
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                {/* Dynamic State Badge */}
                <div>
                  {specimenState === 'RENTING' && (
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#e6e2db] text-[#1c1c18] text-[12px] font-semibold tracking-wider uppercase rounded shadow-sm">
                      <span className="w-2 h-2 rounded-full bg-amber-600 animate-pulse"></span>
                      ĐANG CHO THUÊ (LUÂN CHUYỂN HOẠT ĐỘNG)
                    </div>
                  )}
                  {specimenState === 'MAINTENANCE' && (
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#e6e2db] text-[#1c1c18] text-[12px] font-semibold tracking-wider uppercase rounded shadow-sm">
                      <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                      ĐANG BẢO DƯỠNG VỆ SINH ĐỊNH KỲ
                    </div>
                  )}
                  {specimenState === 'ELIGIBLE' && (
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#d8e3ce] text-[#3f4a3a] text-[12px] font-bold tracking-wider uppercase rounded shadow-sm">
                      <span className="w-2 h-2 rounded-full bg-[#576151]"></span>
                      ĐỦ ĐIỀU KIỆN SANG THRIFT
                    </div>
                  )}
                </div>

                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#ebe8e1] text-[#141310] rounded text-xs font-medium shadow-sm">
                  <span className="material-symbols-outlined text-[16px] text-[#576151]">verified</span>
                  {unit.conditionGrade} (Chuẩn kiểm định xưởng)
                </div>
              </div>

              <div>
                <h1 className="font-serif text-3xl lg:text-[38px] text-[#141310] tracking-tight leading-tight">
                  {unit.productName}
                </h1>
                <p className="text-xs text-[#7b766f] mt-2 italic font-serif">
                  {matchedProduct.description ||
                    'Hiện vật thiết bị chuyên dụng lưu kho xưởng. Đăng ký lưu ký số hoá độc bản phục vụ đối kiểm chất lượng & luân chuyển RENT/THRIFT.'}
                </p>
              </div>

              {/* Specimen Technical Identifiers Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                <div className="bg-white p-3 rounded shadow-sm border border-[#ebe8e1]">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-[#7b766f] block">Mã Hiện Vật</span>
                  <span className="font-mono text-sm font-bold text-[#141310]">#{unit.id}</span>
                </div>
                <div className="bg-white p-3 rounded shadow-sm border border-[#ebe8e1]">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-[#7b766f] block">Số Sê-ri (Serial)</span>
                  <span className="font-mono text-sm font-bold text-[#141310]">SN: {unit.serialNumber}</span>
                </div>
                <div className="bg-white p-3 rounded shadow-sm border border-[#ebe8e1]">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-[#7b766f] block">Thương Hiệu / Phân Loại</span>
                  <span className="font-mono text-sm font-bold text-[#141310]">{matchedProduct.brand || unit.category}</span>
                </div>
                <div className="bg-white p-3 rounded shadow-sm border border-[#ebe8e1]">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-[#7b766f] block">Khấu Hao Vận Hành</span>
                  <span className="font-mono text-sm font-bold text-[#141310]">{unit.depreciationRate} ({unit.cycleCount} lượt)</span>
                </div>
                <div className="bg-white p-3 rounded shadow-sm border border-[#ebe8e1]">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-[#7b766f] block">Chuyên Viên Quản Lý</span>
                  <span className="text-sm font-medium text-[#141310]">{unit.curatorName}</span>
                </div>
                <div className="bg-white p-3 rounded shadow-sm border border-[#ebe8e1]">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-[#7b766f] block">Giá Niêm Yết Thuê</span>
                  <span className="font-mono text-sm font-bold text-[#141310]">{unit.listedRentPrice}</span>
                </div>
              </div>
            </div>

            {/* Header Interactive Actions */}
            <div className="flex flex-wrap items-center gap-3 pt-6 mt-6 border-t border-[#dddad3]">
              {specimenState === 'ELIGIBLE' ? (
                <Link
                  to={`/shop/rent/convert-thrift/${unit.id}`}
                  className="inline-flex items-center gap-2 px-5 py-3 text-white font-semibold text-xs tracking-wider uppercase rounded shadow-md transition-all bg-[#141310] hover:bg-[#292724] cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">autorenew</span> Chuyển giao sang THRIFT →
                </Link>
              ) : (
                <button
                  type="button"
                  disabled
                  title="Không đủ điều kiện (Đang cho thuê / Có lịch đặt trước - AC 1)"
                  className="inline-flex items-center gap-2 px-5 py-3 text-white font-semibold text-xs tracking-wider uppercase rounded shadow-md transition-all bg-gray-400 opacity-50 cursor-not-allowed"
                >
                  <span className="material-symbols-outlined text-[18px]">lock</span> Khóa: Đang cho thuê
                </button>
              )}
              <Link
                to={`/shop/rent/products/${unit.sku}`}
                className="inline-flex items-center gap-2 px-4 py-3 bg-white hover:bg-[#ebe8e1] text-[#141310] font-medium text-xs tracking-wider uppercase rounded shadow-sm transition-all border border-[#ebe8e1]"
              >
                <span className="material-symbols-outlined text-[17px]">category</span> Xem sản phẩm gốc
              </Link>
              <button
                type="button"
                onClick={handleExportIdentityCard}
                className="inline-flex items-center gap-2 px-4 py-3 bg-white hover:bg-[#ebe8e1] text-[#141310] font-medium text-xs tracking-wider uppercase rounded shadow-sm transition-all border border-[#ebe8e1]"
              >
                <span className="material-symbols-outlined text-[17px]">qr_code_2</span> Xuất thẻ lý lịch (PDF/QR)
              </button>
            </div>
          </div>
        </div>

        {/* THRIFT Eligibility Banner */}
        <section
          className={`p-8 rounded-xl shadow-md transition-all border border-[#ebe8e1] ${specimenState === 'ELIGIBLE'
              ? 'bg-gradient-to-r from-[#d8e3ce]/40 via-[#f1ede6] to-[#d8e3ce]/30'
              : 'bg-[#f1ede6] opacity-70'
            }`}
        >
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="flex flex-col gap-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 text-[#576151] font-mono text-[11px] uppercase tracking-widest font-bold">
                <span className="material-symbols-outlined text-[16px]">eco</span> Tiêu chuẩn B-Corp Circularity Protocol
              </div>
              <h2 className="font-serif text-2xl text-[#141310]">Đủ điều kiện Chuyển giao sang Sàn Bán đứt THRIFT</h2>
              <p className="text-sm text-[#4a463f] font-serif italic">
                “This item can receive a second life.” — Hiện vật này đã hoàn thành sứ mệnh khấu hao cho thuê ({unit.cycleCount}/10 chu kỳ tối thiểu) và sẵn sàng đón nhận vòng đời thứ hai bền vững trong bộ sưu tập cá nhân.
              </p>
            </div>
            <div className="flex flex-col items-start lg:items-end gap-3 w-full lg:w-auto">
              {specimenState === 'ELIGIBLE' ? (
                <Link
                  to={`/shop/rent/convert-thrift/${unit.id}`}
                  className="w-full lg:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 font-bold text-xs uppercase tracking-widest rounded shadow-lg transition-all text-center bg-[#141310] text-white hover:bg-[#292724] cursor-pointer"
                >
                  Chuyển sang THRIFT (Convert to THRIFT) →
                </Link>
              ) : (
                <button
                  type="button"
                  disabled
                  className="w-full lg:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 font-bold text-xs uppercase tracking-widest rounded shadow-lg transition-all text-center bg-gray-400 text-white opacity-40 cursor-not-allowed"
                >
                  {specimenState === 'RENTING'
                    ? 'Không đủ điều kiện (Đang cho thuê)'
                    : 'Không đủ điều kiện (Đang kiểm định)'}
                </button>
              )}
              <span className="text-[11px] text-[#7b766f] font-mono">
                Định giá đề xuất THRIFT: {unit.proposedThriftPrice || '122.000.000 ₫'} (Biên độ khấu hao -18.5%)
              </span>
            </div>
          </div>

          {/* Circularity 5 Criteria Validation Table */}
          <div className="mt-6 pt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 border-t border-[#dddad3]">
            <div className="bg-white/80 p-3.5 rounded shadow-sm flex flex-col justify-between border border-[#ebe8e1]">
              <span className="text-[11px] text-[#7b766f] font-medium">1. Định danh lưu kho</span>
              <div className="flex items-center justify-between mt-2">
                <span className="font-bold text-xs text-[#141310] font-mono">#{unit.id}</span>
                <span className="text-[10px] font-bold text-[#3f4a3a] bg-[#d8e3ce] px-2 py-0.5 rounded">ĐẠT (Hợp lệ)</span>
              </div>
            </div>
            <div className="bg-white/80 p-3.5 rounded shadow-sm flex flex-col justify-between border border-[#ebe8e1]">
              <span className="text-[11px] text-[#7b766f] font-medium">2. Vị trí thực tế xưởng</span>
              <div className="flex items-center justify-between mt-2">
                <span className="font-bold text-xs text-[#141310] font-mono">Tại xưởng</span>
                <span className="text-[10px] font-bold text-[#3f4a3a] bg-[#d8e3ce] px-2 py-0.5 rounded">ĐẠT (Đã hồi kho)</span>
              </div>
            </div>
            <div className="bg-white/80 p-3.5 rounded shadow-sm flex flex-col justify-between border border-[#ebe8e1]">
              <span className="text-[11px] text-[#7b766f] font-medium">3. Biên bản kỹ thuật</span>
              <div className="flex items-center justify-between mt-2">
                <span className="font-bold text-xs text-[#141310] font-mono">{unit.conditionGrade}</span>
                <span className="text-[10px] font-bold text-[#3f4a3a] bg-[#d8e3ce] px-2 py-0.5 rounded">ĐẠT (Chuẩn kiểm định)</span>
              </div>
            </div>
            <div className="bg-white/80 p-3.5 rounded shadow-sm flex flex-col justify-between border border-[#ebe8e1]">
              <span className="text-[11px] text-[#7b766f] font-medium">4. Đặt trước tương lai</span>
              <div className="flex items-center justify-between mt-2">
                <span className="font-bold text-xs text-[#141310] font-mono">0 Lịch giữ máy</span>
                <span className="text-[10px] font-bold text-[#3f4a3a] bg-[#d8e3ce] px-2 py-0.5 rounded">ĐẠT (Lịch trống)</span>
              </div>
            </div>
            <div className="bg-white/80 p-3.5 rounded shadow-sm flex flex-col justify-between border border-[#ebe8e1]">
              <span className="text-[11px] text-[#7b766f] font-medium">5. Ngưỡng chu kỳ vòng đời</span>
              <div className="flex items-center justify-between mt-2">
                <span className="font-bold text-xs text-[#141310] font-mono">{unit.cycleCount} Chu kỳ</span>
                <span className="text-[10px] font-bold text-[#3f4a3a] bg-[#d8e3ce] px-2 py-0.5 rounded">ĐẠT ({unit.depreciationRate})</span>
              </div>
            </div>
          </div>

          {/* Warning notice when not eligible */}
          {specimenState !== 'ELIGIBLE' && (
            <div className="mt-4 p-3 bg-[#ffdad6] text-[#93000a] text-xs rounded flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">error</span>
              <span>
                <strong>Không đủ điều kiện:</strong> Hiện vật đang có ràng buộc luân chuyển hoặc chưa qua nghiệm thu buồng gương. Nút chuyển nhượng đã tự động khóa.
              </span>
            </div>
          )}
        </section>

        {/* 2-Column Split: Section 1 & Section 3 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Section 1: Current Status & Physical Ledger (7 Cols) */}
          <div className="lg:col-span-7 bg-[#f1ede6] p-6 lg:p-8 rounded-xl shadow-md flex flex-col gap-6 border border-[#ebe8e1]">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-mono text-[11px] uppercase tracking-wider text-[#576151] font-bold">Mục 01 • Giám hộ vật phẩm</span>
                <h3 className="font-serif text-xl text-[#141310]">Trạng thái Hiện thời &amp; Sổ cái Vị trí</h3>
              </div>
              <span className="material-symbols-outlined text-[#576151] text-[26px]">inventory</span>
            </div>

            {/* Physical Location Ledger Box */}
            <div className="bg-white p-5 rounded-lg shadow-sm flex flex-col gap-3 border border-[#ebe8e1]">
              <div className="flex items-center justify-between text-xs pb-3 border-b border-[#f1ede6]">
                <span className="text-[#7b766f] font-medium">Tình trạng vận hành:</span>
                <span className="font-semibold text-[#576151] flex items-center gap-1 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#576151]"></span> SẴN SÀNG LƯU KHO XƯỞNG
                </span>
              </div>
              <p className="text-sm text-[#1c1c18] leading-relaxed">
                Hiện vật độc bản mã <strong>#{unit.id}</strong> (Số sê-ri: <strong>{unit.serialNumber}</strong>) đang được lưu kho bảo quản an toàn tại <strong>{unit.location}</strong>. Toàn bộ đối kiểm xuất/nhập xưởng được bảo chứng qua Smart Escrow.
              </p>
              <div className="bg-[#f7f3ec] p-3 rounded text-xs">
                {specimenState === 'RENTING' ? (
                  <div className="flex items-center gap-3 text-amber-800 text-[13px] font-medium">
                    <span className="material-symbols-outlined text-[18px]">lock_clock</span>
                    Đang được lưu ký bởi: Studio Belleville (Đến 28/11/2024). Khóa chuyển đổi THRIFT.
                  </div>
                ) : specimenState === 'MAINTENANCE' ? (
                  <div className="flex items-center gap-3 text-[#576151] text-[13px] font-medium">
                    <span className="material-symbols-outlined text-[18px]">build_circle</span>
                    Đang cân chỉnh quang sai &amp; cảm biến trung tâm. Dự kiến hoàn tất: 24 Giờ.
                  </div>
                ) : (
                  <div className="flex items-center gap-3 text-[#576151] text-[13px] font-medium">
                    <span className="material-symbols-outlined text-[18px]">verified_user</span>
                    Trống lịch hoàn toàn trong 60 ngày tới. Sẵn sàng đóng gói niêm phong THRIFT.
                  </div>
                )}
              </div>
            </div>

            {/* 4 Vital Specimen Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white p-3.5 rounded shadow-sm border border-[#ebe8e1]">
                <span className="text-[11px] text-[#7b766f] block font-mono">Tổng Thuê</span>
                <div className="font-mono text-xl font-bold text-[#141310] mt-1">
                  {unit.cycleCount} <span className="text-xs font-normal text-[#7b766f]">lượt</span>
                </div>
                <span className="text-[10px] text-[#576151] font-medium mt-1 block">Hoàn thành 100%</span>
              </div>
              <div className="bg-white p-3.5 rounded shadow-sm border border-[#ebe8e1]">
                <span className="text-[11px] text-[#7b766f] block font-mono">Ngày Công Tác</span>
                <div className="font-mono text-xl font-bold text-[#141310] mt-1">
                  78 <span className="text-xs font-normal text-[#7b766f]">ngày</span>
                </div>
                <span className="text-[10px] text-[#7b766f] font-medium mt-1 block">Thực địa chụp ảnh</span>
              </div>
              <div className="bg-white p-3.5 rounded shadow-sm border border-[#ebe8e1]">
                <span className="text-[11px] text-[#7b766f] block font-mono">Khấu Hao Kỹ Thuật</span>
                <div className="font-mono text-xl font-bold text-[#141310] mt-1">{unit.depreciationRate}</div>
                <span className="text-[10px] text-[#576151] font-medium mt-1 block">Đạt chỉ tiêu THRIFT</span>
              </div>
              <div className="bg-white p-3.5 rounded shadow-sm border border-[#ebe8e1]">
                <span className="text-[11px] text-[#7b766f] block font-mono">Điểm Toàn Vẹn</span>
                <div className="font-mono text-xl font-bold text-[#141310] mt-1">
                  9.8 <span className="text-xs font-normal text-[#7b766f]">/ 10</span>
                </div>
                <span className="text-[10px] text-[#576151] font-medium mt-1 block">Cơ khí hoàn mỹ</span>
              </div>
            </div>

            {/* Donut Gauge Chart */}
            <div className="bg-white p-4 rounded-lg shadow-sm flex flex-col sm:flex-row items-center gap-6 border border-[#ebe8e1]">
              <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
                <svg className="w-28 h-28 transform -rotate-90" viewBox="0 0 100 100">
                  <circle className="text-[#ebe8e1]" cx="50" cy="50" fill="none" r="40" stroke="currentColor" strokeWidth="8"></circle>
                  <circle
                    className="text-[#576151] transition-all duration-1000"
                    cx="50"
                    cy="50"
                    fill="none"
                    r="40"
                    stroke="currentColor"
                    strokeDasharray="251.2"
                    strokeDashoffset="33.9"
                    strokeLinecap="round"
                    strokeWidth="8"
                  ></circle>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="font-mono text-lg font-bold text-[#141310]">{unit.depreciationRate}</span>
                  <span className="text-[9px] uppercase font-mono text-[#7b766f]">Vòng đời RENT</span>
                </div>
              </div>
              <div className="flex flex-col gap-1.5 text-xs text-[#4a463f]">
                <div className="font-semibold text-[#141310] text-sm">Chuẩn chuyển giao bền vững (Circular Maturity)</div>
                <p>
                  Hiện vật đạt tỉ lệ khấu hao vận hành {unit.depreciationRate}. Theo chuẩn luân chuyển thiết bị, việc chuyển nhượng sang sàn bán đứt THRIFT giúp thu hồi giá trị đầu tư và tạo điều kiện tối ưu để xưởng tái trang bị thế hệ thiết bị mới.
                </p>
              </div>
            </div>
          </div>

          {/* Section 3: Availability & Reservation Pipeline (5 Cols) */}
          <div className="lg:col-span-5 bg-[#f1ede6] p-6 lg:p-8 rounded-xl shadow-md flex flex-col gap-6 border border-[#ebe8e1]">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-mono text-[11px] uppercase tracking-wider text-[#576151] font-bold">Mục 03 • Lịch trình lưu ký</span>
                <h3 className="font-serif text-xl text-[#141310]">Lịch Khả Dụng &amp; Đặt Trước</h3>
              </div>
              <span className="material-symbols-outlined text-[#576151] text-[26px]">calendar_month</span>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm flex flex-col gap-4 border border-[#ebe8e1]">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#141310] uppercase tracking-wider font-mono">
                  Lịch hoạt động hiện tại
                </span>
                <span className="px-2 py-0.5 bg-[#d8e3ce] text-[#3f4a3a] text-[10px] font-bold rounded">
                  {specimenState === 'RENTING'
                    ? 'Đang có khách thuê'
                    : specimenState === 'MAINTENANCE'
                    ? 'Đang bảo dưỡng'
                    : 'Trống lịch 100%'}
                </span>
              </div>

              {/* Timeline Status Notes */}
              <div className="space-y-2.5 pt-2 border-t border-[#f1ede6] text-xs">
                <div className="flex items-start gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#576151] mt-1.5 shrink-0"></span>
                  <span className="text-[#1c1c18]">
                    <strong>Trạng thái:</strong> {specimenState === 'RENTING' ? 'Hiện vật đang trong vòng luân chuyển thuê ngoài xưởng.' : specimenState === 'MAINTENANCE' ? 'Đang trong quy trình bảo trì, vệ sinh định kỳ.' : 'Sẵn sàng giao máy ngay khi có đơn thuê phát sinh.'}
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#d8e3ce] mt-1.5 shrink-0"></span>
                  <span className="text-[#7b766f]">
                    <strong>Quyền hạn:</strong> {specimenState === 'ELIGIBLE' ? 'Đủ điều kiện đóng băng để chuyển sàn bán đứt THRIFT.' : 'Đang có ràng buộc luân chuyển, tạm khóa chức năng chuyển sàn.'}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-[#ebe8e1] p-4 rounded-lg text-xs flex flex-col gap-2 border border-[#dddad3]">
              <div className="font-semibold text-[#141310] flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-[#576151]">info</span>
                Quy định bảo lưu luân chuyển
              </div>
              <p className="text-[#4a463f] leading-relaxed">
                Khi có khách hàng đặt thuê hiện vật trong tương lai, hệ thống sẽ tự động phong tỏa nút "Chuyển giao THRIFT" để bảo đảm cam kết cung ứng RENT.
              </p>
            </div>
          </div>
        </div>

        {/* Section 2: Rental History */}
        <section className="bg-[#f1ede6] p-6 lg:p-8 rounded-xl shadow-md flex flex-col gap-6 border border-[#ebe8e1]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#dddad3] pb-4">
            <div>
              <span className="font-mono text-[11px] uppercase tracking-wider text-[#576151] font-bold">Mục 02 • Hồ sơ luân chuyển</span>
              <h3 className="font-serif text-xl text-[#141310]">Lịch Sử Thuê &amp; Khách Hàng Lưu Ký</h3>
            </div>
            <Link
              to="/shop/rent/orders"
              className="text-xs text-[#7b766f] hover:text-[#141310] font-mono uppercase font-semibold flex items-center gap-1"
            >
              <span>Xem đơn hàng xưởng</span>
              <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
            </Link>
          </div>

          <div className="bg-white p-8 rounded-lg text-center border border-[#ebe8e1] space-y-2">
            <span className="material-symbols-outlined text-3xl text-[#7b766f]">history_toggle_off</span>
            <p className="text-sm font-semibold text-[#141310]">Hiện vật chưa phát sinh lịch sử đơn thuê cá thể</p>
            <p className="text-xs text-[#7b766f] max-w-xl mx-auto">
              Khi khách hàng đặt thuê hiện vật #{unit.id}, hợp đồng thuê, thông tin khách hàng và nhật ký đối kiểm xuất/nhập xưởng sẽ tự động đồng bộ tại đây.
            </p>
            <div className="pt-2">
              <Link
                to="/shop/rent/orders"
                className="inline-flex items-center gap-1 px-4 py-2 bg-[#f1ede6] hover:bg-[#ebe8e1] rounded text-xs font-semibold uppercase text-[#141310] transition-colors"
              >
                <span>Kiểm tra danh sách đơn thuê của xưởng</span>
                <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
              </Link>
            </div>
          </div>
        </section>

        {/* Section 4: Condition History & Inspection Timeline */}
        <section className="bg-[#f1ede6] p-6 lg:p-8 rounded-xl shadow-md flex flex-col gap-8 border border-[#ebe8e1]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#dddad3] pb-4">
            <div>
              <span className="font-mono text-[11px] uppercase tracking-wider text-[#576151] font-bold">Mục 04 • Chứng thư thẩm định vật lý</span>
              <h3 className="font-serif text-xl text-[#141310]">Nhật Ký Tình Trạng &amp; Thẩm Định Hiện Vật</h3>
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white rounded shadow-sm text-xs font-mono border border-[#ebe8e1]">
              <span className="text-[#576151] font-bold">{unit.conditionGrade}</span>
              <span>•</span>
              <span>Mã #{unit.id}</span>
            </div>
          </div>

          <div className="relative pl-6 sm:pl-8 space-y-8 before:absolute before:left-2 sm:before:left-3 before:top-3 before:bottom-3 before:w-0.5 before:bg-[#dddad3]">
            {/* Step 1 */}
            <div className="relative flex flex-col gap-2">
              <div className="absolute -left-6 sm:-left-8 top-1.5 w-4 h-4 rounded-full bg-[#576151] ring-4 ring-[#f1ede6]"></div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-mono text-xs font-bold text-[#141310]">TÌNH TRẠNG HIỆN TẠI ĐƯỢC CHỨNG THỰC (LATEST GRADE)</span>
                <span className="px-2 py-0.5 bg-[#d8e3ce] text-[#3f4a3a] text-[10px] font-mono font-bold rounded">
                  Niêm phong #{unit.serialNumber.replace('#', '')}
                </span>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm text-xs space-y-2 border border-[#ebe8e1]">
                <p className="text-[#1c1c18] leading-relaxed">
                  Thiết bị <strong>{unit.productName}</strong> đạt chuẩn kiểm định xưởng với phân hạng tình trạng <strong>{unit.conditionGrade}</strong>. Hiện vật được lưu trữ và bảo quản tiêu chuẩn tại {unit.location}.
                </p>
                <div className="flex flex-wrap gap-4 pt-1 font-mono text-[11px] text-[#7b766f]">
                  <span>Mã SKU: <strong>{unit.sku}</strong></span>
                  <span>•</span>
                  <span>Chu kỳ luân chuyển: <strong>{unit.cycleCount} lượt</strong></span>
                  <span>•</span>
                  <span>Tỉ lệ khấu hao: <strong>{unit.depreciationRate}</strong></span>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative flex flex-col gap-2">
              <div className="absolute -left-6 sm:-left-8 top-1.5 w-4 h-4 rounded-full bg-[#141310] ring-4 ring-[#f1ede6]"></div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-mono text-xs font-bold text-[#141310]">TÌNH TRẠNG KHI NHẬP KHO XƯỞNG (ORIGINAL RECEIPT)</span>
                <span className="px-2 py-0.5 bg-[#ebe8e1] text-[#7b766f] text-[10px] font-mono font-medium rounded">Khởi tạo</span>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm text-xs space-y-1.5 border border-[#ebe8e1]">
                <p className="text-[#1c1c18] leading-relaxed">
                  Hiện vật hoàn tất đăng ký giám hộ và nhập kho hệ thống. Khởi tạo mã định danh độc bản <strong>#{unit.id}</strong> (Serial: {unit.serialNumber}). Sẵn sàng cấp phép cho hoạt động thuê RENT hoặc chuyển nhượng THRIFT.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Bottom Action Ribbon */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 bg-[#f1ede6] rounded-lg text-xs border border-[#ebe8e1]">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[#576151] text-[24px]">verified</span>
            <div className="text-[#141310] leading-tight">
              <strong>Bảo chứng Minh bạch Trọn đời:</strong> Mọi lịch sử lưu ký, kiểm định và chuyển đổi hiện vật đều được ký số băm bất biến trên sổ cái Atelier Chronos.
            </div>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Link
              to="/shop/rent/inventory"
              className="w-full sm:w-auto px-4 py-2.5 bg-white text-[#141310] hover:bg-[#ebe8e1] rounded text-center font-semibold uppercase tracking-wider border border-[#ebe8e1]"
            >
              Quay lại danh sách
            </Link>
            <button
              type="button"
              disabled={specimenState !== 'ELIGIBLE'}
              onClick={() => alert(`Bắt đầu quy trình chuyển giao ${unit.id} sang sàn bán đứt THRIFT!`)}
              className={`w-full sm:w-auto px-5 py-2.5 text-white rounded text-center font-semibold uppercase tracking-wider ${specimenState === 'ELIGIBLE'
                  ? 'bg-[#141310] hover:bg-[#292724] cursor-pointer'
                  : 'bg-gray-400 opacity-50 cursor-not-allowed'
                }`}
            >
              Chuyển sang THRIFT →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};