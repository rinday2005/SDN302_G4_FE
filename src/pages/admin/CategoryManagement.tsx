import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";

export type MarketType = "ALL" | "RENT" | "THRIFT" | "COMMON";
export type CategoryStatus = "ACTIVE" | "INACTIVE";
export type CategorySort = "COUNT_DESC" | "NAME_ASC" | "RECENT";

export interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  market: "RENT" | "THRIFT" | "COMMON";
  icon: string;
  totalItems: number;
  rentItems: number;
  thriftItems: number;
  status: CategoryStatus;
  updatedAt?: string;
}

const INITIAL_CATEGORIES: CategoryItem[] = [
  {
    id: "cat-01",
    name: "Cameras & Optics",
    slug: "/categories/cameras-optics",
    description: "Máy ảnh Leica, Hasselblad, ống kính chuyên dụng và quang học di sản.",
    market: "COMMON",
    icon: "photo_camera",
    totalItems: 142,
    rentItems: 86,
    thriftItems: 56,
    status: "ACTIVE",
    updatedAt: "2025-02-24",
  },
  {
    id: "cat-02",
    name: "Audio & Studio Hi-Fi",
    slug: "/categories/audio-studio-hifi",
    description: "Mâm đĩa than hi-end, amplifier đèn và hệ thống kiểm âm phòng thu.",
    market: "RENT",
    icon: "speaker",
    totalItems: 94,
    rentItems: 94,
    thriftItems: 0,
    status: "ACTIVE",
    updatedAt: "2025-02-23",
  },
  {
    id: "cat-03",
    name: "Archival Eyewear",
    slug: "/categories/archival-eyewear",
    description: "Gọng kính cổ điển, kính mát sưu tầm thập niên 1960-1990 nguyên bản.",
    market: "THRIFT",
    icon: "visibility",
    totalItems: 118,
    rentItems: 0,
    thriftItems: 118,
    status: "ACTIVE",
    updatedAt: "2025-02-22",
  },
  {
    id: "cat-04",
    name: "Timepieces & Horology",
    slug: "/categories/timepieces-horology",
    description: "Đồng hồ cơ khí Thụy Sĩ, vintage chronographs và phiên bản di sản.",
    market: "COMMON",
    icon: "watch",
    totalItems: 215,
    rentItems: 120,
    thriftItems: 95,
    status: "ACTIVE",
    updatedAt: "2025-02-21",
  },
  {
    id: "cat-05",
    name: "Drone & Aerial Tech",
    slug: "/categories/drone-aerial-tech",
    description: "Thiết bị quay chụp trên không, flycam điện ảnh và gimbal chuyên nghiệp.",
    market: "RENT",
    icon: "flight_takeoff",
    totalItems: 38,
    rentItems: 38,
    thriftItems: 0,
    status: "INACTIVE",
    updatedAt: "2025-02-20",
  },
  {
    id: "cat-06",
    name: "Rare Leather & Trunks",
    slug: "/categories/rare-leather-trunks",
    description: "Rương hành lý thủ công, túi da thảo mộc patina và vali lưu trữ di sản.",
    market: "THRIFT",
    icon: "luggage",
    totalItems: 64,
    rentItems: 0,
    thriftItems: 64,
    status: "ACTIVE",
    updatedAt: "2025-02-19",
  },
  {
    id: "cat-07",
    name: "Cinema Lighting & Rigging",
    slug: "/categories/cinema-lighting-rigging",
    description: "Hệ thống đèn Arri, Aputure, chân c-stand và phụ kiện trường quay chuyên nghiệp.",
    market: "RENT",
    icon: "lightbulb",
    totalItems: 180,
    rentItems: 180,
    thriftItems: 0,
    status: "ACTIVE",
    updatedAt: "2025-02-18",
  },
  {
    id: "cat-08",
    name: "Vintage Couture & Archive",
    slug: "/categories/vintage-couture-archive",
    description: "Trang phục sàn diễn thập niên 80-90, đầm dạ hội lưu trữ và áo khoác di sản.",
    market: "THRIFT",
    icon: "checkroom",
    totalItems: 156,
    rentItems: 0,
    thriftItems: 156,
    status: "ACTIVE",
    updatedAt: "2025-02-17",
  },
  {
    id: "cat-09",
    name: "Mid-Century Furniture",
    slug: "/categories/mid-century-furniture",
    description: "Ghế bành Eames, bàn trà Noguchi, nội thất thiết kế Scandinavia nguyên bản.",
    market: "COMMON",
    icon: "chair",
    totalItems: 88,
    rentItems: 42,
    thriftItems: 46,
    status: "ACTIVE",
    updatedAt: "2025-02-16",
  },
  {
    id: "cat-10",
    name: "Modular Synthesizers & Sound",
    slug: "/categories/modular-synthesizers",
    description: "Nhạc cụ điện tử Eurorack, synthesizer analog Moog và đàn phím vintage.",
    market: "COMMON",
    icon: "piano",
    totalItems: 72,
    rentItems: 36,
    thriftItems: 36,
    status: "ACTIVE",
    updatedAt: "2025-02-15",
  },
  {
    id: "cat-11",
    name: "Fine Art & Gallery Prints",
    slug: "/categories/fine-art-prints",
    description: "Tranh in thạch bản, ấn bản nhiếp ảnh có chữ ký và tác phẩm bảo tàng.",
    market: "THRIFT",
    icon: "palette",
    totalItems: 92,
    rentItems: 0,
    thriftItems: 92,
    status: "ACTIVE",
    updatedAt: "2025-02-14",
  },
  {
    id: "cat-12",
    name: "Outdoor & Expedition Gear",
    slug: "/categories/outdoor-expedition",
    description: "Lều Snow Peak, bếp dã ngoại titan và thiết bị thám hiểm cao cấp.",
    market: "RENT",
    icon: "camping",
    totalItems: 110,
    rentItems: 110,
    thriftItems: 0,
    status: "ACTIVE",
    updatedAt: "2025-02-13",
  },
  {
    id: "cat-13",
    name: "Ceramics & Studio Pottery",
    slug: "/categories/ceramics-studio-pottery",
    description: "Gốm nung củi Bizen, bình trà Raku và đồ gốm thủ công nghệ nhân Nhật Bản.",
    market: "COMMON",
    icon: "local_cafe",
    totalItems: 65,
    rentItems: 20,
    thriftItems: 45,
    status: "ACTIVE",
    updatedAt: "2025-02-12",
  },
  {
    id: "cat-14",
    name: "Rare Books & Manuscripts",
    slug: "/categories/rare-books",
    description: "Sách bìa da thủ công, ấn bản đầu thế kỷ 20 và tài liệu lưu trữ quý hiếm.",
    market: "THRIFT",
    icon: "menu_book",
    totalItems: 135,
    rentItems: 0,
    thriftItems: 135,
    status: "ACTIVE",
    updatedAt: "2025-02-11",
  },
  {
    id: "cat-15",
    name: "Professional Video Camcorders",
    slug: "/categories/pro-video-camcorders",
    description: "Máy quay Sony FX, Blackmagic Cinema và hệ thống quay phim truyền hình.",
    market: "RENT",
    icon: "videocam",
    totalItems: 145,
    rentItems: 145,
    thriftItems: 0,
    status: "ACTIVE",
    updatedAt: "2025-02-10",
  },
  {
    id: "cat-16",
    name: "Mechanical Keyboards & Typewriters",
    slug: "/categories/keyboards-typewriters",
    description: "Máy đánh chữ cơ cổ điển Hermes 3000, bàn phím cơ custom thủ công.",
    market: "COMMON",
    icon: "keyboard",
    totalItems: 58,
    rentItems: 18,
    thriftItems: 40,
    status: "ACTIVE",
    updatedAt: "2025-02-09",
  },
  {
    id: "cat-17",
    name: "Heritage Bicycles & Vehicles",
    slug: "/categories/heritage-bicycles",
    description: "Xe đạp khung thép Ý Columbus, phụ tùng Campagnolo cổ điển nguyên bản.",
    market: "COMMON",
    icon: "pedal_bike",
    totalItems: 44,
    rentItems: 22,
    thriftItems: 22,
    status: "ACTIVE",
    updatedAt: "2025-02-08",
  },
  {
    id: "cat-18",
    name: "Vintage Writing Instruments",
    slug: "/categories/writing-instruments",
    description: "Bút máy Montblanc Meisterstück, ngòi vàng 18K và bình mực lưu trữ.",
    market: "THRIFT",
    icon: "edit",
    totalItems: 77,
    rentItems: 0,
    thriftItems: 77,
    status: "ACTIVE",
    updatedAt: "2025-02-07",
  },
  {
    id: "cat-19",
    name: "Audio Field Recorders & Microphones",
    slug: "/categories/field-recorders",
    description: "Micro thu âm Sennheiser, Sound Devices recorder và micro màng rung lớn.",
    market: "RENT",
    icon: "mic",
    totalItems: 88,
    rentItems: 88,
    thriftItems: 0,
    status: "ACTIVE",
    updatedAt: "2025-02-06",
  },
  {
    id: "cat-20",
    name: "Architectural Models & Objects",
    slug: "/categories/architectural-models",
    description: "Mô hình kiến trúc Bauhaus, điêu khắc kim loại nguyên khối tối giản.",
    market: "COMMON",
    icon: "apartment",
    totalItems: 51,
    rentItems: 25,
    thriftItems: 26,
    status: "ACTIVE",
    updatedAt: "2025-02-05",
  },
  {
    id: "cat-21",
    name: "Specialty Projectors & Displays",
    slug: "/categories/projectors-displays",
    description: "Máy chiếu phim 16mm/35mm Bell & Howell, màn chiếu di động triển lãm.",
    market: "RENT",
    icon: "slideshow",
    totalItems: 62,
    rentItems: 62,
    thriftItems: 0,
    status: "ACTIVE",
    updatedAt: "2025-02-04",
  },
  {
    id: "cat-22",
    name: "Vintage Jewelry & Silverware",
    slug: "/categories/vintage-jewelry",
    description: "Trang sức bạc chạm khắc thủ công, đồ dùng bàn tiệc quý tộc đầu thế kỷ 20.",
    market: "COMMON",
    icon: "diamond",
    totalItems: 83,
    rentItems: 30,
    thriftItems: 53,
    status: "ACTIVE",
    updatedAt: "2025-02-03",
  },
  {
    id: "cat-23",
    name: "Analog Games & Chess Sets",
    slug: "/categories/analog-games-chess",
    description: "Bàn cờ vua gỗ cẩm lai Staunton, bộ cờ vây đá tự nhiên truyền thống.",
    market: "COMMON",
    icon: "sports_esports",
    totalItems: 39,
    rentItems: 15,
    thriftItems: 24,
    status: "ACTIVE",
    updatedAt: "2025-02-02",
  },
  {
    id: "cat-24",
    name: "Artisanal Tableware & Glass",
    slug: "/categories/artisanal-tableware",
    description: "Ly pha lê thổi tay Murano, dao dĩa đúc đồng thủ công Châu Âu cổ.",
    market: "COMMON",
    icon: "wine_bar",
    totalItems: 71,
    rentItems: 28,
    thriftItems: 43,
    status: "ACTIVE",
    updatedAt: "2025-02-01",
  },
];

