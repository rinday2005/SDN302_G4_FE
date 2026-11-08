import { useState, useEffect, useCallback, useRef } from "react";
import {
  getNotificationsApi,
  getUnreadNotificationCountApi,
  markNotificationAsReadApi,
  markAllNotificationsAsReadApi,
  type NotificationItem,
} from "../services/notification.api";
import { useAuth } from "./useAuth";

export interface UseNotificationReturn {
  notifications: NotificationItem[];
  unreadCount: number;
  total: number;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

export const useNotification = (autoPollIntervalMs = 15000): UseNotificationReturn => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const isMountedRef = useRef(true);

  const fetchNotifications = useCallback(async () => {
    const token = localStorage.getItem("token") || localStorage.getItem("accessToken");
    if (!token || !user) {
      if (isMountedRef.current) {
        setNotifications([]);
        setUnreadCount(0);
        setTotal(0);
        setLoading(false);
      }
      return;
    }

    try {
      const [listRes, countRes] = await Promise.all([
        getNotificationsApi({ page: 1, limit: 30 }),
        getUnreadNotificationCountApi().catch(() => 0),
      ]);

      if (!isMountedRef.current) return;

      setNotifications(listRes.notifications);
      setTotal(listRes.total);
      const finalUnread = countRes || listRes.unreadCount || listRes.notifications.filter((n) => !n.isRead).length;
      setUnreadCount(finalUnread);
      setError(null);
    } catch (err: unknown) {
      if (!isMountedRef.current) return;
      console.warn("[useNotification] Error fetching notifications:", err);
      setError("Không thể tải thông báo");
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [user]);

  // Initial fetch and user change
  useEffect(() => {
    isMountedRef.current = true;
    fetchNotifications();

    let timer: ReturnType<typeof setInterval> | null = null;
    if (autoPollIntervalMs > 0) {
      timer = setInterval(fetchNotifications, autoPollIntervalMs);
    }

    const handleRefreshEvent = () => fetchNotifications();
    window.addEventListener("notification_refresh", handleRefreshEvent);
    window.addEventListener("focus", handleRefreshEvent);

    return () => {
      isMountedRef.current = false;
      if (timer) clearInterval(timer);
      window.removeEventListener("notification_refresh", handleRefreshEvent);
      window.removeEventListener("focus", handleRefreshEvent);
    };
  }, [fetchNotifications, autoPollIntervalMs]);

  // Mark single notification as read
  const markAsRead = useCallback(async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n._id === id || n.id === id ? { ...n, isRead: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    try {
      await markNotificationAsReadApi(id);
      window.dispatchEvent(new CustomEvent("notification_refresh"));
    } catch (err) {
      console.warn("[useNotification] Error marking notification as read:", err);
    }
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);

    try {
      await markAllNotificationsAsReadApi();
      window.dispatchEvent(new CustomEvent("notification_refresh"));
    } catch (err) {
      console.warn("[useNotification] Error marking all notifications as read:", err);
    }
  }, []);

  return {
    notifications,
    unreadCount,
    total,
    loading,
    error,
    refresh: fetchNotifications,
    markAsRead,
    markAllAsRead,
  };
};

export default useNotification;
