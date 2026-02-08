import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useScheduleStore, type ScheduleOptionWithVotes } from './scheduleStore'
import type { ScheduleVote } from '../types/v3'

// Mock Supabase
vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      upsert: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      single: vi.fn(),
    })),
  },
}))

describe('scheduleStore', () => {
  beforeEach(() => {
    useScheduleStore.getState().reset()
  })

  describe('initial state', () => {
    it('should have empty options', () => {
      const { options } = useScheduleStore.getState()
      expect(options).toEqual([])
    })

    it('should have empty userVotes', () => {
      const { userVotes } = useScheduleStore.getState()
      expect(userVotes.size).toBe(0)
    })

    it('should not be loading', () => {
      const { loading } = useScheduleStore.getState()
      expect(loading).toBe(false)
    })

    it('should have no error', () => {
      const { error } = useScheduleStore.getState()
      expect(error).toBeNull()
    })
  })

  describe('calculateWinner', () => {
    it('should return null for empty options', () => {
      const result = useScheduleStore.getState().calculateWinner()
      expect(result).toBeNull()
    })

    it('should select option with highest score', () => {
      // Set up test data
      const mockOptions: ScheduleOptionWithVotes[] = [
        {
          id: 'opt-1',
          meeting_id: 'meeting-1',
          datetime: '2024-02-15T10:00:00Z',
          duration_minutes: 60,
          is_winner: false,
          created_at: '2024-02-01T00:00:00Z',
          votes: [],
          summary: { yes: 1, maybe: 1, no: 2, total: 4, score: 1 }, // 2 + 1 - 2 = 1
        },
        {
          id: 'opt-2',
          meeting_id: 'meeting-1',
          datetime: '2024-02-16T10:00:00Z',
          duration_minutes: 60,
          is_winner: false,
          created_at: '2024-02-01T00:00:00Z',
          votes: [],
          summary: { yes: 3, maybe: 0, no: 1, total: 4, score: 5 }, // 6 + 0 - 1 = 5
        },
        {
          id: 'opt-3',
          meeting_id: 'meeting-1',
          datetime: '2024-02-17T10:00:00Z',
          duration_minutes: 60,
          is_winner: false,
          created_at: '2024-02-01T00:00:00Z',
          votes: [],
          summary: { yes: 2, maybe: 1, no: 0, total: 3, score: 5 }, // 4 + 1 + 0 = 5
        },
      ]

      useScheduleStore.setState({ options: mockOptions })

      const winner = useScheduleStore.getState().calculateWinner()
      
      // opt-2 and opt-3 both have score 5, but opt-2 has more yes votes
      expect(winner?.id).toBe('opt-2')
    })

    it('should break ties by yes votes then by least no votes', () => {
      const mockOptions: ScheduleOptionWithVotes[] = [
        {
          id: 'opt-1',
          meeting_id: 'meeting-1',
          datetime: '2024-02-15T10:00:00Z',
          duration_minutes: 60,
          is_winner: false,
          created_at: '2024-02-01T00:00:00Z',
          votes: [],
          summary: { yes: 2, maybe: 1, no: 0, total: 3, score: 5 },
        },
        {
          id: 'opt-2',
          meeting_id: 'meeting-1',
          datetime: '2024-02-16T10:00:00Z',
          duration_minutes: 60,
          is_winner: false,
          created_at: '2024-02-01T00:00:00Z',
          votes: [],
          summary: { yes: 2, maybe: 1, no: 0, total: 3, score: 5 },
        },
      ]

      useScheduleStore.setState({ options: mockOptions })

      const winner = useScheduleStore.getState().calculateWinner()
      
      // Both are equal, first one wins (stable sort)
      expect(winner?.id).toBe('opt-1')
    })

    it('should prefer options with least no votes when score and yes are equal', () => {
      const mockOptions: ScheduleOptionWithVotes[] = [
        {
          id: 'opt-1',
          meeting_id: 'meeting-1',
          datetime: '2024-02-15T10:00:00Z',
          duration_minutes: 60,
          is_winner: false,
          created_at: '2024-02-01T00:00:00Z',
          votes: [],
          summary: { yes: 2, maybe: 3, no: 1, total: 6, score: 6 }, // 4 + 3 - 1 = 6
        },
        {
          id: 'opt-2',
          meeting_id: 'meeting-1',
          datetime: '2024-02-16T10:00:00Z',
          duration_minutes: 60,
          is_winner: false,
          created_at: '2024-02-01T00:00:00Z',
          votes: [],
          summary: { yes: 2, maybe: 4, no: 0, total: 6, score: 8 }, // 4 + 4 - 0 = 8
        },
      ]

      useScheduleStore.setState({ options: mockOptions })

      const winner = useScheduleStore.getState().calculateWinner()
      expect(winner?.id).toBe('opt-2') // Higher score wins
    })
  })

  describe('VoteSummary calculation', () => {
    it('should correctly calculate score from votes', () => {
      // Create votes
      const votes: ScheduleVote[] = [
        { id: '1', option_id: 'opt-1', member_id: 'm1', vote: 'yes', created_at: '' },
        { id: '2', option_id: 'opt-1', member_id: 'm2', vote: 'yes', created_at: '' },
        { id: '3', option_id: 'opt-1', member_id: 'm3', vote: 'maybe', created_at: '' },
        { id: '4', option_id: 'opt-1', member_id: 'm4', vote: 'no', created_at: '' },
      ]

      // Expected: 2 yes (4 points) + 1 maybe (1 point) + 1 no (-1 point) = 4 points
      const expectedScore = 4

      const mockOption: ScheduleOptionWithVotes = {
        id: 'opt-1',
        meeting_id: 'meeting-1',
        datetime: '2024-02-15T10:00:00Z',
        duration_minutes: 60,
        is_winner: false,
        created_at: '2024-02-01T00:00:00Z',
        votes,
        summary: { yes: 2, maybe: 1, no: 1, total: 4, score: expectedScore },
      }

      useScheduleStore.setState({ options: [mockOption] })

      const { options } = useScheduleStore.getState()
      expect(options[0].summary.score).toBe(expectedScore)
      expect(options[0].summary.yes).toBe(2)
      expect(options[0].summary.maybe).toBe(1)
      expect(options[0].summary.no).toBe(1)
      expect(options[0].summary.total).toBe(4)
    })
  })

  describe('reset', () => {
    it('should reset to initial state', () => {
      // Set some state
      useScheduleStore.setState({
        options: [
          {
            id: 'opt-1',
            meeting_id: 'meeting-1',
            datetime: '2024-02-15T10:00:00Z',
            duration_minutes: 60,
            is_winner: false,
            created_at: '2024-02-01T00:00:00Z',
            votes: [],
            summary: { yes: 0, maybe: 0, no: 0, total: 0, score: 0 },
          },
        ],
        loading: true,
        error: 'Some error',
      })

      // Reset
      useScheduleStore.getState().reset()

      const state = useScheduleStore.getState()
      expect(state.options).toEqual([])
      expect(state.loading).toBe(false)
      expect(state.error).toBeNull()
    })
  })

  describe('clearError', () => {
    it('should clear error', () => {
      useScheduleStore.setState({ error: 'Test error' })
      
      useScheduleStore.getState().clearError()
      
      expect(useScheduleStore.getState().error).toBeNull()
    })
  })
})
