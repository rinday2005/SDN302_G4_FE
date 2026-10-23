import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';

interface TransactionItem {
  id: string;
  orderNumber: string;
  itemName: string;
  type: 'RENT' | 'THRIFT';
  category: 'rent' | 'thrift' | 'refund';
  customerName: string;
  customerInitials: string;
  status: string;
  statusType: 'escrow' | 'payout' | 'processing' | 'penalty' | 'refund';
  amount: string;
  amountDetail?: string;
  isPositive: boolean;
  timestamp: string;
  detailUrl: string;
}

const INITIAL_TRANSACTIONS: TransactionItem[] = [
  {
    id: 'tx-1',
    orderNumber: '#RH-THF-2024-9108',
    itemName: 'Hasselblad 907X 50C + Lens XCD 45mm',
    type: 'THRIFT',
    category: 'thrift',
    customerName: 'Elena Rostova',
    customerInitials: 'ER',
    status: 'Đang khóa Escrow 72h',
    statusType: 'escrow',
    amount: '+119.046.000 ₫',
    isPositive: true,
    timestamp: '20/11/2024 14:32',
    detailUrl: '/shop/thrift/orders/RH-THF-2024-9108',
  },
  {
    id: 'tx-2',
    orderNumber: '#RH-RNT-2024-8845',
    itemName: 'Leica Summicron-M 35mm f/2 ASPH',
    type: 'RENT',
    category: 'rent',
    customerName: 'Elena Rostova',
    customerInitials: 'ER',
    status: 'Đã giải ngân về ví xưởng',
    statusType: 'payout',
    amount: '+8.450.000 ₫',
    amountDetail: 'Cọc 125M đã hoàn trả 100%',
    isPositive: true,
    timestamp: '19/11/2024 16:40',
    detailUrl: '/shop/rent/orders/8845',
  },
  {
    id: 'tx-3',
    orderNumber: '#RH-THF-2024-9104',
    itemName: 'Leica M6 Classic 0.72x Black Chrome',
    type: 'THRIFT',
    category: 'thrift',
    customerName: 'Hoàng Nhật Minh',
    customerInitials: 'HM',
    status: 'Đang đóng gói (Escrow khóa)',
    statusType: 'processing',
    amount: '+67.850.000 ₫',
    isPositive: true,
    timestamp: '19/11/2024 10:15',
    detailUrl: '/shop/thrift/orders/9104',
  },
  {
    id: 'tx-4',
    orderNumber: '#RH-RNT-2024-8841',
    itemName: 'Canon EOS R6 Mark II + 24-70mm f/2.8',
    type: 'RENT',
    category: 'refund',
    customerName: 'Đào Minh Quân',
    customerInitials: 'ĐQ',
    status: 'Khấu trừ vi phạm trễ hạn',
    statusType: 'penalty',
    amount: '+3.500.000 ₫',
    isPositive: true,
    timestamp: '18/11/2024 11:20',
    detailUrl: '/shop/rent/orders/8841',
  },
  {
    id: 'tx-5',
    orderNumber: '#RH-THF-2024-9080',
    itemName: 'Contax T2 Titanium Champagne Edition',
    type: 'THRIFT',
    category: 'thrift',
    customerName: 'Trần Đức Nam',
    customerInitials: 'TN',
    status: 'Đã giải ngân (Nghiệm thu đạt)',
    statusType: 'payout',
    amount: '+33.296.000 ₫',
    isPositive: true,
    timestamp: '17/11/2024 14:00',
    detailUrl: '/shop/thrift/orders/9080',
  },
  {
    id: 'tx-6',
    orderNumber: '#RH-RNT-2024-8835',
    itemName: 'Hasselblad 907X 50C Kit Body Only',
    type: 'RENT',
    category: 'refund',
    customerName: 'Lê Phương Anh',
    customerInitials: 'LA',
    status: 'Hoàn trả cọc an toàn (Full Refund)',
    statusType: 'refund',
    amount: 'Thuê: +3.200.000 ₫',
    amountDetail: 'Cọc: -25.000.000 ₫',
    isPositive: false,
    timestamp: '15/11/2024 09:30',
    detailUrl: '/shop/rent/orders/8835',
  },
];

type TimelineFilter = 'today' | '7days' | '30days' | 'this_month' | 'custom';
type LedgerFilter = 'all' | 'rent' | 'thrift' | 'refund';

