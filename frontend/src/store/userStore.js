import { create } from 'zustand';
import api from '../lib/api';

export const useUserStore = create((set) => ({
  users: [],
  isLoading: false,
  error: null,

  fetchUsers: async () => {
    set({ isLoading: true });
    try {
      const response = await api.get('/users');
      set({ users: response.data.users, isLoading: false });
    } catch (error) {
      set({ error: error.response?.data?.error?.message || 'Failed to fetch users', isLoading: false });
    }
  },

  updateUserRole: async (userId, roleName) => {
    try {
      await api.put(`/users/${userId}/role`, { roleName });
    } catch (error) {
      console.error('Failed to update role', error);
      throw error;
    }
  },

  createUser: async (userData) => {
    try {
      const response = await api.post('/users', userData);
      return response.data;
    } catch (error) {
      console.error('Failed to create user', error);
      throw error;
    }
  },

  deleteUser: async (userId) => {
    try {
      await api.delete(`/users/${userId}`);
    } catch (error) {
      console.error('Failed to delete user', error);
      throw error;
    }
  },

  updateUserDetails: async (userId, data) => {
    try {
      const res = await api.put(`/users/${userId}`, data);
      set(state => ({
        users: state.users.map(u => u.id === userId ? { ...u, ...res.data.user } : u)
      }));
    } catch (error) {
      console.error('Failed to update user', error);
      throw error;
    }
  }
}));
