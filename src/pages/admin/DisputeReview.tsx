import React, { useState } from "react";
import { Link, useParams } from "react-router-dom";

export type DisputeReviewStatus = "OPEN" | "UNDER_REVIEW" | "RESOLVED" | "CLOSED";
export type ArbitrationPreset = "opt_1" | "opt_2" | "opt_3";

const PRESET_NOTES: Record<ArbitrationPreset, string> = {
  opt_1: `Căn cứ ảnh đối soát xuất kho ngày 18/10 (tem seal #RH-902 còn nguyên) và kết quả giám định của Phòng Kỹ Thuật ReUse Hub (Tech Lab #04):
- Vệt trầy xước nhẹ tại mép ngoài ngàm lens là hao mòn cơ khí tự nhiên (Fair Wear & Tear), đã hiện hữu trước đợt bàn giao.
- Bụi buồng trập là bụi không khí phát sinh thông thường, đã được làm sạch ngay tại bench kiểm định mà không gây suy giảm quang học.
Hội đồng Trọng tài ra quyết định: Hoàn trả 100% tiền ký quỹ (18,000,000 ₫) cho khách hàng Lê Minh Khoa. Xưởng Kyoto Archival Optics nhận mã voucher bảo dưỡng phòng sạch tài trợ bởi Quỹ Lưu Hành Tuần Hoàn ReUse Hub.`,
  opt_2: `Căn cứ đề xuất hòa giải thiện chí và biên bản kiểm định đối soát:
- Chia sẻ rủi ro vận hành trong quá trình lưu thông thiết bị quang học cao cấp.
- Khấu trừ 500,000 ₫ từ tiền ký quỹ chi trả chi phí thổi bụi phòng sạch tiêu chuẩn cho Chủ Xưởng Kyoto Archival Optics.
- Giải tỏa và hoàn trả ngay 17,500,000 ₫ tiền ký quỹ còn lại về tài khoản khách hàng Lê Minh Khoa. Vụ việc hoàn tất hòa giải.`,
  opt_3: `Căn cứ biên bản tiếp nhận hoàn trả ngày 23/10 và đề nghị từ Chủ Xưởng:
- Chấp thuận yêu cầu khấu trừ 2,500,000 ₫ từ khoản ký quỹ để thực hiện bảo dưỡng và định chuẩn ngàm ống kính tại trung tâm chính hãng.
- Giải phóng 15,500,000 ₫ số dư ký quỹ còn lại hoàn trả cho khách hàng Lê Minh Khoa.`,
};

