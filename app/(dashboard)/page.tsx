'use client'

import { useState, useEffect } from 'react'
import { StatCard } from '@/components/ui/StatCard'
import { GlassCard } from '@/components/ui/GlassCard'
import { WeeklyCalendar } from '@/components/dashboard/WeeklyCalendar'
import { MonthlyCalendar } from '@/components/dashboard/MonthlyCalendar'
import { Calendar, Users, TrendingUp, Loader } from 'lucide-react'

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

export default function Dashboard() {
  const [loading, setLoading] = useState(true)
  const [leaves, setLeaves] = useState<LeaveRecord[]>([])
  const [employees, setEmployees] = useState<Map<string, Employee>>(new Map())
  const [currentMonth, setCurrentMonth] = useState(new Date())

  useEffect(() => {
    // TODO: Fetch data from API
    setLoading(false)
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader className="animate-spin text-primary" size={32} />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-hanken text-headline-lg text-on-surface">대시보드</h1>
        <p className="font-inter text-body-md text-on-surface-variant mt-2">
          오늘의 보육 인력 현황을 확인하세요.
        </p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-gutter">
        <StatCard
          icon={<Calendar size={24} />}
          label="이번 달 사용"
          value="12일"
          subtext="총 20일 중"
        />
        <StatCard
          icon={<Users size={24} />}
          label="재직자"
          value="8명"
          subtext="모두 활동 중"
        />
        <StatCard
          icon={<TrendingUp size={24} />}
          label="전월 대비"
          value="+20%"
          subtext="휴가 사용"
        />
      </div>

      {/* Calendar & Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
        <div className="lg:col-span-2">
          <WeeklyCalendar date={new Date()} leaves={leaves} employees={employees} />
        </div>
        <GlassCard>
          <h2 className="font-hanken text-headline-md text-on-surface mb-4">
            빠른 메뉴
          </h2>
          <div className="space-y-2">
            <a
              href="/dashboard/leave/register"
              className="block w-full p-3 bg-primary/20 text-primary rounded-lg text-center font-inter text-body-sm hover:bg-primary/30 transition-colors"
            >
              연차 등록
            </a>
            <a
              href="/dashboard/statistics"
              className="block w-full p-3 bg-data-teal/20 text-data-teal rounded-lg text-center font-inter text-body-sm hover:bg-data-teal/30 transition-colors"
            >
              통계 보기
            </a>
            <a
              href="/dashboard/employees"
              className="block w-full p-3 bg-data-purple/20 text-data-purple rounded-lg text-center font-inter text-body-sm hover:bg-data-purple/30 transition-colors"
            >
              직원 관리
            </a>
          </div>
        </GlassCard>
      </div>

      {/* Monthly Calendar */}
      <MonthlyCalendar
        date={currentMonth}
        leaves={leaves}
        onDateChange={setCurrentMonth}
      />
    </div>
  )
}
