/**
 * MeetingDetail Page
 * Teljes gyűlés kezelő oldal - integrált nézet
 * 
 * Tabok:
 * - Résztvevők: Jelenléti ív és check-in/check-out
 * - Napirend: AgendaEditor + szavazás indítás + eredmények
 * - Szavazás: Aktív szavazás panel (csak gyűlés közben)
 * - Jegyzőkönyv: MinutesGenerator és PDF export
 */

import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, Calendar, MapPin, Video, Users, Play, Square, 
  FileText, ListTodo, Vote, ClipboardList, Clock, CheckCircle,
  AlertTriangle
} from 'lucide-react'
import { useMeetingStore } from '../stores/meetingStore'
import { useMemberStore } from '../stores/memberStore'
import { useVoteStore } from '../stores/voteStore'
import { 
  AgendaEditor, 
  QuorumDisplay, 
  VotingCard,
  VotingResults
} from '../components/v3'
import { AttendanceList } from '../components/v3/attendance'
import { MinutesGenerator } from '../components/v3/minutes'
import { 
  Button, Card, Spinner, Badge, Modal,
  Tabs, TabsList, TabsTrigger, TabsContent 
} from '../components/ui'
import type { MeetingStatus, AgendaItem, Member } from '../types/v3'

// ============ Constants ============
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

type TabType = 'participants' | 'agenda' | 'voting' | 'minutes'

