import { useState, useMemo } from 'react'
import { format } from 'date-fns'
import { hu } from 'date-fns/locale'
import { Calendar, Clock, Check, AlertCircle, X, Send, Users, HelpCircle } from 'lucide-react'
import { Button } from '../../ui/Button'
import { Card, CardHeader } from '../../ui/Card'
import { useScheduleStore } from '../../../stores/scheduleStore'
import type { ScheduleVoteValue } from '../../../types/v3'

interface ScheduleVotingProps {
  meetingId: string
  memberId: string
  memberName?: string
  disabled?: boolean
  showAllVoters?: boolean // Show what others voted
}

const voteOptions: { value: ScheduleVoteValue; label: string; shortLabel: string; icon: typeof Check; color: string; bgSelected: string; bgHover: string }[] = [
  { 
    value: 'yes', 
    label: 'Megfelel', 
    shortLabel: '✓',
    icon: Check, 
    color: 'text-green-600 dark:text-green-400',
    bgSelected: 'bg-green-500 text-white border-green-500',
    bgHover: 'hover:bg-green-100 dark:hover:bg-green-900/30 hover:border-green-300 dark:hover:border-green-700'
  },
  { 
    value: 'maybe', 
    label: 'Ha muszáj', 
    shortLabel: '?',
    icon: AlertCircle, 
    color: 'text-amber-600 dark:text-amber-400',
    bgSelected: 'bg-amber-500 text-white border-amber-500',
    bgHover: 'hover:bg-amber-100 dark:hover:bg-amber-900/30 hover:border-amber-300 dark:hover:border-amber-700'
  },
  { 
    value: 'no', 
    label: 'Nem jó', 
    shortLabel: '✗',
    icon: X, 
    color: 'text-red-600 dark:text-red-400',
    bgSelected: 'bg-red-500 text-white border-red-500',
    bgHover: 'hover:bg-red-100 dark:hover:bg-red-900/30 hover:border-red-300 dark:hover:border-red-700'
  },
]

