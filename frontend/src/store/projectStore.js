import { create } from 'zustand';
import api from '../lib/api';

export const useProjectStore = create((set) => ({
  projects: [],
  currentProject: null,
  isLoading: false,
  error: null,

  fetchProjects: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.get('/projects');
      set({ projects: res.data.projects, isLoading: false });
    } catch (error) {
      set({ isLoading: false, error: error.response?.data?.error?.message || 'Failed to load projects' });
    }
  },

  fetchProjectById: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.get(`/projects/${id}`);
      set({ currentProject: res.data.project, isLoading: false });
    } catch (error) {
      set({ isLoading: false, error: error.response?.data?.error?.message || 'Failed to load project details' });
    }
  },

  createProject: async (name, description, department, project_type) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post('/projects', { name, description, department, project_type });
      set((state) => ({ 
        projects: [res.data.project, ...state.projects],
        isLoading: false 
      }));
      return res.data;
    } catch (error) {
      set({ isLoading: false, error: error.response?.data?.error?.message || 'Failed to create project' });
      throw error;
    }
  },

  updateProject: async (projectId, updates) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.put(`/projects/${projectId}`, updates);
      set((state) => ({
        projects: state.projects.map(p => p.id === projectId ? { ...p, ...res.data.project } : p),
        currentProject: state.currentProject?.id === projectId ? { ...state.currentProject, ...res.data.project } : state.currentProject,
        isLoading: false
      }));
      return res.data;
    } catch (error) {
      set({ isLoading: false, error: error.response?.data?.error?.message || 'Failed to update project' });
      throw error;
    }
  },

  deleteProject: async (projectId) => {
    try {
      await api.delete(`/projects/${projectId}`);
      set((state) => ({
        projects: state.projects.filter(p => p.id !== projectId),
        currentProject: state.currentProject?.id === projectId ? null : state.currentProject
      }));
    } catch (error) {
      console.error('Failed to delete project', error);
      throw error;
    }
  }
}));
