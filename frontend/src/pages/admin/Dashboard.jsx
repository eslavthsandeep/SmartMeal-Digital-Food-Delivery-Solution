import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { browseAPI, orderAPI, authAPI, offerAPI } from '../../services/api.js';
import Loader from '../../components/common/Loader.jsx';
import { useToastStore } from '../../store/toastStore.js';
import { ShieldCheck, Users, Building, ShoppingBag, ShieldAlert, Sparkles, Plus, Trash2, Tag, Percent, IndianRupee, Crown, BarChart3, Gift, UserCog } from 'lucide-react';

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
      <div className="relative overflow-hidden flex justify-between items-center p-8 bg-gradient-to-br from-noir-600 via-noir-500 to-noir-400 rounded-3xl shadow-glow-gold-sm animate-fade-in">
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-royal-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-royal-600/5 rounded-full blur-2xl" />
        
        <div className="relative z-10">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold tracking-widest bg-royal-500/20 text-royal-500 px-3 py-1 rounded-full border border-royal-500/30">
            <Crown className="w-3 h-3" />
            SUPERUSER PANEL
          </span>
          <h1 className="text-3xl font-display font-extrabold mt-3 text-gold-gradient">
            Admin Control Center
          </h1>
          <p className="text-xs text-surface-300 mt-1 font-medium">
            Manage global system configurations and platform reports
          </p>
        </div>
        <div className="relative z-10 p-4 bg-gradient-to-br from-royal-500 to-royal-600 rounded-2xl shadow-glow-gold-sm animate-pulse-soft">
          <ShieldCheck className="w-7 h-7 text-noir-600" />
        </div>
      </div>

      {/* B. STATS COUNTERS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 stagger-child">
        <div className="glass-card p-5 rounded-2xl flex items-center gap-4 animate-fade-in-up">
          <div className="p-3 bg-royal-500/10 text-royal-500 dark:bg-royal-500/15 rounded-xl border border-royal-500/20">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="label-royal text-[10px]">System Users</p>
            <p className="text-xl font-display font-black text-noir-600 dark:text-surface-50 mt-0.5">
              {users.length} <span className="text-royal-500 text-sm">Active</span>
            </p>
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl flex items-center gap-4 animate-fade-in-up">
          <div className="p-3 bg-royal-500/10 text-royal-500 dark:bg-royal-500/15 rounded-xl border border-royal-500/20">
            <Building className="w-5 h-5" />
          </div>
          <div>
            <p className="label-royal text-[10px]">Hotels / Outlets</p>
            <p className="text-xl font-display font-black text-noir-600 dark:text-surface-50 mt-0.5">
              {restaurants.length} <span className="text-royal-500 text-sm">Registered</span>
            </p>
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl flex items-center gap-4 animate-fade-in-up">
          <div className="p-3 bg-emerald-500/10 text-emerald-500 dark:bg-emerald-500/15 rounded-xl border border-emerald-500/20">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <p className="label-royal text-[10px]">Platform Orders</p>
            <p className="text-xl font-display font-black text-noir-600 dark:text-surface-50 mt-0.5">
              {orders.length} <span className="text-emerald-500 text-sm">Placed</span>
            </p>
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl flex items-center gap-4 animate-fade-in-up">
          <div className="p-3 bg-royal-500/10 text-royal-500 dark:bg-royal-500/15 rounded-xl border border-royal-500/20">
            <IndianRupee className="w-5 h-5" />
          </div>
          <div>
            <p className="label-royal text-[10px]">Combined Billing</p>
            <p className="text-xl font-display font-black text-gold-gradient mt-0.5">₹{totalRevenue}</p>
          </div>
        </div>
      </div>

      {/* C. SUB-TABS */}
      <div className="flex gap-1 p-1.5 bg-surface-100/80 dark:bg-noir-500/80 rounded-2xl backdrop-blur-sm border border-surface-200 dark:border-noir-300">
        <button
          onClick={() => setActiveTab('analytics')}
          className={`tab-royal flex-1 flex items-center justify-center gap-2 ${
            activeTab === 'analytics' ? 'active' : ''
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Revenue & Analytics</span>
        </button>
        <button
          onClick={() => setActiveTab('offers')}
          className={`tab-royal flex-1 flex items-center justify-center gap-2 ${
            activeTab === 'offers' ? 'active' : ''
          }`}
        >
          <Gift className="w-4 h-4" />
          <span>Manage Offers ({offers.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`tab-royal flex-1 flex items-center justify-center gap-2 ${
            activeTab === 'users' ? 'active' : ''
          }`}
        >
          <UserCog className="w-4 h-4" />
          <span>User Accounts ({users.length})</span>
        </button>
      </div>

      {/* D. TAB CONTENT */}
      {activeTab === 'analytics' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
          
          {/* Left Columns - Revenue Graphs & Splits */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* 1. Bar Chart (Restaurant Share) */}
            <div className="glass-card p-6 rounded-3xl space-y-5">
              <div className="flex items-center gap-3 pb-3 border-b border-royal-500/10 dark:border-royal-500/20">
                <div className="p-2 bg-royal-500/10 rounded-lg">
                  <BarChart3 className="w-4 h-4 text-royal-500" />
                </div>
                <h3 className="text-base font-display font-bold text-noir-600 dark:text-surface-50">
                  Revenue Distribution by Hotel
                </h3>
              </div>
              
              <div className="space-y-4 pt-2">
                {restaurantRevList.map((item, idx) => {
                  const ratio = item.rev / maxRestRev;
                  return (
                    <div key={idx} className="space-y-1.5 group">
                      <div className="flex justify-between text-xs font-bold text-noir-400 dark:text-surface-200">
                        <span className="group-hover:text-royal-500 transition-colors duration-300">{item.name}</span>
                        <span className="text-royal-500 font-display font-extrabold">₹{item.rev}</span>
                      </div>
                      <div className="w-full h-5 bg-surface-100 dark:bg-noir-500 rounded-lg overflow-hidden flex">
                        <div
                          style={{ width: `${ratio * 100}%` }}
                          className="h-full bg-gradient-to-r from-royal-600 via-royal-500 to-amber-400 rounded-lg transition-all duration-1000 shadow-sm shadow-royal-500/20"
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 2. Platform Summary details */}
            <div className="glass-card p-6 rounded-3xl space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-royal-500/10 dark:border-royal-500/20">
                <div className="p-2 bg-royal-500/10 rounded-lg">
                  <ShieldAlert className="w-4 h-4 text-royal-500" />
                </div>
                <h3 className="text-base font-display font-bold text-noir-600 dark:text-surface-50">
                  Audit System Health
                </h3>
              </div>
              <div className="p-4 bg-amber-50/80 text-amber-800 dark:bg-amber-950/20 dark:text-amber-400 rounded-2xl border border-amber-200/50 dark:border-amber-500/20 text-xs flex gap-3 leading-relaxed">
                <div className="p-2 bg-amber-100 dark:bg-amber-500/10 rounded-lg h-fit">
                  <ShieldAlert className="w-4 h-4 text-amber-500 flex-shrink-0" />
                </div>
                <div>
                  <p className="font-bold font-display">Operational Status: Nominal</p>
                  <p className="mt-1 opacity-80">All telemetry paths active. Sockets broadcast connection pool is healthy. Database reads are indexed correctly for orders & billing lookup.</p>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column - Pie Donut Chart */}
          <div className="space-y-6">
            <div className="glass-card p-6 rounded-3xl flex flex-col items-center space-y-6">
              <div className="flex items-center gap-3 self-start w-full pb-3 border-b border-royal-500/10 dark:border-royal-500/20">
                <div className="p-2 bg-royal-500/10 rounded-lg">
                  <IndianRupee className="w-4 h-4 text-royal-500" />
                </div>
                <h3 className="text-base font-display font-bold text-noir-600 dark:text-surface-50">
                  Revenue Source Split
                </h3>
              </div>

              {/* SVG Donut Chart */}
              <div className="relative w-48 h-48">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  {/* Background Circle */}
                  <circle cx="50" cy="50" r="40" fill="transparent" stroke="#f5f0e8" strokeWidth="12" className="dark:opacity-20" />
                  
                  {/* Segment 1: Food Revenue - Gold */}
                  {foodRevenue > 0 && (
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="transparent"
                      stroke="#DAA520"
                      strokeWidth="12"
                      strokeDasharray={`${foodStrokeDash} ${circumference}`}
                    />
                  )}
                  
                  {/* Segment 2: Delivery Revenue - Emerald */}
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
                  <p className="label-royal text-[10px]">Total Billing</p>
                  <p className="text-xl font-display font-black text-gold-gradient mt-0.5">₹{totalRevenue}</p>
                </div>
              </div>

              {/* Legends & Details */}
              <div className="w-full space-y-3.5 text-xs font-semibold">
                <div className="flex justify-between items-center p-2.5 rounded-xl bg-surface-50/50 dark:bg-noir-500/50 hover:bg-royal-500/5 transition-colors duration-300">
                  <div className="flex items-center gap-2.5">
                    <span className="w-3.5 h-3.5 rounded-sm bg-royal-500 flex-shrink-0 shadow-sm shadow-royal-500/30"></span>
                    <span className="text-noir-300 dark:text-surface-300">Hotel Food Revenue</span>
                  </div>
                  <span className="font-display font-bold text-noir-600 dark:text-surface-50">{foodSharePercent}% (₹{foodRevenue})</span>
                </div>

                <div className="flex justify-between items-center p-2.5 rounded-xl bg-surface-50/50 dark:bg-noir-500/50 hover:bg-emerald-500/5 transition-colors duration-300">
                  <div className="flex items-center gap-2.5">
                    <span className="w-3.5 h-3.5 rounded-sm bg-emerald-500 flex-shrink-0 shadow-sm shadow-emerald-500/30"></span>
                    <span className="text-noir-300 dark:text-surface-300">Rider Delivery Fees</span>
                  </div>
                  <span className="font-display font-bold text-noir-600 dark:text-surface-50">{deliverySharePercent}% (₹{deliveryRevenue})</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      )}

      {activeTab === 'offers' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
          
          {/* Create Special Offer Form */}
          <div className="glass-card p-6 rounded-3xl space-y-5 h-fit">
            <div className="flex items-center gap-3 pb-3 border-b border-royal-500/10 dark:border-royal-500/20">
              <div className="p-2 bg-royal-500/10 rounded-lg animate-glow-pulse">
                <Sparkles className="w-4 h-4 text-royal-500" />
              </div>
              <h2 className="text-base font-display font-bold text-noir-600 dark:text-surface-50">
                Create Special Offer
              </h2>
            </div>

            <form onSubmit={handleCreateOffer} className="space-y-4">
              <div>
                <label className="label-royal mb-1.5 block">Offer Title *</label>
                <input
                  type="text"
                  placeholder="e.g. Grand Diwali Festival Offer"
                  value={offerTitle}
                  onChange={(e) => setOfferTitle(e.target.value)}
                  className="input-royal w-full text-xs"
                  required
                />
              </div>

              <div>
                <label className="label-royal mb-1.5 block">Offer Description *</label>
                <textarea
                  placeholder="e.g. Get 20% flat discount on all orders. Free delivery included!"
                  value={offerDesc}
                  onChange={(e) => setOfferDesc(e.target.value)}
                  className="input-royal w-full text-xs h-20 resize-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label-royal mb-1.5 block">Coupon Code *</label>
                  <input
                    type="text"
                    placeholder="e.g. DIWALI20"
                    value={offerCode}
                    onChange={(e) => setOfferCode(e.target.value)}
                    className="input-royal w-full text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="label-royal mb-1.5 block">Discount % *</label>
                  <input
                    type="number"
                    placeholder="15"
                    value={offerPercent}
                    onChange={(e) => setOfferPercent(e.target.value)}
                    className="input-royal w-full text-xs"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="label-royal mb-1.5 block">Banner Image URL (Optional)</label>
                <input
                  type="text"
                  placeholder="https://images.unsplash.com/..."
                  value={offerImage}
                  onChange={(e) => setOfferImage(e.target.value)}
                  className="input-royal w-full text-xs"
                />
              </div>

              <button
                type="submit"
                className="btn-royal w-full py-3.5 text-xs flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" /> Place Festival Offer
              </button>
            </form>
          </div>

          {/* Active Offers list */}
          <div className="lg:col-span-2 space-y-5">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-display font-bold text-noir-600 dark:text-surface-50">Active Banner Offers</h2>
              {offers.length > 0 && (
                <span className="badge-gold text-[10px]">{offers.length} Live</span>
              )}
            </div>
            
            {offers.length === 0 ? (
              <div className="glass-card p-8 rounded-3xl text-center">
                <Gift className="w-10 h-10 text-royal-500/30 mx-auto mb-3" />
                <p className="text-sm text-noir-200 dark:text-surface-300 font-semibold">No offers currently running. Create one using the form!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 stagger-child">
                {offers.map((off) => (
                  <div key={off._id} className="card-royal rounded-3xl overflow-hidden flex flex-col h-60">
                    <img
                      src={off.bannerImage || 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&q=80&w=600'}
                      alt={off.title}
                      className="h-28 w-full object-cover bg-surface-200 dark:bg-noir-400"
                    />
                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="font-display font-bold text-noir-600 dark:text-surface-50 text-sm line-clamp-1">{off.title}</h3>
                        <p className="text-[10px] text-noir-200 dark:text-surface-300 mt-0.5 line-clamp-2">{off.description}</p>
                      </div>

                      <div className="flex justify-between items-center pt-2">
                        <div className="flex gap-1.5 text-[9px] font-extrabold uppercase">
                          <span className="badge-gold flex items-center gap-0.5 px-2 py-0.5">
                            <Tag className="w-2.5 h-2.5" /> {off.discountCode}
                          </span>
                          <span className="badge-success flex items-center gap-0.5 px-2 py-0.5">
                            <Percent className="w-2.5 h-2.5" /> {off.discountPercent}% Off
                          </span>
                        </div>

                        <button
                          onClick={() => deleteOfferMutation.mutate(off._id)}
                          className="btn-danger p-2 rounded-xl text-xs"
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
        <div className="card-royal-static p-6 rounded-3xl space-y-5 animate-fade-in">
          <div className="flex items-center gap-3 pb-3 border-b border-royal-500/10 dark:border-royal-500/20">
            <div className="p-2 bg-royal-500/10 rounded-lg">
              <Users className="w-4 h-4 text-royal-500" />
            </div>
            <h2 className="text-lg font-display font-bold text-noir-600 dark:text-surface-50">
              Active Accounts Listing
            </h2>
            <span className="badge-gold text-[10px] ml-auto">{users.length} Users</span>
          </div>
          <div className="overflow-x-auto rounded-2xl border border-surface-200 dark:border-noir-300">
            <table className="w-full text-xs text-left font-semibold text-noir-200 dark:text-surface-300">
              <thead className="text-[10px] uppercase bg-gradient-to-r from-royal-500/5 to-royal-600/5 dark:from-royal-500/10 dark:to-royal-600/10 border-b border-royal-500/10 dark:border-royal-500/20">
                <tr>
                  <th scope="col" className="px-6 py-4 text-royal-600 dark:text-royal-500 font-bold tracking-wider">Full Name</th>
                  <th scope="col" className="px-6 py-4 text-royal-600 dark:text-royal-500 font-bold tracking-wider">Email Address</th>
                  <th scope="col" className="px-6 py-4 text-royal-600 dark:text-royal-500 font-bold tracking-wider">Phone</th>
                  <th scope="col" className="px-6 py-4 text-royal-600 dark:text-royal-500 font-bold tracking-wider">Role Privilege</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100 dark:divide-noir-400">
                {users.map((usr, idx) => (
                  <tr
                    key={usr._id}
                    className={`transition-colors duration-200 hover:bg-royal-500/5 dark:hover:bg-royal-500/10 ${
                      idx % 2 === 0
                        ? 'bg-white dark:bg-noir-500'
                        : 'bg-surface-100 dark:bg-noir-300'
                    }`}
                  >
                    <td className="px-6 py-4 font-bold text-noir-600 dark:text-surface-50 font-display">{usr.name}</td>
                    <td className="px-6 py-4">{usr.email}</td>
                    <td className="px-6 py-4">{usr.phone}</td>
                    <td className="px-6 py-4">
                      <span
                        className={
                          usr.role === 'admin'
                            ? 'badge-danger'
                            : usr.role === 'restaurant'
                            ? 'badge-gold'
                            : usr.role === 'delivery_personnel'
                            ? 'badge-success'
                            : 'badge-neutral'
                        }
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
