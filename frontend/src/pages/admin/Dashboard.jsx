import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { browseAPI, orderAPI } from '../../services/api.js';
import Loader from '../../components/common/Loader.jsx';
import { ShieldCheck, Users, Building, ShoppingBag, ShieldAlert } from 'lucide-react';

export const AdminDashboard = () => {
  // Fetch restaurants
  const { data: resData, isLoading: resLoading } = useQuery({
    queryKey: ['admin-restaurants'],
    queryFn: () => browseAPI.getRestaurants()
  });

  const restaurants = resData?.data || [];

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex justify-between items-center p-6 bg-slate-900 text-white rounded-3xl shadow-sm">
        <div>
          <span className="text-[10px] font-bold tracking-wider bg-white/20 px-2 py-0.5 rounded">
            SUPERUSER PANEL
          </span>
          <h1 className="text-2xl font-extrabold mt-1">Admin Control Room</h1>
          <p className="text-xs text-slate-350">Manage global system configurations and platform reports</p>
        </div>
        <div className="p-3 bg-indigo-600 rounded-2xl animate-pulse-soft">
          <ShieldCheck className="w-6 h-6 text-white" />
        </div>
      </div>

      {/* Admin stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-5 bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-500 rounded-2xl">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase">System Users</p>
            <p className="text-2xl font-black text-slate-850 dark:text-white mt-0.5">24 Active</p>
          </div>
        </div>

        <div className="p-5 bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-500 rounded-2xl">
            <Building className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase">Active Restaurants</p>
            <p className="text-2xl font-black text-slate-850 dark:text-white mt-0.5">{restaurants.length} Outlets</p>
          </div>
        </div>

        <div className="p-5 bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-500 rounded-2xl">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase">Platform Orders</p>
            <p className="text-2xl font-black text-slate-850 dark:text-white mt-0.5">86 Transactions</p>
          </div>
        </div>
      </div>

      {/* Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Restaurants listing */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white pb-2.5 border-b border-slate-100 dark:border-slate-700">
            Registered Merchants
          </h2>

          {resLoading ? (
            <Loader type="spinner" />
          ) : (
            <div className="space-y-3">
              {restaurants.map((res) => (
                <div key={res._id} className="p-3.5 bg-slate-50 dark:bg-slate-900 rounded-2xl flex justify-between items-center text-xs">
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-white text-sm">{res.name}</h3>
                    <p className="text-slate-400 mt-0.5 font-medium">{res.cuisines.join(', ')}</p>
                  </div>
                  <span className="px-2 py-0.5 bg-emerald-105 text-emerald-600 font-bold rounded">
                    OPEN
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Demo info */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm space-y-4 h-fit">
          <h2 className="text-base font-bold text-slate-900 dark:text-white pb-2.5 border-b border-slate-100 dark:border-slate-700">
            System Alerts
          </h2>
          <div className="p-4 bg-amber-50 text-amber-850 dark:bg-amber-950/20 dark:text-amber-400 rounded-2xl border border-amber-200 text-xs flex gap-2.5 leading-relaxed">
            <ShieldAlert className="w-5 h-5 text-amber-500 flex-shrink-0" />
            <div>
              <p className="font-bold">System Status: Nominal</p>
              <p className="mt-1">All real-time Socket.IO hubs are online. MongoDB Atlas is responding within acceptable limits. LLM queries have been configured with automatic fallback routing.</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminDashboard;
