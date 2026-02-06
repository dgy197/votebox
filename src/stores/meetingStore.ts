import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import type { 
  Meeting, MeetingType, MeetingStatus, LocationType, QuorumType,
  AgendaItem, VoteType, RequiredMajority, AgendaItemStatus,
  Attendance, AttendanceType, QuorumResult
} from '../types/v3'

interface MeetingState {
  // Data
  meetings: Meeting[]
  currentMeeting: Meeting | null
  agendaItems: AgendaItem[]
  attendance: Attendance[]
  quorumResult: QuorumResult | null
  
  // Loading/Error
  loading: boolean
  error: string | null
  
  // Meeting Actions
  fetchMeetings: (orgId: string) => Promise<void>
  fetchMeeting: (id: string) => Promise<Meeting | null>
  createMeeting: (data: CreateMeetingInput) => Promise<Meeting | null>
  updateMeeting: (id: string, data: UpdateMeetingInput) => Promise<boolean>
  deleteMeeting: (id: string) => Promise<boolean>
  setCurrentMeeting: (meeting: Meeting | null) => void
  
  // Agenda Actions
  fetchAgendaItems: (meetingId: string) => Promise<void>
  createAgendaItem: (data: CreateAgendaItemInput) => Promise<AgendaItem | null>
  updateAgendaItem: (id: string, data: UpdateAgendaItemInput) => Promise<boolean>
  deleteAgendaItem: (id: string) => Promise<boolean>
  reorderAgendaItems: (items: { id: string; order_num: number }[]) => Promise<boolean>
  
  // Attendance Actions
  fetchAttendance: (meetingId: string) => Promise<void>
  checkIn: (meetingId: string, memberId: string, type: AttendanceType, weight: number) => Promise<boolean>
  checkOut: (attendanceId: string) => Promise<boolean>
  calculateQuorum: (meetingId: string) => Promise<QuorumResult | null>
  
  // Helpers
  clearError: () => void
  reset: () => void
}

export interface CreateMeetingInput {
  org_id: string
  title: string
  description?: string
  type?: MeetingType
  scheduled_at?: string
  location?: string
  location_type?: LocationType
  meeting_url?: string
  quorum_type?: QuorumType
  quorum_percentage?: number
  created_by?: string
}

export interface UpdateMeetingInput {
  title?: string
  description?: string
  type?: MeetingType
  status?: MeetingStatus
  scheduled_at?: string
  ended_at?: string
  location?: string
  location_type?: LocationType
  meeting_url?: string
  quorum_type?: QuorumType
  quorum_percentage?: number
  quorum_reached?: boolean
  recording_enabled?: boolean
  recording_url?: string
  transcript?: string
}

export interface CreateAgendaItemInput {
  meeting_id: string
  order_num: number
  title: string
  description?: string
  vote_type?: VoteType
  vote_options?: string[]
  is_secret?: boolean
  required_majority?: RequiredMajority
}

export interface UpdateAgendaItemInput {
  order_num?: number
  title?: string
  description?: string
  vote_type?: VoteType
  vote_options?: string[]
  is_secret?: boolean
  required_majority?: RequiredMajority
  status?: AgendaItemStatus
  result?: Record<string, unknown>
}

const initialState = {
  meetings: [],
  currentMeeting: null,
  agendaItems: [],
  attendance: [],
  quorumResult: null,
  loading: false,
  error: null,
}

