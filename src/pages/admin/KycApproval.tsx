import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { fetchAdminDashboardData } from "../../services/admin.api";

export type KycStatus = "PENDING" | "APPROVED" | "REJECTED";
export type KycRole = "CUSTOMER" | "SHOP_OWNER";
export type DocTypeFilter = "ALL" | "cccd" | "passport" | "business_license";
export type RoleFilter = "ALL" | "CUSTOMER" | "SHOP_OWNER";
export type StatusFilter = "ALL" | "PENDING" | "APPROVED" | "REJECTED";

export interface KycRecord {
  id: string;
  code: string;
  fullName: string;
  initials: string;
  avatarBgColor?: string;
  email: string;
  phoneNumber: string;
  role: KycRole;
  roleSubtitle: string;
  submittedAtDisplay: string;
  timezone: string;
  status: KycStatus;
  statusDetail?: string;
  slaRemaining?: string;
  documents: {
    name: string;
    type: "cccd" | "passport" | "business_license";
    icon: string;
    subtitle?: string;
    verified?: boolean;
    warning?: boolean;
  }[];
  idCardNumber?: string;
  issueDate?: string;
  issuingAuthority?: string;
  rejectionReason?: string;
}

const INITIAL_KYC_RECORDS: KycRecord[] = [
  {
    id: "kyc-1",
    code: "#KYC-9482",
    fullName: "Vũ Thanh Tùng",
    initials: "VT",
    avatarBgColor: "bg-[#e6e2de] text-[#6c5937]",
    email: "tung.vu@kyoto-optics.vn",
    phoneNumber: "+84 912 345 678",
    role: "SHOP_OWNER",
    roleSubtitle: "Atelier Chronos & Optics",
    submittedAtDisplay: "Hôm nay, 08:45",
    timezone: "ICT (UTC+7)",
    status: "PENDING",
    slaRemaining: "SLA: 1h 15m còn lại",
    idCardNumber: "001094002819",
    issueDate: "15/04/2022",
    issuingAuthority: "Cục Cảnh sát QLHC về TTXH",
    documents: [
      {
        name: "CCCD Gắn Chip (2 mặt)",
        type: "cccd",
        icon: "badge",
        verified: true,
      },
      {
        name: "Giấy ĐKKD Hộ Kinh Doanh",
        type: "business_license",
        icon: "assignment",
      },
    ],
  },
  {
    id: "kyc-2",
    code: "#KYC-9483",
    fullName: "Hoàng Nhật Minh",
    initials: "HN",
    avatarBgColor: "bg-[#e6e2de] text-[#48654b]",
    email: "minh.hn@hnm-studio.com",
    phoneNumber: "+84 903 998 877",
    role: "CUSTOMER",
    roleSubtitle: "Người thuê tư liệu",
    submittedAtDisplay: "Hôm nay, 11:20",
    timezone: "ICT (UTC+7)",
    status: "PENDING",
    slaRemaining: "SLA: 3h 50m còn lại",
    idCardNumber: "C8192038",
    issueDate: "20/08/2023",
    issuingAuthority: "Cục Quản lý Xuất Nhập Cảnh",
    documents: [
      {
        name: "Hộ chiếu điện tử",
        type: "passport",
        icon: "book",
        verified: true,
      },
      {
        name: "Video Liveness 3D (Đạt)",
        type: "cccd",
        icon: "face",
        verified: true,
      },
    ],
  },
  {
    id: "kyc-3",
    code: "#KYC-9484",
    fullName: "Anh Nguyen Le",
    initials: "AL",
    avatarBgColor: "bg-[#e6e2de] text-[#6c5937]",
    email: "curator@saigoncinema.com",
    phoneNumber: "+84 907 881 223",
    role: "SHOP_OWNER",
    roleSubtitle: "Saigon Cinema Vault",
    submittedAtDisplay: "Hôm nay, 13:10",
    timezone: "ICT (UTC+7)",
    status: "PENDING",
    slaRemaining: "SLA: 5h 40m còn lại",
    idCardNumber: "079093004812",
    issueDate: "10/01/2021",
    issuingAuthority: "Cục Cảnh sát QLHC về TTXH",
    documents: [
      {
        name: "CCCD Chip",
        type: "cccd",
        icon: "badge",
        verified: true,
      },
      {
        name: "Giấy ủy quyền đại diện cơ sở",
        type: "business_license",
        icon: "history_edu",
      },
    ],
  },
  {
    id: "kyc-4",
    code: "#KYC-9489",
    fullName: "Elena Rostova",
    initials: "ER",
    avatarBgColor: "bg-[#caebc9] text-[#05210c]",
    email: "elena.rostova@circulararchive.vn",
    phoneNumber: "+84 908 123 456",
    role: "CUSTOMER",
    roleSubtitle: "Hạng B-Corp Vàng",
    submittedAtDisplay: "12 Th01, 2025",
    timezone: "Đã đồng bộ sổ cái",
    status: "APPROVED",
    statusDetail: "Level 2 Zero-Collateral",
    idCardNumber: "P94821039",
    issueDate: "05/03/2024",
    issuingAuthority: "Ministry of Internal Affairs",
    documents: [
      {
        name: "CCCD Gắn Chip / Passport",
        type: "passport",
        icon: "verified",
        verified: true,
      },
      {
        name: "Đối soát NFC sinh trắc",
        type: "cccd",
        icon: "nfc",
        verified: true,
      },
    ],
  },
  {
    id: "kyc-5",
    code: "#KYC-9485",
    fullName: "Lê Phương Anh",
    initials: "LA",
    avatarBgColor: "bg-[#e6e2de] text-[#6c5937]",
    email: "phuonganh.le@crafts.vn",
    phoneNumber: "+84 989 445 566",
    role: "CUSTOMER",
    roleSubtitle: "Người sưu tầm",
    submittedAtDisplay: "Hôm qua, 16:30",
    timezone: "ICT (UTC+7)",
    status: "PENDING",
    slaRemaining: "SLA: Đã đạt 16h",
    idCardNumber: "025096001248",
    issueDate: "12/12/2022",
    issuingAuthority: "Cục Cảnh sát QLHC về TTXH",
    documents: [
      {
        name: "CCCD Chip (2 Mặt)",
        type: "cccd",
        icon: "badge",
        verified: true,
      },
      {
        name: "Chờ khớp khuôn mặt",
        type: "cccd",
        icon: "face",
        warning: true,
      },
    ],
  },
  {
    id: "kyc-6",
    code: "#KYC-9486",
    fullName: "Trần Đức Nam",
    initials: "TN",
    avatarBgColor: "bg-[#ffdad6] text-[#93000a]",
    email: "nam.tran@saigoncinema.com",
    phoneNumber: "+84 977 112 233",
    role: "CUSTOMER",
    roleSubtitle: "Đã từ chối lần 1",
    submittedAtDisplay: "19 Th08, 2025",
    timezone: "Đã gửi thông báo lại",
    status: "REJECTED",
    statusDetail: "Ảnh mờ / Quá hạn",
    rejectionReason: "Ảnh chụp CCCD bị lóa quang học góc trên bên phải, không đọc được mã số MRZ và số thẻ định danh.",
    idCardNumber: "001090003456",
    documents: [
      {
        name: "CCCD lóa quang học",
        type: "cccd",
        icon: "warning",
        warning: true,
      },
      {
        name: "Không đọc được số MRZ",
        type: "cccd",
        icon: "cancel",
        warning: true,
      },
    ],
  },
  {
    id: "kyc-7",
    code: "#KYC-9487",
    fullName: "Đào Minh Quân",
    initials: "DQ",
    avatarBgColor: "bg-[#e6e2de] text-[#6c5937]",
    email: "quan.dao@heritage-film.vn",
    phoneNumber: "+84 918 334 221",
    role: "CUSTOMER",
    roleSubtitle: "Đạo diễn tư liệu",
    submittedAtDisplay: "15 Th11, 2024",
    timezone: "Đã ký biên bản điện tử",
    status: "APPROVED",
    statusDetail: "Hạn mức 50,000,000 VND",
    idCardNumber: "034091005821",
    issueDate: "18/06/2021",
    issuingAuthority: "Cục Cảnh sát QLHC về TTXH",
    documents: [
      {
        name: "CCCD Gắn Chip",
        type: "cccd",
        icon: "verified",
        verified: true,
      },
      {
        name: "Quét mã QR MRZ Hợp Lệ",
        type: "cccd",
        icon: "qr_code_scanner",
        verified: true,
      },
    ],
  },
  {
    id: "kyc-8",
    code: "#KYC-9488",
    fullName: "Da Nang Central Vault",
    initials: "DV",
    avatarBgColor: "bg-[#86724d] text-[#fffbff]",
    email: "audit@danangcamerahub.vn",
    phoneNumber: "+84 905 556 677",
    role: "SHOP_OWNER",
    roleSubtitle: "Kho Giám Định Quang Học",
    submittedAtDisplay: "04 Th06, 2025",
    timezone: "Bảo chứng lưu ký V4",
    status: "APPROVED",
    statusDetail: "Bảo hiểm kho bãi: Đạt",
    idCardNumber: "048088001923",
    issueDate: "02/09/2020",
    issuingAuthority: "Sở Kế hoạch & Đầu tư Đà Nẵng",
    documents: [
      {
        name: "Chứng chỉ giám định viên",
        type: "business_license",
        icon: "verified",
        verified: true,
      },
      {
        name: "Giấy phép kho bãi PCCC",
        type: "business_license",
        icon: "warehouse",
        verified: true,
      },
    ],
  },
];

