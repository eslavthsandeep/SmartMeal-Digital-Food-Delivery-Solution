import React from 'react';

export const Loader = ({ type = 'spinner', count = 3 }) => {
  if (type === 'spinner') {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="relative w-12 h-12">
          <div className="absolute top-0 left-0 w-full h-full border-4 border-slate-200 rounded-full"></div>
          <div className="absolute top-0 left-0 w-full h-full border-4 border-brand-500 rounded-full border-t-transparent animate-spin"></div>
        </div>
      </div>
    );
  }

  if (type === 'skeleton-restaurant') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: count }).map((_, idx) => (
          <div key={idx} className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-sm border border-slate-100 dark:border-slate-700 p-4 space-y-4">
            <div className="w-full h-44 rounded-xl shimmer"></div>
            <div className="h-6 w-2/3 rounded shimmer"></div>
            <div className="h-4 w-1/2 rounded shimmer"></div>
            <div className="flex justify-between items-center pt-2">
              <div className="h-4 w-1/4 rounded shimmer"></div>
              <div className="h-4 w-1/4 rounded shimmer"></div>
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
          <div key={idx} className="flex gap-4 p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
            <div className="w-24 h-24 rounded-lg shimmer flex-shrink-0"></div>
            <div className="flex-1 space-y-2 py-1">
              <div className="h-5 w-1/3 rounded shimmer"></div>
              <div className="h-4 w-2/3 rounded shimmer"></div>
              <div className="h-4 w-1/4 rounded shimmer pt-2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return null;
};

export default Loader;
