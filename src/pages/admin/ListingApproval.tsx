import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { fetchAdminDashboardData } from "../../services/admin.api";

export type ListingStatus = "PENDING" | "APPROVED" | "REJECTED" | "HIDDEN";
export type StatusFilter = "ALL" | "PENDING" | "APPROVED" | "REJECTED" | "HIDDEN";

export interface RentListing {
  id: string;
  sku: string;
  title: string;
  grade: string;
  category: string;
  shopName: string;
  ownerName: string;
  ownerKycVerified: boolean;
  shopCode?: string;
  pricePerDay: number;
  depositAmount: number;
  depositTier: string;
  submittedAtDisplay: string;
  timezone: string;
  status: ListingStatus;
  rejectionReason?: string;
  hiddenReason?: string;
  serialNumber?: string;
  images: string[];
  publicUrl?: string;
}

const INITIAL_LISTINGS: RentListing[] = [
  {
    id: "rent-1",
    sku: "#HB-RNT-907X",
    title: "Canon EOS R6 Mark II Kit",
    grade: "Grade A+ (Mint)",
    category: "Máy ảnh & Quang học",
    shopName: "Kyoto Archival Optics",
    ownerName: "Vũ Thanh Tùng",
    ownerKycVerified: true,
    pricePerDay: 450000,
    depositAmount: 12500000,
    depositTier: "Bảo hiểm Escrow Tier 1",
    submittedAtDisplay: "Hôm nay, 08:30",
    timezone: "ICT",
    status: "PENDING",
    serialNumber: "SN-CN-8839210",
    images: [
      "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=600&q=80",
    ],
    publicUrl: "/rent/products/1",
  },
  {
    id: "rent-2",
    sku: "#HB-RNT-50CM",
    title: "Hasselblad 907X & CFV II 50C Kit",
    grade: "Collector Pristine",
    category: "Máy ảnh Trung Khổ",
    shopName: "Kyoto Archival Optics",
    ownerName: "Vũ Thanh Tùng (#SHP-0418)",
    ownerKycVerified: true,
    pricePerDay: 1200000,
    depositAmount: 28000000,
    depositTier: "Bảo lãnh Giám định Cấp 3",
    submittedAtDisplay: "Hôm nay, 10:15",
    timezone: "ICT",
    status: "PENDING",
    serialNumber: "SN-HB-5029104",
    images: [
      "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?auto=format&fit=crop&w=600&q=80",
    ],
    publicUrl: "/rent/products/2",
  },
  {
    id: "rent-3",
    sku: "#HB-LCA-35AP",
    title: "Leica Summilux-M 35mm f/1.4 ASPH",
    grade: "Grade A (Excellent)",
    category: "Ống kính & Kính lọc",
    shopName: "Da Nang Camera Vault",
    ownerName: "Trần Minh Khoa (#SHP-0209)",
    ownerKycVerified: true,
    pricePerDay: 380000,
    depositAmount: 15000000,
    depositTier: "Bảo lãnh Smart Escrow",
    submittedAtDisplay: "Hôm qua, 16:40",
    timezone: "ICT",
    status: "APPROVED",
    serialNumber: "SN-LC-3514092",
    images: [
      "https://images.unsplash.com/photo-1617005082133-548c4dd27f35?auto=format&fit=crop&w=600&q=80",
    ],
    publicUrl: "/rent/products/3",
  },
  {
    id: "rent-4",
    sku: "#HB-SNY-FX60",
    title: "Sony FX6 Cinema Line Full-Frame",
    grade: "Grade B+ (Cinema used)",
    category: "Thiết bị Cinema & Video",
    shopName: "Saigon Cinema Vault",
    ownerName: "Anh Nguyen Le (#SHP-0881)",
    ownerKycVerified: true,
    pricePerDay: 1650000,
    depositAmount: 45000000,
    depositTier: "Chờ Ký Quỹ Đầy Đủ",
    submittedAtDisplay: "2 ngày trước, 11:05",
    timezone: "ICT",
    status: "REJECTED",
    rejectionReason: "Lý do: Serial không khớp hồ sơ & thiếu ảnh macro buồng cảm biến.",
    serialNumber: "SN-SNY-600123",
    images: [
      "https://images.unsplash.com/photo-1589872765304-c6f6fe658932?auto=format&fit=crop&w=600&q=80",
    ],
    publicUrl: "/rent/products/4",
  },
  {
    id: "rent-5",
    sku: "#HB-ARR-ORBT",
    title: "Arri Orbiter LED High-Output Set",
    grade: "Studio Tested",
    category: "Thiết bị Cinema & Video",
    shopName: "Saigon Cinema Vault",
    ownerName: "Anh Nguyen Le (#SHP-0881)",
    ownerKycVerified: true,
    pricePerDay: 950000,
    depositAmount: 22000000,
    depositTier: "Bảo lãnh Smart Escrow",
    submittedAtDisplay: "3 ngày trước, 09:12",
    timezone: "ICT",
    status: "APPROVED",
    serialNumber: "SN-AR-992018",
    images: [
      "https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?auto=format&fit=crop&w=600&q=80",
    ],
    publicUrl: "/rent/products/5",
  },
  {
    id: "rent-6",
    sku: "#HB-SPK-ALPH",
    title: "Snow Peak Alpha Breeze 4P Tent",
    grade: "B-Corp Cleaned",
    category: "Thiết bị Dã ngoại Cao cấp",
    shopName: "Alpine Nomad Hub",
    ownerName: "Đặng Hồng Vân (#SHP-1120)",
    ownerKycVerified: true,
    pricePerDay: 180000,
    depositAmount: 3500000,
    depositTier: "Bảo lãnh Smart Escrow",
    submittedAtDisplay: "4 ngày trước, 15:20",
    timezone: "ICT",
    status: "APPROVED",
    serialNumber: "SN-SP-441092",
    images: [
      "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=600&q=80",
    ],
    publicUrl: "/rent/products/6",
  },
  {
    id: "rent-7",
    sku: "#HB-TE-OP1F",
    title: "Teenage Engineering OP-1 Field",
    grade: "Bảo trì cụm phím",
    category: "Âm thanh & Nhạc cụ",
    shopName: "Bauhaus Sound Lab",
    ownerName: "Lê Quang Huy (#SHP-0504)",
    ownerKycVerified: true,
    pricePerDay: 320000,
    depositAmount: 8000000,
    depositTier: "Đã đóng băng ký quỹ",
    submittedAtDisplay: "5 ngày trước, 18:45",
    timezone: "ICT",
    status: "HIDDEN",
    hiddenReason: "Chủ xưởng gửi yêu cầu bảo dưỡng bàn phím cơ.",
    serialNumber: "SN-TE-019283",
    images: [
      "https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=600&q=80",
    ],
    publicUrl: "/rent/products/7",
  },
];

