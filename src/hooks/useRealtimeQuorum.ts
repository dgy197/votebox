/**
 * useRealtimeQuorum Hook
 * Real-time quorum tracking with Supabase Realtime
 */

import { useEffect, useState, useCallback, useRef } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { 
  getAttendance, 
  subscribeToAttendance,
  calculateAttendanceStats,
  type AttendanceChangePayload
} from '../lib/attendance-service'
import { calculateQuorumWithProxies, type QuorumWithProxies } from '../lib/quorum-service'
import type { Attendance, Member } from '../types/v3'

// ============ Types ============

export interface RealtimeQuorumState {
  // Quorum data
  quorum: QuorumWithProxies | null
  attendance: Attendance[]
  
  // UI states
  loading: boolean
  error: string | null
  isConnected: boolean
  
  // Events
  lastChange: AttendanceChange | null
  quorumJustReached: boolean
}

export interface AttendanceChange {
  type: 'check_in' | 'check_out'
  memberId: string
  memberName?: string
  timestamp: Date
}

export interface UseRealtimeQuorumOptions {
  meetingId: string
  orgId: string
  members: Member[]
  quorumPercentage: number
  enabled?: boolean
  pollInterval?: number // Fallback polling interval in ms
  onQuorumReached?: () => void
  onAttendanceChange?: (change: AttendanceChange) => void
}

// ============ Hook ============

export function useRealtimeQuorum({
  meetingId,
  orgId,
  members,
  quorumPercentage,
  enabled = true,
  pollInterval = 10000,
  onQuorumReached,
  onAttendanceChange,
}: UseRealtimeQuorumOptions): RealtimeQuorumState & { refresh: () => Promise<void> } {
  
  const [state, setState] = useState<RealtimeQuorumState>({
    quorum: null,
    attendance: [],
    loading: true,
    error: null,
    isConnected: false,
    lastChange: null,
    quorumJustReached: false,
  })

  const quorumReachedRef = useRef(false)
  const previousQuorumRef = useRef<boolean | null>(null)
  const mountedRef = useRef(true)

  // Calculate quorum
  const calculateQuorum = useCallback(async (attendanceData?: Attendance[]) => {
    if (!meetingId || !orgId || members.length === 0) return

    try {
      const attendance = attendanceData || await getAttendance(meetingId)
      
      // Use the enhanced quorum calculation with proxies
      const quorum = await calculateQuorumWithProxies(
        meetingId,
        orgId,
        members,
        attendance,
        quorumPercentage
      )

      if (!mountedRef.current) return

      // Check if quorum was just reached
      const wasReached = previousQuorumRef.current
      const isNowReached = quorum.quorum_reached
      const justReached = !wasReached && isNowReached

      if (justReached && onQuorumReached) {
        onQuorumReached()
      }

      previousQuorumRef.current = isNowReached

      setState(prev => ({
        ...prev,
        quorum,
        attendance,
        loading: false,
        error: null,
        quorumJustReached: justReached,
      }))

      // Reset quorumJustReached after animation time
      if (justReached) {
        setTimeout(() => {
          if (mountedRef.current) {
            setState(prev => ({ ...prev, quorumJustReached: false }))
          }
        }, 3000)
      }

    } catch (err) {
      if (!mountedRef.current) return
      console.error('Quorum calculation error:', err)
      setState(prev => ({
        ...prev,
        loading: false,
        error: (err as Error).message,
      }))
    }
  }, [meetingId, orgId, members, quorumPercentage, onQuorumReached])

  // Handle attendance changes
  const handleAttendanceChange = useCallback((payload: AttendanceChangePayload) => {
    if (!mountedRef.current) return

    const isCheckIn = payload.eventType === 'INSERT' || 
      (payload.eventType === 'UPDATE' && payload.new && !payload.new.checked_out_at)
    
    const isCheckOut = payload.eventType === 'UPDATE' && 
      payload.new?.checked_out_at && !payload.old?.checked_out_at

    if (isCheckIn || isCheckOut) {
      const memberId = payload.new?.member_id || payload.old?.member_id || ''
      const member = members.find(m => m.id === memberId)

      const change: AttendanceChange = {
        type: isCheckIn ? 'check_in' : 'check_out',
        memberId,
        memberName: member?.name,
        timestamp: new Date(),
      }

      setState(prev => ({ ...prev, lastChange: change }))

      if (onAttendanceChange) {
        onAttendanceChange(change)
      }

      // Recalculate quorum
      calculateQuorum()
    }
  }, [members, calculateQuorum, onAttendanceChange])

  // Initial fetch and subscription
  useEffect(() => {
    if (!enabled || !meetingId) return

    mountedRef.current = true
    let unsubscribe: (() => void) | null = null
    let pollTimer: ReturnType<typeof setInterval> | null = null

    const init = async () => {
      // Initial load
      await calculateQuorum()

      if (!mountedRef.current) return

      // Set up real-time subscription
      if (isSupabaseConfigured) {
        unsubscribe = subscribeToAttendance(meetingId, handleAttendanceChange)
        setState(prev => ({ ...prev, isConnected: true }))
      } else {
        // Fallback polling for demo mode
        pollTimer = setInterval(() => {
          if (mountedRef.current) {
            calculateQuorum()
          }
        }, pollInterval)
      }
    }

    init()

    return () => {
      mountedRef.current = false
      if (unsubscribe) {
        unsubscribe()
      }
      if (pollTimer) {
        clearInterval(pollTimer)
      }
    }
  }, [enabled, meetingId, calculateQuorum, handleAttendanceChange, pollInterval])

  // Refresh function
  const refresh = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true }))
    await calculateQuorum()
  }, [calculateQuorum])

  return {
    ...state,
    refresh,
  }
}

