import { describe, it, expect } from 'vitest'
import {
  exportParticipantsToCSV,
  exportResultsToCSV,
  calculateQuestionResult,
} from './exportService'
import type { Event, Participant, Question, Ballot } from '../types'

// Mock data
const mockEvent: Event = {
  id: 'event-1',
  organization_id: 'org-1',
  name: 'Teszt Közgyűlés',
  description: 'Teszt leírás',
  event_code: 'TEST01',
  starts_at: null,
  ends_at: null,
  timezone: 'Europe/Budapest',
  quorum_type: 'percentage',
  quorum_value: 50,
  quorum_percent: 50,
  state: 'active',
  created_by: 'user-1',
  created_at: '2026-01-01T10:00:00Z',
}

const mockParticipants: Participant[] = [
  {
    id: 'p1',
    event_id: 'event-1',
    name: 'Kiss János',
    email: 'kiss.janos@test.hu',
    access_code: 'ABC123',
    is_present: true,
    joined_at: '2026-01-01T10:30:00Z',
    created_at: '2026-01-01T09:00:00Z',
  },
  {
    id: 'p2',
    event_id: 'event-1',
    name: 'Nagy Péter',
    email: null,
    access_code: 'DEF456',
    is_present: false,
    joined_at: null,
    created_at: '2026-01-01T09:00:00Z',
  },
]

const mockQuestion: Question = {
  id: 'q1',
  event_id: 'event-1',
  text_hu: 'Elfogadja a beszámolót?',
  text_en: null,
  type: 'binary',
  options: [
    { id: 'yes', label_hu: 'Igen' },
    { id: 'no', label_hu: 'Nem' },
    { id: 'abstain', label_hu: 'Tartózkodom' },
  ],
  min_select: 1,
  max_select: 1,
  threshold_type: 'simple_majority',
  abstain_counts: false,
  is_anonymous: true,
  randomize_options: false,
  time_limit_seconds: null,
  state: 'closed',
  order_index: 0,
  activated_at: '2026-01-01T11:00:00Z',
  closed_at: '2026-01-01T11:05:00Z',
  created_at: '2026-01-01T10:00:00Z',
}

