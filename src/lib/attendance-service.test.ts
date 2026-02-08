/**
 * Attendance Service Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { 
  calculateAttendanceStats,
  type AttendanceChangePayload
} from './attendance-service'
import type { Attendance, Member } from '../types/v3'

// ============ Mock Data ============

const mockMembers: Member[] = [
  {
    id: 'member-1',
    org_id: 'org-1',
    name: 'Kiss Péter',
    email: 'kiss@example.com',
    weight: 10.5,
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
    weight: 20.0,
    role: 'voter',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'member-4',
    org_id: 'org-1',
    name: 'Megfigyelő',
    email: 'observer@example.com',
    weight: 5.0,
    role: 'observer',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'member-5',
    org_id: 'org-1',
    name: 'Inaktív Tag',
    email: 'inactive@example.com',
    weight: 10.0,
    role: 'voter',
    is_active: false,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
]

const createAttendance = (
  memberId: string, 
  checkedOut: boolean = false,
  weightAtCheckin?: number
): Attendance => ({
  id: `attendance-${memberId}`,
  meeting_id: 'meeting-1',
  member_id: memberId,
  checked_in_at: '2024-01-01T10:00:00Z',
  checked_out_at: checkedOut ? '2024-01-01T11:00:00Z' : undefined,
  attendance_type: 'in_person',
  weight_at_checkin: weightAtCheckin,
})

// ============ Tests ============

describe('calculateAttendanceStats', () => {
  describe('basic calculations', () => {
    it('should calculate stats with no attendance', () => {
      const stats = calculateAttendanceStats([], mockMembers)

      expect(stats.totalMembers).toBe(3) // Excludes observer and inactive
      expect(stats.presentMembers).toBe(0)
      expect(stats.presentWeight).toBe(0)
      expect(stats.totalWeight).toBe(45.5) // 10.5 + 15.0 + 20.0
      expect(stats.percentage).toBe(0)
    })

    it('should calculate stats with one member present', () => {
      const attendance = [createAttendance('member-1', false, 10.5)]
      const stats = calculateAttendanceStats(attendance, mockMembers)

      expect(stats.totalMembers).toBe(3)
      expect(stats.presentMembers).toBe(1)
      expect(stats.presentWeight).toBe(10.5)
      expect(stats.totalWeight).toBe(45.5)
      expect(stats.percentage).toBeCloseTo(23.08, 1) // 10.5 / 45.5 * 100
    })

    it('should calculate stats with multiple members present', () => {
      const attendance = [
        createAttendance('member-1', false, 10.5),
        createAttendance('member-2', false, 15.0),
      ]
      const stats = calculateAttendanceStats(attendance, mockMembers)

      expect(stats.totalMembers).toBe(3)
      expect(stats.presentMembers).toBe(2)
      expect(stats.presentWeight).toBe(25.5)
      expect(stats.totalWeight).toBe(45.5)
      expect(stats.percentage).toBeCloseTo(56.04, 1) // 25.5 / 45.5 * 100
    })

    it('should calculate stats with all members present (100%)', () => {
      const attendance = [
        createAttendance('member-1', false, 10.5),
        createAttendance('member-2', false, 15.0),
        createAttendance('member-3', false, 20.0),
      ]
      const stats = calculateAttendanceStats(attendance, mockMembers)

      expect(stats.totalMembers).toBe(3)
      expect(stats.presentMembers).toBe(3)
      expect(stats.presentWeight).toBe(45.5)
      expect(stats.totalWeight).toBe(45.5)
      expect(stats.percentage).toBe(100)
    })
  })

  describe('check-out handling', () => {
    it('should not count members who checked out', () => {
      const attendance = [
        createAttendance('member-1', false, 10.5), // Present
        createAttendance('member-2', true, 15.0),  // Checked out
      ]
      const stats = calculateAttendanceStats(attendance, mockMembers)

      expect(stats.presentMembers).toBe(1)
      expect(stats.presentWeight).toBe(10.5)
      expect(stats.percentage).toBeCloseTo(23.08, 1)
    })

    it('should handle all members checked out', () => {
      const attendance = [
        createAttendance('member-1', true, 10.5),
        createAttendance('member-2', true, 15.0),
      ]
      const stats = calculateAttendanceStats(attendance, mockMembers)

      expect(stats.presentMembers).toBe(0)
      expect(stats.presentWeight).toBe(0)
      expect(stats.percentage).toBe(0)
    })
  })

  describe('weight handling', () => {
    it('should use weight_at_checkin when available', () => {
      // Member's weight changed from 10.5 to 12.0, but checkin weight was 10.5
      const attendance = [createAttendance('member-1', false, 10.5)]
      const membersWithChangedWeight = mockMembers.map(m => 
        m.id === 'member-1' ? { ...m, weight: 12.0 } : m
      )
      
      const stats = calculateAttendanceStats(attendance, membersWithChangedWeight)

      expect(stats.presentWeight).toBe(10.5) // Uses checkin weight
    })

    it('should fall back to current member weight when weight_at_checkin is null', () => {
      const attendance = [createAttendance('member-1', false)] // No weight_at_checkin
      const stats = calculateAttendanceStats(attendance, mockMembers)

      expect(stats.presentWeight).toBe(10.5) // Uses current member weight
    })
  })

  describe('edge cases', () => {
    it('should handle empty members array', () => {
      const attendance = [createAttendance('member-1', false, 10.5)]
      const stats = calculateAttendanceStats(attendance, [])

      expect(stats.totalMembers).toBe(0)
      expect(stats.presentMembers).toBe(0)
      expect(stats.totalWeight).toBe(0)
      expect(stats.percentage).toBe(0) // Avoid division by zero
    })

    it('should exclude observers from calculations', () => {
      const attendance = [
        createAttendance('member-1', false, 10.5),
        createAttendance('member-4', false, 5.0), // Observer
      ]
      const stats = calculateAttendanceStats(attendance, mockMembers)

      // Observer should not be counted in total members or weight
      expect(stats.totalMembers).toBe(3)
      expect(stats.totalWeight).toBe(45.5)
      // But observer's attendance weight should not be in presentWeight if they're not in activeVoters
    })

    it('should exclude inactive members from calculations', () => {
      const attendance = [
        createAttendance('member-1', false, 10.5),
        createAttendance('member-5', false, 10.0), // Inactive
      ]
      const stats = calculateAttendanceStats(attendance, mockMembers)

      // Inactive member should not be counted
      expect(stats.totalMembers).toBe(3)
      expect(stats.totalWeight).toBe(45.5)
    })
  })
})

describe('AttendanceChangePayload type', () => {
  it('should correctly type check-in payload', () => {
    const payload: AttendanceChangePayload = {
      eventType: 'INSERT',
      new: createAttendance('member-1', false, 10.5),
      old: null,
    }

    expect(payload.eventType).toBe('INSERT')
    expect(payload.new).not.toBeNull()
    expect(payload.old).toBeNull()
  })

  it('should correctly type check-out payload', () => {
    const payload: AttendanceChangePayload = {
      eventType: 'UPDATE',
      new: createAttendance('member-1', true, 10.5),
      old: createAttendance('member-1', false, 10.5),
    }

    expect(payload.eventType).toBe('UPDATE')
    expect(payload.new?.checked_out_at).toBeTruthy()
    expect(payload.old?.checked_out_at).toBeFalsy()
  })
})
