/**
 * QuorumTracker Component
 * Real-time quorum display with progress bar and confetti celebration
 */

import { useEffect, useState, useMemo, useCallback } from 'react'
import { 
  Users, UserCheck, UserPlus, UserMinus, 
  CheckCircle, AlertCircle, TrendingUp, Scale
} from 'lucide-react'
import { Card, Badge } from '../../ui'
import { useRealtimeQuorum, type AttendanceChange } from '../../../hooks/useRealtimeQuorum'
import type { Member } from '../../../types/v3'

// ============ Types ============

interface QuorumTrackerProps {
  meetingId: string
  orgId: string
  members: Member[]
  quorumPercentage?: number
  showDetails?: boolean
  showNotifications?: boolean
  compact?: boolean
  onQuorumReached?: () => void
  onAttendanceChange?: (change: AttendanceChange) => void
}

// ============ Confetti Component ============

interface ConfettiPiece {
  id: number
  x: number
  delay: number
  duration: number
  color: string
}

function Confetti({ active }: { active: boolean }) {
  const [pieces, setPieces] = useState<ConfettiPiece[]>([])

  useEffect(() => {
    if (!active) {
      setPieces([])
      return
    }

    const colors = [
      'bg-green-500', 'bg-blue-500', 'bg-yellow-500', 
      'bg-pink-500', 'bg-purple-500', 'bg-orange-500'
    ]

    const newPieces: ConfettiPiece[] = []
    for (let i = 0; i < 50; i++) {
      newPieces.push({
        id: i,
        x: Math.random() * 100,
        delay: Math.random() * 0.5,
        duration: 1 + Math.random() * 2,
        color: colors[Math.floor(Math.random() * colors.length)],
      })
    }
    setPieces(newPieces)

    // Clean up after animation
    const timer = setTimeout(() => {
      setPieces([])
    }, 3500)

    return () => clearTimeout(timer)
  }, [active])

  if (!active || pieces.length === 0) return null

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {pieces.map((piece) => (
        <div
          key={piece.id}
          className={`absolute w-2 h-2 rounded-full ${piece.color}`}
          style={{
            left: `${piece.x}%`,
            top: '-10px',
            animation: `confetti-fall ${piece.duration}s ease-out forwards`,
            animationDelay: `${piece.delay}s`,
          }}
        />
      ))}
      <style>{`
        @keyframes confetti-fall {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(400px) rotate(720deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  )
}

// ============ Toast Notification ============

interface ToastNotification {
  id: number
  message: string
  type: 'success' | 'info' | 'warning'
  icon: typeof UserPlus
}

function ToastContainer({ toasts, onDismiss }: { 
  toasts: ToastNotification[]
  onDismiss: (id: number) => void 
}) {
  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => {
        const Icon = toast.icon
        return (
          <div
            key={toast.id}
            className={`
              flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg
              animate-slide-in-right cursor-pointer
              ${toast.type === 'success' ? 'bg-green-500 text-white' : ''}
              ${toast.type === 'info' ? 'bg-blue-500 text-white' : ''}
              ${toast.type === 'warning' ? 'bg-orange-500 text-white' : ''}
            `}
            onClick={() => onDismiss(toast.id)}
          >
            <Icon className="w-5 h-5" />
            <span className="text-sm font-medium">{toast.message}</span>
          </div>
        )
      })}
      <style>{`
        @keyframes slide-in-right {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  )
}

// ============ Progress Ring (for compact view) ============

function ProgressRing({ 
  percentage, 
  size = 80, 
  strokeWidth = 8,
  reached 
}: { 
  percentage: number
  size?: number
  strokeWidth?: number
  reached: boolean 
}) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (Math.min(percentage, 100) / 100) * circumference

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        {/* Background circle */}
        <circle
          className="text-gray-200 dark:text-gray-700"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        {/* Progress circle */}
        <circle
          className={`transition-all duration-500 ease-out ${
            reached ? 'text-green-500' : 'text-blue-500'
          }`}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`text-lg font-bold ${
          reached ? 'text-green-600 dark:text-green-400' : 'text-gray-700 dark:text-gray-300'
        }`}>
          {percentage.toFixed(0)}%
        </span>
      </div>
    </div>
  )
}

// ============ Main Component ============