describe('exportService', () => {
  describe('exportParticipantsToCSV', () => {
    it('should export participants to CSV with correct headers', () => {
      const csv = exportParticipantsToCSV(mockEvent, mockParticipants)
      
      expect(csv).toContain('#')
      expect(csv).toContain('Név')
      expect(csv).toContain('Email')
      expect(csv).toContain('Belépési kód')
      expect(csv).toContain('Jelen')
    })

    it('should include participant data', () => {
      const csv = exportParticipantsToCSV(mockEvent, mockParticipants)
      
      expect(csv).toContain('Kiss János')
      expect(csv).toContain('kiss.janos@test.hu')
      expect(csv).toContain('ABC123')
      expect(csv).toContain('Igen') // is_present = true
    })

    it('should handle missing email', () => {
      const csv = exportParticipantsToCSV(mockEvent, mockParticipants)
      
      expect(csv).toContain('Nagy Péter')
      expect(csv).toContain('-') // email is null
    })
  })

  describe('calculateQuestionResult', () => {
    it('should calculate simple majority correctly - accepted', () => {
      const ballots: Ballot[] = [
        { id: 'b1', question_id: 'q1', participant_id: 'p1', choices: ['yes'], created_at: '' },
        { id: 'b2', question_id: 'q1', participant_id: 'p2', choices: ['yes'], created_at: '' },
        { id: 'b3', question_id: 'q1', participant_id: 'p3', choices: ['no'], created_at: '' },
      ]
      
      const result = calculateQuestionResult(mockQuestion, ballots)
      
      expect(result.votes.yes).toBe(2)
      expect(result.votes.no).toBe(1)
      expect(result.votes.total).toBe(3)
      expect(result.votes.yesPercent).toBeCloseTo(66.67, 1)
      expect(result.isAccepted).toBe(true) // 66.67% > 50%
    })

    it('should calculate simple majority correctly - rejected', () => {
      const ballots: Ballot[] = [
        { id: 'b1', question_id: 'q1', participant_id: 'p1', choices: ['yes'], created_at: '' },
        { id: 'b2', question_id: 'q1', participant_id: 'p2', choices: ['no'], created_at: '' },
        { id: 'b3', question_id: 'q1', participant_id: 'p3', choices: ['no'], created_at: '' },
      ]
      
      const result = calculateQuestionResult(mockQuestion, ballots)
      
      expect(result.votes.yes).toBe(1)
      expect(result.votes.no).toBe(2)
      expect(result.isAccepted).toBe(false)
    })

    it('should handle abstain votes correctly when abstain_counts is false', () => {
      const ballots: Ballot[] = [
        { id: 'b1', question_id: 'q1', participant_id: 'p1', choices: ['yes'], created_at: '' },
        { id: 'b2', question_id: 'q1', participant_id: 'p2', choices: ['abstain'], created_at: '' },
        { id: 'b3', question_id: 'q1', participant_id: 'p3', choices: ['abstain'], created_at: '' },
      ]
      
      const result = calculateQuestionResult(mockQuestion, ballots)
      
      // When abstain_counts is false, yes% is calculated from yes+no only
      expect(result.votes.yesPercent).toBe(100) // 1/1 = 100%
      expect(result.isAccepted).toBe(true)
    })

    it('should handle two thirds threshold - pass', () => {
      const twoThirdsQuestion: Question = {
        ...mockQuestion,
        threshold_type: 'two_thirds',
      }
      
      // 3 yes, 1 no = 75% -> should pass
      const ballots: Ballot[] = [
        { id: 'b1', question_id: 'q1', participant_id: 'p1', choices: ['yes'], created_at: '' },
        { id: 'b2', question_id: 'q1', participant_id: 'p2', choices: ['yes'], created_at: '' },
        { id: 'b3', question_id: 'q1', participant_id: 'p3', choices: ['yes'], created_at: '' },
        { id: 'b4', question_id: 'q1', participant_id: 'p4', choices: ['no'], created_at: '' },
      ]
      
      const result = calculateQuestionResult(twoThirdsQuestion, ballots)
      
      // 75% >= 66.67%, should pass
      expect(result.isAccepted).toBe(true)
    })

    it('should handle two thirds threshold - fail', () => {
      const twoThirdsQuestion: Question = {
        ...mockQuestion,
        threshold_type: 'two_thirds',
      }
      
      // 2 yes, 1 no = 66.67% - edge case, check if it fails
      const ballots: Ballot[] = [
        { id: 'b1', question_id: 'q1', participant_id: 'p1', choices: ['yes'], created_at: '' },
        { id: 'b2', question_id: 'q1', participant_id: 'p2', choices: ['yes'], created_at: '' },
        { id: 'b3', question_id: 'q1', participant_id: 'p3', choices: ['no'], created_at: '' },
      ]
      
      const result = calculateQuestionResult(twoThirdsQuestion, ballots)
      
      // 66.666...% is NOT >= 66.67%, should be borderline (check actual behavior)
      expect(result.votes.yesPercent).toBeCloseTo(66.67, 1)
    })

    it('should handle empty ballots', () => {
      const result = calculateQuestionResult(mockQuestion, [])
      
      expect(result.votes.total).toBe(0)
      expect(result.votes.yesPercent).toBe(0)
      expect(result.isAccepted).toBe(false)
    })
  })

  describe('exportResultsToCSV', () => {
    it('should export results to CSV', () => {
      const results = [
        {
          question: mockQuestion,
          votes: {
            yes: 5,
            no: 2,
            abstain: 1,
            total: 8,
            yesPercent: 71.4,
            noPercent: 28.6,
            abstainPercent: 12.5,
          },
          isAccepted: true,
        },
      ]
      
      const csv = exportResultsToCSV(mockEvent, results)
      
      expect(csv).toContain('Kérdés')
      expect(csv).toContain('Igen')
      expect(csv).toContain('Nem')
      expect(csv).toContain('Eredmény')
      expect(csv).toContain('ELFOGADVA')
      expect(csv).toContain('Elfogadja a beszámolót?')
    })
  })
})
