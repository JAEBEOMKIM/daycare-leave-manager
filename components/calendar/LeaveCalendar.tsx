'use client'

import { useState, useMemo, useCallback } from 'react'
import { mockLeaveHistory, mockStaff } from '@/lib/mock-data'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react'

interface LeaveEvent {
  staffId: string
  staffName: string
  leaveType: string
  startDate: string
  endDate: string
  daysUsed: number
}

const LEAVE_TYPES = [
  { type: '종일휴가', color: 'bg-primary-container text-primary' },
  { type: '오전반차', color: 'bg-success-container text-success' },
  { type: '오후반차', color: 'bg-warning-container text-warning' },
  { type: '병가', color: 'bg-error-container text-error' },
  { type: '경조사', color: 'bg-primary-container text-primary' },
  { type: '지각', color: 'bg-warning-container text-warning' },
] as const

export function LeaveCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 5, 1))
  const [selectedFilter, setSelectedFilter] = useState<string | null>(null)

  const handlePrevMonth = useCallback(() => {
    setCurrentDate(
      (prev) =>
        new Date(prev.getFullYear(), prev.getMonth() - 1, 1)
    )
  }, [])

  const handleNextMonth = useCallback(() => {
    setCurrentDate(
      (prev) =>
        new Date(prev.getFullYear(), prev.getMonth() + 1, 1)
    )
  }, [])

  const getEventsForDate = useCallback(
    (dateStr: string): LeaveEvent[] => {
      let events = mockLeaveHistory
        .filter((leave) => {
          const start = new Date(leave.start_date)
          const end = new Date(leave.end_date)
          const current = new Date(dateStr)
          return current >= start && current <= end
        })
        .map((leave) => {
          const staff = mockStaff.find((s) => s.id === leave.staff_id)
          return {
            staffId: leave.staff_id,
            staffName: staff?.name || '미상',
            leaveType: leave.leave_type,
            startDate: leave.start_date,
            endDate: leave.end_date,
            daysUsed: leave.days_used,
          }
        })

      if (selectedFilter) {
        events = events.filter((e) => e.leaveType === selectedFilter)
      }

      return events
    },
    [selectedFilter]
  )

  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const firstDay = new Date(year, month, 1).getDay()

    const days: (string | null)[] = Array.from<string | null>({ length: firstDay }).fill(null)
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`
      days.push(dateStr)
    }
    return days
  }, [currentDate])

  const monthName = useMemo(
    () =>
      currentDate.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
      }),
    [currentDate]
  )

  const getLeaveTypeColor = (leaveType: string): string => {
    const found = LEAVE_TYPES.find((t) => t.type === leaveType)
    return found?.color || 'bg-surface-container text-on-surface-variant'
  }

  const totalLeaveCount = useMemo(
    () =>
      mockLeaveHistory.filter((leave) =>
        selectedFilter ? leave.leave_type === selectedFilter : true
      ).length,
    [selectedFilter]
  )

  return (
    <div className="space-y-6">
      {/* 캘린더 카드 */}
      <Card>
        <div className="border-b border-border-subtle p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-title-md font-semibold text-on-surface">
              월간 휴가 현황
            </h2>
            <div className="flex items-center gap-3">
              <button
                onClick={handlePrevMonth}
                aria-label="Previous month"
                className="p-2 rounded-lg border border-border-subtle text-on-surface hover:bg-surface-container transition-colors"
              >
                <ChevronLeft size={20} />
              </button>
              <span className="text-label-md font-semibold text-on-surface min-w-40 text-center">
                {monthName}
              </span>
              <button
                onClick={handleNextMonth}
                aria-label="Next month"
                className="p-2 rounded-lg border border-border-subtle text-on-surface hover:bg-surface-container transition-colors"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* 요일 헤더 */}
          <div className="grid grid-cols-7 gap-1 mb-3">
            {['일', '월', '화', '수', '목', '금', '토'].map((day) => (
              <div
                key={day}
                className="text-center text-label-sm font-semibold text-on-surface-variant p-2"
              >
                {day}
              </div>
            ))}
          </div>

          {/* 달력 그리드 */}
          <div className="grid grid-cols-7 gap-1 mb-8">
            {calendarDays.map((dateStr, idx) => {
              if (!dateStr) {
                return <div key={`empty-${idx}`} className="aspect-square" />
              }

              const events = getEventsForDate(dateStr)
              const day = parseInt(dateStr.split('-')[2])
              const isToday = new Date().toDateString() === new Date(dateStr).toDateString()

              return (
                <div
                  key={dateStr}
                  className={`aspect-square rounded-lg border p-2 transition-colors ${
                    isToday
                      ? 'border-primary bg-primary-container-low'
                      : 'border-border-subtle bg-surface-container-low hover:bg-surface-container'
                  }`}
                >
                  <div className={`text-label-sm font-semibold mb-1 ${
                    isToday ? 'text-primary' : 'text-on-surface'
                  }`}>
                    {day}
                  </div>
                  <div className="space-y-1">
                    {events.slice(0, 2).map((event) => (
                      <div
                        key={`${event.staffId}-${dateStr}`}
                        className={`text-xs px-2 py-0.5 rounded truncate font-medium ${getLeaveTypeColor(
                          event.leaveType
                        )}`}
                        title={`${event.staffName} - ${event.leaveType}`}
                      >
                        {event.staffName}
                      </div>
                    ))}
                    {events.length > 2 && (
                      <div className="text-xs text-on-surface-variant px-2">
                        +{events.length - 2}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* 범례 */}
          <div className="pt-4 border-t border-border-subtle">
            <p className="text-label-md font-medium text-on-surface mb-4">
              휴가 유형 필터
            </p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {LEAVE_TYPES.map((item) => (
                <button
                  key={item.type}
                  onClick={() =>
                    setSelectedFilter(
                      selectedFilter === item.type ? null : item.type
                    )
                  }
                  className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-colors ${
                    selectedFilter === item.type
                      ? 'border-primary bg-primary-container-low'
                      : 'border-border-subtle bg-surface-container-low hover:border-outline'
                  }`}
                >
                  {selectedFilter === item.type && (
                    <CheckCircle2 size={16} className="text-primary" />
                  )}
                  <span className={`text-label-sm ${item.color}`}>
                    {item.type}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* 우측 정보 패널 */}
      <Card>
        <div className="p-6">
          <div className="mb-6">
            <p className="text-label-md text-on-surface-variant mb-2">
              {selectedFilter ? `${selectedFilter} 현황` : '전체 휴가 현황'}
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-display-lg font-bold text-primary">
                {totalLeaveCount}
              </span>
              <span className="text-label-md text-on-surface-variant">
                건
              </span>
            </div>
          </div>

          <div className="space-y-3 border-t border-border-subtle pt-6">
            <h3 className="text-title-sm font-semibold text-on-surface">
              직원별 휴가 현황
            </h3>
            <div className="space-y-2">
              {mockStaff.map((staff) => {
                const leaveCount = mockLeaveHistory.filter(
                  (leave) =>
                    leave.staff_id === staff.id &&
                    (!selectedFilter || leave.leave_type === selectedFilter)
                ).length
                const totalDays = mockLeaveHistory
                  .filter(
                    (leave) =>
                      leave.staff_id === staff.id &&
                      (!selectedFilter || leave.leave_type === selectedFilter)
                  )
                  .reduce((sum, leave) => sum + leave.days_used, 0)

                return (
                  <div
                    key={staff.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-surface-container-low"
                  >
                    <div>
                      <p className="text-label-md font-medium text-on-surface">
                        {staff.name}
                      </p>
                      <p className="text-label-sm text-on-surface-variant">
                        {leaveCount}건 · {totalDays}일
                      </p>
                    </div>
                    {leaveCount > 0 && (
                      <Badge variant="success">{leaveCount}</Badge>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
