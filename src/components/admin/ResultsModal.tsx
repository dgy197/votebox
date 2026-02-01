import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { X, Check, X as XIcon, MinusCircle, Download } from 'lucide-react'
import type { Question } from '../../types'
import { getBallots } from '../../services/supabaseService'

interface ResultsModalProps {
  question: Question
  totalParticipants: number
  onClose: () => void
}

interface Results {
  yes: number
  no: number
  abstain: number
  total: number
  yesPercent: number
  noPercent: number
  abstainPercent: number
  isAccepted: boolean
  participation: number
}

export function ResultsModal({ question, totalParticipants, onClose }: ResultsModalProps) {
  const { t } = useTranslation()
  const [results, setResults] = useState<Results | null>(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    loadResults()
  }, [question.id])
  
  const loadResults = async () => {
    try {
      const ballots = await getBallots(question.id)
      
      let yes = 0, no = 0, abstain = 0
      
      ballots.forEach(ballot => {
        const choice = ballot.choices[0]
        if (choice === 'yes') yes++
        else if (choice === 'no') no++
        else if (choice === 'abstain') abstain++
      })
      
      const total = yes + no + abstain
      const validVotes = question.abstain_counts ? total : (yes + no)
      
      // Calculate percentages
      const yesPercent = validVotes > 0 ? (yes / validVotes) * 100 : 0
      const noPercent = validVotes > 0 ? (no / validVotes) * 100 : 0
      const abstainPercent = total > 0 ? (abstain / total) * 100 : 0
      
      // Determine if accepted based on threshold
      let isAccepted = false
      if (question.threshold_type === 'simple_majority') {
        isAccepted = yesPercent > 50
      } else if (question.threshold_type === 'two_thirds') {
        isAccepted = yesPercent >= 66.67
      } else if (question.threshold_type === 'absolute') {
        isAccepted = yes > totalParticipants / 2
      }
      
      setResults({
        yes,
        no,
        abstain,
        total,
        yesPercent,
        noPercent,
        abstainPercent,
        isAccepted,
        participation: totalParticipants > 0 ? (total / totalParticipants) * 100 : 0,
      })
    } catch (err) {
      console.error('Failed to load results:', err)
    } finally {
      setLoading(false)
    }
  }
  
  const exportResults = () => {
    if (!results) return
    
    const data = {
      question: question.text_hu,
      timestamp: question.closed_at,
      results: {
        igen: results.yes,
        nem: results.no,
        tartózkodás: results.abstain,
        összesen: results.total,
      },
      elfogadva: results.isAccepted,
      részvétel: `${results.participation.toFixed(1)}%`,
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `szavazas-eredmeny-${question.id.slice(0, 8)}.json`
    a.click()
  }
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-lg w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {t('results.title')}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6">
          {/* Question */}
          <p className="text-lg font-medium text-gray-900 dark:text-white mb-6">
            {question.text_hu}
          </p>
          
          {loading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : results ? (
            <>
              {/* Result badge */}
              <div className={`p-4 rounded-lg mb-6 text-center ${
                results.isAccepted 
                  ? 'bg-green-100 dark:bg-green-900/30' 
                  : 'bg-red-100 dark:bg-red-900/30'
              }`}>
                <div className={`text-2xl font-bold ${
                  results.isAccepted 
                    ? 'text-green-700 dark:text-green-300' 
                    : 'text-red-700 dark:text-red-300'
                }`}>
                  {results.isAccepted ? (
                    <span className="flex items-center justify-center gap-2">
                      <Check className="w-8 h-8" />
                      {t('results.accepted')}
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <XIcon className="w-8 h-8" />
                      {t('results.rejected')}
                    </span>
                  )}
                </div>
              </div>
              
              {/* Vote bars */}
              <div className="space-y-4">
                {/* Yes */}
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="flex items-center gap-2 font-medium text-green-700 dark:text-green-300">
                      <Check className="w-4 h-4" />
                      {t('common.yes')}
                    </span>
                    <span className="text-gray-600 dark:text-gray-400">
                      {results.yes} ({results.yesPercent.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-500 rounded-full transition-all duration-500"
                      style={{ width: `${results.yesPercent}%` }}
                    />
                  </div>
                </div>
                
                {/* No */}
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="flex items-center gap-2 font-medium text-red-700 dark:text-red-300">
                      <XIcon className="w-4 h-4" />
                      {t('common.no')}
                    </span>
                    <span className="text-gray-600 dark:text-gray-400">
                      {results.no} ({results.noPercent.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-red-500 rounded-full transition-all duration-500"
                      style={{ width: `${results.noPercent}%` }}
                    />
                  </div>
                </div>
                
                {/* Abstain */}
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="flex items-center gap-2 font-medium text-gray-600 dark:text-gray-400">
                      <MinusCircle className="w-4 h-4" />
                      {t('common.abstain')}
                    </span>
                    <span className="text-gray-600 dark:text-gray-400">
                      {results.abstain} ({results.abstainPercent.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gray-400 rounded-full transition-all duration-500"
                      style={{ width: `${results.abstainPercent}%` }}
                    />
                  </div>
                </div>
              </div>
              
              {/* Stats */}
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {results.total}
                  </p>
                  <p className="text-sm text-gray-500">{t('results.votes')}</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {results.participation.toFixed(1)}%
                  </p>
                  <p className="text-sm text-gray-500">{t('results.participation')}</p>
                </div>
              </div>
            </>
          ) : (
            <p className="text-center text-gray-500">Nincs adat</p>
          )}
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-between">
          <button
            onClick={exportResults}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            Exportálás
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg transition-colors"
          >
            Bezárás
          </button>
        </div>
      </div>
    </div>
  )
}
