import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Link, Navigate, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SocketProvider } from './context/SocketContext.jsx';
import { useAuthStore } from './store/authStore.js';
import { useCartStore } from './store/cartStore.js';

// Page Imports
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Home from './pages/customer/Home.jsx';
import Search from './pages/customer/Search.jsx';
import Restaurant from './pages/customer/Restaurant.jsx';
import Cart from './pages/customer/Cart.jsx';
import Checkout from './pages/customer/Checkout.jsx';
import OrderTracking from './pages/customer/OrderTracking.jsx';
import Profile from './pages/customer/Profile.jsx';
import RestaurantDashboard from './pages/restaurant/Dashboard.jsx';
import AssignedOrders from './pages/delivery/AssignedOrders.jsx';
import AdminDashboard from './pages/admin/Dashboard.jsx';

// Widgets
import ChatbotWidget from './components/chatbot/ChatbotWidget.jsx';
import ToastContainer from './components/common/ToastContainer.jsx';

// Icons
import { ShoppingCart, User, Sun, Moon, LogOut, Coffee } from 'lucide-react';

const queryClient = new QueryClient();

// A. Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    // Redirection rules on role clash
    if (user?.role === 'restaurant') return <Navigate to="/restaurant/dashboard" replace />;
    if (user?.role === 'delivery_personnel') return <Navigate to="/delivery/orders" replace />;
    if (user?.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
    return <Navigate to="/" replace />;
  }

  return children;
};

// B. Primary Layout Wrapping
const AppLayout = ({ theme, setTheme }) => {
  const { user, clearCredentials, isAuthenticated } = useAuthStore();
  const cartItems = useCartStore((state) => state.items);
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const navigate = useNavigate();

  const handleLogout = () => {
    clearCredentials();
    navigate('/login');
  };

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <div className="min-h-screen flex flex-col transition-colors duration-300">
      
      {/* 1. NAVIGATION HEADER */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 transition-colors">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          
          {/* Logo */}
          <Link to="/" className="flex items-center gap-1.5 text-slate-900 dark:text-white font-extrabold text-xl font-sans tracking-tight">
            <span className="p-1.5 bg-brand-500 text-white rounded-xl shadow-md"><Coffee className="w-5 h-5" /></span>
            <span>FoodExpress</span>
          </Link>

          {/* Links menu */}
          <div className="flex items-center gap-4">
            
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 transition-all active:scale-95"
            >
              {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>

            {/* Render items by Roles */}
            {isAuthenticated ? (
              <>
                {user?.role === 'customer' && (
                  <>
                    <Link
                      to="/cart"
                      className="relative p-2.5 rounded-xl text-slate-500 hover:text-slate-855 dark:text-slate-400 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center"
                    >
                      <ShoppingCart className="w-5 h-5" />
                      {cartCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-brand-600 text-white font-bold text-[9px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900 animate-bounce">
                          {cartCount}
                        </span>
                      )}
                    </Link>
                    <Link
                      to="/profile"
                      className="p-2.5 rounded-xl text-slate-500 hover:text-slate-855 dark:text-slate-400 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                    >
                      <User className="w-5 h-5" />
                    </Link>
                  </>
                )}

                {user?.role === 'restaurant' && (
                  <Link to="/restaurant/dashboard" className="text-xs font-bold text-slate-600 dark:text-slate-300 hover:underline">
                    Dashboard
                  </Link>
                )}

                {user?.role === 'delivery_personnel' && (
                  <Link to="/delivery/orders" className="text-xs font-bold text-slate-600 dark:text-slate-300 hover:underline">
                    Deliveries Portal
                  </Link>
                )}

                {user?.role === 'admin' && (
                  <Link to="/admin/dashboard" className="text-xs font-bold text-slate-600 dark:text-slate-300 hover:underline">
                    Admin Panel
                  </Link>
                )}

                <button
                  onClick={handleLogout}
                  className="p-2.5 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </>
            ) : (
              <div className="flex gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-750 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-850 rounded-xl text-xs font-bold transition-all"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-brand-500/10 transition-all"
                >
                  Register
                </Link>
              </div>
            )}

          </div>
        </div>
      </header>

      {/* 2. MAIN LAYOUT AREA */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8 relative">
        <Routes>
          {/* Public Auth routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Customer Protected routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute allowedRoles={['customer']}>
                <Home />
              </ProtectedRoute>
            }
          />
          <Route
            path="/search"
            element={
              <ProtectedRoute allowedRoles={['customer']}>
                <Search />
              </ProtectedRoute>
            }
          />
          <Route
            path="/restaurant/:id"
            element={
              <ProtectedRoute allowedRoles={['customer']}>
                <Restaurant />
              </ProtectedRoute>
            }
          />
          <Route
            path="/cart"
            element={
              <ProtectedRoute allowedRoles={['customer']}>
                <Cart />
              </ProtectedRoute>
            }
          />
          <Route
            path="/checkout"
            element={
              <ProtectedRoute allowedRoles={['customer']}>
                <Checkout />
              </ProtectedRoute>
            }
          />
          <Route
            path="/order-tracking/:id"
            element={
              <ProtectedRoute allowedRoles={['customer']}>
                <OrderTracking />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute allowedRoles={['customer']}>
                <Profile />
              </ProtectedRoute>
            }
          />

          {/* Merchant protected routes */}
          <Route
            path="/restaurant/dashboard"
            element={
              <ProtectedRoute allowedRoles={['restaurant']}>
                <RestaurantDashboard />
              </ProtectedRoute>
            }
          />

          {/* Rider protected routes */}
          <Route
            path="/delivery/orders"
            element={
              <ProtectedRoute allowedRoles={['delivery_personnel']}>
                <AssignedOrders />
              </ProtectedRoute>
            }
          />

          {/* Admin Protected routes */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* Fallback Redirection */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Floating chatbot widget (active only for customers) */}
      {user?.role === 'customer' && <ChatbotWidget />}

      {/* Central notifications toasts */}
      <ToastContainer />

    </div>
  );
};

export const App = () => {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  // Sync dark class on body element
  useEffect(() => {
    if (theme === 'dark') {
      document.body.classList.add('dark');
      document.body.style.backgroundColor = '#030712'; // darkbg-200
    } else {
      document.body.classList.remove('dark');
      document.body.style.backgroundColor = '#f8fafc'; // slate-50
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <SocketProvider>
          <AppLayout theme={theme} setTheme={setTheme} />
        </SocketProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
