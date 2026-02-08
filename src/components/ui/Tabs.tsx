/**
 * Tabs Component
 * Shadcn/ui styled tab navigation
 */

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

// Context for tabs state
interface TabsContextValue {
  value: string
  onValueChange: (value: string) => void
}

const TabsContext = createContext<TabsContextValue | null>(null)

function useTabs() {
  const context = useContext(TabsContext)
  if (!context) {
    throw new Error('Tabs components must be used within a Tabs provider')
  }
  return context
}

// ============ Tabs Root ============
interface TabsProps {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  children: ReactNode
  className?: string
}

export function Tabs({ 
  value: controlledValue, 
  defaultValue = '', 
  onValueChange, 
  children, 
  className = '' 
}: TabsProps) {
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue)
  
  const isControlled = controlledValue !== undefined
  const value = isControlled ? controlledValue : uncontrolledValue
  
  const handleValueChange = useCallback((newValue: string) => {
    if (!isControlled) {
      setUncontrolledValue(newValue)
    }
    onValueChange?.(newValue)
  }, [isControlled, onValueChange])

  return (
    <TabsContext.Provider value={{ value, onValueChange: handleValueChange }}>
      <div className={className}>
        {children}
      </div>
    </TabsContext.Provider>
  )
}

// ============ TabsList ============
interface TabsListProps {
  children: ReactNode
  className?: string
}

export function TabsList({ children, className = '' }: TabsListProps) {
  return (
    <div 
      role="tablist" 
      className={`
        inline-flex h-10 items-center justify-center rounded-lg 
        bg-gray-100 dark:bg-gray-800/50 p-1 
        text-gray-500 dark:text-gray-400
        ${className}
      `}
    >
      {children}
    </div>
  )
}

// ============ TabsTrigger ============
interface TabsTriggerProps {
  value: string
  children: ReactNode
  className?: string
  disabled?: boolean
  icon?: ReactNode
}

export function TabsTrigger({ 
  value, 
  children, 
  className = '',
  disabled = false,
  icon
}: TabsTriggerProps) {
  const { value: selectedValue, onValueChange } = useTabs()
  const isSelected = selectedValue === value

  return (
    <button
      role="tab"
      type="button"
      aria-selected={isSelected}
      aria-controls={`tabpanel-${value}`}
      disabled={disabled}
      onClick={() => !disabled && onValueChange(value)}
      className={`
        inline-flex items-center justify-center gap-2
        whitespace-nowrap rounded-md px-3 py-1.5
        text-sm font-medium
        ring-offset-white dark:ring-offset-gray-900
        transition-all duration-200
        focus-visible:outline-none focus-visible:ring-2 
        focus-visible:ring-blue-500 focus-visible:ring-offset-2
        disabled:pointer-events-none disabled:opacity-50
        ${isSelected
          ? 'bg-white dark:bg-gray-900 text-gray-950 dark:text-gray-50 shadow-sm'
          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800'
        }
        ${className}
      `}
    >
      {icon && <span className="w-4 h-4">{icon}</span>}
      {children}
    </button>
  )
}

// ============ TabsContent ============
interface TabsContentProps {
  value: string
  children: ReactNode
  className?: string
  forceMount?: boolean
}

export function TabsContent({ 
  value, 
  children, 
  className = '',
  forceMount = false
}: TabsContentProps) {
  const { value: selectedValue } = useTabs()
  const isSelected = selectedValue === value

  if (!isSelected && !forceMount) {
    return null
  }

  return (
    <div
      role="tabpanel"
      id={`tabpanel-${value}`}
      aria-labelledby={`tab-${value}`}
      hidden={!isSelected}
      tabIndex={0}
      className={`
        mt-2 
        ring-offset-white dark:ring-offset-gray-900
        focus-visible:outline-none focus-visible:ring-2 
        focus-visible:ring-blue-500 focus-visible:ring-offset-2
        ${isSelected ? 'animate-fade-in' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  )
}

export default Tabs
