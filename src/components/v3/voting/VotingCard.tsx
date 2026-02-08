import { useState, useCallback } from 'react'
import { ThumbsUp, ThumbsDown, MinusCircle, CheckCircle, Loader2, Vote, Lock } from 'lucide-react'
import { Card, Button } from '../../ui'
import type { AgendaItem, Member, VoteValue } from '../../../types/v3'

interface VotingCardProps {
  agendaItem: AgendaItem
  member: Member
  hasVoted: boolean
  onVote: (vote: VoteValue) => Promise<boolean>
  isVoting?: boolean
  disabled?: boolean
}

interface VoteButtonProps {
  value: VoteValue
  label: string
  icon: typeof ThumbsUp
  color: {
    base: string
    selected: string
    hover: string
    ring: string
  }
  isSelected: boolean
  isSubmitting: boolean
  disabled: boolean
  onClick: (value: VoteValue) => void
}

function VoteButton({ 
  value, 
  label, 
  icon: Icon, 
  color, 
  isSelected, 
  isSubmitting,
  disabled,
  onClick 
}: VoteButtonProps) {
  const handleClick = () => {
    if (!disabled && !isSubmitting) {
      onClick(value)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={disabled || isSubmitting}
      aria-pressed={isSelected}
      aria-label={`Szavazat: ${label}`}
      className={`
        relative group
        w-full p-4 sm:p-6 
        rounded-xl border-2 
        transition-all duration-300 ease-out
        transform
        focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${color.ring}
        ${disabled 
          ? 'opacity-50 cursor-not-allowed' 
          : 'cursor-pointer hover:scale-[1.02] active:scale-[0.98]'
        }
        ${isSelected
          ? `${color.selected} border-current shadow-lg scale-[1.02]`
          : `${color.base} border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 ${color.hover}`
        }
      `}
    >
      {/* Pulse animation when selected */}
      {isSelected && (
        <span 
          className="absolute inset-0 rounded-xl animate-pulse opacity-30"
          style={{ backgroundColor: 'currentColor' }}
        />
      )}
      
      {/* Icon with bounce animation */}
      <div className={`
        relative z-10
        flex flex-col items-center justify-center
        transition-transform duration-300
        ${isSelected ? 'animate-bounce-subtle' : 'group-hover:scale-110'}
      `}>
        <Icon 
          className={`
            w-10 h-10 sm:w-12 sm:h-12 mb-2 sm:mb-3 
            transition-all duration-300
            ${isSelected ? '' : 'text-gray-400 dark:text-gray-500'}
          `} 
        />
        <span className={`
          text-base sm:text-lg font-semibold 
          transition-colors duration-300
          ${isSelected ? '' : 'text-gray-900 dark:text-white'}
        `}>
          {label}
        </span>
      </div>

      {/* Selected checkmark */}
      {isSelected && (
        <div className="absolute top-2 right-2 sm:top-3 sm:right-3">
          <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 animate-scale-in" />
        </div>
      )}
    </button>
  )
}

export function VotingCard({ 
  agendaItem, 
  member, 
  hasVoted, 
  onVote,
  isVoting = false,
  disabled = false 
}: VotingCardProps) {
  const [selectedVote, setSelectedVote] = useState<VoteValue | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const voteButtons = [
    { 
      value: 'yes' as VoteValue, 
      label: 'Igen', 
      icon: ThumbsUp,
      color: {
        base: 'bg-green-50 dark:bg-green-900/20',
        selected: 'bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400',
        hover: 'hover:bg-green-100/50 dark:hover:bg-green-900/30',
        ring: 'focus-visible:ring-green-500'
      }
    },
    { 
      value: 'no' as VoteValue, 
      label: 'Nem', 
      icon: ThumbsDown,
      color: {
        base: 'bg-red-50 dark:bg-red-900/20',
        selected: 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400',
        hover: 'hover:bg-red-100/50 dark:hover:bg-red-900/30',
        ring: 'focus-visible:ring-red-500'
      }
    },
  ]

  // Add abstain option if vote type supports it
  if (agendaItem.vote_type === 'yes_no_abstain') {
    voteButtons.push({
      value: 'abstain' as VoteValue,
      label: 'Tartózkodom',
      icon: MinusCircle,
      color: {
        base: 'bg-gray-50 dark:bg-gray-800',
        selected: 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300',
        hover: 'hover:bg-gray-100 dark:hover:bg-gray-700/50',
        ring: 'focus-visible:ring-gray-500'
      }
    })
  }

  const handleVoteSelect = useCallback((value: VoteValue) => {
    if (!hasVoted && !isSubmitting && !disabled) {
      setSelectedVote(value)
      setError(null)
    }
  }, [hasVoted, isSubmitting, disabled])

  const handleSubmit = useCallback(async () => {
    if (!selectedVote || isSubmitting || hasVoted) return

    setIsSubmitting(true)
    setError(null)

    try {
      const success = await onVote(selectedVote)
      if (success) {
        setSubmitSuccess(true)
      } else {
        setError('Hiba történt a szavazat rögzítésekor.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ismeretlen hiba történt.')
    } finally {
      setIsSubmitting(false)
    }
  }, [selectedVote, isSubmitting, hasVoted, onVote])

  // Success state - after voting
  if (submitSuccess || hasVoted) {
    return (
      <Card className="p-6 sm:p-8 text-center animate-fade-in">
        <div className="relative">
          {/* Success icon with animation */}
          <div className="w-20 h-20 mx-auto rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4 animate-scale-in">
            <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
          </div>
          
          {/* Confetti-like decoration */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-4 left-1/4 w-2 h-2 bg-green-400 rounded-full animate-float-up" style={{ animationDelay: '0ms' }} />
            <div className="absolute top-6 right-1/4 w-2 h-2 bg-blue-400 rounded-full animate-float-up" style={{ animationDelay: '200ms' }} />
            <div className="absolute top-8 left-1/3 w-2 h-2 bg-yellow-400 rounded-full animate-float-up" style={{ animationDelay: '400ms' }} />
          </div>
        </div>

        <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Szavazatod rögzítve!
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          Köszönjük a részvételt. Az eredmények a szavazás lezárása után jelennek meg.
        </p>

        {/* Voter info */}
        <div className="mt-6 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 inline-flex items-center gap-2 text-sm">
          <span className="text-gray-500 dark:text-gray-400">Szavazati súly:</span>
          <span className="font-mono font-semibold text-gray-900 dark:text-white">
            {member.weight.toFixed(2)}
          </span>
        </div>
      </Card>
    )
  }

  // Voting not active
  if (agendaItem.status !== 'voting' && !isVoting) {
    return (
      <Card className="p-6 sm:p-8 text-center">
        <Vote className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Szavazás nem aktív
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          Várja meg, amíg a levezető elnök megnyitja a szavazást.
        </p>
      </Card>
    )
  }

  return (
    <Card className="p-4 sm:p-6 animate-fade-in">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm font-medium mb-3 animate-pulse-subtle">
          <Vote className="w-4 h-4" />
          <span>Szavazás aktív</span>
          {agendaItem.is_secret && (
            <span className="flex items-center gap-1 ml-2 pl-2 border-l border-blue-300 dark:border-blue-700">
              <Lock className="w-3 h-3" />
              <span>Titkos</span>
            </span>
          )}
        </div>
        
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {agendaItem.title}
        </h2>
        
        {agendaItem.description && (
          <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base">
            {agendaItem.description}
          </p>
        )}
      </div>

      {/* Vote buttons */}
      <div className={`grid gap-3 sm:gap-4 mb-6 ${
        voteButtons.length === 3 ? 'grid-cols-3' : 'grid-cols-2'
      }`}>
        {voteButtons.map((button) => (
          <VoteButton
            key={button.value}
            {...button}
            isSelected={selectedVote === button.value}
            isSubmitting={isSubmitting}
            disabled={disabled || hasVoted}
            onClick={handleVoteSelect}
          />
        ))}
      </div>

      {/* Member info */}
      <div className="p-3 sm:p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 mb-4 sm:mb-6">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500 dark:text-gray-400">Szavazó:</span>
          <span className="font-medium text-gray-900 dark:text-white truncate ml-2">
            {member.name}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm mt-1">
          <span className="text-gray-500 dark:text-gray-400">Szavazati súly:</span>
          <span className="font-mono font-medium text-gray-900 dark:text-white">
            {member.weight.toFixed(2)}
            {member.weight_label && (
              <span className="text-gray-500 ml-1">({member.weight_label})</span>
            )}
          </span>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="p-3 sm:p-4 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 mb-4 text-sm animate-shake">
          {error}
        </div>
      )}

      {/* Submit button */}
      <Button
        onClick={handleSubmit}
        disabled={!selectedVote || isSubmitting || disabled}
        className="w-full"
        size="lg"
      >
        {isSubmitting ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Szavazat küldése...</span>
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            <CheckCircle className="w-5 h-5" />
            <span>Szavazok</span>
          </span>
        )}
      </Button>

      <p className="text-center text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-3 sm:mt-4">
        A szavazat leadása után nem módosítható.
      </p>
    </Card>
  )
}
