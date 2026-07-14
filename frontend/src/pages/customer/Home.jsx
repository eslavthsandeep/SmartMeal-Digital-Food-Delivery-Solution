import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { browseAPI, offerAPI } from '../../services/api.js';
import Loader from '../../components/common/Loader.jsx';
import { Search, Star, Clock, MapPin, Sparkles, Tag, ChevronRight, Crown } from 'lucide-react';

const CATEGORIES = [
  { name: 'All', icon: '🍽️' },
  { name: 'North Indian', icon: '🍲' },
  { name: 'Chinese', icon: '🥢' },
  { name: 'Biryani', icon: '🍛' },
  { name: 'Fast Food', icon: '🍔' },
  { name: 'Desserts', icon: '🍰' }
];

export const Home = () => {
  const [selectedCuisine, setSelectedCuisine] = useState('All');
  const [searchVal, setSearchVal] = useState('');
  
  const navigate = useNavigate();

  // Fetch active promotional offers
  const { data: offersData } = useQuery({
    queryKey: ['active-offers'],
    queryFn: offerAPI.getOffers
  });
  const offers = offersData?.data || [];

  // React Query to fetch restaurants
  const { data, isLoading, isError } = useQuery({
    queryKey: ['restaurants', selectedCuisine],
    queryFn: () => browseAPI.getRestaurants({
      cuisine: selectedCuisine === 'All' ? undefined : selectedCuisine
    })
  });

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchVal.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchVal.trim())}`);
    }
  };

  const restaurants = data?.data || [];

  return (
    <div className="space-y-12 pb-20">

      {/* ═══ GRAND HERO SECTION ═══ */}
      <section className="relative bg-hero-light dark:bg-hero-dark rounded-3xl overflow-hidden py-20 px-8 md:px-16 shadow-glow-gold-sm animate-fade-in">
        {/* Decorative dot pattern */}
        <div className="absolute inset-0 opacity-[0.04] bg-[radial-gradient(#DAA520_1px,transparent_1px)] [background-size:20px_20px]"></div>
        
        {/* Floating food decorations */}
        <div className="absolute top-8 right-12 text-4xl animate-float opacity-60 pointer-events-none select-none hidden md:block" style={{ animationDelay: '0s' }}>🍕</div>
        <div className="absolute top-24 right-40 text-3xl animate-float opacity-50 pointer-events-none select-none hidden md:block" style={{ animationDelay: '1s' }}>🍜</div>
        <div className="absolute bottom-10 right-20 text-3xl animate-float opacity-50 pointer-events-none select-none hidden md:block" style={{ animationDelay: '2s' }}>🥗</div>
        <div className="absolute bottom-6 left-[60%] text-2xl animate-float opacity-40 pointer-events-none select-none hidden lg:block" style={{ animationDelay: '0.5s' }}>🧁</div>
        <div className="absolute top-10 left-[55%] text-2xl animate-float opacity-40 pointer-events-none select-none hidden lg:block" style={{ animationDelay: '1.5s' }}>🍣</div>

        <div className="relative max-w-2xl space-y-7">
          {/* Sparkling badge */}
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-royal-500/15 dark:bg-royal-500/20 backdrop-blur-md text-xs font-bold uppercase tracking-widest text-royal-600 dark:text-royal-400 border border-royal-500/30 animate-fade-in-up">
            <Crown className="w-3.5 h-3.5" /> Premium Dining Experience
          </span>

          <h1 className="font-display text-4xl md:text-6xl font-bold tracking-tight leading-[1.15] text-gold-gradient animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            Discover the Best Food & Drinks in Your City
          </h1>

          <p className="text-noir-300 dark:text-surface-300 text-base md:text-lg font-sans animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            Order fresh meals from top-rated kitchens and track them in real-time.
          </p>

          {/* Glass search bar */}
          <form onSubmit={handleSearchSubmit} className="glass-card !p-2 flex gap-2 max-w-lg animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-royal-500/60 w-5 h-5" />
              <input
                type="text"
                placeholder="Search restaurant or dish..."
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                className="input-royal w-full pl-11 pr-4 py-3.5 !rounded-xl text-sm !border-transparent !bg-surface-50/80 dark:!bg-noir-500/50"
              />
            </div>
            <button
              type="submit"
              className="btn-royal px-6 !rounded-xl text-sm flex items-center gap-2"
            >
              <Search className="w-4 h-4" />
              Search
            </button>
          </form>
        </div>
      </section>

      {/* ═══ EXCLUSIVE OFFERS CAROUSEL ═══ */}
      {offers.length > 0 && (
        <section className="space-y-5 animate-fade-in-up">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl font-bold text-noir-600 dark:text-surface-50 flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-royal-500/10 dark:bg-royal-500/15">
                <Sparkles className="w-5 h-5 text-royal-500 fill-royal-500/30" />
              </div>
              Exclusive Offers & Coupons
            </h2>
            <ChevronRight className="w-5 h-5 text-royal-500/50" />
          </div>
          <div className="flex gap-5 overflow-x-auto pb-4 scrollbar-none snap-x snap-mandatory">
            {offers.map((off) => (
              <div
                key={off._id}
                className="card-royal relative min-w-[290px] md:min-w-[420px] h-44 !rounded-3xl overflow-hidden flex-shrink-0 snap-center text-white group !p-0"
              >
                {/* Banner background */}
                <img
                  src={off.bannerImage || 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&q=80&w=600'}
                  alt={off.title}
                  className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:scale-110 transition-transform duration-700"
                />
                {/* Gold-tinted gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-noir-600/90 via-noir-500/50 to-royal-600/10"></div>
                
                {/* Content */}
                <div className="absolute bottom-4 left-5 right-5 space-y-2.5">
                  <h3 className="font-display font-bold text-sm md:text-base line-clamp-1 text-surface-50">{off.title}</h3>
                  <p className="text-[11px] text-surface-200/80 line-clamp-2">{off.description}</p>
                  <div className="flex gap-2 text-[9px] font-extrabold uppercase pt-1">
                    <span className="badge-gold flex items-center gap-1">
                      <Tag className="w-2.5 h-2.5" /> CODE: {off.discountCode}
                    </span>
                    <span className="badge-success">
                      🏷️ {off.discountPercent}% OFF
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ═══ CUISINE CATEGORIES ═══ */}
      <section className="space-y-5 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
        <h2 className="font-display text-2xl font-bold text-noir-600 dark:text-surface-50 flex items-center gap-2">
          What's on your mind?
        </h2>
        <div className="flex gap-3 overflow-x-auto pb-3 scroll-smooth scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.name}
              onClick={() => setSelectedCuisine(cat.name)}
              className={`glass-card flex items-center gap-2.5 px-6 py-3.5 !rounded-2xl text-sm font-semibold whitespace-nowrap transition-all duration-300 hover:scale-[1.05] active:scale-[0.97] ${
                selectedCuisine === cat.name
                  ? '!border-royal-500 !bg-royal-500/10 dark:!bg-royal-500/15 text-royal-600 dark:text-royal-400 shadow-glow-gold-sm'
                  : '!border-surface-200/50 dark:!border-noir-400/30 text-noir-400 dark:text-surface-300 hover:!border-royal-500/40'
              }`}
            >
              <span className="text-lg">{cat.icon}</span>
              <span>{cat.name}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Gold divider */}
      <div className="gold-divider"></div>

      {/* ═══ RESTAURANT GRID ═══ */}
      <section className="space-y-6 animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
        <div className="flex justify-between items-center">
          <h2 className="font-display text-2xl font-bold text-noir-600 dark:text-surface-50">
            Popular Restaurants {selectedCuisine !== 'All' && <span className="text-royal-500">serving {selectedCuisine}</span>}
          </h2>
        </div>

        {isLoading ? (
          <Loader type="skeleton-restaurant" count={3} />
        ) : isError ? (
          <div className="glass-card text-center py-12 px-6 !border-red-200 dark:!border-red-900/40">
            <div className="text-4xl mb-3">⚠️</div>
            <p className="text-red-500 dark:text-red-400 font-semibold font-display">Failed to fetch restaurants. Make sure the server is running.</p>
          </div>
        ) : restaurants.length === 0 ? (
          <div className="glass-card text-center py-16 px-8">
            <span className="text-5xl block mb-4">🔍</span>
            <h3 className="font-display text-xl font-bold text-noir-500 dark:text-surface-100 mt-3">No restaurants found</h3>
            <p className="text-noir-200 dark:text-surface-300 text-sm mt-2">Try switching the category filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7 stagger-child">
            {restaurants.map((res) => (
              <div
                key={res._id}
                onClick={() => navigate(`/restaurant/${res._id}`)}
                className="card-royal group cursor-pointer !rounded-2xl overflow-hidden !p-0"
              >
                {/* Cover Image with gradient overlay */}
                <div className="relative h-52 w-full overflow-hidden bg-surface-100 dark:bg-noir-500">
                  <img
                    src={res.coverImage}
                    alt={res.name}
                    className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  {/* Bottom gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-noir-600/40 via-transparent to-transparent"></div>
                  
                  {/* Gold star rating badge */}
                  <div className="absolute top-3 right-3 bg-noir-600/80 backdrop-blur-md text-surface-50 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-royal-500/30">
                    <Star className="w-3.5 h-3.5 fill-royal-500 stroke-royal-500" />
                    <span className="text-royal-400">{res.rating}</span>
                  </div>
                </div>

                {/* Info section */}
                <div className="p-5 space-y-3">
                  <h3 className="font-display text-lg font-bold text-noir-600 dark:text-surface-50 group-hover:text-royal-500 transition-colors duration-300">
                    {res.name}
                  </h3>
                  
                  {/* Cuisine badges */}
                  <div className="flex flex-wrap gap-1.5">
                    {res.cuisines.map((c, i) => (
                      <span key={i} className="badge-neutral text-[10px]">{c}</span>
                    ))}
                  </div>
                  
                  <div className="flex justify-between items-center pt-3 border-t border-surface-200/60 dark:border-noir-400/30 text-xs font-semibold text-noir-200 dark:text-surface-300">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-royal-500/60" />
                      {res.address.city}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-royal-500/60" />
                      30-40 min
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Home;
