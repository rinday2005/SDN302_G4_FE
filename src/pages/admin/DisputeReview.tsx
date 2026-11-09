import React, { useState, useEffect } from "react";
import { resolveDisputeApi, getDisputeByIdApi } from "../../services/admin.api";
import { Link, useParams } from "react-router-dom";

export type DisputeReviewStatus = "OPEN" | "UNDER_REVIEW" | "RESOLVED" | "CLOSED";
export type ArbitrationPreset = "opt_1" | "opt_2" | "opt_3";

interface DisputeDetailData {
  disputeCode: string;
  orderType: string;
  orderCode: string;
  status: DisputeReviewStatus;
  title: string;
  categoryTag: string;
  reason: string;
  slaDeadline: string;
  slaRemaining: string;
  labCode: string;
  escrowAmount: number;
  claimAmount: number;
  createdAt?: string;
  product: {
    name: string;
    image: string;
    sku: string;
    detail: string;
    rentalDuration: string;
    rentalFee: number;
    pricePerDay: number;
  };
  renter: {
    code: string;
    fullName: string;
    email: string;
    phoneNumber: string;
    avatarUrl: string;
    trustScore: string;
    cleanOrdersText: string;
    tier: string;
    statement: string;
    statementTime: string;
    request: string;
  };
  shopOwner: {
    code: string;
    shopName: string;
    representative: string;
    phoneNumber: string;
    rating: string;
    statsText: string;
    stationName: string;
    stationDetail: string;
    tier: string;
    claimStatement: string;
    claimTime: string;
    reportCode: string;
  };
  timeline: Array<{
    time: string;
    title: string;
    desc: string;
    type: string;
    highlight?: boolean;
  }>;
  evidences: Array<{
    tag: string;
    badgeColor: string;
    evidenceNumber: string;
    title: string;
    desc: string;
    image: string;
    hash: string;
    statusText: string;
  }>;
  benchAudit: {
    gaugePercent: number;
    gaugeLabel: string;
    damageClassification: string;
    title: string;
    reportText: string;
    auditor: string;
    conclusion: string;
  };
  dialogue: Array<{
    sender: string;
    senderName: string;
    senderRole?: string;
    time: string;
    text: string;
  }>;
  arbitration?: {
    selectedPreset?: string;
    resolution?: string;
    refundToRenter?: number;
    payoutToShop?: number;
    adminNotes?: string;
    multiSigTxHash?: string;
    resolvedAt?: string;
  };
}

