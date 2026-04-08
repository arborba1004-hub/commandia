import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Notification {
  id: string;
  title: string;
  message: string;
  read: boolean;
  timestamp: string;
  type?: 'info' | 'success' | 'warning' | 'error';
}

interface NewNotificationInput {
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
}

interface NotificationStoreState {
  notifications: Notification[];
  unreadCount: number;

  addNotification: (notification: NewNotificationInput) => void;
  removeNotification: (id: string) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
}

function countUnread(notifications: Notification[]) {
  return notifications.filter((n) => !n.read).length;
}

export const useNotificationStore = create<NotificationStoreState>()(
  persist(
    (set) => ({
      notifications: [],
      unreadCount: 0,

      addNotification: (notification) =>
        set((state) => {
          const newNotification: Notification = {
            ...notification,
            id: crypto.randomUUID(),
            read: false,
            timestamp: new Date().toISOString(),
          };

          const notifications = [newNotification, ...state.notifications];

          return {
            notifications,
            unreadCount: countUnread(notifications),
          };
        }),

      removeNotification: (id) =>
        set((state) => {
          const notifications = state.notifications.filter((n) => n.id !== id);

          return {
            notifications,
            unreadCount: countUnread(notifications),
          };
        }),

      markAsRead: (id) =>
        set((state) => {
          const notifications = state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          );

          return {
            notifications,
            unreadCount: countUnread(notifications),
          };
        }),

      markAllAsRead: () =>
        set((state) => {
          const notifications = state.notifications.map((n) => ({
            ...n,
            read: true,
          }));

          return {
            notifications,
            unreadCount: 0,
          };
        }),

      clearAll: () =>
        set({
          notifications: [],
          unreadCount: 0,
        }),
    }),
    {
      name: 'notification-store',
    }
  )
);