/**
 * VoteBox Jegyzőkönyv Generátor
 * Magyar jogi követelményeknek megfelelő közgyűlési jegyzőkönyv generálás
 */

import { supabase } from './supabase'
import type { 
  Organization, 
  Meeting, 
  Member, 
  AgendaItem, 
  Attendance,
  Vote,
  MeetingType,
  AttendanceType,
  VoteValue,
  QuorumResult
} from '../types/v3'

// === Types ===

export interface MinutesInput {
  meetingId: string
}

export interface MinutesOutput {
  markdown: string
  summary?: string
  metadata: {
    generatedAt: string
    templateVersion: string
    meetingTitle: string
    organizationName: string
  }
}

export interface MeetingData {
  organization: Organization
  meeting: Meeting
  members: Member[]
  attendance: AttendanceWithMember[]
  agendaItems: AgendaItemWithVotes[]
  quorum: QuorumResult
}

export interface AttendanceWithMember extends Attendance {
  member: Member
}

export interface AgendaItemWithVotes extends AgendaItem {
  votes: VoteWithMember[]
  resolution?: ResolutionData
}

export interface VoteWithMember extends Vote {
  member?: Member
  proxyFor?: Member
}

export interface ResolutionData {
  number: string
  passed: boolean
  yesPercent: number
  noPercent: number
  abstainPercent: number
  yesCount: number
  noCount: number
  abstainCount: number
  majorityType: string
}

// === Helper Functions ===

