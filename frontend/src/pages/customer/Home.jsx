import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { browseAPI, offerAPI } from '../../services/api.js';
import Loader from '../../components/common/Loader.jsx';
import { Search, Star, Clock, MapPin, Sparkles, Tag } from 'lucide-react';

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
    <div className="space-y-10 pb-16">
      
      {/* 1. SPECIAL FESTIVAL OFFERS (ADMIN PLACED) */}
      {offers.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
            <Sparkles className="w-5 h-5 text-amber-500 fill-amber-500" /> Exclusive Offers & Coupons
          </h2>
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-none snap-x snap-mandatory">
            {offers.map((off) => (
              <div
                key={off._id}
                className="relative min-w-[280px] md:min-w-[400px] h-40 rounded-3xl overflow-hidden shadow-md flex-shrink-0 snap-center bg-slate-900 text-white group"
              >
                {/* Banner background */}
                <img
                  src={off.bannerImage || 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&q=80&w=600'}
                  alt={off.title}
                  className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:scale-105 transition-transform duration-500"
                />
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-900/40 to-transparent"></div>
                
                {/* Content */}
                <div className="absolute bottom-4 left-5 right-5 space-y-2">
                  <h3 className="font-extrabold text-sm md:text-base line-clamp-1">{off.title}</h3>
                  <p className="text-[10px] text-slate-300 line-clamp-2">{off.description}</p>
                  <div className="flex gap-2 text-[9px] font-extrabold uppercase pt-1">
                    <span className="px-2 py-0.5 bg-brand-600/90 text-white rounded flex items-center gap-0.5 border border-brand-500">
                      <Tag className="w-2.5 h-2.5" /> CODE: {off.discountCode}
                    </span>
                    <span className="px-2 py-0.5 bg-emerald-500/90 text-white rounded border border-emerald-400">
                      🏷️ {off.discountPercent}% OFF
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
      {/* 1. HERO BANNER WITH GLASSMORPHISM SEARCH */}
      <section className="relative rounded-3xl overflow-hidden py-16 px-6 md:px-12 bg-gradient-to-r from-brand-600 to-rose-500 text-white shadow-xl">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>
        <div className="relative max-w-2xl space-y-6">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" /> Deliciousness delivered fast
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">
            Discover the Best Food & Drinks in Your City
          </h1>
          <p className="text-white/80 text-base md:text-lg">
            Order fresh meals from top-rated kitchens and track them in real-time.
          </p>

          <form onSubmit={handleSearchSubmit} className="flex gap-2 max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search restaurant or dish..."
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 bg-white text-slate-900 rounded-xl shadow-md focus:outline-none focus:ring-2 focus:ring-brand-400 text-sm"
              />
            </div>
            <button
              type="submit"
              className="px-6 bg-slate-900 hover:bg-slate-850 text-white font-semibold rounded-xl transition-all shadow-md active:scale-95 text-sm"
            >
              Search
            </button>
          </form>
        </div>
      </section>

      {/* 2. CUISINE CATEGORIES BAR */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          What's on your mind?
        </h2>
        <div className="flex gap-3 overflow-x-auto pb-2 scroll-smooth">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.name}
              onClick={() => setSelectedCuisine(cat.name)}
              className={`flex items-center gap-2 px-5 py-3 rounded-2xl border text-sm font-semibold whitespace-nowrap transition-all shadow-sm ${
                selectedCuisine === cat.name
                  ? 'bg-brand-600 border-brand-600 text-white hover:bg-brand-700'
                  : 'bg-white border-slate-100 text-slate-700 hover:bg-slate-50 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-750'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.name}</span>
            </button>
          ))}
        </div>
      </section>

      {/* 3. RESTAURANT GRID */}
      <section className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Popular Restaurants {selectedCuisine !== 'All' && `serving ${selectedCuisine}`}
          </h2>
        </div>

        {isLoading ? (
          <Loader type="skeleton-restaurant" count={3} />
        ) : isError ? (
          <div className="text-center py-10 bg-white dark:bg-slate-800 rounded-2xl p-6 border border-rose-100">
            <p className="text-rose-500 font-semibold">Failed to fetch restaurants. Make sure the server is running.</p>
          </div>
        ) : restaurants.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-2xl p-8 border border-slate-100 dark:border-slate-700">
            <span className="text-4xl">🔍</span>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mt-3">No restaurants found</h3>
            <p className="text-slate-400 text-sm mt-1">Try switching the category filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {restaurants.map((res) => (
              <div
                key={res._id}
                onClick={() => navigate(`/restaurant/${res._id}`)}
                className="group cursor-pointer bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-700 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
              >
                {/* Cover Image */}
                <div className="relative h-48 w-full overflow-hidden bg-slate-100">
                  <img
                    src={res.coverImage}
                    alt={res.name}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm dark:bg-slate-900/90 text-slate-900 dark:text-white px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-amber-400 stroke-amber-400" />
                    <span>{res.rating}</span>
                  </div>
                </div>

                {/* Info */}
                <div className="p-5 space-y-3">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-brand-500 transition-colors">
                    {res.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 font-medium">
                    {res.cuisines.join(', ')}
                  </p>
                  
                  <div className="flex justify-between items-center pt-2 border-t border-slate-50 dark:border-slate-750 text-xs font-semibold text-slate-600 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {res.address.city}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
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
