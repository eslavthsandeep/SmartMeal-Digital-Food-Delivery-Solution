import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../../store/cartStore.js';
import { useAuthStore } from '../../store/authStore.js';
import { useToastStore } from '../../store/toastStore.js';
import { orderAPI, paymentAPI, authAPI } from '../../services/api.js';
import { CreditCard, ShoppingBag, MapPin, Truck, ChevronRight, Check } from 'lucide-react';

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
      <div className="text-center py-20">
        <p className="text-slate-500">Your cart is empty. Nothing to checkout.</p>
        <button onClick={() => navigate('/')} className="mt-4 px-4 py-2 bg-brand-500 text-white rounded-lg">
          Go Home
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16">
      <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Checkout Checkout</h1>

      <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Columns - Address & Payments */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* A. DELIVERY ADDRESS PICKER */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <MapPin className="w-5 h-5 text-brand-500" /> Delivery Address
            </h2>

            {user?.addresses && user.addresses.length > 0 && (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setUseNewAddress(false)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${
                      !useNewAddress ? 'bg-brand-50 border-brand-300 text-brand-600' : 'bg-slate-50 border-slate-200 text-slate-500'
                    }`}
                  >
                    Use Saved Address
                  </button>
                  <button
                    type="button"
                    onClick={() => setUseNewAddress(true)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${
                      useNewAddress ? 'bg-brand-50 border-brand-300 text-brand-600' : 'bg-slate-50 border-slate-200 text-slate-500'
                    }`}
                  >
                    + Add New Address
                  </button>
                </div>

                {!useNewAddress && (
                  <div className="grid grid-cols-1 gap-3 pt-2">
                    {user.addresses.map((addr, idx) => (
                      <div
                        key={idx}
                        onClick={() => setSelectedAddressIdx(idx)}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                          selectedAddressIdx === idx
                            ? 'border-brand-500 bg-brand-50/20'
                            : 'border-slate-100 hover:border-slate-250 dark:border-slate-700'
                        }`}
                      >
                        <div>
                          <p className="text-sm font-bold text-slate-850 dark:text-slate-100">{addr.label}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                            {addr.addressLine}, {addr.city}, {addr.state} - {addr.zipCode}
                          </p>
                        </div>
                        {selectedAddressIdx === idx && (
                          <div className="p-1 bg-brand-600 rounded-full text-white">
                            <Check className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {useNewAddress && (
              <div className="space-y-3 pt-2">
                <input
                  type="text"
                  placeholder="Street address or Apartment Details"
                  value={addressLine}
                  onChange={(e) => setAddressLine(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
                  required={useNewAddress}
                />
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder="City"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
                    required={useNewAddress}
                  />
                  <input
                    type="text"
                    placeholder="State"
                    value={stateName}
                    onChange={(e) => setStateName(e.target.value)}
                    className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
                    required={useNewAddress}
                  />
                  <input
                    type="text"
                    placeholder="Zip"
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value)}
                    className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
                    required={useNewAddress}
                  />
                </div>
              </div>
            )}
          </div>

          {/* B. PAYMENT METHOD METHOD SELECTOR */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-brand-500" /> Payment Selection
            </h2>

            <div className="grid grid-cols-2 gap-4">
              <div
                onClick={() => setPaymentMethod('card')}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col gap-2 ${
                  paymentMethod === 'card'
                    ? 'border-brand-500 bg-brand-50/20 text-brand-700 dark:text-brand-400'
                    : 'border-slate-100 hover:border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                <CreditCard className="w-5 h-5" />
                <span className="text-sm font-bold">Credit/Debit Card</span>
              </div>

              <div
                onClick={() => setPaymentMethod('cod')}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex flex-col gap-2 ${
                  paymentMethod === 'cod'
                    ? 'border-brand-500 bg-brand-50/20 text-brand-700 dark:text-brand-400'
                    : 'border-slate-100 hover:border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                }`}
              >
                <Truck className="w-5 h-5" />
                <span className="text-sm font-bold">Cash on Delivery</span>
              </div>
            </div>

            {/* Test card numbers input form */}
            {paymentMethod === 'card' && (
              <div className="space-y-3 pt-3 p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-150 dark:border-slate-850">
                <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest flex items-center gap-1">
                  💡 Stripe test mode active: use 4242 card number
                </p>
                
                <div>
                  <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Card Number</label>
                  <input
                    type="text"
                    placeholder="4242 4242 4242 4242"
                    maxLength={19}
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value.replace(/\s?/g, '').replace(/(\d{4})/g, '$1 ').trim())}
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-500 text-xs"
                    required={paymentMethod === 'card'}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">Expiry Date</label>
                    <input
                      type="text"
                      placeholder="MM/YY"
                      maxLength={5}
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-500 text-xs"
                      required={paymentMethod === 'card'}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 uppercase mb-1">CVC</label>
                    <input
                      type="password"
                      placeholder="123"
                      maxLength={3}
                      value={cardCvc}
                      onChange={(e) => setCardCvc(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-brand-500 text-xs"
                      required={paymentMethod === 'card'}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Bill Summary & Submission */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 shadow-sm space-y-6 h-fit">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-1.5 pb-3 border-b border-slate-100 dark:border-slate-700">
            <ShoppingBag className="w-5 h-5 text-brand-500" /> Order Summary
          </h2>

          <div className="space-y-3 text-xs max-h-36 overflow-y-auto pr-1">
            {items.map((i) => (
              <div key={i.menuItemId} className="flex justify-between font-semibold text-slate-700 dark:text-slate-300">
                <span className="line-clamp-1">{i.quantity}x {i.name}</span>
                <span className="flex-shrink-0 text-slate-900 dark:text-white font-bold">₹{i.price * i.quantity}</span>
              </div>
            ))}
          </div>

          <div className="space-y-3 text-xs font-semibold text-slate-500 border-t border-slate-55 dark:border-slate-750 pt-4">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="text-slate-800 dark:text-slate-200">₹{subtotal}</span>
            </div>
            <div className="flex justify-between">
              <span>Delivery Fee</span>
              <span className="text-slate-800 dark:text-slate-200">₹{deliveryFee}</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-slate-900 dark:text-white pt-3 border-t border-slate-50">
              <span>Total Amount</span>
              <span className="text-brand-600">₹{total}</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 shadow-md hover:shadow-brand-500/20 active:scale-[0.98] transition-all text-sm disabled:opacity-50"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <>
                Confirm & Pay ₹{total}
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  );
};

export default Checkout;
