import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, icon, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-obsidian-700 dark:text-obsidian-300 mb-2 tracking-wide">
            {label}
          </label>
        )}
        <div className="relative group">
          {icon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-obsidian-400 dark:text-obsidian-500 transition-colors group-focus-within:text-gold-500">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={`
              w-full px-4 py-3.5
              ${icon ? 'pl-12' : ''}
              text-base font-medium tracking-wide
              bg-ivory-100 dark:bg-obsidian-800
              border-2 rounded-xl
              ${error 
                ? 'border-ballot-no focus:border-ballot-no focus:ring-ballot-no/20' 
                : 'border-obsidian-200 dark:border-obsidian-700 focus:border-gold-400 dark:focus:border-gold-500'
              }
              text-obsidian-900 dark:text-ivory-100
              placeholder:text-obsidian-400 dark:placeholder:text-obsidian-500
              placeholder:font-normal
              focus:outline-none focus:ring-4 
              ${error ? 'focus:ring-ballot-no/10' : 'focus:ring-gold-400/10'}
              transition-all duration-300 ease-ballot
              min-h-[56px]
              ${className}
            `}
            {...props}
          />
          {/* Focus glow effect */}
          <div className="absolute inset-0 -z-10 rounded-xl bg-gold-400/0 group-focus-within:bg-gold-400/5 transition-all duration-300 scale-105 opacity-0 group-focus-within:opacity-100" />
        </div>
        {error && (
          <p className="mt-2 text-sm text-ballot-no flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </p>
        )}
        {hint && !error && (
          <p className="mt-2 text-sm text-obsidian-500 dark:text-obsidian-400">
            {hint}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
