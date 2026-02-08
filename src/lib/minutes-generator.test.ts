import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { 
  Organization, 
  Meeting, 
  Member, 
  Attendance,
  AgendaItem,
  Vote 
} from '../types/v3'

// Mock Supabase before imports
vi.mock('./supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}))

// Import after mocking
import { generateMinutes } from './minutes-generator'
import { supabase } from './supabase'

// Test data factory
const createTestOrganization = (overrides?: Partial<Organization>): Organization => ({
  id: 'org-1',
  name: 'Teszt Társasház',
  type: 'condominium',
  settings: {},
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  ...overrides,
})

const createTestMeeting = (overrides?: Partial<Meeting>): Meeting => ({
  id: 'meeting-1',
  org_id: 'org-1',
  title: 'Éves közgyűlés',
  type: 'regular',
  status: 'completed',
  scheduled_at: '2024-06-15T10:00:00Z',
  ended_at: '2024-06-15T12:30:00Z',
  location: 'Budapest, Teszt utca 1.',
  location_type: 'in_person',
  quorum_type: 'majority',
  quorum_percentage: 50,
  quorum_reached: true,
  recording_enabled: false,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-06-15T12:30:00Z',
  ...overrides,
})

const createTestMember = (overrides?: Partial<Member>): Member => ({
  id: 'member-1',
  org_id: 'org-1',
  name: 'Teszt Elek',
  weight: 1,
  role: 'voter',
  is_active: true,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  ...overrides,
})

const createTestAttendance = (memberId: string, overrides?: Partial<Attendance>): Attendance => ({
  id: `attendance-${memberId}`,
  meeting_id: 'meeting-1',
  member_id: memberId,
  checked_in_at: '2024-06-15T09:55:00Z',
  attendance_type: 'in_person',
  ...overrides,
})

const createTestAgendaItem = (orderNum: number, overrides?: Partial<AgendaItem>): AgendaItem => ({
  id: `agenda-${orderNum}`,
  meeting_id: 'meeting-1',
  order_num: orderNum,
  title: `${orderNum}. napirendi pont`,
  vote_type: 'yes_no_abstain',
  is_secret: false,
  required_majority: 'simple',
  status: 'completed',
  created_at: '2024-01-01T00:00:00Z',
  ...overrides,
})

const createTestVote = (agendaItemId: string, memberId: string, vote: string, overrides?: Partial<Vote>): Vote => ({
  id: `vote-${agendaItemId}-${memberId}`,
  agenda_item_id: agendaItemId,
  member_id: memberId,
  vote,
  weight: 1,
  is_proxy: false,
  created_at: '2024-06-15T10:30:00Z',
  ...overrides,
})

describe('minutes-generator', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('generateMinutes', () => {
    it('should generate minutes with correct structure', async () => {
      const org = createTestOrganization()
      const meeting = createTestMeeting()
      const members = [
        createTestMember({ id: 'm1', name: 'Kiss Péter', weight: 10 }),
        createTestMember({ id: 'm2', name: 'Nagy Anna', weight: 15 }),
        createTestMember({ id: 'm3', name: 'Szabó János', weight: 8 }),
      ]
      const agendaItems = [
        createTestAgendaItem(1, { title: 'Költségvetés elfogadása', description: 'A 2024. évi költségvetés jóváhagyása' }),
      ]
      const votes = [
        createTestVote('agenda-1', 'm1', 'yes', { weight: 10 }),
        createTestVote('agenda-1', 'm2', 'yes', { weight: 15 }),
        createTestVote('agenda-1', 'm3', 'abstain', { weight: 8 }),
      ]

      // Setup mock chain
      const mockFrom = vi.fn().mockImplementation((table: string) => {
        if (table === 'meetings') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { ...meeting, organizations: org },
                  error: null,
                }),
              }),
            }),
          }
        }
        if (table === 'members') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({
                  data: members,
                  error: null,
                }),
              }),
            }),
          }
        }
        if (table === 'attendance') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: members.map(m => ({
                  ...createTestAttendance(m.id),
                  members: m,
                })),
                error: null,
              }),
            }),
          }
        }
        if (table === 'agenda_items') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({
                  data: agendaItems,
                  error: null,
                }),
              }),
            }),
          }
        }
        if (table === 'votes') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: votes,
                error: null,
              }),
            }),
          }
        }
        return {}
      })

      ;(supabase.from as ReturnType<typeof vi.fn>).mockImplementation(mockFrom)

      const result = await generateMinutes({ meetingId: 'meeting-1' })

      // Check structure
      expect(result).toHaveProperty('markdown')
      expect(result).toHaveProperty('metadata')
      expect(result.metadata).toHaveProperty('generatedAt')
      expect(result.metadata).toHaveProperty('templateVersion', 'v1')
      expect(result.metadata).toHaveProperty('meetingTitle', 'Éves közgyűlés')
      expect(result.metadata).toHaveProperty('organizationName', 'Teszt Társasház')
    })

    it('should include organization name in markdown', async () => {
      const org = createTestOrganization({ name: 'Példa Társasház Kft.' })
      const meeting = createTestMeeting()

      const mockFrom = vi.fn().mockImplementation((table: string) => {
        if (table === 'meetings') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { ...meeting, organizations: org },
                  error: null,
                }),
              }),
            }),
          }
        }
        if (table === 'members') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ data: [], error: null }),
              }),
            }),
          }
        }
        if (table === 'attendance') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
          }
        }
        if (table === 'agenda_items') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({ data: [], error: null }),
              }),
            }),
          }
        }
        return {}
      })

      ;(supabase.from as ReturnType<typeof vi.fn>).mockImplementation(mockFrom)

      const result = await generateMinutes({ meetingId: 'meeting-1' })

      expect(result.markdown).toContain('Példa Társasház Kft.')
    })

    it('should throw error when meeting not found', async () => {
      const mockFrom = vi.fn().mockImplementation(() => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Not found' },
            }),
          }),
        }),
      }))

      ;(supabase.from as ReturnType<typeof vi.fn>).mockImplementation(mockFrom)

      await expect(generateMinutes({ meetingId: 'invalid-id' }))
        .rejects
        .toThrow('Meeting not found')
    })
  })

  describe('markdown output', () => {
    it('should include JEGYZŐKÖNYV header', async () => {
      const org = createTestOrganization()
      const meeting = createTestMeeting()

      const mockFrom = vi.fn().mockImplementation((table: string) => {
        if (table === 'meetings') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { ...meeting, organizations: org },
                  error: null,
                }),
              }),
            }),
          }
        }
        if (table === 'members') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ data: [], error: null }),
              }),
            }),
          }
        }
        if (table === 'attendance') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
          }
        }
        if (table === 'agenda_items') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({ data: [], error: null }),
              }),
            }),
          }
        }
        return {}
      })

      ;(supabase.from as ReturnType<typeof vi.fn>).mockImplementation(mockFrom)

      const result = await generateMinutes({ meetingId: 'meeting-1' })

      expect(result.markdown).toContain('# JEGYZŐKÖNYV')
      expect(result.markdown).toContain('## Jelen vannak:')
      expect(result.markdown).toContain('## Zárás')
      expect(result.markdown).toContain('Levezető elnök')
      expect(result.markdown).toContain('Jegyzőkönyvvezető')
    })

    it('should include meeting type in header', async () => {
      const org = createTestOrganization()
      const meeting = createTestMeeting({ type: 'extraordinary' })

      const mockFrom = vi.fn().mockImplementation((table: string) => {
        if (table === 'meetings') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { ...meeting, organizations: org },
                  error: null,
                }),
              }),
            }),
          }
        }
        if (table === 'members') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ data: [], error: null }),
              }),
            }),
          }
        }
        if (table === 'attendance') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
          }
        }
        if (table === 'agenda_items') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({ data: [], error: null }),
              }),
            }),
          }
        }
        return {}
      })

      ;(supabase.from as ReturnType<typeof vi.fn>).mockImplementation(mockFrom)

      const result = await generateMinutes({ meetingId: 'meeting-1' })

      expect(result.markdown).toContain('rendkívüli')
    })

    it('should show quorum status', async () => {
      const org = createTestOrganization()
      const meeting = createTestMeeting({ quorum_percentage: 50 })
      const members = [
        createTestMember({ id: 'm1', weight: 60 }),
        createTestMember({ id: 'm2', weight: 40 }),
      ]

      const mockFrom = vi.fn().mockImplementation((table: string) => {
        if (table === 'meetings') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { ...meeting, organizations: org },
                  error: null,
                }),
              }),
            }),
          }
        }
        if (table === 'members') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ data: members, error: null }),
              }),
            }),
          }
        }
        if (table === 'attendance') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({
                data: [{ ...createTestAttendance('m1'), members: members[0] }],
                error: null,
              }),
            }),
          }
        }
        if (table === 'agenda_items') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({ data: [], error: null }),
              }),
            }),
          }
        }
        return {}
      })

      ;(supabase.from as ReturnType<typeof vi.fn>).mockImplementation(mockFrom)

      const result = await generateMinutes({ meetingId: 'meeting-1' })

      expect(result.markdown).toContain('határozatképes')
      expect(result.markdown).toContain('60.0%')
    })
  })
})
