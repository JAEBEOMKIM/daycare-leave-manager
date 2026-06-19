'use client'

import { useCallback, useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { DatePicker } from '@/components/ui/DatePicker'
import { X, Building2, Loader2 } from 'lucide-react'
import {
  approveDaycare,
  rejectDaycare,
  suspendDaycare,
  reactivateDaycare,
  setValidity,
} from './actions'

export interface Kg {
  id: string
  name: string
  business_no: string | null
  phone: string | null
  fax: string | null
  address: string | null
  zipcode: string | null
  homepage: string | null
  facility_type: string | null
  operation_status: string | null
  capacity: number | null
  current_count: number | null
  staff_count: number | null
  cctv_count: number | null
  classroom_count: number | null
  playground_count: number | null
  director_id: string | null
  directorEmail: string | null
  status: string
  active: boolean
  valid_from: string | null
  valid_until: string | null
  approved_at: string | null
  rejected_reason: string | null
  created_at: string
  stcode: string | null
}

const STATUS: Record<string, { label: string; cls: string }> = {
  pending: { label: '승인대기', cls: 'bg-warning-amber/15 text-warning-amber' },
  active: { label: '사용중', cls: 'bg-success-green/10 text-success-green' },
  rejected: { label: '반려', cls: 'bg-error-red/10 text-error-red' },
  suspended: { label: '중지', cls: 'bg-surface-container-high text-on-surface-variant' },
}

function fmtDate(v: string | null) {
  return v ? v.slice(0, 10) : '-'
}
function fmtDateTime(v: string | null) {
  return v ? v.slice(0, 16).replace('T', ' ') : '-'
}
function addDays(iso: string, n: number): string {
  if (!iso || !Number.isFinite(n)) return ''
  const [y, m, d] = iso.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  dt.setDate(dt.getDate() + n)
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`
}

export function AdminDaycaresClient({ daycares }: { daycares: Kg[] }) {
  const router = useRouter()
  const [selected, setSelected] = useState<Kg | null>(null)
  const [validFrom, setValidFrom] = useState('')
  const [validUntil, setValidUntil] = useState('')
  const [days, setDays] = useState('')
  const [reason, setReason] = useState('')
  const [pending, startTransition] = useTransition()

  const counts = useMemo(() => {
    const c: Record<string, number> = {}
    for (const k of daycares) c[k.status] = (c[k.status] ?? 0) + 1
    return c
  }, [daycares])

  const open = useCallback((kg: Kg) => {
    setSelected(kg)
    setValidFrom(kg.valid_from ?? new Date().toISOString().slice(0, 10))
    setValidUntil(kg.valid_until ?? '')
    setDays('')
    setReason('')
  }, [])

  const close = useCallback(() => setSelected(null), [])

  // 시작일 변경 → 기간(일)이 입력돼 있으면 종료일 재계산
  const onFromChange = useCallback((v: string) => {
    setValidFrom(v)
    setDays((d) => {
      if (v && d) setValidUntil(addDays(v, Number(d)))
      return d
    })
  }, [])
  // 기간(일) 입력 → 종료일 = 시작일 + 일수
  const onDaysChange = useCallback((raw: string) => {
    const d = raw.replace(/[^0-9]/g, '')
    setDays(d)
    setValidFrom((from) => {
      if (from && d) setValidUntil(addDays(from, Number(d)))
      return from
    })
  }, [])

  const run = useCallback(
    (fn: () => Promise<void>) => {
      startTransition(async () => {
        await fn()
        router.refresh()
        setSelected(null)
      })
    },
    [router]
  )

  const cell = 'px-4 py-3 text-body-md text-on-surface align-middle'
  const th = 'px-4 py-3 text-label-md font-bold text-on-surface text-left'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-headline-md font-bold text-on-surface">어린이집 관리</h1>
        <p className="mt-1 text-body-md text-on-surface-variant">
          전체 {daycares.length}곳 · 승인대기 {counts['pending'] ?? 0} · 사용중 {counts['active'] ?? 0} · 중지 {counts['suspended'] ?? 0} · 반려 {counts['rejected'] ?? 0}
          <span className="ml-2 text-label-sm">— 행을 클릭하면 신청 정보를 볼 수 있습니다.</span>
        </p>
      </div>

      <div className="bg-surface-white rounded-2xl border border-outline-variant shadow-sm overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-surface-container-low border-b border-outline-variant">
              <th className={th}>어린이집</th>
              <th className={th}>유형</th>
              <th className={th}>원장</th>
              <th className={th}>정원/현원</th>
              <th className={th}>상태</th>
              <th className={th}>사용기한</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant">
            {daycares.map((k) => {
              const st = STATUS[k.status] ?? { label: k.status, cls: '' }
              return (
                <tr key={k.id} onClick={() => open(k)} className="hover:bg-surface-container-low/50 cursor-pointer transition-colors">
                  <td className={cell}>
                    <p className="font-semibold flex items-center gap-2"><Building2 size={15} className="text-primary" />{k.name}</p>
                    <p className="text-label-sm text-on-surface-variant">{k.address ?? '-'}</p>
                  </td>
                  <td className={cell}>{k.facility_type ?? '-'}</td>
                  <td className={cell}>
                    <p>{k.directorEmail ?? '-'}</p>
                    <p className="text-label-sm text-on-surface-variant">{fmtDate(k.created_at)} 신청</p>
                  </td>
                  <td className={cell}>{k.capacity ?? '-'} / {k.current_count ?? '-'}</td>
                  <td className={cell}><span className={`px-2.5 py-1 rounded-full text-label-sm font-bold ${st.cls}`}>{st.label}</span></td>
                  <td className={cell}>{k.valid_until ? `~ ${fmtDate(k.valid_until)}` : '-'}</td>
                </tr>
              )
            })}
            {daycares.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-on-surface-variant">등록된 어린이집이 없습니다.</td></tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {/* 상세 레이어 팝업 */}
      {selected ? (
        <div className="fixed inset-0 z-[9998] flex items-start justify-center overflow-auto bg-black/40 p-4 py-10" onClick={close}>
          <div className="w-full max-w-2xl bg-surface-white rounded-2xl shadow-2xl" onClick={(e) => e.stopPropagation()}>
            {/* 헤더 */}
            <div className="flex items-start justify-between px-6 py-4 border-b border-outline-variant">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-title-lg font-bold text-on-surface">{selected.name}</h3>
                  <span className={`px-2.5 py-0.5 rounded-full text-label-sm font-bold ${(STATUS[selected.status] ?? {cls:''}).cls}`}>
                    {(STATUS[selected.status] ?? { label: selected.status }).label}
                  </span>
                </div>
                <p className="text-label-sm text-on-surface-variant mt-0.5">{selected.facility_type ?? '-'} · {selected.operation_status ?? '-'} · {selected.stcode ?? selected.id}</p>
              </div>
              <button type="button" onClick={close} className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container transition-colors"><X size={18} /></button>
            </div>

            {/* 본문 */}
            <div className="px-6 py-5 space-y-5">
              {/* 신청 정보 */}
              <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-body-md">
                <Field label="원장 이메일" value={selected.directorEmail} />
                <Field label="사업자등록번호" value={selected.business_no} />
                <Field label="전화번호" value={selected.phone} />
                <Field label="팩스" value={selected.fax} />
                <Field label="주소" value={selected.address} span />
                <Field label="우편번호" value={selected.zipcode} />
                <Field label="홈페이지" value={selected.homepage} />
                <Field label="정원 / 현원" value={`${selected.capacity ?? '-'} / ${selected.current_count ?? '-'}`} />
                <Field label="보육교직원" value={selected.staff_count != null ? String(selected.staff_count) : null} />
                <Field label="CCTV" value={selected.cctv_count != null ? String(selected.cctv_count) : null} />
                <Field label="보육실 / 놀이터" value={`${selected.classroom_count ?? '-'} / ${selected.playground_count ?? '-'}`} />
                <Field label="신청일" value={fmtDate(selected.created_at)} />
                <Field label="승인/처리일" value={fmtDateTime(selected.approved_at)} />
              </div>

              {selected.status === 'rejected' && selected.rejected_reason ? (
                <p className="rounded-lg bg-error-red/10 border border-error-red/20 px-3 py-2 text-label-sm text-error-red">반려 사유: {selected.rejected_reason}</p>
              ) : null}

              {/* 사용기한 (from ~ to) */}
              <div className="rounded-xl border border-outline-variant p-4">
                <p className="text-label-md font-semibold text-on-surface mb-3">사용기한 설정</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-label-sm text-on-surface-variant mb-1">시작일</label>
                    <DatePicker value={validFrom} onChange={onFromChange} placeholder="시작일" />
                  </div>
                  <div>
                    <label className="block text-label-sm text-on-surface-variant mb-1">기간(일)</label>
                    <input inputMode="numeric" value={days} onChange={(e) => onDaysChange(e.target.value)} placeholder="예: 365"
                      className="w-full h-11 rounded-lg border border-outline-variant px-3 text-body-md outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary" />
                  </div>
                  <div>
                    <label className="block text-label-sm text-on-surface-variant mb-1">종료일</label>
                    <DatePicker value={validUntil} onChange={setValidUntil} placeholder="종료일" min={validFrom} clearable />
                  </div>
                </div>
                <p className="mt-2 text-label-sm text-on-surface-variant">시작일 선택 후 기간(일)을 입력하면 종료일이 자동 계산됩니다.</p>
              </div>

              {/* 반려 사유 (승인대기 시) */}
              {selected.status === 'pending' ? (
                <div>
                  <label className="block text-label-sm text-on-surface-variant mb-1">반려 사유 (반려 시)</label>
                  <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="반려 사유를 입력하세요"
                    className="w-full h-11 rounded-lg border border-outline-variant px-3 text-body-md outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary" />
                </div>
              ) : null}
            </div>

            {/* 푸터 액션 */}
            <div className="px-6 py-4 border-t border-outline-variant flex flex-wrap items-center justify-end gap-2">
              {pending ? <Loader2 size={18} className="animate-spin text-primary mr-auto" /> : null}
              {selected.status === 'pending' ? (
                <>
                  <button type="button" disabled={pending} onClick={() => run(() => rejectDaycare({ id: selected.id, reason }))}
                    className="px-4 h-10 rounded-lg bg-error-red text-white text-label-md font-semibold disabled:opacity-50">반려</button>
                  <button type="button" disabled={pending} onClick={() => run(() => approveDaycare({ id: selected.id, validFrom, validUntil }))}
                    className="px-5 h-10 rounded-lg bg-success-green text-white text-label-md font-semibold disabled:opacity-50">승인</button>
                </>
              ) : null}
              {selected.status === 'active' ? (
                <>
                  <button type="button" disabled={pending} onClick={() => run(() => suspendDaycare(selected.id))}
                    className="px-4 h-10 rounded-lg border border-outline-variant text-on-surface text-label-md font-semibold hover:bg-surface-container disabled:opacity-50">사용 중지</button>
                  <button type="button" disabled={pending} onClick={() => run(() => setValidity({ id: selected.id, validFrom, validUntil }))}
                    className="px-5 h-10 rounded-lg bg-primary text-on-primary text-label-md font-semibold disabled:opacity-50">사용기한 저장</button>
                </>
              ) : null}
              {selected.status === 'suspended' || selected.status === 'rejected' ? (
                <button type="button" disabled={pending} onClick={() => run(() => reactivateDaycare({ id: selected.id, validFrom, validUntil }))}
                  className="px-5 h-10 rounded-lg bg-primary text-on-primary text-label-md font-semibold disabled:opacity-50">사용 재개</button>
              ) : null}
              <button type="button" onClick={close} className="px-4 h-10 rounded-lg border border-outline-variant text-on-surface-variant text-label-md hover:bg-surface-container">닫기</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function Field({ label, value, span }: { label: string; value: string | null; span?: boolean }) {
  return (
    <div className={span ? 'col-span-2' : ''}>
      <p className="text-label-sm text-on-surface-variant">{label}</p>
      <p className="text-on-surface break-words">{value || '-'}</p>
    </div>
  )
}
