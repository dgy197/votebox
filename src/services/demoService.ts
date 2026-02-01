/**
 * Demo Mode Backend Service
 * Mock data service for offline/demo mode when Supabase is not available
 */

import type { Event, Participant, Question, Ballot, CastMarker, Organization, User } from '../types'

// ============ DEMO DATA STORE ============

interface DemoStore {
  organizations: Organization[]
  users: User[]
  events: Event[]
  participants: Participant[]
  questions: Question[]
  ballots: Ballot[]
  castMarkers: CastMarker[]
}

const generateId = () => crypto.randomUUID()

const now = () => new Date().toISOString()

// Initial demo data
// Factory functions to create fresh demo data
function createDemoOrg(): Organization {
  return {
    id: 'demo-org-1',
    name: 'Demo Szervezet',
    slug: 'demo',
    settings: { demo: true },
    created_at: now()
  }
}

function createDemoUser(orgId: string): User {
  return {
    id: 'demo-user-1',
    email: 'admin@demo.local',
    role: 'org_admin',
    organization_id: orgId,
    created_at: now()
  }
}

function createDemoEvent(orgId: string, userId: string): Event {
  return {
    id: 'demo-event-1',
    organization_id: orgId,
    name: 'Demo Közgyűlés 2025',
    description: 'Ez egy demo esemény a teszteléshez',
    event_code: 'DEMO25',
    starts_at: now(),
    ends_at: null,
    timezone: 'Europe/Budapest',
    quorum_type: 'percentage',
    quorum_value: 50,
    quorum_percent: 50,
    state: 'active',
    created_by: userId,
    created_at: now()
  }
}

function createDemoParticipants(eventId: string): Participant[] {
  return [
    {
      id: 'demo-participant-1',
      event_id: eventId,
      name: 'Kovács János',
      email: 'kovacs@demo.local',
      access_code: 'ABC123',
      is_present: true,
      joined_at: now(),
      created_at: now()
    },
    {
      id: 'demo-participant-2',
      event_id: eventId,
      name: 'Nagy Mária',
      email: 'nagy@demo.local',
      access_code: 'DEF456',
      is_present: true,
      joined_at: now(),
      created_at: now()
    },
    {
      id: 'demo-participant-3',
      event_id: eventId,
      name: 'Szabó Péter',
      email: 'szabo@demo.local',
      access_code: 'GHI789',
      is_present: false,
      joined_at: null,
      created_at: now()
    }
  ]
}

function createDemoQuestions(eventId: string): Question[] {
  return [
    {
      id: 'demo-question-1',
      event_id: eventId,
      text_hu: 'Elfogadja-e az éves költségvetést?',
      text_en: 'Do you accept the annual budget?',
      type: 'binary',
      options: null,
      min_select: 1,
      max_select: 1,
      threshold_type: 'simple_majority',
      abstain_counts: true,
      is_anonymous: true,
      randomize_options: false,
      time_limit_seconds: 60,
      state: 'active',
      order_index: 0,
      activated_at: now(),
      closed_at: null,
      created_at: now()
    },
    {
      id: 'demo-question-2',
      event_id: eventId,
      text_hu: 'Melyik javaslatot támogatja?',
      text_en: 'Which proposal do you support?',
      type: 'single',
      options: [
        { id: 'opt-a', label_hu: 'A javaslat', label_en: 'Proposal A' },
        { id: 'opt-b', label_hu: 'B javaslat', label_en: 'Proposal B' },
        { id: 'opt-c', label_hu: 'C javaslat', label_en: 'Proposal C' }
      ],
      min_select: 1,
      max_select: 1,
      threshold_type: 'simple_majority',
      abstain_counts: false,
      is_anonymous: true,
      randomize_options: true,
      time_limit_seconds: null,
      state: 'draft',
      order_index: 1,
      activated_at: null,
      closed_at: null,
      created_at: now()
    }
  ]
}

function createFreshStore(): DemoStore {
  const org = createDemoOrg()
  const user = createDemoUser(org.id)
  const event = createDemoEvent(org.id, user.id)
  const participants = createDemoParticipants(event.id)
  const questions = createDemoQuestions(event.id)
  
  return {
    organizations: [org],
    users: [user],
    events: [event],
    participants,
    questions,
    ballots: [],
    castMarkers: []
  }
}

// In-memory store
let store: DemoStore = createFreshStore()

// Helper to get default org/user from current store
function getDefaultOrg(): Organization {
  return store.organizations[0]
}

function getDefaultUser(): User {
  return store.users[0]
}

function getDefaultEvent(): Event {
  return store.events[0]
}

// ============ DEMO MODE STATE ============

let isDemoMode = false
const listeners = new Set<(enabled: boolean) => void>()

