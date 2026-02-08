import { useMemo, useState } from 'react'
import { format } from 'date-fns'
import { hu } from 'date-fns/locale'
import { 
  Trophy, Clock, Check, AlertCircle, X, 
  Users, ChevronRight, Crown, CalendarCheck,
  PartyPopper, Loader2
} from 'lucide-react'
import { Button } from '../../ui/Button'
import { Card, CardHeader } from '../../ui/Card'
import { Modal } from '../../ui/Modal'
import { useScheduleStore, type ScheduleOptionWithVotes } from '../../../stores/scheduleStore'

interface ScheduleResultsProps {
  canSelectWinner?: boolean
  showVoterDetails?: boolean
  onScheduled?: (scheduledAt: string) => void
}

export function ScheduleResults({ 
  canSelectWinner = false,
  showVoterDetails = false,
  onScheduled
}: ScheduleResultsProps) {
  const { options, selectWinner, calculateWinner } = useScheduleStore()
  const [confirmModal, setConfirmModal] = useState<ScheduleOptionWithVotes | null>(null)
  const [finalizing, setFinalizing] = useState(false)

  const suggestedWinner = useMemo(() => calculateWinner(), [options, calculateWinner])
  const currentWinner = options.find(o => o.is_winner)

  const sortedOptions = useMemo(() => {
    return [...options].sort((a, b) => {
      if (a.is_winner) return -1
      if (b.is_winner) return 1
      return b.summary.score - a.summary.score
    })
  }, [options])

  const handleSelectWinner = async (option: ScheduleOptionWithVotes) => {
    setFinalizing(true)
    try {
      const success = await selectWinner(option.id)
      if (success && onScheduled) {
        onScheduled(option.datetime)
      }
      setConfirmModal(null)
    } finally {
      setFinalizing(false)
    }
  }

  const getScorePercentage = (option: ScheduleOptionWithVotes) => {
    const maxScore = options.reduce((max, o) => Math.max(max, o.summary.score), 0)
    if (maxScore <= 0) return 0
    return Math.max(0, (option.summary.score / maxScore) * 100)
  }

  const getParticipationRate = () => {
    const uniqueVoters = new Set(options.flatMap(o => o.votes.map(v => v.member_id)))
    return uniqueVoters.size
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

  // Already finalized view
  if (currentWinner) {
    return (
      <Card padding="lg">
        <div className="text-center py-8">
          <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center">
            <CalendarCheck className="w-10 h-10 text-white" />
          </div>
          <h3 className="text-xl font-bold text-obsidian-900 dark:text-ivory-100 mb-2">
            Gyűlés időpontja véglegesítve!
          </h3>
          <div className="text-lg text-obsidian-700 dark:text-obsidian-200 mb-1">
            {format(new Date(currentWinner.datetime), 'yyyy. MMMM d. (EEEE)', { locale: hu })}
          </div>
          <div className="flex items-center justify-center gap-2 text-obsidian-500 dark:text-obsidian-400">
            <Clock className="w-4 h-4" />
            <span>{format(new Date(currentWinner.datetime), 'HH:mm', { locale: hu })}</span>
            <span>•</span>
            <span>{currentWinner.duration_minutes} perc</span>
          </div>
          
          {/* Vote summary for the winner */}
          <div className="mt-6 inline-flex items-center gap-4 px-4 py-2 bg-green-50 dark:bg-green-900/20 rounded-full text-sm">
            <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
              <Check className="w-4 h-4" />
              {currentWinner.summary.yes} igen
            </span>
            <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
              <AlertCircle className="w-4 h-4" />
              {currentWinner.summary.maybe} talán
            </span>
            <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
              <X className="w-4 h-4" />
              {currentWinner.summary.no} nem
            </span>
          </div>

          {/* Other options collapsed */}
          {options.length > 1 && (
            <details className="mt-8 text-left">
              <summary className="cursor-pointer text-sm text-obsidian-500 dark:text-obsidian-400 hover:text-obsidian-700 dark:hover:text-obsidian-200">
                További {options.length - 1} opció megtekintése
              </summary>
              <div className="mt-4 space-y-2">
                {sortedOptions.filter(o => !o.is_winner).map(option => (
                  <div
                    key={option.id}
                    className="flex items-center justify-between p-3 bg-obsidian-50 dark:bg-obsidian-800/50 rounded-lg"
                  >
                    <div>
                      <span className="font-medium text-obsidian-700 dark:text-obsidian-200">
                        {format(new Date(option.datetime), 'MM. dd. HH:mm', { locale: hu })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-obsidian-500">
                      <span className="text-green-500">{option.summary.yes}</span>
                      <span>/</span>
                      <span className="text-amber-500">{option.summary.maybe}</span>
                      <span>/</span>
                      <span className="text-red-500">{option.summary.no}</span>
                    </div>
                  </div>
                ))}
              </div>
            </details>
          )}
        </div>
      </Card>
    )
  }

  return (
    <Card padding="lg">
      <CardHeader 
        title="Eredmények"
        subtitle={`${options.length} opció, ${getParticipationRate()} résztvevő szavazott`}
        icon={<Trophy className="w-5 h-5 text-gold-500" />}
      />

      {/* Winner suggestion */}
      {suggestedWinner && canSelectWinner && (
        <div className="mb-6 p-4 bg-gradient-to-r from-gold-50 to-gold-100 dark:from-gold-900/20 dark:to-gold-800/20 border border-gold-200 dark:border-gold-700 rounded-xl">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-12 h-12 bg-gold-500 rounded-full flex items-center justify-center flex-shrink-0">
              <Crown className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-gold-800 dark:text-gold-300 mb-1">
                Javasolt időpont
              </div>
              <div className="text-lg font-bold text-obsidian-900 dark:text-ivory-100">
                {format(new Date(suggestedWinner.datetime), 'yyyy. MMMM d. (EEEE)', { locale: hu })}
              </div>
              <div className="flex items-center gap-2 text-sm text-obsidian-600 dark:text-obsidian-400">
                <Clock className="w-4 h-4" />
                <span>{format(new Date(suggestedWinner.datetime), 'HH:mm', { locale: hu })}</span>
                <span>•</span>
                <span>{suggestedWinner.duration_minutes} perc</span>
                <span>•</span>
                <span className="text-green-600 dark:text-green-400 font-medium">
                  +{suggestedWinner.summary.score} pont
                </span>
              </div>
            </div>
            <Button
              onClick={() => setConfirmModal(suggestedWinner)}
              size="sm"
              variant="gold"
              icon={<Check className="w-4 h-4" />}
            >
              Véglegesítés
            </Button>
          </div>
        </div>
      )}

      {/* Results list */}
      <div className="space-y-3">
        {sortedOptions.map((option, index) => {
          const isSuggested = suggestedWinner?.id === option.id
          const percentage = getScorePercentage(option)

          return (
            <div
              key={option.id}
              className={`
                relative overflow-hidden rounded-xl border transition-all
                ${isSuggested
                  ? 'bg-gold-50/50 dark:bg-gold-900/10 border-gold-300 dark:border-gold-700'
                  : 'bg-white dark:bg-obsidian-800/50 border-obsidian-200 dark:border-obsidian-700'
                }
              `}
            >
              {/* Progress bar background */}
              <div 
                className={`
                  absolute inset-y-0 left-0 transition-all
                  ${isSuggested 
                    ? 'bg-gold-100/50 dark:bg-gold-900/20' 
                    : 'bg-obsidian-100/50 dark:bg-obsidian-700/30'
                  }
                `}
                style={{ width: `${percentage}%` }}
              />

              <div className="relative p-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  {/* Rank badge */}
                  <div className={`
                    flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg
                    ${isSuggested
                      ? 'bg-gold-500 text-white'
                      : index < 3
                        ? 'bg-obsidian-200 dark:bg-obsidian-600 text-obsidian-700 dark:text-obsidian-200'
                        : 'bg-obsidian-100 dark:bg-obsidian-700 text-obsidian-500 dark:text-obsidian-400'
                    }
                  `}>
                    {index + 1}
                  </div>

                  {/* Date/Time info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-obsidian-900 dark:text-ivory-100">
                        {format(new Date(option.datetime), 'yyyy. MM. dd. (EEE)', { locale: hu })}
                      </span>
                      {isSuggested && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-gold-100 dark:bg-gold-800 text-gold-700 dark:text-gold-300 rounded-full">
                          ⭐ Legjobb
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-sm text-obsidian-500 dark:text-obsidian-400">
                      <Clock className="w-3 h-3" />
                      <span>{format(new Date(option.datetime), 'HH:mm', { locale: hu })}</span>
                      <span className="mx-1">•</span>
                      <span>{option.duration_minutes} perc</span>
                    </div>
                  </div>

                  {/* Vote summary */}
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3 text-sm">
                      <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                        <Check className="w-4 h-4" />
                        <span className="font-bold">{option.summary.yes}</span>
                      </span>
                      <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                        <AlertCircle className="w-4 h-4" />
                        <span className="font-bold">{option.summary.maybe}</span>
                      </span>
                      <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
                        <X className="w-4 h-4" />
                        <span className="font-bold">{option.summary.no}</span>
                      </span>
                    </div>

                    {/* Score badge */}
                    <div className={`
                      px-3 py-1 rounded-full text-sm font-bold min-w-[70px] text-center
                      ${option.summary.score > 0 
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' 
                        : option.summary.score < 0
                          ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                          : 'bg-obsidian-100 dark:bg-obsidian-700 text-obsidian-600 dark:text-obsidian-300'
                      }
                    `}>
                      {option.summary.score > 0 ? '+' : ''}{option.summary.score}
                    </div>

                    {/* Select button */}
                    {canSelectWinner && (
                      <Button
                        onClick={() => setConfirmModal(option)}
                        size="sm"
                        variant={isSuggested ? 'gold' : 'outline'}
                        icon={<ChevronRight className="w-4 h-4" />}
                      >
                        Kiválaszt
                      </Button>
                    )}
                  </div>
                </div>

                {/* Voter details */}
                {showVoterDetails && option.votes.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-obsidian-100 dark:border-obsidian-700">
                    <div className="flex items-center gap-1 text-xs text-obsidian-500 dark:text-obsidian-400 mb-2">
                      <Users className="w-3 h-3" />
                      <span>Szavazók:</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
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
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="mt-6 pt-4 border-t border-obsidian-100 dark:border-obsidian-700">
        <div className="text-xs text-obsidian-500 dark:text-obsidian-400">
          <span className="font-medium">Pontszámítás:</span>
          <span className="ml-2">✓ Megfelel = +2 pont</span>
          <span className="mx-2">•</span>
          <span>⚠ Ha muszáj = +1 pont</span>
          <span className="mx-2">•</span>
          <span>✗ Nem jó = −1 pont</span>
        </div>
      </div>

      {/* Confirmation Modal */}
      <Modal
        isOpen={!!confirmModal}
        onClose={() => setConfirmModal(null)}
        title="Időpont véglegesítése"
      >
        {confirmModal && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gold-100 dark:bg-gold-900/30 rounded-full flex items-center justify-center">
                <PartyPopper className="w-8 h-8 text-gold-600 dark:text-gold-400" />
              </div>
              <p className="text-obsidian-600 dark:text-obsidian-300 mb-4">
                Biztosan véglegesíti az alábbi időpontot?
              </p>
              <div className="p-4 bg-obsidian-50 dark:bg-obsidian-800 rounded-xl">
                <div className="text-xl font-bold text-obsidian-900 dark:text-ivory-100">
                  {format(new Date(confirmModal.datetime), 'yyyy. MMMM d.', { locale: hu })}
                </div>
                <div className="text-lg text-obsidian-700 dark:text-obsidian-200">
                  {format(new Date(confirmModal.datetime), 'EEEE', { locale: hu })}
                </div>
                <div className="flex items-center justify-center gap-2 mt-2 text-obsidian-500 dark:text-obsidian-400">
                  <Clock className="w-4 h-4" />
                  <span>{format(new Date(confirmModal.datetime), 'HH:mm', { locale: hu })}</span>
                  <span>•</span>
                  <span>{confirmModal.duration_minutes} perc</span>
                </div>
              </div>
              <p className="mt-4 text-sm text-obsidian-500 dark:text-obsidian-400">
                A gyűlés státusza "Ütemezett"-re változik és a résztvevők értesítést kapnak.
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setConfirmModal(null)}
                className="flex-1"
              >
                Mégsem
              </Button>
              <Button
                variant="gold"
                onClick={() => handleSelectWinner(confirmModal)}
                loading={finalizing}
                icon={finalizing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                className="flex-1"
              >
                Véglegesítés
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </Card>
  )
}
