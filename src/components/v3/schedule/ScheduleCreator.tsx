import { useState } from 'react'
import { format } from 'date-fns'
import { hu } from 'date-fns/locale'
import { Plus, Calendar, Clock, Trash2, Copy, AlertCircle } from 'lucide-react'
import { Button } from '../../ui/Button'
import { Card, CardHeader } from '../../ui/Card'
import { DatePicker } from '../../ui/DatePicker'
import { TimePicker } from '../../ui/TimePicker'
import { useScheduleStore } from '../../../stores/scheduleStore'

interface ScheduleCreatorProps {
  meetingId: string
  disabled?: boolean
}

const durationOptions = [
  { value: 30, label: '30 perc' },
  { value: 45, label: '45 perc' },
  { value: 60, label: '1 óra' },
  { value: 90, label: '1,5 óra' },
  { value: 120, label: '2 óra' },
  { value: 180, label: '3 óra' },
  { value: 240, label: '4 óra' },
]

export function ScheduleCreator({ meetingId, disabled = false }: ScheduleCreatorProps) {
  const { options, loading, error, createOption, deleteOption, clearError } = useScheduleStore()
  
  const [selectedDate, setSelectedDate] = useState<Date | undefined>()
  const [selectedTime, setSelectedTime] = useState('')
  const [duration, setDuration] = useState(60)
  const [showBulkAdd, setShowBulkAdd] = useState(false)
  const [bulkTimes, setBulkTimes] = useState<string[]>(['09:00', '14:00', '18:00'])

  const minDate = new Date()
  minDate.setHours(0, 0, 0, 0)

  const handleAddOption = async () => {
    if (!selectedDate || !selectedTime) return
    
    const datetime = `${format(selectedDate, 'yyyy-MM-dd')}T${selectedTime}:00`
    await createOption(meetingId, datetime, duration)
    
    // Reset time but keep date for quick adding
    setSelectedTime('')
  }

  const handleBulkAdd = async () => {
    if (!selectedDate || bulkTimes.length === 0) return
    
    for (const time of bulkTimes) {
      if (time) {
        const datetime = `${format(selectedDate, 'yyyy-MM-dd')}T${time}:00`
        await createOption(meetingId, datetime, duration)
      }
    }
    
    setBulkTimes(['09:00', '14:00', '18:00'])
    setShowBulkAdd(false)
  }

  const handleDuplicateOption = async (option: typeof options[0]) => {
    const date = new Date(option.datetime)
    date.setDate(date.getDate() + 7) // Add 1 week
    
    const datetime = date.toISOString().slice(0, 19)
    await createOption(meetingId, datetime, option.duration_minutes)
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return format(d, 'yyyy. MMMM d. (EEEE)', { locale: hu })
  }

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr)
    return format(d, 'HH:mm', { locale: hu })
  }

  // Group options by date
  const groupedOptions = options.reduce((acc, option) => {
    const dateKey = format(new Date(option.datetime), 'yyyy-MM-dd')
    if (!acc[dateKey]) acc[dateKey] = []
    acc[dateKey].push(option)
    return acc
  }, {} as Record<string, typeof options>)

  return (
    <Card padding="lg">
      <CardHeader 
        title="Időpont opciók"
        subtitle="Adjon hozzá lehetséges időpontokat a gyűléshez"
        icon={<Calendar className="w-5 h-5 text-gold-500" />}
      />

      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm flex justify-between items-center">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
          <button onClick={clearError} className="text-red-400 hover:text-red-600">×</button>
        </div>
      )}

      {/* Add new option form */}
      {!disabled && (
        <div className="space-y-4 mb-6 p-4 bg-obsidian-50 dark:bg-obsidian-800/50 rounded-xl">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Date picker */}
            <div>
              <label className="block text-sm font-medium text-obsidian-600 dark:text-obsidian-300 mb-1.5">
                Dátum
              </label>
              <DatePicker
                value={selectedDate}
                onChange={setSelectedDate}
                minDate={minDate}
                placeholder="Válasszon dátumot"
              />
            </div>
            
            {/* Time picker */}
            <div>
              <label className="block text-sm font-medium text-obsidian-600 dark:text-obsidian-300 mb-1.5">
                Időpont
              </label>
              <TimePicker
                value={selectedTime}
                onChange={setSelectedTime}
                placeholder="Válasszon időpontot"
              />
            </div>

            {/* Duration select */}
            <div>
              <label className="block text-sm font-medium text-obsidian-600 dark:text-obsidian-300 mb-1.5">
                Időtartam
              </label>
              <select
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-obsidian-200 dark:border-obsidian-700 bg-white dark:bg-obsidian-800 text-obsidian-900 dark:text-ivory-100 focus:ring-2 focus:ring-gold-400 focus:border-transparent text-sm"
              >
                {durationOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Add button */}
            <div className="flex items-end">
              <Button
                onClick={handleAddOption}
                disabled={!selectedDate || !selectedTime || loading}
                loading={loading}
                icon={<Plus className="w-4 h-4" />}
                className="w-full"
              >
                Hozzáadás
              </Button>
            </div>
          </div>

          {/* Bulk add toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowBulkAdd(!showBulkAdd)}
              className="text-sm text-gold-600 dark:text-gold-400 hover:underline"
            >
              {showBulkAdd ? 'Egyszerű hozzáadás' : 'Több időpont egyszerre'}
            </button>
          </div>

          {/* Bulk add UI */}
          {showBulkAdd && selectedDate && (
            <div className="p-3 bg-white dark:bg-obsidian-800 rounded-lg border border-obsidian-200 dark:border-obsidian-700">
              <div className="text-sm text-obsidian-600 dark:text-obsidian-300 mb-2">
                Időpontok: {format(selectedDate, 'yyyy. MM. dd.', { locale: hu })}
              </div>
              <div className="flex flex-wrap gap-2 mb-3">
                {bulkTimes.map((time, idx) => (
                  <div key={idx} className="flex items-center gap-1">
                    <input
                      type="time"
                      value={time}
                      onChange={(e) => {
                        const newTimes = [...bulkTimes]
                        newTimes[idx] = e.target.value
                        setBulkTimes(newTimes)
                      }}
                      className="px-2 py-1 text-sm rounded border border-obsidian-200 dark:border-obsidian-700 bg-white dark:bg-obsidian-900"
                    />
                    <button
                      onClick={() => setBulkTimes(bulkTimes.filter((_, i) => i !== idx))}
                      className="p-1 text-red-400 hover:text-red-600"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => setBulkTimes([...bulkTimes, '12:00'])}
                  className="px-2 py-1 text-sm text-gold-600 dark:text-gold-400 border border-dashed border-gold-300 dark:border-gold-700 rounded hover:bg-gold-50 dark:hover:bg-gold-900/20"
                >
                  + Időpont
                </button>
              </div>
              <Button
                onClick={handleBulkAdd}
                disabled={loading || bulkTimes.length === 0}
                loading={loading}
                size="sm"
              >
                Mind hozzáadása ({bulkTimes.filter(t => t).length})
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Options list - grouped by date */}
      <div className="space-y-4">
        {Object.keys(groupedOptions).length === 0 ? (
          <div className="text-center py-8 text-obsidian-500 dark:text-obsidian-400">
            <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Még nincs időpont opció</p>
            <p className="text-sm mt-1">Adjon hozzá lehetséges időpontokat</p>
          </div>
        ) : (
          Object.entries(groupedOptions)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([dateKey, dateOptions]) => (
              <div key={dateKey} className="space-y-2">
                {/* Date header */}
                <div className="flex items-center gap-2 text-sm font-medium text-obsidian-600 dark:text-obsidian-300">
                  <Calendar className="w-4 h-4" />
                  {formatDate(dateOptions[0].datetime)}
                </div>

                {/* Time slots for this date */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 pl-6">
                  {dateOptions
                    .sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime())
                    .map((option) => (
                      <div
                        key={option.id}
                        className={`
                          flex items-center justify-between p-3 rounded-lg
                          border transition-colors
                          ${option.is_winner 
                            ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700' 
                            : 'bg-white dark:bg-obsidian-800 border-obsidian-200 dark:border-obsidian-700 hover:border-obsidian-300 dark:hover:border-obsidian-600'
                          }
                        `}
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5 text-obsidian-900 dark:text-ivory-100">
                            <Clock className="w-4 h-4 text-obsidian-400" />
                            <span className="font-medium">{formatTime(option.datetime)}</span>
                          </div>
                          <span className="text-xs text-obsidian-400 dark:text-obsidian-500">
                            {option.duration_minutes} perc
                          </span>
                          {option.is_winner && (
                            <span className="px-1.5 py-0.5 text-xs font-medium bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-300 rounded">
                              ✓
                            </span>
                          )}
                        </div>

                        {!disabled && !option.is_winner && (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleDuplicateOption(option)}
                              className="p-1.5 text-obsidian-400 hover:text-gold-500 hover:bg-gold-50 dark:hover:bg-gold-900/20 rounded transition-colors"
                              title="+1 hét"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => deleteOption(option.id)}
                              className="p-1.5 text-obsidian-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                              title="Törlés"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            ))
        )}
      </div>

      {/* Summary */}
      {options.length > 0 && (
        <div className="mt-4 pt-4 border-t border-obsidian-100 dark:border-obsidian-700 text-sm text-obsidian-500 dark:text-obsidian-400">
          Összesen {options.length} időpont opció, {Object.keys(groupedOptions).length} különböző napon
        </div>
      )}
    </Card>
  )
}
