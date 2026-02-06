import { useMemo } from 'react'
import { 
  Trophy, Calendar, Clock, Check, AlertCircle, X, 
  Users, Star, ChevronRight, Crown
} from 'lucide-react'
import { Button } from '../../ui/Button'
import { Card, CardHeader } from '../../ui/Card'
import { useScheduleStore, ScheduleOptionWithVotes } from '../../../stores/scheduleStore'

interface ScheduleResultsProps {
  meetingId: string
  canSelectWinner?: boolean
  showVoterDetails?: boolean
}

interface VoterInfo {
  memberId: string
  memberName: string
  vote: 'yes' | 'maybe' | 'no'
}

export function ScheduleResults({ 
  meetingId, 
  canSelectWinner = false,
  showVoterDetails = false 
}: ScheduleResultsProps) {
  const { options, loading, selectWinner, calculateWinner } = useScheduleStore()

  const suggestedWinner = useMemo(() => calculateWinner(), [options])
  const currentWinner = options.find(o => o.is_winner)

  const sortedOptions = useMemo(() => {
    return [...options].sort((a, b) => {
      // Winner always first
      if (a.is_winner) return -1
      if (b.is_winner) return 1
      // Then by score
      return b.summary.score - a.summary.score
    })
  }, [options])

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

  const getScorePercentage = (option: ScheduleOptionWithVotes) => {
    const maxScore = options.reduce((max, o) => Math.max(max, o.summary.score), 0)
    if (maxScore <= 0) return 0
    return Math.max(0, (option.summary.score / maxScore) * 100)
  }

  if (options.length === 0) {
    return (
      <Card padding="lg">
        <div className="text-center py-8 text-obsidian-500 dark:text-obsidian-400">
          <Trophy className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Még nincs eredmény</p>
          <p className="text-sm mt-1">Adjon hozzá időpontokat és gyűjtse be a szavazatokat</p>
        </div>
      </Card>
    )
  }

  return (
    <Card padding="lg">
      <CardHeader 
        title="Eredmények"
        subtitle={currentWinner 
          ? 'A gyűlés időpontja ki van választva' 
          : `${options.length} opció, összesen ${options.reduce((sum, o) => sum + o.summary.total, 0)} szavazat`
        }
        icon={<Trophy className="w-5 h-5 text-gold-500" />}
      />

      {/* Winner suggestion */}
      {!currentWinner && suggestedWinner && canSelectWinner && (
        <div className="mb-6 p-4 bg-gradient-to-r from-gold-50 to-gold-100 dark:from-gold-900/20 dark:to-gold-800/20 border border-gold-200 dark:border-gold-700 rounded-xl">
          <div className="flex items-center gap-3 mb-2">
            <Crown className="w-5 h-5 text-gold-600" />
            <span className="font-medium text-gold-800 dark:text-gold-300">
              Javasolt időpont
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-lg font-semibold text-obsidian-900 dark:text-ivory-100">
                {formatDate(suggestedWinner.datetime)}
              </div>
              <div className="text-sm text-obsidian-600 dark:text-obsidian-400">
                {formatTime(suggestedWinner.datetime)} • {suggestedWinner.duration_minutes} perc
              </div>
            </div>
            <Button
              onClick={() => selectWinner(suggestedWinner.id)}
              loading={loading}
              size="sm"
              variant="gold"
              icon={<Check className="w-4 h-4" />}
            >
              Kiválasztás
            </Button>
          </div>
        </div>
      )}

      {/* Results list */}
      <div className="space-y-3">
        {sortedOptions.map((option, index) => {
          const isWinner = option.is_winner
          const isSuggested = suggestedWinner?.id === option.id && !currentWinner
          const percentage = getScorePercentage(option)

          return (
            <div
              key={option.id}
              className={`
                relative p-4 rounded-xl border transition-all overflow-hidden
                ${isWinner 
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700' 
                  : isSuggested
                    ? 'bg-gold-50 dark:bg-gold-900/10 border-gold-300 dark:border-gold-700'
                    : 'bg-white dark:bg-obsidian-800/50 border-obsidian-200 dark:border-obsidian-700'
                }
              `}
            >
              {/* Progress bar background */}
              <div 
                className={`
                  absolute inset-y-0 left-0 transition-all
                  ${isWinner 
                    ? 'bg-green-100/50 dark:bg-green-900/30' 
                    : 'bg-obsidian-100/50 dark:bg-obsidian-700/30'
                  }
                `}
                style={{ width: `${percentage}%` }}
              />

              <div className="relative flex flex-col sm:flex-row sm:items-center gap-4">
                {/* Rank badge */}
                <div className={`
                  flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold
                  ${isWinner 
                    ? 'bg-green-500 text-white' 
                    : isSuggested
                      ? 'bg-gold-500 text-white'
                      : 'bg-obsidian-200 dark:bg-obsidian-600 text-obsidian-600 dark:text-obsidian-300'
                  }
                `}>
                  {isWinner ? <Check className="w-4 h-4" /> : index + 1}
                </div>

                {/* Date/Time info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-obsidian-900 dark:text-ivory-100">
                      {formatDate(option.datetime)}
                    </span>
                    {isWinner && (
                      <span className="px-2 py-0.5 text-xs font-medium bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-300 rounded-full">
                        Kiválasztva
                      </span>
                    )}
                    {isSuggested && !isWinner && (
                      <span className="px-2 py-0.5 text-xs font-medium bg-gold-100 dark:bg-gold-800 text-gold-700 dark:text-gold-300 rounded-full">
                        Javasolt
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-sm text-obsidian-500 dark:text-obsidian-400">
                    <Clock className="w-3 h-3" />
                    <span>{formatTime(option.datetime)}</span>
                    <span className="mx-1">•</span>
                    <span>{option.duration_minutes} perc</span>
                  </div>
                </div>

                {/* Vote summary */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-3 text-sm">
                    <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                      <Check className="w-4 h-4" />
                      <span className="font-medium">{option.summary.yes}</span>
                    </span>
                    <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                      <AlertCircle className="w-4 h-4" />
                      <span className="font-medium">{option.summary.maybe}</span>
                    </span>
                    <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
                      <X className="w-4 h-4" />
                      <span className="font-medium">{option.summary.no}</span>
                    </span>
                  </div>

                  {/* Score badge */}
                  <div className={`
                    px-3 py-1 rounded-full text-sm font-medium
                    ${option.summary.score > 0 
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' 
                      : option.summary.score < 0
                        ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                        : 'bg-obsidian-100 dark:bg-obsidian-700 text-obsidian-600 dark:text-obsidian-300'
                    }
                  `}>
                    {option.summary.score > 0 ? '+' : ''}{option.summary.score} pont
                  </div>

                  {/* Select button */}
                  {canSelectWinner && !currentWinner && !isWinner && (
                    <Button
                      onClick={() => selectWinner(option.id)}
                      loading={loading}
                      size="sm"
                      variant="outline"
                      icon={<ChevronRight className="w-4 h-4" />}
                    >
                      Kiválasztás
                    </Button>
                  )}
                </div>
              </div>

              {/* Voter details (optional) */}
              {showVoterDetails && option.votes.length > 0 && (
                <div className="relative mt-4 pt-4 border-t border-obsidian-100 dark:border-obsidian-700">
                  <div className="flex items-center gap-1 text-xs text-obsidian-500 dark:text-obsidian-400 mb-2">
                    <Users className="w-3 h-3" />
                    <span>Szavazók:</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {option.votes.map((vote) => (
                      <span
                        key={vote.id}
                        className={`
                          px-2 py-0.5 text-xs rounded-full
                          ${vote.vote === 'yes' 
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                            : vote.vote === 'maybe'
                              ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
                              : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                          }
                        `}
                      >
                        {vote.vote === 'yes' ? '✓' : vote.vote === 'maybe' ? '?' : '✗'} {vote.member_id.slice(0, 8)}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="mt-6 pt-4 border-t border-obsidian-100 dark:border-obsidian-700">
        <div className="text-xs text-obsidian-500 dark:text-obsidian-400">
          <span className="font-medium">Pontszámítás:</span>
          <span className="ml-2">✓ Jó = +2 pont</span>
          <span className="mx-2">•</span>
          <span>⚠ Ha muszáj = +1 pont</span>
          <span className="mx-2">•</span>
          <span>✗ Nem = -1 pont</span>
        </div>
      </div>
    </Card>
  )
}
