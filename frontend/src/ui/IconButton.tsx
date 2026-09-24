import { ButtonHTMLAttributes, forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  'aria-label': string; // Enforce accessible label
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      className = '',
      variant = 'ghost',
      size = 'md',
      isLoading = false,
      disabled,
      children,
      'aria-label': ariaLabel,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center rounded-lg transition-colors duration-fast focus-ring disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98] shrink-0';

    const sizeStyles = {
      sm: 'w-8 h-8 text-xs',
      md: 'w-9 h-9 text-sm',
      lg: 'w-11 h-11 text-base',
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
        aria-label={ariaLabel}
        title={ariaLabel}
        disabled={disabled || isLoading}
        className={`${baseStyles} ${sizeStyles} ${variantStyles} ${className}`}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin shrink-0" aria-hidden="true" />
        ) : (
          children
        )}
      </button>
    );
  }
);

IconButton.displayName = 'IconButton';
