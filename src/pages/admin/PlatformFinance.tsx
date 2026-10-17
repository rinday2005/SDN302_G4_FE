import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";

export type Timeframe = "TODAY" | "7_DAYS" | "30_DAYS" | "CUSTOM";
export type TxnType =
  | "ALL"
  | "RENT_DEPOSIT"
  | "RENT_FEE"
  | "THRIFT_PURCHASE"
  | "DEPOSIT_REFUND"
  | "PENALTY"
  | "BUYER_REFUND";
export type TxnStatus = "ALL" | "HELD" | "SETTLED" | "REFUNDED" | "DEDUCTED";

export interface TransactionRecord {
  id: string; // e.g. "TXN-94821-VN"
  vnpayRef: string; // e.g. "VNP-84729103"
  orderCode: string; // e.g. "#RO-8821"
  orderSubtitle: string;
  orderType: "RENT" | "THRIFT";
  type: TxnType;
  typeLabel: string;
  typeBadgeColor: string;
  amount: number;
  amountPrefix?: "+" | "-";
  amountBadge: string;
  amountBadgeColor: string;
  gatewayName: string;
  gatewaySub: string;
  gatewayIndicatorColor: string;
  dateDisplay: string;
  timeDisplay: string;
  status: TxnStatus;
  statusLabel: string;
  shaSignature?: string;
  bankAccount?: string;
}

const INITIAL_TRANSACTIONS: TransactionRecord[] = [
  {
    id: "TXN-94821-VN",
    vnpayRef: "VNP-84729103",
    orderCode: "#RO-8821",
    orderSubtitle: "Đơn RENT 30 ngày",
    orderType: "RENT",
    type: "RENT_DEPOSIT",
    typeLabel: "RENT DEPOSIT",
    typeBadgeColor: "bg-[#141310]/10 text-[#141310]",
    amount: 28000000,
    amountBadge: "[HELD IN ESCROW]",
    amountBadgeColor: "text-[#141310]",
    gatewayName: "VNPay Secured Escrow",
    gatewaySub: "Vault Vietcombank SVB",
    gatewayIndicatorColor: "bg-[#141310]",
    dateDisplay: "24/10/2026",
    timeDisplay: "14:32:08",
    status: "HELD",
    statusLabel: "Đã Khóa Smart Escrow",
    shaSignature: "sha256:7b2a9f110c4d8e78aa135d8e...",
    bankAccount: "VCB-8839201923 (Segregated)",
  },
  {
    id: "TXN-94820-VN",
    vnpayRef: "VNP-84729102",
    orderCode: "#RO-8821",
    orderSubtitle: "Phí thuê kỳ hạn",
    orderType: "RENT",
    type: "RENT_FEE",
    typeLabel: "RENT FEE",
    typeBadgeColor: "bg-[#d8e3ce]/50 text-[#576151]",
    amount: 1450000,
    amountPrefix: "+",
    amountBadge: "[INFLOW REVENUE]",
    amountBadgeColor: "text-[#576151]",
    gatewayName: "VNPay Settled",
    gatewaySub: "Khấu trừ tự động",
    gatewayIndicatorColor: "bg-[#576151]",
    dateDisplay: "24/10/2026",
    timeDisplay: "14:32:05",
    status: "SETTLED",
    statusLabel: "Đã Quyết Toán",
    shaSignature: "sha256:1a84f9328de37812bc890e12...",
  },
  {
    id: "TXN-94812-VN",
    vnpayRef: "VNP-84728955",
    orderCode: "#TO-4412",
    orderSubtitle: "Giao dịch đồng hồ Patek",
    orderType: "THRIFT",
    type: "THRIFT_PURCHASE",
    typeLabel: "THRIFT PURCHASE",
    typeBadgeColor: "bg-[#292724] text-[#928e89]",
    amount: 78500000,
    amountPrefix: "+",
    amountBadge: "[TAKE-RATE 8.0%]",
    amountBadgeColor: "text-[#7b766f]",
    gatewayName: "VNPay Settled",
    gatewaySub: "Phí sàn: 6,280,000 ₫",
    gatewayIndicatorColor: "bg-[#576151]",
    dateDisplay: "24/10/2026",
    timeDisplay: "11:15:42",
    status: "SETTLED",
    statusLabel: "Đã Quyết Toán",
    shaSignature: "sha256:4b91cc283719dae782103891...",
  },
  {
    id: "TXN-94799-VN",
    vnpayRef: "VNP-84727411",
    orderCode: "#RO-8710",
    orderSubtitle: "Hoàn tất kiểm định trả đồ",
    orderType: "RENT",
    type: "DEPOSIT_REFUND",
    typeLabel: "DEPOSIT FULL REFUND",
    typeBadgeColor: "bg-[#ebe8e1] text-[#1c1c18]",
    amount: 18000000,
    amountPrefix: "-",
    amountBadge: "[100% REFUNDED]",
    amountBadgeColor: "text-[#576151]",
    gatewayName: "VNPay Return Liquidated",
    gatewaySub: "Giải ngân qua API",
    gatewayIndicatorColor: "bg-[#576151]",
    dateDisplay: "24/10/2026",
    timeDisplay: "09:44:19",
    status: "REFUNDED",
    statusLabel: "Đã Hoàn Trả",
    shaSignature: "sha256:99f78310ba7c489218d84920...",
  },
  {
    id: "TXN-94782-VN",
    vnpayRef: "VNP-84726209",
    orderCode: "#RO-8699",
    orderSubtitle: "Biên bản vi xước kính",
    orderType: "RENT",
    type: "PENALTY",
    typeLabel: "PENALTY DEDUCTION",
    typeBadgeColor: "bg-[#ffdad6]/60 text-[#ba1a1a]",
    amount: 1200000,
    amountBadge: "[KHẤU TRỪ TỪ CỌC]",
    amountBadgeColor: "text-[#ba1a1a]",
    gatewayName: "Bench Liquidated",
    gatewaySub: "Chuyển quỹ bảo dưỡng xưởng",
    gatewayIndicatorColor: "bg-[#ba1a1a]",
    dateDisplay: "23/10/2026",
    timeDisplay: "16:50:33",
    status: "DEDUCTED",
    statusLabel: "Đã Khấu Trừ",
    shaSignature: "sha256:aa89201948fc284018274910...",
  },
  {
    id: "TXN-94770-VN",
    vnpayRef: "VNP-84725612",
    orderCode: "#TO-4390",
    orderSubtitle: "Tranh chấp sai phụ kiện",
    orderType: "THRIFT",
    type: "BUYER_REFUND",
    typeLabel: "BUYER REFUND",
    typeBadgeColor: "bg-[#ffdad6]/60 text-[#ba1a1a]",
    amount: 12400000,
    amountPrefix: "-",
    amountBadge: "[REVERSED DISPUTE]",
    amountBadgeColor: "text-[#ba1a1a]",
    gatewayName: "VNPay Reversed",
    gatewaySub: "Quyết định trọng tài sàn",
    gatewayIndicatorColor: "bg-[#ba1a1a]",
    dateDisplay: "23/10/2026",
    timeDisplay: "14:10:02",
    status: "REFUNDED",
    statusLabel: "Đã Hoàn Trả",
    shaSignature: "sha256:fe84029148dce84921048201...",
  },
];

