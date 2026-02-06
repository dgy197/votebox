import { useEffect } from 'react'
import { CheckCircle, XCircle, MinusCircle, BarChart2, Users, Scale } from 'lucide-react'
import { useVoteStore } from '../../../stores/voteStore'
import { Card, Spinner, Badge } from '../../ui'
import type { AgendaItem, VoteResult } from '../../../types/v3'

interface VoteResultsProps {
  agendaItem: AgendaItem
  showRealtime?: boolean
}

interface ResultBarProps {
  label: string
  value: number
  total: number
  color: string
  icon: typeof CheckCircle
}

function ResultBar({ label, value, total, color, icon: Icon }: ResultBarProps) {
  const percentage = total > 0 ? (value / total) * 100 : 0

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className={`w-5 h-5 ${color}`} />
          <span className="font-medium text-gray-900 dark:text-white">{label}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono font-bold text-lg text-gray-900 dark:text-white">
            {value.toFixed(2)}
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            ({percentage.toFixed(1)}%)
          </span>
        </div>
      </div>
      <div className="h-4 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-500 ${color.includes('green') ? 'bg-green-500' : color.includes('red') ? 'bg-red-500' : 'bg-gray-400'}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

export function VoteResults({ agendaItem, showRealtime = false }: VoteResultsProps) {
  const { 
    liveResult, 
    loading,
    subscribeToVotes,
    unsubscribeFromVotes,
    setCurrentAgendaItem,
    fetchVotes
  } = useVoteStore()

  useEffect(() => {
    setCurrentAgendaItem(agendaItem)
    
    if (showRealtime) {
      subscribeToVotes(agendaItem.id)
    } else {
      fetchVotes(agendaItem.id)
    }

    return () => {
      if (showRealtime) {
        unsubscribeFromVotes()
      }
    }
  }, [agendaItem.id, showRealtime])

  // Use saved result or live result
  const result: VoteResult | null = agendaItem.result || liveResult

  if (loading && !result) {
    return (
      <Card className="p-8 text-center">
        <Spinner size="lg" />
        <p className="text-gray-500 dark:text-gray-400 mt-4">Eredmények betöltése...</p>
      </Card>
    )
  }

  if (!result) {
    return (
      <Card className="p-8 text-center">
        <BarChart2 className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          Nincs eredmény
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          A szavazás még nem kezdődött el vagy nincsenek szavazatok.
        </p>
      </Card>
    )
  }

  const majorityLabels = {
    simple: 'Egyszerű többség',
    two_thirds: 'Kétharmados többség',
    unanimous: 'Egyhangú döntés',
  }

  return (
    <Card className="p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {agendaItem.title}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Szükséges: {majorityLabels[agendaItem.required_majority]}
          </p>
        </div>
        <Badge 
          variant={result.passed ? 'success' : 'danger'} 
          size="lg"
        >
          {result.passed ? '✓ Elfogadva' : '✗ Elutasítva'}
        </Badge>
      </div>

      {/* Result Bars */}
      <div className="space-y-4 mb-6">
        <ResultBar
          label="Igen"
          value={result.yes}
          total={result.total_weight}
          color="text-green-600"
          icon={CheckCircle}
        />
        <ResultBar
          label="Nem"
          value={result.no}
          total={result.total_weight}
          color="text-red-600"
          icon={XCircle}
        />
        {result.abstain > 0 && (
          <ResultBar
            label="Tartózkodott"
            value={result.abstain}
            total={result.total_weight}
            color="text-gray-500"
            icon={MinusCircle}
          />
        )}
      </div>

      {/* Summary */}
      <div className="grid sm:grid-cols-3 gap-4 pt-4 border-t dark:border-gray-700">
        <div className="text-center p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
          <Users className="w-6 h-6 mx-auto text-gray-400 mb-1" />
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {result.total_votes}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Szavazat
          </div>
        </div>
        <div className="text-center p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
          <Scale className="w-6 h-6 mx-auto text-gray-400 mb-1" />
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {result.total_weight.toFixed(2)}
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Összsúly
          </div>
        </div>
        <div className="text-center p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
          <BarChart2 className="w-6 h-6 mx-auto text-gray-400 mb-1" />
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {result.total_weight > 0 
              ? ((result.yes / result.total_weight) * 100).toFixed(1)
              : 0}%
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Igen arány
          </div>
        </div>
      </div>

      {/* Realtime indicator */}
      {showRealtime && (
        <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          Élő frissítés aktív
        </div>
      )}
    </Card>
  )
}
