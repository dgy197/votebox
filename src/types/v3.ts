// VoteBox 3.0 Types

// Organization types
export type OrganizationType = 'condominium' | 'company' | 'association' | 'cooperative' | 'other'

export interface Organization {
  id: string
  name: string
  type: OrganizationType
  settings: Record<string, unknown>
  logo_url?: string
  created_at: string
  updated_at: string
}

// Member types
export type MemberRole = 'admin' | 'chair' | 'secretary' | 'voter' | 'observer'

export interface Member {
  id: string
  org_id: string
  user_id?: string
  name: string
  email?: string
  phone?: string
  weight: number
  weight_label?: string
  role: MemberRole
  is_active: boolean
  created_at: string
  updated_at: string
}

// Proxy types
export interface Proxy {
  id: string
  org_id: string
  grantor_id: string
  grantee_id: string
  meeting_id?: string
  valid_from: string
  valid_until?: string
  document_url?: string
  created_at: string
}

// Meeting types
export type MeetingType = 'regular' | 'extraordinary' | 'board'
export type MeetingStatus = 'draft' | 'scheduling' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
export type LocationType = 'in_person' | 'online' | 'hybrid'
export type QuorumType = 'majority' | 'two_thirds' | 'unanimous' | 'custom'

export interface Meeting {
  id: string
  org_id: string
  title: string
  description?: string
  type: MeetingType
  status: MeetingStatus
  scheduled_at?: string
  ended_at?: string
  location?: string
  location_type: LocationType
  meeting_url?: string
  quorum_type: QuorumType
  quorum_percentage: number
  quorum_reached: boolean
  recording_enabled: boolean
  recording_url?: string
  transcript?: string
  created_by?: string
  created_at: string
  updated_at: string
}

// Schedule (Doodle) types
export interface ScheduleOption {
  id: string
  meeting_id: string
  datetime: string
  duration_minutes: number
  is_winner: boolean
  created_at: string
}

export type ScheduleVoteValue = 'yes' | 'maybe' | 'no'

export interface ScheduleVote {
  id: string
  option_id: string
  member_id: string
  vote: ScheduleVoteValue
  comment?: string
  created_at: string
}

// Agenda types
export type VoteType = 'yes_no' | 'yes_no_abstain' | 'multiple_choice' | 'ranking' | 'election' | 'none'
export type RequiredMajority = 'simple' | 'two_thirds' | 'unanimous'
export type AgendaItemStatus = 'pending' | 'in_progress' | 'voting' | 'completed'

export interface VoteResult {
  yes: number
  no: number
  abstain: number
  total_votes: number
  total_weight: number
  passed: boolean
}

export interface AgendaItem {
  id: string
  meeting_id: string
  order_num: number
  title: string
  description?: string
  vote_type: VoteType
  vote_options?: string[]
  is_secret: boolean
  required_majority: RequiredMajority
  status: AgendaItemStatus
  result?: VoteResult
  created_at: string
}

// Vote types
export type VoteValue = 'yes' | 'no' | 'abstain'

export interface Vote {
  id: string
  agenda_item_id: string
  member_id: string
  vote: string
  vote_value?: number
  weight: number
  is_proxy: boolean
  proxy_for_id?: string
  ip_address?: string
  user_agent?: string
  created_at: string
}

// Attendance types
export type AttendanceType = 'in_person' | 'online' | 'proxy'

export interface Attendance {
  id: string
  meeting_id: string
  member_id: string
  checked_in_at: string
  checked_out_at?: string
  attendance_type: AttendanceType
  weight_at_checkin?: number
}

// Document types
export type DocumentType = 'agenda' | 'proposal' | 'minutes' | 'proxy' | 'attachment' | 'recording' | 'other'

export interface Document {
  id: string
  org_id: string
  meeting_id?: string
  type: DocumentType
  name: string
  description?: string
  file_url: string
  file_size?: number
  mime_type?: string
  uploaded_by?: string
  created_at: string
}

// Minutes types
export type MinutesStatus = 'draft' | 'review' | 'final' | 'signed'

export interface SignatureRecord {
  member_id: string
  role: string
  signed_at: string
}

export interface Minutes {
  id: string
  meeting_id: string
  content?: string
  ai_summary?: string
  signed_by?: SignatureRecord[]
  pdf_url?: string
  status: MinutesStatus
  created_at: string
  updated_at: string
}

// Audit log types
export interface AuditLogEntry {
  id: string
  org_id: string
  user_id?: string
  member_id?: string
  action: string
  entity_type?: string
  entity_id?: string
  details?: Record<string, unknown>
  ip_address?: string
  created_at: string
}

// Quorum calculation result
export interface QuorumResult {
  total_weight: number
  present_weight: number
  quorum_percentage: number
  quorum_reached: boolean
}
