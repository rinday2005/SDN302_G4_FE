import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { fetchAdminDashboardData } from "../../services/admin.api";

export type ThriftStatus = "PENDING" | "APPROVED" | "REJECTED" | "SOLD";
export type ThriftStatusFilter = "ALL" | "PENDING" | "APPROVED" | "REJECTED" | "AVAILABLE" | "SOLD";
export type OriginType = "SHOP_INVENTORY" | "SECOND_LIFE";

export interface ThriftListing {
  id: string;
  sku: string;
  title: string;
  category: string;
  conditionGrade: string;
  conditionNote: string;
  price: number;
  priceNote?: string;
  originType: OriginType;
  originNote: string;
  shopName: string;
  ownerName: string;
  ownerKycVerified: boolean;
  submittedAtDisplay: string;
  submittedAtSub: string;
  status: ThriftStatus;
  isAvailable: boolean;
  rejectionReason?: string;
  serialNumber?: string;
  imageUrl: string;
  publicUrl: string;
  mechanicalCheck?: boolean;
  opticalCheck?: boolean;
  serialMatch?: boolean;
  provenanceDocs?: boolean;
  bCorpCertified?: boolean;
}

const INITIAL_THRIFT_LISTINGS: ThriftListing[] = [
  {
    id: "9021",
    sku: "#HB-THF-9021",
    title: "Leica M6 Classic 0.72x Black Chrome",
    category: "Máy ảnh & Quang học",
    conditionGrade: "Pristine 9.2/10",
    conditionNote: "Minor brassing, CLA serviced 2024",
    price: 68500000,
    priceNote: "Đã bao gồm VAT & Phí thẩm định",
    originType: "SECOND_LIFE",
    originNote: "Từ RENT fleet #RNT-4920 (14 chu kỳ)",
    shopName: "Kyoto Archival Optics",
    ownerName: "Vũ Thanh Tùng",
    ownerKycVerified: true,
    submittedAtDisplay: "Hôm nay, 08:30",
    submittedAtSub: "Múi giờ ICT",
    status: "PENDING",
    isAvailable: true,
    serialNumber: "SN-LC-M6-218402",
    imageUrl:
      "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=600&q=80",
    publicUrl: "/thrift/products/9021",
  },
  {
    id: "9022",
    sku: "#HB-THF-9022",
    title: "Hasselblad 503CW + Planar 80mm f/2.8",
    category: "Máy ảnh & Quang học",
    conditionGrade: "Mint 9.7/10",
    conditionNote: "Full Box & Giấy chứng sinh gốc",
    price: 112000000,
    priceNote: "Đã bao gồm VAT & Phí thẩm định",
    originType: "SHOP_INVENTORY",
    originNote: "Ký gửi trực tiếp từ kho xưởng",
    shopName: "Saigon Cinema Vault",
    ownerName: "Hồ Trọng Đạt",
    ownerKycVerified: true,
    submittedAtDisplay: "Hôm nay, 10:15",
    submittedAtSub: "Múi giờ ICT",
    status: "PENDING",
    isAvailable: true,
    serialNumber: "SN-HB-503CW-99120",
    imageUrl:
      "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?auto=format&fit=crop&w=600&q=80",
    publicUrl: "/thrift/products/9022",
  },
  {
    id: "8840",
    sku: "#HB-THF-8840",
    title: "Contax T2 Titanium Black",
    category: "Máy ảnh & Quang học",
    conditionGrade: "Excellent 8.8/10",
    conditionNote: "Clean optics, không giật màng trập",
    price: 32500000,
    priceNote: "Đã bao gồm VAT & Phí thẩm định",
    originType: "SECOND_LIFE",
    originNote: "Từ kho thuê #RNT-3108 (9 chu kỳ)",
    shopName: "Da Nang Camera Hub",
    ownerName: "Lê Minh Châu",
    ownerKycVerified: true,
    submittedAtDisplay: "Hôm qua",
    submittedAtSub: "15:40 ICT",
    status: "APPROVED",
    isAvailable: true,
    serialNumber: "SN-CTX-T2-08819",
    imageUrl:
      "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=600&q=80",
    publicUrl: "/thrift/products/8840",
  },
  {
    id: "8701",
    sku: "#HB-THF-8701",
    title: "Omega Speedmaster Professional Moonwatch",
    category: "Đồng hồ & Horology",
    conditionGrade: "Pristine 9.5/10",
    conditionNote: "Chưa qua đánh bóng, sai số +2s/ngày",
    price: 145000000,
    priceNote: "Giao dịch đã quyết toán",
    originType: "SHOP_INVENTORY",
    originNote: "Ủy thác bảo chứng tư nhân",
    shopName: "Atelier Silvergrain",
    ownerName: "Trần Khang Ninh",
    ownerKycVerified: true,
    submittedAtDisplay: "22 Th02, 2025",
    submittedAtSub: "Đã chuyển giao",
    status: "SOLD",
    isAvailable: false,
    serialNumber: "SN-OMG-3113042",
    imageUrl:
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80",
    publicUrl: "/thrift/products/8701",
  },
  {
    id: "8650",
    sku: "#HB-THF-8650",
    title: "Bang & Olufsen Beosound 9000",
    category: "Âm thanh Hi-Fi",
    conditionGrade: "Good Vintage 8.2/10",
    conditionNote: "Cơ trượt ổn định, thấu kính CD 4 cần kiểm định",
    price: 48000000,
    priceNote: "Tạm ngưng thanh toán",
    originType: "SECOND_LIFE",
    originNote: "Hoàn tất kiểm toán vận hành RENT",
    shopName: "Heritage Audio Works",
    ownerName: "Nguyễn Đăng Khoa",
    ownerKycVerified: true,
    submittedAtDisplay: "20 Th02, 2025",
    submittedAtSub: "Đã phản hồi Shop",
    status: "REJECTED",
    isAvailable: false,
    rejectionReason: "Thiếu video kiểm tra mắt laser và cơ chế trượt CD #4",
    serialNumber: "SN-BO-9000-48210",
    imageUrl:
      "https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=600&q=80",
    publicUrl: "/thrift/products/8650",
  },
  {
    id: "8590",
    sku: "#HB-THF-8590",
    title: "Fujifilm X100V Silver Edition",
    category: "Máy ảnh & Quang học",
    conditionGrade: "Mint 9.9/10",
    conditionNote: "Shutter count < 800, dán skin từ ngày 1",
    price: 38000000,
    priceNote: "Đã bao gồm VAT & Phí thẩm định",
    originType: "SHOP_INVENTORY",
    originNote: "Ký gửi showroom Hà Nội",
    shopName: "Hanoi Classic Shutter",
    ownerName: "Phạm Việt Anh",
    ownerKycVerified: true,
    submittedAtDisplay: "18 Th02, 2025",
    submittedAtSub: "Đã hoàn tất kiểm định",
    status: "APPROVED",
    isAvailable: true,
    serialNumber: "SN-FJ-X100V-7712",
    imageUrl:
      "https://images.unsplash.com/photo-1512790182412-b19e6d62bc39?auto=format&fit=crop&w=600&q=80",
    publicUrl: "/thrift/products/8590",
  },
  {
    id: "8510",
    sku: "#HB-THF-8510",
    title: "Rolex Submariner Date 16610 Tritium Dial",
    category: "Đồng hồ & Horology",
    conditionGrade: "Pristine 9.4/10",
    conditionNote: "Lug vát nguyên bản, cọc số ngả vàng tự nhiên",
    price: 215000000,
    priceNote: "Ủy thác ký quỹ bảo chứng",
    originType: "SHOP_INVENTORY",
    originNote: "Bộ sưu tập tư nhân Thụy Sĩ",
    shopName: "Atelier Silvergrain",
    ownerName: "Trần Khang Ninh",
    ownerKycVerified: true,
    submittedAtDisplay: "15 Th02, 2025",
    submittedAtSub: "Múi giờ ICT",
    status: "PENDING",
    isAvailable: true,
    serialNumber: "SN-RLX-16610-E4912",
    imageUrl:
      "https://images.unsplash.com/photo-1547996160-71dfa4708ddf?auto=format&fit=crop&w=600&q=80",
    publicUrl: "/thrift/products/8510",
  },
  {
    id: "8480",
    sku: "#HB-THF-8480",
    title: "Eames Lounge Chair & Ottoman (Rosewood)",
    category: "Nội thất thiết kế",
    conditionGrade: "Excellent 8.9/10",
    conditionNote: "Da bọc tự nhiên nguyên bản Herman Miller",
    price: 95000000,
    priceNote: "Đã bao gồm VAT & Phí thẩm định",
    originType: "SECOND_LIFE",
    originNote: "Từ không gian triển lãm RENT Gallery",
    shopName: "Bauhaus Living Lab",
    ownerName: "Lê Quang Huy",
    ownerKycVerified: true,
    submittedAtDisplay: "12 Th02, 2025",
    submittedAtSub: "Múi giờ ICT",
    status: "APPROVED",
    isAvailable: true,
    serialNumber: "SN-HM-EAMES-2018",
    imageUrl:
      "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&w=600&q=80",
    publicUrl: "/thrift/products/8480",
  },
];