export const useMeetingStore = create<MeetingState>((set) => ({
  ...initialState,

  // ============ MEETINGS ============
  
  fetchMeetings: async (orgId: string) => {
    set({ loading: true, error: null })
    try {
      const { data, error } = await supabase
        .from('meetings')
        .select('*')
        .eq('org_id', orgId)
        .order('scheduled_at', { ascending: false, nullsFirst: false })

      if (error) throw error
      set({ meetings: data || [], loading: false })
    } catch (err) {
      set({ error: (err as Error).message, loading: false })
    }
  },

  fetchMeeting: async (id: string) => {
    set({ loading: true, error: null })
    try {
      const { data, error } = await supabase
        .from('meetings')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      set({ currentMeeting: data, loading: false })
      return data
    } catch (err) {
      set({ error: (err as Error).message, loading: false })
      return null
    }
  },

  createMeeting: async (input: CreateMeetingInput) => {
    set({ loading: true, error: null })
    try {
      const { data, error } = await supabase
        .from('meetings')
        .insert({
          org_id: input.org_id,
          title: input.title,
          description: input.description,
          type: input.type ?? 'regular',
          scheduled_at: input.scheduled_at,
          location: input.location,
          location_type: input.location_type ?? 'hybrid',
          meeting_url: input.meeting_url,
          quorum_type: input.quorum_type ?? 'majority',
          quorum_percentage: input.quorum_percentage ?? 50.0,
          created_by: input.created_by,
        })
        .select()
        .single()

      if (error) throw error
      
      set((state) => ({
        meetings: [data, ...state.meetings],
        loading: false,
      }))
      return data
    } catch (err) {
      set({ error: (err as Error).message, loading: false })
      return null
    }
  },

  updateMeeting: async (id: string, input: UpdateMeetingInput) => {
    set({ loading: true, error: null })
    try {
      const { data, error } = await supabase
        .from('meetings')
        .update(input)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      set((state) => ({
        meetings: state.meetings.map((m) => (m.id === id ? data : m)),
        currentMeeting: state.currentMeeting?.id === id ? data : state.currentMeeting,
        loading: false,
      }))
      return true
    } catch (err) {
      set({ error: (err as Error).message, loading: false })
      return false
    }
  },

  deleteMeeting: async (id: string) => {
    set({ loading: true, error: null })
    try {
      const { error } = await supabase
        .from('meetings')
        .delete()
        .eq('id', id)

      if (error) throw error

      set((state) => ({
        meetings: state.meetings.filter((m) => m.id !== id),
        currentMeeting: state.currentMeeting?.id === id ? null : state.currentMeeting,
        loading: false,
      }))
      return true
    } catch (err) {
      set({ error: (err as Error).message, loading: false })
      return false
    }
  },

  setCurrentMeeting: (meeting) => set({ currentMeeting: meeting }),

  // ============ AGENDA ITEMS ============

  fetchAgendaItems: async (meetingId: string) => {
    set({ loading: true, error: null })
    try {
      const { data, error } = await supabase
        .from('agenda_items')
        .select('*')
        .eq('meeting_id', meetingId)
        .order('order_num', { ascending: true })

      if (error) throw error
      set({ agendaItems: data || [], loading: false })
    } catch (err) {
      set({ error: (err as Error).message, loading: false })
    }
  },

  createAgendaItem: async (input: CreateAgendaItemInput) => {
    set({ loading: true, error: null })
    try {
      const { data, error } = await supabase
        .from('agenda_items')
        .insert({
          meeting_id: input.meeting_id,
          order_num: input.order_num,
          title: input.title,
          description: input.description,
          vote_type: input.vote_type ?? 'yes_no_abstain',
          vote_options: input.vote_options,
          is_secret: input.is_secret ?? false,
          required_majority: input.required_majority ?? 'simple',
        })
        .select()
        .single()

      if (error) throw error
      
      set((state) => ({
        agendaItems: [...state.agendaItems, data].sort((a, b) => a.order_num - b.order_num),
        loading: false,
      }))
      return data
    } catch (err) {
      set({ error: (err as Error).message, loading: false })
      return null
    }
  },

  updateAgendaItem: async (id: string, input: UpdateAgendaItemInput) => {
    set({ loading: true, error: null })
    try {
      const { data, error } = await supabase
        .from('agenda_items')
        .update(input)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      set((state) => ({
        agendaItems: state.agendaItems
          .map((item) => (item.id === id ? data : item))
          .sort((a, b) => a.order_num - b.order_num),
        loading: false,
      }))
      return true
    } catch (err) {
      set({ error: (err as Error).message, loading: false })
      return false
    }
  },

  deleteAgendaItem: async (id: string) => {
    set({ loading: true, error: null })
    try {
      const { error } = await supabase
        .from('agenda_items')
        .delete()
        .eq('id', id)

      if (error) throw error

      set((state) => ({
        agendaItems: state.agendaItems.filter((item) => item.id !== id),
        loading: false,
      }))
      return true
    } catch (err) {
      set({ error: (err as Error).message, loading: false })
      return false
    }
  },

  reorderAgendaItems: async (items: { id: string; order_num: number }[]) => {
    set({ loading: true, error: null })
    try {
      // Update each item's order_num
      for (const item of items) {
        const { error } = await supabase
          .from('agenda_items')
          .update({ order_num: item.order_num })
          .eq('id', item.id)

        if (error) throw error
      }

      // Update local state
      set((state) => ({
        agendaItems: state.agendaItems
          .map((agendaItem) => {
            const update = items.find((i) => i.id === agendaItem.id)
            return update ? { ...agendaItem, order_num: update.order_num } : agendaItem
          })
          .sort((a, b) => a.order_num - b.order_num),
        loading: false,
      }))
      return true
    } catch (err) {
      set({ error: (err as Error).message, loading: false })
      return false
    }
  },

  // ============ ATTENDANCE ============

  fetchAttendance: async (meetingId: string) => {
    set({ loading: true, error: null })
    try {
      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('meeting_id', meetingId)

      if (error) throw error
      set({ attendance: data || [], loading: false })
    } catch (err) {
      set({ error: (err as Error).message, loading: false })
    }
  },

  checkIn: async (meetingId: string, memberId: string, type: AttendanceType, weight: number) => {
    set({ loading: true, error: null })
    try {
      const { data, error } = await supabase
        .from('attendance')
        .upsert({
          meeting_id: meetingId,
          member_id: memberId,
          attendance_type: type,
          weight_at_checkin: weight,
          checked_in_at: new Date().toISOString(),
        }, {
          onConflict: 'meeting_id,member_id'
        })
        .select()
        .single()

      if (error) throw error

      set((state) => {
        const existing = state.attendance.find(
          (a) => a.meeting_id === meetingId && a.member_id === memberId
        )
        if (existing) {
          return {
            attendance: state.attendance.map((a) =>
              a.id === existing.id ? data : a
            ),
            loading: false,
          }
        }
        return {
          attendance: [...state.attendance, data],
          loading: false,
        }
      })
      return true
    } catch (err) {
      set({ error: (err as Error).message, loading: false })
      return false
    }
  },

  checkOut: async (attendanceId: string) => {
    set({ loading: true, error: null })
    try {
      const { data, error } = await supabase
        .from('attendance')
        .update({ checked_out_at: new Date().toISOString() })
        .eq('id', attendanceId)
        .select()
        .single()

      if (error) throw error

      set((state) => ({
        attendance: state.attendance.map((a) =>
          a.id === attendanceId ? data : a
        ),
        loading: false,
      }))
      return true
    } catch (err) {
      set({ error: (err as Error).message, loading: false })
      return false
    }
  },

  calculateQuorum: async (meetingId: string) => {
    set({ loading: true, error: null })
    try {
      const { data, error } = await supabase.rpc('calculate_quorum', {
        p_meeting_id: meetingId,
      })

      if (error) throw error

      const result = data?.[0] as QuorumResult | undefined
      set({ quorumResult: result || null, loading: false })
      return result || null
    } catch (err) {
      set({ error: (err as Error).message, loading: false })
      return null
    }
  },

  clearError: () => set({ error: null }),
  
  reset: () => set(initialState),
}))
