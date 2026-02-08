/**
 * ProxyManagement Component
 * Meghatalmazások kezelése - létrehozás, feltöltés, lista
 * 
 * Magyar jogi követelmények:
 * - Meghatalmazás kötelező tartalma: meghatalmazó neve, meghatalmazott neve, érvényesség, aláírás
 * - Társasháznál általában 1 személy max 2 másik tulajdonost képviselhet
 * - A meghatalmazás lehet általános (minden gyűlésre) vagy specifikus (egy gyűlésre)
 */

import { useEffect, useState, useCallback, useMemo } from 'react'
import {
  Users, UserPlus, FileText, Trash2, AlertCircle,
  CheckCircle, Upload, Calendar, Clock, Shield,
  ChevronDown, ChevronUp, Eye, X, Scale, RefreshCw
} from 'lucide-react'
import { Card, CardHeader, Button, Input, Modal, Badge, Spinner } from '../ui'
import {
  createProxy,
  getOrgProxies,
  getActiveProxies,
  getGrantedProxies,
  revokeProxy,
  deleteProxy,
  uploadProxyDocument,
  canReceiveProxy,
  MAX_PROXIES_PER_GRANTEE,
  type ProxyWithMembers,
  type CreateProxyInput,
} from '../../lib/proxy-service'
import type { Member, Meeting } from '../../types/v3'

interface ProxyManagementProps {
  orgId: string
  members: Member[]
  currentMember?: Member
  meeting?: Meeting  // If provided, proxies are for this specific meeting
  readOnly?: boolean
}

type ViewMode = 'all' | 'received' | 'granted'

