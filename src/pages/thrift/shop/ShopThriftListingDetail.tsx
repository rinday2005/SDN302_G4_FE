import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { ThriftListingItem } from '../../data/shop/thriftListingsData';
import { THRIFT_LISTINGS_STORAGE_KEY, INITIAL_THRIFT_LISTINGS } from '../../data/shop/thriftListingsData';

const DEFAULT_GALLERY_IMAGES = [
  {
    id: 'front',
    label: 'Mặt Trước & Lens',
    url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCWmOd06dYZrHEdK0LAOBZZM-MicA_ThpETY8S6NAga0c-q3oMZt1JMDWHHStTcqeYoysrwZLr7hgr4MGSMeuCI5TqvGYff0hQu_T1JSYa9POuX9pel06aTvhYFOT5x78AnqDo4kSC7wYIqAVby-j5klFnv50nZZX3S6YSm-Cd3eqlC9zVDkDKxCXYY8tuKLvcRSD7MI2pJMKnpTn1T1f_mKLQ95iumKQHZhhniWjP3',
  },
  {
    id: 'sensor',
    label: 'Cảm Biến 50MP',
    url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAviabz0dgeoLcgTtXmzOe3fesiKo1wpBxHuRzAIIUCC7KIP5MDff8vKMLG3uWImYUheZ2aJpiu_3pS8rIYHjKOn4Qo_HsvcaA4jyK9IiVYGO1jBcuQp3POVaP0_gIIojvNfdQkm0T2rmZdzKbzhv3PC6R0w-_hjOLFor7_h-NB3wrZlFmRZNvULNGCfSpbUQb0V9bZwupf3hyl_isp4ifm5Aj972yAVny7BAHJ4udm',
  },
  {
    id: 'screen',
    label: 'Phím & Màn Hình',
    url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB0hqsrRhsTBqNLMQ2i7VxjSU6sOuLptxTCzWLKM0lhFnYTajjNpCK86Do1icYywEjEWxyXmixLrdrZ3R1EKJLXe4sDY0aGEM9qnfwQrajiEcrz7_WRluECXOgm1p_riXrkb15UxLeBlNj1hyZgep7L37pJ5j2B6Tzk-wEFk4IaEOGgm3qkKqNWRDD_4PmJHKcMYbeZ4eu6cGI-nNTzu3viWT8aaE5bU75RsGL7EDOB',
  },
  {
    id: 'case',
    label: 'Niêm Chì Nanuk',
    url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBBAyJjKGeAANbQoHAipT-NCZOdheHZQmk0qzmW_kUqjaMYGuD5gBF-mjpgeUis4Y1bIG8Opje4Q7b994cRoKDEJInrW2_eVVASjG_MNLOCfilm58BFjs16HOv-zaQ0sxTWG09MaN4wx_gYQlSdlnpA0LttZkkJM5e435NdiomRhJNwzF5wjhHzhWPTGoYzXvGZkDlYLvpeY56gk4BhtzVX4w_F66abTPJTlUXp1KWH',
  },
];

const HERO_DEFAULT_IMAGE =
  'https://lh3.googleusercontent.com/aida-public/AB6AXuALyhw415AFbiII9TxQvshjt2C1eSVzYd4JdImVPjawEeXgdG6Qd6uJ__3os2FjCzmYtd6mOPOHFc3fvMZ52LAUrz86jDEvOyfkuJ4XdOpZ_zj5-GbahjI_bGdRaFLSPkoUB2xX0LJCAqWGJhaajjdLEhpG6kZmqhskVeIF-0GUaEb2tMuffvDJQXELwF-k8MZok_T7dP3-oovLW5Y6QzofloUj-4DaJ2-AXFtud1Tr';

