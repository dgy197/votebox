import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar, Plus, MapPin, Video, Users } from 'lucide-react'
import { useMeetingStore } from '../../../stores/meetingStore'
import { Button, Card, Spinner, Badge } from '../../ui'
import type { Meeting, MeetingStatus } from '../../../types/v3'

const statusLabels: Record<MeetingStatus, string> = {
  draft: 'Piszkozat',
  scheduling: 'Időpont egyeztetés',
  scheduled: 'Ütemezve',
  in_progress: 'Folyamatban',
  completed: 'Lezárva',
  cancelled: 'Törölve',
}

const statusColors: Record<MeetingStatus, 'primary' | 'success' | 'warning' | 'danger' | 'secondary'> = {
  draft: 'secondary',
  scheduling: 'warning',
  scheduled: 'primary',
  in_progress: 'success',
  completed: 'secondary',
  cancelled: 'danger',
}

interface MeetingListProps {
  orgId: string
}

interface MeetingCardProps {
  meeting: Meeting
  onClick: () => void
}

function MeetingCard({ meeting, onClick }: MeetingCardProps) {
  return (
    <Card
      className="p-4 hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">{meeting.title}</h3>
          <Badge variant={statusColors[meeting.status]} size="sm" className="mt-1">
            {statusLabels[meeting.status]}
          </Badge>
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {meeting.scheduled_at
            ? new Date(meeting.scheduled_at).toLocaleDateString('hu-HU', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })
            : 'Nincs időpont'}
        </div>
      </div>

      <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
        {meeting.location && (
          <div className="flex items-center gap-1">
            <MapPin className="w-4 h-4" />
            <span className="truncate max-w-32">{meeting.location}</span>
          </div>
        )}
        {meeting.meeting_url && (
          <div className="flex items-center gap-1">
            <Video className="w-4 h-4" />
            <span>Online</span>
          </div>
        )}
        <div className="flex items-center gap-1">
          <Users className="w-4 h-4" />
          <span>Quorum: {meeting.quorum_percentage}%</span>
        </div>
      </div>

      {meeting.description && (
        <p className="mt-3 text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
          {meeting.description}
        </p>
      )}
    </Card>
  )
}

export function MeetingList({ orgId }: MeetingListProps) {
  const navigate = useNavigate()
  const { meetings, loading, error, fetchMeetings } = useMeetingStore()

  useEffect(() => {
    fetchMeetings(orgId)
  }, [orgId, fetchMeetings])

  // Group meetings by status
  const upcoming = meetings.filter((m) =>
    ['draft', 'scheduling', 'scheduled'].includes(m.status)
  )
  const active = meetings.filter((m) => m.status === 'in_progress')
  const past = meetings.filter((m) =>
    ['completed', 'cancelled'].includes(m.status)
  )

  if (loading && meetings.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 dark:text-red-400">{error}</p>
        <Button onClick={() => fetchMeetings(orgId)} className="mt-4">
          Újra
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Gyűlések</h2>
          <p className="text-gray-500 dark:text-gray-400">
            {meetings.length} gyűlés összesen
          </p>
        </div>
        <Button onClick={() => navigate(`/v3/org/${orgId}/meeting/new`)}>
          <Plus className="w-4 h-4 mr-2" />
          Új gyűlés
        </Button>
      </div>

      {meetings.length === 0 ? (
        <Card className="p-12 text-center">
          <Calendar className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Még nincs gyűlés
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            Hozz létre egy gyűlést a szavazások kezeléséhez
          </p>
          <Button onClick={() => navigate(`/v3/org/${orgId}/meeting/new`)}>
            <Plus className="w-4 h-4 mr-2" />
            Első gyűlés létrehozása
          </Button>
        </Card>
      ) : (
        <>
          {/* Active meetings */}
          {active.length > 0 && (
            <section>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                Folyamatban lévő gyűlések
              </h3>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {active.map((meeting) => (
                  <MeetingCard
                    key={meeting.id}
                    meeting={meeting}
                    onClick={() => navigate(`/v3/org/${orgId}/meeting/${meeting.id}`)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Upcoming meetings */}
          {upcoming.length > 0 && (
            <section>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Közelgő gyűlések
              </h3>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {upcoming.map((meeting) => (
                  <MeetingCard
                    key={meeting.id}
                    meeting={meeting}
                    onClick={() => navigate(`/v3/org/${orgId}/meeting/${meeting.id}`)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Past meetings */}
          {past.length > 0 && (
            <section>
              <h3 className="text-lg font-semibold text-gray-500 dark:text-gray-400 mb-4">
                Korábbi gyűlések
              </h3>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {past.map((meeting) => (
                  <MeetingCard
                    key={meeting.id}
                    meeting={meeting}
                    onClick={() => navigate(`/v3/org/${orgId}/meeting/${meeting.id}`)}
                  />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  )
}
