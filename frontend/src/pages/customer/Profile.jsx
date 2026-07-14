import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { orderAPI } from '../../services/api.js';
import { useAuthStore } from '../../store/authStore.js';
import Loader from '../../components/common/Loader.jsx';
import { User, Phone, Mail, MapPin, ClipboardList, LogOut, ArrowUpRight, Crown, ShoppingBag, Sparkles } from 'lucide-react';

export const Profile = () => {
  const navigate = useNavigate();
  const { user, clearCredentials } = useAuthStore();

  const handleLogout = () => {
    clearCredentials();
    navigate('/login');
  };

  // Fetch customer orders list
  const { data, isLoading, isError } = useQuery({
    queryKey: ['my-orders'],
    queryFn: () => orderAPI.getMyOrders()
  });

  const orders = data?.data || [];

  const getStatusBadge = (status) => {
    switch (status) {
      case 'delivered':
        return 'badge-success';
      case 'cancelled':
        return 'badge-danger';
      case 'placed':
        return 'badge-info';
      default:
        return 'badge-warning';
    }
  };

  return (
    <div className="space-y-8 pb-16 animate-fade-in">

      {/* ── Page Header ── */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-royal-500/10 dark:bg-royal-500/20">
            <Crown className="w-6 h-6 text-royal-500" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-noir-600 dark:text-surface-50">
              My Profile
            </h1>
            <p className="text-xs font-medium text-noir-200 dark:text-surface-300 mt-0.5">
              Manage your account & view past orders
            </p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="btn-danger flex items-center gap-2 text-xs px-5 py-2.5 rounded-xl"
        >
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* ── Left Column — Profile Card & Addresses ── */}
        <div className="space-y-6 animate-fade-in-up">

          {/* Profile Glass Card */}
          <div className="glass-card p-6 rounded-3xl space-y-5">
            {/* Avatar + Name */}
            <div className="flex flex-col items-center text-center gap-3 pb-4">
              <div className="w-20 h-20 rounded-full border-[3px] border-royal-500 bg-royal-500/10 dark:bg-royal-500/20 flex items-center justify-center shadow-glow-gold-sm animate-glow-pulse">
                <span className="text-2xl font-display font-bold text-royal-500">
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
              <div>
                <h2 className="text-lg font-display font-bold text-noir-600 dark:text-surface-50">
                  {user?.name}
                </h2>
                <span className="badge-gold text-[10px] mt-1.5 inline-flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Member
                </span>
              </div>
            </div>

            <div className="gold-divider" />

            {/* Account Details */}
            <div className="space-y-3.5">
              <h3 className="label-royal text-[10px] tracking-widest text-noir-200 dark:text-surface-300">
                Account Details
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3 p-2.5 rounded-xl bg-surface-50/50 dark:bg-noir-500/30 transition-all duration-300 hover:bg-surface-100/70 dark:hover:bg-noir-400/30">
                  <span className="p-1.5 rounded-lg bg-royal-500/10 text-royal-500">
                    <User className="w-4 h-4" />
                  </span>
                  <span className="font-semibold text-noir-500 dark:text-surface-100">{user?.name}</span>
                </div>
                <div className="flex items-center gap-3 p-2.5 rounded-xl bg-surface-50/50 dark:bg-noir-500/30 transition-all duration-300 hover:bg-surface-100/70 dark:hover:bg-noir-400/30">
                  <span className="p-1.5 rounded-lg bg-royal-500/10 text-royal-500">
                    <Mail className="w-4 h-4" />
                  </span>
                  <span className="font-semibold text-noir-500 dark:text-surface-100">{user?.email}</span>
                </div>
                <div className="flex items-center gap-3 p-2.5 rounded-xl bg-surface-50/50 dark:bg-noir-500/30 transition-all duration-300 hover:bg-surface-100/70 dark:hover:bg-noir-400/30">
                  <span className="p-1.5 rounded-lg bg-royal-500/10 text-royal-500">
                    <Phone className="w-4 h-4" />
                  </span>
                  <span className="font-semibold text-noir-500 dark:text-surface-100">+91 {user?.phone}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Saved Addresses */}
          <div className="card-royal-static p-6 rounded-3xl space-y-4">
            <div className="flex items-center gap-2.5">
              <span className="p-1.5 rounded-lg bg-royal-500/10 text-royal-500">
                <MapPin className="w-5 h-5" />
              </span>
              <h2 className="text-base font-display font-bold text-noir-600 dark:text-surface-50">
                Saved Addresses
              </h2>
            </div>

            {user?.addresses && user.addresses.length > 0 ? (
              <div className="space-y-3 stagger-child">
                {user.addresses.map((addr, idx) => (
                  <div
                    key={idx}
                    className="card-royal p-4 rounded-xl border border-royal-500/10 dark:border-royal-500/15 group"
                  >
                    <div className="flex items-start gap-2.5">
                      <MapPin className="w-3.5 h-3.5 text-royal-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-bold text-sm text-noir-600 dark:text-surface-100">
                          {addr.label}
                        </p>
                        <p className="text-xs text-noir-200 dark:text-surface-300 mt-1 leading-relaxed">
                          {addr.addressLine}, {addr.city}, {addr.state} - {addr.zipCode}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <MapPin className="w-8 h-8 text-noir-100 dark:text-noir-300 mx-auto mb-2" />
                <p className="text-xs text-noir-200 dark:text-surface-300 font-medium">
                  No saved addresses on file.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── Right 2 Columns — Order History ── */}
        <div className="lg:col-span-2 card-royal-static p-6 rounded-3xl space-y-6 animate-fade-in-up" style={{ animationDelay: '100ms' }}>
          <div className="flex items-center gap-2.5 pb-4 border-b border-royal-500/10 dark:border-royal-500/15">
            <span className="p-1.5 rounded-lg bg-royal-500/10 text-royal-500">
              <ClipboardList className="w-5 h-5" />
            </span>
            <h2 className="text-lg font-display font-bold text-noir-600 dark:text-surface-50">
              Order History
            </h2>
            {orders.length > 0 && (
              <span className="badge-neutral text-[10px] ml-auto">
                {orders.length} order{orders.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {isLoading ? (
            <Loader type="spinner" />
          ) : isError ? (
            <div className="text-center py-12">
              <p className="text-xs text-red-500 font-bold">Failed to fetch order history</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-16 space-y-3 animate-fade-in">
              <div className="w-16 h-16 rounded-full bg-royal-500/10 dark:bg-royal-500/20 flex items-center justify-center mx-auto mb-4 animate-bounce-soft">
                <ShoppingBag className="w-8 h-8 text-royal-500" />
              </div>
              <p className="text-sm font-display font-semibold text-noir-400 dark:text-surface-200">
                You haven't ordered anything yet!
              </p>
              <p className="text-xs text-noir-200 dark:text-surface-300">
                Explore restaurants and place your first order
              </p>
              <button
                onClick={() => navigate('/')}
                className="btn-royal text-xs px-6 py-2.5 rounded-xl mt-3 inline-flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" /> Order Your First Meal
              </button>
            </div>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1 stagger-child custom-scrollbar">
              {orders.map((ord) => {
                const date = new Date(ord.createdAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                });

                return (
                  <div
                    key={ord._id}
                    className="card-royal p-4 rounded-2xl flex justify-between items-center group"
                  >
                    <div className="space-y-1.5 text-xs flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-display font-bold text-noir-600 dark:text-surface-50 text-sm">
                          {ord.restaurantId?.name || 'Spice Villa'}
                        </h3>
                        <span className={`${getStatusBadge(ord.status)} text-[10px]`}>
                          {ord.status}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-noir-200 dark:text-surface-300 font-medium">
                        <span>{date}</span>
                        <span className="text-royal-500">•</span>
                        <span className="font-bold text-royal-600 dark:text-royal-500">
                          ₹{ord.totalAmount}
                        </span>
                      </div>

                      <div className="text-[11px] text-noir-200 dark:text-surface-300 font-medium pt-0.5 line-clamp-1">
                        {ord.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
                      </div>
                    </div>

                    <button
                      onClick={() => navigate(`/order-tracking/${ord._id}`)}
                      className="p-2.5 rounded-xl border border-royal-500/20 dark:border-royal-500/15 bg-surface-50/50 dark:bg-noir-500/30 text-noir-300 dark:text-surface-300 group-hover:bg-royal-500 group-hover:text-white group-hover:border-royal-500 group-hover:shadow-glow-gold-sm transition-all duration-300 flex-shrink-0 ml-4 active:scale-[0.95]"
                      title="Track order"
                    >
                      <ArrowUpRight className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default Profile;
