import React from 'react';

export const Loader = ({ type = 'spinner', count = 3 }) => {
  if (type === 'spinner') {
    return (
      <div className="flex flex-col items-center justify-center p-12 gap-5">
        {/* Outer glow ring */}
        <div className="relative w-14 h-14">
          <div className="absolute inset-0 rounded-full border-4 border-royal-500/20 dark:border-royal-400/10"></div>
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-royal-500 dark:border-t-royal-400 animate-spin"></div>
          <div className="absolute inset-1.5 rounded-full border-2 border-transparent border-b-royal-600/40 dark:border-b-royal-400/30 animate-spin-slow"></div>
          {/* Center gold dot */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-royal-500 animate-pulse-soft shadow-glow-gold-sm"></div>
          </div>
        </div>
        {/* Brand text */}
        <p className="text-shimmer font-display text-lg tracking-wide select-none">
          SmartMeal
        </p>
      </div>
    );
  }

  if (type === 'skeleton-restaurant') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: count }).map((_, idx) => (
          <div
            key={idx}
            className="bg-surface-50 dark:bg-noir-500 rounded-2xl overflow-hidden shadow-card border border-royal-500/10 dark:border-royal-500/5 p-4 space-y-4"
          >
            <div className="w-full h-44 rounded-xl bg-gradient-to-r from-surface-100 via-royal-500/10 to-surface-100 dark:from-noir-400 dark:via-royal-500/5 dark:to-noir-400 animate-shimmer-gold bg-[length:200%_100%]"></div>
            <div className="h-6 w-2/3 rounded-lg bg-gradient-to-r from-surface-100 via-royal-500/10 to-surface-100 dark:from-noir-400 dark:via-royal-500/5 dark:to-noir-400 animate-shimmer-gold bg-[length:200%_100%]"></div>
            <div className="h-4 w-1/2 rounded-lg bg-gradient-to-r from-surface-100 via-royal-500/10 to-surface-100 dark:from-noir-400 dark:via-royal-500/5 dark:to-noir-400 animate-shimmer-gold bg-[length:200%_100%]"></div>
            <div className="flex justify-between items-center pt-2">
              <div className="h-4 w-1/4 rounded-lg bg-gradient-to-r from-surface-100 via-royal-500/10 to-surface-100 dark:from-noir-400 dark:via-royal-500/5 dark:to-noir-400 animate-shimmer-gold bg-[length:200%_100%]"></div>
              <div className="h-4 w-1/4 rounded-lg bg-gradient-to-r from-surface-100 via-royal-500/10 to-surface-100 dark:from-noir-400 dark:via-royal-500/5 dark:to-noir-400 animate-shimmer-gold bg-[length:200%_100%]"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (type === 'skeleton-menu') {
    return (
      <div className="space-y-4">
        {Array.from({ length: count }).map((_, idx) => (
          <div
            key={idx}
            className="flex gap-4 p-4 bg-surface-50 dark:bg-noir-500 rounded-2xl border border-royal-500/10 dark:border-royal-500/5 shadow-card"
          >
            <div className="w-24 h-24 rounded-xl bg-gradient-to-r from-surface-100 via-royal-500/10 to-surface-100 dark:from-noir-400 dark:via-royal-500/5 dark:to-noir-400 animate-shimmer-gold bg-[length:200%_100%] flex-shrink-0"></div>
            <div className="flex-1 space-y-2.5 py-1">
              <div className="h-5 w-1/3 rounded-lg bg-gradient-to-r from-surface-100 via-royal-500/10 to-surface-100 dark:from-noir-400 dark:via-royal-500/5 dark:to-noir-400 animate-shimmer-gold bg-[length:200%_100%]"></div>
              <div className="h-4 w-2/3 rounded-lg bg-gradient-to-r from-surface-100 via-royal-500/10 to-surface-100 dark:from-noir-400 dark:via-royal-500/5 dark:to-noir-400 animate-shimmer-gold bg-[length:200%_100%]"></div>
              <div className="h-4 w-1/4 rounded-lg bg-gradient-to-r from-surface-100 via-royal-500/10 to-surface-100 dark:from-noir-400 dark:via-royal-500/5 dark:to-noir-400 animate-shimmer-gold bg-[length:200%_100%] mt-1"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return null;
};

export default Loader;
