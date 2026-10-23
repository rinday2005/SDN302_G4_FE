import React, { useState, useEffect, useMemo, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCartWishlist, type CartItem } from '../../context/CartWishlistContext';
import { AuthContext } from '../../context/auth-context';
import { DEFAULT_DEMO_CART_ITEMS } from '../data/cart/defaultCartData';
import { RentalCalendarPicker } from '../../components/rent/RentalCalendarPicker';
import { getProductBookedDates, hasDateRangeConflict } from '../data/rent/rentOrderDetailData';
import { resolveWishlistProduct } from '../../services/wishlistProductResolver';

export const Cart: React.FC = () => {
  const navigate = useNavigate();
  const auth = useContext(AuthContext);
  const user = auth?.user;

  const {
    cart,
    removeFromCart,
    removeMultipleFromCart,
    updateCartItem,
    updateCartQuantity,
    setCartItems,
    toggleWishlist,
    isWishlisted,
  } = useCartWishlist();

  // If cart is empty on first mount, allow initializing demo items or user starts empty
  // Selection state (item IDs that are checked)
  // User explicit deselection state (tracks item IDs that were unchecked)
  const [deselectedIds, setDeselectedIds] = useState<string[]>([]);

  // Computed selected IDs: all items currently in cart that are not deselected
  const selectedIds = useMemo(() => {
    return cart.map((item) => item.id).filter((id) => !deselectedIds.includes(id));
  }, [cart, deselectedIds]);

  // Simulator tab state: 'both' | 'rent' | 'thrift' | 'empty'
  const [simState, setSimState] = useState<'both' | 'rent' | 'thrift' | 'empty'>('both');

  // Toast message state
  const [toast, setToast] = useState<{ show: boolean; message: string; icon: string }>({
    show: false,
    message: '',
    icon: 'check_circle',
  });

  // Countdown timer simulation for THRIFT hold (43m 20s)
  const [thriftSeconds, setThriftSeconds] = useState(43 * 60 + 20);

  // Modal to edit rental duration via Calendar
  const [editingRentItem, setEditingRentItem] = useState<CartItem | null>(null);
  const [editStartDate, setEditStartDate] = useState<string>('2026-11-18');
  const [editEndDate, setEditEndDate] = useState<string>('2026-11-21');
  const [editDays, setEditDays] = useState<number>(3);

  // Booked dates for the item being edited in cart
  const editingBookedDates = useMemo(() => {
    if (!editingRentItem) return [];
    return getProductBookedDates({ id: editingRentItem.id, title: editingRentItem.title });
  }, [editingRentItem]);

  // Countdown timer tick
  useEffect(() => {
    const timer = setInterval(() => {
      setThriftSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const showToast = (message: string, icon = 'check_circle') => {
    setToast({ show: true, message, icon });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 2500);
  };

  const formatCurrency = (val: number) => {
    return val.toLocaleString('vi-VN') + '₫';
  };

  // Helper to parse deposit
  const getDepositValue = (item: CartItem): number => {
    if (typeof item.deposit === 'number') return item.deposit;
    if (typeof item.deposit === 'string') {
      const numeric = parseInt(item.deposit.replace(/\D/g, ''), 10);
      return isNaN(numeric) ? 3500000 : numeric;
    }
    // Default fallback based on daily price
    return item.price * 8;
  };

  // Helper resolving image fallback with zero placeholder degradation
  const getItemImage = (item: CartItem): string => {
    if (item.image && item.image.trim() !== '') return item.image;
    const resolved = resolveWishlistProduct(item.id);
    if (resolved?.image && resolved.image.trim() !== '') return resolved.image;
    return item.mode === 'thrift'
      ? 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=600&q=80'
      : 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=600&q=80';
  };

  // Separate active items by mode
  const rentItems = useMemo(() => {
    return cart.filter((item) => item.mode === 'rent' || !item.mode);
  }, [cart]);

  const thriftItems = useMemo(() => {
    return cart.filter((item) => item.mode === 'thrift');
  }, [cart]);

  // Selected counts
  const selectedRentItems = useMemo(() => {
    return rentItems.filter((item) => selectedIds.includes(item.id));
  }, [rentItems, selectedIds]);

  const selectedThriftItems = useMemo(() => {
    return thriftItems.filter((item) => selectedIds.includes(item.id));
  }, [thriftItems, selectedIds]);

  const totalSelectedCount = selectedRentItems.length + selectedThriftItems.length;
  const isAllSelected = cart.length > 0 && selectedIds.length === cart.length;

  // Ledger calculations
  const rentSubtotal = useMemo(() => {
    return selectedRentItems.reduce((sum, item) => {
      const days = item.rentalDays || 3;
      const qty = item.quantity || 1;
      return sum + item.price * days * qty;
    }, 0);
  }, [selectedRentItems]);

  const rentTotalDays = useMemo(() => {
    return selectedRentItems.reduce((sum, item) => sum + (item.rentalDays || 3), 0);
  }, [selectedRentItems]);

  const rentEscrowTotal = useMemo(() => {
    return selectedRentItems.reduce((sum, item) => sum + getDepositValue(item) * (item.quantity || 1), 0);
  }, [selectedRentItems]);

  const rentShipping = selectedRentItems.length > 0 ? 150000 : 0;
  const rentGrandTotal = rentSubtotal + rentShipping + rentEscrowTotal;

  const thriftSubtotal = useMemo(() => {
    return selectedThriftItems.reduce((sum, item) => {
      const qty = item.quantity || 1;
      return sum + item.price * qty;
    }, 0);
  }, [selectedThriftItems]);

  const thriftShipping = selectedThriftItems.length > 0 ? 215000 : 0;
  const thriftGrandTotal = thriftSubtotal + thriftShipping;

  const totalPayment = rentGrandTotal + thriftGrandTotal;

  // Toggle item selection
  const handleToggleItem = (id: string) => {
    setDeselectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Master toggle
  const handleToggleAll = (checked: boolean) => {
    if (checked) {
      setDeselectedIds([]);
      showToast('Đã chọn toàn bộ sản phẩm');
    } else {
      setDeselectedIds(cart.map((item) => item.id));
      showToast('Đã bỏ chọn toàn bộ sản phẩm');
    }
  };

  // Clear selected items
  const handleClearSelected = () => {
    if (selectedIds.length === 0) {
      showToast('Chưa chọn sản phẩm nào để xóa', 'info');
      return;
    }
    removeMultipleFromCart(selectedIds);
    setDeselectedIds([]);
    showToast(`Đã xóa ${selectedIds.length} sản phẩm đã chọn`, 'delete');
  };

  // Remove single item
  const handleRemoveSingle = (id: string, title: string) => {
    removeFromCart(id);
    setDeselectedIds((prev) => prev.filter((item) => item !== id));
    showToast(`Đã bỏ "${title}" khỏi giỏ hàng`, 'delete');
  };

  // Wishlist toggle
  const handleWishlistToggle = (item: CartItem) => {
    toggleWishlist(item.id);
    const added = !isWishlisted(item.id);
    showToast(
      added ? `Đã lưu "${item.title}" vào yêu thích` : `Đã bỏ lưu "${item.title}"`,
      added ? 'favorite' : 'heart_broken'
    );
  };

  // Simulator handler
  const handleSimulatorState = (state: 'both' | 'rent' | 'thrift' | 'empty') => {
    setSimState(state);

    if (state === 'empty') {
      setDeselectedIds(cart.map((i) => i.id));
      showToast('Hiển thị trạng thái Giỏ hàng rỗng');
      return;
    }

    // If current cart is empty, populate with default demo items
    const currentCart = cart;
    // Không tự nạp demo data

    if (state === 'both') {
      setDeselectedIds([]);
      showToast('Đang chọn cả hai: RENT và THRIFT');
    } else if (state === 'rent') {
      const thriftIds = currentCart.filter((i) => i.mode === 'thrift').map((i) => i.id);
      setDeselectedIds(thriftIds);
      showToast('Chỉ chọn đơn thuê RENT');
    } else if (state === 'thrift') {
      const rentIds = currentCart.filter((i) => i.mode === 'rent' || !i.mode).map((i) => i.id);
      setDeselectedIds(rentIds);
      showToast('Chỉ chọn đơn mua tuần hoàn THRIFT');
    }
  };

  // Populate sample items button in empty state
  const handleLoadDemoItems = () => {
    setCartItems(DEFAULT_DEMO_CART_ITEMS);
    setDeselectedIds([]);
    setSimState('both');
    showToast('Đã nạp sản phẩm demo vào giỏ hàng', 'add_shopping_cart');
  };

  // Save edited rental days via Calendar
  const handleSaveRentalDays = () => {
    if (!editingRentItem) return;
    if (hasDateRangeConflict(editStartDate, editEndDate, editingBookedDates)) {
      showToast('Khoảng ngày bạn chọn có ngày đã có khách đặt! Vui lòng chọn khoảng ngày còn trống.', 'warning');
      return;
    }
    updateCartItem(editingRentItem.id, {
      startDate: editStartDate,
      endDate: editEndDate,
      rentalDays: editDays,
    });
    setEditingRentItem(null);
    showToast(`Đã cập nhật kỳ thuê: ${editDays} ngày (${editStartDate} → ${editEndDate})`);
  };

  // Check if empty state should be rendered
  const isViewEmpty = simState === 'empty' || cart.length === 0;

  return (
    <div className="w-full min-h-[calc(100vh-12rem)] bg-[#FBF9F5] text-[#1C1C18] antialiased">
      {/* Toast Notification */}
      <div
        className={`fixed bottom-6 right-6 z-50 transform transition-all duration-300 pointer-events-none bg-[#1C1A18] text-[#FBF9F5] px-5 py-3.5 rounded-xl shadow-2xl flex items-center gap-3 text-sm font-medium ${
          toast.show ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-12 opacity-0 scale-95'
        }`}
      >
        <span className="material-symbols-outlined text-[20px] text-emerald-400">
          {toast.icon}
        </span>
        <span>{toast.message}</span>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Breadcrumb & Header */}
        <div className="py-2 flex flex-col gap-2">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-[#7B766F]">
            <Link to="/" className="hover:text-[#141310] transition-colors">
              Trang chủ
            </Link>
            <span className="text-[#CCC5BC]">/</span>
            <Link to="/user/dashboard" className="hover:text-[#141310] transition-colors">
              Tài khoản
            </Link>
            <span className="text-[#CCC5BC]">/</span>
            <span className="text-[#141310] font-semibold">Giỏ hàng tuần hoàn</span>
          </nav>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pt-2">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="px-2.5 py-0.5 rounded bg-[#D8E3CE] text-[#5B6655] text-[11px] font-semibold uppercase tracking-wider">
                  Khách hàng định danh Tier 2
                </span>
                <span className="text-[#CCC5BC]">•</span>
                <span className="text-xs text-[#7B766F]">
                  Hồ sơ: <strong className="text-[#141310] font-medium">{user?.fullName || 'Khách hàng'}</strong>
                </span>
              </div>
              <h1 className="font-serif text-3xl sm:text-4xl text-[#141310] font-bold tracking-tight">
                Giỏ hàng của bạn
              </h1>
              <p className="text-xs sm:text-sm text-[#7B766F] max-w-3xl mt-1 leading-relaxed">
                Xem lại danh sách thiết bị lưu giữ theo kỳ (RENT) và đồ sưu tầm tuần hoàn (THRIFT) trước khi tiến hành thủ tục bàn giao hoặc sở hữu vĩnh viễn.
              </p>
            </div>

            {/* Trust Mini Badges */}
            <div className="flex flex-wrap items-center gap-1.5 bg-[#F7F3EC] p-2 rounded-xl shadow-xs self-start lg:self-auto">
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#F1EDE6] rounded text-[#1C1C18] text-[12px] font-medium">
                <span className="material-symbols-outlined text-[16px] text-[#576151]">
                  verified_user
                </span>
                <span>Bảo hộ Smart Escrow 100%</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#F1EDE6] rounded text-[#1C1C18] text-[12px] font-medium">
                <span className="material-symbols-outlined text-[16px] text-[#576151]">verified</span>
                <span>Bench Lab Grade A+</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[#F1EDE6] rounded text-[#1C1C18] text-[12px] font-medium">
                <span className="material-symbols-outlined text-[16px] text-[#576151]">
                  local_shipping
                </span>
                <span>Bưu tá Nanuk chuyên dụng</span>
              </div>
            </div>
          </div>
        </div>

        {/* Simulator Control Tabs */}
        <div className="my-5 p-2 bg-[#EBE8E1] rounded-2xl flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 pl-2">
            <span className="material-symbols-outlined text-[18px] text-[#7B766F]">tune</span>
            <span className="text-[12px] uppercase font-bold text-[#7B766F] tracking-wide">
              Chế độ giả lập lựa chọn:
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => handleSimulatorState('both')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                simState === 'both' && !isViewEmpty
                  ? 'bg-[#141310] text-white shadow-sm'
                  : 'bg-white text-[#1C1C18] hover:bg-[#F7F3EC]'
              }`}
            >
              Đang chọn cả hai (RENT + THRIFT)
            </button>
            <button
              type="button"
              onClick={() => handleSimulatorState('rent')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                simState === 'rent' && !isViewEmpty
                  ? 'bg-[#141310] text-white shadow-sm'
                  : 'bg-white text-[#1C1C18] hover:bg-[#F7F3EC]'
              }`}
            >
              Chỉ chọn RENT ({rentItems.length} mục)
            </button>
            <button
              type="button"
              onClick={() => handleSimulatorState('thrift')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                simState === 'thrift' && !isViewEmpty
                  ? 'bg-[#141310] text-white shadow-sm'
                  : 'bg-white text-[#1C1C18] hover:bg-[#F7F3EC]'
              }`}
            >
              Chỉ chọn THRIFT ({thriftItems.length} mục)
            </button>
            <button
              type="button"
              onClick={() => handleSimulatorState('empty')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                isViewEmpty
                  ? 'bg-[#141310] text-white shadow-sm'
                  : 'bg-white text-[#1C1C18] hover:bg-[#F7F3EC]'
              }`}
            >
              Giỏ hàng rỗng (Empty State)
            </button>
          </div>
        </div>

        {/* View Condition: Empty State vs Active Cart */}
        {isViewEmpty ? (
          /* ================= EMPTY STATE CONTAINER ================= */
          <div className="flex flex-col items-center justify-center py-16 px-4 bg-white rounded-3xl shadow-sm text-center border border-[#EBE8E1] my-4">
            <div className="w-24 h-24 rounded-full bg-[#F7F3EC] flex items-center justify-center mb-5 text-[#7B766F]">
              <span className="material-symbols-outlined text-[48px]">shopping_bag</span>
            </div>
            <span className="px-3 py-1 rounded bg-[#D8E3CE] text-[#5B6655] text-xs font-semibold uppercase tracking-wider mb-2">
              Kho lưu trữ cá nhân trống
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl text-[#141310] font-bold max-w-md">
              Giỏ hàng của bạn đang trống
            </h2>
            <p className="text-xs sm:text-sm text-[#7B766F] max-w-lg mt-2 mb-8 leading-relaxed">
              Bạn chưa thêm bất kỳ thiết bị thuê định kỳ hoặc món đồ tuần hoàn độc bản nào. Hãy khám phá kho tàng thiết bị chuẩn kiểm định của ReUse Hub.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <Link
                to="/rent"
                className="px-6 py-3 rounded-xl bg-[#141310] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#292724] transition-all flex items-center gap-2 shadow-sm"
              >
                <span className="material-symbols-outlined text-[18px]">timelapse</span>
                <span>Khám phá RENT</span>
              </Link>
              <Link
                to="/thrift"
                className="px-6 py-3 rounded-xl bg-[#F1EDE6] text-[#1C1C18] hover:bg-[#EBE8E1] text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
                <span>Săn đồ độc bản THRIFT</span>
              </Link>
              <button
                type="button"
                onClick={handleLoadDemoItems}
                className="px-6 py-3 rounded-xl border border-[#141310] text-[#141310] hover:bg-[#141310] hover:text-white text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">data_saver_on</span>
                <span>Nạp sản phẩm mẫu Demo</span>
              </button>
            </div>
            <div className="mt-14 pt-6 border-t border-[#F7F3EC] flex flex-wrap items-center justify-center gap-6 text-xs text-[#7B766F]">
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px] text-[#576151]">
                  check_circle
                </span>
                <span>Hơn 1.200+ thiết bị sẵn sàng</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px] text-[#576151]">
                  check_circle
                </span>
                <span>Bảo hiểm 100% mọi hư hỏng vô ý</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px] text-[#576151]">
                  check_circle
                </span>
                <span>Giao nhanh trong 2h tại Hà Nội &amp; TP.HCM</span>
              </span>
            </div>
          </div>
        ) : (
          /* ================= ACTIVE CART LAYOUT ================= */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* LEFT 8 COLS: CART ITEMS STREAM */}
            <div className="lg:col-span-8 flex flex-col gap-6">
              {/* Master Selection Bar */}
              <div className="flex items-center justify-between p-4 bg-[#F7F3EC] rounded-2xl shadow-xs">
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={(e) => handleToggleAll(e.target.checked)}
                    className="w-4 h-4 accent-[#141310] rounded cursor-pointer"
                  />
                  <span className="text-sm font-semibold text-[#1C1C18]">
                    Chọn tất cả ({totalSelectedCount} sản phẩm)
                  </span>
                </label>
                <button
                  type="button"
                  onClick={handleClearSelected}
                  className="text-xs text-[#7B766F] hover:text-rose-600 transition-colors flex items-center gap-1 cursor-pointer font-medium"
                >
                  <span className="material-symbols-outlined text-[16px]">delete_sweep</span>
                  <span>Xóa các mục đã chọn</span>
                </button>
              </div>

              {/* ================= SECTION A: RENT ================= */}
              {rentItems.length > 0 && (
                <div className="bg-white rounded-3xl p-6 shadow-xs flex flex-col gap-5 border border-[#F1EDE6]">
                  {/* Section Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#F1EDE6] gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="material-symbols-outlined text-[#576151] text-[24px]">
                        timelapse
                      </span>
                      <h2 className="font-serif text-xl font-bold text-[#141310]">
                        Thiết bị thuê theo kỳ (RENT)
                      </h2>
                      <span className="px-2.5 py-0.5 rounded bg-[#D8E3CE] text-[#5B6655] text-xs font-semibold">
                        {rentItems.length} sản phẩm
                      </span>
                    </div>
                    <span className="text-xs text-[#7B766F] uppercase tracking-wider">
                      Tạm tính thuê + Ký quỹ Smart Escrow
                    </span>
                  </div>

                  {/* Banner Note */}
                  <div className="bg-[#F7F3EC] p-3.5 rounded-xl flex items-start gap-2.5 text-xs text-[#7B766F] leading-relaxed">
                    <span className="material-symbols-outlined text-[18px] text-[#576151] flex-shrink-0 mt-0.5">
                      info
                    </span>
                    <p>
                      <strong>Lưu ý:</strong> Đơn thuê cần xác thực cọc Smart Escrow và ảnh đối kiểm trước khi giao nhận bằng vali Nanuk chuyên dụng bọc chống sốc tiêu chuẩn hàng không.
                    </p>
                  </div>

                  {/* List of Rent Items */}
                  <div className="flex flex-col gap-4">
                    {rentItems.map((item) => {
                      const isSelected = selectedIds.includes(item.id);
                      const isSaved = isWishlisted(item.id);
                      const days = item.rentalDays || 3;
                      const depositAmount = getDepositValue(item);
                      const itemTotal = item.price * days * (item.quantity || 1);

                      return (
                        <div
                          key={item.id}
                          className="flex flex-col sm:flex-row items-start gap-4 p-4 rounded-2xl bg-[#FBF9F5]/70 hover:bg-[#F7F3EC]/80 transition-colors border border-[#F1EDE6]"
                        >
                          <div className="pt-1">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleItem(item.id)}
                              className="w-4 h-4 accent-[#141310] rounded cursor-pointer"
                            />
                          </div>

                          <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-xl overflow-hidden flex-shrink-0 bg-[#EBE8E1]">
                            <img
                              src={getItemImage(item)}
                              alt={item.title}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const resolved = resolveWishlistProduct(item.id);
                                if (resolved?.image && e.currentTarget.src !== resolved.image) {
                                  e.currentTarget.src = resolved.image;
                                }
                              }}
                            />
                            <span className="absolute bottom-1.5 left-1.5 px-2 py-0.5 bg-[#141310]/85 backdrop-blur-xs text-white text-[10px] font-semibold rounded uppercase">
                              {item.categoryLabel || 'Thiết bị RENT'}
                            </span>
                          </div>

                          <div className="flex-1 flex flex-col justify-between h-full min-w-0 w-full">
                            <div>
                              <div className="flex items-start justify-between gap-2">
                                <h3 className="text-base font-bold text-[#141310] truncate">
                                  {item.title}
                                </h3>
                                <span className="px-2 py-0.5 rounded bg-[#EBE8E1] text-[#7B766F] text-[11px] whitespace-nowrap font-medium">
                                  {item.gradeBadge || 'Grade A+ (Bench Checked)'}
                                </span>
                              </div>

                              <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-[#7B766F]">
                                <div className="flex items-center gap-1.5 bg-[#F1EDE6] px-2.5 py-1 rounded-lg">
                                  <span className="material-symbols-outlined text-[14px]">
                                    calendar_today
                                  </span>
                                  <span className="font-medium text-[#1C1C18]">
                                    {item.startDate || '18/11/2024'} → {item.endDate || '23/11/2024'}
                                  </span>
                                  <span className="text-[#576151] font-bold">({days} ngày)</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingRentItem(item);
                                      setEditStartDate(item.startDate || '2026-11-18');
                                      setEditEndDate(item.endDate || '2026-11-21');
                                      setEditDays(days);
                                    }}
                                    aria-label="Chỉnh sửa ngày thuê"
                                    className="ml-1 hover:text-[#141310] cursor-pointer text-[#576151] hover:underline flex items-center gap-0.5"
                                    title="Mở lịch chọn lại ngày nhận &amp; hoàn trả"
                                  >
                                    <span className="material-symbols-outlined text-[14px]">edit_calendar</span>
                                    <span className="text-[11px] underline">Sửa ngày</span>
                                  </button>
                                </div>
                                <span>•</span>
                                <span>
                                  Đơn giá: <strong className="text-[#141310]">{formatCurrency(item.price)}</strong> / ngày
                                </span>
                              </div>
                            </div>

                            {/* Price & Deposit & Actions */}
                            <div className="mt-4 pt-2.5 flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-t border-[#EBE8E1]">
                              <div>
                                <div className="text-xs text-[#7B766F]">
                                  Tiền cọc Smart Escrow hoàn lại 100%:{' '}
                                  <span className="font-semibold text-[#141310]">
                                    {formatCurrency(depositAmount)}
                                  </span>
                                </div>
                                <div className="font-serif text-lg text-[#141310] font-bold mt-0.5">
                                  {formatCurrency(itemTotal)}{' '}
                                  <span className="text-xs font-normal text-[#7B766F]">
                                    (cho {days} ngày)
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-3">
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#F1EDE6] rounded-lg text-xs font-medium text-[#1C1C18]">
                                  <span className="material-symbols-outlined text-[15px] text-[#7B766F]">
                                    shield
                                  </span>
                                  <span>1 bộ (Bảo chứng định danh)</span>
                                </div>

                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => handleWishlistToggle(item)}
                                    aria-label="Lưu vào yêu thích"
                                    className={`p-1.5 rounded-lg hover:bg-white transition-colors cursor-pointer ${
                                      isSaved ? 'text-rose-600' : 'text-[#7B766F] hover:text-[#141310]'
                                    }`}
                                    title="Lưu vào danh sách yêu thích"
                                  >
                                    <span className="material-symbols-outlined text-[20px]">
                                      {isSaved ? 'favorite' : 'favorite_border'}
                                    </span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveSingle(item.id, item.title)}
                                    aria-label="Xóa sản phẩm"
                                    className="p-1.5 rounded-lg text-[#7B766F] hover:text-rose-600 hover:bg-white transition-colors cursor-pointer"
                                    title="Xóa sản phẩm khỏi giỏ"
                                  >
                                    <span className="material-symbols-outlined text-[20px]">
                                      delete_outline
                                    </span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ================= SECTION B: THRIFT ================= */}
              {thriftItems.length > 0 && (
                <div className="bg-white rounded-3xl p-6 shadow-xs flex flex-col gap-5 border border-[#F1EDE6]">
                  {/* Section Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#F1EDE6] gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="material-symbols-outlined text-[#576151] text-[24px]">
                        auto_awesome
                      </span>
                      <h2 className="font-serif text-xl font-bold text-[#141310]">
                        Bộ sưu tập tuần hoàn (THRIFT)
                      </h2>
                      <span className="px-2.5 py-0.5 rounded bg-[#F0E0CB] text-[#221A0D] text-xs font-semibold">
                        {thriftItems.length} sản phẩm
                      </span>
                    </div>
                    <span className="text-xs text-[#7B766F] uppercase tracking-wider">
                      Sở hữu vĩnh viễn 1-of-1
                    </span>
                  </div>

                  {/* Banner Note with Countdown Timer */}
                  <div className="bg-[#F7F3EC] p-3.5 rounded-xl flex items-start gap-2.5 text-xs text-[#7B766F] leading-relaxed">
                    <span className="material-symbols-outlined text-[18px] text-[#181106] flex-shrink-0 mt-0.5">
                      timer
                    </span>
                    <p>
                      <strong>Lưu ý:</strong> Mỗi sản phẩm THRIFT là độc bản (1-of-1) đã kiểm định xuất xứ qua Provenance Vault. Phiên giữ chỗ giỏ hàng duy trì tối đa{' '}
                      <span className="font-bold text-[#141310] font-mono">
                        {formatTimer(thriftSeconds)}
                      </span>
                      .
                    </p>
                  </div>

                  {/* List of Thrift Items */}
                  <div className="flex flex-col gap-4">
                    {thriftItems.map((item) => {
                      const isSelected = selectedIds.includes(item.id);
                      const isSaved = isWishlisted(item.id);

                      return (
                        <div
                          key={item.id}
                          className="flex flex-col sm:flex-row items-start gap-4 p-4 rounded-2xl bg-[#FBF9F5]/70 hover:bg-[#F7F3EC]/80 transition-colors border border-[#F1EDE6]"
                        >
                          <div className="pt-1">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleItem(item.id)}
                              className="w-4 h-4 accent-[#141310] rounded cursor-pointer"
                            />
                          </div>

                          <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-xl overflow-hidden flex-shrink-0 bg-[#EBE8E1]">
                            <img
                              src={getItemImage(item)}
                              alt={item.title}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const resolved = resolveWishlistProduct(item.id);
                                if (resolved?.image && e.currentTarget.src !== resolved.image) {
                                  e.currentTarget.src = resolved.image;
                                }
                              }}
                            />
                            <span className="absolute bottom-1.5 left-1.5 px-2 py-0.5 bg-[#181106]/85 backdrop-blur-xs text-white text-[10px] font-semibold rounded uppercase">
                              Độc bản 1-of-1
                            </span>
                          </div>

                          <div className="flex-1 flex flex-col justify-between h-full min-w-0 w-full">
                            <div>
                              <div className="flex items-start justify-between gap-2">
                                <h3 className="text-base font-bold text-[#141310] truncate">
                                  {item.title}
                                </h3>
                                <span className="px-2 py-0.5 rounded bg-[#EBE8E1] text-[#7B766F] text-[11px] whitespace-nowrap font-medium">
                                  {item.gradeBadge || 'Grade Mint- (98% Factory)'}
                                </span>
                              </div>

                              <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-[#7B766F]">
                                <span>
                                  Chuyên mục:{' '}
                                  <strong className="text-[#141310]">
                                    {item.categoryLabel || 'Lưu trữ cổ điển'}
                                  </strong>
                                </span>
                                {item.sourceOrigin && (
                                  <>
                                    <span>•</span>
                                    <span>
                                      Nguồn gốc:{' '}
                                      <strong className="text-[#141310]">
                                        {item.sourceOrigin}
                                      </strong>
                                    </span>
                                  </>
                                )}
                                {item.warranty && (
                                  <>
                                    <span>•</span>
                                    <span className="text-[#576151] font-medium">
                                      {item.warranty}
                                    </span>
                                  </>
                                )}
                                {item.sizeOrSpec && !((item.categoryLabel || '').toLowerCase().includes('camera') || (item.categoryLabel || '').toLowerCase().includes('máy ảnh') || /canon|sony|nikon|fujifilm|dji|leica/i.test(item.title)) && (
                                  <>
                                    <span>•</span>
                                    <span>Size: <strong>{item.sizeOrSpec}</strong></span>
                                  </>
                                )}
                              </div>
                            </div>

                            {/* Price & Actions */}
                            <div className="mt-4 pt-2.5 flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-t border-[#EBE8E1]">
                              <div>
                                <div className="text-xs text-[#7B766F]">
                                  Quyền sở hữu vĩnh viễn (Đã bao gồm tem vật lý &amp; NFT Provenance)
                                </div>
                                <div className="font-serif text-xl text-[#141310] font-bold mt-0.5">
                                  {formatCurrency(item.price * (item.quantity || 1))}
                                  {(item.quantity || 1) > 1 && (
                                    <span className="text-xs font-normal text-[#7B766F] ml-1.5 font-sans">
                                      ({formatCurrency(item.price)} × {item.quantity})
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Dynamic Thrift Quantity or 1-of-1 Badge */}
                              <div className="flex items-center gap-3">
                                {(item.sourceOrigin === 'RENTAL_PRODUCT' || item.sourceType === 'RENTAL_PRODUCT' || item.isUnique || (item.maxQuantity === 1 && !item.quantity)) ? (
                                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#F1EDE6] rounded-lg text-xs font-medium text-[#1C1C18]">
                                    <span className="material-symbols-outlined text-[15px] text-[#7B766F]">
                                      fingerprint
                                    </span>
                                    <span>SL: 1 (Hiện vật độc bản)</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1.5">
                                    <div className="flex items-center border border-[#D5D0C7] rounded-lg overflow-hidden bg-white shadow-2xs">
                                      <button
                                        type="button"
                                        onClick={() => updateCartQuantity(item.id, -1)}
                                        className="w-7 h-7 flex items-center justify-center text-[#141310] hover:bg-[#F1EDE6] transition-colors cursor-pointer"
                                        title="Giảm số lượng"
                                      >
                                        <span className="material-symbols-outlined text-[15px]">remove</span>
                                      </button>
                                      <span className="w-8 text-center text-xs font-bold font-mono text-[#141310]">
                                        {item.quantity || 1}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const curQty = item.quantity || 1;
                                          const maxLimit = item.maxQuantity || item.stock || 99;
                                          if (curQty < maxLimit) {
                                            updateCartQuantity(item.id, 1);
                                          } else {
                                            showToast(`Đã đạt giới hạn tồn kho (${maxLimit} sản phẩm)`, 'info');
                                          }
                                        }}
                                        className="w-7 h-7 flex items-center justify-center text-[#141310] hover:bg-[#F1EDE6] transition-colors cursor-pointer"
                                        title="Tăng số lượng"
                                      >
                                        <span className="material-symbols-outlined text-[15px]">add</span>
                                      </button>
                                    </div>
                                    <span className="text-[11px] text-[#7B766F] font-medium hidden sm:inline">
                                      (SL: {item.quantity || 1})
                                    </span>
                                  </div>
                                )}

                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => handleWishlistToggle(item)}
                                    aria-label="Lưu vào yêu thích"
                                    className={`p-1.5 rounded-lg hover:bg-white transition-colors cursor-pointer ${
                                      isSaved ? 'text-rose-600' : 'text-[#7B766F] hover:text-[#141310]'
                                    }`}
                                    title="Lưu vào danh sách yêu thích"
                                  >
                                    <span className="material-symbols-outlined text-[20px]">
                                      {isSaved ? 'favorite' : 'favorite_border'}
                                    </span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveSingle(item.id, item.title)}
                                    aria-label="Xóa sản phẩm"
                                    className="p-1.5 rounded-lg text-[#7B766F] hover:text-rose-600 hover:bg-white transition-colors cursor-pointer"
                                    title="Xóa sản phẩm khỏi giỏ"
                                  >
                                    <span className="material-symbols-outlined text-[20px]">
                                      delete_outline
                                    </span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Service Guarantees (3 Columns) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div className="p-4 bg-[#F7F3EC] rounded-2xl flex flex-col gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#576151]/15 text-[#576151] flex items-center justify-center">
                    <span className="material-symbols-outlined text-[18px]">lock_reset</span>
                  </div>
                  <h4 className="text-sm font-bold text-[#141310]">Minh bạch Ký quỹ Escrow</h4>
                  <p className="text-xs text-[#7B766F] leading-relaxed">
                    Tiền cọc được khóa độc lập qua hợp đồng thông minh Smart Escrow, tự động hoàn trả 100% sau 4h kiểm định trả hàng.
                  </p>
                </div>

                <div className="p-4 bg-[#F7F3EC] rounded-2xl flex flex-col gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#576151]/15 text-[#576151] flex items-center justify-center">
                    <span className="material-symbols-outlined text-[18px]">verified</span>
                  </div>
                  <h4 className="text-sm font-bold text-[#141310]">Giao nhận chuẩn bảo mật</h4>
                  <p className="text-xs text-[#7B766F] leading-relaxed">
                    Đóng gói thùng chống va đập Nanuk tiêu chuẩn quân sự kèm niêm phong số chống tráo hàng trước mặt khách nhận.
                  </p>
                </div>

                <div className="p-4 bg-[#F7F3EC] rounded-2xl flex flex-col gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#576151]/15 text-[#576151] flex items-center justify-center">
                    <span className="material-symbols-outlined text-[18px]">published_with_changes</span>
                  </div>
                  <h4 className="text-sm font-bold text-[#141310]">Quyền kiểm tra độc lập 72h</h4>
                  <p className="text-xs text-[#7B766F] leading-relaxed">
                    Đồ THRIFT được bảo chứng 3 ngày đổi trả và hoàn tiền 100% nếu phát hiện sai lệch mô tả từ Provenance Vault.
                  </p>
                </div>
              </div>
            </div>

            {/* RIGHT 4 COLS: ORDER SUMMARY LEDGER (STICKY) */}
            <div className="lg:col-span-4 sticky top-32 flex flex-col gap-5">
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#F1EDE6] flex flex-col gap-5">
                {/* Header */}
                <div className="flex items-center justify-between pb-3 border-b border-[#F1EDE6]">
                  <h2 className="font-serif text-xl font-bold text-[#141310]">Tổng kết sổ lệnh</h2>
                  <span className="material-symbols-outlined text-[#7B766F] text-[22px]">
                    receipt_long
                  </span>
                </div>

                {/* Dual Flow Explanatory Note */}
                <div className="bg-[#F7F3EC] p-3 rounded-xl text-[12px] leading-relaxed text-[#7B766F] flex items-start gap-2">
                  <span className="material-symbols-outlined text-[16px] text-[#576151] flex-shrink-0 mt-0.5">
                    policy
                  </span>
                  <p>
                    <strong>Chính sách phân tách đơn hàng:</strong> Theo quy chuẩn kinh tế tuần hoàn, đơn RENT (yêu cầu ký quỹ và hoàn trả) và đơn THRIFT (sở hữu dứt điểm) được lập hợp đồng và bảo hiểm riêng biệt.
                  </p>
                </div>

                {/* BLOCK 1: RENT ORDER SUMMARY */}
                {selectedRentItems.length > 0 && (
                  <div className="p-4 rounded-2xl bg-[#F7F3EC]/80 flex flex-col gap-2.5 transition-all">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#141310] flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#576151]" />
                        <span>Tóm tắt Đơn Thuê (RENT)</span>
                      </span>
                      <span className="text-xs text-[#7B766F]">
                        {selectedRentItems.length} thiết bị đã chọn
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs text-[#7B766F] pt-2 border-t border-[#EBE8E1]">
                      <div className="flex justify-between">
                        <span>Tiền thuê tích lũy ({rentTotalDays} ngày):</span>
                        <span className="font-semibold text-[#1C1C18]">
                          {formatCurrency(rentSubtotal)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Phí vali Nanuk 2 chiều:</span>
                        <span className="font-semibold text-[#1C1C18]">
                          {formatCurrency(rentShipping)}
                        </span>
                      </div>
                      <div className="flex justify-between text-[#576151]">
                        <span className="flex items-center gap-1">
                          <span>Ký quỹ Smart Escrow:</span>
                          <span className="material-symbols-outlined text-[13px]">lock</span>
                        </span>
                        <span className="font-bold">{formatCurrency(rentEscrowTotal)}</span>
                      </div>
                      <div className="text-[11px] text-[#7B766F] text-right italic">
                        *(Hoàn lại 100% ngay sau khi kết thúc kỳ thuê)
                      </div>
                    </div>

                    <div className="pt-2.5 border-t border-[#EBE8E1] flex justify-between items-baseline">
                      <span className="text-xs font-bold text-[#141310]">Tổng tạm tính RENT:</span>
                      <div className="text-right">
                        <div className="font-serif text-lg font-bold text-[#141310]">
                          {formatCurrency(rentGrandTotal)}
                        </div>
                        <div className="text-[11px] text-[#576151] font-medium">
                          Bao gồm {formatCurrency(rentEscrowTotal)} tiền cọc
                        </div>
                      </div>
                    </div>

                    {/* CTA RENT */}
                    <button
                      type="button"
                      onClick={() => {
                        if (!user) {
                          navigate('/login', { state: { from: '/rent/checkout' } });
                          return;
                        }
                        const conflictItem = selectedRentItems.find((item) => {
                          const bDates = getProductBookedDates({ id: item.id, title: item.title });
                          return (
                            item.startDate &&
                            item.endDate &&
                            hasDateRangeConflict(item.startDate, item.endDate, bDates)
                          );
                        });
                        if (conflictItem) {
                          showToast(
                            `Thiết bị "${conflictItem.title}" bị trùng ngày đã có khách đặt! Hãy bấm "Sửa ngày" trước khi thuê.`,
                            'event_busy'
                          );
                          return;
                        }
                        navigate('/rent/checkout', {
                          state: { selectedItemIds: selectedRentItems.map((i) => i.id) },
                        });
                      }}
                      className="w-full mt-1.5 py-3 px-4 rounded-xl bg-[#141310] text-white hover:bg-[#292724] text-xs font-bold uppercase tracking-wider text-center flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer"
                    >
                      <span>Tiến hành thuê RENT</span>
                      <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                    </button>
                  </div>
                )}

                {/* Separator if both selected */}
                {selectedRentItems.length > 0 && selectedThriftItems.length > 0 && (
                  <div className="flex items-center gap-2 my-0.5">
                    <div className="flex-1 h-px bg-[#EBE8E1]" />
                    <span className="text-[10px] uppercase font-bold tracking-wider text-[#7B766F]">
                      Hoặc thanh toán độc lập
                    </span>
                    <div className="flex-1 h-px bg-[#EBE8E1]" />
                  </div>
                )}

                {/* BLOCK 2: THRIFT ORDER SUMMARY */}
                {selectedThriftItems.length > 0 && (
                  <div className="p-4 rounded-2xl bg-[#F7F3EC]/80 flex flex-col gap-2.5 transition-all">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#141310] flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#181106]" />
                        <span>Tóm tắt Đơn Mua (THRIFT)</span>
                      </span>
                      <span className="text-xs text-[#7B766F]">
                        {selectedThriftItems.reduce((sum, it) => sum + (it.quantity || 1), 0)} sản phẩm đã chọn
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs text-[#7B766F] pt-2 border-t border-[#EBE8E1]">
                      <div className="flex justify-between">
                        <span>Giá trị sở hữu 1-of-1:</span>
                        <span className="font-semibold text-[#1C1C18]">
                          {formatCurrency(thriftSubtotal)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Vận chuyển bảo hiểm niêm phong:</span>
                        <span className="font-semibold text-[#1C1C18]">
                          {formatCurrency(thriftShipping)}
                        </span>
                      </div>
                      <div className="flex justify-between text-[#576151]">
                        <span>Chứng thư số &amp; Tem vật lý:</span>
                        <span className="font-bold text-[#576151]">Miễn phí (0₫)</span>
                      </div>
                    </div>

                    <div className="pt-2.5 border-t border-[#EBE8E1] flex justify-between items-baseline">
                      <span className="text-xs font-bold text-[#141310]">Tổng tạm tính THRIFT:</span>
                      <div className="text-right">
                        <div className="font-serif text-lg font-bold text-[#141310]">
                          {formatCurrency(thriftGrandTotal)}
                        </div>
                        <div className="text-[11px] text-[#7B766F]">Sở hữu vĩnh viễn</div>
                      </div>
                    </div>

                    {/* CTA THRIFT */}
                    <button
                      type="button"
                      onClick={() => {
                        if (!user) {
                          navigate('/login', { state: { from: '/thrift/checkout' } });
                          return;
                        }
                        navigate('/thrift/checkout', {
                          state: { selectedItemIds: selectedThriftItems.map((i) => i.id) },
                        });
                      }}
                      className="w-full mt-1.5 py-3 px-4 rounded-xl bg-[#31302C] text-white hover:bg-[#141310] text-xs font-bold uppercase tracking-wider text-center flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer"
                    >
                      <span>Tiến hành mua THRIFT</span>
                      <span className="material-symbols-outlined text-[18px]">shopping_bag</span>
                    </button>
                  </div>
                )}

                {/* Aggregate Bottom Insight */}
                {totalSelectedCount > 0 && (
                  <div className="p-3 bg-[#F1EDE6] rounded-xl flex items-center justify-between text-xs">
                    <span className="text-[#7B766F] font-medium">
                      Tổng giá trị thanh toán thực tế:
                    </span>
                    <span className="font-serif text-base font-bold text-[#141310]">
                      {formatCurrency(totalPayment)}
                    </span>
                  </div>
                )}

                {/* Customer Service Contact info */}
                <div className="flex items-center justify-center gap-2 text-xs text-[#7B766F] pt-1">
                  <span className="material-symbols-outlined text-[16px] text-[#576151]">
                    support_agent
                  </span>
                  <span>Cần tách lịch hoặc tư vấn hỗ trợ?</span>
                  <Link to="/contact" className="font-bold text-[#141310] underline">
                    Archive Concierge
                  </Link>
                </div>
              </div>

              {/* Escrow Protection Visual Badge */}
              <div className="bg-[#F7F3EC] p-4 rounded-2xl flex items-center gap-3 shadow-xs border border-[#EBE8E1]">
                <div className="w-10 h-10 rounded-full bg-[#D8E3CE] text-[#5B6655] flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-[20px]">security</span>
                </div>
                <div className="text-[12px] leading-relaxed text-[#7B766F]">
                  Tất cả giao dịch được bảo vệ theo chuẩn{' '}
                  <strong>PCI DSS &amp; Hợp đồng Ký quỹ Số</strong>. ReUse Hub chỉ giải ngân khi hai bên xác nhận tình trạng nguyên vẹn.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Edit Rental Duration Modal directly with Calendar */}
      {editingRentItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
          onClick={() => setEditingRentItem(null)}
        >
          <div
            className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl space-y-5 relative border border-[#EBE8E1] max-h-[92vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between pb-3 border-b border-[#F1EDE6]">
              <div>
                <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-[#4A6B53] bg-[#EEF2EC] px-2.5 py-0.5 rounded-full mb-1">
                  Chọn lịch thuê trực tiếp
                </span>
                <h3 className="font-serif text-lg font-bold text-[#141310] line-clamp-1">
                  {editingRentItem.title}
                </h3>
                <p className="text-xs text-[#7B766F] mt-0.5">
                  Bấm trực tiếp trên lịch để chọn ngày nhận và ngày hoàn trả thiết bị.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingRentItem(null)}
                className="p-1.5 rounded-full text-[#7B766F] hover:bg-[#F7F3EC] transition-colors cursor-pointer"
                title="Đóng"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Direct Rental Calendar */}
            <div className="py-1">
              <RentalCalendarPicker
                startDate={editStartDate}
                endDate={editEndDate}
                bookedRanges={editingBookedDates}
                onChange={(newStart, newEnd, newDays) => {
                  setEditStartDate(newStart);
                  setEditEndDate(newEnd);
                  setEditDays(newDays);
                }}
              />
            </div>

            {/* Selected Summary & Action CTAs */}
            <div className="pt-3 border-t border-[#F1EDE6] flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs text-[#7B766F] w-full sm:w-auto">
                Kỳ thuê: <strong className="text-[#141310]">{editDays} ngày</strong> · Đơn giá:{' '}
                <strong className="text-[#141310]">{formatCurrency(editingRentItem.price)}</strong> / ngày
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setEditingRentItem(null)}
                  className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-[#EBE8E1] text-xs font-semibold text-[#7B766F] hover:bg-[#F7F3EC] transition-colors cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleSaveRentalDays}
                  className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-[#141310] hover:bg-black text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  Xác nhận kỳ thuê
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;
