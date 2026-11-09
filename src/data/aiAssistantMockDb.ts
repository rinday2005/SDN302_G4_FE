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
 * DB MẪU THỜI TRANG CHUẨN CHO REUSE HUB AI SHOPPING ASSISTANT
 */
export const AI_MOCK_PRODUCTS_DB: AIProductRecommendation[] = [
  {
    id: 'PARTY-DRESS-MINIMAL',
    sku: 'PARTY-DRESS-MINIMAL',
    name: 'Party Dress Thiết Kế Tối Giản',
    type: 'RENT',
    category: 'Đầm dự tiệc',
    brand: 'ReUse Atelier',
    image:
      'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=800&auto=format&fit=crop&q=80',
    pricePerDay: 180000,
    depositAmount: 800000,
    originalRetailPrice: 3600000,
    conditionGrade: 'Như mới 99% (Grade A+)',
    budgetTag: 'Phù hợp ngân sách',
    calculatedDays: 3,
    calculatedTotalRent: 540000,
    location: 'Đà Nẵng',
    highlights: [
      'Đầm dạ hội phong cách tối giản thanh lịch, chất vải lụa cao cấp',
      'Đã khử khuẩn bằng công nghệ Ozone và niêm phong túi lụa trước khi giao',
    ],
    pros: [
      'Tôn dáng sang trọng cho các buổi tiệc tối, Gala và sự kiện',
      'Tiết kiệm 85% chi phí so với mua đứt cho 1 đêm tiệc',
    ],
    cons: [
      'Không giặt sấy nhiệt độ cao, giữ nguyên form dáng đầm',
    ],
    detailUrl: '/rent',
  },
  {
    id: 'COAT-WOOL-LONG',
    sku: 'COAT-WOOL-LONG',
    name: 'Áo Khoác Dạ Wool Dáng Dài Cao Cấp',
    type: 'RENT',
    category: 'Quần áo',
    brand: 'ReUse Atelier',
    image:
      'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=800&auto=format&fit=crop&q=80',
    pricePerDay: 220000,
    depositAmount: 900000,
    originalRetailPrice: 4200000,
    conditionGrade: 'Như mới 99% (Grade A+)',
    budgetTag: 'Phù hợp ngân sách',
    calculatedDays: 4,
    calculatedTotalRent: 880000,
    location: 'Hà Nội',
    highlights: [
      'Áo khoác dạ lông cừu dáng dài thời thượng, giữ ấm hoàn hảo cho mùa đông',
      'Rất hợp du lịch Đà Lạt, Hà Nội hoặc chụp hình ngoại cảnh',
    ],
    pros: [
      'Cầu vai đứng form chuẩn Âu, lên hình cực kỳ sang trọng',
      'Đã giặt khô chuyên sâu và khử trùng tia UV-C',
    ],
    cons: [
      'Chỉ giặt khô, không dùng bàn ủi nóng trực tiếp lên bề mặt dạ',
    ],
    detailUrl: '/rent',
  },
  {
    id: 'CLASSIC-SNEAKERS-ARCHIVE',
    sku: 'CLASSIC-SNEAKERS-ARCHIVE',
    name: 'Classic Sneakers Da Thật Archive',
    type: 'RENT',
    category: 'Giày dép',
    brand: 'ReUse Archive',
    image:
      'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&auto=format&fit=crop&q=80',
    pricePerDay: 150000,
    depositAmount: 600000,
    originalRetailPrice: 2800000,
    conditionGrade: 'Rất tốt 95% (Grade A)',
    budgetTag: 'Phù hợp ngân sách',
    calculatedDays: 4,
    calculatedTotalRent: 600000,
    location: 'Đà Nẵng',
    highlights: [
      'Giày sneaker da thật archive phong cách vintage cổ điển, êm chân và bền bỉ',
      'Đã khử mùi, vệ sinh đế và dưỡng da chuyên dụng trước khi bàn giao',
    ],
    pros: [
      'Dễ phối với nhiều phong cách trang phục từ dạo phố đến năng động',
      'Giá thuê cực kỳ tiết kiệm chỉ 150.000đ/ngày',
    ],
    cons: [
      'Tránh đi vào bùn lầy sâu, trả giày sạch sẽ',
    ],
    detailUrl: '/rent',
  },
  {
    id: 'THRIFT-MAXI-SEQUINS',
    sku: 'THRIFT-MAXI-SEQUINS',
    name: 'Đầm Dạ Hội Nữ Maxi Sequins Xẻ Tà Sang Trọng',
    type: 'THRIFT',
    category: 'Đầm dự tiệc',
    brand: 'ReUse Thrift Atelier',
    image:
      'https://images.unsplash.com/photo-1566174053879-31528523f8ae?w=800&auto=format&fit=crop&q=80',
    thriftPrice: 1850000,
    originalRetailPrice: 4500000,
    conditionGrade: 'Như mới (99%)',
    budgetTag: 'Tiết kiệm Second-Life',
    location: 'Hà Nội',
    highlights: [
      'Đầm dạ hội nữ dáng dài xẻ tà quyến rũ, đính đá và kim sa ánh bạc thủ công',
      'Form dáng ôm tôn đường cong hoàn hảo, chất liệu tơ tằm sang trọng',
    ],
    pros: [
      'Giá mua đứt tiết kiệm gần 60% so với giá gốc tại showroom',
      'Lịch sử bảo quản minh bạch từ kho ReUse Hub',
    ],
    cons: [
      'Số lượng giới hạn trong kho thanh lý',
    ],
    detailUrl: '/thrift',
  },
  {
    id: 'THRIFT-TRENCH-COAT',
    sku: 'THRIFT-TRENCH-COAT',
    name: 'Áo Khoác Trench Coat Dạ Dáng Dài Khuy Đôi Vintage',
    type: 'THRIFT',
    category: 'Quần áo',
    brand: 'ReUse Thrift Atelier',
    image:
      'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=800&auto=format&fit=crop&q=80',
    thriftPrice: 1100000,
    originalRetailPrice: 2900000,
    conditionGrade: 'Rất tốt (97%)',
    budgetTag: 'Tiết kiệm 62%',
    location: 'Đà Nẵng',
    highlights: [
      'Áo khoác dáng dài chất liệu dạ ép hai mặt cao cấp phong cách Paris cổ điển',
      'Đã qua quy trình kiểm định chất lượng và hấp khử khuẩn',
    ],
    pros: [
      'Mặc được nhiều dịp quanh năm nên mua đứt THRIFT cực kỳ kinh tế',
      'Cầu vai tự nhiên đứng form tôn dáng',
    ],
    cons: [
      'Số lượng giới hạn chỉ còn 1 chiếc tại kho Đà Nẵng',
    ],
    detailUrl: '/thrift',
  },
];

