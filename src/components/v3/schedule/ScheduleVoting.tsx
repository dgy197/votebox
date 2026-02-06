import { useState } from 'react'
import { Calendar, Clock, Check, AlertCircle, X, Send, Loader2 } from 'lucide-react'
import { Button } from '../../ui/Button'
import { Card, CardHeader } from '../../ui/Card'
import { useScheduleStore } from '../../../stores/scheduleStore'
import type { ScheduleVoteValue } from '../../../types/v3'

interface ScheduleVotingProps {
  meetingId: string
  memberId: string
  memberName?: string
  disabled?: boolean
}

const voteOptions: { value: ScheduleVoteValue; label: string; icon: typeof Check; color: string; bg: string }[] = [
  { 
    value: 'yes', 
    label: 'Jó', 
    icon: Check, 
    color: 'text-green-600 dark:text-green-400',
    bg: 'bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700 hover:bg-green-200 dark:hover:bg-green-900/50'
  },
  { 
    value: 'maybe', 
    label: 'Ha muszáj', 
    icon: AlertCircle, 
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-100 dark:bg-amber-900/30 border-amber-300 dark:border-amber-700 hover:bg-amber-200 dark:hover:bg-amber-900/50'
  },
  { 
    value: 'no', 
    label: 'Nem', 
    icon: X, 
    color: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700 hover:bg-red-200 dark:hover:bg-red-900/50'
  },
]

export function ScheduleVoting({ meetingId, memberId, memberName, disabled = false }: ScheduleVotingProps) {
  const { options, loading, error, vote, clearError } = useScheduleStore()
  const [pendingVotes, setPendingVotes] = useState<Map<string, ScheduleVoteValue>>(new Map())
  const [submitting, setSubmitting] = useState(false)

  const getUserVote = (optionId: string): ScheduleVoteValue | undefined => {
    // Check pending votes first
    if (pendingVotes.has(optionId)) {
      return pendingVotes.get(optionId)
    }
    // Then check existing votes
    const option = options.find(o => o.id === optionId)
    const existingVote = option?.votes.find(v => v.member_id === memberId)
    return existingVote?.vote as ScheduleVoteValue | undefined
  }

  const handleVoteChange = (optionId: string, voteValue: ScheduleVoteValue) => {
    if (disabled) return
    
    setPendingVotes(prev => {
      const next = new Map(prev)
      const currentVote = getUserVote(optionId)
      
      // If clicking the same vote, remove it
      if (currentVote === voteValue) {
        next.delete(optionId)
      } else {
        next.set(optionId, voteValue)
      }
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

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString('hu-HU', {
      weekday: 'short',
      month: 'short',
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

      {/* Voting grid */}
      <div className="space-y-3">
        {options.map((option) => {
          const currentVote = getUserVote(option.id)
          const isPending = pendingVotes.has(option.id)
          
          return (
            <div
              key={option.id}
              className={`
                p-4 rounded-xl border transition-all
                ${option.is_winner 
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700' 
                  : 'bg-white dark:bg-obsidian-800/50 border-obsidian-200 dark:border-obsidian-700'
                }
              `}
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                {/* Date/Time info */}
                <div className="flex items-center gap-3 min-w-[200px]">
                  <div className="flex flex-col items-center p-2 bg-obsidian-100 dark:bg-obsidian-700 rounded-lg min-w-[50px]">
                    <span className="text-xs text-obsidian-500 dark:text-obsidian-400 uppercase">
                      {new Date(option.datetime).toLocaleDateString('hu-HU', { weekday: 'short' })}
                    </span>
                    <span className="text-lg font-bold text-obsidian-900 dark:text-ivory-100">
                      {new Date(option.datetime).getDate()}
                    </span>
                  </div>
                  <div>
                    <div className="font-medium text-obsidian-900 dark:text-ivory-100">
                      {formatDate(option.datetime)}
                    </div>
                    <div className="flex items-center gap-1 text-sm text-obsidian-500 dark:text-obsidian-400">
                      <Clock className="w-3 h-3" />
                      <span>{formatTime(option.datetime)}</span>
                      <span className="mx-1">•</span>
                      <span>{option.duration_minutes} perc</span>
                    </div>
                  </div>
                  {option.is_winner && (
                    <span className="px-2 py-1 text-xs font-medium bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-300 rounded-full whitespace-nowrap">
                      ✓ Kiválasztva
                    </span>
                  )}
                </div>

                {/* Vote buttons */}
                <div className="flex gap-2 flex-1 justify-end">
                  {voteOptions.map(({ value, label, icon: Icon, color, bg }) => {
                    const isSelected = currentVote === value
                    
                    return (
                      <button
                        key={value}
                        onClick={() => handleVoteChange(option.id, value)}
                        disabled={disabled || option.is_winner}
                        className={`
                          flex items-center gap-1.5 px-3 py-2 rounded-lg border-2 transition-all
                          ${isSelected 
                            ? `${bg} border-current ${color} font-medium` 
                            : 'bg-white dark:bg-obsidian-800 border-obsidian-200 dark:border-obsidian-600 text-obsidian-500 dark:text-obsidian-400 hover:border-obsidian-300 dark:hover:border-obsidian-500'
                          }
                          ${disabled || option.is_winner ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                          ${isPending && isSelected ? 'ring-2 ring-gold-400 ring-offset-2' : ''}
                        `}
                        title={label}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="hidden sm:inline text-sm">{label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Vote count summary */}
              <div className="flex items-center gap-4 mt-3 pt-3 border-t border-obsidian-100 dark:border-obsidian-700 text-sm text-obsidian-500 dark:text-obsidian-400">
                <span className="flex items-center gap-1">
                  <Check className="w-4 h-4 text-green-500" />
                  {option.summary.yes}
                </span>
                <span className="flex items-center gap-1">
                  <AlertCircle className="w-4 h-4 text-amber-500" />
                  {option.summary.maybe}
                </span>
                <span className="flex items-center gap-1">
                  <X className="w-4 h-4 text-red-500" />
                  {option.summary.no}
                </span>
                <span className="text-obsidian-400 dark:text-obsidian-500">
                  ({option.summary.total} szavazat)
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Submit button */}
      {!disabled && pendingVotes.size > 0 && (
        <div className="mt-6 flex justify-end">
          <Button
            onClick={handleSubmitAll}
            loading={submitting}
            icon={<Send className="w-4 h-4" />}
          >
            Szavazatok mentése ({pendingVotes.size})
          </Button>
        </div>
      )}
    </Card>
  )
}