export const ThriftListingApproval: React.FC = () => {
  const [listings, setListings] = useState<ThriftListing[]>(INITIAL_THRIFT_LISTINGS);
  const [activeTab, setActiveTab] = useState<ThriftStatusFilter>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedOrigin, setSelectedOrigin] = useState("");
  const [selectedCondition, setSelectedCondition] = useState("");

  // Modals & Active item inspection
  const [inspectingItem, setInspectingItem] = useState<ThriftListing | null>(null);
  const [showStandardsModal, setShowStandardsModal] = useState(false);
  const [rejectionInput, setRejectionInput] = useState("");
  const [isRejecting, setIsRejecting] = useState(false);

  // Appraisal checklist state
  const [checklist, setChecklist] = useState({
    mechanical: true,
    optical: true,
    serial: true,
    provenance: true,
    maintenance: true,
    invoice: true,
    bCorp: true,
  });

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync API counts if needed
  useEffect(() => {
    let isMounted = true;
    fetchAdminDashboardData()
      .then((data) => {
        if (isMounted && data) {
          // Can sync metrics if needed
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // KPI Calculations
  const metrics = useMemo(() => {
    const total = 415; // Or listings.length base
    const pending = listings.filter((l) => l.status === "PENDING").length;
    const approved = listings.filter((l) => l.status === "APPROVED").length;
    const rejected = listings.filter((l) => l.status === "REJECTED").length;
    const sold = listings.filter((l) => l.status === "SOLD").length;
    const secondLife = listings.filter((l) => l.originType === "SECOND_LIFE").length;
    const available = listings.filter((l) => l.isAvailable && l.status === "APPROVED").length;

    return {
      total,
      pending: pending > 0 ? pending : 24,
      approved: approved > 0 ? approved : 342,
      rejected: rejected > 0 ? rejected : 12,
      sold: sold > 0 ? sold : 53,
      secondLife: secondLife > 0 ? secondLife : 18,
      available: available > 0 ? available : 289,
    };
  }, [listings]);

  // Filter logic
  const filteredListings = useMemo(() => {
    return listings.filter((item) => {
      // Tab filter
      if (activeTab === "PENDING" && item.status !== "PENDING") return false;
      if (activeTab === "APPROVED" && item.status !== "APPROVED") return false;
      if (activeTab === "REJECTED" && item.status !== "REJECTED") return false;
      if (activeTab === "SOLD" && item.status !== "SOLD") return false;
      if (activeTab === "AVAILABLE" && (!item.isAvailable || item.status !== "APPROVED")) {
        return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchTitle = item.title.toLowerCase().includes(query);
        const matchSku = item.sku.toLowerCase().includes(query);
        const matchCategory = item.category.toLowerCase().includes(query);
        const matchShop = item.shopName.toLowerCase().includes(query);
        const matchOwner = item.ownerName.toLowerCase().includes(query);
        if (!matchTitle && !matchSku && !matchCategory && !matchShop && !matchOwner) {
          return false;
        }
      }

      // Category filter
      if (selectedCategory) {
        if (selectedCategory === "optics" && !item.category.includes("Quang học")) return false;
        if (selectedCategory === "horology" && !item.category.includes("Horology") && !item.category.includes("Đồng hồ")) return false;
        if (selectedCategory === "audio" && !item.category.includes("Âm thanh")) return false;
        if (selectedCategory === "furniture" && !item.category.includes("Nội thất")) return false;
        if (selectedCategory === "fashion" && !item.category.includes("Thời trang")) return false;
      }

      // Origin filter
      if (selectedOrigin) {
        if (selectedOrigin === "shop" && item.originType !== "SHOP_INVENTORY") return false;
        if (selectedOrigin === "returned" && item.originType !== "SECOND_LIFE") return false;
      }

      // Condition filter
      if (selectedCondition) {
        if (selectedCondition === "pristine" && !item.conditionGrade.toLowerCase().includes("pristine")) return false;
        if (selectedCondition === "mint" && !item.conditionGrade.toLowerCase().includes("mint")) return false;
        if (selectedCondition === "excellent" && !item.conditionGrade.toLowerCase().includes("excellent")) return false;
        if (selectedCondition === "vintage" && !item.conditionGrade.toLowerCase().includes("vintage")) return false;
      }

      return true;
    });
  }, [listings, activeTab, searchQuery, selectedCategory, selectedOrigin, selectedCondition]);

  // Handlers for approval / rejection
  const handleOpenReview = (item: ThriftListing) => {
    setInspectingItem(item);
    setIsRejecting(false);
    setRejectionInput(item.rejectionReason || "");
    setChecklist({
      mechanical: true,
      optical: true,
      serial: true,
      provenance: true,
      maintenance: true,
      invoice: true,
      bCorp: true,
    });
  };

  const handleApproveListing = (id: string) => {
    setListings((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              status: "APPROVED",
              isAvailable: true,
              rejectionReason: undefined,
            }
          : item
      )
    );
    showToast(`Đã phê duyệt niêm yết bán đứt THRIFT thành công! Hiện vật đã sẵn sàng hiển thị.`);
    setInspectingItem(null);
  };

  const handleRejectListing = (id: string) => {
    if (!rejectionInput.trim()) {
      alert("Vui lòng nhập lý do từ chối để thông báo cho Chủ Xưởng hiệu chỉnh.");
      return;
    }
    setListings((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              status: "REJECTED",
              isAvailable: false,
              rejectionReason: rejectionInput.trim(),
            }
          : item
      )
    );
    showToast(`Đã từ chối niêm yết THRIFT #${id} và gửi văn bản yêu cầu bổ sung.`);
    setInspectingItem(null);
    setIsRejecting(false);
  };

  const handleResetFilters = () => {
    setActiveTab("ALL");
    setSearchQuery("");
    setSelectedCategory("");
    setSelectedOrigin("");
    setSelectedCondition("");
    showToast("Đã đặt lại toàn bộ bộ lọc về mặc định.");
  };

  // CSV Export
  const handleExportCSV = () => {
    const headers = [
      "ID",
      "Mã SKU",
      "Tên hiện vật",
      "Danh mục",
      "Tình trạng",
      "Giá bán đứt (VND)",
      "Nguồn gốc",
      "Chủ xưởng",
      "Trạng thái",
      "Ngày gửi",
    ];

    const rows = filteredListings.map((l) => [
      l.id,
      l.sku,
      `"${l.title.replace(/"/g, '""')}"`,
      `"${l.category}"`,
      `"${l.conditionGrade} - ${l.conditionNote}"`,
      l.price,
      l.originType === "SECOND_LIFE" ? "Second Life (Từ RENT fleet)" : "Shop Inventory",
      `"${l.shopName} (${l.ownerName})"`,
      l.status,
      `"${l.submittedAtDisplay}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Bao_Cao_Kiem_Duyet_THRIFT_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Đã tải xuống file sổ kiểm toán CSV danh sách THRIFT.");
  };

  return (
    <div className="flex flex-col w-full bg-[#fdf9f2] text-[#1c1c18] font-sans min-h-screen">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 bg-[#141310] text-[#fdf9f2] rounded-xl shadow-2xl border border-[#ccc5bc]/30 animate-bounce">
          <span className="material-symbols-outlined text-[20px] text-[#bfcab6]">
            verified
          </span>
          <span className="text-xs font-medium">{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="ml-2 text-white/60 hover:text-white"
          >
            ×
          </button>
        </div>
      )}

      {/* 1. ADMINISTRATIVE SECONDARY SUB-BAR */}
      <div className="w-full bg-[#ebe8e1] text-[#4a463f] text-[11px] font-semibold tracking-wider uppercase border-b border-[#ccc5bc]/40">
        <div className="max-w-[1440px] mx-auto px-4 md:px-12 py-2 flex flex-wrap items-center justify-between gap-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 text-[#576151] font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#576151] animate-pulse"></span>
              BỘ PHẬN KIỂM SOÁT ĐỊNH DANH &amp; BẢO MẬT (KYC VAULT)
            </span>
            <span className="text-[#ccc5bc]">/</span>
            <span>HỆ THỐNG BẢO MẬT V4.2</span>
            <span className="text-[#ccc5bc]">/</span>
            <span className="hidden sm:inline">GIAO THỨC FIDO2 CẤP CAO</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1 text-[#141310] font-medium">
              <span className="material-symbols-outlined text-[14px] text-[#576151]">
                history_edu
              </span>
              SỔ CÁI KIỂM DUYỆT THRIFT TỰ ĐỘNG · KHO LƯU TRỮ TRỰC TUYẾN
            </span>
          </div>
        </div>
      </div>

      {/* ADMINISTRATIVE MODULES NAVIGATION BAR */}
      <div className="w-full bg-[#f7f3ec] shadow-[0_1px_4px_rgba(20,19,16,0.03)] border-b border-[#ccc5bc]/30">
        <div className="max-w-[1440px] mx-auto px-4 md:px-12">
          <nav aria-label="Phân hệ Quản trị" className="flex items-center gap-1 overflow-x-auto py-2.5 scrollbar-none">
            <Link
              to="/admin/dashboard"
              className="px-3.5 py-1.5 rounded text-xs font-medium text-[#4a463f] hover:text-[#1c1c18] hover:bg-[#f1ede6] transition-all whitespace-nowrap"
            >
              Bảng Điều Khiển
            </Link>
            <Link
              to="/admin/users"
              className="px-3.5 py-1.5 rounded text-xs font-medium text-[#4a463f] hover:text-[#1c1c18] hover:bg-[#f1ede6] transition-all whitespace-nowrap"
            >
              Người Dùng
            </Link>
            <Link
              to="/admin/kyc"
              className="px-3.5 py-1.5 rounded text-xs font-medium text-[#4a463f] hover:text-[#1c1c18] hover:bg-[#f1ede6] transition-all whitespace-nowrap"
            >
              Duyệt KYC
            </Link>
            <Link
              to="/admin/rent/listings"
              className="px-3.5 py-1.5 rounded text-xs font-medium text-[#4a463f] hover:text-[#1c1c18] hover:bg-[#f1ede6] transition-all whitespace-nowrap"
            >
              Duyệt RENT
            </Link>
            <Link
              to="/admin/thrift/listings"
              className="px-3.5 py-1.5 rounded text-xs bg-[#141310] text-[#fdf9f2] font-semibold shadow-sm whitespace-nowrap flex items-center gap-1.5"
            >
              <span>Duyệt THRIFT</span>
              <span className="px-1.5 py-0.2 bg-[#292724] text-[#d3c4b0] text-[10px] rounded-full font-mono font-bold">
                {metrics.pending}
              </span>
            </Link>
            <Link
              to="/admin/categories"
              className="px-3.5 py-1.5 rounded text-xs font-medium text-[#4a463f] hover:text-[#1c1c18] hover:bg-[#f1ede6] transition-all whitespace-nowrap"
            >
              Danh Mục Sàn
            </Link>
            <Link
              to="/admin/disputes"
              className="px-3.5 py-1.5 rounded text-xs font-medium text-[#4a463f] hover:text-[#1c1c18] hover:bg-[#f1ede6] transition-all whitespace-nowrap"
            >
              Tranh Chấp
            </Link>
            <Link
              to="/admin/finance"
              className="px-3.5 py-1.5 rounded text-xs font-medium text-[#4a463f] hover:text-[#1c1c18] hover:bg-[#f1ede6] transition-all whitespace-nowrap"
            >
              Tài Chính Sàn
            </Link>
          </nav>
        </div>
      </div>

      {/* MAIN EDITORIAL CONTENT */}
      <div className="max-w-[1440px] mx-auto px-4 md:px-12 py-8 flex flex-col gap-8 w-full">
        {/* 2. EDITORIAL HERO & KPI METRICS */}
        <div className="flex flex-col gap-6">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="flex flex-col gap-2 max-w-3xl">
              <div className="flex items-center gap-2 text-[#576151] text-[11px] tracking-widest uppercase font-bold">
                <span className="w-2 h-2 rounded-full bg-[#576151]"></span>
                <span>PHÂN HỆ GIÁM ĐỊNH HIỆN VẬT BÁN ĐỨT · SECONDARY MARKETPLACE</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-serif text-[#141310] tracking-tight font-medium">
                THRIFT Listings
                <span className="text-base font-sans text-[#7b766f] font-normal ml-3">
                  (Kiểm Duyệt Sản Phẩm Bán Đứt)
                </span>
              </h1>
              <p className="text-sm sm:text-base text-[#4a463f] leading-relaxed">
                Kiểm duyệt sản phẩm thanh lý trước khi hiển thị trên marketplace. Xác thực nguồn gốc hiện vật, chứng thư giám định độc bản và quy chuẩn tuần hoàn B-Corp Circularity.
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={handleExportCSV}
                className="px-4 py-2.5 rounded-lg bg-[#f1ede6] hover:bg-[#ebe8e1] text-[#1c1c18] text-xs font-semibold flex items-center gap-2 transition-colors border border-[#ccc5bc]/30 shadow-sm"
              >
                <span className="material-symbols-outlined text-[18px]">download</span>
                <span>Xuất Sổ Kiểm Toán CSV</span>
              </button>
              <button
                type="button"
                onClick={() => setShowStandardsModal(true)}
                className="px-4 py-2.5 rounded-lg bg-[#ebe8e1] hover:bg-[#e6e2db] text-[#141310] text-xs font-semibold flex items-center gap-2 transition-colors border border-[#ccc5bc]/40"
              >
                <span className="material-symbols-outlined text-[18px] text-[#576151]">gavel</span>
                <span>Quy Chuẩn Thẩm Định Bán Đứt</span>
              </button>
            </div>
          </div>

          {/* KPI METRIC CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
            {/* Total */}
            <div className="bg-[#f7f3ec] rounded-xl p-4 flex flex-col justify-between shadow-sm border border-[#ccc5bc]/20">
              <span className="text-[11px] uppercase tracking-wider text-[#7b766f] font-semibold">
                Tổng Mục Đăng THRIFT
              </span>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="font-serif text-3xl font-medium text-[#141310]">
                  {metrics.total}
                </span>
                <span className="text-[11px] text-[#7b766f]">mục đăng</span>
              </div>
              <div className="mt-2 text-[11px] text-[#4a463f] flex items-center gap-1">
                <span className="text-[#576151] font-semibold">Toàn hệ thống</span>
              </div>
            </div>

            {/* Pending Review */}
            <div className="bg-[#f0e0cb]/40 rounded-xl p-4 flex flex-col justify-between shadow-sm border border-[#f0e0cb] relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-wider text-[#181106] font-bold">
                  Chờ Duyệt (Pending)
                </span>
                <span className="w-2 h-2 rounded-full bg-[#181106] animate-ping"></span>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="font-serif text-3xl font-semibold text-[#181106]">
                  {metrics.pending}
                </span>
                <span className="text-[11px] text-[#181106] font-medium">hồ sơ</span>
              </div>
              <div className="mt-2 inline-flex items-center px-2 py-0.5 rounded bg-[#2e2618]/10 text-[#181106] text-[10px] font-bold tracking-wide">
                CẦN XỬ LÝ TRONG 24H
              </div>
            </div>

            {/* Approved */}
            <div className="bg-[#f7f3ec] rounded-xl p-4 flex flex-col justify-between shadow-sm border border-[#ccc5bc]/20">
              <span className="text-[11px] uppercase tracking-wider text-[#7b766f] font-semibold">
                Đã Phê Duyệt
              </span>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="font-serif text-3xl font-medium text-[#576151]">
                  {metrics.approved}
                </span>
                <span className="text-[11px] text-[#7b766f]">đang lưu hành</span>
              </div>
              <div className="mt-2 text-[11px] text-[#576151] flex items-center gap-1 font-medium">
                <span className="material-symbols-outlined text-[13px]">verified</span>
                <span>Đạt chuẩn lưu kho</span>
              </div>
            </div>

            {/* Rejected */}
            <div className="bg-[#f7f3ec] rounded-xl p-4 flex flex-col justify-between shadow-sm border border-[#ccc5bc]/20">
              <span className="text-[11px] uppercase tracking-wider text-[#7b766f] font-semibold">
                Từ Chối / Bổ Sung
              </span>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="font-serif text-3xl font-medium text-[#ba1a1a]">
                  {metrics.rejected}
                </span>
                <span className="text-[11px] text-[#7b766f]">hồ sơ</span>
              </div>
              <div className="mt-2 text-[11px] text-[#ba1a1a]/90 flex items-center gap-1">
                <span className="material-symbols-outlined text-[13px]">error_outline</span>
                <span>Chưa đạt chứng thư</span>
              </div>
            </div>

            {/* Sold */}
            <div className="bg-[#f7f3ec] rounded-xl p-4 flex flex-col justify-between shadow-sm border border-[#ccc5bc]/20">
              <span className="text-[11px] uppercase tracking-wider text-[#7b766f] font-semibold">
                Mục Đăng Đã Bán
              </span>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="font-serif text-3xl font-medium text-[#141310]">
                  {metrics.sold}
                </span>
                <span className="text-[11px] text-[#7b766f]">hoàn tất</span>
              </div>
              <div className="mt-2 text-[11px] text-[#4a463f] flex items-center gap-1">
                <span className="material-symbols-outlined text-[13px]">receipt_long</span>
                <span>Đã giao quyền sở hữu</span>
              </div>
            </div>

            {/* Converted Second Life */}
            <div className="bg-[#d8e3ce]/30 rounded-xl p-4 flex flex-col justify-between shadow-sm border border-[#d8e3ce]">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-wider text-[#576151] font-bold">
                  Chuyển Đổi Tuần Hoàn
                </span>
                <span className="material-symbols-outlined text-[#576151] text-[16px]">sync</span>
              </div>
              <div className="mt-3 flex items-baseline justify-between">
                <span className="font-serif text-3xl font-medium text-[#576151]">
                  {metrics.secondLife}
                </span>
                <span className="text-[11px] text-[#576151] font-semibold">hiện vật</span>
              </div>
              <div className="mt-2 text-[11px] text-[#576151] font-medium">
                RENT → THRIFT (Second Life)
              </div>
            </div>
          </div>
        </div>

        {/* 4. GOVERNANCE PROTOCOL CALLOUT (CRITICAL BANNER) */}
        <div className="bg-[#ebe8e1] rounded-xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm border border-[#ccc5bc]/40">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-[#141310] text-[#fdf9f2] flex items-center justify-center shrink-0 mt-0.5">
              <span className="material-symbols-outlined text-[22px]">policy</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-[#141310] tracking-widest uppercase font-bold">
                NGUYÊN TẮC QUẢN TRỊ KIỂM DUYỆT THRIFT (GOVERNANCE PROTOCOL)
              </span>
              <p className="text-xs sm:text-sm text-[#4a463f] max-w-4xl leading-normal">
                Quản trị viên <strong>tuyệt đối không tự ý khởi tạo mục đăng THRIFT</strong> trên sàn. Toàn bộ hồ sơ niêm yết bán đứt phải được khởi tạo độc quyền bởi Chủ Xưởng (Shop Owner) hoặc chuyển giao tự động từ đội xe cho thuê (Fleet / Returned Rental). Thẩm quyền của Admin bao gồm: Thẩm định hồ sơ, kiểm tra số serial/chứng thư cơ khí và Phê Duyệt hoặc Từ Chối.
              </p>
            </div>
          </div>
          <div className="shrink-0 self-end md:self-center">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#f1ede6] text-[#1c1c18] text-[11px] font-bold tracking-wider uppercase border border-[#ccc5bc]/50">
              <span className="material-symbols-outlined text-[16px] text-[#576151]">lock</span>
              Chế độ kiểm duyệt độc lập
            </span>
          </div>
        </div>

        {/* 3. FILTERS & SEARCH CONTROL BAR */}
        <div className="flex flex-col gap-4">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <button
              type="button"
              onClick={() => setActiveTab("ALL")}
              className={`px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                activeTab === "ALL"
                  ? "bg-[#141310] text-[#fdf9f2] shadow-sm"
                  : "bg-[#f1ede6] text-[#4a463f] hover:bg-[#ebe8e1]"
              }`}
            >
              Tất Cả <span className="ml-1 opacity-75">({metrics.total})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("PENDING")}
              className={`px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                activeTab === "PENDING"
                  ? "bg-[#141310] text-[#fdf9f2] shadow-sm"
                  : "bg-[#f1ede6] text-[#4a463f] hover:bg-[#ebe8e1]"
              }`}
            >
              <span>Chờ Duyệt (Pending Review)</span>
              <span className="px-1.5 py-0.2 bg-[#292724] text-[#fdf9f2] text-[10px] rounded-full font-mono">
                {metrics.pending}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("APPROVED")}
              className={`px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                activeTab === "APPROVED"
                  ? "bg-[#141310] text-[#fdf9f2] shadow-sm"
                  : "bg-[#f1ede6] text-[#4a463f] hover:bg-[#ebe8e1]"
              }`}
            >
              Đã Phê Duyệt (Approved) <span className="ml-1 opacity-75">({metrics.approved})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("REJECTED")}
              className={`px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                activeTab === "REJECTED"
                  ? "bg-[#141310] text-[#fdf9f2] shadow-sm"
                  : "bg-[#f1ede6] text-[#4a463f] hover:bg-[#ebe8e1]"
              }`}
            >
              Bị Từ Chối (Rejected) <span className="ml-1 opacity-75">({metrics.rejected})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("AVAILABLE")}
              className={`px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                activeTab === "AVAILABLE"
                  ? "bg-[#141310] text-[#fdf9f2] shadow-sm"
                  : "bg-[#f1ede6] text-[#4a463f] hover:bg-[#ebe8e1]"
              }`}
            >
              Còn Hàng (Available) <span className="ml-1 opacity-75">({metrics.available})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("SOLD")}
              className={`px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                activeTab === "SOLD"
                  ? "bg-[#141310] text-[#fdf9f2] shadow-sm"
                  : "bg-[#f1ede6] text-[#4a463f] hover:bg-[#ebe8e1]"
              }`}
            >
              Đã Bán (Sold) <span className="ml-1 opacity-75">({metrics.sold})</span>
            </button>
          </div>

          {/* Advanced Filter Inputs Grid */}
          <div className="p-4 bg-[#f7f3ec] rounded-xl grid grid-cols-1 md:grid-cols-12 gap-3 shadow-sm border border-[#ccc5bc]/30">
            {/* Search bar */}
            <div className="md:col-span-5 relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#7b766f]">
                <span className="material-symbols-outlined text-[18px]">search</span>
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm theo tên sản phẩm, danh mục, mã SKU #HB-THF-..."
                className="w-full pl-10 pr-4 py-2.5 bg-white text-[#1c1c18] rounded-lg text-xs placeholder:text-[#7b766f] focus:outline-none focus:ring-1 focus:ring-[#141310] border border-[#ccc5bc]/40 transition-colors"
              />
            </div>

            {/* Category Dropdown */}
            <div className="md:col-span-2">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2.5 bg-white text-[#1c1c18] rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#141310] border border-[#ccc5bc]/40 transition-colors cursor-pointer"
              >
                <option value="">Tất cả danh mục</option>
                <option value="optics">Máy ảnh &amp; Quang học</option>
                <option value="horology">Đồng hồ &amp; Horology</option>
                <option value="fashion">Thời trang lưu trữ</option>
                <option value="audio">Âm thanh Hi-Fi</option>
                <option value="furniture">Nội thất thiết kế</option>
              </select>
            </div>

            {/* Origin Source Type Dropdown */}
            <div className="md:col-span-2">
              <select
                value={selectedOrigin}
                onChange={(e) => setSelectedOrigin(e.target.value)}
                className="w-full px-3 py-2.5 bg-white text-[#1c1c18] rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#141310] border border-[#ccc5bc]/40 transition-colors cursor-pointer"
              >
                <option value="">Tất cả nguồn gốc</option>
                <option value="shop">Shop Inventory</option>
                <option value="returned">Returned Rental (Second Life)</option>
              </select>
            </div>

            {/* Condition Filter Dropdown */}
            <div className="md:col-span-2">
              <select
                value={selectedCondition}
                onChange={(e) => setSelectedCondition(e.target.value)}
                className="w-full px-3 py-2.5 bg-white text-[#1c1c18] rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#141310] border border-[#ccc5bc]/40 transition-colors cursor-pointer"
              >
                <option value="">Tình trạng kỹ thuật</option>
                <option value="pristine">Pristine 9.5+</option>
                <option value="mint">Mint 9.0+</option>
                <option value="excellent">Excellent 8.5+</option>
                <option value="vintage">Good Vintage 8.0+</option>
              </select>
            </div>

            {/* Reset Button */}
            <div className="md:col-span-1 flex items-center justify-end">
              <button
                type="button"
                onClick={handleResetFilters}
                className="w-full h-full py-2.5 bg-white hover:bg-[#f1ede6] rounded-lg text-[#4a463f] hover:text-[#1c1c18] flex items-center justify-center transition-colors border border-[#ccc5bc]/40 shadow-sm"
                title="Đặt lại bộ lọc"
              >
                <span className="material-symbols-outlined text-[18px]">filter_alt_off</span>
              </button>
            </div>
          </div>
        </div>

        {/* 5. LISTING VERIFICATION DATA TABLE */}
        <div className="bg-white rounded-xl shadow-sm border border-[#ccc5bc]/30 overflow-hidden flex flex-col">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#f1ede6] text-[#4a463f] text-[11px] uppercase tracking-wider font-semibold border-b border-[#ccc5bc]/30">
                  <th className="py-3.5 px-4" scope="col">SẢN PHẨM / HIỆN VẬT</th>
                  <th className="py-3.5 px-4" scope="col">TÌNH TRẠNG</th>
                  <th className="py-3.5 px-4 text-right" scope="col">GIÁ BÁN ĐỨT</th>
                  <th className="py-3.5 px-4" scope="col">NGUỒN GỐC</th>
                  <th className="py-3.5 px-4" scope="col">CHỦ XƯỞNG</th>
                  <th className="py-3.5 px-4" scope="col">NGÀY GỬI</th>
                  <th className="py-3.5 px-4 text-center" scope="col">TRẠNG THÁI</th>
                  <th className="py-3.5 px-4 text-right" scope="col">THAO TÁC</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1ede6] text-[#1c1c18] text-xs">
                {filteredListings.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-[#7b766f]">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <span className="material-symbols-outlined text-4xl text-[#ccc5bc]">
                          inventory_2
                        </span>
                        <p className="text-sm font-semibold text-[#1c1c18]">
                          Không tìm thấy mục đăng THRIFT nào
                        </p>
                        <p className="text-xs text-[#7b766f]">
                          Hãy thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm.
                        </p>
                        <button
                          type="button"
                          onClick={handleResetFilters}
                          className="mt-2 px-3 py-1.5 rounded-lg bg-[#141310] text-white text-xs font-semibold"
                        >
                          Đặt Lại Bộ Lọc
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredListings.map((item) => {
                    const isPending = item.status === "PENDING";
                    const isApproved = item.status === "APPROVED";
                    const isRejected = item.status === "REJECTED";
                    const isSold = item.status === "SOLD";

                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-[#f7f3ec]/60 transition-colors group"
                      >
                        {/* PRODUCT / ARTIFACT */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-14 h-14 rounded-lg bg-[#ebe8e1] overflow-hidden shrink-0 border border-[#ccc5bc]/30 relative">
                              <img
                                src={item.imageUrl}
                                alt={item.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            </div>
                            <div className="flex flex-col min-w-0 max-w-[260px]">
                              <Link
                                to={`/admin/thrift-review/${item.id}`}
                                className="font-serif text-sm text-[#141310] font-semibold truncate hover:underline cursor-pointer"
                                title={item.title}
                              >
                                {item.title}
                              </Link>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="font-mono text-[10px] text-[#4a463f] bg-[#f1ede6] px-1.5 py-0.2 rounded font-semibold">
                                  {item.sku}
                                </span>
                                <span className="text-[11px] text-[#7b766f] truncate">
                                  {item.category}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* CONDITION */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex flex-col gap-0.5">
                            <div className="inline-flex items-center gap-1 font-semibold text-[#141310]">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#576151]"></span>
                              <span>{item.conditionGrade}</span>
                            </div>
                            <span className="text-[11px] text-[#7b766f] truncate max-w-[180px]">
                              {item.conditionNote}
                            </span>
                          </div>
                        </td>

                        {/* PRICE */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="font-serif text-sm font-semibold text-[#141310]">
                              {item.price.toLocaleString("vi-VN")} ₫
                            </span>
                            <span className="text-[10px] text-[#7b766f]">
                              {item.priceNote || "Đã bao gồm VAT"}
                            </span>
                          </div>
                        </td>

                        {/* ORIGIN */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex flex-col gap-1 items-start">
                            {item.originType === "SECOND_LIFE" ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#d8e3ce] text-[#5b6655] text-[10px] font-bold">
                                <span className="material-symbols-outlined text-[12px]">cyclone</span>
                                Second Life Item
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#f1ede6] text-[#4a463f] text-[10px] font-semibold">
                                <span className="material-symbols-outlined text-[12px]">storefront</span>
                                SHOP_INVENTORY
                              </span>
                            )}
                            <span className="text-[10px] text-[#7b766f] truncate max-w-[170px]">
                              {item.originNote}
                            </span>
                          </div>
                        </td>

                        {/* SHOP OWNER */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="font-medium text-[#141310]">{item.shopName}</span>
                            <span className="text-[10px] text-[#576151] flex items-center gap-0.5 font-semibold">
                              <span className="material-symbols-outlined text-[12px]">verified</span>
                              {item.ownerName} · KYC Verified
                            </span>
                          </div>
                        </td>

                        {/* SUBMITTED DATE */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex flex-col text-[#4a463f]">
                            <span className="font-medium text-[#141310]">{item.submittedAtDisplay}</span>
                            <span className="text-[10px] text-[#7b766f]">{item.submittedAtSub}</span>
                          </div>
                        </td>

                        {/* STATUS */}
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          {isPending && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#f0e0cb] text-[#221a0d] text-[10px] font-bold uppercase tracking-wider">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#181106] animate-pulse"></span>
                              Chờ Duyệt (Pending)
                            </span>
                          )}
                          {isApproved && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#d8e3ce] text-[#5b6655] text-[10px] font-bold uppercase tracking-wider">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#576151]"></span>
                              Đã Phê Duyệt (Live)
                            </span>
                          )}
                          {isSold && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#ebe8e1] text-[#4a463f] text-[10px] font-bold uppercase tracking-wider">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#7b766f]"></span>
                              Đã Bán (Sold)
                            </span>
                          )}
                          {isRejected && (
                            <div className="flex flex-col items-center gap-0.5">
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#ffdad6] text-[#ba1a1a] text-[10px] font-bold uppercase tracking-wider">
                                <span className="material-symbols-outlined text-[12px]">cancel</span>
                                Bị Từ Chối
                              </span>
                              {item.rejectionReason && (
                                <span
                                  className="text-[10px] text-[#ba1a1a] truncate max-w-[140px]"
                                  title={item.rejectionReason}
                                >
                                  {item.rejectionReason}
                                </span>
                              )}
                            </div>
                          )}
                        </td>

                        {/* ACTIONS */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {isPending ? (
                              <Link
                                to={`/admin/thrift-review/${item.id}`}
                                className="px-3 py-1.5 rounded-lg bg-[#141310] text-[#fdf9f2] hover:bg-[#292724] text-xs font-semibold transition-colors shadow-sm inline-flex items-center gap-1"
                              >
                                Review
                              </Link>
                            ) : isRejected ? (
                              <Link
                                to={`/admin/thrift-review/${item.id}`}
                                className="px-3 py-1.5 rounded-lg bg-[#141310] text-[#fdf9f2] hover:bg-[#292724] text-xs font-semibold transition-colors shadow-sm inline-flex items-center gap-1"
                              >
                                Review Lại
                              </Link>
                            ) : isSold ? (
                              <Link
                                to={`/admin/thrift-review/${item.id}`}
                                className="px-3 py-1.5 rounded-lg bg-[#f1ede6] hover:bg-[#ebe8e1] text-[#1c1c18] text-xs font-semibold transition-colors inline-flex items-center gap-1"
                              >
                                Sổ Lưu Trữ
                              </Link>
                            ) : (
                              <Link
                                to={`/admin/thrift-review/${item.id}`}
                                className="px-3 py-1.5 rounded-lg bg-[#f1ede6] hover:bg-[#ebe8e1] text-[#1c1c18] text-xs font-semibold transition-colors inline-flex items-center gap-1"
                              >
                                Chi Tiết
                              </Link>
                            )}

                            <button
                              type="button"
                              onClick={() => handleOpenReview(item)}
                              className="p-1.5 rounded-lg text-[#7b766f] hover:text-[#1c1c18] hover:bg-[#ebe8e1] transition-colors"
                              title="Xem nhanh tóm tắt modal"
                            >
                              <span className="material-symbols-outlined text-[17px]">
                                info
                              </span>
                            </button>

                            {isApproved || isSold ? (
                              <Link
                                to={item.publicUrl || `/thrift/products/${item.id}`}
                                target="_blank"
                                title="Xem trang công khai trên sàn THRIFT"
                                className="p-1.5 rounded-lg bg-[#f1ede6] text-[#4a463f] hover:text-[#1c1c18] hover:bg-[#ebe8e1] transition-colors"
                              >
                                <span className="material-symbols-outlined text-[16px]">
                                  open_in_new
                                </span>
                              </Link>
                            ) : (
                              <button
                                type="button"
                                disabled
                                title="Chưa phê duyệt, không thể xem công khai"
                                className="p-1.5 rounded-lg bg-[#f1ede6] text-[#ccc5bc] cursor-not-allowed opacity-60"
                              >
                                <span className="material-symbols-outlined text-[16px]">lock</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* TABLE FOOTER & PAGINATION */}
          <div className="p-4 bg-[#f7f3ec] border-t border-[#ccc5bc]/30 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-[#7b766f]">
              Hiển thị <span className="font-semibold text-[#141310]">1</span> đến{" "}
              <span className="font-semibold text-[#141310]">
                {filteredListings.length}
              </span>{" "}
              trong số <span className="font-semibold text-[#141310]">{metrics.pending}</span> hồ sơ chờ xử lý (
              <span className="font-medium text-[#1c1c18]">Tổng {metrics.total} mục đăng</span>)
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <button
                type="button"
                disabled
                className="px-3 py-1.5 rounded-lg bg-white text-[#7b766f] opacity-50 cursor-not-allowed font-medium flex items-center gap-1 border border-[#ccc5bc]/30"
              >
                <span className="material-symbols-outlined text-[14px]">chevron_left</span>
                <span>Trước</span>
              </button>
              <button
                type="button"
                className="w-8 h-8 rounded-lg bg-[#141310] text-[#fdf9f2] font-semibold flex items-center justify-center shadow-sm"
              >
                1
              </button>
              <button
                type="button"
                className="w-8 h-8 rounded-lg bg-white hover:bg-[#f1ede6] text-[#1c1c18] font-medium flex items-center justify-center transition-colors border border-[#ccc5bc]/30"
              >
                2
              </button>
              <button
                type="button"
                className="w-8 h-8 rounded-lg bg-white hover:bg-[#f1ede6] text-[#1c1c18] font-medium flex items-center justify-center transition-colors border border-[#ccc5bc]/30"
              >
                3
              </button>
              <span className="px-1 text-[#7b766f] text-xs">...</span>
              <button
                type="button"
                className="w-8 h-8 rounded-lg bg-white hover:bg-[#f1ede6] text-[#1c1c18] font-medium flex items-center justify-center transition-colors border border-[#ccc5bc]/30"
              >
                70
              </button>
              <button
                type="button"
                className="px-3 py-1.5 rounded-lg bg-white hover:bg-[#f1ede6] text-[#1c1c18] font-medium flex items-center gap-1 transition-colors border border-[#ccc5bc]/30"
              >
                <span>Sau</span>
                <span className="material-symbols-outlined text-[14px]">chevron_right</span>
              </button>
            </div>
          </div>
        </div>

        {/* 6. EMPTY STATE DEMO COMPONENT (COLLAPSIBLE / SANDBOX VIEW) */}
        <details className="group bg-[#f7f3ec] rounded-xl p-4 shadow-sm border border-[#ccc5bc]/30">
          <summary className="list-none flex items-center justify-between cursor-pointer text-xs text-[#7b766f] uppercase tracking-wider font-semibold">
            <span className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">visibility</span>
              Khung mô phỏng trạng thái rỗng (UI Sandbox Component: Empty State Preview)
            </span>
            <span className="material-symbols-outlined text-[18px] group-open:rotate-180 transition-transform">
              expand_more
            </span>
          </summary>
          <div className="mt-4 p-8 bg-white rounded-xl flex flex-col items-center justify-center text-center max-w-xl mx-auto shadow-sm border border-[#ccc5bc]/20">
            <div className="w-16 h-16 rounded-full bg-[#ebe8e1] flex items-center justify-center text-[#141310] mb-3">
              <span className="material-symbols-outlined text-[32px]">inventory_2</span>
            </div>
            <h3 className="font-serif text-lg text-[#141310] font-semibold mb-1">
              Không tìm thấy mục đăng THRIFT nào
            </h3>
            <p className="text-xs text-[#7b766f] mb-4 max-w-md leading-relaxed">
              Hiện không có hồ sơ nào khớp với bộ lọc đã chọn hoặc toàn bộ hàng đợi thẩm định THRIFT đã được xử lý triệt để.
            </p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-4 py-2 rounded-lg bg-[#f1ede6] hover:bg-[#ebe8e1] text-[#1c1c18] text-xs font-semibold transition-colors"
              >
                Xóa Toàn Bộ Bộ Lọc
              </button>
              <button
                type="button"
                onClick={() => {
                  setListings(INITIAL_THRIFT_LISTINGS);
                  showToast("Đã làm mới dữ liệu hàng đợi THRIFT.");
                }}
                className="px-4 py-2 rounded-lg bg-[#141310] text-[#fdf9f2] text-xs font-semibold transition-colors shadow-sm"
              >
                Làm Mới Hàng Đợi (Refresh)
              </button>
            </div>
          </div>
        </details>

        {/* PROVENANCE INSPECTION METHODOLOGY NOTE */}
        <div className="p-5 bg-[#ebe8e1] rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-[#ccc5bc]/40">
          <div className="flex items-center gap-4">
            <span className="material-symbols-outlined text-[#576151] text-[32px]">
              verified_user
            </span>
            <div className="flex flex-col">
              <span className="font-serif text-sm font-semibold text-[#141310]">
                Tiêu Chuẩn Giám Định Độc Bản 7 Bước (Standardized 7-Point Appraisal)
              </span>
              <span className="text-xs text-[#4a463f]">
                Mọi hiện vật THRIFT được duyệt đều phải vượt qua bài kiểm tra cơ khí, thấu kính quang học, niên đại serial và lịch sử bảo dưỡng trước khi cấp mã bảo mật B-Corp.
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowStandardsModal(true)}
            className="text-xs text-[#141310] hover:text-[#576151] underline underline-offset-4 font-semibold whitespace-nowrap"
          >
            Xem Hiến Chương Giám Định →
          </button>
        </div>
      </div>

      {/* MODAL 1: THẨM ĐỊNH CHI TIẾT HỒ SƠ THRIFT */}
      {inspectingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#fdf9f2] rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-[#ccc5bc]/50 p-6 flex flex-col gap-5">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-3 border-b border-[#ccc5bc]/30">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#ebe8e1] text-[#141310]">
                    {inspectingItem.sku}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider bg-[#d8e3ce] text-[#5b6655]">
                    {inspectingItem.originType}
                  </span>
                </div>
                <h3 className="font-serif text-xl font-bold text-[#141310]">
                  {inspectingItem.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setInspectingItem(null)}
                className="w-8 h-8 rounded-full bg-[#ebe8e1] hover:bg-[#ccc5bc] flex items-center justify-center text-[#1c1c18] transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Product Snapshot */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-white border border-[#ccc5bc]/30">
              <div className="h-32 rounded-lg bg-[#ebe8e1] overflow-hidden">
                <img
                  src={inspectingItem.imageUrl}
                  alt={inspectingItem.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="sm:col-span-2 space-y-1.5 text-xs text-[#4a463f]">
                <div>
                  <span className="text-[#7b766f]">Chủ Xưởng Ký Gửi: </span>
                  <strong className="text-[#141310]">{inspectingItem.shopName}</strong> ({inspectingItem.ownerName})
                </div>
                <div>
                  <span className="text-[#7b766f]">Giá Niêm Yết: </span>
                  <strong className="text-[#141310] text-sm font-serif">
                    {inspectingItem.price.toLocaleString("vi-VN")} ₫
                  </strong>
                </div>
                <div>
                  <span className="text-[#7b766f]">Tình Trạng Công Bố: </span>
                  <strong className="text-[#576151]">{inspectingItem.conditionGrade}</strong> - {inspectingItem.conditionNote}
                </div>
                <div>
                  <span className="text-[#7b766f]">Số Serial: </span>
                  <span className="font-mono font-semibold text-[#141310]">
                    {inspectingItem.serialNumber || "SN-PENDING-CHECK"}
                  </span>
                </div>
                <div>
                  <span className="text-[#7b766f]">Nguồn Gốc: </span>
                  <span>{inspectingItem.originNote}</span>
                </div>
              </div>
            </div>

            {/* 7-Point Appraisal Checklist */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-[#141310] uppercase tracking-wider">
                  Checklist Giám Định Độc Bản 7 Bước (Standard 7-Point Audit)
                </h4>
                <span className="text-[10px] text-[#576151] font-semibold">
                  Chuẩn ISO-14044 &amp; B-Corp
                </span>
              </div>
              <div className="space-y-1.5 p-3 rounded-xl bg-white border border-[#ccc5bc]/30 text-xs">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checklist.mechanical}
                    onChange={(e) => setChecklist({ ...checklist, mechanical: e.target.checked })}
                    className="w-4 h-4 rounded text-[#141310] accent-[#141310]"
                  />
                  <span>1. Kiểm tra cơ khí, màng trập, vi mạch &amp; độ kín sáng vật lý.</span>
                </label>
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checklist.optical}
                    onChange={(e) => setChecklist({ ...checklist, optical: e.target.checked })}
                    className="w-4 h-4 rounded text-[#141310] accent-[#141310]"
                  />
                  <span>2. Thấu kính quang học sạch, không mốc xước, thấu quang chuẩn studio.</span>
                </label>
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checklist.serial}
                    onChange={(e) => setChecklist({ ...checklist, serial: e.target.checked })}
                    className="w-4 h-4 rounded text-[#141310] accent-[#141310]"
                  />
                  <span>3. Khớp số serial thân máy với hồ sơ dữ liệu hãng sản xuất.</span>
                </label>
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checklist.provenance}
                    onChange={(e) => setChecklist({ ...checklist, provenance: e.target.checked })}
                    className="w-4 h-4 rounded text-[#141310] accent-[#141310]"
                  />
                  <span>4. Giấy tờ nguồn gốc / Chứng thư chuyển nhượng Second Life hợp lệ.</span>
                </label>
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checklist.maintenance}
                    onChange={(e) => setChecklist({ ...checklist, maintenance: e.target.checked })}
                    className="w-4 h-4 rounded text-[#141310] accent-[#141310]"
                  />
                  <span>5. Lịch sử bảo dưỡng (CLA/Servicing) được xác nhận bởi thợ lành nghề.</span>
                </label>
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checklist.invoice}
                    onChange={(e) => setChecklist({ ...checklist, invoice: e.target.checked })}
                    className="w-4 h-4 rounded text-[#141310] accent-[#141310]"
                  />
                  <span>6. Đối soát giá niêm yết theo biên bản ký gửi công khai.</span>
                </label>
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checklist.bCorp}
                    onChange={(e) => setChecklist({ ...checklist, bCorp: e.target.checked })}
                    className="w-4 h-4 rounded text-[#141310] accent-[#141310]"
                  />
                  <span>7. Cấp tem niêm phong điện tử B-Corp Circularity trên sổ cái ReUse Hub.</span>
                </label>
              </div>
            </div>

            {/* Rejection Form Input */}
            {isRejecting && (
              <div className="p-3.5 rounded-xl bg-[#ffdad6]/40 border border-[#ba1a1a]/40 space-y-2 animate-fade-in">
                <span className="text-xs font-bold text-[#ba1a1a] block">
                  Lý do từ chối / Yêu cầu Shop bổ sung:
                </span>
                <textarea
                  rows={3}
                  value={rejectionInput}
                  onChange={(e) => setRejectionInput(e.target.value)}
                  placeholder="Ví dụ: Thiếu ảnh macro thấu kính sau, video màng trập hoặc số serial bị mờ..."
                  className="w-full p-2.5 bg-white text-xs text-[#1c1c18] rounded-lg border border-[#ba1a1a]/40 focus:outline-none focus:ring-1 focus:ring-[#ba1a1a]"
                />
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-[#ccc5bc]/30">
              <button
                type="button"
                onClick={() => setInspectingItem(null)}
                className="px-4 py-2 rounded-lg bg-[#ebe8e1] hover:bg-[#ccc5bc] text-[#1c1c18] text-xs font-semibold transition-colors"
              >
                Đóng
              </button>

              <div className="flex items-center gap-2">
                {!isRejecting ? (
                  <button
                    type="button"
                    onClick={() => setIsRejecting(true)}
                    className="px-4 py-2 rounded-lg bg-[#ffdad6] hover:bg-[#ffdad6]/80 text-[#ba1a1a] text-xs font-semibold transition-colors"
                  >
                    Từ Chối / Yêu Cầu Bổ Sung
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleRejectListing(inspectingItem.id)}
                    className="px-4 py-2 rounded-lg bg-[#ba1a1a] text-white text-xs font-semibold hover:bg-[#93000a] transition-colors"
                  >
                    Xác Nhận Từ Chối
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => handleApproveListing(inspectingItem.id)}
                  className="px-5 py-2 rounded-lg bg-[#141310] text-[#fdf9f2] text-xs font-semibold hover:bg-[#292724] transition-colors shadow-sm flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px] text-[#bfcab6]">
                    check_circle
                  </span>
                  <span>Phê Duyệt Niêm Yết</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: QUY CHUẨN THẨM ĐỊNH BÁN ĐỨT (7-POINT APPRAISAL STANDARDS) */}
      {showStandardsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#fdf9f2] rounded-2xl max-w-xl w-full shadow-2xl border border-[#ccc5bc]/50 p-6 space-y-4">
            <div className="flex items-start justify-between pb-2 border-b border-[#ccc5bc]/30">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#576151] text-2xl">
                  verified
                </span>
                <h3 className="font-serif text-lg font-bold text-[#141310]">
                  Hiến Chương Giám Định THRIFT 7 Bước
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowStandardsModal(false)}
                className="w-8 h-8 rounded-full bg-[#ebe8e1] hover:bg-[#ccc5bc] flex items-center justify-center text-sm"
              >
                ✕
              </button>
            </div>

            <div className="text-xs text-[#4a463f] space-y-3 leading-relaxed max-h-[60vh] overflow-y-auto pr-1">
              <div className="p-3 rounded-xl bg-white border border-[#ccc5bc]/30">
                <strong className="text-[#141310] block mb-1">
                  1. Thẩm Quyền Quản Trị Viên (Admin Scope):
                </strong>
                <p>
                  Admin chỉ có thẩm quyền Thẩm Định, Phê Duyệt hoặc Từ Chối. Tuyệt đối không can thiệp sửa giá hoặc tự tạo mục đăng THRIFT.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-white border border-[#ccc5bc]/30">
                <strong className="text-[#141310] block mb-1">
                  2. Chuyển Đổi Tuần Hoàn (Second Life Transition):
                </strong>
                <p>
                  Hiện vật hoàn thành chu kỳ cho thuê RENT (sau ít nhất 8 vòng thuê hoặc thẩm định kỹ thuật chuyển dịch) được cấp mã chuyển giao tự động sang THRIFT với tem Second Life.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-white border border-[#ccc5bc]/30">
                <strong className="text-[#141310] block mb-1">
                  3. Tiêu Chuẩn Phân Cấp Ngoại Quan (Condition Grading):
                </strong>
                <ul className="list-disc pl-4 space-y-1 mt-1">
                  <li><strong>Pristine 9.5+:</strong> Như mới, nguyên hộp, sai số cơ học dưới 1%.</li>
                  <li><strong>Mint 9.0+:</strong> Vết xước vi mô không đáng kể, hoạt động hoàn hảo.</li>
                  <li><strong>Excellent 8.5+:</strong> Có dấu ấn thời gian nhẹ (brassing), quang học trong trẻo.</li>
                  <li><strong>Good Vintage 8.0+:</strong> Hiện vật sưu tầm cổ điển, các tính năng cốt lõi vận hành ổn định.</li>
                </ul>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-[#ccc5bc]/30">
              <button
                type="button"
                onClick={() => setShowStandardsModal(false)}
                className="px-4 py-2 rounded-lg bg-[#141310] text-[#fdf9f2] text-xs font-semibold hover:bg-[#292724] transition-colors"
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

export default ThriftListingApproval;