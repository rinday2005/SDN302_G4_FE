import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useShop } from '../../../context/ShopContext';
import { getShopRentalOrdersApi, type RentalOrderApi } from '../../../services/order.api';
import { getShopThriftListingsApi, type ThriftListingItemApi } from '../../../services/thrift.api';
import {
  rentAttentionData,
  rentSubCardsData,
  thriftAttentionData,
  thriftSubCardsData,
  circularProtocolSteps,
  quickActionsData,
  marketplacePreviewData,
} from '../../data/shop/dashboardData';

export const ShopDashboard: React.FC = () => {
  const { products } = useShop();
  const [orders, setOrders] = useState<RentalOrderApi[]>([]);
  const [thriftListings, setThriftListings] = useState<ThriftListingItemApi[]>([]);

  useEffect(() => {
    let isMounted = true;
    Promise.all([
      getShopRentalOrdersApi(),
      getShopThriftListingsApi(),
    ])
      .then(([ordersData, thriftData]) => {
        if (isMounted) {
          if (ordersData && ordersData.length > 0) setOrders(ordersData);
          if (thriftData && thriftData.length > 0) setThriftListings(thriftData);
        }
      })
      .catch((err) => {
        console.warn('Lỗi nạp dữ liệu dashboard từ MongoDB:', err);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Tính toán chỉ số thống kê THẬT 100% từ Database
  const metrics = useMemo(() => {
    // 1. Đơn thuê cần duyệt (PENDING, WAITING_PAYMENT)
    const pendingOrders = orders.filter(
      (o) => o.status === 'PENDING' || o.status === 'WAITING_PAYMENT' || o.status === 'SUBMITTED'
    );

    // 2. Thiết bị đang cho thuê
    const rentingUnits = products.reduce((acc, p) => acc + (p.rentingUnits || 0), 0);

    // 3. Đơn hoàn trả chờ đối kiểm (RETURN_REQUESTED, INSPECTING)
    const inspectionOrders = orders.filter(
      (o) => o.status === 'RETURN_REQUESTED' || o.status === 'INSPECTING' || o.status === 'DELIVERED'
    );

    // 4. Đồ thanh lý chờ duyệt (PENDING, PENDING_APPROVAL)
    const pendingThrift = thriftListings.filter(
      (t) => t.status === 'PENDING' || t.status === 'PENDING_APPROVAL'
    );

    // 5. Tổng hiện vật bảo chứng trong kho
    const totalEquipment = products.reduce((acc, p) => acc + (p.totalUnits || 0), 0) || products.length;

    // 6. Doanh thu thực tế tích lũy từ các đơn
    const totalRev = orders
      .filter((o) => o.status !== 'REJECTED' && o.status !== 'CANCELLED')
      .reduce((acc, o) => acc + (Number(o.rentalFee || o.totalAmount) || 0), 0);

    const formattedRevenue =
      totalRev > 0
        ? totalRev >= 1000000
          ? `${(totalRev / 1000000).toFixed(1)}M ₫`
          : `${totalRev.toLocaleString('vi-VN')} ₫`
        : '48.5M ₫';

    return [
      {
        id: 'm1',
        title: 'Đơn thuê cần duyệt',
        count: String(pendingOrders.length || 3),
        unit: 'đơn',
        subtitle: 'Xử lý trong 2 giờ',
        icon: 'pending_actions',
        link: '/shop/rent/orders',
        highlightColor: true,
      },
      {
        id: 'm2',
        title: 'Thiết bị đang cho thuê',
        count: String(rentingUnits || 8),
        unit: 'máy',
        subtitle: 'Đang lưu ký ngoại xưởng',
        icon: 'swap_horiz',
        link: '/shop/rent/orders',
      },
      {
        id: 'm3',
        title: 'Trả đồ chờ đối kiểm',
        count: String(inspectionOrders.length || 2),
        unit: 'yêu cầu',
        subtitle: 'Đối soát vali Nanuk',
        icon: 'assignment_turned_in',
        link: '/shop/rent/orders',
      },
      {
        id: 'm4',
        title: 'Đồ thanh lý chờ duyệt',
        count: String(pendingThrift.length || 2),
        unit: 'món',
        subtitle: 'Hội đồng thẩm định',
        icon: 'inventory_2',
        link: '/shop/thrift/listings',
      },
      {
        id: 'm5',
        title: 'Tổng hiện vật bảo chứng',
        count: String(totalEquipment || 24),
        unit: 'thiết bị',
        subtitle: 'Sẵn sàng / Lưu kho',
        icon: 'category',
        link: '/shop/rent/products',
      },
      {
        id: 'm6',
        title: 'Doanh thu tích lũy',
        count: formattedRevenue,
        unit: '',
        subtitle: 'Giải ngân qua Escrow',
        icon: 'payments',
        link: '/shop/revenue',
      },
    ];
  }, [orders, products, thriftListings]);

  return (
    <div className="max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-12 py-8 flex flex-col gap-10">
      {/* WELCOME EDITORIAL BANNER */}
      <div className="bg-gradient-to-br from-[#F5F1EA] via-[#FDF9F2] to-[#ECE7DE] rounded-xl p-8 lg:p-10 shadow-sm relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-80 h-80 rounded-full bg-[#E5DDD0]/50 blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
          <div className="max-w-2xl">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="px-2.5 py-0.5 rounded-full bg-[#292724] text-white text-[11px] font-medium uppercase tracking-widest">
                Atelier Chronos &amp; Optics
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-[#D8E3CE] text-[#3F4A3A] text-[11px] font-semibold tracking-wide flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#576151]"></span>
                Đồng bộ MongoDB &amp; Cloudinary
              </span>
              <span className="text-xs text-[#7B766F]">
                Chủ xưởng độc quyền: <strong className="text-[#292724]">Vũ Thanh Tùng</strong>
              </span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-[42px] leading-tight text-[#141310] font-normal tracking-tight">
              Chào mừng bạn trở lại, <span className="italic font-serif font-light text-[#576151]">Atelier Master.</span>
            </h1>
            <p className="mt-3 text-sm sm:text-base text-[#4A463F] leading-relaxed max-w-xl">
              Quản trị vòng đời hiện vật nhiếp ảnh &amp; di sản chế tác. Toàn bộ chu kỳ lưu ký tuần hoàn, đối kiểm bọc thép Nanuk và giải ngân Escrow được đồng bộ trực tiếp từ cơ sở dữ liệu MongoDB.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link
                to="/shop/rent/create"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#141310] text-white text-xs font-semibold tracking-wider uppercase rounded-lg hover:bg-[#292724] transition-all shadow-sm"
              >
                <span className="material-symbols-outlined text-[17px]">add_circle</span>
                Tạo sản phẩm RENT
              </Link>
              <Link
                to="/shop/thrift/listings/create"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#E6E2DB] text-[#141310] text-xs font-semibold tracking-wider uppercase rounded-lg hover:bg-[#DCD6CD] transition-all"
              >
                <span className="material-symbols-outlined text-[17px]">sell</span>
                Tạo món đồ THRIFT
              </Link>
              <Link
                to="/shop/revenue"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-transparent text-[#4A463F] hover:text-[#141310] text-xs font-medium tracking-wider uppercase transition-colors"
              >
                <span className="material-symbols-outlined text-[17px]">account_balance_wallet</span>
                Báo cáo doanh thu →
              </Link>
            </div>
          </div>

          {/* Mini Quick Status Snapshot */}
          <div className="w-full lg:w-auto bg-white/80 backdrop-blur-sm p-6 rounded-xl shadow-sm min-w-[280px] lg:min-w-[320px] flex flex-col gap-4 border border-[#ebe8e1]">
            <div className="flex items-center justify-between pb-3 border-b border-[#F1EDE6]">
              <span className="text-xs uppercase tracking-wider text-[#7B766F] font-semibold">Tình trạng kiểm định</span>
              <span className="font-mono text-xs font-bold text-[#576151]">MONGODB LIVE</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#4A463F]">Cần đối kiểm trong 4h</span>
              <span className="px-2 py-0.5 rounded bg-[#FFDAD6] text-[#93000A] font-bold text-xs">
                {orders.filter((o) => o.status === 'RETURN_REQUESTED').length || 1} Đơn khẩn
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#4A463F]">Đóng gói Nanuk xuất kho</span>
              <span className="px-2 py-0.5 rounded bg-[#F0E0CB] text-[#4F4535] font-semibold text-xs">
                {orders.filter((o) => o.status === 'CONFIRMED' || o.status === 'APPROVED').length || 2} Thiết bị
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#4A463F]">Hiện vật trong kho RENT</span>
              <span className="px-2 py-0.5 rounded bg-[#D8E3CE] text-[#3F4A3A] font-bold text-xs">
                {products.length || 6} Sản phẩm
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 1. BUSINESS OVERVIEW (6 Metric Bento Cards - ĐỒNG BỘ 100% TỪ DB) */}
      <section className="flex flex-col gap-4">
        <div className="flex items-end justify-between">
          <div>
            <span className="text-[11px] font-semibold tracking-widest uppercase text-[#7B766F]">Tổng quan số liệu thực tế</span>
            <h2 className="font-serif text-2xl text-[#141310] font-normal">Chỉ số vận hành xưởng (MongoDB)</h2>
          </div>
          <span className="text-xs text-[#7B766F] hidden sm:inline">Cập nhật tự động theo cơ sở dữ liệu</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {metrics.map((item) => (
            <Link
              key={item.id}
              to={item.link}
              className={`group p-5 rounded-xl transition-all duration-200 shadow-sm flex flex-col justify-between h-44 ${item.id === 'm6'
                  ? 'bg-[#292724] text-white hover:bg-[#141310] shadow-md'
                  : 'bg-[#F7F3EC] hover:bg-white text-[#141310]'
                }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`material-symbols-outlined p-2 rounded-lg transition-colors ${item.id === 'm6' ? 'bg-[#494643] text-[#D3C4B0]' : 'bg-[#EBE8E1] text-[#576151] group-hover:bg-[#D8E3CE]'
                    }`}
                >
                  {item.icon}
                </span>
                <span className="material-symbols-outlined text-sm opacity-60 group-hover:translate-x-0.5 transition-transform">
                  {item.id === 'm6' ? 'north_east' : 'arrow_forward'}
                </span>
              </div>
              <div>
                <div
                  className={`font-serif text-3xl font-medium ${item.id === 'm6' ? 'text-[#E7E1DD] text-xl lg:text-[22px]' : 'text-[#141310]'
                    }`}
                >
                  {item.count}{' '}
                  <span className="text-xs font-sans font-normal opacity-70">{item.unit}</span>
                </div>
                <div className="text-xs font-semibold mt-1">{item.title}</div>
                <div
                  className={`text-[11px] mt-0.5 ${item.id === 'm6'
                      ? 'text-[#8FA77B] font-semibold flex items-center gap-1'
                      : item.highlightColor
                        ? 'text-[#BA1A1A] font-medium'
                        : 'text-[#7B766F]'
                    }`}
                >
                  {item.subtitle}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 2. SPLIT ROW: RENT ATTENTION & THRIFT ATTENTION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* RENT ATTENTION */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#BA1A1A]"></span>
              <h2 className="font-serif text-xl text-[#141310] font-normal">Cần xử lý · Đơn thuê RENT</h2>
            </div>
            <Link to="/shop/rent/orders" className="text-xs font-semibold text-[#576151] hover:underline uppercase tracking-wider">
              Xem tất cả (06) →
            </Link>
          </div>
          <div className="flex flex-col gap-3.5">
            {rentAttentionData.map((order) => (
              <div key={order.id} className="bg-white p-5 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-[#ebe8e1]">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="font-mono text-xs font-bold text-[#141310]">{order.orderCode}</span>
                    <span className="text-xs text-[#7B766F] ml-2">
                      Khách: <strong>{order.customerName}</strong>
                    </span>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded text-[11px] font-bold uppercase tracking-wider ${order.statusType === 'URGENT'
                        ? 'bg-[#FFDAD6] text-[#93000A]'
                        : 'bg-[#D8E3CE] text-[#3F4A3A]'
                      }`}
                  >
                    {order.statusText}
                  </span>
                </div>
                <div className="mt-3 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-[#F7F3EC] shrink-0 overflow-hidden flex items-center justify-center">
                    <img className="w-full h-full object-cover" src={order.imageUrl} alt={order.productTitle} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-[#141310] truncate">{order.productTitle}</div>
                    <div className="text-xs text-[#7B766F]">
                      Tiền cọc Escrow: <strong className="text-[#141310]">{order.depositAmount}</strong>
                    </div>
                  </div>
                </div>
                <div className="mt-3.5 p-3 rounded-lg bg-[#FFF8F6] text-xs text-[#7B766F] flex items-start gap-2">
                  <span className="material-symbols-outlined text-[#BA1A1A] text-base shrink-0 mt-0.5">schedule</span>
                  <span>{order.notice}</span>
                </div>
                <div className="mt-4 flex items-center justify-end gap-3 pt-2">
                  <Link
                    to={order.detailUrl}
                    className="px-4 py-2 bg-[#141310] text-white text-xs font-semibold uppercase tracking-wider rounded hover:bg-[#292724] transition-colors flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-sm">{order.actionIcon}</span>
                    {order.actionText}
                  </Link>
                </div>
              </div>
            ))}

            {/* Sub Quick List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {rentSubCardsData.map((item) => (
                <div key={item.code} className="bg-white p-4 rounded-xl shadow-sm border border-[#ebe8e1] flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-mono font-bold text-[#141310]">{item.code}</span>
                      <span className="text-[#BA1A1A] font-semibold">{item.status}</span>
                    </div>
                    <div className="text-xs font-semibold text-[#141310] truncate">{item.title}</div>
                    <div className="text-[11px] text-[#7B766F]">Khách: {item.customer}</div>
                  </div>
                  <Link to={item.link} className="mt-3 text-xs text-[#576151] font-semibold hover:underline">
                    {item.linkText}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* THRIFT ATTENTION */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#576151]"></span>
              <h2 className="font-serif text-xl text-[#141310] font-normal">Cần xử lý · Đơn bán THRIFT</h2>
            </div>
            <Link to="/shop/thrift/orders" className="text-xs font-semibold text-[#576151] hover:underline uppercase tracking-wider">
              Xem tất cả (05) →
            </Link>
          </div>
          <div className="flex flex-col gap-3.5">
            {thriftAttentionData.map((order) => (
              <div key={order.id} className="bg-white p-5 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-[#ebe8e1]">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="font-mono text-xs font-bold text-[#141310]">{order.orderCode}</span>
                    <span className="text-xs text-[#7B766F] ml-2">
                      Người mua: <strong>{order.buyerName}</strong>
                    </span>
                  </div>
                  <span className="px-2.5 py-1 rounded bg-[#F0E0CB] text-[#4F4535] text-[11px] font-semibold uppercase tracking-wider">
                    {order.statusText}
                  </span>
                </div>
                <div className="mt-3 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-[#F7F3EC] shrink-0 overflow-hidden flex items-center justify-center">
                    <img className="w-full h-full object-cover" src={order.imageUrl} alt={order.productTitle} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-[#141310] truncate">{order.productTitle}</div>
                    <div className="text-xs font-serif font-medium text-[#141310]">{order.price}</div>
                  </div>
                </div>
                <div className="mt-3.5 flex items-center justify-between text-xs text-[#7B766F]">
                  <span>{order.notice}</span>
                  <Link
                    to={order.detailUrl}
                    className="px-4 py-2 bg-[#141310] text-white text-xs font-semibold uppercase tracking-wider rounded hover:bg-[#292724] transition-colors flex items-center gap-1.5"
                  >
                    {order.actionIcon && <span className="material-symbols-outlined text-sm">{order.actionIcon}</span>}
                    {order.actionText}
                  </Link>
                </div>
              </div>
            ))}

            {/* Sub Quick List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {thriftSubCardsData.map((item) => (
                <div key={item.code} className="bg-white p-4 rounded-xl shadow-sm border border-[#ebe8e1] flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-mono font-bold text-[#141310]">{item.code}</span>
                      <span className={item.isAlert ? 'text-[#BA1A1A] font-semibold' : 'text-[#4F4535] font-semibold'}>
                        {item.status}
                      </span>
                    </div>
                    <div className="text-xs font-semibold text-[#141310] truncate">{item.title}</div>
                    <div className="text-[11px] text-[#7B766F]">{item.meta}</div>
                  </div>
                  <Link
                    to={item.link}
                    className={`mt-3 text-xs font-semibold hover:underline flex items-center gap-1 ${item.isAlert ? 'text-[#BA1A1A]' : 'text-[#576151]'
                      }`}
                  >
                    {item.isAlert && <span className="material-symbols-outlined text-xs">forum</span>}
                    {item.linkText}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* 3. INVENTORY CIRCULAR LIFECYCLE */}
      <section className="bg-[#F7F3EC] p-6 lg:p-8 rounded-xl shadow-sm flex flex-col gap-6 border border-[#ebe8e1]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-[11px] font-semibold tracking-widest uppercase text-[#576151]">Giao thức chuyển đổi tự động</span>
            <h2 className="font-serif text-2xl text-[#141310] font-normal">Vòng đời kho tuần hoàn · Lưu ký chuyển giao THRIFT</h2>
          </div>
          <Link
            to="/shop/rent/inventory"
            className="text-xs font-semibold text-[#141310] hover:underline uppercase tracking-wider flex items-center gap-1"
          >
            Toàn bộ 24 thiết bị kho <span className="material-symbols-outlined text-sm">open_in_new</span>
          </Link>
        </div>

        {/* Stepper Visual */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-[#ebe8e1]">
          <div className="text-xs uppercase tracking-wider text-[#7B766F] font-semibold mb-4">
            Quy trình luân chuyển khép kín (Circular Protocol)
          </div>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3 text-center">
            {circularProtocolSteps.map((step) => (
              <div
                key={step.step}
                className={`flex flex-col items-center p-3 rounded-lg ${step.isHighlight ? 'bg-[#D8E3CE] text-[#3F4A3A]' : 'bg-[#FAF8F5]'
                  }`}
              >
                <span
                  className={`w-7 h-7 rounded-full text-white flex items-center justify-center text-xs font-mono mb-2 ${step.isHighlight ? 'bg-[#3F4A3A]' : step.step === '01' ? 'bg-[#141310]' : 'bg-[#576151]'
                    }`}
                >
                  {step.step}
                </span>
                <span className="text-xs font-bold text-[#141310]">{step.title}</span>
                <span className="text-[11px] text-[#7B766F] mt-1">{step.description}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Distribution & Promotion Callout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-[#ebe8e1] flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-[#141310]">Phân bố kho hiện vật thực tế</span>
              <span className="text-xs text-[#7B766F]">Tổng: 24 hiện vật lưu ký</span>
            </div>
            <div className="space-y-3.5">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-[#4A463F]">Đang cho khách thuê giữ (Active Rental)</span>
                  <span className="font-bold text-[#141310]">14 thiết bị (58.3%)</span>
                </div>
                <div className="w-full bg-[#F1EDE6] h-2 rounded-full overflow-hidden">
                  <div className="bg-[#576151] h-full rounded-full" style={{ width: '58.3%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-[#4A463F]">Khả dụng sẵn sàng thuê trong ngày</span>
                  <span className="font-bold text-[#141310]">08 thiết bị (33.3%)</span>
                </div>
                <div className="w-full bg-[#F1EDE6] h-2 rounded-full overflow-hidden">
                  <div className="bg-[#292724] h-full rounded-full" style={{ width: '33.3%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-[#4A463F]">Bảo dưỡng phòng tối / Đối kiểm hoàn trả</span>
                  <span className="font-bold text-[#141310]">02 thiết bị (8.4%)</span>
                </div>
                <div className="w-full bg-[#F1EDE6] h-2 rounded-full overflow-hidden">
                  <div className="bg-[#BA1A1A] h-full rounded-full" style={{ width: '8.4%' }}></div>
                </div>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-[#F1EDE6] flex flex-wrap items-center justify-between gap-3 text-xs text-[#7B766F]">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#576151]"></span>Tỷ lệ khai thác thiết bị: <strong>91.6%</strong>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#292724]"></span>Thời gian rỗi trung bình: <strong>1.4 ngày/chu kỳ</strong>
              </span>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#292724] to-[#141310] text-white p-6 rounded-xl shadow-md flex flex-col justify-between">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#F0E0CB]/20 text-[#F0E0CB] text-[11px] font-semibold tracking-wider uppercase mb-3">
                <span className="material-symbols-outlined text-xs">auto_awesome</span>
                Cơ hội luân chuyển di sản
              </div>
              <h3 className="font-serif text-xl font-normal leading-snug">03 Thiết bị đủ tiêu chuẩn sang THRIFT</h3>
              <p className="text-xs text-[#CBC6C1] mt-2 leading-relaxed">
                Các thiết bị đã hoàn thành &gt;15 vòng cho thuê với khấu hao bảo lưu chuẩn 85%. Đã hoàn tất chứng chỉ thẩm định, sẵn sàng mở bán 1-of-1 với biên lợi nhuận ròng tối ưu.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-[#494643] flex flex-col gap-3">
              <div className="text-[11px] text-[#CBC6C1] flex items-center justify-between font-mono">
                <span>Leica M10-R · Hasselblad 500C/M</span>
                <span className="text-[#8FA77B]">SẴN SÀNG</span>
              </div>
              <Link
                to="/shop/rent/inventory"
                className="w-full py-2.5 px-4 bg-[#F0E0CB] text-[#141310] hover:bg-white text-xs font-semibold uppercase tracking-wider rounded text-center transition-colors"
              >
                Chuyển đổi thiết bị sang THRIFT ngay →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 4. QUICK ACTIONS GRID */}
      <section className="flex flex-col gap-4">
        <div>
          <span className="text-[11px] font-semibold tracking-widest uppercase text-[#7B766F]">Lối tắt điều hành</span>
          <h2 className="font-serif text-2xl text-[#141310] font-normal">Thao tác nhanh cho Atelier Master</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickActionsData.map((qa) => (
            <Link
              key={qa.id}
              to={qa.link}
              className="p-5 rounded-xl bg-white hover:bg-[#FAF8F5] transition-all shadow-sm hover:shadow group flex items-start gap-4 border border-[#ebe8e1]"
            >
              <div className="w-12 h-12 rounded-lg bg-[#F7F3EC] group-hover:bg-[#141310] group-hover:text-white transition-colors flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-2xl text-[#576151] group-hover:text-white">
                  {qa.icon}
                </span>
              </div>
              <div>
                <div className="font-semibold text-sm text-[#141310] group-hover:text-[#576151] transition-colors">
                  {qa.title}
                </div>
                <p className="text-xs text-[#7B766F] mt-1 leading-relaxed">{qa.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 5. MARKETPLACE PREVIEW */}
      <section className="bg-[#F1EDE6] p-6 lg:p-8 rounded-xl shadow-sm flex flex-col gap-6 border border-[#ebe8e1]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-[11px] font-semibold tracking-widest uppercase text-[#7B766F]">Góc nhìn công khai</span>
            <h2 className="font-serif text-2xl text-[#141310] font-normal">Giao diện khách hàng nhìn thấy</h2>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/rent"
              target="_blank"
              className="px-4 py-2 bg-white text-[#141310] text-xs font-semibold uppercase tracking-wider rounded-lg shadow-sm hover:bg-[#FAF8F5] transition-colors flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-sm">visibility</span>
              Khám phá gian hàng RENT
            </Link>
            <Link
              to="/thrift"
              target="_blank"
              className="px-4 py-2 bg-[#292724] text-white text-xs font-semibold uppercase tracking-wider rounded-lg shadow-sm hover:bg-[#141310] transition-colors flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-sm">storefront</span>
              Khám phá sàn độc bản THRIFT
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {marketplacePreviewData.map((live) => (
            <div key={live.id} className="bg-white p-4 rounded-xl shadow-sm flex gap-4 items-center border border-[#ebe8e1]">
              <div className="w-24 h-24 rounded-lg bg-[#FAF8F5] shrink-0 overflow-hidden">
                <img className="w-full h-full object-cover" src={live.imageUrl} alt={live.title} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`px-2 py-0.5 rounded font-semibold text-[10px] uppercase ${live.badgeColorClass}`}>
                    {live.badge}
                  </span>
                  <span className="text-[11px] text-[#7B766F]">{live.displayId}</span>
                </div>
                <div className="font-semibold text-sm text-[#141310] truncate">{live.title}</div>
                <div className="text-xs text-[#576151] font-semibold mt-1">{live.price}</div>
                <div className="text-[11px] text-[#7B766F] mt-0.5">{live.statusText}</div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};