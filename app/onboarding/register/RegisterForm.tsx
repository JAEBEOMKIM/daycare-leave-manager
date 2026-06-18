'use client'

import { useCallback, useMemo, useState, useTransition } from 'react'
import {
  Search,
  Building2,
  Loader2,
  CheckCircle2,
  Users,
  Baby,
  GraduationCap,
  Video,
  Info,
  FileText,
  Headphones,
} from 'lucide-react'
import type { ChildcareItem } from '@/app/api/childcare/search/route'
import { SIGUNGU } from '@/lib/sigungu'
import { registerKindergarten } from './actions'

const SIDO = [
  '서울특별시', '부산광역시', '대구광역시', '인천광역시', '광주광역시', '대전광역시',
  '울산광역시', '세종특별자치시', '경기도', '강원특별자치도', '충청북도', '충청남도',
  '전북특별자치도', '전라남도', '경상북도', '경상남도', '제주특별자치도',
]

const FACILITY_TYPES = ['국공립', '사회복지법인', '법인·단체등', '민간', '가정', '협동', '직장']
const OPERATION_STATUSES = ['정상', '휴지', '폐지']
const onlyDigits = (v: string) => v.replace(/[^0-9]/g, '')
const withCurrent = (list: string[], cur: string) =>
  cur && !list.includes(cur) ? [cur, ...list] : list

const fieldCls =
  'w-full h-11 rounded-lg border border-outline-variant bg-surface-white px-4 text-body-md text-on-surface outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary transition-all'
const labelCls = 'text-label-md font-medium text-on-surface-variant'

// 정원/현원/교직원/CCTV 통계 카드
function StatCard({
  icon, tag, label, name, value, onChange,
}: {
  icon: React.ReactNode
  tag: string
  label: string
  name: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="p-4 bg-surface-white border border-outline-variant rounded-xl focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15 transition-all">
      <div className="flex items-center justify-between mb-2">
        {icon}
        <span className="text-[10px] font-bold text-on-surface-variant tracking-wider uppercase">{tag}</span>
      </div>
      <label className="text-label-sm text-on-surface-variant">{label}</label>
      <input
        name={name}
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(onlyDigits(e.target.value))}
        placeholder="0"
        className="w-full mt-1 p-0 border-none bg-transparent text-headline-md font-bold text-on-surface outline-none focus:ring-0"
      />
    </div>
  )
}

