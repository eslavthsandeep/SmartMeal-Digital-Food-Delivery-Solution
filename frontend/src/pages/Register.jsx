import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore.js';
import { useToastStore } from '../store/toastStore.js';
import { authAPI } from '../services/api.js';
import { UserPlus, User, Mail, Lock, Phone, MapPin, Building2, Bike, Crown } from 'lucide-react';

export const Register = () => {
  const [role, setRole] = useState('customer'); // customer, restaurant, delivery_personnel
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  
  // Address block (primarily for customer and restaurant)
  const [addressLine, setAddressLine] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');

  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const setCredentials = useAuthStore((state) => state.setCredentials);
  const addToast = useToastStore((state) => state.addToast);

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!name || !email || !password || !phone) {
      addToast('Please fill in all basic fields', 'error');
      return;
    }

    let payload = { name, email, password, role, phone };
    
    // Validate and attach address if provided (optional)
    if (role !== 'delivery_personnel' && addressLine && city && state && zipCode) {
      payload.address = {
        label: 'Default',
        addressLine,
        city,
        state,
        zipCode
      };
    }

    setLoading(true);
    try {
      const data = await authAPI.register(payload);
      setCredentials(data.token, data.user);
      addToast(`Account created! Welcome, ${data.user.name}`, 'success');
      
      if (data.user.role === 'restaurant') {
        navigate('/restaurant/dashboard');
      } else if (data.user.role === 'delivery_personnel') {
        navigate('/delivery/orders');
      } else {
        navigate('/');
      }
    } catch (error) {
      addToast(error.response?.data?.message || 'Registration failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const roleOptions = [
    { key: 'customer', label: 'Customer', icon: User, description: 'Order delicious food' },
    { key: 'restaurant', label: 'Merchant', icon: Building2, description: 'Manage your restaurant' },
    { key: 'delivery_personnel', label: 'Delivery', icon: Bike, description: 'Deliver with us' },
  ];

  return (
    <div className="min-h-screen bg-mesh-gold flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Decorative gold radial gradient blobs */}
      <div className="absolute top-16 right-20 w-72 h-72 bg-royal-500/15 rounded-full blur-3xl animate-float pointer-events-none"></div>
      <div className="absolute bottom-16 left-10 w-96 h-96 bg-royal-600/10 rounded-full blur-3xl animate-pulse-soft pointer-events-none"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-radial from-royal-500/5 to-transparent rounded-full pointer-events-none"></div>

      <div className="w-full max-w-lg glass-card rounded-3xl p-8 md:p-10 relative overflow-hidden animate-fade-in-up">
        {/* Decorative corner accents */}
        <div className="absolute top-0 left-0 w-40 h-40 bg-gradient-to-br from-royal-500/10 to-transparent rounded-full blur-2xl -ml-20 -mt-20 pointer-events-none"></div>
        <div className="absolute bottom-0 right-0 w-40 h-40 bg-gradient-to-tl from-royal-600/10 to-transparent rounded-full blur-2xl -mr-20 -mb-20 pointer-events-none"></div>

        {/* Header */}
        <div className="text-center mb-6 relative">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-royal-500/10 dark:bg-royal-500/20 border border-royal-500/20 mb-4 animate-bounce-soft">
            <Crown className="w-8 h-8 text-royal-500" />
          </div>
          <h2 className="text-3xl md:text-4xl font-display font-bold text-gold-gradient tracking-tight">
            Create Account
          </h2>
          <p className="text-noir-200 dark:text-surface-300 mt-2 text-sm font-sans">
            Join the premium dining experience
          </p>
        </div>

        {/* Role Selection — Elegant Card-Based Options */}
        <div className="grid grid-cols-3 gap-3 mb-7">
          {roleOptions.map((opt) => {
            const Icon = opt.icon;
            const isActive = role === opt.key;
            return (
              <button
                key={opt.key}
                type="button"
                onClick={() => setRole(opt.key)}
                className={`relative flex flex-col items-center gap-1.5 py-4 px-2 rounded-2xl border-2 transition-all duration-300 active:scale-[0.97] ${
                  isActive
                    ? 'border-royal-500 bg-royal-500/10 dark:bg-royal-500/15 shadow-glow-gold-sm'
                    : 'border-surface-200/60 dark:border-noir-400/40 bg-surface-50/40 dark:bg-noir-500/30 hover:border-royal-500/40 hover:bg-royal-500/5'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors duration-300 ${
                  isActive
                    ? 'bg-royal-500/20 text-royal-500'
                    : 'bg-surface-100 dark:bg-noir-400/50 text-noir-200 dark:text-surface-300'
                }`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className={`text-xs font-semibold transition-colors duration-300 ${
                  isActive
                    ? 'text-royal-600 dark:text-royal-500'
                    : 'text-noir-200 dark:text-surface-300'
                }`}>
                  {opt.label}
                </span>
                <span className={`text-[10px] leading-tight text-center transition-colors duration-300 ${
                  isActive
                    ? 'text-royal-500/70 dark:text-royal-500/60'
                    : 'text-noir-100 dark:text-surface-400'
                }`}>
                  {opt.description}
                </span>
                {/* Active indicator dot */}
                {isActive && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-royal-500 rounded-full border-2 border-white dark:border-noir-600 animate-scale-in"></div>
                )}
              </button>
            );
          })}
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label-royal">Full Name</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-royal-500/60 dark:text-royal-500/50"><User className="w-4 h-4" /></span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-royal pl-10 text-sm"
                  placeholder="John Doe"
                  required
                />
              </div>
            </div>

            <div>
              <label className="label-royal">Email Address</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-royal-500/60 dark:text-royal-500/50"><Mail className="w-4 h-4" /></span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-royal pl-10 text-sm"
                  placeholder="email@example.com"
                  required
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label-royal">Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-royal-500/60 dark:text-royal-500/50"><Lock className="w-4 h-4" /></span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-royal pl-10 text-sm"
                  placeholder="Min 6 chars"
                  required
                />
              </div>
            </div>

            <div>
              <label className="label-royal">Phone Number</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-royal-500/60 dark:text-royal-500/50"><Phone className="w-4 h-4" /></span>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="input-royal pl-10 text-sm"
                  placeholder="10-digit number"
                  required
                />
              </div>
            </div>
          </div>

          {/* Optional address field for customer / merchant roles */}
          {role !== 'delivery_personnel' && (
            <div className="pt-4 mt-2 relative">
              <div className="gold-divider mb-4"></div>
              <span className="flex items-center gap-2 text-xs font-semibold text-royal-500 dark:text-royal-500 uppercase tracking-widest mb-3">
                <MapPin className="w-4 h-4" /> Primary Address (Optional)
              </span>
              
              <div className="space-y-3">
                <div>
                  <input
                    type="text"
                    value={addressLine}
                    onChange={(e) => setAddressLine(e.target.value)}
                    className="input-royal text-sm"
                    placeholder="Street Address, Apartment, Suite"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="input-royal text-sm"
                    placeholder="City"
                  />
                  <input
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="input-royal text-sm"
                    placeholder="State"
                  />
                  <input
                    type="text"
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value)}
                    className="input-royal text-sm"
                    placeholder="Zip"
                  />
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-royal w-full mt-4 py-3.5 flex items-center justify-center gap-2 text-base font-semibold"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <>
                <UserPlus className="w-5 h-5" />
                Create Account
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-noir-200 dark:text-surface-300">
            Already have an account?{' '}
            <Link to="/login" className="text-royal-500 hover:text-royal-600 font-semibold underline underline-offset-4 transition-colors duration-300">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
