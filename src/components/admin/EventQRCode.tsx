import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { QrCode, Download, Copy, Check, Maximize2, X } from 'lucide-react'
import type { Event } from '../../types'

interface EventQRCodeProps {
  event: Event
  baseUrl?: string
}

export function EventQRCode({ event, baseUrl }: EventQRCodeProps) {
  const [copied, setCopied] = useState(false)
  const [showFullscreen, setShowFullscreen] = useState(false)

  // Generate the voter login URL
  const voterUrl = `${baseUrl || window.location.origin}/voter?code=${event.event_code}`

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(voterUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleDownloadQR = () => {
    const svg = document.getElementById(`qr-code-${event.id}`)
    if (!svg) return

    // Convert SVG to PNG and download
    const svgData = new XMLSerializer().serializeToString(svg)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()

    canvas.width = 512
    canvas.height = 512

    img.onload = () => {
      if (ctx) {
        // White background
        ctx.fillStyle = 'white'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

        const link = document.createElement('a')
        link.download = `${event.event_code}_qr.png`
        link.href = canvas.toDataURL('image/png')
        link.click()
      }
    }

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)))
  }

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div className="flex items-center gap-2 mb-4">
          <QrCode className="w-5 h-5 text-gray-500" />
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Belépési QR kód
          </h3>
        </div>

        {/* QR Code display */}
        <div className="flex flex-col items-center">
          <div 
            className="p-4 bg-white rounded-lg shadow-inner cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setShowFullscreen(true)}
            title="Kattints a nagyításhoz"
          >
            <QRCodeSVG
              id={`qr-code-${event.id}`}
              value={voterUrl}
              size={160}
              level="H"
              includeMargin={true}
              bgColor="#ffffff"
              fgColor="#000000"
            />
          </div>

          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Kód: <span className="font-mono font-bold">{event.event_code}</span>
          </p>
        </div>

        {/* Actions */}
        <div className="mt-4 flex gap-2">
          <button
            onClick={handleCopyUrl}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors text-sm"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-green-500" />
                Másolva!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Link másolása
              </>
            )}
          </button>

          <button
            onClick={handleDownloadQR}
            className="flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
          >
            <Download className="w-4 h-4" />
            Letöltés
          </button>

          <button
            onClick={() => setShowFullscreen(true)}
            className="flex items-center justify-center px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
            title="Teljes képernyő"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>

        {/* URL display */}
        <div className="mt-4 p-2 bg-gray-50 dark:bg-gray-900 rounded text-xs font-mono text-gray-500 break-all">
          {voterUrl}
        </div>
      </div>

      {/* Fullscreen Modal */}
      {showFullscreen && (
        <div 
          className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center"
          onClick={() => setShowFullscreen(false)}
        >
          <button
            onClick={() => setShowFullscreen(false)}
            className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-8 h-8 text-gray-500" />
          </button>

          <QRCodeSVG
            value={voterUrl}
            size={Math.min(window.innerWidth, window.innerHeight) * 0.7}
            level="H"
            includeMargin={true}
            bgColor="#ffffff"
            fgColor="#000000"
          />

          <p className="mt-8 text-2xl font-mono font-bold text-gray-800">
            {event.event_code}
          </p>

          <p className="mt-2 text-gray-500">
            Szkenneld be a belépéshez
          </p>
        </div>
      )}
    </>
  )
}

/**
 * Compact QR code for inline display
 */
export function QRCodeMini({ event }: { event: Event }) {
  const voterUrl = `${window.location.origin}/voter?code=${event.event_code}`

  return (
    <div className="inline-flex items-center gap-2 p-2 bg-white rounded-lg shadow-sm">
      <QRCodeSVG
        value={voterUrl}
        size={48}
        level="M"
        bgColor="#ffffff"
        fgColor="#000000"
      />
      <div className="text-xs">
        <p className="text-gray-500">Belépés</p>
        <p className="font-mono font-bold">{event.event_code}</p>
      </div>
    </div>
  )
}
