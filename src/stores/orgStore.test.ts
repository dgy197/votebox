import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useOrgStore } from './orgStore'

// Mock Supabase
vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn(() => Promise.resolve({ data: [], error: null })),
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: null, error: null })),
        })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ 
            data: { 
              id: 'test-id', 
              name: 'Test Org', 
              type: 'company',
              settings: {},
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
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
                id: 'test-id', 
                name: 'Updated Org', 
                type: 'company',
                settings: {},
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              }, 
              error: null 
            })),
          })),
        })),
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ error: null })),
      })),
    })),
  },
}))

describe('orgStore', () => {
  beforeEach(() => {
    // Reset store state
    useOrgStore.getState().reset()
  })

  describe('initial state', () => {
    it('should have empty organizations', () => {
      const state = useOrgStore.getState()
      expect(state.organizations).toEqual([])
      expect(state.currentOrg).toBeNull()
      expect(state.loading).toBe(false)
      expect(state.error).toBeNull()
    })
  })

  describe('setCurrentOrg', () => {
    it('should set current organization', () => {
      const org = {
        id: 'test-id',
        name: 'Test Org',
        type: 'company' as const,
        settings: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      useOrgStore.getState().setCurrentOrg(org)
      expect(useOrgStore.getState().currentOrg).toEqual(org)
    })

    it('should clear current organization', () => {
      const org = {
        id: 'test-id',
        name: 'Test Org',
        type: 'company' as const,
        settings: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      useOrgStore.getState().setCurrentOrg(org)
      useOrgStore.getState().setCurrentOrg(null)
      expect(useOrgStore.getState().currentOrg).toBeNull()
    })
  })

  describe('clearError', () => {
    it('should clear error', () => {
      useOrgStore.setState({ error: 'Some error' })
      useOrgStore.getState().clearError()
      expect(useOrgStore.getState().error).toBeNull()
    })
  })

  describe('reset', () => {
    it('should reset to initial state', () => {
      const org = {
        id: 'test-id',
        name: 'Test Org',
        type: 'company' as const,
        settings: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      useOrgStore.setState({
        organizations: [org],
        currentOrg: org,
        loading: true,
        error: 'Some error',
      })

      useOrgStore.getState().reset()

      const state = useOrgStore.getState()
      expect(state.organizations).toEqual([])
      expect(state.currentOrg).toBeNull()
      expect(state.loading).toBe(false)
      expect(state.error).toBeNull()
    })
  })

  describe('createOrganization', () => {
    it('should create organization and add to list', async () => {
      const result = await useOrgStore.getState().createOrganization({
        name: 'New Org',
        type: 'company',
      })

      expect(result).toBeDefined()
      expect(result?.name).toBe('Test Org')
      expect(useOrgStore.getState().organizations).toHaveLength(1)
    })
  })
})
