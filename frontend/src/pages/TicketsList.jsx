import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTicketStore } from '../store/ticketStore';
import { motion } from 'framer-motion';
import { Ticket, Plus, Loader2, MessageSquare, Clock, Search, ChevronRight, Flame, Lightbulb, HelpCircle, AlertCircle, User as UserIcon } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

const TicketsList = () => {
  const { tickets, fetchTickets, createTicket, isLoading, unreadCounts } = useTicketStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [newTicket, setNewTicket] = useState({ subject: '', description: '', priority: 'Medium', ticketType: 'Question', department: 'Support' });
  const [searchQuery, setSearchQuery] = useState('');

  const isStaff = ['Admin', 'Manager', 'Agent'].includes(user?.role_name);
  const [activeTab, setActiveTab] = useState(isStaff ? 'All' : 'Created by me');

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    const created = await createTicket(newTicket.subject, newTicket.description, newTicket.priority, newTicket.ticketType, newTicket.department);
    setShowModal(false);
    setNewTicket({ subject: '', description: '', priority: 'Medium', ticketType: 'Question', department: 'Support' });
    if(created) navigate(`/tickets/${created.id}`);
  };

  const getTicketsByTab = (tabName) => {
    return tickets.filter(ticket => {
      if (tabName === 'Resolved') {
        if (!isStaff) return ticket.status === 'Resolved' && (ticket.user_id === user.id || ticket.agent_id === user.id);
        if (user.role_name === 'Agent') return ticket.status === 'Resolved' && (ticket.agent_id === user.id || ticket.user_id === user.id);
        return ticket.status === 'Resolved';
      }
      
      const isNotResolved = ticket.status !== 'Resolved';
      if (tabName === 'Created by me') return isNotResolved && ticket.user_id === user.id;
      if (tabName === 'Assigned to me') return isNotResolved && ticket.agent_id === user.id;
      if (!isStaff) return false;
      return isNotResolved; // All
    });
  };

  const displayedTickets = getTicketsByTab(activeTab).filter(ticket => {
    if (!searchQuery) return true;
    const lowerQuery = searchQuery.toLowerCase();
    const formattedId = `#tc-${ticket.id}`.toLowerCase();
    return ticket.subject?.toLowerCase().includes(lowerQuery) || 
           formattedId.includes(lowerQuery) ||
           ticket.id?.toString().includes(lowerQuery) ||
           ticket.agent_name?.toLowerCase().includes(lowerQuery) ||
           ticket.user_name?.toLowerCase().includes(lowerQuery);
  });

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-background">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">Support Tickets</h1>
            <p className="text-foreground/60">Get help or manage customer support requests.</p>
          </div>
          
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40" />
              <input 
                type="text"
                placeholder="Search tickets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-surface border border-border rounded-xl text-sm outline-none focus:border-primary transition-colors"
              />
            </div>
            <button 
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 bg-[#2A2F3A] hover:bg-[#343A46] text-white border border-slate-700/50 px-5 py-2.5 rounded-xl font-semibold transition-all active:scale-95 shadow-sm whitespace-nowrap"
            >
              <Plus className="w-5 h-5" /> <span className="hidden sm:inline">New Ticket</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-6 border-b border-border pb-1 overflow-x-auto custom-scrollbar">
          {isStaff ? (
            ['All', 'Assigned to me', 'Created by me', 'Resolved'].map((tab) => {
              const count = getTicketsByTab(tab).length;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 text-sm font-bold rounded-t-lg transition-colors border-b-2 whitespace-nowrap flex items-center gap-2 ${
                    activeTab === tab 
                      ? 'border-primary text-primary bg-primary/5' 
                      : 'border-transparent text-foreground/50 hover:text-foreground/80 hover:bg-surface'
                  }`}
                >
                  {tab}
                  <span className={`text-xs font-bold ${activeTab === tab ? 'text-primary' : 'text-primary/70'}`}>
                    ({count})
                  </span>
                </button>
              );
            })
          ) : (
            ['Created by me', 'Assigned to me', 'Resolved'].map((tab) => {
              const count = getTicketsByTab(tab).length;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 text-sm font-bold rounded-t-lg transition-colors border-b-2 whitespace-nowrap flex items-center gap-2 ${
                    activeTab === tab 
                      ? 'border-primary text-primary bg-primary/5' 
                      : 'border-transparent text-foreground/50 hover:text-foreground/80 hover:bg-surface'
                  }`}
                >
                  {tab}
                  <span className={`text-xs font-bold ${activeTab === tab ? 'text-primary' : 'text-primary/70'}`}>
                    ({count})
                  </span>
                </button>
              );
            })
          )}
        </div>

        {isLoading && tickets.length === 0 ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : (
          <div className="flex flex-col gap-3 sm:gap-4">
            {displayedTickets.length > 0 && (
              <div className="text-sm font-semibold text-foreground/50 mb-1">
                Showing {displayedTickets.length} tickets
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {displayedTickets.map((ticket, idx) => {
                const getPriorityStyle = (priority) => {
                  if (priority === 'High') return 'bg-red-500/10 text-red-500 border-red-500/20';
                  if (priority === 'Medium') return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
                  return 'bg-green-500/10 text-green-500 border-green-500/20';
                };

                const getTypeContent = (type) => {
                  if (type === 'Incident') return { icon: Flame, text: 'Incident' };
                  if (type === 'Suggestion') return { icon: Lightbulb, text: 'Suggestion' };
                  if (type === 'Problem') return { icon: AlertCircle, text: 'Problem' };
                  return { icon: HelpCircle, text: 'Question' };
                };

                const { icon: TypeIcon, text: typeText } = getTypeContent(ticket.ticket_type);

                const isOwner = ticket.user_id === user?.id;
                const dbUnreadCount = isOwner ? ticket.user_unread_count : ticket.agent_unread_count;
                const liveUnreadCount = unreadCounts && unreadCounts[ticket.id] > 0 ? unreadCounts[ticket.id] : 0;
                const displayUnread = Math.max(dbUnreadCount || 0, liveUnreadCount || 0);

                return (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
                    key={ticket.id}
                    onClick={() => navigate(`/tickets/${ticket.id}`)}
                    className="flex flex-col gap-4 p-4 sm:p-5 bg-surface border border-border rounded-xl shadow-sm hover:shadow-md hover:border-primary/40 hover:bg-background/30 cursor-pointer transition-all group relative"
                  >
                    {/* Top Row: ID & Badges */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-foreground/40 text-[11px] font-bold tracking-wider shrink-0 bg-background border border-border px-1.5 py-0.5 rounded shadow-sm">#TC-{ticket.id}</span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-background border border-border text-foreground/70 shadow-sm">
                          {ticket.department || 'Support'}
                        </span>
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-background border border-border rounded-full text-[10px] font-semibold text-foreground/70 shadow-sm">
                          <TypeIcon className="w-3 h-3" />
                          {typeText}
                        </div>
                      </div>
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[9px] font-bold uppercase tracking-wider shadow-sm shrink-0 ${getPriorityStyle(ticket.priority)}`}>
                        <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                        {ticket.priority}
                      </span>
                    </div>

                    {/* Middle Row: Subject */}
                    <div className="font-semibold text-base text-foreground group-hover:text-primary transition-colors pr-2 leading-snug">
                      {ticket.subject}
                    </div>
                    
                    {/* Metrics Row */}
                    {(displayUnread > 0 || ticket.message_count > 0) && (
                      <div className="flex items-center gap-2 mt-[-4px]">
                        {displayUnread > 0 && (
                          <span className="text-[10px] font-bold bg-green-500/20 text-green-500 px-1.5 py-0.5 rounded-md border border-green-500/20 shadow-sm" title="Unread Messages">
                            {displayUnread} New
                          </span>
                        )}
                        {ticket.message_count > 0 && (
                          <span className="flex items-center gap-1 text-[10px] font-bold bg-background border border-border text-foreground/50 px-1.5 py-0.5 rounded-md shadow-sm" title="Total Messages">
                            <MessageSquare className="w-3 h-3" />
                            {ticket.message_count}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Bottom Row: Users Footer */}
                    <div className="flex items-center justify-between pt-3 mt-auto border-t border-border/50">
                      <div className="flex items-center gap-1.5 sm:gap-2 min-w-0" title={`Created by: ${ticket.user_name || 'User'}`}>
                        <span className="hidden sm:inline text-[10px] text-foreground/40 font-medium shrink-0">Created by</span>
                        <div className="flex items-center gap-1.5 min-w-0 bg-background/50 border border-border/50 rounded-full pr-2.5 p-0.5 shadow-sm">
                          <div className="w-4 h-4 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                            <span className="text-[8px] font-bold">{ticket.user_id === user?.id ? 'Y' : (ticket.user_name?.charAt(0) || 'U')}</span>
                          </div>
                          <span className="truncate max-w-[70px] font-medium text-foreground/80 text-[10px] sm:text-[11px]">
                            {ticket.user_id === user?.id ? 'You' : (ticket.user_name?.split(' ')[0] || 'User')}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1.5 sm:gap-2 min-w-0" title={`Assigned to: ${ticket.agent_name || 'Unassigned'}`}>
                        <span className="hidden sm:inline text-[10px] text-foreground/40 font-medium shrink-0">Assigned to</span>
                        {ticket.agent_name ? (
                          <div className="flex items-center gap-1.5 min-w-0 bg-background/50 border border-border/50 rounded-full pr-2.5 p-0.5 shadow-sm">
                            <div className="w-4 h-4 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0">
                              <span className="text-[8px] font-bold">{ticket.agent_id === user?.id ? 'Y' : ticket.agent_name.charAt(0)}</span>
                            </div>
                            <span className="text-foreground/90 font-semibold truncate max-w-[70px] text-[10px] sm:text-[11px]">
                              {ticket.agent_id === user?.id ? 'You' : ticket.agent_name.split(' ')[0]}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[9px] sm:text-[10px] text-foreground/40 font-bold bg-background border border-border px-2 py-0.5 rounded uppercase tracking-wider shadow-sm">Unassigned</span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
            
            
            {displayedTickets.length === 0 && (
              <div className="py-16 text-center">
                <Ticket className="w-12 h-12 text-foreground/20 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground/60">No tickets found</h3>
                <p className="text-foreground/40 text-sm">No tickets match this filter or you haven't created any yet.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-surface border border-border rounded-[2rem] p-8 max-w-md w-full shadow-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-pink-500" />
            <h2 className="text-2xl font-bold mb-6">Create Support Ticket</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-sm font-medium pl-1 mb-1 block">Subject</label>
                <input 
                  type="text" required value={newTicket.subject} onChange={e => setNewTicket({...newTicket, subject: e.target.value})}
                  className="w-full p-3.5 rounded-xl bg-background border border-border focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                  placeholder="What do you need help with?"
                />
              </div>
              <div>
                <label className="text-sm font-medium pl-1 mb-1 block">Description</label>
                <textarea 
                  required value={newTicket.description} onChange={e => setNewTicket({...newTicket, description: e.target.value})}
                  className="w-full p-3.5 rounded-xl bg-background border border-border focus:ring-2 focus:ring-primary/50 outline-none transition-all min-h-[100px] resize-none"
                  placeholder="Provide all relevant details..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium pl-1 mb-1 block">Priority</label>
                  <select 
                    value={newTicket.priority} onChange={e => setNewTicket({...newTicket, priority: e.target.value})}
                    className="w-full p-3.5 rounded-xl bg-background border border-border focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium pl-1 mb-1 block">Type</label>
                  <select 
                    value={newTicket.ticketType} onChange={e => setNewTicket({...newTicket, ticketType: e.target.value})}
                    className="w-full p-3.5 rounded-xl bg-background border border-border focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                  >
                    <option value="Question">Question</option>
                    <option value="Incident">Incident</option>
                    <option value="Problem">Problem</option>
                    <option value="Suggestion">Suggestion</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium pl-1 mb-1 block">Department</label>
                <select 
                  value={newTicket.department} onChange={e => setNewTicket({...newTicket, department: e.target.value})}
                  className="w-full p-3.5 rounded-xl bg-background border border-border focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                >
                  <option value="Technical">Technical</option>
                  <option value="Support">Support</option>
                  <option value="Accounts">Accounts</option>
                  <option value="HR">HR</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4 mt-2">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3.5 rounded-xl border border-border font-semibold hover:bg-surface transition-colors">Cancel</button>
                <button type="submit" disabled={isLoading} className="flex-1 py-3.5 rounded-xl bg-[#181B21] border border-slate-700/50 text-white font-semibold hover:bg-[#2A2F3A] flex justify-center transition-colors shadow-sm">
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin text-primary" /> : <span className="flex items-center gap-2"><Plus className="w-4 h-4 text-primary" /> Create Ticket</span>}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};
export default TicketsList;