export const PlatformFinance: React.FC = () => {
  const [timeframe, setTimeframe] = useState<Timeframe>("30_DAYS");
  const [transactions] = useState<TransactionRecord[]>(INITIAL_TRANSACTIONS);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<TxnType>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<TxnStatus>("ALL");

  // Syncing simulation state
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatusText, setSyncStatusText] = useState("Đồng Bộ VNPay Gateway");

  // Modals
  const [selectedTxn, setSelectedTxn] = useState<TransactionRecord | null>(null);
  const [showInsuranceModal, setShowInsuranceModal] = useState(false);
  const [showAuditCertModal, setShowAuditCertModal] = useState(false);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Gateway Sync Action
  const handleSyncGateway = () => {
    setIsSyncing(true);
    setSyncStatusText("Đang đồng bộ VNPay...");

    setTimeout(() => {
      setIsSyncing(false);
      setSyncStatusText("Đã đồng bộ thành công");
      showToast("Đã đồng bộ thành công 1,842 giao dịch với VNPay Gateway IPN.");

      setTimeout(() => {
        setSyncStatusText("Đồng Bộ VNPay Gateway");
      }, 3000);
    }, 1200);
  };

  // Export CSV Action
  const handleExportCSV = () => {
    const headers = [
      "Mã Giao Dịch",
      "VNPay Ref",
      "Đơn Hàng",
      "Phân Loại",
      "Số Tiền (VND)",
      "Cổng Ký Quỹ / Đối Soát",
      "Trạng Thái",
      "Thời Gian",
    ];

    const rows = filteredTxns.map((t) => [
      t.id,
      t.vnpayRef,
      t.orderCode,
      `"${t.typeLabel}"`,
      t.amount,
      `"${t.gatewayName} (${t.gatewaySub})"`,
      `"${t.statusLabel}"`,
      `"${t.dateDisplay} ${t.timeDisplay}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `Bao_Cao_Tai_Chinh_ReUseHub_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Đã xuất báo cáo đối soát tài chính CSV.");
  };

  // Filter transactions
  const filteredTxns = useMemo(() => {
    return transactions.filter((t) => {
      if (selectedType !== "ALL" && t.type !== selectedType) return false;
      if (selectedStatus !== "ALL" && t.status !== selectedStatus) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchId = t.id.toLowerCase().includes(q);
        const matchVnp = t.vnpayRef.toLowerCase().includes(q);
        const matchOrder = t.orderCode.toLowerCase().includes(q);
        const matchType = t.typeLabel.toLowerCase().includes(q);
        if (!matchId && !matchVnp && !matchOrder && !matchType) return false;
      }

      return true;
    });
  }, [transactions, selectedType, selectedStatus, searchQuery]);

  return (
    <div className="flex flex-col w-full bg-[#fdf9f2] text-[#1c1c18] font-sans min-h-screen">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 bg-[#141310] text-[#fdf9f2] rounded-xl shadow-2xl border border-[#ccc5bc]/30 animate-bounce">
          <span className="material-symbols-outlined text-[20px] text-[#bfcab6]">
            verified
          </span>
          <span className="text-xs font-medium">{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="ml-2 text-white/60 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {/* SECONDARY ADMIN SUB-NAVIGATION BAR */}
      <nav
        aria-label="Admin Navigation Tabs"
        className="w-full bg-[#f7f3ec] shadow-[0_1px_4px_rgba(20,19,16,0.03)] border-b border-[#ccc5bc]/30"
      >
        <div className="max-w-[1440px] mx-auto px-4 md:px-12 flex items-center justify-between gap-4 overflow-x-auto py-2.5">
          <div className="flex items-center gap-1.5 shrink-0 whitespace-nowrap">
            <Link
              to="/admin/dashboard"
              className="px-3 py-1.5 rounded text-xs font-medium text-[#4a463f] hover:text-[#1c1c18] hover:bg-[#f1ede6] transition-colors"
            >
              Bảng Điều Khiển
            </Link>
            <Link
              to="/admin/users"
              className="px-3 py-1.5 rounded text-xs font-medium text-[#4a463f] hover:text-[#1c1c18] hover:bg-[#f1ede6] transition-colors"
            >
              Người Dùng
            </Link>
            <Link
              to="/admin/kyc"
              className="px-3 py-1.5 rounded text-xs font-medium text-[#4a463f] hover:text-[#1c1c18] hover:bg-[#f1ede6] transition-colors"
            >
              Duyệt KYC
            </Link>
            <Link
              to="/admin/rent/listings"
              className="px-3 py-1.5 rounded text-xs font-medium text-[#4a463f] hover:text-[#1c1c18] hover:bg-[#f1ede6] transition-colors"
            >
              Duyệt RENT
            </Link>
            <Link
              to="/admin/thrift/listings"
              className="px-3 py-1.5 rounded text-xs font-medium text-[#4a463f] hover:text-[#1c1c18] hover:bg-[#f1ede6] transition-colors"
            >
              Duyệt THRIFT
            </Link>
            <Link
              to="/admin/categories"
              className="px-3 py-1.5 rounded text-xs font-medium text-[#4a463f] hover:text-[#1c1c18] hover:bg-[#f1ede6] transition-colors"
            >
              Danh Mục Sàn
            </Link>
            <Link
              to="/admin/disputes"
              className="px-3 py-1.5 rounded text-xs font-medium text-[#4a463f] hover:text-[#1c1c18] hover:bg-[#f1ede6] transition-colors"
            >
              Tranh Chấp
            </Link>
            <Link
              to="/admin/finance"
              aria-current="page"
              className="px-3 py-1.5 rounded text-xs bg-[#141310] text-[#fdf9f2] font-semibold shadow-sm transition-all"
            >
              Tài Chính Sàn
            </Link>
          </div>
          <div className="hidden lg:flex items-center gap-3 pl-4 shrink-0">
            <div className="flex items-center gap-2 px-3 py-1 rounded bg-[#f1ede6] text-[#1c1c18] text-xs">
              <span className="w-2 h-2 rounded-full bg-[#576151] animate-pulse"></span>
              <span className="text-[#4a463f]">
                Vũ Hoàng Quân{" "}
                <span className="text-[#141310] font-bold">
                  (QUẢN TRỊ VIÊN CẤP CAO • SECURED)
                </span>
              </span>
            </div>
          </div>
        </div>
      </nav>

      {/* MAIN BODY CONTAINER */}
      <div className="max-w-[1440px] mx-auto px-4 md:px-12 w-full py-8 flex flex-col gap-8">
        {/* 1. BREADCRUMB & CONTEXT HEADER */}
        <header className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-[#4a463f]">
              <Link to="/admin/dashboard" className="hover:text-[#141310] transition-colors">
                Quản Trị Hệ Thống
              </Link>
              <span className="text-[#ccc5bc]">/</span>
              <span className="text-[#1c1c18] font-semibold">Tài Chính Toàn Nền Tảng</span>
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-[#f1ede6] text-[#4a463f]">
              <span className="material-symbols-outlined text-[16px] text-[#576151]">
                verified_user
              </span>
              <span className="text-[10px] tracking-wider uppercase font-semibold">
                SỔ CÁI THANH TOÁN TẬP TRUNG • ĐỐI SOÁT VNPAY REALTIME • B-CORP AUDIT COMPLIANT
              </span>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="flex flex-col gap-1.5 max-w-3xl">
              <h1 className="font-serif text-3xl sm:text-4xl text-[#141310] tracking-tight font-medium">
                Platform Finance
              </h1>
              <p className="text-sm text-[#4a463f] leading-relaxed">
                Theo dõi thanh toán, hoàn tiền và hoạt động tài chính toàn nền tảng. Toàn bộ dòng tiền lưu thông được ký quỹ độc lập và đối soát đối ứng theo thời gian thực.
              </p>
            </div>

            {/* Controls: Timeframe Pills & Action Triggers */}
            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              {/* Date Filter Pills */}
              <div className="inline-flex items-center p-1 rounded-lg bg-[#f1ede6] shadow-inner text-xs">
                <button
                  type="button"
                  onClick={() => setTimeframe("TODAY")}
                  className={`px-3 py-1.5 rounded-md transition-colors ${
                    timeframe === "TODAY"
                      ? "bg-white text-[#141310] font-semibold shadow-sm"
                      : "text-[#4a463f] hover:text-[#1c1c18]"
                  }`}
                >
                  Hôm nay
                </button>
                <button
                  type="button"
                  onClick={() => setTimeframe("7_DAYS")}
                  className={`px-3 py-1.5 rounded-md transition-colors ${
                    timeframe === "7_DAYS"
                      ? "bg-white text-[#141310] font-semibold shadow-sm"
                      : "text-[#4a463f] hover:text-[#1c1c18]"
                  }`}
                >
                  7 Ngày
                </button>
                <button
                  type="button"
                  onClick={() => setTimeframe("30_DAYS")}
                  className={`px-3 py-1.5 rounded-md transition-colors ${
                    timeframe === "30_DAYS"
                      ? "bg-white text-[#141310] font-semibold shadow-sm"
                      : "text-[#4a463f] hover:text-[#1c1c18]"
                  }`}
                >
                  30 Ngày
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTimeframe("CUSTOM");
                    showToast("Chọn khoảng thời gian tùy chỉnh...");
                  }}
                  className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1 ${
                    timeframe === "CUSTOM"
                      ? "bg-white text-[#141310] font-semibold shadow-sm"
                      : "text-[#4a463f] hover:text-[#1c1c18]"
                  }`}
                >
                  <span>Tùy chọn</span>
                  <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                </button>
              </div>

              {/* Sync Gateway */}
              <button
                type="button"
                onClick={handleSyncGateway}
                disabled={isSyncing}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#ebe8e1] hover:bg-[#e6e2db] text-[#1c1c18] text-xs font-semibold transition-all shadow-sm border border-[#ccc5bc]/40 disabled:opacity-60"
              >
                <span
                  className={`material-symbols-outlined text-[18px] text-[#141310] ${
                    isSyncing ? "animate-spin" : ""
                  }`}
                >
                  sync
                </span>
                <span>{syncStatusText}</span>
              </button>

              {/* Export Report */}
              <button
                type="button"
                onClick={handleExportCSV}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#141310] hover:bg-[#292724] text-[#fdf9f2] text-xs font-semibold transition-all shadow-sm"
              >
                <span className="material-symbols-outlined text-[18px]">download</span>
                <span>Xuất Báo Cáo (CSV)</span>
              </button>
            </div>
          </div>
        </header>

        {/* 2. CRITICAL FINANCIAL TAXONOMY & CLARITY NOTICE (Educational / Governance Banner) */}
        <section className="bg-[#f7f3ec] rounded-2xl p-6 shadow-sm border border-[#ccc5bc]/40 flex flex-col gap-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#141310]/10 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[20px] text-[#141310]">
                  account_balance
                </span>
              </div>
              <div>
                <h2 className="font-serif text-base font-bold text-[#1c1c18]">
                  Bộ Quy Chuẩn Kế Toán Tuần Hoàn &amp; Cơ Chế Giám Sát Bất Biến
                </h2>
                <p className="text-xs text-[#4a463f]">
                  Phân tách pháp lý giữa dòng tiền luân chuyển ủy thác và doanh thu thực nhận của ReUse Hub
                </p>
              </div>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#e6e2db] text-[#1c1c18] text-[10px] font-bold uppercase tracking-wider shrink-0 border border-[#ccc5bc]/40">
              <span className="material-symbols-outlined text-[14px] text-[#ba1a1a]">lock</span>
              <span>Immutable Ledger • Read-Only Scope</span>
            </div>
          </div>

          {/* 4 Pillars Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Customer Payment */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-[#ccc5bc]/30 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wider font-bold text-[#7b766f]">
                  A. Customer Payment
                </span>
                <span className="material-symbols-outlined text-[18px] text-[#141310]">
                  payments
                </span>
              </div>
              <span className="font-serif text-sm font-bold text-[#1c1c18]">
                Tổng Dòng Tiền Thu
              </span>
              <p className="text-xs text-[#4a463f] leading-relaxed">
                Tổng giá trị thanh toán chuyển từ tài khoản người dùng qua cổng VNPay (bao gồm phí dịch vụ, cọc và giá trị giao dịch).
              </p>
            </div>

            {/* Escrow Deposit */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-[#ccc5bc]/30 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wider font-bold text-[#576151]">
                  B. Escrow Deposit
                </span>
                <span className="material-symbols-outlined text-[18px] text-[#576151]">
                  shield
                </span>
              </div>
              <span className="font-serif text-sm font-bold text-[#1c1c18]">
                Ký Quỹ Giữ Hộ (Tạm Giữ)
              </span>
              <p className="text-xs text-[#4a463f] leading-relaxed">
                Khoản bảo chứng tài sản RENT. Phong tỏa tại quỹ ngân hàng đối tác Segregated Trust Vietcombank SVB.{" "}
                <strong className="text-[#141310]">Tuyệt đối không tính vào doanh thu.</strong>
              </p>
            </div>

            {/* Refunded Deposit */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-[#ccc5bc]/30 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wider font-bold text-[#7b766f]">
                  C. Refunded Deposit
                </span>
                <span className="material-symbols-outlined text-[18px] text-[#7b766f]">
                  assignment_return
                </span>
              </div>
              <span className="font-serif text-sm font-bold text-[#1c1c18]">
                Hoàn Trả Ký Quỹ
              </span>
              <p className="text-xs text-[#4a463f] leading-relaxed">
                Khoản tiền hoàn trả nguyên vẹn cho khách thuê ngay khi phòng thẩm định ReUse Hub Lab xác nhận hiện trạng nguyên bản.
              </p>
            </div>

            {/* Platform Revenue */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-[#ccc5bc]/30 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wider font-bold text-[#576151]">
                  D. Platform Revenue
                </span>
                <span className="material-symbols-outlined text-[18px] text-[#576151]">
                  point_of_sale
                </span>
              </div>
              <span className="font-serif text-sm font-bold text-[#576151]">
                Doanh Thu Thực Sàn
              </span>
              <p className="text-xs text-[#4a463f] leading-relaxed">
                Lợi nhuận ròng sàn nhận từ phí kết nối thuê (take-rate RENT), phí lưu ký giao dịch THRIFT (8.0% - 8.5%) và chứng thư giám định.
              </p>
            </div>
          </div>

          {/* Notice Disclaimer */}
          <div className="p-3.5 bg-[#f1ede6] rounded-xl flex items-start gap-3 border border-[#ccc5bc]/30">
            <span className="material-symbols-outlined text-[20px] text-[#141310] shrink-0 mt-0.5">
              info
            </span>
            <p className="text-xs text-[#4a463f] leading-relaxed">
              <strong className="text-[#1c1c18] font-semibold">
                Chế độ kiểm toán bất biến (Read-only Governance):
              </strong>{" "}
              Quản trị viên chỉ có quyền giám sát, đối soát kỹ thuật thông qua Webhook VNPay và hợp đồng ký quỹ Smart Escrow. Hệ thống cố ý không cung cấp bất kỳ công cụ chỉnh sửa số tiền thủ công nào (“Edit Transaction / Edit Payment Amount”) nhằm bảo vệ tính toàn vẹn của báo cáo tài chính B-Corp.
            </p>
          </div>
        </section>

        {/* 3. SUMMARY KPIS (Executive Financial Metrics) */}
        <section className="flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-xl font-bold text-[#1c1c18]">
              Chỉ Số Tài Chính Tổng Hợp ({timeframe === "30_DAYS" ? "30 Ngày" : timeframe === "7_DAYS" ? "7 Ngày" : "Hôm Nay"})
            </h2>
            <span className="text-[11px] text-[#7b766f] uppercase tracking-wider">
              Cập nhật: 10 phút trước • Chu kỳ Q4/2026
            </span>
          </div>

          {/* Main 4 Hero Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Metric 1: Total Volume */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-[#ccc5bc]/30 flex flex-col justify-between gap-4">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider font-semibold text-[#7b766f]">
                  Tổng Dòng Tiền (TPV)
                </span>
                <div className="w-8 h-8 rounded-full bg-[#f7f3ec] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px] text-[#141310]">
                    account_balance_wallet
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <span className="font-serif text-2xl sm:text-3xl font-bold text-[#1c1c18]">
                  4,820,500,000 ₫
                </span>
                <div className="flex items-center gap-1.5 text-[#576151] text-xs">
                  <span className="material-symbols-outlined text-[16px]">trending_up</span>
                  <span className="font-bold">+14.2%</span>
                  <span className="text-[#7b766f]">so với kỳ trước</span>
                </div>
              </div>
              <div className="w-full pt-1">
                <svg className="w-full h-8 text-[#141310] overflow-visible" fill="none" viewBox="0 0 100 25">
                  <path d="M0 20 Q 15 16, 30 18 T 60 10 T 80 12 T 100 4" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2"></path>
                  <path d="M0 20 Q 15 16, 30 18 T 60 10 T 80 12 T 100 4 L 100 25 L 0 25 Z" fill="currentColor" fillOpacity="0.08"></path>
                </svg>
              </div>
            </div>

            {/* Metric 2: Net Revenue */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-[#ccc5bc]/30 flex flex-col justify-between gap-4">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider font-semibold text-[#7b766f]">
                  Doanh Thu Thực Sàn
                </span>
                <div className="w-8 h-8 rounded-full bg-[#d8e3ce]/40 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px] text-[#576151]">
                    trending_up
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <span className="font-serif text-2xl sm:text-3xl font-bold text-[#576151]">
                  412,850,000 ₫
                </span>
                <div className="flex items-center gap-1.5 text-xs text-[#576151]">
                  <span className="font-bold">Biên độ Net Margin: 8.56%</span>
                </div>
              </div>
              <div className="w-full pt-1">
                <svg className="w-full h-8 text-[#576151] overflow-visible" fill="none" viewBox="0 0 100 25">
                  <path d="M0 22 Q 20 18, 40 16 T 70 8 T 100 2" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2"></path>
                  <path d="M0 22 Q 20 18, 40 16 T 70 8 T 100 2 L 100 25 L 0 25 Z" fill="currentColor" fillOpacity="0.12"></path>
                </svg>
              </div>
            </div>

            {/* Metric 3: Escrow Active */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-[#ccc5bc]/30 flex flex-col justify-between gap-4">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider font-semibold text-[#7b766f]">
                  Ký Quỹ Đang Phong Tỏa
                </span>
                <div className="w-8 h-8 rounded-full bg-[#f7f3ec] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px] text-[#181106]">
                    lock
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <span className="font-serif text-2xl sm:text-3xl font-bold text-[#1c1c18]">
                  1,285,000,000 ₫
                </span>
                <div className="flex items-center gap-1.5 text-xs text-[#7b766f]">
                  <span className="material-symbols-outlined text-[14px] text-[#576151]">verified</span>
                  <span>Vietcombank Segregated Trust</span>
                </div>
              </div>
              <div className="w-full bg-[#f1ede6] rounded-full h-2 overflow-hidden">
                <div className="bg-[#2e2618] h-full rounded-full" style={{ width: "59%" }}></div>
              </div>
            </div>

            {/* Metric 4: Deposits Refunded */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-[#ccc5bc]/30 flex flex-col justify-between gap-4">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider font-semibold text-[#7b766f]">
                  Cọc Đã Hoàn Trả Khách
                </span>
                <div className="w-8 h-8 rounded-full bg-[#f7f3ec] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px] text-[#576151]">
                    check_circle
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <span className="font-serif text-2xl sm:text-3xl font-bold text-[#1c1c18]">
                  892,400,000 ₫
                </span>
                <div className="flex items-center gap-1.5 text-xs text-[#576151]">
                  <span className="font-bold">97.9%</span>
                  <span className="text-[#7b766f]">tỷ lệ trả cọc nguyên vẹn</span>
                </div>
              </div>
              <div className="w-full bg-[#f1ede6] rounded-full h-2 overflow-hidden">
                <div className="bg-[#576151] h-full rounded-full" style={{ width: "97.9%" }}></div>
              </div>
            </div>
          </div>

          {/* Secondary 4 Breakdown Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* RENT Share */}
            <div className="bg-[#f1ede6] p-4 rounded-xl flex items-center justify-between border border-[#ccc5bc]/30">
              <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-wider font-semibold text-[#7b766f]">
                  Doanh Thu Phí RENT
                </span>
                <span className="font-serif text-sm font-bold text-[#1c1c18]">
                  245,600,000 ₫
                </span>
                <span className="text-[11px] text-[#7b766f]">59.5% cơ cấu doanh thu</span>
              </div>
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-xs font-bold text-[#141310] shadow-sm">
                59%
              </div>
            </div>

            {/* THRIFT Share */}
            <div className="bg-[#f1ede6] p-4 rounded-xl flex items-center justify-between border border-[#ccc5bc]/30">
              <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-wider font-semibold text-[#7b766f]">
                  Lưu Ký THRIFT Take-Rate
                </span>
                <span className="font-serif text-sm font-bold text-[#1c1c18]">
                  148,250,000 ₫
                </span>
                <span className="text-[11px] text-[#7b766f]">35.9% cơ cấu doanh thu</span>
              </div>
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-xs font-bold text-[#141310] shadow-sm">
                36%
              </div>
            </div>

            {/* Disputes Refund */}
            <div className="bg-[#f1ede6] p-4 rounded-xl flex items-center justify-between border border-[#ccc5bc]/30">
              <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-wider font-semibold text-[#7b766f]">
                  Hoàn Trả Tranh Chấp
                </span>
                <span className="font-serif text-sm font-bold text-[#ba1a1a]">
                  46,200,000 ₫
                </span>
                <span className="text-[11px] text-[#7b766f]">0.95% tổng TPV (Cực thấp)</span>
              </div>
              <div className="w-10 h-10 rounded-full bg-[#ffdad6]/60 flex items-center justify-center text-[#ba1a1a] shadow-sm">
                <span className="material-symbols-outlined text-[18px]">assignment_late</span>
              </div>
            </div>

            {/* Penalties Liquidated */}
            <div className="bg-[#f1ede6] p-4 rounded-xl flex items-center justify-between border border-[#ccc5bc]/30">
              <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-wider font-semibold text-[#7b766f]">
                  Phạt Khấu Trừ Hư Tổn
                </span>
                <span className="font-serif text-sm font-bold text-[#1c1c18]">
                  19,000,000 ₫
                </span>
                <span className="text-[11px] text-[#7b766f]">Chi trả bảo dưỡng phục chế</span>
              </div>
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#141310] shadow-sm">
                <span className="material-symbols-outlined text-[18px]">build_circle</span>
              </div>
            </div>
          </div>
        </section>

        {/* 4. TWO SECTOR LEDGERS (RENT vs THRIFT Circular Streams) */}
        <section className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h2 className="font-serif text-xl font-bold text-[#1c1c18]">
              Sổ Cái Tách Biệt Theo Phân Khu Tuần Hoàn
            </h2>
            <span className="text-xs text-[#7b766f]">
              Phân rã dòng tiền hoạt động theo mô hình cho thuê và mua bán lưu trữ
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* LEFT CARD: RENT FINANCIAL SECTOR */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#ccc5bc]/30 flex flex-col justify-between gap-6">
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#f1ede6]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#f7f3ec] flex items-center justify-center text-[#141310]">
                      <span className="material-symbols-outlined text-[22px]">auto_stories</span>
                    </div>
                    <div>
                      <h3 className="font-serif text-base font-bold text-[#1c1c18]">
                        RENT Financial Sector
                      </h3>
                      <span className="text-[11px] uppercase tracking-wider text-[#7b766f]">
                        Lưu thông di sản theo thời vụ &amp; Ký quỹ bảo chứng
                      </span>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded bg-[#f1ede6] text-[#1c1c18] text-[10px] font-bold uppercase tracking-wider">
                    ACTIVE SECTOR
                  </span>
                </div>

                <div className="flex flex-col divide-y divide-[#f1ede6] text-xs">
                  <div className="flex items-center justify-between py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#576151]"></span>
                      <span className="text-[#1c1c18]">Tiền Thuê Đã Thu (Rental Fees Collected)</span>
                    </div>
                    <span className="font-serif font-bold text-sm text-[#1c1c18]">
                      728,400,000 ₫
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#181106]"></span>
                      <span className="text-[#1c1c18]">Tổng Ký Quỹ Tiếp Nhận (Escrow Processed)</span>
                    </div>
                    <span className="font-serif font-bold text-sm text-[#1c1c18]">
                      2,177,400,000 ₫
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#7b766f]"></span>
                      <span className="text-[#1c1c18]">Cọc Đã Hoàn Trả Sạch (Deposits Released)</span>
                    </div>
                    <span className="font-serif font-bold text-sm text-[#576151]">
                      892,400,000 ₫
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#141310]"></span>
                      <span className="text-[#1c1c18]">Cọc Đang Lưu Ký Két Sắt (Active Retention)</span>
                    </div>
                    <span className="font-serif font-bold text-sm text-[#141310]">
                      1,285,000,000 ₫
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#ba1a1a]"></span>
                      <span className="text-[#1c1c18]">Khấu Trừ Bồi Thường Hư Tổn (Penalties)</span>
                    </div>
                    <span className="font-serif font-bold text-sm text-[#ba1a1a]">
                      19,000,000 ₫
                    </span>
                  </div>
                </div>
              </div>

              <Link
                to="/admin/rent/listings"
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#f1ede6] hover:bg-[#ebe8e1] text-[#1c1c18] text-xs font-semibold transition-all"
              >
                <span>Xem Hồ Sơ Đơn RENT (View RENT Orders)</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </Link>
            </div>

            {/* RIGHT CARD: THRIFT FINANCIAL SECTOR */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#ccc5bc]/30 flex flex-col justify-between gap-6">
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#f1ede6]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#f7f3ec] flex items-center justify-center text-[#141310]">
                      <span className="material-symbols-outlined text-[22px]">storefront</span>
                    </div>
                    <div>
                      <h3 className="font-serif text-base font-bold text-[#1c1c18]">
                        THRIFT Financial Sector
                      </h3>
                      <span className="text-[11px] uppercase tracking-wider text-[#7b766f]">
                        Lưu kho di sản chuyển nhượng vĩnh viễn
                      </span>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded bg-[#f1ede6] text-[#1c1c18] text-[10px] font-bold uppercase tracking-wider">
                    ARCHIVAL TRADING
                  </span>
                </div>

                <div className="flex flex-col divide-y divide-[#f1ede6] text-xs">
                  <div className="flex items-center justify-between py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#141310]"></span>
                      <span className="text-[#1c1c18]">Tổng Doanh Số Bán Đứt (Sales Volume)</span>
                    </div>
                    <span className="font-serif font-bold text-sm text-[#1c1c18]">
                      1,914,700,000 ₫
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#576151]"></span>
                      <span className="text-[#1c1c18]">Đã Chi Trả Cho Chủ Sở Hữu (Disbursed)</span>
                    </div>
                    <span className="font-serif font-bold text-sm text-[#1c1c18]">
                      1,766,450,000 ₫
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#576151]"></span>
                      <span className="text-[#1c1c18]">Phí Lưu Ký Sàn 8.0% (Platform Take-Rate)</span>
                    </div>
                    <span className="font-serif font-bold text-sm text-[#576151]">
                      148,250,000 ₫
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#7b766f]"></span>
                      <span className="text-[#1c1c18]">Tổng Giao Dịch Thành Công (Completed Lots)</span>
                    </div>
                    <span className="font-semibold text-xs text-[#1c1c18]">
                      218 đơn hàng hoàn tất
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#ba1a1a]"></span>
                      <span className="text-[#1c1c18]">Hoàn Tiền Tranh Chấp/Đổi Trả (Dispute Refunds)</span>
                    </div>
                    <span className="font-serif font-bold text-sm text-[#ba1a1a]">
                      46,200,000 ₫ (4 vụ việc)
                    </span>
                  </div>
                </div>
              </div>

              <Link
                to="/admin/thrift/listings"
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#f1ede6] hover:bg-[#ebe8e1] text-[#1c1c18] text-xs font-semibold transition-all"
              >
                <span>Xem Hồ Sơ Đơn THRIFT (View THRIFT Orders)</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </Link>
            </div>
          </div>
        </section>

        {/* 5. REALTIME AUDIT TRANSACTION REGISTRY (Sổ Kê Giao Dịch Toàn Nền Tảng) */}
        <section className="bg-white rounded-2xl shadow-sm border border-[#ccc5bc]/30 p-6 flex flex-col gap-5">
          {/* Header & Controls */}
          <div className="flex flex-col gap-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h2 className="font-serif text-xl font-bold text-[#1c1c18]">
                  Sổ Kê Giao Dịch Toàn Nền Tảng
                </h2>
                <p className="text-xs text-[#7b766f]">
                  Đối soát trực tiếp nhật ký Webhook VNPay IPN và khóa bảo chứng Smart Escrow
                </p>
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#d8e3ce]/50 text-[#5b6655] text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-[#576151]"></span>
                <span>VNPay IPN Active (99.98% Healthy)</span>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center bg-[#f7f3ec] p-3 rounded-xl border border-[#ccc5bc]/30">
              {/* Search */}
              <div className="md:col-span-5 relative">
                <span className="material-symbols-outlined text-[18px] text-[#7b766f] absolute left-3 top-1/2 -translate-y-1/2">
                  search
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm theo Transaction ID, VNPay Ref, Mã Đơn Hàng..."
                  className="w-full pl-9 pr-4 py-2 rounded-lg bg-white text-[#1c1c18] text-xs placeholder:text-[#7b766f] border border-[#ccc5bc]/40 focus:outline-none focus:ring-1 focus:ring-[#141310] shadow-sm"
                />
              </div>

              {/* Type Filter */}
              <div className="md:col-span-4">
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value as TxnType)}
                  className="w-full px-3 py-2 rounded-lg bg-white text-[#1c1c18] text-xs border border-[#ccc5bc]/40 focus:outline-none focus:ring-1 focus:ring-[#141310] shadow-sm cursor-pointer"
                >
                  <option value="ALL">Loại giao dịch: Tất Cả</option>
                  <option value="RENT_DEPOSIT">RENT DEPOSIT (Ký quỹ thuê)</option>
                  <option value="RENT_FEE">RENT FEE (Phí thuê sản phẩm)</option>
                  <option value="THRIFT_PURCHASE">THRIFT PURCHASE (Thanh toán mua đứt)</option>
                  <option value="DEPOSIT_REFUND">DEPOSIT FULL REFUND (Hoàn 100% cọc)</option>
                  <option value="PENALTY">PENALTY DEDUCTION (Khấu trừ tổn thất)</option>
                  <option value="BUYER_REFUND">BUYER REFUND (Hoàn tiền mua)</option>
                </select>
              </div>

              {/* Status Filter */}
              <div className="md:col-span-3">
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value as TxnStatus)}
                  className="w-full px-3 py-2 rounded-lg bg-white text-[#1c1c18] text-xs border border-[#ccc5bc]/40 focus:outline-none focus:ring-1 focus:ring-[#141310] shadow-sm cursor-pointer"
                >
                  <option value="ALL">Trạng thái: Tất Cả</option>
                  <option value="HELD">Đã Khóa Smart Escrow</option>
                  <option value="SETTLED">Đã Quyết Toán (Settled)</option>
                  <option value="REFUNDED">Đã Hoàn Trả (Refunded)</option>
                  <option value="DEDUCTED">Đã Khấu Trừ (Liquidated)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#f1ede6] text-[#4a463f] text-[11px] uppercase tracking-wider font-semibold border-b border-[#ccc5bc]/30">
                  <th className="py-3 px-4 rounded-l" scope="col">Mã GD / VNPay Ref</th>
                  <th className="py-3 px-4" scope="col">Đơn Hàng</th>
                  <th className="py-3 px-4" scope="col">Bản Chất Giao Dịch</th>
                  <th className="py-3 px-4 text-right" scope="col">Số Tiền (₫)</th>
                  <th className="py-3 px-4" scope="col">Cổng &amp; Đối Soát</th>
                  <th className="py-3 px-4" scope="col">Thời Gian (UTC+7)</th>
                  <th className="py-3 px-4 text-center rounded-r" scope="col">Hồ Sơ Kế Toán</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1ede6]">
                {filteredTxns.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-[#7b766f]">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <span className="material-symbols-outlined text-4xl text-[#ccc5bc]">
                          receipt_long
                        </span>
                        <p className="text-sm font-semibold text-[#1c1c18]">
                          Không tìm thấy giao dịch nào phù hợp
                        </p>
                        <p className="text-xs text-[#7b766f]">
                          Hãy thử điều chỉnh từ khóa tìm kiếm hoặc bỏ chọn các bộ lọc phân loại.
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setSearchQuery("");
                            setSelectedType("ALL");
                            setSelectedStatus("ALL");
                          }}
                          className="mt-2 px-3.5 py-1.5 rounded-lg bg-[#141310] text-white text-xs font-semibold"
                        >
                          Đặt Lại Bộ Lọc
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredTxns.map((t) => (
                    <tr
                      key={t.id}
                      className="hover:bg-[#f7f3ec] transition-colors"
                    >
                      <td className="py-3.5 px-4 font-mono text-xs text-[#1c1c18] whitespace-nowrap">
                        <div className="font-bold text-[#141310]">{t.id}</div>
                        <div className="text-[#7b766f] text-[11px]">{t.vnpayRef}</div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-semibold text-[#141310] flex items-center gap-1">
                          <span>{t.orderCode}</span>
                        </span>
                        <span className="text-[11px] text-[#7b766f]">{t.orderSubtitle}</span>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-bold ${t.typeBadgeColor}`}
                        >
                          <span className="material-symbols-outlined text-[12px]">
                            {t.type === "RENT_DEPOSIT"
                              ? "lock"
                              : t.type === "RENT_FEE"
                              ? "check_circle"
                              : t.type === "THRIFT_PURCHASE"
                              ? "store"
                              : t.type === "DEPOSIT_REFUND"
                              ? "replay"
                              : "warning"}
                          </span>
                          <span>{t.typeLabel}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="font-bold text-xs text-[#1c1c18]">
                          {t.amountPrefix || ""}
                          {t.amount.toLocaleString("vi-VN")} ₫
                        </div>
                        <span
                          className={`text-[10px] uppercase font-bold tracking-wider ${t.amountBadgeColor}`}
                        >
                          {t.amountBadge}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-[#1c1c18] font-medium">
                          <span
                            className={`w-2 h-2 rounded-full ${t.gatewayIndicatorColor}`}
                          ></span>
                          <span>{t.gatewayName}</span>
                        </div>
                        <span className="text-[11px] text-[#7b766f]">{t.gatewaySub}</span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-[#7b766f] whitespace-nowrap">
                        <div>{t.dateDisplay}</div>
                        <div>{t.timeDisplay}</div>
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setSelectedTxn(t)}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-[#f1ede6] text-[#1c1c18] hover:bg-[#ebe8e1] transition-colors text-xs font-semibold border border-[#ccc5bc]/30"
                        >
                          <span>Đối Soát ↗</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer & Pagination */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-[#f1ede6] text-xs text-[#7b766f]">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px] text-[#576151]">verified</span>
              <span>
                Hiển thị {filteredTxns.length} trong số 1,842 bản ghi đối soát VNPay webhook • Trang 1 / 308
              </span>
            </div>
            <div className="inline-flex items-center gap-1">
              <button
                type="button"
                disabled
                className="p-1.5 rounded-lg bg-[#f1ede6] text-[#7b766f] opacity-50 cursor-not-allowed"
              >
                <span className="material-symbols-outlined text-[16px]">chevron_left</span>
              </button>
              <button
                type="button"
                className="px-2.5 py-1 rounded-lg bg-[#141310] text-white font-bold"
              >
                1
              </button>
              <button
                type="button"
                className="px-2.5 py-1 rounded-lg bg-[#f1ede6] text-[#1c1c18] hover:bg-[#ebe8e1]"
              >
                2
              </button>
              <button
                type="button"
                className="px-2.5 py-1 rounded-lg bg-[#f1ede6] text-[#1c1c18] hover:bg-[#ebe8e1]"
              >
                3
              </button>
              <span className="px-1 text-[#7b766f]">...</span>
              <button
                type="button"
                className="px-2.5 py-1 rounded-lg bg-[#f1ede6] text-[#1c1c18] hover:bg-[#ebe8e1]"
              >
                308
              </button>
              <button
                type="button"
                className="p-1.5 rounded-lg bg-[#f1ede6] text-[#1c1c18] hover:bg-[#ebe8e1]"
              >
                <span className="material-symbols-outlined text-[16px]">chevron_right</span>
              </button>
            </div>
          </div>
        </section>

        {/* ESCROW SECURITY & INTEGRITY BOTTOM CARD */}
        <section className="bg-[#f1ede6] p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm border border-[#ccc5bc]/30">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-[#141310] shrink-0 shadow-sm">
              <span className="material-symbols-outlined text-[24px]">policy</span>
            </div>
            <div className="flex flex-col">
              <span className="font-serif text-base font-bold text-[#1c1c18]">
                Cơ Chế Bảo Vệ Quỹ Ủy Thác Smart Escrow 2026
              </span>
              <p className="text-xs text-[#4a463f] leading-relaxed">
                Mọi lệnh hoàn cọc hoặc xử lý vi phạm đều được đối ứng 1:1 qua cổng VNPay Payment API và được bảo hiểm bởi Quỹ Ký Thác Tái Tạo Tuần Hoàn (B-Corp Resilience Trust).
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setShowInsuranceModal(true)}
              className="px-4 py-2 rounded-lg bg-white hover:bg-[#ebe8e1] text-[#1c1c18] text-xs font-semibold transition-colors shadow-sm border border-[#ccc5bc]/40"
            >
              Xem Điều Lệ Bảo Hiểm
            </button>
            <button
              type="button"
              onClick={() => setShowAuditCertModal(true)}
              className="px-4 py-2 rounded-lg bg-[#141310] text-[#fdf9f2] hover:bg-[#292724] text-xs font-semibold transition-colors shadow-sm"
            >
              Chứng Thư Kiểm Toán Độc Lập
            </button>
          </div>
        </section>
      </div>

      {/* MODAL 1: TRANSACTION AUDIT DETAIL MODAL */}
      {selectedTxn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#fdf9f2] rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-[#ccc5bc]/50 space-y-4">
            <div className="flex items-start justify-between pb-3 border-b border-[#ccc5bc]/30">
              <div className="space-y-1">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#f1ede6] text-[#141310]">
                  {selectedTxn.id}
                </span>
                <h3 className="font-serif text-lg font-bold text-[#1c1c18]">
                  Chi Tiết Đối Soát Kế Toán
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTxn(null)}
                className="w-8 h-8 rounded-full bg-[#f1ede6] hover:bg-[#ebe8e1] flex items-center justify-center text-xs"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-[#4a463f]">
              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-white border border-[#ccc5bc]/30">
                <div>
                  <span className="text-[10px] text-[#7b766f] block">VNPay Ref ID</span>
                  <strong className="font-mono text-[#1c1c18]">{selectedTxn.vnpayRef}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-[#7b766f] block">Mã Đơn Hàng</span>
                  <strong className="font-mono text-[#1c1c18]">{selectedTxn.orderCode}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-[#7b766f] block">Bản Chất Giao Dịch</span>
                  <strong className="text-[#1c1c18]">{selectedTxn.typeLabel}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-[#7b766f] block">Số Tiền Giao Dịch</span>
                  <strong className="font-serif text-sm text-[#141310]">
                    {selectedTxn.amount.toLocaleString("vi-VN")} ₫
                  </strong>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white border border-[#ccc5bc]/30 space-y-1 font-mono text-[11px]">
                <div className="text-[10px] text-[#7b766f] uppercase font-bold font-sans">
                  Chữ Ký Điện Tử Bất Biến (Audit Hash)
                </div>
                <div className="text-[#141310] break-all">
                  {selectedTxn.shaSignature || "sha256:88fa2901cde9483012a9bc48..."}
                </div>
                <div className="text-[10px] text-[#576151] font-sans pt-1">
                  ✓ Trạng thái: Đối soát khớp 100% với Gateway Ledger
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-[#ccc5bc]/30">
              <button
                type="button"
                onClick={() => setSelectedTxn(null)}
                className="px-4 py-2 rounded-lg bg-[#141310] text-[#fdf9f2] text-xs font-semibold hover:bg-[#292724] transition-colors"
              >
                Đóng Đối Soát
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: INSURANCE CHARTER */}
      {showInsuranceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#fdf9f2] rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#ccc5bc]/50 space-y-4 text-xs">
            <div className="flex items-start justify-between pb-2 border-b border-[#ccc5bc]/30">
              <h3 className="font-serif text-base font-bold text-[#1c1c18]">
                Điều Lệ Quỹ Ký Thác Tái Tạo B-Corp
              </h3>
              <button
                type="button"
                onClick={() => setShowInsuranceModal(false)}
                className="w-7 h-7 rounded-full bg-[#f1ede6] hover:bg-[#ebe8e1] flex items-center justify-center text-xs"
              >
                ✕
              </button>
            </div>
            <p className="text-[#4a463f] leading-relaxed">
              Mọi tài sản lưu hành trên hệ sinh thái ReUse Hub đều được bảo hộ độc lập bởi quỹ tín thác phân lập (Segregated Account) tại ngân hàng đối tác giám sát Vietcombank SVB. Quỹ hoạt động theo quy tắc không thâm nhập vốn lưu động của sàn.
            </p>
            <div className="flex justify-end pt-2 border-t border-[#ccc5bc]/30">
              <button
                type="button"
                onClick={() => setShowInsuranceModal(false)}
                className="px-4 py-2 rounded-lg bg-[#141310] text-white text-xs font-semibold"
              >
                Đã Hiểu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: AUDIT CERTIFICATE */}
      {showAuditCertModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#fdf9f2] rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#ccc5bc]/50 space-y-4 text-xs">
            <div className="flex items-start justify-between pb-2 border-b border-[#ccc5bc]/30">
              <h3 className="font-serif text-base font-bold text-[#1c1c18]">
                Chứng Thư Kiểm Toán Tài Chính Độc Lập
              </h3>
              <button
                type="button"
                onClick={() => setShowAuditCertModal(false)}
                className="w-7 h-7 rounded-full bg-[#f1ede6] hover:bg-[#ebe8e1] flex items-center justify-center text-xs"
              >
                ✕
              </button>
            </div>
            <div className="p-3 bg-white rounded-xl border border-[#ccc5bc]/30 space-y-1 font-mono text-[11px]">
              <div>Audit Node: #FIN-AUDIT-VN-2026-Q4</div>
              <div>Standard: ISO/IEC 27001 &amp; Circular Accounting v4.2</div>
              <div>Verifier: Independent Financial Review Board</div>
              <div className="text-[#576151] pt-1">
                ✓ Sổ cái bất biến được đối chiếu khớp hoàn toàn với VNPay IPN Logs.
              </div>
            </div>
            <div className="flex justify-end pt-2 border-t border-[#ccc5bc]/30">
              <button
                type="button"
                onClick={() => setShowAuditCertModal(false)}
                className="px-4 py-2 rounded-lg bg-[#141310] text-white text-xs font-semibold"
              >
                Xác Nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlatformFinance;
