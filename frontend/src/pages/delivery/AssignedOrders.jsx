import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orderAPI, deliveryAPI } from '../../services/api.js';
import { useAuthStore } from '../../store/authStore.js';
import { useToastStore } from '../../store/toastStore.js';
import { useSocket } from '../../context/SocketContext.jsx';
import Loader from '../../components/common/Loader.jsx';
import { Bike, Navigation, MapPin, CheckCircle, HandMetal, Play, Check, Crown, Wallet, Package, Zap, Clock, ArrowRight, Sparkles } from 'lucide-react';

export const AssignedOrders = () => {
  const queryClient = useQueryClient();
  const addToast = useToastStore((state) => state.addToast);
  const { user } = useAuthStore();
  const { socket, updateDeliveryLocation } = useSocket();

  const [activeTab, setActiveTab] = useState('active'); // active, board
  
  // Coordinates interpolation simulation
  const [sliderVal, setSliderVal] = useState(0); // 0 (at restaurant) to 100 (at customer)
  const [simulatingDeliveryId, setSimulatingDeliveryId] = useState(null);

  // 1. Fetch unassigned orders
  const { data: boardData, isLoading: boardLoading } = useQuery({
    queryKey: ['unassigned-orders'],
    queryFn: orderAPI.getUnassigned,
    enabled: activeTab === 'board'
  });

  // 2. Fetch my active deliveries
  const { data: myJobsData, isLoading: jobsLoading } = useQuery({
    queryKey: ['my-deliveries'],
    queryFn: deliveryAPI.getMyDeliveries,
    enabled: activeTab === 'active'
  });

  // Mutations
  const claimJobMutation = useMutation({
    mutationFn: (orderId) => deliveryAPI.assignAgent(orderId, user.id),
    onSuccess: () => {
      addToast('Delivery job claimed successfully!', 'success');
      setActiveTab('active');
      queryClient.invalidateQueries(['my-deliveries']);
      queryClient.invalidateQueries(['unassigned-orders']);
    },
    onError: (err) => {
      addToast(err.response?.data?.message || 'Could not claim job', 'error');
    }
  });

  const updateDeliveryStatusMutation = useMutation({
    mutationFn: ({ id, status }) => deliveryAPI.updateStatus(id, status),
    onSuccess: (data, variables) => {
      addToast(`Status updated: ${variables.status}`, 'success');
      queryClient.invalidateQueries(['my-deliveries']);
      if (variables.status === 'delivered') {
        setSimulatingDeliveryId(null);
        setSliderVal(0);
      }
    }
  });

  // GPS Simulation Trigger
  const handleGpsSliderChange = async (e, delivery) => {
    const val = parseInt(e.target.value);
    setSliderVal(val);
    setSimulatingDeliveryId(delivery._id);

    // Get endpoint coordinates
    const rLat = delivery.orderId.restaurantId.address?.lat || 12.9250;
    const rLng = delivery.orderId.restaurantId.address?.lng || 77.6800;
    const cLat = delivery.orderId.deliveryAddress?.lat || 12.9123;
    const cLng = delivery.orderId.deliveryAddress?.lng || 77.6789;

    // Linearly interpolate coordinates
    const ratio = val / 100;
    const currentLat = rLat + (cLat - rLat) * ratio;
    const currentLng = rLng + (cLng - rLng) * ratio;

    // Send coordinates via socket and database REST update
    updateDeliveryLocation({
      orderId: delivery.orderId._id,
      lat: currentLat,
      lng: currentLng,
      agentName: user.name
    });

    // Throttle or debounced save: for demo, we write coordinate updates directly
    if (val % 20 === 0 || val === 100) {
      try {
        await deliveryAPI.updateLocation(delivery._id, currentLat, currentLng);
      } catch (err) {
        console.error('Failed to sync location with database', err);
      }
    }
  };

  const allDeliveries = myJobsData?.data || [];
  const activeJobs = allDeliveries.filter(d => d.status !== 'delivered' && d.status !== 'cancelled');
  const completedJobs = allDeliveries.filter(d => d.status === 'delivered');
  const totalEarnings = completedJobs.reduce((sum, d) => sum + (d.orderId?.deliveryFee || 40), 0);

  const boardOrders = boardData?.data || [];

  const statusConfig = {
    assigned: { label: 'ASSIGNED', badgeClass: 'badge-warning' },
    picked_up: { label: 'PICKED UP', badgeClass: 'badge-info' },
    out_for_delivery: { label: 'EN ROUTE', badgeClass: 'badge-gold' },
    delivered: { label: 'DELIVERED', badgeClass: 'badge-success' },
    cancelled: { label: 'CANCELLED', badgeClass: 'badge-danger' },
  };

  return (
    <div className="space-y-8 pb-16 animate-fade-in">
      
      {/* ─── Hero Header Banner ─── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-noir-600 via-noir-500 to-noir-600 p-8 shadow-glow-gold-sm">
        {/* Decorative gold mesh overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(218,165,32,0.15),transparent_60%)]" />
        <div className="absolute top-0 right-0 w-40 h-40 bg-royal-500/10 rounded-full blur-3xl" />
        
        <div className="relative flex justify-between items-center">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold tracking-[0.2em] uppercase bg-royal-500/20 text-royal-500 px-3 py-1 rounded-full border border-royal-500/30">
              <Crown className="w-3 h-3" />
              Delivery Portal
            </span>
            <h1 className="text-3xl font-display font-bold text-gold-gradient">
              Rider Dashboard
            </h1>
            <p className="text-sm text-surface-300 font-medium">
              Welcome back, <span className="text-royal-500 font-semibold">{user?.name}</span>
            </p>
          </div>
          <div className="p-4 bg-gradient-to-br from-royal-500 to-royal-600 rounded-2xl shadow-glow-gold-sm animate-float">
            <Bike className="w-7 h-7 text-white" />
          </div>
        </div>
      </div>

      {/* ─── Stats Cards ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {/* Earnings */}
        <div className="glass-card p-6 rounded-2xl animate-fade-in-up">
          <div className="flex items-center justify-between mb-3">
            <p className="label-royal text-[10px]">Lifetime Earnings</p>
            <div className="p-2 bg-royal-500/10 rounded-xl">
              <Wallet className="w-4 h-4 text-royal-500" />
            </div>
          </div>
          <p className="text-3xl font-display font-bold text-gold-gradient">₹{totalEarnings}</p>
          <p className="text-[11px] text-surface-400 dark:text-noir-200 mt-1.5 font-medium">Direct payout from delivery fees</p>
        </div>

        {/* Completed Gigs */}
        <div className="glass-card p-6 rounded-2xl animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center justify-between mb-3">
            <p className="label-royal text-[10px]">Completed Gigs</p>
            <div className="p-2 bg-emerald-500/10 rounded-xl">
              <Package className="w-4 h-4 text-emerald-500" />
            </div>
          </div>
          <p className="text-3xl font-display font-bold text-noir-600 dark:text-white">{completedJobs.length} <span className="text-lg text-surface-400 dark:text-noir-200">Deliveries</span></p>
          <p className="text-[11px] text-surface-400 dark:text-noir-200 mt-1.5 font-medium">Orders successfully delivered</p>
        </div>

        {/* Active Duty */}
        <div className="glass-card p-6 rounded-2xl animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center justify-between mb-3">
            <p className="label-royal text-[10px]">Active Duty</p>
            <div className="p-2 bg-amber-500/10 rounded-xl">
              <Zap className="w-4 h-4 text-amber-500" />
            </div>
          </div>
          <p className="text-3xl font-display font-bold text-royal-500">{activeJobs.length} <span className="text-lg text-surface-400 dark:text-noir-200">Assigned</span></p>
          <p className="text-[11px] text-surface-400 dark:text-noir-200 mt-1.5 font-medium">Jobs currently being processed</p>
        </div>
      </div>

      {/* ─── Tab Navigation ─── */}
      <div className="flex gap-1 p-1 bg-surface-100 dark:bg-noir-500 rounded-2xl">
        <button
          onClick={() => setActiveTab('active')}
          className={`tab-royal flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold rounded-xl transition-all duration-300 ${
            activeTab === 'active' ? 'active' : ''
          }`}
        >
          <Bike className="w-4 h-4" />
          My Assignments ({activeJobs.length})
        </button>
        <button
          onClick={() => setActiveTab('board')}
          className={`tab-royal flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold rounded-xl transition-all duration-300 ${
            activeTab === 'board' ? 'active' : ''
          }`}
        >
          <Sparkles className="w-4 h-4" />
          Gig Board
        </button>
      </div>

      {/* ═══════════════ A. MY ACTIVE ASSIGNMENTS ═══════════════ */}
      {activeTab === 'active' && (
        <div className="space-y-6 animate-fade-in">
          {jobsLoading ? (
            <Loader type="spinner" />
          ) : activeJobs.length === 0 ? (
            /* ── Empty State ── */
            <div className="glass-card text-center py-20 px-8 rounded-3xl animate-fade-in-up">
              <div className="inline-flex p-5 bg-royal-500/10 rounded-full mb-5">
                <Clock className="w-10 h-10 text-royal-500 animate-pulse-soft" />
              </div>
              <h3 className="text-xl font-display font-bold text-noir-600 dark:text-white">No Active Delivery Jobs</h3>
              <p className="text-sm text-surface-400 dark:text-noir-200 mt-2 max-w-sm mx-auto">
                Head over to the <span className="text-royal-500 font-semibold">Gig Board</span> to claim new delivery opportunities.
              </p>
              <button
                onClick={() => setActiveTab('board')}
                className="btn-royal-outline mt-6 inline-flex items-center gap-2 text-sm"
              >
                Browse Gig Board <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {activeJobs.map((job, index) => {
                const isPickedUp = job.status === 'picked_up';
                const isOutForDelivery = job.orderId.status === 'out_for_delivery';
                const currentStatus = statusConfig[job.status] || { label: job.status.toUpperCase(), badgeClass: 'badge-neutral' };

                return (
                  <div
                    key={job._id}
                    className="card-royal p-0 rounded-3xl overflow-hidden animate-fade-in-up"
                    style={{ animationDelay: `${index * 0.08}s` }}
                  >
                    {/* Card Header */}
                    <div className="flex justify-between items-center px-6 pt-6 pb-4 border-b border-surface-100 dark:border-noir-400">
                      <div>
                        <p className="font-display font-bold text-noir-600 dark:text-white text-base">
                          Delivery #{job._id.slice(-6)}
                        </p>
                        <p className="text-xs text-surface-400 dark:text-noir-200 font-medium mt-0.5">
                          Order Total: <span className="text-royal-500 font-bold">₹{job.orderId.totalAmount}</span>
                        </p>
                      </div>
                      <span className={`${currentStatus.badgeClass} text-[10px]`}>
                        {currentStatus.label}
                      </span>
                    </div>

                    {/* Route Info: Restaurant → Customer */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-6 py-5">
                      {/* Restaurant */}
                      <div className="p-4 bg-surface-50 dark:bg-noir-500 rounded-2xl space-y-1.5 border border-surface-100 dark:border-noir-400">
                        <div className="flex items-center gap-1.5 mb-2">
                          <div className="w-2 h-2 rounded-full bg-royal-500 animate-glow-pulse" />
                          <p className="text-[10px] text-royal-500 font-bold uppercase tracking-[0.15em]">Pick From Restaurant</p>
                        </div>
                        <p className="font-bold text-noir-600 dark:text-white text-sm">{job.orderId.restaurantId.name}</p>
                        <p className="text-xs text-surface-400 dark:text-noir-200 font-medium">
                          {job.orderId.restaurantId.address.addressLine}
                        </p>
                      </div>
                      
                      {/* Customer */}
                      <div className="p-4 bg-surface-50 dark:bg-noir-500 rounded-2xl space-y-1.5 border border-surface-100 dark:border-noir-400">
                        <div className="flex items-center gap-1.5 mb-2">
                          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-glow-pulse" />
                          <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-[0.15em]">Deliver To Customer</p>
                        </div>
                        <p className="font-bold text-noir-600 dark:text-white text-sm">{job.orderId.customerId.name}</p>
                        <p className="text-xs text-surface-400 dark:text-noir-200 font-medium">
                          {job.orderId.deliveryAddress.addressLine}
                        </p>
                      </div>
                    </div>

                    {/* ── GPS Simulation Slider (Visible after picking up) ── */}
                    {job.status === 'picked_up' && (
                      <div className="mx-6 mb-4 p-5 bg-gradient-to-r from-royal-500/5 via-royal-500/10 to-royal-500/5 dark:from-royal-500/10 dark:via-royal-500/15 dark:to-royal-500/10 rounded-2xl border border-royal-500/20 space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="flex items-center gap-2 text-xs font-bold text-royal-600 dark:text-royal-500">
                            <Navigation className="w-4 h-4 text-royal-500 animate-pulse" />
                            Live GPS Simulation
                          </span>
                          <span className="badge-gold text-[10px]">
                            {simulatingDeliveryId === job._id ? sliderVal : 0}% Complete
                          </span>
                        </div>
                        
                        {/* Custom Gold Slider */}
                        <div className="relative">
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={simulatingDeliveryId === job._id ? sliderVal : 0}
                            onChange={(e) => handleGpsSliderChange(e, job)}
                            className="w-full h-2 rounded-lg appearance-none cursor-pointer
                              bg-gradient-to-r from-surface-200 to-surface-300 dark:from-noir-400 dark:to-noir-300
                              [&::-webkit-slider-thumb]:appearance-none
                              [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5
                              [&::-webkit-slider-thumb]:rounded-full
                              [&::-webkit-slider-thumb]:bg-gradient-to-br [&::-webkit-slider-thumb]:from-royal-500 [&::-webkit-slider-thumb]:to-royal-600
                              [&::-webkit-slider-thumb]:shadow-glow-gold-sm
                              [&::-webkit-slider-thumb]:cursor-pointer
                              [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:duration-200
                              [&::-webkit-slider-thumb]:hover:scale-125
                              [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5
                              [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0
                              [&::-moz-range-thumb]:bg-gradient-to-br [&::-moz-range-thumb]:from-royal-500 [&::-moz-range-thumb]:to-royal-600
                              [&::-moz-range-thumb]:shadow-glow-gold-sm
                              [&::-moz-range-thumb]:cursor-pointer"
                          />
                          {/* Progress fill bar */}
                          <div
                            className="absolute top-0 left-0 h-2 rounded-lg bg-gradient-to-r from-royal-500 to-royal-600 pointer-events-none"
                            style={{ width: `${simulatingDeliveryId === job._id ? sliderVal : 0}%` }}
                          />
                        </div>

                        <p className="text-[11px] text-surface-400 dark:text-noir-200 font-medium flex items-center gap-1.5">
                          <Sparkles className="w-3 h-3 text-royal-500" />
                          Slide to simulate driving from Restaurant (0%) to Customer (100%). The customer's map updates in real-time!
                        </p>
                      </div>
                    )}

                    {/* ── Status Action Buttons ── */}
                    <div className="flex gap-3 justify-end px-6 pb-6 pt-2">
                      {job.status === 'assigned' && (
                        <button
                          onClick={() => updateDeliveryStatusMutation.mutate({ id: job._id, status: 'picked_up' })}
                          className="btn-royal flex items-center gap-2 text-xs px-5 py-2.5"
                        >
                          <Play className="w-3.5 h-3.5" /> Pick Up Order
                        </button>
                      )}

                      {job.status === 'picked_up' && (
                        <button
                          onClick={() => updateDeliveryStatusMutation.mutate({ id: job._id, status: 'delivered' })}
                          disabled={simulatingDeliveryId === job._id && sliderVal < 100}
                          className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-md active:scale-[0.98] transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
                        >
                          <CheckCircle className="w-3.5 h-3.5" /> Mark Delivered
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ═══════════════ B. GIG BOARD ═══════════════ */}
      {activeTab === 'board' && (
        <div className="space-y-6 animate-fade-in">
          {boardLoading ? (
            <Loader type="spinner" />
          ) : boardOrders.length === 0 ? (
            /* ── Empty Board State ── */
            <div className="glass-card text-center py-20 px-8 rounded-3xl animate-fade-in-up">
              <div className="inline-flex p-5 bg-surface-100 dark:bg-noir-400 rounded-full mb-5">
                <Package className="w-10 h-10 text-surface-300 dark:text-noir-200" />
              </div>
              <h3 className="text-xl font-display font-bold text-noir-600 dark:text-white">Gig Board is Empty</h3>
              <p className="text-sm text-surface-400 dark:text-noir-200 mt-2 max-w-sm mx-auto">
                All active restaurant orders are currently claimed by other riders. Check back soon!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {boardOrders.map((ord, index) => (
                <div
                  key={ord._id}
                  className="card-royal p-5 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 animate-fade-in-up"
                  style={{ animationDelay: `${index * 0.06}s` }}
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <p className="font-display font-bold text-noir-600 dark:text-white text-sm">
                        Order #{ord._id.slice(-6)}
                      </p>
                      <span className="badge-gold text-[9px]">New</span>
                    </div>
                    <p className="flex items-center gap-1.5 text-xs font-semibold text-noir-600 dark:text-surface-200">
                      <MapPin className="w-3.5 h-3.5 text-royal-500" />
                      From: <span className="text-royal-600 dark:text-royal-500">{ord.restaurantId.name}</span>
                    </p>
                    <p className="text-xs text-surface-400 dark:text-noir-200 font-medium pl-5">
                      To: {ord.deliveryAddress.addressLine}
                    </p>
                  </div>

                  <button
                    onClick={() => claimJobMutation.mutate(ord._id)}
                    className="btn-royal flex items-center gap-2 text-xs px-5 py-2.5 whitespace-nowrap"
                  >
                    <HandMetal className="w-4 h-4" /> Claim Job
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
};

export default AssignedOrders;
