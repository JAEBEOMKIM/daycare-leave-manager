'use client'

import { useCallback, useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { DatePicker } from '@/components/ui/DatePicker'
import {
  X, Building2, Loader2, ShieldCheck, Clock, CircleSlash, ChevronRight,
  Briefcase, LayoutGrid, Users, Baby, GraduationCap, Video, CalendarRange,
} from 'lucide-react'
import {
  approveDaycare, rejectDaycare, suspendDaycare, reactivateDaycare, setValidity,
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

const STATUS: Record<string, { label: string; cls: string; dot: string }> = {
  pending: { label: '승인대기', cls: 'bg-warning-amber/15 text-warning-amber', dot: 'bg-warning-amber' },
  active: { label: '사용중', cls: 'bg-success-green/10 text-success-green', dot: 'bg-success-green' },
  rejected: { label: '반려', cls: 'bg-error-red/10 text-error-red', dot: 'bg-error-red' },
  suspended: { label: '중지', cls: 'bg-surface-container-high text-on-surface-variant', dot: 'bg-outline' },
}

const fmtDate = (v: string | null) => (v ? v.slice(0, 10) : '-')
const fmtDateTime = (v: string | null) => (v ? v.slice(0, 16).replace('T', ' ') : '-')
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

  const onFromChange = useCallback((v: string) => {
    setValidFrom(v)
    setDays((d) => { if (v && d) setValidUntil(addDays(v, Number(d))); return d })
  }, [])
  const onDaysChange = useCallback((raw: string) => {
    const d = raw.replace(/[^0-9]/g, '')
    setDays(d)
    setValidFrom((from) => { if (from && d) setValidUntil(addDays(from, Number(d))); return from })
  }, [])

  const run = useCallback((fn: () => Promise<void>) => {
    startTransition(async () => { await fn(); router.refresh(); setSelected(null) })
  }, [router])

  return (
    <div className="space-y-8">
      {/* 헤더 */}
      <div>
        <h1 className="text-headline-lg font-bold text-on-surface">어린이집 관리</h1>
        <p className="mt-1 text-body-lg text-on-surface-variant">네트워크에 등록된 어린이집을 조회·관리합니다.</p>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="전체 시설" value={daycares.length} icon={<Building2 size={26} />} tile="bg-secondary-container text-primary" />
        <StatCard label="사용중" value={counts['active'] ?? 0} icon={<ShieldCheck size={26} />} tile="bg-success-green/10 text-success-green" />
        <StatCard label="승인대기" value={counts['pending'] ?? 0} icon={<Clock size={26} />} tile="bg-warning-amber/10 text-warning-amber" />
        <StatCard label="중지/반려" value={(counts['suspended'] ?? 0) + (counts['rejected'] ?? 0)} icon={<CircleSlash size={26} />} tile="bg-surface-container-high text-on-surface-variant" />
      </div>

      {/* 테이블 */}
      <div className="bg-surface-white border border-outline-variant rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low border-b border-outline-variant">
                {['어린이집', '유형', '원장', '정원/현원', '상태', '사용기한', ''].map((h, i) => (
                  <th key={i} className={`px-6 py-4 text-label-sm font-semibold text-secondary uppercase tracking-wider ${i === 6 ? 'text-right' : ''}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/40">
              {daycares.map((k) => {
                const st = STATUS[k.status] ?? { label: k.status, cls: '', dot: 'bg-outline' }
                return (
                  <tr key={k.id} onClick={() => open(k)} className="hover:bg-primary/5 cursor-pointer transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                          <Building2 size={20} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-title-md font-semibold text-on-surface truncate">{k.name}</p>
                          <p className="text-label-sm text-on-surface-variant truncate">{k.address ?? '-'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-body-md text-on-surface">{k.facility_type ?? '-'}</td>
                    <td className="px-6 py-4">
                      <p className="text-body-md text-on-surface">{k.directorEmail ?? '-'}</p>
                      <p className="text-label-sm text-on-surface-variant">{fmtDate(k.created_at)} 신청</p>
                    </td>
                    <td className="px-6 py-4 text-body-md text-on-surface">{k.capacity ?? '-'} / {k.current_count ?? '-'}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-label-sm font-semibold ${st.cls}`}>
                        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${st.dot}`} />{st.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-body-md text-on-surface-variant">{k.valid_until ? `~ ${fmtDate(k.valid_until)}` : '-'}</td>
                    <td className="px-6 py-4 text-right">
                      <ChevronRight size={18} className="inline text-on-surface-variant" />
                    </td>
                  </tr>
                )
              })}
              {daycares.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-on-surface-variant">등록된 어린이집이 없습니다.</td></tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      {/* 상세 레이어 팝업 */}
      {selected ? (
        <Modal kg={selected} onClose={close} pending={pending}
          validFrom={validFrom} validUntil={validUntil} days={days} reason={reason}
          onFromChange={onFromChange} onDaysChange={onDaysChange} setValidUntil={setValidUntil} setReason={setReason}
          run={run} />
      ) : null}
    </div>
  )
}

function StatCard({ label, value, icon, tile }: { label: string; value: number; icon: React.ReactNode; tile: string }) {
  return (
    <div className="bg-surface-white border border-outline-variant p-5 rounded-xl flex items-center justify-between shadow-sm">
      <div>
        <p className="text-label-md text-on-surface-variant">{label}</p>
        <p className="text-headline-lg font-bold text-on-surface mt-1">{value}</p>
      </div>
      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${tile}`}>{icon}</div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex justify-between gap-4 py-1">
      <span className="text-label-md text-on-surface-variant shrink-0">{label}</span>
      <span className="text-body-md font-medium text-on-surface text-right break-words">{value || '-'}</span>
    </div>
  )
}
function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-4 rounded-lg bg-surface-container-low border border-outline-variant">
      <p className="text-label-sm text-on-surface-variant">{label}</p>
      <p className="text-headline-sm font-semibold text-on-surface mt-1">{value}</p>
    </div>
  )
}

function Modal({
  kg, onClose, pending, validFrom, validUntil, days, reason,
  onFromChange, onDaysChange, setValidUntil, setReason, run,
}: {
  kg: Kg; onClose: () => void; pending: boolean
  validFrom: string; validUntil: string; days: string; reason: string
  onFromChange: (v: string) => void; onDaysChange: (v: string) => void
  setValidUntil: (v: string) => void; setReason: (v: string) => void
  run: (fn: () => Promise<void>) => void
}) {
  const st = STATUS[kg.status] ?? { label: kg.status, cls: '', dot: 'bg-outline' }
  const util = kg.capacity && kg.capacity > 0 && kg.current_count != null
    ? Math.round((kg.current_count / kg.capacity) * 100) : null

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-inverse-surface/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-surface-white rounded-xl shadow-2xl overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* 헤더 */}
        <header className="flex items-center justify-between px-6 md:px-8 py-5 border-b border-outline-variant bg-surface-container-lowest">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-12 h-12 rounded-lg bg-primary-container flex items-center justify-center text-on-primary-container shrink-0">
              <Building2 size={26} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-3">
                <h3 className="text-headline-md font-bold text-on-surface truncate">{kg.name}</h3>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-label-sm font-semibold shrink-0 ${st.cls}`}>
                  <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${st.dot}`} />{st.label}
                </span>
              </div>
              <p className="text-label-md text-on-surface-variant truncate">{kg.facility_type ?? '-'} · {kg.operation_status ?? '-'} · {kg.stcode ?? kg.id}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-full text-on-surface-variant hover:bg-surface-container-high transition-colors shrink-0"><X size={20} /></button>
        </header>

        {/* 본문 */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-6 md:px-8 py-6 space-y-8">
          {/* 정원/시설 요약 (bento) */}
          <section>
            <h4 className="text-title-md font-semibold text-on-surface mb-4 flex items-center gap-2"><LayoutGrid size={18} className="text-primary" />정원 및 시설</h4>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="col-span-2 p-5 rounded-xl border border-outline-variant bg-surface-white flex flex-col justify-between">
                <span className="text-label-md text-on-surface-variant">충원율 (현원/정원)</span>
                <div className="mt-2">
                  <div className="text-display-lg font-bold text-primary leading-none">{util != null ? `${util}%` : '-'}</div>
                  <div className="w-full bg-surface-container h-2 rounded-full mt-2 overflow-hidden">
                    <div className="bg-primary h-full rounded-full transition-all" style={{ width: `${util ?? 0}%` }} />
                  </div>
                </div>
                <p className="text-label-sm text-on-surface-variant mt-3">정원 {kg.capacity ?? '-'}명 중 현원 {kg.current_count ?? '-'}명</p>
              </div>
              <div className="p-5 rounded-xl bg-secondary-container/30 border border-secondary-container flex flex-col items-center justify-center text-center">
                <GraduationCap size={28} className="text-secondary mb-1.5" />
                <div className="text-headline-md font-bold text-on-secondary-container">{kg.staff_count ?? '-'}</div>
                <p className="text-label-sm text-on-secondary-container">보육교직원</p>
              </div>
              <div className="p-5 rounded-xl bg-tertiary-fixed/30 border border-tertiary-fixed flex flex-col items-center justify-center text-center">
                <Video size={28} className="text-tertiary mb-1.5" />
                <div className="text-headline-md font-bold text-on-tertiary-fixed">{kg.cctv_count ?? '-'}</div>
                <p className="text-label-sm text-on-tertiary-fixed">CCTV</p>
              </div>
            </div>
          </section>

          {/* 정보 2단 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <section className="space-y-4">
              <h4 className="text-title-md font-semibold text-on-surface border-b border-outline-variant pb-3 flex items-center gap-2"><Briefcase size={18} className="text-primary" />기본 정보</h4>
              <div className="space-y-2">
                <InfoRow label="원장 이메일" value={kg.directorEmail} />
                <InfoRow label="사업자등록번호" value={kg.business_no} />
                <InfoRow label="전화번호" value={kg.phone} />
                <InfoRow label="팩스" value={kg.fax} />
                <InfoRow label="우편번호" value={kg.zipcode} />
                <InfoRow label="홈페이지" value={kg.homepage} />
                <div className="flex flex-col py-1">
                  <span className="text-label-md text-on-surface-variant mb-1">주소</span>
                  <span className="text-body-md font-medium text-on-surface leading-relaxed">{kg.address || '-'}</span>
                </div>
                <InfoRow label="신청일" value={fmtDate(kg.created_at)} />
                <InfoRow label="승인/처리일" value={fmtDateTime(kg.approved_at)} />
              </div>
            </section>
            <section className="space-y-4">
              <h4 className="text-title-md font-semibold text-on-surface border-b border-outline-variant pb-3 flex items-center gap-2"><Users size={18} className="text-primary" />상세 수치</h4>
              <div className="grid grid-cols-2 gap-4">
                <Tile label="정원" value={kg.capacity != null ? String(kg.capacity) : '-'} />
                <Tile label="현원" value={kg.current_count != null ? String(kg.current_count) : '-'} />
                <Tile label="보육실수" value={kg.classroom_count != null ? String(kg.classroom_count) : '-'} />
                <Tile label="놀이터수" value={kg.playground_count != null ? String(kg.playground_count) : '-'} />
              </div>
            </section>
          </div>

          {kg.status === 'rejected' && kg.rejected_reason ? (
            <p className="rounded-lg bg-error-red/10 border border-error-red/20 px-4 py-2.5 text-label-md text-error-red">반려 사유: {kg.rejected_reason}</p>
          ) : null}

          {/* 사용기한 from~to */}
          <section>
            <h4 className="text-title-md font-semibold text-on-surface mb-4 flex items-center gap-2"><CalendarRange size={18} className="text-primary" />사용기한 설정</h4>
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
          </section>

          {kg.status === 'pending' ? (
            <div>
              <label className="block text-label-sm text-on-surface-variant mb-1">반려 사유 (반려 시)</label>
              <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="반려 사유를 입력하세요"
                className="w-full h-11 rounded-lg border border-outline-variant px-3 text-body-md outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary" />
            </div>
          ) : null}
        </div>

        {/* 푸터 */}
        <footer className="px-6 md:px-8 py-4 bg-surface-container-low border-t border-outline-variant flex items-center justify-between gap-3">
          <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-lg text-label-md text-on-surface hover:bg-surface-container-high transition-colors">닫기</button>
          <div className="flex items-center gap-3">
            {pending ? <Loader2 size={18} className="animate-spin text-primary" /> : null}
            {kg.status === 'pending' ? (
              <>
                <button type="button" disabled={pending} onClick={() => run(() => rejectDaycare({ id: kg.id, reason }))}
                  className="px-5 py-2.5 rounded-lg border border-error-red text-error-red text-label-md font-semibold hover:bg-error-red/5 disabled:opacity-50 transition-colors">반려</button>
                <button type="button" disabled={pending} onClick={() => run(() => approveDaycare({ id: kg.id, validFrom, validUntil }))}
                  className="px-6 py-2.5 rounded-lg bg-primary text-on-primary text-label-md font-semibold shadow-sm hover:opacity-90 active:scale-[0.98] disabled:opacity-50 transition-all">승인</button>
              </>
            ) : null}
            {kg.status === 'active' ? (
              <>
                <button type="button" disabled={pending} onClick={() => run(() => suspendDaycare(kg.id))}
                  className="px-5 py-2.5 rounded-lg border border-error-red text-error-red text-label-md font-semibold hover:bg-error-red/5 disabled:opacity-50 transition-colors">사용 중지</button>
                <button type="button" disabled={pending} onClick={() => run(() => setValidity({ id: kg.id, validFrom, validUntil }))}
                  className="px-6 py-2.5 rounded-lg bg-primary text-on-primary text-label-md font-semibold shadow-sm hover:opacity-90 active:scale-[0.98] disabled:opacity-50 transition-all">사용기한 저장</button>
              </>
            ) : null}
            {kg.status === 'suspended' || kg.status === 'rejected' ? (
              <button type="button" disabled={pending} onClick={() => run(() => reactivateDaycare({ id: kg.id, validFrom, validUntil }))}
                className="px-6 py-2.5 rounded-lg bg-primary text-on-primary text-label-md font-semibold shadow-sm hover:opacity-90 active:scale-[0.98] disabled:opacity-50 transition-all">사용 재개</button>
            ) : null}
          </div>
        </footer>
      </div>
    </div>
  )
}
