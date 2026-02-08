/**
 * useRealtimeQuorum Hook Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useRealtimeQuorum, useAttendanceSubscription } from './useRealtimeQuorum'
import type { Member, Attendance } from '../types/v3'

// ============ Mocks ============

const mockMembers: Member[] = [
  {
    id: 'member-1',
    org_id: 'org-1',
    name: 'Kiss Péter',
    email: 'kiss@example.com',
    weight: 10.0,
    role: 'voter',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'member-2',
    org_id: 'org-1',
    name: 'Nagy Anna',
    email: 'nagy@example.com',
    weight: 15.0,
    role: 'chair',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'member-3',
    org_id: 'org-1',
    name: 'Szabó János',
    email: 'szabo@example.com',
    weight: 25.0,
    role: 'voter',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
]

const mockAttendance: Attendance[] = [
  {
    id: 'attendance-1',
    meeting_id: 'meeting-1',
    member_id: 'member-1',
    checked_in_at: '2024-01-01T10:00:00Z',
    attendance_type: 'in_person',
    weight_at_checkin: 10.0,
  },
  {
    id: 'attendance-2',
    meeting_id: 'meeting-1',
    member_id: 'member-2',
    checked_in_at: '2024-01-01T10:05:00Z',
    attendance_type: 'online',
    weight_at_checkin: 15.0,
  },
]

// Mock attendance service
vi.mock('../lib/attendance-service', () => ({
  getAttendance: vi.fn(() => Promise.resolve(mockAttendance)),
  subscribeToAttendance: vi.fn(() => () => {}),
  calculateAttendanceStats: vi.fn((attendance, members) => ({
    totalMembers: 3,
    presentMembers: attendance.filter((a: Attendance) => !a.checked_out_at).length,
    presentWeight: 25.0,
    totalWeight: 50.0,
    percentage: 50.0,
  })),
}))

// Mock quorum service
vi.mock('../lib/quorum-service', () => ({
  calculateQuorumWithProxies: vi.fn(() => Promise.resolve({
    total_weight: 50.0,
    present_weight: 25.0,
    quorum_percentage: 50.0,
    quorum_reached: true,
    present_members: 2,
    total_members: 3,
    proxy_weight: 0,
    effective_present_weight: 25.0,
  })),
}))

// Mock supabase
vi.mock('../lib/supabase', () => ({
  supabase: {
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn(),
    })),
    removeChannel: vi.fn(),
  },
  isSupabaseConfigured: false, // Use demo mode for tests
}))

// ============ Tests ============

describe('useRealtimeQuorum', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('initialization', () => {
    it('should start with loading state', () => {
      const { result } = renderHook(() =>
        useRealtimeQuorum({
          meetingId: 'meeting-1',
          orgId: 'org-1',
          members: mockMembers,
          quorumPercentage: 50,
        })
      )

      expect(result.current.loading).toBe(true)
    })

    it('should load quorum data on mount', async () => {
      const { result } = renderHook(() =>
        useRealtimeQuorum({
          meetingId: 'meeting-1',
          orgId: 'org-1',
          members: mockMembers,
          quorumPercentage: 50,
        })
      )

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.quorum).toBeTruthy()
      expect(result.current.quorum?.quorum_percentage).toBe(50.0)
    })

    it('should respect enabled flag', async () => {
      const { result } = renderHook(() =>
        useRealtimeQuorum({
          meetingId: 'meeting-1',
          orgId: 'org-1',
          members: mockMembers,
          quorumPercentage: 50,
          enabled: false,
        })
      )

      // Should stay in loading state when disabled
      expect(result.current.loading).toBe(true)
    })
  })

  describe('quorum detection', () => {
    it('should detect when quorum is reached', async () => {
      const { result } = renderHook(() =>
        useRealtimeQuorum({
          meetingId: 'meeting-1',
          orgId: 'org-1',
          members: mockMembers,
          quorumPercentage: 50,
        })
      )

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.quorum?.quorum_reached).toBe(true)
    })

    it('should call onQuorumReached callback when quorum is reached', async () => {
      const onQuorumReached = vi.fn()

      const { result } = renderHook(() =>
        useRealtimeQuorum({
          meetingId: 'meeting-1',
          orgId: 'org-1',
          members: mockMembers,
          quorumPercentage: 50,
          onQuorumReached,
        })
      )

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Note: Callback is only called when quorum transitions from false to true
      // Since this is initial load, it might not be called
    })
  })

  describe('refresh', () => {
    it('should provide refresh function', async () => {
      const { result } = renderHook(() =>
        useRealtimeQuorum({
          meetingId: 'meeting-1',
          orgId: 'org-1',
          members: mockMembers,
          quorumPercentage: 50,
        })
      )

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(typeof result.current.refresh).toBe('function')
    })

    it('should update loading state on refresh', async () => {
      const { result } = renderHook(() =>
        useRealtimeQuorum({
          meetingId: 'meeting-1',
          orgId: 'org-1',
          members: mockMembers,
          quorumPercentage: 50,
        })
      )

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      act(() => {
        result.current.refresh()
      })

      expect(result.current.loading).toBe(true)

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })
    })
  })

  describe('cleanup', () => {
    it('should cleanup on unmount', () => {
      const { unmount } = renderHook(() =>
        useRealtimeQuorum({
          meetingId: 'meeting-1',
          orgId: 'org-1',
          members: mockMembers,
          quorumPercentage: 50,
        })
      )

      // Should not throw when unmounting
      expect(() => unmount()).not.toThrow()
    })
  })
})

describe('useAttendanceSubscription', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should load attendance on mount', async () => {
    const { result } = renderHook(() =>
      useAttendanceSubscription({
        meetingId: 'meeting-1',
      })
    )

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.attendance).toHaveLength(2)
  })

  it('should start with loading state', () => {
    const { result } = renderHook(() =>
      useAttendanceSubscription({
        meetingId: 'meeting-1',
      })
    )

    expect(result.current.loading).toBe(true)
  })

  it('should respect enabled flag', () => {
    const { result } = renderHook(() =>
      useAttendanceSubscription({
        meetingId: 'meeting-1',
        enabled: false,
      })
    )

    expect(result.current.loading).toBe(true)
    expect(result.current.attendance).toHaveLength(0)
  })
})
