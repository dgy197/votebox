import { type ReactNode, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from './Button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'full';
}

const sizes = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  full: 'max-w-full mx-4',
};

export function Modal({ isOpen, onClose, title, children, footer, size = 'md' }: ModalProps) {
  // Close on escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-obsidian-950/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div 
        className={`
          relative w-full ${sizes[size]}
          bg-white dark:bg-obsidian-900 
          rounded-t-3xl sm:rounded-2xl
          shadow-ballot
          max-h-[90vh] overflow-hidden
          flex flex-col
          animate-scale-in
          border border-obsidian-100 dark:border-obsidian-800
        `}
      >
        {/* Gold accent line */}
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-gold-400 to-transparent" />
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-obsidian-100 dark:border-obsidian-800">
          <h2 className="font-display text-display-sm text-obsidian-900 dark:text-ivory-100">
            {title}
          </h2>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onClose} 
            className="!p-2 !min-h-0 !rounded-xl"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
        
        {/* Content */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1">
          {children}
        </div>
        
        {/* Footer */}
        {footer && (
          <div className="p-5 sm:p-6 border-t border-obsidian-100 dark:border-obsidian-800 bg-obsidian-50/50 dark:bg-obsidian-950/50">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