export function ScheduleVoting({ 
  memberId, 
  memberName, 
  disabled = false,
  showAllVoters = false 
}: ScheduleVotingProps) {
  const { options, error, vote, clearError } = useScheduleStore()
  const [pendingVotes, setPendingVotes] = useState<Map<string, ScheduleVoteValue>>(new Map())
  const [submitting, setSubmitting] = useState(false)
  const [expandedOption, setExpandedOption] = useState<string | null>(null)

  // Group options by date for better display
  const groupedOptions = useMemo(() => {
    return options.reduce((acc, option) => {
      const dateKey = format(new Date(option.datetime), 'yyyy-MM-dd')
      if (!acc[dateKey]) acc[dateKey] = []
      acc[dateKey].push(option)
      return acc
    }, {} as Record<string, typeof options>)
  }, [options])

  const getUserVote = (optionId: string): ScheduleVoteValue | undefined => {
    if (pendingVotes.has(optionId)) {
      return pendingVotes.get(optionId)
    }
    const option = options.find(o => o.id === optionId)
    const existingVote = option?.votes.find(v => v.member_id === memberId)
    return existingVote?.vote as ScheduleVoteValue | undefined
  }

  const handleVoteChange = (optionId: string, voteValue: ScheduleVoteValue) => {
    if (disabled) return
    
    setPendingVotes(prev => {
      const next = new Map(prev)
      const currentVote = getUserVote(optionId)
      
      if (currentVote === voteValue && !prev.has(optionId)) {
        // Already voted this, nothing to change
        return prev
      }
      
      next.set(optionId, voteValue)
      return next
    })
  }

  const handleSubmitAll = async () => {
    if (pendingVotes.size === 0) return
    
    setSubmitting(true)
    try {
      const promises = Array.from(pendingVotes.entries()).map(([optionId, voteValue]) =>
        vote(optionId, memberId, voteValue)
      )
      await Promise.all(promises)
      setPendingVotes(new Map())
    } finally {
      setSubmitting(false)
    }
  }

  // Quick vote all options
  const handleVoteAll = (voteValue: ScheduleVoteValue) => {
    if (disabled) return
    
    const newPending = new Map(pendingVotes)
    options.forEach(opt => {
      if (!opt.is_winner) {
        newPending.set(opt.id, voteValue)
      }
    })
    setPendingVotes(newPending)
  }

  if (options.length === 0) {
    return (
      <Card padding="lg">
        <div className="text-center py-8 text-obsidian-500 dark:text-obsidian-400">
          <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Még nincs időpont opció amire szavazni lehetne</p>
          <p className="text-sm mt-1">Várja meg, amíg a szervező hozzáadja az opciókat</p>
        </div>
      </Card>
    )
  }

  return (
    <Card padding="lg">
      <CardHeader 
        title="Időpont szavazás"
        subtitle={memberName ? `Szavazás: ${memberName}` : 'Jelölje be, mely időpontok megfelelnek Önnek'}
        icon={<Calendar className="w-5 h-5 text-gold-500" />}
      />

      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm flex justify-between items-center">
          <span>{error}</span>
          <button onClick={clearError} className="text-red-400 hover:text-red-600">×</button>
        </div>
      )}

      {/* Legend & quick actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 p-3 bg-obsidian-50 dark:bg-obsidian-800/50 rounded-xl">
        <div className="flex items-center gap-4 text-sm">
          {voteOptions.map(({ value, label, icon: Icon, color }) => (
            <div key={value} className="flex items-center gap-1.5">
              <Icon className={`w-4 h-4 ${color}`} />
              <span className="text-obsidian-600 dark:text-obsidian-300">{label}</span>
            </div>
          ))}
        </div>
        
        {!disabled && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-obsidian-400">Gyors:</span>
            {voteOptions.map(({ value, shortLabel, color }) => (
              <button
                key={value}
                onClick={() => handleVoteAll(value)}
                className={`w-6 h-6 rounded text-xs font-medium ${color} bg-obsidian-100 dark:bg-obsidian-700 hover:opacity-80`}
                title={`Mind ${value === 'yes' ? 'jó' : value === 'maybe' ? 'talán' : 'nem'}`}
              >
                {shortLabel}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Voting grid - grouped by date */}
      <div className="space-y-6">
        {Object.entries(groupedOptions)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([dateKey, dateOptions]) => (
            <div key={dateKey}>
              {/* Date header */}
              <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-gold-100 to-gold-200 dark:from-gold-900/30 dark:to-gold-800/30 rounded-xl">
                  <div className="text-center">
                    <div className="text-xs text-gold-600 dark:text-gold-400 font-medium uppercase">
                      {format(new Date(dateOptions[0].datetime), 'EEE', { locale: hu })}
                    </div>
                    <div className="text-lg font-bold text-gold-700 dark:text-gold-300">
                      {format(new Date(dateOptions[0].datetime), 'd', { locale: hu })}
                    </div>
                  </div>
                </div>
                <div>
                  <div className="font-medium text-obsidian-900 dark:text-ivory-100">
                    {format(new Date(dateOptions[0].datetime), 'yyyy. MMMM d.', { locale: hu })}
                  </div>
                  <div className="text-sm text-obsidian-500 dark:text-obsidian-400">
                    {format(new Date(dateOptions[0].datetime), 'EEEE', { locale: hu })}
                  </div>
                </div>
              </div>

              {/* Time slots for this date */}
              <div className="space-y-2 pl-14">
                {dateOptions
                  .sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime())
                  .map((option) => {
                    const currentVote = getUserVote(option.id)
                    const isPending = pendingVotes.has(option.id)
                    const isExpanded = expandedOption === option.id
                    
                    return (
                      <div
                        key={option.id}
                        className={`
                          rounded-xl border transition-all
                          ${option.is_winner 
                            ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700' 
                            : isPending
                              ? 'bg-gold-50 dark:bg-gold-900/10 border-gold-300 dark:border-gold-700'
                              : 'bg-white dark:bg-obsidian-800/50 border-obsidian-200 dark:border-obsidian-700'
                          }
                        `}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-3">
                          {/* Time info */}
                          <div className="flex items-center gap-3 min-w-[140px]">
                            <div className="flex items-center gap-1.5 text-obsidian-900 dark:text-ivory-100">
                              <Clock className="w-4 h-4 text-obsidian-400" />
                              <span className="font-medium">
                                {format(new Date(option.datetime), 'HH:mm', { locale: hu })}
                              </span>
                            </div>
                            <span className="text-xs px-1.5 py-0.5 bg-obsidian-100 dark:bg-obsidian-700 rounded text-obsidian-500 dark:text-obsidian-400">
                              {option.duration_minutes} perc
                            </span>
                            {option.is_winner && (
                              <span className="px-2 py-0.5 text-xs font-medium bg-green-500 text-white rounded-full">
                                ✓ Kiválasztva
                              </span>
                            )}
                          </div>

                          {/* Vote buttons */}
                          <div className="flex gap-2 flex-1 justify-end">
                            {voteOptions.map(({ value, label, icon: Icon, bgSelected, bgHover }) => {
                              const isSelected = currentVote === value
                              
                              return (
                                <button
                                  key={value}
                                  onClick={() => handleVoteChange(option.id, value)}
                                  disabled={disabled || option.is_winner}
                                  className={`
                                    flex items-center gap-1.5 px-3 py-2 rounded-lg border-2 transition-all font-medium text-sm
                                    ${isSelected 
                                      ? bgSelected
                                      : `bg-white dark:bg-obsidian-800 border-obsidian-200 dark:border-obsidian-600 text-obsidian-500 dark:text-obsidian-400 ${bgHover}`
                                    }
                                    ${disabled || option.is_winner ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                                  `}
                                  title={label}
                                >
                                  <Icon className="w-4 h-4" />
                                  <span className="hidden sm:inline">{label}</span>
                                </button>
                              )
                            })}
                          </div>
                        </div>

                        {/* Summary row */}
                        <div 
                          className="flex items-center justify-between px-3 py-2 border-t border-obsidian-100 dark:border-obsidian-700 text-sm cursor-pointer hover:bg-obsidian-50 dark:hover:bg-obsidian-800"
                          onClick={() => setExpandedOption(isExpanded ? null : option.id)}
                        >
                          <div className="flex items-center gap-4 text-obsidian-500 dark:text-obsidian-400">
                            <span className="flex items-center gap-1">
                              <Check className="w-4 h-4 text-green-500" />
                              <span className="font-medium">{option.summary.yes}</span>
                            </span>
                            <span className="flex items-center gap-1">
                              <AlertCircle className="w-4 h-4 text-amber-500" />
                              <span className="font-medium">{option.summary.maybe}</span>
                            </span>
                            <span className="flex items-center gap-1">
                              <X className="w-4 h-4 text-red-500" />
                              <span className="font-medium">{option.summary.no}</span>
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-obsidian-400">
                            <Users className="w-4 h-4" />
                            <span>{option.summary.total} szavazat</span>
                            {showAllVoters && option.votes.length > 0 && (
                              <HelpCircle className="w-4 h-4" />
                            )}
                          </div>
                        </div>

                        {/* Expanded voter details */}
                        {isExpanded && showAllVoters && option.votes.length > 0 && (
                          <div className="px-3 py-2 border-t border-obsidian-100 dark:border-obsidian-700 bg-obsidian-50/50 dark:bg-obsidian-900/30">
                            <div className="flex flex-wrap gap-1.5">
                              {option.votes.map(v => (
                                <span
                                  key={v.id}
                                  className={`
                                    px-2 py-0.5 text-xs rounded-full
                                    ${v.vote === 'yes' 
                                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                                      : v.vote === 'maybe'
                                        ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
                                        : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                                    }
                                  `}
                                >
                                  {v.vote === 'yes' ? '✓' : v.vote === 'maybe' ? '?' : '✗'} {v.member_id.slice(0, 8)}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
              </div>
            </div>
          ))}
      </div>

      {/* Submit button */}
      {!disabled && pendingVotes.size > 0 && (
        <div className="mt-6 flex items-center justify-between p-4 bg-gold-50 dark:bg-gold-900/20 border border-gold-200 dark:border-gold-700 rounded-xl">
          <div className="text-sm text-gold-700 dark:text-gold-300">
            <strong>{pendingVotes.size}</strong> módosítás mentésre vár
          </div>
          <Button
            onClick={handleSubmitAll}
            loading={submitting}
            variant="gold"
            icon={<Send className="w-4 h-4" />}
          >
            Szavazatok mentése
          </Button>
        </div>
      )}
    </Card>
  )
}
