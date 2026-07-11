import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orderAPI, deliveryAPI } from '../../services/api.js';
import { useAuthStore } from '../../store/authStore.js';
import { useToastStore } from '../../store/toastStore.js';
import { useSocket } from '../../context/SocketContext.jsx';
import Loader from '../../components/common/Loader.jsx';
import { Bike, Navigation, MapPin, CheckCircle, HandMetal, Play, Check } from 'lucide-react';

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

  const activeJobs = myJobsData?.data || [];
  const boardOrders = boardData?.data || [];

  return (
    <div className="space-y-8 pb-16">
      
      {/* Header banner */}
      <div className="flex justify-between items-center p-6 bg-slate-900 text-white rounded-3xl shadow-sm">
        <div>
          <span className="text-[10px] font-bold tracking-wider bg-white/20 px-2 py-0.5 rounded">
            DELIVERY PORTAL
          </span>
          <h1 className="text-2xl font-extrabold mt-1">Rider Dashboard</h1>
          <p className="text-xs text-slate-350">Available driver name: {user?.name}</p>
        </div>
        <div className="p-3 bg-emerald-600 rounded-2xl animate-pulse-soft">
          <Bike className="w-6 h-6 text-white" />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('active')}
          className={`flex-1 py-3 text-sm font-bold border-b-2 text-center transition-colors ${
            activeTab === 'active'
              ? 'border-brand-600 text-brand-600 dark:text-brand-400'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          My Active Assignments ({activeJobs.length})
        </button>
        <button
          onClick={() => setActiveTab('board')}
          className={`flex-1 py-3 text-sm font-bold border-b-2 text-center transition-colors ${
            activeTab === 'board'
              ? 'border-brand-600 text-brand-600 dark:text-brand-400'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Claims Gig Board
        </button>
      </div>

      {/* A. MY ACTIVE ASSIGNMENTS VIEW */}
      {activeTab === 'active' && (
        <div className="space-y-6">
          {jobsLoading ? (
            <Loader type="spinner" />
          ) : activeJobs.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-3xl border p-8 text-slate-400">
              <span className="text-4xl">😴</span>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 mt-3">No active delivery jobs</h3>
              <p className="text-xs mt-1">Claim a new job from the claims gig board tab.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {activeJobs.map((job) => {
                const isPickedUp = job.status === 'picked_up';
                const isOutForDelivery = job.orderId.status === 'out_for_delivery';

                return (
                  <div
                    key={job._id}
                    className="p-6 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-3xl shadow-sm space-y-6"
                  >
                    {/* Header info */}
                    <div className="flex justify-between items-center pb-3 border-b border-slate-50 dark:border-slate-750 text-xs">
                      <div>
                        <p className="font-bold text-slate-850 dark:text-white text-sm">Delivery Job ID #{job._id.slice(-6)}</p>
                        <p className="text-slate-400 font-semibold">Total Amount: ₹{job.orderId.totalAmount}</p>
                      </div>
                      <span className="px-2.5 py-1 bg-brand-50 text-brand-600 rounded-lg font-extrabold uppercase">
                        {job.status.toUpperCase()}
                      </span>
                    </div>

                    {/* Routing coordinates details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold text-slate-600 dark:text-slate-350">
                      <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl space-y-1">
                        <p className="text-[10px] text-brand-500 font-bold uppercase tracking-wider">🍳 Pick From Restaurant</p>
                        <p className="font-bold text-slate-800 dark:text-white">{job.orderId.restaurantId.name}</p>
                        <p className="text-slate-500 dark:text-slate-400 font-medium">
                          {job.orderId.restaurantId.address.addressLine}
                        </p>
                      </div>
                      
                      <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl space-y-1">
                        <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider">🏠 Deliver To Customer</p>
                        <p className="font-bold text-slate-800 dark:text-white">{job.orderId.customerId.name}</p>
                        <p className="text-slate-500 dark:text-slate-400 font-medium">
                          {job.orderId.deliveryAddress.addressLine}
                        </p>
                      </div>
                    </div>

                    {/* Simulation slider (Visible after picking up) */}
                    {job.status === 'picked_up' && (
                      <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/10 rounded-2xl border border-emerald-100 dark:border-emerald-900/50 space-y-3">
                        <div className="flex justify-between text-xs font-bold text-emerald-800 dark:text-emerald-400">
                          <span className="flex items-center gap-1"><Navigation className="w-3.5 h-3.5 text-emerald-500 animate-pulse" /> Live GPS Simulation</span>
                          <span>{simulatingDeliveryId === job._id ? sliderVal : 0}% Route Done</span>
                        </div>
                        
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={simulatingDeliveryId === job._id ? sliderVal : 0}
                          onChange={(e) => handleGpsSliderChange(e, job)}
                          className="w-full h-2 bg-emerald-200 dark:bg-emerald-900 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                        />
                        <p className="text-[10px] text-emerald-600 dark:text-emerald-500 font-medium">
                          💡 Slide to simulate driving from Restaurant (0%) to Customer (100%). The customer's map marker updates in real-time!
                        </p>
                      </div>
                    )}

                    {/* Status triggers */}
                    <div className="flex gap-2 justify-end">
                      {job.status === 'assigned' && (
                        <button
                          onClick={() => updateDeliveryStatusMutation.mutate({ id: job._id, status: 'picked_up' })}
                          className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl text-xs flex items-center gap-1 shadow-sm active:scale-95 transition-all"
                        >
                          <Play className="w-3.5 h-3.5" /> Pick Up Order
                        </button>
                      )}

                      {job.status === 'picked_up' && (
                        <button
                          onClick={() => updateDeliveryStatusMutation.mutate({ id: job._id, status: 'delivered' })}
                          disabled={simulatingDeliveryId === job._id && sliderVal < 100}
                          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-xs flex items-center gap-1 shadow-sm active:scale-95 transition-all disabled:opacity-50"
                        >
                          <Check className="w-3.5 h-3.5" /> Order Delivered
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

      {/* B. AVAILABLE JOBS BOARD VIEW */}
      {activeTab === 'board' && (
        <div className="space-y-6">
          {boardLoading ? (
            <Loader type="spinner" />
          ) : boardOrders.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-3xl border p-8 text-slate-400">
              <span className="text-4xl">🥡</span>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 mt-3">Gig board is empty</h3>
              <p className="text-xs mt-1">All active restaurant orders are currently claimed by other riders.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {boardOrders.map((ord) => (
                <div
                  key={ord._id}
                  className="p-5 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl shadow-sm flex justify-between items-center"
                >
                  <div className="space-y-1.5 text-xs font-semibold text-slate-650 dark:text-slate-350">
                    <p className="font-bold text-slate-900 dark:text-white text-sm">Order #{ord._id.slice(-6)}</p>
                    <p className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" /> From: {ord.restaurantId.name}
                    </p>
                    <p className="text-slate-400 font-medium">To: {ord.deliveryAddress.addressLine}</p>
                  </div>

                  <button
                    onClick={() => claimJobMutation.mutate(ord._id)}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs flex items-center gap-1 active:scale-95 transition-all shadow-sm"
                  >
                    <HandMetal className="w-3.5 h-3.5" /> Accept Job
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
