import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { Header, type UserRole } from '../../../components/layout/Header';
import { Footer } from '../../../components/layout/Footer';
import { UserSidebar } from '../../../components/layout/UserSidebar';
import {
  getRentalOrderByIdApi,
  getMyRentalOrdersApi,
  requestReturnOrderApi,
  type RentalOrderApi,
  type RentalOrderItemApi,
} from '../../../services/order.api';
import { resolveWishlistProduct } from '../../../services/wishlistProductResolver';
import { getRentProductDetail } from '../../data/rent/rentOrderDetailData';
import { resolveCleanAddress } from '../../../utils/address';
import { normalizeImageUrl } from '../../../utils/imageUrl';

interface EvidencePhoto {
  id: string;
  url: string;
  label: string;
  file?: File;
}

interface ItemReturnState {
  condition: 'perfect' | 'minor_wear' | 'scratch' | 'missing';
  checklist: boolean[];
  photos: EvidencePhoto[];
  note: string;
}

interface ReturnDisplayItem {
  id: string;
  productId: string;
  title: string;
  subtitle?: string;
  serialNumber: string;
  depositAmount: number;
  image: string;
  category: string;
  sealCode: string;
  packageNote: string;
  checklistLabels: string[];
}

const formatVND = (amount: number) => {
  return (amount || 0).toLocaleString('vi-VN') + '₫';
};

