'use client'

import { useState, useCallback, useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { Save, UserCog, RotateCcw, Plus, Trash2, CalendarClock, Briefcase, Check, X } from 'lucide-react'
import {
  useStaffStore,
  updateLeaveTiers,
  addPosition,
  removePosition,
  setSubstituteEnabled,
  setSubstituteDefaultDays,
  setSubstituteCustomDays,
  resetSubstituteCustom,
  selectSubstitute,
  CURRENT_YEAR,
} from '@/lib/staff-store'
import type { LeaveTier } from '@/types'

let tierSeq = 0
function newTierId() {
  tierSeq += 1
  return `tier-new-${tierSeq}`
}

export default function SettingsPage() {
  const store = useStaffStore()

  // ===== 연차 기준표 (입사일 기준) =====
  const [tiers, setTiers] = useState<LeaveTier[]>(() =>
    store.leaveTiers.map((t) => ({ ...t }))
  )
  const [tierSaved, setTierSaved] = useState(false)

  const setTierField = useCallback(
    <K extends keyof LeaveTier>(id: string, key: K, value: LeaveTier[K]) => {
      setTiers((prev) => prev.map((t) => (t.id === id ? { ...t, [key]: value } : t)))
      setTierSaved(false)
    },
    []
  )
  const addTier = useCallback(() => {
    setTiers((prev) => [...prev, { id: newTierId(), minYears: 0, days: 11, label: '' }])
    setTierSaved(false)
  }, [])
  const removeTier = useCallback((id: string) => {
    setTiers((prev) => prev.filter((t) => t.id !== id))
    setTierSaved(false)
  }, [])
  const saveTiers = useCallback(() => {
    const sorted = [...tiers].sort((a, b) => a.minYears - b.minYears)
    updateLeaveTiers(sorted)
    setTiers(sorted)
    setTierSaved(true)
  }, [tiers])

  // ===== 직급 관리 =====
  const [newPosition, setNewPosition] = useState('')
  const staffCountByPosition = useMemo(() => {
    const m: Record<string, number> = {}
    store.staff.forEach((s) => {
      if (s.position_id) m[s.position_id] = (m[s.position_id] ?? 0) + 1
    })
    return m
  }, [store.staff])

  const handleAddPosition = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      const name = newPosition.trim()
      if (!name) return
      if (store.positions.some((p) => p.name === name)) {
        setNewPosition('')
        return
      }
      addPosition(name)
      setNewPosition('')
    },
    [newPosition, store.positions]
  )

  const handleRemovePosition = useCallback(
    (id: string, name: string, count: number) => {
      if (count > 0) return // 사용 중이면 삭제 불가 (UI에서도 비활성)
      if (!window.confirm(`'${name}' 직급을 삭제할까요?`)) return
      removePosition(id)
    },
    []
  )

  // ===== 대체교사 지원일 (실제 직원 + 스토어 기반) =====
  const substituteEnabled = store.substituteEnabled
  const substituteDefault = store.substituteDefaultDays

  // 재직 중인 직원만, 입사일순 표시
  const substituteRows = useMemo(() => {
    return store.staff
      .filter((s) => s.status !== '퇴사')
      .map((s) => {
        const view = selectSubstitute(store, s.id, CURRENT_YEAR)
        return {
          staffId: s.id,
          name: s.name,
          photoUrl: s.photo_url,
          totalDays: view.isCustom ? view.total : substituteDefault,
          isCustom: view.isCustom,
          usedDays: view.used,
        }
      })
  }, [store, substituteDefault])

  const customCount = useMemo(
    () => substituteRows.filter((r) => r.isCustom).length,
    [substituteRows]
  )

  return (
    <div className="space-y-8">
      {/* 헤더 */}
      <div>
        <h1 className="text-heading-lg font-bold text-on-surface">기준 설정</h1>
        <p className="mt-1 text-label-md text-on-surface-variant">
          연차 기준표·직급·대체교사 지원일을 관리합니다
        </p>
      </div>

      {/* 섹션 1: 연차 기준표 */}
      <Card>
        <div className="border-b border-border-subtle p-6">
          <div className="flex items-center gap-2">
            <CalendarClock size={20} className="text-primary" />
            <h2 className="text-title-md font-semibold text-on-surface">연차 기준표</h2>
          </div>
          <p className="mt-1 text-label-sm text-on-surface-variant">
            입사일(근속년수) 기준으로 총 연차를 산정하는 표입니다. 수정 시
            <span className="font-semibold text-on-surface"> 올해 총 연차에만 </span>
            자동 반영됩니다. (이전 연도는 기록값 유지)
          </p>
        </div>
        <div className="p-6">
          {/* 헤더 행 */}
          <div className="hidden sm:grid grid-cols-[1fr_140px_120px_48px] gap-3 px-1 pb-2 text-label-sm font-medium text-on-surface-variant">
            <span>구간 명칭</span>
            <span>근속 최소년수</span>
            <span>부여 연차(일)</span>
            <span />
          </div>
          <div className="space-y-2">
            {tiers
              .slice()
              .sort((a, b) => a.minYears - b.minYears)
              .map((t) => (
                <div
                  key={t.id}
                  className="grid grid-cols-1 sm:grid-cols-[1fr_140px_120px_48px] gap-3 items-center rounded-lg bg-surface-container p-3"
                >
                  <input
                    type="text"
                    value={t.label}
                    onChange={(e) => setTierField(t.id, 'label', e.target.value)}
                    placeholder="예: 3~4년"
                    className="rounded-lg border border-border-subtle px-3 py-2 text-label-md bg-surface-white outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      value={t.minYears}
                      onChange={(e) => setTierField(t.id, 'minYears', e.target.valueAsNumber || 0)}
                      className="w-full rounded-lg border border-border-subtle px-3 py-2 text-label-md text-center bg-surface-white outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    <span className="text-label-sm text-on-surface-variant">년~</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      step="0.5"
                      value={t.days}
                      onChange={(e) => setTierField(t.id, 'days', e.target.valueAsNumber || 0)}
                      className="w-full rounded-lg border border-border-subtle px-3 py-2 text-label-md text-center bg-surface-white outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    <span className="text-label-sm text-on-surface-variant">일</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeTier(t.id)}
                    className="justify-self-end p-2 rounded-lg text-on-surface-variant hover:text-error hover:bg-error-container/30 transition-colors"
                    title="구간 삭제"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
          </div>

          <div className="flex items-center justify-between mt-4">
            <button
              type="button"
              onClick={addTier}
              className="flex items-center gap-1.5 text-primary text-label-md font-medium hover:underline"
            >
              <Plus size={16} />
              구간 추가
            </button>
            <button
              type="button"
              onClick={saveTiers}
              className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-label-md font-semibold text-on-primary hover:opacity-90 transition-opacity"
            >
              {tierSaved ? <Check size={18} /> : <Save size={18} />}
              {tierSaved ? '저장됨' : '저장 (올해 연차 반영)'}
            </button>
          </div>
        </div>
      </Card>

      {/* 섹션 2: 직급 관리 */}
      <Card>
        <div className="border-b border-border-subtle p-6">
          <div className="flex items-center gap-2">
            <Briefcase size={20} className="text-primary" />
            <h2 className="text-title-md font-semibold text-on-surface">직급 관리</h2>
          </div>
          <p className="mt-1 text-label-sm text-on-surface-variant">
            직급을 추가하면 직원 등록·수정의 직급 선택에 바로 노출됩니다.
          </p>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex flex-wrap gap-2">
            {store.positions.map((p) => {
              const count = staffCountByPosition[p.id] ?? 0
              const deletable = count === 0
              return (
                <span
                  key={p.id}
                  className="inline-flex items-center gap-2 rounded-full bg-secondary-container px-3 py-1.5 text-label-md text-on-secondary-container"
                >
                  {p.name}
                  <span className="text-[11px] text-on-surface-variant">{count}명</span>
                  <button
                    type="button"
                    onClick={() => handleRemovePosition(p.id, p.name, count)}
                    disabled={!deletable}
                    title={deletable ? '직급 삭제' : '직원이 있어 삭제할 수 없습니다'}
                    className={`-mr-1 rounded-full p-0.5 transition-colors ${
                      deletable
                        ? 'text-on-surface-variant hover:text-error hover:bg-error-container/40'
                        : 'text-outline/40 cursor-not-allowed'
                    }`}
                  >
                    <X size={14} />
                  </button>
                </span>
              )
            })}
          </div>

          <form onSubmit={handleAddPosition} className="flex gap-2 max-w-md">
            <input
              type="text"
              value={newPosition}
              onChange={(e) => setNewPosition(e.target.value)}
              placeholder="새 직급명 (예: 주임교사)"
              className="flex-1 rounded-lg border border-border-subtle px-4 py-2.5 text-label-md bg-surface-white outline-none focus:ring-2 focus:ring-primary/20"
            />
            <button
              type="submit"
              className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-label-md font-medium text-on-primary hover:opacity-90 transition-opacity"
            >
              <Plus size={18} />
              추가
            </button>
          </form>
        </div>
      </Card>

      {/* 섹션 3: 대체교사 지원일 */}
      <Card>
        <div className="border-b border-border-subtle p-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <UserCog size={20} className="text-primary" />
              <h2 className="text-title-md font-semibold text-on-surface">대체교사 지원일</h2>
            </div>
            {/* 활성화 토글 */}
            <button
              type="button"
              role="switch"
              aria-checked={substituteEnabled}
              onClick={() => setSubstituteEnabled(!substituteEnabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                substituteEnabled ? 'bg-primary' : 'bg-outline-variant'
              }`}
              title={substituteEnabled ? '대체교사 지정 사용 중' : '대체교사 지정 꺼짐'}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-surface-white shadow transition-transform ${
                  substituteEnabled ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>
          <p className="mt-1 text-label-sm text-on-surface-variant">
            {substituteEnabled
              ? '연별 지원 일수를 관리합니다. 전체 기준일 변경 시 개인 설정을 제외한 전원에 반영됩니다.'
              : '대체교사 지정 기능이 꺼져 있습니다. 연차 등록 시 대체교사 정보를 입력하지 않습니다.'}
          </p>
        </div>

        {substituteEnabled ? (
          <div className="p-6 space-y-6">
            <div>
              <label className="block text-label-md font-medium text-on-surface mb-2">전체 기준일 (연간)</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  value={substituteDefault}
                  onChange={(e) => setSubstituteDefaultDays(e.target.valueAsNumber)}
                  className="w-28 rounded-lg border border-border-subtle px-4 py-3 text-label-md text-on-surface text-center outline-none focus:ring-2 focus:ring-primary"
                />
                <span className="text-label-md text-on-surface-variant">일 / 년</span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-label-md font-medium text-on-surface">개인별 지원일</label>
                {customCount > 0 ? (
                  <span className="text-label-sm text-primary font-medium">개인 설정 {customCount}명</span>
                ) : null}
              </div>
              <div className="space-y-3">
                {substituteRows.map((row) => {
                  const remaining = row.totalDays - row.usedDays
                  return (
                    <div key={row.staffId} className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-surface-container p-4">
                      <div className="flex items-center gap-3 min-w-[160px]">
                        {row.photoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={row.photoUrl}
                            alt={row.name}
                            className="w-9 h-9 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-primary-container flex items-center justify-center text-on-primary font-bold text-label-sm">
                            {row.name.charAt(0)}
                          </div>
                        )}
                        <div>
                          <p className="text-label-md font-medium text-on-surface flex items-center gap-2">
                            {row.name}
                            {row.isCustom ? (
                              <span className="text-[10px] text-primary bg-primary-container/40 rounded-full px-2 py-0.5">개인설정</span>
                            ) : null}
                          </p>
                          <p className="text-label-sm text-on-surface-variant">사용 {row.usedDays}일 · 잔여 {remaining}일</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={0}
                          value={row.totalDays}
                          onChange={(e) => setSubstituteCustomDays(row.staffId, e.target.valueAsNumber)}
                          className="w-20 rounded-lg border border-border-subtle px-3 py-2 text-label-md text-on-surface text-center outline-none focus:ring-2 focus:ring-primary"
                        />
                        <span className="text-label-md text-on-surface-variant">일</span>
                        {row.isCustom ? (
                          <button
                            type="button"
                            onClick={() => resetSubstituteCustom(row.staffId)}
                            title="전체 기준일로 복귀"
                            className="p-2 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-colors"
                          >
                            <RotateCcw size={16} />
                          </button>
                        ) : null}
                      </div>
                    </div>
                  )
                })}
                {substituteRows.length === 0 ? (
                  <p className="text-label-md text-on-surface-variant py-4 text-center">재직 중인 직원이 없습니다.</p>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}
      </Card>
    </div>
  )
}
