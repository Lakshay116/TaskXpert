import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Layers, Shield, Zap, MessageSquare, BarChart, Users } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

const Landing = () => {
  const { token } = useAuthStore();
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const features = [
    {
      icon: <MessageSquare className="w-6 h-6 text-primary" />,
      title: "Intelligent Ticketing",
      description: "Manage, assign, and resolve support requests with lightning-fast real-time chat and attachments."
    },
    {
      icon: <Zap className="w-6 h-6 text-primary" />,
      title: "Real-time Operations",
      description: "Powered by WebSockets to ensure you never miss an update, message, or project milestone."
    },
    {
      icon: <Shield className="w-6 h-6 text-primary" />,
      title: "Role-Based Access",
      description: "Secure your workspace with granular permissions for Admins, Managers, Agents, and Employees."
    },
    {
      icon: <BarChart className="w-6 h-6 text-primary" />,
      title: "Analytics Dashboard",
      description: "Get a bird's-eye view of your company's performance, open tickets, and active projects."
    },
    {
      icon: <Layers className="w-6 h-6 text-primary" />,
      title: "Project Management",
      description: "Organize tasks, track progress in real-time, and ensure your team hits every deadline."
    },
    {
      icon: <Users className="w-6 h-6 text-primary" />,
      title: "Team Collaboration",
      description: "Centralized workspace that brings your departments together for seamless communication."
    }
  ];

  return (
    <div className="min-h-[100vh] bg-[#08090A] text-white selection:bg-primary/30 flex flex-col font-sans overflow-x-hidden relative">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] opacity-20 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/40 to-transparent blur-[100px] rounded-full mix-blend-screen" />
      </div>

      {/* Navbar */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-6 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#181B21] flex items-center justify-center shadow-lg">
            <Layers className="w-6 h-6 text-primary" />
          </div>
          <span className="text-2xl font-extrabold tracking-tight">TaskXpert<span className="text-primary">.</span></span>
        </div>
        
        <div className="flex items-center gap-4">
          {token ? (
            <Link 
              to="/dashboard"
              className="px-6 py-2.5 rounded-full bg-primary text-[#181B21] font-bold hover:opacity-90 transition-all shadow-[0_0_20px_rgba(250,204,21,0.3)] hover:shadow-[0_0_30px_rgba(250,204,21,0.5)] transform hover:-translate-y-0.5"
            >
              Open Dashboard
            </Link>
          ) : (
            <>
              <Link 
                to="/auth" 
                className="hidden sm:block px-5 py-2.5 text-sm font-semibold text-slate-300 hover:text-white transition-colors"
              >
                Sign In
              </Link>
              <Link 
                to="/auth" 
                className="px-6 py-2.5 rounded-full bg-[#181B21] border border-slate-700/50 text-white text-sm font-bold hover:bg-[#2A2F3A] transition-all flex items-center gap-2 group"
              >
                Get Started
                <ArrowRight className="w-4 h-4 text-primary group-hover:translate-x-1 transition-transform" />
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-8 text-center max-w-5xl mx-auto w-full min-h-[calc(100vh-100px)]">
        <div className={`transition-all duration-1000 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'} flex flex-col items-center justify-center`}>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#181B21] border border-slate-700/50 text-sm font-medium text-slate-300 mb-6 sm:mb-8 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            TaskXpert v2.0 is now live
          </div>
          
          <h1 className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-extrabold tracking-tighter leading-[1.1] mb-6 sm:mb-8">
            The ultimate OS for <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-yellow-200 to-primary">
              modern teams.
            </span>
          </h1>
          
          <p className="text-base sm:text-lg lg:text-xl text-slate-400 max-w-2xl mx-auto mb-8 sm:mb-12 leading-relaxed">
            Unify your company's support ticketing, project management, and team collaboration into one incredibly fast, real-time platform.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              to={token ? "/dashboard" : "/auth"}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-primary text-[#181B21] text-lg font-bold hover:opacity-90 transition-all shadow-[0_0_30px_rgba(250,204,21,0.2)] hover:shadow-[0_0_40px_rgba(250,204,21,0.4)] transform hover:-translate-y-1 flex items-center justify-center gap-3 group"
            >
              Start using TaskXpert
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            {!token && (
              <a 
                href="#features"
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-[#181B21] border border-slate-700/50 text-white text-lg font-bold hover:bg-[#2A2F3A] transition-all transform hover:-translate-y-1 flex items-center justify-center"
              >
                Explore Features
              </a>
            )}
          </div>
        </div>
      </main>

      {/* Features Grid */}
      <section id="features" className="relative z-10 bg-[#0C0E12] border-t border-slate-800/50 py-32">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl sm:text-5xl font-bold mb-6">Everything you need to scale</h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              Built with cutting-edge technologies to provide a seamless, real-time experience for your entire organization.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, idx) => (
              <div 
                key={idx} 
                className="p-8 rounded-3xl bg-[#181B21] border border-slate-700/30 hover:border-primary/30 hover:bg-[#1C2028] transition-all group"
              >
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-primary/20 transition-all">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-slate-400 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/50 py-12 text-center text-slate-500 text-sm bg-[#0C0E12]">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Layers className="w-5 h-5 text-slate-600" />
          <span className="font-bold text-slate-400">TaskXpert</span>
        </div>
        <p>© {new Date().getFullYear()} TaskXpert Inc. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Landing;
