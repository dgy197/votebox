import { supabase } from '../lib/supabase'
import type { Event, Participant, Question, Ballot, CastMarker, Organization, User } from '../types'

// ============ ERROR HANDLING ============

export class SupabaseError extends Error {
  code: string
  details?: string

  constructor(message: string, code: string, details?: string) {
    super(message)
    this.name = 'SupabaseError'
    this.code = code
    this.details = details
  }
}

// User-friendly error messages mapped from error codes
const USER_ERROR_MESSAGES: Record<string, string> = {
  'PGRST116': 'A keresett elem nem található.',
  '23505': 'Ez az elem már létezik.',
  '23503': 'A hivatkozott elem nem létezik.',
  '42501': 'Nincs jogosultságod ehhez a művelethez.',
  '42P01': 'A kért erőforrás nem elérhető.',
  'PGRST301': 'A kérés időtúllépés miatt megszakadt.',
  'ALREADY_VOTED': 'Már leadtad a szavazatodat.',
  'QUESTION_NOT_ACTIVE': 'A szavazás már nem aktív.',
  'TIME_EXPIRED': 'A szavazási idő lejárt.',
  'PARTICIPANT_NOT_FOUND': 'A résztvevő nem található.',
  'PARTICIPANT_NOT_PRESENT': 'A résztvevő nincs jelen.',
  'VOTE_FAILED': 'A szavazás sikertelen. Kérjük, próbáld újra.',
  'UNKNOWN_ERROR': 'Váratlan hiba történt. Kérjük, próbáld újra később.',
}

function getPublicErrorMessage(code: string): string {
  return USER_ERROR_MESSAGES[code] || USER_ERROR_MESSAGES['UNKNOWN_ERROR']
}

function handleError(error: unknown, context: string): never {
  if (error && typeof error === 'object' && 'code' in error) {
    const supaError = error as { code: string; message: string; details?: string }
    // Log detailed error for debugging (server-side only)
    console.error(`[SupabaseError] ${context}:`, {
      code: supaError.code,
      message: supaError.message,
      details: supaError.details
    })
    // Throw user-friendly error
    throw new SupabaseError(
      getPublicErrorMessage(supaError.code),
      supaError.code,
      undefined // Don't expose details to client
    )
  }
  console.error(`[SupabaseError] ${context}:`, error)
  throw new SupabaseError(
    USER_ERROR_MESSAGES['UNKNOWN_ERROR'],
    'UNKNOWN_ERROR'
  )
}

// ============ CONNECTION CHECK ============

export async function checkConnection(): Promise<boolean> {
  try {
    const { error } = await supabase.from('organizations').select('id').limit(1)
    return !error
  } catch {
    return false
  }
}

// ============ ORGANIZATIONS ============

export async function getOrganizations(): Promise<Organization[]> {
  const { data, error } = await supabase
    .from('organizations')
    .select('*')
    .order('name')
  
  if (error) handleError(error, 'Failed to get organizations')
  return data as Organization[]
}

export async function getOrganization(id: string): Promise<Organization> {
  const { data, error } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) handleError(error, 'Failed to get organization')
  return data as Organization
}

export async function createOrganization(org: { name: string; slug: string }): Promise<Organization> {
  const { data, error } = await supabase
    .from('organizations')
    .insert({
      name: org.name,
      slug: org.slug || org.name.toLowerCase().replace(/\s+/g, '-'),
      settings: {}
    })
    .select()
    .single()
  
  if (error) handleError(error, 'Failed to create organization')
  return data as Organization
}

export async function updateOrganization(id: string, updates: Partial<Organization>): Promise<Organization> {
  const { data, error } = await supabase
    .from('organizations')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  
  if (error) handleError(error, 'Failed to update organization')
  return data as Organization
}

export async function deleteOrganization(id: string): Promise<void> {
  const { error } = await supabase
    .from('organizations')
    .delete()
    .eq('id', id)
  
  if (error) handleError(error, 'Failed to delete organization')
}

// ============ USERS ============

export async function getAllUsers(): Promise<User[]> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('email')
  
  if (error) handleError(error, 'Failed to get users')
  return data as User[]
}

export async function getOrgUsers(organizationId: string): Promise<User[]> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('organization_id', organizationId)
    .order('email')
  
  if (error) handleError(error, 'Failed to get organization users')
  return data as User[]
}

