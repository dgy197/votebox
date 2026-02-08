/**
 * Supabase Realtime hook for vote subscriptions
 */

import { useEffect, useState, useCallback, useRef } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import type { Vote, VoteResult, AgendaItem } from '../types/v3'
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'

// ============ TYPES ============

interface UseRealtimeVotesOptions {
  agendaItemId: string
  enabled?: boolean
  onVoteReceived?: (vote: Vote) => void
  onResultUpdate?: (result: VoteResult) => void
}

interface UseRealtimeVotesReturn {
  votes: Vote[]
  result: VoteResult | null
  loading: boolean
  error: string | null
  isSubscribed: boolean
  refetch: () => Promise<void>
}

interface UseVotingStateOptions {
  agendaItem: AgendaItem
  memberId: string
  enabled?: boolean
}

interface UseVotingStateReturn {
  hasVoted: boolean
  isVoting: boolean
  votes: Vote[]
  result: VoteResult | null
  loading: boolean
  error: string | null
  submitVote: (voteValue: string, weight: number) => Promise<boolean>
  isSubscribed: boolean
}

// ============ HELPERS ============

const calculateVoteResult = (votes: Vote[], requiredMajority: string): VoteResult => {
  const yesWeight = votes.filter((v) => v.vote === 'yes').reduce((sum, v) => sum + v.weight, 0)
  const noWeight = votes.filter((v) => v.vote === 'no').reduce((sum, v) => sum + v.weight, 0)
  const abstainWeight = votes.filter((v) => v.vote === 'abstain').reduce((sum, v) => sum + v.weight, 0)
  const totalWeight = yesWeight + noWeight + abstainWeight

  let passed = false
  switch (requiredMajority) {
    case 'simple':
      passed = yesWeight > noWeight
      break
    case 'two_thirds':
      passed = yesWeight >= (totalWeight * 2) / 3
      break
    case 'unanimous':
      passed = noWeight === 0 && yesWeight > 0
      break
    default:
      passed = yesWeight > noWeight
  }

  return {
    yes: yesWeight,
    no: noWeight,
    abstain: abstainWeight,
    total_votes: votes.length,
    total_weight: totalWeight,
    passed,
  }
}

// ============ USE REALTIME VOTES HOOK ============

/**
 * Subscribe to realtime vote updates for an agenda item.
 * Automatically calculates results based on weighted votes.
 */
export function useRealtimeVotes({
  agendaItemId,
  enabled = true,
  onVoteReceived,
  onResultUpdate,
}: UseRealtimeVotesOptions): UseRealtimeVotesReturn {
  const [votes, setVotes] = useState<Vote[]>([])
  const [result, setResult] = useState<VoteResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSubscribed, setIsSubscribed] = useState(false)
  
  const channelRef = useRef<RealtimeChannel | null>(null)
  const requiredMajorityRef = useRef<string>('simple')

  // Fetch initial votes and agenda item
  const fetchVotes = useCallback(async () => {
    if (!agendaItemId || !isSupabaseConfigured) return

    setLoading(true)
    setError(null)

    try {
      // Fetch agenda item for required_majority
      const { data: agendaData, error: agendaError } = await supabase
        .from('agenda_items')
        .select('required_majority')
        .eq('id', agendaItemId)
        .single()

      if (agendaError && agendaError.code !== 'PGRST116') {
        throw agendaError
      }

      if (agendaData) {
        requiredMajorityRef.current = agendaData.required_majority
      }

      // Fetch votes
      const { data, error: votesError } = await supabase
        .from('votes')
        .select('*')
        .eq('agenda_item_id', agendaItemId)
        .order('created_at', { ascending: true })

      if (votesError) throw votesError

      const votesData = data || []
      setVotes(votesData)

      // Calculate initial result
      const calculatedResult = calculateVoteResult(votesData, requiredMajorityRef.current)
      setResult(calculatedResult)
      onResultUpdate?.(calculatedResult)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Hiba a szavazatok betöltésekor')
    } finally {
      setLoading(false)
    }
  }, [agendaItemId, onResultUpdate])

  // Subscribe to realtime updates
  useEffect(() => {
    if (!agendaItemId || !enabled || !isSupabaseConfigured) return

    // Initial fetch
    fetchVotes()

    // Set up realtime subscription
    const channel = supabase
      .channel(`votes:${agendaItemId}`)
      .on<Vote>(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'votes',
          filter: `agenda_item_id=eq.${agendaItemId}`,
        },
        (payload: RealtimePostgresChangesPayload<Vote>) => {
          const newVote = payload.new as Vote
          
          setVotes((prev) => {
            // Avoid duplicates
            if (prev.some((v) => v.id === newVote.id)) {
              return prev
            }

            const updated = [...prev, newVote]
            const newResult = calculateVoteResult(updated, requiredMajorityRef.current)
            setResult(newResult)
            onResultUpdate?.(newResult)
            
            return updated
          })

          onVoteReceived?.(newVote)
        }
      )
      .on<Vote>(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'votes',
          filter: `agenda_item_id=eq.${agendaItemId}`,
        },
        (payload: RealtimePostgresChangesPayload<Vote>) => {
          const deletedVote = payload.old as Vote
          
          setVotes((prev) => {
            const updated = prev.filter((v) => v.id !== deletedVote.id)
            const newResult = calculateVoteResult(updated, requiredMajorityRef.current)
            setResult(newResult)
            onResultUpdate?.(newResult)
            
            return updated
          })
        }
      )
      .subscribe((status) => {
        setIsSubscribed(status === 'SUBSCRIBED')
      })

    channelRef.current = channel

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
        setIsSubscribed(false)
      }
    }
  }, [agendaItemId, enabled, fetchVotes, onVoteReceived, onResultUpdate])

  return {
    votes,
    result,
    loading,
    error,
    isSubscribed,
    refetch: fetchVotes,
  }
}

