import { useEffect, useState } from 'react'
import { Calendar, Users, Settings, BarChart3, Loader2 } from 'lucide-react'
import { ScheduleCreator } from './ScheduleCreator'
import { ScheduleVoting } from './ScheduleVoting'
import { ScheduleResults } from './ScheduleResults'
import { useScheduleStore } from '../../../stores/scheduleStore'
import type { Meeting, Member, MemberRole } from '../../../types/v3'

interface MeetingScheduleTabProps {
  meeting: Meeting
  currentMember?: Member
  members?: Member[]
}

type TabId = 'vote' | 'results' | 'manage'

interface Tab {
  id: TabId
  label: string
  icon: typeof Calendar
  roles: MemberRole[]
}

const tabs: Tab[] = [
  { id: 'vote', label: 'Szavazás', icon: Calendar, roles: ['admin', 'chair', 'secretary', 'voter'] },
  { id: 'results', label: 'Eredmények', icon: BarChart3, roles: ['admin', 'chair', 'secretary', 'voter', 'observer'] },
  { id: 'manage', label: 'Kezelés', icon: Settings, roles: ['admin', 'chair', 'secretary'] },
]

export function MeetingScheduleTab({ meeting, currentMember, members = [] }: MeetingScheduleTabProps) {
  const { options, loading, fetchOptions } = useScheduleStore()
  const [activeTab, setActiveTab] = useState<TabId>('vote')

  const canManage = currentMember && ['admin', 'chair', 'secretary'].includes(currentMember.role)
  const canVote = currentMember && ['admin', 'chair', 'secretary', 'voter'].includes(currentMember.role)
  const isScheduled = meeting.status === 'scheduled' || options.some(o => o.is_winner)

  // Load schedule options on mount
  useEffect(() => {
    fetchOptions(meeting.id)
  }, [meeting.id, fetchOptions])

  // Filter tabs by role
  const availableTabs = tabs.filter(tab => {
    if (!currentMember) return tab.id === 'results'
    return tab.roles.includes(currentMember.role)
  })

  // If already scheduled, default to results
  useEffect(() => {
    if (isScheduled && activeTab === 'vote') {
      setActiveTab('results')
    }
  }, [isScheduled, activeTab])

  if (loading && options.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-gold-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Status banner */}
      {isScheduled && (
        <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center">
              <Calendar className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <div className="font-medium text-green-800 dark:text-green-300">
                Gyűlés időpontja kiválasztva
              </div>
              {meeting.scheduled_at && (
                <div className="text-sm text-green-600 dark:text-green-400">
                  {new Date(meeting.scheduled_at).toLocaleDateString('hu-HU', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Participant count */}
      <div className="flex items-center gap-2 text-sm text-obsidian-500 dark:text-obsidian-400">
        <Users className="w-4 h-4" />
        <span>
          {members.filter(m => m.role !== 'observer').length} szavazásra jogosult tag
        </span>
        <span className="text-obsidian-300 dark:text-obsidian-600">•</span>
        <span>
          {new Set(options.flatMap(o => o.votes.map(v => v.member_id))).size} már szavazott
        </span>
      </div>

      {/* Tab navigation */}
      {availableTabs.length > 1 && (
        <div className="flex gap-1 p-1 bg-obsidian-100 dark:bg-obsidian-800 rounded-xl">
          {availableTabs.map(tab => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all flex-1
                  ${isActive 
                    ? 'bg-white dark:bg-obsidian-700 text-obsidian-900 dark:text-ivory-100 shadow-sm' 
                    : 'text-obsidian-500 dark:text-obsidian-400 hover:text-obsidian-700 dark:hover:text-obsidian-200'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            )
          })}
        </div>
      )}

      {/* Tab content */}
      <div className="min-h-[400px]">
        {activeTab === 'vote' && currentMember && (
          <ScheduleVoting
            meetingId={meeting.id}
            memberId={currentMember.id}
            memberName={currentMember.name}
            disabled={!canVote || isScheduled}
          />
        )}

        {activeTab === 'results' && (
          <ScheduleResults
            meetingId={meeting.id}
            canSelectWinner={canManage && !isScheduled}
            showVoterDetails={canManage}
          />
        )}

        {activeTab === 'manage' && canManage && (
          <div className="space-y-6">
            <ScheduleCreator
              meetingId={meeting.id}
              disabled={isScheduled}
            />
            
            {/* Additional admin controls could go here */}
            {isScheduled && (
              <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl">
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  <strong>Megjegyzés:</strong> Az időpont már ki van választva. 
                  Új időpontot a gyűlés státuszának visszaállításával adhat hozzá.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
