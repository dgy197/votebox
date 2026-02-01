import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Routes, Route, useNavigate } from 'react-router-dom'
import {
  Calendar, Users, HelpCircle, BarChart3, Plus, ArrowLeft,
  Copy, Check, RefreshCw, Zap, Trophy, FileText
} from 'lucide-react'

import { useAuthStore } from '../../stores/authStore'
import { useEventStore } from '../../stores/eventStore'
import * as api from '../../services/supabaseService'

import { EventList } from '../../components/admin/EventList'
import { EventForm } from '../../components/admin/EventForm'
import { ParticipantManager } from '../../components/admin/ParticipantManager'
import { QuestionManager } from '../../components/admin/QuestionManager'
import { ResultsModal } from '../../components/admin/ResultsModal'
import { ExportButtons } from '../../components/admin/ExportButtons'
import { EventQRCode } from '../../components/admin/EventQRCode'
import { AuditLogModal } from '../../components/admin/AuditLogViewer'
import { Card, Button, Badge } from '../../components/ui'

import type { Event, Question } from '../../types'

const DEMO_ORG_ID = '00000000-0000-0000-0000-000000000001'

// Ballot icon
function BallotIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className}>
      <rect x="6" y="8" width="36" height="32" rx="4" className="fill-gold-400/20 stroke-gold-500" strokeWidth="2"/>
      <rect x="12" y="14" width="24" height="4" rx="1" className="fill-gold-500"/>
      <line x1="6" y1="24" x2="42" y2="24" className="stroke-gold-500" strokeWidth="2"/>
      <path d="M18 32L22 36L30 28" className="stroke-gold-500" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export function AdminDashboard() {
  return (
    <Routes>
      <Route path="/" element={<DashboardHome />} />
      <Route path="/event/:eventId" element={<EventDetail />} />
    </Routes>
  )
}

