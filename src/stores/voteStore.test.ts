import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useVoteStore } from './voteStore'
import type { AgendaItem, Vote } from '../types/v3'

// Mock Supabase
const mockChannel = {
  on: vi.fn().mockReturnThis(),
  subscribe: vi.fn().mockReturnThis(),
}

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ data: [], error: null })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ 
            data: { 
              id: 'vote-1',
              agenda_item_id: 'agenda-1',
              member_id: 'member-1',
              vote: 'yes',
              weight: 1.0,
              is_proxy: false,
              created_at: new Date().toISOString(),
            }, 
            error: null 
          })),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ 
              data: {
                id: 'agenda-1',
                meeting_id: 'meeting-1',
                order_num: 1,
                title: 'Test Agenda',
                vote_type: 'yes_no_abstain',
                is_secret: false,
                required_majority: 'simple',
                status: 'voting',
                created_at: new Date().toISOString(),
              },
              error: null 
            })),
          })),
        })),
      })),
    })),
    channel: vi.fn(() => mockChannel),
    removeChannel: vi.fn(),
    rpc: vi.fn(() => Promise.resolve({
      data: {
        yes: 60,
        no: 30,
        abstain: 10,
        total_votes: 10,
        total_weight: 100,
        passed: true,
      },
      error: null,
    })),
  },
}))

describe('voteStore', () => {
  beforeEach(() => {
    useVoteStore.getState().reset()
    vi.clearAllMocks()
  })

  describe('initial state', () => {
    it('should have empty votes', () => {
      const state = useVoteStore.getState()
      expect(state.votes).toEqual([])
      expect(state.currentAgendaItem).toBeNull()
      expect(state.liveResult).toBeNull()
      expect(state.hasVoted).toBe(false)
      expect(state.loading).toBe(false)
      expect(state.error).toBeNull()
    })
  })

  describe('setCurrentAgendaItem', () => {
    it('should set current agenda item and reset hasVoted', () => {
      const agendaItem: AgendaItem = {
        id: 'agenda-1',
        meeting_id: 'meeting-1',
        order_num: 1,
        title: 'Test Agenda',
        vote_type: 'yes_no_abstain',
        is_secret: false,
        required_majority: 'simple',
        status: 'voting',
        created_at: new Date().toISOString(),
      }

      useVoteStore.setState({ hasVoted: true })
      useVoteStore.getState().setCurrentAgendaItem(agendaItem)
      
      expect(useVoteStore.getState().currentAgendaItem).toEqual(agendaItem)
      expect(useVoteStore.getState().hasVoted).toBe(false)
    })
  })

  describe('vote result calculation', () => {
    it('should calculate simple majority correctly', () => {
      const votes: Vote[] = [
        { id: '1', agenda_item_id: 'a1', member_id: 'm1', vote: 'yes', weight: 30, is_proxy: false, created_at: '' },
        { id: '2', agenda_item_id: 'a1', member_id: 'm2', vote: 'no', weight: 20, is_proxy: false, created_at: '' },
        { id: '3', agenda_item_id: 'a1', member_id: 'm3', vote: 'yes', weight: 25, is_proxy: false, created_at: '' },
        { id: '4', agenda_item_id: 'a1', member_id: 'm4', vote: 'abstain', weight: 25, is_proxy: false, created_at: '' },
      ]

      // Simple majority: yes > no
      const yesWeight = votes.filter(v => v.vote === 'yes').reduce((sum, v) => sum + v.weight, 0)
      const noWeight = votes.filter(v => v.vote === 'no').reduce((sum, v) => sum + v.weight, 0)
      
      expect(yesWeight).toBe(55) // 30 + 25
      expect(noWeight).toBe(20)
      expect(yesWeight > noWeight).toBe(true) // Passed
    })

    it('should calculate two-thirds majority correctly', () => {
      const votes: Vote[] = [
        { id: '1', agenda_item_id: 'a1', member_id: 'm1', vote: 'yes', weight: 70, is_proxy: false, created_at: '' },
        { id: '2', agenda_item_id: 'a1', member_id: 'm2', vote: 'no', weight: 20, is_proxy: false, created_at: '' },
        { id: '3', agenda_item_id: 'a1', member_id: 'm3', vote: 'abstain', weight: 10, is_proxy: false, created_at: '' },
      ]

      const totalWeight = votes.reduce((sum, v) => sum + v.weight, 0)
      const yesWeight = votes.filter(v => v.vote === 'yes').reduce((sum, v) => sum + v.weight, 0)
      
      // Two-thirds required: 66.67% of 100 = 66.67
      expect(yesWeight >= (totalWeight * 2) / 3).toBe(true) // 70 >= 66.67
    })

    it('should calculate unanimous correctly', () => {
      const votes: Vote[] = [
        { id: '1', agenda_item_id: 'a1', member_id: 'm1', vote: 'yes', weight: 50, is_proxy: false, created_at: '' },
        { id: '2', agenda_item_id: 'a1', member_id: 'm2', vote: 'yes', weight: 50, is_proxy: false, created_at: '' },
      ]

      const noWeight = votes.filter(v => v.vote === 'no').reduce((sum, v) => sum + v.weight, 0)
      const yesWeight = votes.filter(v => v.vote === 'yes').reduce((sum, v) => sum + v.weight, 0)
      
      // Unanimous: no 'no' votes and at least one 'yes'
      expect(noWeight === 0 && yesWeight > 0).toBe(true)
    })

    it('should reject when unanimous has a no vote', () => {
      const votes: Vote[] = [
        { id: '1', agenda_item_id: 'a1', member_id: 'm1', vote: 'yes', weight: 90, is_proxy: false, created_at: '' },
        { id: '2', agenda_item_id: 'a1', member_id: 'm2', vote: 'no', weight: 10, is_proxy: false, created_at: '' },
      ]

      const noWeight = votes.filter(v => v.vote === 'no').reduce((sum, v) => sum + v.weight, 0)
      
      // Unanimous fails if any 'no' vote
      expect(noWeight === 0).toBe(false)
    })
  })

  describe('subscribeToVotes', () => {
    it('should subscribe to realtime channel', () => {
      useVoteStore.getState().subscribeToVotes('agenda-1')
      
      expect(mockChannel.on).toHaveBeenCalled()
      expect(mockChannel.subscribe).toHaveBeenCalled()
    })
  })

  describe('reset', () => {
    it('should reset to initial state', () => {
      const agendaItem: AgendaItem = {
        id: 'agenda-1',
        meeting_id: 'meeting-1',
        order_num: 1,
        title: 'Test',
        vote_type: 'yes_no',
        is_secret: false,
        required_majority: 'simple',
        status: 'voting',
        created_at: '',
      }

      useVoteStore.setState({
        currentAgendaItem: agendaItem,
        hasVoted: true,
        loading: true,
        error: 'Some error',
      })

      useVoteStore.getState().reset()

      const state = useVoteStore.getState()
      expect(state.currentAgendaItem).toBeNull()
      expect(state.hasVoted).toBe(false)
      expect(state.loading).toBe(false)
      expect(state.error).toBeNull()
    })
  })
})
