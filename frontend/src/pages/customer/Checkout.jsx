import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../../store/cartStore.js';
import { useAuthStore } from '../../store/authStore.js';
import { useToastStore } from '../../store/toastStore.js';
import { orderAPI, paymentAPI, authAPI } from '../../services/api.js';
import { CreditCard, ShoppingBag, MapPin, Truck, ChevronRight, Check, Sparkles, Lock, Plus, Wallet } from 'lucide-react';

export const Checkout = () => {
  const navigate = useNavigate();
  const addToast = useToastStore((state) => state.addToast);
  
  // Cart & User state
  const items = useCartStore((state) => state.items);
  const restaurantId = useCartStore((state) => state.restaurantId);
  const restaurantName = useCartStore((state) => state.restaurantName);
  const clearCart = useCartStore((state) => state.clearCart);
  const subtotal = useCartStore((state) => state.getSubtotal());
  const deliveryFee = useCartStore((state) => state.deliveryFee);
  const total = useCartStore((state) => state.getTotal());

  const { user, updateUser } = useAuthStore();

  // Form selections
  const [selectedAddressIdx, setSelectedAddressIdx] = useState(0);
  const [useNewAddress, setUseNewAddress] = useState(!user?.addresses || user.addresses.length === 0);
  const [addressLine, setAddressLine] = useState('');
  const [city, setCity] = useState('');
  const [stateName, setStateName] = useState('');
  const [zipCode, setZipCode] = useState('');

  const [paymentMethod, setPaymentMethod] = useState('card'); // card, cod
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');

  const [loading, setLoading] = useState(false);

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Resolve Delivery Address
      let finalAddress = null;
      if (useNewAddress) {
        if (!addressLine || !city || !stateName || !zipCode) {
          addToast('Please fill in your address details', 'error');
          setLoading(false);
          return;
        }
        finalAddress = {
          label: 'Delivery Address',
          addressLine,
          city,
          state: stateName,
          zipCode,
          lat: 12.9716 + (Math.random() - 0.5) * 0.02, // slightly offset coordinates for demo routing
          lng: 77.5946 + (Math.random() - 0.5) * 0.02
        };

        // Save address to profile if checked
        try {
          const updatedAddresses = [...(user.addresses || []), finalAddress];
          const profRes = await authAPI.updateProfile({ addresses: updatedAddresses });
          updateUser(profRes.user);
        } catch (addrErr) {
          console.error('Failed to save new address to profile:', addrErr);
        }
      } else {
        finalAddress = user.addresses[selectedAddressIdx];
      }

      if (!finalAddress) {
        addToast('No delivery address selected', 'error');
        setLoading(false);
        return;
      }

      // 2. Create Order in Database
      const orderRes = await orderAPI.create({
        restaurantId,
        items: items.map(i => ({
          menuItemId: i.menuItemId,
          name: i.name,
          quantity: i.quantity,
          price: i.price
        })),
        deliveryAddress: finalAddress,
        paymentMethod
      });

      const createdOrder = orderRes.data;

      // 3. Process Payments (DFD 4.2: Process Payment)
      if (paymentMethod === 'card') {
        addToast('Initiating payment gateway connection...', 'info');

        // Create Payment Intent
        const intentRes = await paymentAPI.createIntent(createdOrder._id);

        // Simulate paying (Stripe test integration)
        addToast('Authorizing transaction...', 'info');
        
        // Confirm payment record link on server
        await paymentAPI.confirmPayment(createdOrder._id, intentRes.paymentIntentId);
        addToast('Payment completed successfully!', 'success');
      } else {
        addToast('Order placed successfully (Cash on Delivery)!', 'success');
      }

      // 4. Clean Cart and route to tracking
      clearCart();
      navigate(`/order-tracking/${createdOrder._id}`);

    } catch (error) {
      addToast(error.response?.data?.message || 'Could not complete checkout', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 animate-fade-in">
        <div className="w-20 h-20 rounded-full bg-surface-100 dark:bg-noir-400 flex items-center justify-center mb-6">
          <ShoppingBag className="w-10 h-10 text-surface-300 dark:text-noir-200" />
        </div>
        <p className="text-surface-400 dark:text-noir-100 font-display text-lg mb-2">Your Cart is Empty</p>
        <p className="text-surface-300 dark:text-noir-200 text-sm mb-6">Nothing to checkout yet.</p>
        <button
          onClick={() => navigate('/')}
          className="btn-royal px-6 py-2.5 rounded-xl text-sm font-semibold"
        >
          Browse Restaurants
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16 animate-fade-in">
      {/* Page Header */}
      <div className="animate-fade-in-up">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-gold-gradient flex items-center justify-center shadow-glow-gold-sm">
            <ShoppingBag className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-noir-600 dark:text-surface-50">
              Checkout
            </h1>
            <p className="text-xs text-surface-300 dark:text-noir-100 font-medium">
              From <span className="text-royal-500 font-semibold">{restaurantName}</span>
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Columns - Address & Payments */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* A. DELIVERY ADDRESS PICKER */}
          <div className="card-royal-static p-6 rounded-2xl space-y-5 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-royal-500/10 dark:bg-royal-500/20 flex items-center justify-center">
                <MapPin className="w-4.5 h-4.5 text-royal-500" />
              </div>
              <h2 className="text-lg font-display font-bold text-noir-600 dark:text-surface-50">
                Delivery Address
              </h2>
            </div>

            {user?.addresses && user.addresses.length > 0 && (
              <div className="space-y-4">
                {/* Toggle Tabs */}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setUseNewAddress(false)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold tracking-wide border-2 transition-all duration-300 ${
                      !useNewAddress
                        ? 'border-royal-500 bg-royal-500/10 text-royal-600 dark:text-royal-500 shadow-glow-gold-sm'
                        : 'border-surface-100 dark:border-noir-300 bg-surface-50 dark:bg-noir-400 text-surface-300 dark:text-noir-100 hover:border-surface-200'
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5" />
                      Saved Address
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setUseNewAddress(true)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold tracking-wide border-2 transition-all duration-300 ${
                      useNewAddress
                        ? 'border-royal-500 bg-royal-500/10 text-royal-600 dark:text-royal-500 shadow-glow-gold-sm'
                        : 'border-surface-100 dark:border-noir-300 bg-surface-50 dark:bg-noir-400 text-surface-300 dark:text-noir-100 hover:border-surface-200'
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <Plus className="w-3.5 h-3.5" />
                      New Address
                    </span>
                  </button>
                </div>

                {/* Saved Address Cards */}
                {!useNewAddress && (
                  <div className="grid grid-cols-1 gap-3 pt-1">
                    {user.addresses.map((addr, idx) => (
                      <div
                        key={idx}
                        onClick={() => setSelectedAddressIdx(idx)}
                        className={`group p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 flex items-center justify-between hover:scale-[1.01] active:scale-[0.99] ${
                          selectedAddressIdx === idx
                            ? 'border-royal-500 bg-royal-500/5 dark:bg-royal-500/10 shadow-glow-gold-sm'
                            : 'border-surface-100 dark:border-noir-300 hover:border-royal-500/30 bg-white dark:bg-noir-500'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors duration-300 ${
                            selectedAddressIdx === idx
                              ? 'bg-royal-500/15 text-royal-600'
                              : 'bg-surface-100 dark:bg-noir-300 text-surface-300 dark:text-noir-100'
                          }`}>
                            <MapPin className="w-4 h-4" />
                          </div>
                          <div>
                            <p className={`text-sm font-bold transition-colors duration-300 ${
                              selectedAddressIdx === idx
                                ? 'text-royal-600 dark:text-royal-500'
                                : 'text-noir-500 dark:text-surface-100'
                            }`}>{addr.label}</p>
                            <p className="text-xs text-surface-300 dark:text-noir-100 mt-1 leading-relaxed">
                              {addr.addressLine}, {addr.city}, {addr.state} - {addr.zipCode}
                            </p>
                          </div>
                        </div>
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                          selectedAddressIdx === idx
                            ? 'bg-royal-500 border-royal-500 text-white scale-110'
                            : 'border-surface-200 dark:border-noir-200 bg-transparent'
                        }`}>
                          {selectedAddressIdx === idx && <Check className="w-3.5 h-3.5" />}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* New Address Form */}
            {useNewAddress && (
              <div className="space-y-4 pt-2">
                <div>
                  <label className="label-royal text-[10px] mb-1.5 block">Street Address</label>
                  <input
                    type="text"
                    placeholder="Street address or Apartment Details"
                    value={addressLine}
                    onChange={(e) => setAddressLine(e.target.value)}
                    className="input-royal w-full"
                    required={useNewAddress}
                  />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="label-royal text-[10px] mb-1.5 block">City</label>
                    <input
                      type="text"
                      placeholder="City"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="input-royal w-full"
                      required={useNewAddress}
                    />
                  </div>
                  <div>
                    <label className="label-royal text-[10px] mb-1.5 block">State</label>
                    <input
                      type="text"
                      placeholder="State"
                      value={stateName}
                      onChange={(e) => setStateName(e.target.value)}
                      className="input-royal w-full"
                      required={useNewAddress}
                    />
                  </div>
                  <div>
                    <label className="label-royal text-[10px] mb-1.5 block">Zip Code</label>
                    <input
                      type="text"
                      placeholder="Zip"
                      value={zipCode}
                      onChange={(e) => setZipCode(e.target.value)}
                      className="input-royal w-full"
                      required={useNewAddress}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* B. PAYMENT METHOD SELECTOR */}
          <div className="card-royal-static p-6 rounded-2xl space-y-5 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-royal-500/10 dark:bg-royal-500/20 flex items-center justify-center">
                <Wallet className="w-4.5 h-4.5 text-royal-500" />
              </div>
              <h2 className="text-lg font-display font-bold text-noir-600 dark:text-surface-50">
                Payment Method
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Card Option */}
              <div
                onClick={() => setPaymentMethod('card')}
                className={`group p-5 rounded-xl border-2 cursor-pointer transition-all duration-300 flex flex-col items-center gap-3 text-center hover:scale-[1.02] active:scale-[0.98] ${
                  paymentMethod === 'card'
                    ? 'border-royal-500 bg-royal-500/5 dark:bg-royal-500/10 shadow-glow-gold-sm'
                    : 'border-surface-100 dark:border-noir-300 hover:border-royal-500/30 bg-white dark:bg-noir-500'
                }`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${
                  paymentMethod === 'card'
                    ? 'bg-gold-gradient shadow-glow-gold-sm text-white'
                    : 'bg-surface-100 dark:bg-noir-300 text-surface-300 dark:text-noir-100'
                }`}>
                  <CreditCard className="w-6 h-6" />
                </div>
                <span className={`text-sm font-bold transition-colors duration-300 ${
                  paymentMethod === 'card'
                    ? 'text-royal-600 dark:text-royal-500'
                    : 'text-noir-400 dark:text-surface-200'
                }`}>Credit / Debit Card</span>
                {paymentMethod === 'card' && (
                  <div className="w-5 h-5 rounded-full bg-royal-500 flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>

              {/* COD Option */}
              <div
                onClick={() => setPaymentMethod('cod')}
                className={`group p-5 rounded-xl border-2 cursor-pointer transition-all duration-300 flex flex-col items-center gap-3 text-center hover:scale-[1.02] active:scale-[0.98] ${
                  paymentMethod === 'cod'
                    ? 'border-royal-500 bg-royal-500/5 dark:bg-royal-500/10 shadow-glow-gold-sm'
                    : 'border-surface-100 dark:border-noir-300 hover:border-royal-500/30 bg-white dark:bg-noir-500'
                }`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${
                  paymentMethod === 'cod'
                    ? 'bg-gold-gradient shadow-glow-gold-sm text-white'
                    : 'bg-surface-100 dark:bg-noir-300 text-surface-300 dark:text-noir-100'
                }`}>
                  <Truck className="w-6 h-6" />
                </div>
                <span className={`text-sm font-bold transition-colors duration-300 ${
                  paymentMethod === 'cod'
                    ? 'text-royal-600 dark:text-royal-500'
                    : 'text-noir-400 dark:text-surface-200'
                }`}>Cash on Delivery</span>
                {paymentMethod === 'cod' && (
                  <div className="w-5 h-5 rounded-full bg-royal-500 flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>
            </div>

            {/* Card details form */}
            {paymentMethod === 'card' && (
              <div className="space-y-4 pt-3 p-5 bg-surface-50/50 dark:bg-noir-500 rounded-2xl border border-royal-500/15 dark:border-royal-500/20 animate-fade-in">
                <p className="text-[10px] font-bold text-royal-600 dark:text-royal-500 uppercase tracking-[0.15em] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Stripe test mode — use 4242 card number
                </p>
                
                <div>
                  <label className="label-royal text-[10px] mb-1.5 block">Card Number</label>
                  <input
                    type="text"
                    placeholder="4242 4242 4242 4242"
                    maxLength={19}
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value.replace(/\s?/g, '').replace(/(\d{4})/g, '$1 ').trim())}
                    className="input-royal w-full"
                    required={paymentMethod === 'card'}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label-royal text-[10px] mb-1.5 block">Expiry Date</label>
                    <input
                      type="text"
                      placeholder="MM/YY"
                      maxLength={5}
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      className="input-royal w-full"
                      required={paymentMethod === 'card'}
                    />
                  </div>
                  <div>
                    <label className="label-royal text-[10px] mb-1.5 block">CVC</label>
                    <input
                      type="password"
                      placeholder="123"
                      maxLength={3}
                      value={cardCvc}
                      onChange={(e) => setCardCvc(e.target.value)}
                      className="input-royal w-full"
                      required={paymentMethod === 'card'}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Bill Summary & Submission */}
        <div className="h-fit animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          <div className="glass-card p-6 rounded-2xl space-y-5 sticky top-24">
            {/* Header */}
            <div className="flex items-center gap-3 pb-4">
              <div className="w-8 h-8 rounded-lg bg-gold-gradient flex items-center justify-center shadow-glow-gold-sm">
                <ShoppingBag className="w-4 h-4 text-white" />
              </div>
              <h2 className="text-lg font-display font-bold text-noir-600 dark:text-surface-50">
                Order Summary
              </h2>
            </div>

            <div className="gold-divider" />

            {/* Items List */}
            <div className="space-y-3 max-h-40 overflow-y-auto pr-1 scrollbar-thin">
              {items.map((i) => (
                <div key={i.menuItemId} className="flex justify-between items-center group">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-md bg-royal-500/10 dark:bg-royal-500/20 text-royal-600 dark:text-royal-500 text-[10px] font-bold flex items-center justify-center">
                      {i.quantity}x
                    </span>
                    <span className="text-xs font-semibold text-noir-400 dark:text-surface-200 line-clamp-1">{i.name}</span>
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
                <span className="text-noir-500 dark:text-surface-100">₹{subtotal}</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span className="text-surface-300 dark:text-noir-100">Delivery Fee</span>
                <span className="text-noir-500 dark:text-surface-100">₹{deliveryFee}</span>
              </div>

              <div className="gold-divider" />

              <div className="flex justify-between items-center pt-1">
                <span className="text-sm font-display font-bold text-noir-600 dark:text-surface-50">Total</span>
                <span className="text-lg font-display font-bold text-gold-gradient text-royal-500">₹{total}</span>
              </div>
            </div>

            {/* Place Order Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn-royal w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  Confirm & Pay ₹{total}
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>

            {/* Secure Badge */}
            <div className="flex items-center justify-center gap-1.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 pt-1">
              <Lock className="w-3 h-3" />
              <span>256-bit SSL Encrypted Checkout</span>
            </div>
          </div>
        </div>

      </form>
    </div>
  );
};

export default Checkout;