export const DEFAULT_USER_PREFERENCES: UserAIPreferences = {
  favoriteCategories: ['Đầm dự tiệc', 'Quần áo thiết kế', 'Giày dép & Phụ kiện'],
  maxDailyRentBudget: 350000,
  preferredLocation: 'Đà Nẵng',
  travelDaysDefault: 3,
};

/**
 * Chuẩn hóa sản phẩm từ ShopContext sang định dạng AIProductRecommendation
 */
export const mapShopProductToAIRec = (
  p: ShopProductItem,
  days = 3,
  maxBudget?: number
): AIProductRecommendation => {
  const daily = Number(p.pricePerDay) || 180000;
  const isWithinBudget = maxBudget ? daily <= maxBudget : daily <= 350000;
  return {
    id: p.sku,
    sku: p.sku,
    name: p.name,
    type: 'RENT',
    category: p.category || 'Thời trang cho thuê',
    brand: p.brand || 'ReUse Hub Atelier',
    image:
      p.coverImage ||
      'https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=600&q=80',
    pricePerDay: daily,
    depositAmount: Number(p.deposit) || daily * 4,
    originalRetailPrice: Number(p.replacementValue) || daily * 15,
    conditionGrade: p.condition || 'Grade A+ (99%)',
    budgetTag: isWithinBudget ? 'Phù hợp ngân sách' : 'Thiết kế Cao cấp',
    calculatedDays: days,
    calculatedTotalRent: daily * days,
    location: p.location || 'Đà Nẵng',
    highlights: [
      p.description
        ? p.description.slice(0, 110)
        : 'Đã qua kiểm định chất lượng và giặt hấp khử khuẩn tiêu chuẩn',
      p.accessoriesIncluded
        ? `Lưu ý / Phụ kiện: ${p.accessoriesIncluded}`
        : 'Đầy đủ phụ kiện & túi bảo quản chuyên dụng đi kèm',
    ],
    pros: [
      `Sẵn sàng giao ngay từ chi nhánh ${p.location || 'Đà Nẵng'} (${p.readyUnits}/${p.totalUnits} sản phẩm khả dụng)`,
      'Bảo vệ 100% tiền cọc qua hợp đồng thông minh Smart Escrow',
    ],
    cons: [
      p.accessoriesIncluded || 'Vui lòng giữ nguyên tem kiểm định và tránh hóa chất tẩy mạnh',
    ],
    detailUrl: `/rent/products/${p.sku}`,
  };
};