export function enableDemoMode(): void {
  isDemoMode = true
  console.log('🎭 Demo mode enabled - using mock data')
  listeners.forEach(fn => fn(true))
}

export function disableDemoMode(): void {
  isDemoMode = false
  console.log('🔌 Demo mode disabled - using Supabase')
  listeners.forEach(fn => fn(false))
}

export function isDemoModeEnabled(): boolean {
  return isDemoMode
}

export function onDemoModeChange(callback: (enabled: boolean) => void): () => void {
  listeners.add(callback)
  return () => listeners.delete(callback)
}

export function resetDemoData(): void {
  store = createFreshStore()
  console.log('🔄 Demo data reset')
}

// ============ ORGANIZATIONS ============

export async function getOrganizations(): Promise<Organization[]> {
  return [...store.organizations]
}

export async function getOrganization(id: string): Promise<Organization> {
  const org = store.organizations.find(o => o.id === id)
  if (!org) throw new Error('Organization not found')
  return { ...org }
}

export async function createOrganization(data: { name: string; slug: string }): Promise<Organization> {
  const org: Organization = {
    id: generateId(),
    name: data.name,
    slug: data.slug,
    settings: {},
    created_at: now()
  }
  store.organizations.push(org)
  return { ...org }
}

export async function updateOrganization(id: string, updates: Partial<Organization>): Promise<Organization> {
  const index = store.organizations.findIndex(o => o.id === id)
  if (index === -1) throw new Error('Organization not found')
  store.organizations[index] = { ...store.organizations[index], ...updates }
  return { ...store.organizations[index] }
}

export async function deleteOrganization(id: string): Promise<void> {
  store.organizations = store.organizations.filter(o => o.id !== id)
}

// ============ USERS ============

export async function getAllUsers(): Promise<User[]> {
  return [...store.users]
}

export async function getOrgUsers(organizationId: string): Promise<User[]> {
  return store.users.filter(u => u.organization_id === organizationId)
}

// ============ EVENTS ============

export async function getEvents(organizationId: string): Promise<Event[]> {
  return store.events.filter(e => e.organization_id === organizationId)
}

export async function getAllEvents(): Promise<Event[]> {
  return [...store.events]
}

export async function getEvent(id: string): Promise<Event> {
  const event = store.events.find(e => e.id === id)
  if (!event) throw new Error('Event not found')
  return { ...event }
}

export async function createEvent(data: Partial<Event>): Promise<Event> {
  const event: Event = {
    id: generateId(),
    organization_id: data.organization_id || getDefaultOrg().id,
    name: data.name || 'Új esemény',
    description: data.description || null,
    event_code: data.event_code || generateEventCode(),
    starts_at: data.starts_at || null,
    ends_at: data.ends_at || null,
    timezone: data.timezone || 'Europe/Budapest',
    quorum_type: data.quorum_type || 'percentage',
    quorum_value: data.quorum_value ?? 50,
    quorum_percent: data.quorum_percent || null,
    state: data.state || 'draft',
    created_by: data.created_by || getDefaultUser().id,
    created_at: now()
  }
  store.events.push(event)
  return { ...event }
}

export async function updateEvent(id: string, updates: Partial<Event>): Promise<Event> {
  const index = store.events.findIndex(e => e.id === id)
  if (index === -1) throw new Error('Event not found')
  store.events[index] = { ...store.events[index], ...updates }
  return { ...store.events[index] }
}

export async function deleteEvent(id: string): Promise<void> {
  store.events = store.events.filter(e => e.id !== id)
  store.participants = store.participants.filter(p => p.event_id !== id)
  store.questions = store.questions.filter(q => q.event_id !== id)
}

export async function getEventByCode(eventCode: string): Promise<Event | null> {
  const event = store.events.find(
    e => e.event_code.toUpperCase() === eventCode.toUpperCase() && 
    ['scheduled', 'active'].includes(e.state)
  )
  return event ? { ...event } : null
}

// ============ PARTICIPANTS ============

export async function getParticipants(eventId: string): Promise<Participant[]> {
  return store.participants.filter(p => p.event_id === eventId)
}

export async function getParticipant(id: string): Promise<Participant> {
  const participant = store.participants.find(p => p.id === id)
  if (!participant) throw new Error('Participant not found')
  return { ...participant }
}

export async function getPresentParticipants(eventId: string): Promise<Participant[]> {
  return store.participants.filter(p => p.event_id === eventId && p.is_present)
}

export async function createParticipant(data: Partial<Participant>): Promise<Participant> {
  const participant: Participant = {
    id: generateId(),
    event_id: data.event_id || getDefaultEvent().id,
    name: data.name || 'Új résztvevő',
    email: data.email || null,
    access_code: data.access_code || generateAccessCode(),
    is_present: data.is_present || false,
    joined_at: data.joined_at || null,
    created_at: now()
  }
  store.participants.push(participant)
  return { ...participant }
}

