'use client'

import { useState, useEffect } from 'react'
import { Save, Sun, Moon } from 'lucide-react'
import { useTheme } from 'next-themes'
import { GlassCard } from '@/components/ui/GlassCard'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    facility_name: '',
    facility_address: '',
    director_name: '',
    contact_email: '',
    contact_phone: '',
    fiscal_year_start: '3',
    annual_days_base: '20',
    annual_days_threshold: '6',
  })

  // 설정 로드
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/settings')
        if (response.ok) {
          const data = await response.json()
          setFormData({
            facility_name: data.name || '',
            facility_address: data.address || '',
            director_name: data.director_name || '',
            contact_email: data.contact_email || '',
            contact_phone: data.contact_phone || '',
            fiscal_year_start: data.fiscal_year_start?.toString() || '3',
            annual_days_base: data.annual_days_base?.toString() || '20',
            annual_days_threshold: '6',
          })
        }
      } catch (error) {
        console.error('Failed to fetch settings:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchSettings()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.facility_name,
          address: formData.facility_address,
          contact_email: formData.contact_email,
          contact_phone: formData.contact_phone,
          fiscal_year_start: parseInt(formData.fiscal_year_start),
          annual_days_base: parseInt(formData.annual_days_base),
        }),
      })

      if (response.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      }
    } catch (error) {
      console.error('Failed to save settings:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="font-inter text-body-md text-on-surface">로딩 중...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-hanken text-headline-lg text-on-surface">설정</h1>
        <p className="font-inter text-body-md text-on-surface-variant mt-2">
          어린이집 정보 및 연차 정책을 관리하세요.
        </p>
      </div>

      {/* Success Message */}
      {saved && (
        <div className="p-4 bg-data-teal/20 border border-data-teal rounded-lg">
          <p className="font-inter text-body-sm text-data-teal font-semibold">
            ✓ 설정이 저장되었습니다.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 어린이집 정보 */}
        <GlassCard>
          <h2 className="font-hanken text-headline-md text-on-surface mb-6">
            어린이집 정보
          </h2>

          <div className="space-y-4">
            <Input
              label="어린이집명"
              placeholder="예: 하늘어린이집"
              value={formData.facility_name}
              onChange={(e) => setFormData({ ...formData, facility_name: e.target.value })}
            />

            <Input
              label="주소"
              placeholder="예: 서울시 강남구"
              value={formData.facility_address}
              onChange={(e) => setFormData({ ...formData, facility_address: e.target.value })}
            />

            <Input
              label="원장 이름"
              placeholder="원장 이름"
              value={formData.director_name}
              onChange={(e) => setFormData({ ...formData, director_name: e.target.value })}
            />

            <Input
              label="문의 이메일"
              type="email"
              placeholder="example@email.com"
              value={formData.contact_email}
              onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
            />

            <Input
              label="문의 전화번호"
              placeholder="02-123-4567"
              value={formData.contact_phone}
              onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
            />
          </div>
        </GlassCard>

        {/* 연차 정책 */}
        <GlassCard>
          <h2 className="font-hanken text-headline-md text-on-surface mb-6">
            연차 정책
          </h2>

          <div className="space-y-4">
            <Select
              label="회계연도 시작월"
              options={[
                { value: '1', label: '1월 (달력연도)' },
                { value: '3', label: '3월 (학년도)' },
                { value: '9', label: '9월' },
              ]}
              value={formData.fiscal_year_start}
              onChange={(e) => setFormData({ ...formData, fiscal_year_start: e.target.value })}
            />

            <Input
              label="기본 연차일수"
              type="number"
              min="1"
              value={formData.annual_days_base}
              onChange={(e) => setFormData({ ...formData, annual_days_base: e.target.value })}
            />

            <Input
              label="연차 기준 근속 개월수"
              type="number"
              min="0"
              value={formData.annual_days_threshold}
              onChange={(e) => setFormData({ ...formData, annual_days_threshold: e.target.value })}
            />
          </div>
        </GlassCard>

        {/* 테마 설정 */}
        <GlassCard>
          <h2 className="font-hanken text-headline-md text-on-surface mb-6">
            디스플레이
          </h2>

          <div className="space-y-4">
            <label className="block font-inter text-label-md text-on-surface mb-2">
              테마
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg font-inter text-label-md font-semibold transition-colors ${
                  theme === 'light'
                    ? 'bg-primary text-on-primary'
                    : 'bg-surface-variant text-on-surface hover:bg-surface-variant/80'
                }`}
              >
                <Sun size={18} />
                밝은 모드
              </button>
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg font-inter text-label-md font-semibold transition-colors ${
                  theme === 'dark'
                    ? 'bg-primary text-on-primary'
                    : 'bg-surface-variant text-on-surface hover:bg-surface-variant/80'
                }`}
              >
                <Moon size={18} />
                어두운 모드
              </button>
            </div>
          </div>
        </GlassCard>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-3 bg-primary text-on-primary rounded-lg font-inter text-label-md font-bold btn-glow hover:bg-primary/90 transition-colors"
          >
            <Save size={18} />
            설정 저장
          </button>
        </div>
      </form>
    </div>
  )
}
