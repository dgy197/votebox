import { useState, useRef, useEffect } from 'react'
import { Clock, ChevronUp, ChevronDown } from 'lucide-react'
import { Popover } from './Popover'

interface TimePickerProps {
  value?: string // HH:mm format
  onChange: (time: string) => void
  minTime?: string
  maxTime?: string
  step?: number // minutes step
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function TimePicker({
  value = '',
  onChange,
  step = 15,
  placeholder = 'Válasszon időpontot',
  disabled = false,
  className = '',
}: TimePickerProps) {
  const [open, setOpen] = useState(false)
  const [hours, setHours] = useState(value ? parseInt(value.split(':')[0]) : 9)
  const [minutes, setMinutes] = useState(value ? parseInt(value.split(':')[1]) : 0)

  const hoursRef = useRef<HTMLDivElement>(null)
  const minutesRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (value) {
      const [h, m] = value.split(':').map(Number)
      setHours(h)
      setMinutes(m)
    }
  }, [value])

  const formatTime = (h: number, m: number) => {
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
  }

  const handleTimeChange = (newHours: number, newMinutes: number) => {
    const h = Math.max(0, Math.min(23, newHours))
    const m = Math.max(0, Math.min(59, newMinutes))
    setHours(h)
    setMinutes(m)
    onChange(formatTime(h, m))
  }

  const commonTimeSlots = [
    '08:00', '09:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00', '17:00',
    '18:00', '19:00', '20:00'
  ]

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      trigger={
        <button
          type="button"
          disabled={disabled}
          className={`
            w-full flex items-center gap-2 px-3 py-2 rounded-lg
            border border-obsidian-200 dark:border-obsidian-700 
            bg-white dark:bg-obsidian-800 
            text-left text-sm
            hover:border-obsidian-300 dark:hover:border-obsidian-600
            focus:ring-2 focus:ring-gold-400 focus:border-transparent
            disabled:opacity-50 disabled:cursor-not-allowed
            ${className}
          `}
        >
          <Clock className="w-4 h-4 text-obsidian-400" />
          <span className={value ? 'text-obsidian-900 dark:text-ivory-100' : 'text-obsidian-400'}>
            {value || placeholder}
          </span>
        </button>
      }
    >
      <div className="p-4 min-w-[200px]">
        {/* Spinner style */}
        <div className="flex items-center justify-center gap-4 mb-4">
          {/* Hours */}
          <div ref={hoursRef} className="flex flex-col items-center">
            <button
              onClick={() => handleTimeChange(hours + 1, minutes)}
              className="p-1 hover:bg-obsidian-100 dark:hover:bg-obsidian-700 rounded"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
            <div className="text-2xl font-mono font-semibold text-obsidian-900 dark:text-ivory-100 w-10 text-center">
              {hours.toString().padStart(2, '0')}
            </div>
            <button
              onClick={() => handleTimeChange(hours - 1, minutes)}
              className="p-1 hover:bg-obsidian-100 dark:hover:bg-obsidian-700 rounded"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          <span className="text-2xl font-mono text-obsidian-400">:</span>

          {/* Minutes */}
          <div ref={minutesRef} className="flex flex-col items-center">
            <button
              onClick={() => handleTimeChange(hours, minutes + step)}
              className="p-1 hover:bg-obsidian-100 dark:hover:bg-obsidian-700 rounded"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
            <div className="text-2xl font-mono font-semibold text-obsidian-900 dark:text-ivory-100 w-10 text-center">
              {minutes.toString().padStart(2, '0')}
            </div>
            <button
              onClick={() => handleTimeChange(hours, minutes - step)}
              className="p-1 hover:bg-obsidian-100 dark:hover:bg-obsidian-700 rounded"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quick select */}
        <div className="border-t border-obsidian-200 dark:border-obsidian-700 pt-3">
          <div className="text-xs text-obsidian-500 dark:text-obsidian-400 mb-2">
            Gyors választás
          </div>
          <div className="grid grid-cols-4 gap-1">
            {commonTimeSlots.map(slot => (
              <button
                key={slot}
                onClick={() => {
                  onChange(slot)
                  setOpen(false)
                }}
                className={`
                  px-2 py-1 text-xs rounded transition-colors
                  ${value === slot 
                    ? 'bg-gold-500 text-white' 
                    : 'bg-obsidian-100 dark:bg-obsidian-700 text-obsidian-700 dark:text-obsidian-300 hover:bg-obsidian-200 dark:hover:bg-obsidian-600'
                  }
                `}
              >
                {slot}
              </button>
            ))}
          </div>
        </div>

        {/* Confirm */}
        <button
          onClick={() => setOpen(false)}
          className="w-full mt-3 px-3 py-2 bg-gold-500 hover:bg-gold-600 text-white rounded-lg font-medium text-sm transition-colors"
        >
          OK
        </button>
      </div>
    </Popover>
  )
}
