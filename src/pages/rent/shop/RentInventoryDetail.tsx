import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { mockInventoryUnits } from '../../data/shop/inventoryData';

export const RentInventoryDetail: React.FC = () => {
  const { itemId } = useParams<{ itemId: string }>();

  // Tìm kiếm hiện vật từ mock data theo ID, fallback về item đầu tiên
  const unit =
    mockInventoryUnits.find((u) => u.id === itemId) ||
    mockInventoryUnits.find((u) => u.id === 'INV-HB907-01') ||
    mockInventoryUnits[0];

  // State điều khiển mô phỏng trạng thái (ELIGIBLE | RENTING | MAINTENANCE)
  const [specimenState, setSpecimenState] = useState<'ELIGIBLE' | 'RENTING' | 'MAINTENANCE'>('ELIGIBLE');

  const handleExportIdentityCard = () => {
    alert('Đang tổng hợp Thẻ Lý Lịch Hiện Vật Độc Bản có mã QR bảo chứng chuỗi khối...');
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
              <span className="text-[#7b766f] uppercase tracking-wider text-[11px] font-semibold">Mô phỏng trạng thái:</span>
              <select
                className="bg-transparent text-[#141310] font-medium focus:outline-none cursor-pointer pr-2"
                value={specimenState}
                onChange={(e) => setSpecimenState(e.target.value as 'ELIGIBLE' | 'RENTING' | 'MAINTENANCE')}
              >
                <option value="ELIGIBLE">1. ĐỦ ĐIỀU KIỆN SANG THRIFT (Hiện tại)</option>
                <option value="RENTING">2. ĐANG CHO THUÊ (Active Rental)</option>
                <option value="MAINTENANCE">3. ĐANG BẢO DƯỠNG (Under Service)</option>
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
                  CUSTODY SEAL: #RH-TAG-88201
                </div>
                <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-white/85 text-[#141310] backdrop-blur-md rounded text-[10px] font-mono uppercase tracking-wider shadow-sm">
                  Trạm tủ ẩm A2 • Q.1, TP. HCM
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
                  alt="Bayonet mount inspection"
                />
                <div className="absolute bottom-1 right-1 bg-[#141310]/80 text-[9px] font-mono text-white px-1 rounded">Mount</div>
              </div>
              <div className="aspect-square bg-[#e6e2db] rounded overflow-hidden shadow-sm">
                <img
                  className="w-full h-full object-cover"
                  src={unit.thumbnailSensor || unit.imageUrl}
                  alt="Sensor inspection"
                />
                <div className="absolute bottom-1 right-1 bg-[#141310]/80 text-[9px] font-mono text-white px-1 rounded">Sensor</div>
              </div>
              <div className="aspect-square bg-[#e6e2db] rounded overflow-hidden shadow-sm">
                <img
                  className="w-full h-full object-cover"
                  src={unit.thumbnailOptics || unit.imageUrl}
                  alt="Lens optics inspection"
                />
                <div className="absolute bottom-1 right-1 bg-[#141310]/80 text-[9px] font-mono text-white px-1 rounded">Optics</div>
              </div>
              <div className="aspect-square bg-[#e6e2db] rounded overflow-hidden shadow-sm">
                <img
                  className="w-full h-full object-cover"
                  src={unit.thumbnailCase || unit.imageUrl}
                  alt="Nanuk hard case inspection"
                />
                <div className="absolute bottom-1 right-1 bg-[#141310]/80 text-[9px] font-mono text-white px-1 rounded">Case</div>
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
                      ĐANG CHO THUÊ (#RH-RNT-2024-8902)
                    </div>
                  )}
                  {specimenState === 'MAINTENANCE' && (
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#e6e2db] text-[#1c1c18] text-[12px] font-semibold tracking-wider uppercase rounded shadow-sm">
                      <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                      ĐANG BẢO DƯỠNG BUỒNG KÍNH (CLASS 1000)
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
                  Hiện vật quang học di sản trung định dạng (Medium Format) chuẩn Atelier Chronos. Đăng ký lưu ký số hoá độc bản phục vụ nhiếp ảnh kiến trúc &amp; mỹ thuật lưu niệm.
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
                  <span className="text-[11px] font-mono uppercase tracking-wider text-[#7b766f] block">Ngàm Ống Kính</span>
                  <span className="font-mono text-sm font-bold text-[#141310]">XCD Medium Format</span>
                </div>
                <div className="bg-white p-3 rounded shadow-sm border border-[#ebe8e1]">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-[#7b766f] block">Shutter Actuations</span>
                  <span className="font-mono text-sm font-bold text-[#141310]">{unit.shutterActuations || '4.820 / 100.000'}</span>
                </div>
                <div className="bg-white p-3 rounded shadow-sm border border-[#ebe8e1]">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-[#7b766f] block">Chuyên Viên Quản Lý</span>
                  <span className="text-sm font-medium text-[#141310]">{unit.curatorName || 'Vũ Thanh Tùng (#01)'}</span>
                </div>
                <div className="bg-white p-3 rounded shadow-sm border border-[#ebe8e1]">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-[#7b766f] block">Giá Niêm Yết Thuê</span>
                  <span className="font-mono text-sm font-bold text-[#141310]">{unit.listedRentPrice || '450.000 ₫ / ngày'}</span>
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
          className={`p-8 rounded-xl shadow-md transition-all border border-[#ebe8e1] ${
            specimenState === 'ELIGIBLE'
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
              <span className="text-[11px] text-[#7b766f] font-medium">1. Hoàn tất đơn gần nhất</span>
              <div className="flex items-center justify-between mt-2">
                <span className="font-bold text-xs text-[#141310] font-mono">#RH-8845</span>
                <span className="text-[10px] font-bold text-[#3f4a3a] bg-[#d8e3ce] px-2 py-0.5 rounded">ĐẠT (Nghiệm thu)</span>
              </div>
            </div>
            <div className="bg-white/80 p-3.5 rounded shadow-sm flex flex-col justify-between border border-[#ebe8e1]">
              <span className="text-[11px] text-[#7b766f] font-medium">2. Vị trí thực tế xưởng</span>
              <div className="flex items-center justify-between mt-2">
                <span className="font-bold text-xs text-[#141310] font-mono">Tủ ẩm A2 (Q.1)</span>
                <span className="text-[10px] font-bold text-[#3f4a3a] bg-[#d8e3ce] px-2 py-0.5 rounded">ĐẠT (Đã hồi kho)</span>
              </div>
            </div>
            <div className="bg-white/80 p-3.5 rounded shadow-sm flex flex-col justify-between border border-[#ebe8e1]">
              <span className="text-[11px] text-[#7b766f] font-medium">3. Biên bản kỹ thuật</span>
              <div className="flex items-center justify-between mt-2">
                <span className="font-bold text-xs text-[#141310] font-mono">Mint- 98.0%</span>
                <span className="text-[10px] font-bold text-[#3f4a3a] bg-[#d8e3ce] px-2 py-0.5 rounded">ĐẠT (Sensor sạch)</span>
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
                <span className="font-bold text-xs text-[#141310] font-mono">{unit.cycleCount} / 10 Chu kỳ</span>
                <span className="text-[10px] font-bold text-[#3f4a3a] bg-[#d8e3ce] px-2 py-0.5 rounded">ĐẠT (Khấu hao 86%)</span>
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
                  <span className="w-1.5 h-1.5 rounded-full bg-[#576151]"></span> SẴN SÀNG LƯU KHO LẠNH
                </span>
              </div>
              <p className="text-sm text-[#1c1c18] leading-relaxed">
                Đã hoàn tất đối kiểm hồi xưởng sau đơn thuê <strong>{unit.currentOrderCode || '#RH-RNT-2024-8845'}</strong> (Khách thuê: {unit.currentCustomerName || 'Elena Rostova'}). Hiện vật đang được lưu kho an toàn tại <strong>{unit.location}</strong>.
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
                  Hiện vật đã đạt điểm rơi khấu hao tối ưu (trên 80%). Theo quy chế Atelier B-Corp, tiếp tục duy trì cho thuê sẽ phát sinh nguy cơ rủi ro cảm biến 50MP; do đó chuyển giao sang quyền sở hữu vĩnh viễn (THRIFT) là khuyến nghị tối ưu nhất.
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
                <span className="font-bold text-[#141310] uppercase tracking-wider font-mono">Tháng 11 — 12 / 2024</span>
                <span className="px-2 py-0.5 bg-[#d8e3ce] text-[#3f4a3a] text-[10px] font-bold rounded">Trống Lịch 100%</span>
              </div>
              {/* Mini Calendar Strip */}
              <div className="grid grid-cols-7 gap-1 text-center font-mono text-xs">
                <span className="text-[#7b766f] text-[10px]">T2</span>
                <span className="text-[#7b766f] text-[10px]">T3</span>
                <span className="text-[#7b766f] text-[10px]">T4</span>
                <span className="text-[#7b766f] text-[10px]">T5</span>
                <span className="text-[#7b766f] text-[10px]">T6</span>
                <span className="text-[#7b766f] text-[10px]">T7</span>
                <span className="text-[#7b766f] text-[10px]">CN</span>
                <div className="p-2 bg-[#ebe8e1] text-[#7b766f] rounded line-through">17</div>
                <div className="p-2 bg-[#ebe8e1] text-[#7b766f] rounded line-through">18</div>
                <div className="p-2 bg-[#d8e3ce]/50 font-bold text-[#576151] rounded">19</div>
                <div className="p-2 bg-[#d8e3ce] text-[#141310] font-bold rounded ring-1 ring-[#576151]">20</div>
                <div className="p-2 bg-[#f7f3ec] text-[#141310] rounded">21</div>
                <div className="p-2 bg-[#f7f3ec] text-[#141310] rounded">22</div>
                <div className="p-2 bg-[#f7f3ec] text-[#141310] rounded">23</div>
                <div className="p-2 bg-[#f7f3ec] text-[#141310] rounded">24</div>
                <div className="p-2 bg-[#f7f3ec] text-[#141310] rounded">25</div>
                <div className="p-2 bg-[#f7f3ec] text-[#141310] rounded">26</div>
                <div className="p-2 bg-[#f7f3ec] text-[#141310] rounded">27</div>
                <div className="p-2 bg-[#f7f3ec] text-[#141310] rounded">28</div>
                <div className="p-2 bg-[#f7f3ec] text-[#141310] rounded">29</div>
                <div className="p-2 bg-[#f7f3ec] text-[#141310] rounded">30</div>
              </div>

              {/* Timeline Status Notes */}
              <div className="space-y-2 pt-2 border-t border-[#f1ede6] text-xs">
                <div className="flex items-start gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#576151] mt-1.5 shrink-0"></span>
                  <span className="text-[#1c1c18]"><strong>Hiện tại (19/11):</strong> Hoàn trả &amp; kiểm tra buồng kín xong, không có lịch chờ.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#d8e3ce] mt-1.5 shrink-0"></span>
                  <span className="text-[#7b766f]"><strong>60 Ngày tới:</strong> Không có xung đột lịch custody. Đạt điều kiện đóng băng để chuyển sàn bán.</span>
                </div>
              </div>
            </div>

            <div className="bg-[#ebe8e1] p-4 rounded-lg text-xs flex flex-col gap-2 border border-[#dddad3]">
              <div className="font-semibold text-[#141310] flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-[#576151]">info</span>
                Quy định bảo lưu luân chuyển
              </div>
              <p className="text-[#4a463f] leading-relaxed">
                Nếu có bất kỳ khách hàng nào thanh toán tiền cọc giữ máy trong tương lai, hệ thống sẽ tự động phong tỏa nút "Chuyển giao THRIFT" để đảm bảo giao ước cung ứng RENT.
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
            <span className="text-xs text-[#7b766f] font-mono">Hiển thị {unit.recentOrders?.length || 4} đơn thuê gần nhất</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs bg-white rounded-lg overflow-hidden border border-[#ebe8e1]">
              <thead>
                <tr className="bg-[#ebe8e1] font-mono text-[11px] uppercase tracking-wider text-[#4a463f]">
                  <th className="py-3 px-4 font-semibold">Mã Hợp Đồng</th>
                  <th className="py-3 px-4 font-semibold">Khách Hàng Lưu Ký</th>
                  <th className="py-3 px-4 font-semibold">Thời Gian Thuê</th>
                  <th className="py-3 px-4 font-semibold">Doanh Thu RENT</th>
                  <th className="py-3 px-4 font-semibold">Cọc Escrow</th>
                  <th className="py-3 px-4 font-semibold">Tình Trạng Trả Máy</th>
                  <th className="py-3 px-4 font-semibold text-right">Chi Tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1ede6]">
                {(unit.recentOrders || [
                  {
                    orderCode: '#RH-RNT-2024-8845',
                    customerName: 'Elena Rostova',
                    duration: '14/11 — 19/11/2024 (5 ngày)',
                    revenue: '2.250.000 ₫',
                    escrow: '16.000.000 ₫',
                    status: 'Đã hoàn cọc 100%',
                    returnCondition: 'Hoàn hảo, không vết xước',
                  },
                  {
                    orderCode: '#RH-RNT-2024-8712',
                    customerName: 'Trần Quốc Nam',
                    duration: '28/10 — 02/11/2024 (5 ngày)',
                    revenue: '2.250.000 ₫',
                    escrow: '16.000.000 ₫',
                    status: 'Đã hoàn tất thanh toán',
                    returnCondition: 'Sensor sạch, ngàm tốt',
                  },
                  {
                    orderCode: '#RH-RNT-2024-8501',
                    customerName: 'Lê Minh Khoa',
                    duration: '10/10 — 15/10/2024 (5 ngày)',
                    revenue: '2.250.000 ₫',
                    escrow: '16.000.000 ₫',
                    status: 'Hoàn tất an toàn',
                    returnCondition: 'Tốt, có vết bụi nhẹ đã thổi',
                  },
                  {
                    orderCode: '#RH-RNT-2024-8210',
                    customerName: 'Studio Lumina',
                    duration: '15/09 — 25/09/2024 (10 ngày)',
                    revenue: '4.050.000 ₫',
                    escrow: '16.000.000 ₫',
                    status: 'Đã hoàn 100%',
                    returnCondition: 'Hoàn trả nguyên vẹn phụ kiện',
                  },
                ]).map((order, idx) => (
                  <tr key={idx} className="hover:bg-[#f7f3ec] transition-colors">
                    <td className="py-4 px-4 font-mono font-bold text-[#141310]">
                      {order.orderCode}
                      <span className="block text-[10px] text-[#576151] font-normal font-sans">
                        {idx === 0 ? 'Gần nhất • Đã quyết toán' : 'Đã quyết toán'}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="font-semibold text-[#141310]">{order.customerName}</div>
                      <div className="text-[11px] text-[#7b766f]">Xác thực tài khoản cá nhân</div>
                    </td>
                    <td className="py-4 px-4 font-mono">
                      <div>{order.duration}</div>
                    </td>
                    <td className="py-4 px-4 font-mono font-semibold text-[#141310]">{order.revenue}</td>
                    <td className="py-4 px-4">
                      <div className="font-mono text-[#141310] font-medium">{order.escrow}</div>
                      <div className="text-[10px] text-[#576151] font-semibold">{order.status}</div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center gap-1 text-[#576151] font-medium">
                        <span className="material-symbols-outlined text-[15px]">check_circle</span>
                        {order.returnCondition}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <Link
                        to="/shop/rent/orders"
                        className="inline-flex items-center gap-1 font-semibold text-[#141310] hover:text-[#576151] transition-colors font-mono uppercase text-[11px]"
                      >
                        Xem đơn thuê →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between text-xs text-[#7b766f] pt-2 border-t border-[#dddad3]">
            <span>Tổng cộng doanh thu luân chuyển lũy kế: <strong className="text-[#141310] font-mono">31.500.000 ₫</strong></span>
            <Link className="font-mono uppercase tracking-wider text-[#141310] hover:text-[#576151] font-medium" to="/shop/rent/orders">
              Xem tất cả 14 chu kỳ lưu ký →
            </Link>
          </div>
        </section>

        {/* Section 4: Condition History & Inspection Timeline */}
        <section className="bg-[#f1ede6] p-6 lg:p-8 rounded-xl shadow-md flex flex-col gap-8 border border-[#ebe8e1]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#dddad3] pb-4">
            <div>
              <span className="font-mono text-[11px] uppercase tracking-wider text-[#576151] font-bold">Mục 04 • Chứng thư thẩm định vật lý</span>
              <h3 className="font-serif text-xl text-[#141310]">Nhật Ký Tình Trạng &amp; Thẩm Định Buồng Máy</h3>
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white rounded shadow-sm text-xs font-mono border border-[#ebe8e1]">
              <span className="text-[#576151] font-bold">GRADE MINT- 98.0%</span>
              <span>•</span>
              <span>Shutter: 4.820 shots</span>
            </div>
          </div>

          <div className="relative pl-6 sm:pl-8 space-y-8 before:absolute before:left-2 sm:before:left-3 before:top-3 before:bottom-3 before:w-0.5 before:bg-[#dddad3]">
            {/* Step 1 */}
            <div className="relative flex flex-col gap-2">
              <div className="absolute -left-6 sm:-left-8 top-1.5 w-4 h-4 rounded-full bg-[#576151] ring-4 ring-[#f1ede6]"></div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-mono text-xs font-bold text-[#141310]">19/11/2024 — TÌNH TRẠNG HIỆN TẠI ĐƯỢC CHỨNG THỰC (LATEST GRADE)</span>
                <span className="px-2 py-0.5 bg-[#d8e3ce] text-[#3f4a3a] text-[10px] font-mono font-bold rounded">Niêm phong #RH-SEAL-907</span>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm text-xs space-y-2 border border-[#ebe8e1]">
                <p className="text-[#1c1c18] leading-relaxed">
                  <strong>Nghiệm thu sau đơn #RH-RNT-2024-8845:</strong> Kiểm định viên cao cấp <em>Marcus Vance</em> xác nhận: Cảm biến 50MP sạch 100%, không phát hiện hạt bụi buồng gương tại khẩu f/16. Ngàm XCD không cấn trầy, các tiếp điểm mạ vàng điện tử nguyên bản. Màn hình lật cảm ứng 3.2-inch sáng rõ, không lưu ảnh.
                </p>
                <div className="flex flex-wrap gap-4 pt-1 font-mono text-[11px] text-[#7b766f]">
                  <span>Độ toàn vẹn bề mặt: <strong>98.0%</strong></span>
                  <span>•</span>
                  <span>Độ trong thấu kính XCD: <strong>100%</strong></span>
                  <span>•</span>
                  <span>Màn trập cơ học: <strong>4.820 / 100.000</strong></span>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative flex flex-col gap-2">
              <div className="absolute -left-6 sm:-left-8 top-1.5 w-4 h-4 rounded-full bg-[#141310] ring-4 ring-[#f1ede6]"></div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-mono text-xs font-bold text-[#141310]">20/10/2024 — BẢO DƯỠNG ĐỊNH KỲ TẬP TRUNG (CLASS 1000 LAB)</span>
                <span className="px-2 py-0.5 bg-[#ebe8e1] text-[#7b766f] text-[10px] font-mono font-medium rounded">Bảo trì cấp 2</span>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm text-xs space-y-1.5 border border-[#ebe8e1]">
                <p className="text-[#1c1c18] leading-relaxed">
                  Vệ sinh khử khuẩn quang học buồng kín chuẩn Class 1000. Nâng cấp Firmware thân máy lên v1.4.2 (bổ sung lấy nét nhận diện khoảng cách tối ưu). Tra dầu chuyên dụng vòng zoom và vòng lấy nét ống kính XCD 45mm.
                </p>
                <div className="text-[#7b766f] font-mono text-[11px]">Kỹ thuật viên trưởng: Đỗ Gia Bảo • Thời gian lưu trạm: 14 Giờ</div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative flex flex-col gap-2">
              <div className="absolute -left-6 sm:-left-8 top-1.5 w-4 h-4 rounded-full bg-[#7b766f] ring-4 ring-[#f1ede6]"></div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-mono text-xs font-bold text-[#141310]">02/11/2024 — NGHIỆM THU HOÀN TRẢ ĐƠN #8712</span>
                <span className="px-2 py-0.5 bg-[#ebe8e1] text-[#7b766f] text-[10px] font-mono font-medium rounded">Nghiệm thu tiêu chuẩn</span>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm text-xs border border-[#ebe8e1]">
                <p className="text-[#1c1c18] leading-relaxed">
                  Nghiệm thu vật phẩm sau đợt thuê của khách Trần Quốc Nam. Bề mặt da bọc tay cầm nguyên vẹn, vòng cao su lấy nét chắc chắn. Test phơi sáng 30 giây đạt tỉ lệ tín hiệu/nhiễu (SNR) tối ưu.
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="relative flex flex-col gap-2">
              <div className="absolute -left-6 sm:-left-8 top-1.5 w-4 h-4 rounded-full bg-[#4a463f] ring-4 ring-[#f1ede6]"></div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-mono text-xs font-bold text-[#141310]">15/01/2024 — TÌNH TRẠNG BAN ĐẦU KHI NHẬP KHO XƯỞNG (ORIGINAL MINT)</span>
                <span className="px-2 py-0.5 bg-[#d8e3ce]/50 text-[#3f4a3a] text-[10px] font-mono font-bold rounded">Grade Pristine (100%)</span>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm text-xs space-y-1 border border-[#ebe8e1]">
                <p className="text-[#1c1c18] leading-relaxed">
                  Nhập kho mới từ đối tác phân phối ủy quyền Hasselblad Scandinavia. Nguyên đai nguyên kiện hộp gỗ thủ công &amp; vali chống sốc Nanuk. Màn trập: 12 shot test xuất xưởng. Cấp mã lưu ký #INV-HB907-01.
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
              className={`w-full sm:w-auto px-5 py-2.5 text-white rounded text-center font-semibold uppercase tracking-wider ${
                specimenState === 'ELIGIBLE'
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