export function RegisterForm({ errorCode }: { errorCode?: string }) {
  // 폼 필드(수정 가능)
  const [name, setName] = useState('')
  const [businessNo, setBusinessNo] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [facilityType, setFacilityType] = useState('')
  const [operationStatus, setOperationStatus] = useState('')
  const [capacity, setCapacity] = useState('')
  const [currentCount, setCurrentCount] = useState('')
  const [staffCount, setStaffCount] = useState('')
  const [cctvCount, setCctvCount] = useState('')
  const [selected, setSelected] = useState<ChildcareItem | null>(null)

  // 검색 상태
  const [sido, setSido] = useState(SIDO[0])
  const regions = useMemo(() => SIGUNGU[sido] ?? [], [sido])
  const [arcode, setArcode] = useState(SIGUNGU[SIDO[0]]?.[0]?.code ?? '')
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<ChildcareItem[]>([])
  const [searchMsg, setSearchMsg] = useState<string | null>(null)
  const [pending, startSearch] = useTransition()

  const onSidoChange = useCallback((value: string) => {
    setSido(value)
    setArcode(SIGUNGU[value]?.[0]?.code ?? '')
    setResults([])
    setSearchMsg(null)
  }, [])

  const runSearch = useCallback(() => {
    setSearchMsg(null)
    startSearch(async () => {
      try {
        const p = new URLSearchParams({ sido, arcode, name: query })
        const res = await fetch(`/api/childcare/search?${p.toString()}`)
        const json = await res.json()
        if (json.configured === false) {
          setResults([])
          setSearchMsg('공공데이터 연동이 아직 설정되지 않았습니다. 아래에 직접 입력해 등록하세요.')
          return
        }
        if (json.error) {
          setResults([])
          setSearchMsg(json.error)
          return
        }
        setResults(json.items as ChildcareItem[])
        if ((json.items as ChildcareItem[]).length === 0) setSearchMsg('검색 결과가 없습니다.')
      } catch {
        setSearchMsg('검색 중 오류가 발생했습니다.')
      }
    })
  }, [sido, arcode, query])

  const choose = useCallback((it: ChildcareItem) => {
    setSelected(it)
    setName(it.name)
    setPhone(it.phone ?? '')
    setAddress(it.address ?? '')
    setFacilityType(it.facility_type ?? '')
    setOperationStatus(it.operation_status ?? '')
    setCapacity(it.capacity != null ? String(it.capacity) : '')
    setCurrentCount(it.current_count != null ? String(it.current_count) : '')
    setStaffCount(it.staff_count != null ? String(it.staff_count) : '')
    setCctvCount(it.cctv_count != null ? String(it.cctv_count) : '')
    setResults([])
    setSearchMsg(null)
  }, [])

  return (
    <>
      {/* 검색 카드 (라벤더) */}
      <section className="bg-secondary-container/30 border border-secondary-container rounded-xl p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Search size={18} className="text-primary" />
          <h3 className="text-title-md font-semibold text-on-secondary-container">어린이집 찾기</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex flex-col gap-1.5 md:col-span-1">
            <label className={labelCls}>지역 (시도 / 시군구)</label>
            <div className="grid grid-cols-2 gap-2">
              <select value={sido} onChange={(e) => onSidoChange(e.target.value)} className={fieldCls}>
                {SIDO.map((s) => (<option key={s} value={s}>{s}</option>))}
              </select>
              <select value={arcode} onChange={(e) => setArcode(e.target.value)} className={fieldCls}>
                {regions.map((r) => (<option key={r.code} value={r.code}>{r.name}</option>))}
              </select>
            </div>
          </div>
          <div className="flex flex-col gap-1.5 md:col-span-2">
            <label className={labelCls}>어린이집명</label>
            <div className="relative">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); runSearch() } }}
                placeholder="어린이집명 일부를 입력 (예: 행복)"
                className={`${fieldCls} pr-24`}
              />
              <button
                type="button"
                onClick={runSearch}
                disabled={pending}
                className="absolute right-1.5 top-1.5 bottom-1.5 px-4 bg-primary text-on-primary rounded-md text-label-md font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 inline-flex items-center gap-1.5"
              >
                {pending ? <Loader2 size={15} className="animate-spin" /> : <Search size={15} />}
                검색
              </button>
            </div>
          </div>
        </div>

        {searchMsg ? <p className="mt-3 text-label-sm text-on-surface-variant">{searchMsg}</p> : null}

        {results.length > 0 ? (
          <ul className="mt-3 max-h-72 overflow-auto divide-y divide-outline-variant rounded-lg border border-outline-variant bg-surface-white">
            {results.map((it, i) => (
              <li key={`${it.stcode ?? it.name}-${i}`}>
                <button type="button" onClick={() => choose(it)} className="w-full text-left px-4 py-3 hover:bg-surface-container-low transition-colors">
                  <div className="flex items-center gap-2">
                    <Building2 size={16} className="text-primary shrink-0" />
                    <span className="font-semibold text-on-surface">{it.name}</span>
                    {it.facility_type ? <span className="text-label-sm text-on-surface-variant">· {it.facility_type}</span> : null}
                  </div>
                  <p className="mt-0.5 text-label-sm text-on-surface-variant truncate">
                    {it.address ?? '-'} {it.phone ? `· ${it.phone}` : ''}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      {/* 성공 배너 */}
      {selected ? (
        <div className="bg-success-green/10 border border-success-green/25 rounded-lg p-4 flex items-center gap-3">
          <CheckCircle2 size={22} className="text-success-green shrink-0" />
          <div>
            <p className="text-label-md font-semibold text-on-surface">정보를 불러왔습니다</p>
            <p className="text-label-sm text-on-surface-variant">
              &ldquo;{selected.name}&rdquo; 정보가 적용되었습니다. 아래에서 확인·수정 후 등록하세요.
            </p>
          </div>
        </div>
      ) : null}

      {errorCode ? (
        <p className="rounded-lg bg-error-red/15 border border-error-red/30 px-4 py-2.5 text-body-sm text-error-red">
          {errorCode === 'name' ? '어린이집 이름을 입력해 주세요.' : '등록 중 오류가 발생했습니다. 다시 시도해 주세요.'}
        </p>
      ) : null}

      {/* 메인 카드 */}
      <form action={registerKindergarten}>
        <input type="hidden" name="standard" value={selected ? JSON.stringify(selected) : ''} />

        <div className="bg-surface-white rounded-xl border border-outline-variant shadow-sm p-6 md:p-8 flex flex-col gap-8">
          {/* 기본 정보 */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-6 bg-primary rounded-full" />
              <h4 className="text-title-lg font-semibold text-on-surface">기본 정보</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <div className="flex flex-col gap-1.5">
                <label className={labelCls}>어린이집 이름 <span className="text-error">*</span></label>
                <input name="name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="예: 구립아이솔 어린이집" className={fieldCls} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={labelCls}>사업자등록번호</label>
                <input name="business_no" value={businessNo} onChange={(e) => setBusinessNo(e.target.value)} placeholder="000-00-00000" className={fieldCls} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={labelCls}>전화번호</label>
                <input name="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="02-000-0000" className={fieldCls} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={labelCls}>어린이집 유형</label>
                <select name="facility_type" value={facilityType} onChange={(e) => setFacilityType(e.target.value)} className={fieldCls}>
                  <option value="">선택</option>
                  {withCurrent(FACILITY_TYPES, facilityType).map((t) => (<option key={t} value={t}>{t}</option>))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5 md:col-span-2">
                <label className={labelCls}>주소</label>
                <input name="address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="시/군/구 ..." className={fieldCls} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={labelCls}>운영현황</label>
                <select name="operation_status" value={operationStatus} onChange={(e) => setOperationStatus(e.target.value)} className={fieldCls}>
                  <option value="">선택</option>
                  {withCurrent(OPERATION_STATUSES, operationStatus).map((s) => (<option key={s} value={s}>{s}</option>))}
                </select>
              </div>
            </div>
          </div>

          {/* 정원 및 시설 */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-6 bg-primary rounded-full" />
              <h4 className="text-title-lg font-semibold text-on-surface">정원 및 시설</h4>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard icon={<Users size={20} className="text-primary" />} tag="정원" label="정원" name="capacity" value={capacity} onChange={setCapacity} />
              <StatCard icon={<Baby size={20} className="text-success-green" />} tag="현원" label="현원" name="current_count" value={currentCount} onChange={setCurrentCount} />
              <StatCard icon={<GraduationCap size={20} className="text-warning-amber" />} tag="교직원" label="보육교직원" name="staff_count" value={staffCount} onChange={setStaffCount} />
              <StatCard icon={<Video size={20} className="text-secondary" />} tag="CCTV" label="CCTV" name="cctv_count" value={cctvCount} onChange={setCctvCount} />
            </div>
          </div>

          {/* 푸터 */}
          <div className="pt-6 border-t border-outline-variant flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-on-surface-variant">
              <Info size={16} />
              <p className="text-label-sm">등록 후 관리자 승인까지 영업일 기준 1~2일 소요될 수 있습니다.</p>
            </div>
            <button type="submit" className="w-full md:w-auto px-6 h-12 bg-primary text-on-primary rounded-lg text-title-md font-semibold shadow-sm hover:opacity-90 active:scale-[0.98] transition-all">
              등록하고 승인 요청
            </button>
          </div>
        </div>
      </form>

      {/* 도움말 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-surface-white border border-outline-variant flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-secondary-container flex items-center justify-center shrink-0">
            <FileText size={22} className="text-primary" />
          </div>
          <div>
            <h5 className="text-label-md font-bold text-on-surface">검색이 안 되나요?</h5>
            <p className="text-body-md text-on-surface-variant mt-0.5">공공데이터에 없으면 위 양식에 직접 입력해 등록할 수 있습니다.</p>
          </div>
        </div>
        <div className="p-4 rounded-xl bg-surface-white border border-outline-variant flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-secondary-container flex items-center justify-center shrink-0">
            <Headphones size={22} className="text-primary" />
          </div>
          <div>
            <h5 className="text-label-md font-bold text-on-surface">도움이 필요하신가요?</h5>
            <p className="text-body-md text-on-surface-variant mt-0.5">등록에 어려움이 있으면 관리자에게 문의해 주세요.</p>
          </div>
        </div>
      </div>
    </>
  )
}
