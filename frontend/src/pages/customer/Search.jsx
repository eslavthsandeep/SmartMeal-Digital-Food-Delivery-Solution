import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { browseAPI } from '../../services/api.js';
import { useCartStore } from '../../store/cartStore.js';
import { useToastStore } from '../../store/toastStore.js';
import Loader from '../../components/common/Loader.jsx';
import { Search as SearchIcon, Star, Filter, ShoppingBag, Leaf, Sparkles, UtensilsCrossed } from 'lucide-react';

export const Search = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryParam = searchParams.get('q') || '';

  const [inputVal, setInputVal] = useState(queryParam);
  const [isVeg, setIsVeg] = useState(false);

  const navigate = useNavigate();
  const addItem = useCartStore((state) => state.addItem);
  const addToast = useToastStore((state) => state.addToast);

  // Sync inputs with URL queries
  useEffect(() => {
    setInputVal(queryParam);
  }, [queryParam]);

  // Debounced/Trigger search trigger
  const triggerSearch = (e) => {
    if (e) e.preventDefault();
    setSearchParams({ q: inputVal, veg: isVeg.toString() });
  };

  const { data, isLoading, isError } = useQuery({
    queryKey: ['search', queryParam, isVeg],
    queryFn: () => browseAPI.searchFood(queryParam, isVeg),
    enabled: !!queryParam.trim()
  });

  const handleAddToCart = (item) => {
    try {
      // Find parent restaurant details populated
      const resId = item.restaurantId._id;
      const resName = item.restaurantId.name;
      addItem(
        {
          menuItemId: item._id,
          name: item.name,
          price: item.price,
          isVeg: item.isVeg
        },
        resId,
        resName
      );
      addToast(`Added ${item.name} to cart`, 'success');
    } catch (err) {
      if (err.message === 'CLEAR_CART_REQUIRED') {
        addToast('Your cart has items from another restaurant. Please checkout or empty it first.', 'error');
      } else {
        addToast('Could not add item', 'error');
      }
    }
  };

  const searchResults = data?.data || { menuItems: [], restaurants: [] };

  return (
    <div className="space-y-8 pb-20">

      {/* ═══ PREMIUM SEARCH BAR & FILTERS ═══ */}
      <div className="glass-card !p-6 space-y-5 animate-fade-in">
        <form onSubmit={triggerSearch} className="flex gap-3">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-royal-500/50 w-5 h-5" />
            <input
              type="text"
              placeholder="What are you craving today?"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              className="input-royal w-full pl-11 pr-4 py-3.5 text-sm"
            />
          </div>
          <button
            type="submit"
            className="btn-royal px-7 !rounded-xl text-sm flex items-center gap-2 whitespace-nowrap"
          >
            <SearchIcon className="w-4 h-4" />
            Search
          </button>
        </form>

        {/* Filter bar with gold-styled toggle */}
        <div className="flex gap-4 items-center text-sm pt-1">
          <span className="label-royal flex items-center gap-1.5 text-[11px]">
            <Filter className="w-3.5 h-3.5 text-royal-500/60" /> Filters
          </span>
          <button
            onClick={() => setIsVeg(!isVeg)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-semibold transition-all duration-300 active:scale-[0.97] ${
              isVeg
                ? 'bg-emerald-50 border-emerald-400 text-emerald-700 dark:bg-emerald-950/30 dark:border-emerald-700 dark:text-emerald-400 shadow-sm'
                : 'bg-surface-50 border-surface-200 text-noir-300 dark:bg-noir-500 dark:border-noir-400 dark:text-surface-300 hover:border-royal-500/40'
            }`}
          >
            <div className={`relative w-8 h-4.5 rounded-full transition-colors duration-300 flex items-center ${
              isVeg ? 'bg-emerald-500' : 'bg-surface-300 dark:bg-noir-400'
            }`}>
              <div className={`absolute w-3.5 h-3.5 rounded-full bg-white shadow-sm transition-transform duration-300 ${
                isVeg ? 'translate-x-4' : 'translate-x-0.5'
              }`}></div>
            </div>
            <Leaf className={`w-3.5 h-3.5 ${isVeg ? 'fill-emerald-500 text-emerald-600' : 'text-noir-200 dark:text-surface-400'}`} />
            Veg Only
          </button>
        </div>
      </div>

      {/* ═══ RESULTS CONTAINER ═══ */}
      {!queryParam.trim() ? (
        /* Elegant initial state */
        <div className="glass-card text-center py-24 px-8 animate-fade-in-up">
          <div className="inline-flex p-5 rounded-full bg-royal-500/10 dark:bg-royal-500/15 mb-5">
            <UtensilsCrossed className="w-10 h-10 text-royal-500 animate-pulse-soft" />
          </div>
          <h2 className="font-display text-2xl font-bold text-noir-500 dark:text-surface-100 mt-2">
            Explore Culinary Delights
          </h2>
          <p className="text-noir-200 dark:text-surface-300 text-sm mt-2 max-w-md mx-auto">
            Search for cuisines, snacks, burgers, desserts, and discover your next favorite meal.
          </p>
        </div>
      ) : isLoading ? (
        <Loader type="spinner" />
      ) : isError ? (
        <div className="glass-card text-center py-12 px-6 !border-red-200 dark:!border-red-900/40">
          <div className="text-4xl mb-3">⚠️</div>
          <p className="text-red-500 dark:text-red-400 font-bold font-display">Failed to search items. Try again.</p>
        </div>
      ) : searchResults.menuItems.length === 0 && searchResults.restaurants.length === 0 ? (
        /* Elegant empty results */
        <div className="glass-card text-center py-20 px-8 animate-fade-in-up">
          <span className="text-5xl block mb-4">😿</span>
          <h3 className="font-display text-xl font-bold text-noir-500 dark:text-surface-100 mt-3">
            No results matching "<span className="text-royal-500">{queryParam}</span>"
          </h3>
          <p className="text-noir-200 dark:text-surface-300 text-sm mt-2">Check spelling or try another search term.</p>
        </div>
      ) : (
        <div className="space-y-12">
          {/* ── Dishes results ── */}
          {searchResults.menuItems.length > 0 && (
            <div className="space-y-5 animate-fade-in-up">
              <h2 className="font-display text-xl font-bold text-noir-600 dark:text-surface-50 flex items-center gap-2.5">
                <Sparkles className="w-5 h-5 text-royal-500" />
                Dishes matching your search
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 stagger-child">
                {searchResults.menuItems.map((item) => (
                  <div
                    key={item._id}
                    className="card-royal flex gap-4 !rounded-2xl overflow-hidden"
                  >
                    {/* Dish image */}
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-28 h-28 rounded-xl object-cover bg-surface-100 dark:bg-noir-500 flex-shrink-0"
                    />
                    <div className="flex-1 flex flex-col justify-between min-w-0">
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`flex-shrink-0 ${
                              item.isVeg ? 'veg-indicator' : 'nonveg-indicator'
                            }`}
                          ></span>
                          <h3 className="font-display font-bold text-noir-600 dark:text-surface-50 text-sm line-clamp-1">{item.name}</h3>
                        </div>
                        <p className="text-[11px] text-royal-500/70 dark:text-royal-400/70 font-medium line-clamp-1 mt-0.5">
                          {item.restaurantId.name}
                        </p>
                        <p className="text-xs text-noir-200 dark:text-surface-300 line-clamp-2 mt-1.5">
                          {item.description}
                        </p>
                      </div>

                      <div className="flex justify-between items-center mt-3">
                        <span className="text-sm font-bold text-royal-600 dark:text-royal-400">₹{item.price}</span>
                        <button
                          onClick={() => handleAddToCart(item)}
                          className="btn-royal-outline flex items-center gap-1.5 !px-3 !py-1.5 !text-xs !rounded-lg"
                        >
                          <ShoppingBag className="w-3.5 h-3.5" />
                          Add to Cart
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Gold divider between sections */}
          {searchResults.menuItems.length > 0 && searchResults.restaurants.length > 0 && (
            <div className="gold-divider"></div>
          )}

          {/* ── Restaurant results ── */}
          {searchResults.restaurants.length > 0 && (
            <div className="space-y-5 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              <h2 className="font-display text-xl font-bold text-noir-600 dark:text-surface-50">
                Restaurants matching your search
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 stagger-child">
                {searchResults.restaurants.map((res) => (
                  <div
                    key={res._id}
                    onClick={() => navigate(`/restaurant/${res._id}`)}
                    className="card-royal group cursor-pointer !rounded-2xl overflow-hidden !p-0"
                  >
                    {/* Cover image with overlay */}
                    <div className="relative h-40 w-full overflow-hidden">
                      <img
                        src={res.coverImage}
                        alt={res.name}
                        className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-noir-600/30 via-transparent to-transparent"></div>
                      
                      {/* Gold star badge */}
                      <div className="absolute top-2.5 right-2.5 bg-noir-600/80 backdrop-blur-md text-surface-50 px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1 border border-royal-500/25">
                        <Star className="w-3 h-3 fill-royal-500 stroke-royal-500" />
                        <span className="text-royal-400">{res.rating}</span>
                      </div>
                    </div>

                    <div className="p-4 space-y-2">
                      <h3 className="font-display font-bold text-noir-600 dark:text-surface-50 group-hover:text-royal-500 transition-colors duration-300 text-sm">
                        {res.name}
                      </h3>
                      <div className="flex flex-wrap gap-1">
                        {res.cuisines.map((c, i) => (
                          <span key={i} className="badge-neutral text-[10px]">{c}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Search;
