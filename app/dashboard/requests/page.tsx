'use client'

import { useState } from 'react'
import { Calendar, Clock, FileText, Send } from 'lucide-react'

export default function RequestLeavePage() {
  const [formData, setFormData] = useState({
    employee: '',
    leaveType: 'annual',
    startDate: '',
    endDate: '',
    reason: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Submit:', formData)
  }

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-semibold text-on-surface">연차 등록</h1>
        <p className="text-body-md text-on-surface-variant mt-1">새로운 연차를 등록하세요.</p>
      </div>

      <div className="max-w-2xl">
        <form onSubmit={handleSubmit} className="card p-8 space-y-6">
          {/* Employee Selection */}
          <div>
            <label className="block text-label-md font-medium text-on-surface mb-2">직원</label>
            <select
              name="employee"
              value={formData.employee}
              onChange={handleChange}
              className="w-full px-4 py-2.5 border border-border-subtle rounded-lg bg-surface"
              required
            >
              <option value="">직원을 선택하세요</option>
              <option value="kim">김지은</option>
              <option value="lee">이미영</option>
              <option value="park">박수현</option>
            </select>
          </div>

          {/* Leave Type */}
          <div>
            <label className="block text-label-md font-medium text-on-surface mb-2">연차 유형</label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: 'annual', label: '연차' },
                { value: 'half', label: '반차' },
                { value: 'sick', label: '병가' },
              ].map(type => (
                <label key={type.value} className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                  formData.leaveType === type.value
                    ? 'bg-primary-container border-primary'
                    : 'bg-surface-container border-border-subtle hover:border-primary'
                }`}>
                  <input
                    type="radio"
                    name="leaveType"
                    value={type.value}
                    checked={formData.leaveType === type.value}
                    onChange={handleChange}
                    className="hidden"
                  />
                  <span className="text-body-sm font-medium text-on-surface">{type.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-label-md font-medium text-on-surface mb-2">시작일</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-on-surface-variant" size={18} />
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 border border-border-subtle rounded-lg bg-surface"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-label-md font-medium text-on-surface mb-2">종료일</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-on-surface-variant" size={18} />
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 border border-border-subtle rounded-lg bg-surface"
                  required
                />
              </div>
            </div>
          </div>

          {/* Duration Display */}
          {formData.startDate && formData.endDate && (
            <div className="p-4 bg-surface-container-low border border-border-subtle rounded-lg">
              <p className="text-body-sm text-on-surface">
                <span className="font-medium">등록 기간:</span> {formData.startDate} ~ {formData.endDate}
              </p>
            </div>
          )}

          {/* Reason */}
          <div>
            <label className="block text-label-md font-medium text-on-surface mb-2">사유</label>
            <textarea
              name="reason"
              value={formData.reason}
              onChange={handleChange}
              placeholder="연차 사용 사유를 입력하세요."
              rows={4}
              className="w-full px-4 py-2.5 border border-border-subtle rounded-lg bg-surface"
            />
          </div>

          {/* Submit Button */}
          <div className="flex gap-3 pt-6">
            <button
              type="submit"
              className="flex-1 flex items-center justify-center gap-2 px-4 h-11 bg-primary text-on-primary rounded-lg font-medium hover:opacity-90"
            >
              <Send size={18} />
              등록하기
            </button>
            <button
              type="button"
              className="flex-1 px-4 h-11 border border-border-subtle text-on-surface rounded-lg font-medium hover:bg-surface-container"
            >
              취소
            </button>
          </div>
        </form>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card p-6">
          <div className="flex gap-3">
            <Clock className="text-primary flex-shrink-0" size={20} />
            <div>
              <h3 className="font-medium text-on-surface">등록 기한</h3>
              <p className="text-body-sm text-on-surface-variant mt-1">
                연차는 사용 예정일 1주일 전에 등록해주세요.
              </p>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex gap-3">
            <FileText className="text-primary flex-shrink-0" size={20} />
            <div>
              <h3 className="font-medium text-on-surface">첨부 자료</h3>
              <p className="text-body-sm text-on-surface-variant mt-1">
                필요시 증명 서류를 첨부할 수 있습니다.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Requests */}
      <div className="card">
        <div className="p-6 border-b border-border-subtle">
          <h2 className="text-title-lg font-semibold text-on-surface">최근 등록</h2>
        </div>
        <div className="divide-y divide-border-subtle">
          {[
            { date: '2024-06-10', employee: '김지은', period: '6/15 ~ 6/17', status: 'approved' },
            { date: '2024-06-08', employee: '이미영', period: '6/20', status: 'pending' },
            { date: '2024-06-05', employee: '박수현', period: '6/25 ~ 6/28', status: 'approved' },
          ].map((req, idx) => (
            <div key={idx} className="p-6 hover:bg-surface-container-low transition-colors flex items-center justify-between">
              <div>
                <p className="font-medium text-on-surface">{req.employee}</p>
                <p className="text-body-sm text-on-surface-variant mt-1">{req.period}</p>
              </div>
              <div className="text-right">
                <p className="text-label-sm text-on-surface-variant mb-2">{req.date}</p>
                {req.status === 'approved' && (
                  <span className="px-3 py-1 bg-success-container text-success rounded-full text-label-sm font-medium">승인</span>
                )}
                {req.status === 'pending' && (
                  <span className="px-3 py-1 bg-warning-container text-warning rounded-full text-label-sm font-medium">대기</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