export const RevenueDashboard: React.FC = () => {
  // Timeline state
  const [timeline, setTimeline] = useState<TimelineFilter>('30days');
  const [ledgerFilter, setLedgerFilter] = useState<LedgerFilter>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Modals & Feedback
  const [showReconcileModal, setShowReconcileModal] = useState<boolean>(false);
  const [showCustomDateModal, setShowCustomDateModal] = useState<boolean>(false);
  const [customStartDate, setCustomStartDate] = useState('2024-11-01');
  const [customEndDate, setCustomEndDate] = useState('2024-11-20');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    if (ledgerFilter === 'all') return INITIAL_TRANSACTIONS;
    if (ledgerFilter === 'rent') return INITIAL_TRANSACTIONS.filter((t) => t.category === 'rent');
    if (ledgerFilter === 'thrift') return INITIAL_TRANSACTIONS.filter((t) => t.category === 'thrift');
    if (ledgerFilter === 'refund') return INITIAL_TRANSACTIONS.filter((t) => t.category === 'refund');
    return INITIAL_TRANSACTIONS;
  }, [ledgerFilter]);

  // Export CSV Handler
  const handleExportCSV = () => {
    const headers = [
      'Mã Đơn',
      'Hiện Vật',
      'Phân Loại',
      'Khách Hàng',
      'Trạng Thái',
      'Số Tiền Hạch Toán',
      'Thời Gian',
    ];
    const rows = filteredTransactions.map((tx) => [
      tx.orderNumber,
      `"${tx.itemName}"`,
      tx.type,
      `"${tx.customerName}"`,
      `"${tx.status}"`,
      `"${tx.amount}"`,
      tx.timestamp,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `So_Quyet_Toan_Doanh_Thu_Atelier_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    triggerToast('Đã xuất sổ kế toán đối soát (CSV) thành công!');
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

      {/* Top Command & Breadcrumb Strip */}
      <div className="w-full px-margin-mobile md:px-margin pt-6 pb-6 max-w-[1440px] mx-auto">
        {/* Breadcrumb Hierarchy */}
        <div className="flex flex-wrap items-center gap-2 text-on-surface-variant font-label-md text-label-md mb-2">
          <Link to="/shop/dashboard" className="hover:text-primary transition-colors flex items-center gap-1">
            <span className="material-symbols-outlined text-[15px]">warehouse</span>
            <span>Bảng điều khiển xưởng</span>
          </Link>
          <span className="text-outline-variant">/</span>
          <span className="text-on-surface-variant">Tài chính &amp; Ký quỹ</span>
          <span className="text-outline-variant">/</span>
          <span className="text-on-surface font-semibold">Báo cáo Doanh thu Xưởng</span>
        </div>

        {/* Main Title & Operational Custody Tag */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-secondary-container text-on-secondary-container font-label-sm text-label-sm font-semibold tracking-wider mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
              <span>ATELIER CHRONOS &amp; OPTICS • NODE #SGN-01 • SMART-ESCROW VNP-LOCK ACTIVE</span>
            </div>
            <h1 className="font-serif text-3xl md:text-4xl font-semibold text-on-surface tracking-tight">
              Sổ Quyết Toán &amp; Doanh Thu Xưởng
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl mt-1 leading-relaxed">
              Hạch toán dòng tiền độc lập cho đơn vị lưu ký Atelier Chronos &amp; Optics (#OWNER-01 - Vũ Thanh
              Tùng). Đối soát đối ứng bảo chứng Escrow và doanh thu thực nhận sau kiểm định.
            </p>
          </div>

          {/* Quick Ledger Controls */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowReconcileModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-surface-container rounded text-on-surface hover:bg-surface-container-high transition-colors font-label-md text-label-md font-medium shadow-sm border border-surface-dim cursor-pointer"
            >
              <span className="material-symbols-outlined text-primary text-[18px]">verified</span>
              <span>Đối soát tức thời VNPay</span>
            </button>
            <button
              type="button"
              onClick={handleExportCSV}
              className="inline-flex items-center gap-2 px-4 py-2 bg-on-surface text-surface rounded text-on-primary font-label-md text-label-md font-medium hover:bg-primary transition-colors shadow-sm cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">download</span>
              <span>Xuất Sổ Kế Toán (CSV/Excel)</span>
            </button>
          </div>
        </div>

        {/* Timeline Window Filter Bar */}
        <div className="mt-6 p-2 bg-surface-container-low rounded-xl flex flex-col md:flex-row items-center justify-between gap-3 shadow-sm border border-surface-dim">
          <div className="flex items-center gap-1 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
            <button
              type="button"
              onClick={() => setTimeline('today')}
              className={`px-4 py-1.5 rounded font-label-md text-label-md transition-colors whitespace-nowrap cursor-pointer ${
                timeline === 'today'
                  ? 'bg-surface text-on-surface font-semibold shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-surface'
              }`}
            >
              Hôm nay
            </button>
            <button
              type="button"
              onClick={() => setTimeline('7days')}
              className={`px-4 py-1.5 rounded font-label-md text-label-md transition-colors whitespace-nowrap cursor-pointer ${
                timeline === '7days'
                  ? 'bg-surface text-on-surface font-semibold shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-surface'
              }`}
            >
              7 ngày qua
            </button>
            <button
              type="button"
              onClick={() => setTimeline('30days')}
              className={`px-4 py-1.5 rounded font-label-md text-label-md transition-colors whitespace-nowrap cursor-pointer ${
                timeline === '30days'
                  ? 'bg-surface text-on-surface font-semibold shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-surface'
              }`}
            >
              30 ngày qua
            </button>
            <button
              type="button"
              onClick={() => setTimeline('this_month')}
              className={`px-4 py-1.5 rounded font-label-md text-label-md transition-colors whitespace-nowrap cursor-pointer ${
                timeline === 'this_month'
                  ? 'bg-surface text-on-surface font-semibold shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-surface'
              }`}
            >
              Tháng này (T11/2024)
            </button>
            <button
              type="button"
              onClick={() => setShowCustomDateModal(true)}
              className={`px-4 py-1.5 rounded font-label-md text-label-md transition-colors whitespace-nowrap cursor-pointer ${
                timeline === 'custom'
                  ? 'bg-surface text-on-surface font-semibold shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-surface'
              }`}
            >
              Tùy chỉnh khoảng ngày
            </button>
          </div>
          <div className="flex items-center gap-2 font-label-sm text-label-sm text-on-surface-variant self-end md:self-center pr-2 font-mono">
            <span className="material-symbols-outlined text-[16px] text-secondary">sync</span>
            <span>Đồng bộ thực: 20/11/2024 16:45:12 GMT+7</span>
          </div>
        </div>
      </div>

      {/* Row 1: Primary 5-Stat Editorial Bento Grid */}
      <div className="w-full px-margin-mobile md:px-margin pb-8 max-w-[1440px] mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Metric 1: Net Revenue */}
          <div className="bg-surface-container-low p-5 rounded-xl flex flex-col justify-between shadow-sm relative overflow-hidden border border-surface-dim">
            <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-primary/5 rounded-full blur-xl pointer-events-none"></div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">
                  Tổng Doanh Thu Thực Nhận
                </span>
                <span className="material-symbols-outlined text-primary text-[20px]">
                  account_balance_wallet
                </span>
              </div>
              <div className="font-serif text-2xl font-bold text-on-surface tracking-tight font-mono leading-tight">
                284.650.000 ₫
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between text-secondary font-label-sm text-label-sm font-medium">
              <span className="inline-flex items-center gap-0.5">
                <span className="material-symbols-outlined text-[14px]">arrow_upward</span>
                +14.2% so với kỳ trước
              </span>
              <span className="text-on-surface-variant font-mono">NET PAYOUT</span>
            </div>
          </div>

          {/* Metric 2: RENT Revenue */}
          <div className="bg-surface-container-low p-5 rounded-xl flex flex-col justify-between shadow-sm border border-surface-dim">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">
                  Doanh Thu RENT (Cho Thuê)
                </span>
                <span className="material-symbols-outlined text-secondary text-[20px]">event_repeat</span>
              </div>
              <div className="font-serif text-2xl font-bold text-on-surface tracking-tight font-mono leading-tight">
                142.800.000 ₫
              </div>
            </div>
            <div className="mt-4">
              <div className="w-full bg-surface-variant h-1.5 rounded-full overflow-hidden mb-1.5">
                <div className="bg-secondary h-full rounded-full" style={{ width: '50.2%' }}></div>
              </div>
              <div className="flex items-center justify-between font-label-sm text-label-sm text-on-surface-variant">
                <span>Tỷ trọng doanh thu</span>
                <span className="font-semibold text-on-surface font-mono">50.2%</span>
              </div>
            </div>
          </div>

          {/* Metric 3: THRIFT Revenue */}
          <div className="bg-surface-container-low p-5 rounded-xl flex flex-col justify-between shadow-sm border border-surface-dim">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">
                  Doanh Thu THRIFT (Bán Đứt)
                </span>
                <span className="material-symbols-outlined text-tertiary text-[20px]">inventory_2</span>
              </div>
              <div className="font-serif text-2xl font-bold text-on-surface tracking-tight font-mono leading-tight">
                148.200.000 ₫
              </div>
            </div>
            <div className="mt-4">
              <div className="w-full bg-surface-variant h-1.5 rounded-full overflow-hidden mb-1.5">
                <div className="bg-tertiary h-full rounded-full" style={{ width: '49.8%' }}></div>
              </div>
              <div className="flex items-center justify-between font-label-sm text-label-sm text-on-surface-variant">
                <span>Tỷ trọng doanh thu</span>
                <span className="font-semibold text-on-surface font-mono">49.8%</span>
              </div>
            </div>
          </div>

          {/* Metric 4: Refunds */}
          <div className="bg-surface-container-low p-5 rounded-xl flex flex-col justify-between shadow-sm border border-surface-dim">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">
                  Hoàn Trả Khách Hàng
                </span>
                <span className="material-symbols-outlined text-error text-[20px]">assignment_return</span>
              </div>
              <div className="font-serif text-2xl font-bold text-error tracking-tight font-mono leading-tight">
                -4.850.000 ₫
              </div>
            </div>
            <div className="mt-4 font-label-sm text-label-sm text-on-surface-variant leading-snug">
              Gồm hoàn cọc dôi dư &amp; thỏa thuận điều chỉnh thấu kính.
            </div>
          </div>

          {/* Metric 5: Penalties / Damages */}
          <div className="bg-surface-container-low p-5 rounded-xl flex flex-col justify-between shadow-sm border border-surface-dim">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">
                  Phạt / Đền Bù Hỏng Hóc
                </span>
                <span className="material-symbols-outlined text-primary text-[20px]">gavel</span>
              </div>
              <div className="font-serif text-2xl font-bold text-primary tracking-tight font-mono leading-tight">
                +3.500.000 ₫
              </div>
            </div>
            <div className="mt-4 font-label-sm text-label-sm text-on-surface-variant leading-snug">
              Khấu trừ từ cọc theo biên bản giám định buồng máy trầy xước.
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Detailed Breakdown By Circular Sectors (Split Dual Panels) */}
      <div className="w-full px-margin-mobile md:px-margin pb-8 max-w-[1440px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Panel 1: Dịch vụ RENT (Cho Thuê Quang Học & Máy Ảnh) */}
          <div className="bg-surface-container-low rounded-xl p-6 flex flex-col justify-between shadow-sm border border-surface-dim">
            <div>
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-surface-dim">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center text-secondary">
                    <span className="material-symbols-outlined text-[24px]">cameraswitch</span>
                  </div>
                  <div>
                    <span className="font-label-sm text-label-sm uppercase tracking-widest text-secondary font-semibold">
                      DÒNG TIỀN QUY TRÌNH RENT
                    </span>
                    <h3 className="font-serif text-xl font-semibold text-on-surface">
                      Cho Thuê Thiết Bị Quang Học
                    </h3>
                  </div>
                </div>
                <span className="font-label-md text-label-md px-2.5 py-1 bg-surface-container rounded font-medium text-on-surface">
                  38 Hợp đồng
                </span>
              </div>

              {/* Analytical Breakdown Rows */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between p-3.5 bg-surface rounded-lg">
                  <div className="flex flex-col">
                    <span className="font-title-md text-title-md text-on-surface font-medium">
                      Tiền phí thuê thực tế (Rental Fees)
                    </span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">
                      Doanh số hạch toán sau khi hoàn tất phiên kiểm kê hoàn máy
                    </span>
                  </div>
                  <span className="font-serif text-lg text-on-surface font-semibold font-mono">
                    142.800.000 ₫
                  </span>
                </div>

                <div className="flex items-center justify-between p-3.5 bg-surface rounded-lg">
                  <div className="flex flex-col">
                    <span className="font-title-md text-title-md text-on-surface font-medium">
                      Cọc đã hoàn trả đúng hạn (Deposits Refunded)
                    </span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">
                      Tỷ lệ hoàn trả 100% nguyên vẹn đạt 97.4% tổng lượng xuất kho
                    </span>
                  </div>
                  <span className="font-serif text-lg text-secondary font-semibold font-mono">
                    485.000.000 ₫
                  </span>
                </div>

                <div className="flex items-center justify-between p-3.5 bg-surface rounded-lg">
                  <div className="flex flex-col">
                    <span className="font-title-md text-title-md text-on-surface font-medium">
                      Phạt bồi thường hao mòn / Trễ hạn
                    </span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">
                      Khấu trừ thẩm định theo Quy chuẩn Phục hồi 01 trường hợp
                    </span>
                  </div>
                  <span className="font-serif text-lg text-primary font-semibold font-mono">
                    +3.500.000 ₫
                  </span>
                </div>

                <div className="flex items-center justify-between p-3.5 bg-surface-container rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-secondary text-[20px]">lock_clock</span>
                    <div className="flex flex-col">
                      <span className="font-label-md text-label-md font-semibold text-on-surface">
                        Quỹ cọc đang giữ tại Smart Escrow
                      </span>
                      <span className="font-label-sm text-label-sm text-on-surface-variant">
                        Bảo chứng đang lưu hành trên các hợp đồng thuê diễn ra
                      </span>
                    </div>
                  </div>
                  <span className="font-serif text-lg text-on-surface font-mono font-medium">
                    115.000.000 ₫
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-3 flex items-center justify-between border-t border-surface-dim">
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-mono">
                B-CORP CIRCULAR AUDIT: LEVEL-A
              </span>
              <Link
                to="/shop/orders"
                className="font-label-md text-label-md font-semibold text-primary hover:text-on-surface transition-colors flex items-center gap-1"
              >
                <span>Xem Sổ Lệnh Đơn Thuê RENT</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </Link>
            </div>
          </div>

          {/* Panel 2: Thương mại THRIFT (Bán Đứt Second-Life & Ký Gửi) */}
          <div className="bg-surface-container-low rounded-xl p-6 flex flex-col justify-between shadow-sm border border-surface-dim">
            <div>
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-surface-dim">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-tertiary/10 flex items-center justify-center text-tertiary">
                    <span className="material-symbols-outlined text-[24px]">history_edu</span>
                  </div>
                  <div>
                    <span className="font-label-sm text-label-sm uppercase tracking-widest text-tertiary font-semibold">
                      DÒNG TIỀN QUY TRÌNH THRIFT
                    </span>
                    <h3 className="font-serif text-xl font-semibold text-on-surface">
                      Bán Đứt Hiện Vật Second Life
                    </h3>
                  </div>
                </div>
                <span className="font-label-md text-label-md px-2.5 py-1 bg-surface-container rounded font-medium text-on-surface">
                  06 Hiện vật
                </span>
              </div>

              {/* Analytical Breakdown Rows */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between p-3.5 bg-surface rounded-lg">
                  <div className="flex flex-col">
                    <span className="font-title-md text-title-md text-on-surface font-medium">
                      Doanh số bán đứt gộp (Sales Volume)
                    </span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">
                      Tổng giá trị giao dịch thành công 06 đơn hàng lưu ký
                    </span>
                  </div>
                  <span className="font-serif text-lg text-on-surface font-semibold font-mono">
                    154.500.000 ₫
                  </span>
                </div>

                <div className="flex items-center justify-between p-3.5 bg-surface rounded-lg">
                  <div className="flex flex-col">
                    <span className="font-title-md text-title-md text-on-surface font-medium">
                      Hoàn trả người mua do căn chỉnh quang học
                    </span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">
                      Thương lượng giảm trừ sau kiểm tra đo nét độc lập
                    </span>
                  </div>
                  <span className="font-serif text-lg text-error font-semibold font-mono">
                    -1.500.000 ₫
                  </span>
                </div>

                <div className="flex items-center justify-between p-3.5 bg-surface rounded-lg">
                  <div className="flex flex-col">
                    <span className="font-title-md text-title-md text-on-surface font-medium">
                      Phí dịch vụ ReUse Hub &amp; Giám định B-Corp
                    </span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">
                      Khấu trừ vận hành 3.5% bao gồm bảo hiểm vận chuyển niêm phong
                    </span>
                  </div>
                  <span className="font-serif text-lg text-on-surface-variant font-semibold font-mono">
                    -4.800.000 ₫
                  </span>
                </div>

                <div className="flex items-center justify-between p-3.5 bg-surface-container rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-tertiary text-[20px]">hourglass_top</span>
                    <div className="flex flex-col">
                      <span className="font-label-md text-label-md font-semibold text-on-surface">
                        Đang khóa 72h nghiệm thu quang học
                      </span>
                      <span className="font-label-sm text-label-sm text-on-surface-variant">
                        Tự động giải ngân sau khi người mua kết thúc hạn kiểm thử
                      </span>
                    </div>
                  </div>
                  <span className="font-serif text-lg text-on-surface font-mono font-medium">
                    119.046.000 ₫
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-3 flex items-center justify-between border-t border-surface-dim">
              <div className="flex items-center gap-1 font-label-md text-label-md font-semibold text-on-surface">
                <span className="text-on-surface-variant font-normal">Thực nhận ròng THRIFT:</span>
                <span className="font-mono font-bold text-secondary">148.200.000 ₫</span>
              </div>
              <Link
                to="/shop/thrift/orders"
                className="font-label-md text-label-md font-semibold text-primary hover:text-on-surface transition-colors flex items-center gap-1"
              >
                <span>Xem Sổ Lệnh Đơn Bán THRIFT</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Recent Transactions Ledger Table with Interactive Tabs */}
      <div className="w-full px-margin-mobile md:px-margin pb-8 max-w-[1440px] mx-auto">
        <div className="bg-surface-container-low rounded-xl p-6 shadow-sm border border-surface-dim">
          {/* Table Header & Filter Tabs */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4">
            <div>
              <span className="font-label-sm text-label-sm uppercase tracking-widest text-primary font-semibold">
                SỔ QUYẾT TOÁN THỜI GIAN THỰC
              </span>
              <h2 className="font-serif text-2xl font-semibold text-on-surface">
                Lịch Sử Dòng Tiền &amp; Giao Dịch Xưởng
              </h2>
            </div>

            {/* Ledger Filter Tabs */}
            <div className="flex items-center gap-1 bg-surface-container p-1 rounded-lg overflow-x-auto">
              <button
                type="button"
                onClick={() => setLedgerFilter('all')}
                className={`px-4 py-1.5 rounded font-label-md text-label-md transition-all whitespace-nowrap cursor-pointer ${
                  ledgerFilter === 'all'
                    ? 'bg-surface text-on-surface font-semibold shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface font-medium'
                }`}
              >
                Tất cả giao dịch
              </button>
              <button
                type="button"
                onClick={() => setLedgerFilter('rent')}
                className={`px-4 py-1.5 rounded font-label-md text-label-md transition-all whitespace-nowrap cursor-pointer ${
                  ledgerFilter === 'rent'
                    ? 'bg-surface text-on-surface font-semibold shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface font-medium'
                }`}
              >
                Dòng tiền RENT
              </button>
              <button
                type="button"
                onClick={() => setLedgerFilter('thrift')}
                className={`px-4 py-1.5 rounded font-label-md text-label-md transition-all whitespace-nowrap cursor-pointer ${
                  ledgerFilter === 'thrift'
                    ? 'bg-surface text-on-surface font-semibold shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface font-medium'
                }`}
              >
                Dòng tiền THRIFT
              </button>
              <button
                type="button"
                onClick={() => setLedgerFilter('refund')}
                className={`px-4 py-1.5 rounded font-label-md text-label-md transition-all whitespace-nowrap cursor-pointer ${
                  ledgerFilter === 'refund'
                    ? 'bg-surface text-on-surface font-semibold shadow-sm'
                    : 'text-on-surface-variant hover:text-on-surface font-medium'
                }`}
              >
                Hoàn tiền &amp; Phạt
              </button>
            </div>
          </div>

          {/* Ledger Table */}
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-surface-container text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider">
                  <th className="py-3 px-4 rounded-l">Mã Đơn &amp; Hiện Vật</th>
                  <th className="py-3 px-4">Phân Loại</th>
                  <th className="py-3 px-4">Khách Hàng</th>
                  <th className="py-3 px-4">Trạng Thái Giải Ngân</th>
                  <th className="py-3 px-4 text-right">Số Tiền Hạch Toán</th>
                  <th className="py-3 px-4">Thời Gian</th>
                  <th className="py-3 px-4 text-right rounded-r">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-dim/40 text-on-surface font-body-md text-body-md">
                {filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-surface-container/60 transition-colors">
                    <td className="py-4 px-4">
                      <div className="flex flex-col">
                        <span className="font-mono font-semibold text-on-surface">{tx.orderNumber}</span>
                        <span className="font-label-sm text-label-sm text-on-surface-variant truncate max-w-xs">
                          {tx.itemName}
                        </span>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded font-label-sm text-label-sm font-semibold uppercase ${
                          tx.type === 'RENT'
                            ? 'text-secondary bg-secondary/10'
                            : 'text-tertiary bg-tertiary/10'
                        }`}
                      >
                        {tx.type}
                      </span>
                    </td>

                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-surface-variant flex items-center justify-center font-label-sm text-label-sm font-bold text-on-surface">
                          {tx.customerInitials}
                        </span>
                        <span>{tx.customerName}</span>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-1 rounded font-label-sm text-label-sm font-medium ${
                          tx.statusType === 'escrow'
                            ? 'bg-surface-container text-on-surface'
                            : tx.statusType === 'payout'
                            ? 'bg-secondary-container text-on-secondary-container'
                            : tx.statusType === 'penalty'
                            ? 'bg-error-container text-on-error-container'
                            : tx.statusType === 'processing'
                            ? 'bg-surface-container text-on-surface'
                            : 'bg-surface-container text-on-surface'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            tx.statusType === 'escrow'
                              ? 'bg-tertiary'
                              : tx.statusType === 'payout'
                              ? 'bg-secondary'
                              : tx.statusType === 'penalty'
                              ? 'bg-error'
                              : 'bg-primary'
                          }`}
                        ></span>
                        {tx.status}
                      </span>
                    </td>

                    <td className="py-4 px-4 text-right">
                      <div
                        className={`font-mono font-semibold ${
                          tx.isPositive ? 'text-secondary' : 'text-on-surface'
                        }`}
                      >
                        {tx.amount}
                      </div>
                      {tx.amountDetail && (
                        <div className="font-label-sm text-label-sm text-on-surface-variant font-mono">
                          {tx.amountDetail}
                        </div>
                      )}
                    </td>

                    <td className="py-4 px-4 text-on-surface-variant font-label-md text-label-md font-mono">
                      {tx.timestamp}
                    </td>

                    <td className="py-4 px-4 text-right">
                      <Link
                        to={tx.detailUrl}
                        className="inline-flex items-center gap-1 font-label-md text-label-md text-primary hover:text-on-surface font-medium transition-colors"
                      >
                        <span>Chi tiết</span>
                        <span className="material-symbols-outlined text-[14px]">arrow_outward</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination & Table Legend */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 text-on-surface-variant font-label-sm text-label-sm border-t border-surface-dim mt-2">
            <div className="flex items-center gap-3">
              <span>
                Hiển thị {filteredTransactions.length} trên 44 dòng hạch toán trong kỳ đối soát
              </span>
              <span className="text-outline-variant">•</span>
              <span className="font-mono">MÃ KHÓA: ESCROW-LEDGER-VNPAY-REV-01</span>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="w-8 h-8 rounded bg-surface flex items-center justify-center text-on-surface hover:bg-surface-container transition-colors disabled:opacity-40 cursor-pointer border border-surface-dim"
              >
                <span className="material-symbols-outlined text-[16px]">chevron_left</span>
              </button>
              <span className="px-2 font-mono font-semibold text-on-surface">
                Trang {currentPage} / 8
              </span>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(8, p + 1))}
                className="w-8 h-8 rounded bg-surface flex items-center justify-center text-on-surface hover:bg-surface-container transition-colors cursor-pointer border border-surface-dim"
              >
                <span className="material-symbols-outlined text-[16px]">chevron_right</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Row 4: Specimen Performance Leaders (Top RENT vs Top THRIFT) */}
      <div className="w-full px-margin-mobile md:px-margin pb-8 max-w-[1440px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top RENT Products */}
          <div className="bg-surface-container-low rounded-xl p-6 shadow-sm border border-surface-dim">
            <div className="flex items-center justify-between pb-4 border-b border-surface-dim">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-[22px]">auto_graph</span>
                <div>
                  <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-semibold">
                    TỶ SUẤT TẠO DÒNG TIỀN
                  </span>
                  <h3 className="font-serif text-xl font-semibold text-on-surface">
                    Top Sản Phẩm Cho Thuê Sinh Lời
                  </h3>
                </div>
              </div>
              <span className="font-label-sm text-label-sm text-on-surface-variant font-mono">T11/2024</span>
            </div>

            <div className="flex flex-col gap-4 mt-4">
              {/* Item 1 */}
              <div className="bg-surface p-4 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded bg-surface-container shrink-0 overflow-hidden">
                    <img
                      className="w-full h-full object-cover"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuAy3_xtvOXu1-ym9IzXpvHsJJevk7LgWUdqj0hVaG93QPKnh2ZXkq1JO85H0GVojIwnq4yttXXbWZBYsYbBbikeNBZI4vIiuC-jw9W1mHuMx7v67cUIXII6EEod-Z8c0PTXK00uE8Wpg5_TLoXPVog5L-IwmRPzAktvs1RDtLDxppSvhVyKPYTKDsmZIl7TZJR7-uQzmsRibSkqAJpQIPd7suWWJ1OFg7HupWLRE8E2"
                      alt="Hasselblad 907X"
                    />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-title-md text-title-md text-on-surface font-semibold">
                      Hasselblad 907X 50C Kit
                    </span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">
                      14 chu kỳ thuê • Tỷ lệ hoàn cọc 100% nguyên vẹn
                    </span>
                  </div>
                </div>
                <div className="flex sm:flex-col items-center sm:items-end justify-between shrink-0">
                  <span className="font-serif text-lg text-secondary font-mono font-semibold">
                    68.400.000 ₫
                  </span>
                  <Link
                    to="/shop/rent/products"
                    className="font-label-sm text-label-sm font-semibold text-primary hover:text-on-surface transition-colors flex items-center gap-0.5 mt-0.5"
                  >
                    <span>Chi tiết</span>
                    <span className="material-symbols-outlined text-[12px]">arrow_forward</span>
                  </Link>
                </div>
              </div>

              {/* Item 2 */}
              <div className="bg-surface p-4 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded bg-surface-container shrink-0 overflow-hidden">
                    <img
                      className="w-full h-full object-cover"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuA4Lwr26sRRrGHgZ3OUDGQecaciOKcpFD1h8z85QgE0RLCNcaM4w2zvBVlL4KuEHmukLXCgEvm4vSIYw0RW2oONoN-X-FaDDQLZpttOEd99m0B9_5Q9PYF4WlEkIIdGhTddwURg0XKgOe04efzUaHXwrzcbT16fYm_8F5DrwQGHgiWiFg9dXkC1Df-IZmD3OPM8wEz0mgHt2iiTPqCP4Vsd8V2-yffd-KU0XdxdRft-"
                      alt="Canon EOS R6"
                    />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-title-md text-title-md text-on-surface font-semibold">
                      Canon EOS R6 Mark II + 24-70mm
                    </span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">
                      12 chu kỳ thuê • Tỷ lệ hoàn cọc 98%
                    </span>
                  </div>
                </div>
                <div className="flex sm:flex-col items-center sm:items-end justify-between shrink-0">
                  <span className="font-serif text-lg text-secondary font-mono font-semibold">
                    42.600.000 ₫
                  </span>
                  <Link
                    to="/shop/rent/products"
                    className="font-label-sm text-label-sm font-semibold text-primary hover:text-on-surface transition-colors flex items-center gap-0.5 mt-0.5"
                  >
                    <span>Chi tiết</span>
                    <span className="material-symbols-outlined text-[12px]">arrow_forward</span>
                  </Link>
                </div>
              </div>

              {/* Item 3 */}
              <div className="bg-surface p-4 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded bg-surface-container shrink-0 overflow-hidden">
                    <img
                      className="w-full h-full object-cover"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuDneKz2gyLTvcaXcuSfzeVsbh0woyMkes-yJOl6pVBMO2YIreFNqO39xUzYZZrKBugZSO8DPPO3oqmYQlqwMlT_5EfuVz6F-wg_nYCevQo9kWeccSw7Y5nvDOZPInB5xc9U3vtfmQPW3AEri9UqmTQ3T1cIRNDXOLK2SOT9iXsNnXQ_nsnaYZSEeiJw0iOmlpfp7c9b_9Udc62pPHy0Kx9XMXSZxcE3UUw3qRQPDP_6"
                      alt="Leica Summicron-M"
                    />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-title-md text-title-md text-on-surface font-semibold">
                      Leica Summicron-M 35mm f/2 ASPH
                    </span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">
                      9 chu kỳ thuê • Tỷ lệ hoàn cọc 100%
                    </span>
                  </div>
                </div>
                <div className="flex sm:flex-col items-center sm:items-end justify-between shrink-0">
                  <span className="font-serif text-lg text-secondary font-mono font-semibold">
                    31.800.000 ₫
                  </span>
                  <Link
                    to="/shop/rent/products"
                    className="font-label-sm text-label-sm font-semibold text-primary hover:text-on-surface transition-colors flex items-center gap-0.5 mt-0.5"
                  >
                    <span>Chi tiết</span>
                    <span className="material-symbols-outlined text-[12px]">arrow_forward</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Top THRIFT Listings */}
          <div className="bg-surface-container-low rounded-xl p-6 shadow-sm border border-surface-dim">
            <div className="flex items-center justify-between pb-4 border-b border-surface-dim">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-tertiary text-[22px]">workspace_premium</span>
                <div>
                  <span className="font-label-sm text-label-sm uppercase tracking-wider text-tertiary font-semibold">
                    HIỆN VẬT LƯU HÀNH CAO CẤP
                  </span>
                  <h3 className="font-serif text-xl font-semibold text-on-surface">
                    Top Mục Đăng Bán Đứt Giá Trị Nhất
                  </h3>
                </div>
              </div>
              <span className="font-label-sm text-label-sm text-on-surface-variant font-mono">T11/2024</span>
            </div>

            <div className="flex flex-col gap-4 mt-4">
              {/* Item 1 */}
              <div className="bg-surface p-4 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded bg-surface-container shrink-0 overflow-hidden">
                    <img
                      className="w-full h-full object-cover"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuA8m6MvDClhv6LpuK_tghiyEKLYHQao5IvjyywwF8nls-gid9gRZ9vW6dec7bjIJkSUw8XKEzutbbptxRUx24wG-HEeKynuA5G5ogFMpk62j8VGCkg2KTSFa0DG6hDlowYXsIo0MKItFCKk2h0eIqHct9H9pEHgXtCUadyXpSpnOE4JI-f_WyCGDJuu_1uzqHRT0wPFJCcn401FuCi-Grwgyn0UERoPtT2EO99Tm1Bu"
                      alt="Leica M6"
                    />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-title-md text-title-md text-on-surface font-semibold">
                      Leica M6 Classic 0.72x Black
                    </span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">
                      Giá niêm yết: 68.000.000 ₫ • Đã giải ngân hoàn tất
                    </span>
                  </div>
                </div>
                <div className="flex sm:flex-col items-center sm:items-end justify-between shrink-0">
                  <span className="font-serif text-lg text-tertiary font-mono font-semibold">
                    65.620.000 ₫
                  </span>
                  <Link
                    to="/shop/thrift/listings/HBL-907X"
                    className="font-label-sm text-label-sm font-semibold text-primary hover:text-on-surface transition-colors flex items-center gap-0.5 mt-0.5"
                  >
                    <span>Chi tiết</span>
                    <span className="material-symbols-outlined text-[12px]">arrow_forward</span>
                  </Link>
                </div>
              </div>

              {/* Item 2 */}
              <div className="bg-surface p-4 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded bg-surface-container shrink-0 overflow-hidden">
                    <img
                      className="w-full h-full object-cover"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuAJX35UYP58XyZHJ5D-jGyALlN7CImd3nPomvNCivFXcsz_zVUJPa4QjjCoVBm7lD6YrmZ60IkhCLTiwDUtRZFcjABjhJ3nPZY9gnSj9NS-hkBadYO3gwwtgnayCmQb4czaA0G8hwPopp9WlEc8iUOIZ4il1sxFg3SrRSH4E2t7cenx7ApMYl1fLHx9x14G6JhywMNIvLuCq9rEVPzDGF_A78rUX7LS2xaWrwnIriA_"
                      alt="Hasselblad 907X"
                    />
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5">
                      <span className="font-title-md text-title-md text-on-surface font-semibold">
                        Hasselblad 907X + XCD 45mm
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-tertiary/10 text-tertiary font-label-sm text-label-sm font-semibold">
                        Khóa 72h
                      </span>
                    </div>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">
                      Giá niêm yết: 122.000.000 ₫ • Đang chờ giải ngân
                    </span>
                  </div>
                </div>
                <div className="flex sm:flex-col items-center sm:items-end justify-between shrink-0">
                  <span className="font-serif text-lg text-tertiary font-mono font-semibold">
                    119.046.000 ₫
                  </span>
                  <Link
                    to="/shop/thrift/listings/HBL-907X"
                    className="font-label-sm text-label-sm font-semibold text-primary hover:text-on-surface transition-colors flex items-center gap-0.5 mt-0.5"
                  >
                    <span>Chi tiết</span>
                    <span className="material-symbols-outlined text-[12px]">arrow_forward</span>
                  </Link>
                </div>
              </div>

              {/* Item 3 */}
              <div className="bg-surface p-4 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded bg-surface-container shrink-0 overflow-hidden">
                    <img
                      className="w-full h-full object-cover"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuCnvMnu-945t9m4orPUfVZQ4qH5DfNJtsQ5hDymV-mw2JGiR0QQxfYmR6oVq4u4tAciFu-bcxpY-lVGfVcAdY1W0QRdtfSlINEvV770z55OEDbOIoI3NnLORq-taKvTijrwGDTMyzP5jbnS4BcEu2868PtHtOeHuOb0W__PBffR_KvN5uKv0dtBXRshtFWQQ39OdtNSsFZabVpHXXzdIDmZ_xE6Li_HNMtcMcUlzaAM"
                      alt="Contax T2"
                    />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-title-md text-title-md text-on-surface font-semibold">
                      Contax T2 Titanium Champagne
                    </span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">
                      Giá niêm yết: 32.500.000 ₫ • Đã giải ngân hoàn tất
                    </span>
                  </div>
                </div>
                <div className="flex sm:flex-col items-center sm:items-end justify-between shrink-0">
                  <span className="font-serif text-lg text-tertiary font-mono font-semibold">
                    31.362.500 ₫
                  </span>
                  <Link
                    to="/shop/thrift/listings/HBL-907X"
                    className="font-label-sm text-label-sm font-semibold text-primary hover:text-on-surface transition-colors flex items-center gap-0.5 mt-0.5"
                  >
                    <span>Chi tiết</span>
                    <span className="material-symbols-outlined text-[12px]">arrow_forward</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 5: Institutional Compliance & Privacy Legal Footnote */}
      <div className="w-full px-margin-mobile md:px-margin pb-8 max-w-[1440px] mx-auto">
        <div className="p-4 bg-surface-container rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-surface-dim">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-secondary text-[24px] shrink-0 mt-0.5">
              security
            </span>
            <div className="flex flex-col">
              <div className="font-title-md text-title-md text-on-surface font-semibold">
                Cam Kết Bảo Mật Tài Chính Ký Quỹ &amp; Escrow Độc Lập
              </div>
              <p className="font-body-md text-body-md text-on-surface-variant max-w-3xl leading-relaxed">
                Sổ kế toán đối soát tuân thủ tiêu chuẩn Smart Escrow và Nghị định thương mại điện tử tuần hoàn.
                Dữ liệu tài chính thuộc quyền sở hữu riêng của xưởng Atelier Chronos &amp; Optics (#OWNER-01).
                Hệ thống không tổng hợp hoặc chia sẻ số liệu với bất kỳ cửa hàng nào khác trong liên minh lưu
                ký.
              </p>
            </div>
          </div>
          <div className="shrink-0 flex items-center gap-2 font-label-sm text-label-sm text-on-surface-variant font-mono">
            <span className="w-2 h-2 rounded-full bg-secondary"></span>
            <span>VAULT ENCRYPTION: SHA-256</span>
          </div>
        </div>
      </div>

      {/* MODAL 1: Reconcile Modal (Đối Soát VNPay Tức Thời) */}
      {showReconcileModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-[#141310]/60 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-surface-container-lowest border border-outline-variant/40 shadow-2xl rounded-xl max-w-lg w-full p-6 flex flex-col gap-4 animate-scale-in">
            <div className="flex items-center justify-between border-b border-surface-dim pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[24px]">verified</span>
                <span className="font-serif text-xl font-semibold text-on-surface">
                  Đối Soát Tức Thời VNPay Smart Escrow
                </span>
              </div>
              <button
                type="button"
                className="p-1 text-on-surface-variant hover:text-on-surface cursor-pointer"
                onClick={() => setShowReconcileModal(false)}
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="flex flex-col gap-3 text-sm text-on-surface-variant leading-relaxed">
              <div className="p-3 bg-secondary-container/40 rounded-lg border border-secondary/20 flex items-start gap-2.5">
                <span className="material-symbols-outlined text-secondary text-[22px] shrink-0 mt-0.5">
                  task_alt
                </span>
                <div>
                  <div className="font-semibold text-on-surface">Khóa Kế Toán Đã Đồng Bộ Tức Thời</div>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    Toàn bộ 44 giao dịch kỳ này đã đối ứng 1:1 với Sổ cái Ký quỹ VNPay. Không phát hiện sai
                    lệch số dư.
                  </p>
                </div>
              </div>

              <div className="space-y-2 text-xs bg-surface-container-low p-3 rounded-lg border border-surface-dim font-mono">
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Mã phiên đối soát:</span>
                  <span className="font-semibold text-on-surface">#VNP-RECON-2024-8849</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Thời gian thực thi:</span>
                  <span className="text-on-surface">20/11/2024 · 16:45:12 GMT+7</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Số dư đã giải ngân:</span>
                  <span className="font-semibold text-secondary">284.650.000 ₫</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">Quỹ đang bảo chứng Escrow:</span>
                  <span className="font-semibold text-tertiary">234.046.000 ₫</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-surface-dim">
              <button
                type="button"
                className="px-4 py-2 rounded bg-primary hover:bg-tertiary text-on-primary font-label-md text-label-md transition-colors cursor-pointer font-semibold"
                onClick={() => {
                  setShowReconcileModal(false);
                  triggerToast('Đã xác nhận biên bản đối soát VNPay Smart Escrow.');
                }}
              >
                Xác Nhận Biên Bản
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Custom Date Range Picker */}
      {showCustomDateModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-[#141310]/60 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="bg-surface-container-lowest border border-outline-variant/40 shadow-2xl rounded-xl max-w-md w-full p-6 flex flex-col gap-4 animate-scale-in">
            <div className="flex items-center justify-between border-b border-surface-dim pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[22px]">date_range</span>
                <span className="font-serif text-xl font-semibold text-on-surface">
                  Tùy Chỉnh Khoảng Thời Gian
                </span>
              </div>
              <button
                type="button"
                className="p-1 text-on-surface-variant hover:text-on-surface cursor-pointer"
                onClick={() => setShowCustomDateModal(false)}
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="flex flex-col gap-1">
                <label className="font-semibold text-on-surface">Từ ngày:</label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="px-3 py-2 bg-surface rounded border border-surface-dim text-on-surface font-mono"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="font-semibold text-on-surface">Đến ngày:</label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="px-3 py-2 bg-surface rounded border border-surface-dim text-on-surface font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-surface-dim">
              <button
                type="button"
                className="px-4 py-2 rounded bg-surface-container text-on-surface font-label-md text-label-md hover:bg-surface-container-high transition-colors cursor-pointer"
                onClick={() => setShowCustomDateModal(false)}
              >
                Hủy
              </button>
              <button
                type="button"
                className="px-4 py-2 rounded bg-primary text-on-primary font-label-md text-label-md hover:bg-tertiary transition-colors cursor-pointer font-semibold"
                onClick={() => {
                  setTimeline('custom');
                  setShowCustomDateModal(false);
                  triggerToast(`Đã áp dụng khoảng ngày: ${customStartDate} → ${customEndDate}`);
                }}
              >
                Áp Dụng Khoảng Ngày
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RevenueDashboard;
