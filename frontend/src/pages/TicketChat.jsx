import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTicketStore } from '../store/ticketStore';
import { useAuthStore } from '../store/authStore';
import { useUserStore } from '../store/userStore';
import { ArrowLeft, Send, Loader2, User, Paperclip, X, Trash2, ChevronDown, Info, MoreVertical } from 'lucide-react';
import { io } from 'socket.io-client';

const TicketChat = () => {
  const { ticketId } = useParams();
  const navigate = useNavigate();
  const { currentTicket, messages, fetchTicketDetails, addMessage, deleteTicket, isLoading } = useTicketStore();
  const { user, token } = useAuthStore();
  const { users, fetchUsers } = useUserStore();
  const [newMessage, setNewMessage] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const socketRef = useRef(null);
  const scrollRef = useRef(null);
  const fileInputRef = useRef(null);

  const [selectedFile, setSelectedFile] = useState(null);

  const [showAssignModal, setShowAssignModal] = useState(false);
  const [pendingAgentId, setPendingAgentId] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef(null);
  const mobileMenuRef = useRef(null);
  
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const statusDropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target)) {
        setIsStatusDropdownOpen(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
        setIsMobileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectAgent = (agentId) => {
    setPendingAgentId(agentId);
    setShowAssignModal(true);
    setIsDropdownOpen(false);
  };

  const confirmAssignment = async () => {
    try {
      await useTicketStore.getState().updateTicket(ticketId, { agent_id: pendingAgentId || null });
      setShowAssignModal(false);
    } catch (e) {
      console.error(e);
    }
  };

  const filteredAgents = (users || [])
    .filter(u => `${u?.name} ${u?.email}`.toLowerCase().includes(searchQuery.toLowerCase()))
    .slice(0, 5);

  useEffect(() => {
    fetchTicketDetails(ticketId);
    useTicketStore.getState().clearUnreadCount(ticketId);
    fetchUsers();

    // Initialize Socket
    const API_BASE = import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? '' : 'http://127.0.0.1:5000');
    socketRef.current = io(API_BASE, {
      auth: { token }
    });

    socketRef.current.emit('join_ticket', ticketId);

    socketRef.current.on('receive_message', (message) => {
      addMessage(message);
    });

    return () => {
      socketRef.current.disconnect();
    };
  }, [ticketId, token]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!newMessage.trim() && !selectedFile) return;

    let attachmentUrl = null;

    if (selectedFile) {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('file', selectedFile);

      try {
        const API_BASE = import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? '' : 'http://127.0.0.1:5000');
        const response = await fetch(`${API_BASE}/api/attachments/upload`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });
        
        const data = await response.json();
        if (response.ok && data.url) {
          attachmentUrl = data.url;
        } else {
          console.error('Upload failed', data);
          setIsUploading(false);
          return;
        }
      } catch (error) {
        console.error('Error uploading file', error);
        setIsUploading(false);
        return;
      }
    }

    socketRef.current.emit('send_message', {
      ticketId,
      senderId: user.id,
      message: newMessage.trim() || (attachmentUrl ? 'Sent an attachment' : ''),
      isFromAgent: ['Admin', 'Manager', 'Agent'].includes(user?.role_name),
      attachmentUrl
    });

    setNewMessage('');
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setIsUploading(false);
  };

  const [showDeleteModal, setShowDeleteModal] = useState(false);

  if (isLoading && !currentTicket) {
    return <div className="flex-1 flex items-center justify-center bg-background"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  const canAssign = ['Admin', 'Manager', 'Agent'].includes(user?.role_name);
  const canChangeStatus = canAssign || currentTicket?.agent_id === user?.id;

  const handleUpdateStatus = async (newStatus) => {
    setIsStatusDropdownOpen(false);
    try {
      await useTicketStore.getState().updateTicket(ticketId, { status: newStatus });
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteTicket(ticketId);
      navigate('/tickets');
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#08090A] overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-6 border-b border-border bg-surface/80 backdrop-blur-md z-10 shadow-sm shrink-0 relative">
        <div className="flex items-start sm:items-center gap-3 sm:gap-4 min-w-0">
          <button onClick={() => navigate('/tickets')} className="p-2 mt-0.5 sm:mt-0 bg-background border border-border rounded-lg hover:bg-surface transition-colors shrink-0">
            <ArrowLeft className="w-4 h-4 text-foreground/70" />
          </button>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <h1 className="text-lg sm:text-xl font-bold truncate">
                {currentTicket?.subject} 
              </h1>
              <span className={`text-[10px] sm:text-xs px-2 py-0.5 rounded-full border whitespace-nowrap ${
                currentTicket?.status === 'Open' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
                currentTicket?.status === 'Resolved' || currentTicket?.status === 'Closed' ? 'bg-slate-500/10 text-slate-500 border-slate-500/20' :
                'bg-blue-500/10 text-blue-500 border-blue-500/20'
              }`}>{currentTicket?.status}</span>
              
              <div className="relative group flex items-center shrink-0">
                <Info className="w-4 h-4 sm:w-5 sm:h-5 text-foreground/50 hover:text-primary cursor-pointer transition-colors" />
                <div className="absolute top-full mt-2 left-0 sm:left-auto w-[280px] sm:w-80 p-4 bg-surface border border-border rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 pointer-events-none">
                  <p className="text-xs font-bold text-foreground/40 mb-2 uppercase tracking-wider">Description</p>
                  <p className="text-xs sm:text-sm text-foreground whitespace-pre-wrap font-normal leading-relaxed">{currentTicket?.description}</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs text-foreground/50">
              <div className="flex items-center gap-2">
                <span className="whitespace-nowrap">Ticket #{currentTicket?.id}</span>
                <span>•</span>
                <span className="whitespace-nowrap">{currentTicket?.priority} Priority</span>
              </div>
              
              {currentTicket?.user_name && (
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="hidden sm:inline">•</span>
                  <span className="whitespace-nowrap">Created by <strong className="text-foreground/80">{currentTicket.user_name}</strong></span>
                  {currentTicket.user_department && <span className="text-[8px] sm:text-[9px] leading-none bg-blue-500/10 text-blue-500 px-1 py-[2px] rounded uppercase font-bold tracking-wider">{currentTicket.user_department}</span>}
                  {currentTicket.user_role && <span className="text-[8px] sm:text-[9px] leading-none bg-background border border-border text-foreground/60 px-1 py-[2px] rounded uppercase font-bold tracking-wider">{currentTicket.user_role}</span>}
                </div>
              )}

              {currentTicket?.agent_name && (
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="hidden sm:inline">•</span>
                  <span className="whitespace-nowrap">Assigned to <strong className="text-foreground/80">{currentTicket.agent_name}</strong></span>
                  {currentTicket.agent_department && <span className="text-[8px] sm:text-[9px] leading-none bg-blue-500/10 text-blue-500 px-1 py-[2px] rounded uppercase font-bold tracking-wider">{currentTicket.agent_department}</span>}
                  {currentTicket.agent_role && <span className="text-[8px] sm:text-[9px] leading-none bg-background border border-border text-foreground/60 px-1 py-[2px] rounded uppercase font-bold tracking-wider">{currentTicket.agent_role}</span>}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Agent Controls */}
        <div className="absolute top-4 right-4 sm:static flex items-center gap-2 z-20" ref={mobileMenuRef}>
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
            className="sm:hidden p-1 text-foreground/50 hover:text-foreground transition-colors"
          >
            <MoreVertical className="w-5 h-5 text-foreground/70" />
          </button>
          
          <div className={`
            ${isMobileMenuOpen ? 'absolute top-full right-0 mt-2 p-3 bg-surface border border-border rounded-xl shadow-xl z-50 flex flex-col w-64' : 'hidden'}
            sm:flex sm:static sm:p-0 sm:bg-transparent sm:border-0 sm:shadow-none sm:flex-row sm:items-center gap-2 sm:gap-3 sm:w-auto
          `}>
          {canAssign && (
            <>
              <div className="relative w-full sm:w-auto" ref={dropdownRef}>
                <div 
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="w-full px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold bg-surface border border-border rounded-lg cursor-pointer hover:border-primary transition-colors flex items-center justify-between sm:min-w-[200px] gap-2"
                >
                  <span className="truncate">
                    {currentTicket?.agent_name || 'Unassigned'}
                  </span>
                  <ChevronDown className="w-4 h-4 text-foreground/50" />
                </div>
                {isDropdownOpen && (
                  <div className="absolute top-full right-0 sm:left-0 sm:right-auto mt-1 w-[260px] sm:w-[280px] bg-surface border border-border shadow-xl rounded-lg z-50 overflow-hidden">
                    <input 
                      type="text"
                      autoFocus
                      placeholder="Search name or email..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full px-3 py-2 bg-background border-b border-border text-sm outline-none focus:bg-surface transition-colors"
                    />
                    <div className="max-h-48 overflow-y-auto custom-scrollbar">
                      <div 
                        onClick={() => handleSelectAgent('')}
                        className="px-3 py-2 text-sm hover:bg-primary/10 cursor-pointer border-b border-border/50 text-foreground/70"
                      >
                        Unassigned
                      </div>
                      {filteredAgents.map(a => (
                        <div 
                          key={a.id}
                          onClick={() => handleSelectAgent(a.id)}
                          className="px-3 py-2 text-sm hover:bg-primary/10 cursor-pointer border-b border-border/50 last:border-0"
                        >
                          <div className="font-semibold text-foreground flex justify-between items-center">
                            {a.name}
                            <div className="flex gap-1.5 ml-2">
                              <span className="text-[9px] leading-none font-bold uppercase tracking-wider bg-blue-500/10 text-blue-500 px-1.5 py-1 rounded">
                                {a.department || 'Support'}
                              </span>
                              <span className="text-[9px] leading-none font-bold uppercase tracking-wider bg-background border border-border text-foreground/60 px-1.5 py-1 rounded">
                                {a.role_name || 'User'}
                              </span>
                            </div>
                          </div>
                          <div className="text-xs text-foreground/60 truncate">{a.email}</div>
                        </div>
                      ))}
                      {filteredAgents.length === 0 && (
                        <div className="px-3 py-3 text-sm text-foreground/50 text-center">No agents found</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
          
          {canChangeStatus && (
            <div className="relative w-full sm:w-auto" ref={statusDropdownRef}>
                <div 
                  onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                  className="w-full px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold bg-surface border border-border rounded-lg cursor-pointer hover:border-primary transition-colors flex items-center justify-between sm:min-w-[160px] gap-2"
                >
                  <span className="truncate">
                    {currentTicket?.status || 'Open'}
                  </span>
                  <ChevronDown className="w-4 h-4 text-foreground/50" />
                </div>
                {isStatusDropdownOpen && (
                  <div className="absolute top-full right-0 sm:left-0 sm:right-auto mt-1 w-full min-w-[150px] bg-surface border border-border shadow-xl rounded-lg z-50 overflow-hidden">
                    <div className="py-1">
                      {['Open', 'In Progress', 'Resolved', 'Closed'].map(status => (
                        <div 
                          key={status}
                          onClick={() => handleUpdateStatus(status)}
                          className={`px-4 py-2 text-sm cursor-pointer transition-colors ${
                            currentTicket?.status === status 
                              ? 'bg-primary/10 text-primary font-bold' 
                              : 'text-foreground/80 hover:bg-surface hover:text-foreground'
                          }`}
                        >
                          {status}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
          )}
          {user?.role_name === 'Admin' && (
            <button 
              onClick={() => setShowDeleteModal(true)}
              className="w-full sm:w-auto p-2 text-red-500 bg-red-500/10 hover:bg-red-500 hover:text-white rounded-lg border border-red-500/20 transition-colors sm:ml-2 flex justify-center items-center"
              title="Delete Ticket"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-[#08090A]">

        {messages?.map((msg, idx) => {
          const isSystem = msg.message?.startsWith('[SYSTEM]');
          const isMe = msg.sender_id === user?.id;
          
          const msgDate = new Date(msg.created_at || Date.now());
          const dateStr = msgDate.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
          
          let showDate = false;
          if (idx === 0) {
            showDate = true;
          } else {
            const prevDate = new Date(messages[idx - 1]?.created_at || Date.now());
            const prevDateStr = prevDate.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
            if (dateStr !== prevDateStr) showDate = true;
          }

          const today = new Date();
          const yesterday = new Date(today);
          yesterday.setDate(yesterday.getDate() - 1);
          
          let displayDate = dateStr;
          if (dateStr === today.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })) {
            displayDate = 'Today';
          } else if (dateStr === yesterday.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })) {
            displayDate = 'Yesterday';
          }
          
          return (
            <React.Fragment key={idx}>
              {showDate && (
                <div className="flex justify-center my-4">
                  <span className="bg-surface/80 border border-border/50 text-foreground/70 text-xs font-semibold px-3 py-1 rounded-full shadow-sm backdrop-blur-sm">
                    {displayDate}
                  </span>
                </div>
              )}
              
              {isSystem ? (
                <div className="flex justify-center my-3 px-2">
                  <div className="bg-primary/10 border border-primary/20 rounded-xl shadow-sm text-center max-w-[90%] sm:max-w-md w-fit px-4 py-2">
                    <p className="text-primary text-xs font-medium leading-relaxed">
                      {msg?.message?.replace('[SYSTEM] ', '')}
                      <span className="text-primary/60 text-[10px] ml-2 block sm:inline">
                        {new Date(msg?.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </p>
                  </div>
                </div>
              ) : (
                <div className={`flex w-full mb-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`relative px-4 py-[6px] shadow-sm max-w-[85%] sm:max-w-[70%] flex flex-col ${
                    isMe 
                      ? 'bg-[#0084FF] text-white rounded-[20px] rounded-br-[4px]' 
                      : 'bg-white dark:bg-[#1E293B] text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700/50 rounded-[20px] rounded-bl-[4px]'
                  }`}>
                    {!isMe && msg?.sender_name && (
                      <div className="text-[11px] font-bold text-primary mb-0.5 truncate pr-2">
                        {msg.sender_name}
                      </div>
                    )}
                    {msg?.attachment_url && (
                      <div className="mt-1 mb-2">
                        {msg?.attachment_url?.match(/\.(jpeg|jpg|gif|png)$/i) ? (
                          <img src={msg?.attachment_url} alt="Attachment" className="max-w-full sm:max-w-[250px] rounded-xl shadow-sm border border-black/10" />
                        ) : (
                          <a href={msg?.attachment_url} target="_blank" rel="noopener noreferrer" className={`flex items-center gap-2 p-3 rounded-xl border ${isMe ? 'bg-white/10 border-white/20 hover:bg-white/20' : 'bg-background border-border hover:bg-surface'} transition-colors`}>
                            <Paperclip className="w-4 h-4 flex-shrink-0" />
                            <span className="text-sm font-medium underline underline-offset-2">View Attachment</span>
                          </a>
                        )}
                      </div>
                    )}
                    <div className="text-[14.5px] leading-snug break-words flex flex-wrap items-end justify-end gap-x-3 gap-y-0.5">
                      <span className="text-left w-full sm:w-auto flex-1 pb-[2px]">{msg?.message}</span>
                      <span className={`text-[10px] font-medium whitespace-nowrap ${isMe ? 'text-white/70' : 'text-slate-500 dark:text-slate-400'}`}>
                        {new Date(msg?.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </React.Fragment>
          );
        })}
        <div ref={scrollRef} />
      </div>

      {/* Input Area */}
      <div className="p-3 sm:p-4 bg-surface border-t border-border flex flex-col gap-2 shrink-0 z-10 relative">
        {selectedFile && (
          <div className="mx-auto w-full max-w-4xl">
            <div className="relative inline-flex items-center gap-3 p-3 rounded-xl border border-primary/30 bg-primary/5">
              <Paperclip className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              <div className="text-xs sm:text-sm font-medium pr-6 truncate max-w-[150px] sm:max-w-[200px]">
                {selectedFile.name}
              </div>
              <button 
                type="button" 
                onClick={() => { setSelectedFile(null); if(fileInputRef.current) fileInputRef.current.value = ''; }}
                className="absolute top-1.5 right-1.5 sm:top-1 sm:right-1 p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded-full transition-colors"
                title="Remove attachment"
              >
                <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            </div>
          </div>
        )}
        <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto w-full flex gap-2 sm:gap-3 relative">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileSelect} 
            className="hidden" 
            accept="image/*,.pdf,.doc,.docx"
          />
          <button 
            type="button" 
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="shrink-0 p-3 sm:p-4 bg-background border border-border rounded-xl sm:rounded-2xl text-foreground/50 hover:text-primary hover:border-primary/50 transition-colors disabled:opacity-50"
            title="Attach file"
          >
            {isUploading ? <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin text-primary" /> : <Paperclip className="w-4 h-4 sm:w-5 sm:h-5" />}
          </button>
          <input 
            type="text" 
            value={newMessage} 
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message to support..."
            className="flex-1 bg-background border border-border px-4 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all shadow-inner text-sm"
            disabled={isUploading}
          />
          <button 
            type="submit" 
            disabled={(!newMessage.trim() && !selectedFile) || isUploading}
            className="shrink-0 px-4 sm:px-6 py-3 sm:py-4 bg-[#181B21] border border-slate-700/50 text-primary font-bold rounded-xl sm:rounded-2xl hover:bg-[#2A2F3A] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm flex items-center justify-center min-w-[50px] sm:min-w-[64px]"
          >
            {isUploading ? <Loader2 className="w-5 h-5 animate-spin text-primary" /> : <Send className="w-5 h-5" />}
          </button>
        </form>
      </div>

      {showAssignModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-2xl p-6 max-w-sm w-full shadow-2xl relative overflow-hidden">
            <h2 className="text-xl font-bold text-foreground mb-3">Confirm Assignment</h2>
            <p className="text-foreground/70 text-sm mb-6">
              Are you sure you want to assign this ticket to {pendingAgentId ? (users || []).find(u => u.id === pendingAgentId)?.name : 'Unassigned'}?
              {pendingAgentId && ' They will receive an email notification.'}
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowAssignModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-border font-semibold hover:bg-background transition-colors text-foreground text-sm"
              >
                Cancel
              </button>
              <button 
                onClick={confirmAssignment}
                className="flex-1 py-2.5 rounded-xl bg-[#181B21] border border-slate-700/50 text-white font-semibold hover:bg-[#2A2F3A] transition-colors text-sm shadow-sm"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-2xl p-6 max-w-sm w-full shadow-2xl relative overflow-hidden">
            <h2 className="text-xl font-bold text-foreground mb-3">Delete Ticket?</h2>
            <p className="text-foreground/70 text-sm mb-6">Are you sure you want to permanently delete this ticket? This action cannot be undone.</p>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-border font-semibold hover:bg-background transition-colors text-foreground text-sm"
              >
                Cancel
              </button>
              <button 
                onClick={handleDelete}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-semibold hover:bg-red-600 transition-colors text-sm"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

class TicketChatErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("TicketChat Error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 bg-red-50 text-red-600 h-full overflow-auto">
          <h2 className="text-xl font-bold mb-4">Something went wrong in TicketChat.</h2>
          <pre className="text-xs bg-red-100 p-4 rounded-lg whitespace-pre-wrap font-mono">
            {this.state.error && this.state.error.toString()}
            <br />
            {this.state.errorInfo && this.state.errorInfo.componentStack}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function TicketChatWrapper() {
  return (
    <TicketChatErrorBoundary>
      <TicketChat />
    </TicketChatErrorBoundary>
  );
}
