import React, { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { fetchAdminUsers } from "../../services/admin.api";

export type KycReviewStatus = "pending" | "approved" | "rejected";

interface KycDocumentDetails {
  title: string;
  subtitle: string;
  tag: string;
  hash: string;
  actionText: string;
  imgUrl: string;
  footerLeft: string;
  footerRight: string;
}

interface KycApplicantDetail {
  id: string;
  code: string;
  fullName: string;
  dob: string;
  age: string;
  idType: string;
  idNumber: string;
  validityRange: string;
  validityNote: string;
  address: string;
  email: string;
  role: "SHOP_OWNER" | "CUSTOMER";
  roleName: string;
  workshopName: string;
  registrationDate: string;
  submissionTime: string;
  avatarUrl: string;
  disputeHistory: string;
  livenessRate: string;
  faceMatchRate: string;
  antiSpoofing: string;
  lightingIntensity: string;
  frontDoc: KycDocumentDetails;
  backDoc: KycDocumentDetails;
  livenessDoc: KycDocumentDetails;
}

const DEFAULT_APPLICANT: KycApplicantDetail = {
  id: "kyc-1",
  code: "#KYC-9482-VN",
  fullName: "Vũ Thanh Tùng",
  dob: "14/10/1988",
  age: "36 tuổi · Đủ điều kiện dân sự B-Corp",
  idType: "CCCD Gắn Chip (Chip-enabled)",
  idNumber: "034098004128",
  validityRange: "12/05/2021 — 14/10/2048",
  validityNote: "Còn hiệu lực pháp lý (23 năm tới)",
  address: "Số 18/4 Thi Sách, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh",
  email: "tung.vu@kyoto-optics.vn",
  role: "SHOP_OWNER",
  roleName: "Shop Owner",
  workshopName: "Kyoto Archival Optics",
  registrationDate: "28/03/2025",
  submissionTime: "09:42 · 28/03/2025 (Hệ Thống Phân Phối Tự Động)",
  avatarUrl:
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80",
  disputeHistory: "0 Vụ việc (Hoàn hảo)",
  livenessRate: "99.1%",
  faceMatchRate: "98.84%",
  antiSpoofing: "Passed",
  lightingIntensity: "540 Lux (Tối ưu)",
  frontDoc: {
    title: "Mặt Trước CCCD",
    subtitle: "4.12 MB · OCR Hoàn Hảo",
    tag: "DPI 600 · SGN-ID",
    hash: "HASH: 4b9e28f...09a1",
    actionText: "Soi Vân Nổi",
    imgUrl:
      "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=1200&q=80",
    footerLeft: "Góc chụp 90° · Đủ 4 góc",
    footerRight: "DPI 600 · SGN-ID",
  },
  backDoc: {
    title: "Mặt Sau CCCD (Chip & MRZ)",
    subtitle: "3.88 MB · NFC Hợp Lệ",
    tag: "NFC-PASS",
    hash: "MRZ: IDVNM034098004<<8",
    actionText: "Kiểm Tra Chip",
    imgUrl:
      "https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=1200&q=80",
    footerLeft: "Chữ ký & Dấu vân tay rõ nét",
    footerRight: "NFC-PASS",
  },
  livenessDoc: {
    title: "Ảnh Chân Dung Sinh Trắc Học · 3D Liveness Detection",
    subtitle: "Phiên kiểm tra: #LIVE-8812",
    tag: "LIVENESS 99.1%",
    hash: "LIVENESS: PASS",
    actionText: "Mở Toàn Màn Hình",
    imgUrl:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=1200&q=80",
    footerLeft: "Xác thực trắc diện đạt chuẩn",
    footerRight: "ISO-14044 PASS",
  },
};

export const KycReview: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const [applicant, setApplicant] = useState<KycApplicantDetail>(DEFAULT_APPLICANT);
  const [currentStatus, setCurrentStatus] = useState<KycReviewStatus>("pending");
  const [loading, setLoading] = useState<boolean>(true);

  // Inspector Modal State
  const [isInspectorOpen, setIsInspectorOpen] = useState<boolean>(false);
  const [inspectorTitle, setInspectorTitle] = useState<string>("");
  const [inspectorImg, setInspectorImg] = useState<string>("");

  // Reject Modal State
  const [isRejectModalOpen, setIsRejectModalOpen] = useState<boolean>(false);
  const [rejectReason, setRejectReason] = useState<string>("");

  // Toast feedback state
  const [toast, setToast] = useState<{
    visible: boolean;
    title: string;
    desc: string;
    icon: string;
  }>({
    visible: false,
    title: "",
    desc: "",
    icon: "check_circle",
  });

  const showToast = (title: string, desc: string, icon: string = "check_circle") => {
    setToast({ visible: true, title, desc, icon });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    }, 4500);
  };

  // Fetch real users from MongoDB to match applicant if id is provided
  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      setLoading(true);
      try {
        const users = await fetchAdminUsers();
        if (!isMounted) return;

        if (id) {
          const matched = users.find(
            (u) =>
              u._id === id ||
              u.email.toLowerCase().includes(id.toLowerCase()) ||
              `#KYC-${u._id.slice(-4).toUpperCase()}` === id
          );

          if (matched) {
            const isShop = matched.role === "SHOP_OWNER";
            const addressStr = matched.address
              ? `${matched.address.detail || ""}, ${matched.address.ward || ""}, ${matched.address.district || ""}, ${matched.address.province || ""}`.replace(/^, |, $/g, "")
              : isShop
              ? "Số 18/4 Thi Sách, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh"
              : "48 Bạch Đằng, Phường Hải Châu 1, Quận Hải Châu, TP. Đà Nẵng";

            setApplicant({
              ...DEFAULT_APPLICANT,
              id: matched._id,
              code: `#KYC-${matched._id.slice(-4).toUpperCase()}-VN`,
              fullName: matched.fullName || (isShop ? "Vũ Thanh Tùng" : "Elena Rostova"),
              email: matched.email,
              role: isShop ? "SHOP_OWNER" : "CUSTOMER",
              roleName: isShop ? "Shop Owner" : "Customer",
              workshopName: isShop ? "Kyoto Archival Optics" : "Cá Nhân Mượn Đồ Lưu Ký",
              address: addressStr || "Số 18/4 Thi Sách, Quận 1, TP. Hồ Chí Minh",
              registrationDate: matched.createdAt
                ? new Date(matched.createdAt).toLocaleDateString("vi-VN")
                : "28/03/2025",
            });

            if (matched.kycStatus === "APPROVED") {
              setCurrentStatus("approved");
            } else if (matched.kycStatus === "REJECTED") {
              setCurrentStatus("rejected");
            } else {
              setCurrentStatus("pending");
            }
          }
        }
      } catch (err) {
        console.warn("Lỗi khi tải thông tin chi tiết KYC:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadData();
    return () => {
      isMounted = false;
    };
  }, [id]);

  // Actions
  const handleApprove = () => {
    setCurrentStatus("approved");
    showToast(
      `Đã Phê Duyệt Hồ Sơ ${applicant.code}`,
      `KYC Status đã chuyển sang APPROVED. Phân vai ${applicant.roleName} được bảo lưu an toàn.`,
      "verified"
    );
  };

  const handleOpenRejectModal = () => {
    setIsRejectModalOpen(true);
  };

  const handleCloseRejectModal = () => {
    setIsRejectModalOpen(false);
  };

  const handleAppendReason = (text: string) => {
    setRejectReason((prev) => (prev.trim() === "" ? text : `${prev} ${text}`));
  };

  const handleConfirmRejection = () => {
    if (!rejectReason.trim()) {
      alert("Vui lòng nhập lý do từ chối để hệ thống gửi thông báo cho ứng viên.");
      return;
    }
    setCurrentStatus("rejected");
    setIsRejectModalOpen(false);
    showToast(
      `Đã Từ Chối Hồ Sơ ${applicant.code}`,
      `Hệ thống đã gửi thông báo và lý do bổ sung đến ${applicant.fullName}.`,
      "cancel"
    );
  };

  const handleOpenInspector = (title: string, imgUrl: string) => {
    setInspectorTitle(title);
    setInspectorImg(imgUrl);
    setIsInspectorOpen(true);
  };

  const handleCloseInspector = () => {
    setIsInspectorOpen(false);
  };

  return (
    <div className="w-full bg-[#fdf8f5] text-[#1c1b19] font-sans antialiased min-h-screen pb-16 flex flex-col">
      {/* 1. Admin Horizontal Sub-Nav */}
      <div className="bg-[#f7f3ef] border-b border-[#cfc5b8]/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 flex items-center justify-between overflow-x-auto py-2.5 no-scrollbar">
          <nav className="flex items-center gap-1 shrink-0 text-xs font-medium">
            <Link
              to="/admin/dashboard"
              className="px-3 py-1.5 rounded-lg text-[#4c463c] hover:text-[#1c1b19] hover:bg-[#ece7e4] transition-colors whitespace-nowrap"
            >
              Bảng Điều Khiển
            </Link>
            <Link
              to="/admin/users"
              className="px-3 py-1.5 rounded-lg text-[#4c463c] hover:text-[#1c1b19] hover:bg-[#ece7e4] transition-colors whitespace-nowrap"
            >
              Người Dùng
            </Link>
            <Link
              to="/admin/kyc"
              className="px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors bg-[#86724d] text-[#fffbff] font-semibold shadow-xs"
            >
              Duyệt KYC
            </Link>
            <Link
              to="/admin/rent/listings"
              className="px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors text-[#4c463c] hover:text-[#1c1b19] hover:bg-[#ece7e4]"
            >
              Duyệt RENT
            </Link>
            <Link
              to="/admin/thrift/listings"
              className="px-3 py-1.5 rounded-lg text-[#4c463c] hover:text-[#1c1b19] hover:bg-[#ece7e4] transition-colors whitespace-nowrap"
            >
              Duyệt THRIFT
            </Link>
            <Link
              to="/admin/categories"
              className="px-3 py-1.5 rounded-lg text-[#4c463c] hover:text-[#1c1b19] hover:bg-[#ece7e4] transition-colors whitespace-nowrap"
            >
              Danh Mục Sàn
            </Link>
            <Link
              to="/admin/disputes"
              className="px-3 py-1.5 rounded-lg text-[#4c463c] hover:text-[#1c1b19] hover:bg-[#ece7e4] transition-colors whitespace-nowrap"
            >
              Tranh Chấp
            </Link>
            <Link
              to="/admin/finance"
              className="px-3 py-1.5 rounded-lg text-[#4c463c] hover:text-[#1c1b19] hover:bg-[#ece7e4] transition-colors whitespace-nowrap"
            >
              Tài Chính Sàn
            </Link>
          </nav>
          <div className="hidden lg:flex items-center gap-3 pl-4 text-xs text-[#48654b] font-medium shrink-0">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#48654b] animate-pulse"></span>
              SLA Trực Tuyến: 99.98%
            </span>
            <span className="text-[#cfc5b8]">|</span>
            <span className="font-mono text-[11px] text-[#7e766a]">
              NODE_VN_SGN_04 · TLSv1.3
            </span>
          </div>
        </div>
      </div>

      {/* Loading Bar when fetching MongoDB record */}
      {loading && (
        <div className="w-full bg-[#f2ede9] border-b border-[#cfc5b8]/30 py-1 px-4 text-center text-xs text-[#7e766a] flex items-center justify-center gap-2">
          <div className="w-3 h-3 border-2 border-[#6c5937] border-t-transparent rounded-full animate-spin"></div>
          <span>Đang đồng bộ hồ sơ giám định từ cơ sở dữ liệu...</span>
        </div>
      )}

      {/* Main Container */}
      <div className="relative w-full overflow-hidden bg-[#fdf8f5] px-4 sm:px-6 lg:px-12 py-6 space-y-6 max-w-7xl mx-auto flex-1">
        {/* Top Meta Action Bar: Breadcrumbs & Back Navigation */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-2 border-b border-[#cfc5b8]/20">
          <div className="flex items-center gap-2 text-xs text-[#4c463c] flex-wrap">
            <Link
              to="/admin/dashboard"
              className="hover:text-[#6c5937] transition-colors flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[16px]">
                admin_panel_settings
              </span>
              <span>Quản Trị Hệ Thống (Admin)</span>
            </Link>
            <span className="text-[#cfc5b8]">/</span>
            <Link
              to="/admin/kyc"
              className="hover:text-[#6c5937] transition-colors"
            >
              Duyệt KYC
            </Link>
            <span className="text-[#cfc5b8]">/</span>
            <span className="text-[#6c5937] font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#6c5937] inline-block"></span>
              <span>Thẩm Định Hồ Sơ ({applicant.code})</span>
            </span>
          </div>

          <Link
            to="/admin/kyc"
            className="inline-flex items-center gap-2 text-xs text-[#1c1b19] hover:text-[#6c5937] transition-colors py-1.5 px-3 rounded-lg bg-[#f7f3ef] hover:bg-[#ece7e4] shadow-xs border border-[#cfc5b8]/30 self-start md:self-auto"
          >
            <span className="material-symbols-outlined text-[18px]">
              arrow_back
            </span>
            <span>Quay lại danh sách KYC</span>
          </Link>
        </div>

        {/* Editorial Header & State Indicator Banner */}
        <div className="bg-[#f7f3ef] rounded-2xl p-6 lg:p-7 shadow-xs border border-[#cfc5b8]/30 flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative overflow-hidden">
          {/* Watermark Seal Ornament */}
          <div className="absolute -right-8 -bottom-8 opacity-5 pointer-events-none select-none text-[#6c5937]">
            <span className="material-symbols-outlined text-[200px]">
              verified_user
            </span>
          </div>

          <div className="space-y-2 max-w-3xl relative z-10">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="px-2.5 py-1 rounded bg-[#ffdcc1] text-[#673d14] text-xs font-mono font-bold tracking-wider uppercase">
                Mã Hồ Sơ: {applicant.code}
              </span>
              <span className="text-[#4c463c] text-xs flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px] text-[#48654b]">
                  schedule
                </span>
                <span>Tiếp nhận: {applicant.submissionTime}</span>
              </span>
            </div>

            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#1c1b19] tracking-tight">
              Thẩm Định Hồ Sơ Định Danh (KYC Review)
            </h1>

            <p className="text-xs sm:text-sm text-[#4c463c] leading-relaxed">
              Đối soát và xác thực chứng từ pháp lý của ứng viên theo tiêu chuẩn an toàn lưu ký ReUse Hub · Chuẩn mực kiểm toán vòng đời B-Corp.
            </p>
          </div>

          {/* State Inspector Segmented Pill */}
          <div className="relative z-10 flex flex-col items-start lg:items-end gap-1.5 shrink-0">
            <span className="text-[11px] uppercase tracking-wider text-[#4c463c] font-bold">
              Trạng Thái Hồ Sơ Hiện Thời
            </span>
            <div className="inline-flex items-center p-1 bg-[#e6e2de] rounded-xl shadow-inner gap-1 border border-[#cfc5b8]/40">
              {/* Pending State */}
              <button
                type="button"
                onClick={() => setCurrentStatus("pending")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  currentStatus === "pending"
                    ? "bg-[#ffffff] text-[#7f5227] shadow-xs font-bold"
                    : "opacity-60 hover:opacity-100 text-[#4c463c]"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-[#7f5227] animate-pulse"></span>
                <span>ĐANG CHỜ DUYỆT</span>
                <span className="text-[10px] text-[#7e766a]">(PENDING)</span>
              </button>

              {/* Approved State */}
              <button
                type="button"
                onClick={() => setCurrentStatus("approved")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  currentStatus === "approved"
                    ? "bg-[#caebc9] text-[#05210c] shadow-xs font-bold"
                    : "opacity-60 hover:opacity-100 text-[#48654b]"
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#48654b]"></span>
                <span>ĐÃ DUYỆT</span>
              </button>

              {/* Rejected State */}
              <button
                type="button"
                onClick={() => setCurrentStatus("rejected")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  currentStatus === "rejected"
                    ? "bg-[#ffdad6] text-[#ba1a1a] shadow-xs font-bold"
                    : "opacity-60 hover:opacity-100 text-[#ba1a1a]"
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#ba1a1a]"></span>
                <span>BỊ TỪ CHỐI</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main Two-Column Editorial Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ================= LEFT COLUMN (~65% content & documents) ================= */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            {/* 1. Submitted Information Card */}
            <section className="bg-[#f7f3ef] rounded-2xl p-6 lg:p-7 shadow-xs border border-[#cfc5b8]/30 space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-[#cfc5b8]/20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#86724d] text-[#fffbff] flex items-center justify-center shadow-xs">
                    <span className="material-symbols-outlined text-[22px]">
                      badge
                    </span>
                  </div>
                  <div>
                    <h2 className="font-serif text-lg font-bold text-[#1c1b19]">
                      1. Thông Tin Khai Báo Của Ứng Viên
                    </h2>
                    <p className="text-xs text-[#4c463c]">
                      Trích xuất tự động qua OCR Quang học &amp; Bản đối sánh Dữ liệu số
                    </p>
                  </div>
                </div>

                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#caebc9] text-[#4e6b50] text-xs font-bold shadow-xs">
                  <span className="material-symbols-outlined text-[15px]">
                    verified
                  </span>
                  <span>100% Khớp OCR</span>
                </div>
              </div>

              {/* Metadata Field Mappings Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="bg-[#ffffff] p-4 rounded-xl shadow-xs border border-[#cfc5b8]/20">
                  <span className="text-[11px] text-[#4c463c] uppercase font-bold tracking-wider block">
                    Họ và tên khai báo (Full Name)
                  </span>
                  <span className="font-serif text-base sm:text-lg font-bold text-[#1c1b19] mt-1 block tracking-tight">
                    {applicant.fullName}
                  </span>
                  <span className="text-[11px] text-[#48654b] flex items-center gap-1 mt-1 font-semibold">
                    <span className="material-symbols-outlined text-[13px]">
                      check_circle
                    </span>
                    Trùng khớp định danh ngân hàng liên kết
                  </span>
                </div>

                <div className="bg-[#ffffff] p-4 rounded-xl shadow-xs border border-[#cfc5b8]/20">
                  <span className="text-[11px] text-[#4c463c] uppercase font-bold tracking-wider block">
                    Ngày sinh (Date of Birth)
                  </span>
                  <span className="font-serif text-base sm:text-lg font-bold text-[#1c1b19] mt-1 block tracking-tight">
                    {applicant.dob}
                  </span>
                  <span className="text-[11px] text-[#4c463c] mt-1 block font-medium">
                    {applicant.age}
                  </span>
                </div>

                <div className="bg-[#ffffff] p-4 rounded-xl shadow-xs border border-[#cfc5b8]/20">
                  <span className="text-[11px] text-[#4c463c] uppercase font-bold tracking-wider block">
                    Loại giấy tờ định danh (ID Type)
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="material-symbols-outlined text-[#6c5937] text-[20px]">
                      smart_card_reader
                    </span>
                    <span className="text-sm font-bold text-[#1c1b19]">
                      {applicant.idType}
                    </span>
                  </div>
                  <span className="text-[11px] text-[#4c463c] mt-1 block">
                    Tiêu chuẩn ICAO 9303 Bộ Công An VN
                  </span>
                </div>

                <div className="bg-[#ffffff] p-4 rounded-xl shadow-xs border border-[#cfc5b8]/20">
                  <span className="text-[11px] text-[#4c463c] uppercase font-bold tracking-wider block">
                    Số Căn Cước Công Dân (ID Number)
                  </span>
                  <span className="text-base sm:text-lg font-mono text-[#6c5937] mt-1 block tracking-wider font-bold">
                    {applicant.idNumber}
                  </span>
                  <span className="text-[11px] text-[#48654b] flex items-center gap-1 mt-1 font-semibold">
                    <span className="material-symbols-outlined text-[13px]">
                      task_alt
                    </span>
                    Mã xác thực Checksum SHA-256 Hợp lệ
                  </span>
                </div>

                <div className="bg-[#ffffff] p-4 rounded-xl shadow-xs border border-[#cfc5b8]/20 sm:col-span-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="text-[11px] text-[#4c463c] uppercase font-bold tracking-wider block">
                        Thời Hạn Sử Dụng Chứng Từ
                      </span>
                      <span className="text-sm font-semibold text-[#1c1b19] mt-1 block">
                        {applicant.validityRange}
                      </span>
                    </div>
                    <div className="px-3 py-1 rounded-lg bg-[#caebc9]/70 text-[#4e6b50] text-xs font-bold flex items-center gap-1.5 self-start sm:self-auto">
                      <span className="w-2 h-2 rounded-full bg-[#48654b]"></span>
                      <span>{applicant.validityNote}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-[#ffffff] p-4 rounded-xl shadow-xs border border-[#cfc5b8]/20 sm:col-span-2">
                  <span className="text-[11px] text-[#4c463c] uppercase font-bold tracking-wider block">
                    Quê quán / Nơi thường trú (Permanent Address)
                  </span>
                  <span className="text-sm font-medium text-[#1c1b19] mt-1 block leading-relaxed">
                    {applicant.address}
                  </span>
                  <p className="text-[11px] text-[#7e766a] mt-1">
                    Khớp bản đồ địa chính hệ thống bưu chính kho vận ReUse Hub
                  </p>
                </div>
              </div>
            </section>

            {/* 2. Documents Preview Section with Forensic Inspect Tool */}
            <section className="bg-[#f7f3ef] rounded-2xl p-6 lg:p-7 shadow-xs border border-[#cfc5b8]/30 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#cfc5b8]/20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#6c5937] text-white flex items-center justify-center shadow-xs">
                    <span className="material-symbols-outlined text-[22px]">
                      document_scanner
                    </span>
                  </div>
                  <div>
                    <h2 className="font-serif text-lg font-bold text-[#1c1b19]">
                      2. Tài Liệu Thẩm Định Giám Định
                    </h2>
                    <p className="text-xs text-[#4c463c]">
                      Bản quét phân giải 600 DPI &amp; Dữ liệu nhận diện trắc diện 3D Liveness
                    </p>
                  </div>
                </div>

                <div className="text-xs text-[#4c463c] flex items-center gap-1.5 bg-[#ffffff] px-3 py-1.5 rounded-lg border border-[#cfc5b8]/30 shadow-xs">
                  <span className="material-symbols-outlined text-[16px] text-[#6c5937]">
                    zoom_in
                  </span>
                  <span>Nhấp vào hình để soi kính lúp</span>
                </div>
              </div>

              {/* Document Cards Mosaic */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Document 1: CCCD Mặt Trước */}
                <div className="bg-[#ffffff] rounded-2xl p-4 shadow-xs border border-[#cfc5b8]/20 flex flex-col justify-between group hover:shadow-md transition-shadow">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-[#1c1b19] flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px] text-[#6c5937]">
                          credit_card
                        </span>
                        <span>Mặt Trước CCCD</span>
                      </span>
                      <span className="text-[#48654b] font-semibold text-[11px]">
                        4.12 MB · OCR Hoàn Hảo
                      </span>
                    </div>

                    {/* Graphic Preview Representation */}
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() =>
                        handleOpenInspector(
                          `Mặt Trước CCCD: ${applicant.fullName}`,
                          applicant.frontDoc.imgUrl
                        )
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleOpenInspector(
                            `Mặt Trước CCCD: ${applicant.fullName}`,
                            applicant.frontDoc.imgUrl
                          );
                        }
                      }}
                      className="relative w-full aspect-[16/10] bg-[#ece7e4] rounded-xl overflow-hidden cursor-zoom-in group/img border border-[#cfc5b8]/30"
                    >
                      <img
                        className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-300"
                        src={applicant.frontDoc.imgUrl}
                        alt="CCCD Front"
                      />
                      {/* Inspection Overlay HUD */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end justify-between p-3 opacity-90">
                        <span className="text-white text-[10px] font-mono">
                          {applicant.frontDoc.hash}
                        </span>
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#ffffff]/90 text-[#1c1b19] text-[10px] font-bold shadow-xs">
                          <span className="material-symbols-outlined text-[12px]">
                            search
                          </span>
                          <span>Soi Vân Nổi</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-[#cfc5b8]/20 flex items-center justify-between text-xs text-[#4c463c]">
                    <span className="flex items-center gap-1 text-[11px]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#48654b]"></span>
                      <span>Góc chụp 90° · Đủ 4 góc</span>
                    </span>
                    <span className="text-[#6c5937] font-mono text-[11px] font-bold">
                      DPI 600 · SGN-ID
                    </span>
                  </div>
                </div>

                {/* Document 2: CCCD Mặt Sau */}
                <div className="bg-[#ffffff] rounded-2xl p-4 shadow-xs border border-[#cfc5b8]/20 flex flex-col justify-between group hover:shadow-md transition-shadow">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-[#1c1b19] flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px] text-[#6c5937]">
                          nfc
                        </span>
                        <span>Mặt Sau CCCD (Chip &amp; MRZ)</span>
                      </span>
                      <span className="text-[#48654b] font-semibold text-[11px]">
                        3.88 MB · NFC Hợp Lệ
                      </span>
                    </div>

                    {/* Graphic Preview Representation */}
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() =>
                        handleOpenInspector(
                          "Mặt Sau CCCD: Chip Vi Mạch & Dải MRZ",
                          applicant.backDoc.imgUrl
                        )
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleOpenInspector(
                            "Mặt Sau CCCD: Chip Vi Mạch & Dải MRZ",
                            applicant.backDoc.imgUrl
                          );
                        }
                      }}
                      className="relative w-full aspect-[16/10] bg-[#ece7e4] rounded-xl overflow-hidden cursor-zoom-in group/img border border-[#cfc5b8]/30"
                    >
                      <img
                        className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-300"
                        src={applicant.backDoc.imgUrl}
                        alt="CCCD Back"
                      />
                      {/* Inspection Overlay HUD */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end justify-between p-3 opacity-90">
                        <span className="text-white text-[10px] font-mono">
                          {applicant.backDoc.hash}
                        </span>
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#ffffff]/90 text-[#1c1b19] text-[10px] font-bold shadow-xs">
                          <span className="material-symbols-outlined text-[12px]">
                            search
                          </span>
                          <span>Kiểm Tra Chip</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-[#cfc5b8]/20 flex items-center justify-between text-xs text-[#4c463c]">
                    <span className="flex items-center gap-1 text-[11px]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#48654b]"></span>
                      <span>Chữ ký &amp; Dấu vân tay rõ nét</span>
                    </span>
                    <span className="text-[#48654b] font-mono text-[11px] font-bold">
                      NFC-PASS
                    </span>
                  </div>
                </div>

                {/* Document 3: Biometric Liveness Face Check */}
                <div className="md:col-span-2 bg-[#ffffff] rounded-2xl p-5 shadow-xs border border-[#cfc5b8]/20 flex flex-col md:flex-row gap-5 items-center">
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() =>
                      handleOpenInspector(
                        "Kiểm Tra Sinh Trắc Học Liveness 3D",
                        applicant.livenessDoc.imgUrl
                      )
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleOpenInspector(
                          "Kiểm Tra Sinh Trắc Học Liveness 3D",
                          applicant.livenessDoc.imgUrl
                        );
                      }
                    }}
                    className="w-full md:w-52 aspect-[3/4] bg-[#ece7e4] rounded-xl overflow-hidden shrink-0 relative cursor-zoom-in group/face border border-[#cfc5b8]/30 shadow-xs"
                  >
                    <img
                      className="w-full h-full object-cover group-hover/face:scale-105 transition-transform duration-300"
                      src={applicant.livenessDoc.imgUrl}
                      alt="Biometric face check"
                    />
                    <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-[#48654b] text-[#ffffff] text-[10px] font-bold tracking-wider shadow-xs">
                      LIVENESS {applicant.livenessRate}
                    </div>
                    <div className="absolute bottom-2.5 right-2.5 px-2 py-1 rounded-md bg-[#ffffff]/90 text-[#1c1b19] text-[10px] flex items-center gap-1 font-bold shadow-xs">
                      <span className="material-symbols-outlined text-[12px]">
                        visibility
                      </span>
                      <span>Mở Toàn Màn Hình</span>
                    </div>
                  </div>

                  <div className="flex-1 space-y-3.5 w-full">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded bg-[#caebc9] text-[#4e6b50] text-[10px] font-bold uppercase">
                          Xác Thực Trắc Diện Đạt Chuẩn
                        </span>
                        <span className="text-[#7e766a] text-xs font-mono">
                          {applicant.livenessDoc.subtitle}
                        </span>
                      </div>
                      <h3 className="font-serif text-lg font-bold text-[#1c1b19]">
                        Ảnh Chân Dung Sinh Trắc Học · 3D Liveness Detection
                      </h3>
                      <p className="text-xs text-[#4c463c] leading-relaxed">
                        Ứng viên đã vượt qua 4 cử động ngẫu nhiên (chớp mắt, nghiêng góc 15°, mỉm cười nhẹ) để loại trừ rủi ro giả mạo Deepfake và mặt nạ silicon tái tạo.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
                      <div className="bg-[#f7f3ef] p-3 rounded-xl border border-[#cfc5b8]/20">
                        <span className="text-[10px] text-[#4c463c] block uppercase font-bold tracking-wider">
                          Khớp Khuôn Mặt (Face-Match)
                        </span>
                        <span className="font-serif text-lg font-bold text-[#48654b]">
                          {applicant.faceMatchRate}
                        </span>
                      </div>

                      <div className="bg-[#f7f3ef] p-3 rounded-xl border border-[#cfc5b8]/20">
                        <span className="text-[10px] text-[#4c463c] block uppercase font-bold tracking-wider">
                          Chống Tấn Công (Anti-Spoofing)
                        </span>
                        <span className="font-serif text-lg font-bold text-[#48654b]">
                          {applicant.antiSpoofing}
                        </span>
                      </div>

                      <div className="bg-[#f7f3ef] p-3 rounded-xl border border-[#cfc5b8]/20 col-span-2 sm:col-span-1">
                        <span className="text-[10px] text-[#4c463c] block uppercase font-bold tracking-wider">
                          Cường Độ Ánh Sáng
                        </span>
                        <span className="font-serif text-lg font-bold text-[#1c1b19]">
                          {applicant.lightingIntensity}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* 3. Prominent Warning Box: Governance & Role Immutability Notice */}
            <section className="bg-[#e6e2de] rounded-2xl p-6 lg:p-7 shadow-xs border border-[#cfc5b8]/40 relative overflow-hidden">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#7f5227] text-white flex items-center justify-center shrink-0 shadow-xs">
                  <span className="material-symbols-outlined text-[28px]">
                    gavel
                  </span>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded bg-[#ffdcc1] text-[#673d14] text-[10px] font-bold uppercase tracking-wider">
                      Quy Định Pháp Chế &amp; An Toàn Bất Biến
                    </span>
                    <span className="text-[#4c463c] text-xs font-mono font-semibold">
                      GOVERNANCE-POLICY § 4.2
                    </span>
                  </div>

                  <h3 className="font-serif text-lg font-bold text-[#1c1b19] tracking-tight">
                    NGUYÊN TẮC QUẢN TRỊ BẤT BIẾN (ROLE IMMUTABILITY POLICY)
                  </h3>

                  <p className="text-xs sm:text-sm text-[#1c1b19] font-medium leading-relaxed">
                    XÉT DUYỆT KYC CHỈ LÀ QUY TRÌNH THẨM ĐỊNH PHÁP LÝ (VERIFICATION PROCESS).
                  </p>

                  <div className="p-4 rounded-xl bg-[#ffffff] space-y-2 text-xs text-[#4c463c] shadow-xs border border-[#cfc5b8]/30">
                    <p className="text-[#1c1b19] font-semibold">
                      Phê duyệt KYC CHỈ thay đổi trạng thái xác thực (
                      <span className="font-mono text-[#48654b] font-bold">
                        KYC Status: APPROVED
                      </span>
                      ).
                    </p>
                    <p className="font-bold text-[#ba1a1a]">
                      TUYỆT ĐỐI KHÔNG LÀM THAY ĐỔI PHÂN VAI CỐT LÕI CỦA NGƯỜI DÙNG:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-xs pl-1">
                      <li>
                        <span className="font-bold text-[#1c1b19]">KHÔNG</span> chuyển Customer thành Shop Owner.
                      </li>
                      <li>
                        <span className="font-bold text-[#1c1b19]">KHÔNG</span> chuyển Shop Owner thành Administrator.
                      </li>
                    </ul>
                    <div className="pt-2 border-t border-[#cfc5b8]/20 text-[11px] text-[#4c463c] flex flex-wrap items-center gap-4">
                      <span>
                        • Sau khi phê duyệt: Trạng thái đổi sang{" "}
                        <strong className="text-[#48654b]">ĐÃ DUYỆT (APPROVED)</strong>.
                      </span>
                      <span>
                        • Sau khi từ chối: Trạng thái đổi sang{" "}
                        <strong className="text-[#ba1a1a]">BỊ TỪ CHỐI (REJECTED)</strong>.
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* ================= RIGHT COLUMN (~35% Applicant Dossier & Adjudication Actions) ================= */}
          <div className="lg:col-span-4 flex flex-col gap-6 lg:sticky lg:top-24">
            {/* 1. Applicant Profile Dossier Card */}
            <div className="bg-[#f7f3ef] rounded-2xl p-6 shadow-xs border border-[#cfc5b8]/30 space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-[#cfc5b8]/20">
                <span className="text-[11px] uppercase tracking-wider text-[#6c5937] font-bold">
                  Hồ Sơ Ứng Viên Lưu Trữ
                </span>
                <span className="px-2 py-0.5 rounded bg-[#ece7e4] text-[#4c463c] font-mono text-[11px] font-semibold">
                  #USR-38194
                </span>
              </div>

              {/* Profile Snapshot */}
              <div className="flex items-center gap-3.5">
                <div className="relative w-16 h-16 rounded-full overflow-hidden shrink-0 shadow-xs bg-[#e6e2de] border border-[#cfc5b8]/40">
                  <img
                    className="w-full h-full object-cover"
                    src={applicant.avatarUrl}
                    alt={applicant.fullName}
                  />
                  <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-[#48654b] ring-2 ring-[#ffffff]"></span>
                </div>
                <div className="min-w-0">
                  <h3 className="font-serif text-base sm:text-lg font-bold text-[#1c1b19] truncate">
                    {applicant.fullName}
                  </h3>
                  <p className="text-xs text-[#4c463c] truncate font-medium">
                    {applicant.email}
                  </p>
                  <span className="inline-flex items-center gap-1 text-[11px] text-[#48654b] font-semibold mt-0.5">
                    <span className="material-symbols-outlined text-[13px]">
                      lock
                    </span>
                    Đã kích hoạt bảo mật 2FA
                  </span>
                </div>
              </div>

              {/* Dossier Details */}
              <div className="space-y-2.5 pt-1 text-xs">
                <div className="flex items-center justify-between p-3 rounded-xl bg-[#ffffff] shadow-xs border border-[#cfc5b8]/20">
                  <span className="text-[#4c463c] font-medium">Phân vai hiện tại (Role)</span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#caebc9] text-[#4e6b50] font-bold">
                    <span className="material-symbols-outlined text-[14px]">
                      storefront
                    </span>
                    <span>{applicant.roleName}</span>
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-[#ffffff] shadow-xs border border-[#cfc5b8]/20">
                  <span className="text-[#4c463c] font-medium">Xưởng chế tác / Gian hàng</span>
                  <span
                    className="text-[#1c1b19] font-bold text-right truncate max-w-[170px]"
                    title={applicant.workshopName}
                  >
                    {applicant.workshopName}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-[#ffffff] shadow-xs border border-[#cfc5b8]/20">
                  <span className="text-[#4c463c] font-medium">Ngày khởi tạo tài khoản</span>
                  <span className="text-[#1c1b19] font-mono font-semibold">
                    {applicant.registrationDate}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-[#ffffff] shadow-xs border border-[#cfc5b8]/20">
                  <span className="text-[#4c463c] font-medium">Lịch sử tranh chấp</span>
                  <span className="text-[#48654b] font-bold">
                    {applicant.disputeHistory}
                  </span>
                </div>


              </div>

              <Link
                to={`/admin/users/${applicant.id}`}
                className="w-full py-2.5 px-4 rounded-xl bg-[#f2ede9] hover:bg-[#ece7e4] transition-colors flex items-center justify-center gap-2 text-xs text-[#1c1b19] font-bold shadow-xs border border-[#cfc5b8]/30"
              >
                <span>Xem Toàn Bộ Hồ Sơ Người Dùng (View User)</span>
                <span className="material-symbols-outlined text-[16px]">
                  arrow_forward
                </span>
              </Link>
            </div>

            {/* 2. Verification Status Indicator (Current Pipeline Tracker) */}
            <div className="bg-[#f7f3ef] rounded-2xl p-6 shadow-xs border border-[#cfc5b8]/30 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-wider text-[#6c5937] font-bold">
                  Quy Trình 3 Bước Thẩm Định
                </span>
                <span className="text-[11px] text-[#7e766a] font-medium">
                  Chuẩn ISO-14044
                </span>
              </div>

              <div className="space-y-2.5">
                {/* Step 1: Pending */}
                <div
                  className={`flex items-start gap-3 p-3 rounded-xl transition-all ${
                    currentStatus === "pending"
                      ? "bg-[#ffffff] shadow-xs border border-[#cfc5b8]/30 opacity-100"
                      : "bg-[#ffffff]/50 opacity-50"
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-white shrink-0 mt-0.5 ${
                      currentStatus === "pending" ? "bg-[#6c5937]" : "bg-[#7e766a]"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[15px]">
                      pending
                    </span>
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#1c1b19] block">
                      1. Đang Chờ Duyệt (PENDING)
                    </span>
                    <span className="text-[11px] text-[#6c5937] font-medium block">
                      • Trạng thái tiếp nhận hồ sơ ban đầu
                    </span>
                  </div>
                </div>

                {/* Step 2: Approved */}
                <div
                  className={`flex items-start gap-3 p-3 rounded-xl transition-all ${
                    currentStatus === "approved"
                      ? "bg-[#ffffff] shadow-xs border border-[#caebc9] opacity-100 ring-1 ring-[#48654b]/30"
                      : "bg-[#ffffff]/50 opacity-50"
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-white shrink-0 mt-0.5 ${
                      currentStatus === "approved" ? "bg-[#48654b]" : "bg-[#7e766a]"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[15px]">
                      check
                    </span>
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#1c1b19] block">
                      2. Đã Phê Duyệt (APPROVED)
                    </span>
                    <span className="text-[11px] text-[#48654b] font-medium block">
                      Mở quyền ký gửi lưu ký và ký hợp đồng thuê sàn
                    </span>
                  </div>
                </div>

                {/* Step 3: Rejected */}
                <div
                  className={`flex items-start gap-3 p-3 rounded-xl transition-all ${
                    currentStatus === "rejected"
                      ? "bg-[#ffffff] shadow-xs border border-[#ffdad6] opacity-100 ring-1 ring-[#ba1a1a]/30"
                      : "bg-[#ffffff]/50 opacity-50"
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-white shrink-0 mt-0.5 ${
                      currentStatus === "rejected" ? "bg-[#ba1a1a]" : "bg-[#7e766a]"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[15px]">
                      close
                    </span>
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#1c1b19] block">
                      3. Bị Từ Chối (REJECTED)
                    </span>
                    <span className="text-[11px] text-[#ba1a1a] font-medium block">
                      Hồ sơ yêu cầu chụp lại hoặc bổ sung tài liệu
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Admin Adjudication Actions Box */}
            <div className="bg-[#f7f3ef] rounded-2xl p-6 shadow-xs border border-[#cfc5b8]/30 space-y-4">
              <div className="space-y-1">
                <span className="text-[11px] uppercase tracking-wider text-[#6c5937] font-bold block">
                  Quyết Định Thẩm Định Viên (Adjudication)
                </span>
                <p className="text-xs text-[#4c463c] leading-relaxed">
                  Mọi hành động phê duyệt hoặc từ chối đều được ký số và lưu nhật ký kiểm toán không thể xóa.
                </p>
              </div>

              <div className="space-y-2.5">
                {/* Primary Action: Approve */}
                <button
                  type="button"
                  onClick={handleApprove}
                  className="w-full py-3 px-4 rounded-xl bg-[#1c1b19] hover:bg-[#6c5937] text-[#ffffff] transition-all flex items-center justify-center gap-2 text-xs font-bold shadow-sm cursor-pointer group"
                >
                  <span className="material-symbols-outlined text-[18px] text-[#caebc9] group-hover:scale-110 transition-transform">
                    verified
                  </span>
                  <span>Phê Duyệt Xác Thực (Approve Verification)</span>
                </button>
                <p className="text-[11px] text-[#7e766a] text-center">
                  Phê duyệt hồ sơ và nâng hạn mức ký quỹ lưu ký theo đúng quy chuẩn nền tảng.
                </p>

                <div className="h-[1px] bg-[#cfc5b8]/30 my-1"></div>

                {/* Secondary Action: Reject */}
                <button
                  type="button"
                  onClick={handleOpenRejectModal}
                  className="w-full py-3 px-4 rounded-xl bg-[#ffffff] hover:bg-[#ffdad6]/40 text-[#ba1a1a] transition-all flex items-center justify-center gap-2 text-xs font-bold shadow-xs border border-[#cfc5b8]/30 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    cancel
                  </span>
                  <span>Từ Chối Xác Thực (Reject Verification)</span>
                </button>
                <p className="text-[11px] text-[#7e766a] text-center">
                  Mở hộp thoại ghi rõ nguyên nhân để yêu cầu người dùng chụp lại chứng từ.
                </p>
              </div>

              <div className="pt-2 text-center border-t border-[#cfc5b8]/20">
                <Link
                  to="/admin/kyc"
                  className="inline-flex items-center gap-1.5 text-xs text-[#4c463c] hover:text-[#6c5937] font-semibold transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">
                    arrow_back
                  </span>
                  <span>Quay lại danh sách hàng đợi KYC</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Notification Toast Simulation */}
      {toast.visible && (
        <div className="fixed bottom-6 right-6 z-50 animate-fade-in pointer-events-auto">
          <div className="bg-[#1c1b19] text-[#ffffff] px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 border border-[#cfc5b8]/40">
            <span
              className={`material-symbols-outlined text-[22px] ${
                toast.icon === "verified" ? "text-[#caebc9]" : "text-[#ffdad6]"
              }`}
            >
              {toast.icon}
            </span>
            <div>
              <h4 className="text-xs font-bold text-white">{toast.title}</h4>
              <p className="text-[11px] text-[#ffffff]/80 mt-0.5">{toast.desc}</p>
            </div>
            <button
              type="button"
              onClick={() => setToast((prev) => ({ ...prev, visible: false }))}
              className="ml-2 text-[#7e766a] hover:text-white"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>
        </div>
      )}

      {/* 5. Reject Confirmation Modal */}
      {isRejectModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#1c1b19]/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#ffffff] rounded-2xl shadow-2xl max-w-lg w-full p-6 sm:p-7 space-y-5 border border-[#cfc5b8]/40">
            <div className="flex items-start justify-between gap-4 border-b border-[#cfc5b8]/20 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#ffdad6] text-[#ba1a1a] flex items-center justify-center shrink-0 shadow-xs">
                  <span className="material-symbols-outlined text-[22px]">
                    gavel
                  </span>
                </div>
                <div>
                  <h3 className="font-serif text-lg font-bold text-[#1c1b19]">
                    Từ Chối Hồ Sơ Xác Thực KYC
                  </h3>
                  <span className="text-xs text-[#6c5937] font-mono font-bold">
                    MÃ HỒ SƠ: {applicant.code}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseRejectModal}
                className="text-[#7e766a] hover:text-[#1c1b19] p-1 rounded-lg hover:bg-[#f2ede9] transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">
                  close
                </span>
              </button>
            </div>

            <p className="text-xs text-[#4c463c] leading-relaxed">
              Vui lòng chỉ định lý do từ chối để hệ thống gửi thông báo hướng dẫn bổ sung cho ứng viên{" "}
              <strong className="text-[#1c1b19]">{applicant.fullName}</strong>.
            </p>

            {/* Quick Selection Reason Chips */}
            <div className="space-y-1.5">
              <label className="block text-[11px] uppercase tracking-wider text-[#4c463c] font-bold">
                Chọn Nhanh Nguyên Nhân Tiêu Chuẩn:
              </label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  "Ảnh mặt sau CCCD bị lóa sáng che mất dãy số MRZ.",
                  "Mất góc chứng từ; viền thẻ CCCD bị cắt xén không đủ 4 góc.",
                  "Sai lệch thông tin ngày sinh so với dữ liệu đăng ký ban đầu.",
                  "Ảnh chân dung sinh trắc học không trùng khớp với người trên thẻ căn cước.",
                ].map((reason, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleAppendReason(reason)}
                    className="px-2.5 py-1.5 rounded-lg bg-[#f2ede9] text-[11px] font-medium hover:bg-[#ece7e4] transition-colors text-[#1c1b19] border border-[#cfc5b8]/30"
                  >
                    {idx === 0 && "Ảnh mờ / Chói sáng"}
                    {idx === 1 && "Mất góc chứng từ"}
                    {idx === 2 && "Sai lệch ngày sinh"}
                    {idx === 3 && "Chân dung không trùng khớp"}
                  </button>
                ))}
              </div>
            </div>

            {/* Textarea Input Form */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="reject-reason"
                  className="text-xs uppercase tracking-wider text-[#1c1b19] font-bold"
                >
                  Lý do từ chối chi tiết <span className="text-[#ba1a1a]">*</span>
                </label>
                <span className="text-[11px] text-[#7e766a]">
                  Gửi qua Email &amp; App
                </span>
              </div>
              <textarea
                id="reject-reason"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Ví dụ: Ảnh mặt sau CCCD bị lóa sáng che mất dãy số MRZ; vui lòng chụp lại trong điều kiện ánh sáng tự nhiên không dùng flash..."
                rows={4}
                className="w-full p-3 rounded-xl bg-[#f7f3ef] text-[#1c1b19] placeholder:text-[#7e766a] text-xs outline-none border border-[#cfc5b8]/40 focus:border-[#ba1a1a] transition-all resize-none"
              />
            </div>

            {/* Modal Footer Action Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#cfc5b8]/20">
              <button
                type="button"
                onClick={handleCloseRejectModal}
                className="px-4 py-2 rounded-xl bg-[#f2ede9] hover:bg-[#ece7e4] text-[#1c1b19] text-xs font-semibold transition-colors"
              >
                Hủy Bỏ (Cancel)
              </button>
              <button
                type="button"
                onClick={handleConfirmRejection}
                className="px-5 py-2 rounded-xl bg-[#ba1a1a] hover:bg-[#93000a] text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[17px]">
                  gavel
                </span>
                <span>Xác Nhận Từ Chối (Reject Verification)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Forensic Inspector Viewer Modal */}
      {isInspectorOpen && (
        <div className="fixed inset-0 z-50 bg-[#1c1b19]/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#ffffff] rounded-2xl shadow-2xl max-w-4xl w-full p-6 space-y-4 border border-[#cfc5b8]/40">
            <div className="flex items-center justify-between border-b border-[#cfc5b8]/20 pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#6c5937] text-[24px]">
                  qr_code_2
                </span>
                <h3 className="font-serif text-lg font-bold text-[#1c1b19]">
                  {inspectorTitle || "Kính Lúp Giám Định Pháp Y"}
                </h3>
              </div>
              <button
                type="button"
                onClick={handleCloseInspector}
                className="text-[#7e766a] hover:text-[#1c1b19] p-1 rounded-lg"
              >
                <span className="material-symbols-outlined text-[22px]">
                  close
                </span>
              </button>
            </div>

            <div className="w-full h-[520px] bg-[#e6e2de] rounded-xl overflow-hidden flex items-center justify-center relative border border-[#cfc5b8]/40">
              <img
                className="w-full h-full object-contain"
                src={inspectorImg}
                alt={inspectorTitle}
              />
              <div className="absolute bottom-4 left-4 bg-[#1c1b19]/90 text-white px-3 py-1.5 rounded-lg font-mono text-[11px] shadow-sm">
                FORENSIC LAB ZOOM: 300% · ISO-14044 AUDIT PASS
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-[#4c463c] pt-1">
              <span>
                Tiêu chuẩn bảo mật NIST Level 4 · Dữ liệu mã hóa không thể can thiệp
              </span>
              <button
                type="button"
                onClick={handleCloseInspector}
                className="px-4 py-2 rounded-xl bg-[#f2ede9] hover:bg-[#ece7e4] font-bold text-[#1c1b19] text-xs transition-colors"
              >
                Đóng Cửa Sổ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KycReview;