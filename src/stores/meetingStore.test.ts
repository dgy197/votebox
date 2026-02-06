import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useMeetingStore } from './meetingStore'
import type { Meeting, AgendaItem } from '../types/v3'

// Mock Supabase
vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn((table) => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({ data: [], error: null })),
          single: vi.fn(() => Promise.resolve({ data: null, error: null })),
        })),
        order: vi.fn(() => Promise.resolve({ data: [], error: null })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ 
            data: table === 'meetings' 
              ? { 
                  id: 'meeting-1',
                  org_id: 'org-1',
                  title: 'Test Meeting',
                  type: 'regular',
                  status: 'draft',
                  location_type: 'hybrid',
                  quorum_type: 'majority',
                  quorum_percentage: 50,
                  quorum_reached: false,
                  recording_enabled: false,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                }
              : {
                  id: 'agenda-1',
                  meeting_id: 'meeting-1',
                  order_num: 1,
                  title: 'Test Agenda',
                  vote_type: 'yes_no_abstain',
                  is_secret: false,
                  required_majority: 'simple',
                  status: 'pending',
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
                id: 'meeting-1',
                org_id: 'org-1',
                title: 'Updated Meeting',
                type: 'regular',
                status: 'in_progress',
                location_type: 'hybrid',
                quorum_type: 'majority',
                quorum_percentage: 50,
                quorum_reached: true,
                recording_enabled: false,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              }, 
              error: null 
            })),
          })),
        })),
      })),
      upsert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ 
            data: {
              id: 'attendance-1',
              meeting_id: 'meeting-1',
              member_id: 'member-1',
              attendance_type: 'in_person',
              weight_at_checkin: 1.0,
              checked_in_at: new Date().toISOString(),
            },
            error: null 
          })),
        })),
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null })),
      })),
    })),
    rpc: vi.fn(() => Promise.resolve({
      data: [{
        total_weight: 100,
        present_weight: 60,
        quorum_percentage: 60,
        quorum_reached: true,
      }],
      error: null,
    })),
  },
}))

describe('meetingStore', () => {
  beforeEach(() => {
    useMeetingStore.getState().reset()
  })

  describe('initial state', () => {
    it('should have empty meetings and agenda items', () => {
      const state = useMeetingStore.getState()
      expect(state.meetings).toEqual([])
      expect(state.currentMeeting).toBeNull()
      expect(state.agendaItems).toEqual([])
      expect(state.attendance).toEqual([])
      expect(state.quorumResult).toBeNull()
      expect(state.loading).toBe(false)
      expect(state.error).toBeNull()
    })
  })

  describe('setCurrentMeeting', () => {
    it('should set current meeting', () => {
      const meeting: Meeting = {
        id: 'meeting-1',
        org_id: 'org-1',
        title: 'Test Meeting',
        type: 'regular',
        status: 'draft',
        location_type: 'hybrid',
        quorum_type: 'majority',
        quorum_percentage: 50,
        quorum_reached: false,
        recording_enabled: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      useMeetingStore.getState().setCurrentMeeting(meeting)
      expect(useMeetingStore.getState().currentMeeting).toEqual(meeting)
    })
  })

  describe('createMeeting', () => {
    it('should create meeting and add to list', async () => {
      const result = await useMeetingStore.getState().createMeeting({
        org_id: 'org-1',
        title: 'New Meeting',
      })

      expect(result).toBeDefined()
      expect(result?.title).toBe('Test Meeting')
      expect(useMeetingStore.getState().meetings).toHaveLength(1)
    })
  })

  describe('createAgendaItem', () => {
    it('should create agenda item and add to list', async () => {
      const result = await useMeetingStore.getState().createAgendaItem({
        meeting_id: 'meeting-1',
        order_num: 1,
        title: 'New Agenda Item',
      })

      expect(result).toBeDefined()
      expect(result?.title).toBe('Test Agenda')
      expect(useMeetingStore.getState().agendaItems).toHaveLength(1)
    })
  })

  describe('checkIn', () => {
    it('should check in member', async () => {
      const result = await useMeetingStore.getState().checkIn(
        'meeting-1',
        'member-1',
        'in_person',
        1.0
      )

      expect(result).toBe(true)
      expect(useMeetingStore.getState().attendance).toHaveLength(1)
    })
  })

  describe('calculateQuorum', () => {
    it('should calculate quorum', async () => {
      const result = await useMeetingStore.getState().calculateQuorum('meeting-1')

      expect(result).toBeDefined()
      expect(result?.quorum_reached).toBe(true)
      expect(result?.quorum_percentage).toBe(60)
    })
  })

  describe('reset', () => {
    it('should reset to initial state', () => {
      const meeting: Meeting = {
        id: 'meeting-1',
        org_id: 'org-1',
        title: 'Test Meeting',
        type: 'regular',
        status: 'draft',
        location_type: 'hybrid',
        quorum_type: 'majority',
        quorum_percentage: 50,
        quorum_reached: false,
        recording_enabled: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      useMeetingStore.setState({
        meetings: [meeting],
        currentMeeting: meeting,
        loading: true,
        error: 'Some error',
      })

      useMeetingStore.getState().reset()

      const state = useMeetingStore.getState()
      expect(state.meetings).toEqual([])
      expect(state.currentMeeting).toBeNull()
      expect(state.loading).toBe(false)
      expect(state.error).toBeNull()
    })
  })
})
