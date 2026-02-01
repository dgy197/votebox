/**
 * Real-time subscription hooks for VoteBox
 */

import { useEffect, useState, useCallback, useRef } from 'react'
import * as service from '../services'
import type { Question } from '../types'

// ============ USE QUESTION SUBSCRIPTION ============

interface UseQuestionSubscriptionOptions {
  eventId: string
  onQuestionChange?: (question: Question) => void
}

export function useQuestionSubscription({ eventId, onQuestionChange }: UseQuestionSubscriptionOptions) {
  const [activeQuestion, setActiveQuestion] = useState<Question | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  
  useEffect(() => {
    if (!eventId) return
    
    let mounted = true
    
    // Initial fetch
    const fetchActive = async () => {
      try {
        const question = await service.getActiveQuestion(eventId)
        if (mounted) {
          setActiveQuestion(question)
          setLoading(false)
        }
      } catch (err) {
        if (mounted) {
          setError(err as Error)
          setLoading(false)
        }
      }
    }
    
    fetchActive()
    
    // Subscribe to changes
    const unsubscribe = service.subscribeToQuestions(eventId, (question) => {
      if (mounted) {
        if (question.state === 'active') {
          setActiveQuestion(question)
        } else if (activeQuestion?.id === question.id) {
          setActiveQuestion(null)
        }
        onQuestionChange?.(question)
      }
    })
    
    return () => {
      mounted = false
      unsubscribe()
    }
  }, [eventId, onQuestionChange])
  
  return { activeQuestion, loading, error }
}

// ============ USE VOTE COUNT SUBSCRIPTION ============

interface UseVoteCountOptions {
  questionId: string
  enabled?: boolean
}

export function useVoteCount({ questionId, enabled = true }: UseVoteCountOptions) {
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    if (!questionId || !enabled) return
    
    let mounted = true
    
    // Initial fetch
    const fetchCount = async () => {
      try {
        const currentCount = await service.getVoteCount(questionId)
        if (mounted) {
          setCount(currentCount)
          setLoading(false)
        }
      } catch {
        if (mounted) setLoading(false)
      }
    }
    
    fetchCount()
    
    // Subscribe to changes
    const unsubscribe = service.subscribeToBallots(questionId, (newCount) => {
      if (mounted) setCount(newCount)
    })
    
    return () => {
      mounted = false
      unsubscribe()
    }
  }, [questionId, enabled])
  
  return { count, loading }
}

// ============ USE VOTE RESULTS SUBSCRIPTION ============

interface UseVoteResultsOptions {
  questionId: string
  enabled?: boolean
  pollInterval?: number // ms, for polling fallback
}

