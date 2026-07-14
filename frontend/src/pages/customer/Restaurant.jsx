import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { browseAPI } from '../../services/api.js';
import { useCartStore } from '../../store/cartStore.js';
import { useToastStore } from '../../store/toastStore.js';
import Loader from '../../components/common/Loader.jsx';
import { Star, Clock, MapPin, ShoppingBag, Plus, Minus, ArrowLeft, Utensils, Sparkles } from 'lucide-react';

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
      <div className="min-h-[50vh] flex flex-col items-center justify-center text-center py-20 animate-fade-in">
        <div className="glass-card p-10 rounded-3xl max-w-md mx-auto space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto">
            <Utensils className="w-8 h-8 text-red-400" />
          </div>
          <h3 className="font-display text-xl font-bold text-noir-600 dark:text-surface-50">
            Menu Unavailable
          </h3>
          <p className="text-sm text-noir-300 dark:text-surface-300">
            Could not load restaurant menu. Please try again.
          </p>
          <button
            onClick={() => navigate('/')}
            className="btn-royal-outline text-sm px-6 py-2.5"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Restaurants
          </button>
        </div>
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

  const categoryNames = Object.keys(menuByCategory);

  return (
    <div className="space-y-8 pb-28 relative animate-fade-in">
      {/* Back link */}
      <button
        onClick={() => navigate('/')}
        className="group inline-flex items-center gap-2 text-sm font-semibold text-noir-300 dark:text-surface-300 hover:text-royal-600 dark:hover:text-royal-400 transition-all duration-300"
      >
        <span className="w-8 h-8 rounded-xl bg-surface-100 dark:bg-noir-500 flex items-center justify-center group-hover:bg-royal-500/10 group-hover:shadow-glow-gold-sm transition-all duration-300">
          <ArrowLeft className="w-4 h-4" />
        </span>
        Back to Restaurants
      </button>

      {/* 1. RESTAURANT HERO BLOCK */}
      <div className="rounded-3xl overflow-hidden shadow-card animate-fade-in-up">
        <div className="relative h-72 md:h-80 w-full">
          <img src={restaurant.coverImage} alt={restaurant.name} className="h-full w-full object-cover" />
          {/* Multi-layer gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-noir-600 via-noir-600/40 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-noir-600/30 to-transparent"></div>
          
          {/* Glass card overlay with restaurant info */}
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
            <div className="glass-card rounded-2xl p-5 md:p-6 max-w-2xl space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1.5">
                  <h1 className="font-display text-2xl md:text-3xl font-bold text-white drop-shadow-lg">
                    {restaurant.name}
                  </h1>
                  <p className="text-sm text-surface-200/90 font-medium">
                    {restaurant.cuisines.join(' • ')}
                  </p>
                </div>
                <div className="flex-shrink-0 bg-royal-500/20 backdrop-blur-sm rounded-xl px-3 py-1.5 border border-royal-500/30">
                  <div className="flex items-center gap-1.5">
                    <Star className="w-4 h-4 fill-royal-500 stroke-royal-500" />
                    <span className="text-white font-bold text-sm">{restaurant.rating}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-4 items-center text-xs font-semibold text-surface-200/80">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-royal-500" />
                  <span>30-40 mins delivery</span>
                </div>
                <div className="w-1 h-1 rounded-full bg-surface-300/40"></div>
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-royal-500" />
                  <span>{restaurant.address.addressLine}, {restaurant.address.city}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Category filter pills */}
      {categoryNames.length > 1 && (
        <div className="flex flex-wrap gap-2 animate-fade-in-up">
          {categoryNames.map((cat) => (
            <a
              key={cat}
              href={`#category-${cat}`}
              className="tab-royal px-4 py-2 text-xs font-bold rounded-xl border border-royal-500/20 bg-surface-50 dark:bg-noir-500 text-noir-400 dark:text-surface-200 hover:border-royal-500 hover:bg-royal-500/10 hover:text-royal-600 dark:hover:text-royal-400 transition-all duration-300"
            >
              {cat}
            </a>
          ))}
        </div>
      )}

      {/* 2. CATEGORIZED MENU ITEMS LIST */}
      <div className="space-y-10">
        {categoryNames.map((categoryName) => (
          <div key={categoryName} id={`category-${categoryName}`} className="space-y-5 animate-fade-in-up">
            {/* Category header */}
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-8 rounded-full bg-gold-gradient"></div>
              <h2 className="font-display text-xl font-bold text-noir-600 dark:text-surface-50">
                {categoryName}
              </h2>
              <span className="badge-neutral text-[10px]">
                {menuByCategory[categoryName].length} items
              </span>
            </div>

            <div className="space-y-4">
              {menuByCategory[categoryName].map((item) => {
                const qty = getCartItemQty(item._id);

                return (
                  <div
                    key={item._id}
                    className="card-royal flex gap-5 p-5 rounded-2xl justify-between group"
                  >
                    {/* Item details */}
                    <div className="flex-1 space-y-2.5 pr-4">
                      <div className="flex items-center gap-2">
                        <span className={item.isVeg ? 'veg-indicator' : 'nonveg-indicator'}></span>
                        <h3 className="font-bold text-noir-600 dark:text-surface-50 text-base">
                          {item.name}
                        </h3>
                      </div>
                      <p className="text-sm font-bold text-royal-600 dark:text-royal-400">
                        ₹{item.price}
                      </p>
                      <p className="text-xs text-noir-200 dark:text-surface-300 max-w-xl font-medium leading-relaxed">
                        {item.description}
                      </p>
                    </div>

                    {/* Item image + add button */}
                    <div className="relative flex-shrink-0 flex flex-col items-center">
                      <div className="relative overflow-hidden rounded-2xl">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-28 h-28 rounded-2xl object-cover bg-surface-100 dark:bg-noir-400 border-2 border-surface-100 dark:border-noir-400 group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>
                      
                      <div className="absolute -bottom-3">
                        {qty > 0 ? (
                          <div className="flex items-center bg-gold-gradient text-white rounded-xl shadow-glow-gold-sm h-9 px-2.5 gap-3 text-sm font-bold border border-royal-500/30">
                            <button
                              onClick={() => updateQuantity(item._id, qty - 1)}
                              className="p-1 hover:bg-white/20 rounded-lg transition-colors active:scale-90"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="min-w-[14px] text-center">{qty}</span>
                            <button
                              onClick={() => updateQuantity(item._id, qty + 1)}
                              className="p-1 hover:bg-white/20 rounded-lg transition-colors active:scale-90"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleAddItemToCart(item)}
                            className="btn-royal-outline bg-white dark:bg-noir-500 px-5 py-2 rounded-xl shadow-card font-bold text-xs flex items-center gap-1.5 active:scale-95 transition-all duration-300 border-2"
                          >
                            <Plus className="w-3.5 h-3.5" /> ADD
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
        <div className="fixed bottom-6 left-6 right-6 z-40 glass-card p-4 rounded-2xl shadow-glow-gold flex items-center justify-between animate-slide-up max-w-4xl mx-auto border border-royal-500/30">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gold-gradient rounded-xl shadow-glow-gold-sm">
              <ShoppingBag className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-noir-600 dark:text-surface-50">
                {cartCount} Item{cartCount > 1 ? 's' : ''} added
              </p>
              <p className="text-xs text-noir-200 dark:text-surface-300 font-medium">
                Subtotal: <span className="text-royal-600 dark:text-royal-400 font-bold">₹{cartSubtotal}</span>
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/cart')}
            className="btn-royal px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            View Cart
          </button>
        </div>
      )}
    </div>
  );
};

export default Restaurant;
