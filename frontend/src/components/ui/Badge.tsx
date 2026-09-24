import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'neutral';
  size?: 'sm' | 'md';
}

export function Badge({
  className = '',
  variant = 'default',
  size = 'md',
  children,
  ...props
}: BadgeProps) {
  const sizeStyles = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  const variantStyles = {
    default: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20',
    success: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
    warning: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20',
    error: 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20',
    neutral: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20'
  }[variant];

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full ${sizeStyles} ${variantStyles} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