export function ProxyManagement({
  orgId,
  members,
  currentMember,
  meeting,
  readOnly = false,
}: ProxyManagementProps) {
  const [proxies, setProxies] = useState<ProxyWithMembers[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  // Create proxy modal state
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedGrantor, setSelectedGrantor] = useState<string>('')
  const [selectedGrantee, setSelectedGrantee] = useState<string>('')
  const [validUntil, setValidUntil] = useState<string>('')
  const [isGeneralProxy, setIsGeneralProxy] = useState(!meeting)
  const [creating, setCreating] = useState(false)
  
  // Document upload
  const [uploadingFor, setUploadingFor] = useState<string | null>(null)
  const [documentFile, setDocumentFile] = useState<File | null>(null)
  
  // View/delete confirmation
  const [viewMode, setViewMode] = useState<ViewMode>('all')
  const [confirmDelete, setConfirmDelete] = useState<ProxyWithMembers | null>(null)
  const [deleting, setDeleting] = useState(false)
  
  // Expanded proxy details
  const [expandedProxy, setExpandedProxy] = useState<string | null>(null)

  // Create a map for quick member lookup
  const membersMap = useMemo(() => {
    return new Map(members.map(m => [m.id, m]))
  }, [members])

  // Fetch proxies
  const fetchProxies = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getOrgProxies(orgId, meeting?.id)
      setProxies(data)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }, [orgId, meeting?.id])

  useEffect(() => {
    fetchProxies()
  }, [fetchProxies])

  // Filter proxies based on view mode
  const filteredProxies = useMemo(() => {
    if (!currentMember || viewMode === 'all') return proxies
    
    if (viewMode === 'received') {
      return proxies.filter(p => p.grantee_id === currentMember.id)
    }
    
    if (viewMode === 'granted') {
      return proxies.filter(p => p.grantor_id === currentMember.id)
    }
    
    return proxies
  }, [proxies, currentMember, viewMode])

  // Get available grantors (members who haven't given proxy yet)
  const availableGrantors = useMemo(() => {
    const grantorIds = new Set(proxies.map(p => p.grantor_id))
    return members.filter(m => 
      !grantorIds.has(m.id) && 
      m.is_active && 
      m.role !== 'observer'
    )
  }, [members, proxies])

  // Get available grantees (members who can receive more proxies)
  const availableGrantees = useMemo(() => {
    const proxyCountMap = new Map<string, number>()
    proxies.forEach(p => {
      proxyCountMap.set(p.grantee_id, (proxyCountMap.get(p.grantee_id) || 0) + 1)
    })
    
    return members.filter(m => {
      const count = proxyCountMap.get(m.id) || 0
      return m.id !== selectedGrantor && 
             m.is_active && 
             m.role !== 'observer' &&
             count < MAX_PROXIES_PER_GRANTEE
    })
  }, [members, proxies, selectedGrantor])

  // Handle create proxy
  const handleCreate = async () => {
    if (!selectedGrantor || !selectedGrantee) {
      setError('Válassza ki a meghatalmazót és a meghatalmazottat')
      return
    }

    setCreating(true)
    setError(null)

    try {
      const input: CreateProxyInput = {
        org_id: orgId,
        grantor_id: selectedGrantor,
        grantee_id: selectedGrantee,
        meeting_id: isGeneralProxy ? null : meeting?.id,
        valid_until: validUntil || null,
      }

      await createProxy(input)
      
      setSuccess('Meghatalmazás sikeresen létrehozva!')
      setShowCreateModal(false)
      resetForm()
      fetchProxies()
      
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setCreating(false)
    }
  }

  // Handle document upload
  const handleUpload = async (proxyId: string) => {
    if (!documentFile) return

    setUploadingFor(proxyId)
    try {
      const url = await uploadProxyDocument(documentFile, orgId, proxyId)
      if (url) {
        setSuccess('Dokumentum feltöltve!')
        fetchProxies()
        setTimeout(() => setSuccess(null), 3000)
      } else {
        setError('Hiba a feltöltés során')
      }
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setUploadingFor(null)
      setDocumentFile(null)
    }
  }

  // Handle revoke/delete proxy
  const handleDelete = async (proxy: ProxyWithMembers) => {
    setDeleting(true)
    try {
      const success = await revokeProxy(proxy.id)
      if (success) {
        setSuccess('Meghatalmazás visszavonva!')
        fetchProxies()
        setTimeout(() => setSuccess(null), 3000)
      }
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setDeleting(false)
      setConfirmDelete(null)
    }
  }

  // Reset form
  const resetForm = () => {
    setSelectedGrantor('')
    setSelectedGrantee('')
    setValidUntil('')
    setIsGeneralProxy(!meeting)
    setDocumentFile(null)
  }

  // Format date for display
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('hu-HU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // Check if proxy is expired
  const isExpired = (proxy: ProxyWithMembers) => {
    if (!proxy.valid_until) return false
    return new Date(proxy.valid_until) < new Date()
  }

  if (loading && proxies.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Shield className="w-6 h-6 text-purple-500" />
            Meghatalmazások
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {meeting 
              ? `Gyűlésre vonatkozó: ${meeting.title}`
              : 'Általános és gyűlés-specifikus meghatalmazások'}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchProxies}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          
          {!readOnly && (
            <Button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              Új meghatalmazás
            </Button>
          )}
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="flex items-center gap-2 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 p-4 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Stats card */}
      <Card className="p-4">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {proxies.length}
            </div>
            <div className="text-sm text-gray-500">Összes</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">
              {proxies.filter(p => !isExpired(p)).length}
            </div>
            <div className="text-sm text-gray-500">Aktív</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-gray-400">
              {proxies.filter(p => isExpired(p)).length}
            </div>
            <div className="text-sm text-gray-500">Lejárt</div>
          </div>
        </div>
      </Card>

      {/* View mode filter */}
      {currentMember && (
        <div className="flex gap-2">
          {[
            { mode: 'all' as ViewMode, label: 'Mind' },
            { mode: 'received' as ViewMode, label: 'Kapott' },
            { mode: 'granted' as ViewMode, label: 'Adott' },
          ].map(({ mode, label }) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`
                px-4 py-2 rounded-lg text-sm font-medium transition-colors
                ${viewMode === mode
                  ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }
              `}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Proxy list */}
      <div className="space-y-3">
        {filteredProxies.length === 0 ? (
          <Card className="p-8 text-center">
            <Users className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              Nincs meghatalmazás
            </p>
          </Card>
        ) : (
          filteredProxies.map(proxy => {
            const grantor = proxy.grantor || membersMap.get(proxy.grantor_id)
            const grantee = proxy.grantee || membersMap.get(proxy.grantee_id)
            const expired = isExpired(proxy)
            const isExpanded = expandedProxy === proxy.id

            return (
              <Card
                key={proxy.id}
                className={`
                  overflow-hidden transition-all
                  ${expired ? 'opacity-60' : ''}
                `}
              >
                <div 
                  className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  onClick={() => setExpandedProxy(isExpanded ? null : proxy.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {/* Grantor avatar */}
                      <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                        <span className="font-medium text-purple-600 dark:text-purple-400">
                          {grantor?.name?.[0] || '?'}
                        </span>
                      </div>

                      {/* Arrow */}
                      <div className="text-gray-400">→</div>

                      {/* Grantee avatar */}
                      <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                        <span className="font-medium text-blue-600 dark:text-blue-400">
                          {grantee?.name?.[0] || '?'}
                        </span>
                      </div>

                      {/* Names */}
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {grantor?.name || 'Ismeretlen'} → {grantee?.name || 'Ismeretlen'}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <Scale className="w-3 h-3" />
                          <span>Súly: {grantor?.weight?.toFixed(2) || '1.00'}</span>
                          {proxy.meeting_id ? (
                            <Badge variant="primary" size="sm">Gyűlés-specifikus</Badge>
                          ) : (
                            <Badge variant="secondary" size="sm">Általános</Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Status badges */}
                      {expired ? (
                        <Badge variant="danger" size="sm">Lejárt</Badge>
                      ) : (
                        <Badge variant="success" size="sm">Aktív</Badge>
                      )}

                      {proxy.document_url && (
                        <Badge variant="secondary" size="sm">
                          <FileText className="w-3 h-3 mr-1" />
                          Dok
                        </Badge>
                      )}

                      {/* Expand icon */}
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-2 border-t dark:border-gray-700 space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-gray-500 dark:text-gray-400">Érvényes:</div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {formatDate(proxy.valid_from)}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-500 dark:text-gray-400">Lejárat:</div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {proxy.valid_until ? formatDate(proxy.valid_until) : 'Nincs (határozatlan)'}
                        </div>
                      </div>
                    </div>

                    {/* Document section */}
                    <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                      <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-gray-400" />
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                          Dokumentum
                        </span>
                      </div>

                      {proxy.document_url ? (
                        <a
                          href={proxy.document_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-sm text-blue-600 hover:underline"
                        >
                          <Eye className="w-4 h-4" />
                          Megtekintés
                        </a>
                      ) : (
                        !readOnly && (
                          <div className="flex items-center gap-2">
                            <input
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png"
                              onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) {
                                  setDocumentFile(file)
                                  handleUpload(proxy.id)
                                }
                              }}
                              className="hidden"
                              id={`upload-${proxy.id}`}
                            />
                            <label
                              htmlFor={`upload-${proxy.id}`}
                              className="flex items-center gap-1 text-sm text-blue-600 hover:underline cursor-pointer"
                            >
                              {uploadingFor === proxy.id ? (
                                <Spinner size="sm" />
                              ) : (
                                <Upload className="w-4 h-4" />
                              )}
                              Feltöltés
                            </label>
                          </div>
                        )
                      )}
                    </div>

                    {/* Actions */}
                    {!readOnly && !expired && (
                      <div className="flex justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            setConfirmDelete(proxy)
                          }}
                          className="text-red-600 hover:text-red-700 hover:border-red-300"
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Visszavonás
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </Card>
            )
          })
        )}
      </div>

      {/* Create Proxy Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false)
          resetForm()
        }}
        title="Új meghatalmazás"
      >
        <div className="space-y-4">
          {/* Info box */}
          <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-sm text-blue-700 dark:text-blue-300">
            <strong>Magyar jogi követelmény:</strong> Egy tag maximum {MAX_PROXIES_PER_GRANTEE} másik tagtól kaphat meghatalmazást.
          </div>

          {/* Grantor selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Meghatalmazó (aki átadja szavazatát)
            </label>
            <select
              value={selectedGrantor}
              onChange={(e) => setSelectedGrantor(e.target.value)}
              className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600"
            >
              <option value="">Válasszon...</option>
              {availableGrantors.map(m => (
                <option key={m.id} value={m.id}>
                  {m.name} (súly: {m.weight.toFixed(2)})
                </option>
              ))}
            </select>
          </div>

          {/* Grantee selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Meghatalmazott (aki a szavazatot kapja)
            </label>
            <select
              value={selectedGrantee}
              onChange={(e) => setSelectedGrantee(e.target.value)}
              disabled={!selectedGrantor}
              className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600 disabled:opacity-50"
            >
              <option value="">Válasszon...</option>
              {availableGrantees.map(m => (
                <option key={m.id} value={m.id}>
                  {m.name} (súly: {m.weight.toFixed(2)})
                </option>
              ))}
            </select>
          </div>

          {/* Proxy type */}
          {meeting && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isGeneral"
                checked={isGeneralProxy}
                onChange={(e) => setIsGeneralProxy(e.target.checked)}
                className="rounded"
              />
              <label htmlFor="isGeneral" className="text-sm text-gray-700 dark:text-gray-300">
                Általános meghatalmazás (minden gyűlésre érvényes)
              </label>
            </div>
          )}

          {/* Valid until */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Érvényesség vége (opcionális)
            </label>
            <input
              type="datetime-local"
              value={validUntil}
              onChange={(e) => setValidUntil(e.target.value)}
              className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600"
            />
            <p className="mt-1 text-xs text-gray-500">
              Ha nem adja meg, a meghatalmazás határozatlan ideig érvényes.
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              variant="ghost"
              onClick={() => {
                setShowCreateModal(false)
                resetForm()
              }}
            >
              Mégse
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!selectedGrantor || !selectedGrantee || creating}
            >
              {creating ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  Létrehozás...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Létrehozás
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Meghatalmazás visszavonása"
      >
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-300">
            Biztosan visszavonja ezt a meghatalmazást?
          </p>
          
          {confirmDelete && (
            <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
              <div className="font-medium">
                {confirmDelete.grantor?.name || 'Ismeretlen'} → {confirmDelete.grantee?.name || 'Ismeretlen'}
              </div>
              <div className="text-sm text-gray-500">
                Súly: {confirmDelete.grantor?.weight?.toFixed(2) || '1.00'}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setConfirmDelete(null)}>
              Mégse
            </Button>
            <Button
              variant="primary"
              onClick={() => confirmDelete && handleDelete(confirmDelete)}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  Visszavonás...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Visszavonás
                </>
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
