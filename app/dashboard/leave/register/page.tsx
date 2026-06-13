'use client'

import { useState } from 'react'
import { Calendar, Clock, FileText } from 'lucide-react'
import { GlassCard } from '@/components/ui/GlassCard'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'

const leaveTypes = [
  { value: 'annual', label: '연차' },
  { value: 'morning_half', label: '오전반차' },
  { value: 'afternoon_half', label: '오후반차' },
  { value: 'sick', label: '병가' },
  { value: 'family', label: '경조사' },
  { value: 'maternity', label: '출산휴가' },
  { value: 'childcare', label: '돌봄휴가' },
  { value: 'unpaid', label: '무급휴가' },
]

export default function LeaveRegisterPage() {
  const [formData, setFormData] = useState({
    leave_type: 'annual',
    start_date: '',
    end_date: '',
    reason: '',
    is_half_day: false,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.start_date) newErrors.start_date = '시작일을 선택하세요'
    if (!formData.end_date) newErrors.end_date = '종료일을 선택하세요'
    if (formData.start_date && formData.end_date) {
      const start = new Date(formData.start_date)
      const end = new Date(formData.end_date)
      if (start > end) {
        newErrors.end_date = '종료일이 시작일보다 뒤여야 합니다'
      }
    }
    if (!formData.reason.trim()) newErrors.reason = '등록 사유를 입력하세요'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    try {
      // TODO: 현재 사용자의 employee_id와 facility_id 조회 필요
      // 임시로는 환경 설정 후 구현
      const response = await fetch('/api/leave-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee_id: 'temp-id', // TODO: 실제 employee_id로 변경
          facility_id: 'temp-id', // TODO: 실제 facility_id로 변경
          leave_type: formData.leave_type,
          start_date: formData.start_date,
          end_date: formData.end_date,
          reason: formData.reason,
        }),
      })

      if (response.ok) {
        setSubmitted(true)
        setTimeout(() => {
          setSubmitted(false)
          setFormData({
            leave_type: 'annual',
            start_date: '',
            end_date: '',
            reason: '',
            is_half_day: false,
          })
        }, 3000)
      }
    } catch (error) {
      console.error('Failed to submit leave request:', error)
    }
  }

  const isHalfDay = formData.leave_type === 'morning_half' || formData.leave_type === 'afternoon_half'

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-hanken text-headline-lg text-on-surface">연차 등록</h1>
        <p className="font-inter text-body-md text-on-surface-variant mt-2">
          새로운 휴가를 등록하세요.
        </p>
      </div>

      {/* Success Message */}
      {submitted && (
        <div className="p-4 bg-data-teal/20 border border-data-teal rounded-lg">
          <p className="font-inter text-body-sm text-data-teal font-semibold">
            ✓ 연차 등록이 완료되었습니다.
          </p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
        {/* Main Form */}
        <GlassCard className="lg:col-span-2 space-y-6">
          <div>
            <h2 className="font-hanken text-headline-md text-on-surface mb-6">
              기본 정보
            </h2>

            <div className="space-y-4">
              <Select
                label="휴가 종류"
                options={leaveTypes}
                value={formData.leave_type}
                onChange={(e) => setFormData({ ...formData, leave_type: e.target.value })}
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="시작일"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  error={errors.start_date}
                  icon={<Calendar size={20} />}
                />
                <Input
                  label="종료일"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  error={errors.end_date}
                  icon={<Calendar size={20} />}
                />
              </div>

              {isHalfDay && (
                <div className="flex items-center gap-3 p-3 bg-data-teal/10 rounded-lg">
                  <input
                    type="checkbox"
                    id="is_half_day"
                    checked={formData.is_half_day}
                    onChange={(e) => setFormData({ ...formData, is_half_day: e.target.checked })}
                    className="w-4 h-4 rounded"
                  />
                  <label htmlFor="is_half_day" className="font-inter text-body-sm text-on-surface-variant">
                    같은 날짜에 오전/오후 반차를 모두 사용하시나요?
                  </label>
                </div>
              )}

              <div>
                <label className="block font-inter text-label-md text-on-surface mb-2">
                  등록 사유
                </label>
                <textarea
                  placeholder="휴가 사유를 입력하세요 (선택사항)"
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  className="w-full px-4 py-3 bg-surface-container border border-border-subtle rounded-lg font-inter text-body-sm text-on-surface placeholder-on-surface-variant focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-none h-24"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-3 bg-primary text-on-primary rounded-lg font-inter text-label-md font-bold btn-glow hover:bg-primary/90 transition-colors"
          >
            연차 등록
          </button>
        </GlassCard>

        {/* Summary */}
        <GlassCard>
          <h2 className="font-hanken text-headline-md text-on-surface mb-6">
            등록 요약
          </h2>

          <div className="space-y-4">
            <div className="space-y-2">
              <p className="font-inter text-label-sm text-on-surface-variant">휴가 종류</p>
              <p className="font-inter text-body-md text-on-surface font-semibold">
                {leaveTypes.find((t) => t.value === formData.leave_type)?.label}
              </p>
            </div>

            {formData.start_date && (
              <div className="space-y-2">
                <p className="font-inter text-label-sm text-on-surface-variant">기간</p>
                <div className="flex items-center gap-2 font-inter text-body-md text-on-surface">
                  <Calendar size={16} />
                  <span>
                    {new Date(formData.start_date).toLocaleDateString('ko-KR')} ~{' '}
                    {formData.end_date ? new Date(formData.end_date).toLocaleDateString('ko-KR') : '미정'}
                  </span>
                </div>
              </div>
            )}

            {formData.start_date && formData.end_date && (
              <div className="space-y-2">
                <p className="font-inter text-label-sm text-on-surface-variant">소진 예정</p>
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-data-teal" />
                  <span className="font-inter text-headline-md text-data-teal font-bold">
                    {(() => {
                      const start = new Date(formData.start_date)
                      const end = new Date(formData.end_date)
                      const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
                      return isHalfDay ? `${days * 0.5}일` : `${days}일`
                    })()}
                  </span>
                </div>
              </div>
            )}

            <div className="h-px w-full bg-border-subtle my-4"></div>

            <p className="font-inter text-label-sm text-on-surface-variant">
              <FileText size={16} className="inline mr-2" />
              현재 잔여: 8일
            </p>
          </div>
        </GlassCard>
      </form>
    </div>
  )
}
