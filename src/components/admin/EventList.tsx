import { useTranslation } from 'react-i18next'
import { Calendar, ChevronRight, Trash2, Play, Square } from 'lucide-react'
import type { Event } from '../../types'

interface EventListProps {
  events: Event[]
  onSelect: (event: Event) => void
  onDelete: (event: Event) => void
  onStatusChange: (event: Event, status: Event['state']) => void
}

export function EventList({ events, onSelect, onDelete, onStatusChange }: EventListProps) {
  const { t } = useTranslation()
  
  const getStatusColor = (state: Event['state']) => {
    switch (state) {
      case 'draft': return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
      case 'scheduled': return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
      case 'active': return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
      case 'closed': return 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300'
      case 'archived': return 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
      default: return 'bg-gray-100 text-gray-700'
    }
  }
  
  if (events.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>Még nincs esemény. Hozz létre egyet!</p>
      </div>
    )
  }
  
  return (
    <div className="space-y-3">
      {events.map((event) => (
        <div
          key={event.id}
          className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow"
        >
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onSelect(event)}>
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                    {event.name}
                  </h3>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(event.state)}`}>
                    {t(`events.status.${event.state}`)}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                  <span className="font-mono">{event.event_code}</span>
                  {event.starts_at && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(event.starts_at).toLocaleDateString('hu-HU')}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2 ml-4">
                {event.state === 'draft' && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onStatusChange(event, 'active') }}
                    className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                    title="Aktiválás"
                  >
                    <Play className="w-5 h-5" />
                  </button>
                )}
                {event.state === 'active' && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onStatusChange(event, 'closed') }}
                    className="p-2 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors"
                    title="Lezárás"
                  >
                    <Square className="w-5 h-5" />
                  </button>
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(event) }}
                  className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  title={t('common.delete')}
                >
                  <Trash2 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => onSelect(event)}
                  className="p-2 text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
