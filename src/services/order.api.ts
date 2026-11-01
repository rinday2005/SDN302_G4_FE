import api from "./api";

export interface RentalOrderItemApi {
  productId: string;
  productName: string;
  quantity: number;
  pricePerDay: number;
  depositAmount: number;
  [key: string]: unknown;
}

export interface ShippingAddressApi {
  recipientName: string;
  recipientPhone: string;
  province: string;
  district: string;
  ward: string;
  detail: string;
}

export interface ShippingDetailsApi {
  carrier?: string;
  carrierName?: string;
  trackingCode?: string;
  shippedAt?: string | null;
  deliveredAt?: string | null;
  returnCarrier?: string;
  returnTrackingCode?: string;
  returnShippedAt?: string | null;
  returnedAt?: string | null;
}

export interface ClaProofApi {
  isSigned: boolean;
  signedAt?: string | null;
  signerName?: string;
  signerPhone?: string;
  note?: string;
  photos?: {
    slot1?: string;
    slot2?: string;
    slot3?: string;
  };
  images?: string[];
}

export interface RentalOrderApi {
  _id: string;
  orderCode: string;
  renterId: string;
  shopOwnerId?: string;
  items: RentalOrderItemApi[];
  startDate: string;
  endDate: string;
  rentalDays?: number;
  rentalFee: number;
  depositAmount: number;
  shippingFee: number;
  totalAmount: number;
  shippingAddress?: ShippingAddressApi;
  shippingDetails?: ShippingDetailsApi;
  status: string;
  paymentStatus: string;
  rejectionReason?: string;
  receivedAt?: string | null;
  claProof?: ClaProofApi | null;
  inspectionResult?: {
    isApproved?: boolean;
    refundAmount?: number;
    damagePenaltyAmount?: number;
    reason?: string;
  } | null;
  createdAt: string;
  updatedAt?: string;
}

