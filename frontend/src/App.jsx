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
import { ShoppingCart, User, Sun, Moon, LogOut, UtensilsCrossed, Crown, Search as SearchIcon } from 'lucide-react';

// Styles
import './App.css';

const queryClient = new QueryClient();

// A. Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
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
    <div className="min-h-screen flex flex-col bg-surface-50 dark:bg-noir-400 transition-colors duration-300">
      
      {/* ════════ NAVIGATION HEADER ════════ */}
      <header className="sticky top-0 z-50 glass-nav transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <span className="relative p-2 bg-gold-gradient rounded-xl shadow-btn group-hover:shadow-btn-hover transition-all duration-300 group-hover:scale-105">
              <UtensilsCrossed className="w-5 h-5 text-white" />
              <Crown className="w-2.5 h-2.5 text-royal-200 absolute -top-1 -right-1 animate-bounce-soft" />
            </span>
            <span className="text-xl font-display font-bold tracking-tight text-noir-400 dark:text-surface-50 group-hover:text-royal-600 dark:group-hover:text-royal-400 transition-colors">
              Smart<span className="text-gold-gradient bg-clip-text text-transparent">Meal</span>
            </span>
          </Link>

          {/* Right-side Actions */}
          <div className="flex items-center gap-1 sm:gap-2">
            
            {/* Search Link (for customers) */}
            {isAuthenticated && user?.role === 'customer' && (
              <Link
                to="/search"
                className="p-2.5 rounded-xl text-noir-50/60 dark:text-surface-400/60 hover:text-royal-600 dark:hover:text-royal-400 hover:bg-royal-500/5 transition-all duration-300"
                title="Search"
              >
                <SearchIcon className="w-5 h-5" />
              </Link>
            )}

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl text-noir-50/60 dark:text-surface-400/60 hover:text-royal-500 hover:bg-royal-500/5 dark:hover:bg-royal-500/10 transition-all duration-300 active:scale-90"
              title={theme === 'light' ? 'Dark mode' : 'Light mode'}
            >
              {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>

            {/* Render items by Role */}
            {isAuthenticated ? (
              <>
                {user?.role === 'customer' && (
                  <>
                    <Link
                      to="/cart"
                      className="relative p-2.5 rounded-xl text-noir-50/60 dark:text-surface-400/60 hover:text-royal-600 dark:hover:text-royal-400 hover:bg-royal-500/5 transition-all duration-300 group"
                      title="Cart"
                    >
                      <ShoppingCart className="w-5 h-5 group-hover:scale-110 transition-transform" />
                      {cartCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-gold-gradient text-white font-bold text-[10px] rounded-full flex items-center justify-center shadow-glow-gold-sm animate-scale-in px-1">
                          {cartCount}
                        </span>
                      )}
                    </Link>
                    <Link
                      to="/profile"
                      className="p-2.5 rounded-xl text-noir-50/60 dark:text-surface-400/60 hover:text-royal-600 dark:hover:text-royal-400 hover:bg-royal-500/5 transition-all duration-300"
                      title="Profile"
                    >
                      <User className="w-5 h-5" />
                    </Link>
                  </>
                )}

                {user?.role === 'restaurant' && (
                  <Link to="/restaurant/dashboard" className="nav-link-royal text-noir-50/70 dark:text-surface-300">
                    Dashboard
                  </Link>
                )}

                {user?.role === 'delivery_personnel' && (
                  <Link to="/delivery/orders" className="nav-link-royal text-noir-50/70 dark:text-surface-300">
                    Deliveries Portal
                  </Link>
                )}

                {user?.role === 'admin' && (
                  <Link to="/admin/dashboard" className="nav-link-royal text-noir-50/70 dark:text-surface-300">
                    Admin Panel
                  </Link>
                )}

                <div className="w-px h-6 bg-surface-300/50 dark:bg-noir-50/30 mx-1 hidden sm:block"></div>

                <button
                  onClick={handleLogout}
                  className="p-2.5 rounded-xl text-noir-50/40 dark:text-surface-400/40 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-500/5 transition-all duration-300 active:scale-90"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="btn-ghost text-xs font-bold px-4 py-2 rounded-xl"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="btn-royal text-xs font-bold px-5 py-2 rounded-xl"
                >
                  Register
                </Link>
              </div>
            )}

          </div>
        </div>
        {/* Gold accent line at bottom of nav */}
        <div className="h-px bg-gradient-to-r from-transparent via-royal-500/20 to-transparent"></div>
      </header>

      {/* ════════ MAIN LAYOUT AREA ════════ */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 relative">
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
      document.body.style.backgroundColor = '#0D0D0D';
    } else {
      document.body.classList.remove('dark');
      document.body.style.backgroundColor = '#FFFDF7';
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
