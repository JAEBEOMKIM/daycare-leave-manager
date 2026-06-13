'use client'

import { getWeekDays, getKoreanDayName, isToday } from '@/lib/utils/date-utils'
import { Badge } from '@/components/ui/Badge'

interface LeaveRecord {
  id: string
  employee_id: string
  leave_type: string
  start_date: string
  end_date: string
}

interface Employee {
  id: string
  name: string
}

interface WeeklyCalendarProps {
  date: Date
  leaves: LeaveRecord[]
  employees: Map<string, Employee>
}

export function WeeklyCalendar({ date, leaves, employees }: WeeklyCalendarProps) {
  const { dates } = getWeekDays(date)

  // 직원별 leave 맵핑
  const leavesByDate = new Map<string, Array<{ employee: string; type: string }>>()

  leaves.forEach((leave) => {
    const start = new Date(leave.start_date)
    const end = new Date(leave.end_date)

    for (let d = new Date(start); d <= end; ) {
      const dateKey = d.toISOString().split('T')[0]
      const employee = employees.get(leave.employee_id)

      if (!leavesByDate.has(dateKey)) {
        leavesByDate.set(dateKey, [])
      }

      leavesByDate.get(dateKey)!.push({
        employee: employee?.name || 'Unknown',
        type: leave.leave_type,
      })

      d.setDate(d.getDate() + 1)
    }
  })

  return (
    <div className="glass-card rounded-xl p-6">
      <h2 className="font-hanken text-headline-md text-on-surface mb-6">
        이번주 연차 현황
      </h2>

      <div className="grid grid-cols-5 md:grid-cols-7 gap-2">
        {dates.map((d, idx) => {
          if (idx >= 5) return null // 월~금만 표시

          const dateKey = d.toISOString().split('T')[0]
          const dayLeaves = leavesByDate.get(dateKey) || []
          const today = isToday(d)

          return (
            <div
              key={dateKey}
              className={`p-4 rounded-lg border transition-colors ${
                today
                  ? 'bg-primary/10 border-primary'
                  : 'bg-surface-container border-border-subtle'
              }`}
            >
              <div className="mb-3">
                <p className="font-inter text-label-md text-on-surface-variant">
                  {d.getDate()}
                </p>
                <p className="font-inter text-body-sm text-on-surface-variant">
                  {getKoreanDayName(d)}
                </p>
              </div>

              <div className="space-y-1 min-h-[60px]">
                {dayLeaves.length > 0 ? (
                  dayLeaves.map((leave, i) => (
                    <div key={i} className="text-xs">
                      <p className="font-inter text-on-surface truncate">
                        {leave.employee}
                      </p>
                      <Badge variant="primary" className="text-xs">
                        {leave.type}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <p className="font-inter text-body-sm text-on-surface-variant opacity-50">
                    —
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
