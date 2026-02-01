/**
 * Backend Service Layer
 * Automatically switches between Supabase and Demo mode
 */

import * as supabaseService from './supabaseService'
import * as demoService from './demoService'

// Re-export types
export type { VoteResult, VoteResults, EventStats, UnsubscribeFn } from './supabaseService'
export { SupabaseError } from './supabaseService'

// ============ CONNECTION MANAGEMENT ============

let _isConnected: boolean | null = null
let _isDemoMode = false
let _connectionCheckPromise: Promise<boolean> | null = null

/**
 * Check if Supabase is available
 */
export async function checkConnection(): Promise<boolean> {
  if (_connectionCheckPromise) {
    return _connectionCheckPromise
  }
  
  _connectionCheckPromise = (async () => {
    try {
      // Check if env vars are set
      const url = import.meta.env.VITE_SUPABASE_URL
      const key = import.meta.env.VITE_SUPABASE_ANON_KEY
      
      if (!url || !key || url === 'your-project-url' || key === 'your-anon-key') {
        console.log('⚠️ Supabase not configured - switching to demo mode')
        _isConnected = false
        _isDemoMode = true
        demoService.enableDemoMode()
        return false
      }
      
      const connected = await supabaseService.checkConnection()
      _isConnected = connected
      
      if (!connected) {
        console.log('⚠️ Supabase connection failed - switching to demo mode')
        _isDemoMode = true
        demoService.enableDemoMode()
      }
      
      return connected
    } catch {
      console.log('⚠️ Supabase connection error - switching to demo mode')
      _isConnected = false
      _isDemoMode = true
      demoService.enableDemoMode()
      return false
    } finally {
      _connectionCheckPromise = null
    }
  })()
  
  return _connectionCheckPromise
}

export function isConnected(): boolean {
  return _isConnected === true
}

export function isDemoMode(): boolean {
  return _isDemoMode
}

export function enableDemoMode(): void {
  _isDemoMode = true
  demoService.enableDemoMode()
}

export function disableDemoMode(): void {
  _isDemoMode = false
  demoService.disableDemoMode()
}

export function resetDemoData(): void {
  demoService.resetDemoData()
}

// ============ SERVICE GETTER ============

function getService() {
  return _isDemoMode ? demoService : supabaseService
}

// ============ ORGANIZATIONS ============

export async function getOrganizations() {
  return getService().getOrganizations()
}

export async function getOrganization(id: string) {
  return getService().getOrganization(id)
}

export async function createOrganization(org: { name: string; slug: string }) {
  return getService().createOrganization(org)
}

export async function updateOrganization(id: string, updates: Parameters<typeof supabaseService.updateOrganization>[1]) {
  return getService().updateOrganization(id, updates)
}

export async function deleteOrganization(id: string) {
  return getService().deleteOrganization(id)
}

// ============ USERS ============

export async function getAllUsers() {
  return getService().getAllUsers()
}

export async function getOrgUsers(organizationId: string) {
  return getService().getOrgUsers(organizationId)
}

export async function createOrgAdmin(organizationId: string, data: { email: string; name: string }) {
  if (_isDemoMode) {
    throw new Error('Cannot create users in demo mode')
  }
  return supabaseService.createOrgAdmin(organizationId, data)
}

export async function deleteUser(id: string) {
  if (_isDemoMode) {
    throw new Error('Cannot delete users in demo mode')
  }
  return supabaseService.deleteUser(id)
}

// ============ EVENTS ============

export async function getEvents(organizationId: string) {
  return getService().getEvents(organizationId)
}

export async function getAllEvents() {
  return getService().getAllEvents()
}

export async function getEvent(id: string) {
  return getService().getEvent(id)
}

export async function createEvent(event: Parameters<typeof supabaseService.createEvent>[0]) {
  return getService().createEvent(event)
}

export async function updateEvent(id: string, updates: Parameters<typeof supabaseService.updateEvent>[1]) {
  return getService().updateEvent(id, updates)
}

export async function deleteEvent(id: string) {
  return getService().deleteEvent(id)
}

export async function activateEvent(id: string) {
  if (_isDemoMode) {
    return demoService.updateEvent(id, { state: 'active' })
  }
  return supabaseService.activateEvent(id)
}

export async function closeEvent(id: string) {
  if (_isDemoMode) {
    return demoService.updateEvent(id, { state: 'closed' })
  }
  return supabaseService.closeEvent(id)
}

export async function getEventByCode(eventCode: string) {
  return getService().getEventByCode(eventCode)
}

// ============ PARTICIPANTS ============

export async function getParticipants(eventId: string) {
  return getService().getParticipants(eventId)
}

export async function getParticipant(id: string) {
  return getService().getParticipant(id)
}

export async function getPresentParticipants(eventId: string) {
  return getService().getPresentParticipants(eventId)
}

export async function createParticipant(participant: Parameters<typeof supabaseService.createParticipant>[0]) {
  return getService().createParticipant(participant)
}

