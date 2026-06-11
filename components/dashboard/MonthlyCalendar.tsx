'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { getMonthWeeks, getKoreanDayName } from '@/lib/utils/date-utils'

interface LeaveRecord {
  id: string
  employee_id: string
  leave_type: string
  start_date: string
  end_date: string
}

interface MonthlyCalendarProps {
  date: Date
  leaves: LeaveRecord[]
  onDateChange?: (date: Date) => void
}

export function MonthlyCalendar({ date, leaves, onDateChange }: MonthlyCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date(date))

  const handlePrevMonth = () => {
    const prev = new Date(currentDate)
    prev.setMonth(prev.getMonth() - 1)
    setCurrentDate(prev)
    onDateChange?.(prev)
  }

  const handleNextMonth = () => {
    const next = new Date(currentDate)
    next.setMonth(next.getMonth() + 1)
    setCurrentDate(next)
    onDateChange?.(next)
  }

  const weeks = getMonthWeeks(currentDate)

  // 날짜별 leave 여부
  const leavesByDate = new Set<string>()
  leaves.forEach((leave) => {
    const start = new Date(leave.start_date)
    const end = new Date(leave.end_date)

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      leavesByDate.add(d.toISOString().split('T')[0])
    }
  })

  const monthYear = `${currentDate.getFullYear()}년 ${currentDate.getMonth() + 1}월`
  const currentMonth = currentDate.getMonth()

  const dayHeaders = ['월', '화', '수', '목', '금', '토', '일']

  return (
    <div className="glass-card rounded-xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-hanken text-headline-md text-on-surface">{monthYear}</h2>
        <div className="flex gap-2">
          <button
            onClick={handlePrevMonth}
            className="p-2 hover:bg-surface-variant/50 rounded-lg transition-colors"
          >
            <ChevronLeft size={20} className="text-on-surface-variant" />
          </button>
          <button
            onClick={handleNextMonth}
            className="p-2 hover:bg-surface-variant/50 rounded-lg transition-colors"
          >
            <ChevronRight size={20} className="text-on-surface-variant" />
          </button>
        </div>
      </div>

      {/* Day Headers */}
      <div className="grid grid-cols-7 gap-px mb-2">
        {dayHeaders.map((day) => (
          <div
            key={day}
            className="text-center py-2 font-inter text-label-md text-on-surface-variant"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-px">
        {weeks.flatMap((week) =>
          week.map((d) => {
            const dateKey = d.toISOString().split('T')[0]
            const hasLeave = leavesByDate.has(dateKey)
            const isCurrentMonth = d.getMonth() === currentMonth

            return (
              <div
                key={dateKey}
                className={`aspect-square p-2 rounded-lg flex flex-col items-center justify-center relative transition-colors ${
                  !isCurrentMonth
                    ? 'bg-surface-container/30 text-on-surface-variant/50'
                    : hasLeave
                      ? 'bg-primary/20 border border-primary'
                      : 'bg-surface-container'
                }`}
              >
                <span className="font-inter text-body-sm">{d.getDate()}</span>
                {hasLeave && (
                  <span className="absolute bottom-1 w-1 h-1 bg-primary rounded-full"></span>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
