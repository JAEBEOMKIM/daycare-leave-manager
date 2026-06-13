'use client'

import { useState } from 'react'
import { Search, Plus, MoreVertical, Edit2, Trash2 } from 'lucide-react'

interface Employee {
  id: string
  name: string
  position: string
  email: string
  joinDate: string
  leaveDays: { used: number; total: number }
  status: 'active' | 'inactive'
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([
    {
      id: '1',
      name: '김지은',
      position: '보육교사',
      email: 'kim@example.com',
      joinDate: '2022-03-15',
      leaveDays: { used: 8, total: 20 },
      status: 'active',
    },
    {
      id: '2',
      name: '이미영',
      position: '보육교사',
      email: 'lee@example.com',
      joinDate: '2021-09-01',
      leaveDays: { used: 6, total: 20 },
      status: 'active',
    },
    {
      id: '3',
      name: '박수현',
      position: '원장',
      email: 'park@example.com',
      joinDate: '2020-01-01',
      leaveDays: { used: 5, total: 20 },
      status: 'active',
    },
  ])

  const [searchTerm, setSearchTerm] = useState('')
  const [openMenu, setOpenMenu] = useState<string | null>(null)

  const filteredEmployees = employees.filter(
    (emp) =>
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.position.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <h1 className="text-3xl font-semibold text-on-surface">직원 관리</h1>
          <p className="text-body-md text-on-surface-variant mt-1">직원 정보와 연차 현황을 관리하세요.</p>
        </div>
        <button className="flex items-center justify-center gap-2 px-4 h-11 bg-primary text-on-primary rounded-lg font-medium hover:opacity-90">
          <Plus size={18} />
          직원 추가
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-on-surface-variant" size={18} />
          <input
            type="text"
            placeholder="이름, 직급 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-border-subtle rounded-lg bg-surface"
          />
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="divide-y divide-border-subtle">
          {filteredEmployees.map((employee) => (
            <div key={employee.id} className="p-6 hover:bg-surface-container-low transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="font-medium text-on-surface">{employee.name}</p>
                  <p className="text-label-sm text-on-surface-variant mt-1">{employee.position}</p>
                  <p className="text-body-sm text-on-surface-variant mt-2">{employee.email}</p>
                </div>
                <button
                  onClick={() => setOpenMenu(openMenu === employee.id ? null : employee.id)}
                  className="p-2 hover:bg-surface-container rounded-lg transition-colors"
                >
                  <MoreVertical size={18} className="text-on-surface-variant" />
                </button>
              </div>
              <div className="mt-4">
                <div className="flex justify-between mb-2">
                  <span className="text-label-sm text-on-surface-variant">연차</span>
                  <span className="text-label-sm font-medium text-on-surface">{employee.leaveDays.used}/{employee.leaveDays.total}</span>
                </div>
                <div className="w-full bg-surface-container rounded-full h-2">
                  <div className="bg-primary h-2 rounded-full" style={{width: `${(employee.leaveDays.used / employee.leaveDays.total) * 100}%`}} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
