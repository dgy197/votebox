import { useState, useRef } from 'react'
import { Upload, FileText, AlertCircle, CheckCircle, Download } from 'lucide-react'
import Papa from 'papaparse'
import { useMemberStore, type CSVMemberRow } from '../../../stores/memberStore'
import { Button, Modal } from '../../ui'

interface CSVImportModalProps {
  isOpen: boolean
  onClose: () => void
  orgId: string
}

interface ParsedRow {
  name?: string
  email?: string
  phone?: string
  weight?: string
  weight_label?: string
  role?: string
  [key: string]: string | undefined
}

export function CSVImportModal({ isOpen, onClose, orgId }: CSVImportModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { importMembersFromCSV, loading, error } = useMemberStore()

  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<CSVMemberRow[]>([])
  const [parseError, setParseError] = useState<string | null>(null)
  const [importResult, setImportResult] = useState<{
    success: number
    failed: number
    errors: string[]
  } | null>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    setFile(selectedFile)
    setParseError(null)
    setImportResult(null)

    Papa.parse<ParsedRow>(selectedFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          setParseError(`CSV hiba: ${results.errors[0].message}`)
          return
        }

        const rows: CSVMemberRow[] = results.data.map((row) => ({
          name: row.name || row.nev || row.Név || '',
          email: row.email || row.Email || '',
          phone: row.phone || row.telefon || row.Telefon || '',
          weight: row.weight || row.suly || row.Súly || row.hanyad || row.Hányad || '1',
          weight_label: row.weight_label || row.cimke || row.Címke || row.lakas || row.Lakás || '',
          role: row.role || row.szerepkor || row.Szerepkör || 'voter',
        }))

        setPreview(rows.slice(0, 10)) // Show first 10 rows
      },
      error: (err) => {
        setParseError(`Hiba a fájl olvasásakor: ${err.message}`)
      },
    })
  }

  const handleImport = async () => {
    if (!file) return

    Papa.parse<ParsedRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const rows: CSVMemberRow[] = results.data.map((row) => ({
          name: row.name || row.nev || row.Név || '',
          email: row.email || row.Email || '',
          phone: row.phone || row.telefon || row.Telefon || '',
          weight: row.weight || row.suly || row.Súly || row.hanyad || row.Hányad || '1',
          weight_label: row.weight_label || row.cimke || row.Címke || row.lakas || row.Lakás || '',
          role: row.role || row.szerepkor || row.Szerepkör || 'voter',
        }))

        const result = await importMembersFromCSV(orgId, rows)
        setImportResult(result)
      },
    })
  }

  const handleClose = () => {
    setFile(null)
    setPreview([])
    setParseError(null)
    setImportResult(null)
    onClose()
  }

  const downloadTemplate = () => {
    const template = `name,email,phone,weight,weight_label,role
Kovács János,kovacs@example.com,+36201234567,52.5,A/1 lakás - 52m²,voter
Nagy Éva,nagy@example.com,+36301234567,48.2,A/2 lakás - 48m²,voter
Dr. Szabó Péter,szabo@example.com,+36701234567,65.0,B/1 lakás - 65m²,admin`

    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'tagok_sablon.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Tagok importálása CSV-ből">
      <div className="space-y-6">
        {/* Instructions */}
        <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-sm">
          <p className="text-blue-700 dark:text-blue-300 font-medium mb-2">
            Elfogadott oszlopok:
          </p>
          <ul className="text-blue-600 dark:text-blue-400 space-y-1">
            <li>• <code>name</code> / <code>nev</code> / <code>Név</code> - Név (kötelező)</li>
            <li>• <code>email</code> / <code>Email</code> - Email cím</li>
            <li>• <code>phone</code> / <code>telefon</code> - Telefon</li>
            <li>• <code>weight</code> / <code>suly</code> / <code>hanyad</code> - Súly (alapért.: 1)</li>
            <li>• <code>weight_label</code> / <code>cimke</code> / <code>lakas</code> - Címke</li>
            <li>• <code>role</code> / <code>szerepkor</code> - Szerepkör (voter/admin/chair/...)</li>
          </ul>
          <Button
            variant="secondary"
            size="sm"
            onClick={downloadTemplate}
            className="mt-3"
          >
            <Download className="w-4 h-4 mr-2" />
            Sablon letöltése
          </Button>
        </div>

        {/* File Input */}
        {!importResult && (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
            />
            {file ? (
              <div className="flex items-center justify-center gap-3">
                <FileText className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                <div className="text-left">
                  <p className="font-medium text-gray-900 dark:text-white">{file.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {preview.length} sor előnézet
                  </p>
                </div>
              </div>
            ) : (
              <>
                <Upload className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                <p className="text-gray-600 dark:text-gray-300">
                  Kattints vagy húzd ide a CSV fájlt
                </p>
              </>
            )}
          </div>
        )}

        {/* Parse Error */}
        {parseError && (
          <div className="flex items-start gap-3 p-4 rounded-lg bg-red-50 dark:bg-red-900/20">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-600 dark:text-red-400">{parseError}</p>
          </div>
        )}

        {/* Preview */}
        {preview.length > 0 && !importResult && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800/50">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-gray-500">Név</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-500">Email</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-500">Súly</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-500">Címke</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {preview.map((row, i) => (
                  <tr key={i}>
                    <td className="px-3 py-2 text-gray-900 dark:text-white">{row.name}</td>
                    <td className="px-3 py-2 text-gray-600 dark:text-gray-400">{row.email}</td>
                    <td className="px-3 py-2 font-mono text-gray-900 dark:text-white">{row.weight}</td>
                    <td className="px-3 py-2 text-gray-600 dark:text-gray-400">{row.weight_label}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {preview.length === 10 && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 text-center">
                ...és még több sor
              </p>
            )}
          </div>
        )}

        {/* Import Result */}
        {importResult && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 rounded-lg bg-green-50 dark:bg-green-900/20">
              <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
              <div>
                <p className="font-medium text-green-700 dark:text-green-300">
                  Import kész!
                </p>
                <p className="text-sm text-green-600 dark:text-green-400">
                  {importResult.success} tag sikeresen hozzáadva
                  {importResult.failed > 0 && `, ${importResult.failed} hiba`}
                </p>
              </div>
            </div>
            {importResult.errors.length > 0 && (
              <div className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
                <p className="font-medium text-yellow-700 dark:text-yellow-300 mb-2">
                  Hibák:
                </p>
                <ul className="text-sm text-yellow-600 dark:text-yellow-400 space-y-1">
                  {importResult.errors.map((err, i) => (
                    <li key={i}>• {err}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* API Error */}
        {error && (
          <div className="flex items-start gap-3 p-4 rounded-lg bg-red-50 dark:bg-red-900/20">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-700">
          <Button variant="secondary" onClick={handleClose}>
            {importResult ? 'Bezárás' : 'Mégse'}
          </Button>
          {!importResult && file && preview.length > 0 && (
            <Button onClick={handleImport} disabled={loading}>
              <Upload className="w-4 h-4 mr-2" />
              {loading ? 'Importálás...' : 'Importálás'}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  )
}
