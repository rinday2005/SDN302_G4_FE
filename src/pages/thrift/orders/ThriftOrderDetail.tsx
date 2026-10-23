import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { UserSidebar } from '../../../components/layout/UserSidebar';
import {
  getThriftOrderByIdApi,
  cancelThriftOrderApi,
  confirmDeliveredThriftOrderApi,
  disputeThriftOrderApi,
  reviewThriftOrderApi,
  type ThriftOrderApi,
  type ThriftOrderItemApi,
  type ThriftBenchInspectionMetric,
} from '../../../services/thriftOrder.api';
import { redirectToVnPayGateway } from '../../../services/payment.api';
import { resolveCleanAddress } from '../../../utils/address';

interface ThriftItemDetail {
  id: string;
  listingId?: string;
  productName: string;
  price: number;
  quantity: number;
  imageUrl: string;
  condition: string;
  gradeBadge: string;
  vaultOrigin: string;
  warranty: string;
  serialNumber: string;
  certCode: string;
  category?: string;
  itemTotal: number;
}

interface ThriftOrderDetailData {
  id: string;
  orderCode: string;
  rawCode: string;
  status: 'PENDING_PAYMENT' | 'PAID' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'COMPLETED' | 'CANCELLED' | 'DISPUTED';
  statusText: string;
  statusBg: string;
  dotBg: string;
  statusDescription: string;
  createdAt: string;
  items: ThriftItemDetail[];
  itemsSubtotal: number;
  shippingFee: number;
  totalAmount: number;
  trackingCode: string;
  courierName: string;
  escrowStatus: string;
  escrowExpiresAt?: string | null;
  provenanceVaultCertId: string;
  recipientName: string;
  recipientPhone: string;
  shippingAddress: string;
  paymentMethod: string;
  paymentStatus: string;
  transactionCode: string;
  shopName: string;
  shopInitials: string;
  sealCode: string;
  benchInspection: ThriftBenchInspectionMetric[];
  cancelReason?: string;
  disputeReason?: string;
  timeline: Array<{
    status: string;
    title: string;
    description: string;
    timestamp: string;
  }>;
}

