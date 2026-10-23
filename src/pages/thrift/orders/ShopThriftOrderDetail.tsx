import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { ThriftOrder } from '../../data/shop/thriftOrdersData';
import {
  SHOP_THRIFT_ORDERS_STORAGE_KEY,
  INITIAL_MOCK_THRIFT_ORDERS,
} from '../../data/shop/thriftOrdersData';

type OrderSimulationState = 'paid' | 'processing' | 'shipped' | 'delivered' | 'completed' | 'disputed';

export const ShopThriftOrderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  // Clean decoded ID (handle "#RH-THF-2024-9108" or "RH-THF-2024-9108")
  const targetId = id ? (id.startsWith('#') ? id : `#${id}`) : '#RH-THF-2024-9108';

  // Load order data from localStorage or fallback
  const [order, setOrder] = useState<ThriftOrder>(() => {
    try {
      const stored = localStorage.getItem(SHOP_THRIFT_ORDERS_STORAGE_KEY);
      if (stored) {
        const list: ThriftOrder[] = JSON.parse(stored);
        const found = list.find(
          (o) =>
            o.id.toLowerCase() === targetId.toLowerCase() ||
            o.id.replace('#', '').toLowerCase() === targetId.replace('#', '').toLowerCase()
        );
        if (found) return found;
      }
    } catch (e) {
      console.error('Lỗi khi đọc đơn hàng:', e);
    }
    return INITIAL_MOCK_THRIFT_ORDERS[0];
  });

  // State Simulation state: 'paid' | 'processing' | 'shipped' | 'delivered' | 'completed' | 'disputed'
  const [simulationState, setSimulationState] = useState<OrderSimulationState>(() => {
    switch (order.status) {
      case 'PAID':
        return 'paid';
      case 'SHIPPED':
        return 'shipped';
      case 'DELIVERED':
        return 'delivered';
      case 'COMPLETED':
        return 'completed';
      default:
        return 'paid';
    }
  });

  // Modals
  const [showCertModal, setShowCertModal] = useState(false);
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [chatMessageInput, setChatMessageInput] = useState('');
  const [chatMessages, setChatMessages] = useState<
    { sender: 'shop' | 'buyer' | 'system'; text: string; time: string }[]
  >([
    {
      sender: 'system',
      text: 'Hạ tầng VNPay Smart Escrow đã khóa khoản thanh toán 124.000.000 ₫ cho Đơn hàng #RH-THF-2024-9108.',
      time: '20/11 · 14:32',
    },
    {
      sender: 'buyer',
      text: 'Chào Atelier Chronos, mình đã thanh toán đơn máy Hasselblad 907X. Nhờ xưởng kiểm tra lại lớp đệm vali Nanuk và cảm biến trước khi giao shipper chuyên biệt nhé.',
      time: '20/11 · 14:35',
    },
  ]);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Sync state change back to storage when status changes
  const updateOrderStatus = (newSimState: OrderSimulationState) => {
    setSimulationState(newSimState);
    try {
      const stored = localStorage.getItem(SHOP_THRIFT_ORDERS_STORAGE_KEY);
      let list: ThriftOrder[] = stored ? JSON.parse(stored) : INITIAL_MOCK_THRIFT_ORDERS;

      let mappedStatus: ThriftOrder['status'] = 'PAID';
      if (newSimState === 'shipped') mappedStatus = 'SHIPPED';
      else if (newSimState === 'delivered') mappedStatus = 'DELIVERED';
      else if (newSimState === 'completed') mappedStatus = 'COMPLETED';

      list = list.map((o) => (o.id === order.id ? { ...o, status: mappedStatus } : o));
      localStorage.setItem(SHOP_THRIFT_ORDERS_STORAGE_KEY, JSON.stringify(list));
      setOrder((prev) => ({ ...prev, status: mappedStatus }));
    } catch (e) {
      console.error('Lỗi khi đồng bộ trạng thái:', e);
    }
  };

  // Handle primary action button click
  const handlePrimaryAction = () => {
    if (simulationState === 'paid') {
      if (window.confirm('Xác nhận bắt đầu chuẩn bị hiện vật và niêm phong hộp Nanuk 910?')) {
        updateOrderStatus('processing');
        triggerToast('Đã chuyển đơn sang trạng thái ĐANG ĐÓNG GÓI (PROCESSING).');
      }
    } else if (simulationState === 'processing') {
      const tracking = window.prompt(
        'Nhập mã quét bàn giao bưu tá hoặc giữ mã mặc định:',
        order.shippingInfo?.trackingCode || '#VN-883910-TH'
      );
      if (tracking) {
        updateOrderStatus('shipped');
        triggerToast('Bàn giao bưu tá thành công! Đơn chuyển sang trạng thái ĐANG VẬN CHUYỂN.');
      }
    } else if (simulationState === 'shipped') {
      setShowTrackingModal(true);
    } else if (simulationState === 'delivered') {
      alert('Đồng hồ nghiệm thu quang học 72h đang hoạt động. Còn 54 giờ 12 phút để giải ngân tự động.');
    } else if (simulationState === 'completed') {
      alert('Biên lai giải ngân VNPay HSM #VNP-DISB-9108-SUCCESS: Đã chuyển 119.046.000 ₫ về tài khoản xưởng.');
    } else if (simulationState === 'disputed') {
      setShowChatModal(true);
    }
  };

  // Handle Send Chat
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessageInput.trim()) return;

    const newMsg = {
      sender: 'shop' as const,
      text: chatMessageInput.trim(),
      time: 'Vừa xong',
    };
    setChatMessages((prev) => [...prev, newMsg]);
    setChatMessageInput('');

    // Simulate auto-reply from buyer or mediator
    setTimeout(() => {
      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'buyer',
          text: 'Atelier yên tâm, mình sẽ quay video đồng kiểm bưu tá Nanuk khi nhận máy!',
          time: 'Vừa xong',
        },
      ]);
    }, 1200);
  };

  // Copy address
  const handleCopyAddress = () => {
    navigator.clipboard?.writeText(order.buyer.shippingAddress);
    triggerToast('Đã sao chép địa chỉ tiếp nhận hiện vật vào clipboard!');
  };

  // Copy tracking
  const handleCopyTracking = (code: string) => {
    navigator.clipboard?.writeText(code);
    triggerToast(`Đã sao chép mã vận đơn [${code}]!`);
  };

  return (
    <div className="w-full flex flex-col font-sans text-on-surface bg-surface min-h-[calc(100vh-4rem)] antialiased no-reveal">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-4 bg-primary text-on-primary rounded shadow-2xl max-w-md flex items-start gap-3 border border-secondary/40 animate-fade-in">
          <span className="material-symbols-outlined text-secondary text-[22px] shrink-0">task_alt</span>
          <div className="flex-1 text-sm">{toastMessage}</div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-on-primary hover:text-outline-variant cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
      )}

      {/* Interactive State Banner & Simulator */}
      <aside
        aria-label="Bộ điều khiển trạng thái mô phỏng"
        className="w-full bg-surface-container border-b border-outline-variant/30 py-2.5 px-margin-mobile lg:px-margin"
      >
        <div className="max-w-[1440px] mx-auto flex flex-wrap items-center justify-between gap-3 text-label-sm">
          <div className="flex items-center gap-2 text-on-surface-variant font-label-md">
            <span className="material-symbols-outlined text-[16px] text-tertiary">tune</span>
            <span className="uppercase tracking-widest text-[11px] font-semibold text-on-surface">
              Mô phỏng chu trình kiểm toán đơn:
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5" id="state-selector-bar">
            <button
              type="button"
              onClick={() => updateOrderStatus('paid')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-all cursor-pointer ${
                simulationState === 'paid'
                  ? 'bg-inverse-surface text-inverse-on-surface shadow-xs font-semibold'
                  : 'bg-surface-container-highest text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              1. PAID (Ký quỹ khóa)
            </button>
            <button
              type="button"
              onClick={() => updateOrderStatus('processing')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-all cursor-pointer ${
                simulationState === 'processing'
                  ? 'bg-inverse-surface text-inverse-on-surface shadow-xs font-semibold'
                  : 'bg-surface-container-highest text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              2. PROCESSING (Đóng gói)
            </button>
            <button
              type="button"
              onClick={() => updateOrderStatus('shipped')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-all cursor-pointer ${
                simulationState === 'shipped'
                  ? 'bg-inverse-surface text-inverse-on-surface shadow-xs font-semibold'
                  : 'bg-surface-container-highest text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              3. SHIPPED (Vận chuyển)
            </button>
            <button
              type="button"
              onClick={() => updateOrderStatus('delivered')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-all cursor-pointer ${
                simulationState === 'delivered'
                  ? 'bg-inverse-surface text-inverse-on-surface shadow-xs font-semibold'
                  : 'bg-surface-container-highest text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              4. DELIVERED (72h Nghiệm thu)
            </button>
            <button
              type="button"
              onClick={() => updateOrderStatus('completed')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-all cursor-pointer ${
                simulationState === 'completed'
                  ? 'bg-inverse-surface text-inverse-on-surface shadow-xs font-semibold'
                  : 'bg-surface-container-highest text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              5. COMPLETED (Đã giải ngân)
            </button>
            <button
              type="button"
              onClick={() => updateOrderStatus('disputed')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-all cursor-pointer ${
                simulationState === 'disputed'
                  ? 'bg-error text-on-error shadow-xs font-semibold'
                  : 'bg-surface-container-highest text-error hover:bg-error-container'
              }`}
            >
              6. DISPUTED (Khiếu nại)
            </button>
          </div>
        </div>
      </aside>

      {/* Editorial Order Canvas */}
      <div className="w-full px-margin-mobile lg:px-margin py-6 flex flex-col gap-6 max-w-[1440px] mx-auto flex-1">
        {/* Top Navigation Bar & Action Triggers */}
        <nav
          aria-label="Điều hướng đơn hàng"
          className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-outline-variant/30 pb-4"
        >
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider flex-wrap">
              <Link to="/shop/dashboard" className="hover:text-primary transition-colors">
                Bảng điều khiển xưởng
              </Link>
              <span>/</span>
              <Link to="/shop/thrift/orders" className="hover:text-primary transition-colors">
                Bán đứt THRIFT
              </Link>
              <span>/</span>
              <Link to="/shop/thrift/orders" className="hover:text-primary transition-colors">
                Sổ lệnh đơn hàng
              </Link>
              <span>/</span>
              <span className="text-on-surface font-semibold">{order.id}</span>
            </div>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              <Link
                to="/shop/thrift/orders"
                className="inline-flex items-center gap-1.5 text-primary hover:text-on-surface font-label-md text-label-md transition-colors group font-semibold"
              >
                <span className="material-symbols-outlined text-[18px] group-hover:-translate-x-1 transition-transform">
                  arrow_left_alt
                </span>
                <span>Quay lại Sổ Lệnh Đơn Hàng</span>
              </Link>
              <span className="text-outline-variant">·</span>
              <span className="font-label-sm text-label-sm text-on-surface-variant font-mono">
                HSM Seal Registry #VNP-9108-OCT
              </span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="px-3.5 py-2 rounded bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-label-md text-label-md transition-all flex items-center gap-1.5 shadow-sm border border-surface-dim cursor-pointer font-medium"
            >
              <span className="material-symbols-outlined text-[18px]">receipt_long</span>
              <span>In Phiếu Đóng Gói (Packing Slip)</span>
            </button>
            <button
              type="button"
              onClick={() => setShowCertModal(true)}
              className="px-3.5 py-2 rounded bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-label-md text-label-md transition-all flex items-center gap-1.5 shadow-sm border border-surface-dim cursor-pointer font-medium"
            >
              <span className="material-symbols-outlined text-[18px] text-secondary">workspace_premium</span>
              <span>Xuất Biên Lai B-Corp</span>
            </button>
            <a
              href="#dispute-section"
              className="px-3.5 py-2 rounded bg-error-container/40 hover:bg-error-container text-error font-label-md text-label-md transition-all flex items-center gap-1.5 font-medium"
            >
              <span className="material-symbols-outlined text-[18px]">gavel</span>
              <span>Báo Cáo Sự Cố</span>
            </a>
          </div>
        </nav>

        {/* Header Section: Title, Badges & Dynamic State CTAs */}
        <section className="bg-surface-container-low rounded p-6 lg:p-8 shadow-sm flex flex-col gap-6 relative overflow-hidden border border-surface-dim">
          {/* Decorative archival watermark */}
          <div className="absolute -right-8 -bottom-8 pointer-events-none select-none opacity-5 font-serif text-[140px] text-on-surface leading-none font-bold">
            ARCHIVE
          </div>

          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 relative z-10">
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2">
                {/* Dynamic Status Badge */}
                {simulationState === 'paid' && (
                  <span className="px-2.5 py-1 rounded bg-secondary-container text-on-secondary-container font-label-sm text-label-sm uppercase tracking-wider flex items-center gap-1.5 font-semibold">
                    <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
                    ĐÃ THANH TOÁN (PAID) · SMART ESCROW LOCKED
                  </span>
                )}
                {simulationState === 'processing' && (
                  <span className="px-2.5 py-1 rounded bg-tertiary-fixed text-on-tertiary-fixed font-label-sm text-label-sm uppercase tracking-wider flex items-center gap-1.5 font-semibold">
                    <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse"></span>
                    ĐANG ĐÓNG GÓI (PROCESSING) · CHUẨN BỊ NANUK
                  </span>
                )}
                {simulationState === 'shipped' && (
                  <span className="px-2.5 py-1 rounded bg-surface-container-high text-on-surface font-label-sm text-label-sm uppercase tracking-wider flex items-center gap-1.5 font-semibold">
                    <span className="material-symbols-outlined text-[16px]">local_shipping</span>
                    ĐANG VẬN CHUYỂN (SHIPPED) · IN TRANSIT
                  </span>
                )}
                {simulationState === 'delivered' && (
                  <span className="px-2.5 py-1 rounded bg-secondary-container text-on-secondary-container font-label-sm text-label-sm uppercase tracking-wider flex items-center gap-1.5 font-semibold">
                    <span className="w-2 h-2 rounded-full bg-secondary"></span>
                    ĐÃ GIAO · ĐANG ĐẾM NGƯỢC 72H NGHIỆM THU
                  </span>
                )}
                {simulationState === 'completed' && (
                  <span className="px-2.5 py-1 rounded bg-secondary text-on-secondary font-label-sm text-label-sm uppercase tracking-wider flex items-center gap-1.5 font-semibold">
                    <span className="material-symbols-outlined text-[16px]">task_alt</span>
                    ĐƠN HÀNG HOÀN TẤT · ĐÃ GIẢI NGÂN
                  </span>
                )}
                {simulationState === 'disputed' && (
                  <span className="px-2.5 py-1 rounded bg-error-container text-on-error-container font-label-sm text-label-sm uppercase tracking-wider flex items-center gap-1.5 font-semibold">
                    <span className="material-symbols-outlined text-[16px]">warning</span>
                    CÓ KHIẾU NẠI (DISPUTED) · KHÓA ESCROW
                  </span>
                )}

                <span className="px-2.5 py-1 rounded bg-surface text-on-surface-variant font-label-sm text-label-sm border border-outline-variant/30 flex items-center gap-1 font-semibold">
                  <span className="material-symbols-outlined text-[14px] text-primary">verified_user</span>
                  BẢO CHỨNG GIÁM ĐỊNH QUANG HỌC GRADE 1
                </span>
              </div>

              <div className="flex flex-wrap items-baseline gap-3 mt-1">
                <h1 className="font-serif text-3xl font-semibold text-on-surface tracking-tight">
                  Sổ Đơn Bán Đứt {order.id}
                </h1>
                <span className="font-label-md text-label-md text-on-surface-variant">
                  Khởi tạo: {order.createdAt || '20/11/2024 · 14:30 ICT'}
                </span>
              </div>

              <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl leading-relaxed">
                {simulationState === 'paid' && (
                  <>
                    Ký quỹ <strong className="text-on-surface font-semibold">{order.pricing.totalAmount.toLocaleString('vi-VN')} ₫</strong> đang khóa an toàn tại hạ tầng <strong className="text-on-surface">VNPay Smart Escrow</strong>. Khoản chi trả sẽ tự động giải ngân chuyển vào tài khoản xưởng sau <strong className="text-secondary font-semibold">72 giờ nghiệm thu quang học</strong> kể từ khi người nhận ký bàn giao hợp lệ.
                  </>
                )}
                {simulationState === 'processing' && (
                  <>
                    Xưởng đang chuẩn bị bọc chống sốc 6 lớp và niêm phong hộp Nanuk 910. Vui lòng ghi video quy trình trước khi bàn giao bưu tá White-Glove.
                  </>
                )}
                {simulationState === 'shipped' && (
                  <>
                    Kiện hàng đã rời Atelier Chronos & Optics. Bưu tá White-Glove đang vận chuyển chặng Hà Nội - Đà Nẵng với kiểm soát rung chấn G-Force thời gian thực.
                  </>
                )}
                {simulationState === 'delivered' && (
                  <>
                    Khách hàng {order.buyer.name} đã nhận kiện hàng lúc 09:15. Hệ thống kích hoạt đồng hồ 72 giờ thẩm định quang học trước khi tự động giải ngân.
                  </>
                )}
                {simulationState === 'completed' && (
                  <>
                    Khoản tiền <strong className="text-secondary font-bold">119.046.000 ₫</strong> đã giải ngân thành công vào tài khoản xưởng tại Vietcombank. Giao dịch mua đứt THRIFT hoàn tất vẹn toàn.
                  </>
                )}
                {simulationState === 'disputed' && (
                  <>
                    Khách hàng gửi yêu cầu tái kiểm tra cảm biến quang học. Smart Escrow tạm dừng giải ngân để giám định viên ReUse Hub vào cuộc phân xử.
                  </>
                )}
              </p>
            </div>

            {/* Dynamic Contextual Action Area */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={handlePrimaryAction}
                className={`px-5 py-3 rounded font-label-md text-label-md tracking-wide transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer font-semibold ${
                  simulationState === 'paid'
                    ? 'bg-primary hover:bg-tertiary text-on-primary'
                    : simulationState === 'processing'
                    ? 'bg-secondary text-on-secondary hover:bg-secondary/90'
                    : simulationState === 'shipped'
                    ? 'bg-surface-container-highest hover:bg-surface-container-high text-on-surface'
                    : simulationState === 'delivered'
                    ? 'bg-surface-container-highest text-on-surface'
                    : simulationState === 'completed'
                    ? 'bg-secondary-container text-on-secondary-container'
                    : 'bg-error text-on-error'
                }`}
              >
                {simulationState === 'paid' && (
                  <>
                    <span className="material-symbols-outlined text-[18px]">inventory_2</span>
                    <span>Bắt đầu Xử lý Đơn (Start Processing)</span>
                  </>
                )}
                {simulationState === 'processing' && (
                  <>
                    <span className="material-symbols-outlined text-[18px]">mark_chat_read</span>
                    <span>Xác nhận Đã Giao Bưu Tá (Mark as Shipped)</span>
                  </>
                )}
                {simulationState === 'shipped' && (
                  <>
                    <span className="material-symbols-outlined text-[18px]">route</span>
                    <span>Xem Chi Tiết Theo Dõi Vận Đơn</span>
                  </>
                )}
                {simulationState === 'delivered' && (
                  <>
                    <span className="material-symbols-outlined text-[18px]">timelapse</span>
                    <span>Xem Thời Gian Nghiệm Thu (54h còn lại)</span>
                  </>
                )}
                {simulationState === 'completed' && (
                  <>
                    <span className="material-symbols-outlined text-[18px]">receipt</span>
                    <span>Xem Biên Lai Giải Ngân Quỹ</span>
                  </>
                )}
                {simulationState === 'disputed' && (
                  <>
                    <span className="material-symbols-outlined text-[18px]">gavel</span>
                    <span>Xử Lý Tranh Chấp / Khiếu Nại</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setShowChatModal(true)}
                className="px-5 py-3 rounded bg-surface hover:bg-surface-container text-on-surface font-label-md text-label-md transition-all border border-outline-variant/40 flex items-center justify-center gap-1.5 cursor-pointer font-medium"
              >
                <span className="material-symbols-outlined text-[18px] text-primary">chat</span>
                <span>Liên Hệ Khách</span>
              </button>
            </div>
          </div>

          {/* Comprehensive Archival Stepper */}
          <div className="w-full pt-4 mt-2 border-t border-outline-variant/30 relative z-10">
            <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
              {/* Step 1 */}
              <div className="flex flex-col gap-1 p-2 rounded bg-surface/80 border border-outline-variant/20">
                <div className="flex items-center gap-1.5 text-secondary">
                  <span className="material-symbols-outlined text-[18px]">check_circle</span>
                  <span className="font-label-sm text-label-sm uppercase font-semibold">1. Khởi tạo</span>
                </div>
                <div className="font-label-sm text-label-sm text-on-surface font-medium">20/11 · 14:30</div>
                <div className="font-label-sm text-[11px] text-on-surface-variant">Đơn được xác nhận</div>
              </div>

              {/* Step 2 */}
              <div className="flex flex-col gap-1 p-2 rounded bg-surface/80 border border-outline-variant/20">
                <div className="flex items-center gap-1.5 text-secondary">
                  <span className="material-symbols-outlined text-[18px]">check_circle</span>
                  <span className="font-label-sm text-label-sm uppercase font-semibold">2. Thanh toán</span>
                </div>
                <div className="font-label-sm text-label-sm text-on-surface font-medium">20/11 · 14:32</div>
                <div className="font-label-sm text-[11px] text-on-surface-variant">VNPay Smart Escrow</div>
              </div>

              {/* Step 3 (Packaging) */}
              <div
                className={`flex flex-col gap-1 p-2 rounded transition-all border ${
                  simulationState === 'paid'
                    ? 'bg-primary text-on-primary shadow-sm border-primary'
                    : simulationState === 'processing'
                    ? 'bg-secondary text-on-secondary border-secondary'
                    : 'bg-surface/80 border-outline-variant/20'
                }`}
              >
                <div
                  className={`flex items-center gap-1.5 ${
                    simulationState === 'paid'
                      ? 'text-primary-fixed'
                      : simulationState === 'processing'
                      ? 'text-secondary-fixed'
                      : 'text-secondary'
                  }`}
                >
                  <span
                    className={`material-symbols-outlined text-[18px] ${
                      simulationState === 'paid' || simulationState === 'processing' ? 'animate-spin' : ''
                    }`}
                  >
                    {simulationState === 'paid'
                      ? 'sync'
                      : simulationState === 'processing'
                      ? 'inventory_2'
                      : 'check_circle'}
                  </span>
                  <span className="font-label-sm text-label-sm uppercase font-semibold">3. Đóng gói</span>
                </div>
                <div
                  className={`font-label-sm text-label-sm font-medium ${
                    simulationState === 'paid' || simulationState === 'processing'
                      ? 'text-white'
                      : 'text-on-surface'
                  }`}
                >
                  {simulationState === 'paid'
                    ? 'Chờ đóng Nanuk'
                    : simulationState === 'processing'
                    ? 'Đang đóng gói'
                    : 'Đã hoàn tất'}
                </div>
                <div
                  className={`font-label-sm text-[11px] ${
                    simulationState === 'paid' || simulationState === 'processing'
                      ? 'text-white/80'
                      : 'text-on-surface-variant'
                  }`}
                >
                  Hạn SLA: 23 giờ tới
                </div>
              </div>

              {/* Step 4 (Nanuk Courier) */}
              <div
                className={`flex flex-col gap-1 p-2 rounded transition-all border ${
                  simulationState === 'shipped'
                    ? 'bg-primary text-on-primary shadow-sm border-primary'
                    : ['delivered', 'completed'].includes(simulationState)
                    ? 'bg-surface/80 border-outline-variant/20'
                    : 'bg-surface-container/60 opacity-60 border-transparent'
                }`}
              >
                <div
                  className={`flex items-center gap-1.5 ${
                    simulationState === 'shipped'
                      ? 'text-primary-fixed'
                      : ['delivered', 'completed'].includes(simulationState)
                      ? 'text-secondary'
                      : 'text-on-surface-variant'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {['delivered', 'completed'].includes(simulationState) ? 'check_circle' : 'local_shipping'}
                  </span>
                  <span className="font-label-sm text-label-sm uppercase font-semibold">4. Bưu tá Nanuk</span>
                </div>
                <div
                  className={`font-label-sm text-label-sm font-medium ${
                    simulationState === 'shipped' ? 'text-white' : 'text-on-surface'
                  }`}
                >
                  {simulationState === 'shipped'
                    ? 'Đang vận chuyển'
                    : ['delivered', 'completed'].includes(simulationState)
                    ? 'Đã bàn giao'
                    : 'Chưa xuất kho'}
                </div>
                <div
                  className={`font-label-sm text-[11px] ${
                    simulationState === 'shipped' ? 'text-white/80' : 'text-on-surface-variant'
                  }`}
                >
                  {order.shippingInfo?.trackingCode || '#VN-883910-TH'}
                </div>
              </div>

              {/* Step 5 (72h Inspection) */}
              <div
                className={`flex flex-col gap-1 p-2 rounded transition-all border ${
                  simulationState === 'delivered'
                    ? 'bg-primary text-on-primary shadow-sm border-primary'
                    : simulationState === 'completed'
                    ? 'bg-surface/80 border-outline-variant/20'
                    : 'bg-surface-container/60 opacity-60 border-transparent'
                }`}
              >
                <div
                  className={`flex items-center gap-1.5 ${
                    simulationState === 'delivered'
                      ? 'text-primary-fixed'
                      : simulationState === 'completed'
                      ? 'text-secondary'
                      : 'text-on-surface-variant'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {simulationState === 'completed' ? 'check_circle' : 'verified'}
                  </span>
                  <span className="font-label-sm text-label-sm uppercase font-semibold">5. Nghiệm thu</span>
                </div>
                <div
                  className={`font-label-sm text-label-sm font-medium ${
                    simulationState === 'delivered' ? 'text-white' : 'text-on-surface'
                  }`}
                >
                  {simulationState === 'delivered'
                    ? '54h Khảo nghiệm'
                    : simulationState === 'completed'
                    ? 'Đạt chuẩn 100%'
                    : '72h Khảo nghiệm'}
                </div>
                <div
                  className={`font-label-sm text-[11px] ${
                    simulationState === 'delivered' ? 'text-white/80' : 'text-on-surface-variant'
                  }`}
                >
                  Optical bench audit
                </div>
              </div>

              {/* Step 6 (Completed Payout) */}
              <div
                className={`flex flex-col gap-1 p-2 rounded transition-all border ${
                  simulationState === 'completed'
                    ? 'bg-secondary text-on-secondary shadow-sm border-secondary'
                    : 'bg-surface-container/60 opacity-60 border-transparent'
                }`}
              >
                <div
                  className={`flex items-center gap-1.5 ${
                    simulationState === 'completed' ? 'text-secondary-fixed' : 'text-on-surface-variant'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">account_balance_wallet</span>
                  <span className="font-label-sm text-label-sm uppercase font-semibold">6. Hoàn tất</span>
                </div>
                <div
                  className={`font-label-sm text-label-sm font-medium ${
                    simulationState === 'completed' ? 'text-white' : 'text-on-surface'
                  }`}
                >
                  Giải ngân ròng
                </div>
                <div
                  className={`font-label-sm text-[11px] font-mono ${
                    simulationState === 'completed' ? 'text-white/80' : 'text-on-surface-variant'
                  }`}
                >
                  119.046.000 ₫
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Main Content Grid: Items & Customer (Left 8 Cols) | Financial & Dispatch (Right 4 Cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
          {/* LEFT SECTION (8 Cols): Order Items, Customer Dossier, Pack Protocol */}
          <main className="lg:col-span-8 flex flex-col gap-6">
            {/* SECTION 1: Multi-Item Archival Showcase */}
            <section className="bg-surface-container-lowest rounded p-6 shadow-sm flex flex-col gap-4 border border-outline-variant/30">
              <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[20px]">inventory</span>
                  <h2 className="font-serif text-xl font-semibold text-on-surface">
                    Hiện Vật THRIFT Bán Đứt ({order.listings.length > 9 ? order.listings.length : `0${order.listings.length}`} Mục)
                  </h2>
                </div>
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider bg-surface-container px-2 py-0.5 rounded font-medium">
                  Lưu ký: Atelier Chronos &amp; Optics
                </span>
              </div>

              <div className="flex flex-col gap-4 divide-y divide-outline-variant/20">
                {order.listings.map((item, index) => (
                  <article key={item.id || index} className="pt-4 first:pt-0 flex flex-col sm:flex-row gap-4">
                    <div className="w-full sm:w-44 h-44 bg-surface-container-low rounded overflow-hidden relative shrink-0">
                      <img
                        className="w-full h-full object-cover"
                        src={item.imageUrl}
                        alt={item.title}
                        loading="lazy"
                      />
                      <span className="absolute top-2 left-2 bg-inverse-surface/85 text-inverse-on-surface font-label-sm text-[10px] px-1.5 py-0.5 rounded backdrop-blur-xs font-semibold">
                        {item.grade || 'GRADE 1 · MINT-'}
                      </span>
                    </div>

                    <div className="flex flex-col justify-between flex-grow gap-2">
                      <div>
                        <div className="flex items-baseline justify-between gap-2 flex-wrap">
                          <span className="font-label-sm text-label-sm text-tertiary uppercase tracking-wider font-semibold font-mono">
                            SKU: {index === 0 ? 'HBL-907X-TH01' : 'BW-FLT-77'} · SERIAL {item.serialNumber}
                          </span>
                          <span className="font-label-sm text-label-sm text-secondary bg-secondary-container px-2 py-0.5 rounded font-semibold uppercase">
                            {index === 0 ? 'SECOND LIFE CYCLE' : 'NEW IN BOX'}
                          </span>
                        </div>
                        <h3 className="font-title-md text-title-md text-on-surface mt-1 font-semibold hover:text-primary transition-colors">
                          {item.title}
                        </h3>
                        <p className="font-body-md text-body-md text-on-surface-variant mt-1 text-[13px] leading-relaxed">
                          {index === 0
                            ? 'Nguồn gốc: Kho Second Life Atelier (Đã hoàn tất 14 chu kỳ RENT tiêu chuẩn bảo tàng). Tình trạng: Mint- 98.0%, cảm biến medium format sạch 100%, 4.820 shot bấm shutter cơ học, kính quang học không tì vết.'
                            : 'Nguồn gốc: Phụ kiện xưởng ký gửi mới 100%. Tình trạng: Pristine 100%, nguyên hộp niêm chì chống ẩm SCHOTT Glass Germany, lớp phủ đa tầng MRC Nano kháng trầy và tĩnh điện.'}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-outline-variant/20 mt-2">
                        <div className="flex items-center gap-3">
                          <div className="text-on-surface font-title-md text-title-md font-bold">
                            {item.price.toLocaleString('vi-VN')} ₫
                          </div>
                          <span className="text-on-surface-variant font-body-md text-body-md">× 01 chiếc</span>
                          <span className="font-label-sm text-label-sm text-secondary flex items-center gap-0.5 font-medium">
                            <span className="material-symbols-outlined text-[14px]">verified</span>
                            {index === 0 ? 'Bảo hành 12 tháng xưởng' : 'Kèm tem niêm bảo tàng'}
                          </span>
                        </div>
                        <Link
                          to="/shop/thrift/listings/HBL-907X"
                          className="font-label-md text-label-md text-primary hover:text-on-surface underline underline-offset-4 decoration-outline-variant transition-colors font-medium"
                        >
                          Xem Mục Đăng Gốc →
                        </Link>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            {/* SECTION 2: Customer Profile Dossier & Verification Badge */}
            <section className="bg-surface-container-low rounded p-6 shadow-sm flex flex-col gap-4 border border-outline-variant/30">
              <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-[20px]">person_pin</span>
                  <h2 className="font-serif text-xl font-semibold text-on-surface">Hồ Sơ Giám Định Người Mua</h2>
                </div>
                <span className="font-label-sm text-label-sm text-secondary bg-secondary-container px-2.5 py-0.5 rounded font-semibold flex items-center gap-1 uppercase">
                  <span className="material-symbols-outlined text-[14px]">shield</span>
                  {order.buyer.kycTier || 'KYC XÁC THỰC CCCD · TIER 2'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1 flex flex-col gap-2 border-b md:border-b-0 md:border-r border-outline-variant/20 pb-4 md:pb-0 md:pr-4">
                  <div className="w-14 h-14 rounded-full bg-secondary text-on-secondary flex items-center justify-center font-serif text-[22px] font-bold shadow-sm">
                    {order.buyer.name
                      .split(' ')
                      .map((w) => w[0])
                      .slice(-2)
                      .join('')}
                  </div>
                  <div>
                    <h3 className="font-title-md text-title-md text-on-surface font-semibold">
                      {order.buyer.name}
                    </h3>
                    <div className="font-label-sm text-label-sm text-on-surface-variant font-mono">
                      Archival Custodian ID #CUST-VN-4401
                    </div>
                  </div>
                  <div className="mt-1 flex flex-col gap-1 text-[12px] text-on-surface-variant font-label-md">
                    <span className="flex items-center gap-1 text-secondary font-medium">
                      <span className="material-symbols-outlined text-[15px]">verified</span>
                      Điểm Tín Nhiệm: <strong>99.8%</strong> (18 Giao dịch)
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[15px]">history_edu</span>
                      Thành viên sưu tầm từ: 10/2023
                    </span>
                  </div>
                </div>

                <div className="md:col-span-2 flex flex-col justify-between gap-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-body-md">
                    <div className="flex flex-col">
                      <span className="font-label-sm text-label-sm text-on-surface-variant uppercase font-medium">
                        Số điện thoại liên lạc:
                      </span>
                      <span className="text-on-surface font-semibold font-mono">{order.buyer.phone}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-label-sm text-label-sm text-on-surface-variant uppercase font-medium">
                        Thư điện tử:
                      </span>
                      <span className="text-on-surface font-semibold font-mono">
                        {order.buyer.email || 'elena.rostova@atelier-archive.com'}
                      </span>
                    </div>
                    <div className="sm:col-span-2 flex flex-col">
                      <span className="font-label-sm text-label-sm text-on-surface-variant uppercase font-medium">
                        Địa chỉ tiếp nhận hiện vật:
                      </span>
                      <span className="text-on-surface font-medium leading-relaxed">
                        {order.buyer.shippingAddress}
                      </span>
                    </div>
                    <div className="sm:col-span-2 bg-surface rounded p-3 border border-outline-variant/30 flex items-start gap-2">
                      <span className="material-symbols-outlined text-tertiary text-[18px] shrink-0 mt-0.5">
                        priority_high
                      </span>
                      <div className="text-[13px] text-on-surface-variant leading-relaxed">
                        <strong className="text-on-surface">Chỉ dẫn giao hàng đặc thù:</strong> "Giao tận tay
                        trong giờ hành chính, yêu cầu đồng kiểm vỏ vali Nanuk và chụp ảnh nguyên seal trước khi
                        ký nhận."
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-outline-variant/20">
                    <button
                      type="button"
                      onClick={() => setShowChatModal(true)}
                      className="px-3.5 py-1.5 rounded bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-label-md text-label-md transition-all flex items-center gap-1.5 cursor-pointer font-medium"
                    >
                      <span className="material-symbols-outlined text-[16px] text-primary">chat_bubble</span>
                      <span>Nhắn Tin Trao Đổi Với Khách Hàng</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleCopyAddress}
                      className="px-3.5 py-1.5 rounded bg-surface hover:bg-surface-container text-on-surface-variant font-label-md text-label-md transition-all border border-outline-variant/30 flex items-center gap-1 cursor-pointer font-medium"
                    >
                      <span className="material-symbols-outlined text-[16px]">content_copy</span>
                      <span>Sao chép Địa Chỉ</span>
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* SECTION 3: Packing & Optical Bench Protocol */}
            <section className="bg-surface-container rounded p-6 shadow-sm flex flex-col gap-3 border border-outline-variant/30">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-[20px]">
                  assignment_turned_in
                </span>
                <h2 className="font-serif text-xl font-semibold text-on-surface">
                  Quy Chuẩn Niêm Phong &amp; Giao Tiếp Nanuk Crate
                </h2>
              </div>
              <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                Theo tiêu chuẩn bảo tồn ReUse Circularity Tier-1, kiện hàng phải đáp ứng đủ 3 bước kiểm chứng
                trước khi bàn giao bưu tá:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-1">
                <div className="p-3.5 rounded bg-surface border border-outline-variant/30 flex flex-col gap-1.5">
                  <div className="flex items-center gap-1.5 font-label-md text-label-md text-on-surface font-semibold">
                    <span className="material-symbols-outlined text-[16px] text-primary">videocam</span>
                    1. Ghi hình đóng gói
                  </div>
                  <p className="text-[12px] text-on-surface-variant leading-relaxed">
                    Quay video 360 độ hiện vật, cảm biến medium format và lens filter trước khi đóng chốt vali.
                  </p>
                </div>

                <div className="p-3.5 rounded bg-surface border border-outline-variant/30 flex flex-col gap-1.5">
                  <div className="flex items-center gap-1.5 font-label-md text-label-md text-on-surface font-semibold">
                    <span className="material-symbols-outlined text-[16px] text-secondary">lock</span>
                    2. Tem Seal Chống Rạch
                  </div>
                  <p className="text-[12px] text-on-surface-variant leading-relaxed">
                    Dán 2 tem seal mã vạch ReUse Tamper-Proof lên 2 chốt khóa Nanuk 910 chuyên dụng.
                  </p>
                </div>

                <div className="p-3.5 rounded bg-surface border border-outline-variant/30 flex flex-col gap-1.5">
                  <div className="flex items-center gap-1.5 font-label-md text-label-md text-on-surface font-semibold">
                    <span className="material-symbols-outlined text-[16px] text-tertiary">
                      qr_code_scanner
                    </span>
                    3. Quét mã Bưu tá White-Glove
                  </div>
                  <p className="text-[12px] text-on-surface-variant leading-relaxed">
                    Yêu cầu bưu tá quét mã xác thực ký quỹ trên ứng dụng ReUse Courier trước khi rời xưởng.
                  </p>
                </div>
              </div>
            </section>
          </main>

          {/* RIGHT SECTION (4 Cols): Financial Settlement & Dispatch Waybill */}
          <aside aria-label="Chi tiết thanh toán và điều phối" className="lg:col-span-4 flex flex-col gap-6">
            {/* FINANCIAL SETTLEMENT CARD (Immutable ledger) */}
            <section className="bg-surface-container-lowest rounded p-5 lg:p-6 shadow-sm border border-outline-variant/30 flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-outline-variant/20 pb-2">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-primary text-[20px]">account_balance</span>
                  <h2 className="font-serif text-lg font-semibold text-on-surface">
                    Bản Ghi Quyết Toán Tài Chính
                  </h2>
                </div>
                <span className="material-symbols-outlined text-[18px] text-secondary" title="Sổ cái bất biến khóa HSM">
                  lock
                </span>
              </div>

              {/* Immutable Ledger Notice */}
              <div className="p-2.5 rounded bg-surface-container text-[11px] text-on-surface-variant font-label-md flex items-start gap-1.5 border border-outline-variant/20 leading-relaxed">
                <span className="material-symbols-outlined text-[16px] text-primary shrink-0 mt-0.5">info</span>
                <span>
                  Bản ghi tài chính được đối soát tự động bởi Cổng thanh toán VNPay và Hợp đồng Smart Escrow.
                  Chủ xưởng không có quyền can thiệp thủ công bản ghi kế toán này.
                </span>
              </div>

              {/* Payment Metadata */}
              <div className="flex flex-col gap-1.5 text-[12px] font-label-md bg-surface-container-low p-3 rounded">
                <div className="flex items-center justify-between text-on-surface-variant">
                  <span>Trạng thái:</span>
                  <span className="font-semibold text-secondary flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                    ĐÃ THANH TOÁN (Instant)
                  </span>
                </div>
                <div className="flex items-center justify-between text-on-surface-variant">
                  <span>Cổng giao dịch:</span>
                  <span className="text-on-surface font-medium">VNPay QR (NAPAS247)</span>
                </div>
                <div className="flex items-center justify-between text-on-surface-variant">
                  <span>Mã giao dịch VNPay:</span>
                  <span className="font-mono text-on-surface font-medium">VNP-TX-84920419208</span>
                </div>
                <div className="flex items-center justify-between text-on-surface-variant">
                  <span>HSM Timestamp:</span>
                  <span className="text-on-surface font-mono">20/11/2024 · 14:32:08</span>
                </div>
              </div>

              {/* Financial Breakdown Table */}
              <div className="flex flex-col gap-2 pt-2 border-t border-outline-variant/20 font-body-md text-[13px]">
                <div className="flex items-center justify-between text-on-surface-variant">
                  <span>Tiền hàng (02 hiện vật):</span>
                  <span className="text-on-surface font-medium font-mono">
                    {order.pricing.subtotal.toLocaleString('vi-VN')} ₫
                  </span>
                </div>
                <div className="flex items-center justify-between text-on-surface-variant">
                  <span>Vận chuyển vali Nanuk (Bảo hiểm 100%):</span>
                  <span className="text-on-surface font-medium font-mono">
                    {order.pricing.shippingFee.toLocaleString('vi-VN')} ₫
                  </span>
                </div>
                <div className="flex items-center justify-between text-on-surface font-semibold pt-2 border-t border-outline-variant/20">
                  <span>Tổng khách thanh toán (Escrow):</span>
                  <span className="font-serif text-lg font-bold text-on-surface font-mono">
                    {order.pricing.totalAmount.toLocaleString('vi-VN')} ₫
                  </span>
                </div>

                <div className="flex items-center justify-between text-on-surface-variant text-[12px] pt-1">
                  <span className="flex items-center gap-1">
                    Phí sàn ReUse Hub (3.5%):
                    <span
                      className="material-symbols-outlined text-[13px] text-outline"
                      title="Chi phí hạ tầng giám định & phòng LAB"
                    >
                      help
                    </span>
                  </span>
                  <span className="text-error font-mono font-medium">-4.334.750 ₫</span>
                </div>

                <div className="flex items-center justify-between text-on-surface-variant text-[12px]">
                  <span className="flex items-center gap-1">
                    Quỹ B-Corp Circularity (0.5%):
                    <span
                      className="material-symbols-outlined text-[13px] text-outline"
                      title="Ủng hộ bù trừ Carbon và tái sinh bao bì"
                    >
                      help
                    </span>
                  </span>
                  <span className="text-error font-mono font-medium">-619.250 ₫</span>
                </div>

                {/* Net Settlement Result */}
                <div className="mt-2 p-3.5 rounded bg-secondary-container/40 border border-secondary/20 flex flex-col gap-1">
                  <span className="font-label-sm text-label-sm text-secondary uppercase font-bold tracking-wider">
                    Doanh thu xưởng thực nhận:
                  </span>
                  <div className="font-serif text-2xl text-on-secondary-fixed font-bold leading-tight font-mono text-secondary">
                    119.046.000 ₫
                  </div>
                  <span className="text-[11px] text-on-secondary-container mt-0.5 leading-relaxed">
                    Mở khóa tự động lúc <strong>14:30 ngày 25/11/2024</strong> sau 72h nghiệm thu không phát sinh
                    tranh chấp.
                  </span>
                </div>
              </div>
            </section>

            {/* DISPATCH & LOGISTICS TRACKING CARD */}
            <section className="bg-surface-container-lowest rounded p-5 lg:p-6 shadow-sm border border-outline-variant/30 flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-outline-variant/20 pb-2">
                <div className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-primary text-[20px]">local_shipping</span>
                  <h2 className="font-serif text-lg font-semibold text-on-surface">Điều Phối Vận Chuyển</h2>
                </div>
                <span className="font-label-sm text-label-sm text-primary uppercase bg-primary-fixed/40 px-2 py-0.5 rounded font-semibold">
                  White-Glove
                </span>
              </div>

              <div className="flex flex-col gap-2.5 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">
                    Mã Vận Đơn Bảo Chứng:
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="font-mono text-on-surface font-semibold">
                      {order.shippingInfo?.trackingCode || '#VN-883910-TH'}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyTracking(order.shippingInfo?.trackingCode || '#VN-883910-TH')}
                      className="p-1 hover:text-primary cursor-pointer text-on-surface-variant"
                      title="Sao chép mã"
                    >
                      <span className="material-symbols-outlined text-[15px]">content_copy</span>
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">
                    Đơn Vị Chuyên Chở:
                  </span>
                  <span className="text-on-surface font-medium">
                    {order.shippingInfo?.carrier || 'Insured Nanuk Crate Courier'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">
                    Trạng Thái Bưu Vận:
                  </span>
                  <span
                    className={`font-label-sm text-label-sm font-semibold px-2 py-0.5 rounded ${
                      simulationState === 'shipped'
                        ? 'bg-blue-100 text-blue-900'
                        : simulationState === 'delivered' || simulationState === 'completed'
                        ? 'bg-secondary-container text-on-secondary-container'
                        : 'bg-tertiary-fixed/60 text-tertiary'
                    }`}
                  >
                    {simulationState === 'paid' && 'Chờ lấy hàng (Awaiting Pickup)'}
                    {simulationState === 'processing' && 'Đang niêm phong tại xưởng'}
                    {simulationState === 'shipped' && 'Đang di chuyển trên đường'}
                    {simulationState === 'delivered' && 'Đã giao hàng thành công'}
                    {simulationState === 'completed' && 'Nghiệm thu thành công 100%'}
                    {simulationState === 'disputed' && 'Tạm dừng phân xử'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase">
                    Hạn Chót Bàn Giao SLA:
                  </span>
                  <span className="text-error font-semibold font-label-md">14:30 Ngày mai (23h còn lại)</span>
                </div>
              </div>

              {/* Interactive Waybill Action */}
              <div className="pt-2 border-t border-outline-variant/20 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => setShowTrackingModal(true)}
                  className="w-full py-2.5 rounded bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-label-md text-label-md transition-all flex items-center justify-center gap-1.5 cursor-pointer font-medium"
                >
                  <span className="material-symbols-outlined text-[18px]">route</span>
                  <span>Xem Nhật Ký Hành Trình &amp; Cảm Biến G-Force</span>
                </button>
                <p className="text-[11px] text-on-surface-variant text-center leading-relaxed">
                  Kiện hàng được gắn thẻ định vị GPS &amp; cảm biến sốc chấn động thời gian thực.
                </p>
              </div>
            </section>

            {/* DISPUTE & AUDIT ESCALATION PANEL */}
            <section
              id="dispute-section"
              className="bg-surface-container-low rounded p-5 shadow-sm border border-outline-variant/30 flex flex-col gap-2"
            >
              <div className="flex items-center gap-2 text-error">
                <span className="material-symbols-outlined text-[20px]">shield_with_heart</span>
                <h2 className="font-title-md text-title-md font-semibold">Trợ Giúp Pháp Lý &amp; Kiểm Định</h2>
              </div>
              <p className="text-[12px] text-on-surface-variant leading-relaxed">
                Nếu có khiếu nại phát sinh trong 72h nghiệm thu quang học hoặc niêm phong tem vỏ máy bị tác
                động sai quy cách, chủ xưởng có quyền kích hoạt phân xử giám định độc lập.
              </p>
              <button
                type="button"
                onClick={() => setShowChatModal(true)}
                className="w-full py-2 rounded bg-surface hover:bg-error-container/20 text-error font-label-md text-label-md border border-error/30 transition-all flex items-center justify-center gap-1.5 mt-1 cursor-pointer font-semibold"
              >
                <span className="material-symbols-outlined text-[16px]">support_agent</span>
                <span>Mở Hội Thoại Trọng Tài Admin</span>
              </button>
            </section>
          </aside>
        </div>
      </div>

      {/* MODAL 1: B-Corp Archival Certificate Modal */}
      {showCertModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-[#141310]/60 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-surface-container-lowest border border-outline-variant/40 shadow-2xl rounded-lg max-w-lg w-full p-6 flex flex-col gap-4 animate-scale-in">
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-[24px]">verified</span>
                <span className="font-serif text-xl font-semibold text-on-surface">
                  Biên Lai Tuần Hoàn B-Corp
                </span>
              </div>
              <button
                type="button"
                className="p-1 text-on-surface-variant hover:text-on-surface cursor-pointer"
                onClick={() => setShowCertModal(false)}
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="flex flex-col gap-3 font-body-md text-[13px] text-on-surface-variant leading-relaxed">
              <div className="p-3 bg-surface-container rounded border border-outline-variant/30 flex flex-col gap-1">
                <span className="font-label-sm text-label-sm text-secondary font-bold uppercase font-mono">
                  Chứng thư số #BCORP-RH-9108
                </span>
                <span className="text-on-surface font-semibold text-[14px]">
                  Tác Động Vòng Đời Hiện Vật Lưu Ký (Second Life)
                </span>
                <p className="mt-1">
                  Bằng việc bán đứt thiết bị <strong>Hasselblad 907X</strong> sau 14 chu kỳ thuê, Atelier
                  Chronos &amp; Optics và ReUse Hub đã bù trừ thành công <strong>14.2 kg CO₂e</strong> phát thải
                  công nghiệp sản xuất mới.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="p-3 bg-secondary-container/40 rounded border border-secondary/20">
                  <div className="font-serif text-2xl font-bold text-on-secondary-container text-secondary">
                    14.2 kg
                  </div>
                  <div className="font-label-sm text-label-sm text-on-secondary-container font-medium mt-0.5">
                    CO₂e Tránh Được
                  </div>
                </div>
                <div className="p-3 bg-secondary-container/40 rounded border border-secondary/20">
                  <div className="font-serif text-2xl font-bold text-on-secondary-container text-secondary">
                    100%
                  </div>
                  <div className="font-label-sm text-label-sm text-on-secondary-container font-medium mt-0.5">
                    Bao Bì Nanuk Tái Sử Dụng
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-outline-variant/20">
              <button
                type="button"
                className="px-4 py-2 rounded bg-inverse-surface hover:bg-primary text-inverse-on-surface font-label-md text-label-md transition-colors cursor-pointer font-semibold"
                onClick={() => setShowCertModal(false)}
              >
                Đóng Chứng Thư
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Live Tracking & G-Force Sensor Modal */}
      {showTrackingModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-[#141310]/60 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-surface-container-lowest border border-outline-variant/40 shadow-2xl rounded-lg max-w-xl w-full p-6 flex flex-col gap-4 animate-scale-in">
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[24px]">sensors</span>
                <span className="font-serif text-xl font-semibold text-on-surface">
                  Hành Trình G-Force &amp; GPS Chuyên Dụng
                </span>
              </div>
              <button
                type="button"
                className="p-1 text-on-surface-variant hover:text-on-surface cursor-pointer"
                onClick={() => setShowTrackingModal(false)}
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="flex flex-col gap-3 font-body-md text-[13px]">
              <div className="flex items-center justify-between p-2.5 rounded bg-surface-container border border-surface-dim">
                <span className="text-on-surface-variant">
                  Mã kiện:{' '}
                  <strong className="text-on-surface font-mono">
                    {order.shippingInfo?.trackingCode || '#VN-883910-TH'}
                  </strong>
                </span>
                <span className="text-secondary font-semibold flex items-center gap-1 font-mono">
                  <span className="w-2 h-2 rounded-full bg-secondary"></span>
                  Cảm biến gia tốc: 0.02G (Bình Thường)
                </span>
              </div>

              <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-outline-variant/40 py-2">
                <div className="relative">
                  <span className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-secondary ring-4 ring-surface"></span>
                  <div className="text-on-surface font-semibold">Khởi tạo mã vận đơn bưu tá Nanuk White-Glove</div>
                  <div className="text-on-surface-variant text-[11px]">
                    20/11/2024 · 14:35 — Điều phối viên đã chỉ định nhân sự chuyên dụng
                  </div>
                </div>

                <div className={`relative ${simulationState === 'paid' ? 'opacity-60' : ''}`}>
                  <span
                    className={`absolute -left-6 top-1 w-2.5 h-2.5 rounded-full ring-4 ring-surface ${
                      simulationState !== 'paid' ? 'bg-secondary' : 'bg-outline-variant'
                    }`}
                  ></span>
                  <div className="text-on-surface font-semibold">
                    Chờ bưu tá kiểm định quét tem niêm phong tại xưởng
                  </div>
                  <div className="text-on-surface-variant text-[11px]">
                    {simulationState !== 'paid' ? 'Đã hoàn tất kiểm quét lúc 16:30' : 'Dự kiến: Trước 14:30 ngày 21/11/2024'}
                  </div>
                </div>

                <div
                  className={`relative ${
                    ['shipped', 'delivered', 'completed'].includes(simulationState) ? '' : 'opacity-40'
                  }`}
                >
                  <span
                    className={`absolute -left-6 top-1 w-2.5 h-2.5 rounded-full ring-4 ring-surface ${
                      ['shipped', 'delivered', 'completed'].includes(simulationState)
                        ? 'bg-secondary'
                        : 'bg-outline-variant'
                    }`}
                  ></span>
                  <div className="text-on-surface font-semibold">
                    Vận chuyển chặng chuyên dụng Hà Nội - Đà Nẵng
                  </div>
                  <div className="text-on-surface-variant text-[11px]">
                    Xe thùng kín kiểm soát nhiệt độ 22°C, độ ẩm 45% RH
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-outline-variant/20">
              <button
                type="button"
                className="px-4 py-2 rounded bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-label-md text-label-md cursor-pointer font-semibold"
                onClick={() => setShowTrackingModal(false)}
              >
                Đóng Cửa Sổ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Chat Drawer with Buyer / Mediator */}
      {showChatModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-[#141310]/60 backdrop-blur-xs flex items-center justify-end"
        >
          <div className="bg-surface-container-lowest h-full max-w-md w-full p-6 flex flex-col justify-between shadow-2xl border-l border-outline-variant/30 animate-slide-left">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-secondary text-on-secondary flex items-center justify-center font-bold text-xs">
                    ER
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-on-surface">{order.buyer.name}</h4>
                    <span className="text-[11px] text-secondary font-medium">
                      Kênh trao đổi bảo mật ReUse Hub
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowChatModal(false)}
                  className="p-1 hover:text-on-surface text-on-surface-variant cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>

              {/* Chat Message List */}
              <div className="space-y-3 py-4 max-h-[60vh] overflow-y-auto pr-1">
                {chatMessages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex flex-col ${
                      msg.sender === 'shop'
                        ? 'items-end'
                        : msg.sender === 'system'
                        ? 'items-center text-center'
                        : 'items-start'
                    }`}
                  >
                    {msg.sender === 'system' ? (
                      <div className="p-2 bg-surface-container rounded text-[11px] text-on-surface-variant max-w-[85%] border border-surface-dim">
                        {msg.text}
                      </div>
                    ) : (
                      <>
                        <div
                          className={`p-3 rounded-lg max-w-[85%] text-xs leading-relaxed ${
                            msg.sender === 'shop'
                              ? 'bg-primary text-on-primary'
                              : 'bg-surface-container-high text-on-surface'
                          }`}
                        >
                          {msg.text}
                        </div>
                        <span className="text-[10px] text-on-surface-variant mt-0.5 px-1">{msg.time}</span>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Chat Input */}
            <form onSubmit={handleSendMessage} className="pt-3 border-t border-outline-variant/20">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatMessageInput}
                  onChange={(e) => setChatMessageInput(e.target.value)}
                  placeholder="Gửi phản hồi cho khách hàng..."
                  className="flex-1 px-3 py-2 bg-surface rounded text-xs text-on-surface focus:outline-none border border-outline-variant/40"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary hover:bg-tertiary text-on-primary rounded text-xs font-semibold uppercase tracking-wider cursor-pointer"
                >
                  Gửi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShopThriftOrderDetail;
