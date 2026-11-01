import api from "./api";

export interface ShopProfileData {
  shopId: string;
  shopName: string;
  ownerName: string;
  email: string;
  secondaryEmail?: string;
  phoneNumber?: string;
  address?: string;
  cityRegion?: string;
  avatarUrl?: string;
  coverUrl?: string;
  description?: string;
  specialization?: string;
  roleTitle?: string;
  rating?: number;
  establishedYear?: number;
  walletBalance?: number;
  kycStatus?: string;
  role?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface UpdateShopProfilePayload {
  shopName?: string;
  ownerName?: string;
  fullName?: string;
  phoneNumber?: string;
  address?: string;
  businessAddress?: string;
  addressLine?: string;
  cityRegion?: string;
  avatarUrl?: string;
  coverUrl?: string;
  description?: string;
  specialization?: string;
  roleTitle?: string;
  secondaryEmail?: string;
}

export interface RevenueSummary {
  totalRevenue: number;
  rentRevenue: number;
  thriftRevenue: number;
  rentRevenuePercent: number;
  thriftRevenuePercent: number;
  totalCompletedOrders: number;
  completedRentOrdersCount: number;
  completedThriftOrdersCount: number;
  avgRentOrderValue: number;
  avgThriftOrderValue: number;
  walletBalance: number;
}

export interface RevenueTimelineItem {
  month: string;
  rentRevenue: number;
  thriftRevenue: number;
  totalRevenue: number;
  ordersCount: number;
}

export interface TopProductSummaryItem {
  id: string;
  name: string;
  imageUrl?: string;
  totalRevenue: number;
  rentalTimes?: number;
  soldCount?: number;
}

export interface RecentTransactionItem {
  id: string;
  orderCode: string;
  type: "RENT" | "THRIFT";
  serviceType: string;
  customerName: string;
  amount: number;
  depositAmount: number;
  totalPaid: number;
  status: string;
  completedAt: string;
  items?: {
    name: string;
    quantity: number;
    price?: number;
    pricePerDay?: number;
  }[];
}

export interface ShopRevenueData {
  summary: RevenueSummary;
  timelineBreakdown: RevenueTimelineItem[];
  topProducts: {
    rent: TopProductSummaryItem[];
    thrift: TopProductSummaryItem[];
  };
  recentTransactions: RecentTransactionItem[];
}

/**
 * GET /api/shop/profile
 * Lấy thông tin Shop Profile thực tế từ MongoDB
 */
export const getShopProfileApi = async (): Promise<ShopProfileData> => {
  const response = await api.get<{ success: boolean; data: ShopProfileData }>("/shop/profile");
  return response.data.data;
};

/**
 * PUT /api/shop/profile
 * Cập nhật thông tin Shop Profile vào MongoDB
 */
export const updateShopProfileApi = async (
  payload: UpdateShopProfilePayload
): Promise<ShopProfileData> => {
  const response = await api.put<{ success: boolean; data: ShopProfileData }>(
    "/shop/profile",
    payload
  );
  return response.data.data;
};

/**
 * GET /api/shop/revenue
 * Lấy thống kê doanh thu thực tế tính toán từ MongoDB Aggregation Pipeline
 */
export const getShopRevenueApi = async (params?: {
  startDate?: string;
  endDate?: string;
}): Promise<ShopRevenueData> => {
  const response = await api.get<{ success: boolean; data: ShopRevenueData }>("/shop/revenue", {
    params,
  });
  return response.data.data;
};