export async function createParticipants(participants: Parameters<typeof supabaseService.createParticipants>[0]) {
  return getService().createParticipants(participants)
}

export async function updateParticipant(id: string, updates: Parameters<typeof supabaseService.updateParticipant>[1]) {
  return getService().updateParticipant(id, updates)
}

export async function deleteParticipant(id: string) {
  return getService().deleteParticipant(id)
}

export async function markParticipantPresent(id: string) {
  if (_isDemoMode) {
    return demoService.updateParticipant(id, { is_present: true, joined_at: new Date().toISOString() })
  }
  return supabaseService.markParticipantPresent(id)
}

export async function markParticipantAbsent(id: string) {
  if (_isDemoMode) {
    return demoService.updateParticipant(id, { is_present: false })
  }
  return supabaseService.markParticipantAbsent(id)
}

export async function verifyParticipant(eventId: string, accessCode: string) {
  return getService().verifyParticipant(eventId, accessCode)
}

// ============ QUESTIONS ============

export async function getQuestions(eventId: string) {
  return getService().getQuestions(eventId)
}

export async function getQuestion(id: string) {
  return getService().getQuestion(id)
}

export async function getActiveQuestion(eventId: string) {
  return getService().getActiveQuestion(eventId)
}

export async function createQuestion(question: Parameters<typeof supabaseService.createQuestion>[0]) {
  return getService().createQuestion(question)
}

export async function updateQuestion(id: string, updates: Parameters<typeof supabaseService.updateQuestion>[1]) {
  return getService().updateQuestion(id, updates)
}

export async function deleteQuestion(id: string) {
  return getService().deleteQuestion(id)
}

export async function activateQuestion(id: string) {
  return getService().activateQuestion(id)
}

export async function closeQuestion(id: string) {
  return getService().closeQuestion(id)
}

export async function reorderQuestions(eventId: string, questionIds: string[]) {
  if (_isDemoMode) {
    // Manual reorder in demo mode
    for (let i = 0; i < questionIds.length; i++) {
      await demoService.updateQuestion(questionIds[i], { order_index: i })
    }
    return
  }
  return supabaseService.reorderQuestions(eventId, questionIds)
}

// ============ VOTING ============

export async function castVoteSecure(
  questionId: string,
  participantId: string,
  choices: string[],
  isAnonymous: boolean = true
) {
  return getService().castVoteSecure(questionId, participantId, choices, isAnonymous)
}

export async function castVote(
  questionId: string,
  participantId: string,
  choices: string[],
  isAnonymous: boolean
) {
  if (_isDemoMode) {
    const result = await demoService.castVoteSecure(questionId, participantId, choices, isAnonymous)
    if (!result.success) {
      throw new Error(result.error || 'Vote failed')
    }
    return
  }
  return supabaseService.castVote(questionId, participantId, choices, isAnonymous)
}

export async function hasVoted(questionId: string, participantId: string) {
  return getService().hasVoted(questionId, participantId)
}

export async function getBallots(questionId: string) {
  return getService().getBallots(questionId)
}

export async function getVoteCount(questionId: string) {
  return getService().getVoteCount(questionId)
}

export async function getCastMarkers(questionId: string) {
  return getService().getCastMarkers(questionId)
}

export async function getVoteResults(questionId: string) {
  return getService().getVoteResults(questionId)
}

// ============ STATISTICS ============

export async function getEventStats(eventId: string) {
  return getService().getEventStats(eventId)
}

// ============ REALTIME ============

export function subscribeToQuestions(
  eventId: string,
  callback: (question: import('../types').Question) => void
) {
  return getService().subscribeToQuestions(eventId, callback)
}

export function subscribeToBallots(questionId: string, callback: (count: number) => void) {
  return getService().subscribeToBallots(questionId, callback)
}

export function subscribeToParticipants(
  eventId: string,
  callback: (data: { participant: import('../types').Participant; event: 'INSERT' | 'UPDATE' | 'DELETE' }) => void
) {
  return getService().subscribeToParticipants(eventId, callback)
}

export function subscribeToPresence(
  eventId: string,
  participantId: string,
  callbacks: {
    onSync?: (state: Record<string, unknown[]>) => void
    onJoin?: (key: string, presence: unknown) => void
    onLeave?: (key: string, presence: unknown) => void
  }
) {
  return getService().subscribeToPresence(eventId, participantId, callbacks)
}

// ============ AUDIT LOGGING ============

export async function createAuditLog(entry: Parameters<typeof supabaseService.createAuditLog>[0]) {
  if (_isDemoMode) {
    console.log('📝 Audit log (demo):', entry)
    return
  }
  return supabaseService.createAuditLog(entry)
}

// ============ HELPERS ============

export function generateAccessCode() {
  return supabaseService.generateAccessCode()
}

export function generateEventCode() {
  return supabaseService.generateEventCode()
}

// ============ INITIALIZATION ============

// Auto-check connection on import
checkConnection().catch(console.error)
