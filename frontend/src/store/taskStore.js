import { create } from 'zustand';
import api from '../lib/api';

export const useTaskStore = create((set) => ({
  tasks: [],
  isLoading: false,
  error: null,

  fetchTasks: async (projectId) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.get(`/tasks/project/${projectId}`);
      set({ tasks: res.data.tasks, isLoading: false });
    } catch (error) {
      set({ isLoading: false, error: error.response?.data?.error?.message || 'Failed to load tasks' });
    }
  },

  fetchTaskTimeline: async (taskId) => {
    try {
      const res = await api.get(`/tasks/${taskId}/timeline`);
      return res.data.timeline;
    } catch (error) {
      console.error('Failed to fetch timeline', error);
      return [];
    }
  },

  createTask: async (taskData) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post('/tasks', taskData);
      set((state) => ({ 
        tasks: [res.data.task, ...state.tasks],
        isLoading: false 
      }));
      return res.data;
    } catch (error) {
      set({ isLoading: false, error: error.response?.data?.error?.message || 'Failed to create task' });
      throw error;
    }
  },

  updateTaskStatus: async (taskId, newStatus) => {
    try {
      set((state) => ({
        tasks: state.tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t)
      }));
      await api.put(`/tasks/${taskId}`, { status: newStatus });
    } catch (error) {
      console.error('Failed to update task status', error);
    }
  },

  updateTask: async (taskId, updates) => {
    try {
      set((state) => ({
        tasks: state.tasks.map(t => t.id === taskId ? { ...t, ...updates } : t)
      }));
      await api.put(`/tasks/${taskId}`, updates);
    } catch (error) {
      console.error('Failed to update task', error);
    }
  },

  deleteTask: async (taskId) => {
    try {
      await api.delete(`/tasks/${taskId}`);
      set((state) => ({
        tasks: state.tasks.filter(t => t.id !== taskId)
      }));
    } catch (error) {
      console.error('Failed to delete task', error);
      throw error;
    }
  }
}));
