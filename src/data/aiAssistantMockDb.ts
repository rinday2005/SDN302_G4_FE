import type { ShopProductItem } from '../context/ShopContext';

export interface AIProductRecommendation {
  id: string;
  sku: string;
  name: string;
  type: 'RENT' | 'THRIFT';
  category: string;
  brand: string;
  image: string;
  pricePerDay?: number;
  depositAmount?: number;
  thriftPrice?: number;
  originalRetailPrice?: number;
  conditionGrade: string;
  budgetTag: string;
  calculatedDays?: number;
  calculatedTotalRent?: number;
  location: string;
  highlights: string[];
  pros: string[];
  cons: string[];
  detailUrl: string;
}

export interface AIComparisonTable {
  title: string;
  leftTitle: string;
  rightTitle: string;
  rows: {
    criteria: string;
    leftValue: string;
    rightValue: string;
  }[];
  verdict: string;
}

export interface AICostBreakdown {
  title: string;
  productName: string;
  days: number;
  dailyRate: number;
  rentalSubtotal: number;
  escrowDeposit: number;
  shippingFee: number;
  totalUpfront: number;
  refundableAmount: number;
  notes: string[];
}

export interface AIOrderSummaryCard {
  orderCode: string;
  productName: string;
  type: 'RENT' | 'THRIFT';
  statusLabel: string;
  depositAmount: number;
  escrowStatus: string;
  expectedRefundNote: string;
  detailUrl: string;
}

export interface AIMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  bannerTitle?: string;
  bannerSubtitle?: string;
  recommendations?: AIProductRecommendation[];
  comparison?: AIComparisonTable;
  costBreakdown?: AICostBreakdown;
  orderSummaries?: AIOrderSummaryCard[];
  quickFollowUps?: string[];
}

export interface AIConversationSession {
  id: string;
  title: string;
  updatedAt: string;
  messages: AIMessage[];
}

export interface UserAIPreferences {
  favoriteCategories: string[];
  maxDailyRentBudget: number;
  preferredLocation: string;
  travelDaysDefault: number;
}

/**
 * DB MẪU CHUẨN CHO REUSE HUB AI SHOPPING ASSISTANT
 * (Sau này Backend chỉ cần trả về đúng cấu trúc JSON tương đương)
 */
