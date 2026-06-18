import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// 응답 필드 → 정규화 키. 어린이집정보공개포털 cpmsapi030 XML 태그(소문자) 우선,
// odcloud/표준데이터 한글명·대문자 별칭도 함께 둠(다른 데이터셋 호환).
const FIELD = {
  sido: ['sidoname', '시도', 'CTPVNM'],
  sigungu: ['sigunname', '시군구', 'SGGNM'],
  name: ['crname', '어린이집명', 'CRNAME', '시설명'],
  type: ['crtypename', '어린이집유형구분', 'CRTYPENM'],
  status: ['crstatusname', '운영현황', 'CRSTATUSNM'],
  zipcode: ['zipcode', '우편번호', 'ZIPCD'],
  address: ['craddr', '주소', '소재지도로명주소', 'CRADDR'],
  phone: ['crtelno', '어린이집전화번호', '전화번호', 'CRTELNO'],
  fax: ['crfaxno', '어린이집팩스번호', '팩스번호', 'CRFAXNO'],
  homepage: ['crhome', '홈페이지주소', '홈페이지', 'CRHOME'],
  capacity: ['crcapat', '정원수', '정원', 'CRCAPAT'],
  current: ['crchcnt', '현원수', '현원', 'CRCHCNT'],
  classroomCount: ['nrtrroomcnt', '보육실수'],
  classroomArea: ['nrtrroomsize', '보육실면적'],
  playgroundCount: ['plgrdco', '놀이터수'],
  cctvCount: ['cctvinstlcnt', 'CCTV설치수', 'CCTV수'],
  staffCount: ['chcrtescnt', '보육교직원수', '교직원수'],
  lat: ['la', '위도', 'LA'],
  lng: ['lo', '경도', 'LO'],
  commute: ['crcargbname', '통학차량운영여부', '통학차량'],
  approvalDate: ['crcnfmdt', '인가일자'],
  restStart: ['crpausebegindt', '휴지시작일자'],
  restEnd: ['crpauseenddt', '휴지종료일자'],
  closeDate: ['crabldt', '폐지일자'],
  stdDate: ['datastdrdt', '데이터기준일자'],
  stcode: ['stcode', '어린이집코드', 'STCODE', '시설코드'],
} as const

// 어린이집정보공개포털 arcode (시도 2자리). cpmsapi030 지역 파라미터.
const SIDO_ARCODE: Record<string, string> = {
  서울특별시: '11', 부산광역시: '26', 대구광역시: '27', 인천광역시: '28',
  광주광역시: '29', 대전광역시: '30', 울산광역시: '31', 세종특별자치시: '36',
  경기도: '41', 강원특별자치도: '42', 충청북도: '43', 충청남도: '44',
  전북특별자치도: '45', 전라남도: '46', 경상북도: '47', 경상남도: '48',
  제주특별자치도: '50',
}

type Row = Record<string, unknown>
const pick = (row: Row, keys: readonly string[]): string | null => {
  for (const k of keys) {
    const v = row[k]
    if (v !== undefined && v !== null && String(v).trim() !== '') return String(v).trim()
  }
  return null
}
const num = (v: string | null): number | null => {
  if (v == null) return null
  const n = Number(v.replace(/[^0-9.-]/g, ''))
  return Number.isFinite(n) ? n : null
}

export interface ChildcareItem {
  name: string
  sido: string | null
  sigungu: string | null
  facility_type: string | null
  operation_status: string | null
  zipcode: string | null
  address: string | null
  phone: string | null
  fax: string | null
  homepage: string | null
  capacity: number | null
  current_count: number | null
  classroom_count: number | null
  classroom_area: number | null
  playground_count: number | null
  cctv_count: number | null
  staff_count: number | null
  latitude: number | null
  longitude: number | null
  commute_vehicle: string | null
  approval_date: string | null
  rest_start_date: string | null
  rest_end_date: string | null
  close_date: string | null
  data_std_date: string | null
  stcode: string | null
}

