export interface UserNotificationItem {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  type: 'system' | 'reminder' | 'streak' | 'goal';
}

const keyFor = (userId: string) => `user_notifications_v1_${userId}`;

export const getUserNotifications = (userId?: string | null): UserNotificationItem[] => {
  if (!userId) return [];
  try {
    const raw = localStorage.getItem(keyFor(userId));
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
};

export const setUserNotifications = (userId: string, items: UserNotificationItem[]) => {
  localStorage.setItem(keyFor(userId), JSON.stringify(items.slice(0, 100)));
};

export const pushUserNotification = (
  userId: string,
  data: Omit<UserNotificationItem, 'id' | 'createdAt' | 'read'>
) => {
  const items = getUserNotifications(userId);
  const next: UserNotificationItem = {
    ...data,
    id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    read: false
  };
  setUserNotifications(userId, [next, ...items]);
  window.dispatchEvent(new CustomEvent('user-notifications-updated', { detail: { userId } }));
  return next;
};

export const markNotificationRead = (userId: string, id: string) => {
  const items = getUserNotifications(userId).map((item) => (item.id === id ? { ...item, read: true } : item));
  setUserNotifications(userId, items);
  window.dispatchEvent(new CustomEvent('user-notifications-updated', { detail: { userId } }));
};

export const markAllNotificationsRead = (userId: string) => {
  const items = getUserNotifications(userId).map((item) => ({ ...item, read: true }));
  setUserNotifications(userId, items);
  window.dispatchEvent(new CustomEvent('user-notifications-updated', { detail: { userId } }));
};

