import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' | 'gradient';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', loading = false, disabled, children, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center rounded-lg font-medium transition-all-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50';
    
    const variants = {
      default: 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/50 active:scale-95',
      destructive: 'bg-red-600 text-white hover:bg-red-700 hover:shadow-lg hover:shadow-red-500/50 active:scale-95',
      outline: 'border-2 border-blue-600 text-blue-600 hover:bg-blue-50 hover:shadow-md active:scale-95',
      secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 hover:shadow-md active:scale-95',
      ghost: 'hover:bg-gray-100 hover:text-gray-900 active:scale-95',
      link: 'text-blue-600 underline-offset-4 hover:underline',
      gradient: 'bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white hover:shadow-lg hover:shadow-purple-500/50 active:scale-95 btn-ripple',
    };
    
    const sizes = {
      default: 'h-10 px-4 py-2',
      sm: 'h-8 px-3 text-sm',
      lg: 'h-12 px-8 text-lg',
      icon: 'h-10 w-10',
    };

    return (
      <button
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          loading && 'relative text-transparent',
          className
        )}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="spinner h-5 w-5" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button };