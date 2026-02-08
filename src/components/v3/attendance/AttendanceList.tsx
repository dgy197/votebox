/**
 * AttendanceList Component
 * Jelenléti ív kezelése - check-in/check-out funkciók
 */

import { useEffect, useState, useCallback, useMemo } from 'react'
import { 
  UserCheck, UserX, Users, Search, 
  Clock, Wifi, MapPin, User, RefreshCw,
  CheckCircle, LogIn, LogOut
} from 'lucide-react'
import { Card, Button, Input, Badge, Spinner } from '../../ui'
import { useMemberStore } from '../../../stores/memberStore'
import { useMeetingStore } from '../../../stores/meetingStore'
import type { Member, Attendance, AttendanceType } from '../../../types/v3'

interface AttendanceListProps {
  meetingId: string
  orgId: string
  isActive?: boolean  // Meeting in progress
  readOnly?: boolean
}

type FilterType = 'all' | 'present' | 'absent'

interface AttendanceRecord extends Member {
  attendanceRecord?: Attendance
  isPresent: boolean
}

const attendanceTypeLabels: Record<AttendanceType, { label: string; icon: typeof Wifi }> = {
  in_person: { label: 'Személyesen', icon: MapPin },
  online: { label: 'Online', icon: Wifi },
  proxy: { label: 'Meghatalmazott', icon: User },
}

export function AttendanceList({ 
  meetingId, 
  orgId, 
  isActive = false,
  readOnly = false 
}: AttendanceListProps) {
  const { members, fetchMembers, loading: membersLoading } = useMemberStore()
  const { 
    attendance, 
    fetchAttendance, 
    checkIn, 
    checkOut,
    loading: attendanceLoading 
  } = useMeetingStore()

  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<FilterType>('all')
  const [checkingIn, setCheckingIn] = useState<string | null>(null)
  const [selectedType, setSelectedType] = useState<AttendanceType>('in_person')

  // Fetch data on mount
  useEffect(() => {
    fetchMembers(orgId)
    fetchAttendance(meetingId)
  }, [orgId, meetingId, fetchMembers, fetchAttendance])

  // Combine members with attendance data
  const attendanceRecords: AttendanceRecord[] = useMemo(() => {
    return members
      .filter(m => m.is_active && m.role !== 'observer')
      .map(member => {
        const record = attendance.find(a => a.member_id === member.id)
        return {
          ...member,
          attendanceRecord: record,
          isPresent: record ? !record.checked_out_at : false,
        }
      })
  }, [members, attendance])

  // Filter and search
  const filteredRecords = useMemo(() => {
    return attendanceRecords.filter(record => {
      // Search filter
      const matchesSearch = search === '' || 
        record.name.toLowerCase().includes(search.toLowerCase()) ||
        record.email?.toLowerCase().includes(search.toLowerCase())

      // Status filter
      const matchesFilter = filter === 'all' ||
        (filter === 'present' && record.isPresent) ||
        (filter === 'absent' && !record.isPresent)

      return matchesSearch && matchesFilter
    })
  }, [attendanceRecords, search, filter])

  // Statistics
  const stats = useMemo(() => {
    const total = attendanceRecords.length
    const present = attendanceRecords.filter(r => r.isPresent).length
    const presentWeight = attendanceRecords
      .filter(r => r.isPresent)
      .reduce((sum, r) => sum + (r.attendanceRecord?.weight_at_checkin || r.weight), 0)
    const totalWeight = attendanceRecords.reduce((sum, r) => sum + r.weight, 0)

    return {
      total,
      present,
      absent: total - present,
      presentWeight,
      totalWeight,
      percentage: totalWeight > 0 ? (presentWeight / totalWeight) * 100 : 0,
    }
  }, [attendanceRecords])

  const handleCheckIn = useCallback(async (member: Member) => {
    setCheckingIn(member.id)
    try {
      await checkIn(meetingId, member.id, selectedType, member.weight)
    } finally {
      setCheckingIn(null)
    }
  }, [meetingId, selectedType, checkIn])

  const handleCheckOut = useCallback(async (record: AttendanceRecord) => {
    if (!record.attendanceRecord) return
    setCheckingIn(record.id)
    try {
      await checkOut(record.attendanceRecord.id)
    } finally {
      setCheckingIn(null)
    }
  }, [checkOut])

  const handleRefresh = useCallback(() => {
    fetchAttendance(meetingId)
  }, [meetingId, fetchAttendance])

  const loading = membersLoading || attendanceLoading

  if (loading && attendanceRecords.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Statistics Card */}
      <Card className="p-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <Users className="w-5 h-5 mx-auto text-gray-400 mb-1" />
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.total}
            </div>
            <div className="text-xs text-gray-500">Összes tag</div>
          </div>
          <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <UserCheck className="w-5 h-5 mx-auto text-green-500 mb-1" />
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {stats.present}
            </div>
            <div className="text-xs text-green-600 dark:text-green-400">Jelen van</div>
          </div>
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <UserX className="w-5 h-5 mx-auto text-gray-400 mb-1" />
            <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">
              {stats.absent}
            </div>
            <div className="text-xs text-gray-500">Hiányzik</div>
          </div>
          <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {stats.percentage.toFixed(1)}%
            </div>
            <div className="text-xs text-blue-600 dark:text-blue-400">
              {stats.presentWeight.toFixed(2)} / {stats.totalWeight.toFixed(2)}
            </div>
          </div>
        </div>
      </Card>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Tag keresése..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          {(['all', 'present', 'absent'] as const).map((f) => (
            <Button
              key={f}
              variant={filter === f ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setFilter(f)}
            >
              {f === 'all' ? 'Mind' : f === 'present' ? 'Jelen' : 'Hiányzik'}
            </Button>
          ))}
        </div>

        {/* Attendance type selector */}
        {isActive && !readOnly && (
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value as AttendanceType)}
            className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
          >
            {Object.entries(attendanceTypeLabels).map(([value, { label }]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        )}

        {/* Refresh */}
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleRefresh}
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Member list */}
      <div className="space-y-2">
        {filteredRecords.length === 0 ? (
          <Card className="p-8 text-center">
            <Users className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-gray-500 dark:text-gray-400">
              {search ? 'Nincs találat' : 'Nincsenek tagok'}
            </p>
          </Card>
        ) : (
          filteredRecords.map((record) => (
            <MemberRow
              key={record.id}
              record={record}
              isActive={isActive}
              readOnly={readOnly}
              isLoading={checkingIn === record.id}
              onCheckIn={() => handleCheckIn(record)}
              onCheckOut={() => handleCheckOut(record)}
            />
          ))
        )}
      </div>
    </div>
  )
}

