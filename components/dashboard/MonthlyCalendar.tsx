'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { getMonthWeeks } from '@/lib/utils/date-utils'

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

  const handleToday = () => {
    const today = new Date()
    setCurrentDate(today)
    onDateChange?.(today)
  }

  const weeks = getMonthWeeks(currentDate)

  const leavesByDate = new Set<string>()
  leaves.forEach((leave) => {
    const start = new Date(leave.start_date)
    const end = new Date(leave.end_date)
    for (let d = new Date(start); d <= end; ) {
      leavesByDate.add(d.toISOString().split('T')[0])
      d.setDate(d.getDate() + 1)
    }
  })

  const monthYear = `${currentDate.getFullYear()}년 ${currentDate.getMonth() + 1}월`
  const currentMonth = currentDate.getMonth()
  const today = new Date()
  const dayHeaders = ['일', '월', '화', '수', '목', '금', '토']

  return (
    <div className="card overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-border-subtle">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-title-lg font-semibold text-on-surface">{monthYear}</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleToday}
              className="px-3 py-2 text-label-md font-medium text-primary hover:bg-primary-container rounded-lg transition-colors"
            >
              오늘
            </button>
            <div className="flex items-center gap-1 bg-surface-container rounded-lg p-1">
              <button
                onClick={handlePrevMonth}
                className="p-2 hover:bg-surface-container-high rounded-md transition-colors"
              >
                <ChevronLeft size={18} className="text-on-surface" />
              </button>
              <button
                onClick={handleNextMonth}
                className="p-2 hover:bg-surface-container-high rounded-md transition-colors"
              >
                <ChevronRight size={18} className="text-on-surface" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Calendar Content */}
      <div className="p-6">
        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-3 mb-6">
          {dayHeaders.map((day) => (
            <div key={day} className="text-center py-2">
              <p className="text-label-md font-semibold text-on-surface-variant">{day}</p>
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="calendar-grid">
          {weeks.flatMap((week) =>
            week.map((d) => {
              const dateKey = d.toISOString().split('T')[0]
              const hasLeave = leavesByDate.has(dateKey)
              const isCurrentMonth = d.getMonth() === currentMonth
              const isToday =
                d.getDate() === today.getDate() &&
                d.getMonth() === today.getMonth() &&
                d.getFullYear() === today.getFullYear()

              return (
                <div
                  key={dateKey}
                  className={`calendar-day ${isToday ? 'today' : ''} ${
                    !isCurrentMonth ? 'other-month' : ''
                  } ${hasLeave && isCurrentMonth ? 'has-leave' : ''}`}
                >
                  <div className="text-center w-full h-full flex flex-col items-center justify-center">
                    <span className="text-body-md font-medium">{d.getDate()}</span>
                    {hasLeave && isCurrentMonth && (
                      <div className="mt-1 flex justify-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Footer Stats */}
      <div className="px-6 py-4 bg-surface-container-low border-t border-border-subtle grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-label-sm text-on-surface-variant font-medium">사용 중</p>
          <p className="text-title-lg font-semibold text-on-surface mt-1">
            {weeks.flat().filter(d => leavesByDate.has(d.toISOString().split('T')[0])).length}일
          </p>
        </div>
        <div>
          <p className="text-label-sm text-on-surface-variant font-medium">남은 연차</p>
          <p className="text-title-lg font-semibold text-success mt-1">
            {20 - weeks.flat().filter(d => leavesByDate.has(d.toISOString().split('T')[0])).length}일
          </p>
        </div>
        <div>
          <p className="text-label-sm text-on-surface-variant font-medium">예정</p>
          <p className="text-title-lg font-semibold text-primary mt-1">3일</p>
        </div>
      </div>
    </div>
  )
}
