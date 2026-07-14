import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { orderAPI } from '../../services/api.js';
import { useSocket } from '../../context/SocketContext.jsx';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import Loader from '../../components/common/Loader.jsx';
import { Check, Compass, Phone, ShieldCheck, MapPin, Coffee, ArrowLeft, Package, Clock, Sparkles, Bike } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// Fix default Leaflet marker assets in React builds
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom Icons for Food delivery
const customerIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const restaurantIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const riderIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const STEPS = [
  { status: 'pending', label: 'Order Placed', desc: 'Awaiting confirmation' },
  { status: 'confirmed', label: 'Confirmed', desc: 'Restaurant accepted order' },
  { status: 'preparing', label: 'Preparing', desc: 'Chef preparing your meal' },
  { status: 'out_for_delivery', label: 'Out for Delivery', desc: 'Rider is carrying your food' },
  { status: 'delivered', label: 'Delivered', desc: 'Enjoy your food!' }
];

const stepIcons = [Package, Check, Coffee, Bike, Sparkles];

export const OrderTracking = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { socket, joinOrderRoom } = useSocket();

  const [orderStatus, setOrderStatus] = useState('pending');
  const [riderLocation, setRiderLocation] = useState(null);
  const [riderInfo, setRiderInfo] = useState(null);

  // Fetch initial order state
  const { data: initialData, isLoading, isError } = useQuery({
    queryKey: ['order', id],
    queryFn: () => orderAPI.getById(id),
    refetchOnWindowFocus: false
  });

  // Sync state with fetched details
  useEffect(() => {
    if (initialData?.success) {
      const order = initialData.data;
      setOrderStatus(order.status);
      
      // If delivery is assigned, populate rider info
      // Since it populated in getById or can be fetched via websocket
      // we'll listen to sockets, but check if database already has coordinate records
    }
  }, [initialData]);

  // Connect Socket Room & listeners
  useEffect(() => {
    if (!socket || !id) return;

    joinOrderRoom(id);

    // Listen to real-time status transitions
    socket.on('order:status', (data) => {
      if (data.orderId === id) {
        setOrderStatus(data.status);
      }
    });

    // Listen to delivery assignment alerts
    socket.on('delivery:assigned', (data) => {
      setRiderInfo({ name: data.agentName, phone: data.agentPhone });
      setRiderLocation(data.location);
    });

    // Listen to coordinates updates from rider
    socket.on('delivery:location', (data) => {
      if (data.orderId === id) {
        setRiderLocation({ lat: data.lat, lng: data.lng });
      }
    });

    return () => {
      socket.off('order:status');
      socket.off('delivery:assigned');
      socket.off('delivery:location');
    };
  }, [socket, id]);

  if (isLoading) return <Loader type="spinner" />;
  if (isError || !initialData?.success) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
        <div className="card-royal-static p-8 rounded-2xl text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-950/30 flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8 text-red-400" />
          </div>
          <p className="text-red-500 dark:text-red-400 font-display font-bold text-lg mb-2">Tracking Unavailable</p>
          <p className="text-surface-300 dark:text-noir-100 text-sm">Could not load order tracking details.</p>
        </div>
      </div>
    );
  }

  const order = initialData.data;

  // Resolve step index
  const activeStepIdx = STEPS.findIndex((s) => s.status === orderStatus);
  const isCancelled = orderStatus === 'cancelled';

  // Default coordinate layouts
  const customerLoc = {
    lat: order.deliveryAddress.lat || 12.9123,
    lng: order.deliveryAddress.lng || 77.6789
  };
  const restaurantLoc = {
    lat: order.restaurantId.address.lat || 12.9250,
    lng: order.restaurantId.address.lng || 77.6800
  };

  return (
    <div className="space-y-8 pb-16 animate-fade-in">
      {/* Back Button */}
      <button
        onClick={() => navigate('/profile')}
        className="group inline-flex items-center gap-2 text-sm font-semibold text-surface-300 dark:text-noir-100 hover:text-royal-500 dark:hover:text-royal-500 transition-colors duration-300"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-300" />
        Order History
      </button>

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 animate-fade-in-up">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gold-gradient flex items-center justify-center shadow-glow-gold-sm animate-pulse-soft">
            <Compass className="w-5.5 h-5.5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-noir-600 dark:text-surface-50">
              Track Order
            </h1>
            <p className="text-[11px] font-mono text-surface-300 dark:text-noir-100 mt-0.5">
              ID: <span className="text-royal-500">#{order._id}</span>
            </p>
          </div>
        </div>
        <span
          className={`${
            order.paymentStatus === 'paid'
              ? 'badge-success'
              : 'badge-warning'
          } text-xs font-bold`}
        >
          {order.paymentStatus === 'paid' ? '💳 PAID' : '⌛ AWAITING PAYMENT'}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 columns - Tracking journey */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* A. TRACKING TIMELINE */}
          <div className="card-royal-static p-6 rounded-2xl space-y-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-royal-500/10 dark:bg-royal-500/20 flex items-center justify-center">
                <Compass className="w-4.5 h-4.5 text-royal-500 animate-spin-slow" />
              </div>
              <h2 className="text-lg font-display font-bold text-noir-600 dark:text-surface-50">
                Delivery Journey
              </h2>
            </div>

            {isCancelled ? (
              <div className="p-5 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 rounded-2xl border border-red-200 dark:border-red-900/50 font-semibold text-sm flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
                  <span className="text-lg">❌</span>
                </div>
                <div>
                  <p className="font-bold">Order Cancelled</p>
                  <p className="text-xs text-red-500 dark:text-red-400/70 mt-0.5">This order has been cancelled.</p>
                </div>
              </div>
            ) : (
              <div className="relative pl-8 space-y-1 ml-4">
                {/* Progress Line Background */}
                <div className="absolute left-[7px] top-3 bottom-3 w-[2px] bg-surface-100 dark:bg-noir-300 rounded-full" />
                {/* Active Progress Line */}
                <div
                  className="absolute left-[7px] top-3 w-[2px] bg-gold-gradient rounded-full transition-all duration-700 ease-out"
                  style={{
                    height: activeStepIdx >= 0 ? `${(activeStepIdx / (STEPS.length - 1)) * 100}%` : '0%',
                    maxHeight: 'calc(100% - 24px)'
                  }}
                />

                {STEPS.map((step, idx) => {
                  const isCompleted = idx <= activeStepIdx;
                  const isActive = idx === activeStepIdx;
                  const StepIcon = stepIcons[idx];

                  return (
                    <div key={step.status} className="relative flex gap-4 py-3">
                      {/* Node Circle */}
                      <span
                        className={`absolute -left-[25px] top-3.5 z-10 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-500 ${
                          isCompleted
                            ? 'bg-gold-gradient border-royal-500 text-white shadow-glow-gold-sm'
                            : 'bg-white dark:bg-noir-500 border-surface-200 dark:border-noir-200 text-surface-300 dark:text-noir-100'
                        } ${isActive ? 'scale-110 animate-pulse-soft' : ''}`}
                      >
                        {isCompleted ? <StepIcon className="w-4 h-4" /> : <span className="text-xs font-bold">{idx + 1}</span>}
                      </span>

                      {/* Step Info */}
                      <div className="pl-4">
                        <h3
                          className={`text-sm font-bold transition-colors duration-300 ${
                            isActive
                              ? 'text-royal-600 dark:text-royal-500 font-display'
                              : isCompleted
                              ? 'text-noir-500 dark:text-surface-100'
                              : 'text-surface-300 dark:text-noir-200'
                          }`}
                        >
                          {step.label}
                          {isActive && (
                            <span className="ml-2 inline-flex items-center gap-1 badge-gold text-[9px] px-2 py-0.5">
                              <Clock className="w-2.5 h-2.5" /> Current
                            </span>
                          )}
                        </h3>
                        <p className={`text-xs mt-0.5 font-medium ${
                          isCompleted
                            ? 'text-surface-300 dark:text-noir-100'
                            : 'text-surface-200 dark:text-noir-200'
                        }`}>
                          {step.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* B. LEAFLET LIVE ROUTING MAP */}
          <div className="card-royal-static rounded-2xl overflow-hidden flex flex-col h-[400px] animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <div className="p-4 border-b border-surface-100 dark:border-noir-300 flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-royal-500/10 dark:bg-royal-500/20 flex items-center justify-center">
                <MapPin className="w-3.5 h-3.5 text-royal-500" />
              </div>
              <span className="font-display font-bold text-sm text-noir-600 dark:text-surface-50">Live Tracking Map</span>
              <div className="ml-auto flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Live</span>
              </div>
            </div>
            
            <div className="flex-1 relative bg-surface-100 dark:bg-noir-500">
              <MapContainer
                key={`${customerLoc.lat}-${customerLoc.lng}`}
                center={[customerLoc.lat, customerLoc.lng]}
                zoom={13}
                scrollWheelZoom={false}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                
                {/* Customer coordinate pin */}
                <Marker position={[customerLoc.lat, customerLoc.lng]} icon={customerIcon}>
                  <Popup>🏠 Your Address: {order.deliveryAddress.addressLine}</Popup>
                </Marker>

                {/* Restaurant coordinate pin */}
                <Marker position={[restaurantLoc.lat, restaurantLoc.lng]} icon={restaurantIcon}>
                  <Popup>🍳 Restaurant: {order.restaurantId.name}</Popup>
                </Marker>

                {/* Live Rider coordinate pin */}
                {riderLocation && (
                  <Marker position={[riderLocation.lat, riderLocation.lng]} icon={riderIcon}>
                    <Popup>🏍️ Delivery Partner: {riderInfo?.name || 'On the way'}</Popup>
                  </Marker>
                )}
              </MapContainer>
            </div>
          </div>
        </div>

        {/* Right column - Bill summary & rider info */}
        <div className="space-y-6 h-fit">
          
          {/* C. RIDER ASSIGNMENT CARD */}
          {orderStatus === 'out_for_delivery' && (
            <div className="relative overflow-hidden rounded-2xl animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
              <div className="absolute inset-0 bg-gold-gradient opacity-90" />
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
              <div className="relative p-6 text-white space-y-4">
                <span className="badge-gold text-[10px] font-bold tracking-[0.15em] uppercase bg-white/20 border-white/30">
                  🏍️ Delivery Executive
                </span>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-2xl font-bold border border-white/20">
                    <Bike className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-lg">{riderInfo?.name || 'Rohan (Assigned)'}</h3>
                    <p className="text-sm text-white/80 font-semibold flex items-center gap-1.5 mt-1">
                      <Phone className="w-3.5 h-3.5" /> +91 {riderInfo?.phone || '9876543213'}
                    </p>
                  </div>
                </div>
                <p className="text-xs font-semibold text-white/90 leading-relaxed">
                  Rider has collected your order and is on the way to your location.
                </p>
              </div>
            </div>
          )}

          {/* D. ORDER DETAILS LIST */}
          <div className="glass-card p-6 rounded-2xl space-y-4 animate-fade-in-up" style={{ animationDelay: '0.25s' }}>
            <div className="flex items-center gap-2.5 pb-3">
              <div className="w-7 h-7 rounded-lg bg-gold-gradient flex items-center justify-center shadow-glow-gold-sm">
                <Coffee className="w-3.5 h-3.5 text-white" />
              </div>
              <h3 className="text-sm font-display font-bold text-noir-600 dark:text-surface-50">
                Order Summary
              </h3>
            </div>

            <div className="gold-divider" />
            
            {/* Items */}
            <div className="space-y-3 max-h-48 overflow-y-auto pr-1 scrollbar-thin">
              {order.items.map((i, idx) => (
                <div key={idx} className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-md bg-royal-500/10 dark:bg-royal-500/20 text-royal-600 dark:text-royal-500 text-[10px] font-bold flex items-center justify-center">
                      {i.quantity}x
                    </span>
                    <span className="text-xs font-semibold text-noir-400 dark:text-surface-200">{i.name}</span>
                  </div>
                  <span className="text-xs font-bold text-noir-600 dark:text-surface-50 flex-shrink-0">₹{i.price * i.quantity}</span>
                </div>
              ))}
            </div>

            <div className="gold-divider" />

            {/* Price Breakdown */}
            <div className="space-y-3 text-xs">
              <div className="flex justify-between font-semibold">
                <span className="text-surface-300 dark:text-noir-100">Subtotal</span>
                <span className="text-noir-500 dark:text-surface-100">₹{order.totalAmount - order.deliveryFee}</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span className="text-surface-300 dark:text-noir-100">Delivery Partner Fee</span>
                <span className="text-noir-500 dark:text-surface-100">₹{order.deliveryFee}</span>
              </div>

              <div className="gold-divider" />

              <div className="flex justify-between items-center pt-1">
                <span className="text-sm font-display font-bold text-noir-600 dark:text-surface-50">Total Paid</span>
                <span className="text-lg font-display font-bold text-royal-500">₹{order.totalAmount}</span>
              </div>
            </div>
            
            {/* Security Badge */}
            <div className="flex items-center gap-2 justify-center text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 py-2.5 rounded-xl border border-emerald-100 dark:border-emerald-900/50 mt-3">
              <ShieldCheck className="w-4 h-4" />
              Secure SSL Food Delivery
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default OrderTracking;
