import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';

export const ShopRentOrderDetail: React.FC = () => {
  const { id: paramOrderId } = useParams<{ id?: string }>();
  const orderId = paramOrderId || 'RH-RNT-2024-8845';
  const displayOrderCode = orderId.startsWith('#') ? orderId : `#${orderId}`;

  // Interactive Demo State Switcher
  type DemoState = 'pending' | 'paid' | 'renting' | 'inspecting' | 'completed';
  const [demoState, setDemoState] = useState<DemoState>('inspecting');

  // Inspection form states
  const [conditionResult, setConditionResult] = useState<string>('perfect');
  const [inspectionNote, setInspectionNote] = useState<string>(
    'Thấu kính trước sau trong suốt, cảm biến 50MP đã test phơi sáng 30s f/16 không phát hiện điểm chết hay bụi bẩn lọt vào buồng máy. Vỏ nhôm không vết cấn móp mới. Kính lọc B+W sạch nguyên bản. Đầy đủ 2 pin zin, nắp cáp, sạc đôi, dây tether. Đạt tiêu chuẩn hoàn cọc toàn phần.'
  );

  // Escrow calculation
  const originalDeposit = 17500000;
  const deductionAmount =
    conditionResult === 'cleanroom_dust'
      ? 350000
      : conditionResult === 'damage_lens'
      ? 3000000
      : 0;
  const refundAmount = Math.max(0, originalDeposit - deductionAmount);

  // Modals state
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [showEscrowConfirmModal, setShowEscrowConfirmModal] = useState(false);
  const [zoomImage, setZoomImage] = useState<{ src: string; caption: string } | null>(null);

  // Chat messages simulation
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'shop' | 'customer'; text: string; time: string }>>([
    {
      sender: 'customer',
      text: 'Chào xưởng Atelier Chronos, mình đã gửi lại vali Nanuk 935 kèm theo 2 thiết bị và thẻ nhớ lúc 14:00 tại trạm Đà Nẵng nhé.',
      time: '19/11 14:05',
    },
    {
      sender: 'shop',
      text: 'Chào bạn Elena, kỹ thuật viên lab đã tiếp nhận thùng niêm phong Nanuk 935 lúc 14:20 và đang đưa vào buồng sạch Class 1000 để đối soát quang học.',
      time: '19/11 14:22',
    },
  ]);
  const [newMessageText, setNewMessageText] = useState('');

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleSendMessage = () => {
    if (!newMessageText.trim()) return;
    const now = new Date();
    const timeStr = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`;
    setChatMessages((prev) => [
      ...prev,
      { sender: 'shop', text: newMessageText.trim(), time: timeStr },
    ]);
    setNewMessageText('');
    showToast('Đã gửi tin nhắn tới Elena Rostova');
  };

  const handleApproveEscrowRelease = () => {
    setDemoState('completed');
    setShowEscrowConfirmModal(false);
    showToast(`Đã ký duyệt biên bản nghiệm thu! Lệnh giải tỏa Escrow ${refundAmount.toLocaleString('vi-VN')} ₫ đã chuyển tới cổng VNPay Smart Vault.`);
  };

  const handleApprovePendingOrder = () => {
    setDemoState('paid');
    showToast('Đã phê duyệt hồ sơ thẩm định đơn thuê! Hệ thống đã gửi thông báo yêu cầu khách ký quỹ VNPay.');
  };

  const handleMarkReadyForShipping = () => {
    setDemoState('renting');
    showToast('Đã đóng dấu sẵn sàng bàn giao bưu tá bọc thép Nanuk! Mã vận đơn đã kích hoạt.');
  };

  return (
    <div className="w-full bg-[#fdf8f5] text-[#1c1b19] font-sans antialiased min-h-screen pb-16 no-reveal">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1c1b19] text-white px-5 py-3.5 rounded-xl shadow-2xl flex items-center gap-3 border border-stone-700 animate-fade-in max-w-md">
          <span className="material-symbols-outlined text-[#caebc9] text-[22px] shrink-0">check_circle</span>
          <span className="text-xs sm:text-sm font-medium leading-relaxed">{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-stone-400 hover:text-white ml-2 text-sm"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Utility Context & Breadcrumbs */}
      <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-6 pb-4">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <nav className="flex items-center gap-1.5 text-xs sm:text-sm text-[#4c463c]">
            <Link to="/shop/dashboard" className="hover:text-[#6c5937] transition-colors">
              Bảng điều khiển xưởng
            </Link>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <Link to="/shop/orders" className="hover:text-[#6c5937] transition-colors">
              Đơn thuê RENT
            </Link>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-[#1c1b19] font-medium font-mono">Chi tiết Sổ Lệnh {displayOrderCode}</span>
          </nav>

          {/* Quick Document & Communication Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowPrintModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#f2ede9] hover:bg-[#ece7e4] text-[#1c1b19] rounded font-medium text-xs sm:text-sm transition-colors shadow-xs cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px] text-[#6c5937]">picture_as_pdf</span>
              <span>In Phiếu Giao Nhận &amp; Biên Bản</span>
            </button>
            <button
              type="button"
              onClick={() => setShowChatModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#f2ede9] hover:bg-[#ece7e4] text-[#1c1b19] rounded font-medium text-xs sm:text-sm transition-colors shadow-xs cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px] text-[#48654b]">chat</span>
              <span>Nhắn Tin Khách</span>
            </button>
            <Link
              to="/shop/orders"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[#4c463c] hover:text-[#1c1b19] rounded font-medium text-xs sm:text-sm transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              <span>Sổ Lệnh</span>
            </Link>
          </div>
        </div>

        {/* Main Order Title Card */}
        <div className="bg-white p-6 sm:p-7 rounded-2xl shadow-xs border border-[#e6e2de] mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="px-2.5 py-1 bg-[#f2ede9] text-[11px] font-semibold uppercase tracking-wider text-[#4c463c] rounded">
                  Multi-Item Rental Order
                </span>

                {/* State Badge */}
                {demoState === 'inspecting' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#caebc9] text-[#05210c] text-[11px] font-bold uppercase tracking-wider rounded-full">
                    <span className="w-2 h-2 rounded-full bg-[#48654b] animate-pulse"></span>
                    Đang Nghiệm Thu Hoàn Trả (Inspecting)
                  </span>
                )}
                {demoState === 'pending' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-900 text-[11px] font-bold uppercase tracking-wider rounded-full">
                    <span className="w-2 h-2 rounded-full bg-amber-600"></span>
                    Chờ Xét Duyệt Thẩm Định (Pending)
                  </span>
                )}
                {demoState === 'paid' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-100 text-blue-900 text-[11px] font-bold uppercase tracking-wider rounded-full">
                    <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                    Đã Ký Quỹ Escrow • Chuẩn Bị Đóng Gói (Paid)
                  </span>
                )}
                {demoState === 'renting' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-100 text-purple-900 text-[11px] font-bold uppercase tracking-wider rounded-full">
                    <span className="w-2 h-2 rounded-full bg-purple-600 animate-pulse"></span>
                    Đang Trong Kỳ Hạn Thuê (Renting - 5 Ngày)
                  </span>
                )}
                {demoState === 'completed' && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-900 text-[11px] font-bold uppercase tracking-wider rounded-full">
                    <span className="material-symbols-outlined text-[15px] text-emerald-700">verified</span>
                    Đã Hoàn Tất &amp; Giải Phóng Cọc 100% (Completed)
                  </span>
                )}

                <span className="px-2.5 py-1 bg-[#f2ede9] text-[11px] font-semibold uppercase tracking-wider text-[#6c5937] rounded">
                  VNPay Escrow Bảo Chứng 100%
                </span>
                <span className="px-2.5 py-1 bg-[#f2ede9] text-[11px] text-[#4c463c] rounded font-mono">
                  Hợp đồng #CT-8845-VN
                </span>
              </div>

              <h1 className="font-serif text-2xl sm:text-3xl lg:text-[34px] font-semibold text-[#1c1b19] tracking-tight">
                Sổ Lệnh Lưu Ký Cho Thuê {displayOrderCode}
              </h1>
              <p className="text-xs sm:text-sm text-[#4c463c] mt-1.5 leading-relaxed">
                Chủ trì giám định: <span className="font-semibold text-[#1c1b19]">Atelier Chronos &amp; Optics</span> • Kỹ thuật viên phụ trách:{' '}
                <span className="font-medium text-[#1c1b19]">Vũ Thanh Tùng (Optics Specimen Lead)</span>
              </p>
            </div>

            <div className="flex items-center gap-4 bg-[#f7f3ef] p-4 rounded-xl border border-[#ece7e4]">
              <div className="text-right">
                <span className="text-[10px] sm:text-[11px] uppercase tracking-wider text-[#4c463c] block font-semibold">
                  Ký quỹ Escrow Khóa
                </span>
                <span className="font-serif text-xl sm:text-2xl font-bold text-[#6c5937]">
                  {originalDeposit.toLocaleString('vi-VN')} ₫
                </span>
              </div>
              <div className="w-px h-10 bg-[#e6e2de]"></div>
              <div className="text-right">
                <span className="text-[10px] sm:text-[11px] uppercase tracking-wider text-[#4c463c] block font-semibold">
                  Doanh thu Thuê (5 Ngày)
                </span>
                <span className="font-serif text-xl sm:text-2xl font-bold text-[#1c1b19]">
                  2.650.000 ₫
                </span>
              </div>
            </div>
          </div>

          {/* Interactive State Simulation Bar (Editorial UX Tool) */}
          <div className="mt-6 pt-5 border-t border-[#f2ede9]">
            <div className="flex items-center justify-between gap-2 mb-2.5">
              <span className="text-[11px] uppercase tracking-widest text-[#4c463c] font-semibold flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-[#6c5937]">tune</span>
                Mô Phỏng Giai Đoạn Vận Hành Sổ Lệnh:
              </span>
              <span className="text-[11px] text-[#6c5937] font-semibold bg-[#f7f3ef] px-2 py-0.5 rounded">
                Live State Switcher
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 text-center text-xs">
              <button
                type="button"
                onClick={() => setDemoState('pending')}
                className={`px-3 py-2.5 rounded-lg font-medium transition-all cursor-pointer ${
                  demoState === 'pending'
                    ? 'bg-[#6c5937] text-white font-semibold shadow-xs'
                    : 'bg-[#f2ede9] text-[#4c463c] hover:bg-[#ece7e4]'
                }`}
              >
                1. PENDING (Chờ duyệt)
              </button>
              <button
                type="button"
                onClick={() => setDemoState('paid')}
                className={`px-3 py-2.5 rounded-lg font-medium transition-all cursor-pointer ${
                  demoState === 'paid'
                    ? 'bg-[#6c5937] text-white font-semibold shadow-xs'
                    : 'bg-[#f2ede9] text-[#4c463c] hover:bg-[#ece7e4]'
                }`}
              >
                2. PAID (Chuẩn bị giao)
              </button>
              <button
                type="button"
                onClick={() => setDemoState('renting')}
                className={`px-3 py-2.5 rounded-lg font-medium transition-all cursor-pointer ${
                  demoState === 'renting'
                    ? 'bg-[#6c5937] text-white font-semibold shadow-xs'
                    : 'bg-[#f2ede9] text-[#4c463c] hover:bg-[#ece7e4]'
                }`}
              >
                3. RENTING (Đang thuê)
              </button>
              <button
                type="button"
                onClick={() => setDemoState('inspecting')}
                className={`px-3 py-2.5 rounded-lg font-medium transition-all cursor-pointer ${
                  demoState === 'inspecting'
                    ? 'bg-[#6c5937] text-white font-semibold shadow-xs'
                    : 'bg-[#f2ede9] text-[#4c463c] hover:bg-[#ece7e4]'
                }`}
              >
                4. INSPECTING (Nghiệm thu)
              </button>
              <button
                type="button"
                onClick={() => setDemoState('completed')}
                className={`px-3 py-2.5 rounded-lg font-medium transition-all cursor-pointer ${
                  demoState === 'completed'
                    ? 'bg-[#6c5937] text-white font-semibold shadow-xs'
                    : 'bg-[#f2ede9] text-[#4c463c] hover:bg-[#ece7e4]'
                }`}
              >
                5. COMPLETED (Hoàn tất)
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 11-Stage Circular Rental Lifecycle Timeline */}
      <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 mb-6">
        <div className="bg-white p-5 lg:p-6 rounded-2xl shadow-xs border border-[#e6e2de]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#6c5937] text-[22px]">timeline</span>
              <h2 className="font-serif text-base sm:text-lg font-semibold text-[#1c1b19] uppercase tracking-wider">
                Tiến Trình Vòng Đời Cho Thuê Tuần Hoàn (11 Giai Đoạn)
              </h2>
            </div>
            <span className="text-[11px] text-[#4c463c] uppercase tracking-wider font-mono bg-[#f7f3ef] px-2.5 py-1 rounded">
              Mã Kiểm Thẩm Chuỗi: #RH-CIRC-8845-VERIFIED
            </span>
          </div>

          {/* Horizontal Scrollable Stepper */}
          <div className="overflow-x-auto pb-3">
            <div className="min-w-[980px] grid grid-cols-11 gap-1 items-start relative pt-2">
              {/* Connecting Line Accent */}
              <div className="absolute top-6 left-5 right-5 h-0.5 bg-[#f2ede9] -z-0"></div>

              {/* Step 1 */}
              <div className="flex flex-col items-center text-center relative z-10 px-1">
                <div className="w-8 h-8 rounded-full bg-[#48654b] text-white flex items-center justify-center text-xs shadow-xs mb-1.5">
                  <span className="material-symbols-outlined text-[16px]">check</span>
                </div>
                <span className="text-[11px] font-semibold text-[#1c1b19] block leading-tight">1. Created</span>
                <span className="text-[10px] text-[#4c463c] block mt-0.5">14/11 09:15</span>
              </div>

              {/* Step 2 */}
              <div className="flex flex-col items-center text-center relative z-10 px-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs shadow-xs mb-1.5 ${
                  demoState === 'pending'
                    ? 'bg-[#6c5937] text-white ring-4 ring-[#f9dfb3]'
                    : 'bg-[#48654b] text-white'
                }`}>
                  <span className="material-symbols-outlined text-[16px]">check</span>
                </div>
                <span className="text-[11px] font-semibold text-[#1c1b19] block leading-tight">2. Approved</span>
                <span className="text-[10px] text-[#4c463c] block mt-0.5">14/11 09:30</span>
              </div>

              {/* Step 3 */}
              <div className="flex flex-col items-center text-center relative z-10 px-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs shadow-xs mb-1.5 ${
                  demoState === 'pending' ? 'bg-[#f2ede9] text-[#4c463c]' : 'bg-[#48654b] text-white'
                }`}>
                  {demoState === 'pending' ? '3' : <span className="material-symbols-outlined text-[16px]">check</span>}
                </div>
                <span className="text-[11px] font-semibold text-[#1c1b19] block leading-tight">3. Waiting Pay</span>
                <span className="text-[10px] text-[#4c463c] block mt-0.5">14/11 09:35</span>
              </div>

              {/* Step 4 */}
              <div className="flex flex-col items-center text-center relative z-10 px-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs shadow-xs mb-1.5 ${
                  demoState === 'pending'
                    ? 'bg-[#f2ede9] text-[#4c463c]'
                    : demoState === 'paid'
                    ? 'bg-[#6c5937] text-white ring-4 ring-[#f9dfb3]'
                    : 'bg-[#48654b] text-white'
                }`}>
                  {demoState === 'pending' ? '4' : <span className="material-symbols-outlined text-[16px]">check</span>}
                </div>
                <span className="text-[11px] font-semibold text-[#1c1b19] block leading-tight">4. Paid</span>
                <span className="text-[10px] text-[#4c463c] block mt-0.5">VNPay 100%</span>
              </div>

              {/* Step 5 */}
              <div className="flex flex-col items-center text-center relative z-10 px-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs shadow-xs mb-1.5 ${
                  ['pending', 'paid'].includes(demoState) ? 'bg-[#f2ede9] text-[#4c463c]' : 'bg-[#48654b] text-white'
                }`}>
                  {['pending', 'paid'].includes(demoState) ? '5' : <span className="material-symbols-outlined text-[16px]">check</span>}
                </div>
                <span className="text-[11px] font-semibold text-[#1c1b19] block leading-tight">5. Ready Pack</span>
                <span className="text-[10px] text-[#4c463c] block mt-0.5">Seal Nanuk</span>
              </div>

              {/* Step 6 */}
              <div className="flex flex-col items-center text-center relative z-10 px-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs shadow-xs mb-1.5 ${
                  ['pending', 'paid'].includes(demoState) ? 'bg-[#f2ede9] text-[#4c463c]' : 'bg-[#48654b] text-white'
                }`}>
                  {['pending', 'paid'].includes(demoState) ? '6' : <span className="material-symbols-outlined text-[16px]">check</span>}
                </div>
                <span className="text-[11px] font-semibold text-[#1c1b19] block leading-tight">6. Handed Over</span>
                <span className="text-[10px] text-[#4c463c] block mt-0.5">Bưu tá nhận</span>
              </div>

              {/* Step 7 */}
              <div className="flex flex-col items-center text-center relative z-10 px-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs shadow-xs mb-1.5 ${
                  demoState === 'renting'
                    ? 'bg-[#6c5937] text-white ring-4 ring-[#f9dfb3]'
                    : ['pending', 'paid'].includes(demoState)
                    ? 'bg-[#f2ede9] text-[#4c463c]'
                    : 'bg-[#48654b] text-white'
                }`}>
                  {['pending', 'paid'].includes(demoState) ? '7' : <span className="material-symbols-outlined text-[16px]">check</span>}
                </div>
                <span className="text-[11px] font-semibold text-[#1c1b19] block leading-tight">7. Renting</span>
                <span className="text-[10px] text-[#4c463c] block mt-0.5">5 Ngày lưu hành</span>
              </div>

              {/* Step 8 */}
              <div className="flex flex-col items-center text-center relative z-10 px-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs shadow-xs mb-1.5 ${
                  ['inspecting', 'completed'].includes(demoState) ? 'bg-[#48654b] text-white' : 'bg-[#f2ede9] text-[#4c463c]'
                }`}>
                  {['inspecting', 'completed'].includes(demoState) ? <span className="material-symbols-outlined text-[16px]">check</span> : '8'}
                </div>
                <span className="text-[11px] font-semibold text-[#1c1b19] block leading-tight">8. Return Req</span>
                <span className="text-[10px] text-[#4c463c] block mt-0.5">Khách hoàn trả</span>
              </div>

              {/* Step 9 */}
              <div className="flex flex-col items-center text-center relative z-10 px-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs shadow-xs mb-1.5 ${
                  ['inspecting', 'completed'].includes(demoState) ? 'bg-[#48654b] text-white' : 'bg-[#f2ede9] text-[#4c463c]'
                }`}>
                  {['inspecting', 'completed'].includes(demoState) ? <span className="material-symbols-outlined text-[16px]">check</span> : '9'}
                </div>
                <span className="text-[11px] font-semibold text-[#1c1b19] block leading-tight">9. Returned</span>
                <span className="text-[10px] text-[#4c463c] block mt-0.5">19/11 14:20</span>
              </div>

              {/* Step 10: INSPECTING */}
              <div className="flex flex-col items-center text-center relative z-10 px-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs shadow-md mb-1.5 ${
                  demoState === 'inspecting'
                    ? 'bg-[#6c5937] text-white ring-4 ring-[#f9dfb3]'
                    : demoState === 'completed'
                    ? 'bg-[#48654b] text-white'
                    : 'bg-[#f2ede9] text-[#4c463c]'
                }`}>
                  {demoState === 'completed' ? (
                    <span className="material-symbols-outlined text-[16px]">check</span>
                  ) : (
                    <span className="material-symbols-outlined text-[18px]">biotech</span>
                  )}
                </div>
                <span className={`text-[11px] block leading-tight ${
                  demoState === 'inspecting' ? 'font-bold text-[#6c5937]' : 'font-semibold text-[#1c1b19]'
                }`}>
                  10. Inspecting
                </span>
                <span className={`text-[10px] block mt-0.5 ${
                  demoState === 'inspecting' ? 'text-[#6c5937] font-semibold' : 'text-[#4c463c]'
                }`}>
                  {demoState === 'inspecting' ? 'ĐANG XỬ LÝ' : demoState === 'completed' ? 'Đã nghiệm thu' : 'Chờ hồi kho'}
                </span>
              </div>

              {/* Step 11: COMPLETED */}
              <div className={`flex flex-col items-center text-center relative z-10 px-1 ${
                demoState === 'completed' ? 'opacity-100' : 'opacity-60'
              }`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs mb-1.5 ${
                  demoState === 'completed'
                    ? 'bg-[#48654b] text-white shadow-md ring-4 ring-[#caebc9]'
                    : 'bg-[#f2ede9] text-[#4c463c]'
                }`}>
                  {demoState === 'completed' ? (
                    <span className="material-symbols-outlined text-[16px]">verified</span>
                  ) : (
                    <span>11</span>
                  )}
                </div>
                <span className="text-[11px] font-semibold text-[#1c1b19] block leading-tight">
                  11. Completed
                </span>
                <span className="text-[10px] text-[#4c463c] block mt-0.5">
                  {demoState === 'completed' ? 'Đã giải phóng cọc' : 'Giải phóng cọc'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Two-Column Editorial Grid Workspace */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 no-reveal">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start no-reveal">
          {/* LEFT COLUMN: Workspace Panels (8 cols) */}
          <div className="lg:col-span-8 flex flex-col gap-6 no-reveal">
            {/* SECTION A: Items in this order (Multi-item) */}
            <section className="no-reveal bg-white p-6 sm:p-7 rounded-2xl shadow-xs border border-[#e6e2de]">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                <div>
                  <span className="text-[11px] uppercase tracking-widest text-[#6c5937] font-semibold block">
                    Danh mục Hiện vật Cho thuê Gộp
                  </span>
                  <h2 className="font-serif text-xl sm:text-2xl text-[#1c1b19] font-medium">
                    Chi Tiết 02 Thiết Bị Trong Sổ Lệnh
                  </h2>
                </div>
                <div className="px-3.5 py-1.5 bg-[#f7f3ef] rounded-lg text-right border border-[#ece7e4]">
                  <span className="text-[10px] uppercase tracking-wider text-[#4c463c] block font-semibold">
                    Kỳ hạn thuê xác thực
                  </span>
                  <span className="text-xs sm:text-sm font-semibold text-[#1c1b19]">
                    14/11/2024 (10:00) → 19/11/2024 (18:00)
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                {/* Item 1: Hasselblad Kit */}
                <div className="p-4 bg-[#f7f3ef] rounded-xl flex flex-col sm:flex-row gap-4 border border-[#ece7e4]">
                  <div className="w-full sm:w-44 h-40 shrink-0 bg-white rounded-lg overflow-hidden border border-[#e6e2de]">
                    <img
                      className="w-full h-full object-cover"
                      alt="Hasselblad 907X 50C medium format camera with XCD 45mm lens"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuBoMB-sL29UI21BaPJxPDefIxAmkxz9-VQ8ubYt5OBTTqoiILqvWEMI_xhw4q5uZphbSOXbxV-WE0m5YXcQqY_bvuFifmEPl_6ipA8nSTFkO2vFRQqYrW_SKhInoiuEGw3DFpgvyJphI5EWenhdmpaQDwS6lNaO7g3bEhp3m0ezczkyU8bCQMHvCoX3ZNz1FL2xvnA6kcZLwblRpwJbLVSO-__CxdCCuWnxj8p6hHf4"
                    />
                  </div>
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] text-[#48654b] uppercase font-bold tracking-wider">
                          Hiện vật chính • Class 1000 Cleanroom
                        </span>
                        <span className="text-xs text-[#4c463c] font-mono font-semibold">SN: #HB-907-88201</span>
                      </div>
                      <h3 className="font-serif text-lg font-semibold text-[#1c1b19] mt-1">
                        Hasselblad 907X 50C + Kit Lens XCD 45mm f/4 P
                      </h3>
                      <p className="text-xs sm:text-sm text-[#4c463c] mt-1">
                        Mã kho lưu ký: <span className="font-mono text-[#1c1b19] font-medium">#INV-HB907-01</span> • Tình trạng bàn giao:{' '}
                        <span className="text-[#48654b] font-semibold">Mint- 98.0%</span>
                      </p>
                    </div>
                    <div className="pt-3 mt-3 border-t border-[#e6e2de] flex flex-wrap items-end justify-between gap-2">
                      <div>
                        <span className="text-[11px] text-[#4c463c] block">Đơn giá / ngày</span>
                        <span className="text-sm sm:text-base font-semibold text-[#1c1b19]">
                          450.000 ₫ <span className="text-xs text-[#4c463c] font-normal">× 5 ngày = 2.250.000 ₫</span>
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[11px] text-[#4c463c] block">Ký quỹ món này</span>
                        <span className="text-sm sm:text-base font-bold text-[#6c5937]">16.000.000 ₫</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Item 2: B+W Master Filter */}
                <div className="p-4 bg-[#f7f3ef] rounded-xl flex flex-col sm:flex-row gap-4 border border-[#ece7e4]">
                  <div className="w-full sm:w-44 h-36 shrink-0 bg-white rounded-lg overflow-hidden border border-[#e6e2de]">
                    <img
                      className="w-full h-full object-cover"
                      alt="High precision German B+W 77mm brass mount optical protection filter"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuB2EaTpgkgfRGCJ2szxs_OYDntdByaccWhZOSnHhH2MCvPrYpkp0xA0AIJeRcU7YVefWrHs_B5rKoezmqvOVLFO5mVLng806AC_2beNWNSA_hstKzCBEZiErNf0h1fO8rmwOP9G6FwwASrZhSZpiwRkOGDGSwxUJdgpxV21JGrhe5LWXnai2rhlDuRTjz55n3Shm0s4cuVWmfb64d9CG4Fnm6QN_-RrHNfGOi8HRqCs"
                    />
                  </div>
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] text-[#48654b] uppercase font-bold tracking-wider">
                          Phụ kiện quang học cao cấp
                        </span>
                        <span className="text-xs text-[#4c463c] font-mono font-semibold">SN: #BW-99410</span>
                      </div>
                      <h3 className="font-serif text-lg font-semibold text-[#1c1b19] mt-1">
                        B+W Master MRC Nano 77mm Protection Filter
                      </h3>
                      <p className="text-xs sm:text-sm text-[#4c463c] mt-1">
                        Mã kho lưu ký: <span className="font-mono text-[#1c1b19] font-medium">#INV-BW-CPL-77</span> • Tình trạng bàn giao:{' '}
                        <span className="text-[#48654b] font-semibold">Grade A+ (Không tì vết)</span>
                      </p>
                    </div>
                    <div className="pt-3 mt-3 border-t border-[#e6e2de] flex flex-wrap items-end justify-between gap-2">
                      <div>
                        <span className="text-[11px] text-[#4c463c] block">Đơn giá / ngày</span>
                        <span className="text-sm sm:text-base font-semibold text-[#1c1b19]">
                          50.000 ₫ <span className="text-xs text-[#4c463c] font-normal">× 5 ngày = 250.000 ₫</span>
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[11px] text-[#4c463c] block">Ký quỹ món này</span>
                        <span className="text-sm sm:text-base font-bold text-[#6c5937]">1.500.000 ₫</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Rental Summary Footer Bar */}
              <div className="mt-4 p-4 bg-[#f2ede9] rounded-xl flex flex-wrap items-center justify-between gap-4 border border-[#e6e2de]">
                <div className="flex items-center gap-2.5 text-[#4c463c]">
                  <span className="material-symbols-outlined text-[#48654b] text-[22px] shrink-0">verified</span>
                  <span className="text-xs sm:text-sm">
                    Đóng gói chuẩn va đập tiêu chuẩn quân đội <strong>Nanuk 935</strong> kèm 2 gói hút ẩm công nghiệp.
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs uppercase tracking-wider text-[#4c463c] font-semibold">Tổng cọc gộp:</span>
                  <span className="font-serif text-lg font-bold text-[#6c5937]">17.500.000 ₫</span>
                </div>
              </div>
            </section>

            {/* SECTION B: RETURN INSPECTION & FORENSIC COMPARISON */}
            <section className="no-reveal bg-white p-6 sm:p-7 rounded-2xl shadow-xs border border-[#e6e2de]">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-[#6c5937] text-[26px]">troubleshoot</span>
                  <div>
                    <span className="text-[11px] uppercase tracking-widest text-[#6c5937] font-semibold block">
                      Forensic Protocol 04-RNT
                    </span>
                    <h2 className="font-serif text-xl sm:text-2xl text-[#1c1b19] font-medium">
                      Biên Bản Giám Định &amp; Thẩm Định Hoàn Trả
                    </h2>
                  </div>
                </div>
                <span className="px-3.5 py-1 bg-[#caebc9] text-[#05210c] text-[11px] font-bold uppercase tracking-wider rounded-full">
                  Lab Nghiệm Thu Độc Lập
                </span>
              </div>

              {/* Advisory Warning Banner */}
              <div className="p-4 bg-[#f7f3ef] rounded-xl mb-6 flex items-start gap-3 border border-[#ece7e4]">
                <span className="material-symbols-outlined text-[#6c5937] text-[20px] shrink-0 mt-0.5">info</span>
                <p className="text-xs sm:text-sm text-[#4c463c] leading-relaxed">
                  <strong className="text-[#1c1b19]">Quy chuẩn xưởng ReUse Hub:</strong> Không cam kết hoàn trả 100% tiền cọc trước khi hoàn tất kiểm tra buồng máy và thấu kính quang học bằng máy chiếu vi sai. Kết quả biên bản này quyết định lệnh giải phóng tiền cọc trên hợp đồng thông minh Smart Escrow VNPay.
                </p>
              </div>

              {/* High-Res Photographic Side-by-Side Proof Grid */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-serif text-base font-semibold text-[#1c1b19]">
                    Đối Chiếu Bằng Chứng Ảnh Độ Phân Giải Cao (Macro 1:1)
                  </h3>
                  <span className="text-[11px] text-[#4c463c] font-mono">Dữ liệu lưu trữ bất biến AWS S3 WORM Vault</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Column 1: Hand-off Condition */}
                  <div className="bg-[#f7f3ef] p-4 rounded-xl flex flex-col justify-between border border-[#ece7e4]">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs sm:text-sm font-semibold text-[#1c1b19] flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-[#48654b]"></span>
                          Ảnh Bàn Giao Xuất Kho (14/11)
                        </span>
                        <span className="text-[11px] px-2.5 py-0.5 bg-white text-[#48654b] rounded font-semibold border border-[#e6e2de]">
                          Mint- 98.0%
                        </span>
                      </div>
                      <div
                        className="h-52 bg-stone-900 rounded-lg overflow-hidden relative mb-2.5 cursor-pointer group"
                        onClick={() =>
                          setZoomImage({
                            src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD7vKZ9KfK852-HdTXm7FeZR-4wUSDHQRLM0kVVcn0SL_FR0vxxCwcOYOqJY26x91XoarTACVIFQOXqxPCe1qOAGvUhGAOLE3IYd__agNBmpxphy1lr59zaNOQemvwzVYTt4SgPxH9Y9zK55yF_DEeyYqtQMENfBruN_p8JJCRNOUccb3z9fVDcYlZWkiMCAttl9oSw3VLZpOXp5kx1MhSEIK2drg5kqgb5tCoPvzHL',
                            caption: 'Cảm biến 50MP xuất kho ngày 14/11 - Độ sạch 100%, không bụi quang học',
                          })
                        }
                      >
                        <img
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          alt="Macro optical test of pristine Hasselblad 50MP CMOS sensor"
                          src="https://lh3.googleusercontent.com/aida-public/AB6AXuD7vKZ9KfK852-HdTXm7FeZR-4wUSDHQRLM0kVVcn0SL_FR0vxxCwcOYOqJY26x91XoarTACVIFQOXqxPCe1qOAGvUhGAOLE3IYd__agNBmpxphy1lr59zaNOQemvwzVYTt4SgPxH9Y9zK55yF_DEeyYqtQMENfBruN_p8JJCRNOUccb3z9fVDcYlZWkiMCAttl9oSw3VLZpOXp5kx1MhSEIK2drg5kqgb5tCoPvzHL"
                        />
                        <span className="absolute bottom-2 left-2 px-2.5 py-1 bg-stone-900/80 text-white text-[11px] rounded backdrop-blur-sm">
                          Cảm biến 50MP sạch 100%
                        </span>
                        <span className="absolute top-2 right-2 px-2 py-1 bg-black/60 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">zoom_in</span> Xem macro
                        </span>
                      </div>
                      <ul className="text-[#4c463c] text-xs space-y-1.5">
                        <li className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[#48654b] text-[16px]">check_circle</span>
                          Ngàm tiếp xúc không tì vết, chân pin thẳng
                        </li>
                        <li className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[#48654b] text-[16px]">check_circle</span>
                          Màn hình LCD dán kính lực Corning nguyên vẹn
                        </li>
                      </ul>
                    </div>
                    <div className="mt-3 pt-2 text-[10px] font-mono text-[#7e766a] border-t border-[#e6e2de]">
                      MD5: e4d909c290d0fb1ca068ffaddf22cbd0
                    </div>
                  </div>

                  {/* Column 2: Returned Condition */}
                  <div className="bg-[#f7f3ef] p-4 rounded-xl flex flex-col justify-between border border-[#ece7e4]">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs sm:text-sm font-semibold text-[#1c1b19] flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-[#6c5937]"></span>
                          Ảnh Nhận Hoàn Trả Tại Lab (19/11)
                        </span>
                        <span className="text-[11px] px-2.5 py-0.5 bg-white text-[#6c5937] rounded font-semibold border border-[#e6e2de]">
                          Mint- 97.5%
                        </span>
                      </div>
                      <div
                        className="h-52 bg-stone-900 rounded-lg overflow-hidden relative mb-2.5 cursor-pointer group"
                        onClick={() =>
                          setZoomImage({
                            src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAvHmsT3Btpf-2S7y69UYYm097ofBefIC45uZ9jecKbWGW5EwVDlcN5J6DE68Ebsfq47P3VIHznmRU5fHota-VQBSGUK1uPlmtzlANRSbyyMnXjLeI27d7k72Ny1xq_8dph5tuOinANZ0DhZNjyeN4rIKIvb6B5VeYgFS8_RIZ8QgDEdW9ctLkT1iArUO4ujVPwrBONIs-YusTcMeO65xlzJ0k7uNWlYlZewM44Yaeo',
                            caption: 'Bàn nghiệm thu lab ngày 19/11 - Tem niêm phong chì Nanuk 935 đối chiếu nguyên bản',
                          })
                        }
                      >
                        <img
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          alt="Inspection bench photo of returned Hasselblad 907X body inside opened Nanuk case"
                          src="https://lh3.googleusercontent.com/aida-public/AB6AXuAvHmsT3Btpf-2S7y69UYYm097ofBefIC45uZ9jecKbWGW5EwVDlcN5J6DE68Ebsfq47P3VIHznmRU5fHota-VQBSGUK1uPlmtzlANRSbyyMnXjLeI27d7k72Ny1xq_8dph5tuOinANZ0DhZNjyeN4rIKIvb6B5VeYgFS8_RIZ8QgDEdW9ctLkT1iArUO4ujVPwrBONIs-YusTcMeO65xlzJ0k7uNWlYlZewM44Yaeo"
                        />
                        <span className="absolute bottom-2 left-2 px-2.5 py-1 bg-stone-900/80 text-white text-[11px] rounded backdrop-blur-sm">
                          Tem niêm chì hoàn trả nguyên vẹn
                        </span>
                        <span className="absolute top-2 right-2 px-2 py-1 bg-black/60 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">zoom_in</span> Xem macro
                        </span>
                      </div>
                      <ul className="text-[#4c463c] text-xs space-y-1.5">
                        <li className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[#48654b] text-[16px]">check_circle</span>
                          Đã tháo ngàm kiểm tra: Buồng sensor đạt chuẩn
                        </li>
                        <li className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[#48654b] text-[16px]">check_circle</span>
                          Kính lọc B+W không trầy viền ren, lớp phủ sạch
                        </li>
                      </ul>
                    </div>
                    <div className="mt-3 pt-2 text-[10px] font-mono text-[#7e766a] border-t border-[#e6e2de]">
                      MD5: a91823bb084dcba91848574100ecae21
                    </div>
                  </div>
                </div>
              </div>

              {/* Forensic Assessment Form */}
              <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs uppercase tracking-wider text-[#1c1b19] font-bold block mb-1.5">
                      Kết luận nghiệm thu (Condition Result)
                    </label>
                    <select
                      value={conditionResult}
                      onChange={(e) => setConditionResult(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-[#f7f3ef] text-[#1c1b19] rounded-lg text-xs sm:text-sm border border-[#ece7e4] focus:outline-none focus:border-[#6c5937] transition-colors cursor-pointer"
                    >
                      <option value="perfect">Đạt chuẩn hoàn hảo - Đủ điều kiện giải phóng cọc 100%</option>
                      <option value="minor_wear">Hao mòn nhẹ trong hạn mức (Không tính phí khấu trừ)</option>
                      <option value="cleanroom_dust">Phát hiện trầy xước/bụi buồng máy (Khấu trừ phí vệ sinh Cleanroom 350.000 ₫)</option>
                      <option value="damage_lens">Hư hỏng thấu kính/Rơi vỡ (Yêu cầu Giám định bảo hiểm - Khấu trừ 3.000.000 ₫)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs uppercase tracking-wider text-[#1c1b19] font-bold block mb-1.5">
                      Đánh giá hao mòn &amp; Phụ kiện
                    </label>
                    <div className="flex gap-2">
                      <div className="flex-1 px-3 py-2.5 bg-[#f7f3ef] rounded-lg text-xs sm:text-sm text-[#1c1b19] flex items-center justify-between border border-[#ece7e4]">
                        <span className="text-[#4c463c] text-xs">Hư hại:</span>
                        <span className={`font-semibold ${deductionAmount > 0 ? 'text-[#ba1a1a]' : 'text-[#48654b]'}`}>
                          {deductionAmount > 0 ? `-${deductionAmount.toLocaleString('vi-VN')} ₫` : 'None (0 ₫)'}
                        </span>
                      </div>
                      <div className="flex-1 px-3 py-2.5 bg-[#f7f3ef] rounded-lg text-xs sm:text-sm text-[#1c1b19] flex items-center justify-between border border-[#ece7e4]">
                        <span className="text-[#4c463c] text-xs">Phụ kiện:</span>
                        <span className="font-semibold text-[#48654b]">Đủ 100%</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs uppercase tracking-wider text-[#1c1b19] font-bold block mb-1.5">
                    Ghi chú thẩm định chuyên sâu của Giám định viên (Inspection Note)
                  </label>
                  <textarea
                    value={inspectionNote}
                    onChange={(e) => setInspectionNote(e.target.value)}
                    rows={3}
                    className="w-full p-3.5 bg-[#f7f3ef] text-[#1c1b19] rounded-lg text-xs sm:text-sm border border-[#ece7e4] focus:outline-none focus:border-[#6c5937] transition-colors leading-relaxed"
                  />
                </div>

                {/* Escrow Settlement Calculation Box */}
                <div className="p-4 bg-[#f2ede9] rounded-xl border border-[#e6e2de]">
                  <span className="text-[11px] uppercase tracking-widest text-[#4c463c] font-semibold block mb-2">
                    Quyết toán Hoàn Trả Ký Quỹ Escrow (Live Calculation)
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center sm:text-left">
                    <div>
                      <span className="text-xs text-[#4c463c] block">Ký quỹ gốc ban đầu</span>
                      <span className="font-serif text-lg sm:text-xl text-[#1c1b19] font-semibold">
                        {originalDeposit.toLocaleString('vi-VN')} ₫
                      </span>
                    </div>
                    <div>
                      <span className="text-xs text-[#4c463c] block">Khấu trừ hao tổn / Vi phạm</span>
                      <span className={`font-serif text-lg sm:text-xl font-semibold ${
                        deductionAmount > 0 ? 'text-[#ba1a1a]' : 'text-[#48654b]'
                      }`}>
                        {deductionAmount > 0 ? `-${deductionAmount.toLocaleString('vi-VN')} ₫` : '-0 ₫'}
                      </span>
                    </div>
                    <div className="sm:text-right">
                      <span className="text-xs text-[#6c5937] uppercase font-bold block">Thực hoàn cho Khách</span>
                      <span className="font-serif text-lg sm:text-xl text-[#6c5937] font-bold">
                        {refundAmount.toLocaleString('vi-VN')} ₫{' '}
                        <span className="text-xs font-normal">
                          ({deductionAmount === 0 ? '100%' : `${Math.round((refundAmount / originalDeposit) * 100)}%`})
                        </span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons for Return Inspection */}
                <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowDisputeModal(true)}
                    className="w-full sm:w-auto px-5 py-2.5 bg-[#f2ede9] hover:bg-[#ece7e4] text-[#1c1b19] rounded-lg text-xs sm:text-sm font-semibold transition-colors cursor-pointer border border-[#e6e2de]"
                  >
                    Yêu cầu Trọng Tài / Báo Cáo Khiếu Nại
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowEscrowConfirmModal(true)}
                    className="w-full sm:w-auto px-6 py-2.5 bg-[#1c1b19] hover:bg-[#6c5937] text-white rounded-lg text-xs sm:text-sm uppercase tracking-wider font-semibold shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">verified_user</span>
                    <span>
                      {deductionAmount === 0
                        ? 'Ký Duyệt & Giải Tỏa Cọc Escrow 100%'
                        : `Ký Duyệt Hoàn Cọc (${refundAmount.toLocaleString('vi-VN')} ₫)`}
                    </span>
                  </button>
                </div>
              </form>
            </section>

            {/* SECTION C: Informative Collapsible Reference Workflows */}
            <section className="no-reveal bg-white p-6 sm:p-7 rounded-2xl shadow-xs border border-[#e6e2de]">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <span className="text-[11px] uppercase tracking-widest text-[#4c463c] font-semibold">
                    Cẩm Nang Vận Hành
                  </span>
                  <h2 className="font-serif text-xl text-[#1c1b19] font-medium">
                    Kịch Bản Xử Lý Ở Các Pha Nghiệp Vụ Khác
                  </h2>
                </div>
                <span className="material-symbols-outlined text-[#4c463c]">help_outline</span>
              </div>

              <div className="space-y-3">
                {/* Pending Mode Workflow Mockup */}
                <details className="group bg-[#f7f3ef] rounded-xl p-4 border border-[#ece7e4]" open={demoState === 'pending'}>
                  <summary className="flex items-center justify-between cursor-pointer list-none font-serif text-base text-[#1c1b19] font-semibold">
                    <span className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#6c5937] text-[20px]">assignment_turned_in</span>
                      Kịch bản Giai đoạn PENDING (Duyệt thẩm định đơn thuê)
                    </span>
                    <span className="material-symbols-outlined group-open:rotate-180 transition-transform text-[20px] text-[#4c463c]">
                      expand_more
                    </span>
                  </summary>
                  <div className="pt-3 mt-3 border-t border-[#e6e2de] text-xs sm:text-sm text-[#4c463c] space-y-3 leading-relaxed">
                    <p>
                      Khi đơn ở trạng thái PENDING, xưởng kiểm tra lịch trùng của máy ảnh và hồ sơ tín nhiệm khách. Nếu đạt, bấm duyệt để chuyển trạng thái sang <strong>WAITING_PAYMENT</strong>. Khách có 6 giờ để ký quỹ VNPay.
                    </p>
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={handleApprovePendingOrder}
                        className="px-4 py-2 bg-[#6c5937] hover:bg-[#554424] text-white rounded text-xs uppercase tracking-wider font-semibold cursor-pointer transition-colors shadow-xs"
                      >
                        Duyệt Đơn Thuê → Chuyển Chờ Thanh Toán
                      </button>
                      <button
                        type="button"
                        onClick={() => showToast('Đã từ chối đơn thuê và gửi lý do tới khách hàng.')}
                        className="px-4 py-2 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded text-xs uppercase tracking-wider font-semibold cursor-pointer transition-colors"
                      >
                        Từ chối Đơn Thuê (Nhập lý do)
                      </button>
                    </div>
                  </div>
                </details>

                {/* Shipping / Paid Mode Workflow Mockup */}
                <details className="group bg-[#f7f3ef] rounded-xl p-4 border border-[#ece7e4]" open={demoState === 'paid'}>
                  <summary className="flex items-center justify-between cursor-pointer list-none font-serif text-base text-[#1c1b19] font-semibold">
                    <span className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#48654b] text-[20px]">local_shipping</span>
                      Kịch bản Giai đoạn PAID / SHIPPING (Đóng gói niêm phong &amp; Bàn giao bưu tá)
                    </span>
                    <span className="material-symbols-outlined group-open:rotate-180 transition-transform text-[20px] text-[#4c463c]">
                      expand_more
                    </span>
                  </summary>
                  <div className="pt-3 mt-3 border-t border-[#e6e2de] text-xs sm:text-sm text-[#4c463c] space-y-3 leading-relaxed">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <span className="text-[11px] uppercase tracking-wider block text-[#4c463c] font-semibold">
                          Người nhận uỷ quyền
                        </span>
                        <span className="text-xs sm:text-sm font-semibold text-[#1c1b19] block">
                          Elena Rostova (+84 908 421 892)
                        </span>
                        <span className="text-xs block text-[#7e766a]">48 Bạch Đằng, Q. Hải Châu, Đà Nẵng</span>
                      </div>
                      <div>
                        <span className="text-[11px] uppercase tracking-wider block text-[#4c463c] font-semibold">
                          Vận chuyển Nanuk Chuyên dụng
                        </span>
                        <span className="text-xs sm:text-sm font-semibold text-[#1c1b19] font-mono block">
                          Mã Vận Đơn: #VN-883910-RNT
                        </span>
                        <span className="text-xs block text-[#48654b] font-medium">Phí hai chiều 150.000 ₫ (Đã thanh toán)</span>
                      </div>
                    </div>
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={handleMarkReadyForShipping}
                        className="px-4 py-2 bg-[#1c1b19] hover:bg-[#6c5937] text-white rounded text-xs uppercase tracking-wider font-semibold cursor-pointer transition-colors shadow-xs"
                      >
                        Đánh dấu Sẵn Sàng Bàn Giao Bưu Tá (Ready for Handover)
                      </button>
                    </div>
                  </div>
                </details>
              </div>
            </section>
          </div>

          {/* RIGHT COLUMN: Customer, Financial & Compliance Sidebar (4 cols) */}
          <aside className="no-reveal lg:col-span-4 flex flex-col gap-6">
            {/* CARD 1: Customer Profile & Trust Metric */}
            <div className="bg-white p-6 rounded-2xl shadow-xs border border-[#e6e2de]">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[11px] uppercase tracking-widest text-[#4c463c] font-semibold">
                  Người Thuê Lưu Ký
                </span>
                <span className="px-2.5 py-0.5 bg-[#caebc9] text-[#05210c] text-[11px] rounded-full font-bold">
                  Tier 2 Verified
                </span>
              </div>
              <div className="flex items-center gap-3.5 pb-4 border-b border-[#f2ede9]">
                <div className="w-14 h-14 rounded-full bg-[#f9dfb3] flex items-center justify-center text-[#261901] font-serif font-bold text-xl shrink-0">
                  ER
                </div>
                <div>
                  <h3 className="font-serif text-lg font-semibold text-[#1c1b19] leading-tight">Elena Rostova</h3>
                  <span className="text-xs text-[#4c463c] block">@elena.rostova</span>
                  <span className="text-xs text-[#48654b] font-semibold">Giám tuyển Mỹ thuật &amp; Nhiếp ảnh gia</span>
                </div>
              </div>

              {/* Trust & Reputation Telemetry */}
              <div className="py-4 border-b border-[#f2ede9] grid grid-cols-3 gap-2 text-center">
                <div className="p-2.5 bg-[#f7f3ef] rounded-lg">
                  <span className="font-serif text-lg sm:text-xl font-bold text-[#1c1b19] block">12</span>
                  <span className="text-[10px] uppercase text-[#4c463c] font-semibold">Lần thuê</span>
                </div>
                <div className="p-2.5 bg-[#f7f3ef] rounded-lg">
                  <span className="font-serif text-lg sm:text-xl font-bold text-[#48654b] block">0</span>
                  <span className="text-[10px] uppercase text-[#4c463c] font-semibold">Tranh chấp</span>
                </div>
                <div className="p-2.5 bg-[#f7f3ef] rounded-lg">
                  <span className="font-serif text-lg sm:text-xl font-bold text-[#6c5937] block">99.4%</span>
                  <span className="text-[10px] uppercase text-[#4c463c] font-semibold">Tín nhiệm</span>
                </div>
              </div>

              {/* Fulfillment Coordinates */}
              <div className="pt-4 space-y-3 text-[#4c463c] text-xs sm:text-sm">
                <div>
                  <span className="text-[11px] uppercase tracking-wider text-[#4c463c] block font-semibold">
                    Điện thoại điều phối
                  </span>
                  <span className="text-[#1c1b19] font-mono font-medium">+84 908 ••• 892 (Mã hóa bảo mật)</span>
                </div>
                <div>
                  <span className="text-[11px] uppercase tracking-wider text-[#4c463c] block font-semibold">
                    Địa chỉ giao nhận chuyên dụng
                  </span>
                  <span className="text-[#1c1b19] leading-relaxed block">
                    Tầng 4 Archive Suite, 48 Bạch Đằng, P. Hải Châu 1, Q. Hải Châu, TP. Đà Nẵng
                  </span>
                </div>
                <div className="p-3 bg-[#f7f3ef] rounded-lg text-xs text-[#4c463c] border border-[#ece7e4]">
                  <strong className="text-[#1c1b19]">Lưu ý bưu tá:</strong> Bàn giao trong giờ hành chính, bưu tá Nanuk giao tận tay có chữ ký điện tử xác nhận liveness biometric.
                </div>
              </div>

              <div className="mt-5 pt-1">
                <button
                  type="button"
                  onClick={() => setShowChatModal(true)}
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 bg-[#f2ede9] hover:bg-[#ece7e4] text-[#1c1b19] text-xs uppercase tracking-wider font-semibold rounded-lg transition-colors cursor-pointer border border-[#e6e2de]"
                >
                  <span className="material-symbols-outlined text-[18px]">chat</span>
                  <span>Nhắn Tin Trực Tiếp Với Khách</span>
                </button>
              </div>
            </div>

            {/* CARD 2: Financial Ledger & VNPay Escrow Breakdown */}
            <div className="bg-white p-6 rounded-2xl shadow-xs border border-[#e6e2de]">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <span className="text-[11px] uppercase tracking-widest text-[#6c5937] font-semibold block">
                    Sổ Kế Toán Minh Bạch
                  </span>
                  <h2 className="font-serif text-lg font-semibold text-[#1c1b19]">Thanh Toán &amp; Ký Quỹ Escrow</h2>
                </div>
                <span className="material-symbols-outlined text-[#6c5937] text-[22px]">account_balance_wallet</span>
              </div>

              {/* Escrow Status Badge */}
              <div className="p-3 bg-[#f7f3ef] rounded-xl mb-4 flex items-center justify-between border border-[#ece7e4]">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#6c5937]"></span>
                  <span className="text-xs font-bold text-[#1c1b19] uppercase">ĐÃ THANH TOÁN &amp; KHÓA KÝ QUỸ</span>
                </div>
                <span className="text-[11px] font-mono text-[#4c463c]">VNPay Smart Vault</span>
              </div>

              {/* Financial Breakdown Table */}
              <div className="space-y-2 text-xs sm:text-sm text-[#4c463c] pb-4 border-b border-[#f2ede9]">
                <div className="flex justify-between py-1">
                  <span>Hasselblad Kit (5 Ngày)</span>
                  <span className="text-[#1c1b19] font-medium">2.250.000 ₫</span>
                </div>
                <div className="flex justify-between py-1">
                  <span>Filter B+W Master (5 Ngày)</span>
                  <span className="text-[#1c1b19] font-medium">250.000 ₫</span>
                </div>
                <div className="flex justify-between py-1">
                  <span>Vận chuyển Nanuk 2 chiều</span>
                  <span className="text-[#1c1b19] font-medium">150.000 ₫</span>
                </div>
                <div className="flex justify-between py-1">
                  <span>Phí dịch vụ sàn &amp; Bảo hiểm</span>
                  <span className="text-[#48654b] font-medium">0 ₫ (Miễn phí)</span>
                </div>
                <div className="pt-2 flex justify-between font-serif text-base text-[#1c1b19] font-bold border-t border-[#f2ede9]">
                  <span>Tổng Thu Thực Tế:</span>
                  <span>2.650.000 ₫</span>
                </div>
              </div>

              {/* Escrow Vault Line Item */}
              <div className="pt-4 pb-2">
                <div className="p-4 bg-[#f2ede9] rounded-xl border border-[#e6e2de]">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] uppercase tracking-wider text-[#4c463c] font-semibold">
                      Tiền Ký Quỹ Bảo Chứng
                    </span>
                    <span className="text-[10px] font-bold text-[#6c5937] uppercase">ESCROW LOCKED</span>
                  </div>
                  <div className="font-serif text-2xl font-bold text-[#6c5937]">17.500.000 ₫</div>
                  <p className="text-[11px] text-[#4c463c] mt-1 font-mono truncate">
                    Ref ID: <span className="text-[#1c1b19]">VNP-TRX-20241114-8845-9921</span>
                  </p>
                </div>
              </div>

              {/* Immutable Ledger Notice */}
              <div className="mt-3 flex items-start gap-2 text-[#4c463c] text-xs leading-relaxed">
                <span className="material-symbols-outlined text-[16px] text-[#6c5937] shrink-0 mt-0.5">lock</span>
                <p>
                  Quy tắc bất biến: Dữ liệu thanh toán được bảo chứng tự động qua cổng VNPay &amp; Smart Contract ReUse Hub. Chủ xưởng không thể chỉnh sửa thủ công số tiền hoặc trạng thái giao dịch.
                </p>
              </div>
            </div>

            {/* CARD 3: Order Audit Log & Circular Standards */}
            <div className="bg-white p-6 rounded-2xl shadow-xs border border-[#e6e2de]">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-serif text-lg font-semibold text-[#1c1b19]">Chứng Thư &amp; Kiểm Thẩm</h3>
                <span className="text-[11px] text-[#48654b] uppercase font-bold bg-[#caebc9] px-2 py-0.5 rounded">
                  Standard v4.2
                </span>
              </div>
              <div className="space-y-3 text-xs sm:text-sm text-[#4c463c]">
                <div>
                  <span className="text-[11px] uppercase tracking-wider block font-semibold">Mã Hợp Đồng Điện Tử</span>
                  <span className="font-mono text-[#1c1b19] font-semibold">#CRCM-VN-2024-8845-E9</span>
                </div>
                <div>
                  <span className="text-[11px] uppercase tracking-wider block font-semibold">Thời Gian Khởi Tạo</span>
                  <span className="text-[#1c1b19]">14/11/2024 09:15:22 ICT</span>
                </div>
                <div>
                  <span className="text-[11px] uppercase tracking-wider block font-semibold">Chữ Ký Số Xưởng</span>
                  <span className="text-[#1c1b19] block font-semibold">Atelier Chronos &amp; Optics</span>
                  <span className="text-xs text-[#7e766a]">Accredited Horologist &amp; Optical Custodian Lab</span>
                </div>
              </div>

              {/* B-Corp Circularity Badge */}
              <div className="mt-5 p-3.5 bg-[#caebc9]/40 rounded-xl flex items-center gap-3 border border-[#caebc9]">
                <span className="material-symbols-outlined text-[#48654b] text-[26px] shrink-0">eco</span>
                <div>
                  <span className="text-xs font-bold text-[#05210c] block">B-Corp Certified Circularity</span>
                  <span className="text-[11px] text-[#4e6b50] leading-snug block">
                    Tiết kiệm 8.4kg CO₂e thông qua mô hình chia sẻ thiết bị quang học thay vì mua mới.
                  </span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* MODAL 1: In Phiếu Giao Nhận & Biên Bản Nghiệm Thu */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl relative border border-stone-200 animate-fade-in max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setShowPrintModal(false)}
              className="absolute top-5 right-5 text-stone-400 hover:text-stone-800 text-xl font-bold p-1 cursor-pointer"
            >
              ✕
            </button>

            {/* Document Header */}
            <div className="border-b-2 border-stone-900 pb-4 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs uppercase font-bold tracking-widest text-[#6c5937]">ReUse Hub • Custody Lab</span>
                <h2 className="font-serif text-2xl font-bold text-stone-900">
                  BIÊN BẢN GIAO NHẬN &amp; NGHIỆM THU HIỆN VẬT
                </h2>
                <span className="text-xs text-stone-500 font-mono">Protocol: RH-FORENSIC-04-RNT • Số lệnh: {displayOrderCode}</span>
              </div>
              <div className="text-right sm:text-right">
                <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded font-semibold text-xs uppercase tracking-wider inline-block">
                  Chứng thư số hợp lệ
                </span>
                <div className="text-xs text-stone-500 mt-1 font-mono">19/11/2024 14:20:00 ICT</div>
              </div>
            </div>

            {/* Document Details Grid */}
            <div className="grid grid-cols-2 gap-4 text-xs mb-6 bg-stone-50 p-4 rounded-xl border border-stone-200">
              <div>
                <span className="text-stone-500 uppercase block font-semibold text-[10px]">Đơn vị giám định:</span>
                <strong className="text-stone-900">Atelier Chronos &amp; Optics</strong>
                <div className="text-stone-600">Giám định viên: Vũ Thanh Tùng</div>
              </div>
              <div>
                <span className="text-stone-500 uppercase block font-semibold text-[10px]">Bên thuê lưu ký:</span>
                <strong className="text-stone-900">Elena Rostova</strong>
                <div className="text-stone-600">48 Bạch Đằng, Q. Hải Châu, Đà Nẵng</div>
              </div>
            </div>

            {/* Items Table */}
            <table className="w-full text-left text-xs mb-6 border border-stone-200">
              <thead className="bg-stone-100 text-stone-700 font-semibold border-b border-stone-200">
                <tr>
                  <th className="p-2.5">Hiện vật</th>
                  <th className="p-2.5">Serial / SKU</th>
                  <th className="p-2.5">Xuất kho</th>
                  <th className="p-2.5">Hoàn trả</th>
                  <th className="p-2.5 text-right">Khấu trừ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                <tr>
                  <td className="p-2.5 font-medium">Hasselblad 907X 50C + Lens XCD 45mm</td>
                  <td className="p-2.5 font-mono">#HB-907-88201</td>
                  <td className="p-2.5 text-emerald-700">Mint- 98.0%</td>
                  <td className="p-2.5 text-emerald-700">Mint- 97.5%</td>
                  <td className="p-2.5 text-right font-semibold">0 ₫</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-medium">B+W Master MRC Nano 77mm Protection</td>
                  <td className="p-2.5 font-mono">#BW-99410</td>
                  <td className="p-2.5 text-emerald-700">Grade A+</td>
                  <td className="p-2.5 text-emerald-700">Grade A+</td>
                  <td className="p-2.5 text-right font-semibold">0 ₫</td>
                </tr>
              </tbody>
            </table>

            {/* Notes & Signatures */}
            <div className="text-xs text-stone-600 mb-6 bg-stone-50 p-3 rounded-lg border border-stone-200">
              <strong className="text-stone-800">Kết luận:</strong> {inspectionNote}
            </div>

            <div className="grid grid-cols-2 gap-8 text-center text-xs pt-4 border-t border-stone-200">
              <div>
                <span className="font-semibold uppercase text-stone-500 block mb-12">Đại diện bên thuê</span>
                <span className="font-serif font-bold text-stone-900 block">Elena Rostova</span>
                <span className="text-[10px] text-stone-400 font-mono">Đã ký xác nhận biometric</span>
              </div>
              <div>
                <span className="font-semibold uppercase text-stone-500 block mb-12">Giám định viên trưởng</span>
                <span className="font-serif font-bold text-[#6c5937] block">Vũ Thanh Tùng</span>
                <span className="text-[10px] text-stone-400 font-mono">Chữ ký số: 0x98A...8845</span>
              </div>
            </div>

            {/* Print actions */}
            <div className="mt-8 pt-4 border-t border-stone-200 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowPrintModal(false)}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 rounded text-xs font-semibold cursor-pointer"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-5 py-2 bg-[#1c1b19] hover:bg-[#6c5937] text-white rounded text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <span className="material-symbols-outlined text-[16px]">print</span>
                In Tài Liệu (Print)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Nhắn tin trực tiếp với Elena Rostova */}
      {showChatModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl max-w-lg w-full p-5 shadow-2xl relative border border-stone-200 animate-fade-in flex flex-col h-[520px]">
            {/* Chat header */}
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#f9dfb3] text-[#261901] font-bold flex items-center justify-center font-serif">
                  ER
                </div>
                <div>
                  <h3 className="font-serif font-semibold text-sm text-[#1c1b19]">Elena Rostova</h3>
                  <span className="text-[11px] text-[#48654b] flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#48654b]"></span>
                    Trực tuyến • Khách thuê #RH-RNT-2024-8845
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowChatModal(false)}
                className="text-stone-400 hover:text-stone-700 text-lg p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Chat messages */}
            <div className="flex-1 overflow-y-auto py-3 space-y-3 text-xs">
              {chatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col ${msg.sender === 'shop' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[85%] p-3 rounded-xl leading-relaxed ${
                      msg.sender === 'shop'
                        ? 'bg-[#1c1b19] text-white rounded-br-none'
                        : 'bg-[#f2ede9] text-[#1c1b19] rounded-bl-none'
                    }`}
                  >
                    {msg.text}
                  </div>
                  <span className="text-[10px] text-stone-400 mt-1 px-1 font-mono">{msg.time}</span>
                </div>
              ))}
            </div>

            {/* Quick response chips */}
            <div className="py-2 flex items-center gap-1.5 overflow-x-auto text-[11px] border-t border-stone-100">
              <button
                type="button"
                onClick={() =>
                  setNewMessageText('Biên bản nghiệm thu cảm biến 50MP đã hoàn tất đạt chuẩn 100%. Tiền cọc đã được chuyển lệnh giải phóng!')
                }
                className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 rounded-full text-stone-700 whitespace-nowrap cursor-pointer"
              >
                ✓ Báo hoàn tất nghiệm thu 100%
              </button>
              <button
                type="button"
                onClick={() =>
                  setNewMessageText('Lab đã nhận đủ vali Nanuk và các phụ kiện, cảm ơn bạn rất nhiều!')
                }
                className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 rounded-full text-stone-700 whitespace-nowrap cursor-pointer"
              >
                ✓ Xác nhận nhận đủ phụ kiện
              </button>
            </div>

            {/* Chat input */}
            <div className="pt-2 border-t border-stone-200 flex items-center gap-2">
              <input
                type="text"
                value={newMessageText}
                onChange={(e) => setNewMessageText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Nhập tin nhắn gửi khách hàng..."
                className="flex-1 px-3.5 py-2.5 bg-stone-100 rounded-lg text-xs focus:outline-none focus:bg-white focus:border focus:border-stone-400 transition-colors"
              />
              <button
                type="button"
                onClick={handleSendMessage}
                className="px-4 py-2.5 bg-[#1c1b19] hover:bg-[#6c5937] text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors"
              >
                Gửi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Yêu cầu Trọng Tài / Báo Cáo Khiếu Nại */}
      {showDisputeModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl relative border border-stone-200 animate-fade-in">
            <button
              type="button"
              onClick={() => setShowDisputeModal(false)}
              className="absolute top-5 right-5 text-stone-400 hover:text-stone-800 text-lg cursor-pointer"
            >
              ✕
            </button>

            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-[#ba1a1a] text-[24px]">gavel</span>
              <h3 className="font-serif text-lg font-semibold text-[#1c1b19]">
                Yêu cầu Trọng Tài ReUse Hub
              </h3>
            </div>
            <p className="text-xs text-stone-600 mb-4 leading-relaxed">
              Nếu phát hiện hư hại vượt mức, tháo tráo linh kiện hoặc khách từ chối ký biên bản đối kiểm, chủ xưởng có thể yêu cầu Hội đồng Giám định Độc lập của ReUse Hub can thiệp phong tỏa khoản cọc Escrow 17.500.000 ₫.
            </p>

            <div className="space-y-3 text-xs mb-5">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Loại sự vụ tranh chấp</label>
                <select className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg">
                  <option>Hư hại cảm biến / Thấu kính quang học</option>
                  <option>Mất hoặc thiếu phụ kiện nguyên bản</option>
                  <option>Hoàn trả trễ hạn không thông báo</option>
                  <option>Nghi vấn vi phạm niêm chì / Tráo linh kiện</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Mô tả bằng chứng vi sai</label>
                <textarea
                  rows={3}
                  placeholder="Mô tả cụ thể vết xước, hình ảnh và video quay unboxing đối kiểm..."
                  className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-lg"
                />
              </div>

              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-amber-900 text-[11px] leading-relaxed">
                Sau khi gửi yêu cầu, số tiền cọc Escrow sẽ tạm hoãn giải ngân tối đa 48h để Trọng tài viên ReUse Hub thẩm tra hồ sơ hình ảnh MD5 hai chiều.
              </div>
            </div>

            <div className="flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowDisputeModal(false)}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 rounded text-xs font-semibold cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowDisputeModal(false);
                  showToast('Đã gửi yêu cầu trọng tài tới Hội đồng Giám định ReUse Hub!');
                }}
                className="px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white rounded text-xs font-semibold uppercase tracking-wider cursor-pointer shadow-xs"
              >
                Gửi Hồ Sơ Khiếu Nại
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Ký Duyệt & Giải Tỏa Cọc Escrow 100% Confirmation */}
      {showEscrowConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative border border-stone-200 animate-fade-in">
            <button
              type="button"
              onClick={() => setShowEscrowConfirmModal(false)}
              className="absolute top-5 right-5 text-stone-400 hover:text-stone-800 text-lg cursor-pointer"
            >
              ✕
            </button>

            <div className="text-center mb-4">
              <div className="w-14 h-14 rounded-full bg-[#caebc9] text-[#05210c] flex items-center justify-center mx-auto mb-3">
                <span className="material-symbols-outlined text-[30px]">verified_user</span>
              </div>
              <h3 className="font-serif text-xl font-bold text-stone-900">
                Xác Nhận Ký Duyệt &amp; Giải Tỏa Escrow
              </h3>
              <p className="text-xs text-stone-500 mt-1">
                Lệnh giải phóng tự động qua Smart Escrow VNPay
              </p>
            </div>

            <div className="bg-[#f7f3ef] p-4 rounded-xl space-y-2 text-xs mb-5 border border-[#ece7e4]">
              <div className="flex justify-between">
                <span className="text-[#4c463c]">Mã sổ lệnh:</span>
                <span className="font-mono font-bold text-stone-900">{displayOrderCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#4c463c]">Khách hàng nhận hoàn:</span>
                <span className="font-semibold text-stone-900">Elena Rostova</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#4c463c]">Số tiền cọc ban đầu:</span>
                <span className="font-semibold text-stone-900">{originalDeposit.toLocaleString('vi-VN')} ₫</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#4c463c]">Khấu trừ:</span>
                <span className="font-semibold text-emerald-700">
                  {deductionAmount > 0 ? `-${deductionAmount.toLocaleString('vi-VN')} ₫` : '0 ₫'}
                </span>
              </div>
              <div className="pt-2 border-t border-[#e6e2de] flex justify-between text-sm font-bold text-[#6c5937]">
                <span>Thực hoàn tài khoản khách:</span>
                <span>{refundAmount.toLocaleString('vi-VN')} ₫</span>
              </div>
            </div>

            <p className="text-[11px] text-stone-500 mb-5 leading-relaxed text-center">
              Bằng việc xác nhận, bạn đóng dấu chữ ký số của <strong>Atelier Chronos &amp; Optics</strong> vào sổ cái bất biến. Khoản tiền cọc sẽ hoàn trả tức thì về tài khoản VNPay của khách hàng.
            </p>

            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => setShowEscrowConfirmModal(false)}
                className="flex-1 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
              >
                Kiểm tra lại
              </button>
              <button
                type="button"
                onClick={handleApproveEscrowRelease}
                className="flex-1 py-2.5 bg-[#1c1b19] hover:bg-[#6c5937] text-white rounded-lg text-xs uppercase tracking-wider font-semibold cursor-pointer transition-colors shadow-md flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">lock_open</span>
                <span>Ký Duyệt Ngay</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: Macro Image Lightbox Zoom */}
      {zoomImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setZoomImage(null)}
        >
          <div
            className="max-w-4xl w-full bg-stone-950 rounded-2xl overflow-hidden p-2 text-white relative border border-stone-800"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setZoomImage(null)}
              className="absolute top-4 right-4 bg-black/70 hover:bg-black text-white w-9 h-9 rounded-full flex items-center justify-center text-lg z-10 cursor-pointer"
            >
              ✕
            </button>
            <div className="max-h-[75vh] overflow-hidden flex items-center justify-center bg-black rounded-xl">
              <img src={zoomImage.src} alt={zoomImage.caption} className="max-w-full max-h-[75vh] object-contain" />
            </div>
            <div className="p-3 text-center text-xs text-stone-300 font-mono">
              {zoomImage.caption}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShopRentOrderDetail;
