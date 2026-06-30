import { create } from 'zustand';
import api from '../lib/api';

const DEFAULT_WELCOME = {
  role: 'assistant',
  content: 'Hello! I am **TaskXpertAI**, your intelligent workspace assistant. 🚀\n\nI am connected to your workspace, projects, tasks, and support tickets. You can chat with me normally, or use the **Quick Actions** panel on the left to run summaries and draft responses. How can I assist you today?',
  timestamp: new Date().toISOString()
};

const loadSessionsFromStorage = () => {
  try {
    const data = localStorage.getItem('taskxpertbot_sessions');
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('Failed to load chat history', e);
    return [];
  }
};

const saveSessionsToStorage = (sessions) => {
  try {
    localStorage.setItem('taskxpertbot_sessions', JSON.stringify(sessions));
  } catch (e) {
    console.error('Failed to save chat history', e);
  }
};

export const useAIStore = create((set, get) => ({
  sessions: loadSessionsFromStorage(),
  activeSessionId: null,
  messages: [DEFAULT_WELCOME],
  isLoading: false,
  error: null,

  startNewChat: () => {
    set({
      activeSessionId: null,
      messages: [DEFAULT_WELCOME],
      error: null
    });
  },

  switchSession: (sessionId) => {
    const { sessions } = get();
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      set({
        activeSessionId: sessionId,
        messages: session.messages,
        error: null
      });
    }
  },

  deleteSession: (sessionId) => {
    const { sessions, activeSessionId } = get();
    const updatedSessions = sessions.filter(s => s.id !== sessionId);
    saveSessionsToStorage(updatedSessions);
    
    set({ sessions: updatedSessions });

    // If we deleted the currently active session, start a new chat
    if (activeSessionId === sessionId) {
      get().startNewChat();
    }
  },

  clearHistory: () => {
    saveSessionsToStorage([]);
    set({
      sessions: [],
      activeSessionId: null,
      messages: [DEFAULT_WELCOME],
      error: null
    });
  },

  sendMessage: async (userText, action = null, ticketId = null) => {
    set({ isLoading: true, error: null });

    const displayMsg = userText || (
      action === 'summarize_tasks' ? 'Summarize my workload' :
      action === 'analyze_projects' ? 'Analyze project progress' :
      action === 'draft_ticket_reply' ? `Draft professional response for ticket #${ticketId}` :
      'Requesting update...'
    );

    const newUserMessage = { role: 'user', content: displayMsg, timestamp: new Date().toISOString() };
    
    // Add user message to local array first
    const updatedMessages = [...get().messages, newUserMessage];
    set({ messages: updatedMessages });

    try {
      // Get the message history without the welcome message to keep the payload clean
      const history = updatedMessages
        .filter(m => m.content !== DEFAULT_WELCOME.content)
        .map(m => ({
          role: m.role,
          content: m.content
        }));

      const res = await api.post('/ai/chat', {
        message: displayMsg,
        history: history.slice(0, -1), // everything except the new message we just sent
        action,
        ticketId
      });

      const assistantMessage = {
        role: 'assistant',
        content: res.data.reply,
        timestamp: new Date().toISOString()
      };

      const finalMessages = [...updatedMessages, assistantMessage];
      set({ messages: finalMessages, isLoading: false });

      // Save/Update the session
      let { activeSessionId, sessions } = get();
      
      if (!activeSessionId) {
        // Create new session
        activeSessionId = Date.now().toString();
        
        // Generate title from first user query (max 25 chars)
        let title = displayMsg;
        if (title.length > 25) title = title.substring(0, 22) + '...';
        
        const newSession = {
          id: activeSessionId,
          title: title,
          messages: finalMessages,
          createdAt: new Date().toISOString()
        };
        
        const updatedSessions = [newSession, ...sessions];
        set({ activeSessionId, sessions: updatedSessions });
        saveSessionsToStorage(updatedSessions);
      } else {
        // Update existing session
        const updatedSessions = sessions.map(s => {
          if (s.id === activeSessionId) {
            return { ...s, messages: finalMessages };
          }
          return s;
        });
        set({ sessions: updatedSessions });
        saveSessionsToStorage(updatedSessions);
      }

    } catch (error) {
      const errMsg = error.response?.data?.error?.message || 'Failed to communicate with AI Assistant.';
      const finalMessages = [
        ...get().messages,
        { role: 'assistant', content: `❌ **Error**: ${errMsg}`, timestamp: new Date().toISOString() }
      ];
      
      set({
        messages: finalMessages,
        isLoading: false,
        error: errMsg
      });

      // Even if there is an error, we update the session so the error text is visible if they switch
      let { activeSessionId, sessions } = get();
      if (activeSessionId) {
        const updatedSessions = sessions.map(s => {
          if (s.id === activeSessionId) {
            return { ...s, messages: finalMessages };
          }
          return s;
        });
        set({ sessions: updatedSessions });
        saveSessionsToStorage(updatedSessions);
      }
    }
  }
}));
