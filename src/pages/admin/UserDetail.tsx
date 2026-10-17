import React, { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { fetchAdminUsers } from "../../services/admin.api";
import type { MongoUserItem } from "../../services/admin.api";

type RoleMode = "customer" | "owner";
type AccountStatus = "active" | "suspended" | "pending";

interface UserProfileData {
  fullName: string;
  userId: string;
  roleName: "CUSTOMER" | "SHOP OWNER" | "ADMINISTRATOR";
  email: string;
  phone: string;
  standing: string;
  address: string;
  avatarUrl?: string;
  kycText: string;
  kycTier: string;
  kycId: string;
  nationalId: string;
  creditLimit: string;
  auditor: string;
  device: string;
  registeredDate: string;
  lastActive: string;
}

const DEFAULT_PROFILES: Record<RoleMode, UserProfileData> = {
  customer: {
    fullName: "Elena Rostova",
    userId: "#USR-84192",
    roleName: "CUSTOMER",
    email: "elena.rostova@circulararchive.vn",
    phone: "+84 908 123 456",
    standing: "Good Standing (0 Vi Phạm)",
    address: "48 Bạch Đằng, Phường Hải Châu 1, Quận Hải Châu, TP. Đà Nẵng",
    avatarUrl:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
    kycText: "Đã Xác Thực KYC (Approved - Level 2 Zero-Collateral Custody)",
    kycTier: "Tier 2 Verified",
    kycId: "#KYC-9482-VN",
    nationalId: "048094002819",
    creditLimit: "50,000,000 ₫ (Zero-Deposit)",
    auditor: "Audit Officer Marcus Vance (14/01/2025)",
    device: "MacBook Pro M2 · Chrome v131 (14.161.88.24 VN)",
    registeredDate: "12 Tháng 1, 2025 (10:42 GMT+7)",
    lastActive: "Hoạt động 10 phút trước (Web Client)",
  },
  owner: {
    fullName: "Vũ Thanh Tùng",
    userId: "#OWNER-01",
    roleName: "SHOP OWNER",
    email: "tung.vu@atelierchronos.vn",
    phone: "+84 912 889 001",
    standing: "Atelier Master Custodian (Certified)",
    address: "15 Tràng Tiền, Quận Hoàn Kiếm, TP. Hà Nội (Atelier Chronos)",
    avatarUrl:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80",
    kycText: "Đã Thẩm Định Pháp Nhân Xưởng (Tier 3 Commercial Master Vault)",
    kycTier: "Tier 3 Master Partner",
    kycId: "#KYC-1049-CORP",
    nationalId: "001089012399",
    creditLimit: "250,000,000 ₫ (Secured Escrow Vault)",
    auditor: "Lead Inspector Đặng Minh Triết (05/12/2024)",
    device: "iMac 24-inch M3 · Safari v17.4 (118.69.44.12 HN)",
    registeredDate: "03 Tháng 11, 2024 (09:15 GMT+7)",
    lastActive: "Đang trực tuyến (Atelier Terminal)",
  },
};

export const UserDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const [loading, setLoading] = useState<boolean>(true);
  const [realUser, setRealUser] = useState<MongoUserItem | null>(null);
  const [currentRole, setCurrentRole] = useState<RoleMode>("customer");
  const [status, setStatus] = useState<AccountStatus>("active");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Status Change Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalRadioStatus, setModalRadioStatus] = useState<AccountStatus>("active");
  const [suspensionReason, setSuspensionReason] = useState<string>("violation");
  const [auditNote, setAuditNote] = useState<string>("");

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Fetch real users to find matched user if id is passed
  useEffect(() => {
    let isMounted = true;
    const fetchUser = async () => {
      setLoading(true);
      try {
        const users = await fetchAdminUsers();
        if (!isMounted) return;

        if (id) {
          const found = users.find((u) => u._id === id || `#USR-${u._id.slice(-5).toUpperCase()}` === id);
          if (found) {
            setRealUser(found);
            if (found.role === "SHOP_OWNER") {
              setCurrentRole("owner");
            } else {
              setCurrentRole("customer");
            }
            if (found.status === "SUSPENDED") {
              setStatus("suspended");
            } else if (found.status === "PENDING") {
              setStatus("pending");
            } else {
              setStatus("active");
            }
          }
        }
      } catch (err) {
        console.warn("Lỗi khi tải thông tin chi tiết người dùng:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchUser();
    return () => {
      isMounted = false;
    };
  }, [id]);

  // Merge real user data with default profile structure
  const activeProfile: UserProfileData = React.useMemo(() => {
    if (realUser) {
      const isShop = realUser.role === "SHOP_OWNER";
      const addressStr = realUser.address
        ? `${realUser.address.detail || ""}, ${realUser.address.ward || ""}, ${realUser.address.district || ""}, ${realUser.address.province || ""}`.replace(/^, |, $/g, "")
        : isShop
        ? "15 Tràng Tiền, Quận Hoàn Kiếm, TP. Hà Nội (Atelier Chronos)"
        : "48 Bạch Đằng, Phường Hải Châu 1, Quận Hải Châu, TP. Đà Nẵng";

      const formattedDate = realUser.createdAt
        ? new Date(realUser.createdAt).toLocaleDateString("vi-VN", {
            day: "2-digit",
            month: "long",
            year: "numeric",
          })
        : "12 Tháng 1, 2025 (10:42 GMT+7)";

      return {
        fullName: realUser.fullName || (isShop ? "Vũ Thanh Tùng" : "Elena Rostova"),
        userId: `#USR-${realUser._id.slice(-5).toUpperCase()}`,
        roleName: isShop ? "SHOP OWNER" : realUser.role === "ADMIN" ? "ADMINISTRATOR" : "CUSTOMER",
        email: realUser.email,
        phone: realUser.phoneNumber || "+84 908 123 456",
        standing: realUser.status === "SUSPENDED" ? "Bị Giới Hạn Hành Chính" : isShop ? "Atelier Master Custodian (Certified)" : "Good Standing (0 Vi Phạm)",
        address: addressStr || "Chưa thiết lập địa chỉ",
        avatarUrl: isShop ? DEFAULT_PROFILES.owner.avatarUrl : DEFAULT_PROFILES.customer.avatarUrl,
        kycText: realUser.kycStatus === "APPROVED"
          ? isShop
            ? "Đã Thẩm Định Pháp Nhân Xưởng (Tier 3 Commercial Master Vault)"
            : "Đã Xác Thực KYC (Approved - Level 2 Zero-Collateral Custody)"
          : realUser.kycStatus === "PENDING"
          ? "Đang Chờ Thẩm Định Giấy Tờ KYC (Level 2 In-Review)"
          : "Chưa Xác Thực Định Danh (Standard Level 1)",
        kycTier: isShop ? "Tier 3 Master Partner" : realUser.kycStatus === "APPROVED" ? "Tier 2 Verified" : "Tier 1 Unverified",
        kycId: `#KYC-${realUser._id.slice(-4).toUpperCase()}-VN`,
        nationalId: isShop ? "001089012399" : "048094002819",
        creditLimit: isShop ? "250,000,000 ₫ (Secured Escrow Vault)" : "50,000,000 ₫ (Zero-Deposit)",
        auditor: isShop ? "Lead Inspector Đặng Minh Triết (05/12/2024)" : "Audit Officer Marcus Vance (14/01/2025)",
        device: isShop ? "iMac 24-inch M3 · Safari v17.4 (118.69.44.12 HN)" : "MacBook Pro M2 · Chrome v131 (14.161.88.24 VN)",
        registeredDate: formattedDate,
        lastActive: "Hoạt động 10 phút trước (Web Client)",
      };
    }
    return DEFAULT_PROFILES[currentRole];
  }, [realUser, currentRole]);

  const handleSwitchRole = (role: RoleMode) => {
    setCurrentRole(role);
    showToast(`Đã chuyển đổi góc nhìn giám sát sang vai trò: ${role === "customer" ? "CUSTOMER" : "SHOP OWNER"}`);
  };

  const handleOpenStatusModal = () => {
    setModalRadioStatus(status);
    setIsModalOpen(true);
  };

  const handleConfirmStatusChange = () => {
    setStatus(modalRadioStatus);
    setIsModalOpen(false);
    const statusLabels: Record<AccountStatus, string> = {
      active: "Hoạt Động (Active)",
      suspended: "Tạm Khóa (Suspended)",
      pending: "Chờ Xác Minh (Pending KYC)",
    };
    showToast(`Đã cập nhật trạng thái tài khoản thành công: ${statusLabels[modalRadioStatus]}`);
  };

  const handleRestoreInstant = () => {
    setStatus("active");
    showToast("Đã khôi phục tài khoản người dùng về trạng thái Hoạt Động (Active)");
  };

  const handleExportAuditDossier = () => {
    showToast(`[HỆ THỐNG KIỂM TOÁN REUSE HUB] Đang xuất Hồ sơ kiểm toán số cho ${activeProfile.fullName} (${activeProfile.userId}). Mã băm SHA-256 đã ghi vào sổ cái vận hành.`);
  };

  return (
    <div className="w-full bg-[#fdf8f5] text-[#1c1b19] font-sans antialiased min-h-screen pb-16">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-[#1c1b19] text-[#fdf8f5] px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs font-semibold animate-fade-in border border-[#7e766a]/30">
          <span className="material-symbols-outlined text-[18px] text-[#caebc9]">
            info
          </span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Loading Bar when fetching MongoDB record */}
      {loading && (
        <div className="w-full bg-[#f2ede9] border-b border-[#cfc5b8]/30 py-1.5 px-4 text-center text-xs text-[#7e766a] flex items-center justify-center gap-2">
          <div className="w-3 h-3 border-2 border-[#6c5937] border-t-transparent rounded-full animate-spin"></div>
          <span>Đang đồng bộ hồ sơ bảo chứng người dùng từ cơ sở dữ liệu...</span>
        </div>
      )}

      {/* Admin Horizontal Sub-Nav */}
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
              aria-current="page"
              className="px-3 py-1.5 rounded-lg bg-[#86724d] text-[#fffbff] font-semibold whitespace-nowrap shadow-xs"
            >
              Người Dùng
            </Link>
            <Link
              to="/admin/kyc"
              className="px-3 py-1.5 rounded-lg text-[#4c463c] hover:text-[#1c1b19] hover:bg-[#ece7e4] transition-colors whitespace-nowrap"
            >
              Duyệt KYC
            </Link>
            <Link
              to="/admin/rent/listings"
              className="px-3 py-1.5 rounded-lg text-[#4c463c] hover:text-[#1c1b19] hover:bg-[#ece7e4] transition-colors whitespace-nowrap"
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
          <div className="hidden lg:flex items-center gap-2 pl-4 text-xs text-[#48654b] font-medium shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-[#48654b] animate-pulse"></span>
            <span>NODE AUTHENTICATED #VN-882</span>
          </div>
        </div>
      </div>

      {/* Context Bar & Breadcrumb Navigation */}
      <div className="w-full bg-[#f7f3ef] border-b border-[#cfc5b8]/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-xs text-[#4c463c]">
            <Link
              to="/admin/dashboard"
              className="hover:text-[#6c5937] transition-colors flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[16px]">domain</span>
              <span>Quản Trị Hệ Thống</span>
            </Link>
            <span className="text-[#7e766a]">/</span>
            <Link
              to="/admin/users"
              className="hover:text-[#6c5937] transition-colors"
            >
              Quản Lý Người Dùng
            </Link>
            <span className="text-[#7e766a]">/</span>
            <span className="text-[#1c1b19] font-bold">
              Hồ Sơ Chi Tiết Thành Viên ({activeProfile.userId})
            </span>
          </div>

          <Link
            to="/admin/users"
            className="inline-flex items-center gap-1 text-xs text-[#6c5937] hover:text-[#7f5227] font-semibold transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">
              arrow_back
            </span>
            <span>Quay lại danh sách Người Dùng</span>
          </Link>
        </div>
      </div>

      {/* Role Lens Switcher & Editorial Lead */}
      <div className="w-full bg-[#fdf8f5] py-5 border-b border-[#cfc5b8]/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#48654b]"></span>
              <span className="text-[11px] uppercase tracking-wider text-[#48654b] font-bold">
                Cơ Chế Phân Quyền Giám Sát
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#4c463c] max-w-xl">
              Bộ lọc mô phỏng phân vai quản trị: Giao diện tự động thích ứng cấu
              trúc dữ liệu theo vai trò{" "}
              <strong className="text-[#1c1b19]">CUSTOMER</strong> hoặc{" "}
              <strong className="text-[#1c1b19]">SHOP OWNER</strong>.
            </p>
          </div>

          {/* Role Mode Toggle Pills */}
          <div className="p-1 bg-[#ece7e4] rounded-xl flex items-center gap-1 self-start lg:self-auto shadow-xs border border-[#cfc5b8]/30">
            <button
              type="button"
              onClick={() => handleSwitchRole("customer")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                currentRole === "customer"
                  ? "bg-[#ffffff] text-[#1c1b19] shadow-xs"
                  : "text-[#4c463c] hover:text-[#1c1b19]"
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">person</span>
              <span>Khách Hàng (Customer - {realUser && realUser.role !== "SHOP_OWNER" ? realUser.fullName : "Elena Rostova"})</span>
            </button>
            <button
              type="button"
              onClick={() => handleSwitchRole("owner")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                currentRole === "owner"
                  ? "bg-[#ffffff] text-[#1c1b19] shadow-xs"
                  : "text-[#4c463c] hover:text-[#1c1b19]"
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">storefront</span>
              <span>Chủ Xưởng (Shop Owner - {realUser && realUser.role === "SHOP_OWNER" ? realUser.fullName : "Vũ Thanh Tùng"})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Workspace */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-8 flex flex-col gap-6 w-full">
        {/* 1. PROFILE HEADER HERO CARD */}
        <div className="bg-[#ffffff] rounded-2xl shadow-xs border border-[#cfc5b8]/30 p-6 lg:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative overflow-hidden">
          {/* Watermark / Archival Seal background decoration */}
          <div className="absolute right-0 bottom-0 pointer-events-none opacity-[0.03] select-none translate-x-12 translate-y-8">
            <span className="material-symbols-outlined text-[320px]">
              verified
            </span>
          </div>

          {/* Left Profile Details */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 z-10">
            {/* Avatar Block with Trust Seal */}
            <div className="relative shrink-0">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden bg-[#f2ede9] p-1 shadow-xs border border-[#cfc5b8]/40">
                <img
                  className="w-full h-full object-cover rounded-full"
                  src={activeProfile.avatarUrl}
                  alt={activeProfile.fullName}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80";
                  }}
                />
              </div>
              <div
                className="absolute -bottom-1 -right-1 bg-[#48654b] text-[#ffffff] p-1.5 rounded-full shadow-md flex items-center justify-center border-2 border-[#ffffff]"
                title={activeProfile.kycTier}
              >
                <span className="material-symbols-outlined text-[18px]">
                  verified_user
                </span>
              </div>
            </div>

            {/* Identity Metadata Group */}
            <div className="flex flex-col gap-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#1c1b19] tracking-tight">
                  {activeProfile.fullName}
                </h1>
                <span className="px-2 py-0.5 bg-[#ece7e4] text-[#4c463c] font-mono text-xs rounded uppercase font-semibold">
                  {activeProfile.userId}
                </span>

                {/* Role Pill */}
                <span className="px-2.5 py-0.5 bg-[#86724d] text-[#fffbff] text-xs uppercase rounded font-semibold tracking-wider">
                  {activeProfile.roleName}
                </span>

                {/* Status Badge */}
                {status === "active" && (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-[#caebc9]/70 text-[#4e6b50] rounded text-xs font-semibold">
                    <span className="w-2 h-2 rounded-full bg-[#48654b]"></span>
                    <span>Hoạt Động (Active)</span>
                  </div>
                )}
                {status === "suspended" && (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-[#ffdad6] text-[#ba1a1a] rounded text-xs font-semibold">
                    <span className="w-2 h-2 rounded-full bg-[#ba1a1a]"></span>
                    <span>Tạm Khóa (Suspended)</span>
                  </div>
                )}
                {status === "pending" && (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-[#ffdcc1]/70 text-[#7f5227] rounded text-xs font-semibold">
                    <span className="w-2 h-2 rounded-full bg-[#7f5227]"></span>
                    <span>Chờ Xác Minh (Pending KYC)</span>
                  </div>
                )}
              </div>

              <p className="text-sm text-[#48654b] font-medium flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px]">
                  check_circle
                </span>
                <span>{activeProfile.kycText}</span>
              </p>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#4c463c] pt-1">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px] text-[#7e766a]">
                    mail
                  </span>
                  <span>{activeProfile.email}</span>
                  <span className="text-[#48654b] font-semibold text-[10px] uppercase ml-1">
                    (2FA Khóa)
                  </span>
                </span>
                <span className="text-[#cfc5b8]">·</span>
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px] text-[#7e766a]">
                    call
                  </span>
                  <span>{activeProfile.phone}</span>
                </span>
                <span className="text-[#cfc5b8]">·</span>
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px] text-[#7e766a]">
                    schedule
                  </span>
                  <span>{activeProfile.lastActive}</span>
                </span>
              </div>

              <div className="text-[#7e766a] text-xs pt-0.5">
                <span>Ngày đăng ký lưu ký: {activeProfile.registeredDate}</span>
              </div>
            </div>
          </div>

          {/* Quick Admin Actions (Right Rail) */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-2 shrink-0 z-10">
            <button
              type="button"
              onClick={handleOpenStatusModal}
              className="px-4 py-2.5 bg-[#1c1b19] text-[#fdf8f5] hover:bg-[#6c5937] rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 shadow-xs"
            >
              <span className="material-symbols-outlined text-[18px]">tune</span>
              <span>Thay Đổi Trạng Thái Tài Khoản</span>
            </button>

            <Link
              to={`/admin/kyc-review/${activeProfile.userId.replace("#", "")}`}
              className="px-4 py-2.5 bg-[#f2ede9] hover:bg-[#ece7e4] text-[#1c1b19] rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 border border-[#cfc5b8]/30"
            >
              <span className="material-symbols-outlined text-[18px]">badge</span>
              <span>Xem Hồ Sơ KYC ({activeProfile.kycId})</span>
            </Link>

            <button
              type="button"
              onClick={handleExportAuditDossier}
              className="px-4 py-2 text-[#4c463c] hover:text-[#1c1b19] hover:bg-[#f2ede9] rounded-xl text-[11px] font-semibold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">
                download
              </span>
              <span>Xuất Hồ Sơ Kiểm Toán (Audit Dossier)</span>
            </button>
          </div>
        </div>

        {/* Alert Banner when Suspended */}
        {status === "suspended" && (
          <div className="bg-[#ffdad6] text-[#93000a] p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm border border-[#ba1a1a]/20 animate-fade-in">
            <div className="flex items-start sm:items-center gap-3">
              <span className="material-symbols-outlined text-[#ba1a1a] text-[28px] shrink-0">
                gavel
              </span>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider block">
                  Tài Khoản Đang Tạm Khóa Hành Chính
                </span>
                <p className="text-xs sm:text-sm text-[#4c463c] mt-0.5">
                  Mọi giao dịch RENT/THRIFT bị tạm đình chỉ để rà soát vi phạm tiêu chuẩn bảo quản thiết bị.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleRestoreInstant}
              className="px-4 py-2 bg-[#ba1a1a] text-[#ffffff] hover:bg-[#7f5227] rounded-xl text-xs font-bold transition-colors shrink-0 shadow-xs flex items-center justify-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">
                lock_open
              </span>
              <span>Khôi Phục Tài Khoản Ngay (1-Click Restore)</span>
            </button>
          </div>
        )}

        {/* 2. TWO-COLUMN WORKSPACE */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full">
          {/* LEFT COLUMN: Account Details & Forensic Custody (40% -> col-span-5) */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            {/* CARD 1: THÔNG TIN TÀI KHOẢN (ACCOUNT INFORMATION) */}
            <div className="bg-[#ffffff] rounded-2xl p-6 shadow-xs border border-[#cfc5b8]/30 flex flex-col gap-4">
              <div className="flex items-center justify-between pb-1 border-b border-[#cfc5b8]/20">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#6c5937] text-[22px]">
                    account_box
                  </span>
                  <h2 className="font-serif text-lg font-bold text-[#1c1b19]">
                    Thông Tin Tài Khoản
                  </h2>
                </div>
                <span className="px-2 py-0.5 bg-[#f2ede9] text-[#4c463c] text-[10px] uppercase font-bold tracking-wider rounded">
                  Immutable Node
                </span>
              </div>

              <div className="flex flex-col gap-2.5 text-xs sm:text-sm">
                <div className="flex justify-between items-center py-2 bg-[#f7f3ef] px-3.5 rounded-xl">
                  <span className="text-[#4c463c] text-xs font-medium">
                    Định Danh Người Dùng (ID)
                  </span>
                  <span className="font-mono font-bold text-[#1c1b19]">
                    {activeProfile.userId}
                  </span>
                </div>

                <div className="flex flex-col gap-1 py-1 px-3.5">
                  <span className="text-[#4c463c] text-xs font-medium">
                    Email Đăng Ký Ủy Thác
                  </span>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[#1c1b19] truncate max-w-[210px]">
                      {activeProfile.email}
                    </span>
                    <span className="text-[#48654b] text-xs font-semibold flex items-center gap-1 shrink-0">
                      <span className="material-symbols-outlined text-[14px]">
                        lock
                      </span>
                      Passkey / Link
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-1 py-1 px-3.5">
                  <span className="text-[#4c463c] text-xs font-medium">
                    Số Điện Thoại Xác Thực
                  </span>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[#1c1b19]">
                      {activeProfile.phone}
                    </span>
                    <span className="text-[#48654b] text-xs font-semibold flex items-center gap-1 shrink-0">
                      <span className="material-symbols-outlined text-[14px]">
                        verified
                      </span>
                      OTP Viettel OK
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-center py-2 bg-[#f7f3ef] px-3.5 rounded-xl">
                  <span className="text-[#4c463c] text-xs font-medium">
                    Phân Vai Cốt Lõi
                  </span>
                  <span className="text-xs font-bold text-[#6c5937]">
                    {activeProfile.roleName} ({currentRole === "customer" ? "Khách Hàng Ký Thác" : "Chủ Xưởng Giám Định"})
                  </span>
                </div>

                <div className="flex justify-between items-center py-1.5 px-3.5">
                  <span className="text-[#4c463c] text-xs font-medium">
                    Trạng Thái Tín Nhiệm
                  </span>
                  <span className="text-[#48654b] font-semibold text-xs flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#48654b]"></span>
                    {activeProfile.standing}
                  </span>
                </div>

                <div className="flex flex-col gap-1 py-1 px-3.5">
                  <span className="text-[#4c463c] text-xs font-medium">
                    Địa Chỉ Nhận Hàng Mặc Định
                  </span>
                  <span className="text-[#1c1b19] font-medium text-xs leading-relaxed">
                    {activeProfile.address}
                  </span>
                </div>

                <div className="flex flex-col gap-1 py-1 px-3.5 bg-[#f7f3ef] rounded-xl">
                  <span className="text-[#4c463c] text-xs font-medium">
                    Thiết Bị Tin Cậy Gần Nhất
                  </span>
                  <div className="flex items-center justify-between text-[#1c1b19] text-xs">
                    <span className="font-medium">
                      {activeProfile.device.split(" (")[0]}
                    </span>
                    <span className="text-[#7e766a] font-mono text-[11px]">
                      {activeProfile.device.includes("(") ? activeProfile.device.split("(")[1].replace(")", "") : "14.161.88.24 (VN)"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* CARD 2: XÁC THỰC ĐỊNH DANH (KYC STATUS & PROVENANCE) */}
            <div className="bg-[#ffffff] rounded-2xl p-6 shadow-xs border border-[#cfc5b8]/30 flex flex-col gap-4">
              <div className="flex items-center justify-between pb-1 border-b border-[#cfc5b8]/20">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#48654b] text-[22px]">
                    fingerprint
                  </span>
                  <h2 className="font-serif text-lg font-bold text-[#1c1b19]">
                    Xác Thực Định Danh KYC
                  </h2>
                </div>
                <span className="px-2.5 py-0.5 bg-[#caebc9] text-[#4e6b50] text-[10px] uppercase font-bold tracking-wider rounded-md">
                  {activeProfile.kycTier}
                </span>
              </div>

              <div className="p-3 bg-[#f7f3ef] rounded-xl flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-[10px] text-[#4c463c] uppercase font-bold tracking-wider">
                    Mã Hồ Sơ Giám Định
                  </span>
                  <span className="font-mono font-bold text-[#1c1b19] text-xs sm:text-sm">
                    {activeProfile.kycId}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[#48654b] text-xs font-bold">
                  <span className="material-symbols-outlined text-[16px]">
                    task_alt
                  </span>
                  <span>ĐÃ PHÊ DUYỆT</span>
                </div>
              </div>

              {/* Document Details */}
              <div className="flex flex-col gap-2 text-xs">
                <div className="flex justify-between py-1 px-3">
                  <span className="text-[#4c463c] font-medium">
                    CCCD Gắn Chip (Số định danh)
                  </span>
                  <span className="font-mono font-semibold text-[#1c1b19]">
                    {activeProfile.nationalId}
                  </span>
                </div>

                <div className="flex justify-between py-1.5 px-3 bg-[#f7f3ef] rounded-lg">
                  <span className="text-[#4c463c] font-medium">
                    Phương Thức Thẩm Định
                  </span>
                  <span className="text-[#1c1b19] font-medium text-[11px]">
                    Đối soát vi sai quang học &amp; NFC
                  </span>
                </div>

                <div className="flex justify-between py-1 px-3">
                  <span className="text-[#4c463c] font-medium">
                    Hạn Mức Ký Quỹ Tín Nhiệm
                  </span>
                  <span className="text-[#6c5937] font-bold">
                    {activeProfile.creditLimit}
                  </span>
                </div>

                <div className="flex justify-between py-1 px-3">
                  <span className="text-[#4c463c] font-medium">
                    Chuyên Viên Thẩm Định
                  </span>
                  <span className="text-[#1c1b19] font-medium text-[11px]">
                    {activeProfile.auditor}
                  </span>
                </div>
              </div>

              <Link
                to={`/admin/kyc-review/${activeProfile.userId.replace("#", "")}`}
                className="w-full py-2.5 bg-[#f2ede9] hover:bg-[#ece7e4] text-[#1c1b19] rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 text-center border border-[#cfc5b8]/30"
              >
                <span>Xem Chi Tiết Hồ Sơ KYC Đầy Đủ</span>
                <span className="material-symbols-outlined text-[16px]">
                  arrow_forward
                </span>
              </Link>
            </div>

            {/* CARD 3: NGUYÊN TẮC BẢO MẬT PHÂN QUYỀN (GOVERNANCE NOTICE) */}
            <div className="bg-[#ece7e4] rounded-2xl p-6 flex flex-col gap-2.5 border border-[#cfc5b8]/30">
              <div className="flex items-center gap-2 text-[#7f5227]">
                <span className="material-symbols-outlined text-[20px]">
                  shield
                </span>
                <span className="text-[11px] font-bold uppercase tracking-wider">
                  Nguyên Tắc Bảo Mật Bất Biến
                </span>
              </div>
              <p className="text-xs text-[#4c463c] leading-relaxed">
                Quy chuẩn phân quyền bất biến: Quản trị viên{" "}
                <strong className="text-[#1c1b19]">không thể</strong> chỉnh sửa
                trực tiếp mật khẩu của người dùng nhằm bảo đảm tính toàn vẹn chữ
                ký số. Người dùng chỉ có thể tự đặt lại mật khẩu qua luồng phục
                hồi mã hóa đầu-cuối (End-to-End Encrypted Reset).
              </p>
              <div className="pt-1.5 flex items-center gap-1.5 text-[#7e766a] text-[11px] font-medium">
                <span className="material-symbols-outlined text-[15px]">
                  enhanced_encryption
                </span>
                <span>Zero-Knowledge Credential Vault v4.2</span>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Role-Driven Activity Feed (60% -> col-span-7) */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            {/* ================= CARD 4: CUSTOMER ACTIVITY ================= */}
            <div
              className={`bg-[#ffffff] rounded-2xl p-6 shadow-xs border border-[#cfc5b8]/30 flex flex-col gap-4 transition-all duration-300 ${
                currentRole === "customer"
                  ? "ring-1 ring-[#6c5937]/30 shadow-md opacity-100"
                  : "opacity-80 hover:opacity-100"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-1 gap-2 border-b border-[#cfc5b8]/20">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#6c5937] text-[22px]">
                    inventory_2
                  </span>
                  <h2 className="font-serif text-lg font-bold text-[#1c1b19]">
                    Hoạt Động Khách Hàng (Customer Scope)
                  </h2>
                </div>
                <span className="px-2.5 py-0.5 bg-[#caebc9]/70 text-[#4e6b50] text-[11px] rounded font-semibold self-start sm:self-auto">
                  9 Giao Dịch Tuần Hoàn
                </span>
              </div>

              {/* Editorial Policy Note */}
              <div className="p-3 bg-[#f7f3ef] rounded-xl flex items-start gap-2.5 text-[#4c463c] text-xs">
                <span className="material-symbols-outlined text-[#6c5937] text-[18px] shrink-0 mt-0.5">
                  info
                </span>
                <p className="leading-relaxed">
                  <strong className="text-[#1c1b19]">Lưu ý nghiệp vụ:</strong> Tài
                  khoản CUSTOMER chỉ tham gia thuê thiết bị (RENT) và mua hiện vật
                  (THRIFT). Tuyệt đối KHÔNG có quyền sở hữu sản phẩm hay tạo mục
                  đăng trên sàn.
                </p>
              </div>

              {/* Sub-Section: RENT Activity */}
              <div className="flex flex-col gap-3 pt-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#6c5937]"></span>
                    <span className="text-xs font-bold uppercase tracking-wider text-[#1c1b19]">
                      Tổng Đơn RENT (9 Đơn Lưu Ký)
                    </span>
                  </div>
                  <span className="text-[#48654b] text-[11px] font-semibold">
                    1 Đang Thuê · 8 Hoàn Tất · 0 Tranh Chấp
                  </span>
                </div>

                {/* Active Custody Order Card */}
                <div className="p-4 bg-[#f7f3ef] rounded-xl flex flex-col gap-2 border border-[#cfc5b8]/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-[#1c1b19] text-xs">
                        #RH-RNT-2024-8841
                      </span>
                      <span className="px-2 py-0.5 bg-[#6c5937] text-[#ffffff] text-[10px] font-semibold rounded">
                        Đang Lưu Ký
                      </span>
                    </div>
                    <span className="text-[#7f5227] text-xs font-semibold">
                      Thời hạn còn 2 ngày
                    </span>
                  </div>

                  <h3 className="font-serif text-sm sm:text-base font-bold text-[#1c1b19]">
                    Canon EOS R6 Mark II Mirrorless Kit (24-70mm f/2.8L IS)
                  </h3>

                  <div className="flex flex-wrap items-center justify-between text-[#4c463c] text-xs pt-1 border-t border-[#cfc5b8]/20">
                    <span>
                      Điểm Lưu Trữ: <strong className="text-[#1c1b19]">Da Nang Vault Locker #04</strong>
                    </span>
                    <span>
                      Giá Trị Ký Quỹ: <strong className="text-[#1c1b19]">12,500,000 ₫ (Zero-Col Tier)</strong>
                    </span>
                  </div>
                </div>

                {/* Past Completed Order Item */}
                <div className="p-3 bg-[#fdf8f5] rounded-xl flex items-center justify-between border border-[#cfc5b8]/20">
                  <div className="flex flex-col">
                    <span className="font-mono text-[11px] text-[#7e766a] font-semibold">
                      #RH-RNT-2024-8839 · Hoàn Tất 08/01/2025
                    </span>
                    <span className="text-xs font-semibold text-[#1c1b19]">
                      Leica Summicron-M 35mm f/2 ASPH (Archival Silver)
                    </span>
                  </div>
                  <span className="text-[#48654b] text-xs font-semibold flex items-center gap-1">
                    <span className="material-symbols-outlined text-[15px]">
                      check_circle
                    </span>
                    <span>Hoàn Trả &amp; Giải Ngân 100% Cọc</span>
                  </span>
                </div>
              </div>

              {/* Sub-Section: THRIFT Activity */}
              <div className="flex flex-col gap-3 pt-3 border-t border-[#cfc5b8]/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#48654b]"></span>
                    <span className="text-xs font-bold uppercase tracking-wider text-[#1c1b19]">
                      Hiện Vật Mua THRIFT (3 Di Sản Đã Mua)
                    </span>
                  </div>
                  <span className="text-[#4c463c] text-[11px] font-semibold">
                    Tổng Chi Tiêu: 74,500,000 ₫
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Item 1 */}
                  <div className="p-3 bg-[#f7f3ef] rounded-xl flex flex-col gap-1 border border-[#cfc5b8]/20">
                    <div className="flex items-center justify-between font-mono text-[10px] text-[#7e766a]">
                      <span>#RH-THF-2024-9102</span>
                      <span className="text-[#48654b] font-bold">ĐÃ GIAO AN TOÀN</span>
                    </div>
                    <span className="font-serif text-sm font-semibold text-[#1c1c18] line-clamp-1">
                      Leica M6 Classic 0.72x Rangefinder Body
                    </span>
                    <div className="flex justify-between items-baseline pt-2 mt-auto">
                      <span className="text-[10px] text-[#7e766a]">Giao dịch 02/01/2025</span>
                      <span className="text-xs font-bold text-[#1c1b19]">68,000,000 ₫</span>
                    </div>
                  </div>

                  {/* Item 2 */}
                  <div className="p-3 bg-[#f7f3ef] rounded-xl flex flex-col gap-1 border border-[#cfc5b8]/20">
                    <div className="flex items-center justify-between font-mono text-[10px] text-[#7e766a]">
                      <span>#RH-THF-2024-87402</span>
                      <span className="text-[#48654b] font-bold">ĐÃ GIAO AN TOÀN</span>
                    </div>
                    <span className="font-serif text-sm font-semibold text-[#1c1c18] line-clamp-1">
                      Contax T2 Titanium Black P&amp;S Camera
                    </span>
                    <div className="flex justify-between items-baseline pt-2 mt-auto">
                      <span className="text-[10px] text-[#7e766a]">Giao dịch 19/12/2024</span>
                      <span className="text-xs font-bold text-[#1c1b19]">16,500,000 ₫</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ================= CARD 5: SHOP OWNER ACTIVITY ================= */}
            <div
              className={`bg-[#ffffff] rounded-2xl p-6 shadow-xs border border-[#cfc5b8]/30 flex flex-col gap-4 transition-all duration-300 ${
                currentRole === "owner"
                  ? "ring-1 ring-[#7f5227]/40 shadow-md opacity-100"
                  : "opacity-80 hover:opacity-100"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-1 gap-2 border-b border-[#cfc5b8]/20">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#7f5227] text-[22px]">
                    store
                  </span>
                  <h2 className="font-serif text-lg font-bold text-[#1c1b19]">
                    Nghiệp Vụ Chủ Xưởng (Shop Owner Scope)
                  </h2>
                </div>
                <span className="px-2.5 py-0.5 bg-[#ece7e4] text-[#4c463c] text-[11px] uppercase rounded font-semibold self-start sm:self-auto">
                  Chế Độ Xem Thẩm Quyền Xưởng
                </span>
              </div>

              {/* Banner phân tách rõ ràng */}
              <div className="p-3 bg-[#ece7e4] rounded-xl flex items-center justify-between gap-3 border border-[#cfc5b8]/20">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#7f5227] text-[18px]">
                    verified
                  </span>
                  <span className="text-xs text-[#1c1b19] font-semibold">
                    Dành riêng cho vai trò SHOP OWNER:{" "}
                    <span className="text-[#6c5937] italic font-bold">
                      Atelier Chronos &amp; Optics (Vũ Thanh Tùng)
                    </span>
                  </span>
                </div>
                <span className="text-[#7e766a] font-mono text-[11px] hidden md:inline">
                  NODE #ATELIER-01
                </span>
              </div>

              {/* Metric Panels Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* RENT Inventory Panel */}
                <div className="p-4 bg-[#f7f3ef] rounded-xl flex flex-col justify-between gap-3 border border-[#cfc5b8]/20">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase tracking-wider text-[#7e766a] font-bold">
                        Hiện Vật Niêm Yết RENT
                      </span>
                      <span className="px-2 py-0.5 bg-[#86724d] text-[#fffbff] text-[10px] rounded font-bold">
                        42 Hiện Vật
                      </span>
                    </div>
                    <span className="font-serif text-2xl font-bold text-[#1c1b19]">
                      42 <span className="font-sans text-xs text-[#4c463c] font-normal">sản phẩm thuê</span>
                    </span>

                    <div className="mt-2 p-2 bg-[#ffffff] rounded-lg flex flex-col gap-1 text-[#4c463c] text-xs border border-[#cfc5b8]/20">
                      <div className="flex items-center justify-between text-[#7f5227] font-semibold text-[11px]">
                        <span className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#7f5227]"></span>
                          Yêu cầu kiểm duyệt chờ Admin:
                        </span>
                        <span className="font-bold">2 sản phẩm</span>
                      </div>
                      <span className="text-[#7e766a] text-[10px] truncate">
                        • Hasselblad 907X 50C Kit · Angénieux Optimo Zoom
                      </span>
                    </div>
                  </div>

                  <Link
                    to="/admin/rent/listings"
                    className="w-full py-2 bg-[#f2ede9] hover:bg-[#ece7e4] text-[#1c1b19] rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1 text-center"
                  >
                    <span>Duyệt Sản Phẩm RENT →</span>
                  </Link>
                </div>

                {/* THRIFT Catalog Panel */}
                <div className="p-4 bg-[#f7f3ef] rounded-xl flex flex-col justify-between gap-3 border border-[#cfc5b8]/20">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase tracking-wider text-[#7e766a] font-bold">
                        Kho Mục Đăng THRIFT
                      </span>
                      <span className="px-2 py-0.5 bg-[#caebc9] text-[#4e6b50] text-[10px] rounded font-bold">
                        18 Mục Mở Bán
                      </span>
                    </div>
                    <span className="font-serif text-2xl font-bold text-[#1c1b19]">
                      18 <span className="font-sans text-xs text-[#4c463c] font-normal">độc bản niêm yết</span>
                    </span>

                    <div className="mt-2 p-2 bg-[#ffffff] rounded-lg flex flex-col gap-1 text-[#4c463c] text-xs border border-[#cfc5b8]/20">
                      <div className="flex items-center justify-between text-[#6c5937] font-semibold text-[11px]">
                        <span className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#6c5937]"></span>
                          Chờ duyệt thẩm định:
                        </span>
                        <span className="font-bold">1 mục đăng</span>
                      </div>
                      <span className="text-[#7e766a] text-[10px] truncate">
                        • Rolex Oyster Perpetual 36 (Đã bán đứt: 342)
                      </span>
                    </div>
                  </div>

                  <Link
                    to="/admin/thrift/listings"
                    className="w-full py-2 bg-[#f2ede9] hover:bg-[#ece7e4] text-[#1c1b19] rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1 text-center"
                  >
                    <span>Duyệt Mục Đăng THRIFT →</span>
                  </Link>
                </div>
              </div>

              {/* Active Dispatch & Packaging Logs */}
              <div className="p-3 bg-[#f2ede9] rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs border border-[#cfc5b8]/20">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1 text-[#1c1b19] font-semibold">
                    <span className="material-symbols-outlined text-[#6c5937] text-[17px]">
                      local_shipping
                    </span>
                    14 Đơn RENT Đang Điều Phối
                  </span>
                  <span className="text-[#cfc5b8]">·</span>
                  <span className="flex items-center gap-1 text-[#1c1b19] font-semibold">
                    <span className="material-symbols-outlined text-[#48654b] text-[17px]">
                      inventory
                    </span>
                    6 Đơn THRIFT Niêm Phong Nanuk
                  </span>
                </div>
                <span className="text-[#7e766a] text-[11px]">
                  Kiểm tra bảo hiểm hàng hóa: Hợp lệ
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. FOOTER LINKAGE & BREADCRUMB */}
        <div className="pt-4 border-t border-[#cfc5b8]/20 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#4c463c]">
          <Link
            to="/admin/users"
            className="text-[#6c5937] hover:text-[#7f5227] font-semibold flex items-center gap-1 transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">
              arrow_back
            </span>
            <span>Quay lại danh sách Người Dùng (/admin/users)</span>
          </Link>

          <div className="flex items-center gap-3 text-[#7e766a] text-[11px] uppercase font-mono">
            <span>Sổ Cái Người Dùng: BẢO VỆ MÃ HÓA</span>
            <span>·</span>
            <span>AUDIT SHA-256: 0x94b2...8e11</span>
          </div>
        </div>
      </div>

      {/* 4. STATUS CHANGE CONFIRMATION MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-[#1c1b19]/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#ffffff] rounded-2xl max-w-lg w-full p-6 lg:p-7 flex flex-col gap-4 shadow-2xl relative border border-[#cfc5b8]/40">
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-[#4c463c] hover:text-[#1c1b19] p-1 rounded-lg transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">
                close
              </span>
            </button>

            {/* Modal Header */}
            <div className="flex flex-col gap-1 pr-6">
              <div className="flex items-center gap-1.5 text-[#6c5937]">
                <span className="material-symbols-outlined text-[20px]">
                  manage_accounts
                </span>
                <span className="text-[11px] uppercase font-bold tracking-wider">
                  Thao Tác Quản Trị Hệ Thống
                </span>
              </div>
              <h3 className="font-serif text-xl font-bold text-[#1c1b19]">
                Thay Đổi Trạng Thái Tài Khoản
              </h3>
              <p className="text-xs text-[#4c463c]">
                Đối tượng áp dụng:{" "}
                <strong className="text-[#1c1b19]">
                  {activeProfile.fullName}
                </strong>{" "}
                (<span className="font-mono">{activeProfile.userId}</span>)
              </p>
            </div>

            {/* State Selection Radios */}
            <div className="flex flex-col gap-2 pt-1">
              <label className="text-xs font-semibold text-[#1c1b19]">
                Chọn Trạng Thái Hoạt Động Mới:
              </label>
              <div className="grid grid-cols-1 gap-2">
                <label className="p-3 bg-[#f7f3ef] hover:bg-[#f2ede9] rounded-xl flex items-center justify-between cursor-pointer transition-colors border border-transparent hover:border-[#cfc5b8]/30">
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="account_status_radio"
                      value="active"
                      checked={modalRadioStatus === "active"}
                      onChange={() => setModalRadioStatus("active")}
                      className="w-4 h-4 text-[#6c5937] focus:ring-0 cursor-pointer"
                    />
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-[#1c1b19]">
                        Hoạt Động (Active)
                      </span>
                      <span className="text-[11px] text-[#4c463c]">
                        Người dùng được thực hiện đầy đủ giao dịch RENT/THRIFT bình thường.
                      </span>
                    </div>
                  </div>
                  <span className="w-2.5 h-2.5 rounded-full bg-[#48654b] shrink-0"></span>
                </label>

                <label className="p-3 bg-[#f7f3ef] hover:bg-[#f2ede9] rounded-xl flex items-center justify-between cursor-pointer transition-colors border border-transparent hover:border-[#cfc5b8]/30">
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="account_status_radio"
                      value="suspended"
                      checked={modalRadioStatus === "suspended"}
                      onChange={() => setModalRadioStatus("suspended")}
                      className="w-4 h-4 text-[#ba1a1a] focus:ring-0 cursor-pointer"
                    />
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-[#ba1a1a]">
                        Tạm Khóa (Suspend)
                      </span>
                      <span className="text-[11px] text-[#4c463c]">
                        Đình chỉ đăng nhập, khóa ký quỹ lưu trữ và đóng băng giao dịch đang chờ.
                      </span>
                    </div>
                  </div>
                  <span className="w-2.5 h-2.5 rounded-full bg-[#ba1a1a] shrink-0"></span>
                </label>

                <label className="p-3 bg-[#f7f3ef] hover:bg-[#f2ede9] rounded-xl flex items-center justify-between cursor-pointer transition-colors border border-transparent hover:border-[#cfc5b8]/30">
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="account_status_radio"
                      value="pending"
                      checked={modalRadioStatus === "pending"}
                      onChange={() => setModalRadioStatus("pending")}
                      className="w-4 h-4 text-[#7f5227] focus:ring-0 cursor-pointer"
                    />
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-[#7f5227]">
                        Chờ Xác Minh Lại (Pending Re-KYC)
                      </span>
                      <span className="text-[11px] text-[#4c463c]">
                        Yêu cầu người dùng đối soát CCCD hoặc sinh trắc học trước khi tiếp tục.
                      </span>
                    </div>
                  </div>
                  <span className="w-2.5 h-2.5 rounded-full bg-[#7f5227] shrink-0"></span>
                </label>
              </div>
            </div>

            {/* Suspension Detail Option (Conditional) */}
            {modalRadioStatus === "suspended" && (
              <div className="flex flex-col gap-1.5 p-3 bg-[#ffdad6]/60 rounded-xl border border-[#ba1a1a]/20 animate-fade-in">
                <label className="text-[11px] uppercase font-bold text-[#ba1a1a]">
                  Lý do áp dụng chế tài:
                </label>
                <select
                  value={suspensionReason}
                  onChange={(e) => setSuspensionReason(e.target.value)}
                  className="w-full bg-[#ffffff] p-2 rounded-lg text-[#1c1b19] text-xs outline-none border border-[#cfc5b8]/40 cursor-pointer"
                >
                  <option value="violation">
                    Nghi ngờ vi phạm tiêu chuẩn bảo quản thiết bị
                  </option>
                  <option value="dispute">
                    Khiếu nại tranh chấp chưa hoàn tất với chủ xưởng
                  </option>
                  <option value="security">
                    Yêu cầu bảo mật từ chính chủ tài khoản
                  </option>
                  <option value="other">
                    Vi phạm điều khoản ký quỹ lưu trữ di sản
                  </option>
                </select>
              </div>
            )}

            {/* Admin Audit Note */}
            <div className="flex flex-col gap-1">
              <label
                htmlFor="admin-audit-note"
                className="text-xs font-semibold text-[#1c1b19]"
              >
                Biên Bản Quyết Định Hành Chính (Audit Note):
              </label>
              <textarea
                id="admin-audit-note"
                value={auditNote}
                onChange={(e) => setAuditNote(e.target.value)}
                placeholder="Nhập tóm tắt biên bản quyết định hành chính, căn cứ điều lệ và mã sự vụ..."
                rows={3}
                className="w-full bg-[#f7f3ef] p-3 rounded-xl text-xs text-[#1c1b19] outline-none resize-none border border-[#cfc5b8]/30 focus:border-[#6c5937]"
              />
            </div>

            {/* Modal Action Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#cfc5b8]/20">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-[#4c463c] hover:text-[#1c1b19] text-xs font-semibold rounded-lg transition-colors"
              >
                Đóng Hộp Thoại
              </button>
              <button
                type="button"
                onClick={handleConfirmStatusChange}
                className="px-4 py-2 bg-[#1c1b19] text-[#fdf8f5] hover:bg-[#6c5937] text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">
                  check
                </span>
                <span>Xác Nhận Thay Đổi</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDetail;
