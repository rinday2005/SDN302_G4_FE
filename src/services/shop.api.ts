import api from "./api";
import type { AddressValue } from "../components/form/AddressSelector";

export interface ShopProfileData {
  shopId: string;
  shopName: string;
  ownerName: string;
  email: string;
  secondaryEmail?: string;
  phoneNumber?: string;
  address?: string;
  addressObject?: AddressValue | null;
  cityRegion?: string;
  avatarUrl?: string;
  coverUrl?: string;
  slogan?: string;
  hotline?: string;
  operatingHours?: string;
  website?: string;
  returnPolicy?: string;
  shippingCommitment?: string;
  description?: string;
  specialization?: string;
  roleTitle?: string;
  rating?: number;
  reviewCount?: number;
  rentCount?: number;
  thriftCount?: number;
  establishedYear?: number;
  walletBalance?: number;
  kycStatus?: string;
  kyc?: {
    citizenId?: string;
    fullName?: string;
    dob?: string;
    residentAddress?: string;
    cardFrontUrl?: string;
    cardBackUrl?: string;
    rejectionReason?: string;
    submittedAt?: string;
    verifiedAt?: string;
    kycCode?: string;
  } | null;
  role?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface UpdateShopProfilePayload {
  shopName?: string;
  ownerName?: string;
  fullName?: string;
  phoneNumber?: string;
  address?: string | AddressValue;
  businessAddress?: string;
  addressLine?: string;
  cityRegion?: string;
  avatarUrl?: string;
  coverUrl?: string;
  slogan?: string;
  hotline?: string;
  operatingHours?: string;
  website?: string;
  returnPolicy?: string;
  shippingCommitment?: string;
  description?: string;
  specialization?: string;
  roleTitle?: string;
  secondaryEmail?: string;
  establishedYear?: number;
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

export const getShopProfileApi = async (): Promise<ShopProfileData> => {
  const response = await api.get("/shop/profile");
  return response.data?.data;
};

export const updateShopProfileApi = async (
  payload: UpdateShopProfilePayload
): Promise<ShopProfileData> => {
  const response = await api.put("/shop/profile", payload);
  return response.data?.data;
};

export const getShopRevenueApi = async (
  timeRange: string = "all"
): Promise<ShopRevenueData> => {
  const response = await api.get(`/shop/revenue?timeRange=${timeRange}`);
  return response.data?.data;
};

export const getPublicShopDetailApi = async (shopId: string): Promise<ShopProfileData> => {
  const response = await api.get(`/shop/${shopId}`);
  return response.data?.data;
};