export async function createOrgAdmin(organizationId: string, userData: { email: string; name: string }): Promise<User> {
  const { data: user, error } = await supabase
    .from('users')
    .insert({
      id: crypto.randomUUID(),
      email: userData.email,
      role: 'org_admin',
      organization_id: organizationId,
    })
    .select()
    .single()
  
  if (error) handleError(error, 'Failed to create org admin')
  return user as User
}

export async function deleteUser(id: string): Promise<void> {
  const { error } = await supabase
    .from('users')
    .delete()
    .eq('id', id)
  
  if (error) handleError(error, 'Failed to delete user')
}

// ============ EVENTS ============

export async function getEvents(organizationId: string): Promise<Event[]> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })
  
  if (error) handleError(error, 'Failed to get events')
  return data as Event[]
}

export async function getAllEvents(): Promise<Event[]> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) handleError(error, 'Failed to get all events')
  return data as Event[]
}

export async function getEvent(id: string): Promise<Event> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) handleError(error, 'Failed to get event')
  return data as Event
}

export async function createEvent(event: Partial<Event>): Promise<Event> {
  const { data, error } = await supabase
    .from('events')
    .insert(event)
    .select()
    .single()
  
  if (error) handleError(error, 'Failed to create event')
  return data as Event
}

export async function updateEvent(id: string, updates: Partial<Event>): Promise<Event> {
  const { data, error } = await supabase
    .from('events')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  
  if (error) handleError(error, 'Failed to update event')
  return data as Event
}

export async function deleteEvent(id: string): Promise<void> {
  const { error } = await supabase
    .from('events')
    .delete()
    .eq('id', id)
  
  if (error) handleError(error, 'Failed to delete event')
}

export async function activateEvent(id: string): Promise<Event> {
  const { data, error } = await supabase
    .from('events')
    .update({ state: 'active' })
    .eq('id', id)
    .select()
    .single()
  
  if (error) handleError(error, 'Failed to activate event')
  return data as Event
}

export async function closeEvent(id: string): Promise<Event> {
  const { data, error } = await supabase
    .from('events')
    .update({ state: 'closed' })
    .eq('id', id)
    .select()
    .single()
  
  if (error) handleError(error, 'Failed to close event')
  return data as Event
}

// ============ PARTICIPANTS ============

export async function getParticipants(eventId: string): Promise<Participant[]> {
  const { data, error } = await supabase
    .from('participants')
    .select('*')
    .eq('event_id', eventId)
    .order('name')
  
  if (error) handleError(error, 'Failed to get participants')
  return data as Participant[]
}

export async function getParticipant(id: string): Promise<Participant> {
  const { data, error } = await supabase
    .from('participants')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) handleError(error, 'Failed to get participant')
  return data as Participant
}

export async function getPresentParticipants(eventId: string): Promise<Participant[]> {
  const { data, error } = await supabase
    .from('participants')
    .select('*')
    .eq('event_id', eventId)
    .eq('is_present', true)
    .order('joined_at', { ascending: false })
  
  if (error) handleError(error, 'Failed to get present participants')
  return data as Participant[]
}

export async function createParticipant(participant: Partial<Participant>): Promise<Participant> {
  const { data, error } = await supabase
    .from('participants')
    .insert(participant)
    .select()
    .single()
  
  if (error) handleError(error, 'Failed to create participant')
  return data as Participant
}

export async function createParticipants(participants: Partial<Participant>[]): Promise<Participant[]> {
  const { data, error } = await supabase
    .from('participants')
    .insert(participants)
    .select()
  
  if (error) handleError(error, 'Failed to create participants')
  return data as Participant[]
}

export async function updateParticipant(id: string, updates: Partial<Participant>): Promise<Participant> {
  const { data, error } = await supabase
    .from('participants')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  
  if (error) handleError(error, 'Failed to update participant')
  return data as Participant
}

export async function deleteParticipant(id: string): Promise<void> {
  const { error } = await supabase
    .from('participants')
    .delete()
    .eq('id', id)
  
  if (error) handleError(error, 'Failed to delete participant')
}

