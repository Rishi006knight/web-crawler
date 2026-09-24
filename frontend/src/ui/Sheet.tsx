import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { IconButton } from './IconButton';

export interface SheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

export function Sheet({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'lg',
}: SheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock background scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const maxWidthStyles = {
    sm: 'max-w-md',
    md: 'max-w-xl',
    lg: 'max-w-3xl',
    xl: 'max-w-5xl',
    full: 'max-w-7xl',
  }[size];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="sheet-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={sheetRef}
        className={`w-full ${maxWidthStyles} bg-surface-raised border border-line shadow-floating rounded-t-2xl sm:rounded-2xl max-h-[92vh] sm:max-h-[88vh] flex flex-col overflow-hidden animate-sheet sm:animate-modal`}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-line flex items-center justify-between shrink-0">
          <div>
            <h2 id="sheet-title" className="text-base sm:text-lg font-semibold text-ink-strong">
              {title}
            </h2>
            {description && (
              <p className="text-xs text-ink-secondary mt-0.5">{description}</p>
            )}
          </div>
          <IconButton
            variant="ghost"
            size="sm"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <X className="w-4 h-4 text-ink-secondary" />
          </IconButton>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto flex-1 text-ink">{children}</div>
      </div>
    </div>
  );
}

// Dialog alias for convenience
export const Dialog = Sheet;