function normalize(row: Row): ChildcareItem {
  return {
    name: pick(row, FIELD.name) ?? '',
    sido: pick(row, FIELD.sido),
    sigungu: pick(row, FIELD.sigungu),
    facility_type: pick(row, FIELD.type),
    operation_status: pick(row, FIELD.status),
    zipcode: pick(row, FIELD.zipcode),
    address: pick(row, FIELD.address),
    phone: pick(row, FIELD.phone),
    fax: pick(row, FIELD.fax),
    homepage: pick(row, FIELD.homepage),
    capacity: num(pick(row, FIELD.capacity)),
    current_count: num(pick(row, FIELD.current)),
    classroom_count: num(pick(row, FIELD.classroomCount)),
    classroom_area: num(pick(row, FIELD.classroomArea)),
    playground_count: num(pick(row, FIELD.playgroundCount)),
    cctv_count: num(pick(row, FIELD.cctvCount)),
    staff_count: num(pick(row, FIELD.staffCount)),
    latitude: num(pick(row, FIELD.lat)),
    longitude: num(pick(row, FIELD.lng)),
    commute_vehicle: pick(row, FIELD.commute),
    approval_date: pick(row, FIELD.approvalDate),
    rest_start_date: pick(row, FIELD.restStart),
    rest_end_date: pick(row, FIELD.restEnd),
    close_date: pick(row, FIELD.closeDate),
    data_std_date: pick(row, FIELD.stdDate),
    stcode: pick(row, FIELD.stcode),
  }
}

export async function GET(request: NextRequest) {
  // 온보딩 중 로그인 사용자만 사용
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const base = process.env.CHILDCARE_API_URL
  const key = process.env.DATA_GO_KR_SERVICE_KEY
  if (!base || !key) {
    // 키 미설정 시 검색 비활성(수동 입력으로 진행). UI 가 안내.
    return NextResponse.json({ configured: false, items: [] })
  }

  const { searchParams } = request.nextUrl
  const sido = (searchParams.get('sido') ?? '').trim()
  const sigungu = (searchParams.get('sigungu') ?? '').trim()
  const name = (searchParams.get('name') ?? '').trim()
  const debug = searchParams.get('debug') === '1'
  const arcodeParam = (searchParams.get('arcode') ?? '').trim()

  const isChildcare = base.includes('childcare.go.kr')
  const url = new URL(base)

  if (isChildcare) {
    // 어린이집정보공개포털 cpmsapi030: key + arcode(자체 지역코드). 시군구가 숫자면 그대로 arcode 로,
    // 아니면 시도 2자리 코드로 조회 후 시군구/이름은 서버에서 필터.
    url.searchParams.set('key', key)
    const arcode =
      arcodeParam ||
      (/^\d+$/.test(sigungu) ? sigungu : '') ||
      SIDO_ARCODE[sido] ||
      ''
    if (arcode) url.searchParams.set('arcode', arcode)
  } else {
    // odcloud(page/perPage)·apis.data.go.kr(pageNo/numOfRows) 양쪽 관례를 모두 채워 보냄
    url.searchParams.set('serviceKey', key)
    url.searchParams.set('page', '1')
    url.searchParams.set('perPage', '500')
    url.searchParams.set('pageNo', '1')
    url.searchParams.set('numOfRows', '500')
    url.searchParams.set('returnType', 'JSON')
    url.searchParams.set('type', 'json')
    url.searchParams.set('_type', 'json')
    url.searchParams.set('resultType', 'json')
    if (sido) url.searchParams.set('cond[시도::EQ]', sido)
    if (sigungu) url.searchParams.set('cond[시군구::EQ]', sigungu)
  }

  try {
    const res = await fetch(url.toString(), { headers: { Accept: 'application/json, text/xml;q=0.9' } })
    const text = await res.text()

    if (debug) {
      const dRows = extractRows(text)
      return NextResponse.json({
        configured: true,
        requestUrl: url.toString().replace(encodeURIComponent(key), '***').replace(key, '***'),
        status: res.status,
        contentType: res.headers.get('content-type'),
        itemCount: dRows.length,
        sampleNames: dRows.slice(0, 5).map((r) => pick(r, FIELD.name)),
        rawHead: text.slice(0, 800),
      })
    }
    if (!res.ok) {
      return NextResponse.json(
        { configured: true, error: `공공데이터 API 오류 (${res.status})`, items: [] },
        { status: 502 }
      )
    }

    const rows = extractRows(text)
    let items = rows.map(normalize).filter((it) => it.name)
    // 어린이집포털은 arcode 로 이미 지역 한정 → 지역 재필터 생략(시군구명이 코드일 수 있음)
    if (!isChildcare && sido) items = items.filter((it) => !it.sido || it.sido.includes(sido) || sido.includes(it.sido))
    if (!isChildcare && sigungu) items = items.filter((it) => !it.sigungu || it.sigungu.includes(sigungu))
    if (name) {
      const q = name.toLowerCase()
      items = items.filter((it) => it.name.toLowerCase().includes(q))
    }
    return NextResponse.json({ configured: true, items: items.slice(0, 50) })
  } catch {
    return NextResponse.json({ configured: true, error: '검색 중 오류가 발생했습니다.', items: [] }, { status: 502 })
  }
}

