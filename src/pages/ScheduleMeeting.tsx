import { useEffect, useState, useMemo } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { format } from 'date-fns'
import { hu } from 'date-fns/locale'
import { 
  Calendar, Users, Settings, BarChart3, Loader2, 
  ArrowLeft, Share2, Copy, Check, ExternalLink,
  CalendarCheck
} from 'lucide-react'
import { ScheduleCreator } from '../components/v3/schedule/ScheduleCreator'
import { ScheduleVoting } from '../components/v3/schedule/ScheduleVoting'
import { ScheduleResults } from '../components/v3/schedule/ScheduleResults'
import { useScheduleStore } from '../stores/scheduleStore'
import { supabase } from '../lib/supabase'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import type { Meeting, Member } from '../types/v3'

type ViewMode = 'vote' | 'results' | 'manage'

export function ScheduleMeeting() {
  const { meetingId } = useParams<{ meetingId: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  
  const memberId = searchParams.get('member') || ''
  const isAdmin = searchParams.get('admin') === 'true'
  
  const { options, fetchOptions } = useScheduleStore()
  
  const [meeting, setMeeting] = useState<Meeting | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [currentMember, setCurrentMember] = useState<Member | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('vote')
  const [copied, setCopied] = useState(false)

  // Determine if meeting is already scheduled
  const isScheduled = meeting?.status === 'scheduled' || options.some(o => o.is_winner)

  // Calculate participation stats
  const stats = useMemo(() => {
    const uniqueVoters = new Set(options.flatMap(o => o.votes.map(v => v.member_id)))
    const totalEligible = members.filter(m => m.role !== 'observer').length
    return {
      voted: uniqueVoters.size,
      total: totalEligible,
      percentage: totalEligible > 0 ? Math.round((uniqueVoters.size / totalEligible) * 100) : 0
    }
  }, [options, members])

  // Load meeting and member data
  useEffect(() => {
    const loadData = async () => {
      if (!meetingId) {
        setError('Hiányzó meeting azonosító')
        setLoading(false)
        return
      }

      try {
        // Fetch meeting
        const { data: meetingData, error: meetingError } = await supabase
          .from('meetings')
          .select('*')
          .eq('id', meetingId)
          .single()

        if (meetingError) throw meetingError
        setMeeting(meetingData)

        // Fetch members
        const { data: membersData, error: membersError } = await supabase
          .from('members')
          .select('*')
          .eq('org_id', meetingData.org_id)
          .eq('is_active', true)

        if (membersError) throw membersError
        setMembers(membersData || [])

        // Find current member
        if (memberId) {
          const member = membersData?.find(m => m.id === memberId)
          setCurrentMember(member || null)
        }

        // Fetch schedule options
        await fetchOptions(meetingId)

      } catch (err) {
        console.error('Error loading data:', err)
        setError((err as Error).message)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [meetingId, memberId, fetchOptions])

  // Auto-switch to results if scheduled
  useEffect(() => {
    if (isScheduled && viewMode === 'vote') {
      setViewMode('results')
    }
  }, [isScheduled, viewMode])

  const handleCopyLink = async () => {
    const url = `${window.location.origin}/schedule/${meetingId}`
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleScheduled = () => {
    // Refresh the meeting data
    if (meetingId) {
      supabase
        .from('meetings')
        .select('*')
        .eq('id', meetingId)
        .single()
        .then(({ data }) => {
          if (data) setMeeting(data)
        })
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-ivory-50 to-ivory-100 dark:from-obsidian-900 dark:to-obsidian-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-gold-500" />
          <p className="text-obsidian-500 dark:text-obsidian-400">Betöltés...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error || !meeting) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-ivory-50 to-ivory-100 dark:from-obsidian-900 dark:to-obsidian-950 flex items-center justify-center p-4">
        <Card padding="lg" className="max-w-md w-full text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
            <Calendar className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-obsidian-900 dark:text-ivory-100 mb-2">
            Hiba történt
          </h2>
          <p className="text-obsidian-500 dark:text-obsidian-400 mb-6">
            {error || 'A gyűlés nem található'}
          </p>
          <Button onClick={() => navigate(-1)} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Vissza
          </Button>
        </Card>
      </div>
    )
  }

  const tabs = [
    { id: 'vote' as ViewMode, label: 'Szavazás', icon: Calendar, show: !isScheduled },
    { id: 'results' as ViewMode, label: 'Eredmények', icon: BarChart3, show: true },
    { id: 'manage' as ViewMode, label: 'Kezelés', icon: Settings, show: isAdmin },
  ].filter(t => t.show)

  return (
    <div className="min-h-screen bg-gradient-to-br from-ivory-50 to-ivory-100 dark:from-obsidian-900 dark:to-obsidian-950">
      {/* Header */}
      <header className="bg-white dark:bg-obsidian-800 border-b border-obsidian-100 dark:border-obsidian-700 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-obsidian-100 dark:hover:bg-obsidian-700 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-obsidian-600 dark:text-obsidian-300" />
            </button>

            <div className="flex-1 text-center px-4">
              <h1 className="text-lg font-bold text-obsidian-900 dark:text-ivory-100 truncate">
                {meeting.title}
              </h1>
              {isScheduled && meeting.scheduled_at && (
                <div className="flex items-center justify-center gap-1 text-sm text-green-600 dark:text-green-400">
                  <CalendarCheck className="w-4 h-4" />
                  <span>{format(new Date(meeting.scheduled_at), 'yyyy. MM. dd. HH:mm', { locale: hu })}</span>
                </div>
              )}
            </div>

            <button
              onClick={handleCopyLink}
              className="p-2 hover:bg-obsidian-100 dark:hover:bg-obsidian-700 rounded-lg transition-colors"
              title="Link másolása"
            >
              {copied ? (
                <Check className="w-5 h-5 text-green-500" />
              ) : (
                <Share2 className="w-5 h-5 text-obsidian-600 dark:text-obsidian-300" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Status & Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card padding="sm" className="text-center">
            <div className="text-2xl font-bold text-gold-600 dark:text-gold-400">
              {options.length}
            </div>
            <div className="text-xs text-obsidian-500 dark:text-obsidian-400">
              Időpont opció
            </div>
          </Card>
          <Card padding="sm" className="text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {stats.voted}
            </div>
            <div className="text-xs text-obsidian-500 dark:text-obsidian-400">
              Szavazott
            </div>
          </Card>
          <Card padding="sm" className="text-center">
            <div className="text-2xl font-bold text-obsidian-600 dark:text-obsidian-300">
              {stats.total}
            </div>
            <div className="text-xs text-obsidian-500 dark:text-obsidian-400">
              Jogosult
            </div>
          </Card>
          <Card padding="sm" className="text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {stats.percentage}%
            </div>
            <div className="text-xs text-obsidian-500 dark:text-obsidian-400">
              Részvétel
            </div>
          </Card>
        </div>

        {/* Current member info */}
        {currentMember && (
          <div className="flex items-center gap-3 p-3 bg-gold-50 dark:bg-gold-900/20 border border-gold-200 dark:border-gold-700 rounded-xl">
            <div className="w-10 h-10 bg-gold-500 rounded-full flex items-center justify-center text-white font-bold">
              {currentMember.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="font-medium text-obsidian-900 dark:text-ivory-100">
                {currentMember.name}
              </div>
              <div className="text-sm text-obsidian-500 dark:text-obsidian-400">
                Szavazásra jogosult tag
              </div>
            </div>
          </div>
        )}

        {/* No member warning */}
        {!currentMember && !isAdmin && (
          <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl">
            <div className="flex items-start gap-3">
              <Users className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5" />
              <div>
                <div className="font-medium text-amber-800 dark:text-amber-300">
                  Vendég mód
                </div>
                <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
                  Szavazáshoz kérjen egyedi linket a szervezőtől, amely tartalmazza az Ön azonosítóját.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab navigation */}
        {tabs.length > 1 && (
          <div className="flex gap-1 p-1 bg-obsidian-100 dark:bg-obsidian-800 rounded-xl">
            {tabs.map(tab => {
              const Icon = tab.icon
              const isActive = viewMode === tab.id
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setViewMode(tab.id)}
                  className={`
                    flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all flex-1
                    ${isActive 
                      ? 'bg-white dark:bg-obsidian-700 text-obsidian-900 dark:text-ivory-100 shadow-sm' 
                      : 'text-obsidian-500 dark:text-obsidian-400 hover:text-obsidian-700 dark:hover:text-obsidian-200'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              )
            })}
          </div>
        )}

        {/* Tab content */}
        <div className="min-h-[400px]">
          {viewMode === 'vote' && currentMember && !isScheduled && (
            <ScheduleVoting
              meetingId={meeting.id}
              memberId={currentMember.id}
              memberName={currentMember.name}
              disabled={!currentMember}
              showAllVoters={isAdmin}
            />
          )}

          {viewMode === 'vote' && !currentMember && !isScheduled && (
            <Card padding="lg">
              <div className="text-center py-8">
                <Users className="w-12 h-12 mx-auto mb-4 text-obsidian-300 dark:text-obsidian-600" />
                <h3 className="text-lg font-medium text-obsidian-900 dark:text-ivory-100 mb-2">
                  Jelentkezzen be a szavazáshoz
                </h3>
                <p className="text-obsidian-500 dark:text-obsidian-400 mb-4">
                  A szavazáshoz szükség van az Ön egyedi azonosítójára.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button onClick={() => setViewMode('results')} variant="outline">
                    Eredmények megtekintése
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {viewMode === 'results' && (
            <ScheduleResults
              canSelectWinner={isAdmin && !isScheduled}
              showVoterDetails={isAdmin}
              onScheduled={handleScheduled}
            />
          )}

          {viewMode === 'manage' && isAdmin && (
            <div className="space-y-6">
              <ScheduleCreator
                meetingId={meeting.id}
                disabled={isScheduled}
              />
              
              {/* Share section */}
              <Card padding="lg">
                <h3 className="font-medium text-obsidian-900 dark:text-ivory-100 mb-4">
                  Megosztás
                </h3>
                <div className="space-y-3">
                  {/* Public link */}
                  <div className="flex items-center gap-2 p-3 bg-obsidian-50 dark:bg-obsidian-800 rounded-lg">
                    <div className="flex-1 font-mono text-sm text-obsidian-600 dark:text-obsidian-300 truncate">
                      {`${window.location.origin}/schedule/${meetingId}`}
                    </div>
                    <button
                      onClick={handleCopyLink}
                      className="p-2 hover:bg-obsidian-200 dark:hover:bg-obsidian-700 rounded transition-colors"
                    >
                      {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>

                  <p className="text-sm text-obsidian-500 dark:text-obsidian-400">
                    <strong>Tipp:</strong> Személyre szabott linkeket generálhat a tagok számára: 
                    <code className="ml-1 px-1 py-0.5 bg-obsidian-100 dark:bg-obsidian-800 rounded text-xs">
                      ?member=MEMBER_ID
                    </code>
                  </p>

                  {/* Member links */}
                  <details className="mt-4">
                    <summary className="cursor-pointer text-sm text-gold-600 dark:text-gold-400 hover:underline">
                      Egyedi linkek megtekintése ({members.filter(m => m.role !== 'observer').length} tag)
                    </summary>
                    <div className="mt-3 space-y-2 max-h-60 overflow-y-auto">
                      {members
                        .filter(m => m.role !== 'observer')
                        .map(member => (
                          <div 
                            key={member.id}
                            className="flex items-center justify-between p-2 bg-obsidian-50 dark:bg-obsidian-800 rounded text-sm"
                          >
                            <span className="font-medium text-obsidian-700 dark:text-obsidian-200">
                              {member.name}
                            </span>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  const url = `${window.location.origin}/schedule/${meetingId}?member=${member.id}`
                                  navigator.clipboard.writeText(url)
                                }}
                                className="p-1 hover:bg-obsidian-200 dark:hover:bg-obsidian-700 rounded"
                                title="Link másolása"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                              <a
                                href={`/schedule/${meetingId}?member=${member.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1 hover:bg-obsidian-200 dark:hover:bg-obsidian-700 rounded"
                                title="Megnyitás"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            </div>
                          </div>
                        ))}
                    </div>
                  </details>
                </div>
              </Card>

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
      </main>

      {/* Footer */}
      <footer className="max-w-4xl mx-auto px-4 py-6 text-center text-sm text-obsidian-400 dark:text-obsidian-500">
        Powered by <span className="font-medium text-gold-600 dark:text-gold-400">VoteBox</span>
      </footer>
    </div>
  )
}
