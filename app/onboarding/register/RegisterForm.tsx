'use client'

import { useCallback, useEffect, useState, useTransition } from 'react'
import { Search, Building2, Loader2, Check } from 'lucide-react'
import type { ChildcareItem } from '@/app/api/childcare/search/route'
import { registerKindergarten } from './actions'

const SIDO = [
  '서울특별시', '부산광역시', '대구광역시', '인천광역시', '광주광역시', '대전광역시',
  '울산광역시', '세종특별자치시', '경기도', '강원특별자치도', '충청북도', '충청남도',
  '전북특별자치도', '전라남도', '경상북도', '경상남도', '제주특별자치도',
]

const inputCls =
  'w-full rounded-lg border border-outline-variant px-4 py-2.5 text-body-md outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary'

export function RegisterForm({ errorCode }: { errorCode?: string }) {
  // 폼 필드(수정 가능)
  const [name, setName] = useState('')
  const [businessNo, setBusinessNo] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  // 검색으로 선택된 표준데이터(나머지 필드 일괄 보관)
  const [selected, setSelected] = useState<ChildcareItem | null>(null)

  // 검색 상태
  const [sido, setSido] = useState(SIDO[0])
  const [regions, setRegions] = useState<{ name: string; arcode: string }[]>([])
  const [arcode, setArcode] = useState('') // 선택된 시군구 5자리 코드
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<ChildcareItem[]>([])
  const [searchMsg, setSearchMsg] = useState<string | null>(null)
  const [pending, startSearch] = useTransition()

  // 시도 변경 시 시군구 목록(cpmsapi020) 로드
  useEffect(() => {
    let active = true
    setRegions([])
    setArcode('')
    fetch(`/api/childcare/search?mode=regions&sido=${encodeURIComponent(sido)}`)
      .then((r) => r.json())
      .then((j) => {
        if (!active) return
        const list = Array.isArray(j.regions) ? (j.regions as { name: string; arcode: string }[]) : []
        setRegions(list)
        if (list.length) setArcode(list[0].arcode)
      })
      .catch(() => {})
    return () => { active = false }
  }, [sido])

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
    setResults([])
    setSearchMsg(null)
  }, [])

  return (
    <>
      {/* 검색 패널 */}
      <section className="mt-6 rounded-xl border border-outline-variant bg-surface-container-low p-5">
        <div className="flex items-center gap-2 mb-3 text-on-surface">
          <Search size={18} className="text-primary" />
          <h2 className="text-title-md font-semibold">어린이집 정보 검색 (공공데이터)</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-[160px_160px_1fr_auto] gap-2">
          <select value={sido} onChange={(e) => setSido(e.target.value)} className={inputCls}>
            {SIDO.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          {regions.length > 0 ? (
            <select value={arcode} onChange={(e) => setArcode(e.target.value)} className={inputCls}>
              {regions.map((r) => (
                <option key={r.arcode} value={r.arcode}>{r.name}</option>
              ))}
            </select>
          ) : (
            <input value={arcode} onChange={(e) => setArcode(e.target.value)} placeholder="시군구 코드 5자리 (예: 11680)" className={inputCls} />
          )}
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); runSearch() } }}
            placeholder="어린이집명 (부분 검색)"
            className={inputCls}
          />
          <button
            type="button"
            onClick={runSearch}
            disabled={pending}
            className="px-5 py-2.5 rounded-lg bg-primary text-on-primary text-label-md font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 inline-flex items-center gap-2 justify-center"
          >
            {pending ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
            검색
          </button>
        </div>

        {searchMsg ? <p className="mt-3 text-body-sm text-on-surface-variant">{searchMsg}</p> : null}

        {results.length > 0 ? (
          <ul className="mt-3 max-h-72 overflow-auto divide-y divide-outline-variant rounded-lg border border-outline-variant bg-surface-white">
            {results.map((it, i) => (
              <li key={`${it.stcode ?? it.name}-${i}`}>
                <button
                  type="button"
                  onClick={() => choose(it)}
                  className="w-full text-left px-4 py-3 hover:bg-surface-container-low transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Building2 size={16} className="text-primary shrink-0" />
                    <span className="font-semibold text-on-surface">{it.name}</span>
                    {it.facility_type ? (
                      <span className="text-label-sm text-on-surface-variant">· {it.facility_type}</span>
                    ) : null}
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

      {/* 등록 폼 */}
      {errorCode ? (
        <p className="mt-4 rounded-lg bg-error-red/15 border border-error-red/30 px-4 py-2 text-body-sm text-error-red">
          {errorCode === 'name' ? '어린이집 이름을 입력해 주세요.' : '등록 중 오류가 발생했습니다. 다시 시도해 주세요.'}
        </p>
      ) : null}

      <form action={registerKindergarten} className="mt-6 space-y-4">
        {/* 선택된 표준데이터 전체를 JSON 으로 전달 */}
        <input type="hidden" name="standard" value={selected ? JSON.stringify(selected) : ''} />

        {selected ? (
          <div className="rounded-lg bg-success-green/10 border border-success-green/30 px-4 py-2.5 text-body-sm text-success-green flex items-center gap-2">
            <Check size={16} /> 공공데이터에서 불러온 정보가 적용되었습니다. 필요 시 아래에서 수정하세요.
          </div>
        ) : null}

        <div>
          <label className="block text-label-md font-medium text-on-surface mb-1">어린이집 이름 <span className="text-error">*</span></label>
          <input name="name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="예: 구립아이솔 어린이집" className={inputCls} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-label-md font-medium text-on-surface mb-1">사업자등록번호</label>
            <input name="business_no" value={businessNo} onChange={(e) => setBusinessNo(e.target.value)} placeholder="000-00-00000" className={inputCls} />
          </div>
          <div>
            <label className="block text-label-md font-medium text-on-surface mb-1">전화번호</label>
            <input name="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="02-000-0000" className={inputCls} />
          </div>
        </div>
        <div>
          <label className="block text-label-md font-medium text-on-surface mb-1">주소</label>
          <input name="address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="시/군/구 ..." className={inputCls} />
        </div>

        {/* 표준데이터 요약(읽기 전용 미리보기) */}
        {selected ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 rounded-lg bg-surface-container-low p-3 text-label-sm text-on-surface-variant">
            <span>유형: {selected.facility_type ?? '-'}</span>
            <span>운영: {selected.operation_status ?? '-'}</span>
            <span>정원: {selected.capacity ?? '-'}</span>
            <span>현원: {selected.current_count ?? '-'}</span>
            <span>교직원: {selected.staff_count ?? '-'}</span>
            <span>CCTV: {selected.cctv_count ?? '-'}</span>
          </div>
        ) : null}

        <button type="submit" className="w-full py-3 rounded-lg bg-primary text-on-primary font-label-md font-semibold hover:opacity-90 transition-opacity">
          등록하고 승인 요청
        </button>
      </form>
    </>
  )
}
