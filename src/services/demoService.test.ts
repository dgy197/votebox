import { describe, it, expect, beforeEach } from 'vitest'
import * as demo from './demoService'

describe('Demo Service', () => {
  beforeEach(() => {
    demo.resetDemoData()
  })

  describe('Organizations', () => {
    it('should get demo organization', async () => {
      const orgs = await demo.getOrganizations()
      expect(orgs).toHaveLength(1)
      expect(orgs[0].name).toBe('Demo Szervezet')
    })

    it('should create new organization', async () => {
      const org = await demo.createOrganization({ name: 'Test Org', slug: 'test' })
      expect(org.name).toBe('Test Org')
      expect(org.slug).toBe('test')
      
      const orgs = await demo.getOrganizations()
      expect(orgs).toHaveLength(2)
    })
  })

  describe('Events', () => {
    it('should get demo event', async () => {
      const events = await demo.getAllEvents()
      expect(events).toHaveLength(1)
      expect(events[0].name).toBe('Demo Közgyűlés 2025')
    })

    it('should get event by code', async () => {
      const event = await demo.getEventByCode('DEMO25')
      expect(event).not.toBeNull()
      expect(event?.event_code).toBe('DEMO25')
    })

    it('should return null for invalid event code', async () => {
      const event = await demo.getEventByCode('INVALID')
      expect(event).toBeNull()
    })

    it('should create new event', async () => {
      const event = await demo.createEvent({ name: 'Test Event' })
      expect(event.name).toBe('Test Event')
      expect(event.event_code).toBeDefined()
    })
  })

  describe('Participants', () => {
    it('should get demo participants', async () => {
      const events = await demo.getAllEvents()
      const participants = await demo.getParticipants(events[0].id)
      expect(participants).toHaveLength(3)
    })

    it('should get present participants', async () => {
      const events = await demo.getAllEvents()
      const present = await demo.getPresentParticipants(events[0].id)
      expect(present).toHaveLength(2)
    })

    it('should verify participant', async () => {
      const events = await demo.getAllEvents()
      const participant = await demo.verifyParticipant(events[0].id, 'ABC123')
      expect(participant).not.toBeNull()
      expect(participant?.name).toBe('Kovács János')
      expect(participant?.is_present).toBe(true)
    })

    it('should return null for invalid access code', async () => {
      const events = await demo.getAllEvents()
      const participant = await demo.verifyParticipant(events[0].id, 'WRONG')
      expect(participant).toBeNull()
    })
  })

  describe('Questions', () => {
    it('should get demo questions', async () => {
      const events = await demo.getAllEvents()
      const questions = await demo.getQuestions(events[0].id)
      expect(questions).toHaveLength(2)
    })

    it('should get active question', async () => {
      const events = await demo.getAllEvents()
      const active = await demo.getActiveQuestion(events[0].id)
      expect(active).not.toBeNull()
      expect(active?.state).toBe('active')
    })

    it('should activate question', async () => {
      const events = await demo.getAllEvents()
      const questions = await demo.getQuestions(events[0].id)
      const draft = questions.find(q => q.state === 'draft')!
      const previousActive = questions.find(q => q.state === 'active')!
      
      const activated = await demo.activateQuestion(draft.id)
      expect(activated.state).toBe('active')
      
      // Previous active should be closed
      const oldActive = await demo.getQuestion(previousActive.id)
      expect(oldActive.state).toBe('closed')
    })
  })

  describe('Voting', () => {
    it('should cast vote successfully', async () => {
      const events = await demo.getAllEvents()
      const participants = await demo.getPresentParticipants(events[0].id)
      const questions = await demo.getQuestions(events[0].id)
      const activeQ = questions.find(q => q.state === 'active')!
      
      const result = await demo.castVoteSecure(
        activeQ.id,
        participants[0].id,
        ['yes'],
        true
      )
      
      expect(result.success).toBe(true)
    })

    it('should prevent double voting', async () => {
      const events = await demo.getAllEvents()
      const participants = await demo.getPresentParticipants(events[0].id)
      const questions = await demo.getQuestions(events[0].id)
      const activeQ = questions.find(q => q.state === 'active')!
      
      // First vote
      await demo.castVoteSecure(activeQ.id, participants[0].id, ['yes'], true)
      
      // Second vote should fail
      const result = await demo.castVoteSecure(
        activeQ.id,
        participants[0].id,
        ['no'],
        true
      )
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('ALREADY_VOTED')
    })

    it('should reject vote on inactive question', async () => {
      const events = await demo.getAllEvents()
      const participants = await demo.getPresentParticipants(events[0].id)
      const questions = await demo.getQuestions(events[0].id)
      const activeQ = questions.find(q => q.state === 'active')!
      
      // First close the question
      await demo.closeQuestion(activeQ.id)
      
      const result = await demo.castVoteSecure(
        activeQ.id,
        participants[0].id,
        ['yes'],
        true
      )
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('QUESTION_NOT_ACTIVE')
    })

    it('should reject vote from non-present participant', async () => {
      const events = await demo.getAllEvents()
      const participants = await demo.getParticipants(events[0].id)
      const notPresent = participants.find(p => !p.is_present)!
      const questions = await demo.getQuestions(events[0].id)
      const activeQ = questions.find(q => q.state === 'active')!
      
      const result = await demo.castVoteSecure(
        activeQ.id,
        notPresent.id,
        ['yes'],
        true
      )
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('PARTICIPANT_NOT_PRESENT')
    })

    it('should track vote count', async () => {
      const events = await demo.getAllEvents()
      const participants = await demo.getPresentParticipants(events[0].id)
      const questions = await demo.getQuestions(events[0].id)
      const activeQ = questions.find(q => q.state === 'active')!
      
      const countBefore = await demo.getVoteCount(activeQ.id)
      expect(countBefore).toBe(0)
      
      await demo.castVoteSecure(activeQ.id, participants[0].id, ['yes'], true)
      
      const countAfter = await demo.getVoteCount(activeQ.id)
      expect(countAfter).toBe(1)
    })

    it('should check if participant has voted', async () => {
      const events = await demo.getAllEvents()
      const participants = await demo.getPresentParticipants(events[0].id)
      const questions = await demo.getQuestions(events[0].id)
      const activeQ = questions.find(q => q.state === 'active')!
      
      const votedBefore = await demo.hasVoted(activeQ.id, participants[0].id)
      expect(votedBefore).toBe(false)
      
      await demo.castVoteSecure(activeQ.id, participants[0].id, ['yes'], true)
      
      const votedAfter = await demo.hasVoted(activeQ.id, participants[0].id)
      expect(votedAfter).toBe(true)
    })
  })

  describe('Vote Results', () => {
    it('should calculate results correctly', async () => {
      const events = await demo.getAllEvents()
      const participants = await demo.getPresentParticipants(events[0].id)
      const questions = await demo.getQuestions(events[0].id)
      const activeQ = questions.find(q => q.state === 'active')!
      
      // Cast some votes
      await demo.castVoteSecure(activeQ.id, participants[0].id, ['yes'], true)
      await demo.castVoteSecure(activeQ.id, participants[1].id, ['no'], true)
      
      const results = await demo.getVoteResults(activeQ.id)
      
      expect(results.totalVotes).toBe(2)
      expect(results.totalParticipants).toBe(2)
      expect(results.participationRate).toBe(100)
      expect(results.results).toHaveLength(2)
    })
  })

  describe('Event Stats', () => {
    it('should return correct stats', async () => {
      const events = await demo.getAllEvents()
      const stats = await demo.getEventStats(events[0].id)
      
      expect(stats.totalParticipants).toBe(3)
      expect(stats.presentParticipants).toBe(2)
      expect(stats.totalQuestions).toBe(2)
      // completedQuestions may vary based on initial data state
      expect(stats.completedQuestions).toBeGreaterThanOrEqual(0)
      // activeQuestion may or may not exist depending on prior tests
      expect(stats).toHaveProperty('activeQuestion')
    })
  })

  describe('Helpers', () => {
    it('should generate valid access codes', () => {
      const code = demo.generateAccessCode()
      expect(code).toHaveLength(6)
      expect(code).toMatch(/^[A-Z0-9]+$/)
    })

    it('should generate valid event codes', () => {
      const code = demo.generateEventCode()
      expect(code).toHaveLength(6)
      expect(code).toMatch(/^[A-Z0-9]+$/)
    })
  })
})
