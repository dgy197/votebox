import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline' | 'gold';
type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: ReactNode;
  children: ReactNode;
}

const variants: Record<ButtonVariant, string> = {
  primary: `
    bg-obsidian-900 hover:bg-obsidian-800 text-ivory-100
    dark:bg-ivory-100 dark:hover:bg-ivory-200 dark:text-obsidian-900
    shadow-sm hover:shadow-md
  `,
  secondary: `
    bg-obsidian-100 hover:bg-obsidian-200 text-obsidian-800
    dark:bg-obsidian-800 dark:hover:bg-obsidian-700 dark:text-ivory-100
  `,
  danger: `
    bg-ballot-no hover:bg-red-700 text-white
    shadow-sm
  `,
  ghost: `
    hover:bg-obsidian-100 dark:hover:bg-obsidian-800 
    text-obsidian-600 dark:text-obsidian-300
  `,
  outline: `
    border-2 border-obsidian-200 dark:border-obsidian-700 
    hover:bg-obsidian-50 dark:hover:bg-obsidian-800/50 
    text-obsidian-700 dark:text-obsidian-300
    hover:border-obsidian-300 dark:hover:border-obsidian-600
  `,
  gold: `
    bg-gradient-to-r from-gold-400 via-gold-500 to-gold-400
    hover:from-gold-500 hover:via-gold-400 hover:to-gold-500
    text-obsidian-950 font-semibold
    shadow-glow-gold hover:shadow-lg
    bg-[length:200%_100%] hover:bg-[position:100%_0]
    transition-all duration-500
  `,
};

const sizes: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm min-h-[36px] gap-1.5',
  md: 'px-5 py-2.5 text-base min-h-[44px] gap-2',
  lg: 'px-6 py-3 text-lg min-h-[52px] gap-2',
  xl: 'px-8 py-4 text-xl min-h-[60px] gap-3',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, icon, children, disabled, className = '', ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`
          inline-flex items-center justify-center
          font-medium rounded-xl
          transition-all duration-300 ease-ballot
          focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 focus-visible:ring-offset-2
          focus-visible:ring-offset-ivory-100 dark:focus-visible:ring-offset-obsidian-950
          disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
          active:scale-[0.97]
          press-effect
          ${variants[variant]}
          ${sizes[size]}
          ${className}
        `}
        {...props}
      >
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : icon ? (
          <span className="flex-shrink-0">{icon}</span>
        ) : null}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
