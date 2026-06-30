import React from 'react';
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, MessageSquare, LogOut, Sun, Moon, FolderKanban, Layers, ChevronLeft, UserCircle, Shield, Bell, Menu, X, Sparkles } from 'lucide-react';
import useThemeStore from '../store/themeStore';
import { useAuthStore } from '../store/authStore';
import { useTicketStore } from '../store/ticketStore';
import { useNotificationStore } from '../store/notificationStore';
import { useEffect } from 'react';

const MainLayout = () => {
  const { theme, toggleTheme } = useThemeStore();
  const { logout, user, token } = useAuthStore();
  const { connectGlobalSocket, unreadCounts, tickets, fetchTickets } = useTicketStore();
  const { notifications, fetchNotifications, markAsRead, markAllAsRead } = useNotificationStore();
  const location = useLocation();
  const navigate = useNavigate();

  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = React.useState(false);
  const notifRef = React.useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (token && user?.id) {
      connectGlobalSocket(token, user.id);
      fetchTickets();
      fetchNotifications();
    }
  }, [token, user, fetchTickets, fetchNotifications]);

  const unreadTicketsList = (tickets || []).filter(ticket => {
    const isOwner = ticket.user_id === user?.id;
    const dbUnreadCount = isOwner ? ticket.user_unread_count : ticket.agent_unread_count;
    const liveUnreadCount = unreadCounts && unreadCounts[ticket.id] > 0 ? unreadCounts[ticket.id] : 0;
    return Math.max(dbUnreadCount || 0, liveUnreadCount || 0) > 0;
  });

  const unreadAppNotifications = (notifications || []).filter(n => !n.is_read);

  const totalUnreadTickets = unreadTicketsList.reduce((total, ticket) => {
    const isOwner = ticket.user_id === user?.id;
    const dbUnreadCount = isOwner ? ticket.user_unread_count : ticket.agent_unread_count;
    const liveUnreadCount = unreadCounts && unreadCounts[ticket.id] > 0 ? unreadCounts[ticket.id] : 0;
    return total + Math.max(dbUnreadCount || 0, liveUnreadCount || 0);
  }, 0);

  const totalUnreadBadge = totalUnreadTickets + unreadAppNotifications.length;

  return (
    <div className="flex flex-col md:flex-row h-screen bg-background overflow-hidden selection:bg-primary/30 text-foreground relative">
      
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-slate-200 dark:border-border bg-slate-50 dark:bg-[#181B21] z-30">
        <div className="flex items-center gap-2 flex-1 min-w-0 pr-4">
          <Layers className="w-6 h-6 text-primary flex-shrink-0" />
          <div className="flex flex-col flex-1 min-w-0">
            <span className="text-xl font-bold tracking-tight text-slate-800 dark:text-white leading-none">TaskXpert</span>
            {user?.organization_name && (
              <div className="flex flex-row items-center gap-1 mt-1 w-full">
                <span className="text-[10px] font-medium text-foreground/40 italic leading-none flex-shrink-0">for</span>
                <span className="text-[10px] font-bold tracking-wide uppercase text-primary leading-tight whitespace-nowrap">
                  {user.organization_name}
                </span>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative" ref={notifRef}>
            <button 
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className="relative w-8 h-8 rounded-full hover:bg-white/10 flex flex-shrink-0 items-center justify-center text-slate-400 hover:text-white transition-colors"
            >
              <Bell className="w-5 h-5" />
              {totalUnreadBadge > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-primary border-2 border-[#181B21]"></span>
              )}
            </button>
            {isNotificationsOpen && (
              <div className="absolute top-full right-0 mt-2 w-72 bg-[#2A2F3A] border border-slate-700/50 rounded-xl shadow-2xl z-50 overflow-hidden flex flex-col">
                <div className="p-3 border-b border-slate-700/50 bg-[#1F232B] flex items-center justify-between">
                  <span className="font-semibold text-white text-sm">Notifications</span>
                  <div className="flex items-center gap-2">
                    {unreadAppNotifications.length > 0 && (
                      <button onClick={markAllAsRead} className="text-[10px] text-slate-400 hover:text-primary transition-colors">
                        Mark all read
                      </button>
                    )}
                  </div>
                </div>
                <div className="max-h-80 overflow-y-auto custom-scrollbar flex flex-col">
                  {unreadAppNotifications.map(notif => (
                    <div 
                      key={notif.id}
                      onClick={() => {
                        markAsRead(notif.id);
                        if (notif.link_url) {
                          setIsNotificationsOpen(false);
                          navigate(notif.link_url);
                        }
                      }}
                      className={`p-3 border-b border-slate-700/50 last:border-0 hover:bg-white/5 cursor-pointer transition-colors ${!notif.is_read ? 'bg-primary/5' : ''}`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-xs font-semibold text-white pr-2 leading-tight">
                          {notif.title}
                        </span>
                        {!notif.is_read && (
                          <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0 mt-1"></span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                        {notif.message}
                      </p>
                    </div>
                  ))}
                  {unreadAppNotifications.length === 0 && (
                    <div className="p-6 text-center text-slate-500 text-sm">No new notifications</div>
                  )}
                </div>
              </div>
            )}
          </div>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-slate-400 hover:text-white transition-colors">
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 md:hidden" 
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`border-r border-slate-200 dark:border-border bg-slate-50 dark:bg-[#181B21] flex flex-col shadow-2xl z-50 md:z-20 transition-all duration-300 fixed md:relative h-full ${isCollapsed ? 'md:w-20' : 'w-72'} ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className={`p-6 flex items-center ${isCollapsed ? 'justify-center flex-col gap-4' : 'gap-3'}`}>
          <div className="flex items-center justify-center">
            <Layers className="w-7 h-7 text-primary flex-shrink-0" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col flex-1 min-w-0">
              <span className="text-xl font-bold tracking-tight text-slate-800 dark:text-white whitespace-nowrap transition-all leading-none">TaskXpert</span>
              {user?.organization_name && (
                <div className="flex flex-row items-center gap-1 mt-1 w-full">
                  <span className="text-[10px] font-medium text-foreground/40 italic leading-none flex-shrink-0">for</span>
                  <span className="text-[10px] font-bold tracking-wide uppercase text-primary leading-tight whitespace-nowrap">
                    {user.organization_name}
                  </span>
                </div>
              )}
            </div>
          )}
          
          <div className={`${isCollapsed ? '' : 'ml-auto'} hidden md:flex flex-col sm:flex-row items-center gap-2 relative`} ref={notifRef}>
            <button 
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className="relative w-8 h-8 rounded-full hover:bg-white/10 flex flex-shrink-0 items-center justify-center text-slate-400 hover:text-white transition-colors"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {totalUnreadBadge > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary border-2 border-[#181B21]"></span>
              )}
            </button>

            {isNotificationsOpen && (
              <div className="absolute top-full left-0 mt-2 w-72 bg-[#2A2F3A] border border-slate-700/50 rounded-xl shadow-2xl z-50 overflow-hidden flex flex-col">
                <div className="p-3 border-b border-slate-700/50 bg-[#1F232B] flex items-center justify-between">
                  <span className="font-semibold text-white text-sm">Notifications</span>
                  <div className="flex items-center gap-2">
                    {unreadAppNotifications.length > 0 && (
                      <button onClick={markAllAsRead} className="text-[10px] text-slate-400 hover:text-primary transition-colors">
                        Mark all read
                      </button>
                    )}
                    {totalUnreadBadge > 0 && (
                      <span className="text-[10px] font-bold bg-primary/20 text-primary px-1.5 py-0.5 rounded-md">
                        {totalUnreadBadge} New
                      </span>
                    )}
                  </div>
                </div>
                <div className="max-h-80 overflow-y-auto custom-scrollbar flex flex-col">
                  {unreadAppNotifications.map(notif => (
                    <div 
                      key={notif.id}
                      onClick={() => {
                        markAsRead(notif.id);
                        if (notif.link_url) {
                          setIsNotificationsOpen(false);
                          navigate(notif.link_url);
                        }
                      }}
                      className={`p-3 border-b border-slate-700/50 last:border-0 hover:bg-white/5 cursor-pointer transition-colors ${!notif.is_read ? 'bg-primary/5' : ''}`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-xs font-semibold text-white pr-2 leading-tight">
                          {notif.title}
                        </span>
                        {!notif.is_read && (
                          <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0 mt-1"></span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                        {notif.message}
                      </p>
                    </div>
                  ))}
                  
                  {unreadTicketsList.map(ticket => (
                    <div 
                      key={`ticket-${ticket.id}`}
                      onClick={() => {
                        setIsNotificationsOpen(false);
                        navigate(`/tickets/${ticket.id}`);
                      }}
                      className="p-3 border-b border-slate-700/50 last:border-0 hover:bg-white/5 cursor-pointer transition-colors"
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-xs font-semibold text-white truncate pr-2">
                          {ticket.subject}
                        </span>
                        <span className="text-[10px] text-primary whitespace-nowrap bg-primary/10 px-1 rounded">
                          Ticket Update
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 truncate mt-1">
                        Ticket #{ticket.id} • {ticket.department}
                      </p>
                    </div>
                  ))}

                  {unreadAppNotifications.length === 0 && unreadTicketsList.length === 0 && (
                    <div className="p-6 text-center text-slate-500 text-sm">
                      <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
                      No new notifications
                    </div>
                  )}
                </div>
              </div>
            )}

            <button 
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="w-5 h-5 rounded-full bg-primary flex flex-shrink-0 items-center justify-center text-primary-foreground shadow-sm transition-transform duration-300 hidden md:flex ml-1"
            >
              <ChevronLeft className={`w-3 h-3 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} strokeWidth={3} />
            </button>
          </div>
        </div>

        <div className={`px-3 flex-1 overflow-y-auto custom-scrollbar ${isCollapsed ? 'scrollbar-hide' : ''}`}>
          <div className="space-y-1">
            <Link 
              to="/dashboard"
              className={`flex items-center gap-3 rounded-lg transition-all font-medium ${isCollapsed ? 'justify-center px-0 py-2.5' : 'px-4 py-3'} ${
                location.pathname.startsWith('/dashboard')
                ? 'bg-slate-200/80 dark:bg-[#2A2F3A] text-slate-800 dark:text-primary font-semibold' 
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-[#2A2F3A]/50 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
              title="Overview"
            >
              <LayoutDashboard className="w-5 h-5 flex-shrink-0" />
              {!isCollapsed && <span className="whitespace-nowrap">Overview</span>}
            </Link>

            <Link 
              to="/ai-assistant"
              className={`flex items-center gap-3 rounded-lg transition-all font-medium ${isCollapsed ? 'justify-center px-0 py-2.5' : 'px-4 py-3'} ${
                location.pathname.startsWith('/ai-assistant')
                ? 'bg-slate-200/80 dark:bg-[#2A2F3A] text-slate-800 dark:text-primary font-semibold' 
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-[#2A2F3A]/50 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
              title="TaskXpertAI"
            >
              <Sparkles className="w-5 h-5 flex-shrink-0 text-primary animate-pulse" />
              {!isCollapsed && <span className="whitespace-nowrap font-semibold">TaskXpertAI</span>}
            </Link>
          </div>

          {!isCollapsed && <p className="px-4 text-[10px] font-bold text-primary tracking-widest mt-8 mb-3 uppercase whitespace-nowrap">PROJECT MANAGEMENT</p>}
          {isCollapsed && <div className="h-px bg-slate-700/50 w-8 mx-auto mt-4 mb-3"></div>}
          
          <div className="space-y-1">
            <Link 
              to="/projects"
              className={`flex items-center gap-3 rounded-lg transition-all font-medium ${isCollapsed ? 'justify-center px-0 py-2.5' : 'px-4 py-3'} ${
                location.pathname.startsWith('/projects')
                ? 'bg-slate-200/80 dark:bg-[#2A2F3A] text-slate-800 dark:text-primary font-semibold' 
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-[#2A2F3A]/50 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
              title="Projects"
            >
              <FolderKanban className="w-5 h-5 flex-shrink-0" />
              {!isCollapsed && <span className="whitespace-nowrap">Projects</span>}
            </Link>
          </div>

          {!isCollapsed && <p className="px-4 text-[10px] font-bold text-primary tracking-widest mt-8 mb-3 uppercase whitespace-nowrap">TICKETING SYSTEM</p>}
          {isCollapsed && <div className="h-px bg-slate-700/50 w-8 mx-auto mt-4 mb-3"></div>}
          
          <div className="space-y-1">
            <Link 
              to="/tickets"
              className={`flex items-center rounded-lg transition-all font-medium relative ${isCollapsed ? 'justify-center px-0 py-2.5' : 'justify-between px-4 py-3'} ${
                location.pathname.startsWith('/tickets')
                ? 'bg-slate-200/80 dark:bg-[#2A2F3A] text-slate-800 dark:text-primary font-semibold' 
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-[#2A2F3A]/50 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
              title="Tickets"
            >
              <div className="flex items-center gap-3">
                <MessageSquare className="w-5 h-5 flex-shrink-0" />
                {!isCollapsed && <span className="whitespace-nowrap">Tickets</span>}
              </div>
              {totalUnreadTickets > 0 && (
                isCollapsed ? (
                  <span className="absolute top-2 right-3 w-2.5 h-2.5 rounded-full bg-primary border-2 border-[#181B21]"></span>
                ) : (
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                    <span className="text-[10px] font-bold bg-primary/10 text-primary px-1.5 py-0.5 rounded-md">
                      {totalUnreadTickets}
                    </span>
                  </div>
                )
              )}
            </Link>
          </div>

          {user?.role_name === 'Admin' && (
            <>
              {!isCollapsed && <p className="px-4 text-[10px] font-bold text-primary tracking-widest mt-8 mb-3 uppercase whitespace-nowrap">ADMIN</p>}
              {isCollapsed && <div className="h-px bg-slate-700/50 w-8 mx-auto mt-4 mb-3"></div>}
              
              <div className="space-y-1">
                <Link 
                  to="/users"
                  className={`flex items-center gap-3 rounded-lg transition-all font-medium ${isCollapsed ? 'justify-center px-0 py-2.5' : 'px-4 py-3'} ${
                    location.pathname.startsWith('/users')
                    ? 'bg-slate-200/80 dark:bg-[#2A2F3A] text-slate-800 dark:text-primary font-semibold' 
                    : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-[#2A2F3A]/50 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                  title="User Management"
                >
                  <Shield className="w-5 h-5 flex-shrink-0" />
                  {!isCollapsed && <span className="whitespace-nowrap">User Management</span>}
                </Link>
              </div>
            </>
          )}
        </div>

        {/* User Profile Area */}
        <div className="p-3 mt-auto">
          <div className={`bg-slate-100 dark:bg-[#242A35] rounded-xl p-3 flex ${isCollapsed ? 'flex-col items-center gap-4' : 'items-center justify-between'} shadow-sm border border-slate-200 dark:border-slate-700/50 transition-all`}>
            <div className={`flex items-center ${isCollapsed ? 'justify-center w-full' : 'gap-3'} overflow-hidden`}>
              {user?.avatar ? (
                <img src={user.avatar} alt="Avatar" className="w-9 h-9 rounded-lg object-cover flex-shrink-0" />
              ) : (
                <div className="w-9 h-9 rounded-lg bg-[#181B21] flex flex-shrink-0 items-center justify-center text-primary shadow-sm border border-slate-700/50">
                  <UserCircle className="w-5 h-5" />
                </div>
              )}
              {!isCollapsed && (
                <div className="truncate">
                  <p className="text-sm font-semibold text-primary truncate leading-tight">{user?.name || 'Admin User'}</p>
                  <p className="text-[11px] text-slate-400 truncate">{user?.role_name || 'Role'}</p>
                </div>
              )}
            </div>
            <div className={`flex ${isCollapsed ? 'flex-col' : 'flex-col'} items-center gap-2`}>
              <button onClick={toggleTheme} className="text-slate-400 hover:text-primary transition-colors" title="Toggle Theme">
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
              <button onClick={logout} className="text-slate-400 hover:text-red-400 transition-colors mt-1" title="Logout">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Viewport */}
      <main className="flex-1 flex flex-col relative overflow-hidden bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-background to-background">
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;