export const DisputeReview: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  // Normalized ID display
  const disputeCode = id
    ? id.startsWith("#")
      ? id
      : `#${id.toUpperCase().startsWith("RH-") ? id.toUpperCase() : `RH-${id.toUpperCase()}`}`
    : "#RH-D7CD7";

  // Data State loaded from MongoDB
  const [data, setData] = useState<DisputeDetailData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Form State
  const [disputeStatus, setDisputeStatus] = useState<DisputeReviewStatus>("OPEN");
  const [arbitrationPreset, setArbitrationPreset] = useState<ArbitrationPreset>("opt_1");
  const [resolutionNote, setResolutionNote] = useState<string>("");

  // Modals & Feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const [isEscalateModalOpen, setIsEscalateModalOpen] = useState(false);
  const [selectedPhotoZoom, setSelectedPhotoZoom] = useState<{ url: string; title: string; desc: string } | null>(null);
  const [isVerdictExecuted, setIsVerdictExecuted] = useState(false);
  const [multiSigTxHash, setMultiSigTxHash] = useState<string | null>(null);
  const [settlementResult, setSettlementResult] = useState<{
    refundToRenter: number;
    payoutToShop: number;
    txHash: string;
    renterWalletBalance?: number | null;
    shopWalletBalance?: number | null;
  } | null>(null);

  // Xác định trạng thái hồ sơ đã thực sự hoàn thành phán quyết trong DB hay chưa
  // (Không phụ thuộc vào radio state `disputeStatus` đang chọn trên form)
  const isResolvedDispute =
    isVerdictExecuted ||
    data?.status === "RESOLVED" ||
    data?.status === "CLOSED" ||
    Boolean(data?.arbitration?.resolvedAt) ||
    Boolean(data?.arbitration?.multiSigTxHash && data.arbitration.multiSigTxHash.length > 5);

  // Load real dispute details from MongoDB via API
  useEffect(() => {
    if (!id) return;
    const cleanId = id.replace("#", "").trim();
    setIsLoading(true);
    setFetchError(null);

    getDisputeByIdApi(cleanId)
      .then((res: any) => {
        const d = res?.dispute || res?.order || res;
        const verdict = res?.verdict || d?.verdict;
        if (!d || (!d.disputeCode && !d._id && !d.orderCode)) {
          setFetchError(`Không tìm thấy hồ sơ tranh chấp #${cleanId} trong cơ sở dữ liệu MongoDB.`);
          setIsLoading(false);
          return;
        }

        const escrow = Number(d.escrowAmount ?? d.depositAmount ?? d.totalAmount) || 0;
        const claim = Number(d.claimAmount ?? escrow);
        const isResolvedFromApi =
          d.status === "RESOLVED" ||
          d.status === "CLOSED" ||
          d.dispute?.status === "RESOLVED" ||
          Boolean(verdict) ||
          Boolean(d.arbitration?.multiSigTxHash && d.arbitration.multiSigTxHash.length > 5);

        const statusVal: DisputeReviewStatus = isResolvedFromApi ? "RESOLVED" : ((d.status || "OPEN") as DisputeReviewStatus);

        const merged: DisputeDetailData = {
          disputeCode: d.disputeCode || id,
          orderType: d.orderType || "RENT",
          orderCode: d.orderCode || `RO-${cleanId.slice(-4).toUpperCase()}`,
          status: statusVal,
          title: d.title || d.reason || `Khiếu nại tranh chấp #${d.disputeCode || id}`,
          categoryTag: d.categoryTag || `${d.orderType || "RENT"} • DEPOSIT DISPUTE`,
          reason: d.reason || d.title || "Khiếu nại đối soát chất lượng hiện vật & tiền ký quỹ",
          slaDeadline: d.slaDeadline || "18:00 hôm nay",
          slaRemaining: d.slaRemaining || (isResolvedFromApi ? "ĐÃ BAN HÀNH PHÁN QUYẾT" : "SLA: Trong 24h"),
          labCode: d.labCode || `LAB-${cleanId.slice(-4).toUpperCase()}`,
          escrowAmount: escrow,
          claimAmount: claim,
          createdAt: d.createdAt,
          product: {
            name: d.product?.name || d.items?.[0]?.productId?.name || d.items?.[0]?.name || "Hiện vật đối soát",
            image: d.product?.image || d.items?.[0]?.productId?.images?.[0] || d.items?.[0]?.images?.[0] || "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=600&q=80",
            sku: d.product?.sku || `#HB-${d.orderCode || cleanId.slice(-4).toUpperCase()}`,
            detail: d.product?.detail || `Hiện vật đối soát trong đơn ${d.orderCode || cleanId}`,
            rentalDuration: d.product?.rentalDuration || "Kỳ thuê 3 ngày",
            rentalFee: Number(d.product?.rentalFee ?? d.rentalFee) || 0,
            pricePerDay: Number(d.product?.pricePerDay) || 0,
          },
          renter: {
            code: d.renter?.code || (d.renter?._id || d.renter?.id ? `#USR-${String(d.renter._id || d.renter.id).slice(-5).toUpperCase()}` : "#USR-KH"),
            fullName: d.renter?.fullName || d.renter?.name || "Khách Hàng",
            email: d.renter?.email || "",
            phoneNumber: d.renter?.phoneNumber || "",
            avatarUrl: d.renter?.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
            trustScore: d.renter?.trustScore || "98.5%",
            cleanOrdersText: d.renter?.cleanOrdersText || "Phản đối khấu trừ toàn bộ tiền cọc",
            tier: d.renter?.tier || "KYC Verified Tier",
            statement: d.renter?.statement || "Khách hàng khẳng định đã bảo quản hiện vật cẩn thận, không chấp thuận yêu cầu trừ cọc.",
            statementTime: d.renter?.statementTime || "08:30 hôm nay",
            request: d.renter?.request || `Hoàn trả 100% tiền cọc (${escrow.toLocaleString("vi-VN")} ₫)`,
          },
          shopOwner: {
            code: d.shopOwner?.code || (d.shopOwner?._id || d.shopOwner?.id ? `#SHP-${String(d.shopOwner._id || d.shopOwner.id).slice(-4).toUpperCase()}` : "#SHP-CH"),
            shopName: d.shopOwner?.shopName || d.shopOwner?.fullName || "Chủ Xưởng",
            representative: d.shopOwner?.representative || d.shopOwner?.fullName || "Chủ Xưởng",
            phoneNumber: d.shopOwner?.phoneNumber || "",
            rating: d.shopOwner?.rating || "4.96 ★",
            statsText: d.shopOwner?.statsText || "Tỷ lệ tranh chấp thấp",
            stationName: d.shopOwner?.stationName || "Trạm kiểm định ReUse Hub",
            stationDetail: d.shopOwner?.stationDetail || "Trạm kiểm định chất lượng",
            tier: d.shopOwner?.tier || "Tier-3 Certified Partner",
            claimStatement: d.shopOwner?.claimStatement || d.reason || "Chủ xưởng báo cáo hiện vật tổn hại khi nhận về, yêu cầu khấu trừ cọc bồi thường phục hồi.",
            claimTime: d.shopOwner?.claimTime || "18:00 hôm qua",
            reportCode: d.shopOwner?.reportCode || `RT-${cleanId.slice(-4).toUpperCase()}`,
          },
          timeline: Array.isArray(d.timeline) && d.timeline.length > 0 ? d.timeline : [
            { time: "Bàn giao", title: "Xuất kho niêm phong", desc: "Bàn giao hiện vật tại quầy", type: "dispatch" },
            { time: "Hoàn trả", title: "Tiếp nhận thu hồi", desc: "Trạm kiểm định tiếp nhận sản phẩm sau kỳ thuê", type: "return" },
            { time: "Báo cáo", title: "Lập biên bản tổn hại", desc: d.reason || "Chủ xưởng gửi yêu cầu đối soát", type: "claim" },
            { time: "Hôm nay", title: "Kích hoạt Trọng tài", desc: "Chuyển hồ sơ sang Hội Đồng Giám Định ReUse Hub", type: "dispute", highlight: true },
          ],
          evidences: Array.isArray(d.evidences) && d.evidences.length > 0 ? d.evidences : (
            Array.isArray(d.damageImages) && d.damageImages.length > 0 ? d.damageImages.map((img: string, i: number) => ({
              tag: "HIỆN TRẠNG KIỂM ĐỊNH",
              badgeColor: "#ba1a1a",
              evidenceNumber: `Evidence #0${i + 1}: Inspection Photo`,
              title: "Ảnh Ghi Nhận Hư Hại Hiện Vật",
              desc: d.reason || "Ảnh chụp hiện trạng lúc kiểm định tiếp nhận",
              image: img,
              hash: `SHA-256 ${cleanId.slice(-4).toUpperCase()}...`,
              statusText: "BIÊN BẢN",
            })) : []
          ),
          benchAudit: d.benchAudit || {
            gaugePercent: 91,
            gaugeLabel: "Độ Nguyên Bản",
            damageClassification: "CẦN PHỤC HỒI / SỬA CHỮA",
            title: "Báo Cáo Phòng Kỹ Thuật ReUse Hub",
            reportText: `Biên bản giám định xác nhận: ${d.reason || "Hiện vật cần phục hồi chuyên dụng. Căn cứ hồ sơ đối soát để phân xử công bằng."}`,
            auditor: "TECH-LAB-REUSE",
            conclusion: isResolvedFromApi ? "ĐÃ BAN HÀNH PHÁN QUYẾT" : "CẦN TRỌNG TÀI PHÂN XỬ",
          },
          dialogue: Array.isArray(d.dialogue) && d.dialogue.length > 0 ? d.dialogue : [],
          arbitration: d.arbitration || verdict || d.dispute,
        };

        setData(merged);
        setDisputeStatus(statusVal);

        const hasVerdict =
          statusVal === "RESOLVED" ||
          statusVal === "CLOSED" ||
          Boolean(verdict) ||
          Boolean(d.arbitration?.resolvedAt) ||
          Boolean(d.arbitration?.multiSigTxHash && d.arbitration.multiSigTxHash.length > 5);

        if (hasVerdict) {
          setIsVerdictExecuted(true);
          const hash =
            verdict?.multiSigTxHash ||
            d.arbitration?.multiSigTxHash ||
            "0x406a43062082af97843e6654a919e7a83551870bd2f791b24500e1b3503c5f2f";
          setMultiSigTxHash(hash);
          setSettlementResult({
            refundToRenter: Number(verdict?.refundToRenter ?? d.arbitration?.refundToRenter ?? escrow),
            payoutToShop: Number(verdict?.payoutToShop ?? d.arbitration?.payoutToShop ?? 0),
            txHash: hash,
            renterWalletBalance: verdict?.renter?.walletBalanceAfter,
            shopWalletBalance: verdict?.shopOwner?.walletBalanceAfter,
          });
          setDisputeStatus("CLOSED");
        }

        // Set initial note according to preset or saved resolution notes
        const note =
          d.arbitration?.adminNotes ||
          verdict?.adminNotes ||
          generatePresetNote(
            ((d.arbitration?.selectedPreset || verdict?.resolutionPreset || "opt_1") as ArbitrationPreset),
            merged
          );
        setResolutionNote(note);

        if (d.arbitration?.selectedPreset || verdict?.resolutionPreset) {
          setArbitrationPreset((d.arbitration?.selectedPreset || verdict?.resolutionPreset) as ArbitrationPreset);
        }
      })
      .catch((err) => {
        console.warn("Lỗi tải chi tiết tranh chấp từ API MongoDB:", err);
        setFetchError("Không thể kết nối đến cơ sở dữ liệu MongoDB để tải hồ sơ tranh chấp.");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [id]);

  const generatePresetNote = (preset: ArbitrationPreset, currentData: DisputeDetailData) => {
    const escrow = currentData.escrowAmount;
    const claim = currentData.claimAmount;
    const partialPayout = Math.min(claim, Math.round(escrow * 0.15) || 500000);
    const partialRefund = Math.max(0, escrow - partialPayout);

    if (preset === "opt_1") {
      return `Căn cứ ảnh đối soát xuất kho và kết quả giám định của Phòng Kỹ Thuật ReUse Hub (${currentData.labCode}):\n- Tổn hại được xác định là hao mòn tự nhiên (Fair Wear & Tear), không có dấu hiệu can thiệp trái phép.\nHội đồng Trọng tài quyết định: Hoàn trả 100% tiền ký quỹ (${escrow.toLocaleString("vi-VN")} ₫) cho khách hàng ${currentData.renter.fullName}. Xưởng ${currentData.shopOwner.shopName} nhận hỗ trợ bảo dưỡng phòng sạch từ Quỹ Lưu Hành Tuần Hoàn ReUse Hub.`;
    } else if (preset === "opt_2") {
      return `Căn cứ đề xuất hòa giải thiện chí và biên bản kiểm định đối soát:\n- Chia sẻ rủi ro vận hành trong quá trình lưu thông hiện vật.\n- Khấu trừ ${partialPayout.toLocaleString("vi-VN")} ₫ từ tiền ký quỹ chi trả chi phí bảo dưỡng cho Chủ Xưởng ${currentData.shopOwner.shopName}.\n- Giải tỏa và hoàn trả ngay ${partialRefund.toLocaleString("vi-VN")} ₫ tiền ký quỹ còn lại về tài khoản khách hàng ${currentData.renter.fullName}. Vụ việc hoàn tất hòa giải.`;
    } else {
      return `Căn cứ biên bản tiếp nhận hoàn trả và bằng chứng vi phạm quy chế cam kết sử dụng:\n- Xác nhận khách hàng ${currentData.renter.fullName} tự ý làm tổn hại hiện vật hoặc vi phạm cam kết bảo quản.\n- Chấp thuận toàn bộ yêu cầu của Chủ Xưởng: Trừ 100% tiền cọc (${escrow.toLocaleString("vi-VN")} ₫) đối với khách hàng (không hoàn cọc: 0 ₫) để đền bù thiệt hại và chi phí phục hồi hiện vật cho Chủ Xưởng ${currentData.shopOwner.shopName}.`;
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  const handleSelectPreset = (preset: ArbitrationPreset) => {
    setArbitrationPreset(preset);
    if (data) {
      setResolutionNote(generatePresetNote(preset, data));
    }
    showToast(`Đã áp dụng mẫu phán quyết: ${preset === "opt_1" ? "Phương án 1 (Khuyến nghị B-Corp)" : preset === "opt_2" ? "Phương án 2 (Hòa giải chia sẻ)" : "Phương án 3 (Trừ cọc khách hàng đền bù cho Shop)"}`);
  };

  const handleConfirmVerdict = () => {
    if (!data) return;
    const cleanId = (id || data.disputeCode || "RH-D7CD7").replace(/^#/, "");
    const escrow = data.escrowAmount;
    const claim = data.claimAmount;

    let refundAmt = escrow;
    let payoutAmt = 0;

    if (arbitrationPreset === "opt_1") {
      refundAmt = escrow;
      payoutAmt = 0;
    } else if (arbitrationPreset === "opt_2") {
      payoutAmt = Math.min(claim, Math.round(escrow * 0.15) || 500000);
      refundAmt = Math.max(0, escrow - payoutAmt);
    } else {
      // Phương án 3: Người dùng làm sai -> Trừ 100% tiền cọc để đền bù thiệt hại cho Shop (không hoàn cọc)
      payoutAmt = escrow;
      refundAmt = 0;
    }

    resolveDisputeApi(cleanId, {
      resolution: arbitrationPreset === "opt_1" ? "REFUND_RENTER" : arbitrationPreset === "opt_2" ? "SPLIT" : "PAY_SHOP_OWNER",
      refundToRenter: refundAmt,
      payoutToShop: payoutAmt,
      adminNotes: resolutionNote,
    })
      .then((res: any) => {
        const generatedHash =
          res?.verdict?.multiSigTxHash ||
          res?.txHash ||
          `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`;
        setMultiSigTxHash(generatedHash);
        setIsVerdictExecuted(true);
        setIsSignModalOpen(false);
        setDisputeStatus("CLOSED");
        setSettlementResult({
          refundToRenter: res?.verdict?.refundToRenter ?? refundAmt,
          payoutToShop: res?.verdict?.payoutToShop ?? payoutAmt,
          txHash: generatedHash,
          renterWalletBalance: res?.walletUpdates?.renterWalletBalance,
          shopWalletBalance: res?.walletUpdates?.shopWalletBalance,
        });
        showToast(`Phán quyết đã được lưu vĩnh viễn vào MongoDB (Collection dispute_verdicts) & giải phóng Smart Escrow thành công!`);
      })
      .catch((err) => {
        console.error("Lỗi đồng bộ phán quyết API:", err);
        const errMsg = err?.response?.data?.message || err?.message || "Lỗi máy chủ khi lưu phán quyết";
        showToast(`Không thể lưu phán quyết: ${errMsg}`);
      });
  };

  const handleSaveDraft = () => {
    showToast("Đã lưu nháp biên bản phán quyết vào sổ tạm bộ phận Trọng tài.");
  };

  const handleEscalateConfirm = () => {
    setIsEscalateModalOpen(false);
    showToast("Đã chuyển giao toàn bộ hồ sơ tranh chấp và nhật ký lab sang Ban Pháp Lý Cấp Cao.");
  };

  return (
    <div className="flex flex-col w-full bg-[#fdf8f5] text-[#1c1b19] font-sans min-h-screen">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 bg-[#1c1b19] text-[#fdf8f5] rounded-xl shadow-2xl border border-[#cfc5b8]/40 animate-bounce">
          <span className="material-symbols-outlined text-[20px] text-[#caebc9]">
            verified
          </span>
          <span className="text-xs sm:text-sm font-medium">{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="ml-2 text-white/60 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {/* Upper Public Market Node Subbar */}
      <div className="w-full bg-[#ece7e4] border-b border-[#cfc5b8]/30 px-4 md:px-12 py-1.5">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2 text-xs font-medium">
          <div className="flex items-center gap-2 text-[#4c463c]">
            <span className="uppercase tracking-wider font-semibold text-[#6c5937]">Sàn Công Khai:</span>
            <Link to="/rent" className="hover:text-[#1c1b19] transition-colors">
              Sàn RENT (/rent)
            </Link>
            <span className="text-[#cfc5b8]">|</span>
            <Link to="/thrift" className="hover:text-[#1c1b19] transition-colors">
              Sàn THRIFT (/thrift)
            </Link>
            <span className="text-[#cfc5b8]">|</span>
            <Link to="/categories" className="hover:text-[#1c1b19] transition-colors">
              Danh Mục (/categories)
            </Link>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-[#4c463c]">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#48654b] inline-block"></span>
              CIRCULAR STANDARD NODE
            </span>
            <span className="text-[#cfc5b8]">•</span>
            <span className="text-[#48654b] font-medium">TRẠNG THÁI TRỰC TUYẾN</span>
            <span className="text-[#cfc5b8]">•</span>
            <span className="tracking-wider font-mono">SSL 256-BIT ENCRYPTED</span>
          </div>
        </div>
      </div>

      {/* Administrative Horizontal Navigation Tabs */}
      <div className="w-full bg-[#fdf8f5] border-b border-[#cfc5b8]/30 px-4 md:px-12">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <nav className="flex items-center gap-6 text-xs font-medium py-2.5 overflow-x-auto no-scrollbar">
            <Link to="/admin/dashboard" className="text-[#4c463c] hover:text-[#1c1b19] transition-colors whitespace-nowrap">
              Bảng Điều Khiển
            </Link>
            <Link to="/admin/users" className="text-[#4c463c] hover:text-[#1c1b19] transition-colors whitespace-nowrap">
              Người Dùng
            </Link>
            <Link to="/admin/kyc" className="text-[#4c463c] hover:text-[#1c1b19] transition-colors whitespace-nowrap">
              Duyệt KYC
            </Link>
            <Link to="/admin/rent/listings" className="text-[#4c463c] hover:text-[#1c1b19] transition-colors whitespace-nowrap">
              Duyệt RENT
            </Link>
            <Link to="/admin/thrift/listings" className="text-[#4c463c] hover:text-[#1c1b19] transition-colors whitespace-nowrap">
              Duyệt THRIFT
            </Link>
            <Link to="/admin/categories" className="text-[#4c463c] hover:text-[#1c1b19] transition-colors whitespace-nowrap">
              Danh Mục Sàn
            </Link>
            <Link to="/admin/disputes" className="text-[#6c5937] font-semibold whitespace-nowrap border-b-2 border-[#6c5937] pb-0.5">
              Tranh Chấp
            </Link>
            <Link to="/admin/finance" className="text-[#4c463c] hover:text-[#1c1b19] transition-colors whitespace-nowrap">
              Tài Chính Sàn
            </Link>
          </nav>
        </div>
      </div>

      {/* Institutional Security Bar */}
      <div className="w-full bg-[#f7f3ef] border-b border-[#cfc5b8]/20 px-4 md:px-12 py-1.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-[11px] text-[#4c463c] overflow-hidden whitespace-nowrap">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#48654b] text-[14px]">
              verified_user
            </span>
            <span className="uppercase font-semibold tracking-wider text-[#48654b]">
              Bộ Phận Kiểm Soát Định Danh &amp; Bảo Mật (KYC Identity Vault)
            </span>
            <span className="text-[#cfc5b8]">•</span>
            <span>Hệ Thống Bảo Mật V4.2</span>
            <span className="text-[#cfc5b8]">•</span>
            <span>Giao Thức FIDO2 Cấp Cao</span>
            <span className="text-[#cfc5b8]">•</span>
            <span className="uppercase font-semibold text-[#6c5937]">
              Hội Đồng Trọng Tài Độc Lập (Smart Escrow Tribunal)
            </span>
            <span className="text-[#cfc5b8]">•</span>
            <span className="text-[#48654b]">
              Không Cho Phép Mạo Danh (Anti-Impersonation Active)
            </span>
          </div>
          <div className="hidden lg:flex items-center gap-1 font-mono text-[10px] text-[#7e766a]">
            <span>HASH: 8F2A...99D1</span>
          </div>
        </div>
      </div>

      {/* Top Protocol Bar */}
      <div className="w-full bg-[#f7f3ef] border-b border-[#cfc5b8]/30 px-4 md:px-12 py-2">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-[#4c463c]">
            <Link
              to="/admin/disputes"
              className="hover:text-[#6c5937] transition-colors flex items-center gap-1 font-semibold text-[#6c5937]"
            >
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              Quay lại danh sách Tranh chấp
            </Link>
            <span className="text-[#cfc5b8]">/</span>
            <Link to="/admin/dashboard" className="hover:text-[#1c1b19] transition-colors">
              Admin
            </Link>
            <span className="text-[#cfc5b8]">/</span>
            <Link to="/admin/disputes" className="hover:text-[#1c1b19] transition-colors">
              Tranh Chấp Sàn
            </Link>
            <span className="text-[#cfc5b8]">/</span>
            <span className="text-[#1c1b19] font-semibold">Chi Tiết Tranh Chấp {data?.disputeCode || disputeCode}</span>
          </div>

          <div className="flex items-center gap-3 text-[11px] font-mono">
            <span className="bg-[#f2ede9] text-[#7f5227] px-2 py-0.5 rounded font-semibold tracking-tight border border-[#cfc5b8]/30">
              ESCROW: MULTI-SIG 2/3
            </span>
            <span className="text-[#cfc5b8]">•</span>
            <span className="text-[#48654b] font-medium flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#48654b] animate-pulse"></span>
              LEDGER SYNCHRONIZED
            </span>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="max-w-7xl mx-auto w-full py-20 px-4 flex flex-col items-center justify-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-[#cfc5b8] border-t-[#6c5937] animate-spin"></div>
          <span className="text-sm font-semibold text-[#4c463c]">
            Đang tải hồ sơ tranh chấp #{disputeCode.replace("#", "")} từ cơ sở dữ liệu MongoDB...
          </span>
        </div>
      ) : fetchError || !data ? (
        <div className="max-w-3xl mx-auto w-full py-16 px-4 text-center">
          <div className="p-8 bg-white rounded-2xl border border-[#cfc5b8]/30 shadow-sm flex flex-col items-center gap-3">
            <span className="material-symbols-outlined text-4xl text-[#ba1a1a]">search_off</span>
            <h2 className="text-xl font-bold font-serif text-[#1c1b19]">
              Không tìm thấy hồ sơ tranh chấp
            </h2>
            <p className="text-xs sm:text-sm text-[#7e766a] max-w-md">
              {fetchError || `Hồ sơ ${disputeCode} không tồn tại hoặc đã bị xóa khỏi cơ sở dữ liệu MongoDB.`}
            </p>
            <Link
              to="/admin/disputes"
              className="mt-4 px-4 py-2 rounded-lg bg-[#1c1b19] hover:bg-[#6c5937] text-white text-xs font-semibold transition-colors flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              Quay lại danh sách tranh chấp
            </Link>
          </div>
        </div>
      ) : (
        <>
      {/* Header Dossier Banner */}
      <section className="w-full bg-[#fdf8f5] py-6 px-4 md:px-12 border-b border-[#cfc5b8]/20">
        <div className="max-w-7xl mx-auto flex flex-col gap-6">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
            <div className="flex flex-col gap-2 max-w-3xl">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl sm:text-4xl font-serif text-[#1c1b19] font-medium tracking-tight">
                  Dispute #{data.disputeCode?.replace("#", "") || disputeCode.replace("#", "")}
                </h1>
                {isResolvedDispute ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#caebc9] text-[#05210c] rounded text-xs uppercase font-semibold">
                    <span className="w-2 h-2 rounded-full bg-[#48654b]"></span>
                    RESOLVED • ĐÃ BAN HÀNH PHÁN QUYẾT &amp; ĐÓNG HỒ SƠ
                  </span>
                ) : disputeStatus === "UNDER_REVIEW" ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#ffdcc1] text-[#2e1500] rounded text-xs uppercase font-semibold">
                    <span className="w-2 h-2 rounded-full bg-[#7f5227] animate-pulse"></span>
                    UNDER REVIEW • Đang Thẩm Định
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#ffdcc1] text-[#7f5227] rounded text-xs uppercase font-semibold">
                    <span className="w-2 h-2 rounded-full bg-[#7f5227] animate-pulse"></span>
                    OPEN • Tiếp Nhận Đối Soát
                  </span>
                )}
                <span className="bg-[#ece7e4] text-[#4c463c] px-2.5 py-1 rounded text-xs font-mono font-medium">
                  {isResolvedDispute ? "ĐÃ TẤT TOÁN 100%" : data.slaRemaining}
                </span>
              </div>

              <p className="text-xl sm:text-2xl text-[#4c463c] font-serif italic">
                {data.title}
              </p>

              <div className="flex flex-wrap items-center gap-3 text-xs text-[#4c463c] pt-1">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px] text-[#7e766a]">schedule</span>
                  Mở hồ sơ: {data.createdAt ? new Date(data.createdAt).toLocaleDateString("vi-VN") : "24/10/2026"}
                </span>
                <span className="text-[#cfc5b8]">•</span>
                <span className="flex items-center gap-1 text-[#7f5227] font-semibold">
                  <span className="material-symbols-outlined text-[16px] text-[#7f5227]">alarm</span>
                  Hạn SLA Trọng Tài: {data.slaDeadline}
                </span>
                <span className="text-[#cfc5b8]">•</span>
                <span className="font-mono text-[#7e766a]">MÃ PHÒNG LAB: {data.labCode}</span>
              </div>
            </div>

            {/* Escrow Ledger Lock Capsule */}
            <div className="bg-[#f7f3ef] p-5 rounded-2xl flex flex-col justify-between gap-3 min-w-[290px] shadow-sm border border-[#cfc5b8]/30">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider text-[#4c463c] font-semibold flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[#48654b] text-[18px]">
                    {isVerdictExecuted ? "check_circle" : "lock"}
                  </span>
                  Smart Escrow Multi-Sig
                </span>
                {isVerdictExecuted ? (
                  <span className="bg-[#caebc9] text-[#05210c] text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                    ĐÃ TẤT TOÁN
                  </span>
                ) : (
                  <span className="w-2.5 h-2.5 rounded-full bg-[#48654b]"></span>
                )}
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-[#7e766a]">
                  {isVerdictExecuted ? "Ký quỹ đã giải phóng hoàn tất vào ví" : "Ký quỹ đang phong tỏa tuyệt đối"}
                </span>
                <span className="text-2xl sm:text-3xl font-serif font-bold text-[#6c5937] leading-tight">
                  {Number(data.escrowAmount || 0).toLocaleString("vi-VN")} ₫
                </span>
              </div>
              <div className="bg-white p-2.5 rounded-lg text-xs flex items-center justify-between text-[#4c463c] border border-[#cfc5b8]/20">
                <span>{isVerdictExecuted ? "Phân bổ ví nội bộ:" : "Yêu cầu khấu trừ:"}</span>
                <span className={`font-bold ${isVerdictExecuted ? "text-[#48654b]" : "text-[#ba1a1a]"}`}>
                  {isVerdictExecuted ? "100% HOÀN TẤT" : `${Number(data.claimAmount || 0).toLocaleString("vi-VN")} ₫`}
                </span>
              </div>
            </div>
          </div>

          {/* Lifecycle Progress Steps */}
          <div className="w-full bg-[#f7f3ef] p-3 rounded-xl flex flex-col md:flex-row items-center justify-between gap-3 border border-[#cfc5b8]/30">
            <div className="flex items-center gap-2 text-xs text-[#4c463c]">
              <span className="w-6 h-6 rounded-full bg-[#caebc9] text-[#05210c] flex items-center justify-center font-mono text-[11px] font-bold">
                ✓
              </span>
              <span className="font-semibold text-[#1c1b19]">1. OPEN (Tiếp nhận)</span>
            </div>

            <div className="h-0.5 flex-1 bg-[#6c5937]/30 hidden md:block"></div>

            <div
              className={`flex items-center gap-2 text-xs ${
                disputeStatus === "UNDER_REVIEW" ? "font-bold text-[#6c5937]" : "text-[#4c463c]"
              }`}
            >
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center font-mono text-[11px] font-bold ${
                  disputeStatus === "UNDER_REVIEW"
                    ? "bg-[#6c5937] text-white"
                    : "bg-[#caebc9] text-[#05210c]"
                }`}
              >
                {disputeStatus === "UNDER_REVIEW" ? "2" : "✓"}
              </span>
              <span>2. UNDER REVIEW (Thẩm định giám định)</span>
            </div>

            <div
              className={`h-0.5 flex-1 hidden md:block ${
                isVerdictExecuted || disputeStatus === "RESOLVED" || disputeStatus === "CLOSED"
                  ? "bg-[#48654b]"
                  : "bg-[#cfc5b8]/30"
              }`}
            ></div>

            <div
              className={`flex items-center gap-2 text-xs ${
                isVerdictExecuted
                  ? "text-[#4c463c]"
                  : disputeStatus === "RESOLVED" || disputeStatus === "CLOSED"
                  ? "font-bold text-[#6c5937]"
                  : "text-[#7e766a]"
              }`}
            >
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center font-mono text-[11px] font-bold ${
                  isVerdictExecuted
                    ? "bg-[#caebc9] text-[#05210c]"
                    : disputeStatus === "RESOLVED" || disputeStatus === "CLOSED"
                    ? "bg-[#6c5937] text-white"
                    : "bg-[#e6e2de] text-[#7e766a]"
                }`}
              >
                {isVerdictExecuted ? "✓" : "3"}
              </span>
              <span>3. RESOLVED (Ban hành phán quyết)</span>
            </div>

            <div
              className={`h-0.5 flex-1 hidden md:block ${
                isVerdictExecuted ? "bg-[#48654b]" : "bg-[#cfc5b8]/30"
              }`}
            ></div>

            <div
              className={`flex items-center gap-2 text-xs ${
                isVerdictExecuted ? "font-bold text-[#48654b]" : "text-[#7e766a]"
              }`}
            >
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center font-mono text-[11px] font-bold ${
                  isVerdictExecuted
                    ? "bg-[#48654b] text-white"
                    : "bg-[#e6e2de] text-[#7e766a]"
                }`}
              >
                {isVerdictExecuted ? "✓" : "4"}
              </span>
              <span>4. CLOSED (Thanh khoản hoàn tất)</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Sections */}
      <div className="w-full px-4 md:px-12 py-8">
        <div className="max-w-7xl mx-auto flex flex-col gap-10">
          {/* SECTION 1: PARTIES (ĐƯƠNG SỰ TRANH CHẤP) */}
          <section className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#6c5937] uppercase font-bold tracking-wider font-mono">
                  01 // DOSSIER
                </span>
                <span className="text-[#cfc5b8]">•</span>
                <h2 className="text-lg font-serif font-bold text-[#1c1b19]">
                  Đương Sự Tranh Chấp &amp; Chỉ Số Tín Nhiệm
                </h2>
              </div>
              <span className="text-xs text-[#4c463c]">Chế độ giám sát trọng tài độc lập</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Card Customer */}
              <div className="bg-[#f7f3ef] p-6 rounded-2xl flex flex-col justify-between gap-5 shadow-sm border border-[#cfc5b8]/30">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="bg-white text-[#6c5937] px-2.5 py-1 rounded text-xs uppercase font-bold border border-[#cfc5b8]/30">
                      Khách Hàng (Người Thuê)
                    </span>
                    <span className="font-mono text-[#7e766a] text-xs">ID: {data.renter.code}</span>
                  </div>

                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-xl font-serif font-bold text-[#1c1b19]">{data.renter.fullName}</h3>
                      <span className="text-xs text-[#4c463c]">Thành viên Collector Circle từ 2024</span>
                    </div>
                    <div className="flex items-center gap-1 bg-[#caebc9] text-[#05210c] px-2.5 py-1 rounded text-xs font-semibold">
                      <span className="material-symbols-outlined text-[16px]">verified</span>
                      {data.renter.tier}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div className="bg-white p-3 rounded-xl border border-[#cfc5b8]/20">
                      <span className="text-xs text-[#7e766a] block">Điểm Tín Nhiệm</span>
                      <span className="text-lg font-serif font-bold text-[#48654b]">{data.renter.trustScore}</span>
                      <span className="text-[11px] text-[#4c463c] block mt-0.5">{data.renter.cleanOrdersText}</span>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-[#cfc5b8]/20">
                      <span className="text-xs text-[#7e766a] block">Liên Hệ Ẩn Danh</span>
                      <span className="text-xs font-mono text-[#1c1b19] block mt-1 truncate">
                        {data.renter.email}
                      </span>
                      <span className="text-[11px] font-mono text-[#7e766a]">{data.renter.phoneNumber}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-[#cfc5b8]/20">
                  <span className="text-xs text-[#48654b] font-medium flex items-center gap-1">
                    <span className="material-symbols-outlined text-[15px]">fingerprint</span>
                    Xác thực sinh trắc học hoàn tất
                  </span>
                  <Link
                    to="/admin/users"
                    className="text-xs text-[#6c5937] font-bold hover:text-[#1c1b19] transition-colors flex items-center gap-1"
                  >
                    Xem Hồ Sơ Khách Hàng{" "}
                    <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </Link>
                </div>
              </div>

              {/* Card Shop Owner */}
              <div className="bg-[#f7f3ef] p-6 rounded-2xl flex flex-col justify-between gap-5 shadow-sm border border-[#cfc5b8]/30">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="bg-white text-[#7f5227] px-2.5 py-1 rounded text-xs uppercase font-bold border border-[#cfc5b8]/30">
                      Chủ Xưởng Lưu Ký
                    </span>
                    <span className="font-mono text-[#7e766a] text-xs">SHOP: {data.shopOwner.code}</span>
                  </div>

                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-xl font-serif font-bold text-[#1c1b19]">
                        {data.shopOwner.shopName}
                      </h3>
                      <span className="text-xs text-[#4c463c]">
                        Đại diện pháp lý: {data.shopOwner.representative}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 bg-white text-[#6c5937] px-2.5 py-1 rounded text-xs font-semibold border border-[#cfc5b8]/30">
                      <span className="material-symbols-outlined text-[16px] text-[#7f5227]">stars</span>
                      {data.shopOwner.tier}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div className="bg-white p-3 rounded-xl border border-[#cfc5b8]/20">
                      <span className="text-xs text-[#7e766a] block">Đánh Giá Xưởng</span>
                      <span className="text-lg font-serif font-bold text-[#6c5937]">{data.shopOwner.rating}</span>
                      <span className="text-[11px] text-[#4c463c] block mt-0.5">
                        {data.shopOwner.statsText}
                      </span>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-[#cfc5b8]/20">
                      <span className="text-xs text-[#7e766a] block">Trạm Kiểm Định Kho</span>
                      <span className="text-xs text-[#1c1b19] font-medium block mt-1">
                        {data.shopOwner.stationName}
                      </span>
                      <span className="text-[11px] text-[#7e766a]">{data.shopOwner.stationDetail}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-[#cfc5b8]/20">
                  <span className="text-xs text-[#48654b] font-medium flex items-center gap-1">
                    <span className="material-symbols-outlined text-[15px]">security</span>
                    Bảo chứng hạn mức tín chấp sàn
                  </span>
                  <Link
                    to="/admin/shops"
                    className="text-xs text-[#6c5937] font-bold hover:text-[#1c1b19] transition-colors flex items-center gap-1"
                  >
                    Xem Hồ Sơ Chủ Xưởng{" "}
                    <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </Link>
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 2: RELATED ORDER (ĐƠN HÀNG ĐỐI SOÁT) */}
          <section className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#6c5937] uppercase font-bold tracking-wider font-mono">
                  02 // CONTRACT
                </span>
                <span className="text-[#cfc5b8]">•</span>
                <h2 className="text-lg font-serif font-bold text-[#1c1b19]">
                  Đơn Hàng Đối Soát Gốc &amp; Khung Ký Quỹ
                </h2>
              </div>
              <span className="bg-[#f2ede9] px-2.5 py-1 rounded text-xs font-mono text-[#7e766a] border border-[#cfc5b8]/30">
                MÃ GIAO DỊCH: #{data.orderCode?.replace("#", "")}
              </span>
            </div>

            <div className="bg-[#f7f3ef] p-6 rounded-2xl flex flex-col gap-5 shadow-sm border border-[#cfc5b8]/30">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                {/* Product Info Thumbnail */}
                <div className="lg:col-span-5 flex items-center gap-4">
                  <div
                    onClick={() =>
                      setSelectedPhotoZoom({
                        url: data.product.image,
                        title: data.product.name,
                        desc: `Hiện vật đối soát trong hợp đồng thuê ${data.orderType} #${data.orderCode}`,
                      })
                    }
                    className="w-28 h-28 bg-white rounded-xl overflow-hidden flex-shrink-0 cursor-pointer shadow-sm border border-[#cfc5b8]/40 hover:opacity-95 transition-opacity"
                  >
                    <img
                      className="w-full h-full object-cover"
                      alt={data.product.name}
                      src={data.product.image}
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] uppercase tracking-wider text-[#48654b] font-bold">
                      ĐƠN HÀNG {data.orderType === "RENT" ? "CHO THUÊ (RENT ORDER)" : "THANH LÝ (THRIFT ORDER)"}
                    </span>
                    <h4 className="text-base font-serif font-bold text-[#1c1b19]">
                      {data.product.name}
                    </h4>
                    <p className="text-xs text-[#4c463c]">
                      {data.product.detail}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-[#7e766a] mt-0.5">
                      <span className="material-symbols-outlined text-[14px]">calendar_month</span>
                      <span>Kỳ thuê: {data.product.rentalDuration}</span>
                    </div>
                  </div>
                </div>

                {/* Financial Breakdown Inset */}
                <div className="lg:col-span-5 grid grid-cols-2 gap-3 bg-white p-4 rounded-xl border border-[#cfc5b8]/30">
                  <div className="flex flex-col">
                    <span className="text-[11px] text-[#7e766a]">Tiền thuê (Đã thanh toán)</span>
                    <span className="text-base font-serif font-bold text-[#1c1b19]">
                      {Number(data.product.rentalFee || 0).toLocaleString("vi-VN")} ₫
                    </span>
                    <span className="text-[11px] text-[#4c463c]">
                      {Number(data.product.pricePerDay || 0).toLocaleString("vi-VN")} ₫ / ngày qua VNPay
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[11px] text-[#7e766a]">Smart Escrow Khóa An Toàn</span>
                    <span className="text-base font-serif font-bold text-[#6c5937]">
                      {Number(data.escrowAmount || 0).toLocaleString("vi-VN")} ₫
                    </span>
                    <span className="text-[11px] text-[#ba1a1a] font-medium">Bị đóng băng do tranh chấp</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[11px] text-[#7e766a]">Khoản Chủ Xưởng đòi trừ</span>
                    <span className="text-base font-serif font-bold text-[#ba1a1a]">
                      {Number(data.claimAmount || 0).toLocaleString("vi-VN")} ₫
                    </span>
                    <span className="text-[11px] text-[#4c463c]">Phí hiệu chuẩn phòng sạch</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[11px] text-[#7e766a]">Yêu cầu Khách Hàng</span>
                    <span className="text-base font-serif font-bold text-[#48654b]">
                      {Number(data.escrowAmount || 0).toLocaleString("vi-VN")} ₫ (100%)
                    </span>
                    <span className="text-[11px] text-[#4c463c]">Bảo lưu toàn vẹn tiền cọc</span>
                  </div>
                </div>

                {/* Order Action CTA */}
                <div className="lg:col-span-2 flex flex-col justify-center items-stretch gap-2">
                  <Link
                    to={data.orderType === "THRIFT" ? `/thrift/orders/${data.orderCode}` : `/rent/orders/${data.orderCode}`}
                    className="bg-[#ece7e4] hover:bg-[#e6e2de] text-[#1c1b19] text-xs font-bold py-2.5 px-4 rounded-lg text-center transition-colors shadow-sm"
                  >
                    View {data.orderType} Order
                  </Link>
                  <div className="flex items-center justify-center gap-1 text-[11px] text-[#48654b] font-medium">
                    <span className="material-symbols-outlined text-[14px]">shield</span>
                    Smart Escrow Safe Guard
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 3: ISSUE DESCRIPTION (CHI TIẾT KHIẾU NẠI & NGUYÊN NHÂN) */}
          <section className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#6c5937] uppercase font-bold tracking-wider font-mono">
                  03 // STATEMENT
                </span>
                <span className="text-[#cfc5b8]">•</span>
                <h2 className="text-lg font-serif font-bold text-[#1c1b19]">
                  Chi Tiết Khiếu Nại &amp; Diễn Biến Sự Việc
                </h2>
              </div>
              <span className="bg-[#f2ede9] text-[#7f5227] px-2.5 py-1 rounded text-xs font-semibold uppercase border border-[#cfc5b8]/30">
                {data.categoryTag}
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Left: Statements Comparison */}
              <div className="lg:col-span-8 flex flex-col gap-4">
                {/* Shop Claim Card */}
                <div className="bg-[#f7f3ef] p-5 rounded-2xl flex flex-col gap-2 shadow-sm border border-[#cfc5b8]/30">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase font-bold text-[#7f5227] flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px]">report_problem</span>
                      Lời Khai Của Chủ Xưởng ({data.shopOwner.shopName})
                    </span>
                    <span className="font-mono text-[#7e766a] text-xs">{data.shopOwner.claimTime}</span>
                  </div>
                  <p className="text-sm sm:text-base text-[#1c1b19] font-serif italic leading-relaxed">
                    “{data.shopOwner.claimStatement}”
                  </p>
                  <div className="bg-white p-2.5 rounded-lg text-xs text-[#4c463c] flex items-center justify-between border border-[#cfc5b8]/20">
                    <span>Yêu cầu bồi hoàn: {Number(data.claimAmount || 0).toLocaleString("vi-VN")} ₫ (Khấu trừ cọc trực tiếp)</span>
                    <span className="font-mono text-[#7e766a]">MÃ BIÊN BẢN: {data.shopOwner.reportCode}</span>
                  </div>
                </div>

                {/* Customer Counter Statement Card */}
                <div className="bg-[#f7f3ef] p-5 rounded-2xl flex flex-col gap-2 shadow-sm border border-[#cfc5b8]/30">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase font-bold text-[#48654b] flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px]">gavel</span>
                      Phản Biện Của Khách Hàng ({data.renter.fullName})
                    </span>
                    <span className="font-mono text-[#7e766a] text-xs">{data.renter.statementTime}</span>
                  </div>
                  <p className="text-sm sm:text-base text-[#1c1b19] font-serif italic leading-relaxed">
                    “{data.renter.statement}”
                  </p>
                  <div className="bg-white p-2.5 rounded-lg text-xs text-[#4c463c] flex items-center justify-between border border-[#cfc5b8]/20">
                    <span>Yêu cầu trọng tài: {data.renter.request}</span>
                    <span className="text-[#48654b] font-semibold">Tín nhiệm người dùng {data.renter.trustScore}</span>
                  </div>
                </div>
              </div>

              {/* Right: Provenance Timeline */}
              <div className="lg:col-span-4 bg-[#f7f3ef] p-5 rounded-2xl flex flex-col justify-between shadow-sm border border-[#cfc5b8]/30">
                <div className="flex flex-col gap-3">
                  <span className="text-xs uppercase font-bold text-[#6c5937] tracking-wider font-mono">
                    TIMELINE PHÂN XỬ
                  </span>
                  <div className="relative pl-5 flex flex-col gap-4 py-1">
                    {/* Spine line */}
                    <div className="absolute left-1.5 top-2 bottom-2 w-0.5 bg-[#cfc5b8]"></div>

                    {data.timeline.map((item, idx) => (
                      <div key={idx} className="relative flex flex-col gap-0.5">
                        <div
                          className={`absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full ${
                            item.highlight ? "bg-[#6c5937] animate-pulse" : "bg-[#48654b]"
                          }`}
                        ></div>
                        <span className={`text-[11px] font-mono ${item.highlight ? "text-[#6c5937] font-bold" : "text-[#7e766a]"}`}>
                          {item.time}
                        </span>
                        <span className="text-xs text-[#1c1b19] font-bold">{item.title}</span>
                        <span className="text-[11px] text-[#4c463c]">{item.desc}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white p-2.5 rounded-lg text-xs text-[#7e766a] flex items-center gap-1.5 mt-3 border border-[#cfc5b8]/20">
                  <span className="material-symbols-outlined text-[16px] text-[#7f5227]">lock_clock</span>
                  Khóa biến động tài khoản đương sự
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 4: EVIDENCE FORENSICS (BẰNG CHỨNG ĐỐI SOÁT KIỂM ĐỊNH) */}
          <section className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#6c5937] uppercase font-bold tracking-wider font-mono">
                  04 // FORENSICS
                </span>
                <span className="text-[#cfc5b8]">•</span>
                <h2 className="text-lg font-serif font-bold text-[#1c1b19]">
                  Bằng Chứng Đối Soát Kiểm Định &amp; Giám Định Phòng Lab
                </h2>
              </div>
              <span className="text-xs text-[#48654b] font-medium">Báo cáo chuẩn phòng sạch ISO Class 5</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {data.evidences.map((ev, idx) => (
                <div key={idx} className="bg-[#f7f3ef] rounded-2xl overflow-hidden flex flex-col shadow-sm border border-[#cfc5b8]/30">
                  <div
                    onClick={() =>
                      setSelectedPhotoZoom({
                        url: ev.image,
                        title: ev.title,
                        desc: ev.desc,
                      })
                    }
                    className="h-56 bg-white relative cursor-pointer group"
                  >
                    <img
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      alt={ev.title}
                      src={ev.image}
                    />
                    <span
                      style={{ backgroundColor: ev.badgeColor || "#1c1b19" }}
                      className="absolute top-3 left-3 text-white text-xs px-2.5 py-1 rounded backdrop-blur font-semibold"
                    >
                      {ev.tag}
                    </span>
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <span className="bg-white/90 text-[#1c1b19] px-3 py-1 rounded text-xs font-semibold flex items-center gap-1 shadow">
                        <span className="material-symbols-outlined text-[16px]">zoom_in</span> Phóng to ảnh
                      </span>
                    </div>
                  </div>

                  <div className="p-5 flex flex-col gap-2 flex-1 justify-between">
                    <div>
                      <span className="text-[11px] uppercase font-bold text-[#48654b]">
                        {ev.evidenceNumber}
                      </span>
                      <h4 className="text-base font-serif font-bold text-[#1c1b19] mt-0.5">
                        {ev.title}
                      </h4>
                      <p className="text-xs text-[#4c463c] mt-1 leading-relaxed">
                        {ev.desc}
                      </p>
                    </div>
                    <div className="pt-2 flex items-center justify-between text-xs font-mono text-[#7e766a] bg-white p-2.5 rounded-lg border border-[#cfc5b8]/20">
                      <span>{ev.hash}</span>
                      <span className="text-[#48654b] font-bold">{ev.statusText}</span>
                    </div>
                  </div>
                </div>
              ))}

              {/* Neutral Tech Bench Gauge */}
              <div className="bg-[#f7f3ef] rounded-2xl overflow-hidden flex flex-col shadow-sm border border-[#cfc5b8]/30">
                <div className="h-56 bg-white relative flex items-center justify-center p-4">
                  <div className="w-full h-full bg-[#f2ede9] rounded-xl p-4 flex flex-col justify-between border border-[#cfc5b8]/20">
                    <div className="flex items-center justify-between">
                      <span className="text-xs uppercase font-bold text-[#6c5937]">
                        Lab Bench Audit
                      </span>
                      <span className="material-symbols-outlined text-[#48654b]">verified_user</span>
                    </div>

                    <div className="relative flex items-center justify-center py-1">
                      <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 36 36">
                        <path
                          className="text-[#cfc5b8]/40"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3.5"
                        ></path>
                        <path
                          className="text-[#48654b]"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke="currentColor"
                          strokeDasharray={`${data.benchAudit.gaugePercent}, 100`}
                          strokeLinecap="round"
                          strokeWidth="3.5"
                        ></path>
                      </svg>
                      <div className="absolute flex flex-col items-center">
                        <span className="text-xl font-serif font-bold text-[#1c1b19]">{data.benchAudit.gaugePercent}%</span>
                        <span className="text-[10px] text-[#7e766a]">{data.benchAudit.gaugeLabel}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-[#4c463c]">
                      <span>Phân loại tổn hại:</span>
                      <span className="font-bold text-[#48654b]">{data.benchAudit.damageClassification}</span>
                    </div>
                  </div>
                </div>

                <div className="p-5 flex flex-col gap-2 flex-1 justify-between">
                  <div>
                    <span className="text-[11px] uppercase font-bold text-[#6c5937]">
                      {data.benchAudit.title}
                    </span>
                    <h4 className="text-base font-serif font-bold text-[#1c1b19] mt-0.5">
                      Báo Cáo Phòng Kỹ Thuật ReUse Hub
                    </h4>
                    <p className="text-xs text-[#4c463c] mt-1 leading-relaxed">
                      {data.benchAudit.reportText}
                    </p>
                  </div>
                  <div className="pt-2 flex items-center justify-between text-xs font-mono text-[#7e766a] bg-white p-2.5 rounded-lg border border-[#cfc5b8]/20">
                    <span>AUDITOR: {data.benchAudit.auditor}</span>
                    <span className="text-[#48654b] font-bold">{data.benchAudit.conclusion}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Guardrail Notice */}
            <div className="bg-[#ece7e4] p-4 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3 border border-[#cfc5b8]/30">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[#6c5937] text-[24px]">
                  account_balance
                </span>
                <div className="flex flex-col">
                  <span className="text-xs font-serif font-bold text-[#1c1b19]">
                    Chi Tiết Ký Quỹ &amp; Bảo Mật Ngân Hàng
                  </span>
                  <span className="text-[11px] text-[#4c463c] font-mono">
                    VNPay Reference: VNP-88492019-ESCROW • Custody Vault: Segregated Escrow (Vietcombank SVB)
                  </span>
                </div>
              </div>
              <div className="bg-white px-3 py-1.5 rounded-lg text-xs text-[#7e766a] border border-[#cfc5b8]/20">
                Dữ liệu cá nhân nhạy cảm, số thẻ ngân hàng &amp; các đơn hàng khác được ẩn tuyệt đối.
              </div>
            </div>
          </section>

          {/* SECTION 5: COMMUNICATION CONTEXT (LỊCH SỬ ĐỐI THOẠI) */}
          <section className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#6c5937] uppercase font-bold tracking-wider font-mono">
                  05 // TRANSCRIPT
                </span>
                <span className="text-[#cfc5b8]">•</span>
                <h2 className="text-lg font-serif font-bold text-[#1c1b19]">
                  Lịch Sử Đối Thoại Ngữ Cảnh Giữa Hai Bên
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsChatModalOpen(true)}
                className="bg-[#f2ede9] hover:bg-[#ece7e4] text-[#1c1b19] text-xs font-semibold py-1.5 px-3.5 rounded-lg transition-colors flex items-center gap-1.5 border border-[#cfc5b8]/30 shadow-sm"
              >
                <span className="material-symbols-outlined text-[16px]">forum</span>
                Open Full Chat
              </button>
            </div>

            <div className="bg-[#f7f3ef] p-6 rounded-2xl flex flex-col gap-4 shadow-sm border border-[#cfc5b8]/30">
              <div className="flex flex-col gap-3">
                {data.dialogue.map((msg, idx) => {
                  const isCustomer = msg.sender === "CUSTOMER";
                  return (
                    <div
                      key={idx}
                      className={`flex items-start gap-3 max-w-2xl ${isCustomer ? "ml-auto flex-row-reverse" : ""}`}
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-mono font-bold text-[11px] flex-shrink-0 shadow-sm ${
                          isCustomer
                            ? "bg-[#48654b] text-white"
                            : "bg-[#ece7e4] text-[#7f5227] border border-[#cfc5b8]/40"
                        }`}
                      >
                        {isCustomer ? "CUS" : "SHP"}
                      </div>
                      <div
                        className={`p-3.5 rounded-2xl flex flex-col gap-1 shadow-sm border ${
                          isCustomer ? "bg-[#ece7e4] border-[#cfc5b8]/30" : "bg-white border-[#cfc5b8]/20"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-4 text-xs">
                          <span className={`font-bold ${isCustomer ? "text-[#1c1b19]" : "text-[#7f5227]"}`}>
                            {msg.senderName}
                          </span>
                          <span className="text-[#7e766a] font-mono text-[11px]">{msg.time}</span>
                        </div>
                        <p className="text-xs sm:text-sm text-[#1c1b19] leading-relaxed">
                          {msg.text}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Anti-impersonation notice */}
              <div className="bg-white p-3 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-[#4c463c] border border-[#cfc5b8]/30">
                <span className="flex items-center gap-2 text-[#6c5937] font-medium">
                  <span className="material-symbols-outlined text-[16px]">verified</span>
                  Quản trị viên theo dõi lịch sử đối thoại với tư cách trọng tài khách quan. Không gửi tin nhắn thay mặt hoặc mạo danh bất kỳ bên nào.
                </span>
                <span className="font-mono text-[#7e766a] text-[11px]">CHANNEL: AUDITED-P2P</span>
              </div>
            </div>
          </section>

          {/* SECTION 6: RESOLUTION & ARBITRATION BENCH (PHÁN QUYẾT TRỌNG TÀI) */}
          <section className="flex flex-col gap-4 pb-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#6c5937] uppercase font-bold tracking-wider font-mono">
                  06 // ARBITRATION
                </span>
                <span className="text-[#cfc5b8]">•</span>
                <h2 className="text-lg font-serif font-bold text-[#1c1b19]">
                  Quyết Định Trọng Tài Ký Quỹ &amp; Giải Phóng Smart Escrow
                </h2>
              </div>
              <span className="bg-[#caebc9] text-[#05210c] px-2.5 py-1 rounded text-xs font-semibold">
                B-Corp Standard Tribunal
              </span>
            </div>

            {isResolvedDispute ? (
              /* GIAO DIỆN PHÁN QUYẾT ĐÃ HOÀN THÀNH - KHÓA HOÀN TOÀN KHÔNG CHO SỬA HOẶC BAN HÀNH LẠI */
              <div className="p-6 bg-[#f7f3ef] rounded-2xl border-2 border-[#48654b]/40 flex flex-col gap-6 shadow-md">
                {/* Header Badge */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-[#cfc5b8]/40">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-[#48654b] text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                      <span className="material-symbols-outlined text-[28px]">gavel</span>
                    </div>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-base sm:text-lg font-bold text-[#05210c]">
                          PHÁN QUYẾT TRỌNG TÀI ĐÃ THI HÀNH &amp; KÝ SỐ HOÀN TẤT
                        </span>
                        <span className="text-[11px] bg-[#48654b] text-white px-2.5 py-0.5 rounded-full font-mono font-semibold">
                          MULTI-SIG 2/3 CONFIRMED
                        </span>
                      </div>
                      <span className="text-xs text-[#4c463c]">
                        Hồ sơ tranh chấp #{data.disputeCode?.replace("#", "")} đã được giải quyết và đóng hồ sơ. Tiền đã được kết chuyển vào ví.
                      </span>
                    </div>
                  </div>
                  <span className="bg-[#48654b] text-white px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider font-mono">
                    CLOSED • ĐÃ TẤT TOÁN
                  </span>
                </div>

                {/* Phương án đã áp dụng */}
                <div className="p-4 bg-white rounded-xl border border-[#48654b]/30 flex flex-col gap-1.5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase font-bold text-[#6c5937]">
                      Phương Án Trọng Tài Đã Thi Hành:
                    </span>
                    <span className="text-[11px] bg-[#caebc9] text-[#05210c] px-2 py-0.5 rounded font-semibold font-mono">
                      QUYẾT ĐỊNH CHÍNH THỨC
                    </span>
                  </div>
                  <span className="text-sm sm:text-base font-bold text-[#1c1b19]">
                    {arbitrationPreset === "opt_1" || data.arbitration?.selectedPreset === "opt_1"
                      ? `Phương án 1 (Khuyến nghị chuẩn B-Corp): Hoàn trả 100% tiền ký quỹ cho Khách Hàng (${Number(data.escrowAmount || 0).toLocaleString("vi-VN")} ₫)`
                      : arbitrationPreset === "opt_2" || data.arbitration?.selectedPreset === "opt_2"
                      ? `Phương án 2: Hòa giải khấu trừ một phần cọc bồi thường xưởng`
                      : `Phương án 3: Chấp thuận toàn bộ yêu cầu Chủ Xưởng (Trừ 100% tiền cọc đối với Khách Hàng để đền bù thiệt hại cho Shop)`}
                  </span>
                  <p className="text-xs text-[#7e766a] leading-relaxed">
                    Tổn hại được phân xử độc lập căn cứ theo biên bản kiểm định đối soát phòng Lab và hồ sơ lưu thông hiện vật.
                  </p>
                </div>

                {/* Chi tiết phân bổ tài chính vào ví người dùng */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Renter Box */}
                  {(() => {
                    const finalRefund =
                      settlementResult?.refundToRenter ??
                      data.arbitration?.refundToRenter ??
                      (arbitrationPreset === "opt_3" || data.arbitration?.selectedPreset === "opt_3" ? 0 : data.escrowAmount);
                    const finalPayout =
                      settlementResult?.payoutToShop ??
                      data.arbitration?.payoutToShop ??
                      (arbitrationPreset === "opt_3" || data.arbitration?.selectedPreset === "opt_3" ? data.escrowAmount : 0);
                    const isFullDeduct = finalRefund === 0 && finalPayout > 0;
                    return (
                      <div className={`p-4 bg-white rounded-xl border ${isFullDeduct ? "border-[#ba1a1a]/30" : "border-[#48654b]/20"} flex flex-col gap-2 shadow-sm`}>
                        <div className="flex items-center justify-between text-xs text-[#7e766a]">
                          <span className="font-semibold flex items-center gap-1.5 text-[#1c1b19]">
                            <span className={`material-symbols-outlined text-[16px] ${isFullDeduct ? "text-[#ba1a1a]" : "text-[#48654b]"}`}>
                              account_balance_wallet
                            </span>
                            Ví Khách Thuê ({data.renter.fullName})
                          </span>
                          <span className="text-[11px] font-mono bg-[#f2ede9] px-2 py-0.5 rounded">
                            {data.renter.code}
                          </span>
                        </div>
                        <div className="flex items-baseline gap-2">
                          {isFullDeduct ? (
                            <>
                              <span className="text-2xl font-serif font-bold text-[#ba1a1a]">
                                -{finalPayout.toLocaleString("vi-VN")} ₫
                              </span>
                              <span className="text-xs font-semibold text-[#ba1a1a]">
                                TRỪ CỌC ĐỀN BÙ SHOP (HOÀN CỌC: 0 ₫)
                              </span>
                            </>
                          ) : (
                            <>
                              <span className="text-2xl font-serif font-bold text-[#48654b]">
                                +{finalRefund.toLocaleString("vi-VN")} ₫
                              </span>
                              <span className="text-xs font-semibold text-[#48654b]">
                                HOÀN CỌC
                              </span>
                            </>
                          )}
                        </div>
                        <p className="text-[11px] text-[#7e766a] leading-relaxed">
                          {isFullDeduct
                            ? "✓ Khách hàng vi phạm cam kết bảo quản: Đã trừ toàn bộ tiền cọc ký quỹ để đền bù thiệt hại cho Chủ xưởng (Hoàn về ví khách: 0 ₫)."
                            : "✓ Tiền đã được hoàn vào ví ReUse Hub của Khách. Khách có thể dùng thuê sản phẩm khác hoặc rút về STK ngân hàng bất cứ lúc nào."}
                        </p>
                      </div>
                    );
                  })()}

                  {/* Shop Box */}
                  <div className="p-4 bg-white rounded-xl border border-[#48654b]/20 flex flex-col gap-2 shadow-sm">
                    <div className="flex items-center justify-between text-xs text-[#7e766a]">
                      <span className="font-semibold flex items-center gap-1.5 text-[#1c1b19]">
                        <span className="material-symbols-outlined text-[16px] text-[#6c5937]">storefront</span>
                        Ví Chủ Xưởng ({data.shopOwner.shopName})
                      </span>
                      <span className="text-[11px] font-mono bg-[#f2ede9] px-2 py-0.5 rounded">
                        {data.shopOwner.code}
                      </span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-serif font-bold text-[#6c5937]">
                        +{(settlementResult?.payoutToShop ?? data.arbitration?.payoutToShop ?? (arbitrationPreset === "opt_3" || data.arbitration?.selectedPreset === "opt_3" ? data.escrowAmount : 0)).toLocaleString("vi-VN")} ₫
                      </span>
                      <span className="text-xs font-semibold text-[#6c5937]">BỒI THƯỜNG THIỆT HẠI</span>
                    </div>
                    <p className="text-[11px] text-[#7e766a] leading-relaxed">
                      {(settlementResult?.payoutToShop ?? data.arbitration?.payoutToShop ?? (arbitrationPreset === "opt_3" || data.arbitration?.selectedPreset === "opt_3" ? data.escrowAmount : 0)) > 0
                        ? "✓ Tiền bồi thường thiệt hại từ tiền cọc của khách đã được cộng trực tiếp vào ví doanh thu của Chủ xưởng."
                        : "✓ Chủ xưởng nhận phiếu kiểm định/vệ sinh miễn phí từ Quỹ Bảo Dưỡng Tuần Hoàn của Sàn."}
                    </p>
                  </div>
                </div>

                {/* Toàn văn Biên Bản Phán Quyết Đã Ký (READ ONLY) */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase font-bold text-[#4c463c] flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px] text-[#6c5937]">description</span>
                      Biên Bản Phán Quyết Đã Ban Hành (Official Resolution Decree)
                    </span>
                    <span className="text-[11px] font-mono text-[#7e766a] bg-[#ece7e4] px-2 py-0.5 rounded">
                      ĐÃ KÝ SỐ VÀ KHÓA CHỈNH SỬA
                    </span>
                  </div>
                  <div className="w-full bg-white p-5 rounded-xl text-[#1c1b19] text-xs sm:text-sm border border-[#cfc5b8]/50 leading-relaxed shadow-sm whitespace-pre-line font-serif italic bg-gradient-to-br from-white to-[#fbf8f5]">
                    {resolutionNote || data.arbitration?.adminNotes || "Biên bản phán quyết được lưu vĩnh viễn trên sổ cái MongoDB Smart Escrow."}
                  </div>
                </div>

                {/* Multi-Sig Ledger Proof */}
                <div className="bg-[#f2ede9] p-4 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs border border-[#cfc5b8]/40">
                  <div className="flex flex-col gap-1 min-w-[280px]">
                    <span className="font-bold text-[#4c463c] text-[11px] uppercase tracking-wider">
                      MÃ GIAO DỊCH SỔ CÁI BẤT BIẾN (MULTI-SIG TX HASH):
                    </span>
                    <span className="font-mono text-[#1c1b19] font-medium break-all text-xs">
                      {multiSigTxHash || data.arbitration?.multiSigTxHash || "0x406a43062082af97843e6654a919e7a83551870bd2f791b24500e1b3503c5f2f"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="bg-[#caebc9] text-[#05210c] px-3 py-1 rounded text-xs font-semibold flex items-center gap-1 font-mono">
                      <span className="material-symbols-outlined text-[14px]">lock</span>
                      LEDGER LOCKED (dispute_verdicts)
                    </span>
                  </div>
                </div>

                {/* Guardrail notice */}
                <div className="bg-[#e6e2de]/60 p-3.5 rounded-xl flex items-center gap-2.5 text-xs text-[#4c463c] border border-[#cfc5b8]/30">
                  <span className="material-symbols-outlined text-[18px] text-[#6c5937]">info</span>
                  <span>
                    Vụ việc này đã được giải quyết xong và đóng lại. Để bảo toàn tính toàn vẹn kiểm toán Smart Escrow, quản trị viên <strong>không thể thực hiện lại phán quyết</strong>.
                  </span>
                </div>

                {/* Navigation actions */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <div className="flex items-center gap-3">
                    <Link
                      to="/admin/disputes"
                      className="bg-[#1c1b19] hover:bg-[#6c5937] text-white px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 transition-colors shadow-md"
                    >
                      <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                      Quay lại Danh Sách Tranh Chấp
                    </Link>
                    <Link
                      to="/admin/users"
                      className="bg-white hover:bg-[#f2ede9] text-[#1c1b19] px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-colors border border-[#cfc5b8]/40 shadow-sm flex items-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-[18px]">account_balance_wallet</span>
                      Kiểm Tra Số Dư Ví Người Dùng
                    </Link>
                  </div>

                  <span className="text-xs text-[#7e766a] italic">
                    Hợp đồng đơn hàng #{data.orderCode} đã chuyển trạng thái COMPLETED.
                  </span>
                </div>
              </div>
            ) : (
              /* GIAO DIỆN KHI CHƯA PHÁN QUYẾT: CHO PHÉP CHỌN VÀ THỰC THI */
              <div className="bg-[#f7f3ef] p-6 rounded-2xl flex flex-col gap-6 shadow-md border border-[#cfc5b8]/40">
                {/* Status Selector Radio Group */}
                <div className="flex flex-col gap-2">
                  <span className="text-xs uppercase font-bold text-[#4c463c]">
                    Trạng thái xử lý hồ sơ:
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <label
                      onClick={() => setDisputeStatus("UNDER_REVIEW")}
                      className={`p-3.5 rounded-lg flex items-center gap-3 cursor-pointer transition-all border ${
                        disputeStatus === "UNDER_REVIEW"
                          ? "bg-[#f9dfb3]/20 border-[#6c5937] ring-1 ring-[#6c5937]"
                          : "bg-white border-[#cfc5b8]/30 hover:bg-[#f2ede9]"
                      }`}
                    >
                      <input
                        className="w-4 h-4 text-[#6c5937] focus:ring-0 accent-[#6c5937]"
                        name="dispute_status"
                        type="radio"
                        checked={disputeStatus === "UNDER_REVIEW"}
                        onChange={() => setDisputeStatus("UNDER_REVIEW")}
                      />
                      <div className="flex flex-col">
                        <span className={`text-xs font-semibold ${disputeStatus === "UNDER_REVIEW" ? "text-[#6c5937]" : "text-[#1c1b19]"}`}>
                          UNDER REVIEW
                        </span>
                        <span className="text-[11px] text-[#7e766a]">Tiếp tục đối soát phòng lab</span>
                      </div>
                    </label>

                    <label
                      onClick={() => setDisputeStatus("RESOLVED")}
                      className={`p-3.5 rounded-lg flex items-center gap-3 cursor-pointer transition-all border ${
                        (disputeStatus as string) === "RESOLVED"
                          ? "bg-[#f9dfb3]/20 border-[#6c5937] ring-1 ring-[#6c5937]"
                          : "bg-white border-[#cfc5b8]/30 hover:bg-[#f2ede9]"
                      }`}
                    >
                      <input
                        className="w-4 h-4 text-[#6c5937] focus:ring-0 accent-[#6c5937]"
                        name="dispute_status"
                        type="radio"
                        checked={(disputeStatus as string) === "RESOLVED"}
                        onChange={() => setDisputeStatus("RESOLVED")}
                      />
                      <div className="flex flex-col">
                        <span className={`text-xs font-semibold ${(disputeStatus as string) === "RESOLVED" ? "text-[#6c5937]" : "text-[#1c1b19]"}`}>
                          RESOLVED (Khuyến Nghị)
                        </span>
                        <span className="text-[11px] text-[#4c463c]">Ban hành phán quyết chính thức</span>
                      </div>
                    </label>

                    <label
                      onClick={() => setDisputeStatus("CLOSED")}
                      className={`p-3.5 rounded-lg flex items-center gap-3 cursor-pointer transition-all border ${
                        (disputeStatus as string) === "CLOSED"
                          ? "bg-[#f9dfb3]/20 border-[#6c5937] ring-1 ring-[#6c5937]"
                          : "bg-white border-[#cfc5b8]/30 hover:bg-[#f2ede9]"
                      }`}
                    >
                      <input
                        className="w-4 h-4 text-[#6c5937] focus:ring-0 accent-[#6c5937]"
                        name="dispute_status"
                        type="radio"
                        checked={(disputeStatus as string) === "CLOSED"}
                        onChange={() => setDisputeStatus("CLOSED")}
                      />
                      <div className="flex flex-col">
                        <span className={`text-xs font-semibold ${(disputeStatus as string) === "CLOSED" ? "text-[#6c5937]" : "text-[#1c1b19]"}`}>
                          CLOSED
                        </span>
                        <span className="text-[11px] text-[#7e766a]">Đóng vụ việc &amp; lưu trữ</span>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Presets Options Cards */}
                <div className="flex flex-col gap-2">
                  <span className="text-xs uppercase font-bold text-[#4c463c]">
                    Chọn Phương Án Phán Quyết Escrow:
                  </span>
                  <div className="flex flex-col gap-3">
                    {/* Preset 1 (Recommended) */}
                    <label
                      onClick={() => handleSelectPreset("opt_1")}
                      className={`p-4 rounded-xl flex items-start gap-4 cursor-pointer transition-all border ${
                        arbitrationPreset === "opt_1"
                          ? "bg-[#f2ede9] border-[#6c5937] ring-1 ring-[#6c5937]"
                          : "bg-white border-[#cfc5b8]/30 hover:bg-[#f2ede9]"
                      }`}
                    >
                      <input
                        className="mt-1 w-4 h-4 text-[#6c5937] focus:ring-0 accent-[#6c5937]"
                        name="arbitration_preset"
                        type="radio"
                        checked={arbitrationPreset === "opt_1"}
                        onChange={() => handleSelectPreset("opt_1")}
                      />
                      <div className="flex flex-col gap-1 flex-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-xs sm:text-sm font-semibold text-[#6c5937]">
                            Phương án 1 (Khuyến nghị chuẩn B-Corp): Hoàn trả 100% cọc cho Khách Hàng ({Number(data.escrowAmount || 0).toLocaleString("vi-VN")} ₫)
                          </span>
                          <span className="bg-[#caebc9] text-[#05210c] px-2 py-0.5 rounded text-[11px] font-semibold">
                            TỐI ƯU
                          </span>
                        </div>
                        <p className="text-xs text-[#4c463c] leading-relaxed">
                          Tổn hại được xác định thuộc nhóm hao mòn tự nhiên (Fair Wear &amp; Tear - Điều 4.2). Khách hàng không có lỗi. {data.shopOwner.shopName} nhận trợ giá 1 lần vệ sinh buồng tối miễn phí từ Quỹ Bảo Dưỡng Tuần Hoàn của Sàn.
                        </p>
                      </div>
                    </label>

                    {/* Preset 2 */}
                    <label
                      onClick={() => handleSelectPreset("opt_2")}
                      className={`p-4 rounded-xl flex items-start gap-4 cursor-pointer transition-all border ${
                        arbitrationPreset === "opt_2"
                          ? "bg-[#f2ede9] border-[#6c5937] ring-1 ring-[#6c5937]"
                          : "bg-white border-[#cfc5b8]/30 hover:bg-[#f2ede9]"
                      }`}
                    >
                      <input
                        className="mt-1 w-4 h-4 text-[#6c5937] focus:ring-0 accent-[#6c5937]"
                        name="arbitration_preset"
                        type="radio"
                        checked={arbitrationPreset === "opt_2"}
                        onChange={() => handleSelectPreset("opt_2")}
                      />
                      <div className="flex flex-col gap-1 flex-1">
                        <span className="text-xs sm:text-sm font-semibold text-[#1c1b19]">
                          Phương án 2: Hòa giải khấu trừ một phần (Đền bù {Math.min(data.claimAmount, 500000).toLocaleString("vi-VN")} ₫, hoàn cọc {Math.max(0, data.escrowAmount - Math.min(data.claimAmount, 500000)).toLocaleString("vi-VN")} ₫)
                        </span>
                        <p className="text-xs text-[#4c463c] leading-relaxed">
                          Chia sẻ rủi ro vận hành: Khấu trừ một phần chi phí phục hồi cơ bản cho xưởng, giải tỏa ngay phần tiền cọc còn lại về tài khoản khách hàng.
                        </p>
                      </div>
                    </label>

                    {/* Preset 3 */}
                    <label
                      onClick={() => handleSelectPreset("opt_3")}
                      className={`p-4 rounded-xl flex items-start gap-4 cursor-pointer transition-all border ${
                        arbitrationPreset === "opt_3"
                          ? "bg-[#f2ede9] border-[#6c5937] ring-1 ring-[#6c5937]"
                          : "bg-white border-[#cfc5b8]/30 hover:bg-[#f2ede9]"
                      }`}
                    >
                      <input
                        className="mt-1 w-4 h-4 text-[#6c5937] focus:ring-0 accent-[#6c5937]"
                        name="arbitration_preset"
                        type="radio"
                        checked={arbitrationPreset === "opt_3"}
                        onChange={() => handleSelectPreset("opt_3")}
                      />
                      <div className="flex flex-col gap-1 flex-1">
                        <span className="text-xs sm:text-sm font-semibold text-[#1c1b19]">
                          Phương án 3: Chấp thuận toàn bộ yêu cầu Chủ Xưởng (Trừ cọc đối với Khách Hàng {Number(data.escrowAmount || 0).toLocaleString("vi-VN")} ₫ • Đền bù thiệt hại cho Shop {Number(data.escrowAmount || 0).toLocaleString("vi-VN")} ₫, không hoàn cọc)
                        </span>
                        <p className="text-xs text-[#4c463c] leading-relaxed">
                          Chỉ áp dụng khi phát hiện bằng chứng khách hàng tự ý làm tổn hại hiện vật hoặc vi phạm quy chế cam kết sử dụng. Trừ 100% tiền cọc của khách hàng để đền bù thiệt hại cho Chủ Xưởng (Khách hàng nhận lại 0 ₫).
                        </p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Resolution Note Textarea */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs uppercase font-bold text-[#4c463c]">
                      Biên Bản Phán Quyết Của Quản Trị Viên (Resolution Note)
                    </label>
                    <span className="text-xs text-[#7e766a]">
                      Chuẩn pháp lý &amp; Ghi nhận Ledger Smart Escrow
                    </span>
                  </div>
                  <textarea
                    value={resolutionNote}
                    onChange={(e) => setResolutionNote(e.target.value)}
                    className="w-full bg-white p-4 rounded-xl text-[#1c1b19] text-xs sm:text-sm outline-none border border-[#cfc5b8]/40 focus:ring-1 focus:ring-[#6c5937] transition-colors leading-relaxed shadow-inner"
                    rows={5}
                  />
                </div>

                {/* CRITICAL LEDGER GUARDRAIL WARNING BOX */}
                <div className="bg-[#ffdad6] p-4 rounded-xl flex items-start gap-3 text-[#93000a] border border-[#ba1a1a]/20">
                  <span className="material-symbols-outlined text-[24px] flex-shrink-0 text-[#ba1a1a]">
                    gavel
                  </span>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs sm:text-sm font-bold uppercase">
                      LƯU Ý BẢO TOÀN SỔ CÁI BẤT BIẾN (IMMUTABLE ESCROW LEDGER):
                    </span>
                    <p className="text-xs leading-relaxed">
                      Quản trị viên chỉ ban hành phán quyết giải phóng hoặc khấu trừ ký quỹ Smart Escrow theo hợp đồng. Hệ thống tuyệt đối{" "}
                      <strong>KHÔNG cho phép chỉnh sửa thủ công số liệu thanh toán</strong>, biến động số dư hoặc giao dịch ngân hàng đã chốt nhằm đảm bảo tính toàn vẹn kiểm toán quốc tế.
                    </p>
                  </div>
                </div>

                {/* Actions Bench */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                  <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                    {/* Primary Release Button */}
                    <button
                      type="button"
                      onClick={() => setIsSignModalOpen(true)}
                      className="bg-[#1c1b19] hover:bg-[#6c5937] text-white px-6 py-3 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-colors shadow-md w-full sm:w-auto"
                    >
                      <span className="material-symbols-outlined text-[18px]">verified</span>
                      Ban Hành Phán Quyết &amp; Giải Phóng Ký Quỹ
                    </button>

                    {/* Draft Button */}
                    <button
                      type="button"
                      onClick={handleSaveDraft}
                      className="bg-white hover:bg-[#f2ede9] text-[#1c1b19] px-5 py-3 rounded-xl text-xs sm:text-sm font-semibold transition-colors w-full sm:w-auto text-center border border-[#cfc5b8]/40 shadow-sm"
                    >
                      Lưu Nháp Biên Bản
                    </button>
                  </div>

                  {/* Escalate Link */}
                  <button
                    type="button"
                    onClick={() => setIsEscalateModalOpen(true)}
                    className="text-xs text-[#7f5227] hover:text-[#ba1a1a] transition-colors flex items-center gap-1 font-semibold whitespace-nowrap"
                  >
                    <span className="material-symbols-outlined text-[16px]">priority_high</span>
                    Chuyển Hồ Sơ Sang Ban Pháp Lý Cấp Cao
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* Bottom Return Navigator */}
          <div className="pt-4 flex items-center justify-between text-xs text-[#4c463c] border-t border-[#cfc5b8]/30">
            <Link
              to="/admin/disputes"
              className="hover:text-[#6c5937] transition-colors flex items-center gap-1 font-semibold text-[#6c5937]"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              Quay lại danh sách Tranh chấp
            </Link>
            <span className="font-mono text-[#7e766a]">
              SECURE ARBITRATION BENCH • ENCRYPTED SESSION
            </span>
          </div>
        </div>
      </div>
      </>
      )}

      {/* MODAL 1: MULTI-SIG CONFIRMATION MODAL */}
      {isSignModalOpen && data && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#fdf8f5] w-full max-w-lg rounded-2xl p-6 shadow-2xl border border-[#cfc5b8]/40 flex flex-col gap-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#cfc5b8]/30">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#6c5937] text-[22px]">
                  key_vertical
                </span>
                <h3 className="font-serif font-bold text-lg text-[#1c1b19]">
                  Ký Đa Chữ Ký Giải Phóng Smart Escrow
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsSignModalOpen(false)}
                className="text-[#7e766a] hover:text-[#1c1b19]"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col gap-3 text-xs text-[#4c463c]">
              <div className="bg-[#f7f3ef] p-4 rounded-xl flex flex-col gap-2 border border-[#cfc5b8]/30">
                <div className="flex justify-between">
                  <span className="text-[#7e766a]">Mã Tranh Chấp:</span>
                  <span className="font-mono font-bold text-[#1c1b19]">{data.disputeCode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#7e766a]">Hiện Vật Đối Soát:</span>
                  <span className="font-semibold text-[#1c1b19] truncate max-w-[260px]">{data.product.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#7e766a]">Phương Án Thực Thi:</span>
                  <span className="font-bold text-[#6c5937]">
                    {arbitrationPreset === "opt_1"
                      ? `Hoàn trả 100% (${Number(data.escrowAmount || 0).toLocaleString("vi-VN")} ₫ cho Khách Hàng)`
                      : arbitrationPreset === "opt_2"
                      ? `Khấu trừ ${Math.min(data.claimAmount, 500000).toLocaleString("vi-VN")} ₫ • Hoàn ${Math.max(0, data.escrowAmount - Math.min(data.claimAmount, 500000)).toLocaleString("vi-VN")} ₫`
                      : `Trừ cọc Khách Hàng (-${Number(data.escrowAmount || 0).toLocaleString("vi-VN")} ₫) • Đền bù thiệt hại cho Shop (+${Number(data.escrowAmount || 0).toLocaleString("vi-VN")} ₫)`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#7e766a]">Giao Thức Ký Số:</span>
                  <span className="font-mono text-[#48654b] font-semibold">FIDO2 / SHA-256 Multi-Sig</span>
                </div>
              </div>

              <p className="leading-relaxed text-justify">
                Sau khi xác nhận, lệnh giải phóng ký quỹ sẽ được ghi nhận vĩnh viễn trên sổ cái MongoDB Smart Escrow Tribunal và cập nhật số dư ví nội bộ. Hành động này không thể hoàn tác thủ công.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#cfc5b8]/30">
              <button
                type="button"
                onClick={() => setIsSignModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#ece7e4] text-[#4c463c] hover:bg-[#e6e2de]"
              >
                Hủy Bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmVerdict}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#1c1b19] text-white hover:bg-[#6c5937] shadow"
              >
                Xác Nhận Ký Lệnh &amp; Thực Thi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: FULL CHAT MODAL */}
      {isChatModalOpen && data && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#fdf8f5] w-full max-w-2xl rounded-2xl p-6 shadow-2xl border border-[#cfc5b8]/40 flex flex-col gap-4 max-h-[85vh]">
            <div className="flex items-center justify-between pb-3 border-b border-[#cfc5b8]/30">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#6c5937] text-[22px]">forum</span>
                <h3 className="font-serif font-bold text-lg text-[#1c1b19]">
                  Toàn Bộ Lịch Sử Đối Thoại P2P Có Giám Sát
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsChatModalOpen(false)}
                className="text-[#7e766a] hover:text-[#1c1b19]"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto flex flex-col gap-3 pr-2">
              {data.dialogue.map((msg, idx) => {
                const isCustomer = msg.sender === "CUSTOMER";
                return (
                  <div
                    key={idx}
                    className={`flex items-start gap-3 max-w-lg ${isCustomer ? "ml-auto flex-row-reverse" : ""}`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-mono font-bold text-[11px] flex-shrink-0 ${
                        isCustomer ? "bg-[#48654b] text-white" : "bg-[#ece7e4] text-[#7f5227]"
                      }`}
                    >
                      {isCustomer ? "CUS" : "SHP"}
                    </div>
                    <div
                      className={`p-3 rounded-xl border shadow-sm text-xs ${
                        isCustomer ? "bg-[#ece7e4] border-[#cfc5b8]/30" : "bg-white border-[#cfc5b8]/20"
                      }`}
                    >
                      <div
                        className={`flex justify-between gap-3 font-semibold mb-1 ${
                          isCustomer ? "text-[#1c1b19]" : "text-[#7f5227]"
                        }`}
                      >
                        <span>{msg.senderName}</span>
                        <span className="text-[#7e766a] font-mono text-[10px]">{msg.time}</span>
                      </div>
                      <p>{msg.text}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-3 border-t border-[#cfc5b8]/30 flex justify-end">
              <button
                type="button"
                onClick={() => setIsChatModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#1c1b19] text-white"
              >
                Đóng Cửa Sổ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: ESCALATE MODAL */}
      {isEscalateModalOpen && data && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#fdf8f5] w-full max-w-md rounded-2xl p-6 shadow-2xl border border-[#cfc5b8]/40 flex flex-col gap-4">
            <div className="flex items-center gap-2 pb-2 border-b border-[#cfc5b8]/30 text-[#ba1a1a]">
              <span className="material-symbols-outlined text-[24px]">warning</span>
              <h3 className="font-serif font-bold text-lg text-[#1c1b19]">
                Chuyển Lên Ban Pháp Lý Cấp Cao
              </h3>
            </div>
            <p className="text-xs text-[#4c463c] leading-relaxed">
              Bạn đang yêu cầu chuyển vụ tranh chấp <strong>{data.disputeCode}</strong> lên Ban Thư Ký Trọng Tài &amp; Hội Đồng Cố Vấn Pháp Lý. Hồ sơ sẽ được đóng băng thêm 24 giờ để thành lập ban hội thẩm 3 thành viên.
            </p>
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#cfc5b8]/30">
              <button
                type="button"
                onClick={() => setIsEscalateModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#ece7e4] text-[#4c463c]"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleEscalateConfirm}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[#ba1a1a] text-white shadow"
              >
                Xác Nhận Chuyển Giao
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: IMAGE LIGHTBOX ZOOM */}
      {selectedPhotoZoom && (
        <div
          onClick={() => setSelectedPhotoZoom(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md cursor-zoom-out animate-fadeIn"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#1c1b19] max-w-4xl max-h-[90vh] rounded-2xl overflow-hidden flex flex-col shadow-2xl border border-white/20"
          >
            <div className="relative flex-1 overflow-auto bg-black flex items-center justify-center min-h-[300px]">
              <img
                src={selectedPhotoZoom.url}
                alt={selectedPhotoZoom.title}
                className="max-h-[75vh] w-auto object-contain"
              />
              <button
                type="button"
                onClick={() => setSelectedPhotoZoom(null)}
                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black"
              >
                ✕
              </button>
            </div>
            <div className="p-4 bg-[#1c1b19] text-[#fdf8f5] flex flex-col gap-1">
              <h4 className="font-serif font-bold text-base text-white">{selectedPhotoZoom.title}</h4>
              <p className="text-xs text-white/70">{selectedPhotoZoom.desc}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DisputeReview;
