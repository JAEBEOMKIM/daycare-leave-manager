'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { getMonthWeeks } from '@/lib/utils/date-utils'

interface LeaveRecord {
  id: string
  employee_id: string
  leave_type: string
  start_date: string
  end_date: string
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [leaves, setLeaves] = useState<LeaveRecord[]>([])

  const handlePrevMonth = () => {
    const prev = new Date(currentDate)
    prev.setMonth(prev.getMonth() - 1)
    setCurrentDate(prev)
  }

  const handleNextMonth = () => {
    const next = new Date(currentDate)
    next.setMonth(next.getMonth() + 1)
    setCurrentDate(next)
  }

  const handleToday = () => {
    setCurrentDate(new Date())
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
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <h1 className="text-3xl font-semibold text-on-surface">일정</h1>
          <p className="text-body-md text-on-surface-variant mt-1">
            연차 일정을 월별로 확인하세요.
          </p>
        </div>
        <button className="flex items-center justify-center gap-2 px-4 h-11 bg-primary text-on-primary rounded-lg font-medium hover:opacity-90">
          <Plus size={18} />
          연차 추가
        </button>
      </div>

      {/* Calendar */}
      <div className="card">
        {/* Header with Navigation */}
        <div className="p-6 border-b border-border-subtle">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-on-surface">{monthYear}</h2>
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

        {/* Calendar Grid */}
        <div className="p-6">
          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-2 mb-6">
            {dayHeaders.map((day) => (
              <div key={day} className="text-center py-3">
                <p className="text-label-md font-semibold text-on-surface-variant">{day}</p>
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="calendar-grid gap-2">
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
                    className={`aspect-square rounded-lg border-2 transition-all flex flex-col items-center justify-center cursor-pointer group ${
                      isToday
                        ? 'bg-primary border-primary'
                        : hasLeave && isCurrentMonth
                          ? 'bg-error-container border-error'
                          : 'bg-surface-container-low border-transparent hover:border-primary'
                    } ${!isCurrentMonth ? 'opacity-40 cursor-default' : ''}`}
                  >
                    <span
                      className={`text-body-md font-medium ${
                        isToday ? 'text-on-primary' : 'text-on-surface'
                      }`}
                    >
                      {d.getDate()}
                    </span>
                    {hasLeave && isCurrentMonth && (
                      <span className="text-xs text-error font-medium mt-1">休</span>
                    )}
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
              {weeks.flat().filter((d) => leavesByDate.has(d.toISOString().split('T')[0])).length}
            </p>
          </div>
          <div>
            <p className="text-label-sm text-on-surface-variant font-medium">남은 연차</p>
            <p className="text-title-lg font-semibold text-success mt-1">
              {20 -
                weeks
                  .flat()
                  .filter((d) => leavesByDate.has(d.toISOString().split('T')[0])).length}
            </p>
          </div>
          <div>
            <p className="text-label-sm text-on-surface-variant font-medium">예정</p>
            <p className="text-title-lg font-semibold text-primary mt-1">3</p>
          </div>
        </div>
      </div>

      {/* Upcoming Leaves */}
      <div className="card">
        <div className="p-6 border-b border-border-subtle">
          <h2 className="text-title-lg font-semibold text-on-surface">예정된 연차</h2>
        </div>
        <div className="divide-y divide-border-subtle">
          {[
            { employee: '김지은', date: '2024-06-15 ~ 2024-06-17', days: 3, status: 'approved' },
            { employee: '이미영', date: '2024-06-20 ~ 2024-06-20', days: 1, status: 'pending' },
            { employee: '박수현', date: '2024-06-25 ~ 2024-06-28', days: 4, status: 'approved' },
          ].map((leave, idx) => (
            <div key={idx} className="p-6 hover:bg-surface-container-low transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-medium text-on-surface">{leave.employee}</p>
                  <p className="text-body-sm text-on-surface-variant mt-1">{leave.date}</p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-3">
                    <div className="text-center">
                      <p className="text-2xl font-semibold text-on-surface">{leave.days}</p>
                      <p className="text-label-sm text-on-surface-variant">일</p>
                    </div>
                    {leave.status === 'approved' && (
                      <span className="px-3 py-1 bg-success-container text-success rounded-full text-label-sm font-medium">
                        승인
                      </span>
                    )}
                    {leave.status === 'pending' && (
                      <span className="px-3 py-1 bg-warning-container text-warning rounded-full text-label-sm font-medium">
                        대기
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
