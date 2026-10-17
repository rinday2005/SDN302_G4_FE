import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";

export type DisputeStatus = "OPEN" | "UNDER_REVIEW" | "RESOLVED" | "CLOSED";
export type DisputeType = "RENT" | "THRIFT" | "PAYMENT" | "DELIVERY";
export type DisputeSort = "sla-asc" | "date-desc" | "date-asc" | "escrow-desc";

export interface DisputeItem {
  id: string; // e.g., "#RH-D4091"
  orderCode: string; // e.g., "RENT #RO-8821" or "THRIFT #TO-4412"
  orderUrl: string;
  productName: string;
  orderPriceNote: string;
  customerName: string;
  customerUrl: string;
  customerTrust: string;
  shopName: string;
  shopOwner: string;
  shopUrl: string;
  categoryTag: string; // e.g., "RENT • DEPOSIT DISPUTE"
  description: string;
  createdAtDisplay: string;
  createdAtTime: string;
  slaDisplay: string;
  isUrgentSla: boolean;
  status: DisputeStatus;
  disputeType: DisputeType;
  escrowAmount: number;
  arbitrationVerdict?: string;
  labNote?: string;
}

const INITIAL_DISPUTES: DisputeItem[] = [
  {
    id: "#RH-D4091",
    orderCode: "RENT #RO-8821",
    orderUrl: "/rent/orders/RO-8821",
    productName: "Leica M6 Classic 0.72x Kit",
    orderPriceNote: "850,000 ₫/ngày • Cọc: 18,000,000 ₫",
    customerName: "Lê Minh Khoa",
    customerUrl: "/admin/users",
    customerTrust: "KYC T2 • 98% Tín Nhiệm",
    shopName: "Kyoto Archival Optics",
    shopOwner: "Vũ Thanh Tùng (Chủ xưởng)",
    shopUrl: "/admin/users",
    categoryTag: "RENT • DEPOSIT DISPUTE",
    description: "Tranh chấp khấu trừ cọc 2,500,000 ₫ do nghi vấn hao mòn màn trập vải sau chuyến thuê 3 ngày.",
    createdAtDisplay: "24/10/2026",
    createdAtTime: "08:30 sáng",
    slaDisplay: "SLA: 1h 45m (12:00 hôm nay)",
    isUrgentSla: true,
    status: "OPEN",
    disputeType: "RENT",
    escrowAmount: 2500000,
  },
  {
    id: "#RH-D3882",
    orderCode: "RENT #RO-9104",
    orderUrl: "/rent/orders/RO-9104",
    productName: "Hasselblad 503CX + Planar 80mm",
    orderPriceNote: "1,200,000 ₫/ngày • Cọc: 25,000,000 ₫",
    customerName: "Đoàn Thị Mai",
    customerUrl: "/admin/users",
    customerTrust: "KYC Verified Tier-1",
    shopName: "Saigon Cinema Vault",
    shopOwner: "Anh Nguyen Le (Lab Lead)",
    shopUrl: "/admin/users",
    categoryTag: "RENT • RETURN DAMAGE",
    description: "Nghi vấn trầy xước ngàm ống kính Carl Zeiss bayonet trong quá trình tháo lắp khi tác nghiệp thực địa.",
    createdAtDisplay: "23/10/2026",
    createdAtTime: "14:15 chiều",
    slaDisplay: "SLA: Còn 18h",
    isUrgentSla: false,
    status: "UNDER_REVIEW",
    disputeType: "RENT",
    escrowAmount: 6000000,
    labNote: "LAB-OPT-33: Đang đo kiểm độ chuẩn trục vi sai tại phòng lab.",
  },
  {
    id: "#RH-D3710",
    orderCode: "THRIFT #TO-4412",
    orderUrl: "/thrift/orders/TO-4412",
    productName: "Contax T2 Titanium Champagne",
    orderPriceNote: "Giá mua: 28,500,000 ₫ (Escrow Giữ)",
    customerName: "Trần Văn An",
    customerUrl: "/admin/users",
    customerTrust: "Người sưu tầm lưu trữ",
    shopName: "Heritage Audio & Optics",
    shopOwner: "Store Verified Top Seller",
    shopUrl: "/admin/users",
    categoryTag: "THRIFT • CONDITION ISSUE",
    description: "Sai lệch mô tả: Khách báo viền thấu kính Carl Zeiss Sonnar có mảng ố rễ tre nhẹ chưa được ghi trong biên bản lab.",
    createdAtDisplay: "22/10/2026",
    createdAtTime: "11:20 trưa",
    slaDisplay: "SLA: Còn 8h",
    isUrgentSla: true,
    status: "OPEN",
    disputeType: "THRIFT",
    escrowAmount: 28500000,
  },
  {
    id: "#RH-D3644",
    orderCode: "THRIFT #TO-3901",
    orderUrl: "/thrift/orders/TO-3901",
    productName: "Ghế Eames LCW Walnut Plywood",
    orderPriceNote: "Giá trị: 16,800,000 ₫",
    customerName: "Nguyễn Lan",
    customerUrl: "/admin/users",
    customerTrust: "Kiến trúc sư • Hà Nội",
    shopName: "Saigon Mid-Century Vault",
    shopOwner: "Chuyên gia nội thất cổ điển",
    shopUrl: "/admin/users",
    categoryTag: "DELIVERY • SEAL TAMPERING",
    description: "Rách tem niêm phong vận chuyển gỗ, xước nhẹ phần chân đế uốn cong lúc vận chuyển liên tỉnh.",
    createdAtDisplay: "20/10/2026",
    createdAtTime: "16:00 chiều",
    slaDisplay: "Hoàn tất giải trình",
    isUrgentSla: false,
    status: "RESOLVED",
    disputeType: "DELIVERY",
    escrowAmount: 3200000,
    arbitrationVerdict: "Bảo hiểm lưu thông Circularity B-Corp đã chi trả 3,200,000 ₫ phí phục chế xi sáp cho xưởng.",
  },
  {
    id: "#RH-D3502",
    orderCode: "RENT #RO-7731",
    orderUrl: "/rent/orders/RO-7731",
    productName: "Sony FX3 Cinema Rig + XLR Handle",
    orderPriceNote: "1,400,000 ₫/ngày",
    customerName: "Trần Hoàng",
    customerUrl: "/admin/users",
    customerTrust: "Đạo diễn hình ảnh độc lập",
    shopName: "Hanoi Cinematic Hub",
    shopOwner: "Đối tác kho thiết bị RENT",
    shopUrl: "/admin/users",
    categoryTag: "RENT • MISSING ITEM",
    description: "Thiếu hood che sáng carbon và 1 ốc khóa nato rail khi nhận trả thiết bị tại kho lưu ký.",
    createdAtDisplay: "18/10/2026",
    createdAtTime: "09:40 sáng",
    slaDisplay: "Đã ký biên bản bù",
    isUrgentSla: false,
    status: "CLOSED",
    disputeType: "RENT",
    escrowAmount: 850000,
    arbitrationVerdict: "Khách hàng đã hoàn trả bổ sung phụ kiện nguyên vẹn sau 24h. Hoàn trả 100% cọc.",
  },
  {
    id: "#RH-D3419",
    orderCode: "RENT #RO-6512",
    orderUrl: "/rent/orders/RO-6512",
    productName: "Teenage Engineering OP-1 Synthesizer",
    orderPriceNote: "Ký quỹ hoàn trả: 12,000,000 ₫",
    customerName: "Phạm Gia Bảo",
    customerUrl: "/admin/users",
    customerTrust: "Nghệ sĩ âm thanh",
    shopName: "Bauhaus Sound Lab",
    shopOwner: "Audio Archival Hub",
    shopUrl: "/admin/users",
    categoryTag: "PAYMENT • ESCROW DELAY",
    description: "Cổng VNPay ghi nhận độ trễ hoàn cọc sau khi chủ xưởng đã ký biên bản bàn giao an toàn 24h.",
    createdAtDisplay: "15/10/2026",
    createdAtTime: "10:15 sáng",
    slaDisplay: "Hạch toán thủ công",
    isUrgentSla: false,
    status: "RESOLVED",
    disputeType: "PAYMENT",
    escrowAmount: 12000000,
    arbitrationVerdict: "Đối soát kế toán xác nhận lệnh hoàn tiền tự động đã chuyển khoản thành công.",
  },
];

