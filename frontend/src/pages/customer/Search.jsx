import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { browseAPI } from '../../services/api.js';
import { useCartStore } from '../../store/cartStore.js';
import { useToastStore } from '../../store/toastStore.js';
import Loader from '../../components/common/Loader.jsx';
import { Search as SearchIcon, Star, Filter, ShoppingBag, Leaf } from 'lucide-react';

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
    <div className="space-y-8 pb-16">
      {/* 1. Search Box & Filter Bar */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm space-y-4">
        <form onSubmit={triggerSearch} className="flex gap-2">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="What are you craving today?"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white rounded-xl border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-400 text-sm"
            />
          </div>
          <button
            type="submit"
            className="px-6 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-xl text-sm transition-all active:scale-95"
          >
            Search
          </button>
        </form>

        <div className="flex gap-3 items-center text-sm pt-2">
          <span className="flex items-center gap-1 text-slate-500 font-semibold uppercase text-xs tracking-wider">
            <Filter className="w-3.5 h-3.5" /> Filters:
          </span>
          <button
            onClick={() => setIsVeg(!isVeg)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
              isVeg
                ? 'bg-emerald-50 border-emerald-300 text-emerald-700 dark:bg-emerald-950/30 dark:border-emerald-800'
                : 'bg-white border-slate-200 text-slate-600 dark:bg-slate-900 dark:border-slate-800'
            }`}
          >
            <Leaf className={`w-3.5 h-3.5 ${isVeg ? 'fill-emerald-500 text-emerald-600' : 'text-slate-400'}`} />
            Veg Only
          </button>
        </div>
      </div>

      {/* 2. Results Container */}
      {!queryParam.trim() ? (
        <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-8">
          <span className="text-5xl">🌮</span>
          <h2 className="text-lg font-bold text-slate-700 dark:text-slate-200 mt-4">Type above to search</h2>
          <p className="text-slate-400 text-sm">Explore cuisines, snacks, burgers, desserts, and more.</p>
        </div>
      ) : isLoading ? (
        <Loader type="spinner" />
      ) : isError ? (
        <div className="text-center text-rose-500 font-bold p-6">Failed to search items. Try again.</div>
      ) : searchResults.menuItems.length === 0 && searchResults.restaurants.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-8">
          <span className="text-4xl">😿</span>
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mt-3">No results matching "{queryParam}"</h3>
          <p className="text-slate-400 text-sm">Check spelling or try checking another search term.</p>
        </div>
      ) : (
        <div className="space-y-10">
          {/* Matches by dishes */}
          {searchResults.menuItems.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Dishes matching your search
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {searchResults.menuItems.map((item) => (
                  <div
                    key={item._id}
                    className="flex gap-4 p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-24 h-24 rounded-xl object-cover bg-slate-100"
                    />
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`w-3.5 h-3.5 border flex items-center justify-center text-[8px] flex-shrink-0 ${
                              item.isVeg ? 'border-emerald-500 text-emerald-500' : 'border-red-500 text-red-500'
                            }`}
                          >
                            ●
                          </span>
                          <h3 className="font-bold text-slate-900 dark:text-white text-sm line-clamp-1">{item.name}</h3>
                        </div>
                        <p className="text-xs text-slate-400 dark:text-slate-500 line-clamp-1 mt-0.5">
                          {item.restaurantId.name}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1.5">
                          {item.description}
                        </p>
                      </div>

                      <div className="flex justify-between items-center mt-3">
                        <span className="text-sm font-bold text-brand-600">₹{item.price}</span>
                        <button
                          onClick={() => handleAddToCart(item)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-50 hover:bg-brand-100 text-brand-600 dark:bg-brand-950/20 dark:text-brand-400 text-xs font-semibold rounded-lg transition-colors"
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

          {/* Matches by Restaurants */}
          {searchResults.restaurants.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Restaurants matching your search</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {searchResults.restaurants.map((res) => (
                  <div
                    key={res._id}
                    onClick={() => navigate(`/restaurant/${res._id}`)}
                    className="group cursor-pointer bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-700 hover:shadow-md transition-shadow"
                  >
                    <div className="relative h-36 w-full">
                      <img src={res.coverImage} alt={res.name} className="h-full w-full object-cover" />
                      <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm dark:bg-slate-900/90 text-slate-900 dark:text-white px-2 py-0.5 rounded-lg text-xs font-bold flex items-center gap-0.5">
                        <Star className="w-3 h-3 fill-amber-400 stroke-amber-400" />
                        {res.rating}
                      </div>
                    </div>
                    <div className="p-4 space-y-2">
                      <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-brand-500 transition-colors text-sm">
                        {res.name}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                        {res.cuisines.join(', ')}
                      </p>
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
