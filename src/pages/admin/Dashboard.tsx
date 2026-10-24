import React, { useEffect, useState, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  fetchAdminDashboardData,
  approveRentListingApi,
  rejectRentListingApi,
  approveThriftListingApi,
  rejectThriftListingApi,
  approveKycApi,
  rejectKycApi,
} from "../../services/admin.api";
import type {
  AdminDashboardData,
  RentListingItem,
  ThriftListingItem,
  KycApplicantItem,
  DisputeItem,
} from "../../services/admin.api";

type ApprovalTab = "ALL" | "RENT" | "THRIFT" | "KYC";

interface RejectModalState {
  isOpen: boolean;
  type: "RENT" | "THRIFT" | "KYC";
  targetId: string;
  targetName: string;
  reason: string;
  error?: string;
}

interface DashboardProps {
  initialTab?: ApprovalTab;
}

export const Dashboard: React.FC<DashboardProps> = ({ initialTab }) => {
  const location = useLocation();

  // Determine initial tab from props or pathname
  const resolvedInitialTab = useMemo<ApprovalTab>(() => {
    if (initialTab) return initialTab;
    const path = location.pathname.toLowerCase();
    if (path.includes("kyc")) return "KYC";
    if (path.includes("thrift")) return "THRIFT";
    if (path.includes("rent") || path.includes("listings")) return "RENT";
    return "ALL";
  }, [initialTab, location.pathname]);

  const [userSelectedTab, setUserSelectedTab] = useState<{ path: string; tab: ApprovalTab } | null>(null);
  const activeTab = userSelectedTab?.path === location.pathname ? userSelectedTab.tab : resolvedInitialTab;
  const setActiveTab = (tab: ApprovalTab) => setUserSelectedTab({ path: location.pathname, tab });
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Modal inspection states
  const [selectedRentItem, setSelectedRentItem] = useState<RentListingItem | null>(null);
  const [selectedThriftItem, setSelectedThriftItem] = useState<ThriftListingItem | null>(null);
  const [selectedKycItem, setSelectedKycItem] = useState<KycApplicantItem | null>(null);
  const [selectedDisputeItem, setSelectedDisputeItem] = useState<DisputeItem | null>(null);

  // Rejection modal state
  const [rejectModal, setRejectModal] = useState<RejectModalState>({
    isOpen: false,
    type: "RENT",
    targetId: "",
    targetName: "",
    reason: "",
  });

  // Lightbox Image Zoom modal state
  const [zoomImageUrl, setZoomImageUrl] = useState<string | null>(null);

  // Notification Toast state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      try {
        const dashboardData = await fetchAdminDashboardData();
        if (isMounted) {
          setData(dashboardData);
          setLoading(false);
        }
      } catch (err) {
        console.error("Lỗi nạp dữ liệu Admin Dashboard:", err);
        if (isMounted) setLoading(false);
      }
    };

    loadData();
    return () => {
      isMounted = false;
    };
  }, []);


  // ==========================================================================
  // HANDLERS: DUYỆT (APPROVE)
  // ==========================================================================
  const handleApproveRent = async (item: RentListingItem) => {
    try {
      await approveRentListingApi(item.id);
    } catch (err) {
      console.warn("Lỗi gọi API duyệt RENT:", err);
    }
    if (data) {
      const updatedList = data.rentApprovalList.filter((i) => i.id !== item.id);
      setData({
        ...data,
        rentApprovalList: updatedList,
        metrics: {
          ...data.metrics,
          pendingRentListingsCount: Math.max(0, data.metrics.pendingRentListingsCount - 1),
        },
      });
    }
    setSelectedRentItem(null);
    showToast(`Đã phê duyệt niêm yết RENT: "${item.name}" thành công!`);
  };

  const handleApproveThrift = async (item: ThriftListingItem) => {
    try {
      await approveThriftListingApi(item.id);
    } catch (err) {
      console.warn("Lỗi gọi API duyệt THRIFT:", err);
    }
    if (data) {
      const updatedList = data.thriftApprovalList.filter((i) => i.id !== item.id);
      setData({
        ...data,
        thriftApprovalList: updatedList,
        metrics: {
          ...data.metrics,
          pendingThriftListingsCount: Math.max(0, data.metrics.pendingThriftListingsCount - 1),
        },
      });
    }
    setSelectedThriftItem(null);
    showToast(`Đã bảo chứng và duyệt mục đăng THRIFT: "${item.name}"!`);
  };

  const handleApproveKyc = async (item: KycApplicantItem) => {
    try {
      await approveKycApi(item.id);
    } catch (err) {
      console.warn("Lỗi gọi API duyệt KYC:", err);
    }
    if (data) {
      const updatedApplicants = data.kycApplicants.filter((i) => i.id !== item.id);
      setData({
        ...data,
        kycApplicants: updatedApplicants,
        metrics: {
          ...data.metrics,
          pendingKycCount: Math.max(0, data.metrics.pendingKycCount - 1),
          urgentKycCount: Math.max(0, data.metrics.urgentKycCount - 1),
        },
      });
    }
    setSelectedKycItem(null);
    showToast(`Đã xác thực định danh (KYC) thành công cho đối tác: "${item.fullName}"!`);
  };

  // ==========================================================================
  // HANDLERS: TỪ CHỐI (REJECT)
  // ==========================================================================
  const openRejectModal = (type: "RENT" | "THRIFT" | "KYC", targetId: string, targetName: string) => {
    setRejectModal({
      isOpen: true,
      type,
      targetId,
      targetName,
      reason: "",
      error: undefined,
    });
  };

  const closeRejectModal = () => {
    setRejectModal({
      isOpen: false,
      type: "RENT",
      targetId: "",
      targetName: "",
      reason: "",
      error: undefined,
    });
  };

  const handleConfirmReject = async () => {
    const trimmedReason = rejectModal.reason.trim();
    if (!trimmedReason) {
      setRejectModal((prev) => ({
        ...prev,
        error: "Lý do từ chối là bắt buộc để thông báo cho đối tác/người dùng hoàn thiện lại hồ sơ.",
      }));
      return;
    }

    const { type, targetId, targetName } = rejectModal;

    if (type === "RENT") {
      try {
        await rejectRentListingApi(targetId, trimmedReason);
      } catch (err) {
        console.warn("Lỗi gọi API từ chối RENT:", err);
      }
      if (data) {
        setData({
          ...data,
          rentApprovalList: data.rentApprovalList.filter((i) => i.id !== targetId),
          metrics: {
            ...data.metrics,
            pendingRentListingsCount: Math.max(0, data.metrics.pendingRentListingsCount - 1),
          },
        });
      }
      setSelectedRentItem(null);
      showToast(`Đã từ chối niêm yết RENT: "${targetName}". Lý do: ${trimmedReason}`);
    } else if (type === "THRIFT") {
      try {
        await rejectThriftListingApi(targetId, trimmedReason);
      } catch (err) {
        console.warn("Lỗi gọi API từ chối THRIFT:", err);
      }
      if (data) {
        setData({
          ...data,
          thriftApprovalList: data.thriftApprovalList.filter((i) => i.id !== targetId),
          metrics: {
            ...data.metrics,
            pendingThriftListingsCount: Math.max(0, data.metrics.pendingThriftListingsCount - 1),
          },
        });
      }
      setSelectedThriftItem(null);
      showToast(`Đã từ chối mục đăng THRIFT: "${targetName}". Lý do: ${trimmedReason}`);
    } else if (type === "KYC") {
      try {
        await rejectKycApi(targetId, trimmedReason);
      } catch (err) {
        console.warn("Lỗi gọi API từ chối KYC:", err);
      }
      if (data) {
        setData({
          ...data,
          kycApplicants: data.kycApplicants.filter((i) => i.id !== targetId),
          metrics: {
            ...data.metrics,
            pendingKycCount: Math.max(0, data.metrics.pendingKycCount - 1),
            urgentKycCount: Math.max(0, data.metrics.urgentKycCount - 1),
          },
        });
      }
      setSelectedKycItem(null);
      showToast(`Đã từ chối hồ sơ KYC của "${targetName}". Lý do: ${trimmedReason}`);
    }

    closeRejectModal();
  };

  // Rejection Quick Reason Presets
  const quickReasonPresets = useMemo(() => {
    if (rejectModal.type === "RENT") {
      return [
        "Ảnh sản phẩm bị mờ, thiếu góc chụp tổng quan và tem mác",
        "Mức giá cọc hoặc giá thuê chưa hợp lý theo tiêu chuẩn thị trường",
        "Thông tin mô tả hoặc quy định thuê vi phạm chính sách sàn",
        "Nghi ngờ trang phục không chính hãng hoặc thiếu hóa đơn mua hàng",
      ];
    }
    if (rejectModal.type === "THRIFT") {
      return [
        "Ảnh chụp thiếu tem mác chứng minh nguồn gốc xuất xứ di sản",
        "Tình trạng sản phẩm không khớp với mức độ hao mòn thực tế",
        "Giá bán thanh lý không phù hợp với chất lượng món đồ",
        "Chưa cung cấp đầy đủ thông số kích cỡ (size) cho người mua",
      ];
    }
    return [
      "Ảnh chụp Căn cước công dân bị lóa đèn flash, mờ cụm mã QR / MRZ",
      "Họ tên và ngày sinh trên ảnh CCCD không trùng khớp tài khoản",
      "Ảnh CCCD bị cắt góc hoặc có dấu hiệu chỉnh sửa kỹ thuật số",
      "Giấy tờ tùy thân đã hết hạn hiệu lực theo quy định pháp luật",
    ];
  }, [rejectModal.type]);

  const metrics = data?.metrics || {
    totalUsers: 11,
    weeklyNewUsers: 11,
    pendingKycCount: 1,
    urgentKycCount: 1,
    pendingRentListingsCount: 0,
    rentAverageSlaHours: 0,
    pendingThriftListingsCount: 0,
    openDisputesCount: 0,
    lockedEscrowAmount: 0,
    totalPlatformRevenue: 2950000,
    monthlyVolume: 2950000,
  };

  const rentApprovalList = data?.rentApprovalList || [];
  const thriftApprovalList = data?.thriftApprovalList || [];
  const kycList = (data?.kycApplicants || []).filter((k) => k.status === "PENDING");
  const disputeList = data?.disputes || [];
  const rentCatalog = data?.rentCatalogList || [];
  const thriftCatalog = data?.thriftCatalogList || [];

  const totalPendingQueue = rentApprovalList.length + thriftApprovalList.length + kycList.length;

  return (
    <div className="flex flex-col w-full bg-[#fdf9f2] min-h-screen">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#292724] text-[#fdf9f2] px-5 py-3.5 rounded-xl shadow-2xl flex items-center gap-3 border border-[#ccc5bc]/40 animate-fade-in max-w-md">
          <span className="material-symbols-outlined text-[#d8e3ce] text-[22px] shrink-0">
            check_circle
          </span>
          <span className="text-xs font-medium leading-relaxed">{toastMessage}</span>
        </div>
      )}

      {/* TOP GOVERNANCE BANNER & BREADCRUMB */}
      <section className="w-full bg-[#f7f3ec] px-4 sm:px-6 lg:px-12 py-3.5 border-b border-[#ccc5bc]/20">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          {/* Breadcrumb */}
          <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-2 text-xs text-[#4a463f] font-medium"
          >
            <span className="hover:text-[#1c1c18] transition-colors cursor-pointer">
              Quản Trị Hệ Thống
            </span>
            <span className="text-[#ccc5bc] text-[10px]">/</span>
            <span className="text-[#1c1c18] font-semibold tracking-wide">
              Kiểm Duyệt Sản Phẩm & Hồ Sơ KYC
            </span>
          </nav>

          {/* System status chip */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#f1ede6] text-[#1c1c18] text-[11px] shadow-xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#576151] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#576151]"></span>
            </span>
            <span className="text-[#4a463f] uppercase tracking-wider font-semibold">
              Hệ thống giám định B-Corp
            </span>
            <span className="text-[#ccc5bc]">•</span>
            <span className="text-[#576151] font-semibold">
              {loading
                ? "Đang tải dữ liệu kiểm duyệt..."
                : `Hàng chờ hoạt động: ${totalPendingQueue} mục cần xử lý`}
            </span>
          </div>
        </div>
      </section>

      {/* MAIN CONTAINER */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-12 py-8 space-y-10">
        {/* WELCOME HEADER */}
        <header className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
            <div className="space-y-2 max-w-3xl">
              <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-wider text-[#7b5227] font-semibold">
                <span className="material-symbols-outlined text-[15px]">
                  verified_user
                </span>
                <span>GIÁM ĐỊNH LƯU KÝ & PHÊ DUYỆT ĐỊNH DANH</span>
              </div>
              <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#1c1c18]">
                Bảng Kiểm Duyệt Listing & Hồ Sơ KYC
              </h1>
              <p className="text-xs sm:text-sm text-[#4a463f] leading-relaxed">
                Kiểm định nguồn gốc thời trang cho thuê (RENT), phê duyệt mục đăng di sản (THRIFT) và xác thực định danh danh tính khách hàng & đối tác theo quy chuẩn B-Corp.
              </p>
            </div>

            {/* Quick Summary Pill */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="px-4 py-2.5 rounded-xl bg-white border border-[#ccc5bc]/30 shadow-xs text-right">
                <div className="text-[10px] uppercase font-bold text-[#7b766f]">
                  TỔNG HÀNG CHỜ
                </div>
                <div className="font-serif text-2xl font-bold text-[#ba1a1a]">
                  {totalPendingQueue}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* METRICS CARDS */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: RENT Chờ Duyệt */}
          <div
            onClick={() => setActiveTab("RENT")}
            className={`cursor-pointer p-4 rounded-2xl transition-all shadow-xs border ${
              activeTab === "RENT"
                ? "bg-[#292724] text-white border-[#292724]"
                : "bg-white hover:bg-[#f7f3ec] border-[#ccc5bc]/30 text-[#1c1c18]"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className={`text-[10px] uppercase font-bold tracking-wider ${activeTab === "RENT" ? "text-[#d8e3ce]" : "text-[#7b766f]"}`}>
                RENT CHỜ DUYỆT
              </span>
              <span className="material-symbols-outlined text-[20px] text-[#7b5227]">
                inventory_2
              </span>
            </div>
            <div className="font-serif text-2xl font-bold">
              {rentApprovalList.length}
            </div>
            <div className={`text-xs mt-1 ${activeTab === "RENT" ? "text-[#ccc5bc]" : "text-[#576151]"} font-medium`}>
              {rentApprovalList.length > 0 ? "Cần giám định trang phục" : "Đã duyệt toàn bộ"}
            </div>
          </div>

          {/* Card 2: THRIFT Chờ Duyệt */}
          <div
            onClick={() => setActiveTab("THRIFT")}
            className={`cursor-pointer p-4 rounded-2xl transition-all shadow-xs border ${
              activeTab === "THRIFT"
                ? "bg-[#292724] text-white border-[#292724]"
                : "bg-white hover:bg-[#f7f3ec] border-[#ccc5bc]/30 text-[#1c1c18]"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className={`text-[10px] uppercase font-bold tracking-wider ${activeTab === "THRIFT" ? "text-[#d8e3ce]" : "text-[#7b766f]"}`}>
                THRIFT CHỜ DUYỆT
              </span>
              <span className="material-symbols-outlined text-[20px] text-[#7b5227]">
                watch
              </span>
            </div>
            <div className="font-serif text-2xl font-bold">
              {thriftApprovalList.length}
            </div>
            <div className={`text-xs mt-1 ${activeTab === "THRIFT" ? "text-[#ccc5bc]" : "text-[#576151]"} font-medium`}>
              {thriftApprovalList.length > 0 ? "Chờ bảo chứng di sản" : "Đã xuất bản toàn bộ"}
            </div>
          </div>

          {/* Card 3: KYC Chờ Duyệt */}
          <div
            onClick={() => setActiveTab("KYC")}
            className={`cursor-pointer p-4 rounded-2xl transition-all shadow-xs border ${
              activeTab === "KYC"
                ? "bg-[#292724] text-white border-[#292724]"
                : "bg-white hover:bg-[#f7f3ec] border-[#ccc5bc]/30 text-[#1c1c18]"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className={`text-[10px] uppercase font-bold tracking-wider ${activeTab === "KYC" ? "text-[#d8e3ce]" : "text-[#7b766f]"}`}>
                KYC CẦN DUYỆT
              </span>
              <span className="material-symbols-outlined text-[20px] text-[#576151]">
                fingerprint
              </span>
            </div>
            <div className="font-serif text-2xl font-bold">
              {kycList.length}
            </div>
            <div className={`text-xs mt-1 ${activeTab === "KYC" ? "text-[#ccc5bc]" : "text-[#ba1a1a]"} font-medium`}>
              {kycList.length > 0 ? "Hồ sơ CCCD đang chờ đối soát" : "Toàn bộ đã xác thực"}
            </div>
          </div>

          {/* Card 4: Tranh Chấp */}
          <Link
            to="/admin/disputes"
            className="p-4 rounded-2xl bg-white hover:bg-[#f7f3ec] transition-all shadow-xs border border-[#ccc5bc]/30 text-[#1c1c18] flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#7b766f]">
                TRANH CHẤP ĐƠN
              </span>
              <span className="material-symbols-outlined text-[20px] text-[#ba1a1a]">
                balance
              </span>
            </div>
            <div className="font-serif text-2xl font-bold">
              {disputeList.length}
            </div>
            <div className="text-xs text-[#7b766f] font-medium mt-1">
              {metrics.lockedEscrowAmount > 0
                ? `Đang khóa ${metrics.lockedEscrowAmount.toLocaleString("vi-VN")} ₫ cọc`
                : "Sổ cái lưu ký an toàn"}
            </div>
          </Link>
        </section>

        {/* TAB CONTROLS (TẤT CẢ / RENT / THRIFT / KYC) */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#ccc5bc]/30 pb-4">
            <div className="flex items-center gap-2 p-1 bg-[#f1ede6] rounded-xl">
              <button
                type="button"
                onClick={() => setActiveTab("ALL")}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === "ALL"
                    ? "bg-[#1c1c18] text-white shadow-xs"
                    : "text-[#4a463f] hover:text-[#1c1c18]"
                }`}
              >
                Tất Cả Hàng Chờ ({totalPendingQueue})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("RENT")}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  activeTab === "RENT"
                    ? "bg-[#1c1c18] text-white shadow-xs"
                    : "text-[#4a463f] hover:text-[#1c1c18]"
                }`}
              >
                <span>Sản Phẩm RENT</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${activeTab === "RENT" ? "bg-white/20 text-white" : "bg-[#ccc5bc]/40 text-[#4a463f]"}`}>
                  {rentApprovalList.length}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("THRIFT")}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  activeTab === "THRIFT"
                    ? "bg-[#1c1c18] text-white shadow-xs"
                    : "text-[#4a463f] hover:text-[#1c1c18]"
                }`}
              >
                <span>Mục Đăng THRIFT</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${activeTab === "THRIFT" ? "bg-white/20 text-white" : "bg-[#ccc5bc]/40 text-[#4a463f]"}`}>
                  {thriftApprovalList.length}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("KYC")}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  activeTab === "KYC"
                    ? "bg-[#1c1c18] text-white shadow-xs"
                    : "text-[#4a463f] hover:text-[#1c1c18]"
                }`}
              >
                <span>Hồ Sơ KYC</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${activeTab === "KYC" ? "bg-[#ba1a1a] text-white" : "bg-[#ffdad6] text-[#ba1a1a]"}`}>
                  {kycList.length}
                </span>
              </button>
            </div>

            <div className="text-xs text-[#7b766f]">
              Thao tác duyệt hoặc từ chối sẽ loại ngay item khỏi hàng chờ và đồng bộ tức thì.
            </div>
          </div>

          {/* QUEUE 1: RENT LISTINGS PENDING */}
          {(activeTab === "ALL" || activeTab === "RENT") && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#7b5227]"></span>
                  <h2 className="text-lg sm:text-xl font-serif font-bold text-[#1c1c18]">
                    Hàng Chờ Duyệt Sản Phẩm RENT ({rentApprovalList.length})
                  </h2>
                </div>
                <span className="text-xs text-[#7b766f]">
                  Tiêu chuẩn: Tình trạng đạt từ GOOD trở lên, ảnh rõ tem mác
                </span>
              </div>

              {rentApprovalList.length === 0 ? (
                <div className="p-8 bg-white rounded-2xl border border-dashed border-[#ccc5bc]/50 text-center space-y-2 shadow-xs">
                  <span className="material-symbols-outlined text-[#576151] text-[36px] mx-auto block">
                    check_circle
                  </span>
                  <p className="text-sm font-semibold text-[#1c1c18]">
                    Không có sản phẩm RENT nào đang chờ duyệt
                  </p>
                  <p className="text-xs text-[#7b766f] max-w-md mx-auto">
                    Toàn bộ trang phục cho thuê đã được giám định và gắn mã kiểm định lưu ký trên hệ thống.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {rentApprovalList.map((item) => (
                    <div
                      key={item.id}
                      className="bg-white rounded-2xl p-5 shadow-xs border border-[#ccc5bc]/30 hover:border-[#7b5227]/40 transition-all space-y-4 flex flex-col justify-between"
                    >
                      <div className="flex gap-4">
                        {/* Thumbnail */}
                        <div
                          onClick={() => setZoomImageUrl(item.images[0])}
                          className="w-28 h-28 rounded-xl overflow-hidden bg-[#f1ede6] shrink-0 cursor-zoom-in relative group"
                        >
                          <img
                            src={item.images[0]}
                            alt={item.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="material-symbols-outlined text-white text-[20px]">
                              zoom_in
                            </span>
                          </div>
                        </div>

                        {/* Info */}
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-full bg-[#f1ede6] text-[#7b5227] text-[10px] font-bold uppercase">
                              {item.categoryName}
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-[#d8e3ce] text-[#576151] text-[10px] font-bold">
                              {item.condition}
                            </span>
                          </div>

                          <h3 className="font-serif text-base font-bold text-[#1c1c18] leading-tight line-clamp-1">
                            {item.name}
                          </h3>

                          <div className="text-xs text-[#7b766f] flex items-center gap-1 line-clamp-1">
                            <span className="material-symbols-outlined text-[14px]">
                              storefront
                            </span>
                            <span>{item.ownerName}</span>
                          </div>

                          <div className="flex items-baseline gap-2 pt-1">
                            <span className="font-bold text-[#1c1c18] text-sm">
                              {item.pricePerDay.toLocaleString("vi-VN")} ₫
                            </span>
                            <span className="text-[11px] text-[#7b766f]">/ ngày</span>
                            <span className="text-[#ccc5bc]">•</span>
                            <span className="text-[11px] text-[#576151] font-semibold">
                              Cọc: {item.depositAmount.toLocaleString("vi-VN")} ₫
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Action Bar */}
                      <div className="pt-3 border-t border-[#f1ede6] flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedRentItem(item)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#4a463f] hover:bg-[#f1ede6] transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[16px]">
                            visibility
                          </span>
                          <span>Chi Tiết</span>
                        </button>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openRejectModal("RENT", item.id, item.name)}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#ba1a1a] hover:bg-[#ffdad6]/40 transition-colors border border-[#ba1a1a]/30 cursor-pointer"
                          >
                            Từ Chối
                          </button>
                          <button
                            type="button"
                            onClick={() => handleApproveRent(item)}
                            className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-[#292724] text-white hover:bg-[#1c1c18] transition-colors shadow-xs flex items-center gap-1 cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[16px]">
                              check
                            </span>
                            <span>Duyệt</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* QUEUE 2: THRIFT LISTINGS PENDING */}
          {(activeTab === "ALL" || activeTab === "THRIFT") && (
            <div className="space-y-4 pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#7b5227]"></span>
                  <h2 className="text-lg sm:text-xl font-serif font-bold text-[#1c1c18]">
                    Hàng Chờ Bảo Chứng THRIFT ({thriftApprovalList.length})
                  </h2>
                </div>
                <span className="text-xs text-[#7b766f]">
                  Tiêu chuẩn: Nguồn gốc minh bạch, kiểm định vi vết đạt chuẩn tái sử dụng
                </span>
              </div>

              {thriftApprovalList.length === 0 ? (
                <div className="p-8 bg-white rounded-2xl border border-dashed border-[#ccc5bc]/50 text-center space-y-2 shadow-xs">
                  <span className="material-symbols-outlined text-[#576151] text-[36px] mx-auto block">
                    check_circle
                  </span>
                  <p className="text-sm font-semibold text-[#1c1c18]">
                    Không có mục đăng THRIFT nào đang chờ duyệt
                  </p>
                  <p className="text-xs text-[#7b766f] max-w-md mx-auto">
                    Tất cả sản phẩm thanh lý ký gửi đã được bảo chứng và xuất bản trên sàn di sản ReUse Hub.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {thriftApprovalList.map((item) => (
                    <div
                      key={item.id}
                      className="bg-white rounded-2xl p-5 shadow-xs border border-[#ccc5bc]/30 hover:border-[#7b5227]/40 transition-all space-y-4 flex flex-col justify-between"
                    >
                      <div className="flex gap-4">
                        {/* Thumbnail */}
                        <div
                          onClick={() => setZoomImageUrl(item.images[0])}
                          className="w-28 h-28 rounded-xl overflow-hidden bg-[#f1ede6] shrink-0 cursor-zoom-in relative group"
                        >
                          <img
                            src={item.images[0]}
                            alt={item.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="material-symbols-outlined text-white text-[20px]">
                              zoom_in
                            </span>
                          </div>
                        </div>

                        {/* Info */}
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-full bg-[#f0e0cb] text-[#7b5227] text-[10px] font-bold uppercase">
                              {item.categoryName}
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-[#f1ede6] text-[#4a463f] text-[10px] font-bold">
                              {item.condition}
                            </span>
                          </div>

                          <h3 className="font-serif text-base font-bold text-[#1c1c18] leading-tight line-clamp-1">
                            {item.name}
                          </h3>

                          <div className="text-xs text-[#7b766f] flex items-center gap-1 line-clamp-1">
                            <span className="material-symbols-outlined text-[14px]">
                              person
                            </span>
                            <span>{item.sellerName}</span>
                          </div>

                          <div className="flex items-baseline gap-2 pt-1">
                            <span className="font-bold text-[#1c1c18] text-sm">
                              {item.price.toLocaleString("vi-VN")} ₫
                            </span>
                            <span className="text-[#ccc5bc]">•</span>
                            <span className="text-[11px] text-[#7b5227] font-semibold truncate">
                              {item.source}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Action Bar */}
                      <div className="pt-3 border-t border-[#f1ede6] flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedThriftItem(item)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#4a463f] hover:bg-[#f1ede6] transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[16px]">
                            visibility
                          </span>
                          <span>Chi Tiết</span>
                        </button>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openRejectModal("THRIFT", item.id, item.name)}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#ba1a1a] hover:bg-[#ffdad6]/40 transition-colors border border-[#ba1a1a]/30 cursor-pointer"
                          >
                            Từ Chối
                          </button>
                          <button
                            type="button"
                            onClick={() => handleApproveThrift(item)}
                            className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-[#7b5227] text-white hover:bg-[#673d14] transition-colors shadow-xs flex items-center gap-1 cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[16px]">
                              check
                            </span>
                            <span>Bảo Chứng & Duyệt</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* QUEUE 3: KYC APPLICANTS PENDING */}
          {(activeTab === "ALL" || activeTab === "KYC") && (
            <div className="space-y-4 pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#576151]"></span>
                  <h2 className="text-lg sm:text-xl font-serif font-bold text-[#1c1c18]">
                    Hàng Chờ Xác Thực Danh Tính (KYC) ({kycList.length})
                  </h2>
                </div>
                <span className="text-xs text-[#7b766f]">
                  Đối soát CCCD gắn chip phục vụ giao dịch thuê trang phục giá trị cao
                </span>
              </div>

              {kycList.length === 0 ? (
                <div className="p-8 bg-white rounded-2xl border border-dashed border-[#ccc5bc]/50 text-center space-y-2 shadow-xs">
                  <span className="material-symbols-outlined text-[#576151] text-[36px] mx-auto block">
                    verified
                  </span>
                  <p className="text-sm font-semibold text-[#1c1c18]">
                    Không có hồ sơ KYC nào đang chờ duyệt
                  </p>
                  <p className="text-xs text-[#7b766f] max-w-md mx-auto">
                    Toàn bộ hồ sơ thành viên đã được phê duyệt hợp lệ và cấp hạn mức thuê đồ an toàn.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {kycList.map((cand) => (
                    <div
                      key={cand.id}
                      className="bg-white rounded-2xl p-5 shadow-xs border border-[#ccc5bc]/30 hover:border-[#576151]/40 transition-all space-y-4 flex flex-col justify-between"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-full bg-[#d8e3ce] text-[#5b6655] flex items-center justify-center font-bold text-sm shrink-0">
                              {cand.initials}
                            </div>
                            <div>
                              <h3 className="font-serif text-base font-bold text-[#1c1c18]">
                                {cand.fullName}
                              </h3>
                              <p className="text-xs text-[#7b766f]">{cand.email}</p>
                            </div>
                          </div>
                          <span className="px-2.5 py-1 rounded-full bg-[#ffdad6] text-[#ba1a1a] text-[10px] font-bold uppercase tracking-wide">
                            PENDING KYC
                          </span>
                        </div>

                        {/* ID & Document Info */}
                        <div className="p-3 bg-[#f7f3ec] rounded-xl text-xs space-y-1.5">
                          <div className="flex justify-between">
                            <span className="text-[#7b766f]">Số CCCD khai báo:</span>
                            <span className="font-mono font-bold text-[#1c1c18]">
                              {cand.idCardNumber || "079201008888"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[#7b766f]">Số điện thoại:</span>
                            <span className="font-semibold text-[#1c1c18]">
                              {cand.phoneNumber || "0901234567"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[#7b766f]">Phân hạng:</span>
                            <span className="font-bold text-[#576151]">{cand.tier}</span>
                          </div>
                        </div>

                        {/* Preview of Front & Back CCCD images */}
                        {(cand.frontImageUrl || cand.backImageUrl) && (
                          <div className="space-y-1.5">
                            <span className="text-[11px] font-semibold text-[#7b766f]">
                              Ảnh Căn cước công dân (Click để phóng to):
                            </span>
                            <div className="grid grid-cols-2 gap-2">
                              {cand.frontImageUrl && (
                                <div
                                  onClick={() => setZoomImageUrl(cand.frontImageUrl || null)}
                                  className="h-20 rounded-lg overflow-hidden bg-[#f1ede6] border border-[#ccc5bc]/40 cursor-zoom-in relative group"
                                >
                                  <img
                                    src={cand.frontImageUrl}
                                    alt="Mặt trước CCCD"
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                  />
                                  <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/60 text-white text-[9px] font-medium">
                                    Mặt trước
                                  </span>
                                </div>
                              )}
                              {cand.backImageUrl && (
                                <div
                                  onClick={() => setZoomImageUrl(cand.backImageUrl || null)}
                                  className="h-20 rounded-lg overflow-hidden bg-[#f1ede6] border border-[#ccc5bc]/40 cursor-zoom-in relative group"
                                >
                                  <img
                                    src={cand.backImageUrl}
                                    alt="Mặt sau CCCD"
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                  />
                                  <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/60 text-white text-[9px] font-medium">
                                    Mặt sau
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Action Bar */}
                      <div className="pt-3 border-t border-[#f1ede6] flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedKycItem(cand)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#4a463f] hover:bg-[#f1ede6] transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[16px]">
                            badge
                          </span>
                          <span>Xem Hồ Sơ & CCCD</span>
                        </button>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openRejectModal("KYC", cand.id, cand.fullName)}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#ba1a1a] hover:bg-[#ffdad6]/40 transition-colors border border-[#ba1a1a]/30 cursor-pointer"
                          >
                            Từ Chối
                          </button>
                          <button
                            type="button"
                            onClick={() => handleApproveKyc(cand)}
                            className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-[#576151] text-white hover:bg-[#3f4a3a] transition-colors shadow-xs flex items-center gap-1 cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[16px]">
                              verified
                            </span>
                            <span>Duyệt KYC</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>

        {/* SECTION: PLATFORM CATALOG PREVIEW */}
        <section className="space-y-4 pt-6 border-t border-[#ccc5bc]/20">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#1c1c18]">
                Sản Phẩm Đã Được Bảo Chứng Trên Sàn
              </h2>
              <p className="text-xs text-[#7b766f]">
                Các danh mục RENT và THRIFT đã qua kiểm duyệt và đang phục vụ khách hàng.
              </p>
            </div>
            <Link
              to="/admin/users"
              className="text-xs font-semibold text-[#7b5227] hover:underline"
            >
              Quản lý thành viên ({metrics.totalUsers}) →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Rent Showcase */}
            {rentCatalog.length > 0 && (
              <div className="p-4 bg-white rounded-2xl border border-[#ccc5bc]/30 flex items-center gap-4">
                <img
                  src={rentCatalog[0].images[0]}
                  alt={rentCatalog[0].name}
                  className="w-16 h-16 rounded-xl object-cover shrink-0"
                />
                <div className="min-w-0">
                  <span className="text-[10px] font-bold text-[#576151] uppercase">
                    RENT • {rentCatalog[0].categoryName}
                  </span>
                  <h4 className="font-serif text-sm font-bold text-[#1c1c18] truncate">
                    {rentCatalog[0].name}
                  </h4>
                  <p className="text-xs font-semibold text-[#1c1c18]">
                    {rentCatalog[0].pricePerDay.toLocaleString("vi-VN")} ₫ / ngày
                  </p>
                </div>
              </div>
            )}

            {/* Thrift Showcase */}
            {thriftCatalog.length > 0 && (
              <div className="p-4 bg-white rounded-2xl border border-[#ccc5bc]/30 flex items-center gap-4">
                <img
                  src={thriftCatalog[0].images[0]}
                  alt={thriftCatalog[0].name}
                  className="w-16 h-16 rounded-xl object-cover shrink-0"
                />
                <div className="min-w-0">
                  <span className="text-[10px] font-bold text-[#7b5227] uppercase">
                    THRIFT • {thriftCatalog[0].categoryName}
                  </span>
                  <h4 className="font-serif text-sm font-bold text-[#1c1c18] truncate">
                    {thriftCatalog[0].name}
                  </h4>
                  <p className="text-xs font-semibold text-[#1c1c18]">
                    {thriftCatalog[0].price.toLocaleString("vi-VN")} ₫
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* ===================================================================== */}
      {/* MODAL 1: XEM CHI TIẾT SẢN PHẨM RENT */}
      {/* ===================================================================== */}
      {selectedRentItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-[#ccc5bc]/50 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-[#f1ede6] pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#576151]">
                  Giám Định Chi Tiết Trang Phục Cho Thuê
                </span>
                <h3 className="font-serif text-lg font-bold text-[#1c1c18]">
                  {selectedRentItem.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRentItem(null)}
                className="text-[#7b766f] hover:text-[#1c1c18] p-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="space-y-4">
              <div
                onClick={() => setZoomImageUrl(selectedRentItem.images[0])}
                className="h-52 rounded-xl overflow-hidden bg-[#f1ede6] cursor-zoom-in relative group"
              >
                <img
                  src={selectedRentItem.images[0]}
                  alt={selectedRentItem.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
                <span className="absolute bottom-2 right-2 px-2 py-1 rounded bg-black/60 text-white text-[10px] flex items-center gap-1 font-medium">
                  <span className="material-symbols-outlined text-[14px]">zoom_in</span>
                  <span>Phóng to</span>
                </span>
              </div>

              {selectedRentItem.description && (
                <div className="text-xs text-[#4a463f] bg-[#f7f3ec] p-3 rounded-xl leading-relaxed">
                  <span className="font-bold text-[#1c1c18] block mb-1">Mô tả sản phẩm:</span>
                  {selectedRentItem.description}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 text-xs bg-[#f7f3ec] p-3 rounded-xl">
                <div>
                  <span className="text-[#7b766f] block">Chủ sở hữu / Shop:</span>
                  <span className="font-semibold text-[#1c1c18]">
                    {selectedRentItem.ownerName}
                  </span>
                </div>
                <div>
                  <span className="text-[#7b766f] block">Giá thuê niêm yết:</span>
                  <span className="font-semibold text-[#1c1c18]">
                    {selectedRentItem.pricePerDay.toLocaleString("vi-VN")} ₫ / ngày
                  </span>
                </div>
                <div>
                  <span className="text-[#7b766f] block">Tiền ký quỹ lưu ký:</span>
                  <span className="font-semibold text-[#1c1c18]">
                    {selectedRentItem.depositAmount.toLocaleString("vi-VN")} ₫
                  </span>
                </div>
                <div>
                  <span className="text-[#7b766f] block">Tình trạng vật lý:</span>
                  <span className="font-semibold text-[#576151]">
                    {selectedRentItem.condition} (Đạt chuẩn ReUse)
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="text-[#7b766f] block">Kho / Địa chỉ xuất kho:</span>
                  <span className="font-semibold text-[#1c1c18]">
                    {selectedRentItem.location}
                  </span>
                </div>
              </div>

              {selectedRentItem.rentalRules && (
                <div className="text-xs text-[#7b5227] bg-[#fbf5ee] p-3 rounded-xl border border-[#f0e0cb]">
                  <span className="font-bold block mb-0.5">Quy định thuê từ Shop:</span>
                  {selectedRentItem.rentalRules}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#f1ede6]">
              <button
                type="button"
                onClick={() => setSelectedRentItem(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#4a463f] hover:bg-[#f1ede6] transition-colors cursor-pointer"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={() => openRejectModal("RENT", selectedRentItem.id, selectedRentItem.name)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#ba1a1a] hover:bg-[#ffdad6]/40 transition-colors border border-[#ba1a1a]/40 cursor-pointer"
              >
                Từ Chối Niêm Yết
              </button>
              <button
                type="button"
                onClick={() => handleApproveRent(selectedRentItem)}
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-[#292724] text-white hover:bg-[#1c1c18] transition-colors shadow-sm cursor-pointer"
              >
                Phê Duyệt & Cấp Tem
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 2: XEM CHI TIẾT MỤC ĐĂNG THRIFT */}
      {/* ===================================================================== */}
      {selectedThriftItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-[#ccc5bc]/50 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-[#f1ede6] pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#7b5227]">
                  Giám Định Nguồn Gốc Di Sản THRIFT
                </span>
                <h3 className="font-serif text-lg font-bold text-[#1c1c18]">
                  {selectedThriftItem.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedThriftItem(null)}
                className="text-[#7b766f] hover:text-[#1c1c18] p-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="space-y-4">
              <div
                onClick={() => setZoomImageUrl(selectedThriftItem.images[0])}
                className="h-52 rounded-xl overflow-hidden bg-[#f1ede6] cursor-zoom-in relative group"
              >
                <img
                  src={selectedThriftItem.images[0]}
                  alt={selectedThriftItem.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
                <span className="absolute bottom-2 right-2 px-2 py-1 rounded bg-black/60 text-white text-[10px] flex items-center gap-1 font-medium">
                  <span className="material-symbols-outlined text-[14px]">zoom_in</span>
                  <span>Phóng to</span>
                </span>
              </div>

              {selectedThriftItem.description && (
                <div className="text-xs text-[#4a463f] bg-[#f7f3ec] p-3 rounded-xl leading-relaxed">
                  <span className="font-bold text-[#1c1c18] block mb-1">Mô tả chi tiết:</span>
                  {selectedThriftItem.description}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 text-xs bg-[#f7f3ec] p-3 rounded-xl">
                <div>
                  <span className="text-[#7b766f] block">Chủ sở hữu / Ký gửi:</span>
                  <span className="font-semibold text-[#1c1c18]">
                    {selectedThriftItem.sellerName}
                  </span>
                </div>
                <div>
                  <span className="text-[#7b766f] block">Giá bán thanh lý:</span>
                  <span className="font-semibold text-[#1c1c18]">
                    {selectedThriftItem.price.toLocaleString("vi-VN")} ₫
                  </span>
                </div>
                <div>
                  <span className="text-[#7b766f] block">Nguồn gốc xác thực:</span>
                  <span className="font-semibold text-[#7b5227]">
                    {selectedThriftItem.source}
                  </span>
                </div>
                <div>
                  <span className="text-[#7b766f] block">Tình trạng vật lý:</span>
                  <span className="font-semibold text-[#576151]">
                    {selectedThriftItem.condition}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#f1ede6]">
              <button
                type="button"
                onClick={() => setSelectedThriftItem(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#4a463f] hover:bg-[#f1ede6] transition-colors cursor-pointer"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={() => openRejectModal("THRIFT", selectedThriftItem.id, selectedThriftItem.name)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#ba1a1a] hover:bg-[#ffdad6]/40 transition-colors border border-[#ba1a1a]/40 cursor-pointer"
              >
                Từ Chối Đăng Bán
              </button>
              <button
                type="button"
                onClick={() => handleApproveThrift(selectedThriftItem)}
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-[#7b5227] text-white hover:bg-[#673d14] transition-colors shadow-sm cursor-pointer"
              >
                Bảo Chứng & Xuất Bản
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 3: XEM CHI TIẾT HỒ SƠ KYC & ẢNH CCCD */}
      {/* ===================================================================== */}
      {selectedKycItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-[#ccc5bc]/50 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-[#f1ede6] pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#576151]">
                  Thẩm Định Hồ Sơ Xác Thực Danh Tính (KYC)
                </span>
                <h3 className="font-serif text-lg font-bold text-[#1c1c18]">
                  {selectedKycItem.fullName}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedKycItem(null)}
                className="text-[#7b766f] hover:text-[#1c1c18] p-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="space-y-4">
              {/* Profile Details */}
              <div className="p-3.5 rounded-xl bg-[#f7f3ec] space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#7b766f]">Họ và tên:</span>
                  <span className="font-bold text-[#1c1c18]">{selectedKycItem.fullName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#7b766f]">Email tài khoản:</span>
                  <span className="font-semibold text-[#1c1c18]">{selectedKycItem.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#7b766f]">Số điện thoại:</span>
                  <span className="font-semibold text-[#1c1c18]">
                    {selectedKycItem.phoneNumber || "0901234567"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#7b766f]">Số CCCD gắn chip:</span>
                  <span className="font-mono font-bold text-[#576151]">
                    {selectedKycItem.idCardNumber || "079201008888"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#7b766f]">Phân hạng chứng thư:</span>
                  <span className="font-bold text-[#1c1c18]">{selectedKycItem.tier}</span>
                </div>
              </div>

              {/* ID Card Front & Back Images */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-[#1c1c18] block">
                  Ảnh Căn cước công dân đối soát (Click phóng to):
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div
                    onClick={() => setZoomImageUrl(selectedKycItem.frontImageUrl || null)}
                    className="h-32 rounded-xl overflow-hidden bg-[#f1ede6] border border-[#ccc5bc]/50 cursor-zoom-in relative group"
                  >
                    <img
                      src={selectedKycItem.frontImageUrl || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80"}
                      alt="CCCD Mặt trước"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="material-symbols-outlined text-white text-[20px]">zoom_in</span>
                    </div>
                    <span className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded bg-black/70 text-white text-[10px] font-semibold">
                      Mặt trước
                    </span>
                  </div>

                  <div
                    onClick={() => setZoomImageUrl(selectedKycItem.backImageUrl || null)}
                    className="h-32 rounded-xl overflow-hidden bg-[#f1ede6] border border-[#ccc5bc]/50 cursor-zoom-in relative group"
                  >
                    <img
                      src={selectedKycItem.backImageUrl || "https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&w=600&q=80"}
                      alt="CCCD Mặt sau"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="material-symbols-outlined text-white text-[20px]">zoom_in</span>
                    </div>
                    <span className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded bg-black/70 text-white text-[10px] font-semibold">
                      Mặt sau
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-[#fbf5ee] rounded-xl text-[11px] text-[#7b5227] border border-[#f0e0cb]">
                Lưu ý: Đối soát kỹ số thẻ, họ tên và chip điện tử. Phê duyệt KYC chỉ cấp quyền thuê đồ, không cấp quyền Shop Owner.
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#f1ede6]">
              <button
                type="button"
                onClick={() => setSelectedKycItem(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#4a463f] hover:bg-[#f1ede6] transition-colors cursor-pointer"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={() => openRejectModal("KYC", selectedKycItem.id, selectedKycItem.fullName)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#ba1a1a] hover:bg-[#ffdad6]/40 transition-colors border border-[#ba1a1a]/40 cursor-pointer"
              >
                Từ Chối Hồ Sơ
              </button>
              <button
                type="button"
                onClick={() => handleApproveKyc(selectedKycItem)}
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-[#576151] text-white hover:bg-[#3f4a3a] transition-colors shadow-sm cursor-pointer"
              >
                Phê Duyệt KYC
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 4: XỬ LÝ TRANH CHẤP ĐƠN HÀNG */}
      {/* ===================================================================== */}
      {selectedDisputeItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-[#ccc5bc]/50">
            <div className="flex items-start justify-between border-b border-[#f1ede6] pb-3">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#ba1a1a]">
                  Hồ Sơ Trọng Tài {selectedDisputeItem.code}
                </span>
                <h3 className="font-serif text-lg font-bold text-[#1c1c18]">
                  {selectedDisputeItem.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDisputeItem(null)}
                className="text-[#7b766f] hover:text-[#1c1c18] p-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="space-y-3 text-xs bg-[#f7f3ec] p-4 rounded-xl">
              <div className="flex justify-between">
                <span className="text-[#7b766f]">Khách hàng khiếu nại:</span>
                <span className="font-semibold text-[#1c1c18]">{selectedDisputeItem.renterName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#7b766f]">Tiền ký quỹ tạm khóa:</span>
                <span className="font-bold text-[#ba1a1a]">
                  {selectedDisputeItem.escrowLocked.toLocaleString("vi-VN")} ₫
                </span>
              </div>
              <div className="pt-2 border-t border-[#ccc5bc]/20">
                <span className="text-[#7b766f] block mb-1">Nội dung đối soát:</span>
                <p className="text-[#1c1c18] font-medium leading-relaxed">
                  {selectedDisputeItem.reason}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#f1ede6]">
              <button
                type="button"
                onClick={() => setSelectedDisputeItem(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#4a463f] hover:bg-[#f1ede6] transition-colors cursor-pointer"
              >
                Đóng
              </button>
              <Link
                to="/admin/disputes"
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-[#ba1a1a] text-white hover:bg-[#93000a] transition-colors shadow-sm"
              >
                Chuyển Đến Trang Trọng Tài
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 5: NHẬP LÝ DO TỪ CHỐI (REJECT REASON MODAL) */}
      {/* ===================================================================== */}
      {rejectModal.isOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-[#ba1a1a]/30">
            <div className="flex items-start justify-between border-b border-[#f1ede6] pb-3">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-[#ffdad6] text-[#ba1a1a] flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[18px]">gavel</span>
                </span>
                <div>
                  <h3 className="font-serif text-base font-bold text-[#1c1c18]">
                    Lý Do Từ Chối {rejectModal.type}
                  </h3>
                  <p className="text-[11px] text-[#7b766f] truncate max-w-xs">
                    {rejectModal.targetName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeRejectModal}
                className="text-[#7b766f] hover:text-[#1c1c18] p-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#1c1c18] block">
                  Nhập lý do từ chối cụ thể <span className="text-[#ba1a1a]">*</span>
                </label>
                <textarea
                  rows={3}
                  value={rejectModal.reason}
                  onChange={(e) =>
                    setRejectModal((prev) => ({
                      ...prev,
                      reason: e.target.value,
                      error: undefined,
                    }))
                  }
                  placeholder="Ví dụ: Hình ảnh chụp bị mờ tem mác, yêu cầu bổ sung ảnh chụp rõ nét..."
                  className="w-full text-xs p-3 rounded-xl border border-[#ccc5bc]/60 focus:outline-none focus:border-[#ba1a1a] transition-colors resize-none leading-relaxed"
                />
                {rejectModal.error && (
                  <p className="text-[11px] text-[#ba1a1a] font-semibold">
                    {rejectModal.error}
                  </p>
                )}
              </div>

              {/* Quick Presets */}
              <div className="space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-[#7b766f] block">
                  Gợi ý lý do chuẩn (Click để áp dụng):
                </span>
                <div className="space-y-1">
                  {quickReasonPresets.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() =>
                        setRejectModal((prev) => ({
                          ...prev,
                          reason: preset,
                          error: undefined,
                        }))
                      }
                      className="w-full text-left p-2 rounded-lg bg-[#f7f3ec] hover:bg-[#f1ede6] text-[11px] text-[#4a463f] hover:text-[#1c1c18] transition-colors border border-[#ccc5bc]/20 truncate block cursor-pointer"
                    >
                      • {preset}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#f1ede6]">
              <button
                type="button"
                onClick={closeRejectModal}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#4a463f] hover:bg-[#f1ede6] transition-colors cursor-pointer"
              >
                Hủy Bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-[#ba1a1a] text-white hover:bg-[#93000a] transition-colors shadow-sm cursor-pointer"
              >
                Xác Nhận Từ Chối
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* LIGHTBOX: PHÓNG TO ẢNH (ZOOM IMAGE MODAL) */}
      {/* ===================================================================== */}
      {zoomImageUrl && (
        <div
          onClick={() => setZoomImageUrl(null)}
          className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in cursor-zoom-out"
        >
          <div className="relative max-w-4xl max-h-[90vh] rounded-2xl overflow-hidden shadow-2xl">
            <img
              src={zoomImageUrl}
              alt="Phóng to"
              className="w-full h-full object-contain max-h-[85vh]"
            />
            <button
              type="button"
              onClick={() => setZoomImageUrl(null)}
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-black transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
