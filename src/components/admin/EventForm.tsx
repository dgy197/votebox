import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'
import type { Event } from '../../types'
import { generateEventCode } from '../../services/supabaseService'

interface EventFormProps {
  event?: Event | null
  onSave: (data: Partial<Event>) => Promise<void>
  onCancel: () => void
}

export function EventForm({ event, onSave, onCancel }: EventFormProps) {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const [formData, setFormData] = useState({
    name: event?.name || '',
    description: event?.description || '',
    event_code: event?.event_code || generateEventCode(),
    starts_at: event?.starts_at ? new Date(event.starts_at).toISOString().slice(0, 16) : '',
    ends_at: event?.ends_at ? new Date(event.ends_at).toISOString().slice(0, 16) : '',
    quorum_type: event?.quorum_type || 'percentage' as const,
    quorum_value: event?.quorum_value ?? event?.quorum_percent ?? 50,
  })
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    try {
      await onSave({
        name: formData.name,
        description: formData.description || null,
        event_code: formData.event_code.toUpperCase(),
        starts_at: formData.starts_at ? new Date(formData.starts_at).toISOString() : null,
        ends_at: formData.ends_at ? new Date(formData.ends_at).toISOString() : null,
        quorum_type: formData.quorum_type,
        quorum_value: formData.quorum_value,
        quorum_percent: formData.quorum_type === 'percentage' ? formData.quorum_value : null,
      })
    } catch (err: unknown) {
      // Log detailed error for debugging
      console.error('[EventForm] Save error:', err)
      // Show user-friendly message
      const message = err instanceof Error ? err.message : 'Hiba történt'
      // Don't expose internal error details
      setError(message.includes('PGRST') || message.includes('SQL') ? 'Hiba történt a mentés során. Kérjük, próbáld újra.' : message)
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          {event ? 'Esemény szerkesztése' : t('events.create')}
        </h2>
        <button
          onClick={onCancel}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>
      
      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        {error && (
          <div className="p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded-lg text-sm">
            {error}
          </div>
        )}
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('events.name')} *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="pl. Közgyűlés 2026"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Esemény kód
          </label>
          <input
            type="text"
            value={formData.event_code}
            onChange={(e) => setFormData({ ...formData, event_code: e.target.value.toUpperCase() })}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
            placeholder="MMK2026"
          />
          <p className="mt-1 text-xs text-gray-500">Ezzel lépnek be a szavazók</p>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('events.description')}
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={3}
            placeholder="Leírás (opcionális)"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('events.startDate')}
            </label>
            <input
              type="datetime-local"
              value={formData.starts_at}
              onChange={(e) => setFormData({ ...formData, starts_at: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t('events.endDate')}
            </label>
            <input
              type="datetime-local"
              value={formData.ends_at}
              onChange={(e) => setFormData({ ...formData, ends_at: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('results.quorum')}
          </label>
          <div className="flex gap-3">
            <select
              value={formData.quorum_type}
              onChange={(e) => setFormData({
                ...formData,
                quorum_type: e.target.value as 'none' | 'percentage' | 'fixed',
                quorum_value: e.target.value === 'none' ? 0 : formData.quorum_value
              })}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="none">{t('quorum.none')}</option>
              <option value="percentage">{t('quorum.percentage')}</option>
              <option value="fixed">{t('quorum.fixed')}</option>
            </select>
            {formData.quorum_type !== 'none' && (
              <input
                type="number"
                value={formData.quorum_value}
                onChange={(e) => {
                  const parsed = parseInt(e.target.value)
                  const maxVal = formData.quorum_type === 'percentage' ? 100 : 10000
                  setFormData({ ...formData, quorum_value: isNaN(parsed) ? 0 : Math.max(0, Math.min(parsed, maxVal)) })
                }}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min={0}
                max={formData.quorum_type === 'percentage' ? 100 : 10000}
                placeholder={formData.quorum_type === 'percentage' ? '50' : '10'}
              />
            )}
          </div>
          <p className="mt-1 text-xs text-gray-500">
            {formData.quorum_type === 'none' && t('quorum.noneDesc')}
            {formData.quorum_type === 'percentage' && t('quorum.percentageDesc')}
            {formData.quorum_type === 'fixed' && t('quorum.fixedDesc')}
          </p>
        </div>
        
        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            {t('common.cancel')}
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors"
          >
            {loading ? t('common.loading') : t('common.save')}
          </button>
        </div>
      </form>
    </div>
  )
}
