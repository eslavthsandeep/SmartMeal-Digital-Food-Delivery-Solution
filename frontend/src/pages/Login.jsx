import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore.js';
import { useToastStore } from '../store/toastStore.js';
import { authAPI } from '../services/api.js';
import { LogIn, Key, Mail, ShieldAlert } from 'lucide-react';

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
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 bg-slate-50 dark:bg-slate-900 transition-colors">
      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl p-8 border border-slate-100 dark:border-slate-700 shadow-xl relative overflow-hidden">
        {/* Decorative background light */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/10 rounded-full blur-2xl -mr-16 -mt-16"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl -ml-16 -mb-16"></div>

        <div className="text-center mb-8 relative">
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white font-sans tracking-tight">
            Welcome Back
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">
            Sign in to start ordering or managing food
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5 relative">
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              Email Address
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Mail className="w-5 h-5" />
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                placeholder="you@example.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              Password
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Key className="w-5 h-5" />
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-medium flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-brand-500/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none"
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
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Don't have an account?{' '}
            <Link to="/register" className="text-brand-500 hover:text-brand-600 font-semibold underline underline-offset-4">
              Register here
            </Link>
          </p>
        </div>

        {/* Demo Fast Login Shortcuts (Extremely helpful for Vivas) */}
        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-700">
          <span className="flex items-center gap-1.5 justify-center text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-3">
            <ShieldAlert className="w-4 h-4" /> Demo Account Shortcuts
          </span>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              onClick={() => handleDemoLogin('customer')}
              type="button"
              className="py-2 px-3 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-brand-50 hover:text-brand-700 dark:hover:bg-slate-950 dark:hover:text-brand-400 rounded-lg transition-colors font-medium text-left"
            >
              🔑 Customer
            </button>
            <button
              onClick={() => handleDemoLogin('restaurant')}
              type="button"
              className="py-2 px-3 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-brand-50 hover:text-brand-700 dark:hover:bg-slate-950 dark:hover:text-brand-400 rounded-lg transition-colors font-medium text-left"
            >
              🔑 Restaurant Owner
            </button>
            <button
              onClick={() => handleDemoLogin('delivery')}
              type="button"
              className="py-2 px-3 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-brand-50 hover:text-brand-700 dark:hover:bg-slate-950 dark:hover:text-brand-400 rounded-lg transition-colors font-medium text-left"
            >
              🔑 Delivery Agent
            </button>
            <button
              onClick={() => handleDemoLogin('admin')}
              type="button"
              className="py-2 px-3 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-brand-50 hover:text-brand-700 dark:hover:bg-slate-950 dark:hover:text-brand-400 rounded-lg transition-colors font-medium text-left"
            >
              🔑 System Admin
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
