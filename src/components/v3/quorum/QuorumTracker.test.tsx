/**
 * QuorumTracker Component Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QuorumTracker } from './QuorumTracker'
import type { Member } from '../../../types/v3'

// ============ Mock Data ============

const mockMembers: Member[] = [
  {
    id: 'member-1',
    org_id: 'org-1',
    name: 'Kiss Péter',
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
    weight: 25.0,
    role: 'voter',
    is_active: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
]

// Mock the useRealtimeQuorum hook
const mockUseRealtimeQuorum = vi.fn()

vi.mock('../../../hooks/useRealtimeQuorum', () => ({
  useRealtimeQuorum: (options: any) => mockUseRealtimeQuorum(options),
}))

// ============ Tests ============

describe('QuorumTracker', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Default mock implementation
    mockUseRealtimeQuorum.mockReturnValue({
      quorum: {
        total_weight: 50.0,
        present_weight: 25.0,
        quorum_percentage: 50.0,
        quorum_reached: true,
        present_members: 2,
        total_members: 3,
        proxy_weight: 0,
        effective_present_weight: 25.0,
      },
      attendance: [],
      loading: false,
      error: null,
      isConnected: true,
      lastChange: null,
      quorumJustReached: false,
      refresh: vi.fn(),
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('basic rendering', () => {
    it('should render without crashing', () => {
      render(
        <QuorumTracker
          meetingId="meeting-1"
          orgId="org-1"
          members={mockMembers}
        />
      )

      expect(screen.getByText('Quorum státusz')).toBeInTheDocument()
    })

    it('should show quorum percentage', () => {
      render(
        <QuorumTracker
          meetingId="meeting-1"
          orgId="org-1"
          members={mockMembers}
        />
      )

      expect(screen.getByText('50.0%')).toBeInTheDocument()
    })

    it('should show quorum reached status', () => {
      render(
        <QuorumTracker
          meetingId="meeting-1"
          orgId="org-1"
          members={mockMembers}
        />
      )

      expect(screen.getByText('Quorum elérve!')).toBeInTheDocument()
      expect(screen.getByText('A gyűlés határozatképes')).toBeInTheDocument()
    })

    it('should show member counts', () => {
      render(
        <QuorumTracker
          meetingId="meeting-1"
          orgId="org-1"
          members={mockMembers}
        />
      )

      expect(screen.getByText('3')).toBeInTheDocument() // Total members
      expect(screen.getByText('2')).toBeInTheDocument() // Present members
    })
  })

  describe('quorum not reached', () => {
    beforeEach(() => {
      mockUseRealtimeQuorum.mockReturnValue({
        quorum: {
          total_weight: 50.0,
          present_weight: 10.0,
          quorum_percentage: 20.0,
          quorum_reached: false,
          present_members: 1,
          total_members: 3,
          proxy_weight: 0,
          effective_present_weight: 10.0,
        },
        attendance: [],
        loading: false,
        error: null,
        isConnected: true,
        lastChange: null,
        quorumJustReached: false,
        refresh: vi.fn(),
      })
    })

    it('should show quorum not reached status', () => {
      render(
        <QuorumTracker
          meetingId="meeting-1"
          orgId="org-1"
          members={mockMembers}
          quorumPercentage={50}
        />
      )

      expect(screen.getByText('Nincs quorum')).toBeInTheDocument()
    })

    it('should show how much more is needed', () => {
      render(
        <QuorumTracker
          meetingId="meeting-1"
          orgId="org-1"
          members={mockMembers}
          quorumPercentage={50}
        />
      )

      // 50 - 20 = 30% needed
      expect(screen.getByText(/30\.0% szükséges/)).toBeInTheDocument()
    })
  })

  describe('compact mode', () => {
    it('should render compact view', () => {
      render(
        <QuorumTracker
          meetingId="meeting-1"
          orgId="org-1"
          members={mockMembers}
          compact
        />
      )

      // Compact view should show badge
      expect(screen.getByText('Quorum ✓')).toBeInTheDocument()
      // Should show member count
      expect(screen.getByText('2/3')).toBeInTheDocument()
    })

    it('should not show detailed stats in compact mode', () => {
      render(
        <QuorumTracker
          meetingId="meeting-1"
          orgId="org-1"
          members={mockMembers}
          compact
        />
      )

      // These should not be present in compact mode
      expect(screen.queryByText('Quorum státusz')).not.toBeInTheDocument()
    })
  })

  describe('connection status', () => {
    it('should show connected indicator when connected', () => {
      render(
        <QuorumTracker
          meetingId="meeting-1"
          orgId="org-1"
          members={mockMembers}
        />
      )

      expect(screen.getByText('Élő')).toBeInTheDocument()
    })

    it('should show offline indicator when not connected', () => {
      mockUseRealtimeQuorum.mockReturnValue({
        quorum: null,
        attendance: [],
        loading: false,
        error: null,
        isConnected: false,
        lastChange: null,
        quorumJustReached: false,
        refresh: vi.fn(),
      })

      render(
        <QuorumTracker
          meetingId="meeting-1"
          orgId="org-1"
          members={mockMembers}
        />
      )

      expect(screen.getByText('Offline')).toBeInTheDocument()
    })
  })

  describe('proxy weight', () => {
    it('should show proxy weight when present', () => {
      mockUseRealtimeQuorum.mockReturnValue({
        quorum: {
          total_weight: 50.0,
          present_weight: 15.0,
          quorum_percentage: 50.0,
          quorum_reached: true,
          present_members: 1,
          total_members: 3,
          proxy_weight: 10.0,
          effective_present_weight: 25.0,
        },
        attendance: [],
        loading: false,
        error: null,
        isConnected: true,
        lastChange: null,
        quorumJustReached: false,
        refresh: vi.fn(),
      })

      render(
        <QuorumTracker
          meetingId="meeting-1"
          orgId="org-1"
          members={mockMembers}
        />
      )

      expect(screen.getByText('+10.00')).toBeInTheDocument()
      expect(screen.getByText('Proxy súly')).toBeInTheDocument()
    })

    it('should not show proxy section when proxy weight is 0', () => {
      render(
        <QuorumTracker
          meetingId="meeting-1"
          orgId="org-1"
          members={mockMembers}
        />
      )

      expect(screen.queryByText('Proxy súly')).not.toBeInTheDocument()
    })
  })

  describe('last change indicator', () => {
    it('should show last check-in', () => {
      mockUseRealtimeQuorum.mockReturnValue({
        quorum: {
          total_weight: 50.0,
          present_weight: 25.0,
          quorum_percentage: 50.0,
          quorum_reached: true,
          present_members: 2,
          total_members: 3,
          proxy_weight: 0,
          effective_present_weight: 25.0,
        },
        attendance: [],
        loading: false,
        error: null,
        isConnected: true,
        lastChange: {
          type: 'check_in',
          memberId: 'member-1',
          memberName: 'Kiss Péter',
          timestamp: new Date(),
        },
        quorumJustReached: false,
        refresh: vi.fn(),
      })

      render(
        <QuorumTracker
          meetingId="meeting-1"
          orgId="org-1"
          members={mockMembers}
        />
      )

      expect(screen.getByText(/Kiss Péter bejelentkezett/)).toBeInTheDocument()
    })

    it('should show last check-out', () => {
      mockUseRealtimeQuorum.mockReturnValue({
        quorum: {
          total_weight: 50.0,
          present_weight: 10.0,
          quorum_percentage: 20.0,
          quorum_reached: false,
          present_members: 1,
          total_members: 3,
          proxy_weight: 0,
          effective_present_weight: 10.0,
        },
        attendance: [],
        loading: false,
        error: null,
        isConnected: true,
        lastChange: {
          type: 'check_out',
          memberId: 'member-2',
          memberName: 'Nagy Anna',
          timestamp: new Date(),
        },
        quorumJustReached: false,
        refresh: vi.fn(),
      })

      render(
        <QuorumTracker
          meetingId="meeting-1"
          orgId="org-1"
          members={mockMembers}
        />
      )

      expect(screen.getByText(/Nagy Anna távozott/)).toBeInTheDocument()
    })
  })

  describe('callbacks', () => {
    it('should pass onQuorumReached callback to hook', () => {
      const onQuorumReached = vi.fn()

      render(
        <QuorumTracker
          meetingId="meeting-1"
          orgId="org-1"
          members={mockMembers}
          onQuorumReached={onQuorumReached}
        />
      )

      // Verify the hook was called with the callback
      expect(mockUseRealtimeQuorum).toHaveBeenCalledWith(
        expect.objectContaining({
          onQuorumReached: expect.any(Function),
        })
      )
    })

    it('should pass onAttendanceChange callback to hook', () => {
      const onAttendanceChange = vi.fn()

      render(
        <QuorumTracker
          meetingId="meeting-1"
          orgId="org-1"
          members={mockMembers}
          onAttendanceChange={onAttendanceChange}
        />
      )

      expect(mockUseRealtimeQuorum).toHaveBeenCalledWith(
        expect.objectContaining({
          onAttendanceChange: expect.any(Function),
        })
      )
    })
  })

  describe('details visibility', () => {
    it('should show details by default', () => {
      render(
        <QuorumTracker
          meetingId="meeting-1"
          orgId="org-1"
          members={mockMembers}
        />
      )

      expect(screen.getByText('Összes tag')).toBeInTheDocument()
      expect(screen.getByText('Jelen van')).toBeInTheDocument()
    })

    it('should hide details when showDetails is false', () => {
      render(
        <QuorumTracker
          meetingId="meeting-1"
          orgId="org-1"
          members={mockMembers}
          showDetails={false}
        />
      )

      expect(screen.queryByText('Összes tag')).not.toBeInTheDocument()
    })
  })
})
