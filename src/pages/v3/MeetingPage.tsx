import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, Calendar, MapPin, Video, Users, Play, Square, 
  BarChart2, FileText, Check, Clock
} from 'lucide-react'
import { useMeetingStore } from '../../stores/meetingStore'
import { useVoteStore } from '../../stores/voteStore'
import { AgendaEditor } from '../../components/v3/meeting'
import { VoteResults } from '../../components/v3/voting'
import { Button, Card, Spinner, Badge, Modal } from '../../components/ui'
import type { MeetingStatus, AgendaItem } from '../../types/v3'

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

type TabType = 'agenda' | 'results' | 'settings'

export function MeetingPage() {
  const { orgId, meetingId } = useParams<{ orgId: string; meetingId: string }>()
  const navigate = useNavigate()
  const { 
    currentMeeting, 
    agendaItems,
    loading, 
    error, 
    fetchMeeting, 
    fetchAgendaItems,
    updateMeeting,
    calculateQuorum,
    quorumResult
  } = useMeetingStore()
  const { startVoting, endVoting } = useVoteStore()

  const [activeTab, setActiveTab] = useState<TabType>('agenda')
  const [showQuorumModal, setShowQuorumModal] = useState(false)
  const [selectedAgendaItem, setSelectedAgendaItem] = useState<AgendaItem | null>(null)

  useEffect(() => {
    if (meetingId) {
      fetchMeeting(meetingId)
      fetchAgendaItems(meetingId)
    }
  }, [meetingId, fetchMeeting, fetchAgendaItems])

  const handleStartMeeting = async () => {
    if (!meetingId) return
    
    // Calculate quorum first
    await calculateQuorum(meetingId)
    setShowQuorumModal(true)
  }

  const handleConfirmStart = async () => {
    if (!meetingId) return
    await updateMeeting(meetingId, { status: 'in_progress' })
    setShowQuorumModal(false)
  }

  const handleEndMeeting = async () => {
    if (!meetingId) return
    if (confirm('Biztosan le szeretnéd zárni a gyűlést?')) {
      await updateMeeting(meetingId, { 
        status: 'completed',
        ended_at: new Date().toISOString()
      })
    }
  }

  const handleStartVoting = async (item: AgendaItem) => {
    await startVoting(item.id)
    setSelectedAgendaItem(item)
  }

  const handleEndVoting = async () => {
    if (selectedAgendaItem) {
      await endVoting(selectedAgendaItem.id)
      setSelectedAgendaItem(null)
      // Refresh agenda items
      if (meetingId) fetchAgendaItems(meetingId)
    }
  }

  if (loading && !currentMeeting) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error || !currentMeeting) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 dark:text-red-400">{error || 'Gyűlés nem található'}</p>
        <button
          onClick={() => navigate(`/v3/org/${orgId}`)}
          className="mt-4 text-blue-600 dark:text-blue-400 hover:underline"
        >
          Vissza
        </button>
      </div>
    )
  }

  const tabs = [
    { id: 'agenda' as const, label: 'Napirend', icon: FileText },
    { id: 'results' as const, label: 'Eredmények', icon: BarChart2 },
  ]

  const isActive = currentMeeting.status === 'in_progress'
  const canStart = ['draft', 'scheduled'].includes(currentMeeting.status)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(`/v3/org/${orgId}`)}
            className="p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {currentMeeting.title}
              </h1>
              <Badge variant={statusColors[currentMeeting.status]}>
                {statusLabels[currentMeeting.status]}
              </Badge>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
              {currentMeeting.scheduled_at && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {new Date(currentMeeting.scheduled_at).toLocaleString('hu-HU')}
                </span>
              )}
              {currentMeeting.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {currentMeeting.location}
                </span>
              )}
              {currentMeeting.meeting_url && (
                <a 
                  href={currentMeeting.meeting_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline"
                >
                  <Video className="w-4 h-4" />
                  Online link
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {canStart && (
            <Button onClick={handleStartMeeting}>
              <Play className="w-4 h-4 mr-2" />
              Gyűlés indítása
            </Button>
          )}
          {isActive && (
            <Button variant="danger" onClick={handleEndMeeting}>
              <Square className="w-4 h-4 mr-2" />
              Gyűlés lezárása
            </Button>
          )}
        </div>
      </div>

      {/* Meeting info card */}
      {isActive && (
        <Card className="p-4 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
              <span className="font-medium text-green-700 dark:text-green-300">
                A gyűlés folyamatban van
              </span>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                <Users className="w-4 h-4" />
                Quorum: {currentMeeting.quorum_reached ? '✓ Megvan' : '✗ Nincs meg'}
              </span>
              <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                <Clock className="w-4 h-4" />
                {currentMeeting.scheduled_at && (
                  `Kezdés: ${new Date(currentMeeting.scheduled_at).toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' })}`
                )}
              </span>
            </div>
          </div>
        </Card>
      )}

      {/* Tabs */}
      <div className="border-b dark:border-gray-700">
        <nav className="flex gap-8">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActiveTab = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-4 border-b-2 transition-colors ${
                  isActiveTab
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                <Icon className="w-5 h-5" />
                {tab.label}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Content */}
      <div>
        {activeTab === 'agenda' && (
          <div className="space-y-6">
            <AgendaEditor meetingId={currentMeeting.id} />
            
            {/* Voting controls for active meeting */}
            {isActive && agendaItems.length > 0 && (
              <Card className="p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                  Szavazás indítása
                </h3>
                <div className="space-y-2">
                  {agendaItems
                    .filter((item) => item.vote_type !== 'none' && item.status === 'pending')
                    .map((item) => (
                      <div 
                        key={item.id}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
                      >
                        <span className="text-gray-900 dark:text-white">
                          {item.order_num}. {item.title}
                        </span>
                        <Button size="sm" onClick={() => handleStartVoting(item)}>
                          <Play className="w-4 h-4 mr-1" />
                          Szavazás
                        </Button>
                      </div>
                    ))}
                </div>
              </Card>
            )}

            {/* Current voting */}
            {selectedAgendaItem && (
              <Modal
                isOpen={true}
                onClose={() => {}}
                title={`Szavazás: ${selectedAgendaItem.title}`}
              >
                <div className="space-y-4">
                  <VoteResults agendaItem={selectedAgendaItem} showRealtime />
                  <div className="flex justify-end">
                    <Button variant="danger" onClick={handleEndVoting}>
                      <Square className="w-4 h-4 mr-2" />
                      Szavazás lezárása
                    </Button>
                  </div>
                </div>
              </Modal>
            )}
          </div>
        )}

        {activeTab === 'results' && (
          <div className="space-y-4">
            {agendaItems.filter((item) => item.status === 'completed' && item.result).length === 0 ? (
              <Card className="p-8 text-center">
                <BarChart2 className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Még nincs eredmény
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                  A szavazási eredmények itt jelennek meg.
                </p>
              </Card>
            ) : (
              agendaItems
                .filter((item) => item.status === 'completed' && item.result)
                .map((item) => (
                  <VoteResults key={item.id} agendaItem={item} />
                ))
            )}
          </div>
        )}
      </div>

      {/* Quorum Modal */}
      <Modal
        isOpen={showQuorumModal}
        onClose={() => setShowQuorumModal(false)}
        title="Határozatképesség"
      >
        <div className="space-y-4">
          {quorumResult ? (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {quorumResult.present_weight.toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-500">Jelenlévő súly</div>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg text-center">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {quorumResult.total_weight.toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-500">Összes súly</div>
                </div>
              </div>
              <div className={`p-4 rounded-lg ${
                quorumResult.quorum_reached 
                  ? 'bg-green-50 dark:bg-green-900/20' 
                  : 'bg-red-50 dark:bg-red-900/20'
              }`}>
                <div className="flex items-center gap-3">
                  {quorumResult.quorum_reached ? (
                    <Check className="w-6 h-6 text-green-600" />
                  ) : (
                    <Users className="w-6 h-6 text-red-600" />
                  )}
                  <div>
                    <div className={`font-medium ${
                      quorumResult.quorum_reached 
                        ? 'text-green-700 dark:text-green-300' 
                        : 'text-red-700 dark:text-red-300'
                    }`}>
                      {quorumResult.quorum_reached 
                        ? 'A gyűlés határozatképes!' 
                        : 'A gyűlés NEM határozatképes!'}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Jelenlét: {quorumResult.quorum_percentage.toFixed(1)}% 
                      (szükséges: {currentMeeting.quorum_percentage}%)
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-4">
              <Spinner />
            </div>
          )}
          
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setShowQuorumModal(false)}>
              Mégse
            </Button>
            <Button onClick={handleConfirmStart} disabled={!quorumResult}>
              {quorumResult?.quorum_reached ? 'Gyűlés indítása' : 'Indítás mindenképp'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
