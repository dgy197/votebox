import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import type { ScheduleOption, ScheduleVote, ScheduleVoteValue } from '../types/v3'

// Extended types for UI
export interface ScheduleOptionWithVotes extends ScheduleOption {
  votes: ScheduleVote[]
  summary: VoteSummary
}

export interface VoteSummary {
  yes: number
  maybe: number
  no: number
  total: number
  score: number // For winner calculation: yes=2, maybe=1, no=-1
}

interface ScheduleState {
  // Data
  options: ScheduleOptionWithVotes[]
  userVotes: Map<string, ScheduleVoteValue> // optionId -> vote
  
  // Loading/Error
  loading: boolean
  error: string | null
  
  // Actions
  fetchOptions: (meetingId: string) => Promise<void>
  createOption: (meetingId: string, datetime: string, durationMinutes?: number) => Promise<ScheduleOption | null>
  deleteOption: (optionId: string) => Promise<boolean>
  vote: (optionId: string, memberId: string, voteValue: ScheduleVoteValue, comment?: string) => Promise<boolean>
  removeVote: (optionId: string, memberId: string) => Promise<boolean>
  selectWinner: (optionId: string) => Promise<boolean>
  calculateWinner: () => ScheduleOptionWithVotes | null
  
  // Helpers
  clearError: () => void
  reset: () => void
}

function calculateVoteSummary(votes: ScheduleVote[]): VoteSummary {
  const summary = { yes: 0, maybe: 0, no: 0, total: votes.length, score: 0 }
  for (const vote of votes) {
    if (vote.vote === 'yes') {
      summary.yes++
      summary.score += 2
    } else if (vote.vote === 'maybe') {
      summary.maybe++
      summary.score += 1
    } else {
      summary.no++
      summary.score -= 1
    }
  }
  return summary
}

const initialState = {
  options: [],
  userVotes: new Map<string, ScheduleVoteValue>(),
  loading: false,
  error: null,
}