export const DisputeManagement: React.FC = () => {
  const [disputes, setDisputes] = useState<DisputeItem[]>(INITIAL_DISPUTES);
  const [currentStatus, setCurrentStatus] = useState<"ALL" | DisputeStatus>("ALL");
  const [currentType, setCurrentType] = useState<"ALL" | DisputeType>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<DisputeSort>("sla-asc");

  // Selected Dispute for Arbitration Decision Modal
  const [selectedDispute, setSelectedDispute] = useState<DisputeItem | null>(null);
  const [decisionType, setDecisionType] = useState<
    "REFUND_BUYER" | "PAY_SHOP" | "SPLIT_DEDUCTION" | "INSURANCE"
  >("SPLIT_DEDUCTION");
  const [deductionAmount, setDeductionAmount] = useState<number>(1000000);
  const [arbitrationNotes, setArbitrationNotes] = useState("");

  // Protocol Modal
  const [showProtocolModal, setShowProtocolModal] = useState(false);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // KPI Calculations
  const metrics = useMemo(() => {
    const openCount = disputes.filter((d) => d.status === "OPEN").length;
    const underReviewCount = disputes.filter((d) => d.status === "UNDER_REVIEW").length;
    const resolvedCount = disputes.filter((d) => d.status === "RESOLVED").length;
    const urgentCount = disputes.filter((d) => d.status === "OPEN" && d.isUrgentSla).length;

    const escrowUnderDispute = disputes
      .filter((d) => d.status === "OPEN" || d.status === "UNDER_REVIEW")
      .reduce((sum, d) => sum + d.escrowAmount, 0);

    return {
      total: 28,
      open: openCount > 0 ? openCount : 6,
      underReview: underReviewCount > 0 ? underReviewCount : 4,
      resolved: resolvedCount > 0 ? resolvedCount : 18,
      urgent: urgentCount > 0 ? urgentCount : 3,
      escrowAmountDisplay: (escrowUnderDispute / 1000000).toFixed(2),
    };
  }, [disputes]);

  // Tab counts
  const tabCounts = useMemo(() => {
    return {
      ALL: 28,
      OPEN: disputes.filter((d) => d.status === "OPEN").length || 6,
      UNDER_REVIEW: disputes.filter((d) => d.status === "UNDER_REVIEW").length || 4,
      RESOLVED: disputes.filter((d) => d.status === "RESOLVED").length || 15,
      CLOSED: disputes.filter((d) => d.status === "CLOSED").length || 3,
    };
  }, [disputes]);

  // Filter & Sort Logic
  const filteredDisputes = useMemo(() => {
    let result = disputes.filter((item) => {
      // Status tab
      if (currentStatus !== "ALL" && item.status !== currentStatus) return false;

      // Type pill
      if (currentType !== "ALL" && item.disputeType !== currentType) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchId = item.id.toLowerCase().includes(q);
        const matchOrder = item.orderCode.toLowerCase().includes(q);
        const matchProduct = item.productName.toLowerCase().includes(q);
        const matchCustomer = item.customerName.toLowerCase().includes(q);
        const matchShop = item.shopName.toLowerCase().includes(q);
        const matchDesc = item.description.toLowerCase().includes(q);
        if (!matchId && !matchOrder && !matchProduct && !matchCustomer && !matchShop && !matchDesc) {
          return false;
        }
      }

      return true;
    });

    // Sorting
    result.sort((a, b) => {
      if (sortBy === "escrow-desc") {
        return b.escrowAmount - a.escrowAmount;
      }
      if (sortBy === "sla-asc") {
        if (a.isUrgentSla && !b.isUrgentSla) return -1;
        if (!a.isUrgentSla && b.isUrgentSla) return 1;
        return a.id.localeCompare(b.id);
      }
      if (sortBy === "date-desc") {
        return b.createdAtDisplay.localeCompare(a.createdAtDisplay);
      }
      if (sortBy === "date-asc") {
        return a.createdAtDisplay.localeCompare(b.createdAtDisplay);
      }
      return 0;
    });

    return result;
  }, [disputes, currentStatus, currentType, searchQuery, sortBy]);

  // Handle Review Modal Open
  const handleOpenReview = (item: DisputeItem) => {
    setSelectedDispute(item);
    setDecisionType("SPLIT_DEDUCTION");
    setDeductionAmount(Math.round(item.escrowAmount * 0.5));
    setArbitrationNotes("");
  };

  // Submit Arbitration Verdict
  const handleSubmitVerdict = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDispute) return;

    let verdictText = "";
    if (decisionType === "REFUND_BUYER") {
      verdictText = "Phán quyết Trọng Tài: Hoàn trả 100% tiền ký quỹ cho Khách hàng. Đơn hàng hoàn tất đối soát.";
    } else if (decisionType === "PAY_SHOP") {
      verdictText = `Phán quyết Trọng Tài: Bồi thường toàn bộ tiền ký quỹ (${selectedDispute.escrowAmount.toLocaleString(
        "vi-VN"
      )} ₫) cho Chủ Xưởng.`;
    } else if (decisionType === "SPLIT_DEDUCTION") {
      verdictText = `Phán quyết Trọng Tài: Hòa giải khấu trừ ${deductionAmount.toLocaleString(
        "vi-VN"
      )} ₫ đền bù hao mòn cho Chủ Xưởng; hoàn trả phần còn lại cho Khách hàng.`;
    } else if (decisionType === "INSURANCE") {
      verdictText = "Phán quyết Trọng Tài: Kích hoạt Quỹ Bảo Hiểm B-Corp Circularity chi trả đền bù tổn hại ngoài ý muốn.";
    }

    if (arbitrationNotes.trim()) {
      verdictText += ` Ghi chú thẩm định: ${arbitrationNotes.trim()}`;
    }

    setDisputes((prev) =>
      prev.map((item) =>
        item.id === selectedDispute.id
          ? {
              ...item,
              status: "RESOLVED",
              arbitrationVerdict: verdictText,
            }
          : item
      )
    );

    showToast(`Đã ban hành phán quyết Trọng Tài Multi-Sig cho vụ việc ${selectedDispute.id}!`);
    setSelectedDispute(null);
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      "Mã Tranh Chấp",
      "Mã Đơn Hàng",
      "Tên Hiện Vật",
      "Khách Hàng",
      "Chủ Xưởng",
      "Phân Loại",
      "Ký Quỹ Tranh Chấp (VND)",
      "Trạng Thái",
      "Ngày Tạo",
      "Mô Tả",
    ];

    const rows = filteredDisputes.map((d) => [
      d.id,
      d.orderCode,
      `"${d.productName.replace(/"/g, '""')}"`,
      `"${d.customerName}"`,
      `"${d.shopName}"`,
      d.categoryTag,
      d.escrowAmount,
      d.status,
      `"${d.createdAtDisplay} ${d.createdAtTime}"`,
      `"${d.description.replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Bien_Ban_Tranh_Chap_ReUseHub_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Đã tải xuống biên bản đối soát tranh chấp CSV.");
  };

  const handleResetFilters = () => {
    setCurrentStatus("ALL");
    setCurrentType("ALL");
    setSearchQuery("");
    setSortBy("sla-asc");
    showToast("Đã đặt lại toàn bộ bộ lọc về mặc định.");
  };

  return (
    <div className="flex flex-col w-full bg-[#fdf8f5] text-[#1c1b19] font-sans min-h-screen">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 bg-[#1c1b19] text-[#fdf8f5] rounded-xl shadow-2xl border border-[#cfc5b8]/30 animate-bounce">
          <span className="material-symbols-outlined text-[20px] text-[#caebc9]">
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

      {/* Top Protocol Alert Strip / System Notice */}
      <div className="w-full bg-[#ece7e4] px-4 md:px-12 py-1.5 text-[#4c463c] text-[11px] font-mono border-b border-[#cfc5b8]/40">
        <div className="max-w-7xl mx-auto w-full flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#48654b] inline-block animate-pulse"></span>
            <span className="font-semibold text-[#6c5937] uppercase">
              CƠ CHẾ KÝ QUỸ THÔNG MINH (ESCROW MULTI-SIG TRIBUNAL)
            </span>
            <span className="text-[#cfc5b8]">•</span>
            <span>Hội Đồng Thẩm Định Độc Lập</span>
            <span className="text-[#cfc5b8]">•</span>
            <span>Không Cho Phép Mạo Danh (Anti-Impersonation Active)</span>
          </div>
          <div className="flex items-center gap-3 text-[#6c5937]">
            <span className="font-mono text-[#4c463c]">NODE-ARBITRATION-VN01</span>
            <span className="text-[#cfc5b8]">|</span>
            <span className="text-[#48654b] font-medium">Bảo hiểm lưu thông: 100% Bảo Toàn</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 w-full py-8 flex flex-col gap-6">
        {/* 1. Breadcrumb & Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="flex flex-col gap-1.5">
            <nav
              aria-label="Breadcrumb"
              className="flex items-center gap-1.5 text-xs text-[#4c463c] uppercase tracking-wider font-semibold"
            >
              <Link to="/admin/dashboard" className="hover:text-[#6c5937] transition-colors">
                Admin
              </Link>
              <span className="text-[#cfc5b8]">/</span>
              <span>Quản Trị Hệ Thống</span>
              <span className="text-[#cfc5b8]">/</span>
              <span className="text-[#1c1b19] font-bold">Tranh Chấp Sàn (/admin/disputes)</span>
            </nav>
            <h1 className="text-3xl sm:text-4xl font-serif text-[#1c1b19] font-bold tracking-tight">
              Disputes &amp; Arbitration
            </h1>
            <p className="text-xs sm:text-sm text-[#4c463c] max-w-3xl leading-relaxed">
              Thẩm định độc lập tranh chấp lưu thông tuần hoàn, bảo chứng ký quỹ Smart Escrow, giải quyết bất đồng hiện vật sàn RENT &amp; giao dịch sàn THRIFT theo chuẩn trọng tài trung lập.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 self-start md:self-end">
            <button
              type="button"
              onClick={handleExportCSV}
              className="px-4 py-2 bg-[#f2ede9] hover:bg-[#ece7e4] text-[#1c1b19] text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm border border-[#cfc5b8]/30"
            >
              <span className="material-symbols-outlined text-[16px] text-[#6c5937]">
                file_download
              </span>
              <span>Xuất Biên Bản Đối Soát</span>
            </button>
            <button
              type="button"
              onClick={() => setShowProtocolModal(true)}
              className="px-4 py-2 bg-[#e6e2de] hover:bg-[#ece7e4] text-[#1c1b19] text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm border border-[#cfc5b8]/40"
            >
              <span className="material-symbols-outlined text-[16px] text-[#48654b]">
                verified_user
              </span>
              <span>Quy Chế Trọng Tài B-Corp</span>
            </button>
          </div>
        </div>

        {/* 2. KPI Cards (4 summary cards) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: OPEN */}
          <div className="p-4 bg-[#f7f3ef] rounded-xl flex flex-col justify-between shadow-sm border border-[#cfc5b8]/30 relative overflow-hidden">
            <div className="flex items-start justify-between mb-2">
              <div className="flex flex-col">
                <span className="text-[11px] uppercase tracking-wider text-[#4c463c] font-semibold">
                  Đang Mở (Open)
                </span>
                <span className="text-3xl font-serif text-[#1c1b19] mt-1 font-bold">
                  {metrics.open < 10 ? `0${metrics.open}` : metrics.open}{" "}
                  <span className="text-xs font-sans font-normal text-[#4c463c]">vụ việc</span>
                </span>
              </div>
              <span className="p-2 bg-[#e6e2de] rounded-lg text-[#ba1a1a]">
                <span className="material-symbols-outlined text-[20px]">warning</span>
              </span>
            </div>
            <div className="mt-2 pt-2 border-t border-[#cfc5b8]/20 flex items-center gap-1.5 text-xs text-[#ba1a1a] font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#ba1a1a] animate-pulse"></span>
              <span>{metrics.urgent} Khẩn cấp cần giải quyết &lt; 2h</span>
            </div>
          </div>

          {/* Card 2: UNDER REVIEW */}
          <div className="p-4 bg-[#f7f3ef] rounded-xl flex flex-col justify-between shadow-sm border border-[#cfc5b8]/30">
            <div className="flex items-start justify-between mb-2">
              <div className="flex flex-col">
                <span className="text-[11px] uppercase tracking-wider text-[#4c463c] font-semibold">
                  Đang Thẩm Định
                </span>
                <span className="text-3xl font-serif text-[#1c1b19] mt-1 font-bold">
                  {metrics.underReview < 10 ? `0${metrics.underReview}` : metrics.underReview}{" "}
                  <span className="text-xs font-sans font-normal text-[#4c463c]">hồ sơ</span>
                </span>
              </div>
              <span className="p-2 bg-[#e6e2de] rounded-lg text-[#7f5227]">
                <span className="material-symbols-outlined text-[20px]">science</span>
              </span>
            </div>
            <div className="mt-2 pt-2 border-t border-[#cfc5b8]/20 text-xs text-[#4c463c] truncate">
              <span>Đối soát ảnh niêm phong &amp; viễn thám</span>
            </div>
          </div>

          {/* Card 3: ESCROW UNDER DISPUTE */}
          <div className="p-4 bg-[#f7f3ef] rounded-xl flex flex-col justify-between shadow-sm border border-[#cfc5b8]/30">
            <div className="flex items-start justify-between mb-2">
              <div className="flex flex-col">
                <span className="text-[11px] uppercase tracking-wider text-[#4c463c] font-semibold">
                  Ký Quỹ Đang Phong Tỏa
                </span>
                <span className="text-3xl font-serif text-[#1c1b19] mt-1 font-bold">
                  {metrics.escrowAmountDisplay}M{" "}
                  <span className="text-xs font-sans font-normal text-[#4c463c]">₫</span>
                </span>
              </div>
              <span className="p-2 bg-[#caebc9]/50 rounded-lg text-[#48654b]">
                <span className="material-symbols-outlined text-[20px]">lock</span>
              </span>
            </div>
            <div className="mt-2 pt-2 border-t border-[#cfc5b8]/20 text-xs text-[#48654b] flex items-center gap-1 font-semibold">
              <span className="material-symbols-outlined text-[14px]">shield</span>
              <span>Bảo hộ đa chữ ký Multi-Sig (2/3)</span>
            </div>
          </div>

          {/* Card 4: RESOLVED / CLOSED */}
          <div className="p-4 bg-[#f7f3ef] rounded-xl flex flex-col justify-between shadow-sm border border-[#cfc5b8]/30">
            <div className="flex items-start justify-between mb-2">
              <div className="flex flex-col">
                <span className="text-[11px] uppercase tracking-wider text-[#4c463c] font-semibold">
                  Đã Giải Quyết Xong
                </span>
                <span className="text-3xl font-serif text-[#1c1b19] mt-1 font-bold">
                  {metrics.resolved}{" "}
                  <span className="text-xs font-sans font-normal text-[#4c463c]">vụ việc</span>
                </span>
              </div>
              <span className="p-2 bg-[#e6e2de] rounded-lg text-[#48654b]">
                <span className="material-symbols-outlined text-[20px]">task_alt</span>
              </span>
            </div>
            <div className="mt-2 pt-2 border-t border-[#cfc5b8]/20 text-xs text-[#48654b] font-semibold">
              <span>Tỷ lệ hòa giải thành công: 94.2%</span>
            </div>
          </div>
        </div>

        {/* 4. Governance Protocol Callout (Strict Anti-Impersonation & Neutral Stance) */}
        <div className="p-4 bg-[#f7f3ef] rounded-xl flex flex-col md:flex-row items-start md:items-center gap-4 shadow-sm border border-[#cfc5b8]/30">
          <div className="w-10 h-10 rounded-full bg-[#1c1b19]/10 text-[#1c1b19] flex items-center justify-center shrink-0 mt-0.5">
            <span className="material-symbols-outlined text-[22px]">gavel</span>
          </div>
          <div className="flex flex-col gap-1 flex-1">
            <span className="text-xs uppercase tracking-wider text-[#1c1b19] font-bold">
              NGUYÊN TẮC TRỌNG TÀI TRUNG LẬP (GOVERNANCE PROTOCOL)
            </span>
            <p className="text-xs sm:text-sm text-[#4c463c] leading-relaxed">
              Quản trị viên giữ vai trò thẩm phán trọng tài độc lập, tuyệt đối{" "}
              <strong className="text-[#1c1b19]">không mạo danh (impersonate)</strong> khách hàng hoặc chủ xưởng. Quản trị viên chỉ đối soát chứng cứ khách quan: dữ liệu phòng lab chuẩn trực quang học lúc xuất xưởng, ảnh niêm phong unboxing lúc nhận, và kết quả giám định vật lý để đưa ra phán quyết giải phóng hoặc hoàn trả ký quỹ.
            </p>
          </div>
          <div className="shrink-0 flex items-center gap-1.5 px-3 py-1 bg-[#f2ede9] rounded-lg text-xs font-semibold text-[#4c463c] border border-[#cfc5b8]/30">
            <span className="material-symbols-outlined text-[14px] text-[#48654b]">lock</span>
            <span>Audit Trail Bất Biến</span>
          </div>
        </div>

        {/* 3. Filters & Search Bar Section */}
        <div className="flex flex-col gap-4 bg-[#f7f3ef] p-4 rounded-xl shadow-sm border border-[#cfc5b8]/30">
          {/* Top Row: Status Tabs & Sorters */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* Status Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 lg:pb-0 whitespace-nowrap">
              <button
                type="button"
                onClick={() => setCurrentStatus("ALL")}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  currentStatus === "ALL"
                    ? "bg-[#1c1b19] text-[#fdf8f5] shadow-sm"
                    : "bg-[#f2ede9] hover:bg-[#ece7e4] text-[#4c463c]"
                }`}
              >
                Tất Cả ({tabCounts.ALL})
              </button>
              <button
                type="button"
                onClick={() => setCurrentStatus("OPEN")}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  currentStatus === "OPEN"
                    ? "bg-[#1c1b19] text-[#fdf8f5] shadow-sm"
                    : "bg-[#f2ede9] hover:bg-[#ece7e4] text-[#4c463c]"
                }`}
              >
                Đang Mở ({tabCounts.OPEN})
              </button>
              <button
                type="button"
                onClick={() => setCurrentStatus("UNDER_REVIEW")}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  currentStatus === "UNDER_REVIEW"
                    ? "bg-[#1c1b19] text-[#fdf8f5] shadow-sm"
                    : "bg-[#f2ede9] hover:bg-[#ece7e4] text-[#4c463c]"
                }`}
              >
                Đang Thẩm Định ({tabCounts.UNDER_REVIEW})
              </button>
              <button
                type="button"
                onClick={() => setCurrentStatus("RESOLVED")}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  currentStatus === "RESOLVED"
                    ? "bg-[#1c1b19] text-[#fdf8f5] shadow-sm"
                    : "bg-[#f2ede9] hover:bg-[#ece7e4] text-[#4c463c]"
                }`}
              >
                Đã Hòa Giải ({tabCounts.RESOLVED})
              </button>
              <button
                type="button"
                onClick={() => setCurrentStatus("CLOSED")}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  currentStatus === "CLOSED"
                    ? "bg-[#1c1b19] text-[#fdf8f5] shadow-sm"
                    : "bg-[#f2ede9] hover:bg-[#ece7e4] text-[#4c463c]"
                }`}
              >
                Đóng Hồ Sơ ({tabCounts.CLOSED})
              </button>
            </div>

            {/* Sorting */}
            <div className="flex items-center gap-2 self-end lg:self-auto shrink-0">
              <span className="text-xs text-[#4c463c] uppercase tracking-wider font-semibold">
                Sắp xếp:
              </span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as DisputeSort)}
                className="bg-white text-[#1c1b19] text-xs px-3 py-1.5 rounded-lg border border-[#cfc5b8]/40 outline-none focus:ring-1 focus:ring-[#6c5937] cursor-pointer"
              >
                <option value="sla-asc">Mức độ khẩn cấp (Hạn SLA gần nhất)</option>
                <option value="date-desc">Ngày tạo mới nhất</option>
                <option value="date-asc">Ngày tạo cũ nhất</option>
                <option value="escrow-desc">Giá trị ký quỹ cao nhất</option>
              </select>
            </div>
          </div>

          {/* Second Row: Type Badges & Search Box */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
            {/* Search Field */}
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#7e766a] text-[18px]">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm theo mã tranh chấp #RH-D..., mã đơn hàng, tên khách hàng hoặc chủ xưởng..."
                className="w-full bg-white text-[#1c1b19] placeholder:text-[#7e766a] text-xs pl-10 pr-8 py-2 rounded-lg outline-none border border-[#cfc5b8]/40 focus:ring-1 focus:ring-[#6c5937] transition-colors shadow-inner"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7e766a] hover:text-[#1c1b19]"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              )}
            </div>

            {/* Filter Type Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto whitespace-nowrap">
              <button
                type="button"
                onClick={() => setCurrentType("ALL")}
                className={`px-3 py-1 text-xs rounded-lg font-semibold transition-colors ${
                  currentType === "ALL"
                    ? "bg-[#86724d] text-white shadow-sm"
                    : "bg-white text-[#4c463c] hover:text-[#1c1b19] border border-[#cfc5b8]/30"
                }`}
              >
                Mọi Phân Loại
              </button>
              <button
                type="button"
                onClick={() => setCurrentType("RENT")}
                className={`px-3 py-1 text-xs rounded-lg font-semibold transition-colors ${
                  currentType === "RENT"
                    ? "bg-[#86724d] text-white shadow-sm"
                    : "bg-white text-[#4c463c] hover:text-[#1c1b19] border border-[#cfc5b8]/30"
                }`}
              >
                Sàn RENT
              </button>
              <button
                type="button"
                onClick={() => setCurrentType("THRIFT")}
                className={`px-3 py-1 text-xs rounded-lg font-semibold transition-colors ${
                  currentType === "THRIFT"
                    ? "bg-[#86724d] text-white shadow-sm"
                    : "bg-white text-[#4c463c] hover:text-[#1c1b19] border border-[#cfc5b8]/30"
                }`}
              >
                Sàn THRIFT
              </button>
              <button
                type="button"
                onClick={() => setCurrentType("PAYMENT")}
                className={`px-3 py-1 text-xs rounded-lg font-semibold transition-colors ${
                  currentType === "PAYMENT"
                    ? "bg-[#86724d] text-white shadow-sm"
                    : "bg-white text-[#4c463c] hover:text-[#1c1b19] border border-[#cfc5b8]/30"
                }`}
              >
                Thanh Toán / Ký Quỹ
              </button>
              <button
                type="button"
                onClick={() => setCurrentType("DELIVERY")}
                className={`px-3 py-1 text-xs rounded-lg font-semibold transition-colors ${
                  currentType === "DELIVERY"
                    ? "bg-[#86724d] text-white shadow-sm"
                    : "bg-white text-[#4c463c] hover:text-[#1c1b19] border border-[#cfc5b8]/30"
                }`}
              >
                Niêm Phong Vận Chuyển
              </button>
            </div>
          </div>
        </div>

        {/* 5. Disputes Data Table Container */}
        <div className="w-full bg-[#f7f3ef] rounded-xl shadow-sm border border-[#cfc5b8]/30 overflow-hidden flex flex-col">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#ece7e4] text-[#4c463c] text-[11px] uppercase tracking-wider font-semibold border-b border-[#cfc5b8]/30">
                <tr>
                  <th className="py-3 px-4" scope="col">Mã Tranh Chấp</th>
                  <th className="py-3 px-4" scope="col">Đơn Hàng &amp; Hiện Vật</th>
                  <th className="py-3 px-4" scope="col">Khách Hàng</th>
                  <th className="py-3 px-4" scope="col">Chủ Xưởng</th>
                  <th className="py-3 px-4" scope="col">Phân Loại &amp; Lý Do</th>
                  <th className="py-3 px-4" scope="col">Ngày Tạo &amp; Hạn SLA</th>
                  <th className="py-3 px-4" scope="col">Trạng Thái</th>
                  <th className="py-3 px-4 text-right" scope="col">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ece7e4]">
                {filteredDisputes.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-[#7e766a]">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <span className="material-symbols-outlined text-4xl text-[#cfc5b8]">
                          balance
                        </span>
                        <p className="text-sm font-semibold text-[#1c1b19]">
                          Không tìm thấy tranh chấp nào phù hợp
                        </p>
                        <p className="text-xs text-[#7e766a]">
                          Bộ lọc hiện tại không có hồ sơ tranh chấp hoặc khiếu nại nào tương ứng.
                        </p>
                        <button
                          type="button"
                          onClick={handleResetFilters}
                          className="mt-2 px-3.5 py-1.5 rounded-lg bg-[#1c1b19] text-white text-xs font-semibold"
                        >
                          Đặt Lại Bộ Lọc
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredDisputes.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-white transition-colors"
                    >
                      {/* Code & SLA */}
                      <td className="py-3.5 px-4 align-top whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <span className="font-mono font-bold text-[#1c1b19]">{item.id}</span>
                          {item.isUrgentSla ? (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#ffdad6] text-[#ba1a1a] text-[10px] font-bold w-fit">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#ba1a1a] animate-ping"></span>
                              {item.slaDisplay}
                            </span>
                          ) : item.labNote ? (
                            <span className="text-[10px] text-[#7f5227] font-mono font-semibold bg-[#ffdcc1]/30 px-1.5 py-0.5 rounded w-fit">
                              LAB-AUDIT
                            </span>
                          ) : (
                            <span className="text-[10px] text-[#7e766a] font-mono">
                              {item.slaDisplay}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Order & Artifact */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="flex flex-col min-w-[170px]">
                          <span className="font-mono text-xs font-bold text-[#6c5937]">
                            {item.orderCode}
                          </span>
                          <span className="text-[#1c1b19] font-serif font-bold text-xs mt-0.5">
                            {item.productName}
                          </span>
                          <span className="text-[10px] text-[#7e766a] mt-0.5">
                            {item.orderPriceNote}
                          </span>
                        </div>
                      </td>

                      {/* Customer */}
                      <td className="py-3.5 px-4 align-top whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="text-[#1c1b19] font-semibold text-xs">
                            {item.customerName}
                          </span>
                          <div className="flex items-center gap-1 text-[10px] text-[#48654b] mt-0.5 font-medium">
                            <span className="material-symbols-outlined text-[12px]">verified</span>
                            <span>{item.customerTrust}</span>
                          </div>
                        </div>
                      </td>

                      {/* Shop */}
                      <td className="py-3.5 px-4 align-top whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="text-[#1c1b19] font-semibold text-xs">
                            {item.shopName}
                          </span>
                          <span className="text-[10px] text-[#7e766a] mt-0.5">
                            {item.shopOwner}
                          </span>
                        </div>
                      </td>

                      {/* Classification & Reason */}
                      <td className="py-3.5 px-4 align-top max-w-xs">
                        <div className="flex flex-col gap-1">
                          <span className="inline-block px-1.5 py-0.5 rounded bg-[#1c1b19]/10 text-[#1c1b19] text-[10px] font-bold uppercase w-fit tracking-wider">
                            {item.categoryTag}
                          </span>
                          <p className="text-xs text-[#1c1b19] line-clamp-2 leading-relaxed">
                            {item.description}
                          </p>
                          {item.arbitrationVerdict && (
                            <div className="p-1.5 rounded bg-[#caebc9]/40 border border-[#48654b]/30 text-[10px] text-[#4e6b50] font-semibold">
                              {item.arbitrationVerdict}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Date & SLA */}
                      <td className="py-3.5 px-4 align-top whitespace-nowrap">
                        <div className="flex flex-col text-[#4c463c]">
                          <span className="font-mono text-xs font-semibold text-[#1c1b19]">
                            {item.createdAtDisplay}
                          </span>
                          <span className="text-[10px] text-[#7e766a]">{item.createdAtTime}</span>
                          <span
                            className={`text-[10px] mt-1 font-semibold ${
                              item.isUrgentSla ? "text-[#ba1a1a]" : "text-[#48654b]"
                            }`}
                          >
                            {item.slaDisplay}
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 align-top whitespace-nowrap">
                        {item.status === "OPEN" && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#ffdad6] text-[#ba1a1a] text-[10px] font-bold uppercase tracking-wider">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#ba1a1a]"></span>
                            OPEN (Chờ Xử Lý)
                          </span>
                        )}
                        {item.status === "UNDER_REVIEW" && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#ffdcc1] text-[#7f5227] text-[10px] font-bold uppercase tracking-wider">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#7f5227] animate-pulse"></span>
                            UNDER_REVIEW (Lab)
                          </span>
                        )}
                        {item.status === "RESOLVED" && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#caebc9] text-[#4e6b50] text-[10px] font-bold uppercase tracking-wider">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#48654b]"></span>
                            RESOLVED (Đã Hòa Giải)
                          </span>
                        )}
                        {item.status === "CLOSED" && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#e6e2de] text-[#4c463c] text-[10px] font-bold uppercase tracking-wider">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#7e766a]"></span>
                            CLOSED (Đã Đóng)
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 align-top text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleOpenReview(item)}
                          className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shadow-sm ${
                            item.status === "OPEN" || item.status === "UNDER_REVIEW"
                              ? "bg-[#1c1b19] text-white hover:bg-[#6c5937]"
                              : "bg-[#f2ede9] hover:bg-[#ece7e4] text-[#1c1b19]"
                          }`}
                        >
                          <span>
                            {item.status === "OPEN" || item.status === "UNDER_REVIEW"
                              ? "Review"
                              : "Chi Tiết"}
                          </span>
                          <span className="material-symbols-outlined text-[14px]">
                            arrow_forward
                          </span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="px-4 py-3 bg-[#f2ede9] border-t border-[#cfc5b8]/30 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#4c463c]">
            <div>
              Hiển thị{" "}
              <strong className="text-[#1c1b19] font-bold">{filteredDisputes.length}</strong> trên
              tổng số <strong className="text-[#1c1b19] font-bold">{metrics.total}</strong> hồ sơ tranh chấp
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled
                className="px-2.5 py-1 rounded bg-white text-[#4c463c] opacity-50 cursor-not-allowed border border-[#cfc5b8]/30 flex items-center"
              >
                <span className="material-symbols-outlined text-[14px]">chevron_left</span>
                <span>Trước</span>
              </button>
              <button
                type="button"
                className="w-7 h-7 rounded bg-[#1c1b19] text-white font-bold flex items-center justify-center shadow-sm"
              >
                1
              </button>
              <button
                type="button"
                className="w-7 h-7 rounded bg-white hover:bg-[#ece7e4] text-[#1c1b19] flex items-center justify-center transition-colors border border-[#cfc5b8]/30"
              >
                2
              </button>
              <button
                type="button"
                className="px-2.5 py-1 rounded bg-white hover:bg-[#ece7e4] text-[#1c1b19] transition-colors border border-[#cfc5b8]/30 flex items-center"
              >
                <span>Sau</span>
                <span className="material-symbols-outlined text-[14px]">chevron_right</span>
              </button>
            </div>
          </div>
        </div>

        {/* Forensic Evidence & Escrow Release Flow Diagram */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-[#f7f3ef] rounded-xl flex flex-col gap-1.5 shadow-sm border border-[#cfc5b8]/30">
            <div className="flex items-center gap-1.5 text-[#6c5937] font-bold text-xs uppercase">
              <span className="material-symbols-outlined text-[18px]">photo_camera</span>
              <span>1. Bằng Chứng Đầu Vào (Check-In)</span>
            </div>
            <p className="text-xs text-[#4c463c] leading-relaxed">
              Quét vạch ảnh quang học Macro 40x và tem viễn thám RFID lúc xuất kho từ chủ xưởng được ký số SHA-256 lưu trực tiếp trên sổ bộ Vault.
            </p>
          </div>
          <div className="p-4 bg-[#f7f3ef] rounded-xl flex flex-col gap-1.5 shadow-sm border border-[#cfc5b8]/30">
            <div className="flex items-center gap-1.5 text-[#7f5227] font-bold text-xs uppercase">
              <span className="material-symbols-outlined text-[18px]">biotech</span>
              <span>2. Phòng Giám Định Vật Lý</span>
            </div>
            <p className="text-xs text-[#4c463c] leading-relaxed">
              Hiện vật có tranh chấp tổn hại vượt 1,000,000 ₫ bắt buộc thu hồi về Hub Thẩm Định để đo đạc độ chuẩn trục và sai số ngàm trước khi ra phán quyết.
            </p>
          </div>
          <div className="p-4 bg-[#f7f3ef] rounded-xl flex flex-col gap-1.5 shadow-sm border border-[#cfc5b8]/30">
            <div className="flex items-center gap-1.5 text-[#48654b] font-bold text-xs uppercase">
              <span className="material-symbols-outlined text-[18px]">assured_workload</span>
              <span>3. Khóa Ký Quỹ &amp; Giải Phóng</span>
            </div>
            <p className="text-xs text-[#4c463c] leading-relaxed">
              Phán quyết của Quản Trị Viên cần xác nhận đa khóa Multi-Sig (2/3 trọng tài). Quỹ bảo hiểm Circularity B-Corp tự động đền bù tổn thất ngoài ý muốn.
            </p>
          </div>
        </div>
      </div>

      {/* MODAL 1: ARBITRATION REVIEW & VERDICT DECISION */}
      {selectedDispute && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#fdf8f5] rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-[#cfc5b8]/50 p-6 flex flex-col gap-5">
            {/* Header */}
            <div className="flex items-start justify-between pb-3 border-b border-[#cfc5b8]/30">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-[#1c1b19] text-white">
                    {selectedDispute.id}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#ffdcc1] text-[#7f5227]">
                    {selectedDispute.categoryTag}
                  </span>
                </div>
                <h3 className="font-serif text-xl font-bold text-[#1c1b19]">
                  {selectedDispute.productName}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDispute(null)}
                className="w-8 h-8 rounded-full bg-[#f2ede9] hover:bg-[#ece7e4] text-[#4c463c] flex items-center justify-center transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Parties Snapshot */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-white border border-[#cfc5b8]/30 text-xs">
              <div className="space-y-1">
                <span className="text-[10px] text-[#7e766a] uppercase font-bold tracking-wider">
                  Bên Khiếu Nại (Khách Hàng)
                </span>
                <div className="font-semibold text-sm text-[#1c1b19]">
                  {selectedDispute.customerName}
                </div>
                <div className="text-[#48654b] text-[11px] font-medium">
                  {selectedDispute.customerTrust}
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-[#7e766a] uppercase font-bold tracking-wider">
                  Bên Bị Khiếu Nại (Chủ Xưởng)
                </span>
                <div className="font-semibold text-sm text-[#1c1b19]">
                  {selectedDispute.shopName}
                </div>
                <div className="text-[#7e766a] text-[11px]">
                  {selectedDispute.shopOwner}
                </div>
              </div>
              <div className="col-span-full pt-2 border-t border-[#ece7e4]">
                <div className="flex items-center justify-between">
                  <span className="text-[#4c463c]">Giá trị ký quỹ đang tranh chấp:</span>
                  <strong className="text-base font-serif text-[#ba1a1a]">
                    {selectedDispute.escrowAmount.toLocaleString("vi-VN")} ₫
                  </strong>
                </div>
                <p className="text-xs text-[#4c463c] mt-2 italic bg-[#f7f3ef] p-2.5 rounded-lg border border-[#cfc5b8]/20">
                  "{selectedDispute.description}"
                </p>
              </div>
            </div>

            {/* Arbitration Verdict Form */}
            <form onSubmit={handleSubmitVerdict} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-[#1c1b19] uppercase tracking-wider mb-2">
                  Phán Quyết Trọng Tài Multi-Sig (Tribunal Verdict):
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <label
                    className={`cursor-pointer p-3 rounded-xl border transition-all flex flex-col ${
                      decisionType === "SPLIT_DEDUCTION"
                        ? "bg-[#caebc9]/30 border-[#48654b] text-[#48654b]"
                        : "bg-white border-[#cfc5b8]/40 hover:bg-[#f7f3ef]"
                    }`}
                  >
                    <input
                      type="radio"
                      name="verdictRadio"
                      value="SPLIT_DEDUCTION"
                      checked={decisionType === "SPLIT_DEDUCTION"}
                      onChange={() => setDecisionType("SPLIT_DEDUCTION")}
                      className="sr-only"
                    />
                    <strong className="text-xs">Hòa Giải Khấu Trừ Một Phần</strong>
                    <span className="text-[11px] opacity-80 mt-1">
                      Khấu trừ bù hao mòn cho chủ xưởng, hoàn lại phần còn lại cho khách.
                    </span>
                  </label>

                  <label
                    className={`cursor-pointer p-3 rounded-xl border transition-all flex flex-col ${
                      decisionType === "REFUND_BUYER"
                        ? "bg-[#caebc9]/30 border-[#48654b] text-[#48654b]"
                        : "bg-white border-[#cfc5b8]/40 hover:bg-[#f7f3ef]"
                    }`}
                  >
                    <input
                      type="radio"
                      name="verdictRadio"
                      value="REFUND_BUYER"
                      checked={decisionType === "REFUND_BUYER"}
                      onChange={() => setDecisionType("REFUND_BUYER")}
                      className="sr-only"
                    />
                    <strong className="text-xs">Hoàn Trả 100% Cho Khách Hàng</strong>
                    <span className="text-[11px] opacity-80 mt-1">
                      Chứng minh lỗi kỹ thuật xuất phát từ hiện vật xuất xưởng.
                    </span>
                  </label>

                  <label
                    className={`cursor-pointer p-3 rounded-xl border transition-all flex flex-col ${
                      decisionType === "PAY_SHOP"
                        ? "bg-[#caebc9]/30 border-[#48654b] text-[#48654b]"
                        : "bg-white border-[#cfc5b8]/40 hover:bg-[#f7f3ef]"
                    }`}
                  >
                    <input
                      type="radio"
                      name="verdictRadio"
                      value="PAY_SHOP"
                      checked={decisionType === "PAY_SHOP"}
                      onChange={() => setDecisionType("PAY_SHOP")}
                      className="sr-only"
                    />
                    <strong className="text-xs">Đền Bù Cho Chủ Xưởng</strong>
                    <span className="text-[11px] opacity-80 mt-1">
                      Xác nhận thiệt hại hư hỏng do phía người thuê/mua gây ra.
                    </span>
                  </label>

                  <label
                    className={`cursor-pointer p-3 rounded-xl border transition-all flex flex-col ${
                      decisionType === "INSURANCE"
                        ? "bg-[#caebc9]/30 border-[#48654b] text-[#48654b]"
                        : "bg-white border-[#cfc5b8]/40 hover:bg-[#f7f3ef]"
                    }`}
                  >
                    <input
                      type="radio"
                      name="verdictRadio"
                      value="INSURANCE"
                      checked={decisionType === "INSURANCE"}
                      onChange={() => setDecisionType("INSURANCE")}
                      className="sr-only"
                    />
                    <strong className="text-xs">Bảo Hiểm B-Corp Chi Trả</strong>
                    <span className="text-[11px] opacity-80 mt-1">
                      Tổn hại ngoài ý muốn trong quá trình vận chuyển liên tỉnh.
                    </span>
                  </label>
                </div>
              </div>

              {decisionType === "SPLIT_DEDUCTION" && (
                <div className="p-3 bg-white rounded-xl border border-[#cfc5b8]/30 space-y-1">
                  <label className="block font-semibold text-[#1c1b19]">
                    Số Tiền Khấu Trừ Đền Bù (VND):
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={selectedDispute.escrowAmount}
                    step={50000}
                    value={deductionAmount}
                    onChange={(e) => setDeductionAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[#f7f3ef] rounded-lg border border-[#cfc5b8]/40 focus:outline-none focus:ring-1 focus:ring-[#6c5937] text-xs font-mono font-bold"
                  />
                  <div className="flex justify-between text-[11px] text-[#7e766a] pt-1">
                    <span>Đền bù Chủ Xưởng: {deductionAmount.toLocaleString("vi-VN")} ₫</span>
                    <span>
                      Hoàn lại Khách Hàng:{" "}
                      {(selectedDispute.escrowAmount - deductionAmount).toLocaleString("vi-VN")} ₫
                    </span>
                  </div>
                </div>
              )}

              <div>
                <label className="block font-semibold text-[#1c1b19] mb-1">
                  Căn Cứ Phán Quyết / Bằng Chứng Giám Định (Lab Audit Notes):
                </label>
                <textarea
                  rows={3}
                  value={arbitrationNotes}
                  onChange={(e) => setArbitrationNotes(e.target.value)}
                  placeholder="Ghi nhận đối soát ảnh unboxing lúc nhận, kết quả kiểm tra quang học phòng lab..."
                  className="w-full px-3 py-2 bg-white rounded-lg border border-[#cfc5b8]/40 focus:outline-none focus:ring-1 focus:ring-[#6c5937] text-xs text-[#1c1b19]"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-[#cfc5b8]/30">
                <button
                  type="button"
                  onClick={() => setSelectedDispute(null)}
                  className="px-4 py-2 rounded-lg bg-[#f2ede9] hover:bg-[#ece7e4] text-[#1c1b19] font-medium transition-colors"
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-[#1c1b19] hover:bg-[#6c5937] text-white font-semibold transition-colors shadow-sm flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px] text-[#caebc9]">
                    gavel
                  </span>
                  <span>Ký Ban Hành Phán Quyết</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: QUY CHẾ TRỌNG TÀI B-CORP */}
      {showProtocolModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#fdf8f5] rounded-2xl max-w-xl w-full shadow-2xl border border-[#cfc5b8]/50 p-6 space-y-4">
            <div className="flex items-start justify-between pb-2 border-b border-[#cfc5b8]/30">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#48654b] text-2xl">
                  verified_user
                </span>
                <h3 className="font-serif text-lg font-bold text-[#1c1b19]">
                  Hiến Chương Trọng Tài Tranh Chấp ReUse Hub
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowProtocolModal(false)}
                className="w-8 h-8 rounded-full bg-[#f2ede9] hover:bg-[#ece7e4] flex items-center justify-center text-sm"
              >
                ✕
              </button>
            </div>

            <div className="text-xs text-[#4c463c] space-y-3 leading-relaxed max-h-[60vh] overflow-y-auto pr-1">
              <div className="p-3 rounded-xl bg-white border border-[#cfc5b8]/30">
                <strong className="text-[#1c1b19] block mb-1">
                  1. Ranh Giới Chống Mạo Danh (Anti-Impersonation Protocol):
                </strong>
                <p>
                  Quản trị viên tuyệt đối không mạo danh bất kỳ bên tranh chấp nào. Mọi phán quyết đều được ghi nhận bằng chữ ký số định danh duy nhất của trọng tài viên trên sổ bộ không thể xóa sửa.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-white border border-[#cfc5b8]/30">
                <strong className="text-[#1c1b19] block mb-1">
                  2. Cơ Chế Đa Chữ Ký Multi-Sig 2/3:
                </strong>
                <p>
                  Mọi lệnh giải ngân phong tỏa ký quỹ trên 5,000,000 ₫ bắt buộc có sự đồng thuận của tối thiểu 2 trong 3 trọng tài viên độc lập.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-white border border-[#cfc5b8]/30">
                <strong className="text-[#1c1b19] block mb-1">
                  3. Quỹ Bảo Hiểm Tuần Hoàn B-Corp:
                </strong>
                <p>
                  Trong trường hợp tổn hại bất khả kháng trong quá trình vận chuyển đã niêm phong hợp lệ, quỹ bảo hiểm Circularity tự động chi trả đền bù cho chủ xưởng mà không tổn hại quyền lợi của người thuê.
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-[#cfc5b8]/30">
              <button
                type="button"
                onClick={() => setShowProtocolModal(false)}
                className="px-4 py-2 rounded-lg bg-[#1c1b19] text-white text-xs font-semibold hover:bg-[#6c5937] transition-colors"
              >
                Đã Hiểu Quy Chế
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DisputeManagement;