export const CategoryManagement: React.FC = () => {
  const [categories, setCategories] = useState<CategoryItem[]>(INITIAL_CATEGORIES);
  const [activeTab, setActiveTab] = useState<MarketType>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | CategoryStatus>("ALL");
  const [sortFilter, setSortFilter] = useState<CategorySort>("COUNT_DESC");

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);

  // Form Fields
  const [formName, setFormName] = useState("");
  const [formSlug, setFormSlug] = useState("");
  const [formMarket, setFormMarket] = useState<"RENT" | "THRIFT" | "COMMON">("COMMON");
  const [formDesc, setFormDesc] = useState("");
  const [formIcon, setFormIcon] = useState("folder");
  const [formStatus, setFormStatus] = useState<CategoryStatus>("ACTIVE");

  // Confirm Status Modal
  const [confirmModalItem, setConfirmModalItem] = useState<CategoryItem | null>(null);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // KPI Calculations
  const metrics = useMemo(() => {
    const total = categories.length;
    const rentExclusive = categories.filter((c) => c.market === "RENT").length;
    const thriftExclusive = categories.filter((c) => c.market === "THRIFT").length;
    const common = categories.filter((c) => c.market === "COMMON").length;

    const totalRentItems = categories.reduce((sum, c) => sum + c.rentItems, 0);
    const totalThriftItems = categories.reduce((sum, c) => sum + c.thriftItems, 0);

    return {
      total,
      rentExclusive,
      thriftExclusive,
      common,
      totalRentItems,
      totalThriftItems,
      commonRatio: total > 0 ? ((common / total) * 100).toFixed(1) : "0.0",
    };
  }, [categories]);

  // Tab counts
  const tabCounts = useMemo(() => {
    return {
      ALL: categories.length,
      RENT: categories.filter((c) => c.market === "RENT").length,
      THRIFT: categories.filter((c) => c.market === "THRIFT").length,
      COMMON: categories.filter((c) => c.market === "COMMON").length,
    };
  }, [categories]);

  // Slug generator helper
  const handleNameChange = (val: string) => {
    setFormName(val);
    if (!editingCategory) {
      const generated = val
        .toLowerCase()
        .trim()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_-]+/g, "-")
        .replace(/^-+|-+$/g, "");
      setFormSlug(generated || "your-category");
    }
  };

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingCategory(null);
    setFormName("");
    setFormSlug("your-category");
    setFormMarket("COMMON");
    setFormDesc("");
    setFormIcon("folder");
    setFormStatus("ACTIVE");
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (cat: CategoryItem) => {
    setEditingCategory(cat);
    setFormName(cat.name);
    setFormSlug(cat.slug.replace("/categories/", ""));
    setFormMarket(cat.market);
    setFormDesc(cat.description);
    setFormIcon(cat.icon);
    setFormStatus(cat.status);
    setIsModalOpen(true);
  };

  // Submit Modal (Add / Edit)
  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formSlug.trim()) {
      alert("Vui lòng nhập tên danh mục và slug hợp lệ.");
      return;
    }

    const cleanSlug = formSlug.startsWith("/categories/")
      ? formSlug
      : `/categories/${formSlug.replace(/^\/+/, "")}`;

    if (editingCategory) {
      setCategories((prev) =>
        prev.map((item) =>
          item.id === editingCategory.id
            ? {
                ...item,
                name: formName.trim(),
                slug: cleanSlug,
                description: formDesc.trim(),
                market: formMarket,
                icon: formIcon,
                status: formStatus,
                updatedAt: new Date().toISOString().slice(0, 10),
              }
            : item
        )
      );
      showToast(`Đã cập nhật thông tin danh mục "${formName}" thành công.`);
    } else {
      const newCat: CategoryItem = {
        id: `cat-${Date.now().toString().slice(-4)}`,
        name: formName.trim(),
        slug: cleanSlug,
        description: formDesc.trim() || "Chưa có mô tả chi tiết.",
        market: formMarket,
        icon: formIcon || "folder",
        totalItems: 0,
        rentItems: 0,
        thriftItems: 0,
        status: formStatus,
        updatedAt: new Date().toISOString().slice(0, 10),
      };
      setCategories((prev) => [newCat, ...prev]);
      showToast(`Đã thêm danh mục mới "${formName}" vào sổ bộ.`);
    }

    setIsModalOpen(false);
  };

  // Handle Toggle Status Confirmation
  const handleConfirmToggleStatus = () => {
    if (!confirmModalItem) return;
    const newStatus: CategoryStatus =
      confirmModalItem.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";

    setCategories((prev) =>
      prev.map((item) =>
        item.id === confirmModalItem.id
          ? {
              ...item,
              status: newStatus,
              updatedAt: new Date().toISOString().slice(0, 10),
            }
          : item
      )
    );

    showToast(
      newStatus === "ACTIVE"
        ? `Đã kích hoạt lại danh mục "${confirmModalItem.name}".`
        : `Đã tạm dừng niêm yết danh mục "${confirmModalItem.name}".`
    );
    setConfirmModalItem(null);
  };

  // Export JSON or CSV
  const handleExport = () => {
    const dataToExport = filteredCategories.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      market: c.market,
      totalItems: c.totalItems,
      rentItems: c.rentItems,
      thriftItems: c.thriftItems,
      status: c.status,
      description: c.description,
      updatedAt: c.updatedAt,
    }));

    const jsonBlob = new Blob([JSON.stringify(dataToExport, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(jsonBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reuse-hub-categories-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast("Đã tải xuống sổ bộ danh mục định dạng JSON.");
  };

  // Filter & Sort Logic
  const filteredCategories = useMemo(() => {
    let result = categories.filter((item) => {
      // Market Tab
      if (activeTab !== "ALL" && item.market !== activeTab) return false;

      // Status Filter
      if (statusFilter !== "ALL" && item.status !== statusFilter) return false;

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = item.name.toLowerCase().includes(q);
        const matchSlug = item.slug.toLowerCase().includes(q);
        const matchDesc = item.description.toLowerCase().includes(q);
        if (!matchName && !matchSlug && !matchDesc) return false;
      }

      return true;
    });

    // Sorting
    result.sort((a, b) => {
      if (sortFilter === "COUNT_DESC") {
        return b.totalItems - a.totalItems;
      }
      if (sortFilter === "NAME_ASC") {
        return a.name.localeCompare(b.name);
      }
      if (sortFilter === "RECENT") {
        return (b.updatedAt || "").localeCompare(a.updatedAt || "");
      }
      return 0;
    });

    return result;
  }, [categories, activeTab, statusFilter, searchQuery, sortFilter]);

  return (
    <div className="flex flex-col w-full bg-[#fdf8f5] text-[#1c1b19] font-sans min-h-screen">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 bg-[#1c1b19] text-[#fdf8f5] rounded-xl shadow-2xl border border-[#cfc5b8]/30 animate-bounce">
          <span className="material-symbols-outlined text-[20px] text-[#caebc9]">
            verified
          </span>
          <span className="text-xs font-medium">{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="ml-2 text-white/60 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {/* 1. Administrative Sub-Header / Breadcrumb node */}
      <div className="w-full bg-[#ece7e4]/60 px-4 md:px-12 border-b border-[#cfc5b8]/40">
        <div className="max-w-7xl mx-auto py-1.5 flex items-center gap-2 font-mono text-[11px] text-[#4c463c] overflow-x-auto whitespace-nowrap">
          <span className="material-symbols-outlined text-[14px] text-[#6c5937]">
            security
          </span>
          <span className="font-semibold text-[#6c5937] uppercase">
            BỘ PHẬN KIỂM SOÁT ĐỊNH DANH &amp; BẢO MẬT (KYC IDENTITY VAULT)
          </span>
          <span className="text-[#cfc5b8]">•</span>
          <span className="tracking-wide">HỆ THỐNG BẢO MẬT V4.2</span>
          <span className="text-[#cfc5b8]">•</span>
          <span className="tracking-wide">Giao Thức Bảo Mật FIDO2 Cấp Cao</span>
          <span className="text-[#cfc5b8]">•</span>
          <span className="tracking-wide font-medium text-[#1c1b19]">
            SỔ BỘ QUẢN LÝ PHÂN LOẠI &amp; TAXONOMY
          </span>
        </div>
      </div>

      {/* Main Container */}
      <main className="w-full py-8">
        <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
          {/* Header Title & Actions */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-[#e6e2de] text-[#4c463c] text-[11px] font-semibold uppercase tracking-wider mb-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#48654b]"></span>
                Phân Hệ Quản Trị Danh Mục &amp; Sổ Bộ Sàn
              </div>
              <h1 className="text-3xl sm:text-4xl font-serif text-[#1c1b19] tracking-tight font-semibold">
                Categories
              </h1>
              <p className="text-sm text-[#4c463c] mt-1">
                Quản lý danh mục sản phẩm trên marketplace ReUse Hub.
              </p>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              <button
                type="button"
                onClick={handleExport}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-[#f2ede9] hover:bg-[#ece7e4] text-[#1c1b19] text-xs font-semibold tracking-wide transition-colors border border-[#cfc5b8]/30 shadow-sm"
              >
                <span className="material-symbols-outlined text-[18px] text-[#6c5937]">
                  download
                </span>
                <span>Xuất Sổ Bộ (JSON/CSV)</span>
              </button>
              <button
                type="button"
                onClick={handleOpenCreateModal}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-[#1c1b19] hover:bg-[#6c5937] text-white text-xs font-semibold tracking-wider transition-colors shadow-sm"
              >
                <span className="material-symbols-outlined text-[18px]">add_circle</span>
                <span>+ Add Category</span>
              </button>
            </div>
          </div>

          {/* KPI Summary Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {/* Total Categories */}
            <div className="p-5 rounded-xl bg-[#f7f3ef] border border-[#cfc5b8]/30 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between text-[#4c463c] mb-2">
                <span className="text-[11px] uppercase tracking-wider font-semibold">
                  Tổng Danh Mục
                </span>
                <span className="material-symbols-outlined text-[20px] text-[#6c5937]">
                  folder_managed
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-serif font-bold text-[#1c1b19]">
                  {metrics.total}
                </span>
                <span className="text-xs text-[#4c463c]">Active Classes</span>
              </div>
              <div className="mt-3 pt-2 border-t border-[#cfc5b8]/20 text-[#4c463c] text-xs flex items-center justify-between">
                <span>Quy mô toàn sàn</span>
                <span className="text-[#48654b] font-semibold">100% Đồng bộ</span>
              </div>
            </div>

            {/* RENT Exclusives */}
            <div className="p-5 rounded-xl bg-[#f7f3ef] border border-[#cfc5b8]/30 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between text-[#4c463c] mb-2">
                <span className="text-[11px] uppercase tracking-wider font-semibold">
                  RENT Exclusives
                </span>
                <span className="material-symbols-outlined text-[20px] text-[#7f5227]">
                  key
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-serif font-bold text-[#1c1b19]">
                  {metrics.rentExclusive}
                </span>
                <span className="text-xs text-[#4c463c]">Chuyên dụng thuê</span>
              </div>
              <div className="mt-3 pt-2 border-t border-[#cfc5b8]/20 text-[#4c463c] text-xs flex items-center justify-between">
                <span>Tài sản lưu chuyển</span>
                <span className="text-[#6c5937] font-semibold">
                  {metrics.totalRentItems.toLocaleString("vi-VN")} Vật phẩm
                </span>
              </div>
            </div>

            {/* THRIFT Exclusives */}
            <div className="p-5 rounded-xl bg-[#f7f3ef] border border-[#cfc5b8]/30 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between text-[#4c463c] mb-2">
                <span className="text-[11px] uppercase tracking-wider font-semibold">
                  THRIFT Exclusives
                </span>
                <span className="material-symbols-outlined text-[20px] text-[#48654b]">
                  inventory_2
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-serif font-bold text-[#1c1b19]">
                  {metrics.thriftExclusive}
                </span>
                <span className="text-xs text-[#4c463c]">Chuyên dụng mua bán</span>
              </div>
              <div className="mt-3 pt-2 border-t border-[#cfc5b8]/20 text-[#4c463c] text-xs flex items-center justify-between">
                <span>Thanh lý &amp; Lưu trữ</span>
                <span className="text-[#6c5937] font-semibold">
                  {metrics.totalThriftItems.toLocaleString("vi-VN")} Vật phẩm
                </span>
              </div>
            </div>

            {/* Dual Circulation (COMMON) */}
            <div className="p-5 rounded-xl bg-[#f7f3ef] border border-[#cfc5b8]/30 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between text-[#4c463c] mb-2">
                <span className="text-[11px] uppercase tracking-wider font-semibold">
                  Dual Circulation
                </span>
                <span className="material-symbols-outlined text-[20px] text-[#6c5937]">
                  published_with_changes
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-serif font-bold text-[#1c1b19]">
                  {metrics.common}
                </span>
                <span className="text-xs text-[#4c463c]">Lưu thông kép (COMMON)</span>
              </div>
              <div className="mt-3 pt-2 border-t border-[#cfc5b8]/20 text-[#4c463c] text-xs flex items-center justify-between">
                <span>Sàn song hành</span>
                <span className="text-[#48654b] font-semibold">
                  Chiếm {metrics.commonRatio}%
                </span>
              </div>
            </div>
          </div>

          {/* Filter & Search Controls Bar */}
          <div className="p-4 rounded-xl bg-[#f7f3ef] border border-[#cfc5b8]/30 mb-5 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 shadow-sm">
            {/* Market Tabs */}
            <div className="flex items-center gap-1 bg-[#f2ede9] p-1 rounded-lg overflow-x-auto whitespace-nowrap">
              <button
                type="button"
                onClick={() => setActiveTab("ALL")}
                className={`px-4 py-1.5 rounded-md text-xs transition-colors ${
                  activeTab === "ALL"
                    ? "bg-white text-[#1c1b19] font-semibold shadow-sm"
                    : "text-[#4c463c] hover:text-[#1c1b19]"
                }`}
              >
                All <span className="ml-1 opacity-70">({tabCounts.ALL})</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("RENT")}
                className={`px-4 py-1.5 rounded-md text-xs transition-colors ${
                  activeTab === "RENT"
                    ? "bg-white text-[#1c1b19] font-semibold shadow-sm"
                    : "text-[#4c463c] hover:text-[#1c1b19]"
                }`}
              >
                RENT <span className="ml-1 opacity-70">({tabCounts.RENT})</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("THRIFT")}
                className={`px-4 py-1.5 rounded-md text-xs transition-colors ${
                  activeTab === "THRIFT"
                    ? "bg-white text-[#1c1b19] font-semibold shadow-sm"
                    : "text-[#4c463c] hover:text-[#1c1b19]"
                }`}
              >
                THRIFT <span className="ml-1 opacity-70">({tabCounts.THRIFT})</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("COMMON")}
                className={`px-4 py-1.5 rounded-md text-xs transition-colors ${
                  activeTab === "COMMON"
                    ? "bg-white text-[#1c1b19] font-semibold shadow-sm"
                    : "text-[#4c463c] hover:text-[#1c1b19]"
                }`}
              >
                COMMON <span className="ml-1 opacity-70">({tabCounts.COMMON})</span>
              </button>
            </div>

            {/* Controls Right: Search, Status, Sort */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <div className="relative min-w-[240px]">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-[#7e766a]">
                  search
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search category, slug..."
                  className="w-full pl-9 pr-3 py-2 bg-white rounded-lg text-xs text-[#1c1b19] border border-[#cfc5b8]/40 focus:outline-none focus:ring-1 focus:ring-[#6c5937] placeholder:text-[#7e766a]"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as "ALL" | CategoryStatus)}
                className="px-3 py-2 bg-white rounded-lg text-xs text-[#1c1b19] border border-[#cfc5b8]/40 focus:outline-none focus:ring-1 focus:ring-[#6c5937] cursor-pointer"
              >
                <option value="ALL">Tất cả trạng thái</option>
                <option value="ACTIVE">Hoạt động (Active)</option>
                <option value="INACTIVE">Tạm dừng (Inactive)</option>
              </select>

              <select
                value={sortFilter}
                onChange={(e) => setSortFilter(e.target.value as CategorySort)}
                className="px-3 py-2 bg-white rounded-lg text-xs text-[#1c1b19] border border-[#cfc5b8]/40 focus:outline-none focus:ring-1 focus:ring-[#6c5937] cursor-pointer"
              >
                <option value="COUNT_DESC">Sản phẩm: Nhiều nhất</option>
                <option value="NAME_ASC">Tên: A-Z</option>
                <option value="RECENT">Mới cập nhật</option>
              </select>
            </div>
          </div>

          {/* Category Data Table */}
          <div className="w-full bg-[#f7f3ef] rounded-xl overflow-hidden shadow-sm border border-[#cfc5b8]/30">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#f2ede9] text-[#4c463c] text-[11px] uppercase tracking-wider border-b border-[#cfc5b8]/30">
                    <th className="py-3.5 px-5 font-semibold">Tên &amp; Hồ Sơ Phân Loại</th>
                    <th className="py-3.5 px-4 font-semibold">Đường Dẫn Public Slug</th>
                    <th className="py-3.5 px-4 font-semibold">Loại Sàn Áp Dụng</th>
                    <th className="py-3.5 px-4 font-semibold text-right">Tổng Sản Phẩm</th>
                    <th className="py-3.5 px-4 font-semibold">Trạng Thái</th>
                    <th className="py-3.5 px-5 font-semibold text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ece7e4] text-xs">
                  {filteredCategories.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-[#7e766a]">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <span className="material-symbols-outlined text-4xl text-[#cfc5b8]">
                            folder_off
                          </span>
                          <p className="text-sm font-semibold text-[#1c1b19]">
                            Không tìm thấy danh mục nào phù hợp
                          </p>
                          <p className="text-xs text-[#7e766a]">
                            Thử tìm kiếm với từ khóa khác hoặc điều chỉnh bộ lọc thị trường.
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveTab("ALL");
                              setStatusFilter("ALL");
                              setSearchQuery("");
                            }}
                            className="mt-2 px-3.5 py-1.5 rounded-lg bg-[#1c1b19] text-white text-xs font-semibold"
                          >
                            Đặt Lại Bộ Lọc
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredCategories.map((cat) => {
                      const isActive = cat.status === "ACTIVE";

                      return (
                        <tr
                          key={cat.id}
                          className={`hover:bg-white transition-colors ${
                            !isActive ? "opacity-75 bg-[#f2ede9]/40" : ""
                          }`}
                        >
                          {/* Name & Profile */}
                          <td className="py-3.5 px-5">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center text-[#6c5937] shrink-0 shadow-sm border border-[#cfc5b8]/30">
                                <span className="material-symbols-outlined text-[22px]">
                                  {cat.icon || "category"}
                                </span>
                              </div>
                              <div className="min-w-0 max-w-[280px]">
                                <div className="text-sm font-semibold text-[#1c1b19] tracking-tight">
                                  {cat.name}
                                </div>
                                <div
                                  className="text-[11px] text-[#4c463c] truncate max-w-xs"
                                  title={cat.description}
                                >
                                  {cat.description}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Public Slug */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span className="font-mono text-[11px] text-[#1c1b19] bg-white px-2 py-1 rounded border border-[#cfc5b8]/30 inline-block">
                              {cat.slug}
                            </span>
                          </td>

                          {/* Market Type */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            {cat.market === "COMMON" && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#86724d] text-[#fffbff] text-[10px] font-bold tracking-wider uppercase">
                                <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                                COMMON
                              </span>
                            )}
                            {cat.market === "RENT" && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#9c6a3d]/20 text-[#7f5227] text-[10px] font-bold tracking-wider uppercase border border-[#7f5227]/20">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#7f5227]"></span>
                                RENT
                              </span>
                            )}
                            {cat.market === "THRIFT" && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#caebc9] text-[#4e6b50] text-[10px] font-bold tracking-wider uppercase border border-[#48654b]/20">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#48654b]"></span>
                                THRIFT
                              </span>
                            )}
                          </td>

                          {/* Product Count */}
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <div className="font-semibold text-xs text-[#1c1b19]">
                              {cat.totalItems} items
                            </div>
                            <div className="text-[10px] text-[#7e766a]">
                              {cat.market === "RENT"
                                ? `${cat.rentItems} Rent · Chuyên dụng`
                                : cat.market === "THRIFT"
                                ? `${cat.thriftItems} Thrift · Mua đứt`
                                : `${cat.rentItems} Rent · ${cat.thriftItems} Thrift`}
                            </div>
                          </td>

                          {/* Status */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            {isActive ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-[#caebc9]/60 text-[#4e6b50] text-[10px] font-bold uppercase tracking-wider">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#48654b]"></span>
                                Hoạt động
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-[#e6e2de] text-[#4c463c] text-[10px] font-bold uppercase tracking-wider">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#7e766a]"></span>
                                Tạm dừng
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-5 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1">
                              <Link
                                to={cat.slug}
                                target="_blank"
                                title="Xem danh mục trên sàn công khai"
                                className="p-1.5 text-[#4c463c] hover:text-[#1c1b19] hover:bg-white rounded transition-colors"
                              >
                                <span className="material-symbols-outlined text-[18px]">
                                  open_in_new
                                </span>
                              </Link>
                              <button
                                type="button"
                                onClick={() => handleOpenEditModal(cat)}
                                title="Chỉnh sửa danh mục"
                                className="p-1.5 text-[#4c463c] hover:text-[#6c5937] hover:bg-white rounded transition-colors"
                              >
                                <span className="material-symbols-outlined text-[18px]">
                                  edit_note
                                </span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmModalItem(cat)}
                                title={isActive ? "Tạm dừng hiển thị" : "Kích hoạt lại"}
                                className={`p-1.5 rounded transition-colors ${
                                  isActive
                                    ? "text-[#4c463c] hover:text-[#ba1a1a] hover:bg-white"
                                    : "text-[#4c463c] hover:text-[#48654b] hover:bg-white"
                                }`}
                              >
                                <span className="material-symbols-outlined text-[18px]">
                                  {isActive ? "block" : "check_circle"}
                                </span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            <div className="px-5 py-3.5 bg-[#f2ede9] border-t border-[#cfc5b8]/30 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#4c463c]">
              <div>
                Hiển thị{" "}
                <span className="font-semibold text-[#1c1b19]">
                  {filteredCategories.length}
                </span>{" "}
                trên {categories.length} danh mục sổ bộ
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled
                  className="px-3 py-1 rounded bg-white text-[#4c463c] opacity-50 cursor-not-allowed border border-[#cfc5b8]/30 font-medium"
                >
                  Trước
                </button>
                <span className="px-3 py-1 font-semibold text-[#1c1b19]">
                  Trang 1 / 1
                </span>
                <button
                  type="button"
                  disabled
                  className="px-3 py-1 rounded bg-white text-[#4c463c] opacity-50 cursor-not-allowed border border-[#cfc5b8]/30 font-medium"
                >
                  Kế tiếp
                </button>
              </div>
            </div>
          </div>

          {/* Editorial Taxonomical Footnote */}
          <div className="mt-6 p-4 bg-[#f7f3ef] rounded-xl border border-[#cfc5b8]/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-[#4c463c]">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px] text-[#6c5937]">
                verified
              </span>
              <span>
                Hệ sinh thái phân loại danh mục tuân thủ bộ chỉ mục Universal Circular Taxonomy (UCT-2025).
              </span>
            </div>
            <div className="font-mono text-[#7e766a] text-[11px]">
              Registry Node: #CAT-TAX-APAC-09
            </div>
          </div>
        </section>
      </main>

      {/* MODAL 1: ADD / EDIT CATEGORY */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#fdf8f5] rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-[#cfc5b8]/50 relative animate-scale-up">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#cfc5b8]/30">
              <div>
                <span className="text-[10px] text-[#6c5937] uppercase font-bold tracking-wider">
                  Hồ Sơ Sổ Bộ
                </span>
                <h2 className="font-serif text-xl font-bold text-[#1c1b19]">
                  {editingCategory ? "Chỉnh Sửa Danh Mục" : "Thêm Danh Mục Mới"}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-[#f2ede9] hover:bg-[#ece7e4] text-[#4c463c] flex items-center justify-center transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[#1c1b19] mb-1">
                  Tên Danh Mục (Category Name) *
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Ví dụ: Cameras & Optics"
                  className="w-full px-3 py-2 bg-white rounded-lg border border-[#cfc5b8]/40 focus:outline-none focus:ring-1 focus:ring-[#6c5937] text-xs text-[#1c1b19]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#1c1b19] mb-1">
                  Public Slug (URL Định Danh) *
                </label>
                <div className="flex items-center">
                  <span className="px-3 py-2 bg-[#f2ede9] text-[#4c463c] font-mono text-[11px] rounded-l-lg border border-r-0 border-[#cfc5b8]/40">
                    /categories/
                  </span>
                  <input
                    type="text"
                    required
                    value={formSlug}
                    onChange={(e) => setFormSlug(e.target.value)}
                    placeholder="cameras-optics"
                    className="w-full px-3 py-2 bg-white font-mono text-xs rounded-r-lg border border-[#cfc5b8]/40 focus:outline-none focus:ring-1 focus:ring-[#6c5937] text-[#1c1b19]"
                  />
                </div>
                <p className="text-[11px] text-[#7e766a] mt-1">
                  Đường dẫn khách hàng truy cập:{" "}
                  <span className="text-[#6c5937] font-mono">
                    /categories/{formSlug || "your-category"}
                  </span>
                </p>
              </div>

              <div>
                <label className="block font-semibold text-[#1c1b19] mb-1.5">
                  Loại Thị Trường Áp Dụng (Marketplace Type)
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  <label
                    className={`cursor-pointer p-2.5 rounded-lg border transition-all flex flex-col items-center text-center ${
                      formMarket === "RENT"
                        ? "bg-[#9c6a3d]/15 border-[#7f5227] text-[#7f5227]"
                        : "bg-white border-[#cfc5b8]/40 text-[#4c463c] hover:bg-[#f7f3ef]"
                    }`}
                  >
                    <input
                      type="radio"
                      name="marketTypeRadio"
                      value="RENT"
                      checked={formMarket === "RENT"}
                      onChange={() => setFormMarket("RENT")}
                      className="sr-only"
                    />
                    <span className="font-bold text-xs">RENT</span>
                    <span className="text-[10px] opacity-80 mt-0.5">Chỉ cho thuê</span>
                  </label>

                  <label
                    className={`cursor-pointer p-2.5 rounded-lg border transition-all flex flex-col items-center text-center ${
                      formMarket === "THRIFT"
                        ? "bg-[#caebc9]/40 border-[#48654b] text-[#48654b]"
                        : "bg-white border-[#cfc5b8]/40 text-[#4c463c] hover:bg-[#f7f3ef]"
                    }`}
                  >
                    <input
                      type="radio"
                      name="marketTypeRadio"
                      value="THRIFT"
                      checked={formMarket === "THRIFT"}
                      onChange={() => setFormMarket("THRIFT")}
                      className="sr-only"
                    />
                    <span className="font-bold text-xs">THRIFT</span>
                    <span className="text-[10px] opacity-80 mt-0.5">Chỉ mua đứt</span>
                  </label>

                  <label
                    className={`cursor-pointer p-2.5 rounded-lg border transition-all flex flex-col items-center text-center ${
                      formMarket === "COMMON"
                        ? "bg-[#86724d]/20 border-[#6c5937] text-[#6c5937]"
                        : "bg-white border-[#cfc5b8]/40 text-[#4c463c] hover:bg-[#f7f3ef]"
                    }`}
                  >
                    <input
                      type="radio"
                      name="marketTypeRadio"
                      value="COMMON"
                      checked={formMarket === "COMMON"}
                      onChange={() => setFormMarket("COMMON")}
                      className="sr-only"
                    />
                    <span className="font-bold text-xs">COMMON</span>
                    <span className="text-[10px] opacity-80 mt-0.5">Cả hai sàn</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#1c1b19] mb-1">
                  Mô Tả Tiêu Chuẩn
                </label>
                <textarea
                  rows={3}
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="Nhập tóm tắt mô tả, tiêu chí giám định và phân loại tài sản..."
                  className="w-full px-3 py-2 bg-white rounded-lg border border-[#cfc5b8]/40 focus:outline-none focus:ring-1 focus:ring-[#6c5937] text-xs text-[#1c1b19]"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-[#cfc5b8]/30">
                <div>
                  <div className="font-semibold text-[#1c1b19]">Trạng Thái Niêm Yết</div>
                  <div className="text-[10px] text-[#7e766a]">
                    Cho phép hiển thị trên thanh điều hướng &amp; bộ lọc người dùng
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formStatus === "ACTIVE"}
                    onChange={(e) =>
                      setFormStatus(e.target.checked ? "ACTIVE" : "INACTIVE")
                    }
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-[#cfc5b8] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white peer-checked:bg-[#48654b] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all"></div>
                </label>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-[#cfc5b8]/30">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-[#f2ede9] hover:bg-[#ece7e4] text-[#1c1b19] font-medium transition-colors"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-[#1c1b19] hover:bg-[#6c5937] text-white font-semibold transition-colors shadow-sm"
                >
                  Lưu Danh Mục
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: CONFIRM DEACTIVATE / ACTIVATE */}
      {confirmModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#fdf8f5] rounded-2xl max-w-md w-full p-6 shadow-2xl text-center border border-[#cfc5b8]/50 animate-scale-up">
            <div
              className={`w-12 h-12 rounded-full mx-auto flex items-center justify-center mb-3 ${
                confirmModalItem.status === "ACTIVE"
                  ? "bg-[#ffdad6] text-[#ba1a1a]"
                  : "bg-[#caebc9] text-[#48654b]"
              }`}
            >
              <span className="material-symbols-outlined text-[28px]">
                {confirmModalItem.status === "ACTIVE" ? "warning" : "check_circle"}
              </span>
            </div>

            <h3 className="font-serif text-lg font-bold text-[#1c1b19] mb-1.5">
              {confirmModalItem.status === "ACTIVE"
                ? "Tạm Dừng Danh Mục?"
                : "Kích Hoạt Lại Danh Mục?"}
            </h3>

            <p className="text-xs text-[#4c463c] mb-5 leading-relaxed">
              Danh mục{" "}
              <strong className="text-[#1c1b19]">{confirmModalItem.name}</strong> hiện
              đang có{" "}
              <strong
                className={
                  confirmModalItem.status === "ACTIVE"
                    ? "text-[#ba1a1a]"
                    : "text-[#48654b]"
                }
              >
                {confirmModalItem.totalItems} sản phẩm
              </strong>{" "}
              lưu hành.{" "}
              {confirmModalItem.status === "ACTIVE"
                ? "Khi tạm dừng, các sản phẩm thuộc danh mục sẽ bị ẩn khỏi kết quả tìm kiếm và danh sách marketplace."
                : "Khi kích hoạt, danh mục và toàn bộ sản phẩm sẽ hiển thị lại công khai trên marketplace."}
            </p>

            <div className="flex items-center justify-center gap-2.5">
              <button
                type="button"
                onClick={() => setConfirmModalItem(null)}
                className="w-full py-2.5 rounded-lg bg-[#f2ede9] hover:bg-[#ece7e4] text-[#1c1b19] text-xs font-semibold transition-colors"
              >
                Giữ Nguyên
              </button>
              <button
                type="button"
                onClick={handleConfirmToggleStatus}
                className={`w-full py-2.5 rounded-lg text-white text-xs font-semibold tracking-wider transition-colors shadow-sm ${
                  confirmModalItem.status === "ACTIVE"
                    ? "bg-[#ba1a1a] hover:bg-[#93000a]"
                    : "bg-[#48654b] hover:bg-[#314d34]"
                }`}
              >
                {confirmModalItem.status === "ACTIVE"
                  ? "Xác Nhận Tạm Dừng"
                  : "Xác Nhận Kích Hoạt"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryManagement;