export const useScheduleStore = create<ScheduleState>((set, get) => ({
  ...initialState,

  fetchOptions: async (meetingId: string) => {
    set({ loading: true, error: null })
    try {
      // Fetch options with their votes
      const { data: optionsData, error: optionsError } = await supabase
        .from('schedule_options')
        .select(`
          *,
          schedule_votes (*)
        `)
        .eq('meeting_id', meetingId)
        .order('datetime', { ascending: true })

      if (optionsError) throw optionsError

      // Transform data
      const options: ScheduleOptionWithVotes[] = (optionsData || []).map((opt) => ({
        id: opt.id,
        meeting_id: opt.meeting_id,
        datetime: opt.datetime,
        duration_minutes: opt.duration_minutes,
        is_winner: opt.is_winner,
        created_at: opt.created_at,
        votes: opt.schedule_votes || [],
        summary: calculateVoteSummary(opt.schedule_votes || []),
      }))

      // Extract current user votes
      const userVotes = new Map<string, ScheduleVoteValue>()
      // Note: In a real app, we'd filter by current user's member_id

      set({ options, userVotes, loading: false })
    } catch (err) {
      set({ error: (err as Error).message, loading: false })
    }
  },

  createOption: async (meetingId: string, datetime: string, durationMinutes = 60) => {
    set({ loading: true, error: null })
    try {
      const { data, error } = await supabase
        .from('schedule_options')
        .insert({
          meeting_id: meetingId,
          datetime,
          duration_minutes: durationMinutes,
        })
        .select()
        .single()

      if (error) throw error

      const newOption: ScheduleOptionWithVotes = {
        ...data,
        votes: [],
        summary: { yes: 0, maybe: 0, no: 0, total: 0, score: 0 },
      }

      set((state) => ({
        options: [...state.options, newOption].sort(
          (a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime()
        ),
        loading: false,
      }))

      return data
    } catch (err) {
      set({ error: (err as Error).message, loading: false })
      return null
    }
  },

  deleteOption: async (optionId: string) => {
    set({ loading: true, error: null })
    try {
      const { error } = await supabase
        .from('schedule_options')
        .delete()
        .eq('id', optionId)

      if (error) throw error

      set((state) => ({
        options: state.options.filter((o) => o.id !== optionId),
        loading: false,
      }))
      return true
    } catch (err) {
      set({ error: (err as Error).message, loading: false })
      return false
    }
  },

  vote: async (optionId: string, memberId: string, voteValue: ScheduleVoteValue, comment?: string) => {
    set({ loading: true, error: null })
    try {
      const { data, error } = await supabase
        .from('schedule_votes')
        .upsert(
          {
            option_id: optionId,
            member_id: memberId,
            vote: voteValue,
            comment,
          },
          { onConflict: 'option_id,member_id' }
        )
        .select()
        .single()

      if (error) throw error

      // Update local state
      set((state) => {
        const newOptions = state.options.map((opt) => {
          if (opt.id !== optionId) return opt

          // Update or add vote
          const existingIndex = opt.votes.findIndex((v) => v.member_id === memberId)
          let newVotes: ScheduleVote[]
          if (existingIndex >= 0) {
            newVotes = [...opt.votes]
            newVotes[existingIndex] = data
          } else {
            newVotes = [...opt.votes, data]
          }

          return {
            ...opt,
            votes: newVotes,
            summary: calculateVoteSummary(newVotes),
          }
        })

        const newUserVotes = new Map(state.userVotes)
        newUserVotes.set(optionId, voteValue)

        return { options: newOptions, userVotes: newUserVotes, loading: false }
      })

      return true
    } catch (err) {
      set({ error: (err as Error).message, loading: false })
      return false
    }
  },

  removeVote: async (optionId: string, memberId: string) => {
    set({ loading: true, error: null })
    try {
      const { error } = await supabase
        .from('schedule_votes')
        .delete()
        .eq('option_id', optionId)
        .eq('member_id', memberId)

      if (error) throw error

      set((state) => {
        const newOptions = state.options.map((opt) => {
          if (opt.id !== optionId) return opt
          const newVotes = opt.votes.filter((v) => v.member_id !== memberId)
          return {
            ...opt,
            votes: newVotes,
            summary: calculateVoteSummary(newVotes),
          }
        })

        const newUserVotes = new Map(state.userVotes)
        newUserVotes.delete(optionId)

        return { options: newOptions, userVotes: newUserVotes, loading: false }
      })

      return true
    } catch (err) {
      set({ error: (err as Error).message, loading: false })
      return false
    }
  },

  selectWinner: async (optionId: string) => {
    set({ loading: true, error: null })
    try {
      // First, clear any existing winner in this meeting
      const option = get().options.find((o) => o.id === optionId)
      if (!option) throw new Error('Option not found')

      // Clear all winners
      await supabase
        .from('schedule_options')
        .update({ is_winner: false })
        .eq('meeting_id', option.meeting_id)

      // Set the new winner
      const { error } = await supabase
        .from('schedule_options')
        .update({ is_winner: true })
        .eq('id', optionId)

      if (error) throw error

      // Update meeting status and scheduled_at
      await supabase
        .from('meetings')
        .update({ 
          status: 'scheduled',
          scheduled_at: option.datetime 
        })
        .eq('id', option.meeting_id)

      set((state) => ({
        options: state.options.map((o) => ({
          ...o,
          is_winner: o.id === optionId,
        })),
        loading: false,
      }))

      return true
    } catch (err) {
      set({ error: (err as Error).message, loading: false })
      return false
    }
  },

  calculateWinner: () => {
    const { options } = get()
    if (options.length === 0) return null

    // Algorithm: Highest score (yes=2, maybe=1, no=-1)
    // Tiebreaker: Most yes votes, then least no votes
    const sorted = [...options].sort((a, b) => {
      // First by score
      if (b.summary.score !== a.summary.score) {
        return b.summary.score - a.summary.score
      }
      // Then by yes count
      if (b.summary.yes !== a.summary.yes) {
        return b.summary.yes - a.summary.yes
      }
      // Then by least no votes
      return a.summary.no - b.summary.no
    })

    return sorted[0]
  },

  clearError: () => set({ error: null }),
  reset: () => set(initialState),
}))