export const ShopThriftListingDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  // Load listing item from storage or fallback
  const [listing, setListing] = useState<ThriftListingItem>(() => {
    try {
      const stored = localStorage.getItem(THRIFT_LISTINGS_STORAGE_KEY);
      if (stored) {
        const list: ThriftListingItem[] = JSON.parse(stored);
        const found = list.find((it) => it.id === id || it.sku === id || it.id === 'HBL-907X');
        if (found) return found;
      }
    } catch (e) {
      console.error('Lỗi đọc listing:', e);
    }
    // Default fallback specimen
    return INITIAL_THRIFT_LISTINGS[0];
  });

  // Gallery state
  const [activeMainImage, setActiveMainImage] = useState<string>(HERO_DEFAULT_IMAGE);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // Status simulation state
  const [isPaused, setIsPaused] = useState<boolean>(listing.status === 'HIDDEN');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editPrice, setEditPrice] = useState(listing.price.toLocaleString('vi-VN'));
  const [editNotes, setEditNotes] = useState(
    listing.curatorNotes ||
      'Bộ máy ảnh medium format Hasselblad 907X 50C kỷ niệm thiết kế cổ điển Thụy Điển, bao gồm thân máy siêu mỏng 907X, lưng số CFV II 50C với màn hình cảm ứng lật 3.2 inch và ống kính prime XCD 45mm f/4 P có màn trập lá tích hợp tốc độ đồng bộ đèn flash lên đến 1/2000s.'
  );

  // Customer Chat Modal State
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([
    {
      sender: 'buyer',
      time: '14:20 Hôm nay',
      text: 'Chào Atelier Chronos, mình muốn hỏi máy Hasselblad 907X này cảm biến có hạt bụi nào khi chụp ở f/16 không ạ?',
    },
    {
      sender: 'shop',
      time: '14:25 Hôm nay',
      text: 'Chào bạn, xưởng đã test chụp phòng sạch Class 1000 tại f/16 và f/22, cảm biến sạch 100% không tì vết. Kèm ảnh phóng đại quang học trong hồ sơ lưu ký số bạn nhé!',
    },
  ]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Toggle pause/unpause
  const handleTogglePause = () => {
    if (isPaused) {
      setIsPaused(false);
      setListing((prev) => ({ ...prev, status: 'APPROVED', statusLabel: 'Đã Duyệt (Admin)' }));
      showToast('Mục đăng đã được KÍCH HOẠT MỞ BÁN trở lại trên sàn THRIFT công khai.');
    } else {
      if (
        window.confirm(
          `Quý xưởng có chắc chắn muốn tạm dừng hiển thị mục đăng #${listing.sku} trên sàn THRIFT công khai không?`
        )
      ) {
        setIsPaused(true);
        setListing((prev) => ({ ...prev, status: 'HIDDEN', statusLabel: 'Đang ẩn' }));
        showToast('Mục đăng đã được chuyển sang trạng thái ẨN TẠM THỜI.');
      }
    }
  };

  // Handle Edit Save
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    const newPriceVal = parseInt(editPrice.replace(/\D/g, ''), 10) || listing.price;
    setListing((prev) => ({
      ...prev,
      price: newPriceVal,
      priceFormatted: newPriceVal.toLocaleString('vi-VN') + ' ₫',
      curatorNotes: editNotes,
    }));
    setIsEditModalOpen(false);
    showToast('Đã lưu cập nhật thông tin mục đăng thành công!');
  };

  // Handle Send Chat
  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const newMsg = {
      sender: 'shop',
      time: 'Vừa xong',
      text: chatInput.trim(),
    };
    setChatMessages((prev) => [...prev, newMsg]);
    setChatInput('');
    showToast('Đã gửi phản hồi đến khách hàng!');
  };

  // Financial calculations
  const originalPrice = 145000000;
  const currentPrice = listing.price || 122000000;
  const platformFee = Math.round(currentPrice * 0.035);
  const netRevenue = currentPrice - platformFee;
  const depreciationAmount = originalPrice - currentPrice;
  const depreciationPct = Math.round((depreciationAmount / originalPrice) * 1000) / 10;

  return (
    <div className="w-full flex flex-col font-sans text-on-surface bg-surface min-h-[calc(100vh-4rem)] antialiased no-reveal">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-[#141310] text-[#fdf9f2] px-5 py-3.5 rounded shadow-2xl flex items-center gap-3 border border-secondary/40 animate-fade-in max-w-md">
          <span className="material-symbols-outlined text-secondary text-[22px] shrink-0">
            check_circle
          </span>
          <span className="text-xs font-medium leading-snug flex-1">{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="text-outline hover:text-white transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      )}



      {/* Breadcrumbs & Quick Header */}
      <div className="w-full bg-surface">
        <div className="max-w-[1440px] mx-auto px-margin-mobile lg:px-margin pt-6 pb-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <nav aria-label="Breadcrumb" className="flex items-center gap-2 font-label-sm text-label-sm tracking-wider uppercase text-on-surface-variant">
              <Link to="/shop/dashboard" className="hover:text-primary transition-colors">
                BẢNG ĐIỀU KHIỂN XƯỞNG
              </Link>
              <span className="text-outline-variant">/</span>
              <Link to="/shop/thrift/listings" className="hover:text-primary transition-colors">
                BÁN ĐỨT THRIFT
              </Link>
              <span className="text-outline-variant">/</span>
              <span className="text-primary font-bold">CHI TIẾT MỤC ĐĂNG #{listing.sku || 'TH-907X-01'}</span>
            </nav>

            {/* Top Right Actions */}
            <div className="flex items-center flex-wrap gap-2.5">
              <Link
                to="/shop/thrift/listings"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-DEFAULT bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md uppercase tracking-wider transition-colors shadow-sm"
              >
                <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                <span>Sổ Mục Đăng</span>
              </Link>
              <Link
                to="/shop/thrift/orders"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-DEFAULT bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md uppercase tracking-wider transition-colors shadow-sm"
              >
                <span className="material-symbols-outlined text-[16px]">receipt_long</span>
                <span>Đơn Bán Hàng</span>
              </Link>
              <Link
                to="/thrift"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-DEFAULT bg-surface-container-highest hover:bg-surface-container text-on-surface font-label-md text-label-md uppercase tracking-wider transition-colors shadow-sm"
              >
                <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                <span>Xem Sàn Công Khai</span>
              </Link>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-DEFAULT bg-primary hover:bg-primary-container text-on-primary font-label-md text-label-md uppercase tracking-wider transition-colors shadow-sm cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">edit_note</span>
                <span>Chỉnh Sửa Mục Đăng</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Hero Title & Registry Banner */}
      <div className="w-full bg-surface pb-6">
        <div className="max-w-[1440px] mx-auto px-margin-mobile lg:px-margin">
          <div className="bg-surface-container-low rounded-DEFAULT p-6 lg:p-8 shadow-sm border border-surface-dim">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
              <div className="space-y-3 max-w-4xl">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span
                    className={`px-2.5 py-0.5 rounded-DEFAULT font-label-sm text-label-sm uppercase tracking-widest font-bold inline-flex items-center gap-1.5 ${
                      isPaused
                        ? 'bg-surface-dim text-on-surface-variant'
                        : 'bg-secondary-container text-on-secondary-container'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${isPaused ? 'bg-outline' : 'bg-secondary'}`}
                    ></span>
                    {isPaused
                      ? 'ĐANG ẨN (PAUSED BY ATELIER)'
                      : 'ĐÃ PHÊ DUYỆT (APPROVED BY REUSE HUB ADMIN)'}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-DEFAULT bg-surface-container-high text-on-surface font-label-sm text-label-sm uppercase tracking-wider">
                    {isPaused ? 'TẠM DỪNG GIAO DỊCH' : 'CÒN HÀNG (AVAILABLE - 1/1 SPECIMEN)'}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-DEFAULT bg-primary/10 text-primary font-label-sm text-label-sm uppercase tracking-wider">
                    B-CORP AUDIT #BC-2024-VNM-094
                  </span>
                </div>

                <h1 className="font-serif text-3xl lg:text-4xl text-primary tracking-tight">
                  {listing.title}
                </h1>

                <div className="flex flex-wrap items-center gap-4 text-on-surface-variant font-body-sm text-body-sm">
                  <span className="flex items-center gap-1.5 font-medium text-primary">
                    <span className="material-symbols-outlined text-[16px] text-secondary">fingerprint</span>
                    SKU: <strong className="tracking-wider">{listing.sku || 'HBL-907X-TH01'}</strong>
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px]">qr_code_2</span>
                    Laser Serial: <strong>{listing.serialNumber || '#HB-907-88201'}</strong>
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px]">calendar_today</span>
                    Niêm yết: {listing.submittedAt || '19/11/2024'}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px]">verified</span>
                    Giám định viên: {listing.appraiserName || 'RH-Lead Inspector #08'}
                  </span>
                </div>
              </div>

              {/* Price & Live Snapshot */}
              <div className="bg-surface-container rounded-DEFAULT p-4 lg:text-right shrink-0 border border-surface-dim">
                <div className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
                  Giá Bán Đứt THRIFT (Niêm yết)
                </div>
                <div className="font-serif text-3xl text-primary mt-1 font-bold">
                  {listing.priceFormatted || '122.000.000 ₫'}
                </div>
                <div className="font-label-sm text-label-sm text-secondary font-medium mt-0.5">
                  -{depreciationPct}% so với giá xưởng gốc
                </div>
              </div>
            </div>

            {/* Approval State Simulation Drawer */}
            <div className="mt-6 pt-5 bg-surface rounded-DEFAULT p-4 shadow-sm border border-surface-dim">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-surface-dim">
                <div className="flex items-center gap-2 text-on-surface">
                  <span className="material-symbols-outlined text-[18px] text-primary">shield</span>
                  <span className="font-title-md text-title-md font-semibold">
                    Quy Trình Kiểm Tra 3 Cấp Độ Kiểm Duyệt (Audit State Protocol)
                  </span>
                </div>
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                  Thẩm Quyền Độc Quyền Của Sàn ReUse Hub
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3">
                {/* Pending */}
                <div className="p-3.5 bg-surface-container-low rounded-DEFAULT opacity-70 hover:opacity-100 transition-opacity border border-surface-dim">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-label-sm text-label-sm uppercase tracking-wider font-bold text-on-surface">
                      1. PENDING (Chờ Thẩm Định)
                    </span>
                    <span className="material-symbols-outlined text-[16px] text-tertiary">hourglass_top</span>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant leading-snug">
                    Hồ sơ trong hàng đợi giám định cảm biến &amp; cơ học. Phản hồi cam kết trong 2-4 giờ làm việc.
                  </p>
                </div>

                {/* Approved (Active) */}
                <div
                  className={`p-3.5 rounded-DEFAULT shadow-sm border ${
                    !isPaused
                      ? 'bg-secondary-container/50 border-secondary/30'
                      : 'bg-surface-container-low border-surface-dim'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-label-sm text-label-sm uppercase tracking-wider font-bold text-on-secondary-container">
                      2. APPROVED (Đang Mở Bán)
                    </span>
                    <span className="material-symbols-outlined text-[18px] text-secondary">check_circle</span>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface leading-snug font-medium">
                    Mục đăng đã được cấp mã lưu ký số (#RH-CUST-88201) và đang mở bán công khai trên sàn THRIFT.
                  </p>
                </div>

                {/* Rejected */}
                <div className="p-3.5 bg-surface-container-low rounded-DEFAULT opacity-70 hover:opacity-100 transition-opacity border border-surface-dim">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-label-sm text-label-sm uppercase tracking-wider font-bold text-error">
                      3. REJECTED (Từ Chối Phê Duyệt)
                    </span>
                    <span className="material-symbols-outlined text-[16px] text-error">cancel</span>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant leading-snug">
                    Lý do mẫu: Cần bổ sung ảnh macro tem đáy serial bằng ánh sáng tự nhiên và kiểm tra độ rơ của vòng nét.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main 2-Column Editorial Grid */}
      <div className="w-full bg-surface pb-16">
        <div className="max-w-[1440px] mx-auto px-margin-mobile lg:px-margin">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">
            {/* LEFT COLUMN (60% ~ 7 cols in 12-col grid) */}
            <div className="lg:col-span-7 space-y-space-lg">
              {/* Image Gallery Module */}
              <div className="bg-surface-container-low rounded-DEFAULT p-5 shadow-sm border border-surface-dim">
                <div
                  onClick={() => setLightboxImage(activeMainImage)}
                  className="relative w-full aspect-[4/3] bg-surface rounded-DEFAULT overflow-hidden mb-3.5 flex items-center justify-center cursor-pointer group"
                >
                  <img
                    id="main-preview-image"
                    className="w-full h-full object-cover transition-all duration-300 group-hover:scale-105"
                    src={activeMainImage}
                    alt={listing.title}
                  />
                  <div className="absolute top-3 left-3 bg-primary/80 backdrop-blur-md text-on-primary px-2.5 py-1 rounded-DEFAULT font-label-sm text-label-sm uppercase tracking-widest flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-secondary-fixed"></span>
                    Archival Specimen #HB-01
                  </div>
                  <div className="absolute bottom-3 right-3 bg-surface-container/90 backdrop-blur-md px-3 py-1 rounded-DEFAULT text-on-surface font-label-sm text-label-sm uppercase tracking-wider shadow-sm flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[14px]">zoom_in</span>
                    4 KHOẢNH KHẮC GIÁM ĐỊNH MACRO
                  </div>
                </div>

                {/* Thumbnails Strip */}
                <div className="grid grid-cols-4 gap-2.5">
                  {DEFAULT_GALLERY_IMAGES.map((img) => {
                    const isSelected = activeMainImage === img.url;
                    return (
                      <button
                        key={img.id}
                        type="button"
                        onClick={() => setActiveMainImage(img.url)}
                        className={`aspect-square rounded-DEFAULT overflow-hidden p-1 shadow-sm transition-all focus:outline-none cursor-pointer border ${
                          isSelected
                            ? 'bg-surface border-primary ring-2 ring-primary/40'
                            : 'bg-surface-container border-surface-dim hover:bg-surface'
                        }`}
                      >
                        <img
                          src={img.url}
                          alt={img.label}
                          className="w-full h-full object-cover rounded-DEFAULT"
                        />
                        <span
                          className={`block font-label-sm text-label-sm text-center truncate mt-1 ${
                            isSelected ? 'text-primary font-bold' : 'text-on-surface-variant'
                          }`}
                        >
                          {img.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* SECOND LIFE ORIGIN DOSSIER (Critical: RETURNED_RENTAL) */}
              <div className="bg-surface-container rounded-DEFAULT p-6 shadow-sm border border-surface-dim">
                <div className="flex items-start justify-between gap-4 mb-5">
                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-tertiary-fixed text-on-tertiary-fixed rounded-DEFAULT font-label-sm text-label-sm uppercase tracking-widest font-semibold">
                      <span className="material-symbols-outlined text-[16px] text-tertiary">cyclone</span>
                      Nguồn Gốc Tuần Hoàn: Second Life Origin (Chuyển Giao Từ Kho RENT)
                    </div>
                    <h2 className="font-serif text-2xl text-primary pt-1 font-semibold">
                      Hồ Sơ Luân Chuyển &amp; Bảo Chứng Bất Biến
                    </h2>
                  </div>
                  <div className="hidden sm:flex flex-col items-end">
                    <span className="font-label-sm text-label-sm uppercase tracking-wider text-secondary font-bold">
                      CIRCULAR CUSTODY
                    </span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant font-mono">
                      HASH: 0x98A...F104
                    </span>
                  </div>
                </div>

                {/* Ledger Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                  <div className="p-3.5 bg-surface rounded-DEFAULT space-y-1 border border-surface-dim">
                    <div className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                      Sản Phẩm RENT Khởi Nguyên
                    </div>
                    <div className="font-title-md text-title-md text-primary font-medium">
                      Hasselblad 907X 50C + Lens XCD Kit
                    </div>
                    <div className="font-body-sm text-body-sm text-on-surface-variant font-mono">
                      Catalog Code: #HBL-907X-50C
                    </div>
                  </div>
                  <div className="p-3.5 bg-surface rounded-DEFAULT space-y-1 border border-surface-dim">
                    <div className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                      Mã Lưu Kho Hiện Vật Gốc
                    </div>
                    <div className="font-title-md text-title-md text-primary font-medium">
                      Kho Atelier Chronos #INV-HB907-01
                    </div>
                    <div className="font-body-sm text-body-sm text-on-surface-variant font-mono">
                      Laser Serial: #HB-907-88201
                    </div>
                  </div>
                </div>

                {/* Return Inspection Certificate Box */}
                <div className="p-4 bg-surface-container-high rounded-DEFAULT mb-4 border border-surface-dim">
                  <div className="flex items-center gap-2 mb-2 text-secondary">
                    <span className="material-symbols-outlined text-[18px]">verified</span>
                    <span className="font-title-md text-title-md text-primary font-semibold">
                      Biên Bản Thẩm Định Hoàn Trả Gần Nhất
                    </span>
                  </div>
                  <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                    Hoàn tất giám định ngày <strong>19/11/2024</strong> (theo đơn thuê hoàn tất{' '}
                    <strong>#RH-RNT-2024-8845</strong> - Khách thuê: Elena Rostova). Cảm biến đạt chuẩn phòng sạch{' '}
                    <strong>Class 1000 Cleanroom</strong>, thấu kính không xước mốc hay bong lớp tráng phủ anti-reflex,
                    tổng 14 chu kỳ luân chuyển an toàn tối ưu.
                  </p>
                </div>

                {/* Read-Only Security Guard */}
                <div className="flex items-start gap-3 p-3 bg-surface text-on-surface-variant rounded-DEFAULT border border-surface-dim">
                  <span className="material-symbols-outlined text-[20px] text-primary shrink-0 mt-0.5">lock</span>
                  <p className="font-body-sm text-body-sm leading-snug">
                    <strong className="text-primary uppercase tracking-wider font-label-sm">Bảo mật bất biến:</strong>{' '}
                    Hồ sơ nguồn gốc được ghi nhận vĩnh viễn trên sổ cái ReUse Hub (Read-Only Immutable Hash). Chủ xưởng
                    không thể chỉnh sửa, can thiệp hoặc hoán đổi lịch sử vật lý của hiện vật này.
                  </p>
                </div>
              </div>

              {/* Forensic Condition Notes & Detailed Description */}
              <div className="bg-surface-container-low rounded-DEFAULT p-6 shadow-sm space-y-6 border border-surface-dim">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-label-sm text-label-sm uppercase tracking-widest text-secondary font-bold">
                      BÁO CÁO PHÂN TÍCH GIÁM ĐỊNH KỸ THUẬT
                    </span>
                    <h3 className="font-serif text-2xl text-primary mt-1 font-semibold">
                      Thông Số Tình Trạng &amp; Nhật Ký Cơ Học
                    </h3>
                  </div>
                  <div className="px-3 py-1 bg-surface rounded-DEFAULT shadow-sm text-right border border-surface-dim">
                    <div className="font-label-sm text-label-sm text-on-surface-variant uppercase">
                      Đẳng Cấp Thẩm Định
                    </div>
                    <div className="font-title-md text-title-md text-primary font-bold">Mint- 98.0%</div>
                  </div>
                </div>

                {/* Diagnostic Matrix */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 bg-surface rounded-DEFAULT text-center border border-surface-dim">
                    <div className="font-label-sm text-label-sm text-on-surface-variant uppercase">
                      Số Lần Chụp Màn Trập
                    </div>
                    <div className="font-serif text-2xl text-primary mt-0.5 font-bold">4,820</div>
                    <div className="font-label-sm text-label-sm text-secondary">Hạn mức: 100,000</div>
                  </div>
                  <div className="p-3 bg-surface rounded-DEFAULT text-center border border-surface-dim">
                    <div className="font-label-sm text-label-sm text-on-surface-variant uppercase">
                      Độ Lệch Shutter
                    </div>
                    <div className="font-serif text-2xl text-primary mt-0.5 font-bold">±0.02ms</div>
                    <div className="font-label-sm text-label-sm text-secondary">Chuẩn xuất xưởng</div>
                  </div>
                  <div className="p-3 bg-surface rounded-DEFAULT text-center border border-surface-dim">
                    <div className="font-label-sm text-label-sm text-on-surface-variant uppercase">
                      Độ Ẩm Lưu Trữ Tủ
                    </div>
                    <div className="font-serif text-2xl text-primary mt-0.5 font-bold">40% RH</div>
                    <div className="font-label-sm text-label-sm text-secondary">Trạm ẩm A2 tiêu chuẩn</div>
                  </div>
                  <div className="p-3 bg-surface rounded-DEFAULT text-center border border-surface-dim">
                    <div className="font-label-sm text-label-sm text-on-surface-variant uppercase">
                      Ngoại Quan Vỏ Máy
                    </div>
                    <div className="font-serif text-2xl text-primary mt-0.5 font-bold">99/100</div>
                    <div className="font-label-sm text-label-sm text-secondary">Không cấn móp</div>
                  </div>
                </div>

                {/* Condition Detailed text */}
                <div className="space-y-3 font-body-md text-body-md text-on-surface-variant leading-relaxed">
                  <h4 className="font-title-md text-title-md text-primary font-semibold">
                    Mô Tả Chi Tiết Mục Đăng Từ Xưởng Atelier Chronos
                  </h4>
                  <p>
                    Bộ máy ảnh medium format Hasselblad 907X 50C kỷ niệm thiết kế cổ điển Thụy Điển, bao gồm thân máy siêu
                    mỏng 907X, lưng số CFV II 50C với màn hình cảm ứng lật 3.2 inch và ống kính prime XCD 45mm f/4 P có
                    màn trập lá tích hợp tốc độ đồng bộ đèn flash lên đến 1/2000s.
                  </p>
                  <p>
                    Hiện vật xuất xứ từ kho RENT cao cấp của xưởng, đã trải qua kiểm định tia UV cảm biến, chuẩn trực ống
                    kính qua máy Collimator điện tử chuyên dụng và khử tĩnh điện toàn phần. Màn hình đã dán kính cường lực
                    quang học 9H từ ngày đầu mở hộp.
                  </p>

                  <div className="pt-2">
                    <div className="font-label-md text-label-md uppercase tracking-wider font-semibold text-primary mb-2">
                      Phụ Kiện Kèm Theo Đầy Đủ:
                    </div>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-on-surface">
                      <li className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[16px] text-secondary">check</span>
                        <span>02 Pin gốc Hasselblad 3400mAh</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[16px] text-secondary">check</span>
                        <span>Hub sạc đôi chính hãng Hasselblad</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[16px] text-secondary">check</span>
                        <span>Nắp đậy trước, sau &amp; che lưng số</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[16px] text-secondary">check</span>
                        <span>Vali chống nước Nanuk 910 bọt xốp cắt CNC</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[16px] text-secondary">check</span>
                        <span>Cáp dữ liệu Tether Pro USB-C 5Gbps</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[16px] text-secondary">check</span>
                        <span>Chứng thư lưu ký xưởng &amp; tem niêm ReUse Hub</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN (40% ~ 5 cols in 12-col grid) */}
            <div className="lg:col-span-5 space-y-space-lg">
              {/* Commercial & Financial Settlement Card */}
              <div className="bg-surface-container-low rounded-DEFAULT p-6 shadow-sm space-y-5 border border-surface-dim">
                <div className="flex items-center justify-between pb-3 bg-surface-container/60 -mx-6 -mt-6 p-6 rounded-t-DEFAULT border-b border-surface-dim">
                  <div>
                    <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold">
                      TÀI CHÍNH &amp; THANH TOÁN
                    </span>
                    <h3 className="font-title-md text-title-md text-primary mt-0.5 font-bold">
                      Quyết Toán Bán Đứt THRIFT
                    </h3>
                  </div>
                  <span className="material-symbols-outlined text-primary text-[28px]">payments</span>
                </div>

                <div className="space-y-3">
                  <div className="flex items-baseline justify-between">
                    <span className="font-body-md text-body-md text-on-surface-variant">Giá niêm yết bán đứt:</span>
                    <span className="font-serif text-2xl text-primary font-bold">{currentPrice.toLocaleString('vi-VN')} ₫</span>
                  </div>
                  <div className="flex items-center justify-between font-body-sm text-body-sm text-on-surface-variant">
                    <span>Giá xuất xưởng ban đầu:</span>
                    <span className="line-through">{originalPrice.toLocaleString('vi-VN')} ₫</span>
                  </div>
                  <div className="flex items-center justify-between font-body-sm text-body-sm text-secondary font-medium">
                    <span>Khấu hao chu kỳ tuần hoàn:</span>
                    <span>-{depreciationAmount.toLocaleString('vi-VN')} ₫ (-{depreciationPct}%)</span>
                  </div>
                  <div className="flex items-center justify-between font-body-sm text-body-sm text-on-surface-variant">
                    <span>Phí dịch vụ sàn &amp; kiểm định (3.5%):</span>
                    <span>-{platformFee.toLocaleString('vi-VN')} ₫</span>
                  </div>
                  <div className="pt-3 bg-surface p-3.5 rounded-DEFAULT flex items-center justify-between border border-surface-dim">
                    <div>
                      <div className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant font-semibold">
                        Doanh Thu Xưởng Thực Nhận
                      </div>
                      <div className="font-body-sm text-body-sm text-secondary font-medium">
                        Giải ngân sau 72h khách nhận
                      </div>
                    </div>
                    <div className="font-serif text-2xl text-primary font-bold">
                      {netRevenue.toLocaleString('vi-VN')} ₫
                    </div>
                  </div>
                </div>

                {/* Smart Escrow Mechanism Box */}
                <div className="p-4 bg-surface rounded-DEFAULT space-y-2 border border-surface-dim">
                  <div className="flex items-center gap-2 text-primary font-title-md text-title-md font-semibold">
                    <span className="material-symbols-outlined text-[18px] text-secondary">security</span>
                    <span>Cơ Chế ReUse Smart Escrow</span>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                    100% giá trị giao dịch được ký quỹ bảo chứng tại Ngân Hàng Lưu Ký Đối Tác. Hệ thống tự động chuyển
                    khoản ròng cho Atelier Chronos sau 72 giờ tính từ khi khách hàng ký nhận bàn giao vali Nanuk mà không
                    có tranh chấp kiểm định.
                  </p>
                </div>
              </div>

              {/* Category & Taxonomy Metadata */}
              <div className="bg-surface-container-low rounded-DEFAULT p-6 shadow-sm space-y-4 border border-surface-dim">
                <div className="flex items-center gap-2 text-primary pb-2 border-b border-surface-dim">
                  <span className="material-symbols-outlined text-[20px]">category</span>
                  <h3 className="font-title-md text-title-md font-semibold">Phân Loại Danh Mục &amp; Xuất Xứ</h3>
                </div>
                <div className="space-y-3 font-body-sm text-body-sm divide-y divide-surface-container">
                  <div className="flex justify-between py-1.5">
                    <span className="text-on-surface-variant">Phân ngành chính:</span>
                    <span className="font-medium text-primary">Camera &amp; Quang học Cổ điển</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-on-surface-variant">Dòng máy:</span>
                    <span className="font-medium text-primary">Medium Format Mirrorless Digital</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-on-surface-variant">Quốc gia xuất xưởng:</span>
                    <span className="font-medium text-primary">Thụy Điển (Göteborg Sweden)</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-on-surface-variant">Năm sản xuất / Hệ máy:</span>
                    <span className="font-medium text-primary">2023 / 907X Heritage Series</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-on-surface-variant">SKU Xưởng nội bộ:</span>
                    <span className="font-mono font-medium text-primary">{listing.sku || 'HBL-907X-TH01'}</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-on-surface-variant">Cảm biến hình ảnh:</span>
                    <span className="font-medium text-primary">50MP 43.8 × 32.9mm CMOS</span>
                  </div>
                </div>
              </div>

              {/* Shipping & Fulfillment Protocol */}
              <div className="bg-surface-container-low rounded-DEFAULT p-6 shadow-sm space-y-4 border border-surface-dim">
                <div className="flex items-center gap-2 text-primary pb-1 border-b border-surface-dim">
                  <span className="material-symbols-outlined text-[20px] text-secondary">local_shipping</span>
                  <h3 className="font-title-md text-title-md font-semibold">Giao Nhận &amp; Lưu Trữ Xưởng</h3>
                </div>
                <div className="p-3.5 bg-surface rounded-DEFAULT space-y-2 border border-surface-dim">
                  <div className="font-title-md text-title-md text-primary font-medium">
                    Insured White-Glove Nanuk Crate Courier
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                    Đóng gói chuyên dụng chống sốc trong vali Nanuk niêm chì. Vận chuyển hỏa tốc xe chuyên dụng có bảo
                    hiểm bồi hoàn 100% giá trị hiện vật.
                  </p>
                </div>
                <div className="space-y-2 font-body-sm text-body-sm">
                  <div className="flex items-start gap-2 text-on-surface-variant">
                    <span className="material-symbols-outlined text-[16px] text-primary shrink-0 mt-0.5">schedule</span>
                    <span>
                      Thời gian xử lý cam kết: Bàn giao đơn vị giao vận trong vòng <strong>24 giờ</strong> làm việc.
                    </span>
                  </div>
                  <div className="flex items-start gap-2 text-on-surface-variant">
                    <span className="material-symbols-outlined text-[16px] text-primary shrink-0 mt-0.5">location_on</span>
                    <span>
                      Vị trí kho hiện tại:{' '}
                      <strong>Trạm tủ ẩm A2, Xưởng Atelier Chronos &amp; Optics, 142 Đồng Khởi, Q.1, TP. HCM</strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* Related Orders & Inquiries Quick Card */}
              <div className="bg-surface-container-low rounded-DEFAULT p-6 shadow-sm space-y-4 border border-surface-dim">
                <div className="flex items-center justify-between pb-1 border-b border-surface-dim">
                  <div className="flex items-center gap-2 text-primary">
                    <span className="material-symbols-outlined text-[20px]">insights</span>
                    <h3 className="font-title-md text-title-md font-semibold">Đơn Hàng &amp; Mức Độ Quan Tâm</h3>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-DEFAULT font-label-sm text-label-sm uppercase font-semibold ${
                      isPaused
                        ? 'bg-surface-dim text-on-surface-variant'
                        : 'bg-secondary-container text-on-secondary-container'
                    }`}
                  >
                    {isPaused ? 'Đang Ẩn' : 'Đang Mở Bán'}
                  </span>
                </div>

                {/* Stats Bar */}
                <div className="grid grid-cols-2 gap-3 py-1">
                  <div className="p-3 bg-surface rounded-DEFAULT text-center border border-surface-dim">
                    <div className="font-serif text-2xl text-primary font-bold">142</div>
                    <div className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                      Lượt Xem Hồ Sơ
                    </div>
                  </div>
                  <div className="p-3 bg-surface rounded-DEFAULT text-center border border-surface-dim">
                    <div className="font-serif text-2xl text-secondary font-bold">18</div>
                    <div className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                      Lưu Vào Wishlist
                    </div>
                  </div>
                </div>

                {/* Order Status Note */}
                <div className="p-3.5 bg-surface rounded-DEFAULT flex items-center justify-between gap-3 border border-surface-dim">
                  <div className="flex items-center gap-2 text-on-surface-variant font-body-sm text-body-sm">
                    <span className="material-symbols-outlined text-[18px] text-primary">info</span>
                    <span>Chưa có đơn chốt (Đang công khai trên /thrift)</span>
                  </div>
                  <Link
                    to="/shop/thrift/orders"
                    className="text-primary hover:text-primary-container font-label-sm text-label-sm uppercase tracking-wider font-semibold whitespace-nowrap"
                  >
                    Xem Sổ Đơn →
                  </Link>
                </div>

                {/* Chat Support Button */}
                <button
                  type="button"
                  onClick={() => setIsChatModalOpen(true)}
                  className="w-full py-3 px-4 rounded-DEFAULT bg-surface-container-highest hover:bg-surface-container text-on-surface font-label-md text-label-md uppercase tracking-wider font-medium flex items-center justify-center gap-2 transition-colors shadow-sm cursor-pointer border border-surface-dim"
                >
                  <span className="material-symbols-outlined text-[18px]">forum</span>
                  <span>Mở Hộp Thoại Chat Khách Hỏi Hiện Vật</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky / Bottom Atelier Action Bar */}
      <div className="w-full bg-surface-container py-4 shadow-sm border-t border-surface-dim sticky bottom-0 z-40">
        <div className="max-w-[1440px] mx-auto px-margin-mobile lg:px-margin flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span
              className={`w-2.5 h-2.5 rounded-full ${isPaused ? 'bg-outline' : 'bg-secondary'}`}
            ></span>
            <div className="font-body-sm text-body-sm text-on-surface">
              <strong>{listing.title.split('(')[0].trim()}</strong> • SKU:{' '}
              <span className="font-mono">{listing.sku || 'HBL-907X-TH01'}</span> • Trạng thái:{' '}
              <span className={`font-semibold ${isPaused ? 'text-outline' : 'text-secondary'}`}>
                {isPaused ? 'Đang ẩn tạm dừng' : 'Đã duyệt & Sẵn sàng bàn giao'}
              </span>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2.5 w-full sm:w-auto justify-end">
            {/* Destructive/Pause */}
            <button
              type="button"
              onClick={handleTogglePause}
              className={`px-3.5 py-2.5 rounded-DEFAULT font-label-md text-label-md uppercase tracking-wider transition-colors shadow-sm inline-flex items-center gap-1.5 cursor-pointer border border-surface-dim ${
                isPaused
                  ? 'bg-secondary text-on-secondary hover:bg-secondary/90'
                  : 'bg-surface hover:bg-error-container hover:text-on-error-container text-on-surface-variant'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">
                {isPaused ? 'visibility' : 'visibility_off'}
              </span>
              <span>{isPaused ? 'Mở Lại Mục Đăng' : 'Ẩn Mục Đăng (Tạm Dừng Bán)'}</span>
            </button>

            <Link
              to="/shop/thrift/orders"
              className="px-3.5 py-2.5 rounded-DEFAULT bg-surface hover:bg-surface-container-high text-on-surface font-label-md text-label-md uppercase tracking-wider transition-colors shadow-sm inline-flex items-center gap-1.5 border border-surface-dim"
            >
              <span className="material-symbols-outlined text-[16px]">inventory</span>
              <span>Quản Lý Đơn Hàng THRIFT</span>
            </Link>

            <Link
              to="/thrift"
              className="px-3.5 py-2.5 rounded-DEFAULT bg-surface-container-highest hover:bg-surface text-on-surface font-label-md text-label-md uppercase tracking-wider transition-colors shadow-sm inline-flex items-center gap-1.5 border border-surface-dim"
            >
              <span className="material-symbols-outlined text-[16px]">launch</span>
              <span>Xem Trên Sàn Công Khai</span>
            </Link>

            <button
              type="button"
              onClick={() => setIsEditModalOpen(true)}
              className="px-5 py-2.5 rounded-DEFAULT bg-primary hover:bg-primary-container text-on-primary font-label-md text-label-md uppercase tracking-wider transition-colors shadow-sm inline-flex items-center gap-1.5 cursor-pointer font-semibold"
            >
              <span className="material-symbols-outlined text-[16px]">edit</span>
              <span>Chỉnh Sửa Mục Đăng</span>
            </button>
          </div>
        </div>
      </div>

      {/* MODAL 1: Lightbox Gallery Modal */}
      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 z-50 bg-[#141310]/85 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="relative max-w-4xl max-h-[85vh] rounded overflow-hidden shadow-2xl">
            <img
              src={lightboxImage}
              alt="Archival macro preview"
              className="w-full h-full object-contain"
            />
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute top-3 right-3 w-9 h-9 bg-surface text-on-surface rounded-full flex items-center justify-center shadow-lg"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        </div>
      )}

      {/* MODAL 2: Edit Listing Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#141310]/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container max-w-xl w-full rounded-DEFAULT shadow-2xl overflow-hidden border border-surface-dim flex flex-col max-h-[90vh] animate-fade-in">
            <div className="p-4 bg-surface-container-high border-b border-surface-dim flex items-center justify-between">
              <div>
                <div className="font-serif text-lg font-semibold text-on-surface">
                  Chỉnh Sửa Mục Đăng THRIFT #{listing.sku}
                </div>
                <div className="text-[11px] font-mono text-on-surface-variant">
                  {listing.title}
                </div>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="w-8 h-8 rounded-full bg-surface flex items-center justify-center text-outline hover:text-on-surface transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-6 overflow-y-auto flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface mb-1">
                  Giá Niêm Yết Bán Đứt THRIFT (VND)
                </label>
                <input
                  type="text"
                  value={editPrice}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\D/g, '');
                    setEditPrice(raw ? parseInt(raw, 10).toLocaleString('vi-VN') : '');
                  }}
                  className="w-full bg-surface border border-surface-dim px-3 py-2 text-sm font-mono rounded focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface mb-1">
                  Mô Tả &amp; Báo Cáo Kỹ Thuật Chi Tiết
                </label>
                <textarea
                  rows={5}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full bg-surface border border-surface-dim p-3 text-sm rounded focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                />
              </div>

              <div className="p-3 bg-surface-container-high rounded border border-surface-dim text-xs text-on-surface-variant flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-secondary">security</span>
                <span>
                  Các trường số serial và mã RENT gốc là bất biến (Read-only hash) để đảm bảo tính minh bạch B-Corp.
                </span>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 bg-surface hover:bg-surface-container text-on-surface font-label-md text-label-md uppercase tracking-wider rounded-DEFAULT transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-primary hover:bg-primary-container text-on-primary font-label-md text-label-md uppercase tracking-wider rounded-DEFAULT transition-colors shadow-md font-semibold cursor-pointer"
                >
                  Lưu Thay Đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Customer Inquiry Chat Modal */}
      {isChatModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#141310]/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface max-w-lg w-full rounded-DEFAULT shadow-2xl overflow-hidden border border-surface-dim flex flex-col h-[520px] animate-fade-in">
            {/* Chat Header */}
            <div className="p-4 bg-surface-container-high border-b border-surface-dim flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-xs">
                  KD
                </div>
                <div>
                  <div className="font-title-md text-sm font-semibold text-on-surface">
                    Khách Hỏi Hiện Vật: Elena Rostova
                  </div>
                  <div className="text-[10px] text-secondary flex items-center gap-1 font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                    Đang xem mục #{listing.sku || 'HBL-907X-TH01'}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsChatModalOpen(false)}
                className="w-8 h-8 rounded-full bg-surface flex items-center justify-center text-outline hover:text-on-surface transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {/* Chat Messages */}
            <div className="p-4 overflow-y-auto flex-1 flex flex-col gap-3 bg-surface-container-lowest">
              <div className="p-2.5 bg-surface-container rounded text-center text-[11px] text-on-surface-variant font-mono">
                Bảo chứng đối thoại trực tiếp Atelier ReUse Hub • Mã phiên #CHAT-{listing.id}-881
              </div>

              {chatMessages.map((msg, index) => {
                const isShop = msg.sender === 'shop';
                return (
                  <div
                    key={index}
                    className={`flex flex-col ${isShop ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[85%] p-3 rounded-lg text-xs leading-relaxed ${
                        isShop
                          ? 'bg-primary text-on-primary rounded-br-none'
                          : 'bg-surface-container-high text-on-surface rounded-bl-none border border-surface-dim'
                      }`}
                    >
                      {msg.text}
                    </div>
                    <span className="text-[10px] text-outline mt-1 font-mono px-1">
                      {msg.time}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Chat Input */}
            <form onSubmit={handleSendChat} className="p-3 bg-surface-container border-t border-surface-dim flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Nhập phản hồi tư vấn kỹ thuật..."
                className="flex-1 bg-surface border border-surface-dim px-3 py-2 text-xs rounded focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-primary text-on-primary text-xs uppercase font-semibold tracking-wider rounded transition-colors hover:bg-primary-container cursor-pointer flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[14px]">send</span>
                Gửi
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShopThriftListingDetail;