// Dashboard Home
function DashboardHome() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { events, setEvents, addEvent, updateEvent, removeEvent, setLoading, loading } = useEventStore()
  
  const [showForm, setShowForm] = useState(false)
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)
  
  const organizationId = user?.organization_id || DEMO_ORG_ID
  
  useEffect(() => {
    loadEvents()
  }, [])
  
  const loadEvents = async () => {
    setLoading(true)
    try {
      const data = await api.getEvents(organizationId)
      setEvents(data)
    } catch (err) {
      console.error('Failed to load events:', err)
      setEvents([])
    } finally {
      setLoading(false)
    }
  }
  
  const handleCreateEvent = async (data: Partial<Event>) => {
    const newEvent = await api.createEvent({
      ...data,
      organization_id: organizationId,
      created_by: user?.id || '00000000-0000-0000-0000-000000000000',
      state: 'draft',
    })
    addEvent(newEvent)
    setShowForm(false)
  }
  
  const handleUpdateEvent = async (data: Partial<Event>) => {
    if (!editingEvent) return
    const updated = await api.updateEvent(editingEvent.id, data)
    updateEvent(editingEvent.id, updated)
    setEditingEvent(null)
    setShowForm(false)
  }
  
  const handleDeleteEvent = async (event: Event) => {
    if (!confirm(`Biztosan törlöd: "${event.name}"?`)) return
    try {
      await api.deleteEvent(event.id)
      removeEvent(event.id)
    } catch (err) {
      console.error('Failed to delete event:', err)
    }
  }
  
  const handleStatusChange = async (event: Event, state: Event['state']) => {
    try {
      const updated = await api.updateEvent(event.id, { state })
      updateEvent(event.id, updated)
    } catch (err) {
      console.error('Failed to update event status:', err)
    }
  }
  
  const handleSelectEvent = (event: Event) => {
    navigate(`/admin/event/${event.id}`)
  }
  
  const activeEvents = events.filter(e => e.state === 'active').length
  
  return (
    <div className="max-w-6xl mx-auto animate-fade-up" style={{ animationFillMode: 'forwards' }}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10">
        <div>
          <h1 className="font-display text-display-lg text-obsidian-900 dark:text-ivory-100">
            Command Center
          </h1>
          <p className="text-obsidian-500 dark:text-obsidian-400 mt-1">
            Manage your voting events
          </p>
        </div>
        <Button
          variant="gold"
          size="lg"
          onClick={() => { setEditingEvent(null); setShowForm(true) }}
        >
          <Plus className="w-5 h-5" />
          {t('events.create')}
        </Button>
      </div>
      
      {/* Quick stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <StatCard 
          icon={<Calendar className="w-6 h-6 text-gold-500" />}
          label={t('events.title')}
          value={events.length}
          accent="gold"
        />
        <StatCard 
          icon={<Zap className="w-6 h-6 text-emerald-500" />}
          label="Active Events"
          value={activeEvents}
          accent={activeEvents > 0 ? 'green' : 'default'}
        />
        <StatCard 
          icon={<Users className="w-6 h-6 text-blue-500" />}
          label="Total Participants"
          value={0}
        />
        <StatCard 
          icon={<Trophy className="w-6 h-6 text-purple-500" />}
          label="Completed Votes"
          value={0}
        />
      </div>
      
      {/* Event form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-obsidian-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="max-w-lg w-full animate-scale-in">
            <EventForm
              event={editingEvent}
              onSave={editingEvent ? handleUpdateEvent : handleCreateEvent}
              onCancel={() => { setShowForm(false); setEditingEvent(null) }}
            />
          </div>
        </div>
      )}
      
      {/* Events list */}
      <Card padding="none">
        <div className="px-6 py-5 border-b border-obsidian-100 dark:border-obsidian-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold-100 to-gold-200 dark:from-gold-900/30 dark:to-gold-800/20 flex items-center justify-center">
                <BallotIcon className="w-6 h-6" />
              </div>
              <h2 className="font-display text-display-sm text-obsidian-900 dark:text-ivory-100">
                {t('events.title')}
              </h2>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={loadEvents}
              className={loading ? 'animate-spin' : ''}
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <div className="p-6">
          <EventList
            events={events}
            onSelect={handleSelectEvent}
            onDelete={handleDeleteEvent}
            onStatusChange={handleStatusChange}
          />
        </div>
      </Card>
      
      {/* Demo helper */}
      <DemoHelper />
    </div>
  )
}

