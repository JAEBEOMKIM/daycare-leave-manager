'use client'

import { useState, useEffect } from 'react'
import { StatCard } from '@/components/ui/StatCard'
import { GlassCard } from '@/components/ui/GlassCard'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { TrendingUp, PieChart as PieChartIcon, BarChart3 } from 'lucide-react'

const employeeData = [
  { name: '김지영', used: 17, available: 3 },
  { name: '박서준', used: 12, available: 8 },
  { name: '이민지', used: 9, available: 11 },
  { name: '최유진', used: 6, available: 14 },
]

const monthlyData = [
  { month: '1월', used: 12 },
  { month: '2월', used: 8 },
  { month: '3월', used: 15 },
  { month: '4월', used: 10 },
  { month: '5월', used: 14 },
  { month: '6월', used: 11 },
]

const leaveTypeData = [
  { name: '연차', value: 28 },
  { name: '반차', value: 12 },
  { name: '병가', value: 5 },
  { name: '경조사', value: 3 },
]

const COLORS = ['#dfe1ff', '#2dd4bf', '#a855f7', '#ffb4ab']

export default function StatisticsPage() {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // TODO: Fetch statistics data from API
    setLoading(false)
  }, [])

  if (loading) {
    return <div className="animate-pulse">로딩 중...</div>
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-hanken text-headline-lg text-on-surface">원 기준 연차 통계</h1>
        <p className="font-inter text-body-md text-on-surface-variant mt-2">
          전체 연차 사용 현황을 한눈에 확인하세요.
        </p>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-gutter">
        <StatCard
          icon={<TrendingUp size={24} />}
          label="원 전체 사용 현황"
          value="345 / 500"
          subtext="총 69% 소진"
        />
        <StatCard
          icon={<BarChart3 size={24} />}
          label="이번 달 최다 사용"
          value="오전반차"
          subtext="전월 대비 +12%"
        />
        <StatCard
          icon={<PieChartIcon size={24} />}
          label="결재 대기 건수"
          value="5건"
          subtext="다음 주 기준"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
        {/* Employee Bar Chart */}
        <GlassCard className="lg:col-span-2">
          <h2 className="font-hanken text-headline-md text-on-surface mb-6">
            선생님별 휴가 사용량 비교
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={employeeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
              <XAxis dataKey="name" stroke="var(--on-surface-variant)" />
              <YAxis stroke="var(--on-surface-variant)" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--surface-container)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  color: 'var(--on-surface)',
                }}
              />
              <Legend />
              <Bar dataKey="used" fill="var(--primary)" name="사용일" />
              <Bar dataKey="available" fill="var(--data-teal)" name="잔여일" />
            </BarChart>
          </ResponsiveContainer>
        </GlassCard>

        {/* Leave Type Pie Chart */}
        <GlassCard>
          <h2 className="font-hanken text-headline-md text-on-surface mb-6">
            휴가 종류별 비율
          </h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={leaveTypeData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {leaveTypeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--surface-container)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  color: 'var(--on-surface)',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </GlassCard>
      </div>

      {/* Monthly Trend */}
      <GlassCard>
        <h2 className="font-hanken text-headline-md text-on-surface mb-6">
          월별 휴가 사용량 추이
        </h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
            <XAxis dataKey="month" stroke="var(--on-surface-variant)" />
            <YAxis stroke="var(--on-surface-variant)" />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--surface-container)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                color: 'var(--on-surface)',
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="used"
              stroke="var(--primary)"
              dot={{ fill: 'var(--primary)' }}
              name="사용일"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </GlassCard>

      {/* Employee Table */}
      <GlassCard>
        <h2 className="font-hanken text-headline-md text-on-surface mb-6">
          직원별 연차 현황
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-subtle">
                <th className="text-left py-3 px-4 font-inter text-label-md text-on-surface-variant">
                  이름
                </th>
                <th className="text-left py-3 px-4 font-inter text-label-md text-on-surface-variant">
                  직급
                </th>
                <th className="text-right py-3 px-4 font-inter text-label-md text-on-surface-variant">
                  총연차
                </th>
                <th className="text-right py-3 px-4 font-inter text-label-md text-on-surface-variant">
                  사용
                </th>
                <th className="text-right py-3 px-4 font-inter text-label-md text-on-surface-variant">
                  잔여
                </th>
              </tr>
            </thead>
            <tbody>
              {employeeData.map((emp) => (
                <tr
                  key={emp.name}
                  className="border-b border-border-subtle hover:bg-surface-container/50 transition-colors"
                >
                  <td className="py-3 px-4 font-inter text-body-sm text-on-surface">
                    {emp.name}
                  </td>
                  <td className="py-3 px-4 font-inter text-body-sm text-on-surface-variant">
                    교사
                  </td>
                  <td className="py-3 px-4 font-inter text-body-sm text-on-surface text-right">
                    20
                  </td>
                  <td className="py-3 px-4 font-inter text-body-sm text-on-surface text-right font-bold">
                    {emp.used}
                  </td>
                  <td className="py-3 px-4 font-inter text-body-sm text-primary text-right font-bold">
                    {emp.available}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  )
}
