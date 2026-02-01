import { useState, useEffect, useCallback } from 'react'
import { Timer, AlertTriangle } from 'lucide-react'

interface CountdownTimerProps {
  /** When the countdown started (ISO string) */
  activatedAt: string
  /** Total duration in seconds */
  durationSeconds: number
  /** Called when countdown reaches zero */
  onExpire?: () => void
  /** Size variant */
  size?: 'sm' | 'md' | 'lg'
  /** Show warning when time is low */
  warningThreshold?: number
}

export function CountdownTimer({
  activatedAt,
  durationSeconds,
  onExpire,
  size = 'md',
  warningThreshold = 30,
}: CountdownTimerProps) {
  const [remainingSeconds, setRemainingSeconds] = useState<number>(() => {
    const endTime = new Date(activatedAt).getTime() + durationSeconds * 1000
    return Math.max(0, Math.floor((endTime - Date.now()) / 1000))
  })
  
  const [hasExpired, setHasExpired] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      const endTime = new Date(activatedAt).getTime() + durationSeconds * 1000
      const remaining = Math.max(0, Math.floor((endTime - Date.now()) / 1000))
      setRemainingSeconds(remaining)
      
      if (remaining === 0 && !hasExpired) {
        setHasExpired(true)
        onExpire?.()
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [activatedAt, durationSeconds, onExpire, hasExpired])

  const formatTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    if (mins > 0) {
      return `${mins}:${secs.toString().padStart(2, '0')}`
    }
    return `${secs}`
  }, [])

  const isWarning = remainingSeconds <= warningThreshold && remainingSeconds > 0
  const isExpired = remainingSeconds === 0

  const sizeClasses = {
    sm: 'text-sm px-2 py-1',
    md: 'text-base px-3 py-1.5',
    lg: 'text-xl px-4 py-2 font-bold',
  }

  const getStatusClasses = () => {
    if (isExpired) {
      return 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
    }
    if (isWarning) {
      return 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300 animate-pulse'
    }
    return 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
  }

  return (
    <div className={`inline-flex items-center gap-2 rounded-full ${sizeClasses[size]} ${getStatusClasses()}`}>
      {isWarning && !isExpired ? (
        <AlertTriangle className={size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'} />
      ) : (
        <Timer className={size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'} />
      )}
      <span className="font-mono">
        {isExpired ? 'Lejárt' : formatTime(remainingSeconds)}
      </span>
    </div>
  )
}

// Hook for countdown logic (can be used without the UI component)
export function useCountdown(
  activatedAt: string | null,
  durationSeconds: number | null,
  onExpire?: () => void
) {
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(() => {
    if (!activatedAt || !durationSeconds) return null
    const endTime = new Date(activatedAt).getTime() + durationSeconds * 1000
    return Math.max(0, Math.floor((endTime - Date.now()) / 1000))
  })
  
  const [hasExpired, setHasExpired] = useState(false)

  useEffect(() => {
    if (!activatedAt || !durationSeconds) {
      setRemainingSeconds(null)
      setHasExpired(false)
      return
    }

    const interval = setInterval(() => {
      const endTime = new Date(activatedAt).getTime() + durationSeconds * 1000
      const remaining = Math.max(0, Math.floor((endTime - Date.now()) / 1000))
      setRemainingSeconds(remaining)
      
      if (remaining === 0 && !hasExpired) {
        setHasExpired(true)
        onExpire?.()
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [activatedAt, durationSeconds, onExpire, hasExpired])

  return {
    remainingSeconds,
    isExpired: hasExpired,
    hasTimeLimit: activatedAt !== null && durationSeconds !== null,
  }
}
