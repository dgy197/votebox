import { useState } from 'react'
import { Plus, Calendar, Clock, Trash2, Loader2 } from 'lucide-react'
import { Button } from '../../ui/Button'
import { Card, CardHeader } from '../../ui/Card'
import { useScheduleStore } from '../../../stores/scheduleStore'

interface ScheduleCreatorProps {
  meetingId: string
  disabled?: boolean
}

export function ScheduleCreator({ meetingId, disabled = false }: ScheduleCreatorProps) {
  const { options, loading, error, createOption, deleteOption, clearError } = useScheduleStore()
  
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [duration, setDuration] = useState(60)

  const handleAddOption = async () => {
    if (!date || !time) return
    
    const datetime = `${date}T${time}:00`
    await createOption(meetingId, datetime, duration)
    
    // Reset form
    setDate('')
    setTime('')
    setDuration(60)
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString('hu-HU', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleTimeString('hu-HU', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <Card padding="lg">
      <CardHeader 
        title="Időpont opciók"
        subtitle="Adjon hozzá lehetséges időpontokat a gyűléshez"
        icon={<Calendar className="w-5 h-5 text-gold-500" />}
      />

      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm flex justify-between items-center">
          <span>{error}</span>
          <button onClick={clearError} className="text-red-400 hover:text-red-600">×</button>
        </div>
      )}

      {/* Add new option form */}
      {!disabled && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-6">
          <div className="sm:col-span-1">
            <label className="block text-sm font-medium text-obsidian-600 dark:text-obsidian-300 mb-1.5">
              Dátum
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 rounded-lg border border-obsidian-200 dark:border-obsidian-700 bg-white dark:bg-obsidian-800 text-obsidian-900 dark:text-ivory-100 focus:ring-2 focus:ring-gold-400 focus:border-transparent"
            />
          </div>
          
          <div className="sm:col-span-1">
            <label className="block text-sm font-medium text-obsidian-600 dark:text-obsidian-300 mb-1.5">
              Időpont
            </label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-obsidian-200 dark:border-obsidian-700 bg-white dark:bg-obsidian-800 text-obsidian-900 dark:text-ivory-100 focus:ring-2 focus:ring-gold-400 focus:border-transparent"
            />
          </div>

          <div className="sm:col-span-1">
            <label className="block text-sm font-medium text-obsidian-600 dark:text-obsidian-300 mb-1.5">
              Időtartam (perc)
            </label>
            <select
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg border border-obsidian-200 dark:border-obsidian-700 bg-white dark:bg-obsidian-800 text-obsidian-900 dark:text-ivory-100 focus:ring-2 focus:ring-gold-400 focus:border-transparent"
            >
              <option value={30}>30 perc</option>
              <option value={60}>1 óra</option>
              <option value={90}>1.5 óra</option>
              <option value={120}>2 óra</option>
              <option value={180}>3 óra</option>
            </select>
          </div>

          <div className="sm:col-span-1 flex items-end">
            <Button
              onClick={handleAddOption}
              disabled={!date || !time || loading}
              loading={loading}
              icon={<Plus className="w-4 h-4" />}
              className="w-full"
            >
              Hozzáadás
            </Button>
          </div>
        </div>
      )}

      {/* Options list */}
      <div className="space-y-2">
        {options.length === 0 ? (
          <div className="text-center py-8 text-obsidian-500 dark:text-obsidian-400">
            <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Még nincs időpont opció</p>
            <p className="text-sm mt-1">Adjon hozzá lehetséges időpontokat</p>
          </div>
        ) : (
          options.map((option) => (
            <div
              key={option.id}
              className={`
                flex items-center justify-between p-4 rounded-xl
                border transition-colors
                ${option.is_winner 
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700' 
                  : 'bg-obsidian-50 dark:bg-obsidian-800/50 border-obsidian-200 dark:border-obsidian-700'
                }
              `}
            >
              <div className="flex items-center gap-4">
                <div className="flex flex-col items-center p-2 bg-white dark:bg-obsidian-800 rounded-lg shadow-sm min-w-[60px]">
                  <span className="text-xs text-obsidian-500 dark:text-obsidian-400 uppercase">
                    {new Date(option.datetime).toLocaleDateString('hu-HU', { weekday: 'short' })}
                  </span>
                  <span className="text-xl font-bold text-obsidian-900 dark:text-ivory-100">
                    {new Date(option.datetime).getDate()}
                  </span>
                </div>
                <div>
                  <div className="font-medium text-obsidian-900 dark:text-ivory-100">
                    {formatDate(option.datetime)}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-obsidian-500 dark:text-obsidian-400">
                    <Clock className="w-4 h-4" />
                    <span>{formatTime(option.datetime)}</span>
                    <span className="text-obsidian-300 dark:text-obsidian-600">•</span>
                    <span>{option.duration_minutes} perc</span>
                  </div>
                </div>
                {option.is_winner && (
                  <span className="px-2 py-1 text-xs font-medium bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-300 rounded-full">
                    ✓ Kiválasztva
                  </span>
                )}
              </div>

              {!disabled && !option.is_winner && (
                <button
                  onClick={() => deleteOption(option.id)}
                  className="p-2 text-obsidian-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  title="Törlés"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </Card>
  )
}