export const DisputeReview: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  // Normalize ID display
  const disputeCode = id
    ? id.startsWith("#")
      ? id
      : `#${id.toUpperCase().startsWith("RH-") ? id.toUpperCase() : `RH-${id.toUpperCase()}`}`
    : "#RH-D4091";

  // Form State
  const [disputeStatus, setDisputeStatus] = useState<DisputeReviewStatus>("RESOLVED");
  const [arbitrationPreset, setArbitrationPreset] = useState<ArbitrationPreset>("opt_1");
  const [resolutionNote, setResolutionNote] = useState<string>(PRESET_NOTES["opt_1"]);

  // Modals & Feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const [isEscalateModalOpen, setIsEscalateModalOpen] = useState(false);
  const [selectedPhotoZoom, setSelectedPhotoZoom] = useState<{ url: string; title: string; desc: string } | null>(null);
  const [isVerdictExecuted, setIsVerdictExecuted] = useState(false);
  const [multiSigTxHash, setMultiSigTxHash] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  const handleSelectPreset = (preset: ArbitrationPreset) => {
    setArbitrationPreset(preset);
    setResolutionNote(PRESET_NOTES[preset]);
    showToast(`Đã áp dụng mẫu phán quyết: ${preset === "opt_1" ? "Phương án 1 (Khuyến nghị B-Corp)" : preset === "opt_2" ? "Phương án 2 (Hòa giải chia sẻ)" : "Phương án 3 (Chấp thuận yêu cầu xưởng)"}`);
  };

  const handleConfirmVerdict = () => {
    const generatedHash = `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`;
    setMultiSigTxHash(generatedHash);
    setIsVerdictExecuted(true);
    setIsSignModalOpen(false);
    setDisputeStatus("RESOLVED");
    showToast(`Phán quyết đã được ký đa chữ ký 2/3 & giải phóng Smart Escrow thành công! Tx: ${generatedHash.slice(0, 14)}...`);
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
            <Link
              to="/admin/dashboard"
              className="text-[#4c463c] hover:text-[#1c1b19] transition-colors whitespace-nowrap"
            >
              Bảng Điều Khiển
            </Link>
            <Link
              to="/admin/users"
              className="text-[#4c463c] hover:text-[#1c1b19] transition-colors whitespace-nowrap"
            >
              Người Dùng
            </Link>
            <Link
              to="/admin/kyc"
              className="text-[#4c463c] hover:text-[#1c1b19] transition-colors whitespace-nowrap"
            >
              Duyệt KYC
            </Link>
            <Link
              to="/admin/rent/listings"
              className="text-[#4c463c] hover:text-[#1c1b19] transition-colors whitespace-nowrap"
            >
              Duyệt RENT
            </Link>
            <Link
              to="/admin/thrift/listings"
              className="text-[#4c463c] hover:text-[#1c1b19] transition-colors whitespace-nowrap"
            >
              Duyệt THRIFT
            </Link>
            <Link
              to="/admin/categories"
              className="text-[#4c463c] hover:text-[#1c1b19] transition-colors whitespace-nowrap"
            >
              Danh Mục Sàn
            </Link>
            <Link
              to="/admin/disputes"
              className="text-[#6c5937] font-semibold whitespace-nowrap border-b-2 border-[#6c5937] pb-0.5"
            >
              Tranh Chấp
            </Link>
            <Link
              to="/admin/finance"
              className="text-[#4c463c] hover:text-[#1c1b19] transition-colors whitespace-nowrap"
            >
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
            <span className="text-[#1c1b19] font-semibold">Chi Tiết Tranh Chấp {disputeCode}</span>
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

      {/* Header Dossier Banner */}
      <section className="w-full bg-[#fdf8f5] py-6 px-4 md:px-12 border-b border-[#cfc5b8]/20">
        <div className="max-w-7xl mx-auto flex flex-col gap-6">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
            <div className="flex flex-col gap-2 max-w-3xl">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl sm:text-4xl font-serif text-[#1c1b19] font-medium tracking-tight">
                  Dispute {disputeCode}
                </h1>
                {disputeStatus === "UNDER_REVIEW" && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#ffdcc1] text-[#2e1500] rounded text-xs uppercase font-semibold">
                    <span className="w-2 h-2 rounded-full bg-[#7f5227] animate-pulse"></span>
                    UNDER REVIEW • Đang Thẩm Định
                  </span>
                )}
                {disputeStatus === "RESOLVED" && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#caebc9] text-[#05210c] rounded text-xs uppercase font-semibold">
                    <span className="w-2 h-2 rounded-full bg-[#48654b]"></span>
                    RESOLVED • Đã Ban Hành Phán Quyết
                  </span>
                )}
                {disputeStatus === "CLOSED" && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#e6e2de] text-[#4c463c] rounded text-xs uppercase font-semibold">
                    <span className="w-2 h-2 rounded-full bg-[#7e766a]"></span>
                    CLOSED • Đã Quyết Toán &amp; Đóng Hồ Sơ
                  </span>
                )}
                <span className="bg-[#ece7e4] text-[#4c463c] px-2.5 py-1 rounded text-xs font-mono font-medium">
                  SLA: CÒN 1H 45M
                </span>
              </div>

              <p className="text-xl sm:text-2xl text-[#4c463c] font-serif italic">
                Khiếu nại khấu trừ cọc do nghi vấn trầy xước ngàm &amp; bụi cảm biến
              </p>

              <div className="flex flex-wrap items-center gap-3 text-xs text-[#4c463c] pt-1">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px] text-[#7e766a]">schedule</span>
                  Mở hồ sơ: 08:30 sáng, 24/10/2026
                </span>
                <span className="text-[#cfc5b8]">•</span>
                <span className="flex items-center gap-1 text-[#7f5227] font-semibold">
                  <span className="material-symbols-outlined text-[16px] text-[#7f5227]">alarm</span>
                  Hạn SLA Trọng Tài: 12:00 trưa hôm nay (24/10/2026)
                </span>
                <span className="text-[#cfc5b8]">•</span>
                <span className="font-mono text-[#7e766a]">MÃ PHÒNG LAB: LAB-TRIB-09</span>
              </div>
            </div>

            {/* Escrow Ledger Lock Capsule */}
            <div className="bg-[#f7f3ef] p-5 rounded-2xl flex flex-col justify-between gap-3 min-w-[290px] shadow-sm border border-[#cfc5b8]/30">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider text-[#4c463c] font-semibold flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[#48654b] text-[18px]">lock</span>
                  Smart Escrow Multi-Sig
                </span>
                <span className="w-2.5 h-2.5 rounded-full bg-[#48654b]"></span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-[#7e766a]">Ký quỹ đang phong tỏa tuyệt đối</span>
                <span className="text-2xl sm:text-3xl font-serif font-bold text-[#6c5937] leading-tight">
                  18,000,000 ₫
                </span>
              </div>
              <div className="bg-white p-2.5 rounded-lg text-xs flex items-center justify-between text-[#4c463c] border border-[#cfc5b8]/20">
                <span>Yêu cầu khấu trừ:</span>
                <span className="font-bold text-[#ba1a1a]">2,500,000 ₫</span>
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
                disputeStatus === "RESOLVED" || disputeStatus === "CLOSED"
                  ? "bg-[#6c5937]/30"
                  : "bg-[#cfc5b8]/30"
              }`}
            ></div>

            <div
              className={`flex items-center gap-2 text-xs ${
                disputeStatus === "RESOLVED"
                  ? "font-bold text-[#6c5937]"
                  : disputeStatus === "CLOSED"
                  ? "text-[#4c463c]"
                  : "text-[#7e766a]"
              }`}
            >
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center font-mono text-[11px] font-bold ${
                  disputeStatus === "RESOLVED"
                    ? "bg-[#6c5937] text-white"
                    : disputeStatus === "CLOSED"
                    ? "bg-[#caebc9] text-[#05210c]"
                    : "bg-[#e6e2de] text-[#7e766a]"
                }`}
              >
                {disputeStatus === "CLOSED" ? "✓" : "3"}
              </span>
              <span>3. RESOLVED (Ban hành phán quyết)</span>
            </div>

            <div
              className={`h-0.5 flex-1 hidden md:block ${
                disputeStatus === "CLOSED" ? "bg-[#6c5937]/30" : "bg-[#cfc5b8]/30"
              }`}
            ></div>

            <div
              className={`flex items-center gap-2 text-xs ${
                disputeStatus === "CLOSED" ? "font-bold text-[#6c5937]" : "text-[#7e766a]"
              }`}
            >
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center font-mono text-[11px] font-bold ${
                  disputeStatus === "CLOSED"
                    ? "bg-[#6c5937] text-white"
                    : "bg-[#e6e2de] text-[#7e766a]"
                }`}
              >
                4
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
                    <span className="font-mono text-[#7e766a] text-xs">ID: #USR-84192</span>
                  </div>

                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-xl font-serif font-bold text-[#1c1b19]">Lê Minh Khoa</h3>
                      <span className="text-xs text-[#4c463c]">Thành viên Collector Circle từ 2024</span>
                    </div>
                    <div className="flex items-center gap-1 bg-[#caebc9] text-[#05210c] px-2.5 py-1 rounded text-xs font-semibold">
                      <span className="material-symbols-outlined text-[16px]">verified</span>
                      Tier-2 Verified
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div className="bg-white p-3 rounded-xl border border-[#cfc5b8]/20">
                      <span className="text-xs text-[#7e766a] block">Điểm Tín Nhiệm</span>
                      <span className="text-lg font-serif font-bold text-[#48654b]">98.5%</span>
                      <span className="text-[11px] text-[#4c463c] block mt-0.5">14 đơn sạch, 0 vi phạm</span>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-[#cfc5b8]/20">
                      <span className="text-xs text-[#7e766a] block">Liên Hệ Ẩn Danh</span>
                      <span className="text-xs font-mono text-[#1c1b19] block mt-1 truncate">
                        k***a@gmail.com
                      </span>
                      <span className="text-[11px] font-mono text-[#7e766a]">+84 912 *** 892</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-[#cfc5b8]/20">
                  <span className="text-xs text-[#48654b] font-medium flex items-center gap-1">
                    <span className="material-symbols-outlined text-[15px]">fingerprint</span>
                    Xác thực sinh trắc học hoàn tất
                  </span>
                  <Link
                    to="/admin/users/84192"
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
                    <span className="font-mono text-[#7e766a] text-xs">SHOP: #SHP-0418</span>
                  </div>

                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-xl font-serif font-bold text-[#1c1b19]">
                        Kyoto Archival Optics
                      </h3>
                      <span className="text-xs text-[#4c463c]">
                        Đại diện pháp lý: Vũ Thanh Tùng (#USR-38194)
                      </span>
                    </div>
                    <div className="flex items-center gap-1 bg-white text-[#6c5937] px-2.5 py-1 rounded text-xs font-semibold border border-[#cfc5b8]/30">
                      <span className="material-symbols-outlined text-[16px] text-[#7f5227]">stars</span>
                      Tier-3 Certified Partner
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div className="bg-white p-3 rounded-xl border border-[#cfc5b8]/20">
                      <span className="text-xs text-[#7e766a] block">Đánh Giá Xưởng</span>
                      <span className="text-lg font-serif font-bold text-[#6c5937]">4.98 ★</span>
                      <span className="text-[11px] text-[#4c463c] block mt-0.5">
                        184 lượt thuê, tranh chấp 0.2%
                      </span>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-[#cfc5b8]/20">
                      <span className="text-xs text-[#7e766a] block">Trạm Kiểm Định Kho</span>
                      <span className="text-xs text-[#1c1b19] font-medium block mt-1">
                        Trạm Hoàn Kiếm, HN
                      </span>
                      <span className="text-[11px] text-[#7e766a]">Lab chuẩn quang học Cấp 1</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-[#cfc5b8]/20">
                  <span className="text-xs text-[#48654b] font-medium flex items-center gap-1">
                    <span className="material-symbols-outlined text-[15px]">security</span>
                    Bảo chứng hạn mức tín chấp sàn
                  </span>
                  <Link
                    to="/admin/users/38194"
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
                MÃ GIAO DỊCH: #RO-8821
              </span>
            </div>

            <div className="bg-[#f7f3ef] p-6 rounded-2xl flex flex-col gap-5 shadow-sm border border-[#cfc5b8]/30">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                {/* Product Info Thumbnail */}
                <div className="lg:col-span-5 flex items-center gap-4">
                  <div
                    onClick={() =>
                      setSelectedPhotoZoom({
                        url: "https://lh3.googleusercontent.com/aida-public/AB6AXuBkLWkJg9_X9I_2mNwhqiMyxwu8IbyUBPPvOXPK5-xnXFvJcV_9e3fI-mB9oWuQfyydo1fM0N6EyWNRuPr7hcp2CjHlPzKlDTpgtg1U1pwpswOy9GmQPuwlAUm4K3bNaoIaSgfWszvyfOeL9KrfgseC1KA4c9WBhDyQt_cNfXIaUHWkX7rD5vnFEFrIR6HKvdRHdr14GNpRSv1NsEYYuLOpIUO_8azjiEWtPJfCqzvA",
                        title: "Leica M6 Classic 0.72x Black Chrome Kit",
                        desc: "Hiện vật đối soát trong hợp đồng thuê RENT #RO-8821",
                      })
                    }
                    className="w-28 h-28 bg-white rounded-xl overflow-hidden flex-shrink-0 cursor-pointer shadow-sm border border-[#cfc5b8]/40 hover:opacity-95 transition-opacity"
                  >
                    <img
                      className="w-full h-full object-cover"
                      alt="Leica M6 Classic with Summicron 35mm"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuBkLWkJg9_X9I_2mNwhqiMyxwu8IbyUBPPvOXPK5-xnXFvJcV_9e3fI-mB9oWuQfyydo1fM0N6EyWNRuPr7hcp2CjHlPzKlDTpgtg1U1pwpswOy9GmQPuwlAUm4K3bNaoIaSgfWszvyfOeL9KrfgseC1KA4c9WBhDyQt_cNfXIaUHWkX7rD5vnFEFrIR6HKvdRHdr14GNpRSv1NsEYYuLOpIUO_8azjiEWtPJfCqzvA"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] uppercase tracking-wider text-[#48654b] font-bold">
                      ĐƠN HÀNG CHO THUÊ (RENT ORDER)
                    </span>
                    <h4 className="text-base font-serif font-bold text-[#1c1b19]">
                      Leica M6 Classic 0.72x Black Chrome Kit
                    </h4>
                    <p className="text-xs text-[#4c463c]">
                      Đi kèm Summicron 35mm f/2 Pre-ASPH V4 • SKU #HB-RNT-9021
                    </p>
                    <div className="flex items-center gap-2 text-xs text-[#7e766a] mt-0.5">
                      <span className="material-symbols-outlined text-[14px]">calendar_month</span>
                      <span>Kỳ thuê: 18/10/2026 - 23/10/2026 (5 ngày)</span>
                    </div>
                  </div>
                </div>

                {/* Financial Breakdown Inset */}
                <div className="lg:col-span-5 grid grid-cols-2 gap-3 bg-white p-4 rounded-xl border border-[#cfc5b8]/30">
                  <div className="flex flex-col">
                    <span className="text-[11px] text-[#7e766a]">Tiền thuê 5 ngày (Đã thanh toán)</span>
                    <span className="text-base font-serif font-bold text-[#1c1b19]">4,250,000 ₫</span>
                    <span className="text-[11px] text-[#4c463c]">850,000 ₫ / ngày qua VNPay</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[11px] text-[#7e766a]">Smart Escrow Khóa An Toàn</span>
                    <span className="text-base font-serif font-bold text-[#6c5937]">18,000,000 ₫</span>
                    <span className="text-[11px] text-[#ba1a1a] font-medium">Bị đóng băng do tranh chấp</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[11px] text-[#7e766a]">Khoản Chủ Xưởng đòi trừ</span>
                    <span className="text-base font-serif font-bold text-[#ba1a1a]">2,500,000 ₫</span>
                    <span className="text-[11px] text-[#4c463c]">Phí hiệu chuẩn phòng sạch</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[11px] text-[#7e766a]">Yêu cầu Khách Hàng</span>
                    <span className="text-base font-serif font-bold text-[#48654b]">18,000,000 ₫ (100%)</span>
                    <span className="text-[11px] text-[#4c463c]">Bảo lưu toàn vẹn tiền cọc</span>
                  </div>
                </div>

                {/* Order Action CTA */}
                <div className="lg:col-span-2 flex flex-col justify-center items-stretch gap-2">
                  <Link
                    to="/rent/orders/RO-8821"
                    className="bg-[#ece7e4] hover:bg-[#e6e2de] text-[#1c1b19] text-xs font-bold py-2.5 px-4 rounded-lg text-center transition-colors shadow-sm"
                  >
                    View RENT Order
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
                RENT return / damage
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
                      Lời Khai Của Chủ Xưởng (Kyoto Archival Optics)
                    </span>
                    <span className="font-mono text-[#7e766a] text-xs">23/10 • 18:00</span>
                  </div>
                  <p className="text-sm sm:text-base text-[#1c1b19] font-serif italic leading-relaxed">
                    “Chủ xưởng khi nhận hiện vật tại trạm kiểm định ngày 23/10 báo cáo phát hiện 1 vệt xước mờ gần ngàm thấu kính và bụi mịn buồng trập f/16, đề xuất khấu trừ 2,500,000 ₫ phí hiệu chuẩn phòng sạch.”
                  </p>
                  <div className="bg-white p-2.5 rounded-lg text-xs text-[#4c463c] flex items-center justify-between border border-[#cfc5b8]/20">
                    <span>Yêu cầu bồi hoàn: 2,500,000 ₫ (Khấu trừ cọc trực tiếp)</span>
                    <span className="font-mono text-[#7e766a]">MÃ BIÊN BẢN: RT-KHO-092</span>
                  </div>
                </div>

                {/* Customer Counter Statement Card */}
                <div className="bg-[#f7f3ef] p-5 rounded-2xl flex flex-col gap-2 shadow-sm border border-[#cfc5b8]/30">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase font-bold text-[#48654b] flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px]">gavel</span>
                      Phản Biện Của Khách Hàng (Lê Minh Khoa)
                    </span>
                    <span className="font-mono text-[#7e766a] text-xs">24/10 • 08:30</span>
                  </div>
                  <p className="text-sm sm:text-base text-[#1c1b19] font-serif italic leading-relaxed">
                    “Khách hàng khẳng định thiết bị được sử dụng nghiêm ngặt theo quy định xưởng, luôn đóng nắp body cap khi đổi lens, vệt mòn nhẹ đã có sẵn từ biên bản xuất kho đợt giao ngày 18/10.”
                  </p>
                  <div className="bg-white p-2.5 rounded-lg text-xs text-[#4c463c] flex items-center justify-between border border-[#cfc5b8]/20">
                    <span>Yêu cầu trọng tài: Trả 100% cọc (Không đồng ý khấu trừ 2,500,000 ₫)</span>
                    <span className="text-[#48654b] font-semibold">Tín nhiệm người dùng 98.5%</span>
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

                    <div className="relative flex flex-col gap-0.5">
                      <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-[#48654b]"></div>
                      <span className="text-[11px] font-mono text-[#7e766a]">18/10 09:15</span>
                      <span className="text-xs text-[#1c1b19] font-bold">Xuất kho niêm phong</span>
                      <span className="text-[11px] text-[#4c463c]">Trạm kiểm định đóng seal RH-902</span>
                    </div>

                    <div className="relative flex flex-col gap-0.5">
                      <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-[#7e766a]"></div>
                      <span className="text-[11px] font-mono text-[#7e766a]">23/10 16:30</span>
                      <span className="text-xs text-[#1c1b19] font-bold">Hoàn trả hiện vật</span>
                      <span className="text-[11px] text-[#4c463c]">Kho Kyoto Archival Hub tiếp nhận</span>
                    </div>

                    <div className="relative flex flex-col gap-0.5">
                      <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-[#7f5227]"></div>
                      <span className="text-[11px] font-mono text-[#7e766a]">23/10 18:00</span>
                      <span className="text-xs text-[#7f5227] font-bold">Lập biên bản tổn hại</span>
                      <span className="text-[11px] text-[#4c463c]">Chủ xưởng đề xuất trừ 2,500,000 ₫</span>
                    </div>

                    <div className="relative flex flex-col gap-0.5">
                      <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-[#6c5937] animate-ping"></div>
                      <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-[#6c5937]"></div>
                      <span className="text-[11px] font-mono text-[#6c5937] font-bold">
                        24/10 08:30 (HÔM NAY)
                      </span>
                      <span className="text-xs text-[#1c1b19] font-bold">Khách từ chối trừ cọc</span>
                      <span className="text-[11px] text-[#4c463c]">Hồ sơ kích hoạt Trọng tài ReUse Hub</span>
                    </div>
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
              {/* Evidence 1: Dispatch Inspection */}
              <div className="bg-[#f7f3ef] rounded-2xl overflow-hidden flex flex-col shadow-sm border border-[#cfc5b8]/30">
                <div
                  onClick={() =>
                    setSelectedPhotoZoom({
                      url: "https://lh3.googleusercontent.com/aida-public/AB6AXuD2sifz1Ug5bK-vtkJSS7xJvAwMy3PI87AB_HMeHch22gwFCcAJ49pqKbF4SazuEInAyA9cRVWwZ7E1Lb8JKoK6wGU30JKV_vR39RyoVchnzgXHIn6dgregVxUlT_cpxJUeBgEOSvbXvN6E9L_InIJsHCoFuvdrKcHAnJFjUtMvncmJ9wlovidGzlpL6lq2eAaVoKtbSr1tGSEd130sjAlbPn97LOmjktrL4x1ThBaB",
                      title: "Evidence #01: Dispatch Inspection (Xuất Kho 18/10)",
                      desc: "Tem niêm phong #RH-902 còn nguyên vẹn. Ảnh macro 1:1 ghi nhận vệt hao mòn đồng tự nhiên cấp A đã hiện hữu tại rãnh ngàm từ trước khi bàn giao.",
                    })
                  }
                  className="h-56 bg-white relative cursor-pointer group"
                >
                  <img
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    alt="Macro bayonet mount inspection"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuD2sifz1Ug5bK-vtkJSS7xJvAwMy3PI87AB_HMeHch22gwFCcAJ49pqKbF4SazuEInAyA9cRVWwZ7E1Lb8JKoK6wGU30JKV_vR39RyoVchnzgXHIn6dgregVxUlT_cpxJUeBgEOSvbXvN6E9L_InIJsHCoFuvdrKcHAnJFjUtMvncmJ9wlovidGzlpL6lq2eAaVoKtbSr1tGSEd130sjAlbPn97LOmjktrL4x1ThBaB"
                  />
                  <span className="absolute top-3 left-3 bg-[#1c1b19]/85 text-white text-xs px-2.5 py-1 rounded backdrop-blur">
                    18/10 • XUẤT KHO
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
                      Evidence #01: Dispatch Inspection
                    </span>
                    <h4 className="text-base font-serif font-bold text-[#1c1b19] mt-0.5">
                      Ảnh Đối Soát Xuất Kho
                    </h4>
                    <p className="text-xs text-[#4c463c] mt-1 leading-relaxed">
                      Tem niêm phong #RH-902 còn nguyên vẹn. Ảnh macro 1:1 ghi nhận vệt hao mòn đồng tự nhiên cấp A đã hiện hữu tại rãnh ngàm từ trước khi bàn giao.
                    </p>
                  </div>
                  <div className="pt-2 flex items-center justify-between text-xs font-mono text-[#7e766a] bg-white p-2.5 rounded-lg border border-[#cfc5b8]/20">
                    <span>HASH: SHA-256 A7B9...</span>
                    <span className="text-[#48654b] font-bold">HỢP LỆ</span>
                  </div>
                </div>
              </div>

              {/* Evidence 2: Return Inspection */}
              <div className="bg-[#f7f3ef] rounded-2xl overflow-hidden flex flex-col shadow-sm border border-[#cfc5b8]/30">
                <div
                  onClick={() =>
                    setSelectedPhotoZoom({
                      url: "https://lh3.googleusercontent.com/aida-public/AB6AXuDMrwTN3YPSGtvqN_K62DZDfTtZsviPBdC0r3jM7JZskn-ErlqlTI8eV0s6bEheD0ufF5cj1dhF1s9N33S0Bz8rSSTfNp_3fkk7lw_EpYSA2B5kjJxBBv1BeZIMeRBam1jB3xyiRRRvjNSaD7fYH92oKk85TZ0P7aZ2Ty--KFczX1LSfCJXcRJXYKT75E8L4_Br71bQFESSXFtWyJdhN5KkiG3yc9ff-Jjo-3PQNFYp",
                      title: "Evidence #02: Return Inspection (Thu Hồi 23/10)",
                      desc: "Chủ xưởng ghi nhận điểm xước viền mỏng và hạt bụi mịn tại mép trập f/16. Đề nghị vệ sinh buồng tối và định cỡ buồng máy chuẩn xưởng.",
                    })
                  }
                  className="h-56 bg-white relative cursor-pointer group"
                >
                  <img
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    alt="Return inspection shot"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuDMrwTN3YPSGtvqN_K62DZDfTtZsviPBdC0r3jM7JZskn-ErlqlTI8eV0s6bEheD0ufF5cj1dhF1s9N33S0Bz8rSSTfNp_3fkk7lw_EpYSA2B5kjJxBBv1BeZIMeRBam1jB3xyiRRRvjNSaD7fYH92oKk85TZ0P7aZ2Ty--KFczX1LSfCJXcRJXYKT75E8L4_Br71bQFESSXFtWyJdhN5KkiG3yc9ff-Jjo-3PQNFYp"
                  />
                  <span className="absolute top-3 left-3 bg-[#ba1a1a] text-white text-xs px-2.5 py-1 rounded font-semibold shadow">
                    23/10 • THU HỒI
                  </span>
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <span className="bg-white/90 text-[#1c1b19] px-3 py-1 rounded text-xs font-semibold flex items-center gap-1 shadow">
                      <span className="material-symbols-outlined text-[16px]">zoom_in</span> Phóng to ảnh
                    </span>
                  </div>
                </div>

                <div className="p-5 flex flex-col gap-2 flex-1 justify-between">
                  <div>
                    <span className="text-[11px] uppercase font-bold text-[#7f5227]">
                      Evidence #02: Return Inspection
                    </span>
                    <h4 className="text-base font-serif font-bold text-[#1c1b19] mt-0.5">
                      Ảnh Đối Soát Thu Hồi
                    </h4>
                    <p className="text-xs text-[#4c463c] mt-1 leading-relaxed">
                      Chủ xưởng ghi nhận điểm xước viền mỏng và hạt bụi mịn tại mép trập f/16. Đề nghị vệ sinh buồng tối và định cỡ buồng máy chuẩn xưởng.
                    </p>
                  </div>
                  <div className="pt-2 flex items-center justify-between text-xs font-mono text-[#7e766a] bg-white p-2.5 rounded-lg border border-[#cfc5b8]/20">
                    <span>HASH: SHA-256 F4E1...</span>
                    <span className="text-[#7f5227] font-bold">KHIẾU NẠI</span>
                  </div>
                </div>
              </div>

              {/* Evidence 3: Independent Bench Audit */}
              <div className="bg-[#f7f3ef] rounded-2xl overflow-hidden flex flex-col shadow-sm border border-[#cfc5b8]/30">
                <div className="h-56 bg-white relative flex items-center justify-center p-4">
                  {/* Rich Inline Audit Radial Gauge */}
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
                          strokeDasharray="88, 100"
                          strokeLinecap="round"
                          strokeWidth="3.5"
                        ></path>
                      </svg>
                      <div className="absolute flex flex-col items-center">
                        <span className="text-xl font-serif font-bold text-[#1c1b19]">88%</span>
                        <span className="text-[10px] text-[#7e766a]">Độ Nguyên Bản</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-[#4c463c]">
                      <span>Phân loại tổn hại:</span>
                      <span className="font-bold text-[#48654b]">FAIR WEAR &amp; TEAR</span>
                    </div>
                  </div>
                </div>

                <div className="p-5 flex flex-col gap-2 flex-1 justify-between">
                  <div>
                    <span className="text-[11px] uppercase font-bold text-[#6c5937]">
                      Evidence #03: Neutral Tech Bench
                    </span>
                    <h4 className="text-base font-serif font-bold text-[#1c1b19] mt-0.5">
                      Báo Cáo Phòng Kỹ Thuật ReUse Hub
                    </h4>
                    <p className="text-xs text-[#4c463c] mt-1 leading-relaxed">
                      Giám định viên độc lập xác nhận: Vết trầy thuộc hao mòn cơ khí tự nhiên (Điều 4.2 Quy chế). Hạt bụi là bụi môi trường dễ dàng làm sạch bằng bóng hơi chuyên dụng, không gây tổn hại quang học.
                    </p>
                  </div>
                  <div className="pt-2 flex items-center justify-between text-xs font-mono text-[#7e766a] bg-white p-2.5 rounded-lg border border-[#cfc5b8]/20">
                    <span>AUDITOR: TECH-LAB-04</span>
                    <span className="text-[#48654b] font-bold">KHÔNG VI PHẠM</span>
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
              {/* Chat Snippet Stream */}
              <div className="flex flex-col gap-3">
                {/* Message 1: Shop */}
                <div className="flex items-start gap-3 max-w-2xl">
                  <div className="w-8 h-8 rounded-full bg-[#ece7e4] flex items-center justify-center font-mono font-bold text-[11px] text-[#7f5227] flex-shrink-0 border border-[#cfc5b8]/40">
                    SHP
                  </div>
                  <div className="bg-white p-3.5 rounded-2xl flex flex-col gap-1 shadow-sm border border-[#cfc5b8]/20">
                    <div className="flex items-center justify-between gap-4 text-xs">
                      <span className="font-bold text-[#7f5227]">Kyoto Archival Optics</span>
                      <span className="text-[#7e766a] font-mono text-[11px]">23/10 18:05</span>
                    </div>
                    <p className="text-xs sm:text-sm text-[#1c1b19] leading-relaxed">
                      Chào bạn Khoa, bên mình nhận lại máy kiểm tra thì thấy có hạt bụi buồng trập và vệt xước mới sát chân ngàm. Shop xin phép yêu cầu giữ 2,500,000 ₫ từ cọc để đưa máy vào phòng sạch xử lý.
                    </p>
                  </div>
                </div>

                {/* Message 2: Customer */}
                <div className="flex items-start gap-3 max-w-2xl ml-auto flex-row-reverse">
                  <div className="w-8 h-8 rounded-full bg-[#48654b] text-white flex items-center justify-center font-mono font-bold text-[11px] flex-shrink-0 shadow-sm">
                    CUS
                  </div>
                  <div className="bg-[#ece7e4] p-3.5 rounded-2xl flex flex-col gap-1 shadow-sm border border-[#cfc5b8]/30">
                    <div className="flex items-center justify-between gap-4 text-xs">
                      <span className="font-bold text-[#1c1b19]">Lê Minh Khoa</span>
                      <span className="text-[#7e766a] font-mono text-[11px]">23/10 18:42</span>
                    </div>
                    <p className="text-xs sm:text-sm text-[#1c1b19] leading-relaxed">
                      Chào Shop, mình dùng rất kỹ và chỉ chụp trong nhà, hoàn toàn không tháo lens ngoài trời. Vệt mờ ở chân ngàm đã có trong ảnh lúc nhận máy tại quầy giao ngày 18/10. Mình không đồng ý trừ 2.5 triệu ạ.
                    </p>
                  </div>
                </div>

                {/* Message 3: Customer to Admin */}
                <div className="flex items-start gap-3 max-w-2xl ml-auto flex-row-reverse">
                  <div className="w-8 h-8 rounded-full bg-[#48654b] text-white flex items-center justify-center font-mono font-bold text-[11px] flex-shrink-0 shadow-sm">
                    CUS
                  </div>
                  <div className="bg-[#ece7e4] p-3.5 rounded-2xl flex flex-col gap-1 shadow-sm border border-[#cfc5b8]/30">
                    <div className="flex items-center justify-between gap-4 text-xs">
                      <span className="font-bold text-[#1c1b19]">Lê Minh Khoa</span>
                      <span className="text-[#7e766a] font-mono text-[11px]">24/10 08:30</span>
                    </div>
                    <p className="text-xs sm:text-sm text-[#1c1b19] leading-relaxed">
                      Mình đã bấm nút chuyển tranh chấp để Admin ReUse Hub vào đối chiếu biên bản kiểm định xuất kho giúp mình.
                    </p>
                  </div>
                </div>
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
                      <span
                        className={`text-xs font-semibold ${
                          disputeStatus === "UNDER_REVIEW" ? "text-[#6c5937]" : "text-[#1c1b19]"
                        }`}
                      >
                        UNDER REVIEW
                      </span>
                      <span className="text-[11px] text-[#7e766a]">Tiếp tục đối soát phòng lab</span>
                    </div>
                  </label>

                  <label
                    onClick={() => setDisputeStatus("RESOLVED")}
                    className={`p-3.5 rounded-lg flex items-center gap-3 cursor-pointer transition-all border ${
                      disputeStatus === "RESOLVED"
                        ? "bg-[#f9dfb3]/20 border-[#6c5937] ring-1 ring-[#6c5937]"
                        : "bg-white border-[#cfc5b8]/30 hover:bg-[#f2ede9]"
                    }`}
                  >
                    <input
                      className="w-4 h-4 text-[#6c5937] focus:ring-0 accent-[#6c5937]"
                      name="dispute_status"
                      type="radio"
                      checked={disputeStatus === "RESOLVED"}
                      onChange={() => setDisputeStatus("RESOLVED")}
                    />
                    <div className="flex flex-col">
                      <span
                        className={`text-xs font-semibold ${
                          disputeStatus === "RESOLVED" ? "text-[#6c5937]" : "text-[#1c1b19]"
                        }`}
                      >
                        RESOLVED (Khuyến Nghị)
                      </span>
                      <span className="text-[11px] text-[#4c463c]">Ban hành phán quyết chính thức</span>
                    </div>
                  </label>

                  <label
                    onClick={() => setDisputeStatus("CLOSED")}
                    className={`p-3.5 rounded-lg flex items-center gap-3 cursor-pointer transition-all border ${
                      disputeStatus === "CLOSED"
                        ? "bg-[#f9dfb3]/20 border-[#6c5937] ring-1 ring-[#6c5937]"
                        : "bg-white border-[#cfc5b8]/30 hover:bg-[#f2ede9]"
                    }`}
                  >
                    <input
                      className="w-4 h-4 text-[#6c5937] focus:ring-0 accent-[#6c5937]"
                      name="dispute_status"
                      type="radio"
                      checked={disputeStatus === "CLOSED"}
                      onChange={() => setDisputeStatus("CLOSED")}
                    />
                    <div className="flex flex-col">
                      <span
                        className={`text-xs font-semibold ${
                          disputeStatus === "CLOSED" ? "text-[#6c5937]" : "text-[#1c1b19]"
                        }`}
                      >
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
                          Phương án 1 (Khuyến nghị chuẩn B-Corp): Hoàn trả 100% cọc cho Khách Hàng (18,000,000 ₫)
                        </span>
                        <span className="bg-[#caebc9] text-[#05210c] px-2 py-0.5 rounded text-[11px] font-semibold">
                          TỐI ƯU
                        </span>
                      </div>
                      <p className="text-xs text-[#4c463c] leading-relaxed">
                        Tổn hại được xác định thuộc nhóm hao mòn tự nhiên (Fair Wear &amp; Tear - Điều 4.2). Khách hàng không có lỗi. Kyoto Archival Optics nhận trợ giá 1 lần vệ sinh buồng tối miễn phí từ Quỹ Bảo Dưỡng Tuần Hoàn của Sàn.
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
                        Phương án 2: Hòa giải khấu trừ một phần (500,000 ₫ phí vệ sinh, hoàn cọc 17,500,000 ₫)
                      </span>
                      <p className="text-xs text-[#4c463c] leading-relaxed">
                        Chia sẻ rủi ro vận hành: Khấu trừ 500,000 ₫ chi phí thổi bụi buồng tối cơ bản cho xưởng, giải tỏa ngay 17,500,000 ₫ về tài khoản khách hàng.
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
                        Phương án 3: Chấp thuận toàn bộ yêu cầu Chủ Xưởng (Khấu trừ 2,500,000 ₫, hoàn cọc 15,500,000 ₫)
                      </span>
                      <p className="text-xs text-[#4c463c] leading-relaxed">
                        Chỉ áp dụng khi phát hiện bằng chứng khách hàng tự ý can thiệp buồng kính quang học trái quy định cam kết.
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

              {/* Execution Status Stamp if already executed */}
              {isVerdictExecuted && multiSigTxHash && (
                <div className="p-4 bg-[#caebc9]/40 rounded-xl border border-[#48654b]/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-[24px] text-[#48654b]">
                      task_alt
                    </span>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-[#05210c]">
                        Phán Quyết Đã Có Hiệu Lực Thi Hành Toàn Diện
                      </span>
                      <span className="text-[11px] font-mono text-[#4c463c]">
                        MULTI-SIG TX: {multiSigTxHash}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs bg-[#48654b] text-white px-3 py-1 rounded font-semibold font-mono">
                    SIGNATURE: 2/3 CONFIRMED
                  </span>
                </div>
              )}

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

      {/* MODAL 1: MULTI-SIG CONFIRMATION MODAL */}
      {isSignModalOpen && (
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
                  <span className="font-mono font-bold text-[#1c1b19]">{disputeCode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#7e766a]">Phương Án Thực Thi:</span>
                  <span className="font-bold text-[#6c5937]">
                    {arbitrationPreset === "opt_1"
                      ? "Hoàn trả 100% (18,000,000 ₫ cho Khách Hàng)"
                      : arbitrationPreset === "opt_2"
                      ? "Khấu trừ 500,000 ₫ • Hoàn 17,500,000 ₫"
                      : "Khấu trừ 2,500,000 ₫ • Hoàn 15,500,000 ₫"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#7e766a]">Giao Thức Ký Số:</span>
                  <span className="font-mono text-[#48654b] font-semibold">FIDO2 / SHA-256 Multi-Sig</span>
                </div>
              </div>

              <p className="leading-relaxed text-justify">
                Sau khi xác nhận, lệnh giải phóng ký quỹ sẽ được ghi nhận vĩnh viễn trên sổ cái Smart Escrow Tribunal và thông báo đến ngân hàng thanh khoản VNPay Segregated Account. Hành động này không thể hoàn tác thủ công.
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
      {isChatModalOpen && (
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
              <div className="flex items-start gap-3 max-w-lg">
                <div className="w-8 h-8 rounded-full bg-[#ece7e4] flex items-center justify-center font-mono font-bold text-[11px] text-[#7f5227] flex-shrink-0">
                  SHP
                </div>
                <div className="bg-white p-3 rounded-xl border border-[#cfc5b8]/20 shadow-sm text-xs">
                  <div className="flex justify-between gap-3 font-semibold text-[#7f5227] mb-1">
                    <span>Kyoto Archival Optics</span>
                    <span className="text-[#7e766a] font-mono text-[10px]">23/10 18:05</span>
                  </div>
                  <p>Chào bạn Khoa, bên mình nhận lại máy kiểm tra thì thấy có hạt bụi buồng trập và vệt xước mới sát chân ngàm. Shop xin phép yêu cầu giữ 2,500,000 ₫ từ cọc để đưa máy vào phòng sạch xử lý.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 max-w-lg ml-auto flex-row-reverse">
                <div className="w-8 h-8 rounded-full bg-[#48654b] text-white flex items-center justify-center font-mono font-bold text-[11px] flex-shrink-0">
                  CUS
                </div>
                <div className="bg-[#ece7e4] p-3 rounded-xl border border-[#cfc5b8]/30 shadow-sm text-xs">
                  <div className="flex justify-between gap-3 font-semibold text-[#1c1b19] mb-1">
                    <span>Lê Minh Khoa</span>
                    <span className="text-[#7e766a] font-mono text-[10px]">23/10 18:42</span>
                  </div>
                  <p>Chào Shop, mình dùng rất kỹ và chỉ chụp trong nhà, hoàn toàn không tháo lens ngoài trời. Vệt mờ ở chân ngàm đã có trong ảnh lúc nhận máy tại quầy giao ngày 18/10. Mình không đồng ý trừ 2.5 triệu ạ.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 max-w-lg">
                <div className="w-8 h-8 rounded-full bg-[#ece7e4] flex items-center justify-center font-mono font-bold text-[11px] text-[#7f5227] flex-shrink-0">
                  SHP
                </div>
                <div className="bg-white p-3 rounded-xl border border-[#cfc5b8]/20 shadow-sm text-xs">
                  <div className="flex justify-between gap-3 font-semibold text-[#7f5227] mb-1">
                    <span>Kyoto Archival Optics</span>
                    <span className="text-[#7e766a] font-mono text-[10px]">23/10 19:10</span>
                  </div>
                  <p>Thưa bạn, ảnh bàn giao ở góc nghiêng 45 độ chưa thể hiện rõ vị trí này, kỹ thuật viên bên mình chụp macro phòng lab mới thấy rõ.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 max-w-lg ml-auto flex-row-reverse">
                <div className="w-8 h-8 rounded-full bg-[#48654b] text-white flex items-center justify-center font-mono font-bold text-[11px] flex-shrink-0">
                  CUS
                </div>
                <div className="bg-[#ece7e4] p-3 rounded-xl border border-[#cfc5b8]/30 shadow-sm text-xs">
                  <div className="flex justify-between gap-3 font-semibold text-[#1c1b19] mb-1">
                    <span>Lê Minh Khoa</span>
                    <span className="text-[#7e766a] font-mono text-[10px]">24/10 08:30</span>
                  </div>
                  <p>Mình đã bấm nút chuyển tranh chấp để Admin ReUse Hub vào đối chiếu biên bản kiểm định xuất kho giúp mình.</p>
                </div>
              </div>
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
      {isEscalateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#fdf8f5] w-full max-w-md rounded-2xl p-6 shadow-2xl border border-[#cfc5b8]/40 flex flex-col gap-4">
            <div className="flex items-center gap-2 pb-2 border-b border-[#cfc5b8]/30 text-[#ba1a1a]">
              <span className="material-symbols-outlined text-[24px]">warning</span>
              <h3 className="font-serif font-bold text-lg text-[#1c1b19]">
                Chuyển Lên Ban Pháp Lý Cấp Cao
              </h3>
            </div>
            <p className="text-xs text-[#4c463c] leading-relaxed">
              Bạn đang yêu cầu chuyển vụ tranh chấp <strong>{disputeCode}</strong> lên Ban Thư Ký Trọng Tài &amp; Hội Đồng Cố Vấn Pháp Lý. Hồ sơ sẽ được đóng băng thêm 24 giờ để thành lập ban hội thẩm 3 thành viên.
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