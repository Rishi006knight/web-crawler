import React from 'react';

export type StatusVariant =
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'blocked'
  | 'neutral'
  | 'default';

export interface StatusChipProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: StatusVariant;
  size?: 'sm' | 'md';
  dot?: boolean;
}

export function StatusChip({
  className = '',
  variant = 'default',
  size = 'md',
  dot = false,
  children,
  ...props
}: StatusChipProps) {
  const sizeStyles = size === 'sm' ? 'px-2 py-0.5 text-xs gap-1.5' : 'px-2.5 py-1 text-xs gap-2';

  const variantStyles = {
    default: 'bg-brand-subtle text-brand border border-brand/30',
    info: 'bg-status-info-bg text-status-info border border-status-info-line',
    success: 'bg-status-success-bg text-status-success border border-status-success-line',
    warning: 'bg-status-warning-bg text-status-warning border border-status-warning-line',
    danger: 'bg-status-danger-bg text-status-danger border border-status-danger-line',
    blocked: 'bg-status-blocked-bg text-status-blocked border border-status-blocked-line',
    neutral: 'bg-surface-sunken text-ink-secondary border border-line',
  }[variant];

  const dotColor = {
    default: 'bg-brand',
    info: 'bg-status-info',
    success: 'bg-status-success',
    warning: 'bg-status-warning',
    danger: 'bg-status-danger',
    blocked: 'bg-status-blocked',
    neutral: 'bg-ink-muted',
  }[variant];

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full ${sizeStyles} ${variantStyles} ${className}`}
      {...props}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColor}`} aria-hidden="true" />}
      <span>{children}</span>
    </span>
  );
}

// Backwards compatibility alias
export const Badge = StatusChip;
