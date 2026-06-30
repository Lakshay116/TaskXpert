import { create } from 'zustand';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? '' : 'http://localhost:5000');
const API_URL = `${API_BASE}/api/auth`;

const getUserFromStorage = () => {
  try {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  } catch (e) {
    return null;
  }
};

export const useAuthStore = create((set) => ({
  user: getUserFromStorage(),
  token: localStorage.getItem('token') || null,
  isLoading: false,
  error: null,

  setToken: (token) => set({ token }),

  register: async (name, email, password, organization_name) => {
    set({ isLoading: true, error: null });
    try {
      const res = await axios.post(`${API_URL}/register`, { name, email, password, organization_name });
      set({ isLoading: false });
      return res.data;
    } catch (error) {
      set({ isLoading: false, error: error.response?.data?.error?.message || 'Registration failed' });
      throw error;
    }
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const res = await axios.post(`${API_URL}/login`, { email, password });
      localStorage.setItem('token', res.data.accessToken);
      if (res.data.refreshToken) {
        localStorage.setItem('refreshToken', res.data.refreshToken);
      }
      localStorage.setItem('user', JSON.stringify(res.data.user));
      set({ user: res.data.user, token: res.data.accessToken, isLoading: false });
      return res.data;
    } catch (error) {
      set({ isLoading: false, error: error.response?.data?.error?.message || 'Login failed' });
      throw error;
    }
  },

  googleLogin: async (tokenId) => {
    set({ isLoading: true, error: null });
    try {
      const res = await axios.post(`${API_URL}/google`, { token: tokenId });
      localStorage.setItem('token', res.data.accessToken);
      if (res.data.refreshToken) {
        localStorage.setItem('refreshToken', res.data.refreshToken);
      }
      localStorage.setItem('user', JSON.stringify(res.data.user));
      set({ user: res.data.user, token: res.data.accessToken, isLoading: false });
      return res.data;
    } catch (error) {
      set({ isLoading: false, error: error.response?.data?.error?.message || 'Google login failed' });
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    set({ user: null, token: null });
  }
}));
