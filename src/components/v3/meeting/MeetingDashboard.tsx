/**
 * MeetingDashboard Component
 * Real-time meeting management with quorum tracking and attendance
 */

import { useState, useCallback, useMemo } from 'react'
import { 
  Play, Pause, StopCircle, Users, ClipboardCheck, 
  AlertTriangle, CheckCircle, Wifi, WifiOff
} from 'lucide-react'
import { Card, Button, Badge } from '../../ui'
import { QuorumTracker } from '../quorum'
import { AttendanceList } from '../attendance'
import { useMemberStore } from '../../../stores/memberStore'
import { useMeetingStore } from '../../../stores/meetingStore'
import type { Meeting, MeetingStatus } from '../../../types/v3'
import type { AttendanceChange } from '../../../hooks/useRealtimeQuorum'

// ============ Types ============

interface MeetingDashboardProps {
  meeting: Meeting
  orgId: string
  onStartMeeting?: () => void
  onPauseMeeting?: () => void
  onEndMeeting?: () => void
}

type TabId = 'quorum' | 'attendance'

// ============ Status Badge ============

function MeetingStatusBadge({ status }: { status: MeetingStatus }) {
  const config: Record<MeetingStatus, { label: string; variant: 'success' | 'warning' | 'secondary' | 'primary' }> = {
    draft: { label: 'Vázlat', variant: 'secondary' },
    scheduling: { label: 'Időpontegyeztetés', variant: 'primary' },
    scheduled: { label: 'Ütemezve', variant: 'primary' },
    in_progress: { label: 'Folyamatban', variant: 'success' },
    completed: { label: 'Befejezve', variant: 'secondary' },
    cancelled: { label: 'Törölve', variant: 'warning' },
  }

  const { label, variant } = config[status] || config.draft

  return <Badge variant={variant}>{label}</Badge>
}

// ============ Main Component ============

export function MeetingDashboard({
  meeting,
  orgId,
  onStartMeeting,
  onPauseMeeting,
  onEndMeeting,
}: MeetingDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabId>('quorum')
  const [quorumReached, setQuorumReached] = useState(false)
  const [lastAttendanceChange, setLastAttendanceChange] = useState<AttendanceChange | null>(null)
  
  const { members } = useMemberStore()
  const { updateMeeting } = useMeetingStore()

  // Get active voting members
  const votingMembers = useMemo(() => 
    members.filter(m => m.is_active && m.role !== 'observer'),
    [members]
  )

  // Callbacks
  const handleQuorumReached = useCallback(() => {
    setQuorumReached(true)
  }, [])

  const handleAttendanceChange = useCallback((change: AttendanceChange) => {
    setLastAttendanceChange(change)
  }, [])

  const handleStartMeeting = useCallback(async () => {
    if (!quorumReached) return
    
    await updateMeeting(meeting.id, { status: 'in_progress' })
    onStartMeeting?.()
  }, [meeting.id, quorumReached, updateMeeting, onStartMeeting])

  const handleEndMeeting = useCallback(async () => {
    await updateMeeting(meeting.id, { 
      status: 'completed',
      ended_at: new Date().toISOString()
    })
    onEndMeeting?.()
  }, [meeting.id, updateMeeting, onEndMeeting])

  const isActive = meeting.status === 'in_progress'
  const canStart = meeting.status === 'scheduled' && quorumReached

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {meeting.title}
              </h2>
              <MeetingStatusBadge status={meeting.status} />
            </div>
            {meeting.description && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {meeting.description}
              </p>
            )}
            {meeting.scheduled_at && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                📅 {new Date(meeting.scheduled_at).toLocaleString('hu-HU')}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            {meeting.status === 'scheduled' && (
              <Button
                variant="primary"
                onClick={handleStartMeeting}
                disabled={!canStart}
                className="flex items-center gap-2"
              >
                <Play className="w-4 h-4" />
                Gyűlés indítása
              </Button>
            )}

            {isActive && (
              <>
                <Button
                  variant="secondary"
                  onClick={onPauseMeeting}
                  className="flex items-center gap-2"
                >
                  <Pause className="w-4 h-4" />
                  Szünet
                </Button>
                <Button
                  variant="danger"
                  onClick={handleEndMeeting}
                  className="flex items-center gap-2"
                >
                  <StopCircle className="w-4 h-4" />
                  Befejezés
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Warning if no quorum */}
        {meeting.status === 'scheduled' && !quorumReached && (
          <div className="mt-4 p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-orange-500 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-orange-700 dark:text-orange-400">
                A gyűlés nem indítható
              </p>
              <p className="text-sm text-orange-600 dark:text-orange-500">
                Várakozás a quorum elérésére ({meeting.quorum_percentage}% szükséges)
              </p>
            </div>
          </div>
        )}

        {/* Success message when quorum reached */}
        {meeting.status === 'scheduled' && quorumReached && (
          <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-green-700 dark:text-green-400">
                Quorum elérve!
              </p>
              <p className="text-sm text-green-600 dark:text-green-500">
                A gyűlés megkezdhető
              </p>
            </div>
          </div>
        )}
      </Card>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('quorum')}
          className={`
            px-4 py-2 text-sm font-medium border-b-2 transition-colors
            ${activeTab === 'quorum' 
              ? 'border-blue-500 text-blue-600 dark:text-blue-400' 
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
            }
          `}
        >
          <span className="flex items-center gap-2">
            <ClipboardCheck className="w-4 h-4" />
            Quorum
          </span>
        </button>
        <button
          onClick={() => setActiveTab('attendance')}
          className={`
            px-4 py-2 text-sm font-medium border-b-2 transition-colors
            ${activeTab === 'attendance' 
              ? 'border-blue-500 text-blue-600 dark:text-blue-400' 
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
            }
          `}
        >
          <span className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Jelenléti ív
          </span>
        </button>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'quorum' && (
          <QuorumTracker
            meetingId={meeting.id}
            orgId={orgId}
            members={votingMembers}
            quorumPercentage={meeting.quorum_percentage}
            onQuorumReached={handleQuorumReached}
            onAttendanceChange={handleAttendanceChange}
            showNotifications
          />
        )}

        {activeTab === 'attendance' && (
          <AttendanceList
            meetingId={meeting.id}
            orgId={orgId}
            isActive={isActive || meeting.status === 'scheduled'}
          />
        )}
      </div>
    </div>
  )
}

// ============ Compact Dashboard Widget ============

interface QuorumWidgetProps {
  meetingId: string
  orgId: string
  quorumPercentage: number
  onQuorumReached?: () => void
}

export function QuorumWidget({ 
  meetingId, 
  orgId, 
  quorumPercentage,
  onQuorumReached 
}: QuorumWidgetProps) {
  const { members } = useMemberStore()
  
  const votingMembers = useMemo(() => 
    members.filter(m => m.is_active && m.role !== 'observer'),
    [members]
  )

  return (
    <QuorumTracker
      meetingId={meetingId}
      orgId={orgId}
      members={votingMembers}
      quorumPercentage={quorumPercentage}
      onQuorumReached={onQuorumReached}
      compact
      showNotifications={false}
    />
  )
}

export default MeetingDashboard
