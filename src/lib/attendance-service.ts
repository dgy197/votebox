/**
 * Attendance Service
 * Real-time attendance tracking with Supabase Realtime
 */

import { supabase, isSupabaseConfigured } from './supabase'
import type { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import type { Attendance, AttendanceType, Member } from '../types/v3'

// ============ Types ============

export interface AttendanceWithMember extends Attendance {
  member?: Member
}

export interface AttendanceChangePayload {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE'
  new: Attendance | null
  old: Attendance | null
}

export interface AttendanceStats {
  totalMembers: number
  presentMembers: number
  presentWeight: number
  totalWeight: number
  percentage: number
}

type AttendanceChangeHandler = (payload: AttendanceChangePayload) => void

// ============ Check-in / Check-out ============

/**
 * Check in a member to a meeting
 */
export async function checkIn(
  meetingId: string,
  memberId: string,
  type: AttendanceType = 'in_person',
  weight?: number
): Promise<Attendance | null> {
  if (!isSupabaseConfigured) {
    // Demo mode - return mock
    return {
      id: `demo-attendance-${Date.now()}`,
      meeting_id: meetingId,
      member_id: memberId,
      checked_in_at: new Date().toISOString(),
      attendance_type: type,
      weight_at_checkin: weight,
    }
  }

  const { data, error } = await supabase
    .from('attendance')
    .upsert({
      meeting_id: meetingId,
      member_id: memberId,
      attendance_type: type,
      weight_at_checkin: weight,
      checked_in_at: new Date().toISOString(),
      checked_out_at: null, // Clear any previous checkout
    }, {
      onConflict: 'meeting_id,member_id'
    })
    .select()
    .single()

  if (error) {
    console.error('Check-in error:', error)
    throw error
  }

  return data
}

/**
 * Check out a member from a meeting
 */
export async function checkOut(
  meetingId: string,
  memberId: string
): Promise<Attendance | null> {
  if (!isSupabaseConfigured) {
    // Demo mode
    return {
      id: `demo-attendance-${Date.now()}`,
      meeting_id: meetingId,
      member_id: memberId,
      checked_in_at: new Date().toISOString(),
      checked_out_at: new Date().toISOString(),
      attendance_type: 'in_person',
    }
  }

  const { data, error } = await supabase
    .from('attendance')
    .update({ checked_out_at: new Date().toISOString() })
    .eq('meeting_id', meetingId)
    .eq('member_id', memberId)
    .select()
    .single()

  if (error) {
    console.error('Check-out error:', error)
    throw error
  }

  return data
}

/**
 * Check out by attendance ID
 */
export async function checkOutById(attendanceId: string): Promise<Attendance | null> {
  if (!isSupabaseConfigured) {
    return {
      id: attendanceId,
      meeting_id: 'demo',
      member_id: 'demo',
      checked_in_at: new Date().toISOString(),
      checked_out_at: new Date().toISOString(),
      attendance_type: 'in_person',
    }
  }

  const { data, error } = await supabase
    .from('attendance')
    .update({ checked_out_at: new Date().toISOString() })
    .eq('id', attendanceId)
    .select()
    .single()

  if (error) {
    console.error('Check-out error:', error)
    throw error
  }

  return data
}

// ============ Fetch Attendance ============

/**
 * Get all attendance records for a meeting
 */
export async function getAttendance(meetingId: string): Promise<Attendance[]> {
  if (!isSupabaseConfigured) {
    return []
  }

  const { data, error } = await supabase
    .from('attendance')
    .select('*')
    .eq('meeting_id', meetingId)

  if (error) {
    console.error('Fetch attendance error:', error)
    throw error
  }

  return data || []
}

/**
 * Get attendance with member details
 */
export async function getAttendanceWithMembers(meetingId: string): Promise<AttendanceWithMember[]> {
  if (!isSupabaseConfigured) {
    return []
  }

  const { data, error } = await supabase
    .from('attendance')
    .select(`
      *,
      member:members(*)
    `)
    .eq('meeting_id', meetingId)

  if (error) {
    console.error('Fetch attendance error:', error)
    throw error
  }

  return data || []
}

/**
 * Get current present members (checked in but not checked out)
 */
export async function getPresentMembers(meetingId: string): Promise<AttendanceWithMember[]> {
  if (!isSupabaseConfigured) {
    return []
  }

  const { data, error } = await supabase
    .from('attendance')
    .select(`
      *,
      member:members(*)
    `)
    .eq('meeting_id', meetingId)
    .is('checked_out_at', null)

  if (error) {
    console.error('Fetch present members error:', error)
    throw error
  }

  return data || []
}

// ============ Real-time Subscription ============

let activeChannel: RealtimeChannel | null = null

/**
 * Subscribe to attendance changes for a meeting
 * Returns unsubscribe function
 */
export function subscribeToAttendance(
  meetingId: string,
  onAttendanceChange: AttendanceChangeHandler
): () => void {
  if (!isSupabaseConfigured) {
    console.log('⚠️ Realtime not available in demo mode')
    return () => {}
  }

  // Unsubscribe from previous channel if exists
  if (activeChannel) {
    supabase.removeChannel(activeChannel)
  }

  const channel = supabase
    .channel(`attendance-${meetingId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'attendance',
        filter: `meeting_id=eq.${meetingId}`,
      },
      (payload: RealtimePostgresChangesPayload<Attendance>) => {
        onAttendanceChange({
          eventType: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
          new: payload.new as Attendance | null,
          old: payload.old as Attendance | null,
        })
      }
    )
    .subscribe((status) => {
      console.log(`Attendance channel status: ${status}`)
    })

  activeChannel = channel

  // Return unsubscribe function
  return () => {
    supabase.removeChannel(channel)
    if (activeChannel === channel) {
      activeChannel = null
    }
  }
}

/**
 * Create a subscription helper with automatic cleanup
 */
export function createAttendanceSubscription(meetingId: string) {
  let unsubscribe: (() => void) | null = null
  const handlers: AttendanceChangeHandler[] = []

  const subscribe = () => {
    if (unsubscribe) return

    unsubscribe = subscribeToAttendance(meetingId, (payload) => {
      handlers.forEach(handler => handler(payload))
    })
  }

  const addHandler = (handler: AttendanceChangeHandler) => {
    handlers.push(handler)
    if (handlers.length === 1) {
      subscribe()
    }
    return () => {
      const index = handlers.indexOf(handler)
      if (index > -1) {
        handlers.splice(index, 1)
      }
      if (handlers.length === 0 && unsubscribe) {
        unsubscribe()
        unsubscribe = null
      }
    }
  }

  const cleanup = () => {
    handlers.length = 0
    if (unsubscribe) {
      unsubscribe()
      unsubscribe = null
    }
  }

  return { addHandler, cleanup }
}

// ============ Attendance Statistics ============

/**
 * Calculate attendance statistics from attendance records
 */
export function calculateAttendanceStats(
  attendance: Attendance[],
  members: Member[]
): AttendanceStats {
  // Filter to only active voters
  const activeVoters = members.filter(m => m.is_active && m.role !== 'observer')
  const totalMembers = activeVoters.length
  const totalWeight = activeVoters.reduce((sum, m) => sum + m.weight, 0)

  // Get present members (checked in and not checked out)
  const presentMemberIds = new Set(
    attendance
      .filter(a => !a.checked_out_at)
      .map(a => a.member_id)
  )

  const presentMembers = activeVoters.filter(m => presentMemberIds.has(m.id))
  const presentWeight = attendance
    .filter(a => !a.checked_out_at)
    .reduce((sum, a) => {
      // Use weight at checkin if available, otherwise find member's current weight
      if (a.weight_at_checkin !== undefined && a.weight_at_checkin !== null) {
        return sum + a.weight_at_checkin
      }
      const member = activeVoters.find(m => m.id === a.member_id)
      return sum + (member?.weight || 0)
    }, 0)

  const percentage = totalWeight > 0 ? (presentWeight / totalWeight) * 100 : 0

  return {
    totalMembers,
    presentMembers: presentMembers.length,
    presentWeight,
    totalWeight,
    percentage,
  }
}

export default {
  checkIn,
  checkOut,
  checkOutById,
  getAttendance,
  getAttendanceWithMembers,
  getPresentMembers,
  subscribeToAttendance,
  createAttendanceSubscription,
  calculateAttendanceStats,
}
