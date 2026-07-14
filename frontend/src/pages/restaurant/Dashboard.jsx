import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { browseAPI, orderAPI } from '../../services/api.js';
import { useSocket } from '../../context/SocketContext.jsx';
import { useToastStore } from '../../store/toastStore.js';
import Loader from '../../components/common/Loader.jsx';
import { ChefHat, BellRing, PackageCheck, ClipboardList, CheckCircle, Play, Sparkles, Plus, Leaf, Eye, EyeOff, Settings, Save, Store, Crown, TrendingUp, IndianRupee, UtensilsCrossed, X, Clock, CircleDot, Truck, Timer, ImagePlus } from 'lucide-react';

export const RestaurantDashboard = () => {
  const queryClient = useQueryClient();
  const addToast = useToastStore((state) => state.addToast);
  const { socket, joinRestaurantRoom } = useSocket();

  const [restaurant, setRestaurant] = useState(null);
  const [activeTab, setActiveTab] = useState('orders'); // orders, menu, settings
  const [isAddingDish, setIsAddingDish] = useState(false);

  // Form State for Adding Dishes
  const [newDishName, setNewDishName] = useState('');
  const [newDishPrice, setNewDishPrice] = useState('');
  const [newDishCategory, setNewDishCategory] = useState('Main Course');
  const [newDishDescription, setNewDishDescription] = useState('');
  const [newDishIsVeg, setNewDishIsVeg] = useState(true);
  const [newDishImage, setNewDishImage] = useState('');

  // Settings form states
  const [editName, setEditName] = useState('');
  const [editCuisines, setEditCuisines] = useState('');
  const [editCoverImage, setEditCoverImage] = useState('');
  const [editMinOrder, setEditMinOrder] = useState('');
  const [editDeliveryFee, setEditDeliveryFee] = useState('');
  const [editIsOpen, setEditIsOpen] = useState(true);

  // 1. Fetch owned restaurant details
  const { data: resData, isLoading: resLoading, isError: resError } = useQuery({
    queryKey: ['owned-restaurant'],
    queryFn: browseAPI.getOwnedRestaurant
  });

  useEffect(() => {
    if (resData?.success) {
      setRestaurant(resData.data);
    }
  }, [resData]);

  // Prepopulate settings when restaurant loads
  useEffect(() => {
    if (restaurant) {
      setEditName(restaurant.name || '');
      setEditCuisines(restaurant.cuisines?.join(', ') || '');
      setEditCoverImage(restaurant.coverImage || '');
      setEditMinOrder(restaurant.minOrderValue || '');
      setEditDeliveryFee(restaurant.deliveryFee || '');
      setEditIsOpen(restaurant.isOpen !== false);
    }
  }, [restaurant]);

  // 2. Fetch restaurant orders
  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ['restaurant-orders', restaurant?._id],
    queryFn: () => orderAPI.getRestaurantOrders(restaurant._id),
    enabled: !!restaurant?._id
  });

  // 3. Fetch menu items for management
  const { data: menuData, isLoading: menuLoading } = useQuery({
    queryKey: ['restaurant-menu-admin', restaurant?._id],
    queryFn: () => browseAPI.getRestaurantMenu(restaurant._id),
    enabled: !!restaurant?._id && activeTab === 'menu'
  });

  const orders = ordersData?.data || [];
  const menuItems = menuData?.menu || [];

  // Status updates mutations
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => orderAPI.updateStatus(id, status),
    onSuccess: (data, variables) => {
      addToast(`Order status updated to: ${variables.status}`, 'success');
      queryClient.invalidateQueries(['restaurant-orders', restaurant?._id]);
    },
    onError: (err) => {
      addToast(err.response?.data?.message || 'Could not update status', 'error');
    }
  });

  // Toggle availability mutation
  const toggleAvailableMutation = useMutation({
    mutationFn: ({ id, isAvailable }) => browseAPI.toggleMenuItemAvailability(id, isAvailable),
    onSuccess: () => {
      addToast('Dish availability updated', 'success');
      queryClient.invalidateQueries(['restaurant-menu-admin', restaurant?._id]);
    }
  });

  // Add menu item mutation
  const addMenuItemMutation = useMutation({
    mutationFn: (itemData) => browseAPI.addMenuItem(itemData),
    onSuccess: () => {
      addToast('New dish added to menu successfully!', 'success');
      setIsAddingDish(false);
      // Reset form
      setNewDishName('');
      setNewDishPrice('');
      setNewDishCategory('Main Course');
      setNewDishDescription('');
      setNewDishIsVeg(true);
      setNewDishImage('');
      queryClient.invalidateQueries(['restaurant-menu-admin', restaurant?._id]);
    },
    onError: (err) => {
      addToast(err.response?.data?.message || 'Could not add dish', 'error');
    }
  });

  // Edit Restaurant Details mutation
  const updateRestaurantMutation = useMutation({
    mutationFn: (restData) => browseAPI.updateOwnedRestaurant(restData),
    onSuccess: (res) => {
      addToast('Restaurant profile updated successfully!', 'success');
      setRestaurant(res.data);
      queryClient.invalidateQueries(['owned-restaurant']);
    },
    onError: (err) => {
      addToast(err.response?.data?.message || 'Could not update details', 'error');
    }
  });

  // Socket event binding
  useEffect(() => {
    if (!socket || !restaurant?._id) return;

    joinRestaurantRoom(restaurant._id);

    // Listen for new orders
    socket.on('order:new', (newOrder) => {
      addToast(`🔔 New Order received! Amount: ₹${newOrder.totalAmount}`, 'info');
      
      try {
        const speech = new SpeechSynthesisUtterance("New order received!");
        speech.volume = 1;
        speech.rate = 1;
        window.speechSynthesis.speak(speech);
      } catch (e) {
        console.log('Audio alert blocked by browser settings');
      }

      queryClient.invalidateQueries(['restaurant-orders', restaurant._id]);
    });

    return () => {
      socket.off('order:new');
    };
  }, [socket, restaurant?._id]);

  const handleUpdateStatus = (orderId, currentStatus) => {
    if (currentStatus === 'pending') {
      updateStatusMutation.mutate({ id: orderId, status: 'confirmed' });
    } else if (currentStatus === 'confirmed') {
      updateStatusMutation.mutate({ id: orderId, status: 'preparing' });
    } else if (currentStatus === 'preparing') {
      updateStatusMutation.mutate({ id: orderId, status: 'out_for_delivery' });
    } else if (currentStatus === 'out_for_delivery') {
      updateStatusMutation.mutate({ id: orderId, status: 'delivered' });
    }
  };

  const handleAddDishSubmit = (e) => {
    e.preventDefault();
    if (!newDishName || !newDishPrice || !newDishCategory) {
      addToast('Please fill in all required fields', 'error');
      return;
    }

    addMenuItemMutation.mutate({
      name: newDishName,
      price: newDishPrice,
      category: newDishCategory,
      description: newDishDescription,
      isVeg: newDishIsVeg,
      image: newDishImage
    });
  };

  const handleSettingsSubmit = (e) => {
    e.preventDefault();
    if (!editName || !editCuisines || !editMinOrder || !editDeliveryFee) {
      addToast('Please complete all required fields', 'error');
      return;
    }

    updateRestaurantMutation.mutate({
      name: editName,
      cuisines: editCuisines,
      coverImage: editCoverImage,
      minOrderValue: editMinOrder,
      deliveryFee: editDeliveryFee,
      isOpen: editIsOpen
    });
  };

  if (resLoading) return <Loader type="spinner" />;
  if (resError || !restaurant) {
    return (
      <div className="text-center py-20 glass-card rounded-3xl p-10 space-y-5 animate-fade-in max-w-lg mx-auto">
        <div className="w-16 h-16 rounded-2xl bg-royal-500/10 flex items-center justify-center mx-auto">
          <ChefHat className="w-8 h-8 text-royal-500" />
        </div>
        <h2 className="text-xl font-display font-bold text-noir-600 dark:text-surface-50">Restaurant Profile Required</h2>
        <p className="text-sm text-noir-200 dark:text-surface-300 max-w-sm mx-auto leading-relaxed">
          Please register as a Merchant or verify that your restaurant is seeded in the database.
        </p>
      </div>
    );
  }

  const activeOrders = orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled');
  const pastOrders = orders.filter(o => o.status === 'delivered' || o.status === 'cancelled');

  const statusConfig = {
    pending: { badge: 'badge-warning', label: 'Pending', icon: Clock },
    confirmed: { badge: 'badge-info', label: 'Confirmed', icon: CheckCircle },
    preparing: { badge: 'badge-gold', label: 'Preparing', icon: ChefHat },
    out_for_delivery: { badge: 'badge-info', label: 'Out for Delivery', icon: Truck },
    delivered: { badge: 'badge-success', label: 'Delivered', icon: PackageCheck },
    cancelled: { badge: 'badge-danger', label: 'Cancelled', icon: X },
  };

  return (
    <div className="space-y-8 pb-16">
      
      {/* ═══ Royal Header Banner ═══ */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-noir-600 via-noir-500 to-noir-600 p-8 shadow-glow-gold-sm animate-fade-in">
        {/* Decorative orbs */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-royal-500/15 rounded-full blur-3xl -mr-10 -mt-10" />
        <div className="absolute bottom-0 left-1/3 w-32 h-32 bg-royal-600/10 rounded-full blur-2xl" />
        <div className="absolute top-1/2 right-1/4 w-2 h-2 bg-royal-500 rounded-full animate-glow-pulse" />
        
        <div className="relative flex justify-between items-center">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Crown className="w-3.5 h-3.5 text-royal-500" />
              <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-royal-500">
                Merchant Portal
              </span>
            </div>
            <h1 className="text-3xl font-display font-bold text-gold-gradient">
              {restaurant.name}
            </h1>
            <p className="text-xs text-surface-300 font-medium">
              {restaurant.address.addressLine}, {restaurant.address.city}
            </p>
          </div>
          
          <div className="p-4 bg-gradient-to-br from-royal-500 to-royal-600 rounded-2xl shadow-glow-gold-sm animate-float">
            <ChefHat className="w-7 h-7 text-noir-600" />
          </div>
        </div>
      </div>

      {/* ═══ Stats Row ═══ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-in-up">
        <div className="glass-card rounded-2xl p-4 text-center space-y-1">
          <div className="w-9 h-9 rounded-xl bg-royal-500/10 flex items-center justify-center mx-auto mb-2">
            <BellRing className="w-4.5 h-4.5 text-royal-500" />
          </div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-noir-200 dark:text-surface-300">Active</p>
          <p className="text-2xl font-display font-bold text-royal-500">{activeOrders.length}</p>
        </div>
        <div className="glass-card rounded-2xl p-4 text-center space-y-1">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-2">
            <PackageCheck className="w-4.5 h-4.5 text-emerald-500" />
          </div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-noir-200 dark:text-surface-300">Completed</p>
          <p className="text-2xl font-display font-bold text-emerald-500">{pastOrders.length}</p>
        </div>
        <div className="glass-card rounded-2xl p-4 text-center space-y-1">
          <div className="w-9 h-9 rounded-xl bg-royal-500/10 flex items-center justify-center mx-auto mb-2">
            <IndianRupee className="w-4.5 h-4.5 text-royal-500" />
          </div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-noir-200 dark:text-surface-300">Revenue</p>
          <p className="text-2xl font-display font-bold text-royal-500">
            ₹{pastOrders.reduce((sum, o) => sum + o.totalAmount, 0)}
          </p>
        </div>
        <div className="glass-card rounded-2xl p-4 text-center space-y-1">
          <div className="w-9 h-9 rounded-xl bg-sky-500/10 flex items-center justify-center mx-auto mb-2">
            <TrendingUp className="w-4.5 h-4.5 text-sky-500" />
          </div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-noir-200 dark:text-surface-300">Total</p>
          <p className="text-2xl font-display font-bold text-sky-500">{orders.length}</p>
        </div>
      </div>

      {/* ═══ Tab Navigation ═══ */}
      <div className="flex gap-1 p-1.5 bg-surface-100/80 dark:bg-noir-500/50 rounded-2xl backdrop-blur-sm border border-surface-200/50 dark:border-noir-400/30">
        <button
          onClick={() => setActiveTab('orders')}
          className={`tab-royal ${activeTab === 'orders' ? 'active' : ''}`}
        >
          <BellRing className="w-4 h-4" />
          <span>Orders Queue</span>
          {activeOrders.length > 0 && (
            <span className="ml-1 px-1.5 py-0.5 text-[10px] font-bold bg-royal-500 text-noir-600 rounded-full">
              {activeOrders.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('menu')}
          className={`tab-royal ${activeTab === 'menu' ? 'active' : ''}`}
        >
          <UtensilsCrossed className="w-4 h-4" />
          <span>Menu & Dishes</span>
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`tab-royal ${activeTab === 'settings' ? 'active' : ''}`}
        >
          <Settings className="w-4 h-4" />
          <span>Settings</span>
        </button>
      </div>

      {/* ═══ ORDERS TAB ═══ */}
      {activeTab === 'orders' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
          
          {/* Active Orders List */}
          <div className="lg:col-span-2 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-royal-500/10 flex items-center justify-center">
                <BellRing className="w-4 h-4 text-royal-500 animate-bounce-soft" />
              </div>
              <h2 className="text-lg font-display font-bold text-noir-600 dark:text-surface-50">
                Live Orders
              </h2>
              <div className="gold-divider flex-1" />
            </div>

            {ordersLoading ? (
              <Loader type="spinner" />
            ) : activeOrders.length === 0 ? (
              <div className="glass-card rounded-3xl p-12 text-center space-y-4 animate-fade-in-up">
                <div className="w-16 h-16 rounded-2xl bg-surface-100 dark:bg-noir-400 flex items-center justify-center mx-auto">
                  <Timer className="w-8 h-8 text-noir-100 dark:text-surface-300" />
                </div>
                <p className="text-sm font-bold text-noir-300 dark:text-surface-300">No active orders right now</p>
                <p className="text-xs text-noir-100 dark:text-surface-400">
                  Incoming orders will appear here in real-time
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {activeOrders.map((ord, index) => {
                  const config = statusConfig[ord.status] || statusConfig.pending;
                  const StatusIcon = config.icon;
                  return (
                    <div
                      key={ord._id}
                      className="card-royal rounded-2xl overflow-hidden animate-fade-in-up"
                      style={{ animationDelay: `${index * 80}ms` }}
                    >
                      {/* Order header */}
                      <div className="flex justify-between items-center p-5 pb-3">
                        <div className="space-y-1">
                          <p className="font-display font-bold text-noir-600 dark:text-surface-50 text-sm">
                            Order #{ord._id.slice(-6)}
                          </p>
                          <p className="text-xs text-noir-200 dark:text-surface-300 font-medium">
                            Customer: {ord.customerId.name}
                          </p>
                        </div>
                        <span className={`${config.badge} flex items-center gap-1.5`}>
                          <StatusIcon className="w-3 h-3" />
                          {config.label}
                        </span>
                      </div>

                      <div className="px-5">
                        <div className="gold-divider" />
                      </div>

                      {/* Order items */}
                      <div className="px-5 py-3 space-y-2">
                        {ord.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between text-xs font-semibold text-noir-300 dark:text-surface-300">
                            <span className="flex items-center gap-2">
                              <CircleDot className="w-3 h-3 text-royal-500/40" />
                              {item.quantity}× {item.name}
                            </span>
                            <span className="text-noir-500 dark:text-surface-100 font-bold">₹{item.price * item.quantity}</span>
                          </div>
                        ))}
                      </div>

                      <div className="px-5">
                        <div className="gold-divider" />
                      </div>

                      {/* Footer with total & action */}
                      <div className="flex justify-between items-center p-5 pt-3">
                        <div>
                          <p className="label-royal text-[10px] mb-0.5">Total Billing</p>
                          <p className="text-base font-display font-bold text-royal-500">₹{ord.totalAmount}</p>
                        </div>

                        <div className="flex gap-2">
                          {ord.status === 'pending' && (
                            <button
                              onClick={() => handleUpdateStatus(ord._id, 'pending')}
                              className="btn-royal text-xs px-5 py-2.5 flex items-center gap-1.5 active:scale-[0.98]"
                            >
                              <CheckCircle className="w-3.5 h-3.5" /> Accept Order
                            </button>
                          )}
                          
                          {ord.status === 'confirmed' && (
                            <button
                              onClick={() => handleUpdateStatus(ord._id, 'confirmed')}
                              className="btn-royal text-xs px-5 py-2.5 flex items-center gap-1.5 active:scale-[0.98]"
                            >
                              <Play className="w-3.5 h-3.5" /> Start Preparing
                            </button>
                          )}

                          {ord.status === 'preparing' && (
                            <button
                              onClick={() => handleUpdateStatus(ord._id, 'preparing')}
                              className="btn-royal text-xs px-5 py-2.5 flex items-center gap-1.5 active:scale-[0.98]"
                            >
                              <PackageCheck className="w-3.5 h-3.5" /> Ready for Pickup
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Past Orders Section */}
            {pastOrders.length > 0 && (
              <div className="space-y-4 mt-8">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                    <PackageCheck className="w-4 h-4 text-emerald-500" />
                  </div>
                  <h2 className="text-lg font-display font-bold text-noir-600 dark:text-surface-50">
                    Past Orders
                  </h2>
                  <div className="gold-divider flex-1" />
                </div>
                <div className="space-y-3">
                  {pastOrders.slice(0, 5).map((ord) => {
                    const config = statusConfig[ord.status] || statusConfig.delivered;
                    return (
                      <div key={ord._id} className="card-royal-static rounded-2xl p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-surface-100 dark:bg-noir-400 flex items-center justify-center">
                            <ClipboardList className="w-5 h-5 text-noir-200 dark:text-surface-300" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-noir-500 dark:text-surface-100">#{ord._id.slice(-6)}</p>
                            <p className="text-xs text-noir-200 dark:text-surface-300">{ord.customerId.name} • {ord.items.length} items</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-display font-bold text-royal-500">₹{ord.totalAmount}</span>
                          <span className={config.badge}>{config.label}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar — Merchant Performance */}
          <div className="space-y-6 h-fit">
            <div className="glass-card rounded-3xl p-6 space-y-5">
              <div className="flex items-center gap-2 pb-3 border-b border-royal-500/10">
                <ClipboardList className="w-5 h-5 text-royal-500" />
                <h3 className="text-sm font-display font-bold text-noir-600 dark:text-surface-50">
                  Merchant Performance
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/10 rounded-2xl border border-emerald-200/30 dark:border-emerald-800/20">
                  <p className="label-royal text-[10px]">Completed</p>
                  <p className="text-2xl font-display font-bold text-emerald-600 mt-1">{pastOrders.length}</p>
                </div>
                <div className="p-4 bg-royal-500/5 dark:bg-royal-500/10 rounded-2xl border border-royal-500/15">
                  <p className="label-royal text-[10px]">Revenue</p>
                  <p className="text-2xl font-display font-bold text-royal-500 mt-1">
                    ₹{pastOrders.reduce((sum, o) => sum + o.totalAmount, 0)}
                  </p>
                </div>
              </div>

              <div className="gold-divider" />

              <div className="text-xs text-noir-200 dark:text-surface-300 font-medium space-y-3">
                <div className="flex justify-between">
                  <span>Total Orders</span>
                  <span className="font-bold text-noir-500 dark:text-surface-100">{orders.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Active Now</span>
                  <span className="font-bold text-royal-500">{activeOrders.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ MENU TAB ═══ */}
      {activeTab === 'menu' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
          
          {/* Menu Items List */}
          <div className="lg:col-span-2 space-y-5">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-royal-500/10 flex items-center justify-center">
                  <UtensilsCrossed className="w-4 h-4 text-royal-500" />
                </div>
                <h2 className="text-lg font-display font-bold text-noir-600 dark:text-surface-50">
                  Restaurant Dishes
                </h2>
              </div>
              <button
                onClick={() => setIsAddingDish(!isAddingDish)}
                className="btn-royal text-xs px-5 py-2.5 flex items-center gap-2 active:scale-[0.98]"
              >
                <Plus className="w-4 h-4" /> Add New Dish
              </button>
            </div>

            {/* Add Dish Form Modal */}
            {isAddingDish && (
              <div className="glass-card rounded-3xl p-6 space-y-5 animate-slide-up border-royal-500/20">
                <div className="flex items-center justify-between pb-3 border-b border-royal-500/10">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-royal-500" />
                    <h3 className="text-sm font-display font-bold text-noir-600 dark:text-surface-50">
                      Add New Menu Dish
                    </h3>
                  </div>
                  <button onClick={() => setIsAddingDish(false)} className="btn-ghost p-1.5 rounded-lg">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                
                <form onSubmit={handleAddDishSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label-royal">Dish Name *</label>
                      <input
                        type="text"
                        placeholder="e.g. Butter Paneer"
                        value={newDishName}
                        onChange={(e) => setNewDishName(e.target.value)}
                        className="input-royal w-full"
                        required
                      />
                    </div>
                    <div>
                      <label className="label-royal">Price (INR) *</label>
                      <input
                        type="number"
                        placeholder="e.g. 250"
                        value={newDishPrice}
                        onChange={(e) => setNewDishPrice(e.target.value)}
                        className="input-royal w-full"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label-royal">Category *</label>
                      <select
                        value={newDishCategory}
                        onChange={(e) => setNewDishCategory(e.target.value)}
                        className="select-royal w-full"
                      >
                        <option value="Starters">Starters</option>
                        <option value="Main Course">Main Course</option>
                        <option value="Breads">Breads</option>
                        <option value="Desserts">Desserts</option>
                        <option value="Beverages">Beverages</option>
                      </select>
                    </div>

                    <div className="flex items-end pb-0.5">
                      <button
                        type="button"
                        onClick={() => setNewDishIsVeg(!newDishIsVeg)}
                        className={`w-full px-4 py-2.5 border rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all duration-300 ${
                          newDishIsVeg
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-700 dark:bg-emerald-950/20 dark:border-emerald-800'
                            : 'bg-rose-50 border-rose-300 text-rose-700 dark:bg-rose-950/20 dark:border-rose-800'
                        }`}
                      >
                        <Leaf className={`w-3.5 h-3.5 ${newDishIsVeg ? 'fill-emerald-500' : 'fill-rose-500'}`} />
                        {newDishIsVeg ? 'Vegetarian' : 'Non-Vegetarian'}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="label-royal">Description</label>
                    <textarea
                      placeholder="Short description of ingredients or quantity..."
                      value={newDishDescription}
                      onChange={(e) => setNewDishDescription(e.target.value)}
                      className="input-royal w-full h-20 resize-none"
                    />
                  </div>

                  <div>
                    <label className="label-royal">Image URL (Optional)</label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="https://images.unsplash.com/..."
                        value={newDishImage}
                        onChange={(e) => setNewDishImage(e.target.value)}
                        className="input-royal w-full pl-10"
                      />
                      <ImagePlus className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-noir-100 dark:text-surface-400" />
                    </div>
                  </div>

                  <div className="flex gap-3 justify-end pt-2">
                    <button
                      type="button"
                      onClick={() => setIsAddingDish(false)}
                      className="btn-royal-outline text-xs px-5 py-2.5"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn-royal text-xs px-6 py-2.5 flex items-center gap-2"
                    >
                      <Sparkles className="w-3.5 h-3.5" /> Save Dish
                    </button>
                  </div>
                </form>
              </div>
            )}

            {menuLoading ? (
              <Loader type="spinner" />
            ) : menuItems.length === 0 ? (
              <div className="glass-card rounded-3xl p-12 text-center space-y-4 animate-fade-in-up">
                <div className="w-16 h-16 rounded-2xl bg-royal-500/10 flex items-center justify-center mx-auto">
                  <UtensilsCrossed className="w-8 h-8 text-royal-500/40" />
                </div>
                <p className="text-sm font-bold text-noir-300 dark:text-surface-200">No dishes added yet</p>
                <p className="text-xs text-noir-100 dark:text-surface-400">Add your first signature dish above!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {menuItems.map((item, index) => (
                  <div
                    key={item._id}
                    className={`card-royal rounded-2xl overflow-hidden transition-all duration-300 animate-fade-in-up ${
                      item.isAvailable ? 'opacity-100' : 'opacity-60'
                    }`}
                    style={{ animationDelay: `${index * 60}ms` }}
                  >
                    <div className="flex items-center gap-4 p-4">
                      <div className="relative">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-16 h-16 rounded-xl object-cover bg-surface-200 dark:bg-noir-400 ring-2 ring-royal-500/10"
                        />
                        <span className={`absolute -top-1 -left-1 w-4 h-4 rounded-full border-2 border-white dark:border-noir-500 ${item.isVeg ? 'veg-indicator' : 'nonveg-indicator'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-display font-bold text-noir-600 dark:text-surface-50 text-sm truncate">
                          {item.name}
                        </h4>
                        <p className="text-xs text-noir-200 dark:text-surface-300 font-medium mt-0.5">
                          {item.category}
                        </p>
                        <p className="text-sm font-display font-bold text-royal-500 mt-1">₹{item.price}</p>
                      </div>

                      {/* Toggle Switch */}
                      <button
                        onClick={() =>
                          toggleAvailableMutation.mutate({
                            id: item._id,
                            isAvailable: !item.isAvailable
                          })
                        }
                        className={`relative w-12 h-6 rounded-full transition-all duration-300 flex items-center ${
                          item.isAvailable
                            ? 'bg-gradient-to-r from-royal-500 to-royal-600 shadow-glow-gold-sm'
                            : 'bg-surface-300 dark:bg-noir-300'
                        }`}
                      >
                        <span
                          className={`absolute w-5 h-5 bg-white rounded-full shadow-md transition-all duration-300 ${
                            item.isAvailable ? 'translate-x-6' : 'translate-x-0.5'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Menu Stats Sidebar */}
          <div className="glass-card rounded-3xl p-6 space-y-5 h-fit">
            <div className="flex items-center gap-2 pb-3 border-b border-royal-500/10">
              <ChefHat className="w-5 h-5 text-royal-500" />
              <h3 className="text-sm font-display font-bold text-noir-600 dark:text-surface-50">
                Menu Stats
              </h3>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center text-xs">
                <span className="text-noir-200 dark:text-surface-300 font-medium">Total Dishes</span>
                <span className="badge-gold">{menuItems.length} Items</span>
              </div>
              <div className="gold-divider" />
              <div className="flex justify-between items-center text-xs">
                <span className="flex items-center gap-1.5 text-noir-200 dark:text-surface-300 font-medium">
                  <span className="veg-indicator w-3 h-3 rounded-full" />
                  Vegetarian
                </span>
                <span className="badge-success">
                  {menuItems.filter(i => i.isVeg).length} Dishes
                </span>
              </div>
              <div className="gold-divider" />
              <div className="flex justify-between items-center text-xs">
                <span className="flex items-center gap-1.5 text-noir-200 dark:text-surface-300 font-medium">
                  <Eye className="w-3.5 h-3.5 text-royal-500" />
                  Available Online
                </span>
                <span className="badge-info">
                  {menuItems.filter(i => i.isAvailable).length} Dishes
                </span>
              </div>
              <div className="gold-divider" />
              <div className="flex justify-between items-center text-xs">
                <span className="flex items-center gap-1.5 text-noir-200 dark:text-surface-300 font-medium">
                  <EyeOff className="w-3.5 h-3.5 text-noir-100" />
                  Hidden
                </span>
                <span className="badge-neutral">
                  {menuItems.filter(i => !i.isAvailable).length} Dishes
                </span>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* ═══ SETTINGS TAB ═══ */}
      {activeTab === 'settings' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
          
          <div className="lg:col-span-2 glass-card rounded-3xl p-8 space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-royal-500/10">
              <div className="w-10 h-10 rounded-xl bg-royal-500/10 flex items-center justify-center">
                <Settings className="w-5 h-5 text-royal-500" />
              </div>
              <div>
                <h2 className="text-base font-display font-bold text-noir-600 dark:text-surface-50">
                  Outlet Customization
                </h2>
                <p className="text-xs text-noir-200 dark:text-surface-300">
                  Update your restaurant profile and preferences
                </p>
              </div>
            </div>

            <form onSubmit={handleSettingsSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="label-royal">Restaurant Name *</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="input-royal w-full"
                    required
                  />
                </div>

                <div>
                  <label className="label-royal">Cuisines (Comma-separated) *</label>
                  <input
                    type="text"
                    value={editCuisines}
                    onChange={(e) => setEditCuisines(e.target.value)}
                    placeholder="e.g. North Indian, Chinese, Mughlai"
                    className="input-royal w-full"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="label-royal">Cover Image URL</label>
                <div className="relative">
                  <input
                    type="text"
                    value={editCoverImage}
                    onChange={(e) => setEditCoverImage(e.target.value)}
                    className="input-royal w-full pl-10"
                  />
                  <ImagePlus className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-noir-100 dark:text-surface-400" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className="label-royal">Min Order Value (₹) *</label>
                  <input
                    type="number"
                    value={editMinOrder}
                    onChange={(e) => setEditMinOrder(e.target.value)}
                    className="input-royal w-full"
                    required
                  />
                </div>

                <div>
                  <label className="label-royal">Delivery Fee (₹) *</label>
                  <input
                    type="number"
                    value={editDeliveryFee}
                    onChange={(e) => setEditDeliveryFee(e.target.value)}
                    className="input-royal w-full"
                    required
                  />
                </div>

                <div className="flex flex-col justify-end pb-0.5">
                  <button
                    type="button"
                    onClick={() => setEditIsOpen(!editIsOpen)}
                    className={`w-full py-2.5 border rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all duration-300 ${
                      editIsOpen
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-700 dark:bg-emerald-950/20 dark:border-emerald-800 shadow-sm'
                        : 'bg-rose-50 border-rose-300 text-rose-700 dark:bg-rose-950/20 dark:border-rose-800'
                    }`}
                  >
                    <Store className="w-4 h-4" />
                    {editIsOpen ? 'Status: OPEN' : 'Status: CLOSED'}
                  </button>
                </div>
              </div>

              <div className="gold-divider" />

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={updateRestaurantMutation.isPending}
                  className="btn-royal px-8 py-3 text-xs font-bold flex items-center gap-2 active:scale-[0.98]"
                >
                  <Save className="w-4 h-4" />
                  {updateRestaurantMutation.isPending ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </form>
          </div>

          {/* Sidebar preview */}
          <div className="glass-card rounded-3xl overflow-hidden h-fit">
            <div className="relative h-36 w-full bg-surface-200 dark:bg-noir-400">
              <img src={editCoverImage || restaurant.coverImage} alt={editName} className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-noir-600/90 via-noir-600/40 to-transparent" />
              <div className="absolute bottom-4 left-5 right-5">
                <div className="flex items-center gap-1.5 mb-1">
                  <Crown className="w-3 h-3 text-royal-500" />
                  <span className="text-[9px] font-bold tracking-wider uppercase text-royal-500">Live Preview</span>
                </div>
                <h4 className="font-display font-bold text-surface-50 text-sm">
                  {editName || restaurant.name}
                </h4>
                <p className="text-[10px] text-surface-300 line-clamp-1 mt-0.5">
                  {editCuisines || restaurant.cuisines?.join(', ')}
                </p>
              </div>
            </div>
            <div className="p-5 space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-noir-200 dark:text-surface-300 font-medium">Minimum Order</span>
                <span className="font-display font-bold text-royal-500">₹{editMinOrder}</span>
              </div>
              <div className="gold-divider" />
              <div className="flex justify-between items-center text-xs">
                <span className="text-noir-200 dark:text-surface-300 font-medium">Rider Fee</span>
                <span className="font-display font-bold text-royal-500">₹{editDeliveryFee}</span>
              </div>
              <div className="gold-divider" />
              <div className="flex justify-between items-center text-xs">
                <span className="text-noir-200 dark:text-surface-300 font-medium">Status</span>
                <span className={editIsOpen ? 'badge-success' : 'badge-danger'}>
                  {editIsOpen ? 'Open' : 'Closed'}
                </span>
              </div>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};

export default RestaurantDashboard;