export const ReturnRequest: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const uId = user?._id || user?.id || '';

  const cleanId = (id || '').replace('#', '').trim();
  const activeUserRole: UserRole = (user?.role === 'SHOP_OWNER' ? 'SHOP' : user?.role || 'USER') as UserRole;

  // State
  const [loading, setLoading] = useState(true);
  const [backendOrder, setBackendOrder] = useState<RentalOrderApi | null>(null);
  const [displayItems, setDisplayItems] = useState<ReturnDisplayItem[]>([]);
  const [itemStates, setItemStates] = useState<Record<number, ItemReturnState>>({});
  const [confirmCommitment, setConfirmCommitment] = useState(false);
  const [commitmentError, setCommitmentError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const fileInputRefs = useRef<Record<number, HTMLInputElement | null>>({});

  // 1. Load real order from DB / BE / local storage
  useEffect(() => {
    let isMounted = true;

    const loadOrderData = async () => {
      setLoading(true);
      let foundOrder: RentalOrderApi | null = null;

      // A. Try loading by direct Mongo ID
      if (cleanId) {
        try {
          const direct = await getRentalOrderByIdApi(cleanId);
          if (direct && (direct._id || direct.orderCode)) {
            foundOrder = direct;
          }
        } catch {
          // ignore
        }
      }

      // B. Try matching from my-orders list if cleanId is an orderCode like RH-RNT-...
      if (!foundOrder) {
        try {
          const myOrders = await getMyRentalOrdersApi();
          if (Array.isArray(myOrders)) {
            const matched = myOrders.find((o) => {
              const code = (o.orderCode || '').replace('#', '').trim().toLowerCase();
              const mId = (o._id || '').toLowerCase();
              const cLower = cleanId.toLowerCase();
              return code === cLower || mId === cLower || (code && cLower.includes(code)) || (code && code.includes(cLower));
            });
            if (matched) foundOrder = matched;
          }
        } catch {
          // ignore
        }
      }

      // C. Look into local storage scoped strictly for current user
      if (uId) {
        try {
          const localRaw = localStorage.getItem(`user_rental_orders_${uId}`);
          if (localRaw) {
            const localList = JSON.parse(localRaw);
            if (Array.isArray(localList)) {
              const cLower = cleanId.toLowerCase();
              const matchedLocal = localList.find((o: { orderCode?: string; _id?: string; id?: string }) => {
                const code = (o.orderCode || '').replace('#', '').trim().toLowerCase();
                const oId = String(o._id || o.id || '').toLowerCase();
                return code === cLower || oId === cLower || (code && cLower.includes(code)) || (code && code.includes(cLower));
              });

              if (matchedLocal) {
                if (!foundOrder) {
                  foundOrder = matchedLocal;
                } else if (matchedLocal.items && matchedLocal.items.length > 0) {
                  // Enrich backend order with rich item descriptions from local backup
                  foundOrder = {
                    ...foundOrder,
                    items: matchedLocal.items,
                    depositAmount: matchedLocal.totalDeposit || matchedLocal.depositAmount || foundOrder.depositAmount,
                    shippingAddress: matchedLocal.shippingAddress || foundOrder.shippingAddress,
                  };
                }
              }
            }
          }
        } catch {
          // ignore
        }
      }

      // D. Also check dedicated backup key
      try {
        const backupRaw = localStorage.getItem(`reuse_order_backup_${cleanId}`);
        if (backupRaw) {
          const backupOrder = JSON.parse(backupRaw);
          if (!foundOrder) {
            foundOrder = backupOrder;
          } else if (backupOrder?.items && backupOrder.items.length > 0) {
            foundOrder = {
              ...foundOrder,
              items: backupOrder.items,
              depositAmount: backupOrder.totalDeposit || backupOrder.depositAmount || foundOrder.depositAmount,
            };
          }
        }
      } catch {
        // ignore
      }

      if (!isMounted) return;
      setBackendOrder(foundOrder);

      // Map dynamic items
      const rawItems = foundOrder?.items || [];
      const mapped: ReturnDisplayItem[] = [];

      rawItems.forEach((it: RentalOrderItemApi & Record<string, unknown>, idx: number) => {
        const pId = String(it.productId || it.id || '');
        const resolved = pId ? resolveWishlistProduct(pId) : null;
        const catalogDetail = pId ? getRentProductDetail(pId) : null;

        const rawTitle = (it.productName || it.title || resolved?.title || catalogDetail?.title || `Thiết bị thuê #${idx + 1}`) as string;
        const title = rawTitle.includes('Đơn hàng Thuê') ? (resolved?.title || catalogDetail?.title || rawTitle) : rawTitle;

        const rawImg = (it.image || it.imageUrl || resolved?.image || catalogDetail?.images?.[0]?.src || '') as string;
        let img = normalizeImageUrl(rawImg);
        if (!img || img.includes('unsplash.com/photo-1516035069371')) {
          img = 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=600&q=80';
        }

        const cat = (it.category || resolved?.category || catalogDetail?.category || 'Thiết bị & Quang học') as string;
        const deposit = Number(it.depositAmount || resolved?.deposit || catalogDetail?.deposit || (Number(it.pricePerDay || 200000) * 5));

        // Generate dynamic checklist labels tailored to the product category & apparel/gear
        let checklists = [
          'Vật phẩm nguyên vẹn, không nứt vỡ, trầy xước hay biến dạng bề mặt',
          'Đầy đủ linh kiện, phụ kiện và hướng dẫn bàn giao ban đầu',
          'Đồ dùng đã được vệ sinh sạch sẽ, lau chùi/phơi khô ráo hoàn toàn',
          'Hộp bảo vệ / Bao bì chống sốc ReUse được đóng gói an toàn',
        ];

        const catLower = cat.toLowerCase();
        const titleLower = title.toLowerCase();

        // 1. Quần áo & Thời trang & Giày dép & Trang phục
        if (
          catLower.includes('thời trang') ||
          catLower.includes('quần áo') ||
          catLower.includes('fashion') ||
          catLower.includes('apparel') ||
          catLower.includes('giày') ||
          catLower.includes('shoes') ||
          titleLower.includes('áo') ||
          titleLower.includes('quần') ||
          titleLower.includes('váy') ||
          titleLower.includes('đầm') ||
          titleLower.includes('jacket') ||
          titleLower.includes('coat') ||
          titleLower.includes('hoodie') ||
          titleLower.includes('blazer') ||
          titleLower.includes('sneaker') ||
          titleLower.includes('túi xách')
        ) {
          checklists = [
            'Bề mặt vải/da nguyên vẹn, không rách, sờn chỉ hay xơ xước',
            'Không vết bẩn cứng đầu, ố mồ hôi hay mùi lạ (đã giặt khô/vệ sinh)',
            'Đầy đủ cúc khuy, khóa kéo (zipper) trơn tru, đai dây nguyên vẹn',
            'Túi bọc chống bụi (dustbag), móc treo và tem mác phụ kiện đầy đủ',
          ];
        }
        // 2. Camera, Ống kính & Thiết bị quang học
        else if (
          catLower.includes('camera') ||
          catLower.includes('quang học') ||
          titleLower.includes('camera') ||
          titleLower.includes('lens') ||
          titleLower.includes('canon') ||
          titleLower.includes('sony') ||
          titleLower.includes('fujifilm') ||
          titleLower.includes('nikon')
        ) {
          checklists = [
            'Thấu kính quang học không trầy/mốc (Kính trước & kính sau)',
            'Cảm biến sạch sẽ, màn trập & vòng xoay hoạt động trơn tru',
            'Đầy đủ Pin zin chính hãng + Củ sạc kép an toàn',
            'Nắp che body, cap trước/sau lens và filter bảo vệ đầy đủ',
          ];
        }
        // 3. Cắm trại, Lều & Đồ dã ngoại ngoài trời
        else if (
          catLower.includes('cắm trại') ||
          catLower.includes('camping') ||
          catLower.includes('dã ngoại') ||
          titleLower.includes('lều') ||
          titleLower.includes('tent') ||
          titleLower.includes('bạt') ||
          titleLower.includes('túi ngủ')
        ) {
          checklists = [
            'Thân lều trong + Bạt phủ ngoài Rainfly khô ráo hoàn toàn',
            'Bộ khung duralumin nguyên vẹn, không cong gãy biến dạng',
            'Đủ cọc ghim nhôm + Dây phản quang Guyline',
            'Túi đựng chuyên dụng kèm đai nén định hình gọn gàng',
          ];
        }
        // 4. Thiết bị điện tử, Audio, Nhạc cụ & Synthesizer
        else if (
          catLower.includes('audio') ||
          catLower.includes('âm thanh') ||
          catLower.includes('lifestyle') ||
          catLower.includes('điện tử') ||
          titleLower.includes('loa') ||
          titleLower.includes('mic') ||
          titleLower.includes('op-1') ||
          titleLower.includes('synthesizer') ||
          titleLower.includes('tai nghe') ||
          titleLower.includes('sound')
        ) {
          checklists = [
            'Thân máy/bàn phím không cấn móp, nút bấm & núm vặn nguyên vẹn',
            'Đầy đủ cáp kết nối, củ sạc nguồn và jack chuyển đổi zin đi kèm',
            'Pin sạc đã nạp tối thiểu 50%, hoạt động ổn định không rè/lỗi',
            'Hộp đựng chống sốc / Bao da bảo quản ban đầu đầy đủ',
          ];
        }

        const sealCode = `TS-${cleanId.slice(-4) || '8841'}-${String.fromCharCode(65 + idx)}`;
        let packageNote = 'Đóng gói nguyên hộp kiểm định';
        if (catLower.includes('thời trang') || titleLower.includes('áo') || titleLower.includes('quần')) {
          packageNote = 'Đã giặt khô & Bọc túi dustbag';
        } else if (catLower.includes('camera')) {
          packageNote = 'Nanuk 935 Case Đầy Đủ';
        } else if (catLower.includes('cắm trại') || titleLower.includes('lều')) {
          packageNote = 'Đã phơi khô & Vệ sinh';
        }

        mapped.push({
          id: String(it._id || it.id || idx),
          productId: pId,
          title,
          subtitle: it.subtitle as string | undefined,
          serialNumber: (it.serialNumber as string) || `SN-${cleanId.slice(-4)}-${idx + 1}`,
          depositAmount: deposit,
          image: img,
          category: cat,
          sealCode,
          packageNote,
          checklistLabels: checklists,
        });
      });

      // Nếu không có sản phẩm nào trong đơn, không chèn data mẫu giả
      setDisplayItems(mapped);

      // Khởi tạo trạng thái trả hàng: KHÔNG dùng ảnh mẫu fake, bắt đầu từ danh sách rỗng để người dùng tự chụp ảnh thực tế
      const initialStates: Record<number, ItemReturnState> = {};
      mapped.forEach((_item, index) => {
        initialStates[index] = {
          condition: 'perfect',
          checklist: [true, true, true, true],
          photos: [], // Rỗng để người dùng tự chụp và tải lên
          note: '',
        };
      });
      setItemStates(initialStates);

      setLoading(false);
    };

    loadOrderData();

    return () => {
      isMounted = false;
    };
  }, [cleanId, uId]);

  // Totals & Pricing Breakdown
  const totalDeposit = useMemo(() => {
    if (backendOrder?.depositAmount && backendOrder.depositAmount > 0) {
      return backendOrder.depositAmount;
    }
    return displayItems.reduce((acc, it) => acc + (it.depositAmount || 0), 0);
  }, [backendOrder, displayItems]);

  const rentalFeePaid = useMemo(() => {
    return backendOrder?.rentalFee || backendOrder?.totalAmount || 3150000;
  }, [backendOrder]);

  const displayOrderCode = backendOrder?.orderCode || `#${cleanId || 'RH-RNT-2026'}`;
  const cleanOrderCode = displayOrderCode.replace('#', '');

  // Deadline String & Overdue Calculation
  const deadlineStr = useMemo(() => {
    if (backendOrder?.endDate) {
      const d = new Date(backendOrder.endDate);
      return `Hạn trả: 18:00 (${d.toLocaleDateString('vi-VN')})`;
    }
    const today = new Date();
    return `Hạn trả: 18:00 hôm nay (${today.toLocaleDateString('vi-VN')})`;
  }, [backendOrder]);

  const overdueInfo = useMemo(() => {
    if (!backendOrder?.endDate) return null;
    const now = new Date();
    const end = new Date(backendOrder.endDate);
    if (now > end) {
      const diffMs = now.getTime() - end.getTime();
      const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      const dailyRate = Math.round((backendOrder.rentalFee || 220000) / (backendOrder.rentalDays || 1));
      return {
        isOverdue: true,
        days,
        estimatedFee: days * dailyRate,
      };
    }
    return null;
  }, [backendOrder]);

  // Shipping pickup info
  const shippingAddress = backendOrder?.shippingAddress;
  const pickupAddressStr = useMemo(() => {
    return resolveCleanAddress(shippingAddress, user);
  }, [shippingAddress, user]);

  // Action Handlers
  const handleConditionChange = (itemIdx: number, condition: ItemReturnState['condition']) => {
    setItemStates((prev) => ({
      ...prev,
      [itemIdx]: {
        ...prev[itemIdx],
        condition,
      },
    }));
  };

  const handleChecklistToggle = (itemIdx: number, checkIdx: number) => {
    setItemStates((prev) => {
      const currentChecks = [...(prev[itemIdx]?.checklist || [true, true, true, true])];
      currentChecks[checkIdx] = !currentChecks[checkIdx];
      return {
        ...prev,
        [itemIdx]: {
          ...prev[itemIdx],
          checklist: currentChecks,
        },
      };
    });
  };

  const handleNoteChange = (itemIdx: number, note: string) => {
    setItemStates((prev) => ({
      ...prev,
      [itemIdx]: {
        ...prev[itemIdx],
        note,
      },
    }));
  };

  const handlePhotoUpload = (itemIdx: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newPhotos: EvidencePhoto[] = [];
    Array.from(files).forEach((file) => {
      const url = URL.createObjectURL(file);
      newPhotos.push({
        id: Math.random().toString(36).substring(2, 9),
        url,
        label: file.name.substring(0, 18),
        file,
      });
    });

    setItemStates((prev) => ({
      ...prev,
      [itemIdx]: {
        ...prev[itemIdx],
        photos: [...(prev[itemIdx]?.photos || []), ...newPhotos],
      },
    }));

    // Reset input
    e.target.value = '';
  };

  const handleDeletePhoto = (itemIdx: number, photoId: string) => {
    setItemStates((prev) => ({
      ...prev,
      [itemIdx]: {
        ...prev[itemIdx],
        photos: (prev[itemIdx]?.photos || []).filter((p) => p.id !== photoId),
      },
    }));
  };

  // Submit Return Request
  const handleSubmitReturn = async () => {
    setSubmitError(null);

    if (!confirmCommitment) {
      setCommitmentError(true);
      const el = document.getElementById('confirmCheckboxContainer');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }
    setCommitmentError(false);

    setIsSubmitting(true);

    try {
      // 1. Prepare images & notes payload
      const allImages: string[] = [];
      const formData = new FormData();
      let hasRealFiles = false;

      Object.values(itemStates).forEach((st) => {
        st.photos.forEach((photo) => {
          if (photo.file) {
            formData.append('images', photo.file);
            hasRealFiles = true;
          } else if (photo.url && photo.url.startsWith('http')) {
            allImages.push(photo.url);
          }
        });
      });

      const noteText = Object.entries(itemStates)
        .map(([idx, st]) => `Item ${Number(idx) + 1} (${st.condition}): ${st.note || 'Tình trạng tốt'}`)
        .join('; ');
      formData.append('note', noteText);

      // 2. Call BE API if backend order ID exists
      const targetOrderId = backendOrder?._id || cleanId;
      try {
        if (hasRealFiles) {
          await requestReturnOrderApi(targetOrderId, formData);
        } else {
          await requestReturnOrderApi(targetOrderId, {
            images: allImages.length > 0 ? allImages : [displayItems[0]?.image || 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32'],
            note: noteText,
          });
        }
      } catch (apiErr) {
        console.warn('Backend return API note (fallback to local state sync):', apiErr);
      }

      // 3. Update localStorage orders strictly for current user
      if (uId) {
        try {
          const key = `user_rental_orders_${uId}`;
          const raw = localStorage.getItem(key);
          if (raw) {
            const list = JSON.parse(raw);
            if (Array.isArray(list)) {
              const updated = list.map((o: { orderCode?: string; _id?: string }) => {
                const c = (o.orderCode || '').replace('#', '').trim().toLowerCase();
                const m = (o._id || '').toLowerCase();
                const target = cleanOrderCode.toLowerCase();
                if (c === target || m === target || (c && target.includes(c)) || (c && c.includes(target))) {
                  return {
                    ...o,
                    status: 'RETURN_REQUESTED',
                    pickupScheduled: true,
                    returnedAt: new Date().toISOString(),
                    returnTrackingCode: `VN-${cleanOrderCode.replace(/\D/g, '').slice(-6) || '883910'}-RNT`,
                  };
                }
                return o;
              });
              localStorage.setItem(key, JSON.stringify(updated));
            }
          }
        } catch {
          // ignore
        }
      }

      // Update dedicated order backup and direct return request indicators
      try {
        const backupKey = `reuse_order_backup_${cleanOrderCode}`;
        const bRaw = localStorage.getItem(backupKey);
        if (bRaw) {
          const bObj = JSON.parse(bRaw);
          bObj.status = 'RETURN_REQUESTED';
          bObj.pickupScheduled = true;
          localStorage.setItem(backupKey, JSON.stringify(bObj));
        }

        const returnRecord = {
          orderCode: cleanOrderCode,
          orderId: targetOrderId,
          status: 'RETURN_REQUESTED',
          pickupScheduled: true,
          returnedAt: new Date().toISOString(),
          returnTrackingCode: `VN-${cleanOrderCode.replace(/\D/g, '').slice(-6) || '883910'}-RNT`,
        };
        const recordStr = JSON.stringify(returnRecord);
        localStorage.setItem(`return_request_${cleanOrderCode.toLowerCase()}`, recordStr);
        localStorage.setItem(`return_request_${cleanId.toLowerCase()}`, recordStr);
        if (targetOrderId) localStorage.setItem(`return_request_${String(targetOrderId).toLowerCase()}`, recordStr);
      } catch {
        // ignore
      }

      // Dispatch event to refresh Sidebar, Dashboard and Orders
      window.dispatchEvent(new Event('rental_order_updated'));
      window.dispatchEvent(new Event('storage'));

      // 4. Open celebratory Return Confirmation modal and notify
      setIsSubmitting(false);
      setShowSuccessModal(true);
    } catch (err: unknown) {
      console.error('Submit return error:', err);
      setSubmitError('Có lỗi xảy ra khi gửi yêu cầu. Vui lòng thử lại hoặc liên hệ hỗ trợ.');
      setIsSubmitting(false);
    }
  };

  // Dynamic Bench Lab subtitle based on item category
  const benchLabSubtitle = useMemo(() => {
    if (!displayItems || displayItems.length === 0) return 'Kiểm định vải & phụ kiện';

    const hasApparel = displayItems.some((it) => {
      const c = (it.category || '').toLowerCase();
      const t = (it.title || '').toLowerCase();
      return (
        c.includes('thời trang') ||
        c.includes('quần áo') ||
        c.includes('fashion') ||
        c.includes('apparel') ||
        c.includes('giày') ||
        t.includes('áo') ||
        t.includes('quần') ||
        t.includes('váy') ||
        t.includes('jacket') ||
        t.includes('hoodie') ||
        t.includes('blazer') ||
        t.includes('coat')
      );
    });
    if (hasApparel) return 'Kiểm định vải & phụ kiện';

    const hasTent = displayItems.some((it) => {
      const c = (it.category || '').toLowerCase();
      const t = (it.title || '').toLowerCase();
      return (
        c.includes('cắm trại') ||
        c.includes('camping') ||
        c.includes('dã ngoại') ||
        t.includes('lều') ||
        t.includes('tent') ||
        t.includes('bạt')
      );
    });
    if (hasTent) return 'Kiểm tra bạt & khung lều';

    const hasAudio = displayItems.some((it) => {
      const c = (it.category || '').toLowerCase();
      const t = (it.title || '').toLowerCase();
      return (
        c.includes('audio') ||
        c.includes('âm thanh') ||
        c.includes('lifestyle') ||
        t.includes('loa') ||
        t.includes('mic') ||
        t.includes('op-1') ||
        t.includes('synthesizer')
      );
    });
    if (hasAudio) return 'Kiểm tra bo mạch & pin sạc';

    const hasCamera = displayItems.some((it) => {
      const c = (it.category || '').toLowerCase();
      const t = (it.title || '').toLowerCase();
      return (
        c.includes('camera') ||
        c.includes('quang học') ||
        t.includes('camera') ||
        t.includes('lens') ||
        t.includes('canon') ||
        t.includes('sony') ||
        t.includes('nikon') ||
        t.includes('fujifilm')
      );
    });
    if (hasCamera) return 'Soi kính & cảm biến';

    return 'Thẩm định kỹ thuật';
  }, [displayItems]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-[#FBF9F5] text-[#22201D]">
        <Header userRole={activeUserRole} />
        <div className="flex-1 flex items-center justify-center p-12">
          <div className="text-center space-y-3">
            <div className="w-10 h-10 border-3 border-[#22201D] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-semibold text-[#76726B] tracking-wider uppercase">Đang đối chiếu dữ liệu đơn thuê...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FBF9F5] text-[#22201D] antialiased selection:bg-[#E8E2D5]">

      <Header userRole={activeUserRole} />

      {/* MAIN APP CONTAINER (Sidebar + Return Flow) */}
      <div className="flex-1 max-w-[1520px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 flex gap-8">
        {/* PERSISTENT CUSTOMER SIDEBAR */}
        <aside className="w-64 shrink-0 hidden lg:block">
          <UserSidebar activeKey="rent-orders" />
        </aside>

        {/* MAIN DASHBOARD CONTENT AREA */}
        <main className="flex-1 min-w-0 space-y-8">
          <div className="flex flex-col w-full">
            {/* Top Breadcrumb & Status Navigation */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-6">
              <div className="flex items-center gap-2 text-xs text-[#76726B]">
                <Link
                  to="/rent/orders"
                  className="hover:text-[#22201D] transition-colors flex items-center gap-1 font-medium"
                >
                  <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                  Đơn thuê của tôi
                </Link>
                <span className="text-[#9C9589]">/</span>
                <Link
                  to={`/rent/orders/${cleanOrderCode}`}
                  className="hover:text-[#22201D] transition-colors font-medium"
                >
                  #{cleanOrderCode}
                </Link>
                <span className="text-[#9C9589]">/</span>
                <span className="text-[#22201D] font-semibold">Quy trình hoàn trả toàn đơn</span>
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F6F3EE] shadow-xs">
                <span className="w-2 h-2 rounded-full bg-[#5E6D5B] animate-pulse" />
                <span className="text-[11px] font-semibold text-[#22201D] uppercase tracking-wider">
                  {deadlineStr}
                </span>
              </div>
            </div>

            {/* Editorial Page Title */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-8">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#EFECE6] text-[10px] font-bold uppercase tracking-widest text-[#22201D]">
                  <span className="material-symbols-outlined text-[13px]">published_with_changes</span>
                  Unified Return Submission · {displayItems.length.toString().padStart(2, '0')} Sản phẩm
                </div>
                <h1 className="text-3xl lg:text-4xl font-serif font-bold text-[#22201D] tracking-tight">
                  Yêu cầu hoàn trả đơn thuê #{cleanOrderCode}
                </h1>
                <p className="text-sm text-[#76726B] max-w-2xl leading-relaxed">
                  Thực hiện kiểm đếm tình trạng ngoại quan, ghi nhận minh chứng ảnh chụp trước khi niêm phong bàn giao cho bưu tá lấy hàng tận nơi.
                </p>
              </div>

              {/* Escrow Protected Stamp */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white shadow-xs lg:self-start border border-[#E8E4DC]/80">
                <div className="w-9 h-9 rounded-full bg-[#EEF2EC] text-[#5E6D5B] flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[20px]">verified_user</span>
                </div>
                <div className="text-left">
                  <p className="text-[11px] font-bold text-[#22201D] leading-none">Smart Escrow Khóa An Toàn</p>
                  <p className="text-[10px] text-[#76726B] mt-1 font-mono">
                    {formatVND(totalDeposit)} đang phong tỏa bảo lưu
                  </p>
                </div>
              </div>
            </div>

            {/* OVERDUE NOTICE BANNER (Nếu trả quá hạn: Vẫn cho trả đồ, phí trễ đối soát cấn trừ vào cọc) */}
            {overdueInfo?.isOverdue && (
              <div className="mb-6 p-4 sm:p-5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-3.5 text-xs leading-relaxed shadow-2xs">
                <span className="material-symbols-outlined text-amber-600 text-[24px] shrink-0">info</span>
                <div>
                  <p className="font-bold text-amber-800 uppercase tracking-wide text-[11px] flex items-center gap-1.5">
                    <span>LƯU Ý THỜI GIAN HOÀN TRẢ · ĐƠN HÀNG ĐANG QUÁ HẠN {overdueInfo.days} NGÀY</span>
                  </p>
                  <p className="mt-1 text-amber-900/90 leading-relaxed">
                    Bạn <strong>vẫn được hoàn trả thiết bị bình thường và bảo toàn tài sản</strong>. Phí thuê phát sinh quá hạn dự kiến khoảng <strong>{formatVND(overdueInfo.estimatedFee)}</strong> ({overdueInfo.days} ngày) sẽ được trạm Bench Lab kiểm định (Bước 8) đối soát và tự động cấn trừ vào khoản tiền ký quỹ Smart Escrow. Số tiền cọc còn lại sẽ được hoàn trả 100% về tài khoản của bạn.
                  </p>
                </div>
              </div>
            )}

            {/* 9-STEP HORIZONTAL STEPPER THEO CHUẨN AC (ĐANG Ở BƯỚC 7: YÊU CẦU TRẢ) */}
            <div className="mb-8 bg-white p-6 sm:p-7 rounded-3xl shadow-sm border border-[#E8E4DC]/80 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-[#76726B]">
                    Tiến trình tuần hoàn Smart Escrow
                  </span>
                  <h2 className="font-serif text-lg sm:text-xl font-bold text-[#22201D]">
                    Vòng đời đơn thuê (Đang ở Bước 7: Yêu cầu trả đồ)
                  </h2>
                </div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EAF3FA] text-[#245778] text-xs font-semibold self-start sm:self-auto border border-[#CFE4F3]">
                  <span className="w-2 h-2 rounded-full bg-[#3B6E8C] animate-pulse" />
                  <span>Bước tiếp theo: Bước 8 - Bench Lab ({benchLabSubtitle})</span>
                </div>
              </div>

              {/* Stepper Scrollable Track */}
              <div className="overflow-x-auto pb-3 pt-1 thin-scrollbar">
                <div className="min-w-[940px] relative flex items-start justify-between">
                  {/* Connecting Line Background */}
                  <div className="absolute top-4 left-6 right-6 h-0.5 bg-stone-200 -z-0" />
                  <div
                    className="absolute top-4 left-6 h-0.5 bg-stone-900 -z-0 transition-all duration-500"
                    style={{ width: '75%' }}
                  />

                  {[
                    { id: 0, label: '1. Đã đặt', subtext: 'Chờ Shop duyệt' },
                    { id: 1, label: '2. Shop duyệt', subtext: 'Chờ thanh toán' },
                    { id: 2, label: '3. Đã thanh toán', subtext: 'Khóa Escrow' },
                    { id: 3, label: '4. Shop gửi hàng', subtext: 'Bưu tá vận chuyển' },
                    { id: 4, label: '5. Đã nhận', subtext: 'Khớp CLA 3 góc' },
                    { id: 5, label: '6. ĐANG THUÊ', subtext: 'Hiệu lực lưu ký' },
                    { id: 6, label: '7. Yêu cầu trả', subtext: 'Đang làm thủ tục' },
                    { id: 7, label: '8. Bench Lab', subtext: benchLabSubtitle },
                    { id: 8, label: '9. Hoàn tất cọc', subtext: `${formatVND(totalDeposit)} tự động` },
                  ].map((step) => {
                    const isPast = step.id < 6;
                    const isCurrent = step.id === 6;

                    return (
                      <div key={step.id} className="flex flex-col items-center text-center w-24 relative z-10">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shadow-xs transition-all ${
                            isPast
                              ? 'bg-stone-900 text-white'
                              : isCurrent
                              ? 'bg-[#8E6334] text-white ring-4 ring-[#8E6334]/20 scale-105 animate-pulse'
                              : 'bg-stone-100 text-stone-400'
                          }`}
                        >
                          {isPast ? (
                            <span className="material-symbols-outlined text-[15px]">check</span>
                          ) : isCurrent ? (
                            <span className="material-symbols-outlined text-[15px]">assignment_return</span>
                          ) : (
                            <span>{step.id + 1}</span>
                          )}
                        </div>
                        <span
                          className={`text-[11px] font-semibold mt-2 ${
                            isCurrent
                              ? 'text-[#8E6334] font-bold'
                              : isPast
                              ? 'text-stone-900 font-medium'
                              : 'text-stone-400'
                          }`}
                        >
                          {step.label}
                        </span>
                        <span
                          className={`text-[9px] mt-0.5 ${
                            isCurrent ? 'text-[#8E6334] font-semibold' : 'text-stone-400'
                          }`}
                        >
                          {step.subtext}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Mandatory Return Protocol Banner */}
            <div className="mb-8 p-5 rounded-2xl bg-gradient-to-r from-[#F6F3EE] via-[#EFECE6] to-[#F6F3EE] shadow-xs relative overflow-hidden border border-[#E8E4DC]/70">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-[#22201D] text-white flex items-center justify-center shrink-0 shadow-xs">
                  <span className="material-symbols-outlined text-[20px]">policy</span>
                </div>
                <div className="flex-1 space-y-1">
                  <h4 className="text-xs font-bold text-[#22201D] uppercase tracking-wider flex items-center gap-2">
                    Nguyên tắc đối kiểm Smart Escrow &amp; Quyền lợi người thuê
                  </h4>
                  <p className="text-xs text-[#76726B] leading-relaxed">
                    Khách hàng <span className="font-semibold text-[#22201D]">không tự quyết định</span> số tiền hoàn cọc hoặc tiền phạt khấu trừ. Sau khi gửi yêu cầu và bưu tá lấy hàng, trạng thái sẽ tự động chuyển từ <span className="font-mono font-bold text-[#22201D]">RETURNED</span> → <span className="font-mono font-bold text-[#22201D]">INSPECTING</span>. Shop Owner và chuyên gia kỹ thuật Bench Lab sẽ đối kiểm video unboxing để xác nhận hoàn trả cọc 100% hoặc bù trừ hao mòn minh bạch qua smart escrow.
                  </p>
                </div>
                <div className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white shadow-2xs text-[11px] font-medium text-[#22201D] border border-[#E8E4DC]/60">
                  <span className="material-symbols-outlined text-[15px] text-[#5E6D5B]">alarm_on</span>
                  Giải tỏa trong 4h - 24h
                </div>
              </div>
            </div>

            {/* Main Multi-Column Return Flow */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* LEFT COLUMN: Items Return Assessment Form (8 cols) */}
              <div className="lg:col-span-8 space-y-8">
                {displayItems.length === 0 ? (
                  <div className="bg-white rounded-2xl p-8 sm:p-12 text-center shadow-xs border border-[#E8E4DC]/80 space-y-4">
                    <div className="w-14 h-14 rounded-full bg-[#F6F3EE] flex items-center justify-center mx-auto text-[#76726B]">
                      <span className="material-symbols-outlined text-[28px]">inventory_2</span>
                    </div>
                    <h3 className="text-base font-serif font-bold text-[#22201D]">
                      Không tìm thấy thiết bị trong đơn thuê này
                    </h3>
                    <p className="text-xs text-[#76726B] max-w-md mx-auto leading-relaxed">
                      Đơn thuê chưa có danh mục sản phẩm hợp lệ để đối kiểm trả hàng. Vui lòng kiểm tra lại đơn thuê hoặc liên hệ bộ phận hỗ trợ ReUse Hub.
                    </p>
                    <Link
                      to="/rent/orders"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#22201D] text-white text-xs font-semibold hover:bg-black transition-colors"
                    >
                      <span className="material-symbols-outlined text-[15px]">arrow_back</span>
                      <span>Quay về danh sách đơn thuê</span>
                    </Link>
                  </div>
                ) : (
                  displayItems.map((item, itemIdx) => {
                    const state = itemStates[itemIdx] || {
                      condition: 'perfect',
                      checklist: [true, true, true, true],
                      photos: [],
                      note: '',
                    };

                    return (
                      <section
                        key={item.id}
                        className="bg-white rounded-2xl p-6 shadow-xs space-y-6 border border-[#E8E4DC]/80"
                      >
                      {/* Item Header Pill */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 bg-[#F6F3EE] -mx-6 -mt-6 p-6 rounded-t-2xl border-b border-[#E8E4DC]/70">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 shadow-2xs bg-white border border-[#E8E4DC]">
                            <img
                              className="w-full h-full object-cover"
                              src={item.image}
                              alt={item.title}
                            />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#22201D] text-white font-mono">
                                ITEM {(itemIdx + 1).toString().padStart(2, '0')}/{displayItems.length.toString().padStart(2, '0')}
                              </span>
                              <span className="text-[10px] font-medium text-[#76726B] font-mono">
                                Seal: #{item.sealCode}
                              </span>
                            </div>
                            <h2 className="text-base font-serif font-bold text-[#22201D] mt-1 line-clamp-1">
                              {item.title}
                            </h2>
                            <p className="text-xs text-[#76726B] font-mono mt-0.5">
                              {item.serialNumber} · Cọc ký quỹ: {formatVND(item.depositAmount)}
                            </p>
                          </div>
                        </div>
                        <span className="self-start sm:self-center px-2.5 py-1 rounded-full bg-[#EEF2EC] text-[#5E6D5B] text-[10px] font-bold uppercase tracking-wider">
                          {item.packageNote}
                        </span>
                      </div>

                      {/* 1. Condition Selector */}
                      <div className="space-y-3">
                        <label className="text-xs font-bold uppercase tracking-wider text-[#22201D] flex items-center justify-between">
                          <span>1. Đánh giá hiện trạng thiết bị khi hoàn trả</span>
                          <span className="text-[10px] font-normal text-[#76726B] lowercase">Chọn mức độ chính xác nhất</span>
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
                          {/* Option 1: Hoàn hảo 100% */}
                          <label className="cursor-pointer">
                            <input
                              type="radio"
                              name={`item_${itemIdx}_condition`}
                              value="perfect"
                              checked={state.condition === 'perfect'}
                              onChange={() => handleConditionChange(itemIdx, 'perfect')}
                              className="peer sr-only"
                            />
                            <div className="p-3 rounded-xl bg-[#F6F3EE] peer-checked:bg-[#22201D] peer-checked:text-white transition-all text-center space-y-1 shadow-2xs border border-[#E8E4DC]/60 peer-checked:border-[#22201D]">
                              <span className="material-symbols-outlined text-[18px] block">check_circle</span>
                              <p className="text-xs font-bold leading-tight">Hoàn hảo 100%</p>
                              <p className="text-[10px] opacity-75 leading-tight">Không vết trầy mới</p>
                            </div>
                          </label>

                          {/* Option 2: Hao mòn nhẹ */}
                          <label className="cursor-pointer">
                            <input
                              type="radio"
                              name={`item_${itemIdx}_condition`}
                              value="minor_wear"
                              checked={state.condition === 'minor_wear'}
                              onChange={() => handleConditionChange(itemIdx, 'minor_wear')}
                              className="peer sr-only"
                            />
                            <div className="p-3 rounded-xl bg-[#F6F3EE] peer-checked:bg-[#22201D] peer-checked:text-white transition-all text-center space-y-1 shadow-2xs border border-[#E8E4DC]/60 peer-checked:border-[#22201D]">
                              <span className="material-symbols-outlined text-[18px] block">tune</span>
                              <p className="text-xs font-bold leading-tight">Hao mòn nhẹ</p>
                              <p className="text-[10px] opacity-75 leading-tight">Bụi bề mặt, xước tơ</p>
                            </div>
                          </label>

                          {/* Option 3: Có vết cấn / xước */}
                          <label className="cursor-pointer">
                            <input
                              type="radio"
                              name={`item_${itemIdx}_condition`}
                              value="scratch"
                              checked={state.condition === 'scratch'}
                              onChange={() => handleConditionChange(itemIdx, 'scratch')}
                              className="peer sr-only"
                            />
                            <div className="p-3 rounded-xl bg-[#F6F3EE] peer-checked:bg-[#22201D] peer-checked:text-white transition-all text-center space-y-1 shadow-2xs border border-[#E8E4DC]/60 peer-checked:border-[#22201D]">
                              <span className="material-symbols-outlined text-[18px] block">warning</span>
                              <p className="text-xs font-bold leading-tight">Có vết cấn / xước</p>
                              <p className="text-[10px] opacity-75 leading-tight">Cần Bench Lab thẩm định</p>
                            </div>
                          </label>

                          {/* Option 4: Mất / Thiếu phụ kiện */}
                          <label className="cursor-pointer">
                            <input
                              type="radio"
                              name={`item_${itemIdx}_condition`}
                              value="missing"
                              checked={state.condition === 'missing'}
                              onChange={() => handleConditionChange(itemIdx, 'missing')}
                              className="peer sr-only"
                            />
                            <div className="p-3 rounded-xl bg-[#F6F3EE] peer-checked:bg-[#22201D] peer-checked:text-white transition-all text-center space-y-1 shadow-2xs border border-[#E8E4DC]/60 peer-checked:border-[#22201D]">
                              <span className="material-symbols-outlined text-[18px] block">help_center</span>
                              <p className="text-xs font-bold leading-tight">Mất / Thiếu phụ kiện</p>
                              <p className="text-[10px] opacity-75 leading-tight">Thiếu nắp / cáp / sạc</p>
                            </div>
                          </label>
                        </div>
                      </div>

                      {/* 2. Checklist for Optical & Body Integrity */}
                      <div className="space-y-2.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-[#22201D] block">
                          2. Danh mục phụ kiện &amp; Chi tiết kiểm đếm
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          {item.checklistLabels.map((lbl, cIdx) => (
                            <label
                              key={cIdx}
                              className="flex items-center gap-2.5 p-2.5 rounded-lg bg-[#F6F3EE]/70 hover:bg-[#F6F3EE] cursor-pointer transition-colors border border-[#E8E4DC]/40"
                            >
                              <input
                                type="checkbox"
                                checked={state.checklist[cIdx] ?? true}
                                onChange={() => handleChecklistToggle(itemIdx, cIdx)}
                                className="w-4 h-4 rounded text-[#22201D] accent-[#22201D]"
                              />
                              <span className="text-[#22201D] font-medium leading-tight">{lbl}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* 3. Photo Upload Evidence Grid */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold uppercase tracking-wider text-[#22201D]">
                            3. Ảnh đối chứng trước khi đóng hộp (Tối thiểu 3 góc)
                          </label>
                          <span className={`text-[10px] font-semibold flex items-center gap-1 ${state.photos.length >= 3 ? 'text-[#5E6D5B]' : 'text-[#9C9589]'}`}>
                            <span className="material-symbols-outlined text-[13px]">
                              {state.photos.length >= 3 ? 'check' : 'photo_camera'}
                            </span>
                            Đã tải {state.photos.length}/3 ảnh
                          </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {state.photos.map((photo) => (
                            <div
                              key={photo.id}
                              className="relative group aspect-square rounded-xl overflow-hidden bg-[#F6F3EE] shadow-2xs border border-[#E8E4DC]"
                            >
                              <img
                                className="w-full h-full object-cover"
                                src={photo.url}
                                alt={photo.label}
                              />
                              <div className="absolute inset-0 bg-[#22201D]/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2 text-white">
                                <span className="text-[9px] font-mono uppercase bg-[#22201D]/80 px-1 py-0.5 rounded self-start truncate max-w-full">
                                  {photo.label}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleDeletePhoto(itemIdx, photo.id)}
                                  className="self-end p-1 hover:text-[#E57373] transition-colors"
                                  title="Xóa ảnh"
                                >
                                  <span className="material-symbols-outlined text-[16px]">delete</span>
                                </button>
                              </div>
                              <span className="absolute bottom-1.5 left-1.5 text-[9px] font-medium bg-white/90 text-[#22201D] px-1.5 py-0.5 rounded shadow-2xs group-hover:hidden truncate max-w-[85%]">
                                {photo.label}
                              </span>
                            </div>
                          ))}

                          {/* Upload Box */}
                          <label className="cursor-pointer flex flex-col items-center justify-center aspect-square rounded-xl bg-[#F6F3EE] hover:bg-[#EFECE6] transition-all text-[#76726B] hover:text-[#22201D] shadow-2xs group border border-dashed border-[#D8D2C6]">
                            <input
                              type="file"
                              accept="image/*"
                              multiple
                              ref={(el) => { fileInputRefs.current[itemIdx] = el; }}
                              onChange={(e) => handlePhotoUpload(itemIdx, e)}
                              className="sr-only"
                            />
                            <span className="material-symbols-outlined text-[24px] group-hover:scale-110 transition-transform">
                              add_a_photo
                            </span>
                            <span className="text-[10px] font-semibold mt-1">
                              {state.photos.length === 0 ? 'Tải ảnh đối chứng' : 'Thêm ảnh khác'}
                            </span>
                            <span className="text-[9px] text-[#9C9589]">PNG, JPG, HEIC</span>
                          </label>

                          {state.photos.length === 0 && (
                            <div className="col-span-1 sm:col-span-3 p-3.5 rounded-xl border border-dashed border-[#D8D2C6] bg-[#F6F3EE]/50 flex items-center gap-3 text-xs text-[#76726B]">
                              <div className="w-8 h-8 rounded-lg bg-white border border-[#E8E4DC] flex items-center justify-center shrink-0 text-[#22201D]">
                                <span className="material-symbols-outlined text-[18px]">photo_camera</span>
                              </div>
                              <div className="space-y-0.5">
                                <p className="font-bold text-[#22201D]">Chưa có ảnh đối chứng</p>
                                <p className="text-[11px] text-[#76726B] leading-tight">
                                  Bấm ô bên trái để tải lên tối thiểu 3 ảnh các góc cạnh của thiết bị trước khi đóng hộp bàn giao bưu tá.
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 4. Notes */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-[#22201D] flex items-center justify-between">
                          <span>4. Ghi chú gửi Kỹ thuật viên Bench Lab (Nếu có)</span>
                          <span className="text-[10px] text-[#76726B] font-normal">Không bắt buộc</span>
                        </label>
                        <textarea
                          rows={2}
                          value={state.note}
                          onChange={(e) => handleNoteChange(itemIdx, e.target.value)}
                          placeholder="Ví dụ: Thiết bị đã được sạc đầy 100% pin, lens filter đã được lau vi sợi sạch, nắp body và cap sau lens đậy kín..."
                          className="w-full text-xs p-3 rounded-xl bg-[#F6F3EE] text-[#22201D] placeholder-[#76726B]/70 focus:outline-none focus:bg-white focus:shadow-xs transition-all resize-none border border-[#E8E4DC]/80"
                        />
                      </div>
                    </section>
                  );
                }))}

                {/* Step-by-Step Return Packing Guide */}
                <section className="bg-[#F6F3EE] rounded-2xl p-6 shadow-xs space-y-5 border border-[#E8E4DC]/80">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-serif font-bold text-[#22201D]">
                        Quy trình 4 bước đóng gói an toàn trước khi bàn giao
                      </h3>
                      <p className="text-xs text-[#76726B]">
                        Đảm bảo hàng hóa không xê dịch và được bảo hiểm trong quá trình vận chuyển ngược
                      </p>
                    </div>
                    <span className="material-symbols-outlined text-[#9C9589] text-[22px]">inventory_2</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div className="p-3.5 rounded-xl bg-white shadow-2xs space-y-2 relative overflow-hidden border border-[#E8E4DC]/60">
                      <span className="text-[10px] font-mono font-bold text-[#5E6D5B] uppercase">BƯỚC 01</span>
                      <h4 className="font-bold text-[#22201D]">Sắp xếp phụ kiện</h4>
                      <p className="text-[11px] text-[#76726B] leading-relaxed">
                        Đặt phụ kiện, pin sạc, thân máy vào đúng khay mút chống sốc Nanuk. Đóng chặt khóa an toàn.
                      </p>
                    </div>
                    <div className="p-3.5 rounded-xl bg-white shadow-2xs space-y-2 relative overflow-hidden border border-[#E8E4DC]/60">
                      <span className="text-[10px] font-mono font-bold text-[#5E6D5B] uppercase">BƯỚC 02</span>
                      <h4 className="font-bold text-[#22201D]">Dán nhãn vận đơn</h4>
                      <p className="text-[11px] text-[#76726B] leading-relaxed">
                        Airway Bill <span className="font-mono font-semibold">#VN-{cleanOrderCode.replace(/\D/g, '').slice(-6) || '883910'}-RNT</span> có sẵn trong ngăn phụ, dán mặt ngoài hộp.
                      </p>
                    </div>
                    <div className="p-3.5 rounded-xl bg-white shadow-2xs space-y-2 relative overflow-hidden border border-[#E8E4DC]/60">
                      <span className="text-[10px] font-mono font-bold text-[#5E6D5B] uppercase">BƯỚC 03</span>
                      <h4 className="font-bold text-[#22201D]">Khóa chốt niêm phong</h4>
                      <p className="text-[11px] text-[#76726B] leading-relaxed">
                        Luồn dây niêm phong đỏ kèm mã seal qua quai khóa của vali trước khi bàn giao.
                      </p>
                    </div>
                    <div className="p-3.5 rounded-xl bg-white shadow-2xs space-y-2 relative overflow-hidden border border-[#E8E4DC]/60">
                      <span className="text-[10px] font-mono font-bold text-[#5E6D5B] uppercase">BƯỚC 04</span>
                      <h4 className="font-bold text-[#22201D]">Bàn giao &amp; Ký điện tử</h4>
                      <p className="text-[11px] text-[#76726B] leading-relaxed">
                        Quét mã QR cùng bưu tá Viettel Armored Courier tại cửa nhà để kích hoạt biên nhận.
                      </p>
                    </div>
                  </div>
                </section>

                {/* Customer Declaration & Submission Actions */}
                <section className="bg-white rounded-2xl p-6 shadow-xs space-y-6 border border-[#E8E4DC]/80">
                  <div id="confirmCheckboxContainer" className="space-y-2">
                    <label
                      className={`flex items-start gap-3 p-4 rounded-xl cursor-pointer select-none transition-all ${commitmentError
                          ? 'bg-[#FDF2F2] border-2 border-[#D9534F] shadow-sm ring-4 ring-[#D9534F]/10'
                          : 'bg-[#F6F3EE] border border-[#E8E4DC]/60 hover:border-[#1C1A18]/30'
                        }`}
                    >
                      <input
                        type="checkbox"
                        id="confirmCheckbox"
                        checked={confirmCommitment}
                        onChange={(e) => {
                          setConfirmCommitment(e.target.checked);
                          if (e.target.checked) {
                            setCommitmentError(false);
                          }
                        }}
                        className={`mt-0.5 w-4 h-4 rounded shrink-0 cursor-pointer ${commitmentError
                            ? 'border-2 border-[#D9534F] text-[#D9534F] accent-[#D9534F] ring-2 ring-[#D9534F]/40'
                            : 'text-[#22201D] accent-[#22201D]'
                          }`}
                      />
                      <div className="text-xs leading-relaxed">
                        <span className={`font-bold ${commitmentError ? 'text-[#D9534F]' : 'text-[#22201D]'}`}>
                          Cam kết trung thực tình trạng thiết bị:
                        </span>{' '}
                        <span className={commitmentError ? 'text-[#842029]' : 'text-[#22201D]'}>
                          Tôi xác nhận đã kiểm tra kỹ lưỡng, đóng gói đầy đủ toàn bộ phụ kiện theo danh mục bàn giao ban đầu, chụp ảnh hiện trạng thực tế và niêm phong bằng seal đi kèm trước khi bàn giao cho nhân viên giao vận.
                        </span>
                      </div>
                    </label>

                    {commitmentError && (
                      <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#FDF2F2] text-xs font-semibold text-[#D9534F] border border-[#F5C6CB] animate-fadeIn">
                        <span className="material-symbols-outlined text-[16px]">error</span>
                        <span>Vui lòng tích chọn xác nhận cam kết trung thực tình trạng thiết bị trước khi gửi.</span>
                      </div>
                    )}
                  </div>

                  {submitError && (
                    <div className="p-3 rounded-xl bg-[#FDF2F2] border border-[#F5C6CB] text-xs text-[#D9534F] flex items-center gap-2">
                      <span className="material-symbols-outlined text-[16px]">error</span>
                      <span>{submitError}</span>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                    <Link
                      to={`/rent/orders/${cleanOrderCode}`}
                      className="w-full sm:w-auto px-6 py-3 rounded-full bg-[#F6F3EE] hover:bg-[#EFECE6] text-[#22201D] text-xs font-bold transition-all text-center border border-[#E8E4DC]"
                    >
                      Quay lại chi tiết đơn thuê
                    </Link>
                    <button
                      type="button"
                      id="submitReturnBtn"
                      disabled={isSubmitting}
                      onClick={handleSubmitReturn}
                      className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-[#22201D] hover:bg-black text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <>
                          <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                          <span>Đang ghi nhận vận đơn khứ hồi...</span>
                        </>
                      ) : (
                        <>
                          <span>Xác nhận &amp; Gửi yêu cầu hoàn trả toàn bộ</span>
                          <span className="material-symbols-outlined text-[16px] group-hover:translate-x-1 transition-transform">
                            arrow_forward
                          </span>
                        </>
                      )}
                    </button>
                  </div>
                </section>
              </div>

              {/* RIGHT COLUMN: Return Courier Schedule & Financial Escrow Summary (4 cols) */}
              <div className="lg:col-span-4 space-y-6 sticky top-28">
                {/* Courier Pickup Schedule Card */}
                <div className="bg-white rounded-2xl p-5 shadow-xs space-y-4 border border-[#E8E4DC]/80">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-[#76726B]">
                      Lịch lấy hàng tận nơi
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-[#EFECE6] text-[9px] font-bold text-[#22201D] uppercase">
                      White-Glove Pickup
                    </span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-[#F6F3EE] space-y-2 border border-[#E8E4DC]/60">
                    <div className="flex items-center gap-2 text-xs font-bold text-[#22201D]">
                      <span className="material-symbols-outlined text-[18px] text-[#5E6D5B]">local_shipping</span>
                      <span>Bưu tá Nanuk White-Glove Doorstep</span>
                    </div>
                    <div className="text-[11px] text-[#76726B] space-y-1 leading-relaxed">
                      <p>
                        <span className="font-medium text-[#22201D]">Mã vận đơn khứ hồi:</span>{' '}
                        <span className="font-mono text-[#22201D] font-semibold">
                          #VN-{cleanOrderCode.replace(/\D/g, '').slice(-6) || '883910'}-RNT
                        </span>
                      </p>
                      <p>
                        <span className="font-medium text-[#22201D]">Khung giờ lấy hàng:</span> 14:00 - 17:00, Hôm nay
                      </p>
                      <p>
                        <span className="font-medium text-[#22201D]">Địa chỉ lấy:</span> {pickupAddressStr}
                      </p>
                      <p>
                        <span className="font-medium text-[#22201D]">Đơn vị phụ trách:</span> Viettel Armored Secure Logistics
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-[#76726B] bg-[#EFECE6]/50 p-2.5 rounded-xl border border-[#E8E4DC]/40">
                    <span className="material-symbols-outlined text-[16px] text-[#22201D]">contact_phone</span>
                    <span>Bưu tá sẽ gọi trước 30 phút khi đến điểm hẹn.</span>
                  </div>
                </div>

                {/* Financial Escrow Breakdown Card */}
                <div className="bg-white rounded-2xl p-5 shadow-xs space-y-4 border border-[#E8E4DC]/80">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs uppercase font-bold tracking-wider text-[#22201D]">
                      Smart Escrow Hoàn Cọc
                    </h3>
                    <span className="material-symbols-outlined text-[#5E6D5B] text-[18px]">lock</span>
                  </div>
                  <div className="space-y-3 text-xs">
                    {displayItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between pb-2 border-b border-[#F6F3EE]"
                      >
                        <span className="text-[#76726B] truncate max-w-[65%]" title={item.title}>
                          Cọc {item.title}
                        </span>
                        <span className="font-mono font-medium text-[#22201D]">
                          {formatVND(item.depositAmount)}
                        </span>
                      </div>
                    ))}

                    <div className="flex items-center justify-between pb-2 border-b border-[#F6F3EE]">
                      <span className="text-[#76726B]">Phí thuê đã trả</span>
                      <span className="font-mono text-[#76726B]">
                        {formatVND(rentalFeePaid)} (Đã thanh toán)
                      </span>
                    </div>

                    <div className="flex items-center justify-between pb-2 border-b border-[#F6F3EE]">
                      <span className="text-[#76726B]">Phí ship khứ hồi bảo an 2 chiều</span>
                      <span className="text-[#5E6D5B] font-medium">0₫ (Miễn phí hoàn trả)</span>
                    </div>

                    <div className="pt-2 flex items-baseline justify-between">
                      <span className="text-xs font-bold text-[#22201D]">Dự kiến hoàn trả tự động:</span>
                      <span className="text-base font-serif font-bold text-[#5E6D5B] font-mono">
                        {formatVND(totalDeposit)}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-[#F6F3EE] text-[11px] text-[#76726B] space-y-1.5 leading-relaxed border border-[#E8E4DC]/60">
                    <div className="flex items-center gap-1.5 font-bold text-[#22201D] text-[11px]">
                      <span className="material-symbols-outlined text-[14px] text-[#5E6D5B]">verified</span>
                      Quy trình giải tỏa cọc
                    </div>
                    <p>
                      Tiền cọc được khóa độc lập qua ReUse Hub Escrow Vault. Sau khi bưu tá bàn giao tại Bench Lab, chuyên gia sẽ kiểm tra sensor, thấu kính và khung bạt trong vòng 4-24 giờ để hoàn 100% tiền cọc về tài khoản nguồn.
                    </p>
                  </div>
                </div>

                {/* B-Corp & Circular Commitment Badge Card */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-[#EFECE6] via-[#F6F3EE] to-[#EFECE6] shadow-2xs space-y-2 text-center border border-[#E8E4DC]/80">
                  <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[#22201D] text-white text-[12px] font-serif font-bold mx-auto">
                    B
                  </div>
                  <h5 className="text-xs font-serif font-bold text-[#22201D]">
                    B-Corp Circular Certified Archive
                  </h5>
                  <p className="text-[10px] text-[#76726B] leading-relaxed">
                    Mỗi chu trình mượn và hoàn trả chuẩn mực giúp kéo dài vòng đời thiết bị điện tử và giảm 14.8kg CO₂e so với chuỗi mua mới tiêu thụ một lần.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* MODAL XÁC NHẬN NỘP YÊU CẦU HOÀN TRẢ THÀNH CÔNG */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-6 text-center border border-stone-200 animate-scale-up">
            <div className="w-16 h-16 rounded-2xl bg-[#EEF2EC] text-[#4A6B53] flex items-center justify-center mx-auto shadow-xs">
              <span className="material-symbols-outlined text-[36px]">verified</span>
            </div>

            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-[#EAF3FA] text-[#245778]">
                BƯỚC 7/9: TIẾP NHẬN YÊU CẦU HOÀN TRẢ THÀNH CÔNG
              </span>
              <h3 className="font-serif text-2xl font-bold text-stone-900">
                Đã lên lịch thu hồi bưu kiện
              </h3>
              <p className="text-xs text-stone-500 leading-relaxed max-w-md mx-auto">
                Hệ thống lưu ký Smart Escrow đã ghi nhận yêu cầu hoàn trả đơn thuê <strong className="font-mono text-stone-800">#{cleanOrderCode}</strong> cùng ảnh hiện trạng ngoại quan của bạn.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#F6F3EE] text-left text-xs space-y-2 border border-[#E8E4DC]/80">
              <div className="flex items-center justify-between text-stone-600">
                <span>Mã vận đơn khứ hồi:</span>
                <span className="font-mono font-bold text-stone-900">
                  #VN-${cleanOrderCode.replace(/\D/g, '').slice(-6) || '883910'}-RNT
                </span>
              </div>
              <div className="flex items-center justify-between text-stone-600">
                <span>Khung giờ lấy hàng:</span>
                <span className="font-bold text-stone-900">14:00 - 17:00 hôm nay</span>
              </div>
              <div className="flex items-center justify-between text-stone-600">
                <span>Bưu tá phụ trách:</span>
                <span className="font-medium text-stone-900">Nanuk Doorstep / Viettel Armored</span>
              </div>
              <div className="pt-2 border-t border-[#E8E4DC] text-[11px] text-stone-500">
                Bước tiếp theo: <strong>Bước 8 - Trạm kiểm định Bench Lab</strong> đối soát chất lượng &amp; giải tỏa hoàn 100% tiền cọc <strong>{formatVND(totalDeposit)}</strong>.
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => navigate('/rent/orders?tab=RETURNING')}
                className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-[#22201D] hover:bg-black text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">list_alt</span>
                <span>Về Sổ lệnh hoàn trả (Bước 7-8)</span>
              </button>
              <button
                type="button"
                onClick={() => navigate(`/rent/orders/${cleanOrderCode}?status=RETURN_REQUESTED&pickupScheduled=true`)}
                className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-white hover:bg-stone-50 text-stone-800 border border-stone-300 font-semibold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">visibility</span>
                <span>Xem chi tiết tiến trình</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default ReturnRequest;
