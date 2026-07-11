import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { browseAPI } from '../../services/api.js';
import { useCartStore } from '../../store/cartStore.js';
import { useToastStore } from '../../store/toastStore.js';
import Loader from '../../components/common/Loader.jsx';
import { Star, Clock, MapPin, ShoppingBag, Plus, Minus, ArrowLeft } from 'lucide-react';

export const Restaurant = () => {
  const { id } = useParams();
  
  const navigate = useNavigate();
  const addToast = useToastStore((state) => state.addToast);
  
  // Cart state bindings
  const cartItems = useCartStore((state) => state.items);
  const cartRestaurantId = useCartStore((state) => state.restaurantId);
  const addItem = useCartStore((state) => state.addItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const clearCart = useCartStore((state) => state.clearCart);

  // Fetch restaurant details and menu items
  const { data, isLoading, isError } = useQuery({
    queryKey: ['restaurant-menu', id],
    queryFn: () => browseAPI.getRestaurantMenu(id)
  });

  if (isLoading) return <Loader type="spinner" />;
  if (isError || !data?.success) {
    return (
      <div className="text-center py-20 text-rose-500 font-bold bg-white rounded-2xl border">
        Could not load restaurant menu. Please try again.
      </div>
    );
  }

  const { restaurant, menu } = data;

  // Group available menu items by category
  const menuByCategory = menu.filter(item => item.isAvailable).reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {});

  const handleAddItemToCart = (item) => {
    try {
      addItem(
        {
          menuItemId: item._id,
          name: item.name,
          price: item.price,
          isVeg: item.isVeg
        },
        restaurant._id,
        restaurant.name
      );
      addToast(`Added ${item.name} to cart`, 'success');
    } catch (err) {
      if (err.message === 'CLEAR_CART_REQUIRED') {
        // Enforce checkout lock warning
        if (window.confirm('Your cart contains items from another restaurant. Clear your cart to add this item?')) {
          clearCart();
          addItem(
            {
              menuItemId: item._id,
              name: item.name,
              price: item.price,
              isVeg: item.isVeg
            },
            restaurant._id,
            restaurant.name
          );
          addToast(`Cart cleared. Added ${item.name}`, 'success');
        }
      }
    }
  };

  const getCartItemQty = (itemId) => {
    const found = cartItems.find((i) => i.menuItemId === itemId);
    return found ? found.quantity : 0;
  };

  const cartCount = cartItems.reduce((sum, i) => sum + i.quantity, 0);
  const cartSubtotal = cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <div className="space-y-8 pb-24 relative">
      {/* Back link */}
      <button
        onClick={() => navigate('/')}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Restaurants
      </button>

      {/* 1. RESTAURANT DETAILS BLOCK */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl overflow-hidden border border-slate-100 dark:border-slate-700 shadow-sm">
        <div className="relative h-60 w-full bg-slate-150">
          <img src={restaurant.coverImage} alt={restaurant.name} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
          
          <div className="absolute bottom-6 left-6 right-6 text-white space-y-2">
            <h1 className="text-2xl md:text-3xl font-extrabold">{restaurant.name}</h1>
            <p className="text-sm text-white/80 font-medium">{restaurant.cuisines.join(', ')}</p>
          </div>
        </div>

        <div className="p-6 flex flex-wrap gap-6 items-center text-sm font-semibold text-slate-600 dark:text-slate-350 border-t border-slate-50 dark:border-slate-750">
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 fill-amber-400 stroke-amber-400" />
            <span className="text-slate-800 dark:text-slate-200 font-bold">{restaurant.rating}</span> (Ratings)
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4 text-slate-400" />
            <span>30-40 mins delivery</span>
          </div>
          <div className="flex items-center gap-1">
            <MapPin className="w-4 h-4 text-slate-400" />
            <span>{restaurant.address.addressLine}, {restaurant.address.city}</span>
          </div>
        </div>
      </div>

      {/* 2. CATEGORIZED MENU ITEMS LIST */}
      <div className="space-y-10">
        {Object.keys(menuByCategory).map((categoryName) => (
          <div key={categoryName} className="space-y-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white border-l-4 border-brand-500 pl-3">
              {categoryName}
            </h2>

            <div className="space-y-4">
              {menuByCategory[categoryName].map((item) => {
                const qty = getCartItemQty(item._id);

                return (
                  <div
                    key={item._id}
                    className="flex gap-4 p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow justify-between"
                  >
                    <div className="flex-1 space-y-2 pr-4">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`w-3.5 h-3.5 border flex items-center justify-center text-[8px] flex-shrink-0 ${
                            item.isVeg ? 'border-emerald-500 text-emerald-500' : 'border-red-500 text-red-500'
                          }`}
                        >
                          ●
                        </span>
                        <h3 className="font-bold text-slate-900 dark:text-white text-base">{item.name}</h3>
                      </div>
                      <p className="text-sm font-semibold text-brand-600">₹{item.price}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xl font-medium">
                        {item.description}
                      </p>
                    </div>

                    <div className="relative flex-shrink-0 flex flex-col items-center">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-28 h-28 rounded-2xl object-cover bg-slate-150 border border-slate-100 dark:border-slate-750"
                      />
                      
                      <div className="absolute -bottom-2">
                        {qty > 0 ? (
                          <div className="flex items-center bg-brand-600 text-white rounded-xl shadow-md border border-brand-500 h-9 px-2 gap-3 text-sm font-bold">
                            <button
                              onClick={() => updateQuantity(item._id, qty - 1)}
                              className="p-1 hover:bg-white/10 rounded"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span>{qty}</span>
                            <button
                              onClick={() => updateQuantity(item._id, qty + 1)}
                              className="p-1 hover:bg-white/10 rounded"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleAddItemToCart(item)}
                            className="bg-white hover:bg-slate-50 text-brand-600 dark:bg-slate-900 dark:hover:bg-slate-950 px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-750 shadow-md font-bold text-xs flex items-center gap-1 active:scale-95 transition-all"
                          >
                            <Plus className="w-3.5 h-3.5 text-brand-500" /> ADD
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* 3. FLOATING CART PREVIEW BAR */}
      {cartCount > 0 && cartRestaurantId === restaurant._id && (
        <div className="fixed bottom-6 left-6 right-6 z-40 bg-slate-900 text-white p-4 rounded-2xl shadow-xl flex items-center justify-between animate-slide-up max-w-4xl mx-auto dark:bg-brand-950 border border-slate-800 dark:border-brand-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-brand-600 rounded-xl">
              <ShoppingBag className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold">{cartCount} Item{cartCount > 1 ? 's' : ''} added</p>
              <p className="text-xs text-slate-300">Subtotal: ₹{cartSubtotal}</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/cart')}
            className="px-6 py-2.5 bg-white text-slate-900 hover:bg-slate-50 dark:bg-slate-100 dark:text-slate-900 font-bold rounded-xl text-sm transition-colors"
          >
            View Cart
          </button>
        </div>
      )}
    </div>
  );
};

export default Restaurant;