// ============ Simple Attendance Subscription Hook ============

export interface UseAttendanceSubscriptionOptions {
  meetingId: string
  enabled?: boolean
  onCheckIn?: (memberId: string) => void
  onCheckOut?: (memberId: string) => void
}

export function useAttendanceSubscription({
  meetingId,
  enabled = true,
  onCheckIn,
  onCheckOut,
}: UseAttendanceSubscriptionOptions) {
  const [attendance, setAttendance] = useState<Attendance[]>([])
  const [loading, setLoading] = useState(true)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    if (!enabled || !meetingId) return

    let mounted = true
    let unsubscribe: (() => void) | null = null

    const init = async () => {
      try {
        const data = await getAttendance(meetingId)
        if (mounted) {
          setAttendance(data)
          setLoading(false)
        }
      } catch (err) {
        console.error('Fetch attendance error:', err)
        if (mounted) setLoading(false)
      }

      if (isSupabaseConfigured) {
        unsubscribe = subscribeToAttendance(meetingId, (payload) => {
          if (!mounted) return

          const isCheckIn = payload.eventType === 'INSERT' || 
            (payload.eventType === 'UPDATE' && payload.new && !payload.new.checked_out_at)
          
          const isCheckOut = payload.eventType === 'UPDATE' && 
            payload.new?.checked_out_at && !payload.old?.checked_out_at

          if (payload.eventType === 'INSERT' && payload.new) {
            setAttendance(prev => [...prev, payload.new!])
            onCheckIn?.(payload.new.member_id)
          } else if (payload.eventType === 'UPDATE' && payload.new) {
            setAttendance(prev => 
              prev.map(a => a.id === payload.new!.id ? payload.new! : a)
            )
            if (isCheckIn) onCheckIn?.(payload.new.member_id)
            if (isCheckOut) onCheckOut?.(payload.new.member_id)
          } else if (payload.eventType === 'DELETE' && payload.old) {
            setAttendance(prev => prev.filter(a => a.id !== payload.old!.id))
          }
        })

        if (mounted) setIsConnected(true)
      }
    }

    init()

    return () => {
      mounted = false
      if (unsubscribe) unsubscribe()
    }
  }, [enabled, meetingId, onCheckIn, onCheckOut])

  return { attendance, loading, isConnected }
}

export default useRealtimeQuorum
