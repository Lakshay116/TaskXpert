import React from 'react';
import { useNotificationStore } from '../store/notificationStore';
import { useTicketStore } from '../store/ticketStore';
import { useAuthStore } from '../store/authStore';
import { Bell, CheckCircle2, Circle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Notifications = () => {
  const { notifications, markAsRead, markAllAsRead } = useNotificationStore();
  const { tickets, unreadCounts } = useTicketStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const unreadAppNotifications = (notifications || []).filter(n => !n.is_read);
  const readAppNotifications = (notifications || []).filter(n => n.is_read);

  const unreadTicketsList = (tickets || []).filter(ticket => {
    const isOwner = ticket.user_id === user?.id;
    const dbUnreadCount = isOwner ? ticket.user_unread_count : ticket.agent_unread_count;
    const liveUnreadCount = unreadCounts && unreadCounts[ticket.id] > 0 ? unreadCounts[ticket.id] : 0;
    return Math.max(dbUnreadCount || 0, liveUnreadCount || 0) > 0;
  });

  const totalUnreadBadge = unreadAppNotifications.length + unreadTicketsList.length;

  return (
    <div className="flex-1 overflow-y-auto p-10 bg-background text-foreground">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-2">Notifications</h1>
            <p className="text-foreground/60">Stay updated on your assigned tasks and ticket replies.</p>
          </div>
          {totalUnreadBadge > 0 && (
            <button 
              onClick={markAllAsRead}
              className="flex items-center gap-2 bg-primary/10 text-primary hover:bg-primary/20 px-4 py-2 rounded-lg font-semibold transition-colors"
            >
              <CheckCircle2 className="w-5 h-5" /> Mark all as read
            </button>
          )}
        </div>

        <div className="space-y-6">
          {totalUnreadBadge === 0 && readAppNotifications.length === 0 && (
            <div className="bg-surface border border-border rounded-2xl p-12 text-center flex flex-col items-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 text-primary">
                <Bell className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold mb-2">You're all caught up!</h3>
              <p className="text-foreground/50 text-sm">No new notifications to display right now.</p>
            </div>
          )}

          {/* Unread Tickets */}
          {unreadTicketsList.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-primary tracking-widest uppercase mb-4">Ticket Updates</h3>
              {unreadTicketsList.map(ticket => (
                <div 
                  key={`ticket-${ticket.id}`}
                  onClick={() => navigate(`/tickets/${ticket.id}`)}
                  className="bg-surface border border-border p-5 rounded-2xl shadow-sm hover:shadow-md hover:border-primary/50 transition-all cursor-pointer flex items-start gap-4 group"
                >
                  <div className="mt-1 flex-shrink-0">
                    <Circle className="w-3 h-3 fill-primary text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="font-semibold text-white text-lg group-hover:text-primary transition-colors">{ticket.subject}</h4>
                      <span className="text-[10px] text-primary whitespace-nowrap bg-primary/10 px-2 py-1 rounded-md font-bold uppercase tracking-wider">
                        Ticket Update
                      </span>
                    </div>
                    <p className="text-sm text-slate-400 mt-1">
                      Ticket #{ticket.id} • {ticket.department}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Unread App Notifications */}
          {unreadAppNotifications.length > 0 && (
            <div className="space-y-3 mt-8">
              <h3 className="text-sm font-bold text-primary tracking-widest uppercase mb-4">New Alerts</h3>
              {unreadAppNotifications.map(notif => (
                <div 
                  key={notif.id}
                  onClick={() => {
                    markAsRead(notif.id);
                    if (notif.link_url) navigate(notif.link_url);
                  }}
                  className="bg-[#2A2F3A] border border-primary/30 p-5 rounded-2xl shadow-sm hover:shadow-md hover:border-primary transition-all cursor-pointer flex items-start gap-4 group"
                >
                  <div className="mt-1 flex-shrink-0">
                    <Circle className="w-3 h-3 fill-primary text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="font-semibold text-white text-lg group-hover:text-primary transition-colors">{notif.title}</h4>
                      <span className="text-[10px] text-primary whitespace-nowrap bg-primary/10 px-2 py-1 rounded-md font-bold uppercase tracking-wider">
                        New
                      </span>
                    </div>
                    <p className="text-sm text-slate-300 mt-1 leading-relaxed">
                      {notif.message}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Read App Notifications */}
          {readAppNotifications.length > 0 && (
            <div className="space-y-3 mt-12 opacity-70">
              <h3 className="text-sm font-bold text-slate-500 tracking-widest uppercase mb-4">Earlier</h3>
              {readAppNotifications.map(notif => (
                <div 
                  key={notif.id}
                  onClick={() => {
                    if (notif.link_url) navigate(notif.link_url);
                  }}
                  className="bg-surface border border-border p-5 rounded-2xl hover:bg-surface/80 transition-all cursor-pointer flex items-start gap-4"
                >
                  <div className="mt-1 flex-shrink-0">
                    <Circle className="w-3 h-3 text-slate-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-slate-300 text-base">{notif.title}</h4>
                    <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                      {notif.message}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Notifications;