export function QuorumTracker({
  meetingId,
  orgId,
  members,
  quorumPercentage = 50,
  showDetails = true,
  showNotifications = true,
  compact = false,
  onQuorumReached,
  onAttendanceChange,
}: QuorumTrackerProps) {
  const [toasts, setToasts] = useState<ToastNotification[]>([])
  const toastIdRef = useState(() => ({ current: 0 }))[0]

  // Show toast notification
  const showToast = useCallback((
    message: string, 
    type: ToastNotification['type'], 
    icon: ToastNotification['icon']
  ) => {
    if (!showNotifications) return

    const id = ++toastIdRef.current
    setToasts(prev => [...prev, { id, message, type, icon }])

    // Auto dismiss
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 4000)
  }, [showNotifications, toastIdRef])

  const dismissToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  // Handle quorum reached
  const handleQuorumReached = useCallback(() => {
    showToast('🎉 Quorum elérve! A gyűlés megkezdhető.', 'success', CheckCircle)
    onQuorumReached?.()
  }, [showToast, onQuorumReached])

  // Handle attendance change
  const handleAttendanceChange = useCallback((change: AttendanceChange) => {
    const name = change.memberName || 'Ismeretlen tag'
    
    if (change.type === 'check_in') {
      showToast(`${name} bejelentkezett`, 'info', UserPlus)
    } else {
      showToast(`${name} távozott`, 'warning', UserMinus)
    }

    onAttendanceChange?.(change)
  }, [showToast, onAttendanceChange])

  // Use the realtime quorum hook
  const {
    quorum,
    loading,
    isConnected,
    quorumJustReached,
    lastChange,
    refresh,
  } = useRealtimeQuorum({
    meetingId,
    orgId,
    members,
    quorumPercentage,
    onQuorumReached: handleQuorumReached,
    onAttendanceChange: handleAttendanceChange,
  })

  // Derived values
  const percentage = quorum?.quorum_percentage || 0
  const reached = quorum?.quorum_reached || false
  const presentWeight = quorum?.effective_present_weight || 0
  const totalWeight = quorum?.total_weight || 0
  const presentCount = quorum?.present_members || 0
  const totalCount = quorum?.total_members || 0
  const proxyWeight = quorum?.proxy_weight || 0

  // Compact view
  if (compact) {
    return (
      <div className="relative">
        <Confetti active={quorumJustReached} />
        <div className="flex items-center gap-4">
          <ProgressRing percentage={percentage} reached={reached} />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-900 dark:text-white">
                {presentCount}/{totalCount}
              </span>
              <Badge variant={reached ? 'success' : 'secondary'} size="sm">
                {reached ? 'Quorum ✓' : 'Nincs quorum'}
              </Badge>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {presentWeight.toFixed(2)} / {totalWeight.toFixed(2)} súly
            </div>
          </div>
          {isConnected && (
            <div className="ml-auto flex items-center gap-1 text-xs text-green-500">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              Élő
            </div>
          )}
        </div>
        {showNotifications && <ToastContainer toasts={toasts} onDismiss={dismissToast} />}
      </div>
    )
  }

  // Full view
  return (
    <Card className="p-6 relative overflow-hidden">
      <Confetti active={quorumJustReached} />

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Scale className="w-5 h-5 text-blue-500" />
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Quorum státusz
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {isConnected ? (
            <div className="flex items-center gap-1 text-xs text-green-500">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              Élő
            </div>
          ) : (
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <span className="w-2 h-2 rounded-full bg-gray-400" />
              Offline
            </div>
          )}
          <button
            onClick={refresh}
            disabled={loading}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            title="Frissítés"
          >
            <TrendingUp className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Status badge */}
      <div className={`
        p-4 rounded-lg mb-4 flex items-center justify-between
        ${reached 
          ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' 
          : 'bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800'
        }
        ${quorumJustReached ? 'animate-pulse' : ''}
      `}>
        <div className="flex items-center gap-3">
          {reached ? (
            <CheckCircle className="w-8 h-8 text-green-500" />
          ) : (
            <AlertCircle className="w-8 h-8 text-orange-500" />
          )}
          <div>
            <div className={`font-bold text-lg ${
              reached ? 'text-green-700 dark:text-green-400' : 'text-orange-700 dark:text-orange-400'
            }`}>
              {reached ? 'Quorum elérve!' : 'Nincs quorum'}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {reached 
                ? 'A gyűlés határozatképes' 
                : `Még ${(quorumPercentage - percentage).toFixed(1)}% szükséges`
              }
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className={`text-3xl font-bold ${
            reached ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'
          }`}>
            {percentage.toFixed(1)}%
          </div>
          <div className="text-sm text-gray-500">
            / {quorumPercentage}% kell
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="relative h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-4">
        {/* Quorum threshold marker */}
        <div 
          className="absolute top-0 bottom-0 w-0.5 bg-gray-800 dark:bg-white z-10"
          style={{ left: `${quorumPercentage}%` }}
        />
        {/* Progress fill */}
        <div
          className={`
            h-full rounded-full transition-all duration-500 ease-out
            ${reached 
              ? 'bg-gradient-to-r from-green-400 to-green-500' 
              : 'bg-gradient-to-r from-blue-400 to-blue-500'
            }
          `}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>

      {/* Statistics */}
      {showDetails && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <Users className="w-5 h-5 mx-auto text-gray-400 mb-1" />
            <div className="text-xl font-bold text-gray-900 dark:text-white">
              {totalCount}
            </div>
            <div className="text-xs text-gray-500">Összes tag</div>
          </div>

          <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <UserCheck className="w-5 h-5 mx-auto text-green-500 mb-1" />
            <div className="text-xl font-bold text-green-600 dark:text-green-400">
              {presentCount}
            </div>
            <div className="text-xs text-green-600 dark:text-green-400">Jelen van</div>
          </div>

          <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <Scale className="w-5 h-5 mx-auto text-blue-500 mb-1" />
            <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
              {presentWeight.toFixed(2)}
            </div>
            <div className="text-xs text-blue-600 dark:text-blue-400">
              / {totalWeight.toFixed(2)} súly
            </div>
          </div>

          {proxyWeight > 0 && (
            <div className="text-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <UserPlus className="w-5 h-5 mx-auto text-purple-500 mb-1" />
              <div className="text-xl font-bold text-purple-600 dark:text-purple-400">
                +{proxyWeight.toFixed(2)}
              </div>
              <div className="text-xs text-purple-600 dark:text-purple-400">Proxy súly</div>
            </div>
          )}
        </div>
      )}

      {/* Last change indicator */}
      {lastChange && (
        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            {lastChange.type === 'check_in' ? (
              <UserPlus className="w-4 h-4 text-green-500" />
            ) : (
              <UserMinus className="w-4 h-4 text-orange-500" />
            )}
            <span>
              {lastChange.memberName || 'Valaki'} {lastChange.type === 'check_in' ? 'bejelentkezett' : 'távozott'}
            </span>
            <span className="text-xs text-gray-400">
              {lastChange.timestamp.toLocaleTimeString('hu-HU', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
        </div>
      )}

      {/* Toast notifications */}
      {showNotifications && <ToastContainer toasts={toasts} onDismiss={dismissToast} />}
    </Card>
  )
}

export default QuorumTracker
