import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { orderAPI } from '../../services/api.js';
import { useSocket } from '../../context/SocketContext.jsx';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import Loader from '../../components/common/Loader.jsx';
import { Check, Compass, Phone, ShieldCheck, MapPin, Coffee, ArrowLeft } from 'lucide-react';
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
      <div className="text-center py-20 text-rose-500 font-bold bg-white rounded-2xl border">
        Could not load order tracking details.
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
    <div className="space-y-8 pb-16">
      <button
        onClick={() => navigate('/profile')}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
      >
        <ArrowLeft className="w-4 h-4" /> Go to Order History
      </button>

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Track Order</h1>
          <p className="text-xs font-bold text-slate-400 mt-1">ID: #{order._id}</p>
        </div>
        <span
          className={`px-3 py-1.5 rounded-full text-xs font-extrabold uppercase ${
            order.paymentStatus === 'paid'
              ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
              : 'bg-amber-50 text-amber-600 border border-amber-200'
          }`}
        >
          {order.paymentStatus === 'paid' ? '💳 PAID' : '⌛ AWAITING PAYMENT'}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 columns - Tracking journey */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* A. TRACKING TIMELINE */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm space-y-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Compass className="w-5 h-5 text-brand-500 animate-spin" /> Delivery Journey
            </h2>

            {isCancelled ? (
              <div className="p-4 bg-rose-50 text-rose-800 dark:bg-rose-950/20 dark:text-rose-400 rounded-2xl border border-rose-200 font-semibold text-sm">
                ❌ This order has been cancelled.
              </div>
            ) : (
              <div className="relative pl-6 space-y-8 border-l border-slate-150 dark:border-slate-700 ml-4">
                {STEPS.map((step, idx) => {
                  const isCompleted = idx <= activeStepIdx;
                  const isActive = idx === activeStepIdx;

                  return (
                    <div key={step.status} className="relative flex gap-4">
                      {/* Check Node circle indicator */}
                      <span
                        className={`absolute -left-[35px] top-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all ${
                          isCompleted
                            ? 'bg-brand-600 border-brand-600 text-white shadow-md'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400'
                        }`}
                      >
                        {isCompleted ? <Check className="w-3.5 h-3.5" /> : idx + 1}
                      </span>

                      <div>
                        <h3
                          className={`text-sm font-bold ${
                            isActive
                              ? 'text-brand-600 dark:text-brand-400'
                              : isCompleted
                              ? 'text-slate-800 dark:text-slate-200'
                              : 'text-slate-400 dark:text-slate-500'
                          }`}
                        >
                          {step.label}
                        </h3>
                        <p className="text-xs text-slate-400 dark:text-slate-500 font-medium mt-0.5">
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
          <div className="bg-white dark:bg-slate-800 rounded-3xl overflow-hidden border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col h-[400px]">
            <div className="p-4 border-b border-slate-100 dark:border-slate-700 font-bold text-sm text-slate-850 dark:text-white flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-brand-500" /> Live Tracking Map
            </div>
            
            <div className="flex-1 relative bg-slate-100 dark:bg-slate-900">
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
            <div className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-3xl p-6 shadow-md space-y-4">
              <span className="text-[10px] font-bold tracking-wider uppercase bg-white/20 px-2 py-0.5 rounded">
                Delivery Executive
              </span>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-xl font-bold">
                  🏍️
                </div>
                <div>
                  <h3 className="font-bold">{riderInfo?.name || 'Rohan (Assigned)'}</h3>
                  <p className="text-xs text-white/80 font-semibold flex items-center gap-1 mt-0.5">
                    <Phone className="w-3.5 h-3.5" /> +91 {riderInfo?.phone || '9876543213'}
                  </p>
                </div>
              </div>
              <p className="text-xs font-semibold text-white/95">
                Rider has collected your order and is driving to your location.
              </p>
            </div>
          )}

          {/* D. ORDER DETAILS LIST */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white pb-2.5 border-b border-slate-100 dark:border-slate-700 flex items-center gap-1.5">
              <Coffee className="w-4 h-4 text-brand-500" /> Items Summary
            </h3>
            
            <div className="space-y-3.5 max-h-48 overflow-y-auto pr-1">
              {order.items.map((i, idx) => (
                <div key={idx} className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-350">
                  <span>{i.quantity}x {i.name}</span>
                  <span className="text-slate-900 dark:text-white font-bold">₹{i.price * i.quantity}</span>
                </div>
              ))}
            </div>

            <div className="space-y-3.5 text-xs font-semibold text-slate-500 border-t border-slate-100 dark:border-slate-700 pt-4">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="text-slate-800 dark:text-slate-200">₹{order.totalAmount - order.deliveryFee}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery Partner Fee</span>
                <span className="text-slate-800 dark:text-slate-200">₹{order.deliveryFee}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-slate-900 dark:text-white pt-3 border-t border-slate-50">
                <span>Total Paid</span>
                <span className="text-brand-600">₹{order.totalAmount}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-1.5 justify-center text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 py-2 rounded-xl border border-emerald-100 dark:border-emerald-900/50 mt-4">
              <ShieldCheck className="w-4 h-4" /> Secure SSL Food Delivery
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default OrderTracking;