export async function createParticipants(participants: Partial<Participant>[]): Promise<Participant[]> {
  return Promise.all(participants.map(p => createParticipant(p)))
}

export async function updateParticipant(id: string, updates: Partial<Participant>): Promise<Participant> {
  const index = store.participants.findIndex(p => p.id === id)
  if (index === -1) throw new Error('Participant not found')
  store.participants[index] = { ...store.participants[index], ...updates }
  return { ...store.participants[index] }
}

export async function deleteParticipant(id: string): Promise<void> {
  store.participants = store.participants.filter(p => p.id !== id)
}

export async function verifyParticipant(eventId: string, accessCode: string): Promise<Participant | null> {
  const participant = store.participants.find(
    p => p.event_id === eventId && p.access_code.toUpperCase() === accessCode.toUpperCase()
  )
  if (!participant) return null
  
  // Mark as present
  participant.is_present = true
  participant.joined_at = now()
  return { ...participant }
}

// ============ QUESTIONS ============

export async function getQuestions(eventId: string): Promise<Question[]> {
  return store.questions
    .filter(q => q.event_id === eventId)
    .sort((a, b) => a.order_index - b.order_index)
}

export async function getQuestion(id: string): Promise<Question> {
  const question = store.questions.find(q => q.id === id)
  if (!question) throw new Error('Question not found')
  return { ...question }
}

export async function getActiveQuestion(eventId: string): Promise<Question | null> {
  const question = store.questions.find(q => q.event_id === eventId && q.state === 'active')
  return question ? { ...question } : null
}

export async function createQuestion(data: Partial<Question>): Promise<Question> {
  const eventQuestions = store.questions.filter(q => q.event_id === data.event_id)
  const question: Question = {
    id: generateId(),
    event_id: data.event_id || getDefaultEvent().id,
    text_hu: data.text_hu || 'Új kérdés',
    text_en: data.text_en || null,
    type: data.type || 'binary',
    options: data.options || null,
    min_select: data.min_select || 1,
    max_select: data.max_select || 1,
    threshold_type: data.threshold_type || 'simple_majority',
    abstain_counts: data.abstain_counts ?? true,
    is_anonymous: data.is_anonymous ?? true,
    randomize_options: data.randomize_options ?? false,
    time_limit_seconds: data.time_limit_seconds || null,
    state: data.state || 'draft',
    order_index: data.order_index ?? eventQuestions.length,
    activated_at: data.activated_at || null,
    closed_at: data.closed_at || null,
    created_at: now()
  }
  store.questions.push(question)
  return { ...question }
}

export async function updateQuestion(id: string, updates: Partial<Question>): Promise<Question> {
  const index = store.questions.findIndex(q => q.id === id)
  if (index === -1) throw new Error('Question not found')
  store.questions[index] = { ...store.questions[index], ...updates }
  return { ...store.questions[index] }
}

export async function deleteQuestion(id: string): Promise<void> {
  store.questions = store.questions.filter(q => q.id !== id)
  store.ballots = store.ballots.filter(b => b.question_id !== id)
  store.castMarkers = store.castMarkers.filter(c => c.question_id !== id)
}

export async function activateQuestion(id: string): Promise<Question> {
  const question = store.questions.find(q => q.id === id)
  if (!question) throw new Error('Question not found')
  
  // Close any active questions for this event
  store.questions.forEach(q => {
    if (q.event_id === question.event_id && q.state === 'active') {
      q.state = 'closed'
      q.closed_at = now()
    }
  })
  
  // Activate this question
  question.state = 'active'
  question.activated_at = now()
  
  // Notify listeners
  notifyQuestionChange(question)
  
  return { ...question }
}

export async function closeQuestion(id: string): Promise<Question> {
  const question = store.questions.find(q => q.id === id)
  if (!question) throw new Error('Question not found')
  
  question.state = 'closed'
  question.closed_at = now()
  
  notifyQuestionChange(question)
  
  return { ...question }
}

