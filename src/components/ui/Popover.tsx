import { useState, useRef, useEffect, type ReactNode } from 'react'

interface PopoverProps {
  trigger: ReactNode
  children: ReactNode
  align?: 'start' | 'center' | 'end'
  open?: boolean
  onOpenChange?: (open: boolean) => void
  className?: string
}

export function Popover({ 
  trigger, 
  children, 
  align = 'start',
  open: controlledOpen,
  onOpenChange,
  className = ''
}: PopoverProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const popoverRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLDivElement>(null)

  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen
  const setIsOpen = (value: boolean) => {
    if (onOpenChange) {
      onOpenChange(value)
    } else {
      setInternalOpen(value)
    }
  }

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current && 
        !popoverRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Close on escape
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  const alignmentClasses = {
    start: 'left-0',
    center: 'left-1/2 -translate-x-1/2',
    end: 'right-0',
  }

  return (
    <div className="relative inline-block">
      <div ref={triggerRef} onClick={() => setIsOpen(!isOpen)}>
        {trigger}
      </div>
      
      {isOpen && (
        <div
          ref={popoverRef}
          className={`
            absolute z-50 mt-2 
            ${alignmentClasses[align]}
            bg-white dark:bg-obsidian-800 
            border border-obsidian-200 dark:border-obsidian-700 
            rounded-xl shadow-lg
            animate-in fade-in-0 zoom-in-95
            ${className}
          `}
        >
          {children}
        </div>
      )}
    </div>
  )
}
