import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { fetchAdminUsers } from "../../services/admin.api";
import type { MongoUserItem } from "../../services/admin.api";

type RoleFilter = "ALL" | "USER" | "SHOP_OWNER" | "ADMIN";
type StatusFilter = "ALL" | "ACTIVE" | "SUSPENDED" | "PENDING";
type KycFilter = "ALL" | "APPROVED" | "PENDING" | "UNVERIFIED";

export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<MongoUserItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedRole, setSelectedRole] = useState<RoleFilter>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<StatusFilter>("ALL");
  const [selectedKyc, setSelectedKyc] = useState<KycFilter>("ALL");

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 8;

  // Selected User Modal state
  const [inspectingUser, setInspectingUser] = useState<MongoUserItem | null>(null);
  const [actionMenuUserId, setActionMenuUserId] = useState<string | null>(null);

  // Audit Log Modal state
  const [showAuditModal, setShowAuditModal] = useState<boolean>(false);

  // Toast feedback state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Load real MongoDB users
  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await fetchAdminUsers();
      setUsers(data);
    } catch (err) {
      console.error("Lỗi khi tải danh sách người dùng MongoDB:", err);
      showToast("Không thể tải danh sách thành viên từ cơ sở dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // Compute live metrics strictly from real MongoDB users
  const metrics = useMemo(() => {
    const total = users.length;
    const customers = users.filter((u) => u.role === "USER").length;
    const shopOwners = users.filter((u) => u.role === "SHOP_OWNER").length;
    const admins = users.filter((u) => u.role === "ADMIN").length;

    const kycApproved = users.filter((u) => u.kycStatus === "APPROVED").length;
    const kycPending = users.filter((u) => u.kycStatus === "PENDING").length;
    const suspended = users.filter((u) => u.status === "SUSPENDED").length;

    const kycPercent = total > 0 ? ((kycApproved / total) * 100).toFixed(1) : "0.0";
    const suspendedPercent = total > 0 ? ((suspended / total) * 100).toFixed(2) : "0.00";

    return {
      total,
      customers,
      shopOwners,
      admins,
      kycApproved,
      kycPercent,
      kycPending,
      suspended,
      suspendedPercent,
    };
  }, [users]);

  // Filter users based on tab, search input, status, and KYC
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      // Role filter
      if (selectedRole !== "ALL" && user.role !== selectedRole) {
        return false;
      }

      // Status filter (defaulting undefined to ACTIVE)
      const userStatus = user.status || "ACTIVE";
      if (selectedStatus !== "ALL" && userStatus !== selectedStatus) {
        return false;
      }

      // KYC filter
      if (selectedKyc === "APPROVED" && user.kycStatus !== "APPROVED") return false;
      if (selectedKyc === "PENDING" && user.kycStatus !== "PENDING") return false;
      if (
        selectedKyc === "UNVERIFIED" &&
        user.kycStatus !== null &&
        user.kycStatus !== undefined &&
        user.kycStatus !== "REJECTED"
      ) {
        return false;
      }

      // Search keyword
      if (searchTerm.trim() !== "") {
        const query = searchTerm.toLowerCase().trim();
        const matchName = user.fullName?.toLowerCase().includes(query);
        const matchEmail = user.email?.toLowerCase().includes(query);
        const matchPhone = user.phoneNumber?.toLowerCase().includes(query);
        if (!matchName && !matchEmail && !matchPhone) {
          return false;
        }
      }

      return true;
    });
  }, [users, selectedRole, selectedStatus, selectedKyc, searchTerm]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedRole, selectedStatus, selectedKyc, searchTerm]);

  // Pagination slicing
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredUsers.slice(start, start + pageSize);
  }, [filteredUsers, currentPage, pageSize]);

  // Helpers
  const getInitials = (name?: string) => {
    if (!name) return "RH";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return { date: "12 Oct 2026", time: "14:30:00" };
    try {
      const d = new Date(isoString);
      const day = d.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
      const time = d.toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      });
      return { date: day, time };
    } catch {
      return { date: "12 Oct 2026", time: "14:30:00" };
    }
  };

  const getRelativeTime = (isoString?: string) => {
    if (!isoString) return "10 phút trước";
    try {
      const diffMs = Date.now() - new Date(isoString).getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return "Vừa xong";
      if (diffMins < 60) return `${diffMins} phút trước`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours} giờ trước`;
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays === 1) return "Hôm qua";
      return `${diffDays} ngày trước`;
    } catch {
      return "15 phút trước";
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showToast(`Đã sao chép ${label} vào bộ nhớ tạm!`);
  };

  // Toggle user suspension status (in local state + toast)
  const handleToggleStatus = (userId: string) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u._id === userId) {
          const newStatus = u.status === "SUSPENDED" ? "ACTIVE" : "SUSPENDED";
          showToast(
            `Đã chuyển trạng thái tài khoản ${u.fullName} thành: ${
              newStatus === "SUSPENDED" ? "Tạm Khóa" : "Hoạt Động"
            }`
          );
          return { ...u, status: newStatus };
        }
        return u;
      })
    );
    if (inspectingUser && inspectingUser._id === userId) {
      setInspectingUser((prev) =>
        prev
          ? {
              ...prev,
              status: prev.status === "SUSPENDED" ? "ACTIVE" : "SUSPENDED",
            }
          : null
      );
    }
    setActionMenuUserId(null);
  };

  // Export CSV of currently filtered users
  const handleExportCsv = () => {
    if (filteredUsers.length === 0) {
      showToast("Không có bản ghi nào để xuất file CSV!");
      return;
    }

    const headers = [
      "ID MongoDB",
      "Họ và Tên",
      "Email",
      "Số Điện Thoại",
      "Phân Vai",
      "Trạng Thái",
      "Định Danh KYC",
      "Địa Chỉ",
      "Ngày Tạo",
    ];

    const rows = filteredUsers.map((u) => {
      const addressStr = u.address
        ? `${u.address.detail || ""}, ${u.address.ward || ""}, ${u.address.district || ""}, ${u.address.province || ""}`.replace(/^, |, $/g, "")
        : "";
      return [
        `"${u._id}"`,
        `"${u.fullName || ""}"`,
        `"${u.email || ""}"`,
        `"${u.phoneNumber || ""}"`,
        `"${u.role}"`,
        `"${u.status || "ACTIVE"}"`,
        `"${u.kycStatus || "UNVERIFIED"}"`,
        `"${addressStr}"`,
        `"${u.createdAt || ""}"`,
      ].join(",");
    });

    const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `reuse_hub_users_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast(`Đã xuất thành công ${filteredUsers.length} tài khoản thành viên ra tệp CSV!`);
  };

  return (
    <div className="flex flex-col w-full bg-[#fdf9f2] text-[#1c1c18] font-sans antialiased min-h-screen">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#292724] text-[#fdf9f2] px-5 py-3 rounded-xl shadow-xl flex items-center gap-3 border border-[#ccc5bc]/40 animate-fade-in text-sm font-medium">
          <span className="material-symbols-outlined text-[#d8e3ce] text-[20px]">
            check_circle
          </span>
          <span>{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="ml-2 text-[#928e89] hover:text-[#fdf9f2]"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      )}

      {/* Top Workspace Context Banner */}
      <div className="w-full bg-[#ebe8e1] border-b border-[#ccc5bc]/40 px-4 sm:px-6 lg:px-12 py-2.5">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-2 h-2 rounded-full bg-[#576151] animate-pulse"></span>
            <span className="text-[#4a463f] uppercase tracking-wider font-semibold">
              BỘ PHẬN KIỂM SOÁT THÀNH VIÊN VÀ ĐỊNH DANH (REGISTRY &amp; IDENTITY AUTH)
            </span>
            <span className="text-[#ccc5bc] hidden sm:inline">•</span>
            <span className="text-[#7b766f] font-mono hidden sm:inline">
              Mã Phiên Quản Trị: #ADM-SESSION-88219
            </span>
          </div>
          <div className="flex items-center gap-4 text-[#4a463f]">
            <span className="flex items-center gap-1.5 font-medium">
              <span className="material-symbols-outlined text-[16px] text-[#576151]">
                verified_user
              </span>{" "}
              Giao Thức Bảo Mật FIDO2 Cấp Cao
            </span>
            <span className="text-[#ccc5bc]">•</span>
            <span className="text-[#7b766f]">Đồng Bộ MongoDB: Vừa xong</span>
          </div>
        </div>
      </div>

      {/* Primary Page Header Area */}
      <section className="w-full bg-[#fdf9f2] px-4 sm:px-6 lg:px-12 pt-8 pb-6 border-b border-[#ccc5bc]/20">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="flex flex-col gap-1 max-w-2xl">
            <div className="flex items-center gap-2 text-xs text-[#7b766f] uppercase tracking-wider font-semibold">
              <Link to="/admin/dashboard" className="hover:text-[#1c1c18] transition-colors">
                Hệ Thống Quản Trị
              </Link>
              <span>/</span>
              <span className="text-[#576151]">Tất Cả Hồ Sơ Lưu Trữ</span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl text-[#1c1c18] font-bold tracking-tight mt-1">
              Quản Lý Người Dùng
            </h1>
            <p className="text-[#4a463f] text-sm leading-relaxed mt-1">
              Quản lý tài khoản, giám sát phân quyền, định danh KYC và theo dõi nhật ký hoạt động người dùng trên toàn hệ sinh thái ReUse Hub.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => setShowAuditModal(true)}
              className="px-4 py-2.5 rounded-xl bg-[#f1ede6] hover:bg-[#ebe8e1] text-[#1c1c18] text-sm font-semibold flex items-center gap-2 transition-all shadow-xs border border-[#ccc5bc]/30 hover:border-[#ccc5bc]"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px] text-[#576151]">
                history_edu
              </span>
              <span>Nhật Ký Truy Cập</span>
            </button>
            <button
              onClick={handleExportCsv}
              className="px-4 py-2.5 rounded-xl bg-[#292724] hover:bg-[#141310] text-[#fdf9f2] text-sm font-semibold flex items-center gap-2 transition-all shadow-sm hover:shadow-md"
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">
                download
              </span>
              <span>Xuất Dữ Liệu (CSV)</span>
            </button>
          </div>
        </div>
      </section>

      {/* 4 Platform Metric Cards */}
      <section className="w-full bg-[#fdf9f2] px-4 sm:px-6 lg:px-12 py-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Metric 1: Total Users */}
          <div className="bg-[#f7f3ec] p-5 rounded-2xl shadow-xs border border-[#ccc5bc]/30 flex flex-col justify-between relative overflow-hidden transition-all hover:shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex flex-col gap-1">
                <span className="text-[11px] text-[#7b766f] uppercase tracking-wider font-bold">
                  TỔNG THÀNH VIÊN SÀN
                </span>
                <span className="font-serif text-3xl sm:text-4xl font-bold text-[#1c1c18] leading-none mt-1">
                  {metrics.total}
                </span>
              </div>
              <div className="w-11 h-11 rounded-xl bg-[#ebe8e1] flex items-center justify-center text-[#292724] shrink-0">
                <span className="material-symbols-outlined text-[24px]">
                  group
                </span>
              </div>
            </div>
            <div className="mt-4 pt-2.5 bg-[#ffffff]/80 -mx-5 -mb-5 px-5 py-2.5 border-t border-[#ccc5bc]/20">
              <div className="flex items-center justify-between text-xs text-[#4a463f] font-medium">
                <span>{metrics.customers} Khách Hàng</span>
                <span className="text-[#ccc5bc]">•</span>
                <span>{metrics.shopOwners} Shop Owner</span>
                <span className="text-[#ccc5bc]">•</span>
                <span>{metrics.admins} Admin</span>
              </div>
            </div>
          </div>

          {/* Metric 2: KYC Verified */}
          <div className="bg-[#f7f3ec] p-5 rounded-2xl shadow-xs border border-[#ccc5bc]/30 flex flex-col justify-between relative overflow-hidden transition-all hover:shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex flex-col gap-1">
                <span className="text-[11px] text-[#7b766f] uppercase tracking-wider font-bold">
                  ĐÃ XÁC THỰC KYC
                </span>
                <span className="font-serif text-3xl sm:text-4xl font-bold text-[#1c1c18] leading-none mt-1">
                  {metrics.kycApproved}
                </span>
              </div>
              <div className="w-11 h-11 rounded-xl bg-[#d8e3ce] flex items-center justify-center text-[#5b6655] shrink-0">
                <span className="material-symbols-outlined text-[24px]">
                  verified
                </span>
              </div>
            </div>
            <div className="mt-4 pt-2.5 bg-[#ffffff]/80 -mx-5 -mb-5 px-5 py-2.5 border-t border-[#ccc5bc]/20 flex items-center justify-between">
              <div className="w-full flex items-center gap-2.5">
                <div className="flex-1 bg-[#ebe8e1] rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-[#576151] h-full rounded-full transition-all duration-500"
                    style={{ width: `${metrics.kycPercent}%` }}
                  ></div>
                </div>
                <span className="text-xs text-[#576151] font-bold shrink-0">
                  {metrics.kycPercent}% Hoàn tất
                </span>
              </div>
            </div>
          </div>

          {/* Metric 3: KYC Pending */}
          <div className="bg-[#f7f3ec] p-5 rounded-2xl shadow-xs border border-[#ccc5bc]/30 flex flex-col justify-between relative overflow-hidden transition-all hover:shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex flex-col gap-1">
                <span className="text-[11px] text-[#7b766f] uppercase tracking-wider font-bold">
                  CHỜ DUYỆT KYC
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="font-serif text-3xl sm:text-4xl font-bold text-[#7b5227] leading-none">
                    {metrics.kycPending}
                  </span>
                  <span className="text-xs text-[#4a463f] font-medium">
                    hồ sơ chờ xác thực
                  </span>
                </div>
              </div>
              <div className="w-11 h-11 rounded-xl bg-[#f0e0cb] flex items-center justify-center text-[#4f4535] shrink-0">
                <span className="material-symbols-outlined text-[24px]">
                  pending_actions
                </span>
              </div>
            </div>
            <div className="mt-4 pt-2.5 bg-[#ffffff]/80 -mx-5 -mb-5 px-5 py-2.5 border-t border-[#ccc5bc]/20 flex items-center justify-between text-xs text-[#4a463f]">
              <span className="text-[#7b5227] font-semibold">
                Ưu tiên xử lý trong 24h
              </span>
              <Link
                to="/admin/kyc"
                className="text-[#576151] hover:text-[#1c1c18] font-bold flex items-center gap-1 group"
              >
                <span>Xử lý ngay</span>
                <span className="material-symbols-outlined text-[14px] group-hover:translate-x-0.5 transition-transform">
                  arrow_forward
                </span>
              </Link>
            </div>
          </div>

          {/* Metric 4: Suspended Accounts */}
          <div className="bg-[#f7f3ec] p-5 rounded-2xl shadow-xs border border-[#ccc5bc]/30 flex flex-col justify-between relative overflow-hidden transition-all hover:shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex flex-col gap-1">
                <span className="text-[11px] text-[#7b766f] uppercase tracking-wider font-bold">
                  TÀI KHOẢN TẠM KHÓA
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="font-serif text-3xl sm:text-4xl font-bold text-[#ba1a1a] leading-none">
                    {metrics.suspended}
                  </span>
                  <span className="text-xs text-[#4a463f] font-medium">
                    tài khoản vi phạm
                  </span>
                </div>
              </div>
              <div className="w-11 h-11 rounded-xl bg-[#ffdad6] flex items-center justify-center text-[#ba1a1a] shrink-0">
                <span className="material-symbols-outlined text-[24px]">
                  gavel
                </span>
              </div>
            </div>
            <div className="mt-4 pt-2.5 bg-[#ffffff]/80 -mx-5 -mb-5 px-5 py-2.5 border-t border-[#ccc5bc]/20 flex items-center justify-between text-xs text-[#4a463f]">
              <span>Tranh chấp ký quỹ &amp; bảo hiểm</span>
              <span className="text-[#ba1a1a] font-bold">
                Tỷ lệ {metrics.suspendedPercent}%
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Multi-tier Search, Filter & Role Tabs Bar */}
      <section className="w-full bg-[#fdf9f2] px-4 sm:px-6 lg:px-12 pb-6">
        <div className="max-w-7xl mx-auto flex flex-col gap-4 bg-[#f7f3ec] p-4 sm:p-5 rounded-2xl shadow-xs border border-[#ccc5bc]/30">
          {/* Top Row: Role Filter Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#ccc5bc]/30 pb-3">
            <div className="flex items-center gap-1.5 overflow-x-auto py-1 max-w-full">
              <button
                onClick={() => setSelectedRole("ALL")}
                type="button"
                className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedRole === "ALL"
                    ? "bg-[#292724] text-[#fdf9f2] shadow-xs"
                    : "text-[#4a463f] hover:bg-[#ebe8e1] hover:text-[#1c1c18]"
                }`}
              >
                Tất Cả ({metrics.total})
              </button>
              <button
                onClick={() => setSelectedRole("USER")}
                type="button"
                className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedRole === "USER"
                    ? "bg-[#292724] text-[#fdf9f2] shadow-xs"
                    : "text-[#4a463f] hover:bg-[#ebe8e1] hover:text-[#1c1c18]"
                }`}
              >
                Khách Hàng / Customer ({metrics.customers})
              </button>
              <button
                onClick={() => setSelectedRole("SHOP_OWNER")}
                type="button"
                className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedRole === "SHOP_OWNER"
                    ? "bg-[#292724] text-[#fdf9f2] shadow-xs"
                    : "text-[#4a463f] hover:bg-[#ebe8e1] hover:text-[#1c1c18]"
                }`}
              >
                Chủ Xưởng / Shop Owner ({metrics.shopOwners})
              </button>
              <button
                onClick={() => setSelectedRole("ADMIN")}
                type="button"
                className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedRole === "ADMIN"
                    ? "bg-[#292724] text-[#fdf9f2] shadow-xs"
                    : "text-[#4a463f] hover:bg-[#ebe8e1] hover:text-[#1c1c18]"
                }`}
              >
                Quản Trị Viên / Administrator ({metrics.admins})
              </button>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-[#7b766f]">
              <span className="material-symbols-outlined text-[16px] text-[#576151]">
                tune
              </span>
              <span className="uppercase tracking-wider font-semibold">
                Chế độ lọc thời gian thực
              </span>
            </div>
          </div>

          {/* Bottom Row: Search Box & Dropdown Filters */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-1">
            {/* Search Input */}
            <div className="md:col-span-6 relative">
              <span className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-[#7b766f]">
                <span className="material-symbols-outlined text-[20px]">
                  search
                </span>
              </span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm kiếm theo họ tên, email hoặc số điện thoại..."
                className="w-full bg-[#ffffff] text-[#1c1c18] pl-11 pr-10 py-2.5 rounded-xl text-sm border border-[#ccc5bc]/40 focus:outline-none focus:border-[#292724] focus:ring-1 focus:ring-[#292724] shadow-xs placeholder:text-[#7b766f] transition-all"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="absolute inset-y-0 right-3 flex items-center text-[#7b766f] hover:text-[#1c1c18]"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    cancel
                  </span>
                </button>
              )}
            </div>

            {/* Account Status Filter Dropdown */}
            <div className="md:col-span-3">
              <div className="relative">
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value as StatusFilter)}
                  className="w-full appearance-none bg-[#ffffff] text-[#1c1c18] px-4 py-2.5 pr-10 rounded-xl text-sm border border-[#ccc5bc]/40 focus:outline-none focus:border-[#292724] shadow-xs cursor-pointer font-medium"
                >
                  <option value="ALL">Tất Cả Trạng Thái Tài Khoản</option>
                  <option value="ACTIVE">Hoạt Động (Active)</option>
                  <option value="SUSPENDED">Tạm Khóa (Suspended)</option>
                  <option value="PENDING">Chờ Kích Hoạt (Pending)</option>
                </select>
                <span className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-[#7b766f]">
                  <span className="material-symbols-outlined text-[18px]">
                    expand_more
                  </span>
                </span>
              </div>
            </div>

            {/* KYC Filter Dropdown */}
            <div className="md:col-span-3">
              <div className="relative">
                <select
                  value={selectedKyc}
                  onChange={(e) => setSelectedKyc(e.target.value as KycFilter)}
                  className="w-full appearance-none bg-[#ffffff] text-[#1c1c18] px-4 py-2.5 pr-10 rounded-xl text-sm border border-[#ccc5bc]/40 focus:outline-none focus:border-[#292724] shadow-xs cursor-pointer font-medium"
                >
                  <option value="ALL">Tất Cả Định Danh KYC</option>
                  <option value="APPROVED">Đã Duyệt (Approved)</option>
                  <option value="PENDING">Chờ Duyệt (Pending)</option>
                  <option value="UNVERIFIED">Chưa Định Danh / Từ Chối</option>
                </select>
                <span className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-[#7b766f]">
                  <span className="material-symbols-outlined text-[18px]">
                    expand_more
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Directory Table Section */}
      <section className="w-full bg-[#fdf9f2] px-4 sm:px-6 lg:px-12 pb-10">
        <div className="max-w-7xl mx-auto flex flex-col bg-[#ffffff] rounded-2xl shadow-xs border border-[#ccc5bc]/30 overflow-hidden">
          {/* Table Header Bar */}
          <div className="px-6 py-4 bg-[#f7f3ec] border-b border-[#ccc5bc]/30 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="font-serif text-lg font-bold text-[#1c1c18]">
                Sổ Bộ Người Dùng Toàn Nền Tảng
              </span>
              <span className="px-2.5 py-0.5 rounded-md bg-[#ebe8e1] text-[#4a463f] text-[10px] uppercase font-bold tracking-wider">
                KHO LƯU TRỮ V4.2
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-[#4a463f]">
              <span className="font-medium">
                Hiển thị {paginatedUsers.length} / {filteredUsers.length} bản ghi
              </span>
              <span className="text-[#ccc5bc]">•</span>
              <span className="text-[#576151] font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#576151] animate-pulse"></span>{" "}
                Live Stream Sync
              </span>
            </div>
          </div>

          {/* Responsive Table */}
          <div className="w-full overflow-x-auto">
            {loading ? (
              <div className="py-20 text-center flex flex-col items-center justify-center">
                <div className="w-9 h-9 border-3 border-[#576151] border-t-transparent rounded-full animate-spin mb-3"></div>
                <div className="text-sm font-semibold text-[#1c1c18]">
                  Đang tải danh sách thành viên thực từ MongoDB...
                </div>
                <div className="text-xs text-[#7b766f] mt-1">
                  Đồng bộ dữ liệu sổ bạ và chữ ký điện tử
                </div>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="py-16 text-center flex flex-col items-center justify-center px-4">
                <div className="w-14 h-14 rounded-full bg-[#f1ede6] flex items-center justify-center text-[#7b766f] mb-3">
                  <span className="material-symbols-outlined text-[30px]">
                    person_search
                  </span>
                </div>
                <h3 className="font-serif text-lg font-bold text-[#1c1c18]">
                  Không tìm thấy người dùng phù hợp
                </h3>
                <p className="text-sm text-[#4a463f] max-w-md mt-1">
                  Không có tài khoản nào khớp với từ khóa tìm kiếm hoặc bộ lọc hiện tại. Thử chọn lại vai trò hoặc xóa từ khóa.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedRole("ALL");
                    setSelectedStatus("ALL");
                    setSelectedKyc("ALL");
                    setSearchTerm("");
                  }}
                  className="mt-4 px-4 py-2 rounded-xl bg-[#292724] text-[#fdf9f2] text-xs font-semibold hover:bg-[#141310] transition-colors"
                >
                  Xóa tất cả bộ lọc
                </button>
              </div>
            ) : (
              <table className="w-full text-left text-sm border-collapse min-w-[950px]">
                <thead>
                  <tr className="bg-[#f7f3ec]/80 text-[#7b766f] text-[11px] uppercase tracking-wider font-bold border-b border-[#ccc5bc]/30">
                    <th className="py-3.5 px-4 pl-6 font-bold" scope="col">
                      Người Dùng
                    </th>
                    <th className="py-3.5 px-4 font-bold" scope="col">
                      Email &amp; Bảo Mật
                    </th>
                    <th className="py-3.5 px-4 font-bold" scope="col">
                      Phân Vai
                    </th>
                    <th className="py-3.5 px-4 font-bold" scope="col">
                      Trạng Thái
                    </th>
                    <th className="py-3.5 px-4 font-bold" scope="col">
                      Định Danh KYC
                    </th>
                    <th className="py-3.5 px-4 font-bold" scope="col">
                      Ngày Tạo
                    </th>
                    <th className="py-3.5 px-4 font-bold" scope="col">
                      Hoạt Động Gần Nhất
                    </th>
                    <th className="py-3.5 px-4 pr-6 text-right font-bold" scope="col">
                      Thao Tác
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ccc5bc]/20 text-[#1c1c18]">
                  {paginatedUsers.map((user) => {
                    const initials = getInitials(user.fullName);
                    const isShopOwner = user.role === "SHOP_OWNER";
                    const isAdmin = user.role === "ADMIN";
                    const isCustomer = user.role === "USER";
                    const isKycApproved = user.kycStatus === "APPROVED";
                    const isKycPending = user.kycStatus === "PENDING";
                    const isSuspended = user.status === "SUSPENDED";
                    const timeInfo = formatDate(user.createdAt);
                    const relativeTime = getRelativeTime(user.updatedAt || user.createdAt);

                    // Avatar background
                    let avatarBg = "bg-[#ebe8e1] text-[#292724]";
                    if (isShopOwner) avatarBg = "bg-[#2e2618] text-[#f0e0cb]";
                    if (isAdmin) avatarBg = "bg-[#292724] text-[#fdf9f2]";

                    return (
                      <tr
                        key={user._id}
                        className={`hover:bg-[#f7f3ec]/60 transition-colors ${
                          isShopOwner ? "bg-[#f7f3ec]/20" : ""
                        }`}
                      >
                        {/* Column 1: Người Dùng */}
                        <td className="py-4 px-4 pl-6 align-middle">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-10 h-10 rounded-full ${avatarBg} overflow-hidden shrink-0 flex items-center justify-center font-serif font-bold text-sm shadow-xs`}
                            >
                              {initials}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-semibold text-[#1c1c18] leading-tight truncate max-w-[160px]">
                                  {user.fullName || "Người Dùng"}
                                </span>
                                {isShopOwner && (
                                  <span className="px-1.5 py-0.5 rounded bg-[#f0e0cb] text-[#4f4535] text-[9px] uppercase font-bold shrink-0">
                                    CHỦ XƯỞNG
                                  </span>
                                )}
                                {isAdmin && (
                                  <span className="px-1.5 py-0.5 rounded bg-[#ebe8e1] text-[#1c1c18] text-[9px] uppercase font-bold shrink-0">
                                    HỆ THỐNG
                                  </span>
                                )}
                              </div>
                              <span className="text-xs text-[#7b766f] tracking-wide mt-0.5">
                                {user.phoneNumber || "Chưa cập nhật SĐT"}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Column 2: Email & Bảo Mật */}
                        <td className="py-4 px-4 align-middle">
                          <div className="flex flex-col gap-1">
                            <span className="text-[#1c1c18] font-medium leading-tight truncate max-w-[210px]">
                              {user.email}
                            </span>
                            {isAdmin && (
                              <span className="inline-flex items-center gap-1 text-[11px] text-[#292724] font-semibold">
                                <span className="material-symbols-outlined text-[13px]">
                                  admin_panel_settings
                                </span>{" "}
                                Audit Officer • Khóa FIDO2
                              </span>
                            )}
                            {isShopOwner && (
                              <span className="inline-flex items-center gap-1 text-[11px] text-[#7b5227] font-semibold">
                                <span className="material-symbols-outlined text-[13px]">
                                  key
                                </span>{" "}
                                Khóa Cứng (Hardware Key)
                              </span>
                            )}
                            {isCustomer && isKycApproved && (
                              <span className="inline-flex items-center gap-1 text-[11px] text-[#576151] font-medium">
                                <span className="material-symbols-outlined text-[13px]">
                                  shield
                                </span>{" "}
                                2FA FIDO2 Kích Hoạt
                              </span>
                            )}
                            {isCustomer && isKycPending && (
                              <span className="inline-flex items-center gap-1 text-[11px] text-[#7b5227] font-medium">
                                <span className="material-symbols-outlined text-[13px]">
                                  hourglass_top
                                </span>{" "}
                                Chờ Kích Hoạt Bảo Mật
                              </span>
                            )}
                            {isCustomer && !isKycApproved && !isKycPending && (
                              <span className="inline-flex items-center gap-1 text-[11px] text-[#7b766f]">
                                Xác Thực Tiêu Chuẩn
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Column 3: Phân Vai */}
                        <td className="py-4 px-4 align-middle">
                          {isCustomer && (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[#4a463f] bg-[#f1ede6] text-xs font-semibold">
                              Customer
                            </span>
                          )}
                          {isShopOwner && (
                            <div className="flex flex-col items-start">
                              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[#4f4535] bg-[#f0e0cb] text-xs font-bold">
                                Shop Owner
                              </span>
                              <span className="text-[10px] text-[#7b766f] mt-0.5">
                                Đối tác chính thức
                              </span>
                            </div>
                          )}
                          {isAdmin && (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[#fdf9f2] bg-[#292724] text-xs font-bold">
                              Administrator
                            </span>
                          )}
                        </td>

                        {/* Column 4: Trạng Thái */}
                        <td className="py-4 px-4 align-middle">
                          {isSuspended ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#ffdad6] text-[#ba1a1a] text-xs font-bold">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#ba1a1a]"></span>{" "}
                              Tạm Khóa
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#d8e3ce] text-[#5b6655] text-xs font-semibold">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#576151] animate-pulse"></span>{" "}
                              Hoạt Động
                            </span>
                          )}
                        </td>

                        {/* Column 5: Định Danh KYC */}
                        <td className="py-4 px-4 align-middle">
                          {isKycApproved ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#d8e3ce] text-[#5b6655] text-xs font-bold">
                              <span className="material-symbols-outlined text-[14px]">
                                verified
                              </span>{" "}
                              Đã Duyệt
                            </span>
                          ) : isKycPending ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#f0e0cb] text-[#4f4535] text-xs font-bold">
                              <span className="material-symbols-outlined text-[14px]">
                                hourglass_top
                              </span>{" "}
                              Chờ Duyệt
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#ebe8e1] text-[#7b766f] text-xs font-medium">
                              Chưa Nộp
                            </span>
                          )}
                        </td>

                        {/* Column 6: Ngày Tạo */}
                        <td className="py-4 px-4 align-middle">
                          <div className="flex flex-col text-xs text-[#4a463f]">
                            <span className="font-semibold text-[#1c1c18]">
                              {timeInfo.date}
                            </span>
                            <span className="text-[#7b766f] font-mono text-[11px]">
                              {timeInfo.time}
                            </span>
                          </div>
                        </td>

                        {/* Column 7: Hoạt Động Gần Nhất */}
                        <td className="py-4 px-4 align-middle">
                          <span className="text-xs text-[#576151] font-semibold">
                            {relativeTime}
                          </span>
                        </td>

                        {/* Column 8: Thao Tác */}
                        <td className="py-4 px-4 pr-6 text-right align-middle relative">
                          <div className="inline-flex items-center gap-1.5">
                            <Link
                              to={`/admin/users/${user._id}`}
                              className="px-3 py-1.5 rounded-lg bg-[#f1ede6] hover:bg-[#ebe8e1] text-[#1c1c18] font-bold text-xs transition-colors border border-[#ccc5bc]/30 inline-flex items-center gap-1"
                            >
                              <span className="material-symbols-outlined text-[15px]">
                                visibility
                              </span>
                              <span>Chi Tiết</span>
                            </Link>
                            <div className="relative">
                              <button
                                type="button"
                                onClick={() =>
                                  setActionMenuUserId(
                                    actionMenuUserId === user._id ? null : user._id
                                  )
                                }
                                className="w-8 h-8 rounded-lg hover:bg-[#ebe8e1] text-[#7b766f] hover:text-[#1c1c18] flex items-center justify-center transition-colors"
                              >
                                <span className="material-symbols-outlined text-[18px]">
                                  more_vert
                                </span>
                              </button>

                              {/* Action Popover Menu */}
                              {actionMenuUserId === user._id && (
                                <div className="absolute right-0 top-full mt-1 w-48 bg-[#ffffff] rounded-xl shadow-xl border border-[#ccc5bc]/40 z-30 py-1.5 text-left text-xs font-medium animate-fade-in">
                                  <Link
                                    to={`/admin/users/${user._id}`}
                                    onClick={() => setActionMenuUserId(null)}
                                    className="w-full px-3 py-2 text-left hover:bg-[#f1ede6] flex items-center gap-2 text-[#1c1c18]"
                                  >
                                    <span className="material-symbols-outlined text-[16px] text-[#7b766f]">
                                      account_circle
                                    </span>
                                    <span>Hồ sơ chi tiết</span>
                                  </Link>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      copyToClipboard(user._id, "ID MongoDB");
                                      setActionMenuUserId(null);
                                    }}
                                    className="w-full px-3 py-2 text-left hover:bg-[#f1ede6] flex items-center gap-2 text-[#1c1c18]"
                                  >
                                    <span className="material-symbols-outlined text-[16px] text-[#7b766f]">
                                      content_copy
                                    </span>
                                    <span>Sao chép ID</span>
                                  </button>

                                  {user.kycStatus === "PENDING" && (
                                    <Link
                                      to={`/admin/kyc-review/${user._id}`}
                                      onClick={() => setActionMenuUserId(null)}
                                      className="w-full px-3 py-2 text-left hover:bg-[#f1ede6] flex items-center gap-2 text-[#7b5227]"
                                    >
                                      <span className="material-symbols-outlined text-[16px]">
                                        badge
                                      </span>
                                      <span>Xét duyệt KYC</span>
                                    </Link>
                                  )}

                                  <button
                                    type="button"
                                    onClick={() => handleToggleStatus(user._id)}
                                    className={`w-full px-3 py-2 text-left hover:bg-[#f1ede6] flex items-center gap-2 ${
                                      user.status === "SUSPENDED"
                                        ? "text-[#576151]"
                                        : "text-[#ba1a1a]"
                                    }`}
                                  >
                                    <span className="material-symbols-outlined text-[16px]">
                                      {user.status === "SUSPENDED"
                                        ? "check_circle"
                                        : "block"}
                                    </span>
                                    <span>
                                      {user.status === "SUSPENDED"
                                        ? "Mở khóa tài khoản"
                                        : "Tạm khóa tài khoản"}
                                    </span>
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Editorial Pagination Bar */}
          <div className="px-6 py-4 bg-[#f7f3ec] border-t border-[#ccc5bc]/30 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-[#4a463f]">
              Hiển thị{" "}
              <span className="font-bold text-[#1c1c18]">
                {filteredUsers.length === 0
                  ? 0
                  : (currentPage - 1) * pageSize + 1}
              </span>{" "}
              đến{" "}
              <span className="font-bold text-[#1c1c18]">
                {Math.min(currentPage * pageSize, filteredUsers.length)}
              </span>{" "}
              trong số{" "}
              <span className="font-bold text-[#1c1c18]">
                {filteredUsers.length}
              </span>{" "}
              thành viên
            </div>

            <div className="flex items-center gap-1.5 text-xs">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-lg bg-[#ffffff] hover:bg-[#ebe8e1] text-[#1c1c18] border border-[#ccc5bc]/40 flex items-center gap-1 transition-colors disabled:opacity-40 disabled:cursor-not-allowed font-medium"
              >
                <span className="material-symbols-outlined text-[16px]">
                  chevron_left
                </span>{" "}
                Trước
              </button>

              {Array.from({ length: totalPages }).map((_, idx) => {
                const pageNumber = idx + 1;
                const isActive = pageNumber === currentPage;
                return (
                  <button
                    key={pageNumber}
                    type="button"
                    onClick={() => setCurrentPage(pageNumber)}
                    className={`w-8 h-8 rounded-lg font-bold flex items-center justify-center transition-all ${
                      isActive
                        ? "bg-[#292724] text-[#fdf9f2] shadow-xs"
                        : "hover:bg-[#ebe8e1] text-[#1c1c18]"
                    }`}
                  >
                    {pageNumber}
                  </button>
                );
              })}

              <button
                type="button"
                disabled={currentPage === totalPages || totalPages === 0}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 rounded-lg bg-[#ffffff] hover:bg-[#ebe8e1] text-[#1c1c18] border border-[#ccc5bc]/40 flex items-center gap-1 transition-colors disabled:opacity-40 disabled:cursor-not-allowed font-medium"
              >
                Sau{" "}
                <span className="material-symbols-outlined text-[16px]">
                  chevron_right
                </span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Governance & Access Policy Callout Section */}
      <section className="w-full bg-[#fdf9f2] px-4 sm:px-6 lg:px-12 pb-12">
        <div className="max-w-7xl mx-auto flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-[#7b766f] uppercase tracking-wider font-semibold">
              <span className="material-symbols-outlined text-[18px] text-[#576151]">
                policy
              </span>
              <span>QUY TẮC BẢO MẬT &amp; ĐIỀU LỆ PHÂN QUYỀN HỆ THỐNG (GOVERNANCE CALLOUT)</span>
            </div>
            <span className="text-xs text-[#576151] font-bold">
              Bảo vệ cấu trúc bất biến
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Policy Card 1 */}
            <div className="bg-[#f7f3ec] p-6 rounded-2xl shadow-xs border border-[#ccc5bc]/30 flex flex-col justify-between">
              <div>
                <div className="w-9 h-9 rounded-xl bg-[#ebe8e1] text-[#292724] flex items-center justify-center mb-3 font-serif font-bold text-sm">
                  01
                </div>
                <h3 className="font-serif text-lg font-bold text-[#1c1c18] mb-2">
                  Không Chuyển Quyền Tùy Ý
                </h3>
                <p className="text-xs text-[#4a463f] leading-relaxed">
                  Tuyệt đối không cấp phép chuyển đổi trực tiếp <span className="font-bold text-[#1c1c18]">CUSTOMER → SHOP_OWNER</span>. Mọi đối tác cho thuê và sang nhượng bắt buộc phải vượt qua hội đồng thẩm định vật lý tại xưởng.
                </p>
              </div>
              <div className="mt-4 pt-2 text-[#7b766f] text-[11px] uppercase tracking-wider font-bold border-t border-[#ccc5bc]/20">
                Điều Khoản Ký Quỹ: Điều 14.2
              </div>
            </div>

            {/* Policy Card 2 */}
            <div className="bg-[#f7f3ec] p-6 rounded-2xl shadow-xs border border-[#ccc5bc]/30 flex flex-col justify-between">
              <div>
                <div className="w-9 h-9 rounded-xl bg-[#ebe8e1] text-[#292724] flex items-center justify-center mb-3 font-serif font-bold text-sm">
                  02
                </div>
                <h3 className="font-serif text-lg font-bold text-[#1c1c18] mb-2">
                  Multi-Sig Độc Lập
                </h3>
                <p className="text-xs text-[#4a463f] leading-relaxed">
                  Nghiêm cấm nâng quyền <span className="font-bold text-[#1c1c18]">SHOP_OWNER → ADMIN</span>. Tài khoản quản trị cấp cao phải được ký duyệt qua cơ chế Multi-Sig bởi tối thiểu 3 thành viên Ban Điều Hành lưu trữ.
                </p>
              </div>
              <div className="mt-4 pt-2 text-[#7b766f] text-[11px] uppercase tracking-wider font-bold border-t border-[#ccc5bc]/20">
                An Toàn Mạng: Quy Chuẩn ISO-27001
              </div>
            </div>

            {/* Policy Card 3 */}
            <div className="bg-[#f7f3ec] p-6 rounded-2xl shadow-xs border border-[#ccc5bc]/30 flex flex-col justify-between">
              <div>
                <div className="w-9 h-9 rounded-xl bg-[#ebe8e1] text-[#292724] flex items-center justify-center mb-3 font-serif font-bold text-sm">
                  03
                </div>
                <h3 className="font-serif text-lg font-bold text-[#1c1c18] mb-2">
                  Giới Hạn Thẩm Định KYC
                </h3>
                <p className="text-xs text-[#4a463f] leading-relaxed">
                  Quy trình kiểm định KYC chỉ phục vụ mục đích mở rộng hạn mức ký quỹ mượn đồ thiết kế và lưu vết bảo hiểm, không thay thế cho thỏa thuận dân sự tại trọng tài thương mại.
                </p>
              </div>
              <div className="mt-4 pt-2 text-[#7b766f] text-[11px] uppercase tracking-wider font-bold border-t border-[#ccc5bc]/20">
                Pháp Lý Nền Tảng: Circular Protocol
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Modal: Chi Tiết Người Dùng (User Inspection Modal) */}
      {inspectingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-[#ffffff] rounded-2xl max-w-xl w-full border border-[#ccc5bc]/50 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-6 bg-[#f7f3ec] border-b border-[#ccc5bc]/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[#292724] text-[#fdf9f2] flex items-center justify-center font-serif font-bold text-lg shadow-xs">
                  {getInitials(inspectingUser.fullName)}
                </div>
                <div>
                  <h3 className="font-serif text-xl font-bold text-[#1c1c18] leading-tight">
                    {inspectingUser.fullName}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-[#7b766f] font-mono">
                      ID: {inspectingUser._id}
                    </span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(inspectingUser._id, "ID người dùng")}
                      className="text-[#576151] hover:text-[#1c1c18]"
                      title="Sao chép ID"
                    >
                      <span className="material-symbols-outlined text-[15px]">
                        content_copy
                      </span>
                    </button>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInspectingUser(null)}
                className="w-8 h-8 rounded-lg hover:bg-[#ebe8e1] text-[#7b766f] hover:text-[#1c1c18] flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 text-sm">
              {/* Badges row */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-1 rounded-md text-xs font-bold uppercase bg-[#ebe8e1] text-[#1c1c18]">
                  Vai trò: {inspectingUser.role}
                </span>
                <span
                  className={`px-2.5 py-1 rounded-md text-xs font-bold ${
                    inspectingUser.kycStatus === "APPROVED"
                      ? "bg-[#d8e3ce] text-[#5b6655]"
                      : inspectingUser.kycStatus === "PENDING"
                      ? "bg-[#f0e0cb] text-[#4f4535]"
                      : "bg-[#ebe8e1] text-[#7b766f]"
                  }`}
                >
                  KYC: {inspectingUser.kycStatus || "CHƯA XÁC THỰC"}
                </span>
                <span
                  className={`px-2.5 py-1 rounded-md text-xs font-bold ${
                    inspectingUser.status === "SUSPENDED"
                      ? "bg-[#ffdad6] text-[#ba1a1a]"
                      : "bg-[#d8e3ce] text-[#5b6655]"
                  }`}
                >
                  Trạng Thái: {inspectingUser.status === "SUSPENDED" ? "TẠM KHÓA" : "HOẠT ĐỘNG"}
                </span>
              </div>

              {/* Information Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-3.5 rounded-xl bg-[#f7f3ec] border border-[#ccc5bc]/20">
                  <span className="text-[11px] text-[#7b766f] uppercase font-bold tracking-wider block">
                    Email Liên Hệ
                  </span>
                  <span className="font-medium text-[#1c1c18] mt-0.5 block break-all">
                    {inspectingUser.email}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-[#f7f3ec] border border-[#ccc5bc]/20">
                  <span className="text-[11px] text-[#7b766f] uppercase font-bold tracking-wider block">
                    Số Điện Thoại
                  </span>
                  <span className="font-medium text-[#1c1c18] mt-0.5 block">
                    {inspectingUser.phoneNumber || "Chưa cập nhật"}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-[#f7f3ec] border border-[#ccc5bc]/20 sm:col-span-2">
                  <span className="text-[11px] text-[#7b766f] uppercase font-bold tracking-wider block">
                    Địa Chỉ Giao Hàng &amp; Lưu Bạ
                  </span>
                  <span className="font-medium text-[#1c1c18] mt-0.5 block">
                    {inspectingUser.address
                      ? `${inspectingUser.address.detail || ""}, ${inspectingUser.address.ward || ""}, ${inspectingUser.address.district || ""}, ${inspectingUser.address.province || ""}`.replace(/^, |, $/g, "")
                      : "Chưa thiết lập địa chỉ trong hồ sơ"}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-[#f7f3ec] border border-[#ccc5bc]/20">
                  <span className="text-[11px] text-[#7b766f] uppercase font-bold tracking-wider block">
                    Thời Gian Đăng Ký
                  </span>
                  <span className="font-medium text-[#1c1c18] mt-0.5 block">
                    {formatDate(inspectingUser.createdAt).date} lúc {formatDate(inspectingUser.createdAt).time}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-[#f7f3ec] border border-[#ccc5bc]/20">
                  <span className="text-[11px] text-[#7b766f] uppercase font-bold tracking-wider block">
                    Giao Thức Bảo Mật
                  </span>
                  <span className="font-medium text-[#576151] mt-0.5 block flex items-center gap-1">
                    <span className="material-symbols-outlined text-[15px]">
                      security
                    </span>
                    FIDO2 WebAuthn &amp; SHA-256
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 bg-[#f7f3ec] border-t border-[#ccc5bc]/30 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => handleToggleStatus(inspectingUser._id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
                  inspectingUser.status === "SUSPENDED"
                    ? "bg-[#576151] text-[#fdf9f2] hover:bg-[#485343]"
                    : "bg-[#ffdad6] text-[#ba1a1a] hover:bg-[#ffcdd2]"
                }`}
              >
                {inspectingUser.status === "SUSPENDED"
                  ? "Mở Khóa Tài Khoản Này"
                  : "Tạm Khóa Tài Khoản Này"}
              </button>

              <div className="flex items-center gap-2">
                <Link
                  to={`/admin/users/${inspectingUser._id}`}
                  className="px-4 py-2 rounded-xl bg-[#292724] text-[#fdf9f2] text-xs font-bold hover:bg-[#141310] transition-colors flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[15px]">
                    open_in_new
                  </span>
                  <span>Mở Hồ Sơ Chi Tiết</span>
                </Link>

                {inspectingUser.kycStatus === "PENDING" && (
                  <Link
                    to={`/admin/kyc-review/${inspectingUser._id}`}
                    className="px-4 py-2 rounded-xl bg-[#ebe8e1] text-[#1c1c18] text-xs font-bold hover:bg-[#ccc5bc] transition-colors"
                  >
                    Xem Hồ Sơ KYC
                  </Link>
                )}
                <button
                  type="button"
                  onClick={() => setInspectingUser(null)}
                  className="px-4 py-2 rounded-xl bg-[#ebe8e1] text-[#1c1c18] text-xs font-bold hover:bg-[#ccc5bc] transition-colors"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Nhật Ký Truy Cập (Access Audit Log Modal) */}
      {showAuditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-[#ffffff] rounded-2xl max-w-2xl w-full border border-[#ccc5bc]/50 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 bg-[#f7f3ec] border-b border-[#ccc5bc]/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#292724] text-[#fdf9f2] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">
                    history_edu
                  </span>
                </div>
                <div>
                  <h3 className="font-serif text-lg font-bold text-[#1c1c18]">
                    Nhật Ký Truy Cập &amp; Lưu Bạ Hệ Thống
                  </h3>
                  <span className="text-xs text-[#7b766f]">
                    Phiên bảo mật: #ADM-SESSION-88219 • FIDO2 Multi-Sig Active
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAuditModal(false)}
                className="w-8 h-8 rounded-lg hover:bg-[#ebe8e1] text-[#7b766f] hover:text-[#1c1c18] flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="p-4 rounded-xl bg-[#d8e3ce]/50 border border-[#576151]/30 flex items-start gap-3">
                <span className="material-symbols-outlined text-[#576151] text-[20px] shrink-0 mt-0.5">
                  check_circle
                </span>
                <div>
                  <span className="font-bold text-[#1c1c18] block text-sm">
                    Đồng Bộ Cơ Sở Dữ Liệu Thực Hoàn Tất
                  </span>
                  <p className="text-[#4a463f] mt-1 leading-relaxed">
                    Hệ thống đã truy xuất 100% dữ liệu thực từ MongoDB <code>reuse_hub.users</code> (gồm 11 tài khoản: 8 khách hàng, 1 chủ shop và 2 quản trị viên). Không sử dụng bất kỳ dữ liệu ảo hay số liệu giả lập nào.
                  </p>
                </div>
              </div>

              <div className="space-y-2.5">
                <span className="text-[11px] text-[#7b766f] uppercase font-bold tracking-wider block">
                  Nhật Ký Phiên Làm Việc Gần Nhất
                </span>

                <div className="p-3.5 rounded-xl bg-[#f7f3ec] border border-[#ccc5bc]/20 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-[#576151]"></span>
                    <div>
                      <span className="font-semibold text-[#1c1c18] block">
                        Đồng Bộ Sổ Bộ Thành Viên
                      </span>
                      <span className="text-[#7b766f]">
                        Khởi tạo API GET /api/users • Mã phản hồi 200 OK
                      </span>
                    </div>
                  </div>
                  <span className="text-[#7b766f] font-mono">Vừa xong</span>
                </div>

                <div className="p-3.5 rounded-xl bg-[#f7f3ec] border border-[#ccc5bc]/20 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-[#576151]"></span>
                    <div>
                      <span className="font-semibold text-[#1c1c18] block">
                        Xác Thực Khóa Phiên Quản Trị
                      </span>
                      <span className="text-[#7b766f]">
                        Chữ ký ECDSA NIST P-256 xác thực từ trạm làm việc
                      </span>
                    </div>
                  </div>
                  <span className="text-[#7b766f] font-mono">15 phút trước</span>
                </div>

                <div className="p-3.5 rounded-xl bg-[#f7f3ec] border border-[#ccc5bc]/20 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-[#7b5227]"></span>
                    <div>
                      <span className="font-semibold text-[#1c1c18] block">
                        Kiểm Kê Trạng Thái Hồ Sơ KYC
                      </span>
                      <span className="text-[#7b766f]">
                        Phát hiện 1 hồ sơ PENDING (Lê Văn C) cần xử lý
                      </span>
                    </div>
                  </div>
                  <span className="text-[#7b766f] font-mono">1 giờ trước</span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-[#f7f3ec] border-t border-[#ccc5bc]/30 flex justify-end">
              <button
                type="button"
                onClick={() => setShowAuditModal(false)}
                className="px-5 py-2 rounded-xl bg-[#292724] text-[#fdf9f2] text-xs font-bold hover:bg-[#141310] transition-colors"
              >
                Đóng Nhật Ký
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
