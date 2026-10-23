import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { mockInventoryUnits } from '../../data/shop/inventoryData';

export const InventoryDashboard: React.FC = () => {
  // Tabs lọc trạng thái
  const [activeTab, setActiveTab] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedCondition, setSelectedCondition] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<string>('CYCLES_DESC');

  // Lọc dữ liệu theo tab & search
  const filteredUnits = mockInventoryUnits.filter((item) => {
    if (activeTab === 'READY' && item.status !== 'AVAILABLE') return false;
    if (activeTab === 'RENTING' && item.status !== 'RENTING') return false;
    if (activeTab === 'INSPECTION' && item.status !== 'INSPECTION') return false;
    if (activeTab === 'MAINTENANCE' && item.status !== 'MAINTENANCE') return false;
    if (activeTab === 'THRIFT' && item.status !== 'ELIGIBLE_FOR_THRIFT') return false;

    const matchesSearch =
      item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.currentOrderCode && item.currentOrderCode.toLowerCase().includes(searchTerm.toLowerCase()));
    if (!matchesSearch) return false;

    if (selectedProduct !== 'ALL' && !item.productName.toLowerCase().includes(selectedProduct.toLowerCase())) {
      return false;
    }
    if (selectedCategory !== 'ALL' && !item.category.toLowerCase().includes(selectedCategory.toLowerCase())) {
      return false;
    }
    if (selectedCondition !== 'ALL' && !item.conditionGrade.toLowerCase().includes(selectedCondition.toLowerCase())) {
      return false;
    }

    return true;
  }).sort((a, b) => {
    if (sortBy === 'CYCLES_DESC') return b.cycleCount - a.cycleCount;
    if (sortBy === 'ID_ASC') return a.id.localeCompare(b.id);
    return 0;
  });

  return (
    <div className="w-full flex flex-col font-sans text-[#1c1c18] bg-[#fdf9f2]">
      {/* Header Title & Action Area */}
      <section className="w-full bg-[#fdf9f2] px-5 lg:px-12 pt-8 pb-6">
        <div className="max-w-[1440px] mx-auto flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-[#f1ede6] rounded text-[#4a463f] text-[11px] uppercase tracking-widest font-semibold">
              <span className="w-2 h-2 rounded-full bg-[#576151]"></span>
              <span>Atelier Chronos &amp; Optics • Custody Archive Hub</span>
            </div>
            <h1 className="font-serif text-3xl lg:text-4xl text-[#141310] tracking-tight font-normal">
              Kho Hiện vật Cho thuê <span className="italic font-normal text-[#576151]">RENT</span>
            </h1>
            <p className="text-sm sm:text-base text-[#4a463f] leading-relaxed">
              Quản lý chi tiết từng cá thể hiện vật (Serialized Physical Units), vòng đời luân chuyển, tình trạng thẩm định buồng máy và đối soát điều kiện chuyển giao sang sàn bán đứt THRIFT.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Link
              to="/shop/rent/products"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#f1ede6] hover:bg-[#ebe8e1] text-[#141310] text-xs uppercase tracking-wider font-semibold rounded shadow-sm transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              <span>Quay lại Sản phẩm</span>
            </Link>
            <Link
              to="/shop/rent/create"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#141310] hover:bg-[#292724] text-white text-xs uppercase tracking-wider font-semibold rounded shadow-md hover:shadow-lg transition-all"
            >
              <span className="material-symbols-outlined text-[18px]">add_box</span>
              <span>+ Nhập Hiện vật Mới</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Inventory Metric Cards (KPI Bento Strip) */}
      <section className="w-full px-5 lg:px-12 pb-6">
        <div className="max-w-[1440px] mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Card 1: Available */}
          <div className="bg-[#f7f3ec] p-5 rounded shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between border border-[#ebe8e1]">
            <div className="flex items-start justify-between">
              <span className="text-xs uppercase tracking-wider text-[#576151] font-semibold">Sẵn sàng xuất kho</span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#576151]"></span>
            </div>
            <div className="my-3 flex items-baseline gap-2">
              <span className="font-serif text-3xl font-semibold text-[#141310]">8</span>
              <span className="text-xs text-[#7b766f]">/ 24 máy (33.3%)</span>
            </div>
            <div className="w-full bg-[#e6e2db] rounded-full h-1.5 overflow-hidden">
              <div className="bg-[#576151] h-full rounded-full" style={{ width: '33.3%' }}></div>
            </div>
            <span className="mt-2 text-xs text-[#7b766f]">Niêm phong kiểm định A+</span>
          </div>

          {/* Card 2: Rented */}
          <div className="bg-[#f7f3ec] p-5 rounded shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between border border-[#ebe8e1]">
            <div className="flex items-start justify-between">
              <span className="text-xs uppercase tracking-wider text-[#292724] font-semibold">Đang cho thuê</span>
              <span className="material-symbols-outlined text-[#576151] text-[20px]">swap_horiz</span>
            </div>
            <div className="my-3 flex items-baseline gap-2">
              <span className="font-serif text-3xl font-semibold text-[#141310]">14</span>
              <span className="text-xs text-[#7b766f]">/ 24 máy (58.3%)</span>
            </div>
            <div className="w-full bg-[#e6e2db] rounded-full h-1.5 overflow-hidden">
              <div className="bg-[#141310] h-full rounded-full" style={{ width: '58.3%' }}></div>
            </div>
            <span className="mt-2 text-xs text-[#7b766f]">Hợp đồng custody hoạt động</span>
          </div>

          {/* Card 3: Return Inspection */}
          <div className="bg-[#f7f3ec] p-5 rounded shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between border border-[#ebe8e1]">
            <div className="flex items-start justify-between">
              <span className="text-xs uppercase tracking-wider text-[#4a463f] font-semibold">Chờ đối kiểm hoàn trả</span>
              <span className="material-symbols-outlined text-[#7b766f] text-[20px]">inventory</span>
            </div>
            <div className="my-3 flex items-baseline gap-2">
              <span className="font-serif text-3xl font-semibold text-[#141310]">2</span>
              <span className="text-xs text-[#7b766f]">hiện vật</span>
            </div>
            <div className="w-full bg-[#e6e2db] rounded-full h-1.5 overflow-hidden">
              <div className="bg-[#7b766f] h-full rounded-full" style={{ width: '25%' }}></div>
            </div>
            <span className="mt-2 text-xs text-[#7b766f]">Đang tại trạm Nanuk 4h SLA</span>
          </div>

          {/* Card 4: Maintenance */}
          <div className="bg-[#f7f3ec] p-5 rounded shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between border border-[#ebe8e1]">
            <div className="flex items-start justify-between">
              <span className="text-xs uppercase tracking-wider text-[#7b766f] font-semibold">Bảo dưỡng buồng máy</span>
              <span className="material-symbols-outlined text-[#7b766f] text-[20px]">build_circle</span>
            </div>
            <div className="my-3 flex items-baseline gap-2">
              <span className="font-serif text-3xl font-semibold text-[#141310]">2</span>
              <span className="text-xs text-[#7b766f]">hiện vật</span>
            </div>
            <div className="w-full bg-[#e6e2db] rounded-full h-1.5 overflow-hidden">
              <div className="bg-[#ccc5bc] h-full rounded-full" style={{ width: '25%' }}></div>
            </div>
            <span className="mt-2 text-xs text-[#7b766f]">Hiệu chuẩn Collimator quang học</span>
          </div>

          {/* Card 5: Eligible for THRIFT */}
          <div className="bg-[#292724] p-5 rounded shadow-md text-white hover:shadow-lg transition-shadow relative overflow-hidden flex flex-col justify-between border border-[#494643]">
            <div className="flex items-start justify-between">
              <span className="text-xs uppercase tracking-widest text-[#f0e0cb] font-bold">Đủ chuẩn sang THRIFT</span>
              <span className="material-symbols-outlined text-[#f0e0cb] text-[20px]">verified</span>
            </div>
            <div className="my-3 flex items-baseline gap-2">
              <span className="font-serif text-3xl font-semibold text-white">3</span>
              <span className="text-xs text-[#d3c4b0]">hiện vật sẵn sàng</span>
            </div>
            <div className="w-full bg-[#181106] rounded-full h-1.5 overflow-hidden">
              <div className="bg-[#f0e0cb] h-full rounded-full" style={{ width: '100%' }}></div>
            </div>
            <span className="mt-2 text-xs text-[#d3c4b0]">&gt;15 chu kỳ • Khấu hao &gt;85%</span>
          </div>
        </div>
      </section>

      {/* Circular Economy Protocol Banner */}
      <section className="w-full px-5 lg:px-12 pb-8">
        <div className="max-w-[1440px] mx-auto bg-[#f1ede6] p-6 rounded shadow-sm relative overflow-hidden border border-[#ebe8e1]">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#576151] text-[22px]">all_inclusive</span>
                <span className="text-sm font-semibold text-[#141310]">Quy chuẩn Luân chuyển Tuần hoàn (Circular Custody Protocol)</span>
              </div>
              <p className="text-xs sm:text-sm text-[#4a463f] leading-relaxed">
                Quy trình khép kín: <strong className="text-[#141310] font-semibold">THUÊ (RENT)</strong> → SỬ DỤNG AN TOÀN → HOÀN TRẢ → ĐỐI KIỂM XƯỞNG → BẢO DƯỠNG →{' '}
                <strong className="text-[#141310] font-semibold">CHUYỂN GIAO THRIFT (BÁN ĐỨT)</strong>. Chỉ hiện vật đã hoàn trả trọn vẹn, vượt qua đối kiểm kỹ thuật buồng cảm biến, không còn lịch hẹn thuê tương lai và khấu hao đủ điều kiện mới được mở khóa bán THRIFT.
              </p>
            </div>
            <div className="flex items-center gap-3 bg-[#f7f3ec] px-4 py-3 rounded shadow-sm shrink-0 border border-[#ebe8e1]">
              <span className="material-symbols-outlined text-[#ba1a1a] text-[24px]">gavel</span>
              <div className="text-left text-xs text-[#4a463f] max-w-xs">
                <strong className="text-[#141310] font-semibold block">Quy tắc bảo an xưởng:</strong>
                Hiện vật đang cho thuê tuyệt đối không thể can thiệp chuyển sàn bán.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Filter & Search Controls Bar */}
      <section className="w-full px-5 lg:px-12 pb-4">
        <div className="max-w-[1440px] mx-auto space-y-4">
          {/* Status Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none text-xs font-semibold uppercase tracking-wider">
            <button
              type="button"
              onClick={() => setActiveTab('ALL')}
              className={`px-4 py-2 rounded shrink-0 transition-colors shadow-sm ${
                activeTab === 'ALL' ? 'bg-[#141310] text-white' : 'bg-[#f1ede6] text-[#4a463f] hover:bg-[#ebe8e1]'
              }`}
            >
              Tất cả (29)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('READY')}
              className={`px-4 py-2 rounded shrink-0 transition-colors ${
                activeTab === 'READY' ? 'bg-[#141310] text-white' : 'bg-[#f1ede6] text-[#4a463f] hover:bg-[#ebe8e1]'
              }`}
            >
              Sẵn sàng (8)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('RENTING')}
              className={`px-4 py-2 rounded shrink-0 transition-colors ${
                activeTab === 'RENTING' ? 'bg-[#141310] text-white' : 'bg-[#f1ede6] text-[#4a463f] hover:bg-[#ebe8e1]'
              }`}
            >
              Đang cho thuê (14)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('INSPECTION')}
              className={`px-4 py-2 rounded shrink-0 transition-colors ${
                activeTab === 'INSPECTION' ? 'bg-[#141310] text-white' : 'bg-[#f1ede6] text-[#4a463f] hover:bg-[#ebe8e1]'
              }`}
            >
              Chờ đối kiểm (2)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('MAINTENANCE')}
              className={`px-4 py-2 rounded shrink-0 transition-colors ${
                activeTab === 'MAINTENANCE' ? 'bg-[#141310] text-white' : 'bg-[#f1ede6] text-[#4a463f] hover:bg-[#ebe8e1]'
              }`}
            >
              Đang bảo dưỡng (2)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('THRIFT')}
              className={`px-4 py-2 rounded shrink-0 transition-colors flex items-center gap-1.5 ${
                activeTab === 'THRIFT'
                  ? 'bg-[#292724] text-[#f0e0cb] shadow'
                  : 'bg-[#d8e3ce] text-[#151e11] hover:bg-[#c6d7bb]'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">verified</span>
              <span>Đủ điều kiện sang THRIFT (3)</span>
            </button>
          </div>

          {/* Search and Secondary Dropdowns */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
            <div className="md:col-span-5 relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#7b766f] text-[20px]">
                search
              </span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm theo Mã hiện vật (Serial ID), Tên máy, Hợp đồng thuê..."
                className="w-full pl-10 pr-4 py-2.5 bg-white text-[#141310] text-xs rounded border border-[#ebe8e1] shadow-sm focus:outline-none focus:border-[#576151]"
              />
            </div>

            <div className="md:col-span-2">
              <select
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                className="w-full px-3 py-2.5 bg-white text-[#4a463f] text-xs rounded border border-[#ebe8e1] shadow-sm focus:outline-none cursor-pointer"
              >
                <option value="ALL">Tất cả Sản phẩm</option>
                <option value="Hasselblad 907X">Hasselblad 907X 50C</option>
                <option value="Leica M10-R">Leica M10-R Rangefinder</option>
                <option value="Hasselblad 500C/M">Hasselblad 500C/M Body</option>
                <option value="Sony FX3">Sony FX3 Cinema</option>
                <option value="Canon EOS R6">Canon EOS R6 Mark II</option>
                <option value="Beosound 9000">Bang &amp; Olufsen Beosound 9000</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2.5 bg-white text-[#4a463f] text-xs rounded border border-[#ebe8e1] shadow-sm focus:outline-none cursor-pointer"
              >
                <option value="ALL">Phân loại Thiết bị</option>
                <option value="Medium Format">Medium Format Digital</option>
                <option value="Rangefinder">Vintage Rangefinder 35mm</option>
                <option value="Cinema">Cinema &amp; Video Rig</option>
                <option value="Hi-Fi">Hi-Fi Audio Circular</option>
              </select>
            </div>

            <div className="md:col-span-1.5">
              <select
                value={selectedCondition}
                onChange={(e) => setSelectedCondition(e.target.value)}
                className="w-full px-3 py-2.5 bg-white text-[#4a463f] text-xs rounded border border-[#ebe8e1] shadow-sm focus:outline-none cursor-pointer"
              >
                <option value="ALL">Độ mới</option>
                <option value="Mint-">Mint- 98-99%</option>
                <option value="Near Mint">Near Mint 94-97%</option>
                <option value="Excellent">Excellent 89-93%</option>
                <option value="Good Vintage">Good Vintage 85-88%</option>
              </select>
            </div>

            <div className="md:col-span-1.5">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2.5 bg-white text-[#4a463f] text-xs rounded border border-[#ebe8e1] shadow-sm focus:outline-none cursor-pointer"
              >
                <option value="CYCLES_DESC">Chu kỳ thuê cao nhất</option>
                <option value="ID_ASC">Mã Serial A-Z</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Physical Inventory Table Directory */}
      <section className="w-full px-5 lg:px-12 py-4">
        <div className="max-w-[1440px] mx-auto bg-white rounded shadow-sm overflow-hidden border border-[#ebe8e1]">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#f1ede6] text-[#4a463f] uppercase tracking-wider font-semibold">
                  <th className="py-3.5 px-4">Hiện vật &amp; SKU</th>
                  <th className="py-3.5 px-4">Mã Lưu ký / Serial</th>
                  <th className="py-3.5 px-4">Tình trạng vật lý</th>
                  <th className="py-3.5 px-4">Trạng thái hiện vật</th>
                  <th className="py-3.5 px-4">Đợt thuê hiện tại</th>
                  <th className="py-3.5 px-4">Ngày khả dụng</th>
                  <th className="py-3.5 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1ede6]">
                {filteredUnits.map((item) => (
                  <tr
                    key={item.id}
                    className={`hover:bg-[#f7f3ec] transition-colors ${
                      item.status === 'ELIGIBLE_FOR_THRIFT' ? 'bg-[#d8e3ce]/15' : 'bg-white'
                    }`}
                  >
                    {/* Col 1: Product & SKU */}
                    <td className="py-4 px-4 align-top">
                      <div className="flex items-center gap-3">
                        <img
                          src={item.imageUrl}
                          alt={item.productName}
                          className="w-14 h-14 object-cover rounded bg-[#f7f3ec] shrink-0 border border-[#ebe8e1]"
                        />
                        <div>
                          <div className="font-semibold text-sm text-[#141310]">{item.productName}</div>
                          <div className="text-[11px] text-[#7b766f] uppercase tracking-wider">{item.category}</div>
                        </div>
                      </div>
                    </td>

                    {/* Col 2: Serial ID */}
                    <td className="py-4 px-4 align-top">
                      <div className="font-semibold text-[#141310]">#{item.id}</div>
                      <div className="text-[11px] text-[#7b766f] font-mono tracking-wider">SN: {item.serialNumber}</div>
                    </td>

                    {/* Col 3: Condition Grade */}
                    <td className="py-4 px-4 align-top">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            item.status === 'ELIGIBLE_FOR_THRIFT'
                              ? 'bg-[#576151]'
                              : item.status === 'MAINTENANCE'
                              ? 'bg-amber-600'
                              : 'bg-[#576151]'
                          }`}
                        ></span>
                        <span className="font-semibold text-[#141310]">{item.conditionGrade}</span>
                      </div>
                      <div className="text-[#7b766f] mt-0.5">
                        {item.cycleCount} chu kỳ thuê • Khấu hao {item.depreciationRate}
                      </div>
                      {item.maintenanceNote && (
                        <div className="text-[#576151] font-medium text-[11px] mt-0.5">{item.maintenanceNote}</div>
                      )}
                    </td>

                    {/* Col 4: Status Badge */}
                    <td className="py-4 px-4 align-top">
                      {item.status === 'ELIGIBLE_FOR_THRIFT' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#141310] text-[#f0e0cb] text-[11px] uppercase tracking-wider rounded font-bold shadow-xs">
                          <span className="material-symbols-outlined text-[14px]">verified</span>
                          <span>ĐỦ ĐIỀU KIỆN SANG THRIFT</span>
                        </span>
                      )}
                      {item.status === 'RENTING' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#ebe8e1] text-[#141310] text-[11px] uppercase tracking-wider rounded font-semibold">
                          <span className="material-symbols-outlined text-[14px]">sync_alt</span>
                          <span>ĐANG CHO THUÊ</span>
                        </span>
                      )}
                      {item.status === 'AVAILABLE' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#d8e3ce] text-[#151e11] text-[11px] uppercase tracking-wider rounded font-semibold">
                          <span className="material-symbols-outlined text-[14px]">check</span>
                          <span>SẴN SÀNG XUẤT KHO</span>
                        </span>
                      )}
                      {item.status === 'INSPECTION' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#f1ede6] text-[#141310] text-[11px] uppercase tracking-wider rounded font-semibold border border-[#ccc5bc]">
                          <span className="material-symbols-outlined text-[14px]">search</span>
                          <span>CHỜ ĐỐI KIỂM HOÀN TRẢ</span>
                        </span>
                      )}
                      {item.status === 'MAINTENANCE' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#f7f3ec] text-[#7b766f] text-[11px] uppercase tracking-wider rounded font-semibold border border-[#ebe8e1]">
                          <span className="material-symbols-outlined text-[14px]">build</span>
                          <span>ĐANG HIỆU CHUẨN</span>
                        </span>
                      )}
                    </td>

                    {/* Col 5: Current Rental Info */}
                    <td className="py-4 px-4 align-top text-[#4a463f]">
                      {item.currentOrderCode ? (
                        <div>
                          <Link to="/shop/rent/orders" className="font-semibold text-[#141310] hover:underline">
                            {item.currentOrderCode}
                          </Link>
                          <div>Khách: {item.currentCustomerName}</div>
                          {item.returnDueDate && (
                            <div className="text-[#576151] font-medium text-[11px]">Hạn trả: {item.returnDueDate}</div>
                          )}
                        </div>
                      ) : (
                        <div>
                          <div className="text-[#576151] font-semibold flex items-center gap-1">
                            <span className="material-symbols-outlined text-[16px]">check_circle</span>
                            <span>Đã tất toán 100%</span>
                          </div>
                          <div className="text-[#7b766f] text-[11px]">Không có lịch đặt trước</div>
                        </div>
                      )}
                    </td>

                    {/* Col 6: Ready Date */}
                    <td className="py-4 px-4 align-top">
                      <span
                        className={`font-semibold ${
                          item.status === 'ELIGIBLE_FOR_THRIFT'
                            ? 'text-[#141310]'
                            : item.status === 'AVAILABLE'
                            ? 'text-[#576151]'
                            : 'text-[#141310]'
                        }`}
                      >
                        {item.readyDate}
                      </span>
                      {item.readyNote && <div className="text-[11px] text-[#7b766f]">{item.readyNote}</div>}
                    </td>

                    {/* Col 7: Actions */}
                    <td className="py-4 px-4 align-top text-right">
                      <div className="flex flex-col sm:flex-row items-end sm:items-center justify-end gap-2">
                        {item.status === 'ELIGIBLE_FOR_THRIFT' && (
                          <Link
                            to={`/shop/rent/convert-thrift/${item.id}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#141310] hover:bg-[#292724] text-white text-[11px] uppercase tracking-wider rounded font-semibold shadow-xs transition-all whitespace-nowrap"
                          >
                            <span>Chuyển sang THRIFT</span>
                            <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                          </Link>
                        )}
                        <Link
                          to={`/shop/rent/inventory/${item.id}`}
                          className="px-2.5 py-1.5 bg-[#f1ede6] hover:bg-[#ebe8e1] text-[#141310] text-[11px] uppercase tracking-wider rounded font-semibold transition-colors whitespace-nowrap"
                        >
                          Chi tiết
                        </Link>
                      </div>
                      {item.status === 'RENTING' && (
                        <div className="text-[10px] text-[#7b766f] mt-1">Đang thuê — Khóa chuyển THRIFT</div>
                      )}
                      {item.status === 'INSPECTION' && (
                        <div className="text-[10px] text-[#7b766f] mt-1">Đang đối kiểm — Khóa chuyển THRIFT</div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Toolbar */}
          <div className="p-4 bg-[#f7f3ec] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs border-t border-[#ebe8e1]">
            <div className="text-[#4a463f]">
              Hiển thị <span className="font-semibold text-[#141310]">1 - {filteredUnits.length}</span> trong tổng số{' '}
              <span className="font-semibold text-[#141310]">{mockInventoryUnits.length}</span> hiện vật vật lý đang lưu ký
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled
                className="p-1.5 rounded bg-white text-[#ccc5bc] disabled:opacity-40 border border-[#ebe8e1]"
              >
                <span className="material-symbols-outlined text-[18px]">chevron_left</span>
              </button>
              <button type="button" className="w-8 h-8 rounded bg-[#141310] text-white font-semibold flex items-center justify-center shadow-xs">
                1
              </button>
              <button type="button" className="w-8 h-8 rounded bg-white hover:bg-[#f1ede6] text-[#141310] font-medium flex items-center justify-center transition-colors border border-[#ebe8e1]">
                2
              </button>
              <button type="button" className="w-8 h-8 rounded bg-white hover:bg-[#f1ede6] text-[#141310] font-medium flex items-center justify-center transition-colors border border-[#ebe8e1]">
                3
              </button>
              <button type="button" className="w-8 h-8 rounded bg-white hover:bg-[#f1ede6] text-[#141310] font-medium flex items-center justify-center transition-colors border border-[#ebe8e1]">
                4
              </button>
              <button type="button" className="p-1.5 rounded bg-white text-[#141310] hover:bg-[#f1ede6] transition-colors border border-[#ebe8e1]">
                <span className="material-symbols-outlined text-[18px]">chevron_right</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Circular Heritage Transfer Policy Note */}
      <section className="w-full px-5 lg:px-12 pt-2 pb-10">
        <div className="max-w-[1440px] mx-auto bg-[#f7f3ec] p-6 rounded shadow-sm border border-[#ebe8e1]">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            <div className="md:col-span-8 space-y-2">
              <div className="flex items-center gap-2 text-[#141310] font-semibold text-sm">
                <span className="material-symbols-outlined text-[#576151] text-[22px]">policy</span>
                <span>Quy chuẩn chuyển dịch di sản tuần hoàn ReUse Hub</span>
              </div>
              <p className="text-xs sm:text-sm text-[#4a463f] leading-relaxed">
                Việc giải phóng hiện vật từ kho <strong className="text-[#141310]">CHO THUÊ (RENT)</strong> sang sàn{' '}
                <strong className="text-[#141310]">BÁN ĐỨT (THRIFT)</strong> tuân thủ tiêu chuẩn giám định B-Corp Circular. Khi bấm nút{' '}
                <span className="font-semibold text-[#141310]">"Chuyển sang THRIFT"</span>, hiện vật sẽ lập tức được đóng gói hồ sơ lịch sử thuê, đính kèm chứng nhận số bảo hành còn lại của Atelier Chronos &amp; Optics và chuyển tiếp sang bước định giá bán thứ cấp cuối cùng mà không làm gián đoạn quyền lợi của bất kỳ khách hàng thuê nào.
              </p>
            </div>
            <div className="md:col-span-4 flex md:justify-end">
              <Link
                to="/how-it-works"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-[#141310] hover:bg-[#f1ede6] rounded text-xs font-semibold uppercase tracking-wider shadow-sm transition-colors border border-[#ebe8e1]"
              >
                <span className="material-symbols-outlined text-[18px]">menu_book</span>
                <span>Xem Ledger &amp; Sổ lưu ký</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};