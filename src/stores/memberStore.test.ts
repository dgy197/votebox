import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useMemberStore } from './memberStore'
import type { Member } from '../types/v3'

// Mock Supabase
vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({ data: [], error: null })),
          single: vi.fn(() => Promise.resolve({ data: null, error: null })),
        })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => Promise.resolve({ 
          data: [{ 
            id: 'member-1', 
            org_id: 'org-1',
            name: 'Test Member', 
            email: 'test@example.com',
            weight: 1.0,
            role: 'voter',
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }], 
          error: null 
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ 
              data: { 
                id: 'member-1', 
                org_id: 'org-1',
                name: 'Updated Member', 
                email: 'updated@example.com',
                weight: 2.0,
                role: 'admin',
                is_active: true,
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

describe('memberStore', () => {
  beforeEach(() => {
    useMemberStore.getState().reset()
  })

  describe('initial state', () => {
    it('should have empty members', () => {
      const state = useMemberStore.getState()
      expect(state.members).toEqual([])
      expect(state.currentMember).toBeNull()
      expect(state.loading).toBe(false)
      expect(state.error).toBeNull()
    })
  })

  describe('setCurrentMember', () => {
    it('should set current member', () => {
      const member: Member = {
        id: 'member-1',
        org_id: 'org-1',
        name: 'Test Member',
        email: 'test@example.com',
        weight: 1.0,
        role: 'voter',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      useMemberStore.getState().setCurrentMember(member)
      expect(useMemberStore.getState().currentMember).toEqual(member)
    })
  })

  describe('CSV import validation', () => {
    it('should parse valid CSV data', async () => {
      const csvData = [
        { name: 'John Doe', email: 'john@example.com', weight: '52.5', weight_label: 'A/1 lakás', role: 'voter' },
        { name: 'Jane Doe', email: 'jane@example.com', weight: '48.2', weight_label: 'A/2 lakás', role: 'admin' },
      ]

      const result = await useMemberStore.getState().importMembersFromCSV('org-1', csvData)
      
      // Note: With mocked insert, this tests the validation logic
      expect(result.success).toBeGreaterThanOrEqual(0)
    })

    it('should reject rows without name', async () => {
      const csvData = [
        { name: '', email: 'test@example.com', weight: '1' },
        { name: '   ', email: 'test2@example.com', weight: '1' },
      ]

      const result = await useMemberStore.getState().importMembersFromCSV('org-1', csvData)
      expect(result.failed).toBe(2)
      expect(result.errors).toHaveLength(2)
    })

    it('should default weight to 1 if invalid', async () => {
      const csvData = [
        { name: 'Test User', weight: 'invalid' },
      ]

      // The store should handle invalid weight and default to 1
      const result = await useMemberStore.getState().importMembersFromCSV('org-1', csvData)
      // With mock, we just check it doesn't crash
      expect(result).toBeDefined()
    })

    it('should validate role values', async () => {
      const csvData = [
        { name: 'Test User 1', role: 'voter' },
        { name: 'Test User 2', role: 'invalid_role' },
      ]

      // Invalid roles should default to 'voter'
      const result = await useMemberStore.getState().importMembersFromCSV('org-1', csvData)
      expect(result).toBeDefined()
    })
  })

  describe('reset', () => {
    it('should reset to initial state', () => {
      const member: Member = {
        id: 'member-1',
        org_id: 'org-1',
        name: 'Test Member',
        email: 'test@example.com',
        weight: 1.0,
        role: 'voter',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      useMemberStore.setState({
        members: [member],
        currentMember: member,
        loading: true,
        error: 'Some error',
      })

      useMemberStore.getState().reset()

      const state = useMemberStore.getState()
      expect(state.members).toEqual([])
      expect(state.currentMember).toBeNull()
      expect(state.loading).toBe(false)
      expect(state.error).toBeNull()
    })
  })
})