// ============ USE VOTING STATE HOOK ============

/**
 * Complete voting state management with realtime updates.
 * Handles vote submission, checking if user has voted, and result tracking.
 */
export function useVotingState({
  agendaItem,
  memberId,
  enabled = true,
}: UseVotingStateOptions): UseVotingStateReturn {
  const [hasVoted, setHasVoted] = useState(false)
  const [isVoting, setIsVoting] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)

  const { 
    votes, 
    result, 
    loading, 
    error: realtimeError, 
    isSubscribed,
    refetch 
  } = useRealtimeVotes({
    agendaItemId: agendaItem.id,
    enabled,
    onVoteReceived: (vote) => {
      // Check if this vote is from the current member
      if (vote.member_id === memberId) {
        setHasVoted(true)
      }
    },
  })

  // Check if member has already voted
  useEffect(() => {
    if (!memberId || !votes.length) return

    const memberVote = votes.find((v) => v.member_id === memberId)
    setHasVoted(!!memberVote)
  }, [memberId, votes])

  // Submit vote
  const submitVote = useCallback(async (voteValue: string, weight: number): Promise<boolean> => {
    if (hasVoted || isVoting || !isSupabaseConfigured) {
      setLocalError(hasVoted ? 'Már leadtad a szavazatod.' : 'Szavazás folyamatban...')
      return false
    }

    setIsVoting(true)
    setLocalError(null)

    try {
      // Check for duplicate vote
      const { data: existingVote } = await supabase
        .from('votes')
        .select('id')
        .eq('agenda_item_id', agendaItem.id)
        .eq('member_id', memberId)
        .single()

      if (existingVote) {
        setHasVoted(true)
        setLocalError('Már szavaztál erre a napirendi pontra.')
        return false
      }

      // Insert vote
      const { error: insertError } = await supabase
        .from('votes')
        .insert({
          agenda_item_id: agendaItem.id,
          member_id: memberId,
          vote: voteValue,
          weight,
          is_proxy: false,
        })

      if (insertError) throw insertError

      setHasVoted(true)
      
      // Refetch to ensure consistency
      await refetch()
      
      return true
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Hiba a szavazat mentésekor')
      return false
    } finally {
      setIsVoting(false)
    }
  }, [agendaItem.id, memberId, hasVoted, isVoting, refetch])

  return {
    hasVoted,
    isVoting,
    votes,
    result,
    loading,
    error: localError || realtimeError,
    submitVote,
    isSubscribed,
  }
}

// ============ USE VOTE PRESENCE HOOK ============

interface UseVotePresenceOptions {
  agendaItemId: string
  memberId: string
  enabled?: boolean
}

interface VotePresence {
  online_at: string
  member_id: string
}

/**
 * Track presence of voters in real-time.
 * Useful for showing who is currently viewing the voting screen.
 */
export function useVotePresence({
  agendaItemId,
  memberId,
  enabled = true,
}: UseVotePresenceOptions) {
  const [onlineMembers, setOnlineMembers] = useState<string[]>([])
  const [onlineCount, setOnlineCount] = useState(0)
  const channelRef = useRef<RealtimeChannel | null>(null)

  useEffect(() => {
    if (!agendaItemId || !memberId || !enabled || !isSupabaseConfigured) return

    const channel = supabase.channel(`voting-presence:${agendaItemId}`, {
      config: {
        presence: {
          key: memberId,
        },
      },
    })

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState<VotePresence>()
        const members = Object.keys(state)
        setOnlineMembers(members)
        setOnlineCount(members.length)
      })
      .on('presence', { event: 'join' }, ({ key }) => {
        setOnlineMembers((prev) => [...new Set([...prev, key])])
        setOnlineCount((prev) => prev + 1)
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
        setOnlineMembers((prev) => prev.filter((m) => m !== key))
        setOnlineCount((prev) => Math.max(0, prev - 1))
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            member_id: memberId,
            online_at: new Date().toISOString(),
          })
        }
      })

    channelRef.current = channel

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [agendaItemId, memberId, enabled])

  return {
    onlineMembers,
    onlineCount,
  }
}