export function MeetingDetail() {
  const { orgId, meetingId } = useParams<{ orgId: string; meetingId: string }>()
  const navigate = useNavigate()
  
  // Stores
  const { 
    currentMeeting, 
    agendaItems,
    attendance,
    loading, 
    error, 
    fetchMeeting, 
    fetchAgendaItems,
    fetchAttendance,
    updateMeeting,
    calculateQuorum,
    quorumResult
  } = useMeetingStore()
  
  const { members, fetchMembers } = useMemberStore()
  const { 
    startVoting, 
    endVoting, 
    submitVote, 
    liveResult, 
    hasVoted 
  } = useVoteStore()

  // Local state
  const [activeTab, setActiveTab] = useState<TabType>('participants')
  const [showQuorumModal, setShowQuorumModal] = useState(false)
  const [activeVotingItem, setActiveVotingItem] = useState<AgendaItem | null>(null)
  const [currentMember, setCurrentMember] = useState<Member | null>(null)

  // ============ Effects ============
  useEffect(() => {
    if (meetingId && orgId) {
      fetchMeeting(meetingId)
      fetchAgendaItems(meetingId)
      fetchAttendance(meetingId)
      fetchMembers(orgId)
    }
  }, [meetingId, orgId, fetchMeeting, fetchAgendaItems, fetchAttendance, fetchMembers])

  // Auto-select first active member (for demo - normally from auth)
  useEffect(() => {
    if (members.length > 0 && !currentMember) {
      const voter = members.find(m => m.role !== 'observer' && m.is_active)
      if (voter) setCurrentMember(voter)
    }
  }, [members, currentMember])

  // ============ Handlers ============
  const handleStartMeeting = useCallback(async () => {
    if (!meetingId) return
    await calculateQuorum(meetingId)
    setShowQuorumModal(true)
  }, [meetingId, calculateQuorum])

  const handleConfirmStart = useCallback(async () => {
    if (!meetingId) return
    await updateMeeting(meetingId, { status: 'in_progress' })
    setShowQuorumModal(false)
  }, [meetingId, updateMeeting])

  const handleEndMeeting = useCallback(async () => {
    if (!meetingId) return
    if (confirm('Biztosan le szeretnéd zárni a gyűlést?')) {
      await updateMeeting(meetingId, { 
        status: 'completed',
        ended_at: new Date().toISOString()
      })
    }
  }, [meetingId, updateMeeting])

  const handleStartVoting = useCallback(async (item: AgendaItem) => {
    await startVoting(item.id)
    setActiveVotingItem(item)
    setActiveTab('voting')
  }, [startVoting])

  const handleEndVoting = useCallback(async () => {
    if (activeVotingItem) {
      await endVoting(activeVotingItem.id)
      setActiveVotingItem(null)
      if (meetingId) fetchAgendaItems(meetingId)
    }
  }, [activeVotingItem, endVoting, meetingId, fetchAgendaItems])

  const handleCastVote = useCallback(async (vote: 'yes' | 'no' | 'abstain') => {
    if (!activeVotingItem || !currentMember) return false
    const success = await submitVote({
      agenda_item_id: activeVotingItem.id,
      member_id: currentMember.id,
      vote: vote,
      weight: currentMember.weight,
    })
    return success
  }, [activeVotingItem, currentMember, submitVote])

  // ============ Computed ============
  const isActive = currentMeeting?.status === 'in_progress'
  const canStart = currentMeeting && ['draft', 'scheduled'].includes(currentMeeting.status)
  const isAdmin = currentMember?.role === 'admin' || currentMember?.role === 'chair'

  // ============ Loading/Error ============
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

  // ============ Tab definitions ============
  const tabs = [
    { id: 'participants' as const, label: 'Résztvevők', icon: Users },
    { id: 'agenda' as const, label: 'Napirend', icon: ListTodo },
    { id: 'voting' as const, label: 'Szavazás', icon: Vote, show: isActive },
    { id: 'minutes' as const, label: 'Jegyzőkönyv', icon: FileText },
  ].filter(tab => tab.show !== false)

  return (
    <div className="space-y-6">
      {/* ============ Header ============ */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <button
            onClick={() => navigate(`/v3/org/${orgId}`)}
            className="p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 mt-1"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {currentMeeting.title}
              </h1>
              <Badge variant={statusColors[currentMeeting.status]}>
                {statusLabels[currentMeeting.status]}
              </Badge>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
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
        {isAdmin && (
          <div className="flex gap-2 ml-11 sm:ml-0">
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
        )}
      </div>

      {/* ============ Live Meeting Banner ============ */}
      {isActive && (
        <Card className="p-4 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
              <span className="font-medium text-green-700 dark:text-green-300">
                A gyűlés folyamatban van
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <QuorumDisplay 
                meeting={currentMeeting} 
                members={members} 
                attendance={attendance.map(a => ({ 
                  member_id: a.member_id, 
                  weight_at_checkin: a.weight_at_checkin ?? 0 
                }))}
                compact 
              />
              {currentMeeting.scheduled_at && (
                <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                  <Clock className="w-4 h-4" />
                  Kezdés: {new Date(currentMeeting.scheduled_at).toLocaleTimeString('hu-HU', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </span>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* ============ Tabs Navigation ============ */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabType)}>
        <TabsList className="w-full sm:w-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <TabsTrigger 
                key={tab.id} 
                value={tab.id}
                icon={<Icon className="w-4 h-4" />}
              >
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            )
          })}
        </TabsList>

        {/* ============ Résztvevők Tab ============ */}
        <TabsContent value="participants" className="mt-6">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Attendance List */}
            <div className="lg:col-span-2">
              <AttendanceList 
                meetingId={currentMeeting.id}
                orgId={currentMeeting.org_id}
                isActive={isActive}
                readOnly={!isAdmin}
              />
            </div>
            
            {/* Quorum Display */}
            <div>
              <QuorumDisplay 
                meeting={currentMeeting}
                members={members}
                attendance={attendance.map(a => ({ 
                  member_id: a.member_id, 
                  weight_at_checkin: a.weight_at_checkin ?? 0 
                }))}
                showRefresh={isActive}
              />
            </div>
          </div>
        </TabsContent>

        {/* ============ Napirend Tab ============ */}
        <TabsContent value="agenda" className="mt-6">
          <div className="space-y-6">
            {/* Agenda Editor */}
            <AgendaEditor meetingId={currentMeeting.id} />
            
            {/* Voting controls for active meeting (admin only) */}
            {isActive && isAdmin && (
              <Card className="p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Vote className="w-5 h-5 text-blue-500" />
                  Szavazás indítása
                </h3>
                {agendaItems.filter(item => item.vote_type !== 'none' && item.status === 'pending').length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    Nincs szavazásra váró napirendi pont.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {agendaItems
                      .filter((item) => item.vote_type !== 'none' && item.status === 'pending')
                      .map((item) => (
                        <div 
                          key={item.id}
                          className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
                        >
                          <div>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {item.order_num}. {item.title}
                            </span>
                            {item.is_secret && (
                              <Badge variant="warning" size="sm" className="ml-2">Titkos</Badge>
                            )}
                          </div>
                          <Button size="sm" onClick={() => handleStartVoting(item)}>
                            <Play className="w-4 h-4 mr-1" />
                            Szavazás
                          </Button>
                        </div>
                      ))}
                  </div>
                )}
              </Card>
            )}

            {/* Completed votes */}
            {agendaItems.filter(item => item.status === 'completed' && item.result).length > 0 && (
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <ClipboardList className="w-5 h-5" />
                  Szavazási eredmények
                </h3>
                {agendaItems
                  .filter(item => item.status === 'completed' && item.result)
                  .map(item => (
                    <VotingResults 
                      key={item.id} 
                      agendaItem={item} 
                      result={item.result!}
                    />
                  ))
                }
              </div>
            )}
          </div>
        </TabsContent>

        {/* ============ Szavazás Tab (only when meeting is active) ============ */}
        <TabsContent value="voting" className="mt-6">
          {activeVotingItem && currentMember ? (
            <div className="max-w-2xl mx-auto space-y-6">
              {/* Admin controls */}
              {isAdmin && (
                <Card className="p-4 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-amber-600" />
                      <span className="font-medium text-amber-700 dark:text-amber-300">
                        Aktív szavazás: {activeVotingItem.title}
                      </span>
                    </div>
                    <Button variant="danger" size="sm" onClick={handleEndVoting}>
                      <Square className="w-4 h-4 mr-1" />
                      Szavazás lezárása
                    </Button>
                  </div>
                </Card>
              )}

              {/* Voting card for members */}
              <VotingCard
                agendaItem={activeVotingItem}
                member={currentMember}
                hasVoted={hasVoted}
                onVote={handleCastVote}
                isVoting={true}
              />

              {/* Live results for admin */}
              {isAdmin && liveResult && (
                <VotingResults 
                  agendaItem={activeVotingItem}
                  result={liveResult}
                  showRealtime
                />
              )}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <Vote className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Nincs aktív szavazás
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                {isAdmin 
                  ? 'Indíts szavazást a Napirend fülön.' 
                  : 'Várj, amíg a levezető elnök megnyitja a szavazást.'
                }
              </p>
              {isAdmin && (
                <Button onClick={() => setActiveTab('agenda')}>
                  <ListTodo className="w-4 h-4 mr-2" />
                  Ugrás a napirendhez
                </Button>
              )}
            </Card>
          )}
        </TabsContent>

        {/* ============ Jegyzőkönyv Tab ============ */}
        <TabsContent value="minutes" className="mt-6">
          <MinutesGenerator
            meetingId={currentMeeting.id}
            meetingTitle={currentMeeting.title}
            onSave={async (markdown) => {
              // TODO: Save to database
              console.log('Saving minutes:', markdown.substring(0, 100))
            }}
          />
        </TabsContent>
      </Tabs>

      {/* ============ Quorum Modal ============ */}
      <Modal
        isOpen={showQuorumModal}
        onClose={() => setShowQuorumModal(false)}
        title="Határozatképesség ellenőrzése"
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
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  ) : (
                    <AlertTriangle className="w-6 h-6 text-red-600" />
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

export default MeetingDetail
