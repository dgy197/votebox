import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Calendar, MapPin, Users, Vote, Check } from 'lucide-react'
import { useMeetingStore } from '../../../stores/meetingStore'
import { Button, Card, Input } from '../../ui'
import type { MeetingType, LocationType, QuorumType } from '../../../types/v3'

interface MeetingWizardProps {
  orgId: string
}

const meetingTypes: { value: MeetingType; label: string; description: string }[] = [
  { value: 'regular', label: 'Rendes gyűlés', description: 'Rendszeres, tervezett gyűlés' },
  { value: 'extraordinary', label: 'Rendkívüli gyűlés', description: 'Sürgős, nem tervezett ülés' },
  { value: 'board', label: 'Igazgatósági ülés', description: 'Vezetőségi megbeszélés' },
]

const locationTypes: { value: LocationType; label: string; icon: string }[] = [
  { value: 'in_person', label: 'Személyes', icon: '🏢' },
  { value: 'online', label: 'Online', icon: '💻' },
  { value: 'hybrid', label: 'Hibrid', icon: '🔄' },
]

const quorumTypes: { value: QuorumType; label: string; percentage: number }[] = [
  { value: 'majority', label: 'Egyszerű többség', percentage: 50 },
  { value: 'two_thirds', label: 'Kétharmados', percentage: 66.67 },
  { value: 'unanimous', label: 'Egyhangú', percentage: 100 },
  { value: 'custom', label: 'Egyéni', percentage: 50 },
]

export function MeetingWizard({ orgId }: MeetingWizardProps) {
  const navigate = useNavigate()
  const { createMeeting, loading, error, clearError } = useMeetingStore()

  const [step, setStep] = useState(1)
  const totalSteps = 4

  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState<MeetingType>('regular')
  const [scheduledAt, setScheduledAt] = useState('')
  const [location, setLocation] = useState('')
  const [locationType, setLocationType] = useState<LocationType>('hybrid')
  const [meetingUrl, setMeetingUrl] = useState('')
  const [quorumType, setQuorumType] = useState<QuorumType>('majority')
  const [quorumPercentage, setQuorumPercentage] = useState(50)

  const canProceed = () => {
    switch (step) {
      case 1:
        return title.trim().length > 0
      case 2:
        return true // Location is optional
      case 3:
        return true // Quorum has defaults
      case 4:
        return true // Review
      default:
        return false
    }
  }

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1)
    }
  }

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  const handleSubmit = async () => {
    clearError()
    const meeting = await createMeeting({
      org_id: orgId,
      title: title.trim(),
      description: description.trim() || undefined,
      type,
      scheduled_at: scheduledAt || undefined,
      location: location.trim() || undefined,
      location_type: locationType,
      meeting_url: meetingUrl.trim() || undefined,
      quorum_type: quorumType,
      quorum_percentage: quorumPercentage,
    })

    if (meeting) {
      navigate(`/v3/org/${orgId}/meeting/${meeting.id}`)
    }
  }

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Alapadatok
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Gyűlés neve *
                  </label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="pl. 2024. évi rendes közgyűlés"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Leírás
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Opcionális leírás a gyűlésről..."
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Típus
                  </label>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {meetingTypes.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setType(option.value)}
                        className={`p-4 rounded-xl border-2 text-left transition-all ${
                          type === option.value
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                        }`}
                      >
                        <div className="font-medium text-gray-900 dark:text-white">
                          {option.label}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {option.description}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Időpont és helyszín
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Calendar className="inline w-4 h-4 mr-1" />
                Időpont
              </label>
              <Input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
              />
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Hagyd üresen, ha később szeretnéd egyeztetni (Doodle)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Helyszín típusa
              </label>
              <div className="flex gap-3">
                {locationTypes.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setLocationType(option.value)}
                    className={`flex-1 p-4 rounded-xl border-2 text-center transition-all ${
                      locationType === option.value
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-2xl mb-1">{option.icon}</div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {option.label}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {(locationType === 'in_person' || locationType === 'hybrid') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <MapPin className="inline w-4 h-4 mr-1" />
                  Helyszín
                </label>
                <Input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="pl. Közösségi terem, Fő u. 1."
                />
              </div>
            )}

            {(locationType === 'online' || locationType === 'hybrid') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Online link
                </label>
                <Input
                  type="url"
                  value={meetingUrl}
                  onChange={(e) => setMeetingUrl(e.target.value)}
                  placeholder="https://meet.google.com/... vagy https://teams.microsoft.com/..."
                />
              </div>
            )}
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              <Users className="inline w-5 h-5 mr-2" />
              Határozatképesség
            </h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Quorum típusa
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                {quorumTypes.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      setQuorumType(option.value)
                      if (option.value !== 'custom') {
                        setQuorumPercentage(option.percentage)
                      }
                    }}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      quorumType === option.value
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium text-gray-900 dark:text-white">
                      {option.label}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {option.percentage}%
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {quorumType === 'custom' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Egyéni quorum százalék
                </label>
                <div className="flex items-center gap-3">
                  <Input
                    type="number"
                    min="1"
                    max="100"
                    step="0.01"
                    value={quorumPercentage}
                    onChange={(e) => setQuorumPercentage(parseFloat(e.target.value) || 50)}
                    className="w-32"
                  />
                  <span className="text-gray-600 dark:text-gray-400">%</span>
                </div>
              </div>
            )}

            <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                <strong>Határozatképesség:</strong> A gyűlés akkor határozatképes, ha a 
                szavazásra jogosultak <strong>{quorumPercentage}%</strong>-a jelen van 
                (súlyozott arányban).
              </p>
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              <Check className="inline w-5 h-5 mr-2" />
              Összegzés
            </h3>

            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Gyűlés neve</div>
                <div className="font-medium text-gray-900 dark:text-white">{title}</div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Típus</div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {meetingTypes.find((t) => t.value === type)?.label}
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Helyszín</div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {locationTypes.find((l) => l.value === locationType)?.label}
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Időpont</div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {scheduledAt
                      ? new Date(scheduledAt).toLocaleString('hu-HU')
                      : 'Később egyeztetve'}
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Quorum</div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {quorumPercentage}%
                  </div>
                </div>
              </div>

              {description && (
                <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                  <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Leírás</div>
                  <div className="text-gray-900 dark:text-white">{description}</div>
                </div>
              )}
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(`/v3/org/${orgId}`)}
          className="p-2 rounded-lg text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Új gyűlés</h1>
          <p className="text-gray-500 dark:text-gray-400">
            {step}. lépés / {totalSteps}
          </p>
        </div>
      </div>

      {/* Progress */}
      <div className="flex gap-2">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div
            key={i}
            className={`flex-1 h-2 rounded-full transition-colors ${
              i < step
                ? 'bg-blue-500'
                : 'bg-gray-200 dark:bg-gray-700'
            }`}
          />
        ))}
      </div>

      {/* Content */}
      <Card className="p-6">
        {renderStep()}

        {/* Error */}
        {error && (
          <div className="mt-4 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400">
            {error}
          </div>
        )}
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="secondary"
          onClick={handleBack}
          disabled={step === 1}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Vissza
        </Button>

        {step < totalSteps ? (
          <Button onClick={handleNext} disabled={!canProceed()}>
            Tovább
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={loading}>
            <Vote className="w-4 h-4 mr-2" />
            {loading ? 'Létrehozás...' : 'Gyűlés létrehozása'}
          </Button>
        )}
      </div>
    </div>
  )
}
