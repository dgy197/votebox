import type { ReactNode } from 'react';

export type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'gold' | 'primary' | 'secondary';
export type BadgeSize = 'sm' | 'md' | 'lg';

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  className?: string;
}

const variants: Record<BadgeVariant, string> = {
  default: 'bg-obsidian-100 text-obsidian-700 dark:bg-obsidian-800 dark:text-obsidian-300',
  success: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  warning: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  danger: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  info: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  gold: 'bg-gold-100 text-gold-700 dark:bg-gold-900/30 dark:text-gold-400',
  primary: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  secondary: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
};

const dotColors: Record<BadgeVariant, string> = {
  default: 'bg-obsidian-400',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  danger: 'bg-red-500',
  info: 'bg-blue-500',
  gold: 'bg-gold-500',
  primary: 'bg-blue-500',
  secondary: 'bg-gray-500',
};

const sizes: Record<BadgeSize, string> = {
  sm: 'px-2.5 py-0.5 text-xs',
  md: 'px-3 py-1 text-sm',
  lg: 'px-4 py-1.5 text-base font-semibold',
};

export function Badge({ 
  children, 
  variant = 'default', 
  size = 'md', 
  dot = false,
  className = '',
}: BadgeProps) {
  return (
    <span 
      className={`
        inline-flex items-center gap-2 
        font-medium rounded-full
        transition-colors duration-200
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
    >
      {dot && (
        <span className={`w-2 h-2 rounded-full ${dotColors[variant]} ${variant === 'success' || variant === 'gold' ? 'animate-pulse' : ''}`} />
      )}
      {children}
    </span>
  );
}
