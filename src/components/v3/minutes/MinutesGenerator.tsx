/**
 * MinutesGenerator Component
 * Jegyzőkönyv generálás, szerkesztés és exportálás
 */

import { useState, useCallback } from 'react'
import { 
  FileText, Download, Edit3, Eye, Save, 
  AlertCircle, CheckCircle, Copy, RefreshCw
} from 'lucide-react'
import { Button, Card, CardHeader } from '../../ui'
import { generateMinutes, type MinutesOutput } from '../../../lib/minutes-generator'
import { MinutesPdfExport } from './MinutesPdfExport'

interface MinutesGeneratorProps {
  meetingId: string
  meetingTitle?: string
  onSave?: (markdown: string) => Promise<void>
  initialContent?: string
}

type ViewMode = 'preview' | 'edit'

export function MinutesGenerator({
  meetingId,
  meetingTitle,
  onSave,
  initialContent,
}: MinutesGeneratorProps) {
  const [content, setContent] = useState<string>(initialContent || '')
  const [output, setOutput] = useState<MinutesOutput | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('preview')
  const [copied, setCopied] = useState(false)

  const handleGenerate = useCallback(async () => {
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const result = await generateMinutes({ meetingId })
      setOutput(result)
      setContent(result.markdown)
      setSuccess('Jegyzőkönyv sikeresen generálva!')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ismeretlen hiba történt')
    } finally {
      setLoading(false)
    }
  }, [meetingId])

  const handleSave = useCallback(async () => {
    if (!onSave || !content) return

    setSaving(true)
    setError(null)

    try {
      await onSave(content)
      setSuccess('Jegyzőkönyv mentve!')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Mentés sikertelen')
    } finally {
      setSaving(false)
    }
  }, [content, onSave])

  const handleCopy = useCallback(async () => {
    if (!content) return

    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setError('Másolás sikertelen')
    }
  }, [content])

  const handleDownload = useCallback(() => {
    if (!content) return

    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `jegyzokonyv-${meetingId.slice(0, 8)}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [content, meetingId])

  // Simple markdown to HTML conversion for preview
  const renderPreview = (md: string) => {
    return md
      .replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold mb-4 mt-6">$1</h1>')
      .replace(/^## (.*$)/gm, '<h2 class="text-xl font-semibold mb-3 mt-5">$1</h2>')
      .replace(/^### (.*$)/gm, '<h3 class="text-lg font-medium mb-2 mt-4">$1</h3>')
      .replace(/^\*\*(.*?)\*\*/gm, '<strong>$1</strong>')
      .replace(/^\*(.*?)\*/gm, '<em>$1</em>')
      .replace(/^- (.*$)/gm, '<li class="ml-4">$1</li>')
      .replace(/^> (.*$)/gm, '<blockquote class="border-l-4 border-gold-400 pl-4 italic my-2">$1</blockquote>')
      .replace(/^---$/gm, '<hr class="my-6 border-obsidian-200 dark:border-obsidian-700" />')
      .replace(/\n\n/g, '</p><p class="mb-2">')
      .replace(/```([\s\S]*?)```/g, '<pre class="bg-obsidian-100 dark:bg-obsidian-800 p-4 rounded-lg my-4 font-mono text-sm overflow-x-auto">$1</pre>')
      .replace(/\|(.*)\|/g, (match) => {
        const cells = match.split('|').filter(Boolean)
        return `<tr class="border-b border-obsidian-200 dark:border-obsidian-700">${cells.map(c => `<td class="px-3 py-2">${c.trim()}</td>`).join('')}</tr>`
      })
  }

  return (
    <Card padding="lg">
      <CardHeader
        title="Jegyzőkönyv"
        subtitle={meetingTitle || 'Közgyűlési jegyzőkönyv generálása és szerkesztése'}
        icon={<FileText className="w-5 h-5 text-gold-500" />}
        action={
          <div className="flex gap-2">
            {content && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode(viewMode === 'preview' ? 'edit' : 'preview')}
                  icon={viewMode === 'preview' ? <Edit3 className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                >
                  {viewMode === 'preview' ? 'Szerkesztés' : 'Előnézet'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopy}
                  icon={copied ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                >
                  {copied ? 'Másolva!' : 'Másolás'}
                </Button>
              </>
            )}
          </div>
        }
      />

      {/* Status messages */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <span className="text-red-700 dark:text-red-300">{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
          <span className="text-green-700 dark:text-green-300">{success}</span>
        </div>
      )}

      {/* Main content area */}
      {!content ? (
        <div className="text-center py-12">
          <FileText className="w-16 h-16 mx-auto text-obsidian-300 dark:text-obsidian-600 mb-4" />
          <h3 className="text-lg font-medium text-obsidian-700 dark:text-obsidian-300 mb-2">
            Jegyzőkönyv generálása
          </h3>
          <p className="text-obsidian-500 dark:text-obsidian-400 mb-6 max-w-md mx-auto">
            A gyűlés adatai alapján automatikusan generálható a közgyűlési jegyzőkönyv
            magyar jogi formátumban.
          </p>
          <Button
            onClick={handleGenerate}
            loading={loading}
            icon={<FileText className="w-5 h-5" />}
            size="lg"
            variant="gold"
          >
            Jegyzőkönyv generálása
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Metadata */}
          {output?.metadata && (
            <div className="flex flex-wrap gap-4 text-xs text-obsidian-500 dark:text-obsidian-400 pb-4 border-b border-obsidian-100 dark:border-obsidian-800">
              <span>
                <strong>Szervezet:</strong> {output.metadata.organizationName}
              </span>
              <span>
                <strong>Generálva:</strong>{' '}
                {new Date(output.metadata.generatedAt).toLocaleString('hu-HU')}
              </span>
              <span>
                <strong>Verzió:</strong> {output.metadata.templateVersion}
              </span>
            </div>
          )}

          {/* Content */}
          {viewMode === 'edit' ? (
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full h-[600px] p-4 font-mono text-sm bg-obsidian-50 dark:bg-obsidian-800/50 border border-obsidian-200 dark:border-obsidian-700 rounded-xl resize-none focus:ring-2 focus:ring-gold-400 focus:border-transparent"
              placeholder="Jegyzőkönyv tartalma..."
            />
          ) : (
            <div
              className="prose prose-obsidian dark:prose-invert max-w-none p-6 bg-white dark:bg-obsidian-900 rounded-xl border border-obsidian-100 dark:border-obsidian-800 min-h-[400px] max-h-[600px] overflow-y-auto"
              dangerouslySetInnerHTML={{ __html: renderPreview(content) }}
            />
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-obsidian-100 dark:border-obsidian-800">
            <Button
              onClick={handleGenerate}
              variant="outline"
              icon={<RefreshCw className="w-4 h-4" />}
              loading={loading}
            >
              Újragenerálás
            </Button>

            <div className="flex-1" />

            <Button
              onClick={handleDownload}
              variant="secondary"
              icon={<Download className="w-4 h-4" />}
            >
              Markdown letöltés
            </Button>

            {/* PDF Export */}
            <MinutesPdfExport
              markdown={content}
              meetingId={meetingId}
              meetingTitle={meetingTitle || output?.metadata?.meetingTitle}
              showPreview={true}
              variant="gold"
            />

            {onSave && (
              <Button
                onClick={handleSave}
                variant="outline"
                icon={<Save className="w-4 h-4" />}
                loading={saving}
              >
                Mentés
              </Button>
            )}
          </div>
        </div>
      )}
    </Card>
  )
}

export default MinutesGenerator