export const AI_MOCK_PRODUCTS_DB: AIProductRecommendation[] = [
  {
    id: 'CAN-EOS-M50',
    sku: 'CAN-EOS-M50',
    name: 'Canon EOS M50',
    type: 'RENT',
    category: 'Máy ảnh Mirrorless Du lịch',
    brand: 'Canon',
    image:
      'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=600&q=80',
    pricePerDay: 250000,
    depositAmount: 3500000,
    originalRetailPrice: 14500000,
    conditionGrade: 'Grade A+ (99%)',
    budgetTag: 'Phù hợp ngân sách',
    calculatedDays: 4,
    calculatedTotalRent: 1000000,
    location: 'Đà Nẵng',
    highlights: [
      'Gọn nhẹ 390g, màn hình xoay lật cảm ứng cực tiện đi du lịch',
      'Dual Pixel CMOS AF lấy nét mắt nhanh, quay 4K & FullHD 60fps',
      'Kèm 2 pin LP-E12, thẻ nhớ 64GB và túi chống sốc',
    ],
    pros: [
      'Màu da hồng hào tự nhiên đặc trưng Canon, không cần hậu kỳ nhiều',
      'Màn hình xoay lật 180 độ rất hợp chụp selfie và vlog du lịch',
      'Giá thuê tiết kiệm nhất phân khúc (250.000đ/ngày)',
    ],
    cons: [
      'Quay 4K bị crop nhẹ khung hình',
      'Thời lượng pin trung bình (~250 tấm/pin, đã kèm 2 pin dự phòng)',
    ],
    detailUrl: '/rent/products/CAN-EOS-M50',
  },
  {
    id: 'SNY-A6000-KIT',
    sku: 'SNY-A6000-KIT',
    name: 'Sony A6000',
    type: 'RENT',
    category: 'Máy ảnh Mirrorless Du lịch',
    brand: 'Sony',
    image:
      'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?auto=format&fit=crop&w=600&q=80',
    pricePerDay: 280000,
    depositAmount: 3800000,
    originalRetailPrice: 15900000,
    conditionGrade: 'Grade A (98%)',
    budgetTag: 'Phù hợp ngân sách',
    calculatedDays: 4,
    calculatedTotalRent: 1120000,
    location: 'TP. Hồ Chí Minh',
    highlights: [
      'Cảm biến APS-C 24.3MP sắc nét, chụp liên tiếp 11fps bắt khoảnh khắc',
      'Lấy nét 179 điểm фа cực nhanh 0.06 giây',
      'Đi kèm ống kính kit 16-50mm OSS nhỏ gọn bỏ vừa túi áo khoác',
    ],
    pros: [
      'Tốc độ lấy nét và chụp liên tiếp 11fps vượt trội khi chụp chuyển động',
      'Độ chi tiết ảnh 24.3MP và dải tương phản Dynamic Range rất rộng',
      'Thân máy kim loại chắc chắn, nhỏ gọn chuẩn street photography',
    ],
    cons: [
      'Màn hình chỉ lật nghiêng, không xoay 180 độ ra trước như Canon M50',
      'Menu Sony hơi nhiều tùy chỉnh với người mới cầm máy lần đầu',
    ],
    detailUrl: '/rent/products/SNY-A6000-KIT',
  },
  {
    id: 'FUJI-XT200-VLOG',
    sku: 'FUJI-XT200-VLOG',
    name: 'Fujifilm X-T200 + XC 15-45mm OIS PZ',
    type: 'RENT',
    category: 'Máy ảnh Mirrorless Du lịch',
    brand: 'Fujifilm',
    image:
      'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?auto=format&fit=crop&w=600&q=80',
    pricePerDay: 290000,
    depositAmount: 4000000,
    originalRetailPrice: 16500000,
    conditionGrade: 'Grade A+ (99%)',
    budgetTag: 'Phù hợp ngân sách',
    calculatedDays: 4,
    calculatedTotalRent: 1160000,
    location: 'Hà Nội',
    highlights: [
      'Giả lập màu phim Fujifilm (Classic Chrome, Astia) chụp phát ăn ngay',
      'Thiết kế hoài cổ sang trọng, màn hình cảm ứng tỉ lệ 16:9 lớn',
      'Trọng lượng siêu nhẹ 370g kèm chống rung quang học OIS',
    ],
    pros: [
      'Có sẵn bộ lọc màu Film Simulation độc quyền của Fujifilm',
      'Ngoại hình retro đẹp như một món phụ kiện thời trang khi đi du lịch',
    ],
    cons: [
      'Ống kính zoom điện tử PZ cần làm quen thao tác xoay nhẹ',
    ],
    detailUrl: '/rent/products/FUJI-XT200-VLOG',
  },
  {
    id: 'HBL-907X-50C',
    sku: 'HBL-907X-50C',
    name: 'Hasselblad 907X 50C + Lens XCD 45mm f/4 P Kit',
    type: 'RENT',
    category: 'Máy ảnh Medium Format Digital',
    brand: 'Hasselblad',
    image:
      'https://images.unsplash.com/photo-1516724562728-afc824a36e84?auto=format&fit=crop&w=600&q=80',
    pricePerDay: 450000,
    depositAmount: 16000000,
    originalRetailPrice: 145000000,
    conditionGrade: 'Grade S (99.5%)',
    budgetTag: 'Flagship Studio',
    calculatedDays: 4,
    calculatedTotalRent: 1800000,
    location: 'Đà Nẵng',
    highlights: [
      'Cảm biến Medium Format 50MP chuẩn màu 16-bit Hasselblad Natural Colour',
      'Kèm vali chống sốc Nanuk 910 đối kiểm 3 góc CLA',
    ],
    pros: [
      'Chất lượng hình ảnh Medium Format đỉnh cao thế giới',
      'Thiết kế modular lịch lãm, lá khẩu trung tâm đồng bộ flash 1/2000s',
    ],
    cons: [
      'Tiền cọc bảo chứng cao (16.000.000đ) và phù hợp chụp thương mại/nghệ thuật',
    ],
    detailUrl: '/rent/products/HBL-907X-50C',
  },
  {
    id: 'DRESS-LUX-GOLD-01',
    sku: 'DRESS-LUX-GOLD-01',
    name: 'Đầm Dạ Hội Lụa Satin Champagne Đính Pha Lê Swarovski',
    type: 'RENT',
    category: 'Trang phục Dạ hội & Sự kiện',
    brand: 'Atelier ReUse Couture',
    image: '/images/partydress4.jpg',
    pricePerDay: 220000,
    depositAmount: 1200000,
    originalRetailPrice: 6800000,
    conditionGrade: 'Chuẩn giặt hấp Ozone 99%',
    budgetTag: 'Phù hợp ngân sách',
    calculatedDays: 3,
    calculatedTotalRent: 660000,
    location: 'Đà Nẵng',
    highlights: [
      'Đã khử khuẩn bằng công nghệ Ozone và niêm phong túi lụa trước khi giao',
      'Kèm dịch vụ chỉnh eo tạm thời miễn phí theo số đo khách thuê',
    ],
    pros: [
      'Tiết kiệm 90% so với mua đứt cho 1 đêm tiệc Gala/Cưới',
      'Không tốn chi phí giặt hấp chuyên sâu sau khi mặc',
    ],
    cons: [
      'Cần tránh làm vương rượu vang đỏ hoặc hóa chất khó tẩy lên lụa',
    ],
    detailUrl: '/rent',
  },
  {
    id: 'THRIFT-CANON-G7X2',
    sku: 'THRIFT-CANON-G7X2',
    name: 'Máy ảnh Compact Canon PowerShot G7 X Mark II (Thanh lý Kho Rent)',
    type: 'THRIFT',
    category: 'Máy ảnh Compact Vlog',
    brand: 'Canon',
    image:
      'https://images.unsplash.com/photo-1510127034890-ba27508e9f1c?auto=format&fit=crop&w=600&q=80',
    thriftPrice: 7800000,
    originalRetailPrice: 14900000,
    conditionGrade: 'Second-Life Grade A (95%)',
    budgetTag: 'Tiết kiệm 48% so với mua mới',
    location: 'TP. Hồ Chí Minh',
    highlights: [
      'Hiện vật chuyển giao từ kho RENT sau 12 chu kỳ thuê chuẩn mực',
      'Ống kính f/1.8-2.8 xóa phông mịt mù, đã kiểm định cảm biến sạch 100%',
      'Bảo hành uy tín 6 tháng từ sàn ReUse Hub',
    ],
    pros: [
      'Giá mua đứt chỉ bằng một nửa giá mới, giữ giá tốt nếu bán lại',
      'Lịch sử bảo dưỡng minh bạch từ kho lưu ký ReUse Hub',
    ],
    cons: [
      'Chỉ còn duy nhất 1 chiếc trong kho thanh lý',
    ],
    detailUrl: '/thrift',
  },
  {
    id: 'THRIFT-BLAZER-TWEED',
    sku: 'THRIFT-BLAZER-TWEED',
    name: 'Áo Khoác Blazer Tweed Dệt Kim Cổ Điển (Second-Life)',
    type: 'THRIFT',
    category: 'Thời trang Thanh lý Cao cấp',
    brand: 'Massimo Archive',
    image: '/images/clothes2.jpg',
    thriftPrice: 590000,
    originalRetailPrice: 2450000,
    conditionGrade: 'Grade A+ (98% - Như mới)',
    budgetTag: 'Tiết kiệm 76%',
    location: 'Hà Nội',
    highlights: [
      'Chất vải Tweed dệt dày dặn, khuy đồng nguyên bản không trầy xước',
      'Đã qua quy trình kiểm định 8 bước và hấp khử khuẩn',
    ],
    pros: [
      'Mặc được nhiều dịp đi làm, họp mặt quanh năm nên mua THRIFT lợi hơn thuê',
      'Giá thanh lý chỉ tương đương 2.5 ngày thuê',
    ],
    cons: [
      'Số lượng giới hạn chỉ 1 size M chuẩn form Á',
    ],
    detailUrl: '/thrift',
  },
];