export interface GetUserOrdersResponse {
  orders: RentalOrderApi[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Gọi API Backend: GET /api/rent/orders/my-orders
 * Lấy danh sách đơn thuê của tài khoản đang đăng nhập
 */
export const getMyRentalOrdersApi = async (params?: {
  status?: string;
  page?: number;
  limit?: number;
}): Promise<RentalOrderApi[]> => {
  try {
    const res = await api.get("/rent/orders/my-orders", { params });
    const payload = res.data?.data || res.data;
    if (Array.isArray(payload)) {
      return payload;
    }
    if (payload?.orders && Array.isArray(payload.orders)) {
      return payload.orders;
    }
    return [];
  } catch (error) {
    console.warn("Could not fetch rental orders from backend API:", error);
    return [];
  }
};

/**
 * Gọi API Backend: GET /api/rent/orders/:id
 * Lấy chi tiết đơn thuê theo ID
 */
export const getRentalOrderByIdApi = async (
  id: string
): Promise<RentalOrderApi | null> => {
  try {
    const res = await api.get(`/rent/orders/${id}`);
    return res.data?.data || res.data || null;
  } catch (error) {
    console.warn(`Could not fetch rental order ${id} from backend API:`, error);
    return null;
  }
};

/**
 * [BE-S4-01] Gọi API Backend: POST /api/rent/orders/:id/request-return
 * Gửi yêu cầu hoàn trả đơn thuê và tải lên hình ảnh đối chứng hiện trạng
 */
export const requestReturnOrderApi = async (
  id: string,
  payload: { images?: string[]; note?: string } | FormData
): Promise<RentalOrderApi | null> => {
  let res;
  if (payload instanceof FormData) {
    res = await api.post(`/rent/orders/${id}/request-return`, payload, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  } else {
    res = await api.post(`/rent/orders/${id}/request-return`, payload);
  }
  return res.data?.data || res.data || null;
};

/**
 * [BE-S3-07] Gọi API Backend: POST /api/rent/orders/:id/confirm-received
 * Xác nhận đã nhận đồ & ký biên bản bàn giao CLA đối kiểm 3 góc
 */
export const confirmReceivedOrderApi = async (
  orderId: string,
  payload: {
    photos?: { slot1?: string; slot2?: string; slot3?: string };
    images?: string[];
    note?: string;
    signerName?: string;
    signerPhone?: string;
  }
): Promise<RentalOrderApi | null> => {
  try {
    const res = await api.post(`/rent/orders/${orderId}/confirm-received`, payload);
    return res.data?.data || res.data || null;
  } catch (error) {
    console.error("Lỗi khi xác nhận nhận hàng & ký CLA:", error);
    throw error;
  }
};

/**
 * [BE-S3-06] Gọi API Backend: GET /api/rent/orders/shop
 * Lấy danh sách đơn thuê của Shop Owner từ MongoDB
 */
export const getShopRentalOrdersApi = async (params?: {
  status?: string;
  page?: number;
  limit?: number;
}): Promise<RentalOrderApi[]> => {
  try {
    const res = await api.get("/rent/orders/shop", { params });
    const payload = res.data?.data || res.data;
    if (Array.isArray(payload)) {
      return payload;
    }
    if (payload?.orders && Array.isArray(payload.orders)) {
      return payload.orders;
    }
    return [];
  } catch (error) {
    console.warn("Could not fetch shop rental orders from backend API:", error);
    return [];
  }
};

/**
 * [BE-S3-06] Gọi API Backend: POST /api/rent/orders/:id/handover
 * Shop Owner cập nhật thông tin vận chuyển và bàn giao cho bưu cục
 */
export const handoverRentalOrderApi = async (
  orderId: string,
  data: {
    carrierName: string;
    trackingCode: string;
    status?: "READY_FOR_HANDOVER" | "HANDED_OVER";
  }
): Promise<RentalOrderApi | null> => {
  try {
    const res = await api.post(`/rent/orders/${orderId}/handover`, {
      carrierName: data.carrierName,
      trackingCode: data.trackingCode,
      status: data.status || "HANDED_OVER",
    });
    return res.data?.data || res.data || null;
  } catch (error) {
    console.error("Lỗi khi bàn giao đơn thuê cho đơn vị vận chuyển:", error);
    throw error;
  }
};

/**
 * Gọi API Backend: POST /api/rent/orders/:id/approve
 * Shop Owner phê duyệt đơn thuê -> chuyển sang WAITING_PAYMENT
 */
export const approveRentalOrderApi = async (
  orderId: string
): Promise<RentalOrderApi | null> => {
  try {
    const res = await api.post(`/rent/orders/${orderId}/approve`);
    return res.data?.data || res.data || null;
  } catch (error) {
    console.error("Lỗi khi phê duyệt đơn thuê:", error);
    throw error;
  }
};

/**
 * Gọi API Backend: POST /api/rent/orders/:id/reject
 * Shop Owner từ chối đơn thuê -> chuyển sang REJECTED
 */
export const rejectRentalOrderApi = async (
  orderId: string,
  reason?: string
): Promise<RentalOrderApi | null> => {
  try {
    const res = await api.post(`/rent/orders/${orderId}/reject`, { reason });
    return res.data?.data || res.data || null;
  } catch (error) {
    console.error("Lỗi khi từ chối đơn thuê:", error);
    throw error;
  }
};

/**
 * Gọi API Backend: POST /api/rent/orders
 * Tạo đơn thuê mới (trạng thái ban đầu: PENDING chờ Shop duyệt)
 */
export const createRentalOrderApi = async (payload: {
  startDate: string;
  endDate: string;
  shippingAddress: ShippingAddressApi;
  items?: unknown[];
  totalAmount?: number;
  depositAmount?: number;
  rentalFee?: number;
  shippingFee?: number;
}): Promise<RentalOrderApi | null> => {
  try {
    const res = await api.post("/rent/orders", payload);
    return res.data?.data || res.data || null;
  } catch (error) {
    console.error("Lỗi khi tạo đơn thuê mới:", error);
    throw error;
  }
};

/**
 * [BE-S4-02] Gọi API Backend: POST /api/rent/orders/:id/inspect-and-refund
 * Shop Owner kiểm định hư hại & quyết định hoàn cọc -> chuyển COMPLETED
 */
export const inspectAndRefundOrderApi = async (
  orderId: string,
  payload: {
    damagePenaltyAmount?: number;
    reason?: string;
    damageImages?: string[];
    itemInspections?: unknown[];
  } = {}
): Promise<RentalOrderApi | null> => {
  try {
    const res = await api.post(`/rent/orders/${orderId}/inspect-and-refund`, {
      damagePenaltyAmount: payload.damagePenaltyAmount ?? 0,
      reason: payload.reason || "Sản phẩm đạt chuẩn nguyên trạng, hoàn 100% tiền cọc",
      damageImages: payload.damageImages || [],
      itemInspections: payload.itemInspections || [],
    });
    return res.data?.data || res.data || null;
  } catch (error) {
    console.error("Lỗi khi kiểm định và giải tỏa cọc đơn thuê:", error);
    throw error;
  }
};

/**
 * Gọi API Backend: PATCH /api/rent/orders/:id/status
 * Cập nhật trạng thái đơn thuê (ví dụ: chuyển sang RETURNED khi vào nghiệm thu)
 */
export const updateOrderStatusApi = async (
  orderId: string,
  status: string
): Promise<RentalOrderApi | null> => {
  try {
    const res = await api.patch(`/rent/orders/${orderId}/status`, { status });
    return res.data?.data || res.data || null;
  } catch (error) {
    console.error(`Lỗi khi cập nhật trạng thái đơn thuê sang ${status}:`, error);
    throw error;
  }
};

export default {
  getMyRentalOrdersApi,
  getShopRentalOrdersApi,
  getRentalOrderByIdApi,
  requestReturnOrderApi,
  confirmReceivedOrderApi,
  handoverRentalOrderApi,
  approveRentalOrderApi,
  rejectRentalOrderApi,
  createRentalOrderApi,
  inspectAndRefundOrderApi,
  updateOrderStatusApi,
};