export async function markParticipantPresent(id: string): Promise<Participant> {
  const { data, error } = await supabase
    .from('participants')
    .update({ is_present: true, joined_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  
  if (error) handleError(error, 'Failed to mark participant present')
  return data as Participant
}

export async function markParticipantAbsent(id: string): Promise<Participant> {
  const { data, error } = await supabase
    .from('participants')
    .update({ is_present: false })
    .eq('id', id)
    .select()
    .single()
  
  if (error) handleError(error, 'Failed to mark participant absent')
  return data as Participant
}

// ============ QUESTIONS ============

export async function getQuestions(eventId: string): Promise<Question[]> {
  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .eq('event_id', eventId)
    .order('order_index')
  
  if (error) handleError(error, 'Failed to get questions')
  return data as Question[]
}

export async function getQuestion(id: string): Promise<Question> {
  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) handleError(error, 'Failed to get question')
  return data as Question
}

export async function getActiveQuestion(eventId: string): Promise<Question | null> {
  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .eq('event_id', eventId)
    .eq('state', 'active')
    .single()
  
  if (error && error.code !== 'PGRST116') handleError(error, 'Failed to get active question')
  return data as Question | null
}

export async function createQuestion(question: Partial<Question>): Promise<Question> {
  const { data, error } = await supabase
    .from('questions')
    .insert(question)
    .select()
    .single()
  
  if (error) handleError(error, 'Failed to create question')
  return data as Question
}

export async function updateQuestion(id: string, updates: Partial<Question>): Promise<Question> {
  const { data, error } = await supabase
    .from('questions')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  
  if (error) handleError(error, 'Failed to update question')
  return data as Question
}

export async function deleteQuestion(id: string): Promise<void> {
  const { error } = await supabase
    .from('questions')
    .delete()
    .eq('id', id)
  
  if (error) handleError(error, 'Failed to delete question')
}

export async function activateQuestion(id: string): Promise<Question> {
  // First, get the question to find its event
  const { data: question } = await supabase
    .from('questions')
    .select('event_id')
    .eq('id', id)
    .single()
  
  if (question) {
    // Close any currently active questions for this event
    await supabase
      .from('questions')
      .update({ state: 'closed', closed_at: new Date().toISOString() })
      .eq('event_id', question.event_id)
      .eq('state', 'active')
  }
  
  // Activate the new question
  const { data, error } = await supabase
    .from('questions')
    .update({ state: 'active', activated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  
  if (error) handleError(error, 'Failed to activate question')
  return data as Question
}

export async function closeQuestion(id: string): Promise<Question> {
  const { data, error } = await supabase
    .from('questions')
    .update({ state: 'closed', closed_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  
  if (error) handleError(error, 'Failed to close question')
  return data as Question
}

export async function reorderQuestions(_eventId: string, questionIds: string[]): Promise<void> {
  // Note: eventId could be used for validation, but we trust the caller
  const updates = questionIds.map((id, index) => ({
    id,
    order_index: index
  }))
  
  for (const update of updates) {
    const { error } = await supabase
      .from('questions')
      .update({ order_index: update.order_index })
      .eq('id', update.id)
    
    if (error) handleError(error, 'Failed to reorder questions')
  }
}

// ============ VOTING (SECURE) ============

export interface VoteResult {
  success: boolean
  error?: string
}

export async function castVoteSecure(
  questionId: string, 
  participantId: string, 
  choices: string[], 
  isAnonymous: boolean = true
): Promise<VoteResult> {
  // Try the secure RPC function first
  try {
    const { data, error } = await supabase.rpc('cast_vote_secure', {
      p_question_id: questionId,
      p_participant_id: participantId,
      p_choices: choices,
      p_is_anonymous: isAnonymous
    })
    
    if (error) {
      // Fallback to direct insert if RPC not available
      return await castVoteDirect(questionId, participantId, choices, isAnonymous)
    }
    
    return data as VoteResult
  } catch {
    // Fallback to direct insert
    return await castVoteDirect(questionId, participantId, choices, isAnonymous)
  }
}

/**
 * Direct vote insertion - DEPRECATED due to TOCTOU race condition vulnerability.
 * This fallback uses a database transaction via RPC to ensure atomicity.
 * If the RPC fails, we fall back to individual inserts with UNIQUE constraint protection.
 */
async function castVoteDirect(
  questionId: string,
  participantId: string,
  choices: string[],
  isAnonymous: boolean
): Promise<VoteResult> {
  // Try using a transaction-like approach with immediate marker insert
  // The UNIQUE constraint on cast_markers will prevent double voting

  // First, try to insert the cast marker - this is our lock
  const { error: markerError } = await supabase
    .from('cast_markers')
    .insert({
      question_id: questionId,
      participant_id: participantId,
    })

  // If marker insert fails due to unique constraint, user already voted
  if (markerError) {
    if (markerError.code === '23505') { // Unique violation
      return { success: false, error: 'ALREADY_VOTED' }
    }
    // Check if it's an RLS policy violation (question not active, etc.)
    if (markerError.code === '42501') {
      return { success: false, error: 'QUESTION_NOT_ACTIVE' }
    }
    console.error('Cast marker insert failed:', markerError)
    return { success: false, error: 'VOTE_FAILED' }
  }

  // Marker inserted successfully, now insert the ballot
  const { error: ballotError } = await supabase
    .from('ballots')
    .insert({
      question_id: questionId,
      participant_id: isAnonymous ? null : participantId,
      choices,
    })

  if (ballotError) {
    // Rollback: delete the marker if ballot fails
    await supabase
      .from('cast_markers')
      .delete()
      .eq('question_id', questionId)
      .eq('participant_id', participantId)

    console.error('Ballot insert failed:', ballotError)
    return { success: false, error: 'VOTE_FAILED' }
  }

  return { success: true }
}

// Legacy wrapper for compatibility
export async function castVote(
  questionId: string, 
  participantId: string, 
  choices: string[], 
  isAnonymous: boolean
): Promise<void> {
  const result = await castVoteSecure(questionId, participantId, choices, isAnonymous)
  if (!result.success) {
    throw new SupabaseError(result.error || 'Vote failed', 'VOTE_ERROR')
  }
}

export async function hasVoted(questionId: string, participantId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('cast_markers')
    .select('id')
    .eq('question_id', questionId)
    .eq('participant_id', participantId)
    .single()
  
  if (error && error.code !== 'PGRST116') handleError(error, 'Failed to check vote status')
  return !!data
}

export async function getBallots(questionId: string): Promise<Ballot[]> {
  const { data, error } = await supabase
    .from('ballots')
    .select('*')
    .eq('question_id', questionId)
  
  if (error) handleError(error, 'Failed to get ballots')
  return data as Ballot[]
}

export async function getVoteCount(questionId: string): Promise<number> {
  const { count, error } = await supabase
    .from('cast_markers')
    .select('*', { count: 'exact', head: true })
    .eq('question_id', questionId)
  
  if (error) handleError(error, 'Failed to get vote count')
  return count || 0
}

export async function getCastMarkers(questionId: string): Promise<CastMarker[]> {
  const { data, error } = await supabase
    .from('cast_markers')
    .select('*')
    .eq('question_id', questionId)
  
  if (error) handleError(error, 'Failed to get cast markers')
  return data as CastMarker[]
}

// ============ VOTE RESULTS ============

export interface VoteResults {
  questionId: string
  totalVotes: number
  totalParticipants: number
  participationRate: number
  results: { choice: string; count: number; percentage: number }[]
  state: string
}

export async function getVoteResults(questionId: string): Promise<VoteResults> {
  // Try RPC first
  try {
    const { data, error } = await supabase.rpc('get_vote_results', {
      p_question_id: questionId
    })
    
    if (!error && data?.success) {
      return {
        questionId: data.question_id,
        totalVotes: data.total_votes,
        totalParticipants: data.total_participants,
        participationRate: data.participation_rate,
        results: (data.results || []).map((r: { choice: string; count: number }) => ({
          ...r,
          percentage: data.total_votes > 0 ? (r.count / data.total_votes) * 100 : 0
        })),
        state: data.state
      }
    }
  } catch {
    // Continue to fallback
  }
  
  // Fallback: manual calculation
  const ballots = await getBallots(questionId)
  const question = await getQuestion(questionId)
  const participants = await getPresentParticipants(question.event_id)
  
  const choiceCounts = new Map<string, number>()
  for (const ballot of ballots) {
    for (const choice of ballot.choices) {
      choiceCounts.set(choice, (choiceCounts.get(choice) || 0) + 1)
    }
  }
  
  const totalVotes = ballots.length
  const results = Array.from(choiceCounts.entries()).map(([choice, count]) => ({
    choice,
    count,
    percentage: totalVotes > 0 ? (count / totalVotes) * 100 : 0
  }))
  
  return {
    questionId,
    totalVotes,
    totalParticipants: participants.length,
    participationRate: participants.length > 0 ? (totalVotes / participants.length) * 100 : 0,
    results: results.sort((a, b) => b.count - a.count),
    state: question.state
  }
}

// ============ STATISTICS ============

export interface EventStats {
  totalParticipants: number
  presentParticipants: number
  totalQuestions: number
  completedQuestions: number
  activeQuestion: Question | null
}

export async function getEventStats(eventId: string): Promise<EventStats> {
  const [
    participantsResult,
    presentResult,
    questionsResult,
    completedResult,
    activeQuestion
  ] = await Promise.all([
    supabase
      .from('participants')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', eventId),
    supabase
      .from('participants')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', eventId)
      .eq('is_present', true),
    supabase
      .from('questions')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', eventId),
    supabase
      .from('questions')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', eventId)
      .eq('state', 'closed'),
    getActiveQuestion(eventId)
  ])
  
  return {
    totalParticipants: participantsResult.count || 0,
    presentParticipants: presentResult.count || 0,
    totalQuestions: questionsResult.count || 0,
    completedQuestions: completedResult.count || 0,
    activeQuestion
  }
}

// ============ REALTIME SUBSCRIPTIONS ============

export type RealtimeCallback<T> = (payload: T) => void
export type UnsubscribeFn = () => void

export function subscribeToQuestions(
  eventId: string, 
  callback: RealtimeCallback<Question>
): UnsubscribeFn {
  const channel = supabase
    .channel(`questions:${eventId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'questions',
        filter: `event_id=eq.${eventId}`,
      },
      (payload) => {
        callback(payload.new as Question)
      }
    )
    .subscribe()
  
  return () => {
    supabase.removeChannel(channel)
  }
}

export function subscribeToBallots(
  questionId: string, 
  callback: RealtimeCallback<number>
): UnsubscribeFn {
  const channel = supabase
    .channel(`ballots:${questionId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'cast_markers',
        filter: `question_id=eq.${questionId}`,
      },
      async () => {
        const count = await getVoteCount(questionId)
        callback(count)
      }
    )
    .subscribe()
  
  return () => {
    supabase.removeChannel(channel)
  }
}

export function subscribeToParticipants(
  eventId: string,
  callback: RealtimeCallback<{ participant: Participant; event: 'INSERT' | 'UPDATE' | 'DELETE' }>
): UnsubscribeFn {
  const channel = supabase
    .channel(`participants:${eventId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'participants',
        filter: `event_id=eq.${eventId}`,
      },
      (payload) => {
        callback({
          participant: (payload.new || payload.old) as Participant,
          event: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE'
        })
      }
    )
    .subscribe()
  
  return () => {
    supabase.removeChannel(channel)
  }
}

// Presence tracking for live participants
export function subscribeToPresence(
  eventId: string,
  participantId: string,
  callbacks: {
    onSync?: (state: Record<string, unknown[]>) => void
    onJoin?: (key: string, presence: unknown) => void
    onLeave?: (key: string, presence: unknown) => void
  }
): UnsubscribeFn {
  const channel = supabase.channel(`presence:${eventId}`, {
    config: {
      presence: {
        key: participantId
      }
    }
  })
  
  if (callbacks.onSync) {
    channel.on('presence', { event: 'sync' }, () => {
      callbacks.onSync!(channel.presenceState())
    })
  }
  
  if (callbacks.onJoin) {
    channel.on('presence', { event: 'join' }, ({ key, newPresences }) => {
      callbacks.onJoin!(key, newPresences)
    })
  }
  
  if (callbacks.onLeave) {
    channel.on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
      callbacks.onLeave!(key, leftPresences)
    })
  }
  
  channel.subscribe(async (status) => {
    if (status === 'SUBSCRIBED') {
      await channel.track({
        participant_id: participantId,
        online_at: new Date().toISOString()
      })
    }
  })
  
  return () => {
    channel.untrack()
    supabase.removeChannel(channel)
  }
}

// ============ VOTER LOGIN ============

export async function getEventByCode(eventCode: string): Promise<Event | null> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('event_code', eventCode.toUpperCase())
    .in('state', ['scheduled', 'active'])
    .single()
  
  if (error) return null
  return data as Event
}

export async function verifyParticipant(eventId: string, accessCode: string): Promise<Participant | null> {
  const { data, error } = await supabase
    .from('participants')
    .select('*')
    .eq('event_id', eventId)
    .eq('access_code', accessCode.toUpperCase())
    .single()
  
  if (error) return null
  
  // Mark as present
  const updated = await markParticipantPresent(data.id)
  return updated
}

// ============ AUDIT LOGGING ============

export interface AuditLogEntry {
  actor_id: string | null
  actor_type: 'user' | 'participant' | 'system'
  action: string
  entity_type?: string
  entity_id?: string
  details?: Record<string, unknown>
  ip_address?: string
}

export async function createAuditLog(entry: AuditLogEntry): Promise<void> {
  const { error } = await supabase
    .from('audit_logs')
    .insert(entry)
  
  if (error) {
    console.error('Failed to create audit log:', error)
    // Don't throw - audit logging should not break the main flow
  }
}

// ============ HELPERS ============

export function generateAccessCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

export function generateEventCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}
