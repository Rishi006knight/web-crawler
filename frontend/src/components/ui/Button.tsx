import React, { ButtonHTMLAttributes, forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'primary', size = 'md', isLoading = false, disabled, children, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition focus-ring disabled:opacity-50 disabled:cursor-not-allowed select-none';

    const sizeStyles = {
      sm: 'px-2.5 py-1.5 text-xs space-x-1.5',
      md: 'px-4 py-2 text-sm space-x-2',
      lg: 'px-5 py-2.5 text-base space-x-2.5'
    }[size];

    const variantStyles = {
      primary: 'bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white shadow-sm',
      secondary: 'bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 border border-slate-300 dark:border-slate-700',
      outline: 'bg-transparent border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200',
      ghost: 'bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800/70 text-slate-600 dark:text-slate-300',
      danger: 'bg-red-600 hover:bg-red-500 active:bg-red-700 text-white shadow-sm'
    }[variant];

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`${baseStyles} ${sizeStyles} ${variantStyles} ${className}`}
        {...props}
      >
        {isLoading && <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" aria-hidden="true" />}
        <span>{children}</span>
      </button>
    );
  }
);

Button.displayName = 'Button';