// ============ Member Row ============
interface MemberRowProps {
  record: AttendanceRecord
  isActive: boolean
  readOnly: boolean
  isLoading: boolean
  onCheckIn: () => void
  onCheckOut: () => void
}

function MemberRow({ 
  record, 
  isActive, 
  readOnly, 
  isLoading,
  onCheckIn, 
  onCheckOut 
}: MemberRowProps) {
  const TypeIcon = record.attendanceRecord 
    ? attendanceTypeLabels[record.attendanceRecord.attendance_type].icon 
    : null

  return (
    <Card className={`
      p-4 transition-colors
      ${record.isPresent 
        ? 'border-l-4 border-l-green-500 bg-green-50/50 dark:bg-green-900/10' 
        : ''
      }
    `}>
      <div className="flex items-center justify-between gap-4">
        {/* Member info */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* Avatar/Status */}
          <div className={`
            w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0
            ${record.isPresent 
              ? 'bg-green-100 dark:bg-green-900/30' 
              : 'bg-gray-100 dark:bg-gray-800'
            }
          `}>
            {record.isPresent ? (
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            ) : (
              <User className="w-5 h-5 text-gray-400" />
            )}
          </div>

          {/* Name & details */}
          <div className="min-w-0">
            <div className="font-medium text-gray-900 dark:text-white truncate">
              {record.name}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <span className="font-mono">
                {record.weight.toFixed(2)} {record.weight_label && `(${record.weight_label})`}
              </span>
              {record.attendanceRecord && TypeIcon && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <TypeIcon className="w-3 h-3" />
                    {attendanceTypeLabels[record.attendanceRecord.attendance_type].label}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Check-in time */}
        {record.attendanceRecord && (
          <div className="hidden sm:flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
            <Clock className="w-3 h-3" />
            {new Date(record.attendanceRecord.checked_in_at).toLocaleTimeString('hu-HU', {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>
        )}

        {/* Role badge */}
        <Badge 
          variant={record.role === 'admin' || record.role === 'chair' ? 'primary' : 'secondary'}
          size="sm"
        >
          {record.role === 'admin' ? 'Admin' : 
           record.role === 'chair' ? 'Elnök' : 
           record.role === 'secretary' ? 'Jegyző' : 'Tag'}
        </Badge>

        {/* Actions */}
        {isActive && !readOnly && (
          <div className="flex-shrink-0">
            {record.isPresent ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={onCheckOut}
                disabled={isLoading}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                {isLoading ? (
                  <Spinner size="sm" />
                ) : (
                  <>
                    <LogOut className="w-4 h-4 mr-1" />
                    <span className="hidden sm:inline">Távozik</span>
                  </>
                )}
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                onClick={onCheckIn}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Spinner size="sm" />
                ) : (
                  <>
                    <LogIn className="w-4 h-4 mr-1" />
                    <span className="hidden sm:inline">Bejelentkezik</span>
                  </>
                )}
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  )
}

export default AttendanceList
