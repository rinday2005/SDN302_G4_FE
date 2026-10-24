import React, { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { fetchAdminDashboardData } from "../../services/admin.api";

export type RentReviewStatus = "PENDING" | "APPROVED" | "REJECTED";

interface DossierImage {
  url: string;
  label: string;
  tag: string;
  alt: string;
}

interface UnitInventory {
  serial: string;
  shutterCount: number;
  firmware: string;
  calibration: string;
  status: "READY" | "CALIBRATING";
  statusText: string;
}

interface RentDossierData {
  id: string;
  sku: string;
  title: string;
  categoryPrimary: string;
  categorySecondary: string;
  conditionGrade: string;
  submittedAt: string;
  assetNode: string;
  certification: string;
  descriptionPara1: string;
  descriptionPara2: string;
  pricePerDay: number;
  priceStandardRange: string;
  depositAmount: number;
  depositNote: string;
  minDays: number;
  maxDays: number;
  advanceNoticeHours: number;
  replacementValuation: number;
  insuranceCarrier: string;
  logisticsMethod: string;
  logisticsTrack: string;
  shopName: string;
  shopCode: string;
  shopAvatarInitials: string;
  legalRepresentative: string;
  shopRating: number;
  cleanOrdersCount: number;
  disputeRate: string;
  depositReturnRate: string;
  warehouseLocation: string;
  fleetUnits: UnitInventory[];
  images: DossierImage[];
}

const DEFAULT_DOSSIER: RentDossierData = {
  id: "rent-2",
  sku: "#HB-RNT-50CM",
  title: "Hasselblad 907X 50C & CFV II 50C Digital Back + 45mm f/4 P Lens Kit",
  categoryPrimary: "Máy ảnh & Quang học",
  categorySecondary: "Medium Format Digital",
  conditionGrade: "Collector Pristine (Grade A+)",
  submittedAt: "Hôm nay, 09:40 ICT (2h trước)",
  assetNode: "#SGN-02 (Central Vault)",
  certification: "B-Corp Circular Standard Tier-1",
  descriptionPara1:
    "Hệ thống medium format kỹ thuật số mô-đun kết hợp ngôn ngữ công thái học cổ điển dòng SWC lừng danh cùng cảm biến CMOS 50 megapixel (kích thước 43.8 × 32.9mm) mang lại dải tần nhạy sáng 14 stops và độ sâu màu 16-bit Hasselblad Natural Colour Solution (HNCS).",
  descriptionPara2:
    "Trọn bộ bàn giao gồm có: Thân máy 907X siêu mỏng, Lưng kỹ thuật số CFV II 50C với màn hình lật nghiêng cảm ứng 3.2 inch, Ống kính góc rộng pancake XCD 45mm f/4 P có lá màn trập tích hợp đồng bộ đèn flash lên tới 1/2000s, 02 pin chính hãng 3400mAh, cốc sạc đôi USB-C, nắp bảo vệ ngàm kép và va li cứng Pelican 1400 chống nước đệm mút định hình chuyên dụng. Thiết bị đã được căn chỉnh tâm quang học trên máy chuẩn trực (Collimator rig) tại xưởng Kyoto Archival.",
  pricePerDay: 450000,
  priceStandardRange: "420k - 500k ₫",
  depositAmount: 12000000,
  depositNote: "Khóa tạm thời qua cổng thanh toán bảo hộ Smart Escrow",
  minDays: 2,
  maxDays: 30,
  advanceNoticeHours: 48,
  replacementValuation: 145000000,
  insuranceCarrier: "Bảo hiểm Lloyd's Re",
  logisticsMethod: "Insured White-Glove",
  logisticsTrack: "Zero-Drop Tracked",
  shopName: "Kyoto Archival Optics",
  shopCode: "#SHP-0418",
  shopAvatarInitials: "KA",
  legalRepresentative: "Vũ Thanh Tùng",
  shopRating: 4.98,
  cleanOrdersCount: 184,
  disputeRate: "0.00% (Hoàn hảo)",
  depositReturnRate: "99.4%",
  warehouseLocation: "Kyoto Archival Optics Hub, Q.1, TP. HCM",
  fleetUnits: [
    {
      serial: "Serial HB-907X-20491",
      shutterCount: 2410,
      firmware: "v1.4.0",
      calibration: "Đạt chuẩn 100%",
      status: "READY",
      statusText: "SẴN SÀNG CHO THUÊ",
    },
    {
      serial: "Serial HB-907X-20492",
      shutterCount: 8190,
      firmware: "v1.3.8",
      calibration: "Đang kiểm định chuẩn trực sau chu kỳ thuê 15 ngày",
      status: "CALIBRATING",
      statusText: "ĐANG HIỆU CHUẨN XƯỞNG",
    },
  ],
  images: [
    {
      url: "https://lh3.googleusercontent.com/aida-public/AB6AXuA9qcfSk5gravjBPHNSwY5AuIUVvXa8o2HBA3fE6E4438oVIcozLhy2KS1pfu2ka2WOMoY03iupDA2C4MhY1P0vujDCq0Nup83sIrsikEnLNd8e8QOZ65oNpKujGrhEOUhHPtuOAhEh7b7DtyWrLLBDrYqR7-VpivoXgspnc99Yco-tNUwNUDN8lxlHfDRqWPVCFHzfGwrVdiHtbGXFImIFvUEpnHbLX_KPPzapvVre",
      label: "Khung Toàn Cảnh: Hasselblad 907X 50C & CFV II 50C Kit (Primary Benchmark)",
      tag: "Benchmark",
      alt: "Editorial crisp still life photograph of Hasselblad 907X 50C and CFV II 50C modular medium format camera body with 45mm lens mounted on an archival workbench with natural soft parchment morning light and wooden calipers nearby.",
    },
    {
      url: "https://lh3.googleusercontent.com/aida-public/AB6AXuCOd7IyPuEhh-eGrq8nW9sAxlABAjvj0tpNuO4iHowsdRF3VirBuUOgOPk0ET7sL6i77Gv2ihM5GJiwDdOIW7QjKGnKP6uX4bnHauOVkFEYSXbfnT0GGAIw3cPVwum59n1niXeXYGWiz7IRUU2ECEQt8PcrrjOAG_3sb0nJoRWYTRvnQCxXTLiOtzG8nDce8RC77wDorgHgaqK8AgQxSCqX0goC8QHSi2ItAr46LJ58",
      label: "Cảm biến 50MP Medium Format CMOS sạch 100% không tì vết",
      tag: "Sensor View",
      alt: "Macro close-up inspection shot of the immaculate medium format Hasselblad 50MP CMOS sensor without dust or micro-abrasions under clean room inspection light.",
    },
    {
      url: "https://lh3.googleusercontent.com/aida-public/AB6AXuB927qilaRTq3VTz4mXE_oWf8h0nWpsHjSZ8l0Nn_1tSj7W3wZ9SH3MoxWh73u1gCQ7x7Xxl56NfjSrPz99t2GG67UYLG_1b-tDhdn5Uc5WjsQjJndwSqhdjtMOv3h7nG_685YqjAYA5OwATHYWJyuX93mYrgFs5oE6Dz5ltE5nOFTVa9XEqAJ04dnALUDLCWtR16XlsmCq0hCpARtRQX6VK092EaX9-XhERQjzS5bG",
      label: "Đỉnh máy và vòng xoay cơ học mạ chrome vát kim cương",
      tag: "Top Dial Plate",
      alt: "Top-down detail photograph of precision shutter release dial and chrome edging on vintage modern medium format camera on parchment leather mat.",
    },
    {
      url: "https://lh3.googleusercontent.com/aida-public/AB6AXuCCBasshcudbwPNZa-hzUql4rw15eKsk4bnH5XXRyRuW3597xcCGUHkzjCG40afwliwEnqc9u_I7xxDHUrQBUJ84kYA-z1xNK93_J5WZ1f3OdCvGtNcJrPqnk6BuUr7TRN-J3YicKXs840PX_RBos7_zE3LzXIRA5rQZbCjcqi19B5L-mnBQkon9P8unsHpg5hDyWMi0ujTpYVBpwbK5VPSBjg_GzB3oAhRoemaD776",
      label: "Khớp khóa ngàm lưng kỹ thuật số CFV II tháo rời",
      tag: "Modular Detach",
      alt: "Modular detachment view showing the CFV II 50C digital back uncoupled from the 907X camera body, showing clean electronic gold pins.",
    },
    {
      url: "https://lh3.googleusercontent.com/aida-public/AB6AXuDHKx2-k_Sd1VIRMuP_IgUwUBkHr8G856TrxX8s6FtINUBNGBrJkLKBhhjknS0llgyvGpsJWuysmSdoZNYu-_N9Mk13rVfZ_20X7zoiLISgO8H4b2g8RX3r0pd4l5T3JdtaQjWMVPmiSMD8k-PqlQ6QgFMS_g20igXoPI_H-AuwGQtXlRk477cv2mbReGglVAxpUtpUiFWgRkE1q3oOUwCc3d6jFgoNDXpuFfbmDgHe",
      label: "Hộp chống sốc Pelican 1400 kèm giấy chứng nhận hiệu chuẩn",
      tag: "Hardcase & Cert",
      alt: "Archival black protective hardcase open with custom laser-cut dense foam holding medium format camera and folded laboratory calibration certificates.",
    },
  ],
};

const RENT_ITEMS_METADATA: Record<string, Partial<RentDossierData>> = {
  "rent-1": {
    sku: "#HB-RNT-907X",
    title: "Canon EOS R6 Mark II Mirrorless Camera Kit + RF 24-70mm f/2.8L",
    categoryPrimary: "Máy ảnh & Quang học",
    categorySecondary: "Full-Frame Mirrorless",
    conditionGrade: "Grade A+ (Mint)",
    pricePerDay: 450000,
    priceStandardRange: "400k - 520k ₫",
    depositAmount: 12500000,
    replacementValuation: 75000000,
    shopName: "Kyoto Archival Optics",
    shopCode: "#SHP-0418",
  },
  "rent-2": {
    sku: "#HB-RNT-50CM",
    title: "Hasselblad 907X 50C & CFV II 50C Digital Back + 45mm f/4 P Lens Kit",
    categoryPrimary: "Máy ảnh & Quang học",
    categorySecondary: "Medium Format Digital",
    conditionGrade: "Collector Pristine (Grade A+)",
    pricePerDay: 1200000,
    priceStandardRange: "1.100k - 1.350k ₫",
    depositAmount: 28000000,
    replacementValuation: 145000000,
    shopName: "Kyoto Archival Optics",
    shopCode: "#SHP-0418",
  },
  "rent-3": {
    sku: "#HB-LCA-35AP",
    title: "Leica Summilux-M 35mm f/1.4 ASPH Fleet Edition",
    categoryPrimary: "Ống kính & Kính lọc",
    categorySecondary: "M-Mount Prime Optics",
    conditionGrade: "Grade A (Excellent)",
    pricePerDay: 380000,
    priceStandardRange: "350k - 420k ₫",
    depositAmount: 15000000,
    replacementValuation: 110000000,
    shopName: "Da Nang Camera Vault",
    shopCode: "#SHP-0209",
    legalRepresentative: "Trần Minh Khoa",
  },
  "rent-4": {
    sku: "#HB-SNY-FX60",
    title: "Sony FX6 Cinema Line Full-Frame Professional Camera",
    categoryPrimary: "Thiết bị Cinema & Video",
    categorySecondary: "Cinema E-Mount",
    conditionGrade: "Grade B+ (Cinema used)",
    pricePerDay: 1650000,
    priceStandardRange: "1.500k - 1.800k ₫",
    depositAmount: 45000000,
    replacementValuation: 160000000,
    shopName: "Saigon Cinema Vault",
    shopCode: "#SHP-0881",
    legalRepresentative: "Anh Nguyen Le",
  },
  "rent-5": {
    sku: "#HB-ARR-ORBT",
    title: "Arri Orbiter LED High-Output Set + Fresnel Lens",
    categoryPrimary: "Thiết bị Cinema & Video",
    categorySecondary: "Studio Lighting",
    conditionGrade: "Studio Tested",
    pricePerDay: 950000,
    priceStandardRange: "900k - 1.100k ₫",
    depositAmount: 22000000,
    replacementValuation: 180000000,
    shopName: "Saigon Cinema Vault",
    shopCode: "#SHP-0881",
    legalRepresentative: "Anh Nguyen Le",
  },
};

export const RentReview: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  // Load Dossier data matching current route ID
  const [dossier, setDossier] = useState<RentDossierData>(() => {
    if (id && RENT_ITEMS_METADATA[id]) {
      return { ...DEFAULT_DOSSIER, ...RENT_ITEMS_METADATA[id], id };
    }
    return DEFAULT_DOSSIER;
  });
  const [currentStatus, setCurrentStatus] = useState<RentReviewStatus>("PENDING");
  const [activePhotoIndex, setActivePhotoIndex] = useState<number>(0);
  const [isPhotoFading, setIsPhotoFading] = useState<boolean>(false);

  // Rejection Drawer State
  const [isRejectDrawerOpen, setIsRejectDrawerOpen] = useState<boolean>(false);
  const [rejectPreset, setRejectPreset] = useState<string>("macro_missing");
  const [rejectReason, setRejectReason] = useState<string>("");

  // Feedback Notification Banner
  const [feedback, setFeedback] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);

  // Lightbox Modal for high-res zoom
  const [isLightboxOpen, setIsLightboxOpen] = useState<boolean>(false);

  // Sync with route id & real DB if available
  useEffect(() => {
    let isMounted = true;

    // Attempt to load from MongoDB backend
    fetchAdminDashboardData()
      .then((data) => {
        if (!isMounted || !data || !Array.isArray(data.rentCatalogList)) return;
        const matched = data.rentCatalogList.find(
          (item) => item.id === id
        );
        if (matched) {
          setDossier((prev) => ({
            ...prev,
            id: matched.id,
            sku: `#HB-RNT-${matched.id.slice(-5).toUpperCase()}`,
            title: matched.name,
            pricePerDay: matched.pricePerDay,
            depositAmount: matched.depositAmount,
            shopName: matched.ownerName || prev.shopName,
            legalRepresentative: matched.ownerName || prev.legalRepresentative,
            categoryPrimary: matched.categoryName || prev.categoryPrimary,
            images:
              matched.images && matched.images.length > 0
                ? matched.images.map((img: string, idx: number) => ({
                    url: img,
                    label: `Hình ảnh kiểm định #${idx + 1} (${matched.name})`,
                    tag: idx === 0 ? "Benchmark" : `Góc chụp #${idx + 1}`,
                    alt: matched.name,
                  }))
                : prev.images,
          }));

          if (matched.status === "APPROVED") {
            setCurrentStatus("APPROVED");
          } else if (matched.status === "REJECTED") {
            setCurrentStatus("REJECTED");
          }
        }
      })
      .catch((err) => {
        console.warn("Không thể tải thông tin chi tiết đơn RENT từ backend:", err);
      });

    return () => {
      isMounted = false;
    };
  }, [id]);

  const handleSwitchPhoto = (index: number) => {
    if (index === activePhotoIndex) return;
    setIsPhotoFading(true);
    setTimeout(() => {
      setActivePhotoIndex(index);
      setIsPhotoFading(false);
    }, 150);
  };

  const handleApprove = () => {
    setCurrentStatus("APPROVED");
    setIsRejectDrawerOpen(false);
    setFeedback({
      type: "success",
      message: `✓ Hồ sơ ${dossier.sku} đã được phê duyệt thành công. Sản phẩm hiện đã được kích hoạt trực tiếp trên Sàn RENT Công Khai.`,
    });
  };

  const handleToggleRejectDrawer = (show: boolean) => {
    setIsRejectDrawerOpen(show);
  };

  const handleConfirmReject = () => {
    const reasonText = rejectReason.trim();
    const presetLabelMap: Record<string, string> = {
      macro_missing: "Thiếu ảnh macro buồng cảm biến / số Serial",
      deposit_excessive: "Tiền ký quỹ vượt ngưỡng khung giá trị sàn quy định",
      policy_violation: "Quy định thuê vi phạm chính sách bảo hiểm bên thứ 3",
      spec_inconsistent: "Thông số ống kính/phụ kiện không đồng nhất với ảnh chụp",
      other: "Lý do chuyên môn đặc thù khác",
    };

    const reasonSummary = reasonText
      ? `${presetLabelMap[rejectPreset]}: ${reasonText}`
      : presetLabelMap[rejectPreset];

    setCurrentStatus("REJECTED");
    setIsRejectDrawerOpen(false);
    setFeedback({
      type: "error",
      message: `✕ Hồ sơ đã bị từ chối (${reasonSummary}). Văn bản phản hồi và yêu cầu bổ sung đã được gửi trực tiếp tới hòm thư chủ xưởng ${dossier.shopName}.`,
    });
  };

  const currentImage = dossier.images[activePhotoIndex] || dossier.images[0];

  return (
    <div className="w-full bg-[#fdf8f5] text-[#1c1b19] min-h-screen font-sans antialiased pb-12 selection:bg-[#caebc9] selection:text-[#05210c]">
      {/* ================= TOP NAVIGATION & GLOBAL STATUS STRIP ================= */}
      <div className="w-full px-4 sm:px-8 lg:px-12 pt-4 pb-4 bg-[#f7f3ef]/80 backdrop-blur-sm border-b border-[#cfc5b8]/30 flex flex-col md:flex-row md:items-center md:justify-between gap-3 sticky top-16 z-30">
        <div className="flex items-center gap-1.5 text-xs text-[#4c463c] flex-wrap">
          <Link
            to="/admin/dashboard"
            className="hover:text-[#1c1b19] transition-colors flex items-center gap-1 font-medium"
          >
            <span className="material-symbols-outlined text-[15px]">
              admin_panel_settings
            </span>
            <span>Admin</span>
          </Link>
          <span className="text-[#cfc5b8]">/</span>
          <Link
            to="/admin/rent/listings"
            className="hover:text-[#1c1b19] transition-colors font-medium"
          >
            RENT Listings
          </Link>
          <span className="text-[#cfc5b8]">/</span>
          <span className="text-[#1c1b19] font-semibold tracking-normal font-mono">
            Hồ Sơ Thẩm Định #{id ? id.toUpperCase() : "LST-8849-RENT"}
          </span>
        </div>

        <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
          <Link
            to="/admin/rent/listings"
            className="inline-flex items-center gap-1.5 text-[#6c5937] text-xs font-semibold hover:underline underline-offset-4 transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">
              arrow_back
            </span>
            <span>Quay lại danh sách RENT</span>
          </Link>
          <span className="text-[#cfc5b8]">|</span>
          <Link
            to={`/rent/products/${dossier.id}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#f2ede9] hover:bg-[#ece7e4] rounded text-[#1c1b19] text-xs font-medium uppercase tracking-wider transition-colors shadow-xs"
          >
            <span>Xem Bản Công Khai</span>
            <span className="material-symbols-outlined text-[14px]">
              open_in_new
            </span>
          </Link>

          {/* Status Badge Indicator */}
          {currentStatus === "PENDING" && (
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#ffdcc1] text-[#2e1500] rounded text-xs font-bold tracking-wider uppercase shadow-xs">
              <span className="w-2 h-2 rounded-full bg-[#7f5227] animate-pulse"></span>
              <span>CHỜ THẨM ĐỊNH (PENDING)</span>
            </div>
          )}

          {currentStatus === "APPROVED" && (
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#caebc9] text-[#314d34] rounded text-xs font-bold tracking-wider uppercase shadow-xs">
              <span className="w-2 h-2 rounded-full bg-[#48654b]"></span>
              <span>ĐÃ PHÊ DUYỆT (APPROVED)</span>
            </div>
          )}

          {currentStatus === "REJECTED" && (
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#ffdad6] text-[#93000a] rounded text-xs font-bold tracking-wider uppercase shadow-xs">
              <span className="w-2 h-2 rounded-full bg-[#ba1a1a]"></span>
              <span>BỊ TỪ CHỐI (REJECTED)</span>
            </div>
          )}
        </div>
      </div>

      {/* ================= PRIMARY PAGE HEADER ================= */}
      <section className="w-full px-4 sm:px-8 lg:px-12 pt-6 pb-4">
        <div className="max-w-6xl">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="px-2 py-0.5 bg-[#caebc9] text-[#314d34] rounded text-[11px] font-bold uppercase tracking-wider">
              Hạ Tầng Quang Học • Sàn RENT
            </span>
            <span className="text-[#cfc5b8] text-xs">•</span>
            <span className="text-[#4c463c] text-xs uppercase font-semibold tracking-wider">
              GIAO THỨC LƯU KÝ PHÁP LÝ & BẢO HIỂM
            </span>
          </div>

          <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl text-[#1c1b19] tracking-tight font-bold mb-2">
            Hồ Sơ Thẩm Định Sản Phẩm Cho Thuê (RENT Dossier Review)
          </h1>

          <p className="text-sm sm:text-base text-[#4c463c] max-w-4xl mb-4 leading-relaxed">
            Thẩm định hiện vật lưu ký, thông số quang học, quy chuẩn bảo quản và
            hạn mức bảo chứng ký quỹ thông minh Smart Escrow trước khi công khai
            trên sàn RENT.
          </p>

          {/* Editorial Metadata Ribbon */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 py-2.5 bg-[#f7f3ef] px-4 rounded border border-[#cfc5b8]/30 text-xs text-[#4c463c]">
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[#6c5937] text-[16px]">
                warehouse
              </span>
              <span>
                Asset Node:{" "}
                <strong className="text-[#1c1b19] font-mono">
                  {dossier.assetNode}
                </strong>
              </span>
            </div>
            <span className="text-[#cfc5b8]">•</span>
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[#6c5937] text-[16px]">
                schedule
              </span>
              <span>
                Đệ trình:{" "}
                <strong className="text-[#1c1b19]">{dossier.submittedAt}</strong>
              </span>
            </div>
            <span className="text-[#cfc5b8]">•</span>
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[#6c5937] text-[16px]">
                fingerprint
              </span>
              <span>
                Mã kiểm định:{" "}
                <strong className="text-[#1c1b19] font-mono">
                  {dossier.sku}
                </strong>
              </span>
            </div>
            <span className="text-[#cfc5b8]">•</span>
            <div className="flex items-center gap-1.5 text-[#48654b]">
              <span className="material-symbols-outlined text-[16px]">
                verified
              </span>
              <span className="font-semibold">{dossier.certification}</span>
            </div>
          </div>
        </div>
      </section>

      {/* ================= TWO-COLUMN EDITORIAL LAYOUT ================= */}
      <div className="w-full px-4 sm:px-8 lg:px-12 pt-2">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ================= LEFT COLUMN: 65% (8/12 cols) ================= */}
          <div className="lg:col-span-8 space-y-6">
            {/* Section: Archival Image Gallery */}
            <div className="bg-[#ffffff] p-5 sm:p-6 rounded border border-[#cfc5b8]/30 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#6c5937] text-[20px]">
                    photo_camera
                  </span>
                  <h2 className="font-serif text-lg font-bold text-[#1c1b19]">
                    Hình Ảnh Giám Định Hiện Vật Thực Tế (5 Góc Phân Giải Cao)
                  </h2>
                </div>
                <span className="px-2 py-0.5 bg-[#ece7e4] rounded text-[#4c463c] text-[10px] uppercase font-bold tracking-wider">
                  Hi-Res Uncompressed
                </span>
              </div>

              {/* Hero Preview */}
              <div className="relative w-full aspect-[16/10] bg-[#f7f3ef] rounded overflow-hidden group border border-[#cfc5b8]/30">
                <img
                  src={currentImage.url}
                  alt={currentImage.alt}
                  className={`w-full h-full object-cover transition-all duration-300 group-hover:scale-[1.01] ${
                    isPhotoFading ? "opacity-60" : "opacity-100"
                  }`}
                />

                {/* Active Caption Overlay */}
                <div className="absolute bottom-3 left-3 right-3 sm:right-auto bg-[#31302e]/90 backdrop-blur-md text-[#f4f0ec] px-3 py-1.5 rounded text-xs flex items-center gap-2 shadow-md">
                  <span className="material-symbols-outlined text-[16px] text-[#caebc9]">
                    center_focus_strong
                  </span>
                  <span className="font-medium truncate">
                    {currentImage.label}
                  </span>
                </div>

                {/* Resolution Badge & Fullscreen action */}
                <div className="absolute top-3 right-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsLightboxOpen(true)}
                    className="p-1.5 bg-[#ffffff]/90 hover:bg-[#ffffff] text-[#1c1b19] rounded backdrop-blur-md shadow-sm transition-colors text-xs flex items-center gap-1 font-medium"
                    title="Mở toàn màn hình kiểm tra chi tiết quang học"
                  >
                    <span className="material-symbols-outlined text-[15px]">
                      zoom_in
                    </span>
                    <span className="hidden sm:inline">Phóng to</span>
                  </button>
                  <span className="px-2.5 py-1 bg-[#ffffff]/90 backdrop-blur-md rounded text-[11px] font-bold text-[#1c1b19] shadow-sm uppercase">
                    Optical Calibrated 50MP
                  </span>
                </div>
              </div>

              {/* 4 Sub-thumbnails */}
              <div className="grid grid-cols-4 gap-2.5 sm:gap-3 mt-3">
                {dossier.images.slice(1, 5).map((img, idx) => {
                  const actualIdx = idx + 1;
                  const isSelected = activePhotoIndex === actualIdx;
                  return (
                    <button
                      key={actualIdx}
                      type="button"
                      onClick={() => handleSwitchPhoto(actualIdx)}
                      className={`relative aspect-[4/3] rounded overflow-hidden bg-[#f2ede9] focus:outline-none transition-all duration-200 text-left border ${
                        isSelected
                          ? "ring-2 ring-[#6c5937] border-transparent scale-[1.02] shadow-sm"
                          : "border-[#cfc5b8]/40 hover:border-[#6c5937]/60 opacity-80 hover:opacity-100"
                      }`}
                      title={img.label}
                    >
                      <img
                        src={img.url}
                        alt={img.alt}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute bottom-1 left-1 bg-[#31302e]/85 backdrop-blur-xs text-[#f4f0ec] px-1.5 py-0.5 text-[9px] font-semibold uppercase rounded">
                        {img.tag}
                      </span>
                      {isSelected && (
                        <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#6c5937]"></span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Switch back to Main photo button if sub-photo is selected */}
              {activePhotoIndex !== 0 && (
                <div className="mt-3 pt-2 border-t border-[#cfc5b8]/20 flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleSwitchPhoto(0)}
                    className="text-xs text-[#6c5937] hover:underline flex items-center gap-1 font-medium"
                  >
                    <span className="material-symbols-outlined text-[14px]">
                      restart_alt
                    </span>
                    <span>Quay lại khung toàn cảnh chuẩn (Primary Benchmark)</span>
                  </button>
                </div>
              )}
            </div>

            {/* Section: Product Details & Hardware Specifications */}
            <div className="bg-[#ffffff] p-5 sm:p-6 rounded border border-[#cfc5b8]/30 shadow-xs">
              <div className="flex items-center justify-between pb-2 mb-3 bg-[#f7f3ef] px-3 py-1.5 rounded border border-[#cfc5b8]/20">
                <span className="text-[11px] uppercase text-[#4c463c] font-bold tracking-wider">
                  HỒ SƠ HIỆN VẬT QUANG HỌC
                </span>
                <span className="text-xs font-mono font-bold text-[#6c5937]">
                  SKU: {dossier.sku}
                </span>
              </div>

              <div className="mb-2">
                <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#1c1b19] tracking-tight">
                  {dossier.title}
                </h2>
              </div>

              <div className="flex items-center gap-2 text-[#4c463c] text-xs mb-4 flex-wrap">
                <span>Danh mục:</span>
                <strong className="text-[#1c1b19]">
                  {dossier.categoryPrimary}
                </strong>
                <span className="text-[#cfc5b8]">›</span>
                <strong className="text-[#1c1b19]">
                  {dossier.categorySecondary}
                </strong>
                <span className="text-[#cfc5b8]">•</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#caebc9] text-[#314d34] rounded text-[11px] font-bold">
                  <span className="material-symbols-outlined text-[14px]">
                    award_star
                  </span>
                  <span>Tình trạng: {dossier.conditionGrade}</span>
                </span>
              </div>

              <div className="space-y-2 text-[#1c1b19] text-sm bg-[#f7f3ef]/50 p-4 rounded border border-[#cfc5b8]/30 leading-relaxed">
                <h3 className="text-xs uppercase text-[#4c463c] font-bold tracking-wider">
                  Mô Tả Giám Định Từ Chủ Xưởng (Owner Declaration):
                </h3>
                <p>{dossier.descriptionPara1}</p>
                <p>{dossier.descriptionPara2}</p>
              </div>
            </div>

            {/* Section: Financial, Rental & Escrow Terms */}
            <div className="bg-[#ffffff] p-5 sm:p-6 rounded border border-[#cfc5b8]/30 shadow-xs">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <div>
                  <span className="text-[11px] uppercase text-[#6c5937] font-bold tracking-wider block">
                    MINH BẠCH DÒNG TIỀN & BẢO CHỨNG RỦI RO
                  </span>
                  <h3 className="font-serif text-lg font-bold text-[#1c1b19]">
                    Cấu Trúc Tài Chính & Ký Quỹ Thông Minh (Smart Escrow)
                  </h3>
                </div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#caebc9] text-[#314d34] rounded text-xs font-bold shadow-xs">
                  <span className="material-symbols-outlined text-[15px]">
                    shield
                  </span>
                  <span>100% Ring-fenced Protection</span>
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                {/* Box 1 */}
                <div className="p-4 bg-[#f7f3ef] rounded border border-[#cfc5b8]/30">
                  <span className="text-[11px] uppercase text-[#4c463c] font-semibold block mb-1">
                    Đơn Giá Thuê Ngày
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className="font-serif text-2xl font-bold text-[#1c1b19]">
                      {dossier.pricePerDay.toLocaleString("vi-VN")} ₫
                    </span>
                    <span className="text-xs text-[#4c463c]">/ ngày</span>
                  </div>
                  <p className="text-xs text-[#48654b] mt-2 flex items-center gap-1 font-medium">
                    <span className="material-symbols-outlined text-[14px]">
                      check_circle
                    </span>
                    <span>Khung chuẩn sàn: {dossier.priceStandardRange}</span>
                  </p>
                </div>

                {/* Box 2 */}
                <div className="p-4 bg-[#f7f3ef] rounded border border-[#cfc5b8]/30">
                  <span className="text-[11px] uppercase text-[#4c463c] font-semibold block mb-1">
                    Ký Quỹ Hoàn Lại (Escrow)
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className="font-serif text-2xl font-bold text-[#7f5227]">
                      {dossier.depositAmount.toLocaleString("vi-VN")} ₫
                    </span>
                  </div>
                  <p className="text-xs text-[#4c463c] mt-2 leading-tight">
                    {dossier.depositNote}
                  </p>
                </div>

                {/* Box 3 */}
                <div className="p-4 bg-[#f7f3ef] rounded border border-[#cfc5b8]/30">
                  <span className="text-[11px] uppercase text-[#4c463c] font-semibold block mb-1">
                    Thời Gian Thuê Quy Định
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className="font-serif text-2xl font-bold text-[#1c1b19]">
                      {dossier.minDays} - {dossier.maxDays}
                    </span>
                    <span className="text-xs text-[#4c463c]">ngày liên tục</span>
                  </div>
                  <p className="text-xs text-[#4c463c] mt-2">
                    Yêu cầu báo trước tối thiểu {dossier.advanceNoticeHours} giờ
                  </p>
                </div>
              </div>

              {/* Sub-strip */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                <div className="p-3 bg-[#ece7e4]/70 rounded border border-[#cfc5b8]/30 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] uppercase text-[#4c463c] block font-medium">
                      Định Giá Thay Thế Niêm Phong:
                    </span>
                    <span className="font-serif text-lg font-bold text-[#1c1b19] font-mono">
                      {dossier.replacementValuation.toLocaleString("vi-VN")} ₫
                    </span>
                  </div>
                  <span className="text-xs text-[#4c463c] bg-[#f2ede9] px-2.5 py-1 rounded font-medium border border-[#cfc5b8]/30">
                    {dossier.insuranceCarrier}
                  </span>
                </div>

                <div className="p-3 bg-[#ece7e4]/70 rounded border border-[#cfc5b8]/30 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] uppercase text-[#4c463c] block font-medium">
                      Giao Vận Bảo Chứng:
                    </span>
                    <span className="font-serif text-lg font-bold text-[#1c1b19]">
                      {dossier.logisticsMethod}
                    </span>
                  </div>
                  <span className="text-xs text-[#314d34] bg-[#caebc9] px-2.5 py-1 rounded font-semibold">
                    {dossier.logisticsTrack}
                  </span>
                </div>
              </div>
            </div>

            {/* Section: Rental Rules (Quy Định & Điều Kiện Vận Hành Của Xưởng) */}
            <div className="bg-[#ffffff] p-5 sm:p-6 rounded border border-[#cfc5b8]/30 shadow-xs">
              <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#6c5937] text-[22px]">
                    gavel
                  </span>
                  <h3 className="font-serif text-lg font-bold text-[#1c1b19]">
                    Quy Định Vận Hành Của Xưởng Lưu Ký (4 Điều Kiện Bắt Buộc)
                  </h3>
                </div>
                <span className="text-xs text-[#4c463c] font-medium">
                  Tuân thủ tiêu chuẩn an toàn quang học
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Rule Card 1 */}
                <div className="p-4 bg-[#f7f3ef] rounded border border-[#cfc5b8]/30 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 text-[#ba1a1a] mb-2">
                      <span className="material-symbols-outlined text-[18px]">
                        water_drop
                      </span>
                      <h4 className="text-xs uppercase font-bold tracking-wider">
                        1. Giới Hạn Môi Trường Vận Hành
                      </h4>
                    </div>
                    <p className="text-xs text-[#4c463c] leading-relaxed">
                      Tuyệt đối không sử dụng máy trong môi trường phun nước mặn
                      ven biển, bùn lầy, ẩm ướt nhiệt đới cực hạn hoặc bão cát sa
                      mạc khi không trang bị vỏ bảo vệ kín khí chuyên dụng.
                    </p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-[#ba1a1a]/20 text-[#ba1a1a] text-[11px] uppercase font-bold">
                    Phạt 100% chi phí tháo sấy tại phòng vô trùng nếu nhiễm mặn
                  </div>
                </div>

                {/* Rule Card 2 */}
                <div className="p-4 bg-[#f7f3ef] rounded border border-[#cfc5b8]/30 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 text-[#6c5937] mb-2">
                      <span className="material-symbols-outlined text-[18px]">
                        device_thermostat
                      </span>
                      <h4 className="text-xs uppercase font-bold tracking-wider">
                        2. Bảo Dưỡng Nhiệt Độ Âm
                      </h4>
                    </div>
                    <p className="text-xs text-[#4c463c] leading-relaxed">
                      Khi vận hành ở nhiệt độ môi trường dưới 0°C, người thuê có
                      nghĩa vụ giữ ấm thỏi pin sát thân nhiệt khi nghỉ chụp. Tuyệt
                      đối không cắm sạc pin nhanh dưới ngưỡng đóng băng.
                    </p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-[#cfc5b8]/30 text-[#4c463c] text-[11px] uppercase font-semibold">
                    Giám sát chu kỳ sạc pin qua cổng giao tiếp thông minh
                  </div>
                </div>

                {/* Rule Card 3 */}
                <div className="p-4 bg-[#f7f3ef] rounded border border-[#cfc5b8]/30 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 text-[#ba1a1a] mb-2">
                      <span className="material-symbols-outlined text-[18px]">
                        lens_blur
                      </span>
                      <h4 className="text-xs uppercase font-bold tracking-wider">
                        3. Toàn Vẹn Buồng Cảm Biến
                      </h4>
                    </div>
                    <p className="text-xs text-[#4c463c] leading-relaxed">
                      Nghiêm cấm người thuê tự ý sử dụng tăm bông, dung dịch vệ
                      sinh hoặc bóng thổi cao su để vệ sinh kính lọc bề mặt cảm
                      biến tại hiện trường. Chỉ chuyên viên kỹ thuật ReUse Hub
                      được thao tác tăm ẩm.
                    </p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-[#ba1a1a]/20 text-[#ba1a1a] text-[11px] uppercase font-bold">
                    Vi phạm dẫn đến tịch thu ký quỹ sửa chữa cảm biến
                  </div>
                </div>

                {/* Rule Card 4 */}
                <div className="p-4 bg-[#f7f3ef] rounded border border-[#cfc5b8]/30 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 text-[#7f5227] mb-2">
                      <span className="material-symbols-outlined text-[18px]">
                        alarm
                      </span>
                      <h4 className="text-xs uppercase font-bold tracking-wider">
                        4. Xử Lý Chậm Trễ Bàn Giao
                      </h4>
                    </div>
                    <p className="text-xs text-[#4c463c] leading-relaxed">
                      Trường hợp hoàn trả trễ hẹn không có xác nhận đồng ý qua
                      kênh trò chuyện mã hóa ReUse Hub Chat sẽ tính phí quá hạn
                      bằng 1.5x đơn giá niêm yết theo mỗi chu kỳ 24 giờ.
                    </p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-[#cfc5b8]/30 text-[#4c463c] text-[11px] uppercase font-semibold">
                    Tự động trích xuất trực tiếp từ quỹ Smart Escrow
                  </div>
                </div>
              </div>
            </div>

            {/* Section: Inventory Summary (Tình Trạng Kho Lưu Ký Chỉ Định) */}
            <div className="bg-[#ffffff] p-5 sm:p-6 rounded border border-[#cfc5b8]/30 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 mb-3">
                <div>
                  <span className="text-[11px] uppercase text-[#4c463c] font-bold tracking-wider">
                    THỰC THỂ LƯU KHO VẬT LÝ
                  </span>
                  <h3 className="font-serif text-lg font-bold text-[#1c1b19]">
                    Tình Trạng Kho Lưu Ký Chỉ Định (Fleet Total:{" "}
                    {dossier.fleetUnits.length} Units)
                  </h3>
                </div>
                <div className="text-right mt-2 sm:mt-0 text-xs text-[#4c463c]">
                  <span>
                    Vị trí:{" "}
                    <strong className="text-[#1c1b19]">
                      {dossier.warehouseLocation}
                    </strong>
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                {dossier.fleetUnits.map((unit, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-[#f7f3ef] rounded border border-[#cfc5b8]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                          unit.status === "READY"
                            ? "bg-[#48654b]"
                            : "bg-[#7f5227] animate-pulse"
                        }`}
                      ></span>
                      <div>
                        <div className="text-xs text-[#1c1b19] font-bold font-mono">
                          Đơn Vị #{idx + 1}: {unit.serial}
                        </div>
                        <span className="text-[11px] text-[#4c463c]">
                          Màn trập: {unit.shutterCount.toLocaleString("vi-VN")}{" "}
                          chu kỳ • Firmware: {unit.firmware} • Hiệu chuẩn:{" "}
                          {unit.calibration}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`px-3 py-1 rounded text-[10px] font-bold uppercase tracking-wider whitespace-nowrap self-start sm:self-auto ${
                        unit.status === "READY"
                          ? "bg-[#caebc9] text-[#314d34]"
                          : "bg-[#ffdcc1] text-[#2e1500]"
                      }`}
                    >
                      {unit.statusText}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ================= RIGHT COLUMN: 35% (4/12 cols) ================= */}
          <div className="lg:col-span-4 space-y-6">
            {/* Shop Owner Information Card */}
            <div className="bg-[#ffffff] p-5 sm:p-6 rounded border border-[#cfc5b8]/30 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] uppercase text-[#4c463c] font-bold tracking-wider">
                  HỒ SƠ ĐỐI TÁC LƯU KÝ
                </span>
                <span className="px-2 py-0.5 bg-[#caebc9] text-[#314d34] rounded text-[10px] font-bold">
                  KYC TIER-3 VERIFIED ✓
                </span>
              </div>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-[#86724d] text-[#fffbff] flex items-center justify-center font-serif text-lg font-bold shrink-0">
                  {dossier.shopAvatarInitials}
                </div>
                <div>
                  <h4 className="font-serif text-base font-bold text-[#1c1b19]">
                    {dossier.shopName}
                  </h4>
                  <p className="text-xs text-[#4c463c] font-mono">
                    Mã xưởng: {dossier.shopCode}
                  </p>
                </div>
              </div>

              <div className="space-y-2 text-xs pb-3 mb-4 bg-[#f7f3ef] p-3 rounded border border-[#cfc5b8]/30">
                <div className="flex items-center justify-between">
                  <span className="text-[#4c463c]">Đại diện pháp lý:</span>
                  <strong className="text-[#1c1b19]">
                    {dossier.legalRepresentative}
                  </strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#4c463c]">Đánh giá uy tín:</span>
                  <span className="text-[#1c1b19] font-bold flex items-center gap-1">
                    <span className="material-symbols-outlined text-[#6c5937] text-[14px]">
                      star
                    </span>
                    {dossier.shopRating} ★ ({dossier.cleanOrdersCount} đơn sạch)
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#4c463c]">Tỷ lệ tranh chấp:</span>
                  <span className="text-[#48654b] font-bold">
                    {dossier.disputeRate}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#4c463c]">
                    Tỷ lệ hoàn trả cọc đúng hẹn:
                  </span>
                  <span className="text-[#1c1b19] font-bold">
                    {dossier.depositReturnRate}
                  </span>
                </div>
              </div>

              <Link
                to="/admin/users/shp-0418"
                className="w-full inline-flex items-center justify-center gap-1.5 py-2 bg-[#f2ede9] hover:bg-[#ece7e4] text-[#1c1b19] rounded text-xs font-semibold transition-colors shadow-xs"
              >
                <span className="material-symbols-outlined text-[16px]">
                  account_box
                </span>
                <span>Xem Hồ Sơ Chi Tiết Chủ Xưởng</span>
              </Link>
            </div>

            {/* Review Checklist (7 Mandatory Platform Criteria) */}
            <div className="bg-[#ffffff] p-5 sm:p-6 rounded border border-[#cfc5b8]/30 shadow-xs">
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-serif text-base font-bold text-[#1c1b19]">
                  Kiểm Tra Thẩm Định (7/7 Đạt)
                </h3>
                <span className="px-2 py-0.5 bg-[#caebc9] text-[#314d34] rounded text-[10px] font-bold uppercase tracking-wider">
                  100% PASS
                </span>
              </div>
              <p className="text-xs text-[#4c463c] mb-3">
                Quy chuẩn kiểm duyệt tự động kết hợp đối chiếu phòng thí nghiệm.
              </p>

              <ul className="space-y-2 text-xs">
                <li className="flex items-start gap-2.5 p-2 rounded bg-[#f7f3ef]/80 border border-[#cfc5b8]/20">
                  <span className="material-symbols-outlined text-[#48654b] text-[18px] shrink-0 mt-0.5">
                    check_circle
                  </span>
                  <div>
                    <span className="text-[#1c1b19] font-semibold block">
                      Thông tin hiện vật đầy đủ
                    </span>
                    <span className="text-[#4c463c] text-[11px]">
                      Mô tả chi tiết cấu hình mô-đun, ngàm kính, phụ kiện kèm theo.
                    </span>
                  </div>
                </li>

                <li className="flex items-start gap-2.5 p-2 rounded bg-[#f7f3ef]/80 border border-[#cfc5b8]/20">
                  <span className="material-symbols-outlined text-[#48654b] text-[18px] shrink-0 mt-0.5">
                    check_circle
                  </span>
                  <div>
                    <span className="text-[#1c1b19] font-semibold block">
                      Hình ảnh đạt chuẩn quang học
                    </span>
                    <span className="text-[#4c463c] text-[11px]">
                      Có 4 góc chụp độ phân giải cao và ảnh macro bề mặt cảm biến.
                    </span>
                  </div>
                </li>

                <li className="flex items-start gap-2.5 p-2 rounded bg-[#f7f3ef]/80 border border-[#cfc5b8]/20">
                  <span className="material-symbols-outlined text-[#48654b] text-[18px] shrink-0 mt-0.5">
                    check_circle
                  </span>
                  <div>
                    <span className="text-[#1c1b19] font-semibold block">
                      Đơn giá thuê hợp lý
                    </span>
                    <span className="text-[#4c463c] text-[11px]">
                      {dossier.pricePerDay.toLocaleString("vi-VN")} ₫/ngày nằm
                      trong khung thẩm định danh mục.
                    </span>
                  </div>
                </li>

                <li className="flex items-start gap-2.5 p-2 rounded bg-[#f7f3ef]/80 border border-[#cfc5b8]/20">
                  <span className="material-symbols-outlined text-[#48654b] text-[18px] shrink-0 mt-0.5">
                    check_circle
                  </span>
                  <div>
                    <span className="text-[#1c1b19] font-semibold block">
                      Bảo chứng ký quỹ minh bạch
                    </span>
                    <span className="text-[#4c463c] text-[11px]">
                      Mức cọc {dossier.depositAmount.toLocaleString("vi-VN")} ₫
                      tương thích giá trị thay thế niêm phong.
                    </span>
                  </div>
                </li>

                <li className="flex items-start gap-2.5 p-2 rounded bg-[#f7f3ef]/80 border border-[#cfc5b8]/20">
                  <span className="material-symbols-outlined text-[#48654b] text-[18px] shrink-0 mt-0.5">
                    check_circle
                  </span>
                  <div>
                    <span className="text-[#1c1b19] font-semibold block">
                      Quy định thuê đạt chuẩn B-Corp
                    </span>
                    <span className="text-[#4c463c] text-[11px]">
                      Có 4 điều khoản bảo vệ thiết bị, pin và buồng cảm biến.
                    </span>
                  </div>
                </li>

                <li className="flex items-start gap-2.5 p-2 rounded bg-[#f7f3ef]/80 border border-[#cfc5b8]/20">
                  <span className="material-symbols-outlined text-[#48654b] text-[18px] shrink-0 mt-0.5">
                    check_circle
                  </span>
                  <div>
                    <span className="text-[#1c1b19] font-semibold block">
                      Danh mục chuẩn hóa
                    </span>
                    <span className="text-[#4c463c] text-[11px]">
                      Gắn đúng danh mục: {dossier.categoryPrimary} /{" "}
                      {dossier.categorySecondary}.
                    </span>
                  </div>
                </li>

                <li className="flex items-start gap-2.5 p-2 rounded bg-[#f7f3ef]/80 border border-[#cfc5b8]/20">
                  <span className="material-symbols-outlined text-[#48654b] text-[18px] shrink-0 mt-0.5">
                    check_circle
                  </span>
                  <div>
                    <span className="text-[#1c1b19] font-semibold block">
                      Số Serial không trùng lặp
                    </span>
                    <span className="text-[#4c463c] text-[11px]">
                      Xác nhận độc bản với sổ cái vật phẩm số hóa toàn cầu.
                    </span>
                  </div>
                </li>
              </ul>
            </div>

            {/* Governance Principle Notice */}
            <div className="bg-[#ece7e4]/80 p-4 rounded border border-[#cfc5b8]/40">
              <div className="flex items-start gap-2.5">
                <span className="material-symbols-outlined text-[#6c5937] text-[20px] shrink-0 mt-0.5">
                  balance
                </span>
                <div className="text-xs text-[#1c1b19]">
                  <strong className="text-[11px] uppercase block tracking-wider mb-1 text-[#1c1b19] font-bold">
                    NGUYÊN TẮC QUẢN TRỊ TRUNG THÀNH:
                  </strong>
                  <p className="text-[#4c463c] text-[12px] leading-relaxed">
                    Quản trị viên chỉ có thẩm quyền{" "}
                    <strong>Phê duyệt (Approve)</strong> hoặc{" "}
                    <strong>Từ chối (Reject)</strong> hiển thị. Chủ Xưởng nắm
                    toàn quyền tạo và biên tập nội dung. Quản trị viên tuyệt đối
                    không can thiệp, chỉnh sửa hay biên tập lại thông số kỹ thuật
                    và nội dung đã nộp của Chủ Xưởng.
                  </p>
                </div>
              </div>
            </div>

            {/* Adjudication Action Panel */}
            <div className="bg-[#ffffff] p-5 sm:p-6 rounded border border-[#cfc5b8]/30 shadow-md">
              <div className="mb-4">
                <span className="text-[11px] uppercase text-[#4c463c] font-bold tracking-wider block">
                  QUYẾT ĐỊNH THẨM ĐỊNH
                </span>
                <h3 className="font-serif text-xl font-bold text-[#1c1b19]">
                  Phê Duyệt & Niêm Yết Sàn
                </h3>
              </div>

              {/* Notification feedback banner */}
              {feedback && (
                <div
                  className={`p-3 mb-4 rounded text-xs leading-relaxed border ${
                    feedback.type === "success"
                      ? "bg-[#caebc9] text-[#05210c] border-[#caebc9]"
                      : "bg-[#ffdad6] text-[#93000a] border-[#ffdad6]"
                  }`}
                >
                  {feedback.message}
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={handleApprove}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#31302e] text-[#f4f0ec] hover:bg-[#6c5937] rounded text-xs font-bold uppercase tracking-wider transition-all shadow-xs"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    verified
                  </span>
                  <span>Phê Duyệt Niêm Yết (Approve Listing)</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleToggleRejectDrawer(!isRejectDrawerOpen)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#ffdad6] text-[#93000a] hover:bg-[#ba1a1a] hover:text-[#ffffff] rounded text-xs font-bold uppercase tracking-wider transition-all shadow-xs"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    block
                  </span>
                  <span>Từ Chối Niêm Yết (Reject Listing)</span>
                </button>
              </div>

              {/* In-Page Rejection Expansion / Drawer */}
              {isRejectDrawerOpen && (
                <div className="mt-4 pt-4 bg-[#f7f3ef] p-4 rounded border border-[#ffdad6] animate-fade-in">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs uppercase text-[#ba1a1a] font-bold flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px]">
                        report_problem
                      </span>
                      <span>Lập Biên Bản Từ Chối Hồ Sơ</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleToggleRejectDrawer(false)}
                      className="text-[#4c463c] hover:text-[#1c1b19] p-1"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        close
                      </span>
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label
                        className="block text-[11px] uppercase text-[#4c463c] mb-1 font-bold"
                        htmlFor="rejectPresetSelect"
                      >
                        Lý do chính yếu:
                      </label>
                      <select
                        id="rejectPresetSelect"
                        value={rejectPreset}
                        onChange={(e) => setRejectPreset(e.target.value)}
                        className="w-full bg-[#ffffff] text-[#1c1b19] text-xs p-2 rounded border border-[#cfc5b8]/50 focus:outline-none focus:ring-1 focus:ring-[#ba1a1a]"
                      >
                        <option value="macro_missing">
                          Thiếu ảnh macro buồng cảm biến / số Serial
                        </option>
                        <option value="deposit_excessive">
                          Tiền ký quỹ vượt ngưỡng khung giá trị sàn quy định
                        </option>
                        <option value="policy_violation">
                          Quy định thuê vi phạm chính sách bảo hiểm bên thứ 3
                        </option>
                        <option value="spec_inconsistent">
                          Thông số ống kính/phụ kiện không đồng nhất với ảnh chụp
                        </option>
                        <option value="other">
                          Lý do chuyên môn đặc thù khác
                        </option>
                      </select>
                    </div>

                    <div>
                      <label
                        className="block text-[11px] uppercase text-[#4c463c] mb-1 font-bold"
                        htmlFor="rejectReasonText"
                      >
                        Chi tiết phản hồi gửi tới Chủ Xưởng:
                      </label>
                      <textarea
                        id="rejectReasonText"
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="Nêu rõ yêu cầu bổ sung chứng chỉ hoặc ảnh chụp hiện vật trước khi Chủ Xưởng nộp lại..."
                        rows={3}
                        className="w-full bg-[#ffffff] text-[#1c1b19] text-xs p-2 rounded border border-[#cfc5b8]/50 focus:outline-none focus:ring-1 focus:ring-[#ba1a1a] resize-none"
                      />
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={handleConfirmReject}
                        className="flex-1 py-2 bg-[#ba1a1a] text-[#ffffff] rounded text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-opacity"
                      >
                        Xác Nhận Từ Chối
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleRejectDrawer(false)}
                        className="px-4 py-2 bg-[#f2ede9] hover:bg-[#ece7e4] text-[#1c1b19] rounded text-xs font-semibold transition-colors"
                      >
                        Hủy Bỏ
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Status Reset cue if approved or rejected */}
              {currentStatus !== "PENDING" && (
                <div className="mt-4 pt-3 border-t border-[#cfc5b8]/30 flex justify-between items-center text-xs">
                  <span className="text-[#4c463c]">Cần thẩm định lại?</span>
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentStatus("PENDING");
                      setFeedback(null);
                    }}
                    className="text-[#6c5937] hover:underline font-semibold flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[14px]">
                      restart_alt
                    </span>
                    <span>Đặt lại trạng thái Chờ Duyệt</span>
                  </button>
                </div>
              )}

              <div className="mt-4 pt-3 text-center border-t border-[#cfc5b8]/20">
                <Link
                  to="/admin/rent/listings"
                  className="text-[#4c463c] hover:text-[#1c1b19] text-xs underline underline-offset-4 font-medium transition-colors"
                >
                  ← Quay lại danh sách sản phẩm RENT (/admin/rent/listings)
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ================= LIGHTBOX MODAL ================= */}
      {isLightboxOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in"
          onClick={() => setIsLightboxOpen(false)}
        >
          <div
            className="relative max-w-5xl max-h-[90vh] flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setIsLightboxOpen(false)}
              className="absolute -top-10 right-0 text-white hover:text-[#ffdcc1] flex items-center gap-1 text-sm font-semibold p-1"
            >
              <span className="material-symbols-outlined text-[20px]">
                close
              </span>
              <span>Đóng</span>
            </button>
            <img
              src={currentImage.url}
              alt={currentImage.alt}
              className="max-h-[80vh] w-auto object-contain rounded border border-white/20 shadow-2xl"
            />
            <div className="mt-3 text-white text-center text-xs max-w-2xl bg-black/60 px-4 py-2 rounded">
              <p className="font-semibold">{currentImage.label}</p>
              <p className="text-white/70 text-[11px] mt-0.5">
                {currentImage.alt}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RentReview;