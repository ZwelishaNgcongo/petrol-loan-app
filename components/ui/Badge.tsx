import * as React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'success' | 'warning' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  pulse?: boolean;
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = 'default', size = 'md', pulse = false, ...props }, ref) => {
    const variants = {
      default: 'bg-blue-100 text-blue-800 border-blue-300',
      secondary: 'bg-gray-100 text-gray-800 border-gray-300',
      success: 'bg-green-100 text-green-800 border-green-300',
      warning: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      danger: 'bg-red-100 text-red-800 border-red-300',
      outline: 'bg-transparent border-2 border-gray-300 text-gray-700',
    };

    const sizes = {
      sm: 'px-2 py-0.5 text-xs',
      md: 'px-3 py-1 text-sm',
      lg: 'px-4 py-1.5 text-base',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full font-medium border transition-all',
          variants[variant],
          sizes[size],
          pulse && 'badge-pulse',
          className
        )}
        {...props}
      />
    );
  }
);

Badge.displayName = 'Badge';

export { Badge };