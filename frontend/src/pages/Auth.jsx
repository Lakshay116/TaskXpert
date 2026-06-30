import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Mail, Lock, User, Loader2, Building, Layers } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', organization_name: '' });
  const { login, register, googleLogin, isLoading, error } = useAuthStore();
  const navigate = useNavigate();

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isLogin) {
        await login(formData.email, formData.password);
        navigate('/dashboard');
      } else {
        await register(formData.name, formData.email, formData.password, formData.organization_name);
        // Automatically switch to login after successful register
        setIsLogin(true);
        alert("Registration successful! Please sign in.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      await googleLogin(credentialResponse.credential);
      navigate('/dashboard');
    } catch (err) {
      console.error("Google login failed", err);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#08090A] selection:bg-primary/30">
      
      {/* Left Decorative Panel (Hidden on mobile) */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-12 relative overflow-hidden bg-[#0C0E12] border-r border-slate-800/50 sticky top-0 h-screen">
        <div className="absolute top-0 left-0 w-full h-full opacity-30 pointer-events-none">
          <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary/20 blur-[100px] rounded-full mix-blend-screen" />
          <div className="absolute bottom-10 right-10 w-[500px] h-[500px] bg-primary/10 blur-[120px] rounded-full mix-blend-screen" />
        </div>

        <div className="relative z-10 flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
          <div className="w-10 h-10 rounded-xl bg-[#181B21] flex items-center justify-center shadow-lg">
            <Layers className="w-6 h-6 text-primary" />
          </div>
          <span className="text-2xl font-extrabold tracking-tight text-white">TaskXpert<span className="text-primary">.</span></span>
        </div>

        <div className="relative z-10 max-w-md">
          <h1 className="text-4xl font-bold text-white mb-6 leading-tight">
            Streamline your workflow with intelligent operations.
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed">
            Join thousands of modern teams who use TaskXpert to handle support tickets, manage projects, and collaborate in real-time.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-4 text-sm font-semibold text-slate-500">
          <span>© {new Date().getFullYear()} TaskXpert Inc.</span>
          <span className="w-1 h-1 rounded-full bg-slate-700" />
          <a href="#" className="hover:text-slate-300 transition-colors">Privacy Policy</a>
        </div>
      </div>

      {/* Right Auth Panel */}
      <div className="flex-1 flex flex-col items-center p-8 sm:p-12 relative z-10 py-12 md:py-24 my-auto">
        {/* Mobile Logo */}
        <div className="lg:hidden flex items-center gap-3 mb-12 cursor-pointer" onClick={() => navigate('/')}>
          <div className="w-10 h-10 rounded-xl bg-[#181B21] flex items-center justify-center shadow-lg">
            <Layers className="w-6 h-6 text-primary" />
          </div>
          <span className="text-2xl font-extrabold tracking-tight text-white">TaskXpert<span className="text-primary">.</span></span>
        </div>

        <motion.div 
          layout
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-[420px]"
        >
          <div className="mb-10">
            <motion.h2 layout="position" className="text-3xl font-bold tracking-tight text-white mb-3">
              {isLogin ? 'Welcome back' : 'Create an account'}
            </motion.h2>
            <motion.p layout="position" className="text-slate-400">
              {isLogin ? 'Enter your credentials to access your workspace' : 'Join our premium workspace today'}
            </motion.p>
          </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/50 text-red-500 text-sm text-center font-medium"
          >
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <AnimatePresence mode="popLayout">
            {!isLogin && (
              <motion.div
                initial={{ opacity: 0, height: 0, y: -20 }}
                animate={{ opacity: 1, height: 'auto', y: 0 }}
                exit={{ opacity: 0, height: 0, y: -20 }}
                className="space-y-1.5 overflow-hidden"
              >
                <label className="text-sm font-medium pl-1">Full Name</label>
                <div className="relative mb-3">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
                  <input 
                    type="text" name="name"
                    value={formData.name} onChange={handleChange}
                    placeholder="John Doe" required={!isLogin}
                    className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-surface border border-border focus:ring-2 focus:ring-primary/50 outline-none transition-all placeholder:text-foreground/40 text-white font-medium"
                  />
                </div>

                <label className="text-sm font-medium pl-1 mt-3">Organization Name</label>
                <div className="relative">
                  <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
                  <input 
                    type="text" name="organization_name"
                    value={formData.organization_name} onChange={handleChange}
                    placeholder="Acme Corp" required={!isLogin}
                    className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-surface border border-border focus:ring-2 focus:ring-primary/50 outline-none transition-all placeholder:text-foreground/40 text-white font-medium"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-1.5">
            <label className="text-sm font-medium pl-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
              <input 
                type="email" name="email"
                value={formData.email} onChange={handleChange}
                placeholder="name@example.com" required
                className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-surface border border-border focus:ring-2 focus:ring-primary/50 outline-none transition-all placeholder:text-foreground/40 text-white font-medium"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium pl-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
              <input 
                type="password" name="password"
                value={formData.password} onChange={handleChange}
                placeholder="••••••••" required
                className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-surface border border-border focus:ring-2 focus:ring-primary/50 outline-none transition-all placeholder:text-foreground/40 text-white font-medium"
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={isLoading}
            className="w-full py-4 mt-2 bg-primary text-[#181B21] font-bold rounded-2xl hover:opacity-90 transition-all flex items-center justify-center group disabled:opacity-70 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(250,204,21,0.15)] hover:shadow-[0_0_30px_rgba(250,204,21,0.3)] transform hover:-translate-y-0.5"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
              <>
                {isLogin ? 'Sign In' : 'Create Account'}
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
          
          <div className="relative flex items-center py-4">
            <div className="flex-grow border-t border-border"></div>
            <span className="flex-shrink-0 mx-4 text-foreground/40 text-sm">Or continue with</span>
            <div className="flex-grow border-t border-border"></div>
          </div>

          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => console.log('Login Failed')}
              theme={document.documentElement.classList.contains('dark') ? 'filled_black' : 'outline'}
              size="large"
              shape="pill"
            />
          </div>
        </form>

        <div className="mt-8 text-center">
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="text-slate-400 hover:text-white transition-colors font-medium"
          >
            {isLogin ? (
              <span>Don't have an account? <span className="text-primary underline underline-offset-4">Sign up</span></span>
            ) : (
              <span>Already have an account? <span className="text-primary underline underline-offset-4">Sign in</span></span>
            )}
          </button>
        </div>
      </motion.div>
      </div>
    </div>
  );
};

export default Auth;