// Event Detail Page
function EventDetail() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { 
    currentEvent, setCurrentEvent,
    participants, setParticipants, addParticipant, removeParticipant, updateParticipant,
    questions, setQuestions, addQuestion, updateQuestion, removeQuestion,
    loading, setLoading 
  } = useEventStore()
  
  const [showResults, setShowResults] = useState<Question | null>(null)
  const [voteCountMap, setVoteCountMap] = useState<Record<string, number>>({})
  const [copiedCode, setCopiedCode] = useState(false)
  const [showAuditLog, setShowAuditLog] = useState(false)
  
  const eventId = window.location.pathname.split('/').pop()!
  
  useEffect(() => {
    loadEventData()
    
    const unsubscribe = api.subscribeToQuestions(eventId, (question) => {
      updateQuestion(question.id, question)
    })
    
    return () => {
      unsubscribe()
    }
  }, [eventId])
  
  const loadEventData = async () => {
    setLoading(true)
    try {
      const [event, eventParticipants, eventQuestions] = await Promise.all([
        api.getEvent(eventId),
        api.getParticipants(eventId),
        api.getQuestions(eventId),
      ])
      
      setCurrentEvent(event)
      setParticipants(eventParticipants)
      setQuestions(eventQuestions)
      
      const counts: Record<string, number> = {}
      for (const q of eventQuestions) {
        counts[q.id] = await api.getVoteCount(q.id)
      }
      setVoteCountMap(counts)
    } catch (err) {
      console.error('Failed to load event:', err)
      setCurrentEvent({
        id: eventId,
        organization_id: DEMO_ORG_ID,
        name: 'Demo Esemény',
        description: null,
        event_code: 'DEMO01',
        starts_at: null,
        ends_at: null,
        timezone: 'Europe/Budapest',
        quorum_type: 'percentage',
        quorum_value: 50,
        quorum_percent: 50,
        state: 'active',
        created_by: '00000000-0000-0000-0000-000000000000',
        created_at: new Date().toISOString(),
      })
    } finally {
      setLoading(false)
    }
  }
  
  // Participant handlers
  const handleAddParticipant = async (name: string, email?: string) => {
    const participant = await api.createParticipant({
      event_id: eventId,
      name,
      email: email || null,
      access_code: api.generateAccessCode(),
    })
    addParticipant(participant)
  }
  
  const handleAddParticipantsBulk = async (newParticipants: { name: string; email?: string }[]) => {
    const participantsData = newParticipants.map(p => ({
      event_id: eventId,
      name: p.name,
      email: p.email || null,
      access_code: api.generateAccessCode(),
    }))
    const created = await api.createParticipants(participantsData)
    created.forEach(p => addParticipant(p))
  }
  
  const handleDeleteParticipant = async (id: string) => {
    await api.deleteParticipant(id)
    removeParticipant(id)
  }
  
  const handleRegenerateCode = async (id: string, newCode: string) => {
    await api.updateParticipant(id, { access_code: newCode })
    updateParticipant(id, { access_code: newCode })
  }
  
  // Question handlers
  const handleAddQuestion = async (data: Partial<Question>) => {
    const question = await api.createQuestion({
      ...data,
      event_id: eventId,
    })
    addQuestion(question)
  }
  
  const handleUpdateQuestion = async (id: string, data: Partial<Question>) => {
    const updated = await api.updateQuestion(id, data)
    updateQuestion(id, updated)
  }
  
  const handleDeleteQuestion = async (id: string) => {
    if (!confirm('Biztosan törlöd ezt a kérdést?')) return
    await api.deleteQuestion(id)
    removeQuestion(id)
  }
  
  const handleActivateQuestion = async (id: string) => {
    const updated = await api.activateQuestion(id)
    questions.forEach(q => {
      if (q.state === 'active' && q.id !== id) {
        updateQuestion(q.id, { state: 'closed', closed_at: new Date().toISOString() })
      }
    })
    updateQuestion(id, updated)
  }
  
  const handleCloseQuestion = async (id: string) => {
    const updated = await api.closeQuestion(id)
    updateQuestion(id, updated)
    const count = await api.getVoteCount(id)
    setVoteCountMap(prev => ({ ...prev, [id]: count }))
  }
  
  const copyEventCode = () => {
    if (currentEvent) {
      navigator.clipboard.writeText(currentEvent.event_code)
      setCopiedCode(true)
      setTimeout(() => setCopiedCode(false), 2000)
    }
  }
  
  if (loading && !currentEvent) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-4 border-gold-400/30 border-t-gold-400 animate-spin" />
        </div>
      </div>
    )
  }
  
  const presentCount = participants.filter(p => p.is_present).length
  const activeQuestion = questions.find(q => q.state === 'active')
  
  return (
    <div className="max-w-6xl mx-auto animate-fade-up" style={{ animationFillMode: 'forwards' }}>
      {/* Header */}
      <div className="flex items-start gap-4 mb-8">
        <button
          onClick={() => navigate('/admin')}
          className="mt-1 p-2.5 hover:bg-obsidian-100 dark:hover:bg-obsidian-800 rounded-xl transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-obsidian-500" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="font-display text-display-md text-obsidian-900 dark:text-ivory-100 truncate">
            {currentEvent?.name || 'Event'}
          </h1>
          <div className="flex flex-wrap items-center gap-3 mt-2">
            <Badge 
              variant={currentEvent?.state === 'active' ? 'success' : 'default'}
              dot
            >
              {currentEvent?.state && t(`events.status.${currentEvent.state}`)}
            </Badge>
            <button
              onClick={copyEventCode}
              className="flex items-center gap-2 px-3 py-1.5 bg-obsidian-100 dark:bg-obsidian-800 hover:bg-obsidian-200 dark:hover:bg-obsidian-700 rounded-lg transition-colors group"
            >
              <span className="font-mono text-sm tracking-widest text-obsidian-600 dark:text-obsidian-300">
                {currentEvent?.event_code}
              </span>
              {copiedCode ? (
                <Check className="w-4 h-4 text-ballot-yes" />
              ) : (
                <Copy className="w-4 h-4 text-obsidian-400 group-hover:text-obsidian-600 dark:group-hover:text-obsidian-200" />
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* Stats bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MiniStat 
          icon={<Users className="w-5 h-5 text-blue-500" />}
          value={`${presentCount}/${participants.length}`}
          label="Present"
        />
        <MiniStat 
          icon={<HelpCircle className="w-5 h-5 text-purple-500" />}
          value={questions.length}
          label="Questions"
        />
        <MiniStat 
          icon={<BarChart3 className="w-5 h-5 text-emerald-500" />}
          value={questions.filter(q => q.state === 'closed').length}
          label="Completed"
        />
        <MiniStat 
          icon={
            <div className={`w-3 h-3 rounded-full ${activeQuestion ? 'bg-emerald-500 animate-pulse' : 'bg-obsidian-300'}`} />
          }
          value={activeQuestion ? 'Live' : 'Idle'}
          label="Status"
          highlight={!!activeQuestion}
        />
      </div>
      
      {/* Export & QR section */}
      {currentEvent && (
        <div className="mb-8 grid lg:grid-cols-4 gap-6">
          <div className="lg:col-span-2">
            <ExportButtons
              event={currentEvent}
              participants={participants}
              questions={questions}
            />
          </div>
          <div>
            <EventQRCode event={currentEvent} />
          </div>
          <div>
            <Card padding="md" className="h-full">
              <div className="flex flex-col h-full">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="w-5 h-5 text-gray-500" />
                  <h3 className="font-medium text-gray-900 dark:text-white">{t('audit.title')}</h3>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 flex-1">
                  Események, szavazások és bejelentkezések naplója
                </p>
                <Button
                  variant="outline"
                  onClick={() => setShowAuditLog(true)}
                  className="w-full"
                >
                  <FileText className="w-4 h-4" />
                  Napló megtekintése
                </Button>
              </div>
            </Card>
          </div>
        </div>
      )}
      
      {/* Main content */}
      <div className="grid lg:grid-cols-2 gap-6">
        <ParticipantManager
          participants={participants}
          onAdd={handleAddParticipant}
          onAddBulk={handleAddParticipantsBulk}
          onDelete={handleDeleteParticipant}
          onRegenerateCode={handleRegenerateCode}
        />
        
        <QuestionManager
          questions={questions}
          voteCountMap={voteCountMap}
          totalParticipants={participants.length}
          quorumInfo={currentEvent ? {
            quorumType: currentEvent.quorum_type || 'percentage',
            quorumValue: currentEvent.quorum_value ?? currentEvent.quorum_percent ?? 50,
            presentCount: presentCount,
            totalCount: participants.length
          } : undefined}
          onAdd={handleAddQuestion}
          onUpdate={handleUpdateQuestion}
          onDelete={handleDeleteQuestion}
          onActivate={handleActivateQuestion}
          onClose={handleCloseQuestion}
          onShowResults={(q) => setShowResults(q)}
        />
      </div>
      
      {showResults && (
        <ResultsModal
          question={showResults}
          totalParticipants={presentCount}
          onClose={() => setShowResults(null)}
        />
      )}

      {/* Audit Log Modal */}
      <AuditLogModal
        isOpen={showAuditLog}
        onClose={() => setShowAuditLog(false)}
        eventId={eventId}
      />
    </div>
  )
}

// Stat Card Component
function StatCard({ 
  icon, 
  label, 
  value, 
  accent = 'default' 
}: { 
  icon: React.ReactNode; 
  label: string; 
  value: number;
  accent?: 'default' | 'gold' | 'green';
}) {
  const accentStyles = {
    default: '',
    gold: 'ring-1 ring-gold-400/20',
    green: 'ring-1 ring-emerald-400/20',
  }
  
  return (
    <Card hover className={accentStyles[accent]}>
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-obsidian-100 dark:bg-obsidian-800 flex items-center justify-center">
          {icon}
        </div>
        <div>
          <p className="font-display text-2xl font-semibold text-obsidian-900 dark:text-ivory-100">
            {value}
          </p>
          <p className="text-sm text-obsidian-500 dark:text-obsidian-400">{label}</p>
        </div>
      </div>
    </Card>
  )
}

// Mini stat for detail page
function MiniStat({ 
  icon, 
  value, 
  label,
  highlight = false,
}: { 
  icon: React.ReactNode; 
  value: string | number; 
  label: string;
  highlight?: boolean;
}) {
  return (
    <Card padding="sm" className={highlight ? 'ring-1 ring-emerald-400/30' : ''}>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-obsidian-100 dark:bg-obsidian-800 flex items-center justify-center">
          {icon}
        </div>
        <div>
          <p className={`font-display text-xl font-semibold ${highlight ? 'text-emerald-600 dark:text-emerald-400' : 'text-obsidian-900 dark:text-ivory-100'}`}>
            {value}
          </p>
          <p className="text-xs text-obsidian-500 dark:text-obsidian-400">{label}</p>
        </div>
      </div>
    </Card>
  )
}

// Demo Helper Component
function DemoHelper() {
  const { addEvent } = useEventStore()
  const [creating, setCreating] = useState(false)
  
  const createDemoEvent = async () => {
    setCreating(true)
    try {
      const event = await api.createEvent({
        organization_id: DEMO_ORG_ID,
        name: 'Demo Közgyűlés 2026',
        description: 'Teszt esemény a fejlesztéshez',
        event_code: api.generateEventCode(),
        quorum_percent: 50,
        state: 'active',
        created_by: '00000000-0000-0000-0000-000000000000',
      })
      addEvent(event)
      
      await api.createParticipants([
        { event_id: event.id, name: 'Kiss János', email: 'kiss.janos@test.hu', access_code: 'TEST01' },
        { event_id: event.id, name: 'Nagy Péter', email: 'nagy.peter@test.hu', access_code: 'TEST02' },
        { event_id: event.id, name: 'Szabó Anna', email: 'szabo.anna@test.hu', access_code: 'TEST03' },
      ])
      
      await api.createQuestion({
        event_id: event.id,
        text_hu: 'Elfogadja-e a közgyűlés az éves beszámolót?',
        type: 'binary',
        threshold_type: 'simple_majority',
        is_anonymous: true,
        abstain_counts: true,
        order_index: 0,
        options: [
          { id: 'yes', label_hu: 'Igen' },
          { id: 'no', label_hu: 'Nem' },
          { id: 'abstain', label_hu: 'Tartózkodom' },
        ],
      })
      
      alert(`Demo event created!\nCode: ${event.event_code}\nTest codes: TEST01, TEST02, TEST03`)
    } catch (err: any) {
      console.error('Failed to create demo event:', err)
      alert('Error: ' + err.message)
    } finally {
      setCreating(false)
    }
  }
  
  return (
    <Card className="mt-10 !bg-gold-50 dark:!bg-gold-900/10 border-gold-200 dark:border-gold-800/30" padding="md">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gold-100 dark:bg-gold-900/30 flex items-center justify-center">
            <span className="text-xl">🧪</span>
          </div>
          <div>
            <p className="font-medium text-gold-800 dark:text-gold-200">Developer Mode</p>
            <p className="text-sm text-gold-600 dark:text-gold-400">
              Create demo data for testing
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={createDemoEvent}
          loading={creating}
          className="!border-gold-300 dark:!border-gold-700 !text-gold-700 dark:!text-gold-300 hover:!bg-gold-100 dark:hover:!bg-gold-900/30"
        >
          <Plus className="w-4 h-4" />
          Demo Event
        </Button>
      </div>
    </Card>
  )
}
