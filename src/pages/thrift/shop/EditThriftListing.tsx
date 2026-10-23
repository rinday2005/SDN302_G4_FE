import React, { useState, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { ThriftListingItem } from '../../data/shop/thriftListingsData';
import {
  THRIFT_LISTINGS_STORAGE_KEY,
  INITIAL_THRIFT_LISTINGS,
} from '../../data/shop/thriftListingsData';

interface InspectionPhotoItem {
  id: string;
  url: string;
  badge: string;
  label: string;
}

const DEFAULT_EDIT_PHOTOS: InspectionPhotoItem[] = [
  {
    id: 'hero',
    url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBKHzKrsl9l3FKzqhrDBkKFb6Osz39x_IOPSqI6MgEFvkymXCOpQv186MuQsCFAFtI8FKq0Wox06VIkJqaMTcm3T7Lnb0-_RTo7URBDF_avKF9NIkPgb8iikaRCsvmor8EcWzoO839eYOdSN2odgCBoXlO2YbQm2iq_kWQh23yidbZH2Z-nIvGW2qnDiq_c-wZ0AlMLQ0FqcBeQwflbf_LeImzRfO3-FaBfNqWd-FB4',
    badge: 'Ảnh bìa',
    label: 'Ảnh đại diện chính diện máy',
  },
  {
    id: 'sensor',
    url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAmiswnBMAPtU9XvnZ6ip2Qa4kak62FuELiMw40yRRTx3uOPmN69Z0wMPzIsQdQKXj08b7r2c8inE9eKoZZ0t02mPplGd31xuUzChUPdsi9cArjalzrRW8Sf5e8Tl-NsTLyO0rhiBwn8FlEsURnrUbKDWNJJ5qyVmNF74fAv_L9j8PTeFp74oieNtdgyTK8GaIXOD9aLLeWaDHCpoWp52vTf81dYaLbycfDwIKmLsMU',
    badge: 'Cảm biến',
    label: 'Cảm biến 50MP phòng sạch',
  },
  {
    id: 'dials',
    url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBseF7Fwx071XAzT0mhaVEwNxnnMHXiqZfUg8oD_e-UPW1yK3aMulc7iKpB98MwFIK4Cd7NosrooTdoV6JwtadODmM1odd88_eVewWFuUE0T01LE2vPWE4ISJfryLnlaXPAZSZpdwkBe3x95XpTcav6UzQLXDZkhrc5s6vNb_1Sr4s5mZIvzSZ49zKVCpkghOlM_9JcP8nU-oLk4G-58DlVr_ZmMBhOsob7hCMGa6KN',
    badge: 'Phím xoay',
    label: 'Núm vặn phay nhôm CNC',
  },
  {
    id: 'serial',
    url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD29AORf-iRCEPWklKhjOxeglcNv-j3skrMQKjo9EH2QKuXoe3CQ2NupSzmnPRKSzODDdXgLJyawW82DB3BIZw8WqLhK3FUyhHMce8UgtnYafWKmMKyhr4oVmowLNiKNtc7z-p4PqD7sKLjbyWvDj8L9L1HbL5X2L2_ayEb4oNJI9qn44ZFijkDTclZB1GG15VccHTQqhjJXLoL-W72HGDCl6pw1i72JshyP7Wf1klq',
    badge: 'Serial đáy',
    label: 'Tem khắc chìm serial đáy máy',
  },
  {
    id: 'case',
    url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuApntbmGUD5Rgz5iSX23PmEg_pCGxupABO87Tky3uj0297mBGI1SQr2O_VzrBSRuZX80WSE6UCdjTJ8LcbeAGJwl6JvFZHefiEd3L-JUY5SiZsTPl-4cpy7hNUGsuAQWUtz2hJnx-3QB6Q2l7SR3ESVk521hIqY_UTCt1CDNoaj19iOis87JPqmEdQfU1rUMqVt8BdYAQaWjiPXlpfgC7fp4BIk1aNCydjDJjkfc5V2',
    badge: 'Vali & Phụ kiện',
    label: 'Vali Nanuk 910 và phụ kiện',
  },
];

export const EditThriftListing: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  // Load target item from storage or fallback to Hasselblad 907X
  const [initialItem] = useState<ThriftListingItem>(() => {
    try {
      const stored = localStorage.getItem(THRIFT_LISTINGS_STORAGE_KEY);
      if (stored) {
        const list: ThriftListingItem[] = JSON.parse(stored);
        const match = list.find((it) => it.id === id || it.sku === id || it.id === 'HBL-907X');
        if (match) return match;
      }
    } catch (e) {
      console.error('Lỗi đọc listing:', e);
    }
    return INITIAL_THRIFT_LISTINGS[0];
  });

  // Form states
  const [title, setTitle] = useState(initialItem.title);
  const [category, setCategory] = useState('Camera & Quang học / Medium Format Digital');
  const [brand, setBrand] = useState('Hasselblad (Thụy Điển / Göteborg)');
  const [sku] = useState(initialItem.sku || 'HBL-907X-TH01');
  const [batchYear, setBatchYear] = useState('2021 (Batch Q4 - Sweden)');
  const [condition, setCondition] = useState<'like-new' | 'good' | 'fair'>('like-new');
  const [conditionNotes, setConditionNotes] = useState(
    initialItem.curatorNotes ||
      `Hiện vật được bảo quản liên tục trong tủ chống ẩm tiêu chuẩn 40% RH tại buồng Atelier.
- Số phát màn trập (Shutter Count): 4,820 / 100,000 nhát (tương đương 4.8% vòng đời thiết kế).
- Sai số cơ học màn trập lá trên ống XCD 45mm: +-0.02ms (chuẩn kỹ thuật xuất xưởng).
- Cảm biến Medium Format CMOS 50MP: Không có điểm chết (zero dead pixels), lớp phủ IR-cut không trầy xước.
- Ngoại quan: Khung nhôm phay xước nguyên vẹn không móp cấn. Đi kèm vali chống sốc Nanuk 910 cắt đệm custom cho body 907X và 2 pin chính hãng.`
  );
  const [priceString, setPriceString] = useState(
    initialItem.price ? initialItem.price.toLocaleString('vi-VN') + ' ₫' : '122.000.000 ₫'
  );
  const [photos, setPhotos] = useState<InspectionPhotoItem[]>(DEFAULT_EDIT_PHOTOS);

  // Status & toast
  const [status, setStatus] = useState<'APPROVED' | 'PENDING' | 'HIDDEN'>('APPROVED');
  const [showToast, setShowToast] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [showAuditModal, setShowAuditModal] = useState(false);

  // Price calculation
  const numericPrice = useMemo(() => {
    return parseInt(priceString.replace(/\D/g, ''), 10) || 0;
  }, [priceString]);

  const platformFee = Math.round(numericPrice * 0.035);
  const circularityFundFee = Math.round(numericPrice * 0.005);
  const netSettlement = numericPrice - platformFee - circularityFundFee;

  // Handle price input
  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    if (!raw) {
      setPriceString('');
      return;
    }
    const val = parseInt(raw, 10);
    setPriceString(val.toLocaleString('vi-VN') + ' ₫');
  };

  // Handle Photo Delete
  const handleDeletePhoto = (photoId: string) => {
    if (photos.length <= 1) {
      alert('Mục đăng bắt buộc có tối thiểu 1 ảnh giám định chính diện!');
      return;
    }
    setPhotos((prev) => prev.filter((p) => p.id !== photoId));
  };

  // Handle Add Photo
  const handleAddPhoto = () => {
    const customUrl = prompt(
      'Nhập liên kết (URL) ảnh giám định độ phân giải cao bổ sung:',
      'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&auto=format&fit=crop&q=80'
    );
    if (customUrl && customUrl.trim()) {
      const newP: InspectionPhotoItem = {
        id: `photo-${Date.now()}`,
        url: customUrl.trim(),
        badge: 'Bổ sung',
        label: 'Góc chụp bổ sung',
      };
      setPhotos((prev) => [...prev, newP]);
    }
  };

  // Toggle Pause/Hide
  const handleTogglePause = () => {
    if (status === 'HIDDEN') {
      setStatus('APPROVED');
      alert('Mục đăng đã được kích hoạt hiển thị lại trên sàn THRIFT!');
    } else {
      if (
        window.confirm(
          `Quý xưởng có chắc chắn muốn tạm dừng hiển thị mục đăng #${sku} trên sàn THRIFT công khai không?`
        )
      ) {
        setStatus('HIDDEN');
        alert('Mục đăng đã được chuyển sang trạng thái ẨN TẠM THỜI.');
      }
    }
  };

  // Save changes
  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!title.trim()) {
      alert('Vui lòng nhập tiêu đề mục đăng!');
      return;
    }

    try {
      const stored = localStorage.getItem(THRIFT_LISTINGS_STORAGE_KEY);
      let list: ThriftListingItem[] = stored ? JSON.parse(stored) : INITIAL_THRIFT_LISTINGS;

      const updatedListing: ThriftListingItem = {
        ...initialItem,
        id: initialItem.id,
        sku: sku,
        title: title.trim(),
        price: numericPrice,
        priceFormatted: numericPrice.toLocaleString('vi-VN') + ' ₫',
        curatorNotes: conditionNotes,
        status: status,
        statusLabel:
          status === 'APPROVED'
            ? 'Đã Duyệt (Admin)'
            : status === 'HIDDEN'
            ? 'Đang ẩn'
            : 'Chờ Duyệt Admin',
        image: photos[0]?.url || initialItem.image,
      };

      list = list.map((item) => (item.id === initialItem.id ? updatedListing : item));
      localStorage.setItem(THRIFT_LISTINGS_STORAGE_KEY, JSON.stringify(list));

      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
      }, 4500);
    } catch (err) {
      console.error('Lỗi khi lưu mục đăng:', err);
    }
  };

  return (
    <div className="w-full flex flex-col font-sans text-on-surface bg-surface min-h-[calc(100vh-4rem)] antialiased no-reveal">
      {/* BREADCRUMBS & CONTEXT HEADER */}
      <section className="w-full bg-surface pt-6 pb-4">
        <div className="max-w-[1440px] mx-auto px-margin-mobile lg:px-margin">
          {/* Breadcrumb trail & Quick actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3">
            <nav
              aria-label="Breadcrumb"
              className="flex items-center gap-2 font-label-sm text-label-sm text-on-surface-variant tracking-wider uppercase flex-wrap"
            >
              <Link to="/shop/dashboard" className="hover:text-primary transition-colors">
                Bảng điều khiển xưởng
              </Link>
              <span>/</span>
              <Link to="/shop/thrift/listings" className="hover:text-primary transition-colors">
                Bán đứt THRIFT
              </Link>
              <span>/</span>
              <Link to="/shop/thrift/listings" className="hover:text-primary transition-colors">
                Sổ mục đăng
              </Link>
              <span>/</span>
              <span className="text-on-surface font-semibold">Chỉnh sửa mục đăng #{sku}</span>
            </nav>

            <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
              <Link
                to="/shop/thrift/listings"
                className="px-3.5 py-1.5 bg-surface-container hover:bg-surface-container-high transition-colors rounded-DEFAULT font-label-md text-label-md text-on-surface flex items-center gap-1.5 border border-surface-dim"
              >
                <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                Hủy bỏ (Cancel)
              </Link>
              <Link
                to="/thrift"
                className="px-3.5 py-1.5 bg-surface-container hover:bg-surface-container-high transition-colors rounded-DEFAULT font-label-md text-label-md text-on-surface flex items-center gap-1.5 border border-surface-dim"
              >
                <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                Xem sàn công khai
              </Link>
              <button
                type="button"
                onClick={() => handleSave()}
                className="px-5 py-1.5 bg-primary text-on-primary hover:bg-tertiary transition-colors rounded-DEFAULT font-label-md text-label-md uppercase tracking-wider flex items-center gap-2 font-semibold shadow-sm cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">save</span>
                Lưu thay đổi
              </button>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pt-2 border-t border-surface-dim">
            <div>
              <div className="flex items-center gap-3 mb-1 flex-wrap">
                <span className="px-2 py-0.5 bg-secondary-container text-on-secondary-container font-label-sm text-label-sm uppercase tracking-widest rounded-DEFAULT font-semibold">
                  Hiện vật đã kiểm định
                </span>
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-mono">
                  Mã chứng thư: HBL-SECLIFE-2024-009
                </span>
              </div>
              <h1 className="font-serif text-3xl lg:text-4xl text-on-surface tracking-tight font-normal">
                Chỉnh Sửa Mục Đăng THRIFT
              </h1>
            </div>
            <div className="flex items-center gap-2 text-on-surface-variant font-body-sm text-body-sm">
              <span className="material-symbols-outlined text-[18px] text-secondary">history</span>
              <span>Lần đồng bộ sổ cái gần nhất: 19/11/2024 • 14:32 (GMT+7)</span>
            </div>
          </div>
        </div>
      </section>

      {/* RE-APPROVAL CRITICAL NOTICE BANNER */}
      <section className="w-full bg-surface pb-6">
        <div className="max-w-[1440px] mx-auto px-margin-mobile lg:px-margin">
          <div className="p-5 bg-tertiary-fixed/40 rounded-DEFAULT flex flex-col md:flex-row items-start gap-4 border border-tertiary/20">
            <div className="w-10 h-10 rounded-DEFAULT bg-tertiary-container text-on-tertiary-container flex items-center justify-center shrink-0 mt-0.5">
              <span className="material-symbols-outlined text-[24px]">gavel</span>
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="font-title-md text-title-md text-on-surface font-semibold">
                  LƯU Ý TÁI KIỂM DUYỆT (ADMIN RE-APPROVAL PROTOCOL)
                </span>
                <span className="px-2 py-0.5 bg-surface text-tertiary font-label-sm text-label-sm uppercase font-semibold rounded-DEFAULT tracking-wider border border-surface-dim">
                  Tiêu chuẩn B-Corp Curation
                </span>
              </div>
              <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                Theo quy chuẩn B-Corp Circularity của ReUse Hub, việc thay đổi các trường dữ liệu cốt lõi (
                <strong>Giá bán đứt</strong>, <strong>Tình trạng phân hạng máy móc</strong>,{' '}
                <strong>Hình ảnh giám định buồng cảm biến</strong> hoặc <strong>Mô tả kỹ thuật</strong>) sẽ tự động
                chuyển mục đăng về trạng thái{' '}
                <span className="text-tertiary font-semibold underline">CHỜ DUYỆT LẠI (PENDING RE-APPROVAL)</span>.
                Mục đăng sẽ tạm ẩn khỏi sàn công khai trong thời gian Admin thẩm định (2–4 giờ làm việc).
              </p>
            </div>
            <div className="shrink-0 self-start md:self-center">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-surface font-label-sm text-label-sm uppercase tracking-wider text-secondary font-semibold rounded-DEFAULT shadow-xs border border-surface-dim">
                <span className="w-2 h-2 rounded-full bg-secondary"></span>
                Hiện tại: Hoạt động (Approved)
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* MAIN EDITING BODY: 2-COLUMN CATALOGUE GRID */}
      <section className="w-full bg-surface pb-16">
        <div className="max-w-[1440px] mx-auto px-margin-mobile lg:px-margin">
          <form
            id="edit-thrift-form"
            onSubmit={handleSave}
            className="grid grid-cols-1 lg:grid-cols-12 gap-gutter items-start"
          >
            {/* LEFT COLUMN (FORM DATA SECTIONS) - 8 COLUMNS */}
            <div className="lg:col-span-8 flex flex-col gap-6">
              {/* SECTION 1: NGUỒN GỐC HIỆN VẬT TUẦN HOÀN (IMMUTABLE CIRCULAR SOURCE) */}
              <div className="bg-surface-container-low p-6 lg:p-8 rounded-DEFAULT border border-surface-dim">
                <div className="flex items-center justify-between pb-4 mb-6 border-b border-surface-dim">
                  <div className="flex items-center gap-3">
                    <span className="font-label-sm text-label-sm uppercase tracking-widest text-primary font-bold">
                      Mục 01
                    </span>
                    <span className="text-outline-variant">/</span>
                    <h2 className="font-serif text-2xl text-on-surface font-semibold">
                      Nguồn Gốc Hiện Vật Tuần Hoàn
                    </h2>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-surface-container text-on-surface-variant font-label-sm text-label-sm tracking-wider uppercase font-semibold rounded-DEFAULT border border-surface-dim">
                    <span className="material-symbols-outlined text-[14px]">lock</span>
                    Bảo Mật Bất Biến (Read-Only)
                  </span>
                </div>

                {/* Source Type Alert */}
                <div className="mb-6 p-4 bg-surface rounded-DEFAULT flex items-start gap-3 border border-surface-dim">
                  <span className="material-symbols-outlined text-secondary text-[22px] shrink-0 mt-0.5">
                    cyclone
                  </span>
                  <div>
                    <div className="font-title-md text-title-md text-on-surface font-semibold">
                      Chuyển giao từ Kho RENT (Returned RENT Inventory — Second Life Archive)
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5 leading-relaxed">
                      Hiện vật này đã hoàn tất chu kỳ cho thuê tiêu chuẩn và được atelier chuyển sang chế độ thanh lý
                      bảo chứng. Nguồn gốc này được neo cứng trên sổ cái điện tử.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-surface rounded-DEFAULT border border-surface-dim">
                    <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant block mb-1">
                      Mã Sản Phẩm Gốc (RENT SKU)
                    </span>
                    <div className="font-title-md text-title-md text-on-surface font-semibold">
                      Hasselblad 907X 50C + Lens XCD Kit
                    </div>
                    <span className="font-body-sm text-body-sm text-secondary font-mono font-medium">
                      #HBL-907X-50C
                    </span>
                  </div>
                  <div className="p-4 bg-surface rounded-DEFAULT border border-surface-dim">
                    <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant block mb-1">
                      Định Danh Lưu Kho (Inventory Barcode)
                    </span>
                    <div className="font-title-md text-title-md text-on-surface font-semibold">
                      #INV-HB907-01
                    </div>
                    <span className="font-body-sm text-body-sm text-on-surface-variant font-mono">
                      Laser Serial: #HB-907-88201
                    </span>
                  </div>
                </div>

                {/* Inspection History Box */}
                <div className="mt-4 p-4 bg-surface-container rounded-DEFAULT border border-surface-dim">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="material-symbols-outlined text-[18px] text-secondary">verified_user</span>
                    <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface font-semibold">
                      Lịch Sử Kiểm Kê Nghiệm Thu Gần Nhất
                    </span>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                    Đạt chuẩn <strong>98.0% Mint-</strong> tại chu kỳ nghiệm thu hoàn trả ngày 19/11/2024 (Đơn ủy thác
                    #RH-RNT-2024-8845 — Elena Rostova). Cảm biến sạch 100%, buồng gương và ngàm tiếp xúc XCD hoàn hảo.
                    Thiết bị qua 4 chu kỳ kiểm tra rung cảm biến và lấy nét quang học tại phòng lab tiêu chuẩn
                    Class-1000.
                  </p>
                  <div className="mt-3 flex items-center gap-4 text-on-surface-variant font-label-sm text-label-sm pt-2 border-t border-surface-dim flex-wrap">
                    <span>
                      Giám định viên: <strong>KTS. Lê Quang (Master Optician)</strong>
                    </span>
                    <span>•</span>
                    <span className="font-mono text-secondary">Hash: 8f9b...a102c</span>
                  </div>
                </div>
              </div>

              {/* SECTION 2: THÔNG TIN MỤC ĐĂNG & DANH MỤC */}
              <div className="bg-surface-container-low p-6 lg:p-8 rounded-DEFAULT border border-surface-dim">
                <div className="flex items-center justify-between pb-4 mb-6 border-b border-surface-dim">
                  <div className="flex items-center gap-3">
                    <span className="font-label-sm text-label-sm uppercase tracking-widest text-primary font-bold">
                      Mục 02
                    </span>
                    <span className="text-outline-variant">/</span>
                    <h2 className="font-serif text-2xl text-on-surface font-semibold">
                      Thông Tin Mục Đăng &amp; Danh Mục
                    </h2>
                  </div>
                  <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
                    Biên tập sàn công khai
                  </span>
                </div>

                <div className="space-y-5">
                  <div>
                    <label
                      className="block font-label-md text-label-md uppercase tracking-wider text-on-surface mb-2 font-semibold"
                      htmlFor="listing-title"
                    >
                      Tiêu đề hiển thị trên sàn THRIFT <span className="text-error">*</span>
                    </label>
                    <input
                      id="listing-title"
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full px-4 py-3 bg-surface rounded-DEFAULT font-body-lg text-body-lg text-on-surface focus:outline-none focus:bg-surface-container transition-all border border-surface-dim"
                      required
                    />
                    <span className="font-body-sm text-body-sm text-on-surface-variant mt-1.5 block">
                      Tiêu đề xuất hiện trên danh mục và kết quả tìm kiếm máy ảnh Medium Format số.
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label
                        className="block font-label-md text-label-md uppercase tracking-wider text-on-surface mb-2 font-semibold"
                        htmlFor="listing-category"
                      >
                        Phân loại danh mục <span className="text-error">*</span>
                      </label>
                      <select
                        id="listing-category"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full px-4 py-3 bg-surface rounded-DEFAULT font-body-md text-body-md text-on-surface focus:outline-none cursor-pointer border border-surface-dim"
                      >
                        <option value="Camera & Quang học / Medium Format Digital">
                          Camera &amp; Quang học / Medium Format Digital
                        </option>
                        <option value="Camera & Quang học / Rangefinder 35mm">
                          Camera &amp; Quang học / Rangefinder 35mm
                        </option>
                        <option value="Ống kính quang học / Hasselblad XCD System">
                          Ống kính quang học / Hasselblad XCD System
                        </option>
                        <option value="Phụ kiện giám định phòng tối">Phụ kiện giám định phòng tối</option>
                      </select>
                    </div>

                    <div>
                      <label
                        className="block font-label-md text-label-md uppercase tracking-wider text-on-surface mb-2 font-semibold"
                        htmlFor="listing-brand"
                      >
                        Thương hiệu &amp; Xuất xứ
                      </label>
                      <input
                        id="listing-brand"
                        type="text"
                        value={brand}
                        onChange={(e) => setBrand(e.target.value)}
                        className="w-full px-4 py-3 bg-surface rounded-DEFAULT font-body-md text-body-md text-on-surface focus:outline-none border border-surface-dim"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-label-md text-label-md uppercase tracking-wider text-on-surface-variant mb-2">
                        Mã SKU nội bộ (Custom SKU)
                      </label>
                      <input
                        type="text"
                        disabled
                        value={sku}
                        className="w-full px-4 py-3 bg-surface-container rounded-DEFAULT font-mono text-body-md text-on-surface-variant cursor-not-allowed opacity-80 border border-surface-dim"
                      />
                      <span className="font-label-sm text-label-sm text-on-surface-variant mt-1 block">
                        Khóa cố định với hệ thống quản lý kho
                      </span>
                    </div>

                    <div>
                      <label className="block font-label-md text-label-md uppercase tracking-wider text-on-surface mb-2 font-semibold">
                        Năm sản xuất / Đợt xuất xưởng
                      </label>
                      <input
                        type="text"
                        value={batchYear}
                        onChange={(e) => setBatchYear(e.target.value)}
                        className="w-full px-4 py-3 bg-surface rounded-DEFAULT font-body-md text-body-md text-on-surface focus:outline-none border border-surface-dim"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 3: ĐÁNH GIÁ TÌNH TRẠNG & GHI CHÚ THẨM ĐỊNH */}
              <div className="bg-surface-container-low p-6 lg:p-8 rounded-DEFAULT border border-surface-dim">
                <div className="flex items-center justify-between pb-4 mb-6 border-b border-surface-dim">
                  <div className="flex items-center gap-3">
                    <span className="font-label-sm text-label-sm uppercase tracking-widest text-primary font-bold">
                      Mục 03
                    </span>
                    <span className="text-outline-variant">/</span>
                    <h2 className="font-serif text-2xl text-on-surface font-semibold">
                      Đánh Giá Tình Trạng &amp; Thẩm Định
                    </h2>
                  </div>
                  <span className="px-2.5 py-0.5 bg-tertiary-fixed/60 text-tertiary font-label-sm text-label-sm uppercase tracking-wider font-semibold rounded-DEFAULT flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">warning</span>
                    Trường kích hoạt duyệt lại
                  </span>
                </div>

                {/* Condition selection radio cards */}
                <div className="mb-6">
                  <label className="block font-label-md text-label-md uppercase tracking-wider text-on-surface mb-3 font-semibold">
                    Phân hạng bảo chứng hiện vật (Physical Grade) <span className="text-error">*</span>
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {/* Like New Option */}
                    <label
                      onClick={() => setCondition('like-new')}
                      className={`relative p-4 rounded-DEFAULT cursor-pointer shadow-sm flex flex-col justify-between transition-all border ${
                        condition === 'like-new'
                          ? 'bg-surface border-primary ring-2 ring-primary/40'
                          : 'bg-surface border-surface-dim hover:bg-surface-container'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <span className="font-title-md text-title-md text-on-surface font-semibold">
                          Like New
                        </span>
                        <input
                          type="radio"
                          name="condition"
                          value="like-new"
                          checked={condition === 'like-new'}
                          onChange={() => setCondition('like-new')}
                          className="accent-primary w-4 h-4 cursor-pointer"
                        />
                      </div>
                      <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-semibold mb-1">
                        98% – 99% Hoàn hảo
                      </span>
                      <p className="font-body-sm text-body-sm text-on-surface-variant">
                        Không trầy xước ngoại quan, kính quang học trong vắt, màn trập &lt; 5% vòng đời.
                      </p>
                    </label>

                    {/* Good Option */}
                    <label
                      onClick={() => setCondition('good')}
                      className={`relative p-4 rounded-DEFAULT cursor-pointer shadow-sm flex flex-col justify-between transition-all border ${
                        condition === 'good'
                          ? 'bg-surface border-primary ring-2 ring-primary/40'
                          : 'bg-surface border-surface-dim hover:bg-surface-container'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <span className="font-title-md text-title-md text-on-surface font-semibold">
                          Good (Tuyệt hảo)
                        </span>
                        <input
                          type="radio"
                          name="condition"
                          value="good"
                          checked={condition === 'good'}
                          onChange={() => setCondition('good')}
                          className="accent-primary w-4 h-4 cursor-pointer"
                        />
                      </div>
                      <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold mb-1">
                        90% – 97% Tiêu chuẩn
                      </span>
                      <p className="font-body-sm text-body-sm text-on-surface-variant">
                        Vài vết mờ li ti theo thời gian, mọi chức năng điện tử &amp; quang sai ổn định 100%.
                      </p>
                    </label>

                    {/* Fair Option */}
                    <label
                      onClick={() => setCondition('fair')}
                      className={`relative p-4 rounded-DEFAULT cursor-pointer shadow-sm flex flex-col justify-between transition-all border ${
                        condition === 'fair'
                          ? 'bg-surface border-primary ring-2 ring-primary/40'
                          : 'bg-surface border-surface-dim hover:bg-surface-container'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <span className="font-title-md text-title-md text-on-surface font-semibold">
                          Fair (Khá)
                        </span>
                        <input
                          type="radio"
                          name="condition"
                          value="fair"
                          checked={condition === 'fair'}
                          onChange={() => setCondition('fair')}
                          className="accent-primary w-4 h-4 cursor-pointer"
                        />
                      </div>
                      <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold mb-1">
                        80% – 89% Dấu ấn dùng
                      </span>
                      <p className="font-body-sm text-body-sm text-on-surface-variant">
                        Có dấu vết cọ sát cơ học, phù hợp sưu tầm sử dụng thực chiến, chi phí tối ưu.
                      </p>
                    </label>
                  </div>
                </div>

                {/* Detailed Forensic Notes Textarea */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label
                      className="font-label-md text-label-md uppercase tracking-wider text-on-surface font-semibold"
                      htmlFor="condition-notes"
                    >
                      Ghi chú kiểm định quang học &amp; cơ khí chi tiết <span className="text-error">*</span>
                    </label>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">
                      Chuyên viên phòng Lab Atelier ký duyệt
                    </span>
                  </div>
                  <textarea
                    id="condition-notes"
                    rows={6}
                    value={conditionNotes}
                    onChange={(e) => setConditionNotes(e.target.value)}
                    className="w-full p-4 bg-surface rounded-DEFAULT font-body-md text-body-md text-on-surface focus:outline-none focus:bg-surface-container leading-relaxed border border-surface-dim"
                    required
                  />
                  <div className="mt-2 flex items-center justify-between flex-wrap gap-2">
                    <span className="font-body-sm text-body-sm text-tertiary flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px]">info</span>
                      Thay đổi phân hạng hoặc ghi chú này sẽ kích hoạt quy trình tái kiểm duyệt 2-4h từ Admin.
                    </span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant font-mono">
                      {conditionNotes.length} ký tự
                    </span>
                  </div>
                </div>
              </div>

              {/* SECTION 4: THƯ VIỆN HÌNH ẢNH THẨM ĐỊNH */}
              <div className="bg-surface-container-low p-6 lg:p-8 rounded-DEFAULT border border-surface-dim">
                <div className="flex items-center justify-between pb-4 mb-6 border-b border-surface-dim">
                  <div className="flex items-center gap-3">
                    <span className="font-label-sm text-label-sm uppercase tracking-widest text-primary font-bold">
                      Mục 04
                    </span>
                    <span className="text-outline-variant">/</span>
                    <h2 className="font-serif text-2xl text-on-surface font-semibold">
                      Thư Viện Hình Ảnh Thẩm Định ({photos.length}/8)
                    </h2>
                  </div>
                  <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-semibold flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">check_circle</span>
                    {photos.length} ảnh chuẩn RAW/JPEG 4K
                  </span>
                </div>

                <p className="font-body-sm text-body-sm text-on-surface-variant mb-4 leading-relaxed">
                  Hình ảnh cần chụp rõ nét dưới ánh sáng tự nhiên hoặc studio phân cực. Tối thiểu bắt buộc: 1 ảnh toàn
                  thân, 1 ảnh buồng cảm biến trực diện, và 1 ảnh tem số serial khắc chìm.
                </p>

                {/* Photos Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-4">
                  {photos.map((p) => (
                    <div
                      key={p.id}
                      className="group relative aspect-square bg-surface rounded-DEFAULT overflow-hidden border border-surface-dim"
                    >
                      <img
                        src={p.url}
                        alt={p.label}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-primary/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => setLightboxUrl(p.url)}
                          aria-label="Xem ảnh lớn"
                          className="w-8 h-8 rounded-full bg-surface-container-lowest text-on-surface flex items-center justify-center shadow-md hover:bg-surface transition-colors cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[16px]">visibility</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeletePhoto(p.id)}
                          aria-label="Xóa ảnh"
                          className="w-8 h-8 rounded-full bg-surface-container-lowest text-error flex items-center justify-center shadow-md hover:bg-surface transition-colors cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[16px]">delete</span>
                        </button>
                      </div>
                      <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 bg-surface/90 text-on-surface font-label-sm text-label-sm rounded-DEFAULT uppercase">
                        {p.badge}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Upload dropzone */}
                <div
                  onClick={handleAddPhoto}
                  className="p-6 bg-surface rounded-DEFAULT text-center cursor-pointer hover:bg-surface-container transition-colors border border-dashed border-outline-variant/60"
                >
                  <span className="material-symbols-outlined text-[32px] text-on-surface-variant mb-2 block">
                    add_photo_alternate
                  </span>
                  <div className="font-title-md text-title-md text-on-surface mb-1 font-semibold">
                    Tải thêm ảnh chi tiết hoặc chứng thư giám định
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    Kéo thả ảnh định dạng RAW, DNG, TIFF hoặc JPEG (tối đa 25MB/ảnh). Tối đa thêm {8 - photos.length} ảnh.
                  </p>
                </div>
              </div>

              {/* SECTION 5: ĐỊNH GIÁ BÁN ĐỨT & QUYẾT TOÁN SMART ESCROW */}
              <div className="bg-surface-container-low p-6 lg:p-8 rounded-DEFAULT border border-surface-dim">
                <div className="flex items-center justify-between pb-4 mb-6 border-b border-surface-dim">
                  <div className="flex items-center gap-3">
                    <span className="font-label-sm text-label-sm uppercase tracking-widest text-primary font-bold">
                      Mục 05
                    </span>
                    <span className="text-outline-variant">/</span>
                    <h2 className="font-serif text-2xl text-on-surface font-semibold">
                      Định Giá Bán Đứt &amp; Quyết Toán Escrow
                    </h2>
                  </div>
                  <span className="px-2.5 py-0.5 bg-tertiary-fixed/60 text-tertiary font-label-sm text-label-sm uppercase tracking-wider font-semibold rounded-DEFAULT flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">warning</span>
                    Trường kích hoạt duyệt lại
                  </span>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                    <div>
                      <label
                        className="block font-label-md text-label-md uppercase tracking-wider text-on-surface mb-2 font-semibold"
                        htmlFor="thrift-price"
                      >
                        Giá bán đứt THRIFT niêm yết (VNĐ) <span className="text-error">*</span>
                      </label>
                      <div className="relative">
                        <input
                          id="thrift-price"
                          type="text"
                          value={priceString}
                          onChange={handlePriceChange}
                          className="w-full pl-4 pr-14 py-3 bg-surface rounded-DEFAULT font-serif text-2xl text-on-surface font-bold focus:outline-none focus:bg-surface-container border border-surface-dim"
                          required
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 font-label-sm text-label-sm text-on-surface-variant uppercase font-semibold">
                          VND
                        </span>
                      </div>
                      <span className="font-body-sm text-body-sm text-on-surface-variant mt-1.5 block">
                        Giá thị trường máy mới nguyên seal: 149.900.000 ₫
                      </span>
                    </div>

                    <div className="p-4 bg-surface rounded-DEFAULT border border-surface-dim">
                      <div className="flex items-center justify-between text-on-surface-variant font-body-sm text-body-sm mb-1">
                        <span>Mức chiết khấu so với xuất xưởng:</span>
                        <span className="text-secondary font-semibold font-mono">-18.6%</span>
                      </div>
                      <div className="flex items-center justify-between text-on-surface-variant font-body-sm text-body-sm">
                        <span>Định giá gợi ý của AI Lab:</span>
                        <span className="text-on-surface font-mono font-medium">118M – 125M ₫</span>
                      </div>
                    </div>
                  </div>

                  {/* Interactive Calculator Breakdown Container */}
                  <div className="p-5 bg-surface rounded-DEFAULT border border-surface-dim">
                    <div className="font-title-md text-title-md text-on-surface mb-3 flex items-center gap-2 font-semibold">
                      <span className="material-symbols-outlined text-[20px] text-primary">calculate</span>
                      Bảng Phân Bổ Doanh Thu Thực Nhận (Smart Escrow Breakdown)
                    </div>

                    <div className="space-y-2.5 font-body-sm text-body-sm">
                      <div className="flex items-center justify-between text-on-surface-variant">
                        <span>Giá bán niêm yết (Khách trả):</span>
                        <span className="font-mono text-on-surface font-semibold text-body-lg">
                          {numericPrice.toLocaleString('vi-VN')} ₫
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-on-surface-variant">
                        <span className="flex items-center gap-1">
                          Phí kiểm định &amp; vận hành nền tảng (Platform Protocol Fee 3.5%):
                          <span
                            className="material-symbols-outlined text-[14px] text-outline-variant"
                            title="Bao gồm chi phí giám định buồng lab, niêm phong nắp seal và bảo chứng B-Corp"
                          >
                            help
                          </span>
                        </span>
                        <span className="font-mono text-error">- {platformFee.toLocaleString('vi-VN')} ₫</span>
                      </div>

                      <div className="flex items-center justify-between text-on-surface-variant">
                        <span>Phí quỹ bảo hiểm lưu thông tuần hoàn (Circularity Fund 0.5%):</span>
                        <span className="font-mono text-error">
                          - {circularityFundFee.toLocaleString('vi-VN')} ₫
                        </span>
                      </div>

                      <div className="pt-3 my-2 bg-surface-container h-px w-full"></div>

                      <div className="flex items-center justify-between font-title-md text-title-md text-on-surface">
                        <span className="font-semibold text-secondary">Atelier thực nhận (Net Settlement):</span>
                        <span className="font-serif text-2xl text-secondary font-bold">
                          {netSettlement.toLocaleString('vi-VN')} ₫
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 p-3 bg-surface-container rounded-DEFAULT flex items-start gap-2.5 text-on-surface-variant font-body-sm text-body-sm border border-surface-dim">
                      <span className="material-symbols-outlined text-[18px] text-secondary shrink-0 mt-0.5">
                        lock_clock
                      </span>
                      <span>
                        <strong>Cơ chế Smart Escrow:</strong> Tiền bán sẽ được giữ trong ví ký quỹ trung gian minh
                        bạch và tự động giải ngân về tài khoản Atelier sau{' '}
                        <strong>72 giờ kể từ khi người mua nhận máy và xác nhận không có khiếu nại quang học</strong>.
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 6: VẬN CHUYỂN & GIAO NHẬN BẢO CHỨNG */}
              <div className="bg-surface-container-low p-6 lg:p-8 rounded-DEFAULT border border-surface-dim">
                <div className="flex items-center justify-between pb-4 mb-6 border-b border-surface-dim">
                  <div className="flex items-center gap-3">
                    <span className="font-label-sm text-label-sm uppercase tracking-widest text-primary font-bold">
                      Mục 06
                    </span>
                    <span className="text-outline-variant">/</span>
                    <h2 className="font-serif text-2xl text-on-surface font-semibold">
                      Vận Chuyển &amp; Giao Nhận Bảo Chứng
                    </h2>
                  </div>
                  <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold">
                    Logistics Tiêu Chuẩn 5 Sao
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-surface rounded-DEFAULT border border-surface-dim">
                    <label className="block font-label-md text-label-md uppercase tracking-wider text-on-surface mb-2 font-semibold">
                      Phương thức giao hàng
                    </label>
                    <div className="font-title-md text-title-md text-on-surface font-semibold flex items-center gap-2">
                      <span className="material-symbols-outlined text-[20px] text-primary">local_shipping</span>
                      Insured White-Glove Nanuk Crate Courier
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-1 leading-relaxed">
                      Đơn vị vận chuyển chuyên dụng có seal niêm phong cảm biến và bảo hiểm 100% giá trị hàng hóa.
                    </p>
                  </div>

                  <div className="p-4 bg-surface rounded-DEFAULT border border-surface-dim">
                    <label className="block font-label-md text-label-md uppercase tracking-wider text-on-surface mb-2 font-semibold">
                      Thời gian đóng gói chuẩn bị (SLA)
                    </label>
                    <div className="font-title-md text-title-md text-on-surface font-semibold flex items-center gap-2">
                      <span className="material-symbols-outlined text-[20px] text-secondary">timer</span>
                      Trong vòng 24 giờ sau khi chốt đơn
                    </div>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-1 leading-relaxed">
                      Atelier cam kết kiểm tra buồng cảm biến lần cuối trước khi giao shipper chuyên biệt.
                    </p>
                  </div>
                </div>

                <div className="mt-4 p-4 bg-surface rounded-DEFAULT border border-surface-dim">
                  <label className="block font-label-md text-label-md uppercase tracking-wider text-on-surface mb-1 font-semibold">
                    Điểm xuất kho &amp; Kiểm chứng bàn giao
                  </label>
                  <div className="font-body-md text-body-md text-on-surface font-medium">
                    Atelier Chronos &amp; Optics (Trạm Tủ Ẩm Trung Tâm A2, Quận 1, TP. Hồ Chí Minh)
                  </div>
                  <span className="font-label-sm text-label-sm text-on-surface-variant mt-0.5 block">
                    Hỗ trợ khách hàng đến trải nghiệm và nhận máy trực tiếp tại phòng lab sau khi đặt mua.
                  </span>
                </div>
              </div>
            </div>

            {/* RIGHT SIDEBAR (LIVE PREVIEW & AUDIT IMPACT) - 4 COLUMNS */}
            <div className="lg:col-span-4 flex flex-col gap-6 sticky top-20">
              {/* CARD 1: LIVE LISTING PREVIEW (AS SEEN BY COLLECTORS) */}
              <div className="bg-surface-container-low p-6 rounded-DEFAULT shadow-sm border border-surface-dim">
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-surface-dim">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-primary">visibility</span>
                    <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface font-semibold">
                      Xem Trước Trên Sàn
                    </span>
                  </div>
                  <Link
                    to="/thrift"
                    className="font-label-sm text-label-sm text-primary hover:underline uppercase tracking-wider font-semibold"
                  >
                    Mở trang đầy đủ
                  </Link>
                </div>

                {/* Mini Thrift Product Card Mockup */}
                <div className="bg-surface rounded-DEFAULT overflow-hidden border border-surface-dim shadow-xs">
                  <div className="relative aspect-[4/3] bg-surface-container overflow-hidden">
                    <img
                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                      src={photos[0]?.url || initialItem.image}
                      alt={title}
                    />
                    <span className="absolute top-2.5 left-2.5 px-2 py-0.5 bg-surface/90 text-on-surface font-label-sm text-label-sm tracking-wider uppercase font-semibold rounded-DEFAULT backdrop-blur-xs">
                      Second Life Mint-
                    </span>
                    <span className="absolute top-2.5 right-2.5 px-2 py-0.5 bg-secondary-container text-on-secondary-container font-label-sm text-label-sm tracking-widest uppercase font-bold rounded-DEFAULT">
                      {condition === 'like-new'
                        ? '98% Like New'
                        : condition === 'good'
                        ? '94% Good'
                        : '86% Fair'}
                    </span>
                  </div>

                  <div className="p-4">
                    <div className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-1 truncate">
                      {brand.split('/')[0].trim()} • Medium Format
                    </div>
                    <h3 className="font-serif text-lg text-on-surface font-semibold line-clamp-2 mb-2 leading-snug">
                      {title}
                    </h3>
                    <div className="flex items-baseline justify-between pt-2 border-t border-surface-dim">
                      <div>
                        <span className="font-label-sm text-label-sm text-on-surface-variant block uppercase">
                          Giá bán đứt
                        </span>
                        <span className="font-serif text-xl text-primary font-bold">
                          {numericPrice.toLocaleString('vi-VN')} ₫
                        </span>
                      </div>
                      <span className="px-2 py-1 bg-surface-container text-on-surface font-label-sm text-label-sm rounded-DEFAULT font-mono">
                        Atelier #01
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 text-center border-t border-surface-dim">
                  <span className="font-body-sm text-body-sm text-on-surface-variant italic">
                    Mọi chỉnh sửa lưu thành công sẽ cập nhật bản xem trước này tức thì.
                  </span>
                </div>
              </div>

              {/* CARD 2: BẢNG TÓM TẮT TÁC ĐỘNG THAY ĐỔI (AUDIT TRAIL & CHANGE SUMMARY) */}
              <div className="bg-surface-container-low p-6 rounded-DEFAULT shadow-sm border border-surface-dim">
                <div className="flex items-center gap-2 pb-3 mb-4 border-b border-surface-dim">
                  <span className="material-symbols-outlined text-[20px] text-tertiary">difference</span>
                  <h3 className="font-title-md text-title-md text-on-surface font-semibold">
                    Tác Động Của Thay Đổi
                  </h3>
                </div>

                <div className="space-y-4">
                  <div className="p-3 bg-surface rounded-DEFAULT flex items-start gap-3 border border-surface-dim">
                    <span className="material-symbols-outlined text-secondary text-[20px] shrink-0 mt-0.5">
                      check_circle
                    </span>
                    <div className="font-body-sm text-body-sm">
                      <strong className="text-on-surface">Tiêu đề &amp; Mô tả chung:</strong>
                      <p className="text-on-surface-variant">
                        Không ảnh hưởng trạng thái duyệt nếu không sửa thông số kỹ thuật cảm biến.
                      </p>
                    </div>
                  </div>

                  <div className="p-3 bg-tertiary-fixed/40 rounded-DEFAULT flex items-start gap-3 border border-tertiary/20">
                    <span className="material-symbols-outlined text-tertiary text-[20px] shrink-0 mt-0.5">
                      notification_important
                    </span>
                    <div className="font-body-sm text-body-sm">
                      <strong className="text-tertiary font-semibold">Giá bán / Phân hạng máy:</strong>
                      <p className="text-on-surface-variant">
                        Nếu điều chỉnh, hệ thống sẽ tự động gán nhãn <em>Chờ kiểm duyệt lại</em> và chuyển giao lưu trữ
                        tạm thời.
                      </p>
                    </div>
                  </div>

                  <div className="p-3 bg-surface rounded-DEFAULT flex items-start gap-3 border border-surface-dim">
                    <span className="material-symbols-outlined text-outline text-[20px] shrink-0 mt-0.5">lock</span>
                    <div className="font-body-sm text-body-sm">
                      <strong className="text-on-surface">Nguồn gốc kho RENT:</strong>
                      <p className="text-on-surface-variant">Dữ liệu nguồn gốc hoàn toàn cố định và không thể can thiệp.</p>
                    </div>
                  </div>
                </div>

                {/* Status Indicator Tracker */}
                <div className="mt-6 pt-4 bg-surface-container-high/60 p-4 rounded-DEFAULT border border-surface-dim">
                  <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant block mb-1">
                    Trạng thái hồ sơ mục đăng
                  </span>
                  <div className="flex items-center justify-between">
                    <span className="font-title-md text-title-md text-secondary font-bold">
                      {status === 'APPROVED' ? 'ĐÃ DUYỆT (APPROVED)' : 'ĐANG ẨN (PAUSED)'}
                    </span>
                    <span
                      className={`w-3 h-3 rounded-full ${status === 'APPROVED' ? 'bg-secondary' : 'bg-outline'}`}
                    ></span>
                  </div>
                  <span className="font-body-sm text-body-sm text-on-surface-variant mt-1 block">
                    {status === 'APPROVED'
                      ? 'Mục đăng đang hiển thị công khai trên sàn THRIFT toàn quốc.'
                      : 'Mục đăng đang tạm dừng giao dịch theo yêu cầu của xưởng.'}
                  </span>
                </div>
              </div>

              {/* CARD 3: THAO TÁC PHỤ (LƯU TRỮ HOẶC TẠM DỪNG MỞ BÁN) */}
              <div className="bg-surface-container-low p-6 rounded-DEFAULT border border-surface-dim">
                <h3 className="font-title-md text-title-md text-on-surface font-semibold mb-3">
                  Tùy Chọn Vận Hành Khác
                </h3>
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={handleTogglePause}
                    className="w-full px-4 py-2.5 bg-surface hover:bg-surface-container transition-colors rounded-DEFAULT font-label-md text-label-md text-on-surface flex items-center justify-between cursor-pointer border border-surface-dim"
                  >
                    <span className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px] text-tertiary">
                        {status === 'HIDDEN' ? 'play_circle' : 'pause_circle'}
                      </span>
                      {status === 'HIDDEN' ? 'Kích hoạt mở bán lại' : 'Tạm dừng mở bán (Ẩn khỏi sàn)'}
                    </span>
                    <span className="material-symbols-outlined text-[18px] text-outline-variant">
                      chevron_right
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowAuditModal(true)}
                    className="w-full px-4 py-2.5 bg-surface hover:bg-surface-container transition-colors rounded-DEFAULT font-label-md text-label-md text-on-surface flex items-center justify-between cursor-pointer border border-surface-dim"
                  >
                    <span className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px] text-secondary">history_edu</span>
                      Xem nhật ký thay đổi (Audit Log)
                    </span>
                    <span className="material-symbols-outlined text-[18px] text-outline-variant">
                      chevron_right
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm('Chuyển mục đăng này về kho lưu trữ vĩnh viễn?')) {
                        handleTogglePause();
                      }
                    }}
                    className="w-full px-4 py-2.5 bg-surface hover:bg-error-container hover:text-on-error-container transition-colors rounded-DEFAULT font-label-md text-label-md text-error flex items-center justify-between cursor-pointer border border-surface-dim"
                  >
                    <span className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px]">archive</span>
                      Chuyển về Kho Lưu Trữ (Archive)
                    </span>
                    <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </section>

      {/* NOTIFICATION TOAST */}
      {showToast && (
        <div
          id="save-toast"
          className="fixed bottom-24 right-6 z-50 p-4 bg-primary text-on-primary rounded-DEFAULT shadow-xl max-w-md flex items-start gap-3 animate-fade-in border border-secondary/40"
        >
          <span className="material-symbols-outlined text-secondary text-[24px] shrink-0">task_alt</span>
          <div className="flex-1">
            <div className="font-title-md text-title-md font-semibold">Thay đổi đã được ghi nhận!</div>
            <p className="font-body-sm text-body-sm text-inverse-on-surface mt-0.5">
              Dữ liệu mục đăng #{sku} đã được đồng bộ với Sổ Cái Tuần Hoàn ReUse Hub.
            </p>
          </div>
          <button
            type="button"
            aria-label="Đóng thông báo"
            className="text-on-primary hover:text-inverse-primary cursor-pointer"
            onClick={() => setShowToast(false)}
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
      )}

      {/* STICKY BOTTOM ACTION BAR */}
      <section className="sticky bottom-0 z-40 w-full bg-surface-container-lowest/95 backdrop-blur-md shadow-[0_-4px_16px_rgba(30,29,27,0.06)] py-4 border-t border-surface-dim">
        <div className="max-w-[1440px] mx-auto px-margin-mobile lg:px-margin flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Status pill and identifier */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-mono font-semibold text-body-md text-on-surface">Mục đăng #{sku}</span>
            <span className="text-outline-variant">•</span>
            <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
              Nguồn: Kho RENT (Bảo chứng bất biến)
            </span>
            <span className="text-outline-variant hidden sm:inline">•</span>
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-DEFAULT font-label-sm text-label-sm uppercase tracking-wider font-semibold ${
                status === 'APPROVED'
                  ? 'bg-secondary-container/60 text-secondary'
                  : 'bg-surface-dim text-on-surface-variant'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${status === 'APPROVED' ? 'bg-secondary' : 'bg-outline'}`}
              ></span>
              Trạng thái hiện tại: {status === 'APPROVED' ? 'Đã duyệt' : 'Đang ẩn'}
            </span>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-end flex-wrap">
            <Link
              to="/shop/thrift/listings"
              className="px-5 py-2.5 bg-surface-container hover:bg-surface-container-high transition-colors rounded-DEFAULT font-label-md text-label-md uppercase tracking-wider text-on-surface font-semibold text-center border border-surface-dim"
            >
              Hủy &amp; Quay lại
            </Link>
            <Link
              to="/thrift"
              className="px-5 py-2.5 bg-surface-container-high hover:bg-surface-dim transition-colors rounded-DEFAULT font-label-md text-label-md uppercase tracking-wider text-on-surface font-semibold text-center flex items-center gap-1.5 border border-surface-dim"
            >
              <span className="material-symbols-outlined text-[18px]">open_in_new</span>
              Xem trên sàn
            </Link>
            <button
              type="submit"
              form="edit-thrift-form"
              onClick={() => handleSave()}
              className="px-7 py-2.5 bg-primary hover:bg-tertiary transition-colors text-on-primary rounded-DEFAULT font-label-md text-label-md uppercase tracking-widest font-semibold text-center shadow-sm flex items-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">verified</span>
              LƯU THAY ĐỔI (SAVE)
            </button>
          </div>
        </div>
      </section>

      {/* Lightbox Modal */}
      {lightboxUrl && (
        <div
          onClick={() => setLightboxUrl(null)}
          className="fixed inset-0 z-50 bg-[#141310]/85 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="relative max-w-4xl max-h-[85vh] rounded overflow-hidden shadow-2xl">
            <img src={lightboxUrl} alt="Inspection view" className="w-full h-full object-contain" />
            <button
              onClick={() => setLightboxUrl(null)}
              className="absolute top-3 right-3 w-9 h-9 bg-surface text-on-surface rounded-full flex items-center justify-center shadow-lg"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        </div>
      )}

      {/* Audit Log Modal */}
      {showAuditModal && (
        <div className="fixed inset-0 z-50 bg-[#141310]/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface max-w-lg w-full rounded-DEFAULT shadow-2xl overflow-hidden border border-surface-dim flex flex-col max-h-[80vh] animate-fade-in">
            <div className="p-4 bg-surface-container-high border-b border-surface-dim flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-[20px]">history_edu</span>
                <span className="font-serif text-lg font-semibold text-on-surface">
                  Nhật Ký Thay Đổi Hồ Sơ (Audit Trail)
                </span>
              </div>
              <button
                onClick={() => setShowAuditModal(false)}
                className="w-8 h-8 rounded-full bg-surface flex items-center justify-center text-outline hover:text-on-surface cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
            <div className="p-5 overflow-y-auto space-y-3 font-body-sm text-body-sm text-on-surface-variant">
              <div className="p-3 bg-surface-container rounded border border-surface-dim">
                <div className="flex justify-between font-mono text-xs text-primary font-semibold">
                  <span>19/11/2024 • 14:32</span>
                  <span className="text-secondary">Đã phê duyệt</span>
                </div>
                <p className="mt-1">Admin ReUse Hub hoàn tất kiểm chuẩn cảm biến và cấp tem B-Corp.</p>
              </div>
              <div className="p-3 bg-surface-container rounded border border-surface-dim">
                <div className="flex justify-between font-mono text-xs text-primary font-semibold">
                  <span>18/11/2024 • 09:15</span>
                  <span>Chuyển kho</span>
                </div>
                <p className="mt-1">Hoàn tất thủ tục chuyển từ kho RENT sang THRIFT sau 14 chu kỳ thuê.</p>
              </div>
            </div>
            <div className="p-4 bg-surface-container-high border-t border-surface-dim flex justify-end">
              <button
                onClick={() => setShowAuditModal(false)}
                className="px-4 py-2 bg-primary text-on-primary font-label-md text-label-md uppercase tracking-wider rounded font-semibold cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditThriftListing;
