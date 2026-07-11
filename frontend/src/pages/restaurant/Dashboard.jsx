import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { browseAPI, orderAPI, deliveryAPI } from '../../services/api.js';
import { useSocket } from '../../context/SocketContext.jsx';
import { useToastStore } from '../../store/toastStore.js';
import Loader from '../../components/common/Loader.jsx';
import { ChefHat, BellRing, PackageCheck, ClipboardList, CheckCircle, Play, Sparkles, Plus, Leaf, Eye, EyeOff } from 'lucide-react';

export const RestaurantDashboard = () => {
  const queryClient = useQueryClient();
  const addToast = useToastStore((state) => state.addToast);
  const { socket, joinRestaurantRoom } = useSocket();

  const [restaurant, setRestaurant] = useState(null);
  const [activeTab, setActiveTab] = useState('orders'); // orders, menu
  const [isAddingDish, setIsAddingDish] = useState(false);

  // Form State for Adding Dishes
  const [newDishName, setNewDishName] = useState('');
  const [newDishPrice, setNewDishPrice] = useState('');
  const [newDishCategory, setNewDishCategory] = useState('Main Course');
  const [newDishDescription, setNewDishDescription] = useState('');
  const [newDishIsVeg, setNewDishIsVeg] = useState(true);
  const [newDishImage, setNewDishImage] = useState('');

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

  if (resLoading) return <Loader type="spinner" />;
  if (resError || !restaurant) {
    return (
      <div className="text-center py-20 bg-white rounded-2xl border p-8 space-y-4">
        <ChefHat className="w-12 h-12 text-slate-300 mx-auto" />
        <h2 className="text-xl font-bold">Restaurant Profile Required</h2>
        <p className="text-slate-500 max-w-sm mx-auto">
          Please register as a Merchant or verify that your restaurant is seeded in the database.
        </p>
      </div>
    );
  }

  const activeOrders = orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled');
  const pastOrders = orders.filter(o => o.status === 'delivered' || o.status === 'cancelled');

  return (
    <div className="space-y-8 pb-16">
      
      {/* Header banner */}
      <div className="flex justify-between items-center p-6 bg-slate-900 text-white rounded-3xl shadow-sm">
        <div>
          <span className="text-[10px] font-bold tracking-wider bg-white/20 px-2 py-0.5 rounded">
            MERCHANT PORTAL
          </span>
          <h1 className="text-2xl font-extrabold mt-1">{restaurant.name}</h1>
          <p className="text-xs text-slate-355">{restaurant.address.addressLine}, {restaurant.address.city}</p>
        </div>
        <div className="p-3 bg-brand-600 rounded-2xl animate-pulse-soft">
          <ChefHat className="w-6 h-6 text-white" />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('orders')}
          className={`flex-1 py-3 text-sm font-bold border-b-2 text-center transition-colors ${
            activeTab === 'orders'
              ? 'border-brand-600 text-brand-600 dark:text-brand-400'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Incoming Orders Queue ({activeOrders.length})
        </button>
        <button
          onClick={() => setActiveTab('menu')}
          className={`flex-1 py-3 text-sm font-bold border-b-2 text-center transition-colors ${
            activeTab === 'menu'
              ? 'border-brand-600 text-brand-600 dark:text-brand-400'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Manage Menu & Dishes
        </button>
      </div>

      {/* RENDER ACTIVE TAB */}
      {activeTab === 'orders' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Active Orders List */}
          <div className="lg:col-span-2 space-y-5">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BellRing className="w-5 h-5 text-brand-500 animate-bounce" /> Live Orders
            </h2>

            {ordersLoading ? (
              <Loader type="spinner" />
            ) : activeOrders.length === 0 ? (
              <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-3xl border p-8 text-slate-400 space-y-2">
                <span className="text-4xl">😴</span>
                <p className="text-sm font-semibold">No active orders right now.</p>
                <p className="text-xs">Incoming orders will display here in real-time.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {activeOrders.map((ord) => (
                  <div
                    key={ord._id}
                    className="p-5 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl shadow-sm space-y-4"
                  >
                    <div className="flex justify-between items-center pb-3 border-b border-slate-50 dark:border-slate-750 text-xs">
                      <div>
                        <p className="font-bold text-slate-850 dark:text-white text-sm">Order #{ord._id.slice(-6)}</p>
                        <p className="text-slate-400 font-semibold">Customer: {ord.customerId.name}</p>
                      </div>
                      <span className="px-2.5 py-1 bg-brand-50 text-brand-600 rounded-lg font-extrabold uppercase">
                        {ord.status}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {ord.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-xs font-semibold text-slate-655 dark:text-slate-400">
                          <span>{item.quantity}x {item.name}</span>
                          <span>₹{item.price * item.quantity}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-between items-center pt-3 border-t border-slate-50 dark:border-slate-750">
                      <div>
                        <p className="text-[10px] text-slate-400 font-semibold uppercase">Total Billing</p>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">₹{ord.totalAmount}</p>
                      </div>

                      <div className="flex gap-2">
                        {ord.status === 'pending' && (
                          <button
                            onClick={() => handleUpdateStatus(ord._id, 'pending')}
                            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl text-xs flex items-center gap-1 shadow-sm transition-all"
                          >
                            <CheckCircle className="w-3.5 h-3.5" /> Accept Order
                          </button>
                        )}
                        
                        {ord.status === 'confirmed' && (
                          <button
                            onClick={() => handleUpdateStatus(ord._id, 'confirmed')}
                            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-xs flex items-center gap-1 shadow-sm transition-all"
                          >
                            <Play className="w-3.5 h-3.5" /> Start Preparing
                          </button>
                        )}

                        {ord.status === 'preparing' && (
                          <button
                            onClick={() => handleUpdateStatus(ord._id, 'preparing')}
                            className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl text-xs flex items-center gap-1 shadow-sm transition-all"
                          >
                            <PackageCheck className="w-3.5 h-3.5" /> Ready for Pickup
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar Summary details */}
          <div className="space-y-6 h-fit">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white pb-2.5 border-b border-slate-100 dark:border-slate-700 flex items-center gap-2">
                <ClipboardList className="w-4.5 h-4.5 text-brand-500" /> Merchant Performance
              </h3>

              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-150 dark:border-slate-850">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Completed</p>
                  <p className="text-xl font-black text-emerald-600 mt-1">{pastOrders.length}</p>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-150 dark:border-slate-850">
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Revenue</p>
                  <p className="text-xl font-black text-brand-600 mt-1">
                    ₹{pastOrders.reduce((sum, o) => sum + o.totalAmount, 0)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* MENU MANAGEMENT VIEW */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Menu Items List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Restaurant Dishes</h2>
              <button
                onClick={() => setIsAddingDish(!isAddingDish)}
                className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
              >
                <Plus className="w-4 h-4" /> Add New Dish
              </button>
            </div>

            {isAddingDish && (
              <form onSubmit={handleAddDishSubmit} className="bg-slate-50 dark:bg-slate-900 p-5 rounded-2xl border border-slate-150 dark:border-slate-800 space-y-4">
                <h3 className="text-sm font-bold text-slate-800 dark:text-white">Add New Menu Dish</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-450 uppercase mb-1">Dish Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Butter Paneer"
                      value={newDishName}
                      onChange={(e) => setNewDishName(e.target.value)}
                      className="w-full px-3 py-2 border rounded-xl bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:ring-1 focus:ring-brand-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-450 uppercase mb-1">Price (INR) *</label>
                    <input
                      type="number"
                      placeholder="e.g. 250"
                      value={newDishPrice}
                      onChange={(e) => setNewDishPrice(e.target.value)}
                      className="w-full px-3 py-2 border rounded-xl bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:ring-1 focus:ring-brand-500"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-450 uppercase mb-1">Category *</label>
                    <select
                      value={newDishCategory}
                      onChange={(e) => setNewDishCategory(e.target.value)}
                      className="w-full px-3 py-2 border rounded-xl bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:ring-1 focus:ring-brand-500"
                    >
                      <option value="Starters">Starters</option>
                      <option value="Main Course">Main Course</option>
                      <option value="Breads">Breads</option>
                      <option value="Desserts">Desserts</option>
                      <option value="Beverages">Beverages</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2 pt-4">
                    <button
                      type="button"
                      onClick={() => setNewDishIsVeg(!newDishIsVeg)}
                      className={`px-3 py-2 border rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                        newDishIsVeg
                          ? 'bg-emerald-50 border-emerald-250 text-emerald-700 dark:bg-emerald-950/20'
                          : 'bg-rose-50 border-rose-250 text-rose-700 dark:bg-rose-950/20'
                      }`}
                    >
                      <Leaf className={`w-3.5 h-3.5 ${newDishIsVeg ? 'fill-emerald-500' : 'fill-rose-500'}`} />
                      {newDishIsVeg ? 'Vegetarian' : 'Non-Vegetarian'}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-450 uppercase mb-1">Description</label>
                  <textarea
                    placeholder="Short description of ingredients or quantity..."
                    value={newDishDescription}
                    onChange={(e) => setNewDishDescription(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:ring-1 focus:ring-brand-500 h-16"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-450 uppercase mb-1">Image URL (Optional)</label>
                  <input
                    type="text"
                    placeholder="https://images.unsplash.com/..."
                    value={newDishImage}
                    onChange={(e) => setNewDishImage(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:ring-1 focus:ring-brand-500"
                  />
                </div>

                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setIsAddingDish(false)}
                    className="px-4 py-2 border rounded-xl text-xs text-slate-500 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold"
                  >
                    Save Dish
                  </button>
                </div>
              </form>
            )}

            {menuLoading ? (
              <Loader type="spinner" />
            ) : menuItems.length === 0 ? (
              <p className="text-sm text-slate-500 font-medium">No dishes added to your menu yet. Add your first dish above!</p>
            ) : (
              <div className="space-y-3">
                {menuItems.map((item) => (
                  <div
                    key={item._id}
                    className={`p-4 bg-white dark:bg-slate-800 border rounded-2xl shadow-sm flex items-center justify-between transition-opacity ${
                      item.isAvailable ? 'opacity-100' : 'opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-14 h-14 rounded-xl object-cover bg-slate-150"
                      />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className={`w-3 border text-[8px] flex items-center justify-center ${item.isVeg ? 'border-emerald-500 text-emerald-500' : 'border-rose-500 text-rose-500'}`}>●</span>
                          <h4 className="font-bold text-slate-850 dark:text-white text-sm">{item.name}</h4>
                        </div>
                        <p className="text-xs text-slate-400 font-medium">{item.category} • ₹{item.price}</p>
                      </div>
                    </div>

                    <button
                      onClick={() =>
                        toggleAvailableMutation.mutate({
                          id: item._id,
                          isAvailable: !item.isAvailable
                        })
                      }
                      className={`px-3 py-1.5 border rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${
                        item.isAvailable
                          ? 'bg-slate-50 hover:bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-300'
                          : 'bg-amber-50 border-amber-250 text-amber-700 dark:bg-amber-950/20'
                      }`}
                    >
                      {item.isAvailable ? (
                        <>
                          <Eye className="w-3.5 h-3.5" /> Active
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-3.5 h-3.5" /> Hidden
                        </>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm space-y-4 h-fit">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white pb-2.5 border-b border-slate-100 dark:border-slate-700 flex items-center gap-2">
              <ChefHat className="w-4.5 h-4.5 text-brand-500" /> Menu Stats
            </h3>
            <div className="text-xs font-semibold text-slate-500 space-y-2">
              <div className="flex justify-between">
                <span>Total Dishes</span>
                <span className="text-slate-800 dark:text-slate-200 font-bold">{menuItems.length} Items</span>
              </div>
              <div className="flex justify-between">
                <span>Vegetarian Dishes</span>
                <span className="text-slate-800 dark:text-slate-200 font-bold">
                  {menuItems.filter(i => i.isVeg).length} Dishes
                </span>
              </div>
              <div className="flex justify-between">
                <span>Available Online</span>
                <span className="text-slate-850 dark:text-slate-200 font-bold">
                  {menuItems.filter(i => i.isAvailable).length} Dishes
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