function formatDate(date: string | Date): string {
  const d = new Date(date)
  return d.toLocaleDateString('hu-HU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function formatTime(date: string | Date): string {
  const d = new Date(date)
  return d.toLocaleTimeString('hu-HU', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

// formatDateTime not currently used but kept for future use
// function formatDateTime(date: string | Date): string {
//   return `${formatDate(date)} ${formatTime(date)}`
// }

function getMeetingTypeLabel(type: MeetingType): string {
  const labels: Record<MeetingType, string> = {
    regular: 'rendes',
    extraordinary: 'rendkívüli',
    board: 'testületi',
  }
  return labels[type] || type
}

function getAttendanceTypeLabel(type: AttendanceType): string {
  const labels: Record<AttendanceType, string> = {
    in_person: 'személyes',
    online: 'online',
    proxy: 'meghatalmazott útján',
  }
  return labels[type] || type
}

function getMajorityLabel(passed: boolean, majorityType: string): string {
  if (!passed) return 'elutasította'
  
  switch (majorityType) {
    case 'unanimous':
      return 'egyhangúlag elfogadta'
    case 'two_thirds':
      return 'minősített (2/3-os) többséggel elfogadta'
    default:
      return 'egyszerű többséggel elfogadta'
  }
}

function calculateVoteResults(votes: VoteWithMember[]): {
  yes: number
  no: number
  abstain: number
  total: number
  yesWeight: number
  noWeight: number
  abstainWeight: number
  totalWeight: number
} {
  const result = {
    yes: 0,
    no: 0,
    abstain: 0,
    total: 0,
    yesWeight: 0,
    noWeight: 0,
    abstainWeight: 0,
    totalWeight: 0,
  }

  for (const vote of votes) {
    result.total++
    result.totalWeight += vote.weight

    switch (vote.vote as VoteValue) {
      case 'yes':
        result.yes++
        result.yesWeight += vote.weight
        break
      case 'no':
        result.no++
        result.noWeight += vote.weight
        break
      case 'abstain':
        result.abstain++
        result.abstainWeight += vote.weight
        break
    }
  }

  return result
}

// === Data Fetching ===

export async function fetchMeetingData(meetingId: string): Promise<MeetingData> {
  // Fetch meeting with organization
  const { data: meeting, error: meetingError } = await supabase
    .from('meetings')
    .select('*, organizations(*)')
    .eq('id', meetingId)
    .single()

  if (meetingError || !meeting) {
    throw new Error(`Meeting not found: ${meetingError?.message || 'Unknown error'}`)
  }

  const organization = meeting.organizations as Organization

  // Fetch members
  const { data: members, error: membersError } = await supabase
    .from('members')
    .select('*')
    .eq('org_id', organization.id)
    .eq('is_active', true)

  if (membersError) {
    throw new Error(`Failed to fetch members: ${membersError.message}`)
  }

  // Fetch attendance with member info
  const { data: attendanceData, error: attendanceError } = await supabase
    .from('attendance')
    .select('*, members(*)')
    .eq('meeting_id', meetingId)

  if (attendanceError) {
    throw new Error(`Failed to fetch attendance: ${attendanceError.message}`)
  }

  const attendance: AttendanceWithMember[] = (attendanceData || []).map((a) => ({
    ...a,
    member: a.members as Member,
  }))

  // Fetch agenda items
  const { data: agendaData, error: agendaError } = await supabase
    .from('agenda_items')
    .select('*')
    .eq('meeting_id', meetingId)
    .order('order_num', { ascending: true })

  if (agendaError) {
    throw new Error(`Failed to fetch agenda items: ${agendaError.message}`)
  }

  // Fetch votes for each agenda item
  const agendaItems: AgendaItemWithVotes[] = await Promise.all(
    (agendaData || []).map(async (item) => {
      const { data: votes } = await supabase
        .from('votes')
        .select('*')
        .eq('agenda_item_id', item.id)

      const votesWithMembers: VoteWithMember[] = (votes || []).map((v) => ({
        ...v,
        member: members?.find((m) => m.id === v.member_id),
        proxyFor: v.proxy_for_id ? members?.find((m) => m.id === v.proxy_for_id) : undefined,
      }))

      return {
        ...item,
        votes: votesWithMembers,
      } as AgendaItemWithVotes
    })
  )

  // Calculate quorum
  const totalWeight = members?.reduce((sum, m) => sum + m.weight, 0) || 0
  const presentWeight = attendance.reduce((sum, a) => sum + (a.weight_at_checkin || a.member?.weight || 0), 0)
  const quorumPercentage = totalWeight > 0 ? (presentWeight / totalWeight) * 100 : 0

  const quorum: QuorumResult = {
    total_weight: totalWeight,
    present_weight: presentWeight,
    quorum_percentage: quorumPercentage,
    quorum_reached: quorumPercentage >= (meeting.quorum_percentage || 50),
  }

  return {
    organization,
    meeting: meeting as Meeting,
    members: members || [],
    attendance,
    agendaItems,
    quorum,
  }
}

// === Markdown Generation ===

function generateAttendanceTable(attendance: AttendanceWithMember[], totalWeight: number): string {
  if (attendance.length === 0) {
    return '*Nincs regisztrált jelenlévő.*\n'
  }

  let table = '| Név | Tulajdoni hányad | Jelenlét |\n'
  table += '|-----|------------------|----------|\n'

  for (const a of attendance) {
    const weight = a.weight_at_checkin || a.member?.weight || 0
    const weightPercent = totalWeight > 0 ? ((weight / totalWeight) * 100).toFixed(2) : '0'
    table += `| ${a.member?.name || 'Ismeretlen'} | ${weightPercent}% | ${getAttendanceTypeLabel(a.attendance_type)} |\n`
  }

  return table
}

function generateAgendaItemSection(
  item: AgendaItemWithVotes,
  orderNum: number,
  year: number,
  resolutionCounter: { value: number }
): string {
  let section = `## ${orderNum}. NAPIRENDI PONT\n`
  section += `### ${item.title}\n\n`

  if (item.description) {
    section += `${item.description}\n\n`
  }

  // Skip vote section if no voting
  if (item.vote_type === 'none' || item.votes.length === 0) {
    section += '*Szavazás nélküli napirendi pont.*\n\n'
    section += '---\n\n'
    return section
  }

  // Calculate vote results
  const results = calculateVoteResults(item.votes)
  const totalWeight = results.totalWeight || 1

  const yesPercent = ((results.yesWeight / totalWeight) * 100).toFixed(1)
  const noPercent = ((results.noWeight / totalWeight) * 100).toFixed(1)
  const abstainPercent = ((results.abstainWeight / totalWeight) * 100).toFixed(1)

  section += '**Szavazás eredménye:**\n'
  section += `- Igen: ${yesPercent}% (${results.yes} fő)\n`
  section += `- Nem: ${noPercent}% (${results.no} fő)\n`

  if (item.vote_type === 'yes_no_abstain') {
    section += `- Tartózkodott: ${abstainPercent}% (${results.abstain} fő)\n`
  }

  section += '\n'

  // Generate resolution
  const passed = item.result?.passed ?? (results.yesWeight > results.noWeight)
  resolutionCounter.value++
  const resolutionNumber = `${resolutionCounter.value}/${year}`

  section += `### ${resolutionNumber}. számú HATÁROZAT\n`
  section += `A közgyűlés ${getMajorityLabel(passed, item.required_majority)} `
  section += `${passed ? '' : 'nem '}az előterjesztést.\n\n`

  if (passed && item.description) {
    section += `> ${item.description}\n\n`
  }

  section += '---\n\n'

  return section
}

function generateMinutesMarkdown(data: MeetingData): string {
  const { organization, meeting, attendance, agendaItems, quorum } = data
  const year = new Date(meeting.scheduled_at || meeting.created_at).getFullYear()
  const resolutionCounter = { value: 0 }

  let md = '# JEGYZŐKÖNYV\n\n'

  // Header
  md += `Készült: **${organization.name}** `
  md += `${formatDate(meeting.scheduled_at || meeting.created_at)} napján, `
  md += `${formatTime(meeting.scheduled_at || meeting.created_at)}-kor tartott `
  md += `**${getMeetingTypeLabel(meeting.type)}** közgyűléséről.\n\n`

  if (meeting.location) {
    md += `**Helyszín:** ${meeting.location}\n\n`
  }

  // Attendance section
  md += '## Jelen vannak:\n\n'
  md += generateAttendanceTable(attendance, quorum.total_weight)
  md += '\n'

  const presentCount = attendance.length
  const presentPercent = quorum.quorum_percentage.toFixed(1)
  md += `**Összesen:** ${presentCount} fő, ${presentPercent}% tulajdoni hányad képviseletében\n\n`

  // Quorum
  const quorumReachedText = quorum.quorum_reached ? 'határozatképes' : 'nem határozatképes'
  md += `**Határozatképesség:** A közgyűlés **${quorumReachedText}**, `
  md += `mivel a tulajdoni hányadok ${presentPercent}%-a képviseltette magát `
  md += `(szükséges: ${meeting.quorum_percentage}%).\n\n`

  // Officials (placeholders)
  md += '**Levezető elnök:** _______________________\n\n'
  md += '**Jegyzőkönyvvezető:** _______________________\n\n'
  md += '**Jegyzőkönyv hitelesítők:** _______________________, _______________________\n\n'

  md += '---\n\n'

  // Agenda items
  for (const item of agendaItems) {
    md += generateAgendaItemSection(item, item.order_num, year, resolutionCounter)
  }

  // Closing
  md += '## Zárás\n\n'
  
  if (meeting.ended_at) {
    md += `A levezető elnök a közgyűlést ${formatTime(meeting.ended_at)}-kor bezárta.\n\n`
  } else {
    md += 'A levezető elnök a közgyűlést _______-kor bezárta.\n\n'
  }

  const city = meeting.location?.split(',')[0] || '_______'
  md += `Kelt: ${city}, ${formatDate(meeting.scheduled_at || meeting.created_at)}\n\n`

  // Signature lines
  md += '```\n'
  md += '_____________________          _____________________\n'
  md += '   Levezető elnök               Jegyzőkönyvvezető   \n\n'
  md += '_____________________          _____________________\n'
  md += ' Jegyzőkönyv hitelesítő 1      Jegyzőkönyv hitelesítő 2\n'
  md += '```\n'

  return md
}

// === Main Export ===

export async function generateMinutes(input: MinutesInput): Promise<MinutesOutput> {
  const data = await fetchMeetingData(input.meetingId)
  const markdown = generateMinutesMarkdown(data)

  return {
    markdown,
    metadata: {
      generatedAt: new Date().toISOString(),
      templateVersion: 'v1',
      meetingTitle: data.meeting.title,
      organizationName: data.organization.name,
    },
  }
}

// === AI Summary (optional placeholder) ===

export async function generateAISummary(_markdown: string): Promise<string | undefined> {
  // Placeholder for future AI integration
  // Could use OpenAI, Anthropic, or other LLM APIs
  return undefined
}
