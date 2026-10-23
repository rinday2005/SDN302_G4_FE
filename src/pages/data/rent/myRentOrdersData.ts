export interface RentalOrderItem {
  id: string;
  title: string;
  grade: string;
  codeBadge: string;
  shop: string;
  notes: string;
  dailyRate: string;
  itemTotal: string;
  img: string;
}

export interface RentalOrderRecord {
  id: string;
  code: string;
  date: string;
  shipping: string;
  status: string;
  statusText: string;
  statusBg: string;
  dotBg: string;
  custodyDates: string;
  daysLeft: string;
  items: RentalOrderItem[];
  rentTotal: string;
  deposit: string;
  depositVal: number;
  rentTotalVal: number;
  grandTotalVal: number;
  shippingFee: string;
  grandTotal: string;
  canReturn: boolean;
  canPay: boolean;
  needsClaSign?: boolean;
  claSigned?: boolean;
  isReturningOrReturned?: boolean;
  isCompleted?: boolean;
  recipientName?: string;
  recipientPhone?: string;
  shippingAddressText?: string;
}

export interface StoredRentalOrderItem {
  id?: string;
  productId?: string;
  title?: string;
  productName?: string;
  grade?: string;
  shopName?: string;
  dailyPrice?: number;
  pricePerDay?: number;
  itemRentTotal?: number;
  price?: number;
  depositAmount?: number;
  quantity?: number;
  imageUrl?: string;
  image?: string;
}

export interface StoredRentalOrderRecord {
  _id?: string;
  orderCode?: string;
  createdAt?: string;
  status?: string;
  paymentStatus?: string;
  startDate?: string;
  endDate?: string;
  rentalDays?: number;
  items?: StoredRentalOrderItem[];
  rentalFee?: number;
  totalRentFee?: number;
  depositAmount?: number;
  totalDeposit?: number;
  shippingFee?: number;
  totalAmount?: number;
  totalPayment?: number;
  grandTotal?: number;
  shippingAddress?: {
    recipientName?: string;
    recipientPhone?: string;
    province?: string;
    district?: string;
    ward?: string;
    detail?: string;
  };
  shippingDetails?: {
    carrierName?: string;
    trackingCode?: string;
  };
  [key: string]: unknown;
}

export interface MetricCardData {
  title: string;
  icon: string;
  iconBg: string;
  iconColor: string;
  mainVal: string;
  unit: string;
  unitColor: string;
  badge?: string;
  subText: string;
  bottomBorderColor: string;
}

/**
 * Đã bỏ hoàn toàn các order mẫu.
 * Hiển thị chính xác theo dữ liệu trong MongoDB.
 */
export const DEFAULT_RENTAL_ORDERS: RentalOrderRecord[] = [];

export const LIFECYCLE_STATUS_TABS = [
  { key: 'ALL', label: 'Tất cả' },
  { key: 'PAID', label: 'Đã thanh toán', dot: 'bg-[#4A6B53]' },
  { key: 'RENTING', label: 'Đang thuê', dot: 'bg-[#4A6B53]' },
  { key: 'READY_FOR_HANDOVER', label: 'Sẵn sàng bàn giao' },
  { key: 'HANDED_OVER', label: 'Đã bàn giao' },
  { key: 'WAITING_PAYMENT', label: 'Chờ thanh toán', dot: 'bg-[#C87A1E]' },
  { key: 'RETURNED', label: 'Đã nhận trả' },
  { key: 'COMPLETED', label: 'Hoàn tất' },
];
