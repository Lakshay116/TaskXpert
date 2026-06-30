import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, LayoutDashboard, MessageSquare, Briefcase, Activity, CheckCircle, Clock, Users, Shield, Zap, TrendingUp, PieChart as PieChartIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useProjectStore } from '../store/projectStore';
import { useTicketStore } from '../store/ticketStore';
import { useUserStore } from '../store/userStore';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';

const FadeIn = ({ children, delay = 0, className = '' }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
    className={className}
  >
    {children}
  </motion.div>
);

const StatCard = ({ title, value, icon: Icon, colorClass, delay }) => (
  <FadeIn delay={delay}>
    <div className="relative overflow-hidden p-6 rounded-3xl bg-surface border border-border shadow-sm group hover:shadow-xl transition-all duration-300">
      <div className={`absolute -right-12 -top-12 w-32 h-32 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity duration-500 ${colorClass}`} />
      <div className="relative z-10 flex items-start justify-between">
        <div>
          <p className="text-foreground/60 text-sm font-semibold tracking-wider uppercase mb-2">{title}</p>
          <h4 className="text-4xl font-extrabold text-foreground">{value}</h4>
        </div>
        <div className={`p-3 rounded-2xl ${colorClass.replace('bg-', 'bg-opacity-10 text-').replace('500', '500')}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  </FadeIn>
);

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { projects, fetchProjects } = useProjectStore();
  const { tickets, fetchTickets } = useTicketStore();
  const { users, fetchUsers } = useUserStore();

  useEffect(() => {
    fetchProjects();
    fetchTickets();
    if (user?.role_name === 'Admin') {
      fetchUsers();
    }
  }, [user]);

  const activeProjectsCount = projects.length;
  const openTicketsCount = tickets.filter(t => t.status !== 'Closed' && t.status !== 'Resolved').length;
  const resolvedTicketsCount = tickets.filter(t => t.status === 'Resolved' || t.status === 'Closed').length;

  // Compute Chart Data
  const ticketStatusData = [
    { name: 'Open', value: tickets.filter(t => t.status === 'Open').length },
    { name: 'In Progress', value: tickets.filter(t => t.status === 'In Progress').length },
    { name: 'Resolved', value: tickets.filter(t => t.status === 'Resolved').length },
    { name: 'Closed', value: tickets.filter(t => t.status === 'Closed').length },
  ].filter(d => d.value > 0);
  const COLORS = ['#ef4444', '#f59e0b', '#10b981', '#6b7280']; // Red, Amber, Green, Gray

  const projectDeptMap = {};
  projects.forEach(p => {
    const dept = p.department || 'General';
    projectDeptMap[dept] = (projectDeptMap[dept] || 0) + 1;
  });
  const projectDeptData = Object.keys(projectDeptMap).map(key => ({
    name: key,
    Projects: projectDeptMap[key]
  }));

  const isAdmin = user?.role_name === 'Admin';

  const getDisplayName = () => {
    if (user?.name && user.name.trim() !== '') {
      return user.name.trim().split(' ')[0];
    }
    if (user?.email && user.email.trim() !== '') {
      return user.email.trim().split('@')[0];
    }
    return 'User';
  };

  return (
    <div className="flex-1 overflow-y-auto bg-background">
      {/* Hero Section */}
      <div className="relative px-6 sm:px-10 py-6 sm:py-8 border-b border-border bg-gradient-to-b from-primary/5 to-transparent overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
        <div className="max-w-6xl mx-auto relative z-10">
          <FadeIn>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider mb-4 shadow-sm backdrop-blur-md">
              <Zap className="w-3.5 h-3.5" /> Welcome back, {getDisplayName()}
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold mb-3 tracking-tight text-slate-900 dark:text-white leading-tight">
              Dashboard Overview
            </h1>
            <p className="text-base text-foreground/60 max-w-2xl leading-relaxed">
              Monitor your team's pulse, track project velocity, and resolve support tickets faster than ever. 
            </p>
          </FadeIn>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6 sm:p-10 -mt-6 relative z-20 space-y-10">
        
        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <StatCard 
            title="Active Projects" 
            value={activeProjectsCount} 
            icon={Briefcase} 
            colorClass="bg-blue-500" 
            delay={0.1} 
          />
          <StatCard 
            title="Open Tickets" 
            value={openTicketsCount} 
            icon={Clock} 
            colorClass="bg-amber-500" 
            delay={0.2} 
          />
          <StatCard 
            title="Resolved Tickets" 
            value={resolvedTicketsCount} 
            icon={CheckCircle} 
            colorClass="bg-emerald-500" 
            delay={0.3} 
          />
          {user?.role_name === 'Admin' ? (
            <StatCard 
              title="Total Users" 
              value={users.length || 0} 
              icon={Users} 
              colorClass="bg-purple-500" 
              delay={0.4} 
            />
          ) : (
            <StatCard 
              title="Your Role" 
              value={user?.role_name || 'Agent'} 
              icon={Shield} 
              colorClass="bg-purple-500" 
              delay={0.4} 
            />
          )}
        </div>

        {/* Main Analytics Modules */}
        <div>
          <FadeIn delay={0.3}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" /> Overview Analytics
              </h3>
            </div>
          </FadeIn>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Ticket Distribution Pie Chart */}
            <FadeIn delay={0.4} className="h-full">
              <div className="p-6 rounded-3xl bg-surface border border-border shadow-sm flex flex-col h-[400px]">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-primary/10 text-primary rounded-xl">
                    <PieChartIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">Ticket Status Distribution</h3>
                    <p className="text-xs text-foreground/50">Breakdown of all active & resolved tickets</p>
                  </div>
                </div>
                
                <div className="flex-1 min-h-[250px]">
                  {ticketStatusData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={ticketStatusData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {ticketStatusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <RechartsTooltip 
                          contentStyle={{ backgroundColor: '#181B21', borderColor: '#2A2F3A', borderRadius: '12px' }}
                          itemStyle={{ color: '#fff' }}
                        />
                        <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-foreground/40 text-sm">
                      No ticket data available
                    </div>
                  )}
                </div>
              </div>
            </FadeIn>

            {/* Projects Bar Chart */}
            <FadeIn delay={0.5} className="h-full">
              <div className="p-6 rounded-3xl bg-surface border border-border shadow-sm flex flex-col h-[400px]">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-blue-500/10 text-blue-500 rounded-xl">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">Projects by Department</h3>
                    <p className="text-xs text-foreground/50">Volume of projects handled per department</p>
                  </div>
                </div>

                <div className="flex-1 min-h-[250px]">
                  {projectDeptData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={projectDeptData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2A2F3A" vertical={false} />
                        <XAxis dataKey="name" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                        <RechartsTooltip 
                          contentStyle={{ backgroundColor: '#181B21', borderColor: '#2A2F3A', borderRadius: '12px' }}
                          cursor={{ fill: '#2A2F3A', opacity: 0.4 }}
                        />
                        <Bar dataKey="Projects" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-foreground/40 text-sm">
                      No project data available
                    </div>
                  )}
                </div>
              </div>
            </FadeIn>
          </div>
          
          {/* Admin Specific Section */}
          {isAdmin && (
            <FadeIn delay={0.6} className="mt-6">
               <div className="p-6 rounded-3xl bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border border-purple-500/20 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
                 <div>
                   <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                     <Shield className="w-5 h-5 text-purple-400" /> Admin Access Actions
                   </h3>
                   <p className="text-foreground/60 text-sm mt-1">You have full administrative privileges to manage users and access roles.</p>
                 </div>
                 <button 
                   onClick={() => navigate('/users')}
                   className="px-6 py-2.5 bg-purple-500 hover:bg-purple-600 text-white rounded-xl font-bold transition-colors whitespace-nowrap shadow-md shadow-purple-500/20"
                 >
                   Manage Users
                 </button>
               </div>
            </FadeIn>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
