import { useState } from 'react'
import { Download, FileSpreadsheet, FileText, Loader2 } from 'lucide-react'
import type { Event, Participant, Question } from '../../types'
import * as api from '../../services/supabaseService'
import {
  exportParticipantsToCSV,
  exportResultsToCSV,
  generateMinutesPDF,
  downloadCSV,
  downloadPDF,
  calculateQuestionResult,
} from '../../services/exportService'

interface ExportButtonsProps {
  event: Event
  participants: Participant[]
  questions: Question[]
}

export function ExportButtons({ event, participants, questions }: ExportButtonsProps) {
  const [loading, setLoading] = useState<string | null>(null)

  const closedQuestions = questions.filter(q => q.state === 'closed')

  const handleExportParticipantsCSV = () => {
    setLoading('participants-csv')
    try {
      const csv = exportParticipantsToCSV(event, participants)
      const filename = `${event.event_code}_resztvevok_${formatDate()}.csv`
      downloadCSV(csv, filename)
    } finally {
      setLoading(null)
    }
  }

  const handleExportResultsCSV = async () => {
    if (closedQuestions.length === 0) {
      alert('Nincs lezárt szavazás az exportáláshoz.')
      return
    }

    setLoading('results-csv')
    try {
      // Fetch ballots for all closed questions
      const results = await Promise.all(
        closedQuestions.map(async (q) => {
          const ballots = await api.getBallots(q.id)
          return calculateQuestionResult(q, ballots)
        })
      )

      const csv = exportResultsToCSV(event, results)
      const filename = `${event.event_code}_eredmenyek_${formatDate()}.csv`
      downloadCSV(csv, filename)
    } catch (err) {
      console.error('Export failed:', err)
      alert('Hiba történt az exportálás során.')
    } finally {
      setLoading(null)
    }
  }

  const handleExportPDF = async () => {
    setLoading('pdf')
    try {
      // Fetch ballots for all closed questions
      const results = await Promise.all(
        closedQuestions.map(async (q) => {
          const ballots = await api.getBallots(q.id)
          return calculateQuestionResult(q, ballots)
        })
      )

      const doc = generateMinutesPDF(event, participants, results)
      const filename = `${event.event_code}_jegyzokonyv_${formatDate()}.pdf`
      downloadPDF(doc, filename)
    } catch (err) {
      console.error('PDF export failed:', err)
      alert('Hiba történt a PDF generálás során.')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
      <div className="flex items-center gap-2 mb-4">
        <Download className="w-5 h-5 text-gray-500" />
        <h3 className="font-semibold text-gray-900 dark:text-white">
          Exportálás
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Participants CSV */}
        <button
          onClick={handleExportParticipantsCSV}
          disabled={loading !== null || participants.length === 0}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading === 'participants-csv' ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <FileSpreadsheet className="w-5 h-5" />
          )}
          <div className="text-left">
            <p className="font-medium">Résztvevők</p>
            <p className="text-xs opacity-75">CSV</p>
          </div>
        </button>

        {/* Results CSV */}
        <button
          onClick={handleExportResultsCSV}
          disabled={loading !== null || closedQuestions.length === 0}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading === 'results-csv' ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <FileSpreadsheet className="w-5 h-5" />
          )}
          <div className="text-left">
            <p className="font-medium">Eredmények</p>
            <p className="text-xs opacity-75">CSV</p>
          </div>
        </button>

        {/* PDF Minutes */}
        <button
          onClick={handleExportPDF}
          disabled={loading !== null}
          className="flex items-center justify-center gap-2 px-4 py-3 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading === 'pdf' ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <FileText className="w-5 h-5" />
          )}
          <div className="text-left">
            <p className="font-medium">Jegyzőkönyv</p>
            <p className="text-xs opacity-75">PDF</p>
          </div>
        </button>
      </div>

      {/* Stats hint */}
      <p className="mt-3 text-xs text-gray-500 dark:text-gray-400 text-center">
        {participants.length} résztvevő • {closedQuestions.length} lezárt szavazás
      </p>
    </div>
  )
}

// Helper function
function formatDate(): string {
  const now = new Date()
  return `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}`
}