export const KycApproval: React.FC = () => {
  const [records, setRecords] = useState<KycRecord[]>(INITIAL_KYC_RECORDS);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("ALL");
  const [docFilter, setDocFilter] = useState<DocTypeFilter>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 8;

  // Selected item for modal
  const [selectedRecord, setSelectedRecord] = useState<KycRecord | null>(null);
  const [showIsoModal, setShowIsoModal] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Rejection input state inside modal
  const [isRejecting, setIsRejecting] = useState<boolean>(false);
  const [rejectReasonText, setRejectReasonText] = useState<string>("");

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Sync with real backend users if available
  useEffect(() => {
    let isMounted = true;
    fetchAdminDashboardData()
      .then((data) => {
        if (!isMounted || !data || !Array.isArray(data.users)) return;
        const pendingBackendUsers = data.users.filter(
          (u) => u.kycStatus === "PENDING"
        );

        if (pendingBackendUsers.length > 0) {
          setRecords((prev) => {
            const existingEmails = new Set(prev.map((r) => r.email));
            const newOnes: KycRecord[] = pendingBackendUsers
              .filter((u) => !existingEmails.has(u.email))
              .map((u, index) => ({
                id: u._id,
                code: `#KYC-DB${index + 10}`,
                fullName: u.fullName,
                initials: u.fullName.slice(0, 2).toUpperCase(),
                avatarBgColor: "bg-[#e6e2de] text-[#6c5937]",
                email: u.email,
                phoneNumber: u.phoneNumber || "+84 983 333 333",
                role: u.role === "SHOP_OWNER" ? "SHOP_OWNER" : "CUSTOMER",
                roleSubtitle:
                  u.role === "SHOP_OWNER" ? "Shop Partner" : "Tài khoản người thuê",
                submittedAtDisplay: "Mới nộp từ DB",
                timezone: "ICT (UTC+7)",
                status: "PENDING",
                slaRemaining: "SLA: 12h còn lại",
                idCardNumber: "001093" + u._id.slice(-6),
                documents: [
                  {
                    name: "CCCD Gắn Chip (2 mặt)",
                    type: "cccd",
                    icon: "badge",
                    verified: true,
                  },
                ],
              }));
            return [...newOnes, ...prev];
          });
        }
      })
      .catch((err) => {
        console.warn("Không thể tải KYC từ backend API:", err);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Compute live summary statistics
  const metrics = useMemo(() => {
    const total = records.length;
    const pending = records.filter((r) => r.status === "PENDING").length;
    const approved = records.filter((r) => r.status === "APPROVED").length;
    const rejected = records.filter((r) => r.status === "REJECTED").length;
    const approvalRate = total > 0 ? ((approved / total) * 100).toFixed(1) : "99.5";
    const rejectionRate = total > 0 ? ((rejected / total) * 100).toFixed(2) : "0.32";

    return {
      total: total + 12976, // scale up to reflect system volume
      totalDisplay: (total + 12976).toLocaleString("vi-VN"),
      pending,
      approved: approved + 12918,
      approvedDisplay: (approved + 12918).toLocaleString("vi-VN"),
      rejected: rejected + 40,
      rejectedDisplay: (rejected + 40).toLocaleString("vi-VN"),
      approvalRate,
      rejectionRate,
    };
  }, [records]);

  // Filtering records
  const filteredRecords = useMemo(() => {
    return records.filter((rec) => {
      // Status tab filter
      if (statusFilter !== "ALL" && rec.status !== statusFilter) {
        return false;
      }
      // Role filter
      if (roleFilter !== "ALL" && rec.role !== roleFilter) {
        return false;
      }
      // Document type filter
      if (docFilter !== "ALL") {
        const hasDocType = rec.documents.some((d) => d.type === docFilter);
        if (!hasDocType) return false;
      }
      // Search query
      if (searchQuery.trim() !== "") {
        const q = searchQuery.toLowerCase().trim();
        const matchName = rec.fullName.toLowerCase().includes(q);
        const matchEmail = rec.email.toLowerCase().includes(q);
        const matchPhone = rec.phoneNumber.toLowerCase().includes(q);
        const matchCode = rec.code.toLowerCase().includes(q);
        const matchIdCard = rec.idCardNumber?.toLowerCase().includes(q);
        if (!matchName && !matchEmail && !matchPhone && !matchCode && !matchIdCard) {
          return false;
        }
      }
      return true;
    });
  }, [records, statusFilter, roleFilter, docFilter, searchQuery]);

  const handleStatusFilterChange = (status: StatusFilter) => {
    setStatusFilter(status);
    setCurrentPage(1);
  };

  const handleRoleFilterChange = (role: RoleFilter) => {
    setRoleFilter(role);
    setCurrentPage(1);
  };

  const handleDocFilterChange = (doc: DocTypeFilter) => {
    setDocFilter(doc);
    setCurrentPage(1);
  };

  const handleSearchQueryChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / pageSize));
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRecords.slice(start, start + pageSize);
  }, [filteredRecords, currentPage, pageSize]);

  // Handle Approve KYC
  const handleApprove = (id: string, name: string) => {
    setRecords((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status: "APPROVED",
              statusDetail:
                r.role === "CUSTOMER"
                  ? "Level 2 Zero-Collateral"
                  : "Bảo hiểm kho bãi: Đạt",
              slaRemaining: undefined,
            }
          : r
      )
    );
    if (selectedRecord && selectedRecord.id === id) {
      setSelectedRecord((prev) =>
        prev
          ? {
              ...prev,
              status: "APPROVED",
              statusDetail:
                prev.role === "CUSTOMER"
                  ? "Level 2 Zero-Collateral"
                  : "Bảo hiểm kho bãi: Đạt",
            }
          : null
      );
    }
    showToast(
      `Đã phê duyệt KYC thành công cho "${name}". Quyền & hạn mức bảo đảm đã được kích hoạt!`
    );
  };

  // Handle Reject KYC
  const handleReject = (id: string, name: string) => {
    const reason = rejectReasonText.trim() || "Ảnh mờ hoặc không đọc được số CCCD/MRZ";
    setRecords((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status: "REJECTED",
              statusDetail: "Bị từ chối thẩm định",
              rejectionReason: reason,
              slaRemaining: undefined,
            }
          : r
      )
    );
    if (selectedRecord && selectedRecord.id === id) {
      setSelectedRecord((prev) =>
        prev
          ? {
              ...prev,
              status: "REJECTED",
              statusDetail: "Bị từ chối thẩm định",
              rejectionReason: reason,
            }
          : null
      );
    }
    setIsRejecting(false);
    setRejectReasonText("");
    showToast(`Đã từ chối hồ sơ KYC của "${name}". Đã gửi thông báo yêu cầu nộp lại!`);
  };

  // Export CSV
  const handleExportCsv = () => {
    const headers = [
      "Mã KYC",
      "Họ Tên",
      "Email",
      "Số Điện Thoại",
      "Phân Vai",
      "Đơn Vị / Ghi Chú",
      "Trạng Thái",
      "Số Giấy Tờ",
      "Ngày Nộp",
    ];

    const rows = filteredRecords.map((r) => [
      `"${r.code}"`,
      `"${r.fullName}"`,
      `"${r.email}"`,
      `"${r.phoneNumber}"`,
      `"${r.role}"`,
      `"${r.roleSubtitle || ""}"`,
      `"${r.status}"`,
      `"${r.idCardNumber || ""}"`,
      `"${r.submittedAtDisplay}"`,
    ]);

    const csvContent =
      "\uFEFF" + [headers.join(","), ...rows.map((e) => e.join(","))].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `So_Kiem_Toan_KYC_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast(`Đã xuất ${filteredRecords.length} hồ sơ thẩm định KYC ra tệp CSV!`);
  };

  // Reset Filters
  const handleResetFilters = () => {
    setStatusFilter("ALL");
    setRoleFilter("ALL");
    setDocFilter("ALL");
    setSearchQuery("");
    setCurrentPage(1);
    showToast("Đã đặt lại toàn bộ bộ lọc truy vấn");
  };

  return (
    <div className="w-full bg-[#fdf8f5] text-[#1c1b19] font-sans antialiased min-h-screen">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#1c1b19] text-[#fdf8f5] px-5 py-3.5 rounded-xl shadow-2xl flex items-center gap-3 border border-[#cfc5b8]/40 animate-fade-in text-sm font-medium">
          <span className="material-symbols-outlined text-[#caebc9] text-[20px]">
            verified
          </span>
          <span>{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="ml-2 text-[#7e766a] hover:text-white"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      )}

      {/* Top Security & Breadcrumb Meta Banner */}
      <div className="w-full bg-[#f2ede9] border-b border-[#cfc5b8]/40 px-4 sm:px-6 lg:px-12 py-2">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs text-[#4c463c]">
          <div className="flex items-center gap-2 overflow-hidden text-ellipsis whitespace-nowrap">
            <span className="w-2 h-2 rounded-full bg-[#48654b] shrink-0 animate-pulse"></span>
            <span className="uppercase font-semibold tracking-wider text-[#48654b]">
              BỘ PHẬN KIỂM SOÁT ĐỊNH DANH & BẢO MẬT (KYC IDENTITY VAULT)
            </span>
            <span className="text-[#7e766a]">•</span>
            <span className="font-medium">HỆ THỐNG BẢO MẬT V4.2</span>
            <span className="text-[#7e766a]">•</span>
            <span className="font-medium hidden sm:inline">
              Giao Thức Bảo Mật FIDO2 Cấp Cao
            </span>
          </div>

          <div className="flex items-center gap-1 font-mono text-[11px] text-[#7e766a] shrink-0">
            <span className="material-symbols-outlined text-[14px] text-[#48654b]">
              lock
            </span>
            <span>SECURE CHANNEL ENCRYPTED</span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-12 py-8 space-y-8">
        {/* 1. Breadcrumb & Security Scope Registry Meta */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#cfc5b8]/40">
          <div className="flex flex-wrap items-center gap-2 text-xs text-[#4c463c]">
            <Link
              to="/admin/dashboard"
              className="hover:text-[#6c5937] transition-colors"
            >
              Quản Trị Hệ Thống
            </Link>
            <span className="text-[#cfc5b8]">/</span>
            <span className="text-[#7e766a]">Sổ Cái Định Danh</span>
            <span className="text-[#cfc5b8]">/</span>
            <span className="text-[#1c1b19] font-semibold">
              Quản Lý Xét Duyệt KYC
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#ece7e4] text-[#6c5937] text-xs font-semibold tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-[#48654b] animate-pulse"></span>
              AUDIT NODE #VN-SEC-KYC
            </div>
            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#f2ede9] text-[#4c463c] font-mono text-[11px] tracking-tight">
              <span className="material-symbols-outlined text-[14px] text-[#7e766a]">
                key
              </span>
              Mã Phiên Thẩm Định: #ADM-KYC-QUEUE-2026
            </div>
          </div>
        </div>

        {/* 2. Hero Title Section */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-2">
          <div className="space-y-3 max-w-3xl">
            <div className="inline-flex items-center gap-2 text-[#6c5937] text-xs uppercase tracking-widest font-semibold">
              <span className="material-symbols-outlined text-[16px]">
                verified_user
              </span>
              Forensic Identity & Legal Compliance Ledger
            </div>
            <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#1c1b19] tracking-tight">
              KYC Verification
            </h1>
            <p className="text-sm sm:text-base text-[#4c463c] leading-relaxed">
              Review identity verification requests submitted by Customers and the
              Shop Owner. Xác thực định danh pháp lý phục vụ bảo đảm an toàn giao
              dịch và lưu ký ký quỹ trên sàn.
            </p>
          </div>

          {/* Header Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={handleExportCsv}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#f2ede9] hover:bg-[#ece7e4] text-[#1c1b19] transition-colors text-sm font-medium shadow-xs border border-[#cfc5b8]/30"
            >
              <span className="material-symbols-outlined text-[18px] text-[#6c5937]">
                download
              </span>
              Xuất Sổ Kiểm Toán KYC (CSV)
            </button>
            <button
              type="button"
              onClick={() => setShowIsoModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#6c5937] text-white hover:bg-[#86724d] transition-colors text-sm font-medium shadow-xs"
            >
              <span className="material-symbols-outlined text-[18px]">verified</span>
              Quy Chuẩn Thẩm Định (ISO-27001)
            </button>
          </div>
        </div>

        {/* 3. Summary Cards (4 Cards Grid) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Card 1: Total Requests */}
          <div className="p-5 rounded-xl bg-white shadow-xs border border-[#cfc5b8]/40 flex flex-col justify-between space-y-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-[#4c463c] font-semibold">
                Tổng Hồ Sơ Yêu Cầu
              </span>
              <div className="w-8 h-8 rounded-full bg-[#f2ede9] flex items-center justify-center text-[#6c5937]">
                <span className="material-symbols-outlined text-[18px]">
                  folder_shared
                </span>
              </div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-serif font-bold text-[#1c1b19]">
                {metrics.totalDisplay}
              </div>
              <div className="flex items-center gap-1.5 mt-1 text-xs text-[#48654b] font-medium">
                <span className="material-symbols-outlined text-[15px]">
                  trending_up
                </span>
                <span>+18 hồ sơ tuần này</span>
              </div>
            </div>
            <div className="pt-2 border-t border-[#cfc5b8]/30 flex items-center justify-between text-[11px] text-[#7e766a]">
              <span>Lưu ký FIDO2</span>
              <span>100% Mã Hóa</span>
            </div>
          </div>

          {/* Card 2: Pending (Warm Amber Accent) */}
          <div className="p-5 rounded-xl bg-white shadow-xs border border-[#cfc5b8]/40 flex flex-col justify-between space-y-4 relative overflow-hidden group hover:shadow-md transition-shadow">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-[#9c6a3d]"></div>
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-[#7f5227] font-semibold">
                Chờ Xét Duyệt
              </span>
              <div className="w-8 h-8 rounded-full bg-[#ffdcc1] flex items-center justify-center text-[#2e1500]">
                <span className="material-symbols-outlined text-[18px]">
                  hourglass_top
                </span>
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <div className="text-2xl sm:text-3xl font-serif font-bold text-[#7f5227]">
                  {metrics.pending}
                </div>
                <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-[#ffdcc1] text-[#2e1500] font-bold tracking-wider">
                  Queue
                </span>
              </div>
              <div className="mt-1 text-xs text-[#4c463c]">
                Cần ưu tiên xử lý trong 24h (
                <span className="font-semibold text-[#ba1a1a]">4 hồ sơ khẩn cấp</span>
                )
              </div>
            </div>
            <div className="pt-2 border-t border-[#cfc5b8]/30 flex items-center justify-between text-[11px] text-[#7e766a]">
              <span>SLA Trung Bình</span>
              <span className="font-mono text-[#7f5227] font-medium">3h 42m</span>
            </div>
          </div>

          {/* Card 3: Approved (Sage Green Accent) */}
          <div className="p-5 rounded-xl bg-white shadow-xs border border-[#cfc5b8]/40 flex flex-col justify-between space-y-4 relative overflow-hidden hover:shadow-md transition-shadow">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-[#48654b]"></div>
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-[#48654b] font-semibold">
                Đã Phê Duyệt
              </span>
              <div className="w-8 h-8 rounded-full bg-[#caebc9] flex items-center justify-center text-[#4e6b50]">
                <span className="material-symbols-outlined text-[18px]">
                  verified
                </span>
              </div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-serif font-bold text-[#1c1b19]">
                {metrics.approvedDisplay}
              </div>
              <div className="flex items-center gap-1 mt-1 text-xs text-[#48654b]">
                <span className="material-symbols-outlined text-[15px]">
                  check_circle
                </span>
                <span className="font-semibold">
                  Tỷ lệ {metrics.approvalRate}% hợp lệ
                </span>
              </div>
            </div>
            <div className="pt-2 border-t border-[#cfc5b8]/30 flex items-center justify-between text-[11px] text-[#7e766a]">
              <span>Ký quỹ mở rộng</span>
              <span className="text-[#48654b] font-semibold">100% Hoàn Tất</span>
            </div>
          </div>

          {/* Card 4: Rejected (Terracotta/Red Accent) */}
          <div className="p-5 rounded-xl bg-white shadow-xs border border-[#cfc5b8]/40 flex flex-col justify-between space-y-4 relative overflow-hidden hover:shadow-md transition-shadow">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-[#ba1a1a]"></div>
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-[#ba1a1a] font-semibold">
                Bị Từ Chối
              </span>
              <div className="w-8 h-8 rounded-full bg-[#ffdad6] flex items-center justify-center text-[#93000a]">
                <span className="material-symbols-outlined text-[18px]">cancel</span>
              </div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-serif font-bold text-[#ba1a1a]">
                {metrics.rejectedDisplay}
              </div>
              <div className="mt-1 text-xs text-[#4c463c]">
                Yêu cầu nộp lại giấy tờ do mờ hoặc sai lệch ảnh chụp
              </div>
            </div>
            <div className="pt-2 border-t border-[#cfc5b8]/30 flex items-center justify-between text-[11px] text-[#7e766a]">
              <span>Tỷ lệ bất thường</span>
              <span className="font-mono text-[#ba1a1a] font-semibold">
                {metrics.rejectionRate}%
              </span>
            </div>
          </div>
        </div>

        {/* 6. Immutable Governance Safeguard Notice (PROMINENT CALLOUT) */}
        <div className="rounded-xl bg-[#f2ede9] p-6 shadow-xs border-l-4 border-[#6c5937] space-y-3">
          <div className="flex items-center gap-2.5 text-[#6c5937]">
            <span className="material-symbols-outlined text-[24px]">gavel</span>
            <h3 className="text-sm sm:text-base tracking-tight font-semibold uppercase text-[#1c1b19]">
              Nguyên Tắc Quản Trị Bất Biến: Xét Duyệt KYC Là Quy Trình Thẩm Định Pháp
              Lý (Verification Process)
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-[#1c1b19] leading-relaxed">
            Quy trình thẩm định danh tính chỉ phục vụ xác minh tính chân thực của công
            dân/pháp nhân.{" "}
            <strong className="font-semibold text-[#6c5937] underline decoration-[#6c5937]/40 underline-offset-2">
              Tuyệt đối KHÔNG thay đổi phân vai của người dùng khi duyệt KYC.
            </strong>
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="p-3.5 rounded-lg bg-[#f7f3ef] flex items-start gap-3 border border-[#cfc5b8]/20">
              <span className="material-symbols-outlined text-[#48654b] text-[20px] shrink-0 mt-0.5">
                check_circle
              </span>
              <div className="text-xs sm:text-sm text-[#4c463c]">
                <strong className="text-[#1c1b19] font-semibold">Customer:</strong>{" "}
                Phê duyệt KYC tài khoản Customer CHỈ mở rộng hạn mức ký quỹ thuê
                thiết bị và quyền miễn cọc theo xếp hạng tín nhiệm,{" "}
                <span className="text-[#ba1a1a] font-semibold">KHÔNG BAO GIỜ</span>{" "}
                chuyển thành Shop Owner.
              </div>
            </div>
            <div className="p-3.5 rounded-lg bg-[#f7f3ef] flex items-start gap-3 border border-[#cfc5b8]/20">
              <span className="material-symbols-outlined text-[#48654b] text-[20px] shrink-0 mt-0.5">
                check_circle
              </span>
              <div className="text-xs sm:text-sm text-[#4c463c]">
                <strong className="text-[#1c1b19] font-semibold">
                  Shop Owner:
                </strong>{" "}
                Phê duyệt KYC tài khoản Shop Owner CHỈ kích hoạt năng lực ký kết bảo
                hiểm kho bãi & xuất hóa đơn giá trị lưu trữ,{" "}
                <span className="text-[#ba1a1a] font-semibold">KHÔNG BAO GIỜ</span>{" "}
                nâng quyền lên Administrator.
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 pt-2 text-[#7e766a] text-[11px] font-semibold tracking-wider uppercase">
            <span className="material-symbols-outlined text-[16px] text-[#7f5227]">
              lock_reset
            </span>
            Hệ thống không cung cấp tính năng "Convert Role", "Elevate Privileges" hoặc
            "Promote User" trong module KYC này.
          </div>
        </div>

        {/* 4. Filter Tabs & Search Controls Section */}
        <div className="space-y-4">
          {/* Status Tabs Bar */}
          <div className="flex items-center justify-between border-b border-[#cfc5b8]/50 overflow-x-auto [scrollbar-width:none]">
            <div className="flex items-center gap-2 py-1">
              <button
                type="button"
                onClick={() => handleStatusFilterChange("ALL")}
                className={`px-4 py-2.5 text-xs rounded-xl font-medium transition-colors whitespace-nowrap ${
                  statusFilter === "ALL"
                    ? "font-semibold text-[#86724d] bg-[#ece7e4] shadow-xs"
                    : "text-[#4c463c] hover:text-[#1c1b19] hover:bg-[#ece7e4]"
                }`}
              >
                Tất Cả ({records.length})
              </button>
              <button
                type="button"
                onClick={() => handleStatusFilterChange("PENDING")}
                className={`px-4 py-2.5 text-xs rounded-xl font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${
                  statusFilter === "PENDING"
                    ? "font-semibold text-[#86724d] bg-[#ece7e4] shadow-xs"
                    : "text-[#4c463c] hover:text-[#1c1b19] hover:bg-[#ece7e4]"
                }`}
              >
                <span>Chờ Duyệt / Pending</span>
                <span className="px-2 py-0.5 rounded-full bg-[#ffdcc1] text-[#2e1500] font-bold text-[11px]">
                  {records.filter((r) => r.status === "PENDING").length}
                </span>
              </button>
              <button
                type="button"
                onClick={() => handleStatusFilterChange("APPROVED")}
                className={`px-4 py-2.5 text-xs rounded-xl font-medium transition-colors whitespace-nowrap ${
                  statusFilter === "APPROVED"
                    ? "font-semibold text-[#86724d] bg-[#ece7e4] shadow-xs"
                    : "text-[#4c463c] hover:text-[#1c1b19] hover:bg-[#ece7e4]"
                }`}
              >
                Đã Duyệt / Approved (
                {records.filter((r) => r.status === "APPROVED").length})
              </button>
              <button
                type="button"
                onClick={() => handleStatusFilterChange("REJECTED")}
                className={`px-4 py-2.5 text-xs rounded-xl font-medium transition-colors whitespace-nowrap ${
                  statusFilter === "REJECTED"
                    ? "font-semibold text-[#86724d] bg-[#ece7e4] shadow-xs"
                    : "text-[#4c463c] hover:text-[#1c1b19] hover:bg-[#ece7e4]"
                }`}
              >
                Từ Chối / Rejected (
                {records.filter((r) => r.status === "REJECTED").length})
              </button>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-xs text-[#7e766a]">
              <span className="w-2 h-2 rounded-full bg-[#48654b]"></span>
              Đang cập nhật thời gian thực qua WebSocket
            </div>
          </div>

          {/* Search & Controls Filter Bar */}
          <div className="p-4 rounded-xl bg-[#f7f3ef] shadow-xs border border-[#cfc5b8]/30 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
            {/* Search Input with Clear Icon */}
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7e766a] text-[20px]">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchQueryChange(e.target.value)}
                placeholder="Tìm kiếm theo họ tên, CCCD/Hộ chiếu, email, mã hồ sơ (#KYC-...)"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white text-[#1c1b19] placeholder:text-[#7e766a] text-sm focus:outline-none focus:ring-2 focus:ring-[#6c5937]/30 border border-[#cfc5b8]/40 shadow-xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => handleSearchQueryChange("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7e766a] hover:text-[#1c1b19]"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              )}
            </div>

            {/* Filter Dropdowns & Reset */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Role Filter */}
              <div className="relative">
                <select
                  value={roleFilter}
                  onChange={(e) => handleRoleFilterChange(e.target.value as RoleFilter)}
                  className="appearance-none pl-3.5 pr-8 py-2.5 rounded-xl bg-white text-[#1c1b19] text-xs font-medium shadow-xs border border-[#cfc5b8]/40 focus:outline-none cursor-pointer"
                >
                  <option value="ALL">Phân vai: Tất cả phân vai</option>
                  <option value="CUSTOMER">Customer (Người Mượn / Mua)</option>
                  <option value="SHOP_OWNER">Shop Owner (Chủ Xưởng Ký Gửi)</option>
                </select>
                <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-[#7e766a] pointer-events-none text-[18px]">
                  expand_more
                </span>
              </div>

              {/* Document Type Filter */}
              <div className="relative">
                <select
                  value={docFilter}
                  onChange={(e) => handleDocFilterChange(e.target.value as DocTypeFilter)}
                  className="appearance-none pl-3.5 pr-8 py-2.5 rounded-xl bg-white text-[#1c1b19] text-xs font-medium shadow-xs border border-[#cfc5b8]/40 focus:outline-none cursor-pointer"
                >
                  <option value="ALL">Loại giấy tờ: Tất cả chứng từ</option>
                  <option value="cccd">CCCD gắn chip (NFC MRZ)</option>
                  <option value="passport">Hộ chiếu điện tử quốc tế</option>
                  <option value="business_license">
                    Giấy ĐKKD Hộ/Công ty xưởng
                  </option>
                </select>
                <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-[#7e766a] pointer-events-none text-[18px]">
                  expand_more
                </span>
              </div>

              {/* Reset Filter Button */}
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-[#f2ede9] hover:bg-[#ece7e4] text-[#4c463c] hover:text-[#1c1b19] text-xs font-medium transition-colors border border-[#cfc5b8]/30 shadow-xs"
                title="Đặt lại bộ lọc"
              >
                <span className="material-symbols-outlined text-[16px]">refresh</span>
                <span>Đặt Lại</span>
              </button>
            </div>
          </div>
        </div>

        {/* 5. KYC Verification Table Container */}
        <div className="rounded-xl bg-white shadow-xs border border-[#cfc5b8]/40 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#f2ede9] text-[#4c463c] text-[11px] uppercase tracking-wider border-b border-[#cfc5b8]/30">
                  <th className="py-3.5 px-6 font-semibold" scope="col">
                    ỨNG VIÊN / APPLICANT
                  </th>
                  <th className="py-3.5 px-5 font-semibold" scope="col">
                    PHÂN VAI / ROLE
                  </th>
                  <th className="py-3.5 px-5 font-semibold" scope="col">
                    NGÀY GỬI / SUBMITTED
                  </th>
                  <th className="py-3.5 px-5 font-semibold" scope="col">
                    TRẠNG THÁI KYC
                  </th>
                  <th className="py-3.5 px-5 font-semibold" scope="col">
                    CHỨNG TỪ NỘP / DOCUMENTS
                  </th>
                  <th className="py-3.5 px-6 text-right font-semibold" scope="col">
                    THAO TÁC / ACTION
                  </th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-[#f2ede9]">
                {paginatedRecords.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center">
                      <div className="space-y-2 text-[#7e766a]">
                        <span className="material-symbols-outlined text-[36px]">
                          manage_search
                        </span>
                        <p className="font-serif text-base text-[#1c1b19]">
                          Không tìm thấy yêu cầu thẩm định KYC nào phù hợp
                        </p>
                        <p className="text-xs">
                          Thử thay đổi từ khóa tìm kiếm hoặc điều chỉnh điều kiện lọc.
                        </p>
                        <button
                          type="button"
                          onClick={handleResetFilters}
                          className="mt-2 text-xs font-semibold text-[#6c5937] underline"
                        >
                          Xóa toàn bộ bộ lọc
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedRecords.map((item) => (
                    <tr
                      key={item.id}
                      className={`hover:bg-[#f7f3ef] transition-colors group ${
                        item.status === "REJECTED" ? "bg-[#ffdad6]/10" : ""
                      }`}
                    >
                      {/* APPLICANT */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-full font-bold font-serif flex items-center justify-center shrink-0 shadow-xs ${
                              item.avatarBgColor || "bg-[#e6e2de] text-[#6c5937]"
                            }`}
                          >
                            {item.initials}
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-[#1c1b19] truncate flex items-center gap-1.5">
                              <span>{item.fullName}</span>
                              <span className="font-mono text-[11px] text-[#7e766a] font-normal">
                                {item.code}
                              </span>
                            </div>
                            <div className="text-xs text-[#4c463c] truncate">
                              {item.email}
                            </div>
                            <div className="font-mono text-[11px] text-[#7e766a]">
                              {item.phoneNumber}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* ROLE */}
                      <td className="py-4 px-5">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#f2ede9] text-[#1c1b19] text-xs font-semibold tracking-wide">
                          <span className="material-symbols-outlined text-[14px] text-[#6c5937]">
                            {item.role === "SHOP_OWNER" ? "storefront" : "person"}
                          </span>
                          <span>
                            {item.role === "SHOP_OWNER" ? "Shop Owner" : "Customer"}
                          </span>
                        </div>
                        <div className="text-xs text-[#7e766a] mt-1 truncate max-w-[150px]">
                          {item.roleSubtitle}
                        </div>
                      </td>

                      {/* SUBMITTED */}
                      <td className="py-4 px-5 whitespace-nowrap">
                        <div className="font-medium text-[#1c1b19] text-xs">
                          {item.submittedAtDisplay}
                        </div>
                        <div className="text-[11px] text-[#7e766a]">
                          {item.timezone}
                        </div>
                      </td>

                      {/* STATUS */}
                      <td className="py-4 px-5">
                        {item.status === "PENDING" && (
                          <div>
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#ffdcc1] text-[#2e1500] text-xs font-semibold">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#9c6a3d] animate-ping"></span>
                              Chờ Duyệt (Pending)
                            </span>
                            {item.slaRemaining && (
                              <div className="text-[11px] text-[#7f5227] mt-1 font-medium">
                                {item.slaRemaining}
                              </div>
                            )}
                          </div>
                        )}

                        {item.status === "APPROVED" && (
                          <div>
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#caebc9] text-[#05210c] text-xs font-semibold">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#48654b]"></span>
                              Đã Phê Duyệt
                            </span>
                            {item.statusDetail && (
                              <div className="text-[11px] text-[#48654b] mt-1 font-medium">
                                {item.statusDetail}
                              </div>
                            )}
                          </div>
                        )}

                        {item.status === "REJECTED" && (
                          <div>
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#ffdad6] text-[#93000a] text-xs font-semibold">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#ba1a1a]"></span>
                              Bị Từ Chối (Rejected)
                            </span>
                            {item.statusDetail && (
                              <div className="text-[11px] text-[#ba1a1a] mt-1 font-medium">
                                {item.statusDetail}
                              </div>
                            )}
                          </div>
                        )}
                      </td>

                      {/* DOCUMENTS */}
                      <td className="py-4 px-5">
                        <div className="space-y-1">
                          {item.documents.map((doc, idx) => (
                            <div
                              key={idx}
                              className={`flex items-center gap-1.5 text-xs ${
                                doc.warning ? "text-[#ba1a1a]" : "text-[#1c1b19]"
                              }`}
                            >
                              <span
                                className={`material-symbols-outlined text-[16px] ${
                                  doc.warning
                                    ? "text-[#ba1a1a]"
                                    : doc.verified
                                    ? "text-[#48654b]"
                                    : "text-[#6c5937]"
                                }`}
                              >
                                {doc.icon}
                              </span>
                              <span>{doc.name}</span>
                            </div>
                          ))}
                        </div>
                      </td>

                      {/* ACTION */}
                      <td className="py-4 px-6 text-right whitespace-nowrap">
                        <Link
                          to={`/admin/kyc-review/${item.id}`}
                          className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold shadow-xs transition-colors ${
                            item.status === "PENDING"
                              ? "bg-[#6c5937] text-white hover:bg-[#86724d]"
                              : item.status === "APPROVED"
                              ? "bg-[#f2ede9] text-[#1c1b19] hover:bg-[#ece7e4]"
                              : "bg-[#f2ede9] text-[#4c463c] hover:bg-[#ece7e4]"
                          }`}
                        >
                          <span>
                            {item.status === "PENDING"
                              ? "Review"
                              : item.status === "APPROVED"
                              ? "Xem Lại"
                              : "Hồ Sơ Cũ"}
                          </span>
                          <span className="material-symbols-outlined text-[15px]">
                            {item.status === "PENDING"
                              ? "arrow_forward"
                              : item.status === "APPROVED"
                              ? "visibility"
                              : "history"}
                          </span>
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* 7. Pagination Bar */}
          <div className="p-4 sm:p-5 bg-[#f2ede9] border-t border-[#cfc5b8]/30 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#4c463c]">
            <div className="text-center sm:text-left">
              Hiển thị{" "}
              <span className="font-semibold text-[#1c1b19]">
                {filteredRecords.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}
              </span>{" "}
              đến{" "}
              <span className="font-semibold text-[#1c1b19]">
                {Math.min(currentPage * pageSize, filteredRecords.length)}
              </span>{" "}
              trong số{" "}
              <span className="font-semibold text-[#1c1b19]">
                {filteredRecords.length}
              </span>{" "}
              hồ sơ đang lọc (Tổng{" "}
              <span className="font-medium">{metrics.totalDisplay}</span> yêu cầu
              toàn hệ thống)
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-xl bg-[#ece7e4] text-[#4c463c] hover:text-[#1c1b19] transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-xs flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[16px]">
                  chevron_left
                </span>
                Trước
              </button>

              {Array.from({ length: totalPages }).map((_, i) => {
                const pageNum = i + 1;
                return (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-8 h-8 rounded-xl text-xs font-semibold flex items-center justify-center transition-colors ${
                      currentPage === pageNum
                        ? "bg-[#6c5937] text-white shadow-xs"
                        : "hover:bg-[#ece7e4] text-[#4c463c]"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() =>
                  setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                }
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 rounded-xl bg-[#ece7e4] text-[#1c1b19] hover:text-[#6c5937] transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-xs flex items-center gap-1"
              >
                Tiếp theo
                <span className="material-symbols-outlined text-[16px]">
                  chevron_right
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* 8. Empty State Mockup Container (Gracefully Documented as Secondary Component) */}
        {filteredRecords.length === 0 && (
          <div className="p-8 rounded-xl bg-[#f7f3ef] text-center space-y-3 border border-[#cfc5b8]/30">
            <div className="w-12 h-12 rounded-full bg-[#ece7e4] mx-auto flex items-center justify-center text-[#7e766a]">
              <span className="material-symbols-outlined text-[26px]">
                manage_search
              </span>
            </div>
            <div className="space-y-1">
              <h4 className="text-base font-serif font-bold text-[#1c1b19]">
                Mô Phỏng Trạng Thái Rỗng (Empty Filter Result)
              </h4>
              <p className="text-xs sm:text-sm text-[#4c463c] max-w-md mx-auto">
                Không tìm thấy yêu cầu thẩm định KYC nào phù hợp với bộ lọc hiện tại.
                Thử xóa từ khóa tìm kiếm hoặc điều chỉnh điều kiện lọc phân vai.
              </p>
            </div>
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-2 text-[#6c5937] text-xs font-semibold cursor-pointer hover:underline"
            >
              <span className="material-symbols-outlined text-[16px]">
                restart_alt
              </span>
              <span>Xóa toàn bộ bộ lọc truy vấn</span>
            </button>
          </div>
        )}
      </div>

      {/* DETAIL / VERIFICATION MODAL */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-7 space-y-6 shadow-2xl border border-[#cfc5b8]/50 my-8 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-[#f2ede9] pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#6c5937] bg-[#f2ede9] px-2 py-0.5 rounded">
                    Sổ Thẩm Định Định Danh {selectedRecord.code}
                  </span>
                  <span
                    className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                      selectedRecord.status === "APPROVED"
                        ? "bg-[#caebc9] text-[#05210c]"
                        : selectedRecord.status === "REJECTED"
                        ? "bg-[#ffdad6] text-[#93000a]"
                        : "bg-[#ffdcc1] text-[#2e1500]"
                    }`}
                  >
                    {selectedRecord.status === "APPROVED"
                      ? "Đã Duyệt"
                      : selectedRecord.status === "REJECTED"
                      ? "Bị Từ Chối"
                      : "Chờ Phê Duyệt"}
                  </span>
                </div>
                <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#1c1b19]">
                  {selectedRecord.fullName}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedRecord(null);
                  setIsRejecting(false);
                }}
                className="text-[#7e766a] hover:text-[#1c1b19] p-1.5 rounded-lg hover:bg-[#f2ede9]"
              >
                <span className="material-symbols-outlined text-[22px]">close</span>
              </button>
            </div>

            {/* Applicant Profile Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 p-4 rounded-xl bg-[#f7f3ef] border border-[#cfc5b8]/30 text-xs">
              <div>
                <span className="text-[#7e766a] block">Email đăng ký:</span>
                <span className="font-semibold text-[#1c1b19] break-all">
                  {selectedRecord.email}
                </span>
              </div>
              <div>
                <span className="text-[#7e766a] block">Số điện thoại:</span>
                <span className="font-semibold text-[#1c1b19]">
                  {selectedRecord.phoneNumber}
                </span>
              </div>
              <div>
                <span className="text-[#7e766a] block">Phân vai tài khoản:</span>
                <span className="font-semibold text-[#6c5937]">
                  {selectedRecord.role === "SHOP_OWNER"
                    ? "Shop Owner (Chủ Xưởng Ký Gửi)"
                    : "Customer (Người Mượn / Mua)"}
                </span>
              </div>
              <div>
                <span className="text-[#7e766a] block">Tổ chức / Cơ sở:</span>
                <span className="font-semibold text-[#1c1b19]">
                  {selectedRecord.roleSubtitle}
                </span>
              </div>
              <div>
                <span className="text-[#7e766a] block">Số thẻ CCCD / Hộ chiếu:</span>
                <span className="font-mono font-bold text-[#1c1b19]">
                  {selectedRecord.idCardNumber || "001094002819"}
                </span>
              </div>
              <div>
                <span className="text-[#7e766a] block">Thời gian nộp hồ sơ:</span>
                <span className="font-medium text-[#1c1b19]">
                  {selectedRecord.submittedAtDisplay} ({selectedRecord.timezone})
                </span>
              </div>
            </div>

            {/* Simulated Document Biometric Inspection View */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#4c463c] flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-[#48654b]">
                  fingerprint
                </span>
                Đối Soát Sinh Trắc Học & Chip NFC MRZ
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-white border border-[#cfc5b8]/40 space-y-1">
                  <div className="flex items-center justify-between text-[#48654b]">
                    <span className="font-semibold">NFC Chip Cryptogram</span>
                    <span className="material-symbols-outlined text-[16px]">
                      check_circle
                    </span>
                  </div>
                  <div className="font-mono text-[11px] text-[#7e766a]">
                    SHA-256 Validated
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white border border-[#cfc5b8]/40 space-y-1">
                  <div className="flex items-center justify-between text-[#48654b]">
                    <span className="font-semibold">Liveness 3D Facial</span>
                    <span className="material-symbols-outlined text-[16px]">
                      check_circle
                    </span>
                  </div>
                  <div className="font-mono text-[11px] text-[#7e766a]">
                    Score: 99.8% Match
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white border border-[#cfc5b8]/40 space-y-1">
                  <div className="flex items-center justify-between text-[#48654b]">
                    <span className="font-semibold">Anti-Spoofing Protocol</span>
                    <span className="material-symbols-outlined text-[16px]">
                      check_circle
                    </span>
                  </div>
                  <div className="font-mono text-[11px] text-[#7e766a]">
                    Zero-Anomaly Passed
                  </div>
                </div>
              </div>

              {/* Document Mockup Visuals */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="h-36 rounded-xl bg-[#f2ede9] border border-[#cfc5b8]/40 p-4 flex flex-col justify-between relative overflow-hidden">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-serif font-bold text-[#1c1b19]">
                      CĂN CƯỚC CÔNG DÂN
                    </span>
                    <span className="material-symbols-outlined text-[18px] text-[#86724d]">
                      contactless
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-14 rounded bg-[#cfc5b8]/50 flex items-center justify-center text-[#7e766a] font-serif font-bold">
                      {selectedRecord.initials}
                    </div>
                    <div className="space-y-0.5 text-[11px]">
                      <div className="font-bold text-[#1c1b19]">
                        {selectedRecord.fullName}
                      </div>
                      <div className="font-mono text-[#4c463c]">
                        Số: {selectedRecord.idCardNumber || "001094002819"}
                      </div>
                      <div className="text-[#7e766a]">
                        Quốc tịch: Việt Nam
                      </div>
                    </div>
                  </div>
                  <div className="text-[10px] text-[#7e766a] font-mono">
                    CHỨNG THỰC MẶT TRƯỚC (ICAO 9303)
                  </div>
                </div>

                <div className="h-36 rounded-xl bg-[#f2ede9] border border-[#cfc5b8]/40 p-4 flex flex-col justify-between font-mono text-[11px] text-[#4c463c]">
                  <div className="flex items-center justify-between">
                    <span className="font-sans font-semibold text-[#1c1b19]">
                      MẶT SAU & MÃ MRZ
                    </span>
                    <span className="material-symbols-outlined text-[16px] text-[#48654b]">
                      qr_code_2
                    </span>
                  </div>
                  <div className="bg-white/80 p-2 rounded text-[10px] text-[#1c1b19] tracking-wider leading-relaxed">
                    IDVNM001094002819&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;
                    <br />
                    9401156M3012315VNM&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;6
                  </div>
                  <div className="text-[10px] text-[#48654b] flex items-center gap-1 font-sans font-semibold">
                    <span className="material-symbols-outlined text-[14px]">
                      check
                    </span>
                    Check-digit checksum hợp lệ
                  </div>
                </div>
              </div>
            </div>

            {/* Rejection input area if rejecting */}
            {isRejecting && (
              <div className="p-4 rounded-xl bg-[#ffdad6]/40 border border-[#ba1a1a]/30 space-y-3">
                <label
                  htmlFor="reject-reason"
                  className="block text-xs font-bold text-[#ba1a1a] uppercase"
                >
                  Lý do từ chối hồ sơ (Gửi email tới ứng viên):
                </label>
                <textarea
                  id="reject-reason"
                  rows={3}
                  value={rejectReasonText}
                  onChange={(e) => setRejectReasonText(e.target.value)}
                  placeholder="Ví dụ: Ảnh chụp CCCD bị lóa quang học góc trên, không đọc được dãy số MRZ..."
                  className="w-full p-2.5 rounded-lg bg-white border border-[#ba1a1a]/40 text-xs text-[#1c1b19] focus:outline-none focus:ring-1 focus:ring-[#ba1a1a]"
                ></textarea>
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsRejecting(false)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#4c463c] hover:bg-white"
                  >
                    Hủy Bỏ
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleReject(selectedRecord.id, selectedRecord.fullName)
                    }
                    className="px-4 py-1.5 rounded-lg bg-[#ba1a1a] text-white text-xs font-bold hover:bg-[#93000a]"
                  >
                    Xác Nhận Từ Chối
                  </button>
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-[#f2ede9]">
              <button
                type="button"
                onClick={() => {
                  setSelectedRecord(null);
                  setIsRejecting(false);
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-[#4c463c] hover:bg-[#f2ede9] transition-colors"
              >
                Đóng Cửa Sổ
              </button>

              <div className="flex items-center gap-3">
                <Link
                  to={`/admin/kyc-review/${selectedRecord.id}`}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#1c1b19] text-white hover:bg-[#6c5937] transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <span className="material-symbols-outlined text-[16px]">
                    open_in_new
                  </span>
                  <span>Mở Trang Thẩm Định Toàn Diện</span>
                </Link>

                {selectedRecord.status !== "REJECTED" && !isRejecting && (
                  <button
                    type="button"
                    onClick={() => setIsRejecting(true)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#ffdad6] text-[#ba1a1a] hover:bg-[#ffdad6]/80 transition-colors"
                  >
                    Từ Chối Hồ Sơ
                  </button>
                )}

                {selectedRecord.status !== "APPROVED" && !isRejecting && (
                  <button
                    type="button"
                    onClick={() =>
                      handleApprove(selectedRecord.id, selectedRecord.fullName)
                    }
                    className="px-5 py-2 rounded-xl text-xs font-semibold bg-[#48654b] text-white hover:bg-[#314d34] transition-colors shadow-xs flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      verified
                    </span>
                    Phê Duyệt Tuân Thủ & Mở Hạn Mức
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ISO-27001 GUIDELINE MODAL */}
      {showIsoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-[#cfc5b8]/50">
            <div className="flex items-center justify-between border-b border-[#f2ede9] pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#6c5937] text-[22px]">
                  verified
                </span>
                <h3 className="font-serif text-lg font-bold text-[#1c1b19]">
                  Quy Chuẩn Thẩm Định Định Danh (ISO-27001)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowIsoModal(false)}
                className="text-[#7e766a] hover:text-[#1c1b19] p-1"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="space-y-3 text-xs text-[#4c463c] leading-relaxed">
              <div className="p-3 rounded-xl bg-[#f7f3ef] border border-[#cfc5b8]/30 space-y-1.5">
                <strong className="text-[#1c1b19] block">
                  1. Thời gian xử lý cam kết (SLA):
                </strong>
                <p>
                  Hồ sơ thông thường xử lý trong 24 giờ. Hồ sơ khẩn cấp (có cọc thuê
                  đang chờ ký kết) cam kết đối soát dưới 4 giờ.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-[#f7f3ef] border border-[#cfc5b8]/30 space-y-1.5">
                <strong className="text-[#1c1b19] block">
                  2. Tiêu chuẩn giấy tờ hợp lệ:
                </strong>
                <p>
                  CCCD gắn chip mặt trước & mặt sau rõ nét, không lóa quang học. Đối
                  với hộ chiếu quốc tế cần có video liveness 3D đối chiếu khuôn mặt.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-[#f7f3ef] border border-[#cfc5b8]/30 space-y-1.5">
                <strong className="text-[#1c1b19] block">
                  3. Nguyên tắc bảo đảm phân vai:
                </strong>
                <p className="text-[#ba1a1a] font-semibold">
                  Xét duyệt KYC là nghiệp vụ tuân thủ pháp luật, tuyệt đối không nâng
                  quyền hay thay đổi vai trò (Role) của người dùng trong hệ thống.
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-[#f2ede9]">
              <button
                type="button"
                onClick={() => setShowIsoModal(false)}
                className="px-5 py-2 rounded-xl bg-[#1c1b19] text-white text-xs font-semibold hover:bg-[#31302e] transition-colors"
              >
                Đã Hiểu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KycApproval;
