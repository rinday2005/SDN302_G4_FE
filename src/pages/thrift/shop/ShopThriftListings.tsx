import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type {
  ThriftListingItem,
  ThriftListingSource,
} from '../../data/shop/thriftListingsData';
import {
  INITIAL_THRIFT_LISTINGS,
  THRIFT_LISTINGS_STORAGE_KEY,
} from '../../data/shop/thriftListingsData';

type StatusFilterType = 'ALL' | 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'AVAILABLE' | 'SOLD' | 'HIDDEN';

export const ShopThriftListings: React.FC = () => {
  const navigate = useNavigate();

  // Local state with persistent storage
  const [listings, setListings] = useState<ThriftListingItem[]>(() => {
    try {
      const stored = localStorage.getItem(THRIFT_LISTINGS_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
      localStorage.setItem(THRIFT_LISTINGS_STORAGE_KEY, JSON.stringify(INITIAL_THRIFT_LISTINGS));
      return INITIAL_THRIFT_LISTINGS;
    } catch (e) {
      console.error('Lỗi đọc THRIFT listings:', e);
      return INITIAL_THRIFT_LISTINGS;
    }
  });

  // Save to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem(THRIFT_LISTINGS_STORAGE_KEY, JSON.stringify(listings));
    } catch (e) {
      console.error('Lỗi ghi THRIFT listings:', e);
    }
  }, [listings]);

  // Filters & Search state
  const [statusFilter, setStatusFilter] = useState<StatusFilterType>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState<'ALL' | ThriftListingSource>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'newest' | 'price_desc' | 'price_asc' | 'cycles'>('newest');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Toast message
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Active item for Inspection Modal (Forensic Dossier)
  const [inspectingItem, setInspectingItem] = useState<ThriftListingItem | null>(null);

  // Active item for Edit / Photo Update Modal
  const [editingItem, setEditingItem] = useState<ThriftListingItem | null>(null);
  const [editPrice, setEditPrice] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editNotes, setEditNotes] = useState('');

  // B-Corp Standards Modal
  const [showStandardsModal, setShowStandardsModal] = useState(false);

  // Helper: show toast
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Filter items
  const filteredListings = useMemo(() => {
    return listings.filter((item) => {
      // Status filter
      if (statusFilter === 'DRAFT' && item.status !== 'DRAFT') return false;
      if (statusFilter === 'PENDING' && item.status !== 'PENDING') return false;
      if (statusFilter === 'APPROVED' && item.status !== 'APPROVED') return false;
      if (statusFilter === 'REJECTED' && item.status !== 'REJECTED') return false;
      if (statusFilter === 'AVAILABLE' && (item.status !== 'APPROVED' || item.isSold)) return false;
      if (statusFilter === 'SOLD' && item.status !== 'SOLD' && !item.isSold) return false;
      if (statusFilter === 'HIDDEN' && item.status !== 'HIDDEN') return false;

      // Source filter
      if (sourceFilter !== 'ALL' && item.source !== sourceFilter) return false;

      // Category filter
      if (categoryFilter !== 'ALL' && item.categoryKey !== categoryFilter) return false;

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = item.title.toLowerCase().includes(q);
        const matchSku = item.sku.toLowerCase().includes(q);
        const matchSerial = (item.serialNumber || '').toLowerCase().includes(q);
        const matchCategory = item.category.toLowerCase().includes(q);
        if (!matchTitle && !matchSku && !matchSerial && !matchCategory) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'price_desc') return b.price - a.price;
      if (sortBy === 'price_asc') return a.price - b.price;
      if (sortBy === 'cycles') return (b.rentalCycles || 0) - (a.rentalCycles || 0);
      return 0; // default order
    });
  }, [listings, statusFilter, sourceFilter, categoryFilter, searchQuery, sortBy]);

  // Pagination calculation
  const totalItems = filteredListings.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const paginatedListings = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredListings.slice(start, start + itemsPerPage);
  }, [filteredListings, currentPage, itemsPerPage]);

  // Metrics counts
  const totalListingsCount = 38; // Display ledger total conforming to user spec
  const availableCount = 24;
  const pendingCount = 5;
  const soldCount = 7;
  const draftCount = 2;
  const secondLifeCount = 14;

  // Handle Export CSV
  const handleExportCSV = () => {
    const headers = ['Mã hiện vật (ID)', 'SKU', 'Tên sản phẩm', 'Danh mục', 'Nguồn gốc', 'Tình trạng', 'Giá niêm yết (VND)', 'Trạng thái', 'Ngày gửi'];
    const rows = listings.map((l) => [
      l.id,
      l.sku,
      `"${l.title.replace(/"/g, '""')}"`,
      `"${l.category}"`,
      l.source,
      `"${l.conditionGrade}"`,
      l.price,
      l.status,
      l.submittedAt,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `So_Muc_Dang_THRIFT_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('ĐÃ XUẤT DANH MỤC THRIFT (CSV) THÀNH CÔNG!');
  };

  // Handle Delete Draft
  const handleDeleteDraft = (id: string, title: string) => {
    if (window.confirm(`Xác nhận xóa bản nháp: "${title}" khỏi hệ thống lưu ký?`)) {
      setListings((prev) => prev.filter((item) => item.id !== id));
      showToast(`Đã xóa bản nháp [${id}] thành công.`);
    }
  };

  // Open Edit page
  const handleOpenEdit = (item: ThriftListingItem) => {
    navigate(`/shop/thrift/listings/${item.id}`);
  };

  // Save edit
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    const newPriceNum = parseInt(editPrice.replace(/\D/g, ''), 10) || editingItem.price;

    setListings((prev) =>
      prev.map((item) => {
        if (item.id === editingItem.id) {
          const isWasRejected = item.status === 'REJECTED';
          return {
            ...item,
            title: editTitle.trim() || item.title,
            price: newPriceNum,
            priceFormatted: newPriceNum.toLocaleString('vi-VN') + ' ₫',
            curatorNotes: editNotes.trim(),
            // If was rejected, updating photos/info resubmits to pending
            status: isWasRejected ? 'PENDING' : item.status,
            statusLabel: isWasRejected ? 'Chờ Duyệt Admin' : item.statusLabel,
            rejectionReason: undefined,
          };
        }
        return item;
      })
    );

    const savedId = editingItem.id;
    setEditingItem(null);
    showToast(`Hồ sơ hiện vật [${savedId}] đã được cập nhật thành công!`);
  };

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

      {/* Atelier Top Banner & Identity Ledger */}
      <div className="w-full bg-surface-container-high py-space-sm px-margin-mobile lg:px-margin border-b border-surface-dim">
        <div className="max-w-[1440px] mx-auto flex flex-wrap items-center justify-between gap-space-sm text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider">
          <div className="flex items-center gap-space-sm flex-wrap">
            <span className="w-2 h-2 rounded-full bg-secondary"></span>
            <span className="font-semibold text-on-surface">Atelier Chronos &amp; Optics</span>
            <span className="text-outline-variant">/</span>
            <span>Quản lý Xưởng: Vũ Thanh Tùng</span>
            <span className="px-1.5 py-0.5 bg-surface-container text-on-surface font-mono rounded-DEFAULT text-[9px]">
              ID: #OWNER-01
            </span>
          </div>
          <div className="flex items-center gap-space-md flex-wrap">
            <span className="inline-flex items-center gap-1.5 text-secondary">
              <span className="material-symbols-outlined text-[14px]">verified</span>
              Lưu ký Độc quyền Đã Chứng thực
            </span>
            <span className="text-outline-variant">•</span>
            <span className="font-mono text-on-surface-variant">Sổ Đăng bộ Tuần hoàn Kỳ 2024.Q4</span>
          </div>
        </div>
      </div>


      {/* Main Content Canvas */}
      <div className="w-full px-margin-mobile lg:px-margin py-space-xl max-w-[1440px] mx-auto flex flex-col gap-space-xl flex-1">
        {/* Breadcrumb & Header Action Strip */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-space-lg">
          <div className="flex flex-col gap-space-xs">
            <div className="flex items-center gap-2 font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
              <Link className="hover:text-primary transition-colors" to="/shop/dashboard">
                Bảng điều khiển xưởng
              </Link>
              <span className="text-outline-variant">/</span>
              <Link className="hover:text-primary transition-colors" to="/shop/thrift/listings">
                Bán đứt THRIFT
              </Link>
              <span className="text-outline-variant">/</span>
              <span className="text-on-surface font-semibold">Mục đăng lưu ký</span>
            </div>
            <h1 className="font-serif text-3xl lg:text-4xl text-on-surface tracking-tight">
              Sổ Mục Đăng THRIFT
            </h1>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl">
              Quản lý danh mục chuyển giao sở hữu vĩnh viễn, lưu ký trực tiếp và hiện vật Second Life được bàn giao từ kho tuần hoàn RENT. Mọi niêm yết đều chịu kiểm duyệt độc lập từ Hội đồng Thẩm định ReUse Hub.
            </p>
          </div>

          {/* Action Button Group */}
          <div className="flex flex-wrap items-center gap-space-sm shrink-0">
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-2 px-space-md py-2.5 bg-surface-container-high hover:bg-surface-container text-on-surface font-label-md text-label-md uppercase tracking-wider transition-colors rounded-DEFAULT shadow-sm cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">file_download</span>
              Xuất Danh Mục (CSV)
            </button>
            <Link
              to="/shop/thrift/orders"
              className="inline-flex items-center gap-2 px-space-md py-2.5 bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md uppercase tracking-wider transition-colors rounded-DEFAULT shadow-sm"
            >
              <span className="material-symbols-outlined text-[18px]">receipt_long</span>
              Xem Đơn Bán THRIFT
            </Link>
            <Link
              to="/shop/thrift/listings/create"
              className="inline-flex items-center gap-2 px-space-lg py-2.5 bg-primary hover:bg-primary-container text-on-primary font-label-md text-label-md uppercase tracking-wider font-semibold transition-all shadow-md rounded-DEFAULT"
            >
              <span className="material-symbols-outlined text-[18px]">add_circle</span>
              + Tạo Mục Đăng THRIFT Mới
            </Link>
          </div>
        </div>

        {/* Governance Protocol Warning Notice (B-Corp & Platform Integrity) */}
        <div className="bg-surface-container-low p-space-md rounded-DEFAULT flex flex-col md:flex-row md:items-center justify-between gap-space-md shadow-sm border border-surface-dim">
          <div className="flex items-start gap-space-sm">
            <div className="p-2 bg-secondary/10 text-secondary rounded-DEFAULT shrink-0 mt-0.5">
              <span className="material-symbols-outlined text-[20px]">gavel</span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-title-md text-title-md text-on-surface">Nguyên Tắc Thẩm Quyền Kiểm Duyệt (B-Corp Protocol)</span>
                <span className="px-2 py-0.5 bg-secondary text-on-secondary font-label-sm text-label-sm uppercase tracking-wider rounded-DEFAULT">
                  Bắt Buộc
                </span>
              </div>
              <p className="font-body-md text-body-md text-on-surface-variant mt-1">
                Chủ xưởng <strong className="text-on-surface">không có quyền tự phê duyệt</strong> mục đăng của chính mình. Theo chuẩn mực giám tuyển minh bạch, toàn bộ hiện vật THRIFT phải vượt qua kiểm định quang học/cơ học từ Admin ReUse Hub trước khi hiển thị công khai tới người sưu tầm.
              </p>
            </div>
          </div>
          <div className="shrink-0 flex items-center gap-2 pl-4 md:pl-0">
            <button
              onClick={() => setShowStandardsModal(true)}
              className="inline-flex items-center gap-1 font-label-sm text-label-sm text-primary uppercase tracking-wider font-bold hover:underline cursor-pointer"
            >
              Xem Quy Chuẩn Thẩm Định
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
          </div>
        </div>

        {/* Metrics Overview Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-space-sm">
          {/* Total */}
          <button
            onClick={() => { setStatusFilter('ALL'); setSourceFilter('ALL'); }}
            className={`text-left bg-surface-container p-space-md rounded-DEFAULT shadow-sm flex flex-col justify-between transition-all hover:ring-2 hover:ring-primary ${statusFilter === 'ALL' && sourceFilter === 'ALL' ? 'ring-2 ring-primary bg-surface-container-high' : ''}`}
          >
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">Tổng mục đăng</span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-serif text-3xl text-on-surface font-semibold">{totalListingsCount}</span>
              <span className="font-body-sm text-body-sm text-on-surface-variant">hiện vật</span>
            </div>
            <div className="mt-2 pt-2 border-t border-surface-dim text-[11px] font-mono text-on-surface-variant">
              100% Đăng ký số
            </div>
          </button>

          {/* Available */}
          <button
            onClick={() => { setStatusFilter('AVAILABLE'); setSourceFilter('ALL'); }}
            className={`text-left bg-surface-container p-space-md rounded-DEFAULT shadow-sm flex flex-col justify-between transition-all hover:ring-2 hover:ring-secondary ${statusFilter === 'AVAILABLE' ? 'ring-2 ring-secondary bg-surface-container-high' : ''}`}
          >
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">Đang mở bán</span>
              <span className="w-2 h-2 rounded-full bg-secondary"></span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-serif text-3xl text-secondary font-semibold">
                {String(availableCount).padStart(2, '0')}
              </span>
              <span className="font-body-sm text-body-sm text-on-surface-variant">sẵn sàng</span>
            </div>
            <div className="mt-2 pt-2 border-t border-surface-dim text-[11px] font-mono text-secondary">
              Sẵn sàng giao
            </div>
          </button>

          {/* Pending Approval */}
          <button
            onClick={() => { setStatusFilter('PENDING'); setSourceFilter('ALL'); }}
            className={`text-left bg-surface-container p-space-md rounded-DEFAULT shadow-sm flex flex-col justify-between transition-all hover:ring-2 hover:ring-primary ${statusFilter === 'PENDING' ? 'ring-2 ring-primary bg-surface-container-high' : ''}`}
          >
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">Chờ duyệt</span>
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-serif text-3xl text-primary font-semibold">
                {String(pendingCount).padStart(2, '0')}
              </span>
              <span className="font-body-sm text-body-sm text-on-surface-variant">hồ sơ</span>
            </div>
            <div className="mt-2 pt-2 border-t border-surface-dim text-[11px] font-mono text-primary">
              Đang thẩm tra
            </div>
          </button>

          {/* Sold */}
          <button
            onClick={() => { setStatusFilter('SOLD'); setSourceFilter('ALL'); }}
            className={`text-left bg-surface-container p-space-md rounded-DEFAULT shadow-sm flex flex-col justify-between transition-all hover:ring-2 hover:ring-outline ${statusFilter === 'SOLD' ? 'ring-2 ring-outline bg-surface-container-high' : ''}`}
          >
            <div className="flex items-center justify-between">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">Đã bán</span>
              <span className="w-2 h-2 rounded-full bg-on-surface-variant"></span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-serif text-3xl text-on-surface font-semibold">
                {String(soldCount).padStart(2, '0')}
              </span>
              <span className="font-body-sm text-body-sm text-on-surface-variant">hoàn tất</span>
            </div>
            <div className="mt-2 pt-2 border-t border-surface-dim text-[11px] font-mono text-on-surface-variant">
              Đã đổi chủ
            </div>
          </button>

          {/* Draft */}
          <button
            onClick={() => { setStatusFilter('DRAFT'); setSourceFilter('ALL'); }}
            className={`text-left bg-surface-container p-space-md rounded-DEFAULT shadow-sm flex flex-col justify-between transition-all hover:ring-2 hover:ring-outline ${statusFilter === 'DRAFT' ? 'ring-2 ring-outline bg-surface-container-high' : ''}`}
          >
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">Bản nháp</span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-serif text-3xl text-on-surface-variant font-semibold">
                {String(draftCount).padStart(2, '0')}
              </span>
              <span className="font-body-sm text-body-sm text-on-surface-variant">chưa gửi</span>
            </div>
            <div className="mt-2 pt-2 border-t border-surface-dim text-[11px] font-mono text-on-surface-variant">
              Thiếu chứng chỉ
            </div>
          </button>

          {/* Second Life Origin */}
          <button
            onClick={() => { setSourceFilter('RETURNED_RENTAL'); setStatusFilter('ALL'); }}
            className={`text-left bg-secondary-container/30 p-space-md rounded-DEFAULT shadow-sm flex flex-col justify-between transition-all hover:ring-2 hover:ring-secondary ${sourceFilter === 'RETURNED_RENTAL' ? 'ring-2 ring-secondary bg-secondary-container/60' : ''}`}
          >
            <div className="flex items-center justify-between text-secondary">
              <span className="font-label-sm text-label-sm uppercase tracking-wider font-bold">Nguồn Second Life</span>
              <span className="material-symbols-outlined text-[16px]">all_inclusive</span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-serif text-3xl text-secondary font-semibold">{secondLifeCount}</span>
              <span className="font-body-sm text-body-sm text-secondary font-medium">hiện vật</span>
            </div>
            <div className="mt-2 pt-2 border-t border-secondary/20 text-[11px] font-mono text-secondary">
              Từ Kho RENT
            </div>
          </button>
        </div>

        {/* Filter & Registry Control Bar */}
        <div className="flex flex-col gap-space-md bg-surface-container p-space-md rounded-DEFAULT shadow-sm border border-surface-dim">
          {/* Status Tabs */}
          <div className="flex items-center gap-space-xs overflow-x-auto pb-1 no-scrollbar">
            <button
              onClick={() => { setStatusFilter('ALL'); setCurrentPage(1); }}
              className={`px-3 py-1.5 font-label-md text-label-md uppercase tracking-wider rounded-DEFAULT whitespace-nowrap shadow-sm transition-colors cursor-pointer ${
                statusFilter === 'ALL'
                  ? 'bg-on-surface text-surface'
                  : 'bg-surface-container-high hover:bg-surface-container-highest text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Tất cả (38)
            </button>
            <button
              onClick={() => { setStatusFilter('DRAFT'); setCurrentPage(1); }}
              className={`px-3 py-1.5 font-label-md text-label-md uppercase tracking-wider rounded-DEFAULT whitespace-nowrap transition-colors cursor-pointer ${
                statusFilter === 'DRAFT'
                  ? 'bg-on-surface text-surface'
                  : 'bg-surface-container-high hover:bg-surface-container-highest text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Bản nháp (2)
            </button>
            <button
              onClick={() => { setStatusFilter('PENDING'); setCurrentPage(1); }}
              className={`px-3 py-1.5 font-label-md text-label-md uppercase tracking-wider rounded-DEFAULT whitespace-nowrap transition-colors cursor-pointer ${
                statusFilter === 'PENDING'
                  ? 'bg-on-surface text-surface'
                  : 'bg-surface-container-high hover:bg-surface-container-highest text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Chờ duyệt (5)
            </button>
            <button
              onClick={() => { setStatusFilter('APPROVED'); setCurrentPage(1); }}
              className={`px-3 py-1.5 font-label-md text-label-md uppercase tracking-wider rounded-DEFAULT whitespace-nowrap transition-colors cursor-pointer ${
                statusFilter === 'APPROVED'
                  ? 'bg-on-surface text-surface'
                  : 'bg-surface-container-high hover:bg-surface-container-highest text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Đã duyệt (26)
            </button>
            <button
              onClick={() => { setStatusFilter('REJECTED'); setCurrentPage(1); }}
              className={`px-3 py-1.5 font-label-md text-label-md uppercase tracking-wider rounded-DEFAULT whitespace-nowrap transition-colors cursor-pointer ${
                statusFilter === 'REJECTED'
                  ? 'bg-on-surface text-surface'
                  : 'bg-surface-container-high hover:bg-surface-container-highest text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Từ chối (1)
            </button>
            <button
              onClick={() => { setStatusFilter('AVAILABLE'); setCurrentPage(1); }}
              className={`px-3 py-1.5 font-label-md text-label-md uppercase tracking-wider rounded-DEFAULT whitespace-nowrap transition-colors cursor-pointer ${
                statusFilter === 'AVAILABLE'
                  ? 'bg-on-surface text-surface'
                  : 'bg-surface-container-high hover:bg-surface-container-highest text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Đang mở bán (24)
            </button>
            <button
              onClick={() => { setStatusFilter('SOLD'); setCurrentPage(1); }}
              className={`px-3 py-1.5 font-label-md text-label-md uppercase tracking-wider rounded-DEFAULT whitespace-nowrap transition-colors cursor-pointer ${
                statusFilter === 'SOLD'
                  ? 'bg-on-surface text-surface'
                  : 'bg-surface-container-high hover:bg-surface-container-highest text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Đã bán (7)
            </button>
            <button
              onClick={() => { setStatusFilter('HIDDEN'); setCurrentPage(1); }}
              className={`px-3 py-1.5 font-label-md text-label-md uppercase tracking-wider rounded-DEFAULT whitespace-nowrap transition-colors cursor-pointer ${
                statusFilter === 'HIDDEN'
                  ? 'bg-on-surface text-surface'
                  : 'bg-surface-container-high hover:bg-surface-container-highest text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Đang ẩn (1)
            </button>
          </div>

          {/* Search & Granular Dropdown Selectors */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-space-sm items-center pt-space-xs">
            {/* Search Field */}
            <div className="md:col-span-5 relative">
              <span className="material-symbols-outlined text-[18px] text-on-surface-variant absolute left-3 top-1/2 -translate-y-1/2">
                search
              </span>
              <input
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="w-full bg-surface py-2 pl-9 pr-3 text-body-md font-body-md text-on-surface placeholder:text-outline focus:outline-none rounded-DEFAULT shadow-inner border border-surface-dim"
                placeholder="Tìm theo tên hiện vật, SKU, Serial No, danh mục..."
                type="text"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              )}
            </div>

            {/* Filter: Source */}
            <div className="md:col-span-3">
              <select
                value={sourceFilter}
                onChange={(e) => { setSourceFilter(e.target.value as 'ALL' | ThriftListingSource); setCurrentPage(1); }}
                className="w-full bg-surface py-2 px-3 text-body-md font-body-md text-on-surface focus:outline-none rounded-DEFAULT shadow-inner cursor-pointer border border-surface-dim"
              >
                <option value="ALL">Nguồn gốc: Tất cả nguồn</option>
                <option value="RETURNED_RENTAL">RETURNED_RENTAL (Chuyển giao từ RENT)</option>
                <option value="SHOP_INVENTORY">SHOP_INVENTORY (Kho xưởng trực tiếp)</option>
              </select>
            </div>

            {/* Filter: Category */}
            <div className="md:col-span-2">
              <select
                value={categoryFilter}
                onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
                className="w-full bg-surface py-2 px-3 text-body-md font-body-md text-on-surface focus:outline-none rounded-DEFAULT shadow-inner cursor-pointer border border-surface-dim"
              >
                <option value="ALL">Danh mục: Tất cả</option>
                <option value="cameras">Camera &amp; Quang học</option>
                <option value="audio">Âm thanh Cổ điển</option>
                <option value="furniture">Thiết kế &amp; Nội thất</option>
                <option value="horology">Đồng hồ &amp; Cơ khí</option>
              </select>
            </div>

            {/* Filter: Sort */}
            <div className="md:col-span-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'newest' | 'price_desc' | 'price_asc' | 'cycles')}
                className="w-full bg-surface py-2 px-3 text-body-md font-body-md text-on-surface focus:outline-none rounded-DEFAULT shadow-inner cursor-pointer border border-surface-dim"
              >
                <option value="newest">Sắp xếp: Mới nhất</option>
                <option value="price_desc">Giá: Cao → Thấp</option>
                <option value="price_asc">Giá: Thấp → Cao</option>
                <option value="cycles">Số chu kỳ lưu ký</option>
              </select>
            </div>
          </div>
        </div>

        {/* Listings Cards Grid (Forensic Dossiers) */}
        {paginatedListings.length === 0 ? (
          <div className="bg-surface-container rounded-DEFAULT p-12 text-center flex flex-col items-center justify-center border border-surface-dim">
            <span className="material-symbols-outlined text-[48px] text-outline mb-3">inventory_2</span>
            <div className="font-serif text-xl text-on-surface">Không tìm thấy mục đăng phù hợp</div>
            <p className="text-body-sm text-on-surface-variant max-w-md mt-1">
              Thử thay đổi bộ lọc trạng thái hoặc từ khóa tìm kiếm để tra cứu hồ sơ hiện vật khác trong sổ đăng bộ.
            </p>
            <button
              onClick={() => { setStatusFilter('ALL'); setSourceFilter('ALL'); setCategoryFilter('ALL'); setSearchQuery(''); }}
              className="mt-4 px-4 py-2 bg-primary text-on-primary font-label-md text-label-md uppercase tracking-wider rounded-DEFAULT"
            >
              Xóa bộ lọc
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-lg">
            {paginatedListings.map((item) => {
              const isSecondLife = item.source === 'RETURNED_RENTAL';
              const isSold = item.status === 'SOLD' || item.isSold;
              const isRejected = item.status === 'REJECTED';
              const isDraft = item.status === 'DRAFT';
              const isPending = item.status === 'PENDING';
              const isApproved = item.status === 'APPROVED';

              return (
                <div
                  key={item.id}
                  className={`bg-surface-container rounded-DEFAULT shadow-sm flex flex-col justify-between overflow-hidden group hover:shadow-md transition-shadow border border-surface-dim ${
                    isSold ? 'opacity-90' : ''
                  }`}
                >
                  <div className="p-space-md flex flex-col gap-space-sm">
                    {/* Thumbnail & Source Badges */}
                    <div className="relative w-full aspect-[4/3] bg-surface-container-high rounded-DEFAULT overflow-hidden">
                      <Link to={`/shop/thrift/listings/${item.id}`} className="block w-full h-full cursor-pointer">
                        <img
                          className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${
                            isSold ? 'grayscale-[0.25]' : ''
                          }`}
                          src={item.image}
                          alt={item.title}
                          loading="lazy"
                        />
                      </Link>

                      {/* Top Badges (Left) */}
                      <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 items-start">
                        {isSecondLife ? (
                          <>
                            <span className="px-2 py-0.5 bg-secondary text-on-secondary font-label-sm text-label-sm uppercase tracking-wider rounded-DEFAULT shadow-sm flex items-center gap-1">
                              <span className="material-symbols-outlined text-[12px]">recycling</span>
                              Second Life Item
                            </span>
                            {item.rentalCycles !== undefined && item.rentalCycles > 0 && (
                              <span className="px-2 py-0.5 bg-surface/90 backdrop-blur-sm text-on-surface font-mono text-[10px] rounded-DEFAULT">
                                {item.rentalCycles < 10 ? `0${item.rentalCycles}` : item.rentalCycles} chu kỳ lưu ký RENT
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="px-2 py-0.5 bg-surface/90 backdrop-blur-sm text-on-surface font-label-sm text-label-sm uppercase tracking-wider rounded-DEFAULT shadow-sm flex items-center gap-1">
                            <span className="material-symbols-outlined text-[12px]">storefront</span>
                            Kho Xưởng Ký Gửi
                          </span>
                        )}
                      </div>

                      {/* Top Badges (Right Status) */}
                      <div className="absolute top-2.5 right-2.5">
                        {isApproved && (
                          <span className="px-2 py-0.5 bg-secondary-container text-on-secondary-fixed-variant font-label-sm text-label-sm uppercase tracking-wider rounded-DEFAULT font-semibold shadow-sm">
                            Đã Duyệt (Admin)
                          </span>
                        )}
                        {isPending && (
                          <span className="px-2 py-0.5 bg-primary-fixed text-on-primary-fixed-variant font-label-sm text-label-sm uppercase tracking-wider rounded-DEFAULT font-semibold shadow-sm flex items-center gap-1">
                            <span className="material-symbols-outlined text-[12px] animate-spin">sync</span>
                            Chờ Duyệt Admin
                          </span>
                        )}
                        {isSold && (
                          <span className="px-2 py-0.5 bg-inverse-surface text-inverse-on-surface font-label-sm text-label-sm uppercase tracking-wider rounded-DEFAULT font-semibold shadow-sm">
                            ĐÃ BÁN (SOLD)
                          </span>
                        )}
                        {isRejected && (
                          <span className="px-2 py-0.5 bg-error text-on-error font-label-sm text-label-sm uppercase tracking-wider rounded-DEFAULT font-semibold shadow-sm">
                            Từ Chối Duyệt
                          </span>
                        )}
                        {isDraft && (
                          <span className="px-2 py-0.5 bg-surface-dim text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider rounded-DEFAULT font-semibold shadow-sm">
                            BẢN NHÁP (Draft)
                          </span>
                        )}
                      </div>

                      {/* Bottom In-Stock Overlay */}
                      <div className="absolute bottom-2.5 left-2.5">
                        {isRejected ? (
                          <div className="bg-error-container text-on-error-container px-2 py-0.5 rounded-DEFAULT text-label-sm font-label-sm">
                            {item.rejectionReason || 'Cần bổ sung ảnh tem đáy gỗ'}
                          </div>
                        ) : isDraft ? (
                          <div className="bg-surface/90 backdrop-blur-sm px-2 py-0.5 rounded-DEFAULT text-on-surface font-label-sm text-label-sm uppercase tracking-wider">
                            Chưa gửi kiểm duyệt
                          </div>
                        ) : isSold ? (
                          <div className="bg-primary text-on-primary px-2 py-0.5 rounded-DEFAULT font-label-sm text-label-sm uppercase tracking-wider">
                            Chờ đối soát ký quỹ
                          </div>
                        ) : isPending ? (
                          <div className="bg-surface/90 backdrop-blur-sm px-2 py-0.5 rounded-DEFAULT text-on-surface font-label-sm text-label-sm uppercase tracking-wider">
                            Chưa mở bán công khai
                          </div>
                        ) : (
                          <div className="bg-surface/90 backdrop-blur-sm px-2 py-0.5 rounded-DEFAULT text-on-surface font-label-sm text-label-sm uppercase tracking-wider">
                            Còn hàng (1/1 Specimen)
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Title & Metadata */}
                    <div className="flex flex-col gap-1 mt-1">
                      <div className="flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm">
                        <span className="uppercase font-semibold tracking-wider text-primary">{item.category}</span>
                        <span className="font-mono text-outline">SKU: {item.sku}</span>
                      </div>
                      <Link to={`/shop/thrift/listings/${item.id}`} className="block">
                        <h2 className="font-serif text-lg font-semibold text-on-surface line-clamp-1 group-hover:text-primary transition-colors hover:underline cursor-pointer">
                          {item.title}
                        </h2>
                      </Link>
                      <p className="font-body-sm text-body-sm text-on-surface-variant line-clamp-1">
                        {item.description}
                      </p>
                    </div>

                    {/* Appraisal Condition & Valuation Spec */}
                    <div className="bg-surface-container-high/60 p-2.5 rounded-DEFAULT flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="font-label-sm text-label-sm uppercase text-on-surface-variant">Tình trạng Thẩm định</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              isApproved
                                ? 'bg-secondary'
                                : isPending
                                ? 'bg-primary'
                                : isRejected
                                ? 'bg-outline'
                                : 'bg-secondary'
                            }`}
                          ></span>
                          <span className="font-title-md text-title-md text-on-surface font-semibold">{item.conditionGrade}</span>
                        </div>
                      </div>
                      <div className="text-right flex flex-col">
                        <span className="font-label-sm text-label-sm uppercase text-on-surface-variant">
                          {isSold
                            ? 'Giá Chuyển Giao'
                            : isRejected
                            ? 'Giá Đề Xuất'
                            : isDraft
                            ? 'Dự kiến Niêm Yết'
                            : 'Giá Bán Đứt THRIFT'}
                        </span>
                        <span
                          className={`font-title-md text-title-md font-bold ${
                            isSold ? 'line-through text-on-surface' : 'text-primary'
                          }`}
                        >
                          {item.priceFormatted}
                        </span>
                      </div>
                    </div>

                    {/* Provenance Transfer Link / Warranty */}
                    <div className="pt-1">
                      {isSecondLife && item.rentHistoryUrl ? (
                        <Link
                          to={item.rentHistoryUrl}
                          className="inline-flex items-center gap-1.5 text-secondary font-label-sm text-label-sm uppercase tracking-wider hover:underline"
                        >
                          <span className="material-symbols-outlined text-[14px]">history_edu</span>
                          Xem Lý lịch Hiện vật Gốc RENT (#{item.originalRentInvId || 'RENT-INV'})
                        </Link>
                      ) : isSold && item.orderId ? (
                        <span className="inline-flex items-center gap-1.5 text-secondary font-label-sm text-label-sm uppercase tracking-wider">
                          <span className="material-symbols-outlined text-[14px]">check_circle</span>
                          Khách hàng đã ký nhận bàn giao qua Đơn #{item.orderId}
                        </span>
                      ) : isDraft ? (
                        <span className="inline-flex items-center gap-1.5 text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider">
                          <span className="material-symbols-outlined text-[14px]">info</span>
                          {item.draftNotes || 'Cần hoàn tất hồ sơ đo điện áp và giấy chứng thực'}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider">
                          <span className="material-symbols-outlined text-[14px]">shield</span>
                          {item.warranty || 'Bảo hành Cơ học 12 Tháng Atelier'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action Tray */}
                  <div className="p-space-md pt-0 flex items-center gap-space-xs bg-surface-container">
                    {isRejected ? (
                      <>
                        <Link
                          to={`/shop/thrift/listings/${item.id}`}
                          className="flex-1 text-center py-2 bg-primary text-on-primary hover:bg-primary-container font-label-md text-label-md uppercase tracking-wider rounded-DEFAULT transition-colors shadow-sm cursor-pointer"
                        >
                          Cập nhật Hồ sơ Ảnh
                        </Link>
                        <Link
                          to={`/shop/thrift/listings/${item.id}`}
                          className="px-3 py-2 bg-surface hover:bg-surface-container-high text-on-surface font-label-md text-label-md uppercase tracking-wider rounded-DEFAULT transition-colors shadow-sm cursor-pointer flex items-center justify-center"
                          title="Xem chi tiết & Chỉnh sửa"
                        >
                          <span className="material-symbols-outlined text-[16px] block">visibility</span>
                        </Link>
                      </>
                    ) : isDraft ? (
                      <>
                        <Link
                          to={`/shop/thrift/listings/${item.id}`}
                          className="flex-1 text-center py-2 bg-primary hover:bg-primary-container text-on-primary font-label-md text-label-md uppercase tracking-wider rounded-DEFAULT transition-colors shadow-sm cursor-pointer"
                        >
                          Tiếp tục Soạn thảo
                        </Link>
                        <button
                          onClick={() => handleDeleteDraft(item.id, item.title)}
                          className="px-3 py-2 bg-surface hover:bg-error/10 hover:text-error text-on-surface-variant font-label-md text-label-md uppercase tracking-wider rounded-DEFAULT transition-colors shadow-sm cursor-pointer"
                          title="Xóa bản nháp"
                        >
                          <span className="material-symbols-outlined text-[16px] block">delete</span>
                        </button>
                      </>
                    ) : isSold && item.orderId ? (
                      <>
                        <Link
                          to={`/shop/thrift/listings/${item.id}`}
                          className="flex-1 text-center py-2 bg-surface hover:bg-surface-container-high text-on-surface font-label-md text-label-md uppercase tracking-wider rounded-DEFAULT transition-colors shadow-sm"
                        >
                          Chỉnh sửa / Chi tiết
                        </Link>
                        <Link
                          to={`/shop/thrift/orders?order=${item.orderId}`}
                          className="px-3 py-2 bg-secondary text-on-secondary hover:bg-secondary/90 font-label-md text-label-md uppercase tracking-wider rounded-DEFAULT transition-colors shadow-sm flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-[16px]">receipt_long</span>
                          Đơn hàng
                        </Link>
                      </>
                    ) : (
                      <>
                        <Link
                          to={`/shop/thrift/listings/${item.id}`}
                          className="flex-1 text-center py-2 bg-surface hover:bg-surface-container-high text-on-surface font-label-md text-label-md uppercase tracking-wider rounded-DEFAULT transition-colors shadow-sm"
                        >
                          Chỉnh sửa mục đăng
                        </Link>
                        <Link
                          to={`/shop/thrift/listings/${item.id}`}
                          className="px-3 py-2 bg-surface hover:bg-surface-container-high text-on-surface font-label-md text-label-md uppercase tracking-wider rounded-DEFAULT transition-colors shadow-sm cursor-pointer flex items-center justify-center"
                          title="Chỉnh sửa thông tin"
                        >
                          <span className="material-symbols-outlined text-[16px] block">edit</span>
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination & Registry Audit Ledger Navigation */}
        <div className="bg-surface-container p-space-md rounded-DEFAULT shadow-sm flex flex-col sm:flex-row items-center justify-between gap-space-md text-on-surface-variant font-body-sm text-body-sm border border-surface-dim">
          <div className="flex items-center gap-2">
            <span>
              Hiển thị <strong className="text-on-surface font-semibold">{totalItems > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} – {Math.min(currentPage * itemsPerPage, totalItems)}</strong> trên tổng số <strong className="text-on-surface font-semibold">{totalItems}</strong> hiện vật lưu ký
            </span>
            <span className="text-outline-variant">•</span>
            <span className="font-mono text-xs">Mã trang: 0{currentPage}/0{totalPages > 9 ? totalPages : `0${totalPages}`.slice(-2)}</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="p-2 bg-surface hover:bg-surface-container-high text-on-surface disabled:opacity-40 rounded-DEFAULT transition-colors shadow-sm cursor-pointer disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-[18px] block">chevron_left</span>
            </button>

            {Array.from({ length: totalPages }).map((_, i) => {
              const pageNum = i + 1;
              const isActive = currentPage === pageNum;
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-8 h-8 font-label-md text-label-md rounded-DEFAULT shadow-sm transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-primary text-on-primary font-bold'
                      : 'bg-surface hover:bg-surface-container-high text-on-surface'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="p-2 bg-surface hover:bg-surface-container-high text-on-surface disabled:opacity-40 rounded-DEFAULT transition-colors shadow-sm cursor-pointer disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-[18px] block">chevron_right</span>
            </button>
          </div>
        </div>

        {/* Atelier Curatorial Protocol Footer Anchor */}
        <div className="bg-surface-container-low p-space-lg rounded-DEFAULT shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-space-lg border border-surface-dim">
          <div className="flex items-start gap-space-md">
            <div className="p-3 bg-secondary-container text-on-secondary-fixed-variant rounded-DEFAULT shrink-0">
              <span className="material-symbols-outlined text-[24px]">verified_user</span>
            </div>
            <div className="flex flex-col">
              <h3 className="font-serif text-lg font-semibold text-on-surface">
                Cam Kết Bảo Chứng Tuần Hoàn B-Corp &amp; Giám Tuyển Độc Lập
              </h3>
              <p className="font-body-md text-body-md text-on-surface-variant max-w-3xl mt-1">
                Mỗi hiện vật chuyển từ RENT sang THRIFT tại Atelier Chronos &amp; Optics đều được cấp Giấy Chứng Nhận Tuổi Thọ Hiện Vật (Circularity Certificate), ghi nhận trọn vẹn số giờ phục vụ, số chu kỳ lưu hành và lịch sử phục dựng cơ học.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-space-sm shrink-0">
            <button
              onClick={() => setShowStandardsModal(true)}
              className="px-space-md py-2 bg-surface text-on-surface hover:bg-surface-container font-label-md text-label-md uppercase tracking-wider rounded-DEFAULT shadow-sm transition-colors cursor-pointer border border-surface-dim"
            >
              Sổ Lưu Ký Trung Tâm
            </button>
          </div>
        </div>
      </div>

      {/* MODAL 1: Forensic Dossier Inspection Modal */}
      {inspectingItem && (
        <div className="fixed inset-0 z-50 bg-[#141310]/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container max-w-3xl w-full rounded-DEFAULT shadow-2xl overflow-hidden border border-surface-dim flex flex-col max-h-[90vh] animate-fade-in">
            {/* Modal Header */}
            <div className="p-4 bg-surface-container-high border-b border-surface-dim flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-[20px]">verified</span>
                <div>
                  <div className="font-serif text-lg font-semibold text-on-surface">
                    Hồ Sơ Giám Tuyển Lưu Ký THRIFT
                  </div>
                  <div className="text-[11px] font-mono text-on-surface-variant">
                    SKU: {inspectingItem.sku} • ID: {inspectingItem.id}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setInspectingItem(null)}
                className="w-8 h-8 rounded-full bg-surface flex items-center justify-center text-outline hover:text-on-surface transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex flex-col gap-5">
              <div className="flex flex-col md:flex-row gap-5">
                <div className="w-full md:w-1/2 aspect-[4/3] rounded overflow-hidden bg-surface-container-high relative">
                  <img
                    src={inspectingItem.image}
                    alt={inspectingItem.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 left-2 bg-surface/90 backdrop-blur-sm px-2 py-0.5 rounded text-[11px] font-mono font-semibold">
                    {inspectingItem.conditionGrade}
                  </div>
                </div>

                <div className="w-full md:w-1/2 flex flex-col justify-between">
                  <div>
                    <span className="text-[11px] uppercase tracking-wider font-semibold text-primary">
                      {inspectingItem.category}
                    </span>
                    <h3 className="font-serif text-xl font-bold text-on-surface mt-1">
                      {inspectingItem.title}
                    </h3>
                    <p className="text-body-sm text-on-surface-variant mt-2">
                      {inspectingItem.description}
                    </p>

                    <div className="mt-4 p-3 bg-surface rounded border border-surface-dim">
                      <div className="text-[11px] uppercase tracking-wider text-outline">Định Giá Chuyển Giao</div>
                      <div className="text-2xl font-bold text-primary font-mono mt-0.5">
                        {inspectingItem.priceFormatted}
                      </div>
                      <div className="text-[10px] text-on-surface-variant mt-1 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[12px] text-secondary">lock</span>
                        Bảo hộ giải ngân đa bước Escrow Protocol
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-col gap-1 text-[11px] text-on-surface-variant">
                    <div><strong>Số Serial:</strong> {inspectingItem.serialNumber || 'Đang cập nhật'}</div>
                    <div><strong>Ngày nộp hồ sơ:</strong> {inspectingItem.submittedAt}</div>
                    <div><strong>Thẩm định viên:</strong> {inspectingItem.appraiserName || 'Hội đồng ReUse Hub'}</div>
                  </div>
                </div>
              </div>

              {/* Provenance breakdown */}
              <div className="bg-surface-container-low p-4 rounded border border-surface-dim">
                <div className="font-title-md text-title-md text-on-surface font-semibold flex items-center gap-1.5 mb-2">
                  <span className="material-symbols-outlined text-[18px] text-secondary">history_edu</span>
                  Biên Bản Giám Tuyển Hiện Vật &amp; Chu Kỳ Lưu Ký
                </div>
                <p className="text-body-sm text-on-surface-variant leading-relaxed">
                  {inspectingItem.curatorNotes ||
                    'Hiện vật đã qua kiểm chuẩn trắc quang sai, kiểm tra mạch khuếch đại và độ ổn định cơ học. Đạt tiêu chuẩn cấp chứng thư Circularity Certificate.'}
                </p>
                {inspectingItem.rentalCycles && inspectingItem.rentalCycles > 0 && (
                  <div className="mt-3 pt-3 border-t border-surface-dim flex items-center justify-between text-xs font-mono">
                    <span>Số vòng tuần hoàn RENT trước chuyển giao:</span>
                    <span className="font-bold text-secondary">{inspectingItem.rentalCycles} chu kỳ</span>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-surface-container-high border-t border-surface-dim flex items-center justify-between">
              <span className="text-[11px] text-outline font-mono">
                Hash: #RH-CERT-{inspectingItem.id}-2026
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setInspectingItem(null)}
                  className="px-4 py-2 bg-surface hover:bg-surface-container text-on-surface font-label-md text-label-md uppercase tracking-wider rounded-DEFAULT transition-colors"
                >
                  Đóng
                </button>
                <button
                  onClick={() => {
                    const item = inspectingItem;
                    setInspectingItem(null);
                    handleOpenEdit(item);
                  }}
                  className="px-4 py-2 bg-primary hover:bg-primary-container text-on-primary font-label-md text-label-md uppercase tracking-wider rounded-DEFAULT transition-colors"
                >
                  Chỉnh sửa hồ sơ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Edit / Update Photo Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-[#141310]/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container max-w-xl w-full rounded-DEFAULT shadow-2xl overflow-hidden border border-surface-dim flex flex-col max-h-[90vh] animate-fade-in">
            {/* Modal Header */}
            <div className="p-4 bg-surface-container-high border-b border-surface-dim flex items-center justify-between">
              <div>
                <div className="font-serif text-lg font-semibold text-on-surface">
                  {editingItem.status === 'REJECTED'
                    ? 'Bổ Sung Hồ Sơ Ảnh / Tem Giám Tuyển'
                    : 'Cập Nhật Hồ Sơ Mục Đăng THRIFT'}
                </div>
                <div className="text-[11px] font-mono text-on-surface-variant">
                  {editingItem.title} ({editingItem.sku})
                </div>
              </div>
              <button
                onClick={() => setEditingItem(null)}
                className="w-8 h-8 rounded-full bg-surface flex items-center justify-center text-outline hover:text-on-surface transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveEdit} className="p-6 overflow-y-auto flex flex-col gap-4">
              {editingItem.status === 'REJECTED' && (
                <div className="p-3 bg-error-container text-on-error-container rounded text-xs flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] shrink-0">error</span>
                  <span>
                    <strong>Lý do từ chối trước đó:</strong> {editingItem.rejectionReason || 'Cần bổ sung ảnh tem đáy gỗ'}
                  </span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface mb-1">
                  Tên Hiện Vật
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-surface border border-surface-dim px-3 py-2 text-sm rounded focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface mb-1">
                  Giá Bán Đứt THRIFT (VND)
                </label>
                <input
                  type="number"
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value)}
                  className="w-full bg-surface border border-surface-dim px-3 py-2 text-sm font-mono rounded focus:outline-none focus:ring-1 focus:ring-primary"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-on-surface mb-1">
                  Ghi chú Giám Tuyển &amp; Chứng chỉ đi kèm
                </label>
                <textarea
                  rows={3}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  placeholder="Ghi chú về kiểm chuẩn quang học, giấy chứng sinh, tem đáy..."
                  className="w-full bg-surface border border-surface-dim px-3 py-2 text-sm rounded focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="p-3 bg-surface-container-high rounded border border-surface-dim text-xs text-on-surface-variant flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-secondary">cloud_upload</span>
                <span>
                  Đã đồng bộ ảnh tem nhãn mới từ kho lưu trữ cá thể. Khi lưu, hồ sơ sẽ được gửi lại Hội đồng Thẩm định.
                </span>
              </div>

              {/* Modal Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 bg-surface hover:bg-surface-container text-on-surface font-label-md text-label-md uppercase tracking-wider rounded-DEFAULT transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-primary hover:bg-primary-container text-on-primary font-label-md text-label-md uppercase tracking-wider rounded-DEFAULT transition-colors shadow-md font-semibold cursor-pointer"
                >
                  Lưu &amp; Gửi Duyệt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: B-Corp Protocol Standards Modal */}
      {showStandardsModal && (
        <div className="fixed inset-0 z-50 bg-[#141310]/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface-container max-w-2xl w-full rounded-DEFAULT shadow-2xl overflow-hidden border border-surface-dim flex flex-col max-h-[90vh] animate-fade-in">
            <div className="p-4 bg-surface-container-high border-b border-surface-dim flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-[22px]">verified</span>
                <span className="font-serif text-lg font-semibold text-on-surface">
                  Quy Chuẩn Thẩm Định &amp; Lưu Ký B-Corp
                </span>
              </div>
              <button
                onClick={() => setShowStandardsModal(false)}
                className="w-8 h-8 rounded-full bg-surface flex items-center justify-center text-outline hover:text-on-surface transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex flex-col gap-4 text-body-sm text-on-surface-variant leading-relaxed">
              <div className="p-3 bg-secondary-container/40 rounded border border-secondary/20 text-secondary text-xs font-semibold">
                CHỨNG CHỈ B-CORP TIÊU CHUẨN QUỐC TẾ: VÒNG ĐỜI VẬT PHẨM &amp; CHỐNG GIAN LẬN NGUỒN GỐC
              </div>

              <h4 className="font-title-md text-on-surface font-semibold">
                1. Nguyên tắc Không Tự Phê Duyệt (No Self-Approval)
              </h4>
              <p>
                Nhằm duy trì tính khách quan tuyệt đối cho thị trường sưu tầm, chủ shop hoặc xưởng phục dựng hoàn toàn không có thẩm quyền tự kích hoạt trạng thái "Mở bán" cho hiện vật do chính mình sở hữu. Toàn bộ hồ sơ bắt buộc phải do Hội đồng Giám tuyển Độc lập thuộc ReUse Hub thẩm định.
              </p>

              <h4 className="font-title-md text-on-surface font-semibold">
                2. Bàn Giao Second Life từ Kho Tuần Hoàn RENT
              </h4>
              <p>
                Hiện vật sau khi kết thúc chu kỳ cho thuê đạt chuẩn an toàn phải vượt qua bài kiểm tra đo tốc độ màn trập, dung lượng pin cell, độ méo âm và kiểm tra bề mặt da/gỗ trước khi chuyển sang mục đăng bán đứt THRIFT.
              </p>

              <h4 className="font-title-md text-on-surface font-semibold">
                3. Cơ Chế Smart Escrow Bảo Vệ Người Mua &amp; Người Bán
              </h4>
              <p>
                Tiền thanh toán của người mua được khóa trong quỹ ký quỹ đa chữ ký cho đến khi người mua nhận hàng, kiểm định đồng kiểm 48h và xác nhận đạt chuẩn mô tả trong hồ sơ lưu ký.
              </p>
            </div>

            <div className="p-4 bg-surface-container-high border-t border-surface-dim flex justify-end">
              <button
                onClick={() => setShowStandardsModal(false)}
                className="px-5 py-2 bg-primary text-on-primary font-label-md text-label-md uppercase tracking-wider rounded-DEFAULT transition-colors font-semibold cursor-pointer"
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

export default ShopThriftListings;