export function useVoteResults({ questionId, enabled = true, pollInterval = 2000 }: UseVoteResultsOptions) {
  const [results, setResults] = useState<service.VoteResults | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  
  const fetchResults = useCallback(async () => {
    if (!questionId) return
    
    try {
      const data = await service.getVoteResults(questionId)
      setResults(data)
      setError(null)
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }, [questionId])
  
  useEffect(() => {
    if (!questionId || !enabled) return
    
    let mounted = true
    let pollTimer: NodeJS.Timeout | null = null
    
    // Initial fetch
    fetchResults()
    
    // Subscribe to vote changes and refetch results
    const unsubscribe = service.subscribeToBallots(questionId, () => {
      if (mounted) fetchResults()
    })
    
    // Polling fallback (for demo mode or if realtime fails)
    if (pollInterval > 0) {
      pollTimer = setInterval(() => {
        if (mounted) fetchResults()
      }, pollInterval)
    }
    
    return () => {
      mounted = false
      unsubscribe()
      if (pollTimer) clearInterval(pollTimer)
    }
  }, [questionId, enabled, pollInterval, fetchResults])
  
  return { results, loading, error, refetch: fetchResults }
}

// ============ USE PARTICIPANT PRESENCE ============

interface UseParticipantPresenceOptions {
  eventId: string
  participantId?: string
  enabled?: boolean
}

interface PresenceState {
  online: string[]
  total: number
}

export function useParticipantPresence({ eventId, participantId, enabled = true }: UseParticipantPresenceOptions) {
  const [presence, setPresence] = useState<PresenceState>({ online: [], total: 0 })
  const [presentCount, setPresentCount] = useState(0)
  
  useEffect(() => {
    if (!eventId || !enabled) return
    
    let mounted = true
    
    // Initial fetch
    const fetchPresent = async () => {
      try {
        const participants = await service.getPresentParticipants(eventId)
        if (mounted) {
          setPresentCount(participants.length)
        }
      } catch {
        // Ignore errors
      }
    }
    
    fetchPresent()
    
    // Subscribe to participant changes
    const unsubscribe = service.subscribeToParticipants(eventId, (data) => {
      if (mounted) {
        if (data.event === 'UPDATE' && data.participant.is_present !== undefined) {
          fetchPresent()
        }
      }
    })
    
    // Presence tracking (if participantId provided)
    let unsubscribePresence: (() => void) | undefined
    
    if (participantId) {
      unsubscribePresence = service.subscribeToPresence(eventId, participantId, {
        onSync: (state) => {
          if (mounted) {
            const onlineIds = Object.keys(state)
            setPresence({ online: onlineIds, total: onlineIds.length })
          }
        },
        onJoin: () => {
          fetchPresent()
        },
        onLeave: () => {
          fetchPresent()
        }
      })
    }
    
    return () => {
      mounted = false
      unsubscribe()
      unsubscribePresence?.()
    }
  }, [eventId, participantId, enabled])
  
  return { presence, presentCount }
}

// ============ USE EVENT STATS ============

interface UseEventStatsOptions {
  eventId: string
  pollInterval?: number
}

export function useEventStats({ eventId, pollInterval = 5000 }: UseEventStatsOptions) {
  const [stats, setStats] = useState<service.EventStats | null>(null)
  const [loading, setLoading] = useState(true)
  
  const fetchStats = useCallback(async () => {
    if (!eventId) return
    
    try {
      const data = await service.getEventStats(eventId)
      setStats(data)
    } catch {
      // Ignore errors
    } finally {
      setLoading(false)
    }
  }, [eventId])
  
  useEffect(() => {
    if (!eventId) return
    
    let mounted = true
    let pollTimer: NodeJS.Timeout | null = null
    
    fetchStats()
    
    if (pollInterval > 0) {
      pollTimer = setInterval(() => {
        if (mounted) fetchStats()
      }, pollInterval)
    }
    
    return () => {
      mounted = false
      if (pollTimer) clearInterval(pollTimer)
    }
  }, [eventId, pollInterval, fetchStats])
  
  return { stats, loading, refetch: fetchStats }
}

// ============ USE VOTING ============

interface UseVotingOptions {
  questionId: string
  participantId: string
  isAnonymous?: boolean
}

interface VotingState {
  hasVoted: boolean
  isVoting: boolean
  error: string | null
}

export function useVoting({ questionId, participantId, isAnonymous = true }: UseVotingOptions) {
  const [state, setState] = useState<VotingState>({
    hasVoted: false,
    isVoting: false,
    error: null
  })
  
  // Check if already voted
  useEffect(() => {
    if (!questionId || !participantId) return
    
    let mounted = true
    
    const check = async () => {
      try {
        const voted = await service.hasVoted(questionId, participantId)
        if (mounted) {
          setState(prev => ({ ...prev, hasVoted: voted }))
        }
      } catch {
        // Ignore errors
      }
    }
    
    check()
    
    return () => { mounted = false }
  }, [questionId, participantId])
  
  const vote = useCallback(async (choices: string[]) => {
    if (state.hasVoted || state.isVoting) return false
    
    setState(prev => ({ ...prev, isVoting: true, error: null }))
    
    try {
      const result = await service.castVoteSecure(questionId, participantId, choices, isAnonymous)
      
      if (result.success) {
        setState(prev => ({ ...prev, hasVoted: true, isVoting: false }))
        return true
      } else {
        setState(prev => ({ ...prev, isVoting: false, error: result.error || 'Vote failed' }))
        return false
      }
    } catch (err) {
      setState(prev => ({ 
        ...prev, 
        isVoting: false, 
        error: err instanceof Error ? err.message : 'Vote failed' 
      }))
      return false
    }
  }, [questionId, participantId, isAnonymous, state.hasVoted, state.isVoting])
  
  return { ...state, vote }
}

// ============ USE CONNECTION STATUS ============

export function useConnectionStatus() {
  const [isConnected, setIsConnected] = useState<boolean | null>(null)
  const [isDemoMode, setIsDemoMode] = useState(false)
  const checkingRef = useRef(false)
  
  useEffect(() => {
    if (checkingRef.current) return
    checkingRef.current = true
    
    service.checkConnection().then(connected => {
      setIsConnected(connected)
      setIsDemoMode(service.isDemoMode())
    })
  }, [])
  
  return { isConnected, isDemoMode }
}
