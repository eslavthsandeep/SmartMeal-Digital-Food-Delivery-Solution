import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore.js';
import { useToastStore } from '../store/toastStore.js';
import { authAPI } from '../services/api.js';
import { LogIn, Key, Mail, ShieldAlert, Crown, Sparkles } from 'lucide-react';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const setCredentials = useAuthStore((state) => state.setCredentials);
  const addToast = useToastStore((state) => state.addToast);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      addToast('Please fill in all fields', 'error');
      return;
    }

    setLoading(true);
    try {
      const data = await authAPI.login({ email, password });
      setCredentials(data.token, data.user);
      addToast(`Welcome back, ${data.user.name}!`, 'success');
      
      // Role-based routing redirection
      if (data.user.role === 'restaurant') {
        navigate('/restaurant/dashboard');
      } else if (data.user.role === 'delivery_personnel') {
        navigate('/delivery/orders');
      } else if (data.user.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/');
      }
    } catch (error) {
      addToast(error.response?.data?.message || 'Login failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Demo fast login handler
  const handleDemoLogin = async (role) => {
    setLoading(true);
    let demoEmail = '';
    if (role === 'customer') demoEmail = 'customer@test.com';
    else if (role === 'restaurant') demoEmail = 'restaurant1@test.com';
    else if (role === 'delivery') demoEmail = 'delivery1@test.com';
    else if (role === 'admin') demoEmail = 'admin@test.com';

    try {
      const data = await authAPI.login({ email: demoEmail, password: 'password123' });
      setCredentials(data.token, data.user);
      addToast(`Demo login: ${data.user.name} (${role.toUpperCase()})`, 'success');
      
      if (data.user.role === 'restaurant') {
        navigate('/restaurant/dashboard');
      } else if (data.user.role === 'delivery_personnel') {
        navigate('/delivery/orders');
      } else if (data.user.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/');
      }
    } catch (error) {
      addToast(error.response?.data?.message || 'Demo login failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-mesh-gold flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Decorative gold radial gradient blobs */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-royal-500/15 rounded-full blur-3xl animate-float pointer-events-none"></div>
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-royal-600/10 rounded-full blur-3xl animate-pulse-soft pointer-events-none"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-radial from-royal-500/5 to-transparent rounded-full pointer-events-none"></div>

      <div className="w-full max-w-md glass-card rounded-3xl p-8 md:p-10 relative overflow-hidden animate-fade-in-up">
        {/* Decorative corner accents */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-royal-500/10 to-transparent rounded-full blur-2xl -mr-20 -mt-20 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-gradient-to-tr from-royal-600/10 to-transparent rounded-full blur-2xl -ml-20 -mb-20 pointer-events-none"></div>

        {/* Header */}
        <div className="text-center mb-8 relative">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-royal-500/10 dark:bg-royal-500/20 border border-royal-500/20 mb-4 animate-bounce-soft">
            <Crown className="w-8 h-8 text-royal-500" />
          </div>
          <h2 className="text-3xl md:text-4xl font-display font-bold text-gold-gradient tracking-tight">
            Welcome Back
          </h2>
          <p className="text-noir-200 dark:text-surface-300 mt-2 text-sm font-sans">
            Sign in to your premium dining experience
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5 relative">
          <div>
            <label className="label-royal">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-royal-500/60 dark:text-royal-500/50">
                <Mail className="w-5 h-5" />
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-royal pl-11"
                placeholder="you@example.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="label-royal">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-royal-500/60 dark:text-royal-500/50">
                <Key className="w-5 h-5" />
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-royal pl-11"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-royal w-full py-3.5 flex items-center justify-center gap-2 text-base font-semibold"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                Sign In
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-noir-200 dark:text-surface-300">
            Don't have an account?{' '}
            <Link to="/register" className="text-royal-500 hover:text-royal-600 font-semibold underline underline-offset-4 transition-colors duration-300">
              Register here
            </Link>
          </p>
        </div>

        {/* Demo Fast Login Shortcuts */}
        <div className="mt-8 pt-6 relative">
          <div className="gold-divider mb-6"></div>
          <span className="flex items-center gap-2 justify-center text-xs font-semibold text-royal-500 dark:text-royal-500 uppercase tracking-widest mb-4">
            <Sparkles className="w-4 h-4 animate-pulse-soft" />
            Demo Account Shortcuts
            <Sparkles className="w-4 h-4 animate-pulse-soft" />
          </span>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <button
              onClick={() => handleDemoLogin('customer')}
              type="button"
              className="group py-3 px-4 rounded-xl border border-royal-500/20 dark:border-royal-500/15 bg-surface-50/50 dark:bg-noir-500/50 text-noir-300 dark:text-surface-200 hover:border-royal-500/50 hover:bg-royal-500/5 dark:hover:bg-royal-500/10 transition-all duration-300 font-medium text-left hover:shadow-glow-gold-sm active:scale-[0.98]"
            >
              <span className="text-base">👑</span> Customer
            </button>
            <button
              onClick={() => handleDemoLogin('restaurant')}
              type="button"
              className="group py-3 px-4 rounded-xl border border-royal-500/20 dark:border-royal-500/15 bg-surface-50/50 dark:bg-noir-500/50 text-noir-300 dark:text-surface-200 hover:border-royal-500/50 hover:bg-royal-500/5 dark:hover:bg-royal-500/10 transition-all duration-300 font-medium text-left hover:shadow-glow-gold-sm active:scale-[0.98]"
            >
              <span className="text-base">🏪</span> Restaurant Owner
            </button>
            <button
              onClick={() => handleDemoLogin('delivery')}
              type="button"
              className="group py-3 px-4 rounded-xl border border-royal-500/20 dark:border-royal-500/15 bg-surface-50/50 dark:bg-noir-500/50 text-noir-300 dark:text-surface-200 hover:border-royal-500/50 hover:bg-royal-500/5 dark:hover:bg-royal-500/10 transition-all duration-300 font-medium text-left hover:shadow-glow-gold-sm active:scale-[0.98]"
            >
              <span className="text-base">🚴</span> Delivery Agent
            </button>
            <button
              onClick={() => handleDemoLogin('admin')}
              type="button"
              className="group py-3 px-4 rounded-xl border border-royal-500/20 dark:border-royal-500/15 bg-surface-50/50 dark:bg-noir-500/50 text-noir-300 dark:text-surface-200 hover:border-royal-500/50 hover:bg-royal-500/5 dark:hover:bg-royal-500/10 transition-all duration-300 font-medium text-left hover:shadow-glow-gold-sm active:scale-[0.98]"
            >
              <span className="text-base">⚙️</span> System Admin
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
