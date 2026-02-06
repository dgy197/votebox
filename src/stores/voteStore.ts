import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import type { Vote, VoteValue, VoteResult, AgendaItem } from '../types/v3'
import type { RealtimeChannel } from '@supabase/supabase-js'

interface VoteState {
  // Data
  votes: Vote[]
  currentAgendaItem: AgendaItem | null
  liveResult: VoteResult | null
  hasVoted: boolean
  
  // Realtime
  realtimeChannel: RealtimeChannel | null
  
  // Loading/Error
  loading: boolean
  error: string | null
  
  // Actions
  fetchVotes: (agendaItemId: string) => Promise<void>
  submitVote: (data: SubmitVoteInput) => Promise<boolean>
  checkIfVoted: (agendaItemId: string, memberId: string) => Promise<boolean>
  calculateResult: (agendaItemId: string) => Promise<VoteResult | null>
  
  // Realtime Actions
  subscribeToVotes: (agendaItemId: string) => void
  unsubscribeFromVotes: () => void
  
  // Agenda Item Actions
  setCurrentAgendaItem: (item: AgendaItem | null) => void
  startVoting: (agendaItemId: string) => Promise<boolean>
  endVoting: (agendaItemId: string) => Promise<boolean>
  
  // Helpers
  clearError: () => void
  reset: () => void
}

export interface SubmitVoteInput {
  agenda_item_id: string
  member_id: string
  vote: VoteValue | string
  weight: number
  is_proxy?: boolean
  proxy_for_id?: string
}

const initialState = {
  votes: [],
  currentAgendaItem: null,
  liveResult: null,
  hasVoted: false,
  realtimeChannel: null,
  loading: false,
  error: null,
}

// Helper to calculate result from votes
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

export const useVoteStore = create<VoteState>((set, get) => ({
  ...initialState,

  fetchVotes: async (agendaItemId: string) => {
    set({ loading: true, error: null })
    try {
      const { data, error } = await supabase
        .from('votes')
        .select('*')
        .eq('agenda_item_id', agendaItemId)

      if (error) throw error
      set({ votes: data || [], loading: false })
    } catch (err) {
      set({ error: (err as Error).message, loading: false })
    }
  },

  submitVote: async (input: SubmitVoteInput) => {
    set({ loading: true, error: null })
    try {
      // Check if already voted
      const { data: existingVote } = await supabase
        .from('votes')
        .select('id')
        .eq('agenda_item_id', input.agenda_item_id)
        .eq('member_id', input.member_id)
        .single()

      if (existingVote) {
        set({ error: 'Already voted on this item', loading: false })
        return false
      }

      const { data, error } = await supabase
        .from('votes')
        .insert({
          agenda_item_id: input.agenda_item_id,
          member_id: input.member_id,
          vote: input.vote,
          weight: input.weight,
          is_proxy: input.is_proxy ?? false,
          proxy_for_id: input.proxy_for_id,
        })
        .select()
        .single()

      if (error) throw error

      set((state) => ({
        votes: [...state.votes, data],
        hasVoted: true,
        loading: false,
      }))

      // Recalculate live result
      const currentItem = get().currentAgendaItem
      if (currentItem) {
        const allVotes = [...get().votes, data]
        const result = calculateVoteResult(allVotes, currentItem.required_majority)
        set({ liveResult: result })
      }

      return true
    } catch (err) {
      set({ error: (err as Error).message, loading: false })
      return false
    }
  },

  checkIfVoted: async (agendaItemId: string, memberId: string) => {
    try {
      const { data, error } = await supabase
        .from('votes')
        .select('id')
        .eq('agenda_item_id', agendaItemId)
        .eq('member_id', memberId)
        .single()

      if (error && error.code !== 'PGRST116') throw error
      
      const voted = !!data
      set({ hasVoted: voted })
      return voted
    } catch (err) {
      return false
    }
  },

  calculateResult: async (agendaItemId: string) => {
    set({ loading: true, error: null })
    try {
      const { data, error } = await supabase.rpc('calculate_vote_result', {
        p_agenda_item_id: agendaItemId,
      })

      if (error) throw error

      const result = data as VoteResult | null
      set({ liveResult: result, loading: false })
      return result
    } catch (err) {
      set({ error: (err as Error).message, loading: false })
      return null
    }
  },

  subscribeToVotes: (agendaItemId: string) => {
    // Unsubscribe from any existing channel
    get().unsubscribeFromVotes()

    const channel = supabase
      .channel(`votes:${agendaItemId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'votes',
          filter: `agenda_item_id=eq.${agendaItemId}`,
        },
        (payload) => {
          const newVote = payload.new as Vote
          set((state) => {
            const votes = [...state.votes, newVote]
            const currentItem = state.currentAgendaItem
            const result = currentItem
              ? calculateVoteResult(votes, currentItem.required_majority)
              : state.liveResult

            return {
              votes,
              liveResult: result,
            }
          })
        }
      )
      .subscribe()

    set({ realtimeChannel: channel })
  },

  unsubscribeFromVotes: () => {
    const channel = get().realtimeChannel
    if (channel) {
      supabase.removeChannel(channel)
      set({ realtimeChannel: null })
    }
  },

  setCurrentAgendaItem: (item) => {
    set({ currentAgendaItem: item, hasVoted: false, liveResult: null })
    if (item) {
      // Fetch existing votes and calculate initial result
      get().fetchVotes(item.id).then(() => {
        const votes = get().votes
        const result = calculateVoteResult(votes, item.required_majority)
        set({ liveResult: result })
      })
    }
  },

  startVoting: async (agendaItemId: string) => {
    set({ loading: true, error: null })
    try {
      const { data, error } = await supabase
        .from('agenda_items')
        .update({ status: 'voting' })
        .eq('id', agendaItemId)
        .select()
        .single()

      if (error) throw error

      set({ currentAgendaItem: data, loading: false })
      get().subscribeToVotes(agendaItemId)
      return true
    } catch (err) {
      set({ error: (err as Error).message, loading: false })
      return false
    }
  },

  endVoting: async (agendaItemId: string) => {
    set({ loading: true, error: null })
    try {
      // Calculate final result
      const result = await get().calculateResult(agendaItemId)
      
      // Update agenda item with result
      const { data, error } = await supabase
        .from('agenda_items')
        .update({
          status: 'completed',
          result: result as unknown as Record<string, unknown>,
        })
        .eq('id', agendaItemId)
        .select()
        .single()

      if (error) throw error

      get().unsubscribeFromVotes()
      set({ currentAgendaItem: data, loading: false })
      return true
    } catch (err) {
      set({ error: (err as Error).message, loading: false })
      return false
    }
  },

  clearError: () => set({ error: null }),
  
  reset: () => {
    get().unsubscribeFromVotes()
    set(initialState)
  },
}))
