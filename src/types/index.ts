// Database types

export interface Organization {
  id: string
  name: string
  slug: string
  settings: Record<string, unknown>
  created_at: string
}

export interface User {
  id: string
  email: string
  role: 'super_admin' | 'org_admin'
  organization_id: string | null
  created_at: string
}

export type EventState = 'draft' | 'scheduled' | 'active' | 'closed' | 'archived'
export type QuorumType = 'none' | 'percentage' | 'fixed'

export interface Event {
  id: string
  organization_id: string
  name: string
  description: string | null
  event_code: string
  starts_at: string | null
  ends_at: string | null
  timezone: string
  quorum_type: QuorumType
  quorum_value: number
  quorum_percent: number | null // deprecated, kept for backwards compatibility
  state: EventState
  created_by: string
  created_at: string
}

export interface Participant {
  id: string
  event_id: string
  name: string
  email: string | null
  access_code: string
  is_present: boolean
  joined_at: string | null
  created_at: string
}

export type QuestionType = 'binary' | 'single' | 'multi'
export type ThresholdType = 'simple_majority' | 'two_thirds' | 'absolute'
export type QuestionState = 'draft' | 'active' | 'closed'

export interface QuestionOption {
  id: string
  label_hu: string
  label_en?: string
}

export interface Question {
  id: string
  event_id: string
  text_hu: string
  text_en: string | null
  type: QuestionType
  options: QuestionOption[] | null
  min_select: number
  max_select: number
  threshold_type: ThresholdType
  abstain_counts: boolean
  is_anonymous: boolean
  randomize_options: boolean
  time_limit_seconds: number | null
  state: QuestionState
  order_index: number
  activated_at: string | null
  closed_at: string | null
  created_at: string
}

export interface Ballot {
  id: string
  question_id: string
  participant_id: string | null // null = anonymous
  choices: string[]
  created_at: string
}

export interface CastMarker {
  id: string
  question_id: string
  participant_id: string
  cast_at: string
}

// UI types

export type Theme = 'light' | 'dark' | 'system'
export type Language = 'hu' | 'en'

export interface VoteChoice {
  questionId: string
  choices: string[]
}

export interface QuestionResults {
  questionId: string
  totalVotes: number
  totalParticipants: number
  options: {
    id: string
    label: string
    count: number
    percentage: number
  }[]
  isAccepted: boolean
}

// Super Admin types
export type UserRole = 'super_admin' | 'org_admin' | 'viewer';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  created_at: string;
  settings: Record<string, unknown>;
}

export interface UserOrganization {
  user_id: string;
  org_id: string;
  role: 'owner' | 'admin' | 'viewer';
  created_at: string;
}