// ============ VOTING ============

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
  // Check if already voted
  const existingVote = store.castMarkers.find(
    c => c.question_id === questionId && c.participant_id === participantId
  )
  if (existingVote) {
    return { success: false, error: 'ALREADY_VOTED' }
  }
  
  // Check question state
  const question = store.questions.find(q => q.id === questionId)
  if (!question || question.state !== 'active') {
    return { success: false, error: 'QUESTION_NOT_ACTIVE' }
  }
  
  // Check time limit
  if (question.time_limit_seconds && question.activated_at) {
    const activatedAt = new Date(question.activated_at)
    const deadline = new Date(activatedAt.getTime() + question.time_limit_seconds * 1000)
    if (new Date() > deadline) {
      return { success: false, error: 'TIME_EXPIRED' }
    }
  }
  
  // Check participant
  const participant = store.participants.find(p => p.id === participantId)
  if (!participant || !participant.is_present) {
    return { success: false, error: 'PARTICIPANT_NOT_PRESENT' }
  }
  
  // Create ballot
  const ballot: Ballot = {
    id: generateId(),
    question_id: questionId,
    participant_id: isAnonymous ? null : participantId,
    choices,
    created_at: now()
  }
  store.ballots.push(ballot)
  
  // Create cast marker
  const marker: CastMarker = {
    id: generateId(),
    question_id: questionId,
    participant_id: participantId,
    cast_at: now()
  }
  store.castMarkers.push(marker)
  
  // Notify listeners
  notifyVoteChange(questionId)
  
  return { success: true }
}

export async function hasVoted(questionId: string, participantId: string): Promise<boolean> {
  return store.castMarkers.some(
    c => c.question_id === questionId && c.participant_id === participantId
  )
}

export async function getVoteCount(questionId: string): Promise<number> {
  return store.castMarkers.filter(c => c.question_id === questionId).length
}

export async function getBallots(questionId: string): Promise<Ballot[]> {
  return store.ballots.filter(b => b.question_id === questionId)
}

export async function getCastMarkers(questionId: string): Promise<CastMarker[]> {
  return store.castMarkers.filter(c => c.question_id === questionId)
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
  const question = store.questions.find(q => q.id === questionId)
  if (!question) throw new Error('Question not found')
  
  const ballots = store.ballots.filter(b => b.question_id === questionId)
  const participants = store.participants.filter(
    p => p.event_id === question.event_id && p.is_present
  )
  
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
  const participants = store.participants.filter(p => p.event_id === eventId)
  const questions = store.questions.filter(q => q.event_id === eventId)
  
  return {
    totalParticipants: participants.length,
    presentParticipants: participants.filter(p => p.is_present).length,
    totalQuestions: questions.length,
    completedQuestions: questions.filter(q => q.state === 'closed').length,
    activeQuestion: questions.find(q => q.state === 'active') || null
  }
}

// ============ REALTIME SIMULATION ============

type QuestionCallback = (question: Question) => void
type VoteCallback = (count: number) => void
type ParticipantCallback = (data: { participant: Participant; event: 'INSERT' | 'UPDATE' | 'DELETE' }) => void

const questionListeners = new Map<string, Set<QuestionCallback>>()
const voteListeners = new Map<string, Set<VoteCallback>>()
const participantListeners = new Map<string, Set<ParticipantCallback>>()

function notifyQuestionChange(question: Question): void {
  const listeners = questionListeners.get(question.event_id)
  listeners?.forEach(fn => fn(question))
}

function notifyVoteChange(questionId: string): void {
  const count = store.castMarkers.filter(c => c.question_id === questionId).length
  const listeners = voteListeners.get(questionId)
  listeners?.forEach(fn => fn(count))
}

export function subscribeToQuestions(
  eventId: string,
  callback: QuestionCallback
): () => void {
  if (!questionListeners.has(eventId)) {
    questionListeners.set(eventId, new Set())
  }
  questionListeners.get(eventId)!.add(callback)
  
  return () => {
    questionListeners.get(eventId)?.delete(callback)
  }
}

export function subscribeToBallots(
  questionId: string,
  callback: VoteCallback
): () => void {
  if (!voteListeners.has(questionId)) {
    voteListeners.set(questionId, new Set())
  }
  voteListeners.get(questionId)!.add(callback)
  
  return () => {
    voteListeners.get(questionId)?.delete(callback)
  }
}

export function subscribeToParticipants(
  eventId: string,
  callback: ParticipantCallback
): () => void {
  if (!participantListeners.has(eventId)) {
    participantListeners.set(eventId, new Set())
  }
  participantListeners.get(eventId)!.add(callback)
  
  return () => {
    participantListeners.get(eventId)?.delete(callback)
  }
}

export function subscribeToPresence(
  _eventId: string,
  _participantId: string,
  _callbacks: {
    onSync?: (state: Record<string, unknown[]>) => void
    onJoin?: (key: string, presence: unknown) => void
    onLeave?: (key: string, presence: unknown) => void
  }
): () => void {
  // Demo mode: presence is simulated by participant is_present field
  // No real-time tracking, but the callbacks are set up for compatibility
  return () => {}
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

// ============ CONNECTION CHECK ============

export async function checkConnection(): Promise<boolean> {
  // Demo mode is always "connected"
  return true
}