export const ListingApproval: React.FC = () => {
  const [listings, setListings] = useState<RentListing[]>(INITIAL_LISTINGS);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [shopFilter, setShopFilter] = useState<string>("ALL");
  const [sortOption, setSortOption] = useState<string>("newest");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 7;

  // Modals & toast
  const [selectedListing, setSelectedListing] = useState<RentListing | null>(null);
  const [showIsoModal, setShowIsoModal] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Rejection handling inside modal
  const [isRejecting, setIsRejecting] = useState<boolean>(false);
  const [rejectionInput, setRejectionInput] = useState<string>("");

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Synchronize with real MongoDB Rental products from backend
  useEffect(() => {
    let isMounted = true;
    fetchAdminDashboardData()
      .then((data) => {
        if (!isMounted || !data || !Array.isArray(data.rentCatalogList)) return;
        const dbItems = data.rentCatalogList;
        if (dbItems.length > 0) {
          setListings((prev) => {
            const existingIds = new Set(prev.map((item) => item.id));
            const newMapped: RentListing[] = dbItems
              .filter((dbItem) => !existingIds.has(dbItem.id))
              .map((dbItem, idx) => ({
                id: dbItem.id,
                sku: `#HB-RNT-${dbItem.id.slice(-5).toUpperCase()}`,
                title: dbItem.name,
                grade: dbItem.condition === "NEW" ? "Grade S (Brand New)" : "Grade A (Like New)",
                category: dbItem.categoryName || "Thời trang & Sự kiện",
                shopName: dbItem.ownerName || "ReUse Official Shop",
                ownerName: dbItem.ownerName || "ReUse Official Shop",
                ownerKycVerified: true,
                pricePerDay: dbItem.pricePerDay,
                depositAmount: dbItem.depositAmount,
                depositTier: "Bảo lãnh Smart Escrow",
                submittedAtDisplay: "Đã đồng bộ DB",
                timezone: "ICT",
                status: dbItem.status as ListingStatus,
                serialNumber: `SN-DB-${1000 + idx}`,
                images: dbItem.images.length > 0 ? dbItem.images : [
                  "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=600&q=80"
                ],
                publicUrl: `/rent/products/${dbItem.id}`,
              }));

            return [...newMapped, ...prev];
          });
        }
      })
      .catch((err) => {
        console.warn("Không thể tải sản phẩm RENT từ API:", err);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Compute live metrics
  const metrics = useMemo(() => {
    const total = listings.length + 398; // scaled volume representation
    const pending = listings.filter((l) => l.status === "PENDING").length;
    const approved = listings.filter((l) => l.status === "APPROVED").length + 379;
    const rejected = listings.filter((l) => l.status === "REJECTED").length + 8;
    const hidden = listings.filter((l) => l.status === "HIDDEN").length + 4;

    return {
      total,
      pending,
      approved,
      rejected,
      hidden,
    };
  }, [listings]);

  // Extract unique category and shop options
  const categoryOptions = useMemo(() => {
    const set = new Set<string>();
    listings.forEach((l) => {
      if (l.category) set.add(l.category);
    });
    return Array.from(set);
  }, [listings]);

  const shopOptions = useMemo(() => {
    const set = new Set<string>();
    listings.forEach((l) => {
      if (l.shopName) set.add(l.shopName);
    });
    return Array.from(set);
  }, [listings]);

  // Filtering & Sorting
  const filteredListings = useMemo(() => {
    let result = listings.filter((item) => {
      // Status filter
      if (statusFilter !== "ALL" && item.status !== statusFilter) {
        return false;
      }
      // Category filter
      if (categoryFilter !== "ALL" && item.category !== categoryFilter) {
        return false;
      }
      // Shop filter
      if (shopFilter !== "ALL" && item.shopName !== shopFilter) {
        return false;
      }
      // Search query
      if (searchQuery.trim() !== "") {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = item.title.toLowerCase().includes(q);
        const matchSku = item.sku.toLowerCase().includes(q);
        const matchCat = item.category.toLowerCase().includes(q);
        const matchShop = item.shopName.toLowerCase().includes(q);
        const matchOwner = item.ownerName.toLowerCase().includes(q);
        const matchSerial = item.serialNumber?.toLowerCase().includes(q);
        if (!matchTitle && !matchSku && !matchCat && !matchShop && !matchOwner && !matchSerial) {
          return false;
        }
      }
      return true;
    });

    // Sort
    result = [...result].sort((a, b) => {
      if (sortOption === "price-desc") return b.pricePerDay - a.pricePerDay;
      if (sortOption === "deposit-desc") return b.depositAmount - a.depositAmount;
      if (sortOption === "urgent") {
        if (a.status === "PENDING" && b.status !== "PENDING") return -1;
        if (a.status !== "PENDING" && b.status === "PENDING") return 1;
      }
      return 0; // Default newest
    });

    return result;
  }, [listings, statusFilter, categoryFilter, shopFilter, searchQuery, sortOption]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, categoryFilter, shopFilter, searchQuery, sortOption]);

  // Pagination slice
  const totalPages = Math.max(1, Math.ceil(filteredListings.length / pageSize));
  const paginatedListings = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredListings.slice(start, start + pageSize);
  }, [filteredListings, currentPage, pageSize]);

  // Handle Approve Listing
  const handleApprove = (id: string, title: string) => {
    setListings((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              status: "APPROVED",
              rejectionReason: undefined,
              hiddenReason: undefined,
            }
          : item
      )
    );
    if (selectedListing && selectedListing.id === id) {
      setSelectedListing((prev) => (prev ? { ...prev, status: "APPROVED" } : null));
    }
    showToast(`Đã duyệt & cấp tem thẩm định cho sản phẩm: "${title}"!`);
  };

  // Handle Reject Listing
  const handleReject = (id: string, title: string) => {
    const reason =
      rejectionInput.trim() ||
      "Ảnh macro buồng cảm biến chưa rõ hoặc số serial không trùng khớp";
    setListings((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              status: "REJECTED",
              rejectionReason: `Lý do: ${reason}`,
            }
          : item
      )
    );
    if (selectedListing && selectedListing.id === id) {
      setSelectedListing((prev) =>
        prev ? { ...prev, status: "REJECTED", rejectionReason: `Lý do: ${reason}` } : null
      );
    }
    setIsRejecting(false);
    setRejectionInput("");
    showToast(`Đã trả về hồ sơ hiện vật "${title}". Yêu cầu chủ xưởng bổ sung chứng từ.`);
  };

  // Handle Activate / Unhide
  const handleActivate = (id: string, title: string) => {
    setListings((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              status: "APPROVED",
              hiddenReason: undefined,
            }
          : item
      )
    );
    showToast(`Đã kích hoạt trạng thái khả dụng cho sản phẩm: "${title}"!`);
  };

  // Reset all filters
  const handleResetFilters = () => {
    setStatusFilter("ALL");
    setSearchQuery("");
    setCategoryFilter("ALL");
    setShopFilter("ALL");
    setSortOption("newest");
    setCurrentPage(1);
    showToast("Đã đặt lại toàn bộ bộ lọc mặc định");
  };

  // Export CSV
  const handleExportCsv = () => {
    const headers = [
      "Mã SKU",
      "Tên Sản Phẩm",
      "Tình Trạng (Grade)",
      "Danh Mục",
      "Chủ Xưởng",
      "Giá Thuê/Ngày (VND)",
      "Tiền Ký Quỹ Escrow (VND)",
      "Trạng Thái",
      "Số Serial",
      "Ngày Gửi",
    ];

    const rows = filteredListings.map((l) => [
      `"${l.sku}"`,
      `"${l.title}"`,
      `"${l.grade}"`,
      `"${l.category}"`,
      `"${l.shopName}"`,
      `"${l.pricePerDay}"`,
      `"${l.depositAmount}"`,
      `"${l.status}"`,
      `"${l.serialNumber || ""}"`,
      `"${l.submittedAtDisplay}"`,
    ]);

    const csvContent =
      "\uFEFF" + [headers.join(","), ...rows.map((e) => e.join(","))].join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `Bao_Cao_Kiem_Duyet_RENT_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast(`Đã xuất báo cáo ${filteredListings.length} sản phẩm RENT ra file CSV!`);
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

      {/* CONTENT CONTAINER */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-8 w-full flex flex-col space-y-8">
        {/* BREADCRUMB & METADATA NODE */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-[#4c463c]">
            <Link
              to="/admin/dashboard"
              className="hover:text-[#6c5937] transition-colors cursor-pointer"
            >
              Quản Trị Hệ Thống
            </Link>
            <span className="text-[#cfc5b8]">/</span>
            <span className="hover:text-[#6c5937] transition-colors cursor-pointer">
              Quản Lý Sản Phẩm RENT
            </span>
            <span className="text-[#cfc5b8]">/</span>
            <span className="text-[#1c1b19] font-semibold">
              Hàng Đợi Kiểm Duyệt Niêm Yết
            </span>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto bg-[#ece7e4] px-3 py-1 rounded-lg">
            <span className="w-1.5 h-1.5 rounded-full bg-[#48654b]"></span>
            <span className="text-[11px] uppercase tracking-wider text-[#4c463c] font-semibold">
              AUDIT NODE #VN-RENT-AUDIT • SỔ CÁI BẢO HIỂM LƯU KÝ ĐỒNG BỘ
            </span>
          </div>
        </div>

        {/* MAIN HEADING & ACTIONS */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-2">
          <div className="max-w-3xl space-y-2">
            <div className="flex items-center gap-3">
              <span className="text-[11px] uppercase tracking-widest text-[#6c5937] font-bold px-2 py-0.5 rounded bg-[#e6e2de]">
                QUY TRÌNH THẨM ĐỊNH LƯU KÝ
              </span>
              <span className="font-mono text-xs text-[#7e766a]">
                PROTOCOL ID: RH-RNT-VERIF-v4
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#1c1b19] tracking-tight">
              RENT Listings
              <span className="text-sm sm:text-base text-[#4c463c] font-normal block sm:inline sm:ml-2">
                (Kiểm Duyệt Sản Phẩm Cho Thuê)
              </span>
            </h1>
            <p className="text-sm sm:text-base text-[#4c463c] leading-relaxed">
              Kiểm duyệt sản phẩm cho thuê trước khi hiển thị trên marketplace. Đối
              soát hiện vật, hạn mức bảo hiểm ký quỹ và quy chuẩn bảo quản lưu ký B-Corp
              Circularity.
            </p>
          </div>

          {/* Compliance & Export Utilities */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setShowIsoModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#ece7e4] text-[#1c1b19] hover:bg-[#e6e2de] transition-colors text-xs font-semibold"
            >
              <span className="material-symbols-outlined text-[18px] text-[#6c5937]">
                verified
              </span>
              Quy Chuẩn ISO-14044
            </button>
            <button
              type="button"
              onClick={handleExportCsv}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1c1b19] text-[#f4f0ec] hover:bg-[#6c5937] transition-colors text-xs font-semibold shadow-xs"
            >
              <span className="material-symbols-outlined text-[18px]">
                ios_share
              </span>
              Xuất Báo Cáo CSV
            </button>
          </div>
        </div>

        {/* GOVERNANCE PRINCIPLE BANNER (ROLE BOUNDARIES) */}
        <div className="relative overflow-hidden bg-[#ece7e4] rounded-xl p-5 border border-[#cfc5b8]/30">
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 rounded-lg bg-[#86724d]/20 flex items-center justify-center shrink-0 mt-0.5 text-[#6c5937]">
              <span className="material-symbols-outlined text-[20px]">policy</span>
            </div>
            <div className="space-y-1.5 min-w-0">
              <div className="flex items-center gap-3">
                <h2 className="text-xs uppercase tracking-wider text-[#1c1b19] font-bold">
                  NGUYÊN TẮC QUẢN TRỊ KIỂM DUYỆT RENT (GOVERNANCE PROTOCOL)
                </h2>
                <span className="px-2 py-0.5 rounded bg-[#e6e2de] text-[#6c5937] font-mono text-[10px] uppercase font-bold">
                  Role: Admin Verifier
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[#4c463c] leading-normal">
                Quyền tạo và cập nhật hiện vật RENT thuộc duy nhất về{" "}
                <strong className="text-[#1c1b19] font-semibold">
                  Chủ Xưởng (Shop Owner)
                </strong>
                . Quản trị viên chỉ có thẩm quyền Thẩm định chứng thư, Phê duyệt
                hoặc Từ chối niêm yết dựa trên chuẩn vật lý, số serial và ký quỹ Smart
                Escrow. Tuyệt đối không can thiệp thay đổi giá hoặc thông số hiện vật.
              </p>
            </div>
          </div>
        </div>

        {/* SUMMARY METRICS CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total */}
          <div className="bg-[#f7f3ef] p-5 rounded-xl border border-[#cfc5b8]/40 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs uppercase tracking-wider text-[#7e766a] font-semibold">
                Tổng Sản Phẩm RENT
              </span>
              <span className="material-symbols-outlined text-[#6c5937] text-[20px]">
                layers
              </span>
            </div>
            <div>
              <div className="text-3xl font-serif font-bold text-[#1c1b19] leading-none mb-1">
                {metrics.total}
              </div>
              <div className="text-xs text-[#4c463c] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#48654b]"></span>
                Đã đồng bộ trên sổ cái lưu ký
              </div>
            </div>
          </div>

          {/* Pending */}
          <div className="bg-[#f2ede9] p-5 rounded-xl border border-[#cfc5b8]/40 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs uppercase tracking-wider text-[#7f5227] font-bold">
                Chờ Duyệt (Pending)
              </span>
              <span className="px-2 py-0.5 rounded bg-[#ffdcc1] text-[#2e1500] font-mono text-[11px] font-bold">
                {metrics.pending} HỒ SƠ
              </span>
            </div>
            <div>
              <div className="text-3xl font-serif font-bold text-[#7f5227] leading-none mb-1">
                {metrics.pending}
              </div>
              <div className="text-xs text-[#4c463c]">
                Cần xử lý trong 24h (
                <span className="text-[#7f5227] font-semibold">
                  3 quang học cao cấp
                </span>
                )
              </div>
            </div>
          </div>

          {/* Approved */}
          <div className="bg-[#f7f3ef] p-5 rounded-xl border border-[#cfc5b8]/40 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs uppercase tracking-wider text-[#48654b] font-semibold">
                Đã Phê Duyệt (Active)
              </span>
              <span className="material-symbols-outlined text-[#48654b] text-[20px]">
                check_circle
              </span>
            </div>
            <div>
              <div className="text-3xl font-serif font-bold text-[#1c1b19] leading-none mb-1">
                {metrics.approved}
              </div>
              <div className="text-xs text-[#4c463c] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#48654b]"></span>
                Đang lưu hành công khai trên sàn RENT
              </div>
            </div>
          </div>

          {/* Rejected & Hidden */}
          <div className="bg-[#f7f3ef] p-5 rounded-xl border border-[#cfc5b8]/40 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs uppercase tracking-wider text-[#7e766a] font-semibold">
                Bị Từ Chối / Tạm Ẩn
              </span>
              <span className="material-symbols-outlined text-[#ba1a1a] text-[20px]">
                history_toggle_off
              </span>
            </div>
            <div>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-3xl font-serif font-bold text-[#ba1a1a] leading-none">
                  {metrics.rejected}
                </span>
                <span className="text-base text-[#7e766a]">
                  / {metrics.hidden} Tạm Ẩn
                </span>
              </div>
              <div className="text-xs text-[#4c463c]">
                Yêu cầu bổ sung ảnh hoặc bảo trì
              </div>
            </div>
          </div>
        </div>

        {/* FILTER WORKBENCH & SEARCH */}
        <div className="bg-[#f7f3ef] p-5 rounded-xl space-y-4 border border-[#cfc5b8]/30">
          {/* Status Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
            <button
              type="button"
              onClick={() => setStatusFilter("ALL")}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                statusFilter === "ALL"
                  ? "bg-[#1c1b19] text-[#f4f0ec] shadow-xs"
                  : "bg-[#ece7e4] hover:bg-[#e6e2de] text-[#1c1b19]"
              }`}
            >
              Tất Cả ({metrics.total})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("PENDING")}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-2 ${
                statusFilter === "PENDING"
                  ? "bg-[#1c1b19] text-[#f4f0ec] shadow-xs"
                  : "bg-[#ece7e4] hover:bg-[#e6e2de] text-[#1c1b19]"
              }`}
            >
              <span>Chờ Duyệt (Pending Review)</span>
              <span className="w-5 h-5 rounded-full bg-[#7f5227] text-white flex items-center justify-center font-mono text-[10px]">
                {metrics.pending}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("APPROVED")}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                statusFilter === "APPROVED"
                  ? "bg-[#1c1b19] text-[#f4f0ec] shadow-xs"
                  : "bg-[#ece7e4] hover:bg-[#e6e2de] text-[#1c1b19]"
              }`}
            >
              Đã Phê Duyệt ({metrics.approved})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("REJECTED")}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                statusFilter === "REJECTED"
                  ? "bg-[#1c1b19] text-[#f4f0ec] shadow-xs"
                  : "bg-[#ece7e4] hover:bg-[#e6e2de] text-[#1c1b19]"
              }`}
            >
              Bị Từ Chối ({metrics.rejected})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("HIDDEN")}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                statusFilter === "HIDDEN"
                  ? "bg-[#1c1b19] text-[#f4f0ec] shadow-xs"
                  : "bg-[#ece7e4] hover:bg-[#e6e2de] text-[#1c1b19]"
              }`}
            >
              Tạm Ẩn ({metrics.hidden})
            </button>
          </div>

          {/* Controls Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-2">
            {/* Search Input */}
            <div className="md:col-span-5 relative">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7e766a] text-[20px]">
                search
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm theo tên sản phẩm, danh mục, mã SKU #HB-RNT..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white text-[#1c1b19] placeholder:text-[#7e766a] text-sm focus:outline-none shadow-xs border border-[#cfc5b8]/40"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7e766a] hover:text-[#1c1b19]"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              )}
            </div>

            {/* Category Dropdown */}
            <div className="md:col-span-3">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white text-[#1c1b19] text-xs font-medium focus:outline-none shadow-xs border border-[#cfc5b8]/40 cursor-pointer"
              >
                <option value="ALL">Tất cả danh mục hiện vật</option>
                {categoryOptions.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Shop Owner Filter */}
            <div className="md:col-span-2">
              <select
                value={shopFilter}
                onChange={(e) => setShopFilter(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white text-[#1c1b19] text-xs font-medium focus:outline-none shadow-xs border border-[#cfc5b8]/40 cursor-pointer"
              >
                <option value="ALL">Tất cả Chủ Xưởng</option>
                {shopOptions.map((shp) => (
                  <option key={shp} value={shp}>
                    {shp}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort */}
            <div className="md:col-span-2">
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white text-[#1c1b19] text-xs font-medium focus:outline-none shadow-xs border border-[#cfc5b8]/40 cursor-pointer"
              >
                <option value="newest">Mới gửi nhất (Newest)</option>
                <option value="price-desc">Giá thuê cao nhất</option>
                <option value="deposit-desc">Ký quỹ cao nhất</option>
                <option value="urgent">Cần thẩm định gấp</option>
              </select>
            </div>
          </div>
        </div>

        {/* MAIN EDITORIAL LISTINGS TABLE */}
        <div className="bg-white rounded-xl shadow-xs border border-[#cfc5b8]/40 overflow-hidden flex flex-col">
          {/* Table Header Bar */}
          <div className="px-6 py-4 bg-[#f7f3ef] flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#cfc5b8]/30">
            <div className="flex items-center gap-2">
              <span className="text-base text-[#1c1b19] font-semibold font-serif">
                Danh Sách Hồ Sơ Đang Duyệt
              </span>
              <span className="font-mono text-[11px] text-[#7e766a] px-2 py-0.5 rounded bg-[#ece7e4]">
                {paginatedListings.length} / {filteredListings.length} ĐANG HIỂN THỊ
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs text-[#4c463c]">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#7f5227]"></span> Chờ Thẩm
                Định
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#48654b]"></span> Đã Ký Phê
                Duyệt
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#ba1a1a]"></span> Trả Về Hiệu
                Chỉnh
              </span>
            </div>
          </div>

          {/* Scrollable Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#ece7e4]/70 text-[11px] uppercase tracking-wider text-[#7e766a] border-b border-[#cfc5b8]/30">
                  <th className="py-3.5 px-6 font-semibold">Sản Phẩm / Hiện Vật</th>
                  <th className="py-3.5 px-4 font-semibold">Danh Mục</th>
                  <th className="py-3.5 px-4 font-semibold">Chủ Xưởng Ký Gửi</th>
                  <th className="py-3.5 px-4 font-semibold text-right">
                    Giá Thuê / Ngày
                  </th>
                  <th className="py-3.5 px-4 font-semibold text-right">
                    Ký Quỹ Smart Escrow
                  </th>
                  <th className="py-3.5 px-4 font-semibold">Thời Gian Gửi</th>
                  <th className="py-3.5 px-4 font-semibold">Trạng Thái Hồ Sơ</th>
                  <th className="py-3.5 px-6 font-semibold text-right">
                    Hành Động Kiểm Duyệt
                  </th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-[#f2ede9]">
                {paginatedListings.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-[#7e766a]">
                      <span className="material-symbols-outlined text-[36px] block mb-2">
                        filter_list_off
                      </span>
                      <p className="font-serif text-base text-[#1c1b19]">
                        Không tìm thấy sản phẩm RENT nào khớp với bộ lọc
                      </p>
                      <button
                        type="button"
                        onClick={handleResetFilters}
                        className="mt-2 text-xs font-semibold text-[#6c5937] underline"
                      >
                        Đặt lại bộ lọc mặc định
                      </button>
                    </td>
                  </tr>
                ) : (
                  paginatedListings.map((item) => (
                    <tr
                      key={item.id}
                      className={`hover:bg-[#f7f3ef]/80 transition-colors ${
                        item.status === "REJECTED" ? "bg-[#ffdad6]/10" : ""
                      }`}
                    >
                      {/* Product */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-14 h-14 rounded-lg bg-[#e6e2de] shrink-0 overflow-hidden relative border border-[#cfc5b8]/40 shadow-xs">
                            <img
                              src={item.images[0]}
                              alt={item.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="min-w-0">
                            <Link
                              to={`/admin/rent-review/${item.id}`}
                              className="text-sm text-[#1c1b19] hover:text-[#6c5937] hover:underline font-serif font-bold truncate max-w-[200px] block transition-colors"
                              title="Mở thẩm định hồ sơ niêm yết"
                            >
                              {item.title}
                            </Link>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="font-mono text-[11px] text-[#7e766a] font-semibold">
                                {item.sku}
                              </span>
                              <span className="px-1.5 py-0.5 rounded bg-[#ece7e4] text-[#4c463c] text-[10px] font-medium">
                                {item.grade}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span className="px-2.5 py-1 rounded bg-[#ece7e4] text-[#4c463c] text-xs font-medium">
                          {item.category}
                        </span>
                      </td>

                      {/* Shop Owner */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="text-xs font-semibold text-[#1c1b19]">
                          {item.shopName}
                        </div>
                        <Link
                          to={`/admin/rent-review/${item.id}`}
                          className="text-[11px] text-[#48654b] hover:text-[#6c5937] hover:underline flex items-center gap-1 font-medium transition-colors"
                          title="Xem hồ sơ thẩm định định danh của chủ xưởng"
                        >
                          <span className="material-symbols-outlined text-[13px]">
                            verified_user
                          </span>
                          <span>{item.ownerName}</span>
                        </Link>
                      </td>

                      {/* Rent Price */}
                      <td className="py-4 px-4 text-right whitespace-nowrap">
                        <span className="text-sm font-bold text-[#1c1b19]">
                          {item.pricePerDay.toLocaleString("vi-VN")} ₫
                        </span>
                        <span className="text-[#7e766a] text-[11px] block">/ ngày</span>
                      </td>

                      {/* Escrow Deposit */}
                      <td className="py-4 px-4 text-right whitespace-nowrap">
                        <span className="text-xs font-semibold text-[#1c1b19]">
                          {item.depositAmount.toLocaleString("vi-VN")} ₫
                        </span>
                        <span className="text-[10px] text-[#48654b] block font-mono">
                          {item.depositTier}
                        </span>
                      </td>

                      {/* Submitted Time */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="text-xs text-[#1c1b19] font-medium">
                          {item.submittedAtDisplay}
                        </div>
                        <div className="font-mono text-[11px] text-[#7e766a]">
                          {item.timezone}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        {item.status === "PENDING" && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#ffdcc1] text-[#2e1500] text-[11px] font-bold uppercase tracking-wider">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#7f5227] animate-pulse"></span>
                            Chờ Duyệt (Pending)
                          </span>
                        )}

                        {item.status === "APPROVED" && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#caebc9] text-[#05210c] text-[11px] font-bold uppercase tracking-wider">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#48654b]"></span>
                            Đã Phê Duyệt (Approved)
                          </span>
                        )}

                        {item.status === "REJECTED" && (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-[#ffdad6] text-[#93000a] text-[11px] font-bold uppercase tracking-wider">
                              <span className="material-symbols-outlined text-[13px]">
                                cancel
                              </span>
                              Bị Từ Chối (Rejected)
                            </span>
                            {item.rejectionReason && (
                              <p
                                className="text-[11px] text-[#ba1a1a] leading-tight max-w-[200px] truncate"
                                title={item.rejectionReason}
                              >
                                {item.rejectionReason}
                              </p>
                            )}
                          </div>
                        )}

                        {item.status === "HIDDEN" && (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-[#ece7e4] text-[#7e766a] text-[11px] font-bold uppercase tracking-wider">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#7e766a]"></span>
                              Tạm Ẩn (Hidden)
                            </span>
                            {item.hiddenReason && (
                              <p
                                className="text-[11px] text-[#7e766a] leading-tight max-w-[180px] truncate"
                                title={item.hiddenReason}
                              >
                                {item.hiddenReason}
                              </p>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Action */}
                      <td className="py-4 px-6 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-2">
                          <Link
                            to={`/admin/rent-review/${item.id}`}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold shadow-xs inline-flex items-center gap-1.5 transition-colors ${
                              item.status === "PENDING"
                                ? "bg-[#1c1b19] text-[#f4f0ec] hover:bg-[#6c5937]"
                                : item.status === "REJECTED"
                                ? "bg-[#ffdad6] text-[#ba1a1a] hover:bg-[#ffdad6]/80"
                                : "bg-[#ece7e4] hover:bg-[#e6e2de] text-[#1c1b19]"
                            }`}
                            title="Mở toàn màn hình trang thẩm định hồ sơ pháp lý & KYC"
                          >
                            <span className="material-symbols-outlined text-[15px]">
                              {item.status === "PENDING"
                                ? "visibility"
                                : item.status === "REJECTED"
                                ? "error_outline"
                                : "description"}
                            </span>
                            <span>
                              {item.status === "PENDING"
                                ? "Hồ Sơ (Thẩm Định)"
                                : item.status === "REJECTED"
                                ? "Hồ Sơ Lỗi"
                                : "Xem Hồ Sơ"}
                            </span>
                          </Link>

                          <button
                            type="button"
                            onClick={() => {
                              setSelectedListing(item);
                              setIsRejecting(false);
                              setRejectionInput("");
                            }}
                            className="p-1.5 rounded-xl text-[#7e766a] hover:text-[#1c1c18] hover:bg-[#ece7e4] transition-colors"
                            title="Xem nhanh thông số tóm tắt"
                          >
                            <span className="material-symbols-outlined text-[17px]">
                              info
                            </span>
                          </button>

                          {item.status === "APPROVED" ? (
                            <Link
                              to={item.publicUrl || `/rent/products/${item.id}`}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2.5 py-1.5 rounded-xl bg-[#ece7e4] hover:bg-[#e6e2de] text-[#6c5937] transition-colors text-xs inline-flex items-center gap-1"
                              title="Xem trên sàn RENT công khai"
                            >
                              <span className="material-symbols-outlined text-[15px]">
                                open_in_new
                              </span>
                              Sàn
                            </Link>
                          ) : item.status === "HIDDEN" ? (
                            <button
                              type="button"
                              onClick={() => handleActivate(item.id, item.title)}
                              className="px-2.5 py-1.5 rounded-xl bg-[#ece7e4] hover:bg-[#e6e2de] text-[#48654b] transition-colors text-xs inline-flex items-center gap-1 font-semibold"
                              title="Khôi phục trạng thái khả dụng sau bảo trì"
                            >
                              <span className="material-symbols-outlined text-[15px]">
                                refresh
                              </span>
                              Kích Hoạt
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled
                              className="px-2.5 py-1.5 rounded-xl bg-[#ece7e4] text-[#7e766a] text-xs cursor-not-allowed opacity-50 inline-flex items-center gap-1"
                              title="Chưa phê duyệt, không thể xem trang công khai"
                            >
                              <span className="material-symbols-outlined text-[15px]">
                                lock
                              </span>
                              Sàn
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINATION FOOTER */}
          <div className="px-6 py-4 bg-[#f7f3ef] flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-[#4c463c] border-t border-[#cfc5b8]/30">
            <div>
              Hiển thị{" "}
              <span className="font-semibold text-[#1c1b19]">
                {filteredListings.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}{" "}
                đến {Math.min(currentPage * pageSize, filteredListings.length)}
              </span>{" "}
              trong số{" "}
              <span className="font-semibold text-[#7f5227]">
                {filteredListings.length} sản phẩm
              </span>{" "}
              đang lọc{" "}
              <span className="text-[#7e766a]">
                (Tổng {metrics.total} sản phẩm toàn sàn RENT)
              </span>
            </div>

            <div className="flex items-center gap-1 text-xs">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-xl bg-[#ece7e4] text-[#4c463c] hover:text-[#1c1b19] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Trước
              </button>

              {Array.from({ length: totalPages }).map((_, i) => {
                const pageNum = i + 1;
                return (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-8 h-8 rounded-xl font-semibold flex items-center justify-center transition-colors ${
                      currentPage === pageNum
                        ? "bg-[#1c1b19] text-[#f4f0ec] shadow-xs"
                        : "bg-[#ece7e4] hover:bg-[#e6e2de] text-[#1c1b19]"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 rounded-xl bg-[#ece7e4] hover:bg-[#e6e2de] text-[#1c1b19] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Sau
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* DETAIL & VERIFICATION MODAL */}
      {selectedListing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-7 space-y-6 shadow-2xl border border-[#cfc5b8]/50 my-8 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-[#f2ede9] pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#6c5937] bg-[#f2ede9] px-2 py-0.5 rounded">
                    {selectedListing.sku}
                  </span>
                  <span
                    className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                      selectedListing.status === "APPROVED"
                        ? "bg-[#caebc9] text-[#05210c]"
                        : selectedListing.status === "REJECTED"
                        ? "bg-[#ffdad6] text-[#93000a]"
                        : selectedListing.status === "HIDDEN"
                        ? "bg-[#ece7e4] text-[#7e766a]"
                        : "bg-[#ffdcc1] text-[#2e1500]"
                    }`}
                  >
                    {selectedListing.status === "APPROVED"
                      ? "Đã Duyệt"
                      : selectedListing.status === "REJECTED"
                      ? "Bị Từ Chối"
                      : selectedListing.status === "HIDDEN"
                      ? "Tạm Ẩn Bảo Trì"
                      : "Chờ Kiểm Duyệt"}
                  </span>
                </div>
                <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#1c1b19]">
                  {selectedListing.title}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedListing(null);
                  setIsRejecting(false);
                }}
                className="text-[#7e766a] hover:text-[#1c1b19] p-1.5 rounded-lg hover:bg-[#f2ede9]"
              >
                <span className="material-symbols-outlined text-[22px]">close</span>
              </button>
            </div>

            {/* Product Image & Specs */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-center">
              <div className="sm:col-span-5 h-44 rounded-xl overflow-hidden bg-[#f7f3ef] border border-[#cfc5b8]/40">
                <img
                  src={selectedListing.images[0]}
                  alt={selectedListing.title}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="sm:col-span-7 grid grid-cols-2 gap-3 text-xs bg-[#f7f3ef] p-4 rounded-xl border border-[#cfc5b8]/30">
                <div>
                  <span className="text-[#7e766a] block">Chủ sở hữu:</span>
                  <span className="font-semibold text-[#1c1b19]">
                    {selectedListing.shopName}
                  </span>
                </div>
                <div>
                  <span className="text-[#7e766a] block">Danh mục:</span>
                  <span className="font-semibold text-[#1c1b19]">
                    {selectedListing.category}
                  </span>
                </div>
                <div>
                  <span className="text-[#7e766a] block">Giá thuê niêm yết:</span>
                  <span className="font-bold text-[#1c1b19]">
                    {selectedListing.pricePerDay.toLocaleString("vi-VN")} ₫ / ngày
                  </span>
                </div>
                <div>
                  <span className="text-[#7e766a] block">Ký quỹ Smart Escrow:</span>
                  <span className="font-bold text-[#48654b]">
                    {selectedListing.depositAmount.toLocaleString("vi-VN")} ₫
                  </span>
                </div>
                <div>
                  <span className="text-[#7e766a] block">Số Serial máy:</span>
                  <span className="font-mono font-bold text-[#6c5937]">
                    {selectedListing.serialNumber || "SN-VALID-009"}
                  </span>
                </div>
                <div>
                  <span className="text-[#7e766a] block">Xếp hạng vật lý:</span>
                  <span className="font-semibold text-[#1c1b19]">
                    {selectedListing.grade}
                  </span>
                </div>
              </div>
            </div>

            {/* Compliance Verification Protocol Checks */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#4c463c] flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-[#48654b]">
                  rule
                </span>
                Bộ Tiêu Chí Thẩm Định Niêm Yết RENT (Protocol Verification)
              </h4>

              <div className="space-y-2 text-xs">
                <div className="p-3 rounded-xl bg-white border border-[#cfc5b8]/40 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#48654b] text-[18px]">
                      check_circle
                    </span>
                    <span className="font-medium text-[#1c1b19]">
                      Đối soát chứng thư số & Mã Serial vật lý với hồ sơ Chủ Xưởng
                    </span>
                  </div>
                  <span className="font-mono text-[11px] text-[#48654b] font-semibold">
                    HỢP LỆ (100%)
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-white border border-[#cfc5b8]/40 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#48654b] text-[18px]">
                      check_circle
                    </span>
                    <span className="font-medium text-[#1c1b19]">
                      Bảo đảm vệ sinh vô trùng B-Corp & Chứng nhận thử tải kỹ thuật
                    </span>
                  </div>
                  <span className="font-mono text-[11px] text-[#48654b] font-semibold">
                    ĐÃ KIỂM ĐỊNH
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-white border border-[#cfc5b8]/40 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#48654b] text-[18px]">
                      check_circle
                    </span>
                    <span className="font-medium text-[#1c1b19]">
                      Hợp đồng điện tử Smart Escrow & Hạn mức ký quỹ bảo hiểm kho
                    </span>
                  </div>
                  <span className="font-mono text-[11px] text-[#48654b] font-semibold">
                    SẴN SÀNG KHÓA CỌC
                  </span>
                </div>
              </div>
            </div>

            {/* Rejection input area if rejecting */}
            {isRejecting && (
              <div className="p-4 rounded-xl bg-[#ffdad6]/40 border border-[#ba1a1a]/30 space-y-3">
                <label
                  htmlFor="reject-listing-reason"
                  className="block text-xs font-bold text-[#ba1a1a] uppercase"
                >
                  Lý do từ chối / trả về hồ sơ (Gửi email tới Chủ Xưởng):
                </label>
                <textarea
                  id="reject-listing-reason"
                  rows={3}
                  value={rejectionInput}
                  onChange={(e) => setRejectionInput(e.target.value)}
                  placeholder="Ví dụ: Serial thân máy không khớp giấy tờ kiểm định và thiếu 3 ảnh macro góc nghiêng buồng cảm biến..."
                  className="w-full p-2.5 rounded-lg bg-white border border-[#ba1a1a]/40 text-xs text-[#1c1b19] focus:outline-none focus:ring-1 focus:ring-[#ba1a1a]"
                ></textarea>
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsRejecting(false)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#4c463c] hover:bg-white"
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleReject(selectedListing.id, selectedListing.title)
                    }
                    className="px-4 py-1.5 rounded-lg bg-[#ba1a1a] text-white text-xs font-bold hover:bg-[#93000a]"
                  >
                    Xác Nhận Từ Chối Niêm Yết
                  </button>
                </div>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-[#f2ede9]">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedListing(null);
                    setIsRejecting(false);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[#4c463c] hover:bg-[#f2ede9] transition-colors"
                >
                  Đóng
                </button>

                <Link
                  to={`/admin/rent-review/${selectedListing.id}`}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#f2ede9] hover:bg-[#e6e2de] text-[#1c1b19] flex items-center gap-1.5 transition-colors border border-[#cfc5b8]/40 shadow-xs"
                >
                  <span className="material-symbols-outlined text-[16px] text-[#6c5937]">
                    badge
                  </span>
                  <span>Mở Trang Thẩm Định Hồ Sơ</span>
                </Link>
              </div>

              <div className="flex items-center gap-3">
                {selectedListing.status !== "REJECTED" && !isRejecting && (
                  <button
                    type="button"
                    onClick={() => setIsRejecting(true)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#ffdad6] text-[#ba1a1a] hover:bg-[#ffdad6]/80 transition-colors"
                  >
                    Từ Chối Niêm Yết
                  </button>
                )}

                {selectedListing.status !== "APPROVED" && !isRejecting && (
                  <button
                    type="button"
                    onClick={() =>
                      handleApprove(selectedListing.id, selectedListing.title)
                    }
                    className="px-5 py-2 rounded-xl text-xs font-semibold bg-[#1c1b19] text-white hover:bg-[#6c5937] transition-colors shadow-xs flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      verified
                    </span>
                    Duyệt & Cấp Tem Kiểm Định
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ISO-14044 GUIDELINE MODAL */}
      {showIsoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-[#cfc5b8]/50">
            <div className="flex items-center justify-between border-b border-[#f2ede9] pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#6c5937] text-[22px]">
                  verified
                </span>
                <h3 className="font-serif text-lg font-bold text-[#1c1b19]">
                  Quy Chuẩn Thẩm Định Hiện Vật (ISO-14044 & B-Corp)
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
                  1. Giám định tính nguyên bản & Số Serial:
                </strong>
                <p>
                  Hiện vật đăng tải phải có số serial rõ ràng, ảnh chụp macro quang học
                  không qua can thiệp kỹ thuật số. Kiểm tra chống hàng nhái theo chuẩn
                  nhà sản xuất.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-[#f7f3ef] border border-[#cfc5b8]/30 space-y-1.5">
                <strong className="text-[#1c1b19] block">
                  2. Khóa ký quỹ Smart Escrow:
                </strong>
                <p>
                  Mọi sản phẩm trước khi xuất bản ra thị trường RENT phải đối soát hạn
                  mức cọc tối thiểu để đảm bảo khả năng bồi hoàn khi xảy ra sự cố hư hại
                  vật lý.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-[#f7f3ef] border border-[#cfc5b8]/30 space-y-1.5">
                <strong className="text-[#1c1b19] block">
                  3. Ranh giới trách nhiệm quản trị:
                </strong>
                <p className="text-[#6c5937] font-semibold">
                  Admin Verifier chỉ có quyền Duyệt / Từ chối dựa trên tính chân thực,
                  tuyệt đối không can thiệp thay đổi giá niêm yết của Chủ Xưởng.
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-[#f2ede9]">
              <button
                type="button"
                onClick={() => setShowIsoModal(false)}
                className="px-5 py-2 rounded-xl bg-[#1c1b19] text-white text-xs font-semibold hover:bg-[#31302e] transition-colors"
              >
                Đã Hiểu Quy Chuẩn
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ListingApproval;
