import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { orderAPI } from '../../services/api.js';
import { useAuthStore } from '../../store/authStore.js';
import Loader from '../../components/common/Loader.jsx';
import { User, Phone, Mail, MapPin, ClipboardList, LogOut, ArrowUpRight } from 'lucide-react';

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

  return (
    <div className="space-y-8 pb-16">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">My Profile</h1>
        <button
          onClick={handleLogout}
          className="px-4 py-2 border border-rose-250 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors"
        >
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column - User info & Address */}
        <div className="space-y-6">
          {/* Account Details */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <User className="w-5 h-5 text-brand-500" /> Account Details
            </h2>

            <div className="space-y-3.5 text-sm font-semibold text-slate-650 dark:text-slate-350">
              <div className="flex items-center gap-2">
                <span className="text-slate-400"><User className="w-4 h-4" /></span>
                <span>{user?.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-400"><Mail className="w-4 h-4" /></span>
                <span>{user?.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-400"><Phone className="w-4 h-4" /></span>
                <span>+91 {user?.phone}</span>
              </div>
            </div>
          </div>

          {/* Saved Addresses list */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <MapPin className="w-5 h-5 text-brand-500" /> Saved Addresses
            </h2>

            {user?.addresses && user.addresses.length > 0 ? (
              <div className="space-y-3">
                {user.addresses.map((addr, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-xl text-xs">
                    <p className="font-bold text-slate-800 dark:text-slate-200">{addr.label}</p>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">
                      {addr.addressLine}, {addr.city}, {addr.state} - {addr.zipCode}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 font-medium">No saved addresses on file.</p>
            )}
          </div>
        </div>

        {/* Right 2 Columns - Order History */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm space-y-6">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-700">
            <ClipboardList className="w-5 h-5 text-brand-500" /> Past Orders History
          </h2>

          {isLoading ? (
            <Loader type="spinner" />
          ) : isError ? (
            <p className="text-xs text-rose-500 font-bold text-center">Failed to fetch order history</p>
          ) : orders.length === 0 ? (
            <div className="text-center py-12 text-slate-400 space-y-2">
              <span className="text-4xl">🍔</span>
              <p className="text-sm font-semibold">You haven't ordered anything yet!</p>
              <button
                onClick={() => navigate('/')}
                className="mt-2 text-xs font-bold text-brand-500 hover:text-brand-600 underline"
              >
                Order your first meal
              </button>
            </div>
          ) : (
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
              {orders.map((ord) => {
                const date = new Date(ord.createdAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                });

                return (
                  <div
                    key={ord._id}
                    className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl flex justify-between items-center group hover:border-slate-250 dark:hover:border-slate-700 transition-colors"
                  >
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-bold text-slate-850 dark:text-slate-100 text-sm">
                          {ord.restaurantId?.name || 'Spice Villa'}
                        </h3>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                            ord.status === 'delivered'
                              ? 'bg-emerald-50 border border-emerald-100 text-emerald-600'
                              : ord.status === 'cancelled'
                              ? 'bg-rose-50 border border-rose-100 text-rose-600'
                              : 'bg-amber-50 border border-amber-100 text-amber-600'
                          }`}
                        >
                          {ord.status}
                        </span>
                      </div>
                      <p className="text-slate-400 font-semibold">{date} • ₹{ord.totalAmount}</p>
                      
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium pt-1 line-clamp-1">
                        {ord.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
                      </div>
                    </div>

                    <button
                      onClick={() => navigate(`/order-tracking/${ord._id}`)}
                      className="p-2.5 bg-white dark:bg-slate-800 border border-slate-150 dark:border-slate-750 rounded-xl group-hover:bg-brand-600 group-hover:text-white transition-colors"
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
