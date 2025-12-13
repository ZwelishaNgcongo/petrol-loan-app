'use client';

import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
  className?: string;
}

const colorVariants = {
  blue: {
    bg: 'from-blue-500 to-blue-600',
    icon: 'bg-blue-100 text-blue-600',
    text: 'text-blue-600',
  },
  green: {
    bg: 'from-green-500 to-green-600',
    icon: 'bg-green-100 text-green-600',
    text: 'text-green-600',
  },
  yellow: {
    bg: 'from-yellow-500 to-yellow-600',
    icon: 'bg-yellow-100 text-yellow-600',
    text: 'text-yellow-600',
  },
  red: {
    bg: 'from-red-500 to-red-600',
    icon: 'bg-red-100 text-red-600',
    text: 'text-red-600',
  },
  purple: {
    bg: 'from-purple-500 to-purple-600',
    icon: 'bg-purple-100 text-purple-600',
    text: 'text-purple-600',
  },
};

export function StatCard({ title, value, icon, trend, color = 'blue', className }: StatCardProps) {
  const colors = colorVariants[color];

  return (
    <Card hover className={cn('relative overflow-hidden fade-in-up', className)}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm font-medium text-gray-600">{title}</div>
          {icon && (
            <div className={cn('p-3 rounded-xl', colors.icon)}>
              {icon}
            </div>
          )}
        </div>
        
        <div className="flex items-baseline gap-2">
          <div className="text-3xl font-bold text-gray-900">{value}</div>
          {trend && (
            <div className={cn(
              'flex items-center text-sm font-medium',
              trend.isPositive ? 'text-green-600' : 'text-red-600'
            )}>
              <svg
                className={cn('w-4 h-4 mr-1', trend.isPositive ? '' : 'transform rotate-180')}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
              {Math.abs(trend.value)}%
            </div>
          )}
        </div>
      </div>
      
      {/* Decorative gradient */}
      <div className={cn('absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r', colors.bg)} />
    </Card>
  );
}

export function StatCardSkeleton() {
  return (
    <Card>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="h-4 w-24 skeleton" />
          <div className="h-12 w-12 rounded-xl skeleton" />
        </div>
        <div className="h-8 w-20 skeleton" />
      </div>
    </Card>
  );
}