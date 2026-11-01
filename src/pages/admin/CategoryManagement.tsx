import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  fetchAdminCategoriesApi,
  createAdminCategoryApi,
  updateAdminCategoryApi,
  toggleCategoryStatusApi,
  deleteAdminCategoryApi,
} from "../../services/admin.api";
import { uploadImageApi } from "../../services/upload.api";
import { normalizeImageUrl } from "../../utils/imageUrl";

export type MarketType = "ALL" | "RENT" | "THRIFT" | "COMMON";
export type CategoryStatus = "ACTIVE" | "INACTIVE";
export type CategorySort = "COUNT_DESC" | "NAME_ASC" | "RECENT";

export interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  code: string;
  description: string;
  subtitle: string;
  image: string;
  market: "RENT" | "THRIFT" | "COMMON";
  icon: string;
  inspectionBadge: string;
  escrowBadge: string;
  totalItems: number;
  rentItems: number;
  thriftItems: number;
  status: CategoryStatus;
  updatedAt?: string;
}

const ICON_PRESETS = [
  { icon: "photo_camera", label: "Camera" },
  { icon: "steps", label: "Giày dép" },
  { icon: "styler", label: "Đầm dạ hội" },
  { icon: "checkroom", label: "Quần áo" },
  { icon: "diamond", label: "Phụ kiện" },
  { icon: "shopping_bag", label: "Túi xách" },
  { icon: "watch", label: "Đồng hồ" },
  { icon: "camping", label: "Dã ngoại" },
  { icon: "devices", label: "Thiết bị" },
  { icon: "category", label: "Mặc định" },
];

const formatCategoryItems = (
  list: Awaited<ReturnType<typeof fetchAdminCategoriesApi>>
): CategoryItem[] => {
  return list.map((c, idx) => ({
    id: c.id,
    name: c.name,
    slug: c.slug.startsWith("/categories/")
      ? c.slug
      : `/categories/${c.slug.replace(/^\/+/, "")}`,
    code: c.code || `CAT.${String(idx + 1).padStart(2, "0")}`,
    description: c.description,
    subtitle: c.subtitle || "Kiểm định chuẩn hóa 100% · Bảo chứng Smart Escrow",
    image: c.image || "",
    market: c.market,
    icon: c.icon || "category",
    inspectionBadge:
      c.inspectionBadge || "100% Kiểm định chất lượng & Khử trùng UV-C",
    escrowBadge: c.escrowBadge || "Smart Escrow Bảo chứng cọc an toàn 100%",
    totalItems: c.totalItems,
    rentItems: c.rentItems,
    thriftItems: c.thriftItems,
    status: c.status,
    updatedAt: c.updatedAt,
  }));
};

