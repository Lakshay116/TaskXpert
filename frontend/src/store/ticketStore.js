import { create } from 'zustand';
import api from '../lib/api';
import { useNotificationStore } from './notificationStore';
import { playNotificationSound } from '../utils/audio';

export const useTicketStore = create((set, get) => ({
  tickets: [],
  currentTicket: null,
  messages: [],
  isLoading: false,
  error: null,

  fetchTickets: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.get('/tickets');
      set({ tickets: res.data.tickets, isLoading: false });
    } catch (error) {
      set({ isLoading: false, error: error.response?.data?.error?.message || 'Failed to fetch tickets' });
    }
  },

  createTicket: async (subject, description, priority, ticketType, department) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post('/tickets', { subject, description, priority, ticket_type: ticketType, department });
      set((state) => ({ 
        tickets: [res.data.ticket, ...state.tickets],
        isLoading: false 
      }));
      return res.data.ticket;
    } catch (error) {
      set({ isLoading: false, error: error.response?.data?.error?.message || 'Failed to create ticket' });
      throw error;
    }
  },

  fetchTicketDetails: async (ticketId) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.get(`/tickets/${ticketId}`);
      set((state) => ({ 
        currentTicket: res.data.ticket,
        messages: res.data.messages,
        tickets: state.tickets.map(t => t.id == ticketId ? { ...t, ...res.data.ticket } : t),
        isLoading: false 
      }));
    } catch (error) {
      set({ isLoading: false, error: 'Failed to fetch ticket details' });
    }
  },

  updateTicket: async (ticketId, updates) => {
    try {
      const res = await api.put(`/tickets/${ticketId}`, updates);
      set((state) => ({
        currentTicket: { ...state.currentTicket, ...res.data.ticket }
      }));
      return res.data.ticket;
    } catch (error) {
      console.error('Failed to update ticket:', error);
      throw error;
    }
  },

  deleteTicket: async (ticketId) => {
    try {
      await api.delete(`/tickets/${ticketId}`);
      set((state) => ({
        tickets: state.tickets.filter(t => t.id !== ticketId),
        currentTicket: null,
        messages: []
      }));
    } catch (error) {
      console.error('Failed to delete ticket:', error);
      throw error;
    }
  },

  addMessage: (message) => {
    set((state) => ({ messages: [...state.messages, message] }));
  },

  unreadCounts: {}, // { ticketId: count }
  globalSocket: null,

  connectGlobalSocket: (token, userId) => {
    const { globalSocket, unreadCounts } = get();
    if (globalSocket) return; // already connected

    import('socket.io-client').then(({ io }) => {
      import('react-hot-toast').then(({ toast }) => {
        const API_BASE = import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? '' : 'http://127.0.0.1:5000');
        const socket = io(API_BASE, { auth: { token } });
        
        socket.emit('register_user', userId);

        socket.on('ticket_notification', (data) => {
          // If we are currently viewing this ticket, don't show notification or increment count
          const currentTicketId = window.location.pathname.split('/tickets/')[1];
          if (currentTicketId === data.ticketId.toString()) return;

          playNotificationSound();

          // Increment unread count
          set((state) => ({
            unreadCounts: {
              ...state.unreadCounts,
              [data.ticketId]: (state.unreadCounts[data.ticketId] || 0) + 1
            }
          }));
        });

        socket.on('ticket_assigned', (data) => {
          playNotificationSound();
          toast(data.message || `You were assigned to Ticket #${data.ticketId}`, {
            duration: 5000,
            icon: '🎫',
            style: {
              background: 'var(--color-surface)',
              color: 'var(--color-primary)',
              fontWeight: 'bold',
              border: '1px solid var(--color-primary)'
            }
          });
        });

        socket.on('app_notification', (data) => {
          playNotificationSound();
          useNotificationStore.getState().fetchNotifications();
          
          if (data && data.type === 'task_assigned') {
            toast(data.message || 'You have been assigned to a new task!', {
              duration: 5000,
              icon: '📋',
              style: {
                background: 'var(--color-surface)',
                color: 'var(--color-primary)',
                fontWeight: 'bold',
                border: '1px solid var(--color-primary)'
              }
            });
          }
        });

        set({ globalSocket: socket });
      });
    });
  },

  clearUnreadCount: (ticketId) => {
    set((state) => ({
      unreadCounts: {
        ...state.unreadCounts,
        [ticketId]: 0
      }
    }));
  }
}));