// JSON(odcloud: data[] / 공공데이터: response.body.items.item) 또는 XML(<item>…) 에서 레코드 배열 추출
function extractRows(text: string): Row[] {
  const t = text.trim()
  if (t.startsWith('{') || t.startsWith('[')) {
    try {
      const j = JSON.parse(t) as Record<string, unknown>
      const cands: unknown[] = [
        (j as { data?: unknown }).data,
        (j as { items?: unknown }).items,
        ((j as { response?: { body?: { items?: { item?: unknown } } } }).response?.body?.items?.item),
        ((j as { response?: { body?: { items?: unknown } } }).response?.body?.items),
      ]
      for (const c of cands) {
        if (Array.isArray(c)) return c as Row[]
        if (c && typeof c === 'object') return [c as Row]
      }
      // 알 수 없는 엔벨로프: 객체로 이뤄진 첫 배열을 깊이 탐색(서울 .row 등 대응)
      const deep = findFirstObjectArray(j)
      if (deep) return deep
    } catch {
      /* fallthrough to xml */
    }
    return []
  }
  // XML: <item>…</item> 반복을 평탄한 객체로
  const out: Row[] = []
  const items = t.match(/<item>[\s\S]*?<\/item>/g) ?? []
  for (const block of items) {
    const row: Row = {}
    const fields = block.matchAll(/<([A-Za-z0-9_가-힣]+)>([\s\S]*?)<\/\1>/g)
    for (const m of fields) {
      let val = m[2].trim()
      const cd = val.match(/^<!\[CDATA\[([\s\S]*?)\]\]>$/)
      if (cd) val = cd[1].trim()
      row[m[1]] = val
    }
    if (Object.keys(row).length) out.push(row)
  }
  return out
}

// 임의 JSON 구조에서 "객체들의 배열"을 최초로 찾음 (다양한 공공/지자체 API 엔벨로프 대응)
function findFirstObjectArray(node: unknown, depth = 0): Row[] | null {
  if (depth > 6 || node == null || typeof node !== 'object') return null
  if (Array.isArray(node)) {
    if (node.length && typeof node[0] === 'object' && node[0] !== null && !Array.isArray(node[0])) {
      return node as Row[]
    }
    return null
  }
  for (const v of Object.values(node as Record<string, unknown>)) {
    const found = findFirstObjectArray(v, depth + 1)
    if (found) return found
  }
  return null
}
