import React from 'react';

export function BrandIcon({ className = 'w-7 h-7' }: { className?: string }) {
  return (
    <img
      src="/crawler-icon.png"
      alt="Web Crawler Brand Icon"
      className={`inline-block object-contain rounded-lg shadow-sm border border-slate-700/40 bg-white/10 backdrop-blur-sm ${className}`}
    />
  );
}
