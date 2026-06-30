import { create } from 'zustand';
import api from '../lib/api';

export const useNotificationStore = create((set) => ({
  notifications: [],
  isLoading: false,

  fetchNotifications: async () => {
    try {
      const res = await api.get('/notifications');
      set({ notifications: res.data.notifications });
    } catch (error) {
      console.error('Failed to fetch notifications', error);
    }
  },

  markAsRead: async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      set((state) => ({
        notifications: state.notifications.map(n => 
          n.id === id ? { ...n, is_read: true } : n
        )
      }));
    } catch (error) {
      console.error('Failed to mark as read', error);
    }
  },

  markAllAsRead: async () => {
    try {
      await api.put('/notifications/read-all');
      set((state) => ({
        notifications: state.notifications.map(n => ({ ...n, is_read: true }))
      }));
    } catch (error) {
      console.error('Failed to mark all as read', error);
    }
  }
}));
