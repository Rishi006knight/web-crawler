import React, { ButtonHTMLAttributes, forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className = '',
      variant = 'primary',
      size = 'md',
      isLoading = false,
      disabled,
      children,
      leftIcon,
      rightIcon,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium rounded-lg transition-colors duration-fast focus-ring disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98]';

    const sizeStyles = {
      sm: 'px-2.5 py-1.5 text-xs gap-1.5 min-h-[32px]',
      md: 'px-3.5 py-2 text-sm gap-2 min-h-[38px]',
      lg: 'px-5 py-2.5 text-base gap-2.5 min-h-[44px]',
    }[size];

    const variantStyles = {
      primary:
        'bg-brand hover:bg-brand-hover text-white shadow-hairline border border-transparent',
      secondary:
        'bg-surface-sunken hover:bg-surface text-ink-strong border border-line hover:border-line-strong shadow-hairline',
      outline:
        'bg-transparent border border-line hover:border-line-strong hover:bg-surface text-ink',
      ghost:
        'bg-transparent hover:bg-surface text-ink-secondary hover:text-ink',
      danger:
        'bg-status-danger hover:opacity-90 text-white shadow-hairline border border-transparent',
    }[variant];

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`${baseStyles} ${sizeStyles} ${variantStyles} ${className}`}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin shrink-0" aria-hidden="true" />
        ) : (
          leftIcon && <span className="shrink-0">{leftIcon}</span>
        )}
        <span>{children}</span>
        {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
