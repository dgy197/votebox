/**
 * MinutesPdfExport Component
 * PDF letöltés és előnézet a jegyzőkönyvhöz
 */

import { useState, useCallback } from 'react'
import { Download, FileText, Loader2, Eye, X } from 'lucide-react'
import { Button } from '../../ui'
import { downloadPdf, getPdfDataUrl } from '../../../lib/pdf-generator'

interface MinutesPdfExportProps {
  /** Markdown content to export */
  markdown: string
  /** Meeting ID for filename */
  meetingId?: string
  /** Optional meeting title */
  meetingTitle?: string
  /** Show preview button */
  showPreview?: boolean
  /** Button variant */
  variant?: 'gold' | 'primary' | 'secondary' | 'outline' | 'ghost'
  /** Button size */
  size?: 'sm' | 'md' | 'lg'
  /** Full width button */
  fullWidth?: boolean
}

export function MinutesPdfExport({
  markdown,
  meetingId,
  meetingTitle,
  showPreview = true,
  variant = 'gold',
  size = 'md',
  fullWidth = false,
}: MinutesPdfExportProps) {
  const [generating, setGenerating] = useState(false)
  const [previewing, setPreviewing] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const getFilename = useCallback(() => {
    const date = new Date().toISOString().split('T')[0]
    const id = meetingId?.slice(0, 8) || 'export'
    return `jegyzokonyv-${id}-${date}.pdf`
  }, [meetingId])

  const handleDownload = useCallback(async () => {
    if (!markdown) {
      setError('Nincs tartalom az exportáláshoz')
      return
    }

    setGenerating(true)
    setError(null)

    try {
      // Small delay for UI feedback
      await new Promise((r) => setTimeout(r, 100))
      
      downloadPdf(markdown, {
        filename: getFilename(),
        title: meetingTitle || 'Közgyűlési jegyzőkönyv',
      })
    } catch (err) {
      console.error('PDF generation error:', err)
      setError(err instanceof Error ? err.message : 'PDF generálás sikertelen')
    } finally {
      setGenerating(false)
    }
  }, [markdown, getFilename, meetingTitle])

  const handlePreview = useCallback(async () => {
    if (!markdown) {
      setError('Nincs tartalom az előnézethez')
      return
    }

    setPreviewing(true)
    setError(null)

    try {
      await new Promise((r) => setTimeout(r, 100))
      
      const dataUrl = getPdfDataUrl(markdown, {
        title: meetingTitle || 'Közgyűlési jegyzőkönyv',
      })
      setPreviewUrl(dataUrl)
    } catch (err) {
      console.error('PDF preview error:', err)
      setError(err instanceof Error ? err.message : 'PDF előnézet sikertelen')
    } finally {
      setPreviewing(false)
    }
  }, [markdown, meetingTitle])

  const closePreview = useCallback(() => {
    setPreviewUrl(null)
  }, [])

  return (
    <>
      <div className={`flex gap-2 ${fullWidth ? 'w-full' : ''}`}>
        {/* Download button */}
        <Button
          onClick={handleDownload}
          disabled={!markdown || generating}
          variant={variant}
          size={size}
          icon={generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          className={fullWidth ? 'flex-1' : ''}
        >
          {generating ? 'Generálás...' : 'PDF letöltés'}
        </Button>

        {/* Preview button */}
        {showPreview && (
          <Button
            onClick={handlePreview}
            disabled={!markdown || previewing}
            variant="outline"
            size={size}
            icon={previewing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
          >
            Előnézet
          </Button>
        )}
      </div>

      {/* Error message */}
      {error && (
        <p className="text-sm text-red-500 mt-2">{error}</p>
      )}

      {/* Preview Modal */}
      {previewUrl && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={closePreview}
        >
          <div 
            className="relative bg-white dark:bg-obsidian-900 rounded-2xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-obsidian-100 dark:border-obsidian-800">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-gold-500" />
                <h3 className="text-lg font-semibold text-obsidian-900 dark:text-obsidian-100">
                  PDF Előnézet
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleDownload}
                  variant="gold"
                  size="sm"
                  icon={<Download className="w-4 h-4" />}
                >
                  Letöltés
                </Button>
                <Button
                  onClick={closePreview}
                  variant="ghost"
                  size="sm"
                  icon={<X className="w-4 h-4" />}
                >
                  Bezárás
                </Button>
              </div>
            </div>

            {/* PDF iframe */}
            <div className="flex-1 p-4">
              <iframe
                src={previewUrl}
                title="PDF Előnézet"
                className="w-full h-full rounded-lg border border-obsidian-200 dark:border-obsidian-700"
              />
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default MinutesPdfExport
