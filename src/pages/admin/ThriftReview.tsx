import React, { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { fetchAdminDashboardData } from "../../services/admin.api";

export type ThriftReviewStatus = "PENDING" | "APPROVED" | "REJECTED";

interface InspectionAngle {
  title: string;
  note: string;
  url: string;
  alt: string;
  scoreTag?: string;
}

interface ThriftDossierData {
  id: string;
  sku: string;
  lotNumber: string;
  title: string;
  categoryHierarchy: string;
  proposedPrice: number;
  conditionGrade: string;
  conditionNote: string;
  wearNote: string;
  shutterAccuracyNote: string;
  benchNotes: string;
  editorialCopy: string;
  shippingProtocol: string;
  originType: "SECOND_LIFE" | "SHOP_INVENTORY";
  originLabel: string;
  originBadge: string;
  rentDossierSku?: string;
  rentDossierLink?: string;
  inventoryCode?: string;
  cyclesCompleted?: string;
  returnReceipt?: string;
  carbonSavedNote?: string;
  shopName: string;
  shopCode: string;
  legalRepresentative: string;
  shopRating: number;
  rentHistoryCount: number;
  thriftHistoryCount: number;
  disputeRate: string;
  serialNumber: string;
  mainImage: string;
  angles: InspectionAngle[];
}

const DEFAULT_THRIFT_DOSSIER: ThriftDossierData = {
  id: "9021",
  sku: "#HB-THF-9021",
  lotNumber: "#TH-9021",
  title: "Leica M6 Classic 0.72x Rangefinder Body (Black Chrome)",
  categoryHierarchy: "Cameras & Optics / Analog 35mm Rangefinder",
  proposedPrice: 68500000,
  conditionGrade: "Pristine 9.2",
  conditionNote: "Bảo dưỡng CLA chuẩn Wetzlar (2024)",
  wearNote: "Mòn Lộ Đồng Nhẹ (Light Brassing) tại hai khuyên đeo quai kim loại",
  shutterAccuracyNote: "±0.02 ms (Chuẩn ISO) - Đã đo xung kích từ 1s tới 1/1000s",
  benchNotes:
    "“Cơ cấu màn trập cơ khí hoạt động chuẩn xác từ 1s đến 1/1000s (độ lệch sai số ±0.02ms chuẩn Wetzlar). Thấu kính ngắm kép collimator sáng rõ 100%, không mờ đục hay nấm mốc. Bọc da vulcanite nguyên bản không co ngót. Nắp đáy dán tem niêm phong chống tháo mở từ xưởng lưu ký.”",
  editorialCopy:
    "Phiên bản máy ảnh rangefinder cơ khí huyền thoại Leica M6 Classic 0.72x hoàn thiện Black Chrome sản xuất năm 1998 tại Đức. Phù hợp cho cả sưu tầm và chụp phim chuyên nghiệp. Đi kèm dây đeo da thuộc thảo mộc, nắp body kim loại nguyên bản và chứng thư lưu ký tuần hoàn.",
  shippingProtocol:
    "Insured White-Glove Armored Courier: Đóng thùng gỗ chuyên dụng chống sốc Nanuk, niêm phong mã QR và bảo hiểm mất mát 100% qua Smart Escrow. Bàn giao trực tiếp có đối chiếu căn cước người nhận.",
  originType: "SECOND_LIFE",
  originLabel: "Converted from Returned RENT Inventory",
  originBadge: "(Second Life Transition Item)",
  rentDossierSku: "Leica M6 Fleet (#RNT-4920)",
  rentDossierLink: "/admin/rent/listings/rent-3",
  inventoryCode: "#INV-HB907-01",
  cyclesCompleted: "14 chu kỳ (112 ngày lưu hành)",
  returnReceipt: "Biên bản số #RT-4091",
  carbonSavedNote: "Tiết kiệm 8.4kg CO₂e so với sản xuất thân máy máy ảnh cơ mới",
  shopName: "Kyoto Archival Optics",
  shopCode: "#SHP-0418",
  legalRepresentative: "Vũ Thanh Tùng",
  shopRating: 4.98,
  rentHistoryCount: 184,
  thriftHistoryCount: 42,
  disputeRate: "0.0% (Zero Disputes)",
  serialNumber: "SN-LC-M6-2481902",
  mainImage:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuAv78MoMHdgiJ4A0jufxU93fFs5TH0geQMvMSYVJwM9AuYenM5nygPPjheTRN1JzqF-LPW_JGhMH-DfD78YfMZX65jKsP7ddnAekp90-Z5XT37HyRkbViRa9mPWRaxwzHScMYakJt5GW0ER2qGkWylEE89b8rzE15TkcedYAJbMrmifldbKZ3q10LE3PZIDA7i0RNfukbjj4I_j01BpNaAAJURTJfogTwENdvkx3VF2",
  angles: [
    {
      title: "1. Mặt Trước (9.8/10)",
      note: "Kính ngắm kép Collimator: Độ sáng đạt 100% • Khung viền ngắm 28/90mm chuẩn khớp",
      url: "https://lh3.googleusercontent.com/aida-public/AB6AXuAxPK58Lum07EZg1yUHqjxH6z5cjNsyZwGPshQZXT9CCVrSHhFtRqUF5vikpSnSXQxfXW4lqD8mUIgYdb5tTSUEPpLmtD5AYDf_wELBCILHZ5o3_04ghdJ3KqxY_aI0rroKEstqp767EryJGk8zl_6jpbyeMeG2xebDWnYUUmW-yNwuiazfCEiDdhUNmDmezAMPIP4NW-AR8DLi4EgQ0CkwbtzhbMarFA2cbfrqhzza",
      alt: "High-resolution direct front face view of Leica M6 rangefinder showing spotless optical glass, black chrome finish, and red circular logo.",
      scoreTag: "9.8/10",
    },
    {
      title: "2. Khắc Seri #2481902",
      note: "Số seri #2481902 đối chiếu khớp 100% với hồ sơ xuất xưởng Wetzlar năm 1998",
      url: "https://lh3.googleusercontent.com/aida-public/AB6AXuBzwdPO2EYXUFrEAYijnYghnwqARg9coCpbRJTSMDz_LkKSg5021Ax2tb7O66acCICi19DeQm1fDv-ztETJXksal5JLCGYYfDMYiRO3X9cxacKoxW_3iSasDVyYePtF0pqcV4cTQoB4pceuZWx2qhnU_v6ZPt6Z68RsLVHoLZCtJciJP6D3OxHdsDjVBftYuo93tyctOgx0ZWOMPEQxVSSF-8sBVPT9RcNaLjpVsz6T",
      alt: "Macro detail of camera baseplate showing engraved serial number 2481902 sharp engraving and intact bottom latch.",
      scoreTag: "Seri Khớp",
    },
    {
      title: "3. Màn Trập & Buồng Film",
      note: "Vải màn trập cao su nguyên bản không nứt rách • Đệm mút chắn sáng còn độ đàn hồi tối ưu",
      url: "https://lh3.googleusercontent.com/aida-public/AB6AXuBUMYYJmBQDv8UE1G24SqS8uw2mrCwzWAibceJQz_HPBVHzDu9JRRGkJpTRrEFzykOcVt5jFpaVlXtxRha6a-ai5zsGXSaY59T38PAnavlBIjq_4WhO4Zup9hWKMp6_cSGdZTVxcae3OOwu2BishwK9Xd3D38L0Dua2fem4MqUGycjW0_QDKASRrmM-TuODqekJ3fXecLvbJAZHkzEvqSweLsu0F-LaCOdggRfXq2y4",
      alt: "Open film compartment showing spotless rubberized cloth horizontal shutter curtain and clean guide rails of vintage camera.",
      scoreTag: "Kín Sáng",
    },
    {
      title: "4. Cụm Núm Vặn Cơ Khí",
      note: "Các nấc xoay tốc độ nảy đanh, không trượt bước • Đèn LED đo sáng buồng ngắm phản hồi chính xác",
      url: "https://lh3.googleusercontent.com/aida-public/AB6AXuB37rQYS9HkXjSQR5fZEKfgbPsZ1O4-fhIwlKlCb3P4SwqpvUxFaCPMbN8cv1R5PaahQW5sAZsBdHCRukLUZPYJ3TUj9vREHAHdrEP3VmOK_uYR5WNgcSbHPWdTIWLj6QxtAhGptUh1HzgNu211Btg4eij4nUNA_-3FN_9ZT0MDoksIcswDuUn9noaWj38F5xVENuiiiBnt7RV5eH8I-47vGIs2jpYx4yVMxG-nNSBG",
      alt: "Top plate dial inspection of Leica M6 rangefinder showing shutter speed dials, ISO film sensitivity indicator, and hot shoe.",
      scoreTag: "Cơ Học 100%",
    },
    {
      title: "5. Chứng Thư Giám Định",
      note: "Tem lưu ký #RH-902 hợp lệ • Biên bản thu hồi kho RENT #RT-4091 đã được số hóa",
      url: "https://lh3.googleusercontent.com/aida-public/AB6AXuCP2GzMDCVu_vMXAIoisynL4Yr6Y7wA3DpDUttFIXTxByiwDXYTVKvORAS2zxwUwTi1_YZCYDA4HddvCO5gmM0LnsIaQ321wSNc8rkokvu-fC3uWANNvmcCZsWn0iJPPkDk-51mq1C5qSrB9x3JP1XoSN9ktlGwBnFJ_Q9BPlFgrrayaUDDmqGX5Zb501CY-se_PqJxTmVr-X7pXDYH3gkqqcwfKZwDeDDs7_AtKgHM",
      alt: "Official archival certificate of provenance and inspection test card from workshop printed on heavy ivory cotton paper.",
      scoreTag: "Chứng Thư B-Corp",
    },
  ],
};

const THRIFT_METADATA_LOOKUP: Record<string, Partial<ThriftDossierData>> = {
  "9021": {
    sku: "#HB-THF-9021",
    lotNumber: "#TH-9021",
    title: "Leica M6 Classic 0.72x Rangefinder Body (Black Chrome)",
    categoryHierarchy: "Cameras & Optics / Analog 35mm Rangefinder",
    proposedPrice: 68500000,
    conditionGrade: "Pristine 9.2",
    conditionNote: "Bảo dưỡng CLA chuẩn Wetzlar (2024)",
    originType: "SECOND_LIFE",
    originLabel: "Converted from Returned RENT Inventory",
    shopName: "Kyoto Archival Optics",
    shopCode: "#SHP-0418",
  },
  "9022": {
    sku: "#HB-THF-9022",
    lotNumber: "#TH-9022",
    title: "Hasselblad 503CW + Planar 80mm f/2.8 T* Professional Kit",
    categoryHierarchy: "Cameras & Optics / Medium Format Analog",
    proposedPrice: 112000000,
    conditionGrade: "Mint 9.7",
    conditionNote: "Full Box & Giấy chứng sinh gốc",
    originType: "SHOP_INVENTORY",
    originLabel: "Consigned Shop Inventory",
    originBadge: "(Direct Consignment Vault)",
    shopName: "Saigon Cinema Vault",
    shopCode: "#SHP-0881",
    legalRepresentative: "Hồ Trọng Đạt",
    serialNumber: "SN-HB-503CW-99120",
  },
  "8840": {
    sku: "#HB-THF-8840",
    lotNumber: "#TH-8840",
    title: "Contax T2 Titanium Black Edition (Carl Zeiss Sonnar 38mm)",
    categoryHierarchy: "Cameras & Optics / Luxury Compact Film",
    proposedPrice: 32500000,
    conditionGrade: "Excellent 8.8",
    conditionNote: "Clean optics, không giật màng trập",
    originType: "SECOND_LIFE",
    originLabel: "Converted from Returned RENT Inventory",
    originBadge: "(Second Life Transition Item)",
    shopName: "Da Nang Camera Hub",
    shopCode: "#SHP-0209",
    legalRepresentative: "Lê Minh Châu",
    serialNumber: "SN-CTX-T2-08819",
  },
  "8701": {
    sku: "#HB-THF-8701",
    lotNumber: "#TH-8701",
    title: "Omega Speedmaster Professional Moonwatch 'Hesalite'",
    categoryHierarchy: "Đồng hồ & Horology / Chronograph",
    proposedPrice: 145000000,
    conditionGrade: "Pristine 9.5",
    conditionNote: "Chưa qua đánh bóng, sai số +2s/ngày",
    originType: "SHOP_INVENTORY",
    originLabel: "Consigned Shop Inventory",
    originBadge: "(Direct Consignment Vault)",
    shopName: "Atelier Silvergrain",
    shopCode: "#SHP-0504",
    legalRepresentative: "Trần Khang Ninh",
    serialNumber: "SN-OMG-SPM-481920",
  },
};

export const ThriftReview: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const [dossier, setDossier] = useState<ThriftDossierData>(() => {
    if (id && THRIFT_METADATA_LOOKUP[id]) {
      return { ...DEFAULT_THRIFT_DOSSIER, ...THRIFT_METADATA_LOOKUP[id], id };
    }
    return DEFAULT_THRIFT_DOSSIER;
  });
  const [currentStatus, setCurrentStatus] = useState<ThriftReviewStatus>("PENDING");
  const [activeViewIndex, setActiveViewIndex] = useState<number>(0);
  const [isFading, setIsFading] = useState<boolean>(false);

  // 6 Criteria Checklist State
  const [checklist, setChecklist] = useState({
    images: true,
    description: true,
    condition: true,
    priceAlignment: true,
    circularSource: true,
    category: true,
  });

  // Rejection Dialog State
  const [isRejectModalOpen, setIsRejectModalOpen] = useState<boolean>(false);
  const [rejectionReasonKey, setRejectionReasonKey] = useState<string>("grade");
  const [rejectionDetailedNote, setRejectionDetailedNote] = useState<string>("");

  // Feedback Notification Toast
  const [toast, setToast] = useState<{
    visible: boolean;
    isError: boolean;
    message: string;
  }>({
    visible: false,
    isError: false,
    message: "",
  });

  const showToast = (message: string, isError = false) => {
    setToast({ visible: true, isError, message });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    }, 4000);
  };

  // Sync with route id if matched
  useEffect(() => {
    let isMounted = true;

    // Attempt to load from MongoDB backend if available
    fetchAdminDashboardData()
      .then((data) => {
        if (!isMounted || !data || !Array.isArray(data.thriftCatalogList)) return;
        const matched = data.thriftCatalogList.find(
          (item) => item.id === id || item.slug === id
        );
        if (matched) {
          setDossier((prev) => ({
            ...prev,
            id: matched.id,
            sku: `#HB-THF-${matched.id.slice(-4).toUpperCase()}`,
            title: matched.name || prev.title,
            proposedPrice: matched.price || prev.proposedPrice,
            conditionGrade: matched.condition || prev.conditionGrade,
            shopName: matched.sellerName || prev.shopName,
            legalRepresentative: matched.sellerName || prev.legalRepresentative,
            mainImage:
              matched.images && matched.images.length > 0
                ? matched.images[0]
                : prev.mainImage,
          }));

          if (matched.status === "APPROVED") {
            setCurrentStatus("APPROVED");
          } else if (matched.status === "REJECTED") {
            setCurrentStatus("REJECTED");
          }
        }
      })
      .catch((err) => {
        console.warn("Lỗi khi tải thông tin chi tiết THRIFT từ API:", err);
      });

    return () => {
      isMounted = false;
    };
  }, [id]);

  const handleSwitchInspectionView = (index: number) => {
    if (index === activeViewIndex) return;
    setIsFading(true);
    setTimeout(() => {
      setActiveViewIndex(index);
      setIsFading(false);
    }, 150);
  };

  const currentAngle = dossier.angles[activeViewIndex] || dossier.angles[0];

  const handleApprove = () => {
    const proceed = window.confirm(
      `Xác nhận PHÊ DUYỆT mục đăng THRIFT ${dossier.sku} (${dossier.title})?\n\nHệ thống sẽ cấp chứng thư số tuần hoàn và công khai mục đăng trên sàn giao dịch.`
    );
    if (proceed) {
      setCurrentStatus("APPROVED");
      showToast(`Đã phê duyệt niêm yết ${dossier.sku} thành công. Chứng thư tuần hoàn đã phát hành.`);
    }
  };

  const handleConfirmRejection = () => {
    const reasonText = rejectionDetailedNote.trim();
    const reasonSummary = reasonText ? ` (${reasonText})` : "";
    setIsRejectModalOpen(false);
    setCurrentStatus("REJECTED");
    showToast(
      `Đã gửi văn bản từ chối niêm yết ${dossier.sku}${reasonSummary} và yêu cầu hiệu chỉnh tới Chủ Xưởng ${dossier.shopName}.`,
      true
    );
  };

  const completedChecksCount = Object.values(checklist).filter(Boolean).length;
  const progressPercent = Math.round((completedChecksCount / 6) * 100);

  return (
    <div className="w-full bg-[#fdf8f5] font-sans text-[#1c1b19] min-h-screen antialiased pb-12 selection:bg-[#caebc9] selection:text-[#05210c]">
      {/* ================= TOP BREADCRUMB & CONTEXTUAL APPRAISAL BAR ================= */}
      <section className="w-full bg-[#f7f3ef] px-4 sm:px-8 lg:px-12 py-3.5 border-b border-[#cfc5b8]/30 sticky top-16 z-30 backdrop-blur-md">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <Link
              to="/admin/dashboard"
              className="text-[#4c463c] hover:text-[#6c5937] transition-colors flex items-center gap-1 font-medium"
            >
              <span className="material-symbols-outlined text-[15px]">
                admin_panel_settings
              </span>
              <span>Admin</span>
            </Link>
            <span className="text-[#cfc5b8] font-normal">/</span>
            <Link
              to="/admin/thrift/listings"
              className="text-[#4c463c] hover:text-[#6c5937] transition-colors font-medium"
            >
              THRIFT Listings
            </Link>
            <span className="text-[#cfc5b8] font-normal">/</span>
            <span className="text-[#6c5937] font-semibold tracking-wider flex items-center gap-1">
              <span>HỒ SƠ GIÁM ĐỊNH #{id ? id.toUpperCase() : "TH-88219"}</span>
              <span className="text-[#7e766a] text-[11px] font-normal font-mono">
                (LOT {dossier.lotNumber})
              </span>
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
            <Link
              to="/admin/thrift/listings"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#ffffff] text-[#1c1b19] hover:bg-[#f2ede9] transition-colors text-xs font-semibold shadow-xs border border-[#cfc5b8]/30"
            >
              <span className="material-symbols-outlined text-[16px]">
                arrow_back
              </span>
              <span>Quay Lại Sổ Bộ THRIFT</span>
            </Link>

            <Link
              to={`/thrift/products/${dossier.id}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#ece7e4] text-[#1c1b19] hover:bg-[#e6e2de] transition-colors text-xs font-semibold shadow-xs"
            >
              <span>Bản Hiển Thị Khách Hàng</span>
              <span className="material-symbols-outlined text-[15px]">
                open_in_new
              </span>
            </Link>

            {/* Status Pill */}
            {currentStatus === "PENDING" && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded bg-[#f9dfb3]/40 text-[#261901] text-xs uppercase tracking-wider font-semibold border border-[#dcc399]/50 shadow-xs">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#6c5937] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#6c5937]"></span>
                </span>
                <span>CHỜ THẨM ĐỊNH (PENDING REVIEW)</span>
              </div>
            )}

            {currentStatus === "APPROVED" && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded bg-[#caebc9] text-[#314d34] text-xs uppercase tracking-wider font-semibold border border-[#caebc9] shadow-xs">
                <span className="w-2 h-2 rounded-full bg-[#48654b]"></span>
                <span>ĐÃ PHÊ DUYỆT (APPROVED)</span>
              </div>
            )}

            {currentStatus === "REJECTED" && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded bg-[#ffdad6] text-[#93000a] text-xs uppercase tracking-wider font-semibold border border-[#ffdad6] shadow-xs">
                <span className="w-2 h-2 rounded-full bg-[#ba1a1a]"></span>
                <span>BỊ TỪ CHỐI (REJECTED)</span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ================= MAIN DOSSIER WORKBENCH (Split 64% / 36%) ================= */}
      <div className="w-full px-4 sm:px-8 lg:px-12 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* ======================================================== */}
          {/* LEFT COLUMN: MASTER INSPECTION & METADATA (64% = 8 cols) */}
          {/* ======================================================== */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            {/* A. FORENSIC PHOTOGRAPHIC INSPECTION */}
            <div className="bg-[#ffffff] p-5 sm:p-6 rounded border border-[#cfc5b8]/30 shadow-xs flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <span className="text-[11px] tracking-widest text-[#6c5937] uppercase font-bold flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px]">
                      qr_code_2
                    </span>
                    BẰNG CHỨNG QUANG HỌC LƯU KHO • BENCHMARK PHOTOGRAMMETRY
                  </span>
                  <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#1c1b19] mt-0.5">
                    Giám Định Quang Học &amp; Niêm Phong Vật Lý
                  </h2>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs bg-[#f7f3ef] px-2.5 py-1 rounded text-[#48654b] font-semibold flex items-center gap-1 border border-[#cfc5b8]/30">
                    <span className="material-symbols-outlined text-[14px]">
                      verified_user
                    </span>{" "}
                    SHA-256 HASH VERIFIED
                  </span>
                  <span className="text-xs bg-[#f2ede9] text-[#4c463c] px-2.5 py-1 rounded font-medium">
                    RAW 4096×2730 px
                  </span>
                </div>
              </div>

              {/* Master Photographic Inspection Canvas */}
              <div className="relative w-full aspect-[16/10] bg-[#f7f3ef] rounded overflow-hidden flex items-center justify-center group border border-[#cfc5b8]/30">
                <img
                  id="mainInspectionImage"
                  src={currentAngle.url || dossier.mainImage}
                  alt={currentAngle.alt}
                  className={`w-full h-full object-cover transition-all duration-300 group-hover:scale-[1.02] ${
                    isFading ? "opacity-60" : "opacity-100"
                  }`}
                />

                {/* Forensic Overlays */}
                <div className="absolute top-3 left-3 bg-[#31302e]/85 backdrop-blur-sm text-[#f4f0ec] px-2.5 py-1 rounded text-xs flex items-center gap-1.5 shadow-sm">
                  <span className="material-symbols-outlined text-[14px] text-[#caebc9]">
                    lock_clock
                  </span>
                  <span>TEM NIÊM PHONG XƯỞNG: #RH-902 (INTACT)</span>
                </div>

                <div className="absolute top-3 right-3 bg-[#ffffff]/90 backdrop-blur-sm text-[#1c1b19] px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1 shadow-sm">
                  <span className="material-symbols-outlined text-[15px] text-[#6c5937]">
                    zoom_in
                  </span>
                  <span>LOUPE 8X INSPECTION ACTIVE</span>
                </div>

                <div className="absolute bottom-3 left-3 right-3 bg-[#31302e]/80 backdrop-blur-md text-[#f4f0ec] px-3 py-2 rounded flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 text-[11px] shadow-md">
                  <span className="flex items-center gap-1 font-medium truncate">
                    <span className="material-symbols-outlined text-[14px] text-[#ffdcc1]">
                      center_focus_strong
                    </span>
                    {currentAngle.note}
                  </span>
                  <span className="text-[#cfc5b8] font-mono text-[10px] shrink-0">
                    CALIBRATION PROTOCOL V3.8-ISO9001
                  </span>
                </div>
              </div>

              {/* Thumbnail Navigation Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                {dossier.angles.map((angle, idx) => {
                  const isSelected = activeViewIndex === idx;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSwitchInspectionView(idx)}
                      className={`flex flex-col gap-1 p-1 rounded text-left focus:outline-none transition-all border ${
                        isSelected
                          ? "bg-[#ece7e4] border-[#6c5937] ring-1 ring-[#6c5937]"
                          : "bg-[#f7f3ef] border-[#cfc5b8]/40 hover:bg-[#ece7e4] hover:border-[#6c5937]/50"
                      }`}
                    >
                      <div className="aspect-square w-full rounded overflow-hidden bg-[#f2ede9]">
                        <img
                          src={angle.url}
                          alt={angle.alt}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span
                        className={`text-[10px] uppercase tracking-wider truncate px-0.5 ${
                          isSelected
                            ? "text-[#1c1b19] font-bold"
                            : "text-[#4c463c] font-medium"
                        }`}
                        title={angle.title}
                      >
                        {angle.title}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* B. PRODUCT SPECIFICATIONS & TECHNICAL ATTRIBUTES */}
            <div className="bg-[#ffffff] p-5 sm:p-6 rounded border border-[#cfc5b8]/30 shadow-xs flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 pb-3 border-b border-[#cfc5b8]/20">
                <div>
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="px-2 py-0.5 bg-[#6c5937]/10 text-[#6c5937] rounded text-xs font-semibold uppercase font-mono">
                      SKU: {dossier.sku}
                    </span>
                    <span className="text-[#cfc5b8]">•</span>
                    <span className="text-xs text-[#4c463c]">
                      {dossier.categoryHierarchy}
                    </span>
                  </div>
                  <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#1c1b19] tracking-tight">
                    {dossier.title}
                  </h1>
                </div>

                <div className="sm:text-right shrink-0 bg-[#f7f3ef] p-3 rounded border border-[#cfc5b8]/30">
                  <span className="text-[11px] text-[#4c463c] uppercase tracking-wider block font-medium">
                    Giá Niêm Yết Đề Xuất
                  </span>
                  <div className="font-serif text-2xl font-bold text-[#6c5937] tracking-tight">
                    {dossier.proposedPrice.toLocaleString("vi-VN")} ₫
                  </div>
                  <span className="text-[11px] text-[#48654b] font-medium block">
                    Bao gồm VAT &amp; Phí Lưu Ký ReUse Hub
                  </span>
                </div>
              </div>

              {/* Appraisal Rating Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-[#f7f3ef] rounded border border-[#cfc5b8]/30">
                <div>
                  <span className="text-[11px] text-[#4c463c] uppercase block font-semibold">
                    Điểm Tình Trạng Cơ Học
                  </span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="font-serif text-xl font-bold text-[#1c1b19]">
                      {dossier.conditionGrade}
                    </span>
                    <span className="text-xs text-[#4c463c]">/ 10</span>
                  </div>
                  <span className="text-[11px] text-[#48654b] font-medium">
                    {dossier.conditionNote}
                  </span>
                </div>

                <div>
                  <span className="text-[11px] text-[#4c463c] uppercase block font-semibold">
                    Hao Mòn Ngoại Quan
                  </span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-xs font-bold text-[#1c1b19]">
                      {dossier.wearNote}
                    </span>
                  </div>
                  <span className="text-[11px] text-[#4c463c]">
                    Tại hai khuyên đeo quai kim loại
                  </span>
                </div>

                <div>
                  <span className="text-[11px] text-[#4c463c] uppercase block font-semibold">
                    Sai Số Màn Trập Cơ Khí
                  </span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-xs font-bold text-[#48654b]">
                      {dossier.shutterAccuracyNote}
                    </span>
                  </div>
                  <span className="text-[11px] text-[#4c463c]">
                    Đã đo xung kích từ 1s tới 1/1000s
                  </span>
                </div>
              </div>

              {/* Curatorial Notes & Narrative */}
              <div className="space-y-3 text-sm text-[#1c1b19] leading-relaxed">
                <div className="p-3.5 bg-[#f2ede9] rounded border border-[#cfc5b8]/30">
                  <span className="text-xs uppercase font-bold text-[#6c5937] block mb-1">
                    Ghi Chú Kiểm Định Trực Tiếp (Bench Condition Notes):
                  </span>
                  <p className="text-[#4c463c] italic text-xs leading-relaxed">
                    {dossier.benchNotes}
                  </p>
                </div>

                <div>
                  <span className="text-xs uppercase font-bold text-[#4c463c] block mb-1">
                    Mô Tả Sản Phẩm Của Chủ Xưởng (Listing Editorial Copy):
                  </span>
                  <p className="text-xs text-[#1c1b19] leading-relaxed">
                    {dossier.editorialCopy}
                  </p>
                </div>

                <div className="pt-1">
                  <span className="text-xs uppercase font-bold text-[#4c463c] block mb-1">
                    Quy Trình Giao Vận &amp; Lưu Ký (Shipping &amp; Transit Protocol):
                  </span>
                  <div className="flex items-start gap-2 bg-[#f7f3ef] p-3 rounded border border-[#cfc5b8]/30">
                    <span className="material-symbols-outlined text-[18px] text-[#6c5937] mt-0.5 shrink-0">
                      verified
                    </span>
                    <p className="text-[#4c463c] text-xs leading-relaxed">
                      <strong className="text-[#1c1b19]">
                        Insured White-Glove Armored Courier:
                      </strong>{" "}
                      {dossier.shippingProtocol}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* C. CIRCULAR SOURCE & ORIGIN HISTORY (CRITICAL AUDIT MODULE) */}
            <div className="bg-[#ffffff] p-5 sm:p-6 rounded border border-[#cfc5b8]/30 shadow-xs flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-1 border-b border-[#cfc5b8]/20">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded bg-[#48654b]/15 flex items-center justify-center text-[#48654b]">
                    <span className="material-symbols-outlined text-[20px]">
                      recycling
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] tracking-wider uppercase text-[#48654b] font-bold">
                      SỔ CÁI TUẦN HOÀN • PROVENANCE TRACEABILITY
                    </span>
                    <h3 className="font-serif text-lg font-bold text-[#1c1b19]">
                      Nguồn Gốc Hiện Vật &amp; Sổ Cái Tuần Hoàn
                    </h3>
                  </div>
                </div>
                <span className="px-2.5 py-1 bg-[#ece7e4] rounded text-[#4c463c] text-xs font-semibold flex items-center gap-1">
                  <span className="material-symbols-outlined text-[13px]">
                    lock
                  </span>
                  READ-ONLY AUDIT LEDGER
                </span>
              </div>

              {/* Source Badge & System Immutable Note */}
              <div className="bg-[#48654b]/10 p-3.5 rounded border border-[#48654b]/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="px-2.5 py-1 bg-[#48654b] text-[#ffffff] rounded text-xs uppercase tracking-wider font-semibold">
                    {dossier.originLabel}
                  </span>
                  <span className="text-xs text-[#48654b] font-bold">
                    {dossier.originBadge}
                  </span>
                </div>
                <span className="text-[11px] text-[#4c463c] italic">
                  Nguồn gốc được đối soát tự động từ sổ cái lưu ký - Admin không thể can thiệp chỉnh sửa
                </span>
              </div>

              {/* Provenance Lineage Timeline & Ledger Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                <div className="space-y-2 bg-[#f7f3ef] p-4 rounded border border-[#cfc5b8]/30">
                  <span className="text-xs uppercase text-[#4c463c] font-bold block">
                    Truy Nguyên Hồ Sơ Cho Thuê Gốc (Original RENT Dossier)
                  </span>
                  <div className="space-y-2 text-xs text-[#1c1b19]">
                    <div className="flex items-center justify-between">
                      <span className="text-[#4c463c]">Sản Phẩm RENT Gốc:</span>
                      <Link
                        to={dossier.rentDossierLink || "/admin/rent/listings"}
                        className="font-semibold text-[#6c5937] hover:underline flex items-center gap-0.5"
                      >
                        {dossier.rentDossierSku}
                        <span className="material-symbols-outlined text-[12px]">
                          open_in_new
                        </span>
                      </Link>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-[#4c463c]">Mã Định Danh Kho Cứng:</span>
                      <span className="font-mono font-medium">
                        {dossier.inventoryCode}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-[#4c463c]">Chu Kỳ Thuê Đã Hoàn Tất:</span>
                      <span className="font-semibold text-[#1c1b19]">
                        {dossier.cyclesCompleted}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-[#4c463c]">Hồ Sơ Thu Hồi:</span>
                      <span className="text-[#48654b] font-medium">
                        {dossier.returnReceipt}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 bg-[#f7f3ef] p-4 rounded border border-[#cfc5b8]/30">
                  <span className="text-xs uppercase text-[#4c463c] font-bold block">
                    Quyết Định Chuyển Giao B-Corp Circularity
                  </span>
                  <p className="text-xs text-[#4c463c] leading-relaxed">
                    Thiết bị đã hoàn tất kiểm định xưởng ngày <strong>24/10/2026</strong>. Khấu hao quang học đạt ngưỡng tối ưu để chuyển giao từ hệ sinh thái dịch vụ sang quyền sở hữu vĩnh viễn (THRIFT). Toàn bộ phụ kiện và cơ cấu quang học đã được cân chỉnh độc lập.
                  </p>
                  <div className="pt-1.5 flex items-center gap-1.5 text-xs text-[#48654b] font-medium">
                    <span className="material-symbols-outlined text-[15px]">
                      eco
                    </span>
                    <span>{dossier.carbonSavedNote}</span>
                  </div>
                </div>
              </div>

              {/* Comparison State Callout (Educational for Admins) */}
              <div className="p-3 bg-[#f2ede9] rounded border border-[#cfc5b8]/30 flex flex-col sm:flex-row sm:items-center justify-between text-[#4c463c] text-xs gap-2">
                <span className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-[#7e766a]">
                    info
                  </span>
                  <span>
                    <strong>Lưu ý nhận diện nguồn gốc:</strong> Với các sản phẩm ký gửi trực tiếp không qua cho thuê, hệ thống sẽ gán huy hiệu{" "}
                    <code className="bg-[#e6e2de] px-1.5 py-0.5 rounded text-[#1c1b19] font-mono text-[11px]">
                      Consigned Shop Inventory
                    </code>.
                  </span>
                </span>
                <span className="text-[10px] text-[#7e766a] uppercase font-semibold shrink-0">
                  PROTOCOL CIRC-V2
                </span>
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* RIGHT COLUMN: SHOP DOSSIER, CHECKLIST & ACTIONS (36% = 4 cols) */}
          {/* ======================================================== */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            {/* D. SHOP OWNER DOSSIER */}
            <div className="bg-[#ffffff] p-5 sm:p-6 rounded border border-[#cfc5b8]/30 shadow-xs flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider text-[#6c5937] font-bold">
                  HỒ SƠ CHỦ XƯỞNG (SHOP DOSSIER)
                </span>
                <span className="text-[10px] bg-[#caebc9] text-[#05210c] px-2 py-0.5 rounded font-bold">
                  TIER-3 SECURED
                </span>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded bg-[#ece7e4] flex items-center justify-center text-[#6c5937] shrink-0">
                  <span className="material-symbols-outlined text-[26px]">
                    camera
                  </span>
                </div>
                <div className="min-w-0">
                  <h4 className="font-serif text-base font-bold text-[#1c1b19] truncate">
                    {dossier.shopName}
                  </h4>
                  <span className="text-xs text-[#7e766a] block font-mono">
                    Mã Xưởng: {dossier.shopCode}
                  </span>
                  <span className="text-xs text-[#1c1b19] font-medium block mt-0.5">
                    Đại diện pháp lý: {dossier.legalRepresentative}
                  </span>
                </div>
              </div>

              {/* KYC & Trust Statistics Table */}
              <div className="space-y-2 bg-[#f7f3ef] p-3.5 rounded border border-[#cfc5b8]/30 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[#4c463c] flex items-center gap-1">
                    <span className="material-symbols-outlined text-[15px] text-[#48654b]">
                      verified
                    </span>
                    Trạng Thái KYC:
                  </span>
                  <span className="font-semibold text-[#48654b]">
                    Tier-3 Đã Xác Thực (FIDO2)
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[#4c463c] flex items-center gap-1">
                    <span className="material-symbols-outlined text-[15px] text-[#6c5937]">
                      stars
                    </span>
                    Điểm Tín Nhiệm Xưởng:
                  </span>
                  <span className="font-semibold text-[#1c1b19]">
                    {dossier.shopRating} ★ / 5.0
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[#4c463c] flex items-center gap-1">
                    <span className="material-symbols-outlined text-[15px] text-[#7e766a]">
                      history
                    </span>
                    Lịch Sử Tuần Hoàn:
                  </span>
                  <span className="font-medium text-[#1c1b19]">
                    {dossier.rentHistoryCount} đơn RENT • {dossier.thriftHistoryCount} THRIFT
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[#4c463c] flex items-center gap-1">
                    <span className="material-symbols-outlined text-[15px] text-[#48654b]">
                      shield
                    </span>
                    Tỷ Lệ Khiếu Nại / Tranh Chấp:
                  </span>
                  <span className="font-semibold text-[#48654b]">
                    {dossier.disputeRate}
                  </span>
                </div>
              </div>

              <Link
                to="/admin/users/shp-0418"
                className="w-full py-2 px-3 rounded bg-[#f2ede9] text-[#1c1b19] hover:bg-[#ece7e4] transition-colors text-xs font-semibold text-center flex items-center justify-center gap-1.5 shadow-xs"
              >
                <span className="material-symbols-outlined text-[16px]">
                  account_box
                </span>
                <span>Xem Hồ Sơ Chi Tiết Chủ Xưởng</span>
              </Link>
            </div>

            {/* E. REVIEW CHECKLIST (6 CRITERIA VERIFICATION) */}
            <div className="bg-[#ffffff] p-5 sm:p-6 rounded border border-[#cfc5b8]/30 shadow-xs flex flex-col gap-3.5">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider text-[#6c5937] font-bold">
                  BẢNG TIÊU CHÍ THẨM ĐỊNH (CHECKLIST)
                </span>
                <span className="text-xs text-[#48654b] font-bold">
                  {completedChecksCount}/6 HOÀN THÀNH
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-[#f2ede9] h-2 rounded overflow-hidden">
                <div
                  className="bg-[#48654b] h-full rounded transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>

              {/* Interactive Style Checklist Items */}
              <div className="space-y-1.5 text-xs">
                <label className="flex items-start gap-2.5 p-2 rounded hover:bg-[#f7f3ef] transition-colors cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checklist.images}
                    onChange={(e) =>
                      setChecklist({ ...checklist, images: e.target.checked })
                    }
                    className="mt-0.5 w-4 h-4 rounded text-[#48654b] accent-[#48654b]"
                  />
                  <div>
                    <strong className="text-[#1c1b19] block font-semibold">
                      1. Hình Ảnh Quang Học (Images)
                    </strong>
                    <span className="text-[#4c463c] text-[11px] block">
                      Đạt chuẩn 5 góc chụp sắc nét, có chi tiết vạch ngắm và buồng phim macro.
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 p-2 rounded hover:bg-[#f7f3ef] transition-colors cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checklist.description}
                    onChange={(e) =>
                      setChecklist({ ...checklist, description: e.target.checked })
                    }
                    className="mt-0.5 w-4 h-4 rounded text-[#48654b] accent-[#48654b]"
                  />
                  <div>
                    <strong className="text-[#1c1b19] block font-semibold">
                      2. Mô Tả Kỹ Thuật (Description)
                    </strong>
                    <span className="text-[#4c463c] text-[11px] block">
                      Đầy đủ niên đại sản xuất (1998 Đức), thông số collimator và phụ kiện đi kèm.
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 p-2 rounded hover:bg-[#f7f3ef] transition-colors cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checklist.condition}
                    onChange={(e) =>
                      setChecklist({ ...checklist, condition: e.target.checked })
                    }
                    className="mt-0.5 w-4 h-4 rounded text-[#48654b] accent-[#48654b]"
                  />
                  <div>
                    <strong className="text-[#1c1b19] block font-semibold">
                      3. Phân Hạng Khách Quan (Condition)
                    </strong>
                    <span className="text-[#4c463c] text-[11px] block">
                      Đánh giá 9.2/10 minh bạch vết mòn đồng ở khuyên đeo, kèm số đo sai số màn trập.
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 p-2 rounded hover:bg-[#f7f3ef] transition-colors cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checklist.priceAlignment}
                    onChange={(e) =>
                      setChecklist({ ...checklist, priceAlignment: e.target.checked })
                    }
                    className="mt-0.5 w-4 h-4 rounded text-[#48654b] accent-[#48654b]"
                  />
                  <div>
                    <strong className="text-[#1c1b19] block font-semibold">
                      4. Khung Định Giá (Price Alignment)
                    </strong>
                    <span className="text-[#4c463c] text-[11px] block">
                      Mức 68,500,000 ₫ nằm chính xác trong dải tham chiếu (65M - 72M ₫) của ReUse Hub.
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 p-2 rounded hover:bg-[#f7f3ef] transition-colors cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checklist.circularSource}
                    onChange={(e) =>
                      setChecklist({ ...checklist, circularSource: e.target.checked })
                    }
                    className="mt-0.5 w-4 h-4 rounded text-[#48654b] accent-[#48654b]"
                  />
                  <div>
                    <strong className="text-[#1c1b19] block font-semibold">
                      5. Nguồn Gốc Tuần Hoàn (Circular Source)
                    </strong>
                    <span className="text-[#4c463c] text-[11px] block">
                      Khớp nối tự động với kho RENT #RNT-4920 qua biên bản bàn giao #RT-4091.
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 p-2 rounded hover:bg-[#f7f3ef] transition-colors cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checklist.category}
                    onChange={(e) =>
                      setChecklist({ ...checklist, category: e.target.checked })
                    }
                    className="mt-0.5 w-4 h-4 rounded text-[#48654b] accent-[#48654b]"
                  />
                  <div>
                    <strong className="text-[#1c1b19] block font-semibold">
                      6. Phân Loại Danh Mục (Category)
                    </strong>
                    <span className="text-[#4c463c] text-[11px] block">
                      Định tuyến chuẩn phân khúc “Cameras &amp; Optics / Analog Rangefinder”.
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* F. PUBLIC PREVIEW CARD */}
            <div className="bg-[#f7f3ef] p-4 rounded border border-[#cfc5b8]/30 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[24px] text-[#6c5937]">
                  visibility
                </span>
                <div>
                  <span className="text-xs text-[#1c1b19] font-bold block leading-tight">
                    Xem Trước Giao Diện Mua Hàng
                  </span>
                  <span className="text-[11px] text-[#4c463c] block mt-0.5">
                    Mô phỏng trải nghiệm người sưu tầm trước khi mở bán
                  </span>
                </div>
              </div>

              <Link
                to={`/thrift/products/${dossier.id}`}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded bg-[#ffffff] text-[#1c1b19] hover:bg-[#e6e2de] transition-colors text-xs font-semibold shrink-0 flex items-center gap-1 shadow-xs border border-[#cfc5b8]/30"
              >
                <span>Mở Bản Xem</span>
                <span className="material-symbols-outlined text-[14px]">
                  launch
                </span>
              </Link>
            </div>

            {/* G. ADMIN GOVERNANCE & AUDIT ACTIONS */}
            <div className="bg-[#ffffff] p-5 sm:p-6 rounded border border-[#cfc5b8]/30 shadow-sm flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-[#6c5937]">
                  gavel
                </span>
                <span className="text-xs uppercase tracking-wider text-[#6c5937] font-bold">
                  QUY CHUẨN THẨM QUYỀN QUẢN TRỊ
                </span>
              </div>

              {/* Governance Policy Reminder Callout */}
              <div className="p-3 bg-[#ece7e4] rounded text-xs text-[#4c463c] leading-relaxed border border-[#cfc5b8]/30">
                <strong className="text-[#1c1b19] block mb-0.5">
                  Nguyên Tắc Quản Trị Hệ Thống:
                </strong>
                Quản trị viên chỉ có thẩm quyền <strong>Phê duyệt (Approve)</strong> hoặc{" "}
                <strong>Từ chối (Reject)</strong> niêm yết theo hồ sơ hiện vật. Chủ Xưởng giữ toàn quyền sở hữu và hiệu chỉnh nội dung mục đăng. Quản trị viên tuyệt đối không trực tiếp chỉnh sửa văn bản của đối tác.
              </div>

              {/* Major Action CTAs */}
              <div className="flex flex-col gap-2 pt-1">
                {/* Approve Button */}
                <button
                  type="button"
                  onClick={handleApprove}
                  className="w-full py-3 px-4 bg-[#31302e] hover:bg-[#6c5937] text-[#f4f0ec] transition-colors rounded text-xs font-bold tracking-wide uppercase flex items-center justify-center gap-2 shadow-xs"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    verified
                  </span>
                  <span>Phê Duyệt Niêm Yết (Approve Listing)</span>
                </button>

                {/* Reject Button (Triggers Dialog) */}
                <button
                  type="button"
                  onClick={() => setIsRejectModalOpen(true)}
                  className="w-full py-2.5 px-4 bg-[#ffdad6] hover:bg-[#ba1a1a] hover:text-[#ffffff] text-[#93000a] transition-colors rounded text-xs font-bold tracking-wide uppercase flex items-center justify-center gap-2 shadow-xs"
                >
                  <span className="material-symbols-outlined text-[18px]">
                    block
                  </span>
                  <span>Từ Chối Niêm Yết (Reject Listing)</span>
                </button>

                {/* Reset button if already decided */}
                {currentStatus !== "PENDING" && (
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentStatus("PENDING");
                      showToast("Đã đặt lại trạng thái hồ sơ về Chờ Thẩm Định (PENDING).");
                    }}
                    className="w-full py-1 text-center text-[#6c5937] hover:underline text-xs font-semibold flex items-center justify-center gap-1 mt-1"
                  >
                    <span className="material-symbols-outlined text-[14px]">
                      restart_alt
                    </span>
                    <span>Đặt Lại Trạng Thái Chờ Duyệt</span>
                  </button>
                )}

                <Link
                  to="/admin/thrift/listings"
                  className="w-full py-2 text-center text-[#4c463c] hover:text-[#1c1b19] text-xs transition-colors block mt-1 underline underline-offset-4 font-medium"
                >
                  ← Quay lại danh sách chờ duyệt THRIFT
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. IN-PAGE REJECTION MODAL / DIALOG                     */}
      {/* ======================================================== */}
      {isRejectModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#31302e]/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#ffffff] max-w-xl w-full rounded p-6 shadow-xl flex flex-col gap-4 border border-[#cfc5b8]/40">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-3 border-b border-[#ece7e4]">
              <div>
                <span className="text-xs uppercase tracking-wider text-[#ba1a1a] font-bold flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">
                    assignment_late
                  </span>
                  BIÊN BẢN TỪ CHỐI NIÊM YẾT
                </span>
                <h3 className="font-serif text-lg font-bold text-[#1c1b19] mt-0.5">
                  Từ Chối Mục Đăng THRIFT {dossier.lotNumber} ({dossier.sku})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsRejectModalOpen(false)}
                className="p-1 rounded text-[#7e766a] hover:text-[#1c1b19] hover:bg-[#f2ede9] transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">
                  close
                </span>
              </button>
            </div>

            <p className="text-xs text-[#4c463c] leading-relaxed">
              Chọn lý do quy chuẩn để hệ thống tự động thông báo và hướng dẫn Chủ Xưởng{" "}
              <strong>{dossier.shopName}</strong> bổ sung hoặc hiệu chỉnh hồ sơ giám định:
            </p>

            {/* Rejection Reasons Radio Group */}
            <div className="space-y-2 text-xs">
              <label
                className={`flex items-start gap-2.5 p-2.5 rounded cursor-pointer transition-colors border ${
                  rejectionReasonKey === "img"
                    ? "bg-[#ece7e4] border-[#6c5937]"
                    : "bg-[#f7f3ef] border-transparent hover:bg-[#ece7e4]"
                }`}
              >
                <input
                  type="radio"
                  name="rejectionReason"
                  value="img"
                  checked={rejectionReasonKey === "img"}
                  onChange={() => setRejectionReasonKey("img")}
                  className="mt-0.5 text-[#6c5937] accent-[#6c5937]"
                />
                <div>
                  <strong className="text-[#1c1b19] block">
                    Hình ảnh không đạt chuẩn quang học
                  </strong>
                  <span className="text-[#4c463c] text-[11px]">
                    Ảnh mờ, thiếu góc chụp mặt đáy, buồng màn trập hoặc tem niêm phong không nguyên vẹn.
                  </span>
                </div>
              </label>

              <label
                className={`flex items-start gap-2.5 p-2.5 rounded cursor-pointer transition-colors border ${
                  rejectionReasonKey === "grade"
                    ? "bg-[#ece7e4] border-[#6c5937]"
                    : "bg-[#f7f3ef] border-transparent hover:bg-[#ece7e4]"
                }`}
              >
                <input
                  type="radio"
                  name="rejectionReason"
                  value="grade"
                  checked={rejectionReasonKey === "grade"}
                  onChange={() => setRejectionReasonKey("grade")}
                  className="mt-0.5 text-[#6c5937] accent-[#6c5937]"
                />
                <div>
                  <strong className="text-[#1c1b19] block">
                    Sai lệch phân hạng tình trạng hoặc thiếu mô tả khuyết tật
                  </strong>
                  <span className="text-[#4c463c] text-[11px]">
                    Điểm tình trạng cơ học thực tế không tương xứng với khai báo hoặc che giấu vết xước.
                  </span>
                </div>
              </label>

              <label
                className={`flex items-start gap-2.5 p-2.5 rounded cursor-pointer transition-colors border ${
                  rejectionReasonKey === "price"
                    ? "bg-[#ece7e4] border-[#6c5937]"
                    : "bg-[#f7f3ef] border-transparent hover:bg-[#ece7e4]"
                }`}
              >
                <input
                  type="radio"
                  name="rejectionReason"
                  value="price"
                  checked={rejectionReasonKey === "price"}
                  onChange={() => setRejectionReasonKey("price")}
                  className="mt-0.5 text-[#6c5937] accent-[#6c5937]"
                />
                <div>
                  <strong className="text-[#1c1b19] block">
                    Định giá vượt quá khung thị trường đồ thứ cấp
                  </strong>
                  <span className="text-[#4c463c] text-[11px]">
                    Mức giá đề xuất vượt trên 15% biên độ giao dịch tham chiếu của mạng lưới ReUse Hub.
                  </span>
                </div>
              </label>

              <label
                className={`flex items-start gap-2.5 p-2.5 rounded cursor-pointer transition-colors border ${
                  rejectionReasonKey === "serial"
                    ? "bg-[#ece7e4] border-[#6c5937]"
                    : "bg-[#f7f3ef] border-transparent hover:bg-[#ece7e4]"
                }`}
              >
                <input
                  type="radio"
                  name="rejectionReason"
                  value="serial"
                  checked={rejectionReasonKey === "serial"}
                  onChange={() => setRejectionReasonKey("serial")}
                  className="mt-0.5 text-[#6c5937] accent-[#6c5937]"
                />
                <div>
                  <strong className="text-[#1c1b19] block">
                    Thông tin nguồn gốc hoặc số serial không khớp hồ sơ RENT
                  </strong>
                  <span className="text-[#4c463c] text-[11px]">
                    Dữ liệu thu hồi thiết bị có dấu hiệu không đồng nhất với hiện vật thực tế.
                  </span>
                </div>
              </label>

              <label
                className={`flex items-start gap-2.5 p-2.5 rounded cursor-pointer transition-colors border ${
                  rejectionReasonKey === "other"
                    ? "bg-[#ece7e4] border-[#6c5937]"
                    : "bg-[#f7f3ef] border-transparent hover:bg-[#ece7e4]"
                }`}
              >
                <input
                  type="radio"
                  name="rejectionReason"
                  value="other"
                  checked={rejectionReasonKey === "other"}
                  onChange={() => setRejectionReasonKey("other")}
                  className="mt-0.5 text-[#6c5937] accent-[#6c5937]"
                />
                <div>
                  <strong className="text-[#1c1b19] block">
                    Lý do khác (Nhập chi tiết biên bản bên dưới)
                  </strong>
                  <span className="text-[#4c463c] text-[11px]">
                    Cần Chủ xưởng liên hệ bộ phận giám định đặc biệt để xử lý.
                  </span>
                </div>
              </label>
            </div>

            {/* Specific Rejection Notes Textarea */}
            <div className="space-y-1">
              <label
                className="text-xs font-semibold uppercase text-[#1c1b19] block"
                htmlFor="rejectionDetailedNoteText"
              >
                Lý Do Từ Chối Cụ Thể (Detailed Administrative Note):
              </label>
              <textarea
                id="rejectionDetailedNoteText"
                value={rejectionDetailedNote}
                onChange={(e) => setRejectionDetailedNote(e.target.value)}
                placeholder="Nhập ghi chú chi tiết để Chủ Xưởng hiểu rõ điểm cần bổ sung (ví dụ: Vui lòng chụp rõ số serial dưới đáy thân máy và ghi rõ tình trạng rêu mốc của kính collimator)..."
                rows={3}
                className="w-full p-2.5 bg-[#f7f3ef] text-[#1c1b19] rounded text-xs focus:outline-none focus:ring-1 focus:ring-[#ba1a1a] border border-[#cfc5b8]/50 transition-colors resize-none"
              />
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#ece7e4]">
              <button
                type="button"
                onClick={() => setIsRejectModalOpen(false)}
                className="px-4 py-2 rounded bg-[#f2ede9] text-[#1c1b19] hover:bg-[#ece7e4] text-xs font-semibold transition-colors"
              >
                Hủy Bỏ (Cancel)
              </button>
              <button
                type="button"
                onClick={handleConfirmRejection}
                className="px-4 py-2 rounded bg-[#ba1a1a] text-[#ffffff] hover:opacity-90 text-xs font-bold uppercase tracking-wider transition-opacity flex items-center gap-1.5 shadow-xs"
              >
                <span className="material-symbols-outlined text-[16px]">
                  send
                </span>
                <span>Xác Nhận Từ Chối &amp; Gửi Chủ Xưởng</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= NOTIFICATION TOAST CONTAINER ================= */}
      {toast.visible && (
        <div className="fixed bottom-6 right-6 z-50 animate-fade-in pointer-events-auto">
          <div className="px-4 py-3 rounded bg-[#31302e] text-[#f4f0ec] shadow-xl flex items-center gap-2 text-xs font-medium border border-[#cfc5b8]/40">
            <span
              className={`material-symbols-outlined text-[20px] ${
                toast.isError ? "text-[#ffdad6]" : "text-[#caebc9]"
              }`}
            >
              {toast.isError ? "warning" : "check_circle"}
            </span>
            <span>{toast.message}</span>
            <button
              type="button"
              onClick={() => setToast((prev) => ({ ...prev, visible: false }))}
              className="ml-2 text-[#cfc5b8] hover:text-white"
            >
              <span className="material-symbols-outlined text-[16px]">
                close
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ThriftReview;