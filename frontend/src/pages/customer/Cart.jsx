import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../../store/cartStore.js';
import { useToastStore } from '../../store/toastStore.js';
import { ShoppingBag, ArrowRight, Trash2, Plus, Minus, ArrowLeft, Sparkles, Receipt, Crown } from 'lucide-react';

export const Cart = () => {
  const navigate = useNavigate();
  const addToast = useToastStore((state) => state.addToast);

  // Cart Store hooks
  const items = useCartStore((state) => state.items);
  const restaurantName = useCartStore((state) => state.restaurantName);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const clearCart = useCartStore((state) => state.clearCart);
  
  const subtotal = useCartStore((state) => state.getSubtotal());
  const deliveryFee = useCartStore((state) => state.deliveryFee);
  const total = useCartStore((state) => state.getTotal());

  const handleCheckoutRedirect = () => {
    navigate('/checkout');
  };

  if (items.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-8 animate-fade-in">
        <div className="glass-card rounded-3xl p-10 max-w-md w-full space-y-6 border border-royal-500/10">
          {/* Decorative icon */}
          <div className="relative mx-auto w-24 h-24">
            <div className="absolute inset-0 bg-royal-500/10 rounded-full animate-pulse-soft"></div>
            <div className="absolute inset-2 bg-surface-50 dark:bg-noir-500 rounded-full flex items-center justify-center shadow-card">
              <ShoppingBag className="w-10 h-10 text-royal-500 animate-bounce-soft" />
            </div>
          </div>

          <div className="space-y-2">
            <h2 className="font-display text-2xl font-bold text-gold-gradient text-shimmer">
              Your Cart is Empty
            </h2>
            <p className="text-noir-200 dark:text-surface-300 text-sm font-medium">
              Add exquisite dishes from our curated restaurants to begin your culinary journey.
            </p>
          </div>

          <button
            onClick={() => navigate('/')}
            className="btn-royal px-8 py-3.5 rounded-xl font-bold text-sm inline-flex items-center gap-2 mx-auto"
          >
            <Sparkles className="w-4 h-4" />
            Browse Restaurants
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16 animate-fade-in">
      {/* Top bar with back + clear */}
      <div className="flex justify-between items-center">
        <button
          onClick={() => navigate(-1)}
          className="group inline-flex items-center gap-2 text-sm font-semibold text-noir-300 dark:text-surface-300 hover:text-royal-600 dark:hover:text-royal-400 transition-all duration-300"
        >
          <span className="w-8 h-8 rounded-xl bg-surface-100 dark:bg-noir-500 flex items-center justify-center group-hover:bg-royal-500/10 group-hover:shadow-glow-gold-sm transition-all duration-300">
            <ArrowLeft className="w-4 h-4" />
          </span>
          Continue Shopping
        </button>
        <button
          onClick={() => {
            clearCart();
            addToast('Cart cleared', 'info');
          }}
          className="btn-danger px-3 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 transition-all duration-300 active:scale-95"
        >
          <Trash2 className="w-3.5 h-3.5" /> Clear Cart
        </button>
      </div>

      {/* Page heading */}
      <div className="space-y-1 animate-fade-in-up">
        <h1 className="font-display text-3xl font-bold text-gold-gradient">
          Shopping Cart
        </h1>
        <div className="flex items-center gap-2">
          <Crown className="w-3.5 h-3.5 text-royal-500" />
          <p className="text-xs font-bold text-noir-200 dark:text-surface-300">
            From: <span className="text-royal-600 dark:text-royal-400">{restaurantName}</span>
          </p>
        </div>
      </div>

      <div className="gold-divider"></div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Item list */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item, index) => (
            <div
              key={item.menuItemId}
              className="card-royal-static flex justify-between items-center p-5 rounded-2xl animate-fade-in-up"
              style={{ animationDelay: `${index * 60}ms` }}
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className={item.isVeg ? 'veg-indicator' : 'nonveg-indicator'}></span>
                  <h3 className="font-bold text-noir-600 dark:text-surface-50 text-sm">
                    {item.name}
                  </h3>
                </div>
                <p className="text-xs text-noir-200 dark:text-surface-300 font-semibold">
                  ₹{item.price} each
                </p>
              </div>

              <div className="flex items-center gap-5">
                {/* Quantity controls */}
                <div className="flex items-center border-2 border-royal-500/30 dark:border-royal-500/20 rounded-xl h-9 px-1.5 gap-1 text-sm font-bold text-noir-600 dark:text-surface-50 bg-surface-50 dark:bg-noir-500">
                  <button
                    onClick={() => updateQuantity(item.menuItemId, item.quantity - 1)}
                    className="w-7 h-7 flex items-center justify-center hover:bg-royal-500/10 rounded-lg text-royal-500 transition-all duration-200 active:scale-90"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="min-w-[20px] text-center font-bold">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.menuItemId, item.quantity + 1)}
                    className="w-7 h-7 flex items-center justify-center hover:bg-royal-500/10 rounded-lg text-royal-500 transition-all duration-200 active:scale-90"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
                
                {/* Item total */}
                <span className="w-16 text-right font-bold text-royal-600 dark:text-royal-400 text-sm">
                  ₹{item.price * item.quantity}
                </span>

                {/* Remove button */}
                <button
                  onClick={() => {
                    removeItem(item.menuItemId);
                    addToast(`Removed ${item.name}`, 'info');
                  }}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-noir-200 dark:text-surface-400 hover:text-red-500 hover:bg-red-500/10 transition-all duration-200"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Pricing totals box */}
        <div className="glass-card rounded-3xl p-6 border border-royal-500/20 space-y-5 h-fit animate-fade-in-up sticky top-24">
          <div className="flex items-center gap-2.5 pb-4">
            <div className="w-9 h-9 rounded-xl bg-royal-500/10 flex items-center justify-center">
              <Receipt className="w-4.5 h-4.5 text-royal-500" />
            </div>
            <h2 className="font-display text-lg font-bold text-noir-600 dark:text-surface-50">
              Bill Details
            </h2>
          </div>

          <div className="gold-divider"></div>

          <div className="space-y-4 text-sm font-semibold">
            <div className="flex justify-between">
              <span className="text-noir-200 dark:text-surface-300">Item Subtotal</span>
              <span className="text-noir-600 dark:text-surface-100 font-bold">₹{subtotal}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-noir-200 dark:text-surface-300">Delivery Partner Fee</span>
              <span className="text-noir-600 dark:text-surface-100 font-bold">₹{deliveryFee}</span>
            </div>
            
            <div className="gold-divider"></div>

            <div className="flex justify-between text-base font-bold pt-1">
              <span className="text-noir-600 dark:text-surface-50">To Pay</span>
              <span className="text-royal-600 dark:text-royal-400 text-lg">₹{total}</span>
            </div>
          </div>

          <button
            onClick={handleCheckoutRedirect}
            className="btn-royal w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 text-sm mt-2"
          >
            <Sparkles className="w-4 h-4" />
            Confirm & Proceed
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Cart;
