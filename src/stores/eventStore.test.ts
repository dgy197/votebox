import { describe, it, expect, beforeEach } from 'vitest'
import { useEventStore } from './eventStore'
import type { Event, Participant, Question } from '../types'

const mockEvent: Event = {
  id: 'event-1',
  organization_id: 'org-1',
  name: 'Test Event',
  description: 'Test description',
  event_code: 'TEST01',
  starts_at: null,
  ends_at: null,
  timezone: 'Europe/Budapest',
  quorum_type: 'percentage',
  quorum_value: 50,
  quorum_percent: 50,
  state: 'draft',
  created_by: 'user-1',
  created_at: '2024-01-01',
}

const mockParticipant: Participant = {
  id: 'p1',
  event_id: 'event-1',
  name: 'Test Participant',
  email: 'test@test.com',
  access_code: 'ABC123',
  is_present: false,
  joined_at: null,
  created_at: '2024-01-01',
}

const mockQuestion: Question = {
  id: 'q1',
  event_id: 'event-1',
  text_hu: 'Test question?',
  text_en: null,
  type: 'binary',
  options: [],
  min_select: 1,
  max_select: 1,
  threshold_type: 'simple_majority',
  abstain_counts: false,
  is_anonymous: true,
  randomize_options: false,
  time_limit_seconds: null,
  state: 'draft',
  order_index: 0,
  activated_at: null,
  closed_at: null,
  created_at: '2024-01-01',
}

describe('eventStore', () => {
  beforeEach(() => {
    useEventStore.getState().reset()
  })

  describe('events', () => {
    it('should set events', () => {
      useEventStore.getState().setEvents([mockEvent])
      expect(useEventStore.getState().events).toHaveLength(1)
      expect(useEventStore.getState().events[0]).toEqual(mockEvent)
    })

    it('should add event', () => {
      useEventStore.getState().addEvent(mockEvent)
      expect(useEventStore.getState().events).toHaveLength(1)
    })

    it('should add event at the beginning', () => {
      const event2 = { ...mockEvent, id: 'event-2', name: 'Second Event' }
      useEventStore.getState().setEvents([mockEvent])
      useEventStore.getState().addEvent(event2)
      
      expect(useEventStore.getState().events[0].id).toBe('event-2')
    })

    it('should update event', () => {
      useEventStore.getState().setEvents([mockEvent])
      useEventStore.getState().updateEvent('event-1', { name: 'Updated Name' })
      
      expect(useEventStore.getState().events[0].name).toBe('Updated Name')
    })

    it('should update currentEvent when updating matching event', () => {
      useEventStore.getState().setEvents([mockEvent])
      useEventStore.getState().setCurrentEvent(mockEvent)
      useEventStore.getState().updateEvent('event-1', { state: 'active' })
      
      expect(useEventStore.getState().currentEvent?.state).toBe('active')
    })

    it('should remove event', () => {
      useEventStore.getState().setEvents([mockEvent])
      useEventStore.getState().removeEvent('event-1')
      
      expect(useEventStore.getState().events).toHaveLength(0)
    })

    it('should clear currentEvent when removing matching event', () => {
      useEventStore.getState().setEvents([mockEvent])
      useEventStore.getState().setCurrentEvent(mockEvent)
      useEventStore.getState().removeEvent('event-1')
      
      expect(useEventStore.getState().currentEvent).toBeNull()
    })
  })

  describe('participants', () => {
    it('should set participants', () => {
      useEventStore.getState().setParticipants([mockParticipant])
      expect(useEventStore.getState().participants).toHaveLength(1)
    })

    it('should add participant', () => {
      useEventStore.getState().addParticipant(mockParticipant)
      expect(useEventStore.getState().participants).toHaveLength(1)
    })

    it('should update participant', () => {
      useEventStore.getState().setParticipants([mockParticipant])
      useEventStore.getState().updateParticipant('p1', { is_present: true })
      
      expect(useEventStore.getState().participants[0].is_present).toBe(true)
    })

    it('should remove participant', () => {
      useEventStore.getState().setParticipants([mockParticipant])
      useEventStore.getState().removeParticipant('p1')
      
      expect(useEventStore.getState().participants).toHaveLength(0)
    })
  })

  describe('questions', () => {
    it('should set questions', () => {
      useEventStore.getState().setQuestions([mockQuestion])
      expect(useEventStore.getState().questions).toHaveLength(1)
    })

    it('should add question', () => {
      useEventStore.getState().addQuestion(mockQuestion)
      expect(useEventStore.getState().questions).toHaveLength(1)
    })

    it('should update question', () => {
      useEventStore.getState().setQuestions([mockQuestion])
      useEventStore.getState().updateQuestion('q1', { state: 'active' })
      
      expect(useEventStore.getState().questions[0].state).toBe('active')
    })

    it('should update activeQuestion when updating matching question', () => {
      useEventStore.getState().setQuestions([mockQuestion])
      useEventStore.getState().setActiveQuestion(mockQuestion)
      useEventStore.getState().updateQuestion('q1', { text_hu: 'Updated question?' })
      
      expect(useEventStore.getState().activeQuestion?.text_hu).toBe('Updated question?')
    })

    it('should remove question', () => {
      useEventStore.getState().setQuestions([mockQuestion])
      useEventStore.getState().removeQuestion('q1')
      
      expect(useEventStore.getState().questions).toHaveLength(0)
    })

    it('should clear activeQuestion when removing matching question', () => {
      useEventStore.getState().setQuestions([mockQuestion])
      useEventStore.getState().setActiveQuestion(mockQuestion)
      useEventStore.getState().removeQuestion('q1')
      
      expect(useEventStore.getState().activeQuestion).toBeNull()
    })

    it('should set active question', () => {
      useEventStore.getState().setActiveQuestion(mockQuestion)
      expect(useEventStore.getState().activeQuestion).toEqual(mockQuestion)
    })
  })

  describe('loading', () => {
    it('should set loading state', () => {
      useEventStore.getState().setLoading(true)
      expect(useEventStore.getState().loading).toBe(true)
      
      useEventStore.getState().setLoading(false)
      expect(useEventStore.getState().loading).toBe(false)
    })
  })

  describe('reset', () => {
    it('should reset all state to initial values', () => {
      // Set up some state
      useEventStore.getState().setEvents([mockEvent])
      useEventStore.getState().setCurrentEvent(mockEvent)
      useEventStore.getState().setParticipants([mockParticipant])
      useEventStore.getState().setQuestions([mockQuestion])
      useEventStore.getState().setLoading(true)
      
      // Reset
      useEventStore.getState().reset()
      const state = useEventStore.getState()
      
      expect(state.events).toHaveLength(0)
      expect(state.currentEvent).toBeNull()
      expect(state.participants).toHaveLength(0)
      expect(state.questions).toHaveLength(0)
      expect(state.activeQuestion).toBeNull()
      expect(state.loading).toBe(false)
    })
  })
})
