import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchAdminDashboardData } from "../../services/admin.api";
import type {
  AdminDashboardData,
  RentListingItem,
  ThriftListingItem,
  KycApplicantItem,
  DisputeItem,
} from "../../services/admin.api";

export const Dashboard: React.FC = () => {
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);


  // Modal inspection states
  const [selectedRentItem, setSelectedRentItem] = useState<RentListingItem | null>(null);
  const [selectedThriftItem, setSelectedThriftItem] = useState<ThriftListingItem | null>(null);
  const [selectedKycItem, setSelectedKycItem] = useState<KycApplicantItem | null>(null);
  const [selectedDisputeItem, setSelectedDisputeItem] = useState<DisputeItem | null>(null);

  // Notification Toast state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
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

  const handleApproveRent = (id: string, name: string) => {
    if (data) {
      const updatedList = data.rentApprovalList.filter((item) => item.id !== id);
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
    showToast(`Đã phê duyệt niêm yết RENT: "${name}" thành công!`);
  };

  const handleApproveThrift = (id: string, name: string) => {
    if (data) {
      const updatedList = data.thriftApprovalList.filter((item) => item.id !== id);
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
    showToast(`Đã bảo chứng và duyệt mục đăng THRIFT: "${name}"!`);
  };

  const handleApproveKyc = (id: string, name: string) => {
    if (data) {
      const updatedApplicants = data.kycApplicants.filter((item) => item.id !== id);
      setData({
        ...data,
        kycApplicants: updatedApplicants,
        metrics: {
          ...data.metrics,
          pendingKycCount: Math.max(0, data.metrics.pendingKycCount - 1),
        },
      });
    }
    setSelectedKycItem(null);
    showToast(`Đã xác thực định danh (KYC) cho đối tác: "${name}"!`);
  };

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

  const rentCatalog = data?.rentCatalogList || [];
  const thriftCatalog = data?.thriftCatalogList || [];
  const kycList = data?.kycApplicants || [];
  const disputeList = data?.disputes || [];
  const activityList = data?.activities || [];

  return (
    <div className="flex flex-col w-full bg-[#fdf9f2]">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#292724] text-[#fdf9f2] px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-[#ccc5bc]/40 animate-fade-in">
          <span className="material-symbols-outlined text-[#d8e3ce] text-[20px]">
            check_circle
          </span>
          <span className="text-xs font-medium">{toastMessage}</span>
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
              Bảng Điều Khiển Trung Tâm
            </span>
          </nav>

          {/* System status chip */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#f1ede6] text-[#1c1c18] text-[11px] shadow-xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#576151] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#576151]"></span>
            </span>
            <span className="text-[#4a463f] uppercase tracking-wider font-semibold">
              Hệ thống bảo mật V4.2
            </span>
            <span className="text-[#ccc5bc]">•</span>
            <span className="text-[#576151] font-semibold">
              {loading
                ? "Đang kết nối & đồng bộ dữ liệu MongoDB..."
                : "Đang đồng bộ sổ cái Escrow thời gian thực"}
            </span>
          </div>
        </div>
      </section>

      {/* MAIN EDITORIAL DASHBOARD CONTAINER */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-12 py-10 space-y-12">
        {/* WELCOME HEADER & QUICK ROUTING PILL BAR */}
        <header className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2">
            <div className="space-y-2 max-w-3xl">
              <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-wider text-[#7b5227] font-semibold">
                <span className="material-symbols-outlined text-[15px]">
                  verified_user
                </span>
                <span>CHỨNG THỰC B-CORP & GIÁM ĐỊNH LƯU KÝ</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#1c1c18] font-serif tracking-tight">
                ReUse Hub Administration
              </h1>
              <p className="text-sm sm:text-base text-[#4a463f]">
                Quản lý người dùng, kiểm duyệt sản phẩm và theo dõi hoạt động toàn nền tảng.
              </p>
            </div>

            {/* Quick metadata status badge */}
            <div className="flex items-center gap-3 bg-[#f1ede6] px-4 py-2.5 rounded-xl shadow-xs self-start md:self-auto">
              <div className="text-right">
                <div className="text-[10px] uppercase text-[#7b766f] tracking-wider font-semibold">
                  Phiên Làm Việc
                </div>
                <div className="text-xs font-semibold text-[#1c1c18]">
                  Node ID #ADM-7740
                </div>
              </div>
              <div className="w-8 h-8 rounded-full bg-[#d8e3ce] text-[#5b6655] flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">lock</span>
              </div>
            </div>
          </div>

          {/* Quick Routing Pill Bar (7 key actions) */}
          <div className="bg-[#f7f3ec] p-2 rounded-2xl shadow-xs">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5 scrollbar-none">
              {/* Duyệt Đơn RENT */}
              <Link
                to="/admin/rent/listings"
                className="group flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white text-[#1c1c18] hover:bg-[#292724] hover:text-white transition-all shadow-xs whitespace-nowrap"
              >
                <span className="material-symbols-outlined text-[17px] text-[#292724] group-hover:text-white transition-colors">
                  camera
                </span>
                <span className="text-xs font-medium">Duyệt Đơn RENT</span>
                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-[#e7e1dd] text-[#494643] text-[10px] font-bold group-hover:bg-white group-hover:text-[#292724]">
                  {metrics.pendingRentListingsCount}
                </span>
              </Link>

              {/* Duyệt Đơn THRIFT */}
              <Link
                to="/admin/thrift/listings"
                className="group flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white text-[#1c1c18] hover:bg-[#292724] hover:text-white transition-all shadow-xs whitespace-nowrap"
              >
                <span className="material-symbols-outlined text-[17px] text-[#7b5227] group-hover:text-white transition-colors">
                  watch
                </span>
                <span className="text-xs font-medium">Duyệt Đơn THRIFT</span>
                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-[#f0e0cb] text-[#4f4535] text-[10px] font-bold group-hover:bg-white group-hover:text-[#292724]">
                  {metrics.pendingThriftListingsCount}
                </span>
              </Link>

              {/* Xét Duyệt KYC */}
              <Link
                to="/admin/kyc"
                className="group flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white text-[#1c1c18] hover:bg-[#292724] hover:text-white transition-all shadow-xs whitespace-nowrap"
              >
                <span className="material-symbols-outlined text-[17px] text-[#576151] group-hover:text-white transition-colors">
                  badge
                </span>
                <span className="text-xs font-medium">Xét Duyệt KYC</span>
                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-[#d8e3ce] text-[#5b6655] text-[10px] font-bold group-hover:bg-white group-hover:text-[#292724]">
                  {metrics.pendingKycCount}
                </span>
              </Link>

              {/* Quản Lý Người Dùng */}
              <Link
                to="/admin/users"
                className="group flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white text-[#1c1c18] hover:bg-[#292724] hover:text-white transition-all shadow-xs whitespace-nowrap"
              >
                <span className="material-symbols-outlined text-[17px] text-[#4a463f] group-hover:text-white transition-colors">
                  group
                </span>
                <span className="text-xs font-medium">Quản Lý Người Dùng</span>
              </Link>

              {/* Quản Lý Danh Mục */}
              <Link
                to="/admin/categories"
                className="group flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white text-[#1c1c18] hover:bg-[#292724] hover:text-white transition-all shadow-xs whitespace-nowrap"
              >
                <span className="material-symbols-outlined text-[17px] text-[#4a463f] group-hover:text-white transition-colors">
                  category
                </span>
                <span className="text-xs font-medium">Quản Lý Danh Mục</span>
              </Link>

              {/* Phân Xử Tranh Chấp */}
              <Link
                to="/admin/disputes"
                className="group flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white text-[#1c1c18] hover:bg-[#292724] hover:text-white transition-all shadow-xs whitespace-nowrap"
              >
                <span className="material-symbols-outlined text-[17px] text-[#ba1a1a] group-hover:text-white transition-colors">
                  gavel
                </span>
                <span className="text-xs font-medium">Phân Xử Tranh Chấp</span>
                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-[#ffdad6] text-[#ba1a1a] text-[10px] font-bold group-hover:bg-white group-hover:text-[#292724]">
                  {metrics.openDisputesCount}
                </span>
              </Link>

              {/* Tài Chính Toàn Sàn */}
              <Link
                to="/admin/finance"
                className="group flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white text-[#1c1c18] hover:bg-[#292724] hover:text-white transition-all shadow-xs whitespace-nowrap"
              >
                <span className="material-symbols-outlined text-[17px] text-[#292724] group-hover:text-white transition-colors">
                  account_balance_wallet
                </span>
                <span className="text-xs font-medium">Tài Chính Toàn Sàn</span>
              </Link>
            </div>
          </div>
        </header>

        {/* SECTION 3: PLATFORM OVERVIEW (6 SUMMARY METRIC CARDS) */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#1c1c18]">
              Tổng Quan Hoạt Động Nền Tảng
            </h2>
            <span className="text-[11px] uppercase tracking-wider text-[#7b766f] font-semibold">
              Chu Kỳ Cập Nhật: 60 Giây
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {/* Card 1: Tổng Người Dùng */}
            <Link
              to="/admin/users"
              className="group bg-[#f7f3ec] hover:bg-[#f1ede6] transition-all p-4 rounded-2xl shadow-xs flex flex-col justify-between space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wider text-[#7b766f] font-bold">
                  TỔNG THÀNH VIÊN
                </span>
                <span className="material-symbols-outlined text-[18px] text-[#4a463f] group-hover:translate-x-0.5 transition-transform">
                  arrow_forward
                </span>
              </div>
              <div>
                <div className="font-serif text-2xl font-bold text-[#1c1c18]">
                  {metrics.totalUsers}
                </div>
                <div className="text-xs text-[#576151] flex items-center gap-1 font-semibold mt-0.5">
                  <span className="material-symbols-outlined text-[15px]">
                    trending_up
                  </span>
                  <span>{metrics.totalUsers} thành viên MongoDB</span>
                </div>
              </div>
              <div className="text-[11px] text-[#7b766f] pt-2 border-t border-[#ccc5bc]/20">
                1 Shop Owner, 2 Admin, 8 Users
              </div>
            </Link>

            {/* Card 2: KYC Cần Duyệt */}
            <Link
              to="/admin/kyc"
              className="group bg-[#f7f3ec] hover:bg-[#f1ede6] transition-all p-4 rounded-2xl shadow-xs flex flex-col justify-between space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wider text-[#7b766f] font-bold">
                  KYC CẦN DUYỆT
                </span>
                <span className="material-symbols-outlined text-[18px] text-[#4a463f] group-hover:translate-x-0.5 transition-transform">
                  arrow_forward
                </span>
              </div>
              <div>
                <div className="font-serif text-2xl font-bold text-[#1c1c18]">
                  {metrics.pendingKycCount}
                </div>
                <div className="text-xs text-[#ba1a1a] flex items-center gap-1 font-semibold mt-0.5">
                  <span className="material-symbols-outlined text-[15px]">
                    priority_high
                  </span>
                  <span>{metrics.urgentKycCount} hồ sơ chờ duyệt</span>
                </div>
              </div>
              <div className="text-[11px] text-[#7b766f] pt-2 border-t border-[#ccc5bc]/20">
                Lê Văn C (PENDING)
              </div>
            </Link>

            {/* Card 3: RENT Chờ Duyệt */}
            <Link
              to="/admin/rent/listings"
              className="group bg-[#f7f3ec] hover:bg-[#f1ede6] transition-all p-4 rounded-2xl shadow-xs flex flex-col justify-between space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wider text-[#7b766f] font-bold">
                  RENT CHỜ DUYỆT
                </span>
                <span className="material-symbols-outlined text-[18px] text-[#4a463f] group-hover:translate-x-0.5 transition-transform">
                  arrow_forward
                </span>
              </div>
              <div>
                <div className="font-serif text-2xl font-bold text-[#1c1c18]">
                  {metrics.pendingRentListingsCount}
                </div>
                <div className="text-xs text-[#7b766f] flex items-center gap-1 font-medium mt-0.5">
                  <span className="material-symbols-outlined text-[15px]">
                    inventory_2
                  </span>
                  <span>Chưa có yêu cầu mới</span>
                </div>
              </div>
              <div className="text-[11px] text-[#7b766f] pt-2 border-t border-[#ccc5bc]/20">
                Chưa có dữ liệu
              </div>
            </Link>

            {/* Card 4: THRIFT Chờ Duyệt */}
            <Link
              to="/admin/thrift/listings"
              className="group bg-[#f7f3ec] hover:bg-[#f1ede6] transition-all p-4 rounded-2xl shadow-xs flex flex-col justify-between space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wider text-[#7b766f] font-bold">
                  THRIFT CHỜ DUYỆT
                </span>
                <span className="material-symbols-outlined text-[18px] text-[#4a463f] group-hover:translate-x-0.5 transition-transform">
                  arrow_forward
                </span>
              </div>
              <div>
                <div className="font-serif text-2xl font-bold text-[#1c1c18]">
                  {metrics.pendingThriftListingsCount}
                </div>
                <div className="text-xs text-[#7b766f] flex items-center gap-1 font-medium mt-0.5">
                  <span className="material-symbols-outlined text-[15px]">
                    watch
                  </span>
                  <span>Chưa có mục đăng mới</span>
                </div>
              </div>
              <div className="text-[11px] text-[#7b766f] pt-2 border-t border-[#ccc5bc]/20">
                Chưa có dữ liệu
              </div>
            </Link>

            {/* Card 5: Tranh Chấp Mở */}
            <Link
              to="/admin/disputes"
              className="group bg-[#f7f3ec] hover:bg-[#f1ede6] transition-all p-4 rounded-2xl shadow-xs flex flex-col justify-between space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wider text-[#7b766f] font-bold">
                  TRANH CHẤP MỞ
                </span>
                <span className="material-symbols-outlined text-[18px] text-[#4a463f] group-hover:translate-x-0.5 transition-transform">
                  arrow_forward
                </span>
              </div>
              <div>
                <div className="font-serif text-2xl font-bold text-[#1c1c18]">
                  {metrics.openDisputesCount}
                </div>
                <div className="text-xs text-[#576151] flex items-center gap-1 font-semibold mt-0.5">
                  <span className="material-symbols-outlined text-[15px]">
                    shield
                  </span>
                  <span>0 khiếu nại mở</span>
                </div>
              </div>
              <div className="text-[11px] text-[#7b766f] pt-2 border-t border-[#ccc5bc]/20">
                Sổ cái lưu ký an toàn
              </div>
            </Link>

            {/* Card 6: Doanh Thu Toàn Sàn */}
            <Link
              to="/admin/finance"
              className="group bg-[#f7f3ec] hover:bg-[#f1ede6] transition-all p-4 rounded-2xl shadow-xs flex flex-col justify-between space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wider text-[#7b766f] font-bold">
                  GIÁ TRỊ KHO HÀNG
                </span>
                <span className="material-symbols-outlined text-[18px] text-[#4a463f] group-hover:translate-x-0.5 transition-transform">
                  arrow_forward
                </span>
              </div>
              <div>
                <div className="font-serif text-2xl font-bold text-[#1c1c18] tracking-tight truncate">
                  {metrics.totalPlatformRevenue.toLocaleString("vi-VN")} ₫
                </div>
                <div className="text-xs text-[#576151] flex items-center gap-1 font-semibold mt-0.5">
                  <span className="material-symbols-outlined text-[15px]">
                    account_balance
                  </span>
                  <span>Tổng giá trị niêm yết</span>
                </div>
              </div>
              <div className="text-[11px] text-[#7b766f] pt-2 border-t border-[#ccc5bc]/20">
                Dữ liệu catalog MongoDB
              </div>
            </Link>
          </div>
        </section>

        {/* SECTION 4: APPROVAL CENTER (TRUNG TÂM KIỂM DUYỆT HỒ SƠ & HIỆN VẬT) */}
        <section className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-[#7b5227] font-semibold">
                APPROVAL QUEUE & AUDIT
              </div>
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#1c1c18]">
                Trung Tâm Kiểm Duyệt Hồ Sơ & Hiện Vật
              </h2>
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#f1ede6] text-[#4a463f] text-xs font-medium shadow-xs">
              <span className="material-symbols-outlined text-[16px] text-[#7b766f]">
                info
              </span>
              <span>
                Chưa có thông tin • Sẽ cập nhật sau
              </span>
            </div>
          </div>

          {/* Two Distinct Side-by-Side Columns */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Column A: RENT Listings cần duyệt */}
            <div className="bg-[#f7f3ec] p-6 rounded-2xl shadow-xs space-y-5 border border-[#ccc5bc]/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#7b766f]"></span>
                  <h3 className="text-base sm:text-lg text-[#1c1c18] font-serif font-bold">
                    RENT Listings Cần Duyệt
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-[#e7e1dd] text-[#7b766f] text-[10px] font-bold">
                    Chưa có thông tin
                  </span>
                </div>
              </div>

              <div className="p-8 bg-white rounded-xl border border-dashed border-[#ccc5bc]/50 text-center space-y-2 shadow-xs">
                <span className="material-symbols-outlined text-[#7b766f] text-[32px] mx-auto block">
                  inventory_2
                </span>
                <p className="text-sm font-semibold text-[#1c1c18]">
                  Chưa có thông tin
                </p>
                <p className="text-xs text-[#7b766f] max-w-sm mx-auto">
                  Hiện tại chưa có hồ sơ kiểm duyệt sản phẩm RENT nào. Thông tin này còn trống và sẽ được cập nhật sau.
                </p>
              </div>
            </div>

            {/* Column B: THRIFT Listings cần duyệt */}
            <div className="bg-[#f7f3ec] p-6 rounded-2xl shadow-xs space-y-5 border border-[#ccc5bc]/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#7b766f]"></span>
                  <h3 className="text-base sm:text-lg text-[#1c1c18] font-serif font-bold">
                    THRIFT Listings Cần Duyệt
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-[#f0e0cb] text-[#7b766f] text-[10px] font-bold">
                    Chưa có thông tin
                  </span>
                </div>
              </div>

              <div className="p-8 bg-white rounded-xl border border-dashed border-[#ccc5bc]/50 text-center space-y-2 shadow-xs">
                <span className="material-symbols-outlined text-[#7b766f] text-[32px] mx-auto block">
                  watch
                </span>
                <p className="text-sm font-semibold text-[#1c1c18]">
                  Chưa có thông tin
                </p>
                <p className="text-xs text-[#7b766f] max-w-sm mx-auto">
                  Hiện tại chưa có hồ sơ kiểm duyệt mục đăng THRIFT nào. Thông tin này còn trống và sẽ được cập nhật sau.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 5: KYC ATTENTION & DISPUTE ATTENTION (GRID 2 CỘT) */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Panel A: KYC Attention */}
          <div className="bg-[#f7f3ec] p-6 rounded-2xl shadow-xs flex flex-col justify-between space-y-6 border border-[#ccc5bc]/20">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#576151] text-[22px]">
                    fingerprint
                  </span>
                  <h3 className="font-serif text-lg sm:text-xl font-bold text-[#1c1c18]">
                    Xét Duyệt Định Danh (KYC)
                  </h3>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-[#d8e3ce] text-[#5b6655] text-xs font-semibold">
                  {metrics.pendingKycCount} Hồ Sơ Chờ
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[#4a463f]">
                {metrics.pendingKycCount} hồ sơ định danh đang chờ phê duyệt tuân thủ và xác thực tài khoản ngân hàng lưu ký.
              </p>

              {/* Candidate List Preview */}
              <div className="space-y-3 pt-2">
                {kycList.slice(0, 3).map((cand) => (
                  <div
                    key={cand.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-white shadow-xs border border-[#ccc5bc]/20"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-[#d8e3ce] text-[#5b6655] flex items-center justify-center font-bold text-xs">
                        {cand.initials}
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-[#1c1c18]">
                          {cand.fullName}
                        </div>
                        <div className="text-[11px] text-[#7b766f]">
                          {cand.docType}
                        </div>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-[#f1ede6] text-[#576151] text-[10px] uppercase font-bold">
                      {cand.tier}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 flex items-center justify-between border-t border-[#ccc5bc]/20">
              <span className="text-[10px] text-[#7b766f] uppercase tracking-wider font-semibold">
                Chuẩn B-Corp Section 3.2
              </span>
              <button
                type="button"
                onClick={() => setSelectedKycItem(kycList[0] || null)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#1c1c18] text-[#fdf9f2] hover:bg-[#576151] transition-colors text-xs font-medium cursor-pointer"
              >
                <span>Review KYC</span>
                <span className="material-symbols-outlined text-[16px]">
                  arrow_forward
                </span>
              </button>
            </div>
          </div>

          {/* Panel B: Dispute Attention */}
          <div className="bg-[#f7f3ec] p-6 rounded-2xl shadow-xs flex flex-col justify-between space-y-6 border border-[#ccc5bc]/20">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#ba1a1a] text-[22px]">
                    balance
                  </span>
                  <h3 className="font-serif text-lg sm:text-xl font-bold text-[#1c1c18]">
                    Trọng Tài Tranh Chấp
                  </h3>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-[#ffdad6] text-[#ba1a1a] text-xs font-semibold">
                  {metrics.openDisputesCount} Hồ Sơ Mở
                </span>
              </div>

              {/* Dispute Summary Mini Cards */}
              <div className="grid grid-cols-3 gap-2.5 py-1 text-center">
                <div className="bg-white p-2.5 rounded-xl shadow-xs border border-[#ccc5bc]/20">
                  <div className="font-serif text-lg font-bold text-[#ba1a1a]">
                    {disputeList.filter((d) => d.status === "OPEN").length}
                  </div>
                  <div className="text-[10px] uppercase text-[#7b766f] font-semibold">
                    Open
                  </div>
                </div>
                <div className="bg-white p-2.5 rounded-xl shadow-xs border border-[#ccc5bc]/20">
                  <div className="font-serif text-lg font-bold text-[#7b5227]">
                    {disputeList.filter((d) => d.status === "UNDER_REVIEW").length}
                  </div>
                  <div className="text-[10px] uppercase text-[#7b766f] font-semibold">
                    Under Review
                  </div>
                </div>
                <div className="bg-white p-2.5 rounded-xl shadow-xs border border-[#ccc5bc]/20">
                  <div className="font-serif text-lg font-bold text-[#1c1c18]">
                    {disputeList.filter((d) => d.status === "UNRESOLVED").length}
                  </div>
                  <div className="text-[10px] uppercase text-[#7b766f] font-semibold">
                    Unresolved
                  </div>
                </div>
              </div>

              {/* Escrow locked banner */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#f1ede6] text-[#1c1c18] text-xs shadow-xs">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-[#7b5227]">
                    lock
                  </span>
                  <span className="font-medium">Tiền ký quỹ đang tạm khóa:</span>
                </div>
                <span className="font-serif font-bold text-[#ba1a1a] text-sm">
                  {metrics.lockedEscrowAmount.toLocaleString("vi-VN")} ₫
                </span>
              </div>

              {/* Active Disputes or Clean Safe Empty State */}
              <div className="space-y-2.5">
                {disputeList.length === 0 ? (
                  <div className="p-4 rounded-xl bg-white border border-[#ccc5bc]/20 text-center space-y-1.5 shadow-xs">
                    <span className="material-symbols-outlined text-[#576151] text-[26px] mx-auto block">
                      verified_user
                    </span>
                    <p className="text-xs font-semibold text-[#1c1c18]">
                      Sổ Cái Lưu Ký An Toàn
                    </p>
                    <p className="text-[11px] text-[#7b766f]">
                      Không có hồ sơ tranh chấp hoặc khiếu nại tồn đọng. Toàn bộ tiền ký quỹ được bảo toàn an toàn trên sổ cái.
                    </p>
                  </div>
                ) : (
                  disputeList.slice(0, 2).map((dsp) => (
                    <div
                      key={dsp.id}
                      onClick={() => setSelectedDisputeItem(dsp)}
                      className="p-3 rounded-xl bg-white space-y-1 shadow-xs border border-[#ccc5bc]/20 hover:border-[#7b766f]/40 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-mono text-[#7b5227] font-semibold">
                          {dsp.code}
                        </span>
                        <span
                          className={`text-[11px] font-medium ${dsp.status === "OPEN" ? "text-[#ba1a1a]" : "text-[#7b5227]"
                            }`}
                        >
                          {dsp.statusText}
                        </span>
                      </div>
                      <div className="text-xs font-semibold text-[#1c1c18] truncate">
                        {dsp.title}
                      </div>
                      <div className="text-[11px] text-[#7b766f]">
                        Bên thuê: {dsp.renterName} • Ký quỹ khóa:{" "}
                        {dsp.escrowLocked.toLocaleString("vi-VN")} ₫
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="pt-4 flex items-center justify-between border-t border-[#ccc5bc]/20">
              <span className="text-[10px] text-[#7b766f] uppercase tracking-wider font-semibold">
                Hội đồng trọng tài lưu ký
              </span>
              <button
                type="button"
                onClick={() => {
                  if (disputeList.length > 0) {
                    setSelectedDisputeItem(disputeList[0]);
                  } else {
                    showToast("Sổ cái đang an toàn: Chưa có vụ tranh chấp nào cần can thiệp.");
                  }
                }}
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${disputeList.length === 0
                    ? "bg-[#576151] text-white hover:bg-[#3f4a3a]"
                    : "bg-[#1c1c18] text-[#fdf9f2] hover:bg-[#ba1a1a]"
                  }`}
              >
                <span>{disputeList.length > 0 ? "Review Disputes" : "Kiểm Tra Sổ Cái"}</span>
                <span className="material-symbols-outlined text-[16px]">
                  {disputeList.length > 0 ? "arrow_forward" : "verified"}
                </span>
              </button>
            </div>
          </div>
        </section>

        {/* SECTION 6: PLATFORM ACTIVITY (DÒNG HOẠT ĐỘNG THỜI GIAN THỰC) */}
        <section className="bg-[#f7f3ec] p-6 lg:p-8 rounded-2xl shadow-xs space-y-6 border border-[#ccc5bc]/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2">
            <div className="space-y-1">
              <div className="text-[10px] uppercase tracking-wider text-[#7b766f] font-bold">
                AUDIT TRAIL LOG
              </div>
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#1c1c18]">
                Dòng Hoạt Động Thời Gian Thực
              </h2>
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white text-[#7b766f] text-xs font-medium shadow-xs border border-[#ccc5bc]/20">
              <span className="material-symbols-outlined text-[16px]">info</span>
              <span>Chưa có thông tin • Sẽ cập nhật sau</span>
            </div>
          </div>

          {/* Activity Timeline Items or Clean Empty State */}
          {activityList.length > 0 ? (
            <div className="space-y-3.5">
              {activityList.map((act) => (
                <div
                  key={act.id}
                  className="flex items-start gap-4 p-4 rounded-xl bg-white shadow-xs hover:bg-[#f1ede6] transition-colors border border-[#ccc5bc]/15"
                >
                  <div className="w-10 h-10 rounded-full bg-[#f1ede6] flex items-center justify-center text-[#292724] shrink-0 font-medium">
                    <span className="material-symbols-outlined text-[20px]">
                      {act.icon}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center justify-between gap-1">
                      <span className="text-xs font-semibold text-[#1c1c18]">
                        {act.title}
                      </span>
                      <span className="text-[11px] text-[#7b766f]">
                        {act.timeAgo}
                      </span>
                    </div>
                    <p className="text-xs text-[#4a463f] mt-1 leading-relaxed">
                      {act.description}
                    </p>
                  </div>
                  <Link
                    to={act.path}
                    className="shrink-0 p-1.5 text-[#4a463f] hover:text-[#1c1c18] rounded-lg hover:bg-[#ebe8e1] transition-colors"
                    title="Xem chi tiết"
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      chevron_right
                    </span>
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 bg-white rounded-xl border border-dashed border-[#ccc5bc]/50 text-center space-y-2 shadow-xs">
              <span className="material-symbols-outlined text-[#7b766f] text-[32px] mx-auto block">
                history_toggle_off
              </span>
              <p className="text-sm font-semibold text-[#1c1c18]">
                Chưa có thông tin
              </p>
              <p className="text-xs text-[#7b766f] max-w-sm mx-auto">
                Hiện tại hệ thống chưa ghi nhận dòng hoạt động nào phát sinh. Thông tin nhật ký hoạt động sẽ được cập nhật sau.
              </p>
            </div>
          )}
        </section>

        {/* SECTION 7: MARKETPLACE PREVIEW (XEM TRƯỚC SÀN GIAO DỊCH CÔNG KHAI) */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-[#7b766f] font-bold">
                CUSTOMER-FACING SYNCHRONIZATION
              </div>
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#1c1c18]">
                Bản Xem Trước Trực Quan Thị Trường Công Khai (Marketplace Mirrors)
              </h2>
            </div>
            <span className="text-xs text-[#7b766f]">
              Hiển thị giao diện người dùng theo thời gian thực
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Marketplace Mirror 1: RENT */}
            <div className="bg-[#f7f3ec] p-6 rounded-2xl shadow-xs space-y-5 border border-[#ccc5bc]/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-full bg-[#e7e1dd] text-[#494643] text-xs font-semibold uppercase">
                    SÀN RENT TRỰC TUYẾN
                  </span>
                  <span className="text-xs text-[#576151] flex items-center gap-1 font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#576151]"></span>
                    Live Mirror
                  </span>
                </div>
                <Link
                  to="/rent"
                  className="inline-flex items-center gap-1 text-xs text-[#292724] hover:text-[#1c1c18] font-semibold transition-colors hover:underline"
                >
                  <span>Xem Sàn RENT</span>
                  <span className="material-symbols-outlined text-[16px]">
                    open_in_new
                  </span>
                </Link>
              </div>

              {rentCatalog.length > 0 ? (
                <Link
                  to={`/rent/products/${rentCatalog[0].id}`}
                  className="block group bg-white p-4 rounded-xl shadow-xs hover:bg-[#f1ede6]/40 transition-all border border-[#ccc5bc]/20"
                >
                  <div className="flex gap-4 items-center">
                    <div className="w-24 h-24 rounded-lg bg-[#f1ede6] overflow-hidden shrink-0">
                      <img
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        src={rentCatalog[0].images[0]}
                        alt={rentCatalog[0].name}
                      />
                    </div>
                    <div className="space-y-1 min-w-0">
                      <span className="text-[10px] text-[#576151] uppercase font-bold tracking-wider">
                        Khả Dụng Cho Thuê • {rentCatalog[0].categoryName}
                      </span>
                      <h4 className="text-sm sm:text-base font-serif font-semibold text-[#1c1c18] truncate group-hover:text-[#292724] transition-colors">
                        {rentCatalog[0].name}
                      </h4>
                      <div className="text-sm font-serif font-bold text-[#1c1c18]">
                        {rentCatalog[0].pricePerDay.toLocaleString("vi-VN")} ₫
                        <span className="text-[#7b766f] text-xs font-sans font-normal">
                          {" "}
                          / ngày
                        </span>
                      </div>
                      <div className="text-[11px] text-[#7b766f] truncate">
                        Ký quỹ: {rentCatalog[0].depositAmount.toLocaleString("vi-VN")} ₫ • Shop: {rentCatalog[0].ownerName}
                      </div>
                    </div>
                  </div>
                </Link>
              ) : (
                <div className="p-4 bg-white rounded-xl text-center text-xs text-[#7b766f]">
                  Chưa có sản phẩm RENT nào trên sàn
                </div>
              )}
            </div>

            {/* Marketplace Mirror 2: THRIFT */}
            <div className="bg-[#f7f3ec] p-6 rounded-2xl shadow-xs space-y-5 border border-[#ccc5bc]/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-full bg-[#f0e0cb] text-[#4f4535] text-xs font-semibold uppercase">
                    SÀN THRIFT TRỰC TUYẾN
                  </span>
                  <span className="text-xs text-[#576151] flex items-center gap-1 font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#576151]"></span>
                    Live Mirror
                  </span>
                </div>
                <Link
                  to="/thrift"
                  className="inline-flex items-center gap-1 text-xs text-[#7b5227] hover:text-[#1c1c18] font-semibold transition-colors hover:underline"
                >
                  <span>Xem Sàn THRIFT</span>
                  <span className="material-symbols-outlined text-[16px]">
                    open_in_new
                  </span>
                </Link>
              </div>

              {thriftCatalog.length > 0 ? (
                <Link
                  to={`/thrift/${thriftCatalog[0].slug}`}
                  className="block group bg-white p-4 rounded-xl shadow-xs hover:bg-[#f1ede6]/40 transition-all border border-[#ccc5bc]/20"
                >
                  <div className="flex gap-4 items-center">
                    <div className="w-24 h-24 rounded-lg bg-[#f1ede6] overflow-hidden shrink-0">
                      <img
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        src={thriftCatalog[0].images[0]}
                        alt={thriftCatalog[0].name}
                      />
                    </div>
                    <div className="space-y-1 min-w-0">
                      <span className="text-[10px] text-[#7b5227] uppercase font-bold tracking-wider">
                        Độc Bản Di Sản Giám Định • {thriftCatalog[0].categoryName}
                      </span>
                      <h4 className="text-sm sm:text-base font-serif font-semibold text-[#1c1c18] truncate group-hover:text-[#7b5227] transition-colors">
                        {thriftCatalog[0].name}
                      </h4>
                      <div className="text-sm font-serif font-bold text-[#1c1c18]">
                        {thriftCatalog[0].price.toLocaleString("vi-VN")} ₫
                      </div>
                      <div className="text-[11px] text-[#7b766f] truncate">
                        {thriftCatalog[0].source} • Người bán: {thriftCatalog[0].sellerName}
                      </div>
                    </div>
                  </div>
                </Link>
              ) : (
                <div className="p-4 bg-white rounded-xl text-center text-xs text-[#7b766f]">
                  Chưa có sản phẩm THRIFT nào trên sàn
                </div>
              )}
            </div>
          </div>
        </section>
      </div>

      {/* MODAL 1: REVIEW RENT LISTING */}
      {selectedRentItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-[#ccc5bc]/50">
            <div className="flex items-start justify-between border-b border-[#f1ede6] pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#576151]">
                  Kiểm Định Quang Học & Buồng Máy
                </span>
                <h3 className="font-serif text-lg font-bold text-[#1c1c18]">
                  {selectedRentItem.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRentItem(null)}
                className="text-[#7b766f] hover:text-[#1c1c18] p-1"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="space-y-3">
              <div className="h-44 rounded-xl overflow-hidden bg-[#f1ede6]">
                <img
                  src={selectedRentItem.images[0]}
                  alt={selectedRentItem.name}
                  className="w-full h-full object-cover"
                />
              </div>

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
                    {selectedRentItem.condition} (Đạt tiêu chuẩn B-Corp)
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#f1ede6]">
              <button
                type="button"
                onClick={() => setSelectedRentItem(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#4a463f] hover:bg-[#f1ede6] transition-colors"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={() =>
                  handleApproveRent(selectedRentItem.id, selectedRentItem.name)
                }
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-[#292724] text-white hover:bg-[#1c1c18] transition-colors shadow-sm"
              >
                Duyệt & Cấp Tem Kiểm Định
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: REVIEW THRIFT LISTING */}
      {selectedThriftItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-[#ccc5bc]/50">
            <div className="flex items-start justify-between border-b border-[#f1ede6] pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#7b5227]">
                  Giám Định Nguồn Gốc Di Sản
                </span>
                <h3 className="font-serif text-lg font-bold text-[#1c1c18]">
                  {selectedThriftItem.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedThriftItem(null)}
                className="text-[#7b766f] hover:text-[#1c1c18] p-1"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="space-y-3">
              <div className="h-44 rounded-xl overflow-hidden bg-[#f1ede6]">
                <img
                  src={selectedThriftItem.images[0]}
                  alt={selectedThriftItem.name}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs bg-[#f7f3ec] p-3 rounded-xl">
                <div>
                  <span className="text-[#7b766f] block">Chủ sở hữu / Ký gửi:</span>
                  <span className="font-semibold text-[#1c1c18]">
                    {selectedThriftItem.sellerName}
                  </span>
                </div>
                <div>
                  <span className="text-[#7b766f] block">Giá bán độc bản:</span>
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
                  <span className="text-[#7b766f] block">Hộ chiếu lưu ký:</span>
                  <span className="font-semibold text-[#576151]">
                    Đã số hóa & kiểm định vi vết
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#f1ede6]">
              <button
                type="button"
                onClick={() => setSelectedThriftItem(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#4a463f] hover:bg-[#f1ede6] transition-colors"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={() =>
                  handleApproveThrift(selectedThriftItem.id, selectedThriftItem.name)
                }
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-[#7b5227] text-white hover:bg-[#673d14] transition-colors shadow-sm"
              >
                Bảo Chứng & Xuất Bản Sàn THRIFT
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: REVIEW KYC APPLICANT */}
      {selectedKycItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-[#ccc5bc]/50">
            <div className="flex items-start justify-between border-b border-[#f1ede6] pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#576151]">
                  Xác Thực Danh Tính Người Dùng
                </span>
                <h3 className="font-serif text-lg font-bold text-[#1c1c18]">
                  {selectedKycItem.fullName}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedKycItem(null)}
                className="text-[#7b766f] hover:text-[#1c1c18] p-1"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-[#f7f3ec] space-y-2">
                <div className="flex justify-between">
                  <span className="text-[#7b766f]">Email:</span>
                  <span className="font-semibold text-[#1c1c18]">
                    {selectedKycItem.email}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#7b766f]">Số điện thoại:</span>
                  <span className="font-semibold text-[#1c1c18]">
                    {selectedKycItem.phoneNumber || "0901234567"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#7b766f]">Tài liệu nộp:</span>
                  <span className="font-semibold text-[#1c1c18]">
                    {selectedKycItem.docType}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#7b766f]">Tài khoản thụ hưởng Escrow:</span>
                  <span className="font-semibold text-[#576151]">
                    {selectedKycItem.bankInfo || "Vietcombank Escrow Clearing"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#7b766f]">Phân hạng chứng thư:</span>
                  <span className="font-bold text-[#1c1c18]">
                    {selectedKycItem.tier}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#f1ede6]">
              <button
                type="button"
                onClick={() => setSelectedKycItem(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#4a463f] hover:bg-[#f1ede6] transition-colors"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={() =>
                  handleApproveKyc(selectedKycItem.id, selectedKycItem.fullName)
                }
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-[#576151] text-white hover:bg-[#3f4a3a] transition-colors shadow-sm"
              >
                Phê Duyệt Tuân Thủ & Mở Hạn Mức
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: REVIEW DISPUTE */}
      {selectedDisputeItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
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
                className="text-[#7b766f] hover:text-[#1c1c18] p-1"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="space-y-3 text-xs bg-[#f7f3ec] p-4 rounded-xl">
              <div className="flex justify-between">
                <span className="text-[#7b766f]">Bên liên quan / Renter:</span>
                <span className="font-semibold text-[#1c1c18]">
                  {selectedDisputeItem.renterName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#7b766f]">Khoản ký quỹ phong tỏa:</span>
                <span className="font-bold text-[#ba1a1a]">
                  {selectedDisputeItem.escrowLocked.toLocaleString("vi-VN")} ₫
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#7b766f]">Trạng thái điều tra:</span>
                <span className="font-semibold text-[#7b5227]">
                  {selectedDisputeItem.statusText}
                </span>
              </div>
              <div className="pt-2 border-t border-[#ccc5bc]/20">
                <span className="text-[#7b766f] block mb-1">Nội dung khiếu nại:</span>
                <p className="text-[#1c1c18] italic">{selectedDisputeItem.reason}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-3 pt-3 border-t border-[#f1ede6]">
              <button
                type="button"
                onClick={() => setSelectedDisputeItem(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#4a463f] hover:bg-[#f1ede6] transition-colors"
              >
                Đóng
              </button>
              <Link
                to={`/admin/disputes/${selectedDisputeItem.code.replace("#", "")}`}
                onClick={() => setSelectedDisputeItem(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#6c5937] text-white hover:bg-[#554424] transition-colors shadow-sm flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">visibility</span>
                <span>Mở Bàn Trọng Tài</span>
              </Link>
              <button
                type="button"
                onClick={() => {
                  setSelectedDisputeItem(null);
                  showToast(
                    `Đã chuyển hồ sơ ${selectedDisputeItem.code} sang Hội đồng Thẩm định Lưu ký!`
                  );
                }}
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-[#ba1a1a] text-white hover:bg-[#93000a] transition-colors shadow-sm"
              >
                Triệu Tập Hội Đồng Trọng Tài
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
