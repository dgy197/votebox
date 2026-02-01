import { describe, it, expect, beforeEach } from 'vitest'
import { useAuthStore } from './authStore'
import type { User, Participant } from '../types'

const createMockUser = (overrides: Partial<User> = {}): User => ({
  id: 'user-1',
  email: 'admin@test.com',
  role: 'org_admin',
  organization_id: 'org-1',
  created_at: '2024-01-01',
  ...overrides,
})

const createMockParticipant = (overrides: Partial<Participant> = {}): Participant => ({
  id: 'p1',
  event_id: 'event-1',
  name: 'Test Voter',
  email: null,
  access_code: 'ABC123',
  is_present: true,
  joined_at: null,
  created_at: '2024-01-01',
  ...overrides,
})

describe('authStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useAuthStore.setState({
      user: null,
      isAdmin: false,
      isSuperAdmin: false,
      participant: null,
      eventId: null,
      isVoter: false,
    })
  })

  describe('setUser', () => {
    it('should set user and mark as admin', () => {
      const mockUser = createMockUser()

      useAuthStore.getState().setUser(mockUser)
      const state = useAuthStore.getState()

      expect(state.user).toEqual(mockUser)
      expect(state.isAdmin).toBe(true)
      expect(state.isSuperAdmin).toBe(false)
    })

    it('should set isSuperAdmin for super_admin role', () => {
      const mockSuperAdmin = createMockUser({ role: 'super_admin' })

      useAuthStore.getState().setUser(mockSuperAdmin)
      const state = useAuthStore.getState()

      expect(state.isAdmin).toBe(true)
      expect(state.isSuperAdmin).toBe(true)
    })

    it('should clear voter state when admin logs in', () => {
      // First set voter
      useAuthStore.setState({
        participant: createMockParticipant(),
        eventId: 'event-1',
        isVoter: true,
      })

      // Then set admin
      useAuthStore.getState().setUser(createMockUser())
      const state = useAuthStore.getState()

      expect(state.participant).toBeNull()
      expect(state.eventId).toBeNull()
      expect(state.isVoter).toBe(false)
    })

    it('should clear user when set to null', () => {
      useAuthStore.getState().setUser(createMockUser())
      useAuthStore.getState().setUser(null)
      const state = useAuthStore.getState()

      expect(state.user).toBeNull()
      expect(state.isAdmin).toBe(false)
    })
  })

  describe('setParticipant', () => {
    it('should set participant and mark as voter', () => {
      const mockParticipant = createMockParticipant()

      useAuthStore.getState().setParticipant(mockParticipant, 'event-1')
      const state = useAuthStore.getState()

      expect(state.participant).toEqual(mockParticipant)
      expect(state.eventId).toBe('event-1')
      expect(state.isVoter).toBe(true)
    })

    it('should clear admin state when voter logs in', () => {
      // First set admin
      useAuthStore.setState({
        user: createMockUser(),
        isAdmin: true,
      })

      // Then set voter
      useAuthStore.getState().setParticipant(createMockParticipant(), 'event-1')
      const state = useAuthStore.getState()

      expect(state.user).toBeNull()
      expect(state.isAdmin).toBe(false)
    })

    it('should clear voter when set to null', () => {
      useAuthStore.getState().setParticipant(createMockParticipant(), 'event-1')
      useAuthStore.getState().setParticipant(null, null)
      const state = useAuthStore.getState()

      expect(state.participant).toBeNull()
      expect(state.eventId).toBeNull()
      expect(state.isVoter).toBe(false)
    })
  })

  describe('logout', () => {
    it('should clear all auth state', () => {
      // Set up both admin and voter state
      useAuthStore.setState({
        user: createMockUser(),
        isAdmin: true,
        isSuperAdmin: true,
        participant: createMockParticipant(),
        eventId: 'event-1',
        isVoter: true,
      })

      useAuthStore.getState().logout()
      const state = useAuthStore.getState()

      expect(state.user).toBeNull()
      expect(state.isAdmin).toBe(false)
      expect(state.isSuperAdmin).toBe(false)
      expect(state.participant).toBeNull()
      expect(state.eventId).toBeNull()
      expect(state.isVoter).toBe(false)
    })
  })
})
