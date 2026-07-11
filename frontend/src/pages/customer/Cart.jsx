import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../../store/cartStore.js';
import { useToastStore } from '../../store/toastStore.js';
import { ShoppingBag, ArrowRight, Trash2, Plus, Minus, ArrowLeft } from 'lucide-react';

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
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6 bg-slate-50 dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
        <span className="text-6xl animate-pulse">🛒</span>
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-200 mt-4">Your Cart is Empty</h2>
        <p className="text-slate-400 text-sm mt-1 mb-6">Add dishes from restaurants to satisfy your hunger cravings.</p>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-semibold shadow-md active:scale-95 transition-all text-sm"
        >
          Browse Restaurants
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16">
      <div className="flex justify-between items-center">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-850 dark:text-slate-400 dark:hover:text-slate-200"
        >
          <ArrowLeft className="w-4 h-4" /> Continue Shopping
        </button>
        <button
          onClick={() => {
            clearCart();
            addToast('Cart cleared', 'info');
          }}
          className="text-xs font-semibold text-rose-500 hover:text-rose-600 flex items-center gap-1"
        >
          <Trash2 className="w-3.5 h-3.5" /> Clear Cart
        </button>
      </div>

      <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Shopping Cart</h1>
      <p className="text-xs font-bold text-slate-400 -mt-3">From: {restaurantName}</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Item list */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div
              key={item.menuItemId}
              className="flex justify-between items-center p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`w-3 border text-[8px] flex items-center justify-center flex-shrink-0 ${
                      item.isVeg ? 'border-emerald-500 text-emerald-500' : 'border-red-500 text-red-500'
                    }`}
                  >
                    ●
                  </span>
                  <h3 className="font-bold text-slate-950 dark:text-white text-sm">{item.name}</h3>
                </div>
                <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold">₹{item.price} each</p>
              </div>

              <div className="flex items-center gap-6">
                <div className="flex items-center bg-slate-100 dark:bg-slate-900 rounded-xl h-8 px-2 gap-2 text-sm font-semibold text-slate-800 dark:text-white">
                  <button
                    onClick={() => updateQuantity(item.menuItemId, item.quantity - 1)}
                    className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-500"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span>{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.menuItemId, item.quantity + 1)}
                    className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-500"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
                
                <span className="w-16 text-right font-bold text-slate-900 dark:text-white text-sm">
                  ₹{item.price * item.quantity}
                </span>

                <button
                  onClick={() => {
                    removeItem(item.menuItemId);
                    addToast(`Removed ${item.name}`, 'info');
                  }}
                  className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Pricing totals box */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm space-y-6 h-fit">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white pb-3 border-b border-slate-100 dark:border-slate-700">
            Bill Details
          </h2>

          <div className="space-y-3.5 text-sm font-semibold text-slate-500 dark:text-slate-455">
            <div className="flex justify-between">
              <span>Item Subtotal</span>
              <span className="text-slate-800 dark:text-slate-200">₹{subtotal}</span>
            </div>
            <div className="flex justify-between">
              <span>Delivery Partner Fee</span>
              <span className="text-slate-800 dark:text-slate-200">₹{deliveryFee}</span>
            </div>
            
            <div className="flex justify-between text-base font-bold text-slate-900 dark:text-white pt-4 border-t border-slate-55 dark:border-slate-750">
              <span>To Pay</span>
              <span className="text-brand-600">₹{total}</span>
            </div>
          </div>

          <button
            onClick={handleCheckoutRedirect}
            className="w-full py-3.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 shadow-md hover:shadow-brand-500/20 active:scale-[0.98] transition-all text-sm"
          >
            Confirm & Proceed
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Cart;