export const DEFAULT_USER_PREFERENCES: UserAIPreferences = {
  favoriteCategories: ['Máy ảnh Du lịch', 'Trang phục Sự kiện', 'Đồ công nghệ Second-Life'],
  maxDailyRentBudget: 300000,
  preferredLocation: 'Đà Nẵng',
  travelDaysDefault: 4,
};

/**
 * Chuẩn hóa sản phẩm từ ShopContext sang định dạng AIProductRecommendation
 */
export const mapShopProductToAIRec = (
  p: ShopProductItem,
  days = 4,
  maxBudget?: number
): AIProductRecommendation => {
  const daily = Number(p.pricePerDay) || 250000;
  const isWithinBudget = maxBudget ? daily <= maxBudget : daily <= 350000;
  return {
    id: p.sku,
    sku: p.sku,
    name: p.name,
    type: 'RENT',
    category: p.category || 'Thiết bị cho thuê',
    brand: p.brand || 'ReUse Hub Atelier',
    image: p.coverImage || 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=600&q=80',
    pricePerDay: daily,
    depositAmount: Number(p.deposit) || daily * 10,
    originalRetailPrice: Number(p.replacementValue) || daily * 40,
    conditionGrade: p.condition || 'Grade A+ (99%)',
    budgetTag: isWithinBudget ? 'Phù hợp ngân sách' : 'Phân khúc cao cấp',
    calculatedDays: days,
    calculatedTotalRent: daily * days,
    location: p.location || 'Đà Nẵng',
    highlights: [
      p.description ? p.description.slice(0, 95) + '...' : 'Đã qua kiểm định CLA 3 góc và khử khuẩn tiêu chuẩn',
      p.accessoriesIncluded ? `Phụ kiện: ${p.accessoriesIncluded}` : 'Đầy đủ phụ kiện tiêu chuẩn đi kèm',
    ],
    pros: [
      `Sẵn sàng giao ngay từ chi nhánh ${p.location || 'Đà Nẵng'} (${p.readyUnits}/${p.totalUnits} máy khả dụng)`,
      'Bảo vệ 100% tiền cọc qua hợp đồng thông minh Smart Escrow',
    ],
    cons: [
      'Cần ký xác nhận biên bản đồng kiểm CLA khi nhận hàng để kích hoạt bảo hiểm',
    ],
    detailUrl: `/rent/products/${p.sku}`,
  };
};

