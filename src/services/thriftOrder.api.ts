import api from './api';

export interface ThriftOrderItemApi {
  listingId: string | { _id: string; name?: string; price?: number; condition?: string; images?: string[]; location?: string };
  productName: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  condition?: string;
  vaultOrigin?: string;
  warranty?: string;
}

export interface ThriftShippingAddressApi {
  recipientName: string;
  recipientPhone: string;
  province: string;
  district: string;
  ward: string;
  detail: string;
}

export interface ThriftOrderTimelineApi {
  status: string;
  title: string;
  description: string;
  timestamp: string;
}

export interface ThriftBenchInspectionMetric {
  metric: string;
  name: string;
  result: string;
  value: string;
  note: string;
  status: 'PASSED' | 'WARNING' | 'FAILED';
}

export interface ThriftOrderReview {
  reviewerId: string;
  rating: number;
  comment?: string;
  images?: string[];
  createdAt: string;
}

export interface ThriftOrderApi {
  _id: string;
  orderCode: string;
  buyerId: string | { _id: string; fullName?: string; email?: string; phoneNumber?: string; address?: unknown; avatarUrl?: string };
  shopOwnerId?: string | { _id: string; fullName?: string; email?: string; phoneNumber?: string; address?: unknown; avatarUrl?: string };
  items: ThriftOrderItemApi[];
  itemsSubtotal: number;
  shippingFee: number;
  totalAmount: number;
  shippingAddress: ThriftShippingAddressApi;
  status: 'PENDING_PAYMENT' | 'PAID' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'COMPLETED' | 'CANCELLED' | 'DISPUTED';
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  paymentMethod: string;
  trackingCode?: string;
  courierName?: string;
  escrowStatus?: 'PENDING' | 'HELD_72H' | 'RELEASED' | 'REFUNDED';
  escrowExpiresAt?: string | null;
  provenanceVaultCertId?: string;
  cancelReason?: string;
  disputeReason?: string;
  disputeDetail?: {
    problemItem?: string;
    reason?: string;
    description?: string;
    disputedAt?: string;
  };
  benchInspection?: ThriftBenchInspectionMetric[];
  reviews?: ThriftOrderReview[];
  note?: string;
  timeline?: ThriftOrderTimelineApi[];
  createdAt: string;
  updatedAt?: string;
}

export interface GetMyThriftOrdersResponse {
  orders: ThriftOrderApi[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CreateThriftOrderDto {
  items?: Array<{
    listingId: string;
    quantity?: number;
  }>;
  shippingAddress?: Partial<ThriftShippingAddressApi>;
  note?: string;
  paymentMethod?: string;
}

/**
 * Tạo đơn mua THRIFT
 */
export const createThriftOrderApi = async (data: CreateThriftOrderDto): Promise<ThriftOrderApi> => {
  const res = await api.post('/thrift/orders', data);
  return res.data?.data || res.data;
};

/**
 * Lấy danh sách đơn mua THRIFT của người dùng hiện tại
 */
export const getMyThriftOrdersApi = async (params?: {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}): Promise<GetMyThriftOrdersResponse> => {
  const res = await api.get('/thrift/orders/my-orders', { params });
  return res.data?.data || res.data;
};

/**
 * Lấy chi tiết đơn mua THRIFT theo ID hoặc OrderCode
 */
export const getThriftOrderByIdApi = async (id: string): Promise<ThriftOrderApi> => {
  const res = await api.get(`/thrift/orders/${id}`);
  return res.data?.data || res.data;
};

/**
 * Khách hàng hủy đơn mua THRIFT
 */
export const cancelThriftOrderApi = async (id: string, reason?: string): Promise<ThriftOrderApi> => {
  const res = await api.post(`/thrift/orders/${id}/cancel`, { reason });
  return res.data?.data || res.data;
};

/**
 * Khách hàng xác nhận nghiệm thu sau 72h đối soát & nhận chứng thư số
 */
export const confirmDeliveredThriftOrderApi = async (id: string): Promise<ThriftOrderApi> => {
  const res = await api.post(`/thrift/orders/${id}/confirm-delivered`);
  return res.data?.data || res.data;
};

/**
 * Khách hàng mở hồ sơ khiếu nại tranh chấp & đóng băng Smart Escrow
 */
export const disputeThriftOrderApi = async (
  id: string,
  data: { reason: string; problemItem?: string; description?: string }
): Promise<ThriftOrderApi> => {
  const res = await api.post(`/thrift/orders/${id}/dispute`, data);
  return res.data?.data || res.data;
};

/**
 * Khách hàng đánh giá hiện vật & Atelier
 */
export const reviewThriftOrderApi = async (
  id: string,
  data: { rating: number; comment?: string; images?: string[]; itemId?: string }
): Promise<ThriftOrderApi> => {
  const res = await api.post(`/thrift/orders/${id}/reviews`, data);
  return res.data?.data || res.data;
};

/**
 * Cập nhật trạng thái đơn hàng (Dành cho shop/admin)
 */
export const updateThriftOrderStatusApi = async (
  id: string,
  data: { status?: string; trackingCode?: string; courierName?: string; note?: string }
): Promise<ThriftOrderApi> => {
  const res = await api.patch(`/thrift/orders/${id}/status`, data);
  return res.data?.data || res.data;
};

