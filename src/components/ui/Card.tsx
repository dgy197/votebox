import type { ReactNode } from 'react';

export interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  hover?: boolean;
  glass?: boolean;
  accent?: 'none' | 'gold' | 'top';
  style?: React.CSSProperties;
  onClick?: () => void;
}

const paddings = {
  none: '',
  sm: 'p-4',
  md: 'p-5 sm:p-6',
  lg: 'p-6 sm:p-8',
  xl: 'p-8 sm:p-10',
};

export function Card({ 
  children, 
  className = '', 
  padding = 'md', 
  hover = false,
  glass = false,
  accent = 'none',
  style,
  onClick,
}: CardProps) {
  const accentStyles = {
    none: '',
    gold: 'ring-1 ring-gold-400/20',
    top: 'border-t-2 border-t-gold-400',
  };

  return (
    <div
      className={`
        relative
        ${glass 
          ? 'glass' 
          : 'bg-white dark:bg-obsidian-900/80'
        }
        rounded-2xl
        shadow-card
        border border-obsidian-100/50 dark:border-obsidian-800/50
        ${hover || onClick ? 'card-lift hover:shadow-card-hover cursor-pointer' : ''}
        ${accentStyles[accent]}
        ${paddings[padding]}
        ${className}
      `}
      style={style}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  icon?: ReactNode;
}

export function CardHeader({ title, subtitle, action, icon }: CardHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
      <div className="flex items-center gap-3">
        {icon && (
          <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-gold-400/20 to-gold-500/10 flex items-center justify-center">
            {icon}
          </div>
        )}
        <div>
          <h3 className="font-display text-display-sm text-obsidian-900 dark:text-ivory-100">
            {title}
          </h3>
          {subtitle && (
            <p className="text-sm text-obsidian-500 dark:text-obsidian-400 mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}

// Divider for cards
export function CardDivider() {
  return (
    <div className="h-px bg-gradient-to-r from-transparent via-obsidian-200 dark:via-obsidian-700 to-transparent my-6" />
  );
}