export const CategoryManagement: React.FC = () => {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<MarketType>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | CategoryStatus>("ALL");
  const [sortFilter, setSortFilter] = useState<CategorySort>("COUNT_DESC");

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form Fields matching User Category UI (/categories, /categories/:slug, /)
  const [formName, setFormName] = useState("");
  const [formSlug, setFormSlug] = useState("");
  const [formCode, setFormCode] = useState("");
  const [formMarket, setFormMarket] = useState<"RENT" | "THRIFT" | "COMMON">("COMMON");
  const [formSubtitle, setFormSubtitle] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formImage, setFormImage] = useState("");
  const [formIcon, setFormIcon] = useState("category");
  const [formInspectionBadge, setFormInspectionBadge] = useState(
    "100% Kiểm định chất lượng & Khử trùng UV-C"
  );
  const [formStatus, setFormStatus] = useState<CategoryStatus>("ACTIVE");
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Confirm Status Modal
  const [confirmModalItem, setConfirmModalItem] = useState<CategoryItem | null>(null);

  // Confirm Delete Modal
  const [deleteModalItem, setDeleteModalItem] = useState<CategoryItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Nạp danh mục thật từ MongoDB qua API
  const loadCategories = useCallback(async () => {
    try {
      const list = await fetchAdminCategoriesApi();
      setCategories(formatCategoryItems(list));
    } catch (err) {
      console.warn("Lỗi tải danh mục:", err);
      showToast("Không thể tải danh mục từ cơ sở dữ liệu MongoDB");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    const fetchInitialData = async () => {
      try {
        const list = await fetchAdminCategoriesApi();
        if (!ignore) {
          setCategories(formatCategoryItems(list));
        }
      } catch (err) {
        if (!ignore) {
          console.warn("Lỗi tải danh mục:", err);
          showToast("Không thể tải danh mục từ cơ sở dữ liệu MongoDB");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    fetchInitialData();

    return () => {
      ignore = true;
    };
  }, []);

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
        .replace(/đ/g, "d")
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_-]+/g, "-")
        .replace(/^-+|-+$/g, "");
      setFormSlug(generated || "your-category");
    }
  };

  // Upload image to Cloudinary
  const handleUploadCategoryImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingImage(true);
      const uploadedUrl = await uploadImageApi(file, "reuse_hub/categories");
      setFormImage(uploadedUrl);
      showToast("Đã tải ảnh danh mục lên Cloudinary thành công!");
    } catch (err) {
      console.error("Lỗi upload ảnh Cloudinary:", err);
      showToast("Không thể tải ảnh lên Cloudinary. Vui lòng thử lại.");
    } finally {
      setIsUploadingImage(false);
      if (e.target) e.target.value = "";
    }
  };

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingCategory(null);
    setFormName("");
    setFormSlug("your-category");
    setFormCode(`CAT.${String(categories.length + 1).padStart(2, "0")}`);
    setFormMarket("COMMON");
    setFormSubtitle("Kiểm định chuẩn hóa 100% · Bảo chứng Smart Escrow");
    setFormDesc("");
    setFormImage("");
    setFormIcon("category");
    setFormInspectionBadge("100% Kiểm định chất lượng & Khử trùng UV-C");
    setFormStatus("ACTIVE");
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (cat: CategoryItem) => {
    setEditingCategory(cat);
    setFormName(cat.name);
    setFormSlug(cat.slug.replace("/categories/", ""));
    setFormCode(cat.code || "CAT.01");
    setFormMarket(cat.market);
    setFormSubtitle(cat.subtitle || "");
    setFormDesc(cat.description || "");
    setFormImage(cat.image || "");
    setFormIcon(cat.icon || "category");
    setFormInspectionBadge(
      cat.inspectionBadge || "100% Kiểm định chất lượng & Khử trùng UV-C"
    );
    setFormStatus(cat.status);
    setIsModalOpen(true);
  };

  // Submit Modal (Add / Edit qua MongoDB API)
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formSlug.trim()) {
      alert("Vui lòng nhập tên danh mục và slug hợp lệ.");
      return;
    }

    const rawSlug = formSlug.replace(/^\/categories\//, "").replace(/^\/+/, "").trim();

    const payload = {
      name: formName.trim(),
      slug: rawSlug,
      code: formCode.trim() || `CAT.${String(categories.length + 1).padStart(2, "0")}`,
      subtitle:
        formSubtitle.trim() || "Kiểm định chuẩn hóa 100% · Bảo chứng Smart Escrow",
      description:
        formDesc.trim() ||
        `Danh mục sản phẩm ${formName.trim()} tuần hoàn được kiểm định chất lượng tại ReUse Hub.`,
      image: formImage.trim(),
      icon: formIcon || "category",
      inspectionBadge:
        formInspectionBadge.trim() || "100% Kiểm định chất lượng & Khử trùng UV-C",
      type: (formMarket === "COMMON" ? "BOTH" : formMarket) as "RENT" | "THRIFT" | "BOTH",
      isActive: formStatus === "ACTIVE",
    };

    try {
      setIsSaving(true);
      if (editingCategory) {
        await updateAdminCategoryApi(editingCategory.id, payload);
        showToast(`Đã cập nhật danh mục "${formName}" vào MongoDB thành công.`);
      } else {
        await createAdminCategoryApi(payload);
        showToast(`Đã tạo mới danh mục "${formName}" lưu vào MongoDB thành công.`);
      }
      setIsModalOpen(false);
      await loadCategories();
      window.dispatchEvent(new Event("category_updated"));
    } catch (err: unknown) {
      console.error(err);
      const errMsg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      showToast(errMsg || "Lỗi lưu danh mục vào cơ sở dữ liệu");
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Toggle Status Confirmation qua MongoDB API
  const handleConfirmToggleStatus = async () => {
    if (!confirmModalItem) return;
    const newStatus: CategoryStatus =
      confirmModalItem.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";

    try {
      await toggleCategoryStatusApi(confirmModalItem.id, newStatus === "ACTIVE");
      showToast(
        newStatus === "ACTIVE"
          ? `Đã kích hoạt lại danh mục "${confirmModalItem.name}" trên MongoDB.`
          : `Đã tạm dừng niêm yết danh mục "${confirmModalItem.name}" trên MongoDB.`
      );
      setConfirmModalItem(null);
      await loadCategories();
      window.dispatchEvent(new Event("category_updated"));
    } catch (err: unknown) {
      console.error(err);
      const errMsg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      showToast(errMsg || "Lỗi cập nhật trạng thái danh mục");
    }
  };

  // Handle Delete Confirmation qua MongoDB API
  const handleConfirmDeleteCategory = async () => {
    if (!deleteModalItem) return;

    try {
      setIsDeleting(true);
      await deleteAdminCategoryApi(deleteModalItem.id);
      showToast(`Đã xóa danh mục "${deleteModalItem.name}" khỏi MongoDB.`);
      setDeleteModalItem(null);
      await loadCategories();
      window.dispatchEvent(new Event("category_updated"));
    } catch (err: unknown) {
      console.error(err);
      const errMsg =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      showToast(errMsg || "Lỗi khi xóa danh mục khỏi cơ sở dữ liệu");
    } finally {
      setIsDeleting(false);
    }
  };

  // Export JSON
  const handleExport = () => {
    const dataToExport = filteredCategories.map((c) => ({
      id: c.id,
      code: c.code,
      name: c.name,
      slug: c.slug,
      market: c.market,
      subtitle: c.subtitle,
      description: c.description,
      image: c.image,
      icon: c.icon,
      inspectionBadge: c.inspectionBadge,
      totalItems: c.totalItems,
      rentItems: c.rentItems,
      thriftItems: c.thriftItems,
      status: c.status,
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
  const filteredCategories = categories
    .filter((item) => {
      if (activeTab !== "ALL" && item.market !== activeTab) return false;
      if (statusFilter !== "ALL" && item.status !== statusFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = item.name.toLowerCase().includes(q);
        const matchSlug = item.slug.toLowerCase().includes(q);
        const matchDesc = item.description.toLowerCase().includes(q);
        const matchSubtitle = (item.subtitle || "").toLowerCase().includes(q);
        const matchCode = (item.code || "").toLowerCase().includes(q);
        if (!matchName && !matchSlug && !matchDesc && !matchSubtitle && !matchCode) {
          return false;
        }
      }

      return true;
    })
    .sort((a, b) => {
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
          <span className="tracking-wide">Đồng Bộ Cloudinary &amp; MongoDB</span>
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
                Quản lý danh mục sản phẩm lưu trữ trực tiếp trên MongoDB &amp; Cloudinary, đồng bộ tức thời sang giao diện khách hàng.
              </p>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap">
              <Link
                to="/categories"
                target="_blank"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-white hover:bg-[#ece7e4] text-[#1c1b19] text-xs font-semibold tracking-wide transition-colors border border-[#cfc5b8]/40 shadow-sm"
              >
                <span className="material-symbols-outlined text-[18px] text-[#6c5937]">
                  visibility
                </span>
                <span>Xem Giao Diện User</span>
              </Link>
              <button
                type="button"
                onClick={handleExport}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-[#f2ede9] hover:bg-[#ece7e4] text-[#1c1b19] text-xs font-semibold tracking-wide transition-colors border border-[#cfc5b8]/30 shadow-sm"
              >
                <span className="material-symbols-outlined text-[18px] text-[#6c5937]">
                  download
                </span>
                <span>Xuất Sổ Bộ (JSON)</span>
              </button>
              <button
                type="button"
                onClick={handleOpenCreateModal}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-[#1c1b19] hover:bg-[#6c5937] text-white text-xs font-semibold tracking-wider transition-colors shadow-sm cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">add_circle</span>
                <span>+ Thêm Danh Mục</span>
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
                <span className="text-xs text-[#4c463c]">Danh mục DB</span>
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
                  placeholder="Tìm tên, mã, slug, mô tả..."
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
                    <th className="py-3.5 px-5 font-semibold">Ảnh &amp; Hồ Sơ Phân Loại</th>
                    <th className="py-3.5 px-4 font-semibold">Đường Dẫn Public Slug</th>
                    <th className="py-3.5 px-4 font-semibold">Loại Sàn Áp Dụng</th>
                    <th className="py-3.5 px-4 font-semibold text-right">Tổng Sản Phẩm</th>
                    <th className="py-3.5 px-4 font-semibold">Trạng Thái</th>
                    <th className="py-3.5 px-5 font-semibold text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ece7e4] text-xs">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-[#7e766a]">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <span className="material-symbols-outlined text-3xl animate-spin text-[#6c5937]">
                            sync
                          </span>
                          <p className="text-sm font-medium text-[#1c1b19]">
                            Đang tải danh mục từ cơ sở dữ liệu MongoDB...
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : filteredCategories.length === 0 ? (
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
                      const imgSrc = normalizeImageUrl(cat.image);

                      return (
                        <tr
                          key={cat.id}
                          className={`hover:bg-white transition-colors ${
                            !isActive ? "opacity-75 bg-[#f2ede9]/40" : ""
                          }`}
                        >
                          {/* Image, Code, Name, Subtitle & Description */}
                          <td className="py-3.5 px-5">
                            <div className="flex items-center gap-3.5">
                              <div className="relative w-14 h-14 rounded-xl bg-white overflow-hidden flex items-center justify-center text-[#6c5937] shrink-0 shadow-sm border border-[#cfc5b8]/40">
                                {imgSrc ? (
                                  <img
                                    src={imgSrc}
                                    alt={cat.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <span className="material-symbols-outlined text-[24px]">
                                    {cat.icon || "category"}
                                  </span>
                                )}
                                <span className="absolute bottom-0.5 right-0.5 w-5 h-5 rounded-md bg-[#1c1b19]/80 text-white flex items-center justify-center backdrop-blur-xs">
                                  <span className="material-symbols-outlined text-[12px]">
                                    {cat.icon || "category"}
                                  </span>
                                </span>
                              </div>
                              <div className="min-w-0 max-w-[320px]">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#ece7e4] text-[#6c5937]">
                                    {cat.code}
                                  </span>
                                  <span className="text-sm font-semibold text-[#1c1b19] tracking-tight truncate">
                                    {cat.name}
                                  </span>
                                </div>
                                {cat.subtitle && (
                                  <div className="text-[11px] font-medium text-[#6c5937] truncate mt-0.5">
                                    {cat.subtitle}
                                  </div>
                                )}
                                <div
                                  className="text-[11px] text-[#4c463c] truncate max-w-xs mt-0.5"
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
                                title="Xem danh mục trên giao diện User"
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
                                className="p-1.5 text-[#4c463c] hover:text-[#6c5937] hover:bg-white rounded transition-colors cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-[18px]">
                                  edit_note
                                </span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmModalItem(cat)}
                                title={isActive ? "Tạm dừng hiển thị" : "Kích hoạt lại"}
                                className={`p-1.5 rounded transition-colors cursor-pointer ${
                                  isActive
                                    ? "text-[#4c463c] hover:text-[#ba1a1a] hover:bg-white"
                                    : "text-[#4c463c] hover:text-[#48654b] hover:bg-white"
                                }`}
                              >
                                <span className="material-symbols-outlined text-[18px]">
                                  {isActive ? "block" : "check_circle"}
                                </span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteModalItem(cat)}
                                title="Xóa danh mục"
                                className="p-1.5 text-[#4c463c] hover:text-[#ba1a1a] hover:bg-white rounded transition-colors cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-[18px]">
                                  delete
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
                Hệ sinh thái phân loại danh mục tuân thủ bộ chỉ mục Universal Circular Taxonomy (UCT-2025) &amp; lưu trữ ảnh trên Cloudinary CDN.
              </span>
            </div>
            <div className="font-mono text-[#7e766a] text-[11px]">
              Registry Node: #CAT-TAX-APAC-09
            </div>
          </div>
        </section>
      </main>

      {/* MODAL 1: ADD / EDIT CATEGORY (MATCHING USER CATEGORY UI + CLOUDINARY UPLOAD) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-xs overflow-y-auto">
          <div className="bg-[#fdf8f5] rounded-2xl max-w-4xl w-full p-6 sm:p-7 shadow-2xl border border-[#cfc5b8]/50 relative my-8 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 mb-5 border-b border-[#cfc5b8]/30">
              <div>
                <span className="text-[10px] text-[#6c5937] uppercase font-bold tracking-wider">
                  Hồ Sơ Sổ Bộ · Đồng Bộ Giao Diện Khách Hàng &amp; Cloudinary
                </span>
                <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#1c1b19]">
                  {editingCategory ? "Chỉnh Sửa Danh Mục" : "Thêm Danh Mục Mới"}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-[#f2ede9] hover:bg-[#ece7e4] text-[#4c463c] flex items-center justify-center transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-5 text-xs">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* LEFT COLUMN: FORM INPUTS */}
                <div className="lg:col-span-7 space-y-4">
                  {/* Row 1: Category Name & Code */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block font-semibold text-[#1c1b19] mb-1">
                        Tên Danh Mục (Hiển thị tiêu đề chính) *
                      </label>
                      <input
                        type="text"
                        required
                        value={formName}
                        onChange={(e) => handleNameChange(e.target.value)}
                        placeholder="Ví dụ: Camera, Giày dép, Túi xách..."
                        className="w-full px-3 py-2 bg-white rounded-lg border border-[#cfc5b8]/40 focus:outline-none focus:ring-1 focus:ring-[#6c5937] text-xs text-[#1c1b19]"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-[#1c1b19] mb-1">
                        Mã Danh Mục (Code)
                      </label>
                      <input
                        type="text"
                        value={formCode}
                        onChange={(e) => setFormCode(e.target.value.toUpperCase())}
                        placeholder="CAT.06"
                        className="w-full px-3 py-2 bg-white font-mono rounded-lg border border-[#cfc5b8]/40 focus:outline-none focus:ring-1 focus:ring-[#6c5937] text-xs text-[#1c1b19]"
                      />
                    </div>
                  </div>

                  {/* Row 2: Public Slug */}
                  <div>
                    <label className="block font-semibold text-[#1c1b19] mb-1">
                      Public Slug (URL Định Danh trên trang User) *
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
                        placeholder="camera"
                        className="w-full px-3 py-2 bg-white font-mono text-xs rounded-r-lg border border-[#cfc5b8]/40 focus:outline-none focus:ring-1 focus:ring-[#6c5937] text-[#1c1b19]"
                      />
                    </div>
                  </div>

                  {/* Row 3: Marketplace Type */}
                  <div>
                    <label className="block font-semibold text-[#1c1b19] mb-1.5">
                      Loại Thị Trường Áp Dụng (Hiển thị huy hiệu RENT / THRIFT)
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
                        <span className="text-[10px] opacity-80 mt-0.5">Thuần mua đứt</span>
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
                        <span className="text-[10px] opacity-80 mt-0.5">Cả RENT &amp; THRIFT</span>
                      </label>
                    </div>
                  </div>

                  {/* Row 4: Subtitle (Tagline at footer of User Category card) */}
                  <div>
                    <label className="block font-semibold text-[#1c1b19] mb-1">
                      Thông Điệp Phụ / Điểm Nhấn (Hiển thị chân thẻ trang /categories)
                    </label>
                    <input
                      type="text"
                      value={formSubtitle}
                      onChange={(e) => setFormSubtitle(e.target.value)}
                      placeholder="Ví dụ: Bao gồm body, lens prime & gimbal · Khử khuẩn UV 100%"
                      className="w-full px-3 py-2 bg-white rounded-lg border border-[#cfc5b8]/40 focus:outline-none focus:ring-1 focus:ring-[#6c5937] text-xs text-[#1c1b19]"
                    />
                  </div>

                  {/* Row 5: Description */}
                  <div>
                    <label className="block font-semibold text-[#1c1b19] mb-1">
                      Mô Tả Danh Mục (Hiển thị trên thẻ /categories &amp; đầu trang chi tiết)
                    </label>
                    <textarea
                      rows={3}
                      value={formDesc}
                      onChange={(e) => setFormDesc(e.target.value)}
                      placeholder="Nhập mô tả chi tiết danh mục, dòng sản phẩm tiêu biểu và tiêu chuẩn thẩm định..."
                      className="w-full px-3 py-2 bg-white rounded-lg border border-[#cfc5b8]/40 focus:outline-none focus:ring-1 focus:ring-[#6c5937] text-xs text-[#1c1b19]"
                    />
                  </div>

                  {/* Row 6: Inspection Badge */}
                  <div>
                    <label className="block font-semibold text-[#1c1b19] mb-1">
                      Nhãn Bảo Chứng Kiểm Định (Hiển thị tại trang chi tiết danh mục)
                    </label>
                    <input
                      type="text"
                      value={formInspectionBadge}
                      onChange={(e) => setFormInspectionBadge(e.target.value)}
                      placeholder="Ví dụ: 100% Kiểm định Shutter & Cảm biến"
                      className="w-full px-3 py-2 bg-white rounded-lg border border-[#cfc5b8]/40 focus:outline-none focus:ring-1 focus:ring-[#6c5937] text-xs text-[#1c1b19]"
                    />
                  </div>

                  {/* Row 7: Icon Selector */}
                  <div>
                    <label className="block font-semibold text-[#1c1b19] mb-1.5">
                      Biểu Tượng Danh Mục (Icon)
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {ICON_PRESETS.map((item) => (
                        <button
                          key={item.icon}
                          type="button"
                          onClick={() => setFormIcon(item.icon)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] transition-all cursor-pointer ${
                            formIcon === item.icon
                              ? "bg-[#1c1b19] text-white border-[#1c1b19] font-semibold"
                              : "bg-white text-[#4c463c] border-[#cfc5b8]/40 hover:bg-[#f2ede9]"
                          }`}
                        >
                          <span className="material-symbols-outlined text-[15px]">
                            {item.icon}
                          </span>
                          <span>{item.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* RIGHT COLUMN: CLOUDINARY IMAGE UPLOAD & LIVE USER CARD PREVIEW */}
                <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
                  {/* Cloudinary Upload Box */}
                  <div className="p-4 rounded-xl bg-white border border-[#cfc5b8]/40 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-[#1c1b19] block">
                          Ảnh Bìa Danh Mục (Cloudinary)
                        </span>
                        <span className="text-[10px] text-[#7e766a]">
                          Tải ảnh lên Cloudinary để hiển thị ở trang chủ &amp; trang danh mục User
                        </span>
                      </div>
                      {formImage.includes("cloudinary.com") && (
                        <span className="px-2 py-0.5 rounded-full bg-[#caebc9] text-[#48654b] text-[10px] font-bold">
                          Cloudinary ✓
                        </span>
                      )}
                    </div>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleUploadCategoryImage}
                      className="hidden"
                    />

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={isUploadingImage}
                        onClick={() => fileInputRef.current?.click()}
                        className="flex-1 py-2.5 px-3 rounded-lg bg-[#1c1b19] hover:bg-[#6c5937] text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-60 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          {isUploadingImage ? "sync" : "cloud_upload"}
                        </span>
                        <span>
                          {isUploadingImage
                            ? "Đang tải lên Cloudinary..."
                            : formImage
                            ? "Đổi Ảnh Trên Cloudinary"
                            : "Tải Ảnh Lên Cloudinary"}
                        </span>
                      </button>
                      {formImage && (
                        <button
                          type="button"
                          onClick={() => setFormImage("")}
                          title="Xóa ảnh"
                          className="p-2.5 rounded-lg bg-[#f2ede9] hover:bg-[#ffdad6] text-[#4c463c] hover:text-[#ba1a1a] transition-colors cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            delete
                          </span>
                        </button>
                      )}
                    </div>

                    <div>
                      <label className="block text-[10px] font-medium text-[#7e766a] mb-1">
                        Hoặc dán trực tiếp URL ảnh (Cloudinary / HTTPS):
                      </label>
                      <input
                        type="text"
                        value={formImage}
                        onChange={(e) => setFormImage(e.target.value)}
                        placeholder="https://res.cloudinary.com/..."
                        className="w-full px-2.5 py-1.5 bg-[#fdf8f5] rounded-lg border border-[#cfc5b8]/40 text-[11px] text-[#1c1b19] font-mono focus:outline-none focus:ring-1 focus:ring-[#6c5937]"
                      />
                    </div>
                  </div>

                  {/* Live User UI Card Preview */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] text-[#4c463c]">
                      <span className="font-semibold uppercase tracking-wider">
                        Xem Trước Thẻ Hiển Thị Ở Giao Diện User (/categories)
                      </span>
                      <span className="font-mono text-[10px] text-[#6c5937]">
                        Live Preview
                      </span>
                    </div>

                    <div className="rounded-2xl overflow-hidden border border-[#E6E2DC] bg-[#F7F5F0] shadow-md flex flex-col">
                      <div className="relative w-full h-40 bg-[#E6E2DC] overflow-hidden flex items-center justify-center">
                        {formImage ? (
                          <img
                            src={normalizeImageUrl(formImage)}
                            alt={formName || "Preview"}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="flex flex-col items-center gap-1 text-[#79716B]">
                            <span className="material-symbols-outlined text-3xl">
                              {formIcon || "image"}
                            </span>
                            <span className="text-[11px]">Chưa có ảnh bìa</span>
                          </div>
                        )}
                        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                          {formMarket === "THRIFT" ? (
                            <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-[#B45309] text-white">
                              Thuần THRIFT
                            </span>
                          ) : formMarket === "RENT" ? (
                            <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-[#1C1A18]/85 text-white">
                              Chuyên RENT
                            </span>
                          ) : (
                            <>
                              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#1C1A18]/85 text-white">
                                RENT
                              </span>
                              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#FBF9F5]/90 text-[#1C1A18] border border-[#E6E2DC]">
                                THRIFT
                              </span>
                            </>
                          )}
                        </div>
                        <span className="absolute bottom-2 right-3 font-mono text-[10px] text-white/90 bg-black/50 px-2 py-0.5 rounded">
                          {formCode || "CAT.01"}
                        </span>
                      </div>

                      <div className="p-4 space-y-2">
                        <h3 className="font-serif text-lg font-semibold text-[#1C1A18]">
                          {formName || "Tên danh mục"}
                        </h3>
                        <p className="text-[11px] text-[#79716B] line-clamp-2 leading-relaxed">
                          {formDesc ||
                            "Mô tả danh mục sẽ hiển thị tại đây để khách hàng nắm rõ các dòng sản phẩm và tiêu chuẩn kiểm định."}
                        </p>
                        <div className="pt-2.5 border-t border-[#E6E2DC] flex items-center justify-between text-[10px] text-[#79716B] font-mono">
                          <span className="truncate max-w-[180px]">
                            {formSubtitle || "Kiểm định chuẩn hóa 100%"}
                          </span>
                          <span className="font-sans font-semibold text-[#1C1A18]">
                            Khám phá →
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Active Status Toggle */}
                  <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-[#cfc5b8]/40">
                    <div>
                      <div className="font-semibold text-[#1c1b19]">
                        Trạng Thái Niêm Yết Công Khai
                      </div>
                      <div className="text-[10px] text-[#7e766a]">
                        Hiển thị trên trang chủ, trang /categories &amp; bộ lọc sản phẩm
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
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-2.5 border-t border-[#cfc5b8]/30">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-lg bg-[#f2ede9] hover:bg-[#ece7e4] text-[#1c1b19] font-medium transition-colors cursor-pointer"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSaving || isUploadingImage}
                  className="px-5 py-2.5 rounded-lg bg-[#1c1b19] hover:bg-[#6c5937] text-white font-semibold transition-colors shadow-sm disabled:opacity-60 cursor-pointer"
                >
                  {isSaving
                    ? "Đang lưu vào DB..."
                    : editingCategory
                    ? "Lưu Cập Nhật"
                    : "Tạo Danh Mục Mới"}
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
                ? "Khi tạm dừng, danh mục này sẽ bị ẩn khỏi trang danh mục của khách hàng."
                : "Khi kích hoạt, danh mục sẽ hiển thị lại công khai trên giao diện khách hàng."}
            </p>

            <div className="flex items-center justify-center gap-2.5">
              <button
                type="button"
                onClick={() => setConfirmModalItem(null)}
                className="w-full py-2.5 rounded-lg bg-[#f2ede9] hover:bg-[#ece7e4] text-[#1c1b19] text-xs font-semibold transition-colors cursor-pointer"
              >
                Giữ Nguyên
              </button>
              <button
                type="button"
                onClick={handleConfirmToggleStatus}
                className={`w-full py-2.5 rounded-lg text-white text-xs font-semibold tracking-wider transition-colors shadow-sm cursor-pointer ${
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

      {/* MODAL 3: CONFIRM DELETE CATEGORY */}
      {deleteModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#fdf8f5] rounded-2xl max-w-md w-full p-6 shadow-2xl text-center border border-[#cfc5b8]/50 animate-scale-up">
            <div className="w-12 h-12 rounded-full mx-auto flex items-center justify-center mb-3 bg-[#ffdad6] text-[#ba1a1a]">
              <span className="material-symbols-outlined text-[28px]">delete_forever</span>
            </div>

            <h3 className="font-serif text-lg font-bold text-[#1c1b19] mb-1.5">
              Xóa Vĩnh Viễn Danh Mục?
            </h3>

            <p className="text-xs text-[#4c463c] mb-5 leading-relaxed">
              Bạn có chắc chắn muốn xóa danh mục{" "}
              <strong className="text-[#1c1b19]">{deleteModalItem.name}</strong> (
              <span className="font-mono">{deleteModalItem.slug}</span>) khỏi cơ sở dữ liệu MongoDB? Thao tác này không thể hoàn tác.
            </p>

            <div className="flex items-center justify-center gap-2.5">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeleteModalItem(null)}
                className="w-full py-2.5 rounded-lg bg-[#f2ede9] hover:bg-[#ece7e4] text-[#1c1b19] text-xs font-semibold transition-colors cursor-pointer"
              >
                Hủy Bỏ
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDeleteCategory}
                className="w-full py-2.5 rounded-lg bg-[#ba1a1a] hover:bg-[#93000a] text-white text-xs font-semibold tracking-wider transition-colors shadow-sm disabled:opacity-60 cursor-pointer"
              >
                {isDeleting ? "Đang xóa..." : "Xác Nhận Xóa"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryManagement;
