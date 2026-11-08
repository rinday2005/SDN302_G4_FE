import api from "./api";

export interface NotificationItem {
  _id: string;
  id?: string;
  userId: string;
  title: string;
  message: string;
  type: string; // 'RENTAL_ORDER' | 'THRIFT_ORDER' | 'PAYMENT' | 'KYC' | 'LISTING' | 'RETURN' | 'REFUND' | 'SYSTEM'
  link?: string;
  isRead: boolean;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationListResponse {
  notifications: NotificationItem[];
  total: number;
  unreadCount: number;
  page: number;
  totalPages: number;
}

/**
 * Lấy danh sách thông báo của tài khoản hiện tại từ MongoDB (/api/notifications)
 */
export const getNotificationsApi = async (params?: {
  page?: number;
  limit?: number;
  isRead?: boolean;
}): Promise<NotificationListResponse> => {
  const res = await api.get("/notifications", { params });
  const payload = res.data?.data || res.data;
  return {
    notifications: Array.isArray(payload?.notifications)
      ? payload.notifications
      : Array.isArray(payload)
      ? payload
      : [],
    total: Number(payload?.total) || 0,
    unreadCount: Number(payload?.unreadCount) || 0,
    page: Number(payload?.page) || 1,
    totalPages: Number(payload?.totalPages) || 1,
  };
};

/**
 * Lấy số lượng thông báo chưa đọc (/api/notifications/unread-count)
 */
export const getUnreadNotificationCountApi = async (): Promise<number> => {
  const res = await api.get("/notifications/unread-count");
  const payload = res.data?.data || res.data;
  return Number(payload?.unreadCount ?? payload?.count ?? 0);
};

/**
 * Đánh dấu 1 thông báo là đã đọc (/api/notifications/:id/read)
 */
export const markNotificationAsReadApi = async (id: string): Promise<NotificationItem> => {
  const res = await api.patch(`/notifications/${id}/read`);
  return res.data?.data || res.data;
};

/**
 * Đánh dấu toàn bộ thông báo là đã đọc (/api/notifications/read-all)
 */
export const markAllNotificationsAsReadApi = async (): Promise<{ success: boolean }> => {
  const res = await api.patch("/notifications/read-all");
  return res.data?.data || res.data;
};

/**
 * Tạo thông báo mới (Admin hoặc System) (/api/notifications)
 */
export const createNotificationApi = async (data: {
  userId: string;
  title: string;
  message: string;
  type?: string;
  link?: string;
  metadata?: Record<string, unknown>;
}): Promise<NotificationItem> => {
  const res = await api.post("/notifications", data);
  return res.data?.data || res.data;
};

