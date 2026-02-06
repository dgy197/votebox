import { useEffect, useState } from 'react'
import { Vote, ThumbsUp, ThumbsDown, MinusCircle, Lock, CheckCircle } from 'lucide-react'
import { useVoteStore } from '../../../stores/voteStore'
import { Button, Card, Spinner } from '../../ui'
import type { AgendaItem, Member, VoteValue } from '../../../types/v3'

interface VotingPanelProps {
  agendaItem: AgendaItem
  member: Member
}

export function VotingPanel({ agendaItem, member }: VotingPanelProps) {
  const { 
    submitVote, 
    checkIfVoted, 
    hasVoted, 
    loading, 
    error,
    setCurrentAgendaItem,
    subscribeToVotes,
    unsubscribeFromVotes
  } = useVoteStore()

  const [selectedVote, setSelectedVote] = useState<VoteValue | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    // Set the current agenda item for result calculation
    setCurrentAgendaItem(agendaItem)
    
    // Subscribe to realtime votes
    subscribeToVotes(agendaItem.id)
    
    // Check if already voted
    checkIfVoted(agendaItem.id, member.id)

    return () => {
      unsubscribeFromVotes()
    }
  }, [agendaItem.id, member.id])

  useEffect(() => {
    if (hasVoted) {
      setSubmitted(true)
    }
  }, [hasVoted])

  const handleVote = async () => {
    if (!selectedVote) return
    
    setSubmitting(true)
    const success = await submitVote({
      agenda_item_id: agendaItem.id,
      member_id: member.id,
      vote: selectedVote,
      weight: member.weight,
    })
    setSubmitting(false)

    if (success) {
      setSubmitted(true)
    }
  }

  const voteOptions: { value: VoteValue; label: string; icon: typeof ThumbsUp; color: string }[] = 
    agendaItem.vote_type === 'yes_no' 
      ? [
          { value: 'yes', label: 'Igen', icon: ThumbsUp, color: 'text-green-600 bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' },
          { value: 'no', label: 'Nem', icon: ThumbsDown, color: 'text-red-600 bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800' },
        ]
      : [
          { value: 'yes', label: 'Igen', icon: ThumbsUp, color: 'text-green-600 bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' },
          { value: 'no', label: 'Nem', icon: ThumbsDown, color: 'text-red-600 bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800' },
          { value: 'abstain', label: 'Tartózkodom', icon: MinusCircle, color: 'text-gray-600 bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700' },
        ]

  // Already voted
  if (submitted || hasVoted) {
    return (
      <Card className="p-8 text-center">
        <div className="w-16 h-16 mx-auto rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
          <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Szavazatod rögzítve!
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          Köszönjük a részvételt. Az eredmények a szavazás lezárása után jelennek meg.
        </p>
      </Card>
    )
  }

  // Voting not active
  if (agendaItem.status !== 'voting') {
    return (
      <Card className="p-8 text-center">
        <Vote className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Szavazás nem aktív
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          Kérlek várd meg, amíg a levezető elnök megnyitja a szavazást.
        </p>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm font-medium mb-3">
          <Vote className="w-4 h-4" />
          Szavazás aktív
          {agendaItem.is_secret && (
            <span className="flex items-center gap-1 ml-2 pl-2 border-l border-blue-300 dark:border-blue-700">
              <Lock className="w-3 h-3" />
              Titkos
            </span>
          )}
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {agendaItem.title}
        </h2>
        {agendaItem.description && (
          <p className="text-gray-600 dark:text-gray-300">
            {agendaItem.description}
          </p>
        )}
      </div>

      {/* Voting options */}
      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        {voteOptions.map((option) => {
          const Icon = option.icon
          const isSelected = selectedVote === option.value
          
          return (
            <button
              key={option.value}
              onClick={() => setSelectedVote(option.value)}
              className={`p-6 rounded-xl border-2 transition-all ${
                isSelected
                  ? `${option.color} border-current ring-2 ring-offset-2 ring-current`
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <Icon className={`w-12 h-12 mx-auto mb-3 ${isSelected ? '' : 'text-gray-400'}`} />
              <div className={`text-lg font-semibold ${isSelected ? '' : 'text-gray-900 dark:text-white'}`}>
                {option.label}
              </div>
            </button>
          )
        })}
      </div>

      {/* Member info */}
      <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 mb-6">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500 dark:text-gray-400">Szavazó:</span>
          <span className="font-medium text-gray-900 dark:text-white">{member.name}</span>
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

      {/* Error */}
      {error && (
        <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 mb-4">
          {error}
        </div>
      )}

      {/* Submit */}
      <Button
        onClick={handleVote}
        disabled={!selectedVote || submitting || loading}
        className="w-full"
        size="lg"
      >
        {submitting ? (
          <>
            <Spinner size="sm" className="mr-2" />
            Szavazat küldése...
          </>
        ) : (
          <>
            <CheckCircle className="w-5 h-5 mr-2" />
            Szavazok
          </>
        )}
      </Button>

      <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-4">
        A szavazat leadása után nem módosítható.
      </p>
    </Card>
  )
}