export const ThriftOrderDetail: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const { user } = useAuth();

  // Scroll to top
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  // Copy code helper
  const [copiedCode, setCopiedCode] = useState(false);
  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code.replace('#', ''));
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'info' | 'error'>('success');
  const showToast = (msg: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => setToastMessage(null), 4500);
  };

  // Order state
  const [order, setOrder] = useState<ThriftOrderDetailData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [receiptAgree, setReceiptAgree] = useState(false);

  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewHoverRating, setReviewHoverRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewItemTarget, setReviewItemTarget] = useState<string>('all');

  const [isNfcModalOpen, setIsNfcModalOpen] = useState(false);
  const [selectedNfcItem, setSelectedNfcItem] = useState<ThriftItemDetail | null>(null);

  const [isDisputeModalOpen, setIsDisputeModalOpen] = useState(false);
  const [disputeItem, setDisputeItem] = useState('all');
  const [disputeReasonSelect, setDisputeReasonSelect] = useState('Sai lệch tình trạng quang học (có mốc, xước, mù kính)');
  const [disputeDescription, setDisputeDescription] = useState('');

  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelReasonText, setCancelReasonText] = useState('');

  const [isActionSubmitting, setIsActionSubmitting] = useState(false);

  // Quick message state
  const [quickMessageText, setQuickMessageText] = useState('');

  // Currency helper
  const formatCurrency = (val: number | string) => {
    const num = Number(val);
    if (isNaN(num)) return String(val);
    return num.toLocaleString('vi-VN') + ' ₫';
  };

  // Map API response to rich UI data
  const mapApiToDetail = useCallback(
    (raw: ThriftOrderApi): ThriftOrderDetailData => {
      const rawCode = raw.orderCode || 'RH-THF-2025-0814';
      const displayCode = rawCode.startsWith('#') ? rawCode : `#${rawCode}`;
      const cleanId = String(raw._id || rawCode.replace('#', '')).trim();

      const rawCreated = raw.createdAt ? new Date(raw.createdAt) : new Date();
      const dateStr = !isNaN(rawCreated.getTime())
        ? rawCreated.toLocaleString('vi-VN', { dateStyle: 'medium', timeStyle: 'short' })
        : '08/03/2025 · 14:25 ICT';

      const rawStatus = (raw.status || 'PENDING_PAYMENT') as ThriftOrderDetailData['status'];

      let statusText = 'CHỜ THANH TOÁN (15 PHÚT)';
      let statusBg = 'bg-[#FCF5EB] text-[#A6620C] border-[#F2DEBF]';
      let dotBg = 'bg-[#C87A1E] animate-ping';
      let statusDescription =
        'Hiện vật đang được giữ chỗ độc bản trong 15 phút. Vui lòng thanh toán qua Smart Escrow VNPay để khóa giao dịch an toàn.';

      if (rawStatus === 'PAID') {
        statusText = 'ĐÃ THANH TOÁN · NIÊM PHONG SMART ESCROW';
        statusBg = 'bg-brand-sage-light text-brand-sage border-brand-sage/20';
        dotBg = 'bg-brand-sage';
        statusDescription =
          'Thanh toán thành công. Tiền đang được niêm phong an toàn tại Smart Escrow, Atelier Silvergrain đang chuẩn bị thẩm định xuất kho.';
      } else if (rawStatus === 'PROCESSING') {
        statusText = 'ATELIER THẨM ĐỊNH & NIÊM PHONG SÁP';
        statusBg = 'bg-[#EAF3FA] text-[#245778] border-[#CFE4F3]';
        dotBg = 'bg-[#3B6E8C] animate-pulse';
        statusDescription =
          'Atelier đang tiến hành kiểm tra trên băng thử phòng lab (Bench Collimator), tra dầu bảo dưỡng và niêm phong sáp yếm khí.';
      } else if (rawStatus === 'SHIPPED') {
        statusText = 'VẬN CHUYỂN BỌC THÉP NANUK 935';
        statusBg = 'bg-[#EAF3FA] text-[#245778] border-[#CFE4F3]';
        dotBg = 'bg-[#3B6E8C] animate-pulse';
        statusDescription =
          'Bưu tá chuyên trách Viettel Armored Transit đang vận chuyển vali Nanuk bọc thép yếm khí. Toàn trình được bảo hiểm 100%.';
      } else if (rawStatus === 'DELIVERED') {
        statusText = 'ĐÃ GIAO HÀNG · CỬA SỔ ĐỐI KIỂM 72H ĐANG MỞ';
        statusBg = 'bg-[#EAE5DC] text-brand-charcoal border-brand-border';
        dotBg = 'bg-[#1A7F4B] animate-pulse';
        statusDescription =
          'Đã giao hàng tận tay an toàn. Quý khách có trọn vẹn 72 giờ đối kiểm độc lập quang học và cơ khí trước khi Smart Escrow giải ngân.';
      } else if (rawStatus === 'COMPLETED') {
        statusText = 'ĐÃ NGHIỆM THU · CHỨNG THƯ PHẢ HỆ KÍCH HOẠT';
        statusBg = 'bg-brand-charcoal text-[#FBF9F5] border-black';
        dotBg = 'bg-[#1A7F4B]';
        statusDescription =
          'Giao dịch hoàn tất nghiệm thu! Chứng thư số Provenance Vault™ đã được kích hoạt vĩnh viễn trên sổ cái tuần hoàn ReUse Hub.';
      } else if (rawStatus === 'CANCELLED') {
        statusText = 'ĐÃ HỦY ĐƠN HÀNG';
        statusBg = 'bg-[#FDF2F2] text-[#B8382B] border-[#F8C8C8]';
        dotBg = 'bg-[#B8382B]';
        statusDescription = raw.cancelReason ? `Đơn hàng đã hủy: ${raw.cancelReason}` : 'Đơn hàng đã được hủy.';
      } else if (rawStatus === 'DISPUTED') {
        statusText = 'ĐANG TRANH CHẤP · SMART ESCROW ĐÃ ĐÓNG BĂNG';
        statusBg = 'bg-[#FFF3E0] text-[#B8382B] border-[#FFE0B2]';
        dotBg = 'bg-[#B8382B] animate-bounce';
        statusDescription =
          'Smart Escrow đã được đóng băng theo yêu cầu khiếu nại. Chuyên viên trung gian ReUse Hub đang tiến hành đối soát bảo vệ người mua.';
      }

      // Shop Name & Initials
      const shopObj = typeof raw.shopOwnerId === 'object' && raw.shopOwnerId !== null ? raw.shopOwnerId : null;
      const shopName = shopObj?.fullName || 'Atelier Silvergrain Archive (Saigon Vault)';
      const shopInitials = shopName
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0].toUpperCase())
        .join('') || 'SG';

      // Items parsing
      const items: ThriftItemDetail[] = (raw.items || []).map((it: ThriftOrderItemApi, idx: number) => {
        const listing = typeof it.listingId === 'object' && it.listingId !== null ? it.listingId : null;
        const qty = it.quantity || 1;
        const price = it.price || listing?.price || 0;
        const condition = it.condition || listing?.condition || (idx === 0 ? 'Grade 9.8/10 Mint' : 'Grade Pristine 10/10');
        const serialNum = `#${cleanId.slice(-4)}${idx === 0 ? '2481902' : '3188842'}`.slice(-7);
        const certCode = `#PV-${serialNum.slice(-4)}-${idx === 0 ? 'DE' : 'OPT'}`;

        return {
          id: String(listing?._id || it.listingId || `item-${idx}`),
          listingId: typeof it.listingId === 'string' ? it.listingId : listing?._id,
          productName: it.productName || listing?.name || (idx === 0 ? 'Leica M6 Classic 0.72x Rangefinder Body (Black Chrome)' : 'Ống kính Leica Summicron-M 35mm f/2 Version IV "King of Bokeh"'),
          price,
          quantity: qty,
          itemTotal: price * qty,
          imageUrl:
            it.imageUrl ||
            (listing?.images && listing.images.length > 0 ? listing.images[0] : '') ||
            (idx === 0
              ? 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&auto=format&fit=crop&q=60'
              : 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&auto=format&fit=crop&q=60'),
          condition,
          gradeBadge: condition.includes('10') ? 'Grade Pristine 10/10' : 'Grade 9.8/10',
          vaultOrigin: it.vaultOrigin || (listing?.location ? `Curated Archive ${listing.location}` : 'Saigon Vault · 40% RH'),
          warranty: it.warranty || 'Bảo chứng di sản trọn đời',
          serialNumber: `SN: #${serialNum}`,
          certCode,
        };
      });

      // Address resolving
      const resolvedAddress = resolveCleanAddress(raw.shippingAddress, user);
      const recipientName = raw.shippingAddress?.recipientName || user?.fullName || 'Elena Rostova';
      const recipientPhone = raw.shippingAddress?.recipientPhone || user?.phoneNumber || '+84 908 421 892';

      // Dynamic Forensic Bench Metrics based on items
      let benchMetrics: ThriftBenchInspectionMetric[] = [];
      if (Array.isArray(raw.benchInspection) && raw.benchInspection.length > 0) {
        benchMetrics = raw.benchInspection;
      } else if (raw.benchInspection && typeof raw.benchInspection === 'object') {
        const b = raw.benchInspection as unknown as Record<string, string>;
        benchMetrics = [
          {
            metric: 'shutter_speed',
            name: 'Shutter Collimator Test',
            result: 'Đạt Chuẩn',
            value: b.shutterTest || '1/1000s: Sai lệch ±0.02ms',
            note: 'Rèm trập vải lụa nguyên bản đóng mở mượt, không lọt sáng, tốc độ 1s đến 1/1000s chuẩn phòng Lab Leitz.',
            status: 'PASSED',
          },
          {
            metric: 'center_focus_strong',
            name: 'Rangefinder Alignment',
            result: '100% Khớp',
            value: b.alignment || 'Điểm vàng trùng khớp tại ∞ & 1.0m',
            note: 'Không lệch trục đứng (vertical) hoặc trục ngang (horizontal), lăng kính sáng rõ không bong tróc keo Canada Balsam.',
            status: 'PASSED',
          },
          {
            metric: 'filter_tilt_shift',
            name: 'Optical Element Cleanliness',
            result: '9.9 / 10',
            value: b.opticsCleanliness || 'Không rễ tre · Không mốc mù · Lớp phủ Nano vẹn nguyên',
            note: 'Soi đèn UV 365nm và đèn pin cường độ cao xác nhận bề mặt kính trong suốt hoàn hảo, không có vết cọ lau (cleaning marks).',
            status: 'PASSED',
          },
          {
            metric: 'light_mode',
            name: 'Light Meter Circuitry',
            result: 'Chính xác',
            value: b.electronics || 'Cảm biến quang trở silicon nhạy sáng ISO 100',
            note: 'Đèn LED tam giác và chấm tròn đo sáng trong viewfinder phản hồi cực nhạy, khoang pin sạch không rỉ sét axit.',
            status: 'PASSED',
          },
        ];
      }

      if (benchMetrics.length === 0) {
        const hasCamera = items.some((i) => /leica|camera|m6|rangefinder|lens|ống kính/i.test(i.productName));
        const hasFashion = items.some((i) => /áo|jacket|quần|túi|bag|shirt|denim|leather/i.test(i.productName));

        if (hasCamera || items.length === 0) {
          benchMetrics = [
            {
              metric: 'shutter_speed',
              name: 'Shutter Collimator Test',
              result: 'Đạt Chuẩn',
              value: '1/1000s: Sai lệch ±0.02ms',
              note: 'Rèm trập vải lụa nguyên bản đóng mở mượt, không lọt sáng, tốc độ 1s đến 1/1000s chuẩn phòng Lab Leitz.',
              status: 'PASSED',
            },
            {
              metric: 'center_focus_strong',
              name: 'Rangefinder Alignment',
              result: '100% Khớp',
              value: 'Điểm vàng trùng khớp tại ∞ & 1.0m',
              note: 'Không lệch trục đứng (vertical) hoặc trục ngang (horizontal), lăng kính sáng rõ không bong tróc keo Canada Balsam.',
              status: 'PASSED',
            },
            {
              metric: 'filter_tilt_shift',
              name: 'Optical Element Cleanliness',
              result: '9.9 / 10',
              value: 'Không rễ tre · Không mốc mù · Lớp phủ Nano vẹn nguyên',
              note: 'Soi đèn UV 365nm và đèn pin cường độ cao xác nhận bề mặt kính trong suốt hoàn hảo, không có vết cọ lau (cleaning marks).',
              status: 'PASSED',
            },
            {
              metric: 'light_mode',
              name: 'Light Meter Circuitry',
              result: 'Chính xác',
              value: 'Cảm biến quang trở silicon nhạy sáng ISO 100',
              note: 'Đèn LED tam giác và chấm tròn đo sáng trong viewfinder phản hồi cực nhạy, khoang pin sạch không rỉ sét axit.',
              status: 'PASSED',
            },
          ];
        } else if (hasFashion) {
          benchMetrics = [
            {
              metric: 'architecture',
              name: 'Structural Stitching Integrity',
              result: 'Đạt Chuẩn',
              value: 'Mật độ mũi chỉ 12 SPI theo tiêu chuẩn Haute Couture',
              note: 'Đường may đôi gia cường không tưa chỉ, đường chần chắc chắn, phom dáng nguyên bản.',
              status: 'PASSED',
            },
            {
              metric: 'lock',
              name: 'Hardware & Zipper Mechanism',
              result: '100% Chuẩn',
              value: 'Khóa kéo trơn tru, không xước mạ, đóng mở êm',
              note: 'Phụ kiện kim loại mạ vàng không bong tróc, dập logo sắc nét theo chuẩn xuất xưởng.',
              status: 'PASSED',
            },
            {
              metric: 'texture',
              name: 'Fabric Purity & Lining',
              result: '9.9 / 10',
              value: 'Sợi nguyên bản, không bai dão, không ố màu',
              note: 'Đã xử lý giặt hấp yếm khí khử khuẩn sinh học bảo quản di sản.',
              status: 'PASSED',
            },
            {
              metric: 'verified',
              name: 'Authenticity Stamp Hallmark',
              result: 'Đã Xác Thực',
              value: 'Mã dập chìm trùng khớp cơ sở dữ liệu phả hệ',
              note: 'Nhãn thẻ nguyên bản được quét đối chiếu quang học chuẩn xác 100%.',
              status: 'PASSED',
            },
          ];
        } else {
          benchMetrics = [
            {
              metric: 'speed',
              name: 'Circuitry & Voltage Diagnostic',
              result: 'Đạt Chuẩn',
              value: 'Dòng điện ổn định, không đoản mạch',
              note: 'Bo mạch và pin chuẩn dung lượng, kiểm thử tải nhiệt trong 60 phút hoạt động bình thường.',
              status: 'PASSED',
            },
            {
              metric: 'handyman',
              name: 'Mechanical Component Wear',
              result: '100% Khớp',
              value: 'Độ rơ dưới 0.01mm, vận hành êm ái',
              note: 'Khớp nối cơ khí nguyên bản, không dấu hiệu cạy mở trái phép.',
              status: 'PASSED',
            },
            {
              metric: 'diamond',
              name: 'Surface & Enclosure Rating',
              result: '9.8 / 10',
              value: 'Ngoại quan bóng đẹp, không móp méo va đập',
              note: 'Vỏ máy bảo quản nguyên vẹn, góc cạnh không sứt mẻ.',
              status: 'PASSED',
            },
            {
              metric: 'verified_user',
              name: 'Component Authenticity',
              result: 'Chính xác',
              value: 'Linh kiện đồng bộ từ nhà sản xuất',
              note: 'Đã gắn tem niêm phong bảo đảm quyền lợi người mua trong 72h đối kiểm.',
              status: 'PASSED',
            },
          ];
        }
      }

      const sealCode = `#RH-${cleanId.slice(-4).toUpperCase() || '9021'}-SEAL`;

      return {
        id: cleanId,
        orderCode: displayCode,
        rawCode,
        status: rawStatus,
        statusText,
        statusBg,
        dotBg,
        statusDescription,
        createdAt: dateStr,
        items,
        itemsSubtotal: raw.itemsSubtotal || items.reduce((s, i) => s + i.itemTotal, 0),
        shippingFee: raw.shippingFee || 250000,
        totalAmount: raw.totalAmount || (raw.itemsSubtotal || 0) + (raw.shippingFee || 250000),
        trackingCode: raw.trackingCode || `#VN-9021-HN-EXP`,
        courierName: raw.courierName || 'Viettel Armored Transit',
        escrowStatus: raw.escrowStatus || (rawStatus === 'DELIVERED' ? 'HELD_72H' : 'PENDING'),
        escrowExpiresAt: raw.escrowExpiresAt,
        provenanceVaultCertId: raw.provenanceVaultCertId || `#PV-${cleanId.slice(-4).toUpperCase() || '2481'}-DE`,
        recipientName,
        recipientPhone,
        shippingAddress: resolvedAddress,
        paymentMethod: raw.paymentMethod || 'VNPay Gateway (256-bit HSM)',
        paymentStatus: raw.paymentStatus || 'PAID',
        transactionCode: `VNP-TRX-${new Date(rawCreated).toISOString().slice(0, 10).replace(/-/g, '')}-${cleanId.slice(-6).toUpperCase() || '941180'}`,
        shopName,
        shopInitials,
        sealCode,
        benchInspection: benchMetrics,
        cancelReason: raw.cancelReason,
        disputeReason: raw.disputeReason,
        timeline: raw.timeline || [
          {
            status: 'PENDING_PAYMENT',
            title: 'Đã đặt hàng',
            description: 'Hệ thống đã tạo hồ sơ lưu trữ và niêm phong tạm thời hiện vật.',
            timestamp: rawCreated.toISOString(),
          },
        ],
      };
    },
    [user]
  );

  // Fetch Order
  const fetchOrderDetail = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    let loadedOrder: ThriftOrderDetailData | null = null;
    try {
      const res = await getThriftOrderByIdApi(id);
      if (res) {
        loadedOrder = mapApiToDetail(res);
      }
    } catch (err) {
      console.warn('Lỗi khi tải đơn từ API, kiểm tra dữ liệu local:', err);
    }

    if (!loadedOrder) {
      try {
        const uId = user?._id || user?.id;
        const keys = [uId ? `user_thrift_orders_${uId}` : null, 'user_thrift_orders'].filter(Boolean) as string[];
        for (const key of keys) {
          const raw = localStorage.getItem(key);
          if (raw) {
            const list: ThriftOrderApi[] = JSON.parse(raw);
            const found = list.find(
              (o) =>
                o._id === id ||
                o.orderCode === id ||
                o.orderCode?.replace('#', '') === id.replace('#', '')
            );
            if (found) {
              loadedOrder = mapApiToDetail(found);
              break;
            }
          }
        }
      } catch {
        // ignore
      }
    }

    setOrder(loadedOrder);
    setIsLoading(false);
  }, [id, user, mapApiToDetail]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchOrderDetail();
  }, [fetchOrderDetail]);

  // 72h Escrow Audit Countdown logic
  const [secondsLeft, setSecondsLeft] = useState(54 * 3600 + 12 * 60 + 35);
  useEffect(() => {
    if (order?.status === 'DELIVERED') {
      const timer = setInterval(() => {
        setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [order?.status]);

  const countdownText = useMemo(() => {
    const hours = Math.floor(secondsLeft / 3600);
    const mins = Math.floor((secondsLeft % 3600) / 60);
    const secs = secondsLeft % 60;
    return `${hours} giờ ${mins} phút ${secs.toString().padStart(2, '0')} giây`;
  }, [secondsLeft]);

  // Step active calculations
  const currentStep = useMemo(() => {
    if (!order) return 1;
    if (order.status === 'COMPLETED') return 6;
    if (order.status === 'DELIVERED') return 5;
    if (order.status === 'SHIPPED') return 4;
    if (order.status === 'PROCESSING') return 3;
    if (order.status === 'PAID') return 2;
    return 1;
  }, [order]);

  const timelineTrackWidth = useMemo(() => {
    switch (currentStep) {
      case 1:
        return '10%';
      case 2:
        return '30%';
      case 3:
        return '50%';
      case 4:
        return '70%';
      case 5:
        return '85%';
      case 6:
        return '100%';
      default:
        return '10%';
    }
  }, [currentStep]);

  // Actions
  const handleConfirmReceipt = async () => {
    if (!order) return;
    setIsActionSubmitting(true);
    try {
      await confirmDeliveredThriftOrderApi(order.id);
      showToast(
        'Đã nghiệm thu thành công! Quỹ Smart Escrow đã được giải ngân cho Atelier. Chứng thư số Provenance Vault™ đã chuyển sang quyền sở hữu vĩnh viễn.'
      );
      setIsReceiptModalOpen(false);
      fetchOrderDetail();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      showToast(e.response?.data?.message || e.message || 'Không thể xác nhận nghiệm thu.', 'error');
    } finally {
      setIsActionSubmitting(false);
    }
  };

  const handleDisputeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;
    setIsActionSubmitting(true);
    try {
      await disputeThriftOrderApi(order.id, {
        problemItem: disputeItem,
        reason: disputeReasonSelect,
        description: disputeDescription,
      });
      showToast(
        'Yêu cầu khiếu nại đã được ghi nhận. Quỹ Smart Escrow đã tạm dừng giải ngân. Chuyên viên trung gian ReUse Hub sẽ hỗ trợ thu hồi vật phẩm và hoàn tiền 100%.'
      );
      setIsDisputeModalOpen(false);
      fetchOrderDetail();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      showToast(e.response?.data?.message || e.message || 'Không thể gửi khiếu nại.', 'error');
    } finally {
      setIsActionSubmitting(false);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;
    setIsActionSubmitting(true);
    try {
      await reviewThriftOrderApi(order.id, {
        rating: reviewRating,
        comment: reviewComment,
        itemId: reviewItemTarget !== 'all' ? reviewItemTarget : undefined,
      });
      showToast('Cảm ơn bạn! Đánh giá đã được ghi nhận vào hồ sơ di sản của Atelier.');
      setIsReviewModalOpen(false);
      setReviewComment('');
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      showToast(e.response?.data?.message || e.message || 'Không thể gửi đánh giá.', 'error');
    } finally {
      setIsActionSubmitting(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!order) return;
    setIsActionSubmitting(true);
    try {
      await cancelThriftOrderApi(order.id, cancelReasonText || 'Khách hàng yêu cầu hủy đơn');
      showToast('Đã hủy đơn mua THRIFT thành công.');
      setIsCancelModalOpen(false);
      fetchOrderDetail();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      showToast(e.response?.data?.message || e.message || 'Không thể hủy đơn hàng.', 'error');
    } finally {
      setIsActionSubmitting(false);
    }
  };

  const handlePayVNPay = async () => {
    if (!order) return;
    try {
      await redirectToVnPayGateway({
        orderId: order.id,
        orderCode: order.rawCode,
        amount: order.totalAmount,
        type: 'THRIFT',
      });
    } catch (err) {
      console.error(err);
      showToast('Không thể kết nối đến VNPay Gateway. Vui lòng thử lại!', 'error');
    }
  };

  const handleSendQuickMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickMessageText.trim() || !order) return;
    showToast(`Tin nhắn đã gửi đến kỹ thuật viên ${order.shopName}: "${quickMessageText.trim()}"`);
    setQuickMessageText('');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FBF9F5] text-brand-charcoal flex flex-col justify-center items-center font-sans">
        <span className="w-10 h-10 border-3 border-brand-charcoal border-t-transparent rounded-full animate-spin inline-block mb-4" />
        <p className="text-xs font-semibold text-brand-muted">
          Đang truy xuất hồ sơ di sản THRIFT &amp; Smart Escrow...
        </p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-[#FBF9F5] text-brand-charcoal flex flex-col font-sans">
        <div className="max-w-2xl mx-auto py-20 px-4 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-3xl">error_outline</span>
          </div>
          <h2 className="font-serif text-2xl font-bold text-brand-charcoal">
            Không tìm thấy thông tin đơn mua THRIFT
          </h2>
          <p className="text-xs text-brand-muted">
            Mã đơn hàng không tồn tại hoặc bạn không có quyền xem thông tin lưu kho này.
          </p>
          <Link
            to="/thrift/orders"
            className="inline-block mt-3 px-5 py-2.5 rounded-xl bg-brand-charcoal text-white text-xs font-bold uppercase tracking-wider hover:bg-black transition-colors"
          >
            ← Quay lại Sổ lệnh THRIFT
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FBF9F5] text-brand-charcoal antialiased selection:bg-[#E8E2D5]">
      {/* ── TOP BANNER (Circular Escrow Commitment) ── */}
      <div className="bg-brand-charcoal text-[#EBE6DD] text-[11px] sm:text-xs font-medium tracking-wide py-1.5 px-4 text-center border-b border-[#36322D]">
        <span>THUÊ NHỮNG GÌ BẠN CẦN · TÁI SỬ DỤNG NHỮNG GÌ ĐÃ CÓ · BẢO HIỂM HÀNG HÓA MINH BẠCH 100% VỚI SMART ESCROW</span>
      </div>

      {/* ── TOAST NOTIFICATION ── */}
      {toastMessage && (
        <div
          className={`fixed top-6 right-6 z-50 px-5 py-3.5 rounded-xl shadow-2xl flex items-center gap-3 border transition-all animate-fadeIn ${
            toastType === 'error'
              ? 'bg-[#B8382B] text-white border-red-800'
              : 'bg-brand-charcoal text-white border-brand-charcoal/80'
          }`}
        >
          <span className="material-symbols-outlined text-lg text-[#E7C890]">
            {toastType === 'error' ? 'report_problem' : 'verified'}
          </span>
          <p className="text-xs font-semibold max-w-sm">{toastMessage}</p>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-stone-400 hover:text-white ml-2 text-sm"
          >
            ✕
          </button>
        </div>
      )}

      {/* ── MAIN APP CONTAINER (Persistent Left Sidebar + Main Content) ── */}
      <div className="flex-1 max-w-[1520px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 flex gap-8">
        {/* PERSISTENT CUSTOMER SIDEBAR */}
        <aside className="w-64 shrink-0 hidden lg:block">
          <UserSidebar activeKey="thrift-orders" />
        </aside>

        {/* MAIN DASHBOARD CONTENT AREA */}
        <main className="flex-1 min-w-0 space-y-8">
          <div className="flex flex-col w-full">
            {/* BREADCRUMBS & TOP METADATA */}
            <nav className="flex items-center gap-2 text-xs text-brand-muted mb-4 tracking-wide font-sans overflow-x-auto whitespace-nowrap">
              <Link className="hover:text-brand-charcoal transition-colors" to="/">
                Trang chủ
              </Link>
              <span>/</span>
              <Link className="hover:text-brand-charcoal transition-colors" to="/profile">
                Tài khoản
              </Link>
              <span>/</span>
              <Link className="hover:text-brand-charcoal transition-colors" to="/thrift/orders">
                Đơn mua THRIFT
              </Link>
              <span>/</span>
              <span className="text-brand-charcoal font-semibold">Hồ sơ lưu trữ {order.orderCode}</span>
            </nav>

            {/* HEADER & PRIMARY ORDER DOSSIER HERO */}
            <header className="relative bg-white rounded-2xl p-6 sm:p-8 shadow-sm space-y-6 overflow-hidden border border-brand-border/60">
              {/* Subtle luxury provenance watermark graphic */}
              <div className="absolute -right-8 -top-8 w-44 h-44 rounded-full bg-brand-surface opacity-60 pointer-events-none flex items-center justify-center">
                <span className="material-symbols-outlined text-7xl text-brand-taupe/20">verified</span>
              </div>

              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 relative z-10">
                <div className="space-y-2.5 max-w-2xl">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase border ${order.statusBg}`}
                    >
                      <span className={`w-2 h-2 rounded-full ${order.dotBg}`} />
                      {order.statusText}
                    </span>
                    <span className="text-[11px] px-2.5 py-0.5 rounded-md bg-brand-surface text-brand-muted font-medium flex items-center gap-1">
                      Mã lưu trữ: {order.orderCode}
                      <button
                        type="button"
                        onClick={() => handleCopyCode(order.orderCode)}
                        className="hover:text-brand-charcoal ml-1 transition-colors"
                        title="Sao chép mã"
                      >
                        <span className="material-symbols-outlined text-[14px]">
                          {copiedCode ? 'check' : 'content_copy'}
                        </span>
                      </button>
                    </span>
                    <span className="text-[11px] px-2.5 py-0.5 rounded-md bg-brand-sage-light text-brand-sage font-semibold">
                      Bảo chứng Smart Escrow 100%
                    </span>
                  </div>

                  <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-brand-charcoal leading-tight">
                    Hồ sơ lưu trữ &amp; Chi tiết đơn THRIFT {order.orderCode}
                  </h1>

                  <p className="text-xs sm:text-sm text-brand-muted leading-relaxed">
                    Đơn hàng lưu kho di sản gồm{' '}
                    <span className="font-bold text-brand-charcoal">
                      {order.items.length.toString().padStart(2, '0')} hiện vật độc bản
                    </span>{' '}
                    từ <span className="font-bold text-brand-charcoal">{order.shopName}</span>. Tiền thanh toán đang được
                    niêm phong an toàn tại Smart Escrow.
                  </p>
                </div>

                {/* Quick Action CTAs */}
                <div className="flex flex-wrap lg:flex-col sm:items-end gap-2.5 shrink-0">
                  {order.status === 'DELIVERED' && (
                    <>
                      <button
                        type="button"
                        className="px-5 py-2.5 rounded-xl bg-brand-charcoal hover:bg-black text-white text-xs font-semibold tracking-wide transition-all shadow-md hover:shadow-lg flex items-center gap-2 w-full sm:w-auto justify-center cursor-pointer"
                        onClick={() => setIsReceiptModalOpen(true)}
                      >
                        <span className="material-symbols-outlined text-base">check_circle</span>
                        Xác nhận nghiệm thu (Confirm Receipt)
                      </button>
                      <button
                        type="button"
                        className="px-4 py-2 rounded-xl bg-brand-surface hover:bg-brand-sand text-brand-charcoal text-xs font-semibold tracking-wide transition-colors flex items-center gap-2 w-full sm:w-auto justify-center cursor-pointer"
                        onClick={() => {
                          setReviewItemTarget('all');
                          setIsReviewModalOpen(true);
                        }}
                      >
                        <span className="material-symbols-outlined text-base">rate_review</span>
                        Đánh giá hiện vật (Review)
                      </button>
                    </>
                  )}

                  {order.status === 'PENDING_PAYMENT' && (
                    <>
                      <button
                        type="button"
                        onClick={handlePayVNPay}
                        className="px-5 py-2.5 rounded-xl bg-brand-charcoal hover:bg-black text-white text-xs font-bold tracking-wide transition-all shadow-md hover:shadow-lg flex items-center gap-2 w-full sm:w-auto justify-center cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-base">credit_card</span>
                        Thanh toán ngay qua VNPay ({formatCurrency(order.totalAmount)})
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsCancelModalOpen(true)}
                        className="px-4 py-2 rounded-xl bg-[#FDF2F2] hover:bg-[#F8E2E0] text-[#B8382B] text-xs font-semibold transition-colors flex items-center gap-2 w-full sm:w-auto justify-center cursor-pointer"
                      >
                        Hủy đơn mua này
                      </button>
                    </>
                  )}

                  {order.status === 'COMPLETED' && (
                    <button
                      type="button"
                      className="px-5 py-2.5 rounded-xl bg-brand-charcoal hover:bg-black text-white text-xs font-semibold tracking-wide transition-all shadow-md hover:shadow-lg flex items-center gap-2 w-full sm:w-auto justify-center cursor-pointer"
                      onClick={() => {
                        setSelectedNfcItem(order.items[0] || null);
                        setIsNfcModalOpen(true);
                      }}
                    >
                      <span className="material-symbols-outlined text-base text-brand-sage">nfc</span>
                      Xem Chứng thư số Provenance Vault™
                    </button>
                  )}

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Link
                      className="px-3.5 py-2 rounded-xl bg-white hover:bg-brand-surface text-brand-charcoal text-xs font-medium transition-colors shadow-xs border border-brand-border/60 flex items-center gap-1.5 flex-1 justify-center"
                      to={`/chat?orderId=${order.orderCode.replace('#', '')}`}
                    >
                      <span className="material-symbols-outlined text-base text-brand-muted">chat</span>
                      Nhắn tin Atelier
                    </Link>

                    {order.status === 'DELIVERED' && (
                      <button
                        type="button"
                        className="px-3 py-2 rounded-xl bg-[#FBF0EE] hover:bg-[#F8E2E0] text-[#B8382B] text-xs font-medium transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
                        onClick={() => setIsDisputeModalOpen(true)}
                        title="Báo cáo sự cố & Đóng băng Escrow"
                      >
                        <span className="material-symbols-outlined text-base">flag</span>
                        Khiếu nại
                      </button>
                    )}

                    <button
                      type="button"
                      className="p-2 rounded-xl bg-white hover:bg-brand-surface text-brand-charcoal transition-colors shadow-xs border border-brand-border/60 cursor-pointer"
                      onClick={() => window.print()}
                      title="Tải biên lai & Chứng thư số PDF"
                    >
                      <span className="material-symbols-outlined text-base">download</span>
                    </button>
                  </div>
                </div>
              </div>
            </header>

            {/* ── 72-HOUR ACTIVE INSPECTION BANNER (OR STATUS BANNER) ── */}
            {order.status === 'DELIVERED' && (
              <section className="mt-6 bg-[#2B2925] text-[#FBF9F5] rounded-2xl p-5 sm:p-6 shadow-md relative overflow-hidden">
                <div className="absolute -right-12 -bottom-12 w-48 h-48 rounded-full bg-[#3D3A34] opacity-50 blur-xl pointer-events-none" />
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-10">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[#3E3A33] flex items-center justify-center shrink-0 text-[#E7C890]">
                      <span className="material-symbols-outlined text-2xl">hourglass_top</span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h2 className="text-sm font-bold tracking-wide uppercase text-[#E7C890]">
                          Cửa sổ đối kiểm độc lập 72 giờ (Inspection Window)
                        </h2>
                        <span className="text-[10px] bg-[#423C32] text-[#F6E6C5] font-semibold px-2 py-0.5 rounded-full">
                          Smart Escrow Lock
                        </span>
                      </div>
                      <p className="text-xs sm:text-[13px] text-[#D8D2C6] leading-relaxed max-w-3xl">
                        Còn{' '}
                        <span className="font-bold text-white bg-[#3D3A34] px-1.5 py-0.5 rounded tracking-wide font-mono text-sm">
                          {countdownText}
                        </span>{' '}
                        để quý khách kiểm tra cơ học, quang học và thấu kính trước khi hệ thống tự động giải ngân cho
                        Atelier. Nếu có sai lệch mô tả, quý khách được{' '}
                        <span className="text-[#E7C890] font-semibold">bảo lưu 100% tiền mua</span>.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 self-start md:self-center">
                    <button
                      type="button"
                      className="px-4 py-2.5 rounded-xl bg-[#F6F3EE] hover:bg-white text-brand-charcoal text-xs font-bold transition-all shadow-sm flex items-center gap-2 cursor-pointer"
                      onClick={() => setIsReceiptModalOpen(true)}
                    >
                      <span className="material-symbols-outlined text-sm text-[#1A7F4B]">verified</span>
                      Nghiệm thu sớm
                    </button>
                    <button
                      type="button"
                      className="px-3.5 py-2.5 rounded-xl bg-[#3D3A34] hover:bg-[#4E4B43] text-[#FBF9F5] text-xs font-semibold transition-colors cursor-pointer"
                      onClick={() => setIsDisputeModalOpen(true)}
                    >
                      Yêu cầu đối soát
                    </button>
                  </div>
                </div>
              </section>
            )}

            {order.status === 'COMPLETED' && (
              <section className="mt-6 bg-[#1C1A17] text-[#FBF9F5] rounded-2xl p-5 sm:p-6 shadow-md relative overflow-hidden border border-[#D4AF37]/30">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-10">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[#2B2925] flex items-center justify-center shrink-0 text-[#E7C890] border border-[#D4AF37]/40">
                      <span className="material-symbols-outlined text-2xl">verified</span>
                    </div>
                    <div>
                      <h2 className="text-sm font-bold tracking-wide uppercase text-[#E7C890]">
                        Chứng thư Provenance Vault™ đã kích hoạt sở hữu vĩnh viễn
                      </h2>
                      <p className="text-xs text-[#D8D2C6] mt-0.5">
                        Mã phả hệ: <strong className="font-mono text-white">{order.provenanceVaultCertId}</strong> · Smart Escrow đã hoàn tất giải ngân cho Atelier.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedNfcItem(order.items[0] || null);
                      setIsNfcModalOpen(true);
                    }}
                    className="px-4 py-2 rounded-xl bg-[#E7C890] hover:bg-[#F2D7A5] text-brand-charcoal text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer self-start md:self-center"
                  >
                    <span className="material-symbols-outlined text-sm">nfc</span>
                    Xem Chứng thư NFC
                  </button>
                </div>
              </section>
            )}

            {order.status === 'DISPUTED' && (
              <section className="mt-6 bg-[#FDF2F2] text-[#B8382B] rounded-2xl p-5 sm:p-6 border border-[#F8C8C8] shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#F8E2E0] flex items-center justify-center shrink-0 text-[#B8382B]">
                    <span className="material-symbols-outlined text-2xl">report_problem</span>
                  </div>
                  <div className="space-y-1">
                    <h2 className="text-sm font-bold uppercase tracking-wide">
                      Hồ sơ Khiếu nại Đang Mở · Quỹ Escrow Đã Tạm Khóa
                    </h2>
                    <p className="text-xs text-[#7A1D15] leading-relaxed">
                      Lý do: <strong>{order.disputeReason || 'Báo cáo sai lệch tình trạng hiện vật'}</strong>. Quỹ thanh toán{' '}
                      <span className="font-mono font-bold">{formatCurrency(order.totalAmount)}</span> được bảo lưu an toàn.
                      Đội ngũ thẩm định độc lập ReUse Hub đang tiến hành liên hệ xác minh.
                    </p>
                  </div>
                </div>
              </section>
            )}

            {/* 1. ORDER STATUS TIMELINE (Circular Handover & Escrow Lifecycle) */}
            <section className="mt-6 bg-white rounded-2xl p-6 sm:p-7 shadow-sm border border-brand-border/60">
              <div className="flex items-center justify-between pb-5">
                <div>
                  <h3 className="font-serif text-lg font-bold text-brand-charcoal">
                    Quy trình Bàn giao &amp; Ký quỹ Tuần hoàn
                  </h3>
                  <p className="text-xs text-brand-muted">
                    Lộ trình 6 bước xác thực vật thể từ {order.shopName} đến tay Consignee
                  </p>
                </div>
                <span className="text-[11px] font-semibold text-brand-sage bg-brand-sage-light px-2.5 py-1 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-sage" />
                  Giai đoạn {currentStep}: {currentStep === 5 ? 'Mở kiểm tra' : currentStep === 6 ? 'Hoàn tất' : 'Vận hành'}
                </span>
              </div>

              {/* Timeline Progress Bar and Steps */}
              <div className="relative pt-4">
                <div className="hidden lg:grid grid-cols-6 gap-3 relative">
                  {/* Connecting Track Bar behind items */}
                  <div className="absolute top-5 left-8 right-8 h-1 bg-brand-surface z-0">
                    <div
                      className="h-full bg-brand-charcoal transition-all duration-700"
                      style={{ width: timelineTrackWidth }}
                    />
                  </div>

                  {/* Step 1: Created */}
                  <div className="relative z-10 flex flex-col items-center text-center group">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center shadow-xs transition-colors ${
                        currentStep >= 1 ? 'bg-brand-charcoal text-white' : 'bg-brand-surface text-brand-muted'
                      }`}
                    >
                      <span className="material-symbols-outlined text-lg">inventory_2</span>
                    </div>
                    <span className="text-xs font-bold text-brand-charcoal mt-3">Đã đặt hàng</span>
                    <span className="text-[10px] text-brand-muted font-mono mt-0.5">Bước 01</span>
                    <span className="text-[9px] text-[#1A7F4B] font-semibold mt-1 bg-brand-sage-light px-1.5 py-0.5 rounded">
                      Hoàn tất
                    </span>
                  </div>

                  {/* Step 2: Escrow Lock */}
                  <div className="relative z-10 flex flex-col items-center text-center group">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center shadow-xs transition-colors ${
                        currentStep >= 2 ? 'bg-brand-charcoal text-white' : 'bg-brand-surface text-brand-muted'
                      }`}
                    >
                      <span className="material-symbols-outlined text-lg">lock</span>
                    </div>
                    <span className="text-xs font-bold text-brand-charcoal mt-3">Thanh toán Escrow</span>
                    <span className="text-[10px] text-brand-muted font-mono mt-0.5">Bước 02</span>
                    <span className="text-[9px] text-brand-charcoal font-semibold mt-1 bg-brand-sand px-1.5 py-0.5 rounded">
                      VNPay Lock
                    </span>
                  </div>

                  {/* Step 3: Bench-Tested & Sealed */}
                  <div className="relative z-10 flex flex-col items-center text-center group">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center shadow-xs transition-colors ${
                        currentStep >= 3 ? 'bg-brand-charcoal text-white' : 'bg-brand-surface text-brand-muted'
                      }`}
                    >
                      <span className="material-symbols-outlined text-lg">science</span>
                    </div>
                    <span className="text-xs font-bold text-brand-charcoal mt-3">Atelier Thẩm định</span>
                    <span className="text-[10px] text-brand-muted font-mono mt-0.5">Bước 03</span>
                    <span className="text-[9px] text-brand-charcoal font-semibold mt-1 bg-brand-sand px-1.5 py-0.5 rounded">
                      Niêm phong sáp
                    </span>
                  </div>

                  {/* Step 4: Nanuk Transit */}
                  <div className="relative z-10 flex flex-col items-center text-center group">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center shadow-xs transition-colors ${
                        currentStep >= 4 ? 'bg-brand-charcoal text-white' : 'bg-brand-surface text-brand-muted'
                      }`}
                    >
                      <span className="material-symbols-outlined text-lg">local_shipping</span>
                    </div>
                    <span className="text-xs font-bold text-brand-charcoal mt-3">Vận chuyển Nanuk</span>
                    <span className="text-[10px] text-brand-muted font-mono mt-0.5">Bước 04</span>
                    <span className="text-[9px] text-brand-charcoal font-semibold mt-1 bg-brand-sand px-1.5 py-0.5 rounded">
                      Bọc thép Airway
                    </span>
                  </div>

                  {/* Step 5: Delivered & 72h Open */}
                  <div className="relative z-10 flex flex-col items-center text-center group">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center shadow-md transition-all ${
                        currentStep === 5
                          ? 'bg-[#1A7F4B] text-white ring-4 ring-brand-sage-light'
                          : currentStep > 5
                          ? 'bg-brand-charcoal text-white'
                          : 'bg-brand-surface text-brand-muted'
                      }`}
                    >
                      <span className="material-symbols-outlined text-lg">assignment_turned_in</span>
                    </div>
                    <span
                      className={`text-xs font-bold mt-3 ${
                        currentStep === 5 ? 'text-[#1A7F4B]' : 'text-brand-charcoal'
                      }`}
                    >
                      Đã giao &amp; Đối kiểm
                    </span>
                    <span className="text-[10px] text-brand-muted font-mono mt-0.5">Bước 05</span>
                    <span
                      className={`text-[9px] font-bold mt-1 px-2 py-0.5 rounded-full ${
                        currentStep === 5
                          ? 'text-white bg-[#1A7F4B] animate-pulse'
                          : currentStep > 5
                          ? 'text-[#1A7F4B] bg-brand-sage-light'
                          : 'text-brand-muted bg-brand-surface'
                      }`}
                    >
                      {currentStep === 5 ? 'ĐANG MỞ 72H' : currentStep > 5 ? 'Đã duyệt' : 'Chờ giao'}
                    </span>
                  </div>

                  {/* Step 6: Final Escrow Payout */}
                  <div
                    className={`relative z-10 flex flex-col items-center text-center group ${
                      currentStep < 6 ? 'opacity-60' : ''
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center shadow-xs ${
                        currentStep >= 6 ? 'bg-brand-charcoal text-white' : 'bg-brand-surface text-brand-muted'
                      }`}
                    >
                      <span className="material-symbols-outlined text-lg">paid</span>
                    </div>
                    <span className="text-xs font-semibold text-brand-charcoal mt-3">Giải ngân Escrow</span>
                    <span className="text-[10px] text-brand-muted font-mono mt-0.5">Bước 06</span>
                    <span className="text-[9px] text-brand-muted mt-1 bg-brand-surface px-1.5 py-0.5 rounded">
                      {currentStep >= 6 ? 'Đã hoàn tất' : 'Chờ nghiệm thu'}
                    </span>
                  </div>
                </div>

                {/* Mobile Timeline Accordion/List for Small screens */}
                <div className="lg:hidden space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full bg-brand-charcoal text-white flex items-center justify-center shrink-0 text-xs">
                      ✓
                    </div>
                    <div className="flex-1 text-xs">
                      <p className="font-bold text-brand-charcoal">1. Đã đặt hàng &amp; 2. Escrow Lock VNPay</p>
                      <p className="text-[11px] text-brand-muted">
                        Smart Escrow đã khóa {formatCurrency(order.totalAmount)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full bg-brand-charcoal text-white flex items-center justify-center shrink-0 text-xs">
                      ✓
                    </div>
                    <div className="flex-1 text-xs">
                      <p className="font-bold text-brand-charcoal">
                        3. Atelier Thẩm định &amp; 4. Vận chuyển Chuyên trách Nanuk
                      </p>
                      <p className="text-[11px] text-brand-muted">
                        Vận đơn {order.trackingCode} · {order.courierName}
                      </p>
                    </div>
                  </div>
                  <div
                    className={`flex items-start gap-3 p-2.5 rounded-xl ${
                      currentStep === 5 ? 'bg-brand-sage-light/60' : ''
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-full text-white flex items-center justify-center shrink-0 text-xs font-bold ${
                        currentStep >= 5 ? 'bg-[#1A7F4B]' : 'bg-brand-surface text-brand-muted'
                      }`}
                    >
                      5
                    </div>
                    <div className="flex-1 text-xs">
                      <p className="font-bold text-[#1A7F4B]">5. Đã giao hàng &amp; Mở cửa sổ 72h đối kiểm</p>
                      <p className="text-[11px] text-brand-charcoal">
                        {order.status === 'DELIVERED'
                          ? `Còn ${countdownText} để mở đối soát`
                          : 'Cửa sổ nghiệm thu độc lập'}
                      </p>
                    </div>
                  </div>
                  <div className={`flex items-start gap-3 ${currentStep < 6 ? 'opacity-60' : ''}`}>
                    <div className="w-7 h-7 rounded-full bg-brand-surface text-brand-muted flex items-center justify-center shrink-0 text-xs">
                      6
                    </div>
                    <div className="flex-1 text-xs">
                      <p className="font-bold text-brand-charcoal">6. Nghiệm thu hoàn tất &amp; Giải ngân Escrow</p>
                      <p className="text-[11px] text-brand-muted">
                        {currentStep >= 6 ? 'Đã giải phóng quỹ cho Atelier' : 'Chờ xác nhận từ bạn hoặc sau 72h'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* TWO-COLUMN MAIN WORKSPACE */}
            <div className="mt-6 grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
              {/* LEFT 8 COLS: PURCHASED ITEMS & BENCH INSPECTION REPORT */}
              <div className="xl:col-span-8 space-y-6">
                {/* 3. ALL PURCHASED ITEMS IN THIS SINGLE ORDER */}
                <section className="bg-white rounded-2xl p-6 sm:p-7 shadow-sm space-y-6 border border-brand-border/60">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-brand-border/40">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-widest text-brand-muted font-sans">
                          Chi tiết vật phẩm
                        </span>
                        <span className="text-xs bg-brand-surface px-2 py-0.5 rounded text-brand-charcoal font-semibold">
                          {order.items.length.toString().padStart(2, '0')} Món trong đơn
                        </span>
                      </div>
                      <h3 className="font-serif text-xl font-bold text-brand-charcoal mt-1">
                        Danh mục Hiện vật THRIFT đã sở hữu
                      </h3>
                    </div>
                    <span className="text-xs text-brand-muted">Bảo lãnh phả hệ bởi {order.shopName}</span>
                  </div>

                  {/* ITEM CARDS */}
                  <div className="space-y-4">
                    {order.items.map((item, idx) => (
                      <div
                        key={item.id}
                        className="bg-brand-surface/70 rounded-2xl p-5 sm:p-6 transition-all hover:bg-brand-surface border border-brand-border/40"
                      >
                        <div className="flex flex-col md:flex-row gap-5 items-start">
                          {/* Product Photo */}
                          <div className="w-full md:w-44 h-44 rounded-xl overflow-hidden shrink-0 relative bg-brand-sand">
                            <img
                              className="w-full h-full object-cover"
                              src={item.imageUrl}
                              alt={item.productName}
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).src =
                                  'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800&auto=format&fit=crop&q=60';
                              }}
                            />
                            <span
                              className={`absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                idx === 1 ? 'bg-brand-sage text-white' : 'bg-brand-charcoal text-white'
                              }`}
                            >
                              {item.gradeBadge}
                            </span>
                          </div>

                          {/* Product Specs & Provenance Deed */}
                          <div className="flex-1 space-y-3 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase tracking-wider ${
                                  idx === 1 ? 'bg-[#9C5A32] text-white' : 'bg-brand-charcoal text-white'
                                }`}
                              >
                                {idx === 1 ? 'OPTICS & GLASS' : 'ĐỘC BẢN 1-OF-1'}
                              </span>
                              <span className="text-xs font-mono font-semibold text-brand-charcoal">
                                {item.serialNumber}
                              </span>
                              <span className="text-xs text-brand-muted">· {item.vaultOrigin}</span>
                            </div>

                            <h4 className="font-serif text-lg font-bold text-brand-charcoal leading-snug">
                              {item.productName}
                            </h4>

                            <p className="text-xs text-brand-muted leading-relaxed">
                              Đã kiểm định phòng Lab, cơ chế vận hành chuẩn xác, lưu kho chống ẩm 40% RH tại Saigon Vault.
                              Kèm đầy đủ phụ kiện nguyên bản và nắp đậy bảo vệ.
                            </p>

                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                              <span className="text-brand-muted">
                                Thẩm định bởi:{' '}
                                <strong className="text-brand-charcoal font-semibold">{order.shopName}</strong>
                              </span>
                              <span className="text-brand-muted">
                                Chứng thư số:{' '}
                                <strong className="font-mono text-brand-charcoal font-bold">{item.certCode}</strong>
                              </span>
                            </div>

                            <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-brand-border/40">
                              <div>
                                <span className="text-[11px] text-brand-muted uppercase font-medium">
                                  Giá sở hữu vĩnh viễn:
                                </span>
                                <div className="font-serif text-xl font-bold text-brand-charcoal leading-none mt-0.5">
                                  {formatCurrency(item.price)}
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  className="px-3.5 py-1.5 rounded-lg bg-white hover:bg-brand-sand text-brand-charcoal text-xs font-semibold shadow-xs border border-brand-border/60 transition-colors flex items-center gap-1.5 cursor-pointer"
                                  onClick={() => {
                                    setSelectedNfcItem(item);
                                    setIsNfcModalOpen(true);
                                  }}
                                >
                                  <span className="material-symbols-outlined text-sm text-brand-sage">nfc</span>
                                  Xem chứng thư NFC
                                </button>
                                <button
                                  type="button"
                                  className="px-3 py-1.5 rounded-lg bg-brand-charcoal hover:bg-black text-white text-xs font-medium transition-colors flex items-center gap-1 cursor-pointer"
                                  onClick={() => {
                                    setReviewItemTarget(item.id);
                                    setIsReviewModalOpen(true);
                                  }}
                                >
                                  <span className="material-symbols-outlined text-sm">star</span>
                                  Đánh giá
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* 4. PRODUCT FORENSIC BENCH INSPECTION REPORT */}
                <section className="bg-white rounded-2xl p-6 sm:p-7 shadow-sm space-y-5 border border-brand-border/60">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2">
                    <div>
                      <div className="inline-flex items-center gap-1.5 text-xs uppercase font-bold tracking-wider text-brand-sage">
                        <span className="material-symbols-outlined text-sm">verified_user</span>
                        Báo cáo đối kiểm phòng lab độc lập (Forensic Bench Dossier)
                      </div>
                      <h3 className="font-serif text-xl font-bold text-brand-charcoal mt-0.5">
                        Kết quả Đo đạc Kỹ thuật Quang &amp; Cơ học
                      </h3>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-brand-muted bg-brand-surface px-3 py-1.5 rounded-xl border border-brand-border/40">
                      <span className="material-symbols-outlined text-sm text-[#1A7F4B]">qr_code_2</span>
                      <span>
                        Niêm phong: <strong className="font-mono text-brand-charcoal">{order.sealCode}</strong>
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-brand-muted leading-relaxed">
                    Trước khi xuất khỏi kho lưu trữ, các hiện vật cơ khí và quang học được kiểm thử bằng thiết bị chuẩn của
                    xưởng thẩm định {order.shopName}. Số đo được đối chiếu trực tiếp với dung sai nhà sản xuất nguyên bản.
                  </p>

                  {/* Bench Metrics Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    {(Array.isArray(order.benchInspection) ? order.benchInspection : []).map((metric, idx) => (
                      <div key={idx} className="bg-brand-surface p-4 rounded-xl space-y-2 border border-brand-border/30">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-brand-charcoal flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-sm text-brand-sage">{metric.metric}</span>
                            {metric.name}
                          </span>
                          <span className="text-[10px] bg-brand-sage-light text-brand-sage font-bold px-2 py-0.5 rounded">
                            {metric.result}
                          </span>
                        </div>
                        <div className="font-mono text-sm font-bold text-brand-charcoal">{metric.value}</div>
                        <p className="text-[11px] text-brand-muted leading-relaxed">{metric.note}</p>
                      </div>
                    ))}
                  </div>

                  {/* Seal Notice Box */}
                  <div className="p-3.5 rounded-xl bg-brand-sand/60 text-xs text-brand-charcoal flex items-center gap-3 border border-brand-border/40">
                    <span className="material-symbols-outlined text-xl text-[#9C5A32] shrink-0">lock_reset</span>
                    <span className="leading-relaxed">
                      <strong>Lưu ý đối kiểm:</strong> Tem niêm phong yếm khí <em>{order.sealCode}</em> được dán tại
                      khớp ốc hoặc thẻ niêm phong vật thể. Vui lòng giữ nguyên tem trong suốt 72 giờ đối kiểm độc lập để bảo
                      toàn hiệu lực hoàn tiền Escrow 100%.
                    </span>
                  </div>
                </section>

                {/* ATELIER CONVERSATION QUICK DRAWER */}
                <section className="bg-white rounded-2xl p-6 sm:p-7 shadow-sm space-y-4 border border-brand-border/60">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#1A1917] text-[#FBF9F5] flex items-center justify-center font-serif font-bold text-sm">
                        {order.shopInitials}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-brand-charcoal">Trò chuyện với {order.shopName}</h4>
                        <p className="text-[11px] text-brand-muted">
                          Kỹ thuật viên phụ trách: Huỳnh Khắc Minh · Phản hồi trong 5 phút
                        </p>
                      </div>
                    </div>
                    <Link
                      className="text-xs font-semibold text-brand-charcoal hover:underline flex items-center gap-1"
                      to={`/chat?orderId=${order.orderCode.replace('#', '')}`}
                    >
                      Mở cửa sổ Chat đầy đủ
                      <span className="material-symbols-outlined text-sm">open_in_new</span>
                    </Link>
                  </div>

                  <div className="bg-brand-surface p-4 rounded-xl text-xs space-y-2 border border-brand-border/40">
                    <div className="flex items-center justify-between text-brand-muted text-[11px]">
                      <span>Tin nhắn mới nhất từ Atelier:</span>
                      <span>Hôm nay</span>
                    </div>
                    <p className="text-brand-charcoal italic leading-relaxed">
                      "Chào bạn, các hiện vật độc bản trong đơn {order.orderCode} đã được hoàn tất đối kiểm và niêm phong
                      an toàn trong thùng Nanuk 935. Nếu cần hỗ trợ test thông số hoặc đối chiếu phả hệ, cứ nhắn cho tôi
                      tại đây nhé!"
                    </p>
                  </div>

                  <form onSubmit={handleSendQuickMessage} className="flex gap-2">
                    <input
                      className="flex-1 bg-brand-surface rounded-xl px-4 py-2 text-xs text-brand-charcoal placeholder-brand-muted focus:outline-none focus:bg-white transition-all border border-brand-border/40"
                      placeholder="Gửi câu hỏi nhanh cho chuyên viên Atelier..."
                      type="text"
                      value={quickMessageText}
                      onChange={(e) => setQuickMessageText(e.target.value)}
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-brand-charcoal hover:bg-black text-white text-xs font-medium rounded-xl transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <span>Gửi</span>
                      <span className="material-symbols-outlined text-sm">send</span>
                    </button>
                  </form>
                </section>
              </div>

              {/* RIGHT 4 COLS: SETTLEMENT, TRANSIT & PROVENANCE ESCROW */}
              <div className="xl:col-span-4 space-y-6">
                {/* 6. PAYMENT & FINANCIAL SETTLEMENT INFORMATION */}
                <section className="bg-white rounded-2xl p-6 shadow-sm space-y-5 border border-brand-border/60">
                  <div className="flex items-center justify-between pb-3 border-b border-brand-border/40">
                    <h3 className="font-serif text-lg font-bold text-brand-charcoal">Quyết toán Tài chính</h3>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                        order.status === 'PENDING_PAYMENT'
                          ? 'bg-[#FCF5EB] text-[#A6620C]'
                          : 'text-white bg-brand-charcoal'
                      }`}
                    >
                      {order.status === 'PENDING_PAYMENT' ? 'Chờ thanh toán' : 'Đã thanh toán'}
                    </span>
                  </div>

                  {/* Breakdown List */}
                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between items-center text-brand-muted">
                      <span>Tổng tiền hiện vật ({order.items.length.toString().padStart(2, '0')} món THRIFT)</span>
                      <span className="font-mono text-brand-charcoal font-semibold">
                        {formatCurrency(order.itemsSubtotal)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-brand-muted">
                      <span className="flex items-center gap-1">
                        Bưu tá bọc thép bảo hiểm 100%
                        <span
                          className="material-symbols-outlined text-xs text-brand-sage cursor-help"
                          title="Bảo hiểm mất mát hoặc va đập rơi vỡ trong quá trình di chuyển"
                        >
                          info
                        </span>
                      </span>
                      <span className="font-mono text-brand-charcoal font-semibold">
                        {formatCurrency(order.shippingFee)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-brand-muted">
                      <span>Chứng thư số Provenance Vault™</span>
                      <span className="font-mono text-[#1A7F4B] font-semibold">0 ₫ (Được tài trợ)</span>
                    </div>

                    <div className="flex justify-between items-center text-brand-muted">
                      <span>Kiện bảo quản Zero-Waste Crate</span>
                      <span className="font-mono text-[#1A7F4B] font-semibold">0 ₫ (Miễn phí)</span>
                    </div>

                    <div className="pt-3 bg-brand-surface -mx-6 px-6 py-4 rounded-xl space-y-1 border-y border-brand-border/40">
                      <div className="flex justify-between items-baseline">
                        <span className="text-xs uppercase font-bold tracking-wider text-brand-charcoal">
                          TỔNG THANH TOÁN
                        </span>
                        <span className="font-serif text-xl font-bold text-brand-charcoal">
                          {formatCurrency(order.totalAmount)}
                        </span>
                      </div>
                      <p className="text-[10px] text-brand-muted leading-tight">
                        Đã phong tỏa bảo đảm trong <strong className="text-brand-charcoal">Smart Escrow Vault</strong>. Tiền
                        chỉ chuyển cho Atelier sau khi nghiệm thu.
                      </p>
                    </div>
                  </div>

                  {/* Gateway & Transaction Details */}
                  <div className="pt-2 space-y-2 text-[11px] text-brand-muted">
                    <div className="flex justify-between">
                      <span>Phương thức:</span>
                      <span className="font-medium text-brand-charcoal">{order.paymentMethod}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Mã giao dịch:</span>
                      <span className="font-mono font-medium text-brand-charcoal">{order.transactionCode}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Thời gian khóa quỹ:</span>
                      <span className="font-medium text-brand-charcoal">{order.createdAt}</span>
                    </div>
                  </div>

                  {order.status === 'PENDING_PAYMENT' && (
                    <button
                      type="button"
                      onClick={handlePayVNPay}
                      className="w-full py-3 rounded-xl bg-brand-charcoal hover:bg-black text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-base">credit_card</span>
                      THANH TOÁN QUA VNPAY ({formatCurrency(order.totalAmount)})
                    </button>
                  )}

                  <button
                    type="button"
                    className="w-full py-2.5 rounded-xl bg-brand-surface hover:bg-brand-sand text-brand-charcoal text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer border border-brand-border/60"
                    onClick={() => window.print()}
                  >
                    <span className="material-symbols-outlined text-sm">receipt_long</span>
                    Tải hóa đơn VAT &amp; Sao kê lưu ký
                  </button>
                </section>

                {/* 5. SHIPPING ADDRESS & TRANSIT DOSSIER */}
                <section className="bg-white rounded-2xl p-6 shadow-sm space-y-5 border border-brand-border/60">
                  <div className="flex items-center justify-between pb-2 border-b border-brand-border/40">
                    <h3 className="font-serif text-lg font-bold text-brand-charcoal">Hồ sơ Giao nhận</h3>
                    <span className="text-[10px] bg-brand-sage-light text-brand-sage font-bold px-2 py-0.5 rounded">
                      Đã ký nhận
                    </span>
                  </div>

                  {/* Consignee Dossier Card */}
                  <div className="p-4 bg-brand-surface rounded-xl space-y-2 text-xs border border-brand-border/40">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold text-brand-muted tracking-wider">
                        Người nhận (Consignee)
                      </span>
                      <span className="text-[10px] bg-white text-brand-sage px-1.5 py-0.5 rounded font-semibold border border-brand-border/60">
                        KYC Verified
                      </span>
                    </div>
                    <p className="font-bold text-brand-charcoal text-sm">{order.recipientName}</p>
                    <p className="text-brand-muted font-mono">{order.recipientPhone}</p>
                    <p className="text-brand-charcoal leading-relaxed pt-1">{order.shippingAddress}</p>
                  </div>

                  {/* Carrier & Airway Tracking */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-brand-muted">Đơn vị vận chuyển:</span>
                      <span className="font-semibold text-brand-charcoal">{order.courierName}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-brand-muted">Mã vận đơn bọc thép:</span>
                      <span className="font-mono font-bold text-brand-charcoal">{order.trackingCode}</span>
                    </div>

                    {/* Transit History Timeline Mini */}
                    <div className="space-y-2.5 pt-2 text-[11px] border-t border-brand-border/40">
                      <div className="flex gap-2.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#1A7F4B] mt-1 shrink-0" />
                        <div>
                          <p className="font-bold text-brand-charcoal">Giao tận tay người nhận có ký điện tử</p>
                          <p className="text-brand-muted">Bàn giao an toàn tại địa chỉ giao hàng. Khách hàng đã nhận kiện.</p>
                        </div>
                      </div>
                      <div className="flex gap-2.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-brand-taupe mt-1 shrink-0" />
                        <div>
                          <p className="font-semibold text-brand-charcoal">Kiểm định X-ray bảo đảm an toàn</p>
                          <p className="text-brand-muted">Kiện hàng qua soi chiếu an ninh hàng không chuyên trách.</p>
                        </div>
                      </div>
                      <div className="flex gap-2.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-brand-taupe mt-1 shrink-0" />
                        <div>
                          <p className="font-semibold text-brand-charcoal">Xuất kho Nanuk Crate</p>
                          <p className="text-brand-muted">Đóng gói vali Nanuk 935 yếm khí niêm sáp.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* CIRCULAR GUARANTEE BADGE */}
                <div className="bg-gradient-to-br from-[#1E231C] to-[#2B3528] rounded-2xl p-6 text-white space-y-3 shadow-md">
                  <div className="flex items-center gap-2 text-[#C4D9BF]">
                    <span className="material-symbols-outlined text-lg">all_inclusive</span>
                    <span className="text-xs font-bold uppercase tracking-wider">
                      Chính sách Thu mua lại (Buyback Option)
                    </span>
                  </div>
                  <p className="text-xs text-[#E4EDE1] leading-relaxed">
                    Hiện vật trong đơn {order.orderCode} được ReUse Hub bảo đảm cam kết mua lại lên tới{' '}
                    <strong className="text-white font-bold">85% giá trị</strong> bất kỳ lúc nào trong vòng 12 tháng nếu
                    giữ nguyên tình trạng kiểm định.
                  </p>
                  <Link
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-[#E7C890] hover:underline pt-1"
                    to="/how-it-works"
                  >
                    Tìm hiểu cơ chế Circular Buyback
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </Link>
                </div>
              </div>
            </div>

            {/* ── MODAL: CONFIRM RECEIPT (Nghiệm thu & Giải phóng quỹ Smart Escrow) ── */}
            {isReceiptModalOpen && (
              <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-7 shadow-2xl space-y-5 animate-fadeIn border border-brand-border">
                  <div className="flex items-center justify-between pb-2 border-b border-brand-border/50">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-brand-sage-light text-brand-sage flex items-center justify-center">
                        <span className="material-symbols-outlined text-lg">verified</span>
                      </div>
                      <h3 className="font-serif text-lg font-bold text-brand-charcoal">
                        Xác nhận Nghiệm thu Hiện vật
                      </h3>
                    </div>
                    <button
                      type="button"
                      className="text-brand-muted hover:text-brand-charcoal cursor-pointer"
                      onClick={() => setIsReceiptModalOpen(false)}
                    >
                      <span className="material-symbols-outlined text-xl">close</span>
                    </button>
                  </div>

                  <p className="text-xs text-brand-muted leading-relaxed">
                    Bằng việc bấm xác nhận, quý khách đồng ý rằng{' '}
                    <strong>
                      cả {order.items.length.toString().padStart(2, '0')} hiện vật trong đơn
                    </strong>{' '}
                    hoàn toàn đúng với mô tả, cơ chế quang học hoạt động hoàn hảo và tem niêm phong còn nguyên vẹn.
                  </p>

                  <div className="bg-brand-surface p-4 rounded-xl text-xs space-y-2 border border-brand-border/50">
                    <div className="flex justify-between font-semibold text-brand-charcoal">
                      <span>Giải phóng quỹ Smart Escrow:</span>
                      <span className="font-mono text-sm">{formatCurrency(order.itemsSubtotal)}</span>
                    </div>
                    <p className="text-[11px] text-brand-muted leading-relaxed">
                      Quỹ thanh toán sẽ được hệ thống tự động giải ngân trực tiếp cho{' '}
                      <strong className="text-brand-charcoal">{order.shopName}</strong>. Sau hành động này, khiếu nại hoàn
                      tiền sẽ chấm dứt.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      className="rounded text-brand-charcoal focus:ring-0 cursor-pointer"
                      id="terms-agree"
                      type="checkbox"
                      checked={receiptAgree}
                      onChange={(e) => setReceiptAgree(e.target.checked)}
                    />
                    <label className="text-xs text-brand-charcoal cursor-pointer" htmlFor="terms-agree">
                      Tôi đã kiểm tra kỹ thấu kính, ngoại quan và cơ chế vận hành trên thực tế.
                    </label>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      className="flex-1 py-2.5 rounded-xl bg-brand-surface hover:bg-brand-sand text-brand-charcoal text-xs font-semibold transition-colors cursor-pointer border border-brand-border/60"
                      onClick={() => setIsReceiptModalOpen(false)}
                    >
                      Để tôi kiểm tra thêm
                    </button>
                    <button
                      type="button"
                      disabled={isActionSubmitting || !receiptAgree}
                      className="flex-1 py-2.5 rounded-xl bg-brand-charcoal hover:bg-black text-white text-xs font-bold transition-all shadow-md cursor-pointer disabled:opacity-50"
                      onClick={handleConfirmReceipt}
                    >
                      {isActionSubmitting ? 'Đang giải ngân...' : 'Xác nhận Giải ngân Escrow'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ── MODAL: REVIEW PRODUCTS (Đánh giá hiện vật & Atelier) ── */}
            {isReviewModalOpen && (
              <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-7 shadow-2xl space-y-5 animate-fadeIn border border-brand-border">
                  <div className="flex items-center justify-between pb-2 border-b border-brand-border/50">
                    <div>
                      <h3 className="font-serif text-lg font-bold text-brand-charcoal">
                        Đánh giá Hiện vật &amp; Atelier
                      </h3>
                      <p className="text-xs text-brand-muted">Đóng góp phản hồi vào hồ sơ phả hệ công khai</p>
                    </div>
                    <button
                      type="button"
                      className="text-brand-muted hover:text-brand-charcoal cursor-pointer"
                      onClick={() => setIsReviewModalOpen(false)}
                    >
                      <span className="material-symbols-outlined text-xl">close</span>
                    </button>
                  </div>

                  <form onSubmit={handleReviewSubmit} className="space-y-4 text-xs">
                    {order.items.length > 1 && (
                      <div>
                        <label className="block font-semibold text-brand-charcoal mb-1">Hiện vật muốn đánh giá:</label>
                        <select
                          value={reviewItemTarget}
                          onChange={(e) => setReviewItemTarget(e.target.value)}
                          className="w-full bg-brand-surface rounded-xl p-2.5 text-xs text-brand-charcoal focus:outline-none border border-brand-border/60"
                        >
                          <option value="all">Toàn bộ đơn hàng ({order.items.length} hiện vật)</option>
                          {order.items.map((i) => (
                            <option key={i.id} value={i.id}>
                              {i.productName} ({i.serialNumber})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div>
                      <label className="block font-semibold text-brand-charcoal mb-1.5">
                        Mức độ chuẩn xác so với mô tả thẩm định:
                      </label>
                      <div className="flex items-center gap-1.5 text-amber-500 text-2xl cursor-pointer">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span
                            key={star}
                            className="material-symbols-outlined transition-transform hover:scale-110"
                            style={{
                              fontVariationSettings: `'FILL' ${
                                (reviewHoverRating || reviewRating) >= star ? 1 : 0
                              }`,
                            }}
                            onMouseEnter={() => setReviewHoverRating(star)}
                            onMouseLeave={() => setReviewHoverRating(0)}
                            onClick={() => setReviewRating(star)}
                          >
                            star
                          </span>
                        ))}
                        <span className="text-xs font-bold text-brand-charcoal ml-2">
                          {reviewRating}.0 / 5.0 (
                          {reviewRating === 5
                            ? 'Pristine'
                            : reviewRating === 4
                            ? 'Xuất sắc'
                            : reviewRating === 3
                            ? 'Bình thường'
                            : 'Cần cải thiện'}
                          )
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold text-brand-charcoal mb-1">
                        Cảm nhận thực tế (Quang học, cơ khí, ngoại quan):
                      </label>
                      <textarea
                        className="w-full bg-brand-surface rounded-xl p-3 text-xs text-brand-charcoal placeholder-brand-muted focus:outline-none focus:bg-white transition-all border border-brand-border/60"
                        placeholder="Ví dụ: Thân máy đẹp hơn ảnh chụp, tốc 1/1000s chính xác, lá khẩu Summicron sạch không một giọt dầu..."
                        rows={3}
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        required
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-brand-charcoal mb-1">
                        Ảnh thực tế khi mở hộp (Unboxing Verification):
                      </label>
                      <div
                        className="border-2 border-dashed border-brand-border rounded-xl p-4 text-center cursor-pointer hover:bg-brand-surface transition-colors"
                        onClick={() => showToast('Đã đính kèm ảnh kiểm định thực tế.')}
                      >
                        <span className="material-symbols-outlined text-2xl text-brand-muted">add_photo_alternate</span>
                        <p className="text-[11px] text-brand-muted mt-1">
                          Nhấp hoặc kéo thả hình ảnh chi tiết thân máy / thấu kính
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        className="flex-1 py-2.5 rounded-xl bg-brand-surface hover:bg-brand-sand text-brand-charcoal text-xs font-semibold transition-colors cursor-pointer border border-brand-border/60"
                        onClick={() => setIsReviewModalOpen(false)}
                      >
                        Hủy bỏ
                      </button>
                      <button
                        type="submit"
                        disabled={isActionSubmitting}
                        className="flex-1 py-2.5 rounded-xl bg-brand-charcoal hover:bg-black text-white text-xs font-bold transition-all shadow-md cursor-pointer disabled:opacity-50"
                      >
                        {isActionSubmitting ? 'Đang gửi...' : 'Đăng đánh giá'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* ── MODAL: PROVENANCE DEED NFC VIEWER ── */}
            {isNfcModalOpen && (
              <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-fadeIn border border-brand-border">
                  <div className="flex items-center justify-between pb-2 border-b border-brand-border/50">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-xl text-brand-sage">nfc</span>
                      <h3 className="font-serif text-lg font-bold text-brand-charcoal">Chứng thư Phả hệ Số NFC</h3>
                    </div>
                    <button
                      type="button"
                      className="text-brand-muted hover:text-brand-charcoal cursor-pointer"
                      onClick={() => setIsNfcModalOpen(false)}
                    >
                      <span className="material-symbols-outlined text-xl">close</span>
                    </button>
                  </div>

                  <div className="p-5 rounded-2xl bg-gradient-to-b from-[#2B2925] to-[#1C1A17] text-white text-center space-y-3 relative overflow-hidden border border-[#D4AF37]/30">
                    <div className="text-[9px] uppercase tracking-widest text-[#D4AF37] font-bold">
                      REUSE HUB PROVENANCE VAULT™
                    </div>
                    <div className="w-16 h-16 mx-auto rounded-full bg-white/10 flex items-center justify-center border border-[#D4AF37]/30">
                      <span className="material-symbols-outlined text-3xl text-[#E7C890]">verified</span>
                    </div>
                    <div className="space-y-0.5">
                      <p className="font-serif text-base font-bold text-[#E7C890]">
                        Mã phả hệ: {selectedNfcItem?.certCode || order.provenanceVaultCertId}
                      </p>
                      <p className="text-[11px] text-[#C2BCB3]">
                        {selectedNfcItem?.productName || order.items[0]?.productName} ·{' '}
                        {selectedNfcItem?.serialNumber || order.items[0]?.serialNumber}
                      </p>
                    </div>
                    <div className="pt-2 text-[10px] text-[#A69F93] border-t border-white/10 text-left space-y-1">
                      <p>
                        • Chủ sở hữu hiện tại: <strong>{order.recipientName}</strong>
                      </p>
                      <p>
                        • Khởi tạo lưu kho: <strong>{order.shopName}</strong>
                      </p>
                      <p>
                        • Chữ ký mã hóa: <code className="font-mono text-[#E7C890]">SHA256: 8fa9..11c2</code>
                      </p>
                    </div>
                  </div>

                  <p className="text-[11px] text-brand-muted text-center leading-relaxed">
                    Chạm điện thoại có hỗ trợ NFC vào tem sáp ở mặt đáy kiện để xác thực bản quyền số trên sổ cái tuần hoàn
                    ReUse Hub.
                  </p>

                  <button
                    type="button"
                    className="w-full py-2.5 rounded-xl bg-brand-charcoal text-white text-xs font-semibold hover:bg-black transition-colors cursor-pointer"
                    onClick={() => setIsNfcModalOpen(false)}
                  >
                    Đóng cửa sổ
                  </button>
                </div>
              </div>
            )}

            {/* ── MODAL: DISPUTE ESCROW / REPORT PROBLEM ── */}
            {isDisputeModalOpen && (
              <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-fadeIn border border-brand-border">
                  <div className="flex items-center justify-between pb-2 border-b border-brand-border/50">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-xl text-[#B8382B]">report_problem</span>
                      <h3 className="font-serif text-lg font-bold text-brand-charcoal">
                        Mở Hồ sơ Tranh chấp &amp; Đóng băng Escrow
                      </h3>
                    </div>
                    <button
                      type="button"
                      className="text-brand-muted hover:text-brand-charcoal cursor-pointer"
                      onClick={() => setIsDisputeModalOpen(false)}
                    >
                      <span className="material-symbols-outlined text-xl">close</span>
                    </button>
                  </div>

                  <p className="text-xs text-brand-muted leading-relaxed">
                    Nếu sản phẩm bị lỗi ẩn (mốc quang học không công bố, kẹt tốc màn trập, móp vỡ do vận chuyển), bạn có
                    quyền đóng băng tiền thanh toán ngay lập tức.
                  </p>

                  <form onSubmit={handleDisputeSubmit} className="space-y-3 text-xs">
                    <div>
                      <label className="block font-semibold text-brand-charcoal mb-1">Món đồ gặp vấn đề:</label>
                      <select
                        className="w-full bg-brand-surface rounded-xl p-2.5 text-xs text-brand-charcoal focus:outline-none border border-brand-border/60"
                        value={disputeItem}
                        onChange={(e) => setDisputeItem(e.target.value)}
                      >
                        <option value="all">Toàn bộ hiện vật trong đơn / Vấn đề kiện Nanuk</option>
                        {order.items.map((i) => (
                          <option key={i.id} value={i.productName}>
                            {i.productName} ({i.serialNumber})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-brand-charcoal mb-1">Lý do khiếu nại:</label>
                      <select
                        className="w-full bg-brand-surface rounded-xl p-2.5 text-xs text-brand-charcoal focus:outline-none border border-brand-border/60"
                        value={disputeReasonSelect}
                        onChange={(e) => setDisputeReasonSelect(e.target.value)}
                      >
                        <option>Sai lệch tình trạng quang học (có mốc, xước, mù kính)</option>
                        <option>Cơ chế đo sáng hoặc rèm trập sai lệch ngoài chuẩn lab</option>
                        <option>Tem niêm phong có dấu hiệu bị rách hoặc can thiệp</option>
                        <option>Khác (mô tả chi tiết bên dưới)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-brand-charcoal mb-1">
                        Mô tả sự cố &amp; Bằng chứng hình ảnh/video:
                      </label>
                      <textarea
                        className="w-full bg-brand-surface rounded-xl p-2.5 text-xs text-brand-charcoal focus:outline-none border border-brand-border/60"
                        placeholder="Mô tả hiện tượng lỗi quan sát được trong 72h đối kiểm..."
                        rows={3}
                        value={disputeDescription}
                        onChange={(e) => setDisputeDescription(e.target.value)}
                        required
                      />
                    </div>

                    <div className="p-3 bg-[#FDF2F2] rounded-xl text-[11px] text-[#B8382B] space-y-1 border border-[#F8C8C8]">
                      <p className="font-bold">Hành động bảo vệ người mua:</p>
                      <p>
                        Quỹ {formatCurrency(order.totalAmount)} sẽ bị tạm dừng giải ngân. Chuyên viên trung gian ReUse
                        Hub sẽ hỗ trợ thu hồi vật phẩm và hoàn tiền 100%.
                      </p>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        className="flex-1 py-2.5 rounded-xl bg-brand-surface hover:bg-brand-sand text-brand-charcoal text-xs font-semibold transition-colors cursor-pointer border border-brand-border/60"
                        onClick={() => setIsDisputeModalOpen(false)}
                      >
                        Quay lại
                      </button>
                      <button
                        type="submit"
                        disabled={isActionSubmitting}
                        className="flex-1 py-2.5 rounded-xl bg-[#B8382B] hover:bg-[#9E2E23] text-white text-xs font-bold transition-all shadow-md cursor-pointer disabled:opacity-50"
                      >
                        {isActionSubmitting ? 'Đang gửi...' : 'Đóng băng Quỹ Escrow'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* ── MODAL: CANCEL ORDER (Cho đơn PENDING_PAYMENT) ── */}
            {isCancelModalOpen && (
              <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-fadeIn border border-brand-border">
                  <div className="flex items-center justify-between pb-2 border-b border-brand-border/50">
                    <h3 className="font-serif text-lg font-bold text-brand-charcoal">Hủy Đơn Mua THRIFT</h3>
                    <button
                      type="button"
                      className="text-brand-muted hover:text-brand-charcoal cursor-pointer"
                      onClick={() => setIsCancelModalOpen(false)}
                    >
                      <span className="material-symbols-outlined text-xl">close</span>
                    </button>
                  </div>
                  <p className="text-xs text-brand-muted">
                    Hiện vật độc bản đang giữ chỗ sẽ được mở lại cho khách hàng khác trên sàn THRIFT.
                  </p>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-brand-charcoal block">Lý do hủy đơn:</label>
                    <textarea
                      value={cancelReasonText}
                      onChange={(e) => setCancelReasonText(e.target.value)}
                      placeholder="Nhập lý do..."
                      rows={3}
                      className="w-full bg-brand-surface rounded-xl p-3 text-xs border border-brand-border/60 focus:outline-none"
                    />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      className="flex-1 py-2.5 rounded-xl bg-brand-surface hover:bg-brand-sand text-brand-charcoal text-xs font-semibold transition-colors cursor-pointer border border-brand-border/60"
                      onClick={() => setIsCancelModalOpen(false)}
                    >
                      Đóng
                    </button>
                    <button
                      type="button"
                      disabled={isActionSubmitting}
                      onClick={handleCancelOrder}
                      className="flex-1 py-2.5 rounded-xl bg-[#B8382B] hover:bg-[#9E2E23] text-white text-xs font-bold transition-all shadow-md cursor-pointer disabled:opacity-50"
                    >
                      {isActionSubmitting ? 'Đang hủy...' : 'Xác nhận hủy'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default ThriftOrderDetail;
