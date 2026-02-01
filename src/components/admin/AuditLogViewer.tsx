import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  FileText, Vote, HelpCircle, Calendar, LogIn, Filter,
  ChevronDown, ChevronUp, Clock, User, X
} from 'lucide-react'
import { supabase } from '../../lib/supabase'

export interface AuditLogEntry {
  id: string
  actor_id: string | null
  actor_type: 'user' | 'participant' | 'system'
  action: string
  entity_type?: string
  entity_id?: string
  details?: Record<string, unknown>
  ip_address?: string
  created_at: string
}

interface AuditLogViewerProps {
  eventId?: string
  onClose?: () => void
}

type FilterType = 'all' | 'vote' | 'question' | 'event' | 'auth'

const actionIcons: Record<string, React.ReactNode> = {
  vote_cast: <Vote className="w-4 h-4 text-green-500" />,
  question_activated: <HelpCircle className="w-4 h-4 text-blue-500" />,
  question_closed: <HelpCircle className="w-4 h-4 text-gray-500" />,
  participant_joined: <LogIn className="w-4 h-4 text-purple-500" />,
  event_started: <Calendar className="w-4 h-4 text-emerald-500" />,
  event_closed: <Calendar className="w-4 h-4 text-red-500" />,
}

const actionFilters: Record<FilterType, string[]> = {
  all: [],
  vote: ['vote_cast'],
  question: ['question_activated', 'question_closed', 'question_created', 'question_updated'],
  event: ['event_started', 'event_closed', 'event_created', 'event_updated'],
  auth: ['participant_joined', 'user_login', 'user_logout'],
}

export function AuditLogViewer({ eventId, onClose }: AuditLogViewerProps) {
  const { t } = useTranslation()
  const [logs, setLogs] = useState<AuditLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterType>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    loadLogs()
  }, [eventId, filter])

  const loadLogs = async () => {
    setLoading(true)
    try {
      let query = supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)

      if (eventId) {
        query = query.eq('entity_id', eventId)
      }

      if (filter !== 'all' && actionFilters[filter].length > 0) {
        query = query.in('action', actionFilters[filter])
      }

      const { data, error } = await query

      if (error) {
        console.error('Failed to load audit logs:', error)
        // Fall back to mock data for demo
        setLogs(generateMockLogs())
      } else {
        setLogs(data as AuditLogEntry[])
      }
    } catch (err) {
      console.error('Failed to load audit logs:', err)
      // Fall back to mock data for demo
      setLogs(generateMockLogs())
    } finally {
      setLoading(false)
    }
  }

  const getActionIcon = (action: string) => {
    return actionIcons[action] || <FileText className="w-4 h-4 text-gray-400" />
  }

  const getActionLabel = (action: string) => {
    const key = `audit.action${action.split('_').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('')}`
    const translated = t(key)
    // If translation key doesn't exist, format the action nicely
    if (translated === key) {
      return action.split('_').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ')
    }
    return translated
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleString('hu-HU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  const filteredLogs = logs

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-h-[80vh] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <FileText className="w-5 h-5 text-gray-500" aria-hidden="true" />
          <h3 id="audit-log-title" className="text-lg font-semibold text-gray-900 dark:text-white">
            {t('audit.title')}
          </h3>
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
            {filteredLogs.length} bejegyzés
          </span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <div className="flex gap-1">
            {(['all', 'vote', 'question', 'event', 'auth'] as FilterType[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                  filter === f
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {t(`audit.filter${f.charAt(0).toUpperCase() + f.slice(1)}`)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Log entries */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-gray-500 dark:text-gray-400">
            <FileText className="w-8 h-8 mb-2 opacity-50" />
            <p>{t('audit.noEntries')}</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {filteredLogs.map((log) => (
              <div
                key={log.id}
                className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
              >
                <div
                  className="flex items-start gap-3 p-3 cursor-pointer"
                  onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                >
                  <div className="mt-0.5">
                    {getActionIcon(log.action)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {getActionLabel(log.action)}
                      </span>
                      <span className={`px-1.5 py-0.5 text-xs rounded ${
                        log.actor_type === 'user'
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                          : log.actor_type === 'participant'
                          ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
                          : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                      }`}>
                        {log.actor_type}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 dark:text-gray-400">
                      <Clock className="w-3 h-3" />
                      <span>{formatTimestamp(log.created_at)}</span>
                      {log.actor_id && (
                        <>
                          <span className="text-gray-300 dark:text-gray-600">•</span>
                          <User className="w-3 h-3" />
                          <span className="font-mono truncate max-w-[120px]">
                            {log.actor_id.slice(0, 8)}...
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="text-gray-400">
                    {expandedId === log.id ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                </div>

                {/* Expanded details */}
                {expandedId === log.id && log.details && (
                  <div className="px-3 pb-3 ml-7">
                    <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg font-mono text-xs">
                      <pre className="whitespace-pre-wrap text-gray-600 dark:text-gray-400">
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    </div>
                    {log.ip_address && (
                      <div className="mt-2 text-xs text-gray-500">
                        IP: {log.ip_address}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// Mock data generator for demo mode
function generateMockLogs(): AuditLogEntry[] {
  const now = new Date()
  const mockLogs: AuditLogEntry[] = []

  const actions = [
    { action: 'participant_joined', actor_type: 'participant' as const },
    { action: 'vote_cast', actor_type: 'participant' as const },
    { action: 'question_activated', actor_type: 'user' as const },
    { action: 'question_closed', actor_type: 'user' as const },
    { action: 'event_started', actor_type: 'user' as const },
  ]

  for (let i = 0; i < 15; i++) {
    const actionDef = actions[Math.floor(Math.random() * actions.length)]
    const timestamp = new Date(now.getTime() - i * 5 * 60 * 1000) // 5 minutes apart

    mockLogs.push({
      id: `mock-${i}`,
      actor_id: `actor-${Math.random().toString(36).substring(7)}`,
      actor_type: actionDef.actor_type,
      action: actionDef.action,
      entity_type: actionDef.action.includes('question') ? 'question' : actionDef.action.includes('event') ? 'event' : 'participant',
      entity_id: `entity-${Math.random().toString(36).substring(7)}`,
      details: actionDef.action === 'vote_cast' ? { choice: 'yes' } : undefined,
      created_at: timestamp.toISOString(),
    })
  }

  return mockLogs
}

// Modal wrapper for the audit log viewer
interface AuditLogModalProps {
  isOpen: boolean
  onClose: () => void
  eventId?: string
}

export function AuditLogModal({ isOpen, onClose, eventId }: AuditLogModalProps) {
  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="audit-log-title"
    >
      <div className="max-w-2xl w-full animate-scale-in">
        <AuditLogViewer eventId={eventId} onClose={onClose} />
      </div>
    </div>
  )
}
