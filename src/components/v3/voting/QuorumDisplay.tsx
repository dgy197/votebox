import { useEffect, useState, useCallback } from 'react'
import { Users, CheckCircle, AlertTriangle, Info, RefreshCw, Shield } from 'lucide-react'
import { Card } from '../../ui'
import { useMeetingStore } from '../../../stores/meetingStore'
import { calculateQuorumWithProxies, type QuorumWithProxies } from '../../../lib/quorum-service'
import type { Meeting, QuorumResult, Member, Attendance } from '../../../types/v3'

interface QuorumDisplayProps {
  meeting: Meeting
  members?: Member[]
  attendance?: Attendance[]
  compact?: boolean
  showRefresh?: boolean
  showProxyInfo?: boolean  // Show proxy weight breakdown
}

export function QuorumDisplay({ 
  meeting, 
  members = [],
  attendance = [],
  compact = false,
  showRefresh = false,
  showProxyInfo = true,
}: QuorumDisplayProps) {
  const { calculateQuorum, loading } = useMeetingStore()
  const [refreshing, setRefreshing] = useState(false)
  const [proxyQuorumResult, setProxyQuorumResult] = useState<QuorumWithProxies | null>(null)

  // Calculate quorum with proxy support
  const fetchQuorumWithProxies = useCallback(async () => {
    if (meeting.status === 'in_progress' || meeting.status === 'scheduled') {
      try {
        const result = await calculateQuorumWithProxies(
          meeting.id,
          meeting.org_id,
          members,
          attendance,
          meeting.quorum_percentage
        )
        setProxyQuorumResult(result)
      } catch (err) {
        console.error('Error calculating quorum with proxies:', err)
        // Fall back to store-based calculation
        calculateQuorum(meeting.id)
      }
    }
  }, [meeting.id, meeting.org_id, meeting.status, meeting.quorum_percentage, members, attendance])

  useEffect(() => {
    fetchQuorumWithProxies()
  }, [fetchQuorumWithProxies])

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchQuorumWithProxies()
    setRefreshing(false)
  }

  // Calculate local values if no proxy result
  const localQuorumResult = (): QuorumWithProxies | null => {
    if (proxyQuorumResult) return proxyQuorumResult

    const totalWeight = members
      .filter(m => m.is_active && m.role !== 'observer')
      .reduce((sum, m) => sum + m.weight, 0)

    const presentWeight = attendance.reduce((sum, a) => sum + (a.weight_at_checkin || 0), 0)
    
    const percentage = totalWeight > 0 ? (presentWeight / totalWeight) * 100 : 0
    const reached = percentage >= meeting.quorum_percentage

    return {
      total_weight: totalWeight,
      present_weight: presentWeight,
      quorum_percentage: percentage,
      quorum_reached: reached,
      present_members: attendance.length,
      total_members: members.filter(m => m.is_active && m.role !== 'observer').length,
      proxy_weight: 0,
      effective_present_weight: presentWeight,
    }
  }

  const result = localQuorumResult()
  if (!result) return null
  
  const hasProxyWeight = result.proxy_weight > 0

  const quorumType = {
    majority: 'Egyszerű többség',
    two_thirds: 'Kétharmados',
    unanimous: 'Egyhangú',
    custom: `${meeting.quorum_percentage}%`,
  }

  const getProgressColor = (reached: boolean, percentage: number) => {
    if (reached) return 'bg-green-500'
    if (percentage >= meeting.quorum_percentage * 0.8) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  // Compact mode for inline display
  if (compact) {
    return (
      <div className={`
        inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium
        ${result.quorum_reached 
          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
          : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
        }
      `}>
        {result.quorum_reached ? (
          <>
            <CheckCircle className="w-4 h-4" />
            <span>Határozatképes</span>
          </>
        ) : (
          <>
            <AlertTriangle className="w-4 h-4" />
            <span>Nincs quorum</span>
          </>
        )}
        <span className="text-xs opacity-75">
          ({result.quorum_percentage.toFixed(1)}%)
        </span>
      </div>
    )
  }

  // Full display
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-gold-500" />
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Határozatképesség
          </h3>
        </div>
        
        {showRefresh && (
          <button
            onClick={handleRefresh}
            disabled={refreshing || loading}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            title="Frissítés"
          >
            <RefreshCw className={`w-4 h-4 text-gray-500 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        )}
      </div>

      {/* Status badge */}
      <div className={`
        flex items-center gap-2 p-3 rounded-lg mb-4
        ${result.quorum_reached 
          ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
          : 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800'
        }
      `}>
        {result.quorum_reached ? (
          <>
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            <div>
              <div className="font-medium text-green-800 dark:text-green-300">
                Gyűlés határozatképes
              </div>
              <div className="text-sm text-green-600 dark:text-green-400">
                A szavazások érvényesen megtarthatók
              </div>
            </div>
          </>
        ) : (
          <>
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <div>
              <div className="font-medium text-amber-800 dark:text-amber-300">
                Nincs határozatképesség
              </div>
              <div className="text-sm text-amber-600 dark:text-amber-400">
                Még {(meeting.quorum_percentage - result.quorum_percentage).toFixed(1)}% hiányzik
              </div>
            </div>
          </>
        )}
      </div>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-600 dark:text-gray-400">Jelenlét</span>
          <span className="font-medium text-gray-900 dark:text-white">
            {result.quorum_percentage.toFixed(1)}%
          </span>
        </div>
        <div className="relative h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          {/* Target line */}
          <div 
            className="absolute top-0 bottom-0 w-0.5 bg-gray-400 dark:bg-gray-500 z-10"
            style={{ left: `${meeting.quorum_percentage}%` }}
          />
          
          {/* Progress */}
          <div 
            className={`h-full transition-all duration-500 ${getProgressColor(result.quorum_reached, result.quorum_percentage)}`}
            style={{ width: `${Math.min(result.quorum_percentage, 100)}%` }}
          />
        </div>
        <div 
          className="text-xs text-gray-500 dark:text-gray-400 mt-1"
          style={{ marginLeft: `${meeting.quorum_percentage}%`, transform: 'translateX(-50%)' }}
        >
          {meeting.quorum_percentage}% szükséges
        </div>
      </div>

      {/* Details */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
          <div className="text-gray-500 dark:text-gray-400 mb-1">Személyes jelenlét</div>
          <div className="text-xl font-bold text-gray-900 dark:text-white">
            {result.present_weight.toFixed(2)}
          </div>
        </div>
        <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
          <div className="text-gray-500 dark:text-gray-400 mb-1">Összes súly</div>
          <div className="text-xl font-bold text-gray-900 dark:text-white">
            {result.total_weight.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Proxy weight info */}
      {showProxyInfo && hasProxyWeight && (
        <div className="mt-4 p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span className="font-medium text-purple-800 dark:text-purple-300">
              Meghatalmazások
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-purple-600 dark:text-purple-400">Proxy súly</div>
              <div className="font-bold text-purple-800 dark:text-purple-200">
                +{result.proxy_weight.toFixed(2)}
              </div>
            </div>
            <div>
              <div className="text-purple-600 dark:text-purple-400">Effektív jelenlét</div>
              <div className="font-bold text-purple-800 dark:text-purple-200">
                {result.effective_present_weight.toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quorum type info */}
      <div className="mt-4 flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm">
        <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
        <div className="text-blue-700 dark:text-blue-300">
          <span className="font-medium">Quorum típus:</span>{' '}
          {quorumType[meeting.quorum_type]} ({meeting.quorum_percentage}%)
        </div>
      </div>

      {/* Attendance count */}
      <div className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
        {attendance.length} / {members.filter(m => m.role !== 'observer').length} tag jelen
      </div>
    </Card>
  )
}
