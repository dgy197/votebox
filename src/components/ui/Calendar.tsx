import { ChevronLeft, ChevronRight } from 'lucide-react'
import { DayPicker, type DayPickerProps } from 'react-day-picker'
import { hu } from 'date-fns/locale'

export type CalendarProps = DayPickerProps

export function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={`p-3 ${className || ''}`}
      locale={hu}
      classNames={{
        months: 'flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0',
        month: 'space-y-4',
        month_caption: 'flex justify-center pt-1 relative items-center',
        caption_label: 'text-sm font-medium text-obsidian-900 dark:text-ivory-100',
        nav: 'space-x-1 flex items-center',
        button_previous: 'absolute left-1 inline-flex items-center justify-center w-7 h-7 bg-transparent hover:bg-obsidian-100 dark:hover:bg-obsidian-700 rounded-lg transition-colors',
        button_next: 'absolute right-1 inline-flex items-center justify-center w-7 h-7 bg-transparent hover:bg-obsidian-100 dark:hover:bg-obsidian-700 rounded-lg transition-colors',
        month_grid: 'w-full border-collapse space-y-1',
        weekdays: 'flex',
        weekday: 'text-obsidian-500 dark:text-obsidian-400 rounded-md w-9 font-normal text-[0.8rem]',
        week: 'flex w-full mt-2',
        day: 'h-9 w-9 text-center text-sm p-0 relative focus-within:relative focus-within:z-20',
        day_button: 'h-9 w-9 p-0 font-normal rounded-lg transition-colors hover:bg-obsidian-100 dark:hover:bg-obsidian-700 text-obsidian-900 dark:text-ivory-100',
        selected: 'bg-gold-500 text-white hover:bg-gold-600 focus:bg-gold-600',
        today: 'bg-obsidian-100 dark:bg-obsidian-700 text-obsidian-900 dark:text-ivory-100',
        outside: 'text-obsidian-400 dark:text-obsidian-500 opacity-50',
        disabled: 'text-obsidian-400 dark:text-obsidian-500 opacity-50 cursor-not-allowed',
        hidden: 'invisible',
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) =>
          orientation === 'left' ? (
            <ChevronLeft className="h-4 w-4 text-obsidian-600 dark:text-obsidian-300" />
          ) : (
            <ChevronRight className="h-4 w-4 text-obsidian-600 dark:text-obsidian-300" />
          ),
      }}
      {...props}
    />
  )
}
