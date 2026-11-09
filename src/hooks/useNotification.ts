import { useState, useEffect, useCallback, useRef, useMemo } from "react";
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
  popupNotification: NotificationItem | null;
  dismissPopup: (id: string) => void;
  refresh: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

const DISMISSED_STORAGE_KEY = "reuse_dismissed_popup_notifs_v1";

const loadDismissedIds = (): string[] => {
  try {
    const raw = sessionStorage.getItem(DISMISSED_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const useNotification = (autoPollIntervalMs = 6000): UseNotificationReturn => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [dismissedIds, setDismissedIds] = useState<string[]>(() => loadDismissedIds());

  const isMountedRef = useRef(true);

  const dismissPopup = useCallback(
    (id: string) => {
      setDismissedIds((prev) => {
        const currentIds = notifications
          .map((n) => n._id || n.id || "")
          .filter(Boolean);
        const merged = Array.from(new Set([...prev, id, ...currentIds])).filter(Boolean);
        try {
          sessionStorage.setItem(DISMISSED_STORAGE_KEY, JSON.stringify(merged));
        } catch {
          // ignore storage quota errors
        }
        return merged;
      });
    },
    [notifications]
  );

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
      const finalUnread =
        countRes || listRes.unreadCount || listRes.notifications.filter((n) => !n.isRead).length;
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
  const markAsRead = useCallback(
    async (id: string) => {
      dismissPopup(id);
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
    },
    [dismissPopup]
  );

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

  const popupNotification = useMemo(() => {
    return (
      notifications.find((n) => {
        const id = n._id || n.id || "";
        return !n.isRead && id && !dismissedIds.includes(id);
      }) || null
    );
  }, [notifications, dismissedIds]);

  // Tự động ẩn popup thông báo sau 2 giây (2000ms)
  useEffect(() => {
    const popupId = popupNotification?._id || popupNotification?.id || "";
    if (!popupId) return;

    const autoCloseTimer = setTimeout(() => {
      dismissPopup(popupId);
    }, 2000);

    return () => clearTimeout(autoCloseTimer);
  }, [popupNotification, dismissPopup]);

  return {
    notifications,
    unreadCount,
    total,
    loading,
    error,
    popupNotification,
    dismissPopup,
    refresh: fetchNotifications,
    markAsRead,
    markAllAsRead,
  };
};

export default useNotification;
