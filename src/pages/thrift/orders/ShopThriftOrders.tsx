import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type {
  ThriftOrder,
  ThriftOrderStatus,
  ShippingInfo,
} from '../../data/shop/thriftOrdersData';
import {
  SHOP_THRIFT_ORDERS_STORAGE_KEY,
  INITIAL_MOCK_THRIFT_ORDERS,
} from '../../data/shop/thriftOrdersData';

export const ShopThriftOrders: React.FC = () => {

  // State danh sách đơn hàng THRIFT (đọc và lưu bền vững vào localStorage)
  const [orders, setOrders] = useState<ThriftOrder[]>(() => {
    try {
      const saved = localStorage.getItem(SHOP_THRIFT_ORDERS_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Lỗi khi đọc SHOP_THRIFT_ORDERS_DATA:', e);
    }
    return INITIAL_MOCK_THRIFT_ORDERS;
  });

  // Tự động đồng bộ vào localStorage mỗi khi orders thay đổi
  useEffect(() => {
    try {
      localStorage.setItem(SHOP_THRIFT_ORDERS_STORAGE_KEY, JSON.stringify(orders));
    } catch (e) {
      console.error('Lỗi khi lưu SHOP_THRIFT_ORDERS_DATA:', e);
    }
  }, [orders]);

  // Bộ lọc trạng thái & tìm kiếm
  const [activeFilter, setActiveFilter] = useState<'ALL' | ThriftOrderStatus>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal Xác nhận vận chuyển
  const [selectedOrderForShipment, setSelectedOrderForShipment] = useState<ThriftOrder | null>(null);
  const [carrierInput, setCarrierInput] = useState('Viettel Post Chuyên Dụng Nanuk');
  const [trackingCodeInput, setTrackingCodeInput] = useState('');
  const [notesInput, setNotesInput] = useState('');
  const [isSubmittingShipment, setIsSubmittingShipment] = useState(false);

  // Mở modal xác nhận vận chuyển
  const handleOpenShipmentModal = (order: ThriftOrder) => {
    setSelectedOrderForShipment(order);
    setCarrierInput(order.shippingInfo?.carrier || 'Viettel Post Chuyên Dụng Nanuk');
    setTrackingCodeInput(
      order.shippingInfo?.trackingCode || `VTP-${Math.floor(10000000 + Math.random() * 90000000)}-VN`
    );
    setNotesInput(order.shippingInfo?.notes || 'Niêm phong chì bảo mật ReUse Hub. Yêu cầu đồng kiểm có video.');
  };

  // Đóng modal
  const handleCloseShipmentModal = () => {
    setSelectedOrderForShipment(null);
    setIsSubmittingShipment(false);
  };

  // Xử lý gửi hàng (AC 2, AC 3, AC 4)
  const handleConfirmShipment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderForShipment) return;

    if (!trackingCodeInput.trim()) {
      alert('Vui lòng nhập Mã Vận Đơn (Tracking Number)!');
      return;
    }

    setIsSubmittingShipment(true);

    setTimeout(() => {
      const now = new Date().toLocaleString('vi-VN');
      const newShippingInfo: ShippingInfo = {
        carrier: carrierInput,
        trackingCode: trackingCodeInput.trim(),
        dispatchedAt: now,
        notes: notesInput.trim(),
      };

      // Cập nhật ở CẤP ORDER (Không chia rẽ listing)
      setOrders((prevOrders) =>
        prevOrders.map((ord) => {
          if (ord.id === selectedOrderForShipment.id) {
            return {
              ...ord,
              status: 'SHIPPED',
              shippingInfo: newShippingInfo,
            };
          }
          return ord;
        })
      );

      setIsSubmittingShipment(false);
      setSelectedOrderForShipment(null);
      showToast(
        `XÁC NHẬN GỬI HÀNG THÀNH CÔNG! Đơn ${selectedOrderForShipment.id} đã chuyển sang trạng thái SHIPPED. Mã vận đơn: ${trackingCodeInput.trim()}`
      );
    }, 600);
  };

  // Đánh dấu đã giao thành công (DELIVERED)
  const handleMarkDelivered = (orderId: string) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: 'DELIVERED' } : o))
    );
    showToast(`Đơn ${orderId} đã được đánh dấu ĐÃ GIAO THÀNH CÔNG (DELIVERED).`);
  };

  // Hoàn tất đơn hàng (COMPLETED)
  const handleMarkCompleted = (orderId: string) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: 'COMPLETED' } : o))
    );
    showToast(`Đơn ${orderId} đã được tất toán và chuyển sang HOÀN TẤT (COMPLETED).`);
  };

  // Copy mã vận đơn vào clipboard
  const handleCopyTracking = (code: string) => {
    navigator.clipboard.writeText(code);
    showToast(`Đã sao chép mã vận đơn: ${code}`);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // Reset dữ liệu về ban đầu để kiểm thử
  const handleResetData = () => {
    if (window.confirm('Bạn có muốn đặt lại toàn bộ danh sách đơn hàng THRIFT về mặc định ban đầu để thử nghiệm lại?')) {
      localStorage.removeItem(SHOP_THRIFT_ORDERS_STORAGE_KEY);
      setOrders(INITIAL_MOCK_THRIFT_ORDERS);
      showToast('Đã đặt lại dữ liệu đơn hàng THRIFT về mặc định ban đầu.');
    }
  };

  // Lọc dữ liệu
  const filteredOrders = orders.filter((order) => {
    if (activeFilter !== 'ALL' && order.status !== activeFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchId = order.id.toLowerCase().includes(q);
      const matchBuyer = order.buyer.name.toLowerCase().includes(q);
      const matchPhone = order.buyer.phone.toLowerCase().includes(q);
      const matchTracking = order.shippingInfo?.trackingCode.toLowerCase().includes(q);
      const matchItem = order.listings.some(
        (it) =>
          it.title.toLowerCase().includes(q) ||
          it.serialNumber.toLowerCase().includes(q)
      );
      return matchId || matchBuyer || matchPhone || matchTracking || matchItem;
    }
    return true;
  });

  // Tính toán số lượng theo trạng thái
  const countAll = orders.length;
  const countPaid = orders.filter((o) => o.status === 'PAID').length;
  const countShipped = orders.filter((o) => o.status === 'SHIPPED').length;
  const countDelivered = orders.filter((o) => o.status === 'DELIVERED').length;
  const countCompleted = orders.filter((o) => o.status === 'COMPLETED').length;

  const totalPendingEscrow = orders
    .filter((o) => o.status === 'PAID' || o.status === 'SHIPPED')
    .reduce((sum, o) => sum + o.pricing.totalAmount, 0);

  return (
    <div className="w-full flex flex-col font-sans text-on-surface bg-surface min-h-screen antialiased">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-[#141310] text-[#fdf9f2] px-5 py-3.5 rounded-lg shadow-2xl flex items-center gap-3 border border-secondary/40 animate-fade-in max-w-md">
          <span className="material-symbols-outlined text-secondary text-[22px] shrink-0">
            check_circle
          </span>
          <span className="text-xs font-medium leading-snug flex-1">{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="text-on-surface-variant hover:text-white"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      )}


      {/* Main Container */}
      <main className="max-w-[1536px] mx-auto px-4 lg:px-8 py-8 w-full flex flex-col gap-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-on-surface-variant">
          <Link to="/shop/dashboard" className="hover:text-primary transition-colors">
            Bảng điều khiển xưởng
          </Link>
          <span className="text-outline-variant">/</span>
          <span>Quản lý Bán lại THRIFT</span>
          <span className="text-outline-variant">/</span>
          <span className="text-primary font-semibold">Sổ Lệnh Đơn Bán THRIFT</span>
        </div>

        {/* Header & Controls */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-2 border-b border-[#dddad3]">
          <div className="max-w-3xl">
            <h1 className="font-serif text-3xl lg:text-4xl text-on-surface tracking-tight">
              Sổ Lệnh Đơn Bán THRIFT
              <span className="font-sans text-xs font-normal text-outline ml-3">
                [FE-S4-05] Thrift Orders Ledger
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-on-surface-variant mt-1.5 leading-relaxed">
              Quản lý các đơn bán đứt hiện vật tuần hoàn chứa một hoặc nhiều listing (
              <span className="font-semibold text-on-surface">Multi-Listing Orders</span>). Shop Owner
              xác nhận gửi hàng và nhập thông tin vận chuyển{' '}
              <strong className="text-primary">ở cấp Order duy nhất</strong> để kích hoạt giải ngân Escrow.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={handleResetData}
              className="px-3 py-2 rounded bg-surface border border-outline-variant text-on-surface-variant hover:bg-surface-container transition-colors text-xs font-semibold flex items-center gap-1.5 shadow-xs"
              title="Đặt lại dữ liệu mẫu"
            >
              <span className="material-symbols-outlined text-[16px]">restart_alt</span>
              Reset Data
            </button>
            <Link
              to="/shop/thrift/listings"
              className="px-4 py-2 bg-primary text-on-primary hover:bg-primary-container transition-colors text-xs uppercase tracking-wider font-semibold rounded flex items-center gap-1.5 shadow-sm"
            >
              <span className="material-symbols-outlined text-[16px]">add_box</span>
              Xem Mục Đăng THRIFT
            </Link>
          </div>
        </div>

        {/* Quick Metrics Summary Bar (Bento Tonal Cards) */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          {/* Metric 1 */}
          <div
            onClick={() => setActiveFilter('ALL')}
            className={`p-4 rounded-xl flex flex-col justify-between shadow-xs transition-all cursor-pointer border ${
              activeFilter === 'ALL'
                ? 'bg-primary text-on-primary border-primary'
                : 'bg-surface-container border-outline-variant/30 hover:bg-surface-container-high'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] uppercase tracking-wider font-bold">Tất Cả Đơn</span>
              <span className="material-symbols-outlined text-[18px]">all_inclusive</span>
            </div>
            <div className="font-serif text-3xl font-semibold">{countAll}</div>
            <div className="text-[11px] opacity-80 mt-1">Toàn bộ đơn hàng</div>
          </div>

          {/* Metric 2 */}
          <div
            onClick={() => setActiveFilter('PAID')}
            className={`p-4 rounded-xl flex flex-col justify-between shadow-xs transition-all cursor-pointer border ${
              activeFilter === 'PAID'
                ? 'bg-amber-600 text-white border-amber-600'
                : 'bg-surface-container border-outline-variant/30 hover:bg-surface-container-high'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] uppercase tracking-wider font-bold text-amber-700">
                Chờ Gửi Hàng
              </span>
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
            </div>
            <div className="font-serif text-3xl font-semibold text-amber-900">{countPaid}</div>
            <div className="text-[11px] text-amber-800 mt-1">Cần xác nhận vận đơn</div>
          </div>

          {/* Metric 3 */}
          <div
            onClick={() => setActiveFilter('SHIPPED')}
            className={`p-4 rounded-xl flex flex-col justify-between shadow-xs transition-all cursor-pointer border ${
              activeFilter === 'SHIPPED'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-surface-container border-outline-variant/30 hover:bg-surface-container-high'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] uppercase tracking-wider font-bold text-blue-700">
                Đang Giao Vận
              </span>
              <span className="material-symbols-outlined text-[18px] text-blue-600">local_shipping</span>
            </div>
            <div className="font-serif text-3xl font-semibold text-blue-900">{countShipped}</div>
            <div className="text-[11px] text-blue-800 mt-1">Đã có mã vận đơn</div>
          </div>

          {/* Metric 4 */}
          <div
            onClick={() => setActiveFilter('DELIVERED')}
            className={`p-4 rounded-xl flex flex-col justify-between shadow-xs transition-all cursor-pointer border ${
              activeFilter === 'DELIVERED'
                ? 'bg-secondary text-white border-secondary'
                : 'bg-surface-container border-outline-variant/30 hover:bg-surface-container-high'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] uppercase tracking-wider font-bold text-secondary">
                Đã Giao Đích
              </span>
              <span className="material-symbols-outlined text-[18px] text-secondary">done_all</span>
            </div>
            <div className="font-serif text-3xl font-semibold text-secondary">{countDelivered}</div>
            <div className="text-[11px] text-secondary mt-1">Đang chờ đối soát</div>
          </div>

          {/* Metric 5 */}
          <div
            onClick={() => setActiveFilter('COMPLETED')}
            className={`p-4 rounded-xl flex flex-col justify-between shadow-xs transition-all cursor-pointer border ${
              activeFilter === 'COMPLETED'
                ? 'bg-primary text-on-primary border-primary'
                : 'bg-surface-container border-outline-variant/30 hover:bg-surface-container-high'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] uppercase tracking-wider font-bold">Hoàn Tất</span>
              <span className="material-symbols-outlined text-[18px]">verified</span>
            </div>
            <div className="font-serif text-3xl font-semibold">{countCompleted}</div>
            <div className="text-[11px] text-on-surface-variant mt-1">Đã giải ngân ví</div>
          </div>

          {/* Metric 6: Escrow */}
          <div className="bg-surface-container-highest p-4 rounded-xl flex flex-col justify-between shadow-xs border border-outline-variant/40">
            <div className="flex items-center justify-between text-on-surface mb-1">
              <span className="text-[11px] uppercase tracking-wider font-bold text-secondary">
                Escrow Chờ Giải Ngân
              </span>
              <span className="material-symbols-outlined text-[18px] text-secondary">lock</span>
            </div>
            <div className="font-serif text-xl font-bold text-primary font-mono truncate">
              {totalPendingEscrow.toLocaleString('vi-VN')} ₫
            </div>
            <div className="text-[10px] text-secondary font-semibold mt-1">Bảo đảm tự động 100%</div>
          </div>
        </div>

        {/* Status Filters Bar & Search */}
        <div className="bg-surface-container-low p-2.5 rounded-xl border border-outline-variant/40 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Segmented Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 text-xs font-semibold">
            <button
              onClick={() => setActiveFilter('ALL')}
              className={`px-3 py-1.5 rounded transition-colors whitespace-nowrap ${
                activeFilter === 'ALL'
                  ? 'bg-primary text-on-primary shadow-xs'
                  : 'bg-surface text-on-surface-variant hover:bg-surface-container'
              }`}
            >
              Tất Cả ({countAll})
            </button>
            <button
              onClick={() => setActiveFilter('PAID')}
              className={`px-3 py-1.5 rounded transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                activeFilter === 'PAID'
                  ? 'bg-primary text-on-primary shadow-xs'
                  : 'bg-surface text-on-surface-variant hover:bg-surface-container'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              Chờ gửi hàng (PAID) ({countPaid})
            </button>
            <button
              onClick={() => setActiveFilter('SHIPPED')}
              className={`px-3 py-1.5 rounded transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                activeFilter === 'SHIPPED'
                  ? 'bg-primary text-on-primary shadow-xs'
                  : 'bg-surface text-on-surface-variant hover:bg-surface-container'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-blue-600"></span>
              Đang giao (SHIPPED) ({countShipped})
            </button>
            <button
              onClick={() => setActiveFilter('DELIVERED')}
              className={`px-3 py-1.5 rounded transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                activeFilter === 'DELIVERED'
                  ? 'bg-primary text-on-primary shadow-xs'
                  : 'bg-surface text-on-surface-variant hover:bg-surface-container'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-secondary"></span>
              Đã giao (DELIVERED) ({countDelivered})
            </button>
            <button
              onClick={() => setActiveFilter('COMPLETED')}
              className={`px-3 py-1.5 rounded transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                activeFilter === 'COMPLETED'
                  ? 'bg-primary text-on-primary shadow-xs'
                  : 'bg-surface text-on-surface-variant hover:bg-surface-container'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-green-600"></span>
              Hoàn tất (COMPLETED) ({countCompleted})
            </button>
          </div>

          {/* Search Input */}
          <div className="relative min-w-[280px]">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">
              search
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo Mã đơn, Khách, SĐT, Vận đơn..."
              className="w-full pl-9 pr-3 py-1.5 bg-surface text-xs text-on-surface rounded border border-outline-variant/60 focus:outline-none focus:ring-1 focus:ring-primary shadow-xs"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-[14px]">close</span>
              </button>
            )}
          </div>
        </div>

        {/* Multi-Item Orders Stream */}
        <div className="flex flex-col gap-5">
          {filteredOrders.map((order) => {
            const isPaid = order.status === 'PAID';
            const isShipped = order.status === 'SHIPPED';
            const isDelivered = order.status === 'DELIVERED';
            const isCompleted = order.status === 'COMPLETED';

            return (
              <article
                key={order.id}
                className="w-full bg-surface-container-low rounded-xl p-5 lg:p-6 shadow-sm border border-outline-variant/40 hover:border-outline-variant transition-all flex flex-col gap-4"
              >
                {/* 1. Order Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-outline-variant/30">
                  <div className="flex flex-wrap items-center gap-3">
                    <Link
                      to={`/shop/thrift/orders/${encodeURIComponent(order.id.replace('#', ''))}`}
                      className="font-title-md text-base font-bold text-primary hover:text-on-surface font-mono tracking-tight hover:underline flex items-center gap-1 group"
                      title="Mở sổ lệnh chi tiết"
                    >
                      <span>{order.id}</span>
                      <span className="material-symbols-outlined text-[15px] text-outline group-hover:text-primary transition-colors">
                        open_in_new
                      </span>
                    </Link>

                    {/* Status Badge */}
                    {isPaid && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-100 text-amber-900 rounded font-label-sm text-[11px] uppercase tracking-wider font-bold">
                        <span className="w-2 h-2 rounded-full bg-amber-600 animate-ping"></span>
                        PAID · ĐÃ THANH TOÁN · CHỜ GỬI HÀNG
                      </span>
                    )}
                    {isShipped && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-100 text-blue-900 rounded font-label-sm text-[11px] uppercase tracking-wider font-bold">
                        <span className="material-symbols-outlined text-[14px]">local_shipping</span>
                        SHIPPED · ĐANG GIAO VẬN
                      </span>
                    )}
                    {isDelivered && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-secondary-container text-on-secondary-fixed rounded font-label-sm text-[11px] uppercase tracking-wider font-bold">
                        <span className="material-symbols-outlined text-[14px]">done_all</span>
                        DELIVERED · ĐÃ GIAO ĐÍCH
                      </span>
                    )}
                    {isCompleted && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-surface-container text-outline rounded font-label-sm text-[11px] uppercase tracking-wider font-bold">
                        <span className="material-symbols-outlined text-[14px] text-secondary">
                          check_circle
                        </span>
                        COMPLETED · HOÀN TẤT
                      </span>
                    )}

                    <span className="text-on-surface-variant text-xs">
                      Tạo lúc: {order.createdAt}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs uppercase tracking-wider text-on-surface-variant font-medium">
                      Quy trình: {isPaid ? '1/3 Chuẩn bị kiện hàng' : isShipped ? '2/3 Đang vận chuyển bọc chì' : '3/3 Hoàn tất đối soát'}
                    </span>
                    <span className="text-outline-variant hidden sm:inline">·</span>
                    <Link
                      to={`/shop/thrift/orders/${encodeURIComponent(order.id.replace('#', ''))}`}
                      className="inline-flex items-center gap-1 text-xs text-primary font-semibold hover:underline"
                    >
                      <span>Sổ lệnh chi tiết</span>
                      <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                    </Link>
                  </div>
                </div>

                {/* 2. Main Order Grid (3 Columns) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                  {/* Column 1: Buyer Dossier (3 Cols) */}
                  <div className="lg:col-span-3 bg-surface-container p-4 rounded-lg flex flex-col justify-between border border-outline-variant/30">
                    <div>
                      <div className="text-[10px] uppercase font-bold tracking-wider text-outline mb-2">
                        Người Mua / Điểm Nhận Hàng
                      </div>
                      <div className="flex items-center gap-3 mb-2.5">
                        <div className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center font-serif text-sm font-bold shrink-0">
                          {order.buyer.name
                            .split(' ')
                            .map((w) => w[0])
                            .slice(-2)
                            .join('')}
                        </div>
                        <div>
                          <h4 className="font-semibold text-xs text-on-surface leading-tight">
                            {order.buyer.name}
                          </h4>
                          <div className="text-[11px] text-on-surface-variant font-mono">
                            {order.buyer.phone}
                          </div>
                        </div>
                      </div>

                      {order.buyer.kycTier && (
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-secondary-fixed/50 text-on-secondary-fixed-variant rounded text-[10px] uppercase tracking-wider mb-2 font-semibold">
                          <span className="material-symbols-outlined text-[13px] text-secondary">
                            verified
                          </span>
                          {order.buyer.kycTier}
                        </div>
                      )}

                      <p className="text-xs text-on-surface-variant leading-relaxed mt-1">
                        <span className="font-medium text-on-surface block">Địa chỉ giao hàng:</span>
                        {order.buyer.shippingAddress}
                      </p>
                    </div>

                    <div className="pt-2.5 mt-3 border-t border-outline-variant/30 flex items-center justify-between text-[11px] text-on-surface-variant">
                      <span>Đảm bảo Escrow:</span>
                      <span className="font-bold text-secondary">Bảo chứng 100%</span>
                    </div>
                  </div>

                  {/* Column 2: Multi-Item Listing Stack (5 Cols) - AC 1 & Strict AC 2 */}
                  <div className="lg:col-span-5 bg-surface p-4 rounded-lg flex flex-col justify-between border border-outline-variant/30">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[11px] uppercase tracking-wider text-outline font-bold">
                          Danh Mục Sản Phẩm Đơn Hàng ({order.listings.length} Hiện Vật)
                        </span>
                        <span className="text-[10px] text-secondary bg-secondary-fixed/40 px-2 py-0.5 rounded font-semibold">
                          Gói Bọc Chì Nanuk
                        </span>
                      </div>

                      {/* Stack of Listings */}
                      <div className="space-y-2.5">
                        {order.listings.map((item, idx) => (
                          <div
                            key={item.id || idx}
                            className="flex items-start gap-3 p-2 bg-surface-container-low rounded border border-outline-variant/20 hover:border-outline-variant transition-colors"
                          >
                            <img
                              src={item.imageUrl}
                              alt={item.title}
                              className="w-14 h-14 object-cover rounded border border-outline-variant/40 shrink-0 bg-surface-container"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <h5 className="font-semibold text-xs text-on-surface truncate">
                                  {item.title}
                                </h5>
                                <span className="text-xs font-mono font-bold text-primary shrink-0">
                                  {item.price.toLocaleString('vi-VN')} ₫
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-[10px] text-outline mt-0.5 font-mono">
                                <span className="bg-surface px-1 py-0.2 rounded border border-outline-variant/40 text-on-surface-variant">
                                  SN: {item.serialNumber}
                                </span>
                                <span>•</span>
                                <span className="text-secondary font-medium">{item.grade}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-outline-variant/30 flex items-center justify-between text-xs text-on-surface-variant">
                      <span>Hình thức đóng gói:</span>
                      <span className="font-semibold text-on-surface">Thùng chống sốc Nanuk Crate</span>
                    </div>
                  </div>

                  {/* Column 3: Financial Ledger & Order-Level Actions (4 Cols) - Strict AC 2 & AC 3 */}
                  <div className="lg:col-span-4 bg-surface-container p-4 rounded-lg flex flex-col justify-between border border-outline-variant/30">
                    <div>
                      <div className="text-[10px] uppercase font-bold tracking-wider text-outline mb-2">
                        Bảng Kê Tài Chính &amp; Vận Chuyển
                      </div>

                      <div className="space-y-1.5 text-xs pb-3">
                        <div className="flex justify-between text-on-surface-variant">
                          <span>Tổng tiền sản phẩm ({order.listings.length} món):</span>
                          <span className="font-mono text-on-surface">
                            {order.pricing.subtotal.toLocaleString('vi-VN')} ₫
                          </span>
                        </div>
                        <div className="flex justify-between text-on-surface-variant">
                          <span>Phí vận chuyển (Tính 1 lần/Order):</span>
                          <span className="font-mono text-on-surface">
                            {order.pricing.shippingFee.toLocaleString('vi-VN')} ₫
                          </span>
                        </div>
                        <div className="pt-2 mt-1 bg-surface px-2.5 py-1.5 rounded border border-outline-variant/40 flex justify-between items-baseline">
                          <span className="text-xs uppercase tracking-wider font-bold text-on-surface">
                            Tổng Tiền Đơn Hàng:
                          </span>
                          <span className="font-serif text-base font-bold text-primary font-mono">
                            {order.pricing.totalAmount.toLocaleString('vi-VN')} ₫
                          </span>
                        </div>
                      </div>

                      {/* Display Shipping Info if available (AC 3) */}
                      {order.shippingInfo ? (
                        <div className="p-2.5 bg-surface rounded border border-outline-variant/40 space-y-1 mt-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-on-surface-variant">Đơn vị vận chuyển:</span>
                            <span className="font-bold text-on-surface">
                              {order.shippingInfo.carrier}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-on-surface-variant">Mã vận đơn (Tracking):</span>
                            <div className="flex items-center gap-1 font-mono font-bold text-primary">
                              <span>{order.shippingInfo.trackingCode}</span>
                              <button
                                type="button"
                                onClick={() => handleCopyTracking(order.shippingInfo!.trackingCode)}
                                className="p-0.5 hover:text-secondary"
                                title="Sao chép mã"
                              >
                                <span className="material-symbols-outlined text-[14px]">content_copy</span>
                              </button>
                            </div>
                          </div>
                          {order.shippingInfo.dispatchedAt && (
                            <div className="text-[10px] text-on-surface-variant">
                              Thời gian gửi: {order.shippingInfo.dispatchedAt}
                            </div>
                          )}
                          {order.shippingInfo.notes && (
                            <div className="text-[10px] text-on-surface-variant italic border-t border-outline-variant/20 pt-1 mt-1">
                              Ghi chú: {order.shippingInfo.notes}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="p-2 bg-amber-50 rounded border border-amber-200 text-amber-900 text-[11px] flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[16px] text-amber-600">
                            info
                          </span>
                          <span>Đơn hàng đã thanh toán. Đang chờ xưởng xác nhận và gửi vận đơn.</span>
                        </div>
                      )}
                    </div>

                    {/* Order-Level Action Buttons (AC 2) */}
                    <div className="pt-4 flex flex-col gap-2">
                      {isPaid && (
                        <button
                          type="button"
                          onClick={() => handleOpenShipmentModal(order)}
                          className="w-full py-2.5 px-4 bg-primary text-on-primary hover:bg-primary-container transition-colors text-xs font-semibold uppercase tracking-wider rounded flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[18px]">local_shipping</span>
                          <span>Xác Nhận &amp; Gửi Hàng (Confirm Shipment)</span>
                        </button>
                      )}

                      {isShipped && (
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleOpenShipmentModal(order)}
                              className="flex-1 py-1.5 px-3 bg-surface hover:bg-surface-container text-on-surface text-xs font-semibold rounded border border-outline-variant/60 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-[15px]">edit</span>
                              Sửa Vận Đơn
                            </button>
                            <button
                              type="button"
                              onClick={() => handleCopyTracking(order.shippingInfo?.trackingCode || '')}
                              className="flex-1 py-1.5 px-3 bg-surface hover:bg-surface-container text-on-surface text-xs font-semibold rounded border border-outline-variant/60 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-[15px]">content_copy</span>
                              Copy Mã
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleMarkDelivered(order.id)}
                            className="w-full py-2 px-3 bg-secondary text-white hover:bg-secondary/90 text-xs font-semibold uppercase tracking-wider rounded flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[16px]">check_circle</span>
                            Đánh Dấu Đã Giao Thành Công
                          </button>
                        </div>
                      )}

                      {isDelivered && (
                        <button
                          type="button"
                          onClick={() => handleMarkCompleted(order.id)}
                          className="w-full py-2.5 px-4 bg-[#141310] text-white hover:bg-primary text-xs font-semibold uppercase tracking-wider rounded flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[18px]">verified</span>
                          Hoàn Tất Đơn &amp; Quyết Toán Escrow
                        </button>
                      )}

                      {isCompleted && (
                        <div className="p-2 bg-surface rounded border border-outline-variant/40 text-center text-xs text-secondary font-semibold flex items-center justify-center gap-1">
                          <span className="material-symbols-outlined text-[16px]">task_alt</span>
                          Đã thanh toán Escrow vào ví Shop
                        </div>
                      )}

                      <Link
                        to={`/shop/thrift/orders/${encodeURIComponent(order.id.replace('#', ''))}`}
                        className="w-full py-2 px-3 bg-surface hover:bg-surface-container text-on-surface text-xs font-semibold rounded border border-outline-variant/60 transition-colors flex items-center justify-center gap-1.5"
                      >
                        <span className="material-symbols-outlined text-[16px] text-primary">receipt_long</span>
                        <span>Xem Sổ Lệnh Chi Tiết</span>
                      </Link>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}

          {filteredOrders.length === 0 && (
            <div className="p-12 text-center bg-surface-container-low rounded-xl border border-outline-variant/40 text-on-surface-variant flex flex-col items-center justify-center gap-2">
              <span className="material-symbols-outlined text-4xl text-outline">receipt_long</span>
              <p className="text-sm font-semibold">Không tìm thấy đơn bán THRIFT nào phù hợp với bộ lọc.</p>
              <button
                onClick={() => {
                  setActiveFilter('ALL');
                  setSearchQuery('');
                }}
                className="text-xs text-primary font-semibold underline mt-1"
              >
                Xóa bộ lọc
              </button>
            </div>
          )}
        </div>

        {/* Circular Warranty & Provenance Note Banner */}
        <section className="bg-surface-container p-4 lg:p-5 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-xs border border-outline-variant/40">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-full bg-secondary-fixed text-on-secondary-fixed flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[22px]">gavel</span>
            </div>
            <div>
              <h4 className="font-semibold text-xs sm:text-sm text-on-surface mb-0.5">
                Quy Định Vận Chuyển Độc Bản THRIFT (Secure Crate Protocol)
              </h4>
              <p className="text-xs text-on-surface-variant">
                Toàn bộ thiết bị bán đứt THRIFT đều được vận chuyển nguyên kiện bọc chì Nanuk Crate. Mã vận đơn lưu ký cấp Order bảo chứng thanh toán Escrow ngay khi khách hàng xác nhận nhận hàng.
              </p>
            </div>
          </div>
          <Link
            to="/shop/thrift/listings"
            className="text-xs font-semibold text-primary uppercase tracking-wider hover:underline flex items-center gap-1 shrink-0"
          >
            Quản lý kho THRIFT
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </Link>
        </section>
      </main>

      {/* SHIPMENT MODAL (Modal Xác Nhận Vận Chuyển - AC 2 & AC 3) */}
      {selectedOrderForShipment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-surface rounded-xl shadow-2xl max-w-xl w-full border border-outline-variant overflow-hidden">
            {/* Modal Header */}
            <div className="bg-surface-container-high px-6 py-4 flex items-center justify-between border-b border-outline-variant">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[22px]">
                  local_shipping
                </span>
                <span className="font-serif text-base font-bold text-on-surface">
                  Xác Nhận &amp; Nhập Thông Tin Vận Chuyển Đơn Hàng
                </span>
              </div>
              <button
                type="button"
                onClick={handleCloseShipmentModal}
                className="p-1 rounded hover:bg-surface-container text-on-surface-variant cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleConfirmShipment} className="p-6 flex flex-col gap-4 text-xs">
              {/* Order Context Summary */}
              <div className="p-3 bg-surface-container-low rounded-lg border border-outline-variant/40 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-primary font-mono text-xs">
                    {selectedOrderForShipment.id}
                  </span>
                  <span className="text-[11px] text-secondary font-semibold">
                    {selectedOrderForShipment.listings.length} Sản phẩm
                  </span>
                </div>
                <div className="text-[11px] text-on-surface">
                  <strong>Người nhận:</strong> {selectedOrderForShipment.buyer.name} (
                  {selectedOrderForShipment.buyer.phone})
                </div>
                <div className="text-[11px] text-on-surface-variant leading-snug">
                  <strong>Địa chỉ:</strong> {selectedOrderForShipment.buyer.shippingAddress}
                </div>
                <div className="text-[11px] text-on-surface font-semibold pt-1 border-t border-outline-variant/20 flex justify-between">
                  <span>Tổng tiền thanh toán:</span>
                  <span className="font-mono text-primary font-bold">
                    {selectedOrderForShipment.pricing.totalAmount.toLocaleString('vi-VN')} ₫
                  </span>
                </div>
              </div>

              {/* Input 1: Carrier */}
              <div className="flex flex-col gap-1">
                <label className="font-semibold text-on-surface">
                  1. Đơn vị vận chuyển (Carrier):
                </label>
                <select
                  value={carrierInput}
                  onChange={(e) => setCarrierInput(e.target.value)}
                  className="w-full px-3 py-2 bg-surface text-xs text-on-surface rounded border border-outline-variant focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                >
                  <option value="Viettel Post Chuyên Dụng Nanuk">
                    Viettel Post Chuyên Dụng Nanuk (Bọc Chì &amp; Khung Gỗ)
                  </option>
                  <option value="Giao Hàng Tiết Kiệm (GHTK)">
                    Giao Hàng Tiết Kiệm (GHTK) - Hàng Giá Trị Cao
                  </option>
                  <option value="EMS Bưu Điện Việt Nam">EMS Bưu Điện Việt Nam (Bảo Hiểm Toàn Phần)</option>
                  <option value="Hỏa Tốc Nội Thành Nanuk Courier">
                    Hỏa Tốc Nội Thành Nanuk Courier (Giao trong 2h)
                  </option>
                  <option value="Chuyển Phát Nhanh DHL Express">
                    Chuyển Phát Nhanh DHL Express (Liên Tỉnh Hỏa Tốc)
                  </option>
                </select>
              </div>

              {/* Input 2: Tracking Code */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-on-surface">
                    2. Mã vận đơn (Tracking Number) <span className="text-error">*</span>:
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setTrackingCodeInput(`VTP-${Math.floor(10000000 + Math.random() * 90000000)}-VN`)
                    }
                    className="text-[10px] text-secondary font-semibold hover:underline"
                  >
                    Tạo mã ngẫu nhiên
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={trackingCodeInput}
                  onChange={(e) => setTrackingCodeInput(e.target.value)}
                  placeholder="Ví dụ: VTP-88492019-VN"
                  className="w-full px-3 py-2 bg-surface text-xs text-on-surface font-mono font-bold rounded border border-outline-variant focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              {/* Input 3: Notes */}
              <div className="flex flex-col gap-1">
                <label className="font-semibold text-on-surface">
                  3. Ghi chú niêm phong &amp; Bàn giao (Tùy chọn):
                </label>
                <textarea
                  rows={2}
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  placeholder="Ghi chú tem niêm phong chì, số hiệu seal kiểm định..."
                  className="w-full p-2.5 bg-surface text-xs text-on-surface rounded border border-outline-variant focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              {/* Notice */}
              <div className="p-2.5 bg-secondary-fixed/20 rounded text-[11px] text-on-surface-variant flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] text-secondary shrink-0">
                  security
                </span>
                <span>
                  Thông tin vận đơn được lưu 1 lần cho toàn bộ đơn hàng và đồng bộ sang tài khoản người mua.
                </span>
              </div>

              {/* Actions */}
              <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-outline-variant/40">
                <button
                  type="button"
                  onClick={handleCloseShipmentModal}
                  className="px-4 py-2 rounded text-xs text-on-surface-variant hover:bg-surface-container font-semibold transition-colors cursor-pointer"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingShipment}
                  className="px-5 py-2 rounded text-xs font-semibold uppercase tracking-wider bg-primary text-on-primary hover:bg-primary-container shadow transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingShipment ? (
                    <>
                      <span className="inline-block animate-spin material-symbols-outlined text-[14px]">
                        progress_activity
                      </span>
                      <span>Đang Lưu Vận Đơn...</span>
                    </>
                  ) : (
                    <>
                      <span>Xác Nhận Gửi Hàng &amp; Lưu Vận Đơn</span>
                      <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShopThriftOrders;
