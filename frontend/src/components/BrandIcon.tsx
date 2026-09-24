import React from 'react';

export function BrandIcon({ className = 'w-7 h-7' }: { className?: string }) {
  return (
    <img
      src="/crawler-icon.png"
      alt="Web Crawler Brand Icon"
      className={`inline-block object-contain rounded-lg shadow-hairline border border-line bg-surface-raised ${className}`}
    />
  );
}
