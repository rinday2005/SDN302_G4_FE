import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  getAllShopsApi,
  getShopDetailAdminApi,
  reviewShopKycApi,
  toggleUserLockApi,
  respondUserAppealApi,
  type ShopOwnerItem,
} from "../../services/admin.api";

type QuickFilterTab =
  | "ALL"
  | "ACTIVE"
  | "LOCKED"
  | "APPEALS"
  | "KYC_APPROVED"
  | "KYC_PENDING"
  | "KYC_UNVERIFIED";

export const ShopManagement: React.FC = () => {
  const [shops, setShops] = useState<ShopOwnerItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [activeTab, setActiveTab] = useState<QuickFilterTab>("ALL");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal detail
  const [inspectingShop, setInspectingShop] = useState<ShopOwnerItem | null>(null);
  const [inspectingDetail, setInspectingDetail] = useState<{
    rentProducts: Record<string, unknown>[];
    thriftListings: Record<string, unknown>[];
    recentOrders: Record<string, unknown>[];
    kycRecord?: Record<string, unknown> | null;
  } | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState<boolean>(false);
  const [detailModalTab, setDetailModalTab] = useState<"INFO" | "KYC" | "PRODUCTS">("INFO");

  // Modal Review KYC
  const [reviewingKycShop, setReviewingKycShop] = useState<ShopOwnerItem | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState<string>("");
  const [isSubmittingReview, setIsSubmittingReview] = useState<boolean>(false);
  const [showRejectForm, setShowRejectForm] = useState<boolean>(false);

  // Modal Khóa Shop
  const [lockingShop, setLockingShop] = useState<ShopOwnerItem | null>(null);
  const [lockReasonInput, setLockReasonInput] = useState<string>(
    "Tài khoản Cửa hàng bị tạm khóa để kiểm tra chất lượng sản phẩm và rà soát giao dịch"
  );
  const [isSubmittingLock, setIsSubmittingLock] = useState<boolean>(false);

  // Modal Phản hồi khiếu nại mở khóa
  const [appealShop, setAppealShop] = useState<ShopOwnerItem | null>(null);
  const [adminReplyText, setAdminReplyText] = useState<string>(
    "Ban Quản trị ReUse Hub đã xem xét hồ sơ giải trình của Cửa hàng và xác minh hợp lệ. Quyền kinh doanh và đăng bài đã được khôi phục."
  );
  const [isSubmittingAppeal, setIsSubmittingAppeal] = useState<boolean>(false);

  // Image preview modal
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  }, []);

  const copyToClipboard = (text: string, label: string) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text);
    }
    showToast(`Đã sao chép ${label} vào bộ nhớ tạm!`);
  };

  const fetchShops = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getAllShopsApi();
      setShops(data || []);
    } catch (err) {
      console.error("Lỗi khi tải danh sách Shop:", err);
      showToast("Không thể tải danh sách cửa hàng");
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    let active = true;
    getAllShopsApi()
      .then((data) => {
        if (active) setShops(data || []);
      })
      .catch((err) => {
        if (active) {
          console.error("Lỗi khi tải danh sách Shop:", err);
          showToast("Không thể tải danh sách cửa hàng");
        }
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [showToast]);

  // Metrics
  const metrics = useMemo(() => {
    const total = shops.length;
    const lockedCount = shops.filter(
      (s) => s.isLocked || s.status === "lock" || s.status === "locked"
    ).length;
    const activeCount = total - lockedCount;
    const appealsCount = shops.filter(
      (s) =>
        Boolean(s.isLocked || s.status === "lock" || s.status === "locked") &&
        Boolean(s.lockAppeal && s.lockAppeal.status === "PENDING")
    ).length;
    const approvedKyc = shops.filter((s) => s.kycStatus === "APPROVED").length;
    const pendingKyc = shops.filter((s) => s.kycStatus === "PENDING").length;
    const totalProducts = shops.reduce((acc, s) => acc + (s.totalProducts || 0), 0);

    return {
      total,
      activeCount,
      lockedCount,
      appealsCount,
      approvedKyc,
      pendingKyc,
      totalProducts,
    };
  }, [shops]);

  // Filtered Shops
  const filteredShops = useMemo(() => {
    return shops.filter((shop) => {
      const isLocked =
        Boolean(shop.isLocked) || shop.status === "lock" || shop.status === "locked";
      const hasPendingAppeal =
        isLocked && Boolean(shop.lockAppeal && shop.lockAppeal.status === "PENDING");

      // Tab filter
      if (activeTab === "ACTIVE" && isLocked) return false;
      if (activeTab === "LOCKED" && !isLocked) return false;
      if (activeTab === "APPEALS" && !hasPendingAppeal) return false;
      if (activeTab === "KYC_APPROVED" && shop.kycStatus !== "APPROVED") return false;
      if (activeTab === "KYC_PENDING" && shop.kycStatus !== "PENDING") return false;
      if (
        activeTab === "KYC_UNVERIFIED" &&
        shop.kycStatus !== null &&
        shop.kycStatus !== undefined &&
        shop.kycStatus !== "REJECTED"
      ) {
        return false;
      }

      // Search keyword
      if (searchTerm.trim() !== "") {
        const q = searchTerm.toLowerCase().trim();
        const matchName = (shop.shopProfile?.shopName || "").toLowerCase().includes(q);
        const matchOwner = (shop.fullName || "").toLowerCase().includes(q);
        const matchEmail = (shop.email || "").toLowerCase().includes(q);
        const matchPhone = (shop.phoneNumber || "").toLowerCase().includes(q);
        const matchCity = (
          shop.shopProfile?.cityRegion ||
          shop.address?.province ||
          ""
        )
          .toLowerCase()
          .includes(q);

        if (!matchName && !matchOwner && !matchEmail && !matchPhone && !matchCity) {
          return false;
        }
      }

      return true;
    });
  }, [shops, activeTab, searchTerm]);

  // Mở modal chi tiết Shop
  const handleOpenDetail = async (shop: ShopOwnerItem) => {
    setInspectingShop(shop);
    setDetailModalTab("INFO");
    setIsLoadingDetail(true);
    try {
      const res = await getShopDetailAdminApi(shop._id);
      setInspectingDetail({
        rentProducts: res.rentProducts || [],
        thriftListings: res.thriftListings || [],
        recentOrders: res.recentOrders || [],
        kycRecord: (res as unknown as { kycRecord?: Record<string, unknown> }).kycRecord || null,
      });
    } catch (err) {
      console.warn("Không thể tải chi tiết chuyên sâu của shop:", err);
      setInspectingDetail({
        rentProducts: [],
        thriftListings: [],
        recentOrders: [],
      });
    } finally {
      setIsLoadingDetail(false);
    }
  };

  // Mở khóa tài khoản Shop trực tiếp
  const handleDirectUnlock = async (shop: ShopOwnerItem) => {
    try {
      await toggleUserLockApi(shop._id, false);
      setShops((prev) =>
        prev.map((s) =>
          s._id === shop._id
            ? { ...s, status: "ACTIVE", isLocked: false, lockReason: "" }
            : s
        )
      );
      if (inspectingShop && inspectingShop._id === shop._id) {
        setInspectingShop((prev) =>
          prev ? { ...prev, status: "ACTIVE", isLocked: false, lockReason: "" } : null
        );
      }
      showToast(`Đã mở khóa tài khoản Shop "${shop.shopProfile?.shopName || shop.fullName}" thành công!`);
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { message?: string } }; message?: string };
      showToast("Lỗi mở khóa: " + (apiErr?.response?.data?.message || apiErr?.message || "Không thể mở khóa"));
    }
  };

  // Xác nhận tạm khóa tài khoản Shop
  const handleConfirmLock = async () => {
    if (!lockingShop) return;
    setIsSubmittingLock(true);
    try {
      await toggleUserLockApi(lockingShop._id, true, lockReasonInput);
      setShops((prev) =>
        prev.map((s) =>
          s._id === lockingShop._id
            ? {
              ...s,
              status: "lock",
              isLocked: true,
              lockReason: lockReasonInput,
              lockedAt: new Date().toISOString(),
              lockAppeal: null,
            }
            : s
        )
      );
      if (inspectingShop && inspectingShop._id === lockingShop._id) {
        setInspectingShop((prev) =>
          prev
            ? {
              ...prev,
              status: "lock",
              isLocked: true,
              lockReason: lockReasonInput,
              lockedAt: new Date().toISOString(),
              lockAppeal: null,
            }
            : null
        );
      }
      showToast(`Đã tạm khóa tài khoản Shop "${lockingShop.shopProfile?.shopName || lockingShop.fullName}" thành công!`);
      setLockingShop(null);
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { message?: string } }; message?: string };
      showToast("Lỗi khi khóa shop: " + (apiErr?.response?.data?.message || apiErr?.message || "Thao tác thất bại"));
    } finally {
      setIsSubmittingLock(false);
    }
  };

  // Xác nhận phản hồi khiếu nại mở khóa
  const handleConfirmAppeal = async () => {
    if (!appealShop) return;
    setIsSubmittingAppeal(true);
    try {
      await respondUserAppealApi(appealShop._id, {
        unlock: true,
        adminReply: adminReplyText,
      });

      setShops((prev) =>
        prev.map((s) =>
          s._id === appealShop._id
            ? {
              ...s,
              status: "ACTIVE",
              isLocked: false,
              lockReason: "",
              lockAppeal: {
                ...(s.lockAppeal || {}),
                status: "APPROVED",
                reply: adminReplyText,
                respondedAt: new Date().toISOString(),
              },
            }
            : s
        )
      );

      if (inspectingShop && inspectingShop._id === appealShop._id) {
        setInspectingShop((prev) =>
          prev
            ? {
              ...prev,
              status: "ACTIVE",
              isLocked: false,
              lockReason: "",
              lockAppeal: {
                ...(prev.lockAppeal || {}),
                status: "APPROVED",
                reply: adminReplyText,
                respondedAt: new Date().toISOString(),
              },
            }
            : null
        );
      }

      showToast(`Đã phê duyệt khiếu nại và mở khóa tài khoản Shop "${appealShop.shopProfile?.shopName || appealShop.fullName}"!`);
      setAppealShop(null);
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { message?: string } }; message?: string };
      showToast("Lỗi phản hồi khiếu nại: " + (apiErr?.response?.data?.message || apiErr?.message || "Thao tác thất bại"));
    } finally {
      setIsSubmittingAppeal(false);
    }
  };

  // Phê duyệt / Từ chối KYC Shop
  const handleReviewKyc = async (shopId: string, status: "APPROVED" | "REJECTED", reason?: string) => {
    setIsSubmittingReview(true);
    try {
      await reviewShopKycApi(shopId, {
        status,
        rejectionReason: reason,
      });

      setShops((prev) =>
        prev.map((s) =>
          s._id === shopId
            ? {
              ...s,
              kycStatus: status,
            }
            : s
        )
      );

      if (inspectingShop && inspectingShop._id === shopId) {
        setInspectingShop((prev) =>
          prev ? { ...prev, kycStatus: status } : null
        );
      }

      showToast(
        status === "APPROVED"
          ? "Đã phê duyệt KYC Cửa hàng thành công! Shop đã được mở quyền đăng và duyệt sản phẩm."
          : "Đã từ chối hồ sơ KYC của Cửa hàng."
      );
      setReviewingKycShop(null);
      setShowRejectForm(false);
      setRejectionReasonInput("");
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { message?: string } }; message?: string };
      showToast(apiErr?.response?.data?.message || apiErr?.message || "Lỗi khi cập nhật trạng thái KYC");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#fbf9f4] min-h-screen text-[#1c1c18]">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-[#1c1c18] text-[#fdf9f2] text-xs font-semibold px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 border border-[#ccc5bc]/20 animate-in fade-in slide-in-from-top-2">
          <span className="material-symbols-outlined text-[18px] text-[#b4c292]">info</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 p-6 lg:p-10 max-w-[1600px] w-full mx-auto space-y-8">
        {/* Header Breadcrumbs & Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#e7e2da] pb-6">
          <div>
            <div className="flex items-center gap-2 text-xs text-[#78736a] uppercase font-bold tracking-wider mb-1">
              <Link to="/admin/dashboard" className="hover:text-[#1c1c18] transition-colors">
                Bảng Điều Khiển
              </Link>
              <span>/</span>
              <span className="text-[#1c1c18]">Quản Lý Shop Owner</span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-extrabold text-[#1c1c18] tracking-tight">
              Quản Lý Tài Khoản Shop Owner &amp; Cửa Hàng
            </h1>
            <p className="text-xs text-[#78736a] mt-1 max-w-2xl">
              Hệ thống giám sát trạng thái tài khoản, khóa / mở khóa, phản hồi khiếu nại và thẩm định hồ sơ định danh KYC cho các đối tác Cửa hàng trên sàn ReUse Hub.
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={fetchShops}
              className="px-3.5 py-2 rounded-xl bg-white border border-[#e7e2da] text-xs font-semibold text-[#1c1c18] hover:bg-[#f4efe8] transition-colors shadow-xs flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">refresh</span>
              Làm mới danh sách
            </button>
            <Link
              to="/admin/users"
              className="px-3.5 py-2 rounded-xl bg-[#1c1c18] text-white text-xs font-semibold hover:bg-black transition-colors shadow-xs flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">group</span>
              Quản lý Khách hàng
            </Link>
          </div>
        </div>

        {/* Top Metrics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          <div className="bg-white p-4 rounded-2xl border border-[#e7e2da] shadow-xs">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#78736a]">Tổng Shop</div>
            <div className="text-2xl font-black text-[#1c1c18] mt-1">{metrics.total}</div>
            <div className="text-[10px] text-[#78736a] mt-0.5">Tài khoản đối tác</div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-xs bg-gradient-to-br from-white to-emerald-50/30">
            <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">Đang hoạt động</div>
            <div className="text-2xl font-black text-emerald-700 mt-1">{metrics.activeCount}</div>
            <div className="text-[10px] text-emerald-700 mt-0.5">Quyền truy cập mở</div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-rose-100 shadow-xs bg-gradient-to-br from-white to-rose-50/30">
            <div className="text-[11px] font-bold uppercase tracking-wider text-rose-800">Đã tạm khóa</div>
            <div className="text-2xl font-black text-rose-700 mt-1">{metrics.lockedCount}</div>
            <div className="text-[10px] text-rose-700 mt-0.5">Bị dừng kinh doanh</div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-amber-100 shadow-xs bg-gradient-to-br from-white to-amber-50/30">
            <div className="text-[11px] font-bold uppercase tracking-wider text-amber-800">Đơn khiếu nại</div>
            <div className="text-2xl font-black text-amber-700 mt-1">{metrics.appealsCount}</div>
            <div className="text-[10px] text-amber-700 mt-0.5">Chờ admin phản hồi</div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-[#e7e2da] shadow-xs">
            <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">Đã duyệt KYC</div>
            <div className="text-2xl font-black text-emerald-700 mt-1">{metrics.approvedKyc}</div>
            <div className="text-[10px] text-emerald-700 mt-0.5">Được phép CRUD hàng</div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-[#e7e2da] shadow-xs">
            <div className="text-[11px] font-bold uppercase tracking-wider text-amber-800">Chờ duyệt KYC</div>
            <div className="text-2xl font-black text-amber-700 mt-1">{metrics.pendingKyc}</div>
            <div className="text-[10px] text-amber-700 mt-0.5">Cần thẩm định CCCD</div>
          </div>
        </div>

        {/* Filter Tabs & Search Bar */}
        <div className="bg-white p-4 rounded-2xl border border-[#e7e2da] shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Quick Filter Tabs */}
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: "ALL", label: "Tất cả", count: metrics.total },
                { id: "ACTIVE", label: "Đang hoạt động", count: metrics.activeCount },
                { id: "LOCKED", label: "Đã tạm khóa", count: metrics.lockedCount },
                { id: "APPEALS", label: "Có khiếu nại", count: metrics.appealsCount, highlight: metrics.appealsCount > 0 },
                { id: "KYC_APPROVED", label: "Đã duyệt KYC", count: metrics.approvedKyc },
                { id: "KYC_PENDING", label: "Chờ duyệt KYC", count: metrics.pendingKyc, highlight: metrics.pendingKyc > 0 },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as QuickFilterTab)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${activeTab === tab.id
                      ? "bg-[#1c1c18] text-white shadow-xs"
                      : "bg-[#f4efe8] text-[#5e5a53] hover:bg-[#e7e2da] hover:text-[#1c1c18]"
                    }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] ${activeTab === tab.id
                        ? "bg-white/20 text-white"
                        : tab.highlight
                          ? "bg-amber-200 text-amber-900 font-extrabold"
                          : "bg-white text-[#78736a]"
                      }`}
                  >
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative min-w-[280px]">
              <span className="material-symbols-outlined absolute left-3 top-2.5 text-[#78736a] text-[18px]">
                search
              </span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm tên shop, chủ shop, email, SĐT..."
                className="w-full pl-9 pr-8 py-2 bg-[#f4efe8] border border-transparent rounded-xl text-xs text-[#1c1c18] placeholder:text-[#78736a] focus:bg-white focus:border-[#1c1c18] focus:outline-none transition-colors"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-2.5 top-2.5 text-[#78736a] hover:text-[#1c1c18]"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Main Shops Table */}
        <div className="bg-white rounded-2xl border border-[#e7e2da] shadow-xs overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center text-xs text-[#78736a] space-y-2">
              <div className="w-6 h-6 border-2 border-[#1c1c18] border-t-transparent rounded-full animate-spin mx-auto" />
              <p>Đang tải danh sách tài khoản Shop Owner...</p>
            </div>
          ) : filteredShops.length === 0 ? (
            <div className="p-12 text-center text-xs text-[#78736a] space-y-2">
              <span className="material-symbols-outlined text-[36px] text-[#ccc5bc]">storefront</span>
              <p className="font-semibold text-sm text-[#1c1c18]">Không tìm thấy Cửa hàng nào</p>
              <p>Thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#fcfbf9] border-b border-[#e7e2da] text-[#78736a] text-[10px] uppercase font-bold tracking-wider">
                    <th className="py-3.5 px-4">Cửa Hàng / Chủ Sở Hữu</th>
                    <th className="py-3.5 px-4">Kho Hàng &amp; Địa Chỉ</th>
                    <th className="py-3.5 px-4 text-center">Trạng Thái Tài Khoản</th>
                    <th className="py-3.5 px-4 text-center">Xác Thực KYC</th>
                    <th className="py-3.5 px-4 text-center">Sản Phẩm</th>
                    <th className="py-3.5 px-4 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e7e2da]/70">
                  {filteredShops.map((shop) => {
                    const isLocked =
                      Boolean(shop.isLocked) ||
                      shop.status === "lock" ||
                      shop.status === "locked" ||
                      shop.status === "SUSPENDED";
                    const hasPendingAppeal =
                      isLocked &&
                      Boolean(shop.lockAppeal && shop.lockAppeal.status === "PENDING");
                    const shopName =
                      shop.shopProfile?.shopName || shop.fullName || "Shop Đối Tác";
                    const avatarLetter = (shopName || "SO").slice(0, 2).toUpperCase();

                    return (
                      <tr
                        key={shop._id}
                        className={`hover:bg-[#faf7f2] transition-colors ${hasPendingAppeal ? "bg-amber-50/40" : isLocked ? "bg-rose-50/20" : ""
                          }`}
                      >
                        {/* Shop & Owner */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-[#1c1c18] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                              {avatarLetter}
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-[#1c1c18] text-sm truncate flex items-center gap-1.5">
                                <span>{shopName}</span>
                                <button
                                  type="button"
                                  onClick={() => copyToClipboard(shop._id, "Mã ID Shop")}
                                  title="Sao chép ID"
                                  className="text-[#78736a] hover:text-[#1c1c18]"
                                >
                                  <span className="material-symbols-outlined text-[13px]">content_copy</span>
                                </button>
                              </div>
                              <div className="text-[11px] text-[#78736a] truncate">
                                Chủ shop: <span className="text-[#1c1c18] font-medium">{shop.fullName || "Chưa cập nhật"}</span>
                              </div>
                              <div className="text-[11px] text-[#78736a] truncate">
                                {shop.email} • {shop.phoneNumber || "Chưa có SĐT"}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Location */}
                        <td className="py-3.5 px-4">
                          <div className="space-y-0.5">
                            <div className="font-semibold text-[#1c1c18] flex items-center gap-1">
                              <span className="material-symbols-outlined text-[14px] text-[#78736a]">
                                location_on
                              </span>
                              <span>
                                {shop.shopProfile?.cityRegion || shop.address?.province || "Toàn quốc"}
                              </span>
                            </div>
                            <div className="text-[11px] text-[#78736a] truncate max-w-xs">
                              {shop.shopProfile?.businessAddress || shop.address?.detail || "Địa chỉ kinh doanh cơ sở"}
                            </div>
                          </div>
                        </td>

                        {/* Account Status */}
                        <td className="py-3.5 px-4 text-center">
                          {hasPendingAppeal ? (
                            <div className="inline-flex flex-col items-center gap-0.5">
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">
                                <span className="material-symbols-outlined text-[12px]">announcement</span>
                                Có đơn khiếu nại
                              </span>
                              <span className="text-[9px] text-amber-800">Chờ mở khóa</span>
                            </div>
                          ) : isLocked ? (
                            <div className="inline-flex flex-col items-center gap-0.5">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                                <span className="material-symbols-outlined text-[12px]">lock</span>
                                Đã khóa tài khoản
                              </span>
                              {shop.lockReason && (
                                <span className="text-[9px] text-[#78736a] max-w-[140px] truncate" title={shop.lockReason}>
                                  {shop.lockReason}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                              Đang hoạt động
                            </span>
                          )}
                        </td>

                        {/* KYC Status */}
                        <td className="py-3.5 px-4 text-center">
                          {shop.kycStatus === "APPROVED" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              <span className="material-symbols-outlined text-[12px]">verified</span>
                              Đã xác minh KYC
                            </span>
                          ) : shop.kycStatus === "PENDING" ? (
                            <button
                              type="button"
                              onClick={() => {
                                setReviewingKycShop(shop);
                                setShowRejectForm(false);
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200 transition-colors cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-[12px]">pending_actions</span>
                              Chờ duyệt KYC
                            </button>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-700">
                              Chưa xác minh
                            </span>
                          )}
                        </td>

                        {/* Products */}
                        <td className="py-3.5 px-4 text-center">
                          <div className="font-bold text-[#1c1c18]">
                            {shop.totalProducts ?? (shop.totalRentProducts || 0) + (shop.totalThriftProducts || 0)}
                          </div>
                          <div className="text-[10px] text-[#78736a]">
                            RENT: {shop.totalRentProducts || 0} • THRIFT: {shop.totalThriftProducts || 0}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Nút Phản hồi khiếu nại (nếu có khiếu nại) */}
                            {hasPendingAppeal && (
                              <button
                                type="button"
                                onClick={() => setAppealShop(shop)}
                                className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold transition-all shadow-xs flex items-center gap-1"
                                title="Xem giải trình & mở khóa"
                              >
                                <span className="material-symbols-outlined text-[14px]">support_agent</span>
                                Phản hồi khiếu nại
                              </button>
                            )}

                            {/* Nút Chi Tiết */}
                            <button
                              type="button"
                              onClick={() => handleOpenDetail(shop)}
                              className="px-2.5 py-1 rounded-lg bg-[#f4efe8] hover:bg-[#e7e2da] text-[#1c1c18] text-[11px] font-bold transition-colors"
                            >
                              Chi Tiết
                            </button>

                            {/* Nút Khóa / Mở khóa */}
                            {isLocked ? (
                              <button
                                type="button"
                                onClick={() => handleDirectUnlock(shop)}
                                className="px-2.5 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] font-bold transition-colors flex items-center gap-1 shadow-xs"
                                title="Mở khóa quyền truy cập"
                              >
                                <span className="material-symbols-outlined text-[14px]">lock_open</span>
                                Mở khóa
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  setLockingShop(shop);
                                  setLockReasonInput("Tài khoản Cửa hàng bị tạm khóa để kiểm tra chất lượng sản phẩm và rà soát giao dịch");
                                }}
                                className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[11px] font-bold transition-colors flex items-center gap-1"
                                title="Tạm khóa quyền hoạt động của shop"
                              >
                                <span className="material-symbols-outlined text-[14px]">lock</span>
                                Tạm khóa
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* ========================================================================= */}
      {/* MODAL 1: CHI TIẾT CỬA HÀNG (SHOP DETAIL DRAWER) */}
      {/* ========================================================================= */}
      {inspectingShop && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-[#e7e2da]">
            {/* Header */}
            <div className="p-6 bg-[#fcfbf9] border-b border-[#e7e2da] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#1c1c18] text-white flex items-center justify-center text-lg font-bold shadow-xs">
                  {(inspectingShop.shopProfile?.shopName || inspectingShop.fullName || "SO").slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-extrabold text-lg text-[#1c1c18]">
                    {inspectingShop.shopProfile?.shopName || inspectingShop.fullName || "Chi tiết Cửa hàng"}
                  </h3>
                  <p className="text-xs text-[#78736a]">
                    ID Shop: <span className="font-mono text-[#1c1c18]">{inspectingShop._id}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInspectingShop(null)}
                className="w-8 h-8 rounded-full bg-[#f4efe8] hover:bg-[#e7e2da] flex items-center justify-center text-[#1c1c18]"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {/* Modal Navigation Tabs */}
            <div className="flex border-b border-[#e7e2da] px-6 bg-[#fcfbf9] gap-4 text-xs font-bold">
              <button
                type="button"
                onClick={() => setDetailModalTab("INFO")}
                className={`py-3 border-b-2 transition-all ${detailModalTab === "INFO"
                    ? "border-[#1c1c18] text-[#1c1c18]"
                    : "border-transparent text-[#78736a] hover:text-[#1c1c18]"
                  }`}
              >
                Hồ Sơ &amp; Trạng Thái
              </button>
              <button
                type="button"
                onClick={() => setDetailModalTab("KYC")}
                className={`py-3 border-b-2 transition-all flex items-center gap-1.5 ${detailModalTab === "KYC"
                    ? "border-[#1c1c18] text-[#1c1c18]"
                    : "border-transparent text-[#78736a] hover:text-[#1c1c18]"
                  }`}
              >
                Giấy Tờ KYC (CCCD)
                {inspectingShop.kycStatus === "APPROVED" && (
                  <span className="material-symbols-outlined text-[14px] text-emerald-700">verified</span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setDetailModalTab("PRODUCTS")}
                className={`py-3 border-b-2 transition-all ${detailModalTab === "PRODUCTS"
                    ? "border-[#1c1c18] text-[#1c1c18]"
                    : "border-transparent text-[#78736a] hover:text-[#1c1c18]"
                  }`}
              >
                Sản Phẩm ({inspectingDetail ? inspectingDetail.rentProducts.length + inspectingDetail.thriftListings.length : inspectingShop.totalProducts || 0})
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
              {isLoadingDetail ? (
                <div className="py-12 text-center text-[#78736a]">
                  <div className="w-6 h-6 border-2 border-[#1c1c18] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  Đang tải thông tin chuyên sâu của Cửa hàng...
                </div>
              ) : detailModalTab === "INFO" ? (
                <div className="space-y-5">
                  {/* Account Status Alert */}
                  {(inspectingShop.isLocked || inspectingShop.status === "lock" || inspectingShop.status === "locked") && (
                    <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 space-y-1">
                      <div className="font-bold flex items-center gap-1.5 text-sm">
                        <span className="material-symbols-outlined text-[18px]">lock</span>
                        Tài khoản Shop đang bị TẠM KHÓA
                      </div>
                      <p className="text-xs text-rose-800">
                        Lý do: <strong>{inspectingShop.lockReason || "Không có lý do cụ thể"}</strong>
                      </p>
                      {inspectingShop.lockedAt && (
                        <p className="text-[11px] text-rose-700">
                          Thời điểm khóa: {new Date(inspectingShop.lockedAt).toLocaleString("vi-VN")}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Appeal info if any */}
                  {inspectingShop.lockAppeal && inspectingShop.lockAppeal.status === "PENDING" && (
                    <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 space-y-2">
                      <div className="font-bold flex items-center gap-1.5 text-sm">
                        <span className="material-symbols-outlined text-[18px]">announcement</span>
                        Cửa hàng đã gửi Đơn khiếu nại mở khóa
                      </div>
                      <p className="p-3 bg-white rounded-lg border border-amber-200 italic">
                        &quot;{inspectingShop.lockAppeal.question}&quot;
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setAppealShop(inspectingShop);
                          setInspectingShop(null);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-amber-800 text-white font-bold hover:bg-amber-900 transition-colors"
                      >
                        Mở form phản hồi &amp; Mở khóa
                      </button>
                    </div>
                  )}

                  {/* Grid thông tin */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 bg-[#fcfbf9] rounded-xl border border-[#e7e2da] space-y-2">
                      <span className="text-[10px] font-bold uppercase text-[#78736a]">Thông tin Người Đại Diện</span>
                      <div><strong>Họ và tên:</strong> {inspectingShop.fullName || "Chưa cập nhật"}</div>
                      <div><strong>Email đăng nhập:</strong> {inspectingShop.email}</div>
                      <div><strong>Số điện thoại:</strong> {inspectingShop.phoneNumber || "Chưa cập nhật"}</div>
                      <div><strong>Vai trò:</strong> SHOP_OWNER</div>
                    </div>
                    <div className="p-4 bg-[#fcfbf9] rounded-xl border border-[#e7e2da] space-y-2">
                      <span className="text-[10px] font-bold uppercase text-[#78736a]">Hồ sơ Cửa Hàng</span>
                      <div><strong>Tên Shop:</strong> {inspectingShop.shopProfile?.shopName || inspectingShop.fullName}</div>
                      <div><strong>Địa chỉ kho:</strong> {inspectingShop.shopProfile?.businessAddress || inspectingShop.address?.detail || "Chưa cập nhật"}</div>
                      <div><strong>Khu vực:</strong> {inspectingShop.shopProfile?.cityRegion || inspectingShop.address?.province || "Toàn quốc"}</div>
                      <div><strong>Năm thành lập:</strong> {inspectingShop.shopProfile?.establishedYear || 2024}</div>
                    </div>
                  </div>

                  {/* Mô tả */}
                  <div className="p-4 bg-[#fcfbf9] rounded-xl border border-[#e7e2da] space-y-1.5">
                    <span className="text-[10px] font-bold uppercase text-[#78736a]">Mô Tả &amp; Chuyên Môn</span>
                    <p className="text-gray-700 leading-relaxed">
                      {inspectingShop.shopProfile?.description || inspectingShop.shopProfile?.specialization || "Chưa có mô tả cửa hàng."}
                    </p>
                  </div>
                </div>
              ) : detailModalTab === "KYC" ? (
                <div className="space-y-5">
                  <div className="flex items-center justify-between p-3.5 bg-[#fcfbf9] rounded-xl border border-[#e7e2da]">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-[#78736a] block">Trạng thái hồ sơ KYC</span>
                      <strong className="text-sm">
                        {inspectingShop.kycStatus === "APPROVED"
                          ? "Đã phê duyệt (Đạt tiêu chuẩn ReUse Standard)"
                          : inspectingShop.kycStatus === "PENDING"
                            ? "Đang chờ Admin phê duyệt hồ sơ"
                            : "Chưa hoàn tất xác thực"}
                      </strong>
                    </div>
                    {inspectingShop.kycStatus === "PENDING" && (
                      <button
                        type="button"
                        onClick={() => {
                          setReviewingKycShop(inspectingShop);
                          setShowRejectForm(false);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-emerald-700 text-white font-bold hover:bg-emerald-800 transition-colors"
                      >
                        Phê duyệt / Từ chối
                      </button>
                    )}
                  </div>

                  {/* CCCD Image Preview */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-3 bg-[#fcfbf9] rounded-xl border border-[#e7e2da] space-y-2">
                      <span className="font-bold text-[11px] block">Mặt trước CCCD / Giấy tờ pháp lý:</span>
                      <div className="aspect-[16/10] bg-gray-100 rounded-lg overflow-hidden border border-[#e7e2da] relative group">
                        {inspectingDetail?.kycRecord?.frontImageUrl ? (
                          <img
                            src={String(inspectingDetail.kycRecord.frontImageUrl)}
                            alt="Mặt trước CCCD"
                            className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                            onClick={() => setPreviewImageUrl(String(inspectingDetail?.kycRecord?.frontImageUrl))}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[#78736a]">
                            Chưa có ảnh mặt trước
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="p-3 bg-[#fcfbf9] rounded-xl border border-[#e7e2da] space-y-2">
                      <span className="font-bold text-[11px] block">Mặt sau CCCD / Thẻ định danh:</span>
                      <div className="aspect-[16/10] bg-gray-100 rounded-lg overflow-hidden border border-[#e7e2da] relative group">
                        {inspectingDetail?.kycRecord?.backImageUrl ? (
                          <img
                            src={String(inspectingDetail.kycRecord.backImageUrl)}
                            alt="Mặt sau CCCD"
                            className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                            onClick={() => setPreviewImageUrl(String(inspectingDetail?.kycRecord?.backImageUrl))}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[#78736a]">
                            Chưa có ảnh mặt sau
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* KYC Data */}
                  {inspectingDetail?.kycRecord && (
                    <div className="p-4 bg-[#fcfbf9] rounded-xl border border-[#e7e2da] space-y-2">
                      <div><strong>Số CCCD:</strong> {String(inspectingDetail.kycRecord.idCardNumber || "Chưa có")}</div>
                      <div><strong>Họ tên trên CCCD:</strong> {String(inspectingDetail.kycRecord.fullName || inspectingShop.fullName || "")}</div>
                      <div><strong>Địa chỉ thường trú:</strong> {String(inspectingDetail.kycRecord.residentAddress || "Chưa có")}</div>
                      <div><strong>Ngày sinh:</strong> {String(inspectingDetail.kycRecord.dob || "Chưa có")}</div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#1c1c18]">Danh sách sản phẩm thuộc Shop:</span>
                    <span className="text-[#78736a]">
                      Tổng {((inspectingDetail?.rentProducts?.length || 0) + (inspectingDetail?.thriftListings?.length || 0))} sản phẩm
                    </span>
                  </div>

                  {/* Rent Products */}
                  <div className="space-y-2">
                    <span className="font-bold text-[11px] text-[#576151] uppercase tracking-wider block">
                      1. Đồ cho thuê RENT ({inspectingDetail?.rentProducts?.length || 0})
                    </span>
                    {inspectingDetail && inspectingDetail.rentProducts.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {inspectingDetail.rentProducts.map((p, idx) => (
                          <div key={idx} className="p-3 bg-[#fcfbf9] rounded-xl border border-[#e7e2da] flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-gray-200 overflow-hidden shrink-0">
                              {Array.isArray((p as { images?: string[] }).images) && (p as { images?: string[] }).images?.[0] ? (
                                <img src={(p as { images?: string[] }).images?.[0]} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-[10px]">Ảnh</div>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <h5 className="font-bold truncate text-[#1c1c18]">{(p as { name?: string }).name}</h5>
                              <div className="text-[10px] text-[#78736a]">
                                Giá thuê: {Number((p as { pricePerDay?: number }).pricePerDay || 0).toLocaleString()}₫/ngày
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[#78736a] italic">Shop chưa đăng đồ cho thuê RENT nào.</p>
                    )}
                  </div>

                  {/* Thrift Listings */}
                  <div className="space-y-2 pt-2 border-t border-[#e7e2da]">
                    <span className="font-bold text-[11px] text-[#7b5227] uppercase tracking-wider block">
                      2. Đồ thanh lý THRIFT ({inspectingDetail?.thriftListings?.length || 0})
                    </span>
                    {inspectingDetail && inspectingDetail.thriftListings.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {inspectingDetail.thriftListings.map((t, idx) => (
                          <div key={idx} className="p-3 bg-[#fcfbf9] rounded-xl border border-[#e7e2da] flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-gray-200 overflow-hidden shrink-0">
                              {Array.isArray((t as { images?: string[] }).images) && (t as { images?: string[] }).images?.[0] ? (
                                <img src={(t as { images?: string[] }).images?.[0]} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-[10px]">Ảnh</div>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <h5 className="font-bold truncate text-[#1c1c18]">{(t as { name?: string }).name}</h5>
                              <div className="text-[10px] text-[#78736a]">
                                Giá bán đứt: {Number((t as { price?: number }).price || 0).toLocaleString()}₫
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[#78736a] italic">Shop chưa có bài đăng thanh lý THRIFT nào.</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-[#fcfbf9] border-t border-[#e7e2da] flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setInspectingShop(null)}
                className="px-4 py-2 rounded-xl bg-white border border-[#e7e2da] text-xs font-bold text-[#1c1c18] hover:bg-[#f4efe8]"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: TẠM KHÓA TÀI KHOẢN SHOP (LOCK SHOP MODAL) */}
      {/* ========================================================================= */}
      {lockingShop && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-rose-200 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-[28px]">lock</span>
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-extrabold text-lg text-[#1c1c18]">Tạm khóa Tài Khoản Cửa Hàng</h3>
              <p className="text-xs text-[#78736a]">
                Khóa tài khoản của <strong>{lockingShop.shopProfile?.shopName || lockingShop.fullName}</strong> ({lockingShop.email}). Shop sẽ không thể đăng sản phẩm mới hoặc thực hiện giao dịch.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#1c1c18]">Lý do tạm khóa:</label>
              <textarea
                rows={3}
                value={lockReasonInput}
                onChange={(e) => setLockReasonInput(e.target.value)}
                className="w-full p-3 rounded-xl border border-[#e7e2da] text-xs focus:outline-none focus:border-rose-500 bg-[#fcfbf9]"
                placeholder="Nhập lý do tạm khóa cửa hàng..."
              />
              <div className="flex flex-wrap gap-1.5 pt-1">
                {[
                  "Vi phạm quy chế hàng hóa",
                  "Sản phẩm không rõ xuất xứ",
                  "Nghi vấn gian lận cọc Smart Escrow",
                  "Nhiều khiếu nại chưa xử lý",
                ].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setLockReasonInput(preset)}
                    className="text-[10px] px-2 py-0.5 rounded-md bg-[#f4efe8] hover:bg-[#e7e2da] text-[#5e5a53]"
                  >
                    + {preset}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                disabled={isSubmittingLock}
                onClick={() => setLockingShop(null)}
                className="flex-1 py-2.5 rounded-xl border border-[#e7e2da] text-xs font-bold text-[#1c1c18] hover:bg-[#f4efe8]"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={isSubmittingLock}
                onClick={handleConfirmLock}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-1.5"
              >
                {isSubmittingLock ? "Đang khóa..." : "Xác nhận khóa Shop"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: PHẢN HỒI KHIẾU NẠI MỞ KHÓA (APPEAL MODAL) */}
      {/* ========================================================================= */}
      {appealShop && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-amber-200 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-[28px]">support_agent</span>
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-extrabold text-lg text-[#1c1c18]">Phản Hồi Khiếu Nại &amp; Mở Khóa Shop</h3>
              <p className="text-xs text-[#78736a]">
                Xem xét giải trình mở khóa của <strong>{appealShop.shopProfile?.shopName || appealShop.fullName}</strong>
              </p>
            </div>

            {/* Lý do bị khóa */}
            <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-xs text-rose-900">
              <span className="font-bold">Lý do từng bị khóa:</span> {appealShop.lockReason || "Rà soát an toàn"}
            </div>

            {/* Nội dung khiếu nại của shop */}
            <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-950 space-y-1">
              <span className="font-bold flex items-center gap-1">
                <span className="material-symbols-outlined text-[15px]">mail</span>
                Giải trình từ Shop Owner:
              </span>
              <p className="italic bg-white/80 p-2.5 rounded-lg border border-amber-200">
                &quot;{appealShop.lockAppeal?.question || "Kính gửi Ban Quản trị ReUse Hub, chúng tôi đã khắc phục và kiểm tra lại toàn bộ quy trình, kính đề nghị mở lại quyền hoạt động cho shop."}&quot;
              </p>
            </div>

            {/* Nội dung phản hồi từ Admin */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#1c1c18]">Phản hồi của Ban Quản trị:</label>
              <textarea
                rows={3}
                value={adminReplyText}
                onChange={(e) => setAdminReplyText(e.target.value)}
                className="w-full p-3 rounded-xl border border-[#e7e2da] text-xs focus:outline-none focus:border-amber-600 bg-[#fcfbf9]"
                placeholder="Nhập nội dung phản hồi chính thức tới shop..."
              />
            </div>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                disabled={isSubmittingAppeal}
                onClick={() => setAppealShop(null)}
                className="flex-1 py-2.5 rounded-xl border border-[#e7e2da] text-xs font-bold text-[#1c1c18] hover:bg-[#f4efe8]"
              >
                Đóng
              </button>
              <button
                type="button"
                disabled={isSubmittingAppeal}
                onClick={handleConfirmAppeal}
                className="flex-1 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-1.5"
              >
                {isSubmittingAppeal ? "Đang xử lý..." : "Mở khóa & Gửi phản hồi"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: PHÊ DUYỆT / TỪ CHỐI KYC (REVIEW KYC MODAL) */}
      {/* ========================================================================= */}
      {reviewingKycShop && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#e7e2da] space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-[28px]">verified_user</span>
            </div>
            <div className="text-center space-y-1">
              <h3 className="font-extrabold text-lg text-[#1c1c18]">Thẩm Định Hồ Sơ KYC Cửa Hàng</h3>
              <p className="text-xs text-[#78736a]">
                Xác thực định danh pháp lý cho <strong>{reviewingKycShop.shopProfile?.shopName || reviewingKycShop.fullName}</strong>
              </p>
            </div>

            {showRejectForm ? (
              <div className="space-y-2">
                <label className="block text-xs font-bold text-[#1c1c18]">Lý do từ chối hồ sơ KYC:</label>
                <textarea
                  rows={3}
                  value={rejectionReasonInput}
                  onChange={(e) => setRejectionReasonInput(e.target.value)}
                  placeholder="Ví dụ: Ảnh chụp CCCD bị mờ, không rõ số hoặc địa chỉ không trùng khớp..."
                  className="w-full p-3 rounded-xl border border-rose-300 text-xs focus:outline-none focus:border-rose-500 bg-[#fcfbf9]"
                />
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowRejectForm(false)}
                    className="flex-1 py-2 rounded-xl border border-[#e7e2da] text-xs font-bold text-[#1c1c18]"
                  >
                    Quay lại
                  </button>
                  <button
                    type="button"
                    disabled={isSubmittingReview || !rejectionReasonInput.trim()}
                    onClick={() => handleReviewKyc(reviewingKycShop._id, "REJECTED", rejectionReasonInput)}
                    className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold disabled:opacity-50"
                  >
                    Xác nhận từ chối
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-3.5 bg-[#fcfbf9] rounded-xl border border-[#e7e2da] text-xs space-y-1">
                  <div><strong>Chủ sở hữu:</strong> {reviewingKycShop.fullName}</div>
                  <div><strong>Email:</strong> {reviewingKycShop.email}</div>
                  <div><strong>Khu vực:</strong> {reviewingKycShop.shopProfile?.cityRegion || reviewingKycShop.address?.province || "Đà Nẵng"}</div>
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    disabled={isSubmittingReview}
                    onClick={() => setShowRejectForm(true)}
                    className="flex-1 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-colors"
                  >
                    Từ chối KYC
                  </button>
                  <button
                    type="button"
                    disabled={isSubmittingReview}
                    onClick={() => handleReviewKyc(reviewingKycShop._id, "APPROVED")}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-colors shadow-xs"
                  >
                    Phê duyệt KYC
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setReviewingKycShop(null)}
                  className="w-full py-2 text-center text-xs text-[#78736a] hover:text-[#1c1c18]"
                >
                  Đóng
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: ẢNH PREVIEW PHÓNG TO */}
      {/* ========================================================================= */}
      {previewImageUrl && (
        <div
          className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4 cursor-pointer animate-in fade-in"
          onClick={() => setPreviewImageUrl(null)}
        >
          <div className="max-w-3xl max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl relative">
            <img src={previewImageUrl} alt="Preview" className="w-full h-full object-contain" />
            <button
              type="button"
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black"
              onClick={() => setPreviewImageUrl(null)}
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShopManagement;
