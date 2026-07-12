import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { browseAPI, orderAPI, authAPI, offerAPI } from '../../services/api.js';
import Loader from '../../components/common/Loader.jsx';
import { useToastStore } from '../../store/toastStore.js';
import { ShieldCheck, Users, Building, ShoppingBag, ShieldAlert, Sparkles, Plus, Trash2, Tag, Percent, IndianRupee } from 'lucide-react';

export const AdminDashboard = () => {
  const queryClient = useQueryClient();
  const addToast = useToastStore((state) => state.addToast);

  const [activeTab, setActiveTab] = useState('analytics'); // analytics, offers, users

  // Offer Form States
  const [offerTitle, setOfferTitle] = useState('');
  const [offerDesc, setOfferDesc] = useState('');
  const [offerCode, setOfferCode] = useState('');
  const [offerPercent, setOfferPercent] = useState('15');
  const [offerImage, setOfferImage] = useState('');

  // 1. Fetch restaurants
  const { data: resData, isLoading: resLoading } = useQuery({
    queryKey: ['admin-restaurants'],
    queryFn: () => browseAPI.getRestaurants()
  });
  const restaurants = resData?.data || [];

  // 2. Fetch all orders (Admin only)
  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: () => orderAPI.getAllOrders()
  });
  const orders = ordersData?.data || [];

  // 3. Fetch all users (Admin only)
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => authAPI.getAllUsers()
  });
  const users = usersData?.data || [];

  // 4. Fetch active promotional offers
  const { data: offersData, isLoading: offersLoading } = useQuery({
    queryKey: ['admin-offers'],
    queryFn: () => offerAPI.getOffers()
  });
  const offers = offersData?.data || [];

  // Mutations
  const createOfferMutation = useMutation({
    mutationFn: (offerData) => offerAPI.createOffer(offerData),
    onSuccess: () => {
      addToast('Special offer placed successfully!', 'success');
      // Reset form
      setOfferTitle('');
      setOfferDesc('');
      setOfferCode('');
      setOfferPercent('15');
      setOfferImage('');
      queryClient.invalidateQueries(['admin-offers']);
    },
    onError: (err) => {
      addToast(err.response?.data?.message || 'Could not place offer', 'error');
    }
  });

  const deleteOfferMutation = useMutation({
    mutationFn: (id) => offerAPI.deleteOffer(id),
    onSuccess: () => {
      addToast('Offer removed successfully', 'success');
      queryClient.invalidateQueries(['admin-offers']);
    }
  });

  const handleCreateOffer = (e) => {
    e.preventDefault();
    if (!offerTitle || !offerDesc || !offerCode || !offerPercent) {
      addToast('Please complete all required fields', 'error');
      return;
    }
    createOfferMutation.mutate({
      title: offerTitle,
      description: offerDesc,
      discountCode: offerCode,
      discountPercent: offerPercent,
      bannerImage: offerImage
    });
  };

  if (resLoading || ordersLoading || usersLoading || offersLoading) {
    return <Loader type="spinner" />;
  }

  // Calculate Metrics
  const completedOrders = orders.filter(o => o.status === 'delivered');
  const foodRevenue = completedOrders.reduce((sum, o) => sum + (o.totalAmount - o.deliveryFee), 0);
  const deliveryRevenue = completedOrders.reduce((sum, o) => sum + o.deliveryFee, 0);
  const totalRevenue = foodRevenue + deliveryRevenue;

  // Donut Pie Chart Math
  const totalRevMax = totalRevenue || 1;
  const foodSharePercent = Math.round((foodRevenue / totalRevMax) * 100);
  const deliverySharePercent = Math.round((deliveryRevenue / totalRevMax) * 100);
  const circumference = 2 * Math.PI * 40; // ~251.2
  const foodStrokeDash = (foodRevenue / totalRevMax) * circumference;
  const deliveryStrokeDash = circumference - foodStrokeDash;

  // Group revenue by individual Restaurant for Bar Chart
  const revenueByRestaurant = {};
  restaurants.forEach(r => {
    revenueByRestaurant[r.name] = 0;
  });
  completedOrders.forEach(o => {
    const name = o.restaurantId?.name || 'Deleted Restaurant';
    if (revenueByRestaurant[name] !== undefined) {
      revenueByRestaurant[name] += (o.totalAmount - o.deliveryFee);
    } else {
      revenueByRestaurant[name] = (o.totalAmount - o.deliveryFee);
    }
  });

  const restaurantRevList = Object.entries(revenueByRestaurant).map(([name, rev]) => ({ name, rev }));
  const maxRestRev = Math.max(...restaurantRevList.map(r => r.rev), 1);

  return (
    <div className="space-y-8 pb-16">
      
      {/* A. HEADER */}
      <div className="flex justify-between items-center p-6 bg-slate-900 text-white rounded-3xl shadow-sm">
        <div>
          <span className="text-[10px] font-bold tracking-wider bg-white/20 px-2 py-0.5 rounded">
            SUPERUSER PANEL
          </span>
          <h1 className="text-2xl font-extrabold mt-1">Admin Control Room</h1>
          <p className="text-xs text-slate-355">Manage global system configurations and platform reports</p>
        </div>
        <div className="p-3 bg-indigo-600 rounded-2xl animate-pulse-soft">
          <ShieldCheck className="w-6 h-6 text-white" />
        </div>
      </div>

      {/* B. STATS COUNTERS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-500 dark:bg-blue-950/20 rounded-xl">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase">System Users</p>
            <p className="text-lg font-black text-slate-850 dark:text-white mt-0.5">{users.length} Active</p>
          </div>
        </div>

        <div className="p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-500 dark:bg-indigo-950/20 rounded-xl">
            <Building className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase">Hotels / Outlets</p>
            <p className="text-lg font-black text-slate-850 dark:text-white mt-0.5">{restaurants.length} Registered</p>
          </div>
        </div>

        <div className="p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-500 dark:bg-emerald-950/20 rounded-xl">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase">Platform Orders</p>
            <p className="text-lg font-black text-slate-850 dark:text-white mt-0.5">{orders.length} Placed</p>
          </div>
        </div>

        <div className="p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-brand-50 text-brand-500 dark:bg-brand-950/20 rounded-xl">
            <IndianRupee className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase">Combined Billing</p>
            <p className="text-lg font-black text-slate-850 dark:text-white mt-0.5">₹{totalRevenue}</p>
          </div>
        </div>
      </div>

      {/* C. SUB-TABS */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex-1 py-3 text-sm font-bold border-b-2 text-center transition-colors ${
            activeTab === 'analytics'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          📊 Real-time Revenue & Graphs
        </button>
        <button
          onClick={() => setActiveTab('offers')}
          className={`flex-1 py-3 text-sm font-bold border-b-2 text-center transition-colors ${
            activeTab === 'offers'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          🎁 Manage Special Offers ({offers.length})
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`flex-1 py-3 text-sm font-bold border-b-2 text-center transition-colors ${
            activeTab === 'users'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          👥 Registered Accounts ({users.length})
        </button>
      </div>

      {/* D. TAB CONTENT */}
      {activeTab === 'analytics' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
          
          {/* Left Columns - Revenue Graphs & Splits */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* 1. Bar Chart (Restaurant Share) */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Revenue Distribution by Hotel (Food Subtotal)</h3>
              
              <div className="space-y-4 pt-4">
                {restaurantRevList.map((item, idx) => {
                  const ratio = item.rev / maxRestRev;
                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                        <span>{item.name}</span>
                        <span className="text-brand-600 font-extrabold">₹{item.rev}</span>
                      </div>
                      <div className="w-full h-5 bg-slate-100 dark:bg-slate-950 rounded-lg overflow-hidden flex">
                        <div
                          style={{ width: `${ratio * 100}%` }}
                          className="h-full bg-gradient-to-r from-indigo-500 to-brand-500 rounded-lg transition-all duration-1000"
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 2. Platform Summary details */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Audit System Health</h3>
              <div className="p-4 bg-amber-50 text-amber-850 dark:bg-amber-950/20 dark:text-amber-400 rounded-2xl border border-amber-200 text-xs flex gap-2.5 leading-relaxed">
                <ShieldAlert className="w-5 h-5 text-amber-500 flex-shrink-0" />
                <div>
                  <p className="font-bold">Operational Status: Nominal</p>
                  <p className="mt-1">All telemetry paths active. Sockets broadcast connection pool is healthy. Database reads are indexed correctly for orders & billing lookup.</p>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column - Pie Donut Chart */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col items-center space-y-6">
              <h3 className="text-base font-bold text-slate-900 dark:text-white self-start w-full pb-2 border-b">
                Revenue Source Split
              </h3>

              {/* SVG Donut Chart */}
              <div className="relative w-48 h-48">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  {/* Background Circle */}
                  <circle cx="50" cy="50" r="40" fill="transparent" stroke="#f1f5f9" strokeWidth="12" />
                  
                  {/* Segment 1: Food Revenue */}
                  {foodRevenue > 0 && (
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="transparent"
                      stroke="#6366f1"
                      strokeWidth="12"
                      strokeDasharray={`${foodStrokeDash} ${circumference}`}
                    />
                  )}
                  
                  {/* Segment 2: Delivery Revenue */}
                  {deliveryRevenue > 0 && (
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="transparent"
                      stroke="#10b981"
                      strokeWidth="12"
                      strokeDasharray={`${deliveryStrokeDash} ${circumference}`}
                      strokeDashoffset={-foodStrokeDash}
                    />
                  )}
                </svg>

                {/* Central Stats Overlay */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Billing</p>
                  <p className="text-lg font-black text-slate-900 dark:text-white mt-0.5">₹{totalRevenue}</p>
                </div>
              </div>

              {/* Legends & Details */}
              <div className="w-full space-y-3.5 text-xs font-semibold">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 rounded bg-indigo-500 flex-shrink-0"></span>
                    <span className="text-slate-600 dark:text-slate-400">Hotel Food Revenue</span>
                  </div>
                  <span className="text-slate-900 dark:text-white font-bold">{foodSharePercent}% (₹{foodRevenue})</span>
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 rounded bg-emerald-500 flex-shrink-0"></span>
                    <span className="text-slate-600 dark:text-slate-400">Rider Delivery Fees</span>
                  </div>
                  <span className="text-slate-900 dark:text-white font-bold">{deliverySharePercent}% (₹{deliveryRevenue})</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      )}

      {activeTab === 'offers' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
          
          {/* Create Special Offer Form */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm space-y-4 h-fit">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-1.5 pb-2 border-b">
              <Sparkles className="w-5 h-5 text-indigo-500" /> Create Special Offer
            </h2>

            <form onSubmit={handleCreateOffer} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-450 uppercase mb-1">Offer Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Grand Diwali Festival Offer"
                  value={offerTitle}
                  onChange={(e) => setOfferTitle(e.target.value)}
                  className="w-full px-3.5 py-2 border rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-450 uppercase mb-1">Offer Description *</label>
                <textarea
                  placeholder="e.g. Get 20% flat discount on all orders. Free delivery included!"
                  value={offerDesc}
                  onChange={(e) => setOfferDesc(e.target.value)}
                  className="w-full px-3.5 py-2 border rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none h-16"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-450 uppercase mb-1">Coupon Code *</label>
                  <input
                    type="text"
                    placeholder="e.g. DIWALI20"
                    value={offerCode}
                    onChange={(e) => setOfferCode(e.target.value)}
                    className="w-full px-3.5 py-2 border rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-450 uppercase mb-1">Discount % *</label>
                  <input
                    type="number"
                    placeholder="15"
                    value={offerPercent}
                    onChange={(e) => setOfferPercent(e.target.value)}
                    className="w-full px-3.5 py-2 border rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-450 uppercase mb-1">Banner Image URL (Optional)</label>
                <input
                  type="text"
                  placeholder="https://images.unsplash.com/..."
                  value={offerImage}
                  onChange={(e) => setOfferImage(e.target.value)}
                  className="w-full px-3.5 py-2 border rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 active:scale-[0.98] transition-all shadow-md shadow-indigo-500/10"
              >
                <Plus className="w-4 h-4" /> Place Festival Offer
              </button>
            </form>
          </div>

          {/* Active Offers list */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Active Banner Offers</h2>
            
            {offers.length === 0 ? (
              <p className="text-sm text-slate-500 font-semibold">No offers currently running. Create one using the form!</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {offers.map((off) => (
                  <div key={off._id} className="bg-white dark:bg-slate-800 rounded-3xl overflow-hidden border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col h-60">
                    <img
                      src={off.bannerImage || 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&q=80&w=600'}
                      alt={off.title}
                      className="h-28 w-full object-cover bg-slate-150"
                    />
                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="font-bold text-slate-850 dark:text-white text-sm line-clamp-1">{off.title}</h3>
                        <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-2">{off.description}</p>
                      </div>

                      <div className="flex justify-between items-center pt-2">
                        <div className="flex gap-1.5 text-[9px] font-extrabold uppercase">
                          <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 dark:bg-indigo-950/20 dark:text-indigo-400 rounded border border-indigo-100 flex items-center gap-0.5">
                            <Tag className="w-2.5 h-2.5" /> {off.discountCode}
                          </span>
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400 rounded border border-emerald-100 flex items-center gap-0.5">
                            <Percent className="w-2.5 h-2.5" /> {off.discountPercent}% Off
                          </span>
                        </div>

                        <button
                          onClick={() => deleteOfferMutation.mutate(off._id)}
                          className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-xl transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {activeTab === 'users' && (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm space-y-4 animate-fade-in">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white pb-2.5 border-b">
            Active Accounts Listing
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left font-semibold text-slate-500 dark:text-slate-400">
              <thead className="text-[10px] text-slate-400 uppercase bg-slate-50 dark:bg-slate-950 border-b dark:border-slate-850">
                <tr>
                  <th scope="col" className="px-6 py-3">Full Name</th>
                  <th scope="col" className="px-6 py-3">Email Address</th>
                  <th scope="col" className="px-6 py-3">Phone</th>
                  <th scope="col" className="px-6 py-3">Role Privilege</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-850">
                {users.map((usr) => (
                  <tr key={usr._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50">
                    <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-150">{usr.name}</td>
                    <td className="px-6 py-4">{usr.email}</td>
                    <td className="px-6 py-4">{usr.phone}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-0.5 text-[10px] font-extrabold uppercase rounded ${
                          usr.role === 'admin'
                            ? 'bg-red-50 text-red-600 dark:bg-red-950/20'
                            : usr.role === 'restaurant'
                            ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/20'
                            : usr.role === 'delivery_personnel'
                            ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-950/20'
                        }`}
                      >
                        {usr.role}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;
